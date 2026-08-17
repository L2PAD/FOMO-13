try {
  require("dotenv").config();
} catch (_) {
  // dotenv is optional; production environments usually provide DB_URL directly.
}

require("ts-node/register");
require("tsconfig-paths/register");

const mongoose = require("mongoose");
const { FundsRatingService } = require("../src/funds/funds-rating.service");
const {
  loadRatingFormulaRuntimeFromMongo,
} = require("../src/rating/rating-formula.runtime");

mongoose.set("strictQuery", false);

function getArgValue(name) {
  const flag = `--${name}`;
  const inlineArg = process.argv.find((arg) => arg.startsWith(`${flag}=`));
  if (inlineArg) return inlineArg.slice(flag.length + 1);

  const flagIndex = process.argv.indexOf(flag);
  if (flagIndex >= 0) return process.argv[flagIndex + 1] || "";

  return "";
}

function positiveNumber(value, fallback) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0
    ? numberValue
    : fallback;
}

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,%\s]/g, "").replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

const isWriteMode = process.argv.includes("--write");
const isDryRun = process.argv.includes("--dry-run") || !isWriteMode;
const batchSize = positiveNumber(
  getArgValue("batch-size") || process.env.RECALC_FUNDS_RATING_BATCH_SIZE,
  200
);
const limit = Math.max(Number(getArgValue("limit") || 0) || 0, 0);
const progressEvery = positiveNumber(
  getArgValue("progress-every") ||
    process.env.RECALC_FUNDS_RATING_PROGRESS_EVERY,
  batchSize
);
const status = getArgValue("status");
const skipIndexes = process.argv.includes("--skip-indexes");
const ensureIndexesRequested = process.argv.includes("--ensure-indexes");

const fundProjection = {
  coInvestors: 1,
  portfolioCoins: 1,
  roundsByCategory: 1,
  roundsByStage: 1,
  intelInvestorData: 1,
  name: 1,
  slug: 1,
  sourceKey: 1,
  source: 1,
  logo: 1,
  bio: 1,
  description: 1,
  websiteUrl: 1,
  twitterUrl: 1,
  linkedinUrl: 1,
  socialmedia: 1,
  country: 1,
  regionData: 1,
  type: 1,
  niche: 1,
  categories: 1,
  projects: 1,
  projectsCount: 1,
  supportedProjectsCount: 1,
  totalInvestments: 1,
  numberOfInvestments: 1,
  portfolioCoinsCount: 1,
  binanceListing: 1,
  roi: 1,
  averageRoi: 1,
  privateRoiPercent: 1,
  retailRoiPercent: 1,
  leadInvestments: 1,
  publicSalesCount: 1,
  twitterScore: 1,
  lastRoundDate: 1,
  lastFunding: 1,
  redFlags: 1,
  redFlagsList: 1,
  redStatus: 1,
  status: 1,
};

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function findInvestorDetail(investors, fund) {
  const or = [];
  if (fund.slug) or.push({ slug: fund.slug });
  if (fund.sourceKey) {
    or.push({ "sourceRefs.key": fund.sourceKey }, { sourceId: fund.sourceKey });
  }
  if (fund.name) {
    or.push({ normalizedName: normalizeName(fund.name) }, { name: fund.name });
  }
  if (!or.length) return null;

  return investors.findOne(
    { $or: or },
    {
      sort: { lastDetailParsedAt: -1, lastSyncedAt: -1 },
      projection: {
        raw: 0,
        rawDetailData: 0,
        rawTableData: 0,
      },
    }
  );
}

async function flushBulk(collection, operations, summary) {
  if (!operations.length) return;

  const result = await collection.bulkWrite(operations, { ordered: false });
  summary.updated += result.modifiedCount + result.upsertedCount;
  operations.length = 0;
}

async function ensureIndexes(funds, investors) {
  if (skipIndexes || !ensureIndexesRequested) {
    console.log(
      "Skipping index ensure. Pass --ensure-indexes to create/check indexes."
    );
    return;
  }

  console.log("Ensuring funds/investors indexes...");
  const results = await Promise.allSettled([
    funds.createIndex(
      { status: 1, rating: -1, projectsCount: -1, name: 1 },
      { background: true }
    ),
    funds.createIndex(
      { status: 1, projectsCount: -1, rating: -1, name: 1 },
      { background: true }
    ),
    funds.createIndex(
      { status: 1, tableRating: -1, tableProjectsCount: -1, name: 1 },
      { background: true }
    ),
    funds.createIndex(
      { status: 1, tableProjectsCount: -1, tableRating: -1, name: 1 },
      { background: true }
    ),
    funds.createIndex(
      { status: 1, tableRoi: -1, tableRating: -1, name: 1 },
      { background: true }
    ),
    funds.createIndex(
      { status: 1, tableFullness: -1, tableRating: -1, name: 1 },
      { background: true }
    ),
    investors.createIndex({ slug: 1 }, { background: true }),
    investors.createIndex({ sourceId: 1 }, { background: true }),
    investors.createIndex({ "sourceRefs.key": 1 }, { background: true }),
    investors.createIndex({ normalizedName: 1 }, { background: true }),
    investors.createIndex({ name: 1 }, { background: true }),
  ]);
  const failed = results.filter((result) => result.status === "rejected");

  if (failed.length) {
    console.warn(
      `Index check finished with ${failed.length} warning(s): ${failed
        .map((result) => result.reason?.message || result.reason)
        .join("; ")}`
    );
  } else {
    console.log("Indexes are ready.");
  }
}

function logProgress(summary, startedAt) {
  const elapsedSeconds = Math.max((Date.now() - startedAt) / 1000, 0.001);
  const rate = Math.round((summary.scanned / elapsedSeconds) * 10) / 10;
  console.log(
    [
      `progress scanned=${summary.scanned}`,
      `updated=${summary.updated}`,
      `errors=${summary.errors}`,
      `rate=${rate}/s`,
    ].join(" | ")
  );
}

async function run() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    throw new Error("DB_URL is required");
  }

  await mongoose.connect(`${dbUrl}/fomoland?authSource=admin`);
  await loadRatingFormulaRuntimeFromMongo(mongoose.connection.db);

  const ratingService = new FundsRatingService();
  const funds = mongoose.connection.db.collection("funds");
  const investors = mongoose.connection.db.collection("investors");
  await ensureIndexes(funds, investors);

  const fundQuery = status ? { status } : {};
  const cursor = funds
    .find(fundQuery, {
      projection: fundProjection,
      noCursorTimeout: true,
    })
    .batchSize(batchSize);
  const operations = [];
  const summary = {
    mode: isDryRun ? "dry-run" : "write",
    scanned: 0,
    updated: 0,
    errors: 0,
    examplesLogged: 0,
  };
  const startedAt = Date.now();

  console.log(
    [
      "Starting funds rating recalculation",
      `mode=${summary.mode}`,
      `query=${JSON.stringify(fundQuery)}`,
      `batchSize=${batchSize}`,
      `limit=${limit || "all"}`,
      `progressEvery=${progressEvery}`,
    ].join(" | ")
  );

  while (await cursor.hasNext()) {
    if (limit && summary.scanned >= limit) break;

    const fund = await cursor.next();
    summary.scanned += 1;

    try {
      const investorDetail = await findInvestorDetail(investors, fund);
      const scores = ratingService.calculateBackerScores(fund, investorDetail);
      const projectsCount = ratingService.getProjectsCount(
        fund,
        investorDetail
      );
      const roi =
        toNumber(fund.roi) ||
        toNumber(fund.averageRoi) ||
        toNumber(fund.retailRoiPercent) ||
        toNumber(fund.privateRoiPercent) ||
        toNumber(investorDetail?.stats?.avgPublicRoi) ||
        toNumber(investorDetail?.stats?.avgPrivateRoi);

      if (summary.examplesLogged < 10) {
        console.log(
          [
            `fund=${fund.name || fund.slug || fund._id}`,
            `rating=${scores.rating}`,
            `fullness=${scores.fullness}`,
            `projectsCount=${projectsCount}`,
          ].join(" | ")
        );
        summary.examplesLogged += 1;
      }

      if (!isDryRun) {
        operations.push({
          updateOne: {
            filter: { _id: fund._id },
            update: {
              $set: {
                rating: scores.rating,
                fomoScore: scores.rating,
                fullness: scores.fullness,
                tableRating: scores.rating,
                tableFullness: scores.fullness,
                tableRoi: roi,
                tableProjectsCount: projectsCount,
                tableSupportedProjectsCount: projectsCount,
                tableCountry:
                  fund.country || fund.regionData?.properties?.name || "",
                tableLastUpdatedAt: new Date(),
                ratingBreakdown: scores.ratingBreakdown,
                fullnessBreakdown: scores.fullnessBreakdown,
                lastRatingCalculatedAt: scores.ratingBreakdown.calculatedAt,
                projectsCount,
                supportedProjectsCount: projectsCount,
              },
            },
          },
        });

        if (operations.length >= batchSize) {
          await flushBulk(funds, operations, summary);
        }
      }
    } catch (error) {
      summary.errors += 1;
      console.error(
        `Failed to calculate fund rating for ${fund?.name || fund?._id}:`,
        error.message
      );
    }

    if (summary.scanned % progressEvery === 0) {
      logProgress(summary, startedAt);
    }
  }

  if (!isDryRun) {
    await flushBulk(funds, operations, summary);
  }

  logProgress(summary, startedAt);
  console.log(JSON.stringify(summary, null, 2));
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
