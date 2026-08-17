import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import { Model, Types } from "mongoose";
import { FomoV2IcoProjectReadModel } from "../../ico";
import {
  FomoV2MarketProjectChartReadService,
  FomoV2MarketProjectReadModel,
} from "../../market";
import { FomoV2EntityReactionService } from "../../reactions";
import { FomoV2EntityFlagService } from "../../flags";
import { FomoV2CanonicalProject } from "../../../models";
import {
  FomoV2FundingRound,
  FomoV2FundingRoundParticipant,
} from "../../funding";
import {
  FomoV2Backer,
  FomoV2BackerAnalyticsSnapshot,
  FomoV2BackerAnalyticsSnapshotDocument,
  FomoV2BackerListReadModel,
  FomoV2BackerPortfolioHolding,
  FomoV2BackerReadModel,
} from "../models";
import { FomoV2BackerType } from "../types";

export type BackerListQuery = Record<string, any>;
export type BackerProjectsQuery = Record<string, any>;

type BackerListOptions = {
  defaultLimit?: number;
  maxLimit?: number;
  includeHidden?: boolean;
};

type SortOrder = 1 | -1;

type AnalyticsChartItem = {
  label: string;
  value: number;
  projectsCount?: number;
  topProjects?: Array<Record<string, any>> | string;
  dealsCount?: number;
  backersCount?: number;
  topRoles?: string;
  keyRegions?: string;
  sectors?: string;
  growth?: string;
};

type AnalyticsProjectInfo = {
  canonicalProjectId: string;
  name: string;
  slug: string;
  logo: string;
  category: string;
};

type AnalyticsParticipantRow = {
  backer: any;
  participant: any;
  round: any;
  project: AnalyticsProjectInfo;
  date: Date;
  amount: number;
  category: string;
};

type FundPerformanceTab = "30D" | "90D" | "6M" | "YTD" | "All Time";

type FundRoiCandidate = {
  round: any;
  holding: any;
  marketProject?: any;
  participant?: any;
  roundId: string;
  projectKey: string;
  marketAssetId: Types.ObjectId;
  marketAssetKey: string;
  projectName: string;
  projectSlug: string;
  projectSymbol: string;
  projectLogo: string;
  category: string;
  roundName: string;
  roundDate: Date;
  tokenPrice: number;
  currentPrice: number;
  currentRoi: number;
};

type FundVolatilityCandidate = {
  holding: any;
  marketProject?: any;
  rounds: any[];
  marketAssetId: Types.ObjectId;
  marketAssetKey: string;
  projectKey: string;
  projectName: string;
  projectSlug: string;
  projectSymbol: string;
  projectLogo: string;
  category: string;
  investedRound: string;
  roundDate?: Date;
};

type FundVolatilitySortField =
  | "name"
  | "investedRound"
  | "volatility"
  | "status";

type FundMarketFootprintTab = "30D" | "90D" | "6M" | "YTD" | "All Time";

type FundComparisonTab = "30D" | "90D" | "6M" | "YTD" | "All Time";
type FundComparisonSection =
  | "all"
  | "table"
  | "roiTrend"
  | "riskScatter"
  | "bestWorst"
  | "entryAgeRoi";
type FundComparisonSearchScope = "roiTrend" | "riskScatter";

type FundComparisonContextOptions = {
  includePriceSeries?: boolean;
  priceRange?: "30D" | "90D" | "6M" | "1Y" | "ALL";
};

type FundComparisonMetricOptions = {
  requirePriceSeriesForRoi?: boolean;
  includeVolatility?: boolean;
};

type FundMarketFootprintRound = {
  id: string;
  name: string;
  date?: Date;
  raisedAmount: number;
};

type FundMarketFootprintProject = {
  id: string;
  name: string;
  slug: string;
  symbol: string;
  logo: string;
  category: string;
  marketValue: number;
  marketValueType: "marketCap" | "fdv" | "";
  marketCap: number;
  fdv: number;
  totalRaised: number;
  rounds: FundMarketFootprintRound[];
};

const RANGE_SEPARATOR = "-";
const UNKNOWN_ANALYTICS_LABEL = "Unknown";
const OTHER_ANALYTICS_LABEL = "Other";
const UNCATEGORIZED_ANALYTICS_LABEL = "Uncategorized";
const ANALYTICS_EXCLUDED_STATUSES = ["conflict", "superseded", "deprecated"];
const ANALYTICS_EXCLUDED_ROLE_KEYS = new Set([
  "unknown",
  "n_a",
  "na",
  "none",
  "null",
  "undefined",
  "person",
  "fund",
  "vc",
  "venture_capital",
  "ventures_capital",
  "angel_group",
  "accelerator",
  "incubator",
  "funding",
  "intel_fundraising",
  "source_funding",
  "seed",
  "pre_seed",
  "preseed",
  "series",
  "series_a",
  "series_b",
  "series_c",
  "series_d",
  "series_e",
  "private",
  "private_sale",
  "public",
  "public_sale",
  "strategic",
  "strategic_round",
  "grant",
  "ico",
  "ido",
  "ieo",
  "pre_sale",
  "presale",
]);
const PERSON_CATEGORY_FILTER_EXCLUDED_KEYS = new Set([
  "angel_investor",
  "funding",
  "intel_fundraising",
  "source_funding",
  "pre_seed",
  "preseed",
  "seed",
  "series",
  "series_a",
  "series_b",
  "series_c",
  "series_d",
  "series_e",
  "private",
  "private_sale",
  "strategic",
  "strategic_round",
  "public",
  "public_sale",
  "grant",
  "ico",
  "ido",
  "ieo",
  "pre_sale",
  "presale",
  "token_sale",
  "fund",
  "person",
]);
const BACKER_ANALYTICS_SNAPSHOT_SCOPE = "global";
const BACKER_ANALYTICS_SNAPSHOT_VERSION = "backers-analytics-charts-v1";
const BACKER_ANALYTICS_SNAPSHOT_TTL_MS = 24 * 60 * 60 * 1000;
const BACKER_ANALYTICS_SNAPSHOT_CRON =
  process.env.FOMO_V2_BACKERS_ANALYTICS_SNAPSHOT_CRON || "0 35 2 * * *";
const BACKER_ANALYTICS_SNAPSHOT_IGNORED_QUERY_KEYS = new Set([
  "page",
  "limit",
  "offset",
  "sort",
  "sortBy",
  "sortOrder",
  "quickFilter",
  "tab",
]);
const GLOBAL_MAP_COUNTRY_ALIASES: Record<
  string,
  { country: string; countryCode: string }
> = {
  usa: { country: "United States of America", countryCode: "USA" },
  us: { country: "United States of America", countryCode: "USA" },
  united_states: { country: "United States of America", countryCode: "USA" },
  united_states_of_america: {
    country: "United States of America",
    countryCode: "USA",
  },
  singapore: { country: "Singapore", countryCode: "SGP" },
  sgp: { country: "Singapore", countryCode: "SGP" },
  united_kingdom: { country: "United Kingdom", countryCode: "GBR" },
  uk: { country: "United Kingdom", countryCode: "GBR" },
  gbr: { country: "United Kingdom", countryCode: "GBR" },
  great_britain: { country: "United Kingdom", countryCode: "GBR" },
  china: { country: "China", countryCode: "CHN" },
  chn: { country: "China", countryCode: "CHN" },
  hong_kong: { country: "China", countryCode: "CHN" },
  hkg: { country: "China", countryCode: "CHN" },
  south_korea: { country: "South Korea", countryCode: "KOR" },
  korea_republic_of: { country: "South Korea", countryCode: "KOR" },
  republic_of_korea: { country: "South Korea", countryCode: "KOR" },
  switzerland: { country: "Switzerland", countryCode: "CHE" },
  germany: { country: "Germany", countryCode: "DEU" },
  canada: { country: "Canada", countryCode: "CAN" },
  japan: { country: "Japan", countryCode: "JPN" },
  united_arab_emirates: { country: "United Arab Emirates", countryCode: "ARE" },
  uae: { country: "United Arab Emirates", countryCode: "ARE" },
  india: { country: "India", countryCode: "IND" },
  israel: { country: "Israel", countryCode: "ISR" },
  cayman_islands: { country: "United Kingdom", countryCode: "GBR" },
  thailand: { country: "Thailand", countryCode: "THA" },
  netherlands: { country: "Netherlands", countryCode: "NLD" },
  spain: { country: "Spain", countryCode: "ESP" },
  sweden: { country: "Sweden", countryCode: "SWE" },
  france: { country: "France", countryCode: "FRA" },
  brazil: { country: "Brazil", countryCode: "BRA" },
  portugal: { country: "Portugal", countryCode: "PRT" },
  seychelles: { country: "Seychelles", countryCode: "SYC" },
  austria: { country: "Austria", countryCode: "AUT" },
  malaysia: { country: "Malaysia", countryCode: "MYS" },
  turkiye: { country: "Turkey", countryCode: "TUR" },
  t_rkiye: { country: "Turkey", countryCode: "TUR" },
  turkey: { country: "Turkey", countryCode: "TUR" },
  ukraine: { country: "Ukraine", countryCode: "UKR" },
  belgium: { country: "Belgium", countryCode: "BEL" },
  czechia: { country: "Czechia", countryCode: "CZE" },
  czech_republic: { country: "Czechia", countryCode: "CZE" },
  bahamas_the: { country: "Bahamas", countryCode: "BHS" },
  bahamas: { country: "Bahamas", countryCode: "BHS" },
  gibraltar: { country: "United Kingdom", countryCode: "GBR" },
  virgin_islands_british: { country: "United Kingdom", countryCode: "GBR" },
  british_virgin_islands: { country: "United Kingdom", countryCode: "GBR" },
  isle_of_man: { country: "United Kingdom", countryCode: "GBR" },
};
const FUND_ROI_PERFORMANCE_TABS: FundPerformanceTab[] = [
  "30D",
  "90D",
  "6M",
  "YTD",
  "All Time",
];
const FUND_COMPARISON_TABS: FundComparisonTab[] = [
  "30D",
  "90D",
  "6M",
  "YTD",
  "All Time",
];
const FUND_COMPARISON_LINE_COLORS = [
  "#4F85BD",
  "#EB609C",
  "#D87D9B",
  "#23A094",
  "#8B6EDB",
  "#F5A623",
];
const FUND_COMPARISON_DEFAULT_PEER_LIMIT = 5;
const FUND_COMPARISON_ROI_TREND_DEFAULT_PEER_LIMIT = 2;
const FUND_COMPARISON_MAX_PEER_LIMIT = 8;
const FUND_COMPARISON_MAX_SELECTED_PEERS = 5;
const FUND_ROI_LINE_COLORS = [
  "#4F85BD",
  "#EB609C",
  "#D87D9B",
  "#23A094",
  "#8B6EDB",
];
const FUND_ROI_MAX_SELECTED_PROJECTS = 5;
const FUND_VOLATILITY_DEFAULT_LIMIT = 10;
const FUND_VOLATILITY_MIN_RETURNS = 7;
const FUND_COMPARISON_MIN_VOLATILITY_ASSETS = 3;
const FUND_COMPARISON_MIN_DISPLAYABLE_LOSS_ROI = 0.005;
const FUND_VOLATILITY_RISK_THRESHOLDS = {
  medium: 60,
  high: 120,
};
const FUND_MARKET_FOOTPRINT_TABS: FundMarketFootprintTab[] = [
  "30D",
  "90D",
  "6M",
  "YTD",
  "All Time",
];

@Injectable()
export class FomoV2BackerReadService {
  private readonly logger = new Logger(FomoV2BackerReadService.name);
  private analyticsSnapshotRefreshInProgress = false;

  constructor(
    @InjectModel(FomoV2BackerListReadModel.name)
    private readonly listReadModel: Model<FomoV2BackerListReadModel>,
    @InjectModel(FomoV2BackerReadModel.name)
    private readonly profileReadModel: Model<FomoV2BackerReadModel>,
    @InjectModel(FomoV2Backer.name)
    private readonly backerModel: Model<FomoV2Backer>,
    @InjectModel(FomoV2BackerPortfolioHolding.name)
    private readonly holdingModel: Model<FomoV2BackerPortfolioHolding>,
    @InjectModel(FomoV2FundingRound.name)
    private readonly fundingRoundModel: Model<FomoV2FundingRound>,
    @InjectModel(FomoV2FundingRoundParticipant.name)
    private readonly participantModel: Model<FomoV2FundingRoundParticipant>,
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly marketProjectReadModel: Model<FomoV2MarketProjectReadModel>,
    private readonly marketChartReadService: FomoV2MarketProjectChartReadService,
    @InjectModel(FomoV2IcoProjectReadModel.name)
    private readonly icoProjectReadModel: Model<FomoV2IcoProjectReadModel>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>,
    @InjectModel(FomoV2BackerAnalyticsSnapshot.name)
    private readonly analyticsSnapshotModel: Model<FomoV2BackerAnalyticsSnapshotDocument>,
    private readonly reactionService: FomoV2EntityReactionService,
    private readonly flagService: FomoV2EntityFlagService
  ) {}

  listFunds(query: BackerListQuery = {}) {
    return this.list("fund", query);
  }

  listPersons(query: BackerListQuery = {}) {
    return this.list("person", query);
  }

  listAdminFunds(query: BackerListQuery = {}) {
    return this.list("fund", query, { defaultLimit: 500, maxLimit: 5000 });
  }

  listAdminPersons(query: BackerListQuery = {}) {
    return this.list("person", query, { defaultLimit: 500, maxLimit: 5000 });
  }

  getFundsFilters(query: BackerListQuery = {}) {
    return this.getFilterOptions("fund", query);
  }

  getPersonsFilterOptions(query: BackerListQuery = {}) {
    return this.getFilterOptions("person", query).then((result) => ({
      sectors: result.industryFocus
        .map((item) => item.label)
        .filter((label) => this.isPersonCategoryFilterLabel(label)),
      specializations: result.fundTypes
        .map((item) => item.label)
        .filter((label) => this.isPersonCategoryFilterLabel(label)),
    }));
  }

  async getFundsAnalytics(query: BackerListQuery = {}) {
    if (this.isDefaultAnalyticsSnapshotQuery(query)) {
      return this.getAnalyticsSnapshotOrBuild("fund");
    }

    return this.computeFundsAnalytics(query);
  }

  async getFundsGlobalInvestmentMap(query: BackerListQuery = {}) {
    if (this.isDefaultAnalyticsSnapshotQuery(query)) {
      const analytics = await this.getFundsAnalytics({});
      const globalInvestmentMap =
        (analytics as any)?.globalInvestmentMap ||
        this.buildGlobalInvestmentMap([], []);

      return {
        ok: true,
        isSuccess: true,
        ...globalInvestmentMap,
      };
    }

    const match = this.buildMatch("fund", query, {
      ignorePaginationAndSort: true,
    });
    const analyticsBackers = await this.loadAnalyticsBackers(match);
    const participantRows = await this.loadAnalyticsParticipantRows(
      analyticsBackers
    );

    return {
      ok: true,
      isSuccess: true,
      ...this.buildGlobalInvestmentMap(analyticsBackers, participantRows),
    };
  }

  private computeFundsAnalytics(query: BackerListQuery = {}) {
    return this.analytics("fund", query);
  }

  @Cron(BACKER_ANALYTICS_SNAPSHOT_CRON, {
    name: "fomo-v2-backer-analytics-snapshots",
  })
  async handleAnalyticsSnapshotCron(): Promise<void> {
    if (!this.isAnalyticsSnapshotCronEnabled()) return;

    try {
      await this.refreshAnalyticsSnapshots("cron");
    } catch (error) {
      this.logger.error(
        `FOMO V2 backer analytics snapshot cron failed: ${this.errorMessage(
          error
        )}`,
        error instanceof Error ? error.stack : undefined
      );
    }
  }

  async refreshAnalyticsSnapshots(
    trigger = "manual",
    assertExecutionActive?: () => void | Promise<void>
  ) {
    await assertExecutionActive?.();
    if (this.analyticsSnapshotRefreshInProgress) {
      return {
        skipped: true,
        reason: "FOMO V2 backer analytics snapshot refresh is already running.",
      };
    }

    this.analyticsSnapshotRefreshInProgress = true;

    try {
      const funds = await this.rebuildAnalyticsSnapshot(
        "fund",
        trigger,
        assertExecutionActive
      );
      await assertExecutionActive?.();
      const persons = await this.rebuildAnalyticsSnapshot(
        "person",
        trigger,
        assertExecutionActive
      );
      await assertExecutionActive?.();

      return {
        skipped: false,
        trigger,
        snapshots: [
          this.serializeAnalyticsSnapshotRefreshResult(funds),
          this.serializeAnalyticsSnapshotRefreshResult(persons),
        ],
      };
    } finally {
      this.analyticsSnapshotRefreshInProgress = false;
    }
  }

  private async getAnalyticsSnapshotOrBuild(backerType: FomoV2BackerType) {
    const snapshot = await this.analyticsSnapshotModel
      .findOne({
        snapshotKey: this.analyticsSnapshotKey(backerType),
        version: BACKER_ANALYTICS_SNAPSHOT_VERSION,
      })
      .lean()
      .exec();

    if (this.hasSnapshotData(snapshot?.data)) {
      return snapshot.data;
    }

    const rebuilt = await this.rebuildAnalyticsSnapshot(
      backerType,
      "cache-miss"
    );
    return rebuilt.data;
  }

  private async rebuildAnalyticsSnapshot(
    backerType: FomoV2BackerType,
    trigger: string,
    assertExecutionActive?: () => void | Promise<void>
  ) {
    const startedAt = new Date();
    const snapshotKey = this.analyticsSnapshotKey(backerType);

    await assertExecutionActive?.();
    await this.analyticsSnapshotModel
      .updateOne(
        { snapshotKey },
        {
          $set: {
            snapshotKey,
            backerType,
            scope: BACKER_ANALYTICS_SNAPSHOT_SCOPE,
            version: BACKER_ANALYTICS_SNAPSHOT_VERSION,
            status: "building",
            startedAt,
            trigger,
            error: null,
          },
          $setOnInsert: {
            data: {},
            meta: {},
          },
        },
        { upsert: true }
      )
      .exec();
    await assertExecutionActive?.();

    try {
      const data =
        backerType === "fund"
          ? await this.computeFundsAnalytics({})
          : await this.computePersonsAnalytics({});
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();
      const expiresAt = new Date(
        completedAt.getTime() + BACKER_ANALYTICS_SNAPSHOT_TTL_MS
      );
      const meta = this.buildAnalyticsSnapshotMeta(backerType, data);

      await assertExecutionActive?.();
      await this.analyticsSnapshotModel
        .updateOne(
          { snapshotKey },
          {
            $set: {
              snapshotKey,
              backerType,
              scope: BACKER_ANALYTICS_SNAPSHOT_SCOPE,
              version: BACKER_ANALYTICS_SNAPSHOT_VERSION,
              status: "ready",
              generatedAt: completedAt,
              startedAt,
              completedAt,
              expiresAt,
              durationMs,
              trigger,
              error: null,
              data,
              meta,
            },
          },
          { upsert: true }
        )
        .exec();
      await assertExecutionActive?.();

      this.logger.log(
        `FOMO V2 ${backerType} analytics snapshot refreshed in ${durationMs}ms (${trigger}).`
      );

      return {
        snapshotKey,
        backerType,
        generatedAt: completedAt,
        expiresAt,
        durationMs,
        meta,
        data,
      };
    } catch (error) {
      await assertExecutionActive?.();
      await this.analyticsSnapshotModel
        .updateOne(
          { snapshotKey },
          {
            $set: {
              status: "failed",
              completedAt: new Date(),
              durationMs: Date.now() - startedAt.getTime(),
              trigger,
              error: this.errorMessage(error),
            },
          },
          { upsert: true }
        )
        .exec();
      await assertExecutionActive?.();

      throw error;
    }
  }

  private serializeAnalyticsSnapshotRefreshResult(result: Record<string, any>) {
    return {
      snapshotKey: result.snapshotKey,
      backerType: result.backerType,
      generatedAt: result.generatedAt,
      expiresAt: result.expiresAt,
      durationMs: result.durationMs,
      meta: result.meta,
    };
  }

  private buildAnalyticsSnapshotMeta(
    backerType: FomoV2BackerType,
    data: Record<string, any>
  ) {
    const countryRows =
      backerType === "person" ? data.personsByCountry : data.backersByCountry;
    const mapCountries = data.globalInvestmentMap?.countries;

    return {
      summary: data.summary || {},
      topSectorsCount: Array.isArray(data.topSectors)
        ? data.topSectors.length
        : 0,
      fundingDynamicsPoints: this.countAnalyticsSnapshotPoints(
        data.fundingDynamics
      ),
      topSectorsByPeriodPoints: this.countAnalyticsSnapshotPoints(
        data.topSectorsByPeriod
      ),
      countriesCount: Array.isArray(countryRows) ? countryRows.length : 0,
      mapCountriesCount: Array.isArray(mapCountries) ? mapCountries.length : 0,
    };
  }

  private countAnalyticsSnapshotPoints(value: any): number {
    if (Array.isArray(value)) return value.length;
    if (!value || typeof value !== "object") return 0;

    return Object.values(value as Record<string, any>).reduce<number>(
      (sum, entry) => sum + this.countAnalyticsSnapshotPoints(entry),
      0
    );
  }

  private hasSnapshotData(value: any): value is Record<string, any> {
    return Boolean(
      value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value).length
    );
  }

  private analyticsSnapshotKey(backerType: FomoV2BackerType): string {
    return `${backerType}:analytics:${BACKER_ANALYTICS_SNAPSHOT_SCOPE}:${BACKER_ANALYTICS_SNAPSHOT_VERSION}`;
  }

  private isDefaultAnalyticsSnapshotQuery(
    query: BackerListQuery = {}
  ): boolean {
    return Object.entries(query || {}).every(([key, value]) => {
      if (BACKER_ANALYTICS_SNAPSHOT_IGNORED_QUERY_KEYS.has(key)) return true;

      const values = Array.isArray(value)
        ? value
        : String(value ?? "").split(",");

      return values.every((entry) => {
        const normalized = this.cleanString(entry).toLowerCase();
        return (
          !normalized ||
          normalized === "all" ||
          normalized === "any" ||
          normalized === "undefined" ||
          normalized === "null"
        );
      });
    });
  }

  private isAnalyticsSnapshotCronEnabled(): boolean {
    const value = String(
      process.env.FOMO_V2_BACKERS_ANALYTICS_SNAPSHOT_ENABLED ?? "true"
    ).toLowerCase();

    return !["0", "false", "no", "off"].includes(value);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  async listFundProjects(backerKey: string, query: BackerProjectsQuery = {}) {
    return this.listBackerProjects("fund", backerKey, query);
  }

  async listPersonProjects(backerKey: string, query: BackerProjectsQuery = {}) {
    return this.listBackerProjects("person", backerKey, query);
  }

  async getFundPortfolio(backerKey: string, query: BackerProjectsQuery = {}) {
    return this.getBackerPortfolio("fund", backerKey, query);
  }

  async getPersonPortfolio(backerKey: string, query: BackerProjectsQuery = {}) {
    return this.getBackerPortfolio("person", backerKey, query);
  }

  private async getBackerPortfolio(
    backerType: FomoV2BackerType,
    backerKey: string,
    query: BackerProjectsQuery = {}
  ) {
    const includeSummary = String(query?.includeSummary ?? "true") !== "false";
    const assetsResponse = await this.listBackerProjects(
      backerType,
      backerKey,
      query
    );
    const assetItems = Array.isArray((assetsResponse as any).items)
      ? (assetsResponse as any).items
      : [];
    const assets = {
      items: assetItems,
      total: Number((assetsResponse as any).total || 0),
      limit: Number((assetsResponse as any).limit || 20),
      offset: Number((assetsResponse as any).offset || 0),
      hasMore: Boolean((assetsResponse as any).hasMore),
    };
    const emptySummary = this.emptyFundPortfolioSummary();
    const backerId = this.toObjectId((assetsResponse as any).backer?.backerId);
    const summary =
      includeSummary && (assetsResponse as any).isSuccess && backerId
        ? await this.buildFundPortfolioSummary(
            backerId,
            this.firstString((assetsResponse as any).backer?.name)
          )
        : emptySummary;

    return {
      ok: Boolean(
        (assetsResponse as any).ok ?? (assetsResponse as any).isSuccess
      ),
      isSuccess: Boolean((assetsResponse as any).isSuccess),
      error: (assetsResponse as any).error,
      backer: (assetsResponse as any).backer,
      assets,
      portfolioAssets: assetItems,
      items: assetItems,
      projects: assetItems,
      total: assets.total,
      limit: assets.limit,
      offset: assets.offset,
      hasMore: assets.hasMore,
      summaryIncluded: includeSummary,
      ...summary,
    };
  }

  async getFundPerformance(backerKey: string, query: Record<string, any> = {}) {
    const context = await this.loadFundRoiPerformanceContext(backerKey);

    if (!context.backer || !context.backerId) {
      return this.emptyFundPerformance(backerKey, "Fund not found");
    }

    if (!context.candidates.length) {
      return this.emptyFundPerformance(
        context.backer.routeId || context.backer.slug || backerKey
      );
    }

    const selectedCandidates = this.selectFundRoiCandidates(
      context.candidates,
      query
    );
    const roiPerformance = await this.buildFundRoiPerformanceChart(
      selectedCandidates,
      this.firstString(context.backer.name, backerKey)
    );

    return {
      ok: true,
      isSuccess: true,
      backer: {
        id: this.firstString(
          context.backer.routeId,
          context.backer.slug,
          this.toIdString(context.backer.backerId)
        ),
        backerId: this.toIdString(context.backer.backerId),
        name: context.backer.name,
        slug: context.backer.slug,
        routeId: context.backer.routeId,
      },
      roiPerformance: {
        ...roiPerformance,
        meta: {
          ...(roiPerformance.meta || {}),
          eligibleRounds: context.candidates.length,
          selectedRounds: selectedCandidates.length,
          maxSelectedRounds: FUND_ROI_MAX_SELECTED_PROJECTS,
          source: [
            "backer_portfolio_holdings",
            "funding_rounds",
            "funding_round_participants",
            "project_market_snapshots",
            "market_project_histories",
          ],
        },
      },
    };
  }

  async getFundPerformanceVolatility(
    backerKey: string,
    query: Record<string, any> = {}
  ) {
    const backer = await this.resolveBackerListItem("fund", backerKey);
    const backerId = this.toObjectId(backer?.backerId);
    const page = Math.max(Math.floor(Number(query.page) || 1), 1);
    const limit = Math.min(
      Math.max(
        Math.floor(Number(query.limit) || FUND_VOLATILITY_DEFAULT_LIMIT),
        1
      ),
      50
    );
    const offset = Math.max(
      Math.floor(Number(query.offset) || (page - 1) * limit),
      0
    );
    const range = this.normalizeFundVolatilityRange(
      query.range || query.chartRange
    );
    const sortBy = this.normalizeFundVolatilitySortField(query.sortBy);
    const sortOrder =
      String(query.sortOrder || "desc").toLowerCase() === "asc"
        ? "asc"
        : "desc";
    const search = this.cleanString(query.search || query.q)
      .toLowerCase()
      .slice(0, 120);
    const minReturns = Math.min(
      Math.max(
        Math.floor(Number(query.minReturns) || FUND_VOLATILITY_MIN_RETURNS),
        2
      ),
      90
    );

    if (!backer || !backerId) {
      return {
        ok: false,
        isSuccess: false,
        error: "Fund not found",
        range,
        items: [],
        projects: [],
        total: 0,
        page,
        limit,
        offset,
        hasMore: false,
        meta: {
          backerKey,
          sortBy,
          sortOrder,
          minReturns,
        },
      };
    }

    const holdings = await this.loadBackerHoldings(backerId, 5000);
    const roundIds = this.uniqueObjectIds(
      holdings.flatMap((holding: any) => holding?.roundIds || [])
    );
    const [rounds, participants, enrichedHoldings] = await Promise.all([
      this.loadRounds(roundIds),
      this.loadRoundParticipants(roundIds),
      this.enrichHoldings(holdings),
    ]);
    const roundsById = new Map(
      rounds.map((round: any) => [this.toIdString(round?._id), round])
    );
    const participantsByRoundId = this.groupByString(
      participants,
      (participant: any) => this.toIdString(participant?.fundingRoundId)
    );
    const candidates = this.buildFundVolatilityCandidates(
      enrichedHoldings,
      roundsById,
      participantsByRoundId,
      backerId
    );
    const marketAssetIds = this.uniqueObjectIds(
      candidates.map((candidate) => candidate.marketAssetId)
    );
    const dailyPriceSeriesByAssetId =
      await this.marketChartReadService.getMarketAssetDailyPriceSeries(
        marketAssetIds,
        { range }
      );
    const allItems = candidates
      .map((candidate) =>
        this.serializeFundVolatilityProject(
          candidate,
          dailyPriceSeriesByAssetId.get(candidate.marketAssetKey) || [],
          minReturns
        )
      )
      .filter((item) => item.name)
      .filter((item) => {
        if (!search) return true;
        return [item.name, item.symbol, item.niche, item.investedRound]
          .map((value) => this.cleanString(value).toLowerCase())
          .some((value) => value.includes(search));
      });
    const sortedItems = this.sortFundVolatilityItems(
      allItems,
      sortBy,
      sortOrder
    );
    const items = sortedItems.slice(offset, offset + limit);
    const validItems = allItems.filter((item) =>
      Number.isFinite(Number(item.volatility))
    ).length;

    return {
      ok: true,
      isSuccess: true,
      range,
      backer: {
        id: this.firstString(
          backer.routeId,
          backer.slug,
          this.toIdString(backer.backerId)
        ),
        backerId: this.toIdString(backer.backerId),
        name: backer.name,
        slug: backer.slug,
        routeId: backer.routeId,
      },
      items,
      projects: items,
      total: allItems.length,
      page,
      limit,
      offset,
      hasMore: offset + items.length < allItems.length,
      meta: {
        source: [
          "backer_portfolio_holdings",
          "funding_rounds",
          "funding_round_participants",
          "market_project_histories",
          "project_market_snapshots",
        ],
        range,
        sortBy,
        sortOrder,
        minReturns,
        candidates: candidates.length,
        assetsWithHistory: dailyPriceSeriesByAssetId.size,
        validItems,
        insufficientItems: Math.max(allItems.length - validItems, 0),
      },
    };
  }

  async getFundMarketFootprint(backerKey: string) {
    const backer = await this.resolveBackerListItem("fund", backerKey);
    const backerId = this.toObjectId(backer?.backerId);

    if (!backer || !backerId) {
      const emptyByTab = this.emptyFundMarketFootprintByTab();

      return {
        ok: false,
        isSuccess: false,
        error: "Fund not found",
        byTab: emptyByTab,
        categoriesByTab: emptyByTab,
        marketFootprint: { byTab: emptyByTab },
      };
    }

    const holdings = await this.loadBackerHoldings(backerId, 5000);
    const roundIds = this.uniqueObjectIds(
      holdings.flatMap((holding: any) => holding?.roundIds || [])
    );
    const [rounds, enrichedHoldings] = await Promise.all([
      this.loadRounds(roundIds),
      this.enrichHoldings(holdings),
    ]);
    const roundsById = new Map(
      rounds.map((round: any) => [this.toIdString(round?._id), round])
    );
    const projects = this.buildFundMarketFootprintProjects(
      enrichedHoldings,
      roundsById
    );
    const byTab = FUND_MARKET_FOOTPRINT_TABS.reduce((acc, tab) => {
      acc[tab] = this.buildFundMarketFootprintCategories(projects, tab);
      return acc;
    }, {} as Record<FundMarketFootprintTab, any[]>);

    return {
      ok: true,
      isSuccess: true,
      backer: {
        id: this.firstString(
          backer.routeId,
          backer.slug,
          this.toIdString(backer.backerId)
        ),
        backerId: this.toIdString(backer.backerId),
        name: backer.name,
        slug: backer.slug,
        routeId: backer.routeId,
      },
      byTab,
      categoriesByTab: byTab,
      marketFootprint: {
        byTab,
        categoriesByTab: byTab,
      },
      meta: {
        tabs: FUND_MARKET_FOOTPRINT_TABS,
        source: [
          "backer_portfolio_holdings",
          "funding_rounds",
          "market_project_read_models",
        ],
        projects: projects.length,
        valueDefinition: {
          a: "sum of raisedAmount for fund-participated rounds in selected period",
          b: "current project marketCap, fallback to FDV",
        },
      },
    };
  }

  async getFundComparison(backerKey: string, query: Record<string, any> = {}) {
    return this.getBackerComparison("fund", backerKey, query);
  }

  async getPersonComparison(
    backerKey: string,
    query: Record<string, any> = {}
  ) {
    return this.getBackerComparison("person", backerKey, query);
  }

  private async getBackerComparison(
    backerType: FomoV2BackerType,
    backerKey: string,
    query: Record<string, any> = {}
  ) {
    const backer = await this.resolveBackerListItem(backerType, backerKey);
    const backerId = this.toObjectId(backer?.backerId);
    const section = this.normalizeFundComparisonSection(
      query.section || query.block || query.part
    );
    const requestedPeerKeys = this.parseFundComparisonPeerKeys(query);
    const requestedPeerLimit = Number(query.peerLimit || query.limit);
    const defaultPeerLimit =
      section === "roiTrend"
        ? FUND_COMPARISON_ROI_TREND_DEFAULT_PEER_LIMIT
        : FUND_COMPARISON_DEFAULT_PEER_LIMIT;
    const peerLimit = Math.min(
      Math.max(
        Math.floor(
          requestedPeerKeys
            ? requestedPeerKeys.length
            : Number.isFinite(requestedPeerLimit) && requestedPeerLimit > 0
            ? requestedPeerLimit
            : defaultPeerLimit
        ),
        requestedPeerKeys ? 0 : 1
      ),
      FUND_COMPARISON_MAX_PEER_LIMIT
    );

    if (!backer || !backerId) {
      return this.emptyFundComparison(
        backerKey,
        `${this.backerTypeLabel(backerType)} not found`
      );
    }

    const peerBackers = await this.selectFundComparisonPeers(
      backerType,
      backer,
      peerLimit,
      {
        ...query,
        requestedPeerKeys,
      }
    );
    const fundRows = [backer, ...peerBackers].slice(0, peerLimit + 1);
    const isAllSection = section === "all";
    const needsRoiTrend = isAllSection || section === "roiTrend";
    const needsVolatility =
      isAllSection || section === "table" || section === "riskScatter";
    const context = await this.buildFundComparisonContext(fundRows, {
      includePriceSeries: needsRoiTrend || needsVolatility,
      priceRange: needsRoiTrend ? "ALL" : "90D",
    });
    const metrics = fundRows
      .map((fund, index) =>
        this.buildFundComparisonMetric(fund, context, index === 0, {
          requirePriceSeriesForRoi: needsRoiTrend,
          includeVolatility: needsVolatility,
        })
      )
      .filter((metric) => metric !== null);
    const emptyBlocks = this.emptyFundComparison(backerKey);
    const tableRows =
      isAllSection || section === "table"
        ? metrics.map((metric) => this.toFundComparisonTableRow(metric))
        : [];
    const bestWorstRows =
      isAllSection || section === "bestWorst"
        ? metrics
            .filter((metric) => metric.bestInvestment || metric.worstInvestment)
            .map((metric) => this.toFundComparisonBestWorstRow(metric))
        : [];
    const roiTrend =
      isAllSection || section === "roiTrend"
        ? this.buildFundComparisonRoiTrend(
            metrics,
            context.priceSeriesByAssetId
          )
        : emptyBlocks.roiTrend;
    const riskScatter =
      isAllSection || section === "riskScatter"
        ? this.buildFundComparisonRiskScatter(metrics)
        : emptyBlocks.riskScatter;
    const entryAgeRoi =
      isAllSection || section === "entryAgeRoi"
        ? this.buildFundComparisonEntryAgeRoi(metrics)
        : emptyBlocks.entryAgeRoi;

    return {
      ok: true,
      isSuccess: true,
      backer: this.toFundComparisonBacker(backer),
      peers: peerBackers.map((peer) => this.toFundComparisonBacker(peer)),
      table: {
        rows: tableRows,
      },
      roiTrend,
      riskScatter,
      bestWorst: {
        rows: bestWorstRows,
      },
      entryAgeRoi,
      meta: {
        tabs: FUND_COMPARISON_TABS,
        section,
        sectionsLoaded: isAllSection
          ? ["table", "roiTrend", "riskScatter", "bestWorst", "entryAgeRoi"]
          : [section],
        peerLimit,
        funds: metrics.length,
        backers: metrics.length,
        entityType: backerType,
        currentFund: this.firstString(backer.routeId, backer.slug, backer.name),
        currentBacker: this.firstString(
          backer.routeId,
          backer.slug,
          backer.name
        ),
        dataQuality: {
          tableRows: tableRows.length,
          roiTrendLines: roiTrend.lines.length,
          riskScatterItems: riskScatter.items.length,
          bestWorstRows: bestWorstRows.length,
          entryAgeBuckets: entryAgeRoi.categories.length,
          uniqueMarketAssets: context.marketAssetIds.length,
          uniqueRounds: context.rounds.length,
          priceSeriesLoaded: Boolean(context.hasPriceSeries),
          priceSeriesRange: context.priceSeriesRange,
        },
        valueDefinitions: {
          portfolioRoundsRaised:
            "sum of known raised amounts for unique rounds where the fund participated",
          averageProjectRoi:
            "equal-weight average current ROI across eligible fund portfolio projects",
          portfolioVolatility:
            "equal-weight average annualized volatility across portfolio assets with enough history",
          entryAge:
            "time since the fund first participated in the project's known round",
        },
      },
    };
  }

  async searchFundComparisonFunds(
    backerKey: string,
    query: Record<string, any> = {}
  ) {
    return this.searchBackerComparisonBackers("fund", backerKey, query);
  }

  async searchPersonComparisonPersons(
    backerKey: string,
    query: Record<string, any> = {}
  ) {
    return this.searchBackerComparisonBackers("person", backerKey, query);
  }

  private async searchBackerComparisonBackers(
    backerType: FomoV2BackerType,
    backerKey: string,
    query: Record<string, any> = {}
  ) {
    const backer = await this.resolveBackerListItem(backerType, backerKey);
    const backerId = this.toObjectId(backer?.backerId);
    const scope = this.normalizeFundComparisonSearchScope(
      query.scope || query.section
    );
    const search = this.cleanString(query.search || query.q || query.query)
      .toLowerCase()
      .slice(0, 120);
    const limit = Math.min(
      Math.max(Math.floor(Number(query.limit) || 20), 1),
      50
    );

    if (!backer || !backerId) {
      return {
        ok: false,
        isSuccess: false,
        error: `${this.backerTypeLabel(backerType)} not found`,
        scope,
        items: [],
        funds: [],
        persons: [],
        total: 0,
        limit,
        maxSelected: FUND_COMPARISON_MAX_SELECTED_PEERS,
      };
    }

    const excludeKeys = this.fundComparisonSearchExcludeKeys(backer, query);
    const candidatePoolLimit =
      scope === "riskScatter"
        ? search
          ? Math.min(Math.max(limit, 8), 16)
          : Math.min(Math.max(limit * 2, 16), 24)
        : search
        ? Math.min(Math.max(limit * 2, 12), 32)
        : Math.min(Math.max(limit * 2, 16), 40);
    const candidateRows = await this.findFundComparisonSearchCandidates(
      backerType,
      search,
      excludeKeys,
      candidatePoolLimit
    );

    if (!candidateRows.length) {
      return {
        ok: true,
        isSuccess: true,
        scope,
        items: [],
        funds: [],
        persons: [],
        total: 0,
        limit,
        maxSelected: FUND_COMPARISON_MAX_SELECTED_PEERS,
      };
    }

    const context = await this.buildFundComparisonContext(candidateRows, {
      includePriceSeries: scope === "riskScatter",
      priceRange: "90D",
    });
    const metrics = candidateRows
      .map((fund) =>
        this.buildFundComparisonMetric(fund, context, false, {
          requirePriceSeriesForRoi: false,
          includeVolatility: scope === "riskScatter",
        })
      )
      .filter((metric) => {
        return this.isFundComparisonMetricEligibleForSearch(metric, scope);
      });
    const items = metrics
      .slice(0, limit)
      .map((metric) => this.toFundComparisonSearchItem(metric, scope));

    return {
      ok: true,
      isSuccess: true,
      scope,
      items,
      funds: items,
      persons: items,
      total: metrics.length,
      limit,
      maxSelected: FUND_COMPARISON_MAX_SELECTED_PEERS,
      meta: {
        priceSeriesRange: scope === "riskScatter" ? "90D" : undefined,
        source: [
          "backer_list_read_models",
          "backer_portfolio_holdings",
          "funding_rounds",
          "market_project_read_models",
          "project_market_snapshots",
          "market_project_histories",
        ],
      },
    };
  }

  async searchFundPerformanceProjects(
    backerKey: string,
    query: Record<string, any> = {}
  ) {
    const context = await this.loadFundRoiPerformanceContext(backerKey);
    const search = this.cleanString(query.search || query.q || query.query)
      .toLowerCase()
      .slice(0, 120);
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 50);

    if (!context.backer || !context.backerId) {
      return {
        ok: false,
        isSuccess: false,
        error: "Fund not found",
        items: [],
        projects: [],
        total: 0,
        limit,
      };
    }

    const bestCandidates = this.selectTopFundRoiCandidates(
      context.candidates,
      context.candidates.length
    );
    const filteredCandidates = search
      ? bestCandidates.filter((candidate) =>
          [
            candidate.projectName,
            candidate.projectSymbol,
            candidate.projectSlug,
            candidate.roundName,
          ]
            .map((value) => this.cleanString(value).toLowerCase())
            .some((value) => value.includes(search))
        )
      : bestCandidates;
    const items = filteredCandidates
      .slice(0, limit)
      .map((candidate) => this.serializeFundRoiSearchItem(candidate));

    return {
      ok: true,
      isSuccess: true,
      items,
      projects: items,
      total: filteredCandidates.length,
      limit,
      maxSelected: FUND_ROI_MAX_SELECTED_PROJECTS,
    };
  }

  async getFundDetail(backerKey: string, userId?: string) {
    const detail = await this.buildBackerDetail("fund", backerKey, userId);

    if (!detail) {
      return {
        ok: false,
        isSuccess: false,
        error: "Fund not found",
        fund: null,
      };
    }

    return {
      ok: true,
      isSuccess: true,
      fund: detail,
    };
  }

  async getPersonDetail(backerKey: string, userId?: string) {
    const detail = await this.buildBackerDetail("person", backerKey, userId);

    if (!detail) {
      return {
        ok: false,
        isSuccess: false,
        error: "Person not found",
        person: null,
      };
    }

    return {
      ok: true,
      isSuccess: true,
      person: detail,
    };
  }

  async getFundsBySlugs(query: Record<string, any> = {}) {
    const slugs = this.values(query.slugs || query.slug)
      .map((item) => this.cleanString(item))
      .filter(Boolean)
      .slice(0, 100);

    if (!slugs.length) {
      return { ok: true, isSuccess: true, items: [], totalCount: 0, total: 0 };
    }

    const rows = await this.listReadModel
      .find({
        backerType: "fund",
        visible: true,
        $or: [{ routeId: { $in: slugs } }, { slug: { $in: slugs } }],
      })
      .lean()
      .exec();
    const order = new Map(slugs.map((slug, index) => [slug, index]));
    const items = (rows as any[])
      .sort((left, right) => {
        const leftIndex =
          order.get(left.routeId) ?? order.get(left.slug) ?? 9999;
        const rightIndex =
          order.get(right.routeId) ?? order.get(right.slug) ?? 9999;
        return leftIndex - rightIndex;
      })
      .map((row) => this.serializeListDocument("fund", row));

    return {
      ok: true,
      isSuccess: true,
      items,
      totalCount: items.length,
      total: items.length,
    };
  }

  async getFundLockedUnlockedTokenDistribution(backerKey: string) {
    return this.getBackerLockedUnlockedTokenDistribution("fund", backerKey);
  }

  async getPersonLockedUnlockedTokenDistribution(backerKey: string) {
    return this.getBackerLockedUnlockedTokenDistribution("person", backerKey);
  }

  private async getBackerLockedUnlockedTokenDistribution(
    backerType: FomoV2BackerType,
    backerKey: string
  ) {
    const backer = await this.resolveBackerListItem(backerType, backerKey);
    const backerId = this.toObjectId(backer?.backerId);

    if (!backer || !backerId) {
      return { ok: false, isSuccess: false, items: [], total: 0 };
    }

    const holdings = await this.loadBackerHoldings(backerId);
    const enrichedHoldings = await this.enrichHoldings(holdings);
    const projects = enrichedHoldings
      .map((entry) => this.serializeFundSupportedProject(entry))
      .filter((project) => project.name);
    const items = this.buildLockedUnlockedDistribution(projects);

    return {
      ok: true,
      isSuccess: true,
      items,
      total: items.length,
    };
  }

  async getFundPortfolioGeography(
    backerKey: string,
    query: Record<string, any> = {}
  ) {
    const backer = await this.resolveBackerListItem("fund", backerKey);
    const backerId = this.toObjectId(backer?.backerId);
    const includeUnknown = String(query.includeUnknown ?? "true") !== "false";
    const selectedOnly =
      String(query.selectedOnly || "").toLowerCase() === "true";
    const selectedProjectSlug = this.cleanString(query.projectSlug);
    const selectedRegion = this.cleanString(query.region);
    const minCoInvestors = Math.max(Number(query.minCoInvestors) || 1, 0);

    if (!backer || !backerId) {
      return this.emptyPortfolioGeography(backerKey, "Fund not found");
    }

    const holdings = await this.loadBackerHoldings(backerId);
    const selectedHolding = selectedProjectSlug
      ? holdings.find((holding: any) => {
          return [
            holding?.projectSlug,
            holding?.projectName,
            this.toIdString(holding?.canonicalProjectId),
          ]
            .map((value) => this.normalizeSlug(value))
            .includes(this.normalizeSlug(selectedProjectSlug));
        })
      : undefined;
    const scopedHoldings =
      selectedOnly && selectedHolding ? [selectedHolding] : holdings;
    const roundIds = this.uniqueObjectIds(
      scopedHoldings.flatMap((holding: any) => holding?.roundIds || [])
    );

    if (!roundIds.length) {
      return this.emptyPortfolioGeography(
        backer.routeId || backer.slug || backerKey
      );
    }

    const [participants, rounds, enrichedHoldings] = await Promise.all([
      this.loadRoundParticipants(roundIds),
      this.loadRounds(roundIds),
      this.enrichHoldings(scopedHoldings),
    ]);
    const coBackerIds = this.uniqueObjectIds(
      (participants as any[])
        .filter(
          (participant) =>
            this.toIdString(participant?.backerId) !== this.toIdString(backerId)
        )
        .map((participant) => participant?.backerId)
    );
    const coBackers = await this.loadBackerListByIds(coBackerIds);
    const coBackersById = new Map(
      coBackers.map((row: any) => [this.toIdString(row?.backerId), row])
    );
    const roundsById = new Map(
      rounds.map((round: any) => [this.toIdString(round?._id), round])
    );
    const projectByRoundId = new Map<string, any>();

    enrichedHoldings.forEach((entry) => {
      (entry.holding?.roundIds || []).forEach((roundId: any) => {
        projectByRoundId.set(this.toIdString(roundId), entry);
      });
    });

    const projectGroups = new Map<string, any>();

    (participants as any[]).forEach((participant) => {
      if (this.toIdString(participant?.backerId) === this.toIdString(backerId))
        return;

      const entry = projectByRoundId.get(
        this.toIdString(participant?.fundingRoundId)
      );
      if (!entry) return;

      const project = this.serializeFundSupportedProject(entry);
      const projectKey =
        project.slug ||
        this.toIdString(entry.holding?.canonicalProjectId) ||
        project.name;
      if (!projectKey) return;

      const backerRow = coBackersById.get(
        this.toIdString(participant?.backerId)
      );
      const region = this.resolveRegion(backerRow, includeUnknown);
      if (!includeUnknown && region === "Unknown") return;
      if (selectedRegion && region !== selectedRegion) return;

      const round = roundsById.get(
        this.toIdString(participant?.fundingRoundId)
      );
      const group =
        projectGroups.get(projectKey) ||
        ({
          projectSlug: project.slug || projectKey,
          projectName: project.name,
          logo: project.logo || project.image || "",
          symbol: project.symbol || "",
          category: project.category || "",
          coInvestors: new Map<string, any>(),
          regionCounts: new Map<string, any>(),
        } as any);
      const investor = this.serializeGeographyInvestor(
        participant,
        backerRow,
        region,
        round
      );
      const investorKey =
        investor.slug || investor.name || this.toIdString(participant?._id);
      if (!investorKey) return;

      group.coInvestors.set(
        investorKey,
        this.mergeGeographyInvestor(
          group.coInvestors.get(investorKey),
          investor
        )
      );
      const regionGroup =
        group.regionCounts.get(region) ||
        ({
          region,
          investors: new Map<string, any>(),
        } as any);
      regionGroup.investors.set(
        investorKey,
        this.mergeGeographyInvestor(
          regionGroup.investors.get(investorKey),
          investor
        )
      );
      group.regionCounts.set(region, regionGroup);
      projectGroups.set(projectKey, group);
    });

    const projects = Array.from(projectGroups.values())
      .map((project: any) => {
        const regionCounts = Array.from(project.regionCounts.values())
          .map((regionGroup: any) => ({
            region: regionGroup.region,
            investorsCount: regionGroup.investors.size,
            percent: this.percent(
              regionGroup.investors.size,
              project.coInvestors.size
            ),
            investors: Array.from(regionGroup.investors.values()),
            coInvestorsPreview: Array.from(
              regionGroup.investors.values()
            ).slice(0, 6),
          }))
          .filter((item) => item.investorsCount >= minCoInvestors)
          .sort((left, right) => right.investorsCount - left.investorsCount);

        return {
          projectSlug: project.projectSlug,
          projectName: project.projectName,
          logo: project.logo,
          symbol: project.symbol,
          category: project.category,
          coInvestorCount: project.coInvestors.size,
          regionCounts,
        };
      })
      .filter((project) => project.regionCounts.length)
      .sort((left, right) => right.coInvestorCount - left.coInvestorCount)
      .slice(0, 80);
    const uniqueInvestors = new Map<string, any>();
    projects.forEach((project) => {
      project.regionCounts.forEach((regionCount: any) => {
        regionCount.coInvestorsPreview.forEach((investor: any) => {
          uniqueInvestors.set(investor.slug || investor.name, investor);
        });
      });
    });
    const selectedProject = selectedProjectSlug
      ? projects.find((project) => {
          return (
            this.normalizeSlug(project.projectSlug) ===
            this.normalizeSlug(selectedProjectSlug)
          );
        })
      : undefined;
    const selectedInvestors = selectedOnly
      ? Array.from(
          new Map(
            (projects[0]?.regionCounts || [])
              .flatMap((regionCount: any) => regionCount.investors || [])
              .map((investor: any) => [
                investor.slug || investor.name,
                investor,
              ])
          ).values()
        )
      : selectedProject
      ? Array.from(
          new Map(
            selectedProject.regionCounts
              .filter(
                (regionCount: any) =>
                  !selectedRegion || regionCount.region === selectedRegion
              )
              .flatMap((regionCount: any) => regionCount.investors || [])
              .map((investor: any) => [
                investor.slug || investor.name,
                investor,
              ])
          ).values()
        )
      : [];
    const investorsWithLocation = Array.from(uniqueInvestors.values()).filter(
      (investor: any) => investor.region && investor.region !== "Unknown"
    ).length;
    const summary = {
      portfolioProjects: holdings.length,
      projectsWithCoInvestors: projects.length,
      totalCoInvestors: uniqueInvestors.size,
      investorsWithLocation,
      investorsWithoutLocation: Math.max(
        0,
        uniqueInvestors.size - investorsWithLocation
      ),
      regionCoveragePercent: this.percent(
        investorsWithLocation,
        uniqueInvestors.size
      ),
    };

    return {
      ok: true,
      isSuccess: true,
      investor: {
        slug: backer.routeId || backer.slug || backerKey,
        name: backer.name || "",
        logo: backer.logo || backer.avatar || "",
      },
      summary,
      regions: this.buildGeographyRegions(projects),
      projects,
      selected: {
        projectSlug:
          selectedProject?.projectSlug || selectedProjectSlug || null,
        region: selectedRegion || null,
        investors: selectedInvestors,
      },
      dataQuality: { ...summary },
    };
  }

  async getPersonsAnalytics(query: BackerListQuery = {}) {
    if (this.isDefaultAnalyticsSnapshotQuery(query)) {
      return this.getAnalyticsSnapshotOrBuild("person");
    }

    return this.computePersonsAnalytics(query);
  }

  private async computePersonsAnalytics(query: BackerListQuery = {}) {
    const result = await this.analytics("person", query);

    return this.serializePersonsAnalytics(result);
  }

  private serializePersonsAnalytics(result: any) {
    return {
      summary: {
        totalPersons: result.summary.totalBackers,
        totalProjectsSupported: result.summary.totalProjectsSupported,
        averageRating: result.summary.averageRating,
        averageFullness: result.summary.averageFullness,
        withSocialLinks: result.summary.withSocialLinks,
        withPortfolio: result.summary.withPortfolio,
      },
      personsBySpecialization: result.backersByType,
      topSectors: result.topSectors.map((item) => ({
        ...item,
        topRoles: item.topRoles || "-",
        keyRegions: item.keyRegions || "-",
        sectors: item.label,
        topProjects: item.topProjects || "-",
        growth: item.growth || "-",
      })),
      personsByCountry: result.backersByCountry,
      filterOptions: {
        sectors: result.topSectors.map((item) => item.label),
        specializations: result.backersByType.map((item) => item.label),
      },
      dataQuality: result.dataQuality,
    };
  }

  private async buildBackerDetail(
    backerType: FomoV2BackerType,
    backerKey: string,
    userId?: string
  ): Promise<any | null> {
    const listItem = await this.resolveBackerListItem(backerType, backerKey);
    const backerId = this.toObjectId(listItem?.backerId);
    if (!listItem || !backerId) return null;

    const [profile, source, holdings, reactionState, flagState] = await Promise.all([
      this.profileReadModel.findOne({ backerId }).lean().exec(),
      this.backerModel.findById(backerId).lean().exec(),
      this.loadBackerHoldings(backerId),
      this.reactionService.getReactionState("backer", backerId, userId),
      this.flagService.getFlagState(
        backerType === "person" ? "person" : "backer",
        backerId
      ),
    ]);
    const enrichedHoldings = await this.enrichHoldings(holdings);
    const roundIds = this.uniqueObjectIds(
      holdings.flatMap((holding: any) => holding?.roundIds || [])
    );
    const [rounds, participants] = await Promise.all([
      this.loadRounds(roundIds),
      this.loadRoundParticipants(roundIds),
    ]);
    const roundsById = new Map(
      rounds.map((round: any) => [this.toIdString(round?._id), round])
    );
    const participantsByRoundId = this.groupByString(
      participants,
      (participant: any) => this.toIdString(participant?.fundingRoundId)
    );
    const supportedProjects = enrichedHoldings
      .map((entry) =>
        this.serializeFundSupportedProject(
          entry,
          this.roundsForHolding(entry.holding, roundsById)
        )
      )
      .filter((project) => project.name);
    const fundraisingRounds = this.buildFundraisingRounds(
      enrichedHoldings,
      roundsById,
      participantsByRoundId,
      backerId,
      listItem.name
    );
    const coInvestors = await this.buildCoInvestors(
      participants,
      roundsById,
      backerId
    );
    const socialLinks = this.normalizeSocialLinks(listItem, profile, source);
    const description = this.firstString(
      listItem.descriptionText,
      listItem.bio,
      (profile as any)?.description,
      (source as any)?.description
    );
    const stats = this.buildFundStats(
      listItem,
      supportedProjects,
      fundraisingRounds,
      coInvestors
    );
    const roundsByCategory = this.groupAmountsByName(
      supportedProjects.map((project) => ({
        name: project.category || "Other",
        amount: Number(project.amount || 0),
      }))
    );
    const portfolioCategories = this.buildPortfolioCategories(roundsByCategory);
    const routeId = this.firstString(
      listItem.routeId,
      listItem.slug,
      this.toIdString(backerId)
    );
    const roi = this.roundNumber(listItem.roi);
    const projectsCount = Math.max(
      Number(listItem.projectsCount || 0),
      Number(listItem.supportedProjectsCount || 0),
      supportedProjects.length
    );
    const leadInvestments = Math.max(
      Number(listItem.leadInvestments || 0),
      holdings.filter((holding: any) => Boolean(holding?.isLead)).length
    );
    const topFundedProject = supportedProjects
      .slice()
      .sort(
        (left, right) => Number(right.amount || 0) - Number(left.amount || 0)
      )[0];
    const highestRoiProject = supportedProjects
      .slice()
      .filter((project) => Number(project.roi || 0) !== 0)
      .sort((left, right) => Number(right.roi || 0) - Number(left.roi || 0))[0];
    const redFlagsList = flagState.redFlagsList.length
      ? flagState.redFlagsList
      : listItem.redFlagsList || [];
    const greenFlagsList = flagState.greenFlagsList;
    const yellowFlagsList = flagState.yellowFlagsList;

    return {
      _id: routeId,
      id: routeId,
      backerId: this.toIdString(backerId),
      canonicalBackerId: this.toIdString(backerId),
      slug: routeId,
      routeId,
      name: listItem.name || "",
      logo: this.firstString(
        listItem.logo,
        listItem.avatar,
        (profile as any)?.logoUrl
      ),
      avatar: this.firstString(
        listItem.avatar,
        listItem.logo,
        (profile as any)?.avatarUrl
      ),
      type: this.firstString(
        listItem.type,
        listItem.niche,
        backerType === "person" ? "Angel Investor" : "Ventures Capital"
      ),
      niche: this.firstString(
        listItem.niche,
        listItem.type,
        backerType === "person" ? "Angel Investor" : "Ventures Capital"
      ),
      status: this.firstString(listItem.status, "active"),
      country: this.firstString(listItem.country, (profile as any)?.country),
      location: this.firstString(
        listItem.location,
        listItem.country,
        (profile as any)?.country
      ),
      regionData: listItem.regionData,
      description,
      about: description,
      descriptionText: description,
      bio: description,
      banner: this.firstString(
        listItem.niche,
        listItem.type,
        backerType === "person" ? "Angel Investor" : "Ventures Capital"
      ),
      rating: this.roundNumber(listItem.rating),
      fomoScore: this.roundNumber(listItem.fomoScore || listItem.rating),
      fullness: this.roundNumber(listItem.fullness),
      roi,
      athRoi: roi,
      roiDisplay: this.firstString(
        listItem.roiDisplay,
        this.formatRoiDisplay(roi)
      ),
      averageRoi: roi,
      projectsCount,
      supportedProjectsCount: projectsCount,
      projectSupported: projectsCount,
      totalInvestments: projectsCount,
      numberOfInvestments: projectsCount,
      leadInvestments,
      topFundedProject: this.firstString(topFundedProject?.name),
      topFundedProjectData: topFundedProject,
      highestRoi: this.roundNumber(highestRoiProject?.roi),
      highestRoiProject,
      portfolioCoinsCount: supportedProjects.length,
      supportedProjects,
      supportedProjectsPreview: supportedProjects.slice(0, 6),
      portfolioCoins: supportedProjects.filter(
        (project) => project.hasMarketData
      ).length
        ? supportedProjects.filter((project) => project.hasMarketData)
        : supportedProjects,
      fundraisingRounds,
      coInvestors,
      sectors: listItem.sectors || [],
      tags: listItem.tags || [],
      categories: portfolioCategories,
      portfolioCategories,
      investmentStages: this.uniqueStrings(
        fundraisingRounds.map((round) => round.stage || round.roundName)
      ),
      socialLinks,
      socialmedia: this.toSocialMedia(socialLinks),
      stats,
      totalRaised: stats.totalInvestedAmount,
      currentAum: stats.totalInvestedAmount,
      investAmount: stats.totalInvestedAmount,
      lastFunding: listItem.lastFunding || stats.lastInvestmentDate,
      lastRoundDate: listItem.lastRoundDate || stats.lastInvestmentDate,
      roundsByCategory,
      categoryDistribution: roundsByCategory,
      roundsByStage: this.groupAmountsByName(
        fundraisingRounds.map((round) => ({
          name: round.stage || round.roundName || "Unknown",
          amount: Number(round.amount || 0),
        }))
      ),
      georaphyInvestments: [],
      investmentPorfolio: this.buildInvestmentPortfolio(
        supportedProjects,
        fundraisingRounds
      ),
      activities: this.buildActivities(fundraisingRounds),
      recentExits: [],
      projects: supportedProjects,
      comments: [],
      projectTwitterData: { followers: [] },
      twitterScore: 0,
      previousTwitterScore: 0,
      greenFlagsList,
      yellowFlagsList,
      redFlagsList,
      greenFlags: greenFlagsList.length,
      yellowFlags: yellowFlagsList.length,
      redFlags: redFlagsList.length || listItem.redFlags || 0,
      flagCounts: {
        green: greenFlagsList.length,
        yellow: yellowFlagsList.length,
        red: redFlagsList.length,
      },
      redStatus: Boolean(listItem.redStatus),
      likes: reactionState.likes,
      dislikes: reactionState.dislikes,
      likesCount: reactionState.likesCount,
      dislikesCount: reactionState.dislikesCount,
      userReaction: reactionState.userReaction,
      reactionCounts: {
        like: reactionState.likesCount,
        dislike: reactionState.dislikesCount,
      },
      isSponsored: Boolean(listItem.isSponsored),
      isEralash: Boolean(listItem.isEralash),
      eralashAdded: listItem.eralashAdded,
      source: {
        sourceName: this.firstString(
          (source as any)?.primarySource,
          (profile as any)?.primarySource
        ),
        sourceUrl: this.firstString((source as any)?.sourceUrl),
        detailUrl: this.firstString((source as any)?.sourceUrl),
        lastParsedAt: (source as any)?.updatedAt,
        lastSyncedAt: listItem.sourceUpdatedAt,
        enrichedFromInvestor: Boolean(profile || source),
        matchedBy: "v2-backer-id",
      },
      dataQuality: {
        source: "fomo-v2",
        backerType,
        holdingsCount: holdings.length,
        supportedProjectsCount: supportedProjects.length,
        fundraisingRoundsCount: fundraisingRounds.length,
        coInvestorsCount: coInvestors.length,
      },
      createdAt: listItem.createdAt,
      updatedAt: listItem.updatedAt || listItem.lastUpdatedAt,
    };
  }

  private async resolveBackerListItem(
    backerType: FomoV2BackerType,
    backerKey: string
  ): Promise<any | null> {
    const key = this.cleanString(backerKey);
    if (!key) return null;

    const objectId = this.toObjectId(key);
    const clauses: any[] = [
      { routeId: key },
      { slug: key },
      { name: new RegExp(`^${this.escapeRegExp(key)}$`, "i") },
    ];

    if (objectId) clauses.push({ _id: objectId }, { backerId: objectId });

    return this.listReadModel
      .findOne({ backerType, visible: true, $or: clauses })
      .lean()
      .exec();
  }

  private serializeListDocument(backerType: FomoV2BackerType, row: any): any {
    return this.serializeListItem(backerType, {
      ...row,
      backerId: this.toIdString(row?.backerId),
      id: this.toIdString(row?.backerId),
    });
  }

  async changeBackerAdminStatus(
    backerType: FomoV2BackerType,
    id: string,
    status: string
  ): Promise<any> {
    const normalizedStatus = this.normalizeAdminStatus(status);

    return this.updateBackerEditorialFields(backerType, id, {
      status: normalizedStatus,
    });
  }

  async updateBackerSponsoredStatus(
    backerType: FomoV2BackerType,
    id: string
  ): Promise<any> {
    const row = await this.resolveBackerListItem(backerType, id);
    if (!row) throw new NotFoundException("FOMO v2 backer not found");

    return this.updateBackerEditorialFields(backerType, id, {
      isSponsored: !Boolean(row.isSponsored),
    });
  }

  async updateBackerEralashStatus(
    backerType: FomoV2BackerType,
    id: string
  ): Promise<any> {
    const row = await this.resolveBackerListItem(backerType, id);
    if (!row) throw new NotFoundException("FOMO v2 backer not found");

    const isEralash = !Boolean(row.isEralash);

    return this.updateBackerEditorialFields(
      backerType,
      id,
      {
        isEralash,
        ...(isEralash ? { eralashAdded: new Date() } : {}),
      },
      isEralash ? [] : ["eralashAdded"]
    );
  }

  async toggleBackerRedStatus(
    backerType: FomoV2BackerType,
    id: string
  ): Promise<any> {
    const row = await this.resolveBackerListItem(backerType, id);
    if (!row) throw new NotFoundException("FOMO v2 backer not found");

    const redStatus = !Boolean(row.redStatus);

    return this.updateBackerEditorialFields(backerType, id, {
      redStatus,
      redFlags: redStatus ? Math.max(Number(row.redFlags || 0), 1) : 0,
      redFlagsList: redStatus ? row.redFlagsList || [] : [],
    });
  }

  async removeBackerFromAdmin(
    backerType: FomoV2BackerType,
    id: string
  ): Promise<any> {
    return this.updateBackerEditorialFields(backerType, id, {
      visible: false,
      status: "Inactive",
    });
  }

  private async updateBackerEditorialFields(
    backerType: FomoV2BackerType,
    id: string,
    set: Record<string, any>,
    unset: string[] = []
  ): Promise<any> {
    const row = await this.resolveBackerListItem(backerType, id);
    if (!row) throw new NotFoundException("FOMO v2 backer not found");

    const backerId = this.toObjectId(row.backerId);
    if (!backerId) throw new NotFoundException("FOMO v2 backer not found");

    const now = new Date();
    const listSet = {
      ...set,
      updatedAt: now,
    };
    const metadataSet = Object.entries(set).reduce<Record<string, any>>(
      (acc, [key, value]) => {
        acc[`metadata.admin.${key}`] = value;
        return acc;
      },
      {
        updatedAt: now,
      }
    );
    const listUnset = unset.reduce<Record<string, string>>((acc, key) => {
      acc[key] = "";
      return acc;
    }, {});
    const metadataUnset = unset.reduce<Record<string, string>>((acc, key) => {
      acc[`metadata.admin.${key}`] = "";
      return acc;
    }, {});
    const listUpdate: Record<string, any> = { $set: listSet };
    const metadataUpdate: Record<string, any> = { $set: metadataSet };

    if (Object.keys(listUnset).length) listUpdate.$unset = listUnset;
    if (Object.keys(metadataUnset).length) metadataUpdate.$unset = metadataUnset;

    const [, updated] = await Promise.all([
      this.backerModel.updateOne({ _id: backerId }, metadataUpdate).exec(),
      this.listReadModel
        .findOneAndUpdate({ backerId }, listUpdate, { new: true })
        .lean()
        .exec(),
    ]);

    return {
      success: true,
      item: this.serializeListDocument(backerType, updated || { ...row, ...set }),
    };
  }

  private normalizeAdminStatus(status: string): string {
    const value = this.cleanString(status);
    if (!value) return "Active";

    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  private async loadBackerHoldings(
    backerId: Types.ObjectId,
    limit = 500
  ): Promise<any[]> {
    return this.holdingModel
      .find({ backerId })
      .sort({ hasMarketData: -1, lastRoundDate: -1, projectName: 1 })
      .limit(limit)
      .lean()
      .exec();
  }

  private async enrichHoldings(holdings: any[]): Promise<any[]> {
    const [
      marketProjectsByKey,
      icoProjectsByCanonicalId,
      canonicalProjectsById,
    ] = await Promise.all([
      this.loadMarketProjectsForHoldings(holdings),
      this.loadIcoProjectsForHoldings(holdings),
      this.loadCanonicalProjectsForHoldings(holdings),
    ]);

    return holdings.map((holding) => {
      const canonicalProjectId = this.toIdString(holding?.canonicalProjectId);
      const marketProject =
        marketProjectsByKey.get(this.toMarketLookupKey(holding)) ||
        marketProjectsByKey.get(`canonical:${canonicalProjectId}`);

      return {
        holding,
        marketProject,
        icoProject: icoProjectsByCanonicalId.get(canonicalProjectId),
        canonicalProject: canonicalProjectsById.get(canonicalProjectId),
      };
    });
  }

  private async loadRounds(roundIds: Types.ObjectId[]): Promise<any[]> {
    if (!roundIds.length) return [];

    return this.fundingRoundModel
      .find(
        { _id: { $in: roundIds } },
        {
          canonicalProjectId: 1,
          marketAssetId: 1,
          roundName: 1,
          normalizedRoundType: 1,
          roundType: 1,
          status: 1,
          announcedDate: 1,
          date: 1,
          raisedAmount: 1,
          valuation: 1,
          tokenPrice: 1,
          roi: 1,
          roiUsd: 1,
          usdRoi: 1,
          roiData: 1,
          platform: 1,
          primarySource: 1,
          sourceUrl: 1,
        }
      )
      .sort({ announcedDate: -1, date: -1, _id: 1 })
      .lean()
      .exec();
  }

  private async loadRoundParticipants(
    roundIds: Types.ObjectId[]
  ): Promise<any[]> {
    if (!roundIds.length) return [];

    return this.participantModel
      .find(
        {
          fundingRoundId: { $in: roundIds },
          status: { $nin: ["conflict", "superseded", "deprecated"] },
        },
        {
          fundingRoundId: 1,
          canonicalProjectId: 1,
          backerId: 1,
          backerName: 1,
          sourceBackerSlug: 1,
          role: 1,
          isLead: 1,
          status: 1,
        }
      )
      .lean()
      .exec();
  }

  private async loadBackerListByIds(
    backerIds: Types.ObjectId[]
  ): Promise<any[]> {
    if (!backerIds.length) return [];

    return this.listReadModel
      .find(
        { backerId: { $in: backerIds }, visible: true },
        {
          backerId: 1,
          backerType: 1,
          routeId: 1,
          slug: 1,
          name: 1,
          logo: 1,
          avatar: 1,
          type: 1,
          niche: 1,
          country: 1,
          location: 1,
          regionData: 1,
          projectsCount: 1,
          supportedProjectsCount: 1,
          supportedProjectsPreview: 1,
          roi: 1,
          roiDisplay: 1,
          totalInvested: 1,
        }
      )
      .lean()
      .exec();
  }

  private serializeFundSupportedProject(entry: any, rounds: any[] = []): any {
    const baseProject = this.serializeBackerProject(
      entry.holding,
      entry.marketProject,
      entry.icoProject,
      entry.canonicalProject
    );
    const latestRound =
      rounds.slice().sort((left, right) => {
        return (
          this.dateNumber(right?.announcedDate || right?.date) -
          this.dateNumber(left?.announcedDate || left?.date)
        );
      })[0] || {};
    const currentPrice = this.firstNumber(
      entry.marketProject?.price,
      entry.marketProject?.usdQuote?.price
    );
    const roi = this.averageRoundRoi(rounds, currentPrice);
    const price = this.firstNumber(
      currentPrice,
      latestRound?.tokenPrice
    );
    const tokenomics =
      entry.icoProject?.metadata?.icodropsProfileOnly?.tokenomics ||
      entry.icoProject?.metadata?.tokenomics ||
      {};
    const category = this.firstString(
      baseProject.category,
      entry.marketProject?.category,
      entry.marketProject?.niche,
      Array.isArray(entry.icoProject?.categories)
        ? entry.icoProject.categories[0]
        : "",
      Array.isArray(entry.holding?.roundTypes)
        ? entry.holding.roundTypes[0]
        : "",
      "Other"
    );

    return this.cleanObject({
      ...baseProject,
      category,
      stage: this.firstString(
        latestRound?.roundName,
        this.humanizeRoundType(latestRound?.roundType),
        Array.isArray(entry.holding?.roundTypes)
          ? entry.holding.roundTypes[0]
          : ""
      ),
      roundDate:
        entry.holding?.lastRoundDate ||
        latestRound?.announcedDate ||
        latestRound?.date,
      amount: this.roundNumber(
        this.firstNumber(
          entry.holding?.totalKnownRaisedAmountUsd,
          latestRound?.raisedAmount
        )
      ),
      roi: this.roundNumber(roi),
      price,
      change24h: this.firstNumber(
        entry.marketProject?.priceChange,
        entry.marketProject?.performance?.usd?.change24h,
        entry.marketProject?.usdQuote?.percent_change_24h
      ),
      marketCap: this.firstNumber(
        entry.marketProject?.marketCap,
        entry.marketProject?.usdQuote?.market_cap
      ),
      fullyDilutedMarketCap: this.firstNumber(
        entry.marketProject?.fullyDilutedMarketCap,
        entry.marketProject?.usdQuote?.fully_diluted_market_cap
      ),
      fdv: this.firstNumber(
        entry.marketProject?.fullyDilutedMarketCap,
        entry.marketProject?.usdQuote?.fully_diluted_market_cap
      ),
      status: this.firstString(
        entry.marketProject?.trading,
        entry.marketProject?.status,
        latestRound?.status,
        "Active"
      ),
      circulatingSupply: this.firstNumber(
        entry.marketProject?.circulatingSupply,
        tokenomics?.circulatingSupply
      ),
      totalSupply: this.firstNumber(
        entry.marketProject?.totalSupply,
        tokenomics?.totalSupply,
        entry.marketProject?.maxSupply,
        tokenomics?.maxSupply
      ),
      maxSupply: this.firstNumber(
        entry.marketProject?.maxSupply,
        tokenomics?.maxSupply
      ),
      hasMarketData: Boolean(
        entry.holding?.hasMarketData || entry.marketProject
      ),
    });
  }

  private buildFundraisingRounds(
    enrichedHoldings: any[],
    roundsById: Map<string, any>,
    participantsByRoundId: Map<string, any[]>,
    backerId: Types.ObjectId,
    fundName: string
  ): any[] {
    const seen = new Set<string>();
    const rows: any[] = [];

    enrichedHoldings.forEach((entry) => {
      const project = this.serializeFundSupportedProject(entry);
      (entry.holding?.roundIds || []).forEach((roundId: any) => {
        const id = this.toIdString(roundId);
        if (!id || seen.has(id)) return;
        seen.add(id);
        const round = roundsById.get(id);
        const participants = participantsByRoundId.get(id) || [];
        const currentParticipant = participants.find((participant) => {
          return (
            this.toIdString(participant?.backerId) === this.toIdString(backerId)
          );
        });
        const isLead =
          Boolean(currentParticipant?.isLead) ||
          (entry.holding?.leadRoundIds || []).some((leadRoundId: any) => {
            return this.toIdString(leadRoundId) === id;
          });
        const date =
          round?.announcedDate || round?.date || entry.holding?.lastRoundDate;
        const stage = this.firstString(
          round?.roundName,
          this.humanizeRoundType(round?.roundType),
          project.stage
        );
        const coInvestors = participants
          .filter((participant) => {
            return (
              this.toIdString(participant?.backerId) !==
              this.toIdString(backerId)
            );
          })
          .map((participant) =>
            this.firstString(
              participant?.backerName,
              participant?.sourceBackerSlug
            )
          )
          .filter(Boolean);

        rows.push({
          id,
          projectName: project.name,
          projectSlug: project.slug,
          projectLogo: project.logo || project.image || "",
          category: project.category || "Other",
          projectCategory: project.category || "Other",
          roundName: stage,
          stage,
          date,
          endDate: date,
          amount: this.roundNumber(round?.raisedAmount || project.amount),
          roi: this.roundNumber(
            this.resolveRoundRoi(round, project.price) ?? project.roi
          ),
          valuation: this.roundNumber(round?.valuation),
          status: this.normalizeRoundStatus(round?.status, date),
          isLead,
          leadInvestors: isLead ? [fundName].filter(Boolean) : [],
          coInvestors: this.uniqueStrings(coInvestors).slice(0, 30),
        });
      });
    });

    return rows
      .sort(
        (left, right) =>
          this.dateNumber(right.date) - this.dateNumber(left.date)
      )
      .slice(0, 120);
  }

  private async buildCoInvestors(
    participants: any[],
    roundsById: Map<string, any>,
    backerId: Types.ObjectId
  ): Promise<any[]> {
    const coBackerIds = this.uniqueObjectIds(
      participants
        .filter(
          (participant) =>
            this.toIdString(participant?.backerId) !== this.toIdString(backerId)
        )
        .map((participant) => participant?.backerId)
    );
    const coBackers = await this.loadBackerListByIds(coBackerIds);
    const coBackersById = new Map(
      coBackers.map((row: any) => [this.toIdString(row?.backerId), row])
    );
    const grouped = new Map<string, any>();

    participants.forEach((participant) => {
      const participantBackerId = this.toIdString(participant?.backerId);
      if (
        !participantBackerId ||
        participantBackerId === this.toIdString(backerId)
      )
        return;
      const backer = coBackersById.get(participantBackerId);
      const key = this.firstString(
        backer?.routeId,
        backer?.slug,
        participantBackerId
      );
      if (!key) return;
      const current =
        grouped.get(key) ||
        ({
          id: key,
          slug: this.firstString(backer?.routeId, backer?.slug),
          name: this.firstString(backer?.name, participant?.backerName),
          logo: this.firstString(backer?.logo, backer?.avatar),
          type: this.firstString(backer?.type, backer?.niche),
          totalInvestments: Number(
            backer?.supportedProjectsCount || backer?.projectsCount || 0
          ),
          investmentsCount: Number(
            backer?.supportedProjectsCount || backer?.projectsCount || 0
          ),
          averageRoi: this.roundNumber(backer?.roi),
          roi: this.roundNumber(backer?.roi),
          dealsCount: 0,
          lastRoundDate: undefined,
        } as any);
      const round = roundsById.get(
        this.toIdString(participant?.fundingRoundId)
      );
      current.dealsCount += 1;
      current.lastRoundDate = this.maxDate(
        current.lastRoundDate,
        round?.announcedDate,
        round?.date
      );
      grouped.set(key, current);
    });

    return Array.from(grouped.values())
      .sort((left, right) => {
        const dealsDiff =
          Number(right.dealsCount || 0) - Number(left.dealsCount || 0);
        if (dealsDiff) return dealsDiff;
        return (
          this.dateNumber(right.lastRoundDate) -
          this.dateNumber(left.lastRoundDate)
        );
      })
      .slice(0, 100);
  }

  private buildFundStats(
    listItem: any,
    supportedProjects: any[],
    fundraisingRounds: any[],
    coInvestors: any[]
  ): any {
    const amounts = fundraisingRounds
      .map((round) => Number(round.amount || 0))
      .filter((value) => value > 0);
    const totalInvestedAmount = Math.max(
      Number(listItem.totalInvested || 0),
      amounts.reduce((sum, value) => sum + value, 0)
    );

    return {
      totalInvestments: Math.max(
        Number(listItem.supportedProjectsCount || 0),
        Number(listItem.projectsCount || 0),
        supportedProjects.length
      ),
      leadInvestments: Math.max(
        Number(listItem.leadInvestments || 0),
        fundraisingRounds.filter((round) => Boolean(round.isLead)).length
      ),
      coInvestments: coInvestors.length,
      exits: 0,
      unicorns: 0,
      averageRoundSize: this.roundNumber(this.average(amounts)),
      medianRoundSize: this.roundNumber(this.median(amounts)),
      lastInvestmentDate: this.maxDate(
        listItem.lastRoundDate,
        ...fundraisingRounds.map((round) => round.date)
      ),
      portfolioProjects: supportedProjects.length,
      totalInvestedAmount: this.roundNumber(totalInvestedAmount),
    };
  }

  private buildInvestmentPortfolio(
    supportedProjects: any[],
    fundraisingRounds: any[]
  ): any[] {
    const roundsByProject = new Map<string, any[]>();

    fundraisingRounds.forEach((round) => {
      const key = this.normalizeSlug(round.projectSlug || round.projectName);
      if (!key) return;
      roundsByProject.set(key, [...(roundsByProject.get(key) || []), round]);
    });

    return supportedProjects.slice(0, 100).map((project, index) => {
      const key = this.normalizeSlug(project.slug || project.name);
      const recentRound = (roundsByProject.get(key) || [])
        .slice()
        .sort(
          (left, right) =>
            this.dateNumber(right.date) - this.dateNumber(left.date)
        )[0];

      return {
        id: index + 1,
        project: {
          _id: project.id || project.slug,
          name: project.name,
          logo: project.logo || project.image,
          niche: project.category || project.stage || "",
          price: project.price || 0,
          status: project.status || "Active",
        },
        investedRound:
          recentRound?.roundName || recentRound?.stage || project.stage || "-",
        investedAmount: Number(recentRound?.amount || project.amount || 0),
        currentRoi: Number(project.roi || recentRound?.roi || 0),
        status: recentRound?.status || "Active",
        exitDate: recentRound?.endDate || recentRound?.date || "",
      };
    });
  }

  private serializeFundPortfolioAsset(
    holding: any,
    baseProject: any,
    marketProject: any,
    rounds: any[] = []
  ): any {
    const price = this.firstNumber(
      marketProject?.price,
      marketProject?.usdQuote?.price
    );
    const change24h = this.firstNumber(
      marketProject?.priceChange,
      marketProject?.performance?.usd?.change24h,
      marketProject?.usdQuote?.percent_change_24h
    );
    const marketCap = this.firstNumber(
      marketProject?.marketCap,
      marketProject?.usdQuote?.market_cap
    );
    const fdv = this.firstNumber(
      marketProject?.fullyDilutedMarketCap,
      marketProject?.usdQuote?.fully_diluted_market_cap
    );
    const averageRoi = this.roundNumber(this.averageRoundRoi(rounds, price));
    const asset = this.cleanObject({
      _id: baseProject._id,
      id: baseProject.id,
      canonicalProjectId: baseProject.canonicalProjectId,
      marketAssetId: baseProject.marketAssetId,
      name: baseProject.name,
      slug: baseProject.slug,
      symbol: baseProject.symbol,
      logo: baseProject.logo,
      image: baseProject.image,
      category: baseProject.category,
      niche: baseProject.category || baseProject.niche,
      href: baseProject.href,
      projectLinks: baseProject.projectLinks,
      coingeckoId: baseProject.coingeckoId,
      price,
      change24h,
      marketCap,
      fullyDilutedMarketCap: fdv,
      fdv,
      averageRoi,
      roi: averageRoi,
    });

    return this.cleanObject({
      ...baseProject,
      asset,
      project: asset,
      price,
      change24h,
      marketCap,
      fullyDilutedMarketCap: fdv,
      fdv,
      averageRoi,
      roi: averageRoi,
      totalRaised: this.toFiniteNumber(holding?.totalKnownRaisedAmountUsd),
    });
  }

  private buildActivities(fundraisingRounds: any[]): any[] {
    return fundraisingRounds.slice(0, 10).map((round, index) => ({
      id: round.id || `${round.projectSlug || round.projectName}-${index}`,
      project: {
        _id: round.projectSlug,
        name: round.projectName,
        logo: round.projectLogo,
        niche: round.stage || round.roundName || "",
      },
      description: "",
      round: round.roundName || round.stage || "",
      date: round.date || new Date(),
    }));
  }

  private buildLockedUnlockedDistribution(projects: any[]): any[] {
    const grouped = new Map<string, any>();

    projects.forEach((project) => {
      const totalSupply = this.firstNumber(
        project.totalSupply,
        project.maxSupply
      );
      const circulatingSupply = this.firstNumber(project.circulatingSupply);
      if (!totalSupply || totalSupply <= 0 || circulatingSupply === undefined)
        return;

      const unlocked = Math.max(0, Math.min(circulatingSupply, totalSupply));
      const locked = Math.max(totalSupply - unlocked, 0);
      const category = this.firstString(project.category, "Other");
      const symbol = this.firstString(project.symbol, "TKN");
      const current =
        grouped.get(category) ||
        ({
          name: category,
          locked: 0,
          unlocked: 0,
          symbol,
          items: [],
        } as any);

      current.locked += locked;
      current.unlocked += unlocked;
      current.items.push({
        logo: project.logo || project.image || "",
        name: project.name,
        nich: category,
        locked: this.roundNumber(locked),
        unlocked: this.roundNumber(unlocked),
        symbol,
      });
      grouped.set(category, current);
    });

    return Array.from(grouped.values())
      .map((item) => ({
        ...item,
        locked: this.roundNumber(item.locked),
        unlocked: this.roundNumber(item.unlocked),
        items: item.items
          .sort((left: any, right: any) => {
            return (
              right.locked + right.unlocked - (left.locked + left.unlocked)
            );
          })
          .slice(0, 12),
      }))
      .sort((left, right) => {
        return right.locked + right.unlocked - (left.locked + left.unlocked);
      })
      .slice(0, 5);
  }

  private emptyFundPortfolioSummary(): Record<string, any> {
    return {
      categoryDistribution: [],
      roundsByCategory: [],
      lockedUnlockedDistribution: [],
      fundraisingRounds: [],
      totalInvested: 0,
      totalAllocated: 0,
      supportedProjectsCount: 0,
      portfolioCoinsCount: 0,
    };
  }

  private emptyFundPerformance(backerKey: string, error?: string): any {
    const emptyByTab = FUND_ROI_PERFORMANCE_TABS.reduce((acc, tab) => {
      acc[tab] = [];
      return acc;
    }, {} as Record<FundPerformanceTab, any[]>);

    return {
      ok: !error,
      isSuccess: !error,
      error,
      roiPerformance: {
        lines: [],
        dataByTab: emptyByTab,
        byTab: emptyByTab,
        leftLabels: this.buildFundRoiLabels([]),
        labels: this.buildFundRoiLabels([]),
        selectedRounds: [],
        meta: {
          backerKey,
          eligibleRounds: 0,
          selectedRounds: 0,
          maxSelectedRounds: FUND_ROI_MAX_SELECTED_PROJECTS,
          source: [
            "backer_portfolio_holdings",
            "funding_rounds",
            "funding_round_participants",
            "project_market_snapshots",
            "market_project_histories",
          ],
        },
      },
    };
  }

  private async loadFundRoiPerformanceContext(backerKey: string): Promise<{
    backer: any | null;
    backerId?: Types.ObjectId;
    candidates: FundRoiCandidate[];
  }> {
    const backer = await this.resolveBackerListItem("fund", backerKey);
    const backerId = this.toObjectId(backer?.backerId);

    if (!backer || !backerId) return { backer, backerId, candidates: [] };

    const holdings = await this.loadBackerHoldings(backerId, 5000);
    const roundIds = this.uniqueObjectIds(
      holdings.flatMap((holding: any) => holding?.roundIds || [])
    );
    if (!roundIds.length) return { backer, backerId, candidates: [] };

    const [rounds, participants, enrichedHoldings] = await Promise.all([
      this.loadRounds(roundIds),
      this.loadRoundParticipants(roundIds),
      this.enrichHoldings(holdings),
    ]);
    const marketAssetIds = this.uniqueObjectIds([
      ...rounds.map((round: any) => round?.marketAssetId),
      ...holdings.map((holding: any) => holding?.marketAssetId),
    ]);
    const [marketProjectsByAssetId, assetIdsWithChartData] = await Promise.all([
      this.loadMarketProjectsByAssetIds(marketAssetIds),
      this.marketChartReadService.getMarketAssetIdsWithChartData(
        marketAssetIds
      ),
    ]);
    const roundsById = new Map(
      rounds.map((round: any) => [this.toIdString(round?._id), round])
    );
    const participantsByRoundId = this.groupByString(
      participants,
      (participant: any) => this.toIdString(participant?.fundingRoundId)
    );
    const candidates = this.buildFundRoiCandidates(
      enrichedHoldings,
      roundsById,
      participantsByRoundId,
      backerId,
      marketProjectsByAssetId
    ).filter((candidate) =>
      assetIdsWithChartData.has(candidate.marketAssetKey)
    );

    return { backer, backerId, candidates };
  }

  private selectFundRoiCandidates(
    candidates: FundRoiCandidate[],
    query: Record<string, any> = {}
  ): FundRoiCandidate[] {
    const selectedRoundIds = this.values(
      query.selectedRoundIds || query.roundIds || query.selected
    )
      .map((value) => this.cleanString(value))
      .filter(Boolean)
      .slice(0, FUND_ROI_MAX_SELECTED_PROJECTS);

    if (!selectedRoundIds.length) {
      return this.selectTopFundRoiCandidates(candidates, 3);
    }

    const candidatesByRoundId = new Map(
      candidates.map((candidate) => [candidate.roundId, candidate])
    );
    const selectedCandidates: FundRoiCandidate[] = [];
    const selectedProjectKeys = new Set<string>();

    selectedRoundIds.forEach((roundId) => {
      const candidate = candidatesByRoundId.get(roundId);
      if (!candidate || selectedProjectKeys.has(candidate.projectKey)) return;
      selectedProjectKeys.add(candidate.projectKey);
      selectedCandidates.push(candidate);
    });

    return selectedCandidates.slice(0, FUND_ROI_MAX_SELECTED_PROJECTS);
  }

  private buildFundRoiCandidates(
    enrichedHoldings: any[],
    roundsById: Map<string, any>,
    participantsByRoundId: Map<string, any[]>,
    backerId: Types.ObjectId,
    marketProjectsByAssetId: Map<string, any>
  ): FundRoiCandidate[] {
    const candidates: FundRoiCandidate[] = [];
    const now = Date.now();

    enrichedHoldings.forEach((entry) => {
      const holding = entry?.holding || {};

      (holding.roundIds || []).forEach((roundId: any) => {
        const id = this.toIdString(roundId);
        const round = roundsById.get(id);
        if (!id || !round) return;

        const participant = (participantsByRoundId.get(id) || []).find(
          (item: any) => {
            return (
              this.toIdString(item?.backerId) === this.toIdString(backerId)
            );
          }
        );
        if (!participant) return;

        const tokenPrice = this.toFiniteNumber(round?.tokenPrice);
        if (tokenPrice === undefined || tokenPrice <= 0) return;

        const roundDate = this.toDate(
          round?.announcedDate || round?.date || holding?.lastRoundDate
        );
        if (!roundDate || roundDate.getTime() > now) return;

        const marketAssetId = this.toObjectId(
          round?.marketAssetId ||
            holding?.marketAssetId ||
            entry?.marketProject?.marketAssetId
        );
        if (!marketAssetId) return;

        const marketAssetKey = this.toIdString(marketAssetId);
        const marketProject =
          marketProjectsByAssetId.get(marketAssetKey) ||
          entry?.marketProject ||
          {};
        const currentPrice = this.firstNumber(
          marketProject?.price,
          marketProject?.usdQuote?.price
        );
        if (currentPrice === undefined || currentPrice <= 0) return;

        const projectKey = this.firstString(
          this.toIdString(round?.canonicalProjectId),
          this.toIdString(holding?.canonicalProjectId),
          `market:${marketAssetKey}`
        );
        const projectName = this.firstString(
          marketProject?.name,
          holding?.projectName,
          entry?.canonicalProject?.name,
          entry?.icoProject?.name,
          "Project"
        );
        const roundName = this.firstString(
          round?.roundName,
          this.humanizeRoundType(round?.roundType),
          this.humanizeRoundType(round?.normalizedRoundType),
          "Round"
        );

        candidates.push({
          round,
          holding,
          marketProject,
          participant,
          roundId: id,
          projectKey,
          marketAssetId,
          marketAssetKey,
          projectName,
          projectSlug: this.firstString(
            marketProject?.slug,
            holding?.projectSlug,
            entry?.canonicalProject?.slug,
            entry?.icoProject?.slug
          ),
          projectSymbol: this.firstString(
            marketProject?.symbol,
            holding?.projectSymbol,
            entry?.canonicalProject?.symbol,
            entry?.icoProject?.symbol
          ),
          projectLogo: this.firstString(
            marketProject?.logo,
            holding?.projectLogoUrl,
            entry?.icoProject?.logoUrl,
            entry?.canonicalProject?.metadata?.logo
          ),
          category: this.firstString(
            marketProject?.category,
            marketProject?.niche,
            Array.isArray(entry?.icoProject?.categories)
              ? entry.icoProject.categories[0]
              : "",
            "Other"
          ),
          roundName,
          roundDate,
          tokenPrice,
          currentPrice,
          currentRoi: currentPrice / tokenPrice,
        });
      });
    });

    return candidates;
  }

  private selectTopFundRoiCandidates(
    candidates: FundRoiCandidate[],
    limit: number
  ): FundRoiCandidate[] {
    const bestByProject = new Map<string, FundRoiCandidate>();

    candidates.forEach((candidate) => {
      const current = bestByProject.get(candidate.projectKey);
      if (!current || this.compareFundRoiCandidates(candidate, current) < 0) {
        bestByProject.set(candidate.projectKey, candidate);
      }
    });

    return Array.from(bestByProject.values())
      .sort((left, right) => this.compareFundRoiCandidates(left, right))
      .slice(0, limit);
  }

  private compareFundRoiCandidates(
    left: FundRoiCandidate,
    right: FundRoiCandidate
  ): number {
    const roiDiff = right.currentRoi - left.currentRoi;
    if (roiDiff) return roiDiff;
    const dateDiff = right.roundDate.getTime() - left.roundDate.getTime();
    if (dateDiff) return dateDiff;
    return left.projectName.localeCompare(right.projectName);
  }

  private async buildFundRoiPerformanceChart(
    candidates: FundRoiCandidate[],
    fundName: string
  ): Promise<Record<string, any>> {
    const lines = candidates.map((candidate, index) => ({
      label: [candidate.projectName, candidate.roundName]
        .filter(Boolean)
        .join(" - "),
      color: FUND_ROI_LINE_COLORS[index] || FUND_ROI_LINE_COLORS[0],
    }));
    const series = await Promise.all(
      candidates.map(async (candidate) => ({
        candidate,
        byTab: await this.loadFundRoiSeriesByTab(candidate),
      }))
    );
    const dataByTab = FUND_ROI_PERFORMANCE_TABS.reduce((acc, tab) => {
      acc[tab] = this.buildFundRoiTabData(tab, series, fundName);
      return acc;
    }, {} as Record<FundPerformanceTab, any[]>);
    const leftLabelsByTab = FUND_ROI_PERFORMANCE_TABS.reduce((acc, tab) => {
      acc[tab] = this.buildFundRoiLabels(
        this.fundRoiValuesForTab(dataByTab[tab] || [], candidates.length)
      );
      return acc;
    }, {} as Record<FundPerformanceTab, number[]>);
    const leftLabels = leftLabelsByTab["30D"] || this.buildFundRoiLabels([]);

    return {
      lines,
      dataByTab,
      byTab: dataByTab,
      leftLabels,
      leftLabelsByTab,
      labels: leftLabels,
      selectedRounds: candidates.map((candidate) =>
        this.serializeFundRoiRound(candidate)
      ),
      meta: {
        tabs: FUND_ROI_PERFORMANCE_TABS,
      },
    };
  }

  private async loadFundRoiSeriesByTab(
    candidate: FundRoiCandidate
  ): Promise<Record<FundPerformanceTab, any[]>> {
    const pairs = await Promise.all(
      FUND_ROI_PERFORMANCE_TABS.map(async (tab) => {
        const response = await this.marketChartReadService.getMarketAssetChart(
          candidate.marketAssetId,
          { range: this.marketRangeForFundRoiTab(tab) }
        );
        const startDate = this.fundRoiTabStartDate(tab);
        const points = (Array.isArray(response?.points) ? response.points : [])
          .map((point: any) => {
            const timestamp = this.toFiniteNumber(point?.timestamp);
            const price = this.firstNumber(
              point?.price?.USD,
              point?.priceUsd,
              point?.price
            );
            if (timestamp === undefined || price === undefined || price <= 0)
              return null;
            if (startDate && timestamp < startDate.getTime()) return null;

            return {
              timestamp,
              date: new Date(timestamp),
              price,
            };
          })
          .filter(Boolean);

        return [tab, points] as [FundPerformanceTab, any[]];
      })
    );

    return pairs.reduce((acc, [tab, points]) => {
      acc[tab] = points;
      return acc;
    }, {} as Record<FundPerformanceTab, any[]>);
  }

  private buildFundRoiTabData(
    tab: FundPerformanceTab,
    series: Array<{
      candidate: FundRoiCandidate;
      byTab: Record<FundPerformanceTab, any[]>;
    }>,
    fundName: string
  ): any[] {
    const timestamps = this.buildFundRoiTimeline(tab, series);
    const maxStaleMs = this.maxFundRoiStaleMs(tab, timestamps);

    return timestamps.map((timestamp) => {
      const activeEntries = series.filter((entry) => {
        return entry.candidate.roundDate.getTime() <= timestamp;
      });
      const point: any = {
        name: this.formatFundRoiDate(new Date(timestamp), tab),
        date: new Date(timestamp).toISOString(),
        companyType: fundName,
        totalInvestment: activeEntries.reduce((sum, entry) => {
          return sum + Number(entry.candidate.round?.raisedAmount || 0);
        }, 0),
        keyProjects: activeEntries.slice(0, 3).map((entry) => ({
          name: entry.candidate.projectName,
          amount: Number(entry.candidate.round?.raisedAmount || 0),
          category: entry.candidate.category,
        })),
        categories: activeEntries
          .map((entry) => entry.candidate.category)
          .filter(Boolean),
      };

      series.forEach((entry, index) => {
        if (entry.candidate.roundDate.getTime() > timestamp) {
          point[`investments${index}`] = null;
          return;
        }

        const pricePoint = this.findFundRoiPricePoint(
          entry.byTab[tab] || [],
          timestamp,
          maxStaleMs
        );
        point[`investments${index}`] = pricePoint
          ? this.roundNumber(pricePoint.price / entry.candidate.tokenPrice, 2)
          : null;
      });

      return point;
    });
  }

  private serializeFundRoiRound(
    candidate: FundRoiCandidate
  ): Record<string, any> {
    const roundedCurrentRoi = this.roundNumber(candidate.currentRoi, 2);

    return this.cleanObject({
      id: candidate.roundId,
      roundId: candidate.roundId,
      projectKey: candidate.projectKey,
      projectName: candidate.projectName,
      projectSlug: candidate.projectSlug,
      projectSymbol: candidate.projectSymbol,
      projectLogo: candidate.projectLogo,
      marketAssetId: candidate.marketAssetKey,
      roundName: candidate.roundName,
      roundDate: candidate.roundDate.toISOString(),
      tokenPrice: this.roundNumber(candidate.tokenPrice, 8),
      currentPrice: this.roundNumber(candidate.currentPrice, 8),
      currentRoi: roundedCurrentRoi,
      currentRoiDisplay: `${roundedCurrentRoi}x`,
      role: this.firstString(candidate.participant?.role),
      isLead: Boolean(candidate.participant?.isLead),
      amount: this.roundNumber(candidate.round?.raisedAmount),
      valuation: this.roundNumber(candidate.round?.valuation),
      category: candidate.category,
    });
  }

  private serializeFundRoiSearchItem(
    candidate: FundRoiCandidate
  ): Record<string, any> {
    const round = this.serializeFundRoiRound(candidate);
    const label = [candidate.projectName, candidate.roundName]
      .filter(Boolean)
      .join(" - ");

    return this.cleanObject({
      ...round,
      _id: candidate.roundId,
      id: candidate.roundId,
      name: candidate.projectName,
      label,
      symbol: candidate.projectSymbol,
      logo: candidate.projectLogo,
      image: candidate.projectLogo,
      slug: candidate.projectSlug,
      roundLabel: candidate.roundName,
      searchKey: `${candidate.projectName} ${candidate.projectSymbol} ${candidate.roundName}`,
    });
  }

  private buildFundVolatilityCandidates(
    enrichedHoldings: any[],
    roundsById: Map<string, any>,
    participantsByRoundId: Map<string, any[]>,
    backerId: Types.ObjectId
  ): FundVolatilityCandidate[] {
    const candidatesByAssetId = new Map<string, FundVolatilityCandidate>();

    enrichedHoldings.forEach((entry) => {
      const holding = entry?.holding || {};
      const baseProject = this.serializeBackerProject(
        holding,
        entry?.marketProject,
        entry?.icoProject,
        entry?.canonicalProject
      );
      const marketAssetId = this.toObjectId(
        holding?.marketAssetId || entry?.marketProject?.marketAssetId
      );
      if (!marketAssetId) return;

      const marketAssetKey = this.toIdString(marketAssetId);
      const rounds = this.roundsForHolding(holding, roundsById);
      const participantRounds = rounds.filter((round) => {
        const participants =
          participantsByRoundId.get(this.toIdString(round?._id)) || [];
        return participants.some((participant: any) => {
          return (
            this.toIdString(participant?.backerId) === this.toIdString(backerId)
          );
        });
      });
      const effectiveRounds = participantRounds.length
        ? participantRounds
        : rounds;
      const latestRound =
        effectiveRounds.slice().sort((left, right) => {
          return (
            this.dateNumber(right?.announcedDate || right?.date) -
            this.dateNumber(left?.announcedDate || left?.date)
          );
        })[0] || {};
      const category = this.firstString(
        baseProject.category,
        entry?.marketProject?.category,
        entry?.marketProject?.niche,
        Array.isArray(entry?.icoProject?.categories)
          ? entry.icoProject.categories[0]
          : "",
        "Other"
      );
      const candidate: FundVolatilityCandidate = {
        holding,
        marketProject: entry?.marketProject,
        rounds: effectiveRounds,
        marketAssetId,
        marketAssetKey,
        projectKey: this.firstString(
          baseProject.canonicalProjectId,
          baseProject.id,
          `market:${marketAssetKey}`
        ),
        projectName: this.firstString(
          baseProject.name,
          holding?.projectName,
          "Project"
        ),
        projectSlug: this.firstString(baseProject.slug, holding?.projectSlug),
        projectSymbol: this.firstString(
          baseProject.symbol,
          holding?.projectSymbol
        ),
        projectLogo: this.firstString(baseProject.logo, baseProject.image),
        category,
        investedRound: this.firstString(
          latestRound?.roundName,
          this.humanizeRoundType(latestRound?.roundType),
          this.humanizeRoundType(latestRound?.normalizedRoundType),
          Array.isArray(holding?.roundTypes) ? holding.roundTypes[0] : "",
          "-"
        ),
        roundDate: this.toDate(
          latestRound?.announcedDate ||
            latestRound?.date ||
            holding?.lastRoundDate
        ),
      };
      const current = candidatesByAssetId.get(marketAssetKey);

      if (
        !current ||
        this.dateNumber(candidate.roundDate) >
          this.dateNumber(current.roundDate)
      ) {
        candidatesByAssetId.set(marketAssetKey, candidate);
      }
    });

    return Array.from(candidatesByAssetId.values());
  }

  private serializeFundVolatilityProject(
    candidate: FundVolatilityCandidate,
    points: any[],
    minReturns: number
  ): Record<string, any> {
    const metrics = this.calculateFundVolatilityMetrics(points, minReturns);

    return this.cleanObject({
      _id: candidate.projectKey,
      id: candidate.projectKey,
      projectId: candidate.projectKey,
      marketAssetId: candidate.marketAssetKey,
      name: candidate.projectName,
      slug: candidate.projectSlug,
      symbol: candidate.projectSymbol,
      logo: candidate.projectLogo,
      image: candidate.projectLogo,
      niche: candidate.category,
      category: candidate.category,
      investedRound: candidate.investedRound,
      roundDate: candidate.roundDate?.toISOString(),
      volatility: metrics.volatilityPct,
      volatilityPct: metrics.volatilityPct,
      annualizedVolatilityPct: metrics.volatilityPct,
      rangeVolatilityPct: metrics.rangeVolatilityPct,
      status: metrics.riskLevel,
      riskLevel: metrics.riskLevel,
      dataQuality: metrics.dataQuality,
      pointsCount: metrics.pointsCount,
      returnsCount: metrics.returnsCount,
      availableFrom: metrics.availableFrom,
      availableTo: metrics.availableTo,
    });
  }

  private calculateFundVolatilityMetrics(
    points: any[],
    minReturns: number
  ): Record<string, any> {
    const pricePoints = (Array.isArray(points) ? points : [])
      .map((point) => ({
        timestamp: this.toFiniteNumber(point?.timestamp),
        price: this.toFiniteNumber(point?.price),
      }))
      .filter((point): point is { timestamp: number; price: number } => {
        return (
          point.timestamp !== undefined &&
          point.price !== undefined &&
          point.price > 0
        );
      })
      .sort((left, right) => left.timestamp - right.timestamp);
    const returns: number[] = [];

    for (let index = 1; index < pricePoints.length; index += 1) {
      const previousPrice = pricePoints[index - 1].price;
      const currentPrice = pricePoints[index].price;
      const dailyReturn = Math.log(currentPrice / previousPrice);

      if (Number.isFinite(dailyReturn)) returns.push(dailyReturn);
    }

    const availableFrom = pricePoints[0]
      ? new Date(pricePoints[0].timestamp).toISOString()
      : undefined;
    const availableTo = pricePoints[pricePoints.length - 1]
      ? new Date(pricePoints[pricePoints.length - 1].timestamp).toISOString()
      : undefined;

    if (returns.length < minReturns) {
      return {
        riskLevel: "Insufficient",
        dataQuality: pricePoints.length
          ? "insufficient_history"
          : "missing_history",
        pointsCount: pricePoints.length,
        returnsCount: returns.length,
        availableFrom,
        availableTo,
      };
    }

    const mean = this.average(returns);
    const variance =
      returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
      Math.max(returns.length - 1, 1);
    const dailyVolatility = Math.sqrt(Math.max(variance, 0));
    const volatilityPct = this.roundNumber(
      dailyVolatility * Math.sqrt(365) * 100,
      1
    );
    const rangeVolatilityPct = this.roundNumber(
      dailyVolatility * Math.sqrt(returns.length) * 100,
      1
    );

    return {
      volatilityPct,
      rangeVolatilityPct,
      riskLevel: this.fundVolatilityRiskLevel(volatilityPct),
      dataQuality: "ok",
      pointsCount: pricePoints.length,
      returnsCount: returns.length,
      availableFrom,
      availableTo,
    };
  }

  private fundVolatilityRiskLevel(value: number): "Low" | "Medium" | "High" {
    if (value >= FUND_VOLATILITY_RISK_THRESHOLDS.high) return "High";
    if (value >= FUND_VOLATILITY_RISK_THRESHOLDS.medium) return "Medium";
    return "Low";
  }

  private sortFundVolatilityItems(
    items: Array<Record<string, any>>,
    sortBy: FundVolatilitySortField,
    sortOrder: "asc" | "desc"
  ): Array<Record<string, any>> {
    const direction = sortOrder === "asc" ? 1 : -1;
    const riskWeight: Record<string, number> = {
      Insufficient: 0,
      Low: 1,
      Medium: 2,
      High: 3,
    };
    const valueForSort = (item: Record<string, any>): string | number => {
      if (sortBy === "volatility") return Number(item.volatility);
      if (sortBy === "status")
        return riskWeight[item.riskLevel || item.status] || 0;
      return this.cleanString(item[sortBy]).toLowerCase();
    };

    return items.slice().sort((left, right) => {
      const leftValue = valueForSort(left);
      const rightValue = valueForSort(right);
      const leftMissing =
        sortBy === "volatility" && !Number.isFinite(Number(leftValue));
      const rightMissing =
        sortBy === "volatility" && !Number.isFinite(Number(rightValue));

      if (leftMissing && rightMissing)
        return this.cleanString(left.name).localeCompare(
          this.cleanString(right.name)
        );
      if (leftMissing) return 1;
      if (rightMissing) return -1;

      if (typeof leftValue === "number" && typeof rightValue === "number") {
        const diff = leftValue - rightValue;
        if (diff) return diff * direction;
      } else {
        const diff = String(leftValue).localeCompare(String(rightValue));
        if (diff) return diff * direction;
      }

      return this.cleanString(left.name).localeCompare(
        this.cleanString(right.name)
      );
    });
  }

  private normalizeFundVolatilitySortField(
    value: any
  ): FundVolatilitySortField {
    const normalized = this.cleanString(value).toLowerCase();
    if (
      normalized === "name" ||
      normalized === "asset" ||
      normalized === "project"
    )
      return "name";
    if (normalized === "investedround" || normalized === "round")
      return "investedRound";
    if (
      normalized === "status" ||
      normalized === "risk" ||
      normalized === "risklevel"
    )
      return "status";
    return "volatility";
  }

  private normalizeFundVolatilityRange(value: any): string {
    const normalized = this.cleanString(value)
      .toUpperCase()
      .replace(/[\s_-]+/g, "");

    if (normalized === "24H") return "24H";
    if (normalized === "7D") return "7D";
    if (normalized === "30D" || normalized === "1M") return "30D";
    if (normalized === "90D" || normalized === "3M") return "90D";
    if (normalized === "6M") return "6M";
    if (normalized === "1Y") return "1Y";
    if (
      normalized === "ALL" ||
      normalized === "ALLTIME" ||
      normalized === "MAX"
    )
      return "ALL";
    return "90D";
  }

  private emptyFundMarketFootprintByTab(): Record<
    FundMarketFootprintTab,
    any[]
  > {
    return FUND_MARKET_FOOTPRINT_TABS.reduce((acc, tab) => {
      acc[tab] = [];
      return acc;
    }, {} as Record<FundMarketFootprintTab, any[]>);
  }

  private buildFundMarketFootprintProjects(
    enrichedHoldings: any[],
    roundsById: Map<string, any>
  ): FundMarketFootprintProject[] {
    return enrichedHoldings
      .map((entry) => {
        const holding = entry?.holding || {};
        const baseProject = this.serializeBackerProject(
          holding,
          entry?.marketProject,
          entry?.icoProject,
          entry?.canonicalProject
        );
        const rounds = this.roundsForHolding(holding, roundsById);
        const marketCap =
          this.firstNumber(
            entry?.marketProject?.marketCap,
            entry?.marketProject?.usdQuote?.market_cap
          ) || 0;
        const fdv =
          this.firstNumber(
            entry?.marketProject?.fullyDilutedMarketCap,
            entry?.marketProject?.usdQuote?.fully_diluted_market_cap
          ) || 0;
        const marketValue = marketCap > 0 ? marketCap : fdv;
        const marketValueType: FundMarketFootprintProject["marketValueType"] =
          marketCap > 0 ? "marketCap" : fdv > 0 ? "fdv" : "";
        const footprintRounds = rounds
          .map((round) => {
            const raisedAmount = this.firstNumber(round?.raisedAmount) || 0;
            const date = this.toDate(
              round?.announcedDate || round?.date || holding?.lastRoundDate
            );

            return {
              id: this.toIdString(round?._id),
              name: this.firstString(
                round?.roundName,
                this.humanizeRoundType(round?.roundType),
                this.humanizeRoundType(round?.normalizedRoundType),
                "Round"
              ),
              date,
              raisedAmount,
            };
          })
          .filter((round) => round.id || round.raisedAmount > 0 || round.date);
        const totalRaisedFromRounds = footprintRounds.reduce(
          (sum, round) => sum + Number(round.raisedAmount || 0),
          0
        );
        const totalRaised =
          this.firstNumber(
            holding?.totalKnownRaisedAmountUsd,
            totalRaisedFromRounds
          ) || 0;
        const category = this.firstString(
          baseProject.category,
          entry?.marketProject?.category,
          entry?.marketProject?.niche,
          Array.isArray(entry?.icoProject?.categories)
            ? entry.icoProject.categories[0]
            : "",
          "Other"
        );

        return {
          id: this.firstString(
            baseProject.id,
            baseProject._id,
            this.toIdString(holding?._id)
          ),
          name: this.firstString(
            baseProject.name,
            holding?.projectName,
            "Project"
          ),
          slug: this.firstString(baseProject.slug, holding?.projectSlug),
          symbol: this.firstString(baseProject.symbol, holding?.projectSymbol),
          logo: this.firstString(baseProject.logo, baseProject.image),
          category,
          marketValue,
          marketValueType,
          marketCap,
          fdv,
          totalRaised,
          rounds: footprintRounds,
        };
      })
      .filter((project) => project.name && project.marketValue > 0);
  }

  private buildFundMarketFootprintCategories(
    projects: FundMarketFootprintProject[],
    tab: FundMarketFootprintTab
  ): any[] {
    const grouped = new Map<string, any>();

    projects.forEach((project) => {
      const raisedForPeriod = this.fundMarketFootprintRaisedForTab(
        project,
        tab
      );
      if (raisedForPeriod <= 0 && project.marketValue <= 0) return;
      if (tab !== "All Time" && raisedForPeriod <= 0) return;

      const categoryName = this.firstString(project.category, "Other");
      const category =
        grouped.get(categoryName) ||
        ({
          name: categoryName,
          a: 0,
          b: 0,
          items: [],
        } as any);

      category.a += raisedForPeriod;
      category.b += project.marketValue;
      category.items.push(
        this.cleanObject({
          id: project.id,
          logo: project.logo,
          name: project.name,
          symbol: project.symbol,
          slug: project.slug,
          nich: categoryName,
          a: this.roundNumber(raisedForPeriod),
          b: this.roundNumber(project.marketValue),
          marketCap: this.roundNumber(project.marketCap),
          fdv: this.roundNumber(project.fdv),
          marketValueType: project.marketValueType,
        })
      );
      grouped.set(categoryName, category);
    });

    return Array.from(grouped.values())
      .map((category) => ({
        ...category,
        a: this.roundNumber(category.a),
        b: this.roundNumber(category.b),
        items: category.items
          .sort((left: any, right: any) => {
            const valueDiff = Number(right.b || 0) - Number(left.b || 0);
            if (valueDiff) return valueDiff;
            return Number(right.a || 0) - Number(left.a || 0);
          })
          .slice(0, 4),
      }))
      .filter((category) => category.a > 0 || category.b > 0)
      .sort((left, right) => {
        const valueDiff = Number(right.b || 0) - Number(left.b || 0);
        if (valueDiff) return valueDiff;
        return Number(right.a || 0) - Number(left.a || 0);
      })
      .slice(0, 8);
  }

  private fundMarketFootprintRaisedForTab(
    project: FundMarketFootprintProject,
    tab: FundMarketFootprintTab
  ): number {
    if (tab === "All Time") {
      return (
        project.totalRaised ||
        project.rounds.reduce((sum, round) => {
          return sum + Number(round.raisedAmount || 0);
        }, 0)
      );
    }

    const startDate = this.fundMarketFootprintTabStartDate(tab);
    if (!startDate) return project.totalRaised;

    return project.rounds
      .filter((round) => round.date && round.date >= startDate)
      .reduce((sum, round) => sum + Number(round.raisedAmount || 0), 0);
  }

  private fundMarketFootprintTabStartDate(
    tab: FundMarketFootprintTab
  ): Date | undefined {
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;

    if (tab === "30D") return new Date(now.getTime() - 30 * day);
    if (tab === "90D") return new Date(now.getTime() - 90 * day);
    if (tab === "6M") return new Date(now.getTime() - 183 * day);
    if (tab === "YTD") return new Date(now.getFullYear(), 0, 1);
    return undefined;
  }

  private normalizeFundComparisonSection(value: any): FundComparisonSection {
    const section = this.cleanString(value)
      .replace(/[\s_-]+/g, "")
      .toLowerCase();
    const sectionByKey: Record<string, FundComparisonSection> = {
      all: "all",
      table: "table",
      comparisontable: "table",
      roitrend: "roiTrend",
      trend: "roiTrend",
      chart: "roiTrend",
      riskscatter: "riskScatter",
      scatter: "riskScatter",
      bestworst: "bestWorst",
      bestandworst: "bestWorst",
      performing: "bestWorst",
      entryageroi: "entryAgeRoi",
      entryage: "entryAgeRoi",
      age: "entryAgeRoi",
    };

    return sectionByKey[section] || "all";
  }

  private normalizeFundComparisonSearchScope(
    value: any
  ): FundComparisonSearchScope {
    const scope = this.cleanString(value)
      .replace(/[\s_-]+/g, "")
      .toLowerCase();
    if (
      scope === "riskscatter" ||
      scope === "scatter" ||
      scope === "volatility"
    ) {
      return "riskScatter";
    }
    return "roiTrend";
  }

  private parseFundComparisonPeerKeys(
    query: Record<string, any>
  ): string[] | undefined {
    if (
      !Object.prototype.hasOwnProperty.call(query, "peerIds") &&
      !Object.prototype.hasOwnProperty.call(query, "peers") &&
      !Object.prototype.hasOwnProperty.call(query, "compare")
    ) {
      return undefined;
    }

    const values = this.values(query.peerIds || query.peers || query.compare);
    if (
      !values.length ||
      values.some((value) =>
        ["__empty", "empty", "none", "null"].includes(value.toLowerCase())
      )
    ) {
      return [];
    }

    return this.uniqueStrings(values).slice(
      0,
      FUND_COMPARISON_MAX_SELECTED_PEERS
    );
  }

  private fundComparisonSearchExcludeKeys(
    currentBacker: any,
    query: Record<string, any>
  ): Set<string> {
    const values = [
      currentBacker?.backerId,
      currentBacker?._id,
      currentBacker?.routeId,
      currentBacker?.slug,
      ...this.values(query.exclude || query.excludeIds || query.selectedIds),
    ];

    return new Set(
      values
        .map((value) =>
          this.cleanString(this.toIdString(value) || value).toLowerCase()
        )
        .filter(Boolean)
    );
  }

  private isFundComparisonSearchExcluded(
    row: any,
    excludeKeys: Set<string>
  ): boolean {
    return [row?.backerId, row?._id, row?.routeId, row?.slug, row?.id].some(
      (value) => {
        const key = this.cleanString(
          this.toIdString(value) || value
        ).toLowerCase();
        return key && excludeKeys.has(key);
      }
    );
  }

  private async findFundComparisonSearchCandidates(
    backerType: FomoV2BackerType,
    search: string,
    excludeKeys: Set<string>,
    limit: number
  ): Promise<any[]> {
    const match: Record<string, any> = {
      backerType,
      visible: true,
    };

    if (search) {
      const regex = new RegExp(this.escapeRegExp(search), "i");
      match.$or = [
        { name: regex },
        { slug: regex },
        { routeId: regex },
        { niche: regex },
        { sectors: regex },
        { tags: regex },
        { searchTokens: { $in: this.keys([search]) } },
      ];
    }

    const rows = await this.listReadModel
      .find(match)
      .sort({ supportedProjectsCount: -1, roi: -1, name: 1 })
      .limit(Math.min(Math.max(limit * 2, limit), 160))
      .lean()
      .exec();

    return (rows as any[])
      .filter((row) => !this.isFundComparisonSearchExcluded(row, excludeKeys))
      .slice(0, limit);
  }

  private isFundComparisonMetricEligibleForSearch(
    metric: any,
    scope: FundComparisonSearchScope
  ): boolean {
    if (!metric) return false;
    if (scope === "roiTrend") return metric.roiCandidates.length > 0;

    return (
      this.toFiniteNumber(metric.averageProjectRoi) !== undefined &&
      this.toFiniteNumber(metric.volatilityPct) !== undefined &&
      metric.volatilityDataQuality === "ok"
    );
  }

  private toFundComparisonSearchItem(
    metric: any,
    scope: FundComparisonSearchScope
  ): any {
    const fund = metric.fund || {};
    const roiCandidates = Number(metric.roiCandidates?.length || 0);
    const volatilityPct = this.toFiniteNumber(metric.volatilityPct);
    const averageProjectRoi = this.toFiniteNumber(metric.averageProjectRoi);
    const metricLabel =
      scope === "riskScatter"
        ? [
            volatilityPct !== undefined
              ? `${this.roundNumber(volatilityPct, 1)}% vol`
              : "",
            metric.riskLevel,
            averageProjectRoi !== undefined
              ? `${this.roundNumber(averageProjectRoi, 2)}x avg ROI`
              : "",
          ]
            .filter(Boolean)
            .join(" - ")
        : [
            averageProjectRoi !== undefined
              ? `${this.roundNumber(averageProjectRoi, 2)}x avg ROI`
              : "",
            roiCandidates ? `${roiCandidates} assets` : "",
          ]
            .filter(Boolean)
            .join(" - ");

    return this.cleanObject({
      ...fund,
      id: this.firstString(fund.id, fund.routeId, fund.slug, fund.backerId),
      label: fund.name,
      metricLabel,
      currentRoiDisplay:
        averageProjectRoi !== undefined
          ? `${this.roundNumber(averageProjectRoi, 2)}x avg ROI`
          : undefined,
      eligibility: {
        scope,
        roiCandidates,
        averageProjectRoi:
          averageProjectRoi === undefined
            ? undefined
            : this.roundNumber(averageProjectRoi, 2),
        volatilityPct:
          volatilityPct === undefined
            ? undefined
            : this.roundNumber(volatilityPct, 1),
        volatilityAssets: metric.volatilityAssets,
        volatilityAssetsTotal: metric.volatilityAssetsTotal,
        riskLevel: metric.riskLevel,
        dataQuality: metric.volatilityDataQuality,
      },
    });
  }

  private emptyFundComparison(backerKey: string, error?: string) {
    const emptyByTab = FUND_COMPARISON_TABS.reduce((acc, tab) => {
      acc[tab] = [];
      return acc;
    }, {} as Record<FundComparisonTab, any[]>);

    return {
      ok: !error,
      isSuccess: !error,
      error,
      backer: { id: backerKey },
      peers: [],
      table: { rows: [] },
      roiTrend: {
        lines: [],
        dataByTab: emptyByTab,
        byTab: emptyByTab,
        leftLabels: this.buildFundRoiLabels([]),
        leftLabelsByTab: FUND_COMPARISON_TABS.reduce((acc, tab) => {
          acc[tab] = this.buildFundRoiLabels([]);
          return acc;
        }, {} as Record<FundComparisonTab, number[]>),
      },
      riskScatter: { items: [], categories: [] },
      bestWorst: { rows: [] },
      entryAgeRoi: { categories: [] },
      meta: {
        tabs: FUND_COMPARISON_TABS,
        funds: 0,
      },
    };
  }

  private async selectFundComparisonPeers(
    backerType: FomoV2BackerType,
    backer: any,
    peerLimit: number,
    query: Record<string, any>
  ): Promise<any[]> {
    const backerId = this.toObjectId(backer?.backerId);
    if (!backerId) return [];

    const requestedPeerKeys = Array.isArray(query.requestedPeerKeys)
      ? query.requestedPeerKeys
      : this.parseFundComparisonPeerKeys(query);

    if (requestedPeerKeys !== undefined) {
      if (!requestedPeerKeys.length) return [];

      const requestedPeers = await Promise.all(
        requestedPeerKeys
          .slice(0, Math.max(peerLimit, 0))
          .map((key) => this.resolveBackerListItem(backerType, key))
      );

      return requestedPeers
        .filter((peer) => {
          return (
            peer && this.toIdString(peer.backerId) !== this.toIdString(backerId)
          );
        })
        .slice(0, peerLimit);
    }

    const currentProjectIds = await this.holdingModel.distinct(
      "canonicalProjectId",
      {
        backerId,
      }
    );
    const selectedById = new Map<string, any>();

    if (currentProjectIds.length) {
      const overlapRows = await this.holdingModel
        .aggregate([
          {
            $match: {
              canonicalProjectId: { $in: currentProjectIds },
              backerId: { $ne: backerId },
            },
          },
          {
            $group: {
              _id: "$backerId",
              overlapProjects: { $sum: 1 },
              marketProjects: {
                $sum: { $cond: [{ $eq: ["$hasMarketData", true] }, 1, 0] },
              },
            },
          },
          { $sort: { overlapProjects: -1, marketProjects: -1 } },
          { $limit: peerLimit * 8 },
        ])
        .allowDiskUse(true)
        .exec();
      const overlapByBackerId = new Map(
        (overlapRows as any[]).map((row) => [this.toIdString(row?._id), row])
      );
      const overlapBackers = await this.loadBackerListByIds(
        (overlapRows as any[])
          .map((row) => this.toObjectId(row?._id))
          .filter((id): id is Types.ObjectId => Boolean(id))
      );

      overlapBackers
        .filter((peer) => peer?.backerType === backerType)
        .sort((left, right) => {
          const leftOverlap = Number(
            overlapByBackerId.get(this.toIdString(left?.backerId))
              ?.overlapProjects || 0
          );
          const rightOverlap = Number(
            overlapByBackerId.get(this.toIdString(right?.backerId))
              ?.overlapProjects || 0
          );
          if (rightOverlap !== leftOverlap) return rightOverlap - leftOverlap;
          return (
            Number(right?.supportedProjectsCount || 0) -
            Number(left?.supportedProjectsCount || 0)
          );
        })
        .forEach((peer) => {
          if (selectedById.size >= peerLimit) return;
          selectedById.set(this.toIdString(peer.backerId), peer);
        });
    }

    if (selectedById.size < peerLimit) {
      const excludeIds = [
        backerId,
        ...Array.from(selectedById.keys())
          .map((id) => this.toObjectId(id))
          .filter((id): id is Types.ObjectId => Boolean(id)),
      ];
      const nicheKeys = this.values(
        backer?.nicheKeys || backer?.sectorKeys || []
      )
        .map((value) => this.cleanString(value))
        .filter(Boolean);
      const similarMatch: Record<string, any> = {
        backerType,
        visible: true,
        backerId: { $nin: excludeIds },
      };

      if (nicheKeys.length) {
        similarMatch.$or = [
          { nicheKeys: { $in: nicheKeys } },
          { sectorKeys: { $in: nicheKeys } },
        ];
      }

      const similarBackers = await this.listReadModel
        .find(similarMatch)
        .sort({ supportedProjectsCount: -1, roi: -1, name: 1 })
        .limit(peerLimit - selectedById.size)
        .lean()
        .exec();

      (similarBackers as any[]).forEach((peer) => {
        selectedById.set(this.toIdString(peer.backerId), peer);
      });
    }

    return Array.from(selectedById.values()).slice(0, peerLimit);
  }

  private async buildFundComparisonContext(
    funds: any[],
    options: FundComparisonContextOptions = {}
  ) {
    const includePriceSeries = options.includePriceSeries !== false;
    const priceRange = options.priceRange || "ALL";
    const fundIds = this.uniqueObjectIds(funds.map((fund) => fund?.backerId));
    const holdings = await this.holdingModel
      .find({ backerId: { $in: fundIds } })
      .sort({
        backerId: 1,
        hasMarketData: -1,
        lastRoundDate: -1,
        projectName: 1,
      })
      .lean()
      .exec();
    const roundIds = this.uniqueObjectIds(
      (holdings as any[]).flatMap((holding) => holding?.roundIds || [])
    );
    const [rounds, participants, enrichedHoldings] = await Promise.all([
      this.loadRounds(roundIds),
      this.loadRoundParticipants(roundIds),
      this.enrichHoldings(holdings as any[]),
    ]);
    const marketAssetIds = this.uniqueObjectIds([
      ...(rounds as any[]).map((round) => round?.marketAssetId),
      ...(holdings as any[]).map((holding) => holding?.marketAssetId),
      ...enrichedHoldings.map((entry) => entry?.marketProject?.marketAssetId),
    ]);
    const [marketProjectsByAssetId, priceSeriesByAssetId] = await Promise.all([
      this.loadMarketProjectsByAssetIds(marketAssetIds),
      includePriceSeries
        ? this.marketChartReadService.getMarketAssetDailyPriceSeries(
            marketAssetIds,
            {
              range: priceRange,
            }
          )
        : Promise.resolve(new Map<string, any[]>()),
    ]);

    return {
      holdings: holdings as any[],
      holdingsByBackerId: this.groupByString(
        holdings as any[],
        (holding: any) => this.toIdString(holding?.backerId)
      ),
      enrichedHoldingsByBackerId: this.groupByString(
        enrichedHoldings,
        (entry: any) => this.toIdString(entry?.holding?.backerId)
      ),
      rounds: rounds as any[],
      roundsById: new Map(
        (rounds as any[]).map((round) => [this.toIdString(round?._id), round])
      ),
      participantsByRoundId: this.groupByString(
        participants,
        (participant: any) => this.toIdString(participant?.fundingRoundId)
      ),
      marketProjectsByAssetId,
      priceSeriesByAssetId,
      priceSeriesRange: includePriceSeries ? priceRange : undefined,
      hasPriceSeries: includePriceSeries,
      marketAssetIds,
    };
  }

  private buildFundComparisonMetric(
    fund: any,
    context: any,
    isCurrent: boolean,
    options: FundComparisonMetricOptions = {}
  ): any {
    const requirePriceSeriesForRoi = options.requirePriceSeriesForRoi !== false;
    const includeVolatility = options.includeVolatility !== false;
    const backerId = this.toObjectId(fund?.backerId);
    const backerKey = this.toIdString(backerId);
    const holdings = context.holdingsByBackerId.get(backerKey) || [];
    const enrichedHoldings =
      context.enrichedHoldingsByBackerId.get(backerKey) || [];
    const roiCandidates = backerId
      ? this.buildFundRoiCandidates(
          enrichedHoldings,
          context.roundsById,
          context.participantsByRoundId,
          backerId,
          context.marketProjectsByAssetId
        ).filter((candidate) => {
          if (!requirePriceSeriesForRoi) return true;
          return (
            context.priceSeriesByAssetId.get(candidate.marketAssetKey) || []
          ).length;
        })
      : [];
    const projectCandidates =
      this.bestFundComparisonCandidatesByProject(roiCandidates);
    const averageProjectRoi = this.average(
      projectCandidates.map((candidate) => candidate.currentRoi)
    );
    const bestInvestment = projectCandidates[0];
    const worstInvestment =
      this.selectFundComparisonWorstInvestment(projectCandidates);
    const volatility = includeVolatility
      ? this.calculateFundComparisonVolatility(
          enrichedHoldings,
          context.priceSeriesByAssetId
        )
      : {
          riskLevel: "Insufficient",
          dataQuality: "not_requested",
          assets: 0,
        };
    const portfolioRoundsRaised = this.sumFundComparisonRaised(
      holdings,
      context.roundsById
    );

    return {
      fund: this.toFundComparisonBacker(fund),
      isCurrent,
      holdingsCount: holdings.length,
      marketHoldingsCount: holdings.filter((holding: any) =>
        Boolean(holding?.hasMarketData)
      ).length,
      portfolioRoundsRaised,
      averageProjectRoi: this.roundNumber(averageProjectRoi, 2),
      bestInvestment,
      worstInvestment,
      volatilityPct: volatility.volatilityPct,
      riskLevel: volatility.riskLevel,
      volatilityDataQuality: volatility.dataQuality,
      volatilityAssets: volatility.assets,
      volatilityAssetsTotal: volatility.assetsTotal,
      roiCandidates: projectCandidates,
      categories: this.uniqueStrings([
        fund?.niche,
        ...(Array.isArray(fund?.sectors) ? fund.sectors : []),
        ...projectCandidates.map((candidate) => candidate.category),
      ]).slice(0, 4),
    };
  }

  private bestFundComparisonCandidatesByProject(
    candidates: FundRoiCandidate[]
  ): FundRoiCandidate[] {
    const bestByProject = new Map<string, FundRoiCandidate>();

    candidates.forEach((candidate) => {
      const current = bestByProject.get(candidate.projectKey);
      if (!current || this.compareFundRoiCandidates(candidate, current) < 0) {
        bestByProject.set(candidate.projectKey, candidate);
      }
    });

    return Array.from(bestByProject.values()).sort((left, right) =>
      this.compareFundRoiCandidates(left, right)
    );
  }

  private selectFundComparisonWorstInvestment(
    candidates: FundRoiCandidate[]
  ): FundRoiCandidate | undefined {
    const lossCandidates = candidates.filter((candidate) => {
      return candidate.currentRoi > 0 && candidate.currentRoi < 1;
    });
    const displayableLossCandidates = lossCandidates.filter((candidate) => {
      return candidate.currentRoi >= FUND_COMPARISON_MIN_DISPLAYABLE_LOSS_ROI;
    });
    const pool = displayableLossCandidates.length
      ? displayableLossCandidates
      : lossCandidates.length
      ? lossCandidates
      : candidates;

    return pool
      .slice()
      .sort((left, right) => left.currentRoi - right.currentRoi)[0];
  }

  private sumFundComparisonRaised(
    holdings: any[],
    roundsById: Map<string, any>
  ): number {
    const roundIds = new Set<string>();

    holdings.forEach((holding) => {
      (holding?.roundIds || []).forEach((roundId: any) => {
        const id = this.toIdString(roundId);
        if (id) roundIds.add(id);
      });
    });

    const raisedFromRounds = Array.from(roundIds).reduce((sum, roundId) => {
      return sum + Number(roundsById.get(roundId)?.raisedAmount || 0);
    }, 0);

    if (raisedFromRounds > 0) return this.roundNumber(raisedFromRounds);

    return this.roundNumber(
      holdings.reduce((sum, holding) => {
        return sum + Number(holding?.totalKnownRaisedAmountUsd || 0);
      }, 0)
    );
  }

  private calculateFundComparisonVolatility(
    enrichedHoldings: any[],
    priceSeriesByAssetId: Map<string, any[]>
  ): any {
    const seenAssets = new Set<string>();
    const assetVolatilities = enrichedHoldings
      .map((entry) => {
        const marketAssetId = this.toIdString(
          entry?.holding?.marketAssetId || entry?.marketProject?.marketAssetId
        );
        if (!marketAssetId || seenAssets.has(marketAssetId)) return undefined;
        seenAssets.add(marketAssetId);
        const metrics = this.calculateFundVolatilityMetrics(
          priceSeriesByAssetId.get(marketAssetId) || [],
          FUND_VOLATILITY_MIN_RETURNS
        );
        const volatilityPct = this.toFiniteNumber(metrics.volatilityPct);

        return volatilityPct !== undefined ? volatilityPct : undefined;
      })
      .filter((value): value is number => value !== undefined);
    const volatilityPct = this.roundNumber(this.average(assetVolatilities), 1);

    if (assetVolatilities.length < FUND_COMPARISON_MIN_VOLATILITY_ASSETS) {
      return {
        riskLevel: "Insufficient",
        dataQuality: assetVolatilities.length
          ? "insufficient_assets"
          : "insufficient_history",
        assets: assetVolatilities.length,
        assetsTotal: seenAssets.size,
      };
    }

    return {
      volatilityPct,
      riskLevel: this.fundVolatilityRiskLevel(volatilityPct),
      dataQuality: "ok",
      assets: assetVolatilities.length,
      assetsTotal: seenAssets.size,
    };
  }

  private toFundComparisonTableRow(metric: any): any {
    return this.cleanObject({
      ...metric.fund,
      isCurrent: metric.isCurrent,
      portfolioRoundsRaised: metric.portfolioRoundsRaised,
      totalRaised: metric.portfolioRoundsRaised,
      averageProjectRoi: metric.averageProjectRoi,
      avgRoi: metric.averageProjectRoi,
      bestInvestmentRoi: metric.bestInvestment
        ? this.serializeFundComparisonInvestment(metric.bestInvestment)
        : undefined,
      volatility: metric.volatilityPct,
      volatilityPct: metric.volatilityPct,
      riskLevel: metric.riskLevel,
      holdingsCount: metric.holdingsCount,
      marketHoldingsCount: metric.marketHoldingsCount,
      dataQuality: {
        roiCandidates: metric.roiCandidates.length,
        volatilityAssets: metric.volatilityAssets,
        volatilityAssetsTotal: metric.volatilityAssetsTotal,
        volatility: metric.volatilityDataQuality,
      },
    });
  }

  private toFundComparisonBestWorstRow(metric: any): any {
    return this.cleanObject({
      ...metric.fund,
      isCurrent: metric.isCurrent,
      bestInvestment: metric.bestInvestment
        ? this.serializeFundComparisonInvestment(metric.bestInvestment)
        : undefined,
      worstInvestment: metric.worstInvestment
        ? this.serializeFundComparisonInvestment(metric.worstInvestment)
        : undefined,
      dataQuality: {
        roiCandidates: metric.roiCandidates.length,
      },
    });
  }

  private serializeFundComparisonInvestment(candidate: FundRoiCandidate): any {
    const roi = this.roundFundComparisonRoiMultiplier(candidate.currentRoi);

    return this.cleanObject({
      id: candidate.projectKey,
      roundId: candidate.roundId,
      name: candidate.projectName,
      slug: candidate.projectSlug,
      symbol: candidate.projectSymbol,
      logo: candidate.projectLogo,
      image: candidate.projectLogo,
      category: candidate.category,
      roundName: candidate.roundName,
      roundDate: candidate.roundDate.toISOString(),
      value: roi,
      roi,
      returnPct: this.roundNumber((candidate.currentRoi - 1) * 100, 2),
      tokenPrice: this.roundNumber(candidate.tokenPrice, 8),
      currentPrice: this.roundNumber(candidate.currentPrice, 8),
    });
  }

  private roundFundComparisonRoiMultiplier(value: number): number {
    if (value > 0 && value < 0.01) return this.roundNumber(value, 4);
    if (value > 0 && value < 0.1) return this.roundNumber(value, 3);
    return this.roundNumber(value, 2);
  }

  private buildFundComparisonRoiTrend(
    metrics: any[],
    priceSeriesByAssetId: Map<string, any[]>
  ): any {
    const activeMetrics = metrics.filter(
      (metric) => metric.roiCandidates.length
    );
    const lines = activeMetrics.map((metric, index) => ({
      label: metric.fund.name,
      color:
        FUND_COMPARISON_LINE_COLORS[index % FUND_COMPARISON_LINE_COLORS.length],
    }));
    const dataByTab = FUND_COMPARISON_TABS.reduce((acc, tab) => {
      acc[tab] = this.buildFundComparisonRoiTrendTab(
        tab,
        activeMetrics,
        priceSeriesByAssetId
      );
      return acc;
    }, {} as Record<FundComparisonTab, any[]>);
    const leftLabelsByTab = FUND_COMPARISON_TABS.reduce((acc, tab) => {
      acc[tab] = this.buildFundRoiLabels(
        this.fundRoiValuesForTab(dataByTab[tab], activeMetrics.length)
      );
      return acc;
    }, {} as Record<FundComparisonTab, number[]>);

    return {
      lines,
      dataByTab,
      byTab: dataByTab,
      leftLabels: leftLabelsByTab["30D"] || this.buildFundRoiLabels([]),
      leftLabelsByTab,
      meta: {
        value: "equal-weight average ROI across eligible portfolio projects",
      },
    };
  }

  private buildFundComparisonRoiTrendTab(
    tab: FundComparisonTab,
    metrics: any[],
    priceSeriesByAssetId: Map<string, any[]>
  ): any[] {
    const startDate = this.fundComparisonTabStartDate(tab);
    const startTimestamp = startDate?.getTime();
    const allTimestamps = this.uniqueNumbers(
      metrics.flatMap((metric) => {
        return metric.roiCandidates.flatMap((candidate: FundRoiCandidate) => {
          return (priceSeriesByAssetId.get(candidate.marketAssetKey) || [])
            .map((point) => this.toFiniteNumber(point?.timestamp))
            .filter((timestamp): timestamp is number => {
              return (
                timestamp !== undefined &&
                (!startTimestamp || timestamp >= startTimestamp) &&
                timestamp >= candidate.roundDate.getTime()
              );
            });
        });
      })
    );
    const timestamps = this.downsampleNumberSeries(
      allTimestamps,
      this.maxFundRoiPoints(tab as FundPerformanceTab)
    );
    const maxStaleMs = this.maxFundRoiStaleMs(
      tab as FundPerformanceTab,
      timestamps
    );

    return timestamps
      .map((timestamp) => {
        const point: any = {
          name: this.formatFundRoiDate(
            new Date(timestamp),
            tab as FundPerformanceTab
          ),
          date: new Date(timestamp).toISOString(),
        };

        metrics.forEach((metric, index) => {
          const values = metric.roiCandidates
            .filter((candidate: FundRoiCandidate) => {
              return candidate.roundDate.getTime() <= timestamp;
            })
            .map((candidate: FundRoiCandidate) => {
              const pricePoint = this.findFundRoiPricePoint(
                priceSeriesByAssetId.get(candidate.marketAssetKey) || [],
                timestamp,
                maxStaleMs
              );
              return pricePoint
                ? this.toFiniteNumber(pricePoint.price / candidate.tokenPrice)
                : undefined;
            })
            .filter((value): value is number => value !== undefined);

          point[`investments${index}`] = values.length
            ? this.roundNumber(this.average(values), 2)
            : null;
        });

        return point;
      })
      .filter((point) => {
        return Array.from({ length: metrics.length }, (_, index) => {
          return this.toFiniteNumber(point[`investments${index}`]);
        }).some((value) => value !== undefined);
      });
  }

  private buildFundComparisonRiskScatter(metrics: any[]): any {
    const items = metrics
      .filter((metric) => {
        return (
          this.toFiniteNumber(metric.averageProjectRoi) !== undefined &&
          this.toFiniteNumber(metric.volatilityPct) !== undefined
        );
      })
      .map((metric) => {
        const riskLevel = this.firstString(metric.riskLevel, "Insufficient");
        return this.cleanObject({
          id: metric.fund.id,
          name: metric.fund.name,
          slug: metric.fund.slug,
          logo: metric.fund.logo,
          niche: metric.fund.niche,
          x: metric.volatilityPct,
          y: metric.averageProjectRoi,
          volatility: metric.volatilityPct,
          averageProjectRoi: metric.averageProjectRoi,
          riskLevel,
          color:
            riskLevel === "Low"
              ? "#04A584"
              : riskLevel === "Medium"
              ? "#FFC702"
              : "#FF5858",
          categories: metric.categories,
          dataQuality: {
            roiCandidates: metric.roiCandidates.length,
            volatilityAssets: metric.volatilityAssets,
            volatilityAssetsTotal: metric.volatilityAssetsTotal,
            volatility: metric.volatilityDataQuality,
          },
        });
      });

    return {
      items,
      categories: this.uniqueStrings(
        items.flatMap((item: any) => item.categories || [])
      ).slice(0, 20),
      axes: {
        x: "Portfolio Volatility (%)",
        y: "Average Project ROI (x)",
      },
    };
  }

  private buildFundComparisonEntryAgeRoi(metrics: any[]): any {
    const buckets = [
      { key: "lt1y", name: "< 1 Year", min: 0, max: 365, bgColor: "red" },
      {
        key: "1to2y",
        name: "1-2 Years",
        min: 365,
        max: 365 * 2,
        bgColor: "yellow",
      },
      {
        key: "2to5y",
        name: "2-5 Years",
        min: 365 * 2,
        max: 365 * 5,
        bgColor: "green",
      },
      {
        key: "gt5y",
        name: "> 5 Years",
        min: 365 * 5,
        max: Infinity,
        bgColor: "blue",
      },
    ];
    const now = Date.now();
    const categories = buckets
      .map((bucket) => {
        const entries = metrics.flatMap((metric) => {
          return metric.roiCandidates
            .map((candidate: FundRoiCandidate) => {
              const ageDays =
                (now - candidate.roundDate.getTime()) / (24 * 60 * 60 * 1000);
              if (ageDays < bucket.min || ageDays >= bucket.max) return null;

              return {
                projectKey: candidate.projectKey,
                fundId: metric.fund.id,
                fundName: metric.fund.name,
                logo: candidate.projectLogo,
                name: candidate.projectName,
                niche: candidate.category,
                roundName: candidate.roundName,
                roundDate: candidate.roundDate.toISOString(),
                roi: candidate.currentRoi,
              };
            })
            .filter(Boolean);
        });
        const itemByProjectKey = new Map<string, any>();

        entries.forEach((entry: any) => {
          const projectKey = this.firstString(entry?.projectKey, entry?.name);
          const roi = this.toFiniteNumber(entry?.roi);
          if (!projectKey || roi === undefined) return;

          const current = itemByProjectKey.get(projectKey);
          if (!current) {
            itemByProjectKey.set(projectKey, {
              projectKey,
              logo: entry.logo,
              name: entry.name,
              niche: entry.niche,
              roiValues: [roi],
              fundIds: this.uniqueStrings([entry.fundId]),
              fundNames: this.uniqueStrings([entry.fundName]),
              roundNames: this.uniqueStrings([entry.roundName]),
              roundDates: this.uniqueStrings([entry.roundDate]),
            });
            return;
          }

          current.roiValues.push(roi);
          current.fundIds = this.uniqueStrings([
            ...current.fundIds,
            entry.fundId,
          ]);
          current.fundNames = this.uniqueStrings([
            ...current.fundNames,
            entry.fundName,
          ]);
          current.roundNames = this.uniqueStrings([
            ...current.roundNames,
            entry.roundName,
          ]);
          current.roundDates = this.uniqueStrings([
            ...current.roundDates,
            entry.roundDate,
          ]);
        });
        const items = Array.from(itemByProjectKey.values()).map((item) => {
          const averageProjectRoi = this.roundNumber(
            this.average(item.roiValues),
            2
          );

          return this.cleanObject({
            id: item.projectKey,
            logo: item.logo,
            name: item.name,
            niche: item.niche,
            fundId: item.fundIds[0],
            fundName:
              item.fundNames.length > 1
                ? `${item.fundNames.length} funds`
                : item.fundNames[0],
            fundIds: item.fundIds,
            fundNames: item.fundNames,
            fundsCount: item.fundNames.length,
            roundName:
              item.roundNames.length > 1
                ? `${item.roundNames.length} rounds`
                : item.roundNames[0],
            roundNames: item.roundNames,
            roundDate: item.roundDates[0],
            roundDates: item.roundDates,
            entriesCount: item.roiValues.length,
            a: averageProjectRoi,
            roi: averageProjectRoi,
          });
        });
        const averageRoi = this.average(
          items
            .map((item: any) => this.toFiniteNumber(item?.a))
            .filter((value): value is number => value !== undefined)
        );

        return this.cleanObject({
          key: bucket.key,
          name: bucket.name,
          bgColor: bucket.bgColor,
          a: this.roundNumber(averageRoi, 2),
          items: items
            .sort(
              (left: any, right: any) =>
                Number(right.a || 0) - Number(left.a || 0)
            )
            .slice(0, 8),
        });
      })
      .filter((bucket) => bucket.items?.length);

    return {
      categories,
      value: "Average ROI by portfolio entry age bucket",
    };
  }

  private fundComparisonTabStartDate(tab: FundComparisonTab): Date | undefined {
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    if (tab === "30D") return new Date(now.getTime() - 30 * day);
    if (tab === "90D") return new Date(now.getTime() - 90 * day);
    if (tab === "6M") return new Date(now.getTime() - 183 * day);
    if (tab === "YTD") return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    return undefined;
  }

  private toFundComparisonBacker(backer: any): any {
    const id = this.firstString(
      backer?.routeId,
      backer?.slug,
      this.toIdString(backer?.backerId),
      this.toIdString(backer?._id)
    );
    const backerType = backer?.backerType === "person" ? "person" : "fund";

    return this.cleanObject({
      id,
      backerId: this.toIdString(backer?.backerId || backer?._id),
      backerType,
      name: this.firstString(backer?.name, id),
      slug: this.firstString(backer?.slug, backer?.routeId),
      routeId: backer?.routeId,
      logo: this.firstString(backer?.logo, backer?.avatar),
      avatar: this.firstString(backer?.avatar, backer?.logo),
      niche: this.firstString(
        backer?.niche,
        backer?.type,
        backerType === "person" ? "Angel Investor" : "Fund"
      ),
      roi: this.roundNumber(this.firstNumber(backer?.roi) || 0, 2),
      supportedProjectsCount: Number(
        backer?.supportedProjectsCount || backer?.projectsCount || 0
      ),
    });
  }

  private marketRangeForFundRoiTab(tab: FundPerformanceTab): string {
    if (tab === "30D") return "30D";
    if (tab === "90D") return "90D";
    if (tab === "6M" || tab === "YTD") return "1Y";
    return "ALL";
  }

  private fundRoiTabStartDate(tab: FundPerformanceTab): Date | undefined {
    const now = new Date();
    if (tab === "30D")
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (tab === "90D")
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    if (tab === "6M")
      return new Date(now.getTime() - 183 * 24 * 60 * 60 * 1000);
    if (tab === "YTD") return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    return undefined;
  }

  private maxFundRoiPoints(tab: FundPerformanceTab): number {
    if (tab === "All Time") return 10;
    if (tab === "6M" || tab === "YTD") return 10;
    return 10;
  }

  private maxFundRoiStaleMs(
    tab: FundPerformanceTab,
    timestamps: number[]
  ): number {
    const day = 24 * 60 * 60 * 1000;
    const gaps = timestamps
      .slice(1)
      .map((timestamp, index) => timestamp - timestamps[index])
      .filter((value) => value > 0);
    const averageGap = gaps.length
      ? gaps.reduce((sum, value) => sum + value, 0) / gaps.length
      : 0;
    const rangeMinimum =
      tab === "All Time"
        ? 60 * day
        : tab === "6M" || tab === "YTD" || tab === "90D"
        ? 14 * day
        : 5 * day;

    return Math.max(rangeMinimum, averageGap * 1.5);
  }

  private buildFundRoiTimeline(
    tab: FundPerformanceTab,
    series: Array<{
      candidate: FundRoiCandidate;
      byTab: Record<FundPerformanceTab, any[]>;
    }>
  ): number[] {
    const pointSets = series
      .map((entry) => entry.byTab[tab] || [])
      .filter((points) => points.length);
    const allTimestamps = this.uniqueNumbers(
      pointSets.flatMap((points) => points.map((point) => point.timestamp))
    );

    if (!allTimestamps.length) return [];

    const tabStart =
      this.fundRoiTabStartDate(tab)?.getTime() || allTimestamps[0];
    const firstCommonTimestamp = Math.max(
      tabStart,
      ...pointSets.map((points) => points[0]?.timestamp).filter(Number.isFinite)
    );
    const lastCommonTimestamp = Math.min(
      ...pointSets
        .map((points) => points[points.length - 1]?.timestamp)
        .filter(Number.isFinite)
    );

    if (
      !Number.isFinite(firstCommonTimestamp) ||
      !Number.isFinite(lastCommonTimestamp) ||
      lastCommonTimestamp <= firstCommonTimestamp
    ) {
      return this.downsampleNumberSeries(
        allTimestamps,
        this.maxFundRoiPoints(tab)
      );
    }

    return this.buildEvenTimeline(
      firstCommonTimestamp,
      lastCommonTimestamp,
      this.maxFundRoiPoints(tab)
    );
  }

  private findFundRoiPricePoint(
    points: any[],
    timestamp: number,
    maxDistanceMs: number
  ): any | undefined {
    if (!points.length || timestamp < points[0].timestamp) return undefined;

    let bestPoint: any | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      const distance = Math.abs(point.timestamp - timestamp);
      if (distance > maxDistanceMs) continue;
      if (distance < bestDistance) {
        bestPoint = point;
        bestDistance = distance;
      }
      if (point.timestamp > timestamp && distance > bestDistance) break;
    }

    return bestPoint;
  }

  private fundRoiValuesForTab(points: any[], lineCount: number): number[] {
    return points.flatMap((point) =>
      Array.from({ length: lineCount }, (_, index) =>
        this.toFiniteNumber(point[`investments${index}`])
      ).filter((value): value is number => value !== undefined)
    );
  }

  private buildFundRoiLabels(values: number[]): number[] {
    const maxValue = values.reduce((max, value) => {
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 1);
    const labelMax = Math.max(1, Math.ceil(maxValue));

    return Array.from({ length: 7 }, (_, index) =>
      this.roundNumber(labelMax - (labelMax / 6) * index, 1)
    );
  }

  private formatFundRoiDate(date: Date, tab: FundPerformanceTab): string {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = months[date.getUTCMonth()] || "";
    const day = String(date.getUTCDate()).padStart(2, "0");
    if (tab === "All Time" || tab === "YTD" || tab === "6M") {
      return `${month} ${day} '${String(date.getUTCFullYear()).slice(-2)}`;
    }

    return `${month} ${day}`;
  }

  private uniqueNumbers(values: any[]): number[] {
    return Array.from(
      new Set(
        values
          .map((value) => this.toFiniteNumber(value))
          .filter((value): value is number => value !== undefined)
      )
    ).sort((left, right) => left - right);
  }

  private downsampleNumberSeries(
    values: number[],
    maxPoints: number
  ): number[] {
    if (!values.length || values.length <= maxPoints) return values;
    if (maxPoints <= 1) return [values[values.length - 1]];

    const result: number[] = [];
    const lastIndex = values.length - 1;
    const usedIndexes = new Set<number>();

    for (let index = 0; index < maxPoints; index += 1) {
      const sourceIndex = Math.round((index * lastIndex) / (maxPoints - 1));
      if (usedIndexes.has(sourceIndex)) continue;
      usedIndexes.add(sourceIndex);
      result.push(values[sourceIndex]);
    }

    return result;
  }

  private buildEvenTimeline(
    start: number,
    end: number,
    maxPoints: number
  ): number[] {
    if (maxPoints <= 1 || end <= start) return [end];

    return Array.from({ length: maxPoints }, (_, index) => {
      const timestamp = start + ((end - start) * index) / (maxPoints - 1);
      return Math.round(timestamp);
    });
  }

  private async buildFundPortfolioSummary(
    backerId: Types.ObjectId,
    fundName: string
  ): Promise<Record<string, any>> {
    const holdings = await this.loadBackerHoldings(backerId);
    const roundIds = this.uniqueObjectIds(
      holdings.flatMap((holding: any) => holding?.roundIds || [])
    );
    const [rounds, participants, enrichedHoldings] = await Promise.all([
      this.loadRounds(roundIds),
      this.loadRoundParticipants(roundIds),
      this.enrichHoldings(holdings),
    ]);
    const roundsById = new Map(
      rounds.map((round: any) => [this.toIdString(round?._id), round])
    );
    const participantsByRoundId = this.groupByString(
      participants,
      (participant: any) => this.toIdString(participant?.fundingRoundId)
    );
    const supportedProjects = enrichedHoldings
      .map((entry) => {
        return this.serializeFundSupportedProject(
          entry,
          this.roundsForHolding(entry.holding, roundsById)
        );
      })
      .filter((project) => project.name);
    const categoryDistribution = this.addDistributionIds(
      this.groupAmountsByName(
        supportedProjects.map((project) => ({
          name: project.category || "Other",
          amount: Number(project.amount || 0),
          projectsCount: 1,
        }))
      )
    );
    const fundraisingRounds = this.buildFundraisingRounds(
      enrichedHoldings,
      roundsById,
      participantsByRoundId,
      backerId,
      fundName
    );
    const totalInvested = this.roundNumber(
      categoryDistribution.reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      )
    );

    return {
      categoryDistribution,
      roundsByCategory: categoryDistribution,
      lockedUnlockedDistribution:
        this.buildLockedUnlockedDistribution(supportedProjects),
      fundraisingRounds,
      totalInvested,
      totalAllocated: totalInvested,
      supportedProjectsCount: supportedProjects.length,
      portfolioCoinsCount: supportedProjects.filter(
        (project) => project.hasMarketData
      ).length,
    };
  }

  private roundsForHolding(holding: any, roundsById: Map<string, any>): any[] {
    return (holding?.roundIds || [])
      .map((roundId: any) => roundsById.get(this.toIdString(roundId)))
      .filter(Boolean);
  }

  private normalizeSocialLinks(...sources: any[]): Record<string, string> {
    const result: Record<string, string> = {};

    sources.forEach((source) => {
      const links = source?.socialLinks || source?.socials || {};
      Object.entries(links).forEach(([key, value]) => {
        const normalized = this.cleanUrl(value);
        if (key && normalized && !result[key]) result[key] = normalized;
      });
      [
        ["website", source?.websiteUrl || source?.website],
        ["twitter", source?.twitterUrl],
        ["linkedin", source?.linkedinUrl],
      ].forEach(([key, value]) => {
        const normalized = this.cleanUrl(value);
        if (normalized && !result[key]) result[key] = normalized;
      });
      (Array.isArray(source?.socialmedia) ? source.socialmedia : []).forEach(
        (item: any) => {
          const key = this.firstString(
            item?.name,
            item?.key,
            item?.type
          ).toLowerCase();
          const normalized = this.cleanUrl(
            item?.href || item?.url || item?.link
          );
          if (key && normalized && !result[key]) result[key] = normalized;
        }
      );
    });

    return result;
  }

  private toSocialMedia(
    links: Record<string, string>
  ): Array<Record<string, string>> {
    return Object.entries(links)
      .filter(([, href]) => Boolean(href))
      .map(([name, href]) => ({ name, href }));
  }

  private serializeGeographyInvestor(
    participant: any,
    backer: any,
    region: string,
    round?: any
  ): any {
    const geographyRound = this.serializeGeographyRound(round, participant);
    const rounds = geographyRound ? [geographyRound] : [];

    return this.cleanObject({
      slug: this.firstString(
        backer?.routeId,
        backer?.slug,
        participant?.sourceBackerSlug
      ),
      name: this.firstString(backer?.name, participant?.backerName),
      logo: this.firstString(backer?.logo, backer?.avatar),
      category: this.firstString(backer?.type, backer?.niche),
      country: backer?.country || null,
      region,
      matchedBy: "funding_round_participants",
      portfolioProjectsCount: Number(
        backer?.supportedProjectsCount || backer?.projectsCount || 0
      ),
      portfolioProjectsPreview: backer?.supportedProjectsPreview || [],
      coInvestmentsCount: 0,
      coInvestorsPreview: [],
      rounds,
      roundCount: rounds.length,
      additionalRoundsCount: Math.max(0, rounds.length - 1),
      roundId: geographyRound?.id,
      roundName: geographyRound?.name,
      roundDate: geographyRound?.date,
      roundAmount: geographyRound?.amount,
      roundValuation: geographyRound?.valuation,
      roundRoi: geographyRound?.roi,
      roundRoiDisplay: geographyRound?.roiDisplay,
      roundRole: geographyRound?.role,
      roundIsLead: geographyRound?.isLead,
    });
  }

  private serializeGeographyRound(round: any, participant: any): any | null {
    const id = this.toIdString(round?._id || participant?.fundingRoundId);
    const name = this.firstString(
      round?.roundName,
      this.humanizeRoundType(round?.roundType),
      this.humanizeRoundType(round?.normalizedRoundType),
      id ? "Round" : ""
    );
    if (!id && !name) return null;

    const date = round?.announcedDate || round?.date;
    const amount = this.toFiniteNumber(round?.raisedAmount);
    const valuation = this.toFiniteNumber(round?.valuation);
    const tokenPrice = this.toFiniteNumber(round?.tokenPrice);
    const roi = this.resolveRoundRoi(round);
    const roundedRoi = roi === undefined ? undefined : this.roundNumber(roi);

    return this.cleanObject({
      id,
      name,
      type: this.firstString(round?.normalizedRoundType, round?.roundType),
      date,
      amount: amount === undefined ? undefined : this.roundNumber(amount),
      valuation:
        valuation === undefined ? undefined : this.roundNumber(valuation),
      tokenPrice:
        tokenPrice === undefined ? undefined : this.roundNumber(tokenPrice, 8),
      roi: roundedRoi,
      roiDisplay:
        roundedRoi === undefined ? "" : this.formatRoiDisplay(roundedRoi),
      role: this.firstString(participant?.role),
      isLead: Boolean(participant?.isLead),
      status: this.firstString(round?.status, participant?.status),
    });
  }

  private mergeGeographyInvestor(existing: any, next: any): any {
    if (!existing) return next;

    const rounds = this.mergeGeographyRounds([
      ...(existing?.rounds || []),
      ...(next?.rounds || []),
    ]);
    const primaryRound = rounds[0];

    return this.cleanObject({
      ...existing,
      ...next,
      rounds,
      roundCount: rounds.length,
      additionalRoundsCount: Math.max(0, rounds.length - 1),
      roundId: primaryRound?.id,
      roundName: primaryRound?.name,
      roundDate: primaryRound?.date,
      roundAmount: primaryRound?.amount,
      roundValuation: primaryRound?.valuation,
      roundRoi: primaryRound?.roi,
      roundRoiDisplay: primaryRound?.roiDisplay,
      roundRole: primaryRound?.role,
      roundIsLead: primaryRound?.isLead,
    });
  }

  private mergeGeographyRounds(rounds: any[]): any[] {
    const byKey = new Map<string, any>();

    rounds.filter(Boolean).forEach((round) => {
      const key = this.firstString(
        round?.id,
        [round?.name, round?.date].filter(Boolean).join(":"),
        round?.name
      );
      if (!key) return;

      const current = byKey.get(key) || {};
      byKey.set(key, {
        ...current,
        ...round,
        isLead: Boolean(current?.isLead || round?.isLead),
      });
    });

    return Array.from(byKey.values()).sort((left, right) => {
      const dateDiff =
        this.dateNumber(right?.date) - this.dateNumber(left?.date);
      if (dateDiff) return dateDiff;
      return String(left?.name || "").localeCompare(String(right?.name || ""));
    });
  }

  private buildGeographyRegions(projects: any[]): any[] {
    const counts = new Map<
      string,
      { coInvestorCount: number; projectCount: Set<string> }
    >();
    let total = 0;

    projects.forEach((project) => {
      project.regionCounts.forEach((regionCount: any) => {
        const current = counts.get(regionCount.region) || {
          coInvestorCount: 0,
          projectCount: new Set<string>(),
        };
        current.coInvestorCount += regionCount.investorsCount;
        current.projectCount.add(project.projectSlug || project.projectName);
        counts.set(regionCount.region, current);
        total += regionCount.investorsCount;
      });
    });

    return Array.from(counts.entries())
      .map(([region, value]) => ({
        region,
        coInvestorCount: value.coInvestorCount,
        projectCount: value.projectCount.size,
        percent: this.percent(value.coInvestorCount, total),
      }))
      .sort((left, right) => right.coInvestorCount - left.coInvestorCount);
  }

  private resolveRegion(backer: any, includeUnknown: boolean): string {
    const region = this.firstString(
      backer?.regionData?.region,
      backer?.regionData?.subregion,
      backer?.country,
      backer?.location
    );

    return region || (includeUnknown ? "Unknown" : "");
  }

  private emptyPortfolioGeography(slug: string, error?: string): any {
    const summary = {
      portfolioProjects: 0,
      projectsWithCoInvestors: 0,
      totalCoInvestors: 0,
      investorsWithLocation: 0,
      investorsWithoutLocation: 0,
      regionCoveragePercent: 0,
    };

    return {
      ok: !error,
      isSuccess: !error,
      error,
      investor: { slug, name: "", logo: "" },
      summary,
      regions: [],
      projects: [],
      selected: { projectSlug: null, region: null, investors: [] },
      dataQuality: { ...summary },
    };
  }

  private groupAmountsByName(
    items: Array<{
      name: string;
      amount: number;
      count?: number;
      projectsCount?: number;
    }>
  ): any[] {
    const grouped = new Map<
      string,
      { amount: number; projectsCount: number }
    >();

    items.forEach((item) => {
      const name = this.firstString(item.name, "Other");
      const current = grouped.get(name) || { amount: 0, projectsCount: 0 };
      const projectsCount = Number(item.projectsCount ?? item.count ?? 0);

      grouped.set(name, {
        amount: current.amount + Number(item.amount || 0),
        projectsCount:
          current.projectsCount +
          (Number.isFinite(projectsCount) ? projectsCount : 0),
      });
    });
    const total = Array.from(grouped.values()).reduce((sum, value) => {
      return sum + value.amount;
    }, 0);

    return Array.from(grouped.entries())
      .map(([name, item]) => {
        const result: any = {
          name,
          amount: this.roundNumber(item.amount),
          value: this.percent(item.amount, total),
        };

        if (item.projectsCount > 0) {
          result.projectsCount = item.projectsCount;
        }

        return result;
      })
      .sort((left, right) => right.amount - left.amount)
      .slice(0, 40);
  }

  private addDistributionIds(items: any[]): any[] {
    return (items || []).map((item, index) => ({
      _id: this.firstString(
        item?._id,
        this.normalizeSlug(item?.name),
        String(index)
      ),
      ...item,
    }));
  }

  private buildPortfolioCategories(distribution: any[]): string[] {
    const categories = (distribution || [])
      .map((item) => this.firstString(item?.name))
      .filter(Boolean);
    const withoutOther = categories.filter((name) => {
      return this.normalizeSlug(name) !== "other";
    });

    return (withoutOther.length ? withoutOther : categories).slice(0, 12);
  }

  private groupByString<T>(
    items: T[],
    getKey: (item: T) => string
  ): Map<string, T[]> {
    const map = new Map<string, T[]>();

    items.forEach((item) => {
      const key = getKey(item);
      if (!key) return;
      map.set(key, [...(map.get(key) || []), item]);
    });

    return map;
  }

  private uniqueStrings(values: any[]): string[] {
    return Array.from(
      new Set(values.map((value) => this.cleanString(value)).filter(Boolean))
    );
  }

  private firstNumber(...values: any[]): number | undefined {
    for (const value of values) {
      const parsed = this.toFiniteNumber(value);
      if (parsed !== undefined) return parsed;
    }

    return undefined;
  }

  private resolveRoundRoi(round: any, currentPrice?: any): number | undefined {
    const storedRoi = this.firstNumber(
      round?.roi?.usd,
      round?.roiUsd,
      round?.usdRoi,
      round?.roiData?.roi,
      typeof round?.roi === "number" ? round.roi : undefined
    );
    if (storedRoi !== undefined && storedRoi !== 0) return storedRoi;

    const tokenPrice = this.firstNumber(
      round?.tokenPrice,
      round?.tokenPriceUsd,
      round?.metadata?.tokenPriceUsd,
      round?.metadata?.tokenPrice
    );
    const price = this.firstNumber(currentPrice);
    if (
      tokenPrice !== undefined &&
      tokenPrice > 0 &&
      price !== undefined &&
      price > 0
    ) {
      return price / tokenPrice;
    }

    return storedRoi;
  }

  private averageRoundRoi(rounds: any[], currentPrice?: any): number {
    return this.average(
      rounds
        .map((round) => this.resolveRoundRoi(round, currentPrice))
        .filter((value): value is number => value !== undefined && value !== 0)
    );
  }

  private average(values: number[]): number {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private median(values: number[]): number {
    const sorted = values
      .filter((value) => Number.isFinite(value))
      .sort((left, right) => left - right);
    if (!sorted.length) return 0;
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  private maxDate(...values: any[]): Date | undefined {
    const dates = values
      .flat()
      .map((value) => {
        if (!value) return null;
        const date = value instanceof Date ? value : new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
      })
      .filter(Boolean) as Date[];

    if (!dates.length) return undefined;
    return new Date(Math.max(...dates.map((date) => date.getTime())));
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private dateNumber(value: any): number {
    if (!value) return 0;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  private roundNumber(value: any, precision = 2): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    const multiplier = 10 ** precision;
    return Math.round(parsed * multiplier) / multiplier;
  }

  private percent(value: number, total: number): number {
    if (!total || total <= 0) return 0;
    return this.roundNumber((value / total) * 100, 1);
  }

  private formatRoiDisplay(value: number): string {
    if (!value) return "";
    if (Math.abs(value) <= 20) return `${this.roundNumber(value, 2)}x`;
    return `${value > 0 ? "+" : ""}${Math.round(value)}%`;
  }

  private humanizeRoundType(value: any): string {
    const normalized = this.cleanString(value).replace(/_/g, " ");
    if (!normalized) return "";
    return normalized.replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private normalizeRoundStatus(status: any, date?: any): "Active" | "Ended" {
    const normalized = this.cleanString(status).toLowerCase();
    if (["ended", "launched", "cancelled", "superseded"].includes(normalized))
      return "Ended";
    if (["active", "planned", "upcoming"].includes(normalized)) return "Active";
    return this.dateNumber(date) && this.dateNumber(date) <= Date.now()
      ? "Ended"
      : "Active";
  }

  private normalizeSlug(value: any): string {
    return this.cleanString(value)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private cleanUrl(value: any): string {
    const stringValue = this.cleanString(value);
    if (!stringValue || /^(javascript|data|vbscript):/i.test(stringValue))
      return "";
    if (/^https?:\/\//i.test(stringValue)) return stringValue;
    if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(stringValue)) {
      return `https://${stringValue}`;
    }

    return "";
  }

  private async listBackerProjects(
    backerType: FomoV2BackerType,
    backerKey: string,
    query: BackerProjectsQuery
  ) {
    const limit = Math.min(Math.max(Number(query?.limit) || 20, 1), 50);
    const offset = Math.min(Math.max(Number(query?.offset) || 0, 0), 100_000);
    const search = this.cleanString(query?.search).slice(0, 120);
    const backer = await this.resolveBacker(backerType, backerKey);

    if (!backer?.backerId) {
      return {
        ok: false,
        isSuccess: false,
        error: "Backer not found",
        items: [],
        projects: [],
        total: 0,
        limit,
        offset,
        hasMore: false,
      };
    }

    const match: Record<string, any> = {
      backerId: this.toObjectId(backer.backerId),
    };

    if (search) {
      const regex = new RegExp(this.escapeRegExp(search), "i");
      match.$or = [
        { projectName: regex },
        { projectSlug: regex },
        { projectSymbol: regex },
        { roundTypes: regex },
      ];
    }

    const [result = { items: [], totalCount: 0 }] = await this.holdingModel
      .aggregate([
        { $match: match },
        {
          $sort: {
            hasMarketData: -1,
            lastRoundDate: -1,
            projectName: 1,
            _id: 1,
          },
        },
        {
          $facet: {
            items: [
              { $skip: offset },
              { $limit: limit },
              {
                $project: {
                  _id: 1,
                  backerId: 1,
                  canonicalProjectId: 1,
                  roundIds: 1,
                  firstRoundDate: 1,
                  lastRoundDate: 1,
                  roundTypes: 1,
                  isLead: 1,
                  leadRoundsCount: 1,
                  roundsCount: 1,
                  totalKnownRaisedAmountUsd: 1,
                  projectName: 1,
                  projectSlug: 1,
                  projectSymbol: 1,
                  projectLogoUrl: 1,
                  hasMarketData: 1,
                  marketAssetId: 1,
                },
              },
            ],
            totalCount: [{ $count: "count" }],
          },
        },
        {
          $project: {
            items: 1,
            totalCount: {
              $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0],
            },
          },
        },
      ])
      .allowDiskUse(true)
      .exec();
    const total = Number((result as any).totalCount || 0);
    const rawItems = ((result as any).items || []) as any[];
    const roundIds = this.uniqueObjectIds(
      rawItems.flatMap((holding: any) => holding?.roundIds || [])
    );
    const [
      marketProjectsByKey,
      icoProjectsByCanonicalId,
      canonicalProjectsById,
      rounds,
    ] = await Promise.all([
      this.loadMarketProjectsForHoldings(rawItems),
      this.loadIcoProjectsForHoldings(rawItems),
      this.loadCanonicalProjectsForHoldings(rawItems),
      this.loadRounds(roundIds),
    ]);
    const roundsById = new Map(
      rounds.map((round: any) => [this.toIdString(round?._id), round])
    );
    const items = rawItems
      .map((holding) => {
        const canonicalProjectId = this.toIdString(holding?.canonicalProjectId);
        const marketProject =
          marketProjectsByKey.get(this.toMarketLookupKey(holding)) ||
          marketProjectsByKey.get(`canonical:${canonicalProjectId}`);
        const baseProject = this.serializeBackerProject(
          holding,
          marketProject,
          icoProjectsByCanonicalId.get(canonicalProjectId),
          canonicalProjectsById.get(canonicalProjectId)
        );

        return this.serializeFundPortfolioAsset(
          holding,
          baseProject,
          marketProject,
          this.roundsForHolding(holding, roundsById)
        );
      })
      .filter((item) => item.name);

    return {
      ok: true,
      isSuccess: true,
      backer: {
        id: this.firstString(
          backer.routeId,
          backer.slug,
          this.toIdString(backer.backerId)
        ),
        backerId: this.toIdString(backer.backerId),
        name: backer.name,
        slug: backer.slug,
        routeId: backer.routeId,
      },
      items,
      projects: items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  private async resolveBacker(
    backerType: FomoV2BackerType,
    backerKey: string
  ): Promise<any | null> {
    const key = this.cleanString(backerKey);
    if (!key) return null;

    const objectId = this.toObjectId(key);
    const clauses: any[] = [
      { routeId: key },
      { slug: key },
      { name: new RegExp(`^${this.escapeRegExp(key)}$`, "i") },
    ];

    if (objectId) {
      clauses.push({ _id: objectId }, { backerId: objectId });
    }

    return this.listReadModel
      .findOne(
        {
          backerType,
          visible: true,
          $or: clauses,
        },
        {
          _id: 1,
          backerId: 1,
          name: 1,
          routeId: 1,
          slug: 1,
        }
      )
      .lean()
      .exec();
  }

  private async loadMarketProjectsForHoldings(
    holdings: any[]
  ): Promise<Map<string, any>> {
    const marketAssetIds = this.uniqueObjectIds(
      holdings.map((holding) => holding?.marketAssetId)
    );
    const canonicalProjectIds = this.uniqueObjectIds(
      holdings.map((holding) => holding?.canonicalProjectId)
    );
    const or: any[] = [];

    if (marketAssetIds.length)
      or.push({ marketAssetId: { $in: marketAssetIds } });
    if (canonicalProjectIds.length) {
      or.push({ canonicalProjectId: { $in: canonicalProjectIds } });
    }
    if (!or.length) return new Map();

    const rows = await this.marketProjectReadModel
      .find(
        { $or: or },
        {
          _id: 1,
          canonicalProjectId: 1,
          marketAssetId: 1,
          name: 1,
          slug: 1,
          symbol: 1,
          logo: 1,
          category: 1,
          niche: 1,
          trading: 1,
          status: 1,
          price: 1,
          priceChange: 1,
          performance: 1,
          marketCap: 1,
          fullyDilutedMarketCap: 1,
          usdQuote: 1,
          circulatingSupply: 1,
          totalSupply: 1,
          maxSupply: 1,
          circulatingSupplyPercent: 1,
          providerIds: 1,
        }
      )
      .lean()
      .exec();
    const map = new Map<string, any>();

    (rows as any[]).forEach((row) => {
      const marketAssetKey = this.toIdString(row?.marketAssetId);
      const canonicalProjectKey = this.toIdString(row?.canonicalProjectId);
      if (marketAssetKey) map.set(`market:${marketAssetKey}`, row);
      if (canonicalProjectKey) map.set(`canonical:${canonicalProjectKey}`, row);
    });

    return map;
  }

  private async loadMarketProjectsByAssetIds(
    marketAssetIds: Types.ObjectId[]
  ): Promise<Map<string, any>> {
    if (!marketAssetIds.length) return new Map();

    const rows = await this.marketProjectReadModel
      .find(
        { marketAssetId: { $in: marketAssetIds } },
        {
          _id: 1,
          canonicalProjectId: 1,
          marketAssetId: 1,
          name: 1,
          slug: 1,
          symbol: 1,
          logo: 1,
          category: 1,
          niche: 1,
          trading: 1,
          status: 1,
          price: 1,
          priceChange: 1,
          performance: 1,
          marketCap: 1,
          fullyDilutedMarketCap: 1,
          usdQuote: 1,
          providerIds: 1,
        }
      )
      .lean()
      .exec();

    const map = new Map<string, any>();

    (rows as any[]).forEach((row) => {
      const key = this.toIdString(row?.marketAssetId);
      if (key) map.set(key, row);
    });

    return map;
  }

  private async loadIcoProjectsForHoldings(
    holdings: any[]
  ): Promise<Map<string, any>> {
    const canonicalProjectIds = this.uniqueObjectIds(
      holdings.map((holding) => holding?.canonicalProjectId)
    );
    if (!canonicalProjectIds.length) return new Map();

    const rows = await this.icoProjectReadModel
      .find(
        { canonicalProjectId: { $in: canonicalProjectIds } },
        {
          canonicalProjectId: 1,
          name: 1,
          slug: 1,
          symbol: 1,
          logoUrl: 1,
          categories: 1,
          metadata: 1,
          profileCompleteness: 1,
          updatedAt: 1,
        }
      )
      .sort({ profileCompleteness: -1, updatedAt: -1 })
      .lean()
      .exec();
    const map = new Map<string, any>();

    (rows as any[]).forEach((row) => {
      const key = this.toIdString(row?.canonicalProjectId);
      const current = map.get(key);
      const rowLogo = this.firstString(
        row?.logoUrl,
        row?.metadata?.logo,
        row?.metadata?.logoUrl,
        row?.metadata?.image
      );
      const currentLogo = this.firstString(
        current?.logoUrl,
        current?.metadata?.logo,
        current?.metadata?.logoUrl,
        current?.metadata?.image
      );

      if (key && (!current || (!currentLogo && rowLogo))) {
        map.set(key, row);
      }
    });

    return map;
  }

  private async loadCanonicalProjectsForHoldings(
    holdings: any[]
  ): Promise<Map<string, any>> {
    const canonicalProjectIds = this.uniqueObjectIds(
      holdings.map((holding) => holding?.canonicalProjectId)
    );
    if (!canonicalProjectIds.length) return new Map();

    const rows = await this.canonicalProjectModel
      .find(
        { _id: { $in: canonicalProjectIds } },
        {
          _id: 1,
          name: 1,
          slug: 1,
          symbol: 1,
          metadata: 1,
          providerIds: 1,
        }
      )
      .lean()
      .exec();

    return new Map(
      (rows as any[]).map((row) => [this.toIdString(row?._id), row])
    );
  }

  private toMarketLookupKey(holding: any): string {
    const marketAssetId = this.toIdString(holding?.marketAssetId);
    if (marketAssetId) return `market:${marketAssetId}`;

    return `canonical:${this.toIdString(holding?.canonicalProjectId)}`;
  }

  private serializeBackerProject(
    holding: any,
    marketProject?: any,
    icoProject?: any,
    canonicalProject?: any
  ): any {
    const canonicalProjectId = this.toIdString(holding?.canonicalProjectId);
    const marketAssetId = this.toIdString(holding?.marketAssetId);
    const coingeckoId = this.firstString(
      marketProject?.providerIds?.coingeckoId,
      canonicalProject?.providerIds?.coingeckoId,
      marketProject?.slug,
      holding?.hasMarketData ? holding?.projectSlug : ""
    );
    const projectSlug = this.firstString(
      holding?.projectSlug,
      marketProject?.slug,
      icoProject?.slug,
      canonicalProject?.slug
    );
    const hasMarketData = Boolean(holding?.hasMarketData || marketProject);
    const routeType = hasMarketData ? "market" : "project";
    const routeId =
      routeType === "market"
        ? this.firstString(
            coingeckoId,
            projectSlug,
            marketAssetId,
            canonicalProjectId
          )
        : this.firstString(projectSlug, canonicalProjectId);
    const href = routeId
      ? routeType === "market"
        ? `/market/${encodeURIComponent(routeId)}`
        : `/echo/${encodeURIComponent(routeId)}`
      : "#";

    return this.cleanObject({
      _id: canonicalProjectId || projectSlug || this.toIdString(holding?._id),
      id: canonicalProjectId || projectSlug || this.toIdString(holding?._id),
      canonicalProjectId,
      marketAssetId,
      name: this.firstString(
        holding?.projectName,
        marketProject?.name,
        icoProject?.name,
        canonicalProject?.name,
        projectSlug
      ),
      slug: projectSlug,
      symbol: this.firstString(
        holding?.projectSymbol,
        marketProject?.symbol,
        icoProject?.symbol,
        canonicalProject?.symbol
      ),
      logo: this.firstString(
        holding?.projectLogoUrl,
        marketProject?.logo,
        icoProject?.logoUrl,
        icoProject?.metadata?.logo,
        icoProject?.metadata?.logoUrl,
        icoProject?.metadata?.image,
        canonicalProject?.metadata?.logo,
        canonicalProject?.metadata?.logoUrl,
        canonicalProject?.metadata?.image
      ),
      image: this.firstString(
        holding?.projectLogoUrl,
        marketProject?.logo,
        icoProject?.logoUrl,
        icoProject?.metadata?.logo,
        icoProject?.metadata?.logoUrl,
        icoProject?.metadata?.image,
        canonicalProject?.metadata?.logo,
        canonicalProject?.metadata?.logoUrl,
        canonicalProject?.metadata?.image
      ),
      category: this.firstString(
        marketProject?.category,
        marketProject?.niche,
        Array.isArray(icoProject?.categories) ? icoProject.categories[0] : ""
      ),
      roundTypes: Array.isArray(holding?.roundTypes) ? holding.roundTypes : [],
      roundsCount: Number(holding?.roundsCount || 0),
      leadRoundsCount: Number(holding?.leadRoundsCount || 0),
      isLead: Boolean(holding?.isLead),
      totalKnownRaisedAmountUsd: this.toFiniteNumber(
        holding?.totalKnownRaisedAmountUsd
      ),
      firstRoundDate: holding?.firstRoundDate,
      lastRoundDate: holding?.lastRoundDate,
      hasMarketData,
      coingeckoId,
      href,
      projectLinks: routeId
        ? [
            {
              projectType: routeType,
              projectId: routeId,
            },
          ]
        : [],
    });
  }

  private async list(
    backerType: FomoV2BackerType,
    query: BackerListQuery,
    options: BackerListOptions = {}
  ) {
    const maxLimit = options.maxLimit || 500;
    const defaultLimit = options.defaultLimit || 100;
    const limit = Math.min(
      Math.max(Number(query?.limit) || defaultLimit, 1),
      maxLimit
    );
    const offsetProvided = query?.offset !== undefined && query?.offset !== null;
    const offset = offsetProvided
      ? Math.max(Number(query?.offset) || 0, 0)
      : (Math.max(Number(query?.page) || 1, 1) - 1) * limit;
    const page = Math.floor(offset / limit) + 1;
    const match = this.buildMatch(backerType, query, {
      includeHidden: options.includeHidden,
    });
    const [result = { items: [], totalCount: 0 }] = await this.listReadModel
      .aggregate([
        { $match: match },
        { $sort: this.resolveSort(backerType, query) },
        {
          $facet: {
            items: [
              { $skip: offset },
              { $limit: limit },
              { $project: this.listProjection() },
            ],
            totalCount: [{ $count: "count" }],
          },
        },
        {
          $project: {
            items: 1,
            totalCount: {
              $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0],
            },
          },
        },
      ])
      .allowDiskUse(true)
      .exec();
    const total = Number((result as any).totalCount || 0);
    const items = ((result as any).items || []).map((item: any) =>
      this.serializeListItem(backerType, item)
    );

    return {
      items,
      funds: backerType === "fund" ? items : undefined,
      persons: backerType === "person" ? items : undefined,
      totalCount: total,
      total,
      page,
      limit,
      offset,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async getFilterOptions(
    backerType: FomoV2BackerType,
    query: BackerListQuery = {}
  ) {
    const match = this.buildMatch(backerType, query, {
      ignorePaginationAndSort: true,
    });
    const [result = {}] = await this.listReadModel
      .aggregate([
        { $match: match },
        {
          $facet: {
            fundTypes: [
              { $unwind: "$nicheKeys" },
              {
                $group: {
                  _id: "$nicheKeys",
                  label: { $first: "$niche" },
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1, label: 1 } },
              { $limit: 80 },
            ],
            industryFocus: [
              { $unwind: "$sectors" },
              {
                $group: {
                  _id: "$sectors",
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1, _id: 1 } },
              { $limit: 80 },
              {
                $project: {
                  key: "$_id",
                  label: "$_id",
                  count: 1,
                  _id: 0,
                },
              },
            ],
          },
        },
      ])
      .exec();

    return {
      fundTypes: ((result as any).fundTypes || [])
        .map((item: any) => ({
          key: item._id,
          label: item.label || item._id,
          count: item.count,
        }))
        .filter((item: any) => item.key && item.label),
      industryFocus: (result as any).industryFocus || [],
    };
  }

  private async analytics(
    backerType: FomoV2BackerType,
    query: BackerListQuery
  ) {
    const match = this.buildMatch(backerType, query, {
      ignorePaginationAndSort: true,
    });
    const [analyticsFacetRows, analyticsBackers] = await Promise.all([
      this.listReadModel
        .aggregate([
          { $match: match },
          {
            $facet: {
              summary: [
                {
                  $group: {
                    _id: null,
                    totalBackers: { $sum: 1 },
                    totalProjectsSupported: { $sum: "$supportedProjectsCount" },
                    averageRating: { $avg: "$rating" },
                    averageFullness: { $avg: "$fullness" },
                    withSocialLinks: {
                      $sum: {
                        $cond: [
                          {
                            $gt: [
                              { $size: { $ifNull: ["$socialmedia", []] } },
                              0,
                            ],
                          },
                          1,
                          0,
                        ],
                      },
                    },
                    withPortfolio: {
                      $sum: {
                        $cond: [{ $gt: ["$supportedProjectsCount", 0] }, 1, 0],
                      },
                    },
                  },
                },
                {
                  $project: {
                    _id: 0,
                    totalBackers: 1,
                    totalProjectsSupported: {
                      $round: ["$totalProjectsSupported", 0],
                    },
                    averageRating: { $round: ["$averageRating", 1] },
                    averageFullness: { $round: ["$averageFullness", 1] },
                    withSocialLinks: 1,
                    withPortfolio: 1,
                  },
                },
              ],
              backersByType: this.groupByLabelPipeline("$niche"),
              backersByCountry: [
                {
                  $group: {
                    _id: { $ifNull: ["$country", UNKNOWN_ANALYTICS_LABEL] },
                    countryCode: { $first: "$regionData.id" },
                    value: { $sum: 1 },
                  },
                },
                { $sort: { value: -1, _id: 1 } },
                { $limit: 200 },
                {
                  $project: {
                    _id: 0,
                    country: "$_id",
                    countryCode: 1,
                    value: 1,
                  },
                },
              ],
            },
          },
        ])
        .allowDiskUse(true)
        .exec(),
      this.loadAnalyticsBackers(match),
    ]);
    const result = (analyticsFacetRows as any[])?.[0] || {};
    const participantRows = await this.loadAnalyticsParticipantRows(
      analyticsBackers
    );
    const topSectors = this.buildIndustryChart(backerType, participantRows);
    const globalInvestmentMap =
      backerType === "fund"
        ? this.buildGlobalInvestmentMap(analyticsBackers, participantRows)
        : undefined;
    const topSectorsByPeriod =
      backerType === "fund"
        ? this.buildIndustryChartByPeriod(participantRows)
        : this.emptyIndustryAllocationByPeriod();
    const regionalDistribution =
      backerType === "person"
        ? this.buildKnownCountryDistribution(analyticsBackers)
        : {
            countries: (result as any).backersByCountry || [],
            dataQuality: {},
          };

    return {
      summary: (result as any).summary?.[0] || {
        totalBackers: 0,
        totalProjectsSupported: 0,
        averageRating: 0,
        averageFullness: 0,
        withSocialLinks: 0,
        withPortfolio: 0,
      },
      backersByType: (result as any).backersByType || [],
      topSectors,
      topSectorsByPeriod,
      backersByCountry: regionalDistribution.countries,
      fundingDynamics:
        backerType === "fund"
          ? this.buildFundingDynamics(participantRows)
          : { chart90d: [], chart1y: [], chartAll: [] },
      ...(globalInvestmentMap ? { globalInvestmentMap } : {}),
      dataQuality: regionalDistribution.dataQuality,
    };
  }

  private async loadAnalyticsBackers(
    match: Record<string, any>
  ): Promise<any[]> {
    return this.listReadModel
      .find(match, {
        _id: 1,
        backerId: 1,
        backerType: 1,
        name: 1,
        routeId: 1,
        slug: 1,
        logo: 1,
        avatar: 1,
        type: 1,
        niche: 1,
        specialization: 1,
        specializations: 1,
        country: 1,
        regionData: 1,
        supportedProjectsCount: 1,
        projectsCount: 1,
      })
      .lean()
      .exec();
  }

  private async loadAnalyticsParticipantRows(
    backers: any[]
  ): Promise<AnalyticsParticipantRow[]> {
    const backerIds = this.uniqueObjectIds(
      backers.map((backer) => backer?.backerId)
    );
    if (!backerIds.length) return [];

    const backersById = new Map(
      backers.map((backer) => [this.toIdString(backer?.backerId), backer])
    );
    const holdings = await this.holdingModel
      .find(
        {
          backerId: { $in: backerIds },
        },
        {
          _id: 1,
          canonicalProjectId: 1,
          roundIds: 1,
          backerId: 1,
          totalKnownRaisedAmountUsd: 1,
          lastRoundDate: 1,
          projectName: 1,
          projectSlug: 1,
          projectLogoUrl: 1,
          projectSymbol: 1,
          isLead: 1,
          backerType: 1,
        }
      )
      .lean()
      .exec();
    const roundIds = this.uniqueObjectIds(
      (holdings as any[]).flatMap((holding) => holding?.roundIds || [])
    );
    if (!roundIds.length) return [];

    const rounds = await this.fundingRoundModel
      .find(
        {
          _id: { $in: roundIds },
          status: { $nin: ANALYTICS_EXCLUDED_STATUSES },
        },
        {
          _id: 1,
          canonicalProjectId: 1,
          marketAssetId: 1,
          roundName: 1,
          normalizedRoundType: 1,
          roundType: 1,
          status: 1,
          announcedDate: 1,
          date: 1,
          raisedAmount: 1,
          valuation: 1,
          roi: 1,
        }
      )
      .lean()
      .exec();
    const roundsById = new Map(
      (rounds as any[])
        .filter((round) => this.toDate(round?.announcedDate || round?.date))
        .map((round) => [this.toIdString(round?._id), round])
    );
    const projectsById = await this.loadAnalyticsProjects(
      Array.from(roundsById.values())
    );
    const rows: AnalyticsParticipantRow[] = [];

    (holdings as any[]).forEach((holding) => {
      const backer = backersById.get(this.toIdString(holding?.backerId));
      if (!backer) return;

      const holdingRoundIds = this.uniqueObjectIds(holding?.roundIds || []);
      const fallbackAmount = holdingRoundIds.length
        ? Number(holding?.totalKnownRaisedAmountUsd || 0) /
          holdingRoundIds.length
        : 0;

      holdingRoundIds.forEach((roundId) => {
        const round = roundsById.get(this.toIdString(roundId));
        const date = this.toDate(
          round?.announcedDate || round?.date || holding?.lastRoundDate
        );
        const project =
          projectsById.get(this.toIdString(round?.canonicalProjectId)) ||
          this.analyticsProjectFromHolding(holding);

        if (!round || !date || !project) return;

        rows.push({
          backer,
          participant: {
            backerId: holding.backerId,
            fundingRoundId: round._id,
            isLead: holding.isLead,
          },
          round,
          project,
          date,
          amount: Math.max(
            0,
            Number(round?.raisedAmount || fallbackAmount || 0)
          ),
          category: project.category || UNCATEGORIZED_ANALYTICS_LABEL,
        });
      });
    });

    return rows;
  }

  private analyticsProjectFromHolding(holding: any): AnalyticsProjectInfo {
    const canonicalProjectId = this.toIdString(holding?.canonicalProjectId);

    return {
      canonicalProjectId,
      name: this.firstString(
        holding?.projectName,
        holding?.projectSlug,
        canonicalProjectId
      ),
      slug: this.firstString(holding?.projectSlug),
      logo: this.firstString(holding?.projectLogoUrl),
      category: UNCATEGORIZED_ANALYTICS_LABEL,
    };
  }

  private async loadAnalyticsProjects(
    rounds: any[]
  ): Promise<Map<string, AnalyticsProjectInfo>> {
    const canonicalProjectIds = this.uniqueObjectIds(
      rounds.map((round) => round?.canonicalProjectId)
    );
    if (!canonicalProjectIds.length) return new Map();

    const [marketRows, icoRows, canonicalRows] = await Promise.all([
      this.marketProjectReadModel
        .find(
          { canonicalProjectId: { $in: canonicalProjectIds } },
          {
            canonicalProjectId: 1,
            name: 1,
            slug: 1,
            symbol: 1,
            logo: 1,
            category: 1,
            categories: 1,
            niche: 1,
          }
        )
        .lean()
        .exec(),
      this.icoProjectReadModel
        .find(
          { canonicalProjectId: { $in: canonicalProjectIds } },
          {
            canonicalProjectId: 1,
            name: 1,
            slug: 1,
            symbol: 1,
            logoUrl: 1,
            categories: 1,
            metadata: 1,
            profileCompleteness: 1,
            updatedAt: 1,
          }
        )
        .sort({ profileCompleteness: -1, updatedAt: -1 })
        .lean()
        .exec(),
      this.canonicalProjectModel
        .find(
          { _id: { $in: canonicalProjectIds } },
          {
            _id: 1,
            name: 1,
            slug: 1,
            symbol: 1,
            metadata: 1,
            providerIds: 1,
          }
        )
        .lean()
        .exec(),
    ]);
    const marketByProject = new Map<string, any>();
    const icoByProject = new Map<string, any>();
    const canonicalByProject = new Map(
      (canonicalRows as any[]).map((row) => [this.toIdString(row?._id), row])
    );

    (marketRows as any[]).forEach((row) => {
      const key = this.toIdString(row?.canonicalProjectId);
      const current = marketByProject.get(key);
      if (!key) return;
      if (!current || (!current.category && row?.category)) {
        marketByProject.set(key, row);
      }
    });
    (icoRows as any[]).forEach((row) => {
      const key = this.toIdString(row?.canonicalProjectId);
      const current = icoByProject.get(key);
      if (!key || current) return;
      icoByProject.set(key, row);
    });

    return canonicalProjectIds.reduce((map, projectId) => {
      const key = this.toIdString(projectId);
      const marketProject = marketByProject.get(key);
      const icoProject = icoByProject.get(key);
      const canonicalProject = canonicalByProject.get(key);
      const category = this.analyticsCategory(
        marketProject?.category,
        marketProject?.categories,
        icoProject?.categories,
        canonicalProject?.metadata?.category,
        canonicalProject?.metadata?.categories
      );

      map.set(key, {
        canonicalProjectId: key,
        name: this.firstString(
          marketProject?.name,
          icoProject?.name,
          canonicalProject?.name,
          key
        ),
        slug: this.firstString(
          marketProject?.slug,
          icoProject?.slug,
          canonicalProject?.slug
        ),
        logo: this.firstString(
          marketProject?.logo,
          icoProject?.logoUrl,
          icoProject?.metadata?.logo,
          icoProject?.metadata?.logoUrl,
          icoProject?.metadata?.image,
          canonicalProject?.metadata?.logo,
          canonicalProject?.metadata?.logoUrl,
          canonicalProject?.metadata?.image
        ),
        category,
      });

      return map;
    }, new Map<string, AnalyticsProjectInfo>());
  }

  private buildIndustryChart(
    backerType: FomoV2BackerType,
    rows: AnalyticsParticipantRow[]
  ): AnalyticsChartItem[] {
    return backerType === "person"
      ? this.buildPersonIndustryChart(rows)
      : this.buildFundIndustryChart(rows);
  }

  private buildFundIndustryChart(
    rows: AnalyticsParticipantRow[]
  ): AnalyticsChartItem[] {
    const roundRows = new Map<string, AnalyticsParticipantRow>();
    const backersByRound = new Map<string, Set<string>>();

    rows.forEach((row) => {
      const roundId = this.toIdString(row.round?._id);
      if (!roundId) return;
      const roundBackers = backersByRound.get(roundId) || new Set<string>();
      roundBackers.add(this.toIdString(row.backer?.backerId));
      backersByRound.set(roundId, roundBackers);
      if (row.amount <= 0) return;
      if (!roundRows.has(roundId)) roundRows.set(roundId, row);
    });

    const grouped = new Map<
      string,
      {
        amount: number;
        deals: number;
        projects: Map<string, Record<string, any>>;
        backers: Set<string>;
      }
    >();

    Array.from(roundRows.values()).forEach((row) => {
      const key = row.category || UNCATEGORIZED_ANALYTICS_LABEL;
      const group =
        grouped.get(key) ||
        ({
          amount: 0,
          deals: 0,
          projects: new Map<string, Record<string, any>>(),
          backers: new Set<string>(),
        } as {
          amount: number;
          deals: number;
          projects: Map<string, Record<string, any>>;
          backers: Set<string>;
        });
      const projectKey =
        row.project.canonicalProjectId || row.project.slug || row.project.name;
      const project = group.projects.get(projectKey) || {
        name: row.project.name,
        slug: row.project.slug,
        logo: row.project.logo,
        image: row.project.logo,
        amount: 0,
        dealsCount: 0,
      };

      group.amount += row.amount;
      group.deals += 1;
      project.amount += row.amount;
      project.dealsCount += 1;
      group.projects.set(projectKey, project);
      (
        backersByRound.get(this.toIdString(row.round?._id)) || new Set<string>()
      ).forEach((backerId) => group.backers.add(backerId));
      grouped.set(key, group);
    });

    return Array.from(grouped.entries())
      .map(([label, group]) => ({
        label,
        value: this.roundNumber(group.amount),
        projectsCount: group.projects.size,
        dealsCount: group.deals,
        backersCount: group.backers.size,
        topProjects: Array.from(group.projects.values())
          .sort(
            (left, right) =>
              Number(right.amount || 0) - Number(left.amount || 0)
          )
          .slice(0, 5)
          .map((project) => ({
            ...project,
            amount: this.roundNumber(project.amount),
          })),
      }))
      .filter((item) => item.value > 0)
      .sort(
        (left, right) =>
          right.value - left.value || left.label.localeCompare(right.label)
      )
      .slice(0, 24);
  }

  private buildPersonIndustryChart(
    rows: AnalyticsParticipantRow[]
  ): AnalyticsChartItem[] {
    const byCategoryPerson = new Map<
      string,
      {
        category: string;
        backer: any;
        projects: Map<string, Record<string, any>>;
        roles: string[];
        country: string;
        amount: number;
        deals: number;
      }
    >();

    rows.forEach((row) => {
      const backerId = this.toIdString(row.backer?.backerId);
      if (!backerId) return;
      const key = `${row.category}::${backerId}`;
      const current =
        byCategoryPerson.get(key) ||
        ({
          category: row.category,
          backer: row.backer,
          projects: new Map<string, Record<string, any>>(),
          roles: this.analyticsBackerRoles(row.backer),
          country: this.analyticsCountry(row.backer),
          amount: 0,
          deals: 0,
        } as {
          category: string;
          backer: any;
          projects: Map<string, Record<string, any>>;
          roles: string[];
          country: string;
          amount: number;
          deals: number;
        });
      const projectKey =
        row.project.canonicalProjectId || row.project.slug || row.project.name;
      const project = current.projects.get(projectKey) || {
        name: row.project.name,
        slug: row.project.slug,
        logo: row.project.logo,
        image: row.project.logo,
        amount: 0,
        dealsCount: 0,
      };

      project.amount += row.amount;
      project.dealsCount += 1;
      current.amount += row.amount;
      current.deals += 1;
      current.projects.set(projectKey, project);
      byCategoryPerson.set(key, current);
    });

    const grouped = new Map<
      string,
      {
        persons: number;
        deals: number;
        projects: Map<string, Record<string, any>>;
        roles: Map<string, number>;
        countries: Map<string, number>;
      }
    >();

    Array.from(byCategoryPerson.values()).forEach((item) => {
      const group =
        grouped.get(item.category) ||
        ({
          persons: 0,
          deals: 0,
          projects: new Map<string, Record<string, any>>(),
          roles: new Map<string, number>(),
          countries: new Map<string, number>(),
        } as {
          persons: number;
          deals: number;
          projects: Map<string, Record<string, any>>;
          roles: Map<string, number>;
          countries: Map<string, number>;
        });

      group.persons += 1;
      group.deals += item.deals;
      item.roles.forEach((role) => this.incrementCount(group.roles, role));
      if (item.country) this.incrementCount(group.countries, item.country);
      item.projects.forEach((project, projectKey) => {
        const current = group.projects.get(projectKey) || {
          ...project,
          amount: 0,
          dealsCount: 0,
        };
        current.amount += Number(project.amount || 0);
        current.dealsCount += Number(project.dealsCount || 0);
        group.projects.set(projectKey, current);
      });
      grouped.set(item.category, group);
    });

    return Array.from(grouped.entries())
      .map(([label, group]) => {
        const topProjects = Array.from(group.projects.values())
          .sort(
            (left, right) =>
              Number(right.amount || 0) - Number(left.amount || 0)
          )
          .slice(0, 3)
          .map((project) => project.name)
          .filter(Boolean)
          .join(", ");

        return {
          label,
          value: group.persons,
          projectsCount: group.projects.size,
          dealsCount: group.deals,
          topRoles: this.formatTopCounts(group.roles, group.persons),
          keyRegions: this.formatTopCounts(group.countries, group.persons),
          sectors: label,
          topProjects: topProjects || "-",
          growth: `${group.deals} tracked deals`,
        };
      })
      .filter((item) => item.value > 0)
      .sort(
        (left, right) =>
          right.value - left.value || left.label.localeCompare(right.label)
      )
      .slice(0, 24);
  }

  private buildIndustryChartByPeriod(rows: AnalyticsParticipantRow[]) {
    const now = Date.now();
    const since = (days: number) => {
      const threshold = now - days * 24 * 60 * 60 * 1000;
      return rows.filter((row) => row.date.getTime() >= threshold);
    };

    return {
      chart24h: this.buildFundIndustryChart(since(1)),
      chart7d: this.buildFundIndustryChart(since(7)),
      chart30d: this.buildFundIndustryChart(since(30)),
      chart90d: this.buildFundIndustryChart(since(90)),
      chart1y: this.buildFundIndustryChart(since(365)),
      chartAll: this.buildFundIndustryChart(rows),
    };
  }

  private emptyIndustryAllocationByPeriod() {
    return {
      chart24h: [],
      chart7d: [],
      chart30d: [],
      chart90d: [],
      chart1y: [],
      chartAll: [],
    };
  }

  private buildFundingDynamics(rows: AnalyticsParticipantRow[]) {
    const now = Date.now();
    const since = (days: number) => {
      const threshold = now - days * 24 * 60 * 60 * 1000;
      return rows.filter((row) => row.date.getTime() >= threshold);
    };

    return {
      chart90d: this.buildFundingDynamicsPoints(since(90), "week"),
      chart1y: this.buildFundingDynamicsPoints(since(365), "month"),
      chartAll: this.buildFundingDynamicsPoints(rows, "year"),
    };
  }

  private buildFundingDynamicsPoints(
    rows: AnalyticsParticipantRow[],
    bucket: "week" | "month" | "year"
  ) {
    const roundsById = new Map<string, AnalyticsParticipantRow>();

    rows.forEach((row) => {
      const roundId = this.toIdString(row.round?._id);
      if (!roundId || row.amount <= 0) return;
      if (!roundsById.has(roundId)) roundsById.set(roundId, row);
    });

    const rankedCategories = this.buildFundIndustryChart(
      Array.from(roundsById.values())
    ).map((item) => item.label);
    const hasOtherCategory = rankedCategories.length > 6;
    const visibleCategories = hasOtherCategory
      ? rankedCategories.slice(0, 5)
      : rankedCategories.slice(0, 6);
    const buckets = new Map<
      string,
      {
        date: Date;
        periodEnd: Date;
        amounts: Map<string, number>;
        projects: Map<string, Record<string, any>>;
      }
    >();

    Array.from(roundsById.values()).forEach((row) => {
      const bucketStart = this.analyticsBucketStart(row.date, bucket);
      const bucketEnd = this.analyticsBucketEnd(bucketStart, bucket);
      const key = bucketStart.toISOString();
      const item =
        buckets.get(key) ||
        ({
          date: bucketStart,
          periodEnd: bucketEnd,
          amounts: new Map<string, number>(),
          projects: new Map<string, Record<string, any>>(),
        } as {
          date: Date;
          periodEnd: Date;
          amounts: Map<string, number>;
          projects: Map<string, Record<string, any>>;
        });
      const category = visibleCategories.includes(row.category)
        ? row.category
        : OTHER_ANALYTICS_LABEL;
      const projectKey = `${category}:${
        row.project.canonicalProjectId || row.project.name
      }`;
      const project = item.projects.get(projectKey) || {
        name: row.project.name,
        amount: 0,
        category,
      };

      item.amounts.set(
        category,
        (item.amounts.get(category) || 0) + row.amount
      );
      project.amount += row.amount;
      item.projects.set(projectKey, project);
      buckets.set(key, item);
    });

    const categories = [
      ...visibleCategories,
      ...(hasOtherCategory ? [OTHER_ANALYTICS_LABEL] : []),
    ];

    return Array.from(buckets.values())
      .sort((left, right) => left.date.getTime() - right.date.getTime())
      .map((item) => {
        const point: any = {
          name: this.formatAnalyticsBucketLabel(
            item.date,
            item.periodEnd,
            bucket
          ),
          date: item.date.toISOString(),
          periodEnd: item.periodEnd.toISOString(),
          totalInvestment: this.roundNumber(
            categories.reduce(
              (sum, category) => sum + (item.amounts.get(category) || 0),
              0
            )
          ),
          categories,
          keyProjects: Array.from(item.projects.values())
            .sort(
              (left, right) =>
                Number(right.amount || 0) - Number(left.amount || 0)
            )
            .slice(0, 6)
            .map((project) => ({
              ...project,
              amount: this.roundNumber(project.amount),
            })),
        };

        categories.forEach((category, index) => {
          point[`investments${index}`] = this.roundNumber(
            item.amounts.get(category) || 0
          );
        });

        return point;
      })
      .filter((point) => point.totalInvestment > 0);
  }

  private buildGlobalInvestmentMap(
    backers: any[],
    rows: AnalyticsParticipantRow[]
  ) {
    const countries = new Map<string, any>();
    const fundsWithKnownCountry = new Set<string>();
    const fundsWithoutCountry = new Set<string>();
    const countryRoundKeys = new Set<string>();
    const investorRoundKeys = new Set<string>();

    const ensureCountry = (countryInfo: any) => {
      const key = countryInfo.countryCode;
      const current =
        countries.get(key) ||
        ({
          country: countryInfo.country,
          countryCode: countryInfo.countryCode,
          sourceCountries: new Set<string>(),
          fundIds: new Set<string>(),
          projectIds: new Set<string>(),
          totalInvestAmount: 0,
          dealsCount: 0,
          projects: new Map<string, any>(),
          categories: new Map<string, any>(),
          investors: new Map<string, any>(),
        } as any);

      current.sourceCountries.add(
        countryInfo.sourceCountry || countryInfo.country
      );
      countries.set(key, current);
      return current;
    };

    backers.forEach((backer) => {
      const backerId = this.toIdString(backer?.backerId || backer?._id);
      const countryInfo = this.analyticsMapCountry(backer);

      if (!backerId) return;
      if (!countryInfo) {
        fundsWithoutCountry.add(backerId);
        return;
      }

      fundsWithKnownCountry.add(backerId);
      const country = ensureCountry(countryInfo);
      country.fundIds.add(backerId);
    });

    rows.forEach((row) => {
      const countryInfo = this.analyticsMapCountry(row.backer);
      if (!countryInfo) return;

      const country = ensureCountry(countryInfo);
      const backerId = this.toIdString(row.backer?.backerId || row.backer?._id);
      const roundId = this.toIdString(row.round?._id);
      const projectKey = this.firstString(
        row.project?.canonicalProjectId,
        row.project?.slug,
        row.project?.name
      );
      const amount = Math.max(0, Number(row.amount || 0));
      const countryRoundKey = this.firstString(
        roundId ? `${countryInfo.countryCode}:${roundId}` : "",
        `${countryInfo.countryCode}:${projectKey}:${this.dateNumber(
          row.date
        )}:${amount}`
      );

      if (!countryRoundKeys.has(countryRoundKey)) {
        countryRoundKeys.add(countryRoundKey);
        country.totalInvestAmount += amount;
        country.dealsCount += 1;
        if (projectKey) country.projectIds.add(projectKey);

        const project =
          country.projects.get(projectKey) ||
          ({
            name: row.project?.name || projectKey,
            slug: row.project?.slug,
            logo: row.project?.logo,
            image: row.project?.logo,
            symbol: (row.project as any)?.symbol,
            category: row.category || UNCATEGORIZED_ANALYTICS_LABEL,
            amount: 0,
            dealsCount: 0,
            backerIds: new Set<string>(),
          } as any);
        project.amount += amount;
        project.dealsCount += 1;
        if (backerId) project.backerIds.add(backerId);
        country.projects.set(projectKey, project);

        const categoryLabel = row.category || UNCATEGORIZED_ANALYTICS_LABEL;
        const category =
          country.categories.get(categoryLabel) ||
          ({
            label: categoryLabel,
            amount: 0,
            dealsCount: 0,
            projectIds: new Set<string>(),
          } as any);
        category.amount += amount;
        category.dealsCount += 1;
        if (projectKey) category.projectIds.add(projectKey);
        country.categories.set(categoryLabel, category);
      }

      if (backerId) {
        const investorKey = `${countryInfo.countryCode}:${backerId}`;
        const investor =
          country.investors.get(investorKey) ||
          ({
            id: backerId,
            backerId,
            name: row.backer?.name || "",
            slug: row.backer?.routeId || row.backer?.slug || backerId,
            logo: row.backer?.logo || row.backer?.avatar || "",
            image: row.backer?.logo || row.backer?.avatar || "",
            rating: Number(row.backer?.rating || 0),
            investAmount: 0,
            dealsCount: 0,
            projectIds: new Set<string>(),
          } as any);
        const investorRoundKey = this.firstString(
          roundId ? `${countryInfo.countryCode}:${backerId}:${roundId}` : "",
          `${
            countryInfo.countryCode
          }:${backerId}:${projectKey}:${this.dateNumber(row.date)}:${amount}`
        );

        if (!investorRoundKeys.has(investorRoundKey)) {
          investorRoundKeys.add(investorRoundKey);
          investor.investAmount += amount;
          investor.dealsCount += 1;
          if (projectKey) investor.projectIds.add(projectKey);
        }

        country.investors.set(investorKey, investor);
      }
    });

    const countryItems = Array.from(countries.values())
      .map((country: any) => {
        const topProjects = Array.from(country.projects.values())
          .sort(
            (left: any, right: any) =>
              Number(right.amount || 0) - Number(left.amount || 0) ||
              Number(right.backerIds?.size || 0) -
                Number(left.backerIds?.size || 0) ||
              String(left.name || "").localeCompare(String(right.name || ""))
          )
          .slice(0, 10)
          .map((project: any) => ({
            name: project.name,
            slug: project.slug,
            logo: project.logo,
            image: project.image,
            symbol: project.symbol,
            category: project.category,
            amount: this.roundNumber(project.amount),
            dealsCount: project.dealsCount,
            backersCount: project.backerIds?.size || 0,
          }));
        const topCategories = Array.from(country.categories.values())
          .sort(
            (left: any, right: any) =>
              Number(right.amount || 0) - Number(left.amount || 0) ||
              String(left.label || "").localeCompare(String(right.label || ""))
          )
          .slice(0, 8)
          .map((category: any) => ({
            label: category.label,
            value: category.dealsCount,
            amount: this.roundNumber(category.amount),
            projectsCount: category.projectIds?.size || 0,
          }));
        const topInvestors = Array.from(country.investors.values())
          .sort(
            (left: any, right: any) =>
              Number(right.investAmount || 0) -
                Number(left.investAmount || 0) ||
              Number(right.projectIds?.size || 0) -
                Number(left.projectIds?.size || 0) ||
              String(left.name || "").localeCompare(String(right.name || ""))
          )
          .slice(0, 8)
          .map((investor: any) => ({
            id: investor.id,
            backerId: investor.backerId,
            name: investor.name,
            slug: investor.slug,
            logo: investor.logo,
            image: investor.image,
            rating: this.roundNumber(investor.rating, 1),
            investAmount: this.roundNumber(investor.investAmount),
            projectsCount: investor.projectIds?.size || 0,
            dealsCount: investor.dealsCount,
          }));

        return {
          country: country.country,
          countryCode: country.countryCode,
          value: this.roundNumber(country.totalInvestAmount),
          totalInvestAmount: this.roundNumber(country.totalInvestAmount),
          fundsCount: country.fundIds.size,
          projectsCount: country.projectIds.size,
          dealsCount: country.dealsCount,
          sourceCountries: Array.from(country.sourceCountries).sort(),
          topProjects,
          keyProjects: topProjects,
          portfolioCoins: topProjects,
          topCategories,
          topInvestors,
          topCategory: topCategories[0]?.label || "",
          topCategoryCount: topCategories[0]?.value || 0,
        };
      })
      .sort(
        (left: any, right: any) =>
          Number(right.totalInvestAmount || 0) -
            Number(left.totalInvestAmount || 0) ||
          Number(right.fundsCount || 0) - Number(left.fundsCount || 0) ||
          String(left.country || "").localeCompare(String(right.country || ""))
      );
    const totalInvestAmount = countryItems.reduce(
      (sum: number, country: any) =>
        sum + Number(country.totalInvestAmount || 0),
      0
    );

    return {
      metric: "totalKnownRaisedAmountUsd",
      amountScope: "country_round_deduped",
      countries: countryItems,
      dataQuality: {
        totalFunds: backers.length,
        fundsWithKnownCountry: fundsWithKnownCountry.size,
        fundsWithoutCountry: Math.max(
          0,
          backers.length - fundsWithKnownCountry.size
        ),
        countryCoveragePercent: this.percent(
          fundsWithKnownCountry.size,
          backers.length
        ),
        countriesCount: countryItems.length,
        totalInvestAmount: this.roundNumber(totalInvestAmount),
      },
      updatedAt: new Date().toISOString(),
    };
  }

  private analyticsMapCountry(backer: any): any | null {
    const rawCountry = this.firstString(
      backer?.country,
      backer?.regionData?.properties?.name
    );
    const rawCountryCode = this.firstString(backer?.regionData?.id);
    const candidates = [rawCountryCode, rawCountry]
      .map((value) => this.normalizeKey(value))
      .filter(Boolean);

    if (!rawCountry || !this.isKnownAnalyticsLabel(rawCountry)) return null;

    for (const key of candidates) {
      const alias = GLOBAL_MAP_COUNTRY_ALIASES[key];
      if (alias) {
        return {
          ...alias,
          sourceCountry: rawCountry,
        };
      }
    }

    if (/^[a-z]{3}$/.test(this.normalizeKey(rawCountryCode))) {
      return {
        country: rawCountry,
        countryCode: rawCountryCode.toUpperCase(),
        sourceCountry: rawCountry,
      };
    }

    return {
      country: rawCountry,
      countryCode: rawCountry,
      sourceCountry: rawCountry,
    };
  }

  private isKnownAnalyticsLabel(label: string): boolean {
    const normalized = this.normalizeKey(label);
    return (
      Boolean(normalized) &&
      !["unknown", "n_a", "na", "none", "null", "undefined"].includes(
        normalized
      )
    );
  }

  private buildKnownCountryDistribution(backers: any[]) {
    const countries = new Map<
      string,
      { country: string; countryCode?: string; value: number }
    >();
    let known = 0;
    let unknown = 0;

    backers.forEach((backer) => {
      const country = this.analyticsCountry(backer);
      if (!country) {
        unknown += 1;
        return;
      }

      known += 1;
      const current = countries.get(country) || {
        country,
        countryCode: this.firstString(backer?.regionData?.id),
        value: 0,
      };
      current.value += 1;
      if (!current.countryCode)
        current.countryCode = this.firstString(backer?.regionData?.id);
      countries.set(country, current);
    });

    return {
      countries: Array.from(countries.values()).sort(
        (left, right) =>
          right.value - left.value || left.country.localeCompare(right.country)
      ),
      dataQuality: {
        knownCountries: known,
        unknownCountries: unknown,
        countryCoveragePercent: this.percent(known, known + unknown),
      },
    };
  }

  private analyticsCategory(...values: any[]): string {
    const flattened = values.flat(4);

    for (const value of flattened) {
      const raw = this.cleanString(value);
      if (!raw) continue;
      const normalized = raw.toLowerCase();
      if (
        [
          "unknown",
          "n/a",
          "na",
          "none",
          "null",
          "undefined",
          "other",
          "uncategorized",
        ].includes(normalized)
      ) {
        continue;
      }

      return raw;
    }

    return UNCATEGORIZED_ANALYTICS_LABEL;
  }

  private analyticsBackerRoles(backer: any): string[] {
    const roles = this.uniqueStrings([
      ...(Array.isArray(backer?.specializations) ? backer.specializations : []),
      backer?.specialization,
      backer?.niche,
      backer?.type,
    ]).filter((role) => this.isAnalyticsRoleLabel(role));

    if (!roles.length && backer?.backerType === "person") {
      return ["Angel Investor"];
    }

    return roles;
  }

  private isAnalyticsRoleLabel(label: string): boolean {
    const value = this.cleanString(label);
    if (!value) return false;

    return !ANALYTICS_EXCLUDED_ROLE_KEYS.has(this.normalizeKey(value));
  }

  private isPersonCategoryFilterLabel(label: string): boolean {
    const value = this.cleanString(label);
    if (!value) return false;

    return !PERSON_CATEGORY_FILTER_EXCLUDED_KEYS.has(this.normalizeKey(value));
  }

  private analyticsCountry(backer: any): string {
    const country = this.firstString(
      backer?.country,
      backer?.regionData?.properties?.name
    );
    if (!country) return "";
    if (
      [UNKNOWN_ANALYTICS_LABEL, "unknown", "n/a", "na"].includes(
        country.toLowerCase()
      )
    ) {
      return "";
    }

    return country;
  }

  private incrementCount(map: Map<string, number>, label: string): void {
    const key = this.cleanString(label);
    if (!key) return;
    map.set(key, (map.get(key) || 0) + 1);
  }

  private formatTopCounts(
    counts: Map<string, number>,
    total: number,
    limit = 3
  ): string {
    const rows = Array.from(counts.entries())
      .filter(([, value]) => value > 0)
      .sort(
        (left, right) => right[1] - left[1] || left[0].localeCompare(right[0])
      )
      .slice(0, limit);

    if (!rows.length) return "-";

    return rows
      .map(([label, value]) => `${label} (${this.percent(value, total)}%)`)
      .join(", ");
  }

  private analyticsBucketStart(
    date: Date,
    bucket: "week" | "month" | "year"
  ): Date {
    const start = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    );

    if (bucket === "year") {
      return new Date(Date.UTC(start.getUTCFullYear(), 0, 1));
    }

    if (bucket === "month") {
      return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    }

    const day = start.getUTCDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setUTCDate(start.getUTCDate() - diff);
    return start;
  }

  private analyticsBucketEnd(
    start: Date,
    bucket: "week" | "month" | "year"
  ): Date {
    const end = new Date(start);

    if (bucket === "year") {
      end.setUTCFullYear(end.getUTCFullYear() + 1);
    } else if (bucket === "month") {
      end.setUTCMonth(end.getUTCMonth() + 1);
    } else {
      end.setUTCDate(end.getUTCDate() + 7);
    }

    end.setUTCMilliseconds(end.getUTCMilliseconds() - 1);
    return end;
  }

  private formatAnalyticsBucketLabel(
    start: Date,
    end: Date,
    bucket: "week" | "month" | "year"
  ): string {
    if (bucket === "year") return String(start.getUTCFullYear());
    if (bucket === "month") {
      return start.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
        timeZone: "UTC",
      });
    }

    const startLabel = start.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      timeZone: "UTC",
    });
    const endLabel = end.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      timeZone: "UTC",
    });

    return `${startLabel} - ${endLabel}`;
  }

  private buildMatch(
    backerType: FomoV2BackerType,
    query: BackerListQuery,
    options: { ignorePaginationAndSort?: boolean; includeHidden?: boolean } = {}
  ): Record<string, any> {
    const and: any[] = options.includeHidden ? [{ backerType }] : [{ backerType, visible: true }];
    const search = this.cleanString(
      query.name || query.search || query.searchValue
    );
    if (search) {
      const regex = new RegExp(this.escapeRegExp(search), "i");
      and.push({
        $or: [
          { name: regex },
          { slug: regex },
          { niche: regex },
          { country: regex },
          { sectors: regex },
        ],
      });
    }

    const status = this.values(query.status);
    if (status.length) {
      and.push({
        status: { $in: status.flatMap((item) => [item, item.toLowerCase()]) },
      });
    }

    const additionalStatus = this.cleanString(query.additionalStatus).toLowerCase();
    if (additionalStatus === "sponsored") {
      and.push({ isSponsored: true });
    }
    if (additionalStatus === "eralash") {
      and.push({ isEralash: true });
    }

    this.addKeyFilter(and, "nicheKeys", [
      ...this.values(query.niche),
      ...this.values(query.specialization),
    ]);
    this.addKeyFilter(and, "sectorKeys", [
      ...this.values(query.industryFocus),
      ...this.values(query.sector),
      ...this.values(query.sectors),
    ]);
    this.addKeyFilter(and, "countryKeys", [
      ...this.values(query.country),
      ...this.values(query.region),
      ...this.values(query["regionData.region"]),
    ]);
    this.addKeyFilter(and, "regionKeys", [
      ...this.values(query.region),
      ...this.values(query["regionData.region"]),
    ]);

    this.addRangeFilter(and, "totalInvested", [
      ...this.ranges(query.investAmount),
      ...this.ranges(query.investAmount_checkboxes),
      ...this.ranges(query.totalInvestments),
    ]);
    this.addRangeFilter(and, "supportedProjectsCount", [
      ...this.ranges(query.projects),
    ]);
    this.addRangeFilter(and, "roi", this.ranges(query.roi));
    this.addRangeFilter(and, "rating", [
      ...this.ranges(query.rating),
      ...this.ranges(query.fomoScore),
    ]);
    this.addRangeFilter(and, "fullness", this.ranges(query.fullness));
    this.addRangeFilter(and, "redFlags", [
      ...this.ranges(query.redFlags),
      ...this.ranges(query["red-flags"]),
    ]);
    this.addRangeFilter(and, "followersCount", this.ranges(query.followers));

    return and.length === 1 ? and[0] : { $and: and };
  }

  private resolveSort(
    backerType: FomoV2BackerType,
    query: BackerListQuery
  ): Record<string, SortOrder> {
    const fieldMap: Record<string, string> = {
      name: "name",
      Persons: "name",
      rating: "rating",
      fomoScore: "rating",
      "FOMO Score": "rating",
      fullness: "fullness",
      roi: "roi",
      athRoi: "roi",
      "ATH ROI": "roi",
      projects: "supportedProjectsCount",
      projectsCount: "supportedProjectsCount",
      supportedProjectsCount: "supportedProjectsCount",
      Investments: "supportedProjectsCount",
      totalInvested: "totalInvested",
      totalInvestments: "totalInvested",
      country: "country",
      region: "country",
      lastUpdatedAt: "lastUpdatedAt",
      updated: "lastUpdatedAt",
      "Last Updated": "lastUpdatedAt",
    };
    let sortBy = this.cleanString(query.sortBy || query.sortKey);
    let sortOrder = this.cleanString(query.sortOrder).toLowerCase();

    if (!sortOrder && query.sortNumberValue !== undefined) {
      sortOrder = Number(query.sortNumberValue) === 1 ? "asc" : "desc";
    }

    if (sortBy.includes(",")) {
      const [field, order] = sortBy.split(",");
      sortBy = field;
      sortOrder = order === "1" || order === "asc" ? "asc" : "desc";
    }

    const field = fieldMap[sortBy] || "rating";
    const direction: SortOrder = sortOrder === "asc" ? 1 : -1;
    const sort: Record<string, SortOrder> = { [field]: direction };

    if (field !== "rating") sort.rating = -1;
    if (field !== "supportedProjectsCount") sort.supportedProjectsCount = -1;
    sort.name = 1;
    if (backerType === "person" && field !== "totalInvested") {
      sort.totalInvested = -1;
    }

    return sort;
  }

  private listProjection(): Record<string, any> {
    return {
      _id: 0,
      backerId: { $toString: "$backerId" },
      id: { $toString: "$backerId" },
      routeId: 1,
      slug: 1,
      name: 1,
      logo: 1,
      avatar: 1,
      type: 1,
      niche: 1,
      specialization: 1,
      specializations: 1,
      country: 1,
      location: 1,
      currentRole: "$type",
      rating: 1,
      fomoScore: 1,
      fullness: 1,
      roi: 1,
      roiDisplay: 1,
      athRoi: "$roi",
      totalInvested: 1,
      projectsCount: 1,
      supportedProjectsCount: 1,
      supportedProjectsPreview: 1,
      sectors: 1,
      tags: 1,
      socialLinks: 1,
      socialmedia: 1,
      websiteUrl: 1,
      twitterUrl: 1,
      linkedinUrl: 1,
      lastUpdatedAt: 1,
      regionData: 1,
      countryFlag: { $literal: "" },
      isSponsored: 1,
      isEralash: 1,
      eralashAdded: 1,
      redFlags: 1,
      redFlagsList: 1,
      redStatus: 1,
      likes: 1,
      status: 1,
      bio: 1,
      descriptionText: 1,
      totalInvestments: "$totalInvested",
      portfolioCoinsCount: 1,
      publicSalesCount: "$leadInvestments",
      lastRoundDate: 1,
      lastFunding: 1,
    };
  }

  private serializeListItem(backerType: FomoV2BackerType, item: any): any {
    const canonicalBackerId = item.backerId || item.id;
    const routeId = item.routeId || item.slug || canonicalBackerId;

    return {
      ...item,
      _id: routeId,
      id: routeId,
      backerId: canonicalBackerId,
      canonicalBackerId,
      routeId,
      slug: item.slug || routeId,
      avatar: item.avatar || item.logo || "",
      logo: item.logo || item.avatar || "",
      type:
        item.type ||
        item.niche ||
        (backerType === "person" ? "Angel Investor" : "Ventures Capital"),
      niche: item.niche || item.type,
      specialization: item.specialization || item.niche || item.type,
      specializations: item.specializations?.length
        ? item.specializations
        : backerType === "person"
        ? [item.niche || item.type || "Angel Investor"]
        : [],
      socialLinks: item.socialLinks || {},
      socialmedia: item.socialmedia || [],
      supportedProjectsPreview: item.supportedProjectsPreview || [],
      isSponsored: Boolean(item.isSponsored),
      isEralash: Boolean(item.isEralash),
      redFlagsList: item.redFlagsList || [],
      likes: item.likes || [],
    };
  }

  private groupByLabelPipeline(field: string): any[] {
    return [
      {
        $project: {
          label: {
            $cond: [
              {
                $eq: [
                  { $trim: { input: { $toString: { $ifNull: [field, ""] } } } },
                  "",
                ],
              },
              "Unknown",
              field,
            ],
          },
        },
      },
      { $group: { _id: "$label", value: { $sum: 1 } } },
      { $sort: { value: -1, _id: 1 } },
      { $limit: 12 },
      { $project: { _id: 0, label: "$_id", value: 1 } },
    ];
  }

  private async topSectorsByPeriod(
    backerType: FomoV2BackerType,
    baseMatch: Record<string, any>
  ) {
    const now = new Date();
    const build = async (days?: number) => {
      const match = days
        ? {
            $and: [
              baseMatch,
              {
                lastRoundDate: {
                  $gte: new Date(now.getTime() - days * 24 * 60 * 60 * 1000),
                },
              },
            ],
          }
        : baseMatch;
      return this.topSectors(backerType, match);
    };

    return {
      chart24h: await build(1),
      chart7d: await build(7),
      chart30d: await build(30),
      chart90d: await build(90),
      chart1y: await build(365),
      chartAll: await build(),
    };
  }

  private async topSectors(
    _backerType: FomoV2BackerType,
    match: Record<string, any>
  ): Promise<AnalyticsChartItem[]> {
    return this.listReadModel
      .aggregate([
        { $match: match },
        { $unwind: "$sectors" },
        {
          $group: {
            _id: "$sectors",
            value: { $sum: 1 },
            projectsCount: { $sum: "$supportedProjectsCount" },
            topProjects: { $push: "$supportedProjectsPreview" },
          },
        },
        { $sort: { value: -1, _id: 1 } },
        { $limit: 24 },
        {
          $project: {
            _id: 0,
            label: "$_id",
            value: 1,
            projectsCount: 1,
            topProjects: { $slice: [{ $first: "$topProjects" }, 5] },
          },
        },
      ])
      .allowDiskUse(true)
      .exec() as Promise<AnalyticsChartItem[]>;
  }

  private async fundingDynamics(
    _backerType: FomoV2BackerType,
    match: Record<string, any>
  ) {
    const rows = await this.listReadModel
      .aggregate([
        { $match: { $and: [match, { lastRoundDate: { $type: "date" } }] } },
        {
          $project: {
            name: 1,
            date: "$lastRoundDate",
            totalInvestment: {
              $cond: [
                { $gt: ["$totalInvested", 0] },
                "$totalInvested",
                "$supportedProjectsCount",
              ],
            },
            categories: { $slice: ["$sectors", 6] },
            keyProjects: { $slice: ["$supportedProjectsPreview", 6] },
          },
        },
        { $sort: { date: 1 } },
        { $limit: 5000 },
      ])
      .allowDiskUse(true)
      .exec();
    const mapRows = (items: any[]) =>
      items.map((item) => ({
        name: new Date(item.date).toLocaleDateString("en-US", {
          month: "short",
          day: "2-digit",
        }),
        date: item.date,
        totalInvestment: Number(item.totalInvestment || 0),
        categories: item.categories || [],
        keyProjects: (item.keyProjects || []).map((project: any) => ({
          name: project.name,
          amount: Number(item.totalInvestment || 0),
          category: item.categories?.[0],
        })),
        investments0: Number(item.totalInvestment || 0),
      }));
    const now = Date.now();
    const since = (days: number) =>
      (rows as any[]).filter(
        (row) =>
          new Date(row.date).getTime() >= now - days * 24 * 60 * 60 * 1000
      );

    return {
      chart90d: mapRows(since(90)),
      chart1y: mapRows(since(365)),
      chartAll: mapRows(rows as any[]),
    };
  }

  private uniqueObjectIds(values: any[]): Types.ObjectId[] {
    const seen = new Set<string>();
    const result: Types.ObjectId[] = [];

    values.forEach((value) => {
      const objectId = this.toObjectId(value);
      const key = objectId?.toString();
      if (!objectId || !key || seen.has(key)) return;
      seen.add(key);
      result.push(objectId);
    });

    return result;
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value;
    if (typeof value === "object" && value._id)
      return this.toObjectId(value._id);
    if (typeof value === "object" && value.$oid)
      return this.toObjectId(value.$oid);
    const stringValue = this.cleanString(value);

    return Types.ObjectId.isValid(stringValue)
      ? new Types.ObjectId(stringValue)
      : undefined;
  }

  private toIdString(value: any): string {
    if (!value) return "";
    if (value instanceof Types.ObjectId) return value.toString();
    if (typeof value === "object" && value._id)
      return this.toIdString(value._id);
    if (typeof value === "object" && value.$oid)
      return this.toIdString(value.$oid);
    return this.cleanString(value);
  }

  private backerTypeLabel(backerType: FomoV2BackerType): string {
    return backerType === "person" ? "Person" : "Fund";
  }

  private firstString(...values: any[]): string {
    for (const value of values) {
      const stringValue = this.cleanString(value);
      if (stringValue) return stringValue;
    }

    return "";
  }

  private toFiniteNumber(value: any): number | undefined {
    const number = Number(value);

    return Number.isFinite(number) ? number : undefined;
  }

  private cleanObject<T extends Record<string, any>>(value: T): T {
    return Object.entries(value).reduce((acc, [key, entry]) => {
      if (entry === undefined || entry === null || entry === "") return acc;
      if (Array.isArray(entry) && entry.length === 0) return acc;
      acc[key as keyof T] = entry;
      return acc;
    }, {} as T);
  }

  private addKeyFilter(and: any[], field: string, rawValues: string[]): void {
    const values = this.keys(rawValues);
    if (values.length) and.push({ [field]: { $in: values } });
  }

  private addRangeFilter(
    and: any[],
    field: string,
    ranges: Array<[number, number]>
  ): void {
    if (!ranges.length) return;
    and.push({
      $or: ranges.map(([min, max]) => ({ [field]: { $gte: min, $lte: max } })),
    });
  }

  private ranges(value: any): Array<[number, number]> {
    return this.values(value)
      .map((item) => {
        if (!item.includes(RANGE_SEPARATOR)) return null;
        const [min, max] = item
          .split(RANGE_SEPARATOR)
          .map((part) => Number(part));
        if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
        return [Math.min(min, max), Math.max(min, max)] as [number, number];
      })
      .filter((item): item is [number, number] => Boolean(item));
  }

  private values(value: any): string[] {
    const raw = Array.isArray(value) ? value : String(value || "").split(",");
    return raw
      .flatMap((item: any) => String(item || "").split(","))
      .map((item) => item.trim())
      .filter((item) => item && item.toLowerCase() !== "all")
      .slice(0, 80);
  }

  private keys(values: any[]): string[] {
    return Array.from(
      new Set(values.map((value) => this.normalizeKey(value)).filter(Boolean))
    );
  }

  private normalizeKey(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  private cleanString(value: any): string {
    if (typeof value !== "string" && typeof value !== "number") return "";
    return String(value).trim();
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
