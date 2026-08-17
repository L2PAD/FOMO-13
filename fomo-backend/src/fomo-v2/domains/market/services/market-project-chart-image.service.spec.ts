import { FomoV2MarketProjectChartImageService } from "./market-project-chart-image.service";

describe("FomoV2MarketProjectChartImageService", () => {
  const service = new FomoV2MarketProjectChartImageService({} as any, {} as any) as any;

  it("keeps near-stable 7d prices visually flat instead of stretching tiny moves", () => {
    const points = [0.9998, 1.0001, 0.9997, 1.0002, 0.9999, 1.0003, 1.0000].map((price, index) => ({
      timestamp: index + 1,
      price,
    }));

    const domain = service.buildPriceDomain(points);
    const rawRange = domain.rawMax - domain.rawMin;
    const visibleHeight = 100 - 6 * 2;
    const renderedYSpread = (rawRange / domain.range) * visibleHeight;

    expect(domain.range / ((domain.rawMin + domain.rawMax) / 2)).toBeGreaterThanOrEqual(0.079);
    expect(renderedYSpread).toBeLessThan(1);
  });

  it("keeps volatile prices dynamic with padding around the actual range", () => {
    const points = [1.0, 1.15, 0.9, 1.4, 1.3].map((price, index) => ({
      timestamp: index + 1,
      price,
    }));

    const domain = service.buildPriceDomain(points);

    expect(domain.range).toBeCloseTo((1.4 - 0.9) * 1.24, 6);
    expect(domain.min).toBeLessThan(0.9);
    expect(domain.max).toBeGreaterThan(1.4);
  });
});
