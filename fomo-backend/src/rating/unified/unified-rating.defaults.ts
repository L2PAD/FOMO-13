/**
 * Unified Rating Engine v2 — default configuration.
 *
 * All weights/limits/thresholds map 1:1 to /app/memory/RATING_SPEC_FINAL.md.
 * Admins can override these through the rating config API.
 */
import {
  UNIFIED_FORMULA_VERSION,
  UnifiedRatingConfig,
} from "./unified-rating.types";
import { buildDefaultSubFormulas } from "./unified-rating.subformulas.defaults";

const FUND_TIERS = [
  { key: "TIER_4", label: "Tier 4", min: 0, max: 40 },
  { key: "TIER_3", label: "Tier 3", min: 41, max: 70 },
  { key: "TIER_2", label: "Tier 2", min: 71, max: 90 },
  { key: "TIER_1", label: "Tier 1", min: 91, max: 100 },
];

const QUALITY_CATEGORIES = [
  { key: "LOW", label: "Low", min: 0, max: 40 },
  { key: "MEDIUM", label: "Medium", min: 41, max: 60 },
  { key: "HIGH", label: "High", min: 61, max: 80 },
  { key: "VERY_HIGH", label: "Very High", min: 81, max: 100 },
];

const INFLUENCER_RANKS = [
  { key: "NOVICE", label: "Новичок", min: 0, max: 9 },
  { key: "TRAVELER", label: "Путешественник", min: 10, max: 29 },
  { key: "MENTOR", label: "Наставник", min: 30, max: 49 },
  { key: "INFLUENCER", label: "Влиятельная персона", min: 50, max: 69 },
  { key: "OPINION_LEADER", label: "Лидер мнений", min: 70, max: 89 },
  { key: "LEGEND", label: "Легенда рынка", min: 90, max: 100 },
];

const TWITTER_CATEGORIES = [
  { key: "LOW", label: "Low", min: 0, max: 30 },
  { key: "MEDIUM", label: "Medium", min: 31, max: 60 },
  { key: "HIGH", label: "High", min: 61, max: 85 },
  { key: "VERY_HIGH", label: "Very High", min: 86, max: 100 },
];

const USER_LEVELS = [
  { key: "STARTER", label: "Начальный", min: 0, max: 19 },
  { key: "ACTIVE", label: "Активный", min: 20, max: 39 },
  { key: "ADVANCED", label: "Продвинутый", min: 40, max: 59 },
  { key: "HIGH", label: "Высокий", min: 60, max: 84 },
  { key: "MAX", label: "Максимальный", min: 85, max: 100 },
];

const TRADE_RANKS = [
  { key: "SHELL", label: "🐚 Ракушка", min: 0, max: 9 },
  { key: "SHRIMP", label: "🦐 Креветка", min: 10, max: 19 },
  { key: "JELLYFISH", label: "🪼 Медуза", min: 20, max: 34 },
  { key: "CRAB", label: "🦀 Краб", min: 35, max: 49 },
  { key: "FISH", label: "🐟 Рыба", min: 50, max: 64 },
  { key: "DOLPHIN", label: "🐬 Дельфин", min: 65, max: 79 },
  { key: "SHARK", label: "🦈 Акула", min: 80, max: 94 },
  { key: "WHALE", label: "🐋 Кит", min: 95, max: 100 },
];

const tradeDirection = (
  volumeThresholds: { at: number; points: number }[]
) => ({
  componentMax: { volume: 50, trades: 20, reviews: 20, counterparties: 10 },
  volumeThresholds,
  tradeThresholds: [
    { at: 1, points: 2 },
    { at: 5, points: 6 },
    { at: 10, points: 10 },
    { at: 25, points: 15 },
    { at: 50, points: 20 },
  ],
  counterpartyThresholds: [
    { at: 1, points: 1 },
    { at: 5, points: 4 },
    { at: 10, points: 6 },
    { at: 25, points: 8 },
    { at: 50, points: 10 },
  ],
});

export function buildDefaultUnifiedRatingConfig(): UnifiedRatingConfig {
  return {
    formulaVersion: UNIFIED_FORMULA_VERSION,
    batchSize: 200,
    subFormulas: buildDefaultSubFormulas(),
    collections: {
      funds: "funds",
      persons: "persons",
      projects: "canonical_projects",
      users: "users",
    },
    funds: {
      enabled: true,
      limits: {
        longevity: 25,
        majorDeals: 20,
        exits: 12.5,
        roi: 12.5,
        resilience: 15,
        compliance: 15,
      },
      rates: {
        majorDealPoints: 4,
        exitPoints: 2.5,
        roiThreshold: 4,
      },
      tiers: FUND_TIERS,
    },
    persons: {
      enabled: true,
      weights: {
        investingSuccess: 20,
        advisorSuccess: 15,
        twitter: 25,
        marketExperience: 10,
        projectActivity: 10,
        mediaActivity: 15,
        marketInfluence: 2.5,
        partnerships: 2.5,
      },
      categories: INFLUENCER_RANKS,
    },
    projects: {
      enabled: true,
      weights: {
        // Exact fractions of 100 (user-likes 10% removed, remainder x100/90).
        fundsQuality: (20 / 90) * 100,
        personsQuality: (15 / 90) * 100,
        developmentTeam: (10 / 90) * 100,
        tokenomics: (15 / 90) * 100,
        niche: (5 / 90) * 100,
        geography: (5 / 90) * 100,
        competitors: (10 / 90) * 100,
        twitter: (10 / 90) * 100,
      },
      redFlags: { first: 15, second: 5, subsequent: 2, max: 30 },
      categories: QUALITY_CATEGORIES,
    },
    users: {
      enabled: true,
      // New FOMO Score model: XP 40% + Trade 30% + Launchpad 20% + NFT/Subscription 10%.
      weights: {
        xpReputation: 40,
        tradeReputation: 30,
        launchpad: 20,
        nftSubscription: 10,
      },
      xpReputation: { activityXpMax: 1000 },
      nftSubscription: {
        hasNftPoints: 40,
        tierPoints: { basic: 0, higher: 20, premium: 40 },
        membershipDaysMax: 365,
        membershipPoints: 30,
        subscriptionContinuityPoints: 30,
      },
      launchpad: { enabled: true },
      riskPenalties: { redFlagPoint: 5, maxPenalty: 40 },
      platformActivity: {
        points: {
          createProject: 10,
          editProject: 5,
          earlylandTask: 3,
          socialAction: 2,
          createTab: 7,
          referralL1: 5,
          referralL2: 2,
          createEntity: 8,
        },
        maxPoints: 1000,
      },
      platformUser: {
        weights: {
          platformEngagement: 25,
          contentInteraction: 15,
          meaningfulContribution: 15,
          earlyland: 25,
          nft: 10,
          referrals: 10,
        },
      },
      trade: {
        otc: tradeDirection([
          { at: 0, points: 0 },
          { at: 5000, points: 15 },
          { at: 50000, points: 30 },
          { at: 250000, points: 40 },
          { at: 1000000, points: 50 },
        ]),
        p2p: tradeDirection([
          { at: 0, points: 0 },
          { at: 1000, points: 10 },
          { at: 10000, points: 25 },
          { at: 50000, points: 40 },
          { at: 250000, points: 50 },
        ]),
        // Shared core uses POOLED totals across both directions (higher caps).
        shared: tradeDirection([
          { at: 0, points: 0 },
          { at: 5000, points: 15 },
          { at: 50000, points: 30 },
          { at: 250000, points: 40 },
          { at: 1000000, points: 50 },
        ]),
        coreWeight: 0.7,
        experienceWeight: 0.3,
        reviewConfidence: [
          { at: 0, points: 0 },
          { at: 1, points: 0.25 },
          { at: 3, points: 0.5 },
          { at: 5, points: 0.7 },
          { at: 10, points: 0.9 },
          { at: 20, points: 1 },
        ],
        riskPenalties: { lostDispute: 5, repeatViolation: 10 },
        ranks: TRADE_RANKS,
      },
      ranks: USER_LEVELS,
    },
    twitter: {
      enabled: true,
      weights: {
        followers: 15,
        quality: 20,
        engagement: 30,
        frequency: 10,
        reputation: 10,
        cryptoInfluence: 10,
        tier1Audience: 5,
      },
      normalization: { followersMax: 1000000, engagementRateMax: 10 },
      categories: TWITTER_CATEGORIES,
    },
  };
}
