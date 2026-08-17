import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import {
  AddMarketDataPointsInput,
  AnalyticsService,
  MarketDataHistoryPoint,
  ProjectMarketHistoryResetResult,
  ProjectChartCacheRebuildResult,
} from "src/analytics/analytics.service";
import { Project, ProjectDocument } from "src/projects/project.model";
import { CoinGeckoMarketChartDto, MarketDataTier, ResolvedCoinGeckoProject } from "./coingecko-market.types";
import { CoinGeckoProClientService } from "./coingecko-pro-client.service";
import { CoinGeckoProjectResolverService } from "./coingecko-project-resolver.service";
import { buildCoinGeckoTierRankFilter, getCoinGeckoTierProjectLimit } from "./config/coingecko-tier.config";

export interface CoinGeckoHistoryBackfillOptions {
  limit?: number;
  skip?: number;
  tier?: MarketDataTier;
  dryRun?: boolean;
  projectIds?: string[];
  days?: string | number;
  interval?: string;
  profile?: "single" | "dense" | "complete";
  windows?: CoinGeckoHistoryFetchWindow[];
  resetBeforeWrite?: boolean;
  delayMs?: number;
  batchSize?: number;
  maxRetries?: number;
}

export interface CoinGeckoHistoryFetchWindow {
  days: string | number;
  interval?: string;
  label?: string;
}

@Injectable()
export class CoinGeckoHistoryBackfillService {
  private readonly logger = new Logger(CoinGeckoHistoryBackfillService.name);

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly configService: ConfigService,
    private readonly coinGeckoClient: CoinGeckoProClientService,
    private readonly projectResolver: CoinGeckoProjectResolverService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async backfillCoinGeckoHistory(options: CoinGeckoHistoryBackfillOptions = {}): Promise<any> {
    const startedAt = new Date();
    const dryRun = options.dryRun !== false;
    const tier = options.tier || "HOT";
    const limit = this.positiveInteger(options.limit, this.defaultLimitForTier(tier));
    const skip = this.nonNegativeInteger(options.skip, 0);
    const delayMs = this.nonNegativeInteger(
      options.delayMs,
      Number(this.configService.get("COINGECKO_HISTORY_BACKFILL_DELAY_MS") || 1200),
    );
    const batchSize = this.positiveInteger(options.batchSize, 1);
    const maxRetries = this.positiveInteger(options.maxRetries, 3);
    const days = options.days ?? this.defaultDaysForTier(tier);
    const profile = options.profile || "single";
    const fetchWindows = this.resolveFetchWindows({ ...options, tier, days, profile });
    const summary = {
      dryRun,
      enabled: dryRun || this.isBackfillWriteEnabled(),
      tier,
      limit,
      skip,
      days,
      profile,
      windows: fetchWindows,
      resetBeforeWrite: options.resetBeforeWrite === true,
      startedAt: startedAt.toISOString(),
      finishedAt: "",
      requested: 0,
      resolved: 0,
      requestsPlanned: 0,
      windowRequestsMade: 0,
      fetched: 0,
      pointsFetched: 0,
      plannedWrites: 0,
      upserted: 0,
      modified: 0,
      rebuiltCaches: 0,
      resetRawDeleted: 0,
      resetChartsDeleted: 0,
      skippedNoCoingeckoId: 0,
      skippedNoHistory: 0,
      failed: 0,
      failures: [] as any[],
      warnings: [] as string[],
      projectReports: [] as any[],
    };
    if (!fetchWindows.some((window) => this.isDaysMax(window.days))) {
      summary.warnings.push(
        `Backfill windows=${this.describeWindows(fetchWindows)} do not include days=max; chartAll will only cover the fetched CoinGecko history window.`,
      );
    }
    if (!this.hasDenseRecentWindow(tier, fetchWindows)) {
      summary.warnings.push(this.shortTimelineWarning(tier, fetchWindows));
    }

    if (!dryRun && !summary.enabled) {
      summary.finishedAt = new Date().toISOString();
      return {
        ...summary,
        disabledReason: "COINGECKO_HISTORY_BACKFILL_ENABLED=false",
      };
    }

    if (!this.coinGeckoClient.isConfigured()) {
      throw new Error("COINGECKO_KEY is not configured");
    }

    const projects = await this.loadProjects({ ...options, tier, limit, skip });
    summary.requested = projects.length;
    const resolution = await this.projectResolver.resolveProjects(projects as any[]);
    const resolvedProjects = resolution.resolved;
    summary.resolved = resolvedProjects.length;
    summary.skippedNoCoingeckoId = projects.length - resolvedProjects.length;
    summary.requestsPlanned = resolvedProjects.length * fetchWindows.length;

    for (const batch of this.chunk(resolvedProjects, batchSize)) {
      await Promise.all(
        batch.map((candidate) =>
          this.backfillProject(candidate, { dryRun, tier, fetchWindows, maxRetries }, summary),
        ),
      );

      if (delayMs > 0) {
        await this.sleep(delayMs);
      }
    }

    summary.finishedAt = new Date().toISOString();
    this.logger.log(
      JSON.stringify({
        event: "coingecko_history_backfill_finished",
        dryRun: summary.dryRun,
        tier: summary.tier,
        requested: summary.requested,
        resolved: summary.resolved,
        windows: summary.windows,
        requestsPlanned: summary.requestsPlanned,
        windowRequestsMade: summary.windowRequestsMade,
        fetched: summary.fetched,
        pointsFetched: summary.pointsFetched,
        plannedWrites: summary.plannedWrites,
        upserted: summary.upserted,
        modified: summary.modified,
        resetBeforeWrite: summary.resetBeforeWrite,
        resetRawDeleted: summary.resetRawDeleted,
        resetChartsDeleted: summary.resetChartsDeleted,
        skippedNoCoingeckoId: summary.skippedNoCoingeckoId,
        skippedNoHistory: summary.skippedNoHistory,
        failed: summary.failed,
      }),
    );

    return summary;
  }

  private async backfillProject(
    candidate: ResolvedCoinGeckoProject,
    options: {
      dryRun: boolean;
      tier: MarketDataTier;
      fetchWindows: CoinGeckoHistoryFetchWindow[];
      maxRetries: number;
    },
    summary: any,
  ): Promise<void> {
    try {
      const fetchResult = await this.fetchWindowedHistory(candidate.coingeckoId, options.fetchWindows, options.maxRetries);
      summary.windowRequestsMade += fetchResult.windowReports.length;
      const points = this.mergeHistoryPoints(fetchResult.points);
      const estimatedCacheStats = this.estimateCacheStats(points);
      summary.fetched += 1;
      summary.pointsFetched += points.length;

      if (!points.length) {
        summary.skippedNoHistory += 1;
        return;
      }

      let resetStats: ProjectMarketHistoryResetResult | null = null;
      if (summary.resetBeforeWrite) {
        resetStats = await this.analyticsService.resetProjectMarketHistory(candidate.projectId, {
          dryRun: options.dryRun,
        });
        summary.resetRawDeleted += resetStats.rawDeleted;
        summary.resetChartsDeleted += resetStats.chartDeleted;
      }

      const writes: AddMarketDataPointsInput[] = points.map((point) => ({
        projectId: candidate.projectId,
        point,
      }));
      const writeResult = await this.analyticsService.addMarketDataPoints(writes, {
        source: "coingecko",
        tier: options.tier,
        dryRun: options.dryRun,
        updateChartCache: false,
      });
      summary.plannedWrites += writeResult.planned;
      summary.upserted += writeResult.upserted;
      summary.modified += writeResult.modified;

      let cacheStats: ProjectChartCacheRebuildResult | null = null;
      if (!options.dryRun && writeResult.planned > 0) {
        cacheStats = await this.analyticsService.rebuildProjectChartCache(candidate.projectId);
        summary.rebuiltCaches += 1;
      }

      const report = {
        projectId: candidate.projectId,
        coingeckoId: candidate.coingeckoId,
        firstTimestamp: cacheStats?.firstTimestamp || estimatedCacheStats.firstTimestamp,
        lastTimestamp: cacheStats?.lastTimestamp || estimatedCacheStats.lastTimestamp,
        rawPointsCount: cacheStats?.rawPoints || points.length,
        fetchedRawPointsCount: points.length,
        windowReports: fetchResult.windowReports,
        resetRawDeleted: resetStats?.rawDeleted || 0,
        resetChartsDeleted: resetStats?.chartDeleted || 0,
        plannedWrites: writeResult.planned,
        upserted: writeResult.upserted,
        modified: writeResult.modified,
        chart24hPointsCount: cacheStats?.chart24hPointsCount || estimatedCacheStats.chart24hPointsCount,
        chart7dPointsCount: cacheStats?.chart7dPointsCount || estimatedCacheStats.chart7dPointsCount,
        chart30dPointsCount: cacheStats?.chart30dPointsCount || estimatedCacheStats.chart30dPointsCount,
        chart1yPointsCount: cacheStats?.chart1yPointsCount || estimatedCacheStats.chart1yPointsCount,
        chartAllPointsCount: cacheStats?.chartAllPointsCount || estimatedCacheStats.chartAllPointsCount,
      };
      summary.projectReports.push(report);
      this.logger.log(
        JSON.stringify({
          event: "coingecko_history_backfill_project",
          dryRun: options.dryRun,
          ...report,
        }),
      );
    } catch (error) {
      summary.failed += 1;
      const failure = {
        projectId: candidate.projectId,
        coingeckoId: candidate.coingeckoId,
        error: error?.message || String(error),
      };
      summary.failures.push(failure);
      this.logger.warn(
        `CoinGecko history backfill failed project=${candidate.projectId} coingeckoId=${candidate.coingeckoId} error=${failure.error}`,
      );
    }
  }

  private async loadProjects(options: {
    tier: MarketDataTier;
    limit: number;
    skip: number;
    projectIds?: string[];
  }): Promise<any[]> {
    if (options.projectIds?.length) {
      const objectIds = options.projectIds
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      if (!objectIds.length) return [];

      return this.projectModel
        .find({ _id: { $in: objectIds } })
        .sort({ rank: 1 })
        .select("_id rank slug symbol name source sourceId rawIcoData tokenMetrics")
        .lean();
    }

    const rankFilter = this.rankFilterForTier(options.tier);

    return this.projectModel
      .find({ rank: rankFilter })
      .sort({ rank: 1 })
      .skip(options.skip)
      .limit(options.limit)
      .select("_id rank slug symbol name source sourceId rawIcoData tokenMetrics")
      .lean();
  }

  private rankFilterForTier(tier: MarketDataTier): any {
    return buildCoinGeckoTierRankFilter(tier);
  }

  private defaultDaysForTier(tier: MarketDataTier): string | number {
    if (tier === "HOT") return "max";
    return 365;
  }

  private defaultLimitForTier(tier: MarketDataTier): number {
    if (tier === "HOT") return getCoinGeckoTierProjectLimit("HOT") || 250;
    return 500;
  }

  private resolveFetchWindows(options: {
    tier: MarketDataTier;
    days: string | number;
    interval?: string;
    profile: "single" | "dense" | "complete";
    windows?: CoinGeckoHistoryFetchWindow[];
  }): CoinGeckoHistoryFetchWindow[] {
    if (options.windows?.length) {
      return this.uniqueWindows(options.windows.map((window) => this.normalizeWindow(window, "custom")));
    }

    const longWindow = this.normalizeWindow(
      {
        days: options.days,
        interval: options.interval,
        label: "long",
      },
      "long",
    );

    if (options.profile === "single") {
      return [longWindow];
    }

    const denseWindows = this.denseWindowsForTier(options.tier);
    if (options.profile === "dense") {
      return denseWindows;
    }

    return this.uniqueWindows([longWindow, ...denseWindows]);
  }

  private denseWindowsForTier(tier: MarketDataTier): CoinGeckoHistoryFetchWindow[] {
    if (tier === "HOT") {
      return [
        { days: 30, label: "recent_hourly_auto" },
        { days: 1, label: "intraday_5m_auto" },
      ];
    }

    if (tier === "WARM") {
      return [{ days: 30, label: "recent_hourly_auto" }];
    }

    return [];
  }

  private normalizeWindow(window: CoinGeckoHistoryFetchWindow, fallbackLabel: string): CoinGeckoHistoryFetchWindow {
    const days = this.normalizeDays(window.days);
    const interval = this.normalizeInterval(window.interval);
    return {
      days,
      ...(interval ? { interval } : {}),
      label: window.label || this.windowLabel(days, interval, fallbackLabel),
    };
  }

  private uniqueWindows(windows: CoinGeckoHistoryFetchWindow[]): CoinGeckoHistoryFetchWindow[] {
    const seen = new Set<string>();
    const result: CoinGeckoHistoryFetchWindow[] = [];

    for (const window of windows) {
      const key = `${String(window.days).toLowerCase()}:${window.interval || "auto"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(window);
    }

    return result;
  }

  private windowLabel(days: string | number, interval: string | undefined, fallback: string): string {
    const intervalSuffix = interval ? `_${interval}` : "_auto";
    return `${fallback}_${days}${intervalSuffix}`;
  }

  private normalizeDays(value: any): string | number {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return "max";
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : trimmed.toLowerCase();
  }

  private normalizeInterval(value: any): string | undefined {
    const normalized = String(value || "").trim().toLowerCase();
    if (!normalized || normalized === "auto") return undefined;
    if (["5m", "hourly", "daily"].includes(normalized)) return normalized;
    return undefined;
  }

  private isDaysMax(days: string | number): boolean {
    return String(days || "").trim().toLowerCase() === "max";
  }

  private describeWindows(windows: CoinGeckoHistoryFetchWindow[]): string {
    return windows
      .map((window) => `${window.days}${window.interval ? `:${window.interval}` : ":auto"}`)
      .join(",");
  }

  private hasDenseRecentWindow(tier: MarketDataTier, windows: CoinGeckoHistoryFetchWindow[]): boolean {
    if (tier === "COLD") return true;
    const hasThirtyDayWindow = windows.some((window) => Number(window.days) >= 30 || window.interval === "hourly");
    if (tier === "WARM") return hasThirtyDayWindow;
    const hasIntradayWindow = windows.some((window) => Number(window.days) === 1 || window.interval === "5m");
    return hasThirtyDayWindow && hasIntradayWindow;
  }

  private shortTimelineWarning(tier: MarketDataTier, windows: CoinGeckoHistoryFetchWindow[]): string {
    return `Backfill tier=${tier} windows=${this.describeWindows(windows)} may leave chart24h/chart7d/chart30d sparse. Use --profile=complete or explicit --windows=max,30,1 for HOT and --windows=max,30 for WARM.`;
  }

  private async fetchMarketChartWithRetry(
    coingeckoId: string,
    days: string | number,
    interval: string | undefined,
    maxRetries: number,
  ): Promise<CoinGeckoMarketChartDto> {
    let attempt = 0;
    let lastError: any;

    while (attempt < maxRetries) {
      try {
        return await this.coinGeckoClient.fetchMarketChart(coingeckoId, days, interval);
      } catch (error) {
        lastError = error;
        attempt += 1;
        if (attempt >= maxRetries) break;

        const status = error?.response?.status;
        const retryAfterSeconds = Number(error?.response?.headers?.["retry-after"]);
        const retryAfterMs = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
          ? retryAfterSeconds * 1000
          : 1000 * Math.pow(2, attempt);
        const backoffMs = status === 429 ? retryAfterMs : Math.min(retryAfterMs, 10000);
        await this.sleep(backoffMs);
      }
    }

    throw lastError;
  }

  private async fetchWindowedHistory(
    coingeckoId: string,
    windows: CoinGeckoHistoryFetchWindow[],
    maxRetries: number,
  ): Promise<{ points: MarketDataHistoryPoint[]; windowReports: any[] }> {
    const points: MarketDataHistoryPoint[] = [];
    const windowReports: any[] = [];

    for (const window of windows) {
      const history = await this.fetchMarketChartWithRetry(coingeckoId, window.days, window.interval, maxRetries);
      const windowPoints = this.toHistoryPoints(history);
      points.push(...windowPoints);
      windowReports.push({
        label: window.label,
        days: window.days,
        interval: window.interval || "auto",
        rawPoints: windowPoints.length,
        firstTimestamp: windowPoints[0]?.timestamp
          ? new Date(windowPoints[0].timestamp).toISOString()
          : undefined,
        lastTimestamp: windowPoints[windowPoints.length - 1]?.timestamp
          ? new Date(windowPoints[windowPoints.length - 1].timestamp).toISOString()
          : undefined,
      });
    }

    return { points, windowReports };
  }

  private mergeHistoryPoints(points: MarketDataHistoryPoint[]): MarketDataHistoryPoint[] {
    const pointByTimestamp = new Map<number, MarketDataHistoryPoint>();

    for (const point of points) {
      const timestamp = this.toTimestampMs(point.timestamp);
      if (timestamp === null) continue;
      pointByTimestamp.set(timestamp, {
        ...point,
        timestamp: new Date(timestamp),
        source: "coingecko",
      });
    }

    const merged = Array.from(pointByTimestamp.values())
      .sort((a, b) => (this.toTimestampMs(a.timestamp) || 0) - (this.toTimestampMs(b.timestamp) || 0));

    return this.recalculatePriceChanges(merged);
  }

  private recalculatePriceChanges(points: MarketDataHistoryPoint[]): MarketDataHistoryPoint[] {
    const priceRows = points
      .map((point) => ({
        timestamp: this.toTimestampMs(point.timestamp),
        price: this.toFinitePositiveNumber(point.price),
      }))
      .filter((point) => point.timestamp !== null && point.price !== null) as Array<{ timestamp: number; price: number }>;

    const priceIndexByTimestamp = new Map<number, number>();
    priceRows.forEach((point, index) => priceIndexByTimestamp.set(point.timestamp, index));

    return points.map((point) => {
      const timestamp = this.toTimestampMs(point.timestamp);
      const priceIndex = timestamp === null ? undefined : priceIndexByTimestamp.get(timestamp);
      if (priceIndex === undefined) return point;

      return {
        ...point,
        priceChange24h: this.calculatePriceChange24h(priceRows, priceIndex),
      };
    });
  }

  private toHistoryPoints(history: CoinGeckoMarketChartDto): MarketDataHistoryPoint[] {
    const marketCapsByTimestamp = this.toValueMap(history.market_caps || []);
    const volumesByTimestamp = this.toValueMap(history.total_volumes || []);
    const prices = (history.prices || [])
      .map(([timestamp, price]) => ({
        timestamp,
        price: this.toFinitePositiveNumber(price),
      }))
      .filter((point) => Number.isFinite(point.timestamp) && point.price !== null)
      .sort((a, b) => a.timestamp - b.timestamp);
    const result: MarketDataHistoryPoint[] = [];

    for (let index = 0; index < prices.length; index += 1) {
      const point = prices[index];
      result.push({
        timestamp: new Date(point.timestamp),
        price: point.price,
        marketCap: this.toFinitePositiveNumber(marketCapsByTimestamp.get(point.timestamp)),
        volume24h: this.toFinitePositiveNumber(volumesByTimestamp.get(point.timestamp)),
        priceChange24h: this.calculatePriceChange24h(prices, index),
        source: "coingecko",
      });
    }

    return result;
  }

  private calculatePriceChange24h(prices: Array<{ timestamp: number; price: number }>, index: number): number | null {
    const target = prices[index].timestamp - 24 * 60 * 60 * 1000;
    let best: { timestamp: number; price: number } | null = null;

    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      const candidate = prices[cursor];
      if (!best || Math.abs(candidate.timestamp - target) < Math.abs(best.timestamp - target)) {
        best = candidate;
      }
      if (candidate.timestamp <= target) break;
    }

    if (!best || best.price <= 0) return null;
    return ((prices[index].price - best.price) / best.price) * 100;
  }

  private toValueMap(rows: [number, number][]): Map<number, number> {
    const result = new Map<number, number>();
    for (const [timestamp, value] of rows) {
      const numberValue = this.toFinitePositiveNumber(value);
      if (Number.isFinite(timestamp) && numberValue !== null) {
        result.set(timestamp, numberValue);
      }
    }
    return result;
  }

  private estimateCacheStats(points: MarketDataHistoryPoint[]): any {
    const timestamps = points
      .map((point) => this.toTimestampMs(point.timestamp))
      .filter((timestamp) => timestamp !== null)
      .sort((a, b) => a - b) as number[];
    const nowMs = Date.now();
    const oneDayAgoMs = nowMs - 24 * 60 * 60 * 1000;
    const sevenDaysAgoMs = nowMs - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000;
    const oneYearAgoMs = nowMs - 365 * 24 * 60 * 60 * 1000;
    const chart24hPoints = timestamps.filter((timestamp) => timestamp >= oneDayAgoMs);
    const chart7dPoints = timestamps.filter((timestamp) => timestamp >= sevenDaysAgoMs);
    const chart30dPoints = timestamps.filter((timestamp) => timestamp >= thirtyDaysAgoMs);
    const chart1yPoints = timestamps.filter((timestamp) => timestamp >= oneYearAgoMs);

    return {
      firstTimestamp: timestamps[0] ? new Date(timestamps[0]).toISOString() : undefined,
      lastTimestamp: timestamps[timestamps.length - 1]
        ? new Date(timestamps[timestamps.length - 1]).toISOString()
        : undefined,
      chart24hPointsCount: Math.min(chart24hPoints.length, 288),
      chart7dPointsCount: Math.min(chart7dPoints.length, 2016),
      chart30dPointsCount: Math.min(chart30dPoints.length, 8640),
      chart1yPointsCount: Math.min(chart1yPoints.length, 730),
      chartAllPointsCount: Math.min(timestamps.length, 1500),
    };
  }

  private toTimestampMs(value: any): number | null {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date.getTime() : null;
  }

  private isBackfillWriteEnabled(): boolean {
    return this.readBooleanFlag("COINGECKO_HISTORY_BACKFILL_ENABLED", false);
  }

  private readBooleanFlag(name: string, defaultValue: boolean): boolean {
    const value = this.configService.get(name) ?? process.env[name];
    if (value === undefined || value === null || value === "") return defaultValue;
    const normalized = String(value).trim().toLowerCase();
    if (["false", "0", "off", "no"].includes(normalized)) return false;
    if (["true", "1", "on", "yes"].includes(normalized)) return true;
    return defaultValue;
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
  }

  private nonNegativeInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
  }

  private toFinitePositiveNumber(value: any): number | null {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
