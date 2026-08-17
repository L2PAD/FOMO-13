import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { MarketDataTier } from "src/coingecko/coingecko-market.types";
import {
  FomoV2MarketPerformanceQuote,
  FomoV2MarketProjectReadModel,
  FomoV2ProjectMarketSnapshot,
} from "../models";

export type FomoV2ProjectPerformanceSyncTier = MarketDataTier | "all";
export type FomoV2ProjectPerformancePeriod = "1h" | "24h" | "7d" | "30d" | "90d";
export type FomoV2ProjectPerformanceQuote = FomoV2MarketPerformanceQuote;

export interface FomoV2ProjectPerformanceSyncOptions {
  dryRun?: boolean;
  tier?: FomoV2ProjectPerformanceSyncTier;
  limit?: number;
  offset?: number;
  periods?: FomoV2ProjectPerformancePeriod[];
  quotes?: FomoV2ProjectPerformanceQuote[];
}

export interface FomoV2ProjectPerformanceSyncResult {
  dryRun: boolean;
  tier: FomoV2ProjectPerformanceSyncTier;
  limit: number;
  offset: number;
  periods: FomoV2ProjectPerformancePeriod[];
  quotes: FomoV2ProjectPerformanceQuote[];
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  scanned: number;
  wouldUpdate: number;
  updated: number;
  missingLatestSnapshot: number;
  missingPastSnapshot: Record<FomoV2ProjectPerformancePeriod, number>;
  missingReferencePrice: Record<"btc" | "eth", number>;
  coverage: Record<FomoV2ProjectPerformancePeriod, Record<FomoV2ProjectPerformanceQuote, number>>;
  examples: any[];
}

interface PerformanceCandidate {
  _id: any;
  canonicalProjectId?: any;
  marketAssetId: any;
  providerIds?: {
    coingeckoId?: string;
  };
  rank?: number;
  tier?: MarketDataTier;
  name?: string;
  symbol?: string;
  performance?: any;
  performanceMissing?: any;
  performanceMeta?: any;
  performanceSource?: string;
  performanceProvider?: string;
  usdQuote?: any;
  priceChange?: number | null;
}

interface SnapshotRow {
  canonicalProjectId?: any;
  marketAssetId: any;
  provider: "coingecko";
  providerAssetId?: string;
  coingeckoId?: string;
  timestamp: Date;
  priceUsd?: number;
  marketCapUsd?: number;
  volumeUsd?: number;
  btcPriceUsd?: number;
  ethPriceUsd?: number;
}

const DEFAULT_PERIODS: FomoV2ProjectPerformancePeriod[] = ["1h", "24h", "7d", "30d", "90d"];
const DEFAULT_QUOTES: FomoV2ProjectPerformanceQuote[] = ["usd", "btc", "eth"];
const PERIOD_TO_FIELD: Record<FomoV2ProjectPerformancePeriod, string> = {
  "1h": "change1h",
  "24h": "change24h",
  "7d": "change7d",
  "30d": "change30d",
  "90d": "change90d",
};
const PERIOD_TO_MS: Record<FomoV2ProjectPerformancePeriod, number> = {
  "1h": 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
};
const PERIOD_TOLERANCE_MS: Record<FomoV2ProjectPerformancePeriod, number> = {
  "1h": 2 * 60 * 60 * 1000,
  "24h": 6 * 60 * 60 * 1000,
  "7d": 36 * 60 * 60 * 1000,
  "30d": 36 * 60 * 60 * 1000,
  "90d": 36 * 60 * 60 * 1000,
};

@Injectable()
export class FomoV2ProjectPerformanceSyncService {
  private readonly logger = new Logger(FomoV2ProjectPerformanceSyncService.name);

  constructor(
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly readModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(FomoV2ProjectMarketSnapshot.name)
    private readonly snapshotModel: Model<FomoV2ProjectMarketSnapshot>,
  ) {}

  async sync(options: FomoV2ProjectPerformanceSyncOptions = {}): Promise<FomoV2ProjectPerformanceSyncResult> {
    const startedAt = new Date();
    const startedMs = Date.now();
    const dryRun = options.dryRun !== false;
    const tier = options.tier || "HOT";
    const limit = this.positiveInteger(options.limit, 100);
    const offset = this.nonNegativeInteger(options.offset, 0);
    const periods = this.uniquePeriods(options.periods?.length ? options.periods : DEFAULT_PERIODS);
    const quotes = this.uniqueQuotes(options.quotes?.length ? options.quotes : DEFAULT_QUOTES);
    const result = this.emptyResult({ dryRun, tier, limit, offset, periods, quotes, startedAt });

    const candidates = await this.loadCandidates({ tier, limit, offset });
    result.scanned = candidates.length;

    const operations: any[] = [];
    for (const candidate of candidates) {
      const latest = await this.loadLatestSnapshot(candidate.marketAssetId);

      if (!latest) {
        result.missingLatestSnapshot += 1;
        this.pushExample(result.examples, this.example(candidate, { reason: "missing_latest_snapshot" }));
        continue;
      }

      const calculation = await this.calculateCandidatePerformance(candidate, latest, periods, quotes, result, startedAt);
      const updateSet = this.buildUpdateSet(candidate, calculation.performance, calculation.missing, latest, quotes);
      if (!updateSet) continue;

      result.wouldUpdate += 1;
      this.pushExample(
        result.examples,
        this.example(candidate, {
          latestSnapshotAt: latest.timestamp?.toISOString?.(),
          performance: calculation.performance,
          missing: calculation.missing,
        }),
      );

      operations.push({
        updateOne: {
          filter: { _id: candidate._id },
          update: { $set: updateSet },
        },
      });
    }

    if (!dryRun && operations.length) {
      result.updated = await this.bulkWriteReadModels(operations);
    }

    return this.finishResult(result, startedMs);
  }

  private async loadCandidates(options: {
    tier: FomoV2ProjectPerformanceSyncTier;
    limit: number;
    offset: number;
  }): Promise<PerformanceCandidate[]> {
    const query: Record<string, any> = {
      trading: "CURRENTLY_TRADING",
      status: "active",
      marketAssetId: { $exists: true },
    };

    if (options.tier !== "all") {
      query.tier = options.tier;
    }

    return this.readModel
      .find(query)
      .sort({ rank: 1, _id: 1 })
      .skip(options.offset)
      .limit(options.limit)
      .select("_id canonicalProjectId marketAssetId providerIds rank tier name symbol performance performanceMissing performanceMeta performanceSource performanceProvider usdQuote priceChange")
      .lean();
  }

  private async loadLatestSnapshot(marketAssetId: any): Promise<SnapshotRow | null> {
    const row = await this.snapshotModel
      .findOne({
        marketAssetId,
        provider: "coingecko",
        priceUsd: { $gt: 0 },
      })
      .sort({ timestamp: -1 })
      .select("canonicalProjectId marketAssetId provider providerAssetId coingeckoId timestamp priceUsd marketCapUsd volumeUsd btcPriceUsd ethPriceUsd")
      .lean()
      .exec();

    return row as SnapshotRow | null;
  }

  private async loadPastSnapshot(
    marketAssetId: any,
    targetTimestamp: Date,
    latestTimestamp: Date,
  ): Promise<SnapshotRow | null> {
    const row = await this.snapshotModel
      .findOne({
        marketAssetId,
        provider: "coingecko",
        timestamp: { $lte: targetTimestamp, $lt: latestTimestamp },
        priceUsd: { $gt: 0 },
      })
      .sort({ timestamp: -1 })
      .select("canonicalProjectId marketAssetId provider providerAssetId coingeckoId timestamp priceUsd marketCapUsd volumeUsd btcPriceUsd ethPriceUsd")
      .lean()
      .exec();

    return row as SnapshotRow | null;
  }

  private async calculateCandidatePerformance(
    candidate: PerformanceCandidate,
    latest: SnapshotRow,
    periods: FomoV2ProjectPerformancePeriod[],
    quotes: FomoV2ProjectPerformanceQuote[],
    result: FomoV2ProjectPerformanceSyncResult,
    now: Date,
  ): Promise<{ performance: any; missing: any }> {
    const performance: any = {};
    const missing: any = {};
    const anchorMs = now.getTime();

    if (!Number.isFinite(anchorMs)) {
      for (const quote of quotes) {
        performance[quote] = {};
        missing[quote] = {};
        for (const period of periods) {
          const field = PERIOD_TO_FIELD[period];
          performance[quote][field] = null;
          missing[quote][field] = "invalid_latest_timestamp";
        }
      }
      return {
        performance: this.removeEmptyQuoteObjects(performance),
        missing: this.removeEmptyQuoteObjects(missing),
      };
    }

    for (const quote of quotes) {
      performance[quote] = {};
      missing[quote] = {};
    }

    for (const period of periods) {
      const field = PERIOD_TO_FIELD[period];
      const targetTimestamp = new Date(anchorMs - PERIOD_TO_MS[period]);
      const past = await this.loadPastSnapshot(candidate.marketAssetId, targetTimestamp, latest.timestamp);

      if (!past || !this.isPastSnapshotWithinTolerance(past, targetTimestamp, period)) {
        result.missingPastSnapshot[period] += 1;
        for (const quote of quotes) {
          performance[quote][field] = null;
          missing[quote][field] = past ? "past_snapshot_outside_tolerance" : "missing_past_snapshot";
        }
        continue;
      }

      for (const quote of quotes) {
        const change = this.calculateQuoteChange(latest, past, quote);

        if (change === null) {
          performance[quote][field] = null;
          const reason = quote === "usd" ? "missing_usd_price" : `missing_${quote}_reference_price`;
          missing[quote][field] = reason;
          if (quote === "btc" || quote === "eth") {
            result.missingReferencePrice[quote] += 1;
          }
          continue;
        }

        performance[quote][field] = change;
        result.coverage[period][quote] += 1;
      }
    }

    return {
      performance: this.removeEmptyQuoteObjects(performance),
      missing: this.removeEmptyQuoteObjects(missing),
    };
  }

  private calculateQuoteChange(
    latest: SnapshotRow,
    past: SnapshotRow,
    quote: FomoV2ProjectPerformanceQuote,
  ): number | null {
    const latestBase = this.quotePrice(latest, quote);
    const pastBase = this.quotePrice(past, quote);
    if (latestBase === null || pastBase === null || pastBase <= 0) return null;
    return this.roundPercent(((latestBase - pastBase) / pastBase) * 100);
  }

  private quotePrice(snapshot: SnapshotRow, quote: FomoV2ProjectPerformanceQuote): number | null {
    const priceUsd = this.toFinitePositiveNumber(snapshot.priceUsd);
    if (priceUsd === null) return null;
    if (quote === "usd") return priceUsd;

    const referenceUsd = quote === "btc"
      ? this.toFinitePositiveNumber(snapshot.btcPriceUsd)
      : this.toFinitePositiveNumber(snapshot.ethPriceUsd);
    if (referenceUsd === null) return null;

    return priceUsd / referenceUsd;
  }

  private isPastSnapshotWithinTolerance(
    snapshot: SnapshotRow,
    targetTimestamp: Date,
    period: FomoV2ProjectPerformancePeriod,
  ): boolean {
    const snapshotMs = Number(snapshot.timestamp?.getTime?.());
    const targetMs = targetTimestamp.getTime();
    if (!Number.isFinite(snapshotMs) || snapshotMs > targetMs) return false;
    return targetMs - snapshotMs <= PERIOD_TOLERANCE_MS[period];
  }

  private buildUpdateSet(
    candidate: PerformanceCandidate,
    performance: any,
    missing: any,
    latest: SnapshotRow,
    quotes: FomoV2ProjectPerformanceQuote[],
  ): Record<string, any> | null {
    const now = new Date();
    const set: Record<string, any> = {};

    for (const quote of quotes) {
      set[`performance.${quote}`] = performance[quote] || {};
      set[`performanceMissing.${quote}`] = missing[quote] || {};
    }

    set.performanceUpdatedAt = now;
    set.performanceSource = "project_market_snapshots";
    set.performanceProvider = "coingecko";

    if (quotes.includes("usd")) {
      const usd = performance.usd || {};
      set["usdQuote.percent_change_1h"] = this.nullIfUndefined(usd.change1h);
      set["usdQuote.percent_change_24h"] = this.nullIfUndefined(usd.change24h);
      set["usdQuote.percent_change_7d"] = this.nullIfUndefined(usd.change7d);
      set.priceChange = this.nullIfUndefined(usd.change24h);
    }

    if (latest.timestamp) {
      set["performanceMeta.latestSnapshotAt"] = latest.timestamp;
      set["performanceMeta.anchorTimestamp"] = latest.timestamp;
      set["performanceMeta.providerAssetId"] = latest.providerAssetId || latest.coingeckoId;
    }

    return this.hasMeaningfulChanges(candidate, set) ? set : null;
  }

  private hasMeaningfulChanges(candidate: PerformanceCandidate, set: Record<string, any>): boolean {
    for (const [path, value] of Object.entries(set)) {
      if (path === "performanceUpdatedAt") continue;
      const current = this.getPath(candidate, path);
      if (!this.valuesEqual(current, value)) return true;
    }
    return false;
  }

  private async bulkWriteReadModels(operations: any[]): Promise<number> {
    let updated = 0;
    for (const chunk of this.chunk(operations, 500)) {
      const result = await this.readModel.bulkWrite(chunk, { ordered: false });
      updated += Number((result as any).modifiedCount || 0);
    }
    return updated;
  }

  private emptyResult(params: {
    dryRun: boolean;
    tier: FomoV2ProjectPerformanceSyncTier;
    limit: number;
    offset: number;
    periods: FomoV2ProjectPerformancePeriod[];
    quotes: FomoV2ProjectPerformanceQuote[];
    startedAt: Date;
  }): FomoV2ProjectPerformanceSyncResult {
    const missingPastSnapshot = {} as Record<FomoV2ProjectPerformancePeriod, number>;
    const coverage = {} as Record<FomoV2ProjectPerformancePeriod, Record<FomoV2ProjectPerformanceQuote, number>>;
    for (const period of params.periods) {
      missingPastSnapshot[period] = 0;
      coverage[period] = {} as Record<FomoV2ProjectPerformanceQuote, number>;
      for (const quote of params.quotes) {
        coverage[period][quote] = 0;
      }
    }

    return {
      dryRun: params.dryRun,
      tier: params.tier,
      limit: params.limit,
      offset: params.offset,
      periods: params.periods,
      quotes: params.quotes,
      startedAt: params.startedAt.toISOString(),
      finishedAt: "",
      durationMs: 0,
      scanned: 0,
      wouldUpdate: 0,
      updated: 0,
      missingLatestSnapshot: 0,
      missingPastSnapshot,
      missingReferencePrice: { btc: 0, eth: 0 },
      coverage,
      examples: [],
    };
  }

  private finishResult(
    result: FomoV2ProjectPerformanceSyncResult,
    startedMs: number,
  ): FomoV2ProjectPerformanceSyncResult {
    result.finishedAt = new Date().toISOString();
    result.durationMs = Date.now() - startedMs;
    return result;
  }

  private uniquePeriods(values: FomoV2ProjectPerformancePeriod[]): FomoV2ProjectPerformancePeriod[] {
    const allowed = new Set(DEFAULT_PERIODS);
    const seen = new Set<string>();
    const result: FomoV2ProjectPerformancePeriod[] = [];
    for (const value of values) {
      if (!allowed.has(value) || seen.has(value)) continue;
      seen.add(value);
      result.push(value);
    }
    return result.length ? result : DEFAULT_PERIODS;
  }

  private uniqueQuotes(values: FomoV2ProjectPerformanceQuote[]): FomoV2ProjectPerformanceQuote[] {
    const allowed = new Set(DEFAULT_QUOTES);
    const seen = new Set<string>();
    const result: FomoV2ProjectPerformanceQuote[] = [];
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

  private valuesEqual(left: any, right: any): boolean {
    if (this.isEmptyObject(left) && (right === undefined || right === null)) return true;
    if (this.isEmptyObject(right) && (left === undefined || left === null)) return true;

    if (typeof left === "number" || typeof right === "number") {
      const leftNumber = Number(left);
      const rightNumber = Number(right);
      if (!Number.isFinite(leftNumber) && !Number.isFinite(rightNumber)) return true;
      return Math.abs(leftNumber - rightNumber) < 0.000001;
    }

    if (left instanceof Date || right instanceof Date) {
      const leftMs = left instanceof Date ? left.getTime() : new Date(left).getTime();
      const rightMs = right instanceof Date ? right.getTime() : new Date(right).getTime();
      return leftMs === rightMs;
    }

    return JSON.stringify(left ?? null) === JSON.stringify(right ?? null);
  }

  private isEmptyObject(value: any): boolean {
    return Boolean(
      value &&
      typeof value === "object" &&
      !(value instanceof Date) &&
      !Array.isArray(value) &&
      Object.keys(value).length === 0,
    );
  }

  private nullIfUndefined(value: any): any {
    return value === undefined ? null : value;
  }

  private getPath(source: any, path: string): any {
    return path.split(".").reduce((acc, key) => (acc === undefined || acc === null ? undefined : acc[key]), source);
  }

  private example(candidate: PerformanceCandidate, extra: Record<string, any>): any {
    return {
      marketAssetId: this.toIdString(candidate.marketAssetId),
      canonicalProjectId: this.toIdString(candidate.canonicalProjectId),
      coingeckoId: candidate.providerIds?.coingeckoId,
      name: candidate.name,
      symbol: candidate.symbol,
      ...extra,
    };
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

  private roundPercent(value: number): number {
    return Math.round(value * 1_000_000) / 1_000_000;
  }

  private toIdString(value: any): string | undefined {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    if (value instanceof mongoose.Types.ObjectId) return value.toHexString();
    if (value._id) return this.toIdString(value._id);
    return String(value);
  }

  private chunk<T>(items: T[], size: number): T[][] {
    if (!items.length) return [];
    return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
      items.slice(index * size, index * size + size),
    );
  }

  private pushExample(target: any[], item: any): void {
    if (target.length < 10) target.push(item);
  }
}
