export function normalizeProjectIdentityValue(value: any): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "");
}

export function normalizeProjectNameForQuery(value: any): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeProjectSymbolForQuery(value: any): string {
  return String(value || "")
    .trim()
    .replace(/^\$/, "")
    .toUpperCase();
}

export function normalizeProjectSlugForQuery(value: any): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/[^/]+\/?/i, "")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function cleanProjectProfileString(value: any): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

export function uniqueProjectProfileStrings(values: any[]): string[] {
  return Array.from(
    new Set(values.map(cleanProjectProfileString).filter(Boolean) as string[]),
  );
}
