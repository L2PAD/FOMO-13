import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from "../config";
import { IReturnData } from "../types";

export default async (appealId: string): Promise<IReturnData> => {
  try {
    const token: string = getAccessToken();

    if (!token) {
      throw new Error("Not auth");
    }

    const response = await fetch(
      configureUrl(`deals/appeal/support-chat/${appealId}`),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      }
    );

    const data = await response.json();

    return { success: response.status < 300, data };
  } catch (error) {
    console.log(error);
    return { success: false, data: error };
  }
};
