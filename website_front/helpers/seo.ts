import { IFund, IPerson, IProject } from "../types/global_types";
import imageLoader from "./imageLoader";

export type JsonLd = Record<string, any> | Array<Record<string, any>>;

export interface PageSeo {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  type?: string;
  noIndex?: boolean;
  structuredData?: JsonLd;
}

export const SITE_NAME = "FOMO";

const DEFAULT_SITE_URL = "https://fomo.cx";
const DEFAULT_SEO_IMAGE = "/static/logo-beta.png";
const DEFAULT_DESCRIPTION =
  "FOMO tracks crypto markets, token sales, funding rounds, investors, portfolios and community signals in one platform.";

export const cleanText = (value: unknown): string =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncateText = (value: string, maxLength = 158): string => {
  const text = cleanText(value);

  if (text.length <= maxLength) return text;

  const trimmed = text.slice(0, maxLength - 1).replace(/\s+\S*$/, "");

  return `${trimmed || text.slice(0, maxLength - 1)}...`;
};

const getEnvSiteUrl = (): string =>
  String(
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_FRONT_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    DEFAULT_SITE_URL
  )
    .trim()
    .replace(/\/+$/, "");

export const getSiteUrl = (): string => getEnvSiteUrl() || DEFAULT_SITE_URL;

export const toAbsoluteUrl = (value?: string | null): string => {
  const url = cleanText(value);

  if (!url) return "";
  if (/^(data|blob):/i.test(url)) return url;
  if (/^https?:\/\//i.test(url)) return url;

  return `${getSiteUrl()}${url.startsWith("/") ? url : `/${url}`}`;
};

export const resolveSeoImageUrl = (value?: string | null): string => {
  const loadedImage = imageLoader(value || DEFAULT_SEO_IMAGE);

  if (!loadedImage || /^(data|blob):/i.test(loadedImage)) {
    return toAbsoluteUrl(DEFAULT_SEO_IMAGE);
  }

  return toAbsoluteUrl(loadedImage);
};

export const serializeJsonLd = (value: JsonLd): string =>
  JSON.stringify(value).replace(/</g, "\\u003c");

const compactTitleName = (value: string): string => truncateText(value, 48);

const getSymbol = (...values: Array<unknown>): string => {
  const symbol = values.map(cleanText).find(Boolean) || "";

  return symbol.replace(/^\$+/, "").toUpperCase();
};

const getNameWithSymbol = (name: string, symbol?: string): string => {
  const normalizedName = cleanText(name);
  const normalizedSymbol = getSymbol(symbol);

  if (!normalizedSymbol) return normalizedName;
  if (normalizedName.toUpperCase() === normalizedSymbol) return normalizedName;

  return `${normalizedName} ${normalizedSymbol}`;
};

const firstFiniteNumber = (...values: Array<unknown>): number | null =>
  values.reduce<number | null>((result, value) => {
    if (result !== null || value === null || value === undefined || value === "") {
      return result;
    }

    const rawValue =
      typeof value === "number"
        ? value
        : String(value)
          .replace(/[$,%]/g, "")
          .replace(/,/g, "")
          .trim();
    const parsedValue =
      typeof rawValue === "number" ? rawValue : Number(rawValue);

    return Number.isFinite(parsedValue) ? parsedValue : result;
  }, null);

const formatUsd = (value: unknown): string => {
  const numberValue = firstFiniteNumber(value);

  if (numberValue === null) return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: Math.abs(numberValue) >= 1_000_000 ? "compact" : "standard",
    maximumFractionDigits: Math.abs(numberValue) < 1 ? 6 : 2,
  }).format(numberValue);
};

const formatNumberCompact = (value: unknown): string => {
  const numberValue = firstFiniteNumber(value);

  if (numberValue === null) return "";

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(numberValue);
};

const formatPercent = (value: unknown): string => {
  const numberValue = firstFiniteNumber(value);

  if (numberValue === null) return "";

  return `${new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(numberValue)}%`;
};

const encodeRoutePart = (value: unknown): string => encodeURIComponent(cleanText(value));

const getInternalId = (entity?: { _id?: unknown } | null): unknown => {
  // eslint-disable-next-line no-underscore-dangle
  return entity?._id;
};

const getProjectImage = (project?: Partial<IProject> | null): string =>
  resolveSeoImageUrl(
    String(project?.metadataLogo || project?.logo || project?.image || project?.banner || "")
  );

const getFundImage = (fund?: Partial<IFund> | null): string =>
  resolveSeoImageUrl(String(fund?.logo || fund?.avatar || fund?.banner || ""));

const getPersonImage = (person?: Partial<IPerson> | null): string =>
  resolveSeoImageUrl(String(person?.logo || person?.banner || ""));

const makeBreadcrumbJsonLd = (
  items: Array<{ name: string; url: string }>
): Record<string, any> => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: toAbsoluteUrl(item.url),
  })),
});

const makeStructuredData = (nodes: Array<Record<string, any>>): JsonLd => ({
  "@context": "https://schema.org",
  "@graph": nodes,
});

const makeWebPageJsonLd = (
  title: string,
  description: string,
  canonical: string,
  image: string,
  about?: Record<string, any>
): Record<string, any> => ({
  "@type": "WebPage",
  name: title,
  description,
  url: toAbsoluteUrl(canonical),
  image,
  about,
});

export const buildMarketProjectSeo = (
  project?: Partial<IProject> | null,
  id?: string
): PageSeo => {
  const name = compactTitleName(cleanText(project?.name) || cleanText(id) || "Crypto Asset");
  const symbol = getSymbol(
    project?.symbol,
    project?.ticker,
    project?.tokenMetrics?.ticker,
    project?.tokenMetrics?.ticket
  );
  const displayName = getNameWithSymbol(name, symbol);
  const price = formatUsd(firstFiniteNumber(project?.price, project?.usdQuote?.price));
  const marketCap = formatUsd(firstFiniteNumber(project?.marketCap, project?.usdQuote?.market_cap));
  const volume = formatUsd(firstFiniteNumber(project?.volume24h, project?.volume));
  const canonicalId = project?.coingeckoId || id || project?.slug || getInternalId(project) || "";
  const canonical = canonicalId ? `/market/${encodeRoutePart(canonicalId)}` : "/market";
  const title = `${displayName} Price Today, Live Chart, Market Cap & FOMO Score | ${SITE_NAME}`;
  const descriptionParts = [
    `Track ${displayName} live price`,
    price ? `(${price})` : "",
    "chart",
    marketCap ? `market cap ${marketCap}` : "market cap",
    volume ? `24h volume ${volume}` : "24h volume",
    "exchanges, token data and FOMO analytics.",
  ];
  const description = truncateText(descriptionParts.filter(Boolean).join(", "));
  const image = getProjectImage(project);

  return {
    title,
    description,
    canonical,
    image,
    type: "website",
    structuredData: makeStructuredData([
      makeWebPageJsonLd(title, description, canonical, image, {
        "@type": "Thing",
        name: displayName,
        alternateName: symbol || undefined,
      }),
      makeBreadcrumbJsonLd([
        { name: SITE_NAME, url: "/" },
        { name: "Crypto Market", url: "/market" },
        { name: displayName, url: canonical },
      ]),
    ]),
  };
};

export const buildEchoProjectSeo = (
  project?: Partial<IProject> | null,
  slug?: string
): PageSeo => {
  const name = compactTitleName(cleanText(project?.name) || cleanText(slug) || "Crypto Project");
  const symbol = getSymbol(
    project?.symbol,
    project?.ticker,
    project?.tokenMetrics?.ticker,
    project?.tokenMetrics?.ticket
  );
  const displayName = getNameWithSymbol(name, symbol);
  const raised = formatUsd(firstFiniteNumber(project?.fundsRaised, project?.totalRaised));
  const canonicalId = project?.slug || slug || getInternalId(project) || "";
  const canonical = canonicalId ? `/echo/${encodeRoutePart(canonicalId)}` : "/echo";
  const title = `${displayName} Echo: Token Sale, Funding, Vesting & FOMO Score | ${SITE_NAME}`;
  const description = truncateText(
    `Explore ${displayName}: token sale data, fundraising rounds${
      raised ? ` (${raised} raised)` : ""
    }, investors, vesting, tokenomics, key dates and FOMO community signals.`
  );
  const image = getProjectImage(project);

  return {
    title,
    description,
    canonical,
    image,
    type: "website",
    structuredData: makeStructuredData([
      makeWebPageJsonLd(title, description, canonical, image, {
        "@type": "Thing",
        name: displayName,
        alternateName: symbol || undefined,
      }),
      makeBreadcrumbJsonLd([
        { name: SITE_NAME, url: "/" },
        { name: "Echo", url: "/echo" },
        { name: displayName, url: canonical },
      ]),
    ]),
  };
};

export const buildFundSeo = (fund?: Partial<IFund> | null, id?: string): PageSeo => {
  const name = compactTitleName(cleanText(fund?.name) || cleanText(id) || "Crypto Fund");
  const roi = cleanText(fund?.roiDisplay) || formatPercent(fund?.roi);
  const investments = formatNumberCompact(
    firstFiniteNumber(
      fund?.totalInvestments,
      fund?.numberOfInvestments,
      fund?.supportedProjectsCount,
      fund?.projectsCount
    )
  );
  const canonicalId = fund?.slug || fund?.id || getInternalId(fund) || id || "";
  const canonical = canonicalId ? `/crypto/funds/${encodeRoutePart(canonicalId)}` : "/crypto/funds";
  const title = `${name} Crypto Fund: Portfolio, Investments, ROI & Co-Investors | ${SITE_NAME}`;
  const description = truncateText(
    `Discover ${name}'s crypto portfolio, recent investments${
      investments ? ` (${investments} tracked)` : ""
    }, lead rounds, sectors, co-investors${roi ? `, ROI ${roi}` : ""} and supported projects on FOMO.`
  );
  const image = getFundImage(fund);

  return {
    title,
    description,
    canonical,
    image,
    type: "profile",
    structuredData: makeStructuredData([
      makeWebPageJsonLd(title, description, canonical, image, {
        "@type": "Organization",
        name,
        logo: image,
      }),
      {
        "@type": "Organization",
        name,
        url: toAbsoluteUrl(canonical),
        logo: image,
        description,
      },
      makeBreadcrumbJsonLd([
        { name: SITE_NAME, url: "/" },
        { name: "Crypto Funds", url: "/crypto/funds" },
        { name, url: canonical },
      ]),
    ]),
  };
};

export const buildPersonSeo = (
  person?: Partial<IPerson> | null,
  id?: string
): PageSeo => {
  const name = compactTitleName(cleanText(person?.name) || cleanText(id) || "Crypto Investor");
  const position = cleanText(person?.position);
  const company = cleanText(person?.company);
  const role = [position, company ? `at ${company}` : ""].filter(Boolean).join(" ");
  const roi = cleanText(person?.roiDisplay) || formatPercent(person?.roi);
  const investments = formatNumberCompact(
    firstFiniteNumber(
      person?.totalInvestments,
      person?.numberOfInvestments,
      person?.supportedProjectsCount,
      person?.projectsCount
    )
  );
  const canonicalId = person?.slug || person?.routeId || person?.id || getInternalId(person) || id || "";
  const canonical = canonicalId ? `/crypto/persons/${encodeRoutePart(canonicalId)}` : "/crypto/persons";
  const title = role
    ? `${name} - ${role}: Crypto Portfolio & Deals | ${SITE_NAME}`
    : `${name} Crypto Investor Profile, Portfolio, ROI & Network | ${SITE_NAME}`;
  const description = truncateText(
    `Explore ${name}'s crypto profile: investments${
      investments ? ` (${investments} tracked)` : ""
    }, portfolio${roi ? `, ROI ${roi}` : ""}, supported projects, network, achievements and social links on FOMO.`
  );
  const image = getPersonImage(person);

  return {
    title,
    description,
    canonical,
    image,
    type: "profile",
    structuredData: makeStructuredData([
      makeWebPageJsonLd(title, description, canonical, image, {
        "@type": "Person",
        name,
        jobTitle: position || undefined,
        worksFor: company ? { "@type": "Organization", name: company } : undefined,
        image,
      }),
      {
        "@type": "Person",
        name,
        url: toAbsoluteUrl(canonical),
        image,
        jobTitle: position || undefined,
        worksFor: company ? { "@type": "Organization", name: company } : undefined,
        description,
      },
      makeBreadcrumbJsonLd([
        { name: SITE_NAME, url: "/" },
        { name: "Crypto Persons", url: "/crypto/persons" },
        { name, url: canonical },
      ]),
    ]),
  };
};

export const buildFallbackSeo = (title: string, canonical = "/"): PageSeo => ({
  title: `${title} | ${SITE_NAME}`,
  description: DEFAULT_DESCRIPTION,
  canonical,
  image: resolveSeoImageUrl(DEFAULT_SEO_IMAGE),
  type: "website",
});
