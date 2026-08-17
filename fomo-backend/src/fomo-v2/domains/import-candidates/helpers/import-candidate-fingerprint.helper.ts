import { createHash } from "crypto";

export interface ImportCandidateFingerprintInput {
  domain: string;
  entityType: string;
  sourceType: string;
  normalizedName?: string;
  normalizedSymbol?: string;
  normalizedSlug?: string;
  sourceId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
}

export function buildImportCandidateFingerprint(
  input: ImportCandidateFingerprintInput
): string {
  const domain = normalizeImportCandidateText(input.domain);
  const entityType = normalizeImportCandidateText(input.entityType);
  const sourceType = normalizeImportCandidateText(input.sourceType);

  if (entityType === "project") {
    return stableImportCandidateHash([
      "import_candidate",
      domain,
      "project",
      sourceType,
      normalizeImportCandidateText(input.normalizedName),
      normalizeImportCandidateText(input.normalizedSymbol),
      normalizeImportCandidateText(input.normalizedSlug),
    ]);
  }

  if (entityType === "backer") {
    return stableImportCandidateHash([
      "import_candidate",
      domain,
      "backer",
      sourceType,
      normalizeImportCandidateText(input.normalizedName),
    ]);
  }

  return stableImportCandidateHash([
    "import_candidate",
    domain,
    entityType,
    sourceType,
    normalizeImportCandidateText(input.normalizedName),
    normalizeImportCandidateText(input.normalizedSymbol),
    normalizeImportCandidateText(input.normalizedSlug),
    cleanImportCandidateString(input.sourceId),
    normalizeImportCandidateText(input.sourceSlug),
    normalizeImportCandidateUrl(input.sourceUrl),
  ]);
}

export function normalizeImportCandidateText(value: any): string {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeImportCandidateSlug(value: any): string | undefined {
  const normalized = normalizeImportCandidateText(value).replace(/_/g, "-");
  return normalized || undefined;
}

export function normalizeImportCandidateUrl(value: any): string | undefined {
  const text = cleanImportCandidateString(value);
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

export function cleanImportCandidateString(value: any): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

export function stableImportCandidateHash(value: any): string {
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
