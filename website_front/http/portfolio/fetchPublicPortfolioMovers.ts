import { API } from "../../config/api";

export type PublicPortfolioMoversRange = "24H" | "7D";
export type PublicPortfolioMoversDirection = "gainers" | "losers";

export interface PublicPortfolioMoverItem {
  portfolioId: string;
  portfolioName: string;
  shareCode: string;
  totalBalance: number;
  performanceValue: number;
  owner: {
    id?: string;
    displayName: string;
    username?: string;
    avatar?: string;
    fomoId?: number;
  };
}

export interface PublicPortfolioMoversResponse {
  items: PublicPortfolioMoverItem[];
  range: PublicPortfolioMoversRange;
  direction: PublicPortfolioMoversDirection;
  limit: number;
}

const fetchPublicPortfolioMovers = async (
  range: PublicPortfolioMoversRange,
  direction: PublicPortfolioMoversDirection,
  limit = 10
): Promise<PublicPortfolioMoversResponse> => {
  const params = new URLSearchParams({
    range,
    direction,
    limit: String(limit),
  });
  const response = await fetch(`${API}/portfolio/public/movers?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch public portfolio movers");
  }

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    range: data?.range === "7D" ? "7D" : "24H",
    direction: data?.direction === "losers" ? "losers" : "gainers",
    limit: Number.isFinite(Number(data?.limit)) ? Number(data.limit) : limit,
  };
};

export default fetchPublicPortfolioMovers;
