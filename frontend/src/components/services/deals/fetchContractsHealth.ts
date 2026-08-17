import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from "../config";
import { IReturnData } from "../types";

export default async (dataMode: "demo" | "production" = "demo"): Promise<IReturnData> => {
  try {
    const token = getAccessToken();
    if (!token) throw new Error("Not auth");
    const res = await fetch(configureUrl(`deals/admin/contracts-health?dataMode=${dataMode}`), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    return { success: res.status < 300, data: await res.json() };
  } catch (error) {
    return { success: false, data: error };
  }
};
