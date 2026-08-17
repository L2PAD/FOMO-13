import getAccessToken from '../utils/getAccessToken';
import { configureUrl } from './config';

export type LaunchpadPoolStatus =
  | 'draft'
  | 'tx_submitted'
  | 'active'
  | 'failed'
  | 'closed'
  | string;

export type LaunchpadPublicationStatus = 'draft' | 'published' | 'hidden' | string;

export type LaunchpadPlacementSurface = 'launchpad' | 'crypto_projects';

export interface LaunchpadPlacementBanner {
  desktopUrl?: string;
  mobileUrl?: string;
  linkUrl?: string;
  alt?: string;
}

export interface LaunchpadPlacement {
  id: string;
  _id?: string;
  launchpadPoolId: string;
  surface: LaunchpadPlacementSurface;
  enabled: boolean;
  featured: boolean;
  ad: boolean;
  sortOrder: number;
  banner: LaunchpadPlacementBanner;
  pool?: LaunchpadPool;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpsertLaunchpadPlacementInput {
  launchpadPoolId: string;
  surface: LaunchpadPlacementSurface;
  enabled?: boolean;
  featured?: boolean;
  ad?: boolean;
  sortOrder?: number;
  banner?: LaunchpadPlacementBanner;
}

export interface PatchLaunchpadPlacementInput {
  enabled?: boolean;
  featured?: boolean;
  ad?: boolean;
  sortOrder?: number;
  banner?: LaunchpadPlacementBanner;
}

export interface LaunchpadTokenConfig {
  address: string;
  symbol: string;
  decimals: number;
}

export interface LaunchpadAdminConfig {
  chainId: number;
  chainName?: string;
  explorerUrl?: string;
  launchpadAddress: string;
  investTokenAddress: string;
  investTokenDecimals: number;
  investTokenSymbol?: string;
  stakingNftAddress?: string;
  nftMarketAddress?: string;
  abiVersion?: string;
  confirmations?: number;
  rpcConfigured?: boolean;
}

export interface LaunchpadCanonicalProject {
  id: string;
  _id?: string;
  canonicalName?: string;
  name: string;
  symbol?: string;
  slug?: string;
  logo?: string;
  website?: string;
  descriptionText?: string;
  createdForLaunchpad?: boolean;
  investors?: LaunchpadInvestor[];
  team?: LaunchpadTeamMember[];
  analysisFlags?: LaunchpadAnalysisFlags;
}

export interface LaunchpadInvestor {
  id?: string;
  name: string;
  logoUrl?: string;
  website?: string;
}

export interface LaunchpadTeamMember {
  id?: string;
  name: string;
  role?: string;
  avatarUrl?: string;
  website?: string;
}

export interface LaunchpadAnalysisFlags {
  green?: string[];
  yellow?: string[];
  red?: string[];
}

export interface LaunchpadFaqItem {
  question: string;
  answer: string;
}

export interface LaunchpadZoneDescriptions {
  green?: string;
  yellow?: string;
  red?: string;
}

export interface LaunchpadLinks {
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  whitepaper?: string;
}

export interface LaunchpadDocumentLink {
  title: string;
  url: string;
  type?: string;
}

export interface LaunchpadFundingDisplay {
  totalRaisedLabel?: string;
  fundingType?: string;
}

export interface LaunchpadDisplayFlags {
  showLeaderboard?: boolean;
  showParticipants?: boolean;
  showCountdown?: boolean;
}

export interface LaunchpadTokenDisplay {
  name?: string;
  symbol?: string;
  decimals?: number;
  priceLabel?: string;
  allocationLabel?: string;
}

/**
 * Content owned by one launch. Canonical project data is intentionally not
 * copied here; empty overrides are resolved by the backend public read model.
 */
export interface LaunchpadLaunchDetails {
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
  zoneDescriptions?: LaunchpadZoneDescriptions;
  participationRules?: string[];
  faq?: LaunchpadFaqItem[];
  links?: LaunchpadLinks;
  documents?: LaunchpadDocumentLink[];
  investors?: LaunchpadInvestor[];
  team?: LaunchpadTeamMember[];
  analysisFlags?: LaunchpadAnalysisFlags;
  funding?: LaunchpadFundingDisplay;
  flags?: LaunchpadDisplayFlags;
  tokenDisplay?: LaunchpadTokenDisplay;
}

export interface LaunchpadReadinessIssue {
  code?: string;
  field?: string;
  message: string;
}

export interface LaunchpadReadiness {
  ready: boolean;
  issues: Array<string | LaunchpadReadinessIssue>;
  checks?: {
    content?: boolean;
    contract?: boolean;
    pool?: boolean;
    token?: boolean;
  };
}

export interface LaunchpadMediaAsset {
  url: string;
  key: string;
  mimeType: string;
  size: number;
  driver?: string;
  managed?: boolean;
}

export interface LaunchpadPoolParams {
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

export interface LaunchpadOnchainState {
  raisedAmount?: string;
  projectToken?: string;
  projectTokenAmount?: string;
  claimEnabled?: boolean;
  stakeReleaseEnabled?: boolean;
  closed?: boolean;
  exists?: boolean;
  syncedAt?: string;
  [key: string]: unknown;
}

export interface LaunchpadPool {
  id: string;
  _id?: string;
  canonicalProjectId: string;
  canonicalProject?: LaunchpadCanonicalProject;
  slug?: string;
  launchDetails?: LaunchpadLaunchDetails;
  readiness?: LaunchpadReadiness;
  chainId: number;
  launchpadAddress: string;
  poolId?: string;
  predictedPoolId?: string;
  status: LaunchpadPoolStatus;
  publicationStatus?: LaunchpadPublicationStatus;
  createParams?: LaunchpadPoolParams;
  createTxHash?: string;
  createTransaction?: {
    transactionHash?: string;
    blockNumber?: number;
    blockHash?: string;
    confirmations?: number;
    verificationError?: string;
    failureKind?: string;
    safeToRetry?: boolean;
  };
  createBlockNumber?: number;
  metadata?: Record<string, unknown>;
  onchainState?: LaunchpadOnchainState;
  revision?: number;
  lastError?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewLaunchpadCanonicalProject {
  name: string;
  symbol?: string;
  slug?: string;
  logo?: string;
  website?: string;
  description?: string;
}

export interface CreateLaunchpadDraftInput extends LaunchpadPoolParams {
  canonicalProjectId?: string;
  newCanonicalProject?: NewLaunchpadCanonicalProject;
  chainId: number;
  launchpadAddress: string;
  slug?: string;
  launchDetails?: LaunchpadLaunchDetails;
  metadata?: Record<string, unknown>;
  idempotencyKey?: string;
}

export interface PatchLaunchpadDraftInput extends Partial<LaunchpadPoolParams> {
  expectedRevision?: number;
  metadata?: Record<string, unknown>;
}

export type LaunchpadPoolOperationType =
  | 'update_pool_fee_percent'
  | 'update_pool_min_investment'
  | 'deposit_project_tokens'
  | 'close_pool'
  | 'admin_unstake_all_pool_users';

export type LaunchpadGlobalOperationType =
  | 'add_admin'
  | 'remove_admin'
  | 'set_investment_receiver'
  | 'set_fee_receiver'
  | 'transfer_ownership';

interface ListResponse<T> {
  items: T[];
  total: number;
  limit?: number;
  offset?: number;
}

export interface LaunchpadVerification {
  status: 'pending' | 'confirmed' | 'failed' | string;
  confirmations?: number;
  requiredConfirmations?: number;
  poolId?: string;
  reason?: string;
  /**
   * The backend must set both fields before the UI may discard recovery and
   * allow another create transaction. A generic integrity/config mismatch is
   * never safe to retry because the original transaction may have succeeded.
   */
  failureKind?: string;
  safeToRetry?: boolean;
}

export interface PatchLaunchpadDetailsInput {
  expectedRevision?: number;
  slug?: string;
  launchDetails: LaunchpadLaunchDetails;
}

export interface LaunchpadOperationRecord {
  id?: string;
  _id?: string;
  type?: string;
  transactionHash?: string;
  status?: string;
}

export interface LaunchpadPoolVerificationResult {
  pool: LaunchpadPool;
  verification: LaunchpadVerification;
}

export interface LaunchpadCreateResetResult {
  reset: boolean;
  pool?: LaunchpadPool;
}

export interface LaunchpadOperationVerificationResult {
  pool?: LaunchpadPool;
  operation?: LaunchpadOperationRecord;
  verification: LaunchpadVerification;
}

const authHeaders = () => ({
  Authorization: `Bearer ${getAccessToken()}`,
});

const toQuery = (params: Record<string, unknown> = {}): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

const errorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const body = await response.json();
    if (Array.isArray(body?.message)) return body.message.join(', ');
    return body?.message || body?.error || fallback;
  } catch {
    return fallback;
  }
};

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const isMultipart = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const response = await fetch(configureUrl(`admin/fomo-v2/launchpad${path}`), {
    ...init,
    headers: {
      ...authHeaders(),
      ...(!isMultipart ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(await errorMessage(response, `Launchpad request failed (${response.status})`));
  }

  if (response.status === 204) return undefined as T;
  return response.json();
};

const unwrapData = <T>(value: any): T => {
  if (value?.data !== undefined) return value.data as T;
  return value as T;
};

const normalizeProject = (project: any): LaunchpadCanonicalProject => ({
  ...project,
  id: String(project?.id || project?._id || project?.canonicalProjectId || ''),
  name: String(project?.name || project?.canonicalName || 'Untitled project'),
  descriptionText: project?.descriptionText || project?.description || project?.metadata?.description,
});

const normalizePool = (pool: any): LaunchpadPool => ({
  ...pool,
  id: String(pool?.id || pool?._id || ''),
  canonicalProjectId: String(pool?.canonicalProjectId || pool?.canonicalProject?.id || ''),
  chainId: Number(pool?.chainId || 0),
  launchpadAddress: String(pool?.launchpadAddress || ''),
  status: String(pool?.status || 'draft'),
  canonicalProject: pool?.canonicalProject
    ? normalizeProject(pool.canonicalProject)
    : undefined,
});

const normalizePlacement = (placement: any): LaunchpadPlacement => ({
  ...placement,
  id: String(placement?.id || placement?._id || ''),
  launchpadPoolId: String(placement?.launchpadPoolId || placement?.pool?.id || placement?.pool?._id || ''),
  surface: placement?.surface as LaunchpadPlacementSurface,
  enabled: placement?.enabled === true,
  featured: placement?.featured === true,
  ad: placement?.ad === true,
  sortOrder: Number(placement?.sortOrder ?? 0),
  banner: {
    desktopUrl: String(placement?.banner?.desktopUrl || ''),
    mobileUrl: String(placement?.banner?.mobileUrl || ''),
    linkUrl: String(placement?.banner?.linkUrl || ''),
    alt: String(placement?.banner?.alt || ''),
  },
  pool: placement?.pool ? normalizePool(placement.pool) : undefined,
});

const extractPlacement = (value: any): LaunchpadPlacement => {
  const data = unwrapData<any>(value);
  return normalizePlacement(data?.placement || data);
};

const extractPool = (value: any): LaunchpadPool => {
  const data = unwrapData<any>(value);
  const pool = normalizePool(data?.pool || data);
  return data?.readiness ? { ...pool, readiness: data.readiness } : pool;
};

export const fetchLaunchpadConfig = async (): Promise<LaunchpadAdminConfig> => (
  unwrapData<LaunchpadAdminConfig>(await request('/config'))
);

export const fetchLaunchpadProjects = async (
  search = '',
  limit = 30,
): Promise<ListResponse<LaunchpadCanonicalProject>> => {
  const raw = unwrapData<any>(await request(`/projects${toQuery({ search, limit })}`));
  const items = raw?.items || raw?.projects || [];
  return {
    items: items.map(normalizeProject),
    total: Number(raw?.total ?? items.length),
    limit: Number(raw?.limit ?? limit),
    offset: Number(raw?.offset ?? 0),
  };
};

export const fetchLaunchpadPools = async (
  params: Record<string, unknown> = {},
): Promise<ListResponse<LaunchpadPool>> => {
  const raw = unwrapData<any>(await request(`/pools${toQuery(params)}`));
  const items = raw?.items || raw?.pools || [];
  return {
    items: items.map(normalizePool),
    total: Number(raw?.total ?? items.length),
    limit: Number(raw?.limit ?? params.limit ?? items.length),
    offset: Number(raw?.offset ?? params.offset ?? 0),
  };
};

export const fetchLaunchpadPool = async (id: string): Promise<LaunchpadPool> => (
  extractPool(await request(`/pools/${encodeURIComponent(id)}`))
);

export const fetchLaunchpadReadiness = async (id: string): Promise<LaunchpadReadiness> => {
  const raw = unwrapData<any>(await request(`/pools/${encodeURIComponent(id)}/readiness`));
  return (raw?.readiness || raw) as LaunchpadReadiness;
};

export const createLaunchpadDraft = async (
  input: CreateLaunchpadDraftInput,
): Promise<LaunchpadPool> => (
  extractPool(await request('/pools/drafts', {
    method: 'POST',
    body: JSON.stringify(input),
  }))
);

export const updateLaunchpadPool = async (
  id: string,
  input: PatchLaunchpadDraftInput,
): Promise<LaunchpadPool> => (
  extractPool(await request(`/pools/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  }))
);

export const updateLaunchpadDetails = async (
  id: string,
  input: PatchLaunchpadDetailsInput,
): Promise<LaunchpadPool> => (
  extractPool(await request(`/pools/${encodeURIComponent(id)}/details`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  }))
);

export const uploadLaunchpadMedia = async (file: File): Promise<LaunchpadMediaAsset> => {
  const formData = new FormData();
  formData.append('file', file);
  const raw = unwrapData<any>(await request('/media', {
    method: 'POST',
    body: formData,
  }));
  return (raw?.asset || raw) as LaunchpadMediaAsset;
};

export const deleteLaunchpadMedia = async (
  key: string,
  options: { keepalive?: boolean } = {},
): Promise<void> => {
  await request<void>('/media', {
    method: 'DELETE',
    body: JSON.stringify({ key }),
    keepalive: options.keepalive,
  });
};

export const confirmLaunchpadPoolCreate = async (
  id: string,
  input: { txHash: string; predictedPoolId?: string; replacesTxHash?: string },
): Promise<LaunchpadPoolVerificationResult> => {
  const raw = unwrapData<any>(await request(`/pools/${encodeURIComponent(id)}/confirm-create`, {
    method: 'POST',
    body: JSON.stringify(input),
  }));
  return {
    pool: normalizePool(raw?.pool || raw),
    verification: raw?.verification || { status: 'pending' },
  };
};

export const reconcileLaunchpadPoolCreate = async (id: string): Promise<LaunchpadPoolVerificationResult> => {
  const raw = unwrapData<any>(await request(`/pools/${encodeURIComponent(id)}/reconcile-create`, {
    method: 'POST',
  }));
  return {
    pool: normalizePool(raw?.pool || raw),
    verification: raw?.verification || { status: 'pending' },
  };
};

export const confirmLaunchpadPoolCreateCancellation = async (
  id: string,
  input: { replacementTxHash: string },
): Promise<LaunchpadPoolVerificationResult> => {
  const raw = unwrapData<any>(await request(`/pools/${encodeURIComponent(id)}/confirm-create-cancellation`, {
    method: 'POST',
    body: JSON.stringify(input),
  }));
  return {
    pool: normalizePool(raw?.pool || raw),
    verification: raw?.verification || { status: 'pending', safeToRetry: false },
  };
};

export const resetLaunchpadRevertedCreate = async (
  id: string,
): Promise<LaunchpadCreateResetResult> => {
  const raw = unwrapData<any>(await request(`/pools/${encodeURIComponent(id)}/reset-reverted-create`, {
    method: 'POST',
  }));
  return {
    reset: raw?.reset === true || raw?.deleted === true,
    ...(raw?.pool ? { pool: normalizePool(raw.pool) } : {}),
  };
};

export const syncLaunchpadPoolContract = async (id: string): Promise<LaunchpadPool> => (
  extractPool(await request(`/pools/${encodeURIComponent(id)}/sync-contract`, {
    method: 'POST',
  }))
);

export const recordLaunchpadOperation = async (
  id: string,
  input: { type: LaunchpadPoolOperationType; txHash: string; params?: Record<string, unknown> },
): Promise<LaunchpadOperationVerificationResult> => {
  const raw = unwrapData<any>(await request(`/pools/${encodeURIComponent(id)}/operations`, {
    method: 'POST',
    body: JSON.stringify(input),
  }));
  return {
    pool: raw?.pool ? normalizePool(raw.pool) : undefined,
    operation: raw?.operation,
    verification: raw?.verification || { status: 'pending' },
  };
};

export const recordLaunchpadGlobalOperation = async (
  input: { type: LaunchpadGlobalOperationType; txHash: string; params?: Record<string, unknown> },
): Promise<LaunchpadOperationVerificationResult> => {
  const raw = unwrapData<any>(await request('/operations', {
    method: 'POST',
    body: JSON.stringify(input),
  }));
  return {
    operation: raw?.operation,
    verification: raw?.verification || { status: 'pending' },
  };
};

export const updateLaunchpadPublication = async (
  id: string,
  publicationStatus: LaunchpadPublicationStatus,
): Promise<LaunchpadPool> => (
  extractPool(await request(`/pools/${encodeURIComponent(id)}/publication`, {
    method: 'PATCH',
    body: JSON.stringify({ publicationStatus }),
  }))
);

export const fetchLaunchpadPlacements = async (
  params: {
    surface?: LaunchpadPlacementSurface;
    poolId?: string;
    enabled?: boolean;
    limit?: number;
    offset?: number;
  } = {},
): Promise<ListResponse<LaunchpadPlacement>> => {
  const raw = unwrapData<any>(await request(`/placements${toQuery(params)}`));
  const items = raw?.items || raw?.placements || [];
  return {
    items: items.map(normalizePlacement),
    total: Number(raw?.total ?? items.length),
    limit: Number(raw?.limit ?? params.limit ?? items.length),
    offset: Number(raw?.offset ?? params.offset ?? 0),
  };
};

export const upsertLaunchpadPlacement = async (
  input: UpsertLaunchpadPlacementInput,
): Promise<LaunchpadPlacement> => (
  extractPlacement(await request('/placements', {
    method: 'POST',
    body: JSON.stringify(input),
  }))
);

export const updateLaunchpadPlacement = async (
  id: string,
  input: PatchLaunchpadPlacementInput,
): Promise<LaunchpadPlacement> => (
  extractPlacement(await request(`/placements/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  }))
);

export const deleteLaunchpadPlacement = async (id: string): Promise<void> => {
  await request<void>(`/placements/${encodeURIComponent(id)}`, { method: 'DELETE' });
};
