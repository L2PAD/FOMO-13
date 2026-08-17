try {
  require('dotenv').config();
} catch (_) {
  // dotenv is optional here; production environments usually provide DB_URL directly.
}

require('ts-node/register');
require('tsconfig-paths/register');

const mongoose = require('mongoose');
const { RatingService } = require('../src/rating/rating.service');

const isWriteMode = process.argv.includes('--write');
const isDryRun = process.argv.includes('--dry-run') || !isWriteMode;
const batchSize = Math.max(Number(process.env.RECALC_ICO_SCORES_BATCH_SIZE || 200), 1);

function formatPenalties(scores) {
  const penalties = scores.ratingBreakdown?.penalties || [];
  if (!penalties.length) return 'none';

  return penalties
    .slice(0, 3)
    .map((penalty) => `${penalty.key}:${penalty.value}`)
    .join(', ');
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
    throw new Error('DB_URL is required');
  }

  await mongoose.connect(`${dbUrl}/fomoland?authSource=admin`);

  const ratingService = new RatingService();
  const collection = mongoose.connection.db.collection('projects');
  const cursor = collection.find({
    source: 'icodrops',
    projectType: 'project',
  });
  const summary = {
    mode: isDryRun ? 'dry-run' : 'write',
    scanned: 0,
    updated: 0,
    examplesLogged: 0,
  };
  const operations = [];

  while (await cursor.hasNext()) {
    const project = await cursor.next();
    summary.scanned += 1;

    const scores = ratingService.calculateIcoProjectScores(project);
    const fullness = `${scores.fullness}%`;

    if (summary.examplesLogged < 10) {
      console.log(
        [
          `project=${project.name || project.slug || project._id}`,
          `rating=${scores.rating}`,
          `fullness=${fullness}`,
          `topPenalties=${formatPenalties(scores)}`,
        ].join(' | '),
      );
      summary.examplesLogged += 1;
    }

    if (isDryRun) {
      continue;
    }

    operations.push({
      updateOne: {
        filter: { _id: project._id },
        update: {
          $set: {
            rating: String(scores.rating),
            fomoScore: scores.rating,
            fullness,
            'rawIcoData.scoring': scores,
          },
        },
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
