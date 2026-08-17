import { Types } from "mongoose";
import { DropstabInvestorsSyncService } from "./dropstab-investors-sync.service";

const createService = (rounds: any[], parserControlPolicy?: any) => {
  const lean = jest.fn().mockResolvedValue(rounds);
  const fundingRoundModel = {
    find: jest.fn().mockReturnValue({ lean }),
  };
  const service = new DropstabInvestorsSyncService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    fundingRoundModel as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    parserControlPolicy
  ) as any;

  return { service, fundingRoundModel };
};

describe("DropstabInvestorsSyncService FOMO v2 funding links", () => {
  it("blocks write sync before any database mutation when parser control is TEST", async () => {
    const parserControlPolicy = {
      assertDomainWriteAllowed: jest
        .fn()
        .mockRejectedValue(new Error("global parser mode is TEST")),
    };
    const { service } = createService([], parserControlPolicy);

    await expect(service.sync({ dryRun: false, limit: 1 })).rejects.toThrow(
      "global parser mode is TEST"
    );
    expect(parserControlPolicy.assertDomainWriteAllowed).toHaveBeenCalledWith(
      "backers:dropstab"
    );
  });

  it("matches source project and normalized round aliases", async () => {
    const fundingRoundId = new Types.ObjectId();
    const { service, fundingRoundModel } = createService([
      {
        fundingRoundId,
        projectSlug: "canonical-alpha",
        sourceSlug: "alpha-source",
        projectName: "Alpha",
        roundName: "Pre-Seed",
        normalizedRoundType: "pre_seed",
        fundingDate: new Date("2026-01-15T00:00:00.000Z"),
      },
    ]);

    const indexes = await service.loadFundingRoundIndexes();
    const linked = service.withFundingRoundLink(
      {
        projectSlug: "alpha-source",
        projectName: "Alpha",
        round: "Pre Seed",
        date: new Date("2026-01-15T12:00:00.000Z"),
      },
      indexes
    );

    expect(linked).toEqual(
      expect.objectContaining({
        matchedFundingRoundId: fundingRoundId,
        fundingRoundMatchMethod: "projectSlug+stage+date",
        fundingRoundMatchConfidence: 90,
      })
    );
    expect(fundingRoundModel.find).toHaveBeenCalledWith(
      { visible: true },
      expect.objectContaining({
        fundingRoundId: 1,
        sourceSlug: 1,
        roundName: 1,
        normalizedRoundType: 1,
        fundingDate: 1,
      })
    );
  });

  it("refuses an ambiguous project-stage-date link", async () => {
    const sharedFields = {
      projectSlug: "alpha",
      projectName: "Alpha",
      roundType: "Seed",
      fundingDate: new Date("2026-02-01T00:00:00.000Z"),
    };
    const { service } = createService([
      { ...sharedFields, fundingRoundId: new Types.ObjectId() },
      { ...sharedFields, fundingRoundId: new Types.ObjectId() },
    ]);

    const indexes = await service.loadFundingRoundIndexes();
    const linked = service.withFundingRoundLink(
      {
        projectSlug: "alpha",
        projectName: "Alpha",
        round: "Seed",
        date: new Date("2026-02-01T00:00:00.000Z"),
      },
      indexes
    );

    expect(linked.matchedFundingRoundId).toBeUndefined();
    expect(linked.fundingRoundMatchMethod).toBe("none");
  });
});
