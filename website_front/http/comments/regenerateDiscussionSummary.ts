import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";
import { IDiscussionSummaryResponse } from "./getDiscussionSummary";

export default async (
  page: string
): Promise<{ isSuccess: boolean; data: IDiscussionSummaryResponse | null; error: string }> => {
  try {
    const accessToken: string | null = getAuthToken();
    const res = await fetch(
      `${API}/comments/discussion/${page}/summary/regenerate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await res.json();
    return {
      isSuccess: res.status < 300,
      data: res.status < 300 ? (data as IDiscussionSummaryResponse) : null,
      error: data?.message || "",
    };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, data: null, error: "network_error" };
  }
};
