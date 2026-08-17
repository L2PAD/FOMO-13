export const CACHE_KEY_PREFIX = process.env.CACHE_KEY_PREFIX || "fomo:api-cache:";

export const CACHE_TTL_SECONDS = {
  fundsFilters: 10 * 60,
  fundingRoundsFilters: 10 * 60,
  analyticsCharts: 2 * 60,
  analyticsComparison: 120,
} as const;
