import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { Model } from "mongoose";
import { createHash } from "crypto";
import { NEWS_ARTICLES_CONNECTION } from "../news/models/news-article-source.model";
import { FomoAiGateway } from "../entitlements/ai/fomo-ai-gateway.service";
import { NewsService } from "../news/news.service";
import { NewsAiEntityExtractor, ExtractedEntities } from "./entity-extractor.service";
import { NewsAiEntityNormalizer } from "./entity-normalizer.service";
import { NewsAiClustering, NewsEvent } from "./news-clustering.service";
import { NewsAiRanking } from "./news-ranking.service";
import {
  NEWS_AI_OPERATION, NEWS_AI_POLICY_VERSION,
  HEADLINE_PROMPT, SUMMARY_PROMPT, STORY_PROMPT, AI_VIEW_PROMPT,
} from "./news-ai.prompts";
import {
  NEWS_AI_QUEUE, NEWS_AI_JOBS, MODERATION, GEN, DEFAULT_SETTINGS,
} from "./news-ai.constants";
import { Types } from "mongoose";

/**
 * NewsAiService — Phase 3 synthesis (FOMO-DATA parity via FomoAiGateway) +
 * Phase 4 operational pipeline: Bull queue execution, budget guard (pre-LLM),
 * moderation lifecycle, publication into canonical News, green/yellow/red trust.
 * Ingestion (parser) and AI are two isolated pipelines.
 */
@Injectable()
export class NewsAiService {
  private readonly logger = new Logger(NewsAiService.name);

  constructor(
    @InjectModel("news_articles", NEWS_ARTICLES_CONNECTION) private readonly rawModel: Model<any>,
    @InjectModel("generated_news", NEWS_ARTICLES_CONNECTION) private readonly generatedModel: Model<any>,
    @InjectModel("news_ai_runs", NEWS_ARTICLES_CONNECTION) private readonly runModel: Model<any>,
    @InjectModel("news_ai_settings", NEWS_ARTICLES_CONNECTION) private readonly settingsModel: Model<any>,
    @InjectModel("ai_global_settings") private readonly aiSettingsModel: Model<any>,
    @InjectModel("ai_usage_events") private readonly usageModel: Model<any>,
    @InjectQueue(NEWS_AI_QUEUE) private readonly queue: Queue,
    private readonly extractor: NewsAiEntityExtractor,
    private readonly normalizer: NewsAiEntityNormalizer,
    private readonly clustering: NewsAiClustering,
    private readonly ranking: NewsAiRanking,
    private readonly gateway: FomoAiGateway,
    private readonly newsService: NewsService,
  ) {}

  // ─────────────── settings ───────────────
  async getSettings(): Promise<any> {
    let s: any = await this.settingsModel.findOne({ _id: "global" }).lean();
    if (!s) {
      await this.settingsModel.updateOne({ _id: "global" }, { $setOnInsert: DEFAULT_SETTINGS }, { upsert: true });
      s = await this.settingsModel.findOne({ _id: "global" }).lean();
    }
    return { ...DEFAULT_SETTINGS, ...s, budget: { ...DEFAULT_SETTINGS.budget, ...(s?.budget || {}) } };
  }
  async updateSettings(patch: any): Promise<any> {
    const cur = await this.getSettings();
    const next: any = { ...cur, ...patch, budget: { ...cur.budget, ...(patch?.budget || {}) } };
    delete next._id;
    await this.settingsModel.updateOne({ _id: "global" }, { $set: next }, { upsert: true });
    return this.getSettings();
  }

  // ─────────────── budget guard (uses ai_usage_events COGS) ───────────────
  private dayStartUtc(): Date { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); }
  private monthStartUtc(): Date { const d = new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); }

  async budgetStatus(): Promise<any> {
    const s = await this.getSettings();
    const b = s.budget;
    const sumCost = async (from: Date) => {
      const agg = await this.usageModel.aggregate([
        { $match: { operationType: NEWS_AI_OPERATION, startedAt: { $gte: from } } },
        { $group: { _id: null, cost: { $sum: "$providerCostUsd" } } },
      ]);
      return Math.round((agg[0]?.cost || 0) * 1e8) / 1e8;
    };
    const todayCogs = await sumCost(this.dayStartUtc());
    const monthCogs = await sumCost(this.monthStartUtc());
    const todayGenerations = await this.generatedModel.countDocuments({ genStatus: GEN.GENERATED, generatedAt: { $gte: this.dayStartUtc() } });
    const pct = Math.max(
      b.dailyCogsLimitUsd ? todayCogs / b.dailyCogsLimitUsd : 0,
      b.monthlyCogsLimitUsd ? monthCogs / b.monthlyCogsLimitUsd : 0,
      b.maxGenerationsPerDay ? todayGenerations / b.maxGenerationsPerDay : 0,
    );
    const limitReached =
      (b.dailyCogsLimitUsd > 0 && todayCogs >= b.dailyCogsLimitUsd) ||
      (b.monthlyCogsLimitUsd > 0 && monthCogs >= b.monthlyCogsLimitUsd) ||
      (b.maxGenerationsPerDay > 0 && todayGenerations >= b.maxGenerationsPerDay);
    const status = limitReached ? "LIMIT_REACHED" : (pct >= (b.warningThresholdPct || 80) / 100 ? "WARNING" : "HEALTHY");
    return { status, todayCogs, monthCogs, todayGenerations, usagePct: Math.round(pct * 100), limits: b };
  }
  async budgetCheck(): Promise<{ allowed: boolean; status: string }> {
    const st = await this.budgetStatus();
    return { allowed: st.status !== "LIMIT_REACHED", status: st.status };
  }

  // ─────────────── pipeline helpers ───────────────
  private getArticleText(a: any): string { return [a.title, a.summary, a.content, a.description].filter(Boolean).join(" "); }
  private normalizeDate(a: any): Date {
    for (const v of [a.published_at, a.pubDate, a.created_at, a.createdAt]) {
      if (!v) continue; const d = v instanceof Date ? v : new Date(v); if (!Number.isNaN(d.getTime())) return d;
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
  private async buildEvents(windowLimit: number): Promise<{ events: NewsEvent[]; rawById: Map<string, any> }> {
    const rows = await this.rawModel.find({}).sort({ _id: -1 }).limit(windowLimit).lean();
    const events: NewsEvent[] = []; const rawById = new Map<string, any>();
    for (const a of rows) {
      const text = this.getArticleText(a); if (!text || !a.title) continue;
      const extracted = this.extractor.extract(text);
      const normalized = this.normalizer.normalize(extracted);
      const id = String(a._id); rawById.set(id, a);
      events.push({
        id, title: a.title, source: String(a.source_id || a.source_name || "unknown"),
        publishedAt: this.normalizeDate(a), type: this.detectEventType(text, extracted),
        entities: normalized.all.map((e) => ({ canonicalId: e.canonicalId, type: e.type, confidence: e.confidence })),
        content: (a.summary || a.content || "").slice(0, 800),
      });
    }
    return { events, rawById };
  }
  private fingerprintOf(articleIds: string[]): string {
    return createHash("md5").update(articleIds.slice().sort().join("|") + "::" + NEWS_AI_POLICY_VERSION).digest("hex");
  }

  async selectClusters(windowLimit: number, maxClusters: number, minSources: number): Promise<Array<{ fingerprint: string; sourceArticleIds: string[]; clusterId: string }>> {
    const { events } = await this.buildEvents(windowLimit);
    const clusters = this.ranking.rank(this.clustering.cluster(events));
    return clusters
      .filter((c) => new Set(c.sources).size >= minSources && c.eventCount >= 1)
      .slice(0, maxClusters)
      .map((c) => { const ids = c.events.map((e) => e.id); return { fingerprint: this.fingerprintOf(ids), sourceArticleIds: ids, clusterId: c.id }; });
  }

  private computeTrust(sourceRaws: any[]): any {
    const independentSources = new Set(sourceRaws.map((r) => String(r.source_id || r.source_name || ""))).size;
    const aiConfidence = Math.min(0.9, 0.5 + independentSources * 0.1);
    const conflicts = 0;
    let color = "RED";
    if (independentSources >= 3 && aiConfidence >= 0.7 && conflicts === 0) color = "GREEN";
    else if (independentSources === 2 && conflicts === 0) color = "YELLOW";
    return { trustColor: color, trustReason: { independentSources, aiConfidence: Math.round(aiConfidence * 100) / 100, sourceTrust: Math.round(Math.min(1, independentSources / 3) * 100) / 100, conflicts } };
  }

  private async callGateway(component: string, lang: string, prompt: string, fingerprint: string) {
    const res: any = await this.gateway.execute({
      userId: "system", operation: NEWS_AI_OPERATION, billingContext: "SYSTEM", input: prompt,
      system: "You are FOMO AI, a professional crypto news synthesizer. Follow the requirements exactly and return only the requested text.",
      idempotencyKey: `gen:${fingerprint}:${component}:${lang}`, mode: "CHAT",
    });
    if (!res || res.ok === false) throw new Error(`ai_failed:${component}:${lang}:${res?.errorCode || res?.reason || "unknown"}`);
    if (res.dataMode === "mock") throw new Error(`ai_mock_rejected:${component}:${lang}`);
    return {
      content: String(res.content || "").trim(), requestId: res.requestId || null, provider: res.provider || null, model: res.model || null,
      inputTokens: res.usage?.inputTokens || 0, outputTokens: res.usage?.outputTokens || 0, totalTokens: res.usage?.totalTokens || 0,
      totalCostUsd: res.cost?.totalCostUsd || 0, creditsCharged: res.credits?.captured || 0, dataMode: res.dataMode || null,
    };
  }

  private async synthesizeSourceSet(sourceRaws: any[], fingerprint: string, clusterId: string): Promise<any> {
    const events = sourceRaws.map((a) => ({
      id: String(a._id), title: a.title || "", entities: this.normalizer.normalize(this.extractor.extract(this.getArticleText(a))).all,
      content: (a.summary || a.content || "").slice(0, 800), publishedAt: this.normalizeDate(a),
      source: String(a.source_id || a.source_name || "unknown"),
    }));
    const sorted = events.slice().sort((x, y) => y.publishedAt.getTime() - x.publishedAt.getTime());
    const sourceArticleIds = sorted.map((e) => e.id);
    const sourceUrls = [...new Set(sourceRaws.map((r) => r.canonical_url || r.url).filter(Boolean))];
    const sources = sourceRaws.map((r) => ({ name: r.source_name || r.source_id || "", url: r.canonical_url || r.url || "", title: r.title || "" }));
    const assets = [...new Set(sorted.flatMap((e) => e.entities.filter((x: any) => x.type === "token").map((x: any) => x.canonicalId.toUpperCase())))].slice(0, 8);
    const entities = [...new Set(sorted.flatMap((e) => e.entities.map((x: any) => x.canonicalId)))];
    const eventType = this.detectEventType(sorted.map((e) => e.title + " " + e.content).join(" "), { tokens: assets } as any);
    const topic = sorted.map((e) => e.title).sort((a, b) => b.length - a.length)[0] || "";
    const context = sorted.slice(0, 5).map((e, i) => `[#${i + 1}] ${e.title}\n${(e.content || "").slice(0, 400)}`).join("\n\n").slice(0, 2000);
    const assetsStr = assets.join(", ");

    const trace: any = { requestIds: [], provider: null, model: null, inputTokens: 0, outputTokens: 0, totalTokens: 0, totalCostUsd: 0, creditsCharged: 0, dataMode: null, calls: 0, components: [] };
    const acc = (comp: string, r: any) => {
      if (r.requestId) trace.requestIds.push(r.requestId);
      trace.provider = r.provider || trace.provider; trace.model = r.model || trace.model;
      trace.inputTokens += r.inputTokens; trace.outputTokens += r.outputTokens; trace.totalTokens += r.totalTokens;
      trace.totalCostUsd += r.totalCostUsd; trace.creditsCharged += r.creditsCharged; trace.dataMode = r.dataMode || trace.dataMode; trace.calls++;
      trace.components.push({ component: comp, requestId: r.requestId, tokens: r.totalTokens, costUsd: Math.round(r.totalCostUsd * 1e8) / 1e8 });
      return r.content;
    };
    const fill = (tpl: string, vars: Record<string, string>) => Object.entries(vars).reduce((s, [k, v]) => s.split(`{${k}}`).join(v), tpl);

    const headlineEn = acc("headline:en", await this.callGateway("headline", "en", fill(HEADLINE_PROMPT, { event_type: eventType, topic, assets: assetsStr, language: "English" }), fingerprint)) || topic;
    const headlineRu = acc("headline:ru", await this.callGateway("headline", "ru", fill(HEADLINE_PROMPT, { event_type: eventType, topic, assets: assetsStr, language: "Russian" }), fingerprint)) || headlineEn;
    const summaryEn = acc("summary:en", await this.callGateway("summary", "en", fill(SUMMARY_PROMPT, { headline: headlineEn, topic, context, language: "English" }), fingerprint)) || headlineEn;
    const summaryRu = acc("summary:ru", await this.callGateway("summary", "ru", fill(SUMMARY_PROMPT, { headline: headlineRu, topic, context, language: "Russian" }), fingerprint)) || summaryEn;
    const storyEn = acc("story:en", await this.callGateway("story", "en", fill(STORY_PROMPT, { headline: headlineEn, summary: summaryEn, assets: assetsStr, topic, context, language: "English" }), fingerprint));
    const storyRu = acc("story:ru", await this.callGateway("story", "ru", fill(STORY_PROMPT, { headline: headlineRu, summary: summaryRu, assets: assetsStr, topic, context, language: "Russian" }), fingerprint)) || storyEn;
    const aiViewEn = acc("ai_view:en", await this.callGateway("ai_view", "en", fill(AI_VIEW_PROMPT, { headline: headlineEn, summary: summaryEn, assets: assetsStr, language: "English" }), fingerprint));
    const aiViewRu = acc("ai_view:ru", await this.callGateway("ai_view", "ru", fill(AI_VIEW_PROMPT, { headline: headlineRu, summary: summaryRu, assets: assetsStr, language: "Russian" }), fingerprint)) || aiViewEn;

    if (!storyEn || !headlineEn) throw new Error("ai_incomplete: missing headline/story");

    const trust = this.computeTrust(sourceRaws);
    const settings: any = await this.aiSettingsModel.findOne({}).lean().catch(() => null);
    const now = new Date();
    const set: any = {
      cluster_id: clusterId, event_type: eventType, topic,
      title_en: headlineEn, title_ru: headlineRu, short_en: summaryEn, short_ru: summaryRu,
      extended_en: storyEn, extended_ru: storyRu, ai_view_en: aiViewEn, ai_view_ru: aiViewRu,
      assets, entities, sourceArticleIds, sourceUrls, sources,
      provider: trace.provider, model: trace.model, inputTokens: trace.inputTokens, outputTokens: trace.outputTokens, totalTokens: trace.totalTokens,
      providerCostUsd: Math.round(trace.totalCostUsd * 1e8) / 1e8, creditsCharged: trace.creditsCharged, dataMode: trace.dataMode,
      gatewayRequestIds: trace.requestIds, componentTrace: trace.components, credentialId: settings?.activeCredentialId || null,
      policyVersion: NEWS_AI_POLICY_VERSION, trustColor: trust.trustColor, trustReason: trust.trustReason,
      genStatus: GEN.GENERATED, generatedAt: now, generationError: null, updatedAt: now,
    };
    const cfg = await this.getSettings();
    const existing: any = await this.generatedModel.findOne({ unique_hash: fingerprint }).lean();
    if (!existing || [GEN.QUEUED, GEN.PROCESSING, GEN.FAILED_RETRYABLE, GEN.PENDING_BUDGET].includes(existing.genStatus)) {
      set.moderationStatus = cfg.autoReview ? MODERATION.NEEDS_REVIEW : MODERATION.AI_READY;
    }
    await this.generatedModel.updateOne({ unique_hash: fingerprint }, { $set: set, $setOnInsert: { unique_hash: fingerprint, createdAt: now } }, { upsert: true });
    return { fingerprint, trace, trustColor: trust.trustColor };
  }

  // ─────────────── queue enqueue + processor ───────────────
  async enqueueGeneration(opts: { windowLimit?: number; maxClusters?: number; minSources?: number } = {}): Promise<any> {
    const s = await this.getSettings();
    const windowLimit = Math.min(Math.max(Number(opts.windowLimit) || s.windowLimit, 1), 500);
    const maxClusters = Math.min(Math.max(Number(opts.maxClusters) || s.maxStoriesPerRun, 1), 20);
    const minSources = Math.max(Number(opts.minSources) || s.minSources, 1);
    const selected = await this.selectClusters(windowLimit, maxClusters, minSources);
    const now = new Date();
    let queued = 0;
    for (const c of selected) {
      const existing: any = await this.generatedModel.findOne({ unique_hash: c.fingerprint }).lean();
      if (existing && existing.genStatus === GEN.GENERATED) continue; // no double generation
      await this.generatedModel.updateOne(
        { unique_hash: c.fingerprint },
        { $set: { genStatus: GEN.QUEUED, cluster_id: c.clusterId, sourceArticleIds: c.sourceArticleIds, updatedAt: now },
          $setOnInsert: { unique_hash: c.fingerprint, createdAt: now, moderationStatus: MODERATION.DRAFT } },
        { upsert: true },
      );
      await this.queue.add(
        NEWS_AI_JOBS.GENERATE,
        { fingerprint: c.fingerprint, sourceArticleIds: c.sourceArticleIds },
        { jobId: `gen:${c.fingerprint}`, attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: 100, removeOnFail: 300 },
      );
      queued++;
    }
    return { ok: true, selected: selected.length, queued, fingerprints: selected.map((c) => c.fingerprint) };
  }

  async processGenerationJob(fingerprint: string, sourceArticleIds: string[]): Promise<any> {
    const budget = await this.budgetCheck();
    if (!budget.allowed) {
      await this.generatedModel.updateOne({ unique_hash: fingerprint }, { $set: { genStatus: GEN.PENDING_BUDGET, updatedAt: new Date() } });
      this.logger.warn(`[NewsAI] budget ${budget.status} -> holding ${fingerprint} (raw preserved, no LLM call)`);
      return { fingerprint, status: GEN.PENDING_BUDGET };
    }
    await this.generatedModel.updateOne({ unique_hash: fingerprint }, { $set: { genStatus: GEN.PROCESSING, updatedAt: new Date() } });
    const raws = await this.loadRaws(sourceArticleIds);
    if (!raws.length) {
      await this.generatedModel.updateOne({ unique_hash: fingerprint }, { $set: { genStatus: GEN.FAILED_RETRYABLE, generationError: "no source articles", updatedAt: new Date() } });
      return { fingerprint, status: GEN.FAILED_RETRYABLE };
    }
    try {
      const doc: any = await this.generatedModel.findOne({ unique_hash: fingerprint }).lean();
      const r = await this.synthesizeSourceSet(raws, fingerprint, doc?.cluster_id || fingerprint);
      return { fingerprint, status: GEN.GENERATED, trustColor: r.trustColor };
    } catch (e: any) {
      await this.generatedModel.updateOne({ unique_hash: fingerprint }, { $set: { genStatus: GEN.FAILED_RETRYABLE, generationError: String(e?.message || e), updatedAt: new Date() } });
      throw e; // retryable via Bull; never fabricates content
    }
  }

  private async loadRaws(ids: string[]): Promise<any[]> {
    const oids = ids.map((id) => { try { return new Types.ObjectId(id); } catch { return null; } }).filter(Boolean) as Types.ObjectId[];
    if (!oids.length) return [];
    return this.rawModel.find({ _id: { $in: oids } }).lean();
  }

  // ─────────────── moderation lifecycle ───────────────
  async listDrafts(limit = 50, status?: string) {
    const q: any = {}; if (status) q.moderationStatus = status;
    return this.generatedModel.find(q).sort({ createdAt: -1 }).limit(Math.min(limit, 200)).lean();
  }
  async getDraft(hash: string) { return this.generatedModel.findOne({ unique_hash: hash }).lean(); }

  async editDraft(hash: string, editorial: any, actor: string) {
    const g: any = await this.generatedModel.findOne({ unique_hash: hash }).lean();
    if (!g) throw new BadRequestException("draft not found");
    const now = new Date();
    await this.generatedModel.updateOne({ unique_hash: hash }, {
      $set: { editorial: { ...(g.editorial || {}), ...editorial }, updatedAt: now,
        moderationStatus: g.moderationStatus === MODERATION.PUBLISHED ? MODERATION.PUBLISHED : MODERATION.NEEDS_REVIEW },
      $push: { revisions: { at: now, by: actor, editorial: g.editorial || null } },
    });
    return this.getDraft(hash);
  }
  async setModeration(hash: string, status: string, actor: string) {
    await this.generatedModel.updateOne({ unique_hash: hash }, { $set: { moderationStatus: status, moderatedBy: actor, moderatedAt: new Date() } });
    return this.getDraft(hash);
  }
  async approve(hash: string, actor: string) { return this.setModeration(hash, MODERATION.APPROVED, actor); }
  async reject(hash: string, actor: string) { return this.setModeration(hash, MODERATION.REJECTED, actor); }
  async regenerate(hash: string) {
    const g: any = await this.generatedModel.findOne({ unique_hash: hash }).lean();
    if (!g) throw new BadRequestException("draft not found");
    await this.generatedModel.updateOne({ unique_hash: hash }, { $set: { genStatus: GEN.QUEUED, updatedAt: new Date() } });
    await this.queue.add(NEWS_AI_JOBS.GENERATE, { fingerprint: hash, sourceArticleIds: g.sourceArticleIds || [] },
      { jobId: `gen:${hash}:${Date.now()}`, attempts: 3, backoff: { type: "exponential", delay: 5000 }, removeOnComplete: 100, removeOnFail: 300 });
    return { ok: true };
  }

  async publish(hash: string, actor: string) {
    const g: any = await this.generatedModel.findOne({ unique_hash: hash }).lean();
    if (!g) throw new BadRequestException("draft not found");
    if (g.genStatus !== GEN.GENERATED) throw new BadRequestException("draft is not GENERATED");
    const res = await this.newsService.publishGeneratedNews(g); // idempotent upsert
    await this.generatedModel.updateOne({ unique_hash: hash }, { $set: { moderationStatus: MODERATION.PUBLISHED, publishedNewsId: res.newsId, publishedAt: new Date(), publishedBy: actor } });
    return { ok: true, newsId: res.newsId, created: res.created };
  }
  async unpublish(hash: string, actor: string) {
    await this.newsService.unpublishGeneratedNews(hash);
    await this.generatedModel.updateOne({ unique_hash: hash }, { $set: { moderationStatus: MODERATION.ARCHIVED, archivedBy: actor, archivedAt: new Date() } });
    return { ok: true };
  }

  // ─────────────── runs + overview ───────────────
  async listRuns(limit = 20) { return this.runModel.find({}).sort({ startedAt: -1 }).limit(Math.min(limit, 100)).lean(); }
  async overview() {
    const [drafts, budget] = await Promise.all([this.generatedModel.countDocuments(), this.budgetStatus()]);
    const byMod = await this.generatedModel.aggregate([{ $group: { _id: "$moderationStatus", n: { $sum: 1 } } }]);
    const byGen = await this.generatedModel.aggregate([{ $group: { _id: "$genStatus", n: { $sum: 1 } } }]);
    const costAgg = await this.generatedModel.aggregate([{ $group: { _id: null, cost: { $sum: "$providerCostUsd" }, tokens: { $sum: "$totalTokens" } } }]);
    const queueCounts = await this.queue.getJobCounts().catch(() => ({} as any));
    return {
      drafts, operation: NEWS_AI_OPERATION, policyVersion: NEWS_AI_POLICY_VERSION,
      totalCostUsd: Math.round((costAgg[0]?.cost || 0) * 1e8) / 1e8, totalTokens: costAgg[0]?.tokens || 0,
      byModeration: Object.fromEntries(byMod.map((x: any) => [x._id || "NONE", x.n])),
      byGenStatus: Object.fromEntries(byGen.map((x: any) => [x._id || "NONE", x.n])),
      budget, queue: queueCounts,
    };
  }
}
