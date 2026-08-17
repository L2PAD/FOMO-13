import { createHash } from "crypto";
import { Types } from "mongoose";

export function normalizeReviewText(value: any): string {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function buildReviewFingerprint(input: {
  domain: string;
  reason: string;
  canonicalProjectId?: Types.ObjectId | string;
  projectKey?: string;
  normalizedProjectName?: string;
  projectName?: string;
  currentSourceType?: string;
  incomingSourceType?: string;
}): string {
  const reason = normalizeReviewText(input.reason);
  if (reason === "source_conflict") {
    return buildSourceConflictReviewFingerprint({
      canonicalProjectId: input.canonicalProjectId,
      domain: input.domain,
      currentSourceType: input.currentSourceType,
      incomingSourceType: input.incomingSourceType,
    });
  }
  if (reason === "missing_canonical_project") {
    return buildMissingCanonicalProjectReviewFingerprint({
      domain: input.domain,
      incomingSourceType: input.incomingSourceType,
      projectKey: input.projectKey,
      normalizedProjectName: input.normalizedProjectName,
      projectName: input.projectName,
    });
  }
  return stableReviewHash([
    "review_batch",
    normalizeReviewText(input.domain),
    reason,
    idString(input.canonicalProjectId) || "",
    normalizeReviewText(input.incomingSourceType),
    normalizeReviewText(
      input.projectKey || input.normalizedProjectName || input.projectName
    ),
  ]);
}

export function buildSourceConflictReviewFingerprint(input: {
  canonicalProjectId?: Types.ObjectId | string;
  domain: string;
  currentSourceType?: string;
  incomingSourceType?: string;
}): string {
  return stableReviewHash([
    "review_source_conflict",
    idString(input.canonicalProjectId),
    normalizeReviewText(input.domain),
    "SOURCE_CONFLICT",
    normalizeReviewText(input.currentSourceType),
    normalizeReviewText(input.incomingSourceType),
  ]);
}

export function buildMissingCanonicalProjectReviewFingerprint(input: {
  domain: string;
  incomingSourceType?: string;
  projectKey?: string;
  normalizedProjectName?: string;
  projectName?: string;
}): string {
  return stableReviewHash([
    "review_missing_canonical_project",
    normalizeReviewText(input.domain),
    "MISSING_CANONICAL_PROJECT",
    normalizeReviewText(input.incomingSourceType),
    normalizeReviewText(
      input.projectKey || input.normalizedProjectName || input.projectName
    ),
  ]);
}

export function stableReviewHash(value: any): string {
  return createHash("sha1").update(stableStringify(value)).digest("hex");
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
