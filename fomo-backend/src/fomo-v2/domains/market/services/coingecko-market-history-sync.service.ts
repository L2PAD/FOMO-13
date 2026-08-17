import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { CoinGeckoMarketChartDto, MarketDataTier } from "src/coingecko/coingecko-market.types";
import { CoinGeckoProClientService } from "src/coingecko/coingecko-pro-client.service";
import {
  FomoV2MarketProjectReadModel,
  FomoV2ProjectMarketSnapshot,
} from "../models";

export type FomoV2CoinGeckoMarketHistorySyncTier = MarketDataTier | "all";
export type FomoV2CoinGeckoMarketHistoryDays = number | "max";

export interface FomoV2CoinGeckoMarketHistorySyncOptions {
  dryRun?: boolean;
  tier?: FomoV2CoinGeckoMarketHistorySyncTier;
  limit?: number;
  offset?: number;
  days?: FomoV2CoinGeckoMarketHistoryDays;
  marketAssetId?: string;
  marketAssetIds?: string[];
  canonicalProjectId?: string;
  providerAssetId?: string;
  coingeckoId?: string;
  coingeckoIds?: string[];
  vsCurrency?: string;
  delayMs?: number;
  maxRetries?: number;
  progress?: FomoV2CoinGeckoMarketHistorySyncProgressHandler;
}

export type FomoV2CoinGeckoMarketHistorySyncProgressType =
  | "candidates-loaded"
  | "asset-processed"
  | "finished";

export interface FomoV2CoinGeckoMarketHistorySyncProgressEvent {
  type: FomoV2CoinGeckoMarketHistorySyncProgressType;
  tier: FomoV2CoinGeckoMarketHistorySyncTier;
  totalAssets: number;
  processedAssets: number;
  candidate?: {
    marketAssetId?: string;
    coingeckoId?: string;
    name?: string;
    symbol?: string;
  };
  result: FomoV2CoinGeckoMarketHistorySyncResult;
}

export type FomoV2CoinGeckoMarketHistorySyncProgressHandler =
  (event: FomoV2CoinGeckoMarketHistorySyncProgressEvent) => Promise<void> | void;

export interface FomoV2CoinGeckoMarketHistorySyncError {
  coingeckoId?: string;
  marketAssetId?: string;
  status?: number;
  message: string;
}

export interface FomoV2CoinGeckoMarketHistorySyncResult {
  dryRun: boolean;
  tier: FomoV2CoinGeckoMarketHistorySyncTier;
  days: FomoV2CoinGeckoMarketHistoryDays;
  vsCurrency: string;
  limit: number;
  offset: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  assetsScanned: number;
  historyRequests: number;
  snapshotsWouldWrite: number;
  snapshotsCreated: number;
  snapshotsUpdated: number;
  skippedNoCoingeckoId: number;
  rateLimitRetries: number;
  errorsCount: number;
  errors: FomoV2CoinGeckoMarketHistorySyncError[];
  warnings: string[];
}

interface HistorySyncCandidate {
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
}

interface HistoryWindow {
  days: FomoV2CoinGeckoMarketHistoryDays;
  fromUnixSeconds?: number;
  toUnixSeconds?: number;
}

interface ReferencePriceIndexes {
  btc: ReferencePricePoint[];
  eth: ReferencePricePoint[];
  historiesByCoinGeckoId: Map<string, CoinGeckoMarketChartDto>;
}

interface ReferencePricePoint {
  timestampMs: number;
  price: number;
}

interface SnapshotOperationBuildResult {
  operations: any[];
  snapshotsCount: number;
}

interface ReferenceHistoryCacheEntry {
  expiresAt: number;
  history: CoinGeckoMarketChartDto;
}

const DEFAULT_REFERENCE_HISTORY_CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_REFERENCE_HISTORY_CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_REFERENCE_HISTORY_CACHE_ENTRIES = 8;

@Injectable()
export class FomoV2CoinGeckoMarketHistorySyncService {
  private readonly logger = new Logger(FomoV2CoinGeckoMarketHistorySyncService.name);
  private readonly referenceIds = {
    btc: "bitcoin",
    eth: "ethereum",
  };
  private readonly referenceHistoryCache = new Map<string, ReferenceHistoryCacheEntry>();
  private readonly referenceHistoryInFlight = new Map<string, Promise<CoinGeckoMarketChartDto>>();

  constructor(
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly readModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(FomoV2ProjectMarketSnapshot.name)
    private readonly snapshotModel: Model<FomoV2ProjectMarketSnapshot>,
    private readonly configService: ConfigService,
    private readonly coinGeckoClient: CoinGeckoProClientService,
  ) {}

  async sync(
    options: FomoV2CoinGeckoMarketHistorySyncOptions = {},
  ): Promise<FomoV2CoinGeckoMarketHistorySyncResult> {
    const startedAt = new Date();
    const startedMs = Date.now();
    const dryRun = options.dryRun !== false;
    const tier = options.tier || "HOT";
    const limit = this.nonNegativeLimit(options.limit, 50);
    const offset = this.nonNegativeInteger(options.offset, 0);
    const vsCurrency = this.normalizeVsCurrency(options.vsCurrency);
    const warnings: string[] = [];
    const days = this.resolveDays(options.days, tier, warnings);
    const historyWindow = this.buildHistoryWindow(days, startedAt);
    const delayMs = this.nonNegativeInteger(
      options.delayMs,
      Number(
        this.configService.get("FOMO_V2_COINGECKO_HISTORY_SYNC_DELAY_MS") ||
        this.configService.get("COINGECKO_HISTORY_BACKFILL_DELAY_MS") ||
        1200,
      ),
    );
    const maxRetries = this.positiveInteger(options.maxRetries, 3);
    const result = this.emptyResult({
      dryRun,
      tier,
      days,
      vsCurrency,
      limit,
      offset,
      startedAt,
      startedMs,
      warnings,
    });

    if (vsCurrency !== "usd") {
      throw new Error("Only --vs_currency=usd is supported because ProjectMarketSnapshot stores USD fields.");
    }

    if (!this.coinGeckoClient.isConfigured()) {
      throw new Error("COINGECKO_KEY is not configured");
    }

    const candidates = await this.loadCandidates({ ...options, tier, limit, offset });
    result.assetsScanned = candidates.length;
    await this.emitProgress(options.progress, {
      type: "candidates-loaded",
      tier,
      totalAssets: candidates.length,
      processedAssets: 0,
      result,
    });
    if (!candidates.length) {
      const finished = this.finishResult(result, startedMs);
      await this.emitProgress(options.progress, {
        type: "finished",
        tier,
        totalAssets: candidates.length,
        processedAssets: 0,
        result: finished,
      });
      return finished;
    }

    const references = await this.fetchReferencePrices({
      historyWindow,
      vsCurrency,
      delayMs,
      maxRetries,
      result,
    });
    const fetchedReferenceHistories = new Map(references.historiesByCoinGeckoId);

    let processedAssets = 0;
    for (const candidate of candidates) {
      const coingeckoId = this.normalizeCoinGeckoId(
        candidate.providerIds?.coingeckoId || options.coingeckoId || options.providerAssetId,
      );
      if (!coingeckoId) {
        result.skippedNoCoingeckoId += 1;
        processedAssets += 1;
        await this.emitProgress(options.progress, {
          type: "asset-processed",
          tier,
          totalAssets: candidates.length,
          processedAssets,
          candidate: this.toProgressCandidate(candidate, coingeckoId),
          result,
        });
        continue;
      }

      try {
        let history = fetchedReferenceHistories.get(coingeckoId);
        if (!history) {
          history = await this.fetchHistoryWithRetry(coingeckoId, {
            historyWindow,
            vsCurrency,
            maxRetries,
            result,
          });
          if (coingeckoId === this.referenceIds.btc || coingeckoId === this.referenceIds.eth) {
            fetchedReferenceHistories.set(coingeckoId, history);
          }
        }

        const buildResult = this.buildSnapshotOperations(candidate, coingeckoId, history, references, days);
        result.snapshotsWouldWrite += buildResult.snapshotsCount;

        if (!dryRun && buildResult.operations.length) {
          const writeResult = await this.bulkWriteSnapshots(buildResult.operations);
          result.snapshotsCreated += writeResult.created;
          result.snapshotsUpdated += writeResult.updated;
        }
      } catch (error) {
        this.recordError(result, {
          coingeckoId,
          marketAssetId: this.toObjectIdString(candidate.marketAssetId),
          status: this.getHttpStatus(error),
          message: this.formatError(error),
        });
        this.logger.warn(
          `FOMO v2 CoinGecko history sync failed coingeckoId=${coingeckoId} error=${this.formatError(error)}`,
        );
      }

      processedAssets += 1;
      await this.emitProgress(options.progress, {
        type: "asset-processed",
        tier,
        totalAssets: candidates.length,
        processedAssets,
        candidate: this.toProgressCandidate(candidate, coingeckoId),
        result,
      });

      if (delayMs > 0) {
        await this.sleep(delayMs);
      }
    }

    const finished = this.finishResult(result, startedMs);
    await this.emitProgress(options.progress, {
      type: "finished",
      tier,
      totalAssets: candidates.length,
      processedAssets,
      result: finished,
    });
    return finished;
  }

  private toProgressCandidate(
    candidate: HistorySyncCandidate,
    coingeckoId?: string,
  ): FomoV2CoinGeckoMarketHistorySyncProgressEvent["candidate"] {
    return {
      marketAssetId: this.toObjectIdString(candidate.marketAssetId),
      coingeckoId,
      name: candidate.name,
      symbol: candidate.symbol,
    };
  }

  private async emitProgress(
    handler: FomoV2CoinGeckoMarketHistorySyncProgressHandler | undefined,
    event: FomoV2CoinGeckoMarketHistorySyncProgressEvent,
  ): Promise<void> {
    if (!handler) return;
    try {
      await handler(event);
    } catch (error) {
      this.logger.warn(`FOMO v2 CoinGecko history progress handler failed: ${this.formatError(error)}`);
    }
  }

  private async loadCandidates(options: FomoV2CoinGeckoMarketHistorySyncOptions & {
    tier: FomoV2CoinGeckoMarketHistorySyncTier;
    limit: number;
    offset: number;
  }): Promise<HistorySyncCandidate[]> {
    const query: Record<string, any> = {
      trading: "CURRENTLY_TRADING",
      status: "active",
    };
    const hasSpecificSelector = Boolean(
      options.marketAssetId ||
      options.marketAssetIds?.length ||
      options.canonicalProjectId ||
      options.providerAssetId ||
      options.coingeckoId ||
      options.coingeckoIds?.length,
    );

    if (options.tier !== "all") {
      query.tier = options.tier;
    } else if (!hasSpecificSelector) {
      query.rank = { $type: "number", $gt: 0 };
    }

    if (options.marketAssetId) {
      query.marketAssetId = this.parseObjectId(options.marketAssetId, "marketAssetId");
    }
    const marketAssetIds = this.parseObjectIdList(options.marketAssetIds, "marketAssetIds");
    if (marketAssetIds.length) {
      query.marketAssetId = { $in: marketAssetIds };
    }

    if (options.canonicalProjectId) {
      query.canonicalProjectId = this.parseObjectId(options.canonicalProjectId, "canonicalProjectId");
    }

    const providerAssetId = this.normalizeCoinGeckoId(options.providerAssetId || options.coingeckoId);
    const providerAssetIds = this.normalizeCoinGeckoIds(options.coingeckoIds);
    if (providerAssetId) {
      query["providerIds.coingeckoId"] = providerAssetId;
    } else if (providerAssetIds.length) {
      query["providerIds.coingeckoId"] = { $in: providerAssetIds };
    } else if (!hasSpecificSelector) {
      query["providerIds.coingeckoId"] = { $type: "string", $ne: "" };
    }

    return this.readModel
      .find(query)
      .sort({ rank: 1, _id: 1 })
      .skip(options.offset)
      .limit(options.limit)
      .select("_id canonicalProjectId marketAssetId providerIds rank tier name symbol")
      .lean();
  }

  private async fetchReferencePrices(options: {
    historyWindow: HistoryWindow;
    vsCurrency: string;
    delayMs: number;
    maxRetries: number;
    result: FomoV2CoinGeckoMarketHistorySyncResult;
  }): Promise<ReferencePriceIndexes> {
    const empty: ReferencePriceIndexes = { btc: [], eth: [], historiesByCoinGeckoId: new Map() };
    const refs: ReferencePriceIndexes = { ...empty };

    const btcRequestsBefore = options.result.historyRequests;
    try {
      const btcHistory = await this.fetchReferenceHistory(this.referenceIds.btc, options);
      refs.btc = this.toReferencePriceIndex(btcHistory);
      refs.historiesByCoinGeckoId.set(this.referenceIds.btc, btcHistory);
    } catch (error) {
      this.recordError(options.result, {
        coingeckoId: this.referenceIds.btc,
        status: this.getHttpStatus(error),
        message: this.formatError(error),
      });
    }

    if (options.delayMs > 0 && options.result.historyRequests > btcRequestsBefore) {
      await this.sleep(options.delayMs);
    }

    const ethRequestsBefore = options.result.historyRequests;
    try {
      const ethHistory = await this.fetchReferenceHistory(this.referenceIds.eth, options);
      refs.eth = this.toReferencePriceIndex(ethHistory);
      refs.historiesByCoinGeckoId.set(this.referenceIds.eth, ethHistory);
    } catch (error) {
      this.recordError(options.result, {
        coingeckoId: this.referenceIds.eth,
        status: this.getHttpStatus(error),
        message: this.formatError(error),
      });
    }

    if (options.delayMs > 0 && options.result.historyRequests > ethRequestsBefore) {
      await this.sleep(options.delayMs);
    }

    return refs;
  }

  private async fetchReferenceHistory(
    coingeckoId: string,
    options: {
      historyWindow: HistoryWindow;
      vsCurrency: string;
      maxRetries: number;
      result: FomoV2CoinGeckoMarketHistorySyncResult;
    },
  ): Promise<CoinGeckoMarketChartDto> {
    const cacheKey = this.referenceHistoryCacheKey(
      coingeckoId,
      options.historyWindow,
      options.vsCurrency,
    );
    const now = Date.now();
    const cached = this.referenceHistoryCache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.history;
    }
    if (cached) {
      this.referenceHistoryCache.delete(cacheKey);
    }

    const inFlight = this.referenceHistoryInFlight.get(cacheKey);
    if (inFlight) return inFlight;

    const request = this.fetchHistoryWithRetry(coingeckoId, options)
      .then((history) => {
        this.cacheReferenceHistory(cacheKey, history);
        return history;
      })
      .finally(() => {
        this.referenceHistoryInFlight.delete(cacheKey);
      });
    this.referenceHistoryInFlight.set(cacheKey, request);
    return request;
  }

  private referenceHistoryCacheKey(
    coingeckoId: string,
    historyWindow: HistoryWindow,
    vsCurrency: string,
  ): string {
    return [
      this.normalizeCoinGeckoId(coingeckoId),
      this.normalizeVsCurrency(vsCurrency),
      String(historyWindow.days),
    ].join(":");
  }

  private cacheReferenceHistory(cacheKey: string, history: CoinGeckoMarketChartDto): void {
    const ttlMs = this.referenceHistoryCacheTtlMs();
    if (ttlMs <= 0) return;

    const now = Date.now();
    for (const [key, entry] of this.referenceHistoryCache) {
      if (entry.expiresAt <= now) this.referenceHistoryCache.delete(key);
    }
    while (
      !this.referenceHistoryCache.has(cacheKey) &&
      this.referenceHistoryCache.size >= MAX_REFERENCE_HISTORY_CACHE_ENTRIES
    ) {
      const oldestKey = this.referenceHistoryCache.keys().next().value;
      if (!oldestKey) break;
      this.referenceHistoryCache.delete(oldestKey);
    }

    this.referenceHistoryCache.set(cacheKey, {
      expiresAt: now + ttlMs,
      history,
    });
  }

  private referenceHistoryCacheTtlMs(): number {
    const configured =
      this.configService.get("FOMO_V2_COINGECKO_HISTORY_REFERENCE_CACHE_TTL_MS") ??
      process.env.FOMO_V2_COINGECKO_HISTORY_REFERENCE_CACHE_TTL_MS;
    if (configured === undefined || configured === null || configured === "") {
      return DEFAULT_REFERENCE_HISTORY_CACHE_TTL_MS;
    }

    const parsed = Number(configured);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return DEFAULT_REFERENCE_HISTORY_CACHE_TTL_MS;
    }
    return Math.min(MAX_REFERENCE_HISTORY_CACHE_TTL_MS, Math.trunc(parsed));
  }

  private async fetchHistoryWithRetry(
    coingeckoId: string,
    options: {
      historyWindow: HistoryWindow;
      vsCurrency: string;
      maxRetries: number;
      result: FomoV2CoinGeckoMarketHistorySyncResult;
    },
  ): Promise<CoinGeckoMarketChartDto> {
    let lastError: any;
    const attempts = Math.max(1, options.maxRetries);

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        options.result.historyRequests += 1;
        return await this.fetchHistory(coingeckoId, options.historyWindow, options.vsCurrency);
      } catch (error) {
        lastError = error;
        const status = this.getHttpStatus(error);
        const canRetry = attempt < attempts && this.isRetryableProviderStatus(status);
        if (!canRetry) break;

        if (status === 429) {
          options.result.rateLimitRetries += 1;
        }

        await this.sleep(this.retryDelayMs(error, attempt));
      }
    }

    throw lastError;
  }

  private fetchHistory(
    coingeckoId: string,
    historyWindow: HistoryWindow,
    vsCurrency: string,
  ): Promise<CoinGeckoMarketChartDto> {
    if (historyWindow.days === "max") {
      return this.coinGeckoClient.fetchMarketChart(coingeckoId, "max", undefined, vsCurrency);
    }

    return this.coinGeckoClient.fetchMarketChartRange(
      coingeckoId,
      historyWindow.fromUnixSeconds || 0,
      historyWindow.toUnixSeconds || 0,
      vsCurrency,
    );
  }

  private buildSnapshotOperations(
    candidate: HistorySyncCandidate,
    coingeckoId: string,
    history: CoinGeckoMarketChartDto,
    references: ReferencePriceIndexes,
    days: FomoV2CoinGeckoMarketHistoryDays,
  ): SnapshotOperationBuildResult {
    const marketCapsByTimestamp = this.toValueMap(history.market_caps || []);
    const volumesByTimestamp = this.toValueMap(history.total_volumes || []);
    const pricesByTimestamp = new Map<number, number>();
    const now = new Date();
    const toleranceMs = this.referenceToleranceMs(days);

    for (const [timestamp, price] of history.prices || []) {
      const timestampMs = Number(timestamp);
      const priceUsd = this.toFinitePositiveNumber(price);
      if (!Number.isFinite(timestampMs) || priceUsd === null) continue;
      pricesByTimestamp.set(timestampMs, priceUsd);
    }

    const operations: any[] = [];
    const timestamps = Array.from(pricesByTimestamp.keys()).sort((left, right) => left - right);

    for (const timestampMs of timestamps) {
      const timestamp = new Date(timestampMs);
      const priceUsd = pricesByTimestamp.get(timestampMs);
      if (!Number.isFinite(timestamp.getTime()) || priceUsd === undefined) continue;

      const setOnInsert = this.cleanObject({
        canonicalProjectId: candidate.canonicalProjectId,
        marketAssetId: candidate.marketAssetId,
        provider: "coingecko",
        providerAssetId: coingeckoId,
        coingeckoId,
        timestamp,
        priceUsd,
        marketCapUsd: this.toFiniteNonNegativeNumber(marketCapsByTimestamp.get(timestampMs)),
        volumeUsd: this.toFiniteNonNegativeNumber(volumesByTimestamp.get(timestampMs)),
        btcPriceUsd: this.findNearestReferencePrice(references.btc, timestampMs, toleranceMs),
        ethPriceUsd: this.findNearestReferencePrice(references.eth, timestampMs, toleranceMs),
        createdAt: now,
      });

      operations.push({
        updateOne: {
          filter: {
            marketAssetId: candidate.marketAssetId,
            provider: "coingecko",
            timestamp,
          },
          update: {
            $setOnInsert: setOnInsert,
          },
          upsert: true,
        },
      });
    }

    return { operations, snapshotsCount: operations.length };
  }

  private async bulkWriteSnapshots(operations: any[]): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;

    for (const chunk of this.chunk(operations, 1000)) {
      const result = await this.snapshotModel.collection.bulkWrite(chunk, { ordered: false });
      created += Number((result as any).upsertedCount || 0);
      updated += Number((result as any).modifiedCount || 0);
    }

    return { created, updated };
  }

  private toReferencePriceIndex(history: CoinGeckoMarketChartDto): ReferencePricePoint[] {
    return (history.prices || [])
      .map(([timestamp, price]) => ({
        timestampMs: Number(timestamp),
        price: this.toFinitePositiveNumber(price),
      }))
      .filter((point) => Number.isFinite(point.timestampMs) && point.price !== null)
      .map((point) => ({ timestampMs: point.timestampMs, price: point.price as number }))
      .sort((left, right) => left.timestampMs - right.timestampMs);
  }

  private findNearestReferencePrice(
    points: ReferencePricePoint[],
    timestampMs: number,
    toleranceMs: number,
  ): number | undefined {
    if (!points.length) return undefined;

    let left = 0;
    let right = points.length - 1;
    while (left <= right) {
      const middle = Math.floor((left + right) / 2);
      const point = points[middle];
      if (point.timestampMs === timestampMs) return point.price;
      if (point.timestampMs < timestampMs) {
        left = middle + 1;
      } else {
        right = middle - 1;
      }
    }

    const candidates = [points[left], points[right]].filter(Boolean);
    let best: ReferencePricePoint | undefined;
    for (const candidate of candidates) {
      if (!best || Math.abs(candidate.timestampMs - timestampMs) < Math.abs(best.timestampMs - timestampMs)) {
        best = candidate;
      }
    }

    if (!best || Math.abs(best.timestampMs - timestampMs) > toleranceMs) return undefined;
    return best.price;
  }

  private toValueMap(rows: [number, number][]): Map<number, number> {
    const result = new Map<number, number>();
    for (const [timestamp, value] of rows) {
      const timestampMs = Number(timestamp);
      const numberValue = this.toFiniteNonNegativeNumber(value);
      if (Number.isFinite(timestampMs) && numberValue !== null) {
        result.set(timestampMs, numberValue);
      }
    }
    return result;
  }

  private resolveDays(
    value: FomoV2CoinGeckoMarketHistoryDays | undefined,
    tier: FomoV2CoinGeckoMarketHistorySyncTier,
    warnings: string[],
  ): FomoV2CoinGeckoMarketHistoryDays {
    const fallback: FomoV2CoinGeckoMarketHistoryDays =
      tier === "COLD" ? 7 : tier === "WARM" ? 30 : 90;
    const requested = value ?? fallback;

    if (requested === "max") return "max";
    if (!Number.isFinite(Number(requested)) || Number(requested) <= 0) {
      throw new Error(`Invalid days=${requested}. Expected a positive number of days or max.`);
    }

    if ((tier === "HOT" || tier === "all") && Number(requested) < 90) {
      warnings.push(`days=${requested} was raised to 90 for tier=${tier}; HOT history requires at least 90 days.`);
      return 90;
    }

    return Math.trunc(Number(requested));
  }

  private buildHistoryWindow(days: FomoV2CoinGeckoMarketHistoryDays, now: Date): HistoryWindow {
    if (days === "max") return { days };

    const toUnixSeconds = Math.floor(now.getTime() / 1000);
    return {
      days,
      fromUnixSeconds: toUnixSeconds - days * 24 * 60 * 60,
      toUnixSeconds,
    };
  }

  private referenceToleranceMs(days: FomoV2CoinGeckoMarketHistoryDays): number {
    if (days === 1) return 10 * 60 * 1000;
    if (days === "max") return 36 * 60 * 60 * 1000;
    return 2 * 60 * 60 * 1000;
  }

  private emptyResult(params: {
    dryRun: boolean;
    tier: FomoV2CoinGeckoMarketHistorySyncTier;
    days: FomoV2CoinGeckoMarketHistoryDays;
    vsCurrency: string;
    limit: number;
    offset: number;
    startedAt: Date;
    startedMs: number;
    warnings: string[];
  }): FomoV2CoinGeckoMarketHistorySyncResult {
    return {
      dryRun: params.dryRun,
      tier: params.tier,
      days: params.days,
      vsCurrency: params.vsCurrency,
      limit: params.limit,
      offset: params.offset,
      startedAt: params.startedAt.toISOString(),
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
      warnings: params.warnings,
    };
  }

  private finishResult(
    result: FomoV2CoinGeckoMarketHistorySyncResult,
    startedMs: number,
  ): FomoV2CoinGeckoMarketHistorySyncResult {
    result.finishedAt = new Date().toISOString();
    result.durationMs = Date.now() - startedMs;
    return result;
  }

  private recordError(
    result: FomoV2CoinGeckoMarketHistorySyncResult,
    error: FomoV2CoinGeckoMarketHistorySyncError,
  ): void {
    result.errorsCount += 1;
    if (result.errors.length < 25) {
      result.errors.push(error);
    }
  }

  private retryDelayMs(error: any, attempt: number): number {
    const retryAfterSeconds = Number(error?.response?.headers?.["retry-after"]);
    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
      return Math.min(retryAfterSeconds * 1000, 60_000);
    }

    return Math.min(1000 * Math.pow(2, attempt), 30_000);
  }

  private isRetryableProviderStatus(status?: number): boolean {
    if (!status) return true;
    return status === 429 || status >= 500;
  }

  private getHttpStatus(error: any): number | undefined {
    const status = Number(error?.response?.status);
    return Number.isFinite(status) ? status : undefined;
  }

  private formatError(error: any): string {
    const status = this.getHttpStatus(error);
    const message = String(error?.message || error || "Unknown error");
    return [status ? `status=${status}` : "", message].filter(Boolean).join(" ");
  }

  private parseObjectId(value: string, field: string): mongoose.Types.ObjectId {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error(`Invalid ${field}=${value}. Expected Mongo ObjectId.`);
    }
    return new mongoose.Types.ObjectId(value);
  }

  private toObjectIdString(value: any): string | undefined {
    return value ? String(value) : undefined;
  }

  private normalizeCoinGeckoId(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  private normalizeCoinGeckoIds(values: any): string[] {
    return Array.from(
      new Set(
        (Array.isArray(values) ? values : [])
          .map((value) => this.normalizeCoinGeckoId(value))
          .filter(Boolean),
      ),
    );
  }

  private normalizeVsCurrency(value: any): string {
    return String(value || "usd")
      .trim()
      .toLowerCase() || "usd";
  }

  private parseObjectIdList(values: any, fieldName: string): mongoose.Types.ObjectId[] {
    if (!Array.isArray(values)) return [];
    return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean))).map((value) =>
      this.parseObjectId(value, fieldName),
    );
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
  }

  private nonNegativeLimit(value: any, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    if (parsed <= 0) return 0;
    return Math.trunc(parsed);
  }

  private nonNegativeInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
  }

  private toFinitePositiveNumber(value: any): number | null {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
  }

  private toFiniteNonNegativeNumber(value: any): number | null {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
  }

  private cleanObject<T extends Record<string, any>>(source: T): Partial<T> {
    const result: Partial<T> = {};
    for (const key of Object.keys(source || {}) as Array<keyof T>) {
      const value = source[key];
      if (value !== undefined && value !== null) result[key] = value;
    }
    return result;
  }

  private chunk<T>(items: T[], size: number): T[][] {
    if (!items.length) return [];
    return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
      items.slice(index * size, index * size + size),
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
