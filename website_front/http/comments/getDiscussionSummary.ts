import { API } from "../../config/api";

export interface IDiscussionSummary {
  overview?: string;
  keyTakeaways?: string[];
  communityPulse?: string;
  provider?: string;
  model?: string;
  providerCostUsd?: number | null;
  generatedAt?: string;
  status?: string;
}

export interface IDiscussionSummaryResponse {
  page: string;
  status: "READY" | "STALE" | "FAILED" | "NONE";
  commentsVersion: number;
  summary: IDiscussionSummary | null;
}

export default async (
  page: string
): Promise<IDiscussionSummaryResponse | null> => {
  try {
    const res = await fetch(`${API}/comments/discussion/${page}/summary`, {
      method: "GET",
    });
    if (res.status >= 300) return null;
    return (await res.json()) as IDiscussionSummaryResponse;
  } catch (error) {
    console.log(error);
    return null;
  }
};
