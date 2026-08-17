import { createHash } from "crypto";
import { Types } from "mongoose";
import { normalizeProjectSourceType } from "../../../shared/source-policy";
import { cleanVestingString, normalizeVestingName, toVestingDate } from "./vesting-normalize.helper";

export interface TokenAllocationFingerprintInput {
  canonicalProjectId: Types.ObjectId | string;
  sourceType?: string;
  saleId?: number | string;
  name?: string;
  normalizedName?: string;
}

export interface VestingRoundFingerprintInput {
  canonicalProjectId: Types.ObjectId | string;
  sourceType?: string;
  saleId?: number | string;
  roundName?: string;
  normalizedRoundName?: string;
}

export interface VestingScheduleFingerprintInput {
  canonicalProjectId: Types.ObjectId | string;
  vestingRoundId?: Types.ObjectId | string;
  sourceType?: string;
  saleId?: number | string;
  roundName?: string;
  normalizedRoundName?: string;
}

export interface VestingSummaryFingerprintInput {
  canonicalProjectId: Types.ObjectId | string;
  sourceType?: string;
}

export function buildTokenAllocationFingerprint(
  input: TokenAllocationFingerprintInput
): string {
  return stableHash([
    "token_allocation",
    idString(input.canonicalProjectId),
    normalizeProjectSourceType(input.sourceType) || "unknown_source",
    saleIdPart(input.saleId),
    cleanVestingString(input.normalizedName) ||
      normalizeVestingName(input.name) ||
      "unknown_allocation",
  ]);
}

export function buildVestingRoundFingerprint(
  input: VestingRoundFingerprintInput
): string {
  return stableHash([
    "vesting_round",
    idString(input.canonicalProjectId),
    normalizeProjectSourceType(input.sourceType) || "unknown_source",
    saleIdPart(input.saleId),
    cleanVestingString(input.normalizedRoundName) ||
      normalizeVestingName(input.roundName) ||
      "unknown_round",
  ]);
}

export function buildVestingScheduleFingerprint(
  input: VestingScheduleFingerprintInput
): string {
  return stableHash([
    "vesting_schedule",
    idString(input.canonicalProjectId),
    idString(input.vestingRoundId) || "",
    normalizeProjectSourceType(input.sourceType) || "unknown_source",
    saleIdPart(input.saleId),
    cleanVestingString(input.normalizedRoundName) ||
      normalizeVestingName(input.roundName) ||
      "unknown_round",
  ]);
}

export function buildVestingSummaryFingerprint(
  input: VestingSummaryFingerprintInput
): string {
  return stableHash([
    "vesting_summary",
    idString(input.canonicalProjectId),
    normalizeProjectSourceType(input.sourceType) || "unknown_source",
  ]);
}

export function dateBucket(value: any): string {
  const date = toVestingDate(value);
  return date ? date.toISOString().slice(0, 10) : "unknown_date";
}

export function stableHash(value: any): string {
  return createHash("sha1").update(stableStringify(value)).digest("hex");
}

function saleIdPart(value: any): string {
  const text = cleanVestingString(value);
  return text || "unknown_sale";
}

function idString(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value.toHexString === "function") return value.toHexString();
  if (typeof value.toString === "function") return value.toString();
  return undefined;
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
