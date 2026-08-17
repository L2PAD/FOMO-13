import { API } from "../../config/api";

export type SpaceportStakingAction = "stake" | "unstake";

export interface SpaceportStakingEvent {
  _id: string;
  walletAddress: string;
  nftAddress: string;
  tokenId: number;
  action: SpaceportStakingAction;
  txHash: string;
  chainId: number;
  blockNumber: number;
  transactionIndex: number;
  logIndex: number;
  stakedAt: string | null;
  unstakedAt: string | null;
  stakedSeconds: number;
  metadata?: Record<string, any>;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SpaceportStakingTokenSummary {
  tokenId: number;
  isCurrentlyStaked: boolean;
  lastAction: SpaceportStakingAction | null;
  lastTxHash: string | null;
  lastUpdatedAt: string | null;
  lastStakedAt: string | null;
  lastUnstakedAt: string | null;
  totalCompletedSeconds: number;
  currentCycleSeconds: number;
  totalSeconds: number;
  totalDays: number;
  historyCount: number;
}

export interface FetchSpaceportStakingResponse {
  isSuccess: boolean;
  walletAddress: string;
  events: SpaceportStakingEvent[];
  summary: Record<string, SpaceportStakingTokenSummary>;
}

export default async function fetchSpaceportStaking(
  walletAddress: string,
  tokenIds?: number[]
): Promise<FetchSpaceportStakingResponse> {
  const normalizedWallet = String(walletAddress || "").trim();

  if (!normalizedWallet) {
    return {
      isSuccess: false,
      walletAddress: "",
      events: [],
      summary: {},
    };
  }

  try {
    const params = new URLSearchParams();
    if (Array.isArray(tokenIds) && tokenIds.length > 0) {
      params.set("tokenIds", tokenIds.join(","));
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(
      `${API}/spaceport-staking/wallet/${encodeURIComponent(normalizedWallet)}${suffix}`,
      {
        method: "GET",
      }
    );

    if (!res.ok) {
      return {
        isSuccess: false,
        walletAddress: normalizedWallet,
        events: [],
        summary: {},
      };
    }

    const data = (await res.json()) as FetchSpaceportStakingResponse;
    return {
      isSuccess: Boolean(data?.isSuccess),
      walletAddress: String(data?.walletAddress || normalizedWallet),
      events: Array.isArray(data?.events) ? data.events : [],
      summary:
        data && typeof data.summary === "object" && data.summary
          ? data.summary
          : {},
    };
  } catch (error) {
    console.warn("[Spaceport][fetchSpaceportStaking] failed", error);
    return {
      isSuccess: false,
      walletAddress: normalizedWallet,
      events: [],
      summary: {},
    };
  }
}
