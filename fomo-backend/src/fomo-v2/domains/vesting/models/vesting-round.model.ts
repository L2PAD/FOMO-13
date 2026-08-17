import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_CONFIDENCE_LEVELS,
  FomoV2Confidence,
  FomoV2Source,
} from "../../../fomo-v2.types";
import { FomoV2VestingSourceRef } from "../types";
import { FomoV2VestingSourceRefSchema } from "./vesting-source-ref.schema";

export type FomoV2VestingRoundDocument =
  HydratedDocument<FomoV2VestingRound>;

@Schema({
  collection: "vesting_rounds",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2VestingRound {
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

  @Prop({ type: mongoose.Schema.Types.Mixed })
  saleId?: number | string;

  @Prop({ required: true })
  roundName: string;

  @Prop({ required: true })
  normalizedRoundName: string;

  @Prop()
  allocationPercent?: number;

  @Prop()
  totalAmount?: number;

  @Prop()
  unlockedAmountSource?: number;

  @Prop()
  lockedAmountSource?: number;

  @Prop()
  unlockedPercentSource?: number;

  @Prop()
  lockedPercentSource?: number;

  @Prop()
  valueLockedUsdSource?: number;

  @Prop()
  lastUnlockDateSource?: Date;

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

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2VestingRoundSchema =
  SchemaFactory.createForClass(FomoV2VestingRound);

FomoV2VestingRoundSchema.index(
  { canonicalProjectId: 1, sourceType: 1, saleId: 1 },
  {
    unique: true,
    name: "uniq_vesting_rounds_project_source_sale",
    partialFilterExpression: {
      sourceType: { $type: "string" },
      saleId: { $exists: true },
    },
  }
);
FomoV2VestingRoundSchema.index(
  { canonicalProjectId: 1, sourceType: 1, normalizedRoundName: 1 },
  {
    unique: true,
    name: "uniq_vesting_rounds_project_source_normalized_round",
    partialFilterExpression: {
      sourceType: { $type: "string" },
      normalizedRoundName: { $type: "string" },
    },
  }
);
FomoV2VestingRoundSchema.index(
  { canonicalFingerprint: 1 },
  {
    unique: true,
    name: "uniq_vesting_rounds_canonical_fingerprint",
    partialFilterExpression: { canonicalFingerprint: { $type: "string" } },
  }
);
FomoV2VestingRoundSchema.index(
  { canonicalProjectId: 1, sourceType: 1 },
  { name: "idx_vesting_rounds_project_source" }
);
FomoV2VestingRoundSchema.index(
  { marketAssetId: 1, normalizedRoundName: 1 },
  { name: "idx_vesting_rounds_asset_normalized_round", sparse: true }
);
FomoV2VestingRoundSchema.index(
  { sourceEntityId: 1 },
  { name: "idx_vesting_rounds_source_entity", sparse: true }
);
FomoV2VestingRoundSchema.index(
  { sourceSnapshotId: 1 },
  { name: "idx_vesting_rounds_source_snapshot", sparse: true }
);
