const mongoose = require("mongoose");
require("dotenv").config();

const INDEX_OPTIONS = { background: true };

async function createIndex(collection, key, options = {}) {
  const name = await collection.createIndex(key, { ...INDEX_OPTIONS, ...options });
  console.log(`${collection.collectionName}: ${name}`);
}

async function main() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    throw new Error("DB_URL is required");
  }

  await mongoose.connect(`${dbUrl}/fomoland?authSource=admin`, {
    serverSelectionTimeoutMS: 10_000,
  });

  const db = mongoose.connection.db;
  const projects = db.collection("projects");
  const projectIntel = db.collection("project_intel");
  const projectUnlocks = db.collection("project_unlocks");
  const fundingRounds = db.collection("fundingrounds");
  const snapshots = db.collection("project_comparison_snapshots");
  const chartHistory = db.collection("projectcharthistories");
  const charts = db.collection("charts");

  await createIndex(projects, { slug: 1 });
  await createIndex(projects, { "rawIcoData.slug": 1 });
  await createIndex(projects, { "rawIcoData.sourceId": 1 });
  await createIndex(projects, { normalizedName: 1 });
  await createIndex(projects, { projectType: 1, projectStatus: 1, categories: 1, marketCap: -1 });
  await createIndex(projects, { projectType: 1, projectStatus: 1, tags: 1, marketCap: -1 });
  await createIndex(projects, { projectType: 1, projectStatus: 1, "rawIcoData.categories": 1, marketCap: -1 });
  await createIndex(projects, { projectType: 1, projectStatus: 1, mainCategory: 1, marketCap: -1 });
  await createIndex(projects, { projectType: 1, projectStatus: 1, "mainCategory.name": 1, marketCap: -1 });
  await createIndex(projects, { projectType: 1, projectStatus: 1, "mainCategory.slug": 1, marketCap: -1 });
  await createIndex(projects, { projectType: 1, projectStatus: 1, ecosystems: 1, marketCap: -1 });
  await createIndex(projects, { projectType: 1, projectStatus: 1, launchpads: 1, marketCap: -1 });
  await createIndex(projects, { projectType: 1, projectStatus: 1, status: 1, marketCap: -1 });
  await createIndex(projects, { projectType: 1, projectStatus: 1, categories: 1, fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 });
  await createIndex(projects, { projectType: 1, projectStatus: 1, tags: 1, fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 });
  await createIndex(projects, { projectType: 1, projectStatus: 1, "rawIcoData.categories": 1, fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 });
  await createIndex(projects, { projectType: 1, projectStatus: 1, "mainCategory.name": 1, fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 });
  await createIndex(projects, { projectType: 1, projectStatus: 1, "mainCategory.slug": 1, fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 });
  await createIndex(projects, { projectType: 1, projectStatus: 1, ecosystems: 1, fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 });
  await createIndex(projects, { projectType: 1, projectStatus: 1, launchpads: 1, fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 });
  await createIndex(projects, { projectType: 1, projectStatus: 1, status: 1, fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 });

  await createIndex(projectIntel, { projectId: 1 });
  await createIndex(projectUnlocks, { projectId: 1, source: 1 });

  await createIndex(fundingRounds, { projectId: 1 });
  await createIndex(fundingRounds, { "projectLinks.projectId": 1 });
  await createIndex(fundingRounds, { coinSlug: 1, date: -1 });
  await createIndex(fundingRounds, { coinSymbol: 1, date: -1 });

  await createIndex(snapshots, { projectId: 1, timestamp: 1 });
  await createIndex(snapshots, { slug: 1, timestamp: 1 });
  await createIndex(snapshots, { projectId: 1, bucketGranularity: 1, timestamp: 1 });
  await createIndex(snapshots, { slug: 1, bucketGranularity: 1, timestamp: 1 });

  await createIndex(
    chartHistory,
    { projectId: 1, bucketTimestamp: -1 },
    {
      name: "projectId_1_bucketTimestamp_-1_lookup",
      partialFilterExpression: { bucketTimestamp: { $type: "date" } },
    },
  );
  await createIndex(
    chartHistory,
    { projectId: 1, updatedAt: -1 },
    {
      name: "projectId_1_updatedAt_-1_legacy_data_lookup",
      partialFilterExpression: { data: { $exists: true } },
    },
  );

  await createIndex(charts, { entityId: 1, entityType: 1 }, { unique: true });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => undefined);
  });
