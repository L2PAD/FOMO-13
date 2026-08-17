import { API } from "../../config/api";

export interface IUserFollowingItem {
  _id: string;
  name: string;
  username: string;
  photo: string;
  avatar: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  rating: number;
  rank: string;
  verificationStatus: boolean;
  twitterData?: {
    photo?: string;
    name?: string;
    username?: string;
    [key: string]: any;
  } | null;
  twitterName: string;
  twitterUsername: string;
  profileLink: string;
}

export interface IUserFollowingResponse {
  items: Array<IUserFollowingItem>;
  total: number;
  offset: number;
  limit: number;
}

export default async (
  userId: string,
  options?: { offset?: number; limit?: number }
): Promise<IUserFollowingResponse> => {
  const url = new URL(`${API}/user/relations/${userId}/following`);

  if (typeof options?.offset === "number") {
    url.searchParams.append("offset", String(options.offset));
  }

  if (typeof options?.limit === "number") {
    url.searchParams.append("limit", String(options.limit));
  }

  const res = await fetch(url.toString(), {
    method: "GET",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Failed to fetch following list");
  }

  return {
    items: data?.items || [],
    total: data?.total || 0,
    offset: data?.offset || options?.offset || 0,
    limit: data?.limit || options?.limit || 12,
  };
};
