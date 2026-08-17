import { FomoV2MarketSyncProcessor } from "./market-sync.processor";

describe("FomoV2MarketSyncProcessor", () => {
  const payload = {
    kind: "performance" as const,
    tier: "HOT" as const,
    targets: [
      {
        syncStateId: "sync-state-1",
        marketAssetId: "market-asset-1",
        coingeckoId: "bitcoin",
        tier: "HOT" as const,
      },
    ],
    claimOwner: "worker:1",
    reason: "cron" as const,
    queuedAt: "2026-07-18T00:00:00.000Z",
  };

  const createProcessor = () => {
    const failure = new Error("provider unavailable");
    const performanceService = {
      recalculateForMarketAssets: jest.fn().mockRejectedValue(failure),
    };
    const syncStateService = {
      markFailure: jest.fn().mockResolvedValue(undefined),
      markSuccess: jest.fn(),
    };
    const processor = new FomoV2MarketSyncProcessor(
      {} as any,
      {} as any,
      performanceService as any,
      {} as any,
      {} as any,
      {} as any,
      syncStateService as any,
      {} as any
    );
    (processor as any).logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    return { processor, failure, performanceService, syncStateService };
  };

  it("records the failure and rejects so Bull applies attempts and backoff", async () => {
    const { processor, failure, syncStateService } = createProcessor();
    const job = { id: "job-1", data: payload } as any;

    await expect(processor.handlePerformanceBatch(job)).rejects.toBe(failure);
    expect(syncStateService.markFailure).toHaveBeenCalledWith(
      "performance",
      payload.targets,
      payload.claimOwner,
      failure
    );
  });

  it("preserves the processing error when failure tracking also fails", async () => {
    const { processor, failure, syncStateService } = createProcessor();
    syncStateService.markFailure.mockRejectedValueOnce(
      new Error("failure tracking unavailable")
    );

    await expect(
      processor.handlePerformanceBatch({ id: "job-2", data: payload } as any)
    ).rejects.toBe(failure);
  });
});
