export type LaunchpadPlacementSurface = "launchpad" | "crypto_projects";

export interface LaunchpadPlacementBanner {
  desktopUrl?: string;
  mobileUrl?: string;
  linkUrl?: string;
  alt?: string;
}

export interface LaunchpadPlacementCreateParams {
  investToken?: string;
  targetAmount?: string;
  greenSeats?: string;
  yellowSeats?: string;
  stakeStart?: string;
  greenStart?: string;
  greenEnd?: string;
  yellowSlotDuration?: string;
  minInvestment?: string;
  feePercent?: string;
}

export interface LaunchpadPlacementPool {
  id: string;
  canonicalProjectId?: string;
  status?: string;
  publicationStatus?: string;
  chainId?: number;
  launchpadAddress?: string;
  poolId?: string;
  createParams?: LaunchpadPlacementCreateParams;
  metadata?: Record<string, unknown>;
  onchainState?: Record<string, unknown>;
  publishedAt?: string;
}

export interface LaunchpadPlacementCanonicalProject {
  id: string;
  name: string;
  slug?: string;
  symbol?: string;
  status?: string;
  logo?: string;
  website?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  createdForLaunchpad?: boolean;
}

export interface LaunchpadPlacement {
  id: string;
  launchpadPoolId: string;
  surface: LaunchpadPlacementSurface;
  enabled: boolean;
  featured: boolean;
  ad: boolean;
  sortOrder: number;
  banner: LaunchpadPlacementBanner;
  pool: LaunchpadPlacementPool;
  canonicalProject: LaunchpadPlacementCanonicalProject;
}

export interface LaunchpadPlacementsResponse {
  items: LaunchpadPlacement[];
  total: number;
  limit: number;
  offset: number;
}

export interface LaunchpadPlacementDisplayProject {
  placementId: string;
  launchpadPoolId: string;
  href: string;
  name: string;
  symbol?: string;
  logo?: string;
  description: string;
  categories: string[];
  category: string;
  dealType: string;
  status: string;
  target: string;
  allocation: string;
  participants?: string;
  timeLeft: string;
  progress: number;
  created: string;
  promotedUntil: string;
  featured: boolean;
  ad: boolean;
  banner: LaunchpadPlacementBanner;
  poolId?: string;
}
