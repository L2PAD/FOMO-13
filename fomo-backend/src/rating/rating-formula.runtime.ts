import { buildDefaultRatingEntitiesConfig } from "./rating.defaults";
import {
  ConfigurableScoreResult,
  RatingFormulaService,
} from "./rating-formula.service";
import {
  RatingEntitiesConfig,
  RatingEntityType,
  RatingFormulaModeConfig,
} from "./rating.types";

export type RatingFormulaRuntimeSnapshot = {
  version: number;
  updatedAt: Date | null;
  entities: RatingEntitiesConfig;
};

type RatingConfigDatabase = {
  collection(name: string): {
    findOne(filter: Record<string, unknown>): Promise<any>;
  };
};

const formulaService = new RatingFormulaService();
let snapshot: RatingFormulaRuntimeSnapshot = {
  version: 1,
  updatedAt: null,
  entities: buildDefaultRatingEntitiesConfig(),
};

export function setRatingFormulaRuntime(
  next: RatingFormulaRuntimeSnapshot
): void {
  snapshot = buildRatingFormulaRuntimeSnapshot(next);
}

/**
 * Loads the persisted singleton without bootstrapping Nest. This keeps legacy
 * CLI recalculation scripts on the same formula revision as application
 * writers. A missing or partial singleton safely falls back to built-in
 * defaults; database read failures still propagate so write scripts cannot
 * silently calculate with an unintended formula.
 */
export async function loadRatingFormulaRuntimeFromMongo(
  database: RatingConfigDatabase
): Promise<RatingFormulaRuntimeSnapshot> {
  if (!database || typeof database.collection !== "function") {
    throw new Error("Mongo database is required to load rating formula config");
  }

  const document = await database
    .collection("rating_configs")
    .findOne({ _id: "global" });
  const next = buildRatingFormulaRuntimeSnapshot(document);
  snapshot = next;
  return next;
}

export function buildRatingFormulaRuntimeSnapshot(
  value: any
): RatingFormulaRuntimeSnapshot {
  const defaults = buildDefaultRatingEntitiesConfig();
  const entities = Object.fromEntries(
    (Object.keys(defaults) as RatingEntityType[]).map((entityType) => [
      entityType,
      mergeEntity(defaults[entityType], value?.entities?.[entityType]),
    ])
  ) as RatingEntitiesConfig;

  return {
    version: positiveInteger(value?.version, 1),
    updatedAt: validDate(
      value?.settingsUpdatedAt ?? value?.updatedAt ?? value?.createdAt
    ),
    entities,
  };
}

export function applyRuntimeRatingFormula(
  entityType: RatingEntityType,
  mode: string,
  breakdown: ConfigurableScoreResult
): ConfigurableScoreResult {
  return formulaService.applyRating(
    breakdown,
    runtimeMode(entityType, mode),
    runtimeAudit()
  );
}

export function applyRuntimeFullnessFormula(
  entityType: RatingEntityType,
  mode: string,
  breakdown: ConfigurableScoreResult
): ConfigurableScoreResult {
  return formulaService.applyFullness(
    breakdown,
    runtimeMode(entityType, mode),
    runtimeAudit()
  );
}

function runtimeMode(
  entityType: RatingEntityType,
  mode: string
): RatingFormulaModeConfig {
  return (
    snapshot.entities?.[entityType]?.formula?.modes?.[mode] ||
    buildDefaultRatingEntitiesConfig()[entityType].formula.modes[mode]
  );
}

function runtimeAudit(): Record<string, any> {
  return {
    ratingConfigVersion: snapshot.version,
    ratingConfigUpdatedAt: snapshot.updatedAt,
    ratingConfigSource: "runtime-cache",
  };
}

function mergeEntity(defaults: any, value: any): any {
  const source = plainObject(value);
  const schedule = plainObject(source.schedule);
  const sourceModes = plainObject(plainObject(source.formula).modes);
  const modes = Object.fromEntries(
    Object.entries(defaults.formula.modes).map(([mode, modeDefaults]) => [
      mode,
      mergeMode(modeDefaults as RatingFormulaModeConfig, sourceModes[mode]),
    ])
  );

  return {
    enabled:
      typeof source.enabled === "boolean" ? source.enabled : defaults.enabled,
    batchSize: boundedInteger(source.batchSize, defaults.batchSize, 10, 2000),
    schedule: {
      enabled:
        typeof schedule.enabled === "boolean"
          ? schedule.enabled
          : defaults.schedule.enabled,
      cron: nonEmptyString(schedule.cron, defaults.schedule.cron),
      timezone: nonEmptyString(schedule.timezone, defaults.schedule.timezone),
    },
    formula: { modes },
  };
}

function mergeMode(
  defaults: RatingFormulaModeConfig,
  value: any
): RatingFormulaModeConfig {
  const source = plainObject(value);
  let minScore = boundedNumber(source.minScore, defaults.minScore, 0, 100);
  let maxScore = boundedNumber(source.maxScore, defaults.maxScore, 0, 100);
  if (minScore >= maxScore) {
    minScore = defaults.minScore;
    maxScore = defaults.maxScore;
  }

  return {
    componentWeights: mergeNumericRecord(
      defaults.componentWeights,
      source.componentWeights,
      0,
      10
    ),
    fullnessComponentWeights: mergeNumericRecord(
      defaults.fullnessComponentWeights,
      source.fullnessComponentWeights,
      0,
      10
    ),
    penaltyMultipliers: mergeNumericRecord(
      defaults.penaltyMultipliers,
      source.penaltyMultipliers,
      0,
      10
    ),
    capValues: mergeNumericRecord(defaults.capValues, source.capValues, 0, 100),
    minScore,
    maxScore,
    preserveDefaultCaps:
      typeof source.preserveDefaultCaps === "boolean"
        ? source.preserveDefaultCaps
        : defaults.preserveDefaultCaps,
  };
}

function mergeNumericRecord(
  defaults: Record<string, number>,
  value: any,
  min: number,
  max: number
): Record<string, number> {
  const source = plainObject(value);
  return Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [
      key,
      boundedNumber(source[key], fallback, min, max),
    ])
  );
}

function plainObject(value: any): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function boundedNumber(
  value: any,
  fallback: number,
  min: number,
  max: number
): number {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= min &&
    value <= max
    ? value
    : fallback;
}

function boundedInteger(
  value: any,
  fallback: number,
  min: number,
  max: number
): number {
  return Number.isInteger(value) && value >= min && value <= max
    ? value
    : fallback;
}

function positiveInteger(value: any, fallback: number): number {
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function nonEmptyString(value: any, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function validDate(value: any): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
