import getAccessToken from "../utils/getAccessToken";
import { configureUrl } from "./config";

export const UNIFIED_ENTITY_TYPES = [
  "funds",
  "persons",
  "projects",
  "users",
] as const;
export type UnifiedEntityType = (typeof UNIFIED_ENTITY_TYPES)[number];

export interface CategoryBand {
  key: string;
  label: string;
  min: number;
  max: number;
}
export interface ThresholdStep {
  at: number;
  points: number;
}

/* ---- Sub-formula (formula-inside-formula) config ---- */
export type NormRule =
  | { type: "pct" }
  | { type: "linear"; cap: number }
  | { type: "log"; cap: number }
  | { type: "ratio" }
  | { type: "recency"; halfLifeDays: number }
  | { type: "bool" }
  | { type: "tiered"; table: ThresholdStep[] };

export interface SubMetricDef {
  key: string;
  label: string;
  source: string;
  weight: number;
  norm: NormRule;
  penalty?: boolean;
}

export interface ComponentFormula {
  kind:
    | "weighted"
    | "scalar"
    | "tiered"
    | "dealQuality"
    | "resilience"
    | "compliance"
    | "partnerships"
    | "weightedList";
  label: string;
  tooltip: string;
  formula: string;
  source?: string;
  cap?: number;
  field?: string;
  norm?: NormRule;
  table?: ThresholdStep[];
  subs?: SubMetricDef[];
  rolePoints?: Record<string, number>;
  crisisSubs?: SubMetricDef[];
  fullConfidenceCrises?: number;
  jurisdictionField?: string;
  flags?: { key: string; label: string; delta: number }[];
  kindRatings?: Record<string, number>;
  divisor?: number;
  recencyHalfLifeDays?: number;
}

export interface SubFormulasConfig {
  funds: Record<string, ComponentFormula>;
  persons: Record<string, ComponentFormula>;
  twitter: Record<string, ComponentFormula>;
  projects: Record<string, ComponentFormula>;
  users: Record<string, ComponentFormula>;
}
export interface SubBreakdown {
  key: string;
  raw: number;
  normalized: number;
  weight: number;
  contribution: number;
  present: boolean;
  penalty?: boolean;
}
export interface ComponentBreakdown {
  raw: number;
  weight: number;
  contribution: number;
  source?: "manual" | "derived" | "missing";
  sub?: SubBreakdown[];
}
export interface UnifiedScoreResult {
  score: number;
  level: string;
  formulaVersion: string;
  calculatedAt: string;
  completeness: number;
  components: Record<string, ComponentBreakdown>;
  penalties: { key: string; value: number; reason: string }[];
  missingFields: string[];
  meta?: Record<string, any>;
}

export interface UnifiedRatingConfig {
  formulaVersion: string;
  batchSize: number;
  subFormulas: SubFormulasConfig;
  collections: Record<UnifiedEntityType, string>;
  funds: {
    enabled: boolean;
    limits: Record<string, number>;
    rates: Record<string, number>;
    tiers: CategoryBand[];
  };
  persons: {
    enabled: boolean;
    weights: Record<string, number>;
    categories: CategoryBand[];
  };
  projects: {
    enabled: boolean;
    weights: Record<string, number>;
    redFlags: { first: number; second: number; subsequent: number; max: number };
    categories: CategoryBand[];
  };
  users: {
    enabled: boolean;
    weights: { platformActivity: number; tradeReputation: number };
    platformActivity: { points: Record<string, number>; maxPoints: number };
    platformUser?: { weights: Record<string, number> };
    trade: {
      otc: TradeDirectionConfig;
      p2p: TradeDirectionConfig;
      shared?: TradeDirectionConfig;
      coreWeight?: number;
      experienceWeight?: number;
      reviewConfidence: ThresholdStep[];
      riskPenalties: { lostDispute: number; repeatViolation: number };
      ranks: CategoryBand[];
    };
    ranks: CategoryBand[];
  };
  twitter: {
    enabled: boolean;
    weights: Record<string, number>;
    normalization: { followersMax: number; engagementRateMax: number };
    categories: CategoryBand[];
  };
}

export interface TradeDirectionConfig {
  componentMax: {
    volume: number;
    trades: number;
    reviews: number;
    counterparties: number;
  };
  volumeThresholds: ThresholdStep[];
  tradeThresholds: ThresholdStep[];
  counterpartyThresholds: ThresholdStep[];
}

export interface UnifiedRuntimeState {
  state: "idle" | "running" | "completed" | "failed";
  running: boolean;
  runId: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  lastRunAt: string | null;
  lastResult: {
    scanned: number;
    updated: number;
    errors: number;
    durationMs: number;
  } | null;
  lastError: string | null;
  configVersion: number | null;
}

export interface UnifiedConfigPayload {
  version: number;
  updatedAt: string | null;
  updatedBy: string;
  config: UnifiedRatingConfig;
  runtime: Record<UnifiedEntityType, UnifiedRuntimeState>;
  entityTypes: UnifiedEntityType[];
  defaults: UnifiedRatingConfig;
  formulaVersion: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  status: number;
  error?: string;
}

const errorMessage = (data: any, fallback: string) => {
  if (!data || typeof data !== "object") return fallback;
  const value = data.message || data.error;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string" && value) return value;
  return fallback;
};

const request = async <T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> => {
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
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }
  return {
    success: response.ok,
    data: data as T,
    status: response.status,
    error: response.ok
      ? undefined
      : errorMessage(data, response.statusText || "Request failed"),
  };
};

export const fetchUnifiedConfig = () =>
  request<UnifiedConfigPayload>("admin/ratings/unified/config", {
    method: "GET",
  });

export const saveUnifiedConfig = (version: number, config: UnifiedRatingConfig) =>
  request<UnifiedConfigPayload>("admin/ratings/unified/config", {
    method: "PUT",
    body: JSON.stringify({ version, config }),
  });

export const fetchUnifiedStatus = () =>
  request<{ runtime: Record<UnifiedEntityType, UnifiedRuntimeState>; version: number }>(
    "admin/ratings/unified/status",
    { method: "GET" }
  );

export const recalculateUnified = (entityType: UnifiedEntityType, entityId?: string) =>
  request<any>("admin/ratings/unified/recalculate", {
    method: "POST",
    body: JSON.stringify({ entityType, entityId }),
  });

export const searchUnified = (entityType: string, q: string) =>
  request<{ entityType: string; items: { id: string; label: string; score: number | null }[] }>(
    `admin/ratings/unified/search?entityType=${encodeURIComponent(entityType)}&q=${encodeURIComponent(q)}`,
    { method: "GET" }
  );

export interface RatingHistoryItem {
  score: number;
  level?: string;
  delta?: number;
  completeness?: number;
  reason?: string;
  createdAt?: string;
  isCurrent?: boolean;
  provenance?: { mode?: string };
  components?: Record<string, any>;
  inputSnapshotId?: string;
  inputSnapshotIds?: string[];
  configSnapshotId?: string;
  observedAt?: string;
  calculatedAt?: string;
}

export const fetchRatingHistory = (entityType: string, id: string, limit = 50) =>
  request<RatingHistoryItem[]>(
    `ratings/${encodeURIComponent(entityType)}/${encodeURIComponent(id)}/history?limit=${limit}`,
    { method: "GET" }
  );

export const fetchCurrentRating = (entityType: string, id: string) =>
  request<any>(`ratings/${encodeURIComponent(entityType)}/${encodeURIComponent(id)}`, { method: "GET" });

export const previewUnified = (
  entityType: string,
  input: any,
  config?: UnifiedRatingConfig
) =>
  request<{ entityType: string; result: UnifiedScoreResult }>(
    "admin/ratings/unified/preview",
    {
      method: "POST",
      body: JSON.stringify({ entityType, input, config }),
    }
  );

/** Per-entity RAW preview: sends a Raw DTO, returns score + PROVENANCE. */
export const previewUnifiedRaw = (entityType: string, raw: any, source = "admin-preview") =>
  request<{ entityType: string; mode: string; input: any; result: UnifiedScoreResult; provenance: any }>(
    `admin/ratings/unified/preview/${encodeURIComponent(entityType)}`,
    { method: "POST", body: JSON.stringify({ raw, source }) }
  );

/* --------------------------- reference directories --------------------------- */
export const fetchReferenceCatalogs = () =>
  request<{ catalogs: string[] }>("admin/ratings/references", { method: "GET" });

export const fetchReferenceItems = (catalog: string) =>
  request<{ catalog: string; count: number; items: any[] }>(
    `admin/ratings/references/${encodeURIComponent(catalog)}`,
    { method: "GET" }
  );

export const upsertReferenceItem = (catalog: string, code: string, body: any) =>
  request<any>(`admin/ratings/references/${encodeURIComponent(catalog)}/${encodeURIComponent(code)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });

export const deleteReferenceItem = (catalog: string, code: string) =>
  request<any>(`admin/ratings/references/${encodeURIComponent(catalog)}/${encodeURIComponent(code)}`, {
    method: "DELETE",
  });

/* --------------------------- snapshot explorer --------------------------- */
export interface RatingSnapshot {
  _id: string;
  entityType: string;
  entityId: string;
  source: string;
  schemaVersion?: number;
  payload: any;
  observedAt?: string;
  receivedAt: string;
  idempotencyKey?: string;
  checksum: string;
  validationStatus: "valid" | "invalid";
  lastResultScore?: number | null;
}

export interface SnapshotListResponse {
  items: RatingSnapshot[];
  total: number;
  limit: number;
  skip: number;
}

export interface SnapshotFilters {
  entityType?: string;
  entityId?: string;
  source?: string;
  validationStatus?: string;
  from?: string;
  to?: string;
  limit?: number;
  skip?: number;
}

export const fetchSnapshots = (filters: SnapshotFilters = {}) => {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length) qs.append(k, String(v));
  });
  return request<SnapshotListResponse>(
    `admin/ratings/snapshots${qs.toString() ? `?${qs.toString()}` : ""}`,
    { method: "GET" }
  );
};

export const fetchSnapshotSources = () =>
  request<string[]>("admin/ratings/snapshots/sources", { method: "GET" });

export const fetchSnapshotDetail = (id: string) =>
  request<{ snapshot: RatingSnapshot | null; currentResult: any }>(
    `admin/ratings/snapshots/${encodeURIComponent(id)}`,
    { method: "GET" }
  );

export const recalcFromSnapshot = (id: string) =>
  request<any>(`admin/ratings/snapshots/${encodeURIComponent(id)}/recalculate`, {
    method: "POST",
  });

export const compareSnapshots = (a: string, b: string) =>
  request<{ left: RatingSnapshot | null; right: RatingSnapshot | null }>(
    `admin/ratings/snapshots/compare/${encodeURIComponent(a)}/${encodeURIComponent(b)}`,
    { method: "GET" }
  );

/* ------------------------------- XP / Ranks ------------------------------- */
export interface XpRankItem {
  _id?: string;
  key: string;
  name: string;
  order: number;
  minXp: number;
  maxXp: number;
  icon: string;
  description?: string;
  privileges?: string[];
  enabled: boolean;
}
export interface XpRanksPayload {
  xpMax: number;
  ranks: XpRankItem[];
}
export interface XpRankPreview {
  key: string;
  name: string;
  order: number;
  minXp: number;
  maxXp: number;
  icon: string;
  xp: number;
  xpIntoRank: number;
  xpToNext: number;
  progressPct: number;
  isMax: boolean;
}

export const fetchXpRanks = () =>
  request<XpRanksPayload>("admin/xp/ranks", { method: "GET" });

export const saveXpRanks = (ranks: XpRankItem[]) =>
  request<XpRanksPayload>("admin/xp/ranks", {
    method: "PUT",
    body: JSON.stringify({ ranks }),
  });

export const previewXpRank = (xp: number) =>
  request<XpRankPreview>(`admin/xp/ranks/preview?xp=${encodeURIComponent(String(xp))}`, {
    method: "GET",
  });

/* ---------------- XP Rules (anti-farm config) ---------------- */
export interface XpRule {
  _id?: string;
  eventType: string;
  group: string;
  enabled: boolean;
  baseXp: number;
  multiplier: number;
  cooldownSec: number;
  dailyCap: number;
  lifetimeCap: number;
  uniqueBy: "none" | "source" | "entity" | "day";
  maxPerEntity: number;
  verificationRequired: boolean;
  reversible: boolean;
  description?: string;
}

export const fetchXpRules = () =>
  request<{ rules: XpRule[] }>("admin/xp/rules", { method: "GET" });

export const saveXpRule = (eventType: string, patch: Partial<XpRule>) =>
  request<XpRule>(`admin/xp/rules/${encodeURIComponent(eventType)}`, {
    method: "PUT",
    body: JSON.stringify(patch),
  });

/* ---------------- XP Ledger (transactions / history) ---------------- */
export interface XpTransaction {
  _id?: string;
  userId: string;
  eventType: string;
  source: string;
  sourceType?: string;
  sourceId?: string;
  baseXp: number;
  multiplier: number;
  finalXp: number;
  status: "pending" | "awarded" | "rejected" | "reversed";
  reason?: string;
  metadata?: Record<string, any>;
  occurredAt?: string;
  awardedAt?: string | null;
  reversedAt?: string | null;
  createdAt?: string;
}
export interface XpTransactionsPayload {
  userId: string;
  ledgerXp: number;
  rank: XpRankPreview;
  transactions: XpTransaction[];
}

export const fetchXpTransactions = (userId: string, limit = 100) =>
  request<XpTransactionsPayload>(
    `admin/xp/transactions/${encodeURIComponent(userId)}?limit=${limit}`,
    { method: "GET" }
  );

export const awardXp = (body: Partial<XpTransaction> & { userId: string; eventType: string; verified?: boolean }) =>
  request<any>("admin/xp/award", { method: "POST", body: JSON.stringify(body) });

export const reverseXp = (transactionId: string, reason?: string) =>
  request<any>(`admin/xp/reverse/${encodeURIComponent(transactionId)}`, {
    method: "POST",
    body: JSON.stringify({ reason: reason || "manual_reversal" }),
  });

/* ---------------- Reconciliation / migration ---------------- */
export interface ReconcileDiff {
  userId: string;
  stored: number;
  ledger: number;
  delta: number;
}
export interface ReconcilePayload {
  checked: number;
  mismatches: number;
  diffs: ReconcileDiff[];
  fixed: boolean;
}
export interface MigratePayload {
  version: string;
  usersChecked: number;
  migrated: number;
  skipped: number;
  totalXp: number;
  details: Array<{ userId: string; email?: string; stored: number; delta: number; source: string }>;
}

export const fetchReconciliation = () =>
  request<ReconcilePayload>("admin/xp/reconciliation", { method: "GET" });

export const fixReconciliation = (userId: string) =>
  request<any>(`admin/xp/reconciliation/${encodeURIComponent(userId)}/fix`, {
    method: "POST",
  });

export const runXpMigration = (version = "v1") =>
  request<MigratePayload>("admin/xp/migrate", {
    method: "POST",
    body: JSON.stringify({ version }),
  });

export const resetXpDemo = () =>
  request<{ removed: number; recomputedUsers: number }>("admin/xp/demo/reset", {
    method: "POST",
  });

/* ---------------- Fomies lookup (for history user picker) ---------------- */
export interface FomieLite {
  _id: string;
  name?: string;
  username?: string;
  email?: string;
  activityXP?: number;
  rank?: string;
}
export const fetchFomiesForPicker = () =>
  request<any>("user/fomonauts/all?limit=100&offset=0", { method: "GET" });

/* ---------------- Spaceport admin config ---------------- */
export interface SpaceportAdminMilestone {
  days: number;
  xp: number;
  active: boolean;
  _id?: string;
}
export interface SpaceportAdminLevel {
  level: number;
  name: string;
  description?: string;
  active?: boolean;
  minLifetimeDays?: number;
  minActivityXp?: number;
  requiresNft?: boolean;
  minLaunchpad?: number;
  minTrades?: number;
  benefits?: string[];
}
export interface SpaceportAdminConfig {
  _id?: string;
  milestones: SpaceportAdminMilestone[];
  levels: SpaceportAdminLevel[];
  stakingPeriodsMonths: number[];
  version: number;
}
export interface SpaceportPreview {
  activityXp: number;
  xpRank: string;
  xpProgress: number;
  integrationStatus: string;
  nft: { eligible: boolean; activeCount: number; tier: string; entitlementStatus: string };
  staking: {
    active: boolean;
    currentContinuousStakeDays: number;
    lifetimeQualifiedStakeDays: number;
    nextMilestoneDays: number | null;
    daysToNextMilestone: number | null;
    nextMilestoneXp: number | null;
  };
  spaceport: {
    currentLevel: number;
    currentLevelName: string;
    levels: Array<{
      level: number;
      name: string;
      status: string;
      requirementsMet?: number;
      requirementsTotal?: number;
      requirements: Array<{ key: string; label: string; met: boolean; current?: number; target?: number }>;
    }>;
    nextLevel: { level: number; name: string } | null;
  };
}

export const fetchSpaceportConfig = () =>
  request<SpaceportAdminConfig>("admin/spaceport/config", { method: "GET" });

export const saveSpaceportConfig = (patch: Partial<SpaceportAdminConfig>) =>
  request<SpaceportAdminConfig>("admin/spaceport/config", {
    method: "POST",
    body: JSON.stringify(patch),
  });

export const previewSpaceportUser = (userId: string) =>
  request<SpaceportPreview>(`admin/spaceport/preview/${encodeURIComponent(userId)}`, {
    method: "GET",
  });


