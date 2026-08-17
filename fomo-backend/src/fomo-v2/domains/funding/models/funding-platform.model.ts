import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_CONFIDENCE_LEVELS,
  FomoV2Confidence,
  FomoV2Source,
} from "../../../fomo-v2.types";
import { FomoV2FundingSourceRef } from "../types";
import { FomoV2FundingSourceRefSchema } from "./funding-source-ref.schema";

export type FomoV2FundingPlatformDocument =
  HydratedDocument<FomoV2FundingPlatform>;

@Schema({
  collection: "funding_platforms",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2FundingPlatform {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  normalizedName: string;

  @Prop()
  logoUrl?: string;

  @Prop({ type: String })
  sourceType?: FomoV2Source;

  @Prop()
  sourceId?: string;

  @Prop()
  sourceUrl?: string;

  @Prop({ type: [FomoV2FundingSourceRefSchema], default: [] })
  sourceRefs?: FomoV2FundingSourceRef[];

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  provenance?: Record<string, any>;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_CONFIDENCE_LEVELS,
    default: "none",
  })
  confidence: FomoV2Confidence;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2FundingPlatformSchema =
  SchemaFactory.createForClass(FomoV2FundingPlatform);

FomoV2FundingPlatformSchema.index(
  { normalizedName: 1 },
  {
    unique: true,
    name: "uniq_funding_platforms_normalized_name",
    partialFilterExpression: { normalizedName: { $type: "string" } },
  }
);
FomoV2FundingPlatformSchema.index(
  { sourceType: 1, sourceId: 1 },
  {
    name: "idx_funding_platforms_source_id",
    partialFilterExpression: {
      sourceType: { $type: "string" },
      sourceId: { $type: "string" },
    },
  }
);
