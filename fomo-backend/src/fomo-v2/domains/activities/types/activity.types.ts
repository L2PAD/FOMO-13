import { Types } from "mongoose";

export const FOMO_V2_ACTIVITY_LIFECYCLE_STATUSES = [
  "upcoming",
  "active",
  "ended",
  "cancelled",
] as const;

export const FOMO_V2_ACTIVITY_REVIEW_STATUSES = [
  "ingested",
  "pending_ai",
  "pending_human",
  "needs_changes",
  "approved",
  "rejected",
] as const;

export const FOMO_V2_ACTIVITY_PUBLICATION_STATUSES = [
  "draft",
  "published",
  "hidden",
  "archived",
] as const;

export const FOMO_V2_ACTIVITY_ACCESS_TIERS = ["public", "prime"] as const;

export const FOMO_V2_ACTIVITY_CANONICAL_STATUSES = [
  "unprocessed",
  "proposed",
  "verified",
  "rejected",
  "conflict",
  "no_candidates",
] as const;

export const FOMO_V2_ACTIVITY_AI_PROPOSAL_STATUSES = [
  "proposed",
  "accepted",
  "rejected",
] as const;

export const FOMO_V2_ACTIVITY_DIFFICULTIES = [
  "easy",
  "medium",
  "hard",
] as const;

export const FOMO_V2_ACTIVITY_TASK_FREQUENCIES = [
  "daily",
  "weekly",
  "monthly",
  "ongoing",
] as const;

export const FOMO_V2_ACTIVITY_AUDIT_ACTIONS = [
  "ingest",
  "edit",
  "ai_proposal",
  "approve",
  "publish",
  "reject",
  "hide",
  "unhide",
  "canonical_link",
  "canonical_unlink",
] as const;

export type FomoV2ActivityLifecycleStatus =
  (typeof FOMO_V2_ACTIVITY_LIFECYCLE_STATUSES)[number];
export type FomoV2ActivityReviewStatus =
  (typeof FOMO_V2_ACTIVITY_REVIEW_STATUSES)[number];
export type FomoV2ActivityPublicationStatus =
  (typeof FOMO_V2_ACTIVITY_PUBLICATION_STATUSES)[number];
export type FomoV2ActivityAccessTier =
  (typeof FOMO_V2_ACTIVITY_ACCESS_TIERS)[number];
export type FomoV2ActivityCanonicalStatus =
  (typeof FOMO_V2_ACTIVITY_CANONICAL_STATUSES)[number];
export type FomoV2ActivityAiProposalStatus =
  (typeof FOMO_V2_ACTIVITY_AI_PROPOSAL_STATUSES)[number];
export type FomoV2ActivityDifficulty =
  (typeof FOMO_V2_ACTIVITY_DIFFICULTIES)[number];
export type FomoV2ActivityTaskFrequency =
  (typeof FOMO_V2_ACTIVITY_TASK_FREQUENCIES)[number];
export type FomoV2ActivityAuditAction =
  (typeof FOMO_V2_ACTIVITY_AUDIT_ACTIONS)[number];

export interface FomoV2ActivityLink {
  label: string;
  url: string;
}

export interface FomoV2ActivitySocialLinks {
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  docs?: string;
  custom?: FomoV2ActivityLink[];
}

export interface FomoV2ActivityDescription {
  about?: string;
  aboutHtml?: string;
  howToParticipate?: string;
  howToParticipateHtml?: string;
}

export interface FomoV2ActivityReviewScore {
  label: string;
  value: number;
}

export interface FomoV2ActivityReview {
  text?: string;
  textHtml?: string;
  scores?: FomoV2ActivityReviewScore[];
  isLocked?: boolean;
}

export interface FomoV2ActivityMetrics {
  riskLevel?: string;
  complexity?: string;
  timeRequired?: string;
  potentialReward?: string;
}

export interface FomoV2ActivityTimelineItem {
  title: string;
  date?: Date;
  description?: string;
}

export interface FomoV2ActivityFlags {
  green?: string[];
  yellow?: string[];
  red?: string[];
}

export interface FomoV2ActivityTaskStep {
  id?: string;
  title: string;
  description?: string;
  descriptionHtml?: string;
  timeEstimate?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  image?: string;
  video?: string;
}

export interface FomoV2ActivityTaskGuide {
  title?: string;
  description?: string;
  descriptionHtml?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  successMessage?: string;
  isLocked?: boolean;
  steps?: FomoV2ActivityTaskStep[];
}

export interface FomoV2ActivityReward {
  label?: string;
  amount?: number;
  currency?: string;
  token?: string;
  description?: string;
}

export interface FomoV2ActivityRelatedAsset {
  name: string;
  symbol?: string;
  image?: string;
  slug?: string;
}

export interface FomoV2ActivityInvestorSnapshot {
  id?: string;
  name: string;
  slug?: string;
  symbol?: string;
  logo?: string;
  website?: string;
  source?: string;
}

export interface FomoV2ActivityContent {
  name?: string;
  projectName?: string;
  symbol?: string;
  logo?: string;
  projectLogo?: string;
  score?: string;
  activityType?: string;
  category?: string;
  difficulty?: FomoV2ActivityDifficulty;
  cost?: string;
  timeEstimate?: string;
  taskFrequency?: FomoV2ActivityTaskFrequency;
  isHot?: boolean;
  rewardLabel?: string;
  ecosystem?: string[];
  platform?: string[];
  tags?: string[];
  requirements?: string[];
  startDate?: Date;
  endDate?: Date;
  approxStartDate?: string;
  approxEndDate?: string;
  timezone?: string;
  description?: FomoV2ActivityDescription;
  rewardSupply?: number;
  rewards?: FomoV2ActivityReward[];
  rewardAmount?: number;
  rewardDistribution?: string;
  rewardDistributionApprox?: string;
  participants?: number;
  fundsRaised?: number;
  joinLink?: string;
  links?: FomoV2ActivityLink[];
  videoGuides?: string[];
  relatedAssets?: FomoV2ActivityRelatedAsset[];
  investors?: FomoV2ActivityInvestorSnapshot[];
  socialLinks?: FomoV2ActivitySocialLinks;
  review?: FomoV2ActivityReview;
  metrics?: FomoV2ActivityMetrics;
  timeline?: FomoV2ActivityTimelineItem[];
  flags?: FomoV2ActivityFlags;
  taskGuide?: FomoV2ActivityTaskGuide;
}

export interface FomoV2ActivityCanonicalCandidate {
  canonicalProjectId: Types.ObjectId | string;
  confidence?: string;
  matchedBy?: string;
  reason?: string;
}

export interface FomoV2ActivityViewerAccess {
  allowed: boolean;
  contentRedacted: boolean;
  reason?:
    | "auth_required"
    | "nft_required"
    | "grant_required"
    | "nft_or_grant_required"
    | "nft_and_grant_required"
    | "entitlement_unavailable";
  mode?: string;
  source?: string;
  matchedBy?: string;
  legacySource?: boolean;
  requirements?: string[];
  expiresAt?: Date;
}

export interface FomoV2ActivityIngestInput {
  source: string;
  sourceId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
  rawPayload: Record<string, any>;
  normalizedDraft: FomoV2ActivityContent;
  slug: string;
  legacyActivityId?: Types.ObjectId | string;
  legacyNumericId?: number;
  parserActivityId?: string;
  lifecycleStatus?: FomoV2ActivityLifecycleStatus;
  accessTier?: FomoV2ActivityAccessTier;
  payloadHash?: string;
  parserVersion?: string;
  providerUpdatedAt?: Date;
  syncRunId?: Types.ObjectId | string;
  parserImportRunId?: Types.ObjectId | string;
  canonicalProjectId?: Types.ObjectId | string;
  canonicalStatus?: FomoV2ActivityCanonicalStatus;
  canonicalCandidates?: FomoV2ActivityCanonicalCandidate[];
}

export interface FomoV2ActivityEntitlementResolver {
  resolve(user?: Record<string, any>): Promise<{
    entitled: boolean;
    available: boolean;
  }>;
}

export interface FomoV2ActivityUserState {
  isFavourite: boolean;
  reaction?: string | null;
  isAddedToCalendar: boolean;
  completedStepIds: string[];
  stepsCompleted: number;
  stepsTotal: number;
  stepsProgress: number;
}

export interface FomoV2ActivityInteractionState {
  userState?: Partial<FomoV2ActivityUserState>;
  reactionCounts?: {
    like?: number;
    dislike?: number;
    hot?: number;
    interested?: number;
  };
}

export interface FomoV2ActivityUserStateResolver {
  favoriteActivityIds(user: Record<string, any>): Promise<string[]>;
  enrich(
    activityIds: string[],
    user?: Record<string, any>,
  ): Promise<Record<string, FomoV2ActivityInteractionState>>;
}

export const FOMO_V2_ACTIVITY_ENTITLEMENT_RESOLVER = Symbol(
  "FOMO_V2_ACTIVITY_ENTITLEMENT_RESOLVER",
);

export const FOMO_V2_ACTIVITY_USER_STATE_RESOLVER = Symbol(
  "FOMO_V2_ACTIVITY_USER_STATE_RESOLVER",
);
