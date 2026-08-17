import { API } from "../../config/api";

export interface FomiesSearchUser {
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
  followersCount: number;
}

export default async (params: {
  search: string;
  excludeIds?: string[];
  limit?: number;
}): Promise<{ items: FomiesSearchUser[] }> => {
  const searchParams = new URLSearchParams();
  searchParams.set("search", params.search.trim());
  searchParams.set("limit", String(params.limit || 10));

  if (params.excludeIds?.length) {
    searchParams.set("excludeIds", params.excludeIds.join(","));
  }

  const res = await fetch(`${API}/user/fomonauts/search?${searchParams.toString()}`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Failed to search fomies users");
  }

  return {
    items: Array.isArray(data?.items) ? data.items : [],
  };
};
