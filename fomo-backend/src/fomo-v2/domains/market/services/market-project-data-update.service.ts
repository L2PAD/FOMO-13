import { Injectable, Logger, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import mongoose, { Model } from "mongoose";
import {
  CoinGeckoMarketDto,
  CoinGeckoReferencePrices,
  MarketDataTier,
} from "src/coingecko/coingecko-market.types";
import { CoinGeckoMarketUpdateService } from "src/coingecko/coingecko-market-update.service";
import { CoinGeckoProClientService } from "src/coingecko/coingecko-pro-client.service";
import {
  getCoinGeckoColdTierLimit,
  getCoinGeckoTierDefinition,
  getCoinGeckoTierProjectLimit,
} from "src/coingecko/config/coingecko-tier.config";
import { ExternalAssetMirrorUrlService } from "src/storage/external-asset-mirror-url.service";
import { FomoV2ParserSnapshotReaderService } from "../../parser-control/services/parser-snapshot-reader.service";
import {
  FomoV2MarketProjectHistory,
  FomoV2MarketProjectReadModel,
} from "../models";
import {
  FomoV2MarketPerformanceTarget,
  FomoV2MarketProjectPerformanceService,
} from "./market-project-performance.service";
import { FomoV2MarketProjectRoiMetricService } from "./market-project-roi-metric.service";
import { FOMO_V2_MARKET_HISTORY_BUCKET_MS_BY_TIER } from "./market-sync-schedule.config";

export interface FomoV2MarketDataTierRunOptions {
  dryRun?: boolean;
  snapshotId?: string;
  upstreamRunId?: string;
  upstreamParserKey?: string;
  sourceType?: string;
  ignoreJobsEnabled?: boolean;
  ignoreLocalRun?: boolean;
  ignoreTierEnabled?: boolean;
  bootstrapFromCoinGecko?: boolean;
  limit?: number;
  marketAssetIds?: string[];
  coingeckoIds?: string[];
  recalculateDerived?: boolean;
  /** In-process lease/policy fence supplied by the managed parser worker. */
  assertExecutionActive?: () => void | Promise<void>;
}

export interface FomoV2MarketDataTierRunResult {
  tier: MarketDataTier;
  dryRun: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  rowsRequested: number;
  rowsWouldUpdate: number;
  rowsUpdated: number;
  historyPointsWouldWrite: number;
  historyPointsWritten: number;
  performanceTargets: number;
  performanceDocumentsWritten: number;
  roiTargets: number;
  roiDocumentsWritten: number;
  missingCoinGeckoId: number;
  missingFromProvider: number;
  failedBatches: number;
  requestsMade: number;
  bootstrapMarketsFetched: number;
  bootstrapRowsMatched: number;
  disabledReason?: string;
  overlapping?: boolean;
}

interface MarketBatchFetchResult {
  markets: CoinGeckoMarketDto[];
  requestsMade: number;
  failedBatches: number;
}

interface BootstrapTierResult {
  candidates: any[];
  marketsById: Map<string, CoinGeckoMarketDto>;
  requestsMade: number;
  failedBatches: number;
  marketsFetched: number;
}

const COINGECKO_PROJECTS_UPSTREAM_PARSER_KEY = "coingecko:projects";

@Injectable()
export class FomoV2MarketProjectDataUpdateService {
  private readonly logger = new Logger(FomoV2MarketProjectDataUpdateService.name);
  private readonly coldTierLimit = getCoinGeckoColdTierLimit();
  private readonly referenceIds = ["bitcoin", "ethereum", "solana"];
  private readonly rejectedMarketIds = new Set<string>();
  private readonly running: Record<MarketDataTier, boolean> = {
    HOT: false,
    WARM: false,
    COLD: false,
  };

  constructor(
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly readModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(FomoV2MarketProjectHistory.name)
    private readonly historyModel: Model<FomoV2MarketProjectHistory>,
    private readonly configService: ConfigService,
    private readonly coinGeckoClient: CoinGeckoProClientService,
    private readonly marketUpdateService: CoinGeckoMarketUpdateService,
    private readonly mirrorUrlService: ExternalAssetMirrorUrlService,
    private readonly performanceService: FomoV2MarketProjectPerformanceService,
    private readonly roiMetricService: FomoV2MarketProjectRoiMetricService,
    @Optional()
    private readonly snapshotReader?: FomoV2ParserSnapshotReaderService,
  ) {}

  @Cron("*/30 * * * * *")
  async runHotTierCron(): Promise<void> {
    await this.runTier("HOT");
  }

  @Cron("0 */10 * * * *")
  async runWarmTierCron(): Promise<void> {
    await this.runTier("WARM");
  }

  @Cron("0 0 */3 * * *")
  async runColdTierCron(): Promise<void> {
    await this.runTier("COLD");
  }

  async runTier(
    tier: MarketDataTier,
    options: FomoV2MarketDataTierRunOptions = {},
  ): Promise<FomoV2MarketDataTierRunResult> {
    const dryRun = options.dryRun === true;
    const startedAt = new Date();
    const startedMs = Date.now();

    if (!this.shouldRunJobs(options)) {
      return this.buildRunResult(tier, dryRun, startedAt, startedMs, {
        disabledReason: "jobs_disabled",
      });
    }

    if (!this.shouldRunTier(tier, options)) {
      return this.buildRunResult(tier, dryRun, startedAt, startedMs, {
        disabledReason: `${this.getTierEnabledEnvName(tier)}=false`,
      });
    }

    if (this.running[tier]) {
      return this.buildRunResult(tier, dryRun, startedAt, startedMs, {
        overlapping: true,
      });
    }

    this.running[tier] = true;
    let rowsRequested = 0;
    let rowsWouldUpdate = 0;
    let rowsUpdated = 0;
    let historyPointsWouldWrite = 0;
    let historyPointsWritten = 0;
    let performanceTargetsCount = 0;
    let performanceDocumentsWritten = 0;
    let roiTargetsCount = 0;
    let roiDocumentsWritten = 0;
    let missingCoinGeckoId = 0;
    let missingFromProvider = 0;
    let failedBatches = 0;
    let requestsMade = 0;
    let bootstrapMarketsFetched = 0;
    let bootstrapRowsMatched = 0;
    let executionFenceFailed = false;
    let executionFenceError: unknown;
    const assertExecutionActive = async (): Promise<void> => {
      try {
        await options.assertExecutionActive?.();
      } catch (error) {
        executionFenceFailed = true;
        executionFenceError = error;
        throw error;
      }
    };

    try {
      await assertExecutionActive();
      const marketsById = new Map<string, CoinGeckoMarketDto>();
      const snapshotIds = options.snapshotId
        ? await this.loadSnapshotMarkets(options, marketsById)
        : [];
      const snapshotCandidateIds = options.snapshotId
        ? this.intersectExplicitIds(snapshotIds, options.coingeckoIds)
        : [];
      let candidates =
        options.snapshotId && !snapshotCandidateIds.length
          ? []
          : await this.loadTierCandidates(
              tier,
              options.snapshotId
                ? { ...options, coingeckoIds: snapshotCandidateIds }
                : options,
            );

      if (
        !options.snapshotId &&
        !candidates.length &&
        this.shouldBootstrapFromCoinGecko(options)
      ) {
        await assertExecutionActive();
        const bootstrap = await this.bootstrapTierCandidatesFromCoinGecko(tier, options);
        await assertExecutionActive();
        candidates = bootstrap.candidates;
        bootstrapMarketsFetched = bootstrap.marketsFetched;
        bootstrapRowsMatched = bootstrap.candidates.length;
        requestsMade += bootstrap.requestsMade;
        failedBatches += bootstrap.failedBatches;
        for (const [id, market] of bootstrap.marketsById.entries()) {
          marketsById.set(id, market);
        }
      }

      rowsRequested = candidates.length;

      const candidateIds = candidates
        .map((candidate: any) => this.normalizeCoinGeckoId(candidate.providerIds?.coingeckoId))
        .filter(Boolean);
      missingCoinGeckoId = candidates.length - candidateIds.length;
      if (!options.snapshotId) {
        const idsAlreadyFetched = new Set(marketsById.keys());
        const uniqueIds = this.uniqueIds([...candidateIds, ...this.referenceIds])
          .filter((id) => !idsAlreadyFetched.has(id))
          .filter((id) => !this.rejectedMarketIds.has(id));
        const batches = this.chunk(
          uniqueIds,
          this.coinGeckoClient.getMaxBatchSize(),
        );

        for (const batch of batches) {
          await assertExecutionActive();
          const result = await this.fetchMarketsBatchWithFallback(tier, batch);
          requestsMade += result.requestsMade;
          failedBatches += result.failedBatches;
          for (const market of result.markets) {
            const id = this.normalizeCoinGeckoId(market.id);
            if (id) marketsById.set(id, market);
          }
          await assertExecutionActive();
        }
      }

      const referencePrices = this.resolveReferencePrices(marketsById);
      const updateOperations: any[] = [];
      const historyOperations: any[] = [];
      const performanceTargets: FomoV2MarketPerformanceTarget[] = [];
      const historyTimestamp = new Date();
      const bucketMs = FOMO_V2_MARKET_HISTORY_BUCKET_MS_BY_TIER[tier];
      const bucketTimestamp = new Date(Math.floor(historyTimestamp.getTime() / bucketMs) * bucketMs);

      for (const candidate of candidates as any[]) {
        await assertExecutionActive();
        const coingeckoId = this.normalizeCoinGeckoId(candidate.providerIds?.coingeckoId);
        if (!coingeckoId) continue;
        const market = marketsById.get(coingeckoId);
        if (!market) {
          missingFromProvider += 1;
          continue;
        }

        const updateSet = await this.buildReadModelUpdateSet(candidate, market, referencePrices);
        if (!Object.keys(updateSet).length) continue;

        updateOperations.push({
          updateOne: {
            filter: { _id: candidate._id },
            update: { $set: updateSet },
          },
        });
        historyOperations.push({
          updateOne: {
            filter: {
              marketAssetId: candidate.marketAssetId,
              bucketTimestamp,
              source: "coingecko",
            },
            update: {
              $set: this.cleanObject({
                canonicalProjectId: candidate.canonicalProjectId,
                marketAssetId: candidate.marketAssetId,
                timestamp: historyTimestamp,
                bucketTimestamp,
                price: updateSet.price,
                marketCap: updateSet.marketCap,
                volume24h: updateSet.volume24h,
                priceChange24h: updateSet.priceChange ?? updateSet["usdQuote.percent_change_24h"],
                btcPriceUsd: referencePrices.btcUsdPrice > 0 ? referencePrices.btcUsdPrice : undefined,
                ethPriceUsd: referencePrices.ethUsdPrice > 0 ? referencePrices.ethUsdPrice : undefined,
                solPriceUsd: referencePrices.solUsdPrice > 0 ? referencePrices.solUsdPrice : undefined,
                source: "coingecko",
                tier,
                raw: {
                  coingeckoId,
                  marketCapRank: market.market_cap_rank ?? null,
                },
                updatedAt: historyTimestamp,
              }),
              $setOnInsert: { createdAt: historyTimestamp },
            },
            upsert: true,
          },
        });
        performanceTargets.push({
          canonicalProjectId: candidate.canonicalProjectId,
          marketAssetId: candidate.marketAssetId,
          coingeckoId,
          symbol: updateSet.symbol || candidate.symbol,
          tier,
        });
        await assertExecutionActive();
      }

      rowsWouldUpdate = updateOperations.length;
      historyPointsWouldWrite = historyOperations.length;
      performanceTargetsCount = performanceTargets.length;
      roiTargetsCount = performanceTargets.length;

      if (!dryRun) {
        rowsUpdated = await this.bulkWrite(
          this.readModel,
          updateOperations,
          assertExecutionActive,
        );
        if (this.isHistoryWriteEnabled()) {
          historyPointsWritten = await this.bulkWrite(
            this.historyModel,
            historyOperations,
            assertExecutionActive,
          );
          if (options.recalculateDerived !== false && historyPointsWritten > 0 && performanceTargets.length) {
            await assertExecutionActive();
            try {
              const performanceResult = await this.performanceService.recalculateForMarketAssets(performanceTargets);
              performanceDocumentsWritten = performanceResult.upserted;
            } catch (error) {
              this.logger.warn(
                `FOMO v2 performance recalculation failed tier=${tier}: ${error?.message || error}`,
              );
            }
            await assertExecutionActive();
            try {
              const roiResult = await this.roiMetricService.recalculateForMarketAssets(performanceTargets);
              roiDocumentsWritten = roiResult.upserted;
            } catch (error) {
              this.logger.warn(
                `FOMO v2 ROI recalculation failed tier=${tier}: ${error?.message || error}`,
              );
            }
            await assertExecutionActive();
          }
        }
      }
      await assertExecutionActive();
    } catch (error) {
      if (executionFenceFailed && error === executionFenceError) throw error;
      if (options.snapshotId) throw error;
      this.logger.error(`FOMO v2 market-data tier failed tier=${tier}: ${error?.message || error}`);
    } finally {
      this.running[tier] = false;
    }

    return this.buildRunResult(tier, dryRun, startedAt, startedMs, {
      rowsRequested,
      rowsWouldUpdate,
      rowsUpdated,
      historyPointsWouldWrite,
      historyPointsWritten,
      performanceTargets: performanceTargetsCount,
      performanceDocumentsWritten,
      roiTargets: roiTargetsCount,
      roiDocumentsWritten,
      missingCoinGeckoId,
      missingFromProvider,
      failedBatches,
      requestsMade,
      bootstrapMarketsFetched,
      bootstrapRowsMatched,
    });
  }

  private async loadTierCandidates(
    tier: MarketDataTier,
    options: FomoV2MarketDataTierRunOptions,
  ): Promise<any[]> {
    const marketAssetIds = this.parseObjectIdList(options.marketAssetIds, "marketAssetIds");
    const coingeckoIds = this.normalizeCoinGeckoIds(options.coingeckoIds);
    const explicitLimit = marketAssetIds.length || coingeckoIds.length;
    const limit = this.positiveInteger(options.limit, explicitLimit || this.getTierProjectLimit(tier));
    const query: Record<string, any> = {
      tier,
      trading: "CURRENTLY_TRADING",
      status: "active",
      "providerIds.coingeckoId": { $type: "string", $ne: "" },
    };

    if (marketAssetIds.length) query.marketAssetId = { $in: marketAssetIds };
    if (coingeckoIds.length) query["providerIds.coingeckoId"] = { $in: coingeckoIds };

    return this.readModel
      .find(query)
      .sort({ rank: 1, _id: 1 })
      .limit(limit)
      .lean();
  }

  private async loadSnapshotMarkets(
    options: FomoV2MarketDataTierRunOptions,
    marketsById: Map<string, CoinGeckoMarketDto>,
  ): Promise<string[]> {
    if (!this.snapshotReader) {
      throw new Error("Parser snapshot reader is not configured.");
    }
    const snapshotId = String(options.snapshotId || "").trim();
    const parserKey = String(
      options.upstreamParserKey || COINGECKO_PROJECTS_UPSTREAM_PARSER_KEY,
    ).trim();
    const sourceType = String(options.sourceType || "coingecko")
      .trim()
      .toLowerCase();
    if (parserKey !== COINGECKO_PROJECTS_UPSTREAM_PARSER_KEY) {
      throw new Error(
        `Market CoinGecko import requires parser ${COINGECKO_PROJECTS_UPSTREAM_PARSER_KEY}.`,
      );
    }
    if (sourceType !== "coingecko") {
      throw new Error("Market CoinGecko import requires source coingecko.");
    }

    const snapshot = await this.snapshotReader.validate({
      snapshotId,
      parserKey,
      sourceType,
      upstreamRunId: options.upstreamRunId,
      write: options.dryRun !== true,
    });
    const cursor = this.snapshotReader.cursor(snapshot);
    for await (const item of cursor) {
      const payload = this.snapshotReader.payload(snapshot, item);
      const markets = this.marketDtosFromSnapshotPayload(payload);
      if (!markets.length) {
        throw new Error(
          `Snapshot ${snapshot.snapshotId} contains a successful item without a CoinGecko market/list DTO.`,
        );
      }
      for (const market of markets) {
        const id = this.normalizeCoinGeckoId(market.id);
        if (!id) {
          throw new Error(
            `Snapshot ${snapshot.snapshotId} contains a CoinGecko DTO without id.`,
          );
        }
        marketsById.set(id, market);
      }
    }
    return Array.from(marketsById.keys());
  }

  private marketDtosFromSnapshotPayload(
    payload: Record<string, any>,
  ): CoinGeckoMarketDto[] {
    if (payload.coingecko_id) {
      return [
        {
          id: String(payload.coingecko_id),
          symbol: String(payload.symbol || ""),
          name: String(payload.name || payload.coingecko_id),
          image: payload.image ?? null,
          market_cap_rank: payload.market_cap_rank ?? null,
          current_price: payload.current_price ?? null,
          market_cap: payload.market_cap ?? null,
          total_volume: payload.total_volume ?? null,
          circulating_supply: payload.circulating_supply ?? null,
          total_supply: payload.total_supply ?? null,
          max_supply: payload.max_supply ?? null,
          fully_diluted_valuation:
            payload.fully_diluted_valuation ?? null,
          ath: payload.ath ?? null,
          atl: payload.atl ?? null,
          price_change_percentage_24h:
            payload.price_change_percentage_24h ?? null,
          price_change_percentage_24h_in_currency:
            payload.price_change_percentage_24h ?? null,
          last_updated:
            payload.market_data_updated_at || payload.updated_at || null,
        },
      ];
    }
    if (Array.isArray(payload.markets)) {
      return payload.markets
        .filter((market: any) => market && typeof market === "object")
        .map((market: any) => ({ ...market } as CoinGeckoMarketDto));
    }

    const list =
      payload.list && typeof payload.list === "object" && !Array.isArray(payload.list)
        ? payload.list
        : undefined;
    const market =
      payload.market &&
      typeof payload.market === "object" &&
      !Array.isArray(payload.market)
        ? payload.market
        : payload.marketData &&
            typeof payload.marketData === "object" &&
            !Array.isArray(payload.marketData)
          ? payload.marketData
          : undefined;
    const dto = market || list ? { ...(list || {}), ...(market || {}) } : payload;
    return dto && typeof dto === "object" && !Array.isArray(dto)
      ? [dto as CoinGeckoMarketDto]
      : [];
  }

  private intersectExplicitIds(
    snapshotIds: string[],
    explicitIds?: string[],
  ): string[] {
    const requested = this.normalizeCoinGeckoIds(explicitIds);
    if (!requested.length) return snapshotIds;
    const allowed = new Set(snapshotIds);
    return requested.filter((id) => allowed.has(id));
  }

  private async bootstrapTierCandidatesFromCoinGecko(
    tier: MarketDataTier,
    options: FomoV2MarketDataTierRunOptions,
  ): Promise<BootstrapTierResult> {
    const definition = getCoinGeckoTierDefinition(tier);
    const limit = this.getTierBootstrapLimit(tier, options);
    const perPage = 250;
    const startPage = Math.max(1, Math.ceil(definition.minRank / perPage));
    const finiteMaxRank =
      definition.maxRank >= Number.MAX_SAFE_INTEGER
        ? definition.minRank + limit - 1
        : Math.min(definition.maxRank, definition.minRank + limit - 1);
    const endPage = Math.max(startPage, Math.ceil(finiteMaxRank / perPage));
    const markets: CoinGeckoMarketDto[] = [];
    let requestsMade = 0;
    let failedBatches = 0;

    for (let page = startPage; page <= endPage && markets.length < limit; page += 1) {
      try {
        const batch = await this.coinGeckoClient.fetchMarketsPage({ page, perPage });
        requestsMade += 1;
        if (!batch.length) break;

        for (const market of batch) {
          const rank = this.toFiniteNumber(market.market_cap_rank);
          if (rank === null || rank < definition.minRank || rank > definition.maxRank) continue;
          markets.push(market);
          if (markets.length >= limit) break;
        }

        if (batch.length < perPage) break;
      } catch (error) {
        requestsMade += 1;
        failedBatches += 1;
        this.logger.warn(
          `FOMO v2 CoinGecko bootstrap page failed tier=${tier} page=${page} error=${this.formatProviderError(error)}`,
        );
        break;
      }
    }

    const marketsById = new Map<string, CoinGeckoMarketDto>();
    for (const market of markets) {
      const id = this.normalizeCoinGeckoId(market.id);
      if (id) marketsById.set(id, market);
    }

    const candidates = await this.loadCandidatesByCoinGeckoMarkets(markets, limit);

    return {
      candidates,
      marketsById,
      requestsMade,
      failedBatches,
      marketsFetched: markets.length,
    };
  }

  private async loadCandidatesByCoinGeckoMarkets(markets: CoinGeckoMarketDto[], limit: number): Promise<any[]> {
    const ids = this.uniqueIds(markets.map((market) => market.id));
    if (!ids.length) return [];

    const rows = await this.readModel
      .find({
        trading: "CURRENTLY_TRADING",
        status: "active",
        "providerIds.coingeckoId": { $in: ids },
      })
      .lean();
    const rowByCoinGeckoId = new Map<string, any>();

    for (const row of rows as any[]) {
      const id = this.normalizeCoinGeckoId(row.providerIds?.coingeckoId);
      if (id) rowByCoinGeckoId.set(id, row);
    }

    const candidates: any[] = [];
    for (const market of markets) {
      const row = rowByCoinGeckoId.get(this.normalizeCoinGeckoId(market.id));
      if (!row) continue;
      candidates.push(row);
      if (candidates.length >= limit) break;
    }

    return candidates;
  }

  private async buildReadModelUpdateSet(
    current: any,
    market: CoinGeckoMarketDto,
    referencePrices: CoinGeckoReferencePrices,
  ): Promise<Record<string, any>> {
    const set = this.marketUpdateService.buildProjectUpdateSet(market, referencePrices);
    const rank = this.toFiniteNumber(market.market_cap_rank);
    const tier = this.resolveTier(rank);

    if (rank !== null) set.rank = rank;
    if (tier) set.tier = tier;
    if (market.image) {
      const logo = await this.mirrorUrlService.preferMirroredUrl(market.image, current?.logo);
      if (logo) set.logo = logo;
    }
    if (market.name) set.name = market.name;
    if (market.symbol) set.symbol = market.symbol;
    if (set.marketDataUpdatedAt) {
      set.marketDataUpdatedAt = new Date(set.marketDataUpdatedAt);
    } else if (market.last_updated) {
      const date = new Date(market.last_updated);
      if (!isNaN(date.getTime())) set.marketDataUpdatedAt = date;
    }

    this.removeProviderSparklineChartUpdate(set);

    const nextVolume24h = this.toFiniteNumber(set.volume24h);
    const previousVolume24h = this.toFiniteNumber(current?.volume24h);
    if (nextVolume24h !== null && previousVolume24h !== null && previousVolume24h > 0) {
      set.volume24hChange = this.roundNumber(((nextVolume24h - previousVolume24h) / previousVolume24h) * 100, 4);
    }

    this.applyAthAtlGuard(current, set);

    const circulatingSupply = this.toFiniteNumber(set.circulatingSupply ?? current.circulatingSupply);
    const maxSupply = this.toFiniteNumber(set.maxSupply ?? current.maxSupply);
    if (circulatingSupply !== null && maxSupply !== null && maxSupply > 0) {
      set.circulatingSupplyPercent = Math.max(0, Math.min(100, (circulatingSupply / maxSupply) * 100));
    } else {
      set.circulatingSupplyPercent = 0;
    }

    set["debug.latestMarketDataUpdate"] = {
      source: "coingecko",
      coingeckoId: this.normalizeCoinGeckoId(market.id),
      updatedAt: new Date(),
      marketCapRank: market.market_cap_rank ?? null,
    };
    set["sourceCoverage.latestMarketDataSource"] = "coingecko";
    set["sourceCoverage.displaySource"] = "coingecko";

    return set;
  }

  private removeProviderSparklineChartUpdate(set: Record<string, any>): void {
    delete set.chart7d;
    delete set.chart7dUpdatedAt;
    delete set.chart7dSource;
    delete set.chart7dPointsCount;
    delete set.chart7dTrend;
  }

  private applyAthAtlGuard(current: any, set: Record<string, any>): void {
    const priceUsd = this.toFiniteNumber(set.price ?? current?.price);
    if (priceUsd === null) return;

    const timestamp = set.marketDataUpdatedAt instanceof Date && !isNaN(set.marketDataUpdatedAt.getTime())
      ? set.marketDataUpdatedAt
      : new Date();
    const athUsd = this.toFiniteNumber(set.athUsd ?? current?.athUsd);
    const atlUsd = this.toFiniteNumber(set.atlUsd ?? current?.atlUsd);

    if (athUsd === null || priceUsd > athUsd) {
      set.athUsd = priceUsd;
      set.athUsdDate = timestamp;
      set.athUsdChangePercent = 0;
    }

    if (atlUsd === null || priceUsd < atlUsd) {
      set.atlUsd = priceUsd;
      set.atlUsdDate = timestamp;
      set.atlUsdChangePercent = 0;
    }

    if (set.athUsd !== undefined && !set.athUsdDate && !current?.athUsdDate && Number(set.athUsd) === priceUsd) {
      set.athUsdDate = timestamp;
    }

    if (set.atlUsd !== undefined && !set.atlUsdDate && !current?.atlUsdDate && Number(set.atlUsd) === priceUsd) {
      set.atlUsdDate = timestamp;
    }
  }

  private async fetchMarketsBatchWithFallback(
    tier: MarketDataTier,
    batch: string[],
  ): Promise<MarketBatchFetchResult> {
    try {
      const markets = await this.coinGeckoClient.fetchMarketsBatch(batch);
      return {
        markets,
        requestsMade: 1,
        failedBatches: 0,
      };
    } catch (error) {
      const status = this.getHttpStatus(error);
      const errorMessage = this.formatProviderError(error);

      if (batch.length > 1 && (status === 400 || status === 414)) {
        const middle = Math.ceil(batch.length / 2);
        this.logger.warn(
          `FOMO v2 CoinGecko market batch rejected; splitting tier=${tier} ids=${batch.length} sample=${this.describeIds(batch)} error=${errorMessage}`,
        );
        const left = await this.fetchMarketsBatchWithFallback(tier, batch.slice(0, middle));
        const right = await this.fetchMarketsBatchWithFallback(tier, batch.slice(middle));
        return {
          markets: [...left.markets, ...right.markets],
          requestsMade: 1 + left.requestsMade + right.requestsMade,
          failedBatches: left.failedBatches + right.failedBatches,
        };
      }

      this.logger.warn(
        `FOMO v2 CoinGecko market batch failed tier=${tier} ids=${batch.length} sample=${this.describeIds(batch)} error=${errorMessage}`,
      );

      if (batch.length === 1 && (status === 400 || status === 404)) {
        this.rejectedMarketIds.add(batch[0]);
      }

      return {
        markets: [],
        requestsMade: 1,
        failedBatches: 1,
      };
    }
  }

  private resolveReferencePrices(marketsById: Map<string, CoinGeckoMarketDto>): CoinGeckoReferencePrices {
    return {
      btcUsdPrice: Number(marketsById.get("bitcoin")?.current_price || 0),
      ethUsdPrice: Number(marketsById.get("ethereum")?.current_price || 0),
      solUsdPrice: Number(marketsById.get("solana")?.current_price || 0),
    };
  }

  private getTierProjectLimit(tier: MarketDataTier): number {
    if (tier === "COLD") return this.coldTierLimit;
    return getCoinGeckoTierProjectLimit(tier) || 100;
  }

  private getTierBootstrapLimit(tier: MarketDataTier, options: FomoV2MarketDataTierRunOptions): number {
    const explicitLimit = Number(options.limit);
    if (Number.isFinite(explicitLimit) && explicitLimit > 0) return Math.trunc(explicitLimit);
    if (tier === "COLD") return Math.min(this.coldTierLimit, 250);
    return this.getTierProjectLimit(tier);
  }

  private resolveTier(rank: number | null): MarketDataTier | undefined {
    if (rank === null || rank < 1) return undefined;
    if (rank <= 250) return "HOT";
    if (rank <= 5500) return "WARM";
    return "COLD";
  }

  private shouldRunJobs(options: FomoV2MarketDataTierRunOptions): boolean {
    if (options.ignoreJobsEnabled !== true && this.readBooleanFlag("FOMO_V2_MARKET_QUEUE_ENABLED", false) === true) return false;
    if (options.ignoreJobsEnabled !== true && this.readBooleanFlag("FOMO_V2_MARKET_DATA_ENABLED", false) !== true) return false;
    if (options.ignoreLocalRun !== true && this.configService.get("IS_LOCAL_RUN") === "true") return false;
    return Boolean(options.snapshotId) || this.coinGeckoClient.isConfigured();
  }

  private shouldBootstrapFromCoinGecko(options: FomoV2MarketDataTierRunOptions): boolean {
    if (options.bootstrapFromCoinGecko === false) return false;
    return this.readBooleanFlag("FOMO_V2_MARKET_DATA_BOOTSTRAP_ENABLED", true);
  }

  private shouldRunTier(tier: MarketDataTier, options: FomoV2MarketDataTierRunOptions): boolean {
    if (options.ignoreTierEnabled === true) return true;
    return this.readBooleanFlag(
      this.getTierEnabledEnvName(tier),
      this.readBooleanFlag(`COINGECKO_${tier}_ENABLED`, true),
    );
  }

  private getTierEnabledEnvName(tier: MarketDataTier): string {
    return `FOMO_V2_MARKET_DATA_${tier}_ENABLED`;
  }

  private isHistoryWriteEnabled(): boolean {
    return this.readBooleanFlag("FOMO_V2_MARKET_HISTORY_WRITE_ENABLED", true);
  }

  private buildRunResult(
    tier: MarketDataTier,
    dryRun: boolean,
    startedAt: Date,
    startedMs: number,
    partial: Partial<FomoV2MarketDataTierRunResult> = {},
  ): FomoV2MarketDataTierRunResult {
    const finishedAt = new Date();
    return {
      tier,
      dryRun,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: Date.now() - startedMs,
      rowsRequested: 0,
      rowsWouldUpdate: 0,
      rowsUpdated: 0,
      historyPointsWouldWrite: 0,
      historyPointsWritten: 0,
      performanceTargets: 0,
      performanceDocumentsWritten: 0,
      roiTargets: 0,
      roiDocumentsWritten: 0,
      missingCoinGeckoId: 0,
      missingFromProvider: 0,
      failedBatches: 0,
      requestsMade: 0,
      bootstrapMarketsFetched: 0,
      bootstrapRowsMatched: 0,
      ...partial,
    };
  }

  private async bulkWrite(
    model: Model<any>,
    operations: any[],
    assertExecutionActive?: () => void | Promise<void>,
  ): Promise<number> {
    if (!operations.length) return 0;
    let updated = 0;
    for (const chunk of this.chunk(operations, 1000)) {
      await assertExecutionActive?.();
      const result = await model.bulkWrite(chunk, { ordered: false });
      updated += Number((result as any).modifiedCount || 0) + Number((result as any).upsertedCount || 0);
      await assertExecutionActive?.();
    }
    return updated;
  }

  private readBooleanFlag(name: string, defaultValue: boolean): boolean {
    const value = this.configService.get(name) ?? process.env[name];
    if (value === undefined || value === null || value === "") return defaultValue;
    const normalized = String(value).trim().toLowerCase();
    if (["false", "0", "off", "no"].includes(normalized)) return false;
    if (["true", "1", "on", "yes"].includes(normalized)) return true;
    return defaultValue;
  }

  private uniqueIds(ids: string[]): string[] {
    return Array.from(new Set(ids.map((id) => this.normalizeCoinGeckoId(id)).filter(Boolean)));
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

  private parseObjectIdList(values: any, fieldName: string): mongoose.Types.ObjectId[] {
    if (!Array.isArray(values)) return [];
    return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean))).map((value) =>
      this.parseObjectId(value, fieldName),
    );
  }

  private parseObjectId(value: string, fieldName: string): mongoose.Types.ObjectId {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error(`Invalid ${fieldName} value "${value}". Expected Mongo ObjectId.`);
    }
    return new mongoose.Types.ObjectId(value);
  }

  private toFiniteNumber(value: any): number | null {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private roundNumber(value: number, decimals = 4): number {
    const multiplier = 10 ** Math.max(0, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
  }

  private chunk<T>(items: T[], size: number): T[][] {
    if (!items.length) return [];
    return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
      items.slice(index * size, index * size + size),
    );
  }

  private cleanObject<T extends Record<string, any>>(source: T): Partial<T> {
    const result: Partial<T> = {};
    for (const key of Object.keys(source || {}) as Array<keyof T>) {
      const value = source[key];
      if (value !== undefined && value !== null) result[key] = value;
    }
    return result;
  }

  private getHttpStatus(error: any): number | undefined {
    const status = Number(error?.response?.status);
    return Number.isFinite(status) ? status : undefined;
  }

  private formatProviderError(error: any): string {
    const status = this.getHttpStatus(error);
    const message = String(error?.message || error || "Unknown error");
    return [status ? `status=${status}` : "", message].filter(Boolean).join(" ");
  }

  private describeIds(ids: string[]): string {
    return ids.slice(0, 5).join(",");
  }
}
