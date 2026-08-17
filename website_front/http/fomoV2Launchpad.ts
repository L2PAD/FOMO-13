import { API } from "../config/api";
import getAuthToken from "./getAuthToken";
import {
  FomoV2LaunchpadDetail,
  FomoV2LaunchpadListResponse,
  FomoV2LaunchpadSummary,
  FomoV2LaunchpadVerifyInput,
  FomoV2LaunchpadVerifyResponse,
} from "../types/fomoV2Launchpad";

export class LaunchpadApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "LaunchpadApiError";
    this.status = status;
  }
}

const unwrapData = <T>(value: unknown): T => {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
};

const readErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { message?: string | string[]; error?: string };
    if (Array.isArray(body.message)) return body.message.join(", ");
    return body.message || body.error || `Launchpad request failed (${response.status})`;
  } catch {
    return `Launchpad request failed (${response.status})`;
  }
};

const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();
  const response = await fetch(`${API}/fomo-v2/launchpad${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    throw new LaunchpadApiError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) return undefined as T;
  return unwrapData<T>(await response.json());
};

const toQuery = (params: Record<string, string | number | boolean | undefined>): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === "") return;
    search.set(key, String(value));
  });
  const value = search.toString();
  return value ? `?${value}` : "";
};

export const fetchFomoV2LaunchpadDetail = async (
  idOrSlug: string,
  wallet?: string,
  signal?: AbortSignal
): Promise<FomoV2LaunchpadDetail> => {
  const response = await request<FomoV2LaunchpadDetail | { launchpad: FomoV2LaunchpadDetail }>(
    `/${encodeURIComponent(idOrSlug)}${toQuery({ wallet })}`,
    { signal }
  );
  return "launchpad" in response ? response.launchpad : response;
};

export const fetchFomoV2Launchpads = async (
  params: {
    limit?: number;
    offset?: number;
    surface?: "launchpad" | "crypto_projects";
  } = {},
  signal?: AbortSignal
): Promise<FomoV2LaunchpadListResponse> => {
  const response = await request<
    FomoV2LaunchpadListResponse | { launchpads: FomoV2LaunchpadSummary[]; total?: number }
  >(toQuery(params), { signal });

  if ("items" in response) return response;
  return {
    items: response.launchpads || [],
    total: response.total ?? response.launchpads?.length ?? 0,
    limit: params.limit,
    offset: params.offset,
  };
};

export const verifyFomoV2LaunchpadTransaction = async (
  launchpadId: string,
  input: FomoV2LaunchpadVerifyInput
): Promise<FomoV2LaunchpadVerifyResponse> => {
  const response = await request<
    FomoV2LaunchpadVerifyResponse | { result: FomoV2LaunchpadVerifyResponse }
  >(`/${encodeURIComponent(launchpadId)}/transactions/verify`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return "result" in response ? response.result : response;
};
