import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from "../config";

const req = async (path: string, options?: RequestInit) => {
  const token: string = getAccessToken();
  const response = await fetch(configureUrl(path), {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    credentials: "include",
  });
  const text = await response.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }
  return { success: response.status < 300, status: response.status, data };
};

const base = "admin/news-ai";

export const naOverview = () => req(`${base}/overview`);
export const naDrafts = (limit = 30, status?: string) => req(`${base}/drafts?limit=${limit}${status ? `&status=${status}` : ""}`);
export const naDraft = (hash: string) => req(`${base}/drafts/${hash}`);
export const naRuns = (limit = 20) => req(`${base}/runs?limit=${limit}`);
export const naGenerate = (body: { windowLimit?: number; maxClusters?: number; minSources?: number }) =>
  req(`${base}/generate`, { method: "POST", body: JSON.stringify(body || {}) });

// Phase 5 — settings + moderation lifecycle
export const naSettings = () => req(`${base}/settings`);
export const naUpdateSettings = (patch: any) => req(`${base}/settings`, { method: "PATCH", body: JSON.stringify(patch || {}) });
export const naBudget = () => req(`${base}/budget`);
export const naEditDraft = (hash: string, editorial: any) => req(`${base}/drafts/${hash}`, { method: "PATCH", body: JSON.stringify({ editorial }) });
export const naApprove = (hash: string) => req(`${base}/drafts/${hash}/approve`, { method: "POST" });
export const naReject = (hash: string) => req(`${base}/drafts/${hash}/reject`, { method: "POST" });
export const naRegenerate = (hash: string) => req(`${base}/drafts/${hash}/regenerate`, { method: "POST" });
export const naPublish = (hash: string) => req(`${base}/drafts/${hash}/publish`, { method: "POST" });
export const naUnpublish = (hash: string) => req(`${base}/drafts/${hash}/unpublish`, { method: "POST" });
