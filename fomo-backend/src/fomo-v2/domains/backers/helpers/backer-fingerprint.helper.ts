import { createHash } from "crypto";
import { normalizeProjectSourceType } from "../../../shared/source-policy";
import { FomoV2BackerType } from "../types";
import { cleanBackerString, normalizeBackerName } from "./backer-normalize.helper";
import {
  inferBackerType,
  isPersonBackerOverride,
} from "./backer-type.helper";

export interface BackerFingerprintInput {
  name?: string;
  normalizedName?: string;
  backerType?: FomoV2BackerType | string;
}

export function buildBackerFingerprint(input: BackerFingerprintInput): string {
  const normalizedName =
    cleanBackerString(input.normalizedName) ||
    normalizeBackerName(input.name);
  const backerType = isPersonBackerOverride(input)
    ? "person"
    : inferBackerType(input);
  return stableBackerHash(["backer", normalizedName || "unknown", backerType]);
}

export function buildBackerSourceIdentityKey(input: {
  sourceType?: string;
  sourceInvestorId?: string;
  sourceId?: string;
}): string | undefined {
  const sourceType = normalizeProjectSourceType(input.sourceType);
  const sourceId = cleanBackerString(input.sourceInvestorId || input.sourceId);
  return sourceType && sourceId ? `${sourceType}:${sourceId}` : undefined;
}

export function stableBackerHash(value: any): string {
  return createHash("sha1").update(stableStringify(value)).digest("hex");
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
