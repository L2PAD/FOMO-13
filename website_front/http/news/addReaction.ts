import { API } from "../../config/api";
import { INews } from "../../types/global_types";
import getAccessToken from "../getAuthToken";

type actionType = "like" | "dislike";

export default async (
  action: actionType,
  id: string,
  method?: "PUT" | "PATCH"
): Promise<{ isSuccess: boolean; news: INews | null }> => {
  try {
    const accessToken: string | null = getAccessToken();

    const res = await fetch(`${API}/news/${action}/${id}`, {
      method: method || "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, news: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, news: null };
  }
};
