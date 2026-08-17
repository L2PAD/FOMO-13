/**
 * Unified Rating Engine v2 — pure calculation functions.
 *
 * Deterministic and side-effect free so they can be unit tested and reused by
 * the preview endpoint and the recalculation worker. Every function returns the
 * standard {score, level, formulaVersion, calculatedAt, completeness,
 * components, penalties, missingFields} contract.
 */
import {
  CategoryBand,
  ComponentBreakdown,
  FundConfig,
  FundInput,
  PersonInput,
  PlatformActivityConfig,
  PlatformActivityInput,
  ProjectConfig,
  ProjectInput,
  ScorePenalty,
  ThresholdStep,
  TradeConfig,
  TradeDirectionConfig,
  TradeDirectionInput,
  TwitterConfig,
  TwitterInput,
  UNIFIED_FORMULA_VERSION,
  UnifiedRatingConfig,
  UnifiedScoreResult,
  UserConfig,
  UserInput,
  WeightedConfig,
} from "./unified-rating.types";
import {
  CompositeResult,
  ResolvedComponent,
  resolveComponent,
  derivedComponent,
  evalComponentFormula,
  platformEngagement,
  platformContentInteraction,
  platformMeaningfulContribution,
  platformContributionQuality,
  platformEarlyland,
  platformNft,
  platformReferrals,
} from "./unified-rating.subformulas";
import {
  ComponentFormula,
  SubFormulasConfig,
} from "./unified-rating.types";
import { buildDefaultSubFormulas } from "./unified-rating.subformulas.defaults";

const DEFAULT_SF = buildDefaultSubFormulas();
const sfFor = (
  sf: SubFormulasConfig | undefined,
  entity: keyof SubFormulasConfig,
  key: string
): ComponentFormula | undefined =>
  (sf || DEFAULT_SF)?.[entity]?.[key] || DEFAULT_SF[entity]?.[key];

/* ----------------------------- helpers ----------------------------- */

const num = (value: any): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const isPresent = (value: any): boolean =>
  value !== undefined && value !== null && value !== "";

export const round2 = (value: number): number =>
  Math.round((num(value) + Number.EPSILON) * 100) / 100;

export const clamp = (value: number, min = 0, max = 100): number =>
  Math.min(max, Math.max(min, num(value)));

const normalize = (value: number, max: number): number =>
  max <= 0 ? 0 : clamp((num(value) / max) * 100, 0, 100);

/**
 * Logarithmic normalization for heavy-tailed counts (e.g. Twitter followers):
 * 500k followers must NOT score 500x a 1k account. `cap` is the value that maps to 100.
 */
export const logNormalize = (value: number, cap: number): number =>
  cap <= 1
    ? 0
    : clamp(
        (Math.log10(1 + Math.max(0, num(value))) / Math.log10(1 + cap)) * 100,
        0,
        100
      );

export const levelFor = (score: number, bands: CategoryBand[]): string => {
  const match = bands.find(
    (band) => score >= band.min && score <= band.max
  );
  if (match) return match.label;
  return bands.length ? bands[bands.length - 1].label : "";
};

/** Highest step whose `at` is <= value; 0 when none matched. */
const thresholdPoints = (value: number, steps: ThresholdStep[]): number => {
  const sorted = [...steps].sort((a, b) => a.at - b.at);
  let points = 0;
  for (const step of sorted) {
    if (num(value) >= step.at) points = step.points;
  }
  return points;
};

const nowIso = (): string => new Date().toISOString();

const completenessOf = (
  fields: string[],
  present: Record<string, boolean>
): { completeness: number; missingFields: string[] } => {
  const missingFields = fields.filter((field) => !present[field]);
  const known = fields.length - missingFields.length;
  const completeness = fields.length
    ? round2((known / fields.length) * 100)
    : 100;
  return { completeness, missingFields };
};

/* ----------------------------- twitter ----------------------------- */

export function calculateTwitterScore(
  input: TwitterInput | number | undefined,
  config: TwitterConfig,
  sf?: SubFormulasConfig
): UnifiedScoreResult {
  const calculatedAt = nowIso();

  // Precomputed score short-circuit (used when a person/project stores a value).
  if (typeof input === "number") {
    const score = clamp(input);
    return {
      score: round2(score),
      level: levelFor(score, config.categories),
      formulaVersion: UNIFIED_FORMULA_VERSION,
      calculatedAt,
      completeness: 100,
      components: {},
      penalties: [],
      missingFields: [],
    };
  }

  const data = input || {};
  const F = (key: string) => sfFor(sf, "twitter", key) as ComponentFormula;

  // Followers — scalar over the raw count (log scale via config).
  const followersResolved = derivedComponent(
    evalComponentFormula(F("followers"), data.followers)
  );

  // Engagement — rich object OR a single engagement-rate number.
  let engagementInput: any = data.engagement;
  if (
    (engagementInput === undefined || engagementInput === null) &&
    isPresent(data.engagementRate)
  ) {
    engagementInput = { medianEngagementRate: num(data.engagementRate) };
  }

  const resolved: Record<string, ResolvedComponent> = {
    followers: followersResolved,
    quality: resolveComponent(data.followerQuality, (raw) =>
      evalComponentFormula(F("quality"), raw)
    ),
    engagement: resolveComponent(engagementInput, (raw) =>
      evalComponentFormula(F("engagement"), raw)
    ),
    frequency: resolveComponent(data.postingFrequency, (raw) =>
      evalComponentFormula(F("frequency"), raw)
    ),
    reputation: resolveComponent(data.reputation, (raw) =>
      evalComponentFormula(F("reputation"), raw)
    ),
    cryptoInfluence: resolveComponent(data.cryptoInfluence, (raw) =>
      evalComponentFormula(F("cryptoInfluence"), raw)
    ),
    tier1Audience: resolveComponent(data.tier1Audience, (raw) =>
      evalComponentFormula(F("tier1Audience"), raw)
    ),
  };

  const result = combineWeighted(resolved, {
    enabled: config.enabled,
    weights: config.weights,
    categories: config.categories,
  });
  const score = clamp(result.score);

  return {
    score: round2(score),
    level: levelFor(score, config.categories),
    formulaVersion: UNIFIED_FORMULA_VERSION,
    calculatedAt,
    completeness: result.completeness,
    components: result.components,
    penalties: [],
    missingFields: result.missingFields,
  };
}

/* ------------------------------ fund ------------------------------- */

export function calculateFundScore(
  input: FundInput,
  config: FundConfig,
  sf?: SubFormulasConfig
): UnifiedScoreResult {
  const data = input || {};
  const { limits } = config;
  const F = (key: string) => sfFor(sf, "funds", key) as ComponentFormula;

  const exitsInput =
    data.exits !== undefined && data.exits !== null
      ? data.exits
      : isPresent(data.successfulExits)
      ? { successfulCount: num(data.successfulExits), successRatio: 1 }
      : undefined;
  const roiInput =
    data.roi !== undefined && data.roi !== null
      ? data.roi
      : isPresent(data.avgRoiMultiple)
      ? { medianRoi: num(data.avgRoiMultiple) }
      : undefined;
  const resilienceInput =
    data.crises !== undefined && data.crises !== null
      ? data.crises
      : data.crisesSurvived;
  const complianceInput =
    data.compliance !== undefined && data.compliance !== null
      ? data.compliance
      : data.complianceScore;

  // Resilience from weighted crisis criteria when signals + criteria exist.
  const activeCriteria = (config.resilienceCriteria || []).filter(
    (c) => c && c.enabled && Number(c.weight) > 0
  );
  const signals = data.resilienceSignals;
  const useCriteria =
    activeCriteria.length > 0 &&
    signals &&
    typeof signals === "object" &&
    Object.keys(signals).length > 0;
  let resilienceComposite: CompositeResult;
  if (useCriteria) {
    const totalW = activeCriteria.reduce((s, c) => s + Number(c.weight), 0) || 1;
    let val = 0;
    const sub = activeCriteria.map((c) => {
      const achieved = clamp(num((signals as any)[c.key]), 0, 1);
      const wNorm = Number(c.weight) / totalW;
      const contribution = round2(wNorm * achieved * 100);
      val += contribution;
      return {
        key: c.key,
        label: c.label,
        raw: achieved,
        weight: round2(wNorm),
        value: contribution,
      } as any;
    });
    resilienceComposite = { value: round2(val), sub } as CompositeResult;
  } else {
    resilienceComposite = evalComponentFormula(F("resilience"), resilienceInput);
  }

  // Every fund block is DERIVED from raw signals (no manual 70/100).
  const blocks: Record<string, { res: CompositeResult; limit: number }> = {
    longevity: { res: evalComponentFormula(F("longevity"), data.monthsActive), limit: limits.longevity },
    majorDeals: { res: evalComponentFormula(F("majorDeals"), data.majorDeals), limit: limits.majorDeals },
    exits: { res: evalComponentFormula(F("exits"), exitsInput), limit: limits.exits },
    roi: { res: evalComponentFormula(F("roi"), roiInput), limit: limits.roi },
    resilience: { res: resilienceComposite, limit: limits.resilience },
    compliance: { res: evalComponentFormula(F("compliance"), complianceInput), limit: limits.compliance },
  };

  const components: Record<string, ComponentBreakdown> = {};
  const missingFields: string[] = [];
  let score = 0;
  let presentCount = 0;

  Object.entries(blocks).forEach(([key, { res, limit }]) => {
    const points = res.value === undefined ? 0 : clamp(res.value, 0, limit);
    if (res.value === undefined) missingFields.push(key);
    else presentCount += 1;
    score += points;
    components[key] = {
      raw: round2(points),
      weight: round2(limit / 100),
      contribution: round2(points),
      source: res.value === undefined ? "missing" : "derived",
      sub: res.sub && res.sub.length ? res.sub : undefined,
    };
  });

  score = clamp(score);
  const completeness = round2((presentCount / 6) * 100);

  return {
    score: round2(score),
    level: levelFor(score, config.tiers),
    formulaVersion: UNIFIED_FORMULA_VERSION,
    calculatedAt: nowIso(),
    completeness,
    components,
    penalties: [],
    missingFields,
  };
}

/* --------------------------- weighted core -------------------------- */

function weightedScore(
  values: Record<string, number>,
  present: Record<string, boolean>,
  config: WeightedConfig
): {
  score: number;
  components: Record<string, ComponentBreakdown>;
  completeness: number;
  missingFields: string[];
} {
  const components: Record<string, ComponentBreakdown> = {};
  let score = 0;
  Object.keys(config.weights).forEach((key) => {
    const weight = num(config.weights[key]) / 100;
    const raw = clamp(num(values[key]));
    const contribution = round2(raw * weight);
    components[key] = { raw: round2(raw), weight: round2(weight), contribution };
    score += contribution;
  });
  const { completeness, missingFields } = completenessOf(
    Object.keys(config.weights),
    present
  );
  return { score: clamp(score), components, completeness, missingFields };
}

/* ----------------- weighted core with sub-formulas ----------------- */

/**
 * Combine components where each may be MANUAL (number) or DERIVED (raw signals
 * via a sub-formula). Fixed weights (sum≈100); a missing component contributes
 * 0, is listed in missingFields and lowers completeness — no fabricated values.
 */
function combineWeighted(
  resolved: Record<string, ResolvedComponent>,
  config: WeightedConfig
): {
  score: number;
  components: Record<string, ComponentBreakdown>;
  completeness: number;
  missingFields: string[];
} {
  const components: Record<string, ComponentBreakdown> = {};
  const keys = Object.keys(config.weights);
  let score = 0;
  let presentCount = 0;
  const missingFields: string[] = [];

  keys.forEach((key) => {
    const rc = resolved[key] || {
      value: undefined,
      source: "missing" as const,
      sub: [],
      completeness: 0,
      missing: [],
    };
    const weight = num(config.weights[key]) / 100;
    const value = rc.value === undefined ? 0 : clamp(rc.value);
    const contribution = round2(value * weight);
    if (rc.value === undefined) missingFields.push(key);
    else presentCount += 1;
    score += contribution;
    components[key] = {
      raw: round2(value),
      weight: round2(weight),
      contribution,
      source: rc.source,
      sub: rc.sub && rc.sub.length ? rc.sub : undefined,
    };
  });

  const completeness = keys.length
    ? round2((presentCount / keys.length) * 100)
    : 100;
  return { score: clamp(score), components, completeness, missingFields };
}

/** Map a CompositeResult (from a sub-formula) into a ResolvedComponent. */
const derived = (c: CompositeResult): ResolvedComponent => ({
  value: c.value,
  source: c.value === undefined ? "missing" : "derived",
  sub: c.sub,
  completeness: c.completeness,
  missing: c.missing,
});

export function calculatePersonScore(
  input: PersonInput,
  config: WeightedConfig,
  twitterConfig: TwitterConfig,
  sf?: SubFormulasConfig
): UnifiedScoreResult {
  const data = input || {};
  const twitter = calculateTwitterScore(data.twitter, twitterConfig, sf);
  const F = (key: string) => sfFor(sf, "persons", key) as ComponentFormula;

  const resolved: Record<string, ResolvedComponent> = {
    investingSuccess: resolveComponent(data.investingSuccess, (raw) =>
      evalComponentFormula(F("investingSuccess"), raw)
    ),
    advisorSuccess: resolveComponent(data.advisorSuccess, (raw) =>
      evalComponentFormula(F("advisorSuccess"), raw)
    ),
    twitter: {
      value: isPresent(data.twitter) ? twitter.score : undefined,
      source: typeof data.twitter === "number" ? "manual" : "derived",
      sub: [],
      completeness: twitter.completeness,
      missing: [],
    },
    marketExperience: resolveComponent(data.marketExperience, (raw) =>
      evalComponentFormula(F("marketExperience"), raw)
    ),
    projectActivity: resolveComponent(data.projectActivity, (raw) =>
      evalComponentFormula(F("projectActivity"), raw)
    ),
    mediaActivity: resolveComponent(data.mediaActivity, (raw) =>
      evalComponentFormula(F("mediaActivity"), raw)
    ),
    marketInfluence: resolveComponent(data.marketInfluence, (raw) =>
      evalComponentFormula(F("marketInfluence"), raw)
    ),
    partnerships: resolveComponent(data.partnerships, (raw) =>
      evalComponentFormula(F("partnerships"), raw)
    ),
  };

  const result = combineWeighted(resolved, config);

  return {
    score: round2(result.score),
    level: levelFor(result.score, config.categories),
    formulaVersion: UNIFIED_FORMULA_VERSION,
    calculatedAt: nowIso(),
    completeness: result.completeness,
    components: result.components,
    penalties: [],
    missingFields: result.missingFields,
    meta: { twitter },
  };
}

/* ----------------------------- project ----------------------------- */

export function redFlagPenalty(
  count: number,
  config: ProjectConfig["redFlags"]
): number {
  const n = Math.max(0, Math.floor(num(count)));
  if (n <= 0) return 0;
  let penalty = config.first;
  if (n >= 2) penalty += config.second;
  if (n > 2) penalty += (n - 2) * config.subsequent;
  return Math.min(config.max, penalty);
}

export function calculateProjectScore(
  input: ProjectInput,
  config: ProjectConfig,
  twitterConfig: TwitterConfig,
  sf?: SubFormulasConfig
): UnifiedScoreResult {
  const data = input || {};
  const twitter = calculateTwitterScore(data.twitter, twitterConfig, sf);
  const F = (key: string) => sfFor(sf, "projects", key) as ComponentFormula;

  const resolved: Record<string, ResolvedComponent> = {
    fundsQuality: resolveComponent(data.fundsQuality, (raw) =>
      evalComponentFormula(F("fundsQuality"), raw)
    ),
    personsQuality: resolveComponent(data.personsQuality, (raw) =>
      evalComponentFormula(F("personsQuality"), raw)
    ),
    developmentTeam: resolveComponent(data.developmentTeam, (raw) =>
      evalComponentFormula(F("developmentTeam"), raw)
    ),
    tokenomics: resolveComponent(data.tokenomics, (raw) =>
      evalComponentFormula(F("tokenomics"), raw)
    ),
    niche: resolveComponent(data.niche, (raw) =>
      evalComponentFormula(F("niche"), raw)
    ),
    geography: resolveComponent(data.geography, (raw) =>
      evalComponentFormula(F("geography"), raw)
    ),
    competitors: resolveComponent(data.competitors, (raw) =>
      evalComponentFormula(F("competitors"), raw)
    ),
    twitter: {
      value: isPresent(data.twitter) ? twitter.score : undefined,
      source: typeof data.twitter === "number" ? "manual" : "derived",
      sub: [],
      completeness: twitter.completeness,
      missing: [],
    },
  };

  const base = combineWeighted(resolved, config);

  // Red flags: accept a typed list of confirmed flags or a plain count.
  const flagList = Array.isArray(data.redFlags)
    ? data.redFlags.filter((f) => f && (f as any).confirmed !== false)
    : [];
  const flagCount = Array.isArray(data.redFlags)
    ? flagList.length
    : num(data.redFlags);

  const penaltyValue = redFlagPenalty(flagCount, config.redFlags);
  // Itemised per-flag penalties so the admin sees exactly why points were lost.
  const penalties: ScorePenalty[] = [];
  if (penaltyValue) {
    let remaining = penaltyValue;
    const perFlagNominal = (idx: number) =>
      idx === 0
        ? config.redFlags.first
        : idx === 1
        ? config.redFlags.second
        : config.redFlags.subsequent;
    if (flagList.length) {
      flagList.forEach((f, idx) => {
        const applied = Math.min(perFlagNominal(idx), remaining);
        remaining = Math.max(0, remaining - applied);
        if (applied > 0)
          penalties.push({
            key: `redFlag:${(f as any).type || idx + 1}`,
            value: -applied,
            reason: (f as any).type || `Red flag #${idx + 1}`,
          });
      });
    } else {
      for (let idx = 0; idx < flagCount && remaining > 0; idx += 1) {
        const applied = Math.min(perFlagNominal(idx), remaining);
        remaining = Math.max(0, remaining - applied);
        penalties.push({
          key: `redFlag:${idx + 1}`,
          value: -applied,
          reason: `Red flag #${idx + 1}`,
        });
      }
    }
  }

  const score = clamp(base.score - penaltyValue);

  return {
    score: round2(score),
    level: levelFor(score, config.categories),
    formulaVersion: UNIFIED_FORMULA_VERSION,
    calculatedAt: nowIso(),
    completeness: base.completeness,
    components: base.components,
    penalties,
    missingFields: base.missingFields,
    meta: { twitter, baseScore: round2(base.score) },
  };
}

/* ------------------------ platform activity ------------------------ */

export function calculatePlatformActivityScore(
  input: PlatformActivityInput,
  config: PlatformActivityConfig,
  platformUserCfg?: UserConfig["platformUser"],
  sf?: SubFormulasConfig
): UnifiedScoreResult {
  const data = input || {};

  // Canonical rebuilt model (Phase 3): 6 weighted components derived from real
  // events. Sub-weights / thresholds / penalties are CONFIG-DRIVEN via
  // `subFormulas.users` (admin-editable), exactly like Twitter/Person. The
  // hardcoded platform* functions remain a safe fallback. Legacy per-action
  // points are used ONLY when no platformUser config exists at all.
  if (platformUserCfg && platformUserCfg.weights) {
    const evalOr = (
      raw: any,
      formulaKey: string,
      fallbackFn: (r: any) => any
    ): ResolvedComponent => {
      const formula = sfFor(sf, "users", formulaKey);
      return resolveComponent(raw, (r) =>
        formula ? evalComponentFormula(formula, r) : fallbackFn(r)
      );
    };
    const resolved: Record<string, ResolvedComponent> = {
      platformEngagement: evalOr((data as any).platformEngagement ?? (data as any).engagement, "platformEngagement", platformEngagement),
      contentInteraction: evalOr((data as any).contentInteraction, "contentInteraction", platformContentInteraction),
      meaningfulContribution: evalOr((data as any).meaningfulContribution, "meaningfulContribution", platformMeaningfulContribution),
      // EarlyLand keeps its bespoke task-difficulty model (supports tasks[]).
      earlyland: resolveComponent((data as any).earlyland, platformEarlyland),
      nft: evalOr((data as any).nft, "nft", platformNft),
      referrals: evalOr((data as any).referrals, "referrals", platformReferrals),
    };
    const result = combineWeighted(resolved, {
      enabled: true,
      weights: platformUserCfg.weights as any,
      categories: [],
    });
    return {
      score: round2(result.score),
      level: "",
      formulaVersion: UNIFIED_FORMULA_VERSION,
      calculatedAt: nowIso(),
      completeness: result.completeness,
      components: result.components,
      penalties: [],
      missingFields: result.missingFields,
      meta: { mode: "weighted" },
    };
  }

  const p = config.points;
  const contributions: Record<string, number> = {
    createProject: num(data.projectsCreated) * p.createProject,
    editProject: num(data.projectsEdited) * p.editProject,
    earlylandTask: num(data.earlylandTasks) * p.earlylandTask,
    socialAction: num(data.socialActions) * p.socialAction,
    createTab: num(data.tabsCreated) * p.createTab,
    referralL1: num(data.referralsL1) * p.referralL1,
    referralL2: num(data.referralsL2) * p.referralL2,
    createEntity: num(data.entitiesCreated) * p.createEntity,
  };

  const totalPoints = Object.values(contributions).reduce(
    (sum, value) => sum + value,
    0
  );
  const score = clamp((totalPoints / config.maxPoints) * 100);

  const components: Record<string, ComponentBreakdown> = {};
  Object.entries(contributions).forEach(([key, value]) => {
    components[key] = {
      raw: round2(value),
      weight: round2(1 / config.maxPoints),
      contribution: round2((value / config.maxPoints) * 100),
    };
  });

  return {
    score: round2(score),
    level: "",
    formulaVersion: UNIFIED_FORMULA_VERSION,
    calculatedAt: nowIso(),
    completeness: 100,
    components,
    penalties: [],
    missingFields: [],
    meta: { totalPoints: round2(totalPoints), maxPoints: config.maxPoints },
  };
}

/* --------------------------- trade (dir) --------------------------- */

function reviewConfidence(count: number, steps: ThresholdStep[]): number {
  return thresholdPoints(count, steps);
}

export function calculateTradeDirectionScore(
  input: TradeDirectionInput,
  config: TradeDirectionConfig,
  riskPenalties: TradeConfig["riskPenalties"],
  reviewConfidenceSteps: ThresholdStep[] = []
): UnifiedScoreResult {
  const data = input || {};
  const max = config.componentMax;

  const volume = clamp(
    thresholdPoints(num(data.volume), config.volumeThresholds),
    0,
    max.volume
  );
  const trades = clamp(
    thresholdPoints(num(data.completedTrades), config.tradeThresholds),
    0,
    max.trades
  );
  const confidence = reviewConfidence(
    num(data.reviewCount),
    reviewConfidenceSteps
  );
  const reviews = clamp(
    (num(data.avgReview) / 5) * max.reviews * confidence,
    0,
    max.reviews
  );
  const counterparties = clamp(
    thresholdPoints(num(data.uniqueCounterparties), config.counterpartyThresholds),
    0,
    max.counterparties
  );

  const base = volume + trades + reviews + counterparties;

  const penalties: ScorePenalty[] = [];
  if (data.criticalFraud) {
    penalties.push({
      key: "criticalFraud",
      value: -base,
      reason: "Critical fraud — rating blocked",
    });
    return {
      score: 0,
      level: "",
      formulaVersion: UNIFIED_FORMULA_VERSION,
      calculatedAt: nowIso(),
      completeness: 100,
      components: {
        volume: { raw: round2(volume), weight: max.volume / 100, contribution: round2(volume) },
        trades: { raw: round2(trades), weight: max.trades / 100, contribution: round2(trades) },
        reviews: { raw: round2(reviews), weight: max.reviews / 100, contribution: round2(reviews) },
        counterparties: {
          raw: round2(counterparties),
          weight: max.counterparties / 100,
          contribution: round2(counterparties),
        },
      },
      penalties,
      missingFields: [],
      meta: { blocked: true, confidence: round2(confidence) },
    };
  }

  let penaltyValue = 0;
  if (num(data.lostDisputes) > 0) {
    const value = num(data.lostDisputes) * riskPenalties.lostDispute;
    penaltyValue += value;
    penalties.push({
      key: "lostDispute",
      value: -value,
      reason: `${num(data.lostDisputes)} lost dispute(s)`,
    });
  }
  if (num(data.repeatViolations) > 0) {
    const value = num(data.repeatViolations) * riskPenalties.repeatViolation;
    penaltyValue += value;
    penalties.push({
      key: "repeatViolation",
      value: -value,
      reason: `${num(data.repeatViolations)} repeat violation(s)`,
    });
  }

  const score = clamp(base - penaltyValue);

  return {
    score: round2(score),
    level: "",
    formulaVersion: UNIFIED_FORMULA_VERSION,
    calculatedAt: nowIso(),
    completeness: 100,
    components: {
      volume: { raw: round2(volume), weight: max.volume / 100, contribution: round2(volume) },
      trades: { raw: round2(trades), weight: max.trades / 100, contribution: round2(trades) },
      reviews: { raw: round2(reviews), weight: max.reviews / 100, contribution: round2(reviews) },
      counterparties: {
        raw: round2(counterparties),
        weight: max.counterparties / 100,
        contribution: round2(counterparties),
      },
    },
    penalties,
    missingFields: [],
    meta: { baseScore: round2(base), confidence: round2(confidence) },
  };
}

export type TradeReputationResult = UnifiedScoreResult & {
  otcScore: number;
  p2pScore: number;
  combinedTradeScore: number;
  tradeRank: string;
  sharedCore: number;
  otcExperience: number;
  p2pExperience: number;
};

/** Pool raw trade signals across both directions for the Shared Reputation Core. */
function poolTradeInputs(
  otcInput: TradeDirectionInput,
  p2pInput: TradeDirectionInput
): TradeDirectionInput {
  const a = otcInput || {};
  const b = p2pInput || {};
  const reviewCount = num(a.reviewCount) + num(b.reviewCount);
  const weightedReview =
    reviewCount > 0
      ? (num(a.avgReview) * num(a.reviewCount) +
          num(b.avgReview) * num(b.reviewCount)) /
        reviewCount
      : 0;
  return {
    volume: num(a.volume) + num(b.volume),
    completedTrades: num(a.completedTrades) + num(b.completedTrades),
    uniqueCounterparties:
      num(a.uniqueCounterparties) + num(b.uniqueCounterparties),
    avgReview: weightedReview,
    reviewCount,
    lostDisputes: num(a.lostDisputes) + num(b.lostDisputes),
    repeatViolations: num(a.repeatViolations) + num(b.repeatViolations),
    criticalFraud: Boolean(a.criticalFraud || b.criticalFraud),
  };
}

export function calculateTradeReputation(
  otcInput: TradeDirectionInput,
  p2pInput: TradeDirectionInput,
  config: TradeConfig
): TradeReputationResult {
  const otc = calculateTradeDirectionScore(
    otcInput,
    config.otc,
    config.riskPenalties,
    config.reviewConfidence
  );
  const p2p = calculateTradeDirectionScore(
    p2pInput,
    config.p2p,
    config.riskPenalties,
    config.reviewConfidence
  );

  // --- Shared Reputation Core: pooled totals across BOTH directions ---
  const sharedCfg = config.shared || config.otc;
  const pooled = poolTradeInputs(otcInput, p2pInput);
  const shared = calculateTradeDirectionScore(
    pooled,
    sharedCfg,
    config.riskPenalties,
    config.reviewConfidence
  );
  const sharedCore = shared.score;

  // --- Active market experience: trade-share-weighted avg over ACTIVE dirs ---
  const otcTrades = num((otcInput || {}).completedTrades);
  const p2pTrades = num((p2pInput || {}).completedTrades);
  const total = otcTrades + p2pTrades;

  let activeExperience = 0;
  let otcWeight = 0;
  let p2pWeight = 0;
  if (total > 0) {
    otcWeight = otcTrades / total;
    p2pWeight = p2pTrades / total;
    activeExperience = otc.score * otcWeight + p2p.score * p2pWeight;
  }

  // --- Unified: reputation carries across markets; experience is a specialisation ---
  const coreWeight = Number.isFinite(config.coreWeight) ? config.coreWeight : 0.7;
  const expWeight = Number.isFinite(config.experienceWeight)
    ? config.experienceWeight
    : 0.3;
  let unified = 0;
  if (total > 0) {
    unified = clamp(sharedCore * coreWeight + activeExperience * expWeight);
  }
  // If a critical fraud blocked the pooled core, the unified rank is blocked too.
  if (pooled.criticalFraud) unified = 0;

  return {
    score: round2(unified),
    level: levelFor(unified, config.ranks),
    formulaVersion: UNIFIED_FORMULA_VERSION,
    calculatedAt: nowIso(),
    completeness: 100,
    components: {
      sharedCore: {
        raw: round2(sharedCore),
        weight: round2(coreWeight),
        contribution: round2(sharedCore * coreWeight),
      },
      activeExperience: {
        raw: round2(activeExperience),
        weight: round2(expWeight),
        contribution: round2(activeExperience * expWeight),
      },
    },
    penalties: [...otc.penalties, ...p2p.penalties],
    missingFields: [],
    otcScore: round2(otc.score),
    p2pScore: round2(p2p.score),
    sharedCore: round2(sharedCore),
    otcExperience: round2(otc.score),
    p2pExperience: round2(p2p.score),
    combinedTradeScore: round2(unified),
    tradeRank: levelFor(unified, config.ranks),
    meta: {
      otc,
      p2p,
      shared,
      sharedCore: round2(sharedCore),
      activeExperience: round2(activeExperience),
      otcExperience: round2(otc.score),
      p2pExperience: round2(p2p.score),
      otcWeight: round2(otcWeight),
      p2pWeight: round2(p2pWeight),
      coreWeight: round2(coreWeight),
      experienceWeight: round2(expWeight),
    },
  };
}

/* ------------------------------ user ------------------------------- */

export function calculateUserScore(
  input: UserInput,
  config: UserConfig,
  sf?: SubFormulasConfig
): UnifiedScoreResult {
  const data = input || {};

  // ---- 1) XP Reputation (single global activityXP -> 0..100) ----
  const xpMax = num(config.xpReputation?.activityXpMax) || 1000;
  const activityXP = num(data.activityXP);
  const xpRepRaw = clamp((activityXP / (xpMax || 1000)) * 100);

  // ---- 2) Trade Reputation (Unified OTC/P2P) ----
  const trade = calculateTradeReputation(data.otc || {}, data.p2p || {}, config.trade);

  // ---- 3) Launchpad Reputation (investment participation) — MISSING if no source ----
  const launchpadPresent =
    !!data.launchpad && typeof (data.launchpad as any).score === "number";
  const launchpadRaw = launchpadPresent ? clamp(num((data.launchpad as any).score)) : 0;

  // ---- 4) NFT / Subscription entitlement (NOT staking days) ----
  const nftCfg = config.nftSubscription || {
    hasNftPoints: 40,
    tierPoints: { basic: 0, higher: 20, premium: 40 },
    membershipDaysMax: 365,
    membershipPoints: 30,
    subscriptionContinuityPoints: 30,
  };
  const nftIn = data.nftSubscription || {};
  const hasNft = !!nftIn.hasNft || num(nftIn.nftCount) > 0;
  let nftPoints = 0;
  if (hasNft) nftPoints += num(nftCfg.hasNftPoints);
  const tierKey = (nftIn.tier as "basic" | "higher" | "premium") || "basic";
  nftPoints += num((nftCfg.tierPoints as any)?.[tierKey]);
  const memMax = num(nftCfg.membershipDaysMax) || 365;
  nftPoints += Math.min(num(nftIn.membershipDays) / memMax, 1) * num(nftCfg.membershipPoints);
  if (nftIn.subscriptionActive) {
    const cont = Math.min(num(nftIn.subscriptionMonths) / 12, 1) || 1;
    nftPoints += cont * num(nftCfg.subscriptionContinuityPoints);
  }
  const nftRaw = clamp(nftPoints);

  // ---- Weighted combine with renormalization (missing components excluded, not zeroed) ----
  const w = config.weights;
  const parts: Array<{ key: string; raw: number; weight: number; present: boolean }> = [
    { key: "xpReputation", raw: xpRepRaw, weight: num(w.xpReputation), present: true },
    { key: "tradeReputation", raw: round2(trade.score), weight: num(w.tradeReputation), present: true },
    { key: "launchpad", raw: launchpadRaw, weight: num(w.launchpad), present: launchpadPresent },
    { key: "nftSubscription", raw: nftRaw, weight: num(w.nftSubscription), present: true },
  ];
  const sumPresentW = parts.filter((p) => p.present).reduce((s, p) => s + p.weight, 0) || 1;

  const components: Record<string, any> = {};
  const missingFields: string[] = [];
  let base = 0;
  for (const p of parts) {
    if (!p.present) {
      components[p.key] = { raw: null, weight: round2(p.weight / 100), contribution: 0, missing: true };
      missingFields.push(p.key);
      continue;
    }
    const effWeight = p.weight / sumPresentW; // renormalized share
    const contribution = p.raw * effWeight;
    base += contribution;
    components[p.key] = {
      raw: round2(p.raw),
      weight: round2(effWeight),
      contribution: round2(contribution),
      missing: false,
    };
  }
  base = clamp(base);

  // ---- Risk penalty applied AFTER base score ----
  const riskCfg = config.riskPenalties || { redFlagPoint: 5, maxPenalty: 40 };
  const rawPenalty = num(data.redFlags) * num(riskCfg.redFlagPoint);
  const riskPenalty = Math.min(rawPenalty, num(riskCfg.maxPenalty));
  const score = clamp(base - riskPenalty);

  const penalties = [
    ...trade.penalties,
    ...(riskPenalty > 0
      ? [{ code: "risk_red_flags", label: "Штраф за риск (красные флаги)", value: round2(riskPenalty) } as any]
      : []),
  ];

  return {
    score: round2(score),
    level: levelFor(score, config.ranks),
    formulaVersion: UNIFIED_FORMULA_VERSION,
    calculatedAt: nowIso(),
    completeness: round2(((launchpadPresent ? 4 : 3) / 4) * 100),
    components,
    penalties,
    missingFields,
    meta: {
      model: "fomo_score_v2",
      baseScore: round2(base),
      riskPenalty: round2(riskPenalty),
      xpReputation: { activityXP, activityXpMax: xpMax, score: round2(xpRepRaw) },
      trade,
    },
  };
}

/* -------------------------- entry helpers -------------------------- */

export function calculateByEntity(
  entityType: string,
  input: any,
  config: UnifiedRatingConfig
): UnifiedScoreResult {
  switch (entityType) {
    case "funds":
      return calculateFundScore(input as FundInput, config.funds, config.subFormulas);
    case "persons":
      return calculatePersonScore(
        input as PersonInput,
        config.persons,
        config.twitter,
        config.subFormulas
      );
    case "projects":
      return calculateProjectScore(
        input as ProjectInput,
        config.projects,
        config.twitter,
        config.subFormulas
      );
    case "users":
      return calculateUserScore(input as UserInput, config.users, config.subFormulas);
    case "twitter":
      return calculateTwitterScore(input as TwitterInput, config.twitter, config.subFormulas);
    default:
      throw new Error(`Unknown rating entity type: ${entityType}`);
  }
}
