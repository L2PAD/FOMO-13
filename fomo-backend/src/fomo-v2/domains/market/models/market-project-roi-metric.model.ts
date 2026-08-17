import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { MarketDataTier } from "src/coingecko/coingecko-market.types";

export type FomoV2MarketProjectRoiMetricDocument = HydratedDocument<FomoV2MarketProjectRoiMetric>;
export type FomoV2MarketProjectRoiMetricSource = "market_project_histories" | "project_market_snapshots";

@Schema({ collection: "market_project_roi_metrics", timestamps: true, strict: true, autoIndex: false })
export class FomoV2MarketProjectRoiMetric {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2CanonicalProject" })
  canonicalProjectId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2MarketAsset", required: true })
  marketAssetId: Types.ObjectId;

  @Prop()
  coingeckoId?: string;

  @Prop()
  symbol?: string;

  @Prop({ type: String, enum: ["HOT", "WARM", "COLD"] })
  tier?: MarketDataTier;

  @Prop()
  anchorTimestamp?: Date;

  @Prop({ required: true })
  calculatedAt: Date;

  @Prop({ type: String, enum: ["market_project_histories", "project_market_snapshots"] })
  source?: FomoV2MarketProjectRoiMetricSource;

  @Prop({ default: "coingecko" })
  provider?: string;

  @Prop({ default: 1 })
  version?: number;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  entryPrice?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  currentPrice?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  roiMultiplier?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  totalRaised?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  missing?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  meta?: Record<string, any>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FomoV2MarketProjectRoiMetricSchema =
  SchemaFactory.createForClass(FomoV2MarketProjectRoiMetric);

FomoV2MarketProjectRoiMetricSchema.index(
  { marketAssetId: 1 },
  { unique: true, name: "uniq_market_project_roi_metrics_market_asset" },
);
FomoV2MarketProjectRoiMetricSchema.index(
  { canonicalProjectId: 1 },
  { sparse: true, name: "idx_market_project_roi_metrics_canonical_project" },
);
FomoV2MarketProjectRoiMetricSchema.index(
  { coingeckoId: 1 },
  { sparse: true, name: "idx_market_project_roi_metrics_coingecko_id" },
);
FomoV2MarketProjectRoiMetricSchema.index(
  { tier: 1, calculatedAt: -1 },
  { sparse: true, name: "idx_market_project_roi_metrics_tier_calculated" },
);
FomoV2MarketProjectRoiMetricSchema.index(
  { "entryPrice.fundingRoundId": 1 },
  { sparse: true, name: "idx_market_project_roi_metrics_entry_funding_round" },
);
