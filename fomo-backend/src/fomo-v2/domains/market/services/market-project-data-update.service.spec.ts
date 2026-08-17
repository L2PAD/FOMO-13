import { FomoV2MarketProjectDataUpdateService } from "./market-project-data-update.service";

describe("FomoV2MarketProjectDataUpdateService execution fence", () => {
  it("checks the fence around every bulk chunk and stops before the next write", async () => {
    const service = Object.create(
      FomoV2MarketProjectDataUpdateService.prototype
    ) as FomoV2MarketProjectDataUpdateService;
    const model = {
      bulkWrite: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const operations = Array.from({ length: 1_001 }, (_, index) => ({
      updateOne: { filter: { index }, update: { $set: { index } } },
    }));
    const fenceError = new Error("managed lease lost");
    const assertExecutionActive = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(fenceError);

    await expect(
      (service as any).bulkWrite(
        model,
        operations,
        assertExecutionActive
      )
    ).rejects.toBe(fenceError);

    expect(model.bulkWrite).toHaveBeenCalledTimes(1);
    expect(model.bulkWrite.mock.calls[0][0]).toHaveLength(1_000);
    expect(assertExecutionActive).toHaveBeenCalledTimes(3);
  });

  it("maps a raw_coingecko_projects snapshot row without calling the live API", async () => {
    const candidateQuery: any = {
      sort: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        {
          _id: "read-model-1",
          marketAssetId: "market-asset-1",
          canonicalProjectId: "project-1",
          providerIds: { coingeckoId: "bitcoin" },
          tier: "HOT",
          symbol: "BTC",
        },
      ]),
    };
    const readModel = { find: jest.fn().mockReturnValue(candidateQuery) };
    const coinGeckoClient = {
      isConfigured: jest.fn().mockReturnValue(false),
      getMaxBatchSize: jest.fn().mockReturnValue(100),
      fetchMarketsBatch: jest.fn(),
      fetchMarketsPage: jest.fn(),
    };
    const snapshot = {
      snapshotId: "snapshot-market-1",
      parserKey: "coingecko:projects",
      sourceType: "coingecko",
      write: false,
      manifest: {},
      succeeded: 1,
    };
    const item = { snapshotId: snapshot.snapshotId };
    const snapshotReader = {
      validate: jest.fn().mockResolvedValue(snapshot),
      cursor: jest.fn().mockReturnValue({
        async *[Symbol.asyncIterator]() {
          yield item;
        },
      }),
      payload: jest.fn().mockReturnValue({
        source: "coingecko",
        coingecko_id: "bitcoin",
        symbol: "btc",
        name: "Bitcoin",
        current_price: 60_000,
        market_cap: 1_000_000,
        total_volume: 50_000,
        market_cap_rank: 1,
        price_change_percentage_24h: 2.5,
        market_data_updated_at: "2026-08-02T00:00:00.000Z",
      }),
    };
    const service = new FomoV2MarketProjectDataUpdateService(
      readModel as any,
      {} as any,
      { get: jest.fn() } as any,
      coinGeckoClient as any,
      {
        buildProjectUpdateSet: jest.fn().mockReturnValue({
          price: 60_000,
          marketCap: 1_000_000,
          volume24h: 50_000,
          marketDataUpdatedAt: "2026-08-02T00:00:00.000Z",
        }),
      } as any,
      { preferMirroredUrl: jest.fn() } as any,
      {} as any,
      {} as any,
      snapshotReader as any
    );

    const result = await service.runTier("HOT", {
      dryRun: true,
      snapshotId: snapshot.snapshotId,
      upstreamRunId: "upstream-market-1",
      upstreamParserKey: "coingecko:projects",
      sourceType: "coingecko",
      ignoreJobsEnabled: true,
      ignoreLocalRun: true,
      ignoreTierEnabled: true,
    });

    expect(snapshotReader.validate).toHaveBeenCalledWith({
      snapshotId: snapshot.snapshotId,
      parserKey: "coingecko:projects",
      sourceType: "coingecko",
      upstreamRunId: "upstream-market-1",
      write: false,
    });
    expect(result).toEqual(
      expect.objectContaining({
        rowsRequested: 1,
        rowsWouldUpdate: 1,
        requestsMade: 0,
      })
    );
    expect(coinGeckoClient.fetchMarketsBatch).not.toHaveBeenCalled();
    expect(coinGeckoClient.fetchMarketsPage).not.toHaveBeenCalled();
    expect(coinGeckoClient.getMaxBatchSize).not.toHaveBeenCalled();
  });
});
