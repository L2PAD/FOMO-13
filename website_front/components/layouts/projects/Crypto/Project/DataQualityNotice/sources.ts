export type DataQualitySourceKind = "website" | "documentation" | "github";

export interface DataQualitySource {
  url: string;
  title: string;
  kind: DataQualitySourceKind;
}

export interface DataQualitySourceProject {
  name?: string;
  website?: string[];
  socialmedia?: unknown;
  links?: unknown;
  projectLinks?: unknown;
  rawIcoData?: unknown;
}

interface SourceCandidate {
  url: string;
  name?: string;
  type?: string;
  verified?: boolean;
  origin: "website" | "link";
}

const BLOCKED_SOURCE_DOMAINS = [
  "coingecko.com",
  "coinmarketcap.com",
  "coinmarketcal.com",
  "coinpaprika.com",
  "coincarp.com",
  "coinlaunch.space",
  "crunchbase.com",
  "cryptorank.io",
  "cypherhunter.com",
  "dappradar.com",
  "defillama.com",
  "dropstab.com",
  "icoanalytics.org",
  "icodrops.com",
  "icoholder.com",
  "livecoinwatch.com",
  "messari.io",
  "pitchbook.com",
  "rootdata.com",
  "tokenomist.ai",
  "token.unlocks.app",
  "tokenunlocks.app",
  "tracxn.com",
];

const DOCUMENTATION_HOSTS = [
  "gitbook.io",
  "gitbook.com",
  "readme.io",
  "readthedocs.io",
];

const firstText = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    const text = typeof value === "string" ? value.trim() : "";
    if (text) return text;
  }

  return undefined;
};

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

const parseHttpUrl = (value: string): URL | undefined => {
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return undefined;
    url.hash = "";
    return url;
  } catch {
    return undefined;
  }
};

const matchesDomain = (hostname: string, domain: string): boolean =>
  hostname === domain || hostname.endsWith(`.${domain}`);

const isBlockedDomain = (hostname: string): boolean =>
  BLOCKED_SOURCE_DOMAINS.some((domain) => matchesDomain(hostname, domain));

const isRelatedDomain = (hostname: string, officialHostname: string): boolean => {
  const official = officialHostname.replace(/^www\./, "");
  const candidate = hostname.replace(/^www\./, "");

  return matchesDomain(candidate, official) || matchesDomain(official, candidate);
};

const addCandidates = (
  value: unknown,
  origin: SourceCandidate["origin"],
  result: SourceCandidate[],
  inheritedName?: string
): void => {
  if (!value) return;

  if (typeof value === "string") {
    result.push({ url: value, name: inheritedName, origin });
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => addCandidates(item, origin, result, inheritedName));
    return;
  }

  const record = asRecord(value);
  if (!record) return;

  const url = firstText(record.url, record.href, record.link);
  if (url) {
    result.push({
      url,
      name: firstText(record.name, record.label, inheritedName),
      type: firstText(record.type),
      verified: record.verified === true,
      origin,
    });
    return;
  }

  Object.entries(record).forEach(([name, nestedValue]) => {
    addCandidates(nestedValue, origin, result, name);
  });
};

const isDocumentationCandidate = (
  candidate: SourceCandidate,
  url: URL
): boolean => {
  const searchable = [candidate.name, candidate.type, url.hostname, url.pathname]
    .filter(Boolean)
    .join(" ");

  return /\b(docs?|documentation|developers?|whitepaper|litepaper|technical|academy|research)\b/i.test(
    searchable
  );
};

const isGithubCandidate = (candidate: SourceCandidate, url: URL): boolean =>
  matchesDomain(url.hostname, "github.com") &&
  /github/i.test(`${candidate.name || ""} ${candidate.type || ""}`);

const getSourceKind = (
  candidate: SourceCandidate,
  url: URL
): DataQualitySourceKind => {
  if (isGithubCandidate(candidate, url)) return "github";
  if (isDocumentationCandidate(candidate, url)) return "documentation";
  return "website";
};

const getSourceTitle = (
  projectName: string,
  candidate: SourceCandidate,
  url: URL,
  kind: DataQualitySourceKind
): string => {
  if (matchesDomain(url.hostname, "binance.com")) {
    if (url.hostname.startsWith("academy.")) return "Binance Academy";
    if (url.hostname.startsWith("research.")) return "Binance Research";
    if (kind === "documentation" || /\/(support|docs?)\b/i.test(url.pathname)) {
      return "Binance Docs";
    }
    return "Binance";
  }

  if (kind === "github") return `${projectName} GitHub`;

  if (kind === "documentation") {
    const label = `${candidate.name || ""} ${candidate.type || ""}`;
    if (/whitepaper/i.test(label)) return `${projectName} Whitepaper`;
    if (/litepaper/i.test(label)) return `${projectName} Litepaper`;
    return `${projectName} Documentation`;
  }

  return `${projectName} Official Website`;
};

const normalizeSourceKey = (url: URL): string => {
  const pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
  return `${url.hostname.toLowerCase()}${pathname}${url.search}`;
};

export const buildDataQualitySources = (
  project?: DataQualitySourceProject | null
): DataQualitySource[] => {
  if (!project) return [];

  const candidates: SourceCandidate[] = [];
  addCandidates(project.website, "website", candidates);
  addCandidates(project.links, "link", candidates);
  addCandidates(project.projectLinks, "link", candidates);
  addCandidates(project.socialmedia, "link", candidates);

  const rawIcoData = asRecord(project.rawIcoData);
  addCandidates(rawIcoData?.links, "link", candidates);

  const officialHostnames = candidates
    .filter((candidate) => candidate.origin === "website")
    .map((candidate) => parseHttpUrl(candidate.url))
    .filter((url): url is URL => Boolean(url))
    .filter((url) => !isBlockedDomain(url.hostname))
    .map((url) => url.hostname);

  const projectName = firstText(project.name) || "Project";
  const seen = new Set<string>();
  const sources: DataQualitySource[] = [];

  for (const candidate of candidates) {
    const url = parseHttpUrl(candidate.url);
    if (!url || isBlockedDomain(url.hostname)) continue;

    const isBinance = matchesDomain(url.hostname, "binance.com");
    const isGithub = isGithubCandidate(candidate, url);
    const isDocumentation = isDocumentationCandidate(candidate, url);
    const isProjectDomain = officialHostnames.some((hostname) =>
      isRelatedDomain(url.hostname, hostname)
    );
    const isDocumentationHost = DOCUMENTATION_HOSTS.some((hostname) =>
      matchesDomain(url.hostname, hostname)
    );
    const isOfficialWebsite =
      candidate.origin === "website" ||
      (/website|official/i.test(`${candidate.name || ""} ${candidate.type || ""}`) &&
        isProjectDomain);
    const isOfficialDocumentation =
      isDocumentation &&
      (isProjectDomain || isDocumentationHost || candidate.verified);

    if (!isBinance && !isGithub && !isOfficialWebsite && !isOfficialDocumentation) {
      continue;
    }

    const key = normalizeSourceKey(url);
    if (seen.has(key)) continue;
    seen.add(key);

    const kind = getSourceKind(candidate, url);
    sources.push({
      url: url.toString(),
      title: getSourceTitle(projectName, candidate, url, kind),
      kind,
    });
  }

  return sources;
};
