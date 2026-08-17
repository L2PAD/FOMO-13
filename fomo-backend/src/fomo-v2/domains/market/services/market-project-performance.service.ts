import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Types } from "mongoose";
import { MarketDataTier } from "src/coingecko/coingecko-market.types";
import {
  FomoV2MarketPerformanceQuote,
  FomoV2MarketProjectHistory,
  FomoV2MarketProjectPerformance,
  FomoV2MarketProjectReadModel,
  FomoV2ProjectMarketSnapshot,
} from "../models";

export type FomoV2MarketPerformancePeriod = "1h" | "24h" | "7d" | "30d" | "90d" | "1y";
export type FomoV2MarketPerformanceSource = "market_project_histories" | "project_market_snapshots";
export type FomoV2MarketPerformanceTier = MarketDataTier | "all";

export interface FomoV2MarketPerformanceTarget {
  marketAssetId: any;
  canonicalProjectId?: any;
  coingeckoId?: string;
  symbol?: string;
  tier?: MarketDataTier;
}

export interface FomoV2MarketPerformanceRecalculateOptions {
  dryRun?: boolean;
  periods?: FomoV2MarketPerformancePeriod[];
  quotes?: FomoV2MarketPerformanceQuote[];
}

export interface FomoV2MarketPerformanceTierRecalculateOptions extends FomoV2MarketPerformanceRecalculateOptions {
  tier?: FomoV2MarketPerformanceTier;
  limit?: number;
  offset?: number;
}

export interface FomoV2MarketPerformanceRecalculateResult {
  dryRun: boolean;
  requested: number;
  calculated: number;
  wouldUpsert: number;
  upserted: number;
  skipped: {
    invalidTarget: number;
    missingLatestPoint: number;
  };
  examples: any[];
}

interface ResolvedPerformanceTarget {
  marketAssetId: Types.ObjectId;
  canonicalProjectId?: Types.ObjectId;
  coingeckoId?: string;
  symbol?: string;
  tier?: MarketDataTier;
}

interface PerformancePoint {
  source: FomoV2MarketPerformanceSource;
  timestamp: Date;
  priceUsd: number;
  marketCapUsd?: number;
  volumeUsd?: number;
  btcPriceUsd?: number;
  ethPriceUsd?: number;
  solPriceUsd?: number;
}

const DEFAULT_PERIODS: FomoV2MarketPerformancePeriod[] = ["1h", "24h", "7d", "30d", "90d", "1y"];
const DEFAULT_QUOTES: FomoV2MarketPerformanceQuote[] = ["usd", "btc", "eth", "sol"];
const PERIOD_TO_FIELD: Record<FomoV2MarketPerformancePeriod, string> = {
  "1h": "change1h",
  "24h": "change24h",
  "7d": "change7d",
  "30d": "change30d",
  "90d": "change90d",
  "1y": "change1y",
};
const PERIOD_TO_MS: Record<FomoV2MarketPerformancePeriod, number> = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
  "1y": 365 * 24 * 60 * 60 * 1000,
};
const PERIOD_TOLERANCE_MS: Record<FomoV2MarketPerformancePeriod, number> = {
  "1h": 2 * 60 * 60 * 1000,
  "24h": 6 * 60 * 60 * 1000,
  "7d": 36 * 60 * 60 * 1000,
  "30d": 36 * 60 * 60 * 1000,
  "90d": 36 * 60 * 60 * 1000,
  "1y": 72 * 60 * 60 * 1000,
};
const REFERENCE_COINGECKO_IDS: Partial<Record<FomoV2MarketPerformanceQuote, string>> = {
  btc: "bitcoin",
  eth: "ethereum",
  sol: "solana",
};
const REFERENCE_MAX_STALENESS_MS = 48 * 60 * 60 * 1000;

@Injectable()
export class FomoV2MarketProjectPerformanceService {
  private readonly logger = new Logger(FomoV2MarketProjectPerformanceService.name);
  private readonly referenceAssetIdCache = new Map<FomoV2MarketPerformanceQuote, Promise<Types.ObjectId | undefined>>();
  private readonly referencePriceCache = new Map<string, Promise<number | null>>();

  constructor(
    @InjectModel(FomoV2MarketProjectPerformance.name)
    private readonly performanceModel: Model<FomoV2MarketProjectPerformance>,
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly readModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(FomoV2MarketProjectHistory.name)
    private readonly historyModel: Model<FomoV2MarketProjectHistory>,
    @InjectModel(FomoV2ProjectMarketSnapshot.name)
    private readonly snapshotModel: Model<FomoV2ProjectMarketSnapshot>,
  ) {}

  async recalculateByTier(
    options: FomoV2MarketPerformanceTierRecalculateOptions = {},
  ): Promise<FomoV2MarketPerformanceRecalculateResult> {
    const limit = this.positiveInteger(options.limit, 100);
    const offset = this.nonNegativeInteger(options.offset, 0);
    const tier = options.tier || "HOT";
    const query: Record<string, any> = {
      trading: "CURRENTLY_TRADING",
      status: "active",
      marketAssetId: { $exists: true },
    };

    if (tier !== "all") query.tier = tier;

    const rows = await this.readModel
      .find(query)
      .sort({ rank: 1, _id: 1 })
      .skip(offset)
      .limit(limit)
      .select("canonicalProjectId marketAssetId providerIds symbol tier")
      .lean();
    const targets = (rows as any[]).map((row) => ({
      canonicalProjectId: row.canonicalProjectId,
      marketAssetId: row.marketAssetId,
      coingeckoId: row.providerIds?.coingeckoId,
      symbol: row.symbol,
      tier: row.tier,
    }));

    return this.recalculateForMarketAssets(targets, options);
  }

  async recalculateForMarketAssets(
    targets: FomoV2MarketPerformanceTarget[],
    options: FomoV2MarketPerformanceRecalculateOptions = {},
  ): Promise<FomoV2MarketPerformanceRecalculateResult> {
    const dryRun = options.dryRun === true;
    const periods = this.uniquePeriods(options.periods?.length ? options.periods : DEFAULT_PERIODS);
    const quotes = this.uniqueQuotes(options.quotes?.length ? options.quotes : DEFAULT_QUOTES);
    const result: FomoV2MarketPerformanceRecalculateResult = {
      dryRun,
      requested: targets.length,
      calculated: 0,
      wouldUpsert: 0,
      upserted: 0,
      skipped: {
        invalidTarget: 0,
        missingLatestPoint: 0,
      },
      examples: [],
    };
    const operations: any[] = [];

    for (const target of this.dedupeTargets(targets)) {
      const resolvedTarget = await this.resolveTarget(target);
      if (!resolvedTarget) {
        result.skipped.invalidTarget += 1;
        continue;
      }

      const latest = await this.loadLatestPoint(resolvedTarget.marketAssetId);
      if (!latest) {
        result.skipped.missingLatestPoint += 1;
        this.pushExample(result.examples, this.example(resolvedTarget, { reason: "missing_latest_point" }));
        continue;
      }

      const calculation = await this.calculatePerformance(resolvedTarget, latest, periods, quotes);
      const allTimePriceChange = this.buildAllTimePriceChange(calculation.performance);
      const now = new Date();
      const set = this.cleanObject({
        canonicalProjectId: resolvedTarget.canonicalProjectId,
        marketAssetId: resolvedTarget.marketAssetId,
        coingeckoId: resolvedTarget.coingeckoId,
        symbol: resolvedTarget.symbol,
        tier: resolvedTarget.tier,
        anchorTimestamp: latest.timestamp,
        calculatedAt: now,
        source: latest.source,
        provider: "coingecko",
        version: 1,
        performance: calculation.performance,
        allTimePriceChange,
        missing: calculation.missing,
        meta: {
          periods,
          quotes,
          anchorSource: latest.source,
          anchorTimestamp: latest.timestamp,
          periodAnchors: calculation.meta,
        },
        updatedAt: now,
      });

      result.calculated += 1;
      result.wouldUpsert += 1;
      this.pushExample(
        result.examples,
        this.example(resolvedTarget, {
          anchorTimestamp: latest.timestamp.toISOString(),
          performance: calculation.performance,
        }),
      );
      operations.push({
        updateOne: {
          filter: { marketAssetId: resolvedTarget.marketAssetId },
          update: {
            $set: set,
            $setOnInsert: { createdAt: now },
          },
          upsert: true,
        },
      });
    }

    if (!dryRun && operations.length) {
      result.upserted = await this.bulkWrite(operations);
    }

    return result;
  }

  buildAllTimePriceChange(performance: any = {}): any {
    const value = (quote: FomoV2MarketPerformanceQuote, field: string): number | null => {
      const rawValue = performance?.[quote]?.[field];
      if (rawValue === null || rawValue === undefined || rawValue === "") return null;
      return this.nullIfUndefined(this.toFiniteNumber(rawValue));
    };
    const row = (field: string) => ({
      USD: value("usd", field),
      BTC: value("btc", field),
      ETH: value("eth", field),
      SOL: value("sol", field),
    });

    return {
      "1H": row("change1h"),
      "1D": row("change24h"),
      "1W": row("change7d"),
      "1M": row("change30d"),
      "3M": row("change90d"),
      "1Y": row("change1y"),
    };
  }

  private async calculatePerformance(
    target: ResolvedPerformanceTarget,
    latest: PerformancePoint,
    periods: FomoV2MarketPerformancePeriod[],
    quotes: FomoV2MarketPerformanceQuote[],
  ): Promise<{ performance: any; missing: any; meta: any }> {
    const performance: any = {};
    const missing: any = {};
    const meta: any = {};

    for (const quote of quotes) {
      performance[quote] = {};
      missing[quote] = {};
    }

    for (const period of periods) {
      const field = PERIOD_TO_FIELD[period];
      const targetTimestamp = new Date(latest.timestamp.getTime() - PERIOD_TO_MS[period]);
      const past = await this.loadPastPoint(target.marketAssetId, targetTimestamp, latest.timestamp, period);
      meta[period] = this.cleanObject({
        targetTimestamp,
        actualPastTimestamp: past?.timestamp,
        actualPastSource: past?.source,
        toleranceMs: PERIOD_TOLERANCE_MS[period],
      });

      if (!past) {
        for (const quote of quotes) {
          performance[quote][field] = null;
          missing[quote][field] = "missing_past_point";
        }
        continue;
      }

      for (const quote of quotes) {
        const change = await this.calculateQuoteChange(target, latest, past, quote);
        if (change === null) {
          performance[quote][field] = null;
          missing[quote][field] = quote === "usd" ? "missing_usd_price" : `missing_${quote}_reference_price`;
          continue;
        }

        performance[quote][field] = change;
      }
    }

    return {
      performance: this.removeEmptyQuoteObjects(performance),
      missing: this.removeEmptyQuoteObjects(missing),
      meta,
    };
  }

  private async calculateQuoteChange(
    target: ResolvedPerformanceTarget,
    latest: PerformancePoint,
    past: PerformancePoint,
    quote: FomoV2MarketPerformanceQuote,
  ): Promise<number | null> {
    const latestBase = await this.quotePrice(target, latest, quote);
    const pastBase = await this.quotePrice(target, past, quote);
    if (latestBase === null || pastBase === null || pastBase <= 0) return null;
    return this.roundPercent(((latestBase - pastBase) / pastBase) * 100);
  }

  private async quotePrice(
    target: ResolvedPerformanceTarget,
    point: PerformancePoint,
    quote: FomoV2MarketPerformanceQuote,
  ): Promise<number | null> {
    if (quote === "usd") return point.priceUsd;

    const referenceCoinGeckoId = REFERENCE_COINGECKO_IDS[quote];
    if (referenceCoinGeckoId && target.coingeckoId === referenceCoinGeckoId) return 1;

    const directReference = quote === "btc"
      ? point.btcPriceUsd
      : quote === "eth"
        ? point.ethPriceUsd
        : point.solPriceUsd;
    const referenceUsd = this.toFinitePositiveNumber(directReference)
      ?? await this.loadReferencePriceUsd(quote, point.timestamp);
    if (referenceUsd === null || referenceUsd <= 0) return null;

    return point.priceUsd / referenceUsd;
  }

  private async loadLatestPoint(marketAssetId: Types.ObjectId): Promise<PerformancePoint | null> {
    const [history, snapshot] = await Promise.all([
      this.historyModel
        .findOne({
          marketAssetId,
          source: "coingecko",
          price: { $gt: 0 },
          bucketTimestamp: { $type: "date" },
        })
        .sort({ bucketTimestamp: -1 })
        .lean(),
      this.snapshotModel
        .findOne({
          marketAssetId,
          provider: "coingecko",
          priceUsd: { $gt: 0 },
        })
        .sort({ timestamp: -1 })
        .lean(),
    ]);
    return this.pickLatestPoint([
      this.historyToPoint(history),
      this.snapshotToPoint(snapshot),
    ]);
  }

  private async loadPastPoint(
    marketAssetId: Types.ObjectId,
    targetTimestamp: Date,
    latestTimestamp: Date,
    period: FomoV2MarketPerformancePeriod | "reference",
  ): Promise<PerformancePoint | null> {
    const [history, snapshot] = await Promise.all([
      this.historyModel
        .findOne({
          marketAssetId,
          source: "coingecko",
          price: { $gt: 0 },
          bucketTimestamp: { $lte: targetTimestamp, $lt: latestTimestamp },
        })
        .sort({ bucketTimestamp: -1 })
        .lean(),
      this.snapshotModel
        .findOne({
          marketAssetId,
          provider: "coingecko",
          priceUsd: { $gt: 0 },
          timestamp: { $lte: targetTimestamp, $lt: latestTimestamp },
        })
        .sort({ timestamp: -1 })
        .lean(),
    ]);
    const point = this.pickLatestPoint([
      this.historyToPoint(history),
      this.snapshotToPoint(snapshot),
    ]);
    if (!point) return null;

    const toleranceMs = period === "reference" ? REFERENCE_MAX_STALENESS_MS : PERIOD_TOLERANCE_MS[period];
    const deltaMs = targetTimestamp.getTime() - point.timestamp.getTime();
    if (deltaMs < 0 || deltaMs > toleranceMs) return null;
    return point;
  }

  private async loadReferencePriceUsd(
    quote: FomoV2MarketPerformanceQuote,
    timestamp: Date,
  ): Promise<number | null> {
    const cacheKey = `${quote}:${Math.floor(timestamp.getTime() / 60_000)}`;
    if (!this.referencePriceCache.has(cacheKey)) {
      this.referencePriceCache.set(cacheKey, this.loadReferencePriceUsdUncached(quote, timestamp));
    }
    return this.referencePriceCache.get(cacheKey)!;
  }

  private async loadReferencePriceUsdUncached(
    quote: FomoV2MarketPerformanceQuote,
    timestamp: Date,
  ): Promise<number | null> {
    const marketAssetId = await this.loadReferenceMarketAssetId(quote);
    if (!marketAssetId) return null;

    const point = await this.loadPastPoint(
      marketAssetId,
      timestamp,
      new Date(timestamp.getTime() + 1),
      "reference",
    );
    return point?.priceUsd ?? null;
  }

  private async loadReferenceMarketAssetId(
    quote: FomoV2MarketPerformanceQuote,
  ): Promise<Types.ObjectId | undefined> {
    const coingeckoId = REFERENCE_COINGECKO_IDS[quote];
    if (!coingeckoId) return undefined;
    if (!this.referenceAssetIdCache.has(quote)) {
      this.referenceAssetIdCache.set(
        quote,
        this.readModel
          .findOne({
            "providerIds.coingeckoId": coingeckoId,
            trading: "CURRENTLY_TRADING",
            status: "active",
          })
          .select("marketAssetId")
          .lean()
          .then((row: any) => this.toObjectId(row?.marketAssetId)),
      );
    }
    return this.referenceAssetIdCache.get(quote)!;
  }

  private async resolveTarget(target: FomoV2MarketPerformanceTarget): Promise<ResolvedPerformanceTarget | null> {
    const marketAssetId = this.toObjectId(target.marketAssetId);
    if (!marketAssetId) return null;

    if (target.coingeckoId && target.symbol && target.tier) {
      return {
        marketAssetId,
        canonicalProjectId: this.toObjectId(target.canonicalProjectId),
        coingeckoId: this.normalizeCoinGeckoId(target.coingeckoId),
        symbol: target.symbol,
        tier: target.tier,
      };
    }

    const row = await this.readModel
      .findOne({ marketAssetId })
      .select("canonicalProjectId marketAssetId providerIds symbol tier")
      .lean();

    return {
      marketAssetId,
      canonicalProjectId: this.toObjectId(target.canonicalProjectId) || this.toObjectId(row?.canonicalProjectId),
      coingeckoId: this.normalizeCoinGeckoId(target.coingeckoId || row?.providerIds?.coingeckoId),
      symbol: target.symbol || row?.symbol,
      tier: target.tier || row?.tier,
    };
  }

  private historyToPoint(row: any): PerformancePoint | null {
    const timestamp = this.toDate(row?.bucketTimestamp || row?.timestamp);
    const priceUsd = this.toFinitePositiveNumber(row?.price);
    if (!timestamp || priceUsd === null) return null;

    return this.cleanObject({
      source: "market_project_histories" as const,
      timestamp,
      priceUsd,
      marketCapUsd: this.toFiniteNumber(row?.marketCap),
      volumeUsd: this.toFiniteNumber(row?.volume24h),
      btcPriceUsd: this.toFinitePositiveNumber(row?.btcPriceUsd) ?? undefined,
      ethPriceUsd: this.toFinitePositiveNumber(row?.ethPriceUsd) ?? undefined,
      solPriceUsd: this.toFinitePositiveNumber(row?.solPriceUsd) ?? undefined,
    }) as PerformancePoint;
  }

  private snapshotToPoint(row: any): PerformancePoint | null {
    const timestamp = this.toDate(row?.timestamp);
    const priceUsd = this.toFinitePositiveNumber(row?.priceUsd);
    if (!timestamp || priceUsd === null) return null;

    return this.cleanObject({
      source: "project_market_snapshots" as const,
      timestamp,
      priceUsd,
      marketCapUsd: this.toFiniteNumber(row?.marketCapUsd),
      volumeUsd: this.toFiniteNumber(row?.volumeUsd),
      btcPriceUsd: this.toFinitePositiveNumber(row?.btcPriceUsd) ?? undefined,
      ethPriceUsd: this.toFinitePositiveNumber(row?.ethPriceUsd) ?? undefined,
    }) as PerformancePoint;
  }

  private pickLatestPoint(points: Array<PerformancePoint | null>): PerformancePoint | null {
    const validPoints = points.filter((point): point is PerformancePoint => Boolean(point));
    if (!validPoints.length) return null;
    return validPoints.sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime())[0];
  }

  private async bulkWrite(operations: any[]): Promise<number> {
    let changed = 0;
    for (const chunk of this.chunk(operations, 500)) {
      const result = await this.performanceModel.bulkWrite(chunk, { ordered: false });
      changed += Number((result as any).modifiedCount || 0) + Number((result as any).upsertedCount || 0);
    }
    return changed;
  }

  private dedupeTargets(targets: FomoV2MarketPerformanceTarget[]): FomoV2MarketPerformanceTarget[] {
    const byAsset = new Map<string, FomoV2MarketPerformanceTarget>();
    for (const target of targets || []) {
      const key = this.toIdString(target.marketAssetId);
      if (!key) continue;
      byAsset.set(key, target);
    }
    return Array.from(byAsset.values());
  }

  private uniquePeriods(values: FomoV2MarketPerformancePeriod[]): FomoV2MarketPerformancePeriod[] {
    const allowed = new Set(DEFAULT_PERIODS);
    const seen = new Set<string>();
    const result: FomoV2MarketPerformancePeriod[] = [];
    for (const value of values) {
      if (!allowed.has(value) || seen.has(value)) continue;
      seen.add(value);
      result.push(value);
    }
    return result.length ? result : DEFAULT_PERIODS;
  }

  private uniqueQuotes(values: FomoV2MarketPerformanceQuote[]): FomoV2MarketPerformanceQuote[] {
    const allowed = new Set(DEFAULT_QUOTES);
    const seen = new Set<string>();
    const result: FomoV2MarketPerformanceQuote[] = [];
    for (const value of values) {
      if (!allowed.has(value) || seen.has(value)) continue;
      seen.add(value);
      result.push(value);
    }
    return result.length ? result : DEFAULT_QUOTES;
  }

  private removeEmptyQuoteObjects(source: any): any {
    const result: any = {};
    for (const [quote, values] of Object.entries(source || {})) {
      if (values && Object.keys(values as any).length) result[quote] = values;
    }
    return result;
  }

  private example(target: ResolvedPerformanceTarget, extra: Record<string, any>): any {
    return this.cleanObject({
      marketAssetId: this.toIdString(target.marketAssetId),
      canonicalProjectId: this.toIdString(target.canonicalProjectId),
      coingeckoId: target.coingeckoId,
      symbol: target.symbol,
      tier: target.tier,
      ...extra,
    });
  }

  private pushExample(target: any[], item: any): void {
    if (target.length < 10) target.push(item);
  }

  private normalizeCoinGeckoId(value: any): string | undefined {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized || undefined;
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value;
    if (value instanceof mongoose.Types.ObjectId) return new Types.ObjectId(value.toHexString());
    const id = String(value?._id || value || "").trim();
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined;
  }

  private toIdString(value: any): string | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value.toHexString();
    if (value instanceof mongoose.Types.ObjectId) return value.toHexString();
    if (value._id) return this.toIdString(value._id);
    return String(value);
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : undefined;
  }

  private toFiniteNumber(value: any): number | undefined {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  private toFinitePositiveNumber(value: any): number | null {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  }

  private nullIfUndefined(value: any): any {
    return value === undefined ? null : value;
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
  }

  private nonNegativeInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
  }

  private roundPercent(value: number): number {
    return Math.round(value * 1_000_000) / 1_000_000;
  }

  private chunk<T>(items: T[], size: number): T[][] {
    if (!items.length) return [];
    return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
      items.slice(index * size, index * size + size),
    );
  }

  private cleanObject<T extends Record<string, any>>(source: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(source || {}).filter(([, value]) => value !== undefined),
    ) as Partial<T>;
  }
}
