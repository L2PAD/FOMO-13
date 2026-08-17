import { Types } from "mongoose";
import { FomoV2Confidence, FomoV2Source } from "../../../fomo-v2.types";

export interface FomoV2VestingSourceRef {
  source: FomoV2Source;
  sourceId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
  sourcePath?: string;
  sourceEntityKey?: string;
  sourceEntityId?: Types.ObjectId | string;
  sourceSnapshotId?: Types.ObjectId | string;
  observedAt?: Date;
  confidence?: FomoV2Confidence | string;
  metadata?: Record<string, any>;
}

export interface FomoV2VestingIdentityAliases {
  canonicalFingerprints?: string[];
}

export interface FomoV2TokenAllocationInput {
  canonicalProjectId: Types.ObjectId | string;
  marketAssetId?: Types.ObjectId | string;
  sourceType: FomoV2Source;
  sourceId?: string;
  sourceSlug?: string;
  sourcePath?: string;
  sourceUrl?: string;
  sourceEntityKey?: string;
  sourceEntityId?: Types.ObjectId | string;
  sourceSnapshotId?: Types.ObjectId | string;
  vestingDatasetKey?: string;
  name: string;
  normalizedName?: string;
  allocationPercent?: number;
  amount?: number;
  saleId?: number | string;
  primarySource?: FomoV2Source;
  sourceRefs?: FomoV2VestingSourceRef[];
  provenance?: Record<string, any>;
  confidence?: FomoV2Confidence | string;
  status?: string;
  canonicalFingerprint?: string;
  identityAliases?: FomoV2VestingIdentityAliases;
}

export interface FomoV2VestingRoundInput {
  canonicalProjectId: Types.ObjectId | string;
  marketAssetId?: Types.ObjectId | string;
  sourceType: FomoV2Source;
  saleId?: number | string;
  roundName: string;
  normalizedRoundName?: string;
  allocationPercent?: number;
  totalAmount?: number;
  unlockedAmountSource?: number;
  lockedAmountSource?: number;
  unlockedPercentSource?: number;
  lockedPercentSource?: number;
  valueLockedUsdSource?: number;
  lastUnlockDateSource?: Date | string;
  primarySource?: FomoV2Source;
  sourceEntityKey?: string;
  sourceEntityId?: Types.ObjectId | string;
  sourceSnapshotId?: Types.ObjectId | string;
  vestingDatasetKey?: string;
  sourcePath?: string;
  sourceRefs?: FomoV2VestingSourceRef[];
  provenance?: Record<string, any>;
  confidence?: FomoV2Confidence | string;
  status?: string;
  canonicalFingerprint?: string;
  identityAliases?: FomoV2VestingIdentityAliases;
  metadata?: Record<string, any>;
}

export interface FomoV2VestingScheduleInput {
  canonicalProjectId: Types.ObjectId | string;
  marketAssetId?: Types.ObjectId | string;
  tokenAllocationId?: Types.ObjectId | string;
  vestingRoundId?: Types.ObjectId | string;
  sourceType: FomoV2Source;
  saleId?: number | string;
  roundName: string;
  normalizedRoundName?: string;
  tgeUnlockPercent?: number;
  vestingType?: string;
  vestingFrequency?: string;
  vestingDurationMonths?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  dateConfidence?: string;
  currentUnlockedPercentSource?: number;
  currentLockedPercentSource?: number;
  canonicalFingerprint?: string;
  identityAliases?: FomoV2VestingIdentityAliases;
  sourceEntityKey?: string;
  sourceEntityId?: Types.ObjectId | string;
  sourceSnapshotId?: Types.ObjectId | string;
  vestingDatasetKey?: string;
  sourcePath?: string;
  sourceRefs?: FomoV2VestingSourceRef[];
  provenance?: Record<string, any>;
  confidence?: FomoV2Confidence | string;
  status?: string;
  metadata?: Record<string, any>;
}

export interface FomoV2VestingSummaryInput {
  canonicalProjectId: Types.ObjectId | string;
  sourceType: FomoV2Source;
  vestingDatasetKey?: string;
  totalAmount?: number;
  unlockedAmount?: number;
  lockedAmount?: number;
  untrackedAmount?: number;
  unlockedPercent?: number;
  lockedPercent?: number;
  untrackedPercent?: number;
  lastUnlockDate?: Date | string;
  nextUnlockDate?: Date | string;
  nextUnlockEventId?: Types.ObjectId | string;
  sourceUnlockedValueUsd?: number;
  sourceLockedValueUsd?: number;
  calculatedAt?: Date | string;
  identityAliases?: FomoV2VestingIdentityAliases;
}

export interface FomoV2VestingUpsertResult<TDocument = any> {
  doc: TDocument;
  created: boolean;
}
