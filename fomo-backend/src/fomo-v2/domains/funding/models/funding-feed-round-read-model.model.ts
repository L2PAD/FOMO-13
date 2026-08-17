import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type FomoV2FundingFeedRoundReadModelDocument =
  HydratedDocument<FomoV2FundingFeedRoundReadModel>;

export type FomoV2FundingFeedRoundDateSource =
  | "announcedDate"
  | "date"
  | "none";

export type FomoV2FundingFeedRoundScoreSource =
  | "marketProject.fomoScore"
  | "marketProject.rating"
  | "icoProject.metadata.fomoScore"
  | "canonicalProject.metadata.fomoScore"
  | "none";

export type FomoV2FundingFeedRoundRedFlagsSource =
  | "marketProject.redFlags"
  | "icoProject.metadata.redFlags"
  | "canonicalProject.metadata.redFlags"
  | "none";

export interface FomoV2FundingFeedRoundInvestorSnapshot {
  backerId?: Types.ObjectId;
  sourceBackerId?: string;
  sourceBackerSlug?: string;
  sourceBackerUrl?: string;
  name?: string;
  slug?: string;
  niche?: string;
  role?: string;
  ventureType?: string;
  isLead?: boolean;
  logo?: string;
  rating?: number;
  fomoScore?: number;
}

export interface FomoV2FundingFeedRoundRoi {
  usd?: number;
  btc?: number;
  eth?: number;
}

export interface FomoV2FundingFeedRoundPlatformSnapshot {
  platformId?: Types.ObjectId;
  name?: string;
  normalizedName?: string;
  logoUrl?: string;
  sourceType?: string;
  sourceId?: string;
  sourceUrl?: string;
}

const FomoV2FundingFeedRoundRoiSchema = new mongoose.Schema(
  {
    usd: { type: Number },
    btc: { type: Number },
    eth: { type: Number },
  },
  { _id: false }
);

const FomoV2FundingFeedRoundPlatformSnapshotSchema = new mongoose.Schema(
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
  collection: "funding_feed_round_read_models",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2FundingFeedRoundReadModel {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2FundingRound",
    required: true,
  })
  fundingRoundId: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2CanonicalProject",
    required: true,
  })
  canonicalProjectId: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2MarketAsset" })
  marketAssetId?: Types.ObjectId;

  @Prop({ required: true, default: true })
  visible: boolean;

  @Prop()
  roundStatus?: string;

  @Prop()
  confidence?: string;

  @Prop()
  fundingDate?: Date;

  @Prop({ enum: ["announcedDate", "date", "none"], default: "none" })
  dateSource: FomoV2FundingFeedRoundDateSource;

  @Prop()
  announcedDate?: Date;

  @Prop()
  roundDate?: Date;

  @Prop()
  roundName?: string;

  @Prop()
  normalizedRoundName?: string;

  @Prop()
  roundType?: string;

  @Prop()
  normalizedRoundType?: string;

  @Prop({ type: [String], default: [] })
  fundingTypeKeys: string[];

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

  @Prop({ type: FomoV2FundingFeedRoundRoiSchema })
  roi?: FomoV2FundingFeedRoundRoi;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2FundingPlatform" })
  platformId?: Types.ObjectId;

  @Prop({ type: FomoV2FundingFeedRoundPlatformSnapshotSchema })
  platform?: FomoV2FundingFeedRoundPlatformSnapshot;

  @Prop({ default: 0 })
  fundsRaisedForSort: number;

  @Prop({ default: 0 })
  preValuationForSort: number;

  @Prop()
  primarySource?: string;

  @Prop()
  sourceType?: string;

  @Prop()
  sourceFeed?: string;

  @Prop()
  sourceSlug?: string;

  @Prop()
  sourceUrl?: string;

  @Prop()
  projectName?: string;

  @Prop()
  projectSymbol?: string;

  @Prop()
  projectSlug?: string;

  @Prop()
  marketRouteId?: string;

  @Prop()
  projectRouteId?: string;

  @Prop()
  projectLogo?: string;

  @Prop()
  projectCategory?: string;

  @Prop({ type: [String], default: [] })
  categoryKeys: string[];

  @Prop()
  projectStatus?: string;

  @Prop({ type: [String], default: [] })
  projectStatusKeys: string[];

  @Prop({ required: true, default: false })
  hasToken: boolean;

  @Prop({ default: 0 })
  projectFomoScore: number;

  @Prop({ enum: [
    "marketProject.fomoScore",
    "marketProject.rating",
    "icoProject.metadata.fomoScore",
    "canonicalProject.metadata.fomoScore",
    "none",
  ], default: "none" })
  projectFomoScoreSource: FomoV2FundingFeedRoundScoreSource;

  @Prop({ default: 0 })
  projectRedFlags: number;

  @Prop({ default: 0 })
  projectLikes: number;

  @Prop({ enum: [
    "marketProject.redFlags",
    "icoProject.metadata.redFlags",
    "canonicalProject.metadata.redFlags",
    "none",
  ], default: "none" })
  projectRedFlagsSource: FomoV2FundingFeedRoundRedFlagsSource;

  @Prop({ type: [String], default: [] })
  chainKeys: string[];

  @Prop({ type: [String], default: [] })
  investorIds: string[];

  @Prop({ type: [String], default: [] })
  investorSourceIds: string[];

  @Prop({ type: [String], default: [] })
  investorSlugs: string[];

  @Prop({ type: [String], default: [] })
  investorNameKeys: string[];

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  investors: FomoV2FundingFeedRoundInvestorSnapshot[];

  @Prop({ type: [String], default: [] })
  searchPrefixes: string[];

  @Prop({ type: [String], default: [] })
  searchTokens: string[];

  @Prop()
  sourceUpdatedAt?: Date;

  @Prop()
  materializedAt?: Date;

  @Prop({ default: 1 })
  schemaVersion: number;
}

export const FomoV2FundingFeedRoundReadModelSchema =
  SchemaFactory.createForClass(FomoV2FundingFeedRoundReadModel);

FomoV2FundingFeedRoundReadModelSchema.index(
  { fundingRoundId: 1 },
  { unique: true, name: "uniq_funding_feed_round_read_models_round" },
);
FomoV2FundingFeedRoundReadModelSchema.index(
  { canonicalProjectId: 1, fundingDate: -1 },
  { name: "idx_funding_feed_round_read_models_project_date" },
);
FomoV2FundingFeedRoundReadModelSchema.index(
  { visible: 1, fundingDate: -1, _id: 1 },
  { name: "idx_funding_feed_round_read_models_visible_date" },
);
FomoV2FundingFeedRoundReadModelSchema.index(
  { visible: 1, fundsRaisedForSort: -1, fundingDate: -1, _id: 1 },
  { name: "idx_funding_feed_round_read_models_visible_raised" },
);
FomoV2FundingFeedRoundReadModelSchema.index(
  { visible: 1, preValuationForSort: -1, fundingDate: -1, _id: 1 },
  { name: "idx_funding_feed_round_read_models_visible_valuation" },
);
FomoV2FundingFeedRoundReadModelSchema.index(
  { visible: 1, projectFomoScore: -1, fundingDate: -1, _id: 1 },
  { name: "idx_funding_feed_round_read_models_visible_fomo" },
);
FomoV2FundingFeedRoundReadModelSchema.index(
  { visible: 1, projectRedFlags: 1, fundingDate: -1, _id: 1 },
  { name: "idx_funding_feed_round_read_models_visible_red_flags" },
);
FomoV2FundingFeedRoundReadModelSchema.index(
  { visible: 1, hasToken: 1, fundingDate: -1, _id: 1 },
  { name: "idx_funding_feed_round_read_models_visible_token" },
);
FomoV2FundingFeedRoundReadModelSchema.index(
  { visible: 1, categoryKeys: 1, fundingDate: -1, _id: 1 },
  { name: "idx_funding_feed_round_read_models_visible_category" },
);
FomoV2FundingFeedRoundReadModelSchema.index(
  { visible: 1, fundingTypeKeys: 1, fundingDate: -1, _id: 1 },
  { name: "idx_funding_feed_round_read_models_visible_type" },
);
FomoV2FundingFeedRoundReadModelSchema.index(
  { visible: 1, investorIds: 1, fundingDate: -1, _id: 1 },
  { name: "idx_funding_feed_round_read_models_visible_investor" },
);
FomoV2FundingFeedRoundReadModelSchema.index(
  { visible: 1, investorSlugs: 1, fundingDate: -1, _id: 1 },
  { name: "idx_funding_feed_round_read_models_visible_investor_slug" },
);
FomoV2FundingFeedRoundReadModelSchema.index(
  { visible: 1, searchPrefixes: 1, fundingDate: -1, _id: 1 },
  { name: "idx_funding_feed_round_read_models_visible_search_prefix" },
);
