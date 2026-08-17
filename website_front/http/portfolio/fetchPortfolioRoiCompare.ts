import { API } from "../../config/api";

export type PortfolioRoiCompareRange = "24H" | "7D" | "30D" | "90D" | "1Y" | "ALL";

export interface PortfolioRoiComparePoint {
  date: string;
  roi: number | null;
  totalBalance: number | null;
}

export interface PortfolioRoiCompareItem {
  userId: string;
  portfolioId: string | null;
  hasPublicPortfolio: boolean;
  owner: {
    name: string;
    username: string;
    photo: string;
    twitterData: {
      name?: string;
      username?: string;
      photo?: string;
      [key: string]: any;
    } | null;
  };
  portfolio: {
    portfolioName: string | null;
    currentBalance: number | null;
    allTimeRoi: number | null;
    change24h: number | null;
    roi24h: number | null;
    roi7d: number | null;
    roi30d: number | null;
    roi90d: number | null;
    roi1y: number | null;
    topHeldToken: string | null;
  };
  chart: {
    points: PortfolioRoiComparePoint[];
    hasHistory: boolean;
    hasBaseline: boolean;
  };
}

const fetchPortfolioRoiCompare = async (
  userIds: string[],
  range: PortfolioRoiCompareRange
): Promise<{ items: PortfolioRoiCompareItem[] }> => {
  if (!userIds.length) {
    return { items: [] };
  }

  const params = new URLSearchParams({
    userIds: userIds.join(","),
    range,
  });
  const response = await fetch(`${API}/portfolio/public/compare-roi?${params.toString()}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch portfolio ROI comparison");
  }

  return {
    items: Array.isArray(data?.items) ? data.items : [],
  };
};

export default fetchPortfolioRoiCompare;
