import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { randomUUID, createHash } from "crypto";
import { XpTransaction } from "./xp-transaction.model";
import { XpRule, DEFAULT_XP_RULES } from "./xp-rule.model";
import { BadgesService } from "../badges/badges.service";

export interface AwardXpInput {
  userId: string;
  eventType: string;
  source?: string; // system | demo-seed | migration | admin
  sourceType?: string;
  sourceId?: string;
  baseXpOverride?: number; // e.g. task.points, reward.rewardXp
  multiplier?: number;
  verified?: boolean; // for verificationRequired rules
  reason?: string;
  metadata?: Record<string, any>;
  occurredAt?: Date;
  idempotencyKey?: string;
}

export interface AwardResult {
  status: "awarded" | "pending" | "rejected" | "duplicate";
  finalXp: number;
  activityXP?: number;
  transactionId?: string;
  reason?: string;
}

/**
 * THE ONLY writer of XP. Feature services MUST call award()/reverse() here instead of
 * mutating user.activityXP directly. Applies anti-farm from xp_rules, idempotency,
 * writes xp_transactions ledger, and projects to user.activityXP.
 */
@Injectable()
export class XpLedgerService implements OnModuleInit {
  private readonly logger = new Logger(XpLedgerService.name);
  private ruleCache: Record<string, XpRule> = {};

  constructor(
    @InjectModel(XpTransaction.name) private readonly txModel: Model<XpTransaction>,
    @InjectModel(XpRule.name) private readonly ruleModel: Model<XpRule>,
    // Bound to the same "users" collection (User schema registered in UserModule).
    @InjectModel("User") private readonly userModel: Model<any>,
    private readonly badgesService: BadgesService
  ) {}

  async onModuleInit(): Promise<void> {
    // Additive migration: insert only default rules whose eventType does not yet
    // exist. Never overwrite admin-edited rules (mirrors the Badge Engine).
    const existing = await this.ruleModel.find({}, { eventType: 1 }).lean();
    const have = new Set((existing as any[]).map((r) => r.eventType));
    const missing = DEFAULT_XP_RULES.filter((r: any) => !have.has(r.eventType));
    if (missing.length > 0) {
      await this.ruleModel.insertMany(
        missing.map((r) => ({ ...r, _id: randomUUID() }))
      );
    }
    await this.reloadRules();
  }

  async reloadRules(): Promise<void> {
    const rules = await this.ruleModel.find().lean().exec();
    this.ruleCache = {};
    for (const r of rules as any[]) this.ruleCache[r.eventType] = r;
  }

  async getRules(): Promise<XpRule[]> {
    return this.ruleModel.find().sort({ group: 1, eventType: 1 }).lean().exec() as any;
  }

  async updateRule(eventType: string, patch: Partial<XpRule>): Promise<XpRule> {
    const clean: any = { ...patch };
    delete clean._id;
    delete clean.eventType;
    await this.ruleModel.updateOne(
      { eventType },
      { $set: clean, $setOnInsert: { _id: randomUUID(), eventType } },
      { upsert: true }
    );
    await this.reloadRules();
    return this.ruleModel.findOne({ eventType }).lean().exec() as any;
  }

  private deriveIdempotencyKey(input: AwardXpInput, rule?: XpRule): string {
    if (input.idempotencyKey) return input.idempotencyKey;
    const scope =
      rule?.uniqueBy === "entity" || rule?.uniqueBy === "source"
        ? `${input.sourceType || ""}:${input.sourceId || ""}`
        : rule?.uniqueBy === "day"
        ? new Date(input.occurredAt || Date.now()).toISOString().slice(0, 10)
        : randomUUID();
    return createHash("sha1")
      .update(`${input.userId}|${input.eventType}|${scope}|${input.source || "system"}`)
      .digest("hex");
  }

  private startOfDay(d = new Date()): Date {
    const x = new Date(d);
    x.setUTCHours(0, 0, 0, 0);
    return x;
  }

  /** Award XP through the ledger with full anti-farm + idempotency. */
  async award(input: AwardXpInput): Promise<AwardResult> {
    const rule = this.ruleCache[input.eventType];
    if (!rule || rule.enabled === false) {
      return { status: "rejected", finalXp: 0, reason: "rule_disabled_or_missing" };
    }

    const idempotencyKey = this.deriveIdempotencyKey(input, rule);
    const existing = await this.txModel.findOne({ idempotencyKey }).lean();
    if (existing) {
      return {
        status: "duplicate",
        finalXp: (existing as any).status === "awarded" ? (existing as any).finalXp : 0,
        transactionId: (existing as any)._id?.toString(),
        reason: "idempotent_replay",
      };
    }

    // verificationRequired -> pending unless verified
    const needsVerification = rule.verificationRequired && input.verified !== true;

    // Anti-farm (only meaningful for awarded, not pending)
    if (!needsVerification) {
      const now = new Date(input.occurredAt || Date.now());
      if (rule.cooldownSec > 0) {
        const since = new Date(now.getTime() - rule.cooldownSec * 1000);
        const recent = await this.txModel.findOne({
          userId: input.userId,
          eventType: input.eventType,
          status: "awarded",
          awardedAt: { $gte: since },
        });
        if (recent) return { status: "rejected", finalXp: 0, reason: "cooldown" };
      }
      if (rule.dailyCap > 0) {
        const dayCount = await this.txModel.countDocuments({
          userId: input.userId,
          eventType: input.eventType,
          status: "awarded",
          awardedAt: { $gte: this.startOfDay(now) },
        });
        if (dayCount >= rule.dailyCap)
          return { status: "rejected", finalXp: 0, reason: "daily_cap" };
      }
      if (rule.lifetimeCap > 0) {
        const lifeCount = await this.txModel.countDocuments({
          userId: input.userId,
          eventType: input.eventType,
          status: "awarded",
        });
        if (lifeCount >= rule.lifetimeCap)
          return { status: "rejected", finalXp: 0, reason: "lifetime_cap" };
      }
      if (rule.maxPerEntity > 0 && input.sourceId) {
        const perEntity = await this.txModel.countDocuments({
          userId: input.userId,
          eventType: input.eventType,
          sourceId: input.sourceId,
          status: "awarded",
        });
        if (perEntity >= rule.maxPerEntity)
          return { status: "rejected", finalXp: 0, reason: "max_per_entity" };
      }
    }

    const baseXp =
      typeof input.baseXpOverride === "number" ? input.baseXpOverride : rule.baseXp;
    const multiplier = input.multiplier ?? rule.multiplier ?? 1;
    const finalXp = Math.round(baseXp * multiplier);
    const status = needsVerification ? "pending" : "awarded";

    let tx;
    try {
      tx = await this.txModel.create({
        userId: input.userId,
        eventType: input.eventType,
        source: input.source || "system",
        sourceType: input.sourceType || "",
        sourceId: input.sourceId || "",
        baseXp,
        multiplier,
        finalXp,
        status,
        idempotencyKey,
        reason: input.reason || "",
        metadata: input.metadata || {},
        occurredAt: new Date(input.occurredAt || Date.now()),
        awardedAt: status === "awarded" ? new Date() : null,
      });
    } catch (e: any) {
      if (e?.code === 11000) {
        return { status: "duplicate", finalXp: 0, reason: "idempotent_race" };
      }
      throw e;
    }

    let activityXP: number | undefined;
    if (status === "awarded" && finalXp !== 0) {
      const updated = await this.userModel.findByIdAndUpdate(
        input.userId,
        { $inc: { activityXP: finalXp } },
        { new: true, projection: { activityXP: 1 } }
      );
      activityXP = updated?.activityXP;

      // P2: event-driven badge issuance. Any XP mutation is a platform event —
      // re-evaluate the user's badges against canonical metrics (non-blocking).
      try {
        void this.badgesService
          .evaluateForUser(input.userId, { xp: Number(activityXP ?? 0) })
          .catch(() => undefined);
      } catch (_) {
        /* never block XP award on badge evaluation */
      }
    }

    return { status, finalXp, activityXP, transactionId: tx._id.toString() };
  }

  /** Reverse an awarded transaction with a compensating entry (history preserved). */
  async reverse(transactionId: string, reason = "manual_reversal"): Promise<AwardResult> {
    const orig: any = await this.txModel.findById(transactionId);
    if (!orig) return { status: "rejected", finalXp: 0, reason: "not_found" };
    if (orig.status !== "awarded")
      return { status: "rejected", finalXp: 0, reason: "not_awarded" };

    const rule = this.ruleCache[orig.eventType];
    if (rule && rule.reversible === false)
      return { status: "rejected", finalXp: 0, reason: "not_reversible" };

    orig.reversedAt = new Date();
    orig.status = "reversed";
    await orig.save();

    const comp = await this.txModel.create({
      userId: orig.userId,
      eventType: `${orig.eventType}:reversal`,
      source: orig.source,
      sourceType: "reversal",
      sourceId: orig._id.toString(),
      baseXp: -orig.baseXp,
      multiplier: orig.multiplier,
      finalXp: -orig.finalXp,
      status: "reversed",
      idempotencyKey: `rev:${orig._id.toString()}`,
      reason,
      metadata: { reverses: orig._id.toString() },
      occurredAt: new Date(),
      awardedAt: null,
      reversedAt: new Date(),
    });

    const updated = await this.userModel.findByIdAndUpdate(
      orig.userId,
      { $inc: { activityXP: -orig.finalXp } },
      { new: true, projection: { activityXP: 1 } }
    );

    return {
      status: "reversed" as any,
      finalXp: -orig.finalXp,
      activityXP: updated?.activityXP,
      transactionId: comp._id.toString(),
    };
  }

  /**
   * Authoritative XP = SUM(finalXp) over every transaction that was applied to activityXP.
   * A row is "applied" when status is `awarded` (original credit) or `reversed`. A reversal
   * keeps the original row (status=reversed, +X) AND adds a compensating row (status=reversed, -X),
   * so both together net to 0 — correctly undoing the award while preserving full history.
   * `pending` and `rejected` rows are never applied and thus excluded.
   */
  async computeLedgerXp(userId: string): Promise<number> {
    const agg2 = await this.txModel.aggregate([
      { $match: { userId } },
      { $match: { status: { $in: ["awarded", "reversed"] } } },
      { $group: { _id: null, total: { $sum: "$finalXp" } } },
    ]);
    return agg2[0]?.total || 0;
  }

  async recomputeUser(userId: string): Promise<number> {
    const total = await this.computeLedgerXp(userId);
    await this.userModel.updateOne({ _id: userId }, { $set: { activityXP: total } });
    return total;
  }

  /** Compare ledger vs denormalized activityXP; optionally fix. */
  async reconcile(userId?: string, fix = false): Promise<any> {
    const users = userId
      ? await this.userModel.find({ _id: userId }, { activityXP: 1 }).lean()
      : await this.userModel.find({ role: ["user"] }, { activityXP: 1 }).lean();
    const diffs: any[] = [];
    for (const u of users as any[]) {
      const ledger = await this.computeLedgerXp(u._id.toString());
      const stored = Number(u.activityXP || 0);
      if (ledger !== stored) {
        diffs.push({ userId: u._id.toString(), stored, ledger, delta: ledger - stored });
        if (fix) await this.recomputeUser(u._id.toString());
      }
    }
    return { checked: users.length, mismatches: diffs.length, diffs, fixed: fix };
  }

  async getTransactions(userId: string, limit = 50): Promise<XpTransaction[]> {
    return this.txModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 200))
      .lean()
      .exec() as any;
  }

  /** All ledger rows for a user + a specific eventType (for explainability read-models). */
  async getEventTransactions(
    userId: string,
    eventType: string,
    limit = 500,
  ): Promise<XpTransaction[]> {
    return this.txModel
      .find({ userId, eventType })
      .sort({ awardedAt: -1, occurredAt: -1 })
      .limit(Math.min(limit, 2000))
      .lean()
      .exec() as any;
  }

  /** Remove all demo-seed transactions and recompute affected users. */
  async resetDemo(): Promise<any> {
    const demo = await this.txModel.find({ source: "demo-seed" }, { userId: 1 }).lean();
    const userIds = Array.from(new Set(demo.map((d: any) => d.userId)));
    await this.txModel.deleteMany({ source: "demo-seed" });
    for (const uid of userIds) await this.recomputeUser(uid);
    return { removed: demo.length, recomputedUsers: userIds.length };
  }

  private readonly DEMO_EMAIL_DOMAINS = ["@fomo.local"];

  private isDemoUser(u: any): boolean {
    const email = String(u?.email || "").toLowerCase();
    return this.DEMO_EMAIL_DOMAINS.some((d) => email.endsWith(d));
  }

  /**
   * Idempotent, versioned migration of legacy `user.activityXP` into the ledger.
   * Creates a single reconciling `legacy_balance_migration` transaction per user so that
   * SUM(awarded) - SUM(reversed) == activityXP. Does NOT mutate activityXP (already stored).
   * Demo users (email @fomo.local) get source=demo-seed so they can be reset; others legacy-migration.
   */
  async migrateLegacyBalances(version = "v1"): Promise<any> {
    const users = await this.userModel
      .find({ role: ["user"] }, { activityXP: 1, email: 1 })
      .lean();

    let migrated = 0;
    let skipped = 0;
    let totalXp = 0;
    const details: any[] = [];

    for (const u of users as any[]) {
      const userId = u._id.toString();
      const stored = Number(u.activityXP || 0);
      const idempotencyKey = `legacy-migration:${version}:${userId}`;

      const existing = await this.txModel.findOne({ idempotencyKey }).lean();
      if (existing) {
        skipped++;
        continue;
      }

      const currentLedger = await this.computeLedgerXp(userId);
      const delta = stored - currentLedger;
      if (delta === 0) {
        skipped++;
        continue;
      }

      const source = this.isDemoUser(u) ? "demo-seed" : "legacy-migration";
      await this.txModel.create({
        userId,
        eventType: "legacy_balance_migration",
        source,
        sourceType: "migration",
        sourceId: version,
        baseXp: delta,
        multiplier: 1,
        finalXp: delta,
        status: "awarded",
        idempotencyKey,
        reason: "Начальный перенос баланса",
        metadata: { version, storedActivityXP: stored, previousLedger: currentLedger },
        occurredAt: new Date(),
        awardedAt: new Date(),
      });

      migrated++;
      totalXp += delta;
      details.push({ userId, email: u.email, stored, delta, source });
    }

    return {
      version,
      usersChecked: users.length,
      migrated,
      skipped,
      totalXp,
      details,
    };
  }
}
