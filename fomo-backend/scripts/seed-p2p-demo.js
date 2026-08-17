/**
 * Realistic P2P fiat ADS (open offers) so the admin Bazaar → P2P exchange view
 * shows meaningful rates & spread. Idempotent (keyed by dealId + source).
 * Ads: status 'waiting' (open), section 'p2p'. rate = price/amount (fiat per USDC).
 * Usage: node scripts/seed-p2p-demo.js
 */
const { MongoClient, ObjectId } = require("mongodb");
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "fomo_dev";
const MARK = "p2p-demo";
const daysAgo = (d) => new Date(Date.now() - d * 86400000);

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  const alice = await db.collection("users").findOne({ email: "alice.fomie@fomo.local" });
  const bob = await db.collection("users").findOne({ email: "bob.fomie@fomo.local" });
  if (!alice || !bob) { console.log("[p2p-demo] fomies missing, skip"); await client.close(); return; }
  const deals = db.collection("deals");

  // rate = fiat per 1 USDC. SELL ads slightly above 1.0, BUY ads slightly below.
  const ads = [
    { id: 910001, type: "sell", qty: 1000, rate: 1.03, owner: alice },
    { id: 910002, type: "sell", qty: 500, rate: 1.02, owner: bob },
    { id: 910003, type: "sell", qty: 2500, rate: 1.05, owner: alice },
    { id: 910004, type: "buy", qty: 1500, rate: 0.985, owner: bob },
    { id: 910005, type: "buy", qty: 800, rate: 0.97, owner: alice },
    { id: 910006, type: "buy", qty: 1200, rate: 0.99, owner: bob },
  ];
  for (const a of ads) {
    const price = Math.round(a.qty * a.rate * 100) / 100;
    await deals.updateOne(
      { dealId: a.id, source: MARK },
      { $set: {
          section: "p2p", type: a.type, status: "waiting", isActive: true,
          name: `${a.type === "sell" ? "Продажа" : "Покупка"} ${a.qty} USDC @ ${a.rate}`,
          amount: a.qty, price, ticker: "usd", currency: "USDC", serviceType: "Services",
          creator: a.owner._id, seller: a.type === "sell" ? a.owner._id : null, buyer: a.type === "buy" ? a.owner._id : null,
          dealId: a.id, orderNumber: a.id, createDate: daysAgo(Math.random() * 5), date: daysAgo(1),
          lastStatusUpdate: daysAgo(1), lastPromotedDate: daysAgo(1), description: "",
          movingTokens: false, isReservedFunds: false, isMakePayment: false, isRefund: false,
          isCompleteByAdmin: false, isAppeal: false, likes: [], dislikes: [], offers: [], paymentMethods: [],
          p2pSaleTime: "00:30", source: MARK,
      } },
      { upsert: true }
    );
  }
  console.log(`[p2p-demo] p2p ads upserted: ${ads.length}`);
  await client.close();
}
main().catch((e) => { console.error("[p2p-demo] FAILED:", e); process.exit(1); });
