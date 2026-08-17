import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectConnection } from "@nestjs/mongoose";
import axios from "axios";
import { Connection } from "mongoose";

import { AppCacheService } from "src/common/cache/cache.service";
import { INFO_MARKET_CACHE_COLLECTION } from "./info.constants";
import { InfoMarketData } from "./models/info.models";

const PRICES_CACHE_KEY = "info:market:prices";
const MARKET_CACHE_KEY = "info:market:data";

@Injectable()
export class InfoMarketService {
  private readonly logger = new Logger(InfoMarketService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly cache: AppCacheService,
    private readonly config: ConfigService
  ) {}

  async getPrices(force = false): Promise<Record<string, unknown>[]> {
    if (force) return this.fetchPricesWithFallback(true);
    return this.cache.wrap({
      key: PRICES_CACHE_KEY,
      ttl: this.cacheTtl,
      factory: () => this.fetchPricesWithFallback(false),
    });
  }

  async getMarketData(force = false): Promise<InfoMarketData> {
    if (force) return this.fetchMarketWithFallback(true);
    return this.cache.wrap({
      key: MARKET_CACHE_KEY,
      ttl: this.cacheTtl,
      factory: () => this.fetchMarketWithFallback(false),
    });
  }

  async refresh(): Promise<Record<string, unknown>> {
    await Promise.all([
      this.cache.del(PRICES_CACHE_KEY),
      this.cache.del(MARKET_CACHE_KEY),
      this.collection().deleteMany({
        type: { $in: ["prices", "market_data"] },
      }),
    ]);
    const [prices, market_data] = await Promise.all([
      this.getPrices(true),
      this.getMarketData(true),
    ]);
    return {
      message: "Cache refreshed",
      updated_at: new Date().toISOString(),
      prices,
      market_data,
    };
  }

  private async fetchPricesWithFallback(
    force: boolean
  ): Promise<Record<string, unknown>[]> {
    const stored = await this.readStored<Record<string, unknown>[]>("prices");
    if (!force && this.isFresh(stored?.updated_at)) {
      return stored.data;
    }
    try {
      const response = await axios.get(
        `${this.coingeckoBaseUrl}/coins/markets`,
        {
          params: {
            vs_currency: "usd",
            ids: this.coinIds,
            order: "market_cap_desc",
            per_page: 100,
            page: 1,
            sparkline: true,
            price_change_percentage: "1h,24h,7d",
          },
          headers: this.coingeckoHeaders,
          timeout: this.timeoutMs,
        }
      );
      const data = Array.isArray(response.data) ? response.data : [];
      if (!data.length) throw new Error("CoinGecko returned no prices");
      await this.store("prices", data);
      return data;
    } catch (error) {
      this.logger.warn(
        `Info price refresh failed: ${(error as Error)?.message || error}`
      );
      return stored?.data || [];
    }
  }

  private async fetchMarketWithFallback(
    force: boolean
  ): Promise<InfoMarketData> {
    const stored = await this.readStored<InfoMarketData>("market_data");
    if (!force && this.isFresh(stored?.updated_at)) {
      return stored.data;
    }
    try {
      const [pricesResponse, fearGreedResponse, globalResponse] =
        await Promise.all([
          axios.get(`${this.coingeckoBaseUrl}/simple/price`, {
            params: {
              ids: this.coinIds,
              vs_currencies: "usd",
              include_24hr_change: true,
            },
            headers: this.coingeckoHeaders,
            timeout: this.timeoutMs,
          }),
          axios.get("https://api.alternative.me/fng/", {
            timeout: this.timeoutMs,
          }),
          axios.get(`${this.coingeckoBaseUrl}/global`, {
            headers: this.coingeckoHeaders,
            timeout: this.timeoutMs,
          }),
        ]);

      const priceMap = pricesResponse.data || {};
      const names: Record<string, string> = {
        bitcoin: "Bitcoin",
        ethereum: "Ethereum",
        zksync: "zkSync",
      };
      const symbols: Record<string, string> = {
        bitcoin: "btc",
        ethereum: "eth",
        zksync: "zk",
      };
      const coins = this.coinIds.split(",").flatMap((id) => {
        const value = priceMap[id];
        if (!value || !Number.isFinite(Number(value.usd))) return [];
        return [
          {
            id,
            symbol: symbols[id] || id,
            name: names[id] || id,
            current_price: Number(value.usd),
            price_change_percentage_24h: Number(value.usd_24h_change || 0),
          },
        ];
      });
      if (!coins.length) throw new Error("CoinGecko returned no market data");

      const fearGreed = Number(fearGreedResponse.data?.data?.[0]?.value || 40);
      const btcDominance = Number(
        globalResponse.data?.data?.market_cap_percentage?.btc || 57
      );
      const result: InfoMarketData = {
        coins,
        indices: {
          fear_greed: this.clampIndex(fearGreed),
          altcoin_season: this.clampIndex((100 - btcDominance) * 0.75),
        },
        updated_at: new Date().toISOString(),
        source: "coingecko",
      };
      await this.store("market_data", result);
      return result;
    } catch (error) {
      this.logger.warn(
        `Info market refresh failed: ${(error as Error)?.message || error}`
      );
      if (stored?.data) {
        return {
          ...stored.data,
          is_fallback: true,
        };
      }
      return {
        coins: [],
        indices: {
          fear_greed: 40,
          altcoin_season: 33,
        },
        updated_at: new Date().toISOString(),
        source: "unavailable",
        is_fallback: true,
      };
    }
  }

  private async readStored<T>(
    type: string
  ): Promise<{ data: T; updated_at?: Date | string } | undefined> {
    const document = await this.collection().findOne({ type });
    return document?.data
      ? {
          data: document.data as T,
          updated_at: document.updated_at,
        }
      : undefined;
  }

  private isFresh(updatedAt: unknown): boolean {
    const timestamp = new Date(String(updatedAt || "")).getTime();
    return (
      Number.isFinite(timestamp) &&
      Date.now() - timestamp < this.cacheTtl * 1_000
    );
  }

  private async store(type: string, data: unknown): Promise<void> {
    await this.collection().updateOne(
      { type },
      {
        $set: {
          type,
          data,
          updated_at: new Date(),
        },
      },
      { upsert: true }
    );
  }

  private clampIndex(input: number): number {
    return Math.round(Math.max(0, Math.min(100, Number(input) || 0)));
  }

  private get cacheTtl(): number {
    const parsed = Number(
      this.config.get<string>("INFO_MARKET_CACHE_TTL_SECONDS") || 1_800
    );
    return Number.isFinite(parsed)
      ? Math.max(60, Math.min(86_400, Math.trunc(parsed)))
      : 1_800;
  }

  private get timeoutMs(): number {
    const parsed = Number(
      this.config.get<string>("INFO_MARKET_TIMEOUT_MS") || 10_000
    );
    return Number.isFinite(parsed)
      ? Math.max(1_000, Math.min(30_000, Math.trunc(parsed)))
      : 10_000;
  }

  private get coinIds(): string {
    return (
      this.config.get<string>("INFO_MARKET_COIN_IDS") ||
      "bitcoin,ethereum,zksync"
    )
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 25)
      .join(",");
  }

  private get coingeckoBaseUrl(): string {
    return (
      this.config.get<string>("INFO_COINGECKO_BASE_URL") ||
      "https://api.coingecko.com/api/v3"
    ).replace(/\/+$/, "");
  }

  private get coingeckoHeaders(): Record<string, string> {
    const key = this.config.get<string>("INFO_COINGECKO_API_KEY")?.trim();
    return key ? { "x-cg-demo-api-key": key } : {};
  }

  private collection(): any {
    if (!this.connection.db) throw new Error("MongoDB connection is not ready");
    return this.connection.db.collection(INFO_MARKET_CACHE_COLLECTION);
  }
}
