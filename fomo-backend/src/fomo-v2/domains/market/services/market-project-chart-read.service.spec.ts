import { FomoV2MarketProjectChartReadService } from "./market-project-chart-read.service";

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const TEN_MINUTES_MS = 10 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const FOUR_HOURS_MS = 4 * ONE_HOUR_MS;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

function createService(): any {
  return new FomoV2MarketProjectChartReadService({} as any, {} as any, {} as any) as any;
}

function createPoints(count: number, stepMs: number, startTimestamp = 0): any[] {
  return Array.from({ length: count }, (_, index) => {
    const timestamp = startTimestamp + index * stepMs;

    return {
      timestamp,
      createdAt: new Date(timestamp).toISOString(),
      price: { USD: index + 1 },
      marketCap: (index + 1) * 100,
    };
  });
}

describe("FomoV2MarketProjectChartReadService", () => {
  it("returns uppercase project symbols in market search results", () => {
    const service = createService();

    const asset = service.toSearchAsset({
      _id: "read-model-id",
      marketAssetId: "market-asset-id",
      name: "Solana",
      symbol: "sol",
    });

    expect(asset.symbol).toBe("SOL");
    expect(asset.ticker).toBe("SOL");
    expect(asset.projectData.symbol).toBe("SOL");
    expect(asset.projectData.ticker).toBe("SOL");
  });

  it("preserves missing project symbol semantics in market search results", () => {
    const service = createService();

    const asset = service.toSearchAsset({
      _id: "read-model-id",
      marketAssetId: "market-asset-id",
      name: "Unknown asset",
      symbol: null,
    });

    expect(asset.symbol).toBe("");
    expect(asset.ticker).toBe("");
    expect(asset.projectData.symbol).toBeNull();
    expect(asset.projectData.ticker).toBeNull();
  });

  it("aggregates 24H into ten-minute buckets and 7D into hourly buckets", () => {
    const service = createService();
    const dayPoints = createPoints(24 * 12, FIVE_MINUTES_MS);
    const weekPoints = createPoints(7 * 24 * 12, FIVE_MINUTES_MS);

    const dayBuckets = service.bucketizePointsByRange(dayPoints, "24H");
    const weekBuckets = service.bucketizePointsByRange(weekPoints, "7D");

    expect(dayBuckets).toHaveLength(144);
    expect(dayBuckets[1].timestamp - dayBuckets[0].timestamp).toBe(TEN_MINUTES_MS);
    expect(dayBuckets[0].price.USD).toBe(2);
    expect(weekBuckets).toHaveLength(168);
    expect(weekBuckets[1].timestamp - weekBuckets[0].timestamp).toBe(ONE_HOUR_MS);
    expect(weekBuckets[0].price.USD).toBe(12);
  });

  it("aggregates 30D into four-hour buckets", () => {
    const service = createService();
    const points = createPoints(30 * 24 * 12, FIVE_MINUTES_MS);

    const buckets = service.bucketizePointsByRange(points, "30D");

    expect(buckets).toHaveLength(180);
    expect(buckets[1].timestamp - buckets[0].timestamp).toBe(FOUR_HOURS_MS);
    expect(buckets[0].price.USD).toBe(48);
  });

  it("aggregates ALL into weekly buckets", () => {
    const service = createService();
    const points = createPoints(14, ONE_DAY_MS);

    const buckets = service.bucketizePointsByRange(points, "ALL");

    expect(buckets).toHaveLength(2);
    expect(buckets[1].timestamp - buckets[0].timestamp).toBe(SEVEN_DAYS_MS);
    expect(buckets[0].price.USD).toBe(7);
  });
});
