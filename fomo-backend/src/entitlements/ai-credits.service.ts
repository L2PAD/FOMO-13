import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, isValidObjectId } from "mongoose";
import {
  AiCreditTransaction,
  AiCreditReservation,
  AiUsageEvent,
  AiCreditRule,
} from "./models/ai-credit.model";

export interface CreditBalances {
  monthly: number;
  topup: number;
  total: number;
  reserved: number;
  available: number;
}

/**
 * AI Credits — single-source-of-truth ledger (like XP Ledger). No user.credits.
 * reserve -> capture/release lifecycle, idempotent, bucket-aware (monthly/topup).
 */
@Injectable()
export class AiCreditsService {
  constructor(
    @InjectModel(AiCreditTransaction.name) private readonly txModel: Model<any>,
    @InjectModel(AiCreditReservation.name) private readonly resModel: Model<any>,
    @InjectModel(AiUsageEvent.name) private readonly usageModel: Model<any>,
    @InjectModel(AiCreditRule.name) private readonly ruleModel: Model<any>,
  ) {}

  private oid(userId: string) {
    if (!isValidObjectId(userId)) throw new BadRequestException("invalid userId");
    return new Types.ObjectId(userId);
  }

  private async bucketSums(userId: string): Promise<{ MONTHLY: number; TOPUP: number; total: number }> {
    const rows = await this.txModel.aggregate([
      { $match: { userId: this.oid(userId) } },
      { $group: { _id: "$bucket", sum: { $sum: "$credits" } } },
    ]);
    const out: any = { MONTHLY: 0, TOPUP: 0, total: 0 };
    for (const r of rows) {
      out[r._id === "TOPUP" ? "TOPUP" : r._id === "MONTHLY" ? "MONTHLY" : "MONTHLY"] += r.sum;
      out.total += r.sum;
    }
    return out;
  }

  async getBalances(userId: string): Promise<CreditBalances> {
    const b = await this.bucketSums(userId);
    const reservedAgg = await this.resModel.aggregate([
      { $match: { userId: this.oid(userId), status: "RESERVED" } },
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]);
    const reserved = reservedAgg[0]?.sum || 0;
    const total = b.total;
    return {
      monthly: b.MONTHLY,
      topup: b.TOPUP,
      total,
      reserved,
      available: total - reserved,
    };
  }

  private async writeTx(params: {
    userId: string;
    type: string;
    credits: number;
    bucket: string;
    idempotencyKey?: string | null;
    sourceType?: string;
    sourceId?: string;
    reason?: string;
    dataMode?: string;
    expiresAt?: Date | null;
    metadata?: any;
  }) {
    // idempotency: if key already exists, return existing (no double charge)
    if (params.idempotencyKey) {
      const existing = await this.txModel.findOne({ idempotencyKey: params.idempotencyKey }).lean();
      if (existing) return { tx: existing, duplicate: true };
    }
    const balances = await this.bucketSums(params.userId);
    const balanceAfter = balances.total + params.credits;
    try {
      const tx = await this.txModel.create({
        userId: this.oid(params.userId),
        type: params.type,
        credits: params.credits,
        bucket: params.bucket,
        idempotencyKey: params.idempotencyKey || null,
        sourceType: params.sourceType || "",
        sourceId: params.sourceId || "",
        balanceAfter,
        expiresAt: params.expiresAt || null,
        reason: params.reason || "",
        dataMode: params.dataMode || "real",
        metadata: params.metadata || {},
      });
      return { tx, duplicate: false };
    } catch (e: any) {
      if (e?.code === 11000) {
        const existing = await this.txModel.findOne({ idempotencyKey: params.idempotencyKey }).lean();
        return { tx: existing, duplicate: true };
      }
      throw e;
    }
  }

  // D5: monthly subscription grant (idempotent per period, carries expiresAt)
  async grantSubscriptionCredits(
    userId: string,
    amount: number,
    subscriptionId: string,
    periodStart: Date,
    periodEnd?: Date | null,
  ) {
    if (amount <= 0) return { skipped: true };
    const key = `subscription_credit_grant:${subscriptionId}:${new Date(periodStart).toISOString()}`;
    return this.writeTx({
      userId,
      type: "SUBSCRIPTION_GRANT",
      credits: amount,
      bucket: "MONTHLY",
      idempotencyKey: key,
      sourceType: "SUBSCRIPTION",
      sourceId: subscriptionId,
      expiresAt: periodEnd ? new Date(periodEnd) : null,
      reason: "Monthly plan credits",
      metadata: { periodStart: new Date(periodStart), periodEnd: periodEnd ? new Date(periodEnd) : null, grantedCredits: amount },
    });
  }

  async topUp(userId: string, amount: number, idempotencyKey?: string, reason = "Top-up") {
    if (amount <= 0) throw new BadRequestException("amount must be > 0");
    return this.writeTx({ userId, type: "TOP_UP", credits: amount, bucket: "TOPUP", idempotencyKey, reason });
  }

  async adminAdjust(userId: string, delta: number, reason: string, actor: string) {
    if (!reason) throw new BadRequestException("reason required");
    return this.writeTx({
      userId,
      type: "ADMIN_ADJUSTMENT",
      credits: delta,
      bucket: delta >= 0 ? "TOPUP" : "MONTHLY",
      reason,
      metadata: { actor },
    });
  }

  // D6 / Phase A (P2-P4): expire remaining monthly credits for a specific sold
  // period via an idempotent EXPIRATION ledger op. Re-running the worker never
  // double-expires. Records breakage in metadata for KPI aggregation.
  async expireSubscriptionPeriod(
    userId: string,
    subscriptionId: string,
    periodStart: Date,
    periodEnd?: Date | null,
  ) {
    const key = `subscription_expiry:${subscriptionId}:${new Date(periodStart).toISOString()}`;
    const existing = await this.txModel.findOne({ idempotencyKey: key }).lean();
    if (existing) return { skipped: true, duplicate: true, tx: existing };

    const grantKey = `subscription_credit_grant:${subscriptionId}:${new Date(periodStart).toISOString()}`;
    const grant: any = await this.txModel.findOne({ idempotencyKey: grantKey }).lean();
    const granted = Number(grant?.credits) || 0;

    const b = await this.bucketSums(userId);
    const remaining = Math.max(0, b.MONTHLY);
    if (remaining <= 0) {
      // Nothing to expire, but still write an idempotent zero-marker so KPI math
      // and re-runs are consistent (breakage = 0 for this period).
      return this.writeTx({
        userId,
        type: "EXPIRATION",
        credits: 0,
        bucket: "MONTHLY",
        idempotencyKey: key,
        sourceType: "SUBSCRIPTION",
        sourceId: subscriptionId,
        reason: "Monthly credits expired (none remaining)",
        metadata: { periodStart: new Date(periodStart), periodEnd: periodEnd || null, granted, breakageCredits: 0, usedCredits: granted },
      });
    }
    return this.writeTx({
      userId,
      type: "EXPIRATION",
      credits: -remaining,
      bucket: "MONTHLY",
      idempotencyKey: key,
      sourceType: "SUBSCRIPTION",
      sourceId: subscriptionId,
      reason: "Monthly credits expired at period end",
      metadata: {
        periodStart: new Date(periodStart),
        periodEnd: periodEnd || null,
        granted,
        breakageCredits: remaining,
        usedCredits: Math.max(0, granted - remaining),
      },
    });
  }

  // Back-compat wrapper (older callers). Expires the whole MONTHLY bucket
  // without period linkage (non-idempotent by period).
  async expireMonthly(userId: string, reason = "Monthly credits expired") {
    const b = await this.bucketSums(userId);
    if (b.MONTHLY <= 0) return { skipped: true };
    return this.writeTx({ userId, type: "EXPIRATION", credits: -b.MONTHLY, bucket: "MONTHLY", reason });
  }

  // D2/D3/D4: reserve with insufficient guard + idempotency
  async reserve(userId: string, operationType: string, estimatedCredits: number, idempotencyKey?: string) {
    if (idempotencyKey) {
      const existing = await this.resModel.findOne({ idempotencyKey }).lean();
      if (existing) return { reservation: existing, duplicate: true };
    }
    const bal = await this.getBalances(userId);
    if (bal.available < estimatedCredits) {
      throw new BadRequestException({ error: "insufficient_credits", available: bal.available, required: estimatedCredits });
    }
    try {
      const reservation = await this.resModel.create({
        userId: this.oid(userId),
        operationType,
        amount: estimatedCredits,
        status: "RESERVED",
        idempotencyKey: idempotencyKey || null,
      });
      return { reservation, duplicate: false };
    } catch (e: any) {
      if (e?.code === 11000) {
        const existing = await this.resModel.findOne({ idempotencyKey }).lean();
        return { reservation: existing, duplicate: true };
      }
      throw e;
    }
  }

  async capture(reservationId: string, actualCredits?: number, usage?: Partial<AiUsageEvent>) {
    const res: any = await this.resModel.findById(reservationId);
    if (!res) throw new NotFoundException("reservation not found");
    if (res.status === "CAPTURED") return { reservation: res, duplicate: true };
    if (res.status === "RELEASED") throw new BadRequestException("reservation already released");

    let actual = typeof actualCredits === "number" ? actualCredits : res.amount;
    if (actual < 0) actual = 0;
    if (actual > res.amount) actual = res.amount; // never exceed reservation

    // allocate monthly-first then topup
    const b = await this.bucketSums(String(res.userId));
    const monthlyPart = Math.min(actual, Math.max(0, b.MONTHLY));
    const topupPart = actual - monthlyPart;
    if (monthlyPart > 0) {
      await this.writeTx({
        userId: String(res.userId),
        type: "AI_USAGE",
        credits: -monthlyPart,
        bucket: "MONTHLY",
        sourceType: "RESERVATION",
        sourceId: String(res._id),
        reason: res.operationType,
      });
    }
    if (topupPart > 0) {
      await this.writeTx({
        userId: String(res.userId),
        type: "AI_USAGE",
        credits: -topupPart,
        bucket: "TOPUP",
        sourceType: "RESERVATION",
        sourceId: String(res._id),
        reason: res.operationType,
      });
    }
    res.status = "CAPTURED";
    res.capturedCredits = actual;
    await res.save();

    // NOTE (P2): AiUsageEvent telemetry is owned by FomoAiGateway, which writes
    // a single comprehensive event per execution. capture() only moves the
    // ledger. (Kept `usage` param for backward compat; no event is written here
    // to avoid duplicate telemetry.)
    void usage;
    return { reservation: res, capturedCredits: actual };
  }

  async release(reservationId: string, reason = "released") {
    const res: any = await this.resModel.findById(reservationId);
    if (!res) throw new NotFoundException("reservation not found");
    if (res.status === "RELEASED") return { reservation: res, duplicate: true };
    if (res.status === "CAPTURED") throw new BadRequestException("already captured");
    res.status = "RELEASED";
    res.reason = reason;
    await res.save();
    return { reservation: res };
  }

  // convenience for future FOMO AI pipeline: reserve+capture with rule cost
  async ruleCost(operationType: string): Promise<number> {
    const rule = await this.ruleModel.findOne({ operationType, active: true }).lean();
    return rule?.baseCredits ?? 1;
  }

  async listRules() {
    return this.ruleModel.find().sort({ baseCredits: 1 }).lean();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Phase A/B lifecycle aggregation (breakage / utilization / expiring KPIs).
  // All figures come from the ledger (single source of truth), never user.credits.
  // ─────────────────────────────────────────────────────────────────────────

  /** Global credit lifecycle totals across all users (real ledger). */
  async lifecycleTotals(): Promise<{
    grantedMonthly: number;
    grantedTopup: number;
    capturedMonthly: number;
    capturedTopup: number;
    expiredUnused: number;
    remaining: number;
    reserved: number;
    utilizationPct: number | null;
    breakagePct: number | null;
  }> {
    const rows = await this.txModel.aggregate([
      { $group: { _id: { type: "$type", bucket: "$bucket" }, sum: { $sum: "$credits" } } },
    ]);
    let grantedMonthly = 0, grantedTopup = 0, capturedMonthly = 0, capturedTopup = 0, expiredUnused = 0, remaining = 0;
    for (const r of rows) {
      const { type, bucket } = r._id;
      remaining += r.sum;
      if (type === "SUBSCRIPTION_GRANT") grantedMonthly += r.sum;
      else if (type === "TOP_UP" || type === "PROMO") grantedTopup += r.sum;
      else if (type === "AI_USAGE") { if (bucket === "TOPUP") capturedTopup += Math.abs(r.sum); else capturedMonthly += Math.abs(r.sum); }
      else if (type === "EXPIRATION") expiredUnused += Math.abs(r.sum);
    }
    const reservedAgg = await this.resModel.aggregate([
      { $match: { status: "RESERVED" } },
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]);
    const reserved = reservedAgg[0]?.sum || 0;
    const utilizationPct = grantedMonthly > 0 ? Math.round((capturedMonthly / grantedMonthly) * 10000) / 10000 : null;
    const breakagePct = grantedMonthly > 0 ? Math.round((expiredUnused / grantedMonthly) * 10000) / 10000 : null;
    return { grantedMonthly, grantedTopup, capturedMonthly, capturedTopup, expiredUnused, remaining, reserved, utilizationPct, breakagePct };
  }

  /** Monthly credits still available and expiring within `days` days. */
  async expiringWithin(days: number): Promise<{ credits: number; users: number }> {
    const now = new Date();
    const until = new Date(now.getTime() + days * 86400000);
    // Per-user remaining MONTHLY bucket where the active grant expires in window.
    const grants = await this.txModel.aggregate([
      { $match: { type: "SUBSCRIPTION_GRANT", expiresAt: { $gte: now, $lte: until } } },
      { $group: { _id: "$userId" } },
    ]);
    let credits = 0;
    const users = grants.length;
    for (const g of grants) {
      const b = await this.bucketSums(String(g._id));
      credits += Math.max(0, b.MONTHLY);
    }
    return { credits, users };
  }

  /** Per-user monthly utilization for the active period (for user analytics). */
  async userLifecycle(userId: string): Promise<{
    grantedMonthly: number; capturedMonthly: number; expiredUnused: number; utilizationPct: number | null;
    expiresAt: Date | null; expiring7dCredits: number; expiring30dCredits: number;
  }> {
    const rows = await this.txModel.aggregate([
      { $match: { userId: this.oid(userId) } },
      { $group: { _id: "$type", sum: { $sum: "$credits" }, maxExp: { $max: "$expiresAt" } } },
    ]);
    let grantedMonthly = 0, capturedMonthly = 0, expiredUnused = 0, expiresAt: Date | null = null;
    for (const r of rows) {
      if (r._id === "SUBSCRIPTION_GRANT") { grantedMonthly += r.sum; if (r.maxExp) expiresAt = r.maxExp; }
      else if (r._id === "EXPIRATION") expiredUnused += Math.abs(r.sum);
    }
    const usageRows = await this.txModel.aggregate([
      { $match: { userId: this.oid(userId), type: "AI_USAGE", bucket: "MONTHLY" } },
      { $group: { _id: null, sum: { $sum: "$credits" } } },
    ]);
    capturedMonthly = Math.abs(usageRows[0]?.sum || 0);
    const b = await this.bucketSums(userId);
    const remainingMonthly = Math.max(0, b.MONTHLY);
    const now = new Date();
    const in7 = expiresAt && expiresAt <= new Date(now.getTime() + 7 * 86400000) && expiresAt >= now;
    const in30 = expiresAt && expiresAt <= new Date(now.getTime() + 30 * 86400000) && expiresAt >= now;
    const utilizationPct = grantedMonthly > 0 ? Math.round((capturedMonthly / grantedMonthly) * 10000) / 10000 : null;
    return {
      grantedMonthly, capturedMonthly, expiredUnused, utilizationPct, expiresAt,
      expiring7dCredits: in7 ? remainingMonthly : 0,
      expiring30dCredits: in30 ? remainingMonthly : 0,
    };
  }
}
