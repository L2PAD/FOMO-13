import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_CONFIDENCE_LEVELS,
  FomoV2Confidence,
  FomoV2Source,
} from "../../../fomo-v2.types";
import { FomoV2VestingSourceRef } from "../types";
import { FomoV2VestingSourceRefSchema } from "./vesting-source-ref.schema";

export type FomoV2TokenAllocationDocument =
  HydratedDocument<FomoV2TokenAllocation>;

@Schema({
  collection: "token_allocations",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2TokenAllocation {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2CanonicalProject",
    required: true,
  })
  canonicalProjectId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2MarketAsset" })
  marketAssetId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  sourceType: FomoV2Source;

  @Prop()
  sourceId?: string;

  @Prop()
  sourceSlug?: string;

  @Prop()
  sourcePath?: string;

  @Prop()
  sourceUrl?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  normalizedName: string;

  @Prop()
  allocationPercent?: number;

  @Prop()
  amount?: number;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  saleId?: number | string;

  @Prop({ required: true })
  primarySource: string;

  @Prop()
  sourceEntityKey?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2SourceEntity" })
  sourceEntityId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2SourceSnapshot" })
  sourceSnapshotId?: Types.ObjectId;

  @Prop()
  vestingDatasetKey?: string;

  @Prop({ type: [FomoV2VestingSourceRefSchema], default: [] })
  sourceRefs?: FomoV2VestingSourceRef[];

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  provenance?: Record<string, any>;

  @Prop({ type: String, enum: FOMO_V2_CONFIDENCE_LEVELS, default: "none" })
  confidence?: FomoV2Confidence;

  @Prop({ required: true, default: "proposed" })
  status: "active" | "proposed" | "conflict" | "superseded" | "deprecated";

  @Prop({ required: true })
  canonicalFingerprint: string;
}

export const FomoV2TokenAllocationSchema =
  SchemaFactory.createForClass(FomoV2TokenAllocation);

FomoV2TokenAllocationSchema.index(
  { canonicalProjectId: 1, sourceType: 1, saleId: 1 },
  {
    unique: true,
    name: "uniq_token_allocations_project_source_sale",
    partialFilterExpression: {
      sourceType: { $type: "string" },
      saleId: { $exists: true },
    },
  }
);
FomoV2TokenAllocationSchema.index(
  { canonicalProjectId: 1, sourceType: 1, normalizedName: 1 },
  {
    unique: true,
    name: "uniq_token_allocations_project_source_normalized_name",
    partialFilterExpression: {
      sourceType: { $type: "string" },
      normalizedName: { $type: "string" },
    },
  }
);
FomoV2TokenAllocationSchema.index(
  { canonicalFingerprint: 1 },
  {
    unique: true,
    name: "uniq_token_allocations_canonical_fingerprint",
    partialFilterExpression: { canonicalFingerprint: { $type: "string" } },
  }
);
FomoV2TokenAllocationSchema.index(
  { canonicalProjectId: 1, sourceType: 1 },
  { name: "idx_token_allocations_project_source" }
);
FomoV2TokenAllocationSchema.index(
  { marketAssetId: 1, normalizedName: 1 },
  { name: "idx_token_allocations_asset_normalized_name", sparse: true }
);
FomoV2TokenAllocationSchema.index(
  { sourceEntityId: 1 },
  { name: "idx_token_allocations_source_entity", sparse: true }
);
FomoV2TokenAllocationSchema.index(
  { sourceSnapshotId: 1 },
  { name: "idx_token_allocations_source_snapshot", sparse: true }
);
