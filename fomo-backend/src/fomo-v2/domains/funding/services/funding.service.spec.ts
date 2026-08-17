import { Types } from "mongoose";
import { FomoV2FundingService } from "./funding.service";

describe("FomoV2FundingService provider identity matching", () => {
  const canonicalProjectId = new Types.ObjectId("64b64c000000000000000001");

  it("does not weak-match a different provider round id on the same date/type", () => {
    const service = new (FomoV2FundingService as any)();
    const filter = (service as any).buildFundingRoundUpsertFilter({
      canonicalProjectId,
      sourceType: "dropstab",
      primarySource: "dropstab",
      sourceId: "provider-round-b",
      roundKey: "dropstab:project:provider-round-b",
      canonicalFingerprint: "fingerprint-b",
      normalizedRoundType: "seed",
      announcedDate: new Date("2025-01-01T00:00:00.000Z"),
    });

    expect(filter.$or).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          canonicalProjectId,
          primarySource: expect.any(RegExp),
          sourceId: "provider-round-b",
        }),
        expect.objectContaining({
          canonicalProjectId,
          sourceType: expect.any(RegExp),
          roundKey: "dropstab:project:provider-round-b",
        }),
      ])
    );
    const weakDateMatch = filter.$or.find(
      (candidate: any) => candidate.normalizedRoundType === "seed"
    );
    expect(weakDateMatch.$and).toEqual([
      {
        $or: [
          { sourceId: { $exists: false } },
          { sourceId: null },
          { sourceId: "" },
        ],
      },
      {
        $or: [
          { roundKey: { $exists: false } },
          { roundKey: null },
          { roundKey: "" },
        ],
      },
    ]);
  });

  it("keeps the weak date/type fallback available when incoming provider ids are absent", () => {
    const service = new (FomoV2FundingService as any)();
    const filter = (service as any).buildFundingRoundUpsertFilter({
      canonicalProjectId,
      sourceType: "dropstab",
      primarySource: "dropstab",
      canonicalFingerprint: "legacy-fingerprint",
      normalizedRoundType: "seed",
      announcedDate: new Date("2025-01-01T00:00:00.000Z"),
    });

    const weakDateMatch = filter.$or.find(
      (candidate: any) => candidate.normalizedRoundType === "seed"
    );
    expect(weakDateMatch).not.toHaveProperty("$and");
  });

  it("updates an exact source-scoped legacy identity instead of inserting a duplicate", async () => {
    const existingId = new Types.ObjectId();
    const fundingRoundModel = {
      findOneAndUpdate: jest.fn().mockResolvedValue({
        value: { _id: existingId },
        lastErrorObject: { updatedExisting: true },
      }),
    };
    const service = new FomoV2FundingService(
      fundingRoundModel as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );

    const result = await service.upsertFundingRound({
      canonicalProjectId,
      sourceType: "ICO-Drops" as any,
      primarySource: "ico-drops" as any,
      sourceId: "icodrops:project:semantic:seed:2025-01-01",
      roundKey: "icodrops:project:semantic:seed:2025-01-01",
      roundName: "Seed",
      normalizedRoundType: "seed",
      announcedDate: "2025-01-01",
      identityAliases: {
        canonicalFingerprints: ["legacy-fingerprint"],
        sourceIds: ["icodrops:project:seed:2025-01-01:1000000:seed:0"],
        roundKeys: ["icodrops:project:seed:2025-01-01:1000000:seed:0"],
      },
      sourceRefs: [
        {
          source: "ICO-Drops" as any,
          sourceId: "icodrops:project:semantic:seed:2025-01-01",
        },
        { source: "drop-stab" as any, sourceId: "dropstab-round" },
      ],
    });

    const filter = fundingRoundModel.findOneAndUpdate.mock.calls[0][0];
    expect(filter.$or).toEqual(
      expect.arrayContaining([
        {
          canonicalProjectId,
          sourceType: expect.any(RegExp),
          canonicalFingerprint: { $in: ["legacy-fingerprint"] },
        },
        {
          canonicalProjectId,
          primarySource: expect.any(RegExp),
          sourceId: {
            $in: ["icodrops:project:seed:2025-01-01:1000000:seed:0"],
          },
        },
        {
          canonicalProjectId,
          sourceType: expect.any(RegExp),
          roundKey: {
            $in: ["icodrops:project:seed:2025-01-01:1000000:seed:0"],
          },
        },
      ])
    );
    expect(result.created).toBe(false);
    expect(result.doc._id).toEqual(existingId);
    const aliasSourceFilters = filter.$or.filter(
      (candidate: any) => candidate.sourceType || candidate.primarySource
    );
    for (const candidate of aliasSourceFilters) {
      const pattern = candidate.sourceType || candidate.primarySource;
      expect(pattern.test("icodrops")).toBe(true);
      expect(pattern.test("ico-drops")).toBe(true);
      expect(pattern.test("dropstab")).toBe(false);
    }
    expect(fundingRoundModel.findOneAndUpdate.mock.calls[0][1].$set).toEqual(
      expect.objectContaining({
        canonicalFingerprint: expect.any(String),
        primarySource: "icodrops",
        sourceType: "icodrops",
        sourceRefs: expect.arrayContaining([
          expect.objectContaining({ source: "icodrops" }),
          expect.objectContaining({ source: "dropstab" }),
        ]),
      })
    );
  });
});
