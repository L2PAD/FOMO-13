import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

/**
 * Public (BUZZ) Digests client — editorial market reviews authored in the CRM
 * (Content → Calendar → Дайджесты). Read-only, returns only PUBLISHED digests.
 * Same backend/domain as the calendar; no parallel engine.
 */
export interface IPublicDigestMedia {
  label?: string;
  url: string;
  kind?: string;
}

export interface IPublicDigest {
  id: string;
  title: string;
  slug?: string;
  period: "WEEK" | "MONTH" | "QUARTER" | "HALF_YEAR" | "YEAR";
  kind?: string;
  summary?: string;
  keyTakeaways?: string[];
  bodyHtml?: string;
  coverImage?: string;
  tags?: string[];
  outlook?: "BULLISH" | "BEARISH" | "NEUTRAL" | "MIXED";
  periodStart?: string;
  periodEnd?: string;
  publishedAt?: string;
  media?: IPublicDigestMedia[];
  likesCount?: number;
  repostsCount?: number;
  liked?: boolean;
  reposted?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const authHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const fetchPublicDigests = async (
  params: { period?: string; limit?: number } = {}
): Promise<IPublicDigest[]> => {
  try {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
    });
    const q = qs.toString();
    const res = await fetch(`${API}/calendar/digests${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: { ...authHeaders() },
    });
    const data = await res.json();
    return Array.isArray(data?.items) ? data.items : [];
  } catch (error) {
    console.error("fetchPublicDigests", error);
    return [];
  }
};

export const fetchPublicDigest = async (id: string): Promise<IPublicDigest | null> => {
  try {
    const res = await fetch(`${API}/calendar/digests/${id}`, {
      method: "GET",
      headers: { ...authHeaders() },
    });
    if (!res.ok) return null;
    return (await res.json()) as IPublicDigest;
  } catch (error) {
    console.error("fetchPublicDigest", error);
    return null;
  }
};

export interface IDigestReactionState {
  likesCount: number;
  repostsCount: number;
  liked: boolean;
  reposted: boolean;
}

// Toggle a live reaction. Requires an authenticated user; returns null when
// the viewer is not signed in (HTTP 401/403) so the UI can prompt to log in.
export const toggleDigestReaction = async (
  id: string,
  kind: "like" | "repost"
): Promise<IDigestReactionState | null> => {
  const token = getAuthToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API}/calendar/digests/${id}/${kind}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401 || res.status === 403) return null;
    if (!res.ok) return null;
    return (await res.json()) as IDigestReactionState;
  } catch (error) {
    console.error("toggleDigestReaction", error);
    return null;
  }
};

export const isDigestViewerAuthed = (): boolean => Boolean(getAuthToken());

export const DIGEST_PERIOD_LABEL: Record<string, string> = {
  WEEK: "7-day",
  MONTH: "Monthly",
  QUARTER: "Quarterly",
  HALF_YEAR: "Half-year",
  YEAR: "Annual",
};
