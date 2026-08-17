import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from "../config";
import { IReturnData } from "../types";

export interface NftStats {
  collectionsOnSale: number;
  listedNfts: number;
  listedVolumeUsd: number;
  floorPrice: number;
  salesCount: number;
  salesVolumeUsd: number;
  sellers: number;
  topCollections: { _id: string; name: string; image?: string; listed: number; floor: number; volume: number }[];
  topSellers: { _id: string; username?: string; wallet?: string; fomoId?: number; rating?: string; rank?: string; orders: number; volume: number }[];
  recentListings: { _id: string; nftId: number; name: string; image?: string; price: number; currency: string; orderId?: number; endDate?: string; collectionName: string; owner?: { _id: string; username?: string; wallet?: string; fomoId?: number } | null }[];
}

export default async (): Promise<IReturnData> => {
  try {
    const token = getAccessToken();
    if (!token) throw new Error("Not auth");
    const res = await fetch(configureUrl("collectionNft/admin/stats"), {
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
