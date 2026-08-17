import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";
import { SpaceportNftMetadata } from "../../utils/spaceportMetadata";
import { SpaceportOpeningRecord } from "./fetchSpaceportOpenings";

export interface SaveSpaceportOpeningDto {
  walletAddress: string;
  nftAddress?: string;
  tokenId: number;
  txHash?: string;
  openedAt?: string;
  metadata?: SpaceportNftMetadata & {
    rarityId?: number;
    rarityName?: string;
    tokenUri?: string;
    resultTokenId?: number;
  };
}

export interface SaveSpaceportOpeningResponse {
  isSuccess: boolean;
  opening: SpaceportOpeningRecord | null;
  errorMessage?: string;
}

export default async function saveSpaceportOpening(
  data: SaveSpaceportOpeningDto
): Promise<SaveSpaceportOpeningResponse> {
  try {
    const accessToken = getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const res = await fetch(`${API}/spaceport-openings`, {
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
        opening: null,
        errorMessage,
      };
    }

    const response = (await res.json()) as {
      isSuccess?: boolean;
      opening?: SpaceportOpeningRecord | null;
    };

    return {
      isSuccess: Boolean(response?.isSuccess),
      opening: response?.opening || null,
    };
  } catch (error) {
    return {
      isSuccess: false,
      opening: null,
      errorMessage:
        error instanceof Error ? error.message : "Failed to save opening",
    };
  }
}
