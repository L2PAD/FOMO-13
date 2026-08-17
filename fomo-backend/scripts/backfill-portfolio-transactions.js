try {
  require('dotenv').config();
} catch (_) {
  // dotenv is optional here; production environments usually provide DB_URL directly.
}

const mongoose = require('mongoose');

const isWriteMode = process.argv.includes('--write');
const isDryRun = !isWriteMode;

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toDate(value, fallback) {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
}

function normalizeObjectId(value) {
  return value && value.toString ? value.toString() : '';
}

function makeFingerprint(transaction) {
  return [
    normalizeObjectId(transaction.projectId),
    transaction.type,
    toNumber(transaction.quantity).toString(),
    toNumber(transaction.price).toString(),
    toNumber(transaction.total).toString(),
    toDate(transaction.date, new Date(0)).getTime().toString(),
    transaction.feeType || 'usd',
    toNumber(transaction.feeAmount).toString(),
  ].join('|');
}

function makeTransactionFromAsset(portfolio, asset) {
  const date = toDate(asset.date, portfolio.createdAt || new Date());
  const quantity = toNumber(asset.amount);
  const price = toNumber(asset.price);
  const total = toNumber(asset.totalPrice, quantity * price);

  return {
    portfolioId: portfolio._id,
    projectId: asset.projectId,
    type: asset.type,
    quantity,
    currency: asset.currency || 'TKN',
    price,
    priceCurrency: asset.priceCurrency || 'USD',
    total,
    gainLoss: toNumber(asset.profit),
    gainLossPercent: toNumber(asset.profitPercent),
    date,
    note: asset.note,
    feeType: asset.feeType || 'usd',
    feeAmount: toNumber(asset.feeAmount),
    portfolioAssetId: asset._id,
  };
}

function validateTransaction(transaction) {
  if (!transaction.projectId) {
    return 'missing projectId';
  }

  if (!['buy', 'sell'].includes(transaction.type)) {
    return 'invalid type';
  }

  if (!Number.isFinite(transaction.quantity) || transaction.quantity <= 0) {
    return 'invalid quantity';
  }

  if (!Number.isFinite(transaction.price) || transaction.price < 0) {
    return 'invalid price';
  }

  if (!Number.isFinite(transaction.total) || transaction.total < 0) {
    return 'invalid total';
  }

  if (!Number.isFinite(transaction.feeAmount) || transaction.feeAmount < 0) {
    return 'invalid feeAmount';
  }

  return null;
}

async function run() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    throw new Error('DB_URL is required');
  }

  await mongoose.connect(`${dbUrl}/fomoland?authSource=admin`);

  const portfolios = mongoose.connection.db.collection('portfolios');
  const transactions = mongoose.connection.db.collection('transactions');
  const cursor = portfolios.find(
    { assets: { $exists: true, $ne: [] } },
    { projection: { _id: 1, assets: 1, createdAt: 1 } },
  );

  const summary = {
    mode: isDryRun ? 'dry-run' : 'write',
    portfoliosScanned: 0,
    portfoliosWithAssets: 0,
    portfoliosWithMissingTransactions: 0,
    inserted: 0,
    skippedExisting: 0,
    skippedInvalid: 0,
  };

  while (await cursor.hasNext()) {
    const portfolio = await cursor.next();
    summary.portfoliosScanned += 1;

    if (!Array.isArray(portfolio.assets) || portfolio.assets.length === 0) {
      continue;
    }

    summary.portfoliosWithAssets += 1;

    const existingTransactions = await transactions
      .find(
        { portfolioId: portfolio._id },
        {
          projection: {
            projectId: 1,
            type: 1,
            quantity: 1,
            price: 1,
            total: 1,
            date: 1,
            feeType: 1,
            feeAmount: 1,
            portfolioAssetId: 1,
          },
        },
      )
      .toArray();

    const existingAssetIds = new Set(
      existingTransactions
        .map(transaction => normalizeObjectId(transaction.portfolioAssetId))
        .filter(Boolean),
    );
    const existingFingerprints = new Set(existingTransactions.map(makeFingerprint));
    const missingTransactions = [];

    for (const asset of portfolio.assets) {
      const assetId = normalizeObjectId(asset._id);
      const transaction = makeTransactionFromAsset(portfolio, asset);
      const validationError = validateTransaction(transaction);

      if (validationError) {
        summary.skippedInvalid += 1;
        console.warn(
          `Skipping invalid asset portfolio=${portfolio._id} asset=${assetId || 'unknown'} reason=${validationError}`,
        );
        continue;
      }

      if (assetId && existingAssetIds.has(assetId)) {
        summary.skippedExisting += 1;
        continue;
      }

      if (existingFingerprints.has(makeFingerprint(transaction))) {
        summary.skippedExisting += 1;
        continue;
      }

      missingTransactions.push(transaction);
    }

    if (missingTransactions.length === 0) {
      continue;
    }

    summary.portfoliosWithMissingTransactions += 1;
    summary.inserted += missingTransactions.length;

    if (isWriteMode) {
      await transactions.insertMany(missingTransactions, { ordered: false });
      await portfolios.updateOne(
        { _id: portfolio._id },
        {
          $set: {
            needsRecalculation: true,
            lastMutationAt: new Date(),
            lastRecalculationReason: 'migration:backfill-transactions',
          },
        },
      );
    }
  }

  console.log(JSON.stringify(summary, null, 2));

  if (isDryRun) {
    console.log('Dry run only. Re-run with --write to insert missing transactions.');
  }
}

run()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
