import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export const FOMO_V2_FLAG_ENTITY_TYPES = [
  "market_project",
  "ico_project",
  "backer",
  "person",
] as const;
export const FOMO_V2_FLAG_TYPES = ["green", "yellow", "red"] as const;
export const FOMO_V2_FLAG_STATUSES = [
  "pending",
  "confirmed",
  "rejected",
] as const;

export type FomoV2FlagEntityType =
  (typeof FOMO_V2_FLAG_ENTITY_TYPES)[number];
export type FomoV2FlagType = (typeof FOMO_V2_FLAG_TYPES)[number];
export type FomoV2FlagStatus = (typeof FOMO_V2_FLAG_STATUSES)[number];
export type FomoV2EntityFlagDocument = HydratedDocument<FomoV2EntityFlag>;

@Schema({
  collection: "fomo_v2_entity_flags",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2EntityFlag {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ type: String, required: true, enum: FOMO_V2_FLAG_ENTITY_TYPES })
  entityType: FomoV2FlagEntityType;

  @Prop({ type: String, required: true })
  entityId: string;

  @Prop({ type: String, required: true, enum: FOMO_V2_FLAG_TYPES })
  flagType: FomoV2FlagType;

  @Prop()
  title?: string;

  @Prop({ required: true })
  description: string;

  @Prop()
  sourceUrl?: string;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_FLAG_STATUSES,
    default: "pending",
  })
  status: FomoV2FlagStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  submittedByUserId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User" })
  reviewedByAdminId?: Types.ObjectId;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  adminComment?: string;

  @Prop()
  xpDelta?: number;
}

export const FomoV2EntityFlagSchema =
  SchemaFactory.createForClass(FomoV2EntityFlag);

FomoV2EntityFlagSchema.index(
  { entityType: 1, entityId: 1, status: 1, flagType: 1 },
  { name: "idx_fomo_v2_entity_flags_entity_status_type" }
);
FomoV2EntityFlagSchema.index(
  { status: 1, createdAt: -1 },
  { name: "idx_fomo_v2_entity_flags_status_created" }
);
FomoV2EntityFlagSchema.index(
  { submittedByUserId: 1, createdAt: -1 },
  { name: "idx_fomo_v2_entity_flags_submitter_created" }
);
