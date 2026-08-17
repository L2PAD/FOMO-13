import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export const CREDIT_TX_TYPES = [
  "SUBSCRIPTION_GRANT",
  "TOP_UP",
  "AI_USAGE",
  "REFUND",
  "ADMIN_ADJUSTMENT",
  "PROMO",
  "EXPIRATION",
] as const;

// Buckets enable rollover/source-awareness: monthly grants expire, top-ups persist.
export const CREDIT_BUCKETS = ["MONTHLY", "TOPUP", "NONE"] as const;

@Schema({ collection: "ai_credit_transactions", timestamps: true })
export class AiCreditTransaction {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: CREDIT_TX_TYPES, required: true })
  type: string;

  // signed: +grant/topup/refund/adjust, -usage/expiration
  @Prop({ type: Number, required: true })
  credits: number;

  @Prop({ type: String, enum: CREDIT_BUCKETS, default: "NONE" })
  bucket: string;

  // unique idempotency guard (sparse so nulls allowed)
  @Prop({ type: String, default: null })
  idempotencyKey: string | null;

  @Prop({ type: String, default: "" })
  sourceType: string;

  @Prop({ type: String, default: "" })
  sourceId: string;

  @Prop({ type: Number, default: 0 })
  balanceAfter: number;

  // For MONTHLY grant buckets: when these credits expire (period end). Used by
  // the idempotent expiry worker to compute breakage per subscription period.
  @Prop({ type: Date, default: null, index: true })
  expiresAt: Date | null;

  @Prop({ type: String, default: "" })
  reason: string;

  @Prop({ type: String, default: "real", enum: ["real", "mock"] })
  dataMode: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}
export type AiCreditTransactionDocument = AiCreditTransaction & Document;
export const AiCreditTransactionSchema = SchemaFactory.createForClass(AiCreditTransaction);
AiCreditTransactionSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } },
);

@Schema({ collection: "ai_credit_reservations", timestamps: true })
export class AiCreditReservation {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  operationType: string;

  @Prop({ type: Number, required: true })
  amount: number;

  @Prop({ type: String, enum: ["RESERVED", "CAPTURED", "RELEASED"], default: "RESERVED", index: true })
  status: string;

  @Prop({ type: Number, default: 0 })
  capturedCredits: number;

  @Prop({ type: String, default: null })
  idempotencyKey: string | null;

  @Prop({ type: String, default: "" })
  reason: string;
}
export type AiCreditReservationDocument = AiCreditReservation & Document;
export const AiCreditReservationSchema = SchemaFactory.createForClass(AiCreditReservation);
AiCreditReservationSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } },
);

// ─────────────────────────────────────────────────────────────────────────────
// AiUsageEvent (P4) — real per-request telemetry for every monetized AI call.
// One event per Gateway execution. Lifecycle: RESERVED -> COMPLETED|FAILED|RELEASED.
// dataMode real|mock are NEVER mixed in financial analytics.
// billingContext splits USER (spends credits) vs INTERNAL/SYSTEM (COGS only).
// ─────────────────────────────────────────────────────────────────────────────
export const AI_USAGE_STATUSES = ["RESERVED", "COMPLETED", "FAILED", "RELEASED"] as const;
export const AI_BILLING_CONTEXTS = ["USER", "INTERNAL", "SYSTEM"] as const;
export const AI_COST_STATUSES = ["REAL", "ESTIMATED", "UNPRICED", "NONE"] as const;

@Schema({ collection: "ai_usage_events", timestamps: true })
export class AiUsageEvent {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, default: "", index: true })
  requestId: string;

  @Prop({ type: String, required: true, index: true })
  operationType: string;

  @Prop({ type: String, default: "" })
  capability: string;

  @Prop({ type: String, enum: AI_BILLING_CONTEXTS, default: "USER", index: true })
  billingContext: string;

  // ---- provider / model ----
  @Prop({ type: String, default: "" })
  modelProvider: string;

  @Prop({ type: String, default: "" })
  model: string;

  @Prop({ type: String, default: "" })
  providerRequestId: string;

  // P56: which provider credential served this request (for per-key analytics
  // and post-rotation attribution). Historical events keep their credentialId.
  @Prop({ type: String, default: "", index: true })
  credentialId: string;

  // ---- tokens (null = provider did not report; never faked to 0) ----
  @Prop({ type: Number, default: 0 })
  inputTokens: number;

  @Prop({ type: Number, default: 0 })
  outputTokens: number;

  @Prop({ type: Number, default: null })
  cachedInputTokens: number | null;

  @Prop({ type: Number, default: null })
  reasoningTokens: number | null;

  @Prop({ type: Number, default: 0 })
  totalTokens: number;

  // ---- cost breakdown ----
  @Prop({ type: Number, default: 0 })
  providerCostUsd: number;

  @Prop({ type: Number, default: 0 })
  retrievalCostUsd: number;

  @Prop({ type: Number, default: 0 })
  toolCostUsd: number;

  @Prop({ type: Number, default: 0 })
  infrastructureCostUsd: number;

  @Prop({ type: Number, default: 0 })
  totalCostUsd: number;

  // P13: all-in cost breakdown (internal DB lookups are unmetered = 0).
  @Prop({
    type: Object,
    default: () => ({ modelUsd: 0, embeddingsUsd: 0, searchUsd: 0, toolsUsd: 0, otherUsd: 0, totalUsd: 0 }),
  })
  costBreakdown: Record<string, number>;

  // P13: per-tool usage summary for this request.
  @Prop({ type: [Object], default: [] })
  toolUsage: Array<Record<string, any>>;

  @Prop({ type: String, enum: AI_COST_STATUSES, default: "NONE" })
  costStatus: string;

  // snapshot of the pricing row(s) used, so historical COGS is immutable
  @Prop({ type: Object, default: null })
  pricingSnapshot: Record<string, any> | null;

  // ---- credits lifecycle ----
  @Prop({ type: Number, default: 0 })
  creditsEstimated: number;

  @Prop({ type: Number, default: 0 })
  creditsReserved: number;

  @Prop({ type: Number, default: 0 })
  creditsCaptured: number;

  @Prop({ type: Number, default: 0 })
  creditsReleased: number;

  // backward-compat field (mirrors creditsCaptured)
  @Prop({ type: Number, default: 0 })
  creditsCharged: number;

  // ---- linkage ----
  @Prop({ type: String, default: "" })
  subscriptionId: string;

  @Prop({ type: String, default: "" })
  planId: string;

  @Prop({ type: String, default: "" })
  reservationId: string;

  @Prop({ type: String, default: null })
  idempotencyKey: string | null;

  // ---- status / timing ----
  @Prop({ type: String, enum: AI_USAGE_STATUSES, default: "RESERVED", index: true })
  status: string;

  @Prop({ type: String, default: "" })
  errorCode: string;

  @Prop({ type: Date, default: null })
  startedAt: Date | null;

  @Prop({ type: Date, default: null })
  completedAt: Date | null;

  @Prop({ type: Number, default: 0 })
  latencyMs: number;

  @Prop({ type: String, default: "real", enum: ["real", "mock"] })
  dataMode: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}
export type AiUsageEventDocument = AiUsageEvent & Document;
export const AiUsageEventSchema = SchemaFactory.createForClass(AiUsageEvent);
// Ironclad idempotency (P8): one billable execution per key. PARTIAL (not
// sparse) so many events without a key (absent/null) coexist, while any present
// string key is globally unique.
AiUsageEventSchema.index(
  { idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } },
);
AiUsageEventSchema.index({ createdAt: -1 });

// ─────────────────────────────────────────────────────────────────────────────
// AiCreditRule (P6) — per-operation pricing policy. FIXED / COST_BASED / HYBRID.
// ─────────────────────────────────────────────────────────────────────────────
export const AI_PRICING_MODES = ["FIXED", "COST_BASED", "HYBRID"] as const;

@Schema({ collection: "ai_credit_rules", timestamps: true })
export class AiCreditRule {
  @Prop({ type: String, required: true, unique: true })
  operationType: string;

  @Prop({ type: String, required: true })
  name: string;

  // credits charged (legacy fixed unit / hybrid base)
  @Prop({ type: Number, required: true, default: 1 })
  baseCredits: number;

  @Prop({ type: Number, default: 0 })
  fixedCredits: number;

  @Prop({ type: String, enum: AI_PRICING_MODES, default: "HYBRID" })
  pricingMode: string;

  @Prop({ type: String, default: "" })
  capabilityRequired: string;

  @Prop({ type: String, enum: AI_BILLING_CONTEXTS, default: "USER" })
  billingContext: string;

  @Prop({ type: String, default: "STANDARD" })
  modelClass: string;

  // { provider, model, maxOutputTokens, ... } — allowed model + budget caps
  @Prop({ type: Object, default: {} })
  modelPolicy: Record<string, any>;

  @Prop({ type: Number, default: 2 })
  targetMarkup: number;

  @Prop({ type: Number, default: 1.2 })
  safetyFactor: number;

  @Prop({ type: Number, default: 1 })
  minCredits: number;

  @Prop({ type: Number, default: 50 })
  maxCredits: number;

  // rough expected token footprint for pre-call estimate (no output yet)
  @Prop({ type: Number, default: 1500 })
  estInputTokens: number;

  @Prop({ type: Number, default: 800 })
  estOutputTokens: number;

  @Prop({ type: Boolean, default: true })
  active: boolean;

  @Prop({ type: Number, default: 1 })
  version: number;
}
export type AiCreditRuleDocument = AiCreditRule & Document;
export const AiCreditRuleSchema = SchemaFactory.createForClass(AiCreditRule);
