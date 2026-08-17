import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export const SUBSCRIPTION_STATUSES = [
  "PENDING",
  "ACTIVE",
  "GRACE_PERIOD",
  "EXPIRED",
  "CANCELLED",
  "REVOKED",
  "REFUNDED",
] as const;

export const SUBSCRIPTION_SOURCES = [
  "CRYPTO_PAYMENT",
  "NFT_PRIMARY",
  "NFT_LEGACY",
  "ADMIN_GRANT",
  "PROMO",
  "PARTNER",
] as const;

/** A user's purchased/granted access period. planSnapshot is mandatory so later
 *  plan edits never retroactively change an already-sold period. */
@Schema({ collection: "entitlement_subscriptions", timestamps: true })
export class Subscription {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, index: true })
  planId: Types.ObjectId;

  @Prop({ type: String, enum: ["FOMO_AI", "FOMO_INTEL"], default: "FOMO_AI", index: true })
  productType: string;

  @Prop({ type: Number, default: 1 })
  planVersion: number;

  @Prop({ type: String, enum: SUBSCRIPTION_STATUSES, default: "PENDING", index: true })
  status: string;

  @Prop({ type: String, enum: SUBSCRIPTION_SOURCES, default: "ADMIN_GRANT" })
  source: string;

  @Prop({ type: Date })
  currentPeriodStart: Date;

  @Prop({ type: Date })
  currentPeriodEnd: Date;

  @Prop({ type: Date, default: null })
  graceUntil: Date | null;

  @Prop({ type: Boolean, default: false })
  autoRenew: boolean;

  @Prop({ type: String, default: "" })
  originWallet: string;

  @Prop({ type: String, default: "" })
  paymentId: string;

  @Prop({ type: String, default: "" })
  nftTokenId: string;

  @Prop({ type: Object, default: {} })
  priceSnapshot: Record<string, any>;

  @Prop({ type: Object, required: true, default: {} })
  planSnapshot: Record<string, any>;

  /**
   * Immutable unit-economics snapshot for THIS sold period (spec Phase A / P1).
   * Frozen at activation/extension so later product-price or margin edits never
   * rewrite the economics of an already-sold period. Shape:
   *  { priceUsd, creditsGranted, paymentReservePct, infraReservePct,
   *    targetGrossMarginPct, netPlanValueUsd, allowedAiCogsUsd,
   *    maxCostPerCreditUsd, economicsConfigVersion, periodStart, periodEnd }
   */
  @Prop({ type: Object, default: null })
  economicsSnapshot: Record<string, any> | null;

  @Prop({ type: String, default: "" })
  createdBy: string;
}

export type SubscriptionDocument = Subscription & Document;
export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
