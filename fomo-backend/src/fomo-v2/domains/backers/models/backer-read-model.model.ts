import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { FOMO_V2_BACKER_TYPES, FomoV2BackerType } from "../types";

export type FomoV2BackerReadModelDocument =
  HydratedDocument<FomoV2BackerReadModel>;

@Schema({
  collection: "backer_read_models",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2BackerReadModel {
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
  name: string;

  @Prop({ required: true })
  normalizedName: string;

  @Prop()
  slug?: string;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_BACKER_TYPES,
    default: "fund",
  })
  backerType: FomoV2BackerType;

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

  @Prop()
  niche?: string;

  @Prop({ required: true, default: false })
  hasSourceProfile: boolean;

  @Prop()
  primarySource?: string;

  @Prop()
  profileCompleteness?: number;
}

export const FomoV2BackerReadModelSchema =
  SchemaFactory.createForClass(FomoV2BackerReadModel);

FomoV2BackerReadModelSchema.index(
  { backerId: 1 },
  { unique: true, name: "uniq_backer_read_models_backer" }
);
FomoV2BackerReadModelSchema.index(
  { backerType: 1, normalizedName: 1 },
  { name: "idx_backer_read_models_type_normalized_name" }
);
FomoV2BackerReadModelSchema.index(
  { slug: 1 },
  { name: "idx_backer_read_models_slug", sparse: true }
);
FomoV2BackerReadModelSchema.index(
  { niche: 1 },
  { name: "idx_backer_read_models_niche", sparse: true }
);
