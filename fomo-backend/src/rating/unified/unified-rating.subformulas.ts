/**
 * Unified Rating Engine — CONFIG-DRIVEN sub-formula layer (Phase 1).
 *
 * Every Layer-2 sub-formula is now described by editable config
 * (`SubFormulasConfig`): sub-weights, caps, thresholds, penalties and
 * normalization rules. The functions here are generic evaluators that turn a
 * component's `ComponentFormula` + raw signals into an explainable result:
 *
 *     raw signals -> normalization (NormRule) -> weighted composite -> value
 *                 -> { value, sub[], completeness, missing }
 *
 * A component supplied as a plain number is treated as a MANUAL fallback
 * (source = "manual"). Scalar/list/fund blocks are always DERIVED from raw
 * data (no manual 70/100).
 */
import {
  ComponentFormula,
  CompositeResultShape,
  NormRule,
  SubBreakdown,
  SubMetricDef,
} from "./unified-rating.types";

/* ----------------------------- helpers ----------------------------- */

export const n = (v: any): number => {
  const p = Number(v);
  return Number.isFinite(p) ? p : 0;
};
export const present = (v: any): boolean =>
  v !== undefined && v !== null && v !== "";
export const r2 = (v: number): number =>
  Math.round((n(v) + Number.EPSILON) * 100) / 100;
export const clamp = (v: number, min = 0, max = 100): number =>
  Math.min(max, Math.max(min, n(v)));

/* ----------------------------- normalizers ----------------------------- */

export const linear = (v: any, max: number): number =>
  max <= 0 ? 0 : clamp((n(v) / max) * 100);
export const logn = (v: any, cap: number): number =>
  cap <= 1
    ? 0
    : clamp((Math.log10(1 + Math.max(0, n(v))) / Math.log10(1 + cap)) * 100);
export const ratioPct = (a: any, b: any): number =>
  n(b) > 0 ? clamp((n(a) / n(b)) * 100) : 0;
export const tiered = (v: any, table: { at: number; points: number }[]): number => {
  const sorted = [...(table || [])].sort((x, y) => x.at - y.at);
  let points = sorted.length ? sorted[0].points : 0;
  for (const step of sorted) if (n(v) >= step.at) points = step.points;
  return clamp(points);
};
export const recencyDecay = (days: any, halfLifeDays: number): number =>
  halfLifeDays <= 0 ? 0 : clamp(100 * Math.pow(0.5, Math.max(0, n(days)) / halfLifeDays));

/** Normalise a single raw signal to 0-100 according to a NormRule. */
export function normByRule(raw: any, rule: NormRule): number | undefined {
  if (!present(raw)) {
    // booleans may legitimately be `false`; treat that as present
    if (!(rule.type === "bool" && (raw === false || raw === 0))) return undefined;
  }
  switch (rule.type) {
    case "pct":
      return clamp(n(raw));
    case "linear":
      return linear(raw, rule.cap);
    case "log":
      return logn(raw, rule.cap);
    case "ratio": {
      const v = n(raw);
      return clamp(v <= 1 ? v * 100 : v);
    }
    case "recency":
      return recencyDecay(raw, rule.halfLifeDays);
    case "bool":
      return raw ? 100 : 0;
    case "tiered":
      return tiered(raw, rule.table);
    default:
      return undefined;
  }
}

/* ----------------------------- composite core ----------------------------- */

export type CompositeResult = CompositeResultShape;

type SubEntry = {
  key: string;
  weight: number;
  raw: number | undefined;
  normalized: number | undefined;
  penalty?: boolean;
};

/**
 * value = Σ(weight_i / Σweight_present × normalized_i) over PRESENT positive
 * subs, minus penalty subs. Missing subs lower completeness but do not zero.
 */
export function composite(entries: SubEntry[]): CompositeResult {
  const positives = entries.filter((e) => !e.penalty);
  const penalties = entries.filter((e) => e.penalty);
  const presentPos = positives.filter((e) => e.normalized !== undefined);
  const totalWeight = presentPos.reduce((sm, e) => sm + n(e.weight), 0);

  const sub: SubBreakdown[] = [];
  let core = 0;
  positives.forEach((e) => {
    const isPresent = e.normalized !== undefined;
    const effWeight = isPresent && totalWeight > 0 ? n(e.weight) / totalWeight : 0;
    const contribution = isPresent ? r2(effWeight * n(e.normalized)) : 0;
    core += contribution;
    sub.push({
      key: e.key,
      raw: isPresent ? r2(n(e.raw)) : 0,
      normalized: isPresent ? r2(n(e.normalized)) : 0,
      weight: r2(e.weight),
      contribution,
      present: isPresent,
    });
  });

  let penaltyTotal = 0;
  penalties.forEach((e) => {
    const isPresent = e.normalized !== undefined;
    const applied = isPresent ? r2((n(e.normalized) / 100) * n(e.weight)) : 0;
    penaltyTotal += applied;
    sub.push({
      key: e.key,
      raw: isPresent ? r2(n(e.raw)) : 0,
      normalized: isPresent ? r2(n(e.normalized)) : 0,
      weight: r2(e.weight),
      contribution: -applied,
      present: isPresent,
      penalty: true,
    });
  });

  const totalCount = entries.length;
  const presentCount = entries.filter((e) => e.normalized !== undefined).length;
  const missing = entries.filter((e) => e.normalized === undefined).map((e) => e.key);
  const value = presentPos.length === 0 ? undefined : clamp(core - penaltyTotal);
  return {
    value: value === undefined ? undefined : r2(value),
    sub,
    completeness: totalCount ? r2((presentCount / totalCount) * 100) : 100,
    missing,
  };
}

const MISSING = (keys: string[] = []): CompositeResult => ({
  value: undefined,
  sub: [],
  completeness: 0,
  missing: keys,
});

/* ----------------------------- kind evaluators ----------------------------- */

/** Weighted composite of sub-metrics; optional cap scales 0-100 to points. */
function evalWeighted(subs: SubMetricDef[], raw: any, cap?: number): CompositeResult {
  const obj = raw && typeof raw === "object" ? raw : {};
  const entries: SubEntry[] = (subs || []).map((sd) => {
    const rawVal = obj[sd.key];
    const norm = normByRule(rawVal, sd.norm);
    return {
      key: sd.key,
      weight: sd.weight,
      raw: present(rawVal) ? n(rawVal) : rawVal === false ? 0 : undefined,
      normalized: norm,
      penalty: !!sd.penalty,
    };
  });
  const c = composite(entries);
  if (cap !== undefined && c.value !== undefined) {
    return { ...c, value: r2((c.value / 100) * cap) };
  }
  return c;
}

/** Single raw signal normalised by a rule (log/tiered/linear); optional cap. */
function evalScalar(scalar: any, rule: NormRule, cap: number | undefined, key: string): CompositeResult {
  if (!present(scalar)) return MISSING([key]);
  const norm = normByRule(scalar, rule);
  if (norm === undefined) return MISSING([key]);
  const value = cap !== undefined ? (norm / 100) * cap : norm;
  return {
    value: r2(value),
    sub: [
      {
        key,
        raw: r2(n(scalar)),
        normalized: r2(norm),
        weight: cap ?? 100,
        contribution: r2(value),
        present: true,
      },
    ],
    completeness: 100,
    missing: [],
  };
}

/** Deal significance: Σ per-deal role points, capped. */
function evalDealQuality(cap: number, rolePoints: Record<string, number>, raw: any): CompositeResult {
  if (raw === undefined || raw === null) return MISSING(["majorDeals"]);
  if (!Array.isArray(raw)) {
    const cnt = n(raw);
    const pts = Math.min(cap, cnt * n(rolePoints.confirmed ?? 1));
    return {
      value: r2(pts),
      sub: [{ key: "confirmedDeals", raw: cnt, normalized: r2(pts), weight: cap, contribution: r2(pts), present: true }],
      completeness: 100,
      missing: [],
    };
  }
  let total = 0;
  const sub: SubBreakdown[] = [];
  raw.forEach((d: any, i: number) => {
    const role = String(d?.role || d?.significance || "confirmed");
    const p = rolePoints[role] ?? n(d?.points);
    total += p;
    sub.push({ key: `deal:${d?.project || role || i + 1}`, raw: p, normalized: p, weight: 1, contribution: p, present: true });
  });
  return { value: r2(Math.min(cap, total)), sub, completeness: 100, missing: [] };
}

/** Crisis resilience: mean of per-crisis behaviour composites, scaled to cap. */
function evalResilience(cap: number, crisisSubs: SubMetricDef[], fullConfidence: number, raw: any): CompositeResult {
  if (raw === undefined || raw === null) return MISSING(["resilience"]);
  if (!Array.isArray(raw)) {
    const cnt = n(raw);
    const pts = Math.min(cap, cnt * (cap / Math.max(1, fullConfidence)));
    return {
      value: r2(pts),
      sub: [{ key: "crisesSurvived", raw: cnt, normalized: r2(pts), weight: cap, contribution: r2(pts), present: true }],
      completeness: 100,
      missing: [],
    };
  }
  if (!raw.length) return MISSING(["resilience"]);
  const sub: SubBreakdown[] = [];
  let sum = 0;
  raw.forEach((cr: any, i: number) => {
    const inner = evalWeighted(crisisSubs, cr);
    const cScore = inner.value ?? 0;
    sum += cScore;
    sub.push({ key: `crisis:${cr?.name || i + 1}`, raw: r2(cScore), normalized: r2(cScore), weight: 1, contribution: r2(cScore), present: true });
  });
  const avg = sum / raw.length;
  return {
    value: r2((avg / 100) * cap),
    sub,
    completeness: r2(Math.min(100, (raw.length / Math.max(1, fullConfidence)) * 100)),
    missing: [],
  };
}

/** Compliance: jurisdiction points + transparency flag deltas, capped. */
function evalCompliance(
  cap: number,
  jurisdictionField: string,
  flags: { key: string; label: string; delta: number }[],
  raw: any
): CompositeResult {
  if (raw === undefined || raw === null) return MISSING(["compliance"]);
  if (typeof raw === "number") {
    return {
      value: r2(Math.min(cap, n(raw))),
      sub: [{ key: jurisdictionField, raw: n(raw), normalized: r2(Math.min(cap, n(raw))), weight: cap, contribution: r2(Math.min(cap, n(raw))), present: true }],
      completeness: 100,
      missing: [],
    };
  }
  const jp = present(raw[jurisdictionField]) ? n(raw[jurisdictionField]) : undefined;
  let base = jp ?? 0;
  const sub: SubBreakdown[] = [];
  if (jp !== undefined)
    sub.push({ key: jurisdictionField, raw: jp, normalized: jp, weight: cap, contribution: jp, present: true });
  (flags || []).forEach((f) => {
    if (!present(raw[f.key])) return;
    const applied = raw[f.key] ? f.delta : -Math.abs(f.delta);
    base += applied;
    sub.push({ key: f.key, raw: raw[f.key] ? 1 : 0, normalized: applied, weight: Math.abs(f.delta), contribution: applied, present: true });
  });
  return {
    value: r2(Math.max(0, Math.min(cap, base))),
    sub,
    completeness: jp === undefined ? 50 : 100,
    missing: jp === undefined ? [jurisdictionField] : [],
  };
}

/** Partnerships: Σ(rating × strength × recency × verification), normalised. */
function evalPartnerships(
  kindRatings: Record<string, number>,
  divisor: number,
  recencyHalfLifeDays: number,
  raw: any
): CompositeResult {
  if (raw === undefined || raw === null) return MISSING(["partnerships"]);
  if (!Array.isArray(raw)) {
    const cnt = n(raw);
    const v = linear(cnt, Math.max(1, divisor) * 2);
    return { value: r2(v), sub: [{ key: "partnersCount", raw: cnt, normalized: r2(v), weight: 100, contribution: r2(v), present: true }], completeness: 100, missing: [] };
  }
  if (!raw.length) return MISSING(["partnerships"]);
  let sum = 0;
  const sub: SubBreakdown[] = [];
  raw.forEach((p: any, i: number) => {
    const rating = present(p?.rating) ? n(p.rating) : kindRatings[String(p?.kind)] ?? 0.5;
    const strength = present(p?.strength) ? n(p.strength) : 1;
    const recency = present(p?.recencyDays) ? recencyDecay(p.recencyDays, recencyHalfLifeDays) / 100 : 1;
    const verification = p?.verified === false ? 0 : 1;
    const val = rating * strength * recency * verification;
    sum += val;
    sub.push({ key: `partner:${p?.name || p?.kind || i + 1}`, raw: r2(val), normalized: r2(val * 100), weight: 1, contribution: r2(val), present: true });
  });
  return { value: r2(clamp((sum / Math.max(1, divisor)) * 100)), sub, completeness: 100, missing: [] };
}

/** Weighted average of related entity scores (weighted by stake/role). */
function evalWeightedList(raw: any, key: string): CompositeResult {
  if (raw === undefined || raw === null) return MISSING([key]);
  if (!Array.isArray(raw)) {
    const v = clamp(n(raw));
    return { value: r2(v), sub: [{ key, raw: n(raw), normalized: r2(v), weight: 100, contribution: r2(v), present: true }], completeness: 100, missing: [] };
  }
  if (!raw.length) return MISSING([key]);
  let wSum = 0;
  let acc = 0;
  const sub: SubBreakdown[] = [];
  raw.forEach((it: any, i: number) => {
    const score = clamp(n(it?.score));
    const w = present(it?.weight) ? n(it.weight) : 1;
    wSum += w;
    acc += score * w;
    sub.push({ key: `${key}:${it?.name || i + 1}`, raw: r2(score), normalized: r2(score), weight: r2(w), contribution: r2((score * w) / 1), present: true });
  });
  const value = wSum > 0 ? acc / wSum : 0;
  sub.forEach((row) => (row.contribution = r2((n(row.normalized) * n(row.weight)) / (wSum || 1))));
  return { value: r2(clamp(value)), sub, completeness: 100, missing: [] };
}

/** Master dispatch: evaluate any component formula against its raw input. */
export function evalComponentFormula(formula: ComponentFormula, raw: any): CompositeResult {
  switch (formula.kind) {
    case "weighted":
      return evalWeighted(formula.subs, raw, formula.cap);
    case "scalar":
      return evalScalar(raw, formula.norm, formula.cap, formula.field);
    case "tiered":
      return evalScalar(raw, { type: "tiered", table: formula.table }, formula.cap, formula.field);
    case "dealQuality":
      return evalDealQuality(formula.cap, formula.rolePoints, raw);
    case "resilience":
      return evalResilience(formula.cap, formula.crisisSubs, formula.fullConfidenceCrises, raw);
    case "compliance":
      return evalCompliance(formula.cap, formula.jurisdictionField, formula.flags, raw);
    case "partnerships":
      return evalPartnerships(formula.kindRatings, formula.divisor, formula.recencyHalfLifeDays, raw);
    case "weightedList":
      return evalWeightedList(raw, "item");
    default:
      return MISSING();
  }
}

/* ----------------------------- resolveComponent ----------------------------- */

export type ResolvedComponent = {
  value: number | undefined;
  source: "manual" | "derived" | "missing";
  sub: SubBreakdown[];
  completeness: number;
  missing: string[];
};

/** number = MANUAL fallback; object/array = DERIVED via sub-formula. */
export function resolveComponent(
  input: any,
  evaluator: (raw: any) => CompositeResult
): ResolvedComponent {
  if (input === undefined || input === null || input === "")
    return { value: undefined, source: "missing", sub: [], completeness: 0, missing: [] };
  if (typeof input === "number")
    return { value: clamp(input), source: "manual", sub: [], completeness: 100, missing: [] };
  const c = evaluator(input);
  return {
    value: c.value,
    source: c.value === undefined ? "missing" : "derived",
    sub: c.sub,
    completeness: c.completeness,
    missing: c.missing,
  };
}

/** Always-derived components (scalars, lists, fund blocks) — no manual branch. */
export function derivedComponent(c: CompositeResult): ResolvedComponent {
  return {
    value: c.value,
    source: c.value === undefined ? "missing" : "derived",
    sub: c.sub,
    completeness: c.completeness,
    missing: c.missing,
  };
}

/* ================================================================== */
/*  PLATFORM USER sub-formulas (Phase 3 — kept as-is for now)          */
/* ================================================================== */

const sPlain = (key: string, weight: number, raw: any, normalized: number | undefined, penalty = false): SubEntry => ({
  key,
  weight,
  raw: present(raw) ? n(raw) : undefined,
  normalized: present(raw) ? normalized : undefined,
  penalty,
});

export function platformEngagement(raw: any): CompositeResult {
  const d = raw || {};
  return composite([
    sPlain("activeDays", 35, d.activeDays, present(d.activeDays) ? linear(d.activeDays, 30) : undefined),
    sPlain("meaningfulSessions", 25, d.meaningfulSessions, present(d.meaningfulSessions) ? linear(d.meaningfulSessions, 60) : undefined),
    sPlain("entityConsumption", 15, d.entityConsumption, present(d.entityConsumption) ? linear(d.entityConsumption, 100) : undefined),
    sPlain("returnFrequency", 15, d.returnFrequency, present(d.returnFrequency) ? clamp(n(d.returnFrequency) <= 1 ? n(d.returnFrequency) * 100 : n(d.returnFrequency)) : undefined),
    sPlain("savedFollowed", 10, d.savedFollowed, present(d.savedFollowed) ? linear(d.savedFollowed, 50) : undefined),
  ]);
}
/** Content Interaction — comments/reactions/shares/saves/discussions (anti-farming). */
export function platformContentInteraction(raw: any): CompositeResult {
  const d = raw || {};
  return composite([
    sPlain("validComments", 25, d.validComments, present(d.validComments) ? linear(d.validComments, 40) : undefined),
    sPlain("reactions", 20, d.reactions, present(d.reactions) ? linear(d.reactions, 100) : undefined),
    sPlain("shares", 20, d.shares, present(d.shares) ? linear(d.shares, 30) : undefined),
    sPlain("saves", 15, d.saves, present(d.saves) ? linear(d.saves, 50) : undefined),
    sPlain("discussions", 20, d.discussions, present(d.discussions) ? linear(d.discussions, 20) : undefined),
    // anti-farming: self/deleted/spam actions subtract
    sPlain("farmingPenalty", 25, d.farmingRatio, present(d.farmingRatio) ? clamp(n(d.farmingRatio) <= 1 ? n(d.farmingRatio) * 100 : n(d.farmingRatio)) : undefined, true),
  ]);
}
/** Meaningful Contribution — reports/data fixes/verified sources/moderation/feedback. */
export function platformMeaningfulContribution(raw: any): CompositeResult {
  const d = raw || {};
  return composite([
    sPlain("usefulReports", 30, d.usefulReports, present(d.usefulReports) ? linear(d.usefulReports, 15) : undefined),
    sPlain("dataCorrections", 25, d.dataCorrections, present(d.dataCorrections) ? linear(d.dataCorrections, 15) : undefined),
    sPlain("verifiedSources", 20, d.verifiedSources, present(d.verifiedSources) ? linear(d.verifiedSources, 10) : undefined),
    sPlain("moderatedContributions", 15, d.moderatedContributions, present(d.moderatedContributions) ? linear(d.moderatedContributions, 10) : undefined),
    sPlain("acceptedFeedback", 10, d.acceptedFeedback, present(d.acceptedFeedback) ? linear(d.acceptedFeedback, 10) : undefined),
  ]);
}
export function platformContributionQuality(raw: any): CompositeResult {
  const d = raw || {};
  return composite([
    sPlain("acceptedContributions", 50, d.acceptedContributions, present(d.acceptedContributions) ? linear(d.acceptedContributions, 20) : undefined),
    sPlain("qualityCoefficient", 30, d.qualityCoefficient, present(d.qualityCoefficient) ? clamp(n(d.qualityCoefficient) <= 1 ? n(d.qualityCoefficient) * 100 : n(d.qualityCoefficient)) : undefined),
    sPlain("communityFeedback", 20, d.communityFeedback, present(d.communityFeedback) ? clamp(n(d.communityFeedback)) : undefined),
  ]);
}
export function platformEarlyland(raw: any): CompositeResult {
  const d = raw || {};
  if (Array.isArray(d.tasks)) {
    let sum = 0;
    const sub: SubBreakdown[] = [];
    d.tasks.forEach((t: any, i: number) => {
      const val = n(t?.difficulty ?? 1) * n(t?.verification ?? 1) * n(t?.importance ?? 1) * n(t?.quality ?? 1);
      sum += val;
      sub.push({ key: `task:${t?.name || i + 1}`, raw: r2(val), normalized: r2(val), weight: 1, contribution: r2(val), present: true });
    });
    return { value: r2(clamp(linear(sum, 100))), sub, completeness: 100, missing: [] };
  }
  if (!present(d.taskPoints) && !present(raw)) return MISSING(["earlyland"]);
  const points = n(d.taskPoints ?? raw);
  return { value: r2(clamp(linear(points, 100))), sub: [{ key: "taskPoints", raw: points, normalized: r2(linear(points, 100)), weight: 100, contribution: r2(linear(points, 100)), present: true }], completeness: 100, missing: [] };
}
export function platformNft(raw: any): CompositeResult {
  const d = raw || {};
  const boolPct = (v: any) => (present(v) ? (v ? 100 : 0) : undefined);
  return composite([
    sPlain("ownership", 30, d.owns, boolPct(d.owns)),
    sPlain("holdingDuration", 30, d.holdingMonths, present(d.holdingMonths) ? linear(d.holdingMonths, 24) : undefined),
    sPlain("tier", 25, d.tier, present(d.tier) ? linear(d.tier, 4) : undefined),
    sPlain("activeUse", 15, d.activeUse, present(d.activeUse) ? clamp(n(d.activeUse)) : undefined),
  ]);
}
export function platformReferrals(raw: any): CompositeResult {
  const d = raw || {};
  return composite([
    sPlain("activeL1", 70, d.activeL1, present(d.activeL1) ? linear(d.activeL1, 20) : undefined),
    sPlain("activeL2", 15, d.activeL2, present(d.activeL2) ? linear(d.activeL2, 40) : undefined),
    sPlain("retention", 15, d.retention, present(d.retention) ? clamp(n(d.retention) <= 1 ? n(d.retention) * 100 : n(d.retention)) : undefined),
  ]);
}
