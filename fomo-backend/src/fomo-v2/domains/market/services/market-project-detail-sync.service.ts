import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { CoinGeckoCoinDetailsDto, MarketDataTier } from "src/coingecko/coingecko-market.types";
import { CoinGeckoProClientService } from "src/coingecko/coingecko-pro-client.service";
import { ExternalAssetMirrorUrlService } from "src/storage/external-asset-mirror-url.service";
import { FomoV2MarketProjectReadModel } from "../models";

export type FomoV2MarketProjectDetailSyncTier = MarketDataTier | "all";

export interface FomoV2MarketProjectDetailSyncOptions {
  dryRun?: boolean;
  tier?: FomoV2MarketProjectDetailSyncTier;
  limit?: number;
  offset?: number;
  coingeckoId?: string;
  marketAssetId?: string;
  onlyMissing?: boolean;
  delayMs?: number;
}

export interface FomoV2MarketProjectDetailSyncResult {
  dryRun: boolean;
  tier: FomoV2MarketProjectDetailSyncTier;
  limit: number;
  offset: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  scanned: number;
  requestsMade: number;
  wouldUpdate: number;
  updated: number;
  skippedNoCoingeckoId: number;
  errorsCount: number;
  errors: Array<{ coingeckoId?: string; marketAssetId?: string; message: string; status?: number }>;
  examples: any[];
}

interface DetailCandidate {
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
  logo?: string;
  coingeckoDetailsUpdatedAt?: Date;
}

@Injectable()
export class FomoV2MarketProjectDetailSyncService {
  private readonly logger = new Logger(FomoV2MarketProjectDetailSyncService.name);

  constructor(
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly readModel: Model<FomoV2MarketProjectReadModel>,
    private readonly configService: ConfigService,
    private readonly coinGeckoClient: CoinGeckoProClientService,
    private readonly mirrorUrlService: ExternalAssetMirrorUrlService,
  ) {}

  async sync(options: FomoV2MarketProjectDetailSyncOptions = {}): Promise<FomoV2MarketProjectDetailSyncResult> {
    const startedAt = new Date();
    const startedMs = Date.now();
    const dryRun = options.dryRun !== false;
    const tier = options.tier || "HOT";
    const limit = this.positiveInteger(options.limit, 50);
    const offset = this.nonNegativeInteger(options.offset, 0);
    const delayMs = this.nonNegativeInteger(
      options.delayMs,
      Number(this.configService.get("FOMO_V2_COINGECKO_DETAIL_SYNC_DELAY_MS") || 1200),
    );
    const result = this.emptyResult({ dryRun, tier, limit, offset, startedAt });

    if (!this.coinGeckoClient.isConfigured()) {
      throw new Error("COINGECKO_KEY is not configured");
    }

    const candidates = await this.loadCandidates({ ...options, tier, limit, offset });
    result.scanned = candidates.length;

    const operations: any[] = [];
    for (const candidate of candidates) {
      const coingeckoId = this.normalizeCoinGeckoId(options.coingeckoId || candidate.providerIds?.coingeckoId);
      if (!coingeckoId) {
        result.skippedNoCoingeckoId += 1;
        continue;
      }

      try {
        result.requestsMade += 1;
        const details = await this.coinGeckoClient.fetchCoinDetails(coingeckoId);
        const updateSet = await this.buildUpdateSet(details, coingeckoId, candidate.logo);
        if (!Object.keys(updateSet).length) continue;

        result.wouldUpdate += 1;
        this.pushExample(result.examples, {
          coingeckoId,
          marketAssetId: this.toIdString(candidate.marketAssetId),
          name: updateSet.name,
          symbol: updateSet.symbol,
          categories: updateSet.categories?.slice?.(0, 5),
          contracts: updateSet.contracts?.length || 0,
        });

        operations.push({
          updateOne: {
            filter: { _id: candidate._id },
            update: { $set: updateSet },
          },
        });
      } catch (error) {
        const item = {
          coingeckoId,
          marketAssetId: this.toIdString(candidate.marketAssetId),
          status: this.getHttpStatus(error),
          message: String(error?.message || error || "Unknown error"),
        };
        result.errorsCount += 1;
        if (result.errors.length < 25) result.errors.push(item);
        this.logger.warn(`FOMO v2 market detail sync failed coingeckoId=${coingeckoId}: ${item.message}`);
      }

      if (delayMs > 0) {
        await this.sleep(delayMs);
      }
    }

    if (!dryRun && operations.length) {
      result.updated = await this.bulkWrite(operations);
    }

    result.finishedAt = new Date().toISOString();
    result.durationMs = Date.now() - startedMs;
    return result;
  }

  private async loadCandidates(options: FomoV2MarketProjectDetailSyncOptions & {
    tier: FomoV2MarketProjectDetailSyncTier;
    limit: number;
    offset: number;
  }): Promise<DetailCandidate[]> {
    const query: Record<string, any> = {
      trading: "CURRENTLY_TRADING",
      status: "active",
    };
    const specific = Boolean(options.coingeckoId || options.marketAssetId);

    if (options.tier !== "all") query.tier = options.tier;
    if (options.marketAssetId) query.marketAssetId = this.parseObjectId(options.marketAssetId, "marketAssetId");

    const coingeckoId = this.normalizeCoinGeckoId(options.coingeckoId);
    if (coingeckoId) {
      query["providerIds.coingeckoId"] = coingeckoId;
    } else {
      query["providerIds.coingeckoId"] = { $type: "string", $ne: "" };
    }

    if (options.onlyMissing !== false && !specific) {
      query.$or = [
        { coingeckoDetailsUpdatedAt: { $exists: false } },
        { coingeckoDetailsUpdatedAt: null },
        { descriptionText: { $exists: false } },
        { categories: { $size: 0 } },
        { contracts: { $size: 0 } },
      ];
    }

    return this.readModel
      .find(query)
      .sort({ rank: 1, _id: 1 })
      .skip(options.offset)
      .limit(options.limit)
      .select("_id canonicalProjectId marketAssetId providerIds rank tier name symbol logo coingeckoDetailsUpdatedAt")
      .lean();
  }

  private async buildUpdateSet(
    details: CoinGeckoCoinDetailsDto,
    fallbackCoingeckoId: string,
    currentLogo?: string,
  ): Promise<Record<string, any>> {
    const now = new Date();
    const coingeckoId = this.normalizeCoinGeckoId(details.id || fallbackCoingeckoId);
    const categories = this.uniqueStrings(details.categories || []);
    const descriptionText = this.plainTextToHtml(details.description?.en);
    const links = this.buildLinks(details);
    const website = this.uniqueStrings(details.links?.homepage || []).filter((url) => this.isHttpUrl(url));
    const explorers = this.uniqueStrings(details.links?.blockchain_site || []).filter((url) => this.isHttpUrl(url));
    const socialmedia = this.buildSocialLinks(details);
    const contracts = this.buildContracts(details);
    const marketData = details.market_data || {};
    const athUsd = this.toFiniteNumber(marketData.ath?.usd);
    const atlUsd = this.toFiniteNumber(marketData.atl?.usd);
    const detailLogo = this.firstString(details.image?.large, details.image?.small, details.image?.thumb);
    const logo = await this.mirrorUrlService.preferMirroredUrl(detailLogo, currentLogo);

    const set = this.cleanObject({
      name: this.firstString(details.name),
      symbol: this.firstString(details.symbol)?.toUpperCase(),
      logo,
      category: categories[0],
      niche: categories[0] || this.firstString(details.symbol)?.toUpperCase(),
      categories,
      topCategories: categories.slice(0, 5),
      description: descriptionText,
      descriptionText,
      bio: this.shortText(details.description?.en, 280),
      website,
      explorers,
      socialmedia,
      links,
      contracts,
      athUsd,
      athUsdDate: this.toDate(marketData.ath_date?.usd),
      athUsdChangePercent: this.toFiniteNumber(marketData.ath_change_percentage?.usd),
      atlUsd,
      atlUsdDate: this.toDate(marketData.atl_date?.usd),
      atlUsdChangePercent: this.toFiniteNumber(marketData.atl_change_percentage?.usd),
      coingeckoDetailsUpdatedAt: now,
      coingeckoDetailsSource: "coingecko_coin_detail",
      "providerIds.coingeckoId": coingeckoId,
      "sourceCoverage.detailDataSource": "coingecko_coin_detail",
      "sourceCoverage.displaySource": "coingecko",
      "debug.latestCoinGeckoDetailSync": {
        coingeckoId,
        updatedAt: now,
        categories: categories.length,
        contracts: contracts.length,
      },
    });

    if (!contracts.length) delete set.contracts;
    if (!categories.length) {
      delete set.categories;
      delete set.topCategories;
      delete set.category;
    }
    if (!website.length) delete set.website;
    if (!explorers.length) delete set.explorers;
    if (!socialmedia.length) delete set.socialmedia;
    if (!links.length) delete set.links;

    return set;
  }

  private buildContracts(details: CoinGeckoCoinDetailsDto): any[] {
    const rows: any[] = [];
    const detailPlatforms = details.detail_platforms || {};
    const platforms = details.platforms || {};

    for (const [chainKey, detail] of Object.entries(detailPlatforms)) {
      const address = this.firstString(detail?.contract_address, platforms[chainKey]);
      if (!address) continue;
      rows.push(this.contractRow(chainKey, address, "coingecko_detail_platforms"));
    }

    for (const [chainKey, address] of Object.entries(platforms)) {
      if (!this.firstString(address)) continue;
      rows.push(this.contractRow(chainKey, address, "coingecko_platforms"));
    }

    const seen = new Set<string>();
    const result: any[] = [];
    for (const row of rows) {
      const key = `${row.chainKey}:${String(row.contract).toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(row);
    }

    return result;
  }

  private contractRow(chainKey: string, address: string, source: string): any {
    return {
      chainKey,
      chain: chainKey,
      network: chainKey,
      networkName: this.humanizeChainName(chainKey),
      networkImage: "",
      contract: address,
      address,
      source,
      verified: true,
    };
  }

  private buildLinks(details: CoinGeckoCoinDetailsDto): any[] {
    const result: any[] = [];
    const links = details.links || {};
    const add = (type: string, values: any, label?: string) => {
      const list = Array.isArray(values) ? values : [values];
      for (const value of list) {
        const url = this.firstString(value);
        if (!url || !this.isHttpUrl(url)) continue;
        result.push({ type, url, label: label || type, source: "coingecko", verified: true });
      }
    };

    add("website", links.homepage, "Website");
    add("explorer", links.blockchain_site, "Explorer");
    add("community", links.chat_url, "Community");
    add("community", links.official_forum_url, "Forum");
    add("community", links.announcement_url, "Announcement");
    add("github", links.repos_url?.github, "GitHub");
    add("github", links.repos_url?.bitbucket, "Bitbucket");
    if (links.twitter_screen_name) add("twitter", `https://x.com/${links.twitter_screen_name}`, "X");
    if (links.telegram_channel_identifier) add("telegram", `https://t.me/${links.telegram_channel_identifier}`, "Telegram");
    if (links.subreddit_url) add("reddit", links.subreddit_url, "Reddit");

    return this.uniqueLinks(result);
  }

  private buildSocialLinks(details: CoinGeckoCoinDetailsDto): any[] {
    return this.buildLinks(details)
      .filter((link) => link.type !== "explorer")
      .map((link) => ({
        href: link.url,
        name: link.label || link.type,
        type: link.type,
        verified: link.verified,
      }));
  }

  private uniqueLinks(items: any[]): any[] {
    const seen = new Set<string>();
    const result: any[] = [];
    for (const item of items || []) {
      const url = this.firstString(item.url);
      if (!url) continue;
      const key = url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(item);
    }
    return result;
  }

  private async bulkWrite(operations: any[]): Promise<number> {
    let updated = 0;
    for (const chunk of this.chunk(operations, 250)) {
      const result = await this.readModel.bulkWrite(chunk, { ordered: false });
      updated += Number((result as any).modifiedCount || 0) + Number((result as any).upsertedCount || 0);
    }
    return updated;
  }

  private emptyResult(params: {
    dryRun: boolean;
    tier: FomoV2MarketProjectDetailSyncTier;
    limit: number;
    offset: number;
    startedAt: Date;
  }): FomoV2MarketProjectDetailSyncResult {
    return {
      dryRun: params.dryRun,
      tier: params.tier,
      limit: params.limit,
      offset: params.offset,
      startedAt: params.startedAt.toISOString(),
      finishedAt: "",
      durationMs: 0,
      scanned: 0,
      requestsMade: 0,
      wouldUpdate: 0,
      updated: 0,
      skippedNoCoingeckoId: 0,
      errorsCount: 0,
      errors: [],
      examples: [],
    };
  }

  private parseObjectId(value: string, field: string): mongoose.Types.ObjectId {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error(`Invalid ${field}=${value}. Expected Mongo ObjectId.`);
    }
    return new mongoose.Types.ObjectId(value);
  }

  private getHttpStatus(error: any): number | undefined {
    const status = Number(error?.response?.status);
    return Number.isFinite(status) ? status : undefined;
  }

  private firstString(...values: any[]): string | undefined {
    for (const value of values) {
      const text = String(value || "").trim();
      if (text) return text;
    }
    return undefined;
  }

  private uniqueStrings(values: any[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const value of values || []) {
      const text = this.firstString(value);
      if (!text) continue;
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(text);
    }
    return result;
  }

  private plainTextToHtml(value: any): string | undefined {
    const text = this.stripHtml(value);
    if (!text) return undefined;
    return text
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${this.escapeHtml(paragraph.trim()).replace(/\n/g, "<br />")}</p>`)
      .join("");
  }

  private shortText(value: any, maxLength: number): string | undefined {
    const text = this.stripHtml(value).replace(/\s+/g, " ").trim();
    if (!text) return undefined;
    if (text.length <= maxLength) return text;
    return `${text.slice(0, maxLength).trim()}...`;
  }

  private stripHtml(value: any): string {
    return String(value || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .trim();
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  private humanizeChainName(value: any): string {
    return (this.firstString(value) || "Contract")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private isHttpUrl(value: any): boolean {
    return /^https?:\/\//i.test(String(value || "").trim());
  }

  private toFiniteNumber(value: any): number | undefined {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }

  private toIdString(value: any): string | undefined {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    if (value instanceof mongoose.Types.ObjectId) return value.toHexString();
    if (value._id) return this.toIdString(value._id);
    return String(value);
  }

  private normalizeCoinGeckoId(value: any): string {
    return String(value || "").trim().toLowerCase();
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
  }

  private nonNegativeInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
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

  private pushExample(target: any[], item: any): void {
    if (target.length < 10) target.push(item);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
