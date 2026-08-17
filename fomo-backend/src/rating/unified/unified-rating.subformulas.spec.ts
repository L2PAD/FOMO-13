import {
  evalComponentFormula,
  resolveComponent,
  platformEngagement,
} from "./unified-rating.subformulas";
import { buildDefaultSubFormulas } from "./unified-rating.subformulas.defaults";
import { buildDefaultUnifiedRatingConfig } from "./unified-rating.defaults";
import {
  calculateFundScore,
  calculatePersonScore,
} from "./unified-rating.engine";

const config = buildDefaultUnifiedRatingConfig();
const SF = buildDefaultSubFormulas();

const evalFund = (key: string, raw: any) => evalComponentFormula(SF.funds[key], raw);
const evalPerson = (key: string, raw: any) => evalComponentFormula(SF.persons[key], raw);
const evalTwitter = (key: string, raw: any) => evalComponentFormula(SF.twitter[key], raw);
const evalProject = (key: string, raw: any) => evalComponentFormula(SF.projects[key], raw);

describe("Unified Rating — config-driven sub-formula layer (raw -> 0..100 -> points)", () => {
  it("longevity: canonical stepwise tiers scaled to cap 25 (not linear)", () => {
    // table encoded in 0-100 domain, scaled by cap 25 -> canonical points
    expect(evalFund("longevity", 6).value).toBeCloseTo(2, 1); // <1y
    expect(evalFund("longevity", 18).value).toBeCloseTo(6, 1); // 1-2y
    expect(evalFund("longevity", 36).value).toBeCloseTo(12, 1); // 2-4y
    expect(evalFund("longevity", 60).value).toBeCloseTo(18, 1); // 4-6y
    expect(evalFund("longevity", 96).value).toBeCloseTo(22, 1); // 6-10y
    expect(evalFund("longevity", 200).value).toBeCloseTo(25, 1); // 10y+
  });

  it("deal quality: significance beats count and is capped", () => {
    const lead = evalFund("majorDeals", [{ role: "leadLargeRound" }, { role: "confirmed" }]);
    expect(lead.value).toBeGreaterThan(0);
    const many = evalFund("majorDeals", new Array(20).fill({ role: "leadLargeRound" }));
    expect(many.value).toBeLessThanOrEqual(20);
  });

  it("investing success: missing sub lowers completeness, does not zero", () => {
    const r = evalPerson("investingSuccess", { medianRoi: 4, profitableRatio: 0.8 });
    expect(r.completeness).toBe(40); // 2 of 5 subs present
    expect(r.value).toBeGreaterThan(0);
    expect(r.missing).toContain("consistency");
  });

  it("media activity: weighted, not equal; tier-1 mentions dominate (weight 35)", () => {
    const r = evalPerson("mediaActivity", {
      tier1Mentions: 12,
      industryMentions: 38,
      interviews: 6,
      conferences: 3,
      recencyDays: 12,
    });
    expect(r.value).toBeGreaterThan(0);
    expect(r.sub.find((x) => x.key === "tier1Mentions")!.weight).toBe(35);
  });

  it("follower quality: suspicious ratio is a penalty (lowers value)", () => {
    const clean = evalTwitter("quality", {
      realAccountRatio: 0.95,
      activeFollowerRatio: 0.7,
      topFollowerScore: 80,
      audienceRelevance: 80,
      suspiciousFollowerRatio: 0,
    });
    const botty = evalTwitter("quality", {
      realAccountRatio: 0.95,
      activeFollowerRatio: 0.7,
      topFollowerScore: 80,
      audienceRelevance: 80,
      suspiciousFollowerRatio: 0.8,
    });
    expect(botty.value!).toBeLessThan(clean.value!);
    expect(botty.sub.find((x) => x.penalty)).toBeTruthy();
  });

  it("posting frequency: 30+ days idle scores lower than recent activity", () => {
    const active = evalTwitter("frequency", { postsPer30Days: 12, activeDaysRatio: 0.6, lastPostDays: 2 });
    const idle = evalTwitter("frequency", { postsPer30Days: 12, activeDaysRatio: 0.6, lastPostDays: 45 });
    expect(idle.value!).toBeLessThan(active.value!);
  });

  it("project team: composes six sub-metrics", () => {
    const r = evalProject("developmentTeam", {
      verifiedIdentities: 1,
      relevantExperience: 80,
      previousProducts: 2,
      pastProjectSuccess: 70,
      technicalCompetence: 85,
      reputationIncidents: 90,
    });
    expect(r.value).toBeGreaterThan(0);
    expect(r.sub.length).toBe(6);
  });

  it("platform engagement: time (active days) is one weighted sub", () => {
    const r = platformEngagement({ activeDays: 30, meaningfulSessions: 60 });
    expect(r.sub.find((x) => x.key === "activeDays")).toBeTruthy();
  });

  it("resolveComponent: number = manual, object = derived, empty = missing", () => {
    const fn = (raw: any) => evalPerson("investingSuccess", raw);
    expect(resolveComponent(75, fn).source).toBe("manual");
    expect(resolveComponent({ medianRoi: 4 }, fn).source).toBe("derived");
    expect(resolveComponent(undefined, fn).source).toBe("missing");
  });

  it("engine: person with RAW investingSuccess yields derived source + nested sub", () => {
    const res = calculatePersonScore(
      { investingSuccess: { medianRoi: 4, profitableRatio: 0.8, realisedShare: 0.5, consistency: 70, dataConfidence: 90 } },
      config.persons,
      config.twitter,
      SF
    );
    const c = res.components.investingSuccess;
    expect(c.source).toBe("derived");
    expect(c.sub && c.sub.length).toBe(5);
  });

  it("engine: fund with RAW compliance object derives jurisdiction + flags", () => {
    const res = calculateFundScore(
      { compliance: { jurisdictionPoints: 15, hasLicense: true, beneficiaryTransparency: true } },
      config.funds,
      SF
    );
    expect(res.components.compliance.source).toBe("derived");
    expect(res.components.compliance.contribution).toBeGreaterThan(0);
  });
});
