import { Types } from "mongoose";
import { FomoV2Confidence, FomoV2Source } from "../../../fomo-v2.types";

export const FOMO_V2_UNLOCK_EVENT_ORIGINS = [
  "provider_unlocking_events",
  "provider_next_unlocking_event",
  "provider_vesting_timeline",
  "generated_from_schedule",
  "manual",
] as const;

export type FomoV2UnlockEventOrigin =
  (typeof FOMO_V2_UNLOCK_EVENT_ORIGINS)[number];

export const FOMO_V2_UNLOCK_EVENT_APPLY_STATUSES = [
  "pending",
  "processing",
  "applied",
  "skipped",
  "failed",
] as const;

export type FomoV2UnlockEventApplyStatus =
  (typeof FOMO_V2_UNLOCK_EVENT_APPLY_STATUSES)[number];

export interface FomoV2UnlockSourceRef {
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

export interface FomoV2UnlockEventApplySummary {
  vestingScheduleId?: Types.ObjectId | string;
  vestingRoundId?: Types.ObjectId | string;
  vestingSummaryId?: Types.ObjectId | string;
  appliedAmount?: number;
  previousUnlockedAmount?: number;
  newUnlockedAmount?: number;
  previousUnlockedPercent?: number;
  newUnlockedPercent?: number;
  reason?: string;
  runner?: string;
}

export interface FomoV2UnlockEventInput {
  canonicalProjectId: Types.ObjectId | string;
  marketAssetId?: Types.ObjectId | string;
  tokenAllocationId?: Types.ObjectId | string;
  vestingRoundId?: Types.ObjectId | string;
  vestingScheduleId?: Types.ObjectId | string;
  vestingDatasetKey?: string;
  unlockKey?: string;
  sourceType: FomoV2Source;
  sourceEventId?: string;
  saleId?: number | string;
  sourcePath?: string;
  unlockDate: Date | string;
  statusSource?: "upcoming" | "past" | string;
  amount?: number;
  percentOfSupply?: number;
  roundName?: string;
  normalizedRoundName?: string;
  stage?: string;
  unlockType?: string;
  unlockTypes?: string[];
  isTgeUnlock?: boolean;
  sourceValueUsd?: number;
  sourceMarketCapSharePercent?: number;
  /** Origin of the current import/upsert operation. Not the source of truth. */
  eventOrigin?: FomoV2UnlockEventOrigin | string;
  /** Canonical persisted provenance array for every provider/source path that produced this event. */
  eventOrigins?: Array<FomoV2UnlockEventOrigin | string>;
  contentHash?: string;
  sourceFetchedAt?: Date | string;
  importedAt?: Date | string;
  canonicalFingerprint?: string;
  identityAliases?: {
    canonicalFingerprints?: string[];
    sourceEventIds?: string[];
  };
  sourceRefs?: FomoV2UnlockSourceRef[];
  appliedAt?: Date | string;
  appliedStatus?: FomoV2UnlockEventApplyStatus | string;
  appliedTo?: FomoV2UnlockEventApplySummary | Record<string, any>;
  applyAttempts?: number;
  lastApplyAttemptAt?: Date | string;
  applyError?: string;
  metadata?: Record<string, any>;
}

export type FomoV2UnlockUpsertStatus =
  | "created"
  | "updated"
  | "unchanged"
  | "skipped";

export interface FomoV2UnlockUpsertResult<TDocument = any> {
  doc: TDocument;
  created: boolean;
  status?: FomoV2UnlockUpsertStatus;
  updated?: boolean;
  unchanged?: boolean;
  skipped?: boolean;
}
