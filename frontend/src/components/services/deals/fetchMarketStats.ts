import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from "../config";
import { IReturnData } from "../types";

export interface MarketTrader {
  _id: string;
  username?: string;
  wallet?: string;
  fomoId?: number;
  rating?: string;
  rank?: string;
  activityXP?: number;
  verificationStatus?: boolean;
  dealsCount: number;
  endedCount: number;
  volume: number;
}

export interface MarketStats {
  deals: { total: number; active: number; started: number; waiting: number; ended: number; blocked: number };
  volumeUsd: number;
  volumeBySection: { section: string; count: number; volume: number }[];
  commissionEarnedUsd: number;
  feeRatePercent: number;
  reservedOnContractUsd: number;
  reservedDeals: number;
  traders: number;
  activeTraders: number;
  popularPositions: { serviceType: string; count: number; volume: number }[];
  topTraders: MarketTrader[];
  rankDistribution: { rank: string; count: number }[];
}

export default async (): Promise<IReturnData> => {
  try {
    const token = getAccessToken();
    if (!token) throw new Error("Not auth");
    const res = await fetch(configureUrl("deals/admin/market-stats"), {
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
