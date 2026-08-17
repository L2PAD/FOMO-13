import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import axios from "axios";
import { Model, Types } from "mongoose";
import { Chart, ChartDocument } from "src/analytics/models/chart.model";
import { FundingRound, FundingRoundDocument } from "src/funding-rounds/models/funding-round.model";
import { ProjectIntel, ProjectIntelDocument } from "./intel-sync/models/project-intel.model";
import { normalizeSlug, normalizeSymbol } from "./intel-sync/project-identity.util";
import {
  ProjectChartHistory,
  ProjectChartHistoryDocument,
} from "./project-chart-history.model";
import {
  ProjectComparisonSnapshot,
  ProjectComparisonSnapshotDocument,
} from "./project-comparison-snapshot.model";
import { Project, ProjectDocument } from "./project.model";

type ProjectLike = Record<string, any>;
type BucketGranularity = "daily" | "weekly" | "monthly";

interface BackfillOptions {
  write?: boolean;
  limit?: number;
  offset?: number;
  cursor?: string;
  batchSize?: number;
  projectBatchSize?: number;
  includeExternal?: boolean;
  externalDays?: number;
  externalDelayMs?: number;
  minLocalPointsForExternal?: number;
  skipAverages?: boolean;
  bucketLimit?: number;
  averageBucketBatchSize?: number;
  averagesOnly?: boolean;
}

interface BackfillSummary {
  mode: "dry-run" | "write";
  processedProjects: number;
  projectsWithHistory: number;
  createdSnapshots: number;
  updatedSnapshots: number;
  plannedSnapshots: number;
  failedProjects: number;
  failedExternalRequests: number;
  touchedBuckets: number;
  averagesUpdated: number;
  averageBucketsProcessed: number;
  averageRowsProcessed: number;
  averageBulkWriteOperations: number;
  snapshotInsertDuration: number;
  averagesDuration: number;
  rankingDuration: number;
  mongoBulkWriteDuration: number;
  aggregationDuration: number;
  dailySnapshotsCreated: number;
  weeklySnapshotsCreated: number;
  monthlySnapshotsCreated: number;
  dailySnapshotsPlanned: number;
  weeklySnapshotsPlanned: number;
  monthlySnapshotsPlanned: number;
  estimatedSnapshots1Year: number;
  estimatedSnapshots3Years: number;
  estimatedSnapshots5Years: number;
  estimatedCollectionSizeMB: number;
  estimateBasisProjects: number;
  estimatedAverageSnapshotSizeBytes: number;
  snapshotIndexes?: {
    required: string[];
    existing: string[];
    missing: string[];
  };
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  cursor?: string | null;
}

interface RawHistoryPoint {
  timestamp: number;
  price: number | null;
  marketCap: number | null;
  fdv: number | null;
  volume24h: number | null;
  circulatingSupply: number | null;
  totalSupply: number | null;
  source: string;
}

interface MarketChartCandidate {
  id: string;
  project: ProjectLike;
  chart?: ProjectLike;
  points: number;
  slugKeys: Set<string>;
  symbolKeys: Set<string>;
}

interface AnalyticsChartMatch {
  candidate: MarketChartCandidate;
  matchedBy: "slug" | "symbol" | "symbol+name";
  matchedKey: string;
}

interface AnalyticsChartBinding {
  chart: ProjectLike;
  marketProject: ProjectLike;
  marketProjectId: string;
  marketProjectSlug?: string;
  marketProjectSymbol?: string;
  matchedBy: "slug" | "symbol" | "symbol+name";
  matchedKey: string;
  points: number;
}

interface SnapshotPoint extends RawHistoryPoint {
  timestamp: number;
  dateBucket: string;
  bucketGranularity: BucketGranularity;
  roiFromIco: number | null;
  roiFromListing: number | null;
  athPriceToDate: number | null;
  atlPriceToDate: number | null;
  categories: string[];
  chains: string[];
  launchYear: number | null;
  fundraisingRange: string | null;
  totalRaised: number | null;
  fundraisingEfficiency: number | null;
}

interface AnalyticsMarketChartIndex {
  slugIndex: Map<string, MarketChartCandidate[]>;
  symbolIndex: Map<string, MarketChartCandidate[]>;
}

interface MetricStats {
  averageMarketCap: number | null;
  averageFDV: number | null;
  averageROI: number | null;
  medianROI: number | null;
  topQuartileROI: number | null;
  count: number;
}

@Injectable()
export class IcoComparisonBackfillService {
  private readonly logger = new Logger(IcoComparisonBackfillService.name);
  private readonly dayMs = 24 * 60 * 60 * 1000;
  private analyticsMarketChartIndexPromise?: Promise<AnalyticsMarketChartIndex>;

  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectIntel.name) private readonly projectIntelModel: Model<ProjectIntelDocument>,
    @InjectModel(FundingRound.name) private readonly fundingRoundModel: Model<FundingRoundDocument>,
    @InjectModel(ProjectChartHistory.name)
    private readonly projectChartHistoryModel: Model<ProjectChartHistoryDocument>,
    @InjectModel(Chart.name) private readonly chartModel: Model<ChartDocument>,
    @InjectModel(ProjectComparisonSnapshot.name)
    private readonly snapshotModel: Model<ProjectComparisonSnapshotDocument>,
    private readonly configService: ConfigService,
  ) {}

  async runBackfill(input: BackfillOptions = {}): Promise<BackfillSummary> {
    const startedAt = Date.now();
    const options = this.normalizeOptions(input);
    const summary: BackfillSummary = {
      mode: options.write ? "write" : "dry-run",
      processedProjects: 0,
      projectsWithHistory: 0,
      createdSnapshots: 0,
      updatedSnapshots: 0,
      plannedSnapshots: 0,
      failedProjects: 0,
      failedExternalRequests: 0,
      touchedBuckets: 0,
      averagesUpdated: 0,
      averageBucketsProcessed: 0,
      averageRowsProcessed: 0,
      averageBulkWriteOperations: 0,
      snapshotInsertDuration: 0,
      averagesDuration: 0,
      rankingDuration: 0,
      mongoBulkWriteDuration: 0,
      aggregationDuration: 0,
      dailySnapshotsCreated: 0,
      weeklySnapshotsCreated: 0,
      monthlySnapshotsCreated: 0,
      dailySnapshotsPlanned: 0,
      weeklySnapshotsPlanned: 0,
      monthlySnapshotsPlanned: 0,
      estimatedSnapshots1Year: 0,
      estimatedSnapshots3Years: 0,
      estimatedSnapshots5Years: 0,
      estimatedCollectionSizeMB: 0,
      estimateBasisProjects: 0,
      estimatedAverageSnapshotSizeBytes: 0,
      startedAt: new Date(startedAt).toISOString(),
      cursor: options.cursor || null,
    };
    const touchedBuckets = new Set<string>();

    summary.snapshotIndexes = await this.ensureIndexes();

    if (options.averagesOnly) {
      const bucketsStartedAt = Date.now();
      const dateBuckets = (await this.snapshotModel.distinct("dateBucket"))
        .filter((bucket): bucket is string => typeof bucket === "string" && Boolean(bucket))
        .sort();
      const projectIds = await this.snapshotModel.distinct("projectId");
      summary.aggregationDuration += Date.now() - bucketsStartedAt;
      summary.touchedBuckets = dateBuckets.length;

      if (options.write && !options.skipAverages && dateBuckets.length) {
        const averagesStartedAt = Date.now();
        summary.averagesUpdated = await this.precomputeIndustryAverages(
          dateBuckets,
          options,
          summary,
        );
        summary.averagesDuration += Date.now() - averagesStartedAt;
      }

      Object.assign(summary, await this.estimateSnapshotGrowth(projectIds.length));
      summary.finishedAt = new Date().toISOString();
      summary.durationMs = Date.now() - startedAt;
      this.logger.log(`ICO comparison averages-only finished: ${JSON.stringify(summary)}`);
      return summary;
    }

    const cursor = this.projectCursor(options);
    let batch: ProjectLike[] = [];
    let lastProjectId: string | null = null;

    for await (const project of cursor as any) {
      batch.push(project);
      lastProjectId = String(project._id);

      if (batch.length >= options.projectBatchSize) {
        await this.processProjectBatch(batch, options, summary, touchedBuckets);
        batch = [];
        this.logProgress(summary, lastProjectId);
      }
    }

    if (batch.length) {
      await this.processProjectBatch(batch, options, summary, touchedBuckets);
      this.logProgress(summary, lastProjectId);
    }

    if (options.write && !options.skipAverages && touchedBuckets.size) {
      const averagesStartedAt = Date.now();
      summary.averagesUpdated = await this.precomputeIndustryAverages(
        Array.from(touchedBuckets).sort(),
        options,
        summary,
      );
      summary.averagesDuration += Date.now() - averagesStartedAt;
    }

    summary.touchedBuckets = touchedBuckets.size;
    Object.assign(summary, await this.estimateSnapshotGrowth(summary.projectsWithHistory));
    summary.finishedAt = new Date().toISOString();
    summary.durationMs = Date.now() - startedAt;
    summary.cursor = lastProjectId;

    this.logger.log(`ICO comparison backfill finished: ${JSON.stringify(summary)}`);
    return summary;
  }

  private async processProjectBatch(
    projects: ProjectLike[],
    options: Required<BackfillOptions>,
    summary: BackfillSummary,
    touchedBuckets: Set<string>,
  ): Promise<void> {
    const projectIds = projects.map((project) => project._id);
    const aggregationStartedAt = Date.now();
    const [intels, charts, chartHistories, fundingRounds, analyticsChartBindings] = await Promise.all([
      this.projectIntelModel.find({ projectId: { $in: projectIds } }).lean(),
      this.chartModel.find({ entityId: { $in: projectIds }, entityType: "project" }).lean(),
      this.projectChartHistoryModel.find({ projectId: { $in: projectIds } }).lean(),
      this.findFundingRounds(projects),
      this.findAnalyticsChartBindings(projects),
    ]);
    summary.aggregationDuration += Date.now() - aggregationStartedAt;
    const intelByProjectId = new Map<string, ProjectLike>(
      intels.map((intel) => [String(intel.projectId), intel]),
    );
    const chartByProjectId = new Map<string, ProjectLike>(
      charts.map((chart) => [String(chart.entityId), chart]),
    );
    const chartHistoriesByProjectId = this.groupBy(
      chartHistories,
      (chartHistory) => String(chartHistory.projectId),
    );
    const fundingRoundsByProjectId = this.groupFundingRounds(projects, fundingRounds);

    for (const project of projects) {
      summary.processedProjects += 1;

      try {
        const projectId = String(project._id);
        const intel = intelByProjectId.get(projectId) || null;
        const fundingRoundsForProject = fundingRoundsByProjectId.get(projectId) || [];
        const directChart = chartByProjectId.get(projectId) || null;
        const analyticsBinding = analyticsChartBindings.get(projectId) || null;
        const chart = directChart || analyticsBinding?.chart || null;
        const chartSourcePrefix = directChart
          ? "Chart"
          : analyticsBinding
          ? `AnalyticsChart:${analyticsBinding.matchedBy}:${analyticsBinding.marketProjectSlug || analyticsBinding.marketProjectId}`
          : "Chart";
        const localPoints = this.collectLocalHistoryPoints(
          project,
          chart,
          chartHistoriesByProjectId.get(projectId) || [],
          chartSourcePrefix,
        );
        const externalPoints =
          options.includeExternal && localPoints.length < options.minLocalPointsForExternal
            ? await this.fetchCoinGeckoHistory(project, options, summary)
            : [];
        const points = this.mergeHistoryPoints([...localPoints, ...externalPoints]);
        const snapshotPoints = this.buildSnapshotPoints(project, intel, fundingRoundsForProject, points);

        if (!snapshotPoints.length) continue;

        summary.projectsWithHistory += 1;
        const result = await this.writeSnapshots(project, snapshotPoints, options, touchedBuckets);
        summary.plannedSnapshots += result.planned;
        summary.createdSnapshots += result.created;
        summary.updatedSnapshots += result.updated;
        summary.snapshotInsertDuration += result.durationMs;
        summary.mongoBulkWriteDuration += result.mongoBulkWriteDurationMs;
        this.addRetentionCounts(summary, result.retentionPlanned, "planned");
        this.addRetentionCounts(summary, result.retentionCreated, "created");
      } catch (error: any) {
        summary.failedProjects += 1;
        this.logger.warn(
          `ICO comparison backfill project failed project=${project.slug || project.name || project._id} error=${error?.message || error}`,
        );
      }
    }
  }

  private collectLocalHistoryPoints(
    project: ProjectLike,
    chart: ProjectLike | null,
    chartHistories: ProjectLike[],
    chartSourcePrefix = "Chart",
  ): RawHistoryPoint[] {
    const sources: Array<{ source: string; points: any[] }> = [];

    for (const chartHistory of chartHistories) {
      if (Array.isArray(chartHistory.data)) {
        sources.push({ source: `ProjectChartHistory:${chartHistory.timeframe || "unknown"}`, points: chartHistory.data });
      }
    }

    if (chart) {
      for (const field of ["chartAll", "chart1y", "chart90d", "chart30d", "chart7d", "chart24h"]) {
        if (Array.isArray(chart[field])) {
          sources.push({ source: `${chartSourcePrefix}:${field}`, points: chart[field] });
        }
      }
    }

    if (Array.isArray(project.history)) {
      sources.push({ source: "project.history", points: project.history });
    }

    const marketData = project.rawIcoData?.marketData || {};
    const localMarketArrays = [
      { source: "project.marketHistory", points: project.marketHistory },
      { source: "project.marketSnapshots", points: project.marketSnapshots },
      { source: "rawIcoData.marketHistory", points: project.rawIcoData?.marketHistory },
      { source: "rawIcoData.coinMarketCapHistory", points: project.rawIcoData?.coinMarketCapHistory },
      { source: "rawIcoData.cmcHistory", points: project.rawIcoData?.cmcHistory },
      { source: "rawIcoData.marketData.history", points: marketData.history },
      { source: "rawIcoData.marketData.priceHistory", points: marketData.priceHistory },
      { source: "rawIcoData.marketData.marketSnapshots", points: marketData.marketSnapshots },
      { source: "rawIcoData.marketData.ohlcv", points: marketData.ohlcv },
      { source: "rawIcoData.marketData.sparkline", points: marketData.sparkline },
    ];

    for (const item of localMarketArrays) {
      if (Array.isArray(item.points)) {
        sources.push({ source: item.source, points: item.points });
      }
    }

    if (project.ohlcv) {
      sources.push({ source: "project.ohlcv", points: [project.ohlcv] });
    }

    return sources
      .flatMap((source) => source.points.map((point) => this.rawPointFromSource(point, project, source.source)))
      .filter((point) => point.timestamp && (point.price !== null || point.marketCap !== null || point.fdv !== null));
  }

  private async fetchCoinGeckoHistory(
    project: ProjectLike,
    options: Required<BackfillOptions>,
    summary: BackfillSummary,
  ): Promise<RawHistoryPoint[]> {
    const slug = this.firstString(
      project.coingeckoId,
      project.rawIcoData?.coingeckoId,
      project.rawIcoData?.marketData?.coingeckoId,
      project.tokenMetrics?.coingeckoId,
      project.slug,
      project.sourceId,
      project.rawIcoData?.slug,
    );
    if (!slug) return [];

    const to = Math.floor(Date.now() / 1000);
    const from = to - Math.max(1, options.externalDays) * 24 * 60 * 60;
    const url = `https://api.coingecko.com/api/v3/coins/${encodeURIComponent(slug)}/market_chart/range`;

    try {
      const response = await axios.get(url, {
        params: {
          vs_currency: "usd",
          from,
          to,
        },
        timeout: 30000,
        headers: {
          Accept: "application/json",
          "User-Agent": "Fomoland ICO comparison backfill",
        },
      });

      if (options.externalDelayMs > 0) {
        await this.sleep(options.externalDelayMs);
      }

      const prices = Array.isArray(response.data?.prices) ? response.data.prices : [];
      const marketCapsByTime = new Map<number, number>(
        (response.data?.market_caps || []).map((item: any[]) => [Number(item?.[0]), Number(item?.[1])]),
      );
      const volumesByTime = new Map<number, number>(
        (response.data?.total_volumes || []).map((item: any[]) => [Number(item?.[0]), Number(item?.[1])]),
      );

      return prices
        .map((item: any[]) => {
          const timestamp = Number(item?.[0]);
          const price = this.toNumber(item?.[1]);
          const marketCap = this.toNumber(marketCapsByTime.get(timestamp));

          return {
            timestamp,
            price,
            marketCap,
            fdv: null,
            volume24h: this.toNumber(volumesByTime.get(timestamp)),
            circulatingSupply: null,
            totalSupply: null,
            source: "coingecko.market_chart",
          };
        })
        .filter((point) => point.timestamp && point.price !== null);
    } catch (error: any) {
      summary.failedExternalRequests += 1;
      this.logger.warn(`CoinGecko history skipped slug=${slug} error=${error?.message || error}`);
      if (options.externalDelayMs > 0) {
        await this.sleep(options.externalDelayMs);
      }
      return [];
    }
  }

  private rawPointFromSource(raw: any, project: ProjectLike, source: string): RawHistoryPoint {
    const timestamp = this.extractTimestamp(raw);
    const price = this.firstPositiveNumber(
      raw?.price?.USD,
      raw?.price?.usd,
      raw?.price,
      raw?.close,
      raw?.value,
      raw?.quote?.USD?.close,
      raw?.quote?.USD?.price,
      raw?.USD,
      project.price,
      project.usdQuote?.price,
    );
    const circulatingSupply = this.firstPositiveNumber(
      raw?.circulatingSupply,
      raw?.circulating_supply,
      raw?.supply?.circulatingSupply,
      project.circulatingSupply,
      project.tokenomics?.circulatingSupply,
      project.tokenMetrics?.circulatingSupply,
    );
    const totalSupply = this.firstPositiveNumber(
      raw?.totalSupply,
      raw?.total_supply,
      raw?.supply?.totalSupply,
      project.totalSupply,
      project.tokenomics?.totalSupply,
      project.tokenMetrics?.totalSupply,
    );
    const marketCap = this.firstPositiveNumber(
      raw?.marketCap,
      raw?.market_cap,
      raw?.quote?.USD?.market_cap,
      this.multiply(price, circulatingSupply),
    );
    const fdv = this.firstPositiveNumber(
      raw?.fdv,
      raw?.fullyDilutedMarketCap,
      raw?.fully_diluted_market_cap,
      raw?.quote?.USD?.fully_diluted_market_cap,
      this.multiply(price, totalSupply),
    );

    return {
      timestamp,
      price,
      marketCap,
      fdv,
      volume24h: this.firstPositiveNumber(raw?.volume24h, raw?.volume_24h, raw?.volume, raw?.quote?.USD?.volume),
      circulatingSupply,
      totalSupply,
      source,
    };
  }

  private buildSnapshotPoints(
    project: ProjectLike,
    intel: ProjectLike | null,
    fundingRounds: any[],
    points: RawHistoryPoint[],
  ): SnapshotPoint[] {
    const sortedPoints = this.mergeHistoryPoints(points).sort((left, right) => left.timestamp - right.timestamp);
    if (!sortedPoints.length) return [];

    const marketData = intel?.marketData || project.rawIcoData?.marketData || {};
    const firstRound = fundingRounds.find((round) => this.firstPositiveNumber(round.tokenPrice, round.price));
    const icoPrice = this.firstPositiveNumber(
      this.valueByCurrency(project.icoPrice),
      this.valueByCurrency(marketData.icoPrice),
      project.rawIcoData?.icoPrice,
      project.rawIcoData?.tokenomics?.tokenPrice,
      project.tokenomics?.tokenPrice,
      project.tokenMetrics?.tokenPrice,
      firstRound?.tokenPrice,
      firstRound?.price,
    );
    const listingPrice = this.firstPositiveNumber(
      this.valueByCurrency(project.listingPrice),
      this.valueByCurrency(marketData.listingPrice),
      project.rawIcoData?.listingPrice,
    );
    const totalRaised = this.firstPositiveNumber(
      project.totalRaised,
      project.fundsRaised,
      intel?.fundraising?.totalRaised,
      intel?.fundraising?.dropstabTotalRaised,
      intel?.dropstab?.fundraising?.totalRaised,
      project.rawIcoData?.fundraising?.totalRaised,
      this.sumNumbers(fundingRounds.map((round) => round.fundsRaised || round.amount)),
    );
    const categories = this.uniqueStrings([
      ...(project.categories || []),
      ...(project.tags || []),
      ...(project.rawIcoData?.categories || []),
      ...(intel?.profile?.categories || []),
      ...(intel?.profile?.dropstabCategories || []),
      project.mainCategory?.name,
      project.mainCategory?.slug,
      project.type,
    ]);
    const chains = this.uniqueStrings([
      ...(project.ecosystems || []),
      ...(project.rawIcoData?.ecosystems || []),
      ...(intel?.profile?.ecosystems || []),
      project.blockchain,
      project.tokenMetrics?.blockchain,
    ]);
    const launchDate = this.earliestDate(
      ...fundingRounds.map((round) => round.date),
      project.dateAdded,
      project.createdAt,
      project.rawIcoData?.dateAdded,
      project.rawIcoData?.icoDate,
      project.rawIcoData?.dates?.ico,
    );
    let athPriceToDate: number | null = null;
    let atlPriceToDate: number | null = null;

    return this.downsampleByRetention(sortedPoints).map((point) => {
      if (point.price !== null) {
        athPriceToDate = athPriceToDate === null ? point.price : Math.max(athPriceToDate, point.price);
        atlPriceToDate = atlPriceToDate === null ? point.price : Math.min(atlPriceToDate, point.price);
      }

      const marketCap = this.firstPositiveNumber(
        point.marketCap,
        this.multiply(point.price, point.circulatingSupply),
        this.multiply(point.price, project.circulatingSupply),
      );
      const fdv = this.firstPositiveNumber(
        point.fdv,
        this.multiply(point.price, point.totalSupply),
        this.multiply(point.price, project.totalSupply),
      );
      const fundraisingEfficiency = totalRaised
        ? this.firstPositiveNumber(
            marketCap && marketCap / totalRaised,
            fdv && fdv / totalRaised,
          )
        : null;
      const bucket = this.bucketForTimestamp(point.timestamp);

      return {
        ...point,
        timestamp: bucket.timestamp,
        dateBucket: bucket.dateBucket,
        bucketGranularity: bucket.granularity,
        marketCap,
        fdv,
        roiFromIco: this.roiPercent(point.price, icoPrice),
        roiFromListing: this.roiPercent(point.price, listingPrice),
        athPriceToDate,
        atlPriceToDate,
        circulatingSupply: this.firstPositiveNumber(point.circulatingSupply, project.circulatingSupply),
        totalSupply: this.firstPositiveNumber(point.totalSupply, project.totalSupply),
        categories,
        chains,
        launchYear: launchDate ? launchDate.getUTCFullYear() : null,
        fundraisingRange: this.fundraisingRange(totalRaised),
        totalRaised,
        fundraisingEfficiency,
      };
    });
  }

  private downsampleByRetention(points: RawHistoryPoint[]): RawHistoryPoint[] {
    const byBucket = new Map<string, RawHistoryPoint>();

    for (const point of points) {
      const bucket = this.bucketForTimestamp(point.timestamp);
      const key = bucket.dateBucket;
      const existing = byBucket.get(key);
      if (!existing || existing.timestamp < point.timestamp) {
        byBucket.set(key, point);
      }
    }

    return Array.from(byBucket.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, point]) => point);
  }

  private bucketForTimestamp(timestamp: number): {
    timestamp: number;
    dateBucket: string;
    granularity: BucketGranularity;
  } {
    const ageDays = Math.max(0, Math.floor((Date.now() - timestamp) / this.dayMs));
    const granularity: BucketGranularity =
      ageDays <= 180 ? "daily" : ageDays <= 730 ? "weekly" : "monthly";
    const date = new Date(timestamp);
    let bucketStart: Date;

    if (granularity === "daily") {
      bucketStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    } else if (granularity === "weekly") {
      const day = date.getUTCDay() || 7;
      bucketStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
      bucketStart.setUTCDate(bucketStart.getUTCDate() - day + 1);
    } else {
      bucketStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
    }

    return {
      timestamp: bucketStart.getTime(),
      dateBucket: bucketStart.toISOString(),
      granularity,
    };
  }

  private async writeSnapshots(
    project: ProjectLike,
    snapshotPoints: SnapshotPoint[],
    options: Required<BackfillOptions>,
    touchedBuckets: Set<string>,
  ): Promise<{
    planned: number;
    created: number;
    updated: number;
    durationMs: number;
    mongoBulkWriteDurationMs: number;
    retentionPlanned: Record<BucketGranularity, number>;
    retentionCreated: Record<BucketGranularity, number>;
  }> {
    const startedAt = Date.now();
    const projectId = new Types.ObjectId(String(project._id));
    const slug = project.slug || normalizeSlug(project.name || project.sourceId || "");
    const retentionPlanned = this.emptyRetentionCounts();
    const retentionCreated = this.emptyRetentionCounts();
    const operations = snapshotPoints.map((point) => {
      touchedBuckets.add(point.dateBucket);
      retentionPlanned[point.bucketGranularity] += 1;

      return {
        granularity: point.bucketGranularity,
        operation: {
          updateOne: {
            filter: {
              projectId,
              timestamp: new Date(point.timestamp),
            },
            update: {
              $set: this.sanitizeObject({
                projectId,
                slug,
                timestamp: new Date(point.timestamp),
                dateBucket: point.dateBucket,
                bucketGranularity: point.bucketGranularity,
                price: point.price,
                marketCap: point.marketCap,
                fdv: point.fdv,
                volume24h: point.volume24h,
                roiFromIco: point.roiFromIco,
                roiFromListing: point.roiFromListing,
                athPriceToDate: point.athPriceToDate,
                atlPriceToDate: point.atlPriceToDate,
                circulatingSupply: point.circulatingSupply,
                totalSupply: point.totalSupply,
                categories: point.categories,
                chains: point.chains,
                launchYear: point.launchYear,
                fundraisingRange: point.fundraisingRange,
                fundraisingEfficiency: point.fundraisingEfficiency,
                dataQuality: {
                  sources: [point.source],
                  confidence: this.snapshotConfidence(point),
                },
                createdAt: new Date(),
              }),
            },
            upsert: true,
          },
        },
      };
    });

    if (!options.write) {
      return {
        planned: operations.length,
        created: 0,
        updated: 0,
        durationMs: Date.now() - startedAt,
        mongoBulkWriteDurationMs: 0,
        retentionPlanned,
        retentionCreated,
      };
    }

    let created = 0;
    let updated = 0;
    let mongoBulkWriteDurationMs = 0;
    for (const chunk of this.chunk(operations, options.batchSize)) {
      const bulkStartedAt = Date.now();
      const result = await this.snapshotModel.bulkWrite(
        chunk.map((item) => item.operation),
        { ordered: false },
      );
      mongoBulkWriteDurationMs += Date.now() - bulkStartedAt;
      created += result.upsertedCount || 0;
      updated += result.modifiedCount || 0;
      for (const index of this.bulkUpsertedIndexes(result)) {
        const granularity = chunk[index]?.granularity;
        if (granularity) retentionCreated[granularity] += 1;
      }
    }

    return {
      planned: operations.length,
      created,
      updated,
      durationMs: Date.now() - startedAt,
      mongoBulkWriteDurationMs,
      retentionPlanned,
      retentionCreated,
    };
  }

  private async precomputeIndustryAverages(
    dateBuckets: string[],
    options: Required<BackfillOptions>,
    summary: BackfillSummary,
  ): Promise<number> {
    let updated = 0;
    const bucketList = options.bucketLimit > 0 ? dateBuckets.slice(0, options.bucketLimit) : dateBuckets;

    for (const bucketBatch of this.chunk(bucketList, options.averageBucketBatchSize)) {
      const aggregationStartedAt = Date.now();
      const batchRows = await this.snapshotModel
        .find({ dateBucket: { $in: bucketBatch } })
        .lean();
      summary.aggregationDuration += Date.now() - aggregationStartedAt;
      if (!batchRows.length) continue;

      const rowsByBucket = this.groupBy(batchRows, (row) => String(row.dateBucket));
      const operations = bucketBatch.flatMap((dateBucket) => {
        const rows = rowsByBucket.get(dateBucket) || [];
        if (!rows.length) return [];

        const stats = this.buildIndustryStats(rows);
        const rankingStartedAt = Date.now();
        const rankings = this.buildRankings(rows);
        summary.rankingDuration += Date.now() - rankingStartedAt;
        summary.averageBucketsProcessed += 1;
        summary.averageRowsProcessed += rows.length;

        return rows.map((row) => {
          const rowRankings = rankings.get(String(row.projectId)) || {};
          const selectedStats = this.selectIndustryStats(row, stats);

          return {
            updateOne: {
              filter: { _id: row._id },
              update: {
                $set: this.sanitizeObject({
                  industryAverageMarketCap: selectedStats.averageMarketCap,
                  industryAverageFDV: selectedStats.averageFDV,
                  industryAverageROI: selectedStats.averageROI,
                  industryMedianROI: selectedStats.medianROI,
                  industryTopQuartileROI: selectedStats.topQuartileROI,
                  categoryRank: rowRankings.categoryRank,
                  roiRank: rowRankings.roiRank,
                  industryAverages: this.buildRowIndustryAverages(row, stats),
                  rankings: rowRankings,
                }),
              },
            },
          };
        });
      });
      summary.averageBulkWriteOperations += operations.length;

      for (const chunk of this.chunk(operations, options.batchSize)) {
        const bulkStartedAt = Date.now();
        const result = await this.snapshotModel.bulkWrite(chunk, { ordered: false });
        summary.mongoBulkWriteDuration += Date.now() - bulkStartedAt;
        updated += result.modifiedCount || 0;
      }
    }

    return updated;
  }

  private buildIndustryStats(rows: ProjectLike[]): {
    global: MetricStats;
    categories: Record<string, MetricStats>;
    chains: Record<string, MetricStats>;
    launchYears: Record<string, MetricStats>;
    fundraisingRanges: Record<string, MetricStats>;
  } {
    const stats = {
      global: this.statsFromRows(rows),
      categories: {} as Record<string, MetricStats>,
      chains: {} as Record<string, MetricStats>,
      launchYears: {} as Record<string, MetricStats>,
      fundraisingRanges: {} as Record<string, MetricStats>,
    };

    this.groupByKeys(rows, (row) => row.categories || []).forEach((value, key) => {
      stats.categories[key] = this.statsFromRows(value);
    });
    this.groupByKeys(rows, (row) => row.chains || []).forEach((value, key) => {
      stats.chains[key] = this.statsFromRows(value);
    });
    this.groupByKeys(rows, (row) => (row.launchYear ? [String(row.launchYear)] : [])).forEach((value, key) => {
      stats.launchYears[key] = this.statsFromRows(value);
    });
    this.groupByKeys(rows, (row) => (row.fundraisingRange ? [row.fundraisingRange] : [])).forEach((value, key) => {
      stats.fundraisingRanges[key] = this.statsFromRows(value);
    });

    return stats;
  }

  private buildRankings(rows: ProjectLike[]): Map<string, any> {
    const rankings = new Map<string, any>();
    const globalRoiRank = this.rankMap(rows, (row) => this.toNumber(row.roiFromIco));
    const efficiencyRank = this.rankMap(rows, (row) => this.toNumber(row.fundraisingEfficiency));
    const categoryRankMaps = this.rankMapsByKeys(
      rows,
      (row) => row.categories || [],
      (row) => this.toNumber(row.roiFromIco),
    );
    const chainRankMaps = this.rankMapsByKeys(
      rows,
      (row) => row.chains || [],
      (row) => this.toNumber(row.roiFromIco),
    );
    const launchYearRankMaps = this.rankMapsByKeys(
      rows,
      (row) => (row.launchYear ? [String(row.launchYear)] : []),
      (row) => this.toNumber(row.roiFromIco),
    );

    for (const row of rows) {
      const primaryCategory = row.categories?.[0] || null;
      const primaryChain = row.chains?.[0] || null;
      const projectId = String(row.projectId);

      rankings.set(projectId, {
        categoryRank: primaryCategory ? categoryRankMaps.get(primaryCategory)?.get(projectId) || null : globalRoiRank.get(projectId) || null,
        chainRank: primaryChain ? chainRankMaps.get(primaryChain)?.get(projectId) || null : globalRoiRank.get(projectId) || null,
        launchYearRank: row.launchYear ? launchYearRankMaps.get(String(row.launchYear))?.get(projectId) || null : globalRoiRank.get(projectId) || null,
        roiRank: globalRoiRank.get(projectId) || null,
        fundraisingEfficiencyRank: efficiencyRank.get(projectId) || null,
      });
    }

    return rankings;
  }

  private rankMapsByKeys(
    rows: ProjectLike[],
    keyFn: (row: ProjectLike) => string[],
    valueFn: (row: ProjectLike) => number | null,
  ): Map<string, Map<string, number>> {
    const result = new Map<string, Map<string, number>>();

    this.groupByKeys(rows, keyFn).forEach((groupRows, key) => {
      result.set(key, this.rankMap(groupRows, valueFn));
    });

    return result;
  }

  private selectIndustryStats(row: ProjectLike, stats: ReturnType<IcoComparisonBackfillService["buildIndustryStats"]>): MetricStats {
    const categoryStats = (row.categories || []).map((category: string) => stats.categories[category]).find(Boolean);
    const chainStats = (row.chains || []).map((chain: string) => stats.chains[chain]).find(Boolean);
    const launchYearStats = row.launchYear ? stats.launchYears[String(row.launchYear)] : null;
    const fundraisingStats = row.fundraisingRange ? stats.fundraisingRanges[row.fundraisingRange] : null;

    return categoryStats || chainStats || launchYearStats || fundraisingStats || stats.global;
  }

  private buildRowIndustryAverages(row: ProjectLike, stats: ReturnType<IcoComparisonBackfillService["buildIndustryStats"]>): any {
    return {
      selected: this.selectIndustryStats(row, stats),
      categories: (row.categories || []).reduce((result: any, category: string) => {
        result[category] = stats.categories[category] || null;
        return result;
      }, {}),
      chains: (row.chains || []).reduce((result: any, chain: string) => {
        result[chain] = stats.chains[chain] || null;
        return result;
      }, {}),
      launchYear: row.launchYear ? stats.launchYears[String(row.launchYear)] || null : null,
      fundraisingRange: row.fundraisingRange ? stats.fundraisingRanges[row.fundraisingRange] || null : null,
      global: stats.global,
    };
  }

  private async findAnalyticsChartBindings(projects: ProjectLike[]): Promise<Map<string, AnalyticsChartBinding>> {
    const { slugIndex, symbolIndex } = await this.getAnalyticsMarketChartIndex();
    const matches = new Map<string, AnalyticsChartMatch>();

    for (const project of projects) {
      const match = this.resolveAnalyticsChartMatch(project, slugIndex, symbolIndex);
      if (match) matches.set(String(project._id), match);
    }

    if (!matches.size) return new Map();

    const marketIds = Array.from(new Set(Array.from(matches.values()).map((match) => match.candidate.id)))
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const charts = await this.chartModel
      .find({ entityType: "project", entityId: { $in: marketIds } })
      .lean();
    const chartByMarketProjectId = new Map<string, ProjectLike>(
      charts.map((chart) => [String(chart.entityId), chart]),
    );
    const bindings = new Map<string, AnalyticsChartBinding>();

    for (const [projectId, match] of matches) {
      const chart = chartByMarketProjectId.get(match.candidate.id);
      if (!chart) continue;

      bindings.set(
        projectId,
        this.analyticsChartBinding(match.candidate, match.matchedBy, match.matchedKey, chart),
      );
    }

    return bindings;
  }

  private async getAnalyticsMarketChartIndex(): Promise<AnalyticsMarketChartIndex> {
    if (!this.analyticsMarketChartIndexPromise) {
      this.analyticsMarketChartIndexPromise = this.buildAnalyticsMarketChartIndex();
    }

    return this.analyticsMarketChartIndexPromise;
  }

  private async buildAnalyticsMarketChartIndex(): Promise<AnalyticsMarketChartIndex> {
    const chartCounts = await this.getAllProjectChartCounts();
    const marketProjectIds = Array.from(chartCounts.keys())
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const marketProjects = marketProjectIds.length
      ? await this.projectModel
          .find({
            _id: { $in: marketProjectIds },
            projectType: "market",
            projectStatus: "active",
          })
          .select({
            name: 1,
            slug: 1,
            sourceId: 1,
            coingeckoId: 1,
            coinId: 1,
            cmcId: 1,
            coinMarketCapId: 1,
            symbol: 1,
            ticker: 1,
            niche: 1,
            rank: 1,
            rawIcoData: 1,
          })
          .lean()
      : [];
    const candidates: MarketChartCandidate[] = (marketProjects as ProjectLike[])
      .map((project) => ({
        id: String(project._id),
        project,
        points: chartCounts.get(String(project._id)) || 0,
        slugKeys: this.slugKeys(project),
        symbolKeys: this.symbolKeys(project),
      }))
      .filter((candidate) => candidate.points > 0);

    return {
      slugIndex: this.indexMarketChartCandidates(candidates, "slugKeys"),
      symbolIndex: this.indexMarketChartCandidates(candidates, "symbolKeys"),
    };
  }

  private async getAllProjectChartCounts(): Promise<Map<string, number>> {
    const chartPointCount = {
      $add: [
        this.arraySize("$chartAll"),
        this.arraySize("$chart1y"),
        this.arraySize("$chart90d"),
        this.arraySize("$chart30d"),
        this.arraySize("$chart7d"),
        this.arraySize("$chart24h"),
      ],
    };
    const rows = await this.chartModel.aggregate([
      { $match: { entityType: "project" } },
      {
        $project: {
          entityId: 1,
          points: chartPointCount,
        },
      },
      {
        $group: {
          _id: "$entityId",
          points: { $sum: "$points" },
        },
      },
    ]);

    return new Map(rows.map((row) => [String(row._id), Number(row.points || 0)]));
  }

  private resolveAnalyticsChartMatch(
    project: ProjectLike,
    slugIndex: Map<string, MarketChartCandidate[]>,
    symbolIndex: Map<string, MarketChartCandidate[]>,
  ): AnalyticsChartMatch | null {
    for (const key of this.slugKeys(project)) {
      const candidate = this.bestMarketChartCandidate(slugIndex.get(key) || []);
      if (candidate) return { candidate, matchedBy: "slug", matchedKey: key };
    }

    const symbolCandidates = this.uniqueMarketChartCandidates(
      Array.from(this.symbolKeys(project)).flatMap((key) => symbolIndex.get(key) || []),
    );
    if (symbolCandidates.length === 1) {
      return {
        candidate: symbolCandidates[0],
        matchedBy: "symbol",
        matchedKey: this.firstSymbolKey(project) || "",
      };
    }

    const projectNameKey = normalizeSlug(project.name || "");
    const nameMatches = symbolCandidates.filter(
      (candidate) => normalizeSlug(candidate.project?.name || "") === projectNameKey,
    );
    if (nameMatches.length === 1) {
      return {
        candidate: nameMatches[0],
        matchedBy: "symbol+name",
        matchedKey: this.firstSymbolKey(project) || "",
      };
    }

    return null;
  }

  private analyticsChartBinding(
    candidate: MarketChartCandidate,
    matchedBy: AnalyticsChartBinding["matchedBy"],
    matchedKey: string,
    chart: ProjectLike,
  ): AnalyticsChartBinding {
    return {
      chart,
      marketProject: candidate.project,
      marketProjectId: candidate.id,
      marketProjectSlug: candidate.project?.slug,
      marketProjectSymbol: candidate.project?.symbol || candidate.project?.ticker || candidate.project?.niche,
      matchedBy,
      matchedKey,
      points: candidate.points,
    };
  }

  private bestMarketChartCandidate(candidates: MarketChartCandidate[]): MarketChartCandidate | null {
    if (!candidates.length) return null;

    return [...candidates].sort((left, right) => {
      if (right.points !== left.points) return right.points - left.points;
      return (left.project?.rank || Number.MAX_SAFE_INTEGER) - (right.project?.rank || Number.MAX_SAFE_INTEGER);
    })[0];
  }

  private uniqueMarketChartCandidates(candidates: MarketChartCandidate[]): MarketChartCandidate[] {
    const seen = new Set<string>();
    const result: MarketChartCandidate[] = [];

    for (const candidate of candidates) {
      if (seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      result.push(candidate);
    }

    return result;
  }

  private indexMarketChartCandidates(
    candidates: MarketChartCandidate[],
    keyField: "slugKeys" | "symbolKeys",
  ): Map<string, MarketChartCandidate[]> {
    const result = new Map<string, MarketChartCandidate[]>();

    for (const candidate of candidates) {
      for (const key of candidate[keyField]) {
        const current = result.get(key) || [];
        current.push(candidate);
        result.set(key, current);
      }
    }

    return result;
  }

  private arraySize(path: string): any {
    return {
      $cond: [{ $isArray: path }, { $size: path }, 0],
    };
  }

  private slugKeys(project: ProjectLike): Set<string> {
    return new Set(
      this.uniqueStrings([
        project.slug,
        project.sourceId,
        project.coingeckoId,
        project.coinId,
        project.cmcId,
        project.coinMarketCapId,
        project.rawIcoData?.slug,
        project.rawIcoData?.sourceId,
        project.rawIcoData?.coingeckoId,
        project.rawIcoData?.coinId,
        project.rawIcoData?.cmcId,
        project.rawIcoData?.coinMarketCapId,
      ])
        .map((value) => normalizeSlug(value))
        .filter(Boolean),
    );
  }

  private symbolKeys(project: ProjectLike): Set<string> {
    return new Set(
      this.uniqueStrings([
        project.symbol,
        project.ticker,
        project.niche,
        project.rawIcoData?.symbol,
        project.rawIcoData?.ticker,
      ])
        .map((value) => normalizeSymbol(value))
        .filter(Boolean),
    );
  }

  private firstSymbolKey(project: ProjectLike): string | null {
    return Array.from(this.symbolKeys(project))[0] || null;
  }

  private async findFundingRounds(projects: ProjectLike[]): Promise<any[]> {
    const slugs = this.uniqueStrings(
      projects.flatMap((project) => [
        project.slug,
        project.sourceId,
        project.rawIcoData?.slug,
        project.rawIcoData?.sourceId,
      ]),
    );
    const symbols = this.uniqueStrings(
      projects.flatMap((project) => [
        project.symbol,
        project.ticker,
        project.niche,
        project.rawIcoData?.symbol,
        project.rawIcoData?.ticker,
      ]),
    ).map((symbol) => symbol.toUpperCase());
    const or: any[] = [];

    if (slugs.length) or.push({ coinSlug: { $in: slugs } });
    if (symbols.length) or.push({ coinSymbol: { $in: symbols } });
    if (!or.length) return [];

    return this.fundingRoundModel.find({ $or: or }).sort({ date: 1 }).lean();
  }

  private groupFundingRounds(projects: ProjectLike[], rounds: any[]): Map<string, any[]> {
    const result = new Map<string, any[]>();
    const projectKeys = projects.map((project) => ({
      id: String(project._id),
      slugs: new Set(
        this.uniqueStrings([
          project.slug,
          project.sourceId,
          project.rawIcoData?.slug,
          project.rawIcoData?.sourceId,
        ]).map((item) => item.toLowerCase()),
      ),
      symbols: new Set(
        this.uniqueStrings([
          project.symbol,
          project.ticker,
          project.niche,
          project.rawIcoData?.symbol,
          project.rawIcoData?.ticker,
        ]).map((item) => item.toUpperCase()),
      ),
    }));

    for (const round of rounds) {
      const slug = String(round.coinSlug || "").toLowerCase();
      const symbol = String(round.coinSymbol || "").toUpperCase();
      const match = projectKeys.find((project) => project.slugs.has(slug) || project.symbols.has(symbol));
      if (!match) continue;

      const current = result.get(match.id) || [];
      current.push(round);
      result.set(match.id, current);
    }

    return result;
  }

  private projectCursor(options: Required<BackfillOptions>) {
    const query: any = {
      projectStatus: "active",
      projectType: "project",
    };

    if (options.cursor && Types.ObjectId.isValid(options.cursor)) {
      query._id = { $gt: new Types.ObjectId(options.cursor) };
    }

    return this.projectModel
      .find(query)
      .sort({ _id: 1 })
      .skip(options.cursor ? 0 : options.offset)
      .limit(options.limit)
      .lean()
      .cursor();
  }

  private normalizeOptions(input: BackfillOptions): Required<BackfillOptions> {
    const readFlag = (name: string, fallback: boolean) => {
      const value = this.configService.get(name);
      if (value === undefined || value === null || value === "") return fallback;
      return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
    };

    return {
      write: Boolean(input.write),
      limit: this.clampInt(input.limit ?? this.configService.get("ICO_COMPARISON_BACKFILL_LIMIT"), 200, 1, 10000),
      offset: this.clampInt(input.offset, 0, 0, 1_000_000),
      cursor: input.cursor || "",
      batchSize: this.clampInt(input.batchSize ?? this.configService.get("ICO_COMPARISON_BACKFILL_BATCH_SIZE"), 500, 1, 5000),
      projectBatchSize: this.clampInt(
        input.projectBatchSize ?? this.configService.get("ICO_COMPARISON_BACKFILL_PROJECT_BATCH_SIZE"),
        25,
        1,
        250,
      ),
      includeExternal: input.includeExternal ?? readFlag("ICO_COMPARISON_BACKFILL_INCLUDE_EXTERNAL", true),
      externalDays: this.clampInt(
        input.externalDays ?? this.configService.get("ICO_COMPARISON_BACKFILL_EXTERNAL_DAYS"),
        1095,
        1,
        5000,
      ),
      externalDelayMs: this.clampInt(
        input.externalDelayMs ?? this.configService.get("ICO_COMPARISON_BACKFILL_EXTERNAL_DELAY_MS"),
        1500,
        0,
        60000,
      ),
      minLocalPointsForExternal: this.clampInt(
        input.minLocalPointsForExternal ?? this.configService.get("ICO_COMPARISON_BACKFILL_MIN_LOCAL_POINTS_FOR_EXTERNAL"),
        8,
        0,
        10000,
      ),
      skipAverages: Boolean(input.skipAverages),
      bucketLimit: this.clampInt(input.bucketLimit, 0, 0, 100000),
      averageBucketBatchSize: this.clampInt(
        input.averageBucketBatchSize ?? this.configService.get("ICO_COMPARISON_AVERAGE_BUCKET_BATCH_SIZE"),
        50,
        1,
        500,
      ),
      averagesOnly: Boolean(input.averagesOnly),
    };
  }

  private async ensureIndexes(): Promise<BackfillSummary["snapshotIndexes"]> {
    await Promise.all([
      this.snapshotModel.collection.createIndex({ projectId: 1, timestamp: 1 }),
      this.snapshotModel.collection.createIndex({ slug: 1, timestamp: 1 }),
      this.snapshotModel.collection.createIndex({ timestamp: 1 }),
      this.snapshotModel.collection.createIndex({ dateBucket: 1 }),
      this.snapshotModel.collection.createIndex({ categories: 1 }),
      this.snapshotModel.collection.createIndex({ roiRank: 1 }),
      this.snapshotModel.collection.createIndex({ createdAt: 1 }),
    ]);

    const existingIndexes = await this.snapshotModel.collection.indexes();
    const existing = existingIndexes.map((index) => JSON.stringify(index.key));
    const required = [
      JSON.stringify({ projectId: 1, timestamp: 1 }),
      JSON.stringify({ slug: 1, timestamp: 1 }),
      JSON.stringify({ timestamp: 1 }),
      JSON.stringify({ categories: 1 }),
      JSON.stringify({ roiRank: 1 }),
    ];

    return {
      required,
      existing,
      missing: required.filter((index) => !existing.includes(index)),
    };
  }

  private emptyRetentionCounts(): Record<BucketGranularity, number> {
    return {
      daily: 0,
      weekly: 0,
      monthly: 0,
    };
  }

  private addRetentionCounts(
    summary: BackfillSummary,
    counts: Record<BucketGranularity, number>,
    mode: "planned" | "created",
  ): void {
    if (mode === "planned") {
      summary.dailySnapshotsPlanned += counts.daily;
      summary.weeklySnapshotsPlanned += counts.weekly;
      summary.monthlySnapshotsPlanned += counts.monthly;
      return;
    }

    summary.dailySnapshotsCreated += counts.daily;
    summary.weeklySnapshotsCreated += counts.weekly;
    summary.monthlySnapshotsCreated += counts.monthly;
  }

  private bulkUpsertedIndexes(result: any): number[] {
    const getUpsertedIds = result?.getUpsertedIds;
    if (typeof getUpsertedIds === "function") {
      return getUpsertedIds.call(result)
        .map((item: any) => Number(item?.index))
        .filter((index: number) => Number.isInteger(index));
    }

    if (result?.upsertedIds && typeof result.upsertedIds === "object") {
      return Object.keys(result.upsertedIds)
        .map((index) => Number(index))
        .filter((index) => Number.isInteger(index));
    }

    return [];
  }

  private async estimateSnapshotGrowth(projectCount: number): Promise<Partial<BackfillSummary>> {
    const estimateBasisProjects = Math.max(0, Math.trunc(projectCount || 0));
    const estimatedAverageSnapshotSizeBytes = await this.averageSnapshotSizeBytes();
    const estimatedSnapshots1Year = estimateBasisProjects * this.snapshotsPerProjectForDays(365);
    const estimatedSnapshots3Years = estimateBasisProjects * this.snapshotsPerProjectForDays(365 * 3);
    const estimatedSnapshots5Years = estimateBasisProjects * this.snapshotsPerProjectForDays(365 * 5);

    return {
      estimatedSnapshots1Year,
      estimatedSnapshots3Years,
      estimatedSnapshots5Years,
      estimatedCollectionSizeMB: Number(
        ((estimatedSnapshots5Years * estimatedAverageSnapshotSizeBytes) / (1024 * 1024)).toFixed(2),
      ),
      estimateBasisProjects,
      estimatedAverageSnapshotSizeBytes,
    };
  }

  private snapshotsPerProjectForDays(days: number): number {
    const safeDays = Math.max(0, Math.trunc(days || 0));
    const daily = Math.min(safeDays, 180);
    const weekly = Math.ceil(Math.min(Math.max(safeDays - 180, 0), 550) / 7);
    const monthly = Math.ceil(Math.max(safeDays - 730, 0) / 30);

    return daily + weekly + monthly;
  }

  private async averageSnapshotSizeBytes(): Promise<number> {
    const fallbackBytes = 1800;

    try {
      const stats = await (this.snapshotModel.db as any).db.command({
        collStats: "project_comparison_snapshots",
      });
      const avgObjSize = this.toNumber(stats?.avgObjSize);
      if (avgObjSize && avgObjSize > 0) return Math.ceil(avgObjSize);
    } catch {
      return fallbackBytes;
    }

    return fallbackBytes;
  }

  private logProgress(summary: BackfillSummary, cursor: string | null): void {
    this.logger.log(
      [
        "ICO comparison backfill progress",
        `mode=${summary.mode}`,
        `processedProjects=${summary.processedProjects}`,
        `projectsWithHistory=${summary.projectsWithHistory}`,
        `plannedSnapshots=${summary.plannedSnapshots}`,
        `createdSnapshots=${summary.createdSnapshots}`,
        `updatedSnapshots=${summary.updatedSnapshots}`,
        `failedProjects=${summary.failedProjects}`,
        `failedExternalRequests=${summary.failedExternalRequests}`,
        `cursor=${cursor || ""}`,
      ].join(" "),
    );
  }

  private mergeHistoryPoints(points: RawHistoryPoint[]): RawHistoryPoint[] {
    const byTimestamp = new Map<number, RawHistoryPoint>();

    for (const point of points) {
      if (!point.timestamp || !Number.isFinite(point.timestamp)) continue;
      const existing = byTimestamp.get(point.timestamp);
      if (!existing) {
        byTimestamp.set(point.timestamp, point);
        continue;
      }

      byTimestamp.set(point.timestamp, {
        timestamp: point.timestamp,
        price: point.price ?? existing.price,
        marketCap: point.marketCap ?? existing.marketCap,
        fdv: point.fdv ?? existing.fdv,
        volume24h: point.volume24h ?? existing.volume24h,
        circulatingSupply: point.circulatingSupply ?? existing.circulatingSupply,
        totalSupply: point.totalSupply ?? existing.totalSupply,
        source: this.uniqueStrings([existing.source, point.source]).join(","),
      });
    }

    return Array.from(byTimestamp.values()).sort((left, right) => left.timestamp - right.timestamp);
  }

  private extractTimestamp(raw: any): number {
    const value =
      raw?.timestamp ??
      raw?.date ??
      raw?.time ??
      raw?.createdAt ??
      raw?.last_updated ??
      raw?.time_close ??
      raw?.time_open;
    if (typeof value === "number") return value < 10_000_000_000 ? value * 1000 : value;
    if (!value) return 0;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date.getTime() : 0;
  }

  private statsFromRows(rows: ProjectLike[]): MetricStats {
    const marketCaps = this.finiteNumbers(rows.map((row) => this.toNumber(row.marketCap)));
    const fdvs = this.finiteNumbers(rows.map((row) => this.toNumber(row.fdv)));
    const rois = this.finiteNumbers(rows.map((row) => this.toNumber(row.roiFromIco)));

    return {
      averageMarketCap: this.average(marketCaps),
      averageFDV: this.average(fdvs),
      averageROI: this.average(rois),
      medianROI: this.median(rois),
      topQuartileROI: this.topQuartileAverage(rois),
      count: rows.length,
    };
  }

  private groupByKeys(rows: ProjectLike[], keyFn: (row: ProjectLike) => string[]): Map<string, ProjectLike[]> {
    const result = new Map<string, ProjectLike[]>();

    for (const row of rows) {
      for (const key of keyFn(row)) {
        if (!key) continue;
        const current = result.get(key) || [];
        current.push(row);
        result.set(key, current);
      }
    }

    return result;
  }

  private rankMap(rows: ProjectLike[], valueFn: (row: ProjectLike) => number | null): Map<string, number> {
    const sorted = rows
      .filter((row) => {
        const value = valueFn(row);
        return value !== null && Number.isFinite(value);
      })
      .sort((left, right) => (valueFn(right) || 0) - (valueFn(left) || 0));
    const result = new Map<string, number>();

    sorted.forEach((row, index) => result.set(String(row.projectId), index + 1));
    return result;
  }

  private snapshotConfidence(point: SnapshotPoint): number {
    const checks = [
      point.price,
      point.marketCap,
      point.fdv,
      point.roiFromIco,
      point.categories.length,
      point.chains.length,
    ];
    const present = checks.filter((value) => value !== null && value !== undefined && value !== 0).length;
    return Math.round((present / checks.length) * 100);
  }

  private fundraisingRange(value: number | null): string | null {
    if (!value || value <= 0) return null;
    if (value < 1_000_000) return "<1M";
    if (value < 5_000_000) return "1M-5M";
    if (value < 20_000_000) return "5M-20M";
    if (value < 100_000_000) return "20M-100M";
    return "100M+";
  }

  private sanitizeObject(value: any): any {
    if (Array.isArray(value)) return value.map((item) => this.sanitizeObject(item));
    if (!value || typeof value !== "object" || value instanceof Date || value instanceof Types.ObjectId) {
      if (typeof value === "number" && !Number.isFinite(value)) return null;
      return value;
    }

    return Object.entries(value).reduce((result, [key, item]) => {
      result[key] = this.sanitizeObject(item);
      return result;
    }, {} as Record<string, any>);
  }

  private firstNumber(...values: any[]): number | null {
    for (const value of values) {
      const number = this.toNumber(value);
      if (number !== null) return number;
    }

    return null;
  }

  private firstPositiveNumber(...values: any[]): number | null {
    for (const value of values) {
      const number = this.toNumber(value);
      if (number !== null && number > 0) return number;
    }

    return null;
  }

  private toNumber(value: any): number | null {
    if (value === undefined || value === null || value === "") return null;
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
    if (typeof value === "object") return this.valueByCurrency(value);

    const normalized = String(value).replace(/,/g, "").replace(/\s+/g, " ").trim();
    if (!normalized || normalized === "-") return null;
    const match = normalized.match(/-?\$?\s*([\d.]+)\s*([KMBT])?/i);
    if (!match) return null;

    let number = Number(match[1]);
    if (!Number.isFinite(number)) return null;
    if (normalized.startsWith("-")) number *= -1;
    const suffix = match[2]?.toUpperCase();
    if (suffix === "K") number *= 1_000;
    if (suffix === "M") number *= 1_000_000;
    if (suffix === "B") number *= 1_000_000_000;
    if (suffix === "T") number *= 1_000_000_000_000;

    return Number.isFinite(number) ? number : null;
  }

  private valueByCurrency(value: any): number | null {
    if (!value || typeof value !== "object" || value instanceof Date || Array.isArray(value)) {
      return this.toNumber(value);
    }

    return this.firstNumber(value.USD, value.usd, value.price, value.value, value.currentPrice);
  }

  private multiply(left: any, right: any): number | null {
    const a = this.toNumber(left);
    const b = this.toNumber(right);
    if (a === null || b === null) return null;
    const result = a * b;
    return Number.isFinite(result) && result > 0 ? result : null;
  }

  private roiPercent(current: any, base: any): number | null {
    const currentNumber = this.toNumber(current);
    const baseNumber = this.toNumber(base);
    if (currentNumber === null || baseNumber === null || baseNumber <= 0) return null;
    const result = ((currentNumber - baseNumber) / baseNumber) * 100;
    return Number.isFinite(result) ? result : null;
  }

  private sumNumbers(values: any[]): number | null {
    const sum = values.reduce((total, value) => {
      const number = this.toNumber(value);
      return number === null ? total : total + number;
    }, 0);

    return sum > 0 ? sum : null;
  }

  private finiteNumbers(values: Array<number | null | undefined>): number[] {
    return values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  }

  private average(values: number[]): number | null {
    if (!values.length) return null;
    const result = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Number.isFinite(result) ? result : null;
  }

  private median(values: number[]): number | null {
    if (!values.length) return null;
    const sorted = [...values].sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);
    const result = sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
    return Number.isFinite(result) ? result : null;
  }

  private topQuartileAverage(values: number[]): number | null {
    if (!values.length) return null;
    const sorted = [...values].sort((left, right) => right - left);
    const count = Math.max(1, Math.ceil(sorted.length / 4));
    return this.average(sorted.slice(0, count));
  }

  private earliestDate(...values: any[]): Date | null {
    const times = values
      .map((value) => {
        if (!value) return 0;
        const date = value instanceof Date ? value : new Date(value);
        return Number.isFinite(date.getTime()) ? date.getTime() : 0;
      })
      .filter((value) => value > 0);

    return times.length ? new Date(Math.min(...times)) : null;
  }

  private firstString(...values: any[]): string | null {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) return value.trim();
      if (typeof value === "number" && Number.isFinite(value)) return String(value);
    }

    return null;
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

  private groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
    const result = new Map<string, T[]>();
    for (const item of items) {
      const key = keyFn(item);
      const current = result.get(key) || [];
      current.push(item);
      result.set(key, current);
    }
    return result;
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const result: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      result.push(items.slice(index, index + size));
    }
    return result;
  }

  private clampInt(value: any, fallback: number, min: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, Math.trunc(parsed)));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
