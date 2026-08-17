export const FOMO_V2_LAUNCHPAD_POOL_STATUSES = [
  "draft",
  "tx_submitted",
  "active",
  "closed",
  "failed",
] as const;

export type FomoV2LaunchpadPoolStatus =
  (typeof FOMO_V2_LAUNCHPAD_POOL_STATUSES)[number];

export const FOMO_V2_LAUNCHPAD_PUBLICATION_STATUSES = [
  "draft",
  "published",
  "hidden",
] as const;

export type FomoV2LaunchpadPublicationStatus =
  (typeof FOMO_V2_LAUNCHPAD_PUBLICATION_STATUSES)[number];

export const FOMO_V2_LAUNCHPAD_OPERATION_TYPES = [
  "create_pool",
  "update_pool_fee_percent",
  "update_pool_min_investment",
  "deposit_project_tokens",
  "close_pool",
  "admin_unstake_all_pool_users",
  "add_admin",
  "remove_admin",
  "set_investment_receiver",
  "set_fee_receiver",
  "transfer_ownership",
] as const;

export type FomoV2LaunchpadOperationType =
  (typeof FOMO_V2_LAUNCHPAD_OPERATION_TYPES)[number];

export const FOMO_V2_LAUNCHPAD_OPERATION_STATUSES = [
  "pending",
  "confirmed",
  "failed",
] as const;

export type FomoV2LaunchpadOperationStatus =
  (typeof FOMO_V2_LAUNCHPAD_OPERATION_STATUSES)[number];

export const FOMO_V2_LAUNCHPAD_FAILURE_KINDS = [
  "reverted",
  "integrity",
  "cancelled",
] as const;

export type FomoV2LaunchpadFailureKind =
  (typeof FOMO_V2_LAUNCHPAD_FAILURE_KINDS)[number];

export interface FomoV2LaunchpadCreateParams {
  investToken: string;
  targetAmount: string;
  greenSeats: string;
  yellowSeats: string;
  stakeStart: string;
  greenStart: string;
  greenEnd: string;
  yellowSlotDuration: string;
  minInvestment: string;
  feePercent: string;
}

export interface FomoV2LaunchpadDeployment {
  chainId: number;
  chainName: string;
  launchpadAddress: string;
  investTokenAddress: string;
  investTokenDecimals: number;
  investTokenSymbol: string;
  stakingNftAddress: string;
  nftMarketAddress: string;
  explorerUrl: string;
  confirmations: number;
  abiVersion: string;
  rpcConfigured: boolean;
}

export const FOMO_V2_LAUNCHPAD_PLACEMENT_SURFACES = [
  "launchpad",
  "crypto_projects",
] as const;

export type FomoV2LaunchpadPlacementSurface =
  (typeof FOMO_V2_LAUNCHPAD_PLACEMENT_SURFACES)[number];

export interface FomoV2LaunchpadPlacementBanner {
  desktopUrl: string;
  mobileUrl?: string;
  linkUrl?: string;
  alt?: string;
}

export interface FomoV2LaunchpadFaqItem {
  question: string;
  answer: string;
}

export interface FomoV2LaunchpadDocumentLink {
  title: string;
  url: string;
  type?: string;
}

/**
 * Editorial data owned by a launch. Canonical project data remains linked and
 * is only used as a fallback by the public read model.
 */
export interface FomoV2LaunchpadDetails {
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
  zoneDescriptions?: {
    green?: string;
    yellow?: string;
    red?: string;
  };
  participationRules?: string[];
  faq?: FomoV2LaunchpadFaqItem[];
  links?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    whitepaper?: string;
  };
  documents?: FomoV2LaunchpadDocumentLink[];
  investors?: Array<{
    id?: string;
    name: string;
    logoUrl?: string;
    website?: string;
  }>;
  team?: Array<{
    id?: string;
    name: string;
    role?: string;
    avatarUrl?: string;
    website?: string;
  }>;
  analysisFlags?: {
    green?: string[];
    yellow?: string[];
    red?: string[];
  };
  funding?: {
    totalRaisedLabel?: string;
    fundingType?: string;
  };
  flags?: {
    showLeaderboard?: boolean;
    showParticipants?: boolean;
    showCountdown?: boolean;
  };
  tokenDisplay?: {
    name?: string;
    symbol?: string;
    decimals?: number;
    priceLabel?: string;
    allocationLabel?: string;
  };
}

export const FOMO_V2_LAUNCHPAD_USER_ACTIONS = [
  "invest",
  "stake",
  "unstake",
  "claim",
] as const;

export type FomoV2LaunchpadUserAction =
  (typeof FOMO_V2_LAUNCHPAD_USER_ACTIONS)[number];

export const FOMO_V2_LAUNCHPAD_LIFECYCLES = [
  "scheduled",
  "staking",
  "green",
  "yellow",
  "ended_awaiting_close",
  "closed_awaiting_settlement",
  "claim",
  "completed",
] as const;

export type FomoV2LaunchpadLifecycle =
  (typeof FOMO_V2_LAUNCHPAD_LIFECYCLES)[number];

export type FomoV2LaunchpadClaimKind =
  | "project_token"
  | "payment_token_refund";

export interface FomoV2LaunchpadPublicToken {
  address?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
}

export interface FomoV2LaunchpadPublicParticipation {
  wallet: string;
  investedAmount: string;
  grossAmount: string;
  netAmount: string;
  feeAmount: string;
  receiptTokenIds: string[];
  activeStakedTokenIds: string[];
  /**
   * Non-authoritative candidate IDs held by the same Launchpad contract for
   * this wallet across pools. Clients must recheck owner, usageCount and
   * isTokenStakedInPool before submitting a stake transaction.
   */
  reusableStakedTokenIds: string[];
  activeStakeCount: number;
  firstStakeTime: string;
  unstakeablePools: Array<{
    poolId: string;
    activeCount: string;
  }>;
  claimed: boolean;
  claimAmount: string;
  claimKind: FomoV2LaunchpadClaimKind | null;
  zone: number;
  yellowSlotStart: string;
  yellowSlotEnd: string;
  rank: string;
  canInvestNow: boolean;
  maxAllowedNow: string;
  canClaim: boolean;
  canRefund: boolean;
  canUnstake: boolean;
  claimAsset: FomoV2LaunchpadPublicToken | null;
}
