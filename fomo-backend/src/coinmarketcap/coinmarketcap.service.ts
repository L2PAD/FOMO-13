import { Injectable, Logger } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectModel } from "@nestjs/mongoose";
import {
  Coinmarketcap,
  CoinmarketcapDocument,
  StatisticType,
} from "./models/coinmarketcap.model";
import { Model } from "mongoose";
import { ConfigService } from "@nestjs/config";
import * as cheerio from "cheerio";
import axios from "axios";

const COINMARKETCAP_STATISTICS_DOCUMENT_ID = "69244408e4c4a8d5e09fc8c1";
const HISTORY_LOOKBACK_LIMIT = 72;
const HISTORY_STORAGE_LIMIT = 720;

@Injectable()
export class CoinMarketCapService {
  private readonly coinGeckoProApiUrl = "https://pro-api.coingecko.com/api/v3";
  private readonly coinGeckoPublicApiUrl = "https://api.coingecko.com/api/v3";
  private readonly fearAndGreedApiUrl = "https://api.alternative.me/fng/";
  private readonly logger = new Logger(CoinMarketCapService.name);

  constructor(
    @InjectModel(Coinmarketcap.name)
    private coinmarketcapModel: Model<CoinmarketcapDocument>,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {
    // this.fetchAltcoinSeasonIndex();
    // this.fetchSP500AndGoldPrices();
    // this.getTopCoinPrice()
    // this.handleCron();
    // this.clearDB()
  }

  private getCoinGeckoApiKey(): string {
    return String(
      this.configService.get("COINGECKO_KEY") || process.env.COINGECKO_KEY || ""
    ).trim();
  }

  private getCoinGeckoBaseUrl(): string {
    return this.getCoinGeckoApiKey()
      ? this.coinGeckoProApiUrl
      : this.coinGeckoPublicApiUrl;
  }

  private getCoinGeckoHeaders(): Record<string, string> {
    const apiKey = this.getCoinGeckoApiKey();

    return apiKey
      ? {
        "x-cg-pro-api-key": apiKey,
        Accept: "application/json",
      }
      : {
        Accept: "application/json",
      };
  }

  private toNumber(value: any, fallback = 0): number {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
      return 0;
    }

    return ((current - previous) / previous) * 100;
  }

  private findClosestByDate<T extends { date?: Date | string }>(
    items: T[] | undefined,
    targetDate: Date
  ): T | null {
    if (!items?.length) return null;

    return items.reduce((prev, curr) => {
      const prevDiff = Math.abs(
        new Date(prev.date || 0).getTime() - targetDate.getTime()
      );
      const currDiff = Math.abs(
        new Date(curr.date || 0).getTime() - targetDate.getTime()
      );
      return currDiff < prevDiff ? curr : prev;
    });
  }

  private getLatestDate(items: Array<{ date?: Date | string }> | undefined): Date | null {
    if (!items?.length) return null;

    return items.reduce<Date | null>((latest, item) => {
      const date = new Date(item?.date || 0);
      if (Number.isNaN(date.getTime())) return latest;

      return !latest || date > latest ? date : latest;
    }, null);
  }

  private getUtcHourBucketMs(date: Date): number {
    const bucket = new Date(date);
    bucket.setUTCMinutes(0, 0, 0);
    return bucket.getTime();
  }

  private shouldAppendHourlyHistory(
    record: CoinmarketcapDocument | null,
    now: Date
  ): boolean {
    const latestHistoryDate = this.getLatestDate(record?.history as any);
    if (!latestHistoryDate) return true;

    return (
      this.getUtcHourBucketMs(latestHistoryDate) <
      this.getUtcHourBucketMs(now)
    );
  }

  async getGlobalMetricsQuotesHistorical(convert: string) {
    return this.getGlobalMetricsFromCoinGecko(convert);
  }

  async getGlobalMetricsFromCoinGecko(convert = "USD") {
    const normalizedConvert = String(convert || "USD").toUpperCase();
    const currencyKey = normalizedConvert.toLowerCase();
    const url = `${this.getCoinGeckoBaseUrl()}/global`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, { headers: this.getCoinGeckoHeaders() })
      );

      const globalData = response.data?.data || {};
      const totalMarketCap = this.toNumber(
        globalData?.total_market_cap?.[currencyKey]
      );
      const totalVolume = this.toNumber(globalData?.total_volume?.[currencyKey]);
      const btcDominance = this.toNumber(globalData?.market_cap_percentage?.btc);
      const ethDominance = this.toNumber(globalData?.market_cap_percentage?.eth);
      const activeCryptocurrencies = this.toNumber(
        globalData?.active_cryptocurrencies
      );
      const activeExchanges = this.toNumber(globalData?.markets);
      const marketCapChange24h = this.toNumber(
        globalData?.market_cap_change_percentage_24h_usd
      );
      const volumeChange24h = this.toNumber(
        globalData?.volume_change_percentage_24h_usd
      );
      const altcoinMarketCap =
        totalMarketCap - (btcDominance / 100) * totalMarketCap;
      const quote = {
        total_market_cap: totalMarketCap,
        total_volume_24h: totalVolume,
        total_volume_24h_reported: totalVolume,
        total_market_cap_yesterday_percentage_change: marketCapChange24h,
        total_volume_24h_yesterday_percentage_change: volumeChange24h,
      };

      return {
        data: {
          active_cryptocurrencies: activeCryptocurrencies,
          total_cryptocurrencies: activeCryptocurrencies,
          active_market_pairs: 0,
          active_exchanges: activeExchanges,
          total_exchanges: activeExchanges,
          eth_dominance: ethDominance,
          btc_dominance: btcDominance,
          eth_dominance_yesterday: 0,
          btc_dominance_yesterday: 0,
          eth_dominance_24h_percentage_change: 0,
          btc_dominance_24h_percentage_change: 0,
          defi_volume_24h: 0,
          defi_volume_24h_reported: 0,
          defi_market_cap: 0,
          defi_24h_percentage_change: 0,
          stablecoin_volume_24h: 0,
          stablecoin_volume_24h_reported: 0,
          stablecoin_market_cap: 0,
          stablecoin_24h_percentage_change: 0,
          derivatives_volume_24h: 0,
          derivatives_volume_24h_reported: 0,
          derivatives_24h_percentage_change: 0,
          total_market_cap: totalMarketCap,
          total_volume_24h: totalVolume,
          total_volume_24h_reported: totalVolume,
          total_market_cap_yesterday_percentage_change: marketCapChange24h,
          total_volume_24h_yesterday_percentage_change: volumeChange24h,
          altcoin_volume_24h: 0,
          altcoin_volume_24h_reported: 0,
          altcoin_market_cap: altcoinMarketCap,
          market_cap_change_percentage_24h_usd: marketCapChange24h,
          volume_change_percentage_24h_usd: volumeChange24h,
          quote: {
            [normalizedConvert]: quote,
          },
          source: "coingecko",
          updated_at: globalData?.updated_at
            ? new Date(globalData.updated_at * 1000).toISOString()
            : new Date().toISOString(),
        },
      };
    } catch (error) {
      console.log(error);
      this.logger.error("Error fetching global data from CoinGecko", error);
      throw error;
    }
  }

  async getFearAndGreedLatest() {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.fearAndGreedApiUrl, {
          params: { limit: 1, format: "json" },
          headers: { Accept: "application/json" },
        })
      );

      const latest = response.data?.data?.[0] || {};
      const timestamp = this.toNumber(latest?.timestamp);

      return {
        data: {
          value: this.toNumber(latest?.value),
          value_classification: String(latest?.value_classification || ""),
          update_time: timestamp
            ? new Date(timestamp * 1000).toISOString()
            : new Date().toISOString(),
        },
      };
    } catch (error) {
      console.log(error);
      this.logger.error("Error fetching Fear & Greed data", error);

      return {
        data: {
          value: 0,
          value_classification: "",
          update_time: new Date().toISOString(),
        },
      };
    }
  }

  async getTopCoinPrice() {
    const url = `${this.getCoinGeckoBaseUrl()}/simple/price`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: {
            ids: "bitcoin,ethereum,solana",
            vs_currencies: "usd",
            include_24hr_change: true,
          },
          headers: this.getCoinGeckoHeaders(),
        })
      );

      return response.data;
    } catch (error) {
      console.log(error);
      this.logger.error("Error fetching top coin prices from CoinGecko", error);
      throw error;
    }
  }

  async getStatistics(): Promise<any> {
    const result = await this.coinmarketcapModel.aggregate([
      {
        $project: {
          data: 1,
          history: {
            $slice: [
              {
                $map: {
                  input: "$history",
                  as: "item",
                  in: {
                    total_market_cap: "$$item.total_market_cap",
                    date: "$$item.date",
                  },
                },
              },
              -100,
            ],
          },

          marketCapWithoutBTCHistory: {
            $slice: [
              {
                $map: {
                  input: "$marketCapWithoutBTCHistory",
                  as: "item",
                  in: {
                    marketCapWithoutBTC: "$$item.marketCapWithoutBTC",
                    date: "$$item.date",
                  },
                },
              },
              -100,
            ],
          },
        },
      },
      { $limit: 1 },
    ]);

    return result[0] ?? {};
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    const convert = "USD";

    try {
      if (process.env.IS_LOCAL_RUN === "true") return;

      const data = await this.getGlobalMetricsQuotesHistorical(convert);
      const res = await this.getFearAndGreedLatest();
      const altcoinSeasonIndex = await this.fetchAltcoinSeasonIndex();
      const priceData = await this.fetchSP500AndGoldPrices();
      const topCoinsPrice = await this.getTopCoinPrice();

      const totalMarketCap = data?.data?.quote?.USD?.total_market_cap || 0;
      const btcDominancePercent = data?.data?.btc_dominance || 0;

      const btcCap = (btcDominancePercent / 100) * totalMarketCap;

      const marketCapWithoutBTC = totalMarketCap - btcCap;

      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const record = await this.coinmarketcapModel
        .findOne(
          {},
          {
            history: { $slice: -HISTORY_LOOKBACK_LIMIT },
            marketCapWithoutBTCHistory: { $slice: -HISTORY_LOOKBACK_LIMIT },
          }
        )
        .lean()
        .exec();
      const closestStatisticsRecord = this.findClosestByDate<any>(
        record?.history as any,
        yesterday
      );

      let marketCapWithoutBTCChange = 0;

      const closestMarketCapWithoutBTCRecord = this.findClosestByDate<any>(
        record?.marketCapWithoutBTCHistory as any,
        yesterday
      );

      if (closestMarketCapWithoutBTCRecord?.marketCapWithoutBTC) {
        marketCapWithoutBTCChange = this.calculatePercentageChange(
          marketCapWithoutBTC,
          closestMarketCapWithoutBTCRecord.marketCapWithoutBTC
        );
      }

      const ethDominancePercent = this.toNumber(data?.data?.eth_dominance);
      const btcDominanceYesterday = this.toNumber(
        closestStatisticsRecord?.btc_dominance
      );
      const ethDominanceYesterday = this.toNumber(
        closestStatisticsRecord?.eth_dominance
      );
      const btcDominance24hChange = this.calculatePercentageChange(
        btcDominancePercent,
        btcDominanceYesterday
      );
      const ethDominance24hChange = this.calculatePercentageChange(
        ethDominancePercent,
        ethDominanceYesterday
      );

      const updatedStatistics: StatisticType = {
        ...data.data,
        ...data.data.quote.USD,
        fear_and_greed: res?.data,
        date: now,
        goldPrice: priceData.gold.price || 0,
        goldPriceChange: priceData.gold.change || 0,
        spPrice: priceData.sp500.price || 0,
        spPriceChange: priceData.sp500.change || 0,
        altcoinSeasonIndex: altcoinSeasonIndex || 0,
        btc_dominance_yesterday: btcDominanceYesterday,
        eth_dominance_yesterday: ethDominanceYesterday,
        btc_dominance_24h_percentage_change: btcDominance24hChange,
        eth_dominance_24h_percentage_change: ethDominance24hChange,
        marketCapWithoutBTC,
        marketCapWithoutBTCChange,
        ethereumPrice: topCoinsPrice?.ethereum?.usd || 0,
        ethereumPriceChange: topCoinsPrice?.ethereum?.usd_24h_change || 0,
        bitcoinPrice: topCoinsPrice?.bitcoin?.usd || 0,
        bitcoinPriceChange: topCoinsPrice?.bitcoin?.usd_24h_change || 0,
        solanaPrice: topCoinsPrice?.solana?.usd || 0,
        solanaPriceChange: topCoinsPrice?.solana?.usd_24h_change || 0,
      };

      if (altcoinSeasonIndex !== null) {
        updatedStatistics.altcoinSeasonIndex = altcoinSeasonIndex;
      }

      const updateQuery: Record<string, any> = {
        $set: { data: updatedStatistics },
      };

      const shouldAppendHistory = this.shouldAppendHourlyHistory(
        record as any,
        now
      );

      updateQuery.$push = {
        history: {
          $each: shouldAppendHistory ? [updatedStatistics] : [],
          $slice: -HISTORY_STORAGE_LIMIT,
        },
        marketCapWithoutBTCHistory: {
          $each: shouldAppendHistory
            ? [
                {
                  date: updatedStatistics.date,
                  marketCapWithoutBTC: updatedStatistics.marketCapWithoutBTC,
                },
              ]
            : [],
          $slice: -HISTORY_STORAGE_LIMIT,
        },
      };

      const targetDocumentId =
        record?._id || COINMARKETCAP_STATISTICS_DOCUMENT_ID;

      const updateResult = await this.coinmarketcapModel.updateOne(
        { _id: targetDocumentId },
        updateQuery,
        { upsert: true }
      );

      if (!updateResult.acknowledged) {
        this.logger.warn("CoinMarketCap statistics update was not acknowledged");
      }
    } catch (error) {
      this.logger.error("Error during cron job", error);
    }
  }

  private extractAltcoinSeasonIndex(pageText: string): number | null {
    const normalizedText = pageText.replace(/\s+/g, " ").trim();
    const matchers = [
      /Altcoin Season\s*\((\d{1,3})\)/i,
      /Altcoin Season Index[\s\S]{0,120}?\b(\d{1,3})\b[\s\S]{0,80}?Bitcoin Season/i,
      /It is not Altcoin Season[\s\S]{0,50}?\b(\d{1,3})\b/i,
      /It is Altcoin Season[\s\S]{0,50}?\b(\d{1,3})\b/i,
    ];

    for (const matcher of matchers) {
      const match = normalizedText.match(matcher);
      const index = Number(match?.[1]);

      if (Number.isFinite(index) && index >= 0 && index <= 100) {
        return index;
      }
    }

    return null;
  }

  async fetchAltcoinSeasonIndex(): Promise<number | null> {
    try {
      const urls = [
        "https://www.blockchaincenter.net/altcoin-season-index/",
        "https://www.blockchaincenter.net/en/altcoin-season-index/",
      ];

      for (const url of urls) {
        const { data } = await axios.get(url, {
          timeout: 15000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
            Accept: "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
          },
        });

        const html = typeof data === "string" ? data : "";
        const $ = cheerio.load(html);
        const index = this.extractAltcoinSeasonIndex($("body").text());

        if (index !== null) {
          return index;
        }
      }

      this.logger.warn(
        "Unable to parse Altcoin Season Index from BlockchainCenter"
      );
      return null;
    } catch (error: any) {
      this.logger.error(
        "Error while fetching Altcoin Season Index",
        error?.message || "Unknown error"
      );
      return null;
    }
  }

  async fetchSP500AndGoldPrices(): Promise<{
    sp500: { price: number | null; change: number | null };
    gold: { price: number | null; change: number | null };
  }> {
    try {
      const [sp500Res, goldRes] = await Promise.all([
        axios.get("https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC"),
        axios.get("https://query1.finance.yahoo.com/v8/finance/chart/GC=F"),
      ]);

      const spMeta = sp500Res.data.chart?.result?.[0]?.meta;
      const goldMeta = goldRes.data.chart?.result?.[0]?.meta;

      const sp500Price = spMeta?.regularMarketPrice ?? null;
      const sp500Prev = spMeta?.previousClose ?? null;

      const goldPrice = goldMeta?.regularMarketPrice ?? null;
      const goldPrev = goldMeta?.previousClose ?? null;

      const sp500Change =
        sp500Price !== null && sp500Prev !== null
          ? ((sp500Price - sp500Prev) / sp500Prev) * 100
          : null;

      const goldChange =
        goldPrice !== null && goldPrev !== null
          ? ((goldPrice - goldPrev) / goldPrev) * 100
          : null;

      return {
        sp500: { price: sp500Price, change: sp500Change },
        gold: { price: goldPrice, change: goldChange },
      };
    } catch (err: any) {
      console.error(
        "Error while fetching S&P 500 and gold prices:",
        err.message || err
      );
      return {
        sp500: { price: null, change: null },
        gold: { price: null, change: null },
      };
    }
  }
}
