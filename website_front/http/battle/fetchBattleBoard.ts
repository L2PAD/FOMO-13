import { API } from "../../config/api";

export type BattleBoardSortBy = "ROI_30D" | "BALANCE" | "CHANGE_24H";
export type BattleBoardSortOrder = "asc" | "desc";

export interface BattleBoardOwner {
  userId: string;
  name: string;
  username: string;
  photo: string;
  twitterData: {
    name?: string;
    username?: string;
    photo?: string;
  } | null;
  verificationStatus: boolean;
}

export interface BattleBoardItem {
  portfolioId: string;
  portfolioName: string;
  owner: BattleBoardOwner;
  metrics: {
    roi30d: number | null;
    currentBalance: number | null;
    change24h: number | null;
    volatility: null;
    riskLevel: null;
  };
}

export interface BattleBoardResponse {
  items: BattleBoardItem[];
  total: number;
  offset: number;
  limit: number;
}

export interface FetchBattleBoardParams {
  search?: string;
  sortBy?: BattleBoardSortBy;
  sortOrder?: BattleBoardSortOrder;
  offset?: number;
  limit?: number;
}

const fetchBattleBoard = async (
  params?: FetchBattleBoardParams
): Promise<BattleBoardResponse> => {
  const url = new URL(`${API}/portfolio/battle-board`);

  if (params?.search?.trim()) {
    url.searchParams.append("search", params.search.trim());
  }

  if (params?.sortBy) {
    url.searchParams.append("sortBy", params.sortBy);
  }

  if (params?.sortOrder) {
    url.searchParams.append("sortOrder", params.sortOrder);
  }

  if (typeof params?.offset === "number") {
    url.searchParams.append("offset", String(params.offset));
  }

  if (typeof params?.limit === "number") {
    url.searchParams.append("limit", String(params.limit));
  }

  const response = await fetch(url.toString(), {
    method: "GET",
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.message || "Failed to fetch battle board");
  }

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: Number(data?.total || 0),
    offset: Number(data?.offset || params?.offset || 0),
    limit: Number(data?.limit || params?.limit || 10),
  };
};

export default fetchBattleBoard;
