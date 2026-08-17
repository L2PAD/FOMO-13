import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AiProviderPrice, AiGlobalSettings } from "../models/ai-provider-price.model";
import { NormalizedUsage } from "./ai-provider.types";

export interface ProviderCostResult {
  providerCostUsd: number;
  costStatus: "REAL" | "ESTIMATED" | "UNPRICED" | "NONE";
  pricingSnapshot: Record<string, any> | null;
}

/**
 * AiProviderPricingService (P5). Owns the versioned provider price registry and
 * turns token usage into a USD provider cost. Prices are resolved for the
 * effective window active at request time; the resolved row is returned as a
 * snapshot so historical cost is immutable even if prices change later.
 */
@Injectable()
export class AiProviderPricingService {
  constructor(
    @InjectModel(AiProviderPrice.name) private readonly priceModel: Model<any>,
    @InjectModel(AiGlobalSettings.name) private readonly settingsModel: Model<any>,
  ) {}

  /** Internal: full settings doc WITH secrets (never exposed via API). */
  async getRawSettings(): Promise<any> {
    let doc: any = await this.settingsModel.findOne({ key: "default" }).lean();
    if (!doc) {
      doc = (await this.settingsModel.create({ key: "default" })).toObject();
    }
    return doc;
  }

  private mask(v?: string | null): string {
    const s = String(v || "");
    if (!s) return "";
    if (s.length <= 8) return "\u2022".repeat(s.length);
    return `${s.slice(0, 4)}${"\u2022".repeat(6)}${s.slice(-4)}`;
  }

  /** Public settings for the CRM — secrets are masked, presence flagged. */
  async getSettings(): Promise<any> {
    const doc = await this.getRawSettings();
    const { openAiApiKey, emergentLlmKey, ...rest } = doc;
    const envOpenAi = Boolean(String(process.env.OPEN_AI_SECRET_KEY || "").trim());
    const envEmergent = Boolean(String(process.env.EMERGENT_LLM_KEY || "").trim());
    return {
      ...rest,
      activeProvider: doc.activeProvider || "openai",
      activeCredentialId: doc.activeCredentialId || null,
      // Product unit-economics with safe defaults (spec example: $49 / 30d / 1000 / 50% / 3% / 7%).
      aiProductPriceUsd: doc.aiProductPriceUsd ?? 49,
      aiProductPeriodDays: doc.aiProductPeriodDays ?? 30,
      aiProductIncludedCredits: doc.aiProductIncludedCredits ?? 1000,
      targetGrossMarginPct: doc.targetGrossMarginPct ?? 0.5,
      paymentFeeReservePct: doc.paymentFeeReservePct ?? 0.03,
      infraReservePct: doc.infraReservePct ?? 0.07,
      creditSafetyFactor: doc.creditSafetyFactor ?? 1.1,
      openAiApiKeyMasked: this.mask(openAiApiKey),
      emergentLlmKeyMasked: this.mask(emergentLlmKey),
      hasOpenAiKey: Boolean(openAiApiKey),
      hasEmergentKey: Boolean(emergentLlmKey),
      // Effective availability accounts for the .env fallback used at runtime.
      openAiEnvPresent: envOpenAi,
      emergentEnvPresent: envEmergent,
      openAiConfigured: Boolean(openAiApiKey) || envOpenAi,
      emergentConfigured: Boolean(emergentLlmKey) || envEmergent,
    };
  }

  async updateSettings(patch: Record<string, any>, actor?: string): Promise<any> {
    const allowed: any = {};
    if (typeof patch.allowUnpricedModels === "boolean") allowed.allowUnpricedModels = patch.allowUnpricedModels;
    if (typeof patch.defaultRevenuePerCreditUsd === "number") allowed.defaultRevenuePerCreditUsd = patch.defaultRevenuePerCreditUsd;
    if (typeof patch.infrastructureCostPerRequestUsd === "number") allowed.infrastructureCostPerRequestUsd = patch.infrastructureCostPerRequestUsd;
    // Product unit-economics (editable, никакого hardcode $49). See §7–11 of spec.
    const num = (v: any) => (v === null || v === undefined || v === "" || isNaN(Number(v)) ? undefined : Number(v));
    if (num(patch.aiProductPriceUsd) !== undefined) allowed.aiProductPriceUsd = num(patch.aiProductPriceUsd);
    if (num(patch.aiProductPeriodDays) !== undefined) allowed.aiProductPeriodDays = num(patch.aiProductPeriodDays);
    if (num(patch.aiProductIncludedCredits) !== undefined) allowed.aiProductIncludedCredits = num(patch.aiProductIncludedCredits);
    if (num(patch.targetGrossMarginPct) !== undefined) allowed.targetGrossMarginPct = num(patch.targetGrossMarginPct);
    if (num(patch.paymentFeeReservePct) !== undefined) allowed.paymentFeeReservePct = num(patch.paymentFeeReservePct);
    if (num(patch.infraReservePct) !== undefined) allowed.infraReservePct = num(patch.infraReservePct);
    if (num(patch.creditSafetyFactor) !== undefined) allowed.creditSafetyFactor = num(patch.creditSafetyFactor);
    // Runtime provider config
    if (typeof patch.activeProvider === "string" && ["openai", "emergent", "mock"].includes(patch.activeProvider)) {
      allowed.activeProvider = patch.activeProvider;
    }
    if (typeof patch.openAiBaseUrl === "string") allowed.openAiBaseUrl = patch.openAiBaseUrl.trim();
    if (typeof patch.emergentBaseUrl === "string") allowed.emergentBaseUrl = patch.emergentBaseUrl.trim();
    if (typeof patch.defaultChatModel === "string") allowed.defaultChatModel = patch.defaultChatModel.trim();
    // Secret keys: only overwrite when a fresh (non-masked) value is supplied.
    const isMasked = (v: string) => v.includes("\u2022");
    if (typeof patch.openAiApiKey === "string" && patch.openAiApiKey && !isMasked(patch.openAiApiKey)) {
      allowed.openAiApiKey = patch.openAiApiKey.trim();
    }
    if (typeof patch.emergentLlmKey === "string" && patch.emergentLlmKey && !isMasked(patch.emergentLlmKey)) {
      allowed.emergentLlmKey = patch.emergentLlmKey.trim();
    }
    allowed.updatedBy = actor || "";
    await this.settingsModel.updateOne({ key: "default" }, { $set: allowed }, { upsert: true });
    return this.getSettings();
  }

  async listPrices(): Promise<any[]> {
    return this.priceModel.find().sort({ provider: 1, model: 1, effectiveFrom: -1 }).lean();
  }

  async upsertPrice(body: Record<string, any>, actor?: string): Promise<any> {
    const doc = {
      provider: String(body.provider || "").trim(),
      model: String(body.model || "").trim(),
      currency: body.currency || "USD",
      inputPer1M: Number(body.inputPer1M) || 0,
      outputPer1M: Number(body.outputPer1M) || 0,
      cachedInputPer1M: body.cachedInputPer1M == null ? null : Number(body.cachedInputPer1M),
      reasoningPer1M: body.reasoningPer1M == null ? null : Number(body.reasoningPer1M),
      effectiveFrom: body.effectiveFrom ? new Date(body.effectiveFrom) : new Date(),
      effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : null,
      active: body.active !== false,
      sourceNote: body.sourceNote || "",
      updatedBy: actor || "",
    };
    if (body._id) {
      await this.priceModel.updateOne({ _id: body._id }, { $set: doc });
      return this.priceModel.findById(body._id).lean();
    }
    return (await this.priceModel.create(doc)).toObject();
  }

  async setPriceActive(id: string, active: boolean): Promise<{ ok: true }> {
    await this.priceModel.updateOne({ _id: id }, { $set: { active } });
    return { ok: true };
  }

  /** Resolve the active price row for provider/model at a given time. */
  async resolvePrice(provider: string, model: string, at: Date = new Date()): Promise<any | null> {
    const row = await this.priceModel
      .findOne({
        provider,
        model,
        active: true,
        effectiveFrom: { $lte: at },
        $or: [{ effectiveTo: null }, { effectiveTo: { $gt: at } }],
      })
      .sort({ effectiveFrom: -1 })
      .lean();
    return row || null;
  }

  private snapshot(row: any): Record<string, any> {
    return {
      priceId: String(row._id),
      provider: row.provider,
      model: row.model,
      currency: row.currency,
      inputPer1M: row.inputPer1M,
      outputPer1M: row.outputPer1M,
      cachedInputPer1M: row.cachedInputPer1M,
      reasoningPer1M: row.reasoningPer1M,
      effectiveFrom: row.effectiveFrom,
      resolvedAt: new Date(),
    };
  }

  /**
   * Compute the provider cost for a usage object. `usageIsReal` distinguishes a
   * real provider-reported usage (REAL) from a pre-call estimate (ESTIMATED).
   * If no price row exists -> UNPRICED (cost 0, but flagged, never sold blind).
   */
  async computeProviderCost(
    provider: string,
    model: string,
    usage: Partial<NormalizedUsage>,
    usageIsReal: boolean,
    at: Date = new Date(),
  ): Promise<ProviderCostResult> {
    const row = await this.resolvePrice(provider, model, at);
    if (!row) {
      return { providerCostUsd: 0, costStatus: "UNPRICED", pricingSnapshot: null };
    }
    const per1M = (tokens: number | null | undefined, rate: number | null | undefined) =>
      ((Number(tokens) || 0) / 1_000_000) * (Number(rate) || 0);

    const input = Number(usage.inputTokens) || 0;
    const cached = Number(usage.cachedInputTokens) || 0;
    const nonCachedInput = Math.max(0, input - cached);
    const reasoning = Number(usage.reasoningTokens) || 0;
    const output = Number(usage.outputTokens) || 0;

    const cost =
      per1M(nonCachedInput, row.inputPer1M) +
      per1M(cached, row.cachedInputPer1M != null ? row.cachedInputPer1M : row.inputPer1M) +
      per1M(output, row.outputPer1M) +
      per1M(reasoning, row.reasoningPer1M != null ? row.reasoningPer1M : row.outputPer1M);

    return {
      providerCostUsd: Math.round(cost * 1e8) / 1e8,
      costStatus: usageIsReal ? "REAL" : "ESTIMATED",
      pricingSnapshot: this.snapshot(row),
    };
  }
}
