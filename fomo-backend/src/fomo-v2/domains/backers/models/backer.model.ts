import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_BACKER_STATUSES,
  FOMO_V2_BACKER_TYPES,
  FomoV2BackerSocials,
  FomoV2BackerSourceRef,
  FomoV2BackerStatus,
  FomoV2BackerType,
} from "../types";
import { FomoV2BackerSourceRefSchema } from "./backer-source-ref.schema";

export type FomoV2BackerDocument = HydratedDocument<FomoV2Backer>;

@Schema({
  collection: "backers",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2Backer {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
   
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
  socials?: FomoV2BackerSocials;

  @Prop()
  logoUrl?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  country?: string;

  @Prop()
  niche?: string;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_BACKER_STATUSES,
    default: "active",
  })
  status: FomoV2BackerStatus;

  @Prop()
  confidence?: number;

  @Prop()
  primarySource?: string;

  @Prop()
  sourceId?: string;

  @Prop()
  sourceUrl?: string;

  @Prop({ type: [FomoV2BackerSourceRefSchema], default: [] })
  sourceRefs?: FomoV2BackerSourceRef[];

  @Prop({ required: true })
  canonicalFingerprint: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2BackerSchema = SchemaFactory.createForClass(FomoV2Backer);

FomoV2BackerSchema.index(
  { canonicalFingerprint: 1 },
  {
    unique: true,
    name: "uniq_backers_canonical_fingerprint",
    partialFilterExpression: { canonicalFingerprint: { $type: "string" } },
  }
);
FomoV2BackerSchema.index(
  { normalizedName: 1 },
  { name: "idx_backers_normalized_name" }
);
FomoV2BackerSchema.index(
  { slug: 1 },
  { name: "idx_backers_slug", sparse: true }
);
FomoV2BackerSchema.index(
  { backerType: 1, normalizedName: 1 },
  { name: "idx_backers_type_normalized_name" }
);
FomoV2BackerSchema.index(
  { niche: 1 },
  { name: "idx_backers_niche", sparse: true }
);
FomoV2BackerSchema.index(
  { primarySource: 1, sourceId: 1 },
  {
    unique: true,
    name: "uniq_backers_primary_source_source_id",
    partialFilterExpression: {
      primarySource: { $type: "string" },
      sourceId: { $type: "string" },
    },
  }
);
FomoV2BackerSchema.index(
  { status: 1, backerType: 1 },
  { name: "idx_backers_status_type" }
);
