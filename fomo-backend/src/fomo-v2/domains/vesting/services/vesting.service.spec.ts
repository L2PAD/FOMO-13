import { Types } from "mongoose";
import {
  FomoV2TokenAllocationSchema,
  FomoV2VestingRoundSchema,
  FomoV2VestingScheduleSchema,
} from "../models";
import { FomoV2VestingService } from "./vesting.service";

describe("FomoV2VestingService", () => {
  it("passes the supplied session to vesting upserts", async () => {
    const session = { id: "vesting-review-session" } as any;
    const findOneAndUpdate = jest.fn().mockResolvedValue({
      value: { _id: new Types.ObjectId() },
      lastErrorObject: { upserted: new Types.ObjectId() },
    });
    const model = { findOneAndUpdate } as any;
    const service = new FomoV2VestingService(model, model, model, model);
    const canonicalProjectId = new Types.ObjectId();

    await service.upsertTokenAllocation(
      {
        canonicalProjectId,
        sourceType: "dropstab" as any,
        name: "Team",
      },
      session
    );

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object),
      expect.objectContaining({
        upsert: true,
        new: true,
        session,
      })
    );
  });

  it("scopes every allocation, round and schedule identity fallback by sourceType", async () => {
    const findOneAndUpdate = jest.fn().mockResolvedValue({
      value: { _id: new Types.ObjectId() },
      lastErrorObject: {},
    });
    const model = { findOneAndUpdate } as any;
    const service = new FomoV2VestingService(model, model, model, model);
    const canonicalProjectId = new Types.ObjectId();
    const tokenAllocationId = new Types.ObjectId();
    const vestingRoundId = new Types.ObjectId();

    await service.upsertTokenAllocation({
      canonicalProjectId,
      sourceType: "icodrops" as any,
      saleId: 1,
      name: "Team",
    });
    await service.upsertVestingRound({
      canonicalProjectId,
      sourceType: "icodrops" as any,
      saleId: 1,
      roundName: "Team",
    });
    await service.upsertVestingSchedule({
      canonicalProjectId,
      tokenAllocationId,
      vestingRoundId,
      sourceType: "icodrops" as any,
      saleId: 1,
      roundName: "Team",
    });

    for (const [filter] of findOneAndUpdate.mock.calls) {
      const clauses = filter.$or || [filter];
      expect(clauses.length).toBeGreaterThan(0);
      for (const clause of clauses) {
        expect(clause.sourceType).toBeInstanceOf(RegExp);
        expect(clause.sourceType.test("ICO-Drops")).toBe(true);
        expect(clause.sourceType.test("dropstab")).toBe(false);
      }
    }
  });

  it("reconciles legacy source aliases and keeps explicit identity aliases", async () => {
    const allocationUpdate = jest.fn().mockResolvedValue({
      value: { _id: new Types.ObjectId() },
      lastErrorObject: {},
    });
    const roundUpdate = jest.fn().mockResolvedValue({
      value: { _id: new Types.ObjectId() },
      lastErrorObject: {},
    });
    const scheduleUpdate = jest.fn().mockResolvedValue({
      value: { _id: new Types.ObjectId() },
      lastErrorObject: {},
    });
    const summaryUpdate = jest.fn().mockResolvedValue({
      value: { _id: new Types.ObjectId() },
      lastErrorObject: {},
    });
    const service = new FomoV2VestingService(
      { findOneAndUpdate: allocationUpdate } as any,
      { findOneAndUpdate: roundUpdate } as any,
      { findOneAndUpdate: scheduleUpdate } as any,
      { findOneAndUpdate: summaryUpdate } as any
    );
    const canonicalProjectId = new Types.ObjectId();
    const vestingRoundId = new Types.ObjectId();
    const identityAliases = {
      canonicalFingerprints: ["legacy-alias-fingerprint"],
    };

    await service.upsertTokenAllocation({
      canonicalProjectId,
      sourceType: "ICO-Drops" as any,
      name: "Team",
      identityAliases,
    });
    await service.upsertVestingRound({
      canonicalProjectId,
      sourceType: "ICO-Drops" as any,
      roundName: "Team",
      identityAliases,
    });
    await service.upsertVestingSchedule({
      canonicalProjectId,
      vestingRoundId,
      sourceType: "ICO-Drops" as any,
      roundName: "Team",
      identityAliases,
    });
    await service.upsertVestingSummary({
      canonicalProjectId,
      sourceType: "ICO-Drops" as any,
      identityAliases,
    });

    for (const update of [
      allocationUpdate,
      roundUpdate,
      scheduleUpdate,
      summaryUpdate,
    ]) {
      const [filter, operation] = update.mock.calls[0];
      const clauses = filter.$or || [filter];
      expect(clauses.some((clause: any) => {
        const fingerprint = clause.canonicalFingerprint;
        return Array.isArray(fingerprint?.$in) &&
          fingerprint.$in.includes("legacy-alias-fingerprint");
      })).toBe(true);
      expect(
        clauses.every(
          (clause: any) =>
            clause.sourceType instanceof RegExp &&
            clause.sourceType.test("ico-drops") &&
            !clause.sourceType.test("dropstab")
        )
      ).toBe(true);
      expect(operation.$set.sourceType).toBe("icodrops");
    }
  });

  it("declares source-scoped normalized-name indexes", () => {
    expect(FomoV2TokenAllocationSchema.indexes()).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          { canonicalProjectId: 1, sourceType: 1, normalizedName: 1 },
          expect.objectContaining({ unique: true }),
        ]),
      ])
    );
    expect(FomoV2VestingRoundSchema.indexes()).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          { canonicalProjectId: 1, sourceType: 1, normalizedRoundName: 1 },
          expect.objectContaining({ unique: true }),
        ]),
      ])
    );
    expect(FomoV2VestingScheduleSchema.indexes()).toEqual(
      expect.arrayContaining([
        expect.arrayContaining([
          { canonicalProjectId: 1, sourceType: 1, normalizedRoundName: 1 },
        ]),
      ])
    );
  });
});
