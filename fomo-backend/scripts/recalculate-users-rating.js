try {
  require("dotenv").config();
} catch (_) {
  // dotenv is optional; production environments usually provide DB_URL directly.
}

require("ts-node/register");
require("tsconfig-paths/register");

const mongoose = require("mongoose");
const { RatingService } = require("../src/rating/rating.service");
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

function splitMongoUri(dbUrl) {
  const queryIndex = dbUrl.indexOf("?");

  if (queryIndex < 0) {
    return { base: dbUrl, query: "" };
  }

  return {
    base: dbUrl.slice(0, queryIndex),
    query: dbUrl.slice(queryIndex),
  };
}

function getMongoDatabaseName(dbUrl) {
  const { base } = splitMongoUri(dbUrl);
  const protocolIndex = base.indexOf("://");
  const pathStart = base.indexOf(
    "/",
    protocolIndex >= 0 ? protocolIndex + 3 : 0
  );

  if (pathStart < 0) return "";

  return base.slice(pathStart + 1).replace(/\/+$/, "");
}

function buildMongoUri(dbUrl, databaseName) {
  const { base, query } = splitMongoUri(dbUrl);
  const protocolIndex = base.indexOf("://");
  const pathStart = base.indexOf(
    "/",
    protocolIndex >= 0 ? protocolIndex + 3 : 0
  );
  const currentDatabaseName = getMongoDatabaseName(dbUrl);
  const resolvedDatabaseName =
    databaseName || currentDatabaseName || "fomoland";

  if (!databaseName && currentDatabaseName) {
    return dbUrl;
  }

  const hostPart =
    pathStart >= 0 ? base.slice(0, pathStart) : base.replace(/\/+$/, "");
  return `${hostPart}/${resolvedDatabaseName}${query}`;
}

async function flushBulk(collection, operations, summary) {
  if (!operations.length) return;

  const result = await collection.bulkWrite(operations, { ordered: false });
  summary.updated += result.modifiedCount + result.upsertedCount;
  operations.length = 0;
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

function buildUserQuery() {
  if (process.argv.includes("--all")) return {};

  const query = {
    role: "user",
  };

  if (!process.argv.includes("--include-inactive")) {
    query.isCodeActivated = true;
  }

  return query;
}

async function run() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    throw new Error("DB_URL is required");
  }
  const databaseName = getArgValue("db") || process.env.DB_NAME || "";
  const mongoUri = buildMongoUri(dbUrl, databaseName);
  const resolvedDatabaseName = getMongoDatabaseName(mongoUri);

  const isWriteMode = process.argv.includes("--write");
  const isDryRun = process.argv.includes("--dry-run") || !isWriteMode;
  const batchSize = positiveNumber(
    getArgValue("batch-size") || process.env.RECALC_USERS_RATING_BATCH_SIZE,
    200
  );
  const limit = Math.max(Number(getArgValue("limit") || 0) || 0, 0);
  const progressEvery = positiveNumber(
    getArgValue("progress-every") ||
      process.env.RECALC_USERS_RATING_PROGRESS_EVERY,
    batchSize
  );
  const userQuery = buildUserQuery();

  await mongoose.connect(mongoUri);
  await loadRatingFormulaRuntimeFromMongo(mongoose.connection.db);

  const ratingService = new RatingService();
  const users = mongoose.connection.db.collection("users");
  const cursor = users
    .find(userQuery, {
      noCursorTimeout: true,
    })
    .batchSize(batchSize);
  const operations = [];
  const summary = {
    mode: isDryRun ? "dry-run" : "write",
    query: userQuery,
    scanned: 0,
    updated: 0,
    errors: 0,
    examplesLogged: 0,
  };
  const startedAt = Date.now();

  console.log(
    [
      "Starting users rating recalculation",
      `mode=${summary.mode}`,
      `database=${resolvedDatabaseName || "default"}`,
      `query=${JSON.stringify(userQuery)}`,
      `batchSize=${batchSize}`,
      `limit=${limit || "all"}`,
      `progressEvery=${progressEvery}`,
    ].join(" | ")
  );

  while (await cursor.hasNext()) {
    if (limit && summary.scanned >= limit) break;

    const user = await cursor.next();
    summary.scanned += 1;

    try {
      const scores = ratingService.calculateUserScores(user);

      if (summary.examplesLogged < 10) {
        console.log(
          [
            `user=${user.username || user.name || user.wallet || user._id}`,
            `rating=${scores.rating}`,
            `fullness=${scores.fullness}`,
            `rank=${scores.rank}`,
          ].join(" | ")
        );
        summary.examplesLogged += 1;
      }

      if (!isDryRun) {
        operations.push({
          updateOne: {
            filter: { _id: user._id },
            update: {
              $set: {
                rating: String(scores.rating),
                fomoScore: scores.rating,
                fullness: `${scores.fullness}%`,
                rank: scores.rank,
                ratingBreakdown: scores.ratingBreakdown,
                fullnessBreakdown: scores.fullnessBreakdown,
                lastRatingCalculatedAt: scores.ratingBreakdown.calculatedAt,
              },
            },
          },
        });

        if (operations.length >= batchSize) {
          await flushBulk(users, operations, summary);
        }
      }
    } catch (error) {
      summary.errors += 1;
      console.error(
        `Failed to calculate user rating for ${
          user?.username || user?.wallet || user?._id
        }:`,
        error.message
      );
    }

    if (summary.scanned % progressEvery === 0) {
      logProgress(summary, startedAt);
    }
  }

  if (!isDryRun) {
    await flushBulk(users, operations, summary);
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
