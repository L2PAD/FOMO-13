import { Types } from "mongoose";
import { FomoV2Confidence, FomoV2Source } from "../../../fomo-v2.types";

export const FOMO_V2_FUNDING_ROUND_TYPES = [
  "pre_seed",
  "seed",
  "strategic",
  "private",
  "public_sale",
  "launchpad",
  "series",
  "ma",
  "grant",
  "funding",
  "airdrop",
  "tge_distribution",
  "unknown",
] as const;

export type FomoV2FundingRoundType =
  (typeof FOMO_V2_FUNDING_ROUND_TYPES)[number];

export const FOMO_V2_FUNDING_ROUND_STATUSES = [
  "planned",
  "upcoming",
  "active",
  "ended",
  "launched",
  "cancelled",
  "proposed",
  "conflict",
  "superseded",
  "unknown",
] as const;

export type FomoV2FundingRoundStatus =
  (typeof FOMO_V2_FUNDING_ROUND_STATUSES)[number];

export const FOMO_V2_FUNDING_PARTICIPANT_ROLES = [
  "lead",
  "participant",
  "advisor",
  "unknown",
] as const;

export type FomoV2FundingParticipantRole =
  (typeof FOMO_V2_FUNDING_PARTICIPANT_ROLES)[number];

export const FOMO_V2_FUNDING_PARTICIPANT_STATUSES = [
  "active",
  "proposed",
  "conflict",
  "superseded",
  "deprecated",
  "unknown",
] as const;

export type FomoV2FundingParticipantStatus =
  (typeof FOMO_V2_FUNDING_PARTICIPANT_STATUSES)[number];

export interface FomoV2FundingSourceRef {
  source: FomoV2Source;
  sourceId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
  sourcePath?: string;
  sourceEntityKey?: string;
  sourceEntityId?: Types.ObjectId | string;
  sourceSnapshotId?: Types.ObjectId | string;
  observedAt?: Date;
  confidence?: FomoV2Confidence;
  metadata?: Record<string, any>;
}

export interface FomoV2FundingRoundRoiInput {
  usd?: number;
  USD?: number;
  btc?: number;
  BTC?: number;
  eth?: number;
  ETH?: number;
}

export interface FomoV2FundingPlatformSnapshotInput {
  platformId?: Types.ObjectId | string;
  _id?: Types.ObjectId | string;
  id?: string | number;
  name?: string;
  normalizedName?: string;
  logo?: string;
  logoUrl?: string;
  image?: string;
  sourceType?: FomoV2Source | string;
  sourceId?: string | number;
  sourceUrl?: string;
}

export interface FomoV2FundingPlatformUpsertInput
  extends FomoV2FundingPlatformSnapshotInput {
  sourceRefs?: FomoV2FundingSourceRef[];
  provenance?: Record<string, any>;
  confidence?: FomoV2Confidence | string;
  metadata?: Record<string, any>;
}

export interface FomoV2FundingRoundCreateInput {
  canonicalProjectId: Types.ObjectId | string;
  marketAssetId?: Types.ObjectId | string;
  roundKey?: string;
  roundName?: string;
  normalizedRoundName?: string;
  roundType?: FomoV2FundingRoundType | string;
  normalizedRoundType?: string;
  announcedDate?: Date | string;
  date?: Date | string;
  dateBucket?: string;
  raisedAmount?: number;
  amountUsd?: number;
  raisedCurrency?: string;
  valuation?: number;
  valuationUsd?: number;
  tokenPrice?: number;
  tokenPriceUsd?: number;
  tokensForSaleAmount?: number;
  tokensForSalePercent?: number;
  roi?: FomoV2FundingRoundRoiInput;
  platformId?: Types.ObjectId | string;
  platform?: FomoV2FundingPlatformSnapshotInput;
  primarySource?: FomoV2Source;
  sourceId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
  sourceEntityKey?: string;
  sourceEntityId?: Types.ObjectId | string;
  sourceSnapshotId?: Types.ObjectId | string;
  sourceRefs?: FomoV2FundingSourceRef[];
  provenance?: Record<string, any>;
  confidence?: FomoV2Confidence | string;
  status?: FomoV2FundingRoundStatus | string;
  canonicalFingerprint?: string;
  identityAliases?: {
    canonicalFingerprints?: string[];
    sourceIds?: string[];
    roundKeys?: string[];
  };
  sourceType?: FomoV2Source;
  isFeedOnly?: boolean;
  sourceFeed?: string;
  feedExternalId?: string;
  importMode?: string;
  metadata?: Record<string, any>;
}

export type FomoV2FundingRoundUpsertInput = FomoV2FundingRoundCreateInput;

export interface FomoV2FundingSourcePolicyContext {
  sourceType: string;
  syncRunId?: Types.ObjectId | string;
  projectKey?: string;
  projectName?: string;
  reviewCandidates?: Array<Record<string, any>>;
  metadata?: Record<string, any>;
}

export type FomoV2FundingRoundSourcePolicyInput = Omit<
  FomoV2FundingRoundUpsertInput,
  "canonicalProjectId"
> &
  FomoV2FundingSourcePolicyContext & {
    canonicalProjectId?: Types.ObjectId | string;
  };

export interface FomoV2FundingRoundParticipantCreateInput {
  canonicalProjectId: Types.ObjectId | string;
  fundingRoundId: Types.ObjectId | string;
  backerId: Types.ObjectId | string;
  backerName?: string;
  participantName?: string;
  normalizedBackerName?: string;
  sourceBackerRef?: string;
  sourceBackerId?: string;
  sourceBackerSlug?: string;
  sourceBackerUrl?: string;
  sourceEntityKey?: string;
  sourceEntityId?: Types.ObjectId | string;
  sourceSnapshotId?: Types.ObjectId | string;
  role?: FomoV2FundingParticipantRole | string;
  isLead?: boolean;
  primarySource?: FomoV2Source;
  sourceRefs?: FomoV2FundingSourceRef[];
  provenance?: Record<string, any>;
  confidence?: FomoV2Confidence | string;
  status?: FomoV2FundingParticipantStatus | string;
  canonicalFingerprint?: string;
  metadata?: Record<string, any>;
}

export type FomoV2FundingRoundParticipantUpsertInput =
  FomoV2FundingRoundParticipantCreateInput;

export type FomoV2FundingRoundParticipantSourcePolicyInput = Omit<
  FomoV2FundingRoundParticipantUpsertInput,
  "canonicalProjectId" | "fundingRoundId"
> &
  FomoV2FundingSourcePolicyContext & {
    canonicalProjectId?: Types.ObjectId | string;
    fundingRoundId?: Types.ObjectId | string;
  };

export interface FomoV2FundingUpsertResult<TDocument = any> {
  doc: TDocument;
  created: boolean;
}

export interface FomoV2FundingSourcePolicyResult<TDocument = any> {
  written: boolean;
  skipped: boolean;
  reason?:
    | "SOURCE_CONFLICT"
    | "MISSING_CANONICAL_PROJECT"
    | "MISSING_BACKER_ID";
  action?: string;
  result?: FomoV2FundingUpsertResult<TDocument>;
  lock?: any;
  review?: any;
}
