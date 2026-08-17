import { Types } from "mongoose";

export function normalizeProjectDomain(value: any): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeProjectSourceType(value: any): string {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return PROJECT_SOURCE_TYPE_ALIASES[normalized] || normalized;
}

/**
 * Normalized historical spellings that may already be persisted. Writers use
 * this only to locate and rewrite legacy aliases to the canonical value.
 */
export function projectSourceTypeStorageAliases(value: any): string[] {
  const canonical = normalizeProjectSourceType(value);
  if (!canonical) return [];
  const aliases = Object.entries(PROJECT_SOURCE_TYPE_ALIASES)
    .filter(([, target]) => target === canonical)
    .map(([alias]) => alias);
  return Array.from(new Set([canonical, ...aliases]));
}

/** Case/separator tolerant Mongo matcher for transitional legacy rows. */
export function projectSourceTypeMongoPattern(value: any): RegExp {
  const aliases = projectSourceTypeStorageAliases(value);
  const alternatives = aliases.map((alias) =>
    alias
      .split("_")
      .map(escapeRegExp)
      .join("[-_\\s]*")
  );
  return new RegExp(`^(?:${alternatives.join("|") || "(?!)"})$`, "i");
}

/** Canonical identities shared by import runtime and domain source locks. */
const PROJECT_SOURCE_TYPE_ALIASES: Record<string, string> = {
  ico_drops: "icodrops",
  icodrop: "icodrops",
  drop_stab: "dropstab",
  coin_gecko: "coingecko",
  crypto_rank: "cryptorank",
  coin_market_cap: "coinmarketcap",
  intel_fund_raising: "intel_fundraising",
  crypto_activities_parser: "parser",
  crypto_activity_parser: "parser",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function toProjectDomainSourceObjectId(
  value: any
): Types.ObjectId | undefined {
  if (!value) return undefined;
  if (value instanceof Types.ObjectId) return value;
  const text = String(value).trim();
  return text && Types.ObjectId.isValid(text)
    ? new Types.ObjectId(text)
    : undefined;
}

export function cleanProjectDomainSourceObject<T extends Record<string, any>>(
  input: T
): T {
  const output: Record<string, any> = {};
  for (const [key, value] of Object.entries(input || {})) {
    if (value === undefined) continue;
    output[key] = value;
  }
  return output as T;
}
