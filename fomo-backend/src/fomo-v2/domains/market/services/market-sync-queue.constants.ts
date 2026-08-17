import { MarketDataTier } from "src/coingecko/coingecko-market.types";
import { FomoV2MarketSyncKind } from "../models";
import type { FomoV2MarketLatestCadence } from "./market-sync-latest-cadence.config";

export const FOMO_V2_MARKET_SYNC_QUEUE = "fomo-v2-market-sync";

export const FOMO_V2_MARKET_SYNC_JOBS = {
  LATEST_BATCH: "market.latest.batch",
  HISTORY_BATCH: "market.history.batch",
  CHART7D_BATCH: "market.chart7d.batch",
  PERFORMANCE_BATCH: "market.performance.batch",
  ROI_BATCH: "market.roi.batch",
  EXCHANGES_BATCH: "market.exchanges.batch",
} as const;

export type FomoV2MarketSyncJobName =
  (typeof FOMO_V2_MARKET_SYNC_JOBS)[keyof typeof FOMO_V2_MARKET_SYNC_JOBS];

export interface FomoV2MarketSyncTargetPayload {
  syncStateId: string;
  marketAssetId: string;
  canonicalProjectId?: string;
  coingeckoId: string;
  symbol?: string;
  tier: MarketDataTier;
  rank?: number;
  claimedAt?: string;
  latestCadence?: FomoV2MarketLatestCadence;
}

export interface FomoV2MarketSyncBatchPayload {
  kind: FomoV2MarketSyncKind;
  tier: MarketDataTier;
  latestCadence?: FomoV2MarketLatestCadence;
  targets: FomoV2MarketSyncTargetPayload[];
  claimOwner: string;
  reason: "cron" | "latest-success" | "history-success" | "manual";
  queuedAt: string;
}
