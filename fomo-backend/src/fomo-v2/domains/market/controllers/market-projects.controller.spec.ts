import { NotFoundException } from "@nestjs/common";
import { FomoV2MarketProjectsController } from "./market-projects.controller";

const request = (userId?: string): any => ({
  user: userId ? { _id: userId } : undefined,
});

describe("FomoV2MarketProjectsController", () => {
  const createController = () => {
    const market = {
      getCompatibleMarketProjects: jest.fn(),
      searchPortfolioAssets: jest.fn(),
      getMarketCategories: jest.fn(),
      getMarketCategory: jest.fn(),
      getMarketProjectDetailByCoinGeckoId: jest.fn(),
      getEchoProjectDetailBySlug: jest.fn(),
      getMarketProjectUnlocks: jest.fn(),
      getMarketProjectFundraising: jest.fn(),
    };
    const ico = {
      getProjectDetailBySlug: jest.fn(),
    };
    const controller = new FomoV2MarketProjectsController(
      market as any,
      ico as any,
    );

    return { controller, market, ico };
  };

  it("serves the market list without a legacy fallback", async () => {
    const { controller, market } = createController();
    const query = { limit: 25, offset: 0 };
    market.getCompatibleMarketProjects.mockResolvedValue({
      projects: [],
      total: 0,
    });

    await expect(controller.listMarketProjects(query)).resolves.toEqual({
      projects: [],
      total: 0,
    });
    expect(market.getCompatibleMarketProjects).toHaveBeenCalledWith(query, {
      fallback: "none",
    });
  });

  it("serves bounded market search in the front-compatible shape", async () => {
    const { controller, market } = createController();
    market.searchPortfolioAssets.mockResolvedValue([{ _id: "asset-1" }]);

    await expect(
      controller.searchMarketProjects({ searchValue: "btc", limit: 100 }),
    ).resolves.toEqual({
      assets: [{ _id: "asset-1" }],
      projects: [{ _id: "asset-1" }],
      total: 1,
      limit: 50,
    });
    expect(market.searchPortfolioAssets).toHaveBeenCalledWith("btc", 50);
  });

  it("routes market detail by CoinGecko identity and forwards optional user", async () => {
    const { controller, market } = createController();
    market.getMarketProjectDetailByCoinGeckoId.mockResolvedValue({ id: "btc" });

    await controller.getProjectDetail(
      { projectId: "bitcoin" },
      { projectType: "market", lookup: "coingeckoId" },
      request("user-1"),
    );

    expect(market.getMarketProjectDetailByCoinGeckoId).toHaveBeenCalledWith(
      "bitcoin",
      "user-1",
    );
  });

  it("falls back from ICO to Echo only for a not-found response", async () => {
    const { controller, market, ico } = createController();
    ico.getProjectDetailBySlug.mockRejectedValue(new NotFoundException());
    market.getEchoProjectDetailBySlug.mockResolvedValue({ slug: "echo" });

    await expect(
      controller.getProjectDetail(
        { projectId: "echo" },
        { projectType: "echo", lookup: "slug" },
        request(),
      ),
    ).resolves.toEqual({ slug: "echo" });
    expect(market.getEchoProjectDetailBySlug).toHaveBeenCalledWith(
      "echo",
      undefined,
    );
  });
});
