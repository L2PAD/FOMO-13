export interface ImageInventorySource {
  database?: string;
  collection: string;
  fieldPath: string;
}

export const IMAGE_MIRROR_ALLOWLIST: ImageInventorySource[] = [
  { collection: "activities", fieldPath: "currentDraft.logo" },
  { collection: "activities", fieldPath: "currentDraft.projectLogo" },
  { collection: "activities", fieldPath: "currentDraft.relatedAssets[].image" },
  { collection: "activities", fieldPath: "currentDraft.investors[].logo" },
  { collection: "activities", fieldPath: "currentDraft.taskGuide.steps[].image" },
  { collection: "activities", fieldPath: "publishedSnapshot.logo" },
  { collection: "activities", fieldPath: "publishedSnapshot.projectLogo" },
  { collection: "activities", fieldPath: "publishedSnapshot.relatedAssets[].image" },
  { collection: "activities", fieldPath: "publishedSnapshot.investors[].logo" },
  { collection: "activities", fieldPath: "publishedSnapshot.taskGuide.steps[].image" },
  { collection: "market_project_read_models", fieldPath: "logo" },
  { collection: "ico_project_read_models", fieldPath: "logoUrl" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.logo" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.logoUrl" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.investors[].logo" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.investors[].avatar" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.investors[].image" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.investors[].logoUrl" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.investors[].avatarUrl" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.investors[].details.logo" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.investors[].details.logoUrl" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.fundraising.investors[].logo" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.fundraising.investors[].avatar" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.fundraising.investors[].image" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.fundraising.investors[].logoUrl" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.fundraising.investors[].avatarUrl" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.fundraising.investors[].details.logo" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.fundraising.investors[].details.logoUrl" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.fundraising.rounds[].investors[].logo" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.fundraising.rounds[].investors[].avatar" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.fundraising.rounds[].investors[].image" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.fundraising.rounds[].investors[].logoUrl" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.fundraising.rounds[].investors[].avatarUrl" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.fundraising.rounds[].investors[].details.logo" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.fundraising.rounds[].investors[].details.logoUrl" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.saleRounds[].investors[].logo" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.saleRounds[].investors[].avatar" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.saleRounds[].investors[].image" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.saleRounds[].investors[].logoUrl" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.saleRounds[].investors[].avatarUrl" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.saleRounds[].investors[].details.logo" },
  { collection: "ico_project_read_models", fieldPath: "metadata.icodropsProfileOnly.saleRounds[].investors[].details.logoUrl" },
  { collection: "backer_portfolio_holdings", fieldPath: "projectLogoUrl" },
  { collection: "backer_list_read_models", fieldPath: "supportedProjectsPreview[].logo" },
  { collection: "backer_list_read_models", fieldPath: "logo" },
  { collection: "backer_list_read_models", fieldPath: "avatar" },
  { collection: "backer_read_models", fieldPath: "logoUrl" },
  { collection: "backer_read_models", fieldPath: "avatarUrl" },
  { collection: "funding_feed_round_read_models", fieldPath: "projectLogo" },
  { collection: "funding_feed_round_read_models", fieldPath: "investors[].logo" },
];

export const DISABLED_IMAGE_MIRROR_SOURCES: ImageInventorySource[] = [
  { database: "parser_new", collection: "ico_projects", fieldPath: "logo" },
  { database: "parser_new", collection: "dropstab_coin_catalog", fieldPath: "logo" },
  { database: "parser_new", collection: "dropstab_coin_catalog", fieldPath: "image" },
  { database: "parser_new", collection: "dropstab_coin_detail_data", fieldPath: "logo" },
  { database: "parser_new", collection: "dropstab_coin_detail_data", fieldPath: "image" },
  { database: "parser_new", collection: "intel_investors", fieldPath: "raw.logo" },
  { database: "parser_new", collection: "intel_investors", fieldPath: "raw.image" },
];

export const IMAGE_INVENTORY_ALLOWLIST: ImageInventorySource[] = [
  ...IMAGE_MIRROR_ALLOWLIST,
  { collection: "projects", fieldPath: "logo" },
  { collection: "projects", fieldPath: "descriptionImage" },
  { collection: "projects", fieldPath: "descriptionImages[]" },
  { collection: "assets", fieldPath: "logo" },
  { collection: "funds", fieldPath: "logo" },
  { collection: "persons", fieldPath: "logo" },
  { collection: "news", fieldPath: "image" },
  { collection: "news_articles", fieldPath: "image" },
  { collection: "news_articles", fieldPath: "image_url" },
  { collection: "news_articles", fieldPath: "thumbnail" },
  { collection: "crypto_activities", fieldPath: "logo" },
  { collection: "crypto_activities", fieldPath: "projectLogo" },
  { collection: "crypto_activities", fieldPath: "steps[].image" },
  { collection: "funding_rounds", fieldPath: "image" },
  { collection: "backers", fieldPath: "logo" },
  { collection: "backers", fieldPath: "avatar" },
  { collection: "backer_sources", fieldPath: "logo" },
  { collection: "backer_sources", fieldPath: "avatar" },
  { collection: "backer_portfolio_holdings", fieldPath: "logo" },
  ...DISABLED_IMAGE_MIRROR_SOURCES,
];

export const IMAGE_INVENTORY_EXCLUDED_SOURCES = [
  "messages.attachments",
  "support.file",
  "private/user-sensitive files",
];

export const MARKET_PROJECT_LOGO_SOURCE = "market_project_read_models.logo";

export function sourceKey(source: ImageInventorySource): string {
  return [source.database, source.collection, source.fieldPath].filter(Boolean).join(".");
}

export function findAllowlistedSource(value: string): ImageInventorySource | undefined {
  const normalized = String(value || "").trim();

  return IMAGE_INVENTORY_ALLOWLIST.find((source) => sourceKey(source) === normalized);
}

export function findMirrorSource(value: string): ImageInventorySource | undefined {
  const normalized = String(value || "").trim();

  return IMAGE_MIRROR_ALLOWLIST.find((source) => sourceKey(source) === normalized);
}

export function findDisabledMirrorSource(value: string): ImageInventorySource | undefined {
  const normalized = String(value || "").trim();

  return DISABLED_IMAGE_MIRROR_SOURCES.find((source) => sourceKey(source) === normalized);
}
