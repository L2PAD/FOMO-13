import { createHash } from "crypto";
import { Types } from "mongoose";
import {
  cleanFundingString,
  fundingDateBucket,
  normalizeFundingName,
  normalizeFundingRoundType,
} from "./funding-normalize.helper";
import { FomoV2FundingSourceRef } from "../types";

export interface FomoV2FundingRoundFingerprintInput {
  canonicalProjectId: Types.ObjectId | string;
  roundType?: string;
  normalizedRoundType?: string;
  roundName?: string;
  normalizedRoundName?: string;
  announcedDate?: Date | string;
  date?: Date | string;
  dateBucket?: string;
  raisedAmount?: number;
  valuation?: number;
  tokenPrice?: number;
  sourceRefs?: FomoV2FundingSourceRef[];
  primarySource?: string;
  sourceId?: string;
}

export interface FomoV2FundingRoundParticipantFingerprintInput {
  canonicalProjectId?: Types.ObjectId | string;
  fundingRoundId: Types.ObjectId | string;
  backerId?: Types.ObjectId | string;
  backerName?: string;
  normalizedBackerName?: string;
  sourceBackerRef?: string;
  sourceBackerId?: string;
  sourceEntityId?: Types.ObjectId | string;
  role?: string;
}

export function buildFundingRoundFingerprint(
  input: FomoV2FundingRoundFingerprintInput
): string {
  const semanticParts = fundingRoundSemanticParts(input);
  const sourceKey = sourceFingerprintPart(input) || "unknown-source";
  return stableHash(["funding_round", sourceKey, ...semanticParts]);
}

/** Exact v1 fingerprint used before funding identities became source-scoped. */
export function buildLegacyFundingRoundFingerprint(
  input: FomoV2FundingRoundFingerprintInput
): string {
  const semanticParts = fundingRoundSemanticParts(input);
  const hasWeakSemanticIdentity = semanticParts
    .slice(1)
    .every((part) => String(part).startsWith("unknown"));
  const sourceKey = hasWeakSemanticIdentity
    ? sourceFingerprintPart(input)
    : undefined;
  return stableHash(["funding_round", ...semanticParts, sourceKey || ""]);
}

function fundingRoundSemanticParts(
  input: FomoV2FundingRoundFingerprintInput
): Array<string | undefined> {
  const normalizedRoundType =
    cleanFundingString(input.normalizedRoundType) ||
    normalizeFundingRoundType(input.roundType || input.roundName);
  const normalizedRoundName =
    cleanFundingString(input.normalizedRoundName) ||
    normalizeFundingName(input.roundName);
  return [
    idString(input.canonicalProjectId),
    normalizedRoundType || "unknown",
    fundingDateBucket(input.announcedDate || input.date, input.dateBucket) ||
      "unknown-date",
    amountBucket(input.raisedAmount),
    amountBucket(input.valuation),
    tokenPriceBucket(input.tokenPrice),
    normalizedRoundName || "unknown-round-name",
  ];
}

export function buildFundingRoundParticipantFingerprint(
  input: FomoV2FundingRoundParticipantFingerprintInput
): string {
  const backerIdentity =
    idString(input.backerId) ||
    cleanFundingString(input.normalizedBackerName) ||
    normalizeFundingName(input.backerName) ||
    cleanFundingString(input.sourceBackerRef) ||
    cleanFundingString(input.sourceBackerId) ||
    idString(input.sourceEntityId) ||
    "unknown-backer";

  return stableHash([
    "funding_round_participant",
    idString(input.fundingRoundId),
    idString(input.canonicalProjectId) || "",
    backerIdentity,
    normalizeFundingName(input.role || "participant") || "participant",
  ]);
}

export function stableHash(value: any): string {
  return createHash("sha1").update(stableStringify(value)).digest("hex");
}

function sourceFingerprintPart(
  input: FomoV2FundingRoundFingerprintInput
): string | undefined {
  const primarySource = cleanFundingString(input.primarySource)?.toLowerCase();
  const sourceId = cleanFundingString(input.sourceId);
  const direct = [primarySource, sourceId].filter(Boolean).join(":");
  if (direct) return direct;
  const ref = (input.sourceRefs || []).find((item) => item?.source);
  if (!ref) return undefined;
  return [
    cleanFundingString(ref.source)?.toLowerCase(),
    cleanFundingString(ref.sourceId),
  ]
    .filter(Boolean)
    .join(":");
}

function amountBucket(value: any): string {
  const number = Number(value);
  if (!Number.isFinite(number)) return "unknown-amount";
  if (Math.abs(number) < 1) return "0";
  if (Math.abs(number) < 1_000_000)
    return String(Math.round(number / 100_000) * 100_000);
  return String(Math.round(number / 1_000_000) * 1_000_000);
}

function tokenPriceBucket(value: any): string {
  const number = Number(value);
  if (!Number.isFinite(number) || Math.abs(number) < 1e-12)
    return "unknown-token-price";
  return String(Math.round(number * 1_000_000_000) / 1_000_000_000);
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
