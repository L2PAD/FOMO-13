import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type ProjectExchangeTickerCacheDocument = HydratedDocument<ProjectExchangeTickerCache>;

export type ProjectExchangeType = "spot" | "dex" | "derivative" | "unknown";

@Schema({ collection: "project_exchange_ticker_cache", timestamps: true })
export class ProjectExchangeTickerCache {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true, index: true })
  projectId: mongoose.Types.ObjectId;

  @Prop({ required: true, index: true })
  coingeckoId: string;

  @Prop({ required: true })
  base: string;

  @Prop({ required: true })
  target: string;

  @Prop({ required: true })
  pair: string;

  @Prop({ default: 0 })
  priceUsd: number;

  @Prop({ required: true })
  exchangeName: string;

  @Prop({ required: true })
  exchangeIdentifier: string;

  @Prop()
  exchangeLogo?: string;

  @Prop({ enum: ["spot", "dex", "derivative", "unknown"], default: "unknown", index: true })
  exchangeType: ProjectExchangeType;

  @Prop({ default: 0, index: true })
  volume24hUsd: number;

  @Prop({ default: 0 })
  volumePercent: number;

  @Prop()
  trustScore?: string;

  @Prop()
  tradeUrl?: string;

  @Prop({ enum: ["coingecko"], default: "coingecko" })
  source: "coingecko";

  @Prop({ required: true, index: true })
  fetchedAt: Date;
}

export const ProjectExchangeTickerCacheSchema =
  SchemaFactory.createForClass(ProjectExchangeTickerCache);

ProjectExchangeTickerCacheSchema.index({ projectId: 1, exchangeType: 1, volume24hUsd: -1 });
ProjectExchangeTickerCacheSchema.index(
  { projectId: 1, pair: 1, exchangeIdentifier: 1 },
  { unique: true },
);
