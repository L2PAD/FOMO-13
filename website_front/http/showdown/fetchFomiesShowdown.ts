import { API } from "../../config/api";

export interface FomiesShowdownItem {
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
  verificationStatus: boolean;
  activityXP: number;
  rank: string;
  followersCount: number | null;
  portfolio: {
    hasPublicPortfolio: boolean;
    roi30d: number | null;
    totalAssets: number | null;
    totalCategories: number | null;
    topHeldToken: string | null;
    linkedPortfoliosCount: number | null;
    portfolioBalance: number | null;
    numberOfDeals: number | null;
    averageRoi: number | null;
  };
  activity: {
    commentsCount: number | null;
    referralCount: number | null;
    activityCount: number | null;
    hoursOnline: number | null;
    claimedTasksCount: number | null;
  };
  interactions: {
    redFlagsCount: number | null;
    memberSince: string | null;
    location: string | null;
  };
}

export default async (ids: string[]): Promise<{ items: FomiesShowdownItem[] }> => {
  if (!ids.length) {
    return { items: [] };
  }

  const searchParams = new URLSearchParams({
    ids: ids.join(","),
  });
  const res = await fetch(`${API}/user/fomonauts/showdown?${searchParams.toString()}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Failed to fetch fomies showdown");
  }

  return {
    items: Array.isArray(data?.items) ? data.items : [],
  };
};
