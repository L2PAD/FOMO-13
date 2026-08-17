import { Types } from "mongoose";

export type IcoProjectResolveAction = "LINK_EXISTING" | "CREATE_NEW" | "REVIEW";

export type IcoProjectResolveReviewReason =
  | "POTENTIAL_PROJECT_MATCH"
  | "NEW_PROJECT_CANDIDATE";

export interface IcoProjectIdentity {
  sourceType: string;
  sourceProjectId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
  name?: string;
  symbol?: string;
  slug?: string;
  normalizedName?: string;
  normalizedSymbol?: string;
  normalizedSlug?: string;
  queryName?: string;
  querySymbol?: string;
  querySlug?: string;
  providerIds: {
    coingeckoId?: string;
    coinMarketCapId?: string;
    dropstabId?: string;
    cryptorankId?: string;
    icodropsId?: string;
  };
}

export interface IcoProjectResolveCandidate {
  canonicalProjectId?: string;
  marketAssetId?: string;
  sourceProfileId?: string;
  source: "project_source_profile" | "market_asset" | "canonical_project";
  confidence: number;
  matchedBy: string;
  reason: string;
  name?: string;
  symbol?: string;
  slug?: string;
  linkStatus?: string;
  verified?: boolean;
  payload?: Record<string, any>;
}

export interface IcoProjectResolveResult {
  action: IcoProjectResolveAction;
  canonicalProjectId?: string;
  marketAssetId?: string;
  confidence: number;
  matchedBy?: string;
  reason?: string;
  reviewReason?: IcoProjectResolveReviewReason;
  candidates?: IcoProjectResolveCandidate[];
  hasMarketData?: boolean;
}

export interface IcoProjectResolverOptions {
  sourceType?: string;
  allowCreateCanonicalProjects?: boolean;
}

export interface IcoProjectProfilePayload {
  canonicalProjectId: Types.ObjectId;
  sourceType: string;
  sourceProjectId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
  name?: string;
  symbol?: string;
  slug?: string;
  description?: string;
  website?: string;
  socials?: {
    twitter?: string;
    telegram?: string;
    discord?: string;
    medium?: string;
    github?: string;
  };
  logoUrl?: string;
  categories?: string[];
  status?: string;
  launchDate?: Date;
  sourceEntityId?: Types.ObjectId;
  sourceSnapshotId?: Types.ObjectId;
  metadata?: Record<string, any>;
}

export interface IcoProjectReadModelPayload {
  canonicalProjectId: Types.ObjectId;
  sourceType: string;
  name?: string;
  symbol?: string;
  slug?: string;
  logoUrl?: string;
  description?: string;
  website?: string;
  categories?: string[];
  status?: string;
  launchDate?: Date;
  hasMarketData: boolean;
  marketAssetId?: Types.ObjectId;
  profileCompleteness?: number;
  metadata?: Record<string, any>;
}

export interface IcoProjectProfileImportOptions
  extends IcoProjectResolverOptions {
  write?: boolean;
  debug?: boolean;
  limit?: number;
  all?: boolean;
  batchSize?: number;
  examplesLimit?: number;
  snapshotId?: string;
  upstreamRunId?: string;
  upstreamParserKey?: string;
  /** Explicit compatibility mode for historical rows without `source`. */
  includeLegacyMissingSource?: boolean;
  /** In-process lease/policy fence supplied by the managed parser worker. */
  assertExecutionActive?: () => void | Promise<void>;
}

export interface IcoProjectDiagnosticCandidate {
  canonicalProjectId?: string;
  canonical?: {
    name?: string;
    symbol?: string;
    slug?: string;
  };
  marketAssetId?: string;
  marketAsset?: {
    name?: string;
    symbol?: string;
    slug?: string;
    coingeckoId?: string;
  };
  reason?: string;
  score: number;
  matchedBy?: string;
}

export interface IcoProjectDiagnosticExample {
  ico: {
    name?: string;
    symbol?: string;
    slug?: string;
  };
  candidates: IcoProjectDiagnosticCandidate[];
  reason?: string;
  score: number;
  matchedBy?: string;
}

export interface IcoProjectProfileImportResult {
  mode: "dry-run" | "write";
  dbName: string;
  parserDbName: string;
  sourceType: string;
  allowCreateCanonicalProjects: boolean;
  totalProjects: number;
  linkedExisting: number;
  reviewPotentialMatch: number;
  reviewNewProject: number;
  wouldCreateCanonicalProject: number;
  written: {
    canonicalProjects: { created: number; updated: number };
    projectSourceProfiles: { created: number; updated: number };
    icoProjectReadModels: { created: number; updated: number };
    reviewBatches: { created: number; updated: number };
  };
  errors: Array<{
    sourceProjectId?: string;
    sourceSlug?: string;
    name?: string;
    message: string;
  }>;
  examples: {
    linkedExisting: IcoProjectResolveResult[];
    reviewPotentialMatch: IcoProjectResolveResult[];
    reviewNewProject: IcoProjectResolveResult[];
    createNew: IcoProjectResolveResult[];
  };
  debugExamples?: {
    linkedExisting: IcoProjectDiagnosticExample[];
    potentialProjectMatch: IcoProjectDiagnosticExample[];
    newProjectCandidate: IcoProjectDiagnosticExample[];
  };
}
