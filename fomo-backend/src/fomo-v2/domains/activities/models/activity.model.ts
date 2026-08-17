import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_ACTIVITY_ACCESS_TIERS,
  FOMO_V2_ACTIVITY_AI_PROPOSAL_STATUSES,
  FOMO_V2_ACTIVITY_AUDIT_ACTIONS,
  FOMO_V2_ACTIVITY_CANONICAL_STATUSES,
  FOMO_V2_ACTIVITY_LIFECYCLE_STATUSES,
  FOMO_V2_ACTIVITY_PUBLICATION_STATUSES,
  FOMO_V2_ACTIVITY_REVIEW_STATUSES,
  FomoV2ActivityAccessTier,
  FomoV2ActivityAiProposalStatus,
  FomoV2ActivityAuditAction,
  FomoV2ActivityCanonicalStatus,
  FomoV2ActivityContent,
  FomoV2ActivityLifecycleStatus,
  FomoV2ActivityPublicationStatus,
  FomoV2ActivityReviewStatus,
} from "../types";
import { FomoV2ActivityContentSchema } from "./activity-content.schema";

export type FomoV2ActivityDocument = HydratedDocument<FomoV2Activity>;

const FomoV2ActivityCanonicalCandidateSchema = new mongoose.Schema(
  {
    canonicalProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FomoV2CanonicalProject",
      required: true,
    },
    confidence: { type: String },
    matchedBy: { type: String },
    reason: { type: String },
  },
  { _id: false, strict: true }
);

const FomoV2ActivityCanonicalResolutionSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: FOMO_V2_ACTIVITY_CANONICAL_STATUSES,
      required: true,
      default: "unprocessed",
    },
    confidence: { type: String },
    matchedBy: { type: String },
    reason: { type: String },
    candidates: {
      type: [FomoV2ActivityCanonicalCandidateSchema],
      default: [],
    },
    resolvedAt: { type: Date },
    resolvedBy: { type: String },
  },
  { _id: false, strict: true }
);

const FomoV2ActivitySourceRefSchema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    sourceId: { type: String },
    sourceSlug: { type: String },
    sourceUrl: { type: String },
    lastSeenAt: { type: Date, required: true },
  },
  { _id: false, strict: true }
);

const FomoV2ActivityPublishedMetadataSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true },
    lifecycleStatus: {
      type: String,
      enum: FOMO_V2_ACTIVITY_LIFECYCLE_STATUSES,
      required: true,
    },
    accessTier: {
      type: String,
      enum: FOMO_V2_ACTIVITY_ACCESS_TIERS,
      required: true,
    },
    canonicalProjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FomoV2CanonicalProject",
    },
  },
  { _id: false, strict: true }
);

const FomoV2ActivityAiProposalSchema = new mongoose.Schema(
  {
    proposalId: { type: String, required: true },
    status: {
      type: String,
      enum: FOMO_V2_ACTIVITY_AI_PROPOSAL_STATUSES,
      required: true,
      default: "proposed",
    },
    provider: { type: String, required: true },
    model: { type: String, required: true },
    promptVersion: { type: String, required: true },
    inputHash: { type: String, required: true },
    content: { type: FomoV2ActivityContentSchema },
    warnings: { type: [String], default: [] },
    rationale: { type: String },
    generatedAt: { type: Date, required: true },
    generatedBy: { type: String },
  },
  { _id: false, strict: true }
);

const FomoV2ActivityAuditEntrySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: FOMO_V2_ACTIVITY_AUDIT_ACTIONS,
      required: true,
    },
    actor: { type: String, required: true },
    at: { type: Date, required: true },
    revision: { type: Number, required: true },
    note: { type: String },
    changedFields: { type: [String], default: [] },
    fromStatus: { type: String },
    toStatus: { type: String },
  },
  { _id: false, strict: true }
);

@Schema({
  collection: "activities",
  timestamps: true,
  strict: true,
  autoIndex: false,
  optimisticConcurrency: true,
})
export class FomoV2Activity {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ required: true })
  slug: string;

  @Prop()
  legacyActivityId?: string;

  @Prop()
  legacyNumericId?: number;

  @Prop()
  parserActivityId?: string;

  @Prop({ type: [String], default: [] })
  sourceKeys: string[];

  @Prop({ type: [FomoV2ActivitySourceRefSchema], default: [] })
  sources: any[];

  @Prop({
    type: [mongoose.Schema.Types.ObjectId],
    ref: "FomoV2SourceSnapshot",
    default: [],
  })
  sourceSnapshotIds: Types.ObjectId[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2ImportCandidate" })
  importCandidateId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2ReviewBatch" })
  reviewBatchId?: Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2CanonicalProject" })
  canonicalProjectId?: Types.ObjectId;

  @Prop({ type: FomoV2ActivityCanonicalResolutionSchema, required: true })
  canonicalResolution: {
    status: FomoV2ActivityCanonicalStatus;
    confidence?: string;
    matchedBy?: string;
    reason?: string;
    candidates?: any[];
    resolvedAt?: Date;
    resolvedBy?: string;
  };

  @Prop({
    type: String,
    enum: FOMO_V2_ACTIVITY_LIFECYCLE_STATUSES,
    required: true,
    default: "upcoming",
  })
  lifecycleStatus: FomoV2ActivityLifecycleStatus;

  @Prop({
    type: String,
    enum: FOMO_V2_ACTIVITY_REVIEW_STATUSES,
    required: true,
    default: "ingested",
  })
  reviewStatus: FomoV2ActivityReviewStatus;

  @Prop({
    type: String,
    enum: FOMO_V2_ACTIVITY_PUBLICATION_STATUSES,
    required: true,
    default: "draft",
  })
  publicationStatus: FomoV2ActivityPublicationStatus;

  @Prop({
    type: String,
    enum: FOMO_V2_ACTIVITY_PUBLICATION_STATUSES,
  })
  publicationStatusBeforeHide?: FomoV2ActivityPublicationStatus;

  @Prop({
    type: String,
    enum: FOMO_V2_ACTIVITY_ACCESS_TIERS,
    required: true,
    default: "public",
  })
  accessTier: FomoV2ActivityAccessTier;

  @Prop({ required: true, default: false })
  isSponsored: boolean;

  @Prop({ required: true, default: 0, min: -100_000, max: 100_000 })
  sponsoredPriority: number;

  @Prop({ type: FomoV2ActivityContentSchema, required: true })
  currentDraft: FomoV2ActivityContent;

  @Prop({ type: FomoV2ActivityContentSchema })
  publishedSnapshot?: FomoV2ActivityContent;

  @Prop({ type: FomoV2ActivityPublishedMetadataSchema })
  publishedMetadata?: {
    slug: string;
    lifecycleStatus: FomoV2ActivityLifecycleStatus;
    accessTier: FomoV2ActivityAccessTier;
    canonicalProjectId?: Types.ObjectId;
  };

  @Prop({ type: [String], default: [] })
  manualOverrideFields: string[];

  @Prop({ type: [FomoV2ActivityAiProposalSchema], default: [] })
  aiProposals: Array<{
    proposalId: string;
    status: FomoV2ActivityAiProposalStatus;
    provider: string;
    model: string;
    promptVersion: string;
    inputHash: string;
    content?: FomoV2ActivityContent;
    warnings?: string[];
    rationale?: string;
    generatedAt: Date;
    generatedBy?: string;
  }>;

  @Prop({ required: true, default: 0, min: 0 })
  revision: number;

  @Prop({ type: [FomoV2ActivityAuditEntrySchema], default: [] })
  auditTrail: Array<{
    action: FomoV2ActivityAuditAction;
    actor: string;
    at: Date;
    revision: number;
    note?: string;
    changedFields?: string[];
    fromStatus?: string;
    toStatus?: string;
  }>;

  @Prop()
  reviewedAt?: Date;

  @Prop()
  reviewedBy?: string;

  @Prop()
  publishedAt?: Date;

  @Prop()
  publishedBy?: string;

  @Prop()
  hiddenAt?: Date;

  @Prop()
  hiddenBy?: string;

  @Prop()
  hiddenReason?: string;

  @Prop()
  rejectedAt?: Date;

  @Prop()
  rejectedBy?: string;

  @Prop()
  rejectedReason?: string;
}

export const FomoV2ActivitySchema =
  SchemaFactory.createForClass(FomoV2Activity);

// Partial: the legacy `Activity` model (src/activity) shares the same
// `activities` collection and its documents have no slug at all, so a plain
// unique index can never build (every legacy doc indexes as slug: null).
// FomoV2Activity always has a required string slug, so uniqueness among
// FOMO v2 documents is fully preserved.
FomoV2ActivitySchema.index(
  { slug: 1 },
  {
    unique: true,
    name: "uniq_activities_slug",
    partialFilterExpression: { slug: { $type: "string" } },
  }
);
FomoV2ActivitySchema.index(
  { "publishedMetadata.slug": 1 },
  {
    unique: true,
    sparse: true,
    name: "uniq_activities_published_slug",
  }
);
FomoV2ActivitySchema.index(
  { legacyActivityId: 1 },
  { unique: true, sparse: true, name: "uniq_activities_legacy_id" }
);
FomoV2ActivitySchema.index(
  { legacyNumericId: 1 },
  { unique: true, sparse: true, name: "uniq_activities_legacy_numeric_id" }
);
FomoV2ActivitySchema.index(
  { parserActivityId: 1 },
  { sparse: true, name: "idx_activities_parser_id" }
);
FomoV2ActivitySchema.index(
  { sourceKeys: 1 },
  { unique: true, sparse: true, name: "uniq_activities_source_key" }
);
FomoV2ActivitySchema.index(
  { publicationStatus: 1, hiddenAt: 1, "publishedSnapshot.startDate": 1 },
  { name: "idx_activities_public_start_date" }
);
FomoV2ActivitySchema.index(
  { publicationStatus: 1, hiddenAt: 1, "publishedSnapshot.endDate": 1 },
  { name: "idx_activities_public_end_date" }
);
FomoV2ActivitySchema.index(
  {
    publicationStatus: 1,
    "publishedMetadata.accessTier": 1,
    "publishedMetadata.lifecycleStatus": 1,
    updatedAt: -1,
  },
  { name: "idx_activities_public_filters_v2" }
);
FomoV2ActivitySchema.index(
  { reviewStatus: 1, publicationStatus: 1, updatedAt: -1 },
  { name: "idx_activities_admin_review_queue" }
);
FomoV2ActivitySchema.index(
  {
    isSponsored: 1,
    publicationStatus: 1,
    sponsoredPriority: -1,
    publishedAt: -1,
  },
  { name: "idx_activities_earlyland_sponsored" }
);
FomoV2ActivitySchema.index(
  {
    "publishedMetadata.canonicalProjectId": 1,
    publicationStatus: 1,
    updatedAt: -1,
  },
  { name: "idx_activities_public_canonical_project", sparse: true }
);
FomoV2ActivitySchema.index(
  { "canonicalResolution.status": 1, reviewStatus: 1, updatedAt: -1 },
  { name: "idx_activities_canonical_review" }
);
FomoV2ActivitySchema.index(
  { "publishedSnapshot.activityType": 1, publicationStatus: 1 },
  { name: "idx_activities_public_type" }
);
FomoV2ActivitySchema.index(
  { "publishedSnapshot.category": 1, publicationStatus: 1 },
  { name: "idx_activities_public_category" }
);
FomoV2ActivitySchema.index(
  { publicationStatus: 1, "publishedSnapshot.investors.name": 1 },
  { name: "idx_activities_public_investors" }
);
FomoV2ActivitySchema.index(
  {
    "publishedSnapshot.name": "text",
    "publishedSnapshot.projectName": "text",
    "publishedSnapshot.tags": "text",
  },
  {
    name: "text_activities_public_search",
    weights: {
      "publishedSnapshot.name": 10,
      "publishedSnapshot.projectName": 7,
      "publishedSnapshot.tags": 2,
    },
  }
);
