import { BadRequestException } from "@nestjs/common";
import * as cheerio from "cheerio";
import { createHash } from "crypto";
import { normalizeProjectSourceType } from "../../../shared/source-policy";
import { FomoV2ActivityContent } from "../types";

const ALLOWED_HTML_TAGS = new Set([
  "a",
  "b",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "i",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "u",
  "ul",
]);

const REMOVED_HTML_TAGS = new Set([
  "base",
  "embed",
  "form",
  "iframe",
  "input",
  "link",
  "meta",
  "object",
  "script",
  "style",
  "svg",
  "template",
]);

const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(["href", "title", "target", "rel"]),
  img: new Set(["src", "alt", "title", "width", "height"]),
  td: new Set(["colspan", "rowspan"]),
  th: new Set(["colspan", "rowspan"]),
};

export function sanitizeActivityHtml(
  value?: string,
  maxLength = 200_000,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).slice(0, Math.max(0, maxLength));
  const $ = cheerio.load(normalized, null, false);

  $("*").each((_index, element: any) => {
    const tag = String(element.tagName || element.name || "").toLowerCase();
    const node = $(element);
    if (REMOVED_HTML_TAGS.has(tag)) {
      node.remove();
      return;
    }
    if (!ALLOWED_HTML_TAGS.has(tag)) {
      node.replaceWith(node.contents());
      return;
    }

    const allowed = ALLOWED_ATTRIBUTES[tag] || new Set<string>();
    for (const attribute of Object.keys(element.attribs || {})) {
      const normalized = attribute.toLowerCase();
      if (!allowed.has(normalized) || normalized.startsWith("on")) {
        node.removeAttr(attribute);
      }
    }

    if (tag === "a") {
      const href = sanitizeActivityUrl(node.attr("href"), {
        allowAnchor: true,
        allowMailto: true,
        allowRelative: true,
      });
      if (href) node.attr("href", href);
      else node.removeAttr("href");
      if (node.attr("target") === "_blank") {
        node.attr("rel", "noopener noreferrer nofollow");
      }
    }

    if (tag === "img") {
      const src = sanitizeActivityUrl(node.attr("src"), {
        allowRelative: true,
      });
      if (src) node.attr("src", src);
      else node.removeAttr("src");
    }
  });

  return $.html();
}

export function sanitizeActivityContent(
  content: FomoV2ActivityContent,
): FomoV2ActivityContent {
  const clean = cloneValue(content || {}) as FomoV2ActivityContent;

  if (clean.description) {
    clean.description.aboutHtml = sanitizeActivityHtml(
      clean.description.aboutHtml,
    );
    clean.description.howToParticipateHtml = sanitizeActivityHtml(
      clean.description.howToParticipateHtml,
    );
  }
  if (clean.review) {
    clean.review.textHtml = sanitizeActivityHtml(clean.review.textHtml);
  }
  if (clean.taskGuide) {
    clean.taskGuide.descriptionHtml = sanitizeActivityHtml(
      clean.taskGuide.descriptionHtml,
    );
    clean.taskGuide.ctaUrl = sanitizeActivityUrl(clean.taskGuide.ctaUrl);
    if (hasOwn(clean.taskGuide, "steps")) {
      clean.taskGuide.steps = (clean.taskGuide.steps || [])
        .slice(0, 100)
        .map((step) => ({
          ...step,
          descriptionHtml: sanitizeActivityHtml(step.descriptionHtml, 100_000),
          ctaUrl: sanitizeActivityUrl(step.ctaUrl),
          image: sanitizeActivityUrl(step.image),
          video: sanitizeActivityUrl(step.video),
        }));
    }
  }

  clean.logo = sanitizeActivityUrl(clean.logo);
  clean.projectLogo = sanitizeActivityUrl(clean.projectLogo);
  clean.joinLink = sanitizeActivityUrl(clean.joinLink);
  if (hasOwn(clean, "links")) clean.links = sanitizeLinks(clean.links);
  if (hasOwn(clean, "videoGuides")) {
    clean.videoGuides = sanitizeUrls(clean.videoGuides);
  }
  if (hasOwn(clean, "relatedAssets")) {
    clean.relatedAssets = (clean.relatedAssets || []).map((asset) => ({
      ...asset,
      image: sanitizeActivityUrl(asset.image),
    }));
  }
  if (hasOwn(clean, "investors")) {
    clean.investors = (clean.investors || [])
      .slice(0, 100)
      .map((investor) => ({
        ...investor,
        name: String(investor.name || "").trim(),
        logo: sanitizeActivityUrl(investor.logo),
        website: sanitizeActivityUrl(investor.website),
      }))
      .filter((investor) => investor.name);
  }
  if (clean.socialLinks) {
    clean.socialLinks.website = sanitizeActivityUrl(clean.socialLinks.website);
    clean.socialLinks.twitter = sanitizeActivityUrl(clean.socialLinks.twitter);
    clean.socialLinks.telegram = sanitizeActivityUrl(clean.socialLinks.telegram);
    clean.socialLinks.discord = sanitizeActivityUrl(clean.socialLinks.discord);
    clean.socialLinks.docs = sanitizeActivityUrl(clean.socialLinks.docs);
    if (hasOwn(clean.socialLinks, "custom")) {
      clean.socialLinks.custom = sanitizeLinks(clean.socialLinks.custom);
    }
  }

  if (hasOwn(clean, "ecosystem")) clean.ecosystem = uniqueStrings(clean.ecosystem);
  if (hasOwn(clean, "platform")) clean.platform = uniqueStrings(clean.platform);
  if (hasOwn(clean, "tags")) clean.tags = uniqueStrings(clean.tags);
  if (hasOwn(clean, "requirements")) {
    clean.requirements = uniqueStrings(clean.requirements);
  }
  if (clean.flags) {
    if (hasOwn(clean.flags, "green")) {
      clean.flags.green = uniqueStrings(clean.flags.green);
    }
    if (hasOwn(clean.flags, "yellow")) {
      clean.flags.yellow = uniqueStrings(clean.flags.yellow);
    }
    if (hasOwn(clean.flags, "red")) {
      clean.flags.red = uniqueStrings(clean.flags.red);
    }
  }

  return removeUndefined(clean) as FomoV2ActivityContent;
}

export function sanitizeActivityUrl(
  value?: string,
  options: {
    allowAnchor?: boolean;
    allowMailto?: boolean;
    allowRelative?: boolean;
  } = {},
): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const url = String(value).trim();
  if (!url) return undefined;
  if (options.allowAnchor && url.startsWith("#")) return url;
  if (options.allowRelative && url.startsWith("/") && !url.startsWith("//")) {
    return url;
  }
  if (options.allowMailto && /^mailto:[^\s]+$/i.test(url)) return url;
  if (/^https?:\/\/[^\s]+$/i.test(url)) return url;
  return undefined;
}

export function mergeActivityContent(
  current: FomoV2ActivityContent = {},
  patch: FomoV2ActivityContent = {},
): FomoV2ActivityContent {
  return deepMerge(current, patch) as FomoV2ActivityContent;
}

export function mergeActivitySourceContent(
  current: FomoV2ActivityContent = {},
  incoming: FomoV2ActivityContent = {},
  manualOverrideFields: string[] = [],
): FomoV2ActivityContent {
  return mergeSourceValue(current, incoming, "", manualOverrideFields);
}

export function activityChangedFields(value: Record<string, any>): string[] {
  const result: string[] = [];
  collectChangedFields(value || {}, "", result);
  return Array.from(new Set(result)).sort();
}

export function activityDifferingFields(
  current: Record<string, any> = {},
  next: Record<string, any> = {},
): string[] {
  const candidates = activityChangedFields(next);
  return candidates.filter((path) => {
    const segments = path.split(".");
    return stableStringify(valueAtPath(current, segments)) !==
      stableStringify(valueAtPath(next, segments));
  });
}

export function normalizeActivitySlug(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildActivitySourceKey(source: string, sourceId?: string): string {
  const normalizedSource = normalizeProjectSourceType(source);
  const normalizedId = String(sourceId || "").trim().toLowerCase();
  return normalizedId ? `${normalizedSource}:${normalizedId}` : "";
}

export function hashActivityPayload(value: any): string {
  return createHash("sha256").update(stableStringify(value)).digest("hex");
}

export function activityActor(user?: Record<string, any>): string {
  return String(
    user?._id || user?.id || user?.email || user?.wallet || "system",
  );
}

function sanitizeLinks<T extends { label: string; url: string }>(
  links?: T[],
): T[] {
  return (links || [])
    .map((link) => ({
      ...link,
      label: String(link.label || "").trim(),
      url: sanitizeActivityUrl(link.url) || "",
    }))
    .filter((link) => link.label && link.url) as T[];
}

function sanitizeUrls(values?: string[]): string[] {
  return Array.from(
    new Set((values || []).map((value) => sanitizeActivityUrl(value)).filter(Boolean)),
  ) as string[];
}

function uniqueStrings(values?: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values || []) {
    const text = String(value || "").trim();
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    result.push(text);
  }
  return result;
}

function deepMerge(current: any, patch: any): any {
  if (patch === undefined) return cloneValue(current);
  if (patch === null || Array.isArray(patch) || patch instanceof Date) {
    return cloneValue(patch);
  }
  if (!isPlainObject(patch)) return patch;

  const result = isPlainObject(current) ? cloneValue(current) : {};
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;
    result[key] = deepMerge(result[key], value);
  }
  return result;
}

function mergeSourceValue(
  current: any,
  incoming: any,
  path: string,
  overrides: string[],
): any {
  if (path && isOverridden(path, overrides)) return cloneValue(current);
  if (!isPlainObject(incoming)) return cloneValue(incoming);

  const result = isPlainObject(current) ? cloneValue(current) : {};
  for (const [key, value] of Object.entries(incoming)) {
    const childPath = path ? `${path}.${key}` : key;
    result[key] = mergeSourceValue(result[key], value, childPath, overrides);
  }
  return result;
}

function isOverridden(path: string, overrides: string[]): boolean {
  return overrides.some(
    (override) => path === override || path.startsWith(`${override}.`),
  );
}

function collectChangedFields(value: any, path: string, result: string[]): void {
  if (!isPlainObject(value)) {
    if (path) result.push(path);
    return;
  }
  const entries = Object.entries(value);
  if (!entries.length && path) result.push(path);
  for (const [key, child] of entries) {
    collectChangedFields(child, path ? `${path}.${key}` : key, result);
  }
}

function cloneValue<T>(value: T): T {
  if (value instanceof Date) return new Date(value.getTime()) as T;
  if (Array.isArray(value)) return value.map((item) => cloneValue(item)) as T;
  if (!isPlainObject(value)) return value;
  return Object.entries(value as Record<string, any>).reduce(
    (result, [key, child]) => {
      result[key] = cloneValue(child);
      return result;
    },
    {} as Record<string, any>,
  ) as T;
}

function removeUndefined(value: any): any {
  if (Array.isArray(value)) return value.map(removeUndefined);
  if (!isPlainObject(value)) return value;
  return Object.entries(value).reduce((result, [key, child]) => {
    if (child !== undefined) result[key] = removeUndefined(child);
    return result;
  }, {} as Record<string, any>);
}

function isPlainObject(value: any): value is Record<string, any> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !(value instanceof Date);
}

function hasOwn(value: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function stableStringify(value: any): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value instanceof Date ? value.toISOString() : value);
}

function valueAtPath(value: any, segments: string[]): any {
  return segments.reduce(
    (current, segment) =>
      current === undefined || current === null
        ? undefined
        : current[segment],
    value,
  );
}

export function assertActivityDraftPublishable(content: FomoV2ActivityContent): void {
  const missing = [
    !String(content?.name || content?.projectName || "").trim() && "name",
    !String(content?.activityType || "").trim() && "activityType",
  ].filter(Boolean);
  if (missing.length) {
    throw new BadRequestException(
      `Activity draft is not publishable. Missing: ${missing.join(", ")}.`,
    );
  }
  if (content.startDate && content.endDate) {
    const start = new Date(content.startDate).getTime();
    const end = new Date(content.endDate).getTime();
    if (Number.isFinite(start) && Number.isFinite(end) && start > end) {
      throw new BadRequestException("Activity startDate must not be after endDate.");
    }
  }
}
