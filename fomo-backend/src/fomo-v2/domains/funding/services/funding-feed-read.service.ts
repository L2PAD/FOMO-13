import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  FomoV2BackerListReadModel,
  FomoV2BackerReadModel,
} from "../../backers";
import { FomoV2IcoProjectReadModel } from "../../ico";
import { FomoV2MarketProjectReadModel } from "../../market";
import { FomoV2CanonicalProject } from "../../../models";
import {
  FomoV2FundingFeedRoundReadModel,
  FomoV2FundingRound,
  FomoV2FundingRoundParticipant,
} from "../models";
import {
  FomoV2FundingFeedInvestorsQueryDto,
  FomoV2FundingFeedListQueryDto,
  FomoV2FundingProjectRoundsQueryDto,
  FomoV2ProjectTopInvestorsQueryDto,
} from "../dto/funding-feed-query.dto";

type FundingFeedSortDirection = 1 | -1;

type FundingFeedFilterOption = {
  key: string;
  label: string;
  count: number;
};

@Injectable()
export class FomoV2FundingFeedReadService {
  private readModelReadinessCache:
    | { checkedAt: number; ready: boolean }
    | undefined;
  private readonly excludedRoundStatuses = [
    "cancelled",
    "conflict",
    "deprecated",
    "superseded",
  ];
  private readonly excludedParticipantStatuses = [
    "conflict",
    "deprecated",
    "superseded",
  ];

  constructor(
    @InjectModel(FomoV2FundingFeedRoundReadModel.name)
    private readonly fundingFeedRoundReadModel: Model<FomoV2FundingFeedRoundReadModel>,
    @InjectModel(FomoV2FundingRound.name)
    private readonly fundingRoundModel: Model<FomoV2FundingRound>,
    @InjectModel(FomoV2FundingRoundParticipant.name)
    private readonly fundingRoundParticipantModel: Model<FomoV2FundingRoundParticipant>,
    @InjectModel(FomoV2BackerReadModel.name)
    private readonly backerReadModel: Model<FomoV2BackerReadModel>,
    @InjectModel(FomoV2BackerListReadModel.name)
    private readonly backerListReadModel: Model<FomoV2BackerListReadModel>,
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly marketProjectReadModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(FomoV2IcoProjectReadModel.name)
    private readonly icoProjectReadModel: Model<FomoV2IcoProjectReadModel>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>
  ) {}

  /** Re-evaluate read-model coverage immediately after materialization. */
  invalidateReadModelReadinessCache(): void {
    this.readModelReadinessCache = undefined;
  }

  async listRounds(
    params: FomoV2FundingFeedListQueryDto
  ): Promise<{ rounds: any[]; total: number }> {
    const limit = Math.min(Math.max(Number(params.limit) || 100, 1), 200);
    const offset = Math.max(Number(params.offset) || 0, 0);
    const readModelResult = await this.tryListRoundsFromReadModel(
      params,
      offset,
      limit
    );
    if (readModelResult) return readModelResult;

    const postLookupStages = this.postLookupMatchStages(params);
    const pipeline = postLookupStages.length
      ? this.fullLookupListPipeline(params, offset, limit, postLookupStages)
      : this.fastListPipeline(params, offset, limit);
    const [result] = await this.fundingRoundModel
      .aggregate(pipeline)
      .allowDiskUse(true);
    const rounds = Array.isArray(result?.rounds) ? result.rounds : [];
    const total = Number(result?.total?.[0]?.count || 0);

    return {
      rounds: rounds.map((round: any) => this.toFundingFeedRound(round)),
      total,
    };
  }

  private async tryListRoundsFromReadModel(
    params: FomoV2FundingFeedListQueryDto,
    offset: number,
    limit: number
  ): Promise<{ rounds: any[]; total: number } | undefined> {
    const mode = this.readModelMode();
    if (mode === "legacy") return undefined;

    if (mode === "auto" && !(await this.isReadModelReady())) {
      return undefined;
    }

    try {
      const query = this.buildReadModelMatch(params);
      const sort = this.sortForReadModelMode(params.mode);
      const [rows, total] = await Promise.all([
        this.fundingFeedRoundReadModel
          .find(query)
          .sort(sort)
          .skip(offset)
          .limit(limit)
          .lean(),
        this.fundingFeedRoundReadModel.countDocuments(query),
      ]);

      return {
        rounds: (rows as any[]).map((row: any) =>
          this.toFundingFeedRoundFromReadModel(row)
        ),
        total,
      };
    } catch (error) {
      if (this.readModelStrict()) throw error;
      return undefined;
    }
  }

  private readModelMode(): "auto" | "force" | "legacy" {
    const value = String(
      process.env.FOMO_V2_FUNDING_FEED_READ_MODEL || "auto"
    )
      .trim()
      .toLowerCase();
    if (["0", "false", "off", "legacy", "disabled"].includes(value)) {
      return "legacy";
    }
    if (["1", "true", "on", "force", "enabled"].includes(value)) {
      return "force";
    }
    return "auto";
  }

  private readModelStrict(): boolean {
    return ["1", "true", "on", "yes"].includes(
      String(process.env.FOMO_V2_FUNDING_FEED_READ_MODEL_STRICT || "")
        .trim()
        .toLowerCase()
    );
  }

  private async isReadModelReady(): Promise<boolean> {
    const now = Date.now();
    if (
      this.readModelReadinessCache &&
      now - this.readModelReadinessCache.checkedAt < 60_000
    ) {
      return this.readModelReadinessCache.ready;
    }

    const [readRows, activeRounds] = await Promise.all([
      this.fundingFeedRoundReadModel.countDocuments({ visible: true }),
      this.fundingRoundModel.countDocuments(this.activeRoundsMatch()),
    ]);
    const minCoverage = this.readModelMinCoverage();
    const ready =
      activeRounds > 0 && readRows > 0 && readRows / activeRounds >= minCoverage;
    this.readModelReadinessCache = { checkedAt: now, ready };
    return ready;
  }

  private readModelMinCoverage(): number {
    const parsed = Number(
      process.env.FOMO_V2_FUNDING_FEED_READ_MODEL_MIN_COVERAGE
    );
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 1) return 0.98;
    return parsed;
  }

  private buildReadModelMatch(params: FomoV2FundingFeedListQueryDto): any {
    const conditions: any[] = [{ visible: true }];
    if (
      params.canonicalProjectId &&
      Types.ObjectId.isValid(params.canonicalProjectId)
    ) {
      conditions.push({
        canonicalProjectId: new Types.ObjectId(params.canonicalProjectId),
      });
    }
    const search = String(params.search || "")
      .trim()
      .slice(0, 120);
    const fundingTypeCondition = this.buildReadModelFundingTypeCondition(
      params.fundingType
    );
    const fundsRaisedCondition = this.buildRangeCondition(
      "fundsRaisedForSort",
      params.fundsRaised
    );
    const preValuationCondition = this.buildRangeCondition(
      "preValuationForSort",
      params.preValuation
    );
    const fundingDateCondition = this.buildReadModelFundingDateCondition(
      params.fundingDates
    );
    const categoryCondition = this.buildReadModelCategoryCondition(
      params.categories
    );
    const companyTypeCondition = this.buildReadModelCategoryCondition(
      params.companyType
    );
    const devStageCondition = this.buildReadModelDevStageCondition(
      params.devStage
    );
    const investorCondition = this.buildReadModelInvestorCondition(params);
    const hasTokenCondition = this.buildHasTokenCondition(params.hasToken);
    const fomoScoreCondition = this.buildRangeCondition(
      "projectFomoScore",
      params.fomoScore
    );
    const redFlagsCondition = this.buildRangeCondition(
      "projectRedFlags",
      params.redFlags
    );
    const chainCondition = this.buildReadModelChainCondition(params.chain);

    if (search) conditions.push(this.buildReadModelSearchCondition(search));
    if (fundingTypeCondition) conditions.push(fundingTypeCondition);
    if (fundsRaisedCondition) conditions.push(fundsRaisedCondition);
    if (preValuationCondition) conditions.push(preValuationCondition);
    if (fundingDateCondition) conditions.push(fundingDateCondition);
    if (categoryCondition) conditions.push(categoryCondition);
    if (companyTypeCondition) conditions.push(companyTypeCondition);
    if (devStageCondition) conditions.push(devStageCondition);
    if (investorCondition) conditions.push(investorCondition);
    if (hasTokenCondition) conditions.push(hasTokenCondition);
    if (fomoScoreCondition) conditions.push(fomoScoreCondition);
    if (redFlagsCondition) conditions.push(redFlagsCondition);
    if (chainCondition) conditions.push(chainCondition);

    return conditions.length === 1 ? conditions[0] : { $and: conditions };
  }

  private buildReadModelSearchCondition(search: string): any {
    const tokens = this.searchTokens(search);
    if (!tokens.length) return {};
    return {
      $and: tokens.map((token) =>
        token.length > 32
          ? { searchTokens: token }
          : { searchPrefixes: token }
      ),
    };
  }

  private buildReadModelFundingTypeCondition(value?: string): any | undefined {
    const items = this.parseCsv(value).filter((item) => item !== "all");
    if (!items.length) return undefined;
    const keys = this.uniqueStrings(items.map((item) => this.normalizeKey(item)));
    return keys.length ? { fundingTypeKeys: { $in: keys } } : undefined;
  }

  private buildReadModelFundingDateCondition(value?: string): any | undefined {
    const items = this.parseCsv(value);
    if (!items.length) return undefined;

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const conditions = items
      .map((item) => {
        const days = Number(item.replace(/\D/g, ""));
        if (!Number.isFinite(days)) return undefined;
        const cutoff = new Date(now - days * day);
        if (item.startsWith(">")) return { fundingDate: { $lt: cutoff } };
        if (item.startsWith("<")) return { fundingDate: { $gte: cutoff } };
        return undefined;
      })
      .filter(Boolean);

    return conditions.length ? { $or: conditions } : undefined;
  }

  private buildReadModelCategoryCondition(value?: string): any | undefined {
    const items = this.parseCsv(value).filter((item) => item !== "all");
    if (!items.length) return undefined;
    const keys = this.uniqueStrings(items.map((item) => this.normalizeKey(item)));
    return keys.length ? { categoryKeys: { $in: keys } } : undefined;
  }

  private buildReadModelDevStageCondition(value?: string): any | undefined {
    const items = this.parseCsv(value).filter((item) => item !== "all");
    if (!items.length) return undefined;
    const keys = this.uniqueStrings(items.map((item) => this.normalizeKey(item)));
    return {
      $or: [
        { fundingTypeKeys: { $in: keys } },
        { projectStatusKeys: { $in: keys } },
      ],
    };
  }

  private buildReadModelInvestorCondition(
    params: FomoV2FundingFeedListQueryDto
  ): any | undefined {
    const investorIds = this.parseCsv(params.investors);
    const backerIds = investorIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id).toHexString());
    const sourceIds = [
      ...this.parseCsv(params.investorDropstabIds),
      ...investorIds.filter((id) => !Types.ObjectId.isValid(id)),
    ];
    const slugs = this.parseCsv(params.investorSlugs).map((slug) =>
      this.normalizeKey(slug)
    );
    const names = this.parseCsv(params.investorNames).map((name) =>
      this.normalizeText(name)
    );
    const conditions: any[] = [];

    if (backerIds.length) conditions.push({ investorIds: { $in: backerIds } });
    if (sourceIds.length)
      conditions.push({ investorSourceIds: { $in: sourceIds } });
    if (slugs.length) conditions.push({ investorSlugs: { $in: slugs } });
    if (names.length) conditions.push({ investorNameKeys: { $in: names } });

    return conditions.length ? { $or: conditions } : undefined;
  }

  private buildReadModelChainCondition(value?: string): any | undefined {
    const chain = String(value || "").trim();
    if (!chain) return undefined;
    const key = this.normalizeKey(chain);
    return key ? { chainKeys: key } : undefined;
  }

  private sortForReadModelMode(
    mode = "all"
  ): Record<string, FundingFeedSortDirection> {
    switch (mode) {
      case "old":
        return { fundingDate: 1, _id: 1 };
      case "fundsRaisedAsc":
        return { fundsRaisedForSort: 1, fundingDate: -1, _id: 1 };
      case "fundsRaisedDesc":
      case "trending":
      case "smart":
        return { fundsRaisedForSort: -1, fundingDate: -1, _id: 1 };
      case "preValuationAsc":
        return { preValuationForSort: 1, fundingDate: -1, _id: 1 };
      case "preValuationDesc":
        return { preValuationForSort: -1, fundingDate: -1, _id: 1 };
      case "fomoScoreAsc":
        return { projectFomoScore: 1, fundingDate: -1, _id: 1 };
      case "fomoScoreDesc":
        return { projectFomoScore: -1, fundingDate: -1, _id: 1 };
      case "new":
      case "all":
      default:
        return { fundingDate: -1, _id: 1 };
    }
  }

  private fastListPipeline(
    params: FomoV2FundingFeedListQueryDto,
    offset: number,
    limit: number
  ): any[] {
    const lookupStages = [
      ...this.projectLookupStages(),
      ...this.projectDerivedFieldStages(),
    ];
    const rounds = this.sortNeedsProjectData(params.mode)
      ? [
          ...this.selectedRoundsWindowStages(offset, limit),
          ...lookupStages,
          { $sort: this.sortForMode(params.mode) },
        ]
      : [
          ...this.selectedRoundsWindowStages(offset, limit),
          { $sort: this.sortForMode(params.mode) },
          ...lookupStages,
        ];

    return [
      { $match: this.buildBaseRoundMatch(params) },
      ...this.roundSortFieldStages(),
      {
        $facet: {
          rounds,
          total: [{ $count: "count" }],
        },
      },
    ];
  }

  private fullLookupListPipeline(
    params: FomoV2FundingFeedListQueryDto,
    offset: number,
    limit: number,
    postLookupStages: any[]
  ): any[] {
    return [
      { $match: this.buildBaseRoundMatch(params) },
      ...this.projectLookupStages(),
      ...this.projectDerivedFieldStages(),
      ...postLookupStages,
      {
        $facet: {
          rounds: [
            ...this.selectedRoundsWindowStages(offset, limit),
            { $sort: this.sortForMode(params.mode) },
          ],
          total: [{ $count: "count" }],
        },
      },
    ];
  }

  private selectedRoundsWindowStages(offset: number, limit: number): any[] {
    return [
      { $sort: this.selectedRoundsSort() },
      { $skip: offset },
      { $limit: limit },
    ];
  }

  private selectedRoundsSort(): Record<string, FundingFeedSortDirection> {
    return { fundingDate: -1, _id: 1 };
  }

  async getFilterOptions(limit = 8): Promise<{
    categories: FundingFeedFilterOption[];
    fundingTypes: FundingFeedFilterOption[];
  }> {
    const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);
    const readModelOptions = await this.tryGetFilterOptionsFromReadModel(
      safeLimit
    );
    if (readModelOptions) return readModelOptions;

    const [categories, fundingTypes] = await Promise.all([
      this.getCategoryOptions(safeLimit),
      this.getFundingTypeOptions(safeLimit),
    ]);

    return {
      categories,
      fundingTypes,
    };
  }

  private async tryGetFilterOptionsFromReadModel(limit: number): Promise<
    | {
        categories: FundingFeedFilterOption[];
        fundingTypes: FundingFeedFilterOption[];
      }
    | undefined
  > {
    const mode = this.readModelMode();
    if (mode === "legacy") return undefined;
    if (mode === "auto" && !(await this.isReadModelReady())) return undefined;

    try {
      const [categories, fundingTypes] = await Promise.all([
        this.getReadModelCategoryOptions(limit),
        this.getReadModelFundingTypeOptions(limit),
      ]);
      return { categories, fundingTypes };
    } catch (error) {
      if (this.readModelStrict()) throw error;
      return undefined;
    }
  }

  private async getReadModelCategoryOptions(
    limit: number
  ): Promise<FundingFeedFilterOption[]> {
    const rows = await this.fundingFeedRoundReadModel.aggregate([
      { $match: { visible: true } },
      {
        $match: {
          projectCategory: {
            $nin: ["", "-", "unknown", "Unknown", null],
          },
        },
      },
      {
        $group: {
          _id: "$projectCategory",
          count: { $sum: 1 },
          raised: { $sum: "$fundsRaisedForSort" },
          latestDate: { $max: "$fundingDate" },
        },
      },
      { $sort: { count: -1, raised: -1, latestDate: -1, _id: 1 } },
      { $limit: limit },
    ]);

    return (rows as any[]).map((row: any) => ({
      key: String(row._id),
      label: String(row._id),
      count: Number(row.count || 0),
    }));
  }

  private async getReadModelFundingTypeOptions(
    limit: number
  ): Promise<FundingFeedFilterOption[]> {
    const rows = await this.fundingFeedRoundReadModel.aggregate([
      { $match: { visible: true } },
      {
        $project: {
          key: {
            $ifNull: [
              "$normalizedRoundName",
              { $ifNull: ["$normalizedRoundType", "$roundType"] },
            ],
          },
          label: {
            $ifNull: [
              "$roundName",
              {
                $ifNull: [
                  "$normalizedRoundName",
                  { $ifNull: ["$normalizedRoundType", "$roundType"] },
                ],
              },
            ],
          },
          fundsRaisedForSort: 1,
          fundingDate: 1,
        },
      },
      {
        $match: {
          key: { $nin: ["", "-", "unknown", "Unknown", null] },
        },
      },
      {
        $group: {
          _id: { $toLower: "$key" },
          label: { $first: "$label" },
          count: { $sum: 1 },
          raised: { $sum: "$fundsRaisedForSort" },
          latestDate: { $max: "$fundingDate" },
        },
      },
      { $sort: { count: -1, raised: -1, latestDate: -1, _id: 1 } },
      { $limit: limit },
    ]);

    return (rows as any[]).map((row: any) => ({
      key: String(row._id),
      label: this.humanizeRoundType(row.label || row._id) || String(row._id),
      count: Number(row.count || 0),
    }));
  }

  async searchInvestors(
    query: FomoV2FundingFeedInvestorsQueryDto
  ): Promise<{ isSuccess: boolean; items: any[] }> {
    const search = String(query.search || "")
      .trim()
      .slice(0, 120);
    const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 50);
    if (!search) return { isSuccess: true, items: [] };

    const searchRegex = new RegExp(this.escapeRegExp(search), "i");
    const [backers, participantRows] = await Promise.all([
      this.backerReadModel
        .find({
          $or: [
            { name: searchRegex },
            { slug: searchRegex },
            { niche: searchRegex },
            { normalizedName: searchRegex },
          ],
        })
        .sort({ profileCompleteness: -1, name: 1 })
        .limit(limit * 2)
        .lean(),
      this.fundingRoundParticipantModel
        .find({
          status: { $nin: this.excludedParticipantStatuses },
          $or: [
            { backerName: searchRegex },
            { normalizedBackerName: searchRegex },
            { sourceBackerId: searchRegex },
            { sourceBackerSlug: searchRegex },
          ],
        })
        .sort({ isLead: -1, backerName: 1 })
        .limit(limit * 2)
        .lean(),
    ]);
    const backerIds = this.uniqueObjectIds(
      participantRows.map((participant: any) => participant?.backerId)
    );
    const participantBackers = backerIds.length
      ? await this.backerReadModel.find({ backerId: { $in: backerIds } }).lean()
      : [];
    const readModelByBackerId = new Map<string, any>(
      [...(backers as any[]), ...(participantBackers as any[])].map(
        (backer: any) => [this.toIdString(backer?.backerId), backer]
      )
    );
    const items = [
      ...(backers as any[]).map((backer: any) =>
        this.toInvestorSearchItem(undefined, backer)
      ),
      ...(participantRows as any[]).map((participant: any) =>
        this.toInvestorSearchItem(
          participant,
          readModelByBackerId.get(this.toIdString(participant?.backerId))
        )
      ),
    ];

    return {
      isSuccess: true,
      items: this.uniqueBy(items.filter(Boolean), (item: any) =>
        String(item?._id || item?.slug || item?.name || "").toLowerCase()
      ).slice(0, limit),
    };
  }

  async getProjectTopInvestors(
    projectKey: string,
    query: FomoV2ProjectTopInvestorsQueryDto = {}
  ): Promise<{
    ok: boolean;
    isSuccess: boolean;
    items: any[];
    investors: any[];
    total: number;
    totalAvailable: number;
    limit: number | null;
    project?: any;
    error?: string;
  }> {
    const includeAll = query.all === true;
    const limit = includeAll
      ? null
      : Math.min(Math.max(Number(query.limit) || 10, 1), 200);
    const project = await this.resolveProjectForTopInvestors(
      projectKey,
      query.lookup
    );

    if (!project?.canonicalProjectId) {
      return {
        ok: false,
        isSuccess: false,
        error: "Project not found",
        items: [],
        investors: [],
        total: 0,
        totalAvailable: 0,
        limit,
      };
    }

    const participants = await this.fundingRoundParticipantModel
      .find({
        canonicalProjectId: project.canonicalProjectId,
        status: { $nin: this.excludedParticipantStatuses },
      })
      .sort({ isLead: -1, backerName: 1, _id: 1 })
      .lean();

    if (!participants.length) {
      return {
        ok: true,
        isSuccess: true,
        items: [],
        investors: [],
        total: 0,
        totalAvailable: 0,
        limit,
        project,
      };
    }

    const participantBackerIds = this.uniqueObjectIds(
      participants.map((participant: any) => participant?.backerId)
    );
    const participantRoundIds = this.uniqueObjectIds(
      participants.map((participant: any) => participant?.fundingRoundId)
    );
    const [backers, backerListItems, rounds, roundReadModels] =
      await Promise.all([
        this.backerReadModel
          .find({
            backerId: { $in: participantBackerIds },
          })
          .lean(),
        this.backerListReadModel
          .find(
            { backerId: { $in: participantBackerIds } },
            { backerId: 1, rating: 1, fomoScore: 1 }
          )
          .lean(),
        this.fundingRoundModel
          .find({
            _id: { $in: participantRoundIds },
          })
          .lean(),
        this.fundingFeedRoundReadModel
          .find(
            { fundingRoundId: { $in: participantRoundIds } },
            { fundingRoundId: 1, investors: 1 }
          )
          .lean(),
      ]);
    const backersById = new Map<string, any>(
      (backers as any[]).map((backer: any) => [
        this.toIdString(backer?.backerId),
        backer,
      ])
    );
    const backerListById = new Map<string, any>(
      (backerListItems as any[]).map((backer: any) => [
        this.toIdString(backer?.backerId),
        backer,
      ])
    );
    const roundsById = new Map<string, any>(
      (rounds as any[]).map((round: any) => [
        this.toIdString(round?._id),
        round,
      ])
    );
    const investorRatingByKey = this.buildProjectInvestorRatingByKey(
      roundReadModels as any[]
    );
    const groups = this.groupProjectInvestorParticipants(
      participants as any[],
      roundsById
    );
    const sortedItems = Array.from(groups.values())
      .map((group: any) =>
        this.toProjectTopInvestor(
          group,
          backersById.get(group.backerId),
          backerListById.get(group.backerId),
          investorRatingByKey
        )
      )
      .filter(Boolean)
      .sort((left: any, right: any) => {
        const leadDiff = Number(Boolean(right.isLead)) - Number(Boolean(left.isLead));
        if (leadDiff !== 0) return leadDiff;
        const countDiff =
          Number(right.participationCount || 0) -
          Number(left.participationCount || 0);
        if (countDiff !== 0) return countDiff;
        const dateDiff =
          Number(right.latestFundingDateTs || 0) -
          Number(left.latestFundingDateTs || 0);
        if (dateDiff !== 0) return dateDiff;
        const completenessDiff =
          Number(right.profileCompleteness || 0) -
          Number(left.profileCompleteness || 0);
        if (completenessDiff !== 0) return completenessDiff;
        return String(left.name || "").localeCompare(String(right.name || ""));
      })
      .map(({ latestFundingDateTs, ...item }: any) => item);
    const items = limit === null ? sortedItems : sortedItems.slice(0, limit);

    return {
      ok: true,
      isSuccess: true,
      items,
      investors: items,
      total: sortedItems.length,
      totalAvailable: sortedItems.length,
      limit,
      project,
    };
  }

  async getProjectRounds(
    projectKey: string,
    query: FomoV2FundingProjectRoundsQueryDto = {},
  ): Promise<any[]> {
    const project = await this.resolveProjectForTopInvestors(
      projectKey,
      query.lookup,
    );
    const canonicalProjectId = this.toIdString(project?.canonicalProjectId);
    if (!canonicalProjectId || !Types.ObjectId.isValid(canonicalProjectId)) {
      return [];
    }

    const { rounds } = await this.listRounds({
      canonicalProjectId,
      limit: Math.min(Math.max(Number(query.limit) || 100, 1), 200),
      offset: 0,
      mode: "old",
    });

    return rounds;
  }

  private async resolveProjectForTopInvestors(
    projectKey: string,
    lookup?: string
  ): Promise<any | undefined> {
    const key = this.firstString(projectKey);
    if (!key) return undefined;

    const lookupMode = this.normalizeKey(String(lookup || ""));
    const normalizedKey = this.normalizeText(key);
    const objectId = Types.ObjectId.isValid(key)
      ? new Types.ObjectId(key)
      : undefined;

    if (["canonicalprojectid", "canonical_project_id"].includes(lookupMode)) {
      if (!objectId) return undefined;
      const canonicalProject = await this.canonicalProjectModel
        .findById(objectId, {
          name: 1,
          slug: 1,
          symbol: 1,
          providerIds: 1,
        })
        .lean();

      return this.toTopInvestorsProjectIdentity(undefined, canonicalProject);
    }

    const readModelProjection = {
      canonicalProjectId: 1,
      marketAssetId: 1,
      name: 1,
      slug: 1,
      symbol: 1,
      providerIds: 1,
    };

    if (["coingeckoid", "coingecko_id", "coingecko"].includes(lookupMode)) {
      const readModel = await this.marketProjectReadModel
        .findOne(
          {
            "providerIds.coingeckoId": normalizedKey,
          },
          readModelProjection
        )
        .lean();

      return this.toTopInvestorsProjectIdentity(readModel);
    }

    if (["marketassetid", "market_asset_id"].includes(lookupMode)) {
      if (!objectId) return undefined;
      const readModel = await this.marketProjectReadModel
        .findOne({ marketAssetId: objectId }, readModelProjection)
        .lean();

      return this.toTopInvestorsProjectIdentity(readModel);
    }

    if (["readmodelid", "read_model_id"].includes(lookupMode)) {
      if (!objectId) return undefined;
      const readModel = await this.marketProjectReadModel
        .findById(objectId, readModelProjection)
        .lean();

      return this.toTopInvestorsProjectIdentity(readModel);
    }

    const readModelOr: any[] = [
      { "providerIds.coingeckoId": normalizedKey },
      { slug: key },
      { slug: normalizedKey },
      { legacyRouteId: key },
    ];
    if (objectId) {
      readModelOr.push(
        { _id: objectId },
        { canonicalProjectId: objectId },
        { marketAssetId: objectId },
        { legacyProjectId: objectId }
      );
    }

    const readModel = await this.marketProjectReadModel
      .findOne({ $or: readModelOr }, readModelProjection)
      .lean();
    if (readModel) return this.toTopInvestorsProjectIdentity(readModel);

    const canonicalOr: any[] = [
      { slug: key },
      { slug: normalizedKey },
      { "providerIds.coingeckoId": normalizedKey },
      { normalizedName: normalizedKey },
      { "aliases.normalizedValue": normalizedKey },
    ];
    if (objectId) canonicalOr.unshift({ _id: objectId });

    const canonicalProject = await this.canonicalProjectModel
      .findOne(
        { $or: canonicalOr },
        {
          name: 1,
          slug: 1,
          symbol: 1,
          providerIds: 1,
        }
      )
      .lean();

    return this.toTopInvestorsProjectIdentity(undefined, canonicalProject);
  }

  private toTopInvestorsProjectIdentity(
    readModel?: any,
    canonicalProject?: any
  ): any | undefined {
    const canonicalProjectId =
      this.toIdString(readModel?.canonicalProjectId) ||
      this.toIdString(canonicalProject?._id);
    if (!canonicalProjectId || !Types.ObjectId.isValid(canonicalProjectId)) {
      return undefined;
    }

    return this.cleanObject({
      canonicalProjectId: new Types.ObjectId(canonicalProjectId),
      canonicalProjectIdString: canonicalProjectId,
      marketAssetId: this.toIdString(readModel?.marketAssetId),
      readModelId: this.toIdString(readModel?._id),
      coingeckoId: this.firstString(
        readModel?.providerIds?.coingeckoId,
        canonicalProject?.providerIds?.coingeckoId
      ),
      name: this.firstString(readModel?.name, canonicalProject?.name),
      slug: this.firstString(readModel?.slug, canonicalProject?.slug),
      symbol: this.firstString(readModel?.symbol, canonicalProject?.symbol),
    });
  }

  private groupProjectInvestorParticipants(
    participants: any[],
    roundsById: Map<string, any>
  ): Map<string, any> {
    const groups = new Map<string, any>();

    participants.forEach((participant: any, index: number) => {
      const backerId = this.toIdString(participant?.backerId);
      const key =
        backerId ||
        this.firstString(
          participant?.sourceBackerId,
          participant?.sourceBackerSlug,
          participant?.backerName,
          participant?.normalizedBackerName
        );
      if (!key) return;

      const round = roundsById.get(this.toIdString(participant?.fundingRoundId));
      const fundingDate =
        this.toDate(round?.announcedDate) || this.toDate(round?.date);
      const current = groups.get(key) || {
        key,
        backerId,
        firstParticipant: participant,
        participants: [],
        rounds: [],
        roles: new Set<string>(),
        isLead: false,
        leadCount: 0,
        participationCount: 0,
        latestFundingDate: undefined,
        latestFundingDateTs: 0,
        firstOrder: index,
      };

      current.participants.push(participant);
      current.participationCount += 1;
      current.isLead =
        current.isLead ||
        Boolean(participant?.isLead || participant?.role === "lead");
      if (participant?.isLead || participant?.role === "lead") {
        current.leadCount += 1;
      }
      if (participant?.role) current.roles.add(String(participant.role));
      if (round) {
        current.rounds.push(round);
      }
      if (fundingDate && fundingDate.getTime() > current.latestFundingDateTs) {
        current.latestFundingDate = fundingDate;
        current.latestFundingDateTs = fundingDate.getTime();
      }

      groups.set(key, current);
    });

    return groups;
  }

  private buildProjectInvestorRatingByKey(
    roundReadModels: any[]
  ): Map<string, number> {
    const ratings = new Map<string, number>();

    for (const row of roundReadModels || []) {
      const investors = Array.isArray(row?.investors) ? row.investors : [];

      for (const investor of investors) {
        const rating = this.firstPositiveNumber(
          investor?.rating,
          investor?.fomoScore,
          investor?.ratingBreakdown?.score,
          investor?.stats?.rating,
          investor?.score,
          investor?.metadata?.rating,
          investor?.metadata?.fomoScore,
          investor?.details?.rating,
          investor?.details?.fomoScore
        );
        if (rating === undefined) continue;

        for (const key of this.projectInvestorRatingKeys(investor)) {
          if (!ratings.has(key) || rating > Number(ratings.get(key) || 0)) {
            ratings.set(key, rating);
          }
        }
      }
    }

    return ratings;
  }

  private toProjectTopInvestor(
    group: any,
    backer: any,
    backerListItem?: any,
    investorRatingByKey: Map<string, number> = new Map()
  ): any | undefined {
    const participant = group?.firstParticipant || {};
    const name = this.firstString(
      backer?.name,
      participant?.backerName,
      participant?.normalizedBackerName,
      participant?.sourceBackerSlug,
      participant?.sourceBackerId
    );
    if (!name) return undefined;

    const backerId = this.toIdString(backer?.backerId) || group.backerId;
    const slug = this.firstString(backer?.slug, participant?.sourceBackerSlug);
    const logo = this.firstString(backer?.logoUrl, backer?.avatarUrl);
    const backerType = this.firstString(backer?.backerType, "fund");
    const description = this.firstString(
      backer?.description,
      backer?.country,
      backerType
    );
    const profileCompleteness = this.toFiniteNumber(
      backer?.profileCompleteness
    );
    const rating = this.resolveProjectTopInvestorRating(
      group,
      backer,
      backerListItem,
      investorRatingByKey
    );
    const routeId = slug || backerId || participant?.sourceBackerId || name;
    const rounds = this.uniqueBy(
      (group.rounds || []).map((round: any) =>
        this.cleanObject({
          id: this.toIdString(round?._id),
          stage: this.firstString(
            round?.roundName,
            this.humanizeRoundType(round?.normalizedRoundType),
            this.humanizeRoundType(round?.roundType)
          ),
          date:
            this.toDate(round?.announcedDate)?.toISOString() ||
            this.toDate(round?.date)?.toISOString(),
          raisedAmount: this.toFiniteNumber(round?.raisedAmount),
        })
      ),
      (round: any) => String(round?.id || "")
    );

    return this.cleanObject({
      _id: backerId || routeId,
      id: backerId || routeId,
      backerId,
      entityType: backerType === "person" ? "person" : "fund",
      type: backerType,
      investorType: backerType,
      ventureType: backerType,
      niche: backer?.niche,
      name,
      slug,
      investorSlug: slug,
      logo,
      avatar: logo,
      image: logo,
      description,
      banner: description,
      rating,
      fomoScore: rating,
      profileCompleteness,
      isLead: Boolean(group.isLead),
      lead: Boolean(group.isLead),
      leadCount: group.leadCount,
      participationCount: group.participationCount,
      roundsCount: rounds.length,
      latestFundingDate: group.latestFundingDate?.toISOString(),
      latestFundingDateTs: group.latestFundingDateTs,
      roles: Array.from(group.roles || []),
      rounds: rounds.slice(0, 5),
      sourceBackerId: participant?.sourceBackerId,
      sourceBackerSlug: participant?.sourceBackerSlug,
      sourceBackerUrl: participant?.sourceBackerUrl,
      url:
        backerType === "person"
          ? `/crypto/persons/${backerId || routeId}`
          : `/crypto/funds/${routeId}`,
      details: this.cleanObject({
        _id: backerId,
        id: backerId,
        name,
        slug,
        logo,
        logoUrl: backer?.logoUrl,
        avatarUrl: backer?.avatarUrl,
        type: backerType,
        niche: backer?.niche,
        website: backer?.website,
        socials: backer?.socials,
        rating,
        fomoScore: rating,
        profileCompleteness,
      }),
    });
  }

  private resolveProjectTopInvestorRating(
    group: any,
    backer: any,
    backerListItem: any,
    investorRatingByKey: Map<string, number>
  ): number {
    const participant = group?.firstParticipant || {};
    const directRating = this.firstPositiveNumber(
      backerListItem?.rating,
      backerListItem?.fomoScore,
      backerListItem?.ratingBreakdown?.score,
      backerListItem?.stats?.rating,
      backer?.rating,
      backer?.fomoScore,
      backer?.ratingBreakdown?.score,
      backer?.stats?.rating,
      backer?.metadata?.rating,
      backer?.metadata?.fomoScore,
      participant?.rating,
      participant?.fomoScore,
      participant?.ratingBreakdown?.score,
      participant?.metadata?.rating,
      participant?.metadata?.fomoScore,
      participant?.metadata?.backer?.rating,
      participant?.metadata?.backer?.fomoScore
    );
    if (directRating !== undefined) return Math.round(directRating);

    const ratingKeys = this.projectInvestorRatingKeys(
      group,
      backer,
      backerListItem,
      participant,
      ...(Array.isArray(group?.participants) ? group.participants : [])
    );
    for (const key of ratingKeys) {
      const rating = investorRatingByKey.get(key);
      if (rating !== undefined && rating > 0) return Math.round(rating);
    }

    return 0;
  }

  private projectInvestorRatingKeys(...sources: any[]): string[] {
    const values: string[] = [];

    for (const source of sources) {
      if (!source || typeof source !== "object") continue;
      const backerId = this.toIdString(source?.backerId);
      if (backerId) values.push(backerId);

      values.push(
        ...([
          source?.key,
          source?.id,
          source?.sourceBackerId,
          source?.sourceBackerSlug,
          source?.investorSlug,
          source?.slug,
          source?.backerName,
          source?.normalizedBackerName,
          source?.name,
          source?.details?.id,
          source?.details?.sourceBackerId,
          source?.details?.sourceBackerSlug,
          source?.details?.slug,
          source?.details?.name,
        ]
          .map((value) => this.toStringValue(value))
          .filter(Boolean) as string[])
      );
    }

    return this.uniqueStrings(
      values.map((value) => this.normalizeText(value)).filter(Boolean)
    );
  }

  private firstPositiveNumber(...values: any[]): number | undefined {
    for (const value of values) {
      const numberValue = this.toFiniteNumber(value);
      if (numberValue !== undefined && numberValue > 0) return numberValue;
    }

    return undefined;
  }

  private async getCategoryOptions(
    limit: number
  ): Promise<FundingFeedFilterOption[]> {
    const rows = await this.fundingRoundModel.aggregate([
      { $match: this.activeRoundsMatch() },
      ...this.projectLookupStages({ includeParticipants: false }),
      ...this.projectIdentityFieldStages(),
      {
        $addFields: {
          projectCategory: this.firstMongoValue([
            "$marketProject.category",
            { $arrayElemAt: ["$marketProject.topCategories", 0] },
            { $arrayElemAt: ["$marketProject.categories", 0] },
            { $arrayElemAt: ["$icoProject.categories", 0] },
            "$canonicalProject.metadata.category",
          ]),
          fundsRaisedForSort: { $ifNull: ["$raisedAmount", 0] },
          fundingDateForSort: { $ifNull: ["$announcedDate", "$date"] },
        },
      },
      {
        $match: {
          projectCategory: {
            $nin: ["", "-", "unknown", "Unknown", null],
          },
        },
      },
      {
        $group: {
          _id: "$projectCategory",
          count: { $sum: 1 },
          raised: { $sum: "$fundsRaisedForSort" },
          latestDate: { $max: "$fundingDateForSort" },
        },
      },
      { $sort: { count: -1, raised: -1, latestDate: -1, _id: 1 } },
      { $limit: limit },
    ]);

    return (rows as any[]).map((row: any) => ({
      key: String(row._id),
      label: String(row._id),
      count: Number(row.count || 0),
    }));
  }

  private async getFundingTypeOptions(
    limit: number
  ): Promise<FundingFeedFilterOption[]> {
    const rows = await this.fundingRoundModel.aggregate([
      { $match: this.activeRoundsMatch() },
      {
        $project: {
          key: this.firstMongoValue([
            "$normalizedRoundName",
            "$normalizedRoundType",
            "$roundType",
            "$roundName",
          ]),
          label: this.firstMongoValue([
            "$roundName",
            "$normalizedRoundName",
            "$normalizedRoundType",
            "$roundType",
          ]),
          raisedAmount: { $ifNull: ["$raisedAmount", 0] },
          fundingDate: { $ifNull: ["$announcedDate", "$date"] },
        },
      },
      {
        $match: {
          key: { $nin: ["", "-", "unknown", "Unknown", null] },
        },
      },
      {
        $group: {
          _id: { $toLower: "$key" },
          label: { $first: "$label" },
          count: { $sum: 1 },
          raised: { $sum: "$raisedAmount" },
          latestDate: { $max: "$fundingDate" },
        },
      },
      { $sort: { count: -1, raised: -1, latestDate: -1, _id: 1 } },
      { $limit: limit },
    ]);

    return (rows as any[]).map((row: any) => ({
      key: String(row._id),
      label: this.humanizeRoundType(row.label || row._id),
      count: Number(row.count || 0),
    }));
  }

  private buildBaseRoundMatch(params: FomoV2FundingFeedListQueryDto): any {
    const conditions: any[] = [this.activeRoundsMatch()];
    if (
      params.canonicalProjectId &&
      Types.ObjectId.isValid(params.canonicalProjectId)
    ) {
      conditions.push({
        canonicalProjectId: new Types.ObjectId(params.canonicalProjectId),
      });
    }
    const fundingTypeCondition = this.buildFundingTypeCondition(
      params.fundingType
    );
    const fundsRaisedCondition = this.buildRangeCondition(
      "raisedAmount",
      params.fundsRaised
    );
    const preValuationCondition = this.buildRangeCondition(
      "valuation",
      params.preValuation
    );
    const fundingDateCondition = this.buildFundingDateCondition(
      params.fundingDates
    );

    if (fundingTypeCondition) conditions.push(fundingTypeCondition);
    if (fundsRaisedCondition) conditions.push(fundsRaisedCondition);
    if (preValuationCondition) conditions.push(preValuationCondition);
    if (fundingDateCondition) conditions.push(fundingDateCondition);

    return conditions.length === 1 ? conditions[0] : { $and: conditions };
  }

  private activeRoundsMatch(): any {
    return {
      status: { $nin: this.excludedRoundStatuses },
    };
  }

  private buildFundingTypeCondition(value?: string): any | undefined {
    const items = this.parseCsv(value).filter((item) => item !== "all");
    if (!items.length) return undefined;

    const normalizedKeys = this.uniqueStrings(
      items.map((item) => this.normalizeKey(item))
    );
    const lowerKeys = this.uniqueStrings(
      items.map((item) => this.normalizeText(item))
    );
    const exactRegexes = items.map((item) => this.exactRegex(item));

    return {
      $or: [
        { normalizedRoundType: { $in: normalizedKeys } },
        { roundType: { $in: normalizedKeys } },
        { normalizedRoundName: { $in: [...lowerKeys, ...normalizedKeys] } },
        { roundName: { $in: exactRegexes } },
      ],
    };
  }

  private buildRangeCondition(field: string, value?: string): any | undefined {
    const ranges = this.parseNumericRanges(value);
    if (!ranges.length) return undefined;

    return {
      $or: ranges.map((range) => ({
        [field]: range.condition,
      })),
    };
  }

  private buildFundingDateCondition(value?: string): any | undefined {
    const items = this.parseCsv(value);
    if (!items.length) return undefined;

    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const conditions = items
      .flatMap((item) => {
        const days = Number(item.replace(/\D/g, ""));
        if (!Number.isFinite(days)) return [];
        const cutoff = new Date(now - days * day);
        const condition = item.startsWith(">")
          ? { $lt: cutoff }
          : item.startsWith("<")
          ? { $gte: cutoff }
          : undefined;
        if (!condition) return [];

        return [{ announcedDate: condition }, { date: condition }];
      })
      .filter(Boolean);

    return conditions.length ? { $or: conditions } : undefined;
  }

  private postLookupMatchStages(params: FomoV2FundingFeedListQueryDto): any[] {
    const conditions: any[] = [];
    const search = String(params.search || "")
      .trim()
      .slice(0, 120);
    const categories = this.parseCsv(params.categories).filter(
      (item) => item !== "all"
    );
    const companyTypes = this.parseCsv(params.companyType).filter(
      (item) => item !== "all"
    );
    const devStages = this.parseCsv(params.devStage).filter(
      (item) => item !== "all"
    );
    const investorCondition = this.buildInvestorCondition(params);
    const hasTokenCondition = this.buildHasTokenCondition(params.hasToken);
    const fomoScoreCondition = this.buildRangeCondition(
      "projectFomoScore",
      params.fomoScore
    );
    const redFlagsCondition = this.buildRangeCondition(
      "projectRedFlags",
      params.redFlags
    );
    const chain = String(params.chain || "").trim();

    if (search) {
      const searchRegex = new RegExp(this.escapeRegExp(search), "i");
      conditions.push({
        $or: [
          { projectName: searchRegex },
          { projectSymbol: searchRegex },
          { projectSlug: searchRegex },
          { roundName: searchRegex },
          { normalizedRoundName: searchRegex },
          { normalizedRoundType: searchRegex },
          { roundType: searchRegex },
          { primarySource: searchRegex },
          { sourceType: searchRegex },
          { sourceFeed: searchRegex },
          { "participants.backerName": searchRegex },
          { "participants.normalizedBackerName": searchRegex },
          { "participants.sourceBackerSlug": searchRegex },
          { "backers.name": searchRegex },
          { "backers.slug": searchRegex },
        ],
      });
    }

    if (categories.length) {
      conditions.push(this.projectCategoryCondition(categories));
    }

    if (companyTypes.length) {
      conditions.push(this.projectCategoryCondition(companyTypes));
    }

    if (devStages.length) {
      conditions.push({
        $or: [
          {
            normalizedRoundType: {
              $in: devStages.map((item) => this.normalizeKey(item)),
            },
          },
          {
            roundType: {
              $in: devStages.map((item) => this.normalizeKey(item)),
            },
          },
          { projectStatus: { $in: devStages } },
          { "icoProject.status": { $in: devStages } },
          { "marketProject.status": { $in: devStages } },
        ],
      });
    }

    if (investorCondition) conditions.push(investorCondition);
    if (hasTokenCondition) conditions.push(hasTokenCondition);
    if (fomoScoreCondition) conditions.push(fomoScoreCondition);
    if (redFlagsCondition) conditions.push(redFlagsCondition);

    if (chain) {
      const chainRegex = new RegExp(this.escapeRegExp(chain), "i");
      conditions.push({
        $or: [
          { primarySource: chainRegex },
          { sourceType: chainRegex },
          { sourceFeed: chainRegex },
          { "marketProject.contracts.chain": chainRegex },
          { "marketProject.contracts.network": chainRegex },
          { "marketProject.contracts.platform": chainRegex },
          { "marketProject.links": chainRegex },
        ],
      });
    }

    return conditions.length ? [{ $match: { $and: conditions } }] : [];
  }

  private projectCategoryCondition(values: string[]): any {
    return {
      $or: [
        { projectCategory: { $in: values } },
        { "marketProject.category": { $in: values } },
        { "marketProject.categories": { $in: values } },
        { "marketProject.topCategories": { $in: values } },
        { "icoProject.categories": { $in: values } },
        { "canonicalProject.metadata.category": { $in: values } },
      ],
    };
  }

  private buildInvestorCondition(
    params: FomoV2FundingFeedListQueryDto
  ): any | undefined {
    const investorIds = this.parseCsv(params.investors);
    const backerObjectIds = investorIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    const sourceIds = [
      ...this.parseCsv(params.investorDropstabIds),
      ...investorIds.filter((id) => !Types.ObjectId.isValid(id)),
    ];
    const slugs = this.parseCsv(params.investorSlugs);
    const names = this.parseCsv(params.investorNames);
    const conditions: any[] = [];

    if (backerObjectIds.length) {
      conditions.push({ "participants.backerId": { $in: backerObjectIds } });
      conditions.push({ "backers.backerId": { $in: backerObjectIds } });
    }
    if (sourceIds.length) {
      conditions.push({ "participants.sourceBackerId": { $in: sourceIds } });
    }
    if (slugs.length) {
      conditions.push({ "participants.sourceBackerSlug": { $in: slugs } });
      conditions.push({ "backers.slug": { $in: slugs } });
    }
    if (names.length) {
      const nameRegexes = names.map((name) => this.exactRegex(name));
      conditions.push({ "participants.backerName": { $in: nameRegexes } });
      conditions.push({ "backers.name": { $in: nameRegexes } });
    }

    return conditions.length ? { $or: conditions } : undefined;
  }

  private buildHasTokenCondition(value?: string): any | undefined {
    const hasToken = this.parseCsv(value);
    if (hasToken.includes("yes") && !hasToken.includes("no")) {
      return { hasToken: true };
    }
    if (hasToken.includes("no") && !hasToken.includes("yes")) {
      return { hasToken: false };
    }
    return undefined;
  }

  private sortForMode(mode = "all"): Record<string, FundingFeedSortDirection> {
    switch (mode) {
      case "old":
        return { fundingDate: 1, _id: 1 };
      case "fundsRaisedAsc":
        return { fundsRaisedForSort: 1, fundingDate: -1, _id: 1 };
      case "fundsRaisedDesc":
      case "trending":
      case "smart":
        return { fundsRaisedForSort: -1, fundingDate: -1, _id: 1 };
      case "preValuationAsc":
        return { preValuationForSort: 1, fundingDate: -1, _id: 1 };
      case "preValuationDesc":
        return { preValuationForSort: -1, fundingDate: -1, _id: 1 };
      case "fomoScoreAsc":
        return { projectFomoScore: 1, fundingDate: -1, _id: 1 };
      case "fomoScoreDesc":
        return { projectFomoScore: -1, fundingDate: -1, _id: 1 };
      case "new":
      case "all":
      default:
        return { fundingDate: -1, _id: 1 };
    }
  }

  private sortNeedsProjectData(mode = "all"): boolean {
    return mode === "fomoScoreAsc" || mode === "fomoScoreDesc";
  }

  private roundSortFieldStages(): any[] {
    return [
      {
        $addFields: {
          fundingDate: { $ifNull: ["$announcedDate", "$date"] },
          fundsRaisedForSort: {
            $ifNull: ["$raisedAmount", { $ifNull: ["$metadata.amountUsd", 0] }],
          },
          preValuationForSort: {
            $ifNull: ["$valuation", { $ifNull: ["$metadata.valuationUsd", 0] }],
          },
        },
      },
    ];
  }

  private projectLookupStages(
    options: { includeParticipants?: boolean } = {}
  ): any[] {
    const includeParticipants = options.includeParticipants !== false;
    const stages: any[] = [
      {
        $lookup: {
          from: "market_project_read_models",
          localField: "canonicalProjectId",
          foreignField: "canonicalProjectId",
          as: "marketProjectRows",
        },
      },
      {
        $lookup: {
          from: "ico_project_read_models",
          localField: "canonicalProjectId",
          foreignField: "canonicalProjectId",
          as: "icoProjectRows",
        },
      },
      {
        $lookup: {
          from: "canonical_projects",
          localField: "canonicalProjectId",
          foreignField: "_id",
          as: "canonicalProjectRows",
        },
      },
    ];

    if (includeParticipants) {
      stages.push(
        {
          $lookup: {
            from: "funding_round_participants",
            let: { fundingRoundId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$fundingRoundId", "$$fundingRoundId"] },
                  status: { $nin: this.excludedParticipantStatuses },
                },
              },
              { $sort: { isLead: -1, backerName: 1, _id: 1 } },
            ],
            as: "participants",
          },
        },
        {
          $lookup: {
            from: "backer_read_models",
            localField: "participants.backerId",
            foreignField: "backerId",
            as: "backers",
          },
        },
        {
          $lookup: {
            from: "backers",
            localField: "participants.backerId",
            foreignField: "_id",
            as: "backerSources",
          },
        }
      );
    }

    return stages;
  }

  private projectDerivedFieldStages(): any[] {
    return [
      ...this.projectIdentityFieldStages(),
      {
        $addFields: {
          fundingDate: { $ifNull: ["$announcedDate", "$date"] },
          fundsRaisedForSort: {
            $ifNull: ["$raisedAmount", { $ifNull: ["$metadata.amountUsd", 0] }],
          },
          preValuationForSort: {
            $ifNull: ["$valuation", { $ifNull: ["$metadata.valuationUsd", 0] }],
          },
          projectFomoScore: {
            $convert: {
              input: this.firstMongoValue([
                "$marketProject.fomoScore",
                "$marketProject.rating",
                "$icoProject.metadata.fomoScore",
                "$canonicalProject.metadata.fomoScore",
                0,
              ]),
              to: "double",
              onError: 0,
              onNull: 0,
            },
          },
          projectRedFlags: {
            $convert: {
              input: this.firstMongoValue([
                "$marketProject.redFlags",
                "$icoProject.metadata.redFlags",
                "$canonicalProject.metadata.redFlags",
                0,
              ]),
              to: "double",
              onError: 0,
              onNull: 0,
            },
          },
          hasToken: {
            $or: [
              { $ne: ["$marketAssetId", null] },
              { $ne: ["$marketProject.marketAssetId", null] },
              { $ne: ["$marketProject.providerIds.coingeckoId", null] },
              { $eq: ["$icoProject.hasMarketData", true] },
              { $ne: ["$icoProject.marketAssetId", null] },
              { $eq: ["$canonicalProject.hasMarketData", true] },
            ],
          },
        },
      },
    ];
  }

  private projectIdentityFieldStages(): any[] {
    return [
      {
        $addFields: {
          marketProject: { $first: "$marketProjectRows" },
          icoProject: { $first: "$icoProjectRows" },
          canonicalProject: { $first: "$canonicalProjectRows" },
        },
      },
      {
        $addFields: {
          projectName: this.firstMongoValue([
            "$marketProject.name",
            "$icoProject.name",
            "$canonicalProject.name",
          ]),
          projectSymbol: this.firstMongoValue([
            "$marketProject.symbol",
            "$icoProject.symbol",
            "$canonicalProject.symbol",
          ]),
          projectSlug: this.firstMongoValue([
            "$marketProject.slug",
            "$icoProject.slug",
            "$canonicalProject.slug",
          ]),
          projectLogo: this.firstMongoValue([
            "$marketProject.logo",
            "$icoProject.logoUrl",
            "$canonicalProject.metadata.logo",
          ]),
          projectCategory: this.firstMongoValue([
            "$marketProject.category",
            { $arrayElemAt: ["$marketProject.topCategories", 0] },
            { $arrayElemAt: ["$marketProject.categories", 0] },
            { $arrayElemAt: ["$icoProject.categories", 0] },
            "$canonicalProject.metadata.category",
          ]),
          projectStatus: this.firstMongoValue([
            "$marketProject.status",
            "$icoProject.status",
            "$canonicalProject.status",
          ]),
        },
      },
    ];
  }

  private toFundingFeedRoundFromReadModel(row: any): any {
    const investors = this.toLegacyReadModelInvestors(row);
    const stage =
      this.firstString(
        row?.roundName,
        this.humanizeRoundType(row?.normalizedRoundName),
        this.humanizeRoundType(row?.normalizedRoundType),
        this.humanizeRoundType(row?.roundType)
      ) || "Funding";
    const fundingDate = this.toDate(row?.fundingDate);
    const category = this.firstString(row?.projectCategory, "-") || "-";
    const logo = this.firstString(row?.projectLogo, "");
    const fomoScore = this.toFiniteNumber(row?.projectFomoScore) || 0;
    const redFlags = this.toFiniteNumber(row?.projectRedFlags) || 0;
    const hasToken = Boolean(row?.hasToken);
    const projectRouteType =
      hasToken && row?.marketRouteId ? "market" : "project";
    const projectRouteId =
      projectRouteType === "market" ? row?.marketRouteId : row?.projectRouteId;
    const projectId = this.toIdString(row?.canonicalProjectId);
    const roi = this.normalizeRoi(row?.roi);
    const platform = this.normalizePlatform(row?.platform);

    return this.cleanObject({
      _id: this.toIdString(row?.fundingRoundId || row?._id),
      id: this.toIdString(row?.fundingRoundId || row?._id),
      canonicalProjectId: this.toIdString(row?.canonicalProjectId),
      marketAssetId: this.toIdString(row?.marketAssetId),
      projectId,
      projectLinks: projectRouteId
        ? [
            {
              projectId: projectRouteId,
              projectType: projectRouteType,
              confidence: row?.confidence,
              matchedBy: "fomo-v2",
              reason: "funding-feed-read-model",
            },
          ]
        : [],
      projectName: this.firstString(
        row?.projectName,
        row?.projectSlug,
        "Unknown Project"
      ),
      coinSlug: this.firstString(row?.projectSlug, row?.sourceSlug),
      coinSymbol: this.firstString(row?.projectSymbol, ""),
      image: logo,
      logo,
      stage,
      roundType: row?.roundType,
      normalizedRoundType: row?.normalizedRoundType,
      fundsRaised: this.toFiniteNumber(row?.fundsRaisedForSort) || 0,
      preValuation: this.toFiniteNumber(row?.preValuationForSort) || 0,
      raisedCurrency: this.firstString(row?.raisedCurrency, "USD"),
      tokenPrice: this.toFiniteNumber(row?.tokenPrice),
      tokensForSaleAmount: this.toFiniteNumber(row?.tokensForSaleAmount),
      tokensForSalePercent: this.toFiniteNumber(row?.tokensForSalePercent),
      roi,
      platform,
      platformName: platform?.name,
      investors,
      category,
      date: fundingDate ? fundingDate.toISOString() : undefined,
      announcedDate: fundingDate ? fundingDate.toISOString() : undefined,
      hasToken,
      rating: fomoScore,
      fomoScore,
      likes: this.toFiniteNumber(row?.projectLikes) || 0,
      redFlags,
      redFlagsList:
        redFlags > 0
          ? Array.from({ length: Math.min(redFlags, 20) }, () => ({}))
          : [],
      projectSnapshot: {
        _id: projectId,
        canonicalProjectId: this.toIdString(row?.canonicalProjectId),
        name: this.firstString(
          row?.projectName,
          row?.projectSlug,
          "Unknown Project"
        ),
        slug: this.firstString(row?.projectSlug, row?.sourceSlug),
        symbol: this.firstString(row?.projectSymbol, ""),
        logo,
        mainCategory: { name: category },
      },
    });
  }

  private toLegacyReadModelInvestors(row: any): any[] {
    return (Array.isArray(row?.investors) ? row.investors : [])
      .map((investor: any) => {
        const name = this.firstString(
          investor?.name,
          investor?.sourceBackerSlug,
          investor?.sourceBackerId
        );
        if (!name) return undefined;
        const backerId = this.toIdString(investor?.backerId);
        const slug = this.firstString(
          investor?.slug,
          investor?.sourceBackerSlug
        );
        const rating = this.toFiniteNumber(investor?.rating) ?? 0;

        return this.cleanObject({
          _id: backerId || investor?.sourceBackerId || slug || name,
          id: backerId || investor?.sourceBackerId || slug || name,
          name,
          investorSlug: slug,
          slug,
          niche: this.firstString(investor?.niche, investor?.role, "fund"),
          rating,
          fomoScore: rating,
          ventureType: this.firstString(
            investor?.ventureType,
            investor?.role,
            "fund"
          ),
          lead: Boolean(investor?.isLead),
          isLead: Boolean(investor?.isLead),
          image: investor?.logo,
          logo: investor?.logo,
          sourceBackerId: investor?.sourceBackerId,
          sourceBackerSlug: investor?.sourceBackerSlug,
          sourceBackerUrl: investor?.sourceBackerUrl,
          details: this.cleanObject({
            _id: backerId,
            id: backerId,
            name,
            slug,
            logo: investor?.logo,
            type: investor?.ventureType,
            niche: this.firstString(investor?.niche, investor?.role, "fund"),
            rating,
            fomoScore: rating,
          }),
        });
      })
      .filter(Boolean);
  }

  private toFundingFeedRound(row: any): any {
    const investors = this.toLegacyInvestors(row);
    const stage =
      this.firstString(
        row?.roundName,
        this.humanizeRoundType(row?.normalizedRoundName),
        this.humanizeRoundType(row?.normalizedRoundType),
        this.humanizeRoundType(row?.roundType)
      ) || "Funding";
    const projectId =
      this.toIdString(row?.marketProject?.legacyProjectId) ||
      this.toIdString(row?.canonicalProjectId);
    const marketRouteId = this.firstString(
      row?.marketProject?.providerIds?.coingeckoId,
      row?.marketProject?.slug
    );
    const echoRouteId = this.firstString(
      row?.icoProject?.slug,
      row?.canonicalProject?.slug,
      row?.projectSlug,
      row?.sourceSlug
    );
    const hasToken = Boolean(
      row?.marketAssetId ||
        row?.marketProject?.marketAssetId ||
        row?.marketProject?.providerIds?.coingeckoId ||
        row?.icoProject?.hasMarketData ||
        row?.icoProject?.marketAssetId ||
        row?.canonicalProject?.hasMarketData
    );
    const projectRouteType = hasToken && marketRouteId ? "market" : "project";
    const projectRouteId =
      projectRouteType === "market" ? marketRouteId : echoRouteId;
    const fundingDate = this.toDate(row?.fundingDate);
    const category = this.firstString(row?.projectCategory, "-") || "-";
    const logo = this.firstString(row?.projectLogo, row?.metadata?.logo, "");
    const fomoScore = this.toFiniteNumber(row?.projectFomoScore) || 0;
    const redFlags = this.toFiniteNumber(row?.projectRedFlags) || 0;
    const roi = this.normalizeRoi(row?.roi);
    const platform = this.normalizePlatform(row?.platform);

    return this.cleanObject({
      _id: this.toIdString(row?._id),
      id: this.toIdString(row?._id),
      canonicalProjectId: this.toIdString(row?.canonicalProjectId),
      marketAssetId: this.toIdString(
        row?.marketAssetId || row?.marketProject?.marketAssetId
      ),
      projectId,
      projectLinks: projectRouteId
        ? [
            {
              projectId: projectRouteId,
              projectType: projectRouteType,
              confidence: row?.confidence,
              matchedBy: "fomo-v2",
              reason: "canonicalProjectId",
            },
          ]
        : [],
      projectName: this.firstString(
        row?.projectName,
        row?.projectSlug,
        "Unknown Project"
      ),
      coinSlug: this.firstString(row?.projectSlug, row?.sourceSlug),
      coinSymbol: this.firstString(row?.projectSymbol, ""),
      image: logo,
      logo,
      stage,
      roundType: row?.roundType,
      normalizedRoundType: row?.normalizedRoundType,
      fundsRaised: this.toFiniteNumber(row?.fundsRaisedForSort) || 0,
      preValuation: this.toFiniteNumber(row?.preValuationForSort) || 0,
      raisedCurrency: this.firstString(row?.raisedCurrency, "USD"),
      tokenPrice: this.toFiniteNumber(row?.tokenPrice),
      tokensForSaleAmount: this.toFiniteNumber(row?.tokensForSaleAmount),
      tokensForSalePercent: this.toFiniteNumber(row?.tokensForSalePercent),
      roi,
      platform,
      platformName: platform?.name,
      investors,
      category,
      date: fundingDate ? fundingDate.toISOString() : undefined,
      announcedDate: fundingDate ? fundingDate.toISOString() : undefined,
      hasToken,
      rating: fomoScore,
      fomoScore,
      likes: this.toFiniteNumber(row?.marketProject?.likes) || 0,
      redFlags,
      redFlagsList:
        redFlags > 0
          ? Array.from({ length: Math.min(redFlags, 20) }, () => ({}))
          : [],
      projectSnapshot: {
        _id: projectId,
        canonicalProjectId: this.toIdString(row?.canonicalProjectId),
        name: this.firstString(
          row?.projectName,
          row?.projectSlug,
          "Unknown Project"
        ),
        slug: this.firstString(row?.projectSlug, row?.sourceSlug),
        symbol: this.firstString(row?.projectSymbol, ""),
        logo,
        mainCategory: { name: category },
      },
    });
  }

  private toLegacyInvestors(row: any): any[] {
    const readModelsById = new Map<string, any>(
      (Array.isArray(row?.backers) ? row.backers : []).map((backer: any) => [
        this.toIdString(backer?.backerId),
        backer,
      ])
    );
    const sourceBackersById = new Map<string, any>(
      (Array.isArray(row?.backerSources) ? row.backerSources : []).map(
        (backer: any) => [this.toIdString(backer?._id), backer]
      )
    );

    return (Array.isArray(row?.participants) ? row.participants : [])
      .map((participant: any) => {
        const backerId = this.toIdString(participant?.backerId);
        const readModel = readModelsById.get(backerId);
        const sourceBacker = sourceBackersById.get(backerId);
        const backer = {
          ...(sourceBacker || {}),
          ...(readModel || {}),
          niche: this.firstString(
            readModel?.niche,
            sourceBacker?.niche,
            sourceBacker?.metadata?.rawType,
            sourceBacker?.metadata?.type
          ),
          rating:
            this.toFiniteNumber(readModel?.rating) ??
            this.toFiniteNumber(readModel?.fomoScore) ??
            this.toFiniteNumber(sourceBacker?.rating) ??
            this.toFiniteNumber(sourceBacker?.fomoScore) ??
            0,
        };

        return this.toLegacyInvestor(participant, backer);
      })
      .filter(Boolean);
  }

  private toLegacyInvestor(participant: any, backer: any): any | undefined {
    const name = this.firstString(
      backer?.name,
      participant?.backerName,
      participant?.normalizedBackerName,
      participant?.sourceBackerSlug,
      participant?.sourceBackerId
    );
    if (!name) return undefined;

    const backerId =
      this.toIdString(participant?.backerId) ||
      this.toIdString(backer?.backerId);
    const logo = this.firstString(backer?.logoUrl, backer?.avatarUrl);
    const slug = this.firstString(backer?.slug, participant?.sourceBackerSlug);
    const niche = this.firstString(
      backer?.niche,
      backer?.metadata?.rawType,
      backer?.backerType,
      participant?.role,
      "fund"
    );
    const rating =
      this.toFiniteNumber(backer?.rating) ??
      this.toFiniteNumber(backer?.fomoScore) ??
      0;

    return this.cleanObject({
      _id: backerId || participant?.sourceBackerId || slug || name,
      id: backerId || participant?.sourceBackerId || slug || name,
      name,
      investorSlug: slug,
      slug,
      niche,
      rating,
      fomoScore: rating,
      ventureType: this.firstString(
        backer?.backerType,
        participant?.role,
        "fund"
      ),
      type: backer?.backerType,
      tier: "",
      lead: Boolean(participant?.isLead || participant?.role === "lead"),
      isLead: Boolean(participant?.isLead || participant?.role === "lead"),
      image: logo,
      logo,
      sourceBackerId: participant?.sourceBackerId,
      sourceBackerSlug: participant?.sourceBackerSlug,
      sourceBackerUrl: participant?.sourceBackerUrl,
      details: this.cleanObject({
        _id: backerId,
        id: backerId,
        name,
        slug,
        logo,
        logoUrl: backer?.logoUrl,
        avatarUrl: backer?.avatarUrl,
        type: backer?.backerType,
        niche,
        rating,
        fomoScore: rating,
        website: backer?.website,
        socials: backer?.socials,
      }),
    });
  }

  private toInvestorSearchItem(
    participant?: any,
    backer?: any
  ): any | undefined {
    const name = this.firstString(
      backer?.name,
      participant?.backerName,
      participant?.normalizedBackerName,
      participant?.sourceBackerSlug,
      participant?.sourceBackerId
    );
    if (!name) return undefined;

    const backerId =
      this.toIdString(backer?.backerId) ||
      this.toIdString(participant?.backerId);
    const slug = this.firstString(backer?.slug, participant?.sourceBackerSlug);
    const logo = this.firstString(backer?.logoUrl, backer?.avatarUrl);
    const niche = this.firstString(
      backer?.niche,
      backer?.metadata?.rawType,
      backer?.backerType,
      participant?.role,
      "fund"
    );

    return this.cleanObject({
      _id: backerId || slug || name,
      id: backerId || participant?.sourceBackerId || slug || name,
      backerId,
      dropstabId: participant?.sourceBackerId,
      slug,
      investorSlug: slug,
      niche,
      name,
      logo,
      avatar: logo,
      image: logo,
      metadataLogo: logo,
      type: backer?.backerType || participant?.role || "fund",
      investorType: backer?.backerType || "round",
    });
  }

  private parseCsv(value?: string): string[] {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private searchTokens(value: string): string[] {
    return this.uniqueStrings(
      this.normalizeText(value)
        .split(/[^a-z0-9]+/g)
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }

  private parseNumericRanges(
    value?: string
  ): Array<{ condition: Record<string, number> }> {
    return this.parseCsv(value).reduce(
      (ranges: Array<{ condition: Record<string, number> }>, item) => {
        if (item.startsWith(">")) {
          const number = Number(item.replace(/[^0-9.-]+/g, ""));
          if (Number.isFinite(number))
            ranges.push({ condition: { $gt: number } });
          return ranges;
        }

        if (item.startsWith("<")) {
          const number = Number(item.replace(/[^0-9.-]+/g, ""));
          if (Number.isFinite(number))
            ranges.push({ condition: { $lt: number } });
          return ranges;
        }

        const [from, to] = item.split("-").map((part) => Number(part));
        if (Number.isFinite(from) && Number.isFinite(to)) {
          ranges.push({ condition: { $gte: from, $lte: to } });
        }

        return ranges;
      },
      []
    );
  }

  private firstMongoValue(values: any[]): any {
    return values
      .slice()
      .reverse()
      .reduce((acc, value) => ({ $ifNull: [value, acc] }), null);
  }

  private normalizeRoi(value: any): Record<string, number> | undefined {
    if (!value || typeof value !== "object") return undefined;
    const roi = this.cleanObject({
      usd: this.toFiniteNumber(value.usd ?? value.USD),
      btc: this.toFiniteNumber(value.btc ?? value.BTC),
      eth: this.toFiniteNumber(value.eth ?? value.ETH),
    });
    return Object.keys(roi).length ? (roi as Record<string, number>) : undefined;
  }

  private normalizePlatform(value: any): Record<string, any> | undefined {
    if (!value || typeof value !== "object") return undefined;
    const name = this.firstString(value.name);
    if (!name) return undefined;
    return this.cleanObject({
      platformId: this.toIdString(value.platformId || value._id) || undefined,
      name,
      normalizedName: this.firstString(value.normalizedName),
      logoUrl: this.firstString(value.logoUrl, value.logo, value.image),
      sourceType: this.firstString(value.sourceType),
      sourceId: this.toStringValue(value.sourceId || value.id),
      sourceUrl: this.firstString(value.sourceUrl),
    });
  }

  private firstString(...values: any[]): string | undefined {
    for (const value of values) {
      if (typeof value !== "string") continue;
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }
    return undefined;
  }

  private toStringValue(value: any): string | undefined {
    if (value === undefined || value === null) return undefined;
    const text = String(value).trim();
    return text || undefined;
  }

  private toFiniteNumber(value: unknown): number | undefined {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : undefined;
    }
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : undefined;
  }

  private toIdString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();
    if (value._id && value._id !== value) return this.toIdString(value._id);
    if (typeof value.toString === "function") return value.toString();
    return "";
  }

  private uniqueObjectIds(values: any[]): Types.ObjectId[] {
    const ids = new Map<string, Types.ObjectId>();
    for (const value of values) {
      const id = this.toIdString(value);
      if (!Types.ObjectId.isValid(id) || ids.has(id)) continue;
      ids.set(id, new Types.ObjectId(id));
    }
    return Array.from(ids.values());
  }

  private uniqueBy<T>(items: T[], getKey: (item: T) => string): T[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = getKey(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private uniqueStrings(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
  }

  private normalizeKey(value: string): string {
    return this.normalizeText(value)
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  private normalizeText(value: string): string {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  private humanizeRoundType(value: any): string | undefined {
    const text = this.firstString(value);
    if (!text) return undefined;

    return text
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .map((part) => {
        const upper = part.toUpperCase();
        if (
          ["ico", "ido", "ieo", "ma", "m&a", "tge"].includes(part.toLowerCase())
        ) {
          return upper === "MA" ? "M&A" : upper;
        }
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join(" ");
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private exactRegex(value: string): RegExp {
    return new RegExp(`^${this.escapeRegExp(value)}$`, "i");
  }

  private cleanObject<T extends Record<string, any>>(value: T): T {
    Object.keys(value).forEach((key) => {
      if (value[key] === undefined || value[key] === "") {
        delete value[key];
      }
    });
    return value;
  }
}
