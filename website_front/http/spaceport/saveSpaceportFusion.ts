import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";
import { SpaceportFusionRecord } from "./fetchSpaceportFusions";

export interface SaveSpaceportFusionDto {
  txHash: string;
  walletAddress: string;
  nftAddress?: string;
  tokenId1?: number;
  tokenId2?: number;
  resultTokenId?: number;
  resultRarityId?: number;
  resultRarityName?: string;
  chainId?: number;
  blockNumber?: number;
  mergedAt?: string;
  metadata?: Record<string, any>;
}

export interface SaveSpaceportFusionResponse {
  isSuccess: boolean;
  source?: "chain" | "payload";
  fusion: SpaceportFusionRecord | null;
  errorMessage?: string;
}

export default async function saveSpaceportFusion(
  data: SaveSpaceportFusionDto
): Promise<SaveSpaceportFusionResponse> {
  try {
    const accessToken = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const res = await fetch(`${API}/spaceport-fusions`, {
      method: "POST",
      headers,
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
        fusion: null,
        errorMessage,
      };
    }

    const response = (await res.json()) as {
      isSuccess?: boolean;
      source?: "chain" | "payload";
      fusion?: SpaceportFusionRecord | null;
    };

    return {
      isSuccess: Boolean(response?.isSuccess),
      source: response?.source,
      fusion: response?.fusion || null,
    };
  } catch (error) {
    return {
      isSuccess: false,
      fusion: null,
      errorMessage:
        error instanceof Error ? error.message : "Failed to save fusion",
    };
  }
}
