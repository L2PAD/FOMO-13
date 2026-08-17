try {
  require("dotenv").config();
} catch (_) {
  // dotenv is optional here; production environments usually provide DB_URL directly.
}

require("ts-node/register");
require("tsconfig-paths/register");

const mongoose = require("mongoose");
const { RatingService } = require("../src/rating/rating.service");
const {
  loadRatingFormulaRuntimeFromMongo,
} = require("../src/rating/rating-formula.runtime");

const isWriteMode = process.argv.includes("--write");
const isDryRun = process.argv.includes("--dry-run") || !isWriteMode;
const batchSize = Math.max(
  Number(process.env.RECALC_PROJECT_RATINGS_BATCH_SIZE || 200),
  1
);
const typeArg = readArg("--type") || "all";
const supportedTypes = new Set(["all", "market", "project"]);

if (!supportedTypes.has(typeArg)) {
  throw new Error(
    `Unsupported --type=${typeArg}. Use one of: all, market, project`
  );
}

function readArg(name) {
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (inline) return inline.slice(name.length + 1).trim();

  const index = process.argv.indexOf(name);
  if (index >= 0) return String(process.argv[index + 1] || "").trim();

  return "";
}

function buildQuery() {
  if (typeArg === "market") return { projectType: "market" };
  if (typeArg === "project") return { projectType: "project" };

  return {
    projectType: { $in: ["project", "market"] },
  };
}

function formatPenalties(scores) {
  const penalties = scores.ratingBreakdown?.penalties || [];
  if (!penalties.length) return "none";

  return penalties
    .slice(0, 3)
    .map((penalty) => `${penalty.key}:${penalty.value}`)
    .join(", ");
}

async function flushBulk(collection, operations, summary) {
  if (!operations.length) return;

  const result = await collection.bulkWrite(operations, { ordered: false });
  summary.updated += result.modifiedCount + result.upsertedCount;
  operations.length = 0;
}

async function run() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    throw new Error("DB_URL is required");
  }

  await mongoose.connect(`${dbUrl}/fomoland?authSource=admin`);
  await loadRatingFormulaRuntimeFromMongo(mongoose.connection.db);

  const ratingService = new RatingService();
  const collection = mongoose.connection.db.collection("projects");
  const cursor = collection.find(buildQuery());
  const summary = {
    mode: isDryRun ? "dry-run" : "write",
    type: typeArg,
    scanned: 0,
    updated: 0,
    market: 0,
    project: 0,
    examplesLogged: 0,
  };
  const operations = [];

  while (await cursor.hasNext()) {
    const project = await cursor.next();
    const projectType = String(project.projectType || "project").toLowerCase();
    summary.scanned += 1;
    if (projectType === "market") summary.market += 1;
    if (projectType === "project") summary.project += 1;

    const scores =
      projectType === "market"
        ? ratingService.calculateMarketProjectScores(project)
        : ratingService.calculateIcoProjectScores(project);
    const fullness = `${scores.fullness}%`;

    if (summary.examplesLogged < 10) {
      console.log(
        [
          `type=${projectType}`,
          `project=${project.name || project.slug || project._id}`,
          `rating=${scores.rating}`,
          `fullness=${fullness}`,
          `version=${scores.ratingBreakdown?.version || "unknown"}`,
          `topPenalties=${formatPenalties(scores)}`,
        ].join(" | ")
      );
      summary.examplesLogged += 1;
    }

    if (isDryRun) {
      continue;
    }

    const set = {
      rating: String(scores.rating),
      fomoScore: scores.rating,
      fullness,
      ratingBreakdown: scores.ratingBreakdown,
      fullnessBreakdown: scores.fullnessBreakdown,
      lastRatingCalculatedAt: scores.ratingBreakdown.calculatedAt,
    };

    if (projectType === "project") {
      set["rawIcoData.scoring"] = scores;
    }

    operations.push({
      updateOne: {
        filter: { _id: project._id },
        update: { $set: set },
      },
    });

    if (operations.length >= batchSize) {
      await flushBulk(collection, operations, summary);
    }
  }

  if (!isDryRun) {
    await flushBulk(collection, operations, summary);
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
