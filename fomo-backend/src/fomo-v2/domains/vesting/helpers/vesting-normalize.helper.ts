import { Types } from "mongoose";
import {
  FOMO_V2_CONFIDENCE_LEVELS,
  FomoV2Confidence,
} from "../../../fomo-v2.types";
import { normalizeProjectSourceType } from "../../../shared/source-policy";
import { FomoV2VestingSourceRef } from "../types";

export const VESTING_SUMMARY_MEANINGFUL_FIELDS = [
  "totalAmount",
  "unlockedAmount",
  "lockedAmount",
  "untrackedAmount",
  "unlockedPercent",
  "lockedPercent",
  "untrackedPercent",
  "lastUnlockDate",
  "nextUnlockDate",
] as const;

export function cleanVestingString(value: any): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

export function normalizeVestingName(value: any): string {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeVestingConfidence(value: any): FomoV2Confidence {
  const normalized = normalizeVestingName(value);
  if ((FOMO_V2_CONFIDENCE_LEVELS as readonly string[]).includes(normalized)) {
    return normalized as FomoV2Confidence;
  }
  return "none";
}

export function toVestingDate(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? undefined : value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function toVestingObjectId(value: any): Types.ObjectId | undefined {
  if (!value) return undefined;
  if (value instanceof Types.ObjectId) return value;
  const text = cleanVestingString(value);
  return text && Types.ObjectId.isValid(text)
    ? new Types.ObjectId(text)
    : undefined;
}

export function normalizeVestingSourceRefs(
  value: any
): FomoV2VestingSourceRef[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((ref) => normalizeVestingSourceRef(ref))
    .filter((ref): ref is FomoV2VestingSourceRef => Boolean(ref));
}

export function normalizeVestingSourceRef(
  value: any
): FomoV2VestingSourceRef | undefined {
  if (!value || typeof value !== "object") return undefined;
  const source = normalizeProjectSourceType(value.source);
  if (!source) return undefined;
  return cleanObject({
    source,
    sourceId: cleanVestingString(value.sourceId),
    sourceSlug: cleanVestingString(value.sourceSlug),
    sourceUrl: cleanVestingString(value.sourceUrl),
    sourcePath: cleanVestingString(value.sourcePath),
    sourceEntityKey: cleanVestingString(value.sourceEntityKey),
    sourceEntityId: toVestingObjectId(value.sourceEntityId),
    sourceSnapshotId: toVestingObjectId(value.sourceSnapshotId),
    observedAt: toVestingDate(value.observedAt),
    confidence: normalizeVestingConfidence(value.confidence),
    metadata:
      value.metadata && typeof value.metadata === "object"
        ? value.metadata
        : undefined,
  });
}

export function firstFiniteNumber(...values: any[]): number | undefined {
  for (const value of values) {
    if (value === undefined || value === null || value === "") continue;
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return undefined;
}

export function hasNonEmptyVestingSummary(summary: any): boolean {
  if (!summary || typeof summary !== "object") return false;
  return VESTING_SUMMARY_MEANINGFUL_FIELDS.some((field) =>
    isMeaningfulVestingValue(summary[field])
  );
}

export function hasVestingImportData(sourceProject: any): boolean {
  if (!sourceProject || typeof sourceProject !== "object") return false;
  return (
    hasArrayItems(sourceProject.tokenAllocation) ||
    hasArrayItems(sourceProject.vestingRounds) ||
    hasArrayItems(sourceProject.vestingSchedule) ||
    hasArrayItems(sourceProject.vestingTimeline) ||
    hasArrayItems(sourceProject.unlockingEvents) ||
    hasNonEmptyVestingSummary(sourceProject.vestingSummary)
  );
}

export function cleanObject<T extends Record<string, any>>(input: T): T {
  const output: Record<string, any> = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (value === undefined) continue;
    output[key] = value;
  }
  return output as T;
}

function hasArrayItems(value: any): boolean {
  return Array.isArray(value) && value.length > 0;
}

function isMeaningfulVestingValue(value: any): boolean {
  if (value === undefined || value === null || value === "") return false;
  if (typeof value === "number") return Number.isFinite(value);
  if (value instanceof Date) return !Number.isNaN(value.getTime());
  return true;
}
