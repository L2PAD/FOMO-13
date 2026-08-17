import getAccessToken from "../../components/utils/getAccessToken";
import { configureUrl } from "../../components/services/config";

export interface StatFilters {
  from?: string;
  to?: string;
  tzOffset?: number;
}

const qs = (params: Record<string, any>): string => {
  const s = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return s ? `?${s}` : "";
};

const get = async <T>(path: string): Promise<T> => {
  const token = getAccessToken();
  const res = await fetch(configureUrl(`admin/statistics/${path}`), {
    credentials: "include",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = JSON.parse(text);
      msg = Array.isArray(j?.message) ? j.message.join(", ") : j?.message || j?.error || msg;
    } catch {}
    throw new Error(msg || `Request failed (${res.status})`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
};

const withRange = (f?: StatFilters) =>
  qs({ from: f?.from, to: f?.to, tzOffset: f?.tzOffset });

export const StatisticsApi = {
  overview: (f?: StatFilters) => get<any>(`overview${withRange(f)}`),
  audience: (f?: StatFilters) => get<any>(`audience${withRange(f)}`),
  funnel: (f?: StatFilters) => get<any>(`funnel${withRange(f)}`),
  activity: (f?: StatFilters) => get<any>(`activity${withRange(f)}`),
  xp: (f?: StatFilters) => get<any>(`xp${withRange(f)}`),
  tasks: (f?: StatFilters & { taskType?: string; domain?: string }) =>
    get<any>(`tasks${qs({ ...f })}`),
  fomoScore: (f?: StatFilters) => get<any>(`fomo-score${withRange(f)}`),
  content: (f?: StatFilters) => get<any>(`content${withRange(f)}`),
  antifraud: (f?: StatFilters) => get<any>(`antifraud${withRange(f)}`),
  users: (f: StatFilters & { search?: string; limit?: number; offset?: number }) =>
    get<any>(`users${qs({ ...f })}`),
  userDetail: (id: string) => get<any>(`users/${encodeURIComponent(id)}`),
};
