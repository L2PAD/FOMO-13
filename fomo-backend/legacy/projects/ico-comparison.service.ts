import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { FundingRound, FundingRoundDocument } from "src/funding-rounds/models/funding-round.model";
import { AppCacheService } from "src/common/cache/cache.service";
import { CACHE_TTL_SECONDS } from "src/common/cache/cache.constants";
import { CacheKeys } from "src/common/cache/cache.keys";
import { Project, ProjectDocument } from "./project.model";
import { ProjectIntel, ProjectIntelDocument } from "./intel-sync/models/project-intel.model";
import { ProjectUnlocks, ProjectUnlocksDocument } from "./intel-sync/models/project-unlocks.model";
import { normalizeSlug } from "./intel-sync/project-identity.util";

type ProjectLike = Record<string, any>;

const MAX_FUNDING_ROUNDS_PER_PROJECT = 50;
const MAX_COMPARISON_PEER_CANDIDATES = 80;
const COMPARISON_CANDIDATE_MULTIPLIER = 4;
const COMPARISON_MIN_METRICS_TO_COMPARE = 2;
const COMPARISON_MAX_AVERAGE_LOG_DISTANCE = 0.9;
const COMPARISON_FALLBACK_MAX_AVERAGE_LOG_DISTANCE = 1.45;
const COMPARISON_PROJECT_PROJECTION: Record<string, number> = {
  _id: 1,
  projectType: 1,
  projectStatus: 1,
  source: 1,
  sourceId: 1,
  name: 1,
  normalizedName: 1,
  slug: 1,
  symbol: 1,
  ticker: 1,
  niche: 1,
  logo: 1,
  screenshot: 1,
  screenshotUrl: 1,
  descriptionImages: 1,
  categories: 1,
  tags: 1,
  ecosystems: 1,
  launchpads: 1,
  mainCategory: 1,
  type: 1,
  status: 1,
  blockchain: 1,
  marketCap: 1,
  fullyDilutedMarketCap: 1,
  fdv: 1,
  price: 1,
  currentPrice: 1,
  volume24h: 1,
  volume: 1,
  usdQuote: 1,
  circulatingSupply: 1,
  totalSupply: 1,
  athUsd: 1,
  atlUsd: 1,
  icoPrice: 1,
  listingPrice: 1,
  roiData: 1,
  xfromIco: 1,
  totalRaised: 1,
  fundsRaised: 1,
  fundraising: 1,
  fundsRounds: 1,
  saleRounds: 1,
  tokenomics: 1,
  tokenMetrics: 1,
  totalAllocation: 1,
  investors: 1,
  rating: 1,
  fomoScore: 1,
  fullness: 1,
  riskScore: 1,
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
  "rawIcoData.ecosystems": 1,
  "rawIcoData.launchpads": 1,
  "rawIcoData.marketData": 1,
  "rawIcoData.fundraising": 1,
  "rawIcoData.saleRounds": 1,
  "rawIcoData.icoPrice": 1,
  "rawIcoData.listingPrice": 1,
  "rawIcoData.athRoi": 1,
  "rawIcoData.tokenomics": 1,
  "rawIcoData.investors": 1,
  "rawIcoData.uiInvestors": 1,
  "rawIcoData.screenshots": 1,
  "rawIcoData.coingeckoId": 1,
  "rawIcoData.coinMarketCapId": 1,
  "rawIcoData.dropstabId": 1,
  "rawIcoData.dropstabSlug": 1,
  "rawIcoData.cryptorankId": 1,
  "rawIcoData.icodropsId": 1,
};
const COMPARISON_PEER_CANDIDATE_PROJECTION: Record<string, number> = {
  _id: 1,
  projectType: 1,
  projectStatus: 1,
  sourceId: 1,
  name: 1,
  normalizedName: 1,
  slug: 1,
  symbol: 1,
  ticker: 1,
  niche: 1,
  categories: 1,
  tags: 1,
  ecosystems: 1,
  launchpads: 1,
  mainCategory: 1,
  type: 1,
  status: 1,
  marketCap: 1,
  fullyDilutedMarketCap: 1,
  fdv: 1,
  fundsRaised: 1,
  totalRaised: 1,
  fundraising: 1,
  roiData: 1,
  xfromIco: 1,
  fomoScore: 1,
  coingeckoId: 1,
  coinMarketCapId: 1,
  dropstabId: 1,
  cryptorankId: 1,
  icodropsId: 1,
  "rawIcoData.slug": 1,
  "rawIcoData.sourceId": 1,
  "rawIcoData.symbol": 1,
  "rawIcoData.ticker": 1,
  "rawIcoData.categories": 1,
  "rawIcoData.ecosystems": 1,
  "rawIcoData.launchpads": 1,
  "rawIcoData.marketData.marketCap": 1,
  "rawIcoData.marketData.fdv": 1,
  "rawIcoData.marketData.fullyDilutedMarketCap": 1,
  "rawIcoData.marketData.roi": 1,
  "rawIcoData.fundraising.totalRaised": 1,
  "rawIcoData.coingeckoId": 1,
  "rawIcoData.coinMarketCapId": 1,
  "rawIcoData.dropstabId": 1,
  "rawIcoData.dropstabSlug": 1,
  "rawIcoData.cryptorankId": 1,
  "rawIcoData.icodropsId": 1,
};
const FUNDING_ROUND_COMPARISON_PROJECTION: Record<string, number> = {
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
  amount: 1,
  raised: 1,
  raise: 1,
  fundsRaised: 1,
  amountRaw: 1,
  amountFormatted: 1,
  valuation: 1,
  preValuation: 1,
  valuationRaw: 1,
  valuationFormatted: 1,
  price: 1,
  tokenPrice: 1,
  investors: 1,
  leadInvestors: 1,
  "raw.infoBlocks.Raised": 1,
  "raw.infoBlocks.Pre-Valuation": 1,
  "raw.infoBlocks.Price": 1,
};

interface IcoComparisonQuery {
  includePeers?: any;
  peerLimit?: any;
  status?: any;
}

interface IcoComparisonSearchQuery {
  search?: any;
  metric?: any;
  limit?: any;
  excludeIds?: any;
  status?: any;
}

interface NormalizedIcoComparisonQuery {
  includePeers: boolean;
  peerLimit: number;
  status: string | null;
}

interface NormalizedIcoComparisonSearchQuery {
  search: string;
  metric: string;
  limit: number;
  excluded: string[];
  status: string | null;
}

interface ComparisonMetricScore {
  key: "marketCap" | "fdv" | "raised";
  target: number;
  candidate: number;
  distance: number;
  score: number;
  weight: number;
}

interface ComparisonSimilarityScore {
  total: number;
  metricsCompared: number;
  averageDistance: number | null;
  isEligible: boolean;
}

@Injectable()
export class IcoComparisonService {
  private readonly logger = new Logger(IcoComparisonService.name);
  private readonly perfLogs = process.env.COMPARISON_PERF_LOGS === "true" || process.env.CACHE_DEBUG_LOGS === "true";
  private readonly inFlight = new Map<string, Promise<any>>();
  private readonly warmInFlight = new Set<string>();
  private readonly warmLastStartedAt = new Map<string, number>();
  private readonly warmCooldownMs = 60_000;
  private readonly maxWarmJobs = Math.max(1, Number(process.env.COMPARISON_PREWARM_CONCURRENCY || 4));

  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectIntel.name) private readonly projectIntelModel: Model<ProjectIntelDocument>,
    @InjectModel(ProjectUnlocks.name) private readonly projectUnlocksModel: Model<ProjectUnlocksDocument>,
    @InjectModel(FundingRound.name) private readonly fundingRoundModel: Model<FundingRoundDocument>,
    private readonly cacheService?: AppCacheService,
  ) { }

  async getIcoComparison(slugOrId: string, query: IcoComparisonQuery = {}): Promise<any> {
    const project = await this.findProject(slugOrId);
    const normalizedQuery: NormalizedIcoComparisonQuery = {
      includePeers: this.isTruthy(query.includePeers, true),
      peerLimit: this.clampInt(query.peerLimit, 5, 0, 20),
      status: this.firstString((query as any).status),
    };
    const cacheKey = CacheKeys.projects.icoComparison({
      projectId: String(project._id),
      status: normalizedQuery.status,
      peerLimit: normalizedQuery.peerLimit,
      includePeers: normalizedQuery.includePeers,
    });

    return this.cacheReadOnly(
      cacheKey,
      CACHE_TTL_SECONDS.projectIcoComparison,
      "ico-comparison",
      () => this.getIcoComparisonUncached(project, normalizedQuery),
    );
  }

  warmComparisonCache(slugOrId: string, query: IcoComparisonQuery = {}): void {
    const projectKey = String(slugOrId || "").trim();
    if (!projectKey) return;

    const normalizedWarmQuery: IcoComparisonQuery = {
      includePeers: query.includePeers ?? true,
      peerLimit: query.peerLimit ?? 4,
      status: query.status,
    };
    const warmKey = [
      "ico-comparison",
      projectKey,
      normalizedWarmQuery.peerLimit,
      normalizedWarmQuery.includePeers,
      normalizedWarmQuery.status || "",
    ].join(":");

    this.scheduleWarm(warmKey, () => this.getIcoComparison(projectKey, normalizedWarmQuery));
  }

  private async getIcoComparisonUncached(
    project: ProjectLike,
    query: NormalizedIcoComparisonQuery,
  ): Promise<any> {
    const startedAt = Date.now();
    const [intel, unlocks, fundingRounds] = await Promise.all([
      this.projectIntelModel.findOne({ projectId: project._id }).lean(),
      this.projectUnlocksModel.findOne({ projectId: project._id, source: "dropstab" }).lean(),
      this.findFundingRounds(project),
    ]);
    this.logStage("ico-comparison", "base-data", startedAt);
    const peerCandidateLimit = this.comparisonCandidateLimit(query.peerLimit);
    const comparisonPeerCandidates = query.includePeers
      ? await this.findComparisonPeers(project, peerCandidateLimit)
      : [];
    this.logStage("ico-comparison", "peer-candidates", startedAt);
    const comparisonSummaryCandidates = this.limitPeerSummaryCandidates(
      comparisonPeerCandidates,
      query.peerLimit,
    );
    const comparisonPeerSummaries = comparisonSummaryCandidates.length
      ? await this.buildPeerSummaries(comparisonSummaryCandidates)
      : [];
    this.logStage("ico-comparison", "peer-summaries", startedAt);
    const response = this.buildComparisonResponse(
      project,
      intel,
      unlocks,
      fundingRounds,
      comparisonPeerSummaries,
      query.peerLimit,
    );
    this.logStage("ico-comparison", "response-built", startedAt);

    return this.sanitizeResponse(response);
  }

  async searchIcoComparisonProjects(slugOrId: string, query: IcoComparisonSearchQuery = {}): Promise<any> {
    const project = await this.findProject(slugOrId);
    const normalizedQuery: NormalizedIcoComparisonSearchQuery = {
      search: String(query.search || "").trim(),
      limit: this.clampInt(query.limit, 8, 1, 20),
      metric: String(query.metric || "").trim().toLowerCase(),
      excluded: this.parseProjectKeys(query.excludeIds),
      status: this.firstString(query.status),
    };
    const cacheKey = CacheKeys.projects.icoComparisonSearch({
      projectId: String(project._id),
      status: normalizedQuery.status,
      search: normalizedQuery.search,
      metric: normalizedQuery.metric,
      limit: normalizedQuery.limit,
      excludeIds: [...normalizedQuery.excluded].sort(),
    });

    return this.cacheReadOnly(
      cacheKey,
      CACHE_TTL_SECONDS.projectIcoComparisonSearch,
      "ico-comparison-search",
      () => this.searchIcoComparisonProjectsUncached(project, normalizedQuery),
    );
  }

  private async searchIcoComparisonProjectsUncached(
    project: ProjectLike,
    query: NormalizedIcoComparisonSearchQuery,
  ): Promise<any> {
    const { search, limit, metric, excluded } = query;
    const excludedObjectIds = excluded
      .filter((item) => Types.ObjectId.isValid(item))
      .map((item) => new Types.ObjectId(item));
    const excludedSlugs = excluded
      .filter((item) => !Types.ObjectId.isValid(item))
      .map((item) => normalizeSlug(item))
      .filter(Boolean);
    const baseOr: any[] = [];
    const excludeSlugQuery = excludedSlugs.length
      ? {
        $nin: excludedSlugs,
      }
      : undefined;

    if (search) {
      const regex = new RegExp(this.escapeRegex(search), "i");
      baseOr.push(
        { name: regex },
        { slug: regex },
        { sourceId: regex },
        { symbol: regex },
        { ticker: regex },
        { niche: regex },
        { "rawIcoData.slug": regex },
        { "rawIcoData.symbol": regex },
      );
    }

    const findQuery: any = {
      _id: {
        $nin: [
          ...(project._id ? [new Types.ObjectId(String(project._id))] : []),
          ...excludedObjectIds,
        ],
      },
      projectType: { $in: ["project", "market"] },
      projectStatus: "active",
      ...(baseOr.length ? { $or: baseOr } : {}),
      ...(excludeSlugQuery
        ? {
          slug: excludeSlugQuery,
          sourceId: excludeSlugQuery,
          "rawIcoData.slug": excludeSlugQuery,
        }
        : {}),
    };
    const [excludedProjects, candidates] = await Promise.all([
      excludedObjectIds.length
        ? this.projectModel.find({ _id: { $in: excludedObjectIds } }, COMPARISON_PROJECT_PROJECTION).lean()
        : [],
      this.projectModel
        .find(findQuery, COMPARISON_PROJECT_PROJECTION)
        .sort({ fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 })
        .limit(Math.max(limit * 10, 80))
        .lean(),
    ]);
    const candidateSummaries = await this.buildPeerSummaries(
      this.dedupeProjects(candidates, project, excludedProjects),
    );
    const projects = candidateSummaries
      .filter((candidate) => this.hasSearchMetric(candidate, metric))
      .slice(0, limit);

    return this.sanitizeResponse({
      projects,
      total: projects.length,
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

    const project = await this.projectModel.findOne({ $or: clauses }, COMPARISON_PROJECT_PROJECTION).lean();
    if (!project) throw new NotFoundException("Project not found");
    return project;
  }

  private async findFundingRounds(project: ProjectLike): Promise<any[]> {
    const slugs = this.uniqueStrings([
      project.slug,
      project.sourceId,
      project.rawIcoData?.slug,
      project.rawIcoData?.sourceId,
    ]);
    const symbols = this.uniqueStrings([
      project.symbol,
      project.ticker,
      project.niche,
      project.rawIcoData?.symbol,
      project.rawIcoData?.ticker,
    ]).map((item) => item.toUpperCase());
    const or: any[] = [];
    const projectId = project?._id && Types.ObjectId.isValid(String(project._id))
      ? new Types.ObjectId(String(project._id))
      : null;

    if (projectId) {
      or.push({ projectId }, { "projectLinks.projectId": projectId });
    }
    if (slugs.length) or.push({ coinSlug: { $in: slugs } });
    if (symbols.length) or.push({ coinSymbol: { $in: symbols } });

    if (!or.length) return [];

    return this.fundingRoundModel
      .find({ $or: or }, FUNDING_ROUND_COMPARISON_PROJECTION)
      .sort({ date: -1 })
      .limit(50)
      .lean();
  }

  private async buildPeerSummaries(peers: ProjectLike[]): Promise<any[]> {
    if (!peers.length) return [];

    const peerIds = peers
      .map((peer) => peer?._id)
      .filter((id) => Types.ObjectId.isValid(String(id)))
      .map((id) => new Types.ObjectId(String(id)));
    const [intels, fundingRoundsByProjectId] = await Promise.all([
      peerIds.length
        ? this.projectIntelModel.find({ projectId: { $in: peerIds } }).lean()
        : [],
      this.findFundingRoundsForProjects(peers),
    ]);
    const intelByProjectId = new Map<string, ProjectLike>(
      intels.map((intel): [string, ProjectLike] => [String(intel.projectId), intel as ProjectLike]),
    );

    return peers.map((peer) =>
      this.buildPeerSummary(
        peer,
        intelByProjectId.get(String(peer?._id)) || null,
        fundingRoundsByProjectId.get(String(peer?._id)) || [],
      ),
    );
  }

  private async findFundingRoundsForProjects(projects: ProjectLike[]): Promise<Map<string, any[]>> {
    const projectIds = projects
      .map((project) => project?._id)
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
      .find({ $or: or }, FUNDING_ROUND_COMPARISON_PROJECTION)
      .sort({ date: -1 })
      .limit(Math.max(projects.length * MAX_FUNDING_ROUNDS_PER_PROJECT, MAX_FUNDING_ROUNDS_PER_PROJECT))
      .lean();

    return this.groupFundingRounds(projects, rounds);
  }

  private groupFundingRounds(projects: ProjectLike[], rounds: any[]): Map<string, any[]> {
    const result = new Map<string, any[]>();
    const projectKeys = projects.map((project) => ({
      id: String(project?._id || ""),
      objectId: String(project?._id || ""),
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

  private async findComparisonPeers(project: ProjectLike, limit: number): Promise<ProjectLike[]> {
    if (limit <= 0) return [];

    const manualPeers = await this.findManualPeers(project, Math.min(limit, 20));
    const autoPeers = await this.findAutoPeers(project, limit, manualPeers);

    return this.dedupeProjects([...manualPeers, ...autoPeers], project)
      .slice(0, MAX_COMPARISON_PEER_CANDIDATES);
  }

  private async findManualPeers(project: ProjectLike, limit: number): Promise<ProjectLike[]> {
    const ids = (Array.isArray(project.comparison) ? project.comparison : [])
      .map((id: any) => String(id || ""))
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    if (!ids.length) return [];

    return this.projectModel
      .find({ _id: { $in: ids } }, COMPARISON_PROJECT_PROJECTION)
      .limit(limit)
      .lean();
  }

  private async findAutoPeers(project: ProjectLike, limit: number, existingPeers: ProjectLike[]): Promise<ProjectLike[]> {
    const categories = this.peerCategoryKeys(project);
    const launchpads = this.uniqueStrings([
      ...(project.launchpads || []),
      ...(project.rawIcoData?.launchpads || []),
    ]);
    const ecosystems = this.uniqueStrings([
      ...(project.ecosystems || []),
      ...(project.rawIcoData?.ecosystems || []),
    ]);
    const primaryBranchQueries: any[] = [];
    const secondaryBranchQueries: any[] = [];
    const fallbackBranchQueries: any[] = [];

    if (categories.length) {
      primaryBranchQueries.push(
        { categories: { $in: categories } },
      );
      secondaryBranchQueries.push(
        { tags: { $in: categories } },
        { mainCategory: { $in: categories } },
        { "mainCategory.name": { $in: categories } },
        { "mainCategory.slug": { $in: categories.map((item) => normalizeSlug(item)) } },
      );
    }

    if (ecosystems.length) fallbackBranchQueries.push({ ecosystems: { $in: ecosystems } });
    if (launchpads.length) fallbackBranchQueries.push({ launchpads: { $in: launchpads } });
    if (project.status) fallbackBranchQueries.push({ status: project.status });
    const branchGroups = [
      primaryBranchQueries,
      secondaryBranchQueries,
      fallbackBranchQueries,
    ].filter((group) => group.length);
    if (!branchGroups.length) return [];

    const excludeIds = [
      project._id,
      ...existingPeers.map((peer) => peer._id),
    ]
      .filter(Boolean)
      .map((id) => new Types.ObjectId(String(id)));
    const baseQuery = {
      _id: { $nin: excludeIds },
      projectType: { $in: ["project", "market"] },
      projectStatus: "active",
    };
    const branchLimit = Math.min(
      Math.max(limit, 20),
      MAX_COMPARISON_PEER_CANDIDATES,
    );
    const candidates: ProjectLike[] = [];

    for (const branchGroup of branchGroups) {
      const candidateGroups = await Promise.all(
        branchGroup.map((branchQuery) =>
          this.projectModel
            .find({ ...baseQuery, ...branchQuery }, COMPARISON_PEER_CANDIDATE_PROJECTION)
            .sort({ fomoScore: -1, fundsRaised: -1, totalRaised: -1, marketCap: -1 })
            .limit(branchLimit)
            .lean(),
        ),
      );
      const dedupedCandidates = this.dedupeProjects(
        [...candidates, ...candidateGroups.flat()],
        project,
        existingPeers,
      );
      candidates.splice(0, candidates.length, ...dedupedCandidates);
      if (candidates.length >= limit) break;
    }
    const rankedCandidates = candidates
      .map((candidate) => ({
        candidate,
        score: this.peerScore(project, candidate),
      }))
      .sort((left, right) => right.score - left.score)
      .map((item) => item.candidate)
      .slice(0, limit);

    return this.loadFullPeerCandidates(rankedCandidates);
  }

  private async loadFullPeerCandidates(candidates: ProjectLike[]): Promise<ProjectLike[]> {
    const ids = candidates
      .map((candidate) => candidate?._id)
      .filter((id) => Types.ObjectId.isValid(String(id)))
      .map((id) => new Types.ObjectId(String(id)));
    if (!ids.length) return candidates;

    const fullCandidates = await this.projectModel
      .find({ _id: { $in: ids } }, COMPARISON_PROJECT_PROJECTION)
      .lean();
    const fullById = new Map<string, ProjectLike>(
      fullCandidates.map((candidate): [string, ProjectLike] => [String(candidate._id), candidate]),
    );

    return candidates.map((candidate) => fullById.get(String(candidate?._id)) || candidate);
  }

  private buildComparisonResponse(
    project: ProjectLike,
    intel: ProjectLike | null,
    unlocks: ProjectLike | null,
    fundingRounds: any[],
    comparisonPeers: any[],
    peerLimit = 5,
  ): any {
    const market = this.buildMarket(project, intel);
    const fundraising = this.buildFundraising(project, intel, fundingRounds);
    const roi = this.buildRoi(project, intel, market, fundraising);
    const scores = this.buildScores(project, intel);
    const currentComparisonRow = this.buildComparisonTableRow(
      project,
      market,
      fundraising,
      roi,
      scores,
    );
    const rankedComparisonPeers = this.rankComparisonPeers(
      currentComparisonRow,
      comparisonPeers,
      peerLimit,
    );
    const tokenomics = this.buildTokenomics(project, intel, unlocks, market);
    const unlocksData = this.buildUnlocks(unlocks);
    const backers = this.buildBackers(project, fundraising);
    const dataQuality = this.buildDataQuality(project, intel, unlocks, {
      market,
      fundraising,
      roi,
      tokenomics,
      unlocks: unlocksData,
      backers,
      comparisonPeers: rankedComparisonPeers,
    });

    return {
      project: {
        id: String(project._id),
        name: project.name,
        slug: project.slug || normalizeSlug(project.name || project.sourceId || ""),
        symbol: this.firstString(project.symbol, project.ticker, project.niche),
        logo: this.firstString(project.logo, project.rawIcoData?.logo),
        screenshotUrl: this.firstScreenshot(project),
        screenshot: this.firstScreenshot(project),
        categories: this.uniqueStrings(project.categories || []),
        chains: this.uniqueStrings([
          ...(project.ecosystems || []),
          project.blockchain,
          project.tokenMetrics?.blockchain,
        ]),
      },
      market,
      fundraising,
      roi,
      tokenomics,
      unlocks: unlocksData,
      backers,
      scores,
      comparisonTable: [
        currentComparisonRow,
        ...rankedComparisonPeers,
      ],
      comparisonPeers: rankedComparisonPeers,
      dataQuality,
    };
  }

  private buildMarket(project: ProjectLike, intel: ProjectLike | null): any {
    const marketData = intel?.marketData || project.rawIcoData?.marketData || {};
    const currentPrice = this.firstPositiveNumber(
      project.price,
      project.usdQuote?.price,
      marketData.currentPrice,
      marketData.price,
    );
    const totalSupply = this.firstPositiveNumber(
      project.totalSupply,
      project.tokenomics?.totalSupply,
      project.tokenMetrics?.totalSupply,
      intel?.tokenomics?.supply?.totalSupply,
    );
    const fdv = this.firstPositiveNumber(
      project.fullyDilutedMarketCap,
      marketData.fdv,
      marketData.fullyDilutedMarketCap,
      project.tokenomics?.fdv,
      intel?.tokenomics?.fdv,
      this.multiply(currentPrice, totalSupply),
    );

    return {
      currentPrice,
      marketCap: this.firstPositiveNumber(project.marketCap, project.usdQuote?.market_cap, marketData.marketCap),
      fdv,
      volume24h: this.firstPositiveNumber(project.volume24h, project.volume, marketData.volume24h),
      circulatingSupply: this.firstPositiveNumber(
        project.circulatingSupply,
        project.tokenomics?.circulatingSupply,
        project.tokenMetrics?.circulatingSupply,
        intel?.tokenomics?.supply?.circulatingSupply,
      ),
      totalSupply,
      athPrice: this.firstPositiveNumber(project.athUsd, marketData.athPrice, marketData.ath),
      atlPrice: this.firstPositiveNumber(project.atlUsd, marketData.atlPrice, marketData.atl),
    };
  }

  private buildFundraising(project: ProjectLike, intel: ProjectLike | null, fundingRounds: any[]): any {
    const intelFundraising = intel?.fundraising || {};
    const dropstabFundraising = intel?.dropstab?.fundraising || intelFundraising.dropstab || {};
    const rounds = this.normalizeRounds([
      ...(intel?.dropstab?.fundraisingRounds || []),
      ...(intelFundraising.dropstabRounds || []),
      ...(intelFundraising.fundraisingRounds || []),
      ...(project.fundraising || []),
      ...(project.fundsRounds || []),
      ...(project.saleRounds || []),
      ...(project.rawIcoData?.saleRounds || []),
      ...(project.rawIcoData?.fundraising?.rounds || []),
      ...fundingRounds,
    ]);
    const totalFromRounds = this.sumNumbers(rounds.map((round) => round.amount));
    const totalRaised = this.firstPositiveNumber(
      project.totalRaised,
      project.fundsRaised,
      intelFundraising.totalRaised,
      intelFundraising.dropstabTotalRaised,
      dropstabFundraising.totalRaised,
      project.rawIcoData?.fundraising?.totalRaised,
      totalFromRounds,
    );

    return {
      totalRaised,
      rounds,
    };
  }

  private buildRoi(project: ProjectLike, intel: ProjectLike | null, market: any, fundraising: any): any {
    const marketData = intel?.marketData || project.rawIcoData?.marketData || {};
    const entryRound = this.selectEntryRound(fundraising.rounds);
    const explicitIcoPrice = this.firstPositiveNumber(
      this.valueByCurrency(project.icoPrice),
      this.valueByCurrency(marketData.icoPrice),
      project.rawIcoData?.icoPrice,
    );
    const icoPrice = this.firstPositiveNumber(
      explicitIcoPrice,
      entryRound?.price,
      this.safeEntryPrice(project.rawIcoData?.tokenomics?.tokenPrice, market.currentPrice),
      this.safeEntryPrice(project.tokenomics?.tokenPrice, market.currentPrice),
      this.safeEntryPrice(project.tokenMetrics?.tokenPrice, market.currentPrice),
    );
    const listingPrice = this.firstPositiveNumber(
      this.valueByCurrency(project.listingPrice),
      this.valueByCurrency(marketData.listingPrice),
      project.rawIcoData?.listingPrice,
    );
    const currentRoiPercentFallback = this.firstNumber(
      project.roiData?.USD,
      project.roiData?.usd,
      marketData.raw?.dropstabStats?.returns?.usd,
    );
    const currentRoiXFromIco = this.firstPositiveNumber(
      this.roiMultiplier(market.currentPrice, icoPrice),
      project.xfromIco?.USD,
      project.xfromIco?.usd,
      marketData.xfromIco?.USD,
      marketData.xfromIco?.usd,
      project.roiData?.roi,
      marketData.roi,
      this.roiMultiplierFromPercent(currentRoiPercentFallback),
    );
    const currentRoiFromIco = this.firstNumber(
      this.roiPercentFromMultiplier(currentRoiXFromIco),
      currentRoiPercentFallback,
      this.roiPercent(market.currentPrice, icoPrice),
    );
    const athRoiXFromIco = this.firstPositiveNumber(
      this.roiMultiplier(market.athPrice, icoPrice),
      marketData.athRoi,
      project.rawIcoData?.athRoi,
      project.roiData?.athRoi,
    );
    const athRoiFromIco = this.firstNumber(
      this.roiPercentFromMultiplier(athRoiXFromIco),
      this.roiPercent(market.athPrice, icoPrice),
    );
    const currentRoiXFromListing = this.roiMultiplier(market.currentPrice, listingPrice);
    const athRoiXFromListing = this.roiMultiplier(market.athPrice, listingPrice);

    return {
      entryPrice: icoPrice,
      icoPrice,
      listingPrice,
      currentPrice: market.currentPrice,
      athPrice: market.athPrice,
      roiX: currentRoiXFromIco,
      roiPercent: currentRoiFromIco,
      athRoiX: athRoiXFromIco,
      athRoiPercent: athRoiFromIco,
      currentRoiXFromIco,
      currentRoiFromIco,
      athRoiXFromIco,
      athRoiFromIco,
      currentRoiXFromListing,
      currentRoiFromListing: this.roiPercent(market.currentPrice, listingPrice),
      athRoiXFromListing,
      athRoiFromListing: this.roiPercent(market.athPrice, listingPrice),
      entryRoundName: entryRound?.name || (explicitIcoPrice !== null ? "ICO" : null),
      entrySource: explicitIcoPrice !== null ? "ico_price" : entryRound ? "funding_round" : null,
    };
  }

  private buildTokenomics(project: ProjectLike, intel: ProjectLike | null, unlocks: ProjectLike | null, market: any): any {
    const allocation = this.resolveTokenAllocation(project, intel, unlocks);

    return {
      totalSupply: market.totalSupply,
      circulatingSupply: market.circulatingSupply,
      initialCirculatingSupply: this.firstNumber(
        project.tokenomics?.initialCirculatingSupply,
        project.rawIcoData?.tokenomics?.initialCirculatingSupply,
      ),
      initialMarketCap: this.firstPositiveNumber(
        project.tokenomics?.initialMarketCap,
        intel?.tokenomics?.initialMarketCap,
      ),
      tokenSaleAllocation: this.allocationPercent(allocation, ["sale", "public", "private", "seed", "round"]),
      publicSaleAllocation: this.allocationPercent(allocation, ["public"]),
      privateSaleAllocation: this.allocationPercent(allocation, ["private", "seed", "strategic"]),
      teamAllocation: this.allocationPercent(allocation, ["team", "advisor"]),
      ecosystemAllocation: this.allocationPercent(allocation, ["ecosystem", "community", "reward"]),
      treasuryAllocation: this.allocationPercent(allocation, ["treasury", "reserve"]),
      liquidityAllocation: this.allocationPercent(allocation, ["liquidity", "market making"]),
      allocation,
    };
  }

  private buildUnlocks(unlocks: ProjectLike | null): any {
    const events = Array.isArray(unlocks?.unlockingEvents) ? unlocks.unlockingEvents : [];
    const next = unlocks?.nextUnlockingEvent || events.find((event) => this.dateTime(event?.unlockDate) >= Date.now()) || null;

    return {
      nextUnlockDate: this.toIso(next?.unlockDate || next?.date),
      nextUnlockAmount: this.firstNumber(next?.amount, next?.tokensAmount, next?.unlockedTokens),
      nextUnlockPercent: this.firstNumber(next?.percent, next?.tokensPercent, next?.unlockedPercent),
      events: events.map((event) => ({
        date: this.toIso(event?.unlockDate || event?.date),
        amount: this.firstNumber(event?.amount, event?.tokensAmount, event?.unlockedTokens),
        percent: this.firstNumber(event?.percent, event?.tokensPercent, event?.unlockedPercent),
        allocation: this.firstString(event?.allocation, event?.stage, event?.roundNames?.[0]),
        round: this.firstString(event?.round, event?.roundName, event?.roundNames?.[0], event?.stage),
      })).filter((event) => event.date),
    };
  }

  private buildBackers(project: ProjectLike, fundraising: any): any {
    const investors = this.normalizeInvestors([
      ...(project.investors || []),
      ...(project.rawIcoData?.investors || []),
      ...(project.rawIcoData?.uiInvestors || []),
      ...(fundraising.rounds || []).flatMap((round: any) => round.investors || []),
    ]);
    const leadInvestors = investors.filter((investor) => investor.isLead || investor.lead);

    return {
      totalInvestors: investors.length || null,
      leadInvestors: leadInvestors.length || null,
      topInvestors: investors.slice(0, 10).map((investor) => ({
        name: investor.name,
        slug: this.firstString(investor.slug, investor.investorSlug),
        logo: this.firstString(investor.logo, investor.img, investor.image),
        type: this.firstString(investor.type, investor.ventureType, investor.banner),
        tier: this.firstString(investor.tier),
        investmentsCount: this.firstNumber(investor.investmentsCount, investor.investments),
      })),
    };
  }

  private buildScores(project: ProjectLike, intel: ProjectLike | null): any {
    const confidence = this.firstNumber(
      intel?.dataQuality?.dropstabConfidence,
      intel?.dataQuality?.icodropsConfidence,
      intel?.dataQuality?.completeness,
    );

    return {
      rating: this.firstNumber(project.rating, project.fomoScore),
      fomoScore: this.firstNumber(project.fomoScore, project.rating),
      fullness: this.firstNumber(project.fullness, intel?.dataQuality?.completeness),
      riskScore: this.firstNumber(project.riskScore),
      sourceConfidence: confidence,
    };
  }

  private buildPeerSummary(peer: ProjectLike, intel: ProjectLike | null = null, fundingRounds: any[] = []): any {
    const market = this.buildMarket(peer, intel);
    const fundraising = this.buildFundraising(peer, intel, fundingRounds);
    const roi = this.buildRoi(peer, intel, market, fundraising);
    const backers = this.buildBackers(peer, fundraising);

    return {
      id: String(peer._id),
      name: peer.name,
      slug: peer.slug || normalizeSlug(peer.name || peer.sourceId || ""),
      symbol: this.firstString(peer.symbol, peer.ticker, peer.niche),
      logo: this.firstString(peer.logo, peer.rawIcoData?.logo),
      screenshotUrl: this.firstScreenshot(peer),
      screenshot: this.firstScreenshot(peer),
      categories: this.uniqueStrings(peer.categories || []),
      chains: this.uniqueStrings([...(peer.ecosystems || []), peer.blockchain, peer.tokenMetrics?.blockchain]),
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
      totalInvestors: backers.totalInvestors,
      rating: this.firstNumber(peer.rating, peer.fomoScore),
      fomoScore: this.firstNumber(peer.fomoScore, peer.rating),
    };
  }

  private buildComparisonTableRow(
    project: ProjectLike,
    market: any,
    fundraising: any,
    roi: any,
    scores: any,
  ): any {
    return {
      id: String(project._id),
      name: project.name,
      slug: project.slug || normalizeSlug(project.name || project.sourceId || ""),
      symbol: this.firstString(project.symbol, project.ticker, project.niche),
      logo: this.firstString(project.logo, project.rawIcoData?.logo),
      screenshotUrl: this.firstScreenshot(project),
      screenshot: this.firstScreenshot(project),
      categories: this.uniqueStrings(project.categories || []),
      chains: this.uniqueStrings([...(project.ecosystems || []), project.blockchain, project.tokenMetrics?.blockchain]),
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
      rating: scores.rating,
      fomoScore: scores.fomoScore,
    };
  }

  private buildDataQuality(
    project: ProjectLike,
    intel: ProjectLike | null,
    unlocks: ProjectLike | null,
    blocks: Record<string, any>,
  ): any {
    const missingFields: string[] = [];
    const staleFields: string[] = [];
    const sources = this.uniqueStrings([
      "project",
      project.source,
      project.rawIcoData ? "rawIcoData" : "",
      intel?.sourceRefs?.icodrops ? "icodrops" : "",
      intel?.sourceRefs?.dropstab || unlocks ? "dropstab" : "",
      project.marketDataSource ? "market" : "",
    ]);
    const checks: Array<[string, any]> = [
      ["market.currentPrice", blocks.market.currentPrice],
      ["market.marketCap", blocks.market.marketCap],
      ["market.fdv", blocks.market.fdv],
      ["fundraising.totalRaised", blocks.fundraising.totalRaised],
      ["fundraising.rounds", blocks.fundraising.rounds],
      ["roi.icoPrice", blocks.roi.icoPrice],
      ["roi.currentRoiFromIco", blocks.roi.currentRoiFromIco],
      ["tokenomics.totalSupply", blocks.tokenomics.totalSupply],
      ["unlocks.events", blocks.unlocks.events],
      ["backers.topInvestors", blocks.backers.topInvestors],
      ["comparisonPeers", blocks.comparisonPeers],
    ];

    for (const [field, value] of checks) {
      if (value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length)) {
        missingFields.push(field);
      }
    }

    const lastUpdate = this.latestDate(
      project.lastParsedAt,
      project.updatedAt,
      intel?.sourceRefs?.icodrops?.lastSyncedAt,
      intel?.sourceRefs?.dropstab?.lastSyncedAt,
      unlocks?.sourceRefs?.dropstab?.lastSyncedAt,
      unlocks?.updatedAt,
    );
    if (lastUpdate && Date.now() - new Date(lastUpdate).getTime() > 30 * 24 * 60 * 60 * 1000) {
      staleFields.push("updatedAt");
    }
    const present = checks.length - missingFields.length;
    const confidence = Math.max(
      0,
      Math.min(
        100,
        Math.round((present / checks.length) * 70 + (sources.includes("dropstab") ? 15 : 0) + (sources.includes("icodrops") ? 15 : 0)),
      ),
    );

    return {
      sources,
      missingFields,
      staleFields,
      confidence,
      updatedAt: lastUpdate,
      safeguards: {
        batchedPeerLoading: true,
        boundedFundingRoundReads: true,
        symbolFallbackRequiresUniqueSymbol: true,
        syntheticRoiValues: false,
        rawProviderPayloadExposed: false,
      },
    };
  }

  private normalizeRounds(values: any[]): any[] {
    const rounds = values
      .map((round) => this.normalizeRound(round))
      .filter(Boolean);
    return this.uniqueObjects(rounds, (round) => `${round.name || ""}|${round.date || ""}|${round.amount || ""}`);
  }

  private normalizeRound(round: any): any {
    if (!round || typeof round !== "object") return null;

    const raw = round.raw || {};
    const infoBlocks = raw.infoBlocks || {};
    const date = this.toIso(
      round.date ||
      round.startDate ||
      round.endDate ||
      round.rawDate ||
      round.date?.date?.normalized ||
      round.date?.raw,
    );
    const amount = this.firstPositiveNumber(
      round.amount,
      round.raised,
      round.raise,
      round.fundsRaised,
      infoBlocks.Raised?.money,
      infoBlocks.Raised?.text,
    );
    const valuation = this.firstPositiveNumber(
      round.valuation,
      round.preValuation,
      infoBlocks["Pre-Valuation"]?.money,
      infoBlocks["Pre-Valuation"]?.text,
    );
    const investors = this.normalizeInvestors([
      ...(round.investors || []),
      ...(round.leadInvestors || []).map((investor: any) => ({ ...investor, isLead: true })),
    ]);

    return {
      name: this.firstString(round.name, round.roundName, round.stage, round.type),
      date,
      amount,
      amountRaw: this.firstString(round.amountRaw, round.amountFormatted, round.raise, round.raised, round.fundsRaised),
      valuation,
      valuationRaw: this.firstString(round.valuationRaw, round.valuationFormatted, round.preValuation, round.valuation),
      price: this.firstPositiveNumber(round.price, round.tokenPrice, infoBlocks.Price?.money, infoBlocks.Price?.text),
      investors,
    };
  }

  private selectEntryRound(rounds: any[]): any | null {
    const pricedRounds = (Array.isArray(rounds) ? rounds : [])
      .filter((round) => this.firstPositiveNumber(round?.price) !== null)
      .map((round, index) => ({
        ...round,
        originalOrder: index,
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

  private normalizeInvestors(values: any[]): any[] {
    return this.uniqueObjects(
      (Array.isArray(values) ? values : [])
        .map((investor, index) => {
          if (typeof investor === "string") {
            return { name: investor };
          }

          const name = this.firstString(investor?.name, investor?.title, investor?.investorName);
          if (!name) return null;

          return {
            ...investor,
            name,
            slug: this.firstString(investor?.slug, investor?.investorSlug) || normalizeSlug(name),
            logo: this.firstString(investor?.logo, investor?.img, investor?.image),
            isLead: Boolean(investor?.isLead || investor?.lead),
            order: index,
          };
        })
        .filter(Boolean),
      (investor) => `${investor.slug || ""}|${investor.name || ""}`,
    );
  }

  private resolveTokenAllocation(project: ProjectLike, intel: ProjectLike | null, unlocks: ProjectLike | null): any[] {
    const allocation =
      (Array.isArray(unlocks?.tokenAllocation) && unlocks.tokenAllocation.length && unlocks.tokenAllocation) ||
      (Array.isArray(project.totalAllocation) && project.totalAllocation.length && project.totalAllocation) ||
      (Array.isArray(intel?.tokenomics?.tokenAllocation) && intel.tokenomics.tokenAllocation.length && intel.tokenomics.tokenAllocation) ||
      (Array.isArray(project.tokenomics?.allocation) && project.tokenomics.allocation) ||
      (Array.isArray(project.rawIcoData?.tokenomics?.allocation) && project.rawIcoData.tokenomics.allocation) ||
      [];

    return allocation.map((item: any) => ({
      name: this.firstString(item?.name, item?.roundName, item?.stage, item?.label),
      value: this.firstNumber(item?.value, item?.percent, item?.allocationPercent, item?.tokensAllocatedPercent),
      allocated: this.firstNumber(item?.allocated, item?.amount, item?.totalAmount, item?.tokensAllocatedAmount),
      source: this.firstString(item?.source),
    })).filter((item) => item.name || item.value || item.allocated);
  }

  private allocationPercent(allocation: any[], terms: string[]): number | null {
    const total = allocation.reduce((sum, item) => {
      const name = String(item.name || "").toLowerCase();
      if (!terms.some((term) => name.includes(term))) return sum;
      const value = this.toNumber(item.value);
      return value === null ? sum : sum + value;
    }, 0);

    return total > 0 ? total : null;
  }

  private peerCategoryKeys(project: ProjectLike): string[] {
    return this.uniqueStrings([
      ...(project.categories || []),
      ...(project.tags || []),
      ...(project.rawIcoData?.categories || []),
      project.mainCategory?.name,
      project.mainCategory?.slug,
      project.type,
    ]);
  }

  private peerScore(project: ProjectLike, candidate: ProjectLike): number {
    const projectCategories = new Set(this.peerCategoryKeys(project).map((item) => item.toLowerCase()));
    const candidateCategories = this.peerCategoryKeys(candidate).map((item) => item.toLowerCase());
    const sharedCategories = candidateCategories.filter((item) => projectCategories.has(item)).length;
    const projectChains = new Set(this.uniqueStrings(project.ecosystems || []).map((item) => item.toLowerCase()));
    const sharedChains = this.uniqueStrings(candidate.ecosystems || []).filter((item) => projectChains.has(item.toLowerCase())).length;
    const projectRaised = this.toNumber(project.fundsRaised ?? project.totalRaised);
    const candidateRaised = this.toNumber(candidate.fundsRaised ?? candidate.totalRaised);
    const raisedScore = projectRaised && candidateRaised
      ? Math.max(0, 20 - Math.abs(Math.log10(projectRaised) - Math.log10(candidateRaised)) * 10)
      : 0;
    const metricScore = this.comparisonSimilarityScore(project, candidate).total;

    return sharedCategories * 20 + sharedChains * 10 + raisedScore + metricScore + (this.toNumber(candidate.fomoScore) || 0) / 10;
  }

  private rankComparisonPeers(target: ProjectLike, peers: ProjectLike[], limit: number): ProjectLike[] {
    if (limit <= 0) return [];

    const scoredPeers = (peers || [])
      .filter((peer) => this.hasComparisonRoi(peer))
      .map((peer) => ({
        peer,
        similarity: this.comparisonSimilarityScore(target, peer),
      }))
      .filter(({ similarity }) => similarity.metricsCompared > 0);
    const strictPeers = scoredPeers
      .filter(({ similarity }) => similarity.isEligible)
      .sort((left, right) => this.compareSimilarity(left.similarity, right.similarity));
    const fallbackPeers = scoredPeers
      .filter(({ similarity }) => !similarity.isEligible)
      .filter(({ similarity }) =>
        similarity.averageDistance !== null &&
        similarity.averageDistance <= COMPARISON_FALLBACK_MAX_AVERAGE_LOG_DISTANCE,
      )
      .sort((left, right) => this.compareSimilarity(left.similarity, right.similarity));
    const seen = new Set<string>();

    return [...strictPeers, ...fallbackPeers]
      .filter(({ peer }) => {
        const key = String(peer.id || peer._id || peer.slug || peer.name || "");
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(({ peer }) => peer)
      .slice(0, limit);
  }

  private compareSimilarity(
    left: ComparisonSimilarityScore,
    right: ComparisonSimilarityScore,
  ): number {
    if (right.total !== left.total) return right.total - left.total;

    const leftDistance = left.averageDistance ?? Number.POSITIVE_INFINITY;
    const rightDistance = right.averageDistance ?? Number.POSITIVE_INFINITY;
    if (leftDistance !== rightDistance) return leftDistance - rightDistance;

    return right.metricsCompared - left.metricsCompared;
  }

  private comparisonSimilarityScore(target: ProjectLike, candidate: ProjectLike): ComparisonSimilarityScore {
    const metricScores = this.comparisonMetricScores(target, candidate);
    const availableTargetMetrics = this.comparisonMetricDefinitions(target)
      .filter((metric) => metric.value !== null);
    const requiredMetricCount = Math.min(
      COMPARISON_MIN_METRICS_TO_COMPARE,
      availableTargetMetrics.length,
    );

    if (!availableTargetMetrics.length || !metricScores.length || metricScores.length < requiredMetricCount) {
      return {
        total: 0,
        metricsCompared: metricScores.length,
        averageDistance: null,
        isEligible: false,
      };
    }

    const totalWeight = metricScores.reduce((sum, metric) => sum + metric.weight, 0);
    const averageDistance = metricScores.reduce(
      (sum, metric) => sum + metric.distance * metric.weight,
      0,
    ) / totalWeight;
    const missingMetricPenalty = Math.max(0, availableTargetMetrics.length - metricScores.length) * 8;
    const contextScore = this.comparisonContextScore(target, candidate);
    const total = Math.max(
      0,
      metricScores.reduce((sum, metric) => sum + metric.score, 0) +
        contextScore -
        missingMetricPenalty,
    );

    return {
      total,
      metricsCompared: metricScores.length,
      averageDistance,
      isEligible: averageDistance <= COMPARISON_MAX_AVERAGE_LOG_DISTANCE,
    };
  }

  private comparisonMetricScores(target: ProjectLike, candidate: ProjectLike): ComparisonMetricScore[] {
    return this.comparisonMetricDefinitions(target)
      .map((targetMetric) => {
        const candidateMetric = this.comparisonMetricDefinitions(candidate)
          .find((metric) => metric.key === targetMetric.key);

        if (targetMetric.value === null || candidateMetric?.value === null || candidateMetric?.value === undefined) {
          return null;
        }

        const distance = Math.abs(Math.log10(targetMetric.value) - Math.log10(candidateMetric.value));
        const score = Math.max(0, targetMetric.weight * (1 - distance / targetMetric.maxDistance));

        return {
          key: targetMetric.key,
          target: targetMetric.value,
          candidate: candidateMetric.value,
          distance,
          score,
          weight: targetMetric.weight,
        };
      })
      .filter(Boolean) as ComparisonMetricScore[];
  }

  private comparisonMetricDefinitions(project: ProjectLike): Array<{
    key: "marketCap" | "fdv" | "raised";
    value: number | null;
    weight: number;
    maxDistance: number;
  }> {
    return [
      {
        key: "marketCap",
        value: this.marketCapValue(project),
        weight: 36,
        maxDistance: 1.25,
      },
      {
        key: "fdv",
        value: this.fdvValue(project),
        weight: 32,
        maxDistance: 1.25,
      },
      {
        key: "raised",
        value: this.raisedValue(project),
        weight: 32,
        maxDistance: 1,
      },
    ];
  }

  private comparisonContextScore(target: ProjectLike, candidate: ProjectLike): number {
    const targetCategories = new Set(this.peerCategoryKeys(target).map((item) => item.toLowerCase()));
    const candidateCategories = this.peerCategoryKeys(candidate).map((item) => item.toLowerCase());
    const sharedCategories = candidateCategories.filter((item) => targetCategories.has(item)).length;
    const targetChains = new Set(this.uniqueStrings(target.chains || target.ecosystems || []).map((item) => item.toLowerCase()));
    const sharedChains = this.uniqueStrings(candidate.chains || candidate.ecosystems || [])
      .filter((item) => targetChains.has(item.toLowerCase())).length;

    return Math.min(sharedCategories, 3) * 4 + Math.min(sharedChains, 2) * 3;
  }

  private hasComparisonRoi(project: ProjectLike): boolean {
    return this.firstNumber(
      project.roiX,
      project.currentRoiXFromIco,
      project.roiPercent,
      project.currentRoiFromIco,
    ) !== null;
  }

  private marketCapValue(project: ProjectLike): number | null {
    return this.firstPositiveNumber(
      project.marketCap,
      project.currentValue,
      project.market?.marketCap,
      project.usdQuote?.market_cap,
      project.rawIcoData?.marketData?.marketCap,
    );
  }

  private fdvValue(project: ProjectLike): number | null {
    return this.firstPositiveNumber(
      project.fdv,
      project.fullyDilutedMarketCap,
      project.market?.fdv,
      project.rawIcoData?.marketData?.fdv,
      project.rawIcoData?.marketData?.fullyDilutedMarketCap,
      project.tokenomics?.fdv,
    );
  }

  private raisedValue(project: ProjectLike): number | null {
    return this.firstPositiveNumber(
      project.fundraisingTotal,
      project.totalRaised,
      project.fundsRaised,
      project.investedAmount,
      project.fundraising?.totalRaised,
      project.rawIcoData?.fundraising?.totalRaised,
    );
  }

  private comparisonCandidateLimit(peerLimit: number): number {
    if (peerLimit <= 0) return 0;

    return Math.min(
      Math.max(peerLimit * COMPARISON_CANDIDATE_MULTIPLIER, peerLimit),
      MAX_COMPARISON_PEER_CANDIDATES,
    );
  }

  private limitPeerSummaryCandidates(candidates: ProjectLike[], peerLimit: number): ProjectLike[] {
    if (peerLimit <= 0 || !candidates.length) return [];

    const summaryLimit = Math.min(
      candidates.length,
      Math.max(peerLimit * 3, peerLimit),
    );

    return candidates.slice(0, summaryLimit);
  }

  private dedupeProjects(
    projects: ProjectLike[],
    currentProject: ProjectLike,
    excludedProjects: ProjectLike[] = [],
  ): ProjectLike[] {
    const seen = new Set<string>([
      String(currentProject._id || ""),
      ...this.projectIdentityKeys(currentProject),
      ...excludedProjects.flatMap((project) => [
        String(project?._id || ""),
        ...this.projectIdentityKeys(project),
      ]),
    ].filter(Boolean));
    const result: ProjectLike[] = [];

    for (const project of projects) {
      const keys = [
        String(project?._id || ""),
        ...this.projectIdentityKeys(project),
      ].filter(Boolean);
      if (!keys.length || keys.some((key) => seen.has(key))) continue;

      keys.forEach((key) => seen.add(key));
      result.push(project);
    }

    return result;
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

  private parseProjectKeys(value: any): string[] {
    const raw = Array.isArray(value) ? value : String(value || "").split(",");

    return this.uniqueStrings(raw.map((item: any) => String(item || "").trim()));
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private hasSearchMetric(project: ProjectLike, metric: string): boolean {
    const normalizedMetric = String(metric || "").trim().toLowerCase();

    if (!normalizedMetric || normalizedMetric === "all") return true;
    if (["roi", "roi multiplier", "roi multipliers"].includes(normalizedMetric)) {
      return this.firstNumber(
        project.roiX,
        project.currentRoiXFromIco,
        project.roiPercent,
        project.currentRoiFromIco,
      ) !== null;
    }
    if (["m.cap", "mcap", "marketcap", "market cap", "market-cap"].includes(normalizedMetric)) {
      return this.toNumber(project.marketCap) !== null;
    }
    if (["fdv", "fully diluted valuation", "fullydilutedmarketcap"].includes(normalizedMetric)) {
      return this.toNumber(project.fdv) !== null;
    }
    if (["raised", "investment", "invested", "fundraising"].includes(normalizedMetric)) {
      return this.firstNumber(project.investedAmount, project.fundraisingTotal) !== null;
    }

    return true;
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
          this.logger.debug(`comparison prewarm skipped ${key}: ${error?.message || error}`);
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

    if (typeof value === "object") {
      return this.valueByCurrency(value);
    }

    const normalized = String(value)
      .replace(/,/g, "")
      .replace(/\s+/g, " ")
      .trim();
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

  private uniqueObjects<T>(values: T[], keyFn: (item: any) => string): T[] {
    const seen = new Set<string>();
    const result: T[] = [];

    for (const value of values || []) {
      const key = keyFn(value);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(value);
    }

    return result;
  }

  private sumNumbers(values: any[]): number | null {
    const sum = values.reduce((total, value) => {
      const number = this.toNumber(value);
      return number === null ? total : total + number;
    }, 0);

    return sum > 0 ? sum : null;
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

  private roiMultiplier(current: any, base: any): number | null {
    const currentNumber = this.toNumber(current);
    const baseNumber = this.toNumber(base);
    if (currentNumber === null || baseNumber === null || baseNumber <= 0) return null;
    const result = currentNumber / baseNumber;
    return Number.isFinite(result) && result > 0 ? result : null;
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

  private roiMultiplierFromPercent(percent: any): number | null {
    const value = this.toNumber(percent);
    if (value === null) return null;
    const result = 1 + value / 100;
    return Number.isFinite(result) && result > 0 ? result : null;
  }

  private sanitizeNumber(value: number): number | null {
    if (!Number.isFinite(value)) return null;

    const rounded = Math.round((value + Number.EPSILON) * 1e10) / 1e10;
    return Object.is(rounded, -0) ? 0 : rounded;
  }

  private firstScreenshot(project: ProjectLike): string | null {
    return this.firstString(
      project.screenshotUrl,
      project.screenshot,
      project.descriptionImages?.[0],
      project.rawIcoData?.screenshots?.[0]?.url,
      project.rawIcoData?.screenshots?.[0]?.src,
      project.rawIcoData?.screenshots?.[0],
    );
  }

  private toIso(value: any): string | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : null;
  }

  private dateTime(value: any): number {
    const iso = this.toIso(value);
    return iso ? new Date(iso).getTime() : 0;
  }

  private latestDate(...values: any[]): string | null {
    const times = values
      .map((value) => this.dateTime(value))
      .filter((value) => value > 0);

    return times.length ? new Date(Math.max(...times)).toISOString() : null;
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
