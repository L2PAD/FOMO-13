import { Types } from "mongoose";
import {
  FOMO_V2_CONFIDENCE_LEVELS,
  FomoV2Confidence,
} from "../../../fomo-v2.types";
import { normalizeProjectSourceType } from "../../../shared/source-policy";
import { FomoV2UnlockSourceRef } from "../types";

export function cleanUnlockString(value: any): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

export function normalizeUnlockName(value: any): string {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeUnlockConfidence(value: any): FomoV2Confidence {
  const normalized = normalizeUnlockName(value);
  if ((FOMO_V2_CONFIDENCE_LEVELS as readonly string[]).includes(normalized)) {
    return normalized as FomoV2Confidence;
  }
  return "none";
}

export function toUnlockDate(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? undefined : value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function toUnlockObjectId(value: any): Types.ObjectId | undefined {
  if (!value) return undefined;
  if (value instanceof Types.ObjectId) return value;
  const text = cleanUnlockString(value);
  return text && Types.ObjectId.isValid(text)
    ? new Types.ObjectId(text)
    : undefined;
}

export function normalizeUnlockSourceRefs(value: any): FomoV2UnlockSourceRef[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((ref) => normalizeUnlockSourceRef(ref))
    .filter((ref): ref is FomoV2UnlockSourceRef => Boolean(ref));
}

export function normalizeUnlockSourceRef(
  value: any
): FomoV2UnlockSourceRef | undefined {
  if (!value || typeof value !== "object") return undefined;
  const source = normalizeProjectSourceType(value.source);
  if (!source) return undefined;
  return cleanObject({
    source,
    sourceId: cleanUnlockString(value.sourceId),
    sourceSlug: cleanUnlockString(value.sourceSlug),
    sourceUrl: cleanUnlockString(value.sourceUrl),
    sourcePath: cleanUnlockString(value.sourcePath),
    sourceEntityKey: cleanUnlockString(value.sourceEntityKey),
    sourceEntityId: toUnlockObjectId(value.sourceEntityId),
    sourceSnapshotId: toUnlockObjectId(value.sourceSnapshotId),
    observedAt: toUnlockDate(value.observedAt),
    confidence: normalizeUnlockConfidence(value.confidence),
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

export function cleanObject<T extends Record<string, any>>(input: T): T {
  const output: Record<string, any> = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (value === undefined) continue;
    output[key] = value;
  }
  return output as T;
}
