import { createHash } from "crypto";

export type ImageUrlCategory =
  | "already_r2_assets"
  | "local_uploads_relative"
  | "local_uploads_absolute"
  | "coingecko"
  | "dropstab"
  | "icodrops"
  | "other_external"
  | "data_image_base64"
  | "empty"
  | "invalid";

export type ExternalAssetProvider =
  | "coingecko"
  | "dropstab"
  | "icodrops"
  | "local_uploads"
  | "unknown";

export interface ImageFieldValue {
  value: unknown;
  displayPath: string;
}

const R2_ASSET_HOSTS = new Set(["assets.fomo.cx", "dev-assets.fomo.cx"]);
const LOCAL_UPLOAD_HOSTS = new Set(["api.fomo.cx", "devapi.fomo.cx"]);

export function classifyImageValue(value: unknown): ImageUrlCategory {
  if (typeof value !== "string") {
    return value === undefined || value === null ? "empty" : "invalid";
  }

  const url = value.trim();
  if (!url) return "empty";

  if (/^data:image\/[a-z0-9.+-]+;base64,/i.test(url)) {
    return "data_image_base64";
  }

  if (/^\/?uploads(?:\/|$)/i.test(url)) {
    return "local_uploads_relative";
  }

  if (!/^https?:\/\//i.test(url)) {
    return "invalid";
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch (error) {
    return "invalid";
  }

  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();

  if (R2_ASSET_HOSTS.has(host)) return "already_r2_assets";
  if (LOCAL_UPLOAD_HOSTS.has(host) && path.startsWith("/uploads/")) {
    return "local_uploads_absolute";
  }
  if (host.includes("coingecko.com")) return "coingecko";
  if (host.includes("dropstab.com")) return "dropstab";
  if (host.includes("icodrops.com")) return "icodrops";

  return "other_external";
}

export function providerFromCategory(category: ImageUrlCategory): ExternalAssetProvider {
  if (category === "coingecko") return "coingecko";
  if (category === "dropstab") return "dropstab";
  if (category === "icodrops") return "icodrops";
  if (category === "local_uploads_absolute" || category === "local_uploads_relative") {
    return "local_uploads";
  }

  return "unknown";
}

export function isMirrorCandidateCategory(category: ImageUrlCategory): boolean {
  return [
    "local_uploads_absolute",
    "local_uploads_relative",
    "coingecko",
    "dropstab",
    "icodrops",
    "other_external",
  ].includes(category);
}

export function normalizeSourceUrl(value: string): string {
  return value.trim();
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function getImageFieldValues(document: any, fieldPath: string): ImageFieldValue[] {
  const parts = fieldPath.split(".").filter(Boolean);
  const results: ImageFieldValue[] = [];

  const visit = (node: any, index: number, displayParts: string[]) => {
    if (index >= parts.length) {
      results.push({
        value: node,
        displayPath: displayParts.join("."),
      });
      return;
    }

    const rawPart = parts[index];
    const isArrayPart = rawPart.endsWith("[]");
    const fieldName = isArrayPart ? rawPart.slice(0, -2) : rawPart;
    const nextValue = node && typeof node === "object" ? node[fieldName] : undefined;

    if (isArrayPart) {
      if (!Array.isArray(nextValue) || nextValue.length === 0) {
        results.push({
          value: undefined,
          displayPath: [...displayParts, `${fieldName}[]`].join("."),
        });
        return;
      }

      nextValue.forEach((item, itemIndex) => {
        visit(item, index + 1, [...displayParts, `${fieldName}[${itemIndex}]`]);
      });
      return;
    }

    visit(nextValue, index + 1, [...displayParts, fieldName]);
  };

  visit(document, 0, []);

  return results.length ? results : [{ value: undefined, displayPath: fieldPath }];
}

export function topLevelField(fieldPath: string): string {
  return fieldPath.split(".")[0].replace(/\[\]$/, "");
}

export function buildLegacyUploadUrl(value: string): string {
  const normalized = value.trim();
  if (/^https?:\/\//i.test(normalized)) return normalized;

  const configuredBase =
    process.env.ASSET_LEGACY_BASE_URL ||
    process.env.API_URL ||
    process.env.NEXT_PUBLIC_LOADER_API ||
    "https://api.fomo.cx";
  const base = configuredBase.replace(/\/+$/, "").replace(/\/api$/i, "");
  const uploadPath = normalized.replace(/^\/+/, "");

  return `${base}/${uploadPath}`;
}

export function contentTypeToExtension(contentType: string): string | null {
  const normalized = contentType.split(";")[0].trim().toLowerCase();

  if (normalized === "image/jpeg") return "jpg";
  if (normalized === "image/png") return "png";
  if (normalized === "image/webp") return "webp";
  if (normalized === "image/gif") return "gif";

  return null;
}

export function normalizeContentType(contentType?: string): string {
  return String(contentType || "").split(";")[0].trim().toLowerCase();
}

export function parsePositiveInteger(value: string | undefined, optionName: string, fallback: number): number {
  if (value === undefined) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid --${optionName} value "${value}". Value must be greater than 0.`);
  }

  return Math.trunc(parsed);
}

export function parseNonNegativeInteger(value: string | undefined, optionName: string, fallback: number): number {
  if (value === undefined) return fallback;

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid --${optionName} value "${value}". Value must be 0 or greater.`);
  }

  return Math.trunc(parsed);
}

export function parseBoolean(value: string, optionName: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  throw new Error(`Invalid --${optionName} value "${value}". Value must be true or false.`);
}
