import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from "../config";
import { IReturnData } from "../types";

export default async (queryString: string): Promise<IReturnData> => {
  try {
    const token: string = getAccessToken();

    if (!token) {
      throw new Error("Not auth");
    }

    const response = await fetch(configureUrl(`deals/appeals${queryString}`), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    const data = await response.json();

    return { success: response.status < 300, data };
  } catch (error) {
    console.log(error);
    return { success: false, data: error };
  }
};
