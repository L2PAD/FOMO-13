import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

export interface CreateSpaceportPurchaseDto {
  txHash: string;
  quantity: number;
  totalPrice: number;
  totalPriceRaw: string;
  tokenDecimals?: number;
  walletAddress: string;
  paymentTokenAddress?: string;
  marketAddress?: string;
  nftAddress?: string;
  blockNumber?: number;
  purchasedAt?: string;
  referralAddress?: string;
  metadata?: Record<string, any>;
}

export interface SpaceportPurchase {
  _id: string;
  userId: string;
  txHash: string;
  quantity: number;
  totalPrice: number;
  totalPriceRaw: string;
  tokenDecimals: number;
  walletAddress: string;
  paymentTokenAddress?: string;
  marketAddress?: string;
  nftAddress?: string;
  blockNumber?: number;
  purchasedAt: string;
  referralAddress?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSpaceportPurchaseResponse {
  isSuccess: boolean;
  purchase: SpaceportPurchase | null;
  errorMessage?: string;
}

export default async function createSpaceportPurchase(
  data: CreateSpaceportPurchaseDto
): Promise<CreateSpaceportPurchaseResponse> {
  try {
    const accessToken = getAuthToken();

    if (!accessToken) {
      return {
        isSuccess: false,
        purchase: null,
        errorMessage: "No access token available",
      };
    }

    const res = await fetch(`${API}/spaceport-purchases`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      let errorMessage = `HTTP error! status: ${res.status}`;

      try {
        const errorData = await res.json();
        if (Array.isArray(errorData?.message)) {
          errorMessage = errorData.message.join(", ");
        } else if (typeof errorData?.message === "string") {
          errorMessage = errorData.message;
        }
      } catch {
        // no-op
      }

      return {
        isSuccess: false,
        purchase: null,
        errorMessage,
      };
    }

    const purchase = (await res.json()) as SpaceportPurchase;
    return {
      isSuccess: true,
      purchase,
    };
  } catch (error) {
    return {
      isSuccess: false,
      purchase: null,
      errorMessage:
        error instanceof Error ? error.message : "Failed to create purchase",
    };
  }
}
