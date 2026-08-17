import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export default async (
  topicId: string
): Promise<{ isSuccess: boolean; suggestion: string; error: string }> => {
  try {
    const accessToken: string | null = getAuthToken();
    const res = await fetch(`${API}/comments/topic/${topicId}/suggestion`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      suggestion: data?.suggestion || "",
      error: data?.message || "",
    };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, suggestion: "", error: "" };
  }
};
