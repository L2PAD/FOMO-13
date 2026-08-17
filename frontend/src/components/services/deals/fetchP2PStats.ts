import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from "../config";
import { IReturnData } from "../types";

export interface P2PAd {
  _id: string; name?: string; price: number; amount: number; currency?: string; rate: number;
  createDate?: string; creator?: string; username?: string; wallet?: string; fomoId?: number;
}
export interface P2PStats {
  ads: { total: number; sell: number; buy: number; sellVolume: number; buyVolume: number };
  avgSellRate: number; avgBuyRate: number; spread: number; spreadPercent: number;
  exchanges: { active: number; inProgress: number; completed: number; blocked: number };
  volumeUsd: number; lockedOnContractUsd: number; lockedDeals: number; releasedUsd: number; traders: number;
  topSellAds: P2PAd[]; topBuyAds: P2PAd[]; adsByService: { serviceType: string; count: number }[];
}

export default async (): Promise<IReturnData> => {
  try {
    const token = getAccessToken();
    if (!token) throw new Error("Not auth");
    const res = await fetch(configureUrl("deals/admin/p2p-stats"), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    const data = await res.json();
    return { success: res.status < 300, data };
  } catch (error) {
    return { success: false, data: error };
  }
};
