import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { PortfolioRecalculationService } from "src/portfolio/portfolio-recalculation.service";
import { Project, ProjectDocument } from "src/projects/project.model";
import { RatingService } from "src/rating/rating.service";
import { AddMarketDataPointsInput, AnalyticsService } from "src/analytics/analytics.service";
import { CoinGeckoMarketDto, MarketDataTier, ResolvedCoinGeckoProject } from "./coingecko-market.types";
import { CoinGeckoMarketUpdateService } from "./coingecko-market-update.service";
import { CoinGeckoProClientService } from "./coingecko-pro-client.service";
import { CoinGeckoProjectResolverService } from "./coingecko-project-resolver.service";
import {
  buildCoinGeckoTierRankFilter,
  getCoinGeckoColdTierLimit,
  getCoinGeckoTierProjectLimit,
} from "./config/coingecko-tier.config";

interface TierCache {
  projects: ResolvedCoinGeckoProject[];
  skippedUnmapped: number;
  refreshedAt?: Date;
  expiresAt?: number;
}

interface ReferencePrices {
  btcUsdPrice: number;
  ethUsdPrice: number;
  solUsdPrice: number;
  updatedAt?: Date;
}

export interface MarketDataTierRunOptions {
  dryRun?: boolean;
  ignoreLocalRun?: boolean;
  ignoreTierEnabled?: boolean;
}

export interface MarketDataTierRunResult {
  tier: MarketDataTier;
  dryRun: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  projectsRequested: number;
  projectsWouldUpdate: number;
  projectsUpdated: number;
  skippedUnmapped: number;
  missingFromProvider: number;
  symbolMismatch: number;
  failedBatches: number;
  requestsMade: number;
  disabledReason?: string;
  overlapping?: boolean;
}

interface MarketBatchFetchResult {
  markets: CoinGeckoMarketDto[];
  requestsMade: number;
  failedBatches: number;
}

@Injectable()
export class MarketDataOrchestratorService {
  private readonly logger = new Logger(MarketDataOrchestratorService.name);
  private readonly cacheTtlMs = Number(process.env.COINGECKO_TIER_CACHE_MINUTES || 15) * 60 * 1000;
  private readonly coldTierLimit = getCoinGeckoColdTierLimit();
  private readonly tierCache: Record<MarketDataTier, TierCache> = {
    HOT: { projects: [], skippedUnmapped: 0 },
    WARM: { projects: [], skippedUnmapped: 0 },
    COLD: { projects: [], skippedUnmapped: 0 },
  };
  private readonly running: Record<MarketDataTier, boolean> = {
    HOT: false,
    WARM: false,
    COLD: false,
  };
  private readonly tierDisabledLogged: Record<MarketDataTier, boolean> = {
    HOT: false,
    WARM: false,
    COLD: false,
  };
  private readonly referenceIds = ["bitcoin", "ethereum", "solana"];
  private readonly rejectedMarketIds = new Set<string>();
  private referencePrices: ReferencePrices = {
    btcUsdPrice: 0,
    ethUsdPrice: 0,
    solUsdPrice: 0,
  };
  private isRefreshingCache = false;
  private missingKeyLogged = false;
  private disabledLogged = false;

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly configService: ConfigService,
    private readonly coinGeckoClient: CoinGeckoProClientService,
    private readonly projectResolver: CoinGeckoProjectResolverService,
    private readonly marketUpdateService: CoinGeckoMarketUpdateService,
    private readonly portfolioRecalculationService: PortfolioRecalculationService,
    private readonly analyticsService: AnalyticsService,
    private readonly ratingService: RatingService,
  ) {}

  async runHotTierCron(): Promise<void> {
    await this.runTier("HOT");
  }

  async runWarmTierCron(): Promise<void> {
    await this.runTier("WARM");
  }

  async runColdTierCron(): Promise<void> {
    await this.runTier("COLD");
  }

  async refreshTierCacheCron(): Promise<void> {
    if (!this.shouldRunJobs()) return;
    await this.refreshTierCache(true, this.getEnabledTiers());
  }

  async runTier(tier: MarketDataTier, options: MarketDataTierRunOptions = {}): Promise<MarketDataTierRunResult> {
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
      this.logger.warn(`CoinGecko market-data tier skipped because previous run is still active tier=${tier}`);
      return this.buildRunResult(tier, dryRun, startedAt, startedMs, {
        overlapping: true,
      });
    }

    this.running[tier] = true;
    let projectsRequested = 0;
    let projectsWouldUpdate = 0;
    let projectsUpdated = 0;
    let skippedUnmapped = 0;
    let missingFromProvider = 0;
    let symbolMismatch = 0;
    let failedBatches = 0;
    let requestsMade = 0;

    try {
      await this.ensureTierCache(tier, options);
      const cachedTier = this.tierCache[tier];
      const candidates = cachedTier.projects;
      projectsRequested = candidates.length;
      skippedUnmapped = cachedTier.skippedUnmapped;

      if (!candidates.length) {
        return this.buildRunResult(tier, dryRun, startedAt, startedMs, {
          projectsRequested,
          projectsWouldUpdate,
          projectsUpdated,
          skippedUnmapped,
          missingFromProvider,
          symbolMismatch,
          failedBatches,
          requestsMade,
        });
      }

      await this.loadReferencePricesFromDbIfNeeded();

      const marketsById = new Map<string, CoinGeckoMarketDto>();
      const uniqueIds = this.uniqueCoinGeckoIds(candidates.map((project) => project.coingeckoId))
        .filter((id) => !this.rejectedMarketIds.has(id));
      const batches = this.chunk(uniqueIds, this.coinGeckoClient.getMaxBatchSize());

      for (const batch of batches) {
        const result = await this.fetchMarketsBatchWithFallback(tier, batch);
        requestsMade += result.requestsMade;
        failedBatches += result.failedBatches;

        for (const market of result.markets) {
          const id = this.normalizeCoinGeckoId(market.id);
          if (id) marketsById.set(id, market);
        }
      }

      this.updateReferencePricesFromMarkets(marketsById);

      const operations: any[] = [];
      const historyPoints: AddMarketDataPointsInput[] = [];
      const portfolioProjectIdsToMark = new Set<string>();
      const historyTimestamp = new Date();
      const currentProjectById = await this.loadCurrentMarketProjectMap(
        candidates.map((candidate) => candidate.projectId),
      );

      for (const candidate of candidates) {
        const market = marketsById.get(this.normalizeCoinGeckoId(candidate.coingeckoId));
        if (!market) {
          missingFromProvider += 1;
          continue;
        }

        if (candidate.mappingMethod === "safe_slug" && !this.isSymbolCompatible(candidate, market)) {
          symbolMismatch += 1;
          continue;
        }

        const updateSet = this.marketUpdateService.buildProjectUpdateSet(market, this.referencePrices);
        const currentProject = currentProjectById.get(candidate.projectId);
        const changedFields = this.marketUpdateService.getChangedFields(currentProject, updateSet);
        const marketScoringSet = this.buildMarketScoringSet(currentProject, updateSet);
        const marketScoringChanged = this.hasMarketScoringChange(currentProject, marketScoringSet);
        historyPoints.push({
          projectId: candidate.projectId,
          point: {
            price: updateSet.price,
            marketCap: updateSet.marketCap,
            volume24h: updateSet.volume24h,
            priceChange24h: updateSet.priceChange ?? updateSet["usdQuote.percent_change_24h"],
            timestamp: historyTimestamp,
            source: "coingecko",
            tier,
          },
        });

        if (changedFields.length || marketScoringChanged) {
          Object.assign(updateSet, marketScoringSet);
        }

        if (!this.marketUpdateService.getChangedFields(currentProject, updateSet).length) continue;

        operations.push({
          updateOne: {
            filter: { _id: new mongoose.Types.ObjectId(candidate.projectId) },
            update: { $set: updateSet },
          },
        });

        if (this.marketUpdateService.getPortfolioRelevantChangedFields(currentProject, updateSet).length) {
          portfolioProjectIdsToMark.add(candidate.projectId);
        }
      }

      projectsWouldUpdate = operations.length;
      projectsUpdated = dryRun ? 0 : await this.bulkWriteOperations(operations);

      if (!dryRun && historyPoints.length && this.isHistoryWriteEnabled()) {
        try {
          await this.analyticsService.addMarketDataPoints(historyPoints, {
            source: "coingecko",
            tier,
            updateChartCache: true,
          });
        } catch (error) {
          this.logger.warn(`CoinGecko market history write failed tier=${tier}: ${error?.message || error}`);
        }
      }

      if (!dryRun && portfolioProjectIdsToMark.size) {
        await this.portfolioRecalculationService.markPortfoliosForMarketData(Array.from(portfolioProjectIdsToMark));
      }
    } catch (error) {
      this.logger.error(`CoinGecko market-data tier failed tier=${tier}: ${error?.message || error}`);
    } finally {
      this.running[tier] = false;
      return this.buildRunResult(tier, dryRun, startedAt, startedMs, {
        projectsRequested,
        projectsWouldUpdate,
        projectsUpdated,
        skippedUnmapped,
        missingFromProvider,
        symbolMismatch,
        failedBatches,
        requestsMade,
      });
    }
  }

  private buildRunResult(
    tier: MarketDataTier,
    dryRun: boolean,
    startedAt: Date,
    startedMs: number,
    overrides: Partial<MarketDataTierRunResult> = {},
  ): MarketDataTierRunResult {
    const finishedAt = new Date();
    return {
      tier,
      dryRun,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedMs,
      projectsRequested: 0,
      projectsWouldUpdate: 0,
      projectsUpdated: 0,
      skippedUnmapped: 0,
      missingFromProvider: 0,
      symbolMismatch: 0,
      failedBatches: 0,
      requestsMade: 0,
      ...overrides,
    };
  }

  private async ensureTierCache(tier: MarketDataTier, options: MarketDataTierRunOptions = {}): Promise<void> {
    const cachedTier = this.tierCache[tier];
    if (cachedTier.expiresAt && cachedTier.expiresAt > Date.now()) return;
    await this.refreshTierCache(false, [tier], options);
  }

  private async refreshTierCache(
    force: boolean,
    requestedTiers: MarketDataTier[] = this.getEnabledTiers(),
    options: MarketDataTierRunOptions = {},
  ): Promise<void> {
    const tiersToRefresh = this.uniqueTiers(requestedTiers)
      .filter((tier) => options.ignoreTierEnabled || this.isTierEnabled(tier))
      .filter((tier) => force || !this.tierCache[tier].expiresAt || this.tierCache[tier].expiresAt <= Date.now());

    if (!tiersToRefresh.length) return;
    if (this.isRefreshingCache) return;

    this.isRefreshingCache = true;
    const startedAt = Date.now();

    try {
      const loadedTiers = await Promise.all(
        tiersToRefresh.map(async (tier) => {
          const projects = await this.loadTierProjectsForTier(tier);
          return { tier, projects };
        }),
      );

      for (const item of loadedTiers) {
        const projects = item.tier === "HOT" ? await this.mergeReferenceProjectsIntoHotTier(item.projects) : item.projects;
        await this.setTierCache(item.tier, projects);
      }

      this.logger.log(
        JSON.stringify({
          event: "coingecko_tier_cache_refreshed",
          tiers: tiersToRefresh,
          durationMs: Date.now() - startedAt,
          hotResolved: this.tierCache.HOT.projects.length,
          warmResolved: this.tierCache.WARM.projects.length,
          coldResolved: this.tierCache.COLD.projects.length,
          hotSkippedUnmapped: this.tierCache.HOT.skippedUnmapped,
          warmSkippedUnmapped: this.tierCache.WARM.skippedUnmapped,
          coldSkippedUnmapped: this.tierCache.COLD.skippedUnmapped,
        }),
      );
    } catch (error) {
      this.logger.warn(`CoinGecko tier cache refresh failed: ${error?.message || error}`);
    } finally {
      this.isRefreshingCache = false;
    }
  }

  private async setTierCache(tier: MarketDataTier, projects: any[]): Promise<void> {
    const resolution = await this.projectResolver.resolveProjects(projects);
    const expiresAt = Date.now() + this.cacheTtlMs;

    this.tierCache[tier] = {
      projects: resolution.resolved,
      skippedUnmapped: resolution.skippedUnmapped,
      refreshedAt: new Date(),
      expiresAt,
    };
  }

  private async loadTierProjects(options: {
    tier: MarketDataTier;
    limit?: number;
  }): Promise<any[]> {
    const query = this.projectModel
      .find({ rank: buildCoinGeckoTierRankFilter(options.tier) })
      .sort({ rank: 1 })
      .select("_id rank slug symbol name source sourceId rawIcoData tokenMetrics");

    if (options.limit) query.limit(options.limit);

    return query.lean();
  }

  private async loadTierProjectsForTier(tier: MarketDataTier): Promise<any[]> {
    return this.loadTierProjects({
      tier,
      limit: this.getTierProjectLimit(tier),
    });
  }

  private async mergeReferenceProjectsIntoHotTier(projects: any[]): Promise<any[]> {
    const projectById = new Map<string, any>();
    for (const project of projects) {
      projectById.set(project._id.toString(), project);
    }

    const referenceProjects = await this.projectModel
      .find({
        $or: [
          { slug: { $in: this.referenceIds } },
          { symbol: { $in: ["BTC", "ETH", "SOL"] } },
          { niche: { $in: ["BTC", "ETH", "SOL"] } },
        ],
      })
      .sort({ rank: 1 })
      .select("_id rank slug symbol name source sourceId rawIcoData tokenMetrics")
      .lean();

    const referenceProjectByKey = new Map<string, any>();
    for (const project of referenceProjects as any[]) {
      const key = this.resolveReferenceKey(project);
      if (!key || referenceProjectByKey.has(key)) continue;
      referenceProjectByKey.set(key, project);
    }

    for (const project of referenceProjectByKey.values()) {
      projectById.set(project._id.toString(), project);
    }

    return Array.from(projectById.values())
      .sort((a, b) => Number(a.rank || Number.MAX_SAFE_INTEGER) - Number(b.rank || Number.MAX_SAFE_INTEGER))
      .slice(0, this.getTierProjectLimit("HOT"));
  }

  private getTierProjectLimit(tier: MarketDataTier): number | undefined {
    if (tier === "COLD") return this.coldTierLimit;
    return getCoinGeckoTierProjectLimit(tier);
  }

  private async bulkWriteOperations(operations: any[]): Promise<number> {
    if (!operations.length) return 0;

    let updated = 0;
    for (const chunk of this.chunk(operations, 1000)) {
      const result = await this.projectModel.bulkWrite(chunk, { ordered: false });
      updated += Number(result.modifiedCount || result.upsertedCount || 0);
    }

    return updated;
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
          `CoinGecko market batch rejected; splitting tier=${tier} ids=${batch.length} sample=${this.describeIds(batch)} error=${errorMessage}`,
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
        `CoinGecko market batch failed tier=${tier} ids=${batch.length} sample=${this.describeIds(batch)} error=${errorMessage}`,
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

  private getHttpStatus(error: any): number | undefined {
    const status = Number(error?.response?.status);
    return Number.isFinite(status) ? status : undefined;
  }

  private formatProviderError(error: any): string {
    const status = this.getHttpStatus(error);
    const message = String(error?.message || error || "Unknown error");
    const body = this.stringifyProviderResponse(error?.response?.data);

    return [
      status ? `status=${status}` : "",
      message,
      body ? `body=${this.truncate(body, 300)}` : "",
    ]
      .filter(Boolean)
      .join(" ");
  }

  private stringifyProviderResponse(data: any): string {
    if (data === undefined || data === null) return "";
    if (typeof data === "string") return data;

    try {
      return JSON.stringify(data);
    } catch {
      return String(data);
    }
  }

  private describeIds(ids: string[]): string {
    return ids.slice(0, 5).join(",");
  }

  private truncate(value: string, maxLength: number): string {
    return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
  }

  private buildMarketScoringSet(currentProject: any, updateSet: Record<string, any>): Record<string, any> {
    if (String(currentProject?.projectType || "").toLowerCase() !== "market") {
      return {};
    }

    const scoringProject = this.applyDottedUpdateSet(
      {
        ...(currentProject || {}),
        projectType: currentProject?.projectType || "market",
      },
      updateSet,
    );
    const scores = this.ratingService.calculateMarketProjectScores(scoringProject);

    return {
      rating: String(scores.rating),
      fomoScore: scores.rating,
      fullness: `${scores.fullness}%`,
      ratingBreakdown: scores.ratingBreakdown,
      fullnessBreakdown: scores.fullnessBreakdown,
      lastRatingCalculatedAt: scores.ratingBreakdown.calculatedAt,
    };
  }

  private hasMarketScoringChange(currentProject: any, scoringSet: Record<string, any>): boolean {
    if (!Object.keys(scoringSet || {}).length) return false;

    return (
      String(currentProject?.rating ?? "") !== String(scoringSet.rating ?? "") ||
      Number(currentProject?.fomoScore ?? 0) !== Number(scoringSet.fomoScore ?? 0) ||
      String(currentProject?.fullness ?? "") !== String(scoringSet.fullness ?? "") ||
      currentProject?.ratingBreakdown?.version !== "market-v1" ||
      currentProject?.fullnessBreakdown?.version !== "market-v1"
    );
  }

  private applyDottedUpdateSet(project: any, updateSet: Record<string, any>): any {
    const result = { ...(project || {}) };

    for (const [path, value] of Object.entries(updateSet || {})) {
      const keys = path.split(".");
      let target = result;

      for (let index = 0; index < keys.length - 1; index++) {
        const key = keys[index];
        const current = target[key];
        if (!current || typeof current !== "object" || Array.isArray(current)) {
          target[key] = {};
        }
        target = target[key];
      }

      target[keys[keys.length - 1]] = value;
    }

    return result;
  }

  private async loadCurrentMarketProjectMap(projectIds: string[]): Promise<Map<string, any>> {
    const validProjectIds = [...new Set(projectIds)].filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (!validProjectIds.length) return new Map();

    const projects = await this.projectModel
      .find({ _id: { $in: validProjectIds.map((id) => new mongoose.Types.ObjectId(id)) } })
      .select(
        [
          "_id",
          "projectType",
          "projectStatus",
          "status",
          "source",
          "sourceId",
          "sourceUrl",
          "detailUrl",
          "coingeckoId",
          "capId",
          "slug",
          "name",
          "symbol",
          "ticker",
          "niche",
          "logo",
          "type",
          "rank",
          "trading",
          "price",
          "marketCap",
          "volume",
          "volume24h",
          "volume24hChange",
          "priceChange",
          "circulatingSupply",
          "circulatingSupplyPercent",
          "totalSupply",
          "maxSupply",
          "fullyDilutedMarketCap",
          "volumeAndMarketCap",
          "athUsd",
          "atlUsd",
          "priceBTC",
          "priceETH",
          "priceSOL",
          "usdQuote",
          "marketDataUpdatedAt",
          "bio",
          "descriptionText",
          "website",
          "socialmedia",
          "links",
          "explorers",
          "twitterAcc",
          "twitterFollowers",
          "twitterScore",
          "twitterData",
          "parsingTwitterData",
          "categories",
          "tags",
          "mainCategory",
          "sector",
          "contracts",
          "tokenAddress",
          "chart7d",
          "history",
          "ohlcv",
          "dateAdded",
          "fundsRaised",
          "fundsRounds",
          "totalRaised",
          "fundraising",
          "investors",
          "team",
          "organizations",
          "contributors",
          "redStatus",
          "redFlags",
          "redFlagsList",
          "anomalyDetected",
          "rating",
          "fomoScore",
          "fullness",
          "ratingBreakdown",
          "fullnessBreakdown",
        ].join(" "),
      )
      .lean();

    return new Map((projects as any[]).map((project) => [project._id.toString(), project]));
  }

  private async loadReferencePricesFromDbIfNeeded(): Promise<void> {
    if (
      this.referencePrices.btcUsdPrice > 0 &&
      this.referencePrices.ethUsdPrice > 0 &&
      this.referencePrices.solUsdPrice > 0
    ) {
      return;
    }

    const projects = await this.projectModel
      .find({
        $or: [
          { slug: { $in: this.referenceIds } },
          { symbol: { $in: ["BTC", "ETH", "SOL"] } },
          { niche: { $in: ["BTC", "ETH", "SOL"] } },
        ],
      })
      .select("slug symbol niche price")
      .lean();

    for (const project of projects as any[]) {
      const key = this.resolveReferenceKey(project);
      const price = this.toFiniteNumber(project.price);
      if (!key || price === null || price <= 0) continue;
      this.assignReferencePrice(key, price);
    }
  }

  private updateReferencePricesFromMarkets(marketsById: Map<string, CoinGeckoMarketDto>): void {
    for (const id of this.referenceIds) {
      const market = marketsById.get(id);
      const price = this.toFiniteNumber(market?.current_price);
      if (price === null || price <= 0) continue;
      this.assignReferencePrice(id, price);
    }
  }

  private assignReferencePrice(id: string, price: number): void {
    if (id === "bitcoin") this.referencePrices.btcUsdPrice = price;
    if (id === "ethereum") this.referencePrices.ethUsdPrice = price;
    if (id === "solana") this.referencePrices.solUsdPrice = price;
    this.referencePrices.updatedAt = new Date();
  }

  private resolveReferenceKey(project: any): string | null {
    const slug = this.normalizeCoinGeckoId(project.slug);
    const symbol = String(project.symbol || project.niche || "").trim().toUpperCase();
    if (slug === "bitcoin" || symbol === "BTC") return "bitcoin";
    if (slug === "ethereum" || symbol === "ETH") return "ethereum";
    if (slug === "solana" || symbol === "SOL") return "solana";
    return null;
  }

  private shouldRunJobs(options: MarketDataTierRunOptions = {}): boolean {
    if (!options.ignoreLocalRun && String(this.configService.get("IS_LOCAL_RUN") || "").toLowerCase() === "true") {
      return false;
    }

    if (!this.readBooleanFlag("COINGECKO_MARKET_DATA_ENABLED", true)) {
      if (!this.disabledLogged) {
        this.logger.log("CoinGecko market-data jobs disabled by COINGECKO_MARKET_DATA_ENABLED=false");
        this.disabledLogged = true;
      }
      return false;
    }

    if (!this.coinGeckoClient.isConfigured()) {
      if (!this.missingKeyLogged) {
        this.logger.warn("CoinGecko market-data jobs disabled because COINGECKO_KEY is missing");
        this.missingKeyLogged = true;
      }
      return false;
    }

    return true;
  }

  private shouldRunTier(tier: MarketDataTier, options: MarketDataTierRunOptions = {}): boolean {
    if (options.ignoreTierEnabled) return true;
    if (this.isTierEnabled(tier)) return true;

    if (!this.tierDisabledLogged[tier]) {
      this.logger.log(`CoinGecko ${tier} market-data job disabled by ${this.getTierEnabledEnvName(tier)}=false`);
      this.tierDisabledLogged[tier] = true;
    }

    return false;
  }

  private isTierEnabled(tier: MarketDataTier): boolean {
    return this.readBooleanFlag(this.getTierEnabledEnvName(tier), true);
  }

  private isHistoryWriteEnabled(): boolean {
    return this.readBooleanFlag("COINGECKO_HISTORY_WRITE_ENABLED", true);
  }

  private readBooleanFlag(name: string, defaultValue: boolean): boolean {
    const value = this.configService.get(name) ?? process.env[name];
    if (value === undefined || value === null || value === "") return defaultValue;
    const normalized = String(value).trim().toLowerCase();
    if (["false", "0", "off", "no"].includes(normalized)) return false;
    if (["true", "1", "on", "yes"].includes(normalized)) return true;
    return defaultValue;
  }

  private getTierEnabledEnvName(tier: MarketDataTier): string {
    return `COINGECKO_${tier}_ENABLED`;
  }

  private getEnabledTiers(): MarketDataTier[] {
    return (["HOT", "WARM", "COLD"] as MarketDataTier[]).filter((tier) => this.isTierEnabled(tier));
  }

  private uniqueTiers(tiers: MarketDataTier[]): MarketDataTier[] {
    const seen = new Set<MarketDataTier>();
    const result: MarketDataTier[] = [];

    for (const tier of tiers) {
      if (!tier || seen.has(tier)) continue;
      seen.add(tier);
      result.push(tier);
    }

    return result;
  }

  private isSymbolCompatible(candidate: ResolvedCoinGeckoProject, market: CoinGeckoMarketDto): boolean {
    const candidateSymbol = String(candidate.symbol || "").trim().toLowerCase();
    const providerSymbol = String(market.symbol || "").trim().toLowerCase();
    if (!candidateSymbol || !providerSymbol) return true;
    return candidateSymbol === providerSymbol;
  }

  private uniqueCoinGeckoIds(ids: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const id of ids) {
      const normalized = this.normalizeCoinGeckoId(id);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      result.push(normalized);
    }

    return result;
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  }

  private toFiniteNumber(value: any): number | null {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private normalizeCoinGeckoId(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase();
  }
}
