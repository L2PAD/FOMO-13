import { API } from "../../config/api";
import getAuthToken from "../getAuthToken";

/**
 * Public (BUZZ) Calendar client.
 * Talks to the Unified Calendar public API (`/api/calendar/*`).
 * Read-only: only PUBLISHED + PUBLIC/AUTHENTICATED events are returned by the
 * backend. This is the SAME engine the CRM writes to — we never create a second
 * calendar backend here.
 */

export interface IPublicCalendarEvent {
  id: string;
  title: string;
  shortDescription?: string;
  description?: string;
  eventType?: string;
  category?: string;
  sourceType?: string;
  entityType?: string;
  entityId?: string;
  startAt: string;
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
  projectId?: string;
  projectName?: string;
  tokenSymbol?: string;
  unlockAmount?: number;
  unlockValueUsd?: number;
  unlockPercent?: number;
  sourceUrl?: string;
  relatedArticleId?: string;
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

const authHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export interface IPublicCalendarQuery {
  eventType?: string;
  category?: string;
  sourceType?: string;
  entityId?: string;
  search?: string;
  from?: string;
  to?: string;
}

export const fetchPublicCalendarEvents = async (
  query: IPublicCalendarQuery = {}
): Promise<IPublicCalendarEvent[]> => {
  try {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
    });
    const qs = params.toString();
    const res = await fetch(`${API}/calendar/events${qs ? `?${qs}` : ""}`, {
      method: "GET",
      headers: { ...authHeaders() },
    });
    const data = await res.json();
    return Array.isArray(data?.items) ? data.items : [];
  } catch (error) {
    console.error("fetchPublicCalendarEvents", error);
    return [];
  }
};

export const fetchPublicCalendarEvent = async (
  id: string
): Promise<IPublicCalendarEvent | null> => {
  try {
    const res = await fetch(`${API}/calendar/events/${id}`, {
      method: "GET",
      headers: { ...authHeaders() },
    });
    if (!res.ok) return null;
    return (await res.json()) as IPublicCalendarEvent;
  } catch (error) {
    console.error("fetchPublicCalendarEvent", error);
    return null;
  }
};

export const fetchCalendarTypes = async (): Promise<ICalendarType[]> => {
  try {
    const res = await fetch(`${API}/calendar/types`, { method: "GET" });
    const data = await res.json();
    return Array.isArray(data?.items) ? data.items : [];
  } catch (error) {
    console.error("fetchCalendarTypes", error);
    return [];
  }
};

export interface ICalendarDigest {
  period: "week" | "month";
  from: string;
  to: string;
  totalEvents: number;
  groups: Record<string, IPublicCalendarEvent[]>;
  byType: Record<string, number>;
  bySource: Record<string, number>;
  events: IPublicCalendarEvent[];
}

export const fetchPublicCalendarDigest = async (
  period: "week" | "month" = "week"
): Promise<ICalendarDigest | null> => {
  try {
    const res = await fetch(`${API}/calendar/digest?period=${period}`, {
      method: "GET",
      headers: { ...authHeaders() },
    });
    if (!res.ok) return null;
    return (await res.json()) as ICalendarDigest;
  } catch (error) {
    console.error("fetchPublicCalendarDigest", error);
    return null;
  }
};
