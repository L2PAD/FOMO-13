import { ConfigService } from "@nestjs/config";
import { CoinGeckoCreditUsageService } from "./coingecko-credit-usage.service";
import { CoinGeckoProClientService } from "./coingecko-pro-client.service";

describe("CoinGeckoCreditUsageService", () => {
  let now: number;
  let client: jest.Mocked<
    Pick<CoinGeckoProClientService, "isConfigured" | "fetchApiUsage">
  >;
  let service: CoinGeckoCreditUsageService;

  beforeEach(() => {
    now = new Date("2026-07-16T12:00:00.000Z").getTime();
    jest.spyOn(Date, "now").mockImplementation(() => now);
    client = {
      isConfigured: jest.fn().mockReturnValue(true),
      fetchApiUsage: jest.fn(),
    };
    const configService = {
      get: jest.fn((key: string) =>
        key === "COINGECKO_CREDIT_USAGE_CACHE_TTL_MS" ? 60_000 : undefined
      ),
    } as unknown as ConfigService;

    service = new CoinGeckoCreditUsageService(
      client as unknown as CoinGeckoProClientService,
      configService
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses per-key totals and calculates a calendar-month projection", async () => {
    client.fetchApiUsage.mockResolvedValue({
      plan: "Analyst",
      monthly_call_credit: 1_000_000,
      current_total_monthly_calls: 20_000,
      api_key_monthly_call_credit: 500_000,
      api_key_current_total_monthly_calls: 8_000,
      api_key_rate_limit_request_per_minute: 500,
    });

    const result = await service.getUsage();

    expect(result).toMatchObject({
      configured: true,
      available: true,
      cached: false,
      stale: false,
      scope: "api_key",
      plan: "Analyst",
      usedCredits: 8_000,
      monthlyLimit: 500_000,
      remainingCredits: 492_000,
      utilizationPercent: 1.6,
      monthlyBudget: 500_000,
      budgetRemainingCredits: 492_000,
      budgetUtilizationPercent: 1.6,
      averageCreditsPerHour: 21.51,
      averageCreditsPerDay: 516.13,
      recentCreditsPerHour: null,
      projectedMonthlyCredits: 16_000,
      projectedUtilizationPercent: 3.2,
      projectedBudgetUtilizationPercent: 3.2,
      remainingHourlyBudget: 1_322.58,
      remainingDailyBudget: 31_741.94,
      rateLimitPerMinute: 500,
      billingMonth: "2026-07",
      checkedAt: "2026-07-16T12:00:00.000Z",
      cacheTtlMs: 60_000,
    });
  });

  it("falls back to account totals when per-key totals are missing", async () => {
    client.fetchApiUsage.mockResolvedValue({
      monthly_call_credit: "500000",
      current_total_monthly_calls: "10000",
      current_remaining_monthly_calls: "490000",
      rate_limit_request_per_minute: "250",
    });

    const result = await service.getUsage();

    expect(result).toMatchObject({
      available: true,
      scope: "account",
      usedCredits: 10_000,
      monthlyLimit: 500_000,
      remainingCredits: 490_000,
      rateLimitPerMinute: 250,
    });
  });

  it("deduplicates concurrent refreshes and serves the cached result", async () => {
    let resolveUsage: (value: {
      api_key_monthly_call_credit: number;
      api_key_current_total_monthly_calls: number;
    }) => void = () => undefined;
    client.fetchApiUsage.mockReturnValue(
      new Promise((resolve) => {
        resolveUsage = resolve;
      })
    );

    const firstRequest = service.getUsage();
    const secondRequest = service.getUsage();
    resolveUsage({
      api_key_monthly_call_credit: 500_000,
      api_key_current_total_monthly_calls: 8_000,
    });

    await Promise.all([firstRequest, secondRequest]);
    const cached = await service.getUsage();

    expect(client.fetchApiUsage).toHaveBeenCalledTimes(1);
    expect(cached.cached).toBe(true);
  });

  it("calculates a recent hourly rate from two uncached snapshots", async () => {
    client.fetchApiUsage
      .mockResolvedValueOnce({
        api_key_monthly_call_credit: 500_000,
        api_key_current_total_monthly_calls: 8_000,
      })
      .mockResolvedValueOnce({
        api_key_monthly_call_credit: 500_000,
        api_key_current_total_monthly_calls: 8_010,
      });

    const initial = await service.getUsage();
    now += 120_000;
    const updated = await service.getUsage();

    expect(initial.recentCreditsPerHour).toBeNull();
    expect(updated).toMatchObject({
      recentCreditsPerHour: 300,
      recentProjectedDailyCredits: 7_200,
      recentWindowMinutes: 2,
    });
    expect(client.fetchApiUsage).toHaveBeenCalledTimes(2);
  });

  it("returns the last successful snapshot as stale after a refresh error", async () => {
    client.fetchApiUsage.mockResolvedValueOnce({
      api_key_monthly_call_credit: 500_000,
      api_key_current_total_monthly_calls: 8_000,
    });
    const initial = await service.getUsage();

    now += 60_001;
    client.fetchApiUsage.mockRejectedValueOnce(new Error("secret response"));
    const stale = await service.getUsage();

    expect(stale).toMatchObject({
      available: true,
      cached: true,
      stale: true,
      usedCredits: 8_000,
      checkedAt: initial.checkedAt,
    });
    expect(stale.error).toBe(
      "CoinGecko credit usage is temporarily unavailable"
    );
  });

  it("does not serve a previous-month cache entry after the UTC rollover", async () => {
    now = new Date("2026-07-31T23:59:30.000Z").getTime();
    client.fetchApiUsage
      .mockResolvedValueOnce({
        api_key_monthly_call_credit: 500_000,
        api_key_current_total_monthly_calls: 150_000,
      })
      .mockResolvedValueOnce({
        api_key_monthly_call_credit: 500_000,
        api_key_current_total_monthly_calls: 1,
      });

    await service.getUsage();
    now = new Date("2026-08-01T00:00:01.000Z").getTime();
    const august = await service.getUsage();

    expect(client.fetchApiUsage).toHaveBeenCalledTimes(2);
    expect(august).toMatchObject({
      billingMonth: "2026-08",
      usedCredits: 1,
      recentCreditsPerHour: null,
    });
  });

  it("does not call CoinGecko when the key is not configured", async () => {
    client.isConfigured.mockReturnValue(false);

    const result = await service.getUsage();

    expect(result).toMatchObject({
      configured: false,
      available: false,
      error: "COINGECKO_KEY is not configured",
    });
    expect(client.fetchApiUsage).not.toHaveBeenCalled();
  });
});

describe("CoinGeckoProClientService credit usage", () => {
  it("requests the official /key endpoint", async () => {
    const configService = {
      get: jest.fn((key: string) =>
        key === "COINGECKO_KEY" ? "test-key" : undefined
      ),
    } as unknown as ConfigService;
    const client = new CoinGeckoProClientService(configService);
    const get = jest.fn().mockResolvedValue({
      data: { api_key_current_total_monthly_calls: 8_000 },
    });
    (client as any).client = { get };

    await expect(client.fetchApiUsage()).resolves.toEqual({
      api_key_current_total_monthly_calls: 8_000,
    });
    expect(get).toHaveBeenCalledWith("/key");
  });
});
