import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export type CheckoutCurrency = "ETH" | "USDC";

export interface CompleteCollectionNftCheckoutItemPayload {
  collectionNftId: string;
  orderId: number;
  nftId: number;
  tokenAddress: string;
  price: number;
  currency: CheckoutCurrency;
}

export interface CompleteCollectionNftCheckoutPayload {
  txHash: string;
  blockNumber?: number;
  items: CompleteCollectionNftCheckoutItemPayload[];
}

export default async (
  payload: CompleteCollectionNftCheckoutPayload
): Promise<{
  isSuccess: boolean;
  success: boolean;
  txHash: string;
  blockNumber: number;
  processedCount: number;
  finalizedListingsCount: number;
  finalizedListingIds: string[];
}> => {
  try {
    const accessToken = getAuthToken();

    const res = await fetch(`${API}/collectionNft/checkout`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    return {
      isSuccess: res.status < 300,
      success: !!data?.success,
      txHash: String(data?.txHash || payload.txHash || ""),
      blockNumber: Number(data?.blockNumber || payload.blockNumber || 0),
      processedCount: Number(data?.processedCount || 0),
      finalizedListingsCount: Number(data?.finalizedListingsCount || 0),
      finalizedListingIds: Array.isArray(data?.finalizedListingIds)
        ? data.finalizedListingIds.map((item: any) => String(item))
        : [],
    };
  } catch (error) {
    console.log(error);

    return {
      isSuccess: false,
      success: false,
      txHash: String(payload?.txHash || ""),
      blockNumber: Number(payload?.blockNumber || 0),
      processedCount: 0,
      finalizedListingsCount: 0,
      finalizedListingIds: [],
    };
  }
};
