import { Types } from "mongoose";

export const FOMO_V2_BACKER_TYPES = [
  "fund",
  "person",
] as const;

export type FomoV2BackerType = (typeof FOMO_V2_BACKER_TYPES)[number];

export const FOMO_V2_BACKER_STATUSES = [
  "active",
  "inactive",
  "merged",
  "needs_review",
] as const;

export type FomoV2BackerStatus = (typeof FOMO_V2_BACKER_STATUSES)[number];

export interface FomoV2BackerSocials {
  twitter?: string;
  linkedin?: string;
  telegram?: string;
  discord?: string;
  medium?: string;
  github?: string;
}

export interface FomoV2BackerSourceRef {
  sourceType: string;
  sourceId?: string;
  sourceEntityId?: Types.ObjectId | string;
  sourceSnapshotId?: Types.ObjectId | string;
  sourcePath?: string;
  sourceUrl?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface FomoV2BackerUpsertInput {
  name: string;
  normalizedName?: string;
  slug?: string;
  backerType?: FomoV2BackerType | string;
  description?: string;
  website?: string;
  socials?: FomoV2BackerSocials | Record<string, string>;
  logoUrl?: string;
  avatarUrl?: string;
  country?: string;
  niche?: string;
  status?: FomoV2BackerStatus | string;
  confidence?: number;
  primarySource?: string;
  sourceId?: string;
  sourceUrl?: string;
  sourceRefs?: FomoV2BackerSourceRef[];
  canonicalFingerprint?: string;
  metadata?: Record<string, any>;
}

export interface FomoV2BackerSourceProfileUpsertInput {
  backerId: Types.ObjectId | string;
  sourceType: string;
  sourceInvestorId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
  name: string;
  normalizedName?: string;
  backerType?: FomoV2BackerType | string;
  description?: string;
  website?: string;
  socials?: FomoV2BackerSocials | Record<string, string>;
  logoUrl?: string;
  avatarUrl?: string;
  country?: string;
  sourceEntityId?: Types.ObjectId | string;
  sourceSnapshotId?: Types.ObjectId | string;
  metadata?: Record<string, any>;
}

export interface FomoV2BackerReadModelUpsertInput {
  backerId: Types.ObjectId | string;
  name: string;
  normalizedName?: string;
  slug?: string;
  backerType?: FomoV2BackerType | string;
  description?: string;
  website?: string;
  socials?: FomoV2BackerSocials | Record<string, string>;
  logoUrl?: string;
  avatarUrl?: string;
  country?: string;
  niche?: string;
  hasSourceProfile?: boolean;
  primarySource?: string;
  profileCompleteness?: number;
}

export interface FomoV2BackerUpsertResult<TDocument = any> {
  doc: TDocument;
  created: boolean;
}

export interface FomoV2BackerIdentity {
  sourceType: string;
  sourceInvestorId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
  sourceDocumentId?: string;
  name: string;
  normalizedName: string;
  slug?: string;
  backerType: FomoV2BackerType;
  canonicalFingerprint: string;
}

export interface BackerProfileImportOptions {
  limit?: number;
  debug?: boolean;
  write?: boolean;
  sourceType?: string;
  snapshotId?: string;
  upstreamRunId?: string;
  upstreamParserKey?: string;
  /** In-process lease/policy fence supplied by the managed parser worker. */
  assertExecutionActive?: () => void | Promise<void>;
}

export interface BackerProfileImportCounter {
  created: number;
  updated: number;
}

export interface BackerProfileImportResult {
  mode: "dry-run" | "write";
  dbName: string;
  parserDbName: string;
  sourceType: "intel" | string;
  totalInvestors: number;
  wouldCreateBackers: number;
  wouldUpdateBackers: number;
  wouldCreateSourceProfiles: number;
  wouldUpdateSourceProfiles: number;
  wouldCreateReviewBatches: number;
  wouldUpdateReviewBatches: number;
  byBackerType: Record<string, number>;
  warnings: {
    total: number;
    byReason: Record<string, number>;
    examples?: Array<Record<string, any>>;
  };
  skipped: {
    total: number;
    byReason: Record<string, number>;
    examples?: Array<Record<string, any>>;
  };
  written: {
    backers: BackerProfileImportCounter;
    sourceProfiles: BackerProfileImportCounter;
    readModels: BackerProfileImportCounter;
    reviewBatches: BackerProfileImportCounter;
  };
  errors: Array<Record<string, any>>;
  debugExamples?: Array<Record<string, any>>;
}

export interface BackerDomainAuditResult {
  runner: "fomo-v2:backer-domain-audit";
  mode: "read-only";
  dbName: string;
  generatedAt: string;
  counts: Record<string, number>;
  indexes: Record<string, string[]>;
  duplicatesByCanonicalFingerprint: any[];
  duplicatesByNormalizedNameAndBackerType: any[];
  sourceProfilesWithoutBackerId: number;
  readModelsWithoutBackerId: number;
  danglingSourceProfiles: any[];
  danglingReadModels: any[];
  extraTopLevelFields: Record<string, any[]>;
  invalidBackerTypes: Record<string, any[]>;
  reviewBatchesByReason: any[];
  READ_ONLY: "YES";
  WRITES_PERFORMED: 0;
}
