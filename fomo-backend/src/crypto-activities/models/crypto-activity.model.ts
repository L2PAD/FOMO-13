import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type CryptoActivityDocument = HydratedDocument<CryptoActivity>;

export type CryptoActivityDifficulty = "Easy" | "Medium" | "Hard";
export type CryptoActivityTaskFrequency = "Daily" | "Weekly" | "Monthly" | "Ongoing";

export interface CryptoActivitySocialLinks {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    docs?: string;
    custom?: Array<{
        label: string;
        url: string;
    }>;
}

export interface CryptoActivityReview {
    text?: string;
    scores?: Array<{
        label: string;
        value: number;
    }>;
    isLocked?: boolean;
}

export interface CryptoActivityMetrics {
    riskLevel?: string;
    complexity?: string;
    timeRequired?: string;
    potentialReward?: string;
}

export interface CryptoActivityTimelineItem {
    title: string;
    date?: Date;
    description?: string;
}

export interface CryptoActivityFlags {
    green?: string[];
    yellow?: string[];
    red?: string[];
}

export interface CryptoActivityTaskGuide {
    title?: string;
    description?: string;
    descriptionHtml?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    successMessage?: string;
    isLocked?: boolean;
    steps?: Array<{
        id?: string;
        title: string;
        description?: string;
        descriptionHtml?: string;
        image?: string;
        video?: string;
    }>;
}

export interface CryptoActivitySourceRef {
    source: string;
    url: string;
    externalId?: string;
    lastSeenAt?: Date;
}

export interface CryptoActivitySyncMeta {
    sourceSystem: "crypto-activities-parser";
    parserUpdatedAt?: Date;
    parserCreatedAt?: Date;
    lastSyncRunAt?: Date;
}

export interface CryptoActivityManualOverrides {
    fields: string[];
    updatedAt?: Date;
    updatedBy?: mongoose.Types.ObjectId;
}

@Schema({ timestamps: true })
export class CryptoActivity {
    @Prop({ required: true, unique: true })
    id: number;

    @Prop({ index: true, unique: true, sparse: true })
    parserActivityId?: string;

    @Prop({ index: true })
    externalSlug?: string;

    @Prop({ index: true })
    primarySource?: string;

    @Prop()
    source?: string;

    @Prop({ index: true })
    sourceUrl?: string;

    @Prop({ index: true })
    originalUrl?: string;

    @Prop({
        type: [{
            source: { type: String, default: "" },
            url: { type: String, default: "" },
            externalId: { type: String, default: "" },
            lastSeenAt: { type: Date, default: null },
        }],
        default: [],
    })
    sources?: CryptoActivitySourceRef[];

    @Prop({ index: true })
    lastSyncedAt?: Date;

    @Prop({
        type: {
            sourceSystem: { type: String, default: "crypto-activities-parser" },
            parserUpdatedAt: { type: Date, default: null },
            parserCreatedAt: { type: Date, default: null },
            lastSyncRunAt: { type: Date, default: null },
        },
        default: undefined,
    })
    syncMeta?: CryptoActivitySyncMeta;

    @Prop({
        type: {
            fields: { type: [String], default: [] },
            updatedAt: { type: Date, default: null },
            updatedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
        },
        default: undefined,
    })
    manualOverrides?: CryptoActivityManualOverrides;

    @Prop({ index: true })
    slug?: string;

    @Prop()
    name?: string;

    @Prop()
    projectName?: string;

    @Prop()
    symbol?: string;

    @Prop({ required: true })
    coinSlug: string;

    @Prop({ required: true })
    coinName: string;

    @Prop({ required: true })
    coinSymbol: string;

    @Prop()
    logo?: string;

    @Prop()
    projectLogo?: string;

    @Prop({ required: true })
    score: string; // NOT_RATED, LOW, MEDIUM, HIGH, VERY_HIGH

    @Prop({ required: true })
    status: string; // UPCOMING, LIVE, ENDED, CANCELED

    @Prop({ required: true })
    activityType: string;

    @Prop({ index: true })
    category?: string;

    @Prop({ enum: ["Easy", "Medium", "Hard"], required: false, index: true })
    difficulty?: CryptoActivityDifficulty;

    @Prop()
    cost?: string;

    @Prop()
    timeEstimate?: string;

    @Prop({ enum: ["Daily", "Weekly", "Monthly", "Ongoing"], required: false })
    taskFrequency?: CryptoActivityTaskFrequency;

    @Prop({ default: false })
    isHot?: boolean;

    @Prop({ default: false })
    isLocked?: boolean;

    @Prop({ default: false, index: true })
    nftRequired?: boolean;

    @Prop()
    rewardLabel?: string;

    @Prop({ type: [String], default: [] })
    ecosystem: string[];

    @Prop({ type: [String], default: [] })
    platform: string[];

    @Prop({ type: [String], default: [] })
    tags: string[];

    @Prop({ type: [String], default: [] })
    requirements?: string[];

    @Prop({ default: null })
    startDate: Date | null;

    @Prop({ default: null })
    endDate: Date | null;

    @Prop({ type: mongoose.Schema.Types.Mixed, default: 'TBA' })
    approxStartDate: string | Date | null;

    @Prop({ type: mongoose.Schema.Types.Mixed, default: 'TBA' })
    approxEndDate: string | Date | null;

    @Prop({ required: true })
    statusUpdatedAt: number;

    @Prop({
        type: {
            about: { type: String, default: '' },
            aboutHtml: { type: String, default: '' },
            howToParticipate: { type: String, default: '' },
            howToParticipateHtml: { type: String, default: '' }
        },
        default: {}
    })
    description: {
        about: string;
        aboutHtml?: string;
        howToParticipate: string;
        howToParticipateHtml?: string;
    };

    @Prop({ default: null })
    rewardSupply: number | null;

    @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
    rewards: any[];

    @Prop({ default: null })
    rewardAmount: number | null;

    @Prop({ default: null })
    rewardDistribution: string | null;

    @Prop({ default: null })
    rewardDistributionApprox: string | null;

    @Prop({ default: null })
    participants: number | null;

    @Prop({
        type: [{
            name: { type: String, required: true },
            symbol: { type: String, required: true },
            image: { type: String, default: '' },
            slug: { type: String, required: true }
        }],
        default: []
    })
    relatedAssets: {
        name: string;
        symbol: string;
        image: string;
        slug: string;
    }[];

    @Prop({ type: mongoose.Schema.Types.Mixed, default: 0 })
    fundsRaised: number | string

    @Prop({ default: '' })
    joinLink: string;

    @Prop({
        type: [{
            label: { type: String, default: '' },
            url: { type: String, required: true }
        }],
        default: []
    })
    links: {
        label: string;
        url: string;
    }[];

    @Prop({ type: [String], default: [] })
    videoGuides: string[];

    @Prop({ required: true })
    createdAt: number;

    @Prop({ required: true })
    updatedAt: number;

    @Prop({ default: [] })
    investors: Array<any>

    @Prop({
        type: {
            website: { type: String, default: "" },
            twitter: { type: String, default: "" },
            telegram: { type: String, default: "" },
            discord: { type: String, default: "" },
            docs: { type: String, default: "" },
            custom: [{
                label: { type: String, default: "" },
                url: { type: String, default: "" },
            }],
        },
        default: {},
    })
    socialLinks?: CryptoActivitySocialLinks;

    @Prop({
        type: {
            text: { type: String, default: "" },
            scores: [{
                label: { type: String, default: "" },
                value: { type: Number, default: 0 },
            }],
            isLocked: { type: Boolean, default: false },
        },
        default: {},
    })
    review?: CryptoActivityReview;

    @Prop({
        type: {
            riskLevel: { type: String, default: "" },
            complexity: { type: String, default: "" },
            timeRequired: { type: String, default: "" },
            potentialReward: { type: String, default: "" },
        },
        default: {},
    })
    metrics?: CryptoActivityMetrics;

    @Prop({
        type: [{
            title: { type: String, required: true },
            date: { type: Date, default: null },
            description: { type: String, default: "" },
        }],
        default: [],
    })
    timeline?: CryptoActivityTimelineItem[];

    @Prop({
        type: {
            green: { type: [String], default: [] },
            yellow: { type: [String], default: [] },
            red: { type: [String], default: [] },
        },
        default: {},
    })
    flags?: CryptoActivityFlags;

    @Prop({
        type: {
            title: { type: String, default: "" },
            description: { type: String, default: "" },
            descriptionHtml: { type: String, default: "" },
            ctaLabel: { type: String, default: "" },
            ctaUrl: { type: String, default: "" },
            successMessage: { type: String, default: "" },
            isLocked: { type: Boolean, default: false },
            steps: [{
                id: { type: String, default: "" },
                title: { type: String, required: true },
                description: { type: String, default: "" },
                descriptionHtml: { type: String, default: "" },
                image: { type: String, default: "" },
                video: { type: String, default: "" },
            }],
        },
        default: {},
    })
    taskGuide?: CryptoActivityTaskGuide;

    @Prop({ type: mongoose.Schema.Types.Mixed, default: undefined })
    parserMeta?: Record<string, any>;

    @Prop({ type: mongoose.Schema.Types.Mixed, default: undefined })
    sourceMeta?: Record<string, any>;

    @Prop({ type: mongoose.Schema.Types.Mixed, default: undefined })
    rawSourceData?: Record<string, any>;
}

export const CryptoActivitySchema = SchemaFactory.createForClass(CryptoActivity);

CryptoActivitySchema.index({ coinSlug: 1 });
CryptoActivitySchema.index({ slug: 1 });
CryptoActivitySchema.index({ externalSlug: 1 });
CryptoActivitySchema.index({ primarySource: 1 });
CryptoActivitySchema.index({ sourceUrl: 1 });
CryptoActivitySchema.index({ originalUrl: 1 });
CryptoActivitySchema.index({ "sources.url": 1 });
CryptoActivitySchema.index({ lastSyncedAt: -1 });
CryptoActivitySchema.index({ coinSymbol: 1 });
CryptoActivitySchema.index({ status: 1 });
CryptoActivitySchema.index({ activityType: 1 });
CryptoActivitySchema.index({ category: 1 });
CryptoActivitySchema.index({ difficulty: 1 });
CryptoActivitySchema.index({ nftRequired: 1 });
CryptoActivitySchema.index({ tags: 1 });
CryptoActivitySchema.index({ requirements: 1 });
CryptoActivitySchema.index({ startDate: 1 });
CryptoActivitySchema.index({ endDate: 1 });
CryptoActivitySchema.index({ statusUpdatedAt: -1 });
CryptoActivitySchema.index({ createdAt: -1 });
CryptoActivitySchema.index({ updatedAt: -1 });
