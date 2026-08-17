import { API } from "../../config/api";
import { ICreateNews, INews } from "../../types/global_types";
import { configureFetchForm } from "../../helpers/fetchConfig";
import getAuthToken from "../getAuthToken";

export default async (
  news: ICreateNews,
  path: string
): Promise<{ isSuccess: boolean; news: INews | null }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const { body } = configureFetchForm("POST", news, {});

    const res = await fetch(`${API}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: body,
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, news: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, news: null };
  }
};
