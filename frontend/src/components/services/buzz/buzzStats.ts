import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from "../config";

const request = async (path: string, options?: RequestInit) => {
  const token: string = getAccessToken();
  const response = await fetch(configureUrl(path), {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    credentials: "include",
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  return { success: response.status < 300, data };
};

export interface IBuzzStats {
  activity: {
    topics: number;
    topicsToday: number;
    replies: number;
    repliesToday: number;
    reactions: number;
    activeUsersTotal: number;
    activeUsersMonth: number;
  };
  moderation: { reportedOpen: number; removed: number; hidden: number };
  ai: { repliesTotal: number; repliesToday: number; repliesMonth: number; operationsTotal: number };
  cogs: {
    totalUsd: number;
    dayUsd: number;
    monthUsd: number;
    dailyLimitUsd: number;
    monthlyLimitUsd: number;
    dayRemainingUsd: number;
    monthRemainingUsd: number;
  };
  series: Array<{ date: string; topics: number; replies: number; ai: number }>;
}

export const fetchBuzzStats = () => request(`comments/admin/buzz/stats`, { method: "GET" });
export const fetchBuzzBudget = () => request(`comments/admin/ai/budget`, { method: "GET" });

// FOMO Updates management (news with newsSection = 'fomo-update')
export const fetchAllNews = (page = "crypto") => request(`news/all/${page}`, { method: "GET" });
export const deleteNews = (id: string) => request(`news/${id}`, { method: "DELETE" });
