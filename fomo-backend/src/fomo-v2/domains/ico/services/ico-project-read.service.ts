import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ModuleRef } from "@nestjs/core";
import { Model, Types } from "mongoose";
import { Coinmarketcap } from "src/coinmarketcap/models/coinmarketcap.model";
import {
  FomoV2CanonicalProject,
  FomoV2MarketProjectReadModel,
} from "../../../models";
import { projectSourceTypeMongoPattern } from "../../../shared/source-policy";
import { FomoV2MarketProjectReadModelService } from "../../market/services/market-project-read-model.service";
import { FomoV2EntityReactionService } from "../../reactions";
import { FomoV2EntityFlagService } from "../../flags";
import { FomoV2IcoProjectReadModel } from "../models";

interface IcoProjectReadContext {
  rows: any[];
  canonicalById: Map<string, any>;
  marketByCanonicalId: Map<string, any>;
  globalTotalMarketCap?: number;
}

interface IcoCacheEntry<T> {
  expiresAt: number;
  value: T;
}

const ICO_LIST_CACHE_TTL_MS = 30_000;
const ICO_FILTER_CACHE_TTL_MS = 5 * 60_000;
const ICO_LIST_CACHE_MAX_KEYS = 80;
const GLOBAL_MARKET_CAP_CACHE_TTL_MS = 60 * 1000;

@Injectable()
export class FomoV2IcoProjectReadService {
  private marketProjectReadService?: FomoV2MarketProjectReadModelService;

  private globalTotalMarketCapCache?: {
    expiresAt: number;
    value?: number;
  };

  private readonly listCache = new Map<
    string,
    IcoCacheEntry<{ projects: any[]; total: number; debug?: any }>
  >();

  private readonly filtersCache = new Map<
    string,
    IcoCacheEntry<{
      categories: Array<{ key: string; label: string; count: number }>;
      fundingTypes: Array<{ key: string; label: string; count: number }>;
    }>
  >();

  constructor(
    @InjectModel(FomoV2IcoProjectReadModel.name)
    private readonly icoProjectReadModel: Model<FomoV2IcoProjectReadModel>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>,
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly marketProjectReadModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(Coinmarketcap.name)
    private readonly coinmarketcapModel: Model<Coinmarketcap>,
    private readonly reactionService: FomoV2EntityReactionService,
    private readonly flagService: FomoV2EntityFlagService,
    private readonly moduleRef: ModuleRef
  ) {}

  /** Clear process-local projections after a managed materialization run. */
  invalidateCaches(): void {
    this.listCache.clear();
    this.filtersCache.clear();
    this.globalTotalMarketCapCache = undefined;
  }

  async getCompatibleIcoProjects(
    query: any = {}
  ): Promise<{ projects: any[]; total: number; debug?: any }> {
    const limit = this.positiveInteger(query?.limit, 30, 200);
    const offset = this.nonNegativeInteger(query?.offset, 0);
    const parsedQuery = this.parseQueryString(query);
    const cacheVersion = this.isTruthy(query?.sandbox)
      ? "sandbox"
      : await this.loadReadModelCacheVersion();
    const cacheKey = this.buildListCacheKey(
      parsedQuery,
      limit,
      offset,
      cacheVersion
    );
    const cached = this.getCacheValue(this.listCache, cacheKey);
    if (cached) return cached;

    if (this.isTruthy(query?.sandbox)) {
      const result = {
        projects: [],
        total: 0,
        debug: {
          source: "fomo-v2",
          collection: "ico_project_read_models",
          sandbox: true,
        },
      };
      this.setCacheValue(
        this.listCache,
        cacheKey,
        result,
        ICO_LIST_CACHE_TTL_MS
      );
      return result;
    }

    const context = await this.loadContext(
      undefined,
      this.buildListReadModelFilter(parsedQuery),
      this.getListReadModelProjection()
    );
    const sortKey = this.getSortKey(parsedQuery?.sortKey);
    const sortDirection: 1 | -1 =
      Number(parsedQuery?.sortNumberValue) === 1 ? 1 : -1;
    const searchValue = this.normalizeLookupKey(parsedQuery?.searchValue);

    const filtered = context.rows
      .map((row) =>
        this.toLegacyProjectShape(row, context, "v2_ico_read_model")
      )
      .filter((project) => this.matchesAdditionalStatus(project, parsedQuery))
      .filter((project) => this.matchesQuery(project, parsedQuery));

    filtered.sort((left, right) => {
      if (searchValue) {
        const relevanceDiff =
          this.getProjectSearchRank(left, searchValue) -
          this.getProjectSearchRank(right, searchValue);
        if (relevanceDiff !== 0) return relevanceDiff;
      }

      return this.compareProjects(left, right, sortKey, sortDirection);
    });

    const projects = filtered.slice(offset, offset + limit);

    const result = {
      projects,
      total: filtered.length,
      debug: {
        source: "fomo-v2",
        collection: "ico_project_read_models",
        loadedRows: context.rows.length,
        returnedRows: projects.length,
        sortKey,
      },
    };

    this.setCacheValue(this.listCache, cacheKey, result, ICO_LIST_CACHE_TTL_MS);
    return result;
  }

  async getFilterOptions(limit = 8): Promise<{
    categories: Array<{ key: string; label: string; count: number }>;
    fundingTypes: Array<{ key: string; label: string; count: number }>;
  }> {
    const optionLimit = Math.min(Math.max(Number(limit) || 8, 1), 24);
    const cacheVersion = await this.loadReadModelCacheVersion();
    const cacheKey = `${optionLimit}:${cacheVersion}`;
    const cached = this.getCacheValue(this.filtersCache, cacheKey);
    if (cached) return cached;

    const rows = await this.icoProjectReadModel
      .find(
        { sourceType: projectSourceTypeMongoPattern("icodrops") },
        this.getFilterReadModelProjection()
      )
      .lean()
      .exec();

    const categoryCounts = new Map<string, { label: string; count: number }>();
    const fundingTypeCounts = new Map<
      string,
      { label: string; count: number }
    >();

    for (const row of rows as any[]) {
      for (const category of this.cleanCategories(row?.categories)) {
        this.incrementOption(categoryCounts, category);
      }

      const profile = this.getProfile(row);
      const fundingAggregate = this.getFundingAggregate(row);
      const rounds = fundingAggregate?.hasData
        ? this.toArray(fundingAggregate?.rounds)
        : [
            ...this.toArray(profile?.fundraising?.rounds),
            ...this.toArray(profile?.saleRounds),
          ];

      for (const round of rounds) {
        const type = this.firstString(
          round?.type,
          round?.roundName,
          round?.name
        );
        if (type) this.incrementOption(fundingTypeCounts, type);
      }
    }

    const result = {
      categories: this.toFilterOptions(categoryCounts, optionLimit),
      fundingTypes: this.toFilterOptions(fundingTypeCounts, optionLimit),
    };

    this.setCacheValue(
      this.filtersCache,
      cacheKey,
      result,
      ICO_FILTER_CACHE_TTL_MS
    );
    return result;
  }

  async getProjectDetailBySlug(slug: string, userId?: string): Promise<any> {
    const lookup = this.normalizeLookupKey(
      decodeURIComponent(String(slug || ""))
    );
    const normalizedSlug = this.normalizeSlug(lookup);
    if (!lookup) throw new NotFoundException("FOMO v2 ICO project not found.");

    const or: any[] = [
      { slug: lookup },
      { slug: normalizedSlug },
      { "metadata.icodropsProfileOnly.slug": lookup },
      { "metadata.icodropsProfileOnly.slug": normalizedSlug },
    ];

    if (Types.ObjectId.isValid(lookup)) {
      or.push({ _id: new Types.ObjectId(lookup) });
      or.push({ canonicalProjectId: new Types.ObjectId(lookup) });
    }

    const row = await this.icoProjectReadModel
      .findOne({
        sourceType: projectSourceTypeMongoPattern("icodrops"),
        $or: or,
      })
      .lean()
      .exec();

    if (!row) throw new NotFoundException("FOMO v2 ICO project not found.");

    const context = await this.loadContext([row]);
    const project = this.toLegacyProjectShape(row, context, "v2_ico_detail");
    const [detail, reactionState, flagState] = await Promise.all([
      this.enrichProjectDetailWithMarketData(row, context, project),
      this.reactionService.getReactionState(
        "canonicalProject",
        row?.canonicalProjectId,
        userId
      ),
      this.flagService.getFlagState(
        "ico_project",
        row?.canonicalProjectId || row?._id
      ),
    ]);

    return {
      ...detail,
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
    };
  }

  private async loadContext(
    seedRows?: any[],
    filter: Record<string, any> = {
      sourceType: projectSourceTypeMongoPattern("icodrops"),
    },
    projection?: Record<string, any>
  ): Promise<IcoProjectReadContext> {
    const rows =
      seedRows ||
      ((await this.icoProjectReadModel
        .find(filter, projection)
        .lean()
        .exec()) as any[]);

    const canonicalIds = this.uniqueStrings(
      rows.map((row) => this.toIdString(row?.canonicalProjectId))
    ).filter((id) => Types.ObjectId.isValid(id));
    const marketAssetIds = this.uniqueStrings(
      rows.map((row) => this.toIdString(row?.marketAssetId))
    ).filter((id) => Types.ObjectId.isValid(id));

    const [canonicalRows, marketRows, globalTotalMarketCap] =
      await Promise.all([
      canonicalIds.length
        ? this.canonicalProjectModel
            .find({
              _id: {
                $in: canonicalIds.map((id) => new Types.ObjectId(id)),
              },
            })
            .lean()
            .exec()
        : [],
      canonicalIds.length || marketAssetIds.length
        ? this.marketProjectReadModel
            .find({
              $or: [
                ...(canonicalIds.length
                  ? [
                      {
                        canonicalProjectId: {
                          $in: canonicalIds.map((id) => new Types.ObjectId(id)),
                        },
                      },
                    ]
                  : []),
                ...(marketAssetIds.length
                  ? [
                      {
                        marketAssetId: {
                          $in: marketAssetIds.map(
                            (id) => new Types.ObjectId(id)
                          ),
                        },
                      },
                    ]
                  : []),
              ],
            })
            .lean()
            .exec()
        : [],
      this.loadLatestGlobalTotalMarketCap(),
    ]);

    const canonicalById = new Map<string, any>();
    for (const canonical of canonicalRows as any[]) {
      canonicalById.set(this.toIdString(canonical?._id), canonical);
    }

    const marketByCanonicalId = new Map<string, any>();
    for (const market of marketRows as any[]) {
      const canonicalId = this.toIdString(market?.canonicalProjectId);
      if (canonicalId && !marketByCanonicalId.has(canonicalId)) {
        marketByCanonicalId.set(canonicalId, market);
      }
    }

    return { rows, canonicalById, marketByCanonicalId, globalTotalMarketCap };
  }

  private buildListReadModelFilter(query: any): Record<string, any> {
    const filter: Record<string, any> = {
      sourceType: projectSourceTypeMongoPattern("icodrops"),
    };
    const status = this.normalizeLookupKey(query?.status);
    const searchValue = this.normalizeLookupKey(query?.searchValue);

    if (status && status !== "all") {
      filter.status = status;
    }

    if (searchValue) {
      const regex = new RegExp(this.escapeRegExp(searchValue), "i");
      filter.$or = [
        { name: regex },
        { symbol: regex },
        { slug: regex },
        { "metadata.icodropsProfileOnly.name": regex },
        { "metadata.icodropsProfileOnly.symbol": regex },
        { "metadata.icodropsProfileOnly.slug": regex },
      ];
    }

    return filter;
  }

  private getListReadModelProjection(): Record<string, 1> {
    return {
      _id: 1,
      canonicalProjectId: 1,
      sourceType: 1,
      name: 1,
      symbol: 1,
      slug: 1,
      logoUrl: 1,
      description: 1,
      website: 1,
      categories: 1,
      status: 1,
      hasMarketData: 1,
      marketAssetId: 1,
      profileCompleteness: 1,
      "metadata.fomoScore": 1,
      "metadata.redFlagsList": 1,
      "metadata.redFlags": 1,
      "metadata.greenFlagsList": 1,
      "metadata.sourceUrl": 1,
      "metadata.fundingAggregate": 1,
      "metadata.icodropsProfileOnly.name": 1,
      "metadata.icodropsProfileOnly.symbol": 1,
      "metadata.icodropsProfileOnly.slug": 1,
      "metadata.icodropsProfileOnly.status": 1,
      "metadata.icodropsProfileOnly.logo": 1,
      "metadata.icodropsProfileOnly.logoUrl": 1,
      "metadata.icodropsProfileOnly.description": 1,
      "metadata.icodropsProfileOnly.about": 1,
      "metadata.icodropsProfileOnly.website": 1,
      "metadata.icodropsProfileOnly.links": 1,
      "metadata.icodropsProfileOnly.categories": 1,
      "metadata.icodropsProfileOnly.ecosystems": 1,
      "metadata.icodropsProfileOnly.launchpads": 1,
      "metadata.icodropsProfileOnly.social": 1,
      "metadata.icodropsProfileOnly.socialmedia": 1,
      "metadata.icodropsProfileOnly.fundraising": 1,
      "metadata.icodropsProfileOnly.saleRounds": 1,
      "metadata.icodropsProfileOnly.tokenomics": 1,
    };
  }

  private getFilterReadModelProjection(): Record<string, 1> {
    return {
      categories: 1,
      "metadata.fundingAggregate.hasData": 1,
      "metadata.fundingAggregate.rounds.type": 1,
      "metadata.fundingAggregate.rounds.roundName": 1,
      "metadata.icodropsProfileOnly.fundraising.rounds.type": 1,
      "metadata.icodropsProfileOnly.fundraising.rounds.roundName": 1,
      "metadata.icodropsProfileOnly.fundraising.rounds.name": 1,
      "metadata.icodropsProfileOnly.saleRounds.type": 1,
      "metadata.icodropsProfileOnly.saleRounds.roundName": 1,
      "metadata.icodropsProfileOnly.saleRounds.name": 1,
    };
  }

  private toLegacyProjectShape(
    row: any,
    context: IcoProjectReadContext,
    debugSource: string
  ): any {
    const canonical =
      context.canonicalById.get(this.toIdString(row?.canonicalProjectId)) || {};
    const market =
      context.marketByCanonicalId.get(
        this.toIdString(row?.canonicalProjectId)
      ) || {};
    const profile = this.getProfile(row);
    const fundraising = profile?.fundraising || {};
    const fundingAggregate = this.getFundingAggregate(row);
    const hasMaterializedFunding = fundingAggregate?.hasData === true;
    const saleRounds = this.toArray(profile?.saleRounds);
    const fundraisingRounds = hasMaterializedFunding
      ? this.toArray(fundingAggregate?.rounds)
      : this.toArray(fundraising?.rounds);
    const allRounds = hasMaterializedFunding
      ? [...fundraisingRounds]
      : [...fundraisingRounds, ...saleRounds];
    const investors = hasMaterializedFunding
      ? this.normalizeInvestors([
          ...this.toArray(fundingAggregate?.investors),
          ...fundraisingRounds.flatMap((round: any) =>
            this.toArray(round?.investors)
          ),
        ])
      : this.extractInvestors(profile);
    const categories = this.cleanCategories([
      ...this.toArray(row?.categories),
      ...this.toArray(profile?.categories),
      ...this.toArray(market?.categories),
      ...this.toArray(market?.topCategories),
      market?.category,
      market?.niche,
    ]);
    const category = this.firstString(
      categories[0],
      market?.category,
      market?.niche
    );
    const status = this.normalizeStatus(
      this.firstString(row?.status, profile?.status, saleRounds[0]?.status)
    );
    const latestRound = this.getLatestRound(allRounds);
    const lastFunding =
      this.extractRoundDate(latestRound) ||
      (hasMaterializedFunding
        ? this.toDate(fundingAggregate?.lastFunding)?.toISOString()
        : undefined);
    const totalRaised = hasMaterializedFunding
      ? this.firstNumber(fundingAggregate?.totalRaised)
      : this.resolveTotalRaised(profile, fundraisingRounds);
    const score = this.firstNumber(
      canonical?.fomoScore,
      canonical?.rating,
      row?.metadata?.fomoScore,
      market?.fomoScore,
      market?.rating
    );
    const fullness = this.firstNumber(
      canonical?.fullness,
      row?.profileCompleteness,
      market?.fullness
    );
    const logo = this.firstString(
      market?.logo,
      market?.logoUrl,
      market?.metadata?.image,
      row?.logoUrl,
      profile?.logoUrl,
      profile?.logo,
      canonical?.metadata?.image
    );
    const description = this.firstString(
      row?.description,
      profile?.description,
      profile?.about,
      market?.descriptionText,
      market?.bio
    );
    const tokenomics = profile?.tokenomics || {};
    const normalizedFundraisingRounds = fundraisingRounds.map((round, index) =>
      this.normalizeFundingRound(round, index, "fundraising")
    );
    const normalizedSaleRounds = saleRounds.map((round, index) =>
      this.normalizeFundingRound(round, index, "sale")
    );
    const roundType = this.firstString(
      latestRound?.type,
      latestRound?.roundName,
      normalizedSaleRounds[0]?.type,
      normalizedFundraisingRounds[0]?.type
    );
    const platform = this.resolvePlatform(profile, allRounds, category);
    const tokenDistribution = this.normalizeTokenAllocation(
      tokenomics?.allocation,
      this.firstNumber(market?.totalSupply, market?.maxSupply)
    );
    const firstEcosystem = this.toArray(profile?.ecosystems)
      .map((item) => this.firstString(item?.name, item))
      .find(Boolean);
    const firstMarketBlockchain = this.toArray(market?.blockchains)
      .map((item) => this.firstString(item?.name, item))
      .find(Boolean);
    const ecosystemCategory = categories.find((item) =>
      /ecosystem/i.test(String(item || ""))
    );
    const blockchain = this.firstString(
      tokenomics?.blockchain,
      profile?.blockchain,
      market?.blockchain,
      firstMarketBlockchain,
      firstEcosystem,
      ecosystemCategory,
      latestRound?.raw?.infoBlocks?.Blockchain?.text,
      category
    );
    const maxSupply = this.firstNumber(
      tokenomics?.maxSupply,
      market?.maxSupply,
      market?.marketData?.maxSupply
    );
    const totalSupply = this.firstNumber(
      tokenomics?.totalSupply,
      market?.totalSupply,
      market?.marketData?.totalSupply,
      maxSupply
    );
    const circulatingSupply = this.firstNumber(
      tokenomics?.circulatingSupply,
      market?.circulatingSupply,
      market?.marketData?.circulatingSupply
    );
    const tokenPrice = this.firstNumber(
      tokenomics?.tokenPrice,
      latestRound?.tokenPrice,
      latestRound?.price,
      latestRound?.raw?.infoBlocks?.Price?.money,
      market?.price
    );
    const tokenMetrics = this.cleanObject({
      ticker: this.firstString(row?.symbol, profile?.symbol, canonical?.symbol),
      ticket: this.firstString(row?.symbol, profile?.symbol, canonical?.symbol),
      tokenType: roundType,
      blockchain,
      tokenPrice,
      maxSupply,
      totalSupply,
      circulatingSupply,
    });
    const projectSlug = this.firstString(
      row?.slug,
      profile?.slug,
      canonical?.slug
    );
    const sourceUrl = this.firstString(
      profile?.sourceUrl,
      profile?.detailUrl,
      row?.metadata?.sourceUrl,
      projectSlug ? `https://icodrops.com/${projectSlug}/` : undefined
    );
    const projectLinks = this.extractProjectLinks(profile, market, sourceUrl);
    const socialmedia = this.extractSocialMedia(profile, market);
    const redFlagsList = this.toArray(
      row?.metadata?.redFlagsList ||
        row?.metadata?.redFlags ||
        canonical?.metadata?.redFlagsList ||
        canonical?.metadata?.redFlags
    );
    const rawIcoData = {
      ...profile,
      source: "icodrops",
      name: this.firstString(row?.name, profile?.name, canonical?.name),
      symbol: this.firstString(row?.symbol, profile?.symbol, canonical?.symbol),
      slug: projectSlug,
      status,
      categories,
      fundraising: {
        ...fundraising,
        totalRaised,
        rounds: normalizedFundraisingRounds,
        investors,
        sourceTypes: hasMaterializedFunding
          ? this.toArray(fundingAggregate?.sourceTypes)
          : undefined,
        selectedSource: hasMaterializedFunding
          ? this.firstString(fundingAggregate?.selectedSource)
          : undefined,
        bySource: hasMaterializedFunding
          ? fundingAggregate?.bySource
          : undefined,
      },
      saleRounds: normalizedSaleRounds,
      tokenomics,
      uiInvestors: investors,
      socialmedia,
      scoring: {
        fomoScore: score,
        rating: score,
        fullness,
      },
    };
    const marketCap = this.firstPositiveNumber(
      market?.marketCap,
      market?.usdQuote?.market_cap
    );
    const volume24h = this.firstPositiveNumber(
      market?.volume24h,
      market?.usdQuote?.volume_24h
    );
    const volumeAndMarketCap =
      marketCap !== undefined && volume24h !== undefined
        ? this.roundNumber(volume24h / marketCap, 6)
        : undefined;
    const dominance =
      marketCap !== undefined &&
      context.globalTotalMarketCap !== undefined &&
      context.globalTotalMarketCap > 0
        ? this.roundNumber((marketCap / context.globalTotalMarketCap) * 100, 6)
        : undefined;

    return this.cleanObject({
      _id: this.toIdString(row?._id),
      id:
        this.toIdString(row?.canonicalProjectId) ||
        this.toIdString(row?._id) ||
        projectSlug,
      readModelId: this.toIdString(row?._id),
      canonicalProjectId: this.toIdString(row?.canonicalProjectId),
      marketAssetId: this.toIdString(row?.marketAssetId),
      legacyProjectId: this.toIdString(market?.legacyProjectId),
      source: "icodrops",
      sourceType: row?.sourceType || "icodrops",
      projectType: "project",
      projectKind: "ico",
      projectStatus: "active",
      sourceId: projectSlug || this.toIdString(row?._id),
      sourceUrl,
      detailUrl: sourceUrl,
      name: this.firstString(
        row?.name,
        profile?.name,
        canonical?.name,
        projectSlug
      ),
      symbol: this.firstString(row?.symbol, profile?.symbol, canonical?.symbol),
      ticker: this.firstString(row?.symbol, profile?.symbol, canonical?.symbol),
      isVestingReview: Boolean(canonical?.isVestingReview || market?.isVestingReview),
      isSponsored: Boolean(market?.isSponsored),
      isEralash: Boolean(market?.isEralash),
      eralashAdded: market?.eralashAdded,
      slug: projectSlug,
      logo,
      metadataLogo: logo,
      banner: category,
      niche: this.firstString(category, row?.symbol, canonical?.symbol),
      category,
      mainCategory: category,
      categories,
      ecosystems: this.toArray(profile?.ecosystems),
      launchpads: this.toArray(profile?.launchpads),
      tags: categories,
      status,
      platform,
      type: roundType,
      round: roundType,
      description,
      descriptionText: description,
      descriptionImages: this.extractProfileImages(profile),
      bio: description,
      website: this.normalizeWebsite(
        row?.website,
        profile?.website,
        projectLinks
      ),
      socialmedia,
      projectLinks,
      totalRaised,
      fundsRaised: totalRaised,
      investedAmount: totalRaised,
      fundraisingTotal: totalRaised,
      lastFunding,
      fundraising: normalizedFundraisingRounds,
      fundsRounds: normalizedFundraisingRounds,
      saleRounds: normalizedSaleRounds,
      fundingSources: hasMaterializedFunding
        ? this.toArray(fundingAggregate?.sourceTypes)
        : undefined,
      fundingSelectedSource: hasMaterializedFunding
        ? this.firstString(fundingAggregate?.selectedSource)
        : undefined,
      fundingBySource: hasMaterializedFunding
        ? fundingAggregate?.bySource
        : undefined,
      fundingAggregate: hasMaterializedFunding
        ? fundingAggregate
        : undefined,
      investors,
      investorsCount: investors.length,
      redFlagsList,
      redFlags: redFlagsList,
      greenFlagsList: this.toArray(row?.metadata?.greenFlagsList),
      fomoScore: score,
      rating: score !== undefined ? String(score) : undefined,
      fullness: fullness !== undefined ? `${Math.round(fullness)}%` : undefined,
      likes: [],
      comments: [],
      team: this.toArray(profile?.team),
      advisors: this.toArray(profile?.advisors),
      partners: this.toArray(profile?.partners),
      comparison: [],
      tokenomics,
      tokenDetails: tokenomics,
      tokenMetrics,
      tokenDistribution,
      totalAllocation: tokenDistribution,
      allocations: tokenDistribution,
      allocationTotalPercent: this.firstNumber(
        tokenomics?.allocationTotalPercent
      ),
      vestingProgress: tokenomics?.vestingProgress,
      fullyDilutedMarketCap: this.firstNumber(
        tokenomics?.fdv,
        market?.fullyDilutedMarketCap
      ),
      hardCap: this.firstNumber(tokenomics?.hardCap, latestRound?.hardCap),
      valuation: this.firstNumber(
        latestRound?.valuation,
        latestRound?.preValuation
      ),
      inititialMarketCap: this.firstNumber(tokenomics?.initialMarketCap),
      blockchain,
      maxSupply,
      totalSupply,
      circulatingSupply,
      price: market?.price,
      priceChange: market?.priceChange,
      marketCap,
      volume24h,
      volumeAndMarketCap,
      dominance,
      rank: market?.rank,
      coingeckoId:
        market?.providerIds?.coingeckoId || canonical?.providerIds?.coingeckoId,
      providerIds: {
        ...(canonical?.providerIds || {}),
        ...(market?.providerIds || {}),
      },
      hasMarketData: row?.hasMarketData,
      rawIcoData,
      _debug: {
        source: debugSource,
        collection: "ico_project_read_models",
        canonicalProjectId: this.toIdString(row?.canonicalProjectId),
        marketReadModelId: this.toIdString(market?._id),
      },
    });
  }

  private async enrichProjectDetailWithMarketData(
    row: any,
    context: IcoProjectReadContext,
    project: any
  ): Promise<any> {
    const market =
      context.marketByCanonicalId.get(
        this.toIdString(row?.canonicalProjectId)
      ) || {};
    const marketLookup = this.resolveMarketLookup(market);
    if (!marketLookup) return project;

    const [fundingOverview, unlocksOverview] = await Promise.all([
      this.loadMarketFundingOverview(marketLookup),
      this.loadMarketUnlocksOverview(marketLookup),
    ]);

    const marketFundraising = this.normalizeMarketFundingRounds(
      this.toArray(fundingOverview?.fundraising)
    );
    const marketInvestors =
      this.extractFundingRoundInvestors(marketFundraising);
    const marketTokenAllocation = this.toArray(
      unlocksOverview?.tokenAllocation
    );
    const marketLogo = this.firstString(
      market?.logo,
      market?.logoUrl,
      market?.metadata?.image
    );
    const latestMarketRound = marketFundraising.length
      ? this.getLatestRound(marketFundraising)
      : undefined;
    const latestMarketRoundDate = this.extractRoundDate(latestMarketRound);
    const latestMarketRoundType = this.firstString(
      latestMarketRound?.roundName,
      latestMarketRound?.stage,
      latestMarketRound?.type
    );
    const mergedFundraising = marketFundraising.length
      ? marketFundraising
      : project?.fundraising;
    const mergedInvestors = marketInvestors.length
      ? marketInvestors
      : this.toArray(project?.investors);
    const mergedTokenAllocation = marketTokenAllocation.length
      ? marketTokenAllocation
      : this.toArray(project?.totalAllocation);
    const totalRaised = this.firstNumber(
      fundingOverview?.totalRaised,
      project?.totalRaised
    );

    return this.cleanObject({
      ...project,
      logo: marketLogo || project?.logo,
      metadataLogo: marketLogo || project?.metadataLogo,
      totalRaised,
      fundsRaised: totalRaised,
      investedAmount: totalRaised,
      fundraisingTotal: totalRaised,
      lastFunding: latestMarketRoundDate || project?.lastFunding,
      round: latestMarketRoundType || project?.round,
      fundraising: mergedFundraising,
      fundsRounds: mergedFundraising,
      investors: mergedInvestors,
      investorsCount: mergedInvestors.length,
      tokenDistribution: mergedTokenAllocation,
      totalAllocation: mergedTokenAllocation,
      allocations: mergedTokenAllocation,
      vestingRounds: this.hasItems(unlocksOverview?.vestingRounds)
        ? unlocksOverview.vestingRounds
        : project?.vestingRounds,
      vestingSchedule: this.hasItems(unlocksOverview?.vestingSchedule)
        ? unlocksOverview.vestingSchedule
        : project?.vestingSchedule,
      vestingTimeline: this.hasItems(unlocksOverview?.vestingTimeline)
        ? unlocksOverview.vestingTimeline
        : project?.vestingTimeline,
      vestingSummary:
        unlocksOverview?.vestingSummary || project?.vestingSummary,
      events: this.hasItems(unlocksOverview?.events)
        ? unlocksOverview.events
        : project?.events,
      unlockingEvents: this.hasItems(unlocksOverview?.unlockingEvents)
        ? unlocksOverview.unlockingEvents
        : project?.unlockingEvents,
      nextUnlockingEvent:
        unlocksOverview?.nextUnlockingEvent || project?.nextUnlockingEvent,
      vestingSourceLinks: this.hasItems(unlocksOverview?.sourceLinks)
        ? unlocksOverview.sourceLinks
        : project?.vestingSourceLinks,
      rawIcoData: {
        ...(project?.rawIcoData || {}),
        uiInvestors: mergedInvestors,
        marketFundraising: fundingOverview,
        marketUnlocks: unlocksOverview,
      },
      _debug: {
        ...(project?._debug || {}),
        marketMerge: {
          readModelId: this.toIdString(market?._id),
          canonicalProjectId: this.toIdString(market?.canonicalProjectId),
          marketAssetId: this.toIdString(market?.marketAssetId),
          providerIds: market?.providerIds || {},
          logo: Boolean(marketLogo),
          fundingRounds: marketFundraising.length,
          investors: marketInvestors.length,
          tokenAllocationItems: marketTokenAllocation.length,
          vestingTimeline: this.toArray(unlocksOverview?.vestingTimeline)
            .length,
        },
      },
    });
  }

  private resolveMarketLookup(
    market: any
  ): { id: string; query: Record<string, any> } | undefined {
    const coingeckoId = this.firstString(market?.providerIds?.coingeckoId);
    if (coingeckoId) {
      return { id: coingeckoId, query: { lookup: "coingeckoId" } };
    }

    const slug = this.firstString(market?.slug);
    if (slug) return { id: slug, query: { lookup: "slug" } };

    const canonicalProjectId = this.toIdString(market?.canonicalProjectId);
    if (canonicalProjectId) return { id: canonicalProjectId, query: {} };

    const marketAssetId = this.toIdString(market?.marketAssetId);
    if (marketAssetId) return { id: marketAssetId, query: {} };

    const readModelId = this.toIdString(market?._id);
    return readModelId ? { id: readModelId, query: {} } : undefined;
  }

  private async loadMarketFundingOverview(lookup: {
    id: string;
    query: Record<string, any>;
  }): Promise<any | undefined> {
    try {
      return await this.getMarketProjectReadService().getMarketProjectFundraising(
        lookup.id,
        lookup.query
      );
    } catch (error) {
      if (error instanceof NotFoundException) return undefined;
      throw error;
    }
  }

  private async loadMarketUnlocksOverview(lookup: {
    id: string;
    query: Record<string, any>;
  }): Promise<any | undefined> {
    try {
      return await this.getMarketProjectReadService().getMarketProjectUnlocks(
        lookup.id,
        lookup.query
      );
    } catch (error) {
      if (error instanceof NotFoundException) return undefined;
      throw error;
    }
  }

  private getMarketProjectReadService(): FomoV2MarketProjectReadModelService {
    if (!this.marketProjectReadService) {
      this.marketProjectReadService = this.moduleRef.get(
        FomoV2MarketProjectReadModelService,
        { strict: false }
      );
    }

    return this.marketProjectReadService;
  }

  private normalizeMarketFundingRounds(rounds: any[]): any[] {
    return this.toArray(rounds).map((round, index) => {
      const date = this.extractRoundDate(round);
      const raisedAmount = this.firstNumber(
        round?.raised,
        round?.raisedAmount,
        round?.amount,
        round?.fundsRaised
      );
      const roundName = this.firstString(
        round?.roundName,
        round?.stage,
        round?.type,
        round?.normalizedRoundType,
        round?.roundType
      );
      const status = this.normalizeStatus(
        this.firstString(round?.status, "ended")
      );

      return this.cleanObject({
        ...round,
        _id: this.firstString(round?._id, round?.id) || `market:${index}`,
        id: this.firstString(round?.id, round?._id) || `market:${index}`,
        roundName,
        stage: round?.stage || roundName,
        type: this.firstString(round?.type, roundName),
        status,
        distributionType: status,
        date,
        announcedDate: date,
        startDate: date,
        endDate: date,
        lastFunding: date,
        fundsRaised: raisedAmount,
        raise: raisedAmount,
        raised: raisedAmount,
        raisedAmount,
        amount: raisedAmount,
        goal: this.firstPositiveNumber(
          round?.goal,
          round?.target,
          round?.hardCap
        ),
        preValuation: this.firstNumber(round?.preValuation, round?.valuation),
        valuation: this.firstNumber(round?.valuation, round?.preValuation),
        tokenPrice: this.firstNumber(round?.tokenPrice),
        investors: this.normalizeInvestors(this.toArray(round?.investors)),
        currenciesList: this.toArray(round?.currenciesList),
        usdRoi: this.firstNumber(round?.usdRoi, round?.roiUsd, round?.roi?.usd),
        btcRoi: this.firstNumber(round?.btcRoi, round?.roi?.btc),
        ethRoi: this.firstNumber(round?.ethRoi, round?.roi?.eth),
        athRoi: this.firstNumber(round?.athRoi, round?.roi?.ath),
      });
    });
  }

  private extractFundingRoundInvestors(rounds: any[]): any[] {
    return this.normalizeInvestors(
      this.toArray(rounds).flatMap((round) => this.toArray(round?.investors))
    );
  }

  private normalizeFundingRound(round: any, index: number, kind: string): any {
    const date = this.extractRoundDate(round);
    const investors = this.normalizeInvestors(this.toArray(round?.investors));
    const raisedAmount =
      this.extractRoundRaisedAmount(round) ?? this.extractRoundAmount(round);
    const type = this.firstString(round?.type, round?.roundName, round?.name);
    const status = this.normalizeStatus(
      this.firstString(round?.status, this.extractRoundLifecycleStatus(round))
    );
    const platformName = this.firstString(
      round?.launchpad,
      round?.platform?.name,
      round?.platform,
      round?.raw?.infoBlocks?.Platform?.text,
      round?.raw?.infoBlocks?.Blockchain?.text
    );
    const tokenPrice = this.firstNumber(
      round?.tokenPrice,
      round?.price,
      round?.raw?.infoBlocks?.Price?.money,
      round?.raw?.infoBlocks?.["Price on Listing"]?.money,
      round?.raw?.headerMetrics?.Price,
      round?.raw?.headerMetrics?.["Price on Listing"]
    );
    const goal = this.firstPositiveNumber(
      round?.goal,
      round?.hardCap,
      round?.target,
      round?.raw?.infoBlocks?.Goal?.money,
      round?.raw?.headerMetrics?.Goal
    );

    const sourceRoundId = this.firstString(
      round?.fundingRoundId,
      round?._id,
      round?.id
    );
    const fallbackRoundId = `${kind}:${index}:${this.normalizeSlug(
      type || round?.rawDate || index
    )}`;

    return this.cleanObject({
      _id: sourceRoundId || fallbackRoundId,
      id: sourceRoundId || fallbackRoundId,
      fundingRoundId: sourceRoundId,
      roundName: this.firstString(round?.roundName, round?.name, type),
      type,
      status,
      distributionType: status,
      date,
      startDate: date,
      endDate: date,
      lastFunding: date,
      rawDate: round?.rawDate || round?.date?.raw,
      fundsRaised: raisedAmount,
      raise: raisedAmount,
      raised: raisedAmount,
      raisedAmount,
      amount: raisedAmount,
      goal,
      preValuation: this.firstNumber(
        round?.preValuation,
        round?.raw?.infoBlocks?.["Pre-Valuation"]?.money
      ),
      valuation: this.firstNumber(round?.valuation, round?.preValuation),
      price: this.firstString(
        round?.price,
        round?.raw?.infoBlocks?.Price?.text
      ),
      tokenPrice,
      tokensForSale: this.firstString(
        round?.tokensForSale,
        round?.raw?.infoBlocks?.["Tokens For Round"]?.text
      ),
      tokenSold: this.firstNumber(
        round?.tokenSold,
        round?.tokensSold,
        round?.raw?.infoBlocks?.["Tokens For Round"]?.money
      ),
      platform: platformName ? { name: platformName } : undefined,
      platformName,
      investors,
      currenciesList: this.extractRoundCurrencies(round),
      usdRoi: this.extractRoundRoi(round, "USD"),
      btcRoi: this.extractRoundRoi(round, "BTC"),
      ethRoi: this.extractRoundRoi(round, "ETH"),
      athRoi: this.extractRoundRoi(round, "ATH"),
      links: this.toArray(round?.links),
      description: round?.description,
      primarySource: this.firstString(round?.primarySource),
      sourceType: this.firstString(round?.sourceType),
      sourceFeed: this.firstString(round?.sourceFeed),
      sourceId: this.firstString(round?.sourceId),
      sourceSlug: this.firstString(round?.sourceSlug),
      sourceUrl: this.firstString(round?.sourceUrl),
      sourceRefs: this.toArray(round?.sourceRefs),
      raw: round?.raw,
    });
  }

  private normalizeTokenAllocation(values: any, totalSupply?: number): any[] {
    return this.toArray(values)
      .map((item) => {
        const name = this.firstString(
          item?.name,
          item?.roundName,
          item?.stage,
          item?.category,
          item?.title
        );
        const percent = this.firstNumber(
          item?.tokensAllocatedPercent,
          item?.allocationPercent,
          item?.percent,
          item?.percentage,
          item?.value
        );
        const explicitAmount = this.firstNumber(
          item?.tokensAllocatedAmount,
          item?.totalAmount,
          item?.amount,
          item?.allocated,
          item?.tokens
        );
        const amount =
          explicitAmount ??
          (percent !== undefined && totalSupply
            ? (totalSupply * percent) / 100
            : undefined);

        if (!name || (percent === undefined && amount === undefined))
          return undefined;

        return this.cleanObject({
          ...item,
          name,
          percent,
          percentage: percent,
          value: percent,
          allocationPercent: percent,
          tokensAllocatedPercent: percent,
          allocated: amount,
          amount,
          totalAmount: amount,
          tokensAllocatedAmount: amount,
          source: "icodrops",
        });
      })
      .filter(Boolean);
  }

  private extractProfileImages(profile: any): string[] {
    const images = [
      ...this.toArray(profile?.descriptionImages),
      ...this.toArray(profile?.screenshots),
      ...this.toArray(profile?.images),
      ...this.toArray(profile?.gallery),
      ...this.toArray(profile?.media),
    ]
      .map((item) =>
        this.firstString(
          item?.url,
          item?.src,
          item?.href,
          item?.image,
          item?.imageUrl,
          item
        )
      )
      .filter(Boolean) as string[];

    return this.uniqueStrings(images);
  }

  private extractRoundRaisedAmount(round: any): number | undefined {
    return this.firstPositiveNumber(
      round?.raised,
      round?.raisedAmount,
      round?.amount,
      round?.fundsRaised,
      round?.raise,
      round?.raw?.infoBlocks?.Raised?.money,
      round?.raw?.headerMetrics?.Raised
    );
  }

  private extractRoundLifecycleStatus(round: any): string | undefined {
    const text = this.firstString(
      round?.raw?.headerText,
      round?.raw?.text,
      round?.description
    );
    if (!text) return undefined;

    if (/\bended\b/i.test(text)) return "Ended";
    if (/\blaunched\b/i.test(text)) return "Launched";
    if (/\bupcoming\b/i.test(text)) return "Upcoming";
    if (/\bactive\b/i.test(text)) return "Active";

    return undefined;
  }

  private extractRoundCurrencies(round: any): any[] {
    const rawValues = [
      ...this.toArray(round?.currenciesList),
      ...this.toArray(round?.currencies),
      round?.currency,
      round?.acceptedCurrency,
      round?.raw?.infoBlocks?.["Accepted Currency"]?.text,
      round?.raw?.infoBlocks?.["Accepted Currencies"]?.text,
    ];
    const symbols = rawValues
      .flatMap((value) => {
        if (typeof value === "string") {
          return value
            .split(/[,/]/)
            .map((item) => item.trim())
            .filter(Boolean);
        }

        const symbol = this.firstString(
          value?.symbol,
          value?.ticker,
          value?.name
        );
        return symbol ? [symbol] : [];
      })
      .filter(Boolean);

    return this.uniqueStrings(symbols).map((symbol) => ({
      symbol,
      ticker: symbol,
      name: symbol,
    }));
  }

  private extractRoundRoi(
    round: any,
    currency: "USD" | "BTC" | "ETH" | "ATH"
  ): number | undefined {
    if (currency === "USD") {
      const direct = this.firstNumber(
        round?.usdRoi,
        round?.roi,
        round?.raw?.infoBlocks?.ROI?.money,
        round?.raw?.infoBlocks?.["ROI from Listing Price"]?.money,
        round?.raw?.headerMetrics?.ROI
      );
      if (direct !== undefined) return direct;
    }

    const text = this.firstString(
      round?.raw?.infoBlocks?.ROI?.text,
      round?.raw?.infoBlocks?.["ROI from Listing Price"]?.text,
      round?.raw?.text
    );
    if (!text) return undefined;

    const match = text.match(
      new RegExp(`([0-9]+(?:[.,][0-9]+)?)\\s*x?\\s*${currency}`, "i")
    );
    return match ? this.toFiniteNumber(match[1]) : undefined;
  }

  private matchesQuery(project: any, query: any): boolean {
    const status = this.normalizeLookupKey(query?.status);
    if (status && status !== "all") {
      if (this.normalizeLookupKey(project?.status) !== status) return false;
    }

    const searchValue = this.normalizeLookupKey(query?.searchValue);
    if (searchValue) {
      const projectIdentity = [
        project?.name,
        project?.symbol,
        project?.ticker,
        project?.slug,
        project?.sourceId,
      ].map((value) => this.normalizeLookupKey(value));

      if (!projectIdentity.some((value) => value.includes(searchValue))) {
        return false;
      }
    }

    const categories = this.splitList(query?.categories).map((value) =>
      this.normalizeLookupKey(value)
    );
    if (categories.length) {
      const projectCategories = [
        project?.category,
        project?.mainCategory,
        project?.niche,
        ...(project?.categories || []),
      ].map((value) => this.normalizeLookupKey(value));
      if (!categories.some((value) => projectCategories.includes(value)))
        return false;
    }

    const fundingTypes = this.splitList(query?.fundingType).map((value) =>
      this.normalizeLookupKey(value)
    );
    if (fundingTypes.length) {
      const projectTypes = [
        project?.type,
        ...(project?.fundraising || []).map((round: any) => round?.type),
        ...(project?.saleRounds || []).map((round: any) => round?.type),
      ].map((value) => this.normalizeLookupKey(value));
      if (!fundingTypes.some((value) => projectTypes.includes(value)))
        return false;
    }

    const investors = this.splitList(query?.investorNames).map((value) =>
      this.normalizeLookupKey(value)
    );
    if (investors.length) {
      const projectInvestors = (project?.investors || []).map((item: any) =>
        this.normalizeLookupKey(item?.name || item)
      );
      if (!investors.some((value) => projectInvestors.includes(value)))
        return false;
    }

    if (!this.matchesNumericRanges(project?.totalRaised, query?.fundsRaised)) {
      return false;
    }

    if (!this.matchesNumericRanges(project?.fomoScore, query?.fomoScore)) {
      return false;
    }

    if (!this.matchesFundingDates(project?.lastFunding, query?.fundingDates)) {
      return false;
    }

    const redFlagsFilter = query?.["red-flags"] || query?.redFlags;
    if (
      !this.matchesRedFlags(project?.redFlagsList?.length || 0, redFlagsFilter)
    ) {
      return false;
    }

    return true;
  }

  private matchesAdditionalStatus(project: any, query: any): boolean {
    const additionalStatus = this.normalizeLookupKey(query?.additionalStatus);
    if (additionalStatus === "sponsored") return Boolean(project?.isSponsored);
    if (additionalStatus === "eralash") return Boolean(project?.isEralash);
    return true;
  }

  private compareProjects(
    left: any,
    right: any,
    sortKey: string,
    sortDirection: 1 | -1
  ): number {
    const leftValue = this.getSortValue(left, sortKey);
    const rightValue = this.getSortValue(right, sortKey);
    const leftMissing = leftValue === undefined || leftValue === null;
    const rightMissing = rightValue === undefined || rightValue === null;

    if (leftMissing && !rightMissing) return 1;
    if (!leftMissing && rightMissing) return -1;
    if (leftMissing && rightMissing)
      return this.compareStrings(left?.name, right?.name);
    if (leftValue === rightValue)
      return this.compareStrings(left?.name, right?.name);

    return leftValue > rightValue ? sortDirection : -sortDirection;
  }

  private getSortValue(project: any, sortKey: string): any {
    if (sortKey === "lastFunding") {
      return this.toDate(project?.lastFunding)?.getTime();
    }

    if (sortKey === "investorsCount") return project?.investorsCount || 0;
    if (sortKey === "fomoScore") return this.toFiniteNumber(project?.fomoScore);
    return this.toFiniteNumber(project?.totalRaised);
  }

  private getProjectSearchRank(project: any, searchValue: string): number {
    const fields = [
      project?.name,
      project?.symbol,
      project?.ticker,
      project?.slug,
      project?.sourceId,
    ].map((value) => this.normalizeLookupKey(value));

    if (fields.some((value) => value === searchValue)) return 0;
    if (fields.some((value) => value.startsWith(searchValue))) return 1;
    if (fields.some((value) => value.includes(searchValue))) return 2;
    return 3;
  }

  private getSortKey(value: any): string {
    const key = this.normalizeLookupKey(value);
    if (key === "lastfunding") return "lastFunding";
    if (key === "investors" || key === "investorscount")
      return "investorsCount";
    if (key === "fomoscore" || key === "rating") return "fomoScore";
    if (key === "totalraised" || key === "fundsraised") return "totalRaised";
    return "lastFunding";
  }

  private getProfile(row: any): any {
    return row?.metadata?.icodropsProfileOnly || {};
  }

  private getFundingAggregate(row: any): any {
    const aggregate = row?.metadata?.fundingAggregate;
    return aggregate && typeof aggregate === "object" ? aggregate : undefined;
  }

  private extractInvestors(profile: any): any[] {
    return this.normalizeInvestors([
      ...this.toArray(profile?.fundraising?.investors),
      ...this.toArray(profile?.investors),
      ...this.toArray(profile?.fundraising?.rounds).flatMap((round: any) =>
        this.toArray(round?.investors)
      ),
      ...this.toArray(profile?.saleRounds).flatMap((round: any) =>
        this.toArray(round?.investors)
      ),
    ]);
  }

  private normalizeInvestors(values: any[]): any[] {
    const byName = new Map<string, any>();

    for (const value of values) {
      const name = this.firstString(value?.name, value?.title, value);
      if (!name) continue;

      const key = this.normalizeLookupKey(name);
      if (byName.has(key)) continue;

      const logo = this.firstString(
        value?.logo,
        value?.avatar,
        value?.image,
        value?.img,
        value?.logoUrl,
        value?.avatarUrl,
        value?.details?.logo,
        value?.details?.logoUrl,
        value?.details?.avatarUrl
      );
      byName.set(key, {
        _id: this.firstString(
          value?._id,
          value?.id,
          value?.details?._id,
          value?.slug,
          key
        ),
        id: this.firstString(
          value?.id,
          value?._id,
          value?.details?.id,
          value?.slug,
          key
        ),
        name,
        slug: this.firstString(value?.slug, value?.details?.slug),
        url: this.firstString(value?.url, value?.href),
        logo,
        avatar: logo,
        type: this.firstString(value?.type, value?.details?.type),
        tier: this.firstString(value?.tier),
        stage: this.firstString(value?.stage, value?.role),
        details: {
          ...(value?.details || {}),
          logo,
        },
      });
    }

    return Array.from(byName.values());
  }

  private resolveTotalRaised(profile: any, rounds: any[]): number | undefined {
    const explicit = this.firstPositiveNumber(
      profile?.fundraising?.totalRaised,
      profile?.totalRaised,
      profile?.raw?.overviewTotalRaised
    );
    if (explicit !== undefined) return explicit;

    const sum = rounds.reduce((total, round) => {
      const amount = this.extractRoundAmount(round);
      return amount && amount > 0 ? total + amount : total;
    }, 0);

    return sum > 0 ? sum : undefined;
  }

  private extractRoundAmount(round: any): number | undefined {
    return this.firstPositiveNumber(
      round?.raise,
      round?.raised,
      round?.raisedAmount,
      round?.amount,
      round?.fundsRaised,
      round?.raw?.infoBlocks?.Raised?.money,
      round?.raw?.infoBlocks?.Goal?.money,
      round?.raw?.headerMetrics?.Raised
    );
  }

  private getLatestRound(rounds: any[]): any {
    let latest: any;
    let latestTime = -Infinity;

    for (const round of rounds) {
      const time = this.toDate(this.extractRoundDate(round))?.getTime();
      if (time !== undefined && time > latestTime) {
        latestTime = time;
        latest = round;
      }
    }

    return latest || rounds[0];
  }

  private extractRoundDate(round: any): string | undefined {
    const date = this.firstString(
      round?.date?.date?.normalized,
      round?.date?.normalized,
      round?.normalizedDate,
      round?.fundingDate,
      round?.announcedAt,
      round?.announcedDate,
      round?.startDate,
      round?.endDate,
      round?.date,
      round?.rawDate
    );
    return this.toDate(date)?.toISOString();
  }

  private resolvePlatform(
    profile: any,
    rounds: any[],
    fallback?: string
  ): string | undefined {
    for (const round of rounds) {
      const value = this.firstString(
        round?.launchpad,
        round?.platform?.name,
        round?.platform,
        round?.raw?.infoBlocks?.Platform?.text,
        round?.raw?.infoBlocks?.Blockchain?.text
      );
      if (value) return value;
    }

    const launchpad = this.toArray(profile?.launchpads)
      .map((item) => this.firstString(item?.name, item))
      .find(Boolean);
    if (launchpad) return launchpad;

    const ecosystem = this.toArray(profile?.ecosystems)
      .map((item) => this.firstString(item?.name, item))
      .find(Boolean);
    return ecosystem || fallback;
  }

  private extractProjectLinks(
    profile: any,
    market: any,
    sourceUrl?: string
  ): any[] {
    const links = [
      ...this.toArray(profile?.links),
      ...this.toArray(market?.links),
      ...(sourceUrl
        ? [{ name: "ICO Drops", url: sourceUrl, href: sourceUrl }]
        : []),
    ];
    const seen = new Set<string>();

    return links
      .map((item) => {
        const url = this.firstString(item?.url, item?.href, item);
        if (!url) return undefined;
        const key = this.normalizeLookupKey(url);
        if (seen.has(key)) return undefined;
        seen.add(key);

        return {
          name: this.firstString(item?.name, item?.label, "Link"),
          url,
          href: url,
          type: this.firstString(item?.type),
        };
      })
      .filter(Boolean);
  }

  private extractSocialMedia(profile: any, market: any): any[] {
    const marketLinks = this.uniqueSocialLinks(
      this.normalizeSocialMedia(market?.socialmedia)
    );
    if (marketLinks.length) return marketLinks;

    return this.uniqueSocialLinks([
      ...this.normalizeSocialMedia(profile?.socialmedia),
      ...this.normalizeSocialMedia(profile?.social),
    ]);
  }

  private normalizeSocialMedia(source: any): any[] {
    if (!source) return [];

    if (Array.isArray(source)) {
      return source
        .map((item: any) => {
          const href = this.firstString(item?.href, item?.url);
          if (!this.isSocialLinkUrl(href)) return undefined;
          return {
            href,
            name:
              this.firstString(item?.name, item?.label, item?.type) || "Link",
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
          if (!this.isSocialLinkUrl(url)) continue;
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
      if (!this.isSocialLinkUrl(href)) continue;
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

  private isSocialLinkUrl(value: any): boolean {
    return /^https?:\/\//i.test(String(value || "").trim());
  }

  private normalizeWebsite(...values: any[]): string[] {
    const urls = values
      .flatMap((value) => this.toArray(value))
      .map((item) => this.firstString(item?.url, item?.href, item))
      .filter(Boolean) as string[];

    return this.uniqueStrings(urls);
  }

  private cleanCategories(values: any[]): string[] {
    return this.uniqueStrings(
      this.toArray(values)
        .flat()
        .map((value) => this.firstString(value?.name, value))
        .filter(Boolean)
        .filter((value) => !/^#\d+\s+in\s+/i.test(String(value)))
    );
  }

  private incrementOption(
    map: Map<string, { label: string; count: number }>,
    label: string
  ): void {
    const key = this.normalizeLookupKey(label);
    if (!key) return;

    const current = map.get(key);
    if (current) {
      current.count += 1;
      return;
    }

    map.set(key, { label, count: 1 });
  }

  private toFilterOptions(
    map: Map<string, { label: string; count: number }>,
    limit: number
  ): Array<{ key: string; label: string; count: number }> {
    return Array.from(map.entries())
      .map(([key, value]) => ({ key, label: value.label, count: value.count }))
      .sort(
        (left, right) =>
          right.count - left.count || left.label.localeCompare(right.label)
      )
      .slice(0, limit);
  }

  private matchesNumericRanges(value: any, rangeValue: any): boolean {
    const ranges = this.splitList(rangeValue);
    if (!ranges.length) return true;

    const numberValue = this.toFiniteNumber(value);
    if (numberValue === undefined) return false;

    return ranges.some((range) => this.matchesSingleRange(numberValue, range));
  }

  private matchesSingleRange(value: number, rawRange: string): boolean {
    const range = String(rawRange || "").trim();
    if (!range) return true;
    if (range.startsWith(">")) {
      const min = this.toFiniteNumber(range.slice(1));
      return min !== undefined && value > min;
    }
    if (range.startsWith("<")) {
      const max = this.toFiniteNumber(range.slice(1));
      return max !== undefined && value < max;
    }

    const [rawMin, rawMax] = range.split("-");
    if (rawMax !== undefined) {
      const min = this.toFiniteNumber(rawMin);
      const max = this.toFiniteNumber(rawMax);
      return (
        (min === undefined || value >= min) &&
        (max === undefined || value <= max)
      );
    }

    const exact = this.toFiniteNumber(range);
    return exact === undefined || value === exact;
  }

  private matchesFundingDates(value: any, rangeValue: any): boolean {
    const ranges = this.splitList(rangeValue);
    if (!ranges.length) return true;

    const date = this.toDate(value);
    if (!date) return false;

    const ageDays = (Date.now() - date.getTime()) / 86_400_000;
    return ranges.some((range) => {
      const key = String(range || "").trim();
      if (!key) return true;
      if (key.startsWith("<")) {
        const days = this.toFiniteNumber(key.replace(/[^\d.]/g, ""));
        return days !== undefined && ageDays <= days;
      }
      if (key.startsWith(">")) {
        const days = this.toFiniteNumber(key.replace(/[^\d.]/g, ""));
        return days !== undefined && ageDays > days;
      }
      return this.matchesSingleRange(ageDays, key);
    });
  }

  private matchesRedFlags(count: number, rangeValue: any): boolean {
    const ranges = this.splitList(rangeValue);
    if (!ranges.length) return true;

    return ranges.some((range) => this.matchesSingleRange(count, range));
  }

  private buildListCacheKey(
    query: any,
    limit: number,
    offset: number,
    cacheVersion: string
  ): string {
    const source = {
      ...(query || {}),
      limit,
      offset,
      cacheVersion,
    };
    const entries = Object.keys(source)
      .sort()
      .map((key) => [key, String(source[key] ?? "")]);

    return JSON.stringify(entries);
  }

  /**
   * A local cache entry is valid only for the exact persisted ICO + market
   * read-model generation. This keeps replicas coherent without relying on an
   * in-process invalidation event from the worker replica.
   */
  private async loadReadModelCacheVersion(): Promise<string> {
    const [ico, market] = await Promise.all([
      this.icoProjectReadModel
        .findOne(
          { sourceType: projectSourceTypeMongoPattern("icodrops") },
          { _id: 1, updatedAt: 1 }
        )
        .sort({ updatedAt: -1, _id: -1 })
        .lean()
        .exec(),
      this.marketProjectReadModel
        .findOne({}, { _id: 1, updatedAt: 1 })
        .sort({ updatedAt: -1, _id: -1 })
        .lean()
        .exec(),
    ]);

    return [ico, market]
      .map((row: any) => {
        const updatedAt = this.toDate(row?.updatedAt)?.toISOString() || "none";
        return `${updatedAt}:${this.toIdString(row?._id) || "none"}`;
      })
      .join("|");
  }

  private getCacheValue<T>(
    cache: Map<string, IcoCacheEntry<T>>,
    key: string
  ): T | undefined {
    const entry = cache.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  private setCacheValue<T>(
    cache: Map<string, IcoCacheEntry<T>>,
    key: string,
    value: T,
    ttlMs: number
  ): void {
    cache.set(key, {
      expiresAt: Date.now() + ttlMs,
      value,
    });

    if (cache.size <= ICO_LIST_CACHE_MAX_KEYS) return;

    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }

  private parseQueryString(query: any): any {
    return { ...(query || {}) };
  }

  private splitList(value: any): string[] {
    if (value === undefined || value === null || value === "") return [];
    if (Array.isArray(value))
      return value.flatMap((item) => this.splitList(item));
    return String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private normalizeStatus(value: any): string {
    const normalized = this.normalizeLookupKey(value || "active");
    if (normalized === "upcoming") return "Upcoming";
    if (normalized === "ended") return "Ended";
    if (normalized === "active") return "Active";

    return String(value || "Active")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private normalizeSlug(value: any): string {
    return this.normalizeLookupKey(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private normalizeLookupKey(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private compareStrings(left: any, right: any): number {
    return String(left || "").localeCompare(String(right || ""));
  }

  private uniqueStrings(values: any[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const value of values) {
      const text = this.firstString(value);
      if (!text) continue;

      const key = this.normalizeLookupKey(text);
      if (seen.has(key)) continue;

      seen.add(key);
      result.push(text);
    }

    return result;
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

  private roundNumber(value: any, decimals = 6): number | undefined {
    const numberValue = this.toFiniteNumber(value);
    if (numberValue === undefined) return undefined;
    const factor = 10 ** decimals;
    return Math.round(numberValue * factor) / factor;
  }

  private toFiniteNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    if (typeof value === "number")
      return Number.isFinite(value) ? value : undefined;

    const text = String(value).trim();
    if (!text || text === "—" || text === "-") return undefined;
    const multiplier = /b\b/i.test(text)
      ? 1_000_000_000
      : /m\b/i.test(text)
      ? 1_000_000
      : /k\b/i.test(text)
      ? 1_000
      : 1;
    const numberValue = Number(text.replace(/[^0-9.-]/g, ""));
    if (!Number.isFinite(numberValue)) return undefined;
    return numberValue * multiplier;
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : undefined;
  }

  private toArray(value: any): any[] {
    if (value === undefined || value === null) return [];
    return Array.isArray(value) ? value : [value];
  }

  private hasItems(value: any): boolean {
    return this.toArray(value).length > 0;
  }

  private toIdString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (value instanceof Types.ObjectId) return value.toHexString();
    if (value._id) return this.toIdString(value._id);
    return String(value);
  }

  private positiveInteger(value: any, fallback: number, max = 5000): number {
    const numberValue = Math.trunc(Number(value));
    if (!Number.isFinite(numberValue) || numberValue <= 0) return fallback;
    return Math.min(numberValue, max);
  }

  private nonNegativeInteger(value: any, fallback: number): number {
    const numberValue = Math.trunc(Number(value));
    if (!Number.isFinite(numberValue) || numberValue < 0) return fallback;
    return numberValue;
  }

  private isTruthy(value: any): boolean {
    if (typeof value === "boolean") return value;
    return ["1", "true", "yes", "on"].includes(this.normalizeLookupKey(value));
  }

  private cleanObject<T extends Record<string, any>>(source: T): Partial<T> {
    return Object.entries(source).reduce((result, [key, value]) => {
      if (value !== undefined) result[key as keyof T] = value as T[keyof T];
      return result;
    }, {} as Partial<T>);
  }
}
