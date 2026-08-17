import { API } from "../../config/api";

export type FomiesLeaderboardRange = "24H" | "7D" | "30D" | "90D" | "1Y" | "ALL";
export type FomiesLeaderboardSort = "ROI" | "XP";

export interface FomiesLeaderboardItem {
  userId: string;
  name: string;
  username: string;
  photo: string;
  twitterData?: {
    name?: string;
    username?: string;
    photo?: string;
    [key: string]: any;
  } | null;
  rating: number;
  activityXP: number;
  followersCount: number;
  roi: number | null;
  roiRange: FomiesLeaderboardRange;
  hasPublicPortfolio: boolean;
}

export interface FomiesLeaderboardResponse {
  items: FomiesLeaderboardItem[];
  total: number;
  offset: number;
  limit: number;
}

export default async (params: {
  range: FomiesLeaderboardRange;
  sortBy: FomiesLeaderboardSort;
  search?: string;
  offset?: number;
  limit?: number;
}): Promise<FomiesLeaderboardResponse> => {
  const searchParams = new URLSearchParams({
    range: params.range,
    sortBy: params.sortBy,
    offset: String(params.offset || 0),
    limit: String(params.limit || 10),
  });

  if (params.search?.trim()) {
    searchParams.append("search", params.search.trim());
  }

  const res = await fetch(`${API}/user/fomonauts/leaderboard?${searchParams.toString()}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Failed to fetch fomies leaderboard");
  }

  return {
    items: Array.isArray(data?.items) ? data.items : [],
    total: Number(data?.total || 0),
    offset: Number(data?.offset || params.offset || 0),
    limit: Number(data?.limit || params.limit || 10),
  };
};
