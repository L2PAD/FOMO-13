import { API } from "../../config/api";

export type ProjectExchangeOverviewType = "all" | "spot" | "dex" | "derivative";

export type ProjectExchangeOverviewReason =
  | "missing_coingecko_id"
  | "not_found"
  | "not_synced"
  | "quota_exceeded"
  | "coingecko_error"
  | "not_hot_project"
  | null;

export interface ProjectExchangeOverviewItem {
  rank: number;
  pair: string;
  priceUsd: number;
  exchangeName: string;
  exchangeLogo?: string;
  exchangeType: "spot" | "dex" | "derivative" | "unknown";
  volume24hUsd: number;
  volumePercent: number;
  trustScore?: string;
  tradeUrl?: string;
}

export interface ProjectExchangeOverviewResponse {
  projectId: string;
  symbol: string;
  coingeckoId?: string;
  stale: boolean;
  fetchedAt?: string;
  reason?: ProjectExchangeOverviewReason;
  page: number;
  limit: number;
  total: number;
  items: ProjectExchangeOverviewItem[];
}

const getProjectExchangeOverview = async (
  projectId: string,
  type: ProjectExchangeOverviewType = "all",
  page = 1,
  limit = 10,
): Promise<ProjectExchangeOverviewResponse> => {
  try {
    const params = new URLSearchParams({
      type,
      page: String(page),
      limit: String(limit),
    });
    const response = await fetch(
      `${API}/fomo-v2/projects/${encodeURIComponent(projectId)}/exchange-markets?${params.toString()}`,
      { method: "GET" },
    );
    const data = await response.json();

    if (!response.ok) {
      return {
        projectId,
        symbol: "",
        stale: false,
        reason: "coingecko_error",
        page,
        limit,
        total: 0,
        items: [],
      };
    }

    return data;
  } catch {
    return {
      projectId,
      symbol: "",
      stale: false,
      reason: "coingecko_error",
      page,
      limit,
      total: 0,
      items: [],
    };
  }
};

export default getProjectExchangeOverview;
