import { API } from "../../config/api";
import { IMessage } from "../../types/global_types";
import getAuthToken from "../getAuthToken";

export default async (): Promise<{ isSuccess: boolean; chats: Array<any> }> => {
  try {
    const accessToken: string | null = getAuthToken();

    const res = await fetch(`${API}/chats`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await res.json();

    return { isSuccess: res.status < 300, chats: data };
  } catch (error) {
    console.log(error);

    return { isSuccess: false, chats: [] };
  }
};
