import { Types } from "mongoose";

export const FOMO_V2_REVIEW_REASONS = [
  "ACTIVITY_EDITORIAL_REVIEW",
  "SOURCE_CONFLICT",
  "MISSING_CANONICAL_PROJECT",
  "LOW_CONFIDENCE_MATCH",
  "POTENTIAL_DUPLICATE",
  "POTENTIAL_PROJECT_MATCH",
  "NEW_PROJECT_CANDIDATE",
  "EXISTING_SOURCE_VESTING",
  "BACKER_POTENTIAL_MATCH",
  "BACKER_AMBIGUOUS",
  "BACKER_TYPE_CONFLICT",
  "BACKER_NEW_CANDIDATE",
  "MISSING_REQUIRED_RELATION",
  "ROUND_VALIDATION_FAILED",
  "PARTICIPANT_VALIDATION_FAILED",
  "ECONOMIC_SIMILARITY_REVIEW",
  "SCHEMA_VALIDATION_FAILED",
] as const;

export type FomoV2ReviewReason =
  | (typeof FOMO_V2_REVIEW_REASONS)[number]
  | string;

export const FOMO_V2_REVIEW_STATUSES = [
  "open",
  "resolved",
  "ignored",
  "superseded",
] as const;

export type FomoV2ReviewStatus = (typeof FOMO_V2_REVIEW_STATUSES)[number];

export interface FomoV2ReviewCandidateInput {
  entityType: string;
  sourceType?: string;
  sourceId?: string;
  sourceEntityId?: Types.ObjectId | string;
  sourceSnapshotId?: Types.ObjectId | string;
  sourcePath?: string;
  sourceUrl?: string;
  payload: Record<string, any>;
  normalizedPayload?: Record<string, any>;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface FomoV2ReviewBatchInput {
  domain: string;
  reason: FomoV2ReviewReason;
  status?: FomoV2ReviewStatus;
  canonicalProjectId?: Types.ObjectId | string;
  projectKey?: string;
  projectName?: string;
  normalizedProjectName?: string;
  currentSourceType?: string;
  incomingSourceType?: string;
  affectedEntityTypes?: string[];
  candidateCount?: number;
  candidates?: FomoV2ReviewCandidateInput[];
  fingerprint?: string;
  syncRunId?: Types.ObjectId | string;
  metadata?: Record<string, any>;
}

export interface FomoV2SourceConflictReviewInput {
  canonicalProjectId: Types.ObjectId | string;
  domain: string;
  currentSourceType: string;
  incomingSourceType: string;
  affectedEntityTypes?: string[];
  candidates?: FomoV2ReviewCandidateInput[];
  syncRunId?: Types.ObjectId | string;
  metadata?: Record<string, any>;
}

export interface FomoV2MissingCanonicalProjectReviewInput {
  domain: string;
  incomingSourceType: string;
  projectKey?: string;
  projectName?: string;
  normalizedProjectName?: string;
  affectedEntityTypes?: string[];
  candidates?: FomoV2ReviewCandidateInput[];
  syncRunId?: Types.ObjectId | string;
  metadata?: Record<string, any>;
}

export interface FomoV2ReviewBatchUpsertResult<TBatch = any> {
  batch: TBatch;
  created: boolean;
  fingerprint: string;
}
