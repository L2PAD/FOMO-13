import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";
import { SpaceportStakingAction, SpaceportStakingEvent } from "./fetchSpaceportStaking";

export interface SaveSpaceportStakingDto {
  txHash: string;
  walletAddress?: string;
  nftAddress?: string;
  tokenId?: number;
  action?: SpaceportStakingAction;
  stakedAt?: string;
  unstakedAt?: string;
  stakedSeconds?: number;
  chainId?: number;
  blockNumber?: number;
  metadata?: Record<string, any>;
}

export interface SaveSpaceportStakingResponse {
  isSuccess: boolean;
  source?: "chain" | "payload";
  events: SpaceportStakingEvent[];
  errorMessage?: string;
}

export default async function saveSpaceportStaking(
  data: SaveSpaceportStakingDto
): Promise<SaveSpaceportStakingResponse> {
  try {
    const accessToken = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const res = await fetch(`${API}/spaceport-staking`, {
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
        events: [],
        errorMessage,
      };
    }

    const response = (await res.json()) as {
      isSuccess?: boolean;
      source?: "chain" | "payload";
      events?: SpaceportStakingEvent[];
    };

    return {
      isSuccess: Boolean(response?.isSuccess),
      source: response?.source,
      events: Array.isArray(response?.events) ? response.events : [],
    };
  } catch (error) {
    return {
      isSuccess: false,
      events: [],
      errorMessage:
        error instanceof Error ? error.message : "Failed to save staking event",
    };
  }
}
