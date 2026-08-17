import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import { Model, Types } from "mongoose";
import { FundingRound, FundingRoundDocument } from "src/funding-rounds/models/funding-round.model";
import { ProjectIntel, ProjectIntelDocument } from "./intel-sync/models/project-intel.model";
import { normalizeSlug } from "./intel-sync/project-identity.util";
import {
  ProjectComparisonSnapshot,
  ProjectComparisonSnapshotDocument,
} from "./project-comparison-snapshot.model";
import { Project, ProjectDocument } from "./project.model";

type ProjectLike = Record<string, any>;

interface MetricRow {
  project: ProjectLike;
  projectId: Types.ObjectId;
  slug: string;
  timestamp: Date;
  dateBucket: string;
  price: number | null;
  marketCap: number | null;
  fdv: number | null;
  volume24h: number | null;
  roiFromIco: number | null;
  roiFromListing: number | null;
  athPriceToDate: number | null;
  atlPriceToDate: number | null;
  circulatingSupply: number | null;
  totalSupply: number | null;
  categories: string[];
  chains: string[];
  launchYear: number | null;
  fundraisingRange: string | null;
  totalRaised: number | null;
  fundraisingEfficiency: number | null;
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
export class IcoComparisonSnapshotsService {
  private readonly logger = new Logger(IcoComparisonSnapshotsService.name);

  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectIntel.name) private readonly projectIntelModel: Model<ProjectIntelDocument>,
    @InjectModel(FundingRound.name) private readonly fundingRoundModel: Model<FundingRoundDocument>,
    @InjectModel(ProjectComparisonSnapshot.name)
    private readonly snapshotModel: Model<ProjectComparisonSnapshotDocument>,
    private readonly configService: ConfigService,
  ) { }

  @Cron("0 */4 * * *", { name: "ico-comparison-snapshots" })
  async handleSnapshotCron(): Promise<void> {
    if (this.configService.get("IS_LOCAL_RUN") === "true") return;
    await this.createSnapshots();
  }

  async createSnapshots(limit?: number): Promise<{ processed: number; saved: number }> {
    const startedAt = Date.now();
    const batchLimit = this.clampInt(
      limit ?? this.configService.get("ICO_COMPARISON_SNAPSHOT_PROJECT_LIMIT"),
      500,
      1,
      5000,
    );
    const timestamp = new Date();
    const dateBucket = this.toHourlyBucket(timestamp);
    const projects = await this.projectModel
      .find({
        projectStatus: "active",
        $or: [
          { price: { $gt: 0 } },
          { marketCap: { $gt: 0 } },
          { fullyDilutedMarketCap: { $gt: 0 } },
          { "usdQuote.price": { $gt: 0 } },
          { "rawIcoData.marketData.currentPrice": { $gt: 0 } },
          { "rawIcoData.marketData.marketCap": { $gt: 0 } },
        ],
      })
      .sort({ rank: 1, marketCap: -1, fomoScore: -1 })
      .limit(batchLimit)
      .lean();

    if (!projects.length) return { processed: 0, saved: 0 };

    const projectIds = projects.map((project) => project._id);
    const [intels, fundingRounds] = await Promise.all([
      this.projectIntelModel.find({ projectId: { $in: projectIds } }).lean(),
      this.findFundingRounds(projects),
    ]);
    const intelByProjectId = new Map<string, ProjectLike>(
      intels.map((intel) => [String(intel.projectId), intel]),
    );
    const fundingRoundsByProject = this.groupFundingRounds(projects, fundingRounds);
    const rows = projects
      .map((project) =>
        this.buildMetricRow(
          project,
          intelByProjectId.get(String(project._id)) || null,
          fundingRoundsByProject.get(String(project._id)) || [],
          timestamp,
          dateBucket,
        ),
      )
      .filter((row) => row.price !== null || row.marketCap !== null || row.fdv !== null || row.roiFromIco !== null);

    if (!rows.length) return { processed: projects.length, saved: 0 };

    const stats = this.buildIndustryStats(rows);
    const rankings = this.buildRankings(rows);
    const operations = rows.map((row) => {
      const rowRankings = rankings.get(String(row.projectId)) || {};
      const selectedStats = this.selectIndustryStats(row, stats);

      return {
        updateOne: {
          filter: { projectId: row.projectId, dateBucket: row.dateBucket },
          update: {
            $set: this.sanitizeObject({
              projectId: row.projectId,
              slug: row.slug,
              timestamp: row.timestamp,
              dateBucket: row.dateBucket,
              price: row.price,
              marketCap: row.marketCap,
              fdv: row.fdv,
              volume24h: row.volume24h,
              roiFromIco: row.roiFromIco,
              roiFromListing: row.roiFromListing,
              athPriceToDate: row.athPriceToDate,
              atlPriceToDate: row.atlPriceToDate,
              circulatingSupply: row.circulatingSupply,
              totalSupply: row.totalSupply,
              industryAverageMarketCap: selectedStats.averageMarketCap,
              industryAverageFDV: selectedStats.averageFDV,
              industryAverageROI: selectedStats.averageROI,
              industryMedianROI: selectedStats.medianROI,
              industryTopQuartileROI: selectedStats.topQuartileROI,
              categoryRank: rowRankings.categoryRank,
              roiRank: rowRankings.roiRank,
              categories: row.categories,
              chains: row.chains,
              launchYear: row.launchYear,
              fundraisingRange: row.fundraisingRange,
              fundraisingEfficiency: row.fundraisingEfficiency,
              industryAverages: this.buildRowIndustryAverages(row, stats),
              rankings: rowRankings,
              dataQuality: this.buildDataQuality(row),
              createdAt: new Date(),
            }),
          },
          upsert: true,
        },
      };
    });

    const result = await this.snapshotModel.bulkWrite(operations, { ordered: false });
    const saved = (result.upsertedCount || 0) + (result.modifiedCount || 0);
    this.logger.log(
      `ICO comparison snapshots processed=${projects.length} rows=${rows.length} saved=${saved} durationMs=${Date.now() - startedAt}`,
    );

    return { processed: projects.length, saved };
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

  private buildMetricRow(
    project: ProjectLike,
    intel: ProjectLike | null,
    fundingRounds: any[],
    timestamp: Date,
    dateBucket: string,
  ): MetricRow {
    const marketData = intel?.marketData || project.rawIcoData?.marketData || {};
    const firstRound = fundingRounds.find((round) => this.firstPositiveNumber(round.tokenPrice, round.price));
    const price = this.firstPositiveNumber(
      project.price,
      project.usdQuote?.price,
      marketData.currentPrice,
      marketData.price,
      project.rawIcoData?.tokenomics?.tokenPrice,
    );
    const circulatingSupply = this.firstPositiveNumber(
      project.circulatingSupply,
      project.tokenomics?.circulatingSupply,
      project.tokenMetrics?.circulatingSupply,
      intel?.tokenomics?.supply?.circulatingSupply,
    );
    const totalSupply = this.firstPositiveNumber(
      project.totalSupply,
      project.tokenomics?.totalSupply,
      project.tokenMetrics?.totalSupply,
      intel?.tokenomics?.supply?.totalSupply,
    );
    const marketCap = this.firstPositiveNumber(
      project.marketCap,
      project.usdQuote?.market_cap,
      marketData.marketCap,
      this.multiply(price, circulatingSupply),
    );
    const fdv = this.firstPositiveNumber(
      project.fullyDilutedMarketCap,
      marketData.fdv,
      marketData.fullyDilutedMarketCap,
      project.tokenomics?.fdv,
      intel?.tokenomics?.fdv,
      this.multiply(price, totalSupply),
    );
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
    const roiFromIco = this.firstNumber(
      project.roiData?.roi,
      marketData.roi,
      marketData.raw?.dropstabStats?.returns?.usd,
      this.roiPercent(price, icoPrice),
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
    const fundraisingEfficiency = totalRaised
      ? this.firstPositiveNumber(
        marketCap && marketCap / totalRaised,
        fdv && fdv / totalRaised,
      )
      : null;

    return {
      project,
      projectId: new Types.ObjectId(String(project._id)),
      slug: project.slug || normalizeSlug(project.name || project.sourceId || ""),
      timestamp,
      dateBucket,
      price,
      marketCap,
      fdv,
      volume24h: this.firstPositiveNumber(project.volume24h, project.volume, project.usdQuote?.volume_24h, marketData.volume24h),
      roiFromIco,
      roiFromListing: this.roiPercent(price, listingPrice),
      athPriceToDate: this.firstPositiveNumber(project.athUsd, marketData.athPrice, marketData.ath, price),
      atlPriceToDate: this.firstPositiveNumber(project.atlUsd, marketData.atlPrice, marketData.atl, price),
      circulatingSupply,
      totalSupply,
      categories,
      chains,
      launchYear: launchDate ? launchDate.getUTCFullYear() : null,
      fundraisingRange: this.fundraisingRange(totalRaised),
      totalRaised,
      fundraisingEfficiency,
    };
  }

  private buildIndustryStats(rows: MetricRow[]): {
    global: MetricStats;
    categories: Record<string, MetricStats>;
    chains: Record<string, MetricStats>;
    launchYears: Record<string, MetricStats>;
    fundraisingRanges: Record<string, MetricStats>;
  } {
    const buildGroupedStats = (groupRows: MetricRow[]) => this.statsFromRows(groupRows);
    const grouped = {
      global: buildGroupedStats(rows),
      categories: {} as Record<string, MetricStats>,
      chains: {} as Record<string, MetricStats>,
      launchYears: {} as Record<string, MetricStats>,
      fundraisingRanges: {} as Record<string, MetricStats>,
    };

    this.groupByKeys(rows, (row) => row.categories).forEach((value, key) => {
      grouped.categories[key] = buildGroupedStats(value);
    });
    this.groupByKeys(rows, (row) => row.chains).forEach((value, key) => {
      grouped.chains[key] = buildGroupedStats(value);
    });
    this.groupByKeys(rows, (row) => (row.launchYear ? [String(row.launchYear)] : [])).forEach((value, key) => {
      grouped.launchYears[key] = buildGroupedStats(value);
    });
    this.groupByKeys(rows, (row) => (row.fundraisingRange ? [row.fundraisingRange] : [])).forEach((value, key) => {
      grouped.fundraisingRanges[key] = buildGroupedStats(value);
    });

    return grouped;
  }

  private buildRankings(rows: MetricRow[]): Map<string, any> {
    const rankings = new Map<string, any>();
    const globalRoiRank = this.rankMap(rows, (row) => row.roiFromIco);
    const efficiencyRank = this.rankMap(rows, (row) => row.fundraisingEfficiency);

    for (const row of rows) {
      const primaryCategory = row.categories[0] || null;
      const primaryChain = row.chains[0] || null;
      const categoryRows = primaryCategory
        ? rows.filter((candidate) => candidate.categories.includes(primaryCategory))
        : rows;
      const chainRows = primaryChain
        ? rows.filter((candidate) => candidate.chains.includes(primaryChain))
        : rows;
      const launchYearRows = row.launchYear
        ? rows.filter((candidate) => candidate.launchYear === row.launchYear)
        : rows;

      rankings.set(String(row.projectId), {
        categoryRank: this.rankMap(categoryRows, (candidate) => candidate.roiFromIco).get(String(row.projectId)) || null,
        chainRank: this.rankMap(chainRows, (candidate) => candidate.roiFromIco).get(String(row.projectId)) || null,
        launchYearRank: this.rankMap(launchYearRows, (candidate) => candidate.roiFromIco).get(String(row.projectId)) || null,
        roiRank: globalRoiRank.get(String(row.projectId)) || null,
        fundraisingEfficiencyRank: efficiencyRank.get(String(row.projectId)) || null,
      });
    }

    return rankings;
  }

  private selectIndustryStats(row: MetricRow, stats: ReturnType<IcoComparisonSnapshotsService["buildIndustryStats"]>): MetricStats {
    const categoryStats = row.categories.map((category) => stats.categories[category]).find(Boolean);
    const chainStats = row.chains.map((chain) => stats.chains[chain]).find(Boolean);
    const launchYearStats = row.launchYear ? stats.launchYears[String(row.launchYear)] : null;
    const fundraisingStats = row.fundraisingRange ? stats.fundraisingRanges[row.fundraisingRange] : null;

    return categoryStats || chainStats || launchYearStats || fundraisingStats || stats.global;
  }

  private buildRowIndustryAverages(row: MetricRow, stats: ReturnType<IcoComparisonSnapshotsService["buildIndustryStats"]>): any {
    return {
      selected: this.selectIndustryStats(row, stats),
      categories: row.categories.reduce((result, category) => {
        result[category] = stats.categories[category] || null;
        return result;
      }, {} as Record<string, MetricStats | null>),
      chains: row.chains.reduce((result, chain) => {
        result[chain] = stats.chains[chain] || null;
        return result;
      }, {} as Record<string, MetricStats | null>),
      launchYear: row.launchYear ? stats.launchYears[String(row.launchYear)] || null : null,
      fundraisingRange: row.fundraisingRange ? stats.fundraisingRanges[row.fundraisingRange] || null : null,
      global: stats.global,
    };
  }

  private buildDataQuality(row: MetricRow): any {
    const missingFields = [
      ["price", row.price],
      ["marketCap", row.marketCap],
      ["fdv", row.fdv],
      ["roiFromIco", row.roiFromIco],
      ["categories", row.categories],
      ["chains", row.chains],
    ]
      .filter(([, value]) => value === null || value === undefined || (Array.isArray(value) && !value.length))
      .map(([name]) => name);

    return {
      sources: ["project", "project_intel", "funding_rounds"],
      missingFields,
      confidence: Math.max(0, Math.round(100 - missingFields.length * 12)),
    };
  }

  private statsFromRows(rows: MetricRow[]): MetricStats {
    const marketCaps = this.finiteNumbers(rows.map((row) => row.marketCap));
    const fdvs = this.finiteNumbers(rows.map((row) => row.fdv));
    const rois = this.finiteNumbers(rows.map((row) => row.roiFromIco));

    return {
      averageMarketCap: this.average(marketCaps),
      averageFDV: this.average(fdvs),
      averageROI: this.average(rois),
      medianROI: this.median(rois),
      topQuartileROI: this.topQuartileAverage(rois),
      count: rows.length,
    };
  }

  private groupByKeys(rows: MetricRow[], keyFn: (row: MetricRow) => string[]): Map<string, MetricRow[]> {
    const result = new Map<string, MetricRow[]>();

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

  private rankMap(rows: MetricRow[], valueFn: (row: MetricRow) => number | null): Map<string, number> {
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

  private fundraisingRange(value: number | null): string | null {
    if (!value || value <= 0) return null;
    if (value < 1_000_000) return "<1M";
    if (value < 5_000_000) return "1M-5M";
    if (value < 20_000_000) return "5M-20M";
    if (value < 100_000_000) return "20M-100M";
    return "100M+";
  }

  private toHourlyBucket(date: Date): string {
    const bucket = new Date(date);
    bucket.setUTCMinutes(0, 0, 0);
    return bucket.toISOString();
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

  private clampInt(value: any, fallback: number, min: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, Math.trunc(parsed)));
  }
}
