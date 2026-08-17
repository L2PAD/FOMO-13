import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import { Connection } from "mongoose";
import { EJSON } from "bson";
import * as fs from "fs";
import * as path from "path";

/**
 * Demo bootstrap seeder — idempotent, runs on app start.
 *
 * Purpose: after a DB dump / fresh deployment the demo environment must recover
 * WITHOUT any manual action and WITHOUT re-creating data by hand:
 *   1. EarlyLand test projects (Monad / Berachain / MegaETH) in `activities`.
 *   2. Mock ad campaigns + creatives so the advertising logic is visible on the
 *      public site (paid slots render real demo banners; unfilled slots keep the
 *      existing "Advertise here" placeholder — that logic is untouched).
 *
 * NO new advertising/activity logic is introduced here. This only restores
 * pre-existing mock data via raw collection writes (schema-faithful, insert-only).
 */
@Injectable()
export class BootstrapSeedService implements OnModuleInit {
  private readonly logger = new Logger("BootstrapSeed");

  constructor(@InjectConnection() private readonly conn: Connection) {}

  async onModuleInit() {
    try {
      await this.seedDemoActivities();
      await this.seedDemoAdvertising();
      await this.seedLayoutPromo();
    } catch (e: any) {
      this.logger.warn(`bootstrap seed skipped: ${e?.message || e}`);
    }
  }

  /**
   * Persist the promo-banner config (FOMO AI / FOMO Intel pills) so the feature
   * is live right after a deploy. STRICTLY non-destructive: only writes `promo`
   * when it is missing — an admin-edited config is always preserved, and no
   * other layout fields are touched.
   */
  private async seedLayoutPromo() {
    const coll = this.conn.collection("layouts");
    const layout: any = await coll.findOne({});
    const defaultPromo = {
      mode: "both",
      rotateSeconds: 10,
      ai: { enabled: true, label: "FOMO AI", subtitle: "Your crypto research copilot", url: "/utility/ai" },
      intel: { enabled: true, label: "FOMO Intel", subtitle: "Pro-grade market intelligence", url: "https://i.fomo.cx/" },
    };
    if (!layout) {
      await coll.insertOne({ header: {}, intelUrl: defaultPromo.intel.url, promo: defaultPromo });
      this.logger.log("layout promo seeded (new layout doc)");
      return;
    }
    if (!layout.promo) {
      const patch: any = { promo: defaultPromo };
      if (!layout.intelUrl) patch.intelUrl = defaultPromo.intel.url; // keep legacy link in sync only if absent
      await coll.updateOne({ _id: layout._id }, { $set: patch });
      this.logger.log("layout promo seeded (existing layout — promo was missing, other fields preserved)");
    } else {
      this.logger.log("layout promo already present — preserved (no overwrite)");
    }
  }

  /** Restore the 3 EarlyLand Prime test activities from a static fixture. */
  private async seedDemoActivities() {
    const fixturePath = path.join(__dirname, "fixtures", "demo-activities.json");
    if (!fs.existsSync(fixturePath)) {
      this.logger.warn("demo-activities fixture missing — skip activity seed");
      return;
    }
    const raw = fs.readFileSync(fixturePath, "utf-8");
    const docs = EJSON.parse(raw) as any[];
    const coll = this.conn.collection("activities");
    let inserted = 0;
    for (const doc of docs) {
      const exists = await coll.findOne({ slug: doc.slug }, { projection: { _id: 1 } });
      if (exists) continue;
      await coll.insertOne(doc);
      inserted++;
    }
    this.logger.log(`demo activities ensured: ${docs.length} (inserted: ${inserted})`);
  }

  /** Restore mock advertiser + demo ad campaigns + creatives (all demo=true). */
  private async seedDemoAdvertising() {
    const campaignsColl = this.conn.collection("ad_campaigns");
    const creativesColl = this.conn.collection("ad_creatives");
    const advertisersColl = this.conn.collection("ad_advertisers");

    // If demo campaigns already exist, nothing to do.
    const existingDemo = await campaignsColl.countDocuments({ demo: true });
    if (existingDemo > 0) {
      this.logger.log(`demo ad campaigns already present: ${existingDemo}`);
      return;
    }

    const now = new Date();
    const startAt = new Date(now.getTime() - 24 * 3600 * 1000); // yesterday
    const endAt = new Date(now.getTime() + 365 * 24 * 3600 * 1000); // +1y

    // Single demo advertiser.
    let advertiser = await advertisersColl.findOne({ name: "FOMO Demo Advertiser" });
    if (!advertiser) {
      const res = await advertisersColl.insertOne({
        name: "FOMO Demo Advertiser",
        contactEmail: "demo@fomo.local",
        website: "https://fomo.fund",
        logoUrl: "",
        notes: "Auto-seeded demo advertiser (bootstrap).",
        createdAt: now,
        updatedAt: now,
      });
      advertiser = await advertisersColl.findOne({ _id: res.insertedId });
    }

    // Self-contained SVG placeholder banner (no external requests, no AI).
    const banner = (title: string, from: string, to: string, w = 1200, h = 300) => {
      const svg =
        `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>` +
        `<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>` +
        `<stop offset='0%' stop-color='${from}'/><stop offset='100%' stop-color='${to}'/>` +
        `</linearGradient></defs>` +
        `<rect width='100%' height='100%' fill='url(#g)'/>` +
        `<text x='50%' y='50%' fill='#ffffff' font-family='Arial,Helvetica,sans-serif' ` +
        `font-size='${Math.round(h / 6)}' font-weight='700' text-anchor='middle' ` +
        `dominant-baseline='middle'>${title}</text></svg>`;
      return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    };

    // Demo campaigns spread across representative placements so the delivery
    // logic is visible on the site. Each carries exactly one creative.
    const specs: Array<{
      name: string;
      placements: string[];
      creative: any;
    }> = [
      {
        name: "[DEMO] FOMO AI — Global Banner",
        placements: ["GLOBAL_TOP_BANNER"],
        creative: {
          type: "text",
          brandName: "FOMO AI",
          headline: "Meet FOMO AI — your crypto research copilot",
          ctaLabel: "Try FOMO AI",
          destinationUrl: "/utility/ai",
          variant: "gradient",
          displaySize: "compact",
          sponsoredLabel: "Ad",
        },
      },
      {
        name: "[DEMO] EarlyLand Prime — Home Hero",
        placements: ["HOME_HERO"],
        creative: {
          type: "image",
          brandName: "EarlyLand Prime",
          imageUrl: banner("EarlyLand Prime", "#6d28d9", "#2563eb"),
          headline: "Unlock EarlyLand Prime activities",
          description: "Monad, Berachain, MegaETH and more — early, curated, verified.",
          ctaLabel: "Explore Prime",
          destinationUrl: "/crypto/earlyland",
          variant: "gradient",
          displaySize: "standard",
          sponsoredLabel: "Sponsored",
        },
      },
      {
        name: "[DEMO] GemsLab — Featured Slide",
        placements: ["GEMSLAB_SLIDES"],
        creative: {
          type: "image",
          brandName: "GemsLab",
          imageUrl: banner("GemsLab Spotlight", "#0f766e", "#22d3ee", 1280, 720),
          headline: "Featured gem of the week",
          description: "Discover early-stage projects hand-picked by FOMO analysts.",
          ctaLabel: "View gem",
          destinationUrl: "/gemslab",
          variant: "gradient",
          displaySize: "standard",
          sponsoredLabel: "Sponsored",
        },
      },
      {
        name: "[DEMO] Crypto — Promoted Project",
        placements: ["CRYPTO_PROMOTED"],
        creative: {
          type: "text",
          brandName: "Monad",
          headline: "Monad testnet is live — join early",
          description: "High-performance L1. Get in before mainnet.",
          ctaLabel: "Learn more",
          destinationUrl: "/crypto",
          variant: "gradient",
          displaySize: "compact",
          sponsoredLabel: "Promoted",
        },
      },
      {
        name: "[DEMO] EarlyLand — Feed Banner",
        placements: ["EARLYLAND_FEED"],
        creative: {
          type: "text",
          brandName: "MegaETH",
          headline: "MegaETH early access",
          description: "Real-time Ethereum. Reserve your slot.",
          ctaLabel: "Get access",
          destinationUrl: "/crypto/earlyland",
          variant: "gradient",
          displaySize: "compact",
          sponsoredLabel: "Promoted",
        },
      },
      {
        name: "[DEMO] Echo — In-Feed Ad",
        placements: ["ECHO_FEED"],
        creative: {
          type: "image",
          brandName: "FOMO Intel",
          imageUrl: banner("FOMO Intel", "#b45309", "#f59e0b", 800, 400),
          headline: "Trade smarter with FOMO Intel",
          description: "Signals, sentiment and on-chain analytics in one place.",
          ctaLabel: "Open FOMO Intel",
          destinationUrl: "/utility/memberships",
          variant: "gradient",
          displaySize: "standard",
          sponsoredLabel: "Ad",
        },
      },
    ];

    let campaigns = 0;
    let creatives = 0;
    for (const s of specs) {
      const campaignDoc = {
        advertiserId: advertiser?._id,
        advertiserName: "FOMO Demo Advertiser",
        name: s.name,
        objective: "awareness",
        status: "active",
        pricingModel: "fixed",
        rate: 0,
        budget: 0, // unlimited — sponsorship/demo, always eligible
        spend: 0,
        startAt,
        endAt,
        placements: s.placements,
        priority: 5,
        targeting: {},
        frequencyCap: {},
        pacing: "asap",
        timezone: "UTC",
        demo: true,
        report: {},
        createdBy: "bootstrap-seed",
        updatedBy: "bootstrap-seed",
        createdAt: now,
        updatedAt: now,
      };
      const res = await campaignsColl.insertOne(campaignDoc);
      campaigns++;

      await creativesColl.insertOne({
        campaignId: res.insertedId,
        logoUrl: "",
        mobileImageUrl: "",
        imageUrl: "",
        alt: s.creative.headline,
        template: "minimal",
        kindOverride: "",
        progress: 0,
        progressLabel: "",
        enabled: true,
        demo: true,
        highlights: [],
        createdAt: now,
        updatedAt: now,
        ...s.creative,
      });
      creatives++;
    }

    this.logger.log(`demo advertising ensured: ${campaigns} campaigns, ${creatives} creatives`);
  }
}
