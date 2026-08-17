import getAccessToken from "../utils/getAccessToken";
import { configureUrl } from "./config";

export const RATING_ENTITY_TYPES = ["projects", "backers", "users"] as const;

export type RatingEntityType = (typeof RATING_ENTITY_TYPES)[number];
export type RatingRunState = "idle" | "running" | "completed" | "failed";
export type RatingRunTrigger = "manual" | "schedule";

export interface RatingFormulaModeConfig {
  componentWeights: Record<string, number>;
  fullnessComponentWeights: Record<string, number>;
  penaltyMultipliers: Record<string, number>;
  capValues: Record<string, number>;
  minScore: number;
  maxScore: number;
  preserveDefaultCaps: boolean;
}

export interface RatingFormulaConfig {
  modes: Record<string, RatingFormulaModeConfig>;
}

export interface RatingScheduleConfig {
  enabled: boolean;
  cron: string;
  timezone: string;
}

export interface RatingEntityConfig {
  enabled: boolean;
  batchSize: number;
  schedule: RatingScheduleConfig;
  formula: RatingFormulaConfig;
}

export type AdminRatingConfig = Record<RatingEntityType, RatingEntityConfig>;

export interface RatingRunResult {
  scanned: number;
  updated: number;
  errors: number;
  durationMs: number;
}

export interface RatingRuntimeState {
  state: RatingRunState;
  running: boolean;
  runId: string | null;
  trigger: RatingRunTrigger | null;
  configVersion: number | null;
  startedAt: string | null;
  heartbeatAt: string | null;
  leaseExpiresAt: string | null;
  finishedAt: string | null;
  lastRunAt: string | null;
  lastResult: RatingRunResult | null;
  lastError: string | null;
  nextRunAt: string | null;
}

export type RatingRuntimeEntities = Record<RatingEntityType, RatingRuntimeState>;

export interface RatingFormulaCatalogMode {
  components: string[];
  fullnessComponents: string[];
  penalties: string[];
  caps: string[];
}

export type RatingFormulaCatalog = Record<
  RatingEntityType,
  Record<string, RatingFormulaCatalogMode>
>;

export interface AdminRatingConfigPayload {
  version: number;
  updatedAt?: string | null;
  entities: AdminRatingConfig;
  runtime: RatingRuntimeEntities;
  schedulerAvailable: boolean;
  formulaCatalog?: RatingFormulaCatalog;
}

export interface AdminRatingStatusPayload {
  entities: RatingRuntimeEntities;
  schedulerAvailable: boolean;
}

export interface RatingRecalculateResult {
  accepted: boolean;
  entityType: RatingEntityType;
  runId?: string | null;
  state?: RatingRunState;
  startedAt?: string | null;
  runtime?: RatingRuntimeState;
  message?: string;
}

export interface AdminRatingResponse<T> {
  success: boolean;
  data: T;
  status: number;
  error?: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getErrorMessage = (data: unknown, fallback: string) => {
  if (!isRecord(data)) return fallback;

  const value = data.message || data.error;
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string" && value) return value;
  if (isRecord(value) && typeof value.message === "string") return value.message;

  return fallback;
};

const request = async <T>(
  path: string,
  options?: RequestInit
): Promise<AdminRatingResponse<T>> => {
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
    success: response.ok,
    data: data as T,
    status: response.status,
    error: response.ok
      ? undefined
      : getErrorMessage(data, response.statusText || "Request failed"),
  };
};

const unwrapData = (value: unknown): unknown => {
  if (!isRecord(value) || !isRecord(value.data)) return value;
  return value.data;
};

const hasRatingEntities = (value: unknown): value is AdminRatingConfig =>
  isRecord(value) &&
  RATING_ENTITY_TYPES.every((entityType) => isRecord(value[entityType]));

const normalizeConfigPayload = (
  response: AdminRatingResponse<unknown>
): AdminRatingResponse<AdminRatingConfigPayload> => {
  const value = unwrapData(response.data);
  const record = isRecord(value) ? value : null;
  const entities = record?.entities;

  if (!record || !hasRatingEntities(entities)) {
    return {
      ...response,
      success: false,
      data: {} as AdminRatingConfigPayload,
      error: response.error || "The server returned an invalid rating configuration",
    };
  }

  return {
    ...response,
    data: {
      version: typeof record.version === "number" ? record.version : 1,
      updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : null,
      entities,
      runtime: (isRecord(record.runtime) ? record.runtime : {}) as RatingRuntimeEntities,
      schedulerAvailable: Boolean(record.schedulerAvailable),
      formulaCatalog: (isRecord(record.formulaCatalog)
        ? record.formulaCatalog
        : isRecord(record.catalog)
        ? record.catalog
        : undefined) as RatingFormulaCatalog | undefined,
    },
  };
};

const normalizeStatusPayload = (
  response: AdminRatingResponse<unknown>
): AdminRatingResponse<AdminRatingStatusPayload> => {
  const value = unwrapData(response.data);
  const record = isRecord(value) ? value : null;

  if (!record || !isRecord(record.entities)) {
    return {
      ...response,
      success: false,
      data: {} as AdminRatingStatusPayload,
      error: response.error || "The server returned an invalid rating status",
    };
  }

  return {
    ...response,
    data: {
      entities: record.entities as RatingRuntimeEntities,
      schedulerAvailable: Boolean(record.schedulerAvailable),
    },
  };
};

export const fetchAdminRatingConfig = async () =>
  normalizeConfigPayload(
    await request<unknown>("admin/ratings/config", { method: "GET" })
  );

export const updateAdminRatingConfig = async (
  version: number,
  config: AdminRatingConfig
) =>
  normalizeConfigPayload(
    await request<unknown>("admin/ratings/config", {
      method: "PUT",
      body: JSON.stringify({ version, entities: config }),
    })
  );

export const fetchAdminRatingStatus = async () =>
  normalizeStatusPayload(
    await request<unknown>("admin/ratings/status", { method: "GET" })
  );

const normalizeRecalculateResult = (value: unknown): RatingRecalculateResult => {
  const unwrapped = unwrapData(value);
  return isRecord(unwrapped) ? (unwrapped as unknown as RatingRecalculateResult) : ({} as RatingRecalculateResult);
};

export const recalculateRatings = async (entityType: RatingEntityType) => {
  const response = await request<unknown>("admin/ratings/recalculate", {
    method: "POST",
    body: JSON.stringify({ entityType }),
  });

  return { ...response, data: normalizeRecalculateResult(response.data) };
};
