import { Types } from "mongoose";
import {
  FOMO_V2_CONFIDENCE_LEVELS,
  FomoV2Confidence,
} from "../../../fomo-v2.types";
import {
  FOMO_V2_FUNDING_PARTICIPANT_ROLES,
  FOMO_V2_FUNDING_PARTICIPANT_STATUSES,
  FOMO_V2_FUNDING_ROUND_STATUSES,
  FomoV2FundingParticipantRole,
  FomoV2FundingParticipantStatus,
  FomoV2FundingRoundStatus,
  FomoV2FundingRoundType,
  FomoV2FundingSourceRef,
} from "../types";

export function cleanFundingString(value: any): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

export function normalizeFundingName(value: any): string {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeFundingRoundType(value: any): FomoV2FundingRoundType {
  const normalized = normalizeFundingName(value);
  if (!normalized) return "unknown";
  if (normalized.includes("pre_seed") || normalized.includes("preseed"))
    return "pre_seed";
  if (normalized.includes("seed")) return "seed";
  if (normalized.includes("strategic")) return "strategic";
  if (normalized.includes("private")) return "private";
  if (
    normalized.includes("public") ||
    normalized.includes("ico") ||
    normalized.includes("ido") ||
    normalized.includes("ieo")
  ) {
    return "public_sale";
  }
  if (normalized.includes("launchpad")) return "launchpad";
  if (normalized.includes("series")) return "series";
  if (
    normalized === "m_a" ||
    normalized.includes("merger") ||
    normalized.includes("acquisition")
  )
    return "ma";
  if (normalized.includes("grant")) return "grant";
  if (normalized.includes("airdrop")) return "airdrop";
  if (
    normalized.includes("tge") ||
    normalized.includes("distribution") ||
    normalized.includes("token_launch")
  ) {
    return "tge_distribution";
  }
  if (normalized.includes("funding") || normalized.includes("round"))
    return "funding";
  return "unknown";
}

export function normalizeFundingRoundStatus(
  value: any
): FomoV2FundingRoundStatus {
  const normalized = normalizeFundingName(value);
  if (
    (FOMO_V2_FUNDING_ROUND_STATUSES as readonly string[]).includes(normalized)
  ) {
    return normalized as FomoV2FundingRoundStatus;
  }
  if (!normalized) return "proposed";
  if (normalized.includes("cancel")) return "cancelled";
  if (normalized.includes("conflict")) return "conflict";
  if (normalized.includes("superseded")) return "superseded";
  if (normalized.includes("end") || normalized.includes("closed"))
    return "ended";
  if (normalized.includes("launch")) return "launched";
  if (normalized.includes("upcoming")) return "upcoming";
  if (normalized.includes("planned")) return "planned";
  if (normalized.includes("active")) return "active";
  return "proposed";
}

export function normalizeFundingParticipantRole(
  value: any,
  isLead?: boolean
): FomoV2FundingParticipantRole {
  if (isLead) return "lead";
  const normalized = normalizeFundingName(value);
  if (
    (FOMO_V2_FUNDING_PARTICIPANT_ROLES as readonly string[]).includes(
      normalized
    )
  ) {
    return normalized as FomoV2FundingParticipantRole;
  }
  if (normalized.includes("lead")) return "lead";
  if (normalized.includes("advisor")) return "advisor";
  if (
    normalized.includes("investor") ||
    normalized.includes("participant") ||
    normalized.includes("backer")
  ) {
    return "participant";
  }
  return "participant";
}

export function normalizeFundingParticipantStatus(
  value: any
): FomoV2FundingParticipantStatus {
  const normalized = normalizeFundingName(value);
  if (
    (FOMO_V2_FUNDING_PARTICIPANT_STATUSES as readonly string[]).includes(
      normalized
    )
  ) {
    return normalized as FomoV2FundingParticipantStatus;
  }
  if (!normalized) return "proposed";
  if (normalized.includes("conflict")) return "conflict";
  if (normalized.includes("superseded")) return "superseded";
  if (normalized.includes("deprecated")) return "deprecated";
  if (normalized.includes("active") || normalized.includes("verified"))
    return "active";
  return "proposed";
}

export function normalizeFundingConfidence(value: any): FomoV2Confidence {
  const normalized = normalizeFundingName(value);
  if ((FOMO_V2_CONFIDENCE_LEVELS as readonly string[]).includes(normalized)) {
    return normalized as FomoV2Confidence;
  }
  return "none";
}

export function normalizeFundingCurrency(
  value: any,
  fallback?: string
): string | undefined {
  const text = cleanFundingString(value || fallback);
  return text ? text.toUpperCase() : undefined;
}

export function toFundingDate(value: any): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? undefined : value;
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export function fundingDateBucket(
  date?: Date | string,
  fallback?: any
): string | undefined {
  const parsed = toFundingDate(date);
  if (parsed) return parsed.toISOString().slice(0, 10);
  const text = cleanFundingString(fallback);
  if (!text) return undefined;
  const yearMonthDay = text.match(/\d{4}-\d{2}-\d{2}/);
  if (yearMonthDay) return yearMonthDay[0];
  const yearMonth = text.match(/\d{4}-\d{2}/);
  if (yearMonth) return yearMonth[0];
  const quarter = text.toUpperCase().match(/Q[1-4]\s*20\d{2}/);
  if (quarter) return quarter[0].replace(/\s+/g, "");
  const year = text.match(/20\d{2}/);
  return year ? year[0] : text;
}

export function toFundingObjectId(value: any): Types.ObjectId | undefined {
  if (!value) return undefined;
  if (value instanceof Types.ObjectId) return value;
  const text = cleanFundingString(value);
  return text && Types.ObjectId.isValid(text)
    ? new Types.ObjectId(text)
    : undefined;
}

export function normalizeFundingSourceRefs(
  value: any
): FomoV2FundingSourceRef[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((ref) => normalizeFundingSourceRef(ref))
    .filter((ref): ref is FomoV2FundingSourceRef => Boolean(ref));
}

export function normalizeFundingSourceRef(
  value: any
): FomoV2FundingSourceRef | undefined {
  if (!value || typeof value !== "object") return undefined;
  const source = cleanFundingString(value.source);
  if (!source) return undefined;
  return cleanObject({
    source,
    sourceId: cleanFundingString(value.sourceId),
    sourceSlug: cleanFundingString(value.sourceSlug),
    sourceUrl: cleanFundingString(value.sourceUrl),
    sourcePath: cleanFundingString(value.sourcePath),
    sourceEntityKey: cleanFundingString(value.sourceEntityKey),
    sourceEntityId: toFundingObjectId(value.sourceEntityId),
    sourceSnapshotId: toFundingObjectId(value.sourceSnapshotId),
    observedAt: toFundingDate(value.observedAt),
    confidence: normalizeFundingConfidence(value.confidence),
    metadata:
      value.metadata && typeof value.metadata === "object"
        ? value.metadata
        : undefined,
  });
}

export function cleanObject<T extends Record<string, any>>(input: T): T {
  const output: Record<string, any> = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (value === undefined) continue;
    output[key] = value;
  }
  return output as T;
}
