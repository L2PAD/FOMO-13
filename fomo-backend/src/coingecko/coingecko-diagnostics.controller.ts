import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { CoinGeckoAliasMappingService } from "./coingecko-alias-mapping.service";
import { CoinGeckoHistoryBackfillService } from "./coingecko-history-backfill.service";
import { CoinGeckoMappingBackfillService } from "./coingecko-mapping-backfill.service";
import { CoinGeckoMarketDiagnosticsService } from "./coingecko-market-diagnostics.service";
import { CoinGeckoCreditUsageService } from "./coingecko-credit-usage.service";

@Controller("admin/coingecko")
@Roles("admin")
@UseGuards(JwtAuthGuard)
export class CoinGeckoDiagnosticsController {
  constructor(
    private readonly diagnosticsService: CoinGeckoMarketDiagnosticsService,
    private readonly mappingBackfillService: CoinGeckoMappingBackfillService,
    private readonly aliasMappingService: CoinGeckoAliasMappingService,
    private readonly historyBackfillService: CoinGeckoHistoryBackfillService,
    private readonly creditUsageService: CoinGeckoCreditUsageService,
  ) {}

  @Get("usage")
  async getCreditUsage() {
    return this.creditUsageService.getUsage();
  }

  @Post("market-data/diagnostics")
  async runMarketDataDiagnostics(@Query() query: any, @Body() body: any = {}) {
    return this.diagnosticsService.runDiagnostics({
      dryRun: !this.isFalse(query.dryRun ?? body.dryRun),
      write: this.isTruthy(query.write ?? body.write),
      sampleSizePerTier: this.optionalNumber(query.sampleSizePerTier ?? body.sampleSizePerTier),
      hotSampleSize: this.optionalNumber(query.hotSampleSize ?? query["hot-sample-size"] ?? body.hotSampleSize),
      warmSampleSize: this.optionalNumber(query.warmSampleSize ?? query["warm-sample-size"] ?? body.warmSampleSize),
      coldSampleSize: this.optionalNumber(query.coldSampleSize ?? query["cold-sample-size"] ?? body.coldSampleSize),
      topUnmappedLimit: this.optionalNumber(query.topUnmappedLimit ?? body.topUnmappedLimit),
    });
  }

  @Post("mappings/backfill")
  async backfillMappings(@Query() query: any, @Body() body: any = {}) {
    return this.mappingBackfillService.backfillProjectSourceMaps({
      dryRun: !this.isFalse(query.dryRun ?? body.dryRun),
      write: this.isTruthy(query.write ?? body.write),
      limit: this.optionalNumber(query.limit ?? body.limit),
      offset: this.optionalNumber(query.offset ?? body.offset),
      minConfidence: this.optionalNumber(query.minConfidence ?? body.minConfidence),
      topSkippedLimit: this.optionalNumber(query.topSkippedLimit ?? body.topSkippedLimit),
      refreshExisting: this.isTruthy(query.refreshExisting ?? body.refreshExisting),
    });
  }

  @Post("mappings/alias-pass")
  async runAliasMapping(@Query() query: any, @Body() body: any = {}) {
    return this.aliasMappingService.runAliasMapping({
      dryRun: !this.isFalse(query.dryRun ?? body.dryRun),
      write: this.isTruthy(query.write ?? body.write),
      limit: this.optionalNumber(query.limit ?? body.limit),
      minConfidence: this.optionalNumber(query.minConfidence ?? body.minConfidence),
      maxRank: this.optionalNumber(query.maxRank ?? body.maxRank),
      topMarketCapLimit: this.optionalNumber(query.topMarketCapLimit ?? body.topMarketCapLimit),
      searchLimit: this.optionalNumber(query.searchLimit ?? body.searchLimit),
      topImportantLimit: this.optionalNumber(query.topImportantLimit ?? body.topImportantLimit),
      refreshExisting: this.isTruthy(query.refreshExisting ?? body.refreshExisting),
    });
  }

  @Post("history/backfill")
  async backfillHistory(@Query() query: any, @Body() body: any = {}) {
    return this.historyBackfillService.backfillCoinGeckoHistory({
      dryRun: !this.isFalse(query.dryRun ?? body.dryRun),
      limit: this.optionalNumber(query.limit ?? body.limit),
      skip: this.optionalNumber(query.skip ?? query.offset ?? body.skip ?? body.offset),
      tier: query.tier ?? body.tier,
      projectIds: this.optionalCsv(query.projectIds ?? query["project-ids"] ?? body.projectIds),
      days: query.days ?? body.days,
      interval: query.interval ?? body.interval,
      profile: query.profile ?? body.profile,
      windows: this.optionalWindows(query.windows ?? body.windows),
      resetBeforeWrite: this.isTruthy(query.resetBeforeWrite ?? query["reset-before-write"] ?? body.resetBeforeWrite),
      delayMs: this.optionalNumber(query.delayMs ?? query["delay-ms"] ?? body.delayMs),
      batchSize: this.optionalNumber(query.batchSize ?? query["batch-size"] ?? body.batchSize),
      maxRetries: this.optionalNumber(query.maxRetries ?? query["max-retries"] ?? body.maxRetries),
    });
  }

  private isFalse(value: any): boolean {
    return ["0", "false", "no", "off"].includes(String(value ?? "").toLowerCase());
  }

  private isTruthy(value: any): boolean {
    return ["1", "true", "yes", "on"].includes(String(value ?? "").toLowerCase());
  }

  private optionalNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : undefined;
  }

  private optionalCsv(value: any): string[] | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private optionalWindows(value: any): Array<{ days: string | number; interval?: string }> | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === "object" && item !== null) {
            return {
              days: item.days,
              interval: item.interval,
            };
          }
          return this.parseWindow(String(item));
        })
        .filter((item) => item.days !== undefined && item.days !== null && item.days !== "");
    }
    return String(value)
      .split(",")
      .map((item) => this.parseWindow(item))
      .filter((item) => item.days !== undefined && item.days !== null && item.days !== "");
  }

  private parseWindow(value: string): { days: string | number; interval?: string } {
    const [daysRaw, intervalRaw] = String(value || "").trim().split(":");
    const numberDays = Number(daysRaw);
    return {
      days: Number.isFinite(numberDays) && numberDays > 0 ? Math.trunc(numberDays) : daysRaw,
      interval: intervalRaw || undefined,
    };
  }
}
