import { API } from "../../config/api";

export type MarketTokenComparisonMetric = "marketCap" | "fdv";

export interface MarketTokenComparisonRow {
  _id?: string;
  id?: string;
  capId?: string;
  readModelId?: string;
  marketAssetId?: string;
  canonicalProjectId?: string;
  coingeckoId?: string;
  projectType?: string;
  name?: string;
  symbol?: string;
  slug?: string;
  logo?: string;
  niche?: string;
  rank?: number;
  price?: number;
  change24h?: number;
  change7d?: number;
  marketCap?: number;
  fullyDilutedMarketCap?: number;
  fdv?: number;
  comparisonValue?: number;
  secondaryValue?: number;
  gainPotential?: number | null;
  isBase?: boolean;
}

export interface MarketTokenComparisonResponse {
  project?: any;
  metric?: MarketTokenComparisonMetric;
  category?: string;
  categories?: string[];
  rows?: MarketTokenComparisonRow[];
  meta?: any;
}

export default async function fetchMarketTokenComparison({
  id,
  category,
  metric = "marketCap",
  limit = 5,
}: {
  id: string;
  category?: string;
  metric?: MarketTokenComparisonMetric;
  limit?: number;
}): Promise<{ isSuccess: boolean; data: MarketTokenComparisonResponse | null }> {
  if (!id) return { isSuccess: false, data: null };

  try {
    const query = new URLSearchParams({
      metric,
      limit: String(limit),
    });

    if (category) query.set("category", category);

    const response = await fetch(
      `${API}/fomo-v2/projects/${encodeURIComponent(id)}/token-comparison?${query.toString()}`,
      { method: "GET" },
    );
    const data = await response.json();

    return {
      isSuccess: response.ok,
      data,
    };
  } catch (error) {
    console.error("Error fetching FOMO v2 market token comparison:", error);
    return { isSuccess: false, data: null };
  }
}
