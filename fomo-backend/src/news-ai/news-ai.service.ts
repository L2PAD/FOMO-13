import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { createHash, randomUUID } from "crypto";
import { NEWS_ARTICLES_CONNECTION } from "../news/models/news-article-source.model";
import { FomoAiGateway } from "../entitlements/ai/fomo-ai-gateway.service";
import { NewsAiEntityExtractor, ExtractedEntities } from "./entity-extractor.service";
import { NewsAiEntityNormalizer } from "./entity-normalizer.service";
import { NewsAiClustering, NewsEvent } from "./news-clustering.service";
import { NewsAiRanking, RankedCluster } from "./news-ranking.service";
import {
  NEWS_AI_OPERATION, NEWS_AI_POLICY_VERSION,
  HEADLINE_PROMPT, SUMMARY_PROMPT, STORY_PROMPT, AI_VIEW_PROMPT,
} from "./news-ai.prompts";

/**
 * NewsAiService — Phase 3 AI synthesis (strict FOMO-DATA parity).
 * Pipeline: raw news_articles -> extract -> normalize -> events -> cluster ->
 * rank -> synthesize (bilingual) via FomoAiGateway (managed credential, COGS,
 * idempotency). Ingestion state is never touched here (state isolation).
 */
@Injectable()
export class NewsAiService {
  private readonly logger = new Logger(NewsAiService.name);

  constructor(
    @InjectModel("news_articles", NEWS_ARTICLES_CONNECTION) private readonly rawModel: Model<any>,
    @InjectModel("generated_news", NEWS_ARTICLES_CONNECTION) private readonly generatedModel: Model<any>,
    @InjectModel("news_ai_runs", NEWS_ARTICLES_CONNECTION) private readonly runModel: Model<any>,
    @InjectModel("ai_global_settings") private readonly settingsModel: Model<any>,
    private readonly extractor: NewsAiEntityExtractor,
    private readonly normalizer: NewsAiEntityNormalizer,
    private readonly clustering: NewsAiClustering,
    private readonly ranking: NewsAiRanking,
    private readonly gateway: FomoAiGateway,
  ) {}

  private getArticleText(a: any): string {
    return [a.title, a.summary, a.content, a.description].filter(Boolean).join(" ");
  }

  // normalize any date-ish field to a real Date (avoid string-date bug class)
  private normalizeDate(a: any): Date {
    for (const v of [a.published_at, a.pubDate, a.created_at, a.createdAt]) {
      if (!v) continue;
      const d = v instanceof Date ? v : new Date(v);
      if (!Number.isNaN(d.getTime())) return d;
    }
    return new Date();
  }

  private detectEventType(text: string, extracted: ExtractedEntities): string {
    const t = (text || "").toLowerCase();
    if (/(raise|funding|investment|series a|series b|seed round)/.test(t)) return "funding";
    if (/(launch|release|mainnet|testnet)/.test(t)) return "launch";
    if (/(partner|collaboration|integrate|join)/.test(t)) return "partnership";
    if (/list/.test(t) && extracted.tokens.length > 0) return "listing";
    if (/(acquire|acquisition|merge)/.test(t)) return "acquisition";
    if (/(sec|regulation|compliance|legal)/.test(t)) return "regulatory";
    return "generic";
  }

  /** Build events from recent raw articles (sorted by insertion recency). */
  private async buildEvents(windowLimit: number): Promise<{ events: NewsEvent[]; rawById: Map<string, any> }> {
    const rows = await this.rawModel.find({}).sort({ _id: -1 }).limit(windowLimit).lean();
    const events: NewsEvent[] = [];
    const rawById = new Map<string, any>();
    for (const a of rows) {
      const text = this.getArticleText(a);
      if (!text || !a.title) continue;
      const extracted = this.extractor.extract(text);
      const normalized = this.normalizer.normalize(extracted);
      const id = String(a._id);
      rawById.set(id, a);
      events.push({
        id,
        title: a.title,
        source: String(a.source_id || a.source_name || "unknown"),
        publishedAt: this.normalizeDate(a),
        type: this.detectEventType(text, extracted),
        entities: normalized.all.map((e) => ({ canonicalId: e.canonicalId, type: e.type, confidence: e.confidence })),
        content: (a.summary || a.content || "").slice(0, 800),
      });
    }
    return { events, rawById };
  }

  private clusterFingerprint(articleIds: string[]): string {
    return createHash("md5").update(articleIds.slice().sort().join("|") + "::" + NEWS_AI_POLICY_VERSION).digest("hex");
  }

  private async callGateway(component: string, lang: string, prompt: string, fingerprint: string) {
    const res: any = await this.gateway.execute({
      userId: "system",
      operation: NEWS_AI_OPERATION,
      billingContext: "SYSTEM",
      input: prompt,
      system: "You are FOMO AI, a professional crypto news synthesizer. Follow the requirements exactly and return only the requested text.",
      idempotencyKey: `gen:${fingerprint}:${component}:${lang}`,
      mode: "CHAT",
    });
    if (!res || res.ok === false) {
      throw new Error(`ai_failed:${component}:${lang}:${res?.errorCode || res?.reason || "unknown"}`);
    }
    // Safety (no fake news): never accept mock/fabricated content into drafts.
    if (res.dataMode === "mock") {
      throw new Error(`ai_mock_rejected:${component}:${lang}: managed provider is not in real mode`);
    }
    return {
      content: String(res.content || "").trim(),
      requestId: res.requestId || null,
      provider: res.provider || null,
      model: res.model || null,
      inputTokens: res.usage?.inputTokens || 0,
      outputTokens: res.usage?.outputTokens || 0,
      totalTokens: res.usage?.totalTokens || 0,
      providerCostUsd: res.cost?.providerCostUsd || 0,
      totalCostUsd: res.cost?.totalCostUsd || 0,
      creditsCharged: res.credits?.captured || 0,
      dataMode: res.dataMode || null,
      duplicate: Boolean(res.duplicate),
    };
  }

  /** Synthesize one cluster into a bilingual GeneratedNews draft. */
  private async synthesizeCluster(cluster: RankedCluster, rawById: Map<string, any>) {
    const clusterEvents = cluster.events.slice().sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    const sourceArticleIds = clusterEvents.map((e) => e.id);
    const sourceRaws = sourceArticleIds.map((id) => rawById.get(id)).filter(Boolean);
    const sourceUrls = [...new Set(sourceRaws.map((r) => r.canonical_url || r.url).filter(Boolean))];
    const sources = sourceRaws.map((r) => ({ name: r.source_name || r.source_id || "", url: r.canonical_url || r.url || "", title: r.title || "" }));

    const assets = [...new Set(
      clusterEvents.flatMap((e) => e.entities.filter((x) => x.type === "token").map((x) => x.canonicalId.toUpperCase())),
    )].slice(0, 8);
    const topic = clusterEvents.map((e) => e.title).sort((a, b) => b.length - a.length)[0] || "";
    const context = clusterEvents.slice(0, 5)
      .map((e, i) => `[#${i + 1}] ${e.title}\n${(e.content || "").slice(0, 400)}`)
      .join("\n\n").slice(0, 2000);
    const eventType = cluster.type || "news";
    const assetsStr = assets.join(", ");
    const fingerprint = this.clusterFingerprint(sourceArticleIds);

    const trace: any = { requestIds: [], provider: null, model: null, inputTokens: 0, outputTokens: 0, totalTokens: 0, providerCostUsd: 0, totalCostUsd: 0, creditsCharged: 0, dataMode: null, calls: 0 };
    const acc = (r: any) => {
      if (r.requestId) trace.requestIds.push(r.requestId);
      trace.provider = r.provider || trace.provider;
      trace.model = r.model || trace.model;
      trace.inputTokens += r.inputTokens; trace.outputTokens += r.outputTokens; trace.totalTokens += r.totalTokens;
      trace.providerCostUsd += r.providerCostUsd; trace.totalCostUsd += r.totalCostUsd; trace.creditsCharged += r.creditsCharged;
      trace.dataMode = r.dataMode || trace.dataMode; trace.calls++;
      return r.content;
    };

    const fill = (tpl: string, vars: Record<string, string>) =>
      Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(v), tpl);

    // EN + RU for each component (parity with donor: 8 calls)
    const headlineEn = acc(await this.callGateway("headline", "en", fill(HEADLINE_PROMPT, { event_type: eventType, topic, assets: assetsStr, language: "English" }), fingerprint)) || topic;
    const headlineRu = acc(await this.callGateway("headline", "ru", fill(HEADLINE_PROMPT, { event_type: eventType, topic, assets: assetsStr, language: "Russian" }), fingerprint)) || headlineEn;
    const summaryEn = acc(await this.callGateway("summary", "en", fill(SUMMARY_PROMPT, { headline: headlineEn, topic, context, language: "English" }), fingerprint)) || headlineEn;
    const summaryRu = acc(await this.callGateway("summary", "ru", fill(SUMMARY_PROMPT, { headline: headlineRu, topic, context, language: "Russian" }), fingerprint)) || summaryEn;
    const storyEn = acc(await this.callGateway("story", "en", fill(STORY_PROMPT, { headline: headlineEn, summary: summaryEn, assets: assetsStr, topic, context, language: "English" }), fingerprint));
    const storyRu = acc(await this.callGateway("story", "ru", fill(STORY_PROMPT, { headline: headlineRu, summary: summaryRu, assets: assetsStr, topic, context, language: "Russian" }), fingerprint)) || storyEn;
    const aiViewEn = acc(await this.callGateway("ai_view", "en", fill(AI_VIEW_PROMPT, { headline: headlineEn, summary: summaryEn, assets: assetsStr, language: "English" }), fingerprint));
    const aiViewRu = acc(await this.callGateway("ai_view", "ru", fill(AI_VIEW_PROMPT, { headline: headlineRu, summary: summaryRu, assets: assetsStr, language: "Russian" }), fingerprint)) || aiViewEn;

    if (!storyEn || !headlineEn) throw new Error("ai_incomplete: missing headline/story");

    const uniqueHash = fingerprint;
    const now = new Date();
    const settings: any = await this.settingsModel.findOne({}).lean().catch(() => null);
    const doc = {
      unique_hash: uniqueHash,
      cluster_id: cluster.id,
      event_type: eventType,
      title_en: headlineEn, title_ru: headlineRu,
      short_en: summaryEn, short_ru: summaryRu,
      extended_en: storyEn, extended_ru: storyRu,
      ai_view_en: aiViewEn, ai_view_ru: aiViewRu,
      assets, entities: cluster.entities, topic,
      sourceArticleIds, sourceUrls, sources,
      rankScore: cluster.rankScore, rankFactors: cluster.rankFactors,
      provider: trace.provider, model: trace.model,
      inputTokens: trace.inputTokens, outputTokens: trace.outputTokens, totalTokens: trace.totalTokens,
      providerCostUsd: Math.round(trace.totalCostUsd * 1e8) / 1e8,
      creditsCharged: trace.creditsCharged,
      dataMode: trace.dataMode,
      gatewayRequestIds: trace.requestIds,
      credentialId: settings?.activeCredentialId || null,
      policyVersion: NEWS_AI_POLICY_VERSION,
      reviewStatus: "draft",
      updatedAt: now,
    };
    // idempotent upsert by unique_hash -> parallel jobs converge to one canonical draft
    await this.generatedModel.updateOne(
      { unique_hash: uniqueHash },
      { $set: doc, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
    return { uniqueHash, trace, sourceArticleIds, sourceUrls, headlineEn };
  }

  /** Main entry: generate drafts for top-ranked clusters. */
  async generate(opts: { windowLimit?: number; maxClusters?: number; minClusterSize?: number } = {}) {
    const windowLimit = Math.min(Math.max(Number(opts.windowLimit) || 120, 1), 500);
    const maxClusters = Math.min(Math.max(Number(opts.maxClusters) || 1, 1), 10);
    const minClusterSize = Math.max(Number(opts.minClusterSize) || 1, 1);
    const correlationId = randomUUID();
    const started = Date.now();
    const run: any = await this.runModel.create({
      correlationId, status: "RUNNING", startedAt: new Date(),
      windowLimit, maxClusters, policyVersion: NEWS_AI_POLICY_VERSION,
    });

    try {
      // Preflight: never call the gateway when the managed provider is not in
      // real mode (prevents mock/fake content AND avoids poisoning idempotency
      // keys with mock-completed events). Retryable once a real credential is active.
      const preSettings: any = await this.settingsModel.findOne({}).lean().catch(() => null);
      if (String(preSettings?.activeProvider || "").toLowerCase() === "mock") {
        throw new Error("provider_not_real: activeProvider=mock (activate a managed real credential in Настройки→AI)");
      }
      const { events, rawById } = await this.buildEvents(windowLimit);
      const clusters = this.ranking.rank(this.clustering.cluster(events));
      const selected = clusters.filter((c) => c.eventCount >= minClusterSize).slice(0, maxClusters);

      const drafts: any[] = [];
      let totalCost = 0, totalTokens = 0, generated = 0, failed = 0;
      const errors: string[] = [];
      for (const cluster of selected) {
        try {
          const r = await this.synthesizeCluster(cluster, rawById);
          drafts.push({ uniqueHash: r.uniqueHash, headline: r.headlineEn, clusterId: cluster.id, sourceArticleIds: r.sourceArticleIds, sourceUrls: r.sourceUrls, trace: r.trace });
          totalCost += r.trace.totalCostUsd; totalTokens += r.trace.totalTokens; generated++;
        } catch (e: any) {
          failed++; errors.push(String(e?.message || e));
          this.logger.warn(`[NewsAI] cluster ${cluster.id} generation failed: ${e?.message || e}`);
        }
      }

      const status = generated > 0 ? "SUCCESS" : (selected.length === 0 ? "SUCCESS" : "FAILED");
      await this.runModel.updateOne({ _id: run._id }, { $set: {
        status, finishedAt: new Date(), durationMs: Date.now() - started,
        eventsBuilt: events.length, clustersFound: clusters.length, clustersSelected: selected.length,
        generated, failed, totalCostUsd: Math.round(totalCost * 1e8) / 1e8, totalTokens,
        errors, drafts,
      } });
      return { ok: generated > 0 || selected.length === 0, correlationId, status,
        eventsBuilt: events.length, clustersFound: clusters.length, clustersSelected: selected.length,
        generated, failed, totalCostUsd: Math.round(totalCost * 1e8) / 1e8, totalTokens, drafts, errors };
    } catch (e: any) {
      await this.runModel.updateOne({ _id: run._id }, { $set: { status: "FAILED", finishedAt: new Date(), durationMs: Date.now() - started, errors: [String(e?.message || e)] } });
      // RETRYABLE: generation failure never fabricates content; caller can retry.
      return { ok: false, correlationId, status: "FAILED", retryable: true, error: String(e?.message || e) };
    }
  }

  async listDrafts(limit = 30) {
    return this.generatedModel.find({}).sort({ createdAt: -1 }).limit(Math.min(limit, 100)).lean();
  }
  async getDraft(uniqueHash: string) {
    return this.generatedModel.findOne({ unique_hash: uniqueHash }).lean();
  }
  async listRuns(limit = 20) {
    return this.runModel.find({}).sort({ startedAt: -1 }).limit(Math.min(limit, 100)).lean();
  }
  async overview() {
    const [drafts, runs, lastRun] = await Promise.all([
      this.generatedModel.countDocuments(),
      this.runModel.countDocuments(),
      this.runModel.find({}).sort({ startedAt: -1 }).limit(1).lean(),
    ]);
    const costAgg = await this.generatedModel.aggregate([
      { $group: { _id: null, cost: { $sum: "$providerCostUsd" }, tokens: { $sum: "$totalTokens" } } },
    ]);
    return {
      drafts, runs,
      lastRun: lastRun[0] || null,
      totalCostUsd: Math.round((costAgg[0]?.cost || 0) * 1e8) / 1e8,
      totalTokens: costAgg[0]?.tokens || 0,
      operation: NEWS_AI_OPERATION, policyVersion: NEWS_AI_POLICY_VERSION,
    };
  }
}
