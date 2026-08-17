/*
 * Idempotent seed for the zkSync/USDC acquiring network config (Phase H3).
 *
 * Guarantees a fresh deploy lands in a WORKING state for deposits:
 *   - creates the ZKSYNC_USDC network config if missing;
 *   - repairs an unusable rpcUrl (empty or ws(s):// — ethers JsonRpcProvider
 *     only supports http(s)) so RPC_VERIFY engages on mainnet;
 *   - ensures the treasury matches the on-chain deposit destination (the OTC
 *     contract that receives USDC via depositUSD).
 *
 * It NEVER clobbers a valid operator-set http(s) rpcUrl or a custom treasury.
 */
const { MongoClient } = require('mongodb');

const url = process.env.DB_URL || process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'fomo_dev';

const NETWORK_ID = process.env.MONEY_ACTIVE_NETWORK || 'ZKSYNC_USDC';
const DEFAULT_RPC = process.env.MONEY_ZKSYNC_RPC_URL || 'https://zksync.drpc.org';
const CHAIN_ID = Number(process.env.MONEY_ZKSYNC_CHAIN_ID || '324');
const USDC = process.env.MONEY_ZKSYNC_USDC_ADDRESS || '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4';
const TREASURY = process.env.MONEY_TREASURY_ADDRESS || '0xc6b848CA645603521C81D439aC0C856dbDAaeD2F';

const isUsableHttp = (s) => !!s && /^https?:\/\//i.test(String(s).trim());

(async () => {
  const client = new MongoClient(url);
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection('money_network_configs');

  const existing = await col.findOne({ networkId: NETWORK_ID });

  if (!existing) {
    await col.insertOne({
      networkId: NETWORK_ID,
      version: 1,
      enabled: true,
      displayName: 'zkSync Era',
      chainId: CHAIN_ID,
      rpcUrl: DEFAULT_RPC,
      explorerUrl: 'https://explorer.zksync.io',
      confirmationsRequired: 12,
      treasuryAddress: TREASURY,
      depositFeeMode: 'NONE',
      depositFeeValue: 0,
      withdrawalFeeMode: 'NONE',
      withdrawalFeeValue: 0,
      token: {
        symbol: 'USDC', address: USDC, decimals: 6,
        depositEnabled: true, withdrawalEnabled: true,
        minDeposit: 0.1, minWithdrawal: 1, withdrawalFee: 0,
      },
      createdAt: new Date(), updatedAt: new Date(), updatedBy: 'seed',
      seededBy: 'seed-money-network.js',
    });
    console.log(`[seed-money-network] created ${NETWORK_ID} (rpc=${DEFAULT_RPC}, treasury=${TREASURY})`);
    await client.close();
    return;
  }

  // Repair only what is broken; never overwrite a valid operator config.
  const set = {};
  if (!isUsableHttp(existing.rpcUrl)) {
    set.rpcUrl = DEFAULT_RPC; // empty or ws(s):// -> http default
  }
  if (!existing.treasuryAddress || !/^0x[a-fA-F0-9]{40}$/.test(String(existing.treasuryAddress))) {
    set.treasuryAddress = TREASURY;
  }
  if (!existing.chainId) set.chainId = CHAIN_ID;
  // H4/P0: ensure an explicit deposit fee policy exists (default NONE = 1:1).
  if (existing.depositFeeMode === undefined) { set.depositFeeMode = 'NONE'; set.depositFeeValue = 0; }
  if (existing.withdrawalFeeMode === undefined) { set.withdrawalFeeMode = 'NONE'; set.withdrawalFeeValue = 0; }

  if (Object.keys(set).length) {
    set.version = Number(existing.version || 1) + 1;
    set.updatedAt = new Date();
    set.updatedBy = 'seed-repair';
    await col.updateOne({ networkId: NETWORK_ID }, { $set: set });
    console.log(`[seed-money-network] repaired ${NETWORK_ID}:`, JSON.stringify(set));
  } else {
    console.log(`[seed-money-network] ${NETWORK_ID} already healthy (rpc ok, treasury ok) — no change`);
  }

  await client.close();
})().catch((e) => { console.error('[seed-money-network] failed (non-fatal):', e.message); process.exit(0); });
