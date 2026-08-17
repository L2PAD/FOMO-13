import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { FomoV2Source } from "../../../fomo-v2.types";

export type FomoV2VestingSummaryDocument =
  HydratedDocument<FomoV2VestingSummary>;

@Schema({
  collection: "vesting_summaries",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2VestingSummary {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2CanonicalProject",
    required: true,
  })
  canonicalProjectId: Types.ObjectId;

  @Prop({ type: String, required: true })
  sourceType: FomoV2Source;

  @Prop()
  vestingDatasetKey?: string;

  @Prop()
  totalAmount?: number;

  @Prop()
  unlockedAmount?: number;

  @Prop()
  lockedAmount?: number;

  @Prop()
  untrackedAmount?: number;

  @Prop()
  unlockedPercent?: number;

  @Prop()
  lockedPercent?: number;

  @Prop()
  untrackedPercent?: number;

  @Prop()
  lastUnlockDate?: Date;

  @Prop()
  nextUnlockDate?: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2UnlockEvent" })
  nextUnlockEventId?: Types.ObjectId;

  @Prop()
  sourceUnlockedValueUsd?: number;

  @Prop()
  sourceLockedValueUsd?: number;

  @Prop()
  calculatedAt?: Date;

  @Prop({ required: true })
  canonicalFingerprint: string;
}

export const FomoV2VestingSummarySchema =
  SchemaFactory.createForClass(FomoV2VestingSummary);

FomoV2VestingSummarySchema.index(
  { canonicalProjectId: 1, sourceType: 1 },
  {
    unique: true,
    name: "uniq_vesting_summaries_project_source",
    partialFilterExpression: { sourceType: { $type: "string" } },
  }
);
FomoV2VestingSummarySchema.index(
  { canonicalFingerprint: 1 },
  {
    unique: true,
    name: "uniq_vesting_summaries_canonical_fingerprint",
    partialFilterExpression: { canonicalFingerprint: { $type: "string" } },
  }
);
FomoV2VestingSummarySchema.index(
  { vestingDatasetKey: 1 },
  { name: "idx_vesting_summaries_dataset_key", sparse: true }
);
FomoV2VestingSummarySchema.index(
  { nextUnlockDate: 1 },
  { name: "idx_vesting_summaries_next_unlock_date", sparse: true }
);
