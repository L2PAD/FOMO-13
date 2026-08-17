import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Chart, ChartDocument } from "src/analytics/models/chart.model";
import { FundingRound, FundingRoundDocument } from "src/funding-rounds/models/funding-round.model";
import { Model, Types } from "mongoose";
import { AppCacheService } from "src/common/cache/cache.service";
import { CACHE_TTL_SECONDS } from "src/common/cache/cache.constants";
import { CacheKeys } from "src/common/cache/cache.keys";
import { IcoComparisonService } from "./ico-comparison.service";
import { normalizeSlug } from "./intel-sync/project-identity.util";
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
type HistoryRange = "30D" | "90D" | "6M" | "YTD" | "Since ICO";
type SnapshotGranularity = "hourly" | "daily" | "weekly" | "monthly";

const MAX_SELECTED_HISTORY_PROJECTS = 10;
const MAX_FUNDING_ROUNDS_PER_PROJECT = 50;
const MAX_SNAPSHOT_ROWS_PER_PROJECT = 1800;
const MAX_TOTAL_SNAPSHOT_ROWS = 15000;
const MAX_CHART_HISTORY_ROWS_PER_PROJECT = 5000;
const MAX_LEGACY_CHART_HISTORY_DOCUMENTS = 6;
const MAX_INDUSTRY_CATEGORY_KEYS = 8;
const HISTORY_PROJECT_PROJECTION: Record<string, number> = {
  _id: 1,
  projectType: 1,
  projectStatus: 1,
  name: 1,
  normalizedName: 1,
  slug: 1,
  sourceId: 1,
  symbol: 1,
  ticker: 1,
  niche: 1,
  logo: 1,
  categories: 1,
  tags: 1,
  ecosystems: 1,
  launchpads: 1,
  mainCategory: 1,
  type: 1,
  status: 1,
  history: 1,
  price: 1,
  currentPrice: 1,
  usdQuote: 1,
  marketCap: 1,
  fullyDilutedMarketCap: 1,
  fdv: 1,
  volume24h: 1,
  volume: 1,
  circulatingSupply: 1,
  totalSupply: 1,
  icoPrice: 1,
  listingPrice: 1,
  entryPrice: 1,
  tokenomics: 1,
  tokenMetrics: 1,
  marketTokenDetails: 1,
  fundraising: 1,
  fundsRounds: 1,
  saleRounds: 1,
  dateAdded: 1,
  createdAt: 1,
  coingeckoId: 1,
  coinMarketCapId: 1,
  dropstabId: 1,
  cryptorankId: 1,
  icodropsId: 1,
  "rawIcoData.slug": 1,
  "rawIcoData.sourceId": 1,
  "rawIcoData.symbol": 1,
  "rawIcoData.ticker": 1,
  "rawIcoData.logo": 1,
  "rawIcoData.categories": 1,
  "rawIcoData.tags": 1,
  "rawIcoData.marketData": 1,
  "rawIcoData.icoPrice": 1,
  "rawIcoData.listingPrice": 1,
  "rawIcoData.tokenomics": 1,
  "rawIcoData.fundraising": 1,
  "rawIcoData.saleRounds": 1,
  "rawIcoData.dates": 1,
  "rawIcoData.icoDate": 1,
  "rawIcoData.dateAdded": 1,
  "rawIcoData.marketTokenDetails": 1,
  "rawIcoData.coingeckoId": 1,
  "rawIcoData.coinMarketCapId": 1,
  "rawIcoData.dropstabId": 1,
  "rawIcoData.dropstabSlug": 1,
  "rawIcoData.cryptorankId": 1,
  "rawIcoData.icodropsId": 1,
};
const FUNDING_ROUND_HISTORY_PROJECTION: Record<string, number> = {
  projectId: 1,
  projectLinks: 1,
  coinSlug: 1,
  coinSymbol: 1,
  name: 1,
  roundName: 1,
  stage: 1,
  type: 1,
  date: 1,
  startDate: 1,
  endDate: 1,
  rawDate: 1,
  price: 1,
  tokenPrice: 1,
  "raw.infoBlocks.Price": 1,
};

interface HistoryQuery {
  range?: any;
  peerLimit?: any;
  includeIndustry?: any;
  projectIds?: any;
  status?: any;
}

interface NormalizedHistoryQuery {
  range: HistoryRange;
  peerLimit: number;
  includeIndustry: boolean;
  selectedProjectKeys: string[];
  status: string | null;
}

interface RangeConfig {
  range: HistoryRange;
  start: Date | null;
  end: Date;
  bucketMs: number;
  maxPoints: number | null;
}

interface HistoryPoint {
  timestamp: number;
  date: string;
  price: number | null;
  investmentPrice: number | null;
  roundName: string | null;
  marketCap: number | null;
  fdv: number | null;
  volume24h: number | null;
  roiFromIco: number | null;
  roiFromListing: number | null;
  roiMultiplier: number | null;
  roiSource?: string | null;
  industryAverageMarketCap?: number | null;
  industryAverageFDV?: number | null;
  industryAverageROI?: number | null;
  industryMedianROI?: number | null;
  industryTopQuartileROI?: number | null;
  source?: string;
}

interface ProjectSeries {
  id?: string | null;
  name: string;
  slug: string;
  symbol?: string | null;
  logo?: string | null;
  series: HistoryPoint[];
}

interface IndustryMetricAverages {
  marketCap: number | null;
  fdv: number | null;
  projectCount: number;
  sourceDocumentCount: number;
  marketCapCount: number;
  fdvCount: number;
  categoryKeys: string[];
}

@Injectable()
export class IcoComparisonTimeseriesService {
  private readonly logger = new Logger(IcoComparisonTimeseriesService.name);
  private readonly perfLogs = process.env.COMPARISON_PERF_LOGS === "true" || process.env.CACHE_DEBUG_LOGS === "true";
  private readonly inFlight = new Map<string, Promise<any>>();
  private readonly warmInFlight = new Set<string>();
  private readonly warmLastStartedAt = new Map<string, number>();
  private readonly warmCooldownMs = 60_000;
  private readonly maxWarmJobs = Math.max(1, Number(process.env.COMPARISON_PREWARM_CONCURRENCY || 4));

  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectComparisonSnapshot.name)
    private readonly snapshotModel: Model<ProjectComparisonSnapshotDocument>,
    @InjectModel(ProjectChartHistory.name)
    private readonly projectChartHistoryModel: Model<ProjectChartHistoryDocument>,
    @InjectModel(Chart.name) private readonly chartModel: Model<ChartDocument>,
    @InjectModel(FundingRound.name) private readonly fundingRoundModel: Model<FundingRoundDocument>,
    private readonly icoComparisonService: IcoComparisonService,
    private readonly cacheService?: AppCacheService,
  ) {}

  async getIcoComparisonHistory(slugOrId: string, query: HistoryQuery = {}): Promise<any> {
    const project = await this.findProject(slugOrId);
    const normalizedQuery: NormalizedHistoryQuery = {
      range: this.normalizeRange(query.range),
      peerLimit: this.clampInt(query.peerLimit, 5, 0, 10),
      includeIndustry: this.isTruthy(query.includeIndustry, true),
      selectedProjectKeys: this.parseProjectKeys(query.projectIds).slice(0, MAX_SELECTED_HISTORY_PROJECTS),
      status: this.firstString(query.status),
    };
    const cacheKey = CacheKeys.projects.icoComparisonHistory({
      projectId: String(project._id),
      status: normalizedQuery.status,
      range: normalizedQuery.range,
      peerLimit: normalizedQuery.peerLimit,
      includeIndustry: normalizedQuery.includeIndustry,
      projectIds: normalizedQuery.selectedProjectKeys,
    });

    return this.cacheReadOnly(
      cacheKey,
      CACHE_TTL_SECONDS.projectIcoComparisonHistory,
      "ico-comparison-history",
      () => this.getIcoComparisonHistoryUncached(project, normalizedQuery),
    );
  }

  warmComparisonHistory(slugOrId: string, query: HistoryQuery = {}): void {
    const projectKey = String(slugOrId || "").trim();
    if (!projectKey) return;

    const normalizedWarmQuery: HistoryQuery = {
      range: query.range || "30D",
      peerLimit: query.peerLimit ?? 4,
      includeIndustry: query.includeIndustry ?? true,
      status: query.status,
    };
    const warmKey = [
      "ico-comparison-history",
      projectKey,
      normalizedWarmQuery.range,
      normalizedWarmQuery.peerLimit,
      normalizedWarmQuery.includeIndustry,
      normalizedWarmQuery.status || "",
    ].join(":");

    this.scheduleWarm(warmKey, async () => {
      const comparison = await this.icoComparisonService.getIcoComparison(projectKey, {
        includePeers: true,
        peerLimit: normalizedWarmQuery.peerLimit,
        status: normalizedWarmQuery.status,
      });
      const comparisonIds = this.uniqueStrings(
        (comparison?.comparisonTable || [])
          .map((item: any) => item?.id)
          .filter(Boolean),
      ).slice(0, 5);

      if (!comparisonIds.length) {
        await this.getIcoComparisonHistory(projectKey, normalizedWarmQuery);
        return;
      }

      await Promise.all([
        this.getIcoComparisonHistory(projectKey, {
          ...normalizedWarmQuery,
          peerLimit: 0,
          projectIds: comparisonIds.join(","),
        }),
        comparisonIds.length > 1
          ? this.getIcoComparisonHistory(projectKey, {
              ...normalizedWarmQuery,
              peerLimit: 0,
              projectIds: comparisonIds.slice(0, 2).join(","),
            })
          : Promise.resolve(),
      ]);
    });
  }

  private async getIcoComparisonHistoryUncached(
    project: ProjectLike,
    query: NormalizedHistoryQuery,
  ): Promise<any> {
    const startedAt = Date.now();
    const comparisonData = query.selectedProjectKeys.length && query.peerLimit <= 0
      ? null
      : await this.safeGetComparison(project, query.peerLimit);
    this.logStage("ico-comparison-history", "comparison", startedAt);
    const targets = await this.resolveTargets(
      project,
      comparisonData?.comparisonPeers || [],
      query.peerLimit,
      query.selectedProjectKeys,
    );
    this.logStage("ico-comparison-history", "targets", startedAt);
    const primaryProject = targets[0]?.project || project;
    const rangeConfig = this.buildRangeConfig(query.range, primaryProject);
    const categoryIndustryAveragesPromise = query.includeIndustry
      ? this.buildCategoryIndustryAverages(primaryProject)
      : Promise.resolve(null);
    const [fundingRoundsByProjectId, directChartPointsByProjectId] = await Promise.all([
      this.findFundingRoundsForProjects(targets.map((target) => target.project)),
      this.findDirectChartPointsForProjects(targets.map((target) => target.project), rangeConfig),
    ]);
    const linkedChartPointsByProjectId = await this.findLinkedChartPointsForProjects(
      targets.map((target) => target.project),
      directChartPointsByProjectId,
      rangeConfig,
    );
    this.logStage("ico-comparison-history", "funding-and-direct-history", startedAt);
    const baseSeriesEntries = await Promise.all(
      targets.map(async (target) => {
        const investmentEntry = this.resolveInvestmentEntry(
          target.project,
          fundingRoundsByProjectId.get(String(target.id || "")) || [],
        );

        return {
          target,
          investmentEntry,
          analyticsSeries: await this.buildAnalyticsChartSeries(
            target.project,
            rangeConfig,
            investmentEntry,
            [
              ...(directChartPointsByProjectId.get(String(target.id || target.project?._id || "")) || []),
              ...(linkedChartPointsByProjectId.get(String(target.id || target.project?._id || "")) || []),
            ],
          ),
        };
      }),
    );
    this.logStage("ico-comparison-history", "analytics-series", startedAt);
    const snapshotTargets = baseSeriesEntries
      .filter((entry) => !entry.analyticsSeries.length)
      .map((entry) => entry.target);
    const snapshots = snapshotTargets.length ? await this.findSnapshots(snapshotTargets, rangeConfig) : [];
    this.logStage("ico-comparison-history", "snapshots", startedAt);
    const snapshotsByTarget = snapshots.length ? this.groupSnapshotsByTarget(snapshots, snapshotTargets) : new Map();
    const projectSeries = baseSeriesEntries.map((entry) => {
      const { target, investmentEntry, analyticsSeries } = entry;
      const targetSnapshots = snapshotsByTarget.get(this.targetKey(target)) || [];
      const snapshotSeries = analyticsSeries.length
        ? []
        : this.snapshotsToSeries(
            this.historicalMarketSnapshots(targetSnapshots),
            rangeConfig,
            investmentEntry,
          );
      const projectHistorySeries = analyticsSeries.length || snapshotSeries.length
        ? []
        : this.buildProjectHistorySeries(target.project, rangeConfig, investmentEntry);
      const series = analyticsSeries.length
        ? analyticsSeries
        : snapshotSeries.length
        ? snapshotSeries
        : projectHistorySeries;

      return {
        id: target.id,
        name: target.name,
        slug: target.slug,
        symbol: target.symbol,
        logo: target.logo,
        series: this.ensureNonEmptySeries(series),
      };
    });
    const currentSeries = projectSeries[0]?.series || [];
    const categoryIndustryAverages = await categoryIndustryAveragesPromise;
    this.logStage("ico-comparison-history", "industry-average", startedAt);
    const industryAverageHistory = query.includeIndustry
      ? this.buildIndustryAverageHistory(currentSeries, categoryIndustryAverages)
      : [];
    this.logStage("ico-comparison-history", "response-built", startedAt);

    return this.sanitizeResponse({
      range: query.range,
      generatedAt: new Date().toISOString(),
      roiHistory: currentSeries.map((point) => ({
        timestamp: point.timestamp,
        date: point.date,
        value: point.roiMultiplier,
        price: point.price,
        investmentPrice: point.investmentPrice,
        roundName: point.roundName,
        roiFromIco: point.roiFromIco,
        roiFromListing: point.roiFromListing,
        roiMultiplier: point.roiMultiplier,
        roiSource: point.roiSource,
        source: point.source,
      })),
      marketCapHistory: currentSeries.map((point) => ({
        timestamp: point.timestamp,
        date: point.date,
        value: point.marketCap,
        marketCap: point.marketCap,
      })),
      fdvHistory: currentSeries.map((point) => ({
        timestamp: point.timestamp,
        date: point.date,
        value: point.fdv,
        fdv: point.fdv,
      })),
      peerComparisonHistory: projectSeries,
      industryAverageHistory,
      dataQuality: {
        sources: this.uniqueStrings([
          projectSeries.some((item) => item.series.some((point) => point.source === "project_comparison_snapshots")) ? "project_comparison_snapshots" : "",
          projectSeries.some((item) => item.series.some((point) => String(point.source || "").startsWith("project-chart-history"))) ? "project_chart_history" : "",
          projectSeries.some((item) => item.series.some((point) => String(point.source || "").startsWith("chart"))) ? "charts" : "",
          projectSeries.some((item) => item.series.some((point) => point.source === "project-history")) ? "project.history" : "",
        ]),
        snapshots: snapshots.length,
        peers: Math.max(0, projectSeries.length - 1),
        includeIndustry: query.includeIndustry,
        industryAverage: categoryIndustryAverages
          ? {
              source: "project_category_average",
              categoryKeys: categoryIndustryAverages.categoryKeys,
              projectCount: categoryIndustryAverages.projectCount,
              sourceDocumentCount: categoryIndustryAverages.sourceDocumentCount,
              marketCapCount: categoryIndustryAverages.marketCapCount,
              fdvCount: categoryIndustryAverages.fdvCount,
            }
          : null,
        safeguards: {
          preferAnalyticsHistoryOverSnapshots: true,
          ignoreCurrentStateSnapshotsForHistoryPrice: true,
          indexedSnapshotLookup: true,
          indexedChartHistoryLookup: true,
          indexedChartCacheLookup: true,
          batchedFundingRoundLookup: true,
          boundedHistoryReads: true,
          placeholderHistoryPoints: false,
          syntheticCurrentMetricRoi: false,
          symbolFallbackRequiresUniqueSymbol: true,
          categoryIndustryAverage: true,
        },
      },
    });
  }

  private async findProject(slugOrId: string): Promise<ProjectLike> {
    const normalizedSlug = normalizeSlug(slugOrId);
    const clauses: any[] = [
      { slug: slugOrId },
      { slug: normalizedSlug },
      { sourceId: slugOrId },
      { "rawIcoData.slug": slugOrId },
      { "rawIcoData.slug": normalizedSlug },
    ];

    if (Types.ObjectId.isValid(slugOrId)) {
      clauses.push({ _id: new Types.ObjectId(slugOrId) });
    }

    const project = await this.projectModel.findOne({ $or: clauses }, HISTORY_PROJECT_PROJECTION).lean();
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  private async safeGetComparison(project: ProjectLike, peerLimit: number): Promise<any | null> {
    try {
      return await this.icoComparisonService.getIcoComparison(String(project._id || project.slug), {
        includePeers: true,
        peerLimit,
      });
    } catch (error) {
      return null;
    }
  }

  private async resolveTargets(project: ProjectLike, peers: any[], peerLimit: number, selectedProjectKeys: string[] = []): Promise<Array<{
    id: string | null;
    name: string;
    slug: string;
    symbol?: string | null;
    logo?: string | null;
    project: ProjectLike;
  }>> {
    const peerSlugs = this.uniqueStrings(peers.map((peer) => peer.slug)).slice(0, peerLimit);
    const peerIds = peers
      .map((peer) => peer.id)
      .filter((id) => Types.ObjectId.isValid(String(id)))
      .map((id) => new Types.ObjectId(String(id)));
    const selectedProjectIds = selectedProjectKeys
      .filter((id) => Types.ObjectId.isValid(String(id)))
      .map((id) => new Types.ObjectId(String(id)));
    const selectedSlugs = selectedProjectKeys
      .filter((id) => !Types.ObjectId.isValid(String(id)))
      .map((id) => normalizeSlug(id))
      .filter(Boolean);
    const or: any[] = [];
    const selectedOr: any[] = [];

    if (peerSlugs.length) or.push({ slug: { $in: peerSlugs } });
    if (peerIds.length) or.push({ _id: { $in: peerIds } });
    if (selectedProjectIds.length) selectedOr.push({ _id: { $in: selectedProjectIds } });
    if (selectedSlugs.length) {
      selectedOr.push(
        { slug: { $in: selectedSlugs } },
        { sourceId: { $in: selectedSlugs } },
        { "rawIcoData.slug": { $in: selectedSlugs } },
      );
    }

    const [peerProjects, selectedProjects] = await Promise.all([
      or.length ? this.projectModel.find({ $or: or }, HISTORY_PROJECT_PROJECTION).lean() : [],
      selectedOr.length ? this.projectModel.find({ $or: selectedOr }, HISTORY_PROJECT_PROJECTION).lean() : [],
    ]);
    const projectBySlug = new Map<string, ProjectLike>(
      [...peerProjects, ...selectedProjects].flatMap((peerProject) =>
        this.uniqueStrings([
          peerProject.slug,
          peerProject.sourceId,
          peerProject.rawIcoData?.slug,
        ]).flatMap((slug) =>
          this.uniqueStrings([slug, normalizeSlug(slug)]).map((slugKey) => [String(slugKey || "").toLowerCase(), peerProject] as [string, ProjectLike])
        )
      ),
    );
    const projectById = new Map<string, ProjectLike>(
      [...peerProjects, ...selectedProjects].map((peerProject) => [String(peerProject._id), peerProject]),
    );
    const selectedTargets = selectedProjectKeys
      .map((projectKey) => {
        const key = String(projectKey || "");
        return projectById.get(key) || projectBySlug.get(normalizeSlug(key).toLowerCase());
      })
      .filter(Boolean)
      .map((selectedProject) => this.targetFromProject(selectedProject as ProjectLike));
    const peerTargets = peers.slice(0, peerLimit).map((peer) => {
      const matchedProject = projectById.get(String(peer.id || "")) || projectBySlug.get(String(peer.slug || "").toLowerCase());
      return this.targetFromProject(matchedProject || peer, peer);
    });
    const targets = selectedTargets.length
      ? selectedTargets
      : [
          this.targetFromProject(project),
          ...peerTargets,
        ];
    const selectedKeySet = new Set(
      selectedProjectKeys
        .map((item) => String(item || "").toLowerCase())
        .filter(Boolean),
    );
    const seen = new Set<string>();

    return targets.filter((target) => {
      const targetKeys = [
        String(target.id || "").toLowerCase(),
        String(target.slug || "").toLowerCase(),
        normalizeSlug(target.name || "").toLowerCase(),
      ].filter(Boolean);
      const key = target.slug || target.id || target.name;
      if (!key || seen.has(key)) return false;
      if (selectedKeySet.size && !targetKeys.some((targetKey) => selectedKeySet.has(targetKey))) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private targetFromProject(project: ProjectLike, fallback: ProjectLike = {}): {
    id: string | null;
    name: string;
    slug: string;
    symbol?: string | null;
    logo?: string | null;
    project: ProjectLike;
  } {
    const slug = project?.slug || fallback?.slug || normalizeSlug(project?.name || fallback?.name || project?.sourceId || "");

    return {
      id: project?._id ? String(project._id) : fallback?.id || null,
      name: project?.name || fallback?.name || slug,
      slug,
      symbol: this.firstString(project?.symbol, project?.ticker, project?.niche, fallback?.symbol),
      logo: this.firstString(project?.logo, project?.rawIcoData?.logo, fallback?.logo),
      project: {
        ...fallback,
        ...project,
        slug,
      },
    };
  }

  private async findFundingRoundsForProjects(projects: ProjectLike[]): Promise<Map<string, any[]>> {
    const projectIds = projects
      .map((project) => project?._id || project?.id)
      .filter((id) => Types.ObjectId.isValid(String(id)))
      .map((id) => new Types.ObjectId(String(id)));
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

    if (projectIds.length) {
      or.push({ projectId: { $in: projectIds } }, { "projectLinks.projectId": { $in: projectIds } });
    }
    if (slugs.length) or.push({ coinSlug: { $in: slugs } });
    if (symbols.length) or.push({ coinSymbol: { $in: symbols } });
    if (!or.length) return new Map();

    const rounds = await this.fundingRoundModel
      .find({ $or: or }, FUNDING_ROUND_HISTORY_PROJECTION)
      .sort({ date: -1 })
      .limit(Math.max(projects.length * MAX_FUNDING_ROUNDS_PER_PROJECT, MAX_FUNDING_ROUNDS_PER_PROJECT))
      .lean();

    return this.groupFundingRounds(projects, rounds);
  }

  private groupFundingRounds(projects: ProjectLike[], rounds: any[]): Map<string, any[]> {
    const result = new Map<string, any[]>();
    const projectKeys = projects.map((project) => ({
      id: String(project?._id || project?.id || ""),
      objectId: String(project?._id || project?.id || ""),
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
    const symbolCounts = new Map<string, number>();

    for (const project of projectKeys) {
      for (const projectSymbol of project.symbols) {
        symbolCounts.set(projectSymbol, (symbolCounts.get(projectSymbol) || 0) + 1);
      }
    }

    for (const round of rounds) {
      const roundProjectId = String(round.projectId || "");
      const linkedProjectIds = Array.isArray(round.projectLinks)
        ? round.projectLinks.map((link: any) => String(link?.projectId || "")).filter(Boolean)
        : [];
      const slug = String(round.coinSlug || "").toLowerCase();
      const symbol = String(round.coinSymbol || "").toUpperCase();
      const hasStrongRoundIdentity = Boolean(roundProjectId || linkedProjectIds.length || slug);
      const matchedProjects = projectKeys.filter((project) => {
        if (roundProjectId && project.objectId === roundProjectId) return true;
        if (linkedProjectIds.includes(project.objectId)) return true;
        if (slug && project.slugs.has(slug)) return true;

        return Boolean(
          !hasStrongRoundIdentity &&
          symbol &&
          symbolCounts.get(symbol) === 1 &&
          project.symbols.has(symbol),
        );
      });

      for (const match of matchedProjects) {
        if (!match.id) continue;
        const current = result.get(match.id) || [];
        current.push(round);
        result.set(match.id, current);
      }
    }

    return result;
  }

  private resolveInvestmentEntry(
    project: ProjectLike,
    fundingRounds: any[] = [],
  ): { price: number | null; roundName: string | null; source: string | null } {
    const marketData = project.rawIcoData?.marketData || {};
    const normalizedRounds = this.normalizeInvestmentRounds([
      ...(project.fundraising || []),
      ...(project.fundsRounds || []),
      ...(project.saleRounds || []),
      ...(project.rawIcoData?.saleRounds || []),
      ...(project.rawIcoData?.fundraising?.rounds || []),
      ...fundingRounds,
    ]);
    const entryRound = this.selectEntryRound(normalizedRounds);
    const currentPrice = this.firstPositiveNumber(project.currentPrice, project.price, project.usdQuote?.price);
    const explicitPrice = this.firstPositiveNumber(
      project.entryPrice,
      this.valueByCurrency(project.icoPrice),
      this.valueByCurrency(marketData.icoPrice),
      project.rawIcoData?.icoPrice,
    );
    const price = this.firstPositiveNumber(
      explicitPrice,
      entryRound?.price,
      this.safeEntryPrice(project.rawIcoData?.tokenomics?.tokenPrice, currentPrice),
      this.safeEntryPrice(project.tokenomics?.tokenPrice, currentPrice),
      this.safeEntryPrice(project.tokenMetrics?.tokenPrice, currentPrice),
    );

    if (!price) {
      return { price: null, roundName: null, source: null };
    }

    if (explicitPrice !== null) {
      return {
        price,
        roundName: entryRound?.name || "ICO",
        source: entryRound?.name ? "ico_price_with_round" : "ico_price",
      };
    }

    return {
      price,
      roundName: entryRound?.name || null,
      source: "funding_round",
    };
  }

  private normalizeInvestmentRounds(rounds: any[]): any[] {
    return (Array.isArray(rounds) ? rounds : [])
      .map((round, index) => {
        if (!round || typeof round !== "object") return null;
        const raw = round.raw || {};
        const infoBlocks = raw.infoBlocks || {};
        const price = this.firstPositiveNumber(
          round.price,
          round.tokenPrice,
          infoBlocks.Price?.money,
          infoBlocks.Price?.text,
        );

        if (price === null) return null;

        return {
          name: this.firstString(round.name, round.roundName, round.stage, round.type),
          date: round.date || round.startDate || round.endDate || round.rawDate || round.date?.date?.normalized || round.date?.raw,
          price,
          originalOrder: index,
        };
      })
      .filter(Boolean);
  }

  private selectEntryRound(rounds: any[]): any | null {
    const pricedRounds = (Array.isArray(rounds) ? rounds : [])
      .filter((round) => this.firstPositiveNumber(round?.price) !== null)
      .map((round, index) => ({
        ...round,
        originalOrder: round.originalOrder ?? index,
        timestamp: this.dateTime(round?.date),
      }));

    if (!pricedRounds.length) return null;

    return pricedRounds.sort((left, right) => {
      if (left.timestamp && right.timestamp) return left.timestamp - right.timestamp;
      if (left.timestamp) return -1;
      if (right.timestamp) return 1;
      return left.originalOrder - right.originalOrder;
    })[0];
  }

  private async findSnapshots(targets: Array<{ id: string | null; slug: string }>, rangeConfig: RangeConfig): Promise<any[]> {
    const projectIds = targets
      .map((target) => target.id)
      .filter((id) => Types.ObjectId.isValid(String(id)))
      .map((id) => new Types.ObjectId(String(id)));
    const slugs = this.uniqueStrings(targets.map((target) => target.slug));
    const or: any[] = [];

    if (projectIds.length) or.push({ projectId: { $in: projectIds } });
    if (slugs.length) or.push({ slug: { $in: slugs } });
    if (!or.length) return [];

    const timestamp: any = { $lte: rangeConfig.end };
    if (rangeConfig.start) timestamp.$gte = rangeConfig.start;

    const baseQuery = { $and: [{ $or: or }, { timestamp }] };
    const primaryQuery = {
      $and: [
        ...baseQuery.$and,
        this.snapshotGranularityFilter(rangeConfig.range),
      ],
    };
    const limit = this.snapshotReadLimit(targets.length);
    const rows = await this.querySnapshots(primaryQuery, limit);

    if (rows.length || rangeConfig.range === "30D") return rows;

    return this.querySnapshots(baseQuery, limit);
  }

  private async querySnapshots(query: any, limit: number): Promise<any[]> {
    return this.snapshotModel
      .find(
        query,
        {
          projectId: 1,
          slug: 1,
          timestamp: 1,
          price: 1,
          marketCap: 1,
          fdv: 1,
          volume24h: 1,
          roiFromIco: 1,
          roiFromListing: 1,
          industryAverageMarketCap: 1,
          industryAverageFDV: 1,
          industryAverageROI: 1,
          industryMedianROI: 1,
          industryTopQuartileROI: 1,
          dataQuality: 1,
        },
      )
      .sort({ timestamp: 1 })
      .limit(limit)
      .lean();
  }

  private snapshotGranularitiesForRange(range: HistoryRange): SnapshotGranularity[] {
    if (range === "30D" || range === "90D") return ["hourly", "daily"];
    if (range === "6M" || range === "YTD") return ["daily", "weekly", "monthly"];
    return ["daily", "weekly", "monthly"];
  }

  private snapshotGranularityFilter(range: HistoryRange): any {
    const bucketGranularity = { $in: this.snapshotGranularitiesForRange(range) };

    if (range === "30D" || range === "90D") {
      return {
        $or: [
          { bucketGranularity },
          { bucketGranularity: { $exists: false } },
        ],
      };
    }

    return { bucketGranularity };
  }

  private snapshotReadLimit(targetCount: number): number {
    return Math.min(
      Math.max(targetCount, 1) * MAX_SNAPSHOT_ROWS_PER_PROJECT,
      MAX_TOTAL_SNAPSHOT_ROWS,
    );
  }

  private historicalMarketSnapshots(snapshots: any[]): any[] {
    return (Array.isArray(snapshots) ? snapshots : []).filter((snapshot) => {
      const sources = this.snapshotSources(snapshot);
      if (!sources.length) return false;

      return sources.some((source) => !["project", "project_intel", "funding_rounds"].includes(source));
    });
  }

  private snapshotSources(snapshot: any): string[] {
    const sources = snapshot?.dataQuality?.sources;
    const values = this.flattenArray(Array.isArray(sources) ? sources : []);

    return this.uniqueStrings(values.map((source) => String(source || "")));
  }

  private flattenArray(values: any[]): any[] {
    return values.reduce((result: any[], value) => {
      if (Array.isArray(value)) {
        result.push(...this.flattenArray(value));
      } else {
        result.push(value);
      }

      return result;
    }, []);
  }

  private targetKey(target: { id: string | null; slug: string; name?: string }): string {
    return String(target.id || target.slug || target.name || "").toLowerCase();
  }

  private groupSnapshotsByTarget(
    snapshots: any[],
    targets: Array<{ id: string | null; slug: string; name?: string }>,
  ): Map<string, any[]> {
    const result = new Map<string, any[]>();

    for (const target of targets) {
      const targetId = String(target.id || "");
      const targetSlug = String(target.slug || "").toLowerCase();
      const rows = snapshots.filter((snapshot) => {
        const snapshotProjectId = String(snapshot.projectId || "");
        const snapshotSlug = String(snapshot.slug || "").toLowerCase();

        return (targetId && snapshotProjectId === targetId) || (targetSlug && snapshotSlug === targetSlug);
      });

      if (rows.length) result.set(this.targetKey(target), rows);
    }

    return result;
  }

  private snapshotsToSeries(
    snapshots: any[],
    rangeConfig: RangeConfig,
    investmentEntry: { price: number | null; roundName: string | null; source: string | null },
  ): HistoryPoint[] {
    const points = snapshots.map((snapshot) => {
      const timestamp = this.dateTime(snapshot.timestamp);
      const price = this.toNumber(snapshot.price);
      const roiMultiplierFromPrice = this.roiMultiplierFromPrices(price, investmentEntry.price);
      const roiFromIco = this.firstNumber(
        this.roiPercentFromMultiplier(roiMultiplierFromPrice),
        this.toNumber(snapshot.roiFromIco),
      );

      return {
        timestamp,
        date: new Date(timestamp).toISOString(),
        price,
        investmentPrice: investmentEntry.price,
        roundName: investmentEntry.roundName,
        marketCap: this.toNumber(snapshot.marketCap),
        fdv: this.toNumber(snapshot.fdv),
        volume24h: this.toNumber(snapshot.volume24h),
        roiFromIco,
        roiFromListing: this.toNumber(snapshot.roiFromListing),
        roiMultiplier: roiMultiplierFromPrice ?? this.roiMultiplier(roiFromIco),
        roiSource: investmentEntry.source,
        industryAverageMarketCap: this.toNumber(snapshot.industryAverageMarketCap),
        industryAverageFDV: this.toNumber(snapshot.industryAverageFDV),
        industryAverageROI: this.toNumber(snapshot.industryAverageROI),
        industryMedianROI: this.toNumber(snapshot.industryMedianROI),
        industryTopQuartileROI: this.toNumber(snapshot.industryTopQuartileROI),
        source: "project_comparison_snapshots",
      };
    });

    return this.downsample(points, rangeConfig);
  }

  private async buildAnalyticsChartSeries(
    project: ProjectLike,
    rangeConfig: RangeConfig,
    investmentEntry: { price: number | null; roundName: string | null; source: string | null },
    preloadedDirectPoints: any[] | null = null,
  ): Promise<HistoryPoint[]> {
    const chartPoints = await this.findChartPoints(project, rangeConfig, preloadedDirectPoints);
    if (chartPoints.length) {
      return this.downsample(
        chartPoints.map((point) => this.rawPointToHistoryPoint(point, project, point.source || "chart", investmentEntry)),
        rangeConfig,
      );
    }

    return [];
  }

  private buildProjectHistorySeries(
    project: ProjectLike,
    rangeConfig: RangeConfig,
    investmentEntry: { price: number | null; roundName: string | null; source: string | null },
  ): HistoryPoint[] {
    const projectHistory = Array.isArray(project.history) ? project.history : [];
    if (projectHistory.length) {
      return this.downsample(
        projectHistory.map((point) => this.rawPointToHistoryPoint(point, project, "project-history", investmentEntry)),
        rangeConfig,
      );
    }

    return this.ensureNonEmptySeries([]);
  }

  private async findDirectChartPointsForProjects(projects: ProjectLike[], rangeConfig: RangeConfig): Promise<Map<string, any[]>> {
    const projectIds = this.uniqueStrings(projects.map((project) => String(project?._id || project?.id || "")))
      .filter((id) => Types.ObjectId.isValid(id));
    const result = new Map<string, any[]>();
    if (!projectIds.length) return result;

    const bucketTimestamp: any = { $type: "date", $lte: rangeConfig.end };
    if (rangeConfig.start) bucketTimestamp.$gte = rangeConfig.start;
    const bucketStart = rangeConfig.start || new Date(0);
    const bucketMs = this.directHistoryBucketMs(rangeConfig, bucketStart);
    const rowsByProject = await this.projectChartHistoryModel.aggregate([
      {
        $match: {
          projectId: { $in: projectIds.map((id) => new Types.ObjectId(id)) },
          bucketTimestamp,
        },
      },
      {
        $project: {
          projectId: 1,
          timestamp: 1,
          bucketTimestamp: 1,
          price: 1,
          marketCap: 1,
          volume24h: 1,
          source: 1,
          bucketIndex: {
            $floor: {
              $divide: [
                { $subtract: ["$bucketTimestamp", bucketStart] },
                bucketMs,
              ],
            },
          },
        },
      },
      { $sort: { projectId: 1, bucketIndex: 1, bucketTimestamp: -1 } },
      {
        $group: {
          _id: { projectId: "$projectId", bucketIndex: "$bucketIndex" },
          point: { $first: "$$ROOT" },
        },
      },
      { $sort: { "point.projectId": 1, "point.bucketTimestamp": 1 } },
      {
        $group: {
          _id: "$point.projectId",
          points: { $push: "$point" },
        },
      },
      {
        $project: {
          _id: 1,
          points: { $slice: ["$points", -this.directHistoryBucketLimit(rangeConfig)] },
        },
      },
    ]).exec();

    for (const group of rowsByProject) {
      const key = String(group?._id || "");
      if (!key) continue;
      const points = Array.isArray(group?.points) ? group.points : [];
      result.set(
        key,
        points.map((row: any) => ({
          timestamp: row.bucketTimestamp || row.timestamp,
          price: row.price,
          marketCap: row.marketCap,
          volume24h: row.volume24h,
          source: row.source || "project-chart-history",
        })),
      );
    }

    return result;
  }

  private directHistoryBucketMs(rangeConfig: RangeConfig, bucketStart: Date): number {
    const minimumBucketMs = Math.max(1, Math.floor(rangeConfig.bucketMs || 1));
    const maxPoints = Math.max(1, rangeConfig.maxPoints || 10);
    const spanMs = Math.max(minimumBucketMs, rangeConfig.end.getTime() - bucketStart.getTime());

    return Math.max(minimumBucketMs, Math.ceil(spanMs / maxPoints));
  }

  private directHistoryBucketLimit(rangeConfig: RangeConfig): number {
    return Math.max((rangeConfig.maxPoints || 10) * 2, rangeConfig.maxPoints || 10);
  }

  private async findLinkedChartPointsForProjects(
    projects: ProjectLike[],
    directChartPointsByProjectId: Map<string, any[]>,
    rangeConfig: RangeConfig,
  ): Promise<Map<string, any[]>> {
    const result = new Map<string, any[]>();
    const missingProjects = projects.filter((project) => {
      const projectId = String(project?._id || project?.id || "");
      return projectId && (directChartPointsByProjectId.get(projectId)?.length || 0) < (rangeConfig.maxPoints || 10);
    });
    if (!missingProjects.length) return result;

    const slugs = this.uniqueStrings(
      missingProjects.flatMap((project) => this.projectSlugKeys(project)),
    );
    if (!slugs.length) return result;

    const marketProjects = await this.projectModel
      .find(
        {
          projectType: "market",
          projectStatus: "active",
          $or: [
            { slug: { $in: slugs } },
            { sourceId: { $in: slugs } },
            { "rawIcoData.slug": { $in: slugs } },
          ],
        },
        {
          _id: 1,
          slug: 1,
          sourceId: 1,
          rank: 1,
          marketCap: 1,
          "rawIcoData.slug": 1,
        },
      )
      .sort({ rank: 1, marketCap: -1 })
      .limit(Math.max(missingProjects.length * 3, 3))
      .lean();
    if (!marketProjects.length) return result;

    const charts = await this.chartModel
      .find(
        {
          entityId: { $in: marketProjects.map((marketProject) => marketProject._id) },
          entityType: "project",
        },
        {
          ...this.chartProjectionForRange(rangeConfig.range),
          entityId: 1,
        },
      )
      .lean();
    const chartByEntityId = new Map<string, ProjectLike>(
      charts.map((chart): [string, ProjectLike] => [String(chart.entityId), chart as ProjectLike]),
    );
    const marketProjectsWithCharts = marketProjects.filter((marketProject) => {
      const chart = chartByEntityId.get(String(marketProject._id));
      return chart && this.chartFieldsForRange(rangeConfig.range).some((field) => Array.isArray(chart[field]) && chart[field].length);
    });

    for (const project of missingProjects) {
      const projectId = String(project?._id || project?.id || "");
      const projectSlugs = new Set(this.projectSlugKeys(project));
      const marketProject = marketProjectsWithCharts.find((candidate) =>
        this.projectSlugKeys(candidate).some((slug) => projectSlugs.has(slug)),
      );
      if (!projectId || !marketProject) continue;

      const chart = chartByEntityId.get(String(marketProject._id));
      if (!chart) continue;

      const chartPointArrays: any[][] = [];
      this.addChartCachePointArrays(
        chartPointArrays,
        chart,
        rangeConfig,
        `chart-linked:slug:${marketProject.slug || marketProject.sourceId || this.projectSlugKeys(project)[0] || ""}`,
      );
      result.set(projectId, chartPointArrays.flat());
    }

    return result;
  }

  private projectSlugKeys(project: ProjectLike): string[] {
    return this.uniqueStrings([
      project?.slug,
      project?.sourceId,
      project?.rawIcoData?.slug,
      project?.rawIcoData?.sourceId,
    ]).map((slug) => normalizeSlug(slug)).filter(Boolean);
  }

  private async findChartPoints(project: ProjectLike, rangeConfig: RangeConfig, preloadedDirectPoints: any[] | null = null): Promise<any[]> {
    const projectId = String(project?._id || "");
    const projectObjectId = Types.ObjectId.isValid(projectId) ? new Types.ObjectId(projectId) : null;
    const startTime = rangeConfig.start?.getTime() || 0;
    const endTime = rangeConfig.end.getTime();
    const chartPointArrays: any[][] = [];
    const directPoints: any[] = Array.isArray(preloadedDirectPoints) ? [...preloadedDirectPoints] : [];

    if (projectObjectId && !Array.isArray(preloadedDirectPoints)) {
      const bucketQuery: any = {
        projectId: projectObjectId,
        bucketTimestamp: { $type: "date", $lte: rangeConfig.end },
      };
      if (rangeConfig.start) bucketQuery.bucketTimestamp.$gte = rangeConfig.start;

      const bucketRows = await this.projectChartHistoryModel
        .find(
          bucketQuery,
          {
            timestamp: 1,
            bucketTimestamp: 1,
            price: 1,
            marketCap: 1,
            volume24h: 1,
            source: 1,
            _id: 0,
          },
        )
        .sort({ bucketTimestamp: -1 })
        .limit(MAX_CHART_HISTORY_ROWS_PER_PROJECT)
        .lean();
      directPoints.push(
        ...bucketRows
          .reverse()
          .map((point) => ({
            timestamp: point.bucketTimestamp || point.timestamp,
            price: point.price,
            marketCap: point.marketCap,
            volume24h: point.volume24h,
            source: point.source || "project-chart-history",
          })),
      );
    }

    if (projectObjectId) {
      const shouldLoadFallbackCharts = directPoints.length < (rangeConfig.maxPoints || 10);

      if (shouldLoadFallbackCharts) {
        const legacyProjectChartHistory = await this.projectChartHistoryModel
          .find(
            { projectId: projectObjectId, data: { $exists: true, $ne: [] } },
            { data: 1, timeframe: 1, source: 1, _id: 0 },
          )
          .sort({ updatedAt: -1 })
          .limit(MAX_LEGACY_CHART_HISTORY_DOCUMENTS)
          .lean();
        for (const chartHistory of legacyProjectChartHistory) {
          if (Array.isArray(chartHistory.data)) {
            chartPointArrays.push(
              chartHistory.data.map((point: any) => ({
                ...point,
                source: `project-chart-history:${chartHistory.timeframe || chartHistory.source || "legacy"}`,
              })),
            );
          }
        }

        const chart = await this.chartModel
          .findOne(
            { entityId: projectObjectId, entityType: "project" },
            this.chartProjectionForRange(rangeConfig.range),
          )
          .lean();
        if (chart) {
          this.addChartCachePointArrays(chartPointArrays, chart, rangeConfig, "chart");
        }
      }
    }

    if (!directPoints.length && !chartPointArrays.length) {
      const linkedChart = await this.findLinkedMarketChart(project, rangeConfig);
      if (linkedChart) {
        this.addChartCachePointArrays(
          chartPointArrays,
          linkedChart.chart,
          rangeConfig,
          `chart-linked:${linkedChart.matchedBy}:${linkedChart.slug}`,
        );
      }
    }

    const pointsByTimestamp = new Map<number, any>();

    for (const item of [...directPoints, ...chartPointArrays.flat()]) {
      const timestamp = this.extractTimestamp(item);
      if (!timestamp || timestamp < startTime || timestamp > endTime) continue;
      pointsByTimestamp.set(timestamp, item);
    }

    return Array.from(pointsByTimestamp.entries())
      .sort(([left], [right]) => left - right)
      .map(([, point]) => point);
  }

  private chartFieldsForRange(range: HistoryRange): string[] {
    if (range === "30D") return ["chart30d", "chart7d", "chartAll"];
    if (range === "90D") return ["chart90d", "chart30d", "chartAll"];
    if (range === "6M" || range === "YTD") return ["chart1y", "chart90d", "chartAll"];
    return ["chartAll", "chart1y", "chart90d", "chart30d", "chart7d"];
  }

  private chartProjectionForRange(range: HistoryRange): Record<string, any> {
    const projection: Record<string, any> = { _id: 0 };
    const sliceLimit = this.chartArraySliceLimit(range);

    for (const field of this.chartFieldsForRange(range)) {
      projection[field] = field === "chartAll" && sliceLimit
        ? { $slice: -sliceLimit }
        : 1;
    }

    return projection;
  }

  private chartArraySliceLimit(range: HistoryRange): number | null {
    if (range === "30D") return 1_000;
    if (range === "90D") return 2_500;
    if (range === "6M" || range === "YTD") return 5_000;
    return null;
  }

  private addChartCachePointArrays(
    chartPointArrays: any[][],
    chart: ProjectLike,
    rangeConfig: RangeConfig,
    sourcePrefix: string,
  ): void {
    let usablePoints = this.countUsableRawPoints(chartPointArrays.flat(), rangeConfig);

    for (const field of this.chartFieldsForRange(rangeConfig.range)) {
      if (Array.isArray(chart[field])) {
        const fieldPoints = chart[field].map((point: any) => ({
          ...point,
          source: `${sourcePrefix}:${field}`,
        }));
        chartPointArrays.push(fieldPoints);
        usablePoints += this.countUsableRawPoints(fieldPoints, rangeConfig);

        if (rangeConfig.maxPoints && usablePoints >= rangeConfig.maxPoints) break;
      }
    }
  }

  private countUsableRawPoints(points: any[], rangeConfig: RangeConfig): number {
    if (!Array.isArray(points) || !points.length) return 0;

    const startTime = rangeConfig.start?.getTime() || 0;
    const endTime = rangeConfig.end.getTime();

    return points.reduce((count, point) => {
      const timestamp = this.extractTimestamp(point);
      return timestamp && timestamp >= startTime && timestamp <= endTime ? count + 1 : count;
    }, 0);
  }

  private async findLinkedMarketChart(
    project: ProjectLike,
    rangeConfig: RangeConfig,
  ): Promise<{ chart: ProjectLike; matchedBy: string; slug: string } | null> {
    const slugs = this.uniqueStrings([
      project.slug,
      project.sourceId,
      project.rawIcoData?.slug,
      project.rawIcoData?.sourceId,
    ]).map((slug) => normalizeSlug(slug)).filter(Boolean);
    if (!slugs.length) return null;

    const branches = [
      { matchedBy: "slug", query: { slug: { $in: slugs } } },
      { matchedBy: "sourceId", query: { sourceId: { $in: slugs } } },
      { matchedBy: "rawIcoData.slug", query: { "rawIcoData.slug": { $in: slugs } } },
    ];

    for (const branch of branches) {
      const linkedChart = await this.findLinkedMarketChartForBranch(branch.query, branch.matchedBy, slugs, rangeConfig);
      if (linkedChart) return linkedChart;
    }

    return null;
  }

  private async findLinkedMarketChartForBranch(
    branchQuery: any,
    matchedBy: string,
    slugs: string[],
    rangeConfig: RangeConfig,
  ): Promise<{ chart: ProjectLike; matchedBy: string; slug: string } | null> {
    const marketProjects = await this.projectModel
      .find(
        {
          projectType: "market",
          projectStatus: "active",
          ...branchQuery,
        },
        {
          _id: 1,
          slug: 1,
          sourceId: 1,
          rank: 1,
          marketCap: 1,
        },
      )
      .sort({ rank: 1, marketCap: -1 })
      .limit(3)
      .lean();
    if (!marketProjects.length) return null;

    const chartFields = this.chartFieldsForRange(rangeConfig.range);
    const projection = {
      ...this.chartProjectionForRange(rangeConfig.range),
      entityId: 1,
    };
    const charts = await this.chartModel
      .find(
        {
          entityId: { $in: marketProjects.map((marketProject) => marketProject._id) },
          entityType: "project",
        },
        projection,
      )
      .lean();
    const chartByEntityId = new Map<string, ProjectLike>(
      charts.map((chart): [string, ProjectLike] => [String(chart.entityId), chart as ProjectLike]),
    );

    for (const marketProject of marketProjects) {
      const chart = chartByEntityId.get(String(marketProject._id));
      if (!chart || !chartFields.some((field) => Array.isArray(chart[field]) && chart[field].length)) continue;

      return {
        chart,
        matchedBy,
        slug: marketProject.slug || marketProject.sourceId || slugs[0],
      };
    }

    return null;
  }

  private rawPointToHistoryPoint(
    raw: any,
    project: ProjectLike,
    source: string,
    investmentEntry: { price: number | null; roundName: string | null; source: string | null },
  ): HistoryPoint {
    const timestamp = this.extractTimestamp(raw) || Date.now();
    const price = this.firstPositiveNumber(
      raw?.price?.USD,
      raw?.price?.usd,
      raw?.price,
      raw?.close,
      raw?.value,
      raw?.quote?.USD?.close,
    );
    const circulatingSupply = this.firstPositiveNumber(
      raw?.circulatingSupply,
      project.circulatingSupply,
      project.tokenomics?.circulatingSupply,
      project.tokenMetrics?.circulatingSupply,
    );
    const totalSupply = this.firstPositiveNumber(
      raw?.totalSupply,
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
    const explicitRoiPercent = this.firstNumber(
      raw?.roiFromIco,
      raw?.roiPercent,
    );
    const explicitRoiMultiplier = this.firstPositiveNumber(
      raw?.roiMultiplier,
      raw?.roiX,
    );
    const roiMultiplierFromPrice = this.roiMultiplierFromPrices(price, investmentEntry.price);
    const roiFromIco = this.firstNumber(
      this.roiPercentFromMultiplier(roiMultiplierFromPrice),
      this.roiPercentFromMultiplier(explicitRoiMultiplier),
      explicitRoiPercent,
    );

    return {
      timestamp,
      date: new Date(timestamp).toISOString(),
      price,
      investmentPrice: investmentEntry.price,
      roundName: investmentEntry.roundName,
      marketCap,
      fdv,
      volume24h: this.firstPositiveNumber(raw?.volume24h, raw?.volume_24h, raw?.volume),
      roiFromIco,
      roiFromListing: this.firstNumber(raw?.roiFromListing),
      roiMultiplier: roiMultiplierFromPrice ?? this.roiMultiplier(roiFromIco),
      roiSource: investmentEntry.source,
      source,
    };
  }

  private ensureNonEmptySeries(series: HistoryPoint[]): HistoryPoint[] {
    const filtered = series
      .filter((point) => point.timestamp && Number.isFinite(point.timestamp))
      .sort((left, right) => left.timestamp - right.timestamp);

    return filtered;
  }

  private async buildCategoryIndustryAverages(project: ProjectLike): Promise<IndustryMetricAverages | null> {
    const categoryKeys = this.industryCategoryKeys(project).slice(0, MAX_INDUSTRY_CATEGORY_KEYS);
    if (!categoryKeys.length) return null;

    const categorySlugs = this.uniqueStrings(categoryKeys.map((key) => normalizeSlug(key))).filter(Boolean);
    const categoryOr: any[] = [
      { categories: { $in: categoryKeys } },
      { tags: { $in: categoryKeys } },
      { "rawIcoData.categories": { $in: categoryKeys } },
      { mainCategory: { $in: categoryKeys } },
      { "mainCategory.name": { $in: categoryKeys } },
    ];

    if (categorySlugs.length) {
      categoryOr.push({ "mainCategory.slug": { $in: categorySlugs } });
    }

    const projectId = project?._id && Types.ObjectId.isValid(String(project._id))
      ? new Types.ObjectId(String(project._id))
      : null;
    const excludedIdentityKeys = this.projectIdentityKeys(project);
    const match: any = {
      projectType: { $in: ["project", "market"] },
      projectStatus: "active",
      isSandbox: { $ne: true },
      isDuplicate: { $ne: true },
      $or: categoryOr,
    };

    if (projectId) {
      match._id = { $ne: projectId };
    }

    const [row = null] = await this.projectModel
      .aggregate([
        { $match: match },
        {
          $project: {
            identityKey: this.projectIdentityAggregationExpression(),
            projectType: 1,
            marketCapValue: this.numericAggregationExpression([
              "$marketCap",
              "$usdQuote.market_cap",
              "$rawIcoData.marketData.marketCap",
            ]),
            fdvValue: this.numericAggregationExpression([
              "$fullyDilutedMarketCap",
              "$fdv",
              "$rawIcoData.marketData.fdv",
              "$rawIcoData.marketData.fullyDilutedMarketCap",
              "$tokenomics.fdv",
            ]),
          },
        },
        ...(excludedIdentityKeys.length
          ? [{ $match: { identityKey: { $nin: excludedIdentityKeys } } }]
          : []),
        {
          $group: {
            _id: "$identityKey",
            sourceDocumentCount: { $sum: 1 },
            marketProjectMarketCapValue: {
              $max: {
                $cond: [{ $eq: ["$projectType", "market"] }, "$marketCapValue", null],
              },
            },
            projectMarketCapValue: {
              $max: {
                $cond: [{ $ne: ["$projectType", "market"] }, "$marketCapValue", null],
              },
            },
            marketProjectFdvValue: {
              $max: {
                $cond: [{ $eq: ["$projectType", "market"] }, "$fdvValue", null],
              },
            },
            projectFdvValue: {
              $max: {
                $cond: [{ $ne: ["$projectType", "market"] }, "$fdvValue", null],
              },
            },
          },
        },
        {
          $project: {
            sourceDocumentCount: 1,
            marketCapValue: {
              $ifNull: ["$marketProjectMarketCapValue", "$projectMarketCapValue"],
            },
            fdvValue: {
              $ifNull: ["$marketProjectFdvValue", "$projectFdvValue"],
            },
          },
        },
        {
          $group: {
            _id: null,
            projectCount: { $sum: 1 },
            sourceDocumentCount: { $sum: "$sourceDocumentCount" },
            marketCapCount: {
              $sum: { $cond: [{ $ne: ["$marketCapValue", null] }, 1, 0] },
            },
            fdvCount: {
              $sum: { $cond: [{ $ne: ["$fdvValue", null] }, 1, 0] },
            },
            averageMarketCap: { $avg: "$marketCapValue" },
            averageFDV: { $avg: "$fdvValue" },
          },
        },
      ])
      .exec();

    if (!row) return null;

    return {
      marketCap: this.toNumber(row.averageMarketCap),
      fdv: this.toNumber(row.averageFDV),
      projectCount: Math.max(0, Math.floor(this.toNumber(row.projectCount) || 0)),
      sourceDocumentCount: Math.max(0, Math.floor(this.toNumber(row.sourceDocumentCount) || 0)),
      marketCapCount: Math.max(0, Math.floor(this.toNumber(row.marketCapCount) || 0)),
      fdvCount: Math.max(0, Math.floor(this.toNumber(row.fdvCount) || 0)),
      categoryKeys,
    };
  }

  private projectIdentityAggregationExpression(): any {
    return [
      this.identityCandidateExpression("coingecko", "$coingeckoId"),
      this.identityCandidateExpression("coingecko", "$rawIcoData.coingeckoId"),
      this.identityCandidateExpression("coinmarketcap", "$coinMarketCapId"),
      this.identityCandidateExpression("coinmarketcap", "$rawIcoData.coinMarketCapId"),
      this.identityCandidateExpression("dropstab", "$dropstabId"),
      this.identityCandidateExpression("dropstab", "$rawIcoData.dropstabId"),
      this.identityCandidateExpression("dropstab", "$rawIcoData.dropstabSlug"),
      this.identityCandidateExpression("cryptorank", "$cryptorankId"),
      this.identityCandidateExpression("cryptorank", "$rawIcoData.cryptorankId"),
      this.identityCandidateExpression("icodrops", "$icodropsId"),
      this.identityCandidateExpression("icodrops", "$rawIcoData.icodropsId"),
      this.identityCandidateExpression("source", "$sourceId"),
      this.identityCandidateExpression("source", "$rawIcoData.sourceId"),
      this.identityCandidateExpression("slug", "$slug"),
      this.identityCandidateExpression("slug", "$rawIcoData.slug"),
      this.identityCandidateExpression("name", "$normalizedName"),
      this.identityCandidateExpression("name", "$name"),
    ].reduceRight(
      (fallback: any, candidate: any) => ({ $ifNull: [candidate, fallback] }),
      { $concat: ["mongo:", { $toString: "$_id" }] },
    );
  }

  private identityCandidateExpression(prefix: string, path: string): any {
    return {
      $let: {
        vars: {
          value: {
            $let: {
              vars: {
                rawValue: {
                  $trim: {
                    input: {
                      $convert: {
                        input: path,
                        to: "string",
                        onError: "",
                        onNull: "",
                      },
                    },
                  },
                },
              },
              in: {
                $cond: [
                  { $eq: ["$$rawValue", ""] },
                  null,
                  { $toLower: "$$rawValue" },
                ],
              },
            },
          },
        },
        in: {
          $cond: [
            { $eq: ["$$value", null] },
            null,
            { $concat: [`${prefix}:`, "$$value"] },
          ],
        },
      },
    };
  }

  private projectIdentityKeys(project: ProjectLike): string[] {
    return this.uniqueStrings([
      this.projectIdentityKey("coingecko", project.coingeckoId),
      this.projectIdentityKey("coingecko", project.rawIcoData?.coingeckoId),
      this.projectIdentityKey("coinmarketcap", project.coinMarketCapId),
      this.projectIdentityKey("coinmarketcap", project.rawIcoData?.coinMarketCapId),
      this.projectIdentityKey("dropstab", project.dropstabId),
      this.projectIdentityKey("dropstab", project.rawIcoData?.dropstabId),
      this.projectIdentityKey("dropstab", project.rawIcoData?.dropstabSlug),
      this.projectIdentityKey("cryptorank", project.cryptorankId),
      this.projectIdentityKey("cryptorank", project.rawIcoData?.cryptorankId),
      this.projectIdentityKey("icodrops", project.icodropsId),
      this.projectIdentityKey("icodrops", project.rawIcoData?.icodropsId),
      this.projectIdentityKey("source", project.sourceId),
      this.projectIdentityKey("source", project.rawIcoData?.sourceId),
      this.projectIdentityKey("slug", project.slug),
      this.projectIdentityKey("slug", project.rawIcoData?.slug),
      this.projectIdentityKey("name", project.normalizedName),
      this.projectIdentityKey("name", project.name),
    ]);
  }

  private projectIdentityKey(prefix: string, value: any): string | null {
    const normalized = String(value ?? "").trim().toLowerCase();
    return normalized ? `${prefix}:${normalized}` : null;
  }

  private numericAggregationExpression(paths: string[]): any {
    return {
      $convert: {
        input: paths.reduceRight(
          (fallback: any, path) => ({
            $ifNull: [path, fallback],
          }),
          null,
        ),
        to: "double",
        onError: null,
        onNull: null,
      },
    };
  }

  private industryCategoryKeys(project: ProjectLike): string[] {
    const mainCategoryKeys = this.uniqueStrings([
      ...(typeof project.mainCategory === "string" ? [project.mainCategory] : []),
      project.mainCategory?.name,
      project.mainCategory?.slug,
    ]);
    if (mainCategoryKeys.length) return mainCategoryKeys;

    const categoryKeys = this.uniqueStrings([
      ...this.arrayValue(project.categories),
      ...this.arrayValue(project.rawIcoData?.categories),
    ]);
    if (categoryKeys.length) return categoryKeys;

    return this.uniqueStrings([
      ...this.arrayValue(project.tags),
      ...this.arrayValue(project.rawIcoData?.tags),
    ]);
  }

  private arrayValue(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null || value === "") return [];
    return [value];
  }

  private buildIndustryAverageHistory(
    currentSeries: HistoryPoint[],
    categoryIndustryAverages: IndustryMetricAverages | null = null,
  ): any[] {
    if (!currentSeries.length) return [];

    return currentSeries.map((point) => ({
      timestamp: point.timestamp,
      date: point.date,
      marketCap: categoryIndustryAverages?.marketCap ?? point.industryAverageMarketCap ?? null,
      fdv: categoryIndustryAverages?.fdv ?? point.industryAverageFDV ?? null,
      roi: point.industryAverageROI ?? null,
      medianRoi: point.industryMedianROI ?? null,
      topQuartileRoi: point.industryTopQuartileROI ?? null,
    }));
  }

  private closestPoint(series: HistoryPoint[], timestamp: number): HistoryPoint | null {
    if (!series.length) return null;

    return series.reduce((closest, point) => {
      return Math.abs(point.timestamp - timestamp) < Math.abs(closest.timestamp - timestamp) ? point : closest;
    }, series[0]);
  }

  private downsample(points: HistoryPoint[], rangeConfig: RangeConfig): HistoryPoint[] {
    const startTime = rangeConfig.start?.getTime() || (points[0]?.timestamp ?? 0);
    const endTime = rangeConfig.end.getTime();
    const buckets = new Map<number, HistoryPoint>();

    for (const point of points) {
      if (!point.timestamp || point.timestamp < startTime || point.timestamp > endTime) continue;
      const bucketIndex = Math.floor((point.timestamp - startTime) / rangeConfig.bucketMs);
      const existing = buckets.get(bucketIndex);
      if (!existing || existing.timestamp < point.timestamp) {
        buckets.set(bucketIndex, point);
      }
    }

    return this.limitHistoryPoints(
      Array.from(buckets.values()).sort((left, right) => left.timestamp - right.timestamp),
      rangeConfig.maxPoints,
    );
  }

  private limitHistoryPoints(points: HistoryPoint[], maxPoints: number | null): HistoryPoint[] {
    if (!maxPoints || points.length <= maxPoints) return points;
    if (maxPoints <= 1) return points.slice(-1);

    const selected = new Map<number, HistoryPoint>();
    const lastIndex = points.length - 1;

    for (let index = 0; index < maxPoints; index += 1) {
      const sourceIndex = Math.round((index * lastIndex) / (maxPoints - 1));
      selected.set(sourceIndex, points[sourceIndex]);
    }

    return Array.from(selected.entries())
      .sort(([left], [right]) => left - right)
      .map(([, point]) => point);
  }

  private buildRangeConfig(range: HistoryRange, project: ProjectLike): RangeConfig {
    const end = new Date();
    const day = 24 * 60 * 60 * 1000;
    let start: Date | null = null;
    let bucketMs = day;
    const maxPoints = 10;

    if (range === "30D") {
      start = new Date(end.getTime() - 30 * day);
      bucketMs = day;
    } else if (range === "90D") {
      start = new Date(end.getTime() - 90 * day);
      bucketMs = 3 * day;
    } else if (range === "6M") {
      start = new Date(end.getTime() - 183 * day);
      bucketMs = 7 * day;
    } else if (range === "YTD") {
      start = new Date(Date.UTC(end.getUTCFullYear(), 0, 1));
      bucketMs = 14 * day;
    } else {
      start = this.projectIcoStartDate(project);
      bucketMs = 30 * day;
    }

    return { range, start, end, bucketMs, maxPoints };
  }

  private projectIcoStartDate(project: ProjectLike): Date | null {
    return this.earliestDate(
      project.rawIcoData?.dates?.startDate?.normalized,
      project.rawIcoData?.dates?.startDate,
      project.rawIcoData?.dates?.ico?.normalized,
      project.rawIcoData?.dates?.ico?.date?.normalized,
      project.rawIcoData?.dates?.ico?.date,
      project.rawIcoData?.dates?.ico,
      project.rawIcoData?.icoDate,
      project.rawIcoData?.marketTokenDetails?.genesis_block_date,
      project.marketTokenDetails?.genesis_block_date,
      ...this.projectRoundDates(project),
      project.rawIcoData?.dates?.ico,
      project.rawIcoData?.dateAdded,
      project.dateAdded,
      project.createdAt,
    );
  }

  private projectRoundDates(project: ProjectLike): any[] {
    const rounds = [
      ...(project.rawIcoData?.dates?.rounds || []),
      ...(project.rawIcoData?.fundraising?.rounds || []),
      ...(project.fundsRounds || []),
      ...(project.fundraising || []),
      ...(project.saleRounds || []),
      ...(project.rawIcoData?.saleRounds || []),
    ];

    return (Array.isArray(rounds) ? rounds : []).flatMap((round) => [
      round?.date?.date?.normalized,
      round?.date?.normalized,
      round?.date,
      round?.startDate?.date?.normalized,
      round?.startDate?.normalized,
      round?.startDate,
      round?.endDate?.date?.normalized,
      round?.endDate?.normalized,
      round?.endDate,
      round?.rawDate,
    ]);
  }

  private normalizeRange(value: any): HistoryRange {
    const normalized = String(value || "30D").trim();
    if (["30D", "90D", "6M", "YTD", "Since ICO"].includes(normalized)) {
      return normalized as HistoryRange;
    }

    return "30D";
  }

  private extractTimestamp(raw: any): number {
    const value = raw?.timestamp ?? raw?.date ?? raw?.time ?? raw?.createdAt;
    if (typeof value === "number") return value < 10_000_000_000 ? value * 1000 : value;
    if (!value) return 0;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date.getTime() : 0;
  }

  private dateTime(value: any): number {
    if (typeof value === "number") return value < 10_000_000_000 ? value * 1000 : value;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date.getTime() : 0;
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

  private safeEntryPrice(value: any, currentPrice: any): number | null {
    const entryPrice = this.toNumber(value);
    if (entryPrice === null || entryPrice <= 0) return null;

    const current = this.toNumber(currentPrice);
    if (current !== null && current > 0) {
      const relativeDifference = Math.abs(entryPrice - current) / current;
      if (relativeDifference < 0.001) return null;
    }

    return entryPrice;
  }

  private roiPercent(current: any, base: any): number | null {
    const currentNumber = this.toNumber(current);
    const baseNumber = this.toNumber(base);
    if (currentNumber === null || baseNumber === null || baseNumber <= 0) return null;
    const result = ((currentNumber - baseNumber) / baseNumber) * 100;
    return Number.isFinite(result) ? result : null;
  }

  private roiPercentFromMultiplier(multiplier: any): number | null {
    const value = this.toNumber(multiplier);
    if (value === null || value <= 0) return null;
    const result = (value - 1) * 100;
    return Number.isFinite(result) ? result : null;
  }

  private roiMultiplierFromPrices(price: any, basePrice: any): number | null {
    const current = this.toNumber(price);
    const base = this.toNumber(basePrice);
    if (current === null || base === null || base <= 0) return null;
    const result = current / base;
    return Number.isFinite(result) && result > 0 ? result : null;
  }

  private roiMultiplier(roiPercent: number | null): number | null {
    if (roiPercent === null || !Number.isFinite(roiPercent)) return null;
    const result = 1 + roiPercent / 100;
    return Number.isFinite(result) ? result : null;
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

  private parseProjectKeys(value: any): string[] {
    const raw = Array.isArray(value) ? value : String(value || "").split(",");

    return this.uniqueStrings(raw.map((item: any) => String(item || "").trim()));
  }

  private async cacheReadOnly<T>(
    key: string,
    ttl: number,
    label: string,
    factory: () => Promise<T>,
  ): Promise<T> {
    const startedAt = Date.now();

    if (!this.cacheService || ttl <= 0) {
      const value = await factory();
      this.logPerf(label, startedAt, false, value);
      return value;
    }

    const cached = await this.cacheService.getJson<T>(key);
    if (cached !== undefined) {
      this.logPerf(label, startedAt, true, cached);
      return cached;
    }

    const existing = this.inFlight.get(key);
    if (existing) {
      const value = (await existing) as T;
      this.logPerf(`${label}:in-flight`, startedAt, false, value);
      return value;
    }

    const pending = factory()
      .then(async (value) => {
        await this.cacheService?.setJson(key, value, ttl);
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, pending);
    const value = await pending;
    this.logPerf(label, startedAt, false, value);
    return value;
  }

  private scheduleWarm(key: string, job: () => Promise<any>): void {
    const now = Date.now();
    const lastStartedAt = this.warmLastStartedAt.get(key) || 0;
    if (this.warmInFlight.has(key)) return;
    if (this.warmInFlight.size >= this.maxWarmJobs) return;
    if (now - lastStartedAt < this.warmCooldownMs) return;

    this.warmLastStartedAt.set(key, now);
    this.warmInFlight.add(key);

    void job()
      .catch((error) => {
        if (this.perfLogs) {
          this.logger.debug(`comparison history prewarm skipped ${key}: ${error?.message || error}`);
        }
      })
      .finally(() => {
        this.warmInFlight.delete(key);
      });
  }

  private logPerf(label: string, startedAt: number, cacheHit: boolean, payload: any): void {
    if (!this.perfLogs) return;

    const durationMs = Date.now() - startedAt;
    const payloadBytes = this.payloadSize(payload);
    this.logger.debug(
      `${label} duration=${durationMs}ms cache=${cacheHit ? "hit" : "miss"} payloadBytes=${payloadBytes}`,
    );
  }

  private logStage(label: string, stage: string, startedAt: number): void {
    if (!this.perfLogs) return;

    this.logger.debug(`${label} stage=${stage} elapsed=${Date.now() - startedAt}ms`);
  }

  private payloadSize(payload: any): number | null {
    try {
      return Buffer.byteLength(JSON.stringify(payload));
    } catch (error) {
      return null;
    }
  }

  private sanitizeResponse(value: any): any {
    if (Array.isArray(value)) return value.map((item) => this.sanitizeResponse(item));
    if (!value || typeof value !== "object") {
      if (typeof value === "number") return this.sanitizeNumber(value);
      return value;
    }

    const result: any = {};
    for (const [key, item] of Object.entries(value)) {
      const sanitized = this.sanitizeResponse(item);
      result[key] = sanitized === undefined ? null : sanitized;
    }

    return result;
  }

  private sanitizeNumber(value: number): number | null {
    if (!Number.isFinite(value)) return null;

    const rounded = Math.round((value + Number.EPSILON) * 1e10) / 1e10;
    return Object.is(rounded, -0) ? 0 : rounded;
  }

  private clampInt(value: any, fallback: number, min: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, Math.trunc(parsed)));
  }

  private isTruthy(value: any, fallback = false): boolean {
    if (value === undefined || value === null || value === "") return fallback;
    return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
  }
}
