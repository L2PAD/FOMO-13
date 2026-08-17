import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { FomoV2BackerReadModel } from "../../backers";
import {
  FomoV2FundingRound,
  FomoV2FundingRoundParticipant,
} from "../../funding/models";
import {
  FomoV2MarketProjectHistory,
  FomoV2MarketProjectReadModel,
  FomoV2MarketProjectRoiMetric,
  FomoV2ProjectMarketSnapshot,
} from "../../market/models";
import { FomoV2TokenAllocation, FomoV2VestingSummary } from "../../vesting";
import { FomoV2CanonicalProject } from "../../../models";
import { projectSourceTypeMongoPattern } from "../../../shared/source-policy";
import { FomoV2IcoProjectReadModel } from "../models";

type ProjectLike = Record<string, any>;
type HistoryRange = "30D" | "90D" | "6M" | "YTD" | "Since ICO";

interface ResolvedIcoComparisonProject {
  icoRow?: ProjectLike | null;
  marketRow?: ProjectLike | null;
  canonicalProject?: ProjectLike | null;
  canonicalProjectId?: string;
  marketAssetId?: string;
  coingeckoId?: string;
  readModelId?: string;
  slug?: string;
  name?: string;
  symbol?: string;
  logo?: string;
}

interface HistoryTarget {
  id: string;
  name: string;
  slug: string;
  symbol?: string;
  logo?: string;
  marketRow: ProjectLike;
  roiMetric?: ProjectLike | null;
}

interface RangeConfig {
  range: HistoryRange;
  startDate?: Date;
  endDate: Date;
  bucketMs: number;
  bucketInterval: string;
  maxPoints: number;
  downsampleStrategy: string;
  adaptiveBucket?: boolean;
}

const EXCLUDED_ROUND_STATUSES = [
  "cancelled",
  "conflict",
  "deprecated",
  "superseded",
];
const EXCLUDED_PARTICIPANT_STATUSES = ["conflict", "deprecated", "superseded"];
const DEFAULT_PEER_LIMIT = 4;
const MAX_PEER_LIMIT = 20;
const MAX_SEARCH_LIMIT = 20;
const MAX_HISTORY_TARGETS = 10;
const MAX_INDUSTRY_TARGETS = 12;
const MAX_CANDIDATE_ROWS = 160;
const HISTORY_MAX_RAW_POINTS = 5000;
const HISTORY_DISPLAY_MAX_POINTS = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class FomoV2IcoProjectComparisonReadService {
  constructor(
    @InjectModel(FomoV2IcoProjectReadModel.name)
    private readonly icoProjectReadModel: Model<FomoV2IcoProjectReadModel>,
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly marketProjectReadModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>,
    @InjectModel(FomoV2MarketProjectRoiMetric.name)
    private readonly marketRoiMetricModel: Model<FomoV2MarketProjectRoiMetric>,
    @InjectModel(FomoV2ProjectMarketSnapshot.name)
    private readonly marketSnapshotModel: Model<FomoV2ProjectMarketSnapshot>,
    @InjectModel(FomoV2MarketProjectHistory.name)
    private readonly marketHistoryModel: Model<FomoV2MarketProjectHistory>,
    @InjectModel(FomoV2FundingRound.name)
    private readonly fundingRoundModel: Model<FomoV2FundingRound>,
    @InjectModel(FomoV2FundingRoundParticipant.name)
    private readonly fundingParticipantModel: Model<FomoV2FundingRoundParticipant>,
    @InjectModel(FomoV2BackerReadModel.name)
    private readonly backerReadModel: Model<FomoV2BackerReadModel>,
    @InjectModel(FomoV2TokenAllocation.name)
    private readonly tokenAllocationModel: Model<FomoV2TokenAllocation>,
    @InjectModel(FomoV2VestingSummary.name)
    private readonly vestingSummaryModel: Model<FomoV2VestingSummary>
  ) {}

  async getIcoComparison(projectKey: string, query: any = {}): Promise<any> {
    const project = await this.resolveProject(projectKey, query?.lookup);
    const peerLimit = this.clampInt(
      query?.peerLimit,
      DEFAULT_PEER_LIMIT,
      0,
      MAX_PEER_LIMIT
    );
    const includePeers = this.isTruthy(query?.includePeers, true);
    const canonicalProjectId = this.toObjectId(project.canonicalProjectId);
    const marketAssetId = this.toObjectId(project.marketAssetId);
    const [
      fundingRounds,
      roiMetric,
      tokenAllocations,
      vestingSummary,
      topInvestors,
    ] = await Promise.all([
      canonicalProjectId
        ? this.loadFundingRounds(canonicalProjectId)
        : Promise.resolve([]),
      this.loadRoiMetric(project),
      canonicalProjectId
        ? this.loadTokenAllocations(canonicalProjectId)
        : Promise.resolve([]),
      canonicalProjectId
        ? this.loadVestingSummary(canonicalProjectId)
        : Promise.resolve(null),
      canonicalProjectId
        ? this.loadTopInvestors(canonicalProjectId)
        : Promise.resolve([]),
    ]);

    const market = this.buildMarket(project.marketRow, roiMetric);
    const fundraising = this.buildFundraising(
      project,
      fundingRounds,
      roiMetric
    );
    const roi = this.buildRoi(project.marketRow, roiMetric, fundraising);
    const tokenomics = this.buildTokenomics(
      project.marketRow,
      tokenAllocations
    );
    const unlocks = this.buildUnlocks(vestingSummary);
    const scores = this.buildScores(project);
    const currentRow = this.buildComparisonRow(project, {
      market,
      fundraising,
      roi,
      scores,
    });
    const comparisonPeers = includePeers
      ? await this.loadComparisonPeers(project, currentRow, peerLimit)
      : [];
    const backers = {
      totalInvestors: topInvestors.length || null,
      leadInvestors: topInvestors.filter((item) => item.isLead).length || null,
      topInvestors: topInvestors.slice(0, 10),
    };

    return this.cleanObject({
      project: this.toResponseProject(project),
      market,
      fundraising,
      roi,
      tokenomics,
      unlocks,
      backers,
      scores,
      comparisonTable: [currentRow, ...comparisonPeers],
      comparisonPeers,
      dataQuality: this.buildDataQuality({
        project,
        market,
        fundraising,
        roi,
        tokenomics,
        unlocks,
        backers,
        comparisonPeers,
        marketAssetId,
      }),
    });
  }

  async searchIcoComparisonProjects(
    projectKey: string,
    query: any = {}
  ): Promise<any> {
    const project = await this.resolveProject(projectKey, query?.lookup);
    const limit = this.clampInt(query?.limit, 8, 1, MAX_SEARCH_LIMIT);
    const search =
      this.firstString(query?.search, query?.q, query?.query) || "";
    const metric = this.normalizeSearchMetric(query?.metric);
    const excluded = new Set(
      this.parseCsv(query?.excludeIds)
        .map((item) => this.normalizeLookupKey(item))
        .filter(Boolean)
    );
    this.addProjectKeysToSet(excluded, project);

    const findQuery: any = {
      trading: "CURRENTLY_TRADING",
      status: "active",
      marketCap: { $gt: 0 },
    };
    if (search) {
      const regex = new RegExp(this.escapeRegExp(search), "i");
      findQuery.$or = [
        { name: regex },
        { symbol: regex },
        { slug: regex },
        { "providerIds.coingeckoId": regex },
      ];
    }

    const rows = await this.marketProjectReadModel
      .find(findQuery, this.marketProjection())
      .sort({ rank: 1, marketCap: -1, _id: 1 })
      .limit(Math.max(limit * 8, 50))
      .lean();
    const rowsForMetric = await this.rowsWithRoi(rows as any[]);
    const projects = rowsForMetric
      .map(({ row, roiMetric }) => this.buildPeerFromMarketRow(row, roiMetric))
      .filter((item) => item && !this.peerIsExcluded(item, excluded))
      .filter((item) => this.hasMetric(item, metric))
      .slice(0, limit);

    return this.cleanObject({
      isSuccess: true,
      projects,
      total: projects.length,
    });
  }

  async getIcoComparisonHistory(
    projectKey: string,
    query: any = {}
  ): Promise<any> {
    const project = await this.resolveProject(projectKey, query?.lookup);
    if (!project.marketRow?.marketAssetId) {
      return this.emptyHistoryResponse(this.normalizeRange(query?.range));
    }

    const latestTimestamp = await this.loadLatestHistoryTimestamp(
      project.marketRow
    );
    const rangeConfig = this.buildRangeConfig(
      this.normalizeRange(query?.range),
      latestTimestamp ? new Date(latestTimestamp) : undefined
    );
    const selectedKeys = this.parseCsv(query?.projectIds).slice(
      0,
      MAX_HISTORY_TARGETS
    );
    const peerLimit = this.clampInt(
      query?.peerLimit,
      DEFAULT_PEER_LIMIT,
      0,
      MAX_HISTORY_TARGETS
    );
    const includeIndustry = this.isTruthy(query?.includeIndustry, true);
    const targets = await this.resolveHistoryTargets(
      project,
      selectedKeys,
      peerLimit
    );
    const projectSeries = (
      await Promise.all(
        targets.map((target) => this.buildHistorySeries(target, rangeConfig))
      )
    ).filter((item) => item.series.length);
    const currentSeries = projectSeries[0]?.series || [];
    const industryAverageHistory = includeIndustry
      ? await this.buildIndustryAverageHistory(
          project,
          targets,
          currentSeries,
          rangeConfig
        )
      : [];

    return this.cleanObject({
      range: rangeConfig.range,
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
        sources: [
          "fomo-v2",
          "project_market_snapshots",
          "market_project_histories",
        ],
        snapshots: projectSeries.reduce(
          (sum, item) => sum + item.series.length,
          0
        ),
        peers: Math.max(0, projectSeries.length - 1),
        includeIndustry,
        historyNormalization: {
          range: rangeConfig.range,
          bucketMs: rangeConfig.bucketMs,
          bucketInterval: rangeConfig.bucketInterval,
          adaptiveBucket: Boolean(rangeConfig.adaptiveBucket),
          maxPointsPerSeries: rangeConfig.maxPoints,
          downsampleStrategy: rangeConfig.downsampleStrategy,
          anchors: ["first", "last", "metric_min", "metric_max"],
        },
        safeguards: {
          v2CanonicalResolver: true,
          coldTierAllowed: true,
          fdvDerivedFromSupply: true,
        },
      },
    });
  }

  private async resolveProject(
    projectKey: string,
    lookup?: any
  ): Promise<ResolvedIcoComparisonProject> {
    const key = this.firstString(projectKey);
    if (!key) throw new NotFoundException("FOMO v2 ICO project not found.");

    const lookupMode = this.normalizeLookupKey(lookup);
    const normalized = this.normalizeLookupKey(key);
    const objectId = this.toObjectId(key);
    let marketRow: any = null;
    let icoRow: any = null;
    let canonicalProject: any = null;

    if (["coingeckoid", "coingecko_id", "coingecko"].includes(lookupMode)) {
      marketRow = await this.marketProjectReadModel
        .findOne(
          { "providerIds.coingeckoId": normalized },
          this.marketProjection()
        )
        .lean();
    }

    if (!marketRow) {
      marketRow = await this.marketProjectReadModel
        .findOne(
          { $or: this.marketLookupClauses(key) },
          this.marketProjection()
        )
        .lean();
    }

    if (!icoRow) {
      const icoClauses = this.icoLookupClauses(key);
      if (icoClauses.length) {
        icoRow = await this.icoProjectReadModel
          .findOne({
            sourceType: projectSourceTypeMongoPattern("icodrops"),
            $or: icoClauses,
          })
          .lean();
      }
    }

    const canonicalId =
      this.toIdString(marketRow?.canonicalProjectId) ||
      this.toIdString(icoRow?.canonicalProjectId) ||
      (objectId ? this.toIdString(objectId) : undefined);
    const marketAssetId =
      this.toIdString(marketRow?.marketAssetId) ||
      this.toIdString(icoRow?.marketAssetId);

    if (!marketRow && (canonicalId || marketAssetId)) {
      const clauses: any[] = [];
      if (canonicalId && Types.ObjectId.isValid(canonicalId)) {
        clauses.push({ canonicalProjectId: new Types.ObjectId(canonicalId) });
      }
      if (marketAssetId && Types.ObjectId.isValid(marketAssetId)) {
        clauses.push({ marketAssetId: new Types.ObjectId(marketAssetId) });
      }
      if (clauses.length) {
        marketRow = await this.marketProjectReadModel
          .findOne({ $or: clauses }, this.marketProjection())
          .lean();
      }
    }

    if (!icoRow && (canonicalId || marketAssetId)) {
      const clauses: any[] = [];
      if (canonicalId && Types.ObjectId.isValid(canonicalId)) {
        clauses.push({ canonicalProjectId: new Types.ObjectId(canonicalId) });
      }
      if (marketAssetId && Types.ObjectId.isValid(marketAssetId)) {
        clauses.push({ marketAssetId: new Types.ObjectId(marketAssetId) });
      }
      if (clauses.length) {
        icoRow = await this.icoProjectReadModel
          .findOne({
            sourceType: projectSourceTypeMongoPattern("icodrops"),
            $or: clauses,
          })
          .lean();
      }
    }

    const finalCanonicalId =
      this.toIdString(marketRow?.canonicalProjectId) ||
      this.toIdString(icoRow?.canonicalProjectId);
    if (finalCanonicalId && Types.ObjectId.isValid(finalCanonicalId)) {
      canonicalProject = await this.canonicalProjectModel
        .findById(new Types.ObjectId(finalCanonicalId))
        .lean();
    } else {
      canonicalProject = await this.canonicalProjectModel
        .findOne({ $or: this.canonicalLookupClauses(key) })
        .lean();
    }

    if (!marketRow && !icoRow && !canonicalProject) {
      throw new NotFoundException("FOMO v2 ICO project not found.");
    }

    return this.cleanObject({
      icoRow,
      marketRow,
      canonicalProject,
      canonicalProjectId:
        this.toIdString(marketRow?.canonicalProjectId) ||
        this.toIdString(icoRow?.canonicalProjectId) ||
        this.toIdString(canonicalProject?._id),
      marketAssetId:
        this.toIdString(marketRow?.marketAssetId) ||
        this.toIdString(icoRow?.marketAssetId),
      coingeckoId: this.firstString(
        marketRow?.providerIds?.coingeckoId,
        canonicalProject?.providerIds?.coingeckoId
      ),
      readModelId:
        this.toIdString(icoRow?._id) || this.toIdString(marketRow?._id),
      slug: this.firstString(
        icoRow?.slug,
        marketRow?.slug,
        canonicalProject?.slug,
        normalized
      ),
      name: this.firstString(
        icoRow?.name,
        marketRow?.name,
        canonicalProject?.name
      ),
      symbol: this.firstString(
        icoRow?.symbol,
        marketRow?.symbol,
        canonicalProject?.symbol
      ),
      logo: this.firstString(
        marketRow?.logo,
        icoRow?.logoUrl,
        canonicalProject?.metadata?.image
      ),
    });
  }

  private async loadComparisonPeers(
    project: ResolvedIcoComparisonProject,
    currentRow: any,
    limit: number
  ): Promise<any[]> {
    if (limit <= 0 || !project.marketRow) return [];

    const peerRows = await this.loadPeerMarketRows(
      project,
      Math.min(MAX_CANDIDATE_ROWS, Math.max(limit * 16, 48))
    );
    const rowsWithRoi = await this.rowsWithRoi(peerRows);
    const scored = rowsWithRoi
      .map(({ row, roiMetric }) => ({
        row,
        roiMetric,
        peer: this.buildPeerFromMarketRow(row, roiMetric),
      }))
      .filter((item) => item.peer && this.hasComparisonRoi(item.peer))
      .map((item) => ({
        peer: item.peer,
        score: this.peerScore(
          currentRow,
          item.peer,
          project.marketRow,
          item.row
        ),
      }))
      .sort((left, right) => right.score - left.score);
    const seen = new Set<string>();

    return scored
      .filter(({ peer }) => {
        const key = this.normalizeLookupKey(peer.id || peer.slug || peer.name);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(({ peer }) => peer)
      .slice(0, limit);
  }

  private async loadPeerMarketRows(
    project: ResolvedIcoComparisonProject,
    limit: number
  ): Promise<any[]> {
    if (limit <= 0) return [];

    const categories = this.projectCategories(
      project.marketRow,
      project.icoRow
    );
    const excludeReadModelIds = this.uniqueObjectIds([project.marketRow?._id]);
    const excludeMarketAssetId = this.toObjectId(project.marketAssetId);
    const excludeCanonicalProjectId = this.toObjectId(
      project.canonicalProjectId
    );
    const baseQuery: any = {
      trading: "CURRENTLY_TRADING",
      status: "active",
      marketCap: { $gt: 0 },
      ...(excludeReadModelIds.length
        ? { _id: { $nin: excludeReadModelIds } }
        : {}),
      ...(excludeMarketAssetId
        ? { marketAssetId: { $ne: excludeMarketAssetId } }
        : {}),
      ...(excludeCanonicalProjectId
        ? { canonicalProjectId: { $ne: excludeCanonicalProjectId } }
        : {}),
    };
    const categoryQuery = categories.length
      ? {
          $or: [
            { topCategories: { $in: categories } },
            { categories: { $in: categories } },
            { category: { $in: categories } },
            { niche: { $in: categories } },
          ],
        }
      : {};

    return this.marketProjectReadModel
      .find({ ...baseQuery, ...categoryQuery }, this.marketProjection())
      .sort({ marketCap: -1, rank: 1, _id: 1 })
      .limit(limit)
      .lean();
  }

  private async rowsWithRoi(
    rows: any[]
  ): Promise<Array<{ row: any; roiMetric?: any }>> {
    const assetIds = this.uniqueObjectIds(
      rows.map((row) => row?.marketAssetId)
    );
    const roiRows = assetIds.length
      ? await this.marketRoiMetricModel
          .find({ marketAssetId: { $in: assetIds } })
          .lean()
      : [];
    const roiByAssetId = new Map(
      (roiRows as any[]).map((row) => [this.toIdString(row.marketAssetId), row])
    );

    return rows.map((row) => ({
      row,
      roiMetric: roiByAssetId.get(this.toIdString(row?.marketAssetId)),
    }));
  }

  private buildPeerFromMarketRow(row: any, roiMetric?: any): any {
    const market = this.buildMarket(row, roiMetric);
    const fundraising = {
      totalRaised: this.firstNumber(
        roiMetric?.totalRaised?.usd,
        row?.totalRaised
      ),
      rounds: [],
    };
    const roi = this.buildRoi(row, roiMetric, fundraising);
    const id =
      this.firstString(row?.providerIds?.coingeckoId, row?.slug) ||
      this.toIdString(row?.marketAssetId) ||
      this.toIdString(row?._id);

    return this.cleanObject({
      id,
      name: row?.name,
      slug: id || row?.slug,
      symbol: this.firstString(row?.symbol)?.toUpperCase(),
      logo: row?.logo,
      categories: this.projectCategories(row),
      chains: this.projectChains(row),
      investedAmount: fundraising.totalRaised,
      currentValue: market.marketCap,
      entryPrice: roi.icoPrice,
      currentPrice: roi.currentPrice,
      athPrice: roi.athPrice,
      fundraisingTotal: fundraising.totalRaised,
      totalRaised: fundraising.totalRaised,
      fundsRaised: fundraising.totalRaised,
      marketCap: market.marketCap,
      fdv: market.fdv,
      fullyDilutedMarketCap: market.fdv,
      roiX: roi.roiX,
      roiPercent: roi.roiPercent,
      athRoiX: roi.athRoiX,
      athRoiPercent: roi.athRoiPercent,
      currentRoiXFromIco: roi.currentRoiXFromIco,
      currentRoiFromIco: roi.currentRoiFromIco,
      athRoiXFromIco: roi.athRoiXFromIco,
      athRoiFromIco: roi.athRoiFromIco,
      entryRoundName: roi.entryRoundName,
      entrySource: roi.entrySource,
      rating: this.firstNumber(row?.rating, row?.fomoScore),
      fomoScore: this.firstNumber(row?.fomoScore, row?.rating),
    });
  }

  private buildComparisonRow(
    project: ResolvedIcoComparisonProject,
    blocks: {
      market: any;
      fundraising: any;
      roi: any;
      scores: any;
    }
  ): any {
    const id =
      project.coingeckoId ||
      project.canonicalProjectId ||
      project.marketAssetId ||
      project.readModelId ||
      project.slug;

    return this.cleanObject({
      id,
      name: project.name,
      slug: project.coingeckoId || project.slug || id,
      symbol: project.symbol?.toUpperCase(),
      logo: project.logo,
      categories: this.projectCategories(project.marketRow, project.icoRow),
      chains: this.projectChains(project.marketRow, project.icoRow),
      investedAmount: blocks.fundraising.totalRaised,
      currentValue: blocks.market.marketCap,
      entryPrice: blocks.roi.icoPrice,
      currentPrice: blocks.roi.currentPrice,
      athPrice: blocks.roi.athPrice,
      fundraisingTotal: blocks.fundraising.totalRaised,
      totalRaised: blocks.fundraising.totalRaised,
      fundsRaised: blocks.fundraising.totalRaised,
      marketCap: blocks.market.marketCap,
      fdv: blocks.market.fdv,
      fullyDilutedMarketCap: blocks.market.fdv,
      roiX: blocks.roi.roiX,
      roiPercent: blocks.roi.roiPercent,
      athRoiX: blocks.roi.athRoiX,
      athRoiPercent: blocks.roi.athRoiPercent,
      currentRoiXFromIco: blocks.roi.currentRoiXFromIco,
      currentRoiFromIco: blocks.roi.currentRoiFromIco,
      athRoiXFromIco: blocks.roi.athRoiXFromIco,
      athRoiFromIco: blocks.roi.athRoiFromIco,
      entryRoundName: blocks.roi.entryRoundName,
      entrySource: blocks.roi.entrySource,
      rating: blocks.scores.rating,
      fomoScore: blocks.scores.fomoScore,
    });
  }

  private async resolveHistoryTargets(
    project: ResolvedIcoComparisonProject,
    selectedKeys: string[],
    peerLimit: number
  ): Promise<HistoryTarget[]> {
    const selectedProjects = selectedKeys.length
      ? await Promise.all(
          selectedKeys.map((key) => this.resolveProject(key).catch(() => null))
        )
      : [];
    const selectedTargets = selectedProjects
      .filter((item): item is ResolvedIcoComparisonProject =>
        Boolean(item?.marketRow?.marketAssetId)
      )
      .map((item) => this.toHistoryTarget(item));

    if (selectedTargets.length) return this.dedupeTargets(selectedTargets);

    const peerRows = await this.loadPeerMarketRows(
      project,
      Math.max(peerLimit, 0)
    );
    const peerTargets = peerRows.map((row) =>
      this.toHistoryTarget({
        marketRow: row,
        canonicalProjectId: this.toIdString(row?.canonicalProjectId),
        marketAssetId: this.toIdString(row?.marketAssetId),
        coingeckoId: this.firstString(row?.providerIds?.coingeckoId),
        readModelId: this.toIdString(row?._id),
        slug: this.firstString(row?.slug, row?.providerIds?.coingeckoId),
        name: row?.name,
        symbol: row?.symbol,
        logo: row?.logo,
      })
    );

    return this.dedupeTargets([
      this.toHistoryTarget(project),
      ...peerTargets,
    ]).slice(0, Math.max(peerLimit + 1, 1));
  }

  private toHistoryTarget(
    project: ResolvedIcoComparisonProject
  ): HistoryTarget {
    const row = project.marketRow;
    const id =
      project.coingeckoId ||
      this.firstString(row?.providerIds?.coingeckoId, row?.slug) ||
      project.marketAssetId ||
      project.canonicalProjectId ||
      project.readModelId;

    return {
      id,
      name: project.name || row?.name || id,
      slug: project.coingeckoId || project.slug || row?.slug || id,
      symbol: project.symbol || row?.symbol,
      logo: project.logo || row?.logo,
      marketRow: row,
    };
  }

  private async buildHistorySeries(
    target: HistoryTarget,
    rangeConfig: RangeConfig
  ): Promise<any> {
    const roiMetric =
      target.roiMetric ||
      (await this.loadRoiMetric({ marketRow: target.marketRow }));
    const rows = await this.loadCombinedHistoryRows(
      target.marketRow,
      rangeConfig
    );
    const points = this.rowsToHistoryPoints(
      rows,
      target.marketRow,
      roiMetric,
      rangeConfig
    );

    return this.cleanObject({
      id: target.id,
      name: target.name,
      slug: target.slug,
      symbol: target.symbol,
      logo: target.logo,
      series: points,
    });
  }

  private async loadCombinedHistoryRows(
    marketRow: any,
    rangeConfig: RangeConfig
  ): Promise<any[]> {
    const marketAssetId = this.toObjectId(marketRow?.marketAssetId);
    if (!marketAssetId) return [];

    const snapshotFilter: any = {
      marketAssetId,
      provider: "coingecko",
      priceUsd: { $gt: 0 },
      timestamp: { $lte: rangeConfig.endDate },
    };
    const historyFilter: any = {
      marketAssetId,
      bucketTimestamp: { $lte: rangeConfig.endDate },
    };

    if (rangeConfig.startDate) {
      snapshotFilter.timestamp.$gte = rangeConfig.startDate;
      historyFilter.bucketTimestamp.$gte = rangeConfig.startDate;
    }

    const [snapshots, histories] = await Promise.all([
      this.marketSnapshotModel
        .find(snapshotFilter, {
          timestamp: 1,
          priceUsd: 1,
          marketCapUsd: 1,
          volumeUsd: 1,
        })
        .sort({ timestamp: 1 })
        .limit(HISTORY_MAX_RAW_POINTS)
        .lean(),
      this.marketHistoryModel
        .find(historyFilter, {
          timestamp: 1,
          bucketTimestamp: 1,
          price: 1,
          marketCap: 1,
          volume24h: 1,
        })
        .sort({ bucketTimestamp: 1 })
        .limit(HISTORY_MAX_RAW_POINTS)
        .lean(),
    ]);
    const byTimestamp = new Map<number, any>();

    for (const snapshot of snapshots as any[]) {
      const timestamp = this.dateTime(snapshot?.timestamp);
      if (!timestamp) continue;
      byTimestamp.set(timestamp, {
        timestamp,
        date: snapshot.timestamp,
        price: this.toFiniteNumber(snapshot.priceUsd),
        marketCap: this.toFiniteNumber(snapshot.marketCapUsd),
        volume24h: this.toFiniteNumber(snapshot.volumeUsd),
        source: "project_market_snapshots",
      });
    }

    for (const history of histories as any[]) {
      const date = history.bucketTimestamp || history.timestamp;
      const timestamp = this.dateTime(date);
      if (!timestamp) continue;
      const existing = byTimestamp.get(timestamp) || {};
      byTimestamp.set(timestamp, {
        ...existing,
        timestamp,
        date,
        price: this.firstNumber(history.price, existing.price),
        marketCap: this.firstNumber(history.marketCap, existing.marketCap),
        volume24h: this.firstNumber(history.volume24h, existing.volume24h),
        source: existing.source
          ? `${existing.source},market_project_histories`
          : "market_project_histories",
      });
    }

    return Array.from(byTimestamp.values()).sort(
      (left, right) => left.timestamp - right.timestamp
    );
  }

  private async loadLatestHistoryTimestamp(
    marketRow: any
  ): Promise<number | undefined> {
    const marketAssetId = this.toObjectId(marketRow?.marketAssetId);
    if (!marketAssetId) return undefined;

    const [snapshot, history] = await Promise.all([
      this.marketSnapshotModel
        .findOne(
          {
            marketAssetId,
            provider: "coingecko",
            priceUsd: { $gt: 0 },
          },
          { timestamp: 1 }
        )
        .sort({ timestamp: -1 })
        .lean(),
      this.marketHistoryModel
        .findOne({ marketAssetId }, { bucketTimestamp: 1, timestamp: 1 })
        .sort({ bucketTimestamp: -1, timestamp: -1 })
        .lean(),
    ]);

    return (
      Math.max(
        this.dateTime(snapshot?.timestamp) || 0,
        this.dateTime(history?.bucketTimestamp || history?.timestamp) || 0
      ) || undefined
    );
  }

  private rowsToHistoryPoints(
    rows: any[],
    marketRow: any,
    roiMetric: any,
    rangeConfig: RangeConfig
  ): any[] {
    const entryPrice = this.firstNumber(roiMetric?.entryPrice?.usd);
    const roundName = this.firstString(roiMetric?.entryPrice?.roundName);
    const fdvSupply = this.firstNumber(
      marketRow?.totalSupply,
      marketRow?.maxSupply
    );
    const fdvRatio = this.fdvRatio(marketRow);
    const bucketMs = this.resolveHistoryBucketMs(rows, rangeConfig);
    const bucketed = this.bucketRows(rows, bucketMs);
    const points = bucketed
      .map((row) => {
        const price = this.firstNumber(row.price);
        const marketCap = this.firstNumber(row.marketCap);
        const fdv =
          price !== undefined && fdvSupply !== undefined
            ? price * fdvSupply
            : price !== undefined && fdvRatio !== undefined
            ? price * fdvRatio
            : undefined;
        const roiMultiplier =
          price !== undefined && entryPrice !== undefined && entryPrice > 0
            ? price / entryPrice
            : undefined;
        const roiFromIco =
          roiMultiplier !== undefined ? (roiMultiplier - 1) * 100 : undefined;
        const timestamp = Number(row.timestamp);

        return this.cleanObject({
          timestamp,
          date: new Date(timestamp).toISOString(),
          value: roiMultiplier,
          price,
          investmentPrice: entryPrice,
          roundName,
          marketCap,
          fdv,
          volume24h: this.firstNumber(row.volume24h),
          roiFromIco,
          roiFromListing: roiFromIco,
          roiMultiplier,
          roiSource: entryPrice !== undefined ? "entry_price" : undefined,
          source: row.source,
        });
      })
      .filter(
        (point) =>
          point.timestamp &&
          (point.price !== undefined ||
            point.marketCap !== undefined ||
            point.fdv !== undefined)
      );

    return this.downsample(points, rangeConfig.maxPoints);
  }

  private async buildIndustryAverageHistory(
    project: ResolvedIcoComparisonProject,
    selectedTargets: HistoryTarget[],
    currentSeries: any[],
    rangeConfig: RangeConfig
  ): Promise<any[]> {
    if (!currentSeries.length) return [];

    const selectedAssetIds = new Set(
      selectedTargets
        .map((target) => this.toIdString(target.marketRow?.marketAssetId))
        .filter(Boolean)
    );
    const industryRows = await this.loadPeerMarketRows(
      project,
      MAX_INDUSTRY_TARGETS + selectedTargets.length
    );
    const industryTargets = industryRows
      .filter(
        (row) => !selectedAssetIds.has(this.toIdString(row?.marketAssetId))
      )
      .slice(0, MAX_INDUSTRY_TARGETS)
      .map((row) =>
        this.toHistoryTarget({
          marketRow: row,
          canonicalProjectId: this.toIdString(row?.canonicalProjectId),
          marketAssetId: this.toIdString(row?.marketAssetId),
          coingeckoId: this.firstString(row?.providerIds?.coingeckoId),
          readModelId: this.toIdString(row?._id),
          slug: this.firstString(row?.slug, row?.providerIds?.coingeckoId),
          name: row?.name,
          symbol: row?.symbol,
          logo: row?.logo,
        })
      );
    const industrySeries = (
      await Promise.all(
        industryTargets.map((target) =>
          this.buildHistorySeries(target, rangeConfig)
        )
      )
    )
      .map((item) => item.series)
      .filter((series) => Array.isArray(series) && series.length);
    const fallbackSeries =
      selectedTargets.length > 1
        ? (
            await Promise.all(
              selectedTargets
                .slice(1)
                .map((target) => this.buildHistorySeries(target, rangeConfig))
            )
          )
            .map((item) => item.series)
            .filter((series) => Array.isArray(series) && series.length)
        : [];
    const sourceSeries = industrySeries.length
      ? industrySeries
      : fallbackSeries;
    if (!sourceSeries.length) return [];

    return currentSeries.map((basePoint) => {
      const matches = sourceSeries
        .map((series) =>
          this.closestPoint(
            series,
            basePoint.timestamp,
            rangeConfig.bucketMs * 2
          )
        )
        .filter(Boolean);

      return this.cleanObject({
        timestamp: basePoint.timestamp,
        date: basePoint.date,
        marketCap: this.average(matches.map((point) => point.marketCap)),
        fdv: this.average(matches.map((point) => point.fdv)),
        roi: this.average(matches.map((point) => point.roiFromIco)),
        medianRoi: this.median(matches.map((point) => point.roiFromIco)),
        topQuartileRoi: this.percentile(
          matches.map((point) => point.roiFromIco),
          0.75
        ),
      });
    });
  }

  private async loadFundingRounds(
    canonicalProjectId: Types.ObjectId
  ): Promise<any[]> {
    return this.fundingRoundModel
      .find({
        canonicalProjectId,
        status: { $nin: EXCLUDED_ROUND_STATUSES },
      })
      .sort({ announcedDate: -1, date: -1, _id: -1 })
      .lean();
  }

  private async loadRoiMetric(
    project: Partial<ResolvedIcoComparisonProject>
  ): Promise<any | null> {
    const marketAssetId = this.toObjectId(
      project.marketAssetId || project.marketRow?.marketAssetId
    );
    const canonicalProjectId = this.toObjectId(
      project.canonicalProjectId || project.marketRow?.canonicalProjectId
    );
    const coingeckoId = this.firstString(
      project.coingeckoId,
      project.marketRow?.providerIds?.coingeckoId
    );
    const clauses: any[] = [];

    if (marketAssetId) clauses.push({ marketAssetId });
    if (canonicalProjectId) clauses.push({ canonicalProjectId });
    if (coingeckoId) clauses.push({ coingeckoId });
    if (!clauses.length) return null;

    return this.marketRoiMetricModel.findOne({ $or: clauses }).lean();
  }

  private async loadTokenAllocations(
    canonicalProjectId: Types.ObjectId
  ): Promise<any[]> {
    return this.tokenAllocationModel
      .find({
        canonicalProjectId,
        status: { $nin: ["conflict", "deprecated", "superseded"] },
      })
      .sort({ allocationPercent: -1, name: 1, _id: 1 })
      .lean();
  }

  private async loadVestingSummary(
    canonicalProjectId: Types.ObjectId
  ): Promise<any | null> {
    return this.vestingSummaryModel
      .findOne({ canonicalProjectId })
      .sort({ calculatedAt: -1, updatedAt: -1 })
      .lean();
  }

  private async loadTopInvestors(
    canonicalProjectId: Types.ObjectId
  ): Promise<any[]> {
    const participants = await this.fundingParticipantModel
      .find({
        canonicalProjectId,
        status: { $nin: EXCLUDED_PARTICIPANT_STATUSES },
      })
      .sort({ isLead: -1, backerName: 1, _id: 1 })
      .lean();
    if (!participants.length) return [];

    const backers = await this.backerReadModel
      .find({
        backerId: {
          $in: this.uniqueObjectIds(
            participants.map((participant: any) => participant.backerId)
          ),
        },
      })
      .lean();
    const backerById = new Map(
      (backers as any[]).map((backer) => [
        this.toIdString(backer.backerId),
        backer,
      ])
    );
    const groups = new Map<string, any>();

    for (const participant of participants as any[]) {
      const backerId = this.toIdString(participant.backerId);
      const key = backerId || this.normalizeLookupKey(participant.backerName);
      if (!key) continue;
      const current = groups.get(key) || {
        backerId,
        firstParticipant: participant,
        participationCount: 0,
        isLead: false,
      };
      current.participationCount += 1;
      current.isLead =
        current.isLead ||
        Boolean(participant.isLead || participant.role === "lead");
      groups.set(key, current);
    }

    return Array.from(groups.values())
      .map((group) => {
        const backer = backerById.get(group.backerId);
        const name = this.firstString(
          backer?.name,
          group.firstParticipant?.backerName,
          group.firstParticipant?.sourceBackerSlug
        );
        if (!name) return null;
        const slug = this.firstString(
          backer?.slug,
          group.firstParticipant?.sourceBackerSlug
        );
        const type = this.firstString(backer?.backerType, "fund");

        return this.cleanObject({
          name,
          slug,
          logo: this.firstString(backer?.logoUrl, backer?.avatarUrl),
          tier: undefined,
          type,
          investmentsCount: group.participationCount,
          isLead: group.isLead,
        });
      })
      .filter(Boolean);
  }

  private buildMarket(row: any, roiMetric: any): any {
    const currentPrice = this.firstNumber(
      row?.price,
      row?.usdQuote?.price,
      roiMetric?.currentPrice?.usd
    );
    const fdv = this.firstNumber(
      row?.fullyDilutedMarketCap,
      row?.usdQuote?.fully_diluted_market_cap,
      currentPrice !== undefined && row?.totalSupply
        ? currentPrice * Number(row.totalSupply)
        : undefined,
      currentPrice !== undefined && row?.maxSupply
        ? currentPrice * Number(row.maxSupply)
        : undefined
    );

    return this.cleanObject({
      currentPrice,
      marketCap: this.firstNumber(row?.marketCap, row?.usdQuote?.market_cap),
      fdv,
      volume24h: this.firstNumber(row?.volume24h, row?.usdQuote?.volume_24h),
      circulatingSupply: this.firstNumber(row?.circulatingSupply),
      totalSupply: this.firstNumber(row?.totalSupply, row?.maxSupply),
      athPrice: this.firstNumber(row?.athUsd),
      atlPrice: this.firstNumber(row?.atlUsd),
    });
  }

  private buildFundraising(
    project: ResolvedIcoComparisonProject,
    rounds: any[],
    roiMetric: any
  ): any {
    const normalizedRounds = rounds.map((round) => this.normalizeRound(round));
    const totalFromRounds = this.sumNumbers(
      normalizedRounds.map((round) => round.amount)
    );
    const profile = this.getIcoProfile(project.icoRow);
    const profileFundraising = profile?.fundraising || {};

    return {
      totalRaised: this.firstNumber(
        roiMetric?.totalRaised?.usd,
        profileFundraising?.totalRaised,
        totalFromRounds
      ),
      rounds: normalizedRounds,
    };
  }

  private buildRoi(row: any, roiMetric: any, fundraising: any): any {
    const currentPrice = this.firstNumber(
      row?.price,
      row?.usdQuote?.price,
      roiMetric?.currentPrice?.usd
    );
    const athPrice = this.firstNumber(row?.athUsd);
    const entryPrice = this.firstNumber(roiMetric?.entryPrice?.usd);
    const currentRoiX = this.firstNumber(
      roiMetric?.roiMultiplier?.usd,
      currentPrice !== undefined && entryPrice !== undefined && entryPrice > 0
        ? currentPrice / entryPrice
        : undefined
    );
    const athRoiX =
      athPrice !== undefined && entryPrice !== undefined && entryPrice > 0
        ? athPrice / entryPrice
        : undefined;

    return this.cleanObject({
      entryPrice,
      icoPrice: entryPrice,
      listingPrice: undefined,
      currentPrice,
      athPrice,
      roiX: currentRoiX,
      roiPercent:
        currentRoiX !== undefined ? (currentRoiX - 1) * 100 : undefined,
      athRoiX,
      athRoiPercent: athRoiX !== undefined ? (athRoiX - 1) * 100 : undefined,
      currentRoiXFromIco: currentRoiX,
      currentRoiFromIco:
        currentRoiX !== undefined ? (currentRoiX - 1) * 100 : undefined,
      athRoiXFromIco: athRoiX,
      athRoiFromIco: athRoiX !== undefined ? (athRoiX - 1) * 100 : undefined,
      currentRoiXFromListing: undefined,
      currentRoiFromListing: undefined,
      athRoiXFromListing: undefined,
      athRoiFromListing: undefined,
      entryRoundName: this.firstString(
        roiMetric?.entryPrice?.roundName,
        fundraising.rounds?.[0]?.name
      ),
      entrySource: this.firstString(
        roiMetric?.entryPrice?.sourceType,
        "fomo-v2"
      ),
    });
  }

  private buildTokenomics(row: any, allocations: any[]): any {
    const allocation = allocations.map((item) =>
      this.cleanObject({
        name: item.name,
        allocationPercent: this.firstNumber(item.allocationPercent),
        amount: this.firstNumber(item.amount),
        sourceType: item.sourceType,
      })
    );

    return this.cleanObject({
      totalSupply: this.firstNumber(row?.totalSupply, row?.maxSupply),
      circulatingSupply: this.firstNumber(row?.circulatingSupply),
      fdv: this.firstNumber(row?.fullyDilutedMarketCap),
      tokenSaleAllocation: this.allocationPercent(allocation, [
        "sale",
        "public",
        "private",
        "seed",
        "round",
      ]),
      publicSaleAllocation: this.allocationPercent(allocation, ["public"]),
      privateSaleAllocation: this.allocationPercent(allocation, [
        "private",
        "seed",
        "strategic",
      ]),
      teamAllocation: this.allocationPercent(allocation, ["team", "advisor"]),
      ecosystemAllocation: this.allocationPercent(allocation, [
        "ecosystem",
        "community",
        "reward",
      ]),
      treasuryAllocation: this.allocationPercent(allocation, [
        "treasury",
        "reserve",
      ]),
      liquidityAllocation: this.allocationPercent(allocation, [
        "liquidity",
        "market",
      ]),
      allocation,
    });
  }

  private buildUnlocks(summary: any): any {
    return this.cleanObject({
      nextUnlockDate: this.toIso(summary?.nextUnlockDate),
      nextUnlockAmount: this.firstNumber(summary?.lockedAmount),
      nextUnlockPercent: this.firstNumber(summary?.lockedPercent),
      events: [],
    });
  }

  private buildScores(project: ResolvedIcoComparisonProject): any {
    return this.cleanObject({
      rating: this.firstNumber(
        project.marketRow?.rating,
        project.marketRow?.fomoScore,
        project.icoRow?.metadata?.fomoScore
      ),
      fomoScore: this.firstNumber(
        project.marketRow?.fomoScore,
        project.marketRow?.rating,
        project.icoRow?.metadata?.fomoScore
      ),
      fullness: this.firstNumber(
        project.icoRow?.profileCompleteness,
        project.marketRow?.fullness
      ),
      riskScore: undefined,
      sourceConfidence: undefined,
    });
  }

  private buildDataQuality(blocks: Record<string, any>): any {
    const missingFields: string[] = [];
    const checks: Array<[string, any]> = [
      ["market.currentPrice", blocks.market?.currentPrice],
      ["market.marketCap", blocks.market?.marketCap],
      ["market.fdv", blocks.market?.fdv],
      ["fundraising.totalRaised", blocks.fundraising?.totalRaised],
      ["roi.icoPrice", blocks.roi?.icoPrice],
      ["roi.currentRoiFromIco", blocks.roi?.currentRoiFromIco],
      ["comparisonPeers", blocks.comparisonPeers],
    ];

    checks.forEach(([field, value]) => {
      if (
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && !value.length)
      ) {
        missingFields.push(field);
      }
    });

    return {
      sources: [
        "fomo-v2",
        "ico_project_read_models",
        "market_project_read_models",
      ],
      missingFields,
      staleFields: [],
      confidence: Math.max(
        0,
        Math.round(
          ((checks.length - missingFields.length) / checks.length) * 100
        )
      ),
      updatedAt: this.toIso(
        blocks.project?.marketRow?.updatedAt ||
          blocks.project?.icoRow?.updatedAt
      ),
      safeguards: {
        v2CanonicalResolver: true,
        marketLogoPriority: true,
        coldTierAllowed: true,
        rawProviderPayloadExposed: false,
      },
    };
  }

  private toResponseProject(project: ResolvedIcoComparisonProject): any {
    const id =
      project.coingeckoId ||
      project.canonicalProjectId ||
      project.marketAssetId ||
      project.readModelId ||
      project.slug;

    return this.cleanObject({
      id,
      name: project.name,
      slug: project.coingeckoId || project.slug || id,
      symbol: project.symbol?.toUpperCase(),
      logo: project.logo,
      screenshotUrl: this.firstScreenshot(project.icoRow),
      screenshot: this.firstScreenshot(project.icoRow),
      categories: this.projectCategories(project.marketRow, project.icoRow),
      chains: this.projectChains(project.marketRow, project.icoRow),
    });
  }

  private normalizeRound(round: any): any {
    return this.cleanObject({
      name: this.firstString(
        round?.roundName,
        this.humanizeRoundType(round?.normalizedRoundType),
        this.humanizeRoundType(round?.roundType)
      ),
      date: this.toIso(round?.announcedDate || round?.date),
      amount: this.firstNumber(round?.raisedAmount, round?.metadata?.amountUsd),
      amountRaw: undefined,
      valuation: this.firstNumber(
        round?.valuation,
        round?.metadata?.valuationUsd
      ),
      valuationRaw: undefined,
      price: this.firstNumber(
        round?.tokenPrice,
        round?.metadata?.icoPrice?.USD
      ),
      investors: [],
    });
  }

  private marketLookupClauses(value: string): any[] {
    const normalized = this.normalizeLookupKey(value);
    const objectId = this.toObjectId(value);
    const clauses: any[] = [];

    if (normalized) {
      clauses.push(
        { "providerIds.coingeckoId": normalized },
        { slug: normalized },
        { legacyRouteId: normalized }
      );
    }
    if (objectId) {
      clauses.push(
        { _id: objectId },
        { marketAssetId: objectId },
        { canonicalProjectId: objectId },
        { legacyProjectId: objectId }
      );
    }

    return clauses;
  }

  private icoLookupClauses(value: string): any[] {
    const normalized = this.normalizeLookupKey(value);
    const objectId = this.toObjectId(value);
    const clauses: any[] = [];

    if (normalized) {
      clauses.push(
        { slug: normalized },
        { "metadata.icodropsProfileOnly.slug": normalized }
      );
    }
    if (objectId) {
      clauses.push(
        { _id: objectId },
        { canonicalProjectId: objectId },
        { marketAssetId: objectId }
      );
    }

    return clauses;
  }

  private canonicalLookupClauses(value: string): any[] {
    const normalized = this.normalizeLookupKey(value);
    const objectId = this.toObjectId(value);
    const clauses: any[] = [];

    if (objectId) clauses.push({ _id: objectId });
    if (normalized) {
      clauses.push(
        { slug: normalized },
        { normalizedName: normalized },
        { "providerIds.coingeckoId": normalized },
        { "aliases.normalizedValue": normalized }
      );
    }

    return clauses.length ? clauses : [{ _id: null }];
  }

  private marketProjection(): Record<string, number> {
    return {
      _id: 1,
      canonicalProjectId: 1,
      marketAssetId: 1,
      legacyProjectId: 1,
      legacyRouteId: 1,
      name: 1,
      symbol: 1,
      slug: 1,
      logo: 1,
      niche: 1,
      category: 1,
      categories: 1,
      topCategories: 1,
      rank: 1,
      tier: 1,
      trading: 1,
      status: 1,
      price: 1,
      priceBTC: 1,
      priceETH: 1,
      marketCap: 1,
      fullyDilutedMarketCap: 1,
      volume24h: 1,
      circulatingSupply: 1,
      totalSupply: 1,
      maxSupply: 1,
      athUsd: 1,
      atlUsd: 1,
      usdQuote: 1,
      performance: 1,
      fomoScore: 1,
      rating: 1,
      fullness: 1,
      providerIds: 1,
      updatedAt: 1,
    };
  }

  private projectCategories(...rows: any[]): string[] {
    return this.uniqueStrings(
      rows.flatMap((row) => [
        row?.category,
        row?.niche,
        ...(Array.isArray(row?.topCategories) ? row.topCategories : []),
        ...(Array.isArray(row?.categories) ? row.categories : []),
        ...(Array.isArray(row?.metadata?.icodropsProfileOnly?.categories)
          ? row.metadata.icodropsProfileOnly.categories
          : []),
      ])
    );
  }

  private projectChains(...rows: any[]): string[] {
    return this.uniqueStrings(
      rows
        .flatMap((row) => [
          ...(Array.isArray(row?.blockchains) ? row.blockchains : []),
          ...(Array.isArray(row?.ecosystems) ? row.ecosystems : []),
          ...(Array.isArray(row?.metadata?.icodropsProfileOnly?.ecosystems)
            ? row.metadata.icodropsProfileOnly.ecosystems
            : []),
        ])
        .map((item) => this.firstString(item?.name, item))
    );
  }

  private peerScore(
    current: any,
    peer: any,
    currentRow: any,
    peerRow: any
  ): number {
    const currentCategories = new Set(
      this.projectCategories(currentRow).map((item) => item.toLowerCase())
    );
    const peerCategories = this.projectCategories(peerRow).map((item) =>
      item.toLowerCase()
    );
    const sharedCategories = peerCategories.filter((item) =>
      currentCategories.has(item)
    ).length;
    const marketScore = this.logSimilarity(
      current.marketCap,
      peer.marketCap,
      40
    );
    const fdvScore = this.logSimilarity(current.fdv, peer.fdv, 25);
    const raisedScore = this.logSimilarity(
      current.totalRaised,
      peer.totalRaised,
      20
    );
    const rankBoost = Math.max(
      0,
      10 - Math.log10(Math.max(Number(peerRow?.rank) || 9999, 1))
    );
    const fomoBoost = (this.firstNumber(peer.fomoScore) || 0) / 20;

    return (
      sharedCategories * 30 +
      marketScore +
      fdvScore +
      raisedScore +
      rankBoost +
      fomoBoost
    );
  }

  private logSimilarity(left: any, right: any, weight: number): number {
    const a = this.firstNumber(left);
    const b = this.firstNumber(right);
    if (a === undefined || b === undefined || a <= 0 || b <= 0) return 0;
    const distance = Math.abs(Math.log10(a) - Math.log10(b));
    return Math.max(0, weight - distance * weight * 0.7);
  }

  private hasComparisonRoi(project: any): boolean {
    return (
      this.firstNumber(project?.roiX, project?.currentRoiXFromIco) !==
        undefined ||
      this.firstNumber(project?.roiPercent, project?.currentRoiFromIco) !==
        undefined
    );
  }

  private hasMetric(project: any, metric: string): boolean {
    if (metric === "roi") return this.hasComparisonRoi(project);
    if (metric === "fdv")
      return (
        this.firstNumber(project?.fdv, project?.fullyDilutedMarketCap) !==
        undefined
      );
    return this.firstNumber(project?.marketCap) !== undefined;
  }

  private peerIsExcluded(peer: any, excluded: Set<string>): boolean {
    return [peer?.id, peer?.slug, peer?.name, peer?.symbol].some((key) =>
      excluded.has(this.normalizeLookupKey(key))
    );
  }

  private addProjectKeysToSet(
    set: Set<string>,
    project: ResolvedIcoComparisonProject
  ): void {
    [
      project.coingeckoId,
      project.slug,
      project.name,
      project.symbol,
      project.canonicalProjectId,
      project.marketAssetId,
      project.readModelId,
      this.toIdString(project.marketRow?._id),
      this.toIdString(project.icoRow?._id),
    ].forEach((item) => {
      const key = this.normalizeLookupKey(item);
      if (key) set.add(key);
    });
  }

  private buildRangeConfig(
    range: HistoryRange,
    endDateInput?: Date
  ): RangeConfig {
    const endDate = endDateInput || new Date();
    let startDate: Date | undefined;
    let bucketMs = 12 * 60 * 60 * 1000;
    let maxPoints = HISTORY_DISPLAY_MAX_POINTS;
    let adaptiveBucket = false;

    if (range === "30D") {
      startDate = new Date(endDate.getTime() - 30 * DAY_MS);
      bucketMs = 12 * 60 * 60 * 1000;
      maxPoints = HISTORY_DISPLAY_MAX_POINTS;
    } else if (range === "90D") {
      startDate = new Date(endDate.getTime() - 90 * DAY_MS);
      bucketMs = DAY_MS;
      maxPoints = HISTORY_DISPLAY_MAX_POINTS;
    } else if (range === "6M") {
      startDate = new Date(endDate.getTime() - 180 * DAY_MS);
      bucketMs = 2 * DAY_MS;
      maxPoints = HISTORY_DISPLAY_MAX_POINTS;
    } else if (range === "YTD") {
      startDate = new Date(Date.UTC(endDate.getUTCFullYear(), 0, 1));
      const daysInRange = Math.max(
        1,
        Math.ceil((endDate.getTime() - startDate.getTime()) / DAY_MS)
      );
      bucketMs =
        daysInRange <= 90
          ? DAY_MS
          : daysInRange <= 240
          ? 2 * DAY_MS
          : 3 * DAY_MS;
      maxPoints = HISTORY_DISPLAY_MAX_POINTS;
    } else {
      bucketMs = 30 * DAY_MS;
      maxPoints = HISTORY_DISPLAY_MAX_POINTS;
      adaptiveBucket = true;
    }

    return {
      range,
      startDate,
      endDate,
      bucketMs,
      bucketInterval: adaptiveBucket
        ? "adaptive"
        : this.formatBucketInterval(bucketMs),
      maxPoints,
      downsampleStrategy: "lttb_with_metric_anchors",
      adaptiveBucket,
    };
  }

  private normalizeRange(value: any): HistoryRange {
    const normalized = String(value || "30D").trim();
    if (["30D", "90D", "6M", "YTD", "Since ICO"].includes(normalized)) {
      return normalized as HistoryRange;
    }
    return "30D";
  }

  private normalizeSearchMetric(value: any): string {
    const normalized = String(value || "")
      .trim()
      .toLowerCase();
    if (["roi", "return"].includes(normalized)) return "roi";
    if (
      ["fdv", "fullydilutedmarketcap", "fully_diluted_market_cap"].includes(
        normalized
      )
    )
      return "fdv";
    return "marketCap";
  }

  private resolveHistoryBucketMs(rows: any[], rangeConfig: RangeConfig): number {
    if (!rangeConfig.adaptiveBucket || rows.length < 2) {
      return rangeConfig.bucketMs;
    }

    const timestamps = rows
      .map((row) => this.dateTime(row?.timestamp || row?.date))
      .filter((timestamp) => timestamp !== undefined) as number[];
    if (timestamps.length < 2) return rangeConfig.bucketMs;

    const spanMs = Math.max(...timestamps) - Math.min(...timestamps);
    if (spanMs <= 365 * DAY_MS) return 7 * DAY_MS;
    if (spanMs <= 3 * 365 * DAY_MS) return 14 * DAY_MS;
    return 30 * DAY_MS;
  }

  private bucketRows(rows: any[], bucketMs: number): any[] {
    const buckets = new Map<number, any>();

    for (const row of rows) {
      const timestamp = Number(row.timestamp);
      if (!Number.isFinite(timestamp)) continue;
      const bucketTimestamp = Math.floor(timestamp / bucketMs) * bucketMs;
      buckets.set(bucketTimestamp, {
        ...row,
        timestamp: bucketTimestamp,
      });
    }

    return Array.from(buckets.values()).sort(
      (left, right) => left.timestamp - right.timestamp
    );
  }

  private downsample(points: any[], maxPoints: number): any[] {
    const limit = Math.max(2, Math.floor(maxPoints));
    if (points.length <= limit) return points;
    if (limit <= 2) return [points[0], points[points.length - 1]];

    const importantIndexes = this.importantHistoryPointIndexes(points);
    const lttbLimit = Math.min(
      points.length,
      Math.max(3, limit - importantIndexes.size + 2)
    );
    const sampled = this.largestTriangleThreeBuckets(points, lttbLimit);

    return this.mergeHistorySamples(
      points,
      sampled,
      importantIndexes,
      limit
    );
  }

  private importantHistoryPointIndexes(points: any[]): Set<number> {
    const indexes = new Set<number>([0, points.length - 1]);
    const metrics = ["roiMultiplier", "value", "price", "marketCap", "fdv"];

    for (const metric of metrics) {
      let minValue = Number.POSITIVE_INFINITY;
      let maxValue = Number.NEGATIVE_INFINITY;
      let minIndex = -1;
      let maxIndex = -1;

      points.forEach((point, index) => {
        const value = this.toFiniteNumber(point?.[metric]);
        if (value === undefined) return;
        if (value < minValue) {
          minValue = value;
          minIndex = index;
        }
        if (value > maxValue) {
          maxValue = value;
          maxIndex = index;
        }
      });

      if (minIndex >= 0) indexes.add(minIndex);
      if (maxIndex >= 0) indexes.add(maxIndex);
    }

    return indexes;
  }

  private largestTriangleThreeBuckets(points: any[], threshold: number): any[] {
    if (threshold >= points.length) return points;
    if (threshold <= 2) return [points[0], points[points.length - 1]];

    const sampled: any[] = [points[0]];
    const bucketSize = (points.length - 2) / (threshold - 2);
    let previousIndex = 0;

    for (let bucketIndex = 0; bucketIndex < threshold - 2; bucketIndex += 1) {
      const avgRangeStart = Math.floor((bucketIndex + 1) * bucketSize) + 1;
      const avgRangeEnd = Math.min(
        Math.floor((bucketIndex + 2) * bucketSize) + 1,
        points.length
      );
      const average = this.averageHistoryPoint(
        points,
        avgRangeStart,
        avgRangeEnd
      );
      const candidateStart = Math.floor(bucketIndex * bucketSize) + 1;
      const candidateEnd = Math.min(
        Math.floor((bucketIndex + 1) * bucketSize) + 1,
        points.length - 1
      );
      const previousPoint = points[previousIndex];
      let selectedIndex = candidateStart;
      let maxArea = Number.NEGATIVE_INFINITY;

      for (
        let candidateIndex = candidateStart;
        candidateIndex < candidateEnd;
        candidateIndex += 1
      ) {
        const candidate = points[candidateIndex];
        const area = Math.abs(
          (this.historyPointX(previousPoint) - average.x) *
            (this.historyPointY(candidate) - this.historyPointY(previousPoint)) -
            (this.historyPointX(previousPoint) -
              this.historyPointX(candidate)) *
              (average.y - this.historyPointY(previousPoint))
        );
        if (area > maxArea) {
          maxArea = area;
          selectedIndex = candidateIndex;
        }
      }

      sampled.push(points[selectedIndex]);
      previousIndex = selectedIndex;
    }

    sampled.push(points[points.length - 1]);
    return sampled;
  }

  private averageHistoryPoint(
    points: any[],
    startIndex: number,
    endIndex: number
  ): { x: number; y: number } {
    let x = 0;
    let y = 0;
    let count = 0;

    for (let index = startIndex; index < endIndex; index += 1) {
      const point = points[index];
      if (!point) continue;
      x += this.historyPointX(point);
      y += this.historyPointY(point);
      count += 1;
    }

    if (!count) {
      const fallback = points[Math.min(points.length - 1, startIndex)] || {};
      return {
        x: this.historyPointX(fallback),
        y: this.historyPointY(fallback),
      };
    }

    return { x: x / count, y: y / count };
  }

  private mergeHistorySamples(
    points: any[],
    sampled: any[],
    importantIndexes: Set<number>,
    maxPoints: number
  ): any[] {
    const importantTimestamps = new Set<number>();
    const byTimestamp = new Map<number, any>();

    sampled.forEach((point) => {
      const timestamp = this.historyPointX(point);
      byTimestamp.set(timestamp, point);
    });
    importantIndexes.forEach((index) => {
      const point = points[index];
      if (!point) return;
      const timestamp = this.historyPointX(point);
      importantTimestamps.add(timestamp);
      byTimestamp.set(timestamp, point);
    });

    const merged = Array.from(byTimestamp.values()).sort(
      (left, right) => this.historyPointX(left) - this.historyPointX(right)
    );
    if (merged.length <= maxPoints) return merged;

    const required = merged.filter((point) =>
      importantTimestamps.has(this.historyPointX(point))
    );
    const optional = merged.filter(
      (point) => !importantTimestamps.has(this.historyPointX(point))
    );
    const optionalLimit = maxPoints - required.length;
    const limitedOptional =
      optionalLimit > 0 ? this.evenlySamplePoints(optional, optionalLimit) : [];

    return [...required, ...limitedOptional].sort(
      (left, right) => this.historyPointX(left) - this.historyPointX(right)
    );
  }

  private evenlySamplePoints(points: any[], maxPoints: number): any[] {
    if (points.length <= maxPoints) return points;
    if (maxPoints <= 0) return [];
    if (maxPoints === 1) return [points[0]];

    const step = (points.length - 1) / (maxPoints - 1);
    const result: any[] = [];

    for (let index = 0; index < maxPoints; index += 1) {
      result.push(points[Math.round(index * step)]);
    }

    return result.filter(
      (item, index, items) =>
        items.findIndex(
          (candidate) =>
            this.historyPointX(candidate) === this.historyPointX(item)
        ) === index
    );
  }

  private historyPointX(point: any): number {
    return this.toFiniteNumber(point?.timestamp) || 0;
  }

  private historyPointY(point: any): number {
    return (
      this.firstNumber(
        point?.roiMultiplier,
        point?.value,
        point?.price,
        point?.marketCap,
        point?.fdv
      ) || 0
    );
  }

  private formatBucketInterval(bucketMs: number): string {
    if (bucketMs % DAY_MS === 0) {
      const days = bucketMs / DAY_MS;
      return days === 1 ? "1d" : `${days}d`;
    }

    const hourMs = 60 * 60 * 1000;
    if (bucketMs % hourMs === 0) {
      const hours = bucketMs / hourMs;
      return hours === 1 ? "1h" : `${hours}h`;
    }

    return `${bucketMs}ms`;
  }

  private closestPoint(
    series: any[],
    timestamp: number,
    toleranceMs: number
  ): any | undefined {
    let best: any;
    let bestDiff = Number.POSITIVE_INFINITY;

    for (const point of series) {
      const diff = Math.abs(Number(point.timestamp) - timestamp);
      if (diff < bestDiff) {
        best = point;
        bestDiff = diff;
      }
    }

    return bestDiff <= toleranceMs ? best : undefined;
  }

  private dedupeTargets(targets: HistoryTarget[]): HistoryTarget[] {
    const seen = new Set<string>();

    return targets.filter((target) => {
      const key = this.normalizeLookupKey(
        target.id || target.slug || target.name
      );
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private allocationPercent(
    allocation: any[],
    needles: string[]
  ): number | undefined {
    const values = allocation
      .filter((item) =>
        needles.some((needle) =>
          String(item?.name || "")
            .toLowerCase()
            .includes(needle)
        )
      )
      .map((item) => this.firstNumber(item?.allocationPercent))
      .filter((value) => value !== undefined) as number[];
    if (!values.length) return undefined;
    return this.roundNumber(
      values.reduce((sum, value) => sum + value, 0),
      6
    );
  }

  private getIcoProfile(row: any): any {
    return row?.metadata?.icodropsProfileOnly || {};
  }

  private firstScreenshot(row: any): string | undefined {
    const profile = this.getIcoProfile(row);
    const screenshots = Array.isArray(profile?.screenshots)
      ? profile.screenshots
      : [];
    const images = Array.isArray(profile?.descriptionImages)
      ? profile.descriptionImages
      : [];
    return this.firstString(
      images[0],
      screenshots[0]?.url,
      screenshots[0]?.src,
      screenshots[0]
    );
  }

  private fdvRatio(row: any): number | undefined {
    const fdv = this.firstNumber(row?.fullyDilutedMarketCap);
    const price = this.firstNumber(row?.price, row?.usdQuote?.price);
    if (fdv === undefined || price === undefined || price <= 0)
      return undefined;
    return fdv / price;
  }

  private emptyHistoryResponse(range: HistoryRange): any {
    return {
      range,
      generatedAt: new Date().toISOString(),
      roiHistory: [],
      marketCapHistory: [],
      fdvHistory: [],
      peerComparisonHistory: [],
      industryAverageHistory: [],
      dataQuality: {
        sources: ["fomo-v2"],
        snapshots: 0,
        peers: 0,
        includeIndustry: false,
      },
    };
  }

  private humanizeRoundType(value: any): string | undefined {
    const text = this.firstString(value);
    if (!text || text === "unknown") return undefined;
    return text
      .split(/[_\-\s]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  private parseCsv(value: any): string[] {
    if (Array.isArray(value))
      return value.flatMap((item) => this.parseCsv(item));
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private uniqueStrings(values: any[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const value of values) {
      const text = this.firstString(value);
      if (!text) continue;
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(text);
    }

    return result;
  }

  private uniqueObjectIds(values: any[]): Types.ObjectId[] {
    const seen = new Set<string>();
    const result: Types.ObjectId[] = [];

    values.forEach((value) => {
      const id = this.toIdString(value);
      if (!id || !Types.ObjectId.isValid(id) || seen.has(id)) return;
      seen.add(id);
      result.push(new Types.ObjectId(id));
    });

    return result;
  }

  private isTruthy(value: any, fallback = false): boolean {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value;
    return ["1", "true", "yes", "on"].includes(
      String(value).trim().toLowerCase()
    );
  }

  private clampInt(
    value: any,
    fallback: number,
    min: number,
    max: number
  ): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, Math.floor(parsed)));
  }

  private normalizeLookupKey(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    const id = this.toIdString(value);
    return id && Types.ObjectId.isValid(id)
      ? new Types.ObjectId(id)
      : undefined;
  }

  private toIdString(value: any): string | undefined {
    if (!value) return undefined;
    return String(value);
  }

  private firstString(...values: any[]): string | undefined {
    for (const value of values) {
      if (typeof value === "number" && Number.isFinite(value))
        return String(value);
      if (typeof value !== "string") continue;
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
    return undefined;
  }

  private firstNumber(...values: any[]): number | undefined {
    for (const value of values) {
      const parsed = this.toFiniteNumber(value);
      if (parsed !== undefined) return parsed;
    }
    return undefined;
  }

  private toFiniteNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed =
      typeof value === "number"
        ? value
        : Number(String(value).replace(/[$,%\s]/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private sumNumbers(values: any[]): number | undefined {
    const numbers = values
      .map((value) => this.toFiniteNumber(value))
      .filter((value) => value !== undefined) as number[];
    if (!numbers.length) return undefined;
    return numbers.reduce((sum, value) => sum + value, 0);
  }

  private average(values: any[]): number | undefined {
    const numbers = values
      .map((value) => this.toFiniteNumber(value))
      .filter((value) => value !== undefined) as number[];
    if (!numbers.length) return undefined;
    return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
  }

  private median(values: any[]): number | undefined {
    const numbers = values
      .map((value) => this.toFiniteNumber(value))
      .filter((value) => value !== undefined)
      .sort((left, right) => left - right) as number[];
    if (!numbers.length) return undefined;
    const middle = Math.floor(numbers.length / 2);
    return numbers.length % 2
      ? numbers[middle]
      : (numbers[middle - 1] + numbers[middle]) / 2;
  }

  private percentile(values: any[], percentile: number): number | undefined {
    const numbers = values
      .map((value) => this.toFiniteNumber(value))
      .filter((value) => value !== undefined)
      .sort((left, right) => left - right) as number[];
    if (!numbers.length) return undefined;
    const index = Math.min(
      numbers.length - 1,
      Math.max(0, Math.floor((numbers.length - 1) * percentile))
    );
    return numbers[index];
  }

  private dateTime(value: any): number | undefined {
    const date = value instanceof Date ? value : new Date(value);
    const time = date.getTime();
    return Number.isFinite(time) ? time : undefined;
  }

  private toIso(value: any): string | undefined {
    const time = this.dateTime(value);
    return time ? new Date(time).toISOString() : undefined;
  }

  private roundNumber(value: number, precision = 4): number {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private cleanObject<T>(value: T): T {
    if (Array.isArray(value)) {
      return value
        .map((item) => this.cleanObject(item))
        .filter((item) => item !== undefined) as T;
    }
    if (
      !value ||
      typeof value !== "object" ||
      value instanceof Date ||
      value instanceof Types.ObjectId ||
      Buffer.isBuffer(value) ||
      typeof (value as any).toHexString === "function"
    ) {
      return value;
    }
    const result: Record<string, any> = {};

    Object.entries(value as Record<string, any>).forEach(([key, item]) => {
      if (item === undefined) return;
      result[key] = this.cleanObject(item);
    });

    return result as T;
  }
}
