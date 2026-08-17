import { CryptoActivity, CryptoActivitySourceRef } from "../models/crypto-activity.model";
import { resolveCryptoActivityStatus } from "../utils/activity-status.util";

export interface ParserCryptoActivitySourceRef {
  source?: string;
  url?: string;
  externalId?: string;
  lastSeenAt?: string | Date;
}

export interface ParserCryptoActivity {
  _id?: string;
  id?: string | number;
  parserActivityId?: string;
  slug?: string;
  externalSlug?: string;
  source?: string;
  primarySource?: string;
  sourceUrl?: string;
  originalUrl?: string;
  canonicalUrl?: string;
  externalId?: string;
  sources?: ParserCryptoActivitySourceRef[];
  title?: string;
  projectName?: string;
  name?: string;
  coinName?: string;
  projectLogo?: string;
  logo?: string;
  coinSlug?: string;
  symbol?: string;
  coinSymbol?: string;
  status?: string;
  activityType?: string;
  type?: string;
  category?: string;
  ecosystem?: string | string[];
  platform?: string | string[];
  difficulty?: string;
  score?: string | number;
  isHot?: boolean;
  isLocked?: boolean;
  rewardLabel?: string;
  rewardAmount?: string | number;
  rewards?: any[];
  rewardSupply?: string | number;
  rewardDistribution?: string;
  rewardDistributionApprox?: string;
  participants?: string | number;
  description?: string | {
    about?: string;
    aboutHtml?: string;
    howToParticipate?: string;
    howToParticipateHtml?: string;
  };
  tags?: string[];
  requirements?: string[];
  timeEstimate?: string;
  cost?: string;
  taskFrequency?: string;
  fundsRaised?: string | number;
  startDate?: string | Date;
  endDate?: string | Date;
  approxStartDate?: string | Date;
  approxEndDate?: string | Date;
  joinLink?: string;
  links?: any;
  socialLinks?: any;
  investors?: any[];
  relatedAssets?: any[];
  videoGuides?: string[];
  taskGuide?: any;
  timeline?: any[];
  flags?: any;
  review?: any;
  metrics?: any;
  parserMeta?: any;
  sourceMeta?: any;
  rawSourceData?: any;
  raw?: any;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
  [key: string]: any;
}

export type MappedParserCryptoActivity = Partial<CryptoActivity> & {
  id: number;
  parserActivityId: string;
  externalSlug: string;
  slug: string;
  primarySource?: string;
  sourceUrl?: string;
};

export function mapParserActivityToCryptoActivity(
  parser: ParserCryptoActivity,
): MappedParserCryptoActivity | null {
  if (!parser || typeof parser !== "object") return null;

  const source = toNonEmptyString(parser.primarySource || parser.source) || "crypto-activities-parser";
  const projectName =
    toNonEmptyString(parser.projectName) ||
    toNonEmptyString(parser.name) ||
    toNonEmptyString(parser.coinName) ||
    toNonEmptyString(parser.title);
  const externalSlug =
    toNonEmptyString(parser.externalSlug || parser.slug || parser.coinSlug) ||
    slugify(projectName || "");

  const parserActivityId =
    toNonEmptyString(parser.parserActivityId) ||
    toNonEmptyString(parser._id) ||
    toNonEmptyString(parser.id) ||
    [source, externalSlug].filter(Boolean).join(":");

  if (!parserActivityId || !projectName) {
    return null;
  }

  const slug = externalSlug || slugify(`${projectName}-${source}`);
  const coinSlug = toNonEmptyString(parser.coinSlug) || slugify(projectName) || slug;
  const coinSymbol = (
    toNonEmptyString(parser.coinSymbol || parser.symbol) ||
    buildFallbackSymbol(projectName || coinSlug || slug)
  ).toUpperCase();
  const logo = toNonEmptyString(parser.projectLogo || parser.logo) || "";
  const sourceUrl =
    toNonEmptyString(parser.sourceUrl) ||
    firstSourceUrl(parser.sources) ||
    toNonEmptyString(parser.joinLink) ||
    "";
  const originalUrl =
    toNonEmptyString(parser.originalUrl || parser.canonicalUrl) ||
    sourceUrl;
  const confidence = getConfidence(parser);
  const now = Date.now();

  const links = normalizeLinksArray(parser.links || parser.socialLinks);
  const socialLinks = normalizeSocialLinks(parser.socialLinks || parser.links);
  const createdTimestamp = toTimestamp(parser.createdAt) || now;
  const updatedTimestamp = toTimestamp(parser.updatedAt) || now;
  const startDate = toDateOrNull(parser.startDate);
  const endDate = toDateOrNull(parser.endDate);
  const approxStartDate = toDateOrString(parser.approxStartDate);
  const approxEndDate = toDateOrString(parser.approxEndDate);

  return {
    id: stableNegativeId(parserActivityId),
    parserActivityId,
    externalSlug: slug,
    slug,
    primarySource: source,
    source,
    sourceUrl: sourceUrl || originalUrl,
    originalUrl,
    sources: normalizeSources(parser.sources, source, sourceUrl || originalUrl),
    projectName,
    name: projectName,
    symbol: coinSymbol,
    coinSlug,
    coinName: projectName,
    coinSymbol,
    logo,
    projectLogo: logo,
    score: normalizeScore(parser.score, confidence),
    status: resolveCryptoActivityStatus({
      startDate,
      endDate,
      approxStartDate,
      approxEndDate,
      fallbackStatus: parser.status,
    }),
    activityType: normalizeActivityType(parser.activityType || parser.type),
    category:
      toNonEmptyString(parser.category) ||
      firstString(parser.ecosystem) ||
      firstString(parser.platform) ||
      normalizeActivityType(parser.activityType || parser.type),
    difficulty: normalizeDifficulty(parser.difficulty),
    cost: toNonEmptyString(parser.cost),
    timeEstimate: toNonEmptyString(parser.timeEstimate),
    taskFrequency: normalizeTaskFrequency(parser.taskFrequency),
    isHot: Boolean(parser.isHot) || confidence >= 80,
    isLocked: Boolean(parser.isLocked),
    rewardLabel: toNonEmptyString(parser.rewardLabel),
    ecosystem: toStringArray(parser.ecosystem),
    platform: toStringArray(parser.platform),
    tags: uniqueStrings(toStringArray(parser.tags)),
    requirements: uniqueStrings(toStringArray(parser.requirements)),
    startDate,
    endDate,
    approxStartDate,
    approxEndDate,
    statusUpdatedAt: updatedTimestamp,
    description: normalizeDescription(parser.description),
    rewardSupply: toOptionalNumber(parser.rewardSupply),
    rewards: Array.isArray(parser.rewards) ? parser.rewards : [],
    rewardAmount: toOptionalNumber(parser.rewardAmount),
    rewardDistribution: toNonEmptyString(parser.rewardDistribution) || null,
    rewardDistributionApprox: toNonEmptyString(parser.rewardDistributionApprox) || null,
    participants: toOptionalNumber(parser.participants),
    relatedAssets: normalizeRelatedAssets(parser.relatedAssets),
    fundsRaised: parser.fundsRaised ?? 0,
    joinLink: toNonEmptyString(parser.joinLink) || "",
    links,
    socialLinks,
    videoGuides: toStringArray(parser.videoGuides),
    createdAt: createdTimestamp,
    updatedAt: updatedTimestamp,
    investors: Array.isArray(parser.investors) ? parser.investors : [],
    review: parser.review,
    metrics: parser.metrics,
    timeline: normalizeTimeline(parser.timeline),
    flags: parser.flags,
    taskGuide: normalizeTaskGuide(parser.taskGuide, projectName, sourceUrl || originalUrl),
    sourceMeta: {
      ...(parser.sourceMeta || {}),
      source,
      externalId: toNonEmptyString(parser.externalId),
      canonicalUrl: toNonEmptyString(parser.canonicalUrl),
      originalUrl,
    },
    rawSourceData: parser.rawSourceData || parser.raw,
    parserMeta: {
      ...(parser.parserMeta || {}),
      sourceSystem: "crypto-activities-parser",
      source,
      confidence,
    },
  };
}

export function stableNegativeId(value: string): number {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const normalized = Math.abs(hash % 900000000) + 1000000;
  return -normalized;
}

export function slugify(value: string): string {
  return String(value || "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeComparableText(value?: string): string {
  return slugify(value || "");
}

function normalizeActivityType(type?: string): string {
  const normalized = String(type || "").replace(/[\s_-]/g, "").toUpperCase();
  const map: Record<string, string> = {
    AIRDROP: "Airdrop",
    TESTNET: "Testnet",
    QUEST: "Quest",
    WHITELIST: "Whitelist",
    WAITLIST: "Whitelist",
    FARMING: "Farming",
    NODE: "Node",
    OTHER: "Other",
  };

  return map[normalized] || toNonEmptyString(type) || "Other";
}

function normalizeDifficulty(value?: string): "Easy" | "Medium" | "Hard" | undefined {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "easy") return "Easy";
  if (normalized === "medium") return "Medium";
  if (normalized === "hard") return "Hard";
  return undefined;
}

function normalizeTaskFrequency(value?: string): "Daily" | "Weekly" | "Monthly" | "Ongoing" | undefined {
  const normalized = String(value || "").toLowerCase();
  if (normalized === "daily") return "Daily";
  if (normalized === "weekly") return "Weekly";
  if (normalized === "monthly") return "Monthly";
  if (normalized === "ongoing") return "Ongoing";
  return undefined;
}

function buildFallbackSymbol(value: string): string {
  const words = String(value || "")
    .split(/[^a-z0-9]+/i)
    .map((item) => item.trim())
    .filter(Boolean);

  if (!words.length) return "TBA";
  if (words.length === 1) return words[0].slice(0, 8) || "TBA";

  return words
    .slice(0, 4)
    .map((word) => word[0])
    .join("")
    .slice(0, 8) || "TBA";
}

function normalizeScore(score: unknown, confidence: number): string {
  const explicit = toNonEmptyString(score);
  if (explicit && Number.isNaN(Number(explicit))) return explicit.toUpperCase();

  const numericScore = typeof score === "number" ? score : confidence;
  if (numericScore >= 85) return "VERY_HIGH";
  if (numericScore >= 65) return "HIGH";
  if (numericScore >= 40) return "MEDIUM";
  if (numericScore > 0) return "LOW";
  return "NOT_RATED";
}

function getConfidence(parser: ParserCryptoActivity): number {
  const candidates = [
    parser.parserMeta?.confidence,
    parser.parserMeta?.score,
    parser.score,
  ];

  for (const candidate of candidates) {
    const value = Number(candidate);
    if (Number.isFinite(value)) return Math.max(0, Math.min(100, value));
  }

  return 0;
}

function normalizeDescription(description: ParserCryptoActivity["description"]) {
  if (typeof description === "string") {
    return {
      about: description,
      aboutHtml: "",
      howToParticipate: "",
      howToParticipateHtml: "",
    };
  }

  return {
    about: toNonEmptyString(description?.about) || "",
    aboutHtml: toNonEmptyString(description?.aboutHtml) || "",
    howToParticipate: toNonEmptyString(description?.howToParticipate) || "",
    howToParticipateHtml: toNonEmptyString(description?.howToParticipateHtml) || "",
  };
}

function normalizeTaskGuide(taskGuide: any, projectName: string, joinLink?: string) {
  if (!taskGuide || typeof taskGuide !== "object") {
    return {
      title: projectName ? `How to participate in ${projectName}` : "",
      description: "",
      descriptionHtml: "",
      ctaLabel: joinLink ? "Open activity" : "",
      ctaUrl: toNonEmptyString(joinLink) || "",
      steps: [],
    };
  }

  return {
    title: toNonEmptyString(taskGuide.title) || "",
    description: toNonEmptyString(taskGuide.description) || "",
    descriptionHtml: toNonEmptyString(taskGuide.descriptionHtml) || "",
    ctaLabel: toNonEmptyString(taskGuide.ctaLabel) || "",
    ctaUrl: toNonEmptyString(taskGuide.ctaUrl) || toNonEmptyString(joinLink) || "",
    successMessage: toNonEmptyString(taskGuide.successMessage) || "",
    isLocked: Boolean(taskGuide.isLocked),
    steps: normalizeSteps(taskGuide.steps),
  };
}

function normalizeSteps(steps: any[]): any[] {
  if (!Array.isArray(steps)) return [];

  const seen = new Set<string>();
  const result: any[] = [];

  for (const step of steps) {
    const title = toNonEmptyString(step?.title);
    if (!title) continue;

    const description = toNonEmptyString(step?.description) || "";
    const key = normalizeComparableText(`${title}:${description}`);
    if (!key || seen.has(key)) continue;

    seen.add(key);
    result.push({
      id: toNonEmptyString(step?.id) || `step-${result.length + 1}`,
      title,
      description,
      descriptionHtml: toNonEmptyString(step?.descriptionHtml) || "",
      image: toNonEmptyString(step?.image) || "",
      video: toNonEmptyString(step?.video) || "",
    });
  }

  return result;
}

function normalizeTimeline(timeline: any[]): any[] {
  if (!Array.isArray(timeline)) return [];

  return timeline
    .map((item) => {
      const title = toNonEmptyString(item?.title);
      if (!title) return null;

      return {
        title,
        date: toDateOrNull(item?.date),
        description: toNonEmptyString(item?.description) || "",
      };
    })
    .filter(Boolean);
}

function normalizeRelatedAssets(assets: any[]): any[] {
  if (!Array.isArray(assets)) return [];

  return assets
    .map((asset) => {
      const name = toNonEmptyString(asset?.name);
      const slug = toNonEmptyString(asset?.slug) || slugify(name || "");
      if (!name || !slug) return null;

      return {
        name,
        symbol: toNonEmptyString(asset?.symbol) || "",
        image: toNonEmptyString(asset?.image || asset?.logo) || "",
        slug,
      };
    })
    .filter(Boolean);
}

function normalizeSources(
  sources: ParserCryptoActivitySourceRef[] | undefined,
  source: string,
  sourceUrl: string,
): CryptoActivitySourceRef[] {
  const result: CryptoActivitySourceRef[] = [];

  if (Array.isArray(sources)) {
    for (const item of sources) {
      const url = toNonEmptyString(item?.url);
      const itemSource = toNonEmptyString(item?.source) || source;
      if (!url || !itemSource) continue;

      result.push({
        source: itemSource,
        url,
        externalId: toNonEmptyString(item?.externalId),
        lastSeenAt: toDateOrNull(item?.lastSeenAt) || undefined,
      });
    }
  }

  if (sourceUrl && !result.some((item) => item.source === source && item.url === sourceUrl)) {
    result.push({ source, url: sourceUrl });
  }

  return result;
}

function normalizeLinksArray(links: any): Array<{ label: string; url: string }> {
  if (Array.isArray(links)) {
    return links
      .map((item) => {
        const url = toNonEmptyString(item?.url || item?.href || item);
        if (!url) return null;

        return {
          label: toNonEmptyString(item?.label || item?.name) || "Link",
          url,
        };
      })
      .filter(Boolean);
  }

  if (!links || typeof links !== "object") return [];

  const result: Array<{ label: string; url: string }> = [];
  for (const [label, value] of Object.entries(links)) {
    if (label === "custom" && Array.isArray(value)) {
      result.push(...normalizeLinksArray(value));
      continue;
    }

    const url = toNonEmptyString(value);
    if (url) result.push({ label, url });
  }

  return result;
}

function normalizeSocialLinks(links: any): any {
  const socialLinks: any = { custom: [] };
  const linksArray = normalizeLinksArray(links);

  for (const link of linksArray) {
    const label = link.label.toLowerCase();
    if (label.includes("twitter") || label === "x") socialLinks.twitter = link.url;
    else if (label.includes("telegram")) socialLinks.telegram = link.url;
    else if (label.includes("discord")) socialLinks.discord = link.url;
    else if (label.includes("doc")) socialLinks.docs = link.url;
    else if (label.includes("website") || label.includes("site")) socialLinks.website = link.url;
    else socialLinks.custom.push(link);
  }

  return socialLinks;
}

function firstSourceUrl(sources?: ParserCryptoActivitySourceRef[]): string | undefined {
  if (!Array.isArray(sources)) return undefined;

  for (const source of sources) {
    const url = toNonEmptyString(source?.url);
    if (url) return url;
  }

  return undefined;
}

function firstString(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) return value.find((item) => Boolean(toNonEmptyString(item)));
  return toNonEmptyString(value);
}

function toStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => toNonEmptyString(item)).filter(Boolean);
  }

  const singleValue = toNonEmptyString(value);
  return singleValue ? [singleValue] : [];
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)));
}

function toNonEmptyString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text ? text : undefined;
}

function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value as any);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateOrString(value: unknown): Date | string | null {
  if (!value) return "TBA";
  const text = toNonEmptyString(value);
  const date = toDateOrNull(value);

  if (date && text && /^\d{4}-\d{2}-\d{2}/.test(text)) return date;
  return text || date || "TBA";
}

function toTimestamp(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const date = toDateOrNull(value);
  return date ? date.getTime() : undefined;
}

function toOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(number) ? number : null;
}
