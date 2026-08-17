import { Types } from "mongoose";
import { FomoV2UnlockEventApplyService } from "./unlock-event-apply.service";

describe("FomoV2UnlockEventApplyService", () => {
  const canonicalProjectId = new Types.ObjectId("64b64c000000000000000001");
  const eventId = new Types.ObjectId("64b64c000000000000000002");
  const allocationId = new Types.ObjectId("64b64c000000000000000003");
  const roundId = new Types.ObjectId("64b64c000000000000000004");
  const scheduleId = new Types.ObjectId("64b64c000000000000000005");
  const summaryId = new Types.ObjectId("64b64c000000000000000006");
  const nextEventId = new Types.ObjectId("64b64c000000000000000007");

  it("applies a due unlock once and persists the consumed event", async () => {
    const harness = createHarness();
    const now = new Date("2026-07-08T00:00:00.000Z");

    const result = await harness.service.run({
      write: true,
      limit: 10,
      now,
    });

    expect(result.eventsApplied).toBe(1);
    expect(result.vestingRoundsUpdated).toBe(1);
    expect(result.vestingSchedulesUpdated).toBe(1);
    expect(result.vestingSummariesUpdated).toBe(1);
    expect(harness.vestingRoundModel.updateOne).toHaveBeenCalledWith(
      { _id: roundId },
      {
        $set: expect.objectContaining({
          unlockedAmountSource: 25,
          lockedAmountSource: 75,
          unlockedPercentSource: 25,
          lockedPercentSource: 75,
        }),
      }
    );
    expect(harness.vestingScheduleModel.updateOne).toHaveBeenCalledWith(
      { _id: scheduleId },
      {
        $set: expect.objectContaining({
          currentUnlockedPercentSource: 25,
          currentLockedPercentSource: 75,
        }),
      }
    );
    expect(harness.vestingSummaryModel.updateOne).toHaveBeenCalledWith(
      { _id: summaryId },
      {
        $set: expect.objectContaining({
          unlockedAmount: 405,
          lockedAmount: 595,
          unlockedPercent: 40.5,
          lockedPercent: 59.5,
          lastUnlockDate: new Date("2026-07-07T00:00:00.000Z"),
          nextUnlockDate: new Date("2026-08-07T00:00:00.000Z"),
          nextUnlockEventId: nextEventId,
        }),
      }
    );
    expect(harness.unlockEventModel.updateOne).toHaveBeenCalledWith(
      { _id: eventId },
      {
        $set: expect.objectContaining({
          appliedAt: now,
          appliedStatus: "applied",
          appliedTo: expect.objectContaining({
            appliedAmount: 5,
            previousUnlockedAmount: 20,
            newUnlockedAmount: 25,
          }),
        }),
        $unset: { applyError: "" },
      }
    );
    const nextEventFilter = harness.unlockEventModel.findOne.mock.calls[0][0];
    expect(nextEventFilter.sourceType).toBeInstanceOf(RegExp);
    expect(nextEventFilter.sourceType.test("dropstab")).toBe(true);
    expect(nextEventFilter.sourceType.test("drop-stab")).toBe(true);
    expect(nextEventFilter.sourceType.test("icodrops")).toBe(false);
  });

  it("reports the same change in dry-run without writing", async () => {
    const harness = createHarness();

    const result = await harness.service.run({
      limit: 10,
      now: "2026-07-08T00:00:00.000Z",
    });

    expect(result.dryRun).toBe(true);
    expect(result.eventsWouldApply).toBe(1);
    expect(harness.vestingRoundModel.updateOne).not.toHaveBeenCalled();
    expect(harness.vestingScheduleModel.updateOne).not.toHaveBeenCalled();
    expect(harness.vestingSummaryModel.updateOne).not.toHaveBeenCalled();
    expect(harness.unlockEventModel.updateOne).not.toHaveBeenCalled();
  });

  function createHarness() {
    const event = {
      _id: eventId,
      canonicalProjectId,
      sourceType: "dropstab",
      unlockDate: new Date("2026-07-07T00:00:00.000Z"),
      amount: 5,
      percentOfSupply: 0.5,
      roundName: "Seed",
      tokenAllocationId: allocationId,
      vestingRoundId: roundId,
      vestingScheduleId: scheduleId,
    };
    const round = {
      _id: roundId,
      canonicalProjectId,
      sourceType: "dropstab",
      totalAmount: 100,
      unlockedAmountSource: 20,
      unlockedPercentSource: 20,
    };
    const schedule = {
      _id: scheduleId,
      canonicalProjectId,
      sourceType: "dropstab",
      tokenAllocationId: allocationId,
      vestingRoundId: roundId,
      currentUnlockedPercentSource: 20,
    };
    const allocation = {
      _id: allocationId,
      amount: 100,
    };
    const summary = {
      _id: summaryId,
      canonicalProjectId,
      sourceType: "dropstab",
      totalAmount: 1000,
      unlockedAmount: 400,
      lockedAmount: 600,
    };
    const nextEvent = {
      _id: nextEventId,
      canonicalProjectId,
      sourceType: "dropstab",
      unlockDate: new Date("2026-08-07T00:00:00.000Z"),
      amount: 5,
    };
    const unlockEventModel = {
      find: jest.fn().mockReturnValue(findQuery([event])),
      findOneAndUpdate: jest.fn().mockReturnValue(leanQuery(event)),
      findOne: jest.fn().mockReturnValue(sortLeanQuery(nextEvent)),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const tokenAllocationModel = {
      findById: jest.fn().mockReturnValue(leanQuery(allocation)),
    };
    const vestingRoundModel = {
      findById: jest.fn().mockReturnValue(leanQuery(round)),
      findOne: jest.fn().mockReturnValue(leanQuery(round)),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const vestingScheduleModel = {
      findById: jest.fn().mockReturnValue(leanQuery(schedule)),
      findOne: jest.fn().mockReturnValue(leanQuery(schedule)),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const vestingSummaryModel = {
      findOne: jest.fn().mockReturnValue(leanQuery(summary)),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const configService = { get: jest.fn().mockReturnValue(undefined) };
    const service = new FomoV2UnlockEventApplyService(
      unlockEventModel as any,
      tokenAllocationModel as any,
      vestingRoundModel as any,
      vestingScheduleModel as any,
      vestingSummaryModel as any,
      configService as any
    );

    return {
      service,
      unlockEventModel,
      tokenAllocationModel,
      vestingRoundModel,
      vestingScheduleModel,
      vestingSummaryModel,
    };
  }

  function findQuery(value: any) {
    const query: any = {
      sort: jest.fn(() => query),
      limit: jest.fn(() => query),
      lean: jest.fn().mockResolvedValue(value),
    };
    return query;
  }

  function sortLeanQuery(value: any) {
    const query: any = {
      sort: jest.fn(() => query),
      lean: jest.fn().mockResolvedValue(value),
    };
    return query;
  }

  function leanQuery(value: any) {
    return {
      lean: jest.fn().mockResolvedValue(value),
    };
  }
});
