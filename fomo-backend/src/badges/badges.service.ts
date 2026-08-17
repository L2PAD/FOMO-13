import { Injectable, Logger, OnModuleInit, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  BadgeDefinition,
  BadgeDefinitionDocument,
  BadgeCondition,
  BadgeCriteria,
} from "./models/badge-definition.model";
import { UserBadge, UserBadgeDocument } from "./models/user-badge.model";
import { BadgeAuditLog, BadgeAuditLogDocument } from "./models/badge-audit-log.model";
import { User, UserDocument } from "../user/user.model";
import { DEFAULT_BADGE_DEFINITIONS } from "./badges.seed";
import { BadgeMetricResolver, MetricValue } from "./metrics/badge-metric-resolver";

export interface BadgeConditionProgress extends BadgeCondition {
  current: number;
  met: boolean;
  progressPercent: number;
}

export interface BadgeView {
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  visualTier: string;
  rarity: string;
  awardMode: string;
  publicVisible: boolean;
  hiddenProgress: boolean;
  displayPriority: number;
  xpReward: number;
  criteria: BadgeCriteria;
  // user-context fields (present in user badge views)
  earned?: boolean;
  earnedAt?: Date | null;
  featured?: boolean;
  sourceType?: string;
  progressPercent?: number;
  conditions?: BadgeConditionProgress[];
}

@Injectable()
export class BadgesService implements OnModuleInit {
  private readonly logger = new Logger(BadgesService.name);

  constructor(
    @InjectModel(BadgeDefinition.name) private badgeDefModel: Model<BadgeDefinitionDocument>,
    @InjectModel(UserBadge.name) private userBadgeModel: Model<UserBadgeDocument>,
    @InjectModel(BadgeAuditLog.name) private auditModel: Model<BadgeAuditLogDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly metricResolver: BadgeMetricResolver,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      // Additive migration: insert only definitions whose code does not yet exist.
      // Never overwrite admin-edited definitions.
      const existing = await this.badgeDefModel.find({}, { code: 1 }).lean();
      const existingCodes = new Set(existing.map((d) => d.code));
      const toInsert = DEFAULT_BADGE_DEFINITIONS.filter((b) => !existingCodes.has(b.code)).map((b) => ({
        ...b,
        active: true,
        publicVisible: true,
        xpReward: b.xpReward ?? 0,
        displayPriority: b.displayPriority ?? 100,
        hiddenProgress: b.hiddenProgress ?? false,
        retentionMode: b.retentionMode ?? "permanent",
        visualTier: "blue",
      }));
      if (toInsert.length > 0) {
        await this.badgeDefModel.insertMany(toInsert);
        this.logger.log(`Seeded ${toInsert.length} new badge definitions`);
      }
    } catch (error) {
      this.logger.error("Badge seeding failed", error as any);
    }
  }

  // ---------------------------------------------------------------------------
  // Canonical metrics (provider-based). "missing" (connected=false) is NOT zero.
  // ---------------------------------------------------------------------------
  private isMetricConnected(metric: string): boolean {
    return this.metricResolver.isConnected(metric);
  }

  /** True only if every metric referenced by the criteria has a connected canonical source. */
  private criteriaFullyConnected(criteria: BadgeCriteria): boolean {
    const conditions = Array.isArray(criteria?.conditions) ? criteria.conditions : [];
    if (conditions.length === 0) return false; // manual-only badges never auto-award
    return conditions.every((c) => this.isMetricConnected(c.metric));
  }

  // ---------------------------------------------------------------------------
  // Metrics gathering — delegated to provider-based resolver (missing != 0)
  // ---------------------------------------------------------------------------
  resolveMetrics(user: any, extra: Record<string, number> = {}): Record<string, MetricValue> {
    return this.metricResolver.resolve(user, extra);
  }

  /** Plain numeric view (values only) for connected metrics — used by the evaluator. */
  private numericMetrics(resolved: Record<string, MetricValue>): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(resolved)) out[k] = v.value;
    return out;
  }

  private evalCondition(current: number, op: string, value: number): boolean {
    switch (op) {
      case ">=":
        return current >= value;
      case ">":
        return current > value;
      case "=":
        return current === value;
      case "<=":
        return current <= value;
      case "<":
        return current < value;
      default:
        return false;
    }
  }

  private conditionProgress(current: number, op: string, value: number): number {
    if ([">=", ">"].includes(op)) {
      if (value <= 0) return 100;
      return Math.min(100, Math.round((current / value) * 100));
    }
    return this.evalCondition(current, op, value) ? 100 : 0;
  }

  private evaluateCriteria(
    criteria: BadgeCriteria,
    metrics: Record<string, number>,
  ): { qualified: boolean; progressPercent: number; conditions: BadgeConditionProgress[] } {
    const conditions = Array.isArray(criteria?.conditions) ? criteria.conditions : [];
    if (conditions.length === 0) {
      // No auto conditions (e.g. manual-only badges) => never auto-qualifies.
      return { qualified: false, progressPercent: 0, conditions: [] };
    }
    const evaluated: BadgeConditionProgress[] = conditions.map((c) => {
      const current = Number(metrics[c.metric] || 0);
      const met = this.evalCondition(current, c.op, Number(c.value));
      return { ...c, current, met, progressPercent: this.conditionProgress(current, c.op, Number(c.value)) };
    });
    const logic = criteria?.logic === "OR" ? "OR" : "AND";
    const qualified = logic === "OR" ? evaluated.some((e) => e.met) : evaluated.every((e) => e.met);
    const pcts = evaluated.map((e) => e.progressPercent);
    const progressPercent = logic === "OR" ? Math.max(...pcts, 0) : Math.min(...pcts, 100);
    return { qualified, progressPercent, conditions: evaluated };
  }

  // ---------------------------------------------------------------------------
  // Evaluation + idempotent award
  // ---------------------------------------------------------------------------
  async evaluateForUser(
    userId: string,
    extraMetrics: Record<string, number> = {},
  ): Promise<{ awarded: string[]; revoked: string[]; metrics: Record<string, number> }> {
    if (!userId) return { awarded: [], revoked: [], metrics: {} };
    const user = await this.userModel.findById(userId).lean();
    if (!user) return { awarded: [], revoked: [], metrics: {} };

    const resolved = this.resolveMetrics(user, extraMetrics);
    const metrics = this.numericMetrics(resolved);
    const defs = await this.badgeDefModel
      .find({ active: true, awardMode: { $in: ["automatic", "both"] } })
      .lean();

    const awarded: string[] = [];
    const revoked: string[] = [];
    for (const def of defs) {
      // P1: never auto-award/evaluate on metrics without an authoritative source.
      if (!this.criteriaFullyConnected(def.criteria)) continue;

      const { qualified, progressPercent, conditions } = this.evaluateCriteria(def.criteria, metrics);

      if (qualified) {
        const created = await this.awardBadgeInternal(userId, def, {
          sourceType: "automatic",
          progressSnapshot: { progressPercent, conditions },
        });
        if (created) awarded.push(def.code);
      } else if (def.retentionMode === "dynamic") {
        // P3: dynamic badges are revoked automatically when criteria no longer hold.
        const done = await this.autoRevokeDynamic(userId, def.code);
        if (done) revoked.push(def.code);
      }
    }
    return { awarded, revoked, metrics };
  }

  private async autoRevokeDynamic(userId: string, code: string): Promise<boolean> {
    const ub = await this.userBadgeModel.findOne({ userId, badgeCode: code });
    if (!ub || ub.status !== "earned") return false;
    if (ub.sourceType === "manual") return false; // never auto-revoke manually granted badges
    ub.status = "revoked";
    ub.revokedAt = new Date();
    ub.revokedBy = "system";
    ub.revokeReason = "dynamic:criteria-no-longer-met";
    await ub.save();
    await this.writeAudit("revoke", userId, code, "automatic", "system", "dynamic:criteria-no-longer-met");
    return true;
  }

  /** Idempotent award. Returns true if newly created/earned. */
  private async awardBadgeInternal(
    userId: string,
    def: Partial<BadgeDefinition> & { code: string },
    opts: { sourceType: string; sourceId?: string; issuedBy?: string; reason?: string; progressSnapshot?: Record<string, any> },
  ): Promise<boolean> {
    const existing = await this.userBadgeModel.findOne({ userId, badgeCode: def.code });
    if (existing && existing.status === "earned") return false;

    if (existing && existing.status === "revoked") {
      // Do not silently re-award a revoked badge automatically.
      if (opts.sourceType === "automatic") return false;
      existing.status = "earned";
      existing.earnedAt = new Date();
      existing.sourceType = opts.sourceType;
      existing.issuedBy = opts.issuedBy || "";
      existing.reason = opts.reason || "";
      existing.revokedAt = null;
      existing.revokedBy = "";
      existing.revokeReason = "";
      await existing.save();
      await this.writeAudit("award", userId, def.code, opts.sourceType === "manual" ? "admin" : "automatic", opts.issuedBy || "", opts.reason || "", opts.progressSnapshot || {});
      await this.grantXpIfNeeded(userId, def);
      return true;
    }

    try {
      await this.userBadgeModel.create({
        userId,
        badgeCode: def.code,
        status: "earned",
        earnedAt: new Date(),
        sourceType: opts.sourceType,
        sourceId: opts.sourceId || "",
        progressSnapshot: opts.progressSnapshot || {},
        issuedBy: opts.issuedBy || "",
        reason: opts.reason || "",
      });
    } catch (error: any) {
      // Duplicate key => already earned (race). Treat as not-new.
      if (error?.code === 11000) return false;
      throw error;
    }
    await this.writeAudit("award", userId, def.code, opts.sourceType === "manual" ? "admin" : "automatic", opts.issuedBy || "", opts.reason || "", opts.progressSnapshot || {});
    await this.grantXpIfNeeded(userId, def);
    return true;
  }

  /** Explicit, idempotent XP grant only when a badge defines xpReward > 0. */
  private async grantXpIfNeeded(userId: string, def: Partial<BadgeDefinition>): Promise<void> {
    const xp = Number(def?.xpReward || 0);
    if (!xp || xp <= 0) return;
    // Idempotency guard: only grant once per user+badge (badge_reward:{code}:{userId}).
    const dedupKey = `badge_reward:${def.code}:${userId}`;
    const already = await this.auditModel.findOne({ action: "xp-grant", "meta.dedupKey": dedupKey }).lean();
    if (already) return;
    try {
      await this.userModel.updateOne({ _id: userId }, { $inc: { activityXP: xp } });
      await this.writeAudit("xp-grant", userId, def.code || "", "system", "", `badge xpReward ${xp}`, { xp, dedupKey });
    } catch (error) {
      this.logger.error(`Badge xp grant failed for ${userId}/${def.code}`, error as any);
    }
  }

  private async writeAudit(
    action: string,
    userId: string,
    badgeCode: string,
    actorType: string,
    actorId: string,
    reason: string,
    meta: Record<string, any> = {},
  ): Promise<void> {
    try {
      await this.auditModel.create({ action, userId, badgeCode, actorType, actorId, reason, meta });
    } catch (error) {
      this.logger.error("Badge audit write failed", error as any);
    }
  }

  // ---------------------------------------------------------------------------
  // Manual award / revoke (admin)
  // ---------------------------------------------------------------------------
  async manualAward(userId: string, code: string, adminId: string, reason: string): Promise<{ success: boolean }> {
    const def = await this.badgeDefModel.findOne({ code });
    if (!def) throw new NotFoundException("Badge definition not found");
    if (!reason || !reason.trim()) throw new BadRequestException("Reason is required");
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException("User not found");
    const created = await this.awardBadgeInternal(userId, def as any, {
      sourceType: "manual",
      issuedBy: adminId,
      reason: reason.trim(),
    });
    return { success: created };
  }

  async revoke(userId: string, code: string, adminId: string, reason: string): Promise<{ success: boolean }> {
    if (!reason || !reason.trim()) throw new BadRequestException("Revoke reason is required");
    const ub = await this.userBadgeModel.findOne({ userId, badgeCode: code });
    if (!ub || ub.status === "revoked") throw new NotFoundException("User badge not found");
    ub.status = "revoked";
    ub.revokedAt = new Date();
    ub.revokedBy = adminId;
    ub.revokeReason = reason.trim();
    await ub.save();
    await this.writeAudit("revoke", userId, code, "admin", adminId, reason.trim());
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // Reads
  // ---------------------------------------------------------------------------
  private toDefView(def: any): BadgeView {
    return {
      code: def.code,
      name: def.name,
      description: def.description || "",
      category: def.category,
      icon: def.icon || "",
      visualTier: def.visualTier || "blue",
      rarity: def.rarity || "common",
      awardMode: def.awardMode || "automatic",
      publicVisible: def.publicVisible !== false,
      hiddenProgress: !!def.hiddenProgress,
      displayPriority: Number(def.displayPriority ?? 100),
      xpReward: Number(def.xpReward || 0),
      criteria: def.criteria || { logic: "AND", conditions: [] },
    };
  }

  async getPublicBadges(): Promise<BadgeView[]> {
    const defs = await this.badgeDefModel
      .find({ active: true, publicVisible: true })
      .sort({ displayPriority: 1 })
      .lean();
    return defs.map((d) => this.toDefView(d));
  }

  async getUserBadges(userId: string): Promise<BadgeView[]> {
    if (!userId) return [];
    const [earned, defs] = await Promise.all([
      this.userBadgeModel.find({ userId, status: "earned" }).lean(),
      this.badgeDefModel.find({}).lean(),
    ]);
    const defMap = new Map(defs.map((d) => [d.code, d]));
    return earned
      .map((ub) => {
        const def = defMap.get(ub.badgeCode);
        if (!def) return null;
        const view = this.toDefView(def);
        view.earned = true;
        view.earnedAt = ub.earnedAt || null;
        view.featured = !!ub.featured;
        view.sourceType = ub.sourceType;
        view.progressPercent = 100;
        return view;
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.displayPriority - b.displayPriority) as BadgeView[];
  }

  /** Full catalog view for a user: earned + locked with progress (used by profile "all badges"). */
  async getUserBadgeCatalog(userId: string, metrics: Record<string, number>): Promise<BadgeView[]> {
    const [earned, defs] = await Promise.all([
      this.userBadgeModel.find({ userId, status: "earned" }).lean(),
      this.badgeDefModel.find({ active: true, publicVisible: true }).sort({ displayPriority: 1 }).lean(),
    ]);
    const earnedSet = new Map(earned.map((e) => [e.badgeCode, e]));
    return defs.map((def) => {
      const view = this.toDefView(def);
      const ub = earnedSet.get(def.code);
      if (ub) {
        view.earned = true;
        view.earnedAt = ub.earnedAt || null;
        view.featured = !!ub.featured;
        view.progressPercent = 100;
        return view;
      }
      const { progressPercent, conditions } = this.evaluateCriteria(def.criteria, metrics);
      view.earned = false;
      view.progressPercent = def.hiddenProgress ? 0 : progressPercent;
      if (!def.hiddenProgress) view.conditions = conditions;
      return view;
    });
  }

  async setFeatured(userId: string, codes: string[]): Promise<{ success: boolean }> {
    const ordered = (codes || []).slice(0, 5);
    const set = new Set(ordered);
    await this.userBadgeModel.updateMany({ userId }, { $set: { featured: false, featuredOrder: 0 } });
    if (set.size > 0) {
      await Promise.all(
        ordered.map((code, idx) =>
          this.userBadgeModel.updateOne(
            { userId, badgeCode: code, status: "earned" },
            { $set: { featured: true, featuredOrder: idx + 1 } },
          ),
        ),
      );
    }
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // Admin definition CRUD
  // ---------------------------------------------------------------------------
  async listDefinitions(): Promise<any[]> {
    return this.badgeDefModel.find({}).sort({ displayPriority: 1 }).lean();
  }

  async createDefinition(data: any, adminId: string): Promise<any> {
    if (!data?.code || !data?.name || !data?.category) {
      throw new BadRequestException("code, name and category are required");
    }
    const exists = await this.badgeDefModel.findOne({ code: data.code });
    if (exists) throw new BadRequestException("Badge code already exists");
    const created = await this.badgeDefModel.create({
      code: String(data.code).trim(),
      name: data.name,
      description: data.description || "",
      category: data.category,
      icon: data.icon || "",
      visualTier: data.visualTier || "blue",
      rarity: data.rarity || "common",
      active: data.active !== false,
      awardMode: data.awardMode || "automatic",
      criteria: data.criteria || { logic: "AND", conditions: [] },
      xpReward: Number(data.xpReward || 0),
      displayPriority: Number(data.displayPriority ?? 100),
      publicVisible: data.publicVisible !== false,
      hiddenProgress: !!data.hiddenProgress,
      retentionMode: data.retentionMode === "dynamic" ? "dynamic" : "permanent",
    });
    await this.writeAudit("definition.create", "", created.code, "admin", adminId, "", { code: created.code });
    return created;
  }

  async updateDefinition(code: string, data: any, adminId: string): Promise<any> {
    const def = await this.badgeDefModel.findOne({ code });
    if (!def) throw new NotFoundException("Badge definition not found");
    const fields = ["name", "description", "category", "icon", "visualTier", "rarity", "active", "awardMode", "criteria", "xpReward", "displayPriority", "publicVisible", "hiddenProgress", "retentionMode"];
    for (const f of fields) {
      if (data[f] !== undefined) (def as any)[f] = data[f];
    }
    await def.save();
    await this.writeAudit("definition.update", "", code, "admin", adminId, "", {});
    return def;
  }

  async deleteDefinition(code: string, adminId: string): Promise<{ success: boolean }> {
    const def = await this.badgeDefModel.findOne({ code });
    if (!def) throw new NotFoundException("Badge definition not found");
    await this.badgeDefModel.deleteOne({ code });
    await this.writeAudit("definition.delete", "", code, "admin", adminId, "", {});
    return { success: true };
  }

  async getHistory(limit = 100, userId?: string): Promise<any[]> {
    const q: any = {};
    if (userId) q.userId = userId;
    return this.auditModel.find(q).sort({ createdAt: -1 }).limit(Math.min(500, limit)).lean();
  }

  /** Admin diagnostics (P7/P8): holders + metric connectivity + rarity% per badge. */
  async getDiagnostics(): Promise<any> {
    const [defs, totalUsers, earnedAgg] = await Promise.all([
      this.badgeDefModel.find({}).sort({ displayPriority: 1 }).lean(),
      this.userModel.estimatedDocumentCount(),
      this.userBadgeModel.aggregate([
        { $match: { status: "earned" } },
        { $group: { _id: "$badgeCode", holders: { $sum: 1 }, manual: { $sum: { $cond: [{ $eq: ["$sourceType", "manual"] }, 1, 0] } } } },
      ]),
    ]);
    const holdersMap = new Map(earnedAgg.map((a: any) => [a._id, a]));
    const eligible = Math.max(1, totalUsers);
    const badges = defs.map((d) => {
      const agg: any = holdersMap.get(d.code) || { holders: 0, manual: 0 };
      const metrics = (d.criteria?.conditions || []).map((c: any) => ({
        metric: c.metric,
        ...this.metricResolver.sourceOf(c.metric),
      }));
      const dataState = metrics.length === 0 ? "manual" : metrics.every((m: any) => m.connected) ? "connected" : "missing";
      return {
        code: d.code, name: d.name, category: d.category, rarity: d.rarity, icon: d.icon,
        awardMode: d.awardMode, retentionMode: d.retentionMode, active: d.active,
        holders: agg.holders, manual: agg.manual, automatic: agg.holders - agg.manual,
        rarityPercent: Math.round((agg.holders / eligible) * 1000) / 10,
        dataState, metrics,
      };
    });
    const totals = {
      definitions: defs.length,
      totalAwarded: earnedAgg.reduce((s: number, a: any) => s + a.holders, 0),
      connected: badges.filter((b) => b.dataState === "connected").length,
      missing: badges.filter((b) => b.dataState === "missing").length,
      manualOnly: badges.filter((b) => b.dataState === "manual").length,
    };
    return { totals, badges };
  }

  /**
   * P8 Badge Analytics for the CRM dashboard. Reuses the same aggregates as
   * diagnostics (single source), adds distribution, top earners and issuance mix.
   */
  async getAnalytics(): Promise<any> {
    const diag = await this.getDiagnostics();
    const badges: any[] = diag.badges || [];

    // Distribution by category / rarity (definitions + holders).
    const byCategory: Record<string, { definitions: number; holders: number }> = {};
    const byRarity: Record<string, { definitions: number; holders: number }> = {};
    let manualIssued = 0;
    let autoIssued = 0;
    for (const b of badges) {
      const cat = b.category || "OTHER";
      const rar = b.rarity || "common";
      byCategory[cat] = byCategory[cat] || { definitions: 0, holders: 0 };
      byRarity[rar] = byRarity[rar] || { definitions: 0, holders: 0 };
      byCategory[cat].definitions++; byCategory[cat].holders += b.holders || 0;
      byRarity[rar].definitions++; byRarity[rar].holders += b.holders || 0;
      manualIssued += b.manual || 0;
      autoIssued += b.automatic || 0;
    }

    // Status counts across all user_badges.
    const statusAgg = await this.userBadgeModel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusCounts: Record<string, number> = {};
    for (const s of statusAgg) statusCounts[s._id || "unknown"] = s.count;

    // Top earners (most earned badges).
    const topAgg = await this.userBadgeModel.aggregate([
      { $match: { status: "earned" } },
      { $group: { _id: "$userId", badges: { $sum: 1 }, lastEarned: { $max: "$earnedAt" } } },
      { $sort: { badges: -1 } },
      { $limit: 10 },
    ]);
    const topEarners: any[] = [];
    for (const t of topAgg) {
      let name = ""; let email = ""; let wallet = "";
      try {
        const u: any = await this.userModel.findById(t._id).select("name userName email walletAddress").lean();
        name = u?.name || u?.userName || ""; email = u?.email || ""; wallet = u?.walletAddress || "";
      } catch (_) { /* user may be missing */ }
      topEarners.push({ userId: String(t._id), name, email, wallet, badges: t.badges, lastEarned: t.lastEarned || null });
    }

    // Most / least held badges (rarity leaderboard).
    const sortedByHolders = [...badges].sort((a, b) => (b.holders || 0) - (a.holders || 0));
    const rarest = [...badges]
      .filter((b) => b.dataState !== "manual")
      .sort((a, b) => (a.holders || 0) - (b.holders || 0))
      .slice(0, 6);

    return {
      totals: {
        ...diag.totals,
        issuedTotal: manualIssued + autoIssued,
        manualIssued,
        autoIssued,
        earned: statusCounts.earned || 0,
        revoked: statusCounts.revoked || 0,
      },
      byCategory,
      byRarity,
      statusCounts,
      topEarners,
      mostHeld: sortedByHolders.slice(0, 6),
      rarest,
      badges,
    };
  }
}
