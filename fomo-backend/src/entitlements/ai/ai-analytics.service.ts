import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AiUsageEvent } from "../models/ai-credit.model";
import { Subscription } from "../models/subscription.model";
import { AiCreditsService } from "../ai-credits.service";
import { CreditPricingService } from "./credit-pricing.service";

const r6 = (v: number) => Math.round((Number(v) || 0) * 1e6) / 1e6;
const r4 = (v: number) => Math.round((Number(v) || 0) * 1e4) / 1e4;

/** Nearest-rank percentile. Returns null for empty input. */
function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  const idx = Math.min(sorted.length - 1, Math.max(0, rank - 1));
  return sorted[idx];
}
function avg(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/**
 * AiAnalyticsService (Phase B/C). Single backend read-model that aggregates the
 * REAL ledger (AiUsageEvent + AiCreditTransaction + Subscription economics
 * snapshots) into the Economics Dashboard, provider/operation analytics
 * (true p50/p95, not averages) and the per-user AI table. Mock/demo data is
 * never mixed into COGS / margin / percentiles / pricing-health.
 */
@Injectable()
export class AiAnalyticsService {
  constructor(
    @InjectModel(AiUsageEvent.name) private readonly usageModel: Model<any>,
    @InjectModel(Subscription.name) private readonly subModel: Model<any>,
    private readonly credits: AiCreditsService,
    private readonly creditPricing: CreditPricingService,
  ) {}

  private realMatch(extra: Record<string, any> = {}) {
    return { status: "COMPLETED", dataMode: "real", ...extra };
  }

  /** Observed real avg all-in cost per operation (capacity math for simulator). */
  async observedOpAvgCosts(): Promise<Array<{ operation: string; avgCostUsd: number; samples: number }>> {
    const rows = await this.usageModel.aggregate([
      { $match: this.realMatch({ costStatus: "REAL", totalCostUsd: { $gt: 0 } }) },
      { $group: { _id: "$operationType", avgCostUsd: { $avg: "$totalCostUsd" }, samples: { $sum: 1 } } },
      { $project: { _id: 0, operation: "$_id", avgCostUsd: 1, samples: 1 } },
    ]);
    return (rows || []).map((r: any) => ({ operation: r.operation, avgCostUsd: r6(r.avgCostUsd), samples: r.samples }));
  }

  /** Provider/model analytics — real requests only, true percentiles. */
  async providerAnalytics(days = 30) {
    const since = new Date(Date.now() - days * 86400000);
    const events = await this.usageModel
      .find(this.realMatch({ createdAt: { $gte: since } }))
      .select({ modelProvider: 1, model: 1, inputTokens: 1, outputTokens: 1, totalCostUsd: 1, latencyMs: 1, status: 1 })
      .lean();
    const failed = await this.usageModel.aggregate([
      { $match: { dataMode: "real", status: "FAILED", createdAt: { $gte: since } } },
      { $group: { _id: { p: "$modelProvider", m: "$model" }, failed: { $sum: 1 } } },
    ]);
    const failMap: Record<string, number> = {};
    failed.forEach((f: any) => (failMap[`${f._id.p}|${f._id.m}`] = f.failed));

    const groups: Record<string, any[]> = {};
    for (const e of events) {
      const key = `${e.modelProvider}|${e.model}`;
      (groups[key] || (groups[key] = [])).push(e);
    }
    return Object.entries(groups).map(([key, list]) => {
      const [provider, model] = key.split("|");
      const costs = list.map((e) => Number(e.totalCostUsd) || 0);
      const lat = list.map((e) => Number(e.latencyMs) || 0);
      const failedCount = failMap[key] || 0;
      const total = list.length + failedCount;
      return {
        provider,
        model,
        requests: list.length,
        failed: failedCount,
        errorRatePct: total ? r4(failedCount / total) : 0,
        inputTokens: list.reduce((s, e) => s + (Number(e.inputTokens) || 0), 0),
        outputTokens: list.reduce((s, e) => s + (Number(e.outputTokens) || 0), 0),
        costUsd: { total: r6(costs.reduce((a, b) => a + b, 0)), avg: r6(avg(costs) || 0), p50: r6(percentile(costs, 50) || 0), p95: r6(percentile(costs, 95) || 0) },
        latencyMs: { p50: Math.round(percentile(lat, 50) || 0), p95: Math.round(percentile(lat, 95) || 0) },
      };
    });
  }

  /** Operation analytics + pricing health (Phase B / P12-P14). */
  async operationAnalytics(days = 30) {
    const since = new Date(Date.now() - days * 86400000);
    const econ = await this.creditPricing.getEconomics();
    const budget = this.creditPricing.deriveBudget(econ);
    const maxCostPerCredit = budget.maxCostPerCreditUsd;

    const events = await this.usageModel
      .find(this.realMatch({ billingContext: "USER", createdAt: { $gte: since } }))
      .select({ operationType: 1, userId: 1, inputTokens: 1, outputTokens: 1, totalCostUsd: 1, latencyMs: 1, creditsCaptured: 1, creditsReserved: 1, creditsReleased: 1, costStatus: 1 })
      .lean();
    const failed = await this.usageModel.aggregate([
      { $match: { dataMode: "real", billingContext: "USER", status: "FAILED", createdAt: { $gte: since } } },
      { $group: { _id: "$operationType", failed: { $sum: 1 } } },
    ]);
    const failMap: Record<string, number> = {};
    failed.forEach((f: any) => (failMap[f._id] = f.failed));

    const groups: Record<string, any[]> = {};
    for (const e of events) (groups[e.operationType] || (groups[e.operationType] = [])).push(e);

    return Object.entries(groups).map(([operation, list]) => {
      const credits = list.map((e) => Number(e.creditsCaptured) || 0);
      const costs = list.map((e) => Number(e.totalCostUsd) || 0);
      const lat = list.map((e) => Number(e.latencyMs) || 0);
      const released = list.filter((e) => (Number(e.creditsReleased) || 0) > 0).length;
      const users = new Set(list.map((e) => String(e.userId))).size;
      const failedCount = failMap[operation] || 0;
      const successful = list.length;
      const avgCharged = avg(credits) || 0;
      const avgAllIn = avg(costs) || 0;
      const priced = list.filter((e) => e.costStatus === "REAL").length;

      // Pricing health: is the average all-in cost within the economic budget of
      // the credits we actually charge? (EconomicCreditBudget = avgCharged * maxCostPerCredit)
      const economicCreditBudget = avgCharged * maxCostPerCredit;
      let pricingHealth: "HEALTHY" | "BELOW_TARGET" | "UNPRICED" | "INSUFFICIENT_SAMPLE";
      if (successful < 30) pricingHealth = "INSUFFICIENT_SAMPLE";
      else if (priced === 0 || avgAllIn <= 0) pricingHealth = "UNPRICED";
      else if (avgAllIn > economicCreditBudget) pricingHealth = "BELOW_TARGET";
      else pricingHealth = "HEALTHY";

      // Reserve estimate source (Phase B / P14): historical p95 after >=30 samples.
      const estimateSource = successful >= 30 ? "historical_p95" : "configured_baseline";

      return {
        operation,
        requests: successful,
        failed: failedCount,
        uniqueUsers: users,
        successRatePct: successful + failedCount > 0 ? r4(successful / (successful + failedCount)) : 1,
        releaseRatePct: successful ? r4(released / successful) : 0,
        avgInputTokens: Math.round(avg(list.map((e) => Number(e.inputTokens) || 0)) || 0),
        avgOutputTokens: Math.round(avg(list.map((e) => Number(e.outputTokens) || 0)) || 0),
        credits: { avg: r4(avgCharged), p50: r4(percentile(credits, 50) || 0), p95: r4(percentile(credits, 95) || 0) },
        costUsd: { total: r6(costs.reduce((a, b) => a + b, 0)), avg: r6(avgAllIn), p50: r6(percentile(costs, 50) || 0), p95: r6(percentile(costs, 95) || 0) },
        latencyMs: { p50: Math.round(percentile(lat, 50) || 0), p95: Math.round(percentile(lat, 95) || 0) },
        economicCreditBudgetUsd: r6(economicCreditBudget),
        maxCostPerCreditUsd: maxCostPerCredit,
        pricingHealth,
        estimateSource,
      };
    });
  }

  /** Requests time-series (real, per day) for dashboard charts. */
  private async timeseries(days: number) {
    const since = new Date(Date.now() - days * 86400000);
    const rows = await this.usageModel.aggregate([
      { $match: this.realMatch({ createdAt: { $gte: since } }) },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          requests: { $sum: 1 },
          creditsCaptured: { $sum: "$creditsCaptured" },
          cogsUsd: { $sum: "$totalCostUsd" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    return rows.map((r: any) => ({ date: r._id, requests: r.requests, credits: r.creditsCaptured, cogsUsd: r6(r.cogsUsd) }));
  }

  /** Estimated plan economics from ACTIVE subscription snapshots (not realized revenue). */
  private async estimatedEconomics() {
    const subs = await this.subModel
      .find({ status: { $in: ["ACTIVE", "GRACE_PERIOD"] }, productType: "FOMO_AI" })
      .select({ economicsSnapshot: 1, planSnapshot: 1 })
      .lean();
    let estimatedPlanValueUsd = 0;
    let estimatedNetPlanValueUsd = 0;
    for (const s of subs) {
      const snap = s.economicsSnapshot;
      if (snap) {
        estimatedPlanValueUsd += Number(snap.priceUsd) || 0;
        estimatedNetPlanValueUsd += Number(snap.netPlanValueUsd) || 0;
      } else {
        estimatedPlanValueUsd += Number(s.planSnapshot?.priceUsd) || 0;
      }
    }
    return { subs: subs.length, estimatedPlanValueUsd: r6(estimatedPlanValueUsd), estimatedNetPlanValueUsd: r6(estimatedNetPlanValueUsd) };
  }

  /** Full Economics Dashboard read-model (Phase B / P7-P10). */
  async dashboard(days = 30) {
    const now = Date.now();
    const since = new Date(now - days * 86400000);
    const startToday = new Date(); startToday.setHours(0, 0, 0, 0);
    const since7 = new Date(now - 7 * 86400000);

    const [reqAgg, active30, cogsAgg, lifecycle, exp7, exp30, est, providers, operations, series] = await Promise.all([
      this.usageModel.aggregate([
        { $match: { dataMode: "real", createdAt: { $gte: since } } },
        { $group: { _id: "$status", c: { $sum: 1 } } },
      ]),
      this.usageModel.distinct("userId", { dataMode: "real", createdAt: { $gte: since } }),
      this.usageModel.aggregate([
        { $match: this.realMatch({ costStatus: "REAL", createdAt: { $gte: since } }) },
        { $group: { _id: null, providerCogs: { $sum: "$providerCostUsd" }, allIn: { $sum: "$totalCostUsd" } } },
      ]),
      this.credits.lifecycleTotals(),
      this.credits.expiringWithin(7),
      this.credits.expiringWithin(30),
      this.estimatedEconomics(),
      this.providerAnalytics(days),
      this.operationAnalytics(days),
      this.timeseries(days),
    ]);

    const [today, last7, last30] = await Promise.all([
      this.usageModel.countDocuments({ dataMode: "real", createdAt: { $gte: startToday } }),
      this.usageModel.countDocuments({ dataMode: "real", createdAt: { $gte: since7 } }),
      this.usageModel.countDocuments({ dataMode: "real", createdAt: { $gte: since } }),
    ]);
    const membershipUsers = await this.subModel.countDocuments({ status: { $in: ["ACTIVE", "GRACE_PERIOD"] }, productType: "FOMO_AI" });

    let successful = 0, failed = 0;
    for (const r of reqAgg) { if (r._id === "COMPLETED") successful += r.c; else if (r._id === "FAILED") failed += r.c; }
    const totalReq = successful + failed;

    const realProviderCogsUsd = r6(cogsAgg[0]?.providerCogs || 0);
    const allInCogsUsd = r6(cogsAgg[0]?.allIn || 0);
    const estimatedGrossProfitUsd = est.estimatedNetPlanValueUsd > 0 ? r6(est.estimatedNetPlanValueUsd - allInCogsUsd) : null;
    const estimatedGrossMarginPct =
      est.estimatedNetPlanValueUsd > 0 ? r4((est.estimatedNetPlanValueUsd - allInCogsUsd) / est.estimatedNetPlanValueUsd) : null;

    return {
      window: { days, from: since, to: new Date() },
      users: { active30d: active30.length, membershipUsers },
      requests: {
        today, sevenDays: last7, thirtyDays: last30,
        successful, failed,
        successRatePct: totalReq ? r4(successful / totalReq) : null,
      },
      credits: {
        granted: lifecycle.grantedMonthly + lifecycle.grantedTopup,
        grantedMonthly: lifecycle.grantedMonthly,
        spent: lifecycle.capturedMonthly + lifecycle.capturedTopup,
        remaining: lifecycle.remaining,
        reserved: lifecycle.reserved,
        expiring7d: exp7,
        expiring30d: exp30,
        expiredUnused: lifecycle.expiredUnused,
        utilizationPct: lifecycle.utilizationPct,
        breakagePct: lifecycle.breakagePct,
      },
      costs: {
        realProviderCogsUsd,
        allInCogsUsd,
        note: "Real provider COGS from real completed requests only. Mock/demo excluded.",
      },
      economics: {
        estimatedPlanValueUsd: est.estimatedPlanValueUsd,
        estimatedNetPlanValueUsd: est.estimatedNetPlanValueUsd,
        estimatedGrossProfitUsd,
        estimatedGrossMarginPct,
        realizedRevenueUsd: null,
        note: "Realized revenue is null until crypto checkout is connected. Estimated plan value is derived from ACTIVE subscription economics snapshots.",
      },
      providers,
      operations,
      timeseries: series,
      hasRealData: last30 > 0,
    };
  }

  /** Per-user AI table for the Users Analytics screen (Phase C / P15). */
  async usersList(limit = 100) {
    const since = new Date(Date.now() - 30 * 86400000);
    // Users who have real usage OR an active FOMO AI subscription.
    const usageUsers = await this.usageModel.aggregate([
      { $match: { dataMode: "real", createdAt: { $gte: since } } },
      { $group: { _id: "$userId", requests30d: { $sum: 1 }, cogs30d: { $sum: "$providerCostUsd" }, spent30d: { $sum: "$creditsCaptured" }, lastAt: { $max: "$createdAt" } } },
      { $sort: { requests30d: -1 } },
      { $limit: limit },
    ]);
    const subs = await this.subModel
      .find({ status: { $in: ["ACTIVE", "GRACE_PERIOD"] }, productType: "FOMO_AI" })
      .select({ userId: 1, planSnapshot: 1, currentPeriodEnd: 1, economicsSnapshot: 1, status: 1 })
      .lean();
    const subByUser: Record<string, any> = {};
    subs.forEach((s: any) => (subByUser[String(s.userId)] = s));

    // Merge the two sources.
    const ids = new Set<string>();
    usageUsers.forEach((u: any) => ids.add(String(u._id)));
    subs.forEach((s: any) => ids.add(String(s.userId)));
    const usageByUser: Record<string, any> = {};
    usageUsers.forEach((u: any) => (usageByUser[String(u._id)] = u));

    const userDocs = await this.usageModel.db
      .collection("users")
      .find({ _id: { $in: Array.from(ids).filter((x) => Types.ObjectId.isValid(x)).map((x) => new Types.ObjectId(x)) } })
      .project({ email: 1, wallet: 1, username: 1 })
      .toArray();
    const userInfo: Record<string, any> = {};
    userDocs.forEach((u: any) => (userInfo[String(u._id)] = u));

    const rows: any[] = [];
    for (const id of ids) {
      const u = usageByUser[id] || {};
      const sub = subByUser[id];
      const [balances, lc] = await Promise.all([
        this.credits.getBalances(id).catch(() => null),
        this.credits.userLifecycle(id).catch(() => null),
      ]);
      rows.push({
        userId: id,
        email: userInfo[id]?.email || "",
        wallet: userInfo[id]?.wallet || "",
        membership: sub ? (sub.planSnapshot?.name || sub.planSnapshot?.code || "FOMO AI") : "—",
        periodEnd: sub?.currentPeriodEnd || null,
        granted: lc?.grantedMonthly ?? 0,
        spent: lc?.capturedMonthly ?? 0,
        remaining: balances?.available ?? 0,
        reserved: balances?.reserved ?? 0,
        utilizationPct: lc?.utilizationPct ?? null,
        requests30d: u.requests30d || 0,
        cogs30dUsd: r6(u.cogs30d || 0),
        planValueUsd: sub?.economicsSnapshot ? Number(sub.economicsSnapshot.priceUsd) : (sub ? Number(sub.planSnapshot?.priceUsd) || null : null),
        netPlanValueUsd: sub?.economicsSnapshot ? Number(sub.economicsSnapshot.netPlanValueUsd) : null,
        estProfitUsd: sub?.economicsSnapshot ? r6(Number(sub.economicsSnapshot.netPlanValueUsd) - r6(u.cogs30d || 0)) : null,
        estMarginPct: sub?.economicsSnapshot && Number(sub.economicsSnapshot.netPlanValueUsd) > 0
          ? r4((Number(sub.economicsSnapshot.netPlanValueUsd) - r6(u.cogs30d || 0)) / Number(sub.economicsSnapshot.netPlanValueUsd))
          : null,
        expiring7dCredits: lc?.expiring7dCredits ?? 0,
        lastRequestAt: u.lastAt || null,
      });
    }
    rows.sort((a, b) => (b.requests30d || 0) - (a.requests30d || 0));
    return { items: rows, total: rows.length };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Phase F (P58-P66): per-user AI economics — the client-level P&L chain:
  // plan value → net plan value → FOMO credits → provider tokens → real COGS →
  // estimated contribution profit & margin (+ projected), with provider/model/
  // operation breakdown. Estimated until crypto checkout exists.
  // ─────────────────────────────────────────────────────────────────────────
  async userEconomics(userId: string) {
    const sub: any = await this.subModel
      .findOne({ userId: this.oidSafe(userId), status: { $in: ["ACTIVE", "GRACE_PERIOD"] }, productType: "FOMO_AI" })
      .sort({ currentPeriodEnd: -1 })
      .lean();

    const econGlobal = await this.creditPricing.getEconomics();
    const budgetGlobal = this.creditPricing.deriveBudget(econGlobal);
    const snap = sub?.economicsSnapshot || null;
    const priceUsd = snap ? Number(snap.priceUsd) : (sub ? Number(sub.planSnapshot?.priceUsd) || null : null);
    const netPlanValueUsd = snap ? Number(snap.netPlanValueUsd) : (priceUsd != null ? priceUsd * (1 - econGlobal.paymentFeeReservePct - econGlobal.infraReservePct) : null);
    const allowedAiCogsUsd = snap ? Number(snap.allowedAiCogsUsd) : budgetGlobal.allowedAiCostUsd;

    const periodStart = sub?.currentPeriodStart ? new Date(sub.currentPeriodStart) : new Date(Date.now() - 30 * 86400000);
    const periodEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : new Date();

    const [balances, lifecycle] = await Promise.all([
      this.credits.getBalances(userId).catch(() => null),
      this.credits.userLifecycle(userId).catch(() => null),
    ]);

    // Real provider usage within the current period.
    const match = this.realMatch({ userId: this.oidSafe(userId), billingContext: "USER", createdAt: { $gte: periodStart } });
    const usageAgg = await this.usageModel.aggregate([
      { $match: match },
      { $group: { _id: null, requests: { $sum: 1 }, inputTokens: { $sum: "$inputTokens" }, outputTokens: { $sum: "$outputTokens" }, totalTokens: { $sum: "$totalTokens" }, cogs: { $sum: "$providerCostUsd" } } },
    ]);
    const u = usageAgg[0] || {};
    const realProviderCogsUsd = r6(u.cogs || 0);

    const providerBreak = await this.groupBreakdown(match, "modelProvider");
    const modelBreak = await this.groupBreakdown(match, "model");
    const operationBreak = await this.groupBreakdown(match, "operationType", true);

    // Contribution economics.
    const estimatedContributionProfitUsd = netPlanValueUsd != null ? r6(netPlanValueUsd - realProviderCogsUsd) : null;
    const estimatedContributionMarginPct = netPlanValueUsd && netPlanValueUsd > 0 ? r4((netPlanValueUsd - realProviderCogsUsd) / netPlanValueUsd) : null;

    // Projection based on elapsed period days.
    const now = Date.now();
    const elapsedDays = Math.max(0.5, (Math.min(now, periodEnd.getTime()) - periodStart.getTime()) / 86400000);
    const periodDays = Math.max(1, (periodEnd.getTime() - periodStart.getTime()) / 86400000);
    const projectedCogsUsd = elapsedDays > 0 ? r6((realProviderCogsUsd / elapsedDays) * periodDays) : realProviderCogsUsd;
    const projectedMarginPct = netPlanValueUsd && netPlanValueUsd > 0 ? r4((netPlanValueUsd - projectedCogsUsd) / netPlanValueUsd) : null;
    const overBudget = realProviderCogsUsd > allowedAiCogsUsd;
    const projectedOverBudget = projectedCogsUsd > allowedAiCogsUsd;

    // Phase H (H29): realized revenue from SETTLED purchases in this period links
    // Money -> AI economics (Estimated -> Real).
    let realizedRevenueUsd: number | null = null;
    try {
      const paid = await this.usageModel.db.collection("money_purchases").aggregate([
        { $match: { userId: this.oidSafe(userId), status: "SETTLED", settledAt: { $gte: periodStart } } },
        { $group: { _id: null, sum: { $sum: "$amount" } } },
      ]).toArray();
      realizedRevenueUsd = paid.length ? r6(paid[0].sum) : 0;
    } catch { realizedRevenueUsd = null; }
    const realContributionProfitUsd = realizedRevenueUsd != null && realizedRevenueUsd > 0
      ? r6((netPlanValueUsd ?? realizedRevenueUsd) - realProviderCogsUsd) : null;
    // Margin = contribution / realized revenue (contribution already uses net plan value).
    const realContributionMarginPct = realizedRevenueUsd != null && realizedRevenueUsd > 0 && realContributionProfitUsd != null
      ? r4(realContributionProfitUsd / realizedRevenueUsd) : null;

    // H37: canonical human-readable profitability status (money realized vs real AI COGS).
    // Same realized-based logic as MoneyService.profitabilityStatus for cross-screen consistency.
    const targetMarginPct = 0.5;
    let profitabilityStatus: string;
    if ((realizedRevenueUsd ?? 0) <= 0) {
      profitabilityStatus = (realProviderCogsUsd > 0 || !!sub) ? "NO_PAID_REVENUE" : "NO_ACTIVITY";
    } else {
      const m = realContributionMarginPct ?? ((realizedRevenueUsd! - realProviderCogsUsd) / realizedRevenueUsd!);
      profitabilityStatus = m < 0 ? "OVER_TARGET_COGS" : m < targetMarginPct ? "AT_RISK" : "HEALTHY";
    }

    return {
      userId,
      period: { start: periodStart, end: periodEnd },
      subscription: sub
        ? { product: sub.planSnapshot?.name || "FOMO AI Membership", status: sub.status, planValueUsd: priceUsd, netPlanValueUsd, allowedAiCogsUsd, realizedRevenueUsd, hasSnapshot: !!snap }
        : null,
      fomoCredits: {
        granted: lifecycle?.grantedMonthly ?? 0,
        spent: lifecycle?.capturedMonthly ?? 0,
        remaining: balances?.available ?? 0,
        reserved: balances?.reserved ?? 0,
        expired: lifecycle?.expiredUnused ?? 0,
        utilizationPct: lifecycle?.utilizationPct ?? null,
      },
      providerUsage: {
        requests: u.requests || 0,
        inputTokens: u.inputTokens || 0,
        outputTokens: u.outputTokens || 0,
        totalTokens: u.totalTokens || 0,
        providerCogsUsd: realProviderCogsUsd,
      },
      economics: {
        netPlanValueUsd,
        realProviderCogsUsd,
        estimatedContributionProfitUsd,
        estimatedContributionMarginPct,
        allowedAiCogsUsd,
        overBudget,
        overBudgetUsd: overBudget ? r6(realProviderCogsUsd - allowedAiCogsUsd) : 0,
        projectedCogsUsd,
        projectedMarginPct,
        projectedOverBudget,
        realizedRevenueUsd,
        realContributionProfitUsd,
        realContributionMarginPct,
        profitabilityStatus,
        targetMarginPct,
        note: "Estimated contribution uses net plan value; realizedRevenueUsd/realContribution appear once a SETTLED purchase exists (checkout).",
      },
      breakdown: { providers: providerBreak, models: modelBreak, operations: operationBreak },
    };
  }

  private oidSafe(id: string): any {
    try { return new Types.ObjectId(id); } catch { return id; }
  }

  private async groupBreakdown(match: any, field: string, withCredits = false) {
    const grp: any = { _id: `$${field}`, requests: { $sum: 1 }, cogs: { $sum: "$providerCostUsd" }, tokens: { $sum: "$totalTokens" } };
    if (withCredits) grp.credits = { $sum: "$creditsCaptured" };
    const rows = await this.usageModel.aggregate([{ $match: match }, { $group: grp }, { $sort: { requests: -1 } }]);
    return rows.map((r: any) => ({ key: r._id || "unknown", requests: r.requests, tokens: r.tokens || 0, cogsUsd: r6(r.cogs || 0), ...(withCredits ? { credits: r.credits || 0 } : {}) }));
  }
}
