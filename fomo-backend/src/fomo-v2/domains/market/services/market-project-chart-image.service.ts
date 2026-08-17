import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Types } from "mongoose";
import { MarketDataTier } from "src/coingecko/coingecko-market.types";
import {
  FomoV2MarketProjectReadModel,
} from "../models";
import { FomoV2MarketSyncTargetPayload } from "./market-sync-queue.constants";
import { FomoV2MarketProjectChartReadService } from "./market-project-chart-read.service";

export interface FomoV2MarketChart7dRenderResult {
  requested: number;
  assetsScanned?: number;
  rendered: number;
  skippedNoPoints: number;
  skippedTooFewPoints: number;
  failed: number;
}

export interface FomoV2MarketChart7dRenderOptions {
  tier?: MarketDataTier | "all";
  limit?: number;
  offset?: number;
  batchSize?: number;
  marketAssetId?: string;
  canonicalProjectId?: string;
  coingeckoId?: string;
  dryRun?: boolean;
}

interface NormalizedChartPoint {
  timestamp: number;
  price: number;
}

interface ChartPriceDomain {
  min: number;
  max: number;
  rawMin: number;
  rawMax: number;
  range: number;
}

@Injectable()
export class FomoV2MarketProjectChartImageService {
  private readonly logger = new Logger(FomoV2MarketProjectChartImageService.name);
  private readonly width = 300;
  private readonly height = 100;
  private readonly maxPoints = 72;
  private readonly minVisiblePriceRangePct = 0.08;
  private readonly priceRangePaddingRatio = 0.12;

  constructor(
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly readModel: Model<FomoV2MarketProjectReadModel>,
    private readonly chartReadService: FomoV2MarketProjectChartReadService,
  ) {}

  async render7dForEligibleAssets(
    options: FomoV2MarketChart7dRenderOptions = {},
  ): Promise<FomoV2MarketChart7dRenderResult> {
    const candidates = await this.loadEligibleTargets(options);
    const result: FomoV2MarketChart7dRenderResult = {
      requested: candidates.length,
      assetsScanned: candidates.length,
      rendered: 0,
      skippedNoPoints: 0,
      skippedTooFewPoints: 0,
      failed: 0,
    };

    if (options.dryRun) return result;

    for (const chunk of this.chunk(candidates, this.positiveInteger(options.batchSize, 100))) {
      const chunkResult = await this.render7dForMarketAssets(chunk);
      result.rendered += chunkResult.rendered;
      result.skippedNoPoints += chunkResult.skippedNoPoints;
      result.skippedTooFewPoints += chunkResult.skippedTooFewPoints;
      result.failed += chunkResult.failed;
    }

    return result;
  }

  async render7dForMarketAssets(
    targets: FomoV2MarketSyncTargetPayload[],
  ): Promise<FomoV2MarketChart7dRenderResult> {
    const result: FomoV2MarketChart7dRenderResult = {
      requested: targets.length,
      rendered: 0,
      skippedNoPoints: 0,
      skippedTooFewPoints: 0,
      failed: 0,
    };

    const operations: any[] = [];
    const renderedAt = new Date();

    for (const target of this.dedupeTargets(targets)) {
      try {
        const marketAssetId = this.toObjectId(target.marketAssetId);
        if (!marketAssetId) {
          result.failed += 1;
          continue;
        }

        const chart = await this.chartReadService.getMarketAssetChart(marketAssetId, { range: "7D" });
        const points = this.normalizePoints(chart?.points || chart?.history || []);
        if (!points.length) {
          result.skippedNoPoints += 1;
          continue;
        }
        if (points.length < 4) {
          result.skippedTooFewPoints += 1;
          continue;
        }

        const sampled = this.samplePoints(points, this.maxPoints);
        const trend = this.determineTrend(sampled);
        const dataUri = this.buildSvgDataUri(sampled, trend);
        const latestTimestamp = new Date(sampled[sampled.length - 1].timestamp);

        operations.push({
          updateOne: {
            filter: { marketAssetId },
            update: {
              $set: {
                chart7d: dataUri,
                chart7dUpdatedAt: renderedAt,
                chart7dSource: "fomo_v2_market_history_db",
                chart7dPointsCount: points.length,
                chart7dTrend: trend,
                "debug.latestChart7dRender": {
                  source: "market_project_histories/project_market_snapshots",
                  renderedAt,
                  latestPointAt: latestTimestamp,
                  rawPoints: points.length,
                  sampledPoints: sampled.length,
                },
              },
            },
          },
        });
        result.rendered += 1;
      } catch (error) {
        result.failed += 1;
        this.logger.warn(
          `FOMO v2 chart7d render failed marketAssetId=${target.marketAssetId}: ${error?.message || error}`,
        );
      }
    }

    for (const chunk of this.chunk(operations, 500)) {
      await this.readModel.bulkWrite(chunk, { ordered: false });
    }

    return result;
  }

  private normalizePoints(input: any[]): NormalizedChartPoint[] {
    const pointsByTimestamp = new Map<number, NormalizedChartPoint>();

    for (const point of Array.isArray(input) ? input : []) {
      const timestamp = this.toTimestamp(point?.timestamp || point?.createdAt || point?.bucketTimestamp);
      const price = this.toFinitePositiveNumber(point?.price?.USD ?? point?.price?.usd ?? point?.price);
      if (!timestamp || price === null) continue;
      pointsByTimestamp.set(timestamp, { timestamp, price });
    }

    return Array.from(pointsByTimestamp.values()).sort((left, right) => left.timestamp - right.timestamp);
  }

  private buildSvgDataUri(points: NormalizedChartPoint[], trend: "up" | "down"): string {
    const paddingY = 6;
    const domain = this.buildPriceDomain(points);
    const color = trend === "up" ? "#04A584" : "#FF5858";
    const coordinates = points.map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * this.width;
      const y = this.height - paddingY - ((point.price - domain.min) / domain.range) * (this.height - paddingY * 2);
      return {
        x: this.roundSvgNumber(x),
        y: this.roundSvgNumber(y),
      };
    });
    const linePath = this.buildSmoothPath(coordinates);
    const areaPath = `${linePath} L ${coordinates[coordinates.length - 1].x} ${this.height} L ${coordinates[0].x} ${this.height} Z`;
    const svg = [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">`,
      `<defs><linearGradient id="chart7dFill" x1="0" y1="0" x2="0" y2="${this.height}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${color}"/><stop offset="0.9323" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>`,
      `<path d="${areaPath}" fill="url(#chart7dFill)"/>`,
      `<path d="${linePath}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`,
      `</svg>`,
    ].join("");

    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  private buildPriceDomain(points: NormalizedChartPoint[]): ChartPriceDomain {
    const prices = points.map((point) => point.price);
    const rawMin = Math.min(...prices);
    const rawMax = Math.max(...prices);
    const rawRange = Math.max(0, rawMax - rawMin);
    const center = (rawMin + rawMax) / 2;
    const referencePrice = Math.max(Math.abs(center), Number.EPSILON);
    const minDisplayRange = referencePrice * this.minVisiblePriceRangePct;
    const paddedRawRange = rawRange * (1 + this.priceRangePaddingRatio * 2);
    const range = Math.max(paddedRawRange, minDisplayRange, Number.EPSILON);
    let min = center - range / 2;
    let max = center + range / 2;

    if (rawMin >= 0 && min < 0) {
      max += -min;
      min = 0;
    }

    return {
      min,
      max,
      rawMin,
      rawMax,
      range: max - min,
    };
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

  private determineTrend(points: NormalizedChartPoint[]): "up" | "down" {
    if (points.length < 2) return "down";
    return points[points.length - 1].price >= points[0].price ? "up" : "down";
  }

  private samplePoints(points: NormalizedChartPoint[], maxPoints: number): NormalizedChartPoint[] {
    if (points.length <= maxPoints) return points;

    const result: NormalizedChartPoint[] = [];
    const step = (points.length - 1) / (maxPoints - 1);
    for (let index = 0; index < maxPoints; index += 1) {
      result.push(points[Math.round(index * step)]);
    }
    return result;
  }

  private dedupeTargets(targets: FomoV2MarketSyncTargetPayload[]): FomoV2MarketSyncTargetPayload[] {
    const byAsset = new Map<string, FomoV2MarketSyncTargetPayload>();
    for (const target of targets || []) {
      if (!target?.marketAssetId) continue;
      byAsset.set(target.marketAssetId, target);
    }
    return Array.from(byAsset.values());
  }

  private async loadEligibleTargets(
    options: FomoV2MarketChart7dRenderOptions,
  ): Promise<FomoV2MarketSyncTargetPayload[]> {
    const query: Record<string, any> = {
      trading: "CURRENTLY_TRADING",
      status: "active",
    };

    if (options.tier && options.tier !== "all") {
      query.tier = options.tier;
    } else if (!this.hasSpecificSelector(options)) {
      query.rank = { $type: "number", $gt: 0 };
    }

    const marketAssetId = this.toObjectId(options.marketAssetId);
    if (marketAssetId) query.marketAssetId = marketAssetId;

    const canonicalProjectId = this.toObjectId(options.canonicalProjectId);
    if (canonicalProjectId) query.canonicalProjectId = canonicalProjectId;

    const coingeckoId = this.normalizeCoingeckoId(options.coingeckoId);
    if (coingeckoId) {
      query["providerIds.coingeckoId"] = coingeckoId;
    } else if (!this.hasSpecificSelector(options)) {
      query["providerIds.coingeckoId"] = { $type: "string", $ne: "" };
    }

    const rows = await this.readModel
      .find(query)
      .sort({ rank: 1, _id: 1 })
      .skip(this.nonNegativeInteger(options.offset, 0))
      .limit(this.nonNegativeLimit(options.limit, 0))
      .select("_id canonicalProjectId marketAssetId providerIds symbol tier")
      .lean();

    return rows
      .map((row: any): FomoV2MarketSyncTargetPayload | undefined => {
        const marketAssetIdValue = this.toIdString(row.marketAssetId);
        const coingeckoIdValue = this.normalizeCoingeckoId(row.providerIds?.coingeckoId || options.coingeckoId);
        const tier = row.tier as MarketDataTier;
        if (!marketAssetIdValue || !coingeckoIdValue || !this.isMarketDataTier(tier)) return undefined;

        const canonicalProjectId = this.toIdString(row.canonicalProjectId);
        return {
          syncStateId: this.toIdString(row._id) || marketAssetIdValue,
          marketAssetId: marketAssetIdValue,
          ...(canonicalProjectId ? { canonicalProjectId } : {}),
          coingeckoId: coingeckoIdValue,
          symbol: row.symbol,
          tier,
        };
      })
      .filter((target): target is FomoV2MarketSyncTargetPayload => Boolean(target));
  }

  private hasSpecificSelector(options: FomoV2MarketChart7dRenderOptions): boolean {
    return Boolean(options.marketAssetId || options.canonicalProjectId || options.coingeckoId);
  }

  private normalizeCoingeckoId(value: any): string | undefined {
    const text = String(value || "").trim().toLowerCase();
    return text || undefined;
  }

  private isMarketDataTier(value: any): value is MarketDataTier {
    return value === "HOT" || value === "WARM" || value === "COLD";
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value;
    if (value instanceof mongoose.Types.ObjectId) return new Types.ObjectId(value.toHexString());
    const id = String(value?._id || value || "").trim();
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined;
  }

  private toIdString(value: any): string | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value.toHexString();
    if (value instanceof mongoose.Types.ObjectId) return value.toHexString();
    const id = String(value?._id || value || "").trim();
    return id || undefined;
  }

  private toTimestamp(value: any): number {
    if (value instanceof Date) return value.getTime();
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric < 100000000000 ? numeric * 1000 : numeric;
    const date = value ? new Date(value) : null;
    return date && Number.isFinite(date.getTime()) ? date.getTime() : 0;
  }

  private toFinitePositiveNumber(value: any): number | null {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
  }

  private nonNegativeLimit(value: any, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    if (parsed <= 0) return 0;
    return Math.trunc(parsed);
  }

  private nonNegativeInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
  }

  private roundSvgNumber(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private chunk<T>(items: T[], size: number): T[][] {
    if (!items.length) return [];
    return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
      items.slice(index * size, index * size + size),
    );
  }
}
