import { MarketDataTier } from "src/coingecko/coingecko-market.types";
import { COINGECKO_TIERS } from "src/coingecko/config/coingecko-tier.config";

export type FomoV2MarketLatestCadence = MarketDataTier | "HOT_WARM";
export type FomoV2MarketLatestRankMode = "all" | "between" | "outside";

export interface FomoV2MarketLatestCadenceDefinition {
  cadence: FomoV2MarketLatestCadence;
  tier: MarketDataTier;
  rankMode: FomoV2MarketLatestRankMode;
  minRank?: number;
  maxRank?: number;
}

export const FOMO_V2_MARKET_LATEST_CADENCE_ORDER: FomoV2MarketLatestCadence[] = [
  "HOT",
  "HOT_WARM",
  "WARM",
  "COLD",
];

export const FOMO_V2_MARKET_LATEST_INTERVAL_MS_BY_TIER: Record<MarketDataTier, number> = {
  HOT: 30 * 1000,
  WARM: 10 * 60 * 1000,
  COLD: 3 * 60 * 60 * 1000,
};

const DEFAULT_HOT_WARM_MAX_RANK = 2500;
const DEFAULT_HOT_WARM_INTERVAL_MS = 5 * 60 * 1000;

export function getFomoV2MarketLatestCadenceDefinitions(): FomoV2MarketLatestCadenceDefinition[] {
  const definitions: FomoV2MarketLatestCadenceDefinition[] = [
    { cadence: "HOT", tier: "HOT", rankMode: "all" },
  ];

  if (isFomoV2MarketLatestHotWarmEnabled()) {
    const minRank = COINGECKO_TIERS.WARM.minRank;
    const maxRank = getFomoV2MarketLatestHotWarmMaxRank();
    definitions.push(
      { cadence: "HOT_WARM", tier: "WARM", rankMode: "between", minRank, maxRank },
      { cadence: "WARM", tier: "WARM", rankMode: "outside", minRank, maxRank },
    );
  } else {
    definitions.push({ cadence: "WARM", tier: "WARM", rankMode: "all" });
  }

  definitions.push({ cadence: "COLD", tier: "COLD", rankMode: "all" });
  return definitions;
}

export function resolveFomoV2MarketLatestCadence(
  tier: MarketDataTier,
  rank: number | null | undefined,
): FomoV2MarketLatestCadence {
  if (tier !== "WARM" || !isFomoV2MarketLatestHotWarmEnabled()) return tier;

  const normalizedRank = Number(rank);
  if (!Number.isFinite(normalizedRank)) return "WARM";

  return normalizedRank >= COINGECKO_TIERS.WARM.minRank &&
    normalizedRank <= getFomoV2MarketLatestHotWarmMaxRank()
    ? "HOT_WARM"
    : "WARM";
}

export function getFomoV2MarketLatestIntervalMs(
  cadence: FomoV2MarketLatestCadence,
): number {
  if (cadence === "HOT_WARM") {
    return readMs(
      "FOMO_V2_MARKET_SYNC_LATEST_HOT_WARM_INTERVAL_MS",
      DEFAULT_HOT_WARM_INTERVAL_MS,
    );
  }

  return readMs(
    `FOMO_V2_MARKET_SYNC_LATEST_${cadence}_INTERVAL_MS`,
    readMs(
      "FOMO_V2_MARKET_SYNC_LATEST_INTERVAL_MS",
      FOMO_V2_MARKET_LATEST_INTERVAL_MS_BY_TIER[cadence],
    ),
  );
}

export function getFomoV2MarketLatestHotWarmMaxRank(): number {
  const parsed = Number(process.env.FOMO_V2_MARKET_SYNC_LATEST_HOT_WARM_MAX_RANK);
  const fallback = Math.min(DEFAULT_HOT_WARM_MAX_RANK, COINGECKO_TIERS.WARM.maxRank);
  if (!Number.isFinite(parsed)) return fallback;

  return Math.max(
    COINGECKO_TIERS.WARM.minRank,
    Math.min(COINGECKO_TIERS.WARM.maxRank, Math.trunc(parsed)),
  );
}

export function getFomoV2MarketLatestHotWarmMinRank(): number {
  return COINGECKO_TIERS.WARM.minRank;
}

export function isFomoV2MarketLatestHotWarmEnabled(): boolean {
  return readBoolean("FOMO_V2_MARKET_SYNC_LATEST_HOT_WARM_ENABLED", false);
}

function readBoolean(name: string, fallback: boolean): boolean {
  const value = process.env[name];
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (["false", "0", "off", "no"].includes(normalized)) return false;
  if (["true", "1", "on", "yes"].includes(normalized)) return true;
  return fallback;
}

function readMs(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}
