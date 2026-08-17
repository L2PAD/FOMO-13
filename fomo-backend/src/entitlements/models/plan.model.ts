import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export const PLAN_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;
export const BILLING_PERIODS = ["MONTH", "QUARTER", "YEAR", "CUSTOM"] as const;

/** A commercial product. Capabilities are referenced by key (see registry). */
@Schema({ collection: "entitlement_plans", timestamps: true })
export class Plan {
  @Prop({ type: String, required: true, unique: true })
  code: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, default: "" })
  description: string;

  @Prop({ type: String, enum: PLAN_STATUSES, default: "DRAFT" })
  status: string;

  @Prop({ type: String, enum: BILLING_PERIODS, default: "MONTH" })
  billingPeriod: string;

  @Prop({ type: Number, default: 30 })
  durationDays: number;

  @Prop({ type: Number, default: 0 })
  priceUsd: number;

  // [{ capabilityKey, limits? }]
  @Prop({ type: Array, default: [] })
  capabilities: Array<{ capabilityKey: string; limits?: Record<string, any> }>;

  @Prop({ type: Number, default: 0 })
  aiCreditsIncluded: number;

  @Prop({ type: Number, default: 0 })
  gracePeriodHours: number;

  @Prop({ type: String, enum: ["NONE", "LIMITED", "FULL"], default: "NONE" })
  creditRollover: string;

  @Prop({ type: Number, default: 0 })
  rolloverCap: number;

  @Prop({ type: Boolean, default: true })
  allowCryptoPurchase: boolean;

  @Prop({ type: Boolean, default: true })
  allowNftActivation: boolean;

  @Prop({ type: Boolean, default: true })
  allowAdminGrant: boolean;

  @Prop({ type: Number, default: 0 })
  sortOrder: number;

  @Prop({ type: Boolean, default: false })
  featured: boolean;

  @Prop({ type: Number, default: 1 })
  version: number;

  // ---- Phase F.1: two-product commercial model ----
  // FOMO_AI has credit economics; FOMO_INTEL is access-only (aiCredits = null).
  @Prop({ type: String, enum: ["FOMO_AI", "FOMO_INTEL"], default: "FOMO_AI", index: true })
  productType: string;

  @Prop({ type: String, default: "" })
  slug: string;

  @Prop({ type: String, default: "" })
  subtitle: string;

  // Canonical AI credit grant per period. null => product has NO credit economy.
  @Prop({ type: Number, default: null })
  aiCredits: number | null;

  @Prop({ type: Boolean, default: true })
  purchasable: boolean;

  @Prop({ type: Boolean, default: true })
  visible: boolean;

  @Prop({ type: Boolean, default: false })
  recommended: boolean;

  // Admin-editable marketing offer items (NOT hardcoded in JSX).
  // [{ title, description, icon, active, sortOrder, linkedCapability? }]
  @Prop({ type: Array, default: [] })
  offerItems: Array<Record<string, any>>;

  // { enabled, methods[], acceptedAssets[], networks[], settlementCurrency, priceUsd }
  @Prop({ type: Object, default: { enabled: false } })
  checkoutConfig: Record<string, any>;

  // For external products (FOMO Intel): { url, ssoHandoff?, ... }
  @Prop({ type: Object, default: null })
  externalProductConfig: Record<string, any> | null;
}

export type PlanDocument = Plan & Document;
export const PlanSchema = SchemaFactory.createForClass(Plan);
