import getAuthToken from "../getAuthToken";
import { IReturnData } from "../../helpers/types";
import { API } from "../../config/api";
import { ICreateMessage } from "../../types/global_types";

export default async (users: Array<string>): Promise<IReturnData> => {
  try {
    const token: string | null = getAuthToken();

    if (!token) {
      throw new Error("Not auth");
    }

    const responce = await fetch(`${API}/chats`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ users }),
      credentials: "include",
    });

    const chat = await responce.json();

    return { success: true, data: chat };
  } catch (error) {
    console.log(error);
    return { success: false, data: error };
  }
};
