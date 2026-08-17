try {
  require("dotenv").config();
} catch (_) {
  // Production environments usually provide DB_URL directly.
}

require("ts-node/register/transpile-only");
require("tsconfig-paths/register");

const mongoose = require("mongoose"); 
const { hasFundingRoundToken } = require("../src/funding-rounds/funding-round-token.util");

mongoose.set("strictQuery", false);

function readArg(name) {
  const withEquals = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (withEquals) return withEquals.slice(name.length + 1);

  const index = process.argv.indexOf(name);
  if (index >= 0) return process.argv[index + 1];

  return undefined;
}Е

function positiveInt(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const isWriteMode = process.argv.includes("--write");
const isDryRun = process.argv.includes("--dry-run") || !isWriteMode;
const batchSize = positiveInt(
  readArg("--batch-size") || process.env.FUNDING_ROUND_TOKEN_BACKFILL_BATCH_SIZE,
  1000,E
);
const scanLimit = positiveInt(
  readArg("--limit") || process.env.FUNDING_ROUND_TOKEN_BACKFILL_LIMIT,
  0,
);
const scanSkip = positiveInt(
  readArg("--skip") || process.env.FUNDING_ROUND_TOKEN_BACKFILL_SKIP,
  0,
);

const ROUND_PROJECTION = {
  projectId: 1,
  "projectLinks.projectId": 1,
  coinSlug: 1,
  stage: 1,
  type: 1,
  hasToken: 1,
};

const PROJECT_PROJECTION = {
  name: 1,
  slug: 1,
  sourceId: 1,
  projectType: 1,
  coingeckoId: 1,
  coinmarketcapId: 1,
  coinMarketCapId: 1,
  "rawIcoData.slug": 1,
  "rawIcoData.sourceId": 1,
  "rawIcoData.coingeckoId": 1,
  "rawIcoData.coinmarketcapId": 1,
  "rawIcoData.coinMarketCapId": 1,
  "tokenMetrics.coingeckoId": 1,
  "tokenMetrics.coinmarketcapId": 1,
  "tokenMetrics.coinMarketCapId": 1,
};

function objectIdString(value) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toHexString === "function") return value.toHexString();
  if (value._id && value._id !== value) return objectIdString(value._id);
  if (typeof value.toString === "function") return value.toString();
  return "";
}

function getRoundProjectIds(round) {
  return Array.from(
    new Set(
      [
        objectIdString(round.projectId),
        ...(Array.isArray(round.projectLinks)
          ? round.projectLinks.map((link) => objectIdString(link && link.projectId))
          : []),
      ].filter((id) => mongoose.Types.ObjectId.isValid(id)),
    ),
  );
}

function slugCacheKey(value) {
  const slug = String(value || "").trim();
  return slug ? `slug:${slug}` : "";
}

function getCachedProjectById(projectId, cache) {
  const id = objectIdString(projectId);
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  return cache.get(id) || null;
}

function isMarketProject(project) {
  return String(project?.projectType || "").trim().toLowerCase() === "market";
}

function getCachedProjectByLinkedIds(round, cache) {
  for (const id of getRoundProjectIds(round)) {
    const project = cache.get(id);
    if (project) return project;
  }

  return null;
}

function getCachedProject(round, cache) {
  const linkedProject = getCachedProjectByLinkedIds(round, cache);
  if (linkedProject) return linkedProject;

  const key = slugCacheKey(round.coinSlug);
  return key ? cache.get(key) || null : null;
}

function projectSlugValues(project) {
  return [
    project?.slug,
    project?.sourceId,
    project?.rawIcoData?.slug,
    project?.rawIcoData?.sourceId,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

async function cacheProjectsByIds(projects, cache, ids) {
  const missingIds = Array.from(new Set(ids))
    .map(objectIdString)
    .filter((id) => mongoose.Types.ObjectId.isValid(id) && !cache.has(id));

  if (!missingIds.length) return;

  const docs = await projects
    .find(
      { _id: { $in: missingIds.map((id) => new mongoose.Types.ObjectId(id)) } },
      { projection: PROJECT_PROJECTION },
    )
    .toArray();

  for (const project of docs) {
    cache.set(objectIdString(project._id), project);
  }

  for (const id of missingIds) {
    if (!cache.has(id)) cache.set(id, null);
  }
}

async function cacheProjectsBySlugs(projects, cache, slugs) {
  const missingSlugs = Array.from(
    new Set(slugs.map((slug) => String(slug || "").trim()).filter(Boolean)),
  ).filter((slug) => !cache.has(slugCacheKey(slug)));

  if (!missingSlugs.length) return;

  const missingSlugSet = new Set(missingSlugs);
  const docs = await projects
    .find(
      {
        $or: [
          { slug: { $in: missingSlugs } },
          { sourceId: { $in: missingSlugs } },
          { "rawIcoData.slug": { $in: missingSlugs } },
          { "rawIcoData.sourceId": { $in: missingSlugs } },
        ],
      },
      { projection: PROJECT_PROJECTION },
    )
    .toArray();

  for (const project of docs) {
    for (const slug of projectSlugValues(project)) {
      if (!missingSlugSet.has(slug)) continue;

      const key = slugCacheKey(slug);
      if (!cache.has(key)) cache.set(key, project);
    }
  }

  for (const slug of missingSlugs) {
    const key = slugCacheKey(slug);
    if (!cache.has(key)) cache.set(key, null);
  }
}

async function hydrateProjectCacheForBatch(roundBatch, projects, cache) {
  const projectIds = [];

  for (const round of roundBatch) {
    projectIds.push(...getRoundProjectIds(round));
  }

  await cacheProjectsByIds(projects, cache, projectIds);

  const unresolvedSlugs = [];
  for (const round of roundBatch) {
    if (getCachedProjectByLinkedIds(round, cache)) continue;

    const coinSlug = String(round.coinSlug || "").trim();
    if (coinSlug) unresolvedSlugs.push(coinSlug);
  }

  await cacheProjectsBySlugs(projects, cache, unresolvedSlugs);
}

async function flushBulk(collection, operations, summary) {
  if (!operations.length) return;

  const result = await collection.bulkWrite(operations, { ordered: false });
  summary.updated += result.modifiedCount + result.upsertedCount;
  operations.length = 0;
}

async function processRoundBatch(roundBatch, projects, rounds, projectCache, operations, summary) {
  if (!roundBatch.length) return;

  await hydrateProjectCacheForBatch(roundBatch, projects, projectCache);
  summary.batches += 1;

  for (const round of roundBatch) {
    const directProject = getCachedProjectById(round.projectId, projectCache);
    const project = directProject || getCachedProject(round, projectCache);
    const hasToken = isMarketProject(directProject) || hasFundingRoundToken(project, {
      ...round,
      type: round.stage || round.type,
    });

    summary.scanned += 1;
    if (hasToken) summary.tokenYes += 1;
    else summary.tokenNo += 1;
    if (!project) summary.missingProject += 1;

    if (round.hasToken === hasToken) {
      continue;
    }

    summary.wouldChange += 1;

    if (summary.examplesLogged < 10) {
      console.log(
        [
          `round=${round._id}`,
          `project=${project ? project.name || project.slug || project._id : "missing"}`,
          `coinSlug=${round.coinSlug || ""}`,
          `stage=${round.stage || ""}`,
          `hasToken=${hasToken ? "yes" : "no"}`,
        ].join(" | "),
      );
      summary.examplesLogged += 1;
    }

    if (isDryRun) {
      continue;
    }

    operations.push({
      updateOne: {
        filter: { _id: round._id },
        update: {
          $set: {
            hasToken,
            tokenStatusUpdatedAt: new Date(),
          },
        },
      },
    });

    if (operations.length >= batchSize) {
      await flushBulk(rounds, operations, summary);
    }
  }
}

async function run() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    throw new Error("DB_URL is required");
  }

  await mongoose.connect(`${dbUrl}/fomoland?authSource=admin`);

  const db = mongoose.connection.db;
  const rounds = db.collection("fundingrounds");
  const projects = db.collection("projects");
  const projectCache = new Map();
  const cursor = rounds
    .find({}, { projection: ROUND_PROJECTION })
    .skip(scanSkip)
    .batchSize(batchSize);
  if (scanLimit > 0) {
    cursor.limit(scanLimit);
  }
  const operations = [];
  const summary = {
    mode: isDryRun ? "dry-run" : "write",
    limit: scanLimit || "all",
    skip: scanSkip,
    batchSize,
    batches: 0,
    scanned: 0,
    wouldChange: 0,
    updated: 0,
    tokenYes: 0,
    tokenNo: 0,
    missingProject: 0,
    examplesLogged: 0,
  };

  let roundBatch = [];
  for await (const round of cursor) {
    roundBatch.push(round);

    if (roundBatch.length >= batchSize) {
      await processRoundBatch(roundBatch, projects, rounds, projectCache, operations, summary);
      roundBatch = [];
    }
  }

  if (roundBatch.length) {
    await processRoundBatch(roundBatch, projects, rounds, projectCache, operations, summary);
  }

  if (!isDryRun) {
    await flushBulk(rounds, operations, summary);
  }

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
