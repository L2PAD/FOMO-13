import { Types } from "mongoose";
import { AnalyticsService } from "./analytics.service";

const fixedNow = Date.parse("2026-06-04T00:00:00.000Z");
const dayMs = 24 * 60 * 60 * 1000;

const buildFindOneQuery = (value: any) => {
  const lean = jest.fn().mockResolvedValue(value);
  const chain: any = {
    lean,
    then: (resolve: any, reject: any) => Promise.resolve(value).then(resolve, reject),
    catch: (reject: any) => Promise.resolve(value).catch(reject),
  };
  return { chain, lean };
};

const buildFindQuery = (value: any[]) => {
  const lean = jest.fn().mockResolvedValue(value);
  const sort = jest.fn().mockReturnValue({ lean });
  return { chain: { sort }, lean, sort };
};

const historyRows = [
  {
    timestamp: new Date(fixedNow - 3 * dayMs),
    bucketTimestamp: new Date(fixedNow - 3 * dayMs),
    source: "coingecko",
    price: 1.25,
    marketCap: 100,
    volume24h: 10,
    priceChange24h: 2.5,
  },
  {
    timestamp: new Date(fixedNow - 2 * dayMs),
    bucketTimestamp: new Date(fixedNow - 2 * dayMs),
    source: "coingecko",
    price: 1.5,
    marketCap: 120,
    volume24h: 12,
    priceChange24h: 3,
  },
];

function createService({
  chartDoc,
  chartDocs = [],
  history = historyRows,
}: {
  chartDoc?: any;
  chartDocs?: any[];
  history?: any[];
} = {}) {
  const findOneQuery = buildFindOneQuery(chartDoc ?? null);
  const findQuery = buildFindQuery(chartDocs);
  const historyQuery = buildFindQuery(history);
  const chartModel = {
    findOne: jest.fn().mockReturnValue(findOneQuery.chain),
    find: jest.fn().mockReturnValue(findQuery.chain),
    findOneAndUpdate: jest.fn().mockResolvedValue(chartDoc ?? null),
    updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1, upsertedCount: 0 }),
    bulkWrite: jest.fn().mockResolvedValue({ modifiedCount: 1, upsertedCount: 0 }),
  };
  const projectChartHistoryModel = {
    find: jest.fn().mockReturnValue(historyQuery.chain),
    bulkWrite: jest.fn().mockResolvedValue({ upsertedCount: 1, modifiedCount: 0 }),
  };
  const configService = {
    get: jest.fn(() => undefined),
  };
  const cacheService = {
    wrap: jest.fn(({ factory }) => factory()),
  };

  const service = new AnalyticsService(
    chartModel as any,
    projectChartHistoryModel as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    configService as any,
    cacheService as any,
  ) as any;

  service.logger = { log: jest.fn() };

  return {
    service,
    chartModel,
    projectChartHistoryModel,
    configService,
    cacheService,
    findOneQuery,
    findQuery,
    historyQuery,
  };
}

describe("AnalyticsService chart history fallback", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(fixedNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns cached chart90d from charts when it exists", async () => {
    const projectId = new Types.ObjectId();
    const chartDoc = {
      entityId: projectId,
      chart90d: [{ timestamp: fixedNow - dayMs, price: { USD: 2 } }],
    };
    const { service, projectChartHistoryModel } = createService({ chartDoc });

    const result = await service.getChart(projectId.toHexString(), "project", "chart90d");

    expect(result).toBe(chartDoc);
    expect(projectChartHistoryModel.find).not.toHaveBeenCalled();
    expect(service.logger.log).toHaveBeenCalledWith(
      expect.stringContaining("fallbackUsed=false"),
    );
  });

  it("builds chart90d from projectcharthistories when charts field is missing", async () => {
    const projectId = new Types.ObjectId();
    const { service, projectChartHistoryModel } = createService({
      chartDoc: { entityId: projectId },
    });

    const result = await service.getChart(projectId.toHexString(), "project", "chart90d");

    expect(result.entityId).toEqual(projectId);
    expect(result.chart90d).toHaveLength(2);
    expect(result.chart90d[0]).toEqual(
      expect.objectContaining({
        timestamp: fixedNow - 3 * dayMs,
        source: "coingecko",
        price: { USD: 1.25 },
        marketCap: 100,
        volume24h: 10,
        priceChange24h: 2.5,
        priceChange: 2.5,
      }),
    );
    expect(projectChartHistoryModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId,
        bucketTimestamp: {
          $type: "date",
          $gte: new Date(fixedNow - 90 * dayMs),
        },
      }),
      expect.objectContaining({
        timestamp: 1,
        bucketTimestamp: 1,
        price: 1,
        _id: 0,
      }),
    );
    expect(service.logger.log).toHaveBeenCalledWith(
      expect.stringContaining("fallbackUsed=true"),
    );
  });

  it("builds chart1y from projectcharthistories when charts field is empty", async () => {
    const projectId = new Types.ObjectId();
    const { service, projectChartHistoryModel } = createService({
      chartDoc: { entityId: projectId, chart1y: [] },
    });

    const result = await service.getChart(projectId.toHexString(), "project", "chart1y");

    expect(result.chart1y).toHaveLength(2);
    expect(projectChartHistoryModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId,
        bucketTimestamp: {
          $type: "date",
          $gte: new Date(fixedNow - 365 * dayMs),
        },
      }),
      expect.any(Object),
    );
  });

  it("builds chartAll from projectcharthistories without a range cutoff", async () => {
    const projectId = new Types.ObjectId();
    const { service, projectChartHistoryModel } = createService({
      chartDoc: { entityId: projectId },
    });

    const result = await service.getChart(projectId.toHexString(), "project", "chartAll");

    expect(result.chartAll).toHaveLength(2);
    expect(projectChartHistoryModel.find).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId,
        bucketTimestamp: { $type: "date" },
      }),
      expect.any(Object),
    );
  });

  it("does not use project history fallback for category or funding-dynamics charts", async () => {
    const entityId = new Types.ObjectId();
    const categoryDoc = { entityId, chartAll: [] };
    const { service, projectChartHistoryModel } = createService({ chartDoc: categoryDoc });

    const categoryResult = await service.getChart(entityId.toHexString(), "category", "chartAll");
    const fundingResult = await service.getChart(entityId.toHexString(), "funding-dynamics", "chartAll");

    expect(categoryResult).toBe(categoryDoc);
    expect(fundingResult).toBe(categoryDoc);
    expect(projectChartHistoryModel.find).not.toHaveBeenCalled();
  });

  it("does not use project history fallback for chart7d", async () => {
    const projectId = new Types.ObjectId();
    const chartDoc = { entityId: projectId, chart7d: [] };
    const { service, projectChartHistoryModel } = createService({ chartDoc });

    const result = await service.getChart(projectId.toHexString(), "project", "chart7d");

    expect(result).toBe(chartDoc);
    expect(projectChartHistoryModel.find).not.toHaveBeenCalled();
  });
});

describe("AnalyticsService project chart cache writes", () => {
  beforeEach(() => {
    jest.spyOn(Date, "now").mockReturnValue(fixedNow);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("writes market history but only short ranges into project charts", async () => {
    const projectId = new Types.ObjectId();
    const { service, chartModel, projectChartHistoryModel } = createService();

    await service.addMarketDataPoints(
      [
        {
          projectId,
          point: {
            timestamp: new Date(fixedNow),
            price: 2,
            marketCap: 200,
            volume24h: 20,
            priceChange24h: 1.5,
            source: "coingecko",
          },
        },
      ],
      { source: "coingecko", updateChartCache: true },
    );

    expect(projectChartHistoryModel.bulkWrite).toHaveBeenCalledTimes(1);
    expect(chartModel.bulkWrite).toHaveBeenCalledTimes(1);

    const chartOperations = chartModel.bulkWrite.mock.calls[0][0];
    const pullUpdate = chartOperations.find((operation: any) => operation.updateOne.update.$pull).updateOne.update.$pull;
    const pushUpdate = chartOperations.find((operation: any) => operation.updateOne.update.$push).updateOne.update.$push;
    const serializedOperations = JSON.stringify(chartOperations);

    expect(Object.keys(pullUpdate).sort()).toEqual(["chart24h", "chart30d", "chart7d"]);
    expect(Object.keys(pushUpdate).sort()).toEqual(["chart24h", "chart30d", "chart7d"]);
    expect(serializedOperations).not.toContain("chart90d");
    expect(serializedOperations).not.toContain("chart1y");
    expect(serializedOperations).not.toContain("chartAll");
  });

  it("rebuilds only short project chart cache fields from history", async () => {
    const projectId = new Types.ObjectId();
    const { service, chartModel } = createService({ history: historyRows });

    const result = await service.rebuildProjectChartCache(projectId);
    const update = chartModel.updateOne.mock.calls[0][1];

    expect(Object.keys(update.$set).sort()).toEqual(["chart24h", "chart30d", "chart7d", "entityType"]);
    expect(update.$set.chart90d).toBeUndefined();
    expect(update.$set.chart1y).toBeUndefined();
    expect(update.$set.chartAll).toBeUndefined();
    expect(result.chart24hPointsCount).toBe(0);
    expect(result.chart7dPointsCount).toBe(2);
    expect(result.chart30dPointsCount).toBe(2);
    expect(result.chart90dPointsCount).toBe(0);
    expect(result.chart1yPointsCount).toBe(0);
    expect(result.chartAllPointsCount).toBe(0);
  });
});
