import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { MarketDataTier } from "src/coingecko/coingecko-market.types";

export const FOMO_V2_MARKET_HISTORY_IMPORT_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;

export type FomoV2MarketHistoryImportStatus =
  (typeof FOMO_V2_MARKET_HISTORY_IMPORT_STATUSES)[number];

export type FomoV2MarketHistoryImportRunDocument =
  HydratedDocument<FomoV2MarketHistoryImportRun>;

export type FomoV2MarketHistoryImportDays = number | "max";

export interface FomoV2MarketHistoryImportTierState {
  tier: MarketDataTier;
  days: FomoV2MarketHistoryImportDays;
  status: FomoV2MarketHistoryImportStatus | "pending";
  totalAssets?: number;
  processedAssets?: number;
  historyRequests?: number;
  snapshotsWouldWrite?: number;
  snapshotsCreated?: number;
  snapshotsUpdated?: number;
  errorsCount?: number;
  startedAt?: Date;
  finishedAt?: Date;
  durationMs?: number;
  lastAsset?: {
    marketAssetId?: string;
    coingeckoId?: string;
    name?: string;
    symbol?: string;
  };
  errors?: any[];
}

@Schema({ collection: "market_history_import_runs", timestamps: true, strict: true, autoIndex: false })
export class FomoV2MarketHistoryImportRun {
  @Prop({ type: String, enum: FOMO_V2_MARKET_HISTORY_IMPORT_STATUSES, required: true, index: true })
  status: FomoV2MarketHistoryImportStatus;

  @Prop({ type: String, default: "admin" })
  source?: string;

  @Prop()
  requestedBy?: string;

  @Prop()
  requestedByEmail?: string;

  @Prop()
  workerId?: string;

  @Prop()
  activeTier?: MarketDataTier;

  @Prop()
  activeCoingeckoId?: string;

  @Prop()
  activeAssetName?: string;

  @Prop()
  progressPercent?: number;

  @Prop()
  startedAt?: Date;

  @Prop()
  finishedAt?: Date;

  @Prop()
  lastHeartbeatAt?: Date;

  @Prop()
  durationMs?: number;

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  tiers?: FomoV2MarketHistoryImportTierState[];

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  options?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  totals?: Record<string, any>;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: [] })
  warnings?: string[];

  @Prop({ type: mongoose.Schema.Types.Mixed, default: [] })
  errors?: any[];

  @Prop()
  errorMessage?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const FomoV2MarketHistoryImportRunSchema =
  SchemaFactory.createForClass(FomoV2MarketHistoryImportRun);

FomoV2MarketHistoryImportRunSchema.index(
  { status: 1, createdAt: 1 },
  { name: "idx_market_history_import_runs_status_created" },
);
FomoV2MarketHistoryImportRunSchema.index(
  { createdAt: -1 },
  { name: "idx_market_history_import_runs_created_desc" },
);
