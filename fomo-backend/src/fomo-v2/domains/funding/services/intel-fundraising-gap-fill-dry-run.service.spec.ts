import { Types } from "mongoose";
import { FomoV2IntelFundraisingGapFillDryRunService } from "./intel-fundraising-gap-fill-dry-run.service";

function queryResult<T>(value: T) {
  return { lean: jest.fn().mockResolvedValue(value) };
}

function backerQueryResult<T>(value: T) {
  return {
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue(queryResult(value)),
    }),
  };
}

describe("FomoV2IntelFundraisingGapFillDryRunService source isolation", () => {
  it("does not reconcile a Dropstab feed row with a foreign-source round", async () => {
    const foreignRound = {
      _id: new Types.ObjectId(),
      primarySource: "icodrops",
      sourceType: "icodrops",
    };
    const findOne = jest.fn().mockReturnValue(queryResult(foreignRound));
    const service = Object.create(
      FomoV2IntelFundraisingGapFillDryRunService.prototype
    ) as any;
    service.fundingRoundModel = { findOne };

    const decision = await service.findExistingRound({
      canonicalProjectId: new Types.ObjectId(),
      canonicalFingerprint: "dropstab:fingerprint",
      sourceType: "dropstab",
      primarySource: "dropstab",
      roundKey: "dropstab:round",
    });

    expect(decision.decision).toBe("new_round_candidate");
    const sourceScope = findOne.mock.calls[0][0].$or;
    expect(sourceScope[0].primarySource).toBeInstanceOf(RegExp);
    expect(sourceScope[0].primarySource.test("drop_stab")).toBe(true);
    expect(sourceScope[0].primarySource.test("icodrops")).toBe(false);
  });

  it("reconciles a historical alias only inside the selected source", async () => {
    const aliasRound = {
      _id: new Types.ObjectId(),
      sourceType: "drop-stab",
    };
    const service = Object.create(
      FomoV2IntelFundraisingGapFillDryRunService.prototype
    ) as any;
    service.fundingRoundModel = {
      findOne: jest.fn().mockReturnValue(queryResult(aliasRound)),
    };

    const decision = await service.findExistingRound({
      canonicalProjectId: new Types.ObjectId(),
      canonicalFingerprint: "dropstab:fingerprint",
      sourceType: "dropstab",
      primarySource: "dropstab",
      roundKey: "dropstab:round",
    });

    expect(decision).toMatchObject({
      decision: "matched_by_fingerprint",
      existingRound: aliasRound,
    });
  });

  it("sends a sole name-only foreign-source backer to review", async () => {
    const foreignBacker = {
      _id: new Types.ObjectId(),
      normalizedName: "example capital",
      primarySource: "icodrops",
    };
    const service = Object.create(
      FomoV2IntelFundraisingGapFillDryRunService.prototype
    ) as any;
    service.backerResolutionCache = new Map();
    service.backerSourceProfileModel = { find: jest.fn() };
    service.backerModel = {
      find: jest.fn().mockReturnValue(backerQueryResult([foreignBacker])),
    };

    const resolution = await service.resolveBacker(
      { normalizedBackerName: "example capital" },
      "dropstab"
    );

    expect(resolution).toMatchObject({
      status: "ambiguous",
      matchedBy: "backers.normalizedName_review_required",
      candidates: [foreignBacker],
    });
    expect(resolution.backerId).toBeUndefined();
  });
});
