export const VERIFIED_TOKEN_PROJECT_SLUGS = new Set([
  "centrifuge",
  "houdini-swap",
  "gensyn",
  "billions-network",
  "ility",
  "ouinex",
]);

function hasScalarValue(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value) && value !== 0;
  if (typeof value === "boolean") return value;
  return true;
}

function hasNestedValue(...values: unknown[]): boolean {
  return values.some((value) => hasScalarValue(value));
}

function normalizeSlug(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function hasProviderTokenId(project: any): boolean {
  const rawIcoData = project?.rawIcoData || {};
  const tokenMetrics = project?.tokenMetrics || {};

  return (
    hasNestedValue(project?.coingeckoId, rawIcoData?.coingeckoId, tokenMetrics?.coingeckoId) ||
    hasNestedValue(
      project?.coinmarketcapId,
      project?.coinMarketCapId,
      rawIcoData?.coinmarketcapId,
      rawIcoData?.coinMarketCapId,
      tokenMetrics?.coinmarketcapId,
      tokenMetrics?.coinMarketCapId,
    )
  );
}

function hasVerifiedTokenMapping(project: any, round: any): boolean {
  return [
    project?.slug,
    project?.rawIcoData?.slug,
    round?.coinSlug,
  ].some((slug) => VERIFIED_TOKEN_PROJECT_SLUGS.has(normalizeSlug(slug)));
}

export function hasFundingRoundToken(project: any, round: any = {}): boolean {
  return hasProviderTokenId(project) || hasVerifiedTokenMapping(project, round);
}
