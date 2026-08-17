// EPIC NEWS-1 — Parser runtime constants.
export const NEWS_PARSER_QUEUE = "news-parser";

export const NEWS_PARSER_JOBS = {
  POLL_SOURCE: "poll-source",
} as const;

export interface NewsPollJobPayload {
  sourceId: string;
  trigger: "manual" | "schedule";
  limit?: number;
  requestedBy?: string;
}

export const NEWS_PARSER_DEFAULTS = {
  timeoutMs: 30000,
  maxRetries: 2,
  limit: 30,
  // Staggered tier polling (minutes) — P2.
  tierIntervalMinutes: { A: 15, B: 30, C: 60 } as Record<string, number>,
  circuitBreakerThreshold: 5, // P7 consecutive failures -> ERROR
};

export function schedulerEnabled(): boolean {
  return String(process.env.NEWS_PARSER_SCHEDULER_ENABLED || "true") !== "false";
}

export function workerEnabled(): boolean {
  return String(process.env.NEWS_PARSER_WORKER_ENABLED || "true") !== "false";
}
