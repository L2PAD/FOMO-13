import { API } from "../../config/api";

export interface ITopContributor {
  rank: number;
  id: string;
  username: string;
  name: string;
  avatar: string;
  score: number;
  influence: number;
  topics: number;
  usefulComments: number;
  period: string;
}

// Global Top Contributors from the influence read-model (time-decay 7d/30d/all).
export const fetchTopContributors = async (
  period: "7d" | "30d" | "all" = "30d"
): Promise<ITopContributor[]> => {
  try {
    const res = await fetch(`${API}/comments/contributors?period=${period}`, {
      method: "GET",
    });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("fetchTopContributors", error);
    return [];
  }
};
