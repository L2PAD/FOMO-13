/**
 * NFT marketplace demo data (idempotent) so the admin Bazaar → NFT tab renders
 * real content: collections, NFTs listed for sale, sellers and a completed sale.
 * Usage: node scripts/seed-nft-demo.js
 */
const { MongoClient, ObjectId } = require("mongodb");
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "fomo_dev";
const MARK = "nft-demo";
const daysAgo = (d) => new Date(Date.now() - d * 86400000);

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  const alice = await db.collection("users").findOne({ email: "alice.fomie@fomo.local" });
  const bob = await db.collection("users").findOne({ email: "bob.fomie@fomo.local" });
  if (!alice || !bob) { console.log("[nft-demo] fomies missing, skip"); await client.close(); return; }

  const cols = db.collection("collections");
  const collSeed = [
    { name: "Fomo Genesis", image: "https://picsum.photos/seed/fomogen/300", tokenAddress: "0xNFT0001Genesis000000000000000000000001" },
    { name: "Cosmic Crabs", image: "https://picsum.photos/seed/crabs/300", tokenAddress: "0xNFT0002Crabs00000000000000000000000002" },
    { name: "zkPunks", image: "https://picsum.photos/seed/zkpunks/300", tokenAddress: "0xNFT0003Punks00000000000000000000000003" },
  ];
  const colIds = {};
  for (const c of collSeed) {
    await cols.updateOne({ tokenAddress: c.tokenAddress }, { $set: { ...c, isActive: true, createdAt: daysAgo(30), source: MARK } }, { upsert: true });
    const doc = await cols.findOne({ tokenAddress: c.tokenAddress }, { projection: { _id: 1 } });
    colIds[c.name] = doc._id;
  }

  const nfts = db.collection("collectionnfts");
  const listSeed = [
    { name: "Genesis #1", col: "Fomo Genesis", price: 1200, isEth: false, owner: alice, nftId: 1, orderId: 5001 },
    { name: "Genesis #7", col: "Fomo Genesis", price: 2400, isEth: false, owner: alice, nftId: 7, orderId: 5002 },
    { name: "Crab #12", col: "Cosmic Crabs", price: 0.8, isEth: true, owner: bob, nftId: 12, orderId: 5003 },
    { name: "Crab #40", col: "Cosmic Crabs", price: 0.5, isEth: true, owner: bob, nftId: 40, orderId: 5004 },
    { name: "zkPunk #301", col: "zkPunks", price: 950, isEth: false, owner: alice, nftId: 301, orderId: 5005 },
  ];
  for (const n of listSeed) {
    await nfts.updateOne(
      { orderId: n.orderId, source: MARK },
      { $set: {
          name: n.name, description: `${n.name} demo listing`, image: `https://picsum.photos/seed/nft${n.orderId}/300`,
          attributes: [], collectionId: colIds[n.col], nftId: n.nftId, price: n.price,
          orderId: n.orderId, endDate: daysAgo(-14), isEth: n.isEth, isUsdc: !n.isEth, isActive: true,
          viewsCount: Math.floor(Math.random() * 400), viewedBy: [], ownerId: n.owner._id,
          tokenAddress: collSeed.find((c) => c.name === n.col).tokenAddress, source: MARK,
      } },
      { upsert: true }
    );
  }

  const sales = db.collection("collection_nft_sales");
  await sales.updateOne(
    { orderId: 4900, source: MARK },
    { $set: {
        collectionId: colIds["Fomo Genesis"], buyerId: bob._id, sellerId: alice._id,
        buyerWallet: bob.wallet, sellerWallet: alice.wallet, nftId: 3, name: "Genesis #3",
        image: "https://picsum.photos/seed/sold3/300", tokenAddress: collSeed[0].tokenAddress,
        orderId: 4900, price: 1800, currency: "USDC", txHash: "0xnftsale0001", blockNumber: 1234567,
        createdAt: daysAgo(6), source: MARK,
    } },
    { upsert: true }
  );

  console.log(`[nft-demo] collections=${collSeed.length} listings=${listSeed.length} sales=1`);
  await client.close();
}
main().catch((e) => { console.error("[nft-demo] FAILED:", e); process.exit(1); });
