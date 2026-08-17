import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";

export type FomoV2ProjectExchangeOverviewDocument =
  HydratedDocument<FomoV2ProjectExchangeOverview>;

@Schema({
  collection: "project_exchange_overviews",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2ProjectExchangeOverview {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "FomoV2CanonicalProject",
    required: true,
    unique: true,
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

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  tabs: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  topMarkets: Record<string, any[]>;

}

export const FomoV2ProjectExchangeOverviewSchema =
  SchemaFactory.createForClass(FomoV2ProjectExchangeOverview);

FomoV2ProjectExchangeOverviewSchema.index(
  { marketAssetId: 1 },
  { name: "idx_project_exchange_overviews_market_asset" },
);
FomoV2ProjectExchangeOverviewSchema.index(
  { coingeckoCoinId: 1 },
  { name: "idx_project_exchange_overviews_coingecko_id" },
);
FomoV2ProjectExchangeOverviewSchema.index(
  { updatedAt: -1 },
  { name: "idx_project_exchange_overviews_updated_at" },
);
