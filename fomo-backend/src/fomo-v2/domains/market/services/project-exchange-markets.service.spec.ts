import { ConfigService } from "@nestjs/config";
import { CoinGeckoDerivativeDto } from "src/coingecko/coingecko-market.types";
import { CoinGeckoProClientService } from "src/coingecko/coingecko-pro-client.service";
import { FomoV2ProjectExchangeMarketsService } from "./project-exchange-markets.service";

describe("FomoV2ProjectExchangeMarketsService derivatives cache", () => {
  let now: number;
  let client: jest.Mocked<Pick<CoinGeckoProClientService, "fetchDerivatives">>;

  beforeEach(() => {
    now = new Date("2026-07-16T04:00:00.000Z").getTime();
    jest.spyOn(Date, "now").mockImplementation(() => now);
    client = {
      fetchDerivatives: jest.fn().mockResolvedValue(derivatives()),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reuses the global derivatives response until its TTL expires", async () => {
    const service = createService(client, 15 * 60 * 1000);

    const first = await (service as any).fetchCachedDerivatives();
    now += 60_000;
    const second = await (service as any).fetchCachedDerivatives();

    expect(client.fetchDerivatives).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it("refreshes derivatives after the configured TTL", async () => {
    const service = createService(client, 1_000);

    await (service as any).fetchCachedDerivatives();
    now += 1_001;
    await (service as any).fetchCachedDerivatives();

    expect(client.fetchDerivatives).toHaveBeenCalledTimes(2);
  });

  it("shares one derivatives request between concurrent callers", async () => {
    const service = createService(client, 15 * 60 * 1000);

    await Promise.all([
      (service as any).fetchCachedDerivatives(),
      (service as any).fetchCachedDerivatives(),
    ]);

    expect(client.fetchDerivatives).toHaveBeenCalledTimes(1);
  });
});

function createService(
  client: jest.Mocked<Pick<CoinGeckoProClientService, "fetchDerivatives">>,
  ttlMs: number,
): FomoV2ProjectExchangeMarketsService {
  const configService = {
    get: jest.fn((key: string) =>
      key === "FOMO_V2_COINGECKO_DERIVATIVES_CACHE_TTL_MS" ? ttlMs : undefined,
    ),
  } as unknown as ConfigService;

  return new FomoV2ProjectExchangeMarketsService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    configService,
    client as unknown as CoinGeckoProClientService,
  );
}

function derivatives(): CoinGeckoDerivativeDto[] {
  return [
    {
      market: "Binance (Futures)",
      symbol: "BTCUSDT",
    },
  ];
}
