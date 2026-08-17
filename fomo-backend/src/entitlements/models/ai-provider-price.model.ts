import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

/**
 * AiProviderPrice (P5) — admin-configurable price registry for AI provider
 * models. Prices are versioned by effective window so that changing a price
 * tomorrow never rewrites the cost of yesterday's requests (the Gateway stores
 * a pricingSnapshot on each AiUsageEvent). All rates are USD per 1M tokens.
 */
@Schema({ collection: "ai_provider_pricing", timestamps: true })
export class AiProviderPrice {
  @Prop({ type: String, required: true, index: true })
  provider: string;

  @Prop({ type: String, required: true, index: true })
  model: string;

  @Prop({ type: String, default: "USD" })
  currency: string;

  @Prop({ type: Number, default: 0 })
  inputPer1M: number;

  @Prop({ type: Number, default: 0 })
  outputPer1M: number;

  @Prop({ type: Number, default: null })
  cachedInputPer1M: number | null;

  @Prop({ type: Number, default: null })
  reasoningPer1M: number | null;

  @Prop({ type: Date, default: () => new Date() })
  effectiveFrom: Date;

  @Prop({ type: Date, default: null })
  effectiveTo: Date | null;

  @Prop({ type: Boolean, default: true, index: true })
  active: boolean;

  @Prop({ type: String, default: "" })
  sourceNote: string;

  @Prop({ type: String, default: "" })
  updatedBy: string;
}
export type AiProviderPriceDocument = AiProviderPrice & Document;
export const AiProviderPriceSchema = SchemaFactory.createForClass(AiProviderPrice);
AiProviderPriceSchema.index({ provider: 1, model: 1, effectiveFrom: -1 });

/**
 * AiGlobalSettings — singleton (key:"default"). Guards the economics layer.
 * allowUnpricedModels=false (production default): a request against a model
 * with no pricing row is marked costStatus=UNPRICED and — for USER billing —
 * should be rejected rather than silently sold at $0.
 */
@Schema({ collection: "ai_global_settings", timestamps: true })
export class AiGlobalSettings {
  @Prop({ type: String, default: "default", unique: true })
  key: string;

  @Prop({ type: Boolean, default: false })
  allowUnpricedModels: boolean;

  // Fallback revenue/credit used when a user has no active subscription plan
  // (e.g. top-up only balances). Derived from the demo Pro plan ($49 / 1000).
  @Prop({ type: Number, default: 0.049 })
  defaultRevenuePerCreditUsd: number;

  // infra overhead added to provider COGS per request (configurable, default 0)
  @Prop({ type: Number, default: 0 })
  infrastructureCostPerRequestUsd: number;

  // ---- Runtime provider configuration (admin-managed via CRM Settings) ----
  // Active LLM provider for the monetized path. "openai" (direct), "emergent"
  // (Emergent Universal LLM key via OpenAI-compatible proxy) or "mock".
  @Prop({ type: String, default: "" })
  activeProvider: string;

  // P56: id of the AiProviderCredential currently serving runtime (for usage attribution).
  @Prop({ type: String, default: "" })
  activeCredentialId: string;

  // Direct OpenAI credentials. Empty => fall back to OPEN_AI_SECRET_KEY env.
  @Prop({ type: String, default: "" })
  openAiApiKey: string;

  @Prop({ type: String, default: "" })
  openAiBaseUrl: string;

  // Emergent Universal LLM key + OpenAI-compatible base URL.
  @Prop({ type: String, default: "" })
  emergentLlmKey: string;

  @Prop({ type: String, default: "" })
  emergentBaseUrl: string;

  // Default chat model used by FOMO AI / Admin chat when a rule has no explicit model.
  @Prop({ type: String, default: "" })
  defaultChatModel: string;

  @Prop({ type: String, default: "" })
  updatedBy: string;
}
export type AiGlobalSettingsDocument = AiGlobalSettings & Document;
export const AiGlobalSettingsSchema = SchemaFactory.createForClass(AiGlobalSettings);
