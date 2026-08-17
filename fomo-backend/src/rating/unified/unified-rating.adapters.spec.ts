import {
  jurisdictionCompliance,
  mapFundDoc,
  mapPersonDoc,
  mapProjectDoc,
  mapUserDoc,
  monthsSince,
} from "./unified-rating.adapters";
import {
  calculateFundScore,
  calculatePersonScore,
} from "./unified-rating.engine";
import { buildDefaultUnifiedRatingConfig } from "./unified-rating.defaults";

describe("unified rating adapters (real entity -> engine input)", () => {
  const cfg = buildDefaultUnifiedRatingConfig();

  it("maps jurisdiction/country to compliance category points", () => {
    expect(jurisdictionCompliance("United States")).toBe(15);
    expect(jurisdictionCompliance("Germany")).toBe(15);
    expect(jurisdictionCompliance("UAE")).toBe(10);
    expect(jurisdictionCompliance("Cayman Islands")).toBe(0);
    // Unknown -> undefined (surfaces as missing field, NOT an invented number)
    expect(jurisdictionCompliance("Atlantis")).toBeUndefined();
    expect(jurisdictionCompliance("")).toBeUndefined();
  });

  it("derives monthsActive from foundedDate", () => {
    const doc = {
      foundedDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 5).toISOString(),
      numberOfInvestments: 5,
      recentExits: [{}, {}, {}],
      averageRoi: 4,
      country: "United States",
    };
    const input = mapFundDoc(doc);
    expect(input.monthsActive).toBeGreaterThanOrEqual(59);
    expect(input.majorDeals).toBe(5);
    expect(input.successfulExits).toBe(3);
    expect(input.avgRoiMultiple).toBe(4);
    expect(input.complianceScore).toBe(15);
    // crisesSurvived is not tracked on the entity -> undefined
    expect(input.crisesSurvived).toBeUndefined();
  });

  it("fund with no data yields missingFields and low completeness (no fabricated score)", () => {
    const input = mapFundDoc({});
    const result = calculateFundScore(input, cfg.funds);
    expect(result.completeness).toBeLessThan(50);
    expect(result.missingFields.length).toBeGreaterThan(0);
    expect(result.score).toBe(0);
  });

  it("maps person real fields and reuses stored twitter sub-score", () => {
    const input = mapPersonDoc({
      roi: 70,
      twitterScore: 80,
      projectSupported: [{}, {}],
      partners: [{}],
    });
    expect(input.investingSuccess).toBe(70);
    expect(input.twitter).toBe(80);
    expect(input.projectActivity).toBe(2);
    expect(input.partnerships).toBe(1);
    const result = calculatePersonScore(input, cfg.persons, cfg.twitter);
    expect(result.missingFields).toContain("mediaActivity");
  });

  it("maps project country to geography and passes through red flag list", () => {
    const input = mapProjectDoc({
      country: "UAE",
      redFlags: [{ type: "anon-team", confirmed: true }],
    });
    expect(input.geography).toBe(10);
    expect(Array.isArray(input.redFlags)).toBe(true);
  });

  it("maps user activity counters and trade snapshots", () => {
    const input = mapUserDoc({
      activity: { projectsEdited: 3, socialActions: 12 },
      projects: [{}, {}],
      otcStats: { volume: 5000, completedTrades: 4 },
    });
    expect(input.platformActivity?.projectsCreated).toBe(2);
    expect(input.platformActivity?.projectsEdited).toBe(3);
    expect(input.otc?.volume).toBe(5000);
  });

  it("monthsSince returns undefined for invalid dates", () => {
    expect(monthsSince("not-a-date")).toBeUndefined();
    expect(monthsSince(null)).toBeUndefined();
  });
});
