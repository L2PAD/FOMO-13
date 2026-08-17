export const RATING_ENTITY_TYPES = ["projects", "backers", "users"] as const;

export type RatingEntityType = (typeof RATING_ENTITY_TYPES)[number];
export type RatingRunTrigger = "manual" | "schedule";
export type RatingRunState = "idle" | "running" | "completed" | "failed";

export type RatingScheduleConfig = {
  enabled: boolean;
  cron: string;
  timezone: string;
};

/**
 * Formula values are deliberately limited to known scoring output keys.
 * Component and penalty values are multipliers: 1 keeps the built-in formula,
 * 0 disables that term, and 2 doubles its contribution/deduction.
 */
export type RatingFormulaModeConfig = {
  componentWeights: Record<string, number>;
  fullnessComponentWeights: Record<string, number>;
  penaltyMultipliers: Record<string, number>;
  capValues: Record<string, number>;
  minScore: number;
  maxScore: number;
  preserveDefaultCaps: boolean;
};

export type RatingEntityConfig = {
  enabled: boolean;
  batchSize: number;
  schedule: RatingScheduleConfig;
  formula: {
    modes: Record<string, RatingFormulaModeConfig>;
  };
};

export type RatingEntitiesConfig = Record<RatingEntityType, RatingEntityConfig>;

export type RatingRunResult = {
  scanned: number;
  updated: number;
  errors: number;
  durationMs: number;
};

export type RatingRuntimeState = {
  state: RatingRunState;
  running: boolean;
  runId: string | null;
  trigger: RatingRunTrigger | null;
  configVersion: number | null;
  fence: number;
  startedAt: Date | null;
  heartbeatAt: Date | null;
  leaseExpiresAt: Date | null;
  finishedAt: Date | null;
  lastRunAt: Date | null;
  lastResult: RatingRunResult | null;
  lastError: string | null;
};

export type RatingStatusEntity = RatingRuntimeState & {
  nextRunAt: Date | null;
};

export type RatingFormulaCatalogMode = {
  components: string[];
  fullnessComponents: string[];
  penalties: string[];
  caps: string[];
};

export type RatingFormulaCatalog = Record<
  RatingEntityType,
  Record<string, RatingFormulaCatalogMode>
>;
