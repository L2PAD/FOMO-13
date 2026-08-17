import { API } from "../../config/api";
import { IKeywordTweet, IParcingTwitterAcc } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export interface IKeywordsReturnData {
  keywords: Array<any>;
  stringKeywords: string;
  tweet: IKeywordTweet;
  isPrivate: boolean;
}

export default async (
  query?: string
): Promise<{
  isSuccess: boolean;
  tweets: Array<IKeywordsReturnData>;
  total: number;
  keywords: Array<string>;
}> => {
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
      tweets: data.tweets,
      total: data.total,
      keywords: data.keywords,
    };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, tweets: [], total: 0, keywords: [] };
  }
};
