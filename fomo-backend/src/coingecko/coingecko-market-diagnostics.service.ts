import { Injectable, Logger, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { PortfolioRecalculationService } from "src/portfolio/portfolio-recalculation.service";
import { Project, ProjectDocument } from "src/projects/project.model";
import {
  CoinGeckoMarketDto,
  CoinGeckoReferencePrices,
  MarketDataTier,
  ResolvedCoinGeckoProject,
} from "./coingecko-market.types";
import { CoinGeckoMarketUpdateService } from "./coingecko-market-update.service";
import { CoinGeckoProClientService } from "./coingecko-pro-client.service";
import { CoinGeckoProjectResolverService } from "./coingecko-project-resolver.service";
import {
  buildCoinGeckoTierRankFilter,
  COINGECKO_TIER_ORDER,
  getCoinGeckoTierDefinition,
  getCoinGeckoTierProjectLimit,
} from "./config/coingecko-tier.config";

interface DiagnosticsOptions {
  dryRun?: boolean;
  write?: boolean;
  sampleSizePerTier?: number;
  hotSampleSize?: number;
  warmSampleSize?: number;
  coldSampleSize?: number;
  topUnmappedLimit?: number;
}

interface TierDefinition {
  tier: MarketDataTier;
  minRank: number;
  maxRank: number;
}

@Injectable()
export class CoinGeckoMarketDiagnosticsService {
  private readonly logger = new Logger(CoinGeckoMarketDiagnosticsService.name);
  private readonly referenceIds = ["bitcoin", "ethereum", "solana"];
  private readonly tierDefinitions: TierDefinition[] = COINGECKO_TIER_ORDER.map((tier) =>
    getCoinGeckoTierDefinition(tier),
  );

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly configService: ConfigService,
    private readonly coinGeckoClient: CoinGeckoProClientService,
    private readonly projectResolver: CoinGeckoProjectResolverService,
    private readonly marketUpdateService: CoinGeckoMarketUpdateService,
    @Optional()
    private readonly portfolioRecalculationService?: PortfolioRecalculationService,
  ) {}

  async runDiagnostics(options: DiagnosticsOptions = {}): Promise<any> {
    const startedAt = new Date();
    const dryRun = options.write === true ? false : options.dryRun !== false;
    const sampleSizePerTier = this.positiveInteger(options.sampleSizePerTier, 5);
    const sampleSizesByTier: Record<MarketDataTier, number> = {
      HOT: this.positiveInteger(options.hotSampleSize, sampleSizePerTier),
      WARM: this.positiveInteger(options.warmSampleSize, sampleSizePerTier),
      COLD: this.positiveInteger(options.coldSampleSize, sampleSizePerTier),
    };
    const topUnmappedLimit = this.positiveInteger(options.topUnmappedLimit, 100);
    const write = !dryRun && options.write === true;

    if (write && !this.portfolioRecalculationService) {
      throw new Error("Write diagnostics require PortfolioRecalculationService. Use the admin endpoint in the full app.");
    }

    const tierInputs: Record<MarketDataTier, any[]> = {
      HOT: [],
      WARM: [],
      COLD: [],
    };
    const tierResolutions: Record<MarketDataTier, any> = {
      HOT: null,
      WARM: null,
      COLD: null,
    };

    for (const definition of this.tierDefinitions) {
      tierInputs[definition.tier] = await this.loadTierProjects(definition);
      tierResolutions[definition.tier] = await this.projectResolver.resolveProjects(tierInputs[definition.tier]);
    }

    const coverage = this.buildCoverage(tierInputs, tierResolutions);
    const topUnmapped = this.buildTopUnmapped(tierInputs, tierResolutions, topUnmappedLimit);
    const sample = this.pickSample(tierResolutions, sampleSizesByTier);
    const sampleProjectIds = sample.map((item) => item.projectId);
    const currentProjectById = await this.loadCurrentMarketProjectMap(sampleProjectIds);
    const providerFetch = await this.fetchSampleMarkets(sample);
    const referencePrices = await this.resolveReferencePrices(providerFetch.marketsById);
    const sampleDiffs = this.buildSampleDiffs(sample, currentProjectById, providerFetch.marketsById, referencePrices);

    let writeResult = {
      enabled: write,
      projectsWritten: 0,
      portfolioProjectIdsMarked: [] as string[],
      portfoliosMarked: 0,
    };

    if (write) {
      writeResult = await this.writeSampleDiffs(sampleDiffs);
    }

    const finishedAt = new Date();
    const report = {
      mode: write ? "write-small-batch" : "dry-run",
      apiConfigured: this.coinGeckoClient.isConfigured(),
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      coverage,
      providerFetch: {
        requestsMade: providerFetch.requestsMade,
        failedBatches: providerFetch.failedBatches,
        idsRequested: providerFetch.idsRequested,
        idsReturned: providerFetch.idsReturned,
      },
      sampleSelection: sampleSizesByTier,
      safety: {
        missingFromProvider: sampleDiffs.filter((item) => item.status === "missing_from_provider").length,
        symbolMismatch: sampleDiffs.filter((item) => item.status === "symbol_mismatch").length,
        nullProviderFieldsSkipped: this.mergeCounts(sampleDiffs.map((item) => item.nullProviderFieldsSkipped || {})),
        zeroWriteGuard: "null/undefined provider fields are omitted from $set; missing provider rows are not written",
      },
      sampleDiffs,
      writeResult,
      topUnmapped,
      duplicateWriters: {
        legacyPublicCoinGeckoCron: "disabled in ProjectsService; method remains manual/inert",
        dropstabCurrentQuoteWriter: this.isTruthy(this.configService.get("DROPSTAB_SYNC_ENABLED"))
          ? "enabled by DROPSTAB_SYNC_ENABLED=true and can overwrite current market fields"
          : "disabled by DROPSTAB_SYNC_ENABLED",
        marketDataPrimaryProvider: this.configService.get("MARKET_DATA_PRIMARY_PROVIDER") || null,
        coingeckoSafeSlugFallback: this.isTruthy(this.configService.get("COINGECKO_ALLOW_SAFE_SLUG_FALLBACK"))
          ? "enabled"
          : "disabled",
      },
    };

    this.logger.log(
      JSON.stringify({
        event: "coingecko_market_diagnostics_finished",
        mode: report.mode,
        durationMs: report.durationMs,
        totalMapped: coverage.total.mapped,
        totalUnmapped: coverage.total.unmapped,
        requestsMade: providerFetch.requestsMade,
        failedBatches: providerFetch.failedBatches,
      }),
    );

    return report;
  }

  private async loadTierProjects(definition: TierDefinition): Promise<any[]> {
    const query = this.projectModel
      .find({ rank: buildCoinGeckoTierRankFilter(definition.tier) })
      .sort({ rank: 1 })
      .select("_id rank slug symbol name source sourceId rawIcoData tokenMetrics price marketCap volume24h priceChange priceBTC priceETH priceSOL usdQuote");

    const limit = getCoinGeckoTierProjectLimit(definition.tier);
    if (limit) query.limit(limit);

    return query.lean();
  }

  private buildCoverage(
    tierInputs: Record<MarketDataTier, any[]>,
    tierResolutions: Record<MarketDataTier, any>,
  ): any {
    const result: any = {};
    const total = {
      projects: 0,
      mapped: 0,
      unmapped: 0,
      coveragePercent: 0,
      byMethod: this.emptyMethodCounts(),
    };

    for (const definition of this.tierDefinitions) {
      const tier = definition.tier;
      const projects = tierInputs[tier];
      const resolution = tierResolutions[tier];
      const byMethod = this.countMappingMethods(resolution.resolved);
      const mapped = resolution.resolved.length;
      const unmapped = projects.length - mapped;

      result[tier] = {
        projects: projects.length,
        mapped,
        unmapped,
        coveragePercent: this.percent(mapped, projects.length),
        byMethod,
      };

      total.projects += projects.length;
      total.mapped += mapped;
      total.unmapped += unmapped;
      for (const key of Object.keys(total.byMethod)) {
        total.byMethod[key] += byMethod[key] || 0;
      }
    }

    total.coveragePercent = this.percent(total.mapped, total.projects);
    result.total = total;
    return result;
  }

  private buildTopUnmapped(
    tierInputs: Record<MarketDataTier, any[]>,
    tierResolutions: Record<MarketDataTier, any>,
    limit: number,
  ): any[] {
    const resolvedProjectIds = new Set<string>();
    for (const resolution of Object.values(tierResolutions)) {
      for (const project of resolution.resolved as ResolvedCoinGeckoProject[]) {
        resolvedProjectIds.add(project.projectId);
      }
    }

    return ([] as any[])
      .concat(...Object.values(tierInputs))
      .filter((project) => !resolvedProjectIds.has(project._id.toString()))
      .sort((a, b) => Number(a.rank || Number.MAX_SAFE_INTEGER) - Number(b.rank || Number.MAX_SAFE_INTEGER))
      .slice(0, limit)
      .map((project) => ({
        projectId: project._id.toString(),
        rank: project.rank,
        slug: project.slug,
        symbol: project.symbol,
        name: project.name,
      }));
  }

  private pickSample(
    tierResolutions: Record<MarketDataTier, any>,
    sampleSizesByTier: Record<MarketDataTier, number>,
  ): ResolvedCoinGeckoProject[] {
    const result: ResolvedCoinGeckoProject[] = [];

    for (const definition of this.tierDefinitions) {
      const sampleSize = sampleSizesByTier[definition.tier] || 0;
      if (!sampleSize) continue;

      result.push(
        ...(tierResolutions[definition.tier].resolved as ResolvedCoinGeckoProject[])
          .sort((a, b) => Number(a.rank || Number.MAX_SAFE_INTEGER) - Number(b.rank || Number.MAX_SAFE_INTEGER))
          .slice(0, sampleSize)
          .map((project) => ({ ...project, tier: definition.tier } as any)),
      );
    }

    return result;
  }

  private async fetchSampleMarkets(sample: ResolvedCoinGeckoProject[]): Promise<{
    marketsById: Map<string, CoinGeckoMarketDto>;
    requestsMade: number;
    failedBatches: number;
    idsRequested: number;
    idsReturned: number;
  }> {
    const ids = this.uniqueIds([...sample.map((item) => item.coingeckoId), ...this.referenceIds]);
    const marketsById = new Map<string, CoinGeckoMarketDto>();
    let requestsMade = 0;
    let failedBatches = 0;

    if (!ids.length || !this.coinGeckoClient.isConfigured()) {
      return { marketsById, requestsMade, failedBatches, idsRequested: ids.length, idsReturned: 0 };
    }

    for (const batch of this.chunk(ids, this.coinGeckoClient.getMaxBatchSize())) {
      try {
        const markets = await this.coinGeckoClient.fetchMarketsBatch(batch);
        requestsMade += 1;
        for (const market of markets) {
          const id = this.normalizeCoinGeckoId(market.id);
          if (id) marketsById.set(id, market);
        }
      } catch (error) {
        failedBatches += 1;
        this.logger.warn(`CoinGecko diagnostics batch failed ids=${batch.length} error=${error?.message || error}`);
      }
    }

    return {
      marketsById,
      requestsMade,
      failedBatches,
      idsRequested: ids.length,
      idsReturned: marketsById.size,
    };
  }

  private buildSampleDiffs(
    sample: ResolvedCoinGeckoProject[],
    currentProjectById: Map<string, any>,
    marketsById: Map<string, CoinGeckoMarketDto>,
    referencePrices: CoinGeckoReferencePrices,
  ): any[] {
    return sample.map((candidate: any) => {
      const currentProject = currentProjectById.get(candidate.projectId);
      const market = marketsById.get(this.normalizeCoinGeckoId(candidate.coingeckoId));

      if (!market) {
        return this.toSampleRow(candidate, currentProject, "missing_from_provider", {}, [], [], {});
      }

      if (candidate.mappingMethod === "safe_slug" && !this.isSymbolCompatible(candidate, market)) {
        return this.toSampleRow(
          candidate,
          currentProject,
          "symbol_mismatch",
          {},
          [],
          [],
          this.marketUpdateService.countNullProviderFields(market),
          market,
        );
      }

      const updateSet = this.marketUpdateService.buildProjectUpdateSet(market, referencePrices);
      const changedFields = this.marketUpdateService.getChangedFields(currentProject, updateSet);
      const portfolioRelevantChangedFields = this.marketUpdateService.getPortfolioRelevantChangedFields(
        currentProject,
        updateSet,
      );

      return this.toSampleRow(
        candidate,
        currentProject,
        changedFields.length ? "would_update" : "no_change",
        updateSet,
        changedFields,
        portfolioRelevantChangedFields,
        this.marketUpdateService.countNullProviderFields(market),
        market,
      );
    });
  }

  private async writeSampleDiffs(sampleDiffs: any[]): Promise<any> {
    const writeCandidates = sampleDiffs.filter((item) => item.status === "would_update");
    const operations = writeCandidates.map((item) => ({
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(item.projectId) },
        update: { $set: item.updateSet },
      },
    }));

    let projectsWritten = 0;
    if (operations.length) {
      const result = await this.projectModel.bulkWrite(operations, { ordered: false });
      projectsWritten = Number(result.modifiedCount || result.upsertedCount || 0);
    }

    const portfolioProjectIdsMarked = writeCandidates
      .filter((item) => item.portfolioRelevantChangedFields.length)
      .map((item) => item.projectId);
    const portfoliosMarked = portfolioProjectIdsMarked.length
      ? await this.portfolioRecalculationService.markPortfoliosForMarketData(portfolioProjectIdsMarked)
      : 0;

    return {
      enabled: true,
      projectsWritten,
      portfolioProjectIdsMarked,
      portfoliosMarked,
    };
  }

  private async resolveReferencePrices(marketsById: Map<string, CoinGeckoMarketDto>): Promise<CoinGeckoReferencePrices> {
    const referencePrices: CoinGeckoReferencePrices = {
      btcUsdPrice: 0,
      ethUsdPrice: 0,
      solUsdPrice: 0,
    };

    for (const id of this.referenceIds) {
      const market = marketsById.get(id);
      const price = this.toFiniteNumber(market?.current_price);
      if (!price || price <= 0) continue;
      if (id === "bitcoin") referencePrices.btcUsdPrice = price;
      if (id === "ethereum") referencePrices.ethUsdPrice = price;
      if (id === "solana") referencePrices.solUsdPrice = price;
    }

    if (referencePrices.btcUsdPrice && referencePrices.ethUsdPrice && referencePrices.solUsdPrice) {
      return referencePrices;
    }

    const projects = await this.projectModel
      .find({
        $or: [
          { slug: { $in: this.referenceIds } },
          { symbol: { $in: ["BTC", "ETH", "SOL"] } },
          { niche: { $in: ["BTC", "ETH", "SOL"] } },
        ],
      })
      .sort({ rank: 1 })
      .select("slug symbol niche price")
      .lean();

    for (const project of projects as any[]) {
      const price = this.toFiniteNumber(project.price);
      if (!price || price <= 0) continue;
      const key = this.resolveReferenceKey(project);
      if (key === "bitcoin" && !referencePrices.btcUsdPrice) referencePrices.btcUsdPrice = price;
      if (key === "ethereum" && !referencePrices.ethUsdPrice) referencePrices.ethUsdPrice = price;
      if (key === "solana" && !referencePrices.solUsdPrice) referencePrices.solUsdPrice = price;
    }

    return referencePrices;
  }

  private async loadCurrentMarketProjectMap(projectIds: string[]): Promise<Map<string, any>> {
    const validProjectIds = [...new Set(projectIds)].filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (!validProjectIds.length) return new Map();

    const projects = await this.projectModel
      .find({ _id: { $in: validProjectIds.map((id) => new mongoose.Types.ObjectId(id)) } })
      .select(
        "_id price marketCap volume24h priceChange circulatingSupply totalSupply maxSupply fullyDilutedMarketCap athUsd atlUsd priceBTC priceETH priceSOL usdQuote",
      )
      .lean();

    return new Map((projects as any[]).map((project) => [project._id.toString(), project]));
  }

  private toSampleRow(
    candidate: any,
    currentProject: any,
    status: string,
    updateSet: Record<string, any>,
    changedFields: string[],
    portfolioRelevantChangedFields: string[],
    nullProviderFieldsSkipped: Record<string, number>,
    market?: CoinGeckoMarketDto,
  ): any {
    const diffFields = [
      "price",
      "marketCap",
      "volume24h",
      "priceChange",
      "priceBTC",
      "priceETH",
      "priceSOL",
      "circulatingSupply",
      "totalSupply",
      "maxSupply",
      "fullyDilutedMarketCap",
      "athUsd",
      "atlUsd",
      "usdQuote.price",
      "usdQuote.volume_24h",
      "usdQuote.percent_change_1h",
      "usdQuote.percent_change_24h",
      "usdQuote.percent_change_7d",
      "usdQuote.market_cap",
      "usdQuote.fully_diluted_market_cap",
      "usdQuote.last_updated",
    ];

    const diffs: Record<string, { old: any; new: any }> = {};
    for (const field of diffFields) {
      if (!Object.prototype.hasOwnProperty.call(updateSet, field)) continue;
      diffs[field] = {
        old: this.getPath(currentProject, field),
        new: updateSet[field],
      };
    }

    return {
      tier: candidate.tier,
      projectId: candidate.projectId,
      rank: candidate.rank,
      slug: candidate.slug,
      symbol: candidate.symbol,
      name: candidate.name,
      coingeckoId: candidate.coingeckoId,
      mappingMethod: candidate.mappingMethod,
      providerSymbol: market?.symbol,
      status,
      changedFields,
      portfolioRelevantChangedFields,
      wouldMarkPortfolio: portfolioRelevantChangedFields.length > 0,
      nullProviderFieldsSkipped,
      diffs,
      updateSet,
    };
  }

  private countMappingMethods(resolved: ResolvedCoinGeckoProject[]): Record<string, number> {
    const counts = this.emptyMethodCounts();
    for (const project of resolved) {
      counts[project.mappingMethod] = (counts[project.mappingMethod] || 0) + 1;
    }
    return counts;
  }

  private emptyMethodCounts(): Record<string, number> {
    return {
      source_map: 0,
      manual_override: 0,
      rawIcoData: 0,
      tokenMetrics: 0,
      safe_slug: 0,
    };
  }

  private mergeCounts(items: Record<string, number>[]): Record<string, number> {
    const result: Record<string, number> = {};
    for (const item of items) {
      for (const [key, value] of Object.entries(item)) {
        result[key] = (result[key] || 0) + Number(value || 0);
      }
    }
    return result;
  }

  private percent(part: number, total: number): number {
    if (!total) return 0;
    return Number(((part / total) * 100).toFixed(2));
  }

  private uniqueIds(ids: string[]): string[] {
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

  private isSymbolCompatible(candidate: ResolvedCoinGeckoProject, market: CoinGeckoMarketDto): boolean {
    const candidateSymbol = String(candidate.symbol || "").trim().toLowerCase();
    const providerSymbol = String(market.symbol || "").trim().toLowerCase();
    if (!candidateSymbol || !providerSymbol) return true;
    return candidateSymbol === providerSymbol;
  }

  private resolveReferenceKey(project: any): string | null {
    const slug = this.normalizeCoinGeckoId(project.slug);
    const symbol = String(project.symbol || project.niche || "").trim().toUpperCase();
    if (slug === "bitcoin" || symbol === "BTC") return "bitcoin";
    if (slug === "ethereum" || symbol === "ETH") return "ethereum";
    if (slug === "solana" || symbol === "SOL") return "solana";
    return null;
  }

  private getPath(source: any, path: string): any {
    return path.split(".").reduce((acc, key) => (acc === undefined || acc === null ? undefined : acc[key]), source);
  }

  private toFiniteNumber(value: any): number | null {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
  }

  private isTruthy(value: any): boolean {
    return ["1", "true", "yes", "on"].includes(String(value || "").trim().toLowerCase());
  }

  private normalizeCoinGeckoId(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase();
  }
}
