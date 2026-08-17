import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument, Types } from "mongoose";
import {
  FOMO_V2_REVIEW_REASONS,
  FOMO_V2_REVIEW_STATUSES,
  FomoV2ReviewReason,
  FomoV2ReviewStatus,
} from "../types";

export type FomoV2ReviewBatchDocument = HydratedDocument<FomoV2ReviewBatch>;

export const FomoV2ReviewCandidateSchema = new mongoose.Schema(
  {
    entityType: { type: String, required: true },
    sourceType: { type: String },
    sourceId: { type: String },
    sourceEntityId: { type: mongoose.Schema.Types.Mixed },
    sourceSnapshotId: { type: mongoose.Schema.Types.Mixed },
    sourcePath: { type: String },
    sourceUrl: { type: String },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    normalizedPayload: { type: mongoose.Schema.Types.Mixed, default: {} },
    confidence: { type: Number },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

@Schema({
  collection: "review_batches",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class FomoV2ReviewBatch {
  _id?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;

  @Prop({ required: true })
  domain: string;

  @Prop({ type: String, required: true, enum: FOMO_V2_REVIEW_REASONS })
  reason: FomoV2ReviewReason;

  @Prop({
    type: String,
    required: true,
    enum: FOMO_V2_REVIEW_STATUSES,
    default: "open",
  })
  status: FomoV2ReviewStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "FomoV2CanonicalProject" })
  canonicalProjectId?: Types.ObjectId;

  @Prop()
  projectKey?: string;

  @Prop()
  projectName?: string;

  @Prop()
  normalizedProjectName?: string;

  @Prop()
  currentSourceType?: string;

  @Prop()
  incomingSourceType?: string;

  @Prop({ type: [String], default: [] })
  affectedEntityTypes?: string[];

  @Prop({ required: true, default: 0 })
  candidateCount: number;

  @Prop({ type: [FomoV2ReviewCandidateSchema], default: [] })
  candidates?: any[];

  @Prop({ required: true })
  fingerprint: string;

  @Prop({ required: true, default: Date.now })
  firstSeenAt: Date;

  @Prop({ required: true, default: Date.now })
  lastSeenAt: Date;

  @Prop({ required: true, default: 1 })
  seenCount: number;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  createdBySyncRunId?: Types.ObjectId | string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  updatedBySyncRunId?: Types.ObjectId | string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  metadata?: Record<string, any>;
}

export const FomoV2ReviewBatchSchema =
  SchemaFactory.createForClass(FomoV2ReviewBatch);

FomoV2ReviewBatchSchema.index(
  { fingerprint: 1 },
  { unique: true, name: "uniq_review_batches_fingerprint" }
);
FomoV2ReviewBatchSchema.index(
  { status: 1, domain: 1, reason: 1 },
  { name: "idx_review_batches_status_domain_reason" }
);
FomoV2ReviewBatchSchema.index(
  { canonicalProjectId: 1, domain: 1, status: 1 },
  { name: "idx_review_batches_project_domain_status", sparse: true }
);
FomoV2ReviewBatchSchema.index(
  { incomingSourceType: 1, domain: 1, status: 1 },
  { name: "idx_review_batches_incoming_source_domain_status" }
);
FomoV2ReviewBatchSchema.index(
  { lastSeenAt: -1 },
  { name: "idx_review_batches_last_seen" }
);
