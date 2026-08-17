import getAuthToken from "../getAuthToken";
import { IReturnData } from "../../helpers/types";
import { API } from "../../config/api";

export default async (chatId: string): Promise<IReturnData> => {
  try {
    const token: string | null = getAuthToken();

    if (!token) {
      throw new Error("Not auth");
    }

    const responce = await fetch(`${API}/messages/${chatId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    const message = await responce.json();

    return { success: true, data: message };
  } catch (error) {
    console.log(error);
    return { success: false, data: error };
  }
};
