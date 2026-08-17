/**
 * Customer 360 demo data seed (idempotent).
 *
 * Populates the transactional collections for the seeded demo Fomies so the
 * admin Customer 360 dossier renders real content in every block:
 *   deals (OTC + P2P), deposits, withdraws, portfolios, comments, supports, appeals.
 *
 * Idempotent: keyed by a `source: "c360-demo"` marker (or deterministic ids),
 * so re-running never duplicates. Safe to run on every bootstrap.
 *
 * Usage: node scripts/seed-c360-demo.js
 */
const { MongoClient, ObjectId } = require("mongodb");

const MONGO_URL = process.env.MONGO_URL || process.env.DB_URL || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "fomo_dev";
const MARK = "c360-demo";

const daysAgo = (d) => new Date(Date.now() - d * 86400000);

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);

  const users = db.collection("users");

  // Self-heal: the model expects reviewLikes/reviewDislikes as ARRAYS, but older
  // seed-fomies stored them as numbers, which crashes the deals aggregation
  // ($size on an int). Normalise any numeric values to arrays (length preserved).
  for (const field of ["reviewLikes", "reviewDislikes"]) {
    const bad = await users.find({ [field]: { $type: ["int", "long", "double", "decimal"] } }).toArray();
    for (const u of bad) {
      const n = Math.max(0, Math.round(Number(u[field]) || 0));
      await users.updateOne({ _id: u._id }, { $set: { [field]: Array.from({ length: n }, () => new ObjectId()) } });
    }
    if (bad.length) console.log(`[c360-demo] normalised ${field} to array for ${bad.length} user(s)`);
  }

  const alice = await users.findOne({ email: "alice.fomie@fomo.local" });
  const bob = await users.findOne({ email: "bob.fomie@fomo.local" });
  if (!alice || !bob) {
    console.log("[c360-demo] fomies not found — run seed-fomies.js first. Skipping.");
    await client.close();
    return;
  }
  const aId = alice._id;
  const bId = bob._id;

  // A project to reference in support requests (optional).
  const someProject = await db.collection("projects").findOne({});
  const projectId = someProject ? someProject._id : null;

  // ── DEALS (OTC + P2P) ──────────────────────────────────────────────────
  const deals = db.collection("deals");
  const dealSeed = [
    { section: "otc", type: "sell", status: "ended", name: "OTC: 5,000 USDC → ETH", amount: 5000, price: 5000, ticker: "usd", currency: "USDC", creator: aId, seller: aId, buyer: bId, dealId: 900001, orderNumber: 900001, serviceType: "Projects", createDate: daysAgo(20) },
    { section: "otc", type: "buy", status: "ended", name: "OTC: NFT allocation", amount: 1, price: 1200, ticker: "usd", currency: "USDC", creator: bId, seller: bId, buyer: aId, dealId: 900002, orderNumber: 900002, serviceType: "NFT", createDate: daysAgo(14) },
    { section: "p2p", type: "sell", status: "started", name: "P2P: 2,000 USDC", amount: 2000, price: 2000, ticker: "usd", currency: "USDC", creator: aId, seller: aId, buyer: bId, dealId: 900003, orderNumber: 900003, serviceType: "Services", createDate: daysAgo(6), isAppeal: true },
    { section: "p2p", type: "buy", status: "waiting", name: "P2P: Social account", amount: 1, price: 350, ticker: "usd", currency: "USDC", creator: aId, buyer: aId, seller: bId, dealId: 900004, orderNumber: 900004, serviceType: "Social network", createDate: daysAgo(2) },
    { section: "otc", type: "sell", status: "blocked", name: "OTC: disputed transfer", amount: 800, price: 800, ticker: "usd", currency: "USDC", creator: aId, seller: aId, buyer: bId, dealId: 900005, orderNumber: 900005, serviceType: "Projects", createDate: daysAgo(30) },
  ];
  let appealDealId = null;
  for (const d of dealSeed) {
    const doc = {
      ...d,
      isActive: true,
      date: d.createDate,
      lastStatusUpdate: d.createDate,
      lastPromotedDate: d.createDate,
      description: "",
      movingTokens: false,
      isReservedFunds: d.status === "started",
      isMakePayment: false,
      isRefund: false,
      isCompleteByAdmin: false,
      likes: [], dislikes: [], offers: [], paymentMethods: [],
      p2pSaleTime: "00:30",
      source: MARK,
    };
    const res = await deals.updateOne({ dealId: d.dealId, source: MARK }, { $set: doc }, { upsert: true });
    const created = await deals.findOne({ dealId: d.dealId, source: MARK }, { projection: { _id: 1 } });
    if (d.dealId === 900003 && created) appealDealId = created._id;
  }
  console.log(`[c360-demo] deals upserted: ${dealSeed.length}`);

  // ── DEPOSITS ────────────────────────────────────────────────────────────
  const deposits = db.collection("deposits");
  const depSeed = [
    { amount: 5000, status: "confirmed", txHash: "0xdep0001alice000000000000000000000000000000000000000000000000a001", createdAt: daysAgo(25) },
    { amount: 1500, status: "confirmed", txHash: "0xdep0002alice000000000000000000000000000000000000000000000000a002", createdAt: daysAgo(12) },
    { amount: 750, status: "pending", txHash: "0xdep0003alice000000000000000000000000000000000000000000000000a003", createdAt: daysAgo(1) },
  ];
  for (const d of depSeed) {
    await deposits.updateOne(
      { transactionHash: d.txHash },
      { $set: {
          userId: aId, currency: "USDC", amount: d.amount, status: d.status,
          network: "ZKSYNC", walletAddress: alice.wallet, transactionHash: d.txHash,
          gasFee: 0.12, serviceFee: 0, netAmount: d.amount, confirmations: d.status === "confirmed" ? 30 : 3,
          createdAt: d.createdAt, updatedAt: d.createdAt, source: MARK,
      } },
      { upsert: true }
    );
  }
  console.log(`[c360-demo] deposits upserted: ${depSeed.length}`);

  // ── WITHDRAWS ─────────────────────────────────────────────────────────────
  const withdraws = db.collection("withdraws");
  const wSeed = [
    { amount: 1200, moneyStatus: "CONFIRMED", transactionHash: "0xwd0001alice00000000000000000000000000000000000000000000000000b001", createdAt: daysAgo(10) },
    { amount: 300, moneyStatus: "PROCESSING", transactionHash: "", createdAt: daysAgo(3) },
  ];
  for (const w of wSeed) {
    const key = w.transactionHash || `pending-${w.amount}-${w.createdAt.getTime()}`;
    await withdraws.updateOne(
      { _mark: key },
      { $set: {
          userId: aId, status: "0", type: "USDC", transactionHash: w.transactionHash,
          network: "ZKSYNC", userWallet: alice.wallet, walletAddress: alice.wallet,
          amount: w.amount, fee: 0.5, totalSend: w.amount - 0.5, currency: "USDC",
          moneyReserved: w.moneyStatus === "PROCESSING", moneyStatus: w.moneyStatus,
          createdAt: w.createdAt, updatedAt: w.createdAt, _mark: key, source: MARK,
      } },
      { upsert: true }
    );
  }
  console.log(`[c360-demo] withdraws upserted: ${wSeed.length}`);

  // ── PORTFOLIO ──────────────────────────────────────────────────────────────
  const portfolios = db.collection("portfolios");
  await portfolios.updateOne(
    { creator: aId, source: MARK },
    { $set: {
        creator: aId, name: "Alice · Main Portfolio",
        totalBalance: 8420.55, totalInvested: 6000, profit: 2420.55, profitPercent: 40.34,
        assets: [
          { symbol: "ETH", amount: 1.5, currentValue: 4200, invested: 3000, unrealizedProfit: 1200 },
          { symbol: "BTC", amount: 0.05, currentValue: 3200.55, invested: 2500, unrealizedProfit: 700.55 },
          { symbol: "SOL", amount: 8, currentValue: 1020, invested: 500, unrealizedProfit: 520 },
        ],
        createdAt: daysAgo(40), updatedAt: daysAgo(1), source: MARK,
    } },
    { upsert: true }
  );
  console.log(`[c360-demo] portfolio upserted: 1`);

  // ── COMMENTS ───────────────────────────────────────────────────────────────
  const comments = db.collection("comments");
  const cSeed = [
    { text: "Great project, the tokenomics look sustainable.", page: "project", path: "/crypto/monad", topicName: "Monad", likesN: 12, dislikesN: 1, viewsCount: 340 },
    { text: "Careful — the unlock schedule is aggressive.", page: "project", path: "/crypto/berachain", topicName: "Berachain", likesN: 5, dislikesN: 0, viewsCount: 120, reportsN: 1 },
    { text: "Anyone tried the testnet? UX is smooth.", page: "news", path: "/news/megaeth", topicName: "MegaETH", likesN: 3, dislikesN: 0, viewsCount: 88 },
  ];
  for (let i = 0; i < cSeed.length; i++) {
    const c = cSeed[i];
    await comments.updateOne(
      { author: aId, _mark: `${MARK}-${i}` },
      { $set: {
          author: aId, date: daysAgo(15 - i * 3), text: c.text, page: c.page, path: c.path,
          topicName: c.topicName, isTopic: false, viewsCount: c.viewsCount,
          likes: Array.from({ length: c.likesN || 0 }, () => new ObjectId()),
          dislikes: Array.from({ length: c.dislikesN || 0 }, () => new ObjectId()),
          reports: Array.from({ length: c.reportsN || 0 }, () => new ObjectId()),
          answers: [], _mark: `${MARK}-${i}`, source: MARK,
      } },
      { upsert: true }
    );
  }
  console.log(`[c360-demo] comments upserted: ${cSeed.length}`);

  // ── SUPPORT requests ────────────────────────────────────────────────────────
  const supports = db.collection("supports");
  const sSeed = [
    { theme: "Withdrawal delayed", message: "My USDC withdrawal has been processing for 2 days.", category: "Payments", date: daysAgo(3) },
    { theme: "Verification question", message: "How do I raise my trade limits?", category: "Account", date: daysAgo(9) },
  ];
  for (let i = 0; i < sSeed.length; i++) {
    const s = sSeed[i];
    await supports.updateOne(
      { user: aId, _mark: `${MARK}-${i}` },
      { $set: {
          user: aId, date: s.date, theme: s.theme, message: s.message,
          category: s.category, project: projectId || undefined, _mark: `${MARK}-${i}`, source: MARK,
      } },
      { upsert: true }
    );
  }
  console.log(`[c360-demo] supports upserted: ${sSeed.length}`);

  // ── APPEAL (references the started P2P deal) ─────────────────────────────────
  if (appealDealId) {
    const appeals = db.collection("appeals");
    await appeals.updateOne(
      { appealId: "APP-DEMO-900003" },
      { $set: {
          appealId: "APP-DEMO-900003", dealId: appealDealId, creator: aId, role: "seller",
          reason: "Buyer did not release funds", description: "Payment confirmed on-chain but counterparty is unresponsive.",
          email: alice.email, attachments: [], status: "in_review",
          resolution: "", txHash: "", createdAt: daysAgo(5), updatedAt: daysAgo(4), source: MARK,
      } },
      { upsert: true }
    );
    console.log(`[c360-demo] appeal upserted: 1`);
  }

  console.log("[c360-demo] done.");
  await client.close();
}

main().catch((e) => { console.error("[c360-demo] FAILED:", e); process.exit(1); });
