/**
 * Seed 3 EarlyLand **Prime** activity cards (Monad + Berachain + MegaETH) so the
 * public EarlyLand Prime tab and access/redaction logic have real content while
 * the DB is empty (fresh pod). These are the restored "test Prime cards".
 *
 * Collection: `activities` (model FomoV2Activity).
 * Public read requires: publicationStatus="published", publishedSnapshot,
 * publishedMetadata, hiddenAt=null. Prime gating via publishedMetadata.accessTier="prime".
 *
 * Idempotent: upsert by slug. Safe to re-run.
 * Usage: node /app/fomo-backend/scripts/seed-earlyland-prime.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { MongoClient } = require("mongodb");

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const DB_NAME = (process.env.DB_NAME || "fomo_dev").trim();
const now = new Date();

function content({ name, symbol, category, ecosystem, about, reviewText, steps }) {
  return {
    name,
    projectName: name,
    symbol,
    logo: "",
    projectLogo: "",
    score: "9.2",
    activityType: "Testnet",
    category,
    difficulty: "medium",
    cost: "Free",
    timeEstimate: "20 min",
    taskFrequency: "daily",
    isHot: true,
    rewardLabel: "Potential Airdrop",
    ecosystem: [ecosystem],
    platform: ["Web"],
    tags: [ecosystem, "Testnet", "Airdrop", "Prime"],
    requirements: ["Web3 wallet", "Testnet funds"],
    approxStartDate: "2026-01-01",
    approxEndDate: "2026-06-30",
    timezone: "UTC",
    description: {
      about,
      aboutHtml: `<p>${about}</p>`,
      howToParticipate: "Connect wallet, complete the guided steps and stay active.",
      howToParticipateHtml: "<p>Connect wallet, complete the guided steps and stay active.</p>",
    },
    participants: 12840,
    fundsRaised: 225000000,
    joinLink: "https://fomo.cx",
    links: [{ label: "Official site", url: "https://fomo.cx" }],
    // Prime-gated editorial sections (isLocked=true → redacted for non-entitled)
    review: {
      text: reviewText,
      textHtml: `<p>${reviewText}</p>`,
      scores: [
        { label: "Team", value: 9 },
        { label: "Tokenomics", value: 8 },
      ],
      isLocked: true,
    },
    taskGuide: {
      title: `${name} Prime Guide`,
      description: "Exclusive step-by-step Prime walkthrough.",
      descriptionHtml: "<p>Exclusive step-by-step Prime walkthrough.</p>",
      ctaLabel: "Start",
      ctaUrl: "https://fomo.cx",
      successMessage: "Task completed!",
      isLocked: true,
      steps: steps.map((s, i) => ({
        id: `step-${i + 1}`,
        title: s,
        description: s,
        descriptionHtml: `<p>${s}</p>`,
        timeEstimate: "5 min",
      })),
    },
  };
}

const CARDS = [
  {
    slug: "monad-testnet-prime",
    name: "Monad Testnet",
    symbol: "MON",
    category: "Layer 1",
    ecosystem: "Monad",
    lifecycleStatus: "active",
    about:
      "Monad is a high-performance EVM-compatible L1 with parallel execution. Complete the Prime testnet track for potential rewards.",
    reviewText:
      "Prime review: Monad's parallel EVM and strong backers (Paradigm-led $225M) make this a top-tier testnet to farm early.",
    steps: ["Bridge to Monad testnet", "Swap on a Monad DEX", "Provide liquidity", "Mint a testnet NFT", "Daily check-in x7"],
  },
  {
    slug: "berachain-prime-guide",
    name: "Berachain",
    symbol: "BERA",
    category: "Layer 1",
    ecosystem: "Berachain",
    lifecycleStatus: "active",
    about:
      "Berachain is a Proof-of-Liquidity L1. Follow the Prime guide to maximize your Boyco / airdrop eligibility.",
    reviewText:
      "Prime review: PoL is a novel incentive design. Deep liquidity actions and validator delegation score highest for eligibility.",
    steps: ["Set up wallet", "Deposit into Boyco", "Delegate to a validator", "Bex swaps", "Honey mint"],
  },
  {
    slug: "megaeth-early-access",
    name: "MegaETH",
    symbol: "MEGA",
    category: "Layer 2",
    ecosystem: "MegaETH",
    lifecycleStatus: "upcoming",
    about:
      "MegaETH is a real-time Ethereum L2 targeting 100k+ TPS. Prime early-access track for testnet participants.",
    reviewText:
      "Prime review: real-time L2 with impressive throughput demos. Early testnet users are historically well rewarded.",
    steps: ["Join testnet", "Claim faucet", "Deploy a demo contract", "Interact daily", "Refer a friend"],
  },
];

async function main() {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  const col = db.collection("activities");

  for (const card of CARDS) {
    const body = content(card);
    const doc = {
      slug: card.slug,
      sourceKeys: [],
      sources: [{ source: "manual", sourceUrl: "https://fomo.cx", lastSeenAt: now }],
      sourceSnapshotIds: [],
      canonicalResolution: { status: "unprocessed", candidates: [] },
      lifecycleStatus: card.lifecycleStatus,
      reviewStatus: "published",
      publicationStatus: "published",
      accessTier: "prime",
      isSponsored: false,
      sponsoredPriority: 0,
      currentDraft: body,
      publishedSnapshot: body,
      publishedMetadata: {
        slug: card.slug,
        lifecycleStatus: card.lifecycleStatus,
        accessTier: "prime",
      },
      manualOverrideFields: [],
      aiProposals: [],
      revision: 1,
      auditTrail: [
        { action: "publish", actor: "seed-earlyland-prime", at: now, revision: 1, note: "seeded prime card" },
      ],
      publishedAt: now,
      publishedBy: "seed-earlyland-prime",
      hiddenAt: null,
      updatedAt: now,
    };
    const res = await col.updateOne(
      { slug: card.slug },
      { $set: doc, $setOnInsert: { createdAt: now } },
      { upsert: true },
    );
    console.log(`[seed-prime] ${card.slug}: ${res.upsertedCount ? "inserted" : "updated"}`);
  }

  const total = await col.countDocuments({ "publishedMetadata.accessTier": "prime", publicationStatus: "published" });
  console.log(`[seed-prime] published prime activities now = ${total}`);
  await client.close();
}

main().catch((e) => {
  console.error("[seed-prime] failed:", e);
  process.exit(1);
});
