import getAccessToken from "../utils/getAccessToken";
import { configureUrl } from "./config";

export type CryptoLinkingEntityType = "fundingRounds" | "tokenUnlocks" | "investors";
export type CryptoLinkingConfidence = "exact" | "high";

export interface CryptoLinkingRequest {
  dryRun?: boolean;
  apply?: boolean;
  scanLimit?: number;
  investorScanLimit?: number;
  sampleLimit?: number;
  applyLimit?: number;
  entityTypes?: CryptoLinkingEntityType[];
  allowedConfidence?: CryptoLinkingConfidence[];
  batchId?: string;
}

export interface CryptoLinkingResponse<T = any> {
  success: boolean;
  status: number;
  data: T;
  error?: string;
}

export interface CryptoLinkingProgressJob {
  id: string;
  type: "audit" | "apply";
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  stage: string;
  message: string;
  request?: any;
  result?: any;
  error?: string;
  meta?: any;
  createdAt: string;
  startedAt?: string;
  updatedAt: string;
  completedAt?: string;
}

const request = async <T = any>(
  path: string,
  options?: RequestInit
): Promise<CryptoLinkingResponse<T>> => {
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
  } catch (error) {
    data = { message: text };
  }

  return {
    success: response.status < 300,
    status: response.status,
    data,
    error: response.status < 300 ? undefined : data?.message || response.statusText,
  };
};

export const runCryptoLinkingAudit = async (body: CryptoLinkingRequest) => {
  return request("admin/crypto-linking/dry-run", {
    method: "POST",
    body: JSON.stringify({ ...body, dryRun: true }),
  });
};

export const startCryptoLinkingAuditJob = async (body: CryptoLinkingRequest) => {
  return request<CryptoLinkingProgressJob>("admin/crypto-linking/audit/start", {
    method: "POST",
    body: JSON.stringify({ ...body, dryRun: true }),
  });
};

export const previewCryptoLinkingApply = async (body: CryptoLinkingRequest) => {
  return request("admin/crypto-linking/apply", {
    method: "POST",
    body: JSON.stringify({ ...body, apply: false, dryRun: true }),
  });
};

export const applyCryptoLinkingUpdates = async (body: CryptoLinkingRequest) => {
  return request("admin/crypto-linking/apply", {
    method: "POST",
    body: JSON.stringify({ ...body, apply: true, dryRun: false }),
  });
};

export const startCryptoLinkingApplyJob = async (
  body: CryptoLinkingRequest,
  shouldApply = false
) => {
  return request<CryptoLinkingProgressJob>("admin/crypto-linking/apply/start", {
    method: "POST",
    body: JSON.stringify({
      ...body,
      apply: shouldApply,
      dryRun: !shouldApply,
    }),
  });
};

export const fetchCryptoLinkingProgress = async (jobId: string) => {
  return request<CryptoLinkingProgressJob>(
    `admin/crypto-linking/progress/${encodeURIComponent(jobId)}`,
    { method: "GET" }
  );
};

export const fetchCryptoLinkingHistory = async (limit = 25) => {
  return request<{ jobs: CryptoLinkingProgressJob[] }>(
    `admin/crypto-linking/history?limit=${encodeURIComponent(String(limit))}`,
    { method: "GET" }
  );
};

export const fetchCryptoLinkingBatch = async (batchId: string) => {
  return request(`admin/crypto-linking/batch/${encodeURIComponent(batchId)}`, {
    method: "GET",
  });
};
