#!/usr/bin/env node

try {
  require("dotenv").config();
} catch (_) {
  // dotenv is optional; production environments usually provide DB_URL directly.
}

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

mongoose.set("strictQuery", false);

const TOKEN_STAGE_PATTERN = /\b(token|ico|ido|ieo|public\s*sale|private\s*sale|launchpad)\b/i;
const EMPTY_VALUES = new Set(["", "-", "n/a", "na", "none", "null", "undefined", "unknown", "tba", "tbd"]);
const PROJECT_PROJECTION = {
  name: 1,
  slug: 1,
  sourceId: 1,
  symbol: 1,
  niche: 1,
  ticker: 1,
  tokenSymbol: 1,
  coingeckoId: 1,
  coinGeckoId: 1,
  coinmarketcapId: 1,
  coinMarketCapId: 1,
  tokenomics: 1,
  tokenMetrics: 1,
  rawIcoData: 1,
  dates: 1,
  tgeDate: 1,
  fdv: 1,
  fullyDilutedMarketCap: 1,
  valuation: 1,
};
const DEFAULT_MARKDOWN_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "docs",
  "audits",
  "funding-round-token-coverage-audit.md",
);
const DEFAULT_JSON_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "tmp",
  "funding-round-token-coverage-audit.json",
);

function usage() {
  return [
    "Funding rounds token coverage audit (read-only).",
    "",
    "Usage:",
    "  node scripts/audit-funding-round-token-coverage.js [options]",
    "",
    "Options:",
    "  --limit <n>        Limit scanned hasToken=false rounds.",
    "  --skip <n>         Skip scanned rounds.",
    "  --examples <n>     Number of grouped examples in report. Default: 100.",
    "  --markdown <path>  Markdown output path. Default: ../docs/audits/funding-round-token-coverage-audit.md",
    "  --json <path>      JSON output path. Default: ../tmp/funding-round-token-coverage-audit.json",
    "  --no-json          Do not write JSON output.",
    "  --include-missing  Include rounds where hasToken is missing as well as false.",
    "  --help             Show this help.",
    "",
    "Environment:",
    "  DB_URL or MONGO_URL is required.",
  ].join("\n");
}

function readArg(name) {
  const withEquals = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (withEquals) return withEquals.slice(name.length + 1);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1];

  return undefined;
}

function positiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function mongoUri() {
  if (process.env.MONGO_URL) return process.env.MONGO_URL;
  if (process.env.DB_URL) return `${process.env.DB_URL}/fomoland?authSource=admin`;
  throw new Error("DB_URL or MONGO_URL is required");
}

function objectIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toHexString === "function") return value.toHexString();
  if (value._id && value._id !== value) return objectIdString(value._id);
  if (typeof value.toString === "function") return value.toString();
  return "";
}

function isNonEmptyScalar(value) {
  if (value === null || value === undefined) return false;

  if (typeof value === "number") return Number.isFinite(value) && value !== 0;
  if (typeof value === "boolean") return value;
  if (value instanceof Date) return !Number.isNaN(value.getTime());

  if (typeof value === "string") {
    return !EMPTY_VALUES.has(value.trim().toLowerCase());
  }

  return true;
}

function hasUsefulValue(value) {
  if (!isNonEmptyScalar(value)) return false;

  if (Array.isArray(value)) return value.some(hasUsefulValue);
  if (typeof value === "object" && !(value instanceof Date)) {
    return Object.values(value).some(hasUsefulValue);
  }

  return true;
}

function cleanString(value) {
  return isNonEmptyScalar(value) ? String(value).trim() : "";
}

function uniqueValues(values) {
  return Array.from(new Set(values.map(cleanString).filter(Boolean)));
}

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeAlnum(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parsePositiveNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : 0;
  if (typeof value !== "string") return 0;

  const normalized = value.trim().toLowerCase();
  if (!normalized || EMPTY_VALUES.has(normalized)) return 0;

  const multiplier = normalized.includes("b")
    ? 1_000_000_000
    : normalized.includes("m")
      ? 1_000_000
      : normalized.includes("k")
        ? 1_000
        : 1;
  const parsed = Number(normalized.replace(/[^0-9.-]+/g, ""));

  return Number.isFinite(parsed) && parsed > 0 ? parsed * multiplier : 0;
}

function getPath(source, dottedPath) {
  return dottedPath.split(".").reduce((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return current[key];
  }, source);
}

function providerIds(project) {
  const rawIcoData = project?.rawIcoData || {};
  const tokenMetrics = project?.tokenMetrics || {};
  const ids = {
    coingeckoId: uniqueValues([
      project?.coingeckoId,
      project?.coinGeckoId,
      rawIcoData?.coingeckoId,
      rawIcoData?.coinGeckoId,
      tokenMetrics?.coingeckoId,
      tokenMetrics?.coinGeckoId,
    ]),
    coinmarketcapId: uniqueValues([
      project?.coinmarketcapId,
      project?.coinMarketCapId,
      rawIcoData?.coinmarketcapId,
      rawIcoData?.coinMarketCapId,
      rawIcoData?.cmcId,
      tokenMetrics?.coinmarketcapId,
      tokenMetrics?.coinMarketCapId,
      tokenMetrics?.cmcId,
    ]),
  };

  return {
    ...ids,
    hasAny: ids.coingeckoId.length > 0 || ids.coinmarketcapId.length > 0,
  };
}

function tokenSymbolValues(project) {
  return uniqueValues([
    project?.tokenSymbol,
    project?.ticker,
    project?.rawIcoData?.tokenSymbol,
    project?.rawIcoData?.ticker,
    project?.rawIcoData?.symbol,
    project?.tokenMetrics?.tokenSymbol,
    project?.tokenMetrics?.ticker,
    project?.tokenMetrics?.symbol,
    project?.tokenomics?.tokenSymbol,
    project?.tokenomics?.ticker,
    project?.tokenomics?.symbol,
  ]);
}

function projectTickerValues(project) {
  return uniqueValues([
    project?.ticker,
    project?.rawIcoData?.ticker,
    project?.tokenMetrics?.ticker,
    project?.tokenomics?.ticker,
  ]);
}

function hasTokenomics(project) {
  return [
    project?.tokenomics,
    project?.rawIcoData?.tokenomics,
    project?.tokenMetrics,
    project?.rawIcoData?.tokenMetrics,
  ].some(hasUsefulValue);
}

function hasTgeDate(project) {
  return [
    project?.tgeDate,
    project?.rawIcoData?.tgeDate,
    project?.tokenMetrics?.tgeDate,
    project?.tokenomics?.tgeDate,
    project?.dates?.tge,
    project?.dates?.tgeDate,
  ].some(hasUsefulValue);
}

function hasFdv(project) {
  return [
    project?.fdv,
    project?.fullyDilutedMarketCap,
    project?.valuation,
    project?.rawIcoData?.fdv,
    project?.rawIcoData?.fullyDilutedMarketCap,
    project?.rawIcoData?.valuation,
    project?.tokenMetrics?.fdv,
    project?.tokenMetrics?.fullyDilutedMarketCap,
    project?.tokenMetrics?.valuation,
  ].some((value) => parsePositiveNumber(value) > 0);
}

function isGeneratedTicker(symbol, project) {
  const normalizedSymbol = normalizeAlnum(symbol);
  const generatedCandidates = [
    project?.slug,
    project?.rawIcoData?.slug,
    project?.sourceId,
    project?.name,
  ].map(normalizeAlnum).filter(Boolean);

  return generatedCandidates.includes(normalizedSymbol);
}

function looksLikeRealShortTicker(project) {
  const symbol = cleanString(project?.symbol || project?.rawIcoData?.symbol);
  if (!symbol) return false;
  if (!/^[a-z0-9]{2,8}$/i.test(symbol)) return false;
  if (!/[a-z]/i.test(symbol)) return false;
  if (EMPTY_VALUES.has(symbol.toLowerCase())) return false;
  if (["TOKEN", "COIN", "CRYPTO"].includes(symbol.toUpperCase())) return false;

  return !isGeneratedTicker(symbol, project);
}

function stageTypeText(round) {
  return uniqueValues([
    round?.stage,
    round?.type,
    round?.round,
    round?.roundType,
    round?.distributionType,
  ]).join(" / ");
}

function roundHasTokenSaleStage(round) {
  return TOKEN_STAGE_PATTERN.test(stageTypeText(round).replace(/[-_]+/g, " "));
}

function weakSignals(project, round) {
  const signals = [];
  const symbols = tokenSymbolValues(project);
  const tickers = projectTickerValues(project);

  if (symbols.length || tickers.length) {
    signals.push({
      key: "tokenSymbolOrTicker",
      label: `tokenSymbol/ticker=${uniqueValues([...symbols, ...tickers]).join(", ")}`,
    });
  }

  if (hasTokenomics(project)) {
    signals.push({ key: "tokenomics", label: "tokenomics/tokenMetrics present" });
  }

  if (hasTgeDate(project)) {
    signals.push({ key: "tgeDate", label: "tgeDate present" });
  }

  if (hasFdv(project)) {
    signals.push({ key: "fdv", label: "fdv/valuation present" });
  }

  if (roundHasTokenSaleStage(round)) {
    signals.push({ key: "roundStageTokenSale", label: `round stage/type=${stageTypeText(round)}` });
  }

  if (looksLikeRealShortTicker(project)) {
    signals.push({ key: "realShortTicker", label: `project.symbol=${cleanString(project?.symbol || project?.rawIcoData?.symbol || project?.niche)}` });
  }

  return signals;
}

function recommendedAction(signals, ids) {
  const keys = new Set(signals.map((signal) => signal.key));

  if (ids.hasAny) return "addProviderId";

  const tokenIdentity = keys.has("tokenSymbolOrTicker") || keys.has("realShortTicker");
  const tokenData = keys.has("tokenomics") || keys.has("tgeDate") || keys.has("fdv");
  const saleStage = keys.has("roundStageTokenSale");

  if (tokenIdentity && (tokenData || saleStage)) return "addProviderId";
  if (tokenData && saleStage) return "addProviderId";
  if (signals.length >= 2) return "addVerifiedMapping";

  return "ignore";
}

function getRoundProjectIds(round) {
  return Array.from(
    new Set(
      [
        objectIdString(round?.projectId),
        ...(Array.isArray(round?.projectLinks)
          ? round.projectLinks.map((link) => objectIdString(link?.projectId))
          : []),
      ].filter((id) => mongoose.Types.ObjectId.isValid(id)),
    ),
  );
}

function getRoundProjectSlugs(round) {
  return Array.from(new Set([cleanString(round?.coinSlug)].filter(Boolean)));
}

function chunkArray(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function loadProjectsForRounds(rounds, projects) {
  const projectIds = Array.from(new Set(rounds.flatMap(getRoundProjectIds)));
  const projectSlugs = Array.from(new Set(rounds.flatMap(getRoundProjectSlugs)));
  const loadedProjects = [];
  const seenProjectIds = new Set();

  for (const ids of chunkArray(projectIds, 1000)) {
    const batch = await projects
      .find(
        { _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } },
        { projection: PROJECT_PROJECTION },
      )
      .toArray();

    for (const project of batch) {
      const id = objectIdString(project?._id);
      if (seenProjectIds.has(id)) continue;
      seenProjectIds.add(id);
      loadedProjects.push(project);
    }
  }

  for (const slugs of chunkArray(projectSlugs, 1000)) {
    const batch = await projects
      .find(
        {
          $or: [
            { slug: { $in: slugs } },
            { sourceId: { $in: slugs } },
            { "rawIcoData.slug": { $in: slugs } },
            { "rawIcoData.sourceId": { $in: slugs } },
          ],
        },
        { projection: PROJECT_PROJECTION },
      )
      .toArray();

    for (const project of batch) {
      const id = objectIdString(project?._id);
      if (seenProjectIds.has(id)) continue;
      seenProjectIds.add(id);
      loadedProjects.push(project);
    }
  }

  const byId = new Map();
  const bySlug = new Map();

  for (const project of loadedProjects) {
    byId.set(objectIdString(project?._id), project);

    [
      project?.slug,
      project?.sourceId,
      project?.rawIcoData?.slug,
      project?.rawIcoData?.sourceId,
    ]
      .map(cleanString)
      .filter(Boolean)
      .forEach((slug) => {
        if (!bySlug.has(slug)) {
          bySlug.set(slug, project);
        }
      });
  }

  return (round) => {
    for (const id of getRoundProjectIds(round)) {
      const project = byId.get(id);
      if (project) return project;
    }

    for (const slug of getRoundProjectSlugs(round)) {
      const project = bySlug.get(slug);
      if (project) return project;
    }

    return null;
  };
}

function projectCacheKey(project) {
  return objectIdString(project?._id) || normalizeSlug(project?.slug || project?.name || "missing");
}

async function findProject(round, projects, cache) {
  const ids = getRoundProjectIds(round);

  for (const id of ids) {
    const cacheKey = `id:${id}`;
    if (!cache.has(cacheKey)) {
      cache.set(
        cacheKey,
        await projects.findOne(
          { _id: new mongoose.Types.ObjectId(id) },
          { projection: PROJECT_PROJECTION },
        ),
      );
    }

    const project = cache.get(cacheKey);
    if (project) return project;
  }

  const coinSlug = cleanString(round?.coinSlug);
  if (!coinSlug) return null;

  const slugCacheKey = `slug:${coinSlug}`;
  if (!cache.has(slugCacheKey)) {
    cache.set(
      slugCacheKey,
      await projects.findOne({
        $or: [
          { slug: coinSlug },
          { sourceId: coinSlug },
          { "rawIcoData.slug": coinSlug },
          { "rawIcoData.sourceId": coinSlug },
        ],
      }, { projection: PROJECT_PROJECTION }),
    );
  }

  return cache.get(slugCacheKey);
}

function createProjectBucket(project, round, ids) {
  return {
    projectId: objectIdString(project?._id),
    name: cleanString(project?.name || round?.projectName || round?.coinSlug || "Unknown Project"),
    slug: cleanString(project?.slug || project?.rawIcoData?.slug || round?.coinSlug),
    symbol: cleanString(project?.symbol || project?.rawIcoData?.symbol || project?.niche || round?.coinSymbol),
    tokenSymbol: tokenSymbolValues(project).join(", "),
    ticker: projectTickerValues(project).join(", "),
    providerIds: ids,
    rounds: [],
    signalKeys: new Set(),
    signalLabels: new Set(),
    recommendedAction: "ignore",
  };
}

function addSuspiciousRound(bucket, round, signals, action) {
  for (const signal of signals) {
    bucket.signalKeys.add(signal.key);
    bucket.signalLabels.add(signal.label);
  }

  bucket.rounds.push({
    id: objectIdString(round?._id),
    coinSlug: cleanString(round?.coinSlug),
    coinSymbol: cleanString(round?.coinSymbol),
    stageType: stageTypeText(round),
    date: round?.date,
  });

  if (actionPriority(action) < actionPriority(bucket.recommendedAction)) {
    bucket.recommendedAction = action;
  }
}

function actionPriority(action) {
  switch (action) {
    case "addProviderId":
      return 0;
    case "addVerifiedMapping":
      return 1;
    default:
      return 2;
  }
}

function markdownEscape(value) {
  return String(value ?? "")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, " ")
    .trim();
}

function formatProviderIds(ids) {
  const parts = [];
  if (ids.coingeckoId.length) parts.push(`coingeckoId=${ids.coingeckoId.join(",")}`);
  if (ids.coinmarketcapId.length) parts.push(`coinmarketcapId=${ids.coinmarketcapId.join(",")}`);
  return parts.length ? parts.join("; ") : "no";
}

function compactDate(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

function serializeBucket(bucket) {
  return {
    projectId: bucket.projectId,
    name: bucket.name,
    slug: bucket.slug,
    symbol: bucket.symbol,
    tokenSymbol: bucket.tokenSymbol,
    ticker: bucket.ticker,
    providerIds: bucket.providerIds,
    roundsCount: bucket.rounds.length,
    roundStages: uniqueValues(bucket.rounds.map((round) => round.stageType)).slice(0, 8),
    weakSignals: Array.from(bucket.signalLabels),
    weakSignalKeys: Array.from(bucket.signalKeys),
    recommendedAction: bucket.recommendedAction,
    rounds: bucket.rounds,
  };
}

function countByProject(buckets, fieldFn) {
  const counts = new Map();

  for (const bucket of buckets) {
    for (const value of fieldFn(bucket)) {
      counts.set(value, (counts.get(value) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([key, projects]) => ({ key, projects }))
    .sort((left, right) => right.projects - left.projects || left.key.localeCompare(right.key));
}

function buildMarkdown(report) {
  const lines = [
    "# Funding Round Token Coverage Audit",
    "",
    `Generated: ${report.generatedAt}`,
    "",
    "Mode: audit-only. This script does not write to MongoDB.",
    "",
    "## Summary",
    "",
    `- scanned rounds: ${report.summary.scannedRounds}`,
    `- hasToken=false rounds: ${report.summary.tokenNoRounds}`,
    `- suspiciousTokenNo: ${report.summary.suspiciousTokenNoProjects} projects (${report.summary.suspiciousTokenNoRounds} rounds)`,
    `- missing linked project: ${report.summary.missingProject}`,
    `- scan query: \`${report.summary.scanQuery}\``,
    "",
    "## Recommended Actions",
    "",
    "| action | projects | rounds |",
    "|---|---:|---:|",
    ...report.recommendedActions.map((item) => `| ${markdownEscape(item.action)} | ${item.projects} | ${item.rounds} |`),
    "",
    "## Weak Signals",
    "",
    "| weak signal | projects |",
    "|---|---:|",
    ...report.weakSignals.map((item) => `| ${markdownEscape(item.key)} | ${item.projects} |`),
    "",
    "## Provider ID Presence",
    "",
    `- suspicious projects with provider ids in project/rawIcoData/tokenMetrics: ${report.summary.suspiciousProjectsWithProviderIds}`,
    `- suspicious projects without provider ids: ${report.summary.suspiciousProjectsWithoutProviderIds}`,
    "",
    "## Top 100 Examples",
    "",
    "| # | project | slug | symbol | tokenSymbol | ticker | rounds | round stage/type | weak signals | provider ids | recommended action |",
    "|---:|---|---|---|---|---|---:|---|---|---|---|",
  ];

  report.examples.forEach((item, index) => {
    lines.push(
      [
        index + 1,
        markdownEscape(item.name),
        markdownEscape(item.slug),
        markdownEscape(item.symbol),
        markdownEscape(item.tokenSymbol || "-"),
        markdownEscape(item.ticker || "-"),
        item.roundsCount,
        markdownEscape(item.roundStages.join("; ") || "-"),
        markdownEscape(item.weakSignals.join("; ")),
        markdownEscape(formatProviderIds(item.providerIds)),
        markdownEscape(item.recommendedAction),
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"),
    );
  });

  lines.push(
    "",
    "## Notes",
    "",
    "- `addProviderId`: research/add CoinGecko or CoinMarketCap id where a listed token likely exists.",
    "- `addVerifiedMapping`: candidate for a temporary verified slug mapping if no provider id exists yet.",
    "- `ignore`: weak evidence only; keep strict `hasToken=false` unless stronger proof is found.",
  );

  return `${lines.join("\n")}\n`;
}

function buildReport({ buckets, summary, options }) {
  const serialized = buckets.map(serializeBucket);
  const actionCounts = new Map();

  for (const bucket of buckets) {
    const action = bucket.recommendedAction;
    const current = actionCounts.get(action) || { action, projects: 0, rounds: 0 };
    current.projects += 1;
    current.rounds += bucket.rounds.length;
    actionCounts.set(action, current);
  }

  const examples = serialized
    .sort((left, right) => {
      const actionDiff = actionPriority(left.recommendedAction) - actionPriority(right.recommendedAction);
      if (actionDiff !== 0) return actionDiff;

      const signalDiff = right.weakSignals.length - left.weakSignals.length;
      if (signalDiff !== 0) return signalDiff;

      const roundsDiff = right.roundsCount - left.roundsCount;
      if (roundsDiff !== 0) return roundsDiff;

      return left.name.localeCompare(right.name);
    })
    .slice(0, options.exampleLimit);

  const suspiciousProjectsWithProviderIds = buckets.filter((bucket) => bucket.providerIds.hasAny).length;
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      ...summary,
      suspiciousTokenNoProjects: buckets.length,
      suspiciousTokenNoRounds: buckets.reduce((sum, bucket) => sum + bucket.rounds.length, 0),
      suspiciousProjectsWithProviderIds,
      suspiciousProjectsWithoutProviderIds: buckets.length - suspiciousProjectsWithProviderIds,
    },
    recommendedActions: Array.from(actionCounts.values()).sort(
      (left, right) => actionPriority(left.action) - actionPriority(right.action),
    ),
    weakSignals: countByProject(buckets, (bucket) => Array.from(bucket.signalKeys)),
    examples,
    allSuspiciousProjects: serialized,
  };

  return report;
}

function ensureParentDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

async function main() {
  if (process.argv.includes("--help")) {
    console.log(usage());
    return;
  }

  const options = {
    limit: positiveInt(readArg("--limit"), 0),
    skip: positiveInt(readArg("--skip"), 0),
    exampleLimit: positiveInt(readArg("--examples"), 100),
    markdownPath: path.resolve(readArg("--markdown") || DEFAULT_MARKDOWN_PATH),
    jsonPath: path.resolve(readArg("--json") || DEFAULT_JSON_PATH),
    writeJson: !process.argv.includes("--no-json"),
    includeMissing: process.argv.includes("--include-missing"),
  };
  const scanQuery = options.includeMissing
    ? { $or: [{ hasToken: false }, { hasToken: { $exists: false } }] }
    : { hasToken: false };

  await mongoose.connect(mongoUri());

  const db = mongoose.connection.db;
  const rounds = db.collection("fundingrounds");
  const projects = db.collection("projects");
  const bucketsByProject = new Map();
  const cursor = rounds
    .find(scanQuery)
    .project({
      projectId: 1,
      projectLinks: 1,
      projectName: 1,
      coinSlug: 1,
      coinSymbol: 1,
      stage: 1,
      type: 1,
      round: 1,
      roundType: 1,
      distributionType: 1,
      date: 1,
      hasToken: 1,
    })
    .skip(options.skip)
    .sort({ date: -1, _id: 1 });

  if (options.limit > 0) {
    cursor.limit(options.limit);
  }
  const fundingRounds = await cursor.toArray();
  const resolveProject = await loadProjectsForRounds(fundingRounds, projects);

  const summary = {
    scanQuery: JSON.stringify(scanQuery),
    limit: options.limit || "all",
    skip: options.skip,
    scannedRounds: 0,
    tokenNoRounds: 0,
    suspiciousRounds: 0,
    missingProject: 0,
  };

  for (const round of fundingRounds) {
    const project = resolveProject(round);

    summary.scannedRounds += 1;
    summary.tokenNoRounds += 1;

    if (!project) {
      summary.missingProject += 1;
      continue;
    }

    const signals = weakSignals(project, round);
    if (!signals.length) continue;

    summary.suspiciousRounds += 1;

    const ids = providerIds(project);
    const action = recommendedAction(signals, ids);
    const bucketKey = projectCacheKey(project);
    let bucket = bucketsByProject.get(bucketKey);

    if (!bucket) {
      bucket = createProjectBucket(project, round, ids);
      bucketsByProject.set(bucketKey, bucket);
    }

    addSuspiciousRound(bucket, round, signals, action);
  }

  const report = buildReport({
    buckets: Array.from(bucketsByProject.values()),
    summary,
    options,
  });
  const markdown = buildMarkdown(report);

  ensureParentDir(options.markdownPath);
  fs.writeFileSync(options.markdownPath, markdown, "utf8");

  if (options.writeJson) {
    ensureParentDir(options.jsonPath);
    fs.writeFileSync(options.jsonPath, JSON.stringify(report, null, 2), "utf8");
  }

  console.log(`Funding round token coverage audit written: ${options.markdownPath}`);
  if (options.writeJson) {
    console.log(`JSON audit written: ${options.jsonPath}`);
  }
  console.log(
    JSON.stringify(
      {
        suspiciousTokenNoProjects: report.summary.suspiciousTokenNoProjects,
        suspiciousTokenNoRounds: report.summary.suspiciousTokenNoRounds,
        scannedRounds: report.summary.scannedRounds,
        missingProject: report.summary.missingProject,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
