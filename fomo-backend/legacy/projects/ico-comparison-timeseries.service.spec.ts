import { Types } from "mongoose";
import { IcoComparisonTimeseriesService } from "./ico-comparison-timeseries.service";

const buildQueryChain = (rows: any[] = []) => {
  const lean = jest.fn().mockResolvedValue(rows);
  const limit = jest.fn().mockReturnValue({ lean });
  const sort = jest.fn().mockReturnValue({ limit });

  return {
    chain: { sort },
    lean,
    limit,
    sort,
  };
};

const buildService = (
  snapshotModel: any = { find: jest.fn() },
  projectModel: any = {},
) =>
  new IcoComparisonTimeseriesService(
    projectModel,
    snapshotModel,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  ) as any;

const hasNestedKey = (value: any, key: string): boolean => {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  if (Array.isArray(value)) return value.some((item) => hasNestedKey(item, key));

  return Object.values(value).some((item) => hasNestedKey(item, key));
};

describe("IcoComparisonTimeseriesService guardrails", () => {
  it("bounds snapshot reads and prefers retained snapshot granularities", async () => {
    const query = buildQueryChain([{ slug: "alpha", timestamp: new Date("2024-01-01") }]);
    const snapshotModel = { find: jest.fn().mockReturnValue(query.chain) };
    const service = buildService(snapshotModel);
    const end = new Date("2024-02-01T00:00:00.000Z");

    await service.findSnapshots(
      [
        { id: new Types.ObjectId().toHexString(), slug: "alpha" },
        { id: new Types.ObjectId().toHexString(), slug: "beta" },
      ],
      {
        range: "Since ICO",
        start: null,
        end,
        bucketMs: 30 * 24 * 60 * 60 * 1000,
        maxPoints: null,
      },
    );

    expect(snapshotModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        $and: expect.arrayContaining([
          expect.objectContaining({
            bucketGranularity: { $in: ["daily", "weekly", "monthly"] },
          }),
          expect.objectContaining({
            timestamp: { $lte: end },
          }),
        ]),
      }),
      expect.objectContaining({
        projectId: 1,
        slug: 1,
        timestamp: 1,
        price: 1,
      }),
    );
    expect(hasNestedKey(snapshotModel.find.mock.calls[0][0], "bucketGranularity")).toBe(true);
    expect(query.sort).toHaveBeenCalledWith({ timestamp: 1 });
    expect(query.limit).toHaveBeenCalledWith(3600);
    expect(query.lean).toHaveBeenCalled();
  });

  it("falls back to bounded legacy snapshot reads only when retained snapshots are missing", async () => {
    const retainedQuery = buildQueryChain([]);
    const legacyQuery = buildQueryChain([]);
    const snapshotModel = {
      find: jest.fn()
        .mockReturnValueOnce(retainedQuery.chain)
        .mockReturnValueOnce(legacyQuery.chain),
    };
    const service = buildService(snapshotModel);

    await service.findSnapshots(
      [{ id: new Types.ObjectId().toHexString(), slug: "alpha" }],
      {
        range: "Since ICO",
        start: null,
        end: new Date("2024-02-01T00:00:00.000Z"),
        bucketMs: 30 * 24 * 60 * 60 * 1000,
        maxPoints: null,
      },
    );

    expect(snapshotModel.find).toHaveBeenCalledTimes(2);
    expect(hasNestedKey(snapshotModel.find.mock.calls[0][0], "bucketGranularity")).toBe(true);
    expect(hasNestedKey(snapshotModel.find.mock.calls[1][0], "bucketGranularity")).toBe(false);
    expect(retainedQuery.limit).toHaveBeenCalledWith(1800);
    expect(legacyQuery.limit).toHaveBeenCalledWith(1800);
  });

  it("does not attach funding rounds by ambiguous symbol alone", () => {
    const service = buildService();
    const alphaId = new Types.ObjectId();
    const betaId = new Types.ObjectId();

    const grouped = service.groupFundingRounds(
      [
        { _id: alphaId, slug: "alpha", symbol: "DUP" },
        { _id: betaId, slug: "beta", symbol: "DUP" },
      ],
      [{ coinSymbol: "DUP", tokenPrice: 0.1 }],
    );

    expect(grouped.get(String(alphaId))).toBeUndefined();
    expect(grouped.get(String(betaId))).toBeUndefined();
  });

  it("keeps slug and linked project funding-round matches even when symbols collide", () => {
    const service = buildService();
    const alphaId = new Types.ObjectId();
    const betaId = new Types.ObjectId();

    const grouped = service.groupFundingRounds(
      [
        { _id: alphaId, slug: "alpha", symbol: "DUP" },
        { _id: betaId, slug: "beta", symbol: "DUP" },
      ],
      [
        { coinSlug: "alpha", coinSymbol: "DUP", tokenPrice: 0.1 },
        { projectLinks: [{ projectId: betaId }], coinSymbol: "DUP", tokenPrice: 0.2 },
      ],
    );

    expect(grouped.get(String(alphaId))).toHaveLength(1);
    expect(grouped.get(String(betaId))).toHaveLength(1);
  });

  it("prefers earliest priced funding round and ignores current-price tokenomics as entry price", () => {
    const service = buildService();
    const entry = service.resolveInvestmentEntry(
      {
        currentPrice: 2,
        tokenomics: { tokenPrice: 2 },
      },
      [
        { stage: "Private", date: "2021-02-01", tokenPrice: 0.2 },
        { stage: "Seed", date: "2021-01-01", tokenPrice: 0.1 },
      ],
    );

    expect(entry).toEqual({
      price: 0.1,
      roundName: "Seed",
      source: "funding_round",
    });
  });

  it("calculates ROI only from historical price and entry price", () => {
    const service = buildService();
    const point = service.rawPointToHistoryPoint(
      {
        timestamp: "2024-01-01T00:00:00.000Z",
        price: 4,
      },
      {
        currentPrice: 100,
        roiData: { roi: 999 },
      },
      "project-chart-history",
      { price: 2, roundName: "Seed", source: "funding_round" },
    );

    expect(point.price).toBe(4);
    expect(point.investmentPrice).toBe(2);
    expect(point.roiMultiplier).toBe(2);
    expect(point.roiFromIco).toBe(100);
    expect(point.source).toBe("project-chart-history");
  });

  it("returns null ROI when historical price or entry price is missing", () => {
    const service = buildService();
    const point = service.rawPointToHistoryPoint(
      { timestamp: "2024-01-01T00:00:00.000Z" },
      {
        currentPrice: 100,
        roiData: { roi: 999 },
      },
      "project-history",
      { price: null, roundName: null, source: null },
    );

    expect(point.price).toBeNull();
    expect(point.investmentPrice).toBeNull();
    expect(point.roiMultiplier).toBeNull();
    expect(point.roiFromIco).toBeNull();
  });

  it("keeps only historical market snapshots for history price", () => {
    const service = buildService();
    const rows = service.historicalMarketSnapshots([
      {
        price: 84.14,
        dataQuality: { sources: ["project", "project_intel", "funding_rounds"] },
      },
      {
        price: 83.77,
        dataQuality: { sources: ["AnalyticsChart:slug:solana:chart7d"] },
      },
    ]);

    expect(rows).toHaveLength(1);
    expect(rows[0].price).toBe(83.77);
  });

  it("limits history output to 10 points", () => {
    const service = buildService();
    const dayMs = 24 * 60 * 60 * 1000;
    const start = new Date("2024-01-01T00:00:00.000Z");
    const points = Array.from({ length: 30 }).map((_, index) => ({
      timestamp: start.getTime() + index * dayMs,
      date: new Date(start.getTime() + index * dayMs).toISOString(),
      price: index + 1,
      investmentPrice: 1,
      roundName: "Seed",
      marketCap: null,
      fdv: null,
      volume24h: null,
      roiFromIco: index * 100,
      roiFromListing: null,
      roiMultiplier: index + 1,
      source: "project-chart-history",
    }));

    const result = service.downsample(points, {
      range: "30D",
      start,
      end: new Date(start.getTime() + 30 * dayMs),
      bucketMs: dayMs,
      maxPoints: 10,
    });

    expect(result).toHaveLength(10);
    expect(result[0].price).toBe(1);
    expect(result[9].price).toBe(30);
  });

  it("keeps real sampled point dates instead of bucket start dates", () => {
    const service = buildService();
    const dayMs = 24 * 60 * 60 * 1000;
    const start = new Date("2024-01-01T00:00:00.000Z");
    const selectedTime = start.getTime() + 5 * dayMs;
    const points = [
      {
        timestamp: start.getTime() + dayMs,
        date: new Date(start.getTime() + dayMs).toISOString(),
        price: 1,
        investmentPrice: 1,
        roundName: "Seed",
        marketCap: null,
        fdv: null,
        volume24h: null,
        roiFromIco: 0,
        roiFromListing: null,
        roiMultiplier: 1,
        source: "project-chart-history",
      },
      {
        timestamp: selectedTime,
        date: new Date(selectedTime).toISOString(),
        price: 2,
        investmentPrice: 1,
        roundName: "Seed",
        marketCap: null,
        fdv: null,
        volume24h: null,
        roiFromIco: 100,
        roiFromListing: null,
        roiMultiplier: 2,
        source: "project-chart-history",
      },
    ];

    const result = service.downsample(points, {
      range: "YTD",
      start,
      end: new Date(start.getTime() + 7 * dayMs),
      bucketMs: 7 * dayMs,
      maxPoints: 10,
    });

    expect(result).toHaveLength(1);
    expect(result[0].timestamp).toBe(selectedTime);
    expect(result[0].date).toBe(new Date(selectedTime).toISOString());
  });

  it("applies a 10 point response limit for every range", () => {
    const service = buildService();

    for (const range of ["30D", "90D", "6M", "YTD", "Since ICO"]) {
      const config = service.buildRangeConfig(range, { createdAt: "2021-01-01T00:00:00.000Z" });

      expect(config.maxPoints).toBe(10);
    }
  });

  it("uses nested ICO start dates before import dates for Since ICO range", () => {
    const service = buildService();
    const config = service.buildRangeConfig("Since ICO", {
      rawIcoData: {
        dates: {
          startDate: { normalized: "2020-03-15T17:00:00.000Z" },
        },
        dateAdded: "2026-04-29T05:20:07.773Z",
      },
      createdAt: "2026-04-29T05:20:07.773Z",
    });

    expect(config.start?.toISOString()).toBe("2020-03-15T17:00:00.000Z");
  });

  it("uses explicit selected project ids as authoritative history targets", async () => {
    const service = buildService(undefined, {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId("69f2c49753da2d63cd9de17a"),
            projectType: "project",
            name: "Solana",
            slug: "solana",
            symbol: "SOL",
          },
        ]),
      }),
    });

    const targets = await service.resolveTargets(
      {
        _id: new Types.ObjectId("686d5ca40a980894b786e45b"),
        projectType: "market",
        name: "Solana",
        slug: "solana",
        symbol: "SOL",
      },
      [],
      5,
      ["69f2c49753da2d63cd9de17a"],
    );

    expect(targets).toHaveLength(1);
    expect(targets[0].id).toBe("69f2c49753da2d63cd9de17a");
    expect(targets[0].project.projectType).toBe("project");
  });

  it("uses backend category averages for industry market cap and FDV history", () => {
    const service = buildService();
    const result = service.buildIndustryAverageHistory(
      [
        {
          timestamp: Date.parse("2024-01-01T00:00:00.000Z"),
          date: "2024-01-01T00:00:00.000Z",
          price: 1,
          investmentPrice: 1,
          roundName: "Seed",
          marketCap: 10,
          fdv: 20,
          volume24h: null,
          roiFromIco: null,
          roiFromListing: null,
          roiMultiplier: null,
          industryAverageMarketCap: 1,
          industryAverageFDV: 2,
        },
      ],
      {
        marketCap: 150_000_000,
        fdv: 250_000_000,
        projectCount: 8,
        sourceDocumentCount: 8,
        marketCapCount: 6,
        fdvCount: 5,
        categoryKeys: ["Layer 1"],
      },
    );

    expect(result[0].marketCap).toBe(150_000_000);
    expect(result[0].fdv).toBe(250_000_000);
  });

  it("calculates industry averages from indexed project category query", async () => {
    const exec = jest.fn().mockResolvedValue([
      {
        averageMarketCap: 150_000_000,
        averageFDV: 240_000_000,
        projectCount: 5,
        sourceDocumentCount: 7,
        marketCapCount: 4,
        fdvCount: 3,
      },
    ]);
    const aggregate = jest.fn().mockReturnValue({ exec });
    const service = buildService({ find: jest.fn() }, { aggregate });

    const result = await service.buildCategoryIndustryAverages({
      _id: new Types.ObjectId(),
      projectType: "project",
      categories: ["Layer 1"],
      tags: ["Infrastructure"],
    });

    expect(aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          $match: expect.objectContaining({
            projectType: { $in: ["project", "market"] },
            projectStatus: "active",
            $or: expect.arrayContaining([
              { categories: { $in: ["Layer 1"] } },
              { tags: { $in: ["Layer 1"] } },
              { mainCategory: { $in: ["Layer 1"] } },
            ]),
          }),
        }),
        expect.objectContaining({
          $group: expect.objectContaining({
            _id: "$identityKey",
            sourceDocumentCount: { $sum: 1 },
          }),
        }),
        expect.objectContaining({
          $project: expect.objectContaining({
            marketCapValue: {
              $ifNull: ["$marketProjectMarketCapValue", "$projectMarketCapValue"],
            },
            fdvValue: {
              $ifNull: ["$marketProjectFdvValue", "$projectFdvValue"],
            },
          }),
        }),
        expect.objectContaining({
          $group: expect.objectContaining({
            _id: null,
            projectCount: { $sum: 1 },
            sourceDocumentCount: { $sum: "$sourceDocumentCount" },
            averageMarketCap: { $avg: "$marketCapValue" },
            averageFDV: { $avg: "$fdvValue" },
          }),
        }),
      ]),
    );
    expect(exec).toHaveBeenCalled();
    expect(result).toEqual({
      marketCap: 150_000_000,
      fdv: 240_000_000,
      projectCount: 5,
      sourceDocumentCount: 7,
      marketCapCount: 4,
      fdvCount: 3,
      categoryKeys: ["Layer 1"],
    });
  });

  it("prefers main category over noisy tags for industry averages", () => {
    const service = buildService();

    expect(service.industryCategoryKeys({
      mainCategory: "Blockchain",
      categories: ["Ethereum"],
      tags: ["#27 in Blockchain"],
      type: "Private Sale",
      niche: "SOL",
    })).toEqual(["Blockchain"]);
  });

  it("deduplicates project and market category-average rows by asset identity", async () => {
    const exec = jest.fn().mockResolvedValue([
      {
        averageMarketCap: 97_500_000_000,
        averageFDV: 99_000_000_000,
        projectCount: 1,
        sourceDocumentCount: 2,
        marketCapCount: 1,
        fdvCount: 1,
      },
    ]);
    const aggregate = jest.fn().mockReturnValue({ exec });
    const service = buildService({ find: jest.fn() }, { aggregate });

    const result = await service.buildCategoryIndustryAverages({
      _id: new Types.ObjectId(),
      projectType: "project",
      slug: "solana",
      coingeckoId: "solana",
      categories: ["Layer 1"],
    });
    const pipeline = aggregate.mock.calls[0][0];

    expect(pipeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          $match: expect.objectContaining({
            identityKey: {
              $nin: expect.arrayContaining(["coingecko:solana", "slug:solana"]),
            },
          }),
        }),
        expect.objectContaining({
          $group: expect.objectContaining({
            _id: "$identityKey",
            sourceDocumentCount: { $sum: 1 },
            marketProjectMarketCapValue: {
              $max: {
                $cond: [{ $eq: ["$projectType", "market"] }, "$marketCapValue", null],
              },
            },
            projectMarketCapValue: {
              $max: {
                $cond: [{ $ne: ["$projectType", "market"] }, "$marketCapValue", null],
              },
            },
          }),
        }),
      ]),
    );
    expect(result).toEqual({
      marketCap: 97_500_000_000,
      fdv: 99_000_000_000,
      projectCount: 1,
      sourceDocumentCount: 2,
      marketCapCount: 1,
      fdvCount: 1,
      categoryKeys: ["Layer 1"],
    });
  });
});
