import { API } from "../../config/api";

export interface SpaceportFusionRecord {
  _id: string;
  walletAddress: string;
  nftAddress: string;
  txHash: string;
  tokenId1?: number;
  tokenId2?: number;
  resultTokenId?: number;
  resultRarityId?: number;
  resultRarityName?: string;
  chainId?: number;
  blockNumber?: number;
  mergedAt: string | null;
  metadata?: Record<string, any>;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface FetchSpaceportFusionsResponse {
  isSuccess: boolean;
  walletAddress: string;
  fusions: SpaceportFusionRecord[];
}

export default async function fetchSpaceportFusions(
  walletAddress: string,
  nftAddress?: string
): Promise<FetchSpaceportFusionsResponse> {
  const normalizedWallet = String(walletAddress || "").trim();

  if (!normalizedWallet) {
    return {
      isSuccess: false,
      walletAddress: "",
      fusions: [],
    };
  }

  try {
    const params = new URLSearchParams();
    if (nftAddress) {
      params.set("nftAddress", nftAddress);
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(
      `${API}/spaceport-fusions/wallet/${encodeURIComponent(normalizedWallet)}${suffix}`,
      {
        method: "GET",
      }
    );

    if (!res.ok) {
      return {
        isSuccess: false,
        walletAddress: normalizedWallet,
        fusions: [],
      };
    }

    const data = (await res.json()) as FetchSpaceportFusionsResponse;
    return {
      isSuccess: Boolean(data?.isSuccess),
      walletAddress: String(data?.walletAddress || normalizedWallet),
      fusions: Array.isArray(data?.fusions) ? data.fusions : [],
    };
  } catch (error) {
    console.warn("[Spaceport][fetchSpaceportFusions] failed", error);
    return {
      isSuccess: false,
      walletAddress: normalizedWallet,
      fusions: [],
    };
  }
}
