import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import { MarketDataTier } from "src/coingecko/coingecko-market.types";

export const FOMO_V2_MARKET_SYNC_KINDS = [
  "latest",
  "history",
  "chart7d",
  "performance",
  "roi",
  "exchanges",
] as const;
export type FomoV2MarketSyncKind = (typeof FOMO_V2_MARKET_SYNC_KINDS)[number];
export type FomoV2MarketSyncStateDocument = HydratedDocument<FomoV2MarketSyncState>;

@Schema({ collection: "market_sync_states", timestamps: true, strict: true, autoIndex: false })
export class FomoV2MarketSyncState {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2CanonicalProject" })
  canonicalProjectId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2MarketAsset", required: true })
  marketAssetId: Types.ObjectId;

  @Prop({ required: true, index: true })
  coingeckoId: string;

  @Prop()
  symbol?: string;

  @Prop()
  name?: string;

  @Prop()
  rank?: number;

  @Prop({ type: String, enum: ["HOT", "WARM", "COLD"], index: true })
  tier?: MarketDataTier;

  @Prop({ default: "CURRENTLY_TRADING" })
  trading?: string;

  @Prop({ default: "active" })
  status?: string;

  @Prop({ index: true })
  latestDueAt?: Date;

  @Prop({ index: true })
  historyDueAt?: Date;

  @Prop({ index: true })
  chart7dDueAt?: Date;

  @Prop({ index: true })
  performanceDueAt?: Date;

  @Prop({ index: true })
  roiDueAt?: Date;

  @Prop({ index: true })
  exchangesDueAt?: Date;

  @Prop()
  lockedUntil?: Date;

  @Prop()
  lockedBy?: string;

  @Prop({ type: String, enum: FOMO_V2_MARKET_SYNC_KINDS })
  lockedKind?: FomoV2MarketSyncKind;

  @Prop()
  lastClaimedAt?: Date;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  lastSuccessAt?: Partial<Record<FomoV2MarketSyncKind, Date>>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  lastErrorAt?: Partial<Record<FomoV2MarketSyncKind, Date>>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  errorCount?: Partial<Record<FomoV2MarketSyncKind, number>>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  lastError?: Partial<Record<FomoV2MarketSyncKind, string>>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  meta?: Record<string, any>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FomoV2MarketSyncStateSchema =
  SchemaFactory.createForClass(FomoV2MarketSyncState);

FomoV2MarketSyncStateSchema.index(
  { marketAssetId: 1 },
  { unique: true, name: "uniq_market_sync_states_market_asset" },
);
FomoV2MarketSyncStateSchema.index(
  { coingeckoId: 1 },
  { sparse: true, name: "idx_market_sync_states_coingecko_id" },
);
FomoV2MarketSyncStateSchema.index(
  { tier: 1, latestDueAt: 1, rank: 1 },
  { sparse: true, name: "idx_market_sync_states_latest_due" },
);
FomoV2MarketSyncStateSchema.index(
  { tier: 1, historyDueAt: 1, rank: 1 },
  { sparse: true, name: "idx_market_sync_states_history_due" },
);
FomoV2MarketSyncStateSchema.index(
  { tier: 1, chart7dDueAt: 1, rank: 1 },
  { sparse: true, name: "idx_market_sync_states_chart7d_due" },
);
FomoV2MarketSyncStateSchema.index(
  { tier: 1, performanceDueAt: 1, rank: 1 },
  { sparse: true, name: "idx_market_sync_states_performance_due" },
);
FomoV2MarketSyncStateSchema.index(
  { tier: 1, roiDueAt: 1, rank: 1 },
  { sparse: true, name: "idx_market_sync_states_roi_due" },
);
FomoV2MarketSyncStateSchema.index(
  { tier: 1, exchangesDueAt: 1, rank: 1 },
  { sparse: true, name: "idx_market_sync_states_exchanges_due" },
);
FomoV2MarketSyncStateSchema.index(
  { lockedUntil: 1, lockedKind: 1 },
  { sparse: true, name: "idx_market_sync_states_lock" },
);
