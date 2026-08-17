import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_CONFIDENCE_LEVELS,
  FomoV2Confidence,
  FomoV2Source,
} from "../../../fomo-v2.types";
import { FomoV2VestingSourceRef } from "../types";
import { FomoV2VestingSourceRefSchema } from "./vesting-source-ref.schema";

export type FomoV2VestingScheduleDocument =
  HydratedDocument<FomoV2VestingSchedule>;

@Schema({
  collection: "vesting_schedules",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2VestingSchedule {
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

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2TokenAllocation",
  })
  tokenAllocationId?: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2VestingRound",
  })
  vestingRoundId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  sourceType: FomoV2Source;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  saleId?: number | string;

  @Prop({ required: true })
  roundName: string;

  @Prop({ required: true })
  normalizedRoundName: string;

  @Prop()
  tgeUnlockPercent?: number;

  @Prop()
  vestingType?: string;

  @Prop()
  vestingFrequency?: string;

  @Prop()
  vestingDurationMonths?: number;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  dateConfidence?: string;

  @Prop()
  currentUnlockedPercentSource?: number;

  @Prop()
  currentLockedPercentSource?: number;

  @Prop({ required: true })
  canonicalFingerprint: string;

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

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2VestingScheduleSchema =
  SchemaFactory.createForClass(FomoV2VestingSchedule);

FomoV2VestingScheduleSchema.index(
  { canonicalFingerprint: 1 },
  {
    unique: true,
    name: "uniq_vesting_schedules_canonical_fingerprint",
    partialFilterExpression: { canonicalFingerprint: { $type: "string" } },
  }
);
FomoV2VestingScheduleSchema.index(
  { canonicalProjectId: 1, sourceType: 1, saleId: 1 },
  {
    unique: true,
    name: "uniq_vesting_schedules_project_source_sale",
    partialFilterExpression: {
      sourceType: { $type: "string" },
      saleId: { $exists: true },
    },
  }
);
FomoV2VestingScheduleSchema.index(
  { vestingRoundId: 1 },
  { name: "idx_vesting_schedules_vesting_round" }
);
FomoV2VestingScheduleSchema.index(
  { canonicalProjectId: 1, sourceType: 1, normalizedRoundName: 1 },
  { name: "idx_vesting_schedules_project_source_normalized_round" }
);
FomoV2VestingScheduleSchema.index(
  { tokenAllocationId: 1, normalizedRoundName: 1 },
  { name: "idx_vesting_schedules_allocation_normalized_round", sparse: true }
);
FomoV2VestingScheduleSchema.index(
  { marketAssetId: 1, startDate: 1, endDate: 1 },
  { name: "idx_vesting_schedules_asset_dates", sparse: true }
);
FomoV2VestingScheduleSchema.index(
  { sourceEntityId: 1 },
  { name: "idx_vesting_schedules_source_entity", sparse: true }
);
FomoV2VestingScheduleSchema.index(
  { sourceSnapshotId: 1 },
  { name: "idx_vesting_schedules_source_snapshot", sparse: true }
);
