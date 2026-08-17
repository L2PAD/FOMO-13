import { API } from "../../config/api";
import { IMessage } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (
  path: string
): Promise<{ isSuccess: boolean; messages: Array<IMessage> }> => {
  try {
    const accessToken: string | null = getAuthToken();

    if (!accessToken) return { isSuccess: false, messages: [] };

    const res = await fetch(`${API}/messages/${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, messages: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, messages: [] };
  }
};
