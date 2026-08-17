import { FomoV2MarketSyncSchedulerService } from "./market-sync-scheduler.service";

describe("FomoV2MarketSyncSchedulerService env ownership", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it("queues live market work when its env controls are enabled", async () => {
    process.env.FOMO_V2_MARKET_QUEUE_ENABLED = "true";
    process.env.FOMO_V2_MARKET_DATA_ENABLED = "true";
    process.env.FOMO_V2_MARKET_SYNC_LATEST_ENABLED = "true";

    const syncState = {
      claimDue: jest.fn().mockResolvedValue([]),
    };
    const queue = {
      enqueueBatch: jest.fn(),
    };
    const scheduler = new FomoV2MarketSyncSchedulerService(
      syncState as any,
      queue as any,
    );

    await scheduler.enqueueDueLatestMarketSyncJobs();

    expect(syncState.claimDue).toHaveBeenCalled();
    expect(queue.enqueueBatch).not.toHaveBeenCalled();
  });

  it("does not queue live market work when its env control is disabled", async () => {
    process.env.FOMO_V2_MARKET_QUEUE_ENABLED = "true";
    process.env.FOMO_V2_MARKET_DATA_ENABLED = "false";

    const syncState = {
      claimDue: jest.fn(),
    };
    const scheduler = new FomoV2MarketSyncSchedulerService(
      syncState as any,
      { enqueueBatch: jest.fn() } as any,
    );

    await scheduler.enqueueDueLatestMarketSyncJobs();

    expect(syncState.claimDue).not.toHaveBeenCalled();
  });
});
