import { API } from "../../config/api";
import { INews } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  path: string
): Promise<{ isSuccess: boolean; newsItem: INews | null }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/${path}`, {
      method: "GET",
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, newsItem: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, newsItem: null };
  }
};
