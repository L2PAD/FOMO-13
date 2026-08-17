/*
 * Seed realistic Buzz forum data into the EXISTING engines (no new collections):
 *  - comments collection: topics (isTopic=true) + threaded replies + likes/views/reports
 *  - users: follow relationships (followers/following/followersCount)
 *  - news collection: default news + FOMO Update + FOMO Academy
 * Idempotent-ish: clears previously seeded buzz docs (tagged seedTag) before insert.
 */
const { MongoClient, ObjectId } = require("mongodb");

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "fomo_dev";
const SEED_TAG = "buzz-seed-v1";

function daysAgo(d, hours = 0) {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  dt.setHours(dt.getHours() - hours);
  return dt;
}

(async () => {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  const users = db.collection("users");
  const comments = db.collection("comments");
  const news = db.collection("news");

  const admin = await users.findOne({ email: "admin@fomo.local" });
  const alice = await users.findOne({ name: "Alice Nakamoto" });
  const bob = await users.findOne({ name: "Bob Buterin" });
  if (!admin || !alice || !bob) {
    console.error("Seed users missing (admin/alice/bob). Run seed-admin/seed-fomies first.");
    process.exit(1);
  }
  const A = alice._id, B = bob._id, ADM = admin._id;

  // ---- clean previous seed ----
  await comments.deleteMany({ seedTag: SEED_TAG });
  await news.deleteMany({ seedTag: SEED_TAG });

  // ---- follow relationships ----
  // Alice <-> Bob follow each other; both follow Admin (editorial).
  await users.updateOne({ _id: A }, { $set: { following: [B, ADM], followers: [B], followersCount: 1 } });
  await users.updateOne({ _id: B }, { $set: { following: [A, ADM], followers: [A], followersCount: 1 } });
  await users.updateOne({ _id: ADM }, { $set: { followers: [A, B], followersCount: 2 } });

  // ---- topics (isTopic=true) ----
  const topics = [
    { author: A, topicName: "ETH ETF inflows are accelerating — bullish setup?", topicKey: "defi", categoryKey: "alpha",
      text: "Spot ETH ETFs saw record net inflows this week. On-chain data shows exchange balances dropping. Are we early in a supply squeeze? Curious what the desk thinks about a Q4 melt-up.", d: 1, likes: [B, ADM], views: 340 },
    { author: B, topicName: "Best airdrop farming strategy for L2 season", topicKey: "airdrops", categoryKey: "strategy",
      text: "Sharing my rotation across zkSync, Scroll and Linea. Focus on real usage (bridges, LP, governance) instead of sybil clusters. What are your allocation splits?", d: 2, likes: [A], views: 512 },
    { author: A, topicName: "NFT liquidity is broken — a fix proposal", topicKey: "nfts", categoryKey: "research",
      text: "Floor prices are meaningless without depth. I sketched an AMM-style pool for blue-chip collections. Would love feedback on the bonding curve math.", d: 3, likes: [], views: 128 },
    { author: B, topicName: "AI x Crypto: where's the real revenue?", topicKey: "ai", categoryKey: "analytics",
      text: "Most AI tokens are narratives with no cashflow. Let's list projects with actual paying users and on-chain revenue. I'll start: a few inference marketplaces.", d: 4, likes: [A, ADM], views: 289 },
    { author: A, topicName: "Risk management: position sizing in high vol", topicKey: "strategy", categoryKey: "trade",
      text: "My rule: never risk more than 1.5% per idea, scale in thirds, hard invalidation. Sharing my sheet. How do you size during funding-rate blowoffs?", d: 5, likes: [B], views: 176 },
    { author: B, topicName: "Watch out: fake 'FOMO airdrop' phishing site", topicKey: "scam", categoryKey: "news",
      text: "Saw a cloned domain asking for seed phrases. Do NOT connect. Official links only from the app. Reporting here so mods can pin.", d: 1, likes: [A, ADM], views: 640, reports: [A] },
    { author: ADM, topicName: "Market structure: BTC dominance rolling over", topicKey: "market", categoryKey: "analytics",
      text: "BTC.D printed a lower high. Historically altseason follows within weeks when this holds. Not financial advice — watch the 200D.", d: 2, likes: [A, B], views: 903 },
    { author: A, topicName: "DeFi yields that aren't ponzis — a shortlist", topicKey: "defi", categoryKey: "invests",
      text: "Real yield from fees, not emissions. Perp DEX fee sharing and LST restaking look sustainable. Add yours with the source of the yield.", d: 6, likes: [B], views: 421 },
    { author: B, topicName: "How do you value early-stage crypto projects?", topicKey: "invests", categoryKey: "research",
      text: "TVL, active addresses, revenue multiples? I built a simple comp sheet. Curious how the community weighs team vs traction vs token design.", d: 7, likes: [A], views: 233 },
    { author: ADM, topicName: "Weekly analytics: stablecoin supply expansion", topicKey: "analytics", categoryKey: "analytics",
      text: "USDT + USDC supply grew 2.1% w/w — liquidity returning to the system. Pairing this with rising DEX volumes. Charts inside.", d: 3, likes: [A], views: 388 },
  ];

  const topicDocs = topics.map((t) => ({
    _id: new ObjectId(),
    author: t.author,
    date: daysAgo(t.d, 2),
    text: t.text,
    page: "/crypto/news",
    path: "/crypto/news",
    isTopic: true,
    topicName: t.topicName,
    topicKey: t.topicKey,
    categoryKey: t.categoryKey,
    answers: [],
    likes: t.likes || [],
    dislikes: [],
    reports: t.reports || [],
    viewsCount: t.views || 0,
    seedTag: SEED_TAG,
    __v: 0,
  }));

  // ---- replies (answers) on a few topics ----
  const replyMap = [
    { topicIdx: 0, author: B, text: "Agree, but watch options positioning — a lot of upside is already priced. I'd fade the first spike.", likes: [A] },
    { topicIdx: 0, author: ADM, text: "Good thread. Adding: staking inflows correlate strongly here. Pinned for the week.", likes: [A, B] },
    { topicIdx: 1, author: A, text: "I'd add Base to that rotation — real fees and growing DAU.", likes: [B] },
    { topicIdx: 3, author: A, text: "Inference marketplaces are the only ones with recurring revenue imo. The rest is vaporware.", likes: [] },
    { topicIdx: 6, author: A, text: "This aged well last cycle. Watching the weekly close on dominance.", likes: [B] },
  ];

  const replyDocs = [];
  for (const r of replyMap) {
    const rid = new ObjectId();
    replyDocs.push({
      _id: rid,
      author: r.author,
      date: daysAgo(topics[r.topicIdx].d - 0.2 > 0 ? topics[r.topicIdx].d - 0.2 : 0, 1),
      text: r.text,
      page: "/crypto/news",
      path: "/crypto/news",
      isTopic: false,
      answers: [],
      likes: r.likes || [],
      dislikes: [],
      reports: [],
      viewsCount: 0,
      seedTag: SEED_TAG,
      __v: 0,
    });
    topicDocs[r.topicIdx].answers.push(rid);
  }

  await comments.insertMany([...topicDocs, ...replyDocs]);

  // ---- news (default + fomo-update + fomo-academy) ----
  const mkNews = (o) => ({
    _id: new ObjectId(),
    title: o.title,
    date: daysAgo(o.d, 3),
    recommendations: [],
    type: o.type || "Crypto",
    text: o.text,
    image: o.image || "",
    actionType: "news",
    action: "seed",
    actionDate: new Date(),
    page: "crypto",
    status: "active",
    isAdminCreate: true,
    likes: [], dislikes: [], views: [],
    tags: o.tags || [],
    author: o.author || "FOMO Editorial",
    isUserCreator: false,
    newsSection: o.section || "default",
    readTime: String(o.readTime || 3),
    seedTag: SEED_TAG,
    __v: 0,
  });

  const newsDocs = [
    mkNews({ title: "Ethereum spot ETFs post record weekly inflows", d: 1, tags: ["Ethereum", "Market"], readTime: 3,
      text: "Ethereum spot ETFs recorded their strongest week of net inflows since launch as institutional demand accelerated. Analysts point to shrinking exchange balances and rising staking participation as supportive of a constructive Q4." }),
    mkNews({ title: "Layer-2 activity hits new highs as fees drop", d: 2, tags: ["L2", "Analytics"], readTime: 4,
      text: "Aggregate Layer-2 transactions reached a new all-time high this week while median fees fell below a cent on several networks, driven by blob adoption and growing DeFi usage." }),
    mkNews({ title: "Stablecoin supply expands, signaling returning liquidity", d: 3, tags: ["Stablecoins", "Market"], readTime: 3,
      text: "The combined supply of major stablecoins expanded over 2% week-over-week, a historically bullish signal for on-chain liquidity and DEX volumes." }),
    mkNews({ title: "FOMO Update: Buzz gets a public market Calendar", d: 0, section: "fomo-update", tags: ["FOMO", "Product"], readTime: 2, author: "FOMO Team",
      text: "We shipped a public market Calendar inside Buzz — token unlocks, TGE/ICO, listings, drops, launches and FOMO platform events, all in one place with Today/Week/Month views." }),
    mkNews({ title: "FOMO Update: Community Feed & Topics are live", d: 4, section: "fomo-update", tags: ["FOMO", "Community"], readTime: 2, author: "FOMO Team",
      text: "The Buzz community Feed is now live with Topics, discussions, reactions, follows and Top Contributors. Start a topic, follow analysts and join the conversation." }),
    mkNews({ title: "FOMO Academy: How token unlocks affect price", d: 5, section: "fomo-academy", tags: ["Education", "Unlocks"], readTime: 6, author: "FOMO Academy",
      text: "A practical guide to reading unlock schedules: cliff vs linear vesting, float vs FDV, and how to anticipate supply-driven volatility around major unlock dates." }),
  ];
  await news.insertMany(newsDocs);

  console.log(JSON.stringify({
    topics: topicDocs.length,
    replies: replyDocs.length,
    news: newsDocs.length,
    follows: "alice<->bob, both->admin",
  }, null, 2));

  await client.close();
})().catch((e) => { console.error(e); process.exit(1); });
