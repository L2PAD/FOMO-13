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

const base = "admin/news-parser";

export const npOverview = () => req(`${base}/overview`);
export const npParsing = () => req(`${base}/parsing`);
export const npDiagnostics = () => req(`${base}/diagnostics`);
export const npStats = (days = 7) => req(`${base}/stats?days=${days}`);
export const npGlobal = () => req(`${base}/global`);
export const npGlobalPause = () => req(`${base}/global/pause`, { method: "POST" });
export const npGlobalResume = () => req(`${base}/global/resume`, { method: "POST" });

export const npSources = (q: { tier?: string; status?: string; q?: string } = {}) => {
  const p = new URLSearchParams();
  if (q.tier) p.set("tier", q.tier);
  if (q.status) p.set("status", q.status);
  if (q.q) p.set("q", q.q);
  const qs = p.toString();
  return req(`${base}/sources${qs ? `?${qs}` : ""}`);
};
export const npSourceHealth = (id: string) => req(`${base}/sources/${id}/health`);
export const npCreateSource = (body: any) => req(`${base}/sources`, { method: "POST", body: JSON.stringify(body) });
export const npUpdateSource = (id: string, body: any) => req(`${base}/sources/${id}`, { method: "PATCH", body: JSON.stringify(body) });
export const npDeleteSource = (id: string) => req(`${base}/sources/${id}`, { method: "DELETE" });
export const npRunSource = (id: string) => req(`${base}/sources/${id}/run`, { method: "POST" });
export const npPauseSource = (id: string) => req(`${base}/sources/${id}/pause`, { method: "POST" });
export const npResumeSource = (id: string) => req(`${base}/sources/${id}/resume`, { method: "POST" });
export const npTestSource = (id: string) => req(`${base}/sources/${id}/test`, { method: "POST" });
export const npRunTier = (tier: string) => req(`${base}/run/tier/${tier}`, { method: "POST" });
export const npRunAll = () => req(`${base}/run/all`, { method: "POST" });
export const npRuns = (limit = 50, sourceId?: string) =>
  req(`${base}/runs?limit=${limit}${sourceId ? `&sourceId=${sourceId}` : ""}`);
