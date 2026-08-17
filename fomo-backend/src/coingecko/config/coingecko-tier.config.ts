import { MarketDataTier } from "../coingecko-market.types";

export interface CoinGeckoTierDefinition {
  tier: MarketDataTier;
  minRank: number;
  maxRank: number;
}

export const COINGECKO_TIER_ORDER: MarketDataTier[] = ["HOT", "WARM", "COLD"];

export const COINGECKO_TIERS: Record<MarketDataTier, CoinGeckoTierDefinition> = {
  HOT: {
    tier: "HOT",
    minRank: 1,
    maxRank: 250,
  },
  WARM: {
    tier: "WARM",
    minRank: 251,
    maxRank: 5500,
  },
  COLD: {
    tier: "COLD",
    minRank: 5501,
    maxRank: Number.MAX_SAFE_INTEGER,
  },
};

export const COINGECKO_DEFAULT_COLD_TIER_LIMIT = 20000;

export function getCoinGeckoTierDefinition(tier: MarketDataTier): CoinGeckoTierDefinition {
  return COINGECKO_TIERS[tier];
}

export function getCoinGeckoTierByRank(rank: number): MarketDataTier {
  const normalizedRank = Math.trunc(Number(rank));
  if (!Number.isFinite(normalizedRank) || normalizedRank < COINGECKO_TIERS.HOT.minRank) {
    throw new Error(`Invalid CoinGecko rank=${rank}`);
  }

  for (const tier of COINGECKO_TIER_ORDER) {
    const definition = COINGECKO_TIERS[tier];
    if (normalizedRank >= definition.minRank && normalizedRank <= definition.maxRank) {
      return tier;
    }
  }

  return "COLD";
}

export function buildCoinGeckoTierRankFilter(tier: MarketDataTier): Record<string, number> {
  const definition = getCoinGeckoTierDefinition(tier);
  return {
    $gte: definition.minRank,
    $lte: definition.maxRank,
  };
}

export function getCoinGeckoFiniteTierLimit(tier: MarketDataTier): number | undefined {
  const definition = getCoinGeckoTierDefinition(tier);
  if (definition.maxRank >= Number.MAX_SAFE_INTEGER) return undefined;
  return definition.maxRank - definition.minRank + 1;
}

export function getCoinGeckoColdTierLimit(value: any = process.env.COINGECKO_COLD_TIER_LIMIT): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.trunc(parsed)
    : COINGECKO_DEFAULT_COLD_TIER_LIMIT;
}

export function getCoinGeckoTierProjectLimit(
  tier: MarketDataTier,
  value: any = process.env[`COINGECKO_${tier}_TIER_LIMIT`],
): number | undefined {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) return Math.trunc(parsed);
  if (tier === "COLD") return getCoinGeckoColdTierLimit();
  return getCoinGeckoFiniteTierLimit(tier);
}
