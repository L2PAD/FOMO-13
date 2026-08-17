import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, isValidObjectId } from "mongoose";
import { Subscription } from "../models/subscription.model";
import { AiProviderPricingService } from "./ai-provider-pricing.service";

export interface CreditComputation {
  credits: number;
  pricingMode: string;
  revenuePerCreditUsd: number;
  maxCostPerCreditUsd: number;
  protectedCostUsd: number;
  variableCredits: number;
  baseCredits: number;
  clampedByMin: boolean;
  clampedByMax: boolean;
  note: string;
}

export interface AiProductEconomics {
  priceUsd: number;
  periodDays: number;
  includedCredits: number;
  targetGrossMarginPct: number;
  paymentFeeReservePct: number;
  infraReservePct: number;
  creditSafetyFactor: number;
}

export interface EconomicsBudget {
  netRevenueUsd: number;
  allowedAiCostUsd: number;
  maxCostPerCreditUsd: number;
}

export interface EconomicsSimulation extends AiProductEconomics {
  budget: EconomicsBudget;
  expectedUtilizationPct: number;
  expectedConsumedCredits: number;
  expectedAiCogsUsd: number;
  estimatedGrossProfitUsd: number;
  estimatedGrossMarginPct: number;
  worstCaseAiCogsUsd: number;
  worstCaseGrossMarginPct: number;
  capacity: Array<{ operation: string; avgCostUsd: number; approxRequests: number }>;
  note: string;
}

const round = (v: number, p = 8) => Math.round((Number(v) || 0) * 10 ** p) / 10 ** p;

/**
 * CreditPricingService (P6). Converts a USD cost into user-facing credits.
 *
 * Two layers are kept strictly separate:
 *   1) Internal money economics = real provider cost (USD).
 *   2) User-facing credits (what a subscriber's balance is measured in).
 *
 * RevenuePerCredit is derived from the user's ACTIVE subscription plan snapshot
 * (planPrice / includedCredits). With a target markup, MaxCostPerCredit is the
 * ceiling cost we allow a single credit to represent. Credits for a request are
 * ceil(protectedCost / MaxCostPerCredit), clamped to [minCredits, maxCredits].
 *
 * Credit SOURCE (subscription / topup / promo) never changes this math — the
 * request economics are always measured against real provider cost.
 */
@Injectable()
export class CreditPricingService {
  constructor(
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<any>,
    private readonly pricing: AiProviderPricingService,
  ) {}

  /**
   * Phase A / P1: build the immutable economics snapshot for a sold period from
   * the plan snapshot (price/credits) + current global reserves/margin.
   */
  async buildEconomicsSnapshot(
    planSnapshot: any,
    period?: { start?: Date | null; end?: Date | null },
  ): Promise<Record<string, any>> {
    const g = await this.getEconomics();
    const priceUsd = Number(planSnapshot?.priceUsd) || 0;
    const creditsGranted = Number(planSnapshot?.aiCredits ?? planSnapshot?.aiCreditsIncluded) || 0;
    const econ: AiProductEconomics = { ...g, priceUsd, includedCredits: creditsGranted };
    const budget = this.deriveBudget(econ);
    return {
      priceUsd,
      creditsGranted,
      paymentReservePct: g.paymentFeeReservePct,
      infraReservePct: g.infraReservePct,
      targetGrossMarginPct: g.targetGrossMarginPct,
      netPlanValueUsd: budget.netRevenueUsd,
      allowedAiCogsUsd: budget.allowedAiCostUsd,
      maxCostPerCreditUsd: budget.maxCostPerCreditUsd,
      economicsConfigVersion: 1,
      periodStart: period?.start || null,
      periodEnd: period?.end || null,
      createdAt: new Date(),
    };
  }

  /** Read product unit-economics from global settings (editable, no hardcode). */
  async getEconomics(): Promise<AiProductEconomics> {
    const s = await this.pricing.getSettings();
    return {
      priceUsd: Number(s.aiProductPriceUsd) || 0,
      periodDays: Number(s.aiProductPeriodDays) || 30,
      includedCredits: Number(s.aiProductIncludedCredits) || 0,
      targetGrossMarginPct: Number(s.targetGrossMarginPct) || 0,
      paymentFeeReservePct: Number(s.paymentFeeReservePct) || 0,
      infraReservePct: Number(s.infraReservePct) || 0,
      creditSafetyFactor: Number(s.creditSafetyFactor) || 1.1,
    };
  }

  /**
   * Spec §7–11: subscription revenue → allowed AI COGS → max provider cost per credit.
   *   NetRevenue      = Price × (1 - Fp - Fi)
   *   AllowedAiCost   = NetRevenue × (1 - G)
   *   MaxCostPerCredit= AllowedAiCost / IncludedCredits
   */
  deriveBudget(econ: AiProductEconomics): EconomicsBudget {
    const price = Math.max(0, Number(econ.priceUsd) || 0);
    const fp = Math.min(0.99, Math.max(0, Number(econ.paymentFeeReservePct) || 0));
    const fi = Math.min(0.99, Math.max(0, Number(econ.infraReservePct) || 0));
    const g = Math.min(0.99, Math.max(0, Number(econ.targetGrossMarginPct) || 0));
    const included = Math.max(1, Number(econ.includedCredits) || 1);
    const netRevenueUsd = price * Math.max(0, 1 - fp - fi);
    const allowedAiCostUsd = netRevenueUsd * Math.max(0, 1 - g);
    const maxCostPerCreditUsd = allowedAiCostUsd / included;
    return {
      netRevenueUsd: round(netRevenueUsd, 6),
      allowedAiCostUsd: round(allowedAiCostUsd, 6),
      maxCostPerCreditUsd: round(maxCostPerCreditUsd, 8),
    };
  }

  /**
   * Per-user MaxCostPerCredit. Prefers the subscription's frozen economicsSnapshot
   * (spec §58: sold periods keep their economics), else the global product economics.
   */
  async deriveMaxCostPerCredit(userId: string): Promise<{ value: number; source: string }> {
    if (userId && isValidObjectId(userId)) {
      const sub: any = await this.subscriptionModel
        .findOne({ userId: new Types.ObjectId(userId), status: { $in: ["ACTIVE", "GRACE_PERIOD"] } })
        .sort({ currentPeriodEnd: -1 })
        .lean();
      const snap = sub?.economicsSnapshot;
      if (snap && Number(snap.maxCostPerCreditUsd) > 0) {
        return { value: Number(snap.maxCostPerCreditUsd), source: "subscription_snapshot" };
      }
    }
    const econ = await this.getEconomics();
    const budget = this.deriveBudget(econ);
    if (budget.maxCostPerCreditUsd > 0) return { value: budget.maxCostPerCreditUsd, source: "global_economics" };
    return { value: 0.0245, source: "fallback_default" };
  }

  /**
   * Economics simulator (spec §53–56). Pure math; каждый результат — прогноз.
   * `opsAvgCosts` — реальные средние provider-cost по операциям для capacity.
   */
  simulate(
    input: Partial<AiProductEconomics> & { expectedUtilizationPct?: number },
    opsAvgCosts: Array<{ operation: string; avgCostUsd: number }> = [],
  ): EconomicsSimulation {
    const econ: AiProductEconomics = {
      priceUsd: Number(input.priceUsd) || 0,
      periodDays: Number(input.periodDays) || 30,
      includedCredits: Number(input.includedCredits) || 0,
      targetGrossMarginPct: Number(input.targetGrossMarginPct) || 0,
      paymentFeeReservePct: Number(input.paymentFeeReservePct) || 0,
      infraReservePct: Number(input.infraReservePct) || 0,
      creditSafetyFactor: Number(input.creditSafetyFactor) || 1.1,
    };
    const budget = this.deriveBudget(econ);
    const util = Math.min(1, Math.max(0, Number(input.expectedUtilizationPct ?? 0.7)));
    const expectedConsumedCredits = Math.round(econ.includedCredits * util);
    const expectedAiCogsUsd = round(expectedConsumedCredits * budget.maxCostPerCreditUsd, 6);
    const estimatedGrossProfitUsd = round(budget.netRevenueUsd - expectedAiCogsUsd, 6);
    const estimatedGrossMarginPct =
      budget.netRevenueUsd > 0 ? round(estimatedGrossProfitUsd / budget.netRevenueUsd, 6) : 0;
    const worstCaseAiCogsUsd = round(econ.includedCredits * budget.maxCostPerCreditUsd, 6);
    const worstGrossProfit = budget.netRevenueUsd - worstCaseAiCogsUsd;
    const worstCaseGrossMarginPct =
      budget.netRevenueUsd > 0 ? round(worstGrossProfit / budget.netRevenueUsd, 6) : 0;
    const capacity = (opsAvgCosts || [])
      .filter((o) => Number(o.avgCostUsd) > 0)
      .map((o) => ({
        operation: o.operation,
        avgCostUsd: round(o.avgCostUsd, 6),
        approxRequests: Math.floor(budget.allowedAiCostUsd / Number(o.avgCostUsd)),
      }));
    return {
      ...econ,
      budget,
      expectedUtilizationPct: util,
      expectedConsumedCredits,
      expectedAiCogsUsd,
      estimatedGrossProfitUsd,
      estimatedGrossMarginPct,
      worstCaseAiCogsUsd,
      worstCaseGrossMarginPct,
      capacity,
      note: "Прогноз (simulation). Реальные значения появятся после реальных оплат и usage.",
    };
  }

  /** RevenuePerCredit from the user's active subscription plan, else global default. */
  async revenuePerCredit(userId: string): Promise<{ value: number; planId: string | null; subscriptionId: string | null }> {
    const settings = await this.pricing.getSettings();
    const fallback = Number(settings.defaultRevenuePerCreditUsd) || 0.049;
    if (!userId || !isValidObjectId(userId)) return { value: fallback, planId: null, subscriptionId: null };

    const sub: any = await this.subscriptionModel
      .findOne({ userId: new Types.ObjectId(userId), status: { $in: ["ACTIVE", "GRACE_PERIOD"] } })
      .sort({ currentPeriodEnd: -1 })
      .lean();
    if (sub?.planSnapshot) {
      const price = Number(sub.planSnapshot.priceUsd) || 0;
      const included = Number(sub.planSnapshot.aiCreditsIncluded) || 0;
      if (price > 0 && included > 0) {
        return {
          value: price / included,
          planId: sub.planSnapshot.code || String(sub.planId || ""),
          subscriptionId: String(sub._id),
        };
      }
      return { value: fallback, planId: sub.planSnapshot.code || null, subscriptionId: String(sub._id) };
    }
    return { value: fallback, planId: null, subscriptionId: null };
  }

  /**
   * Compute credits for a request given the operation rule + an estimated or
   * actual provider cost (USD) + the user's revenue/credit.
   */
  computeCredits(params: {
    rule: any;
    costUsd: number;
    revenuePerCreditUsd: number;
    maxCostPerCreditUsd?: number;
  }): CreditComputation {
    const rule = params.rule || {};
    const mode = rule.pricingMode || "HYBRID";
    const targetMarkup = Number(rule.targetMarkup) || 2;
    const safetyFactor = Number(rule.safetyFactor) || 1.2;
    const minCredits = Number(rule.minCredits) || 1;
    const maxCredits = Number(rule.maxCredits) || 50;
    const baseCredits = Number(rule.baseCredits) || 0;
    const fixedCredits = Number(rule.fixedCredits) || baseCredits || 1;

    const revenuePerCredit = params.revenuePerCreditUsd > 0 ? params.revenuePerCreditUsd : 0.049;
    // Spec §16: MaxCostPerCredit from product economics is authoritative when provided.
    // Legacy fallback keeps revenue/markup so nothing breaks if economics not configured.
    const maxCostPerCredit =
      params.maxCostPerCreditUsd && params.maxCostPerCreditUsd > 0
        ? params.maxCostPerCreditUsd
        : revenuePerCredit / (targetMarkup > 0 ? targetMarkup : 2);
    const protectedCost = (Number(params.costUsd) || 0) * safetyFactor;

    const variableCredits =
      maxCostPerCredit > 0 ? Math.ceil(protectedCost / maxCostPerCredit) : 0;

    let credits: number;
    let note: string;
    if (mode === "FIXED") {
      credits = fixedCredits;
      note = "FIXED: flat per-operation price";
    } else if (mode === "COST_BASED") {
      credits = variableCredits;
      note = "COST_BASED: ceil(protectedCost / maxCostPerCredit)";
    } else {
      // HYBRID: base + variable
      credits = baseCredits + variableCredits;
      note = "HYBRID: baseCredits + variableCredits";
    }

    let clampedByMin = false;
    let clampedByMax = false;
    if (credits < minCredits) {
      credits = minCredits;
      clampedByMin = true;
    }
    if (credits > maxCredits) {
      credits = maxCredits;
      clampedByMax = true;
    }

    return {
      credits,
      pricingMode: mode,
      revenuePerCreditUsd: revenuePerCredit,
      maxCostPerCreditUsd: Math.round(maxCostPerCredit * 1e8) / 1e8,
      protectedCostUsd: Math.round(protectedCost * 1e8) / 1e8,
      variableCredits,
      baseCredits,
      clampedByMin,
      clampedByMax,
      note,
    };
  }
}
