import { BadgeCategory, BadgeRarity } from "./models/badge-definition.model";

export interface SeedBadge {
  code: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: string;
  rarity: BadgeRarity;
  awardMode: "automatic" | "manual" | "both";
  criteria: {
    logic: "AND" | "OR";
    conditions: Array<{ metric: string; op: ">=" | ">" | "=" | "<=" | "<"; value: number; unit?: string; label?: string }>;
  };
  xpReward?: number;
  displayPriority?: number;
  hiddenProgress?: boolean;
  retentionMode?: "permanent" | "dynamic";
}

/**
 * Starter platform-wide badge catalog. All values are admin-editable afterwards.
 * Badges are NOT XP ranks and NOT SpacePort levels — they are achievements.
 * xpReward defaults to 0 to avoid double counting with the XP ledger.
 */
export const DEFAULT_BADGE_DEFINITIONS: SeedBadge[] = [
  // ---------------- STAKING (migrated from SPACEPORT_BADGE_RULES) ----------------
  {
    code: "staking-90",
    name: "90 Days Staker",
    description: "Kept NFTs staked for 90+ days.",
    category: "STAKING",
    icon: "nova",
    rarity: "common",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "stakingDays", op: ">=", value: 90, unit: "days", label: "Confirmed staking" }] },
    displayPriority: 10,
  },
  {
    code: "staking-180",
    name: "180 Days Staker",
    description: "Kept NFTs staked for 180+ days.",
    category: "STAKING",
    icon: "nebula",
    rarity: "uncommon",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "stakingDays", op: ">=", value: 180, unit: "days", label: "Confirmed staking" }] },
    displayPriority: 11,
  },
  {
    code: "staking-365",
    name: "365 Days Staker",
    description: "A full year of staking commitment.",
    category: "STAKING",
    icon: "pulsar",
    rarity: "rare",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "stakingDays", op: ">=", value: 365, unit: "days", label: "Confirmed staking" }] },
    displayPriority: 12,
  },
  {
    code: "staking-730",
    name: "730 Days Staker",
    description: "Two years of unbroken staking.",
    category: "STAKING",
    icon: "galaxy",
    rarity: "epic",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "stakingDays", op: ">=", value: 730, unit: "days", label: "Confirmed staking" }] },
    displayPriority: 13,
  },

  // ---------------- TRADE (OTC / P2P) ----------------
  {
    code: "trade-first",
    name: "First Trade",
    description: "Completed your first confirmed trade.",
    category: "TRADE",
    icon: "P2P Pro",
    rarity: "common",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "tradesCompleted", op: ">=", value: 1, unit: "trades", label: "Confirmed trades" }] },
    displayPriority: 20,
  },
  {
    code: "trade-25",
    name: "Active Trader",
    description: "Completed 25+ confirmed trades.",
    category: "TRADE",
    icon: "Market Maker",
    rarity: "uncommon",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "tradesCompleted", op: ">=", value: 25, unit: "trades", label: "Confirmed trades" }] },
    displayPriority: 21,
  },
  {
    code: "trade-100",
    name: "Market Maker",
    description: "100+ trades with diverse counterparties.",
    category: "TRADE",
    icon: "Market Maker",
    rarity: "rare",
    awardMode: "automatic",
    criteria: {
      logic: "AND",
      conditions: [
        { metric: "tradesCompleted", op: ">=", value: 100, unit: "trades", label: "Confirmed trades" },
        { metric: "uniqueCounterparties", op: ">=", value: 30, unit: "counterparties", label: "Unique counterparties" },
      ],
    },
    displayPriority: 22,
  },
  {
    code: "trade-p2p-pro",
    name: "P2P Pro",
    description: "High trade score with strong volume.",
    category: "TRADE",
    icon: "P2P Pro",
    rarity: "epic",
    awardMode: "automatic",
    criteria: {
      logic: "AND",
      conditions: [
        { metric: "tradeScore", op: ">=", value: 80, unit: "score", label: "Trade score" },
        { metric: "otcVolumeUsd", op: ">=", value: 5000, unit: "USD", label: "OTC volume" },
      ],
    },
    displayPriority: 23,
  },

  // ---------------- ACTIVITY ----------------
  {
    code: "activity-30",
    name: "Consistent",
    description: "30 qualified active days.",
    category: "ACTIVITY",
    icon: "Hot Streak",
    rarity: "common",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "activeDays30", op: ">=", value: 20, unit: "days", label: "Active days (30d window)" }] },
    displayPriority: 30,
  },
  {
    code: "activity-90",
    name: "Dedicated",
    description: "90 qualified active days.",
    category: "ACTIVITY",
    icon: "Hot Streak",
    rarity: "uncommon",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "activeDays90", op: ">=", value: 60, unit: "days", label: "Active days (90d window)" }] },
    displayPriority: 31,
  },
  {
    code: "activity-365",
    name: "Veteran",
    description: "365 qualified active days.",
    category: "ACTIVITY",
    icon: "XP Pioneer",
    rarity: "rare",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "activeDays365", op: ">=", value: 240, unit: "days", label: "Active days (365d window)" }] },
    displayPriority: 32,
  },
  {
    code: "activity-xp-pioneer",
    name: "XP Pioneer",
    description: "Reached a strong lifetime XP milestone.",
    category: "ACTIVITY",
    icon: "XP Pioneer",
    rarity: "rare",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "xp", op: ">=", value: 600, unit: "XP", label: "Total XP" }] },
    displayPriority: 33,
  },
  {
    code: "activity-onboarding-master",
    name: "Onboarding Master",
    description: "Completed the full onboarding journey.",
    category: "ACTIVITY",
    icon: "Onboarding Master",
    rarity: "common",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "tasks", op: ">=", value: 5, unit: "tasks", label: "Platform tasks completed" }] },
    displayPriority: 34,
  },

  // ---------------- REFERRAL ----------------
  {
    code: "referral-5",
    name: "Connector",
    description: "5 qualified referrals.",
    category: "REFERRAL",
    icon: "Community Star",
    rarity: "common",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "qualifiedReferralsL1", op: ">=", value: 5, unit: "referrals", label: "Qualified referrals" }] },
    displayPriority: 40,
  },
  {
    code: "referral-20",
    name: "Community Star",
    description: "20 qualified referrals.",
    category: "REFERRAL",
    icon: "Community Star",
    rarity: "rare",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "qualifiedReferralsL1", op: ">=", value: 20, unit: "referrals", label: "Qualified referrals" }] },
    displayPriority: 41,
  },
  {
    code: "referral-50",
    name: "Growth Engine",
    description: "50 qualified referrals.",
    category: "REFERRAL",
    icon: "Community Star",
    rarity: "epic",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "qualifiedReferralsL1", op: ">=", value: 50, unit: "referrals", label: "Qualified referrals" }] },
    displayPriority: 42,
  },

  // ---------------- NFT ----------------
  {
    code: "nft-holder",
    name: "NFT Holder",
    description: "Holds an active FOMO NFT entitlement.",
    category: "NFT",
    icon: "Singularity",
    rarity: "common",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "nftActive", op: ">=", value: 1, unit: "", label: "Active NFT entitlement" }] },
    displayPriority: 50,
  },
  {
    code: "nft-long-term",
    name: "Long-term Member",
    description: "180+ days of active NFT membership.",
    category: "NFT",
    icon: "Singularity",
    rarity: "rare",
    awardMode: "automatic",
    criteria: {
      logic: "AND",
      conditions: [
        { metric: "nftActive", op: ">=", value: 1, unit: "", label: "Active NFT entitlement" },
        { metric: "nftMembershipDays", op: ">=", value: 180, unit: "days", label: "Membership age" },
      ],
    },
    displayPriority: 51,
  },

  // ---------------- EARLYLAND ----------------
  {
    code: "earlyland-first",
    name: "EarlyLand Explorer",
    description: "Completed your first verified EarlyLand campaign.",
    category: "EARLYLAND",
    icon: "Project Reviewer",
    rarity: "common",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "verifiedCampaigns", op: ">=", value: 1, unit: "campaigns", label: "Verified campaigns" }] },
    displayPriority: 60,
  },
  {
    code: "earlyland-5",
    name: "EarlyLand Regular",
    description: "5 verified EarlyLand campaigns.",
    category: "EARLYLAND",
    icon: "Project Reviewer",
    rarity: "uncommon",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "verifiedCampaigns", op: ">=", value: 5, unit: "campaigns", label: "Verified campaigns" }] },
    displayPriority: 61,
  },
  {
    code: "earlyland-20",
    name: "EarlyLand Champion",
    description: "20 verified EarlyLand campaigns.",
    category: "EARLYLAND",
    icon: "Project Reviewer",
    rarity: "epic",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "verifiedCampaigns", op: ">=", value: 20, unit: "campaigns", label: "Verified campaigns" }] },
    displayPriority: 62,
  },

  // ---------------- PORTFOLIO / CONTENT / CONTRIBUTION ----------------
  {
    code: "portfolio-active",
    name: "Portfolio Author",
    description: "Maintains an active public portfolio.",
    category: "PORTFOLIO",
    icon: "Community Star",
    rarity: "uncommon",
    awardMode: "automatic",
    criteria: {
      logic: "AND",
      conditions: [
        { metric: "publicPortfolio", op: ">=", value: 1, unit: "", label: "Public portfolio" },
        { metric: "portfolioAgeDays", op: ">=", value: 90, unit: "days", label: "Portfolio age" },
        { metric: "qualifiedPortfolioUpdates", op: ">=", value: 10, unit: "updates", label: "Qualified updates" },
      ],
    },
    displayPriority: 70,
  },
  {
    code: "content-creator",
    name: "Content Creator",
    description: "Published meaningful ideas with engagement.",
    category: "CONTENT",
    icon: "Community Star",
    rarity: "rare",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "publishedIdeas", op: ">=", value: 10, unit: "ideas", label: "Published ideas" }] },
    displayPriority: 71,
  },
  {
    code: "contribution-reviewer",
    name: "Project Reviewer",
    description: "Verified reports and accepted corrections.",
    category: "CONTRIBUTION",
    icon: "Project Reviewer",
    rarity: "rare",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "verifiedReports", op: ">=", value: 5, unit: "reports", label: "Verified reports" }] },
    displayPriority: 72,
  },

  // ---------------- LAUNCHPAD ----------------
  {
    code: "launchpad-backer",
    name: "Launchpad Backer",
    description: "Participated in launchpad rounds.",
    category: "LAUNCHPAD",
    icon: "Top Predictor",
    rarity: "uncommon",
    awardMode: "automatic",
    criteria: { logic: "AND", conditions: [{ metric: "launchpads", op: ">=", value: 3, unit: "rounds", label: "Launchpad participations" }] },
    displayPriority: 80,
  },

  // ---------------- SPECIAL (manual only) ----------------
  {
    code: "special-founding-member",
    name: "Founding Member",
    description: "Recognized founding member of FOMO.",
    category: "SPECIAL",
    icon: "Singularity",
    rarity: "legendary",
    awardMode: "manual",
    criteria: { logic: "AND", conditions: [] },
    displayPriority: 1,
    hiddenProgress: true,
  },
  {
    code: "special-ambassador",
    name: "Ambassador",
    description: "Official FOMO ambassador.",
    category: "SPECIAL",
    icon: "Community Star",
    rarity: "legendary",
    awardMode: "manual",
    criteria: { logic: "AND", conditions: [] },
    displayPriority: 2,
    hiddenProgress: true,
  },
  {
    code: "special-event-winner",
    name: "Event Winner",
    description: "Winner of an official FOMO event.",
    category: "SPECIAL",
    icon: "Top Predictor",
    rarity: "legendary",
    awardMode: "manual",
    criteria: { logic: "AND", conditions: [] },
    displayPriority: 3,
    hiddenProgress: true,
  },

  // ---------------- MIGRATED legacy SpacePort achievements (Nova..Cosmos) ----------------
  {
    code: "nova", name: "Nova", description: "SpacePort achievement: early staking + XP + first task.",
    category: "SPACEPORT" as any, icon: "nova", rarity: "common", awardMode: "automatic", retentionMode: "permanent",
    criteria: { logic: "AND", conditions: [
      { metric: "stakingDays", op: ">=", value: 30, unit: "days", label: "NFT in staking 30+ days" },
      { metric: "xp", op: ">=", value: 100, unit: "XP", label: "Total XP 100+" },
      { metric: "tasks", op: ">=", value: 1, unit: "tasks", label: "1+ platform task" },
    ] }, displayPriority: 90,
  },
  {
    code: "quasar", name: "Quasar", description: "SpacePort achievement.", category: "SPACEPORT" as any,
    icon: "quasar", rarity: "uncommon", awardMode: "automatic", retentionMode: "permanent",
    criteria: { logic: "AND", conditions: [
      { metric: "stakingDays", op: ">=", value: 60, unit: "days" },
      { metric: "xp", op: ">=", value: 250, unit: "XP" },
      { metric: "otcVolumeUsd", op: ">=", value: 1000, unit: "USD" },
    ] }, displayPriority: 91,
  },
  {
    code: "nebula", name: "Nebula", description: "SpacePort achievement.", category: "SPACEPORT" as any,
    icon: "nebula", rarity: "uncommon", awardMode: "automatic", retentionMode: "permanent",
    criteria: { logic: "AND", conditions: [
      { metric: "stakingDays", op: ">=", value: 120, unit: "days" },
      { metric: "xp", op: ">=", value: 600, unit: "XP" },
      { metric: "launchpads", op: ">=", value: 1, unit: "rounds" },
    ] }, displayPriority: 92,
  },
  {
    code: "pulsar", name: "Pulsar", description: "SpacePort achievement.", category: "SPACEPORT" as any,
    icon: "pulsar", rarity: "rare", awardMode: "automatic", retentionMode: "permanent",
    criteria: { logic: "AND", conditions: [
      { metric: "stakingDays", op: ">=", value: 180, unit: "days" },
      { metric: "xp", op: ">=", value: 1200, unit: "XP" },
      { metric: "tasks", op: ">=", value: 3, unit: "tasks" },
      { metric: "otcVolumeUsd", op: ">=", value: 5000, unit: "USD" },
    ] }, displayPriority: 93,
  },
  {
    code: "supernova", name: "Supernova", description: "SpacePort achievement.", category: "SPACEPORT" as any,
    icon: "supernova", rarity: "epic", awardMode: "automatic", retentionMode: "permanent",
    criteria: { logic: "AND", conditions: [
      { metric: "stakingDays", op: ">=", value: 270, unit: "days" },
      { metric: "xp", op: ">=", value: 2000, unit: "XP" },
      { metric: "launchpads", op: ">=", value: 2, unit: "rounds" },
      { metric: "primeProjects", op: ">=", value: 1, unit: "projects" },
    ] }, displayPriority: 94,
  },
  {
    code: "galaxy", name: "Galaxy", description: "SpacePort achievement.", category: "SPACEPORT" as any,
    icon: "galaxy", rarity: "epic", awardMode: "automatic", retentionMode: "permanent",
    criteria: { logic: "AND", conditions: [
      { metric: "stakingDays", op: ">=", value: 365, unit: "days" },
      { metric: "xp", op: ">=", value: 3500, unit: "XP" },
      { metric: "otcVolumeUsd", op: ">=", value: 25000, unit: "USD" },
      { metric: "launchpads", op: ">=", value: 3, unit: "rounds" },
      { metric: "tasks", op: ">=", value: 5, unit: "tasks" },
    ] }, displayPriority: 95,
  },
  {
    code: "cosmos", name: "Cosmos", description: "SpacePort achievement: the pinnacle.", category: "SPACEPORT" as any,
    icon: "cosmos", rarity: "legendary", awardMode: "automatic", retentionMode: "permanent",
    criteria: { logic: "AND", conditions: [
      { metric: "stakingDays", op: ">=", value: 540, unit: "days" },
      { metric: "xp", op: ">=", value: 7000, unit: "XP" },
      { metric: "otcVolumeUsd", op: ">=", value: 50000, unit: "USD" },
      { metric: "launchpads", op: ">=", value: 5, unit: "rounds" },
      { metric: "primeProjects", op: ">=", value: 2, unit: "projects" },
      { metric: "accountLevel", op: ">=", value: 5, unit: "level" },
    ] }, displayPriority: 96,
  },
];
