import { API } from "../../config/api";
import { ITopicListResponse } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export interface TopicListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  filter?: string;
  category?: string;
  fromDate?: string;
  toDate?: string;
}

export default async (
  params: TopicListParams
): Promise<{ isSuccess: boolean; data: ITopicListResponse | null }> => {
  try {
    const accessToken: string | null = getAuthToken();
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && `${value}`.trim() !== "") {
        searchParams.set(key, `${value}`);
      }
    });

    const res = await fetch(
      `${API}/comments/topic/all?${searchParams.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

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
