import { DEFAULT_XP_RANKS, XP_MAX } from "../xp/xp-rank.model";


export type SpaceportBadgeKey =
  | "nova"
  | "quasar"
  | "nebula"
  | "pulsar"
  | "supernova"
  | "galaxy"
  | "cosmos";

export type SpaceportMetricKey =
  | "stakingDays"
  | "xp"
  | "stakedNfts"
  | "tasks"
  | "otcVolumeUsd"
  | "launchpads"
  | "primeProjects"
  | "accountLevel";

interface SpaceportRequirementRule {
  metric: SpaceportMetricKey;
  required: number;
  label: string;
}

interface SpaceportBadgeRule {
  key: SpaceportBadgeKey;
  name: string;
  requirements: SpaceportRequirementRule[];
}

export interface SpaceportClaimedBadgeEntry {
  key: SpaceportBadgeKey;
  claimedAt: Date;
  xpAwarded: number;
}

export interface SpaceportClaimedRewardEntry {
  key: string;
  claimedAt: Date;
  xpAwarded: number;
}

export interface SpaceportStakingSummaryEntry {
  totalSeconds?: unknown;
  isCurrentlyStaked?: boolean;
}

export interface SpaceportProgressionMetrics {
  xp: number;
  stakingDays: number;
  stakedNfts: number;
  tasks: number;
  otcVolumeUsd: number;
  launchpads: number;
  primeProjects: number;
  accountLevel: number;
}

export interface SpaceportXpBreakdown {
  activityXp: number;
  dailyStakingXp: number;
  milestoneBonusXp: number;
  additionalNftBonusXp: number;
  claimedStakingXp: number;
  pendingStakingXp: number;
  totalStakingXp: number;
  effectiveXp: number;
  otherXp: number;
  totalXp: number;
}

export interface SpaceportBadgeRequirementProgress {
  metric: SpaceportMetricKey;
  label: string;
  required: number;
  current: number;
  complete: boolean;
  progressPercent: number;
}

export interface SpaceportBadgeProgress {
  key: SpaceportBadgeKey;
  name: string;
  earned: boolean;
  eligible: boolean;
  claimed: boolean;
  claimable: boolean;
  claimedAt: Date | null;
  xpReward: number;
  progressPercent: number;
  completedRequirements: number;
  totalRequirements: number;
  requirementText: string;
  progressLabel: string;
  requirements: SpaceportBadgeRequirementProgress[];
}

export interface SpaceportStakingRewardProgress {
  key: string;
  name: string;
  requirementText: string;
  rewardXp: number;
  requiredUnits: number;
  currentUnits: number;
  unitLabel: string;
  claimed: boolean;
  claimable: boolean;
  claimedAt: Date | null;
  progressPercent: number;
  progressLabel: string;
}

export interface SpaceportProgressionData {
  currentLevel: number;
  currentLevelName: string;
  nextLevel: number | null;
  nextLevelName: string | null;
  earnedBadgesCount: number;
  totalStakingSeconds: number;
  totalStakingDays: number;
  totalStakingRewardUnits: number;
  stakingRewardUnitLabel: string;
  stakingRewardUnitSeconds: number;
  updatedAt: Date;
  metrics: SpaceportProgressionMetrics;
  xpBreakdown: SpaceportXpBreakdown;
  globalXp: GlobalXpRankProgress;
  levels: SpaceportLevelView[];
  badges: Record<SpaceportBadgeKey, SpaceportBadgeProgress>;
  stakingRewards: SpaceportStakingRewardProgress[];
}

export const SPACEPORT_BADGE_KEYS: SpaceportBadgeKey[] = [
  "nova",
  "quasar",
  "nebula",
  "pulsar",
  "supernova",
  "galaxy",
  "cosmos",
];

// ---------------------------------------------------------------------------
// SpacePort Level ladder (Lv.1–Lv.5). This is a STATUS ladder inside SpacePort,
// NOT a second XP scale. A level is reached when ALL of its requirements are met.
// Requirements combine staking, the GLOBAL activityXP (0–1000), NFT staking and
// platform activity (Launchpad / OTC-Trade). There is NO separate SpacePort XP.
// The global user rank (Stellar…Universal) is resolved separately from activityXP.
// ---------------------------------------------------------------------------
export type SpacePrivilegeStatus = "active" | "planned";

export interface SpaceportLevelPrivilege {
  key: string;
  label: string;
  status: SpacePrivilegeStatus; // "planned" => shown as upcoming, NOT as available
}

interface SpaceportLevelRule {
  level: number;
  name: string;
  requirements: SpaceportRequirementRule[];
  privileges: SpaceportLevelPrivilege[];
}

export const SPACEPORT_LEVEL_RULES: SpaceportLevelRule[] = [
  {
    level: 1,
    name: "Novice",
    requirements: [],
    privileges: [
      { key: "spaceport_access", label: "SpacePort access & NFT staking", status: "active" },
    ],
  },
  {
    level: 2,
    name: "Explorer",
    requirements: [
      { metric: "stakingDays", required: 30, label: "30+ days staking" },
      { metric: "xp", required: 100, label: "100+ total XP" },
    ],
    privileges: [
      { key: "priority_drops", label: "Priority access to new NFT drops", status: "planned" },
    ],
  },
  {
    level: 3,
    name: "Collector",
    requirements: [
      { metric: "stakingDays", required: 90, label: "90+ days staking" },
      { metric: "xp", required: 200, label: "200+ total XP" },
      { metric: "stakedNfts", required: 1, label: "NFT actively staked" },
    ],
    privileges: [
      { key: "rare_fusion", label: "Access to Rare NFT fusion", status: "planned" },
    ],
  },
  {
    level: 4,
    name: "Master",
    requirements: [
      { metric: "stakingDays", required: 180, label: "180+ days staking" },
      { metric: "xp", required: 400, label: "400+ total XP" },
      { metric: "launchpads", required: 1, label: "1+ Launchpad participation" },
    ],
    privileges: [
      { key: "master_fusion", label: "Advanced NFT fusion tier", status: "planned" },
    ],
  },
  {
    level: 5,
    name: "Legend",
    requirements: [
      { metric: "stakingDays", required: 365, label: "365+ days staking" },
      { metric: "xp", required: 600, label: "600+ total XP" },
      { metric: "launchpads", required: 1, label: "1+ Launchpad participation" },
      { metric: "otcVolumeUsd", required: 5000, label: "$5,000+ OTC / Trade volume" },
    ],
    privileges: [
      { key: "legend_status", label: "Legend status & top-tier perks", status: "planned" },
    ],
  },
];

export interface SpaceportLevelRequirementProgress {
  metric: SpaceportMetricKey;
  label: string;
  required: number;
  current: number;
  met: boolean;
  progressPercent: number;
}

export interface SpaceportLevelView {
  level: number;
  name: string;
  reached: boolean;
  isCurrent: boolean;
  isNext: boolean;
  requirements: SpaceportLevelRequirementProgress[];
  metRequirements: number;
  totalRequirements: number;
  privileges: SpaceportLevelPrivilege[];
}

export interface GlobalXpRankProgress {
  activityXp: number;
  xpMax: number;
  rankKey: string;
  rankName: string;
  rankOrder: number;
  rankIcon: string;
  rankMinXp: number;
  rankMaxXp: number;
  xpIntoRank: number;
  xpToNextRank: number;
  nextRankName: string | null;
  progressPercent: number;
}

/** Global user rank (Stellar…Universal) resolved ONLY from activityXP (0–1000). */
const resolveGlobalXpRank = (activityXpRaw: unknown): GlobalXpRankProgress => {
  const xp = Math.max(0, Math.min(XP_MAX, normalizeMetric(activityXpRaw)));
  const ranks = [...DEFAULT_XP_RANKS].sort((a, b) => a.order - b.order);
  let current = ranks[0];
  for (const r of ranks) {
    if (xp >= r.minXp) current = r;
  }
  const next = ranks.find((r) => r.order === current.order + 1) || null;
  const span = Math.max(1, current.maxXp - current.minXp + 1);
  const xpIntoRank = Math.max(0, xp - current.minXp);
  const xpToNextRank = next ? Math.max(0, next.minXp - xp) : 0;
  return {
    activityXp: xp,
    xpMax: XP_MAX,
    rankKey: current.key,
    rankName: current.name,
    rankOrder: current.order,
    rankIcon: current.icon,
    rankMinXp: current.minXp,
    rankMaxXp: current.maxXp,
    xpIntoRank,
    xpToNextRank,
    nextRankName: next ? next.name : null,
    progressPercent: next ? Math.min(100, Math.round((xpIntoRank / span) * 100)) : 100,
  };
};

/** SpacePort Level = highest level whose requirements (and all below) are all met. */
const resolveSpaceportLevels = (
  metrics: SpaceportProgressionMetrics
): {
  currentLevel: number;
  currentLevelName: string;
  nextLevel: number | null;
  nextLevelName: string | null;
  levels: SpaceportLevelView[];
} => {
  const rules = [...SPACEPORT_LEVEL_RULES].sort((a, b) => a.level - b.level);

  const evaluated = rules.map((rule) => {
    const requirements: SpaceportLevelRequirementProgress[] = rule.requirements.map((req) => {
      const current = normalizeMetric((metrics as any)[req.metric]);
      const met = current >= req.required;
      return {
        metric: req.metric,
        label: req.label,
        required: req.required,
        current,
        met,
        progressPercent: toPercent(current, req.required),
      };
    });
    const metRequirements = requirements.filter((r) => r.met).length;
    const totalRequirements = requirements.length;
    const reached = totalRequirements === 0 || metRequirements === totalRequirements;
    return { rule, requirements, metRequirements, totalRequirements, reached };
  });

  let currentLevel = 1;
  for (const e of evaluated) {
    if (e.reached) currentLevel = e.rule.level;
    else break;
  }
  const currentName = rules.find((r) => r.level === currentLevel)?.name || rules[0].name;
  const nextRule = rules.find((r) => r.level === currentLevel + 1) || null;

  const levels: SpaceportLevelView[] = evaluated.map((e) => ({
    level: e.rule.level,
    name: e.rule.name,
    reached: e.rule.level <= currentLevel,
    isCurrent: e.rule.level === currentLevel,
    isNext: nextRule ? e.rule.level === nextRule.level : false,
    requirements: e.requirements,
    metRequirements: e.metRequirements,
    totalRequirements: e.totalRequirements,
    privileges: e.rule.privileges,
  }));

  return {
    currentLevel,
    currentLevelName: currentName,
    nextLevel: nextRule ? nextRule.level : null,
    nextLevelName: nextRule ? nextRule.name : null,
    levels,
  };
};

const STAKING_DAILY_XP_TIERS = [
  { days: 30, xpPerDay: 5 },
  { days: 60, xpPerDay: 6 },
  { days: 90, xpPerDay: 8 },
  { days: Number.POSITIVE_INFINITY, xpPerDay: 10 },
];

const STAKING_MILESTONE_BONUSES = [
  { days: 30, xp: 100 },
  { days: 60, xp: 150 },
  { days: 120, xp: 250 },
  { days: 180, xp: 400 },
  { days: 365, xp: 800 },
  { days: 540, xp: 1200 },
];

const ADDITIONAL_STAKED_NFT_BONUS_XP = 15;
// Rewards are measured in STAKING DAYS — the single source of truth.
// The "MIN" prototype unit and the independent hardcoded milestone list were removed (P0).
const SPACEPORT_REWARD_TIME_CONFIG = {
  unitSeconds: 86400,
  unitLabel: "days",
  unitName: "Day",
} as const;
// Fallback mirrors DEFAULT_SPACEPORT_MILESTONES; live values come from admin SpaceportConfig.milestones (days).
const DEFAULT_REWARD_MILESTONES_DAYS: { days: number; xp: number }[] = [
  { days: 30, xp: 15 },
  { days: 60, xp: 15 },
  { days: 90, xp: 20 },
  { days: 180, xp: 30 },
  { days: 365, xp: 50 },
  { days: 540, xp: 60 },
  { days: 730, xp: 80 },
];

// P0: legacy Spaceport badge rules removed as a source of truth. Badges now come
// exclusively from the Universal Badge Engine (badge_definitions). Kept inert below.
const SPACEPORT_BADGE_RULES: SpaceportBadgeRule[] = [];
const _LEGACY_SPACEPORT_BADGE_RULES_REMOVED = [
  {
    key: "nova",
    name: "Nova",
    requirements: [
      { metric: "stakingDays", required: 30, label: "NFT in staking 30+ days" },
      { metric: "xp", required: 100, label: "Total XP 100+" },
      { metric: "tasks", required: 1, label: "1+ platform task completed" },
    ],
  },
  {
    key: "quasar",
    name: "Quasar",
    requirements: [
      { metric: "stakingDays", required: 60, label: "NFT in staking 60+ days" },
      { metric: "xp", required: 250, label: "Total XP 250+" },
      { metric: "otcVolumeUsd", required: 1000, label: "OTC volume $1,000+" },
    ],
  },
  {
    key: "nebula",
    name: "Nebula",
    requirements: [
      { metric: "stakingDays", required: 120, label: "NFT in staking 120+ days" },
      { metric: "xp", required: 600, label: "Total XP 600+" },
      { metric: "launchpads", required: 1, label: "1+ launchpad participation" },
    ],
  },
  {
    key: "pulsar",
    name: "Pulsar",
    requirements: [
      { metric: "stakingDays", required: 180, label: "NFT in staking 180+ days" },
      { metric: "xp", required: 1200, label: "Total XP 1,200+" },
      { metric: "tasks", required: 3, label: "3+ platform tasks completed" },
      { metric: "otcVolumeUsd", required: 5000, label: "OTC volume $5,000+" },
    ],
  },
  {
    key: "supernova",
    name: "Supernova",
    requirements: [
      { metric: "stakingDays", required: 270, label: "NFT in staking 270+ days" },
      { metric: "xp", required: 2000, label: "Total XP 2,000+" },
      { metric: "launchpads", required: 2, label: "2+ launchpad participations" },
      { metric: "primeProjects", required: 1, label: "1 Prime project closed" },
    ],
  },
  {
    key: "galaxy",
    name: "Galaxy",
    requirements: [
      { metric: "stakingDays", required: 365, label: "NFT in staking 365+ days" },
      { metric: "xp", required: 3500, label: "Total XP 3,500+" },
      { metric: "otcVolumeUsd", required: 25000, label: "OTC volume $25,000+" },
      { metric: "launchpads", required: 3, label: "3+ launchpad participations" },
      { metric: "tasks", required: 5, label: "5+ platform tasks completed" },
    ],
  },
  {
    key: "cosmos",
    name: "Cosmos",
    requirements: [
      { metric: "stakingDays", required: 540, label: "NFT in staking 540+ days" },
      { metric: "xp", required: 7000, label: "Total XP 7,000+" },
      { metric: "otcVolumeUsd", required: 50000, label: "OTC volume $50,000+" },
      { metric: "launchpads", required: 5, label: "5+ launchpad participations" },
      { metric: "primeProjects", required: 2, label: "2 Prime projects closed" },
      { metric: "accountLevel", required: 5, label: "Account level Legend" },
    ],
  },
];

const normalizeMetric = (value: unknown): number => {
  const numericValue = Number(value || 0);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0;
  }

  return numericValue;
};

const toPercent = (current: number, required: number): number => {
  if (required <= 0) {
    return 100;
  }

  return Math.max(0, Math.min(100, Math.round((current / required) * 100)));
};

const calculateDailyStakingXp = (totalStakingDays: number): number => {
  let remainingDays = Math.max(0, Math.floor(totalStakingDays));
  let totalXp = 0;

  for (const tier of STAKING_DAILY_XP_TIERS) {
    if (remainingDays <= 0) {
      break;
    }

    const tierDays = Number.isFinite(tier.days)
      ? Math.min(remainingDays, tier.days)
      : remainingDays;

    totalXp += tierDays * tier.xpPerDay;
    remainingDays -= tierDays;
  }

  return totalXp;
};

const calculateMilestoneBonusXp = (totalStakingDays: number): number => {
  return STAKING_MILESTONE_BONUSES.reduce((sum, milestone) => {
    return sum + (totalStakingDays >= milestone.days ? milestone.xp : 0);
  }, 0);
};

const calculateStakingProgress = (
  stakingSummary: Record<string, SpaceportStakingSummaryEntry>
) => {
  const summaryEntries = Object.values(stakingSummary || {});
  const totalStakingSeconds = summaryEntries.reduce((sum, item) => {
    return sum + Math.max(0, Math.trunc(normalizeMetric(item?.totalSeconds)));
  }, 0);
  const totalStakingDays = Math.floor(totalStakingSeconds / 86400);
  const stakedNfts = summaryEntries.filter((item) => {
    return normalizeMetric(item?.totalSeconds) > 0 || Boolean(item?.isCurrentlyStaked);
  }).length;
  const additionalNftBonusXp =
    Math.max(0, stakedNfts - 1) * ADDITIONAL_STAKED_NFT_BONUS_XP;
  const dailyStakingXp = calculateDailyStakingXp(totalStakingDays);
  const milestoneBonusXp = calculateMilestoneBonusXp(totalStakingDays);
  const totalXp = dailyStakingXp + milestoneBonusXp + additionalNftBonusXp;

  return {
    totalStakingSeconds,
    totalStakingDays,
    stakedNfts,
    dailyStakingXp,
    milestoneBonusXp,
    additionalNftBonusXp,
    totalXp,
  };
};

const normalizeClaimedBadges = (
  claimedBadges: Array<Partial<SpaceportClaimedBadgeEntry>> | undefined
): Map<SpaceportBadgeKey, SpaceportClaimedBadgeEntry> => {
  const claimedBadgeMap = new Map<SpaceportBadgeKey, SpaceportClaimedBadgeEntry>();

  for (const badge of claimedBadges || []) {
    const key = String(badge?.key || "").trim().toLowerCase() as SpaceportBadgeKey;

    if (!SPACEPORT_BADGE_KEYS.includes(key)) {
      continue;
    }

    claimedBadgeMap.set(key, {
      key,
      claimedAt: badge?.claimedAt ? new Date(badge.claimedAt) : new Date(),
      xpAwarded: normalizeMetric(badge?.xpAwarded),
    });
  }

  return claimedBadgeMap;
};

const normalizeClaimedRewards = (
  claimedRewards: Array<Partial<SpaceportClaimedRewardEntry>> | undefined
): Map<string, SpaceportClaimedRewardEntry> => {
  const claimedRewardMap = new Map<string, SpaceportClaimedRewardEntry>();

  for (const reward of claimedRewards || []) {
    const key = String(reward?.key || "").trim().toLowerCase();

    if (!key) {
      continue;
    }

    claimedRewardMap.set(key, {
      key,
      claimedAt: reward?.claimedAt ? new Date(reward.claimedAt) : new Date(),
      xpAwarded: normalizeMetric(reward?.xpAwarded),
    });
  }

  return claimedRewardMap;
};

const getStakingRewardRequirementText = (requiredUnits: number): string => {
  return `Stake for ${requiredUnits} ${SPACEPORT_REWARD_TIME_CONFIG.unitLabel}`;
};

export const isSpaceportBadgeKey = (value: unknown): value is SpaceportBadgeKey => {
  return SPACEPORT_BADGE_KEYS.includes(String(value || "").trim().toLowerCase() as SpaceportBadgeKey);
};

/**
 * PUBLIC (unauthenticated) SpacePort level ladder + global XP rank config.
 *
 * Derived from the SAME single source of truth (SPACEPORT_LEVEL_RULES and
 * DEFAULT_XP_RANKS). Metrics are zeroed so the public website can render the
 * Lv.1–Lv.5 ladder, the real level requirements and the "What You Unlock"
 * privileges WITHOUT hardcoding anything on the frontend and WITHOUT a signed-in
 * session. There is NO separate SpacePort XP scale here — only real level
 * requirements (staking days, global activityXP, NFT staking, Launchpad, Trade).
 */
export const getSpaceportLevelsConfig = (): {
  levels: SpaceportLevelView[];
  globalXpRanks: Array<{
    key: string;
    name: string;
    order: number;
    minXp: number;
    maxXp: number;
    icon: string;
  }>;
} => {
  const zeroMetrics: SpaceportProgressionMetrics = {
    xp: 0,
    stakingDays: 0,
    stakedNfts: 0,
    tasks: 0,
    otcVolumeUsd: 0,
    launchpads: 0,
    primeProjects: 0,
    accountLevel: 0,
  };

  const resolution = resolveSpaceportLevels(zeroMetrics);

  const globalXpRanks = [...DEFAULT_XP_RANKS]
    .filter((rank) => (rank as any).enabled !== false)
    .sort((a, b) => a.order - b.order)
    .map((rank) => ({
      key: rank.key,
      name: rank.name,
      order: rank.order,
      minXp: rank.minXp,
      maxXp: rank.maxXp,
      icon: rank.icon,
    }));

  return { levels: resolution.levels, globalXpRanks };
};

export const buildSpaceportProgression = (params: {
  stakingSummary?: Record<string, SpaceportStakingSummaryEntry>;
  xp?: unknown;
  claimedStakingXp?: unknown;
  claimedBadges?: Array<Partial<SpaceportClaimedBadgeEntry>>;
  claimedRewards?: Array<Partial<SpaceportClaimedRewardEntry>>;
  tasks?: unknown;
  otcVolumeUsd?: unknown;
  launchpads?: unknown;
  primeProjects?: unknown;
  /** Canonical admin-editable staking-reward milestones (days). Single source of truth. */
  milestones?: { days: number; xp: number; active?: boolean }[];
}): SpaceportProgressionData => {
  const stakingProgress = calculateStakingProgress(params.stakingSummary || {});
  const activityXp = normalizeMetric(params.xp);
  const claimedStakingXp = normalizeMetric(params.claimedStakingXp);
  const pendingStakingXp = Math.max(0, stakingProgress.totalXp - claimedStakingXp);
  const effectiveXp = activityXp + pendingStakingXp;
  const tasks = normalizeMetric(params.tasks);
  const otcVolumeUsd = normalizeMetric(params.otcVolumeUsd);
  const launchpads = normalizeMetric(params.launchpads);
  const primeProjects = normalizeMetric(params.primeProjects);
  const claimedBadgeMap = normalizeClaimedBadges(params.claimedBadges);
  const claimedRewardMap = normalizeClaimedRewards(params.claimedRewards);
  const totalStakingRewardUnits = Math.floor(
    stakingProgress.totalStakingSeconds / SPACEPORT_REWARD_TIME_CONFIG.unitSeconds
  );

  // Metrics that drive BOTH the SpacePort level requirements and badges.
  // metrics.xp is the GLOBAL activityXP (single XP scale) — the SpacePort level
  // uses it as ONE of its conditions; it is NOT a separate SpacePort XP balance.
  const metrics: SpaceportProgressionMetrics = {
    xp: activityXp,
    stakingDays: stakingProgress.totalStakingDays,
    stakedNfts: stakingProgress.stakedNfts,
    tasks,
    otcVolumeUsd,
    launchpads,
    primeProjects,
    accountLevel: 0,
  };

  // Global user rank (Stellar…Universal) resolved from activityXP (0–1000).
  const globalXp = resolveGlobalXpRank(activityXp);

  // SpacePort Level (status ladder) resolved from combined requirements.
  const levelResolution = resolveSpaceportLevels(metrics);
  metrics.accountLevel = levelResolution.currentLevel;
  const effectiveLevel = { level: levelResolution.currentLevel };

  const badges = SPACEPORT_BADGE_RULES.reduce((acc, badgeRule) => {
    const requirements = badgeRule.requirements.map((requirement) => {
      let current = normalizeMetric(metrics[requirement.metric]);

      if (requirement.metric === "xp") {
        current = effectiveXp;
      }

      if (requirement.metric === "accountLevel") {
        current = effectiveLevel.level;
      }

      const complete = current >= requirement.required;

      return {
        metric: requirement.metric,
        label: requirement.label,
        required: requirement.required,
        current,
        complete,
        progressPercent: toPercent(current, requirement.required),
      };
    });

    const completedRequirements = requirements.filter((item) => item.complete).length;
    const totalRequirements = requirements.length;
    const progressPercent =
      totalRequirements > 0
        ? Math.round(
            requirements.reduce((sum, item) => sum + item.progressPercent, 0) /
              totalRequirements
          )
        : 0;
    const eligible = completedRequirements === totalRequirements && totalRequirements > 0;
    const claimedBadge = claimedBadgeMap.get(badgeRule.key) || null;
    const claimed = Boolean(claimedBadge);
    const claimable = eligible && !claimed;

    acc[badgeRule.key] = {
      key: badgeRule.key,
      name: badgeRule.name,
      earned: claimed,
      eligible,
      claimed,
      claimable,
      claimedAt: claimedBadge?.claimedAt || null,
      xpReward: pendingStakingXp,
      progressPercent,
      completedRequirements,
      totalRequirements,
      requirementText: badgeRule.requirements.map((item) => item.label).join(" | "),
      progressLabel: claimed
        ? "Claimed"
        : claimable
          ? "Ready to claim"
          : `${completedRequirements}/${totalRequirements} requirements completed`,
      requirements,
    };

    return acc;
  }, {} as Record<SpaceportBadgeKey, SpaceportBadgeProgress>);

  const earnedBadgesCount = Object.values(badges).filter((badge) => badge.claimed).length;
  const rewardMilestonesSource =
    Array.isArray(params.milestones) && params.milestones.length > 0
      ? params.milestones.filter((m) => m.active !== false)
      : DEFAULT_REWARD_MILESTONES_DAYS;
  const rewardMilestones = rewardMilestonesSource
    .map((m) => ({ key: `stake-${Number(m.days)}`, requiredUnits: Number(m.days), xp: Number(m.xp || 0) }))
    .sort((a, b) => a.requiredUnits - b.requiredUnits);

  const stakingRewards: SpaceportStakingRewardProgress[] =
    rewardMilestones.map((milestone) => {
      const claimedReward = claimedRewardMap.get(milestone.key) || null;
      const claimed = Boolean(claimedReward);
      const claimable = totalStakingRewardUnits >= milestone.requiredUnits && !claimed;
      const progressUnits = Math.min(totalStakingRewardUnits, milestone.requiredUnits);

      return {
        key: milestone.key,
        name: `${milestone.requiredUnits} ${SPACEPORT_REWARD_TIME_CONFIG.unitLabel}`,
        requirementText: getStakingRewardRequirementText(milestone.requiredUnits),
        rewardXp: milestone.xp,
        requiredUnits: milestone.requiredUnits,
        currentUnits: totalStakingRewardUnits,
        unitLabel: SPACEPORT_REWARD_TIME_CONFIG.unitLabel,
        claimed,
        claimable,
        claimedAt: claimedReward?.claimedAt || null,
        progressPercent: toPercent(progressUnits, milestone.requiredUnits),
        progressLabel: `${progressUnits}/${milestone.requiredUnits} ${SPACEPORT_REWARD_TIME_CONFIG.unitLabel}`,
      };
    });

  return {
    currentLevel: levelResolution.currentLevel,
    currentLevelName: levelResolution.currentLevelName,
    nextLevel: levelResolution.nextLevel,
    nextLevelName: levelResolution.nextLevelName,
    earnedBadgesCount,
    totalStakingSeconds: stakingProgress.totalStakingSeconds,
    totalStakingDays: stakingProgress.totalStakingDays,
    totalStakingRewardUnits,
    stakingRewardUnitLabel: SPACEPORT_REWARD_TIME_CONFIG.unitLabel,
    stakingRewardUnitSeconds: SPACEPORT_REWARD_TIME_CONFIG.unitSeconds,
    updatedAt: new Date(),
    metrics,
    xpBreakdown: {
      activityXp,
      dailyStakingXp: stakingProgress.dailyStakingXp,
      milestoneBonusXp: stakingProgress.milestoneBonusXp,
      additionalNftBonusXp: stakingProgress.additionalNftBonusXp,
      claimedStakingXp,
      pendingStakingXp,
      totalStakingXp: stakingProgress.totalXp,
      effectiveXp,
      otherXp: activityXp,
      totalXp: effectiveXp,
    },
    globalXp,
    levels: levelResolution.levels,
    badges,
    stakingRewards,
  };
};
