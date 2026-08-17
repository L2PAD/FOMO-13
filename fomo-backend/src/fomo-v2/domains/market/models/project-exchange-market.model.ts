import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type FomoV2ExchangeMarketType = "spot" | "dex" | "derivative";
export type FomoV2ExchangeMarketConfidence = "high" | "medium" | "low";
export type FomoV2ExchangeMarketSource = "coingecko" | "coingecko_onchain";

export type FomoV2ProjectExchangeMarketDocument =
  HydratedDocument<FomoV2ProjectExchangeMarket>;

@Schema({
  collection: "project_exchange_markets",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2ProjectExchangeMarket {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2CanonicalProject",
    required: true,
    index: true,
  })
  canonicalProjectId: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2MarketAsset",
    required: true,
    index: true,
  })
  marketAssetId: Types.ObjectId;

  @Prop({ required: true, index: true })
  coingeckoCoinId: string;

  @Prop({ required: true })
  symbol: string;

  @Prop({ type: String, required: true, enum: ["spot", "dex", "derivative"], index: true })
  type: FomoV2ExchangeMarketType;

  @Prop({ required: true })
  exchangeName: string;

  @Prop()
  exchangeSlug?: string;

  @Prop()
  exchangeLogoUrl?: string;

  @Prop()
  network?: string;

  @Prop({ required: true })
  pair: string;

  @Prop({ required: true })
  base: string;

  @Prop({ required: true })
  quote: string;

  @Prop()
  priceUsd?: number;

  @Prop()
  volume24hUsd?: number;

  @Prop()
  liquidityUsd?: number;

  @Prop()
  openInterestUsd?: number;

  @Prop()
  fundingRate?: number;

  @Prop()
  spreadPercent?: number;

  @Prop()
  trustScore?: string;

  @Prop()
  tradeUrl?: string;

  @Prop({ default: false })
  isStale?: boolean;

  @Prop({ default: false })
  isAnomaly?: boolean;

  @Prop({ type: String, required: true, enum: ["high", "medium", "low"], index: true })
  matchConfidence: FomoV2ExchangeMarketConfidence;

  @Prop({ type: String, required: true, enum: ["coingecko", "coingecko_onchain"], index: true })
  sourceType: FomoV2ExchangeMarketSource;

  @Prop({ required: true })
  sourceMarketKey: string;

  @Prop({ required: true, index: true })
  dataHash: string;

  @Prop({ required: true, index: true })
  fetchedAt: Date;

  @Prop()
  sourceUpdatedAt?: Date;
}

export const FomoV2ProjectExchangeMarketSchema =
  SchemaFactory.createForClass(FomoV2ProjectExchangeMarket);

FomoV2ProjectExchangeMarketSchema.index(
  { canonicalProjectId: 1, type: 1, volume24hUsd: -1 },
  { name: "idx_project_exchange_markets_project_type_volume" },
);
FomoV2ProjectExchangeMarketSchema.index(
  { canonicalProjectId: 1, sourceMarketKey: 1 },
  { unique: true, name: "uniq_project_exchange_markets_project_source_key" },
);
FomoV2ProjectExchangeMarketSchema.index(
  { marketAssetId: 1, type: 1, volume24hUsd: -1 },
  { name: "idx_project_exchange_markets_asset_type_volume" },
);
FomoV2ProjectExchangeMarketSchema.index(
  { coingeckoCoinId: 1, type: 1, volume24hUsd: -1 },
  { name: "idx_project_exchange_markets_coingecko_type_volume" },
);
FomoV2ProjectExchangeMarketSchema.index(
  { dataHash: 1 },
  { name: "idx_project_exchange_markets_data_hash" },
);
FomoV2ProjectExchangeMarketSchema.index(
  { fetchedAt: -1 },
  { name: "idx_project_exchange_markets_fetched_at" },
);
