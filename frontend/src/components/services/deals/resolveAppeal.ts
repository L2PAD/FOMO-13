import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from "../config";
import { IReturnData } from "../types";

interface ResolveAppealPayload {
  resolution: string;
  forceCloseDeal?: boolean;
  recipient?: "escrow_funder" | "buyer";
  feeMode?: "with_fee" | "without_fee";
  txHash?: string;
}

export default async (
  appealId: string,
  payload: ResolveAppealPayload
): Promise<IReturnData> => {
  try {
    const token: string = getAccessToken();

    if (!token) {
      throw new Error("Not auth");
    }

    const response = await fetch(configureUrl(`deals/appeal/resolve/${appealId}`), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: "include",
    });

    const data = await response.json();

    return { success: response.status < 300, data };
  } catch (error) {
    console.log(error);
    return { success: false, data: error };
  }
};
