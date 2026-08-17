export const NEWS_AI_QUEUE = "news-ai-gen";
export const NEWS_AI_JOBS = {
  GENERATE: "generate-story",
} as const;

export interface NewsAiGenerateJob {
  fingerprint: string;
  sourceArticleIds: string[];
}

// Moderation lifecycle (BUILD — donor had no explicit lifecycle; states per product spec)
export const MODERATION = {
  DRAFT: "DRAFT",
  AI_READY: "AI_READY",
  NEEDS_REVIEW: "NEEDS_REVIEW",
  APPROVED: "APPROVED",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
  REJECTED: "REJECTED",
} as const;

// Generation execution status (queue lifecycle)
export const GEN = {
  QUEUED: "QUEUED",
  PROCESSING: "PROCESSING",
  GENERATED: "GENERATED",
  FAILED_RETRYABLE: "FAILED_RETRYABLE",
  PENDING_BUDGET: "PENDING_BUDGET",
} as const;

export const DEFAULT_SETTINGS = {
  _id: "global",
  enabled: false, // scheduler off by default; manual/queue enqueue always allowed
  intervalMinutes: 30,
  maxStoriesPerRun: 3,
  minSources: 1,
  concurrency: 2,
  windowLimit: 150,
  modelClass: "FAST", // policy; gateway resolves gpt-4.1-mini
  autoReview: true, // AI_READY -> NEEDS_REVIEW automatically (manual review policy)
  budget: {
    dailyCogsLimitUsd: 5,
    monthlyCogsLimitUsd: 100,
    maxGenerationsPerDay: 200,
    warningThresholdPct: 80,
  },
};
