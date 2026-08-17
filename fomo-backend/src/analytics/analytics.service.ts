import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  Chart,
  ChartDocument,
  ChartTypes,
  EntityTypes,
} from "./models/chart.model";
import mongoose, { Model, mongo, Types } from "mongoose";
import { Project, ProjectDocument } from "src/projects/project.model";
import { Funds, FundsDocument } from "src/funds/funds.model";
import { Person, PersonDocument } from "src/persons/person.model";
import { ChartJSNodeCanvas } from "chartjs-node-canvas";
import * as fs from "fs";
import * as path from "path";
import axios from 'axios';
import { FomoV2FundingFeedRoundReadModel } from "src/fomo-v2/domains/funding/models";
import { HttpService } from "@nestjs/axios";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ConfigService } from "@nestjs/config";
import { ensureUploadsDir, UPLOADS_DIR } from "src/config/uploads";
import {
  ProjectChartHistory,
  ProjectChartHistoryDocument,
  ProjectChartHistorySource,
} from "src/projects/project-chart-history.model";

type FundingDynamicsRound = {
  fundingDate?: Date | string;
  raisedAmount?: number;
  projectCategory?: string;
  roundType?: string;
  projectSymbol?: string;
  projectSlug?: string;
  projectName?: string;
};
import { AppCacheService } from "src/common/cache/cache.service";
import { CACHE_TTL_SECONDS } from "src/common/cache/cache.constants";
import { CacheKeys } from "src/common/cache/cache.keys";

type MarketHistoryTier = "HOT" | "WARM" | "COLD";

export interface MarketDataHistoryPoint {
  timestamp?: Date | number | string;
  price?: number | null;
  marketCap?: number | null;
  volume24h?: number | null;
  priceChange24h?: number | null;
  source?: ProjectChartHistorySource;
  tier?: MarketHistoryTier;
}

export interface AddMarketDataPointOptions {
  source?: ProjectChartHistorySource;
  tier?: MarketHistoryTier;
  bucketMs?: number;
  updateChartCache?: boolean;
  dryRun?: boolean;
}

export interface AddMarketDataPointsInput {
  projectId: string | Types.ObjectId;
  point: MarketDataHistoryPoint;
}

export interface MarketDataHistoryWriteResult {
  requested: number;
  planned: number;
  upserted: number;
  modified: number;
  skippedEmpty: number;
  skippedDisabled: number;
  dryRun: boolean;
  chartCacheUpdated: number;
}

export interface ProjectChartCacheRebuildResult {
  projectId: string;
  rawPoints: number;
  chartPoints: number;
  firstTimestamp?: string;
  lastTimestamp?: string;
  chart24hPointsCount: number;
  chart7dPointsCount: number;
  chart30dPointsCount: number;
  chart90dPointsCount: number;
  chart1yPointsCount: number;
  chartAllPointsCount: number;
}

export interface ProjectMarketHistoryResetResult {
  projectId: string;
  dryRun: boolean;
  rawDeleted: number;
  chartDeleted: number;
}

interface PreparedMarketDataPoint {
  projectId: Types.ObjectId;
  projectIdString: string;
  timestamp: Date;
  bucketTimestamp: Date;
  source: ProjectChartHistorySource;
  price: number | null;
  marketCap: number | null;
  volume24h: number | null;
  priceChange24h: number | null;
}

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);
  private width = 300;
  private height = 100;
  private chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: this.width,
    height: this.height,
  });
  private readonly marketHistoryBucketMsByTier: Record<MarketHistoryTier, number> = {
    HOT: 5 * 60 * 1000,
    WARM: 60 * 60 * 1000,
    COLD: 6 * 60 * 60 * 1000,
  };
  private readonly chartRangeMs: Record<ChartTypes, number> = {
    chart24h: 24 * 60 * 60 * 1000,
    chart7d: 7 * 24 * 60 * 60 * 1000,
    chart30d: 30 * 24 * 60 * 60 * 1000,
    chart90d: 90 * 24 * 60 * 60 * 1000,
    chart1y: 365 * 24 * 60 * 60 * 1000,
    chartAll: Infinity,
  };
  private readonly chartSliceLimits: Record<ChartTypes, number> = {
    chart24h: 288,
    chart7d: 2016,
    chart30d: 8640,
    chart90d: 25920,
    chart1y: 730,
    chartAll: 1500,
  };
  private readonly projectChartCacheWriteTypes: ChartTypes[] = ["chart24h", "chart7d", "chart30d"];

  constructor(
    @InjectModel(Chart.name) private readonly chartModel: Model<ChartDocument>,
    @InjectModel(ProjectChartHistory.name)
    private readonly projectChartHistoryModel: Model<ProjectChartHistoryDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Funds.name) private readonly fundModel: Model<FundsDocument>,
    @InjectModel(FomoV2FundingFeedRoundReadModel.name)
    private readonly fundingRoundModel: Model<FomoV2FundingFeedRoundReadModel>,
    @InjectModel(Person.name)
    private readonly personModel: Model<PersonDocument>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly cacheService: AppCacheService,
  ) {
    // this.updateFundsCategories()
    // this.updateFundingDynamics()
    // this.update7DaysPriceHistory()
  }
  
  private slugToBybitSymbol(slug: string): string {
    const map: { [key: string]: string } = {
      'bitcoin': 'BTCUSDT', 'ethereum': 'ETHUSDT', 'bnb': 'BNBUSDT',
      'ripple': 'XRPUSDT', 'cardano': 'ADAUSDT', 'solana': 'SOLUSDT',
      'dogecoin': 'DOGEUSDT', 'polkadot': 'DOTUSDT', 'matic-network': 'MATICUSDT'
    };
    return map[slug] || `${slug.toUpperCase().replace('-', '')}USDT`;
  }

  private async fetchFromBybit(slug: string): Promise<any> {
    try {
      const symbol = this.slugToBybitSymbol(slug);
      const url = `https://api.bybit.com/v5/market/kline`;

      const response = await this.httpService.axiosRef.get(url, {
        params: {
          category: 'spot',
          symbol: symbol,
          interval: '60',
          limit: 168
        },
        timeout: 10000
      });

      const data = response.data.result.list;
      if (!data || data.length === 0) return null;

      return data.map((item: any) => {
        return ({
          timestamp: parseFloat(item[0]),
          price: {
            USD: parseFloat(item[4])
          }
        })
      }).reverse()
    } catch (error) {
      console.error(`Bybit API error for ${slug}:`, error.message);
      return null;
    }
  }

  private average(arr: number[]): number {
    const sum = arr.reduce((acc, val) => acc + val, 0);
    return sum / arr.length;
  }

  private determineTrend(
    dataPoints: { timestamp: number, price: { USD: number } }[],
    currency: "USD" | "BTC" | "ETH" | "SOL"
  ): "up" | "down" {
    const prices = dataPoints
      .map((p) => ({
        timestamp: p.timestamp,
        value: p.price?.[currency],
      }))
      .filter((p) => typeof p.value === "number");

    if (prices.length < 4) return "down";

    const values = prices.map((p) => p.value);
    const n = values.length;
    const segment = Math.floor(n / 4);

    const startAvg = this.average(values.slice(0, segment));
    const endAvg = this.average(values.slice(-segment));

    let ups = 0,
      downs = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) ups++;
      else if (values[i] < values[i - 1]) downs++;
    }

    const slope = (endAvg - startAvg) / segment;

    const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
    const lastTimestamp = prices[prices.length - 1].timestamp;
    const lastValue = prices[prices.length - 1].value;

    const weekAgoTarget = lastTimestamp - oneWeekMs;
    const weekAgoPoint = prices.reduce((prev, curr) => {
      return Math.abs(curr.timestamp - weekAgoTarget) <
        Math.abs(prev.timestamp - weekAgoTarget)
        ? curr
        : prev;
    });

    const weekAgoValue = weekAgoPoint.value;
    const percentChange = ((lastValue - weekAgoValue) / weekAgoValue) * 100;

    if (percentChange >= 3) return "up";
    if (percentChange <= 0) return "down";

    if (slope > 0 && ups > downs * 1.2) return "up";
    if (slope < 0 && downs > ups * 1.2) return "down";

    return "down";
  }

  async generateChartImage(
    dataPoints: { timestamp: number, price: { USD: number } }[],
    outputFilename: string,
    label = "USD Price",
    currency: "USD" | "BTC" | "ETH" | "SOL" = "USD"
  ): Promise<{ path: string; trend: "up" | "down" }> {
    if (!dataPoints || dataPoints.length < 4) {
      throw new Error("Not enough data points to render chart");
    }
    const filteredDataPoints = dataPoints.filter((_, index) => index % 2 === 0);

    const trend = this.determineTrend(filteredDataPoints, currency);

    const colorConfig = {
      up: {
        line: "#04A584",
        from: "#04A584",
        to: "rgba(4, 165, 132, 0)",
      },
      down: {
        line: "#FF5858",
        from: "#FF5858",
        to: "rgba(255, 88, 88, 0)",
      },
    }[trend];

    const configuration: any = {
      type: "line",
      data: {
        labels: filteredDataPoints.map((point) =>
          new Date(point.timestamp).toLocaleDateString()
        ),
        datasets: [
          {
            label: "",
            data: filteredDataPoints.map(
              (point) => point.price?.[currency] ?? null
            ),
            borderColor: colorConfig.line,
            borderWidth: 2,
            fill: true,
            backgroundColor: (ctx) => {
              const gradient = ctx.chart.ctx.createLinearGradient(
                0,
                0,
                0,
                this.height
              );
              gradient.addColorStop(0, colorConfig.from);
              gradient.addColorStop(0.9323, colorConfig.to);
              return gradient;
            },
            pointRadius: 0,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false },
        },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        elements: {
          line: {
            borderJoinStyle: "round",
            capBezierPoints: true,
          },
        },
      },
    };

    const imageBuffer: any = await this.chartJSNodeCanvas.renderToBuffer(
      configuration
    );

    ensureUploadsDir();
    const outputPath = path.join(UPLOADS_DIR, `${outputFilename}.png`);
    const tempPath = path.join(
      UPLOADS_DIR,
      `${outputFilename}.${process.pid}.${Date.now()}.tmp`,
    );
    fs.writeFileSync(tempPath, imageBuffer);
    fs.renameSync(tempPath, outputPath);

    return { path: `/${outputFilename}.png`, trend };
  }

  async getCharts(
    entityIds: (string | Types.ObjectId)[],
    entityType: EntityTypes,
    chartType?: ChartTypes | null
  ): Promise<any[]> {
    const ids = entityIds?.length ? entityIds.map((id) =>
      typeof id === "string" ? new Types.ObjectId(id) : id
    ) : [];

    const projection = chartType ? { [chartType]: 1, entityId: 1, _id: 0 } : {};

    const startedAt = Date.now();
    const charts = await this.chartModel
      .find(
        {
          entityId: { $in: ids },
          entityType: entityType,
        },
        projection
      )
      .lean();

    if (!this.shouldUseProjectChartHistoryFallback(entityType, chartType)) {
      return charts;
    }

    const chartsByEntityId = new Map<string, any>();
    for (const chart of charts) {
      if (chart?.entityId) {
        chartsByEntityId.set(String(chart.entityId), chart);
      }
    }

    const result = await Promise.all(
      ids.map((id) =>
        this.applyProjectChartHistoryFallback(
          chartsByEntityId.get(String(id)) || null,
          id,
          chartType,
          startedAt,
        ),
      ),
    );

    return result.filter((chart) => chart !== null);
  }

  async getChart(
    entityId: string | Types.ObjectId | "",
    entityType: EntityTypes,
    chartType?:
      | "chart24h"
      | "chart7d"
      | "chart30d"
      | "chart90d"
      | "chart1y"
      | "chartAll"
  ): Promise<any> {
    const entityIdString = entityId ? String(entityId) : "";

    return this.cacheService.wrap({
      key: CacheKeys.analytics.chart({
        entityId: entityIdString,
        entityType,
        chartType: chartType || null,
      }),
      ttl: CACHE_TTL_SECONDS.analyticsCharts,
      factory: async () => {
        const options: any = {}
        const id =
          typeof entityId === "string" && entityId.length
            ? (Types.ObjectId.isValid(entityId) ? new Types.ObjectId(entityId) : null)
            : entityId;

        if (entityId && !id) return null;

        const projection = chartType ? { [chartType]: 1, entityId: 1, _id: 0 } : {};

        if (id) options.entityId = id
        if (entityType) options.entityType = entityType

        const startedAt = Date.now();
        const chart = await this.chartModel
          .findOne(
            options,
            projection
          )
          .lean();

        if (!id || !this.shouldUseProjectChartHistoryFallback(entityType, chartType)) {
          return chart;
        }

        return this.applyProjectChartHistoryFallback(chart, id, chartType, startedAt);
      },
    });
  }

  async buildProjectChartFromHistory(
    projectId: string | Types.ObjectId,
    chartType: ChartTypes,
  ): Promise<any[]> {
    const id = typeof projectId === "string" ? new Types.ObjectId(projectId) : projectId;
    const bucketTimestamp: any = { $type: "date" };
    const rangeMs = this.chartRangeMs[chartType];

    if (rangeMs !== Infinity) {
      bucketTimestamp.$gte = new Date(Date.now() - rangeMs);
    }

    const rawPoints = await this.projectChartHistoryModel
      .find(
        {
          projectId: id,
          bucketTimestamp,
        },
        {
          timestamp: 1,
          bucketTimestamp: 1,
          source: 1,
          price: 1,
          marketCap: 1,
          volume24h: 1,
          priceChange24h: 1,
          _id: 0,
        },
      )
      .sort({ bucketTimestamp: 1 })
      .lean();

    const chartPoints = rawPoints
      .map((point: any) =>
        this.toMarketDataChartPoint({
          projectId: id,
          projectIdString: id.toString(),
          timestamp: new Date(point.timestamp || point.bucketTimestamp),
          bucketTimestamp: new Date(point.bucketTimestamp),
          source: point.source || "coingecko",
          price: this.toFiniteNumber(point.price),
          marketCap: this.toFiniteNumber(point.marketCap),
          volume24h: this.toFiniteNumber(point.volume24h),
          priceChange24h: this.toFiniteNumber(point.priceChange24h),
        }),
      )
      .filter((point) => point !== null)
      .sort((a, b) => a.timestamp - b.timestamp);

    return this.downsampleEvenly(chartPoints, this.chartSliceLimits[chartType]);
  }

  private shouldUseProjectChartHistoryFallback(
    entityType: EntityTypes,
    chartType?: ChartTypes | null,
  ): chartType is ChartTypes {
    return entityType === "project" && this.isProjectHistoryFallbackChartType(chartType);
  }

  private isProjectHistoryFallbackChartType(chartType?: ChartTypes | null): chartType is ChartTypes {
    return chartType === "chart90d" || chartType === "chart1y" || chartType === "chartAll";
  }

  private async applyProjectChartHistoryFallback(
    chart: any | null,
    projectId: string | Types.ObjectId,
    chartType: ChartTypes,
    startedAt: number,
  ): Promise<any | null> {
    const id = typeof projectId === "string" ? new Types.ObjectId(projectId) : projectId;
    const cachedPoints = chart?.[chartType];

    if (Array.isArray(cachedPoints) && cachedPoints.length > 0) {
      this.logProjectChartHistoryFallbackMetric({
        entityId: id,
        chartType,
        fallbackUsed: false,
        pointsCount: cachedPoints.length,
        latencyMs: Date.now() - startedAt,
      });
      return chart;
    }

    const fallbackPoints = await this.buildProjectChartFromHistory(id, chartType);
    this.logProjectChartHistoryFallbackMetric({
      entityId: id,
      chartType,
      fallbackUsed: true,
      pointsCount: fallbackPoints.length,
      latencyMs: Date.now() - startedAt,
    });

    if (!chart && !fallbackPoints.length) return null;

    return {
      ...(chart || {}),
      entityId: chart?.entityId || id,
      [chartType]: fallbackPoints,
    };
  }

  private logProjectChartHistoryFallbackMetric(params: {
    entityId: string | Types.ObjectId;
    chartType: ChartTypes;
    fallbackUsed: boolean;
    pointsCount: number;
    latencyMs: number;
  }): void {
    this.logger.log(
      `project_chart_history_fallback entityId=${String(params.entityId)} chartType=${params.chartType} ` +
        `fallbackUsed=${params.fallbackUsed} pointsCount=${params.pointsCount} latencyMs=${params.latencyMs}`,
    );
  }

  async upsertChartData(
    entityId: string | Types.ObjectId,
    entityType: "project" | "fund" | "person" | "user",
    chartType:
      | "chart24h"
      | "chart7d"
      | "chart30d"
      | "chart90d"
      | "chart1y"
      | "chartAll",
    chartData: Array<any>
  ): Promise<{ chart: ChartDocument | null; chartImage?: string }> {
    const id =
      typeof entityId === "string" ? new Types.ObjectId(entityId) : entityId;

    if (entityType === "project" && this.isLongRangeCache(chartType)) {
      this.logger.log(`Skipping project long-range chart cache write entityId=${String(entityId)} chartType=${chartType}`);
      return {
        chart: await this.chartModel.findOne({ entityId: id, entityType }),
      };
    }

    const update = {
      [chartType]: chartData,
      entityType,
    };

    const chart = await this.chartModel.findOneAndUpdate(
      { entityId: id, entityType },
      { $set: update, $setOnInsert: { entityId: id, createdAt: new Date() } },
      { upsert: true, new: true }
    );
    if (chartType === "chart7d") {
      const { path } = await this.generateChartImage(
        chartData,
        String(entityId),
        "",
        "USD"
      );
      console.log('CHART 7D DATA UPDATED FOR: ', entityId)
      return { chart, chartImage: path };
    }

    return { chart };
  }

  async addMarketDataPoint(
    projectId: string | Types.ObjectId,
    point: MarketDataHistoryPoint,
    options: AddMarketDataPointOptions = {},
  ): Promise<MarketDataHistoryWriteResult> {
    return this.addMarketDataPoints([{ projectId, point }], options);
  }

  async addMarketDataPoints(
    items: AddMarketDataPointsInput[],
    options: AddMarketDataPointOptions = {},
  ): Promise<MarketDataHistoryWriteResult> {
    const result: MarketDataHistoryWriteResult = {
      requested: items.length,
      planned: 0,
      upserted: 0,
      modified: 0,
      skippedEmpty: 0,
      skippedDisabled: 0,
      dryRun: options.dryRun === true,
      chartCacheUpdated: 0,
    };
    const preparedByKey = new Map<string, PreparedMarketDataPoint>();

    for (const item of items) {
      const prepared = this.prepareMarketDataPoint(item, options);
      if (prepared.status === "empty") {
        result.skippedEmpty += 1;
        continue;
      }
      if (prepared.status === "disabled") {
        result.skippedDisabled += 1;
        continue;
      }
      if (!prepared.point) continue;

      const key = `${prepared.point.projectIdString}:${prepared.point.bucketTimestamp.getTime()}`;
      preparedByKey.set(key, prepared.point);
    }

    const preparedPoints = Array.from(preparedByKey.values());
    result.planned = preparedPoints.length;

    if (!preparedPoints.length || result.dryRun) {
      return result;
    }

    const now = new Date();
    const rawOperations = preparedPoints.map((point) => {
      const set: Record<string, any> = {
        projectId: point.projectId,
        timestamp: point.timestamp,
        bucketTimestamp: point.bucketTimestamp,
        source: point.source,
        updatedAt: now,
      };

      if (point.price !== null) set.price = point.price;
      if (point.marketCap !== null) set.marketCap = point.marketCap;
      if (point.volume24h !== null) set.volume24h = point.volume24h;
      if (point.priceChange24h !== null) set.priceChange24h = point.priceChange24h;

      return {
        updateOne: {
          filter: {
            projectId: point.projectId,
            bucketTimestamp: point.bucketTimestamp,
          },
          update: {
            $set: set,
            $setOnInsert: { createdAt: now },
          },
          upsert: true,
        },
      };
    });

    const writeResult = await this.projectChartHistoryModel.bulkWrite(rawOperations, { ordered: false });
    result.upserted = Number((writeResult as any).upsertedCount || 0);
    result.modified = Number((writeResult as any).modifiedCount || 0);

    if (options.updateChartCache !== false) {
      result.chartCacheUpdated = await this.updateChartCacheWithMarketDataPoints(preparedPoints);
    }

    return result;
  }

  async rebuildProjectChartCache(
    projectId: string | Types.ObjectId,
  ): Promise<ProjectChartCacheRebuildResult> {
    const id = typeof projectId === "string" ? new Types.ObjectId(projectId) : projectId;
    const rawPoints = await this.projectChartHistoryModel
      .find({
        projectId: id,
        bucketTimestamp: { $type: "date" },
      })
      .sort({ bucketTimestamp: 1 })
      .lean();
    const chartPoints = rawPoints
      .map((point: any) =>
        this.toMarketDataChartPoint({
          projectId: id,
          projectIdString: id.toString(),
          timestamp: new Date(point.timestamp || point.bucketTimestamp),
          bucketTimestamp: new Date(point.bucketTimestamp),
          source: point.source || "coingecko",
          price: this.toFiniteNumber(point.price),
          marketCap: this.toFiniteNumber(point.marketCap),
          volume24h: this.toFiniteNumber(point.volume24h),
          priceChange24h: this.toFiniteNumber(point.priceChange24h),
        }),
      )
      .filter((point) => point !== null)
      .sort((a, b) => a.timestamp - b.timestamp);
    const update = this.buildChartCacheFromPoints(chartPoints);

    await this.chartModel.updateOne(
      { entityId: id, entityType: "project" },
      {
        $set: {
          ...update,
          entityType: "project",
        },
        $setOnInsert: {
          entityId: id,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    return {
      projectId: id.toString(),
      rawPoints: rawPoints.length,
      chartPoints: chartPoints.length,
      firstTimestamp: chartPoints[0]?.timestamp ? new Date(chartPoints[0].timestamp).toISOString() : undefined,
      lastTimestamp: chartPoints[chartPoints.length - 1]?.timestamp
        ? new Date(chartPoints[chartPoints.length - 1].timestamp).toISOString()
        : undefined,
      chart24hPointsCount: update.chart24h.length,
      chart7dPointsCount: update.chart7d.length,
      chart30dPointsCount: update.chart30d.length,
      chart90dPointsCount: 0,
      chart1yPointsCount: 0,
      chartAllPointsCount: 0,
    };
  }

  async resetProjectMarketHistory(
    projectId: string | Types.ObjectId,
    options: { dryRun?: boolean } = {},
  ): Promise<ProjectMarketHistoryResetResult> {
    const id = typeof projectId === "string" ? new Types.ObjectId(projectId) : projectId;
    const dryRun = options.dryRun === true;

    if (dryRun) {
      const [rawDeleted, chartDeleted] = await Promise.all([
        this.projectChartHistoryModel.countDocuments({
          projectId: id,
          bucketTimestamp: { $type: "date" },
        }),
        this.chartModel.countDocuments({
          entityId: id,
          entityType: "project",
        }),
      ]);

      return {
        projectId: id.toString(),
        dryRun,
        rawDeleted,
        chartDeleted,
      };
    }

    const [rawResult, chartResult] = await Promise.all([
      this.projectChartHistoryModel.deleteMany({
        projectId: id,
        bucketTimestamp: { $type: "date" },
      }),
      this.chartModel.deleteMany({
        entityId: id,
        entityType: "project",
      }),
    ]);

    return {
      projectId: id.toString(),
      dryRun,
      rawDeleted: Number((rawResult as any).deletedCount || 0),
      chartDeleted: Number((chartResult as any).deletedCount || 0),
    };
  }

  private buildChartCacheFromPoints(chartPoints: any[]): Pick<Record<ChartTypes, any[]>, "chart24h" | "chart7d" | "chart30d"> {
    const sortedPoints = [...chartPoints].sort((a, b) => a.timestamp - b.timestamp);
    const nowMs = Date.now();
    const update = {} as Pick<Record<ChartTypes, any[]>, "chart24h" | "chart7d" | "chart30d">;

    this.projectChartCacheWriteTypes.forEach((type) => {
      const rangeMs = this.chartRangeMs[type];
      const points =
        rangeMs === Infinity
          ? sortedPoints
          : sortedPoints.filter((point) => point.timestamp >= nowMs - rangeMs);
      update[type] = this.downsampleEvenly(points, this.chartSliceLimits[type]);
    });

    return update;
  }

  private prepareMarketDataPoint(
    item: AddMarketDataPointsInput,
    options: AddMarketDataPointOptions,
  ): { status: "ok"; point: PreparedMarketDataPoint } | { status: "empty" | "disabled"; point?: never } {
    const source = item.point.source || options.source || "coingecko";

    if (!options.dryRun && !this.isMarketHistorySourceEnabled(source)) {
      return { status: "disabled" };
    }

    const price = this.toFinitePositiveNumber(item.point.price);
    const marketCap = this.toFinitePositiveNumber(item.point.marketCap);
    const volume24h = this.toFinitePositiveNumber(item.point.volume24h);
    const priceChange24h = this.toFiniteNumber(item.point.priceChange24h);

    if (price === null && marketCap === null && volume24h === null) {
      return { status: "empty" };
    }

    const projectId = typeof item.projectId === "string" ? new Types.ObjectId(item.projectId) : item.projectId;
    const timestamp = this.toDate(item.point.timestamp) || new Date();
    const bucketMs = this.resolveMarketHistoryBucketMs(options.bucketMs, item.point.tier || options.tier);
    const bucketTimestamp = new Date(Math.floor(timestamp.getTime() / bucketMs) * bucketMs);

    return {
      status: "ok",
      point: {
        projectId,
        projectIdString: projectId.toString(),
        timestamp,
        bucketTimestamp,
        source,
        price,
        marketCap,
        volume24h,
        priceChange24h,
      },
    };
  }

  private async updateChartCacheWithMarketDataPoints(points: PreparedMarketDataPoint[]): Promise<number> {
    if (!points.length) return 0;

    const nowMs = Date.now();
    const operations: any[] = [];

    for (const point of points) {
      const chartPoint = this.toMarketDataChartPoint(point);
      if (!chartPoint) continue;

      const filter = { entityId: point.projectId, entityType: "project" };
      operations.push({
        updateOne: {
          filter,
          update: {
            $setOnInsert: {
              entityId: point.projectId,
              entityType: "project",
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      });

      const pullUpdate: any = {};
      (Object.keys(this.chartRangeMs) as ChartTypes[]).forEach((type) => {
        if (this.isLongRangeCache(type)) return;
        const conditions: any[] = [{ timestamp: chartPoint.timestamp }];
        const rangeMs = this.chartRangeMs[type];
        if (rangeMs !== Infinity) {
          conditions.push({ timestamp: { $lt: nowMs - rangeMs } });
        }
        pullUpdate[type] = conditions.length === 1 ? conditions[0] : { $or: conditions };
      });
      operations.push({ updateOne: { filter, update: { $pull: pullUpdate } } });

      const pushUpdate: any = {};
      (Object.keys(this.chartRangeMs) as ChartTypes[]).forEach((type) => {
        if (this.isLongRangeCache(type)) return;
        const rangeMs = this.chartRangeMs[type];
        if (rangeMs !== Infinity && chartPoint.timestamp < nowMs - rangeMs) return;
        pushUpdate[type] = { $each: [chartPoint], $slice: -this.chartSliceLimits[type] };
      });
      if (Object.keys(pushUpdate).length) {
        operations.push({ updateOne: { filter, update: { $push: pushUpdate } } });
      }
    }

    if (!operations.length) return 0;

    let updated = 0;
    for (const chunk of this.chunk(operations, 1000)) {
      const result = await this.chartModel.bulkWrite(chunk, { ordered: true });
      updated += Number((result as any).modifiedCount || 0) + Number((result as any).upsertedCount || 0);
    }
    return updated;
  }

  private toMarketDataChartPoint(point: PreparedMarketDataPoint): any | null {
    if (point.price === null && point.marketCap === null && point.volume24h === null) return null;

    const chartPoint: any = {
      timestamp: point.bucketTimestamp.getTime(),
      source: point.source,
    };

    if (point.price !== null) {
      chartPoint.price = { USD: point.price };
    }
    if (point.marketCap !== null) {
      chartPoint.marketCap = point.marketCap;
    }
    if (point.volume24h !== null) {
      chartPoint.volume24h = point.volume24h;
    }
    if (point.priceChange24h !== null) {
      chartPoint.priceChange24h = point.priceChange24h;
      chartPoint.priceChange = point.priceChange24h;
    }

    return chartPoint;
  }

  private isLongRangeCache(type: ChartTypes): boolean {
    return type === "chart90d" || type === "chart1y" || type === "chartAll";
  }

  private downsampleEvenly<T>(points: T[], maxPoints: number): T[] {
    if (!points.length || maxPoints <= 0) return [];
    if (points.length <= maxPoints) return points;
    if (maxPoints === 1) return [points[points.length - 1]];

    const result: T[] = [];
    const lastIndex = points.length - 1;
    const usedIndexes = new Set<number>();

    for (let index = 0; index < maxPoints; index += 1) {
      const sourceIndex =
        index === maxPoints - 1
          ? lastIndex
          : Math.floor((index * lastIndex) / (maxPoints - 1));
      if (usedIndexes.has(sourceIndex)) continue;
      usedIndexes.add(sourceIndex);
      result.push(points[sourceIndex]);
    }

    if (result[result.length - 1] !== points[lastIndex]) {
      if (result.length >= maxPoints) {
        result[result.length - 1] = points[lastIndex];
      } else {
        result.push(points[lastIndex]);
      }
    }

    return result;
  }

  private resolveMarketHistoryBucketMs(bucketMs?: number, tier?: MarketHistoryTier): number {
    const explicit = Number(bucketMs);
    if (Number.isFinite(explicit) && explicit >= 60 * 1000) return Math.trunc(explicit);
    return this.marketHistoryBucketMsByTier[tier || "HOT"];
  }

  private isMarketHistorySourceEnabled(source: ProjectChartHistorySource): boolean {
    if (source === "coingecko") {
      return this.readBooleanFlag("COINGECKO_HISTORY_WRITE_ENABLED", true);
    }
    if (source === "dropstab_legacy") {
      return this.readBooleanFlag("DROPSTAB_PRICE_HISTORY_WRITE_ENABLED", false);
    }
    if (source === "bybit_legacy") {
      return this.readBooleanFlag("BYBIT_PRICE_HISTORY_WRITE_ENABLED", false);
    }
    return false;
  }

  private readBooleanFlag(name: string, defaultValue: boolean): boolean {
    const value = this.configService.get(name) ?? process.env[name];
    if (value === undefined || value === null || value === "") return defaultValue;
    const normalized = String(value).trim().toLowerCase();
    if (["false", "0", "off", "no"].includes(normalized)) return false;
    if (["true", "1", "on", "yes"].includes(normalized)) return true;
    return defaultValue;
  }

  private toDate(value: any): Date | null {
    if (value instanceof Date && Number.isFinite(value.getTime())) return value;
    const date = value === undefined || value === null || value === "" ? null : new Date(value);
    return date && Number.isFinite(date.getTime()) ? date : null;
  }

  private toFiniteNumber(value: any): number | null {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private toFinitePositiveNumber(value: any): number | null {
    const numberValue = this.toFiniteNumber(value);
    return numberValue !== null && numberValue > 0 ? numberValue : null;
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  }

  async buildComparisons(data: any) {
    const result = {
      marketCapComparison: [],
      fdvComparison: []
    };

    if (!data?.competitorsByTags?.length) {
      return result;
    }

    for (const competitorGroup of data.competitorsByTags) {
      const { tag, marketCapCompetitors = [], fdvCompetitors = [] } = competitorGroup;

      const marketCapCategory = {
        tag: {
          id: tag.id,
          slug: tag.slug,
          displayName: tag.displayName
        },
        competitors: []
      };

      const fdvCategory = {
        tag: {
          id: tag.id,
          slug: tag.slug,
          displayName: tag.displayName
        },
        competitors: []
      };

      for (const c of marketCapCompetitors.slice(0, 5)) {
        marketCapCategory.competitors.push({
          capId: c.currencyId || null,
          symbol: c.symbol,
          name: c.name,
          slug: c.slug,
          logo: c.image,
          niche: c.symbol,
          rank: c.rank ?? null,
          price: c.price?.USD ?? null,
          marketCap: c.marketCap?.USD ?? null,
          fdv: c.fdv ?? null,
          gainPotential: c.gainPotential ?? null,
          change24h: c.change24h?.USD ?? null,
          change7d: c.change7d?.USD ?? null,
        });
      }

      for (const c of fdvCompetitors.slice(0, 5)) {
        fdvCategory.competitors.push({
          capId: c.currencyId || null,
          symbol: c.symbol,
          name: c.name,
          slug: c.slug,
          niche: c.symbol,
          logo: c.image,
          rank: c.rank ?? null,
          price: c.price?.USD ?? null,
          marketCap: c.marketCap?.USD ?? null,
          fdv: c.fdv ?? null,
          gainPotential: c.gainPotential ?? null,
          change24h: c.change24h?.USD ?? null,
          change7d: c.change7d?.USD ?? null,
        });
      }

      result.marketCapComparison.push(marketCapCategory);
      result.fdvComparison.push(fdvCategory);
    }

    return result;
  }

  async getComparisonList(
    category: string,
    sortBy: 'marketCap' | 'fullyDilutedMarketCap' = 'marketCap',
    limit: string | number = '50',
    topLimit = 5
  ): Promise<any> {
    const safeCategory = String(category || "").trim().toLowerCase();
    if (!safeCategory || !/^[a-z0-9-]+$/i.test(safeCategory)) {
      throw new BadRequestException("Invalid comparison category");
    }

    const safeSortBy = sortBy === "fullyDilutedMarketCap" ? "fullyDilutedMarketCap" : "marketCap";
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);

    return this.cacheService.wrap({
      key: CacheKeys.analytics.comparison({
        category: safeCategory,
        sortBy: safeSortBy,
        limit: safeLimit,
      }),
      ttl: CACHE_TTL_SECONDS.analyticsComparison,
      factory: async () => this.getComparisonListFresh(safeCategory, safeSortBy, safeLimit, topLimit),
    });
  }

  private async getComparisonListFresh(
    category: string,
    sortBy: 'marketCap' | 'fullyDilutedMarketCap',
    limit: number,
    topLimit = 5
  ): Promise<any> {
    // получаем топ-активы
    const topProjects = await this.projectModel.find({ 'mainCategory.name': category })
      .sort({ rank: 1 }) // rank ↑ , marketCap ↓
      .limit(topLimit)

    const data = await axios.get(`https://api2.icodrops.com/portfolio/api/markets/competitors/v2/${encodeURIComponent(category)}`)

    const topCaps = topProjects.reduce((acc, p) => {
      acc[p.slug.toUpperCase()] = p.marketCap;
      return acc;
    }, {} as Record<string, number>);

    const projects = await this.projectModel.aggregate([
      {
        $match: {
          'mainCategory.slug': category.toLowerCase(),
          trading: "CURRENTLY_TRADING",
          [sortBy]: { $type: 'number', $gt: 0 },
        },
      },
      { $sort: { [sortBy]: -1 } },
      { $limit: limit },
      {
        $project: {
          name: 1,
          symbol: 1,
          marketCap: 1,
          fullyDilutedMarketCap: 1,
          price: 1,
          logo: 1,
          usdQuote: 1,
        },
      },
    ]);

    return this.buildComparisons(data.data);
  }

  async addFundingPoint(
    entityId: string | Types.ObjectId,
    entityType: EntityTypes,
    fundingData: {
      marketCap: number;
      price: { USD: number; BTC: number; ETH: number; SOL: number };
      volume24h: number;
      timestamp: number;
    }
  ): Promise<void> {
    const id = typeof entityId === "string" ? new Types.ObjectId(entityId) : entityId;
    const now = Date.now();
    const pointTimestamp = Number(fundingData.timestamp || now);
    const chartTypesToWrite =
      entityType === "project"
        ? this.projectChartCacheWriteTypes
        : (Object.keys(this.chartRangeMs) as ChartTypes[]);
    const chartFieldsOnInsert = chartTypesToWrite.reduce((fields, type) => {
      fields[type] = [];
      return fields;
    }, {} as Partial<Record<ChartTypes, any[]>>);

    await this.chartModel.updateOne(
      { entityId: id, entityType },
      {
        $setOnInsert: {
          entityId: id,
          entityType,
          createdAt: new Date(),
          ...chartFieldsOnInsert,
        },
      },
      { upsert: true }
    );

    const pullUpdate: any = {};
    chartTypesToWrite.forEach((type) => {
      const conditions: any[] = [{ timestamp: pointTimestamp }];
      if (this.chartRangeMs[type] !== Infinity) {
        conditions.push({ timestamp: { $lt: now - this.chartRangeMs[type] } });
      }
      pullUpdate[type] = conditions.length === 1 ? conditions[0] : { $or: conditions };
    });

    await this.chartModel.updateOne(
      { entityId: id, entityType },
      { $pull: pullUpdate }
    );

    const pushUpdate: any = {};
    chartTypesToWrite.forEach((type) => {
      if (this.chartRangeMs[type] !== Infinity && pointTimestamp < now - this.chartRangeMs[type]) return;
      pushUpdate[type] = { $each: [fundingData], $slice: -this.chartSliceLimits[type] };
    });

    if (Object.keys(pushUpdate).length) {
      await this.chartModel.updateOne(
        { entityId: id, entityType },
        { $push: pushUpdate }
      );
    }
  }

  private getDateRangeForTab(tab: string) {
    const end = Date.now();
    let start: number;

    switch (tab) {
      case '24H':
        start = end - 24 * 60 * 60 * 1000;
        break;
      case '7D':
        start = end - 7 * 24 * 60 * 60 * 1000;
        break;
      case 'MTD':
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        break;
      case '30D':
        start = end - 30 * 24 * 60 * 60 * 1000;
        break;
      case '90D':
        start = end - 90 * 24 * 60 * 60 * 1000;
        break;
      case 'YTD':
        start = new Date(new Date().getFullYear(), 0, 1).getTime();
        break;
      default:
        start = end - 30 * 24 * 60 * 60 * 1000;
    }

    return { start, end };
  }

  async updateFundsCategories() {
    const { data } = await axios.get(
      'https://api2.icodrops.com/portfolio/api/currencyTags?currencyDataRequired=true'
    );

    const categoriesArray = data.map((cat: any) => ({
      id: cat.id,
      slug: cat.slug,
      displayName: cat.displayName,
      description: cat.description,
      hidden: cat.hidden || false,
      rank: cat.rank || 0,
      topImagesLinks: cat.topImagesLinks || [],
      historicalData: {
        marketCap: cat.historicalData?.marketCap || 0,
        fdv: cat.historicalData?.fdv || 0,
        gainers: cat.historicalData?.gainers || 0,
        losers: cat.historicalData?.losers || 0,
        dominance: cat.historicalData?.dominance || 0,
        dominanceChange24h: cat.historicalData?.dominanceChange24h || 0,
        priceChange: cat.historicalData?.priceChange || {},
        marketCapChange: cat.historicalData?.marketCapChange || {},
        marketCapChange24h: cat.historicalData?.marketCapChange24h || 0,
      },
      updatedAt: new Date(),
    }));

    let chart: any | null = await this.chartModel.findOne({ entityType: 'category' });

    if (chart) {
      chart.chartAll = categoriesArray.slice(0, 24);
      chart.createdAt = new Date();
      await chart.save();
    } else {
      chart = await this.chartModel.create({
        entityType: 'category',
        entityId: new mongoose.Types.ObjectId(),
        chartAll: categoriesArray.slice(0, 24),
        createdAt: new Date(),
      });
    }

    return chart;
  }

  private async generateChartData(
    rounds: FundingDynamicsRound[],
    maxDates = 7,
    topCategories = 6,
    groupByDays: number = 1
  ) {
    const getGroupKey = (date: Date): string => {
      if (groupByDays <= 1) {
        return date.toISOString().split("T")[0];
      } else {
        const timestamp = date.getTime();
        const periodMs = groupByDays * 24 * 60 * 60 * 1000;
        const periodStart = new Date(Math.floor(timestamp / periodMs) * periodMs);
        return periodStart.toISOString().split("T")[0];
      }
    };

    const groupedByPeriod: Record<string, FundingDynamicsRound[]> = {};
    rounds.forEach(r => {
      const raisedAmount = Number(r.raisedAmount);
      const fundingDate = new Date(r.fundingDate || "");
      if (!Number.isFinite(raisedAmount) || raisedAmount <= 0) return;
      if (Number.isNaN(fundingDate.getTime())) return;
      const periodKey = getGroupKey(fundingDate);
      if (!groupedByPeriod[periodKey]) groupedByPeriod[periodKey] = [];
      groupedByPeriod[periodKey].push(r);
    });

    const sortedPeriods = Object.keys(groupedByPeriod)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-maxDates);

    const formatDisplayDate = (date: Date) => {
      if (groupByDays <= 1) {
        return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
      } else if (groupByDays === 7) {
        return `Week of ${date.toLocaleDateString("en-US", { day: "2-digit", month: "short" })}`;
      } else {
        const endDate = new Date(date.getTime() + (groupByDays - 1) * 24 * 60 * 60 * 1000);
        return `${date.toLocaleDateString("en-US", { day: "2-digit", month: "short" })} - ${endDate.toLocaleDateString("en-US", { day: "2-digit", month: "short" })}`;
      }
    };

    const data = sortedPeriods.map(periodKey => {
      const roundsForPeriod = groupedByPeriod[periodKey];

      const categoryStats: Record<string, { total: number; rounds: FundingDynamicsRound[] }> = {};

      roundsForPeriod.forEach(r => {
        const category = r.projectCategory || r.roundType || "Unknown";
        if (!categoryStats[category]) {
          categoryStats[category] = { total: 0, rounds: [] };
        }
        categoryStats[category].total += Number(r.raisedAmount) || 0;
        categoryStats[category].rounds.push(r);
      });

      const sortedCategories = Object.entries(categoryStats)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, topCategories)
        .map(([category]) => category);

      const periodStartDate = new Date(periodKey);
      const item: any = {
        name: formatDisplayDate(periodStartDate),
        date: periodStartDate,
        periodEnd: new Date(periodStartDate.getTime() + (groupByDays - 1) * 24 * 60 * 60 * 1000),
        categories: sortedCategories,
        keyProjects: [],
      };

      const topProjects = roundsForPeriod
        .sort((a, b) => (Number(b.raisedAmount) || 0) - (Number(a.raisedAmount) || 0))
        .slice(0, 3)
        .map((r: any) => ({
          name: r.projectSymbol || r.projectName || r.projectSlug,
          coinSlug: r.projectSlug,
          amount: Number(r.raisedAmount) || 0,
          category: r.projectCategory || r.roundType || "Unknown"
        }));

      item.keyProjects = topProjects;

      sortedCategories.forEach((cat, idx) => {
        const catTotal = categoryStats[cat].total;
        item[`investments${idx}`] = catTotal;
      });

      for (let i = sortedCategories.length; i < 5; i++) {
        item[`investments${i}`] = 0;
      }

      item.totalInvestment = Object.keys(item)
        .filter(key => key.startsWith('investments'))
        .reduce((sum, key) => sum + (item[key] || 0), 0);

      return item;
    });

    return data;
  }

  async updateFundingDynamics() {
    const rounds: FundingDynamicsRound[] = await this.fundingRoundModel
      .find(
        {
          visible: true,
          raisedAmount: { $gt: 0 },
          fundingDate: { $ne: null },
        },
        {
          _id: 0,
          fundingDate: 1,
          raisedAmount: 1,
          projectCategory: 1,
          roundType: 1,
          projectSymbol: 1,
          projectSlug: 1,
          projectName: 1,
        },
      )
      .lean();
    const now: Date = new Date();

    const chart24h = await this.generateChartData(
      rounds.filter(r => new Date(r.fundingDate || "") >= new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)),
      24,
      6,
      2
    );

    const chart7d = await this.generateChartData(
      rounds.filter(r => new Date(r.fundingDate || "") >= new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)),
      14,
      6,
      2
    );

    // 30 дней - группировка по 3 дня
    const chart30d = await this.generateChartData(
      rounds.filter(r => new Date(r.fundingDate || "") >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)),
      20, // 30 дней / 3 = 10 периодов
      6,
      3 // группировка по 3 дня
    );

    // 90 дней - группировка по неделе
    const chart90d = await this.generateChartData(
      rounds.filter(r => new Date(r.fundingDate || "") >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)),
      13, // 90 дней / 7 ≈ 13 недель
      6,
      7
    );

    const chart1y = await this.generateChartData(
      rounds.filter(r => new Date(r.fundingDate || "") >= new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)),
      12,
      6,
      30
    );


    const chartAll = await this.generateChartData(
      rounds,
      24,
      6,
      30
    );

    await this.chartModel.findOneAndUpdate(
      { entityType: 'funding-dynamics' },
      {
        $set: {
          chart24h,
          chart7d,
          chart30d,
          chart90d,
          chart1y,
          chartAll,
          createdAt: now,
        },
      },
      { upsert: true }
    );
  }

  async getFundsStatsByRegion(regionId: string, countryName?: string) {
    const normalizedRegionId = String(regionId || "").trim();
    const normalizedCountryName = String(countryName || "").trim();
    const countryMatchConditions: any[] = [];
    const toNumber = (input: any) => ({
      $convert: { input, to: "double", onError: 0, onNull: 0 },
    });

    if (normalizedRegionId) {
      countryMatchConditions.push(
        { "regionData.id": normalizedRegionId },
        { country: normalizedRegionId },
        { tableCountry: normalizedRegionId },
        { location: normalizedRegionId },
      );
    }

    if (normalizedCountryName) {
      countryMatchConditions.push(
        { country: normalizedCountryName },
        { tableCountry: normalizedCountryName },
        { "regionData.properties.name": normalizedCountryName },
        { location: normalizedCountryName },
      );
    }

    if (!countryMatchConditions.length) {
      return {
        regionId: normalizedRegionId,
        country: normalizedCountryName,
        totalInvestAmount: 0,
        fundsCount: 0,
        portfolioCoins: [],
        keyProjects: [],
        topProjects: [],
        topCategories: [],
        topInvestors: [],
        topCategory: "",
        topCategoryCount: 0,
      };
    }

    const [result = {}] = await this.fundModel.aggregate([
      {
        $match: {
          $and: [
            {
              $or: [
                { status: "active" },
                { status: "Active" },
                { status: { $exists: false } },
                { status: null },
              ],
            },
            { $or: countryMatchConditions },
          ],
        },
      },
      {
        $addFields: {
          investmentAmountNumber: {
            $let: {
              vars: {
                values: [
                  toNumber("$tableInvestAmount"),
                  toNumber("$investAmount"),
                  toNumber("$totalInvestment"),
                  toNumber("$currentAum"),
                ],
              },
              in: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$$values",
                          as: "value",
                          cond: { $ne: ["$$value", 0] },
                        },
                      },
                      0,
                    ],
                  },
                  0,
                ],
              },
            },
          },
          ratingNumber: {
            $let: {
              vars: {
                values: [
                  toNumber("$tableRating"),
                  toNumber("$rating"),
                  toNumber("$fomoScore"),
                ],
              },
              in: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$$values",
                          as: "value",
                          cond: { $ne: ["$$value", 0] },
                        },
                      },
                      0,
                    ],
                  },
                  0,
                ],
              },
            },
          },
          projectsCountNumber: {
            $max: [
              toNumber("$tableProjectsCount"),
              toNumber("$projectsCount"),
              toNumber("$supportedProjectsCount"),
              toNumber("$totalInvestments"),
              toNumber("$numberOfInvestments"),
              toNumber("$portfolioCoinsCount"),
              { $size: { $ifNull: ["$portfolioCoins", []] } },
            ],
          },
        },
      },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalInvestAmount: { $sum: "$investmentAmountNumber" },
                fundsCount: { $sum: 1 },
              },
            },
            {
              $project: {
                _id: 0,
                totalInvestAmount: { $round: ["$totalInvestAmount", 2] },
                fundsCount: 1,
              },
            },
          ],
          topInvestors: [
            { $sort: { ratingNumber: -1, projectsCountNumber: -1, name: 1 } },
            { $limit: 8 },
            {
              $project: {
                _id: 0,
                id: { $toString: "$_id" },
                name: 1,
                slug: 1,
                logo: 1,
                image: "$logo",
                rating: { $round: ["$ratingNumber", 1] },
                projectsCount: "$projectsCountNumber",
                investAmount: "$investmentAmountNumber",
              },
            },
          ],
          topProjects: [
            { $unwind: { path: "$portfolioCoins", preserveNullAndEmptyArrays: false } },
            {
              $project: {
                projectName: {
                  $ifNull: [
                    "$portfolioCoins.name",
                    {
                      $ifNull: [
                        "$portfolioCoins.projectName",
                        "$portfolioCoins.title",
                      ],
                    },
                  ],
                },
                slug: {
                  $ifNull: [
                    "$portfolioCoins.slug",
                    "$portfolioCoins.projectSlug",
                  ],
                },
                logo: {
                  $ifNull: [
                    "$portfolioCoins.logo",
                    {
                      $ifNull: [
                        "$portfolioCoins.image",
                        "$portfolioCoins.projectLogo",
                      ],
                    },
                  ],
                },
                symbol: {
                  $ifNull: [
                    "$portfolioCoins.symbol",
                    "$portfolioCoins.ticker",
                  ],
                },
                category: {
                  $ifNull: [
                    "$portfolioCoins.category",
                    "$portfolioCoins.sector",
                  ],
                },
                amount: toNumber({
                  $ifNull: [
                    "$portfolioCoins.amount",
                    {
                      $ifNull: [
                        "$portfolioCoins.fundsRaised",
                        "$portfolioCoins.totalRaised",
                      ],
                    },
                  ],
                }),
              },
            },
            {
              $project: {
                projectName: {
                  $trim: {
                    input: {
                      $convert: {
                        input: "$projectName",
                        to: "string",
                        onError: "",
                        onNull: "",
                      },
                    },
                  },
                },
                slug: 1,
                logo: 1,
                symbol: 1,
                category: 1,
                amount: 1,
              },
            },
            { $match: { projectName: { $ne: "" } } },
            {
              $group: {
                _id: {
                  name: "$projectName",
                  slug: "$slug",
                },
                name: { $first: "$projectName" },
                slug: { $first: "$slug" },
                logo: { $first: "$logo" },
                image: { $first: "$logo" },
                symbol: { $first: "$symbol" },
                category: { $first: "$category" },
                amount: { $sum: "$amount" },
                backersCount: { $sum: 1 },
              },
            },
            { $sort: { backersCount: -1, amount: -1, name: 1 } },
            { $limit: 10 },
            { $project: { _id: 0 } },
          ],
          topCategories: [
            {
              $project: {
                rawCategories: {
                  $setUnion: [
                    { $ifNull: ["$categories", []] },
                    { $ifNull: ["$sectors", []] },
                    {
                      $map: {
                        input: { $ifNull: ["$roundsByCategory", []] },
                        as: "round",
                        in: "$$round.name",
                      },
                    },
                    {
                      $cond: [
                        { $ne: [{ $trim: { input: { $toString: { $ifNull: ["$industryFocus", ""] } } } }, ""] },
                        ["$industryFocus"],
                        [],
                      ],
                    },
                    {
                      $cond: [
                        { $ne: [{ $trim: { input: { $toString: { $ifNull: ["$niche", ""] } } } }, ""] },
                        ["$niche"],
                        [],
                      ],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                categories: {
                  $filter: {
                    input: {
                      $map: {
                        input: "$rawCategories",
                        as: "category",
                        in: {
                          $trim: {
                            input: {
                              $convert: {
                                input: "$$category",
                                to: "string",
                                onError: "",
                                onNull: "",
                              },
                            },
                          },
                        },
                      },
                    },
                    as: "category",
                    cond: {
                      $and: [
                        { $ne: ["$$category", ""] },
                        { $ne: [{ $toLower: "$$category" }, "all"] },
                        { $ne: ["$$category", "[object Object]"] },
                      ],
                    },
                  },
                },
              },
            },
            {
              $project: {
                categories: {
                  $cond: [
                    { $gt: [{ $size: "$categories" }, 0] },
                    "$categories",
                    ["Unknown"],
                  ],
                },
              },
            },
            { $unwind: "$categories" },
            { $group: { _id: "$categories", value: { $sum: 1 } } },
            { $sort: { value: -1, _id: 1 } },
            { $limit: 8 },
            { $project: { _id: 0, label: "$_id", value: 1 } },
          ],
        },
      },
      {
        $project: {
          summary: { $ifNull: [{ $arrayElemAt: ["$summary", 0] }, {}] },
          topInvestors: 1,
          topProjects: 1,
          topCategories: 1,
        },
      },
    ]);
    const summary = result.summary || {};
    const topProjects = result.topProjects || [];
    const topCategories = result.topCategories || [];
    const topCategory = topCategories[0]?.label || "";

    return {
      regionId: normalizedRegionId,
      country: normalizedCountryName,
      totalInvestAmount: summary.totalInvestAmount || 0,
      fundsCount: summary.fundsCount || 0,
      portfolioCoins: topProjects,
      keyProjects: topProjects,
      topProjects,
      topCategories,
      topInvestors: result.topInvestors || [],
      topCategory,
      topCategoryCount: topCategories[0]?.value || 0,
    };
  }

  private transformToChartData(priceHistory: any): Array<any> {
    return priceHistory.prices.map(([timestamp, price]) => ({
      timestamp: timestamp,
      price: {
        USD: price
      },
    }));
  }

  @Cron(CronExpression.EVERY_2_HOURS)
  async update7DaysPriceHistory() {
    try {
      if (this.configService.get("IS_LOCAL_RUN") === "true") return;
      if (!this.readBooleanFlag("BYBIT_PRICE_HISTORY_WRITE_ENABLED", false)) {
        return;
      }

      const projects = await this.projectModel
        .find({ rank: { $ne: null } })
        .sort({ rank: 1 })
        .select("slug _id").limit(200);
   
      const batchSize = 10;
      const successfulUpdates = [];

      for (let i = 0; i < projects.length; i += batchSize) {
        const batch = projects.slice(i, i + batchSize);

        for (const project of batch) {
          try {
            const priceHistory = await this.fetchFromBybit(project.slug);

            if (priceHistory && priceHistory.length > 0) {

              const result = await this.upsertChartData(
                project._id,
                "project",
                "chart7d",
                priceHistory
              );

              await this.projectModel.updateOne(
                { _id: project._id },
                {
                  $set: {
                    lastPriceHistoryUpdate: new Date(),
                    chartImage7d: result.chartImage
                  }
                }
              );

              successfulUpdates.push(project.slug);
            }

            await new Promise(resolve => setTimeout(resolve, 3000));
          } catch (error) {
            console.error(`Error fetching history for ${project.slug}:`, error);
          }
        }
      }

      console.log(`7-day price history updated for ${successfulUpdates.length} projects:`, successfulUpdates);
    } catch (error) {
      console.error("Error updating 7-day price history:", error);
    }
  }
}
