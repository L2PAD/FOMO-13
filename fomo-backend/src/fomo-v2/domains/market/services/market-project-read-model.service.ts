import { Injectable, NotFoundException, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Types } from "mongoose";
import { MarketDataTier } from "src/coingecko/coingecko-market.types";
import { COINGECKO_TIERS } from "src/coingecko/config/coingecko-tier.config";
import { Coinmarketcap } from "src/coinmarketcap/models/coinmarketcap.model";
import {
  FomoV2CanonicalProject,
  FomoV2MarketAsset,
  FomoV2MarketProjectKind,
  FomoV2MarketProjectPerformance,
  FomoV2MarketProjectReadModel,
  FomoV2MarketProjectRoiMetric,
  FomoV2ProjectAssetLink,
  FomoV2ProjectMarketSnapshot,
  FomoV2SourceEntity,
} from "../models";
import { FomoV2BackerReadModel } from "../../backers";
import {
  FomoV2FundingRound,
  FomoV2FundingRoundParticipant,
} from "../../funding/models";
import { FomoV2EntityReactionService } from "../../reactions";
import { FomoV2EntityFlagService } from "../../flags";
import { FomoV2UnlockEvent } from "../../unlocks";
import {
  FomoV2TokenAllocation,
  FomoV2VestingRound,
  FomoV2VestingSchedule,
  FomoV2VestingSummary,
} from "../../vesting";
import { FomoV2ParserControlPolicyService } from "../../parser-control/services/parser-control-policy.service";

export interface FomoV2MarketReadModelMaterializeOptions {
  limit?: number;
  offset?: number;
  onlyTier?: MarketDataTier;
  write?: boolean;
  confirmWrite?: boolean;
  examplesLimit?: number;
  includeUnlinked?: boolean;
  /**
   * Preserve the source parser policy when this read model is rebuilt as a
   * downstream post-write effect of another managed pipeline.
   */
  writePolicyParserKey?: string;
  assertExecutionActive?: () => void | Promise<void>;
}

export interface FomoV2MarketReadModelMaterializeResult {
  mode: "dry-run" | "write";
  requestedLimit: number;
  scannedMarketAssets: number;
  built: number;
  written: number;
  skipped: {
    missingCanonicalLink: number;
    tierFiltered: number;
  };
  examples: {
    built: any[];
    missingCanonicalLink: any[];
  };
}

export interface FomoV2MarketReadModelCompatibilityOptions {
  fallback?: "none" | "legacy" | string;
}

export interface FomoV2CoreAssetUsdPrices {
  btcPrice: number;
  ethPrice: number;
}

export interface FomoV2MarketReadModelParityOptions {
  limit?: number;
  offset?: number;
  examplesLimit?: number;
}

export interface FomoV2MarketReadModelParityReport {
  source: "fomo-v2";
  scannedMarketAssets: number;
  readModelRowsLoaded: number;
  matched: {
    byMarketAssetId: number;
    byCanonicalProjectId: number;
    any: number;
  };
  missing: {
    readModelMarketAssetIds: string[];
    canonicalLinkMarketAssetIds: string[];
  };
  missingRequiredFields: Array<{
    id: string;
    name?: string;
    fields: string[];
  }>;
  staleMarketData: Array<{
    id: string;
    name?: string;
    marketDataUpdatedAt?: string;
  }>;
  examples: any[];
}

export type FomoV2MarketCategoryType = "recently" | "gainers" | "trending" | "accumulation";

interface MarketCategoryQueryResult {
  projects: any[];
  total: number;
  rows: any[];
}

interface V2IdentityContext {
  linksByMarketAssetId: Map<string, any[]>;
  canonicalById: Map<string, any>;
  currentReadModelByMarketAssetId: Map<string, any>;
}

interface MarketFundingOverview {
  fundraising: any[];
  totalRaised?: number;
  icoPrice?: Record<string, number>;
  icoRoundId?: string;
}

interface MarketVestingOverview {
  tokenAllocation: any[];
  vestingRounds: any[];
  vestingSchedule: any[];
  vestingTimeline: any[];
  vestingSummary?: any;
  events: any[];
  unlockingEvents: any[];
  nextUnlockingEvent?: any;
  sourceLinks: any[];
}

const MARKET_VISIBLE_RANK_FILTER = {
  $gte: COINGECKO_TIERS.HOT.minRank,
  $lte: COINGECKO_TIERS.WARM.maxRank,
};
const GLOBAL_MARKET_CAP_CACHE_TTL_MS = 60 * 1000;

@Injectable()
export class FomoV2MarketProjectReadModelService {
  private globalTotalMarketCapCache?: {
    expiresAt: number;
    value?: number;
  };

  constructor(
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly readModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(FomoV2MarketAsset.name)
    private readonly marketAssetModel: Model<FomoV2MarketAsset>,
    @InjectModel(FomoV2ProjectAssetLink.name)
    private readonly projectAssetLinkModel: Model<FomoV2ProjectAssetLink>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>,
    @InjectModel(FomoV2SourceEntity.name)
    private readonly sourceEntityModel: Model<FomoV2SourceEntity>,
    @InjectModel(FomoV2ProjectMarketSnapshot.name)
    private readonly marketSnapshotModel: Model<FomoV2ProjectMarketSnapshot>,
    @InjectModel(FomoV2MarketProjectPerformance.name)
    private readonly marketPerformanceModel: Model<FomoV2MarketProjectPerformance>,
    @InjectModel(FomoV2MarketProjectRoiMetric.name)
    private readonly marketRoiMetricModel: Model<FomoV2MarketProjectRoiMetric>,
    @InjectModel(FomoV2FundingRound.name)
    private readonly fundingRoundModel: Model<FomoV2FundingRound>,
    @InjectModel(FomoV2FundingRoundParticipant.name)
    private readonly fundingRoundParticipantModel: Model<FomoV2FundingRoundParticipant>,
    @InjectModel(FomoV2BackerReadModel.name)
    private readonly backerReadModel: Model<FomoV2BackerReadModel>,
    @InjectModel(FomoV2TokenAllocation.name)
    private readonly tokenAllocationModel: Model<FomoV2TokenAllocation>,
    @InjectModel(FomoV2VestingRound.name)
    private readonly vestingRoundModel: Model<FomoV2VestingRound>,
    @InjectModel(FomoV2VestingSchedule.name)
    private readonly vestingScheduleModel: Model<FomoV2VestingSchedule>,
    @InjectModel(FomoV2VestingSummary.name)
    private readonly vestingSummaryModel: Model<FomoV2VestingSummary>,
    @InjectModel(FomoV2UnlockEvent.name)
    private readonly unlockEventModel: Model<FomoV2UnlockEvent>,
    @InjectModel(Coinmarketcap.name)
    private readonly coinmarketcapModel: Model<Coinmarketcap>,
    private readonly reactionService: FomoV2EntityReactionService,
    private readonly flagService: FomoV2EntityFlagService,
    private readonly configService: ConfigService,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService,
  ) {}

  async materializeFromV2Identity(
    options: FomoV2MarketReadModelMaterializeOptions = {},
  ): Promise<FomoV2MarketReadModelMaterializeResult> {
    const write = options.write === true;
    if (write && options.confirmWrite !== true) {
      throw new Error("FOMO v2 market read-model write requires --confirm-write=true.");
    }
    await options.assertExecutionActive?.();
    if (write && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        String(options.writePolicyParserKey || "").trim() ||
          "market:coingecko"
      );
    }

    const limit = this.positiveInteger(options.limit, 100);
    const offset = this.nonNegativeInteger(options.offset, 0);
    const examplesLimit = this.nonNegativeInteger(options.examplesLimit, 10);
    const marketAssets = await this.loadRankedMarketAssets(limit, offset);
    const context = await this.loadV2IdentityContext(marketAssets);
    await options.assertExecutionActive?.();
    const rows: any[] = [];
    const skipped = {
      missingCanonicalLink: 0,
      tierFiltered: 0,
    };
    const examples = {
      built: [] as any[],
      missingCanonicalLink: [] as any[],
    };

    for (const [marketAssetIndex, marketAsset] of (
      marketAssets as any[]
    ).entries()) {
      if (marketAssetIndex % 100 === 0) {
        await options.assertExecutionActive?.();
      }
      const link = this.selectProjectAssetLink(context.linksByMarketAssetId.get(this.toIdString(marketAsset._id)) || []);
      const canonicalProject = link?.canonicalProjectId
        ? context.canonicalById.get(this.toIdString(link.canonicalProjectId))
        : undefined;
      const currentReadModel = context.currentReadModelByMarketAssetId.get(this.toIdString(marketAsset._id));

      if (!canonicalProject && options.includeUnlinked !== true) {
        skipped.missingCanonicalLink += 1;
        this.pushExample(
          examples.missingCanonicalLink,
          {
            marketAssetId: this.toIdString(marketAsset._id),
            name: marketAsset.name,
            symbol: marketAsset.symbol,
            coingeckoId: marketAsset.providerIds?.coingeckoId,
          },
          examplesLimit,
        );
        continue;
      }

      const row = this.buildReadModelRow(marketAsset, link, canonicalProject, currentReadModel);

      if (options.onlyTier && row.tier !== options.onlyTier) {
        skipped.tierFiltered += 1;
        continue;
      }

      rows.push(row);
      this.pushExample(
        examples.built,
        {
          canonicalProjectId: this.toIdString(row.canonicalProjectId),
          marketAssetId: this.toIdString(row.marketAssetId),
          name: row.name,
          symbol: row.symbol,
          rank: row.rank,
          tier: row.tier,
          projectKind: row.projectKind,
        },
        examplesLimit,
      );
    }

    let written = 0;
    if (write && rows.length) {
      await options.assertExecutionActive?.();
      const now = new Date();
      const operations = rows.map((row) => {
        const { _id, createdAt, ...rawSet } = this.cleanObject(row);
        const set = this.omitMaterializedMarketDataFields(rawSet);
        const unset = this.cleanObject({
          rank: row.rank === undefined ? "" : undefined,
          tier: row.tier === undefined ? "" : undefined,
        });
        return {
          updateOne: {
            filter: { marketAssetId: row.marketAssetId },
            update: {
              $set: {
                ...set,
                updatedAt: now,
              },
              ...(Object.keys(unset).length ? { $unset: unset } : {}),
              $setOnInsert: {
                createdAt: now,
              },
            },
            upsert: true,
          },
        };
      });
      const result = await this.readModel.bulkWrite(operations, { ordered: false });
      await options.assertExecutionActive?.();
      written = Number((result as any).upsertedCount || 0) + Number((result as any).modifiedCount || 0);
    }

    return {
      mode: write ? "write" : "dry-run",
      requestedLimit: limit,
      scannedMarketAssets: marketAssets.length,
      built: rows.length,
      written,
      skipped,
      examples,
    };
  }

  async getCompatibleMarketProjects(
    query: any = {},
    options: FomoV2MarketReadModelCompatibilityOptions = {},
  ): Promise<{ projects: any[]; total: number; debug?: any }> {
    const skip = this.nonNegativeInteger(query?.offset, 0);
    const limit = this.positiveInteger(query?.limit, 20);
    const parsedQuery = this.parseQueryString(query);
    const filter = this.mergeReadModelFilters(
      this.buildMarketTableDataFilter(),
      this.buildReadModelFilter(parsedQuery),
    );
    const sortKey = this.getSortKey(query?.sortKey);
    const sortDirection: 1 | -1 = Number(query?.sortNumberValue) === -1 ? -1 : 1;

    const [total, rows] = await Promise.all([
      this.readModel.countDocuments(filter),
      this.readModel
        .aggregate([
          { $match: filter },
          {
            $addFields: {
              __rankSort: {
                $cond: [{ $gt: ["$rank", 0] }, "$rank", Number.MAX_SAFE_INTEGER],
              },
              ...(sortKey
                ? {
                    __sortValue:
                      sortKey === "rank"
                        ? {
                            $cond: [
                              { $gt: ["$rank", 0] },
                              "$rank",
                              Number.MAX_SAFE_INTEGER,
                            ],
                          }
                        : `$${sortKey}`,
                    __sortMissing: {
                      $cond: [
                        sortKey === "rank"
                          ? { $gt: ["$rank", 0] }
                          : { $ne: [{ $ifNull: [`$${sortKey}`, null] }, null] },
                        0,
                        1,
                      ],
                    },
                  }
                : {}),
            },
          },
          {
            $sort: sortKey
              ? { __sortMissing: 1, __sortValue: sortDirection, __rankSort: 1, _id: 1 }
              : { __rankSort: 1, _id: 1 },
          },
          { $skip: skip },
          { $limit: limit },
          { $project: { __rankSort: 0, __sortValue: 0, __sortMissing: 0 } },
        ])
        .exec(),
    ]);

    return {
      projects: rows.map((row) => this.toLegacyProjectShape(row, "v2_read_model")),
      total,
      debug: {
        source: "fomo-v2",
        readModelRows: rows.length,
        rankSort: "positive_rank_first_zero_null_last",
        sortKey,
        fallbackRequested: options.fallback,
        fallbackApplied: false,
      },
    };
  }

  async searchPortfolioAssets(query = "", limit = 20): Promise<any[]> {
    const normalizedQuery = String(query || "").trim();
    const safeLimit = Math.min(this.positiveInteger(limit, 20), 50);
    const searchFilter = normalizedQuery
      ? {
          $or: [
            { name: { $regex: new RegExp(this.escapeRegExp(normalizedQuery), "i") } },
            { symbol: { $regex: new RegExp(this.escapeRegExp(normalizedQuery), "i") } },
            { slug: { $regex: new RegExp(this.escapeRegExp(normalizedQuery), "i") } },
            { niche: { $regex: new RegExp(this.escapeRegExp(normalizedQuery), "i") } },
          ],
        }
      : {};
    const filter = this.mergeReadModelFilters(
      this.buildMarketTableDataFilter(),
      searchFilter,
    );

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
        { $sort: { __rankSort: 1, marketCap: -1, _id: 1 } },
        { $limit: safeLimit },
        { $project: { __rankSort: 0 } },
      ])
      .exec();

    return rows.map((row) => this.toLegacyProjectShape(row, "v2_portfolio_asset"));
  }

  async getCoreAssetUsdPrices(): Promise<FomoV2CoreAssetUsdPrices> {
    try {
      const rows = await this.readModel
        .find({
          trading: "CURRENTLY_TRADING",
          status: "active",
          price: { $gt: 0 },
          "providerIds.coingeckoId": { $in: ["bitcoin", "ethereum"] },
        })
        .select({ symbol: 1, niche: 1, price: 1, rank: 1, providerIds: 1 })
        .sort({ rank: 1, _id: 1 })
        .limit(2)
        .lean()
        .exec();

      const prices = rows.reduce(
        (result, row: any) => {
          const price = this.toFiniteNumber(row.price);
          const identifiers = [row.symbol, row.niche]
            .map((value) => this.firstString(value)?.toUpperCase())
            .filter(Boolean);
          const coingeckoId = this.firstString(
            row.providerIds?.coingeckoId,
          )?.toLowerCase();

          if (price && price > 0) {
            if (coingeckoId === "bitcoin" || identifiers.includes("BTC")) {
              result.BTC ??= price;
            }
            if (coingeckoId === "ethereum" || identifiers.includes("ETH")) {
              result.ETH ??= price;
            }
          }

          return result;
        },
        {} as Partial<Record<"BTC" | "ETH", number>>,
      );

      return {
        btcPrice: prices.BTC || 1,
        ethPrice: prices.ETH || 1,
      };
    } catch {
      return { btcPrice: 1, ethPrice: 1 };
    }
  }

  async getMarketCategories(): Promise<any> {
    const fields = this.getMarketCategoryProjectProjection();
    const [categoriesResult, hotRows] = await Promise.all([
      this.readModel
        .aggregate([
          ...this.buildMarketEligibilityStages(),
          {
            $facet: {
              recentlyAdded: this.buildMarketCategoryFacet("recently", 20, fields),
              topGainers: this.buildMarketCategoryFacet("gainers", 20, fields),
              trending: this.buildMarketCategoryFacet("trending", 20, fields),
              accumulation: this.buildMarketCategoryFacet("accumulation", 20, fields),
            },
          },
        ])
        .allowDiskUse(true)
        .exec(),
      this.readModel
        .aggregate([
          ...this.buildMarketEligibilityStages(),
          { $sort: { rank: 1, marketCap: -1, _id: 1 } },
          { $limit: 100 },
          { $sort: { marketCap: -1, volume24h: -1, rank: 1 } },
          { $limit: 20 },
          ...this.buildCanonicalScoreFallbackStages(),
          { $project: fields },
        ])
        .allowDiskUse(true)
        .exec(),
    ]);
    const categories = categoriesResult[0] || {};

    return {
      recentlyAdded: this.toLegacyProjectShapes(categories.recentlyAdded, "v2_read_model_category_recently"),
      topGainers: this.toLegacyProjectShapes(categories.topGainers, "v2_read_model_category_gainers"),
      trending: this.toLegacyProjectShapes(categories.trending, "v2_read_model_category_trending"),
      accumulation: this.toLegacyProjectShapes(categories.accumulation, "v2_read_model_category_accumulation"),
      hotProjects: this.toLegacyProjectShapes(hotRows, "v2_read_model_category_hot"),
      debug: {
        source: "fomo-v2",
        categories: {
          recentlyAdded: categories.recentlyAdded?.length || 0,
          topGainers: categories.topGainers?.length || 0,
          trending: categories.trending?.length || 0,
          accumulation: categories.accumulation?.length || 0,
          hotProjects: hotRows.length,
        },
      },
    };
  }

  async getMarketCategory(
    type: FomoV2MarketCategoryType,
    query: any = {},
  ): Promise<{ projects: any[]; total: number; debug?: any }> {
    const categoryType = this.normalizeMarketCategoryType(type);
    const skip = this.nonNegativeInteger(query?.offset, 0);
    const limit = this.positiveInteger(query?.limit, 20);
    const parsedQuery = this.parseQueryString(query);
    const filter = this.buildReadModelFilter(parsedQuery);
    const fields = this.getMarketCategoryProjectProjection();
    const freshResult = await this.runMarketCategoryQuery(categoryType, filter, skip, limit, fields, true);
    const fallbackApplied = freshResult.total === 0;
    const result = fallbackApplied
      ? await this.runMarketCategoryQuery(categoryType, filter, skip, limit, fields, false)
      : freshResult;

    return {
      projects: result.projects,
      total: result.total,
      debug: {
        source: "fomo-v2",
        categoryType,
        rows: result.rows.length,
        fallbackApplied,
        freshness: fallbackApplied ? "stale_allowed" : "fresh_only",
      },
    };
  }

  private async runMarketCategoryQuery(
    categoryType: FomoV2MarketCategoryType,
    filter: Record<string, any>,
    skip: number,
    limit: number,
    fields: Record<string, any>,
    requireFreshMarketData: boolean,
  ): Promise<MarketCategoryQueryResult> {
    const pipeline: any[] = [
      ...this.buildMarketEligibilityStages({ requireFreshMarketData }),
      this.buildMarketCategoryFilterStage(categoryType),
      ...(Object.keys(filter).length > 0 ? [{ $match: filter }] : []),
      this.buildMarketCategoryScoreStage(categoryType),
      { $sort: this.getMarketCategorySort(categoryType) },
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          projects: [
            { $skip: skip },
            { $limit: limit },
            ...this.buildCanonicalScoreFallbackStages(),
            { $project: fields },
          ],
        },
      },
    ];
    const result = await this.readModel.aggregate(pipeline).allowDiskUse(true).exec();
    const total = result[0]?.totalCount?.[0]?.count || 0;
    const rows = result[0]?.projects || [];

    return {
      projects: this.toLegacyProjectShapes(rows, `v2_read_model_category_${categoryType}`),
      total,
      rows,
    };
  }

  async getMarketProjectDetailByCoinGeckoId(
    coingeckoId: string,
    userId?: string
  ): Promise<any> {
    const normalizedCoinGeckoId = this.normalizeLookupKey(coingeckoId);
    if (!normalizedCoinGeckoId) throw new NotFoundException("FOMO v2 market project not found.");

    const row = await this.readModel
      .findOne({
        "providerIds.coingeckoId": normalizedCoinGeckoId,
        trading: "CURRENTLY_TRADING",
        status: "active",
      })
      .lean();

    if (!row) throw new NotFoundException("FOMO v2 market project not found.");

    const marketAssetId = row.marketAssetId
      ? new Types.ObjectId(this.toIdString(row.marketAssetId))
      : undefined;
    const canonicalProjectId = row.canonicalProjectId
      ? new Types.ObjectId(this.toIdString(row.canonicalProjectId))
      : undefined;

    const [
      marketAsset,
      snapshots,
      vestingOverview,
      canonicalProject,
      snapshotStats,
      performanceDoc,
      roiMetricDoc,
      globalTotalMarketCap,
      reactionState,
      flagState,
    ] = await Promise.all([
      marketAssetId ? this.marketAssetModel.findById(marketAssetId).lean() : Promise.resolve(null),
      marketAssetId
        ? this.marketSnapshotModel
            .find({
              marketAssetId,
              provider: "coingecko",
              priceUsd: { $gt: 0 },
            })
            .sort({ timestamp: -1 })
            .limit(1500)
            .lean()
        : Promise.resolve([]),
      this.buildMarketVestingOverview(row, {}, { includeEvents: false }),
      canonicalProjectId ? this.canonicalProjectModel.findById(canonicalProjectId).lean() : Promise.resolve(null),
      marketAssetId ? this.loadSnapshotMarketStats(marketAssetId, row) : Promise.resolve({}),
      marketAssetId ? this.marketPerformanceModel.findOne({ marketAssetId }).lean() : Promise.resolve(null),
      marketAssetId ? this.marketRoiMetricModel.findOne({ marketAssetId }).lean() : Promise.resolve(null),
      this.loadLatestGlobalTotalMarketCap(),
      this.reactionService.getReactionState(
        "canonicalProject",
        canonicalProjectId,
        userId
      ),
      this.flagService.getFlagState(
        "market_project",
        canonicalProjectId || marketAssetId || row._id
      ),
    ]);

    const detailRow = this.resolveMarketPerformanceDetail(
      this.withMarketDetailFallbacks(row, canonicalProject, snapshotStats),
      performanceDoc,
    );
    const project = this.toLegacyProjectShape(detailRow, "v2_market_detail", globalTotalMarketCap);
    const projectWithoutFundraising = { ...project };
    delete projectWithoutFundraising.fundraising;
    const categories = this.uniqueStrings([
      ...(Array.isArray(detailRow.topCategories) ? detailRow.topCategories : []),
      ...(Array.isArray(detailRow.categories) ? detailRow.categories : []),
      detailRow.category,
      detailRow.niche,
    ]);
    const socialmedia = this.uniqueSocialLinks(this.normalizeSocialMedia(detailRow.socialmedia));
    const website = this.uniqueStrings(Array.isArray(detailRow.website) ? detailRow.website : []);
    const explorers = this.uniqueStrings(Array.isArray(detailRow.explorers) ? detailRow.explorers : []);
    const bridge = this.uniqueStrings(Array.isArray(detailRow.bridge) ? detailRow.bridge : []);
    const contracts = this.buildMarketContracts(detailRow, marketAsset);
    const chartHistory = this.buildMarketChartHistory(snapshots);
    const descriptionText = detailRow.descriptionText;
    const roiMetrics = this.buildMarketRoiLegacyFields(roiMetricDoc);
    let icoPrice = roiMetrics.icoPrice || detailRow.icoPrice;
    let xfromIco = roiMetrics.xfromIco || detailRow.xfromIco || this.buildMarketRoi(detailRow, icoPrice);
    let totalRaised = roiMetrics.totalRaised ?? detailRow.totalRaised;

    if ((!icoPrice || totalRaised === undefined) && !roiMetricDoc) {
      const fundingOverview = await this.buildMarketFundingOverview(row);
      icoPrice = icoPrice || fundingOverview.icoPrice;
      xfromIco = xfromIco || this.buildMarketRoi(detailRow, icoPrice);
      totalRaised = totalRaised ?? fundingOverview.totalRaised;
    }

    return this.cleanObject({
      ...projectWithoutFundraising,
      coingeckoId: normalizedCoinGeckoId,
      readModelId: this.toIdString(row._id),
      type: categories[0] || project.category || project.niche,
      category: categories[0] || project.category,
      categories,
      topCategories: categories.slice(0, 5),
      contracts,
      tokenAddress: contracts[0]?.contract,
      smartContracts: contracts,
      website,
      socialmedia,
      explorers,
      bridge,
      likes: reactionState.likes,
      dislikes: reactionState.dislikes,
      likesCount: reactionState.likesCount,
      dislikesCount: reactionState.dislikesCount,
      userReaction: reactionState.userReaction,
      reactionCounts: {
        like: reactionState.likesCount,
        dislike: reactionState.dislikesCount,
      },
      greenFlagsList: flagState.greenFlagsList,
      yellowFlagsList: flagState.yellowFlagsList,
      redFlagsList: flagState.redFlagsList,
      greenFlags: flagState.greenFlagsCount,
      yellowFlags: flagState.yellowFlagsCount,
      redFlags: flagState.redFlagsCount,
      flagCounts: {
        green: flagState.greenFlagsCount,
        yellow: flagState.yellowFlagsCount,
        red: flagState.redFlagsCount,
      },
      icoPrice,
      xfromIco,
      totalRaised,
      tokenDistribution: vestingOverview.tokenAllocation,
      allocations: vestingOverview.tokenAllocation,
      totalAllocation: vestingOverview.tokenAllocation,
      vestingSummary: vestingOverview.vestingSummary,
      description: descriptionText,
      descriptionText,
      bio: detailRow.bio,
      history: chartHistory,
      marketCharts: {
        source: "project_market_snapshots",
        points: chartHistory.length,
      },
      performanceMissing: detailRow.performanceMissing,
      performanceMeta: detailRow.performanceMeta,
      _debug: {
        ...(project._debug || {}),
        source: "v2_market_detail",
        marketAssetId: this.toIdString(marketAsset?._id),
        marketSnapshots: chartHistory.length,
        performanceSource: detailRow.performanceSource,
        snapshotStatsSource: snapshotStats.source,
        tokenAllocationItems: vestingOverview.tokenAllocation.length,
      },
    });
  }

  async getMarketProjectFundraising(slugOrId: string, query: any = {}): Promise<any> {
    const row = await this.findMarketReadModelForUnlocks(slugOrId, query);
    if (!row) throw new NotFoundException("FOMO v2 market project not found.");

    const project = this.cleanObject({
      id: this.toIdString(row.canonicalProjectId) || this.toIdString(row.marketAssetId) || this.toIdString(row._id),
      name: row.name,
      symbol: row.symbol || null,
      slug: row.slug,
      logo: row.logo || null,
      isVestingReview: Boolean(row.isVestingReview),
      coingeckoId: row.providerIds?.coingeckoId,
      canonicalProjectId: this.toIdString(row.canonicalProjectId),
      marketAssetId: this.toIdString(row.marketAssetId),
    });
    const fundingOverview = await this.buildMarketFundingOverview(row);

    return this.cleanObject({
      project,
      source: "fomo-v2",
      status: fundingOverview.fundraising.length ? "available" : "not_available",
      dataQuality: {
        source: "fomo-v2",
        fundingRounds: fundingOverview.fundraising.length,
      },
      fundraising: fundingOverview.fundraising,
      totalRaised: fundingOverview.totalRaised,
      icoPrice: fundingOverview.icoPrice,
      icoRoundId: fundingOverview.icoRoundId,
      sourceRefs: {
        fomoV2: {
          readModelId: this.toIdString(row?._id),
          canonicalProjectId: this.toIdString(row?.canonicalProjectId),
          marketAssetId: this.toIdString(row?.marketAssetId),
          providerIds: row?.providerIds || {},
        },
      },
    });
  }

  async getMarketProjectUnlocks(slugOrId: string, query: any = {}): Promise<any> {
    const row = await this.findMarketReadModelForUnlocks(slugOrId, query);
    if (!row) throw new NotFoundException("FOMO v2 market project not found.");

    const project = this.cleanObject({
      id: this.toIdString(row.canonicalProjectId) || this.toIdString(row.marketAssetId) || this.toIdString(row._id),
      name: row.name,
      symbol: row.symbol || null,
      slug: row.slug,
      logo: row.logo || null,
      isVestingReview: Boolean(row.isVestingReview),
      coingeckoId: row.providerIds?.coingeckoId,
      canonicalProjectId: this.toIdString(row.canonicalProjectId),
      marketAssetId: this.toIdString(row.marketAssetId),
    });

    const vestingOverview = await this.buildMarketVestingOverview(row, query, { includeEvents: true });
    const hasVestingData = this.hasMarketVestingData(vestingOverview);

    if (!hasVestingData) {
      return {
        ...this.emptyMarketProjectUnlocksPayload(project, row, "no_v2_vesting_or_unlocks_data"),
        tokenAllocation: [],
        vestingRounds: [],
        vestingSchedule: [],
        vestingTimeline: [],
        events: [],
        unlockingEvents: [],
        nextUnlockingEvent: null,
        sourceLinks: [],
      };
    }

    return this.cleanObject({
      project,
      source: "fomo-v2",
      status: "available",
      dataQuality: {
        source: "fomo-v2",
        tokenAllocationItems: vestingOverview.tokenAllocation.length,
        vestingRounds: vestingOverview.vestingRounds.length,
        vestingSchedule: vestingOverview.vestingSchedule.length,
        vestingTimeline: vestingOverview.vestingTimeline.length,
        events: vestingOverview.events.length,
        unlockingEvents: vestingOverview.unlockingEvents.length,
      },
      tokenAllocation: vestingOverview.tokenAllocation,
      vestingRounds: vestingOverview.vestingRounds,
      vestingSchedule: vestingOverview.vestingSchedule,
      vestingTimeline: vestingOverview.vestingTimeline,
      vestingSummary: vestingOverview.vestingSummary,
      events: vestingOverview.events,
      unlockingEvents: vestingOverview.unlockingEvents,
      nextUnlockingEvent: vestingOverview.nextUnlockingEvent || null,
      sourceLinks: vestingOverview.sourceLinks,
      sourceRefs: {
        fomoV2: {
          readModelId: this.toIdString(row?._id),
          canonicalProjectId: this.toIdString(row?.canonicalProjectId),
          marketAssetId: this.toIdString(row?.marketAssetId),
          providerIds: row?.providerIds || {},
        },
      },
    });
  }

  async getEchoProjectDetailBySlug(slug: string, userId?: string): Promise<any> {
    const normalizedSlug = this.normalizeSlug(slug);
    if (!normalizedSlug) throw new NotFoundException("FOMO v2 echo project not found.");

    const canonicalProject = await this.findCanonicalProjectBySlug(normalizedSlug);
    if (!canonicalProject?._id) throw new NotFoundException("FOMO v2 echo project not found.");

    const canonicalProjectId = new Types.ObjectId(this.toIdString(canonicalProject._id));
    const [marketReadModel, globalTotalMarketCap, reactionState] = await Promise.all([
      this.readModel.findOne({ canonicalProjectId }).lean(),
      this.loadLatestGlobalTotalMarketCap(),
      this.reactionService.getReactionState(
        "canonicalProject",
        canonicalProjectId,
        userId
      ),
    ]);
    const marketShape = marketReadModel
      ? this.toLegacyProjectShape(marketReadModel, "v2_echo_market_counterpart", globalTotalMarketCap)
      : {};
    const categories = this.uniqueStrings([
      ...(Array.isArray(marketReadModel?.topCategories) ? marketReadModel.topCategories : []),
      ...(Array.isArray(marketReadModel?.categories) ? marketReadModel.categories : []),
      marketReadModel?.category,
      marketReadModel?.niche,
    ]);
    const symbol = this.firstString(canonicalProject.symbol, marketShape.symbol);
    const name = this.firstString(canonicalProject.name, marketShape.name, normalizedSlug) || normalizedSlug;
    const projectSlug = this.firstString(canonicalProject.slug, normalizedSlug) || normalizedSlug;
    const logo = this.firstString(marketShape.logo);

    return this.cleanObject({
      _id: this.toIdString(canonicalProject._id),
      id: this.toIdString(canonicalProject._id),
      canonicalProjectId: this.toIdString(canonicalProject._id),
      marketAssetId: marketShape.marketAssetId,
      legacyProjectId: marketShape.legacyProjectId,
      projectType: "project",
      projectKind: "echo",
      projectStatus: "active",
      status: canonicalProject.status === "deprecated" ? "Ended" : "Active",
      source: "fomo-v2",
      name,
      slug: projectSlug,
      sourceId: projectSlug,
      symbol,
      ticker: symbol,
      isVestingReview: Boolean(canonicalProject.isVestingReview || marketShape.isVestingReview),
      niche: this.firstString(categories[0], symbol),
      category: categories[0],
      categories,
      ecosystems: [],
      launchpads: [],
      tags: [],
      logo,
      description: marketReadModel?.descriptionText,
      descriptionText: marketReadModel?.descriptionText,
      bio: marketReadModel?.bio,
      socialmedia: this.normalizeSocialMedia(marketReadModel?.socialmedia),
      website: Array.isArray(marketReadModel?.website) ? marketReadModel.website : [],
      likes: reactionState.likes,
      dislikes: reactionState.dislikes,
      likesCount: reactionState.likesCount,
      dislikesCount: reactionState.dislikesCount,
      userReaction: reactionState.userReaction,
      reactionCounts: {
        like: reactionState.likesCount,
        dislike: reactionState.dislikesCount,
      },
      price: marketShape.price,
      priceChange: marketShape.priceChange,
      usdQuote: marketShape.usdQuote,
      marketCap: marketShape.marketCap,
      fullyDilutedMarketCap: marketShape.fullyDilutedMarketCap,
      volume24h: marketShape.volume24h,
      volume24hChange: marketShape.volume24hChange,
      circulatingSupply: marketShape.circulatingSupply,
      circulatingSupplyPercent: marketShape.circulatingSupplyPercent,
      totalSupply: marketShape.totalSupply,
      maxSupply: marketShape.maxSupply,
      rank: marketShape.rank,
      chart7d: marketShape.chart7d,
      providerIds: {
        ...(canonicalProject.providerIds || {}),
        ...(marketShape.providerIds || {}),
      },
      coingeckoId: marketShape.coingeckoId || canonicalProject.providerIds?.coingeckoId,
      marketDataSource: marketReadModel
        ? {
            projectId: this.toIdString(marketReadModel._id),
            slug: marketReadModel.slug,
            symbol: marketReadModel.symbol,
            type: "market",
            source: "fomo-v2",
          }
        : undefined,
      sourceCoverage: {
        source: "fomo-v2",
        canonicalProject: canonicalProject.sourceEvidence,
        market: marketReadModel?.sourceCoverage,
      },
      _debug: {
        source: "v2_echo_detail",
        canonicalProjectId: this.toIdString(canonicalProject._id),
        marketReadModelId: this.toIdString(marketReadModel?._id),
      },
    });
  }

  async buildParityReport(
    options: FomoV2MarketReadModelParityOptions = {},
  ): Promise<FomoV2MarketReadModelParityReport> {
    const limit = this.positiveInteger(options.limit, 100);
    const offset = this.nonNegativeInteger(options.offset, 0);
    const examplesLimit = this.nonNegativeInteger(options.examplesLimit, 10);
    const marketAssets = await this.loadRankedMarketAssets(limit, offset);
    const context = await this.loadV2IdentityContext(marketAssets);
    const marketAssetIds = marketAssets.map((asset: any) => this.toIdString(asset._id)).filter(Boolean);
    const canonicalIds = Array.from(context.canonicalById.keys());
    const or: any[] = [];

    if (marketAssetIds.length) or.push({ marketAssetId: { $in: marketAssetIds.map((id) => new Types.ObjectId(id)) } });
    if (canonicalIds.length) or.push({ canonicalProjectId: { $in: canonicalIds.map((id) => new Types.ObjectId(id)) } });

    const readRows = or.length ? await this.readModel.find({ $or: or }).lean() : [];
    const readRowsByMarketAssetId = new Map(readRows.map((row: any) => [this.toIdString(row.marketAssetId), row]));
    const readRowsByCanonicalProjectId = new Map(
      readRows
        .filter((row: any) => row.canonicalProjectId)
        .map((row: any) => [this.toIdString(row.canonicalProjectId), row]),
    );
    const matchedByMarketAssetId = marketAssetIds.filter((id) => readRowsByMarketAssetId.has(id));
    const matchedByCanonicalProjectId = canonicalIds.filter((id) => readRowsByCanonicalProjectId.has(id));
    const canonicalLinkedMarketAssetIds = new Set<string>();

    for (const [marketAssetId, links] of context.linksByMarketAssetId.entries()) {
      if (this.selectProjectAssetLink(links)?.canonicalProjectId) {
        canonicalLinkedMarketAssetIds.add(marketAssetId);
      }
    }

    const missingRequiredFields = readRows
      .map((row: any) => {
        const legacyShape = this.toLegacyProjectShape(row, "v2_read_model");
        return {
          id: String(legacyShape._id || ""),
          name: legacyShape.name,
          fields: this.missingRequiredFields(legacyShape),
        };
      })
      .filter((item) => item.fields.length)
      .slice(0, examplesLimit);
    const staleMarketData = readRows
      .filter((row: any) => this.isStaleMarketData(row.marketDataUpdatedAt))
      .map((row: any) => ({
        id: this.toIdString(row.marketAssetId),
        name: row.name,
        marketDataUpdatedAt: row.marketDataUpdatedAt ? new Date(row.marketDataUpdatedAt).toISOString() : undefined,
      }))
      .slice(0, examplesLimit);
    const missingReadModelMarketAssetIds = marketAssetIds
      .filter((id) => !readRowsByMarketAssetId.has(id))
      .slice(0, examplesLimit);
    const missingCanonicalLinkMarketAssetIds = marketAssetIds
      .filter((id) => !canonicalLinkedMarketAssetIds.has(id))
      .slice(0, examplesLimit);

    return {
      source: "fomo-v2",
      scannedMarketAssets: marketAssets.length,
      readModelRowsLoaded: readRows.length,
      matched: {
        byMarketAssetId: matchedByMarketAssetId.length,
        byCanonicalProjectId: matchedByCanonicalProjectId.length,
        any: new Set([...matchedByMarketAssetId, ...matchedByCanonicalProjectId]).size,
      },
      missing: {
        readModelMarketAssetIds: missingReadModelMarketAssetIds,
        canonicalLinkMarketAssetIds: missingCanonicalLinkMarketAssetIds,
      },
      missingRequiredFields,
      staleMarketData,
      examples: marketAssets
        .slice(0, examplesLimit)
        .map((asset: any) => {
          const link = this.selectProjectAssetLink(context.linksByMarketAssetId.get(this.toIdString(asset._id)) || []);
          const canonicalProject = link?.canonicalProjectId
            ? context.canonicalById.get(this.toIdString(link.canonicalProjectId))
            : undefined;
          return {
            marketAssetId: this.toIdString(asset._id),
            canonicalProjectId: this.toIdString(canonicalProject?._id),
            readModelExists: readRowsByMarketAssetId.has(this.toIdString(asset._id)),
            name: asset.name,
            symbol: asset.symbol,
            rank: asset.metadata?.marketCapRank,
          };
        }),
    };
  }

  toLegacyProjectShape(row: any, source = "v2_read_model", globalTotalMarketCap?: number): any {
    const routeId =
      row.legacyRouteId ||
      this.toIdString(row.legacyProjectId) ||
      this.toIdString(row.canonicalProjectId) ||
      this.toIdString(row.marketAssetId) ||
      this.toIdString(row._id);
    const usdQuote = row.usdQuote || {};
    const marketCap = this.firstPositiveNumber(row.marketCap, usdQuote.market_cap);
    const volume24h = this.firstPositiveNumber(row.volume24h, usdQuote.volume_24h);
    const volumeAndMarketCap =
      marketCap !== undefined && volume24h !== undefined
        ? this.roundNumber(volume24h / marketCap, 6)
        : undefined;
    const dominance =
      marketCap !== undefined && globalTotalMarketCap !== undefined && globalTotalMarketCap > 0
        ? this.roundNumber((marketCap / globalTotalMarketCap) * 100, 6)
        : undefined;

    return {
      _id: routeId,
      id: routeId,
      legacyProjectId: this.toIdString(row.legacyProjectId),
      canonicalProjectId: this.toIdString(row.canonicalProjectId),
      marketAssetId: this.toIdString(row.marketAssetId),
      coingeckoId: row.providerIds?.coingeckoId,
      projectType: "market",
      projectStatus: "active",
      projectKind: row.projectKind,
      name: row.name,
      symbol: row.symbol,
      slug: row.slug,
      logo: row.logo,
      isVestingReview: Boolean(row.isVestingReview),
      isSponsored: Boolean(row.isSponsored),
      isEralash: Boolean(row.isEralash),
      eralashAdded: row.eralashAdded,
      niche: row.niche || row.category || row.symbol,
      category: row.category,
      rank: row.rank,
      tier: row.tier,
      trading: row.trading || "CURRENTLY_TRADING",
      status: row.status,
      price: row.price,
      priceChange: row.priceChange,
      priceBTC: row.priceBTC,
      priceETH: row.priceETH,
      priceSOL: row.priceSOL,
      marketCap: row.marketCap,
      fullyDilutedMarketCap: row.fullyDilutedMarketCap,
      volume24h: row.volume24h,
      volume24hChange: row.volume24hChange,
      volumeAndMarketCap,
      dominance,
      circulatingSupply: row.circulatingSupply,
      totalSupply: row.totalSupply,
      maxSupply: row.maxSupply,
      circulatingSupplyPercent: this.resolveCirculatingSupplyPercent(row),
      athUsd: row.athUsd,
      athUsdDate: row.athUsdDate,
      athUsdChangePercent: row.athUsdChangePercent,
      atlUsd: row.atlUsd,
      atlUsdDate: row.atlUsdDate,
      atlUsdChangePercent: row.atlUsdChangePercent,
      highs: {
        ALL: {
          USD: row.athUsd,
        },
      },
      lows: {
        ALL: {
          USD: row.atlUsd,
        },
      },
      highsDates: {
        ALL: {
          USD: row.athUsdDate,
        },
      },
      lowsDates: {
        ALL: {
          USD: row.atlUsdDate,
        },
      },
      usdQuote: {
        price: usdQuote.price ?? row.price,
        volume_24h: usdQuote.volume_24h ?? row.volume24h,
        percent_change_1h: usdQuote.percent_change_1h,
        percent_change_24h: usdQuote.percent_change_24h,
        percent_change_7d: usdQuote.percent_change_7d,
        market_cap: usdQuote.market_cap ?? row.marketCap,
        fully_diluted_market_cap: usdQuote.fully_diluted_market_cap ?? row.fullyDilutedMarketCap,
        last_updated: usdQuote.last_updated,
      },
      chart7d: row.chart7d,
      chart7dUpdatedAt: row.chart7dUpdatedAt,
      chart7dSource: row.chart7dSource,
      chart7dPointsCount: row.chart7dPointsCount,
      chart7dTrend: row.chart7dTrend,
      performance: row.performance,
      performanceUpdatedAt: row.performanceUpdatedAt,
      performanceSource: row.performanceSource,
      performanceProvider: row.performanceProvider,
      allTimePriceChange: this.buildAllTimePriceChange(row.performance, row.usdQuote),
      marketDataUpdatedAt: row.marketDataUpdatedAt,
      dateAdded: row.dateAdded,
      description: row.description,
      descriptionText: row.descriptionText,
      bio: row.bio,
      categories: Array.isArray(row.categories) ? row.categories : [],
      topCategories: Array.isArray(row.topCategories) ? row.topCategories : [],
      type: row.topCategories?.[0] || row.categories?.[0] || row.category,
      contracts: Array.isArray(row.contracts) ? row.contracts : [],
      website: Array.isArray(row.website) ? row.website : [],
      socialmedia: Array.isArray(row.socialmedia) ? row.socialmedia : [],
      explorers: Array.isArray(row.explorers) ? row.explorers : [],
      bridge: Array.isArray(row.bridge) ? row.bridge : [],
      links: Array.isArray(row.links) ? row.links : [],
      icoPrice: row.icoPrice,
      xfromIco: row.xfromIco,
      totalRaised: row.totalRaised,
      fundraising: Array.isArray(row.fundraising) ? row.fundraising : undefined,
      tokenDistribution: Array.isArray(row.tokenDistribution) ? row.tokenDistribution : undefined,
      allocations: Array.isArray(row.allocations) ? row.allocations : undefined,
      totalAllocation: Array.isArray(row.totalAllocation) ? row.totalAllocation : undefined,
      coingeckoDetailsUpdatedAt: row.coingeckoDetailsUpdatedAt,
      coingeckoDetailsSource: row.coingeckoDetailsSource,
      fomoScore: row.fomoScore,
      rating: row.rating,
      fullness: row.fullness,
      providerIds: row.providerIds,
      sourceCoverage: row.sourceCoverage,
      debug: row.debug,
      _debug: {
        source,
        readModelId: this.toIdString(row._id),
        canonicalProjectId: this.toIdString(row.canonicalProjectId),
        marketAssetId: this.toIdString(row.marketAssetId),
      },
    };
  }

  private async findCanonicalProjectBySlug(normalizedSlug: string): Promise<any | null> {
    const canonicalProject = await this.canonicalProjectModel
      .findOne({
        $or: [
          { slug: normalizedSlug },
          { "aliases.type": "slug", "aliases.normalizedValue": normalizedSlug },
          { "providerIds.coingeckoId": normalizedSlug },
        ],
      })
      .lean();

    if (canonicalProject) return canonicalProject;

    const sourceEntity = await this.sourceEntityModel
      .findOne({
        canonicalProjectId: { $exists: true, $ne: null },
        $or: [
          { sourceSlug: normalizedSlug },
          { sourceId: normalizedSlug },
          { "providerIds.coingeckoId": normalizedSlug },
        ],
      })
      .sort({ lastSeenAt: -1, _id: -1 })
      .lean();

    if (!sourceEntity?.canonicalProjectId) return null;

    return this.canonicalProjectModel.findById(sourceEntity.canonicalProjectId).lean();
  }

  private async findMarketReadModelForUnlocks(slugOrId: string, query: any = {}): Promise<any | null> {
    const raw = String(slugOrId || "").trim();
    const normalized = this.normalizeLookupKey(raw);
    const normalizedSlug = this.normalizeSlug(raw);
    if (!normalized) return null;

    const lookup = this.normalizeLookupKey(query?.lookup);
    const clauses: any[] = [];
    const allowsLookup = (...keys: string[]) => !lookup || keys.includes(lookup);

    if (allowsLookup("coingeckoid", "providerassetid", "provider_asset_id")) {
      clauses.push({ "providerIds.coingeckoId": normalized });
    }
    if (allowsLookup("slug")) {
      clauses.push({ slug: raw }, { slug: normalizedSlug });
    }

    if (Types.ObjectId.isValid(raw)) {
      const objectId = new Types.ObjectId(raw);
      clauses.push(
        { _id: objectId },
        { canonicalProjectId: objectId },
        { marketAssetId: objectId },
      );
    }

    if (!clauses.length) return null;

    const activeFilter = {
      $and: [
        { $or: clauses },
        { status: "active" },
        { trading: "CURRENTLY_TRADING" },
      ],
    };
    const active = await this.readModel.findOne(activeFilter).lean();
    if (active) return active;

    return this.readModel.findOne({ $or: clauses }).lean();
  }

  private emptyMarketProjectUnlocksPayload(project: any, row: any, warning: string): any {
    return {
      project,
      source: "fomo-v2",
      status: "not_available",
      dataQuality: {
        source: "fomo-v2",
        warning,
      },
      sourceLinks: [],
      sourceRefs: {
        fomoV2: {
          readModelId: this.toIdString(row?._id),
          canonicalProjectId: this.toIdString(row?.canonicalProjectId),
          marketAssetId: this.toIdString(row?.marketAssetId),
          providerIds: row?.providerIds || {},
        },
      },
    };
  }

  private async buildMarketFundingOverview(row: any): Promise<MarketFundingOverview> {
    const identityQuery = this.buildProjectIdentityQuery(row);
    if (!identityQuery) return { fundraising: [] };

    const rounds = await this.fundingRoundModel
      .find({
        $and: [
          identityQuery,
          {
            status: {
              $nin: ["cancelled", "conflict", "deprecated", "superseded"],
            },
          },
        ],
      })
      .sort({ announcedDate: -1, date: -1, _id: -1 })
      .lean();

    const participantsByRoundId = await this.loadFundingParticipants(rounds);
    const fundraising = rounds.map((round: any) =>
      this.toLegacyFundingRound(
        round,
        participantsByRoundId.get(this.toIdString(round?._id)) || [],
        row,
      ),
    );
    const totalRaised = rounds.reduce((sum: number, round: any) => {
      const raisedAmount = this.toFiniteNumber(round?.raisedAmount);
      return raisedAmount !== undefined && raisedAmount > 0 ? sum + raisedAmount : sum;
    }, 0);
    const icoRound = this.selectIcoRound(rounds);
    const icoPrice = this.buildIcoPrice(icoRound);

    return this.cleanObject({
      fundraising,
      totalRaised: totalRaised > 0 ? totalRaised : undefined,
      icoPrice,
      icoRoundId: this.toIdString(icoRound?._id) || undefined,
    }) as MarketFundingOverview;
  }

  private async loadFundingParticipants(rounds: any[]): Promise<Map<string, any[]>> {
    const roundIds = (rounds || [])
      .map((round: any) => this.toObjectId(round?._id))
      .filter((id): id is Types.ObjectId => Boolean(id));
    const result = new Map<string, any[]>();
    if (!roundIds.length) return result;

    const participants = await this.fundingRoundParticipantModel
      .find({
        fundingRoundId: { $in: roundIds },
        status: { $nin: ["conflict", "deprecated", "superseded"] },
      })
      .sort({ isLead: -1, backerName: 1, _id: 1 })
      .lean();
    const backerIds = this.uniqueObjectIds(participants.map((participant: any) => participant?.backerId));
    const backerRows = backerIds.length
      ? await this.backerReadModel.find({ backerId: { $in: backerIds } }).lean()
      : [];
    const backersById = new Map<string, any>(
      (backerRows || []).map((backer: any) => [this.toIdString(backer?.backerId), backer]),
    );

    for (const participant of participants as any[]) {
      const roundId = this.toIdString(participant?.fundingRoundId);
      if (!roundId) continue;
      const investor = this.toLegacyInvestor(
        participant,
        backersById.get(this.toIdString(participant?.backerId)),
      );
      if (!investor) continue;
      const current = result.get(roundId) || [];
      current.push(investor);
      result.set(roundId, current);
    }

    return result;
  }

  private toLegacyInvestor(participant: any, backer: any): any | undefined {
    const name = this.firstString(
      backer?.name,
      participant?.backerName,
      participant?.normalizedBackerName,
      participant?.sourceBackerSlug,
      participant?.sourceBackerId,
    );
    if (!name) return undefined;

    const backerId = this.toIdString(participant?.backerId) || this.toIdString(backer?.backerId);
    const logo = this.firstString(backer?.logoUrl, backer?.avatarUrl);

    return this.cleanObject({
      id: backerId || participant?.sourceBackerId,
      name,
      role: participant?.role,
      isLead: participant?.isLead,
      sourceBackerId: participant?.sourceBackerId,
      sourceBackerSlug: participant?.sourceBackerSlug,
      sourceBackerUrl: participant?.sourceBackerUrl,
      details: this.cleanObject({
        _id: backerId,
        id: backerId,
        name,
        slug: backer?.slug || participant?.sourceBackerSlug,
        logo,
        logoUrl: backer?.logoUrl,
        avatarUrl: backer?.avatarUrl,
        type: backer?.backerType,
        website: backer?.website,
        socials: backer?.socials,
      }),
    });
  }

  private toLegacyFundingRound(round: any, investors: any[], projectRow: any): any {
    const tokenPrice = this.firstPositiveNumber(
      round?.tokenPrice,
      round?.tokenPriceUsd,
      round?.metadata?.tokenPriceUsd,
      round?.metadata?.tokenPrice,
    );
    const fundsRaised = this.toFiniteNumber(round?.raisedAmount) || 0;
    const valuation = this.firstPositiveNumber(
      round?.valuation,
      round?.valuationUsd,
      round?.metadata?.valuationUsd,
      round?.metadata?.valuation,
    );
    const date = this.toDate(round?.announcedDate) || this.toDate(round?.date);
    const roiUsd = this.calculateRoiMultiplier(projectRow?.price, tokenPrice);
    const roi =
      this.normalizeRoundRoi(round?.roi) ||
      (roiUsd !== undefined ? ({ usd: roiUsd } as Record<string, number>) : undefined);
    const platform = this.normalizeRoundPlatform(round?.platform);

    return this.cleanObject({
      _id: this.toIdString(round?._id),
      id: this.toIdString(round?._id),
      stage:
        this.firstString(
          round?.roundName,
          this.humanizeRoundType(round?.normalizedRoundType),
          this.humanizeRoundType(round?.roundType),
        ) || "Funding",
      roundType: round?.roundType,
      normalizedRoundType: round?.normalizedRoundType,
      date: date ? date.toISOString() : undefined,
      announcedDate: date ? date.toISOString() : undefined,
      fundsRaised,
      raisedCurrency: this.firstString(round?.raisedCurrency, "USD"),
      tokenPrice,
      tokensForSaleAmount: this.toFiniteNumber(round?.tokensForSaleAmount),
      tokensForSalePercent: this.toFiniteNumber(round?.tokensForSalePercent),
      preValuation: valuation,
      valuation,
      platform,
      platformName: platform?.name,
      source: this.firstString(round?.primarySource, round?.sourceType),
      sourceUrl: round?.sourceUrl,
      investors,
      roi,
      roiUsd: roi?.usd,
      btcRoi: roi?.btc,
      ethRoi: roi?.eth,
    });
  }

  private selectIcoRound(rounds: any[]): any | undefined {
    const pricedRounds = (rounds || []).map((round: any) => {
      const price = this.firstPositiveNumber(
        round?.tokenPrice,
        round?.tokenPriceUsd,
        round?.metadata?.tokenPriceUsd,
        round?.metadata?.tokenPrice,
      );
      const score = this.icoRoundScore(round);
      return { round, price, score };
    }).filter((item: any) => item.price !== undefined && item.price > 0 && item.score > 0);
    if (!pricedRounds.length) return undefined;

    return [...pricedRounds].sort((left: any, right: any) => {
      const scoreDiff = right.score - left.score;
      if (scoreDiff !== 0) return scoreDiff;

      const leftDate = this.toDate(left.round?.announcedDate)?.getTime() || this.toDate(left.round?.date)?.getTime() || Number.MAX_SAFE_INTEGER;
      const rightDate = this.toDate(right.round?.announcedDate)?.getTime() || this.toDate(right.round?.date)?.getTime() || Number.MAX_SAFE_INTEGER;
      return leftDate - rightDate;
    })[0].round;
  }

  private icoRoundScore(round: any): number {
    const haystack = [
      round?.roundName,
      round?.normalizedRoundName,
      round?.roundType,
      round?.normalizedRoundType,
    ]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");

    if (/\b(public[_\s-]?sale|public sale|public)\b/.test(haystack)) return 140;
    if (/\bico\b/.test(haystack)) return 135;
    if (/\bcoinlist\b/.test(haystack) && /\bauction\b/.test(haystack)) return 132;
    if (/\bcoinlist\b/.test(haystack)) return 128;
    if (/\b(ido|ieo)\b/.test(haystack)) return 126;
    if (/\blaunchpad\b/.test(haystack)) return 122;
    if (/\bauction\b/.test(haystack)) return 120;
    if (/\b(token[_\s-]?sale|crowd[_\s-]?sale|crowdsale)\b/.test(haystack)) return 115;
    if (/\btge[_\s-]?distribution\b/.test(haystack)) return 105;

    return 0;
  }

  private buildMarketRoiLegacyFields(row: any): {
    icoPrice?: Record<string, number>;
    xfromIco?: Record<string, number>;
    totalRaised?: number;
  } {
    if (!row) return {};

    const entryPrice = row.entryPrice || {};
    const roiMultiplier = row.roiMultiplier || {};
    const icoPrice = this.cleanObject({
      USD: this.firstPositiveNumber(entryPrice.USD, entryPrice.usd),
      BTC: this.firstPositiveNumber(entryPrice.BTC, entryPrice.btc),
      ETH: this.firstPositiveNumber(entryPrice.ETH, entryPrice.eth),
    }) as Record<string, number>;
    const xfromIco = this.cleanObject({
      USD: this.firstPositiveNumber(roiMultiplier.USD, roiMultiplier.usd),
      BTC: this.firstPositiveNumber(roiMultiplier.BTC, roiMultiplier.btc),
      ETH: this.firstPositiveNumber(roiMultiplier.ETH, roiMultiplier.eth),
    }) as Record<string, number>;

    return this.cleanObject({
      icoPrice: Object.keys(icoPrice).length ? icoPrice : undefined,
      xfromIco: Object.keys(xfromIco).length ? xfromIco : undefined,
      totalRaised: this.firstPositiveNumber(row.totalRaised?.USD, row.totalRaised?.usd),
    });
  }

  private buildIcoPrice(round: any): Record<string, number> | undefined {
    if (!round) return undefined;

    const icoPrice = this.cleanObject({
      USD: this.firstPositiveNumber(
        round?.tokenPrice,
        round?.tokenPriceUsd,
        round?.metadata?.tokenPriceUsd,
        round?.metadata?.tokenPrice,
        round?.metadata?.icoPrice?.USD,
      ),
      BTC: this.firstPositiveNumber(
        round?.tokenPriceBTC,
        round?.tokenPriceBtc,
        round?.metadata?.tokenPriceBTC,
        round?.metadata?.tokenPriceBtc,
        round?.metadata?.icoPrice?.BTC,
      ),
      ETH: this.firstPositiveNumber(
        round?.tokenPriceETH,
        round?.tokenPriceEth,
        round?.metadata?.tokenPriceETH,
        round?.metadata?.tokenPriceEth,
        round?.metadata?.icoPrice?.ETH,
      ),
    }) as Record<string, number>;

    return Object.keys(icoPrice).length ? icoPrice : undefined;
  }

  private buildMarketRoi(row: any, icoPrice?: Record<string, number>): Record<string, number> | undefined {
    if (!icoPrice) return undefined;

    const roi = this.cleanObject({
      USD: this.calculateRoiMultiplier(row?.price, icoPrice.USD),
      BTC: this.calculateRoiMultiplier(row?.priceBTC, icoPrice.BTC),
      ETH: this.calculateRoiMultiplier(row?.priceETH, icoPrice.ETH),
    }) as Record<string, number>;

    return Object.keys(roi).length ? roi : undefined;
  }

  private normalizeRoundRoi(value: any): Record<string, number> | undefined {
    if (!value || typeof value !== "object") return undefined;
    const roi = this.cleanObject({
      usd: this.toFiniteNumber(value.usd ?? value.USD),
      btc: this.toFiniteNumber(value.btc ?? value.BTC),
      eth: this.toFiniteNumber(value.eth ?? value.ETH),
    });
    return Object.keys(roi).length ? (roi as Record<string, number>) : undefined;
  }

  private normalizeRoundPlatform(value: any): Record<string, any> | undefined {
    if (!value || typeof value !== "object") return undefined;
    const name = this.firstString(value.name);
    if (!name) return undefined;

    return this.cleanObject({
      platformId: this.toIdString(value.platformId || value._id) || undefined,
      name,
      normalizedName: this.firstString(value.normalizedName),
      logoUrl: this.firstString(value.logoUrl, value.logo, value.image),
      sourceType: this.firstString(value.sourceType),
      sourceId: this.firstString(value.sourceId || value.id),
      sourceUrl: this.firstString(value.sourceUrl),
    });
  }

  private calculateRoiMultiplier(currentPrice: any, entryPrice: any): number | undefined {
    const current = this.toFiniteNumber(currentPrice);
    const entry = this.toFiniteNumber(entryPrice);
    if (current === undefined || entry === undefined || current <= 0 || entry <= 0) return undefined;

    return this.roundNumber(current / entry, 4);
  }

  private async buildMarketVestingOverview(
    row: any,
    query: any = {},
    options: { includeEvents?: boolean } = {},
  ): Promise<MarketVestingOverview> {
    const identityQuery = this.buildProjectIdentityQuery(row);
    if (!identityQuery) return this.emptyMarketVestingOverview();

    const canonicalProjectId = this.toObjectId(row?.canonicalProjectId);
    const statusFilter = {
      status: { $nin: ["conflict", "deprecated", "superseded"] },
    };
    const [
      tokenAllocations,
      vestingRounds,
      vestingSchedules,
      vestingSummary,
      unlockEvents,
      progressUnlockEvents,
    ] = await Promise.all([
      this.tokenAllocationModel
        .find({ $and: [identityQuery, statusFilter] })
        .sort({ allocationPercent: -1, amount: -1, name: 1 })
        .lean(),
      this.vestingRoundModel
        .find({ $and: [identityQuery, statusFilter] })
        .sort({ allocationPercent: -1, totalAmount: -1, roundName: 1 })
        .lean(),
      this.vestingScheduleModel
        .find({ $and: [identityQuery, statusFilter] })
        .sort({ startDate: 1, endDate: 1, roundName: 1 })
        .lean(),
      canonicalProjectId
        ? this.vestingSummaryModel
            .findOne({ canonicalProjectId })
            .sort({ calculatedAt: -1, updatedAt: -1, _id: -1 })
            .lean()
        : Promise.resolve(null),
      options.includeEvents === false || !canonicalProjectId
        ? Promise.resolve([])
        : this.loadUnlockEvents(canonicalProjectId, query),
      options.includeEvents === false || !canonicalProjectId
        ? Promise.resolve([])
        : this.loadUnlockEventsForProgress(canonicalProjectId, query),
    ]);

    const tokenAllocation = (tokenAllocations || []).map((item: any) =>
      this.toLegacyTokenAllocation(item),
    );
    const legacyVestingRounds = (vestingRounds || []).map((item: any) =>
      this.toLegacyVestingRound(item),
    );
    const events = (unlockEvents || []).map((item: any) => this.toLegacyUnlockEvent(item));
    const progressEvents = (progressUnlockEvents || []).map((item: any) =>
      this.toLegacyUnlockEvent(item),
    );
    const vestingSchedule = (vestingSchedules || []).map((item: any) =>
      this.toLegacyVestingSchedule(item, vestingRounds || [], tokenAllocations || [], row),
    );
    const vestingTimeline = vestingSchedule.length ? vestingSchedule : legacyVestingRounds;
    const legacySummary = vestingSummary
      ? this.toLegacyVestingSummary(vestingSummary)
      : this.buildGeneratedVestingSummary(tokenAllocation, legacyVestingRounds, vestingTimeline, progressEvents, row);
    const dynamicProgress = this.applyUnlockEventsToVestingProgress({
      tokenAllocation,
      vestingRounds: legacyVestingRounds,
      vestingSchedule,
      vestingTimeline,
      vestingSummary: legacySummary,
      events: progressEvents,
      row,
    });
    const nextUnlockingEvent = this.resolveNextUnlockingEvent(
      events,
      dynamicProgress.vestingTimeline,
      dynamicProgress.vestingSummary,
      row,
    );
    const unlockingEvents = events.length ? events : nextUnlockingEvent ? [nextUnlockingEvent] : [];

    return {
      tokenAllocation,
      vestingRounds: dynamicProgress.vestingRounds,
      vestingSchedule: dynamicProgress.vestingSchedule,
      vestingTimeline: dynamicProgress.vestingTimeline,
      vestingSummary: dynamicProgress.vestingSummary,
      events,
      unlockingEvents,
      nextUnlockingEvent,
      sourceLinks: this.collectVestingSourceLinks([
        ...(tokenAllocations || []),
        ...(vestingRounds || []),
        ...(vestingSchedules || []),
        ...(unlockEvents || []),
        ...(progressUnlockEvents || []),
      ]),
    };
  }

  private async loadUnlockEvents(canonicalProjectId: Types.ObjectId, query: any): Promise<any[]> {
    const mode = String(query?.events || "upcoming").trim().toLowerCase();
    const limit = Math.min(this.positiveInteger(query?.eventsLimit, 10), 200);
    const filter: any = { canonicalProjectId };
    const now = new Date();

    if (mode === "upcoming") {
      filter.unlockDate = { $gte: now };
    } else if (["past", "history", "historical"].includes(mode)) {
      filter.unlockDate = { $lt: now };
    }

    const sort = mode === "upcoming" ? { unlockDate: 1, _id: 1 } : { unlockDate: -1, _id: -1 };

    return this.unlockEventModel
      .find(filter)
      .sort(sort as any)
      .limit(limit)
      .lean();
  }

  private async loadUnlockEventsForProgress(
    canonicalProjectId: Types.ObjectId,
    query: any,
  ): Promise<any[]> {
    const limit = Math.min(this.positiveInteger(query?.progressEventsLimit, 5000), 10000);
    return this.unlockEventModel
      .find({
        canonicalProjectId,
        $and: [
          {
            $or: [{ appliedAt: { $exists: false } }, { appliedAt: null }],
          },
          {
            $or: [
              { appliedStatus: { $exists: false } },
              { appliedStatus: null },
              { appliedStatus: { $nin: ["applied", "skipped"] } },
            ],
          },
        ],
      })
      .sort({ unlockDate: 1, _id: 1 } as any)
      .limit(limit)
      .lean();
  }

  private toLegacyTokenAllocation(item: any): any {
    const amount = this.toFiniteNumber(item?.amount);
    const allocationPercent = this.normalizePercent(item?.allocationPercent);

    return this.cleanObject({
      _id: this.toIdString(item?._id),
      id: this.toIdString(item?._id),
      name: item?.name,
      normalizedCategory: item?.normalizedName,
      allocationPercent,
      percent: allocationPercent,
      value: allocationPercent,
      amount,
      allocated: amount,
      tokensAllocatedAmount: amount,
      tokensAllocatedPercent: allocationPercent,
      saleId: item?.saleId,
      source: this.firstString(item?.primarySource, item?.sourceType, "fomo-v2"),
      sourceType: item?.sourceType,
      sourceUrl: item?.sourceUrl,
      status: item?.status,
    });
  }

  private toLegacyVestingRound(item: any): any {
    const amount = this.toFiniteNumber(item?.totalAmount);
    const allocationPercent = this.normalizePercent(item?.allocationPercent);
    const lastUnlockDate = this.toDate(item?.lastUnlockDateSource);

    return this.cleanObject({
      _id: this.toIdString(item?._id),
      id: this.toIdString(item?._id),
      name: item?.roundName,
      roundName: item?.roundName,
      normalizedCategory: item?.normalizedRoundName,
      allocationPercent,
      percent: allocationPercent,
      value: allocationPercent,
      totalAmount: amount,
      amount,
      allocated: amount,
      tokensAllocatedAmount: amount,
      tokensAllocatedPercent: allocationPercent,
      unlockedAmount: this.toFiniteNumber(item?.unlockedAmountSource),
      lockedAmount: this.toFiniteNumber(item?.lockedAmountSource),
      unlockedPercent: this.normalizePercent(item?.unlockedPercentSource),
      lockedPercent: this.normalizePercent(item?.lockedPercentSource),
      valueLockedUsd: this.toFiniteNumber(item?.valueLockedUsdSource),
      lastUnlockDate: lastUnlockDate ? lastUnlockDate.toISOString() : undefined,
      saleId: item?.saleId,
      source: this.firstString(item?.primarySource, item?.sourceType, "fomo-v2"),
      sourceType: item?.sourceType,
      status: item?.status,
    });
  }

  private toLegacyVestingSchedule(
    item: any,
    vestingRounds: any[] = [],
    tokenAllocations: any[] = [],
    row: any = {},
  ): any {
    const relatedRound = this.findRelatedVestingRow(item, vestingRounds, item?.vestingRoundId);
    const relatedAllocation = this.findRelatedVestingRow(item, tokenAllocations, item?.tokenAllocationId);
    const allocationPercent = this.normalizePercent(
      this.firstNumber(
        item?.allocationPercent,
        relatedRound?.allocationPercent,
        relatedAllocation?.allocationPercent,
      ),
    );
    const totalSupply = this.firstPositiveNumber(row?.totalSupply, row?.maxSupply);
    const amount =
      this.firstPositiveNumber(
        item?.totalAmount,
        item?.amount,
        relatedRound?.totalAmount,
        relatedAllocation?.amount,
      ) ??
      (allocationPercent !== undefined && totalSupply !== undefined
        ? this.roundNumber((totalSupply * allocationPercent) / 100, 6)
        : undefined);
    const startDate = this.toDate(item?.startDate);
    const endDate = this.toDate(item?.endDate);
    const sourceUnlockedPercent = this.normalizePercent(
      this.firstNumber(item?.currentUnlockedPercentSource, relatedRound?.unlockedPercentSource),
    );
    const sourceLockedPercent = this.normalizePercent(
      this.firstNumber(item?.currentLockedPercentSource, relatedRound?.lockedPercentSource),
    );
    const estimatedUnlockedPercent = this.estimateUnlockedPercentFromSchedule(item);
    const unlockedPercent =
      sourceUnlockedPercent ??
      (sourceLockedPercent !== undefined
        ? this.roundNumber(Math.max(0, 100 - sourceLockedPercent), 6)
        : estimatedUnlockedPercent);
    const lockedPercent =
      sourceLockedPercent ??
      (unlockedPercent !== undefined
        ? this.roundNumber(Math.max(0, 100 - unlockedPercent), 6)
        : undefined);
    const unlockedAmount =
      amount !== undefined && unlockedPercent !== undefined
        ? this.roundNumber((amount * unlockedPercent) / 100, 6)
        : undefined;
    const lockedAmount =
      amount !== undefined && lockedPercent !== undefined
        ? this.roundNumber((amount * lockedPercent) / 100, 6)
        : undefined;
    const roundName = this.firstString(item?.roundName, relatedRound?.roundName, relatedAllocation?.name);
    const nextUnlockingEvent = this.buildScheduleNextUnlockingEvent({
      schedule: item,
      row,
      amount,
      allocationPercent,
      lockedPercent,
      roundName,
    });

    return this.cleanObject({
      _id: this.toIdString(item?._id),
      id: this.toIdString(item?._id),
      saleId: item?.saleId ?? relatedRound?.saleId ?? relatedAllocation?.saleId,
      name: roundName,
      roundName,
      normalizedCategory: this.firstString(
        item?.normalizedRoundName,
        relatedRound?.normalizedRoundName,
        relatedAllocation?.normalizedName,
      ),
      normalizedRoundName: this.firstString(item?.normalizedRoundName, relatedRound?.normalizedRoundName),
      allocationPercent,
      percent: allocationPercent,
      value: allocationPercent,
      totalAmount: amount,
      amount,
      allocated: amount,
      tokensAllocatedAmount: amount,
      tokensAllocatedPercent: allocationPercent,
      unlockedAmount,
      lockedAmount,
      unlockedPercent,
      lockedPercent,
      vestedAmount: unlockedAmount,
      vestedPercent: unlockedPercent,
      tgeUnlockPercent: this.normalizePercent(item?.tgeUnlockPercent),
      vestingType: item?.vestingType,
      vestingFrequency: item?.vestingFrequency,
      vestingDurationMonths: this.toFiniteNumber(item?.vestingDurationMonths),
      startDate: startDate ? startDate.toISOString() : undefined,
      endDate: endDate ? endDate.toISOString() : undefined,
      dateConfidence: item?.dateConfidence,
      nextUnlockingEvent,
      source: this.firstString(relatedRound?.primarySource, item?.sourceType, "fomo-v2"),
      sourceType: item?.sourceType,
      status: item?.status,
    });
  }

  private buildGeneratedVestingSummary(
    tokenAllocation: any[],
    vestingRounds: any[],
    vestingTimeline: any[],
    events: any[],
    row: any,
  ): any | undefined {
    const rows = (vestingTimeline.length ? vestingTimeline : vestingRounds).filter(Boolean);
    const rowStats = rows
      .map((item: any) => {
        const amount = this.firstPositiveNumber(
          item?.totalAmount,
          item?.amount,
          item?.tokensAllocatedAmount,
          item?.allocated,
        );
        if (amount === undefined) return undefined;
        const unlockedPercent = this.normalizePercent(
          this.firstNumber(item?.unlockedPercent, item?.vestedPercent),
        );
        const lockedPercent = this.normalizePercent(
          this.firstNumber(item?.lockedPercent),
        );
        const unlockedAmount =
          this.firstNumber(item?.unlockedAmount, item?.vestedAmount) ??
          (unlockedPercent !== undefined ? (amount * unlockedPercent) / 100 : undefined);
        const lockedAmount =
          this.firstNumber(item?.lockedAmount) ??
          (lockedPercent !== undefined
            ? (amount * lockedPercent) / 100
            : unlockedAmount !== undefined
              ? Math.max(0, amount - unlockedAmount)
              : undefined);

        return {
          amount,
          unlockedAmount,
          lockedAmount,
          endDate: item?.endDate,
          nextUnlockDate: item?.nextUnlockingEvent?.unlockDate,
        };
      })
      .filter(Boolean) as Array<Record<string, any>>;

    if (!rowStats.length) return undefined;

    const totalAmount = this.roundNumber(
      rowStats.reduce((total, item) => total + Number(item.amount || 0), 0),
      6,
    );
    if (totalAmount === undefined || totalAmount <= 0) return undefined;

    const unlockedAmount = this.roundNumber(
      rowStats.reduce((total, item) => total + Number(item.unlockedAmount || 0), 0),
      6,
    );
    const lockedAmount = this.roundNumber(
      rowStats.reduce((total, item) => total + Number(item.lockedAmount || 0), 0),
      6,
    );
    const unlockedPercent =
      unlockedAmount !== undefined ? this.roundNumber((unlockedAmount / totalAmount) * 100, 6) : undefined;
    const lockedPercent =
      lockedAmount !== undefined ? this.roundNumber((lockedAmount / totalAmount) * 100, 6) : undefined;
    const allocationPercentSource = tokenAllocation.length ? tokenAllocation : vestingRounds;
    const allocationPercentSum = allocationPercentSource.reduce((total, item) => {
      const percent = this.normalizePercent(
        this.firstNumber(item?.allocationPercent, item?.percent, item?.tokensAllocatedPercent, item?.value),
      );
      return total + Number(percent || 0);
    }, 0);
    const untrackedPercent = allocationPercentSum > 0
      ? this.roundNumber(Math.max(0, 100 - allocationPercentSum), 6)
      : undefined;
    const untrackedAmount =
      untrackedPercent !== undefined ? this.roundNumber((totalAmount * untrackedPercent) / 100, 6) : undefined;
    const price = this.firstPositiveNumber(row?.price);
    const lastUnlockDate = this.latestPastDate([
      ...rowStats.map((item) => item.endDate),
      ...events.map((event) => event.unlockDate || event.date),
    ]);
    const nextUnlockDate = this.earliestFutureDate([
      ...rowStats.map((item) => item.nextUnlockDate),
      ...events.map((event) => event.unlockDate || event.date),
    ]);

    return this.cleanObject({
      id: `generated:${this.toIdString(row?.canonicalProjectId) || this.toIdString(row?.marketAssetId)}`,
      totalAmount,
      unlockedAmount,
      lockedAmount,
      untrackedAmount,
      unlockedPercent,
      lockedPercent,
      untrackedPercent,
      lastUnlockDate,
      nextUnlockDate,
      sourceUnlockedValueUsd:
        price !== undefined && unlockedAmount !== undefined
          ? this.roundNumber(unlockedAmount * price, 6)
          : undefined,
      sourceLockedValueUsd:
        price !== undefined && lockedAmount !== undefined
          ? this.roundNumber(lockedAmount * price, 6)
          : undefined,
      calculatedAt: new Date().toISOString(),
      sourceType: "fomo-v2-generated",
    });
  }

  private applyUnlockEventsToVestingProgress(input: {
    tokenAllocation: any[];
    vestingRounds: any[];
    vestingSchedule: any[];
    vestingTimeline: any[];
    vestingSummary?: any;
    events: any[];
    row: any;
  }): {
    vestingRounds: any[];
    vestingSchedule: any[];
    vestingTimeline: any[];
    vestingSummary?: any;
  } {
    const events = (input.events || []).filter((event) =>
      Boolean(this.toDate(event?.unlockDate || event?.date)),
    );
    if (!events.length) {
      return {
        vestingRounds: input.vestingRounds,
        vestingSchedule: input.vestingSchedule,
        vestingTimeline: input.vestingTimeline,
        vestingSummary: input.vestingSummary,
      };
    }

    const vestingSchedule = (input.vestingSchedule || []).map((item) =>
      this.applyUnlockEventsToVestingRow(item, events, input.row),
    );
    const vestingRounds = (input.vestingRounds || []).map((item) =>
      this.applyUnlockEventsToVestingRow(item, events, input.row),
    );
    const scheduleById = new Map<string, any>();
    for (const item of vestingSchedule) {
      const id = this.toIdString(item?.id || item?._id);
      if (id) scheduleById.set(id, item);
    }
    const roundById = new Map<string, any>();
    for (const item of vestingRounds) {
      const id = this.toIdString(item?.id || item?._id);
      if (id) roundById.set(id, item);
    }
    const vestingTimeline = (input.vestingTimeline || []).map((item) => {
      const id = this.toIdString(item?.id || item?._id);
      return (
        (id && scheduleById.get(id)) ||
        (id && roundById.get(id)) ||
        this.applyUnlockEventsToVestingRow(item, events, input.row)
      );
    });
    const summaryRows = vestingTimeline.length
      ? vestingTimeline
      : vestingSchedule.length
        ? vestingSchedule
        : vestingRounds;
    const vestingSummary = this.rebuildDynamicVestingSummary(
      input.vestingSummary,
      summaryRows,
      events,
      input.row,
    );

    return {
      vestingRounds,
      vestingSchedule,
      vestingTimeline,
      vestingSummary,
    };
  }

  private applyUnlockEventsToVestingRow(row: any, events: any[], marketRow: any): any {
    if (!row) return row;
    const rowEvents = (events || []).filter((event) =>
      this.isUnlockEventRelatedToVestingRow(row, event),
    );
    if (!rowEvents.length) return row;

    const now = Date.now();
    const pastEvents = rowEvents.filter((event) => {
      const date = this.toDate(event?.unlockDate || event?.date);
      return date && date.getTime() < now;
    });
    const nextEvent = [...rowEvents]
      .filter((event) => {
        const date = this.toDate(event?.unlockDate || event?.date);
        return date && date.getTime() >= now;
      })
      .sort((left, right) => {
        const leftTime = this.toDate(left?.unlockDate || left?.date)?.getTime() || 0;
        const rightTime = this.toDate(right?.unlockDate || right?.date)?.getTime() || 0;
        return leftTime - rightTime;
      })[0];
    const nextUnlockingEvent = nextEvent
      ? this.toUpcomingUnlockingEvent(nextEvent, marketRow)
      : row?.nextUnlockingEvent;

    if (!pastEvents.length) {
      return nextUnlockingEvent !== row?.nextUnlockingEvent
        ? this.cleanObject({ ...row, nextUnlockingEvent })
        : row;
    }

    const totalAmount = this.firstPositiveNumber(
      row?.totalAmount,
      row?.amount,
      row?.tokensAllocatedAmount,
      row?.allocated,
    );
    if (totalAmount === undefined) {
      return this.cleanObject({
        ...row,
        nextUnlockingEvent,
        dynamicProgress: {
          source: "unlock_events",
          pastEvents: pastEvents.length,
          calculatedAt: new Date().toISOString(),
        },
      });
    }

    const existingUnlockedPercent = this.normalizePercent(
      this.firstNumber(row?.unlockedPercent, row?.vestedPercent),
    );
    const existingUnlockedAmount =
      this.firstNumber(row?.unlockedAmount, row?.vestedAmount) ??
      (existingUnlockedPercent !== undefined
        ? this.roundNumber((totalAmount * existingUnlockedPercent) / 100, 6)
        : undefined);
    const eventUnlockedAmount = this.roundNumber(
      pastEvents.reduce((total, event) => {
        const amount = this.unlockEventAmountForVestingRow(event, row, marketRow);
        return total + Number(amount || 0);
      }, 0),
      6,
    );
    if (eventUnlockedAmount === undefined || eventUnlockedAmount <= 0) {
      return this.cleanObject({
        ...row,
        nextUnlockingEvent,
        dynamicProgress: {
          source: "unlock_events",
          pastEvents: pastEvents.length,
          calculatedAt: new Date().toISOString(),
        },
      });
    }

    const unlockedAmount = this.roundNumber(
      Math.min(totalAmount, Math.max(Number(existingUnlockedAmount || 0), eventUnlockedAmount)),
      6,
    );
    const lockedAmount =
      unlockedAmount !== undefined
        ? this.roundNumber(Math.max(0, totalAmount - unlockedAmount), 6)
        : undefined;
    const unlockedPercent =
      unlockedAmount !== undefined
        ? this.roundNumber((unlockedAmount / totalAmount) * 100, 6)
        : undefined;
    const lockedPercent =
      unlockedPercent !== undefined
        ? this.roundNumber(Math.max(0, 100 - unlockedPercent), 6)
        : undefined;

    return this.cleanObject({
      ...row,
      unlockedAmount,
      vestedAmount: unlockedAmount,
      lockedAmount,
      unlockedPercent,
      vestedPercent: unlockedPercent,
      lockedPercent,
      nextUnlockingEvent,
      dynamicProgress: {
        source: "unlock_events",
        pastEvents: pastEvents.length,
        unlockedAmountFromEvents: eventUnlockedAmount,
        calculatedAt: new Date().toISOString(),
      },
    });
  }

  private rebuildDynamicVestingSummary(
    summary: any,
    rows: any[],
    events: any[],
    row: any,
  ): any | undefined {
    const baseSummary = summary || {};
    const rowStats = (rows || [])
      .map((item) => {
        const amount = this.firstPositiveNumber(
          item?.totalAmount,
          item?.amount,
          item?.tokensAllocatedAmount,
          item?.allocated,
        );
        if (amount === undefined) return undefined;
        const unlockedPercent = this.normalizePercent(
          this.firstNumber(item?.unlockedPercent, item?.vestedPercent),
        );
        const unlockedAmount =
          this.firstNumber(item?.unlockedAmount, item?.vestedAmount) ??
          (unlockedPercent !== undefined ? this.roundNumber((amount * unlockedPercent) / 100, 6) : undefined);
        const lockedAmount =
          this.firstNumber(item?.lockedAmount) ??
          (unlockedAmount !== undefined ? this.roundNumber(Math.max(0, amount - unlockedAmount), 6) : undefined);
        return {
          amount,
          unlockedAmount,
          lockedAmount,
          endDate: item?.endDate,
          nextUnlockDate: item?.nextUnlockingEvent?.unlockDate || item?.nextUnlockingEvent?.date,
        };
      })
      .filter(Boolean) as Array<Record<string, any>>;
    const trackedTotal = this.roundNumber(
      rowStats.reduce((total, item) => total + Number(item.amount || 0), 0),
      6,
    );
    const totalAmount = this.firstPositiveNumber(
      baseSummary?.totalAmount,
      row?.totalSupply,
      row?.maxSupply,
      trackedTotal,
    );
    if (totalAmount === undefined) return summary;

    const baseUntrackedAmount = this.firstNumber(baseSummary?.untrackedAmount);
    const baseUntrackedPercent = this.normalizePercent(baseSummary?.untrackedPercent);
    const inferredUntrackedAmount =
      trackedTotal !== undefined && trackedTotal > 0
        ? this.roundNumber(Math.max(0, totalAmount - trackedTotal), 6)
        : undefined;
    const untrackedAmount =
      baseUntrackedAmount ??
      (baseUntrackedPercent !== undefined
        ? this.roundNumber((totalAmount * baseUntrackedPercent) / 100, 6)
        : inferredUntrackedAmount);
    const trackedCapacity =
      untrackedAmount !== undefined
        ? this.roundNumber(Math.max(0, totalAmount - untrackedAmount), 6)
        : trackedTotal !== undefined && trackedTotal > 0
          ? trackedTotal
          : totalAmount;
    const dynamicRowUnlockedAmount = this.roundNumber(
      rowStats.reduce((total, item) => total + Number(item.unlockedAmount || 0), 0),
      6,
    );
    const pastEventUnlockedAmount = this.roundNumber(
      (events || []).reduce((total, event) => {
        const date = this.toDate(event?.unlockDate || event?.date);
        if (!date || date.getTime() >= Date.now()) return total;
        const amount = this.unlockEventAmountForVestingRow(event, undefined, row);
        return total + Number(amount || 0);
      }, 0),
      6,
    );
    const baseUnlockedAmount = this.firstNumber(baseSummary?.unlockedAmount);
    const unlockedAmount = this.roundNumber(
      Math.min(
        trackedCapacity !== undefined && trackedCapacity > 0 ? trackedCapacity : totalAmount,
        Math.max(
          Number(baseUnlockedAmount || 0),
          Number(dynamicRowUnlockedAmount || 0),
          Number(pastEventUnlockedAmount || 0),
        ),
      ),
      6,
    );
    const baseLockedAmount = this.firstNumber(baseSummary?.lockedAmount);
    const dynamicLockedAmount =
      trackedCapacity !== undefined && unlockedAmount !== undefined
        ? this.roundNumber(Math.max(0, trackedCapacity - unlockedAmount), 6)
        : undefined;
    const lockedAmount =
      pastEventUnlockedAmount !== undefined &&
      baseUnlockedAmount !== undefined &&
      pastEventUnlockedAmount > baseUnlockedAmount
        ? dynamicLockedAmount
        : dynamicLockedAmount ?? baseLockedAmount;
    const unlockedPercent =
      unlockedAmount !== undefined ? this.roundNumber((unlockedAmount / totalAmount) * 100, 6) : undefined;
    const lockedPercent =
      lockedAmount !== undefined ? this.roundNumber((lockedAmount / totalAmount) * 100, 6) : undefined;
    const untrackedPercent =
      untrackedAmount !== undefined ? this.roundNumber((untrackedAmount / totalAmount) * 100, 6) : undefined;
    const price = this.firstPositiveNumber(row?.price);
    const lastUnlockDate = this.latestPastDate([
      baseSummary?.lastUnlockDate,
      ...rowStats.map((item) => item.endDate),
      ...(events || []).map((event) => event?.unlockDate || event?.date),
    ]);
    const nextUnlockDate = this.earliestFutureDate([
      baseSummary?.nextUnlockDate,
      ...rowStats.map((item) => item.nextUnlockDate),
      ...(events || []).map((event) => event?.unlockDate || event?.date),
    ]);

    return this.cleanObject({
      ...baseSummary,
      totalAmount,
      unlockedAmount,
      lockedAmount,
      untrackedAmount,
      unlockedPercent,
      lockedPercent,
      untrackedPercent,
      lastUnlockDate: lastUnlockDate || baseSummary?.lastUnlockDate,
      nextUnlockDate,
      sourceUnlockedValueUsd:
        price !== undefined && unlockedAmount !== undefined
          ? this.roundNumber(unlockedAmount * price, 6)
          : baseSummary?.sourceUnlockedValueUsd,
      sourceLockedValueUsd:
        price !== undefined && lockedAmount !== undefined
          ? this.roundNumber(lockedAmount * price, 6)
          : baseSummary?.sourceLockedValueUsd,
      calculatedAt: new Date().toISOString(),
      dynamicProgress: {
        source: "unlock_events",
        events: (events || []).length,
        calculatedAt: new Date().toISOString(),
      },
    });
  }

  private isUnlockEventRelatedToVestingRow(row: any, event: any): boolean {
    const rowIds = new Set(
      [
        row?.id,
        row?._id,
        row?.vestingScheduleId,
        row?.vestingRoundId,
        row?.tokenAllocationId,
      ]
        .map((value) => this.toIdString(value))
        .filter(Boolean),
    );
    const eventIds = [
      event?.vestingScheduleId,
      event?.vestingRoundId,
      event?.tokenAllocationId,
    ]
      .map((value) => this.toIdString(value))
      .filter(Boolean);
    if (eventIds.some((id) => rowIds.has(id))) return true;

    const rowSaleId = this.firstString(row?.saleId);
    const eventSaleId = this.firstString(event?.saleId);
    if (rowSaleId && eventSaleId && rowSaleId === eventSaleId) return true;

    const rowLabel = this.normalizedVestingLabel(
      row?.normalizedRoundName ||
        row?.normalizedCategory ||
        row?.roundName ||
        row?.name,
    );
    const eventLabel = this.normalizedVestingLabel(
      event?.normalizedRoundName ||
        event?.roundName ||
        event?.stage ||
        (Array.isArray(event?.roundNames) && event.roundNames.length === 1
          ? event.roundNames[0]
          : undefined),
    );
    return Boolean(rowLabel && eventLabel && rowLabel === eventLabel);
  }

  private unlockEventAmountForVestingRow(event: any, row: any, marketRow: any): number | undefined {
    const amount = this.firstPositiveNumber(event?.amount);
    if (amount !== undefined) return amount;

    const percentOfSupply = this.normalizePercent(
      this.firstNumber(event?.percentOfSupply, event?.percent),
    );
    if (percentOfSupply === undefined) return undefined;

    const totalSupply = this.firstPositiveNumber(
      marketRow?.totalSupply,
      marketRow?.maxSupply,
      marketRow?.vestingSummary?.totalAmount,
      row?.projectTotalAmount,
    );
    if (totalSupply !== undefined) {
      return this.roundNumber((totalSupply * percentOfSupply) / 100, 6);
    }

    const rowAmount = this.firstPositiveNumber(
      row?.totalAmount,
      row?.amount,
      row?.tokensAllocatedAmount,
      row?.allocated,
    );
    const rowPercent = this.normalizePercent(
      this.firstNumber(row?.allocationPercent, row?.percent, row?.tokensAllocatedPercent, row?.value),
    );
    if (rowAmount !== undefined && rowPercent !== undefined && rowPercent > 0) {
      const inferredTotal = (rowAmount * 100) / rowPercent;
      return this.roundNumber((inferredTotal * percentOfSupply) / 100, 6);
    }
    return undefined;
  }

  private resolveNextUnlockingEvent(
    events: any[],
    vestingTimeline: any[],
    vestingSummary: any,
    row: any,
  ): any | undefined {
    const now = Date.now();
    const upcomingEvent = [...(events || [])]
      .filter((event) => {
        const date = this.toDate(event?.unlockDate || event?.date);
        return date && date.getTime() >= now;
      })
      .sort((left, right) => {
        const leftTime = this.toDate(left?.unlockDate || left?.date)?.getTime() || 0;
        const rightTime = this.toDate(right?.unlockDate || right?.date)?.getTime() || 0;
        return leftTime - rightTime;
      })[0];

    if (upcomingEvent) return this.toUpcomingUnlockingEvent(upcomingEvent, row);

    return this.buildGeneratedNextUnlockingEvent(vestingTimeline, vestingSummary, row);
  }

  private buildGeneratedNextUnlockingEvent(
    vestingTimeline: any[],
    vestingSummary: any,
    row: any,
  ): any | undefined {
    const upcomingRoundEvents = (vestingTimeline || [])
      .map((item) => item?.nextUnlockingEvent)
      .filter((event) => {
        const date = this.toDate(event?.unlockDate || event?.date);
        return date && date.getTime() >= Date.now();
      })
      .sort((left, right) => {
        const leftTime = this.toDate(left?.unlockDate || left?.date)?.getTime() || 0;
        const rightTime = this.toDate(right?.unlockDate || right?.date)?.getTime() || 0;
        return leftTime - rightTime;
      });
    const first = upcomingRoundEvents[0];
    const firstDate = this.toDate(first?.unlockDate || first?.date);
    if (!first || !firstDate) return undefined;

    const sameDateEvents = upcomingRoundEvents.filter((event) => {
      const eventDate = this.toDate(event?.unlockDate || event?.date);
      return eventDate && eventDate.getTime() === firstDate.getTime();
    });
    const totalSupply = this.firstPositiveNumber(
      vestingSummary?.totalAmount,
      row?.totalSupply,
      row?.maxSupply,
    );
    const amount = this.roundNumber(
      sameDateEvents.reduce((total, event) => total + Number(event?.amount || 0), 0),
      6,
    );
    const percentOfSupply = this.roundNumber(
      sameDateEvents.reduce((total, event) => {
        const percent = this.normalizePercent(
          this.firstNumber(event?.percentOfSupply, event?.percent),
        );
        return total + Number(percent || 0);
      }, 0) ||
        (amount !== undefined && totalSupply !== undefined && totalSupply > 0
          ? (amount / totalSupply) * 100
          : 0),
      6,
    );
    if ((!amount || amount <= 0) && (!percentOfSupply || percentOfSupply <= 0)) return undefined;

    const price = this.firstPositiveNumber(row?.price);
    const valueUsd =
      amount !== undefined && price !== undefined ? this.roundNumber(amount * price, 6) : undefined;
    const marketCap = this.firstPositiveNumber(row?.marketCap);
    const marketCapSharePercent =
      valueUsd !== undefined && marketCap !== undefined && marketCap > 0
        ? this.roundNumber((valueUsd / marketCap) * 100, 6)
        : undefined;
    const rounds = sameDateEvents.map((event) => this.cleanObject({
      roundName: event?.roundName,
      amount: this.toFiniteNumber(event?.amount),
      percentOfSupply: this.normalizePercent(event?.percentOfSupply),
      unlockType: event?.unlockType,
    }));
    const roundNames = this.uniqueStrings(rounds.map((event) => event.roundName));

    return this.cleanObject({
      id: `generated:${this.toIdString(row?.canonicalProjectId) || this.toIdString(row?.marketAssetId)}:${firstDate.toISOString()}`,
      date: firstDate.toISOString(),
      unlockDate: firstDate.toISOString(),
      amount,
      percent: percentOfSupply,
      percentOfSupply,
      valueUsd,
      sourceValueUsd: valueUsd,
      marketCapSharePercent,
      sourceMarketCapSharePercent: marketCapSharePercent,
      roundsCount: rounds.length,
      roundNames,
      rounds,
      source: "fomo-v2-generated",
      sourceType: "fomo-v2-generated",
      unlockType: "vesting_schedule",
      generated: true,
    });
  }

  private buildScheduleNextUnlockingEvent(input: {
    schedule: any;
    row: any;
    amount?: number;
    allocationPercent?: number;
    lockedPercent?: number;
    roundName?: string;
  }): any | undefined {
    const unlockDate = this.nextUnlockDateFromSchedule(input.schedule, input.lockedPercent);
    if (!unlockDate) return undefined;

    const amount = this.unlockAmountForScheduleEvent(
      input.schedule,
      input.amount,
      input.lockedPercent,
      unlockDate,
    );
    const totalSupply = this.firstPositiveNumber(
      input.row?.totalSupply,
      input.row?.maxSupply,
      input.amount && input.allocationPercent
        ? (input.amount * 100) / input.allocationPercent
        : undefined,
    );
    const percentOfSupply =
      amount !== undefined && totalSupply !== undefined && totalSupply > 0
        ? this.roundNumber((amount / totalSupply) * 100, 6)
        : undefined;
    const price = this.firstPositiveNumber(input.row?.price);
    const valueUsd =
      amount !== undefined && price !== undefined ? this.roundNumber(amount * price, 6) : undefined;
    const marketCap = this.firstPositiveNumber(input.row?.marketCap);
    const marketCapSharePercent =
      valueUsd !== undefined && marketCap !== undefined && marketCap > 0
        ? this.roundNumber((valueUsd / marketCap) * 100, 6)
        : undefined;

    return this.cleanObject({
      date: unlockDate.toISOString(),
      unlockDate: unlockDate.toISOString(),
      amount,
      percent: percentOfSupply,
      percentOfSupply,
      valueUsd,
      sourceValueUsd: valueUsd,
      marketCapSharePercent,
      sourceMarketCapSharePercent: marketCapSharePercent,
      roundName: input.roundName,
      roundNames: input.roundName ? [input.roundName] : undefined,
      roundsCount: input.roundName ? 1 : undefined,
      unlockType: input.schedule?.vestingType || "vesting_schedule",
      source: "fomo-v2-generated",
      sourceType: input.schedule?.sourceType || "fomo-v2",
      generated: true,
    });
  }

  private toLegacyVestingSummary(summary: any): any {
    const lastUnlockDate = this.toDate(summary?.lastUnlockDate);
    const nextUnlockDate = this.toDate(summary?.nextUnlockDate);
    const calculatedAt = this.toDate(summary?.calculatedAt);

    return this.cleanObject({
      _id: this.toIdString(summary?._id),
      id: this.toIdString(summary?._id),
      totalAmount: this.toFiniteNumber(summary?.totalAmount),
      unlockedAmount: this.toFiniteNumber(summary?.unlockedAmount),
      lockedAmount: this.toFiniteNumber(summary?.lockedAmount),
      untrackedAmount: this.toFiniteNumber(summary?.untrackedAmount),
      unlockedPercent: this.normalizePercent(summary?.unlockedPercent),
      lockedPercent: this.normalizePercent(summary?.lockedPercent),
      untrackedPercent: this.normalizePercent(summary?.untrackedPercent),
      lastUnlockDate: lastUnlockDate ? lastUnlockDate.toISOString() : undefined,
      nextUnlockDate: nextUnlockDate ? nextUnlockDate.toISOString() : undefined,
      nextUnlockEventId: this.toIdString(summary?.nextUnlockEventId) || undefined,
      sourceUnlockedValueUsd: this.toFiniteNumber(summary?.sourceUnlockedValueUsd),
      sourceLockedValueUsd: this.toFiniteNumber(summary?.sourceLockedValueUsd),
      calculatedAt: calculatedAt ? calculatedAt.toISOString() : undefined,
      sourceType: summary?.sourceType,
    });
  }

  private toLegacyUnlockEvent(event: any): any {
    const unlockDate = this.toDate(event?.unlockDate);
    const amount = this.toFiniteNumber(event?.amount);
    const percentOfSupply = this.normalizePercent(event?.percentOfSupply);
    const valueUsd = this.toFiniteNumber(event?.sourceValueUsd);
    const marketCapSharePercent = this.normalizePercent(event?.sourceMarketCapSharePercent);
    const roundName = event?.roundName;

    return this.cleanObject({
      _id: this.toIdString(event?._id),
      id: this.toIdString(event?._id),
      saleId: event?.saleId,
      tokenAllocationId: this.toIdString(event?.tokenAllocationId) || undefined,
      vestingRoundId: this.toIdString(event?.vestingRoundId) || undefined,
      vestingScheduleId: this.toIdString(event?.vestingScheduleId) || undefined,
      normalizedRoundName: event?.normalizedRoundName,
      date: unlockDate ? unlockDate.toISOString() : undefined,
      unlockDate: unlockDate ? unlockDate.toISOString() : undefined,
      amount,
      percent: percentOfSupply,
      percentOfSupply,
      roundName,
      roundNames: roundName ? [roundName] : undefined,
      roundsCount: roundName ? 1 : undefined,
      rounds: roundName
        ? [
            this.cleanObject({
              roundName,
              amount,
              percentOfSupply,
              unlockType: event?.unlockType,
            }),
          ]
        : undefined,
      stage: event?.stage || roundName,
      unlockType: event?.unlockType,
      unlockTypes: Array.isArray(event?.unlockTypes) ? event.unlockTypes : undefined,
      isTgeUnlock: event?.isTgeUnlock,
      valueUsd,
      sourceValueUsd: valueUsd,
      marketCapSharePercent,
      sourceMarketCapSharePercent: marketCapSharePercent,
      sourceType: event?.sourceType,
    });
  }

  private emptyMarketVestingOverview(): MarketVestingOverview {
    return {
      tokenAllocation: [],
      vestingRounds: [],
      vestingSchedule: [],
      vestingTimeline: [],
      events: [],
      unlockingEvents: [],
      sourceLinks: [],
    };
  }

  private hasMarketVestingData(overview: MarketVestingOverview): boolean {
    return Boolean(
      overview.tokenAllocation.length ||
      overview.vestingRounds.length ||
      overview.vestingSchedule.length ||
      overview.vestingTimeline.length ||
      overview.events.length ||
      overview.unlockingEvents.length ||
      overview.vestingSummary,
    );
  }

  private collectVestingSourceLinks(rows: any[]): any[] {
    const seen = new Set<string>();
    const links: any[] = [];

    for (const row of rows || []) {
      const candidates = [
        {
          url: row?.sourceUrl,
          source: this.firstString(row?.primarySource, row?.sourceType),
        },
        ...(Array.isArray(row?.sourceRefs)
          ? row.sourceRefs.map((sourceRef: any) => ({
              url: sourceRef?.sourceUrl,
              source: sourceRef?.source,
            }))
          : []),
      ];

      for (const candidate of candidates) {
        const url = this.firstString(candidate?.url);
        if (!url) continue;
        const key = url.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        links.push(
          this.cleanObject({
            href: url,
            url,
            name: this.firstString(candidate?.source, "Source"),
            source: candidate?.source,
          }),
        );
      }
    }

    return links;
  }

  private buildMarketChartHistory(snapshots: any[]): any[] {
    return [...(snapshots || [])]
      .reverse()
      .map((snapshot: any) => {
        const timestamp = this.toDate(snapshot.timestamp);
        const priceUsd = this.toFiniteNumber(snapshot.priceUsd);
        if (!timestamp || priceUsd === undefined || priceUsd <= 0) return undefined;

        const btcPriceUsd = this.toFiniteNumber(snapshot.btcPriceUsd);
        const ethPriceUsd = this.toFiniteNumber(snapshot.ethPriceUsd);

        return this.cleanObject({
          timestamp: timestamp.getTime(),
          createdAt: timestamp.toISOString(),
          price: this.cleanObject({
            USD: priceUsd,
            BTC: btcPriceUsd !== undefined && btcPriceUsd > 0 ? priceUsd / btcPriceUsd : undefined,
            ETH: ethPriceUsd !== undefined && ethPriceUsd > 0 ? priceUsd / ethPriceUsd : undefined,
          }),
          marketCap: this.toFiniteNumber(snapshot.marketCapUsd),
          volume24h: this.toFiniteNumber(snapshot.volumeUsd),
        });
      })
      .filter(Boolean);
  }

  private withMarketDetailFallbacks(row: any, canonicalProject: any, snapshotStats: any): any {
    const rating = this.firstPositiveNumber(
      row?.rating,
      row?.fomoScore,
      canonicalProject?.rating,
      canonicalProject?.fomoScore,
      canonicalProject?.metadata?.rating,
      canonicalProject?.metadata?.fomoScore,
    );
    const fomoScore = this.firstPositiveNumber(
      row?.fomoScore,
      row?.rating,
      canonicalProject?.fomoScore,
      canonicalProject?.rating,
      canonicalProject?.metadata?.fomoScore,
      canonicalProject?.metadata?.rating,
    );
    const fullness = this.firstPositiveNumber(
      row?.fullness,
      canonicalProject?.fullness,
      canonicalProject?.metadata?.fullness,
    );

    return this.cleanObject({
      ...row,
      volume24hChange: this.firstNumber(row?.volume24hChange, snapshotStats?.volume24hChange),
      athUsd: this.firstPositiveNumber(row?.athUsd, snapshotStats?.athUsd),
      athUsdDate: row?.athUsdDate || snapshotStats?.athUsdDate,
      athUsdChangePercent: this.firstNumber(row?.athUsdChangePercent, snapshotStats?.athUsdChangePercent),
      atlUsd: this.firstPositiveNumber(row?.atlUsd, snapshotStats?.atlUsd),
      atlUsdDate: row?.atlUsdDate || snapshotStats?.atlUsdDate,
      atlUsdChangePercent: this.firstNumber(row?.atlUsdChangePercent, snapshotStats?.atlUsdChangePercent),
      fomoScore,
      rating,
      fullness,
      isVestingReview: Boolean(canonicalProject?.isVestingReview || row?.isVestingReview),
      ratingBreakdown:
        row?.ratingBreakdown ||
        canonicalProject?.ratingBreakdown ||
        canonicalProject?.metadata?.ratingBreakdown,
    });
  }

  private async loadSnapshotMarketStats(marketAssetId: Types.ObjectId, row: any = {}): Promise<any> {
    const baseQuery = {
      marketAssetId,
      provider: "coingecko",
      priceUsd: { $gt: 0 },
    };
    const [high, low, latest] = await Promise.all([
      this.marketSnapshotModel.findOne(baseQuery).sort({ priceUsd: -1, timestamp: -1 }).lean(),
      this.marketSnapshotModel.findOne(baseQuery).sort({ priceUsd: 1, timestamp: 1 }).lean(),
      this.marketSnapshotModel.findOne(baseQuery).sort({ timestamp: -1 }).lean(),
    ]);

    if (!high || !low || !latest) return {};

    const latestTimestamp = this.toDate(latest.timestamp);
    const previous24h = latestTimestamp
      ? await this.marketSnapshotModel
          .findOne({
            marketAssetId,
            provider: "coingecko",
            timestamp: { $lte: new Date(latestTimestamp.getTime() - 24 * 60 * 60 * 1000) },
            volumeUsd: { $gt: 0 },
          })
          .sort({ timestamp: -1 })
          .lean()
      : null;
    const latestVolume = this.firstPositiveNumber(row?.volume24h, latest?.volumeUsd);
    const previousVolume = this.firstPositiveNumber(previous24h?.volumeUsd);
    const volume24hChange =
      latestVolume !== undefined && previousVolume !== undefined && previousVolume > 0
        ? this.roundNumber(((latestVolume - previousVolume) / previousVolume) * 100, 4)
        : undefined;
    const highPrice = this.firstPositiveNumber(high.priceUsd);
    const lowPrice = this.firstPositiveNumber(low.priceUsd);
    const currentPrice = this.firstPositiveNumber(row?.price, latest?.priceUsd);

    return this.cleanObject({
      source: "project_market_snapshots",
      athUsd: highPrice,
      athUsdDate: high.timestamp,
      athUsdChangePercent:
        currentPrice !== undefined && highPrice !== undefined && highPrice > 0
          ? this.roundNumber(((currentPrice - highPrice) / highPrice) * 100, 4)
          : undefined,
      atlUsd: lowPrice,
      atlUsdDate: low.timestamp,
      atlUsdChangePercent:
        currentPrice !== undefined && lowPrice !== undefined && lowPrice > 0
          ? this.roundNumber(((currentPrice - lowPrice) / lowPrice) * 100, 4)
          : undefined,
      volume24hChange,
    });
  }

  private buildMarketContracts(row: any, marketAsset: any): any[] {
    const contracts = [
      ...(Array.isArray(row?.contracts) ? row.contracts : []),
      ...(Array.isArray(marketAsset?.contracts) ? marketAsset.contracts : []),
    ];
    const seen = new Set<string>();
    const result: any[] = [];

    for (const item of contracts) {
      const address = this.firstString(item?.contract, item?.address);
      if (!address) continue;
      const chain = this.firstString(item?.networkName, item?.network, item?.chain, item?.chainSlug, item?.chainKey) || "Contract";
      const key = `${chain.toLowerCase()}:${address.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      result.push(
        this.cleanObject({
          contract: address,
          address,
          networkName: this.humanizeChainName(chain),
          network: chain,
          chain,
          chainKey: item?.chainKey,
          chainSlug: item?.chainSlug,
          networkImage: item?.networkImage || item?.chainLogo || item?.logo || "",
          source: item?.source,
          verified: item?.verified,
        }),
      );
    }

    return result;
  }

  private resolveMarketPerformanceDetail(row: any, performanceDoc: any): any {
    if (!performanceDoc?.performance || !Object.keys(performanceDoc.performance).length) {
      return row;
    }

    return {
      ...row,
      performance: performanceDoc.performance,
      performanceUpdatedAt: performanceDoc.calculatedAt || performanceDoc.updatedAt,
      performanceSource: performanceDoc.source,
      performanceProvider: performanceDoc.provider,
      performanceMissing: performanceDoc.missing,
      performanceMeta: {
        ...(performanceDoc.meta || {}),
        performanceDocumentId: this.toIdString(performanceDoc._id),
        anchorTimestamp: performanceDoc.anchorTimestamp,
        calculatedAt: performanceDoc.calculatedAt,
      },
    };
  }

  private buildAllTimePriceChange(performance: any = {}, usdQuote: any = {}): any {
    const quoteValue = (quote: "usd" | "btc" | "eth" | "sol", field: string): number | null => {
      const rawValue = performance?.[quote]?.[field];
      if (rawValue === null || rawValue === undefined || rawValue === "") return null;
      const value = this.toFiniteNumber(rawValue);
      return value === undefined ? null : value;
    };
    const usdValue = (field: string, fallback?: any): number | null => {
      const value = quoteValue("usd", field);
      if (value !== null) return value;
      if (fallback === null || fallback === undefined || fallback === "") return null;
      const fallbackValue = this.toFiniteNumber(fallback);
      return fallbackValue === undefined ? null : fallbackValue;
    };
    const row = (field: string, usdFallback?: any) => ({
      USD: usdValue(field, usdFallback),
      BTC: quoteValue("btc", field),
      ETH: quoteValue("eth", field),
      SOL: quoteValue("sol", field),
    });

    return {
      "1H": row("change1h", usdQuote?.percent_change_1h),
      "1D": row("change24h", usdQuote?.percent_change_24h),
      "1W": row("change7d", usdQuote?.percent_change_7d),
      "1M": row("change30d"),
      "3M": row("change90d"),
      "1Y": row("change1y"),
    };
  }

  private normalizeSocialMedia(source: any): any[] {
    if (!source) return [];

    if (Array.isArray(source)) {
      return source
        .map((item: any) => {
          const href = this.firstString(item?.href, item?.url);
          if (!href) return undefined;
          return {
            href,
            name: this.firstString(item?.name, item?.label, item?.type) || "Link",
            icon: item?.icon,
            type: item?.type,
            verified: item?.verified,
          };
        })
        .filter(Boolean);
    }

    if (typeof source === "object") {
      const result: any[] = [];
      for (const [name, value] of Object.entries(source)) {
        const values = Array.isArray(value) ? value : [value];
        for (const href of values) {
          const url = this.firstString(href);
          if (!url) continue;
          result.push({ href: url, name });
        }
      }
      return result;
    }

    return [];
  }

  private uniqueSocialLinks(items: any[]): any[] {
    const seen = new Set<string>();
    const result: any[] = [];

    for (const item of items || []) {
      const href = this.firstString(item?.href, item?.url);
      if (!href) continue;
      const key = href.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({
        href,
        name: this.firstString(item?.name, item?.label, item?.type) || "Link",
        icon: item?.icon,
        type: item?.type,
        verified: item?.verified,
      });
    }

    return result;
  }

  private humanizeChainName(value: any): string {
    const text = this.firstString(value) || "Contract";
    return text
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private toLegacyProjectShapes(rows: any[] = [], source = "v2_read_model"): any[] {
    return (rows || []).map((row) => this.toLegacyProjectShape(row, source));
  }

  private buildCanonicalScoreFallbackStages(): any[] {
    return [
      {
        $lookup: {
          from: "canonical_projects",
          localField: "canonicalProjectId",
          foreignField: "_id",
          as: "__canonicalProject",
        },
      },
      {
        $addFields: {
          __canonicalProject: { $arrayElemAt: ["$__canonicalProject", 0] },
        },
      },
      {
        $addFields: {
          rating: {
            $cond: [
              {
                $gt: [
                  { $convert: { input: "$rating", to: "double", onError: 0, onNull: 0 } },
                  0,
                ],
              },
              "$rating",
              { $ifNull: ["$__canonicalProject.rating", "$__canonicalProject.metadata.rating"] },
            ],
          },
          fomoScore: {
            $cond: [
              {
                $gt: [
                  { $convert: { input: "$fomoScore", to: "double", onError: 0, onNull: 0 } },
                  0,
                ],
              },
              "$fomoScore",
              { $ifNull: ["$__canonicalProject.fomoScore", "$__canonicalProject.metadata.fomoScore"] },
            ],
          },
          fullness: {
            $cond: [
              {
                $gt: [
                  { $convert: { input: "$fullness", to: "double", onError: 0, onNull: 0 } },
                  0,
                ],
              },
              "$fullness",
              { $ifNull: ["$__canonicalProject.fullness", "$__canonicalProject.metadata.fullness"] },
            ],
          },
          ratingBreakdown: {
            $ifNull: [
              "$ratingBreakdown",
              { $ifNull: ["$__canonicalProject.ratingBreakdown", "$__canonicalProject.metadata.ratingBreakdown"] },
            ],
          },
          isVestingReview: {
            $ifNull: ["$isVestingReview", "$__canonicalProject.isVestingReview"],
          },
        },
      },
      { $project: { __canonicalProject: 0 } },
    ];
  }

  private buildMarketEligibilityStages(options: { requireFreshMarketData?: boolean } = {}): any[] {
    const freshCutoff = new Date(Date.now() - this.getMarketDataFreshWindowMs());
    const requireFreshMarketData = options.requireFreshMarketData !== false;

    return [
      {
        $addFields: {
          effectiveMarketDataUpdatedAt: {
            $ifNull: [
              {
                $convert: {
                  input: "$marketDataUpdatedAt",
                  to: "date",
                  onError: null,
                  onNull: null,
                },
              },
              {
                $ifNull: [
                  {
                    $convert: {
                      input: "$usdQuote.last_updated",
                      to: "date",
                      onError: null,
                      onNull: null,
                    },
                  },
                  {
                    $convert: {
                      input: "$updatedAt",
                      to: "date",
                      onError: null,
                      onNull: null,
                    },
                  },
                ],
              },
            ],
          },
          effectiveDateAdded: {
            $ifNull: [
              {
                $convert: {
                  input: "$dateAdded",
                  to: "date",
                  onError: null,
                  onNull: null,
                },
              },
              {
                $ifNull: [
                  {
                    $convert: {
                      input: "$createdAt",
                      to: "date",
                      onError: null,
                      onNull: null,
                    },
                  },
                  {
                    $convert: {
                      input: "$updatedAt",
                      to: "date",
                      onError: null,
                      onNull: null,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $match: {
          trading: "CURRENTLY_TRADING",
          status: "active",
          price: { $gt: 0 },
          volume24h: { $gt: 0 },
          marketCap: { $gt: 0 },
          rank: MARKET_VISIBLE_RANK_FILTER,
          ...(requireFreshMarketData ? { effectiveMarketDataUpdatedAt: { $gte: freshCutoff } } : {}),
          "providerIds.coingeckoId": { $type: "string", $ne: "" },
        },
      },
    ];
  }

  private buildMarketCategoryFilterStage(type: FomoV2MarketCategoryType): any {
    switch (type) {
      case "recently":
        return {
          $match: {
            effectiveDateAdded: { $exists: true, $ne: null },
            volume24h: { $gt: 10_000 },
            price: { $gt: 0 },
          },
        };
      case "gainers":
        return {
          $match: {
            priceChange: { $gt: 0 },
            volume24h: { $gte: 100_000 },
            marketCap: { $gte: 1_000_000 },
            rank: MARKET_VISIBLE_RANK_FILTER,
          },
        };
      case "trending":
        return {
          $match: {
            volume24h: { $gte: 50_000 },
            marketCap: { $gte: 500_000 },
            priceChange: { $gt: -300, $lt: 300 },
          },
        };
      case "accumulation":
        return {
          $match: {
            volume24h: { $gte: 100_000 },
            marketCap: { $gte: 1_000_000 },
            priceChange: { $gte: -10, $lte: 20 },
          },
        };
      default:
        throw new Error(`Invalid FOMO v2 market category type=${type}`);
    }
  }

  private buildMarketCategoryScoreStage(type: FomoV2MarketCategoryType): any {
    const now = new Date();
    const liquidityWeight = this.logWeightExpression("$volume24h", 100_000, 50_000_000);
    const liquidityScore = this.scoreExpression(liquidityWeight);
    const marketCapWeight = this.logWeightExpression("$marketCap", 1_000_000, 1_000_000_000);
    const marketCapScore = this.scoreExpression(marketCapWeight);
    const freshnessWeight = this.freshnessWeightExpression(now);
    const volume24hChangeScore = this.volumeMomentumScoreExpression();
    const priceChange24hScore = this.positivePercentScoreExpression("priceChange", 100);
    const scoreField = this.getMarketCategoryScoreField(type);
    let scoreExpression: any;

    switch (type) {
      case "gainers":
        scoreExpression = {
          $multiply: [
            "$priceChange",
            liquidityWeight,
            marketCapWeight,
            freshnessWeight,
          ],
        };
        break;
      case "trending":
        scoreExpression = {
          $add: [
            { $multiply: [volume24hChangeScore, 0.35] },
            { $multiply: [priceChange24hScore, 0.25] },
            { $multiply: [this.scoreExpression(this.logWeightExpression("$volume24h", 50_000, 50_000_000)), 0.25] },
            { $multiply: [this.rankScoreExpression(), 0.15] },
          ],
        };
        break;
      case "accumulation":
        scoreExpression = {
          $add: [
            { $multiply: [volume24hChangeScore, 0.30] },
            { $multiply: [this.volumeToMarketCapScoreExpression(), 0.35] },
            { $multiply: [liquidityScore, 0.20] },
            { $multiply: [this.stabilityScoreExpression(), 0.15] },
          ],
        };
        break;
      case "recently":
        scoreExpression = {
          $add: [
            { $multiply: [this.recencyScoreExpression(now), 0.55] },
            { $multiply: [this.scoreExpression(this.logWeightExpression("$volume24h", 10_000, 10_000_000)), 0.25] },
            { $multiply: [marketCapScore, 0.10] },
            { $multiply: [this.positivePercentScoreExpression("priceChange", 50), 0.10] },
          ],
        };
        break;
      default:
        throw new Error(`Invalid FOMO v2 market category type=${type}`);
    }

    return {
      $addFields: {
        [scoreField]: scoreExpression,
        marketCategoryScore: scoreExpression,
        volumeToMarketCap: this.volumeToMarketCapExpression(),
      },
    };
  }

  private getMarketCategoryScoreField(type: FomoV2MarketCategoryType): string {
    const fields: Record<FomoV2MarketCategoryType, string> = {
      recently: "recentlyAddedScore",
      gainers: "gainerScore",
      trending: "trendingScore",
      accumulation: "accumulationScore",
    };

    return fields[type];
  }

  private getMarketCategorySort(type: FomoV2MarketCategoryType): Record<string, 1 | -1> {
    const scoreField = this.getMarketCategoryScoreField(type);

    switch (type) {
      case "recently":
        return { [scoreField]: -1, effectiveDateAdded: -1, volume24h: -1, rank: 1 };
      case "gainers":
        return { [scoreField]: -1, priceChange: -1, volume24h: -1, rank: 1 };
      case "trending":
        return { [scoreField]: -1, volume24hChange: -1, volume24h: -1, rank: 1 };
      case "accumulation":
        return { [scoreField]: -1, volume24hChange: -1, volumeToMarketCap: -1, rank: 1 };
      default:
        throw new Error(`Invalid FOMO v2 market category type=${type}`);
    }
  }

  private buildMarketCategoryFacet(
    type: FomoV2MarketCategoryType,
    limit: number,
    fields: Record<string, any>,
  ): any[] {
    return [
      this.buildMarketCategoryFilterStage(type),
      this.buildMarketCategoryScoreStage(type),
      { $sort: this.getMarketCategorySort(type) },
      { $limit: limit },
      ...this.buildCanonicalScoreFallbackStages(),
      { $project: fields },
    ];
  }

  private getMarketCategoryProjectProjection(): Record<string, any> {
    return {
      effectiveMarketDataUpdatedAt: 0,
      effectiveDateAdded: 0,
      __rankSort: 0,
      __sortValue: 0,
      __sortMissing: 0,
    };
  }

  private normalizeMarketCategoryType(type: any): FomoV2MarketCategoryType {
    const normalized = String(type || "").trim().toLowerCase();
    if (["recently", "gainers", "trending", "accumulation"].includes(normalized)) {
      return normalized as FomoV2MarketCategoryType;
    }

    throw new Error(`Invalid FOMO v2 market category type=${type}`);
  }

  private getMarketDataFreshWindowMs(): number {
    const hours = Number(this.configService.get("MARKET_DATA_FRESH_HOURS") || 72);

    return Math.max(1, hours) * 60 * 60 * 1000;
  }

  private clamp01(expression: any): any {
    return { $min: [1, { $max: [0, expression] }] };
  }

  private logWeightExpression(valueExpression: any, floor: number, ceiling: number): any {
    const minLog = Math.log10(floor);
    const maxLog = Math.log10(ceiling);

    return this.clamp01({
      $divide: [
        {
          $subtract: [
            { $log10: { $max: [valueExpression, 1] } },
            minLog,
          ],
        },
        maxLog - minLog,
      ],
    });
  }

  private scoreExpression(weightExpression: any): any {
    return { $multiply: [weightExpression, 100] };
  }

  private positivePercentScoreExpression(field: string, capPercent: number): any {
    return this.scoreExpression(
      this.clamp01({
        $divide: [
          { $max: [{ $ifNull: [`$${field}`, 0] }, 0] },
          capPercent,
        ],
      }),
    );
  }

  private volumeMomentumScoreExpression(): any {
    return {
      $cond: [
        { $ne: [{ $ifNull: ["$volume24hChange", null] }, null] },
        this.positivePercentScoreExpression("volume24hChange", 300),
        this.scoreExpression(this.logWeightExpression("$volume24h", 50_000, 50_000_000)),
      ],
    };
  }

  private rankScoreExpression(maxRank = COINGECKO_TIERS.WARM.maxRank): any {
    const rankWeight = this.clamp01({
      $subtract: [
        1,
        {
          $divide: [
            { $subtract: ["$rank", 1] },
            maxRank - 1,
          ],
        },
      ],
    });

    return this.scoreExpression({
      $cond: [
        {
          $and: [
            { $gt: ["$rank", 0] },
            { $lte: ["$rank", maxRank] },
          ],
        },
        rankWeight,
        0,
      ],
    });
  }

  private freshnessWeightExpression(now: Date): any {
    return this.clamp01({
      $subtract: [
        1,
        {
          $divide: [
            { $subtract: [now, "$effectiveMarketDataUpdatedAt"] },
            this.getMarketDataFreshWindowMs(),
          ],
        },
      ],
    });
  }

  private volumeToMarketCapExpression(): any {
    return {
      $cond: [
        { $gt: ["$marketCap", 0] },
        { $divide: ["$volume24h", "$marketCap"] },
        0,
      ],
    };
  }

  private volumeToMarketCapScoreExpression(): any {
    return this.scoreExpression(
      this.clamp01({
        $divide: [this.volumeToMarketCapExpression(), 0.5],
      }),
    );
  }

  private stabilityScoreExpression(): any {
    return this.scoreExpression({
      $subtract: [
        1,
        this.clamp01({
          $divide: [
            { $abs: { $ifNull: ["$priceChange", 0] } },
            20,
          ],
        }),
      ],
    });
  }

  private recencyScoreExpression(now: Date): any {
    const recentWindowMs = 180 * 24 * 60 * 60 * 1000;

    return this.scoreExpression(
      this.clamp01({
        $subtract: [
          1,
          {
            $divide: [
              { $subtract: [now, "$effectiveDateAdded"] },
              recentWindowMs,
            ],
          },
        ],
      }),
    );
  }

  private async loadV2IdentityContext(marketAssets: any[]): Promise<V2IdentityContext> {
    const marketAssetIds = marketAssets
      .map((asset: any) => this.toIdString(asset?._id))
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const [links, currentReadRows] = marketAssetIds.length
      ? await Promise.all([
          this.projectAssetLinkModel.find({ marketAssetId: { $in: marketAssetIds } }).lean(),
          this.readModel.find({ marketAssetId: { $in: marketAssetIds } }).lean(),
        ])
      : [[], []];
    const canonicalIds = this.uniqueStrings(links.map((link: any) => this.toIdString(link.canonicalProjectId))).filter((id) =>
      mongoose.Types.ObjectId.isValid(id),
    );
    const canonicalProjects = canonicalIds.length
      ? await Promise.all([
          this.canonicalProjectModel.find({ _id: { $in: canonicalIds.map((id) => new Types.ObjectId(id)) } }).lean(),
        ])
          .then(([rows]) => rows)
      : [];
    const context: V2IdentityContext = {
      linksByMarketAssetId: new Map(),
      canonicalById: new Map(),
      currentReadModelByMarketAssetId: new Map(),
    };

    for (const link of links as any[]) {
      const key = this.toIdString(link.marketAssetId);
      if (!key) continue;
      const current = context.linksByMarketAssetId.get(key) || [];
      current.push(link);
      context.linksByMarketAssetId.set(key, current);
    }
    for (const canonical of canonicalProjects as any[]) {
      context.canonicalById.set(this.toIdString(canonical._id), canonical);
    }
    for (const row of currentReadRows as any[]) {
      context.currentReadModelByMarketAssetId.set(this.toIdString(row.marketAssetId), row);
    }

    return context;
  }

  private async loadRankedMarketAssets(limit: number, offset: number): Promise<any[]> {
    return this.marketAssetModel
      .aggregate([
        { $match: { status: "active" } },
        {
          $addFields: {
            __rankSort: {
              $cond: [
                { $gt: ["$metadata.marketCapRank", 0] },
                "$metadata.marketCapRank",
                Number.MAX_SAFE_INTEGER,
              ],
            },
          },
        },
        { $sort: { __rankSort: 1, _id: 1 } },
        { $skip: offset },
        { $limit: limit },
        { $project: { __rankSort: 0 } },
      ])
      .exec();
  }

  private buildReadModelRow(
    marketAsset: any,
    link: any,
    canonicalProject: any,
    currentReadModel: any,
  ): any {
    const rank = this.firstPositiveNumber(
      marketAsset?.metadata?.marketCapRank,
      canonicalProject?.metadata?.marketCapRank,
      currentReadModel?.rank,
    );
    const providerIds = this.cleanObject({
      ...(canonicalProject?.providerIds || {}),
      ...(marketAsset?.providerIds || {}),
    });
    const symbol = this.firstString(marketAsset?.symbol, currentReadModel?.symbol, canonicalProject?.symbol);
    const category = this.firstString(currentReadModel?.category);

    return {
      legacyProjectId: currentReadModel?.legacyProjectId,
      legacyRouteId: currentReadModel?.legacyRouteId,
      canonicalProjectId: canonicalProject?._id ? new Types.ObjectId(this.toIdString(canonicalProject._id)) : undefined,
      marketAssetId: new Types.ObjectId(this.toIdString(marketAsset._id)),
      projectKind: this.resolveProjectKind(canonicalProject),
      name:
        this.firstString(marketAsset?.name, currentReadModel?.name, canonicalProject?.name) ||
        "Unknown Market Project",
      symbol,
      slug: this.firstString(canonicalProject?.slug, marketAsset?.slug, currentReadModel?.slug),
      logo: this.firstString(currentReadModel?.logo, marketAsset?.metadata?.image, canonicalProject?.metadata?.image),
      isVestingReview: Boolean(canonicalProject?.isVestingReview),
      niche: this.firstString(currentReadModel?.niche, category, symbol),
      category,
      rank,
      tier: this.resolveTier(rank),
      trading: "CURRENTLY_TRADING",
      status: this.firstString(marketAsset?.status, canonicalProject?.status, "active"),
      price: currentReadModel?.price,
      priceChange: currentReadModel?.priceChange,
      marketCap: currentReadModel?.marketCap,
      fullyDilutedMarketCap: currentReadModel?.fullyDilutedMarketCap,
      volume24h: currentReadModel?.volume24h,
      volume24hChange: currentReadModel?.volume24hChange,
      circulatingSupply: currentReadModel?.circulatingSupply,
      totalSupply: currentReadModel?.totalSupply,
      maxSupply: currentReadModel?.maxSupply,
      circulatingSupplyPercent: this.resolveCirculatingSupplyPercent(currentReadModel),
      usdQuote: currentReadModel?.usdQuote || {},
      marketDataUpdatedAt: currentReadModel?.marketDataUpdatedAt,
      dateAdded: currentReadModel?.dateAdded,
      chart7d: currentReadModel?.chart7d,
      fomoScore: this.firstPositiveNumber(
        currentReadModel?.fomoScore,
        currentReadModel?.rating,
        canonicalProject?.fomoScore,
        canonicalProject?.rating,
        canonicalProject?.metadata?.fomoScore,
        canonicalProject?.metadata?.rating,
      ),
      rating: this.firstPositiveNumber(
        currentReadModel?.rating,
        currentReadModel?.fomoScore,
        canonicalProject?.rating,
        canonicalProject?.fomoScore,
        canonicalProject?.metadata?.rating,
        canonicalProject?.metadata?.fomoScore,
      ),
      fullness: this.firstPositiveNumber(
        currentReadModel?.fullness,
        canonicalProject?.fullness,
        canonicalProject?.metadata?.fullness,
      ),
      providerIds,
      sourceCoverage: {
        sources: [
          "market_assets",
          "project_asset_links",
          "canonical_projects",
          ...(currentReadModel ? ["market_project_read_models:quote_preserve"] : []),
        ],
        displaySource: "coingecko",
        providerIds,
        projectAssetLinkId: this.toIdString(link?._id),
        projectAssetLinkStatus: link?.status,
      },
      debug: {
        materializedFrom: "fomo_v2_identity",
        marketAssetStatus: marketAsset?.status,
        projectAssetLinkStatus: link?.status,
        projectAssetLinkVerified: link?.verified,
        materializedAt: new Date(),
      },
    };
  }

  private buildReadModelFilter(query: any): Record<string, any> {
    const andConditions: any[] = [];
    const filter: Record<string, any> = {
      trading: "CURRENTLY_TRADING",
    };
    const includedIds = this.parseObjectIdList(query?.includedProjectIds);
    const excludedIds = this.parseObjectIdList(query?.excludedProjectIds);

    if (query?.status) {
      filter.status = {
        $regex: new RegExp(`^${this.escapeRegExp(String(query.status))}$`, "i"),
      };
    }
    if (query?.searchValue) filter.name = { $regex: new RegExp(this.escapeRegExp(String(query.searchValue)), "i") };
    const additionalStatus = this.normalizeLookupKey(query?.additionalStatus);
    if (additionalStatus === "sponsored") filter.isSponsored = true;
    if (additionalStatus === "eralash") filter.isEralash = true;
    if (includedIds.length) {
      andConditions.push({
        $or: [
          { marketAssetId: { $in: includedIds } },
          { canonicalProjectId: { $in: includedIds } },
        ],
      });
    }
    if (excludedIds.length) {
      andConditions.push({
        $and: [
          { marketAssetId: { $nin: excludedIds } },
          { canonicalProjectId: { $nin: excludedIds } },
        ],
      });
    }

    const categories = this.activeStringFilterValues(query?.categories);
    if (categories.length) {
      andConditions.push({
        $or: [
          { niche: { $in: categories } },
          { category: { $in: categories } },
          { symbol: { $in: categories } },
        ],
      });
    }

    this.pushRangeCondition(andConditions, "price", query.price);
    this.pushRangeCondition(andConditions, "price", query.price_checkboxes);
    this.pushChange24Condition(andConditions, query.change24);
    this.pushRangeCondition(andConditions, "volume24h", query.volume24 || query.volume24h);
    this.pushRangeCondition(andConditions, "marketCap", query.marketCap);
    this.pushRangeCondition(andConditions, "fullyDilutedMarketCap", query.fdv, true);
    this.pushRangeCondition(andConditions, "circulatingSupplyPercent", query.circulationSupply, true);
    this.pushRangeCondition(andConditions, "fomoScore", query.fomoScore, true);
    this.pushTradeLaunchDateCondition(andConditions, query.tradeLaunchDate);

    if (andConditions.length) {
      filter.$and = andConditions;
    }

    return filter;
  }

  private buildMarketTableDataFilter(): Record<string, any> {
    return {
      trading: "CURRENTLY_TRADING",
      status: "active",
      rank: { $type: "number", $gt: 0 },
      "providerIds.coingeckoId": { $type: "string", $ne: "" },
    };
  }

  private mergeReadModelFilters(...filters: Array<Record<string, any>>): Record<string, any> {
    const cleanFilters = filters.filter((filter) => filter && Object.keys(filter).length > 0);
    if (!cleanFilters.length) return {};
    if (cleanFilters.length === 1) return cleanFilters[0];

    return { $and: cleanFilters };
  }

  private selectProjectAssetLink(links: any[]): any {
    return [...links].sort((left, right) => this.linkPriority(right) - this.linkPriority(left))[0];
  }

  private linkPriority(link: any): number {
    let score = 0;
    if (link?.relationType === "primary_token") score += 10;
    if (link?.status === "active") score += 8;
    if (link?.verified) score += 4;
    if (link?.confidence === "exact") score += 3;
    if (link?.confidence === "high") score += 2;
    return score;
  }

  private resolveProjectKind(canonicalProject: any): FomoV2MarketProjectKind {
    if (!canonicalProject) return "market";
    return "market_only";
  }

  private resolveTier(rank: any): MarketDataTier | undefined {
    const value = this.toFiniteNumber(rank);
    if (value === undefined || value < COINGECKO_TIERS.HOT.minRank) return undefined;
    if (value <= COINGECKO_TIERS.HOT.maxRank) return "HOT";
    if (value <= COINGECKO_TIERS.WARM.maxRank) return "WARM";
    return "COLD";
  }

  private parseQueryString(query: any = {}): Record<string, any> {
    const parsed: Record<string, any> = {};
    for (const key of Object.keys(query || {})) {
      const value = query[key];
      if (typeof value === "string" && value.includes(",")) {
        parsed[key] = value.split(",").map((item) => this.parseRangeItem(item));
      } else {
        parsed[key] = this.parseRangeItem(value);
      }
    }
    return parsed;
  }

  private parseRangeItem(value: any): any {
    if (typeof value !== "string") return value;
    const match = value.trim().match(/^(-?\d+(?:\.\d+)?)-(-?\d+(?:\.\d+)?)$/);
    return match ? [Number(match[1]), Number(match[2])] : value;
  }

  private pushRangeCondition(andConditions: any[], field: string, value: any, inclusiveMax = false): void {
    if (!value) return;
    const ranges = this.normalizeRangeItems(value);
    const conditions = ranges.map(([min, max]) => ({
      [field]: inclusiveMax ? { $gte: min, $lte: max } : { $gte: min, $lt: max },
    }));
    if (conditions.length) andConditions.push({ $or: conditions });
  }

  private pushChange24Condition(andConditions: any[], value: any): void {
    if (!value) return;
    const items = Array.isArray(value) ? value : [value];
    const ranges: Record<string, [number, number]> = {
      "0to50": [0, 50],
      "-50to-10": [-50, -10],
      "-10to0": [-10, 0],
      "0to10%": [0, 10],
      "10to50": [10, 50],
      "50to10000000000": [50, 10000000000],
      "<-50%": [-10000000000, -50],
      "-50%to-10%": [-50, -10],
      "-10%to0%": [-10, 0],
      "0%to+10%": [0, 10],
      "+10%to+50%": [10, 50],
      ">+50%": [50, 10000000000],
    };
    const conditions = items
      .map((item: string) => ranges[String(item)] || undefined)
      .filter(Boolean)
      .map(([min, max]) => ({ priceChange: { $gte: min, $lt: max } }));
    if (conditions.length) andConditions.push({ $or: conditions });
  }

  private pushTradeLaunchDateCondition(andConditions: any[], value: any): void {
    if (!value) return;
    const days: Record<string, number> = {
      "<7days": 7,
      "<30days": 30,
      "<90days": 90,
      "<180days": 180,
      "<365days": 365,
    };
    const items = Array.isArray(value) ? value : String(value).split("-");
    const isNumericRange = items.length === 2 && items.every((item: any) => !isNaN(Number(item)));

    if (isNumericRange) {
      const [fromDays, toDays] = items.map(Number);
      andConditions.push({
        dateAdded: {
          $gte: new Date(Date.now() - toDays * 86400000),
          $lte: new Date(Date.now() - fromDays * 86400000),
        },
      });
      return;
    }

    const conditions = items
      .map((key: string) => {
        if (key.startsWith("<") && days[key]) {
          return { dateAdded: { $gte: new Date(Date.now() - days[key] * 86400000) } };
        }
        if (key === ">365days") {
          return { dateAdded: { $lt: new Date(Date.now() - 365 * 86400000) } };
        }
        return null;
      })
      .filter(Boolean);
    if (conditions.length) andConditions.push({ $or: conditions });
  }

  private normalizeRangeItems(value: any): Array<[number, number]> {
    const rawItems = Array.isArray(value) ? value : String(value).split(",");
    return rawItems
      .map((item) => (Array.isArray(item) ? item : this.parseRangeItem(String(item))))
      .filter((range) => Array.isArray(range) && range.length === 2 && range.every((rangeValue) => Number.isFinite(Number(rangeValue))))
      .map((range) => [Number(range[0]), Number(range[1])] as [number, number]);
  }

  private getSortKey(key: any): string {
    const values: Record<string, string> = {
      Price: "price",
      usdPrice: "price",
      "USD Price": "price",
      btcPrice: "priceBTC",
      "BTC Price": "priceBTC",
      ethPrice: "priceETH",
      "ETH Price": "priceETH",
      "1h": "usdQuote.percent_change_1h",
      priceChange1h: "usdQuote.percent_change_1h",
      "24h": "usdQuote.percent_change_24h",
      priceChange24h: "usdQuote.percent_change_24h",
      "7d": "usdQuote.percent_change_7d",
      priceChange7d: "usdQuote.percent_change_7d",
      "1m": "performance.usd.change30d",
      priceChange1m: "performance.usd.change30d",
      "3m": "performance.usd.change90d",
      priceChange3m: "performance.usd.change90d",
      "1y": "performance.usd.change1y",
      priceChange1y: "performance.usd.change1y",
      "Market Cap": "marketCap",
      marketCap: "marketCap",
      FDV: "fullyDilutedMarketCap",
      fdv: "fullyDilutedMarketCap",
      "Volume 24h": "volume24h",
      "Volume (24h)": "volume24h",
      volume24h: "volume24h",
      "Circulating Supply": "circulatingSupply",
      circulationSupply: "circulatingSupply",
      "ATH Price": "athUsd",
      athPrice: "athUsd",
      "ATH Date": "athUsdDate",
      athDate: "athUsdDate",
      "% from ATH": "athUsdChangePercent",
      fromAth: "athUsdChangePercent",
      "ATL Price": "atlUsd",
      atlPrice: "atlUsd",
      "ATL Date": "atlUsdDate",
      atlDate: "atlUsdDate",
      "% from ATL": "atlUsdChangePercent",
      fromAtl: "atlUsdChangePercent",
      "Total Funds Raised": "totalRaised",
      totalFundsRaised: "totalRaised",
      Category: "niche",
      category: "niche",
      "Trade Launch Date": "dateAdded",
      launchDate: "dateAdded",
      Asset: "rank",
      rating: "fomoScore",
      fomoScore: "fomoScore",
      "FOMO Score": "fomoScore",
    };

    return values[String(key || "")] || "";
  }

  private compareByPath(left: any, right: any, path: string, direction: number): number {
    const leftValue = this.toFiniteNumber(this.getPath(left, path));
    const rightValue = this.toFiniteNumber(this.getPath(right, path));
    if (leftValue === undefined && rightValue === undefined) return 0;
    if (leftValue === undefined) return 1;
    if (rightValue === undefined) return -1;
    return (leftValue - rightValue) * direction;
  }

  private missingRequiredFields(project: any): string[] {
    const fields = [
      "_id",
      "name",
      "logo",
      "niche",
      "price",
      "usdQuote.percent_change_1h",
      "usdQuote.percent_change_24h",
      "usdQuote.percent_change_7d",
      "marketCap",
      "volume24h",
      "circulatingSupply",
      "circulatingSupplyPercent",
      "chart7d",
    ];

    return fields.filter((field) => {
      const value = this.getPath(project, field);
      if (Array.isArray(value)) return value.length === 0;
      return value === undefined || value === null || value === "";
    });
  }

  private isStaleMarketData(value: any): boolean {
    const date = this.toDate(value);
    if (!date) return true;
    const staleMs = 72 * 60 * 60 * 1000;
    return Date.now() - date.getTime() > staleMs;
  }

  private activeStringFilterValues(value: any): string[] {
    if (!value) return [];
    const rawValues = Array.isArray(value) ? value : String(value).split(",");
    return rawValues
      .map((item) => String(item || "").trim())
      .filter((item) => item && item.toLowerCase() !== "all");
  }

  private findRelatedVestingRow(source: any, rows: any[], directId?: any): any | undefined {
    const directIdString = this.toIdString(directId);
    if (directIdString) {
      const direct = (rows || []).find((row) => this.toIdString(row?._id) === directIdString);
      if (direct) return direct;
    }

    const saleId = source?.saleId;
    if (saleId !== undefined && saleId !== null && saleId !== "") {
      const bySale = (rows || []).find((row) => String(row?.saleId) === String(saleId));
      if (bySale) return bySale;
    }

    const normalizedName = this.normalizedVestingLabel(
      source?.normalizedRoundName || source?.normalizedName || source?.roundName || source?.name,
    );
    if (!normalizedName) return undefined;

    return (rows || []).find((row) => {
      const rowName = this.normalizedVestingLabel(
        row?.normalizedRoundName || row?.normalizedName || row?.roundName || row?.name,
      );
      return rowName === normalizedName;
    });
  }

  private normalizedVestingLabel(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private estimateUnlockedPercentFromSchedule(schedule: any): number | undefined {
    const explicit = this.normalizePercent(schedule?.currentUnlockedPercentSource);
    if (explicit !== undefined) return explicit;

    const locked = this.normalizePercent(schedule?.currentLockedPercentSource);
    if (locked !== undefined) return this.roundNumber(Math.max(0, 100 - locked), 6);

    const startDate = this.toDate(schedule?.startDate);
    const endDate = this.toDate(schedule?.endDate || schedule?.startDate);
    if (!startDate) return undefined;

    const now = Date.now();
    const tgePercent = this.normalizePercent(schedule?.tgeUnlockPercent) || 0;
    const vestingType = String(schedule?.vestingType || "").toLowerCase();
    if (now < startDate.getTime()) return 0;
    if (vestingType === "tge" || tgePercent >= 99.5) return 100;
    if (!endDate || now >= endDate.getTime()) return 100;
    if (endDate.getTime() <= startDate.getTime()) return 100;

    const progress = (now - startDate.getTime()) / (endDate.getTime() - startDate.getTime());
    return this.roundNumber(Math.min(100, Math.max(0, tgePercent + (100 - tgePercent) * progress)), 6);
  }

  private nextUnlockDateFromSchedule(schedule: any, lockedPercentValue?: number): Date | undefined {
    const startDate = this.toDate(schedule?.startDate);
    const endDate = this.toDate(schedule?.endDate || schedule?.startDate);
    if (!startDate) return undefined;

    const unlockedPercent = this.estimateUnlockedPercentFromSchedule(schedule);
    const lockedPercent =
      lockedPercentValue ??
      (unlockedPercent !== undefined ? Math.max(0, 100 - unlockedPercent) : undefined);
    if (lockedPercent !== undefined && lockedPercent <= 0.000001) return undefined;

    const now = new Date();
    if (startDate.getTime() >= now.getTime()) return startDate;
    if (endDate && endDate.getTime() <= now.getTime()) return undefined;

    const frequency = String(schedule?.vestingFrequency || "").toLowerCase();
    if (frequency.includes("day")) {
      return this.nextRepeatingDate(startDate, now, endDate, "day");
    }
    if (frequency.includes("week")) {
      return this.nextRepeatingDate(startDate, now, endDate, "week");
    }
    if (frequency.includes("month")) {
      return this.nextRepeatingDate(startDate, now, endDate, "month");
    }
    if (frequency.includes("quarter")) {
      return this.nextRepeatingDate(startDate, now, endDate, "quarter");
    }
    if (frequency.includes("year")) {
      return this.nextRepeatingDate(startDate, now, endDate, "year");
    }

    return endDate && endDate.getTime() > now.getTime() ? endDate : undefined;
  }

  private nextRepeatingDate(
    startDate: Date,
    now: Date,
    endDate: Date | undefined,
    unit: "day" | "week" | "month" | "quarter" | "year",
  ): Date | undefined {
    let candidate = new Date(startDate);
    const maxIterations = 1200;
    for (let index = 0; index < maxIterations && candidate.getTime() <= now.getTime(); index += 1) {
      if (unit === "day") {
        candidate = new Date(candidate.getTime() + 24 * 60 * 60 * 1000);
      } else if (unit === "week") {
        candidate = new Date(candidate.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else if (unit === "month") {
        candidate = this.addUtcMonths(candidate, 1);
      } else if (unit === "quarter") {
        candidate = this.addUtcMonths(candidate, 3);
      } else {
        candidate = this.addUtcMonths(candidate, 12);
      }
    }

    if (endDate && candidate.getTime() > endDate.getTime()) {
      return endDate.getTime() > now.getTime() ? endDate : undefined;
    }
    return candidate.getTime() > now.getTime() ? candidate : undefined;
  }

  private addUtcMonths(date: Date, months: number): Date {
    return new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + months,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    ));
  }

  private unlockAmountForScheduleEvent(
    schedule: any,
    totalAmount?: number,
    lockedPercent?: number,
    unlockDate?: Date,
  ): number | undefined {
    if (totalAmount === undefined || totalAmount <= 0) return undefined;

    const startDate = this.toDate(schedule?.startDate);
    const endDate = this.toDate(schedule?.endDate || schedule?.startDate);
    const tgePercent = this.normalizePercent(schedule?.tgeUnlockPercent) || 0;
    const vestingType = String(schedule?.vestingType || "").toLowerCase();
    const frequency = String(schedule?.vestingFrequency || "").toLowerCase();
    const lockedAmount =
      lockedPercent !== undefined ? (totalAmount * Math.max(0, lockedPercent)) / 100 : undefined;

    if (startDate && unlockDate && unlockDate.getTime() <= startDate.getTime()) {
      if (vestingType === "tge" || tgePercent >= 99.5) return this.roundNumber(lockedAmount || totalAmount, 6);
      if (tgePercent > 0) return this.roundNumber((totalAmount * tgePercent) / 100, 6);
    }

    const linearPercent = Math.max(0, 100 - tgePercent);
    let periods: number | undefined;
    if (frequency.includes("day")) {
      periods = this.vestingDaySpan(startDate, endDate);
    } else if (frequency.includes("week")) {
      periods = Math.ceil(this.vestingDaySpan(startDate, endDate) / 7);
    } else if (frequency.includes("month") || frequency.includes("quarter") || frequency.includes("year")) {
      const months = this.vestingMonthSpan(startDate, endDate, schedule?.vestingDurationMonths);
      periods = frequency.includes("quarter")
        ? Math.ceil(months / 3)
        : frequency.includes("year")
          ? Math.ceil(months / 12)
          : months;
    }

    if (periods !== undefined && periods > 0 && linearPercent > 0) {
      return this.roundNumber((totalAmount * linearPercent) / 100 / periods, 6);
    }

    return lockedAmount !== undefined ? this.roundNumber(lockedAmount, 6) : undefined;
  }

  private vestingDaySpan(startDate?: Date, endDate?: Date): number {
    if (!startDate || !endDate || endDate.getTime() <= startDate.getTime()) return 1;
    return Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)));
  }

  private vestingMonthSpan(startDate?: Date, endDate?: Date, explicitMonths?: any): number {
    const explicit = this.toFiniteNumber(explicitMonths);
    if (explicit !== undefined && explicit > 0) return Math.max(1, Math.round(explicit));
    if (!startDate || !endDate || endDate.getTime() <= startDate.getTime()) return 1;
    const rawMonths =
      (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
      (endDate.getUTCMonth() - startDate.getUTCMonth());
    return Math.max(1, rawMonths || 1);
  }

  private toUpcomingUnlockingEvent(event: any, row: any): any {
    const unlockDate = this.toDate(event?.unlockDate || event?.date);
    const amount = this.toFiniteNumber(event?.amount);
    const percentOfSupply = this.normalizePercent(
      this.firstNumber(event?.percentOfSupply, event?.percent),
    );
    const price = this.firstPositiveNumber(row?.price);
    const valueUsd =
      this.firstNumber(event?.valueUsd, event?.sourceValueUsd) ??
      (amount !== undefined && price !== undefined ? this.roundNumber(amount * price, 6) : undefined);
    const marketCap = this.firstPositiveNumber(row?.marketCap);
    const marketCapSharePercent =
      this.normalizePercent(
        this.firstNumber(event?.marketCapSharePercent, event?.sourceMarketCapSharePercent),
      ) ??
      (valueUsd !== undefined && marketCap !== undefined && marketCap > 0
        ? this.roundNumber((valueUsd / marketCap) * 100, 6)
        : undefined);
    const roundNames = Array.isArray(event?.roundNames)
      ? event.roundNames
      : event?.roundName
        ? [event.roundName]
        : [];

    return this.cleanObject({
      ...event,
      date: unlockDate ? unlockDate.toISOString() : event?.date,
      unlockDate: unlockDate ? unlockDate.toISOString() : event?.unlockDate,
      amount,
      percent: percentOfSupply,
      percentOfSupply,
      valueUsd,
      sourceValueUsd: valueUsd,
      marketCapSharePercent,
      sourceMarketCapSharePercent: marketCapSharePercent,
      roundNames,
      roundsCount: event?.roundsCount || roundNames.length || undefined,
    });
  }

  private earliestFutureDate(values: any[]): string | undefined {
    const now = Date.now();
    const times = (values || [])
      .map((value) => this.toDate(value)?.getTime())
      .filter((value) => value !== undefined && Number.isFinite(value) && value >= now) as number[];
    if (!times.length) return undefined;
    return new Date(Math.min(...times)).toISOString();
  }

  private latestPastDate(values: any[]): string | undefined {
    const now = Date.now();
    const times = (values || [])
      .map((value) => this.toDate(value)?.getTime())
      .filter((value) => value !== undefined && Number.isFinite(value) && value < now) as number[];
    if (!times.length) return undefined;
    return new Date(Math.max(...times)).toISOString();
  }

  private buildProjectIdentityQuery(row: any): Record<string, any> | null {
    const clauses: any[] = [];
    const canonicalProjectId = this.toObjectId(row?.canonicalProjectId);
    const marketAssetId = this.toObjectId(row?.marketAssetId);

    if (canonicalProjectId) clauses.push({ canonicalProjectId });
    if (marketAssetId) clauses.push({ marketAssetId });

    return clauses.length ? { $or: clauses } : null;
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    const id = this.toIdString(value);
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined;
  }

  private uniqueObjectIds(values: any[]): Types.ObjectId[] {
    const seen = new Set<string>();
    const result: Types.ObjectId[] = [];

    for (const value of values || []) {
      const objectId = this.toObjectId(value);
      if (!objectId) continue;
      const key = objectId.toHexString();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(objectId);
    }

    return result;
  }

  private parseObjectIdList(value?: string[] | string): mongoose.Types.ObjectId[] {
    if (!value) return [];
    const items = Array.isArray(value) ? value : String(value).split(",");
    return items
      .map((id) => String(id || "").trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
  }

  private uniqueStrings(values: any[]): string[] {
    return Array.from(
      new Set(
        values
          .map((value) => String(value || "").trim())
          .filter(Boolean),
      ),
    );
  }

  private normalizeLookupKey(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  private normalizeSlug(value: any): string {
    return this.normalizeLookupKey(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private firstString(...values: any[]): string | undefined {
    for (const value of values) {
      const text = String(value || "").trim();
      if (text) return text;
    }
    return undefined;
  }

  private firstNumber(...values: any[]): number | undefined {
    for (const value of values) {
      const numberValue = this.toFiniteNumber(value);
      if (numberValue !== undefined) return numberValue;
    }
    return undefined;
  }

  private firstPositiveNumber(...values: any[]): number | undefined {
    for (const value of values) {
      const numberValue = this.toFiniteNumber(value);
      if (numberValue !== undefined && numberValue > 0) return numberValue;
    }
    return undefined;
  }

  private async loadLatestGlobalTotalMarketCap(): Promise<number | undefined> {
    const now = Date.now();
    if (
      this.globalTotalMarketCapCache &&
      this.globalTotalMarketCapCache.expiresAt > now
    ) {
      return this.globalTotalMarketCapCache.value;
    }

    const row = await this.coinmarketcapModel
      .findOne(
        { "data.total_market_cap": { $gt: 0 } },
        { "data.total_market_cap": 1, "data.date": 1, updatedAt: 1 }
      )
      .sort({ "data.date": -1, updatedAt: -1, _id: -1 })
      .lean();
    const value = this.firstPositiveNumber(row?.data?.total_market_cap);

    this.globalTotalMarketCapCache = {
      expiresAt: now + GLOBAL_MARKET_CAP_CACHE_TTL_MS,
      value,
    };

    return value;
  }

  private resolveCirculatingSupplyPercent(row: any): number {
    const circulatingSupply = this.toFiniteNumber(row?.circulatingSupply);
    const maxSupply = this.toFiniteNumber(row?.maxSupply);

    if (circulatingSupply === undefined || maxSupply === undefined || maxSupply <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, (circulatingSupply / maxSupply) * 100));
  }

  private normalizePercent(value: any): number | undefined {
    const percent = this.toFiniteNumber(value);
    if (percent === undefined || percent < 0) return undefined;
    if (percent > 100 && percent <= 10000) return percent / 100;
    return percent;
  }

  private roundNumber(value: any, decimals = 4): number | undefined {
    const numberValue = this.toFiniteNumber(value);
    if (numberValue === undefined) return undefined;

    const multiplier = 10 ** Math.max(0, decimals);
    return Math.round(numberValue * multiplier) / multiplier;
  }

  private humanizeRoundType(value: any): string | undefined {
    const text = this.firstString(value);
    if (!text) return undefined;

    return text
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private toFiniteNumber(value: any): number | undefined {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }

  private toIdString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value instanceof Types.ObjectId) return value.toHexString();
    if (value._id) return this.toIdString(value._id);
    return String(value);
  }

  private latestDate(...values: any[]): string | null {
    const times = values
      .map((value) => this.toDate(value)?.getTime())
      .filter((value) => value !== undefined && Number.isFinite(value)) as number[];
    if (!times.length) return null;
    return new Date(Math.max(...times)).toISOString();
  }

  private cleanObject<T extends Record<string, any>>(source: T): Partial<T> {
    const result: Partial<T> = {};
    for (const key of Object.keys(source || {}) as Array<keyof T>) {
      const value = source[key];
      if (value !== undefined && value !== null) {
        result[key] = value;
      }
    }
    return result;
  }

  private omitMaterializedMarketDataFields<T extends Record<string, any>>(source: T): Partial<T> {
    const marketDataFields = new Set([
      "price",
      "priceChange",
      "priceBTC",
      "priceETH",
      "priceSOL",
      "marketCap",
      "fullyDilutedMarketCap",
      "volume24h",
      "volume24hChange",
      "circulatingSupply",
      "totalSupply",
      "maxSupply",
      "circulatingSupplyPercent",
      "athUsd",
      "athUsdDate",
      "athUsdChangePercent",
      "atlUsd",
      "atlUsdDate",
      "atlUsdChangePercent",
      "usdQuote",
      "performance",
      "performanceUpdatedAt",
      "performanceSource",
      "performanceProvider",
      "performanceMissing",
      "performanceMeta",
      "marketDataUpdatedAt",
      "dateAdded",
      "chart7d",
      "chart7dUpdatedAt",
      "chart7dSource",
      "chart7dPointsCount",
      "chart7dTrend",
      "fomoScore",
      "rating",
      "fullness",
      "description",
      "descriptionText",
      "bio",
      "categories",
      "topCategories",
      "contracts",
      "website",
      "socialmedia",
      "explorers",
      "bridge",
      "links",
      "coingeckoDetailsUpdatedAt",
      "coingeckoDetailsSource",
    ]);
    const result: Partial<T> = {};

    for (const key of Object.keys(source || {}) as Array<keyof T>) {
      if (marketDataFields.has(String(key))) continue;
      result[key] = source[key];
    }

    return result;
  }

  private getPath(source: any, path: string): any {
    return path.split(".").reduce((acc, key) => (acc === undefined || acc === null ? undefined : acc[key]), source);
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
  }

  private nonNegativeInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
  }

  private optionalNumber(value: any, min: number, max: number): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(min, Math.min(max, Math.trunc(parsed))) : undefined;
  }

  private pushExample(target: any[], item: any, limit: number): void {
    if (target.length < limit) target.push(item);
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
