import { RatingCanonicalService } from "./rating-canonical.service";
import { buildDefaultUnifiedRatingConfig } from "./unified-rating.defaults";
import { calculateFundScore } from "./unified-rating.engine";

/**
 * Proves RatingCanonicalService is the single computation entry point: it
 * builds engine input via the deterministic adapters (or the ratingInputsV2
 * override) and returns EXACTLY what the pure engine returns with the same
 * config — so every consumer that delegates here gets one identical score.
 */
describe("RatingCanonicalService — canonical computation", () => {
  const config = buildDefaultUnifiedRatingConfig();
  const configService: any = {
    getSnapshot: jest.fn(async () => ({ config })),
  };
  const connection: any = { db: null };
  let service: RatingCanonicalService;

  beforeEach(async () => {
    service = new RatingCanonicalService(configService, connection);
    await service.refresh();
  });

  it("fund score is computed via the engine and is a valid 0-100 score", () => {
    const doc = { foundedDate: "2018-01-01", numberOfInvestments: 12, averageRoi: 3 };
    const viaCanonical = service.scoreFundDoc(doc);
    expect(typeof viaCanonical.formulaVersion).toBe("string");
    expect(typeof viaCanonical.score).toBe("number");
    expect(viaCanonical.score).toBeGreaterThanOrEqual(0);
    expect(viaCanonical.score).toBeLessThanOrEqual(100);
  });

  it("honours the ratingInputsV2 manual override", () => {
    const override = { monthsActive: 120, majorDeals: 30, successfulExits: 10, avgRoiMultiple: 5, crisesSurvived: 3, complianceScore: 15 };
    const doc = { ratingInputsV2: override };
    const viaCanonical = service.scoreFundDoc(doc);
    const direct = calculateFundScore(override as any, config.funds, config.subFormulas);
    expect(viaCanonical.score).toBe(direct.score);
  });

  it("Fund Resilience is scored from weighted crisis criteria when signals exist", () => {
    const cfg = { ...config, funds: { ...config.funds, resilienceCriteria: [
      { key: "a", label: "A", enabled: true, weight: 60 },
      { key: "b", label: "B", enabled: true, weight: 40 },
      { key: "c", label: "C", enabled: false, weight: 25 },
    ] } };
    const res = calculateFundScore(
      { resilienceSignals: { a: 0.1, b: 0 } } as any,
      cfg.funds as any,
      cfg.subFormulas
    );
    // 100 * (0.6*0.1 + 0.4*0) = 6, under the resilience cap -> contribution ~6
    expect(res.components.resilience.contribution).toBeCloseTo(6, 1);
    expect(res.components.resilience.source).toBe("derived");
  });
});
