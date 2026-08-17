import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  FomoV2MarketProjectHistory,
  FomoV2MarketProjectReadModel,
  FomoV2ProjectMarketSnapshot,
} from "../models";

export type FomoV2MarketChartRange = "24H" | "7D" | "30D" | "90D" | "6M" | "1Y" | "ALL";

type FomoV2MarketChartCustomRange = {
  startDate: Date;
  endDate: Date;
  durationMs: number;
};

type FomoV2MarketChartRequestConfig = {
  range: FomoV2MarketChartRange;
  requestedRange: FomoV2MarketChartRange | "CUSTOM";
  customRange?: FomoV2MarketChartCustomRange;
};

interface ResolvedMarketChartProject {
  row: any;
  readModelId: string;
  marketAssetId: Types.ObjectId;
  canonicalProjectId?: string;
  coingeckoId?: string;
  name?: string;
  symbol?: string;
  logo?: string;
  rank?: number;
  tier?: string;
}

export type FomoV2MarketAssetDailyPricePoint = {
  marketAssetId: string;
  timestamp: number;
  createdAt: string;
  date: string;
  price: number;
  marketCap?: number;
  volume24h?: number;
  source: "project_market_snapshots" | "market_project_histories";
};

@Injectable()
export class FomoV2MarketProjectChartReadService {
  private readonly rangeMs: Record<FomoV2MarketChartRange, number> = {
    "24H": 24 * 60 * 60 * 1000,
    "7D": 7 * 24 * 60 * 60 * 1000,
    "30D": 30 * 24 * 60 * 60 * 1000,
    "90D": 90 * 24 * 60 * 60 * 1000,
    "6M": 182 * 24 * 60 * 60 * 1000,
    "1Y": 365 * 24 * 60 * 60 * 1000,
    ALL: Infinity,
  };

  private readonly maxPoints: Record<FomoV2MarketChartRange, number> = {
    "24H": 145,
    "7D": 169,
    "30D": 181,
    "90D": 91,
    "6M": 183,
    "1Y": 366,
    ALL: 1000,
  };

  private readonly bucketMs: Record<FomoV2MarketChartRange, number> = {
    "24H": 10 * 60 * 1000,
    "7D": 60 * 60 * 1000,
    "30D": 4 * 60 * 60 * 1000,
    "90D": 24 * 60 * 60 * 1000,
    "6M": 24 * 60 * 60 * 1000,
    "1Y": 24 * 60 * 60 * 1000,
    ALL: 7 * 24 * 60 * 60 * 1000,
  };

  private readonly bucketLabels: Record<FomoV2MarketChartRange, string> = {
    "24H": "10m",
    "7D": "1h",
    "30D": "4h",
    "90D": "1d",
    "6M": "1d",
    "1Y": "1d",
    ALL: "7d",
  };

  constructor(
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly readModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(FomoV2ProjectMarketSnapshot.name)
    private readonly snapshotModel: Model<FomoV2ProjectMarketSnapshot>,
    @InjectModel(FomoV2MarketProjectHistory.name)
    private readonly historyModel: Model<FomoV2MarketProjectHistory>,
  ) {}

  async getProjectChart(projectId: string, query: any = {}): Promise<any> {
    const { range, requestedRange, customRange } = this.resolveChartRequest(query);
    const project = await this.resolveProject(projectId);
    const rawPoints = await this.loadCombinedPoints(project, range, customRange);
    const bucketedPoints = this.bucketizePointsByRange(rawPoints, range);
    const points = this.downsampleEvenly(bucketedPoints, this.maxPoints[range]);
    const firstRawPoint = rawPoints[0];
    const lastRawPoint = rawPoints[rawPoints.length - 1];
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    return this.cleanObject({
      project: this.toProjectIdentity(project),
      range,
      points,
      history: points,
      meta: {
        source: "fomo-v2-market-chart",
        storage: ["project_market_snapshots", "market_project_histories"],
        requestedRange,
        customFrom: customRange?.startDate.toISOString(),
        customTo: customRange?.endDate.toISOString(),
        rawPoints: rawPoints.length,
        bucketedPoints: bucketedPoints.length,
        points: points.length,
        maxPoints: this.maxPoints[range],
        bucketIntervalMs: this.bucketMs[range],
        bucketInterval: this.bucketLabels[range],
        availableFrom: firstRawPoint?.createdAt,
        availableTo: lastRawPoint?.createdAt,
        returnedFrom: firstPoint?.createdAt,
        returnedTo: lastPoint?.createdAt,
        latestAvailableAt: lastRawPoint?.createdAt,
        staleMs: lastRawPoint?.timestamp ? Math.max(0, Date.now() - lastRawPoint.timestamp) : undefined,
      },
    });
  }

  async getMarketAssetChart(
    marketAssetId: Types.ObjectId | string,
    query: any = {},
  ): Promise<any> {
    const { range, requestedRange, customRange } = this.resolveChartRequest(query);
    const objectId =
      marketAssetId instanceof Types.ObjectId
        ? marketAssetId
        : this.toObjectId(marketAssetId);

    if (!objectId) {
      return {
        range,
        points: [],
        history: [],
        meta: {
          source: "fomo-v2-market-chart",
          requestedRange,
          rawPoints: 0,
          bucketedPoints: 0,
          points: 0,
        },
      };
    }

    const project: ResolvedMarketChartProject = {
      row: {},
      readModelId: this.toIdString(objectId) || "",
      marketAssetId: objectId,
    };
    const rawPoints = await this.loadCombinedPoints(project, range, customRange);
    const bucketedPoints = this.bucketizePointsByRange(rawPoints, range);
    const points = this.downsampleEvenly(bucketedPoints, this.maxPoints[range]);
    const firstRawPoint = rawPoints[0];
    const lastRawPoint = rawPoints[rawPoints.length - 1];
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    return this.cleanObject({
      range,
      points,
      history: points,
      meta: {
        source: "fomo-v2-market-chart",
        storage: ["project_market_snapshots", "market_project_histories"],
        requestedRange,
        customFrom: customRange?.startDate.toISOString(),
        customTo: customRange?.endDate.toISOString(),
        rawPoints: rawPoints.length,
        bucketedPoints: bucketedPoints.length,
        points: points.length,
        maxPoints: this.maxPoints[range],
        bucketIntervalMs: this.bucketMs[range],
        bucketInterval: this.bucketLabels[range],
        availableFrom: firstRawPoint?.createdAt,
        availableTo: lastRawPoint?.createdAt,
        returnedFrom: firstPoint?.createdAt,
        returnedTo: lastPoint?.createdAt,
        latestAvailableAt: lastRawPoint?.createdAt,
      },
    });
  }

  async getMarketAssetIdsWithChartData(
    marketAssetIds: Array<Types.ObjectId | string>,
  ): Promise<Set<string>> {
    const objectIds = Array.from(
      new Map(
        marketAssetIds
          .map((value) =>
            value instanceof Types.ObjectId ? value : this.toObjectId(value),
          )
          .filter((value): value is Types.ObjectId => Boolean(value))
          .map((value) => [value.toString(), value]),
      ).values(),
    );

    if (!objectIds.length) return new Set();

    const [snapshotAssetIds, historyAssetIds] = await Promise.all([
      this.snapshotModel.distinct("marketAssetId", {
        marketAssetId: { $in: objectIds },
        provider: "coingecko",
        priceUsd: { $gt: 0 },
      }),
      this.historyModel.distinct("marketAssetId", {
        marketAssetId: { $in: objectIds },
        price: { $gt: 0 },
      }),
    ]);

    return new Set(
      [...snapshotAssetIds, ...historyAssetIds]
        .map((value) => this.toIdString(value))
        .filter(Boolean) as string[],
    );
  }

  async getMarketAssetDailyPriceSeries(
    marketAssetIds: Array<Types.ObjectId | string>,
    query: any = {},
  ): Promise<Map<string, FomoV2MarketAssetDailyPricePoint[]>> {
    const range = this.normalizeRange(query?.range || query?.chartRange || query?.chartType);
    const objectIds = this.uniqueMarketAssetObjectIds(marketAssetIds);
    const result = new Map<string, FomoV2MarketAssetDailyPricePoint[]>();

    if (!objectIds.length) return result;

    const latestByAssetId = await this.loadLatestTimestampsByAssetIds(objectIds);
    const latestTimestamps = Array.from(latestByAssetId.values());
    if (!latestTimestamps.length) return result;

    const windowMs = this.rangeMs[range];
    const latestDate = new Date(Math.max(...latestTimestamps));
    const earliestDate =
      windowMs === Infinity
        ? undefined
        : new Date(Math.min(...latestTimestamps.map((timestamp) => timestamp - windowMs)));
    const snapshotTimestampFilter: Record<string, any> = { $lte: latestDate };
    const historyTimestampFilter: Record<string, any> = {
      $type: "date",
      $lte: latestDate,
    };

    if (earliestDate) {
      snapshotTimestampFilter.$gte = earliestDate;
      historyTimestampFilter.$gte = earliestDate;
    }

    const [snapshotRows, historyRows] = await Promise.all([
      this.snapshotModel
        .aggregate([
          {
            $match: {
              marketAssetId: { $in: objectIds },
              provider: "coingecko",
              priceUsd: { $gt: 0 },
              timestamp: snapshotTimestampFilter,
            },
          },
          { $sort: { marketAssetId: 1, timestamp: 1 } },
          {
            $group: {
              _id: {
                marketAssetId: "$marketAssetId",
                day: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$timestamp",
                  },
                },
              },
              marketAssetId: { $last: "$marketAssetId" },
              timestamp: { $last: "$timestamp" },
              price: { $last: "$priceUsd" },
              marketCap: { $last: "$marketCapUsd" },
              volume24h: { $last: "$volumeUsd" },
            },
          },
          { $sort: { marketAssetId: 1, timestamp: 1 } },
        ])
        .allowDiskUse(true)
        .exec(),
      this.historyModel
        .aggregate([
          {
            $match: {
              marketAssetId: { $in: objectIds },
              bucketTimestamp: historyTimestampFilter,
              price: { $gt: 0 },
            },
          },
          { $sort: { marketAssetId: 1, bucketTimestamp: 1 } },
          {
            $group: {
              _id: {
                marketAssetId: "$marketAssetId",
                day: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$bucketTimestamp",
                  },
                },
              },
              marketAssetId: { $last: "$marketAssetId" },
              timestamp: { $last: "$bucketTimestamp" },
              price: { $last: "$price" },
              marketCap: { $last: "$marketCap" },
              volume24h: { $last: "$volume24h" },
            },
          },
          { $sort: { marketAssetId: 1, timestamp: 1 } },
        ])
        .allowDiskUse(true)
        .exec(),
    ]);
    const pointsByAssetDay = new Map<string, FomoV2MarketAssetDailyPricePoint>();
    const putPoint = (
      row: any,
      source: FomoV2MarketAssetDailyPricePoint["source"],
    ) => {
      const marketAssetId = this.toIdString(row?.marketAssetId);
      const timestamp = this.toDate(row?.timestamp)?.getTime();
      const price = this.toFinitePositiveNumber(row?.price);
      const latestTimestamp = marketAssetId ? latestByAssetId.get(marketAssetId) : undefined;
      const startTimestamp =
        latestTimestamp && windowMs !== Infinity ? latestTimestamp - windowMs : undefined;

      if (!marketAssetId || !timestamp || price === null || !latestTimestamp) return;
      if (timestamp > latestTimestamp) return;
      if (startTimestamp && timestamp < startTimestamp) return;

      const date = new Date(timestamp).toISOString().slice(0, 10);
      pointsByAssetDay.set(
        `${marketAssetId}:${date}`,
        this.cleanObject({
          marketAssetId,
          timestamp,
          createdAt: new Date(timestamp).toISOString(),
          date,
          price,
          marketCap: this.toFiniteNumber(row?.marketCap),
          volume24h: this.toFiniteNumber(row?.volume24h),
          source,
        }) as FomoV2MarketAssetDailyPricePoint,
      );
    };

    (snapshotRows || []).forEach((row) => putPoint(row, "project_market_snapshots"));
    (historyRows || []).forEach((row) => putPoint(row, "market_project_histories"));

    Array.from(pointsByAssetDay.values())
      .sort((left, right) => left.timestamp - right.timestamp)
      .forEach((point) => {
        result.set(point.marketAssetId, [
          ...(result.get(point.marketAssetId) || []),
          point,
        ]);
      });

    return result;
  }

  async searchMarketProjects(query: any = {}): Promise<any> {
    const searchValue = this.firstString(query?.searchValue, query?.q, query?.query, query?.search);
    const limit = Math.min(this.positiveInteger(query?.limit, 20), 50);
    const filter: Record<string, any> = {
      trading: "CURRENTLY_TRADING",
      status: "active",
    };

    if (searchValue) {
      const regex = new RegExp(this.escapeRegExp(searchValue), "i");
      filter.$or = [
        { name: regex },
        { symbol: regex },
        { slug: regex },
        { "providerIds.coingeckoId": regex },
      ];
    }

    const rows = await this.readModel
      .aggregate([
        { $match: filter },
        {
          $addFields: {
            __rankSort: {
              $cond: [{ $gt: ["$rank", 0] }, "$rank", Number.MAX_SAFE_INTEGER],
            },
          },
        },
        { $sort: { __rankSort: 1, _id: 1 } },
        { $limit: limit },
        { $project: { __rankSort: 0 } },
      ])
      .exec();

    const assets = rows.map((row) => this.toSearchAsset(row));

    return {
      assets,
      projects: assets,
      total: assets.length,
      meta: {
        source: "fomo-v2-market-read-model",
        searchValue,
        limit,
      },
    };
  }

  private async resolveProject(projectId: string): Promise<ResolvedMarketChartProject> {
    const clauses = this.buildLookupClauses(projectId);
    if (!clauses.length) throw new NotFoundException("FOMO v2 market project not found.");

    const row = await this.readModel
      .findOne({
        trading: "CURRENTLY_TRADING",
        status: "active",
        $or: clauses,
      })
      .lean();

    if (!row?.marketAssetId) throw new NotFoundException("FOMO v2 market project not found.");

    return {
      row,
      readModelId: this.toIdString(row._id),
      marketAssetId: new Types.ObjectId(this.toIdString(row.marketAssetId)),
      canonicalProjectId: this.toIdString(row.canonicalProjectId),
      coingeckoId: this.firstString(row.providerIds?.coingeckoId),
      name: this.firstString(row.name),
      symbol: this.firstString(row.symbol),
      logo: this.firstString(row.logo),
      rank: this.toFiniteNumber(row.rank),
      tier: this.firstString(row.tier),
    };
  }

  private async loadCombinedPoints(
    project: ResolvedMarketChartProject,
    range: FomoV2MarketChartRange,
    customRange?: FomoV2MarketChartCustomRange,
  ): Promise<any[]> {
    const windowMs = this.rangeMs[range];
    const latestTimestamp = customRange
      ? customRange.endDate.getTime()
      : await this.loadLatestTimestamp(project.marketAssetId);
    if (!latestTimestamp) return [];

    const endDate = customRange?.endDate || new Date(latestTimestamp);
    const startDate =
      customRange?.startDate ||
      (windowMs === Infinity ? undefined : new Date(latestTimestamp - windowMs));
    const snapshotFilter: any = {
      marketAssetId: project.marketAssetId,
      provider: "coingecko",
      priceUsd: { $gt: 0 },
      timestamp: { $lte: endDate },
    };
    const historyFilter: any = {
      marketAssetId: project.marketAssetId,
      bucketTimestamp: { $lte: endDate },
    };

    if (startDate) {
      snapshotFilter.timestamp.$gte = startDate;
      historyFilter.bucketTimestamp.$gte = startDate;
    }

    const [snapshots, histories] = await Promise.all([
      this.snapshotModel
        .find(snapshotFilter, {
          timestamp: 1,
          priceUsd: 1,
          marketCapUsd: 1,
          volumeUsd: 1,
          btcPriceUsd: 1,
          ethPriceUsd: 1,
        })
        .sort({ timestamp: 1 })
        .lean(),
      this.historyModel
        .find(historyFilter, {
          timestamp: 1,
          bucketTimestamp: 1,
          price: 1,
          marketCap: 1,
          volume24h: 1,
          priceChange24h: 1,
          tier: 1,
        })
        .sort({ bucketTimestamp: 1 })
        .lean(),
    ]);

    const pointsByTimestamp = new Map<number, any>();
    for (const snapshot of snapshots as any[]) {
      const point = this.snapshotToChartPoint(snapshot);
      if (point) pointsByTimestamp.set(point.timestamp, point);
    }
    for (const history of histories as any[]) {
      const point = this.historyToChartPoint(history);
      if (!point) continue;
      const existing = pointsByTimestamp.get(point.timestamp);
      pointsByTimestamp.set(
        point.timestamp,
        existing
          ? this.cleanObject({
              ...existing,
              ...point,
              price: {
                ...(existing.price || {}),
                ...(point.price || {}),
              },
            })
          : point,
      );
    }

    return Array.from(pointsByTimestamp.values()).sort((left, right) => left.timestamp - right.timestamp);
  }

  private async loadLatestTimestamp(marketAssetId: Types.ObjectId): Promise<number | null> {
    const [snapshot, history] = await Promise.all([
      this.snapshotModel
        .findOne(
          {
            marketAssetId,
            provider: "coingecko",
            priceUsd: { $gt: 0 },
          },
          { timestamp: 1 },
        )
        .sort({ timestamp: -1 })
        .lean(),
      this.historyModel
        .findOne(
          {
            marketAssetId,
            bucketTimestamp: { $type: "date" },
          },
          { bucketTimestamp: 1, timestamp: 1 },
        )
        .sort({ bucketTimestamp: -1 })
        .lean(),
    ]);
    const timestamps = [
      this.toDate(snapshot?.timestamp)?.getTime(),
      this.toDate(history?.bucketTimestamp || history?.timestamp)?.getTime(),
    ].filter((value): value is number => Number.isFinite(value));

    return timestamps.length ? Math.max(...timestamps) : null;
  }

  private async loadLatestTimestampsByAssetIds(
    marketAssetIds: Types.ObjectId[],
  ): Promise<Map<string, number>> {
    if (!marketAssetIds.length) return new Map();

    const [snapshotRows, historyRows] = await Promise.all([
      this.snapshotModel
        .aggregate([
          {
            $match: {
              marketAssetId: { $in: marketAssetIds },
              provider: "coingecko",
              priceUsd: { $gt: 0 },
            },
          },
          { $group: { _id: "$marketAssetId", latest: { $max: "$timestamp" } } },
        ])
        .exec(),
      this.historyModel
        .aggregate([
          {
            $match: {
              marketAssetId: { $in: marketAssetIds },
              bucketTimestamp: { $type: "date" },
              price: { $gt: 0 },
            },
          },
          { $group: { _id: "$marketAssetId", latest: { $max: "$bucketTimestamp" } } },
        ])
        .exec(),
    ]);
    const latestByAssetId = new Map<string, number>();
    const applyLatest = (row: any) => {
      const key = this.toIdString(row?._id);
      const timestamp = this.toDate(row?.latest)?.getTime();
      if (!key || !timestamp) return;
      latestByAssetId.set(key, Math.max(latestByAssetId.get(key) || 0, timestamp));
    };

    (snapshotRows || []).forEach(applyLatest);
    (historyRows || []).forEach(applyLatest);

    return latestByAssetId;
  }

  private uniqueMarketAssetObjectIds(
    marketAssetIds: Array<Types.ObjectId | string>,
  ): Types.ObjectId[] {
    return Array.from(
      new Map(
        marketAssetIds
          .map((value) =>
            value instanceof Types.ObjectId ? value : this.toObjectId(value),
          )
          .filter((value): value is Types.ObjectId => Boolean(value))
          .map((value) => [value.toString(), value]),
      ).values(),
    );
  }

  private snapshotToChartPoint(snapshot: any): any | null {
    const timestamp = this.toDate(snapshot?.timestamp);
    const priceUsd = this.toFinitePositiveNumber(snapshot?.priceUsd);
    if (!timestamp || priceUsd === null) return null;

    const btcPriceUsd = this.toFinitePositiveNumber(snapshot?.btcPriceUsd);
    const ethPriceUsd = this.toFinitePositiveNumber(snapshot?.ethPriceUsd);

    return this.cleanObject({
      timestamp: timestamp.getTime(),
      createdAt: timestamp.toISOString(),
      source: "project_market_snapshots",
      price: this.cleanObject({
        USD: priceUsd,
        BTC: btcPriceUsd ? priceUsd / btcPriceUsd : undefined,
        ETH: ethPriceUsd ? priceUsd / ethPriceUsd : undefined,
      }),
      marketCap: this.toFiniteNumber(snapshot?.marketCapUsd),
      volume24h: this.toFiniteNumber(snapshot?.volumeUsd),
    });
  }

  private historyToChartPoint(history: any): any | null {
    const timestamp = this.toDate(history?.bucketTimestamp || history?.timestamp);
    const priceUsd = this.toFinitePositiveNumber(history?.price);
    const marketCap = this.toFiniteNumber(history?.marketCap);
    const volume24h = this.toFiniteNumber(history?.volume24h);
    if (!timestamp || (priceUsd === null && marketCap === undefined && volume24h === undefined)) return null;

    return this.cleanObject({
      timestamp: timestamp.getTime(),
      createdAt: timestamp.toISOString(),
      source: "market_project_histories",
      price: priceUsd === null ? undefined : { USD: priceUsd },
      marketCap,
      volume24h,
      priceChange24h: this.toFiniteNumber(history?.priceChange24h),
      tier: this.firstString(history?.tier),
    });
  }

  private buildLookupClauses(value: string): Record<string, any>[] {
    const normalized = this.normalizeLookupKey(value);
    const objectId = this.toObjectId(value);
    const clauses: Record<string, any>[] = [];

    if (normalized) {
      clauses.push(
        { "providerIds.coingeckoId": normalized },
        { slug: normalized },
      );
    }
    if (objectId) {
      clauses.push(
        { _id: objectId },
        { marketAssetId: objectId },
        { canonicalProjectId: objectId },
        { legacyProjectId: objectId },
      );
    }

    return clauses;
  }

  private toProjectIdentity(project: ResolvedMarketChartProject): any {
    return this.cleanObject({
      _id: project.coingeckoId || project.readModelId,
      id: project.coingeckoId || project.readModelId,
      readModelId: project.readModelId,
      marketAssetId: this.toIdString(project.marketAssetId),
      canonicalProjectId: project.canonicalProjectId,
      coingeckoId: project.coingeckoId,
      projectType: "market",
      name: project.name,
      symbol: project.symbol,
      logo: project.logo,
      rank: project.rank,
      tier: project.tier,
    });
  }

  private toSearchAsset(row: any): any {
    const coingeckoId = this.firstString(row.providerIds?.coingeckoId);
    const routeId = coingeckoId || this.toIdString(row.marketAssetId) || this.toIdString(row._id);
    const symbol =
      typeof row.symbol === "string" ? row.symbol.toUpperCase() : row.symbol;
    const price =
      this.toFiniteNumber(row.price) ??
      this.toFiniteNumber(row.usdQuote?.price);
    const priceChange =
      this.toFiniteNumber(row.priceChange) ??
      this.toFiniteNumber(row.usdQuote?.percent_change_24h) ??
      this.toFiniteNumber(row.performance?.usd?.change24h);
    const usdQuote = this.cleanObject({
      ...(row.usdQuote || {}),
      price,
      percent_change_24h: priceChange,
    });
    const projectData = this.cleanObject({
      _id: routeId,
      id: routeId,
      readModelId: this.toIdString(row._id),
      marketAssetId: this.toIdString(row.marketAssetId),
      canonicalProjectId: this.toIdString(row.canonicalProjectId),
      coingeckoId,
      projectType: "market",
      name: row.name,
      symbol,
      ticker: symbol,
      logo: row.logo,
      rank: row.rank,
      tier: row.tier,
      price,
      change24h: priceChange,
      percent_change_24h: priceChange,
      priceChange,
      priceChange24h: priceChange,
      usdQuote,
    });

    return this.cleanObject({
      _id: routeId,
      type: "buy",
      name: row.name,
      ticker: symbol || "",
      symbol: symbol || "",
      price: price || 0,
      change24h: priceChange,
      percent_change_24h: priceChange,
      priceChange,
      priceChange24h: priceChange,
      usdQuote,
      logo: row.logo || "",
      amount: 0,
      totalPrice: 0,
      fee: 0,
      date: new Date(),
      createAt: new Date(),
      isSelectedAsset: false,
      coingeckoId,
      readModelId: this.toIdString(row._id),
      marketAssetId: this.toIdString(row.marketAssetId),
      projectData,
    });
  }

  private normalizeRange(value: any): FomoV2MarketChartRange {
    const normalized = String(value || "30D")
      .trim()
      .toUpperCase()
      .replace(/[\s_-]+/g, "");
    const withoutChart = normalized.startsWith("CHART")
      ? normalized.slice("CHART".length)
      : normalized;

    if (withoutChart === "24H") return "24H";
    if (withoutChart === "7D") return "7D";
    if (withoutChart === "1M" || withoutChart === "30D") return "30D";
    if (withoutChart === "3M" || withoutChart === "90D") return "90D";
    if (withoutChart === "6M") return "6M";
    if (withoutChart === "1Y") return "1Y";
    if (withoutChart === "ALL" || withoutChart === "ALLTIME" || withoutChart === "MAX") return "ALL";
    return "30D";
  }

  private resolveChartRequest(query: any = {}): FomoV2MarketChartRequestConfig {
    const customRange = this.normalizeCustomRange(query);
    if (customRange) {
      return {
        range: this.resolveRangeForDuration(customRange.durationMs),
        requestedRange: "CUSTOM",
        customRange,
      };
    }

    const range = this.normalizeRange(query?.range || query?.chartRange || query?.chartType);

    return {
      range,
      requestedRange: range,
    };
  }

  private normalizeCustomRange(query: any = {}): FomoV2MarketChartCustomRange | undefined {
    const from = this.toQueryDate(
      query?.from ?? query?.start ?? query?.startDate ?? query?.fromTimestamp,
    );
    const to = this.toQueryDate(
      query?.to ?? query?.end ?? query?.endDate ?? query?.toTimestamp,
    );

    if (!from || !to) return undefined;

    const startTimestamp = Math.min(from.getTime(), to.getTime());
    const endTimestamp = Math.max(from.getTime(), to.getTime());
    const durationMs = endTimestamp - startTimestamp;

    if (!Number.isFinite(durationMs) || durationMs <= 0) return undefined;

    return {
      startDate: new Date(startTimestamp),
      endDate: new Date(endTimestamp),
      durationMs,
    };
  }

  private resolveRangeForDuration(durationMs: number): FomoV2MarketChartRange {
    if (durationMs <= this.rangeMs["24H"]) return "24H";
    if (durationMs <= this.rangeMs["7D"]) return "7D";
    if (durationMs <= this.rangeMs["30D"]) return "30D";
    if (durationMs <= this.rangeMs["90D"]) return "90D";
    if (durationMs <= this.rangeMs["1Y"]) return "1Y";
    return "ALL";
  }

  private downsampleEvenly<T>(points: T[], maxPoints: number): T[] {
    if (!points.length || maxPoints <= 0) return [];
    if (points.length <= maxPoints) return points;
    if (maxPoints === 1) return [points[points.length - 1]];

    const result: T[] = [];
    const lastIndex = points.length - 1;
    const usedIndexes = new Set<number>();

    for (let index = 0; index < maxPoints; index += 1) {
      const sourceIndex = Math.round((index * lastIndex) / (maxPoints - 1));
      if (usedIndexes.has(sourceIndex)) continue;
      usedIndexes.add(sourceIndex);
      result.push(points[sourceIndex]);
    }

    return result;
  }

  private bucketizePointsByRange(points: any[], range: FomoV2MarketChartRange): any[] {
    const intervalMs = this.bucketMs[range];
    if (!points.length || !Number.isFinite(intervalMs) || intervalMs <= 0) return points;

    const pointsByBucket = new Map<number, any>();

    for (const point of points) {
      const pointTimestamp = this.toFiniteNumber(point?.timestamp);
      if (pointTimestamp === undefined) continue;

      const bucketTimestamp = Math.floor(pointTimestamp / intervalMs) * intervalMs;
      const bucketDate = new Date(bucketTimestamp).toISOString();

      pointsByBucket.set(
        bucketTimestamp,
        this.cleanObject({
          ...point,
          timestamp: bucketTimestamp,
          createdAt: bucketDate,
          bucketTimestamp: bucketDate,
        }),
      );
    }

    return Array.from(pointsByBucket.values()).sort((left, right) => left.timestamp - right.timestamp);
  }

  private normalizeLookupKey(value: any): string {
    return String(value || "").trim().toLowerCase();
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    const id = String(value || "").trim();
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined;
  }

  private toIdString(value: any): string | undefined {
    if (!value) return undefined;
    return String(value);
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : undefined;
  }

  private toQueryDate(value: any): Date | undefined {
    if (value === undefined || value === null || value === "") return undefined;

    if (value instanceof Date) {
      return Number.isFinite(value.getTime()) ? value : undefined;
    }

    const rawValue = Array.isArray(value) ? value[0] : value;
    const numeric =
      typeof rawValue === "number"
        ? rawValue
        : typeof rawValue === "string" && rawValue.trim()
          ? Number(rawValue.trim())
          : NaN;

    if (Number.isFinite(numeric)) {
      const timestamp = numeric > 0 && numeric < 10000000000
        ? numeric * 1000
        : numeric;
      const date = new Date(timestamp);
      return Number.isFinite(date.getTime()) ? date : undefined;
    }

    return this.toDate(rawValue);
  }

  private toFiniteNumber(value: any): number | undefined {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  private toFinitePositiveNumber(value: any): number | null {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  }

  private positiveInteger(value: any, fallback: number): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return fallback;
    return Math.trunc(numeric);
  }

  private firstString(...values: any[]): string | undefined {
    for (const value of values) {
      if (typeof value !== "string") continue;
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
    return undefined;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private cleanObject<T extends Record<string, any>>(value: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
    ) as Partial<T>;
  }
}
