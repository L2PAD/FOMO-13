import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { UnifiedRatingConfigService } from "./unified-rating-config.service";
import { buildDefaultUnifiedRatingConfig } from "./unified-rating.defaults";
import {
  calculateFundScore,
  calculatePersonScore,
  calculateProjectScore,
  calculateTwitterScore,
  calculateUserScore,
} from "./unified-rating.engine";
import {
  mapFundDoc,
  mapPersonDoc,
  mapProjectDoc,
  mapUserDoc,
} from "./unified-rating.adapters";
import {
  TwitterInput,
  UnifiedRatingConfig,
  UnifiedScoreResult,
  ResilienceCriterion,
} from "./unified-rating.types";

/** Standard resilience criteria used when the crisis catalog has none yet. */
export const DEFAULT_RESILIENCE_CRITERIA: ResilienceCriterion[] = [
  { key: "operationalContinuity", label: "Непрерывность работы", enabled: true, weight: 30, description: "Фонд продолжал операционную деятельность", evidenceType: "operational" },
  { key: "portfolioSurvival", label: "Сохранность портфеля", enabled: true, weight: 25, description: "Доля проектов, переживших период", evidenceType: "portfolio" },
  { key: "noDefaults", label: "Отсутствие дефолтов", enabled: true, weight: 20, description: "Нет критических обязательств и невыплат", evidenceType: "financial" },
  { key: "continuedInvesting", label: "Продолжение инвестиций", enabled: true, weight: 15, description: "Фонд сохранял инвестиционную активность", evidenceType: "activity" },
  { key: "reputationResilience", label: "Репутационная устойчивость", enabled: true, weight: 10, description: "Нет подтверждённых критических инцидентов", evidenceType: "reputation" },
];

/**
 * SINGLE SOURCE OF TRUTH for every rating consumer.
 *
 * The legacy RatingService / FundsRatingService / PersonsRatingService are now
 * thin COMPATIBILITY ADAPTERS that delegate their authoritative score to this
 * service, so a given entity has exactly ONE canonical rating computed by the
 * unified engine with the unified config. No module recomputes an alternative
 * "current" score anymore (see /app/memory/RATING_MIGRATION_MAP.md).
 *
 * The unified config is loaded once and cached synchronously (with a short TTL
 * background refresh) so the legacy synchronous call sites keep working without
 * an invasive sync -> async conversion across the whole codebase.
 */
@Injectable()
export class RatingCanonicalService implements OnModuleInit {
  private cached: UnifiedRatingConfig = buildDefaultUnifiedRatingConfig();
  private resilienceCriteria: ResilienceCriterion[] = DEFAULT_RESILIENCE_CRITERIA;
  private loadedAt = 0;
  private readonly ttlMs = 30_000;

  constructor(
    private readonly configService: UnifiedRatingConfigService,
    @InjectConnection() private readonly connection: Connection
  ) {}

  async onModuleInit(): Promise<void> {
    await this.refresh().catch(() => {
      /* keep defaults until Mongo is ready */
    });
  }

  /** Force-reload the cached unified config (call after a config save). */
  async refresh(): Promise<UnifiedRatingConfig> {
    const snapshot = await this.configService.getSnapshot();
    this.cached = snapshot.config;
    this.resilienceCriteria = await this.loadResilienceCriteria().catch(
      () => DEFAULT_RESILIENCE_CRITERIA
    );
    if (this.cached?.funds) this.cached.funds.resilienceCriteria = this.resilienceCriteria;
    this.loadedAt = Date.now();
    return this.cached;
  }

  /** Public accessor used by the admin API / fund resilience context. */
  getResilienceCriteria(): ResilienceCriterion[] {
    return this.resilienceCriteria;
  }

  /**
   * Aggregate resilience criteria from the ACTIVE crisis catalog. A criterion
   * is included if it is enabled in any active crisis; its weight is the mean
   * of its weights across those crises. Falls back to the standard 5.
   */
  private async loadResilienceCriteria(): Promise<ResilienceCriterion[]> {
    if (!this.connection.db) return DEFAULT_RESILIENCE_CRITERIA;
    const crises = (await this.connection.db
      .collection("rating_crises")
      .find({ enabled: { $ne: false } })
      .toArray()) as any[];
    const acc: Record<string, { c: ResilienceCriterion; weights: number[] }> = {};
    for (const crisis of crises) {
      const list: any[] = Array.isArray(crisis?.criteria) ? crisis.criteria : [];
      for (const cr of list) {
        if (!cr || !cr.key || cr.enabled === false || Number(cr.weight) <= 0) continue;
        if (!acc[cr.key]) acc[cr.key] = { c: { ...cr, enabled: true }, weights: [] };
        acc[cr.key].weights.push(Number(cr.weight));
      }
    }
    const merged = Object.values(acc).map(({ c, weights }) => ({
      ...c,
      weight: weights.reduce((s, w) => s + w, 0) / weights.length,
    }));
    if (!merged.length) return DEFAULT_RESILIENCE_CRITERIA;
    return merged;
  }

  /** Synchronous config getter used by the sync legacy adapters. */
  config(): UnifiedRatingConfig {
    if (Date.now() - this.loadedAt > this.ttlMs) {
      // Fire-and-forget background refresh; return the current cache now.
      void this.refresh().catch(() => undefined);
    }
    return this.cached;
  }

  private inputFor(doc: any, mapper: (doc: any) => any): any {
    const override = doc?.ratingInputsV2;
    if (override && typeof override === "object") return override;
    return mapper(doc);
  }

  scoreFundDoc(doc: any): UnifiedScoreResult {
    const c = this.config();
    return calculateFundScore(this.inputFor(doc, mapFundDoc), c.funds, c.subFormulas);
  }

  scorePersonDoc(doc: any): UnifiedScoreResult {
    const c = this.config();
    return calculatePersonScore(
      this.inputFor(doc, mapPersonDoc),
      c.persons,
      c.twitter,
      c.subFormulas
    );
  }

  scoreProjectDoc(doc: any): UnifiedScoreResult {
    const c = this.config();
    return calculateProjectScore(
      this.inputFor(doc, mapProjectDoc),
      c.projects,
      c.twitter,
      c.subFormulas
    );
  }

  scoreUserDoc(doc: any): UnifiedScoreResult {
    const c = this.config();
    return calculateUserScore(this.inputFor(doc, mapUserDoc), c.users, c.subFormulas);
  }

  scoreTwitter(input: TwitterInput | number): UnifiedScoreResult {
    const c = this.config();
    return calculateTwitterScore(input, c.twitter, c.subFormulas);
  }
}

/**
 * Maps a unified result into the legacy `ScoreResult`-like shape (version,
 * score, flat component contributions, penalties, calculatedAt) that existing
 * consumers destructure. This keeps their contracts intact while the numbers
 * come from the single canonical engine.
 */
export function unifiedToLegacyScoreResult(
  result: UnifiedScoreResult,
  version: string
): {
  version: string;
  score: number;
  components: Record<string, number>;
  penalties: { key: string; value: number; reason: string }[];
  calculatedAt: Date;
} {
  const components: Record<string, number> = {};
  for (const [key, c] of Object.entries(result.components || {})) {
    components[key] = Math.round(Number((c as any)?.contribution ?? 0) * 100) / 100;
  }
  return {
    version,
    score: Math.round(Number(result.score ?? 0) * 100) / 100,
    components,
    penalties: (result.penalties || []).map((p) => ({
      key: p.key,
      value: p.value,
      reason: p.reason,
    })),
    calculatedAt: result.calculatedAt ? new Date(result.calculatedAt) : new Date(),
  };
}
