import { MarketDataTier } from "src/coingecko/coingecko-market.types";
import { FomoV2CoinGeckoMarketHistoryDays } from "./coingecko-market-history-sync.service";
import { FomoV2MarketSyncKind } from "../models";
import {
  FomoV2MarketLatestCadence,
  getFomoV2MarketLatestIntervalMs,
} from "./market-sync-latest-cadence.config";

export { FOMO_V2_MARKET_LATEST_INTERVAL_MS_BY_TIER } from "./market-sync-latest-cadence.config";

export const FOMO_V2_MARKET_HISTORY_BUCKET_MS_BY_TIER: Record<MarketDataTier, number> = {
  HOT: 5 * 60 * 1000,
  WARM: 60 * 60 * 1000,
  COLD: 3 * 60 * 60 * 1000,
};

const DEFAULT_HISTORY_SYNC_INTERVAL_MS_BY_TIER: Record<MarketDataTier, number> = {
  HOT: 6 * 60 * 60 * 1000,
  WARM: 24 * 60 * 60 * 1000,
  COLD: 72 * 60 * 60 * 1000,
};

const DEFAULT_DERIVED_INTERVAL_MS_BY_TIER: Record<MarketDataTier, number> = {
  HOT: FOMO_V2_MARKET_HISTORY_BUCKET_MS_BY_TIER.HOT,
  WARM: FOMO_V2_MARKET_HISTORY_BUCKET_MS_BY_TIER.WARM,
  COLD: FOMO_V2_MARKET_HISTORY_BUCKET_MS_BY_TIER.COLD,
};

export const FOMO_V2_MARKET_CHART7D_INTERVAL_MS_BY_TIER: Record<MarketDataTier, number> = {
  HOT: 3 * 60 * 60 * 1000,
  WARM: 12 * 60 * 60 * 1000,
  COLD: 24 * 60 * 60 * 1000,
};

const DEFAULT_EXCHANGES_SYNC_INTERVAL_MS_BY_TIER: Record<MarketDataTier, number> = {
  HOT: 12 * 60 * 60 * 1000,
  WARM: 24 * 60 * 60 * 1000,
  COLD: 72 * 60 * 60 * 1000,
};

export function getFomoV2MarketSyncIntervalMs(
  kind: FomoV2MarketSyncKind,
  tier: MarketDataTier,
  latestCadence?: FomoV2MarketLatestCadence,
): number {
  if (kind === "latest") {
    return getFomoV2MarketLatestIntervalMs(latestCadence || tier);
  }
  if (kind === "history") {
    return readTierMs("FOMO_V2_MARKET_SYNC_HISTORY", tier, DEFAULT_HISTORY_SYNC_INTERVAL_MS_BY_TIER[tier]);
  }
  if (kind === "chart7d") {
    return readTierMs("FOMO_V2_MARKET_SYNC_CHART7D", tier, FOMO_V2_MARKET_CHART7D_INTERVAL_MS_BY_TIER[tier]);
  }
  if (kind === "exchanges") {
    return readTierMs("FOMO_V2_MARKET_SYNC_EXCHANGES", tier, DEFAULT_EXCHANGES_SYNC_INTERVAL_MS_BY_TIER[tier]);
  }

  return readTierMs(`FOMO_V2_MARKET_SYNC_${kind.toUpperCase()}`, tier, DEFAULT_DERIVED_INTERVAL_MS_BY_TIER[tier]);
}

export function getFomoV2MarketHistoryDays(tier: MarketDataTier): FomoV2CoinGeckoMarketHistoryDays {
  const value = process.env[`FOMO_V2_MARKET_SYNC_HISTORY_${tier}_DAYS`] || process.env.FOMO_V2_MARKET_SYNC_HISTORY_DAYS;
  if (value === "max") return "max";

  const parsed = Number(value);
  if (parsed === 1 || parsed === 7 || parsed === 30 || parsed === 90) return parsed;

  if (tier === "HOT") return 90;
  if (tier === "WARM") return 30;
  return 7;
}

export function getFomoV2MarketSyncLockMs(kind: FomoV2MarketSyncKind): number {
  const fallback = kind === "history" || kind === "exchanges" ? 30 * 60 * 1000 : 10 * 60 * 1000;
  return readMs(`FOMO_V2_MARKET_SYNC_${kind.toUpperCase()}_LOCK_MS`, fallback);
}

function readTierMs(prefix: string, tier: MarketDataTier, fallback: number): number {
  return readMs(`${prefix}_${tier}_INTERVAL_MS`, readMs(`${prefix}_INTERVAL_MS`, fallback));
}

function readMs(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}
