import getAccessToken from "../../utils/getAccessToken";
import { configureUrl } from "../config";

export interface ICalendarEvent {
  id: string;
  title: string;
  shortDescription?: string;
  description?: string;
  eventType?: string;
  category?: string;
  sourceType?: string;
  sourceId?: string;
  entityType?: string;
  entityId?: string;
  relatedArticleId?: string;
  visibility?: string;
  lifecycleStatus?: string;
  startAt?: string;
  endAt?: string;
  allDay?: boolean;
  timezone?: string;
  priority?: number;
  image?: string;
  icon?: string;
  colorKey?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  tags?: string[];
  sourceName?: string;
  sourceUrl?: string;
  sourcePublishedAt?: string;
  generatedBy?: string;
  reviewStatus?: string;
  publishAt?: string;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICalendarType {
  name: string;
  key: string;
  category: string;
  icon: string;
  colorKey: string;
  defaultVisibility: string;
  active: boolean;
  allowAutoPublish: boolean;
}

const request = async (path: string, options?: RequestInit) => {
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
  const data = text ? JSON.parse(text) : {};
  return { success: response.status < 300, data };
};

const qs = (params: Record<string, any>) => {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "" && v !== null);
  return entries.length ? `?${entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&")}` : "";
};

export const fetchCalendarEvents = (params: Record<string, any> = {}) =>
  request(`admin/calendar/events${qs(params)}`, { method: "GET" });

export const fetchCalendarEvent = (id: string) =>
  request(`admin/calendar/events/${id}`, { method: "GET" });

export const createCalendarEvent = (body: Partial<ICalendarEvent>) =>
  request(`admin/calendar/events`, { method: "POST", body: JSON.stringify(body) });

export const updateCalendarEvent = (id: string, body: Partial<ICalendarEvent>) =>
  request(`admin/calendar/events/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteCalendarEvent = (id: string) =>
  request(`admin/calendar/events/${id}`, { method: "DELETE" });

export const lifecycleCalendarEvent = (id: string, action: "publish" | "unpublish" | "cancel" | "duplicate") =>
  request(`admin/calendar/events/${id}/${action}`, { method: "POST" });

export const fetchCalendarTypes = () =>
  request(`admin/calendar/events/types`, { method: "GET" });

export const fetchCalendarDiagnostics = () =>
  request(`admin/calendar/events/diagnostics`, { method: "GET" });

// ── EPIC CAL-2: Digests (editorial market reviews) ──────────────────────
export interface IDigestMedia { label?: string; url: string; kind?: string; }
export interface ICalendarDigest {
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
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  periodStart?: string;
  periodEnd?: string;
  publishedAt?: string;
  media?: IDigestMedia[];
  aiGenerated?: boolean;
  aiModel?: string;
  aiProviderCostUsd?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const fetchDigests = (params: Record<string, any> = {}) =>
  request(`admin/calendar/digests${qs(params)}`, { method: "GET" });

export const createDigest = (body: Partial<ICalendarDigest>) =>
  request(`admin/calendar/digests`, { method: "POST", body: JSON.stringify(body) });

export const updateDigest = (id: string, body: Partial<ICalendarDigest>) =>
  request(`admin/calendar/digests/${id}`, { method: "PATCH", body: JSON.stringify(body) });

export const deleteDigest = (id: string) =>
  request(`admin/calendar/digests/${id}`, { method: "DELETE" });

export const lifecycleDigest = (id: string, action: "publish" | "unpublish" | "archive") =>
  request(`admin/calendar/digests/${id}/${action}`, { method: "POST" });

export const generateDigestDraft = (body: { period: string; instructions?: string }) =>
  request(`admin/calendar/digests/generate`, { method: "POST", body: JSON.stringify(body) });

export const generateWeeklyDigest = () =>
  request(`admin/calendar/digests/generate/weekly`, { method: "POST" });

// Multipart cover upload — returns { url } that can be stored as coverImage.
export const uploadDigestCover = async (file: File): Promise<{ success: boolean; url?: string }> => {
  const token = getAccessToken();
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(configureUrl(`admin/calendar/digests/cover`), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    credentials: "include",
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  return { success: response.status < 300, url: data?.url };
};
