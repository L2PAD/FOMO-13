import getAccessToken from '../utils/getAccessToken';
import { configureUrl } from './config';

export type ActivityReviewStatus =
  | 'ingested'
  | 'pending_ai'
  | 'pending_human'
  | 'ai_ready'
  | 'needs_human'
  | 'needs_changes'
  | 'approved'
  | 'rejected'
  | string;

export type ActivityPublicationStatus = 'draft' | 'published' | 'hidden' | 'archived' | string;
export type ActivityAccessTier = 'public' | 'prime' | string;
export type ActivityCanonicalStatus =
  | 'unprocessed'
  | 'proposed'
  | 'verified'
  | 'rejected'
  | 'conflict'
  | 'no_candidates'
  | string;

export interface FomoV2ActivityFlags {
  green?: string[];
  yellow?: string[];
  red?: string[];
}

export interface FomoV2ActivityScore {
  label: string;
  value: number;
}

export interface FomoV2ActivityStep {
  id?: string;
  title: string;
  description?: string;
  descriptionHtml?: string;
  image?: string;
  video?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  timeEstimate?: string;
}

export interface FomoV2ActivityTimelineItem {
  title: string;
  date?: string;
  description?: string;
}

export interface FomoV2ActivityRelatedAsset {
  name: string;
  symbol?: string;
  image?: string;
  slug?: string;
}

export interface FomoV2ActivityInvestor {
  id?: string;
  name: string;
  slug?: string;
  symbol?: string;
  logo?: string;
  website?: string;
  source?: string;
}

export interface FomoV2CanonicalCandidate {
  id?: string;
  _id?: string;
  canonicalProjectId?: string;
  name?: string;
  symbol?: string;
  slug?: string;
  logo?: string;
  confidence?: number | string;
  matchedBy?: string;
  reason?: string;
  status?: string;
}

export interface FomoV2ActivityAiChange {
  path: string;
  currentValue?: unknown;
  proposedValue?: unknown;
  reason?: string;
  confidence?: number;
}

export interface FomoV2ActivityAiProposal {
  id?: string;
  proposalId?: string;
  status?: string;
  model?: string;
  promptVersion?: string;
  generatedAt?: string;
  summary?: string;
  warnings?: string[];
  changes?: FomoV2ActivityAiChange[];
  proposal?: Record<string, unknown>;
}

export interface FomoV2AdminActivity {
  _id?: string;
  id?: string | number;
  activityId?: string;
  parserActivityId?: string;
  revision?: number;
  slug?: string;
  externalSlug?: string;
  name?: string;
  projectName?: string;
  coinName?: string;
  symbol?: string;
  coinSymbol?: string;
  logo?: string;
  projectLogo?: string;
  score?: string;
  status?: string;
  lifecycleStatus?: string;
  reviewStatus?: ActivityReviewStatus;
  publicationStatus?: ActivityPublicationStatus;
  accessTier?: ActivityAccessTier;
  isSponsored?: boolean;
  sponsoredPriority?: number;
  canonicalStatus?: ActivityCanonicalStatus;
  canonicalProjectId?: string | null;
  canonicalCandidates?: FomoV2CanonicalCandidate[];
  candidates?: FomoV2CanonicalCandidate[];
  canonicalResolution?: {
    status?: ActivityCanonicalStatus;
    confidence?: string;
    matchedBy?: string;
    reason?: string;
    candidates?: FomoV2CanonicalCandidate[];
  };
  activityType?: string;
  category?: string;
  difficulty?: string;
  cost?: string;
  timeEstimate?: string;
  taskFrequency?: string;
  isHot?: boolean;
  isLocked?: boolean;
  nftRequired?: boolean;
  rewardLabel?: string;
  rewardAmount?: string | number | null;
  rewardSupply?: string | number | null;
  rewardDistribution?: string | null;
  rewardDistributionApprox?: string | null;
  rewards?: unknown[];
  timezone?: string;
  participants?: number | string | null;
  fundsRaised?: number | string | null;
  videoGuides?: string[];
  relatedAssets?: FomoV2ActivityRelatedAsset[];
  investors?: FomoV2ActivityInvestor[];
  timeline?: FomoV2ActivityTimelineItem[];
  ecosystem?: string[];
  platform?: string[];
  tags?: string[];
  requirements?: string[];
  startDate?: string | null;
  endDate?: string | null;
  approxStartDate?: string | null;
  approxEndDate?: string | null;
  description?: {
    about?: string;
    aboutHtml?: string;
    howToParticipate?: string;
    howToParticipateHtml?: string;
  };
  joinLink?: string;
  sourceUrl?: string;
  originalUrl?: string;
  links?: Array<{ label: string; url: string }>;
  socialLinks?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    docs?: string;
    custom?: Array<{ label: string; url: string }>;
  };
  review?: {
    text?: string;
    textHtml?: string;
    scores?: FomoV2ActivityScore[];
    isLocked?: boolean;
  };
  metrics?: {
    riskLevel?: string;
    complexity?: string;
    timeRequired?: string;
    potentialReward?: string;
  };
  flags?: FomoV2ActivityFlags;
  taskGuide?: {
    title?: string;
    description?: string;
    descriptionHtml?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    successMessage?: string;
    isLocked?: boolean;
    steps?: FomoV2ActivityStep[];
  };
  aiProposal?: FomoV2ActivityAiProposal | null;
  aiReview?: FomoV2ActivityAiProposal | null;
  aiProposals?: Array<{
    proposalId?: string;
    status?: string;
    provider?: string;
    model?: string;
    promptVersion?: string;
    inputHash?: string;
    content?: Record<string, unknown>;
    warnings?: string[];
    rationale?: string;
    generatedAt?: string;
  }>;
  currentDraft?: Record<string, unknown>;
  sources?: Array<{
    source?: string;
    sourceId?: string;
    sourceSlug?: string;
    sourceUrl?: string;
    lastSeenAt?: string;
  }>;
  source?: string;
  primarySource?: string;
  updatedAt?: string | number;
  createdAt?: string | number;
  publishedAt?: string | null;
  hiddenAt?: string | null;
  rejectedAt?: string | null;
  auditTrail?: Array<{
    action?: string;
    actor?: string;
    at?: string;
    revision?: number;
    note?: string;
    changedFields?: string[];
    fromStatus?: string;
    toStatus?: string;
  }>;
  [key: string]: unknown;
}

export interface FomoV2ActivityCounts {
  all?: number;
  byReviewStatus?: Record<string, number>;
  byPublicationStatus?: Record<string, number>;
  byAccessTier?: Record<string, number>;
  byCanonicalStatus?: Record<string, number>;
}

export interface FomoV2ActivitiesResponse {
  items: FomoV2AdminActivity[];
  total: number;
  limit: number;
  offset: number;
  counts?: FomoV2ActivityCounts;
}

export interface FomoV2ActivityFilters {
  search?: string;
  reviewStatus?: string;
  publicationStatus?: string;
  accessTier?: string;
  canonicalStatus?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface FomoV2ActivityImportRequest {
  source?: 'legacy' | 'parser' | 'all';
  limit?: number;
  force?: boolean;
  cursor?: string;
  cursors?: Partial<Record<'legacy' | 'parser', string>>;
}

export interface FomoV2ActivityImportCounts {
  scanned: number;
  staged: number;
  created: number;
  updated: number;
  skippedUnchanged: number;
  skippedInvalid: number;
  failed: number;
}

export interface FomoV2ActivityImportPageResult {
  source: 'legacy' | 'parser';
  collection: string;
  database: string;
  cursor?: string;
  nextCursor?: string;
  hasMore: boolean;
  counts: FomoV2ActivityImportCounts;
  canonicalCounts: Record<string, number>;
  errors: Array<{ id?: string; message: string }>;
}

export interface FomoV2ActivityImportResponse {
  source: 'legacy' | 'parser' | 'all';
  limit: number;
  force: boolean;
  results: Partial<Record<'legacy' | 'parser', FomoV2ActivityImportPageResult>>;
  counts: FomoV2ActivityImportCounts;
  cursors: Partial<Record<'legacy' | 'parser', string>>;
  hasMore: boolean;
  publicationChanged: false;
}

interface ApiErrorBody {
  message?: string | string[];
  error?: string;
}

export class FomoV2ActivityApiError extends Error {
  status: number;

  data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.name = 'FomoV2ActivityApiError';
    this.status = status;
    this.data = data;
  }
}

const getErrorMessage = (data: unknown, fallback: string): string => {
  if (!data || typeof data !== 'object') return fallback;
  const body = data as ApiErrorBody;
  if (Array.isArray(body.message)) return body.message.join(', ');
  return body.message || body.error || fallback;
};

const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(configureUrl(path), {
    ...options,
    credentials: 'include',
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = text;
  }

  if (!response.ok) {
    throw new FomoV2ActivityApiError(
      response.status,
      getErrorMessage(data, response.statusText || 'Activity request failed'),
      data,
    );
  }

  return data as T;
};

const toQuery = (filters: FomoV2ActivityFilters): string => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
};

const unwrapActivity = (data: unknown): FomoV2AdminActivity => {
  let activity: FomoV2AdminActivity;
  if (data && typeof data === 'object' && 'activity' in data) {
    activity = (data as { activity: FomoV2AdminActivity }).activity;
  } else if (data && typeof data === 'object' && 'item' in data) {
    activity = (data as { item: FomoV2AdminActivity }).item;
  } else {
    activity = data as FomoV2AdminActivity;
  }

  const currentDraft = activity?.currentDraft && typeof activity.currentDraft === 'object'
    ? activity.currentDraft
    : {};
  const latestAi = Array.isArray(activity?.aiProposals)
    ? [...activity.aiProposals].reverse().find((proposal) => proposal.status === 'proposed')
      || activity.aiProposals[activity.aiProposals.length - 1]
    : undefined;
  const firstSource = Array.isArray(activity?.sources) ? activity.sources[0] : undefined;

  return {
    ...currentDraft,
    ...activity,
    canonicalStatus: activity?.canonicalStatus || activity?.canonicalResolution?.status,
    canonicalCandidates: activity?.canonicalCandidates || activity?.canonicalResolution?.candidates || [],
    aiProposal: activity?.aiProposal || (latestAi ? {
      id: latestAi.proposalId,
      proposalId: latestAi.proposalId,
      status: latestAi.status,
      model: latestAi.model,
      promptVersion: latestAi.promptVersion,
      generatedAt: latestAi.generatedAt,
      summary: latestAi.rationale,
      warnings: latestAi.warnings,
      proposal: latestAi.content,
    } : null),
    source: activity?.source || firstSource?.source,
    primarySource: activity?.primarySource || firstSource?.source,
    sourceUrl: activity?.sourceUrl || firstSource?.sourceUrl,
  } as FomoV2AdminActivity;
};

export const getFomoV2ActivityKey = (activity: FomoV2AdminActivity): string => (
  String(activity._id || activity.activityId || activity.slug || activity.id || '')
);

export const fetchFomoV2Activities = async (
  filters: FomoV2ActivityFilters,
): Promise<FomoV2ActivitiesResponse> => {
  const data = await request<FomoV2ActivitiesResponse | FomoV2AdminActivity[]>(
    `admin/fomo-v2/activities${toQuery(filters)}`,
  );

  if (Array.isArray(data)) {
    return {
      items: data.map((item) => unwrapActivity(item)),
      total: data.length,
      limit: filters.limit || data.length,
      offset: filters.offset || 0,
    };
  }

  return {
    ...data,
    items: Array.isArray(data.items) ? data.items.map((item) => unwrapActivity(item)) : [],
    total: Number(data.total || 0),
    limit: Number(data.limit || filters.limit || 50),
    offset: Number(data.offset || filters.offset || 0),
  };
};

export const fetchFomoV2Activity = async (id: string): Promise<FomoV2AdminActivity> => (
  unwrapActivity(await request(`admin/fomo-v2/activities/${encodeURIComponent(id)}`))
);

export const createFomoV2Activity = async (
  payload: { name: string; activityType?: string; accessTier?: 'public' | 'prime'; category?: string },
): Promise<FomoV2AdminActivity> => (
  unwrapActivity(await request('admin/fomo-v2/activities', {
    method: 'POST',
    body: JSON.stringify(payload),
  }))
);

export const updateFomoV2Activity = async (
  id: string,
  payload: Record<string, unknown>,
): Promise<FomoV2AdminActivity> => (
  unwrapActivity(await request(`admin/fomo-v2/activities/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }))
);

const action = async (
  id: string,
  actionName: string,
  payload: Record<string, unknown> = {},
): Promise<FomoV2AdminActivity> => (
  unwrapActivity(await request(`admin/fomo-v2/activities/${encodeURIComponent(id)}/${actionName}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }))
);

export const approveFomoV2Activity = (id: string, payload?: Record<string, unknown>) => (
  action(id, 'approve', payload)
);

export const publishFomoV2Activity = (id: string, payload?: Record<string, unknown>) => (
  action(id, 'publish', payload)
);

export const rejectFomoV2Activity = (id: string, payload?: Record<string, unknown>) => (
  action(id, 'reject', payload)
);

export const hideFomoV2Activity = (id: string, payload?: Record<string, unknown>) => (
  action(id, 'hide', payload)
);

export const unhideFomoV2Activity = (id: string, payload?: Record<string, unknown>) => (
  action(id, 'unhide', payload)
);

export const generateFomoV2ActivityAiReview = (id: string, payload?: Record<string, unknown>) => (
  action(id, 'ai-review', payload)
);

export const applyFomoV2ActivityAiReview = (id: string, payload?: Record<string, unknown>) => (
  action(id, 'ai-review/apply', payload)
);

export const resolveFomoV2ActivityCanonical = (id: string, payload?: Record<string, unknown>) => (
  action(id, 'canonical/resolve', payload)
);

export const verifyFomoV2ActivityCanonical = (id: string, payload?: Record<string, unknown>) => (
  action(id, 'canonical/verify', payload)
);

export const rejectFomoV2ActivityCanonical = (id: string, payload?: Record<string, unknown>) => (
  action(id, 'canonical/reject', payload)
);

export const noMatchFomoV2ActivityCanonical = (id: string, payload?: Record<string, unknown>) => (
  action(id, 'canonical/no-match', payload)
);

export const rejectFomoV2ActivityAiReview = (id: string, payload: Record<string, unknown>) => (
  action(id, 'ai-review/reject', payload)
);

export const importFomoV2Activities = (payload: FomoV2ActivityImportRequest) => (
  request<FomoV2ActivityImportResponse>('admin/fomo-v2/activities/import', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
);


/* ─────────────── EarlyLand Prime Access (DEPRECATED — P0) ───────────────
 * Access is now managed globally in «Доступ и монетизация» via the canonical
 * AccessResolver/entitlements. Only read-only audit of pre-migration legacy
 * data remains here. Write endpoints (mode switch / create / revoke grants)
 * were removed from the backend and are no longer exposed. */

export interface EarlyLandAccessGrant {
  id: string;
  userId: string;
  userLabel: string;
  reason: string;
  grantedBy: string;
  grantedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedBy: string;
  active: boolean;
}

const ACCESS_BASE = 'admin/fomo-v2/earlyland-access';

/** @deprecated Read-only audit of migrated legacy grants. */
export const fetchEarlyLandAccessGrants = () =>
  request<EarlyLandAccessGrant[]>(`${ACCESS_BASE}/grants`);
