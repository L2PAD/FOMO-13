import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { FomoV2Source } from "../../../fomo-v2.types";
import {
  FOMO_V2_UNLOCK_EVENT_APPLY_STATUSES,
  FOMO_V2_UNLOCK_EVENT_ORIGINS,
  FomoV2UnlockEventApplyStatus,
  FomoV2UnlockEventOrigin,
  FomoV2UnlockEventApplySummary,
  FomoV2UnlockSourceRef,
} from "../types";
import { FomoV2UnlockSourceRefSchema } from "./unlock-source-ref.schema";

export type FomoV2UnlockEventDocument = HydratedDocument<FomoV2UnlockEvent>;

@Schema({
  collection: "unlock_events",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2UnlockEvent {
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

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2TokenAllocation" })
  tokenAllocationId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2VestingRound" })
  vestingRoundId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2VestingSchedule" })
  vestingScheduleId?: Types.ObjectId;

  @Prop()
  vestingDatasetKey?: string;

  @Prop()
  unlockKey?: string;

  @Prop({ type: String, required: true })
  sourceType: FomoV2Source;

  @Prop()
  sourceEventId?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  saleId?: number | string;

  @Prop()
  sourcePath?: string;

  @Prop({ required: true })
  unlockDate: Date;

  @Prop()
  statusSource?: string;

  @Prop()
  amount?: number;

  @Prop()
  percentOfSupply?: number;

  @Prop()
  roundName?: string;

  @Prop()
  normalizedRoundName?: string;

  @Prop()
  stage?: string;

  @Prop()
  unlockType?: string;

  @Prop({ type: [String], default: [] })
  unlockTypes?: string[];

  @Prop()
  isTgeUnlock?: boolean;

  @Prop()
  sourceValueUsd?: number;

  @Prop()
  sourceMarketCapSharePercent?: number;

  // Last origin observed for this document. eventOrigins is the canonical provenance.
  @Prop({ type: String, enum: FOMO_V2_UNLOCK_EVENT_ORIGINS })
  eventOrigin?: FomoV2UnlockEventOrigin;

  // Canonical persisted provenance array for all provider/source paths merged into this event.
  @Prop({ type: [String], enum: FOMO_V2_UNLOCK_EVENT_ORIGINS, default: [] })
  eventOrigins?: FomoV2UnlockEventOrigin[];

  @Prop()
  contentHash?: string;

  @Prop()
  sourceFetchedAt?: Date;

  @Prop()
  importedAt?: Date;

  @Prop({ required: true })
  canonicalFingerprint: string;

  @Prop({ type: [FomoV2UnlockSourceRefSchema], default: [] })
  sourceRefs?: FomoV2UnlockSourceRef[];

  @Prop()
  appliedAt?: Date;

  @Prop({
    type: String,
    enum: FOMO_V2_UNLOCK_EVENT_APPLY_STATUSES,
    default: "pending",
  })
  appliedStatus?: FomoV2UnlockEventApplyStatus;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  appliedTo?: FomoV2UnlockEventApplySummary | Record<string, any>;

  @Prop({ default: 0 })
  applyAttempts?: number;

  @Prop()
  lastApplyAttemptAt?: Date;

  @Prop()
  applyError?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2UnlockEventSchema =
  SchemaFactory.createForClass(FomoV2UnlockEvent);

FomoV2UnlockEventSchema.index(
  { canonicalProjectId: 1, unlockDate: 1 },
  { name: "idx_unlock_events_project_unlock_date" }
);
FomoV2UnlockEventSchema.index(
  { sourceType: 1, unlockDate: 1 },
  { name: "idx_unlock_events_source_date" }
);
FomoV2UnlockEventSchema.index(
  { canonicalProjectId: 1, sourceType: 1, saleId: 1 },
  { name: "idx_unlock_events_project_source_sale", sparse: true }
);
FomoV2UnlockEventSchema.index(
  { canonicalProjectId: 1, sourceType: 1, normalizedRoundName: 1 },
  { name: "idx_unlock_events_project_source_normalized_round", sparse: true }
);
FomoV2UnlockEventSchema.index(
  { canonicalProjectId: 1, sourceType: 1, vestingDatasetKey: 1 },
  { name: "idx_unlock_events_project_source_dataset", sparse: true }
);
FomoV2UnlockEventSchema.index(
  { marketAssetId: 1, unlockDate: 1 },
  { name: "idx_unlock_events_market_asset_date", sparse: true }
);
FomoV2UnlockEventSchema.index(
  { tokenAllocationId: 1, unlockDate: 1 },
  { name: "idx_unlock_events_token_allocation_date", sparse: true }
);
FomoV2UnlockEventSchema.index(
  { vestingScheduleId: 1, unlockDate: 1 },
  { name: "idx_unlock_events_vesting_schedule_date", sparse: true }
);
FomoV2UnlockEventSchema.index(
  { vestingDatasetKey: 1, unlockKey: 1 },
  { name: "idx_unlock_events_dataset_unlock_key", sparse: true }
);
FomoV2UnlockEventSchema.index(
  { vestingRoundId: 1, unlockDate: 1 },
  { name: "idx_unlock_events_vesting_round_date", sparse: true }
);
FomoV2UnlockEventSchema.index(
  { canonicalFingerprint: 1 },
  {
    unique: true,
    name: "uniq_unlock_events_canonical_fingerprint",
    partialFilterExpression: { canonicalFingerprint: { $type: "string" } },
  }
);
FomoV2UnlockEventSchema.index(
  { unlockDate: 1, sourceValueUsd: -1 },
  { name: "idx_unlock_events_date_source_value" }
);
FomoV2UnlockEventSchema.index(
  { appliedStatus: 1, unlockDate: 1, canonicalProjectId: 1 },
  { name: "idx_unlock_events_apply_due" }
);
