import mongoose from "mongoose";
import {
  FOMO_V2_ACTIVITY_DIFFICULTIES,
  FOMO_V2_ACTIVITY_TASK_FREQUENCIES,
  FomoV2ActivityContent,
} from "../types";

export const FomoV2ActivityLinkSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false, strict: true },
);

const FomoV2ActivitySocialLinksSchema = new mongoose.Schema(
  {
    website: { type: String },
    twitter: { type: String },
    telegram: { type: String },
    discord: { type: String },
    docs: { type: String },
    custom: { type: [FomoV2ActivityLinkSchema], default: [] },
  },
  { _id: false, strict: true },
);

const FomoV2ActivityDescriptionSchema = new mongoose.Schema(
  {
    about: { type: String },
    aboutHtml: { type: String },
    howToParticipate: { type: String },
    howToParticipateHtml: { type: String },
  },
  { _id: false, strict: true },
);

const FomoV2ActivityReviewScoreSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    value: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false, strict: true },
);

const FomoV2ActivityReviewSchema = new mongoose.Schema(
  {
    text: { type: String },
    textHtml: { type: String },
    scores: { type: [FomoV2ActivityReviewScoreSchema], default: [] },
    isLocked: { type: Boolean, default: false },
  },
  { _id: false, strict: true },
);

const FomoV2ActivityMetricsSchema = new mongoose.Schema(
  {
    riskLevel: { type: String },
    complexity: { type: String },
    timeRequired: { type: String },
    potentialReward: { type: String },
  },
  { _id: false, strict: true },
);

const FomoV2ActivityTimelineItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    date: { type: Date },
    description: { type: String },
  },
  { _id: false, strict: true },
);

const FomoV2ActivityFlagsSchema = new mongoose.Schema(
  {
    green: { type: [String], default: [] },
    yellow: { type: [String], default: [] },
    red: { type: [String], default: [] },
  },
  { _id: false, strict: true },
);

const FomoV2ActivityTaskStepSchema = new mongoose.Schema(
  {
    id: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    descriptionHtml: { type: String },
    timeEstimate: { type: String },
    ctaLabel: { type: String },
    ctaUrl: { type: String },
    image: { type: String },
    video: { type: String },
  },
  { _id: false, strict: true },
);

const FomoV2ActivityTaskGuideSchema = new mongoose.Schema(
  {
    title: { type: String },
    description: { type: String },
    descriptionHtml: { type: String },
    ctaLabel: { type: String },
    ctaUrl: { type: String },
    successMessage: { type: String },
    isLocked: { type: Boolean, default: false },
    steps: { type: [FomoV2ActivityTaskStepSchema], default: [] },
  },
  { _id: false, strict: true },
);

const FomoV2ActivityRewardSchema = new mongoose.Schema(
  {
    label: { type: String },
    amount: { type: Number },
    currency: { type: String },
    token: { type: String },
    description: { type: String },
  },
  { _id: false, strict: true },
);

const FomoV2ActivityRelatedAssetSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    symbol: { type: String },
    image: { type: String },
    slug: { type: String },
  },
  { _id: false, strict: true },
);

const FomoV2ActivityInvestorSnapshotSchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String, required: true },
    slug: { type: String },
    symbol: { type: String },
    logo: { type: String },
    website: { type: String },
    source: { type: String },
  },
  { _id: false, strict: true },
);

export const FomoV2ActivityContentSchema = new mongoose.Schema<FomoV2ActivityContent>(
  {
    name: { type: String },
    projectName: { type: String },
    symbol: { type: String },
    logo: { type: String },
    projectLogo: { type: String },
    score: { type: String },
    activityType: { type: String },
    category: { type: String },
    difficulty: { type: String, enum: FOMO_V2_ACTIVITY_DIFFICULTIES },
    cost: { type: String },
    timeEstimate: { type: String },
    taskFrequency: {
      type: String,
      enum: FOMO_V2_ACTIVITY_TASK_FREQUENCIES,
    },
    isHot: { type: Boolean, default: false },
    rewardLabel: { type: String },
    ecosystem: { type: [String], default: [] },
    platform: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    requirements: { type: [String], default: [] },
    startDate: { type: Date },
    endDate: { type: Date },
    approxStartDate: { type: String },
    approxEndDate: { type: String },
    timezone: { type: String },
    description: { type: FomoV2ActivityDescriptionSchema },
    rewardSupply: { type: Number },
    rewards: { type: [FomoV2ActivityRewardSchema], default: [] },
    rewardAmount: { type: Number },
    rewardDistribution: { type: String },
    rewardDistributionApprox: { type: String },
    participants: { type: Number, min: 0 },
    fundsRaised: { type: Number, min: 0 },
    joinLink: { type: String },
    links: { type: [FomoV2ActivityLinkSchema], default: [] },
    videoGuides: { type: [String], default: [] },
    relatedAssets: { type: [FomoV2ActivityRelatedAssetSchema], default: [] },
    investors: { type: [FomoV2ActivityInvestorSnapshotSchema], default: [] },
    socialLinks: { type: FomoV2ActivitySocialLinksSchema },
    review: { type: FomoV2ActivityReviewSchema },
    metrics: { type: FomoV2ActivityMetricsSchema },
    timeline: { type: [FomoV2ActivityTimelineItemSchema], default: [] },
    flags: { type: FomoV2ActivityFlagsSchema },
    taskGuide: { type: FomoV2ActivityTaskGuideSchema },
  },
  { _id: false, strict: true, minimize: false },
);
