/**
 * Seed mock "Fomie" accounts (platform users) so the public Fomies tab
 * (Crypto -> Fomies) and profile pages render real content while the DB is empty.
 *
 * A Fomie == a User document with role:["user"] and isCodeActivated:true.
 * Leaderboard:  GET /api/user/fomonauts/all         (buildUserPipeline)
 * Statistics:   GET /api/user/fomonauts/statistics  (totalFomies/verified/avgXP/topRank)
 * Profile:      GET /api/persons/:userId?type=fomies (transformToPerson)
 *
 * Idempotent: upserts by email. Safe to re-run.
 *
 * Usage:  node /app/fomo-backend/scripts/seed-fomies.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { MongoClient, ObjectId } = require("mongodb");

const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017";
const DB_NAME = (process.env.DB_NAME || "fomoland").trim();

const now = new Date();

/** activityXP -> rank name (mirrors user.service getFomiesStatistics). */
function rankForXp(xp) {
  if (xp >= 900) return "Universal Enlightenment";
  if (xp >= 800) return "Astral Sage";
  if (xp >= 600) return "Celestial Master";
  if (xp >= 400) return "Galactic Navigator";
  if (xp >= 200) return "Cosmic Explorer";
  return "Stellar Awakening";
}

function makeFomie(overrides) {
  const activityXP = overrides.activityXP ?? 0;
  return {
    // identity
    email: overrides.email,
    name: overrides.name,
    username: overrides.username,
    wallet: overrides.wallet, // must be unique
    photo: overrides.photo || "",
    bio: overrides.bio || "",
    specialization: overrides.specialization || "",
    authProvider: "wallet",
    fomoId: overrides.fomoId,

    // access / role (required to appear in fomonauts pipeline)
    role: ["user"],
    isCodeActivated: true,
    isActive: true,
    banned: false,
    is2FAEnabled: false,
    emailNotification: true,

    // reputation / rating
    rating: overrides.rating || "0",
    fomoScore: overrides.fomoScore ?? 0,
    fullness: overrides.fullness || "0%",
    fullnessBreakdown: {},
    activityXP,
    rank: rankForXp(activityXP),
    verificationStatus: overrides.verificationStatus ?? false,

    // flags (green / red)
    redFlags: overrides.redFlagsList ? overrides.redFlagsList.length : 0,
    redFlagsList: overrides.redFlagsList || [],
    greenFlagsList: overrides.greenFlagsList || [],

    // social / engagement
    followers: [],
    followersCount: overrides.followersCount ?? 0,
    following: [],
    likes: [],
    dislikes: [],
    reviewLikes: Array.isArray(overrides.reviewLikes)
      ? overrides.reviewLikes
      : Array.from({ length: Number(overrides.reviewLikes) || 0 }, () => new ObjectId()),
    reviewDislikes: Array.isArray(overrides.reviewDislikes)
      ? overrides.reviewDislikes
      : Array.from({ length: Number(overrides.reviewDislikes) || 0 }, () => new ObjectId()),
    socialNetworks: overrides.socialNetworks || [],
    twitterData: {},
    discordData: {},
    parsingTwitterData: {},
    twitterScore: overrides.twitterScore ?? 0,
    previousTwitterScore: 0,
    twitterScoreUpdate: now,

    // investor-ish fields used by profile mapping
    regionData: overrides.regionData || null,
    totalInvested: overrides.totalInvested ?? 0,
    averageRoi: overrides.averageRoi ?? 0,
    averageInvestments: 0,
    numberOfDeals: 0,

    // arrays / limits (mirror existing user doc defaults)
    actions: [],
    activity: [],
    blockedUsers: [],
    claimedProjects: [],
    claimedTasks: [],
    events: [],
    eventsLimit: 5,
    funds: [],
    fundLimit: 5,
    investedProjects: [],
    invitedBoards: [],
    multichainwallet: [],
    news: [],
    newsLimit: 5,
    nfts: [],
    nftsLimit: 5,
    nftsValue: 0,
    notifications: [],
    isMenuDisplay: false,

    // timestamps
    createDate: now,
    createdAt: now,
    onlineDate: now,
    lastLogin: now,
    lastReset: now,
    hoursOnline: overrides.hoursOnline ?? 0,
  };
}

const FOMIES = [
  makeFomie({
    email: "alice.fomie@fomo.local",
    name: "Alice Nakamoto",
    username: "alice_nakamoto",
    wallet: "0xFocusA11ce0000000000000000000000000A11CE",
    photo: "https://i.pravatar.cc/300?u=alice.fomie@fomo.local",
    bio: "On-chain researcher. Loves clean data and verified sources.",
    specialization: "Research & Analytics",
    fomoId: 1001,
    rating: "82",
    fomoScore: 82,
    fullness: "88%",
    activityXP: 720, // Celestial Master
    verificationStatus: true,
    followersCount: 1280,
    reviewLikes: 214,
    twitterScore: 76,
    totalInvested: 45000,
    averageRoi: 3.2,
    regionData: { region: "Europe", country: "Germany" },
    socialNetworks: [
      { type: "twitter", url: "https://twitter.com/alice_nakamoto" },
    ],
    greenFlagsList: [
      { text: "Consistently verified project sources", links: "https://fomo.cx", type: true },
      { text: "High-quality moderation feedback", links: "", type: true },
    ],
    redFlagsList: [],
  }),
  makeFomie({
    email: "bob.fomie@fomo.local",
    name: "Bob Buterin",
    username: "bob_buterin",
    wallet: "0xFocusB0b00000000000000000000000000000B0B",
    photo: "https://i.pravatar.cc/300?u=bob.fomie@fomo.local",
    bio: "Community contributor. Reports scams and posts useful data fixes.",
    specialization: "Community & Moderation",
    fomoId: 1002,
    rating: "64",
    fomoScore: 64,
    fullness: "71%",
    activityXP: 350, // Cosmic Explorer
    verificationStatus: false,
    followersCount: 430,
    reviewLikes: 88,
    twitterScore: 51,
    totalInvested: 12000,
    averageRoi: 1.7,
    regionData: { region: "Asia", country: "Singapore" },
    socialNetworks: [
      { type: "twitter", url: "https://twitter.com/bob_buterin" },
    ],
    greenFlagsList: [
      { text: "Submitted a useful scam report (confirmed)", links: "", type: true },
    ],
    redFlagsList: [
      { text: "One rejected low-quality report", links: "", type: false },
    ],
  }),
];

(async () => {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db(DB_NAME);
  const users = db.collection("users");

  console.log(`[seed-fomies] DB=${DB_NAME}  users before=${await users.countDocuments()}`);

  for (const fomie of FOMIES) {
    const res = await users.updateOne(
      { email: fomie.email },
      { $set: fomie, $setOnInsert: { _id: new ObjectId() } },
      { upsert: true }
    );
    const doc = await users.findOne({ email: fomie.email }, { projection: { _id: 1 } });
    console.log(
      `[seed-fomies] ${res.upsertedCount ? "created" : "updated"}: ${fomie.name} ` +
        `(id=${doc?._id})  /crypto/fomies/${doc?._id}`
    );
  }

  const total = await users.countDocuments({ role: ["user"], isCodeActivated: true });
  console.log(`[seed-fomies] fomie users now=${total}`);
  await client.close();
  console.log("[seed-fomies] done.");
})().catch((e) => {
  console.error("[seed-fomies] ERROR:", e);
  process.exit(1);
});
