import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { MarketDataTier } from "src/coingecko/coingecko-market.types";

export type FomoV2MarketProjectPerformanceDocument = HydratedDocument<FomoV2MarketProjectPerformance>;
export type FomoV2MarketProjectPerformanceSource = "market_project_histories" | "project_market_snapshots";

@Schema({ collection: "market_project_performances", timestamps: true, strict: true, autoIndex: false })
export class FomoV2MarketProjectPerformance {
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

  @Prop({ required: true })
  anchorTimestamp: Date;

  @Prop({ required: true })
  calculatedAt: Date;

  @Prop({ type: String, enum: ["market_project_histories", "project_market_snapshots"], required: true })
  source: FomoV2MarketProjectPerformanceSource;

  @Prop({ default: "coingecko" })
  provider?: string;

  @Prop({ default: 1 })
  version?: number;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  performance?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  allTimePriceChange?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  missing?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  meta?: Record<string, any>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FomoV2MarketProjectPerformanceSchema =
  SchemaFactory.createForClass(FomoV2MarketProjectPerformance);

FomoV2MarketProjectPerformanceSchema.index(
  { marketAssetId: 1 },
  { unique: true, name: "uniq_market_project_performances_market_asset" },
);
FomoV2MarketProjectPerformanceSchema.index(
  { canonicalProjectId: 1 },
  { sparse: true, name: "idx_market_project_performances_canonical_project" },
);
FomoV2MarketProjectPerformanceSchema.index(
  { coingeckoId: 1 },
  { sparse: true, name: "idx_market_project_performances_coingecko_id" },
);
FomoV2MarketProjectPerformanceSchema.index(
  { tier: 1, calculatedAt: -1 },
  { sparse: true, name: "idx_market_project_performances_tier_calculated" },
);
FomoV2MarketProjectPerformanceSchema.index(
  { anchorTimestamp: -1 },
  { name: "idx_market_project_performances_anchor_timestamp" },
);
