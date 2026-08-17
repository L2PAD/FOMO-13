import { Types } from "mongoose";
import { FomoV2MarketSyncSchedulerService } from "./market-sync-scheduler.service";
import { FomoV2MarketSyncStateService } from "./market-sync-state.service";
import {
  getFomoV2MarketLatestCadenceDefinitions,
  resolveFomoV2MarketLatestCadence,
} from "./market-sync-latest-cadence.config";

describe("FOMO v2 latest cadence", () => {
  const envNames = [
    "FOMO_V2_MARKET_SYNC_LATEST_HOT_WARM_ENABLED",
    "FOMO_V2_MARKET_SYNC_LATEST_HOT_WARM_MAX_RANK",
    "FOMO_V2_MARKET_SYNC_LATEST_HOT_WARM_INTERVAL_MS",
  ] as const;
  const originalEnv = new Map(envNames.map((name) => [name, process.env[name]]));

  beforeEach(() => {
    process.env.FOMO_V2_MARKET_SYNC_LATEST_HOT_WARM_ENABLED = "true";
    process.env.FOMO_V2_MARKET_SYNC_LATEST_HOT_WARM_MAX_RANK = "2500";
    process.env.FOMO_V2_MARKET_SYNC_LATEST_HOT_WARM_INTERVAL_MS = "300000";
  });

  afterAll(() => {
    for (const name of envNames) {
      const original = originalEnv.get(name);
      if (original === undefined) delete process.env[name];
      else process.env[name] = original;
    }
  });

  it("splits WARM into disjoint HOT_WARM and WARM latest cadences", () => {
    expect(getFomoV2MarketLatestCadenceDefinitions()).toEqual([
      { cadence: "HOT", tier: "HOT", rankMode: "all" },
      { cadence: "HOT_WARM", tier: "WARM", rankMode: "between", minRank: 251, maxRank: 2500 },
      { cadence: "WARM", tier: "WARM", rankMode: "outside", minRank: 251, maxRank: 2500 },
      { cadence: "COLD", tier: "COLD", rankMode: "all" },
    ]);
    expect(resolveFomoV2MarketLatestCadence("WARM", 251)).toBe("HOT_WARM");
    expect(resolveFomoV2MarketLatestCadence("WARM", 2500)).toBe("HOT_WARM");
    expect(resolveFomoV2MarketLatestCadence("WARM", 2501)).toBe("WARM");
  });

  it("keeps the original three cadences when HOT_WARM is disabled", () => {
    process.env.FOMO_V2_MARKET_SYNC_LATEST_HOT_WARM_ENABLED = "false";

    expect(getFomoV2MarketLatestCadenceDefinitions()).toEqual([
      { cadence: "HOT", tier: "HOT", rankMode: "all" },
      { cadence: "WARM", tier: "WARM", rankMode: "all" },
      { cadence: "COLD", tier: "COLD", rankMode: "all" },
    ]);
    expect(resolveFomoV2MarketLatestCadence("WARM", 500)).toBe("WARM");
  });

  it("claims each latest cadence with disjoint rank filters", async () => {
    const syncStateService = {
      claimDue: jest.fn().mockResolvedValue([]),
    };
    const scheduler = new FomoV2MarketSyncSchedulerService(
      syncStateService as any,
      { enqueueBatch: jest.fn() } as any,
    );

    await (scheduler as any).enqueueKind("latest");

    expect(syncStateService.claimDue).toHaveBeenCalledTimes(4);
    expect(syncStateService.claimDue.mock.calls[1][0]).toMatchObject({
      kind: "latest",
      tier: "WARM",
      filter: { rank: { $gte: 251, $lte: 2500 } },
    });
    expect(syncStateService.claimDue.mock.calls[2][0].filter).toEqual({
      $or: [
        { rank: { $lt: 251 } },
        { rank: { $gt: 2500 } },
        { rank: { $exists: false } },
        { rank: null },
      ],
    });
  });

  it("reschedules HOT_WARM latest after five minutes", async () => {
    const syncStateModel = {
      bulkWrite: jest.fn().mockResolvedValue({}),
    };
    const service = new FomoV2MarketSyncStateService(syncStateModel as any, {} as any);
    const finishedAt = new Date("2026-07-16T06:00:00.000Z");

    await service.markSuccess(
      "latest",
      [{
        syncStateId: new Types.ObjectId().toHexString(),
        marketAssetId: new Types.ObjectId().toHexString(),
        coingeckoId: "example",
        tier: "WARM",
        rank: 300,
        latestCadence: "HOT_WARM",
      }],
      "owner",
      finishedAt,
    );

    const operation = syncStateModel.bulkWrite.mock.calls[0][0][0];
    expect(operation.updateOne.update.$set.latestDueAt).toEqual(
      new Date(finishedAt.getTime() + 300000),
    );
  });

  it("anchors a fast HOT job to its claim time for a real 30-second cadence", async () => {
    const syncStateModel = {
      bulkWrite: jest.fn().mockResolvedValue({}),
    };
    const service = new FomoV2MarketSyncStateService(syncStateModel as any, {} as any);
    const claimedAt = new Date("2026-07-16T06:00:00.000Z");
    const finishedAt = new Date("2026-07-16T06:00:02.000Z");

    await service.markSuccess(
      "latest",
      [{
        syncStateId: new Types.ObjectId().toHexString(),
        marketAssetId: new Types.ObjectId().toHexString(),
        coingeckoId: "bitcoin",
        tier: "HOT",
        rank: 1,
        claimedAt: claimedAt.toISOString(),
        latestCadence: "HOT",
      }],
      "owner",
      finishedAt,
    );

    const operation = syncStateModel.bulkWrite.mock.calls[0][0][0];
    expect(operation.updateOne.update.$set.latestDueAt).toEqual(
      new Date(claimedAt.getTime() + 30000),
    );
  });

  it("claims derived targets only when their own dueAt is due", async () => {
    const row = {
      _id: new Types.ObjectId(),
      marketAssetId: new Types.ObjectId(),
      coingeckoId: "example",
      tier: "WARM",
      rank: 300,
    };
    const lean = jest.fn().mockResolvedValue([row]);
    const syncStateModel = {
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      find: jest.fn().mockReturnValue({ lean }),
    };
    const service = new FomoV2MarketSyncStateService(syncStateModel as any, {} as any);

    const result = await service.claimTargets(
      "performance",
      [{
        syncStateId: row._id.toHexString(),
        marketAssetId: row.marketAssetId.toHexString(),
        coingeckoId: row.coingeckoId,
        tier: "WARM",
      }],
      "derived-owner",
      60000,
    );

    expect(syncStateModel.updateMany.mock.calls[0][0]).toMatchObject({
      trading: "CURRENTLY_TRADING",
      status: "active",
      performanceDueAt: { $lte: expect.any(Date) },
    });
    expect(result).toHaveLength(1);
    expect(result[0].latestCadence).toBe("HOT_WARM");
  });
});
