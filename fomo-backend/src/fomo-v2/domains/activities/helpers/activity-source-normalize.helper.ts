import { Types } from "mongoose";
import {
  normalizeActivitySlug,
  sanitizeActivityContent,
} from "./activity-content.helper";
import {
  FomoV2ActivityAccessTier,
  FomoV2ActivityContent,
  FomoV2ActivityIngestInput,
  FomoV2ActivityLifecycleStatus,
} from "../types/activity.types";

export type FomoV2ActivitySourceOrigin = "legacy" | "parser";

export interface FomoV2NormalizedActivitySourceDocument {
  ingestInput: FomoV2ActivityIngestInput;
  resolverIdentity: {
    source: string;
    sourceId?: string;
    sourceSlug?: string;
    sourceUrl?: string;
    name?: string;
    symbol?: string;
    websiteDomain?: string;
    providerIds?: Record<string, string>;
    contracts?: Array<{
      chainId?: string;
      chainSlug?: string;
      address: string;
    }>;
  };
}

/**
 * Stable source meaning used for snapshot/idempotency checks. Provider capture
 * timestamps and other raw parser bookkeeping intentionally stay out of this
 * shape, while every field that can change the staged aggregate remains in it.
 */
export function activitySemanticPayload(
  input: FomoV2ActivityIngestInput
): Record<string, any> {
  return {
    source: input.source,
    sourceId: input.sourceId,
    sourceSlug: input.sourceSlug,
    sourceUrl: input.sourceUrl,
    slug: input.slug,
    normalizedDraft: input.normalizedDraft,
    lifecycleStatus: input.lifecycleStatus,
    accessTier: input.accessTier,
  };
}

/**
 * Converts both the main-backend legacy CryptoActivity shape and the parser's
 * permissive crypto_activities shape into the strict FOMO v2 staging contract.
 * The function is deliberately pure so parser data remains read-only.
 */
export function normalizeActivitySourceDocument(
  value: Record<string, any>,
  origin: FomoV2ActivitySourceOrigin,
  now = new Date()
): FomoV2NormalizedActivitySourceDocument | null {
  const raw = toPlainRecord(value);
  if (!raw) return null;

  const source =
    cleanString(raw.primarySource || raw.source)?.toLowerCase() ||
    (origin === "parser" ? "crypto-activities-parser" : "legacy");
  const legacyActivityId =
    origin === "legacy" && isObjectIdLike(raw._id)
      ? String(raw._id)
      : undefined;
  const sourceId = firstString(
    raw.parserActivityId,
    raw.externalId,
    firstSourceExternalId(raw.sources),
    origin === "parser" ? raw._id : undefined,
    raw.id,
    legacyActivityId
  );
  const parserActivityId = firstString(
    raw.parserActivityId,
    origin === "parser" ? raw._id : undefined
  );
  const projectName = firstString(
    raw.projectName,
    raw.name,
    raw.coinName,
    raw.title
  );
  if (!projectName) return null;

  const activityType = normalizeActivityType(raw.activityType || raw.type);
  const slug = normalizeActivitySlug(
    firstString(raw.externalSlug, raw.slug) ||
      [projectName, activityType, sourceId].filter(Boolean).join("-")
  );
  if (!slug) return null;

  const sourceUrl = firstString(
    raw.sourceUrl,
    raw.originalUrl,
    raw.canonicalUrl,
    firstSourceUrl(raw.sources),
    raw.joinLink
  );
  const normalizedDraft = sanitizeActivityContent(
    buildActivityContent(raw, projectName, activityType)
  );
  const website = firstString(
    normalizedDraft.socialLinks?.website,
    raw.website,
    raw.websiteUrl
  );

  const legacyNumericId =
    origin === "legacy" ? finiteNumber(raw.id) : undefined;
  const accessTier = normalizeAccessTier(raw);
  const ingestInput: FomoV2ActivityIngestInput = {
    source,
    sourceId,
    sourceSlug: slug,
    sourceUrl,
    rawPayload: raw,
    normalizedDraft,
    slug,
    legacyActivityId,
    legacyNumericId,
    parserActivityId,
    lifecycleStatus: normalizeLifecycleStatus(raw, now),
    accessTier,
    parserVersion: firstString(
      raw.parserVersion,
      raw.parserMeta?.version,
      raw.parserMeta?.parserVersion
    ),
    providerUpdatedAt: validDate(
      raw.syncMeta?.parserUpdatedAt || raw.updatedAt || raw.lastSyncedAt
    ),
  };

  return {
    ingestInput,
    resolverIdentity: {
      source,
      sourceId,
      sourceSlug: slug,
      sourceUrl,
      name: projectName,
      symbol: firstString(raw.symbol, raw.coinSymbol),
      websiteDomain: websiteDomain(website),
      providerIds: normalizeProviderIds(raw),
      contracts: normalizeContracts(raw.contracts || raw.contractAddresses),
    },
  };
}

function buildActivityContent(
  raw: Record<string, any>,
  projectName: string,
  activityType?: string
): FomoV2ActivityContent {
  const description = normalizeDescription(raw.description, raw);
  const review = normalizeReview(raw.review || raw.fomoReview);
  const taskGuide = normalizeTaskGuide(
    raw.taskGuide,
    raw.steps,
    hasOwn(raw, "steps")
  );

  return compactObject({
    name: firstString(raw.name, raw.projectName, raw.coinName, raw.title),
    projectName,
    symbol: firstString(raw.symbol, raw.coinSymbol),
    logo: firstString(raw.logo, raw.projectLogo),
    projectLogo: firstString(raw.projectLogo, raw.logo),
    score: cleanString(raw.score),
    activityType,
    category: firstString(
      raw.category,
      firstArrayString(raw.ecosystem),
      firstArrayString(raw.platform)
    ),
    difficulty: normalizeDifficulty(raw.difficulty),
    cost: cleanString(raw.cost),
    timeEstimate: cleanString(raw.timeEstimate),
    taskFrequency: normalizeTaskFrequency(raw.taskFrequency),
    isHot: hasOwn(raw, "isHot") ? Boolean(raw.isHot) : undefined,
    rewardLabel: cleanString(raw.rewardLabel),
    ecosystem: hasOwn(raw, "ecosystem")
      ? stringArray(raw.ecosystem)
      : undefined,
    platform: hasOwn(raw, "platform") ? stringArray(raw.platform) : undefined,
    tags: hasOwn(raw, "tags") ? stringArray(raw.tags) : undefined,
    requirements: hasOwn(raw, "requirements")
      ? stringArray(raw.requirements)
      : undefined,
    startDate: validDate(raw.startDate),
    endDate: validDate(raw.endDate),
    approxStartDate: approximateDate(raw.approxStartDate),
    approxEndDate: approximateDate(raw.approxEndDate),
    timezone: cleanString(raw.timezone),
    description,
    rewardSupply: finiteNumber(raw.rewardSupply),
    rewards: hasOwn(raw, "rewards") ? normalizeRewards(raw.rewards) : undefined,
    rewardAmount: finiteNumber(raw.rewardAmount),
    rewardDistribution: cleanString(raw.rewardDistribution),
    rewardDistributionApprox: cleanString(raw.rewardDistributionApprox),
    participants: nonNegativeNumber(raw.participants),
    fundsRaised: nonNegativeNumber(raw.fundsRaised),
    joinLink: cleanString(raw.joinLink),
    links: hasOwn(raw, "links") ? normalizeLinks(raw.links) : undefined,
    videoGuides: hasOwn(raw, "videoGuides")
      ? stringArray(raw.videoGuides)
      : undefined,
    relatedAssets: hasOwn(raw, "relatedAssets")
      ? normalizeRelatedAssets(raw.relatedAssets)
      : undefined,
    investors: hasOwn(raw, "investors")
      ? normalizeInvestors(raw.investors)
      : undefined,
    socialLinks: normalizeSocialLinks(raw.socialLinks, raw.links),
    review,
    metrics: normalizeMetrics(raw.metrics),
    timeline: hasOwn(raw, "timeline")
      ? normalizeTimeline(raw.timeline)
      : undefined,
    flags: normalizeFlags(raw.flags),
    taskGuide,
  }) as FomoV2ActivityContent;
}

function normalizeDescription(value: any, raw: Record<string, any>) {
  if (typeof value === "string") {
    return compactObject({ about: cleanString(value) });
  }
  const source = isPlainObject(value) ? value : {};
  return compactObject({
    about: firstString(source.about, raw.about),
    aboutHtml: firstString(source.aboutHtml, raw.aboutHtml),
    howToParticipate: firstString(
      source.howToParticipate,
      raw.howToParticipate
    ),
    howToParticipateHtml: firstString(
      source.howToParticipateHtml,
      raw.howToParticipateHtml
    ),
  });
}

function normalizeReview(value: any) {
  if (typeof value === "string") return { text: cleanString(value) };
  if (!isPlainObject(value)) return undefined;
  const scores = hasOwn(value, "scores")
    ? (Array.isArray(value.scores) ? value.scores : [])
        .map((score) => ({
          label: cleanString(score?.label),
          value: clampNumber(score?.value, 0, 100),
        }))
        .filter((score) => score.label && score.value !== undefined)
    : undefined;
  return compactObject({
    text: firstString(value.text, value.content),
    textHtml: firstString(value.textHtml, value.html),
    scores,
    isLocked:
      value.isLocked === undefined ? undefined : Boolean(value.isLocked),
  });
}

function normalizeTaskGuide(value: any, rootSteps: any, hasRootSteps: boolean) {
  const source = isPlainObject(value) ? value : {};
  const hasSteps = hasOwn(source, "steps") || hasRootSteps;
  const rawSteps = Array.isArray(source.steps)
    ? source.steps
    : Array.isArray(rootSteps)
    ? rootSteps
    : [];
  const steps = rawSteps
    .map((step, index) =>
      compactObject({
        id: firstString(step?.id, String(index + 1)),
        title: firstString(step?.title, step?.name),
        description: cleanString(step?.description),
        descriptionHtml: firstString(step?.descriptionHtml, step?.html),
        timeEstimate: cleanString(step?.timeEstimate),
        ctaLabel: cleanString(step?.ctaLabel),
        ctaUrl: cleanString(step?.ctaUrl),
        image: cleanString(step?.image),
        video: cleanString(step?.video),
      })
    )
    .filter((step) => step.title);
  if (!Object.keys(source).length && !hasSteps) return undefined;
  return compactObject({
    title: cleanString(source.title),
    description: cleanString(source.description),
    descriptionHtml: cleanString(source.descriptionHtml),
    ctaLabel: cleanString(source.ctaLabel),
    ctaUrl: cleanString(source.ctaUrl),
    successMessage: cleanString(source.successMessage),
    isLocked:
      source.isLocked === undefined ? undefined : Boolean(source.isLocked),
    steps: hasSteps ? steps : undefined,
  });
}

function normalizeRewards(value: any): any[] {
  return (Array.isArray(value) ? value : [])
    .map((reward) =>
      compactObject({
        label: firstString(reward?.label, reward?.name),
        amount: finiteNumber(reward?.amount),
        currency: cleanString(reward?.currency),
        token: firstString(reward?.token, reward?.symbol),
        description: cleanString(reward?.description),
      })
    )
    .filter((reward) => Object.keys(reward).length);
}

function normalizeRelatedAssets(value: any): any[] {
  return (Array.isArray(value) ? value : [])
    .map((asset) =>
      compactObject({
        name: firstString(asset?.name, asset?.projectName),
        symbol: cleanString(asset?.symbol),
        image: firstString(asset?.image, asset?.logo),
        slug: cleanString(asset?.slug),
      })
    )
    .filter((asset) => asset.name);
}

function normalizeInvestors(value: any): any[] {
  return (Array.isArray(value) ? value : [])
    .slice(0, 100)
    .map((investor) => {
      if (typeof investor === "string") return { name: cleanString(investor) };
      return compactObject({
        id: firstString(investor?.id, investor?._id, investor?.investorId),
        name: firstString(
          investor?.name,
          investor?.title,
          investor?.investorName
        ),
        slug: cleanString(investor?.slug),
        symbol: cleanString(investor?.symbol),
        logo: firstString(investor?.logo, investor?.image),
        website: firstString(investor?.website, investor?.url),
        source: cleanString(investor?.source),
      });
    })
    .filter((investor) => investor.name);
}

function normalizeLinks(value: any): Array<{ label: string; url: string }> {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((link) => {
        if (typeof link === "string") return { label: "Link", url: link };
        return {
          label: firstString(link?.label, link?.name, "Link") || "Link",
          url: firstString(link?.url, link?.href) || "",
        };
      })
      .filter((link) => link.url);
  }
  if (!isPlainObject(value)) return [];
  return Object.entries(value)
    .filter(([, url]) => typeof url === "string")
    .map(([label, url]) => ({ label, url: String(url) }));
}

function normalizeSocialLinks(social: any, links: any) {
  const source = isPlainObject(social) ? social : {};
  const linkRecord = isPlainObject(links) ? links : {};
  const custom = hasOwn(source, "custom")
    ? normalizeLinks(source.custom)
    : undefined;
  const result = compactObject({
    website: firstString(source.website, linkRecord.website),
    twitter: firstString(
      source.twitter,
      source.x,
      linkRecord.twitter,
      linkRecord.x
    ),
    telegram: firstString(source.telegram, linkRecord.telegram),
    discord: firstString(source.discord, linkRecord.discord),
    docs: firstString(source.docs, source.documentation, linkRecord.docs),
    custom,
  });
  return Object.keys(result).length ? result : undefined;
}

function normalizeMetrics(value: any) {
  if (!isPlainObject(value)) return undefined;
  return compactObject({
    riskLevel: cleanString(value.riskLevel),
    complexity: cleanString(value.complexity),
    timeRequired: cleanString(value.timeRequired),
    potentialReward: cleanString(value.potentialReward),
  });
}

function normalizeTimeline(value: any): any[] {
  return (Array.isArray(value) ? value : [])
    .map((item) =>
      compactObject({
        title: cleanString(item?.title),
        date: validDate(item?.date),
        description: cleanString(item?.description),
      })
    )
    .filter((item) => item.title);
}

function normalizeFlags(value: any) {
  if (!isPlainObject(value)) return undefined;
  return compactObject({
    green: hasOwn(value, "green") ? stringArray(value.green) : undefined,
    yellow: hasOwn(value, "yellow") ? stringArray(value.yellow) : undefined,
    red: hasOwn(value, "red") ? stringArray(value.red) : undefined,
  });
}

function normalizeLifecycleStatus(
  raw: Record<string, any>,
  now: Date
): FomoV2ActivityLifecycleStatus {
  const status = String(raw.lifecycleStatus || raw.status || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "");
  if (["cancelled", "canceled"].includes(status)) return "cancelled";
  if (["ended", "complete", "completed", "closed"].includes(status)) {
    return "ended";
  }
  if (["active", "live", "ongoing", "open"].includes(status)) return "active";
  if (["upcoming", "planned", "announced"].includes(status)) return "upcoming";

  const start = validDate(raw.startDate)?.getTime();
  const end = validDate(raw.endDate)?.getTime();
  const timestamp = now.getTime();
  if (end !== undefined && end < timestamp) return "ended";
  if (start !== undefined && start > timestamp) return "upcoming";
  if (start !== undefined && start <= timestamp) return "active";
  return "upcoming";
}

function normalizeAccessTier(
  raw: Record<string, any>
): FomoV2ActivityAccessTier {
  const explicit = String(raw.accessTier || "")
    .trim()
    .toLowerCase();
  if (explicit === "prime" || explicit === "public") return explicit;
  return raw.nftRequired || raw.isLocked ? "prime" : "public";
}

function normalizeActivityType(value: any): string | undefined {
  const text = cleanString(value);
  if (!text) return undefined;
  const key = text.toLowerCase().replace(/[\s_-]+/g, "");
  const aliases: Record<string, string> = {
    airdrop: "Airdrop",
    testnet: "Testnet",
    quest: "Quest",
    whitelist: "Whitelist",
    waitlist: "Whitelist",
    farming: "Farming",
    node: "Node",
    other: "Other",
  };
  return aliases[key] || text;
}

function normalizeDifficulty(
  value: any
): "easy" | "medium" | "hard" | undefined {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  return ["easy", "medium", "hard"].includes(text) ? (text as any) : undefined;
}

function normalizeTaskFrequency(
  value: any
): "daily" | "weekly" | "monthly" | "ongoing" | undefined {
  const text = String(value || "")
    .trim()
    .toLowerCase();
  return ["daily", "weekly", "monthly", "ongoing"].includes(text)
    ? (text as any)
    : undefined;
}

function normalizeProviderIds(
  raw: Record<string, any>
): Record<string, string> | undefined {
  const values = {
    coingeckoId: firstString(raw.providerIds?.coingeckoId, raw.coingeckoId),
    coinMarketCapId: firstString(
      raw.providerIds?.coinMarketCapId,
      raw.coinMarketCapId,
      raw.cmcId
    ),
    dropstabId: firstString(raw.providerIds?.dropstabId, raw.dropstabId),
    cryptorankId: firstString(raw.providerIds?.cryptorankId, raw.cryptorankId),
    icodropsId: firstString(raw.providerIds?.icodropsId, raw.icodropsId),
  };
  const compact = compactObject(values);
  return Object.keys(compact).length ? compact : undefined;
}

function normalizeContracts(value: any): Array<{
  chainId?: string;
  chainSlug?: string;
  address: string;
}> {
  return (Array.isArray(value) ? value : [])
    .map((contract) => {
      if (typeof contract === "string") return { address: contract };
      return compactObject({
        chainId: firstString(contract?.chainId, contract?.chain?.id),
        chainSlug: firstString(
          contract?.chainSlug,
          contract?.chain,
          contract?.network
        ),
        address: firstString(contract?.address, contract?.contractAddress),
      }) as any;
    })
    .filter((contract) => contract.address);
}

function websiteDomain(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    return (
      new URL(value).hostname.toLowerCase().replace(/^www\./, "") || undefined
    );
  } catch (_error) {
    return undefined;
  }
}

function firstSourceExternalId(value: any): string | undefined {
  return (Array.isArray(value) ? value : [])
    .map((item) => cleanString(item?.externalId || item?.sourceId))
    .find(Boolean);
}

function firstSourceUrl(value: any): string | undefined {
  return (Array.isArray(value) ? value : [])
    .map((item) => cleanString(item?.url || item?.sourceUrl))
    .find(Boolean);
}

function approximateDate(value: any): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (value instanceof Date && Number.isFinite(value.getTime()))
    return value.toISOString();
  return cleanString(value);
}

function validDate(value: any): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function finiteNumber(value: any): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function nonNegativeNumber(value: any): number | undefined {
  const number = finiteNumber(value);
  return number === undefined ? undefined : Math.max(0, number);
}

function clampNumber(
  value: any,
  minimum: number,
  maximum: number
): number | undefined {
  const number = finiteNumber(value);
  return number === undefined
    ? undefined
    : Math.min(maximum, Math.max(minimum, number));
}

function stringArray(value: any): string[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
    ? value.split(",")
    : [];
  const seen = new Set<string>();
  return values.reduce((result, item) => {
    const text = cleanString(item);
    const key = text?.toLowerCase();
    if (text && key && !seen.has(key)) {
      seen.add(key);
      result.push(text);
    }
    return result;
  }, [] as string[]);
}

function firstArrayString(value: any): string | undefined {
  return stringArray(value)[0];
}

function firstString(...values: any[]): string | undefined {
  return values.map(cleanString).find(Boolean);
}

function cleanString(value: any): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "object") return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function compactObject<T extends Record<string, any>>(value: T): T {
  return Object.entries(value || {}).reduce((result, [key, child]) => {
    if (child !== undefined && child !== null) result[key] = child;
    return result;
  }, {} as Record<string, any>) as T;
}

function isObjectIdLike(value: any): boolean {
  return (
    value instanceof Types.ObjectId ||
    Types.ObjectId.isValid(String(value || ""))
  );
}

function isPlainObject(value: any): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function toPlainRecord(value: any): Record<string, any> | null {
  if (!value || typeof value !== "object") return null;
  const plain =
    typeof value.toObject === "function"
      ? value.toObject({ depopulate: true, flattenObjectIds: true })
      : value;
  return JSON.parse(
    JSON.stringify(plain, (_key, child) => {
      if (child instanceof Types.ObjectId) return child.toHexString();
      if (child instanceof Date) return child.toISOString();
      return child;
    })
  );
}
