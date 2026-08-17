import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Chart, ChartDocument } from "src/analytics/models/chart.model";
import { normalizeSlug, normalizeSymbol } from "./intel-sync/project-identity.util";
import {
  ProjectChartHistory,
  ProjectChartHistoryDocument,
} from "./project-chart-history.model";
import { Project, ProjectDocument } from "./project.model";

type ProjectAuditRow = {
  id: string;
  name?: string;
  slug?: string;
  symbol?: string;
  rank?: number;
  fomoScore?: number;
  marketCap?: number;
  projectChartHistoryPoints: number;
  chartPoints: number;
  analyticsHistoryPoints: number;
  projectHistoryPoints: number;
  ohlcvPoints: number;
  marketSnapshotsPoints: number;
  totalHistoryPoints: number;
  hasProjectChartHistory: boolean;
  hasChart: boolean;
  hasAnalyticsHistory: boolean;
  hasProjectHistory: boolean;
  hasOhlcv: boolean;
  hasMarketSnapshots: boolean;
  hasAnyLocalHistory: boolean;
  analyticsBinding?: AnalyticsHistoryBinding;
};

type AuditOptions = {
  limit?: number;
  offset?: number;
  onlyWithHistory?: boolean;
  sortByHistoryCount?: boolean;
};

type MarketChartCandidate = {
  id: string;
  name?: string;
  slug?: string;
  symbol?: string;
  rank?: number;
  points: number;
  slugKeys: Set<string>;
  symbolKeys: Set<string>;
};

type AnalyticsHistoryBinding = {
  points: number;
  matchedBy: "slug" | "symbol" | "symbol+name";
  matchedKey: string;
  marketProjectId: string;
  marketProjectName?: string;
  marketProjectSlug?: string;
  marketProjectSymbol?: string;
  fields: string[];
};

type AnalyticsHistoryContext = {
  bindings: Map<string, AnalyticsHistoryBinding>;
  collections: any[];
  marketProjectsWithCharts: number;
  totalAnalyticsChartPoints: number;
};

@Injectable()
export class IcoComparisonHistoryAuditService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectChartHistory.name)
    private readonly projectChartHistoryModel: Model<ProjectChartHistoryDocument>,
    @InjectModel(Chart.name) private readonly chartModel: Model<ChartDocument>,
  ) {}

  async audit(input: AuditOptions = {}): Promise<any> {
    const startedAt = Date.now();
    const options = this.normalizeOptions(input);
    const shouldSortAfterCounting = options.sortByHistoryCount;
    const baseRows = await this.getProjectBaseRows(
      shouldSortAfterCounting ? { ...options, limit: 0, offset: 0 } : options,
    );
    const ids = baseRows
      .map((row) => row._id)
      .filter((id) => Types.ObjectId.isValid(String(id)))
      .map((id) => new Types.ObjectId(String(id)));
    const [projectChartHistoryCounts, chartCounts, analyticsContext] = await Promise.all([
      this.getProjectChartHistoryCounts(ids),
      this.getChartCounts(ids),
      this.getAnalyticsHistoryContext(baseRows),
    ]);
    let rows = baseRows.map((row) =>
      this.buildAuditRow(
        row,
        projectChartHistoryCounts.get(String(row._id)) || 0,
        chartCounts.get(String(row._id)) || 0,
        analyticsContext.bindings.get(String(row._id)),
      ),
    );

    if (options.onlyWithHistory) {
      rows = rows.filter((row) => row.hasAnyLocalHistory);
    }

    if (options.sortByHistoryCount) {
      rows = rows.sort((left, right) => {
        if (right.totalHistoryPoints !== left.totalHistoryPoints) {
          return right.totalHistoryPoints - left.totalHistoryPoints;
        }

        return (left.rank || Number.MAX_SAFE_INTEGER) - (right.rank || Number.MAX_SAFE_INTEGER);
      });

      if (options.offset > 0 || options.limit > 0) {
        rows = rows.slice(options.offset, options.limit > 0 ? options.offset + options.limit : undefined);
      }
    }

    const totalProjects = rows.length;
    const projectsWithProjectChartHistory = this.countRows(rows, "hasProjectChartHistory");
    const projectsWithChart = this.countRows(rows, "hasChart");
    const projectsWithAnalyticsHistory = this.countRows(rows, "hasAnalyticsHistory");
    const projectsWithProjectHistory = this.countRows(rows, "hasProjectHistory");
    const projectsWithOhlcv = this.countRows(rows, "hasOhlcv");
    const projectsWithMarketSnapshots = this.countRows(rows, "hasMarketSnapshots");
    const projectsWithAnyLocalHistory = this.countRows(rows, "hasAnyLocalHistory");
    const projectsWithoutLocalHistory = totalProjects - projectsWithAnyLocalHistory;
    const analyticsHistoryPoints = rows.reduce(
      (total, row) => total + row.analyticsHistoryPoints,
      0,
    );
    const topProjects = rows
      .filter((row) => row.totalHistoryPoints > 0)
      .sort((left, right) => right.totalHistoryPoints - left.totalHistoryPoints)
      .slice(0, 20)
      .map((row) => this.projectSummary(row));
    const topAnalyticsProjects = rows
      .filter((row) => row.analyticsHistoryPoints > 0)
      .sort((left, right) => right.analyticsHistoryPoints - left.analyticsHistoryPoints)
      .slice(0, 20)
      .map((row) => this.projectSummary(row));
    const examplesWithAnalyticsHistory = rows
      .filter((row) => row.analyticsHistoryPoints > 0)
      .slice(0, 20)
      .map((row) => this.projectSummary(row));
    const projectsWithoutHistory = rows
      .filter((row) => !row.hasAnyLocalHistory)
      .slice(0, 20)
      .map((row) => this.projectSummary(row));

    return {
      generatedAt: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      scope: {
        projectType: "project",
        projectStatus: "active",
        limit: options.limit || null,
        offset: options.offset,
        onlyWithHistory: options.onlyWithHistory,
        sortByHistoryCount: options.sortByHistoryCount,
      },
      totalProjects,
      projectsWithProjectChartHistory,
      projectsWithChart,
      projectsWithAnalyticsHistory,
      projectsWithProjectHistory,
      projectsWithOhlcv,
      projectsWithMarketSnapshots,
      projectsWithAnyLocalHistory,
      projectsWithoutLocalHistory,
      analyticsHistoryPoints,
      analyticsCollectionsFound: analyticsContext.collections,
      examplesWithAnalyticsHistory,
      top20ProjectsWithAnalyticsHistory: topAnalyticsProjects,
      top20ProjectsWithMostHistoryPoints: topProjects,
      examplesOfProjectsWithoutHistory: projectsWithoutHistory,
      recommendation: {
        canBackfillWithSkipExternal: projectsWithAnyLocalHistory,
        requiresExternalCoinGecko: projectsWithoutLocalHistory,
        skipExternalCoveragePercent: totalProjects
          ? Number(((projectsWithAnyLocalHistory / totalProjects) * 100).toFixed(2))
          : 0,
        analyticsBackfillCandidates: projectsWithAnalyticsHistory,
        analyticsCoveragePercent: totalProjects
          ? Number(((projectsWithAnalyticsHistory / totalProjects) * 100).toFixed(2))
          : 0,
        topProjectsToRunFirst: topProjects,
        suggestedCommands: {
          dryRunLocal:
            "npm run backfill:ico-comparison:dry -- --skip-external",
          writeLocal:
            "npm run backfill:ico-comparison -- --skip-external",
          dryRunExternal:
            "npm run backfill:ico-comparison:dry -- --include-external --external-days=1095",
        },
      },
    };
  }

  private async getProjectBaseRows(options: Required<AuditOptions>): Promise<any[]> {
    const projectHistoryPoints = this.arraySize("$history");
    const ohlcvPoints = {
      $cond: [
        {
          $or: [
            { $isArray: "$ohlcv" },
            {
              $and: [
                { $ne: ["$ohlcv", null] },
                { $ne: [{ $type: "$ohlcv" }, "missing"] },
              ],
            },
          ],
        },
        {
          $cond: [{ $isArray: "$ohlcv" }, { $size: "$ohlcv" }, 1],
        },
        0,
      ],
    };
    const marketSnapshotsPoints = {
      $add: [
        this.arraySize("$marketHistory"),
        this.arraySize("$marketSnapshots"),
        this.arraySize("$rawIcoData.marketHistory"),
        this.arraySize("$rawIcoData.coinMarketCapHistory"),
        this.arraySize("$rawIcoData.cmcHistory"),
        this.arraySize("$rawIcoData.marketData.history"),
        this.arraySize("$rawIcoData.marketData.priceHistory"),
        this.arraySize("$rawIcoData.marketData.marketSnapshots"),
        this.arraySize("$rawIcoData.marketData.ohlcv"),
        this.arraySize("$rawIcoData.marketData.sparkline"),
      ],
    };
    const pipeline: any[] = [
      {
        $match: {
          projectType: "project",
          projectStatus: "active",
        },
      },
      { $sort: { _id: 1 } },
    ];

    if (options.offset > 0) {
      pipeline.push({ $skip: options.offset });
    }

    if (options.limit > 0) {
      pipeline.push({ $limit: options.limit });
    }

    pipeline.push({
      $project: {
        name: 1,
        slug: 1,
        symbol: 1,
        ticker: 1,
        niche: 1,
        sourceId: 1,
        coingeckoId: 1,
        coinId: 1,
        cmcId: 1,
        coinMarketCapId: 1,
        rawIcoData: {
          slug: "$rawIcoData.slug",
          sourceId: "$rawIcoData.sourceId",
          symbol: "$rawIcoData.symbol",
          ticker: "$rawIcoData.ticker",
          coingeckoId: "$rawIcoData.coingeckoId",
          coinId: "$rawIcoData.coinId",
          cmcId: "$rawIcoData.cmcId",
          coinMarketCapId: "$rawIcoData.coinMarketCapId",
        },
        rank: 1,
        fomoScore: 1,
        marketCap: 1,
        projectHistoryPoints,
        ohlcvPoints,
        marketSnapshotsPoints,
      },
    });

    return this.projectModel.aggregate(pipeline);
  }

  private async getProjectChartHistoryCounts(projectIds: Types.ObjectId[]): Promise<Map<string, number>> {
    if (!projectIds.length) return new Map();

    const rows = await this.projectChartHistoryModel.aggregate([
      { $match: { projectId: { $in: projectIds } } },
      {
        $project: {
          projectId: 1,
          points: this.arraySize("$data"),
        },
      },
      {
        $group: {
          _id: "$projectId",
          points: { $sum: "$points" },
        },
      },
    ]);

    return new Map(rows.map((row) => [String(row._id), Number(row.points || 0)]));
  }

  private async getChartCounts(projectIds: Types.ObjectId[]): Promise<Map<string, number>> {
    if (!projectIds.length) return new Map();

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
      {
        $match: {
          entityType: "project",
          entityId: { $in: projectIds },
        },
      },
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

  private async getAnalyticsHistoryContext(projects: any[]): Promise<AnalyticsHistoryContext> {
    const chartCounts = await this.getAllProjectChartCounts();
    const marketProjectIds = Array.from(chartCounts.keys())
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const marketProjects = marketProjectIds.length
      ? await this.projectModel
          .find({ _id: { $in: marketProjectIds }, projectType: "market" })
          .select({
            name: 1,
            slug: 1,
            sourceId: 1,
            symbol: 1,
            ticker: 1,
            niche: 1,
            rank: 1,
            rawIcoData: 1,
          })
          .lean()
      : [];
    const candidates: MarketChartCandidate[] = marketProjects
      .map((project) => {
        const points = chartCounts.get(String(project._id)) || 0;

        return {
          id: String(project._id),
          name: project.name,
          slug: project.slug,
          symbol: project.symbol || project.ticker || project.niche,
          rank: project.rank,
          points,
          slugKeys: this.slugKeys(project),
          symbolKeys: this.symbolKeys(project),
        };
      })
      .filter((candidate) => candidate.points > 0);
    const slugIndex = this.indexCandidates(candidates, "slugKeys");
    const symbolIndex = this.indexCandidates(candidates, "symbolKeys");
    const bindings = new Map<string, AnalyticsHistoryBinding>();

    for (const project of projects) {
      const binding = this.resolveAnalyticsBinding(project, slugIndex, symbolIndex);
      if (binding) bindings.set(String(project._id), binding);
    }

    return {
      bindings,
      collections: await this.analyticsCollectionsFound({
        matchedIcoProjects: bindings.size,
        marketProjectsWithCharts: candidates.length,
        totalAnalyticsChartPoints: Array.from(chartCounts.values()).reduce((sum, value) => sum + value, 0),
      }),
      marketProjectsWithCharts: candidates.length,
      totalAnalyticsChartPoints: Array.from(chartCounts.values()).reduce((sum, value) => sum + value, 0),
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

  private resolveAnalyticsBinding(
    project: any,
    slugIndex: Map<string, MarketChartCandidate[]>,
    symbolIndex: Map<string, MarketChartCandidate[]>,
  ): AnalyticsHistoryBinding | null {
    for (const key of this.slugKeys(project)) {
      const candidate = this.bestCandidate(slugIndex.get(key) || []);
      if (candidate) return this.analyticsBinding(candidate, "slug", key);
    }

    const symbolCandidates = this.uniqueCandidates(
      Array.from(this.symbolKeys(project)).flatMap((key) => symbolIndex.get(key) || []),
    );
    if (symbolCandidates.length === 1) {
      return this.analyticsBinding(symbolCandidates[0], "symbol", this.firstSymbolKey(project) || "");
    }

    const projectNameKey = this.normalizeSlugKey(project.name);
    const nameMatches = symbolCandidates.filter(
      (candidate) => this.normalizeSlugKey(candidate.name) === projectNameKey,
    );
    if (nameMatches.length === 1) {
      return this.analyticsBinding(nameMatches[0], "symbol+name", this.firstSymbolKey(project) || "");
    }

    return null;
  }

  private analyticsBinding(
    candidate: MarketChartCandidate,
    matchedBy: AnalyticsHistoryBinding["matchedBy"],
    matchedKey: string,
  ): AnalyticsHistoryBinding {
    return {
      points: candidate.points,
      matchedBy,
      matchedKey,
      marketProjectId: candidate.id,
      marketProjectName: candidate.name,
      marketProjectSlug: candidate.slug,
      marketProjectSymbol: candidate.symbol,
      fields: ["timestamp", "price.USD", "marketCap", "volume24h"],
    };
  }

  private bestCandidate(candidates: MarketChartCandidate[]): MarketChartCandidate | null {
    if (!candidates.length) return null;

    return [...candidates].sort((left, right) => {
      if (right.points !== left.points) return right.points - left.points;
      return (left.rank || Number.MAX_SAFE_INTEGER) - (right.rank || Number.MAX_SAFE_INTEGER);
    })[0];
  }

  private uniqueCandidates(candidates: MarketChartCandidate[]): MarketChartCandidate[] {
    const seen = new Set<string>();
    const result: MarketChartCandidate[] = [];

    for (const candidate of candidates) {
      if (seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      result.push(candidate);
    }

    return result;
  }

  private indexCandidates(
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

  private async analyticsCollectionsFound(summary: {
    matchedIcoProjects: number;
    marketProjectsWithCharts: number;
    totalAnalyticsChartPoints: number;
  }): Promise<any[]> {
    const [charts, projectChartHistories, coinmarketcaps, comparisonSnapshots, nftMarketSnapshots] =
      await Promise.all([
        this.collectionCount("charts"),
        this.collectionCount("projectcharthistories"),
        this.collectionCount("coinmarketcaps"),
        this.collectionCount("project_comparison_snapshots"),
        this.collectionCount("collection_nft_market_snapshots"),
      ]);

    return [
      {
        collection: "charts",
        documents: charts,
        usableForIcoComparisonBackfill: true,
        binding: "charts.entityId -> Project._id where Project.projectType=market; ICO project resolved by slug/sourceId/symbol/ticker",
        fields: ["timestamp", "price.USD", "marketCap", "volume24h"],
        fdv: "not stored directly; can be derived from price * totalSupply when supply exists",
        matchedIcoProjects: summary.matchedIcoProjects,
        marketProjectsWithCharts: summary.marketProjectsWithCharts,
        totalAnalyticsChartPoints: summary.totalAnalyticsChartPoints,
      },
      {
        collection: "projectcharthistories",
        documents: projectChartHistories,
        usableForIcoComparisonBackfill: true,
        binding: "projectId when present; slug is available on the model",
        fields: ["timestamp", "price.USD", "marketCap", "volume24h", "funding"],
      },
      {
        collection: "coinmarketcaps",
        documents: coinmarketcaps,
        usableForIcoComparisonBackfill: false,
        binding: "global market history, not per-project ICO history",
      },
      {
        collection: "project_comparison_snapshots",
        documents: comparisonSnapshots,
        usableForIcoComparisonBackfill: false,
        binding: "target snapshot collection",
      },
      {
        collection: "collection_nft_market_snapshots",
        documents: nftMarketSnapshots,
        usableForIcoComparisonBackfill: false,
        binding: "NFT collection snapshots, not project/token history",
      },
    ].filter((collection) =>
      collection.documents > 0 ||
      collection.collection === "charts" ||
      collection.collection === "project_comparison_snapshots",
    );
  }

  private async collectionCount(collectionName: string): Promise<number> {
    try {
      return await this.projectModel.db.collection(collectionName).estimatedDocumentCount();
    } catch {
      return 0;
    }
  }

  private buildAuditRow(
    row: any,
    projectChartHistoryPoints: number,
    chartPoints: number,
    analyticsBinding?: AnalyticsHistoryBinding,
  ): ProjectAuditRow {
    const projectHistoryPoints = Number(row.projectHistoryPoints || 0);
    const ohlcvPoints = Number(row.ohlcvPoints || 0);
    const marketSnapshotsPoints = Number(row.marketSnapshotsPoints || 0);
    const analyticsHistoryPoints = Number(analyticsBinding?.points || 0);
    const totalHistoryPoints =
      projectChartHistoryPoints +
      chartPoints +
      analyticsHistoryPoints +
      projectHistoryPoints +
      ohlcvPoints +
      marketSnapshotsPoints;

    return {
      id: String(row._id),
      name: row.name,
      slug: row.slug,
      symbol: row.symbol || row.ticker || row.niche,
      rank: row.rank,
      fomoScore: row.fomoScore,
      marketCap: row.marketCap,
      projectChartHistoryPoints,
      chartPoints,
      analyticsHistoryPoints,
      projectHistoryPoints,
      ohlcvPoints,
      marketSnapshotsPoints,
      totalHistoryPoints,
      hasProjectChartHistory: projectChartHistoryPoints > 0,
      hasChart: chartPoints > 0,
      hasAnalyticsHistory: analyticsHistoryPoints > 0,
      hasProjectHistory: projectHistoryPoints > 0,
      hasOhlcv: ohlcvPoints > 0,
      hasMarketSnapshots: marketSnapshotsPoints > 0,
      hasAnyLocalHistory: totalHistoryPoints > 0,
      analyticsBinding,
    };
  }

  private projectSummary(row: ProjectAuditRow): any {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      symbol: row.symbol,
      rank: row.rank,
      fomoScore: row.fomoScore,
      marketCap: row.marketCap,
      totalHistoryPoints: row.totalHistoryPoints,
      sources: {
        projectChartHistory: row.projectChartHistoryPoints,
        chart: row.chartPoints,
        analyticsHistory: row.analyticsHistoryPoints,
        projectHistory: row.projectHistoryPoints,
        ohlcv: row.ohlcvPoints,
        marketSnapshots: row.marketSnapshotsPoints,
      },
      analyticsBinding: row.analyticsBinding,
    };
  }

  private arraySize(path: string): any {
    return {
      $cond: [{ $isArray: path }, { $size: path }, 0],
    };
  }

  private countRows(rows: ProjectAuditRow[], key: keyof ProjectAuditRow): number {
    return rows.filter((row) => Boolean(row[key])).length;
  }

  private slugKeys(project: any): Set<string> {
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
        .map((value) => this.normalizeSlugKey(value))
        .filter(Boolean),
    );
  }

  private symbolKeys(project: any): Set<string> {
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

  private firstSymbolKey(project: any): string | null {
    return Array.from(this.symbolKeys(project))[0] || null;
  }

  private normalizeSlugKey(value: any): string {
    const text = this.firstString(value);
    return text ? normalizeSlug(text) : "";
  }

  private firstString(value: any): string | null {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
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

  private normalizeOptions(input: AuditOptions): Required<AuditOptions> {
    return {
      limit: this.clampInt(input.limit, 0, 0, 1_000_000),
      offset: this.clampInt(input.offset, 0, 0, 1_000_000),
      onlyWithHistory: Boolean(input.onlyWithHistory),
      sortByHistoryCount: Boolean(input.sortByHistoryCount),
    };
  }

  private clampInt(value: any, fallback: number, min: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, Math.trunc(parsed)));
  }
}
