import { API } from "../../config/api";
import { ITopicInsights } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  topicId: string
): Promise<{
  isSuccess: boolean;
  insights: ITopicInsights | null;
  error: string;
}> => {
  try {
    const accessToken: string | null = getAuthToken();
    const res = await fetch(`${API}/comments/topic/${topicId}/summary/regenerate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      insights: data?.insights || null,
      error: data?.message || "",
    };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, insights: null, error: "" };
  }
};
