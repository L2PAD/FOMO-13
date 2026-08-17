import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import {
  FOMO_V2_MARKET_ASSET_TYPES,
  FomoV2ContractIdentity,
  FomoV2MarketAssetType,
  FomoV2ProviderIds,
} from "../../../fomo-v2.types";

export type FomoV2MarketAssetDocument = HydratedDocument<FomoV2MarketAsset>;

@Schema({ collection: "market_assets", timestamps: true, strict: true, autoIndex: false })
export class FomoV2MarketAsset {
  @Prop({ type: String, required: true, enum: FOMO_V2_MARKET_ASSET_TYPES, default: "unknown" })
  assetType: FomoV2MarketAssetType;

  @Prop({ required: true })
  name: string;

  @Prop()
  normalizedName?: string;

  @Prop()
  symbol?: string;

  @Prop()
  normalizedSymbol?: string;

  @Prop()
  slug?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  providerIds?: FomoV2ProviderIds;

  @Prop({
    type: [
      {
        chainId: { type: String },
        chainSlug: { type: String },
        chainKey: { type: String, required: true },
        address: { type: String, required: true },
        normalizedAddress: { type: String, required: true },
        source: { type: String },
        verified: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  contracts?: FomoV2ContractIdentity[];

  @Prop({ type: [String], default: [] })
  contractKeys?: string[];

  @Prop({ type: [String], default: [] })
  websiteDomains?: string[];

  @Prop({ type: String, required: true, default: "active" })
  status: "active" | "proposed" | "deprecated";

  @Prop({ required: true, default: Date.now })
  firstSeenAt: Date;

  @Prop({ required: true, default: Date.now })
  lastSeenAt: Date;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2MarketAssetSchema = SchemaFactory.createForClass(FomoV2MarketAsset);

FomoV2MarketAssetSchema.index(
  { "providerIds.coingeckoId": 1 },
  {
    unique: true,
    name: "uniq_market_assets_coingecko_id",
    partialFilterExpression: { "providerIds.coingeckoId": { $type: "string" } },
  },
);
FomoV2MarketAssetSchema.index(
  { "providerIds.coinMarketCapId": 1 },
  {
    unique: true,
    name: "uniq_market_assets_coinmarketcap_id",
    partialFilterExpression: { "providerIds.coinMarketCapId": { $type: "string" } },
  },
);
FomoV2MarketAssetSchema.index(
  { contractKeys: 1 },
  {
    unique: true,
    name: "uniq_market_assets_contract_keys",
    partialFilterExpression: { contractKeys: { $type: "string" } },
  },
);
FomoV2MarketAssetSchema.index({ normalizedSymbol: 1 }, { name: "idx_market_assets_normalized_symbol" });
FomoV2MarketAssetSchema.index({ slug: 1 }, { sparse: true, name: "idx_market_assets_slug" });
FomoV2MarketAssetSchema.index({ status: 1 }, { name: "idx_market_assets_status" });
