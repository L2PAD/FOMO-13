import { API } from "../../config/api";
import { ITopicDetailResponse } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  topicId: string
): Promise<{ isSuccess: boolean; data: ITopicDetailResponse | null }> => {
  try {
    const accessToken: string | null = getAuthToken();
    const res = await fetch(`${API}/comments/topic/${topicId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      data: res.status < 300 ? data : null,
    };
  } catch (error) {
    console.log(error);
    return { isSuccess: false, data: null };
  }
};
