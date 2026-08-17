export const FOMO_V2_SOURCES = [
  "coingecko",
  "coinmarketcap",
  "dropstab",
  "cryptorank",
  "icodrops",
  "legacy",
  "manual",
] as const;

export type FomoV2Source = (typeof FOMO_V2_SOURCES)[number] | string;
export type V2Source = FomoV2Source;

export const FOMO_V2_SOURCE_ENTITY_TYPES = [
  "asset",
  "activity",
  "project",
  "project_enrichment",
  "relationship",
  "raw",
] as const;

export type FomoV2SourceEntityType = (typeof FOMO_V2_SOURCE_ENTITY_TYPES)[number];
export type V2SourceEntityType = FomoV2SourceEntityType;

export const FOMO_V2_RESOLUTION_STATUSES = [
  "unresolved",
  "matched",
  "created",
  "proposed",
  "conflict",
  "ignored",
] as const;

export type FomoV2ResolutionStatus = (typeof FOMO_V2_RESOLUTION_STATUSES)[number];

export const FOMO_V2_CONFIDENCE_LEVELS = ["exact", "high", "medium", "low", "none"] as const;

export type FomoV2Confidence = (typeof FOMO_V2_CONFIDENCE_LEVELS)[number];

export const FOMO_V2_CANONICAL_PROJECT_STATUSES = [
  "active",
  "proposed",
  "merged",
  "deprecated",
] as const;

export type FomoV2CanonicalProjectStatus = (typeof FOMO_V2_CANONICAL_PROJECT_STATUSES)[number];

export const FOMO_V2_ALIAS_TYPES = [
  "name",
  "slug",
  "symbol",
  "domain",
  "contract",
  "providerId",
] as const;

export type FomoV2AliasType = (typeof FOMO_V2_ALIAS_TYPES)[number];

export const FOMO_V2_MARKET_ASSET_TYPES = ["coin", "token", "nft", "index", "derivative", "unknown"] as const;

export type FomoV2MarketAssetType = (typeof FOMO_V2_MARKET_ASSET_TYPES)[number];

export const FOMO_V2_ASSET_LINK_RELATION_TYPES = [
  "primary_token",
  "governance_token",
  "utility_token",
  "wrapped_token",
  "legacy_token",
  "ecosystem_asset",
  "unknown",
] as const;

export type FomoV2AssetLinkRelationType = (typeof FOMO_V2_ASSET_LINK_RELATION_TYPES)[number];

export const FOMO_V2_LINK_STATUSES = ["active", "proposed", "conflict", "deprecated"] as const;

export type FomoV2LinkStatus = (typeof FOMO_V2_LINK_STATUSES)[number];

export const FOMO_V2_MIGRATION_RUN_STATUSES = [
  "pending",
  "running",
  "completed",
  "failed",
  "rolled_back",
] as const;

export type FomoV2MigrationRunStatus = (typeof FOMO_V2_MIGRATION_RUN_STATUSES)[number];

export const FOMO_V2_MIGRATION_RUN_TYPES = [
  "schema_indexes",
  "coingecko_market_universe",
  "read_model_build",
  "validation",
  "manual",
] as const;

export type FomoV2MigrationRunType = (typeof FOMO_V2_MIGRATION_RUN_TYPES)[number];

export interface FomoV2ProviderIds {
  coingeckoId?: string;
  coinMarketCapId?: string;
  dropstabId?: string;
  cryptorankId?: string;
  icodropsId?: string;
}

export interface FomoV2Alias {
  type: FomoV2AliasType;
  value: string;
  normalizedValue: string;
  source?: string;
  confidence?: FomoV2Confidence;
}

export interface FomoV2ContractIdentity {
  chainId?: string;
  chainSlug?: string;
  chainKey: string;
  address: string;
  normalizedAddress: string;
  source?: string;
  verified?: boolean;
}
