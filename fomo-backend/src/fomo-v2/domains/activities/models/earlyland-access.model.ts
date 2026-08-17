import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export const EARLYLAND_ACCESS_MODES = [
  "PUBLIC",
  "NFT",
  "BACKEND_GRANT",
  "NFT_OR_BACKEND",
  "NFT_AND_BACKEND",
] as const;

export type EarlyLandAccessMode = (typeof EARLYLAND_ACCESS_MODES)[number];

/**
 * Singleton document holding the configurable Prime access policy for EarlyLand.
 * There is exactly one row identified by `key = "default"`.
 */
@Schema({ collection: "earlyland_access_settings", timestamps: true })
export class EarlyLandAccessSettings {
  @Prop({ type: String, required: true, unique: true, default: "default" })
  key: string;

  @Prop({ type: String, enum: EARLYLAND_ACCESS_MODES, default: "NFT" })
  mode: EarlyLandAccessMode;

  @Prop({ type: String, default: "" })
  note: string;

  @Prop({ type: String, default: "" })
  updatedBy: string;
}

export type EarlyLandAccessSettingsDocument = EarlyLandAccessSettings & Document;
export const EarlyLandAccessSettingsSchema = SchemaFactory.createForClass(
  EarlyLandAccessSettings,
);

/**
 * Manual Prime access grant (backend-grant source). A user is considered granted
 * when there is a matching grant with no `revokedAt` and (no `expiresAt` or
 * `expiresAt` in the future).
 */
@Schema({ collection: "earlyland_access_grants", timestamps: true })
export class EarlyLandAccessGrant {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, default: "" })
  userLabel: string;

  @Prop({ type: String, default: "" })
  reason: string;

  @Prop({ type: String, default: "" })
  grantedBy: string;

  @Prop({ type: Date, default: () => new Date() })
  grantedAt: Date;

  @Prop({ type: Date, default: null })
  expiresAt: Date | null;

  @Prop({ type: Date, default: null })
  revokedAt: Date | null;

  @Prop({ type: String, default: "" })
  revokedBy: string;
}

export type EarlyLandAccessGrantDocument = EarlyLandAccessGrant & Document;
export const EarlyLandAccessGrantSchema =
  SchemaFactory.createForClass(EarlyLandAccessGrant);
