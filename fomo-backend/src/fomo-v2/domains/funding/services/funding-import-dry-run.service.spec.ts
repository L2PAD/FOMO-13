import { Types } from "mongoose";
import { FomoV2FundingImportDryRunService } from "./funding-import-dry-run.service";

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

describe("FomoV2FundingImportDryRunService source isolation", () => {
  it("rejects legacy mutable-collection funding writes without snapshotId", async () => {
    const service = Object.create(
      FomoV2FundingImportDryRunService.prototype
    ) as any;

    await expect(
      service.run({ sourceType: "dropstab", write: true, limit: 10 })
    ).rejects.toThrow("requires an immutable parser snapshotId");
  });

  it("accepts only a complete Dropstab coin-details snapshot", async () => {
    const snapshotCollection = {
      findOne: jest.fn().mockResolvedValue({
        snapshotId: "snapshot-1",
        parserKey: "dropstab:coin-details",
        sourceType: "dropstab",
        status: "complete",
        environment: "test",
      }),
    };
    const itemCollection = { findOne: jest.fn().mockResolvedValue(null) };
    const service = Object.create(
      FomoV2FundingImportDryRunService.prototype
    ) as any;
    service.parserConnection = {
      db: {
        collection: (name: string) =>
          name === "parser_snapshots" ? snapshotCollection : itemCollection,
      },
    };

    await expect(
      service.validateSnapshot("snapshot-1", "dropstab")
    ).resolves.toMatchObject({ status: "complete" });
    expect(itemCollection.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ snapshotId: "snapshot-1", status: "succeeded" })
    );
  });

  it("rejects writing a TEST snapshot even after the main backend switches to PROD", async () => {
    const service = Object.create(
      FomoV2FundingImportDryRunService.prototype
    ) as any;
    service.parserConnection = {
      db: {
        collection: (name: string) => ({
          findOne: jest.fn().mockResolvedValue(
            name === "parser_snapshots"
              ? {
                  snapshotId: "snapshot-test",
                  parserKey: "dropstab:coin-details",
                  sourceType: "dropstab",
                  status: "complete",
                  environment: "test",
                }
              : null
          ),
        }),
      },
    };

    await expect(
      service.validateSnapshot("snapshot-test", "dropstab", true)
    ).rejects.toThrow("environment is not prod");
    await expect(
      service.validateSnapshot("snapshot-test", "dropstab", false)
    ).resolves.toMatchObject({ environment: "test" });
  });

  it("rejects a snapshot item whose payload is not explicitly Dropstab", () => {
    const service = Object.create(
      FomoV2FundingImportDryRunService.prototype
    ) as any;
    const item = {
      snapshotId: "snapshot-1",
      parserKey: "dropstab:coin-details",
      sourceType: "dropstab",
      status: "succeeded",
      entityKey: "coin-1",
      payload: { source: "icodrops", fundraisingRounds: [{}] },
    };

    expect(() =>
      service.snapshotItemPayload(item, "snapshot-1", "dropstab")
    ).toThrow("payload source mismatch");
    expect(
      service.snapshotItemPayload(
        { ...item, payload: { ...item.payload, source: "dropstab" } },
        "snapshot-1",
        "dropstab"
      )
    ).toMatchObject({ source: "dropstab" });
  });

  it.each([
    [
      {
        parserKey: "icodrops:projects",
        sourceType: "dropstab",
        status: "complete",
      },
      "parser",
    ],
    [
      {
        parserKey: "dropstab:coin-details",
        sourceType: "icodrops",
        status: "complete",
      },
      "sourceType",
    ],
    [
      {
        parserKey: "dropstab:coin-details",
        sourceType: "dropstab",
        status: "partial",
      },
      "not complete",
    ],
  ])(
    "rejects a mismatched/incomplete snapshot (%s)",
    async (manifest, message) => {
      const service = Object.create(
        FomoV2FundingImportDryRunService.prototype
      ) as any;
      service.parserConnection = {
        db: {
          collection: (name: string) => ({
            findOne: jest
              .fn()
              .mockResolvedValue(
                name === "parser_snapshots"
                  ? { snapshotId: "snapshot-bad", ...manifest }
                  : null
              ),
          }),
        },
      };

      await expect(
        service.validateSnapshot("snapshot-bad", "dropstab")
      ).rejects.toThrow(String(message));
    }
  );

  it("does not reconcile a Dropstab candidate with a foreign-source round", async () => {
    const foreignRound = {
      _id: new Types.ObjectId(),
      primarySource: "icodrops",
      sourceType: "icodrops",
    };
    const findOne = jest.fn().mockReturnValue(queryResult(foreignRound));
    const service = Object.create(
      FomoV2FundingImportDryRunService.prototype
    ) as any;
    service.fundingRoundModel = { findOne };

    const result = {
      roundsWouldUpdateByFingerprint: 0,
      roundsWouldUpdateBySourceId: 0,
      roundsWouldUpdateByRoundKey: 0,
      roundsWouldUpdateByTypeDate: 0,
      roundsWouldCreate: 0,
    };
    const decision = await service.simulateRoundUpsert(
      {
        canonicalProjectId: new Types.ObjectId(),
        canonicalFingerprint: "dropstab:fingerprint",
        primarySource: "dropstab",
        roundKey: "dropstab:round",
      },
      result
    );

    expect(decision.decision).toBe("create");
    expect(result.roundsWouldCreate).toBe(1);
    expect(result.roundsWouldUpdateByFingerprint).toBe(0);
    const sourceScope = findOne.mock.calls[0][0].$or;
    expect(sourceScope[0].primarySource).toBeInstanceOf(RegExp);
    expect(sourceScope[0].primarySource.test("drop-stab")).toBe(true);
    expect(sourceScope[0].primarySource.test("icodrops")).toBe(false);
  });

  it("reconciles a historical alias only inside the selected source", async () => {
    const aliasRound = {
      _id: new Types.ObjectId(),
      primarySource: "drop-stab",
    };
    const service = Object.create(
      FomoV2FundingImportDryRunService.prototype
    ) as any;
    service.fundingRoundModel = {
      findOne: jest.fn().mockReturnValue(queryResult(aliasRound)),
    };

    const result = {
      roundsWouldUpdateByFingerprint: 0,
      roundsWouldUpdateBySourceId: 0,
      roundsWouldUpdateByRoundKey: 0,
      roundsWouldUpdateByTypeDate: 0,
      roundsWouldCreate: 0,
    };
    const decision = await service.simulateRoundUpsert(
      {
        canonicalProjectId: new Types.ObjectId(),
        canonicalFingerprint: "dropstab:fingerprint",
        primarySource: "dropstab",
        roundKey: "dropstab:round",
      },
      result
    );

    expect(decision).toMatchObject({
      decision: "update_by_fingerprint",
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
      FomoV2FundingImportDryRunService.prototype
    ) as any;
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
