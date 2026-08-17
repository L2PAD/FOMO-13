import { ConfigService } from "@nestjs/config";
import { CoinGeckoProClientService } from "src/coingecko/coingecko-pro-client.service";
import { FomoV2MarketSyncSchedulerService } from "./market-sync-scheduler.service";

describe("FOMO v2 latest batching defaults", () => {
  const envNames = [
    "COINGECKO_MARKETS_BATCH_SIZE",
    "FOMO_V2_MARKET_SYNC_BATCH_SIZE",
    "FOMO_V2_MARKET_SYNC_LATEST_BATCH_SIZE",
  ] as const;
  const originalEnv = new Map(envNames.map((name) => [name, process.env[name]]));

  beforeEach(() => {
    for (const name of envNames) delete process.env[name];
  });

  afterAll(() => {
    for (const name of envNames) {
      const original = originalEnv.get(name);
      if (original === undefined) delete process.env[name];
      else process.env[name] = original;
    }
  });

  it("claims 247 latest targets so three reference IDs still fit one request", () => {
    const scheduler = new FomoV2MarketSyncSchedulerService({} as any, {} as any);

    expect((scheduler as any).batchSize("latest")).toBe(247);
  });

  it("uses CoinGecko's 250-ID markets chunk by default", () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    const client = new CoinGeckoProClientService(configService);

    expect(client.getMaxBatchSize()).toBe(250);
  });
});
