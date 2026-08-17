import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { CoinGeckoProClientService } from "src/coingecko/coingecko-pro-client.service";
import { CoinGeckoProjectResolverService } from "src/coingecko/coingecko-project-resolver.service";
import { CoinGeckoTickerDto } from "src/coingecko/coingecko-market.types";
import { ExternalApiUsage, ExternalApiUsageDocument } from "./external-api-usage.model";
import {
  ProjectExchangeTickerCache,
  ProjectExchangeTickerCacheDocument,
  ProjectExchangeType,
} from "./project-exchange-ticker-cache.model";
import { Project, ProjectDocument } from "./project.model";
import { FomoV2MarketProjectReadModel } from "src/fomo-v2/models";

export type ProjectExchangeOverviewType = "all" | "spot" | "dex" | "derivative";

export type ProjectExchangeOverviewReason =
  | "missing_coingecko_id"
  | "quota_exceeded"
  | "coingecko_error"
  | "not_hot_project"
  | null;

export interface ProjectExchangeOverviewOptions {
  type?: ProjectExchangeOverviewType;
  page?: number;
  limit?: number;
  forceRefresh?: boolean;
}

export interface ProjectExchangeOverviewItem {
  rank: number;
  pair: string;
  priceUsd: number;
  exchangeName: string;
  exchangeLogo?: string;
  exchangeType: ProjectExchangeType;
  volume24hUsd: number;
  volumePercent: number;
  trustScore?: string;
  tradeUrl?: string;
}

export interface ProjectExchangeOverviewResponse {
  projectId: string;
  symbol: string;
  coingeckoId?: string;
  stale: boolean;
  fetchedAt?: string;
  reason?: ProjectExchangeOverviewReason;
  page: number;
  limit: number;
  total: number;
  items: ProjectExchangeOverviewItem[];
}

interface NormalizedTicker {
  projectId: mongoose.Types.ObjectId;
  coingeckoId: string;
  base: string;
  target: string;
  pair: string;
  priceUsd: number;
  exchangeName: string;
  exchangeIdentifier: string;
  exchangeLogo?: string;
  exchangeType: ProjectExchangeType;
  volume24hUsd: number;
  volumePercent: number;
  trustScore?: string;
  tradeUrl?: string;
  source: "coingecko";
  fetchedAt: Date;
}

@Injectable()
export class ProjectExchangeOverviewService {
  private readonly logger = new Logger(ProjectExchangeOverviewService.name);
  private readonly tickerEndpoint = "/coins/{id}/tickers";
  private readonly hotMinRank = 1;
  private readonly hotMaxRank = 500;

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly v2MarketReadModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(ProjectExchangeTickerCache.name)
    private readonly cacheModel: Model<ProjectExchangeTickerCacheDocument>,
    @InjectModel(ExternalApiUsage.name)
    private readonly usageModel: Model<ExternalApiUsageDocument>,
    private readonly configService: ConfigService,
    private readonly coinGeckoClient: CoinGeckoProClientService,
    private readonly projectResolver: CoinGeckoProjectResolverService,
  ) {}

  async getProjectExchangeOverview(
    projectId: string,
    options: ProjectExchangeOverviewOptions = {},
  ): Promise<ProjectExchangeOverviewResponse> {
    const type = this.normalizeType(options.type);
    const page = this.normalizePage(options.page);
    const limit = this.normalizeLimit(options.limit);
    const objectId = this.toObjectId(projectId);
    const emptyProjectId = objectId?.toString() || projectId;

    if (!objectId) {
      const v2Project = await this.findV2MarketProject(projectId, null);
      if (v2Project) {
        return this.getV2ProjectExchangeOverview(v2Project, options, type, page, limit);
      }
      return this.buildResponse(emptyProjectId, "", undefined, false, null, [], type, page, limit);
    }

    const project = await this.projectModel.findById(objectId).lean();
    if (!project) {
      const v2Project = await this.findV2MarketProject(projectId, objectId);
      if (v2Project) {
        return this.getV2ProjectExchangeOverview(v2Project, options, type, page, limit);
      }
      return this.buildResponse(emptyProjectId, "", undefined, false, null, [], type, page, limit);
    }

    const symbol = this.getProjectSymbol(project);
    const cachedItems = await this.readProjectCache(objectId);
    const cacheFresh = this.isCacheFresh(cachedItems);

    if (!this.isHotProject(project)) {
      return this.buildResponse(
        objectId.toString(),
        symbol,
        this.resolveKnownCoinGeckoId(project),
        false,
        "not_hot_project",
        [],
        type,
        page,
        limit,
      );
    }

    const coingeckoId = await this.resolveProjectCoinGeckoId(project);
    if (!coingeckoId) {
      return this.buildResponse(
        objectId.toString(),
        symbol,
        undefined,
        false,
        "missing_coingecko_id",
        [],
        type,
        page,
        limit,
      );
    }

    if (cacheFresh && !options.forceRefresh) {
      return this.buildResponse(
        objectId.toString(),
        symbol,
        coingeckoId,
        false,
        null,
        cachedItems,
        type,
        page,
        limit,
      );
    }

    if (!this.isExchangeOverviewEnabled()) {
      return this.buildResponse(
        objectId.toString(),
        symbol,
        coingeckoId,
        cachedItems.length > 0,
        cachedItems.length ? "coingecko_error" : null,
        cachedItems,
        type,
        page,
        limit,
      );
    }

    const canUseQuota = await this.canRefreshWithinQuota();
    if (!canUseQuota) {
      return this.buildResponse(
        objectId.toString(),
        symbol,
        coingeckoId,
        cachedItems.length > 0,
        "quota_exceeded",
        cachedItems,
        type,
        page,
        limit,
      );
    }

    try {
      const response = await this.coinGeckoClient.getCoinTickers(coingeckoId, {
        page: 1,
        includeExchangeLogo: true,
        order: "volume_desc",
      });
      const fetchedAt = new Date();
      const normalizedItems = this.normalizeTickers(
        objectId,
        coingeckoId,
        response.tickers || [],
        fetchedAt,
      );

      await this.replaceProjectCache(objectId, normalizedItems);

      return this.buildResponse(
        objectId.toString(),
        symbol,
        coingeckoId,
        false,
        null,
        normalizedItems,
        type,
        page,
        limit,
      );
    } catch (error) {
      this.logger.warn(
        `CoinGecko tickers failed project=${objectId.toString()} coingeckoId=${coingeckoId}: ${error?.message || error}`,
      );

      return this.buildResponse(
        objectId.toString(),
        symbol,
        coingeckoId,
        cachedItems.length > 0,
        "coingecko_error",
        cachedItems,
        type,
        page,
        limit,
      );
    }
  }

  private async getV2ProjectExchangeOverview(
    project: any,
    options: ProjectExchangeOverviewOptions,
    type: ProjectExchangeOverviewType,
    page: number,
    limit: number,
  ): Promise<ProjectExchangeOverviewResponse> {
    const cacheProjectId = this.toObjectId(this.toIdString(project._id) || this.toIdString(project.marketAssetId));
    const responseProjectId = this.toIdString(project.marketAssetId) || this.toIdString(project._id) || "";
    const symbol = this.getProjectSymbol(project);
    const coingeckoId = this.normalizeCoinGeckoId(project.providerIds?.coingeckoId || project.coingeckoId);

    if (!cacheProjectId) {
      return this.buildResponse(responseProjectId, symbol, coingeckoId || undefined, false, null, [], type, page, limit);
    }

    const cachedItems = await this.readProjectCache(cacheProjectId);
    const cacheFresh = this.isCacheFresh(cachedItems);

    if (!coingeckoId) {
      return this.buildResponse(
        responseProjectId,
        symbol,
        undefined,
        false,
        "missing_coingecko_id",
        [],
        type,
        page,
        limit,
      );
    }

    if (cacheFresh && !options.forceRefresh) {
      return this.buildResponse(responseProjectId, symbol, coingeckoId, false, null, cachedItems, type, page, limit);
    }

    if (!this.isExchangeOverviewEnabled()) {
      return this.buildResponse(
        responseProjectId,
        symbol,
        coingeckoId,
        cachedItems.length > 0,
        cachedItems.length ? "coingecko_error" : null,
        cachedItems,
        type,
        page,
        limit,
      );
    }

    const canUseQuota = await this.canRefreshWithinQuota();
    if (!canUseQuota) {
      return this.buildResponse(
        responseProjectId,
        symbol,
        coingeckoId,
        cachedItems.length > 0,
        "quota_exceeded",
        cachedItems,
        type,
        page,
        limit,
      );
    }

    try {
      const response = await this.coinGeckoClient.getCoinTickers(coingeckoId, {
        page: 1,
        includeExchangeLogo: true,
        order: "volume_desc",
      });
      const fetchedAt = new Date();
      const normalizedItems = this.normalizeTickers(
        cacheProjectId,
        coingeckoId,
        response.tickers || [],
        fetchedAt,
      );

      await this.replaceProjectCache(cacheProjectId, normalizedItems);

      return this.buildResponse(responseProjectId, symbol, coingeckoId, false, null, normalizedItems, type, page, limit);
    } catch (error) {
      this.logger.warn(
        `CoinGecko tickers failed v2MarketProject=${responseProjectId} coingeckoId=${coingeckoId}: ${error?.message || error}`,
      );

      return this.buildResponse(
        responseProjectId,
        symbol,
        coingeckoId,
        cachedItems.length > 0,
        "coingecko_error",
        cachedItems,
        type,
        page,
        limit,
      );
    }
  }

  private async findV2MarketProject(projectId: string, objectId: mongoose.Types.ObjectId | null): Promise<any | null> {
    const normalized = this.normalizeCoinGeckoId(projectId);
    const or: any[] = [];

    if (objectId) {
      or.push({ _id: objectId }, { marketAssetId: objectId }, { canonicalProjectId: objectId });
    }
    if (normalized) {
      or.push({ "providerIds.coingeckoId": normalized });
    }

    if (!or.length) return null;

    return this.v2MarketReadModel
      .findOne({
        trading: "CURRENTLY_TRADING",
        status: "active",
        $or: or,
      })
      .lean();
  }

  private async readProjectCache(projectId: mongoose.Types.ObjectId): Promise<any[]> {
    return this.cacheModel
      .find({ projectId })
      .sort({ volume24hUsd: -1 })
      .lean();
  }

  private async replaceProjectCache(
    projectId: mongoose.Types.ObjectId,
    items: NormalizedTicker[],
  ): Promise<void> {
    await this.cacheModel.deleteMany({ projectId });
    if (!items.length) return;
    await this.cacheModel.insertMany(items, { ordered: false });
  }

  private normalizeTickers(
    projectId: mongoose.Types.ObjectId,
    coingeckoId: string,
    tickers: CoinGeckoTickerDto[],
    fetchedAt: Date,
  ): NormalizedTicker[] {
    const uniqueRows = new Map<string, NormalizedTicker>();
    const rows = tickers
      .map((ticker) => this.normalizeTicker(projectId, coingeckoId, ticker, fetchedAt))
      .filter((ticker): ticker is NormalizedTicker => Boolean(ticker))
      .sort((left, right) => right.volume24hUsd - left.volume24hUsd);

    for (const row of rows) {
      const key = `${row.pair}:${row.exchangeIdentifier}`;
      if (!uniqueRows.has(key)) uniqueRows.set(key, row);
    }

    const dedupedRows = Array.from(uniqueRows.values());

    const totalVolume = dedupedRows.reduce((sum, ticker) => sum + ticker.volume24hUsd, 0);
    if (totalVolume <= 0) return dedupedRows;

    return dedupedRows.map((ticker) => ({
      ...ticker,
      volumePercent: Number(((ticker.volume24hUsd / totalVolume) * 100).toFixed(4)),
    }));
  }

  private normalizeTicker(
    projectId: mongoose.Types.ObjectId,
    coingeckoId: string,
    ticker: CoinGeckoTickerDto,
    fetchedAt: Date,
  ): NormalizedTicker | null {
    const base = this.normalizePairPart(ticker.base);
    const target = this.normalizePairPart(ticker.target);
    const exchangeName = String(ticker.market?.name || "").trim();
    const exchangeIdentifier =
      String(ticker.market?.identifier || exchangeName || "").trim().toLowerCase();
    const priceUsd = this.toPositiveNumber(ticker.converted_last?.usd ?? ticker.last);
    const volume24hUsd = this.toPositiveNumber(ticker.converted_volume?.usd);

    if (!base || !target || !exchangeName || !exchangeIdentifier || volume24hUsd <= 0) {
      return null;
    }

    const pair = `${base}/${target}`;

    return {
      projectId,
      coingeckoId,
      base,
      target,
      pair,
      priceUsd,
      exchangeName,
      exchangeIdentifier,
      exchangeLogo: this.normalizeUrl(ticker.market?.logo),
      exchangeType: this.classifyExchangeType(ticker, pair, exchangeName, exchangeIdentifier),
      volume24hUsd,
      volumePercent: 0,
      trustScore: ticker.trust_score || undefined,
      tradeUrl: this.normalizeUrl(ticker.trade_url),
      source: "coingecko",
      fetchedAt,
    };
  }

  private classifyExchangeType(
    ticker: CoinGeckoTickerDto,
    pair: string,
    exchangeName: string,
    exchangeIdentifier: string,
  ): ProjectExchangeType {
    const haystack = `${pair} ${exchangeName} ${exchangeIdentifier} ${ticker.trade_url || ""}`
      .toLowerCase()
      .replace(/[_-]+/g, " ");

    if (/\b(perp|perpetual|future|futures|derivative|derivatives)\b/.test(haystack)) {
      return "derivative";
    }

    const dexKeywords = [
      "uniswap",
      "pancakeswap",
      "sushiswap",
      "raydium",
      "orca",
      "jupiter",
      "meteora",
      "lifinity",
      "phoenix",
      "openbook",
      "serum",
      "curve",
      "balancer",
      "quickswap",
      "trader joe",
      "camelot",
      "aerodrome",
      "velodrome",
      "osmosis",
      "thorchain",
      "bancor",
      "dodo",
      "kyberswap",
      "spookyswap",
      "biswap",
      "dex",
    ];

    if (dexKeywords.some((keyword) => haystack.includes(keyword))) {
      return "dex";
    }

    return "spot";
  }

  private buildResponse(
    projectId: string,
    symbol: string,
    coingeckoId: string | undefined,
    stale: boolean,
    reason: ProjectExchangeOverviewReason,
    items: any[],
    type: ProjectExchangeOverviewType,
    page: number,
    limit: number,
  ): ProjectExchangeOverviewResponse {
    const filteredItems = this.filterItems(items, type);
    const paginatedItems = this.paginateItems(filteredItems, page, limit);
    const fetchedAt = this.getLatestFetchedAt(items);

    return {
      projectId,
      symbol,
      coingeckoId,
      stale,
      fetchedAt: fetchedAt ? fetchedAt.toISOString() : undefined,
      reason,
      page,
      limit,
      total: filteredItems.length,
      items: paginatedItems.map((item, index) => ({
        rank: (page - 1) * limit + index + 1,
        pair: item.pair,
        priceUsd: this.toPositiveNumber(item.priceUsd),
        exchangeName: item.exchangeName,
        exchangeLogo: item.exchangeLogo,
        exchangeType: item.exchangeType || "unknown",
        volume24hUsd: this.toPositiveNumber(item.volume24hUsd),
        volumePercent: this.toPositiveNumber(item.volumePercent),
        trustScore: item.trustScore || undefined,
        tradeUrl: item.tradeUrl || undefined,
      })),
    };
  }

  private filterItems(
    items: any[],
    type: ProjectExchangeOverviewType,
  ): any[] {
    return items
      .filter((item) => type === "all" || item.exchangeType === type)
      .sort(
        (left, right) =>
          this.toPositiveNumber(right.volume24hUsd) - this.toPositiveNumber(left.volume24hUsd),
      );
  }

  private paginateItems(items: any[], page: number, limit: number): any[] {
    const offset = (page - 1) * limit;
    return items.slice(offset, offset + limit);
  }

  private async resolveProjectCoinGeckoId(project: any): Promise<string | undefined> {
    const knownId = this.resolveKnownCoinGeckoId(project);
    if (knownId) return knownId;

    const resolution = await this.projectResolver.resolveProjects([project]);
    return resolution.resolved[0]?.coingeckoId;
  }

  private resolveKnownCoinGeckoId(project: any): string | undefined {
    const candidates = [
      project.coingeckoId,
      project.rawIcoData?.coingeckoId,
      project.rawIcoData?.marketData?.coingeckoId,
      project.tokenMetrics?.coingeckoId,
    ];

    for (const candidate of candidates) {
      const normalized = this.normalizeCoinGeckoId(candidate);
      if (normalized) return normalized;
    }

    return undefined;
  }

  private isHotProject(project: any): boolean {
    const rank = Math.trunc(Number(project.rank));
    return Number.isFinite(rank) && rank >= this.hotMinRank && rank <= this.hotMaxRank;
  }

  private isCacheFresh(items: any[]): boolean {
    const fetchedAt = this.getLatestFetchedAt(items);
    if (!fetchedAt) return false;

    const ttlMs = this.getHotTtlHours() * 60 * 60 * 1000;
    return Date.now() - fetchedAt.getTime() <= ttlMs;
  }

  private getLatestFetchedAt(items: any[]): Date | null {
    let latest: Date | null = null;

    for (const item of items) {
      const fetchedAt = item.fetchedAt ? new Date(item.fetchedAt) : null;
      if (!fetchedAt || Number.isNaN(fetchedAt.getTime())) continue;
      if (!latest || fetchedAt.getTime() > latest.getTime()) latest = fetchedAt;
    }

    return latest;
  }

  private async consumeTickerQuota(): Promise<boolean> {
    const limit = this.getDailyRequestLimit();
    if (limit <= 0) return false;

    const date = new Date().toISOString().slice(0, 10);
    const query = {
      date,
      provider: "coingecko",
      endpoint: this.tickerEndpoint,
    };
    const usage = await this.usageModel.findOne(query).lean();
    if (Number(usage?.count || 0) >= limit) return false;

    try {
      await this.usageModel.updateOne(
        query,
        {
          $inc: { count: 1 },
          $set: { lastUsedAt: new Date() },
          $setOnInsert: query,
        },
        { upsert: true },
      );
      return true;
    } catch (error) {
      const latest = await this.usageModel.findOne(query).lean();
      if (Number(latest?.count || 0) >= limit) return false;
      throw error;
    }
  }

  private async canRefreshWithinQuota(): Promise<boolean> {
    try {
      return await this.consumeTickerQuota();
    } catch (error) {
      this.logger.warn(`CoinGecko tickers quota guard failed: ${error?.message || error}`);
      return false;
    }
  }

  private normalizeType(value: any): ProjectExchangeOverviewType {
    if (value === "spot" || value === "dex" || value === "derivative") return value;
    return "all";
  }

  private normalizePage(value: any): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 1;
    return Math.trunc(parsed);
  }

  private normalizeLimit(value: any): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 10;
    return Math.min(Math.trunc(parsed), 50);
  }

  private toObjectId(value: string): mongoose.Types.ObjectId | null {
    if (!mongoose.Types.ObjectId.isValid(value)) return null;
    return new mongoose.Types.ObjectId(value);
  }

  private toIdString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value instanceof mongoose.Types.ObjectId) return value.toHexString();
    if (value._id) return this.toIdString(value._id);
    return String(value);
  }

  private normalizePairPart(value: any): string {
    return String(value || "").trim().toUpperCase();
  }

  private normalizeCoinGeckoId(value: any): string {
    return String(value || "").trim().toLowerCase();
  }

  private normalizeUrl(value: any): string | undefined {
    const url = String(value || "").trim();
    return url || undefined;
  }

  private toPositiveNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  private getProjectSymbol(project: any): string {
    return String(project.symbol || project.niche || project.ticker || project.name || "")
      .trim()
      .toUpperCase();
  }

  private getHotTtlHours(): number {
    return this.getPositiveNumber("COINGECKO_TICKERS_CACHE_TTL_HOT_HOURS", 24);
  }

  private getDailyRequestLimit(): number {
    return this.getPositiveNumber("COINGECKO_TICKERS_DAILY_REQUEST_LIMIT", 1000);
  }

  private getPositiveNumber(key: string, fallback: number): number {
    const parsed = Number(this.configService.get(key) || process.env[key]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  private isExchangeOverviewEnabled(): boolean {
    const value = this.configService.get("COINGECKO_EXCHANGE_OVERVIEW_ENABLED");
    if (value === undefined || value === null || value === "") return true;
    return ["1", "true", "yes", "on"].includes(String(value).trim().toLowerCase());
  }
}
