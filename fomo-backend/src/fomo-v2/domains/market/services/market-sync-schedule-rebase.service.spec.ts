import { BadRequestException } from "@nestjs/common";
import { FomoV2MarketSyncScheduleRebaseService } from "./market-sync-schedule-rebase.service";

describe("FomoV2MarketSyncScheduleRebaseService", () => {
  const generatedAt = new Date("2026-07-16T05:00:00.000Z");
  const originalEnv: Record<string, string | undefined> = {};
  const intervalEnv: Record<string, string> = {
    FOMO_V2_MARKET_SYNC_HISTORY_HOT_INTERVAL_MS: "1000",
    FOMO_V2_MARKET_SYNC_HISTORY_WARM_INTERVAL_MS: "2000",
    FOMO_V2_MARKET_SYNC_HISTORY_COLD_INTERVAL_MS: "3000",
    FOMO_V2_MARKET_SYNC_EXCHANGES_HOT_INTERVAL_MS: "4000",
    FOMO_V2_MARKET_SYNC_EXCHANGES_WARM_INTERVAL_MS: "5000",
    FOMO_V2_MARKET_SYNC_EXCHANGES_COLD_INTERVAL_MS: "6000",
    FOMO_V2_MARKET_SYNC_LATEST_HOT_INTERVAL_MS: "30000",
    FOMO_V2_MARKET_SYNC_LATEST_HOT_WARM_ENABLED: "true",
    FOMO_V2_MARKET_SYNC_LATEST_HOT_WARM_MAX_RANK: "2500",
    FOMO_V2_MARKET_SYNC_LATEST_HOT_WARM_INTERVAL_MS: "300000",
  };

  beforeAll(() => {
    for (const [name, value] of Object.entries(intervalEnv)) {
      originalEnv[name] = process.env[name];
      process.env[name] = value;
    }
  });

  afterAll(() => {
    for (const name of Object.keys(intervalEnv)) {
      if (originalEnv[name] === undefined) delete process.env[name];
      else process.env[name] = originalEnv[name];
    }
  });

  function createSubject(rows: any[], writeResult: any = { matchedCount: 0, modifiedCount: 0 }) {
    const query = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(rows),
    };
    const collection = {
      bulkWrite: jest.fn().mockResolvedValue(writeResult),
    };
    const model = {
      find: jest.fn().mockReturnValue(query),
      collection,
    };
    return {
      service: new FomoV2MarketSyncScheduleRebaseService(model as any),
      model,
      query,
      collection,
    };
  }

  const rows = [
    {
      _id: "hot-id",
      tier: "HOT",
      rank: 100,
      historyDueAt: new Date("2026-07-15T00:00:00.000Z"),
      exchangesDueAt: new Date("2026-07-15T01:00:00.000Z"),
    },
    {
      _id: "warm-locked-id",
      tier: "WARM",
      rank: 300,
      historyDueAt: new Date("2026-07-14T00:00:00.000Z"),
      exchangesDueAt: new Date("2026-07-14T01:00:00.000Z"),
      lockedUntil: new Date("2026-07-16T05:30:00.000Z"),
    },
    {
      _id: "cold-expired-lock-id",
      tier: "COLD",
      rank: 6000,
      historyDueAt: new Date("2026-07-13T00:00:00.000Z"),
      exchangesDueAt: new Date("2026-07-13T01:00:00.000Z"),
      lockedUntil: new Date("2026-07-16T04:59:59.000Z"),
    },
  ];

  it("previews deterministic future schedules without writing", async () => {
    const { service, collection } = createSubject(rows);

    const first = await service.rebase({ dryRun: true }, generatedAt);
    const second = await service.rebase({}, generatedAt);

    expect(collection.bulkWrite).not.toHaveBeenCalled();
    expect(first.dryRun).toBe(true);
    expect(first.applied).toBe(false);
    expect(first.counts).toEqual({
      scanned: 3,
      eligible: 2,
      skippedLocked: 1,
      planned: 2,
      matched: 0,
      modified: 0,
      skippedDuringApply: 0,
    });
    expect(first.windows.after).toEqual(second.windows.after);
    expect(first.latestCadence.enabled).toBe(true);
    expect(first.latestCadence.hotWarmRankRange).toEqual({ minRank: 251, maxRank: 2500 });
    expect(first.latestCadence.byCadence.HOT.projects).toBe(1);
    expect(first.latestCadence.byCadence.HOT_WARM.projects).toBe(1);
    expect(first.latestCadence.byCadence.WARM.projects).toBe(0);
    expect(first.latestCadence.byCadence.COLD.projects).toBe(1);
    expect(first.byTier.WARM.windows.before.history).toEqual({
      earliest: null,
      latest: null,
    });

    for (const tier of ["HOT", "COLD"] as const) {
      for (const kind of ["history", "exchanges"] as const) {
        const window = first.byTier[tier].windows.after[kind];
        const dueAt = new Date(window.earliest).getTime();
        expect(dueAt).toBeGreaterThan(generatedAt.getTime());
        expect(dueAt).toBeLessThanOrEqual(
          generatedAt.getTime() + first.byTier[tier].intervalsMs[kind],
        );
      }
    }
  });

  it("rejects apply without the exact confirmation", async () => {
    const { service, collection } = createSubject(rows);

    await expect(
      service.rebase({ dryRun: false, confirm: "wrong" }, generatedAt),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(collection.bulkWrite).not.toHaveBeenCalled();
  });

  it("applies only the two due fields and rechecks locks atomically", async () => {
    const { service, collection } = createSubject(rows, {
      matchedCount: 1,
      modifiedCount: 1,
    });

    const result = await service.rebase(
      { dryRun: false, confirm: "REBASE_HISTORY_EXCHANGES" },
      generatedAt,
    );

    expect(collection.bulkWrite).toHaveBeenCalledTimes(2);
    const allOperations = collection.bulkWrite.mock.calls.flatMap((call) => call[0]);
    expect(allOperations).toHaveLength(2);

    for (const operation of allOperations) {
      expect(Object.keys(operation.updateOne.update.$set).sort()).toEqual([
        "exchangesDueAt",
        "historyDueAt",
      ]);
      expect(operation.updateOne.filter.$or).toEqual([
        { lockedUntil: { $exists: false } },
        { lockedUntil: null },
        { lockedUntil: { $lte: generatedAt } },
      ]);
    }

    expect(result.applied).toBe(true);
    expect(result.counts.matched).toBe(2);
    expect(result.counts.modified).toBe(2);
    expect(result.counts.skippedLocked).toBe(1);
    expect(result.counts.skippedDuringApply).toBe(0);
  });
});
