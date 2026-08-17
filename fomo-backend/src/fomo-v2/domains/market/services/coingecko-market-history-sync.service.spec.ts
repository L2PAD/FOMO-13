import { ConfigService } from "@nestjs/config";
import { CoinGeckoMarketChartDto } from "src/coingecko/coingecko-market.types";
import { CoinGeckoProClientService } from "src/coingecko/coingecko-pro-client.service";
import {
  FomoV2CoinGeckoMarketHistorySyncResult,
  FomoV2CoinGeckoMarketHistorySyncService,
} from "./coingecko-market-history-sync.service";

describe("FomoV2CoinGeckoMarketHistorySyncService reference history cache", () => {
  let now: number;
  let client: jest.Mocked<
    Pick<CoinGeckoProClientService, "fetchMarketChart" | "fetchMarketChartRange">
  >;

  beforeEach(() => {
    now = new Date("2026-07-16T04:00:00.000Z").getTime();
    jest.spyOn(Date, "now").mockImplementation(() => now);
    client = {
      fetchMarketChart: jest.fn(),
      fetchMarketChartRange: jest.fn(
        async (
          id: string,
          _fromUnixSeconds: number,
          _toUnixSeconds: number,
          _vsCurrency?: string,
        ) => historyFor(id),
      ),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reuses BTC and ETH reference histories for the same rolling window", async () => {
    const service = createService(client, 15 * 60 * 1000);
    const firstResult = emptyResult();
    const secondResult = emptyResult();

    const first = await fetchReferences(service, firstResult);
    now += 60_000;
    const second = await fetchReferences(service, secondResult);

    expect(client.fetchMarketChartRange).toHaveBeenCalledTimes(2);
    expect(firstResult.historyRequests).toBe(2);
    expect(secondResult.historyRequests).toBe(0);
    expect(first.btc).toEqual(second.btc);
    expect(first.eth).toEqual(second.eth);
  });

  it("expires reference histories after the configured TTL", async () => {
    const service = createService(client, 1_000);

    await fetchReferences(service, emptyResult());
    now += 1_001;
    await fetchReferences(service, emptyResult());

    expect(client.fetchMarketChartRange).toHaveBeenCalledTimes(4);
  });

  it("shares in-flight reference requests between concurrent syncs", async () => {
    const service = createService(client, 15 * 60 * 1000);

    await Promise.all([
      fetchReferences(service, emptyResult()),
      fetchReferences(service, emptyResult()),
    ]);

    expect(client.fetchMarketChartRange).toHaveBeenCalledTimes(2);
  });

  it("does not apply provider pacing delays to cache hits", async () => {
    const service = createService(client, 15 * 60 * 1000);
    const sleep = jest.fn().mockResolvedValue(undefined);
    (service as any).sleep = sleep;

    await fetchReferences(service, emptyResult(), 1_200);
    await fetchReferences(service, emptyResult(), 1_200);

    expect(sleep).toHaveBeenCalledTimes(2);
  });
});

function createService(
  client: jest.Mocked<
    Pick<CoinGeckoProClientService, "fetchMarketChart" | "fetchMarketChartRange">
  >,
  ttlMs: number,
): FomoV2CoinGeckoMarketHistorySyncService {
  const configService = {
    get: jest.fn((key: string) =>
      key === "FOMO_V2_COINGECKO_HISTORY_REFERENCE_CACHE_TTL_MS" ? ttlMs : undefined,
    ),
  } as unknown as ConfigService;

  return new FomoV2CoinGeckoMarketHistorySyncService(
    {} as any,
    {} as any,
    configService,
    client as unknown as CoinGeckoProClientService,
  );
}

function fetchReferences(
  service: FomoV2CoinGeckoMarketHistorySyncService,
  result: FomoV2CoinGeckoMarketHistorySyncResult,
  delayMs = 0,
): Promise<any> {
  return (service as any).fetchReferencePrices({
    historyWindow: {
      days: 90,
      fromUnixSeconds: 1_760_000_000,
      toUnixSeconds: 1_767_776_000,
    },
    vsCurrency: "usd",
    delayMs,
    maxRetries: 1,
    result,
  });
}

function historyFor(id: string): CoinGeckoMarketChartDto {
  const price = id === "bitcoin" ? 60_000 : 3_000;
  return {
    prices: [[1_767_775_000_000, price]],
    market_caps: [],
    total_volumes: [],
  };
}

function emptyResult(): FomoV2CoinGeckoMarketHistorySyncResult {
  return {
    dryRun: false,
    tier: "HOT",
    days: 90,
    vsCurrency: "usd",
    limit: 10,
    offset: 0,
    startedAt: "2026-07-16T04:00:00.000Z",
    finishedAt: "",
    durationMs: 0,
    assetsScanned: 0,
    historyRequests: 0,
    snapshotsWouldWrite: 0,
    snapshotsCreated: 0,
    snapshotsUpdated: 0,
    skippedNoCoingeckoId: 0,
    rateLimitRetries: 0,
    errorsCount: 0,
    errors: [],
    warnings: [],
  };
}
