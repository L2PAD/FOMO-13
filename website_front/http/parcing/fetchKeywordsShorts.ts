import { API } from "../../config/api";
import { IKeywordTweet, IParcingTwitterAcc } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export interface IKeywordsReturnData {
  keywords: Array<any>;
  isSuccess: boolean
}
export default async (
  query?: string
): Promise<IKeywordsReturnData> => {
  try {
    const token: string | null = getAuthToken();

    let path = "/socialparcing";

    if (query) path += query;

    const res = await fetch(`${API}${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      keywords: data,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, keywords: [] };
  }
};
