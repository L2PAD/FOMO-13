try {
  require("dotenv").config();
} catch (_) {
  // dotenv is optional; production environments usually provide DB_URL directly.
}

require("ts-node/register");
require("tsconfig-paths/register");

const mongoose = require("mongoose");
const { PersonsRatingService } = require("../src/persons/persons-rating.service");

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
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback;
}

const isWriteMode = process.argv.includes("--write");
const isDryRun = process.argv.includes("--dry-run") || !isWriteMode;
const batchSize = positiveNumber(
  getArgValue("batch-size") || process.env.RECALC_PERSONS_RATING_BATCH_SIZE,
  200,
);
const limit = Math.max(Number(getArgValue("limit") || 0) || 0, 0);
const progressEvery = positiveNumber(
  getArgValue("progress-every") || process.env.RECALC_PERSONS_RATING_PROGRESS_EVERY,
  batchSize,
);
const projectStatus = getArgValue("project-status");
const status = getArgValue("status");
const collectionName = getArgValue("collection") || "people";
const skipIndexes = process.argv.includes("--skip-indexes");
const ensureIndexesRequested = process.argv.includes("--ensure-indexes");

const personProjection = {
  name: 1,
  slug: 1,
  source: 1,
  sourceKey: 1,
  logo: 1,
  banner: 1,
  bio: 1,
  description: 1,
  descriptionText: 1,
  websiteUrl: 1,
  twitterUrl: 1,
  linkedinUrl: 1,
  crunchbaseUrl: 1,
  website: 1,
  socialmedia: 1,
  links: 1,
  country: 1,
  regionData: 1,
  type: 1,
  niche: 1,
  tier: 1,
  categories: 1,
  tags: 1,
  participated: 1,
  portfolioCoins: 1,
  investmentPorfolio: 1,
  investmentPortfolio: 1,
  projects: 1,
  totalInvestments: 1,
  numberOfInvestments: 1,
  portfolioCoinsCount: 1,
  projectsCount: 1,
  supportedProjectsCount: 1,
  leadInvestments: 1,
  publicSalesCount: 1,
  saleIds: 1,
  roi: 1,
  averageRoi: 1,
  athRoi: 1,
  highestRoi: 1,
  privateRoiPercent: 1,
  retailRoiPercent: 1,
  totalInvested: 1,
  twitterScore: 1,
  lastRoundDate: 1,
  lastFunding: 1,
  createdAt: 1,
  redFlags: 1,
  redFlagsList: 1,
  greenFlagsList: 1,
  redStatus: 1,
  status: 1,
  projectStatus: 1,
  educationBlock: 1,
  experienceBlock: 1,
  contributionsBlock: 1,
  networkBlock: 1,
  influenceBlock: 1,
  achievementsBlock: 1,
  colleagues: 1,
  coInvestors: 1,
  likes: 1,
  dislikes: 1,
  intelInvestorData: 1,
  investorSnapshot: 1,
  syncedInvestorAt: 1,
  syncedInvestorSource: 1,
  dropstabId: 1,
};

function normalizeName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function findInvestorSnapshot(investors, person) {
  const or = [];
  if (person.slug) or.push({ slug: person.slug });
  if (person.sourceKey) {
    or.push({ "sourceRefs.key": person.sourceKey }, { sourceId: person.sourceKey });
  }
  if (person.dropstabId) {
    or.push({ sourceId: String(person.dropstabId) }, { sourceId: Number(person.dropstabId) });
  }
  if (person.name) {
    or.push({ normalizedName: normalizeName(person.name) }, { name: person.name });
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
    },
  );
}

function buildMergedPerson(person, investorSnapshot) {
  if (!investorSnapshot) return person;

  return {
    ...person,
    investorSnapshot,
    bio: person.bio || investorSnapshot.description,
    description: person.description || investorSnapshot.description,
    websiteUrl: person.websiteUrl || investorSnapshot.website || investorSnapshot.socialLinks?.website,
    twitterUrl: person.twitterUrl || investorSnapshot.socialLinks?.twitter,
    linkedinUrl: person.linkedinUrl || investorSnapshot.socialLinks?.linkedin,
    crunchbaseUrl: person.crunchbaseUrl || investorSnapshot.socialLinks?.crunchbase,
    categories: person.categories?.length ? person.categories : investorSnapshot.tags || investorSnapshot.sectors,
    portfolioCoins: person.portfolioCoins?.length ? person.portfolioCoins : investorSnapshot.portfolio,
    coInvestors: person.coInvestors?.length ? person.coInvestors : investorSnapshot.coInvestors,
    totalInvestments:
      person.totalInvestments ||
      investorSnapshot.stats?.totalInvestments ||
      investorSnapshot.portfolio?.length ||
      investorSnapshot.fundraisingRounds?.length,
    portfolioCoinsCount:
      person.portfolioCoinsCount ||
      investorSnapshot.stats?.portfolioProjects ||
      investorSnapshot.portfolio?.length,
    leadInvestments: person.leadInvestments || investorSnapshot.stats?.leadInvestments,
    publicSalesCount: person.publicSalesCount || investorSnapshot.stats?.publicSalesCount,
    twitterScore: person.twitterScore || investorSnapshot.stats?.twitterScore,
    averageRoi:
      person.averageRoi ||
      investorSnapshot.stats?.avgPublicRoi ||
      investorSnapshot.stats?.avgPrivateRoi,
    roi:
      person.roi ||
      investorSnapshot.stats?.avgPublicRoi ||
      investorSnapshot.stats?.avgPrivateRoi,
    lastRoundDate: person.lastRoundDate || investorSnapshot.lastDetailParsedAt,
  };
}

async function flushBulk(collection, operations, summary) {
  if (!operations.length) return;

  const result = await collection.bulkWrite(operations, { ordered: false });
  summary.updated += result.modifiedCount + result.upsertedCount;
  operations.length = 0;
}

async function ensureIndexes(persons, investors) {
  if (skipIndexes || !ensureIndexesRequested) {
    console.log("Skipping index ensure. Pass --ensure-indexes to create/check indexes.");
    return;
  }

  console.log("Ensuring persons/investors indexes...");
  const results = await Promise.allSettled([
    persons.createIndex({ projectStatus: 1, tableRating: -1, tableSupportedProjectsCount: -1, name: 1 }, { background: true }),
    persons.createIndex({ projectStatus: 1, tableFullness: -1, tableRating: -1, name: 1 }, { background: true }),
    persons.createIndex({ projectStatus: 1, tableRoi: -1, tableRating: -1, name: 1 }, { background: true }),
    persons.createIndex({ projectStatus: 1, tableLastUpdatedAt: -1, tableRating: -1, name: 1 }, { background: true }),
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
        .join("; ")}`,
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
    ].join(" | "),
  );
}

async function run() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    throw new Error("DB_URL is required");
  }

  await mongoose.connect(`${dbUrl}/fomoland?authSource=admin`);

  const ratingService = new PersonsRatingService();
  const persons = mongoose.connection.db.collection(collectionName);
  const investors = mongoose.connection.db.collection("investors");
  await ensureIndexes(persons, investors);

  const personQuery = {};
  if (projectStatus) personQuery.projectStatus = projectStatus;
  if (status) personQuery.status = status;

  const cursor = persons
    .find(personQuery, {
      projection: personProjection,
      noCursorTimeout: true,
    })
    .batchSize(batchSize);
  const operations = [];
  const summary = {
    mode: isDryRun ? "dry-run" : "write",
    collection: collectionName,
    scanned: 0,
    updated: 0,
    errors: 0,
    examplesLogged: 0,
  };
  const startedAt = Date.now();

  console.log(
    [
      "Starting persons rating recalculation",
      `mode=${summary.mode}`,
      `collection=${collectionName}`,
      `query=${JSON.stringify(personQuery)}`,
      `batchSize=${batchSize}`,
      `limit=${limit || "all"}`,
      `progressEvery=${progressEvery}`,
    ].join(" | "),
  );

  while (await cursor.hasNext()) {
    if (limit && summary.scanned >= limit) break;

    const person = await cursor.next();
    summary.scanned += 1;

    try {
      const investorSnapshot = await findInvestorSnapshot(investors, person);
      const mergedPerson = buildMergedPerson(person, investorSnapshot);
      const scores = ratingService.calculatePersonScores(mergedPerson);
      const projectsCount = ratingService.getProjectsCount(mergedPerson);
      const roi = ratingService.getRoi(mergedPerson);
      const tableSupportedProjectsCount = Math.max(
        projectsCount,
        Number(mergedPerson.portfolioCoinsCount) || 0,
      );

      if (summary.examplesLogged < 10) {
        console.log(
          [
            `person=${person.name || person.slug || person._id}`,
            `rating=${scores.rating}`,
            `fullness=${scores.fullness}`,
            `projectsCount=${projectsCount}`,
          ].join(" | "),
        );
        summary.examplesLogged += 1;
      }

      if (!isDryRun) {
        operations.push({
          updateOne: {
            filter: { _id: person._id },
            update: {
              $set: {
                rating: String(scores.rating),
                fomoScore: scores.rating,
                fullness: `${scores.fullness}%`,
                tableRating: scores.rating,
                tableFullness: scores.fullness,
                tableRoi: roi,
                tableProjectsCount: projectsCount,
                tableSupportedProjectsCount,
                tableCountry: mergedPerson.country || mergedPerson.regionData?.properties?.name || "",
                tableLastUpdatedAt: new Date(),
                ratingBreakdown: scores.ratingBreakdown,
                fullnessBreakdown: scores.fullnessBreakdown,
                lastRatingCalculatedAt: scores.ratingBreakdown.calculatedAt,
                projectsCount,
                supportedProjectsCount: tableSupportedProjectsCount,
                ...(investorSnapshot ? { investorSnapshot } : {}),
              },
            },
          },
        });

        if (operations.length >= batchSize) {
          await flushBulk(persons, operations, summary);
        }
      }
    } catch (error) {
      summary.errors += 1;
      console.error(
        `Failed to calculate person rating for ${person?.name || person?._id}:`,
        error.message,
      );
    }

    if (summary.scanned % progressEvery === 0) {
      logProgress(summary, startedAt);
    }
  }

  if (!isDryRun) {
    await flushBulk(persons, operations, summary);
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
