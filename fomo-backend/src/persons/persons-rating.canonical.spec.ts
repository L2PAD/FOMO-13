import { PersonsRatingService } from "./persons-rating.service";
import type { UnifiedScoreResult } from "src/rating/unified/unified-rating.types";

const unified: UnifiedScoreResult = {
  score: 43.55,
  level: "tier-3",
  formulaVersion: "rating-v2",
  calculatedAt: new Date().toISOString(),
  completeness: 50,
  components: {
    investingSuccess: { raw: 60, weight: 0.3, contribution: 18, source: "derived" },
  },
  penalties: [],
  missingFields: ["mediaActivity"],
};

describe("PersonsRatingService — single source of truth (adapter)", () => {
  const canonical: any = { scorePersonDoc: jest.fn(() => unified) };
  const service = new PersonsRatingService(canonical);

  it("person score delegates to the canonical unified engine", () => {
    const scores = service.calculatePersonScores({ name: "P", roi: 2 } as any);
    expect(canonical.scorePersonDoc).toHaveBeenCalled();
    expect(scores.rating).toBe(43.55);
    expect(scores.fullness).toBe(50);
    expect(scores.ratingBreakdown.version).toBe("person-v1");
  });
});
