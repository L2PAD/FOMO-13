/**
 * Seed curated DEMO local-banner campaigns — one coherent, understandable
 * campaign per internal product direction. Content is realistic demo data
 * (clearly labelled DEMO) so the admin-configurable local banners can be
 * seen live on every internal page.
 *
 * Run: node scripts/seed-local-ads.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const URI = process.env.DB_URL || process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME || undefined;

const now = () => new Date();

// direction → { placements[], campaign, creative }
const DEMO = [
  {
    key: 'spaceport',
    placements: ['SPACEPORT_FEED'],
    brand: 'FOMO Spaceport',
    template: 'facts',
    kindOverride: 'NFT Mint · early access',
    headline: 'Mint FOMO NFT — early platform access',
    description: 'The mint unlocks 30-day platform / Launchpad access, holder privileges and Fusion (rarity upgrades). We sell the mint — not staking or API.',
    ctaLabel: 'Mint now',
    destinationUrl: 'https://fomo.cx/spaceport',
    highlights: [
      { label: 'Mint price', value: '100 USDT' },
      { label: 'Access', value: '30 days' },
      { label: 'Max / wallet', value: '4' },
      { label: 'Utility', value: 'Launchpad + Fusion' },
    ],
  },
  {
    key: 'launchpad',
    placements: ['LAUNCHPAD_FEATURED'],
    brand: 'Nexus Protocol',
    template: 'deal',
    kindOverride: 'Launchpad · public round',
    headline: 'Nexus — public round is live',
    description: 'Modular L2 focused on settlement speed. Early access for holders.',
    ctaLabel: 'Join round',
    destinationUrl: 'https://fomo.cx/launchpad/nexus',
    progress: 68,
    progressLabel: 'Raised',
    highlights: [
      { label: 'Deal type', value: 'Public Sale' },
      { label: 'Allocation', value: '$250 / user' },
      { label: 'Token price', value: '$0.045' },
      { label: 'Network', value: 'Arbitrum' },
      { label: 'Min entry', value: '$50', link: 'https://fomo.cx/launchpad/nexus#join' },
    ],
  },
  {
    key: 'otc',
    placements: ['OTC_MARKET', 'BAZAR_FEED'],
    brand: 'FOMO OTC Desk',
    template: 'offer',
    kindOverride: 'OTC · listing',
    headline: 'OTC: $ARB sale at 6% discount',
    description: 'Verified seller. Escrow deal, settled in USDT.',
    ctaLabel: 'Open deal',
    destinationUrl: 'https://fomo.cx/otc',
    highlights: [
      { label: 'Type', value: 'Sell' },
      { label: 'Asset', value: 'ARB' },
      { label: 'Price', value: '$0.98 (−6%)' },
      { label: 'Volume', value: '50k – 500k' },
      { label: 'Settlement', value: 'USDT · escrow' },
    ],
  },
  {
    key: 'echo',
    placements: ['ECHO_FEED'],
    brand: 'Lumina',
    template: 'deal',
    kindOverride: 'ICO / IDO project',
    headline: 'Lumina ICO — early access',
    description: 'Transaction privacy on L2. Early round for the FOMO community.',
    ctaLabel: 'View project',
    destinationUrl: 'https://fomo.cx/echo/lumina',
    progress: 42,
    progressLabel: 'Round filled',
    highlights: [
      { label: 'Round', value: 'IDO' },
      { label: 'Target', value: '$2.5M' },
      { label: 'Token price', value: '$0.08' },
      { label: 'Launch', value: 'Feb 15' },
      { label: 'Vesting', value: '6 mo · 20% TGE' },
    ],
  },
  {
    key: 'bakers',
    placements: ['BAKERS_FEED'],
    brand: 'a16z crypto',
    template: 'profile',
    kindOverride: 'Fund',
    headline: 'a16z crypto — venture fund',
    description: 'One of the largest crypto funds. Early infrastructure bets.',
    ctaLabel: 'View portfolio',
    destinationUrl: 'https://fomo.cx/backers/a16z',
    highlights: [
      { label: 'Type', value: 'Venture fund' },
      { label: 'AUM', value: '$7.6B' },
      { label: 'Sector', value: 'Infra · DeFi' },
      { label: 'Deals', value: '120+' },
      { label: 'Since', value: '2013' },
    ],
  },
  {
    key: 'fomies',
    placements: ['FOMIES_SPOTLIGHT'],
    brand: '@cryptowhale',
    template: 'profile',
    kindOverride: 'FOMO user',
    headline: 'Top analyst of the week',
    description: 'Community accuracy leader over the last 30 days.',
    ctaLabel: 'Open profile',
    destinationUrl: 'https://fomo.cx/fomies/cryptowhale',
    highlights: [
      { label: 'Reputation', value: '98 / 100' },
      { label: 'Followers', value: '142k' },
      { label: 'Accuracy', value: '76%' },
      { label: 'Activity', value: 'High' },
    ],
  },
  {
    key: 'unlocking',
    placements: ['UNLOCKING_FEED'],
    brand: 'Arbitrum',
    template: 'facts',
    kindOverride: 'Token unlock',
    headline: 'ARB: major unlock coming up',
    description: 'Team and investor unlock. Watch the price impact.',
    ctaLabel: 'Track unlock',
    destinationUrl: 'https://fomo.cx/unlocking/arbitrum',
    highlights: [
      { label: 'Unlock date', value: 'Mar 16' },
      { label: 'Amount', value: '92.65M ARB' },
      { label: '% of supply', value: '2.1%' },
      { label: 'In USD', value: '≈ $88M' },
    ],
  },
  {
    key: 'yuryland',
    placements: ['YURYLAND_FEED', 'EARLYLAND_FEED'],
    brand: 'Monad',
    template: 'facts',
    kindOverride: 'Early activity · drop',
    headline: 'Monad — testnet & potential drop',
    description: 'Complete testnet tasks to qualify for a future drop.',
    ctaLabel: 'Start activity',
    destinationUrl: 'https://fomo.cx/earlyland/monad',
    highlights: [
      { label: 'Type', value: 'Testnet' },
      { label: 'Est. reward', value: '$300 – 1500' },
      { label: 'Deadline', value: 'Mar 31' },
      { label: 'Difficulty', value: 'Low' },
    ],
  },
  {
    key: 'funding',
    placements: ['FUNDING_FEED'],
    brand: 'ZeroLayer',
    template: 'deal',
    kindOverride: 'Project fundraising',
    headline: 'ZeroLayer — Seed round',
    description: 'ZK infrastructure for private payments. Round almost closed.',
    ctaLabel: 'About round',
    destinationUrl: 'https://fomo.cx/funding/zerolayer',
    progress: 82,
    progressLabel: 'Round closed',
    highlights: [
      { label: 'Round', value: 'Seed' },
      { label: 'Raised', value: '$3.2M' },
      { label: 'Valuation', value: '$40M FDV' },
      { label: 'Lead', value: 'Paradigm' },
    ],
  },
];

// Placements that are purely internal-local AND safe to prioritise the demo on.
// Deliberately EXCLUDES CRYPTO_PROMOTED (protected Bybit campaign),
// GLOBAL_TOP_BANNER / HOME_HERO (global sweeping banner — do not touch),
// and ECHO_FEED (its legacy campaign is shared with the global banner).
const LOCAL_ONLY = [
  'SPACEPORT_FEED', 'LAUNCHPAD_FEATURED', 'OTC_MARKET', 'BAZAR_FEED',
  'BAKERS_FEED', 'FOMIES_SPOTLIGHT', 'UNLOCKING_FEED',
  'YURYLAND_FEED', 'EARLYLAND_FEED', 'FUNDING_FEED',
];

(async () => {
  await mongoose.connect(URI, DB_NAME ? { dbName: DB_NAME } : {});
  const db = mongoose.connection.db;
  const campaigns = db.collection('ad_campaigns');
  const creatives = db.collection('ad_creatives');

  // Reset previous DEMO local campaigns (idempotent) — keeps any non-demo data.
  const prev = await campaigns.find({ isDemoLocal: true }).toArray();
  const prevIds = prev.map((c) => c._id);
  if (prevIds.length) {
    await creatives.deleteMany({ campaignId: { $in: prevIds } });
    await campaigns.deleteMany({ _id: { $in: prevIds } });
  }

  let nc = 0;
  let ncr = 0;
  for (const d of DEMO) {
    const campDoc = {
      name: `DEMO · ${d.brand} (${d.key})`,
      objective: 'traffic',
      status: 'active',
      pricingModel: 'cpm',
      rate: 8,
      budget: 0, // unlimited so demo always serves
      spend: 0,
      priority: 50, // dominate rotation so the curated demo is what users see
      placements: d.placements,
      advertiserName: d.brand,
      targeting: { device: 'all', audience: 'all' },
      frequencyCap: { perUserPerDay: 0 },
      isDemoLocal: true,
      demo: true, // excluded from production analytics; flagged in CRM
      createdAt: now(),
      updatedAt: now(),
    };
    const res = await campaigns.insertOne(campDoc);
    nc += 1;
    const creativeDoc = {
      campaignId: res.insertedId,
      type: 'image',
      brandName: d.brand,
      logoUrl: '',
      imageUrl: '',
      mobileImageUrl: '',
      headline: d.headline,
      description: d.description || '',
      ctaLabel: d.ctaLabel || 'Подробнее',
      destinationUrl: d.destinationUrl || '',
      sponsoredLabel: 'Ad',
      variant: 'dark',
      displaySize: 'compact',
      template: d.template || 'facts',
      kindOverride: d.kindOverride || '',
      progress: d.progress || 0,
      progressLabel: d.progressLabel || '',
      alt: '',
      enabled: true,
      demo: true,
      highlights: (d.highlights || []).map((h) => ({ label: h.label, value: h.value, link: h.link || '', source: 'demo' })),
      createdAt: now(),
      updatedAt: now(),
    };
    await creatives.insertOne(creativeDoc);
    ncr += 1;
  }

  console.log(`Seeded ${nc} demo campaigns and ${ncr} creatives across directions.`);

  // Pause older non-demo TEST campaigns that live ONLY on the internal-local
  // placements we are transforming — so the curated demo is what shows.
  // This never touches Bybit (CRYPTO_PROMOTED), the global sweeping banner,
  // the home hero, or any campaign that also targets those surfaces.
  const olds = await campaigns.find({ isDemoLocal: { $ne: true }, status: 'active' }).toArray();
  let paused = 0;
  for (const c of olds) {
    const pls = Array.isArray(c.placements) ? c.placements : [];
    const localOnly = pls.length > 0 && pls.every((p) => LOCAL_ONLY.includes(p));
    if (localOnly) {
      await campaigns.updateOne({ _id: c._id }, { $set: { status: 'paused', pausedByDemoSeed: true } });
      paused += 1;
    }
  }
  console.log(`Paused ${paused} legacy local-only test campaigns (reversible in CRM).`);

  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error('Seed failed:', e.message);
  process.exit(1);
});
