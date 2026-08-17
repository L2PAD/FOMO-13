jest.mock("../../backers/services/backer-list-read-model.service", () => ({
  FomoV2BackerListReadModelService: class {},
}));
jest.mock("../../backers/services/backer-portfolio-rebuild.service", () => ({
  FomoV2BackerPortfolioRebuildService: class {},
}));
jest.mock("../../backers/services/backer-read.service", () => ({
  FomoV2BackerReadService: class {},
}));
jest.mock("../../funding/services/funding-feed-read-model.service", () => ({
  FomoV2FundingFeedReadModelService: class {},
}));
jest.mock("../../funding/services/funding-feed-read.service", () => ({
  FomoV2FundingFeedReadService: class {},
}));
jest.mock("../../ico/services/ico-project-read.service", () => ({
  FomoV2IcoProjectReadService: class {},
}));
jest.mock("../../market/services/market-project-read-model.service", () => ({
  FomoV2MarketProjectReadModelService: class {},
}));

import { FomoV2PostWriteMaterializationService } from "./post-write-materialization.service";

function completedMarket(scannedMarketAssets = 0, written = 0) {
  return {
    scannedMarketAssets,
    built: written,
    written,
    skipped: { missingCanonicalLink: 0, tierFiltered: 0 },
  };
}

function completedBackerList(scannedBackers = 0, written = 0) {
  return {
    scannedBackers,
    built: written,
    written,
    skipped: { missingBackerId: 0, missingName: 0 },
  };
}

function completedFundingFeed(scannedRounds = 0, written = 0) {
  return {
    scannedRounds,
    built: written,
    written,
    skipped: {
      duplicateSourceRounds: 0,
      missingFundingRoundId: 0,
      missingCanonicalProjectId: 0,
    },
  };
}

function completedIcoProjectFunding(scannedProjects = 0, written = 0) {
  return {
    scannedProjects,
    scannedRounds: scannedProjects,
    built: scannedProjects,
    written,
    withFunding: scannedProjects,
    withoutFunding: 0,
  };
}

function createHarness() {
  const market = {
    materializeFromV2Identity: jest.fn().mockResolvedValue(completedMarket()),
  };
  const portfolio = {
    run: jest.fn().mockResolvedValue({
      participantsScanned: 0,
      holdingsCreated: 0,
      holdingsDeleted: 0,
      holdingsWithMarketData: 0,
      holdingsWithoutMarketData: 0,
      errors: [],
    }),
  };
  const backerList = {
    materialize: jest.fn().mockResolvedValue(completedBackerList()),
  };
  const fundingFeed = {
    materialize: jest.fn().mockResolvedValue(completedFundingFeed()),
    materializeIcoProjectFunding: jest
      .fn()
      .mockResolvedValue(completedIcoProjectFunding()),
  };
  const backerRead = {
    refreshAnalyticsSnapshots: jest.fn().mockResolvedValue({
      skipped: false,
      snapshots: [{}, {}],
    }),
  };
  const fundingFeedRead = {
    invalidateReadModelReadinessCache: jest.fn(),
  };
  const icoProjectRead = { invalidateCaches: jest.fn() };
  const service = new FomoV2PostWriteMaterializationService(
    market as any,
    portfolio as any,
    backerList as any,
    fundingFeed as any,
    backerRead as any,
    fundingFeedRead as any,
    icoProjectRead as any
  );

  return {
    service,
    market,
    portfolio,
    backerList,
    fundingFeed,
    backerRead,
    fundingFeedRead,
    icoProjectRead,
  };
}

describe("FomoV2PostWriteMaterializationService", () => {
  it("does not write in dry-run mode and reports the affected routes", async () => {
    const harness = createHarness();

    const result = await harness.service.run({
      parserKey: "funding:dropstab",
      write: false,
    });

    expect(result).toEqual(
      expect.objectContaining({
        parserKey: "funding:dropstab",
        mode: "dry-run",
        status: "skipped",
        scanned: 0,
        written: 0,
        affectedRoutes: [
          "/crypto/projects",
          "/crypto/unlocking",
          "/crypto/backers",
          "/crypto/funding-feed",
        ],
        steps: [],
        errors: [],
      })
    );
    expect(harness.market.materializeFromV2Identity).not.toHaveBeenCalled();
    expect(harness.portfolio.run).not.toHaveBeenCalled();
    expect(harness.backerList.materialize).not.toHaveBeenCalled();
    expect(harness.fundingFeed.materialize).not.toHaveBeenCalled();
    expect(
      harness.fundingFeed.materializeIcoProjectFunding
    ).not.toHaveBeenCalled();
    expect(harness.backerRead.refreshAnalyticsSnapshots).not.toHaveBeenCalled();
    expect(
      harness.fundingFeedRead.invalidateReadModelReadinessCache
    ).not.toHaveBeenCalled();
    expect(harness.icoProjectRead.invalidateCaches).not.toHaveBeenCalled();
  });

  it("materializes a funding source in dependency order across complete batches", async () => {
    const harness = createHarness();
    const order: string[] = [];
    const progress: any[] = [];
    const assertExecutionActive = jest.fn();

    harness.market.materializeFromV2Identity.mockImplementation(
      async ({ offset }: any) => {
        order.push(`market:${offset}`);
        return offset === 0 ? completedMarket(2, 1) : completedMarket(1, 1);
      }
    );
    harness.portfolio.run.mockImplementation(async () => {
      order.push("portfolio");
      return {
        participantsScanned: 4,
        holdingsCreated: 3,
        holdingsDeleted: 2,
        holdingsWithMarketData: 2,
        holdingsWithoutMarketData: 1,
        errors: [],
      };
    });
    harness.backerList.materialize.mockImplementation(
      async ({ offset }: any) => {
        order.push(`backer-list:${offset}`);
        return offset === 0
          ? completedBackerList(2, 1)
          : completedBackerList(0, 0);
      }
    );
    harness.fundingFeed.materialize.mockImplementation(
      async ({ offset }: any) => {
        order.push(`funding-feed:${offset}`);
        return completedFundingFeed(1, 1);
      }
    );
    harness.fundingFeed.materializeIcoProjectFunding.mockImplementation(
      async ({ offset }: any) => {
        order.push(`ico-project-funding:${offset}`);
        return completedIcoProjectFunding(1, 1);
      }
    );
    harness.backerRead.refreshAnalyticsSnapshots.mockImplementation(
      async () => {
        order.push("analytics");
        return { skipped: false, snapshots: [{}, {}] };
      }
    );

    const result = await harness.service.run({
      parserKey: "funding:dropstab",
      write: true,
      batchSize: 2,
      assertExecutionActive,
      onProgress: (event) => {
        progress.push(event);
      },
    });

    expect(order).toEqual([
      "market:0",
      "market:2",
      "portfolio",
      "backer-list:0",
      "backer-list:2",
      "funding-feed:0",
      "ico-project-funding:0",
      "analytics",
    ]);
    expect(result.status).toBe("completed");
    expect(result.steps.map((step) => step.key)).toEqual([
      "market-project-read-model",
      "backer-portfolio-holdings",
      "backer-list-read-model",
      "funding-feed-read-model",
      "ico-project-funding-read-model",
      "backer-analytics-snapshots",
    ]);
    expect(result.scanned).toBe(13);
    expect(result.written).toBe(10);
    expect(harness.market.materializeFromV2Identity).toHaveBeenCalledWith(
      expect.objectContaining({
        offset: 0,
        limit: 2,
        write: true,
        confirmWrite: true,
        writePolicyParserKey: "funding:dropstab",
      })
    );
    expect(harness.backerRead.refreshAnalyticsSnapshots).toHaveBeenCalledWith(
      "parser-post-write:funding:dropstab",
      expect.any(Function)
    );
    expect(harness.portfolio.run).toHaveBeenCalledWith(
      expect.objectContaining({ assertExecutionActive: expect.any(Function) })
    );
    expect(harness.market.materializeFromV2Identity).toHaveBeenCalledWith(
      expect.objectContaining({ assertExecutionActive: expect.any(Function) })
    );
    expect(harness.backerList.materialize).toHaveBeenCalledWith(
      expect.objectContaining({ assertExecutionActive: expect.any(Function) })
    );
    expect(harness.fundingFeed.materialize).toHaveBeenCalledWith(
      expect.objectContaining({ assertExecutionActive: expect.any(Function) })
    );
    expect(
      harness.fundingFeed.materializeIcoProjectFunding
    ).toHaveBeenCalledWith(
      expect.objectContaining({ assertExecutionActive: expect.any(Function) })
    );
    expect(
      harness.fundingFeedRead.invalidateReadModelReadinessCache
    ).toHaveBeenCalledTimes(1);
    expect(harness.icoProjectRead.invalidateCaches).toHaveBeenCalledTimes(1);
    expect(assertExecutionActive).toHaveBeenCalled();
    expect(progress).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          phase: "before-step",
          step: "backer-portfolio-holdings",
          stepIndex: 2,
          stepCount: 6,
        }),
        expect.objectContaining({
          phase: "after-batch",
          step: "market-project-read-model",
          stepIndex: 1,
          stepCount: 6,
          batch: 2,
          scanned: 3,
          written: 2,
        }),
        expect.objectContaining({
          phase: "after-step",
          step: "backer-analytics-snapshots",
          stepIndex: 6,
          stepCount: 6,
          status: "completed",
        }),
      ])
    );
  });

  it("continues best-effort and reports failed and partially successful steps", async () => {
    const harness = createHarness();
    harness.market.materializeFromV2Identity.mockRejectedValue(
      new Error("market failed")
    );
    harness.portfolio.run.mockResolvedValue({
      participantsScanned: 3,
      holdingsCreated: 2,
      errors: [{ participantId: "bad-row" }],
    });
    harness.backerList.materialize.mockRejectedValue(
      new Error("backer list failed")
    );

    const result = await harness.service.run({
      parserKey: "funding:icodrops",
      write: true,
    });

    expect(result.status).toBe("partial");
    expect(result.steps.map((step) => step.status)).toEqual([
      "failed",
      "partial",
      "failed",
      "completed",
      "completed",
      "completed",
    ]);
    expect(result.errors).toEqual([
      expect.objectContaining({
        step: "market-project-read-model",
        message: "market failed",
      }),
      expect.objectContaining({
        step: "backer-portfolio-holdings",
        message: expect.stringContaining("1 item error"),
      }),
      expect.objectContaining({
        step: "backer-list-read-model",
        message: "backer list failed",
      }),
    ]);
    expect(harness.fundingFeed.materialize).toHaveBeenCalled();
    expect(harness.backerRead.refreshAnalyticsSnapshots).toHaveBeenCalled();
  });

  it("keeps source-specific plans isolated and records inline materializers", async () => {
    const ico = createHarness();
    const icoResult = await ico.service.run({
      parserKey: "ico:icodrops",
      write: true,
    });

    expect(icoResult.steps.map((step) => step.key)).toEqual([
      "ico-project-read-model:inline",
      "market-project-read-model",
      "backer-list-read-model",
      "funding-feed-read-model",
      "ico-project-funding-read-model",
      "backer-analytics-snapshots",
    ]);
    expect(icoResult.steps[0]).toEqual(
      expect.objectContaining({
        status: "completed",
        inline: true,
        routes: ["/crypto/projects"],
      })
    );
    expect(ico.portfolio.run).not.toHaveBeenCalled();

    const unlocks = createHarness();
    const unlockResult = await unlocks.service.run({
      parserKey: "unlocks:dropstab",
      write: true,
    });
    expect(unlockResult.steps.map((step) => step.key)).toEqual([
      "unlock-events:inline",
      "market-project-read-model",
    ]);
    expect(unlocks.portfolio.run).not.toHaveBeenCalled();
    expect(unlocks.backerList.materialize).not.toHaveBeenCalled();
    expect(unlocks.fundingFeed.materialize).not.toHaveBeenCalled();
    expect(unlocks.backerRead.refreshAnalyticsSnapshots).not.toHaveBeenCalled();

    const market = createHarness();
    const marketResult = await market.service.run({
      parserKey: "market:coingecko",
      write: true,
    });
    expect(marketResult.steps[0].key).toBe("market-project-read-model:inline");
    expect(market.market.materializeFromV2Identity).not.toHaveBeenCalled();
    expect(market.portfolio.run).toHaveBeenCalled();
    expect(market.backerList.materialize).toHaveBeenCalled();
    expect(market.fundingFeed.materialize).toHaveBeenCalled();
    expect(market.backerRead.refreshAnalyticsSnapshots).toHaveBeenCalled();

    const backers = createHarness();
    const backersResult = await backers.service.run({
      parserKey: "backers:dropstab",
      write: true,
    });
    expect(backersResult.steps.map((step) => step.key)).toEqual([
      "market-project-read-model",
      "backer-portfolio-holdings",
      "backer-list-read-model",
      "funding-feed-read-model",
      "ico-project-funding-read-model",
      "backer-analytics-snapshots",
    ]);
    expect(backers.market.materializeFromV2Identity).toHaveBeenCalledWith(
      expect.objectContaining({ writePolicyParserKey: "backers:dropstab" })
    );
  });

  it("skips activity and unknown parser keys without cross-source writes", async () => {
    for (const parserKey of ["activities:dropstab", "funding:unknown"]) {
      const harness = createHarness();
      const result = await harness.service.run({ parserKey, write: true });

      expect(result.status).toBe("skipped");
      expect(result.steps).toEqual([]);
      expect(harness.market.materializeFromV2Identity).not.toHaveBeenCalled();
      expect(harness.portfolio.run).not.toHaveBeenCalled();
      expect(harness.backerList.materialize).not.toHaveBeenCalled();
      expect(harness.fundingFeed.materialize).not.toHaveBeenCalled();
      expect(
        harness.backerRead.refreshAnalyticsSnapshots
      ).not.toHaveBeenCalled();
    }
  });

  it("does not swallow progress callback failures or start the step write", async () => {
    const harness = createHarness();

    await expect(
      harness.service.run({
        parserKey: "vesting:dropstab",
        write: true,
        onProgress: async () => {
          throw new Error("lease lost");
        },
      })
    ).rejects.toThrow(
      "Post-write materialization progress callback failed: lease lost"
    );
    expect(harness.market.materializeFromV2Identity).not.toHaveBeenCalled();
  });

  it("hard-stops the whole plan when execution is no longer active", async () => {
    const harness = createHarness();

    await expect(
      harness.service.run({
        parserKey: "funding:dropstab",
        write: true,
        assertExecutionActive: () => {
          throw new Error("lease expired");
        },
      })
    ).rejects.toThrow("lease expired");
    expect(harness.market.materializeFromV2Identity).not.toHaveBeenCalled();
    expect(harness.portfolio.run).not.toHaveBeenCalled();
    expect(harness.backerList.materialize).not.toHaveBeenCalled();
    expect(harness.fundingFeed.materialize).not.toHaveBeenCalled();
    expect(harness.backerRead.refreshAnalyticsSnapshots).not.toHaveBeenCalled();
  });

  it("does not continue after a nested materializer loses its fence", async () => {
    const harness = createHarness();
    const assertExecutionActive = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValue(new Error("nested lease lost"));
    harness.market.materializeFromV2Identity.mockImplementation(
      async (options: any) => {
        await options.assertExecutionActive();
        return completedMarket(1, 1);
      }
    );

    await expect(
      harness.service.run({
        parserKey: "funding:dropstab",
        write: true,
        assertExecutionActive,
      })
    ).rejects.toThrow("nested lease lost");

    expect(harness.market.materializeFromV2Identity).toHaveBeenCalledTimes(1);
    expect(harness.portfolio.run).not.toHaveBeenCalled();
    expect(harness.backerList.materialize).not.toHaveBeenCalled();
    expect(harness.fundingFeed.materialize).not.toHaveBeenCalled();
  });
});
