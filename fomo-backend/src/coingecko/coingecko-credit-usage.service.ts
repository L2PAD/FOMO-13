import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { CoinGeckoApiUsageDto } from "./coingecko-market.types";
import { CoinGeckoProClientService } from "./coingecko-pro-client.service";

const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000;
const MIN_CACHE_TTL_MS = 60 * 1000;
const MAX_CACHE_TTL_MS = 60 * 60 * 1000;
const ERROR_RETRY_TTL_MS = 60 * 1000;
const DEFAULT_MONTHLY_BUDGET = 500_000;

export type CoinGeckoCreditUsageScope = "api_key" | "account";

export interface CoinGeckoCreditUsageResponse {
  configured: boolean;
  available: boolean;
  cached: boolean;
  stale: boolean;
  scope: CoinGeckoCreditUsageScope | null;
  plan: string | null;
  usedCredits: number | null;
  monthlyLimit: number | null;
  remainingCredits: number | null;
  utilizationPercent: number | null;
  monthlyBudget: number;
  budgetRemainingCredits: number | null;
  budgetUtilizationPercent: number | null;
  averageCreditsPerHour: number | null;
  averageCreditsPerDay: number | null;
  recentCreditsPerHour: number | null;
  recentProjectedDailyCredits: number | null;
  recentWindowMinutes: number | null;
  projectedMonthlyCredits: number | null;
  projectedUtilizationPercent: number | null;
  projectedBudgetUtilizationPercent: number | null;
  remainingHourlyBudget: number | null;
  remainingDailyBudget: number | null;
  rateLimitPerMinute: number | null;
  billingMonth: string;
  checkedAt: string | null;
  nextRefreshAt: string;
  cacheTtlMs: number;
  error?: string;
}

type CachedSnapshot = Omit<
  CoinGeckoCreditUsageResponse,
  "cached" | "nextRefreshAt"
>;

interface CacheEntry {
  snapshot: CachedSnapshot;
  expiresAt: number;
}

interface UsageSample {
  billingMonth: string;
  scope: CoinGeckoCreditUsageScope;
  usedCredits: number;
  checkedAtMs: number;
}

@Injectable()
export class CoinGeckoCreditUsageService {
  private readonly logger = new Logger(CoinGeckoCreditUsageService.name);
  private readonly cacheTtlMs: number;
  private readonly monthlyBudget: number;
  private cache: CacheEntry | null = null;
  private previousUsageSample: UsageSample | null = null;
  private refreshPromise: Promise<CoinGeckoCreditUsageResponse> | null = null;

  constructor(
    private readonly coinGeckoClient: CoinGeckoProClientService,
    private readonly configService: ConfigService
  ) {
    this.cacheTtlMs = this.resolveCacheTtlMs();
    this.monthlyBudget = this.resolveMonthlyBudget();
  }

  async getUsage(): Promise<CoinGeckoCreditUsageResponse> {
    const now = Date.now();

    if (this.cache && now < this.cache.expiresAt) {
      return this.toResponse(this.cache, true);
    }

    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.refresh(now);

    try {
      return await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async refresh(now: number): Promise<CoinGeckoCreditUsageResponse> {
    if (!this.coinGeckoClient.isConfigured()) {
      const entry = this.store(
        {
          ...this.emptySnapshot(new Date(now)),
          configured: false,
          error: "COINGECKO_KEY is not configured",
        },
        this.cacheExpiry(now, this.cacheTtlMs)
      );
      return this.toResponse(entry, false);
    }

    try {
      const providerUsage = await this.coinGeckoClient.fetchApiUsage();
      const snapshot = this.withRecentRate(
        this.normalizeUsage(providerUsage, new Date(now)),
        now
      );
      const entry = this.store(
        snapshot,
        this.cacheExpiry(now, this.cacheTtlMs)
      );
      return this.toResponse(entry, false);
    } catch (error) {
      const safeError = this.getSafeErrorMessage(error);
      this.logger.warn(safeError);

      if (this.cache?.snapshot.available) {
        const entry = this.store(
          {
            ...this.cache.snapshot,
            stale: true,
            error: safeError,
          },
          this.cacheExpiry(
            now,
            Math.min(this.cacheTtlMs, ERROR_RETRY_TTL_MS)
          )
        );
        return this.toResponse(entry, true);
      }

      const entry = this.store(
        {
          ...this.emptySnapshot(new Date(now)),
          configured: true,
          error: safeError,
        },
        this.cacheExpiry(
          now,
          Math.min(this.cacheTtlMs, ERROR_RETRY_TTL_MS)
        )
      );
      return this.toResponse(entry, false);
    }
  }

  private normalizeUsage(
    value: CoinGeckoApiUsageDto,
    now: Date
  ): CachedSnapshot {
    const apiKeyUsed = this.toNonNegativeNumber(
      value.api_key_current_total_monthly_calls
    );
    const apiKeyLimit = this.toNonNegativeNumber(
      value.api_key_monthly_call_credit
    );
    const accountUsed = this.toNonNegativeNumber(
      value.current_total_monthly_calls
    );
    const accountLimit = this.toNonNegativeNumber(value.monthly_call_credit);
    const useApiKeyScope = apiKeyUsed !== null && apiKeyLimit !== null;
    const scope: CoinGeckoCreditUsageScope = useApiKeyScope
      ? "api_key"
      : "account";
    const usedCredits = useApiKeyScope ? apiKeyUsed : accountUsed;
    const monthlyLimit = useApiKeyScope ? apiKeyLimit : accountLimit;

    if (usedCredits === null || monthlyLimit === null) {
      return {
        ...this.emptySnapshot(now),
        configured: true,
        error: "CoinGecko returned incomplete credit usage data",
      };
    }

    const providerRemaining = this.toNumber(
      value.current_remaining_monthly_calls
    );
    const remainingCredits =
      scope === "account" && providerRemaining !== null
        ? providerRemaining
        : monthlyLimit - usedCredits;
    const monthlyBudget = Math.min(this.monthlyBudget, monthlyLimit);
    const budgetRemainingCredits = monthlyBudget - usedCredits;
    const rateLimitPerMinute = this.toNonNegativeNumber(
      useApiKeyScope
        ? value.api_key_rate_limit_request_per_minute
        : value.rate_limit_request_per_minute
    );
    const monthStartedAt = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      1
    );
    const nextMonthStartsAt = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth() + 1,
      1
    );
    const hourMs = 60 * 60 * 1000;
    const elapsedHours = Math.max(1 / 60, (now.getTime() - monthStartedAt) / hourMs);
    const remainingHours = Math.max(
      1 / 60,
      (nextMonthStartsAt - now.getTime()) / hourMs
    );
    const hoursInMonth = (nextMonthStartsAt - monthStartedAt) / hourMs;
    const averageCreditsPerHour = usedCredits / elapsedHours;
    const averageCreditsPerDay = averageCreditsPerHour * 24;
    const projectedMonthlyCredits = averageCreditsPerHour * hoursInMonth;
    const remainingHourlyBudget = budgetRemainingCredits / remainingHours;

    return {
      configured: true,
      available: true,
      stale: false,
      scope,
      plan: String(value.plan || "").trim() || null,
      usedCredits,
      monthlyLimit,
      remainingCredits,
      utilizationPercent: this.percentage(usedCredits, monthlyLimit),
      monthlyBudget,
      budgetRemainingCredits,
      budgetUtilizationPercent: this.percentage(usedCredits, monthlyBudget),
      averageCreditsPerHour: this.round(averageCreditsPerHour, 2),
      averageCreditsPerDay: this.round(averageCreditsPerDay, 2),
      recentCreditsPerHour: null,
      recentProjectedDailyCredits: null,
      recentWindowMinutes: null,
      projectedMonthlyCredits: Math.round(projectedMonthlyCredits),
      projectedUtilizationPercent: this.percentage(
        projectedMonthlyCredits,
        monthlyLimit
      ),
      projectedBudgetUtilizationPercent: this.percentage(
        projectedMonthlyCredits,
        monthlyBudget
      ),
      remainingHourlyBudget: this.round(remainingHourlyBudget, 2),
      remainingDailyBudget: this.round(remainingHourlyBudget * 24, 2),
      rateLimitPerMinute,
      billingMonth: this.billingMonth(now),
      checkedAt: now.toISOString(),
      cacheTtlMs: this.cacheTtlMs,
    };
  }

  private emptySnapshot(now: Date): CachedSnapshot {
    return {
      configured: false,
      available: false,
      stale: false,
      scope: null,
      plan: null,
      usedCredits: null,
      monthlyLimit: null,
      remainingCredits: null,
      utilizationPercent: null,
      monthlyBudget: this.monthlyBudget,
      budgetRemainingCredits: null,
      budgetUtilizationPercent: null,
      averageCreditsPerHour: null,
      averageCreditsPerDay: null,
      recentCreditsPerHour: null,
      recentProjectedDailyCredits: null,
      recentWindowMinutes: null,
      projectedMonthlyCredits: null,
      projectedUtilizationPercent: null,
      projectedBudgetUtilizationPercent: null,
      remainingHourlyBudget: null,
      remainingDailyBudget: null,
      rateLimitPerMinute: null,
      billingMonth: this.billingMonth(now),
      checkedAt: null,
      cacheTtlMs: this.cacheTtlMs,
    };
  }

  private store(snapshot: CachedSnapshot, expiresAt: number): CacheEntry {
    const entry = { snapshot, expiresAt };
    this.cache = entry;
    return entry;
  }

  private withRecentRate(
    snapshot: CachedSnapshot,
    checkedAtMs: number
  ): CachedSnapshot {
    if (
      !snapshot.available ||
      snapshot.usedCredits === null ||
      snapshot.scope === null ||
      !snapshot.checkedAt
    ) {
      return snapshot;
    }

    const currentSample: UsageSample = {
      billingMonth: snapshot.billingMonth,
      scope: snapshot.scope,
      usedCredits: snapshot.usedCredits,
      checkedAtMs,
    };
    const previousSample = this.previousUsageSample;
    this.previousUsageSample = currentSample;

    if (
      !previousSample ||
      previousSample.billingMonth !== currentSample.billingMonth ||
      previousSample.scope !== currentSample.scope ||
      currentSample.usedCredits < previousSample.usedCredits ||
      currentSample.checkedAtMs <= previousSample.checkedAtMs
    ) {
      return snapshot;
    }

    const windowMs = currentSample.checkedAtMs - previousSample.checkedAtMs;
    const usedDelta = currentSample.usedCredits - previousSample.usedCredits;
    const recentCreditsPerHour = (usedDelta * 60 * 60 * 1000) / windowMs;

    return {
      ...snapshot,
      recentCreditsPerHour: this.round(recentCreditsPerHour, 2),
      recentProjectedDailyCredits: this.round(recentCreditsPerHour * 24, 2),
      recentWindowMinutes: this.round(windowMs / (60 * 1000), 2),
    };
  }

  private toResponse(
    entry: CacheEntry,
    cached: boolean
  ): CoinGeckoCreditUsageResponse {
    return {
      ...entry.snapshot,
      cached,
      nextRefreshAt: new Date(entry.expiresAt).toISOString(),
    };
  }

  private resolveCacheTtlMs(): number {
    const configured = Number(
      this.configService.get("COINGECKO_CREDIT_USAGE_CACHE_TTL_MS") ||
        process.env.COINGECKO_CREDIT_USAGE_CACHE_TTL_MS ||
        DEFAULT_CACHE_TTL_MS
    );

    if (!Number.isFinite(configured) || configured <= 0) {
      return DEFAULT_CACHE_TTL_MS;
    }

    return Math.max(
      MIN_CACHE_TTL_MS,
      Math.min(MAX_CACHE_TTL_MS, Math.trunc(configured))
    );
  }

  private resolveMonthlyBudget(): number {
    const configured = Number(
      this.configService.get("COINGECKO_CREDIT_MONTHLY_BUDGET") ||
        process.env.COINGECKO_CREDIT_MONTHLY_BUDGET ||
        DEFAULT_MONTHLY_BUDGET
    );

    if (!Number.isFinite(configured) || configured <= 0) {
      return DEFAULT_MONTHLY_BUDGET;
    }

    return Math.trunc(configured);
  }

  private cacheExpiry(now: number, ttlMs: number): number {
    const date = new Date(now);
    const nextMonthStartsAt = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      1
    );
    return Math.min(now + ttlMs, nextMonthStartsAt);
  }

  private getSafeErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      return status
        ? `CoinGecko credit usage request failed (HTTP ${status})`
        : "CoinGecko credit usage request failed (network error)";
    }

    return "CoinGecko credit usage is temporarily unavailable";
  }

  private toNonNegativeNumber(value: unknown): number | null {
    const number = this.toNumber(value);
    return number !== null && number >= 0 ? number : null;
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  private percentage(value: number, limit: number): number | null {
    if (limit <= 0) return null;
    return this.round((value / limit) * 100, 2);
  }

  private round(value: number, digits: number): number {
    const multiplier = 10 ** digits;
    return Math.round(value * multiplier) / multiplier;
  }

  private billingMonth(date: Date): string {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
      2,
      "0"
    )}`;
  }
}
