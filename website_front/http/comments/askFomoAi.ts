import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export interface IAskFomoAiResult {
  isSuccess: boolean;
  reply: any | null;
  error: string;
}

export default async (topicId: string): Promise<IAskFomoAiResult> => {
  try {
    const accessToken: string | null = getAuthToken();
    const res = await fetch(`${API}/comments/topic/${topicId}/ai-reply`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    const data = await res.json();
    if (!res.ok) {
      return { isSuccess: false, reply: null, error: data?.message || "FOMO AI unavailable" };
    }
    return { isSuccess: true, reply: data?.reply || null, error: "" };
  } catch (error) {
    console.error("askFomoAi", error);
    return { isSuccess: false, reply: null, error: "Network error" };
  }
};
