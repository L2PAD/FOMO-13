import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { MarketDataTier } from "src/coingecko/coingecko-market.types";

export type FomoV2MarketProjectHistorySource = "coingecko" | "manual";
export type FomoV2MarketProjectHistoryDocument = HydratedDocument<FomoV2MarketProjectHistory>;

@Schema({ collection: "market_project_histories", timestamps: true, strict: true, autoIndex: false })
export class FomoV2MarketProjectHistory {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2CanonicalProject" })
  canonicalProjectId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2MarketAsset", required: true })
  marketAssetId: Types.ObjectId;

  @Prop({ index: true })
  timestamp?: Date;

  @Prop({ index: true })
  bucketTimestamp?: Date;

  @Prop()
  price?: number;

  @Prop()
  marketCap?: number;

  @Prop()
  volume24h?: number;

  @Prop()
  priceChange24h?: number;

  @Prop()
  btcPriceUsd?: number;

  @Prop()
  ethPriceUsd?: number;

  @Prop()
  solPriceUsd?: number;

  @Prop({ type: String, enum: ["coingecko", "manual"], default: "coingecko", index: true })
  source?: FomoV2MarketProjectHistorySource;

  @Prop({ type: String, enum: ["HOT", "WARM", "COLD"] })
  tier?: MarketDataTier;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  raw?: Record<string, any>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FomoV2MarketProjectHistorySchema =
  SchemaFactory.createForClass(FomoV2MarketProjectHistory);

FomoV2MarketProjectHistorySchema.index(
  { marketAssetId: 1, bucketTimestamp: 1, source: 1 },
  {
    unique: true,
    name: "uniq_market_project_histories_asset_bucket_source",
    partialFilterExpression: { bucketTimestamp: { $type: "date" } },
  },
);
FomoV2MarketProjectHistorySchema.index(
  { canonicalProjectId: 1, bucketTimestamp: -1 },
  {
    sparse: true,
    name: "idx_market_project_histories_canonical_bucket",
  },
);
FomoV2MarketProjectHistorySchema.index(
  { marketAssetId: 1, bucketTimestamp: -1 },
  { name: "idx_market_project_histories_asset_bucket" },
);
