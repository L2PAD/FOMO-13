import { FundsService } from "./funds.service";

const createService = () =>
  new FundsService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any
  ) as any;

describe("FundsService FOMO v2 funding read-model filters", () => {
  it("normalizes backer and category filters to materialized index fields", () => {
    const service = createService();

    const match = service.buildFundingRoundsMatch(
      { industryFocus: ["DeFi", "Pre-Seed"] },
      [
        {
          name: "A16Z Crypto",
          slug: "Andreessen-Horowitz",
          sourceKey: "dropstab:investor:andreessen-horowitz",
          sourceId: "42",
        },
      ]
    );

    expect(match).toEqual(
      expect.objectContaining({
        visible: true,
        raisedAmount: { $gt: 0 },
        fundingDate: { $ne: null },
      })
    );
    expect(match.$and[0].$or).toEqual([
      { investorNameKeys: { $in: ["a16z crypto"] } },
      { investorSlugs: { $in: ["andreessen_horowitz", "42"] } },
      { investorSourceIds: { $in: ["42"] } },
    ]);
    expect(match.$and[1].$or).toEqual([
      { projectCategory: { $in: ["DeFi", "Pre-Seed"] } },
      { categoryKeys: { $in: ["defi", "pre_seed"] } },
      { fundingTypeKeys: { $in: ["defi", "pre_seed"] } },
      { roundType: { $in: ["DeFi", "Pre-Seed"] } },
    ]);
  });

  it("does not leak global funding analytics into an empty scoped result", () => {
    const service = createService();

    expect(
      service.buildFundingRoundsMatch({ industryFocus: ["DeFi"] }, [])
    ).toBeNull();
  });
});
