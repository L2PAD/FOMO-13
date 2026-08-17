import { validateRawEnvelope, RATING_SCHEMA_VERSION } from "./rating-raw-dto";
import {
  normalizeFund,
  normalizeTwitter,
  normalizeUser,
  normalizeTrade,
} from "./rating-normalizer";
import {
  ManualPreviewProvider,
  MockRatingDataProvider,
  TwitterParserProvider,
} from "./rating-providers";
import { buildProvenance } from "./rating-provenance";
import { RatingInputSnapshotService } from "./rating-input-snapshot.service";

describe("Rating integration — contract-first layer", () => {
  /* ------------------------- DTO validation ------------------------- */
  describe("validateRawEnvelope", () => {
    it("rejects missing source and non-object payload", () => {
      const r = validateRawEnvelope("twitter", { payload: null });
      expect(r.valid).toBe(false);
      expect(r.errors.join(" ")).toMatch(/source is required/);
      expect(r.errors.join(" ")).toMatch(/payload must be an object/);
    });

    it("rejects unknown entityType and future schemaVersion", () => {
      const r = validateRawEnvelope("aliens", {
        source: "x",
        schemaVersion: RATING_SCHEMA_VERSION + 5,
        payload: {},
      });
      expect(r.valid).toBe(false);
      expect(r.errors.join(" ")).toMatch(/Unknown entityType/);
      expect(r.errors.join(" ")).toMatch(/newer than supported/);
    });

    it("validates twitter payload shape and fills defaults", () => {
      const bad = validateRawEnvelope("twitter", { source: "p", payload: { followers: "lots" } });
      expect(bad.valid).toBe(false);
      const ok = validateRawEnvelope("twitter", {
        source: "twitter-parser",
        payload: { followers: 1000, posts: [] },
      });
      expect(ok.valid).toBe(true);
      expect(ok.envelope!.schemaVersion).toBe(RATING_SCHEMA_VERSION);
      expect(ok.envelope!.source).toBe("twitter-parser");
    });
  });

  /* --------------------------- normalizer --------------------------- */
  describe("normalizeFund", () => {
    it("derives exit count/ratio/median and roi from raw, longevity from foundedAt", () => {
      const founded = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 5).toISOString(); // ~5y
      const { input, present } = normalizeFund({
        foundedAt: founded,
        exits: [
          { realisedRoi: 3, verified: true },
          { realisedRoi: 0.5, verified: true },
          { realisedRoi: 5, verified: true },
        ],
        portfolioReturns: [
          { realisedRoi: 2, verified: true },
          { unrealisedRoi: 0.8 },
        ],
      });
      expect(present.longevity).toBe(true);
      expect(input.longevity).toBeGreaterThanOrEqual(59); // ~60 months
      expect(input.exits.successfulCount).toBe(2); // roi>1
      expect(input.exits.successRatio).toBeCloseTo(2 / 3, 2);
      expect(input.exits.medianRealisedRoi).toBe(4); // median(3,5)
      expect(input.roi.profitableRatio).toBeCloseTo(0.5, 2);
      expect(input.roi.realisedShare).toBeCloseTo(0.5, 2);
    });

    it("excludes crises the fund did not live through, and maps jurisdiction points", () => {
      const founded = "2021-01-01"; // after 2018/2020 crises
      const refs = {
        jurisdictions: { us: 15 },
        crises: {
          crypto_winter_2018: { startDate: "2018-01-16", enabled: true },
          ftx_collapse_2022: { startDate: "2022-11-06", enabled: true },
        },
      };
      const { input, present } = normalizeFund(
        {
          foundedAt: founded,
          jurisdictionCode: "US",
          licenseIds: ["lic-1"],
          regulatoryIncidents: 0,
          crisisEvidence: [
            { crisisId: "crypto_winter_2018", operationalContinuity: 90 }, // before founding -> skip
            { crisisId: "ftx_collapse_2022", operationalContinuity: 80, portfolioSurvival: 70, noCriticalDefaults: 100, continuedActivity: 60, reputationStability: 90 },
          ],
        },
        refs
      );
      expect(input.resilience).toHaveLength(1);
      expect(input.resilience[0].name).toBe("ftx_collapse_2022");
      expect(input.compliance.jurisdictionPoints).toBe(15);
      expect(input.compliance.hasLicense).toBe(true);
      expect(input.compliance.noLegalIncidents).toBe(true);
      expect(present.resilience).toBe(true);
    });

    it("marks components missing when raw absent", () => {
      const { present } = normalizeFund({});
      expect(present.exits).toBe(false);
      expect(present.roi).toBe(false);
      expect(present.resilience).toBe(false);
      expect(present.compliance).toBe(false);
    });
  });

  describe("normalizeTwitter", () => {
    it("derives followers + audience quality from sample", () => {
      const { input, present } = normalizeTwitter({
        followers: 1000,
        audienceSample: [
          { postCount: 5, isRatedEntity: true, cryptoRelevance: 0.8, suspiciousProbability: 0.1 },
          { postCount: 0, isRatedEntity: false, cryptoRelevance: 0.2, suspiciousProbability: 0.3 },
        ],
      });
      expect(input.followers).toBe(1000);
      expect(present.quality).toBe(true);
      expect(input.quality.realAccountRatio).toBeCloseTo(0.8, 2); // 1 - avg(0.2)
      expect(input.quality.activeFollowerRatio).toBeCloseTo(0.5, 2);
      expect(input.quality.topFollowerScore).toBeCloseTo(50, 1);
    });
  });

  describe("normalizeUser", () => {
    it("maps the 6 platform components and flags presence", () => {
      const { input, present } = normalizeUser({
        activeDays30: 20,
        meaningfulSessions30: 30,
        validComments: 10,
        reactions: 40,
        farmingSignals: 2,
        usefulReports: 5,
        tasks: [{ basePoints: 5, difficulty: 2, verification: 1, quality: 1, campaignImportance: 1.5 }],
        nfts: [{ tier: 3, heldDays: 300, activeUtility: 80 }],
        referrals: { activeL1: 8, retainedL1: 6, activeL2: 4 },
      });
      expect(present.platformEngagement).toBe(true);
      expect(present.contentInteraction).toBe(true);
      expect(present.meaningfulContribution).toBe(true);
      expect(present.earlyland).toBe(true);
      expect(present.nft).toBe(true);
      expect(present.referrals).toBe(true);
      expect(input.platformActivity.nft.owns).toBe(true);
      expect(input.platformActivity.referrals.retention).toBeCloseTo(0.75, 2);
    });
  });

  describe("normalizeTrade", () => {
    it("aggregates valid trades and excludes self/open-dispute", () => {
      const { input, present } = normalizeTrade({
        otcTrades: [
          { usdtEquivalentAtTrade: 1000, review: 5, counterpartyId: "a", valid: true },
          { usdtEquivalentAtTrade: 5000, review: 4, counterpartyId: "b", valid: true },
          { usdtEquivalentAtTrade: 9999, counterpartyId: "c", selfTrade: true },
          { usdtEquivalentAtTrade: 1, counterpartyId: "d", disputeStatus: "open" },
        ],
      });
      expect(present.otc).toBe(true);
      expect(input.otc.completedTrades).toBe(2);
      expect(input.otc.volume).toBe(6000);
      expect(input.otc.uniqueCounterparties).toBe(2);
      expect(input.otc.avgReview).toBeCloseTo(4.5, 2);
    });
  });

  /* ---------------------------- providers --------------------------- */
  describe("providers", () => {
    it("ManualPreviewProvider returns null for unknown id, payload for known", async () => {
      const p = new ManualPreviewProvider<{ followers: number }>({ acc1: { followers: 5 } });
      expect(await p.getRaw("nope")).toBeNull();
      const env = await p.getRaw("acc1");
      expect(env!.source).toBe("admin-preview");
      expect(env!.payload.followers).toBe(5);
    });

    it("MockRatingDataProvider labels its source mock", async () => {
      const p = new MockRatingDataProvider<{ x: number }>((id) => ({ x: id.length }));
      const env = await p.getRaw("abc");
      expect(env.source).toBe("mock");
      expect(env.payload.x).toBe(3);
    });

    it("future real providers are stubs that throw NotImplemented", async () => {
      await expect(TwitterParserProvider().getRaw("x")).rejects.toThrow(/not implemented/i);
    });
  });

  /* --------------------------- provenance --------------------------- */
  describe("buildProvenance", () => {
    it("marks mock, derived, missing and stale correctly", () => {
      const derived = buildProvenance("twitter", "twitter-parser", new Date().toISOString(), { followers: "derived", quality: "missing" }, 60, ["quality"]);
      expect(derived.components.followers.mode).toBe("derived");
      expect(derived.components.quality.mode).toBe("missing");
      expect(derived.mode).toBe("derived");

      const mock = buildProvenance("twitter", "mock", undefined, { followers: "derived" }, 100, []);
      expect(mock.components.followers.mode).toBe("mock");

      const old = new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(); // 60d, ttl twitter=7
      const stale = buildProvenance("twitter", "twitter-parser", old, { followers: "derived" }, 100, []);
      expect(stale.components.followers.mode).toBe("stale");
      expect(stale.components.followers.stale).toBe(true);
      expect(stale.freshness).toBeLessThan(50);
    });
  });

  /* ------------------------ snapshot checksum ----------------------- */
  describe("snapshot idempotency checksum", () => {
    it("same payload -> same checksum, different -> different", () => {
      const a = RatingInputSnapshotService.checksum({ x: 1, y: [1, 2] });
      const b = RatingInputSnapshotService.checksum({ x: 1, y: [1, 2] });
      const c = RatingInputSnapshotService.checksum({ x: 2, y: [1, 2] });
      expect(a).toBe(b);
      expect(a).not.toBe(c);
      expect(a).toHaveLength(64);
    });
  });
});
