import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { createHash } from "crypto";
import mongoose, { Model, Types } from "mongoose";
import {
  CoinGeckoDerivativeDto,
  CoinGeckoTickerDto,
} from "src/coingecko/coingecko-market.types";
import { CoinGeckoProClientService } from "src/coingecko/coingecko-pro-client.service";
import {
  FomoV2ExchangeMarketConfidence,
  FomoV2ExchangeMarketSource,
  FomoV2ExchangeMarketType,
  FomoV2MarketAsset,
  FomoV2MarketProjectReadModel,
  FomoV2ProjectAssetLink,
  FomoV2ProjectExchangeMarket,
  FomoV2ProjectExchangeMarketDocument,
  FomoV2ProjectExchangeOverview,
  FomoV2ProjectExchangeOverviewDocument,
} from "../models";

export type FomoV2ExchangeOverviewType = "all" | FomoV2ExchangeMarketType;
export type FomoV2ExchangeOverviewReason =
  | "missing_coingecko_id"
  | "not_found"
  | "not_synced"
  | null;

interface ExchangeProjectIdentity {
  canonicalProjectId: Types.ObjectId;
  marketAssetId: Types.ObjectId;
  coingeckoCoinId: string;
  symbol: string;
  name?: string;
}

interface NormalizedExchangeMarket {
  canonicalProjectId: Types.ObjectId;
  marketAssetId: Types.ObjectId;
  coingeckoCoinId: string;
  symbol: string;
  type: FomoV2ExchangeMarketType;
  exchangeName: string;
  exchangeSlug?: string;
  exchangeLogoUrl?: string;
  network?: string;
  pair: string;
  base: string;
  quote: string;
  priceUsd?: number;
  volume24hUsd?: number;
  liquidityUsd?: number;
  openInterestUsd?: number;
  fundingRate?: number;
  spreadPercent?: number;
  trustScore?: string;
  tradeUrl?: string;
  isStale?: boolean;
  isAnomaly?: boolean;
  matchConfidence: FomoV2ExchangeMarketConfidence;
  sourceType: FomoV2ExchangeMarketSource;
  sourceMarketKey: string;
  dataHash: string;
  fetchedAt: Date;
  sourceUpdatedAt?: Date;
}

export interface FomoV2ProjectExchangeMarketsSyncOptions {
  canonicalProjectId?: string;
  marketAssetId?: string;
  marketAssetIds?: string[];
  coingeckoId?: string;
  coingeckoIds?: string[];
  limit?: number;
  all?: boolean;
  write?: boolean;
  includeDerivatives?: boolean;
}

export interface FomoV2ProjectExchangeMarketsSyncResult {
  mode: "dry-run" | "write";
  scanned: number;
  marketsFound: number;
  marketsWritten: number;
  overviewsWritten: number;
  skipped: {
    missingCoingeckoId: number;
    unresolved: number;
  };
  examples: any[];
}

export interface FomoV2ProjectExchangeMarketsQueryOptions {
  type?: FomoV2ExchangeOverviewType;
  page?: number;
  limit?: number;
}

interface DerivativesCacheEntry {
  expiresAt: number;
  derivatives: CoinGeckoDerivativeDto[];
}

const DEFAULT_DERIVATIVES_CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_DERIVATIVES_CACHE_TTL_MS = 6 * 60 * 60 * 1000;

@Injectable()
export class FomoV2ProjectExchangeMarketsService {
  private readonly logger = new Logger(FomoV2ProjectExchangeMarketsService.name);
  private derivativesCache?: DerivativesCacheEntry;
  private derivativesInFlight?: Promise<CoinGeckoDerivativeDto[]>;

  constructor(
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly readModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(FomoV2MarketAsset.name)
    private readonly marketAssetModel: Model<FomoV2MarketAsset>,
    @InjectModel(FomoV2ProjectAssetLink.name)
    private readonly projectAssetLinkModel: Model<FomoV2ProjectAssetLink>,
    @InjectModel(FomoV2ProjectExchangeMarket.name)
    private readonly exchangeMarketModel: Model<FomoV2ProjectExchangeMarketDocument>,
    @InjectModel(FomoV2ProjectExchangeOverview.name)
    private readonly exchangeOverviewModel: Model<FomoV2ProjectExchangeOverviewDocument>,
    private readonly configService: ConfigService,
    private readonly coinGeckoClient: CoinGeckoProClientService,
  ) {}

  async syncProjectExchangeMarkets(
    options: FomoV2ProjectExchangeMarketsSyncOptions = {},
  ): Promise<FomoV2ProjectExchangeMarketsSyncResult> {
    const write = options.write === true;
    const result: FomoV2ProjectExchangeMarketsSyncResult = {
      mode: write ? "write" : "dry-run",
      scanned: 0,
      marketsFound: 0,
      marketsWritten: 0,
      overviewsWritten: 0,
      skipped: {
        missingCoingeckoId: 0,
        unresolved: 0,
      },
      examples: [],
    };

    const identities = await this.resolveSyncIdentities(options);
    const derivatives =
      options.includeDerivatives === false || !identities.length
        ? []
        : await this.fetchCachedDerivatives();

    for (const identity of identities) {
      result.scanned += 1;
      if (!identity.coingeckoCoinId) {
        result.skipped.missingCoingeckoId += 1;
        continue;
      }

      const markets = await this.fetchAndNormalizeMarkets(identity, derivatives);
      result.marketsFound += markets.length;
      this.pushExample(result.examples, {
        canonicalProjectId: identity.canonicalProjectId.toHexString(),
        marketAssetId: identity.marketAssetId.toHexString(),
        coingeckoCoinId: identity.coingeckoCoinId,
        symbol: identity.symbol,
        markets: markets.length,
        spot: markets.filter((item) => item.type === "spot").length,
        dex: markets.filter((item) => item.type === "dex").length,
        derivative: markets.filter((item) => item.type === "derivative").length,
      });

      if (!write) continue;

      await this.replaceProjectMarkets(identity, markets, options.includeDerivatives !== false);
      result.marketsWritten += markets.length;
      await this.rebuildOverview(identity);
      result.overviewsWritten += 1;
    }

    return result;
  }

  private async fetchCachedDerivatives(): Promise<CoinGeckoDerivativeDto[]> {
    const now = Date.now();
    if (this.derivativesCache && this.derivativesCache.expiresAt > now) {
      return this.derivativesCache.derivatives;
    }
    this.derivativesCache = undefined;

    if (this.derivativesInFlight) return this.derivativesInFlight;

    const request = this.coinGeckoClient
      .fetchDerivatives()
      .then((derivatives) => {
        const ttlMs = this.derivativesCacheTtlMs();
        if (ttlMs > 0) {
          this.derivativesCache = {
            expiresAt: Date.now() + ttlMs,
            derivatives,
          };
        }
        return derivatives;
      })
      .finally(() => {
        this.derivativesInFlight = undefined;
      });
    this.derivativesInFlight = request;
    return request;
  }

  private derivativesCacheTtlMs(): number {
    const configured =
      this.configService.get("FOMO_V2_COINGECKO_DERIVATIVES_CACHE_TTL_MS") ??
      process.env.FOMO_V2_COINGECKO_DERIVATIVES_CACHE_TTL_MS;
    if (configured === undefined || configured === null || configured === "") {
      return DEFAULT_DERIVATIVES_CACHE_TTL_MS;
    }

    const parsed = Number(configured);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return DEFAULT_DERIVATIVES_CACHE_TTL_MS;
    }
    return Math.min(MAX_DERIVATIVES_CACHE_TTL_MS, Math.trunc(parsed));
  }

  async getProjectExchangeOverview(projectId: string): Promise<any> {
    const identity = await this.resolveProjectIdentity(projectId);
    if (!identity) {
      return this.emptyOverviewResponse(projectId, "not_found");
    }
    if (!identity.coingeckoCoinId) {
      return this.emptyOverviewResponse(projectId, "missing_coingecko_id", identity);
    }

    const overview = await this.exchangeOverviewModel
      .findOne({ canonicalProjectId: identity.canonicalProjectId })
      .lean();

    if (!overview) {
      return this.emptyOverviewResponse(projectId, "not_synced", identity);
    }

    return {
      canonicalProjectId: this.toIdString(overview.canonicalProjectId),
      marketAssetId: this.toIdString(overview.marketAssetId),
      coingeckoCoinId: overview.coingeckoCoinId,
      symbol: overview.symbol,
      tabs: overview.tabs || this.emptyTabs(),
      topMarkets: overview.topMarkets || this.emptyTopMarkets(),
      updatedAt: overview.updatedAt?.toISOString?.() || overview.updatedAt,
      reason: null,
    };
  }

  async getProjectExchangeMarkets(
    projectId: string,
    options: FomoV2ProjectExchangeMarketsQueryOptions = {},
  ): Promise<any> {
    const type = this.normalizeOverviewType(options.type);
    const page = this.normalizePage(options.page);
    const limit = this.normalizeLimit(options.limit);
    const identity = await this.resolveProjectIdentity(projectId);

    if (!identity) {
      return this.emptyMarketsResponse(projectId, "", undefined, "not_found", type, page, limit);
    }
    if (!identity.coingeckoCoinId) {
      return this.emptyMarketsResponse(
        identity.canonicalProjectId.toHexString(),
        identity.symbol,
        undefined,
        "missing_coingecko_id",
        type,
        page,
        limit,
      );
    }

    const filter = this.buildMarketFilter(identity, type);
    const [total, rows] = await Promise.all([
      this.exchangeMarketModel.countDocuments(filter),
      this.exchangeMarketModel
        .find(filter)
        .sort(this.getMarketSort(type))
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    const volumeTotal = await this.getFilteredVolumeTotal(identity, type);

    return {
      projectId: identity.canonicalProjectId.toHexString(),
      canonicalProjectId: identity.canonicalProjectId.toHexString(),
      marketAssetId: identity.marketAssetId.toHexString(),
      symbol: identity.symbol,
      coingeckoId: identity.coingeckoCoinId,
      coingeckoCoinId: identity.coingeckoCoinId,
      stale: false,
      reason: total ? null : "not_synced",
      page,
      limit,
      total,
      items: rows.map((row: any, index: number) =>
        this.toApiMarketItem(row, (page - 1) * limit + index + 1, volumeTotal),
      ),
    };
  }

  async rebuildOverview(identity: ExchangeProjectIdentity): Promise<any> {
    const visibleMarkets = await this.exchangeMarketModel
      .find(this.buildVisibleMarketFilter(identity))
      .sort({ volume24hUsd: -1, openInterestUsd: -1, liquidityUsd: -1 })
      .lean();
    const overview = this.buildOverview(identity, visibleMarkets);

    await this.exchangeOverviewModel.updateOne(
      { canonicalProjectId: identity.canonicalProjectId },
      {
        $set: {
          ...overview,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    return overview;
  }

  private async resolveSyncIdentities(
    options: FomoV2ProjectExchangeMarketsSyncOptions,
  ): Promise<ExchangeProjectIdentity[]> {
    if (options.coingeckoId) {
      const identity = await this.resolveCoinGeckoIdentity(options.coingeckoId);
      return identity ? [identity] : [];
    }

    const coingeckoIds = this.normalizeCoinGeckoIds(options.coingeckoIds);
    const marketAssetIds = this.toObjectIds(options.marketAssetIds);
    if (coingeckoIds.length || marketAssetIds.length) {
      const clauses: any[] = [];
      if (coingeckoIds.length) clauses.push({ "providerIds.coingeckoId": { $in: coingeckoIds } });
      if (marketAssetIds.length) clauses.push({ marketAssetId: { $in: marketAssetIds } });

      const rows = await this.readModel
        .find({
          $or: clauses,
          trading: "CURRENTLY_TRADING",
          status: "active",
          "providerIds.coingeckoId": { $type: "string", $ne: "" },
        })
        .sort({ rank: 1, updatedAt: -1 })
        .lean();

      return rows
        .map((row: any) => this.identityFromReadModel(row))
        .filter((item): item is ExchangeProjectIdentity => Boolean(item));
    }

    const directLookup = options.canonicalProjectId || options.marketAssetId;
    if (directLookup) {
      const identity = await this.resolveProjectIdentity(directLookup);
      return identity ? [identity] : [];
    }

    const limit = this.normalizeLimit(options.limit, 100, 500);
    const query = this.readModel
      .find({
        trading: "CURRENTLY_TRADING",
        status: "active",
        "providerIds.coingeckoId": { $type: "string", $ne: "" },
      })
      .sort({ rank: 1, updatedAt: -1 });
    if (!options.all) query.limit(limit);
    const rows = await query.lean();

    return rows
      .map((row: any) => this.identityFromReadModel(row))
      .filter((item): item is ExchangeProjectIdentity => Boolean(item));
  }

  private async resolveProjectIdentity(value: string): Promise<ExchangeProjectIdentity | null> {
    const raw = String(value || "").trim();
    if (!raw) return null;

    const objectId = this.toObjectId(raw);
    const normalized = this.normalizeCoinGeckoId(raw);
    const clauses: any[] = [];

    if (objectId) {
      clauses.push({ _id: objectId }, { canonicalProjectId: objectId }, { marketAssetId: objectId });
    }
    if (normalized) {
      clauses.push({ "providerIds.coingeckoId": normalized });
    }

    if (clauses.length) {
      const readRow = await this.readModel
        .findOne({
          $or: clauses,
          trading: "CURRENTLY_TRADING",
          status: "active",
        })
        .lean();
      const identity = this.identityFromReadModel(readRow);
      if (identity) return identity;
    }

    if (objectId) {
      const link = await this.projectAssetLinkModel
        .findOne({
          $or: [{ canonicalProjectId: objectId }, { marketAssetId: objectId }],
          status: "active",
        })
        .sort({ verified: -1, updatedAt: -1 })
        .lean();
      const marketAssetId = link?.marketAssetId || objectId;
      const marketAsset = await this.marketAssetModel.findById(marketAssetId).lean();
      if (link?.canonicalProjectId && marketAsset?._id) {
        return this.identityFromLinkAndAsset(link, marketAsset);
      }
    }

    return null;
  }

  private async resolveCoinGeckoIdentity(coingeckoId: string): Promise<ExchangeProjectIdentity | null> {
    const normalized = this.normalizeCoinGeckoId(coingeckoId);
    if (!normalized) return null;

    const readRow = await this.readModel
      .findOne({
        "providerIds.coingeckoId": normalized,
        trading: "CURRENTLY_TRADING",
        status: "active",
      })
      .lean();
    const readIdentity = this.identityFromReadModel(readRow);
    if (readIdentity) return readIdentity;

    const marketAsset = await this.marketAssetModel
      .findOne({
        "providerIds.coingeckoId": normalized,
        status: "active",
      })
      .lean();
    if (!marketAsset?._id) return null;

    const link = await this.projectAssetLinkModel
      .findOne({
        marketAssetId: marketAsset._id,
        status: "active",
      })
      .sort({ verified: -1, updatedAt: -1 })
      .lean();
    if (!link?.canonicalProjectId) return null;

    return this.identityFromLinkAndAsset(link, marketAsset);
  }

  private identityFromReadModel(row: any): ExchangeProjectIdentity | null {
    const canonicalProjectId = this.toObjectId(row?.canonicalProjectId);
    const marketAssetId = this.toObjectId(row?.marketAssetId);
    if (!canonicalProjectId || !marketAssetId) return null;

    return {
      canonicalProjectId,
      marketAssetId,
      coingeckoCoinId: this.normalizeCoinGeckoId(row?.providerIds?.coingeckoId),
      symbol: this.normalizeSymbol(row?.symbol || row?.ticker || row?.niche),
      name: row?.name,
    };
  }

  private identityFromLinkAndAsset(link: any, marketAsset: any): ExchangeProjectIdentity | null {
    const canonicalProjectId = this.toObjectId(link?.canonicalProjectId);
    const marketAssetId = this.toObjectId(marketAsset?._id || link?.marketAssetId);
    if (!canonicalProjectId || !marketAssetId) return null;

    return {
      canonicalProjectId,
      marketAssetId,
      coingeckoCoinId: this.normalizeCoinGeckoId(marketAsset?.providerIds?.coingeckoId),
      symbol: this.normalizeSymbol(marketAsset?.symbol),
      name: marketAsset?.name,
    };
  }

  private async fetchAndNormalizeMarkets(
    identity: ExchangeProjectIdentity,
    derivatives: CoinGeckoDerivativeDto[],
  ): Promise<NormalizedExchangeMarket[]> {
    const fetchedAt = new Date();
    const tickerPages = await this.fetchCoinGeckoTickerPages(identity.coingeckoCoinId);
    const spotAndDex = tickerPages.flatMap((ticker) =>
      this.normalizeTickerMarket(identity, ticker, fetchedAt),
    );
    const derivativeMarkets = (derivatives || [])
      .map((derivative) => this.normalizeDerivativeMarket(identity, derivative, fetchedAt))
      .filter((item): item is NormalizedExchangeMarket => Boolean(item));

    return this.dedupeMarkets([...spotAndDex, ...derivativeMarkets]);
  }

  private async fetchCoinGeckoTickerPages(coingeckoId: string): Promise<CoinGeckoTickerDto[]> {
    const maxPages = this.getPositiveInteger("FOMO_V2_EXCHANGE_TICKERS_MAX_PAGES", 3, 10);
    const result: CoinGeckoTickerDto[] = [];

    for (let page = 1; page <= maxPages; page += 1) {
      const response = await this.coinGeckoClient.getCoinTickers(coingeckoId, {
        page,
        includeExchangeLogo: true,
        order: "volume_desc",
      });
      const tickers = Array.isArray(response.tickers) ? response.tickers : [];
      result.push(...tickers);
      if (tickers.length < 100) break;
    }

    return result;
  }

  private normalizeTickerMarket(
    identity: ExchangeProjectIdentity,
    ticker: CoinGeckoTickerDto,
    fetchedAt: Date,
  ): NormalizedExchangeMarket[] {
    if (ticker.is_stale === true || ticker.is_anomaly === true) return [];

    const base = this.normalizeSymbol(ticker.base);
    const quote = this.normalizeSymbol(ticker.target);
    if (!base || !quote || (identity.symbol && base !== identity.symbol)) return [];

    const exchangeName = this.cleanString(ticker.market?.name);
    const exchangeSlug = this.cleanSlug(ticker.market?.identifier || exchangeName);
    const volume24hUsd = this.toPositiveNumber(ticker.converted_volume?.usd);
    const priceUsd = this.toPositiveNumber(ticker.converted_last?.usd ?? ticker.last);
    if (!exchangeName || !exchangeSlug || volume24hUsd <= 0) return [];

    const pair = `${base}/${quote}`;
    const type = this.classifyTickerType(ticker, exchangeName, exchangeSlug);
    const sourceType: FomoV2ExchangeMarketSource =
      type === "dex" ? "coingecko_onchain" : "coingecko";
    const market = this.cleanObject({
      ...this.identityFields(identity),
      type,
      exchangeName,
      exchangeSlug,
      exchangeLogoUrl: this.cleanString(ticker.market?.logo),
      network: type === "dex" ? this.inferNetwork(ticker, exchangeName, exchangeSlug) : undefined,
      pair,
      base,
      quote,
      priceUsd,
      volume24hUsd,
      spreadPercent: this.toPositiveNumber(ticker.bid_ask_spread_percentage),
      trustScore: this.cleanString(ticker.trust_score),
      tradeUrl: this.cleanString(ticker.trade_url),
      isStale: false,
      isAnomaly: false,
      matchConfidence: "high" as FomoV2ExchangeMarketConfidence,
      sourceType,
      sourceUpdatedAt: this.toDate(ticker.last_fetch_at || ticker.last_traded_at || ticker.timestamp),
      fetchedAt,
    }) as Omit<NormalizedExchangeMarket, "sourceMarketKey" | "dataHash">;

    return [this.withSourceIdentity(market)];
  }

  private normalizeDerivativeMarket(
    identity: ExchangeProjectIdentity,
    derivative: CoinGeckoDerivativeDto,
    fetchedAt: Date,
  ): NormalizedExchangeMarket | null {
    const symbol = this.normalizeDerivativeSymbol(derivative.symbol || derivative.index_id);
    const confidence = this.matchDerivativeConfidence(identity, derivative, symbol);
    if (confidence !== "high") return null;

    const exchangeName = this.cleanString(derivative.market);
    const pairParts = this.parseDerivativePair(identity.symbol, symbol);
    if (!exchangeName || !pairParts) return null;

    const sourceUpdatedAt = this.toDate(derivative.last_traded_at);
    const market = this.cleanObject({
      ...this.identityFields(identity),
      type: "derivative" as FomoV2ExchangeMarketType,
      exchangeName,
      exchangeSlug: this.cleanSlug(exchangeName),
      pair: pairParts.pair,
      base: pairParts.base,
      quote: pairParts.quote,
      priceUsd: this.toPositiveNumber(derivative.price),
      volume24hUsd: this.toPositiveNumber(derivative.volume_24h),
      openInterestUsd: this.toPositiveNumber(derivative.open_interest),
      fundingRate: this.toFiniteNumber(derivative.funding_rate),
      spreadPercent: this.toPositiveNumber(derivative.spread),
      tradeUrl: undefined,
      isStale: Boolean(derivative.expired_at),
      isAnomaly: false,
      matchConfidence: confidence,
      sourceType: "coingecko" as FomoV2ExchangeMarketSource,
      sourceUpdatedAt,
      fetchedAt,
    }) as Omit<NormalizedExchangeMarket, "sourceMarketKey" | "dataHash">;

    if ((market.volume24hUsd || 0) <= 0 && (market.openInterestUsd || 0) <= 0) return null;
    return this.withSourceIdentity(market);
  }

  private async upsertMarkets(markets: NormalizedExchangeMarket[]): Promise<void> {
    if (!markets.length) return;
    await this.exchangeMarketModel.bulkWrite(
      markets.map((market) => ({
        updateOne: {
          filter: {
            canonicalProjectId: market.canonicalProjectId,
            sourceMarketKey: market.sourceMarketKey,
          },
          update: {
            $set: market,
            $setOnInsert: { createdAt: new Date() },
          },
          upsert: true,
        },
      })),
      { ordered: false },
    );
  }

  private async replaceProjectMarkets(
    identity: ExchangeProjectIdentity,
    markets: NormalizedExchangeMarket[],
    includeDerivatives: boolean,
  ): Promise<void> {
    await this.upsertMarkets(markets);
    const activeKeys = markets.map((market) => market.sourceMarketKey);
    const types: FomoV2ExchangeMarketType[] = includeDerivatives
      ? ["spot", "dex", "derivative"]
      : ["spot", "dex"];

    await this.exchangeMarketModel.updateMany(
      {
        canonicalProjectId: identity.canonicalProjectId,
        type: { $in: types },
        sourceMarketKey: { $nin: activeKeys },
        isStale: { $ne: true },
      },
      {
        $set: {
          isStale: true,
          fetchedAt: new Date(),
        },
      },
    );
  }

  private buildOverview(identity: ExchangeProjectIdentity, markets: any[]): any {
    const byType = {
      spot: markets.filter((market) => market.type === "spot"),
      dex: markets.filter((market) => market.type === "dex"),
      derivative: markets.filter((market) => market.type === "derivative"),
    };
    const tabs = {
      spot: this.buildBucket(byType.spot, "spot"),
      dex: this.buildBucket(byType.dex, "dex"),
      derivative: this.buildBucket(byType.derivative, "derivative"),
      all: this.buildAllBucket(byType),
    };

    return {
      ...this.identityFields(identity),
      tabs,
      topMarkets: {
        all: this.topMarketPreviews(markets),
        spot: this.topMarketPreviews(byType.spot),
        dex: this.topMarketPreviews(byType.dex),
        derivative: this.topMarketPreviews(byType.derivative),
      },
    };
  }

  private buildBucket(markets: any[], type: FomoV2ExchangeMarketType): any {
    const exchangeNames = new Set(markets.map((market) => market.exchangeSlug || market.exchangeName).filter(Boolean));
    return this.cleanObject({
      marketCount: markets.length,
      exchangeCount: type === "spot" ? exchangeNames.size : undefined,
      dexCount: type === "dex" ? exchangeNames.size : undefined,
      volume24hUsd: this.sumNumbers(markets, "volume24hUsd"),
      liquidityUsd: type === "dex" ? this.sumNumbers(markets, "liquidityUsd") : undefined,
      openInterestUsd: type === "derivative" ? this.sumNumbers(markets, "openInterestUsd") : undefined,
    });
  }

  private buildAllBucket(byType: Record<FomoV2ExchangeMarketType, any[]>): any {
    const spot = this.buildBucket(byType.spot, "spot");
    const dex = this.buildBucket(byType.dex, "dex");
    const derivative = this.buildBucket(byType.derivative, "derivative");
    return {
      marketCount: spot.marketCount + dex.marketCount + derivative.marketCount,
      exchangeCount: Number(spot.exchangeCount || 0),
      dexCount: Number(dex.dexCount || 0),
      volume24hUsd:
        Number(spot.volume24hUsd || 0) +
        Number(dex.volume24hUsd || 0) +
        Number(derivative.volume24hUsd || 0),
      liquidityUsd: dex.liquidityUsd,
      openInterestUsd: derivative.openInterestUsd,
    };
  }

  private buildMarketFilter(identity: ExchangeProjectIdentity, type: FomoV2ExchangeOverviewType): any {
    const filter = this.buildVisibleMarketFilter(identity);
    if (type !== "all") filter.type = type;
    return filter;
  }

  private buildVisibleMarketFilter(identity: ExchangeProjectIdentity): any {
    return {
      canonicalProjectId: identity.canonicalProjectId,
      isStale: { $ne: true },
      isAnomaly: { $ne: true },
      $or: [
        { type: { $ne: "derivative" } },
        { type: "derivative", matchConfidence: "high" },
      ],
    };
  }

  private getMarketSort(type: FomoV2ExchangeOverviewType): any {
    if (type === "dex") return { liquidityUsd: -1, volume24hUsd: -1, exchangeName: 1 };
    if (type === "derivative") return { openInterestUsd: -1, volume24hUsd: -1, exchangeName: 1 };
    return { volume24hUsd: -1, exchangeName: 1 };
  }

  private async getFilteredVolumeTotal(
    identity: ExchangeProjectIdentity,
    type: FomoV2ExchangeOverviewType,
  ): Promise<number> {
    const rows = await this.exchangeMarketModel
      .find(this.buildMarketFilter(identity, type))
      .select("volume24hUsd")
      .lean();
    return this.sumNumbers(rows, "volume24hUsd");
  }

  private toApiMarketItem(row: any, rank: number, volumeTotal: number): any {
    const volume = this.toPositiveNumber(row.volume24hUsd);
    return {
      rank,
      pair: row.pair,
      priceUsd: this.toPositiveNumber(row.priceUsd),
      exchangeName: row.exchangeName,
      exchangeLogo: row.exchangeLogoUrl,
      exchangeType: row.type,
      volume24hUsd: volume,
      volumePercent: volumeTotal > 0 ? Number(((volume / volumeTotal) * 100).toFixed(4)) : 0,
      trustScore: row.trustScore,
      tradeUrl: row.tradeUrl,
      liquidityUsd: this.toPositiveNumber(row.liquidityUsd),
      openInterestUsd: this.toPositiveNumber(row.openInterestUsd),
      fundingRate: this.toFiniteNumber(row.fundingRate),
      matchConfidence: row.matchConfidence,
    };
  }

  private topMarketPreviews(markets: any[]): any[] {
    return [...markets]
      .sort((left, right) => this.marketSortValue(right) - this.marketSortValue(left))
      .slice(0, 10)
      .map((market) => ({
        pair: market.pair,
        exchangeName: market.exchangeName,
        exchangeLogoUrl: market.exchangeLogoUrl,
        type: market.type,
        volume24hUsd: this.toPositiveNumber(market.volume24hUsd),
        liquidityUsd: this.toPositiveNumber(market.liquidityUsd),
        openInterestUsd: this.toPositiveNumber(market.openInterestUsd),
        tradeUrl: market.tradeUrl,
      }));
  }

  private marketSortValue(market: any): number {
    return Math.max(
      this.toPositiveNumber(market.volume24hUsd),
      this.toPositiveNumber(market.openInterestUsd),
      this.toPositiveNumber(market.liquidityUsd),
    );
  }

  private emptyOverviewResponse(
    projectId: string,
    reason: FomoV2ExchangeOverviewReason,
    identity?: ExchangeProjectIdentity,
  ): any {
    return {
      canonicalProjectId: identity?.canonicalProjectId?.toHexString?.() || projectId,
      marketAssetId: identity?.marketAssetId?.toHexString?.(),
      coingeckoCoinId: identity?.coingeckoCoinId,
      symbol: identity?.symbol || "",
      tabs: this.emptyTabs(),
      topMarkets: this.emptyTopMarkets(),
      updatedAt: undefined,
      reason,
    };
  }

  private emptyMarketsResponse(
    projectId: string,
    symbol: string,
    coingeckoId: string | undefined,
    reason: FomoV2ExchangeOverviewReason,
    type: FomoV2ExchangeOverviewType,
    page: number,
    limit: number,
  ): any {
    return {
      projectId,
      symbol,
      coingeckoId,
      stale: false,
      reason,
      type,
      page,
      limit,
      total: 0,
      items: [],
    };
  }

  private emptyTabs(): any {
    const bucket = { marketCount: 0, volume24hUsd: 0 };
    return {
      all: { ...bucket },
      spot: { ...bucket, exchangeCount: 0 },
      dex: { ...bucket, dexCount: 0, liquidityUsd: 0 },
      derivative: { ...bucket, openInterestUsd: 0 },
    };
  }

  private emptyTopMarkets(): any {
    return {
      all: [],
      spot: [],
      dex: [],
      derivative: [],
    };
  }

  private identityFields(identity: ExchangeProjectIdentity): any {
    return {
      canonicalProjectId: identity.canonicalProjectId,
      marketAssetId: identity.marketAssetId,
      coingeckoCoinId: identity.coingeckoCoinId,
      symbol: identity.symbol,
    };
  }

  private withSourceIdentity(
    market: Omit<NormalizedExchangeMarket, "sourceMarketKey" | "dataHash">,
  ): NormalizedExchangeMarket {
    const sourceMarketKey = this.buildSourceMarketKey(market);
    const dataHash = this.hashObject({
      ...market,
      canonicalProjectId: this.toIdString(market.canonicalProjectId),
      marketAssetId: this.toIdString(market.marketAssetId),
      fetchedAt: undefined,
    });
    return {
      ...market,
      sourceMarketKey,
      dataHash,
    };
  }

  private buildSourceMarketKey(market: any): string {
    return [
      market.sourceType,
      market.type,
      market.exchangeSlug || this.cleanSlug(market.exchangeName),
      market.network || "",
      market.pair,
      market.tradeUrl || "",
    ]
      .map((item) => String(item || "").toLowerCase().trim())
      .join(":");
  }

  private classifyTickerType(
    ticker: CoinGeckoTickerDto,
    exchangeName: string,
    exchangeSlug: string,
  ): FomoV2ExchangeMarketType {
    const haystack = `${exchangeName} ${exchangeSlug} ${ticker.trade_url || ""}`
      .toLowerCase()
      .replace(/[_-]+/g, " ");
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
      "dodo",
      "kyberswap",
      "dex",
    ];

    return dexKeywords.some((keyword) => haystack.includes(keyword)) ? "dex" : "spot";
  }

  private inferNetwork(ticker: CoinGeckoTickerDto, exchangeName: string, exchangeSlug: string): string | undefined {
    const haystack = `${exchangeName} ${exchangeSlug} ${ticker.trade_url || ""}`.toLowerCase();
    if (/\b(solana|raydium|orca|jupiter|meteora|openbook|serum)\b/.test(haystack)) return "solana";
    if (/\b(ethereum|uniswap|sushiswap|curve)\b/.test(haystack)) return "ethereum";
    if (/\b(bsc|pancakeswap|binance smart chain)\b/.test(haystack)) return "bsc";
    return undefined;
  }

  private matchDerivativeConfidence(
    identity: ExchangeProjectIdentity,
    derivative: CoinGeckoDerivativeDto,
    normalizedSymbol: string,
  ): FomoV2ExchangeMarketConfidence {
    const projectSymbol = identity.symbol;
    const text = `${derivative.symbol || ""} ${derivative.index_id || ""}`.toUpperCase();
    const pair = this.parseDerivativePair(projectSymbol, normalizedSymbol);
    if (pair?.base === projectSymbol && ["USDT", "USD", "USDC"].includes(pair.quote)) return "high";
    if (new RegExp(`\\b${this.escapeRegExp(projectSymbol)}(USDT|USD|USDC)\\b`).test(text)) return "high";
    if (new RegExp(`\\b${this.escapeRegExp(projectSymbol)}[-/ ]?(PERP|PERPETUAL)\\b`).test(text)) return "high";
    if (text.includes(projectSymbol)) return "medium";
    if (identity.name && text.includes(String(identity.name).toUpperCase())) return "low";
    return "low";
  }

  private parseDerivativePair(projectSymbol: string, normalizedSymbol: string): { base: string; quote: string; pair: string } | null {
    const symbol = normalizedSymbol.replace(/\s+/g, "");
    const quoteMatch = symbol.match(new RegExp(`^${this.escapeRegExp(projectSymbol)}[-_/]?(USDT|USD|USDC|PERP|PERPETUAL)`, "i"));
    if (!quoteMatch) return null;
    const quote = quoteMatch[1].toUpperCase().startsWith("PERP") ? "USD" : quoteMatch[1].toUpperCase();
    return {
      base: projectSymbol,
      quote,
      pair: `${projectSymbol}/${quote}`,
    };
  }

  private normalizeDerivativeSymbol(value: any): string {
    return String(value || "")
      .trim()
      .toUpperCase()
      .replace(/[:]/g, "")
      .replace(/\s+/g, " ");
  }

  private dedupeMarkets(markets: NormalizedExchangeMarket[]): NormalizedExchangeMarket[] {
    const byKey = new Map<string, NormalizedExchangeMarket>();
    for (const market of markets) {
      const current = byKey.get(market.sourceMarketKey);
      if (!current || this.marketSortValue(market) > this.marketSortValue(current)) {
        byKey.set(market.sourceMarketKey, market);
      }
    }
    return Array.from(byKey.values());
  }

  private normalizeOverviewType(value: any): FomoV2ExchangeOverviewType {
    if (value === "spot" || value === "dex" || value === "derivative") return value;
    return "all";
  }

  private normalizePage(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : 1;
  }

  private normalizeLimit(value: any, fallback = 50, max = 100): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.max(1, Math.min(max, Math.trunc(parsed)));
  }

  private toObjectId(value: any): Types.ObjectId | null {
    const id = this.toIdString(value);
    return mongoose.Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null;
  }

  private toIdString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value instanceof Types.ObjectId) return value.toHexString();
    if (value._id) return this.toIdString(value._id);
    return String(value);
  }

  private normalizeCoinGeckoId(value: any): string {
    return String(value || "").trim().toLowerCase();
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

  private normalizeSymbol(value: any): string {
    return String(value || "").trim().toUpperCase();
  }

  private toObjectIds(values: any): Types.ObjectId[] {
    if (!Array.isArray(values)) return [];
    return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)))
      .map((value) => this.toObjectId(value))
      .filter((value): value is Types.ObjectId => Boolean(value));
  }

  private cleanString(value: any): string | undefined {
    const text = String(value || "").trim();
    return text || undefined;
  }

  private cleanSlug(value: any): string | undefined {
    const text = this.cleanString(value);
    if (!text) return undefined;
    return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  private cleanObject<T extends Record<string, any>>(source: T): Partial<T> {
    const result: Partial<T> = {};
    for (const key of Object.keys(source || {}) as Array<keyof T>) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== "") result[key] = value;
    }
    return result;
  }

  private toFiniteNumber(value: any): number | undefined {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private toPositiveNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private sumNumbers(rows: any[], field: string): number {
    return (rows || []).reduce((sum, row) => sum + this.toPositiveNumber(row?.[field]), 0);
  }

  private hashObject(value: any): string {
    return createHash("sha1").update(JSON.stringify(value)).digest("hex");
  }

  private getPositiveInteger(key: string, fallback: number, max: number): number {
    const parsed = Number(this.configService.get(key) || process.env[key]);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.max(1, Math.min(max, Math.trunc(parsed)));
  }

  private pushExample(target: any[], item: any, limit = 10): void {
    if (target.length < limit) target.push(item);
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
