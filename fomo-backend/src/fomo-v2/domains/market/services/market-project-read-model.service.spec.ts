import { FomoV2MarketProjectReadModelService } from "./market-project-read-model.service";

describe("FomoV2MarketProjectReadModelService core asset prices", () => {
  const buildService = (rows: any[]) => {
    const exec = jest.fn().mockResolvedValue(rows);
    const lean = jest.fn().mockReturnValue({ exec });
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    const select = jest.fn().mockReturnValue({ sort });
    const find = jest.fn().mockReturnValue({ select });
    const service = Object.create(
      FomoV2MarketProjectReadModelService.prototype
    ) as FomoV2MarketProjectReadModelService;

    (service as any).readModel = { find };

    return { service, find, select, sort, limit };
  };

  it("loads BTC and ETH prices from one bounded read-model query", async () => {
    const { service, find, select, sort, limit } = buildService([
      {
        symbol: "BTC",
        price: 63_000,
        rank: 1,
        providerIds: { coingeckoId: "bitcoin" },
      },
      {
        symbol: "wrapped-eth",
        price: 3_200,
        rank: 2,
        providerIds: { coingeckoId: "ethereum" },
      },
    ]);

    await expect(service.getCoreAssetUsdPrices()).resolves.toEqual({
      btcPrice: 63_000,
      ethPrice: 3_200,
    });
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        trading: "CURRENTLY_TRADING",
        status: "active",
        price: { $gt: 0 },
        "providerIds.coingeckoId": { $in: ["bitcoin", "ethereum"] },
      })
    );
    expect(select).toHaveBeenCalledWith({
      symbol: 1,
      niche: 1,
      price: 1,
      rank: 1,
      providerIds: 1,
    });
    expect(sort).toHaveBeenCalledWith({ rank: 1, _id: 1 });
    expect(limit).toHaveBeenCalledWith(2);
  });

  it("preserves the compatibility fallback when the query fails", async () => {
    const service = Object.create(
      FomoV2MarketProjectReadModelService.prototype
    ) as FomoV2MarketProjectReadModelService;
    (service as any).readModel = {
      find: jest.fn(() => {
        throw new Error("database unavailable");
      }),
    };

    await expect(service.getCoreAssetUsdPrices()).resolves.toEqual({
      btcPrice: 1,
      ethPrice: 1,
    });
  });
});
