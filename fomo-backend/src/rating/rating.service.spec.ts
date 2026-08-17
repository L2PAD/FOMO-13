import { RatingService } from "./rating.service";
import type { UnifiedScoreResult } from "./unified/unified-rating.types";

/**
 * Single-source-of-truth compatibility spec.
 *
 * After the migration, RatingService is a COMPATIBILITY ADAPTER: it no longer
 * computes the legacy ico/market/user formulas as the authoritative score.
 * Every public scoring method must delegate to the canonical unified engine
 * (RatingCanonicalService) and simply reshape the result into the legacy
 * payload. These tests assert that delegation (one entity -> one score) using
 * a stubbed canonical service, so there is no dependency on Mongo.
 */
const makeUnified = (
  score: number,
  completeness: number
): UnifiedScoreResult => ({
  score,
  level: "tier-2",
  formulaVersion: "rating-v2",
  calculatedAt: new Date().toISOString(),
  completeness,
  components: {
    alpha: { raw: 80, weight: 0.5, contribution: score * 0.6, source: "derived" },
    beta: { raw: 40, weight: 0.5, contribution: score * 0.4, source: "missing" },
  },
  penalties: [{ key: "redFlags", value: -5, reason: "1 red flag" }],
  missingFields: ["beta"],
});

describe("RatingService — single source of truth (adapter)", () => {
  const project = makeUnified(58.35, 66.6);
  const user = makeUnified(65.76, 83.33);
  const fund = makeUnified(72.5, 83.33);
  const person = makeUnified(43.55, 50);
  const twitter = makeUnified(61, 100);

  const canonical: any = {
    scoreProjectDoc: jest.fn(() => project),
    scoreUserDoc: jest.fn(() => user),
    scoreFundDoc: jest.fn(() => fund),
    scorePersonDoc: jest.fn(() => person),
    scoreTwitter: jest.fn(() => twitter),
  };
  const service = new RatingService(canonical);

  it("market project score comes from the canonical engine (not legacy market-v1 formula)", () => {
    const scores = service.calculateMarketProjectScores({
      projectType: "market",
      name: "X",
    } as any);
    expect(canonical.scoreProjectDoc).toHaveBeenCalled();
    expect(scores.rating).toBe(58.35);
    expect(scores.fullness).toBe(66.6); // == unified completeness (single metric)
    expect(scores.ratingBreakdown.version).toBe("market-v1"); // legacy shape kept
    expect(scores.ratingBreakdown.penalties).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "redFlags" })])
    );
  });

  it("ico project score also delegates to the canonical engine", () => {
    const scores = service.calculateIcoProjectScores({ projectType: "project" } as any);
    expect(scores.rating).toBe(58.35);
    expect(scores.ratingBreakdown.version).toBe("ico-v1");
  });

  it("user rating delegates to the canonical engine", () => {
    const scores = service.calculateUserScores({ name: "u", isActive: true } as any);
    expect(canonical.scoreUserDoc).toHaveBeenCalled();
    expect(scores.rating).toBe(65.76);
    expect(scores.fullness).toBe(83.33);
    expect(service.calculateUserRating({ name: "u" } as any)).toBe("65.76");
  });

  it("twitter score delegates to the canonical engine and is 0-100", async () => {
    const value = await service.calculateScore({
      followersCount: 1000,
      friendsCount: 10,
      statusesCount: 5,
      isBlueVerified: true,
      followers: [],
      tweets: [],
    } as any);
    expect(canonical.scoreTwitter).toHaveBeenCalled();
    expect(value).toBe(61);
  });
});
