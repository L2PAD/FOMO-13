import { API } from "../config/api";

/**
 * Lightweight client analytics tracker.
 * - Persists anonymousId (localStorage) + sessionId (sessionStorage).
 * - Sends batched raw events + heartbeats. Heartbeat only counts ACTIVE time:
 *   visible tab AND user not idle. Raw events are NOT XP.
 */

const ANON_KEY = "fomo_anon_id";
const SESSION_KEY = "fomo_session_id";
const HEARTBEAT_MS = 15000;
const IDLE_THRESHOLD_MS = 60000;

type TEvent = {
  eventType: string;
  page?: string;
  occurredAt?: string;
  metadata?: Record<string, any>;
};

let initialized = false;
let sessionId = "";
let anonymousId = "";
let userId: string | null = null;
let queue: TEvent[] = [];
let lastActivityAt = Date.now();
let lastHeartbeatAt = Date.now();
let heartbeatTimer: any = null;

const uuid = (): string => {
  try {
    if (typeof crypto !== "undefined" && (crypto as any).randomUUID) {
      return (crypto as any).randomUUID();
    }
  } catch (_) {}
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const getPage = (): string =>
  typeof window !== "undefined" ? window.location.pathname : "";

const post = (path: string, body: any, beacon = false) => {
  try {
    const url = `${API}/analytics/${path}`;
    const payload = JSON.stringify(body);
    if (beacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
      return;
    }
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: beacon,
    }).catch(() => {});
  } catch (_) {}
};

const markActivity = () => {
  lastActivityAt = Date.now();
};

const flush = (extraEvents: TEvent[] = [], activeMsDelta = 0) => {
  const events = [...queue, ...extraEvents];
  queue = [];
  if (events.length === 0 && activeMsDelta === 0) return;
  post("track", {
    sessionId,
    anonymousId,
    userId,
    referrer: typeof document !== "undefined" ? document.referrer : "",
    events: activeMsDelta
      ? [...events, { eventType: "session_heartbeat", activeMsDelta }]
      : events,
  });
};

const heartbeat = () => {
  if (typeof document === "undefined") return;
  const now = Date.now();
  const visible = document.visibilityState === "visible";
  const idle = now - lastActivityAt > IDLE_THRESHOLD_MS;
  let activeDelta = 0;
  if (visible && !idle) {
    activeDelta = Math.min(HEARTBEAT_MS, now - lastHeartbeatAt);
  }
  lastHeartbeatAt = now;
  flush([], activeDelta);
};

/** Queue an analytics event (batched, flushed on next heartbeat). */
export const trackEvent = (eventType: string, metadata?: Record<string, any>) => {
  if (typeof window === "undefined") return;
  markActivity();
  queue.push({ eventType, page: getPage(), occurredAt: new Date().toISOString(), metadata });
  if (queue.length >= 10) flush();
};

/** Track a page view (call on route change). */
export const trackPageView = (page?: string) => {
  if (typeof window === "undefined") return;
  markActivity();
  queue.push({ eventType: "page_view", page: page || getPage(), occurredAt: new Date().toISOString() });
  flush();
};

/** Link the anonymous session to an authenticated user. */
export const identifyUser = (uid?: string | null) => {
  if (typeof window === "undefined" || !uid || uid === userId) return;
  userId = String(uid);
  post("identify", { sessionId, userId, anonymousId });
};

/** Initialize the tracker once on the client. */
export const initAnalytics = () => {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  try {
    anonymousId = localStorage.getItem(ANON_KEY) || "";
    if (!anonymousId) {
      anonymousId = uuid();
      localStorage.setItem(ANON_KEY, anonymousId);
    }
    sessionId = sessionStorage.getItem(SESSION_KEY) || "";
    if (!sessionId) {
      sessionId = uuid();
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
  } catch (_) {
    anonymousId = anonymousId || uuid();
    sessionId = sessionId || uuid();
  }

  post("session/start", {
    sessionId,
    anonymousId,
    referrer: typeof document !== "undefined" ? document.referrer : "",
  });

  ["mousemove", "keydown", "scroll", "click", "touchstart"].forEach((evt) =>
    window.addEventListener(evt, markActivity, { passive: true })
  );

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flush();
    } else {
      lastHeartbeatAt = Date.now();
      markActivity();
    }
  });

  window.addEventListener("beforeunload", () => {
    post("session/end", { sessionId, activeMsDelta: 0 }, true);
    flush();
  });

  trackPageView();
  heartbeatTimer = setInterval(heartbeat, HEARTBEAT_MS);
};

export const stopAnalytics = () => {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = null;
  initialized = false;
};
