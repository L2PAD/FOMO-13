import getAccessToken from "../utils/getAccessToken";
import { configureUrl } from "./config";

export type ReviewCaseDomain = "identity" | "funding" | "allocation" | "vesting" | "unlock" | "source" | string;
export type ReviewCaseStatus =
  | "open"
  | "approved"
  | "rejected"
  | "sent_to_parser"
  | "resolved"
  | "ignored"
  | "merged"
  | "superseded";
export type ReviewCaseSeverity = "low" | "medium" | "high";

export interface FomoV2ProjectSummary {
  id: string;
  _id?: string;
  name?: string;
  canonicalName?: string;
  symbol?: string;
  slug?: string;
  status?: string;
  isVestingReview?: boolean;
  rank?: number;
  marketCap?: number;
  logoUrl?: string;
  bannerUrl?: string;
  tagline?: string;
  primaryWebsiteDomain?: string;
  profileStatus?: string;
  categories?: string[];
  ecosystems?: string[];
}

export interface FomoV2ReviewCase {
  id: string;
  _id?: string;
  caseKey?: string;
  type: string;
  domain: ReviewCaseDomain;
  status: ReviewCaseStatus;
  severity: ReviewCaseSeverity;
  priority?: number;
  title: string;
  description?: string;
  canonicalProjectId?: string;
  sourceEntityId?: string;
  targetCollection?: string;
  targetId?: string;
  source: string;
  sourceId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
  suggestedAction?: string;
  suggestedTargetId?: string;
  suggestedTargetCollection?: string;
  confidence?: "low" | "medium" | "high";
  payload?: Record<string, unknown>;
  candidates?: Array<Record<string, unknown>>;
  evidenceIds?: string[];
  conflictIds?: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  decisionNote?: string;
  parserTaskId?: string;
  decisionHistory?: Array<Record<string, unknown>>;
  createdAt?: string;
  updatedAt?: string;
  canonicalProject?: FomoV2ProjectSummary;
  suggestedTargetProject?: FomoV2ProjectSummary;
}

export interface FomoV2ReviewCaseListResponse {
  items: FomoV2ReviewCase[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  counts?: {
    all?: number;
    open?: number;
    byDomain?: Record<string, number>;
    byStatus?: Record<string, number>;
    bySeverity?: Record<string, number>;
    byType?: Record<string, number>;
  };
}

export interface FomoV2ReviewCaseFilters {
  status?: string;
  domain?: string;
  type?: string;
  severity?: string;
  source?: string;
  canonicalProjectId?: string;
  excludeType?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface FomoV2ReviewCaseGenerateResult {
  totals?: {
    generatedCandidates?: number;
    uniqueCandidates?: number;
    created?: number;
    existing?: number;
    updated?: number;
  };
  byDomain?: Record<string, number>;
  byType?: Record<string, number>;
  sources?: Record<string, unknown>;
}

export interface FomoV2UnlockImportResult {
  mode: "dry-run" | "write";
  dryRun: boolean;
  sourceType: string;
  unlocksMode: string;
  scannedProjects: number;
  projectsWithCanonicalId: number;
  skippedNoCanonicalProject: number;
  skippedInactiveSource: number;
  skippedSourceConflict: number;
  skippedNoActiveVestingSource: number;
  sourceEventsFound: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsUnchanged: number;
  eventsSkipped: number;
  eventsWouldCreate: number;
  eventsWouldUpdate: number;
  eventsWouldRemainUnchanged: number;
  eventsWouldSkip: number;
  resolveWarnings: number;
  errors: Array<Record<string, unknown>>;
  warnings: string[];
}

export interface FomoV2UnlockStageResult {
  mode: "review-stage";
  sourceType: string;
  canonicalProjectId: string;
  sourceSlug?: string;
  sourceProjectKey?: string;
  sourceDocumentId?: string;
  sourceUrl?: string;
  rawSource: {
    unlockingEvents: Array<Record<string, unknown>>;
    nextUnlockingEvent?: Record<string, unknown>;
  };
  counts: {
    unlockingEvents: number;
    unlockingEventRows: number;
    nextUnlockingEvent: number;
    totalRows: number;
  };
  warnings: string[];
}

export interface FomoV2VestingOverridePayload {
  tokenAllocation?: Array<Record<string, unknown>>;
  vestingRounds?: Array<Record<string, unknown>>;
  vestingSchedule?: Array<Record<string, unknown>>;
  vestingTimeline?: Array<Record<string, unknown>>;
  unlockingEvents?: Array<Record<string, unknown>>;
  nextUnlockingEvent?: Record<string, unknown>;
  publicVesting?: Array<Record<string, unknown>>;
  vestingSummary?: Record<string, unknown>;
}

export interface FomoV2ProjectVestingSnapshot {
  canonicalProjectId: string;
  sourceType?: string;
  sourceSlug?: string;
  sourceProjectKey?: string;
  sourceUrl?: string;
  counts?: {
    tokenAllocation?: number;
    vestingRounds?: number;
    vestingSchedule?: number;
    vestingSummary?: number;
  };
  rawSource: FomoV2VestingOverridePayload;
}

export interface FomoV2ProjectVestingResponse {
  project?: FomoV2ProjectSummary;
  vesting: FomoV2ProjectVestingSnapshot;
  applyResult?: Record<string, unknown>;
  decision?: Record<string, unknown>;
}

export interface FomoV2ReviewCaseUnlockStageResponse {
  unlockStage: FomoV2UnlockStageResult;
  reviewCase: FomoV2ReviewCase;
}

export interface FomoV2ReviewCaseResponse<T = unknown> {
  success: boolean;
  status: number;
  data: T;
  error?: string;
}

const getErrorMessage = (data: unknown, fallback: string) => {
  if (data && typeof data === "object" && "message" in data) {
    const message = (data as { message?: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
};

const request = async <T = unknown>(
  path: string,
  options?: RequestInit
): Promise<FomoV2ReviewCaseResponse<T>> => {
  const token = getAccessToken();
  const response = await fetch(configureUrl(path), {
    ...options,
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const text = await response.text();
  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = { message: text };
  }

  return {
    success: response.status < 300,
    status: response.status,
    data: data as T,
    error: response.status < 300 ? undefined : getErrorMessage(data, response.statusText),
  };
};

const toQuery = (filters: FomoV2ReviewCaseFilters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const text = params.toString();
  return text ? `?${text}` : "";
};

export const fetchFomoV2ReviewCases = async (filters: FomoV2ReviewCaseFilters) => {
  return request<FomoV2ReviewCaseListResponse>(`admin/fomo-v2/review-cases${toQuery(filters)}`, {
    method: "GET",
  });
};

export const fetchFomoV2ReviewCase = async (id: string) => {
  return request<FomoV2ReviewCase>(`admin/fomo-v2/review-cases/${encodeURIComponent(id)}`, {
    method: "GET",
  });
};

export const approveFomoV2ReviewCase = async (
  id: string,
  note?: string,
  applyDecision = false,
  vestingOverride?: FomoV2VestingOverridePayload
) => {
  return request(`admin/fomo-v2/review-cases/${encodeURIComponent(id)}/approve`, {
    method: "POST",
    body: JSON.stringify({
      decisionNote: note,
      applyDecision,
      ...(vestingOverride ? { vestingOverride } : {}),
    }),
  });
};

export const fetchFomoV2ProjectVesting = async (canonicalProjectId: string) => {
  return request<FomoV2ProjectVestingResponse>(
    `admin/fomo-v2/review-cases/projects/${encodeURIComponent(canonicalProjectId)}/vesting`,
    {
      method: "GET",
    }
  );
};

export const updateFomoV2ProjectVesting = async (
  canonicalProjectId: string,
  vestingOverride: FomoV2VestingOverridePayload,
  note?: string
) => {
  return request<FomoV2ProjectVestingResponse>(
    `admin/fomo-v2/review-cases/projects/${encodeURIComponent(canonicalProjectId)}/vesting`,
    {
      method: "PUT",
      body: JSON.stringify({
        decisionNote: note,
        vestingOverride,
      }),
    }
  );
};

export const rejectFomoV2ReviewCase = async (id: string, note?: string) => {
  return request(`admin/fomo-v2/review-cases/${encodeURIComponent(id)}/reject`, {
    method: "POST",
    body: JSON.stringify({ decisionNote: note }),
  });
};

export const ignoreFomoV2ReviewCase = async (id: string, note?: string) => {
  return request(`admin/fomo-v2/review-cases/${encodeURIComponent(id)}/ignore`, {
    method: "POST",
    body: JSON.stringify({ decisionNote: note }),
  });
};

export const sendFomoV2ReviewCaseToParser = async (id: string, reason: string, note?: string) => {
  return request(`admin/fomo-v2/review-cases/${encodeURIComponent(id)}/send-to-parser`, {
    method: "POST",
    body: JSON.stringify({ reason, note }),
  });
};

export const generateFomoV2ReviewCases = async (limit = 1000) => {
  return request<FomoV2ReviewCaseGenerateResult>("admin/fomo-v2/review-cases/generate", {
    method: "POST",
    body: JSON.stringify({ limit, examples: limit }),
  });
};

export const importFomoV2Unlocks = async () => {
  return request<FomoV2UnlockImportResult>("admin/fomo-v2/review-cases/unlocks/import", {
    method: "POST",
    body: JSON.stringify({
      mode: "all",
      sourceType: "dropstab",
      sourceProjectFilter: "unlock-eligible",
    }),
  });
};

export const stageFomoV2ReviewCaseUnlocks = async (id: string) => {
  return request<FomoV2ReviewCaseUnlockStageResponse>(
    `admin/fomo-v2/review-cases/${encodeURIComponent(id)}/unlocks/stage`,
    {
      method: "POST",
      body: JSON.stringify({
        sourceType: "dropstab",
      }),
    }
  );
};
