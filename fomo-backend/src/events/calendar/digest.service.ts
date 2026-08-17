// EPIC CAL-2 · Digest service — editorial market digests with optional AI drafting.
// AI drafting flows EXCLUSIVELY through FomoAiGateway (billingContext INTERNAL),
// consistent with the BUZZ-AI rule: no direct provider SDK calls here.
import { Injectable, NotFoundException, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel, InjectConnection } from "@nestjs/mongoose";
import { Connection, Model } from "mongoose";
import { Digest, DigestDocument, DIGEST_PERIODS } from "./digest.model";
import { Event, EventDocument } from "../models/event.model";
import { News, NewsDocument } from "../../news/models/news.model";
import { FomoAiGateway } from "../../entitlements/ai/fomo-ai-gateway.service";
import { FilesService } from "../../files/files.service";
import { isCronEnabled } from "../../config/cron.config";

const AI_OPERATION = "buzz_market_digest";

const PERIOD_DAYS: Record<string, number> = {
  WEEK: 7,
  MONTH: 30,
  QUARTER: 91,
  HALF_YEAR: 182,
  YEAR: 365,
};

const PERIOD_LABEL: Record<string, string> = {
  WEEK: "7-day",
  MONTH: "monthly",
  QUARTER: "quarterly",
  HALF_YEAR: "half-year",
  YEAR: "annual",
};

@Injectable()
export class DigestService implements OnModuleInit {
  private readonly logger = new Logger("DigestService");
  private weeklyTimer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @InjectModel(Digest.name) private readonly digestModel: Model<DigestDocument>,
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(News.name) private readonly newsModel: Model<NewsDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly aiGateway: FomoAiGateway,
    private readonly files: FilesService,
  ) {}

  // Ensure the metered AI operation rule exists so the gateway does not return
  // "unknown_operation". INTERNAL, cost-based, no user credits.
  async onModuleInit() {
    try {
      const col = this.connection.collection("ai_credit_rules");
      const existing = await col.findOne({ operationType: AI_OPERATION });
      if (!existing) {
        await col.insertOne({
          operationType: AI_OPERATION,
          name: "Buzz Market Digest (internal)",
          active: true,
          billingContext: "INTERNAL",
          capabilityRequired: "",
          baseCredits: 0,
          fixedCredits: 0,
          minCredits: 0,
          maxCredits: 0,
          estInputTokens: 4000,
          estOutputTokens: 1500,
          modelClass: "SMART",
          modelPolicy: {},
          pricingMode: "COST_BASED",
          safetyFactor: 1.2,
          targetMarkup: 2,
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        this.logger.log(`Seeded AI rule '${AI_OPERATION}'`);
      }
    } catch (e: any) {
      this.logger.warn(`ensure digest AI rule failed: ${e?.message || e}`);
    }

    // BUZZ Digests · weekly auto-draft. Runs only where cron is enabled.
    // Hourly tick keeps it resilient to restarts; generation itself is
    // idempotent per ISO week via the `autoWeekKey` marker.
    if (isCronEnabled()) {
      this.weeklyTimer = setInterval(() => {
        this.maybeGenerateWeeklyDraft().catch((err) =>
          this.logger.warn(`weekly digest tick failed: ${err?.message || err}`)
        );
      }, 60 * 60 * 1000);
      setTimeout(() => {
        this.maybeGenerateWeeklyDraft().catch(() => undefined);
      }, 30 * 1000);
      this.logger.log("Weekly auto-digest scheduler armed (Mon 08:00 UTC)");
    }
  }

  // ISO-week key like "2026-W33" used to dedupe the weekly auto-draft.
  private isoWeekKey(d: Date): string {
    const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  }

  // Generate a weekly market digest DRAFT once per ISO week (Mon 08:00 UTC onward).
  async maybeGenerateWeeklyDraft(force = false): Promise<{ ok: boolean; reason?: string; id?: string }> {
    const now = new Date();
    if (!force) {
      // Only fire on Monday, from 08:00 UTC onward.
      if (now.getUTCDay() !== 1 || now.getUTCHours() < 8) {
        return { ok: false, reason: "outside_window" };
      }
    }
    const weekKey = this.isoWeekKey(now);
    const existing = await this.digestModel.findOne({ autoWeekKey: weekKey }).lean();
    if (existing) return { ok: false, reason: "already_generated", id: String(existing._id) };

    const result: any = await this.generateDraft({ period: "WEEK" }, "system");
    if (!result?.ok || !result?.draft) {
      return { ok: false, reason: result?.errorCode || "ai_unavailable" };
    }
    const dr = result.draft;
    const doc = await this.digestModel.create({
      title: dr.title,
      slug: this.slugify(dr.title),
      period: "WEEK",
      kind: "ROUTINE",
      summary: dr.summary,
      keyTakeaways: dr.keyTakeaways || [],
      bodyHtml: dr.bodyHtml || "",
      outlook: dr.outlook || "NEUTRAL",
      status: "DRAFT",
      periodStart: dr.periodStart,
      periodEnd: dr.periodEnd,
      aiGenerated: true,
      aiModel: dr.aiModel || "",
      aiProviderCostUsd: Number(dr.aiProviderCostUsd || 0),
      autoWeekKey: weekKey,
      createdBy: "system",
      updatedBy: "system",
    });
    this.logger.log(`Weekly auto-digest draft created for ${weekKey} (${doc._id})`);
    return { ok: true, id: String(doc._id) };
  }

  private kindForPeriod(period: string): string {
    return period === "WEEK" ? "ROUTINE" : "SPECIAL";
  }

  private periodWindow(period: string): { start: Date; end: Date } {
    const days = PERIOD_DAYS[period] || 7;
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  private slugify(title: string): string {
    return String(title || "")
      .toLowerCase()
      .replace(/[^a-z0-9\u0400-\u04FF]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 80);
  }

  private toDto(d: any) {
    if (!d) return d;
    return {
      id: String(d._id),
      title: d.title,
      slug: d.slug,
      period: d.period,
      kind: d.kind,
      summary: d.summary,
      keyTakeaways: d.keyTakeaways || [],
      bodyHtml: d.bodyHtml,
      coverImage: d.coverImage,
      tags: d.tags || [],
      outlook: d.outlook,
      status: d.status,
      periodStart: d.periodStart,
      periodEnd: d.periodEnd,
      publishedAt: d.publishedAt,
      media: d.media || [],
      aiGenerated: !!d.aiGenerated,
      aiModel: d.aiModel,
      aiProviderCostUsd: d.aiProviderCostUsd,
      likesCount: Array.isArray(d.likes) ? d.likes.length : 0,
      repostsCount: Array.isArray(d.reposts) ? d.reposts.length : 0,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }

  private toPublicDto(d: any, viewerId?: string) {
    const dto = this.toDto(d);
    // publicly expose only what a reader needs (hide COGS / provenance internals)
    const { aiProviderCostUsd, aiModel, ...pub } = dto as any;
    const likes: string[] = Array.isArray(d.likes) ? d.likes : [];
    const reposts: string[] = Array.isArray(d.reposts) ? d.reposts : [];
    return {
      ...pub,
      liked: viewerId ? likes.map(String).includes(String(viewerId)) : false,
      reposted: viewerId ? reposts.map(String).includes(String(viewerId)) : false,
    };
  }

  // ── Admin CRUD ─────────────────────────────────────────────────────────
  async adminList(q: any) {
    const filter: any = {};
    if (q.status) filter.status = q.status;
    if (q.period) filter.period = q.period;
    if (q.search) filter.title = { $regex: String(q.search), $options: "i" };
    const page = Math.max(1, Number(q.page || 1));
    const limit = Math.min(100, Number(q.limit || 50));
    const [items, total] = await Promise.all([
      this.digestModel.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      this.digestModel.countDocuments(filter),
    ]);
    return { items: items.map((d) => this.toDto(d)), total, page, limit };
  }

  async adminGet(id: string) {
    const d = await this.digestModel.findById(id).lean();
    if (!d) throw new NotFoundException("Digest not found");
    return this.toDto(d);
  }

  async create(body: any, actorId?: string) {
    const period = DIGEST_PERIODS.includes(body.period) ? body.period : "WEEK";
    const win = this.periodWindow(period);
    const doc = await this.digestModel.create({
      title: body.title || "Untitled digest",
      slug: body.slug || this.slugify(body.title),
      period,
      kind: this.kindForPeriod(period),
      summary: body.summary || "",
      keyTakeaways: Array.isArray(body.keyTakeaways) ? body.keyTakeaways : [],
      bodyHtml: body.bodyHtml || "",
      coverImage: body.coverImage || "",
      tags: Array.isArray(body.tags) ? body.tags : [],
      outlook: body.outlook || "NEUTRAL",
      status: body.status || "DRAFT",
      periodStart: body.periodStart ? new Date(body.periodStart) : win.start,
      periodEnd: body.periodEnd ? new Date(body.periodEnd) : win.end,
      publishedAt: body.status === "PUBLISHED" ? new Date() : undefined,
      media: Array.isArray(body.media) ? body.media : [],
      aiGenerated: !!body.aiGenerated,
      aiModel: body.aiModel || "",
      aiProviderCostUsd: Number(body.aiProviderCostUsd || 0),
      createdBy: actorId || "",
      updatedBy: actorId || "",
    });
    return this.toDto(doc.toObject());
  }

  async patch(id: string, body: any, actorId?: string) {
    const d = await this.digestModel.findById(id);
    if (!d) throw new NotFoundException("Digest not found");
    const fields = [
      "title", "slug", "summary", "keyTakeaways", "bodyHtml", "coverImage", "tags",
      "outlook", "status", "media", "aiGenerated", "aiModel",
    ];
    fields.forEach((k) => { if (body[k] !== undefined) (d as any)[k] = body[k]; });
    if (body.period && DIGEST_PERIODS.includes(body.period)) {
      d.period = body.period;
      d.kind = this.kindForPeriod(body.period);
    }
    if (body.periodStart) d.periodStart = new Date(body.periodStart);
    if (body.periodEnd) d.periodEnd = new Date(body.periodEnd);
    if (body.status === "PUBLISHED" && !d.publishedAt) d.publishedAt = new Date();
    if (!d.slug && d.title) d.slug = this.slugify(d.title);
    d.updatedBy = actorId || d.updatedBy;
    await d.save();
    return this.toDto(d.toObject());
  }

  async remove(id: string) {
    const r = await this.digestModel.findByIdAndDelete(id);
    if (!r) throw new NotFoundException("Digest not found");
    return { ok: true };
  }

  async setStatus(id: string, status: "PUBLISHED" | "DRAFT" | "ARCHIVED", actorId?: string) {
    const d = await this.digestModel.findById(id);
    if (!d) throw new NotFoundException("Digest not found");
    d.status = status;
    if (status === "PUBLISHED" && !d.publishedAt) d.publishedAt = new Date();
    d.updatedBy = actorId || d.updatedBy;
    await d.save();
    return this.toDto(d.toObject());
  }

  // ── Public read ────────────────────────────────────────────────────────
  async publicList(q: any = {}, viewerId?: string) {
    const filter: any = { status: "PUBLISHED" };
    if (q.period) filter.period = q.period;
    const limit = Math.min(50, Number(q.limit || 20));
    const items = await this.digestModel.find(filter).sort({ publishedAt: -1, updatedAt: -1 }).limit(limit).lean();
    return { items: items.map((d) => this.toPublicDto(d, viewerId)) };
  }

  async publicGet(id: string, viewerId?: string) {
    const d = await this.digestModel.findOne({ _id: id, status: "PUBLISHED" }).lean();
    if (!d) throw new NotFoundException("Digest not found");
    return this.toPublicDto(d, viewerId);
  }

  // ── Cover image upload (admin) ───────────────────────────────────────────
  async uploadCover(file: any): Promise<{ url: string }> {
    if (!file?.buffer?.length && !file?.path) {
      throw new NotFoundException("Cover image file is required");
    }
    const stored = await this.files.writeFile(file);
    // Local driver returns "/<filename>"; expose it under the proxied /api/uploads path.
    const url = /^https?:\/\//i.test(stored)
      ? stored
      : `/api/uploads/${String(stored).replace(/^\/+/, "").replace(/^uploads\//, "")}`;
    return { url };
  }

  // ── Live community reactions (auth users) ────────────────────────────────
  async toggleReaction(id: string, field: "likes" | "reposts", userId: string) {
    const d = await this.digestModel.findOne({ _id: id, status: "PUBLISHED" });
    if (!d) throw new NotFoundException("Digest not found");
    const uid = String(userId);
    const arr: string[] = ((d as any)[field] || []).map(String);
    const has = arr.includes(uid);
    (d as any)[field] = has ? arr.filter((x) => x !== uid) : [...arr, uid];
    await d.save();
    return {
      likesCount: (d.likes || []).length,
      repostsCount: (d.reposts || []).length,
      liked: (d.likes || []).map(String).includes(uid),
      reposted: (d.reposts || []).map(String).includes(uid),
    };
  }

  // ── AI drafting (INTERNAL, metered via FomoAiGateway) ────────────────────
  private async gatherContext(period: string) {
    const { start, end } = this.periodWindow(period);
    const upcomingEnd = new Date(end.getTime() + 30 * 24 * 60 * 60 * 1000);
    const [pastEvents, upcomingEvents, news] = await Promise.all([
      this.eventModel
        .find({ lifecycleStatus: "PUBLISHED", date: { $gte: start, $lte: end } })
        .sort({ date: -1 }).limit(60).lean(),
      this.eventModel
        .find({ lifecycleStatus: { $in: ["PUBLISHED", "SCHEDULED"] }, date: { $gt: end, $lte: upcomingEnd } })
        .sort({ date: 1 }).limit(30).lean(),
      this.newsModel
        .find({ date: { $gte: start, $lte: end } })
        .sort({ date: -1 }).limit(40).lean(),
    ]);
    return { start, end, pastEvents, upcomingEvents, news };
  }

  async generateDraft(body: { period?: string; instructions?: string }, actorId?: string) {
    const period = DIGEST_PERIODS.includes(body.period as any) ? (body.period as string) : "WEEK";
    const { start, end, pastEvents, upcomingEvents, news } = await this.gatherContext(period);

    const evLine = (e: any) =>
      `- ${new Date(e.date).toISOString().slice(0, 10)} · ${e.eventType || "EVENT"} · ${e.name}${e.projectName ? ` (${e.projectName})` : ""}`;
    const newsLine = (n: any) =>
      `- ${new Date(n.date).toISOString().slice(0, 10)} · ${n.title || n.name || ""}`;

    const input =
      `PERIOD: ${PERIOD_LABEL[period]} market digest (${start.toISOString().slice(0, 10)} → ${end.toISOString().slice(0, 10)})\n\n` +
      `KEY EVENTS IN PERIOD (${pastEvents.length}):\n${pastEvents.map(evLine).join("\n") || "(none)"}\n\n` +
      `UPCOMING EVENTS (${upcomingEvents.length}):\n${upcomingEvents.map(evLine).join("\n") || "(none)"}\n\n` +
      `NOTABLE NEWS (${news.length}):\n${news.map(newsLine).join("\n") || "(none)"}\n\n` +
      (body.instructions ? `EDITOR INSTRUCTIONS: ${body.instructions}\n` : "");

    const system =
      "You are FOMO's senior crypto market analyst writing an editorial market digest for a public audience. " +
      "Base the review ONLY on the provided events and news; do NOT invent prices or fabricate data. " +
      "Write a confident, structured, readable review of the period and FOMO's forward-looking view. " +
      "bodyHtml must be clean semantic HTML (h3/h4/p/ul/li/strong) with 3-5 sections, no inline styles, no <script>. " +
      "Output strictly matches the JSON schema.";

    const jsonSchema = {
      type: "object",
      properties: {
        title: { type: "string", description: "Compelling digest title" },
        summary: { type: "string", description: "1-2 sentence teaser" },
        outlook: { type: "string", enum: ["BULLISH", "BEARISH", "NEUTRAL", "MIXED"] },
        keyTakeaways: {
          type: "array",
          items: { type: "string" },
          description: "3-5 concise key takeaways / highlights",
        },
        bodyHtml: { type: "string", description: "Full editorial body as clean HTML" },
      },
      required: ["title", "summary", "outlook", "keyTakeaways", "bodyHtml"],
      additionalProperties: false,
    };

    const result: any = await this.aiGateway.execute({
      userId: actorId || "system",
      operation: AI_OPERATION,
      billingContext: "INTERNAL",
      mode: "STRUCTURED",
      jsonSchema,
      system,
      input,
      context: { source: "BUZZ_DIGEST", period },
    });

    if (!result?.ok || !result?.content) {
      return {
        ok: false,
        errorCode: result?.errorCode || "ai_unavailable",
        message:
          result?.errorCode === "unknown_operation"
            ? "AI digest operation is not configured"
            : "AI digest generation is temporarily unavailable",
      };
    }

    let parsed: any = {};
    try { parsed = typeof result.content === "string" ? JSON.parse(result.content) : result.content; }
    catch { parsed = {}; }

    return {
      ok: true,
      draft: {
        title: parsed.title || `${PERIOD_LABEL[period]} market digest`,
        summary: parsed.summary || "",
        outlook: parsed.outlook || "NEUTRAL",
        keyTakeaways: Array.isArray(parsed.keyTakeaways) ? parsed.keyTakeaways : [],
        bodyHtml: parsed.bodyHtml || "",
        period,
        periodStart: start,
        periodEnd: end,
        aiGenerated: true,
        aiModel: result.model || "",
        aiProviderCostUsd: result.cost?.providerCostUsd ?? 0,
      },
      meta: {
        events: pastEvents.length,
        upcoming: upcomingEvents.length,
        news: news.length,
        provider: result.provider,
        model: result.model,
        providerCostUsd: result.cost?.providerCostUsd ?? 0,
      },
    };
  }
}
