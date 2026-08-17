import { PortfolioService } from "./portfolio.service";

describe("PortfolioService chart history", () => {
  const buildChartHistory = (portfolio: any, from: Date | null = null) => {
    const service = Object.create(PortfolioService.prototype) as PortfolioService;

    return (service as any).buildPortfolioChartHistory(portfolio, from);
  };

  it("keeps persisted snapshot metadata in every chart point", () => {
    const date = new Date();
    const categoryDistribution = { DeFi: 70, Gaming: 30 };
    const history = buildChartHistory({
      totalBalance: 1250,
      profit: 250,
      profitPercent: 25,
      history: [
        {
          _id: "snapshot-1",
          date,
          totalBalance: 1250,
          totalProfit: 250,
          totalProfitPercent: 25,
          totalInvested: 1000,
          btcPrice: 64000,
          ethPrice: 3200,
          categoryDistribution,
          isApproximation: false,
        },
      ],
    });

    expect(history).toEqual([
      {
        _id: "snapshot-1",
        date,
        totalBalance: 1250,
        totalProfit: 250,
        totalProfitPercent: 25,
        totalInvested: 1000,
        btcPrice: 64000,
        ethPrice: 3200,
        categoryDistribution,
        isApproximation: false,
        isCurrent: false,
      },
    ]);
  });

  it("enriches an appended current point with the latest available metadata", () => {
    const currentDistribution = { Infrastructure: 100 };
    const history = buildChartHistory({
      totalBalance: 120,
      profit: 20,
      profitPercent: 20,
      totalInvested: 100,
      categoryDistribution: currentDistribution,
      history: [
        {
          _id: "snapshot-1",
          date: new Date("2026-07-01T12:00:00.000Z"),
          totalBalance: 100,
          totalProfit: 10,
          totalProfitPercent: 10,
          totalInvested: 90,
          btcPrice: 60000,
          ethPrice: 3000,
          categoryDistribution: { DeFi: 100 },
        },
      ],
    });

    expect(history).toHaveLength(2);
    expect(history[1]).toEqual({
      _id: undefined,
      date: expect.any(Date),
      totalBalance: 120,
      totalProfit: 20,
      totalProfitPercent: 20,
      totalInvested: 100,
      btcPrice: 60000,
      ethPrice: 3000,
      categoryDistribution: currentDistribution,
      isApproximation: true,
      isCurrent: true,
    });
  });

  it("appends a current point for a flat portfolio when the snapshot is stale", () => {
    const history = buildChartHistory({
      totalBalance: 100,
      profit: 10,
      profitPercent: 10,
      totalInvested: 90,
      history: [
        {
          date: new Date(Date.now() - 10 * 60 * 1000),
          totalBalance: 100,
          totalProfit: 10,
          totalProfitPercent: 10,
          totalInvested: 90,
        },
      ],
    });

    expect(history).toHaveLength(2);
    expect(history[1]).toMatchObject({
      totalBalance: 100,
      totalProfit: 10,
      totalProfitPercent: 10,
      totalInvested: 90,
      isApproximation: true,
      isCurrent: true,
    });
  });

  it("does not append a current point when the tracked market data is unchanged", () => {
    const history = buildChartHistory({
      totalBalance: 100,
      profit: 10,
      profitPercent: 10,
      totalInvested: 90,
      lastMarketDataFingerprint: "same-market-version",
      lastHistoryMarketDataFingerprint: "same-market-version",
      history: [
        {
          date: new Date(Date.now() - 30 * 60 * 1000),
          totalBalance: 100,
          totalProfit: 10,
          totalProfitPercent: 10,
          totalInvested: 90,
        },
      ],
    });

    expect(history).toHaveLength(1);
    expect(history[0].isCurrent).toBe(false);
  });

  it("appends a current point when a tracked market data version advances", () => {
    const history = buildChartHistory({
      totalBalance: 100,
      profit: 10,
      profitPercent: 10,
      totalInvested: 90,
      lastMarketDataFingerprint: "new-market-version",
      lastHistoryMarketDataFingerprint: "old-market-version",
      history: [
        {
          date: new Date(Date.now() - 10 * 60 * 1000),
          totalBalance: 100,
          totalProfit: 10,
          totalProfitPercent: 10,
          totalInvested: 90,
        },
      ],
    });

    expect(history).toHaveLength(2);
    expect(history[1].isCurrent).toBe(true);
  });
});

describe("PortfolioService user portfolio summaries", () => {
  it("projects description for the portfolio dropdown contract", async () => {
    const aggregate = jest.fn().mockResolvedValue([
      {
        _id: "portfolio-1",
        name: "Portfolio",
        description: "Long portfolio description",
      },
    ]);
    const service = Object.create(PortfolioService.prototype) as PortfolioService;

    (service as any).portfolioModel = { aggregate };
    (service as any).portfolioAutoRecalcService = {
      isAutoRecalcEnabled: jest.fn(() => false),
      logAutoRecalcSkipped: jest.fn(),
    };

    const result = await service.getUserPortfolios(
      "507f1f77bcf86cd799439011"
    );
    const pipeline = aggregate.mock.calls[0][0];
    const projectStage = pipeline.find((stage: any) => stage.$project);

    expect(projectStage.$project.description).toBe(1);
    expect(result[0].description).toBe("Long portfolio description");
  });
});

describe("PortfolioService stats chart regularization", () => {
  const now = new Date("2026-07-25T12:00:00.000Z");
  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;
  const chartRanges = [
    ["chart24h", dayMs, 10 * 60 * 1000, 145],
    ["chart7d", 7 * dayMs, hourMs, 169],
    ["chart30d", 30 * dayMs, hourMs, 721],
    ["chart90d", 90 * dayMs, hourMs, 2161],
    ["chart1y", 365 * dayMs, dayMs, 366],
    ["chartAll", 2 * 365 * dayMs, dayMs, 731],
  ] as const;

  const createService = () =>
    Object.create(PortfolioService.prototype) as PortfolioService;

  const createDensePortfolio = (rangeMs: number) => {
    const historyPointCount = 5000;
    const historyEnd = now.getTime() - 60 * 1000;
    const historyStart = now.getTime() - rangeMs;
    const history = Array.from({ length: historyPointCount }, (_, index) => {
      const progress = index / (historyPointCount - 1);

      return {
        _id: `point-${index}`,
        date: new Date(
          historyStart + (historyEnd - historyStart) * progress
        ),
        totalBalance:
          1000 + index + Math.sin(progress * Math.PI * 8) * 75,
        totalProfit: 100 + Math.cos(progress * Math.PI * 12) * 40,
        totalProfitPercent:
          10 + Math.sin(progress * Math.PI * 16) * 4,
        totalInvested: 900,
      };
    });

    return {
      totalBalance: 2000,
      profit: 450,
      profitPercent: 29,
      totalInvested: 1550,
      history,
    };
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("treats a newer persisted mutation as stale after recalculation", async () => {
    const service = createService();
    const pendingPortfolio = {
      needsRecalculation: true,
      lastMutationAt: new Date("2026-07-25T11:59:00.000Z"),
      lastRecalculatedAt: new Date("2026-07-25T11:58:00.000Z"),
    };
    (service as any).portfolioAutoRecalcService = {
      isAutoRecalcEnabled: jest.fn(() => true),
    };
    (service as any).portfolioRecalculationService = {
      recalculatePortfolioIfStale: jest.fn().mockResolvedValue({
        recalculated: true,
      }),
    };
    (service as any).portfolioQueueService = {
      enqueuePortfolioRecalculation: jest.fn(),
    };
    (service as any).getPersistedPortfolioDocument = jest
      .fn()
      .mockResolvedValue(pendingPortfolio);

    const result = await (service as any).getPortfolioDocumentWithFreshness(
      "portfolio-1",
      "user-1"
    );

    expect(result).toEqual({
      portfolio: pendingPortfolio,
      isFresh: false,
    });
  });

  it("reports disabled read recalculation as stale", async () => {
    const service = createService();
    const portfolio = { needsRecalculation: false };
    (service as any).portfolioAutoRecalcService = {
      isAutoRecalcEnabled: jest.fn(() => false),
      logAutoRecalcSkipped: jest.fn(),
    };
    (service as any).getPersistedPortfolioDocument = jest
      .fn()
      .mockResolvedValue(portfolio);

    const result = await (service as any).getPortfolioDocumentWithFreshness(
      "portfolio-1",
      "user-1"
    );

    expect(result).toEqual({ portfolio, isFresh: false });
  });

  it.each(chartRanges)(
    "returns regular range-specific buckets for %s",
    async (chartType, rangeMs, bucketMs, expectedPoints) => {
      const service = createService();
      const portfolio = createDensePortfolio(rangeMs);
      (service as any).getPortfolioDocumentWithFreshness = jest
        .fn()
        .mockResolvedValue({ portfolio, isFresh: true });

      const result = await service.getPortfolioChart(
        "portfolio-1",
        chartType,
        "user-1"
      );

      expect(result).toHaveLength(expectedPoints);
      expect(result[0]._id).toBe("point-0");
      expect(result[result.length - 1]).toMatchObject({
        isCurrent: true,
        totalBalance: 2000,
      });
      expect(
        result.every(
          (point, index) =>
            index === 0 ||
            new Date(point.date).getTime() -
              new Date(result[index - 1].date).getTime() ===
              bucketMs
        )
      ).toBe(true);
      expect(
        new Set(result.map((point) => new Date(point.date).getTime())).size
      ).toBe(result.length);
    }
  );

  it("deduplicates buckets and fills missing intervals with the last known state", () => {
    const service = createService();
    const from = new Date("2026-07-24T12:00:00.000Z");
    const point = (minutes: number, totalBalance: number, extra: any = {}) => ({
      _id: `point-${minutes}`,
      date: new Date(from.getTime() + minutes * 60 * 1000),
      totalBalance,
      totalProfit: totalBalance - 100,
      totalProfitPercent: totalBalance - 100,
      ...extra,
    });
    const history = [
      point(0, 100),
      point(1, 110),
      point(9, 115),
      point(9, 120),
      point(40, 140, { isCurrent: true }),
    ];

    const result = (service as any).resamplePortfolioStatsChart(
      history,
      "chart24h",
      from,
      new Date(from.getTime() + 40 * 60 * 1000)
    );

    expect(result.map((item: any) => item.totalBalance)).toEqual([
      100,
      120,
      120,
      120,
      140,
    ]);
    expect(result.map((item: any) => new Date(item.date).getTime())).toEqual(
      [0, 10, 20, 30, 40].map(
        (minutes) => from.getTime() + minutes * 60 * 1000
      )
    );
    expect(result.filter((item: any) => item.isCurrent)).toHaveLength(1);
    expect(result[2]).toMatchObject({
      isApproximation: true,
      isCurrent: false,
    });
  });

  it("keeps exact opening and current endpoints around a partial final interval", () => {
    const service = createService();
    const opening = new Date("2026-07-25T09:03:00.000Z");
    const current = new Date("2026-07-25T11:38:00.000Z");
    const history = [
      {
        _id: "opening",
        date: opening,
        totalBalance: 100,
      },
      {
        _id: "middle",
        date: new Date("2026-07-25T10:25:00.000Z"),
        totalBalance: 120,
      },
      {
        _id: "current",
        date: current,
        totalBalance: 140,
        isCurrent: true,
      },
    ];

    const result = (service as any).resamplePortfolioStatsChart(
      history,
      "chart7d",
      null,
      current
    );
    const timestamps = result.map((item: any) =>
      new Date(item.date).getTime()
    );
    const gaps = timestamps
      .slice(1)
      .map((timestamp: number, index: number) => timestamp - timestamps[index]);

    expect(result[0]._id).toBe("opening");
    expect(result[result.length - 1]._id).toBe("current");
    expect(timestamps[0]).toBe(opening.getTime());
    expect(timestamps[timestamps.length - 1]).toBe(current.getTime());
    expect(Math.max(...gaps)).toBeLessThanOrEqual(hourMs);
    expect(new Set(timestamps).size).toBe(timestamps.length);
  });

  it("does not fabricate a live point when known market data is unchanged", () => {
    const service = createService();
    const portfolio = {
      totalBalance: 100,
      profit: 10,
      profitPercent: 11.11,
      totalInvested: 90,
      lastMarketDataFingerprint: "same-market-state",
      lastHistoryMarketDataFingerprint: "same-market-state",
      history: [
        {
          _id: "opening",
          date: new Date(now.getTime() - dayMs),
          totalBalance: 100,
          totalProfit: 10,
          totalProfitPercent: 11.11,
          totalInvested: 90,
        },
        {
          _id: "last-observed",
          date: new Date(now.getTime() - 20 * 60 * 1000),
          totalBalance: 100,
          totalProfit: 10,
          totalProfitPercent: 11.11,
          totalInvested: 90,
        },
      ],
    };

    const result = (service as any).buildPortfolioStatsChart(
      portfolio,
      "chart24h"
    );

    expect(result).toHaveLength(145);
    expect(result.some((item: any) => item.isCurrent)).toBe(false);
    expect(result[result.length - 1]).toMatchObject({
      totalBalance: 100,
      isApproximation: true,
      isCurrent: false,
    });
    expect(new Date(result[result.length - 1].date).getTime()).toBe(
      now.getTime()
    );
  });

  it("stops at the last confirmed snapshot when refresh is unavailable", () => {
    const service = createService();
    const lastObservedAt = new Date(now.getTime() - 20 * 60 * 1000);
    const portfolio = {
      totalBalance: 150,
      profit: 60,
      profitPercent: 66.67,
      totalInvested: 90,
      history: [
        {
          _id: "opening",
          date: new Date(now.getTime() - dayMs),
          totalBalance: 100,
          totalProfit: 10,
          totalProfitPercent: 11.11,
          totalInvested: 90,
        },
        {
          _id: "last-observed",
          date: lastObservedAt,
          totalBalance: 120,
          totalProfit: 30,
          totalProfitPercent: 33.33,
          totalInvested: 90,
        },
      ],
    };

    const result = (service as any).buildPortfolioStatsChart(
      portfolio,
      "chart24h",
      false
    );

    expect(result.some((item: any) => item.isCurrent)).toBe(false);
    expect(new Date(result[result.length - 1].date).getTime()).toBe(
      lastObservedAt.getTime()
    );
    expect(result[result.length - 1].totalBalance).toBe(120);
  });

  it("keeps raw history for non-stats internal consumers", () => {
    const service = createService();
    const portfolio = createDensePortfolio(30 * dayMs);

    const result = (service as any).buildPortfolioChartHistory(portfolio, null);

    expect(result.length).toBeGreaterThan(2161);
  });

  it("applies the same hourly grid to public stats charts", async () => {
    const service = createService();
    const portfolio = createDensePortfolio(30 * dayMs);
    (service as any).getPublicPortfolioDocument = jest
      .fn()
      .mockResolvedValue({ _id: { toString: () => "portfolio-1" } });
    (service as any).getPortfolioDocumentWithFreshness = jest
      .fn()
      .mockResolvedValue({ portfolio, isFresh: true });

    const result = await service.getPublicPortfolioChart(
      "portfolio-1",
      "chart30d"
    );

    expect(result).toHaveLength(721);
    expect(result[result.length - 1].isCurrent).toBe(true);
  });
});
