import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from "../config";

export interface IBuzzAiSettings {
  autoReplyEnabled: boolean;
  mentionsEnabled: boolean;
  minComments: number;
  minUniqueParticipants: number;
  cooldownSec: number;
  maxRepliesPerThread: number;
  maxRepliesPerDay: number;
  dailyCogsUsdLimit: number;
  monthlyCogsUsdLimit: number;
}

export interface IBuzzAiBudget {
  dailyCogsUsdLimit: number;
  monthlyCogsUsdLimit: number;
  daySpendUsd: number;
  monthSpendUsd: number;
  dayRemainingUsd: number;
  monthRemainingUsd: number;
}

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

export const fetchBuzzAiSettings = () => request("comments/admin/ai/settings", { method: "GET" });
export const updateBuzzAiSettings = (body: Partial<IBuzzAiSettings>) =>
  request("comments/admin/ai/settings", { method: "PATCH", body: JSON.stringify(body) });
export const fetchBuzzAiBudget = () => request("comments/admin/ai/budget", { method: "GET" });
