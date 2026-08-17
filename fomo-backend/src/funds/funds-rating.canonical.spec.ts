import { FundsRatingService } from "./funds-rating.service";
import type { UnifiedScoreResult } from "src/rating/unified/unified-rating.types";

const unified: UnifiedScoreResult = {
  score: 72.5,
  level: "tier-2",
  formulaVersion: "rating-v2",
  calculatedAt: new Date().toISOString(),
  completeness: 83.33,
  components: {
    longevity: { raw: 100, weight: 0.25, contribution: 25, source: "derived" },
    resilience: { raw: 0, weight: 0.2, contribution: 0, source: "missing" },
  },
  penalties: [],
  missingFields: ["resilience"],
};

describe("FundsRatingService — single source of truth (adapter)", () => {
  const canonical: any = { scoreFundDoc: jest.fn(() => unified) };
  const service = new FundsRatingService(canonical);

  it("backer score delegates to the canonical unified engine", () => {
    const scores = service.calculateBackerScores(
      { name: "Fund", foundedDate: "2019-01-01" } as any,
      null
    );
    expect(canonical.scoreFundDoc).toHaveBeenCalled();
    expect(scores.rating).toBe(72.5);
    expect(scores.fullness).toBe(83.33); // unified completeness
    expect(scores.ratingBreakdown.version).toBe("backer-v1"); // legacy shape kept
    expect(scores.ratingBreakdown.components.longevity).toBe(25);
  });

  it("merges investorDetail into the scored document", () => {
    service.calculateBackerScores({ name: "F" } as any, { averageRoi: 3 } as any);
    const arg = canonical.scoreFundDoc.mock.calls.at(-1)[0];
    expect(arg.averageRoi).toBe(3);
  });
});
