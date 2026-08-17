import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export const ENTITLEMENT_STATUSES = ["ACTIVE", "EXPIRED", "REVOKED"] as const;
export const ENTITLEMENT_SOURCE_TYPES = [
  "SUBSCRIPTION",
  "NFT_ACTIVATION",
  "NFT_EVENT",
  "ADMIN_GRANT",
  "PROMO",
  "LEGACY_EARLYLAND",
] as const;

/** The actual right to a capability. Decoupled from Subscription so one sub can
 *  emit many entitlements and admin grants can exist standalone. */
@Schema({ collection: "entitlements", timestamps: true })
export class Entitlement {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  capabilityKey: string;

  @Prop({ type: String, enum: ENTITLEMENT_SOURCE_TYPES, default: "ADMIN_GRANT" })
  sourceType: string;

  @Prop({ type: String, default: "" })
  sourceId: string;

  @Prop({ type: Date, default: () => new Date() })
  validFrom: Date;

  @Prop({ type: Date, default: null })
  validUntil: Date | null;

  @Prop({ type: String, enum: ENTITLEMENT_STATUSES, default: "ACTIVE", index: true })
  status: string;

  @Prop({ type: String, default: "" })
  reason: string;

  @Prop({ type: String, default: "" })
  grantedBy: string;

  @Prop({ type: Date, default: null })
  revokedAt: Date | null;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export type EntitlementDocument = Entitlement & Document;
export const EntitlementSchema = SchemaFactory.createForClass(Entitlement);
