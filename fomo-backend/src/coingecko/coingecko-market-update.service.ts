import { Injectable } from "@nestjs/common";
import { CoinGeckoMarketDto, CoinGeckoReferencePrices } from "./coingecko-market.types";

@Injectable()
export class CoinGeckoMarketUpdateService {
  private readonly portfolioRelevantFields = new Set<string>([
    "price",
    "marketCap",
    "volume24h",
    "priceChange",
    "circulatingSupply",
    "totalSupply",
    "maxSupply",
    "fullyDilutedMarketCap",
    "athUsd",
    "athUsdDate",
    "athUsdChangePercent",
    "atlUsd",
    "atlUsdDate",
    "atlUsdChangePercent",
    "priceBTC",
    "priceETH",
    "priceSOL",
    "usdQuote.price",
    "usdQuote.volume_24h",
    "usdQuote.percent_change_1h",
    "usdQuote.percent_change_24h",
    "usdQuote.percent_change_7d",
    "usdQuote.market_cap",
    "usdQuote.fully_diluted_market_cap",
  ]);
  private readonly sparklineMaxPoints = 72;

  buildProjectUpdateSet(
    market: CoinGeckoMarketDto,
    referencePrices: CoinGeckoReferencePrices,
  ): Record<string, any> {
    const set: Record<string, any> = {};
    const priceUsd = this.toFiniteNumber(market.current_price);

    this.setNumber(set, "price", priceUsd);
    this.setNumber(set, "marketCap", this.toFiniteNumber(market.market_cap));
    this.setNumber(set, "volume24h", this.toFiniteNumber(market.total_volume));
    this.setNumber(
      set,
      "priceChange",
      this.toFiniteNumber(
        market.price_change_percentage_24h_in_currency ?? market.price_change_percentage_24h,
      ),
    );
    this.setNumber(set, "circulatingSupply", this.toFiniteNumber(market.circulating_supply));
    this.setNumber(set, "totalSupply", this.toFiniteNumber(market.total_supply));
    this.setNumber(set, "maxSupply", this.toFiniteNumber(market.max_supply));
    this.setNumber(set, "fullyDilutedMarketCap", this.toFiniteNumber(market.fully_diluted_valuation));
    this.setNumber(set, "athUsd", this.toFiniteNumber(market.ath));
    this.setNumber(set, "athUsdChangePercent", this.toFiniteNumber(market.ath_change_percentage));
    this.setDate(set, "athUsdDate", market.ath_date);
    this.setNumber(set, "atlUsd", this.toFiniteNumber(market.atl));
    this.setNumber(set, "atlUsdChangePercent", this.toFiniteNumber(market.atl_change_percentage));
    this.setDate(set, "atlUsdDate", market.atl_date);

    if (priceUsd !== null && referencePrices.btcUsdPrice > 0) {
      set.priceBTC = priceUsd / referencePrices.btcUsdPrice;
    }
    if (priceUsd !== null && referencePrices.ethUsdPrice > 0) {
      set.priceETH = priceUsd / referencePrices.ethUsdPrice;
    }
    if (priceUsd !== null && referencePrices.solUsdPrice > 0) {
      set.priceSOL = priceUsd / referencePrices.solUsdPrice;
    }

    this.setNumber(set, "usdQuote.price", priceUsd);
    this.setNumber(set, "usdQuote.volume_24h", this.toFiniteNumber(market.total_volume));
    this.setNumber(
      set,
      "usdQuote.percent_change_1h",
      this.toFiniteNumber(market.price_change_percentage_1h_in_currency),
    );
    this.setNumber(
      set,
      "usdQuote.percent_change_24h",
      this.toFiniteNumber(
        market.price_change_percentage_24h_in_currency ?? market.price_change_percentage_24h,
      ),
    );
    this.setNumber(
      set,
      "usdQuote.percent_change_7d",
      this.toFiniteNumber(market.price_change_percentage_7d_in_currency),
    );
    this.setNumber(set, "usdQuote.market_cap", this.toFiniteNumber(market.market_cap));
    this.setNumber(
      set,
      "usdQuote.fully_diluted_market_cap",
      this.toFiniteNumber(market.fully_diluted_valuation),
    );

    if (market.last_updated) {
      set["usdQuote.last_updated"] = market.last_updated;
      const marketDataUpdatedAt = new Date(market.last_updated);
      if (!isNaN(marketDataUpdatedAt.getTime())) {
        set.marketDataUpdatedAt = marketDataUpdatedAt;
      }
    }

    const sparkline = this.buildSparklineChart7d(market.sparkline_in_7d?.price || []);
    if (sparkline) {
      set.chart7d = sparkline.dataUri;
      set.chart7dUpdatedAt = set.marketDataUpdatedAt || new Date();
      set.chart7dSource = "coingecko_markets_sparkline_7d";
      set.chart7dPointsCount = sparkline.pointsCount;
      set.chart7dTrend = sparkline.trend;
    }

    return set;
  }

  getChangedFields(project: any, updateSet: Record<string, any>): string[] {
    return Object.keys(updateSet).filter((field) => !this.valuesEqual(this.getPath(project, field), updateSet[field]));
  }

  getPortfolioRelevantChangedFields(project: any, updateSet: Record<string, any>): string[] {
    return this.getChangedFields(project, updateSet).filter((field) => this.portfolioRelevantFields.has(field));
  }

  countNullProviderFields(market: CoinGeckoMarketDto): Record<string, number> {
    const providerToProjectField: Array<[keyof CoinGeckoMarketDto, string]> = [
      ["current_price", "price"],
      ["market_cap", "marketCap"],
      ["total_volume", "volume24h"],
      ["price_change_percentage_24h", "priceChange"],
      ["circulating_supply", "circulatingSupply"],
      ["total_supply", "totalSupply"],
      ["max_supply", "maxSupply"],
      ["fully_diluted_valuation", "fullyDilutedMarketCap"],
      ["ath", "athUsd"],
      ["atl", "atlUsd"],
      ["price_change_percentage_1h_in_currency", "usdQuote.percent_change_1h"],
      ["price_change_percentage_7d_in_currency", "usdQuote.percent_change_7d"],
    ];
    const result: Record<string, number> = {};

    for (const [providerField, projectField] of providerToProjectField) {
      if (this.toFiniteNumber(market[providerField]) === null) {
        result[projectField] = (result[projectField] || 0) + 1;
      }
    }

    return result;
  }

  private setNumber(set: Record<string, any>, field: string, value: number | null): void {
    if (value === null) return;
    set[field] = value;
  }

  private setDate(set: Record<string, any>, field: string, value: any): void {
    if (!value) return;
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      set[field] = date;
    }
  }

  private getPath(source: any, path: string): any {
    return path.split(".").reduce((acc, key) => (acc === undefined || acc === null ? undefined : acc[key]), source);
  }

  private valuesEqual(left: any, right: any): boolean {
    if (typeof right === "number") {
      const leftNumber = Number(left);
      return Number.isFinite(leftNumber) && Math.abs(leftNumber - right) < 1e-12;
    }

    return String(left ?? "") === String(right ?? "");
  }

  private toFiniteNumber(value: any): number | null {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private buildSparklineChart7d(values: any[]): {
    dataUri: string;
    pointsCount: number;
    trend: "up" | "down";
  } | null {
    const prices = (Array.isArray(values) ? values : [])
      .map((value) => this.toFinitePositiveNumber(value))
      .filter((value) => value !== null) as number[];

    if (prices.length < 4) return null;

    const sampled = this.sampleSparklinePoints(prices, this.sparklineMaxPoints);
    const min = Math.min(...sampled);
    const max = Math.max(...sampled);
    const width = 300;
    const height = 100;
    const paddingX = 0;
    const paddingY = 6;
    const range = max - min || Math.max(max, 1) * 0.01;
    const trend = this.determineLegacyTrend(sampled);
    const color = trend === "up" ? "#04A584" : "#FF5858";
    const points = sampled.map((price, index) => {
      const x = paddingX + (index / Math.max(sampled.length - 1, 1)) * (width - paddingX * 2);
      const y = height - paddingY - ((price - min) / range) * (height - paddingY * 2);
      return {
        x: this.roundSvgNumber(x),
        y: this.roundSvgNumber(y),
      };
    });
    const linePath = this.buildSmoothPath(points);
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
      `<defs><linearGradient id="chart7dFill" x1="0" y1="0" x2="0" y2="${height}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${color}"/><stop offset="0.9323" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>`,
      `<path d="${areaPath}" fill="url(#chart7dFill)"/>`,
      `<path d="${linePath}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`,
      `</svg>`,
    ].join("");

    return {
      dataUri: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
      pointsCount: prices.length,
      trend,
    };
  }

  private determineLegacyTrend(values: number[]): "up" | "down" {
    if (values.length < 4) return "down";

    const segment = Math.max(1, Math.floor(values.length / 4));
    const startAvg = this.average(values.slice(0, segment));
    const endAvg = this.average(values.slice(-segment));
    let ups = 0;
    let downs = 0;

    for (let index = 1; index < values.length; index += 1) {
      if (values[index] > values[index - 1]) ups += 1;
      else if (values[index] < values[index - 1]) downs += 1;
    }

    const firstValue = values[0];
    const lastValue = values[values.length - 1];
    const percentChange = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
    const slope = (endAvg - startAvg) / segment;

    if (percentChange >= 3) return "up";
    if (percentChange <= 0) return "down";
    if (slope > 0 && ups > downs * 1.2) return "up";
    if (slope < 0 && downs > ups * 1.2) return "down";
    return "down";
  }

  private average(values: number[]): number {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private buildSmoothPath(points: Array<{ x: number; y: number }>): string {
    if (!points.length) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    const commands = [`M ${points[0].x} ${points[0].y}`];
    const tension = 0.3;

    for (let index = 0; index < points.length - 1; index += 1) {
      const previous = points[Math.max(0, index - 1)];
      const current = points[index];
      const next = points[index + 1];
      const nextAfter = points[Math.min(points.length - 1, index + 2)];
      const control1 = {
        x: current.x + ((next.x - previous.x) / 6) * tension,
        y: current.y + ((next.y - previous.y) / 6) * tension,
      };
      const control2 = {
        x: next.x - ((nextAfter.x - current.x) / 6) * tension,
        y: next.y - ((nextAfter.y - current.y) / 6) * tension,
      };

      commands.push(
        [
          "C",
          this.roundSvgNumber(control1.x),
          this.roundSvgNumber(control1.y),
          this.roundSvgNumber(control2.x),
          this.roundSvgNumber(control2.y),
          next.x,
          next.y,
        ].join(" "),
      );
    }

    return commands.join(" ");
  }

  private sampleSparklinePoints(values: number[], maxPoints: number): number[] {
    if (values.length <= maxPoints) return values;

    const result: number[] = [];
    const step = (values.length - 1) / (maxPoints - 1);
    for (let index = 0; index < maxPoints; index += 1) {
      result.push(values[Math.round(index * step)]);
    }
    return result;
  }

  private roundSvgNumber(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private toFinitePositiveNumber(value: any): number | null {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
  }
}
