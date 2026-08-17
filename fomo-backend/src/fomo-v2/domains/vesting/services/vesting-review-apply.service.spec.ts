import { Types } from "mongoose";
import { FomoV2VestingDedupeService } from "./vesting-dedupe.service";
import { FomoV2VestingCandidateNormalizerService } from "./vesting-candidate-normalizer.service";
import { FomoV2VestingReviewApplyService } from "./vesting-review-apply.service";

describe("FomoV2VestingReviewApplyService", () => {
  const canonicalProjectId = new Types.ObjectId();

  function createService(
    rows: {
      tokenAllocations?: any[];
      vestingRounds?: any[];
      vestingSchedules?: any[];
      vestingSummaries?: any[];
    } = {}
  ) {
    const nextId = () => new Types.ObjectId();
    const vestingService = {
      upsertTokenAllocation: jest.fn(async (input: any, _session?: any) => ({
        doc: { _id: nextId(), ...input },
        created: true,
      })),
      upsertVestingRound: jest.fn(async (input: any, _session?: any) => ({
        doc: { _id: nextId(), ...input },
        created: true,
      })),
      upsertVestingSchedule: jest.fn(async (input: any, _session?: any) => ({
        doc: { _id: nextId(), ...input },
        created: true,
      })),
      upsertVestingSummary: jest.fn(async (input: any, _session?: any) => ({
        doc: { _id: nextId(), ...input },
        created: true,
      })),
    };
    const unlocksService = {
      upsertUnlockEvent: jest.fn(async (input: any, _session?: any) => ({
        doc: { _id: nextId(), ...input },
        created: true,
      })),
    };
    const session: any = {
      abortTransaction: jest.fn().mockResolvedValue(undefined),
      endSession: jest.fn().mockResolvedValue(undefined),
    };
    session.withTransaction = jest.fn(async (callback: () => Promise<any>) => {
      try {
        return await callback();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      }
    });
    const connection = {
      startSession: jest.fn().mockResolvedValue(session),
    };
    const tokenAllocationModel = modelWithRowsAndDeleteCount(
      7,
      rows.tokenAllocations || []
    );
    const vestingRoundModel = modelWithRowsAndDeleteCount(
      6,
      rows.vestingRounds || []
    );
    const vestingScheduleModel = modelWithRowsAndDeleteCount(
      5,
      rows.vestingSchedules || []
    );
    const vestingSummaryModel = modelWithRowsAndDeleteCount(
      1,
      rows.vestingSummaries || []
    );
    const unlockEventModel = modelWithRowsAndDeleteCount(4, []);
    const service = new FomoV2VestingReviewApplyService(
      new FomoV2VestingCandidateNormalizerService(),
      new FomoV2VestingDedupeService(),
      vestingService as any,
      unlocksService as any,
      connection as any,
      tokenAllocationModel as any,
      vestingRoundModel as any,
      vestingScheduleModel as any,
      vestingSummaryModel as any,
      unlockEventModel as any
    );

    return {
      service,
      vestingService,
      unlocksService,
      connection,
      session,
      tokenAllocationModel,
      vestingRoundModel,
      vestingScheduleModel,
      vestingSummaryModel,
      unlockEventModel,
    };
  }

  it("replaces project vesting and writes approved Solana-like rows", async () => {
    const {
      service,
      vestingService,
      unlocksService,
      tokenAllocationModel,
      vestingRoundModel,
      vestingScheduleModel,
      vestingSummaryModel,
      unlockEventModel,
      session,
    } = createService();
    const batch = solanaLikeReviewBatch();

    expect(service.canApplyReviewBatch(batch)).toBe(true);

    const result = await service.applyReviewBatch(batch);

    expect(session.withTransaction).toHaveBeenCalledWith(expect.any(Function), {
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
      readPreference: "primary",
    });
    expect(session.abortTransaction).not.toHaveBeenCalled();
    expect(session.endSession).toHaveBeenCalledTimes(1);

    const deleteArgs = [{ canonicalProjectId }, { session }];
    expect(vestingScheduleModel.deleteMany).toHaveBeenCalledWith(...deleteArgs);
    expect(vestingRoundModel.deleteMany).toHaveBeenCalledWith(...deleteArgs);
    expect(tokenAllocationModel.deleteMany).toHaveBeenCalledWith(...deleteArgs);
    expect(vestingSummaryModel.deleteMany).toHaveBeenCalledWith(...deleteArgs);
    expect(unlockEventModel.deleteMany).toHaveBeenCalledWith(...deleteArgs);

    expect(result.deleted).toEqual({
      tokenAllocations: 7,
      vestingRounds: 6,
      vestingSchedules: 5,
      vestingSummaries: 1,
      unlockEvents: 4,
    });
    expect(result.written).toEqual({
      tokenAllocations: 2,
      vestingRounds: 1,
      vestingSchedules: 1,
      vestingSummaries: 1,
      unlockEvents: 1,
    });
    expect(result.skipped).toEqual({
      vestingSchedulesMissingTokenAllocation: 0,
      vestingSchedulesMissingRound: 0,
      vestingSchedulesAmbiguousTokenAllocation: 0,
      vestingSchedulesAmbiguousRound: 0,
    });

    expect(vestingService.upsertTokenAllocation).toHaveBeenCalledTimes(2);
    expect(vestingService.upsertVestingRound).toHaveBeenCalledTimes(1);
    expect(vestingService.upsertVestingSchedule).toHaveBeenCalledTimes(1);
    expect(vestingService.upsertVestingSummary).toHaveBeenCalledTimes(1);
    expect(unlocksService.upsertUnlockEvent).toHaveBeenCalledTimes(1);
    for (const method of [
      vestingService.upsertTokenAllocation,
      vestingService.upsertVestingRound,
      vestingService.upsertVestingSchedule,
      vestingService.upsertVestingSummary,
      unlocksService.upsertUnlockEvent,
    ]) {
      expect(
        method.mock.calls.every((call: any[]) => call[1] === session)
      ).toBe(true);
    }
    expect(vestingService.upsertTokenAllocation.mock.calls[0][0]).toMatchObject(
      {
        name: "Team",
        sourceType: "dropstab",
        status: "active",
      }
    );
    expect(vestingService.upsertTokenAllocation.mock.calls[1][0]).toMatchObject(
      {
        name: "Reserve",
        status: "active",
      }
    );
    expect(vestingService.upsertVestingSchedule.mock.calls[0][0]).toMatchObject(
      {
        roundName: "Team",
        status: "active",
        metadata: expect.objectContaining({
          approvedReviewApply: true,
          allocationLinkStatus: "linked",
          roundLinkStatus: "linked",
        }),
      }
    );
    expect(vestingService.upsertVestingSummary.mock.calls[0][0]).toMatchObject({
      canonicalProjectId,
      sourceType: "dropstab",
      totalAmount: 500000000,
      unlockedPercent: 61.35,
    });
    expect(unlocksService.upsertUnlockEvent.mock.calls[0][0]).toMatchObject({
      canonicalProjectId,
      sourceType: "dropstab",
      saleId: 1,
      roundName: "Team",
      vestingScheduleId: expect.any(Types.ObjectId),
      vestingRoundId: expect.any(Types.ObjectId),
      tokenAllocationId: expect.any(Types.ObjectId),
      eventOrigin: "provider_unlocking_events",
    });
  });

  it("uses admin edited vesting override when approving a review batch", async () => {
    const { service, vestingService } = createService();
    const batch = solanaLikeReviewBatch();

    const result = await service.applyReviewBatch(batch, {
      rawSourceOverride: {
        tokenAllocation: [
          { saleId: 99, name: "Foundation", percent: 15, amount: 150 },
        ],
        vestingRounds: [
          { saleId: 99, roundName: "Foundation", totalAmount: 150 },
        ],
        vestingSchedule: [
          {
            saleId: 99,
            roundName: "Foundation",
            tgeUnlockPercent: 10,
            vestingType: "linear",
            vestingFrequency: "Monthly",
            vestingDurationMonths: 12,
            startDate: "2024-01-01T00:00:00.000Z",
            endDate: "2025-01-01T00:00:00.000Z",
          },
        ],
        vestingSummary: {
          totalAmount: 150,
          unlockedPercent: 10,
          lockedPercent: 90,
        },
      },
    });

    expect(result.written).toEqual({
      tokenAllocations: 1,
      vestingRounds: 1,
      vestingSchedules: 1,
      vestingSummaries: 1,
      unlockEvents: 0,
    });
    expect(vestingService.upsertTokenAllocation).toHaveBeenCalledTimes(1);
    expect(vestingService.upsertTokenAllocation.mock.calls[0][0]).toMatchObject(
      {
        name: "Foundation",
        allocationPercent: 15,
        status: "active",
      }
    );
    expect(vestingService.upsertVestingRound.mock.calls[0][0]).toMatchObject({
      roundName: "Foundation",
      totalAmount: 150,
      status: "active",
    });
    expect(vestingService.upsertVestingSchedule.mock.calls[0][0]).toMatchObject(
      {
        roundName: "Foundation",
        tgeUnlockPercent: 10,
        status: "active",
      }
    );
    expect(vestingService.upsertVestingSummary.mock.calls[0][0]).toMatchObject({
      totalAmount: 150,
      unlockedPercent: 10,
      lockedPercent: 90,
    });
  });

  it("creates vesting schedules even when allocation relation is missing", async () => {
    const { service, vestingService } = createService();
    const batch = solanaLikeReviewBatch();

    const result = await service.applyReviewBatch(batch, {
      rawSourceOverride: {
        tokenAllocation: [],
        vestingRounds: [
          { saleId: 10, roundName: "Community", totalAmount: 1000 },
        ],
        vestingSchedule: [
          {
            saleId: 10,
            roundName: "Community",
            tgeUnlockPercent: 0,
            vestingType: "linear",
            vestingFrequency: "Monthly",
            vestingDurationMonths: 24,
          },
        ],
      },
    });

    expect(result.written).toEqual({
      tokenAllocations: 0,
      vestingRounds: 1,
      vestingSchedules: 1,
      vestingSummaries: 0,
      unlockEvents: 0,
    });
    expect(result.skipped).toEqual({
      vestingSchedulesMissingTokenAllocation: 0,
      vestingSchedulesMissingRound: 0,
      vestingSchedulesAmbiguousTokenAllocation: 0,
      vestingSchedulesAmbiguousRound: 0,
    });
    expect(result.warnings[0]).toContain("partial links");
    expect(vestingService.upsertVestingSchedule).toHaveBeenCalledTimes(1);
    expect(vestingService.upsertVestingSchedule.mock.calls[0][0]).toMatchObject(
      {
        roundName: "Community",
        vestingRoundId: expect.any(Types.ObjectId),
        metadata: expect.objectContaining({
          allocationLinkStatus: "missing",
          roundLinkStatus: "linked",
        }),
      }
    );
    expect(
      vestingService.upsertVestingSchedule.mock.calls[0][0].tokenAllocationId
    ).toBeUndefined();
  });

  it("does not fall back to original raw source when an empty override is supplied", async () => {
    const { service, tokenAllocationModel } = createService();
    const batch = solanaLikeReviewBatch();

    await expect(
      service.applyReviewBatch(batch, {
        rawSourceOverride: {
          tokenAllocation: [],
          vestingRounds: [],
          vestingSchedule: [],
          vestingSummary: {},
        },
      })
    ).rejects.toThrow("Approved vesting review has no vesting rows to apply.");

    expect(tokenAllocationModel.deleteMany).not.toHaveBeenCalled();
  });

  it("lets an unlock write failure abort the whole replacement transaction", async () => {
    const {
      service,
      unlocksService,
      tokenAllocationModel,
      session,
      connection,
    } = createService();
    unlocksService.upsertUnlockEvent.mockRejectedValueOnce(
      new Error("unlock persistence failed")
    );

    await expect(
      service.applyReviewBatch(solanaLikeReviewBatch())
    ).rejects.toThrow("unlock persistence failed");

    expect(tokenAllocationModel.deleteMany).toHaveBeenCalledWith(
      { canonicalProjectId },
      { session }
    );
    expect(unlocksService.upsertUnlockEvent.mock.calls[0][1]).toBe(session);
    expect(session.abortTransaction).toHaveBeenCalledTimes(1);
    expect(session.endSession).toHaveBeenCalledTimes(1);
    expect(connection.startSession).toHaveBeenCalledTimes(1);
  });

  it("loads confirmed project vesting as editable raw source", async () => {
    const { service } = createService({
      tokenAllocations: [
        {
          canonicalProjectId,
          sourceType: "dropstab",
          saleId: 2,
          name: "Small",
          normalizedName: "small",
          allocationPercent: 10,
          amount: 100,
          sourceSlug: "solana",
          provenance: { sourceProjectKey: "19067" },
        },
        {
          canonicalProjectId,
          sourceType: "dropstab",
          saleId: 1,
          name: "Large",
          normalizedName: "large",
          allocationPercent: 30,
          amount: 300,
          sourceSlug: "solana",
          provenance: { sourceProjectKey: "19067" },
        },
      ],
      vestingRounds: [
        {
          canonicalProjectId,
          sourceType: "dropstab",
          saleId: 1,
          roundName: "Large",
          normalizedRoundName: "large",
          totalAmount: 300,
          unlockedPercentSource: 20,
          lockedPercentSource: 80,
        },
      ],
      vestingSchedules: [
        {
          canonicalProjectId,
          sourceType: "dropstab",
          saleId: 1,
          roundName: "Large",
          normalizedRoundName: "large",
          tgeUnlockPercent: 10,
          vestingType: "linear",
          currentUnlockedPercentSource: 20,
          currentLockedPercentSource: 80,
        },
      ],
      vestingSummaries: [
        {
          canonicalProjectId,
          sourceType: "dropstab",
          totalAmount: 400,
          unlockedPercent: 20,
          lockedPercent: 80,
          sourceLockedValueUsd: 500,
        },
      ],
    });

    const snapshot = await service.getConfirmedProjectVesting(
      canonicalProjectId
    );

    expect(snapshot.sourceType).toBe("dropstab");
    expect(snapshot.sourceSlug).toBe("solana");
    expect(snapshot.sourceProjectKey).toBe("19067");
    expect(snapshot.counts).toEqual({
      tokenAllocation: 2,
      vestingRounds: 1,
      vestingSchedule: 1,
      vestingSummary: 1,
    });
    expect(snapshot.rawSource.tokenAllocation.map((row) => row.name)).toEqual([
      "Large",
      "Small",
    ]);
    expect(snapshot.rawSource.vestingSchedule[0]).toMatchObject({
      roundName: "Large",
      currentUnlockedPercent: 20,
      currentLockedPercent: 80,
    });
    expect(snapshot.rawSource.vestingSummary).toMatchObject({
      totalAmount: 400,
      lockedValueUsd: 500,
    });
  });

  it("replaces confirmed project vesting from edited raw source", async () => {
    const { service, vestingService } = createService();

    const result = await service.replaceProjectVestingFromRaw({
      canonicalProjectId,
      sourceType: "dropstab",
      sourceSlug: "solana",
      sourceProjectKey: "19067",
      rawSource: {
        tokenAllocation: [
          { saleId: 7, name: "Community", percent: 22, amount: 220 },
        ],
        vestingRounds: [
          { saleId: 7, roundName: "Community", totalAmount: 220 },
        ],
        vestingSchedule: [
          {
            saleId: 7,
            roundName: "Community",
            tgeUnlockPercent: 5,
            vestingType: "linear",
            currentUnlockedPercent: 25,
            currentLockedPercent: 75,
          },
        ],
        vestingSummary: {
          totalAmount: 220,
          unlockedPercent: 25,
          lockedPercent: 75,
        },
      },
    });

    expect(result.applied).toBe(true);
    expect(result.written).toEqual({
      tokenAllocations: 1,
      vestingRounds: 1,
      vestingSchedules: 1,
      vestingSummaries: 1,
      unlockEvents: 0,
    });
    expect(vestingService.upsertTokenAllocation.mock.calls[0][0]).toMatchObject(
      {
        name: "Community",
        allocationPercent: 22,
        status: "active",
      }
    );
    expect(vestingService.upsertVestingSchedule.mock.calls[0][0]).toMatchObject(
      {
        roundName: "Community",
        currentUnlockedPercentSource: 25,
        currentLockedPercentSource: 75,
        status: "active",
      }
    );
  });

  function solanaLikeReviewBatch() {
    return {
      _id: new Types.ObjectId(),
      domain: "vesting",
      reason: "MISSING_REQUIRED_RELATION",
      status: "open",
      canonicalProjectId,
      projectKey: "19067",
      projectName: "Solana",
      metadata: {
        reviewScope: "whole_vesting_component",
      },
      candidates: [
        {
          entityType: "vesting_component",
          sourceType: "dropstab",
          sourceId: "19067",
          sourcePath: new Types.ObjectId().toHexString(),
          sourceUrl: "https://dropstab.com/coins/solana",
          normalizedPayload: {
            normalizedName: "solana",
            normalizedSymbol: "sol",
            normalizedSlug: "solana",
          },
          metadata: {
            suggestedAction: "review_and_create_vesting_records",
          },
          payload: {
            sourceSlug: "solana",
            sourceProjectKey: "19067",
            rawSource: {
              tokenAllocation: [
                { saleId: 1, name: "Team", percent: 12, amount: 120 },
                { saleId: 2, name: "Reserve", percent: 8, amount: 80 },
              ],
              vestingRounds: [
                { saleId: 1, roundName: "Team", totalAmount: 120 },
              ],
              vestingSchedule: [
                {
                  saleId: 1,
                  roundName: "Team",
                  tgeUnlockPercent: 0,
                  vestingType: "cliff_linear",
                  vestingFrequency: "Monthly",
                  vestingDurationMonths: 24,
                  startDate: "2024-01-01T00:00:00.000Z",
                  endDate: "2026-01-01T00:00:00.000Z",
                },
              ],
              unlockingEvents: [
                {
                  unlockDate: "2025-01-01T00:00:00.000Z",
                  unlockType: "vesting",
                  rounds: [
                    {
                      saleId: 1,
                      roundName: "Team",
                      amount: 10,
                      percentOfSupply: 2,
                    },
                  ],
                },
              ],
              vestingSummary: {
                totalAmount: 500000000,
                unlockedAmount: 306750000,
                lockedAmount: 15250000,
                unlockedPercent: 61.35,
                lockedPercent: 3.05,
                untrackedPercent: 35.6,
                unlockedValueUsd: 23150000000,
                lockedValueUsd: 1149000000,
                lastUnlockDate: "2028-09-07T00:00:00.000Z",
              },
            },
          },
        },
      ],
    };
  }

  function modelWithRowsAndDeleteCount(deletedCount: number, rows: any[]) {
    return {
      deleteMany: jest.fn().mockResolvedValue({ deletedCount }),
      find: jest.fn(() => ({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(rows),
      })),
    };
  }
});
