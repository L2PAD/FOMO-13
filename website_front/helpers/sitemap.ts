import { API } from "../config/api";
import { cleanText, getSiteUrl, toAbsoluteUrl } from "./seo";

export type SitemapChangefreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

export interface SitemapEntry {
  loc: string;
  lastmod?: string;
  changefreq?: SitemapChangefreq;
  priority?: number;
}

interface SitemapFetchResult {
  items: Array<any>;
  total: number;
}

const SITEMAP_PAGE_LIMIT = 500;
const SITEMAP_MAX_PAGES_PER_SOURCE = 20;

export const sitemapSiteUrl = (): string => getSiteUrl();

const escapeXml = (value: unknown): string =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const routePart = (value: unknown): string => encodeURIComponent(cleanText(value));

const firstString = (...values: Array<unknown>): string =>
  values.map(cleanText).find(Boolean) || "";

const firstDate = (...values: Array<unknown>): string => {
  const value = values.find(Boolean);
  const date = value ? new Date(String(value)) : null;

  if (!date || Number.isNaN(date.getTime())) return "";

  return date.toISOString();
};

const internalId = (item: any): string => {
  // eslint-disable-next-line no-underscore-dangle
  return firstString(item?._id);
};

const uniqueEntries = (entries: Array<SitemapEntry>): Array<SitemapEntry> => {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    const loc = cleanText(entry.loc);

    if (!loc || seen.has(loc)) return false;

    seen.add(loc);
    return true;
  });
};

const buildUrlXml = (entry: SitemapEntry): string => {
  const lines = [
    "  <url>",
    `    <loc>${escapeXml(toAbsoluteUrl(entry.loc))}</loc>`,
    entry.lastmod ? `    <lastmod>${escapeXml(entry.lastmod)}</lastmod>` : "",
    entry.changefreq ? `    <changefreq>${entry.changefreq}</changefreq>` : "",
    typeof entry.priority === "number"
      ? `    <priority>${entry.priority.toFixed(1)}</priority>`
      : "",
    "  </url>",
  ];

  return lines.filter(Boolean).join("\n");
};

export const buildSitemapXml = (entries: Array<SitemapEntry>): string => {
  const urls = uniqueEntries(entries).map(buildUrlXml).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
  ].join("\n");
};

const fetchJson = async (path: string): Promise<any> => {
  const response = await fetch(`${API}${path}`, {
    method: "GET",
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
};

const normalizeList = (payload: any): SitemapFetchResult => {
  const items = Array.isArray(payload?.projects)
    ? payload.projects
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.funds)
        ? payload.funds
        : Array.isArray(payload?.persons)
          ? payload.persons
          : [];
  const total = Number(payload?.total || payload?.totalCount || items.length) || items.length;

  return { items, total };
};

const fetchPaginated = async (
  path: string,
  maxPages = SITEMAP_MAX_PAGES_PER_SOURCE
): Promise<Array<any>> => {
  const separator = path.includes("?") ? "&" : "?";
  const makePath = (page: number) =>
    `${path}${separator}page=${page}&limit=${SITEMAP_PAGE_LIMIT}`;
  const firstPage = normalizeList(await fetchJson(makePath(1)));
  const totalPages = Math.min(
    maxPages,
    Math.max(1, Math.ceil(firstPage.total / SITEMAP_PAGE_LIMIT))
  );
  const remainingPages = Array.from(
    { length: Math.max(totalPages - 1, 0) },
    (_, index) => index + 2
  );
  const remainingResults = await Promise.all(
    remainingPages.map(async (page) => normalizeList(await fetchJson(makePath(page))))
  );

  return [firstPage, ...remainingResults].flatMap((result) => result.items);
};

const staticEntries = (): Array<SitemapEntry> => [
  { loc: "/", changefreq: "daily", priority: 1 },
  { loc: "/market", changefreq: "hourly", priority: 0.9 },
  { loc: "/echo", changefreq: "daily", priority: 0.8 },
  { loc: "/crypto/funds", changefreq: "weekly", priority: 0.8 },
  { loc: "/crypto/persons", changefreq: "weekly", priority: 0.8 },
  { loc: "/crypto/projects", changefreq: "daily", priority: 0.8 },
  { loc: "/crypto/funding-feed", changefreq: "daily", priority: 0.7 },
  { loc: "/crypto/calendar", changefreq: "daily", priority: 0.7 },
  { loc: "/crypto/trending", changefreq: "hourly", priority: 0.7 },
  { loc: "/crypto/gainers", changefreq: "hourly", priority: 0.7 },
  { loc: "/faq", changefreq: "monthly", priority: 0.5 },
  { loc: "/legal", changefreq: "yearly", priority: 0.3 },
];

const marketEntries = (items: Array<any>): Array<SitemapEntry> =>
  items
    .map((item) => {
      const id = firstString(
        item?.coingeckoId,
        item?.providerIds?.coingeckoId,
        item?.id,
        item?.slug,
        internalId(item)
      );

      if (!id) return null;

      return {
        loc: `/market/${routePart(id)}`,
        lastmod: firstDate(item?.updatedAt, item?.marketDataUpdatedAt, item?.lastParsedAt),
        changefreq: "hourly" as const,
        priority: 0.8,
      };
    })
    .filter(Boolean) as Array<SitemapEntry>;

const echoEntries = (items: Array<any>): Array<SitemapEntry> =>
  items
    .map((item) => {
      const id = firstString(item?.slug, item?.id, internalId(item));

      if (!id) return null;

      return {
        loc: `/echo/${routePart(id)}`,
        lastmod: firstDate(item?.updatedAt, item?.lastParsedAt, item?.lastFunding),
        changefreq: "daily" as const,
        priority: 0.7,
      };
    })
    .filter(Boolean) as Array<SitemapEntry>;

const fundEntries = (items: Array<any>): Array<SitemapEntry> =>
  items
    .map((item) => {
      const id = firstString(item?.slug, item?.id, internalId(item));

      if (!id) return null;

      return {
        loc: `/crypto/funds/${routePart(id)}`,
        lastmod: firstDate(item?.updatedAt, item?.lastParsedAt, item?.lastFunding),
        changefreq: "weekly" as const,
        priority: 0.7,
      };
    })
    .filter(Boolean) as Array<SitemapEntry>;

const personEntries = (items: Array<any>): Array<SitemapEntry> =>
  items
    .map((item) => {
      const id = firstString(item?.slug, item?.routeId, item?.id, internalId(item));

      if (!id) return null;

      return {
        loc: `/crypto/persons/${routePart(id)}`,
        lastmod: firstDate(item?.updatedAt, item?.lastParsedAt, item?.lastFunding),
        changefreq: "weekly" as const,
        priority: 0.7,
      };
    })
    .filter(Boolean) as Array<SitemapEntry>;

export const collectSitemapEntries = async (): Promise<Array<SitemapEntry>> => {
  const [marketItems, echoItems, fundItems, personItems] = await Promise.all([
    fetchPaginated("/fomo-v2/projects/market"),
    fetchPaginated("/fomo-v2/ico-projects"),
    fetchPaginated("/funds"),
    fetchPaginated("/persons"),
  ]);

  return [
    ...staticEntries(),
    ...marketEntries(marketItems),
    ...echoEntries(echoItems),
    ...fundEntries(fundItems),
    ...personEntries(personItems),
  ];
};
