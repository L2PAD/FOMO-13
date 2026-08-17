import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import {
  CoinGeckoApiUsageDto,
  CoinGeckoListCoinDto,
  CoinGeckoCoinDetailsDto,
  CoinGeckoMarketChartDto,
  CoinGeckoMarketDto,
  CoinGeckoDerivativeDto,
  CoinGeckoSearchResponseDto,
  CoinGeckoTickersResponseDto,
} from "./coingecko-market.types";

@Injectable()
export class CoinGeckoProClientService {
  private readonly logger = new Logger(CoinGeckoProClientService.name);
  private readonly baseUrl = "https://pro-api.coingecko.com/api/v3";
  private readonly maxBatchSize = 250;
  private readonly batchSize: number;
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    this.batchSize = this.resolveMarketsBatchSize();
    const apiKey = this.getApiKey();
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: Number(this.configService.get("COINGECKO_TIMEOUT_MS") || 15000),
      headers: apiKey
        ? {
          "x-cg-pro-api-key": apiKey,
          Accept: "application/json",
        }
        : {
          Accept: "application/json",
        },
    });
  }

  isConfigured(): boolean {
    return Boolean(this.getApiKey());
  }

  getMaxBatchSize(): number {
    return this.batchSize;
  }

  async fetchMarketsBatch(ids: string[]): Promise<CoinGeckoMarketDto[]> {
    const uniqueIds = this.uniqueIds(ids);
    if (!uniqueIds.length) return [];
    if (uniqueIds.length > this.maxBatchSize) {
      throw new Error(
        `CoinGecko markets batch is too large: ${uniqueIds.length}. Max ${this.maxBatchSize}.`,
      );
    }
    if (!this.isConfigured()) {
      throw new Error("COINGECKO_KEY is not configured");
    }

    const response = await this.client.get<CoinGeckoMarketDto[]>("/coins/markets", {
      params: {
        vs_currency: "usd",
        ids: uniqueIds.join(","),
        order: "market_cap_desc",
        per_page: uniqueIds.length,
        page: 1,
        sparkline: true,
        price_change_percentage: "1h,24h,7d",
      },
    });

    if (!Array.isArray(response.data)) {
      this.logger.warn("CoinGecko /coins/markets returned a non-array response");
      return [];
    }

    return response.data;
  }

  async fetchMarketsPage(params: { page?: number; perPage?: number } = {}): Promise<CoinGeckoMarketDto[]> {
    if (!this.isConfigured()) {
      throw new Error("COINGECKO_KEY is not configured");
    }

    const perPage = Math.max(1, Math.min(this.maxBatchSize, Math.trunc(Number(params.perPage || 100))));
    const page = Math.max(1, Math.trunc(Number(params.page || 1)));
    const response = await this.client.get<CoinGeckoMarketDto[]>("/coins/markets", {
      params: {
        vs_currency: "usd",
        order: "market_cap_desc",
        per_page: perPage,
        page,
        sparkline: true,
        price_change_percentage: "1h,24h,7d",
      },
    });

    if (!Array.isArray(response.data)) {
      this.logger.warn("CoinGecko /coins/markets returned a non-array response");
      return [];
    }

    return response.data;
  }

  async fetchCoinsList(includePlatforms = true): Promise<CoinGeckoListCoinDto[]> {
    if (!this.isConfigured()) {
      throw new Error("COINGECKO_KEY is not configured");
    }

    const response = await this.client.get<CoinGeckoListCoinDto[]>("/coins/list", {
      params: {
        include_platform: includePlatforms,
      },
    });

    if (!Array.isArray(response.data)) {
      this.logger.warn("CoinGecko /coins/list returned a non-array response");
      return [];
    }

    return response.data;
  }

  async fetchMarketChart(
    id: string,
    days: string | number = "max",
    interval?: string,
    vsCurrency = "usd",
  ): Promise<CoinGeckoMarketChartDto> {
    const normalizedId = this.normalizeCoinGeckoId(id);
    if (!normalizedId) return { prices: [], market_caps: [], total_volumes: [] };
    if (!this.isConfigured()) {
      throw new Error("COINGECKO_KEY is not configured");
    }

    const params: Record<string, any> = {
      vs_currency: this.normalizeVsCurrency(vsCurrency),
      days,
    };
    if (interval) params.interval = interval;

    const response = await this.client.get<CoinGeckoMarketChartDto>(
      `/coins/${encodeURIComponent(normalizedId)}/market_chart`,
      { params },
    );
    const data = response.data || {};

    return {
      prices: Array.isArray(data.prices) ? data.prices : [],
      market_caps: Array.isArray(data.market_caps) ? data.market_caps : [],
      total_volumes: Array.isArray(data.total_volumes) ? data.total_volumes : [],
    };
  }

  async fetchMarketChartRange(
    id: string,
    fromUnixSeconds: number,
    toUnixSeconds: number,
    vsCurrency = "usd",
  ): Promise<CoinGeckoMarketChartDto> {
    const normalizedId = this.normalizeCoinGeckoId(id);
    if (!normalizedId) return { prices: [], market_caps: [], total_volumes: [] };
    if (!this.isConfigured()) {
      throw new Error("COINGECKO_KEY is not configured");
    }

    const response = await this.client.get<CoinGeckoMarketChartDto>(
      `/coins/${encodeURIComponent(normalizedId)}/market_chart/range`,
      {
        params: {
          vs_currency: this.normalizeVsCurrency(vsCurrency),
          from: Math.trunc(fromUnixSeconds),
          to: Math.trunc(toUnixSeconds),
        },
      },
    );
    const data = response.data || {};

    return {
      prices: Array.isArray(data.prices) ? data.prices : [],
      market_caps: Array.isArray(data.market_caps) ? data.market_caps : [],
      total_volumes: Array.isArray(data.total_volumes) ? data.total_volumes : [],
    };
  }

  async fetchCoinDetails(id: string): Promise<CoinGeckoCoinDetailsDto> {
    const normalizedId = this.normalizeCoinGeckoId(id);
    if (!normalizedId) return {};
    if (!this.isConfigured()) {
      throw new Error("COINGECKO_KEY is not configured");
    }

    const response = await this.client.get<CoinGeckoCoinDetailsDto>(
      `/coins/${encodeURIComponent(normalizedId)}`,
      {
        params: {
          localization: false,
          tickers: false,
          market_data: true,
          community_data: false,
          developer_data: false,
          sparkline: false,
        },
      },
    );

    return response.data || {};
  }

  async search(query: string): Promise<CoinGeckoSearchResponseDto> {
    const normalizedQuery = String(query || "").trim();
    if (!normalizedQuery) return { coins: [] };
    if (!this.isConfigured()) {
      throw new Error("COINGECKO_KEY is not configured");
    }

    const response = await this.client.get<CoinGeckoSearchResponseDto>("/search", {
      params: { query: normalizedQuery },
    });

    return response.data || { coins: [] };
  }

  async getCoinTickers(
    coingeckoId: string,
    params?: {
      page?: number;
      includeExchangeLogo?: boolean;
      depth?: boolean;
      order?: "volume_desc" | "trust_score_desc";
    },
  ): Promise<CoinGeckoTickersResponseDto> {
    const normalizedId = this.normalizeCoinGeckoId(coingeckoId);
    if (!normalizedId) return { tickers: [] };
    if (!this.isConfigured()) {
      throw new Error("COINGECKO_KEY is not configured");
    }

    const queryParams: Record<string, any> = {
      include_exchange_logo: params?.includeExchangeLogo ?? true,
      order: params?.order || "volume_desc",
      page: params?.page || 1,
    };

    if (params?.depth !== undefined) {
      queryParams.depth = params.depth;
    }

    const response = await this.client.get<CoinGeckoTickersResponseDto>(
      `/coins/${encodeURIComponent(normalizedId)}/tickers`,
      { params: queryParams },
    );

    const data = response.data || {};
    return {
      ...data,
      tickers: Array.isArray(data.tickers) ? data.tickers : [],
    };
  }

  async fetchDerivatives(): Promise<CoinGeckoDerivativeDto[]> {
    if (!this.isConfigured()) {
      throw new Error("COINGECKO_KEY is not configured");
    }

    const response = await this.client.get<CoinGeckoDerivativeDto[]>("/derivatives", {
      params: {
        include_tickers: "unexpired",
      },
    });

    if (!Array.isArray(response.data)) {
      this.logger.warn("CoinGecko /derivatives returned a non-array response");
      return [];
    }

    return response.data;
  }

  async fetchApiUsage(): Promise<CoinGeckoApiUsageDto> {
    if (!this.isConfigured()) {
      throw new Error("COINGECKO_KEY is not configured");
    }

    const response = await this.client.get<CoinGeckoApiUsageDto>("/key");
    return response.data || {};
  }

  private getApiKey(): string {
    return String(this.configService.get("COINGECKO_KEY") || process.env.COINGECKO_KEY || "").trim();
  }

  private resolveMarketsBatchSize(): number {
    const parsed = Number(
      this.configService.get("COINGECKO_MARKETS_BATCH_SIZE") ||
      process.env.COINGECKO_MARKETS_BATCH_SIZE ||
      this.maxBatchSize,
    );

    if (!Number.isFinite(parsed) || parsed <= 0) return this.maxBatchSize;

    return Math.max(1, Math.min(this.maxBatchSize, Math.trunc(parsed)));
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

  private normalizeCoinGeckoId(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  private normalizeVsCurrency(value: any): string {
    return String(value || "usd")
      .trim()
      .toLowerCase() || "usd";
  }
}
