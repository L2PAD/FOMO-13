import { buildDefaultUnifiedRatingConfig } from "./unified-rating.defaults";
import {
  calculateFundScore,
  calculatePersonScore,
  calculateProjectScore,
  calculateTradeReputation,
  calculateTwitterScore,
  calculateUserScore,
  redFlagPenalty,
} from "./unified-rating.engine";

const config = buildDefaultUnifiedRatingConfig();

describe("Unified Rating Engine v2", () => {
  it("Fund: maxed metrics reach 100 and Tier 1", () => {
    const result = calculateFundScore(
      {
        monthsActive: 150, // 120+ months -> longevity tier 25
        // Deal significance (NOT count): 5 lead-in-large-round deals = 5*4 = 20
        majorDeals: [
          { role: "leadLargeRound" },
          { role: "leadLargeRound" },
          { role: "leadLargeRound" },
          { role: "leadLargeRound" },
          { role: "leadLargeRound" },
        ],
        successfulExits: 10, // count cap -> 12.5
        avgRoiMultiple: 8, // >4x -> cap 12.5
        crisesSurvived: 5, // 5*5=25 -> cap 15
        complianceScore: 100, // -> 15
      },
      config.funds
    );
    expect(result.score).toBe(100);
    expect(result.level).toBe("Tier 1");
  });

  it("Fund: longevity uses the canonical realistic tier table", () => {
    // 18 months -> tier [12..24) = 6 points (replaces old 1pt/6mo = 3)
    const result = calculateFundScore({ monthsActive: 18 }, config.funds);
    expect(result.components.longevity.contribution).toBe(6);
  });

  it("Fund: deal significance rewards lead role over plain count", () => {
    const lead = calculateFundScore(
      { majorDeals: [{ role: "leadLargeRound" }] },
      config.funds
    );
    const confirmed = calculateFundScore(
      { majorDeals: [{ role: "confirmed" }] },
      config.funds
    );
    expect(lead.components.majorDeals.contribution).toBe(4);
    expect(confirmed.components.majorDeals.contribution).toBe(1);
    expect(lead.components.majorDeals.source).toBe("derived");
  });

  it("Twitter: all inputs at 100 yields 100", () => {
    const result = calculateTwitterScore(
      {
        followers: config.twitter.normalization.followersMax,
        followerQuality: 100,
        engagementRate: config.twitter.normalization.engagementRateMax,
        postingFrequency: 100,
        reputation: 100,
        cryptoInfluence: 100,
        tier1Audience: 100,
      },
      config.twitter
    );
    expect(result.score).toBe(100);
    expect(result.level).toBe("Very High");
  });

  it("Person: weights sum to 100 so all-100 inputs give 100", () => {
    const weightsSum = Object.values(config.persons.weights).reduce(
      (a, b) => a + b,
      0
    );
    expect(Math.round(weightsSum)).toBe(100);
    const result = calculatePersonScore(
      {
        investingSuccess: 100,
        advisorSuccess: 100,
        twitter: 100,
        marketExperience: 100,
        projectActivity: 100,
        mediaActivity: 100,
        marketInfluence: 100,
        partnerships: 100,
      },
      config.persons,
      config.twitter
    );
    expect(result.score).toBe(100);
  });

  it("Project: user-likes removed, weights renormalised to 100", () => {
    const weightsSum = Object.values(config.projects.weights).reduce(
      (a, b) => a + b,
      0
    );
    expect(Math.round(weightsSum)).toBe(100);
    expect(config.projects.weights).not.toHaveProperty("userLikes");

    const result = calculateProjectScore(
      {
        fundsQuality: 100,
        personsQuality: 100,
        developmentTeam: 100,
        tokenomics: 100,
        niche: 100,
        geography: 100,
        competitors: 100,
        twitter: 100,
        redFlags: 0,
      },
      config.projects,
      config.twitter
    );
    expect(result.score).toBe(100);
    expect(result.level).toBe("Very High");
  });

  it("Project: red flag penalty ladder caps at -30", () => {
    expect(redFlagPenalty(0, config.projects.redFlags)).toBe(0);
    expect(redFlagPenalty(1, config.projects.redFlags)).toBe(15);
    expect(redFlagPenalty(2, config.projects.redFlags)).toBe(20);
    expect(redFlagPenalty(3, config.projects.redFlags)).toBe(22);
    expect(redFlagPenalty(50, config.projects.redFlags)).toBe(30);
  });

  it("Trade: combined weights by completed-trade share", () => {
    // OTC strong, P2P weaker; more OTC trades -> combined closer to OTC.
    const result = calculateTradeReputation(
      {
        volume: 1000000,
        completedTrades: 50,
        avgReview: 5,
        reviewCount: 20,
        uniqueCounterparties: 50,
      },
      {
        volume: 1000,
        completedTrades: 5,
        avgReview: 4,
        reviewCount: 3,
        uniqueCounterparties: 5,
      },
      config.users.trade
    );
    expect(result.otcScore).toBe(100);
    expect(result.combinedTradeScore).toBeGreaterThan(result.p2pScore);
    // otcWeight = 50/55 ~ 0.909
    expect(result.meta?.otcWeight).toBeCloseTo(0.91, 1);
  });

  it("Trade: review confidence dampens single 5-star review", () => {
    const result = calculateTradeReputation(
      { volume: 0, completedTrades: 1, avgReview: 5, reviewCount: 1, uniqueCounterparties: 0 },
      {},
      config.users.trade
    );
    // trades(1)=2 + reviews (5/5)*20*0.25=5 = 7; only OTC active -> combined = otcScore
    expect(result.otcScore).toBe(7);
    expect(result.combinedTradeScore).toBe(result.otcScore);
    expect(result.tradeRank).toBe("🐚 Ракушка");
  });

  it("Trade: critical fraud blocks the direction score", () => {
    const result = calculateTradeReputation(
      { volume: 1000000, completedTrades: 50, avgReview: 5, reviewCount: 20, uniqueCounterparties: 50, criticalFraud: true },
      {},
      config.users.trade
    );
    expect(result.otcScore).toBe(0);
  });

  it("User: platform activity 46.15% + trade 53.85% weighting (Phase 3 model)", () => {
    expect(config.users.weights.platformActivity).toBe(46.15);
    expect(config.users.weights.tradeReputation).toBe(53.85);
    const result = calculateUserScore(
      {
        // New weighted platform model: fully-saturated raw signals -> 100.
        platformActivity: {
          platformEngagement: { activeDays: 30, meaningfulSessions: 60, entityConsumption: 100, returnFrequency: 1, savedFollowed: 50 },
          contentInteraction: { validComments: 40, reactions: 100, shares: 30, saves: 50, discussions: 20, farmingRatio: 0 },
          meaningfulContribution: { usefulReports: 15, dataCorrections: 15, verifiedSources: 10, moderatedContributions: 10, acceptedFeedback: 10 },
          earlyland: { taskPoints: 100 },
          nft: { owns: true, holdingMonths: 24, tier: 4, activeUse: 100 },
          referrals: { activeL1: 20, activeL2: 40, retention: 1 },
        },
        otc: { volume: 1000000, completedTrades: 50, avgReview: 5, reviewCount: 20, uniqueCounterparties: 50 },
      },
      config.users,
      config.subFormulas
    );
    // activity ~100 * .4615 + trade 100 * .5385 = 100
    expect(result.score).toBe(100);
    expect(result.level).toBe("Максимальный");
  });

  it("User: platform model uses editable weighted sub-formulas (Phase 3)", () => {
    const result = calculateUserScore(
      {
        platformActivity: {
          platformEngagement: { activeDays: 15, meaningfulSessions: 30 },
          referrals: { activeL1: 10 },
        },
      },
      config.users,
      config.subFormulas
    );
    const pa = (result.meta as any).platformActivity;
    // Weighted mode (not legacy points): meta.mode === "weighted" and the
    // resolved components carry an explainable sub-breakdown.
    expect(pa.meta.mode).toBe("weighted");
    expect(pa.components.platformEngagement).toBeTruthy();
    expect(Array.isArray(pa.components.platformEngagement.sub)).toBe(true);
    // Present partial signals produce a positive but sub-100 platform score.
    expect(pa.score).toBeGreaterThan(0);
    expect(pa.score).toBeLessThan(100);
  });
});
