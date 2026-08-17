import { ProjectSourceMatchMethod } from "./models/project-source-map.model";

export interface ProjectIdentity {
  slug?: string;
  name?: string;
  symbol?: string;
  website?: string | string[];
  links?: any;
  contracts?: any[];
}

export interface ProjectIdentityMatchResult {
  matchMethod: ProjectSourceMatchMethod;
  confidence: number;
  reasons: string[];
}

export function normalizeProjectIdentity(value: ProjectIdentity): ProjectIdentity {
  return {
    ...value,
    slug: normalizeSlug(value.slug || value.name || ""),
    name: normalizeName(value.name),
    symbol: normalizeSymbol(value.symbol),
    website: normalizeUrl(firstUrl(value.website)),
  };
}

export function normalizeSlug(value?: any): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/[^/]+\/?/i, "")
    .replace(/\/vesting\/?$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeSymbol(value?: any): string {
  return String(value || "")
    .trim()
    .replace(/^\$/, "")
    .toUpperCase();
}

export function normalizeName(value?: any): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeUrl(value?: any): string {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";

  return raw
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
}

export function compareProjectIdentity(
  sourceProject: ProjectIdentity,
  existingProject: ProjectIdentity,
): ProjectIdentityMatchResult {
  const source = normalizeProjectIdentity(sourceProject);
  const existing = normalizeProjectIdentity(existingProject);
  const sourceWebsites = collectNormalizedUrls(sourceProject.website, sourceProject.links);
  const existingWebsites = collectNormalizedUrls(existingProject.website, existingProject.links);
  const sourceContracts = collectContracts(sourceProject.contracts);
  const existingContracts = collectContracts(existingProject.contracts);

  if (sourceContracts.some((contract) => existingContracts.includes(contract))) {
    return { matchMethod: "contract", confidence: 95, reasons: ["same contract"] };
  }

  if (sourceWebsites.some((url) => existingWebsites.includes(url))) {
    return { matchMethod: "website", confidence: 95, reasons: ["same website"] };
  }

  if (sourceProject.slug && existingProject.slug && String(sourceProject.slug).toLowerCase() === String(existingProject.slug).toLowerCase()) {
    return { matchMethod: "exact_slug", confidence: 90, reasons: ["exact slug"] };
  }

  if (source.slug && existing.slug && source.slug === existing.slug) {
    return { matchMethod: "normalized_slug", confidence: 80, reasons: ["normalized slug"] };
  }

  if (source.name && existing.name && source.symbol && existing.symbol && source.name === existing.name && source.symbol === existing.symbol) {
    return { matchMethod: "name_symbol", confidence: 75, reasons: ["same name and symbol"] };
  }

  if (source.symbol && existing.symbol && source.symbol === existing.symbol) {
    return { matchMethod: "name_symbol", confidence: 40, reasons: ["same symbol only"] };
  }

  if (source.name && existing.name && source.name === existing.name) {
    return { matchMethod: "name_symbol", confidence: 40, reasons: ["same name only"] };
  }

  return { matchMethod: "normalized_slug", confidence: 0, reasons: ["no reliable identity match"] };
}

export function firstUrl(value?: any): string {
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

export function collectNormalizedUrls(...values: any[]): string[] {
  const urls: string[] = [];

  for (const value of values) {
    if (!value) continue;

    if (typeof value === "string") {
      const normalized = normalizeUrl(value);
      if (normalized) urls.push(normalized);
      continue;
    }

    if (Array.isArray(value)) {
      urls.push(...collectNormalizedUrls(...value));
      continue;
    }

    if (typeof value === "object") {
      for (const item of Object.values(value)) {
        urls.push(...collectNormalizedUrls(item));
      }
    }
  }

  return Array.from(new Set(urls));
}

function collectContracts(value?: any): string[] {
  const list = Array.isArray(value) ? value : value ? [value] : [];
  return list
    .map((item) => {
      if (typeof item === "string") return item;
      return item?.address || item?.contractAddress || item?.tokenAddress || "";
    })
    .map((item) => String(item || "").trim().toLowerCase())
    .filter(Boolean);
}
