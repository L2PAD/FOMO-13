/**
 * Data provenance + freshness. Every rating component carries WHERE its number
 * came from and HOW trustworthy it is, so nobody confuses a demo/mock score
 * with a real derived one.
 */
import { RatingEntityType } from "./rating-raw-dto";

export type DataMode = "derived" | "manual" | "mock" | "missing" | "stale";

export interface ProvenanceField {
  key: string;
  mode: DataMode;
  source: string | null;
  observedAt: string | null;
  ageDays: number | null;
  ttlDays: number | null;
  stale: boolean;
  confidence: number; // 0..1
}

export interface EntityProvenance {
  entityType: RatingEntityType | string;
  source: string | null;
  observedAt: string | null;
  mode: DataMode; // overall
  completeness: number; // 0..100
  freshness: number; // 0..100
  missingFields: string[];
  components: Record<string, ProvenanceField>;
}

/** Default freshness TTL (days) per entity — how long a signal stays "fresh". */
export const FRESHNESS_TTL_DAYS: Record<string, number> = {
  twitter: 7,
  funds: 90,
  persons: 60,
  projects: 30,
  users: 14,
  trade: 30,
};

/** Classify a source string into a base data mode. */
export function modeForSource(source: string | undefined | null): DataMode {
  const s = String(source || "").toLowerCase();
  if (!s) return "manual";
  if (s.includes("mock")) return "mock";
  if (s === "admin-preview" || s === "manual" || s.includes("preview")) return "manual";
  return "derived";
}

export function ageDaysFrom(observedAt?: string | null): number | null {
  if (!observedAt) return null;
  const t = Date.parse(observedAt);
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24)));
}

/** Build per-component provenance from the engine's component sources. */
export function buildProvenance(
  entityType: string,
  source: string | undefined,
  observedAt: string | undefined,
  componentSources: Record<string, "derived" | "manual" | "missing">,
  completeness: number,
  missingFields: string[]
): EntityProvenance {
  const baseMode = modeForSource(source);
  const ttlDays = FRESHNESS_TTL_DAYS[entityType] ?? 30;
  const ageDays = ageDaysFrom(observedAt);
  const stale = ageDays !== null && ageDays > ttlDays;

  const components: Record<string, ProvenanceField> = {};
  for (const [key, csource] of Object.entries(componentSources || {})) {
    let mode: DataMode;
    if (csource === "missing") mode = "missing";
    else if (baseMode === "mock") mode = "mock";
    else if (baseMode === "manual" || csource === "manual") mode = "manual";
    else mode = stale ? "stale" : "derived";
    components[key] = {
      key,
      mode,
      source: csource === "missing" ? null : source ?? null,
      observedAt: observedAt ?? null,
      ageDays,
      ttlDays,
      stale: mode === "stale",
      confidence: csource === "missing" ? 0 : Math.max(0, Math.min(1, completeness / 100)),
    };
  }

  const freshness =
    ageDays === null ? (baseMode === "mock" || baseMode === "manual" ? 100 : 50) : Math.max(0, Math.round(100 * (1 - Math.min(1, ageDays / (ttlDays * 2)))));

  let overall: DataMode = baseMode;
  const modes = Object.values(components).map((c) => c.mode);
  if (modes.length && modes.every((m) => m === "missing")) overall = "missing";
  else if (baseMode === "derived" && stale) overall = "stale";

  return {
    entityType,
    source: source ?? null,
    observedAt: observedAt ?? null,
    mode: overall,
    completeness: Math.round(completeness),
    freshness,
    missingFields: missingFields || [],
    components,
  };
}
