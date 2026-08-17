import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_CONFIDENCE_LEVELS,
  FomoV2Confidence,
  FomoV2Source,
} from "../../../fomo-v2.types";
import {
  FOMO_V2_FUNDING_ROUND_STATUSES,
  FOMO_V2_FUNDING_ROUND_TYPES,
  FomoV2FundingRoundStatus,
  FomoV2FundingRoundType,
  FomoV2FundingSourceRef,
} from "../types";
import { FomoV2FundingSourceRefSchema } from "./funding-source-ref.schema";

export type FomoV2FundingRoundDocument = HydratedDocument<FomoV2FundingRound>;

export interface FomoV2FundingRoundRoi {
  usd?: number;
  btc?: number;
  eth?: number;
}

export interface FomoV2FundingRoundPlatformSnapshot {
  platformId?: Types.ObjectId;
  name?: string;
  normalizedName?: string;
  logoUrl?: string;
  sourceType?: string;
  sourceId?: string;
  sourceUrl?: string;
}

const FomoV2FundingRoundRoiSchema = new mongoose.Schema(
  {
    usd: { type: Number },
    btc: { type: Number },
    eth: { type: Number },
  },
  { _id: false }
);

const FomoV2FundingRoundPlatformSnapshotSchema = new mongoose.Schema(
  {
    platformId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FomoV2FundingPlatform",
    },
    name: { type: String },
    normalizedName: { type: String },
    logoUrl: { type: String },
    sourceType: { type: String },
    sourceId: { type: String },
    sourceUrl: { type: String },
  },
  { _id: false }
);

@Schema({
  collection: "funding_rounds",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2FundingRound {
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

  @Prop()
  roundKey?: string;

  @Prop()
  roundName?: string;

  @Prop()
  normalizedRoundName?: string;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_FUNDING_ROUND_TYPES,
    default: "unknown",
  })
  roundType: FomoV2FundingRoundType;

  @Prop({ required: true })
  normalizedRoundType: string;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_FUNDING_ROUND_STATUSES,
    default: "proposed",
  })
  status: FomoV2FundingRoundStatus;

  @Prop()
  announcedDate?: Date;

  @Prop()
  date?: Date;

  @Prop()
  dateBucket?: string;

  @Prop()
  raisedAmount?: number;

  @Prop()
  raisedCurrency?: string;

  @Prop()
  valuation?: number;

  @Prop()
  tokenPrice?: number;

  @Prop()
  tokensForSaleAmount?: number;

  @Prop()
  tokensForSalePercent?: number;

  @Prop({ type: FomoV2FundingRoundRoiSchema })
  roi?: FomoV2FundingRoundRoi;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2FundingPlatform" })
  platformId?: Types.ObjectId;

  @Prop({ type: FomoV2FundingRoundPlatformSnapshotSchema })
  platform?: FomoV2FundingRoundPlatformSnapshot;

  @Prop({ type: String })
  primarySource?: FomoV2Source;

  @Prop({ type: String })
  sourceType?: FomoV2Source;

  @Prop({ default: false })
  isFeedOnly?: boolean;

  @Prop()
  sourceFeed?: string;

  @Prop()
  feedExternalId?: string;

  @Prop()
  importMode?: string;

  @Prop()
  sourceId?: string;

  @Prop()
  sourceSlug?: string;

  @Prop()
  sourceUrl?: string;

  @Prop()
  sourceEntityKey?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2SourceEntity" })
  sourceEntityId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2SourceSnapshot" })
  sourceSnapshotId?: Types.ObjectId;

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

  @Prop({ required: true })
  canonicalFingerprint: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2FundingRoundSchema =
  SchemaFactory.createForClass(FomoV2FundingRound);

FomoV2FundingRoundSchema.index(
  {
    canonicalProjectId: 1,
    sourceType: 1,
    sourceId: 1,
    normalizedRoundType: 1,
    announcedDate: 1,
  },
  {
    unique: true,
    name: "uniq_funding_rounds_project_source_id_type_announced_date",
    partialFilterExpression: {
      sourceType: { $type: "string" },
      sourceId: { $type: "string" },
      normalizedRoundType: { $type: "string" },
      announcedDate: { $type: "date" },
    },
  }
);
FomoV2FundingRoundSchema.index(
  { canonicalProjectId: 1, primarySource: 1, sourceId: 1 },
  {
    unique: true,
    name: "uniq_funding_rounds_project_source_id",
    partialFilterExpression: {
      primarySource: { $type: "string" },
      sourceId: { $type: "string" },
    },
  }
);
FomoV2FundingRoundSchema.index(
  { canonicalProjectId: 1, roundKey: 1 },
  {
    unique: true,
    name: "uniq_funding_rounds_project_round_key",
    partialFilterExpression: { roundKey: { $type: "string" } },
  }
);
FomoV2FundingRoundSchema.index(
  { canonicalFingerprint: 1 },
  {
    unique: true,
    name: "uniq_funding_rounds_canonical_fingerprint",
    partialFilterExpression: { canonicalFingerprint: { $type: "string" } },
  }
);
FomoV2FundingRoundSchema.index(
  { sourceType: 1, sourceFeed: 1, feedExternalId: 1 },
  {
    unique: true,
    name: "uniq_funding_rounds_source_feed_external_id",
    partialFilterExpression: {
      sourceType: { $type: "string" },
      sourceFeed: { $type: "string" },
      feedExternalId: { $type: "string" },
    },
  }
);
FomoV2FundingRoundSchema.index(
  { canonicalProjectId: 1, announcedDate: -1 },
  { name: "idx_funding_rounds_project_announced_date" }
);
FomoV2FundingRoundSchema.index(
  { sourceEntityId: 1 },
  { name: "idx_funding_rounds_source_entity", sparse: true }
);
FomoV2FundingRoundSchema.index(
  { sourceSnapshotId: 1 },
  { name: "idx_funding_rounds_source_snapshot", sparse: true }
);
FomoV2FundingRoundSchema.index(
  { status: 1, confidence: 1 },
  { name: "idx_funding_rounds_status_confidence" }
);
FomoV2FundingRoundSchema.index(
  { status: 1, valuation: -1, announcedDate: -1, _id: 1 },
  { name: "idx_funding_rounds_status_valuation_desc" }
);
FomoV2FundingRoundSchema.index(
  { status: 1, raisedAmount: -1, announcedDate: -1, _id: 1 },
  { name: "idx_funding_rounds_status_raised_desc" }
);
FomoV2FundingRoundSchema.index(
  { status: 1, announcedDate: -1, _id: 1 },
  { name: "idx_funding_rounds_status_announced_date_desc" }
);
FomoV2FundingRoundSchema.index(
  { platformId: 1, announcedDate: -1 },
  { name: "idx_funding_rounds_platform_date", sparse: true }
);
