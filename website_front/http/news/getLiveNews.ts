import { API } from "../../config/api";
import { IKeywordTweet } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  path: string
): Promise<{ isSuccess: boolean; news: Array<IKeywordTweet>, total: number }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/${path}`, {
      method: "GET",
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, news: data?.news || [], total: data?.total || 0 };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, news: [], total: 0 };
  }
};
