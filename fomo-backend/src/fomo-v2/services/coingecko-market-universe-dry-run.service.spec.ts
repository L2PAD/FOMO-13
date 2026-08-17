import {
  CoinGeckoMarketUniverseDryRunService,
} from "./coingecko-market-universe-dry-run.service";
import { ResolveCanonicalProjectResult } from "./resolve-canonical-project.service";

const matchedResult = (overrides: Partial<ResolveCanonicalProjectResult> = {}): ResolveCanonicalProjectResult => ({
  status: "matched",
  canonicalProjectId: "canonical-1",
  verified: true,
  confidence: "exact",
  matchedBy: "provider_id",
  reason: "matched",
  candidates: [],
  conflicts: [],
  actions: [],
  ...overrides,
});

function createService(resolverResult: ResolveCanonicalProjectResult = matchedResult()) {
  const coinGeckoClient = {
    fetchMarketsPage: jest.fn().mockResolvedValue([
      {
        id: "ethereum",
        name: "Ethereum",
        symbol: "eth",
        image: "https://assets.coingecko.com/ethereum.png",
        market_cap_rank: 2,
      },
    ]),
    fetchCoinsList: jest.fn().mockResolvedValue([
      {
        id: "ethereum",
        name: "Ethereum",
        symbol: "eth",
        platforms: {
          ethereum: "0xABC",
          "arbitrum-one": "0xDEF",
          empty: "",
        },
      },
    ]),
    create: jest.fn(),
    updateOne: jest.fn(),
    bulkWrite: jest.fn(),
  };
  const resolver = {
    resolveCanonicalProject: jest.fn().mockResolvedValue(resolverResult),
    create: jest.fn(),
    updateOne: jest.fn(),
    bulkWrite: jest.fn(),
  };
  const configService = {
    get: jest.fn((key: string) => (key === "DB_NAME" ? "fomo_new" : undefined)),
  };

  return {
    service: new CoinGeckoMarketUniverseDryRunService(
      coinGeckoClient as any,
      resolver as any,
      configService as any,
    ),
    coinGeckoClient,
    resolver,
  };
}

describe("CoinGeckoMarketUniverseDryRunService", () => {
  it("dry-run does not write", async () => {
    const { service, coinGeckoClient, resolver } = createService();

    const result = await service.run({ limit: 1 });

    expect(result.mode).toBe("dry-run");
    expect(result.scanned).toBe(1);
    expect(coinGeckoClient.create).not.toHaveBeenCalled();
    expect(coinGeckoClient.updateOne).not.toHaveBeenCalled();
    expect(coinGeckoClient.bulkWrite).not.toHaveBeenCalled();
    expect(resolver.create).not.toHaveBeenCalled();
    expect(resolver.updateOne).not.toHaveBeenCalled();
    expect(resolver.bulkWrite).not.toHaveBeenCalled();
  });

  it("maps CoinGecko asset to resolver input", () => {
    const { service } = createService();

    const input = service.mapAssetToResolverInput(
      {
        id: "ethereum",
        name: "Ethereum",
        symbol: "eth",
      },
      {
        id: "ethereum",
        name: "Ethereum",
        symbol: "eth",
        platforms: { ethereum: "0xABC" },
      },
    );

    expect(input).toMatchObject({
      source: "coingecko",
      sourceEntityType: "asset",
      sourceId: "ethereum",
      sourceSlug: "ethereum",
      name: "Ethereum",
      normalizedName: "ethereum",
      symbol: "eth",
      normalizedSymbol: "ETH",
      sourceUrl: "https://www.coingecko.com/en/coins/ethereum",
    });
  });

  it("passes provider id to providerIds.coingeckoId", async () => {
    const { service, resolver } = createService();

    await service.run({ limit: 1 });

    expect(resolver.resolveCanonicalProject).toHaveBeenCalledWith(
      expect.objectContaining({
        providerIds: { coingeckoId: "ethereum" },
      }),
    );
  });

  it("normalizes contracts with chain and address", () => {
    const { service } = createService();

    const input = service.mapAssetToResolverInput(
      { id: "ethereum", name: "Ethereum", symbol: "eth" },
      {
        id: "ethereum",
        name: "Ethereum",
        symbol: "eth",
        platforms: {
          Ethereum: "0xABC",
          "Arbitrum-One": "0xDEF",
        },
      },
    );

    expect(input.contracts).toEqual([
      { chainSlug: "ethereum", address: "0xabc" },
      { chainSlug: "arbitrum-one", address: "0xdef" },
    ]);
  });

  it("keeps proposed name/symbol-only resolver result unverified", () => {
    const { service } = createService();

    const actions = service.buildDryRunActions(
      matchedResult({
        status: "proposed",
        canonicalProjectId: "canonical-1",
        verified: false,
        confidence: "low",
        matchedBy: "symbol_only",
      }),
    );

    expect(actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "would_create_project_asset_link",
          verified: false,
        }),
        expect.objectContaining({
          type: "would_create_canonical_project_source",
          verified: false,
        }),
      ]),
    );
    expect(actions.some((action) => action.verified === true)).toBe(false);
  });

  it("conflict result prevents would-create verified link", () => {
    const { service } = createService();

    const actions = service.buildDryRunActions(
      matchedResult({
        status: "conflict",
        canonicalProjectId: undefined,
        verified: false,
        confidence: "none",
        matchedBy: "provider_id",
        conflicts: [{ type: "provider_id", reason: "duplicate", candidateIds: ["a", "b"] }],
      }),
    );

    expect(actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "would_create_dedupe_review_item" }),
        expect.objectContaining({ type: "no_verified_link", verified: false }),
      ]),
    );
    expect(actions.some((action) => action.type === "would_create_project_asset_link")).toBe(false);
    expect(actions.some((action) => action.verified === true)).toBe(false);
  });

  it("refuses write mode", async () => {
    const { service } = createService();

    await expect(service.run({ limit: 1, write: true })).rejects.toThrow("dry-run only");
  });

  it("keeps requested dry-run limit without capping to 1000", async () => {
    const { service, coinGeckoClient } = createService();

    const result = await service.run({ limit: 3000 });

    expect(result.requestedLimit).toBe(3000);
    expect(result.all).toBe(false);
    expect(coinGeckoClient.fetchMarketsPage).toHaveBeenCalledWith({ page: 1, perPage: 250 });
  });

  it("supports all mode with null requested limit", async () => {
    const { service } = createService();

    const result = await service.run({ all: true });

    expect(result.requestedLimit).toBeNull();
    expect(result.all).toBe(true);
    expect(result.scanned).toBe(1);
  });

  it("limits stored examples", async () => {
    const { service } = createService(
      matchedResult({
        status: "created_candidate",
        verified: false,
        confidence: "none",
        matchedBy: "none",
      }),
    );

    const result = await service.run({ limit: 1, examplesLimit: 0 });

    expect(result.resolver.createdCandidate).toBe(1);
    expect(result.examples.createdCandidates).toHaveLength(0);
    expect(result.assets).toHaveLength(1);
  });
});
