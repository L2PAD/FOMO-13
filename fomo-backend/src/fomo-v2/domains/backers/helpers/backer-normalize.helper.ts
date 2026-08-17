import { Types } from "mongoose";
import { normalizeProjectSourceType } from "../../../shared/source-policy";
import {
  FOMO_V2_BACKER_STATUSES,
  FomoV2BackerSocials,
  FomoV2BackerStatus,
  FomoV2BackerType,
} from "../types";
import { inferBackerType } from "./backer-type.helper";

export function cleanBackerString(value: any): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

export function normalizeBackerName(value: any): string {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function slugifyBacker(value: any): string | undefined {
  const normalized = normalizeBackerName(value).replace(/_/g, "-");
  return normalized || undefined;
}

export function normalizeBackerStatus(value: any): FomoV2BackerStatus {
  const normalized = normalizeBackerName(value);
  if ((FOMO_V2_BACKER_STATUSES as readonly string[]).includes(normalized)) {
    return normalized as FomoV2BackerStatus;
  }
  if (normalized.includes("inactive") || normalized.includes("deprecated")) {
    return "inactive";
  }
  if (normalized.includes("merged")) return "merged";
  if (normalized.includes("review") || normalized.includes("conflict")) {
    return "needs_review";
  }
  return "active";
}

export function normalizeBackerUrl(value: any): string | undefined {
  const text = cleanBackerString(extractLinkValue(value));
  if (!text) return undefined;
  const prepared = /^[a-z]+:\/\//i.test(text) ? text : `https://${text}`;
  try {
    const parsed = new URL(prepared);
    const normalizedPath = parsed.pathname.replace(/\/+$/, "");
    const normalizedSearch = parsed.search || "";
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${normalizedPath}${normalizedSearch}`;
  } catch {
    return text;
  }
}

export function normalizeBackerTwitterUrl(value: any): string | undefined {
  const text = cleanBackerString(extractLinkValue(value));
  if (!text) return undefined;
  if (/twitter\.com|x\.com/i.test(text)) return normalizeBackerUrl(text);
  const handle = text.replace(/^@/, "").trim();
  return handle ? `https://x.com/${handle.toLowerCase()}` : undefined;
}

export function normalizeBackerSocials(value: any): FomoV2BackerSocials {
  const source = value && typeof value === "object" ? value : {};
  return cleanObject({
    twitter: normalizeBackerTwitterUrl(
      firstValue(source.twitter, source.x, source.twitterUrl)
    ),
    linkedin: normalizeBackerUrl(
      firstValue(source.linkedin, source.linkedIn, source.linkedinUrl)
    ),
    telegram: normalizeBackerUrl(firstValue(source.telegram, source.tg)),
    discord: normalizeBackerUrl(source.discord),
    medium: normalizeBackerUrl(source.medium),
    github: normalizeBackerUrl(source.github),
  });
}

export function normalizeBackerSourceRefs(value: any): any[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((ref) => {
      if (!ref || typeof ref !== "object") return undefined;
      const sourceType = normalizeProjectSourceType(
        ref.sourceType || ref.source
      );
      if (!sourceType) return undefined;
      return cleanObject({
        sourceType,
        sourceId: cleanBackerString(ref.sourceId),
        sourceEntityId: toBackerObjectId(ref.sourceEntityId) || cleanBackerString(ref.sourceEntityId),
        sourceSnapshotId:
          toBackerObjectId(ref.sourceSnapshotId) || cleanBackerString(ref.sourceSnapshotId),
        sourcePath: cleanBackerString(ref.sourcePath),
        sourceUrl: normalizeBackerUrl(ref.sourceUrl),
        confidence: toOptionalNumber(ref.confidence),
        metadata:
          ref.metadata && typeof ref.metadata === "object"
            ? ref.metadata
            : undefined,
      });
    })
    .filter(Boolean);
}

export function normalizeBackerPayload<T extends Record<string, any>>(
  input: T
): T & {
  normalizedName: string;
  slug?: string;
  backerType: FomoV2BackerType;
  status?: FomoV2BackerStatus;
} {
  const name = cleanBackerString(input.name) || "";
  const normalizedName =
    cleanBackerString(input.normalizedName) || normalizeBackerName(name);
  const backerType = inferBackerType(input);
  return cleanObject({
    ...input,
    name,
    normalizedName,
    slug: cleanBackerString(input.slug) || slugifyBacker(name),
    backerType,
    status: input.status ? normalizeBackerStatus(input.status) : undefined,
    website: normalizeBackerUrl(input.website),
    socials: normalizeBackerSocials(input.socials),
    logoUrl: normalizeBackerUrl(input.logoUrl || input.logo),
    avatarUrl: normalizeBackerUrl(input.avatarUrl || input.avatar),
    country: cleanBackerString(input.country),
    niche: cleanBackerString(input.niche || input.metadata?.rawType),
    sourceUrl: normalizeBackerUrl(input.sourceUrl),
    sourceRefs: normalizeBackerSourceRefs(input.sourceRefs),
  }) as any;
}

export function toBackerObjectId(value: any): Types.ObjectId | undefined {
  if (!value) return undefined;
  if (value instanceof Types.ObjectId) return value;
  const text = cleanBackerString(value);
  return text && Types.ObjectId.isValid(text)
    ? new Types.ObjectId(text)
    : undefined;
}

export function toBackerIdString(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value.toHexString === "function") return value.toHexString();
  if (typeof value.toString === "function") return value.toString();
  return undefined;
}

export function toOptionalNumber(value: any): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function cleanObject<T extends Record<string, any>>(input: T): T {
  const output: Record<string, any> = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (value === undefined) continue;
    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      !(value instanceof Types.ObjectId)
    ) {
      const nested = cleanObject(value as Record<string, any>);
      if (Object.keys(nested).length) output[key] = nested;
      continue;
    }
    if (Array.isArray(value) && value.length === 0) continue;
    output[key] = value;
  }
  return output as T;
}

export function uniqueBackerStrings(values: any[]): string[] {
  return Array.from(
    new Set(values.map(cleanBackerString).filter(Boolean) as string[])
  );
}

export function firstValue(...values: any[]): any {
  for (const value of values) {
    if (Array.isArray(value)) {
      const found = value.map(extractLinkValue).find(cleanBackerString);
      if (found) return found;
      continue;
    }
    const found = extractLinkValue(value);
    if (cleanBackerString(found)) return found;
  }
  return undefined;
}

export function extractLinkValue(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value !== "object") return undefined;
  return cleanBackerString(
    value.href || value.link || value.url || value.value || value.handle
  );
}
