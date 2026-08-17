import { createHash } from "crypto";
import { Types } from "mongoose";
import { normalizeProjectSourceType } from "../../../shared/source-policy";
import {
  cleanObject,
  cleanVestingString,
  firstFiniteNumber,
  normalizeVestingName,
} from "./vesting-normalize.helper";

export const DROPSTAB_VESTING_PARSER_COLLECTION = "dropstab_coin_detail_data";

export interface DropstabVestingProjectIdentity {
  sourceDocumentId?: string;
  sourceProjectId?: string;
  sourceId?: string;
  sourceSlug?: string;
  rawSlug?: string;
  sourceUrl?: string;
  name?: string;
  normalizedName?: string;
  symbol?: string;
  normalizedSymbol?: string;
  coingeckoId?: string;
}

export interface DropstabVestingSourceFilters {
  sourceType?: string;
  sourceSlug?: string;
  sourceProjectKey?: string;
}

export type DropstabVestingSourceTrackingScope =
  | "vesting_dataset"
  | "vesting_allocation_schedule"
  | "vesting_unlocks";

export interface DropstabVestingSourceContext {
  sourceType: string;
  vestingDatasetKey: string;
  sourceProjectKey: string;
  sourceDocumentId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
  relevantDataHash: string;
  sourceSnapshotId?: Types.ObjectId;
}

export function dropstabVestingProjectIdentity(
  sourceProject: Record<string, any>
): DropstabVestingProjectIdentity {
  const raw = sourceProject?.raw || {};
  const identity = sourceProject?.identity || {};
  const sourceDocumentId = toDropstabVestingIdString(sourceProject?._id);
  const currencyId = cleanVestingString(sourceProject?.currencyId);
  const sourceProjectId = cleanVestingString(
    sourceProject?.sourceProjectId ||
      sourceProject?.sourceId ||
      sourceProject?.coinId ||
      currencyId ||
      raw.sourceProjectId ||
      raw.coinId
  );
  const rawSlug = cleanVestingString(
    sourceProject?.coinSlug ||
      identity.slug ||
      sourceProject?.sourceSlug ||
      sourceProject?.slug ||
      raw.coinSlug ||
      raw.slug
  );
  const sourceSlug = normalizeDropstabVestingSlug(rawSlug || sourceProjectId);
  const sourceUrl =
    normalizeDropstabVestingUrl(sourceProject?.sourceUrl || identity.sourceUrl) ||
    (sourceSlug
      ? `https://dropstab.com/coins/${encodeURIComponent(sourceSlug)}`
      : undefined);
  const name = cleanVestingString(
    identity.name ||
      sourceProject?.name ||
      sourceProject?.coinName ||
      raw.name ||
      raw.coinName
  );
  const symbol = cleanVestingString(
    identity.symbol ||
      sourceProject?.symbol ||
      sourceProject?.coinSymbol ||
      raw.symbol ||
      raw.ticker
  );
  const coingeckoId = normalizeDropstabProviderId(
    sourceProject?.coingeckoId ||
      sourceProject?.providerIds?.coingeckoId ||
      sourceProject?.market?.coingeckoId ||
      raw.coingeckoId ||
      raw.providerIds?.coingeckoId
  );

  return {
    sourceDocumentId,
    sourceProjectId,
    sourceId: currencyId || sourceProjectId || sourceSlug || sourceDocumentId,
    sourceSlug,
    rawSlug,
    sourceUrl,
    name,
    normalizedName: normalizeDropstabProjectName(name),
    symbol,
    normalizedSymbol: normalizeDropstabSymbol(symbol),
    coingeckoId,
  };
}

export function buildDropstabVestingQuery(
  filters: DropstabVestingSourceFilters = {}
): Record<string, any> {
  const sourceType = normalizeDropstabSourceType(filters.sourceType);
  const query: Record<string, any> = {
    source: sourceType,
    $or: [
      { "tokenAllocation.0": { $exists: true } },
      { "vestingRounds.0": { $exists: true } },
      { "vestingSchedule.0": { $exists: true } },
      { "vestingTimeline.0": { $exists: true } },
      { "unlockingEvents.0": { $exists: true } },
      { publicVesting: { $exists: true, $ne: null } },
      ...dropstabVestingSummaryMeaningfulClauses(),
    ],
  };
  const filterClauses = [
    ...dropstabSourceSlugClauses(filters.sourceSlug),
    ...dropstabSourceProjectKeyClauses(filters.sourceProjectKey),
  ];
  if (filterClauses.length) query.$and = [{ $or: filterClauses }];
  return query;
}

export function dropstabSourceSlugClauses(value: any): Record<string, any>[] {
  const sourceSlug = normalizeDropstabVestingSlug(value);
  if (!sourceSlug) return [];
  return [
    { sourceSlug },
    { slug: sourceSlug },
    { coinSlug: sourceSlug },
    { "identity.slug": sourceSlug },
    { "raw.slug": sourceSlug },
    { "raw.coinSlug": sourceSlug },
  ];
}

export function dropstabSourceProjectKeyClauses(
  value: any
): Record<string, any>[] {
  const key = cleanVestingString(value);
  if (!key) return [];
  const clauses: Record<string, any>[] = [
    { sourceProjectId: key },
    { sourceId: key },
    { coinId: key },
    { currencyId: key },
    { "raw.sourceProjectId": key },
    { "raw.coinId": key },
  ];
  if (Types.ObjectId.isValid(key)) clauses.push({ _id: new Types.ObjectId(key) });
  return clauses;
}

export function dropstabVestingSummaryMeaningfulClauses(): Array<Record<string, any>> {
  return [
    "totalAmount",
    "unlockedAmount",
    "lockedAmount",
    "untrackedAmount",
    "unlockedPercent",
    "lockedPercent",
    "untrackedPercent",
    "lastUnlockDate",
    "nextUnlockDate",
  ].map((field) => ({
    [`vestingSummary.${field}`]: { $exists: true, $nin: [null, ""] },
  }));
}

export function dropstabSourceEntityKey(
  identity: DropstabVestingProjectIdentity,
  sourceType = "dropstab"
): string {
  return [
    normalizeDropstabSourceType(sourceType),
    "project",
    identity.sourceId ||
      identity.sourceProjectId ||
      identity.sourceSlug ||
      identity.sourceDocumentId ||
      "unknown",
  ].join(":");
}

export function dropstabSourceProjectKey(
  identity: DropstabVestingProjectIdentity
): string {
  return (
    identity.sourceId ||
    identity.sourceProjectId ||
    identity.sourceSlug ||
    identity.sourceDocumentId ||
    "unknown"
  );
}

export function dropstabVestingDatasetKey(input: {
  canonicalProjectId: Types.ObjectId | string;
  sourceType?: string;
}): string {
  return [
    normalizeDropstabSourceType(input.sourceType),
    "vesting_dataset",
    toDropstabVestingIdString(input.canonicalProjectId) || "unknown_project",
  ].join(":");
}

export function dropstabTokenAllocationKey(input: {
  canonicalProjectId: Types.ObjectId | string;
  sourceType?: string;
  saleId?: number | string;
  normalizedName?: string;
  sourceIndex?: number;
}): string {
  return buildDropstabCandidateKey([
    "token_allocation",
    normalizeDropstabSourceType(input.sourceType),
    toDropstabVestingIdString(input.canonicalProjectId),
    input.saleId,
    input.normalizedName,
    input.saleId === undefined && !input.normalizedName
      ? input.sourceIndex
      : undefined,
  ]);
}

export function dropstabVestingRoundKey(input: {
  canonicalProjectId: Types.ObjectId | string;
  sourceType?: string;
  saleId?: number | string;
  normalizedRoundName?: string;
  sourceIndex?: number;
}): string {
  return buildDropstabCandidateKey([
    "vesting_round",
    normalizeDropstabSourceType(input.sourceType),
    toDropstabVestingIdString(input.canonicalProjectId),
    input.saleId,
    input.normalizedRoundName,
    input.saleId === undefined && !input.normalizedRoundName
      ? input.sourceIndex
      : undefined,
  ]);
}

export function dropstabVestingScheduleKey(input: {
  canonicalProjectId: Types.ObjectId | string;
  sourceType?: string;
  saleId?: number | string;
  normalizedRoundName?: string;
  sourceArray?: string;
  sourceIndex?: number;
  tgeUnlockPercent?: number;
  vestingType?: string;
  vestingFrequency?: string;
  vestingDurationMonths?: number;
  startDate?: Date | string;
  endDate?: Date | string;
}): string {
  return buildDropstabCandidateKey([
    "vesting_schedule",
    normalizeDropstabSourceType(input.sourceType),
    toDropstabVestingIdString(input.canonicalProjectId),
    input.saleId,
    input.normalizedRoundName,
    input.sourceArray,
    input.sourceIndex,
    input.tgeUnlockPercent,
    input.vestingType,
    input.vestingFrequency,
    input.vestingDurationMonths,
    dateKey(input.startDate),
    dateKey(input.endDate),
  ]);
}

export function dropstabUnlockEventKey(input: {
  canonicalProjectId: Types.ObjectId | string;
  sourceType?: string;
  saleId?: number | string;
  normalizedRoundName?: string;
  unlockDate?: Date | string;
  unlockType?: string;
  sourceEventId?: string;
  sourceIndex?: number;
}): string {
  return buildDropstabCandidateKey([
    "unlock_event",
    normalizeDropstabSourceType(input.sourceType),
    toDropstabVestingIdString(input.canonicalProjectId),
    input.sourceEventId,
    input.saleId,
    input.normalizedRoundName,
    dateKey(input.unlockDate),
    input.unlockType,
    input.sourceIndex,
  ]);
}

export function dropstabVestingRawSnapshotPayload(
  sourceProject: Record<string, any>
): Record<string, any> {
  return sanitizeSnapshotValue(sourceProject, true) as Record<string, any>;
}

export function dropstabVestingRelevantPayload(
  sourceProject: Record<string, any>,
  scope: DropstabVestingSourceTrackingScope = "vesting_dataset"
): Record<string, any> {
  const identity = dropstabVestingProjectIdentity(sourceProject);
  const payload: Record<string, any> = {
    scope,
    identity: cleanObject({
      sourceDocumentId: identity.sourceDocumentId,
      sourceProjectId: identity.sourceProjectId,
      sourceId: identity.sourceId,
      sourceSlug: identity.sourceSlug,
      rawSlug: identity.rawSlug,
      sourceUrl: identity.sourceUrl,
      name: identity.name,
      normalizedName: identity.normalizedName,
      symbol: identity.symbol,
      normalizedSymbol: identity.normalizedSymbol,
      coingeckoId: identity.coingeckoId,
    }),
  };

  if (scope === "vesting_dataset" || scope === "vesting_allocation_schedule") {
    payload.tokenAllocation = sourceProject?.tokenAllocation;
    payload.vestingRounds = sourceProject?.vestingRounds;
    payload.vestingSchedule = sourceProject?.vestingSchedule;
    payload.vestingTimeline = sourceProject?.vestingTimeline;
    payload.publicVesting = sourceProject?.publicVesting;
  }

  if (scope === "vesting_dataset" || scope === "vesting_unlocks") {
    payload.unlockingEvents = sourceProject?.unlockingEvents;
  }

  return sanitizeSnapshotValue(payload, true) as Record<string, any>;
}

export function dropstabVestingRelevantDataHash(
  sourceProject: Record<string, any>,
  scope: DropstabVestingSourceTrackingScope = "vesting_dataset"
): string {
  return dropstabVestingPayloadHash(
    dropstabVestingRelevantPayload(sourceProject, scope)
  );
}

export function dropstabVestingSourceStatePayload(input: {
  sourceProject: Record<string, any>;
  sourceType?: string;
  canonicalProjectId?: Types.ObjectId | string;
  importStatus?: string;
  linkStatus?: string;
  matchedBy?: string;
  scope?: DropstabVestingSourceTrackingScope;
}): Record<string, any> {
  const sourceType = normalizeDropstabSourceType(input.sourceType);
  const scope = input.scope || "vesting_dataset";
  const identity = dropstabVestingProjectIdentity(input.sourceProject);
  const sourceProjectKey = dropstabSourceProjectKey(identity);
  const relevantDataHash = dropstabVestingRelevantDataHash(
    input.sourceProject,
    scope
  );

  return cleanObject({
    scope,
    source: sourceType,
    vestingDatasetKey: input.canonicalProjectId
      ? dropstabVestingDatasetKey({
          canonicalProjectId: input.canonicalProjectId,
          sourceType,
        })
      : undefined,
    canonicalProjectId: toDropstabVestingIdString(input.canonicalProjectId),
    sourceProjectKey,
    sourceDocumentId: identity.sourceDocumentId,
    sourceProjectId: identity.sourceProjectId,
    sourceId: identity.sourceId,
    sourceSlug: identity.sourceSlug,
    sourceUrl: identity.sourceUrl,
    name: identity.name,
    normalizedName: identity.normalizedName,
    symbol: identity.symbol,
    normalizedSymbol: identity.normalizedSymbol,
    coingeckoId: identity.coingeckoId,
    relevantDataHash,
    importStatus: cleanVestingString(input.importStatus),
    linkStatus: cleanVestingString(input.linkStatus),
    matchedBy: cleanVestingString(input.matchedBy),
    blockCounts: {
      tokenAllocation: arrayLength(input.sourceProject?.tokenAllocation),
      vestingRounds: arrayLength(input.sourceProject?.vestingRounds),
      vestingSchedule: arrayLength(input.sourceProject?.vestingSchedule),
      vestingTimeline: arrayLength(input.sourceProject?.vestingTimeline),
      unlockingEvents: arrayLength(input.sourceProject?.unlockingEvents),
      hasVestingSummary: Boolean(input.sourceProject?.vestingSummary),
      hasPublicVesting: Boolean(input.sourceProject?.publicVesting),
    },
  });
}

export function dropstabVestingSourceContext(input: {
  sourceProject: Record<string, any>;
  canonicalProjectId: Types.ObjectId | string;
  sourceType?: string;
  sourceSnapshotId?: Types.ObjectId | string;
  scope?: DropstabVestingSourceTrackingScope;
}): DropstabVestingSourceContext {
  const sourceType = normalizeDropstabSourceType(input.sourceType);
  const identity = dropstabVestingProjectIdentity(input.sourceProject);
  return {
    sourceType,
    vestingDatasetKey: dropstabVestingDatasetKey({
      canonicalProjectId: input.canonicalProjectId,
      sourceType,
    }),
    sourceProjectKey: dropstabSourceProjectKey(identity),
    sourceDocumentId: identity.sourceDocumentId,
    sourceSlug: identity.sourceSlug,
    sourceUrl: identity.sourceUrl,
    relevantDataHash: dropstabVestingRelevantDataHash(
      input.sourceProject,
      input.scope || "vesting_dataset"
    ),
    sourceSnapshotId: toDropstabObjectId(input.sourceSnapshotId),
  };
}

export function dropstabVestingPayloadHash(payload: Record<string, any>): string {
  return stableDropstabVestingHash(payload);
}

export function buildDropstabSourceRef(input: {
  identity: DropstabVestingProjectIdentity;
  sourceType: string;
  sourcePath: string;
  sourceId?: string | number;
  sourceSnapshotId?: Types.ObjectId | string;
  vestingDatasetKey?: string;
  confidence?: string;
  metadata?: Record<string, any>;
}): Record<string, any> {
  return cleanObject({
    source: normalizeDropstabSourceType(input.sourceType),
    sourceId:
      input.sourceId === undefined
        ? input.identity.sourceProjectId || input.identity.sourceId
        : String(input.sourceId),
    sourceSlug: input.identity.sourceSlug,
    sourceUrl: input.identity.sourceUrl,
    sourcePath: input.sourcePath,
    sourceSnapshotId: toDropstabObjectId(input.sourceSnapshotId),
    observedAt: new Date(),
    confidence: input.confidence || "high",
    metadata: {
      sourceDocumentId: input.identity.sourceDocumentId,
      sourceProjectKey: dropstabSourceProjectKey(input.identity),
      vestingDatasetKey: input.vestingDatasetKey,
      ...(input.metadata || {}),
    },
  });
}

export function buildDropstabCandidateKey(parts: any[]): string {
  return stableDropstabVestingHash(
    parts.map((part) =>
      typeof part === "number" && Number.isFinite(part)
        ? Math.round(part * 1_000_000) / 1_000_000
        : cleanVestingString(part) || ""
    )
  );
}

export function economicNumberBucket(value: any): string {
  const number = firstFiniteNumber(value);
  if (number === undefined) return "";
  if (Math.abs(number) < 1) {
    return String(Math.round(number * 1_000_000) / 1_000_000);
  }
  if (Math.abs(number) < 1_000_000) {
    return String(Math.round(number / 1_000) * 1_000);
  }
  return String(Math.round(number / 1_000_000) * 1_000_000);
}

export function normalizeDropstabSourceType(value: any): string {
  return normalizeProjectSourceType(value || "dropstab");
}

export function normalizeDropstabVestingSlug(value: any): string | undefined {
  const text = cleanVestingString(value);
  if (!text) return undefined;
  return text
    .toLowerCase()
    .replace(/^https?:\/\/[^/]+\/?/i, "")
    .replace(/^coins\//i, "")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeDropstabVestingUrl(value: any): string | undefined {
  const text = cleanVestingString(value);
  if (!text) return undefined;
  const prepared = /^[a-z]+:\/\//i.test(text) ? text : `https://${text}`;
  try {
    const parsed = new URL(prepared);
    const path = parsed.pathname.replace(/\/+$/, "");
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${path}${parsed.search}`;
  } catch {
    return text;
  }
}

export function normalizeDropstabProjectName(value: any): string | undefined {
  const normalized = normalizeVestingName(value).replace(/_/g, " ");
  return normalized || undefined;
}

export function normalizeDropstabSymbol(value: any): string | undefined {
  const text = cleanVestingString(value);
  return text ? text.replace(/^\$/, "").toUpperCase() : undefined;
}

export function normalizeDropstabProviderId(value: any): string | undefined {
  return cleanVestingString(value)?.toLowerCase();
}

export function toDropstabVestingIdString(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value.toHexString === "function") return value.toHexString();
  if (typeof value.toString === "function") return value.toString();
  return undefined;
}

export function toDropstabObjectId(value: any): Types.ObjectId | undefined {
  if (!value) return undefined;
  if (value instanceof Types.ObjectId) return value;
  const text = cleanVestingString(value);
  return text && Types.ObjectId.isValid(text)
    ? new Types.ObjectId(text)
    : undefined;
}

export function stableDropstabVestingHash(value: any): string {
  return createHash("sha1").update(stableStringify(value)).digest("hex");
}

function arrayLength(value: any): number {
  return Array.isArray(value) ? value.length : 0;
}

function dateKey(value: any): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : "";
}

function sanitizeSnapshotValue(value: any, topLevel = false): any {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map((item) => sanitizeSnapshotValue(item));
  if (typeof value === "object") {
    if (typeof value.toHexString === "function") return value.toHexString();
    const output: Record<string, any> = {};
    for (const key of Object.keys(value).sort()) {
      if (topLevel && ["_id", "createdAt", "updatedAt"].includes(key)) continue;
      output[key] = sanitizeSnapshotValue(value[key]);
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
    if (typeof value.toHexString === "function") {
      return JSON.stringify(value.toHexString());
    }
    return `{${Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
