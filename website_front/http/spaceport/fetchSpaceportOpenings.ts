import { API } from "../../config/api";

export interface SpaceportOpeningRecord {
  _id: string;
  walletAddress: string;
  nftAddress: string;
  tokenId: number;
  txHash: string;
  openedAt: string | null;
  metadata?: Record<string, any>;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface FetchSpaceportOpeningsResponse {
  isSuccess: boolean;
  walletAddress: string;
  openedTokenIds: number[];
  openings: SpaceportOpeningRecord[];
}

export default async function fetchSpaceportOpenings(
  walletAddress: string,
  nftAddress?: string
): Promise<FetchSpaceportOpeningsResponse> {
  const normalizedWallet = String(walletAddress || "").trim();

  if (!normalizedWallet) {
    return {
      isSuccess: false,
      walletAddress: "",
      openedTokenIds: [],
      openings: [],
    };
  }

  try {
    const params = new URLSearchParams();
    if (nftAddress) {
      params.set("nftAddress", nftAddress);
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(
      `${API}/spaceport-openings/wallet/${encodeURIComponent(normalizedWallet)}${suffix}`,
      {
        method: "GET",
      }
    );

    if (!res.ok) {
      return {
        isSuccess: false,
        walletAddress: normalizedWallet,
        openedTokenIds: [],
        openings: [],
      };
    }

    const data = (await res.json()) as FetchSpaceportOpeningsResponse;
    return {
      isSuccess: Boolean(data?.isSuccess),
      walletAddress: String(data?.walletAddress || normalizedWallet),
      openedTokenIds: Array.isArray(data?.openedTokenIds)
        ? data.openedTokenIds.map((tokenId) => Number(tokenId)).filter(Number.isFinite)
        : [],
      openings: Array.isArray(data?.openings) ? data.openings : [],
    };
  } catch (error) {
    console.warn("[Spaceport][fetchSpaceportOpenings] failed", error);
    return {
      isSuccess: false,
      walletAddress: normalizedWallet,
      openedTokenIds: [],
      openings: [],
    };
  }
}
