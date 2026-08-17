import getAuthToken from "../getAuthToken";
import { IReturnData } from "../../helpers/types";
import { API } from "../../config/api";
import { ICreateMessage } from "../../types/global_types";

export default async (data: ICreateMessage): Promise<IReturnData> => {
  try {
    const token: string | null = getAuthToken();

    if (!token) {
      throw new Error("Not auth");
    }

    const responce = await fetch(`${API}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    });

    const message = await responce.json();

    return { success: true, data: message };
  } catch (error) {
    console.log(error);
    return { success: false, data: error };
  }
};
