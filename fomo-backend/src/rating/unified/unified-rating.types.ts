/**
 * Unified Rating Engine v2 — type contracts.
 *
 * Standalone from the legacy generic rating engine. Entities: funds, persons,
 * projects, users. Twitter Score and OTC/P2P Trade Reputation are reusable
 * sub-components. See /app/memory/RATING_SPEC_FINAL.md for the authoritative
 * business specification.
 */

export const UNIFIED_ENTITY_TYPES = [
  "funds",
  "persons",
  "projects",
  "users",
] as const;

export type UnifiedEntityType = (typeof UNIFIED_ENTITY_TYPES)[number];

export const UNIFIED_FORMULA_VERSION = "rating-v2";

/**
 * Layer-2 breakdown: how a single top-level component was DERIVED from a raw
 * sub-signal (Layer 1). Exposed so the admin sees "12 mentions -> 68/100".
 */
export type SubBreakdown = {
  key: string;
  /** Raw measured signal value. */
  raw: number;
  /** Normalised sub value (0-100). */
  normalized: number;
  /** Sub-weight within the component. */
  weight: number;
  /** Contribution of this sub to the component value. */
  contribution: number;
  present: boolean;
  penalty?: boolean;
};

export type ComponentBreakdown = {
  /** Normalised metric value (0-100) or raw points for additive models. */
  raw: number;
  /** Weight applied (fraction 0-1 for weighted models, share for additive). */
  weight: number;
  /** Final contribution to the score. */
  contribution: number;
  /** How the component value was obtained. */
  source?: "manual" | "derived" | "missing";
  /** Layer-2 sub-formula breakdown (raw signals -> 0-100), when derived. */
  sub?: SubBreakdown[];
};

export type ScorePenalty = {
  key: string;
  value: number;
  reason: string;
};

export type UnifiedScoreResult = {
  score: number;
  level: string;
  formulaVersion: string;
  calculatedAt: string;
  completeness: number;
  components: Record<string, ComponentBreakdown>;
  penalties: ScorePenalty[];
  missingFields: string[];
  meta?: Record<string, any>;
};

export type CategoryBand = {
  key: string;
  label: string;
  min: number;
  max: number;
};

export type ThresholdStep = {
  /** Metric value at or above which `points` applies. */
  at: number;
  points: number;
};

/* ------------------------------------------------------------------ */
/* Config shapes (editable in the admin panel)                         */
/* ------------------------------------------------------------------ */

export type ResilienceCriterion = {
  key: string;
  label: string;
  enabled: boolean;
  weight: number; // percent (enabled ones must sum to 100)
  description?: string;
  evidenceType?: string;
};

export type FundConfig = {
  enabled: boolean;
  limits: {
    longevity: number;
    majorDeals: number;
    exits: number;
    roi: number;
    resilience: number;
    compliance: number;
  };
  /**
   * Weighted resilience criteria aggregated from the active crisis catalog.
   * When a fund provides `resilienceSignals` (per-criterion 0..1 achievement)
   * the engine scores Resilience as a weighted sum of these criteria instead of
   * the plain crises-survived count.
   */
  resilienceCriteria?: ResilienceCriterion[];
  /**
   * DEPRECATED legacy linear coefficients. NOT used by the config-driven
   * sub-formulas (Longevity now uses the canonical stepwise `subFormulas.funds
   * .longevity` tiered table: raw months -> normalized 0-100 -> x cap 25).
   * Kept only for backward compatibility of persisted configs; all optional.
   */
  rates?: {
    majorDealPoints?: number;
    exitPoints?: number;
    roiThreshold?: number;
  };
  tiers: CategoryBand[];
};

export type WeightedConfig = {
  enabled: boolean;
  weights: Record<string, number>;
  categories: CategoryBand[];
};

export type ProjectConfig = WeightedConfig & {
  redFlags: {
    first: number;
    second: number;
    subsequent: number;
    max: number;
  };
};

export type TwitterConfig = {
  enabled: boolean;
  weights: {
    followers: number;
    quality: number;
    engagement: number;
    frequency: number;
    reputation: number;
    cryptoInfluence: number;
    tier1Audience: number;
  };
  normalization: {
    followersMax: number;
    engagementRateMax: number;
  };
  categories: CategoryBand[];
};

export type PlatformActivityConfig = {
  points: {
    createProject: number;
    editProject: number;
    earlylandTask: number;
    socialAction: number;
    createTab: number;
    referralL1: number;
    referralL2: number;
    createEntity: number;
  };
  maxPoints: number;
};

export type TradeDirectionConfig = {
  componentMax: {
    volume: number;
    trades: number;
    reviews: number;
    counterparties: number;
  };
  volumeThresholds: ThresholdStep[];
  tradeThresholds: ThresholdStep[];
  counterpartyThresholds: ThresholdStep[];
};

export type TradeConfig = {
  otc: TradeDirectionConfig;
  p2p: TradeDirectionConfig;
  /** Shared reputation core aggregated across BOTH directions (pooled totals). */
  shared: TradeDirectionConfig;
  /** Unified = sharedCore*coreWeight + activeExperience*experienceWeight. */
  coreWeight: number;
  experienceWeight: number;
  /** count (at) -> confidence coefficient (points, 0..1). */
  reviewConfidence: ThresholdStep[];
  riskPenalties: {
    lostDispute: number;
    repeatViolation: number;
  };
  ranks: CategoryBand[];
};

export type UserConfig = {
  enabled: boolean;
  weights: {
    /** New FOMO Score model (Phase 3): XP 40% + Trade 30% + Launchpad 20% + NFT/Subscription 10%. */
    xpReputation: number;
    tradeReputation: number;
    launchpad: number;
    nftSubscription: number;
  };
  /** activityXP (0..activityXpMax) -> XP Reputation (0..100). Configurable normalizer. */
  xpReputation?: {
    activityXpMax: number;
  };
  /** NFT / Subscription entitlement scoring (NOT staking days — staking already grants XP). */
  nftSubscription?: {
    hasNftPoints: number;
    tierPoints: { basic: number; higher: number; premium: number };
    membershipDaysMax: number;
    membershipPoints: number;
    subscriptionContinuityPoints: number;
  };
  /** Launchpad reputation config (investment participation/allocation/volume/completion). */
  launchpad?: {
    enabled: boolean;
  };
  /** Risk penalty applied AFTER the weighted base score (points subtracted, 0..100 clamp). */
  riskPenalties?: {
    redFlagPoint: number;
    maxPenalty: number;
  };
  platformActivity: PlatformActivityConfig;
  /** @deprecated legacy Platform User sub-formula — no longer used for user score. */
  platformUser?: {
    weights: {
      platformEngagement: number;
      contentInteraction: number;
      meaningfulContribution: number;
      earlyland: number;
      nft: number;
      referrals: number;
    };
  };
  trade: TradeConfig;
  ranks: CategoryBand[];
};

export type UnifiedRatingConfig = {
  formulaVersion: string;
  batchSize: number;
  collections: {
    funds: string;
    persons: string;
    projects: string;
    users: string;
  };
  funds: FundConfig;
  persons: WeightedConfig;
  projects: ProjectConfig;
  users: UserConfig;
  twitter: TwitterConfig;
  /** Editable Layer-2 sub-formulas (raw signals -> 0-100 / points). */
  subFormulas: SubFormulasConfig;
};

/* ============================================================= *
 *  Layer-2 sub-formula CONFIG (editable in admin, validated).   *
 *  A component's value is DERIVED: raw signals -> normalization *
 *  -> weighted composite -> 0-100 (or points for fund blocks).  *
 * ============================================================= */

export type TierStep = { at: number; points: number };

/** How a single raw sub-signal is normalised to 0-100. */
export type NormRule =
  | { type: "pct" } // already 0-100
  | { type: "linear"; cap: number } // value/cap*100
  | { type: "log"; cap: number } // log10 scale, cap = value for 100
  | { type: "ratio" } // 0..1 (or 0..100) -> percent
  | { type: "recency"; halfLifeDays: number } // 100 now, 50 at half-life (days)
  | { type: "bool" } // truthy -> 100
  | { type: "tiered"; table: TierStep[] };

export type SubMetricDef = {
  key: string; // raw field name in the input
  label: string; // RU label for admin/tooltip
  source: string; // human-readable data source
  weight: number; // sub-weight within the component (weighted kinds sum to 100)
  norm: NormRule;
  penalty?: boolean; // subtracted from the positive core
};

type FormulaMeta = {
  label: string;
  tooltip: string;
  formula: string;
  source?: string;
};

export type WeightedComponentFormula = FormulaMeta & {
  kind: "weighted";
  /** If set, the 0-100 composite is scaled to this many POINTS (fund blocks). */
  cap?: number;
  subs: SubMetricDef[];
};

export type TieredComponentFormula = FormulaMeta & {
  kind: "tiered";
  field: string;
  cap: number;
  table: TierStep[];
};

export type ScalarComponentFormula = FormulaMeta & {
  kind: "scalar";
  field: string;
  cap?: number;
  norm: NormRule;
};

/** Shape returned by every sub-formula evaluator. */
export type CompositeResultShape = {
  value: number | undefined;
  sub: SubBreakdown[];
  completeness: number;
  missing: string[];
};

export type DealQualityFormula = FormulaMeta & {
  kind: "dealQuality";
  cap: number;
  rolePoints: Record<string, number>;
};

export type ResilienceFormula = FormulaMeta & {
  kind: "resilience";
  cap: number;
  crisisSubs: SubMetricDef[];
  fullConfidenceCrises: number;
};

export type ComplianceFormula = FormulaMeta & {
  kind: "compliance";
  cap: number;
  jurisdictionField: string;
  flags: { key: string; label: string; delta: number }[];
};

export type PartnershipsFormula = FormulaMeta & {
  kind: "partnerships";
  kindRatings: Record<string, number>;
  divisor: number;
  recencyHalfLifeDays: number;
};

export type WeightedListFormula = FormulaMeta & {
  kind: "weightedList";
};

export type ComponentFormula =
  | WeightedComponentFormula
  | ScalarComponentFormula
  | TieredComponentFormula
  | DealQualityFormula
  | ResilienceFormula
  | ComplianceFormula
  | PartnershipsFormula
  | WeightedListFormula;

export type SubFormulasConfig = {
  funds: Record<string, ComponentFormula>;
  persons: Record<string, ComponentFormula>;
  twitter: Record<string, ComponentFormula>;
  projects: Record<string, ComponentFormula>;
  users: Record<string, ComponentFormula>;
};

/* ------------------------------------------------------------------ */
/* Engine input shapes                                                 */
/* ------------------------------------------------------------------ */

/**
 * A component input may be a precomputed 0-100 number (MANUAL fallback) or a
 * raw sub-signal object / list that the sub-formula layer normalises. See
 * unified-rating.subformulas.ts.
 */
export type RawOrNumber = number | Record<string, any> | any[];

export type TwitterInput = {
  followers?: number;
  followerQuality?: RawOrNumber;
  engagementRate?: number;
  engagement?: RawOrNumber;
  postingFrequency?: RawOrNumber;
  reputation?: RawOrNumber;
  cryptoInfluence?: RawOrNumber;
  tier1Audience?: RawOrNumber;
};

export type FundInput = {
  monthsActive?: number;
  majorDeals?: RawOrNumber;
  successfulExits?: number;
  exits?: RawOrNumber;
  avgRoiMultiple?: number;
  roi?: RawOrNumber;
  crisesSurvived?: number;
  crises?: RawOrNumber;
  /** Per-criterion resilience achievement (0..1) keyed by criterion key. */
  resilienceSignals?: Record<string, number>;
  complianceScore?: number;
  compliance?: RawOrNumber;
};

export type PersonInput = {
  investingSuccess?: RawOrNumber;
  advisorSuccess?: RawOrNumber;
  twitter?: TwitterInput | number;
  marketExperience?: RawOrNumber;
  projectActivity?: RawOrNumber;
  mediaActivity?: RawOrNumber;
  marketInfluence?: RawOrNumber;
  partnerships?: RawOrNumber;
};

export type ProjectInput = {
  fundsQuality?: RawOrNumber;
  personsQuality?: RawOrNumber;
  developmentTeam?: RawOrNumber;
  tokenomics?: RawOrNumber;
  niche?: RawOrNumber;
  geography?: RawOrNumber;
  competitors?: RawOrNumber;
  twitter?: TwitterInput | number;
  redFlags?: number | Array<{ type?: string; confirmed?: boolean }>;
};

export type PlatformActivityInput = {
  // Legacy per-action counters (kept for back-compat / fallback only).
  projectsCreated?: number;
  projectsEdited?: number;
  earlylandTasks?: number;
  socialActions?: number;
  tabsCreated?: number;
  referralsL1?: number;
  referralsL2?: number;
  entitiesCreated?: number;
  /** Phase 3 rich sub-signals for the rebuilt Platform User score. */
  platformEngagement?: RawOrNumber;
  engagement?: RawOrNumber;
  contentInteraction?: RawOrNumber;
  meaningfulContribution?: RawOrNumber;
  contributionQuality?: RawOrNumber;
  earlyland?: RawOrNumber;
  nft?: RawOrNumber;
  referrals?: RawOrNumber;
};

export type TradeDirectionInput = {
  volume?: number;
  completedTrades?: number;
  avgReview?: number;
  reviewCount?: number;
  uniqueCounterparties?: number;
  lostDisputes?: number;
  repeatViolations?: number;
  criticalFraud?: boolean;
};

export type NftSubscriptionInput = {
  hasNft?: boolean;
  nftCount?: number;
  tier?: "basic" | "higher" | "premium" | string;
  membershipDays?: number;
  subscriptionActive?: boolean;
  subscriptionMonths?: number;
};

export type UserInput = {
  /** Global unified XP (0..1000). Single source for XP Reputation. */
  activityXP?: number;
  otc?: TradeDirectionInput;
  p2p?: TradeDirectionInput;
  /** Launchpad investment reputation source (absent -> component missing, NOT 0). */
  launchpad?: { score?: number } | null;
  /** NFT / subscription entitlement (NOT staking days). */
  nftSubscription?: NftSubscriptionInput;
  /** Number of confirmed red flags for risk penalty. */
  redFlags?: number;
  /** @deprecated legacy platform activity input — no longer used for user score. */
  platformActivity?: PlatformActivityInput;
};
