import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { FOMO_V2_BACKER_TYPES, FomoV2BackerType } from "../types";

export type FomoV2BackerSourceProfileDocument =
  HydratedDocument<FomoV2BackerSourceProfile>;

@Schema({
  collection: "backer_source_profiles",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2BackerSourceProfile {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2Backer",
    required: true,
  })
  backerId: Types.ObjectId;

  @Prop({ required: true })
  sourceType: string;

  @Prop()
  sourceInvestorId?: string;

  @Prop()
  sourceSlug?: string;

  @Prop()
  sourceUrl?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  normalizedName: string;

  @Prop({ type: String, enum: FOMO_V2_BACKER_TYPES })
  backerType?: FomoV2BackerType;

  @Prop()
  description?: string;

  @Prop()
  website?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  socials?: Record<string, string>;

  @Prop()
  logoUrl?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  country?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  sourceEntityId?: Types.ObjectId | string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  sourceSnapshotId?: Types.ObjectId | string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2BackerSourceProfileSchema =
  SchemaFactory.createForClass(FomoV2BackerSourceProfile);

FomoV2BackerSourceProfileSchema.index(
  { backerId: 1, sourceType: 1 },
  {
    unique: true,
    name: "uniq_backer_source_profiles_backer_source",
  }
);
FomoV2BackerSourceProfileSchema.index(
  { sourceType: 1, sourceInvestorId: 1 },
  {
    unique: true,
    name: "uniq_backer_source_profiles_source_investor_id",
    partialFilterExpression: {
      sourceType: { $type: "string" },
      sourceInvestorId: { $type: "string" },
    },
  }
);
FomoV2BackerSourceProfileSchema.index(
  { sourceType: 1, sourceSlug: 1 },
  { name: "idx_backer_source_profiles_source_slug", sparse: true }
);
FomoV2BackerSourceProfileSchema.index(
  { sourceType: 1, normalizedName: 1 },
  { name: "idx_backer_source_profiles_source_normalized_name" }
);
