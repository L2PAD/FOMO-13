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
export const naDrafts = (limit = 30) => req(`${base}/drafts?limit=${limit}`);
export const naDraft = (hash: string) => req(`${base}/drafts/${hash}`);
export const naRuns = (limit = 20) => req(`${base}/runs?limit=${limit}`);
export const naGenerate = (body: { windowLimit?: number; maxClusters?: number; minClusterSize?: number }) =>
  req(`${base}/generate`, { method: "POST", body: JSON.stringify(body || {}) });
