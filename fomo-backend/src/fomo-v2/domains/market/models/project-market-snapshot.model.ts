import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type FomoV2ProjectMarketSnapshotProvider = "coingecko";
export type FomoV2ProjectMarketSnapshotDocument = HydratedDocument<FomoV2ProjectMarketSnapshot>;

@Schema({ collection: "project_market_snapshots", timestamps: true, strict: true, autoIndex: false })
export class FomoV2ProjectMarketSnapshot {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2CanonicalProject" })
  canonicalProjectId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2MarketAsset", required: true })
  marketAssetId: Types.ObjectId;

  @Prop({ type: String, enum: ["coingecko"], required: true, index: true })
  provider: FomoV2ProjectMarketSnapshotProvider;

  @Prop({ required: true, index: true })
  providerAssetId: string;

  @Prop({ required: true, index: true })
  coingeckoId: string;

  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop()
  priceUsd?: number;

  @Prop()
  marketCapUsd?: number;

  @Prop()
  volumeUsd?: number;

  @Prop()
  btcPriceUsd?: number;

  @Prop()
  ethPriceUsd?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FomoV2ProjectMarketSnapshotSchema =
  SchemaFactory.createForClass(FomoV2ProjectMarketSnapshot);

FomoV2ProjectMarketSnapshotSchema.index(
  { marketAssetId: 1, provider: 1, timestamp: 1 },
  { unique: true, name: "uniq_project_market_snapshots_asset_provider_timestamp" },
);
FomoV2ProjectMarketSnapshotSchema.index(
  { canonicalProjectId: 1, timestamp: -1 },
  { sparse: true, name: "idx_project_market_snapshots_canonical_timestamp" },
);
FomoV2ProjectMarketSnapshotSchema.index(
  { providerAssetId: 1, timestamp: -1 },
  { name: "idx_project_market_snapshots_provider_asset_timestamp" },
);
