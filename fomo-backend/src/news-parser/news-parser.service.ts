import { Injectable, Logger, OnModuleInit, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { Model } from "mongoose";
import { randomUUID } from "crypto";
import { NEWS_ARTICLES_CONNECTION } from "../news/models/news-article-source.model";
import { NewsService } from "../news/news.service";
import { NewsFetcherService } from "./news-fetcher.service";
import { NewsSource, NewsSourceDocument } from "./models/news-source.model";
import {
  NewsParserRun,
  NewsParserRunDocument,
} from "./models/news-parser-run.model";
import { NewsArticleRaw, NewsArticleRawDocument } from "./models/news-article-raw.model";
import { NEWS_SOURCES } from "./news-sources.catalog";
import {
  NEWS_PARSER_DEFAULTS,
  NEWS_PARSER_JOBS,
  NEWS_PARSER_QUEUE,
} from "./news-parser.constants";

@Injectable()
export class NewsParserService implements OnModuleInit {
  private readonly logger = new Logger(NewsParserService.name);

  constructor(
    @InjectModel(NewsSource.name, NEWS_ARTICLES_CONNECTION)
    private readonly sourceModel: Model<NewsSourceDocument>,
    @InjectModel(NewsParserRun.name, NEWS_ARTICLES_CONNECTION)
    private readonly runModel: Model<NewsParserRunDocument>,
    @InjectModel(NewsArticleRaw.name, NEWS_ARTICLES_CONNECTION)
    private readonly rawModel: Model<NewsArticleRawDocument>,
    @InjectQueue(NEWS_PARSER_QUEUE) private readonly queue: Queue,
    private readonly fetcher: NewsFetcherService,
    private readonly newsService: NewsService
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.seedSources();
    } catch (e: any) {
      this.logger.warn(`[NewsParser] seed skipped: ${e?.message || e}`);
    }
    try {
      const n = await this.recoverStaleRuns();
      if (n) this.logger.log(`[NewsParser] recovered ${n} stale RUNNING run(s) after restart`);
    } catch (e: any) {
      this.logger.warn(`[NewsParser] stale-run recovery skipped: ${e?.message || e}`);
    }
  }

  // Restart recovery (P3.13/acceptance): hung RUNNING runs must not stay forever.
  async recoverStaleRuns(maxAgeMinutes = 10): Promise<number> {
    const cutoff = new Date(Date.now() - maxAgeMinutes * 60000);
    const res = await this.runModel.updateMany(
      { status: "RUNNING", startedAt: { $lt: cutoff } },
      {
        $set: {
          status: "FAILED",
          finishedAt: new Date(),
          errorCode: "ABANDONED",
          errorMessage: "Run abandoned (worker/backend restart) — auto-recovered",
        },
      }
    );
    return (res as any).modifiedCount || 0;
  }

  // —— P1: seed managed source registry from donor catalog (idempotent) ——
  async seedSources(): Promise<{ inserted: number; total: number }> {
    let inserted = 0;
    for (const s of NEWS_SOURCES) {
      const interval =
        NEWS_PARSER_DEFAULTS.tierIntervalMinutes[s.tier] ||
        Math.round((s.refresh_interval_sec || 1800) / 60);
      const res = await this.sourceModel.updateOne(
        { id: s.id },
        {
          $setOnInsert: {
            id: s.id,
            name: s.name,
            slug: s.id,
            sourceType: "RSS",
            url: `https://${s.domain}`,
            feedUrl: s.rss_url,
            language: s.language,
            tier: s.tier,
            region: s.region,
            isOfficial: s.is_official,
            trustLevel: Math.min(1, s.source_weight || 0.7),
            status: s.is_active ? "ACTIVE" : "DISABLED",
            parserKey: "rss.generic",
            parserVersion: 1,
            pollingIntervalMinutes: interval,
            timeoutMs: NEWS_PARSER_DEFAULTS.timeoutMs,
            maxRetries: NEWS_PARSER_DEFAULTS.maxRetries,
            aiEnabled: true,
            categories: [],
            consecutiveFailures: 0,
            nextRunAt: new Date(),
          },
        },
        { upsert: true }
      );
      if ((res as any).upsertedCount) inserted++;
    }
    const total = await this.sourceModel.countDocuments();
    this.logger.log(`[NewsParser] seed done: +${inserted}, total=${total}`);
    return { inserted, total };
  }

  // —— global control (P26) ——
  private globalColl() {
    return this.sourceModel.db.collection("news_parser_settings");
  }
  async getGlobal(): Promise<any> {
    const doc = await this.globalColl().findOne({ _id: "global" as any });
    return { paused: Boolean(doc?.paused), schedulerEnabled: true };
  }
  async setGlobalPaused(paused: boolean): Promise<any> {
    await this.globalColl().updateOne(
      { _id: "global" as any },
      { $set: { paused, updatedAt: new Date() } },
      { upsert: true }
    );
    return this.getGlobal();
  }

  // —— registry CRUD ——
  async listSources(filter: { tier?: string; status?: string; q?: string } = {}) {
    const query: any = {};
    if (filter.tier) query.tier = filter.tier;
    if (filter.status) query.status = filter.status;
    if (filter.q) query.name = { $regex: filter.q, $options: "i" };
    return this.sourceModel.find(query).sort({ tier: 1, name: 1 }).lean();
  }
  async getSource(id: string) {
    const s = await this.sourceModel.findOne({ id }).lean();
    if (!s) throw new NotFoundException(`Source not found: ${id}`);
    return s;
  }
  async createSource(body: any) {
    const id = String(body.id || body.slug || body.name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (!id || !body.feedUrl) throw new NotFoundException("id and feedUrl are required");
    await this.sourceModel.updateOne(
      { id },
      {
        $set: {
          id,
          name: body.name || id,
          slug: id,
          sourceType: body.sourceType || "RSS",
          url: body.url || "",
          feedUrl: body.feedUrl,
          language: body.language || "en",
          tier: body.tier || "C",
          status: body.status || "ACTIVE",
          pollingIntervalMinutes:
            Number(body.pollingIntervalMinutes) ||
            NEWS_PARSER_DEFAULTS.tierIntervalMinutes[body.tier || "C"] || 60,
          aiEnabled: body.aiEnabled !== false,
        },
        $setOnInsert: { consecutiveFailures: 0, parserVersion: 1, nextRunAt: new Date() },
      },
      { upsert: true }
    );
    return this.getSource(id);
  }
  async updateSource(id: string, patch: any) {
    const allowed = [
      "name", "tier", "language", "feedUrl", "url", "status", "categories",
      "pollingIntervalMinutes", "timeoutMs", "maxRetries", "aiEnabled",
      "trustLevel", "priority", "sourceType",
    ];
    const set: any = {};
    for (const k of allowed) if (patch[k] !== undefined) set[k] = patch[k];
    if (Object.keys(set).length === 0) return this.getSource(id);
    // any config change bumps parserVersion (P48)
    const bumpsVersion = ["feedUrl", "parserKey", "tier", "pollingIntervalMinutes"].some(
      (k) => patch[k] !== undefined
    );
    const update: any = { $set: set };
    if (bumpsVersion) update.$inc = { parserVersion: 1 };
    const res = await this.sourceModel.updateOne({ id }, update);
    if (!res.matchedCount) throw new NotFoundException(`Source not found: ${id}`);
    return this.getSource(id);
  }
  async deleteSource(id: string) {
    await this.sourceModel.deleteOne({ id });
    return { ok: true, id };
  }
  async setSourceStatus(id: string, status: string) {
    return this.updateSource(id, { status });
  }

  // —— enqueue (P25: run all/tier go through the queue) ——
  async enqueueSource(id: string, trigger: "manual" | "schedule", requestedBy?: string, limit?: number) {
    await this.getSource(id);
    await this.queue.add(
      NEWS_PARSER_JOBS.POLL_SOURCE,
      { sourceId: id, trigger, requestedBy, limit },
      { removeOnComplete: 200, removeOnFail: 100, attempts: 1 }
    );
    return { ok: true, queued: id };
  }
  async enqueueTier(tier: "A" | "B" | "C", requestedBy?: string) {
    const sources = await this.sourceModel.find({ tier, status: "ACTIVE" }).select("id").lean();
    for (const s of sources) await this.enqueueSource(s.id, "manual", requestedBy);
    return { ok: true, tier, queued: sources.length };
  }
  async enqueueAll(requestedBy?: string) {
    const sources = await this.sourceModel.find({ status: "ACTIVE" }).select("id").lean();
    for (const s of sources) await this.enqueueSource(s.id, "manual", requestedBy);
    return { ok: true, queued: sources.length };
  }

  // —— core execution (used by processor + scheduler) ——
  async runSource(
    sourceId: string,
    opts: { trigger?: "manual" | "schedule"; limit?: number; requestedBy?: string; workerId?: string } = {}
  ): Promise<any> {
    const source: any = await this.sourceModel.findOne({ id: sourceId }).lean();
    if (!source) throw new NotFoundException(`Source not found: ${sourceId}`);
    const started = Date.now();
    const correlationId = randomUUID();
    const run = await this.runModel.create({
      sourceId: source.id,
      sourceName: source.name,
      correlationId,
      trigger: opts.trigger || "schedule",
      requestedBy: opts.requestedBy,
      startedAt: new Date(),
      status: "RUNNING",
      workerId: opts.workerId,
    });
    // advance nextRunAt immediately so scheduler doesn't double-fire
    const intervalMs = Number(source.pollingIntervalMinutes || 60) * 60000;
    await this.sourceModel.updateOne(
      { id: source.id },
      { $set: { lastRunAt: new Date(), nextRunAt: new Date(Date.now() + intervalMs) } }
    );

    const result = await this.fetcher.fetch(
      { id: source.id, name: source.name, feedUrl: source.feedUrl, language: source.language },
      { limit: opts.limit ?? NEWS_PARSER_DEFAULTS.limit, timeoutMs: source.timeoutMs, maxRetries: source.maxRetries }
    );

    if (!result.ok) {
      // P7 circuit breaker
      const failures = Number(source.consecutiveFailures || 0) + 1;
      const status = failures >= NEWS_PARSER_DEFAULTS.circuitBreakerThreshold ? "ERROR" : source.status;
      await this.sourceModel.updateOne(
        { id: source.id },
        { $set: { consecutiveFailures: failures, lastError: result.errorMessage, status } }
      );
      await this.runModel.updateOne(
        { _id: run._id },
        {
          $set: {
            status: "FAILED",
            finishedAt: new Date(),
            durationMs: Date.now() - started,
            retryCount: result.retryCount,
            errorCode: result.errorCode,
            errorMessage: result.errorMessage,
          },
        }
      );
      return { source: source.id, status: "FAILED", error: result.errorMessage };
    }

    // persist raw articles into news_articles with multi-layer dedupe (P9)
    let newItems = 0;
    let duplicates = 0;
    let failed = 0;
    for (const a of result.articles) {
      try {
        const exists = await this.rawModel.findOne({
          $or: [
            { id: a.id },
            { canonical_url: a.canonical_url },
            { content_hash: a.content_hash },
            { normalized_title: a.normalized_title, source_id: a.source_id },
          ],
        }).select("_id").lean();
        if (exists) { duplicates++; continue; }
        await this.rawModel.create({
          ...a,
          fetched_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          createdAt: new Date(),
          ingest_status: "raw",
          parser_version: source.parserVersion || 1,
        } as any);
        newItems++;
      } catch (e: any) {
        failed++;
      }
    }

    await this.sourceModel.updateOne(
      { id: source.id },
      {
        $set: {
          consecutiveFailures: 0,
          lastError: "",
          status: source.status === "ERROR" ? "ACTIVE" : source.status,
          lastSuccessAt: new Date(),
          lastArticleAt: newItems > 0 ? new Date() : source.lastArticleAt,
          lastFetched: result.itemCount,
          lastNew: newItems,
          lastDuplicates: duplicates,
        },
        $inc: { totalArticles: newItems },
      }
    );

    const status = failed > 0 && newItems === 0 ? "PARTIAL" : "SUCCESS";
    await this.runModel.updateOne(
      { _id: run._id },
      {
        $set: {
          status,
          finishedAt: new Date(),
          durationMs: Date.now() - started,
          retryCount: result.retryCount,
          fetchedItems: result.itemCount,
          parsedItems: result.articles.length,
          newItems,
          duplicates,
          failed,
        },
      }
    );

    // reuse existing importer: news_articles -> canonical News (EN website)
    if (newItems > 0) {
      try {
        await this.newsService.syncNewsFromArticlesCollection(Math.min(newItems + 5, 100));
      } catch (e: any) {
        this.logger.warn(`[NewsParser] import to News failed (non-fatal): ${e?.message || e}`);
      }
    }

    return { source: source.id, status, fetched: result.itemCount, new: newItems, duplicates, failed };
  }

  // —— backfill importer (ops): drain un-imported raw -> canonical News ——
  // Fresh articles auto-import after each successful run (newItems>0). This
  // endpoint drains any historical backlog that accumulated before the import
  // ordering fix, in batches, until nothing new is saved.
  async backfillImport(maxBatches = 20): Promise<any> {
    const total = { batches: 0, candidates: 0, saved: 0, duplicates: 0, invalid: 0, failed: 0 };
    for (let i = 0; i < Math.min(Math.max(maxBatches, 1), 60); i++) {
      const r = await this.newsService.syncNewsFromArticlesCollection(200);
      total.batches++;
      total.candidates += r.candidates;
      total.saved += r.saved;
      total.duplicates += r.duplicates;
      total.invalid += (r as any).invalid || 0;
      total.failed += r.failed;
      if (r.candidates === 0) break; // fully drained
    }
    return total;
  }

  // —— dry test (P34): fetch, no persist ——
  async testSource(id: string) {
    const source: any = await this.sourceModel.findOne({ id }).lean();
    if (!source) throw new NotFoundException(`Source not found: ${id}`);
    const r = await this.fetcher.fetch(
      { id: source.id, name: source.name, feedUrl: source.feedUrl, language: source.language },
      { limit: 5, timeoutMs: source.timeoutMs, maxRetries: 1 }
    );
    return {
      ok: r.ok,
      feedOk: r.ok,
      itemsFound: r.itemCount,
      latencyMs: r.latencyMs,
      latest: r.articles[0]
        ? { title: r.articles[0].title, published_at: r.articles[0].published_at, url: r.articles[0].url }
        : null,
      fieldsOk: r.articles[0] ? Boolean(r.articles[0].title && r.articles[0].url) : false,
      error: r.errorMessage,
    };
  }

  // —— runs history (P24) ——
  async listRuns(limit = 30, sourceId?: string) {
    const q: any = {};
    if (sourceId) q.sourceId = sourceId;
    return this.runModel.find(q).sort({ startedAt: -1 }).limit(Math.min(limit, 200)).lean();
  }
  async getRun(id: string) {
    const r = await this.runModel.findById(id).lean();
    if (!r) throw new NotFoundException("Run not found");
    return r;
  }

  // —— overview + stats (P21/P28/P31) ——
  async overview() {
    const now = Date.now();
    const [total, active, errored, paused, disabled, articles, global] = await Promise.all([
      this.sourceModel.countDocuments(),
      this.sourceModel.countDocuments({ status: "ACTIVE" }),
      this.sourceModel.countDocuments({ status: "ERROR" }),
      this.sourceModel.countDocuments({ status: "PAUSED" }),
      this.sourceModel.countDocuments({ status: "DISABLED" }),
      this.rawModel.estimatedDocumentCount(),
      this.getGlobal(),
    ]);
    const since = new Date(now - 24 * 3600 * 1000);
    const runs24 = await this.runModel.find({ startedAt: { $gte: since } }).lean();
    const fetched24 = runs24.reduce((s, r: any) => s + (r.fetchedItems || 0), 0);
    const new24 = runs24.reduce((s, r: any) => s + (r.newItems || 0), 0);
    const dup24 = runs24.reduce((s, r: any) => s + (r.duplicates || 0), 0);
    const failed24 = runs24.filter((r: any) => r.status === "FAILED").length;
    const lastSuccess = await this.sourceModel
      .find({ lastSuccessAt: { $ne: null } })
      .sort({ lastSuccessAt: -1 })
      .select("lastSuccessAt")
      .limit(1)
      .lean();
    const successRate = runs24.length
      ? Math.round((runs24.filter((r: any) => r.status === "SUCCESS").length / runs24.length) * 100)
      : null;
    const health = errored > total * 0.2 ? "ERROR" : errored > 0 || failed24 > 0 ? "DEGRADED" : "HEALTHY";
    // needs attention (P32)
    const staleSources = await this.sourceModel
      .find({ status: "ACTIVE" })
      .select("id name tier lastSuccessAt consecutiveFailures")
      .lean();
    const attention: any[] = [];
    for (const s of staleSources) {
      const staleMin = s.tier === "A" ? 30 : s.tier === "B" ? 60 : 120;
      const ageMin = s.lastSuccessAt ? (now - new Date(s.lastSuccessAt).getTime()) / 60000 : Infinity;
      if (ageMin > staleMin)
        attention.push({ type: "stale", source: s.name, tier: s.tier, staleMinutes: Math.round(isFinite(ageMin) ? ageMin : -1) });
    }
    const erroredList = staleSources.filter((s: any) => s.consecutiveFailures >= 3);
    return {
      health,
      global,
      sources: { total, active, errored, paused, disabled, healthy: active - errored },
      last24h: { fetched: fetched24, new: new24, duplicates: dup24, failedRuns: failed24, runs: runs24.length, successRate },
      articlesTotal: articles,
      lastSuccessfulParseAt: lastSuccess[0]?.lastSuccessAt || null,
      needsAttention: [
        ...attention.slice(0, 10),
        ...erroredList.slice(0, 10).map((s: any) => ({ type: "failing", source: s.name, failures: s.consecutiveFailures })),
      ],
    };
  }

  async stats(days = 7) {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    const series = await this.runModel.aggregate([
      { $match: { startedAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$startedAt" } },
          fetched: { $sum: "$fetchedItems" },
          newItems: { $sum: "$newItems" },
          duplicates: { $sum: "$duplicates" },
          failed: { $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] } },
          runs: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const perSource = await this.runModel.aggregate([
      { $match: { startedAt: { $gte: since } } },
      {
        $group: {
          _id: "$sourceId",
          name: { $last: "$sourceName" },
          runs: { $sum: 1 },
          fetched: { $sum: "$fetchedItems" },
          newItems: { $sum: "$newItems" },
          duplicates: { $sum: "$duplicates" },
          failed: { $sum: { $cond: [{ $eq: ["$status", "FAILED"] }, 1, 0] } },
          avgLatency: { $avg: "$durationMs" },
        },
      },
      { $sort: { newItems: -1 } },
      { $limit: 100 },
    ]);
    return { days, series, perSource };
  }

  // due sources for scheduler
  async findDueSources(now = new Date()) {
    const g = await this.getGlobal();
    if (g.paused) return [];
    return this.sourceModel
      .find({
        status: "ACTIVE",
        $or: [{ nextRunAt: { $lte: now } }, { nextRunAt: { $exists: false } }, { nextRunAt: null }],
      })
      .select("id")
      .lean();
  }

  // \u2014\u2014 scheduler heartbeat (P31/diagnostics) \u2014\u2014
  async touchSchedulerHeartbeat(): Promise<void> {
    await this.globalColl().updateOne(
      { _id: "global" as any },
      { $set: { schedulerLastTickAt: new Date() } },
      { upsert: true }
    );
  }

  // human status + freshness (P29/P30)
  private tierStaleThreshold(tier: string): number {
    return tier === "A" ? 30 : tier === "B" ? 60 : 120;
  }
  private staleThresholdMin(source: any): number {
    const interval = Number(source.pollingIntervalMinutes || 60);
    return Math.max(interval * 2, this.tierStaleThreshold(source.tier));
  }
  private freshnessMinutes(source: any, now = Date.now()): number {
    if (!source.lastSuccessAt) return Infinity;
    return (now - new Date(source.lastSuccessAt).getTime()) / 60000;
  }
  private humanState(source: any, now = Date.now()): { state: string; stale: boolean; freshnessMinutes: number } {
    const fresh = this.freshnessMinutes(source, now);
    const stale = fresh > this.staleThresholdMin(source);
    let state = "Работает";
    if (source.status === "PAUSED") state = "На паузе";
    else if (source.status === "DISABLED") state = "Отключён";
    else if (source.status === "ERROR") state = "Ошибка";
    else if (!source.lastRunAt) state = "Не настроено";
    else if (Number(source.consecutiveFailures || 0) > 0) state = "Есть проблемы";
    else if (stale) state = "Устарели данные";
    return { state, stale, freshnessMinutes: isFinite(fresh) ? Math.round(fresh) : -1 };
  }

  async listSourcesWithHealth(filter: { tier?: string; status?: string; q?: string } = {}) {
    const rows = await this.listSources(filter);
    const now = Date.now();
    return rows.map((s: any) => {
      const h = this.humanState(s, now);
      const uniqueness = s.lastFetched ? Math.round((1 - (s.lastDuplicates || 0) / Math.max(s.lastFetched, 1)) * 100) : null;
      return { ...s, ...h, uniquenessPct: uniqueness };
    });
  }

  // parsing controls: scheduler + queue depth + workers (P25/P26)
  async getParsingControls() {
    let counts: any = { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0, paused: 0 };
    let redisOk = false;
    try {
      counts = await this.queue.getJobCounts();
      redisOk = true;
    } catch {
      redisOk = false;
    }
    const g = await this.getGlobal();
    return {
      schedulerEnabled: String(process.env.NEWS_PARSER_SCHEDULER_ENABLED || "true") !== "false",
      workerEnabled: String(process.env.NEWS_PARSER_WORKER_ENABLED || "true") !== "false",
      globalPaused: g.paused,
      concurrency: 4,
      redisOk,
      queue: counts,
      queueDepth: Number(counts.waiting || 0) + Number(counts.delayed || 0),
      activeWorkers: Number(counts.active || 0),
      tierIntervals: NEWS_PARSER_DEFAULTS.tierIntervalMinutes,
    };
  }

  // per-source health cardiogram (P23)
  async sourceHealth(id: string) {
    const source: any = await this.getSource(id);
    const runs = await this.runModel.find({ sourceId: id }).sort({ startedAt: -1 }).limit(20).lean();
    const durations = runs.filter((r: any) => r.durationMs).map((r: any) => r.durationMs).sort((a, b) => a - b);
    const p = (q: number) => (durations.length ? durations[Math.min(durations.length - 1, Math.floor(durations.length * q))] : 0);
    const agg = runs.reduce(
      (acc: any, r: any) => {
        acc.fetched += r.fetchedItems || 0;
        acc.newItems += r.newItems || 0;
        acc.duplicates += r.duplicates || 0;
        acc.failed += r.status === "FAILED" ? 1 : 0;
        return acc;
      },
      { fetched: 0, newItems: 0, duplicates: 0, failed: 0 }
    );
    const h = this.humanState(source);
    return {
      source: { ...source, ...h, staleThresholdMinutes: this.staleThresholdMin(source) },
      circuitBreaker: {
        consecutiveFailures: source.consecutiveFailures || 0,
        threshold: NEWS_PARSER_DEFAULTS.circuitBreakerThreshold,
        tripped: source.status === "ERROR",
      },
      latency: { p50Ms: p(0.5), p95Ms: p(0.95) },
      last20: agg,
      recentRuns: runs,
      lastError: source.lastError || null,
    };
  }

  // functional diagnostics (P33/P34)
  async diagnostics() {
    const checks: Array<{ key: string; label: string; ok: boolean; detail: string }> = [];
    const push = (key: string, label: string, ok: boolean, detail = "") => checks.push({ key, label, ok, detail });
    try {
      const c = await this.queue.getJobCounts();
      push("queue", "Redis / Bull очередь", true, `waiting=${c.waiting}, active=${c.active}, failed=${c.failed}`);
    } catch (e: any) {
      push("queue", "Redis / Bull очередь", false, String(e?.message || e));
    }
    try {
      const n = await this.sourceModel.countDocuments();
      push("registry", "Реестр источников (Mongo fomo_market)", n > 0, `источников: ${n}`);
    } catch (e: any) {
      push("registry", "Реестр источников", false, String(e?.message || e));
    }
    try {
      const n = await this.rawModel.estimatedDocumentCount();
      push("raw", "Сырые статьи (news_articles)", n > 0, `всего: ${n}`);
    } catch (e: any) {
      push("raw", "Сырые статьи", false, String(e?.message || e));
    }
    try {
      const cnt = await this.newsService.getActiveNewsCount().catch(() => null as any);
      const ok = cnt === null ? true : Number(cnt) > 0;
      push("importer", "Импортёр news_articles → News", ok, cnt === null ? "проверка пропущена" : `активных новостей: ${cnt}`);
    } catch (e: any) {
      push("importer", "Импортёр", false, String(e?.message || e));
    }
    try {
      const g: any = await this.globalColl().findOne({ _id: "global" as any });
      const last = g?.schedulerLastTickAt ? new Date(g.schedulerLastTickAt).getTime() : 0;
      const ageSec = last ? Math.round((Date.now() - last) / 1000) : -1;
      push("scheduler", "Планировщик (heartbeat)", last > 0 && ageSec < 180, ageSec >= 0 ? `последний тик ${ageSec}с назад` : "ещё не тикал");
    } catch (e: any) {
      push("scheduler", "Планировщик", false, String(e?.message || e));
    }
    const allOk = checks.every((c) => c.ok);
    return { ok: allOk, checks };
  }

}
