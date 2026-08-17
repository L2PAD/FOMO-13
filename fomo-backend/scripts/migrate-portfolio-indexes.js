try {
  require('dotenv').config();
} catch (_) {
  // dotenv is optional here; production environments usually provide DB_URL directly.
}
const mongoose = require('mongoose');

async function run() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    throw new Error('DB_URL is required');
  }

  await mongoose.connect(`${dbUrl}/fomoland?authSource=admin`);
  const collection = mongoose.connection.db.collection('portfolios');
  const transactions = mongoose.connection.db.collection('transactions');
  const indexes = await collection.indexes();

  if (indexes.some(index => index.name === 'name_1')) {
    await collection.dropIndex('name_1');
    console.log('Dropped old global portfolios.name index');
  }

  await collection.createIndex({ creator: 1, name: 1 }, { unique: true, name: 'creator_1_name_1' });
  await collection.createIndex({ creator: 1, createdAt: -1 }, { name: 'creator_1_createdAt_-1' });
  await collection.createIndex({ needsRecalculation: 1, lastMutationAt: -1 }, { name: 'needsRecalculation_1_lastMutationAt_-1' });
  await collection.createIndex({ lastViewedAt: -1, lastRecalculatedAt: 1 }, { name: 'lastViewedAt_-1_lastRecalculatedAt_1' });
  await collection.createIndex({ lastViewedAt: -1, lastMarketSyncAt: 1 }, { name: 'lastViewedAt_-1_lastMarketSyncAt_1' });
  await collection.createIndex({ lastHistorySnapshotAt: 1 }, { name: 'lastHistorySnapshotAt_1' });
  await collection.createIndex(
    { lastHistorySnapshotCheckAt: 1, lastHistorySnapshotAt: 1 },
    { name: 'lastHistorySnapshotCheckAt_1_lastHistorySnapshotAt_1' },
  );
  await collection.createIndex({ recalculationLockUntil: 1 }, { name: 'recalculationLockUntil_1' });
  await collection.createIndex({ creator: 1, lastViewedAt: -1 }, { name: 'creator_1_lastViewedAt_-1' });
  await transactions.createIndex({ portfolioId: 1, date: -1 }, { name: 'portfolioId_1_date_-1' });
  console.log('Portfolio indexes are up to date');
}

run()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
