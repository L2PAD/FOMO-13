export type LaunchpadRawAmount = string;
export type LaunchpadAddress = `0x${string}`;
export type LaunchpadTxHash = `0x${string}`;

export type LaunchpadLifecycle =
  | "scheduled"
  | "staking"
  | "green"
  | "yellow"
  | "ended_awaiting_close"
  | "closed_awaiting_settlement"
  | "claim"
  | "completed"
  | (string & {});

export type LaunchpadZone = "green" | "yellow" | "red" | "none";
export type LaunchpadClaimKind =
  | "project_token"
  | "payment_token_refund"
  | null;

export interface FomoV2LaunchpadSocials {
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  whitepaper?: string;
}

export interface FomoV2LaunchpadProject {
  id: string;
  name: string;
  symbol?: string;
  slug?: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  socials?: FomoV2LaunchpadSocials;
  categories?: string[];
  investors?: Array<{ id?: string; name: string; logoUrl?: string }>;
  team?: Array<{ id?: string; name: string; role?: string; avatarUrl?: string }>;
  analysisFlags?: { green?: string[]; yellow?: string[]; red?: string[] };
  funding?: {
    totalRaisedLabel?: string;
    fundingType?: string;
    totalRaisedUsd?: number;
    fundingTypes?: string[];
  };
}

export interface FomoV2LaunchpadFaqItem {
  question: string;
  answer: string;
}

export interface FomoV2LaunchpadLaunch {
  title?: string;
  shortDescription?: string;
  description?: string;
  saleType?: string;
  category?: string;
  logoUrl?: string;
  bannerUrl?: string;
  gallery?: string[];
  about?: string;
  problem?: string;
  solution?: string;
  tokenUtility?: string;
  revenueModel?: string;
  zoneDescriptions?: Partial<Record<Exclude<LaunchpadZone, "none">, string>>;
  participationRules?: string[];
  faq?: FomoV2LaunchpadFaqItem[];
  links?: FomoV2LaunchpadSocials;
  investors?: Array<{ id?: string; name: string; logoUrl?: string; website?: string }>;
  team?: Array<{ id?: string; name: string; role?: string; avatarUrl?: string }>;
  analysisFlags?: { green?: string[]; yellow?: string[]; red?: string[] };
  tokenDisplay?: {
    name?: string;
    symbol?: string;
    decimals?: number;
    priceLabel?: string;
    allocationLabel?: string;
    tokenSymbol?: string;
    paymentSymbol?: string;
  };
  funding?: { totalRaisedLabel?: string; fundingType?: string };
  flags?: {
    showLeaderboard?: boolean;
    showParticipants?: boolean;
    showCountdown?: boolean;
  };
}

export interface FomoV2LaunchpadCreateParams {
  investToken?: LaunchpadAddress | string;
  targetAmount?: LaunchpadRawAmount;
  greenSeats?: LaunchpadRawAmount;
  yellowSeats?: LaunchpadRawAmount;
  stakeStartTime?: LaunchpadRawAmount;
  stakeStart?: LaunchpadRawAmount;
  greenStartTime?: LaunchpadRawAmount;
  greenStart?: LaunchpadRawAmount;
  greenEndTime?: LaunchpadRawAmount;
  greenEnd?: LaunchpadRawAmount;
  slotDuration?: LaunchpadRawAmount;
  yellowSlotDuration?: LaunchpadRawAmount;
  minInvestmentAmount?: LaunchpadRawAmount;
  minInvestment?: LaunchpadRawAmount;
  feePercentage?: LaunchpadRawAmount;
  feePercent?: LaunchpadRawAmount;
}

export interface FomoV2LaunchpadOnchainPool {
  id?: LaunchpadRawAmount;
  investToken?: LaunchpadAddress | string;
  targetAmount?: LaunchpadRawAmount;
  raisedAmount?: LaunchpadRawAmount;
  greenSeats?: LaunchpadRawAmount;
  yellowSeats?: LaunchpadRawAmount;
  stakeStart?: LaunchpadRawAmount;
  greenStart?: LaunchpadRawAmount;
  greenEnd?: LaunchpadRawAmount;
  yellowSlotDuration?: LaunchpadRawAmount;
  minInvestment?: LaunchpadRawAmount;
  feePercent?: LaunchpadRawAmount;
  projectToken?: LaunchpadAddress | string;
  projectTokenAmount?: LaunchpadRawAmount;
  claimEnabled?: boolean;
  stakeReleaseEnabled?: boolean;
  closed?: boolean;
  exists?: boolean;
  participants?: number;
  participantCount?: number;
}

export interface FomoV2LaunchpadPool {
  poolId: LaunchpadRawAmount;
  createParams?: FomoV2LaunchpadCreateParams;
  onchainState?: FomoV2LaunchpadOnchainPool;
  targetAmount?: LaunchpadRawAmount;
  raisedAmount?: LaunchpadRawAmount;
  investToken?: FomoV2LaunchpadToken | LaunchpadAddress | string;
}

export interface FomoV2LaunchpadToken {
  address: LaunchpadAddress | string;
  name?: string;
  symbol?: string;
  decimals?: number;
}

export interface FomoV2LaunchpadContract {
  chainId: number;
  address: LaunchpadAddress | string;
  investToken: FomoV2LaunchpadToken;
  projectToken?: FomoV2LaunchpadToken | null;
  stakingNftAddress?: LaunchpadAddress | string;
  nftMarketAddress?: LaunchpadAddress | string;
  claimKind?: LaunchpadClaimKind;
  explorerUrl?: string;
  sync?: {
    asOfBlock?: LaunchpadRawAmount;
    blockNumber?: LaunchpadRawAmount;
    syncedAt?: string;
    stale?: boolean;
  };
}

export interface FomoV2LaunchpadParticipation {
  wallet: LaunchpadAddress | string;
  zone?: LaunchpadZone | number;
  rank?: LaunchpadRawAmount | number;
  investedAmount?: LaunchpadRawAmount;
  grossAmount?: LaunchpadRawAmount;
  netAmount?: LaunchpadRawAmount;
  feeAmount?: LaunchpadRawAmount;
  receiptTokenIds: LaunchpadRawAmount[];
  activeStakedTokenIds: LaunchpadRawAmount[];
  reusableStakedTokenIds?: LaunchpadRawAmount[];
  availableNftTokenIds?: LaunchpadRawAmount[];
  ownedNftTokenIds?: LaunchpadRawAmount[];
  activeStakeCount: number;
  claimed: boolean;
  claimAmount?: LaunchpadRawAmount;
  claimKind?: LaunchpadClaimKind;
  claimAsset?: FomoV2LaunchpadToken | null;
  canStake?: boolean;
  canUnstake?: boolean;
  canInvestNow?: boolean;
  maxAllowedNow?: LaunchpadRawAmount;
  canClaim?: boolean;
  canRefund?: boolean;
  yellowSlotStart?: LaunchpadRawAmount;
  yellowSlotEnd?: LaunchpadRawAmount;
}

export interface FomoV2LaunchpadLeaderboardEntry {
  wallet: LaunchpadAddress | string;
  investedAmount?: LaunchpadRawAmount;
  claimed?: boolean;
  claimAmount?: LaunchpadRawAmount;
  activeStakeCount: number;
  activeStakedTokenIds?: LaunchpadRawAmount[];
  rank: number | LaunchpadRawAmount;
  zone?: LaunchpadZone | number;
  avatarUrl?: string;
  displayName?: string;
}

export interface FomoV2LaunchpadSummary {
  id: string;
  slug: string;
  status: string;
  publicationStatus: string;
  lifecycle: LaunchpadLifecycle;
  project: FomoV2LaunchpadProject;
  launch: FomoV2LaunchpadLaunch;
  pool: FomoV2LaunchpadPool;
  contract: FomoV2LaunchpadContract;
  participation?: FomoV2LaunchpadParticipation | null;
  featured?: boolean;
  ad?: boolean;
  sortOrder?: number;
  placement?: {
    surface?: "launchpad" | "crypto_projects";
    featured?: boolean;
    ad?: boolean;
    sortOrder?: number;
    banner?: {
      desktopUrl?: string;
      mobileUrl?: string;
      linkUrl?: string;
      alt?: string;
    };
  };
}

export interface FomoV2LaunchpadDetail extends FomoV2LaunchpadSummary {
  leaderboard: FomoV2LaunchpadLeaderboardEntry[];
  similarProjects?: FomoV2LaunchpadSummary[];
  /** Temporary compatibility with the backend DTO name used during rollout. */
  similar?: FomoV2LaunchpadSummary[];
}

export interface FomoV2LaunchpadListResponse {
  items: FomoV2LaunchpadSummary[];
  total: number;
  limit?: number;
  offset?: number;
}

export type FomoV2LaunchpadTransactionAction =
  | "invest"
  | "claim"
  | "stake"
  | "unstake";

export interface FomoV2LaunchpadVerifyInput {
  txHash: LaunchpadTxHash | string;
  action: FomoV2LaunchpadTransactionAction;
  wallet: LaunchpadAddress | string;
}

export interface FomoV2LaunchpadVerification {
  status: "pending" | "confirmed" | "failed" | (string & {});
  confirmations?: number;
  requiredConfirmations?: number;
  action?: FomoV2LaunchpadTransactionAction;
  transactionHash?: string;
  eventIds?: string[];
  reason?: string;
}

export interface FomoV2LaunchpadVerifyResponse {
  verification: FomoV2LaunchpadVerification;
  launch?: FomoV2LaunchpadDetail;
}
