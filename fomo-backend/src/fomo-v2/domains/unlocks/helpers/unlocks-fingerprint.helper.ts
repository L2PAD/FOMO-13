import { createHash } from "crypto";
import { Types } from "mongoose";
import { normalizeProjectSourceType } from "../../../shared/source-policy";
import {
  cleanUnlockString,
  normalizeUnlockName,
  toUnlockDate,
} from "./unlocks-normalize.helper";

export interface UnlockEventFingerprintInput {
  canonicalProjectId: Types.ObjectId | string;
  sourceType?: string;
  sourceEventId?: string;
  saleId?: number | string;
  unlockDate?: Date | string;
  roundName?: string;
  normalizedRoundName?: string;
  unlockType?: string;
}

export interface UnlockEventContentHashInput {
  sourceType?: string;
  sourceEventId?: string;
  marketAssetId?: Types.ObjectId | string;
  tokenAllocationId?: Types.ObjectId | string;
  vestingRoundId?: Types.ObjectId | string;
  vestingScheduleId?: Types.ObjectId | string;
  vestingDatasetKey?: string;
  statusSource?: string;
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
  sourceRefs?: any[];
  metadata?: Record<string, any>;
}

export function buildUnlockEventFingerprint(
  input: UnlockEventFingerprintInput
): string {
  const sourceEventId = cleanUnlockString(input.sourceEventId);
  return stableHash([
    "unlock_event",
    idString(input.canonicalProjectId),
    normalizeProjectSourceType(input.sourceType) || "unknown_source",
    ...(sourceEventId ? ["source_event", sourceEventId] : []),
    saleIdPart(input.saleId),
    dateBucket(input.unlockDate),
    cleanUnlockString(input.unlockType)?.toLowerCase() || "unknown_unlock_type",
    cleanUnlockString(input.normalizedRoundName) ||
      normalizeUnlockName(input.roundName) ||
      "unknown_round",
  ]);
}

export function buildUnlockEventContentHash(
  input: UnlockEventContentHashInput
): string {
  const unlockTypes = Array.from(
    new Set(
      (input.unlockTypes || [])
        .map((value) => cleanUnlockString(value)?.toLowerCase())
        .filter(Boolean) as string[]
    )
  ).sort();
  return stableHash({
    sourceType: normalizeProjectSourceType(input.sourceType) || undefined,
    sourceEventId: cleanUnlockString(input.sourceEventId),
    marketAssetId: idString(input.marketAssetId),
    tokenAllocationId: idString(input.tokenAllocationId),
    vestingRoundId: idString(input.vestingRoundId),
    vestingScheduleId: idString(input.vestingScheduleId),
    vestingDatasetKey: cleanUnlockString(input.vestingDatasetKey),
    statusSource: cleanUnlockString(input.statusSource)?.toLowerCase(),
    amount: numberPart(input.amount),
    percentOfSupply: numberPart(input.percentOfSupply),
    roundName: cleanUnlockString(input.roundName),
    normalizedRoundName:
      cleanUnlockString(input.normalizedRoundName) ||
      normalizeUnlockName(input.roundName) ||
      undefined,
    stage: cleanUnlockString(input.stage),
    unlockType: cleanUnlockString(input.unlockType)?.toLowerCase(),
    unlockTypes: unlockTypes.length ? unlockTypes : undefined,
    isTgeUnlock:
      input.isTgeUnlock === undefined ? undefined : Boolean(input.isTgeUnlock),
    sourceValueUsd: numberPart(input.sourceValueUsd),
    sourceMarketCapSharePercent: numberPart(
      input.sourceMarketCapSharePercent
    ),
    sourceRefs: sanitizeContentValue(input.sourceRefs || []),
    metadata: sanitizeContentValue(input.metadata || {}),
  });
}

export function dateBucket(value: any): string {
  const date = toUnlockDate(value);
  return date ? date.toISOString().slice(0, 10) : "unknown_date";
}

export function stableHash(value: any): string {
  return createHash("sha1").update(stableStringify(value)).digest("hex");
}

function saleIdPart(value: any): string {
  const text = cleanUnlockString(value);
  return text || "unknown_sale";
}

function numberPart(value: any): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.round(number * 1_000_000_000_000) / 1_000_000_000_000
    : undefined;
}

function idString(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value.toHexString === "function") return value.toHexString();
  if (typeof value.toString === "function") return value.toString();
  return undefined;
}

function sanitizeContentValue(value: any): any {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((item) => sanitizeContentValue(item));
  if (typeof value === "object") {
    if (typeof value.toHexString === "function") return value.toHexString();
    const output: Record<string, any> = {};
    for (const key of Object.keys(value).sort()) {
      if (
        [
          "createdAt",
          "updatedAt",
          "importedAt",
          "sourceFetchedAt",
          "eventOrigin",
          "eventOrigins",
          "observedAt",
        ].includes(key)
      ) {
        continue;
      }
      output[key] = sanitizeContentValue(value[key]);
    }
    return output;
  }
  return value;
}

function stableStringify(value: any): string {
  if (value === null || value === undefined) return "null";
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
