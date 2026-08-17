import { Injectable, Optional } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { ExternalAssetMirrorUrlService } from "src/storage/external-asset-mirror-url.service";
import { FomoV2Backer, FomoV2BackerReadModel } from "../../backers";
import { FomoV2IcoProjectReadModel } from "../../ico";
import { FomoV2MarketProjectReadModel } from "../../market";
import { FomoV2CanonicalProject } from "../../../models";
import {
  normalizeProjectSourceType,
  projectSourceTypeMongoPattern,
} from "../../../shared/source-policy";
import {
  FomoV2FundingFeedRoundReadModel,
  FomoV2FundingFeedRoundInvestorSnapshot,
  FomoV2FundingRound,
  FomoV2FundingRoundParticipant,
} from "../models";

export interface FomoV2FundingFeedReadModelMaterializeOptions {
  limit?: number;
  offset?: number;
  write?: boolean;
  confirmWrite?: boolean;
  examplesLimit?: number;
  /** In-process lease/policy fence supplied by the managed parser worker. */
  assertExecutionActive?: () => void | Promise<void>;
}

export interface FomoV2FundingFeedReadModelMaterializeResult {
  mode: "dry-run" | "write";
  requestedLimit: number;
  requestedOffset: number;
  scannedRounds: number;
  built: number;
  written: number;
  skipped: {
    duplicateSourceRounds: number;
    missingFundingRoundId: number;
    missingCanonicalProjectId: number;
  };
  duplicateReadModels: Array<{
    fundingRoundId: string;
    count: number;
    ids: string[];
  }>;
  examples: {
    built: any[];
    skipped: any[];
  };
}

export interface FomoV2IcoProjectFundingMaterializeOptions {
  limit?: number;
  offset?: number;
  write?: boolean;
  confirmWrite?: boolean;
  /** In-process lease/policy fence supplied by the managed parser worker. */
  assertExecutionActive?: () => void | Promise<void>;
}

export interface FomoV2IcoProjectFundingMaterializeResult {
  mode: "dry-run" | "write";
  requestedLimit: number;
  requestedOffset: number;
  scannedProjects: number;
  scannedRounds: number;
  built: number;
  written: number;
  withFunding: number;
  withoutFunding: number;
  sourceCounts: Record<string, number>;
}

type DateSelection = {
  fundingDate?: Date;
  dateSource: "announcedDate" | "date" | "none";
};

type ScoreSelection = {
  value: number;
  source:
    | "marketProject.fomoScore"
    | "marketProject.rating"
    | "icoProject.metadata.fomoScore"
    | "canonicalProject.metadata.fomoScore"
    | "none";
};

type RedFlagsSelection = {
  value: number;
  source:
    | "marketProject.redFlags"
    | "icoProject.metadata.redFlags"
    | "canonicalProject.metadata.redFlags"
    | "none";
};

export interface FomoV2FundingFeedReadModelMaterializeContext {
  marketByProjectId: Map<string, any>;
  icoByProjectAndSource: Map<string, any>;
  canonicalById: Map<string, any>;
  participantsByRoundId: Map<string, any[]>;
  backerReadByBackerId: Map<string, any>;
  backerSourceById: Map<string, any>;
}

const SCHEMA_VERSION = 1;

const FUNDING_FEED_OPTIONAL_FIELDS = Object.freeze([
  "marketAssetId",
  "roundStatus",
  "confidence",
  "fundingDate",
  "announcedDate",
  "roundDate",
  "roundName",
  "normalizedRoundName",
  "roundType",
  "normalizedRoundType",
  "raisedAmount",
  "raisedCurrency",
  "valuation",
  "tokenPrice",
  "tokensForSaleAmount",
  "tokensForSalePercent",
  "roi",
  "platformId",
  "platform",
  "primarySource",
  "sourceType",
  "sourceFeed",
  "sourceSlug",
  "sourceUrl",
  "projectName",
  "projectSymbol",
  "projectSlug",
  "marketRouteId",
  "projectRouteId",
  "projectLogo",
  "projectCategory",
  "projectStatus",
  "sourceUpdatedAt",
] as const);

@Injectable()
export class FomoV2FundingFeedReadModelService {
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
    private readonly readModel: Model<FomoV2FundingFeedRoundReadModel>,
    @InjectModel(FomoV2FundingRound.name)
    private readonly fundingRoundModel: Model<FomoV2FundingRound>,
    @InjectModel(FomoV2FundingRoundParticipant.name)
    private readonly participantModel: Model<FomoV2FundingRoundParticipant>,
    @InjectModel(FomoV2BackerReadModel.name)
    private readonly backerReadModel: Model<FomoV2BackerReadModel>,
    @InjectModel(FomoV2Backer.name)
    private readonly backerSourceModel: Model<FomoV2Backer>,
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly marketProjectReadModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(FomoV2IcoProjectReadModel.name)
    private readonly icoProjectReadModel: Model<FomoV2IcoProjectReadModel>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>,
    @Optional()
    private readonly mirrorUrlService?: ExternalAssetMirrorUrlService,
  ) {}

  async materialize(
    options: FomoV2FundingFeedReadModelMaterializeOptions = {},
  ): Promise<FomoV2FundingFeedReadModelMaterializeResult> {
    const write = options.write === true;
    if (write && options.confirmWrite !== true) {
      throw new Error(
        "FOMO v2 funding feed read-model write requires --confirm-write=true.",
      );
    }
    await options.assertExecutionActive?.();

    const limit = this.positiveInteger(options.limit, 500);
    const offset = this.nonNegativeInteger(options.offset, 0);
    const examplesLimit = this.nonNegativeInteger(options.examplesLimit, 10);
    const rounds = await this.loadFundingRounds(limit, offset);
    await options.assertExecutionActive?.();
    const duplicateSourceRoundIds = this.duplicateIds(
      rounds.map((round: any) => this.toIdString(round?._id)),
    );
    const duplicateReadModels = await this.findDuplicateReadModels();
    await options.assertExecutionActive?.();

    if (write && duplicateReadModels.length) {
      throw new Error(
        `Refusing to write funding feed read model while duplicate read-model rows exist: ${JSON.stringify(duplicateReadModels.slice(0, 5))}`,
      );
    }

    const context = await this.loadMaterializeContext(rounds);
    await options.assertExecutionActive?.();
    const existingImageSnapshotsByRoundId = this.mirrorUrlService
      ? await this.loadExistingImageSnapshots(rounds)
      : new Map<string, any>();
    await options.assertExecutionActive?.();

    const rows: any[] = [];
    const skipped = {
      duplicateSourceRounds: 0,
      missingFundingRoundId: 0,
      missingCanonicalProjectId: 0,
    };
    const examples = {
      built: [] as any[],
      skipped: [] as any[],
    };
    const seenRoundIds = new Set<string>();

    for (const round of rounds as any[]) {
      const fundingRoundId = this.toIdString(round?._id);
      const canonicalProjectId = this.toIdString(round?.canonicalProjectId);

      if (!fundingRoundId) {
        skipped.missingFundingRoundId += 1;
        this.pushExample(examples.skipped, { reason: "missingFundingRoundId" }, examplesLimit);
        continue;
      }

      if (seenRoundIds.has(fundingRoundId)) {
        skipped.duplicateSourceRounds += 1;
        this.pushExample(
          examples.skipped,
          { reason: "duplicateSourceRound", fundingRoundId },
          examplesLimit,
        );
        continue;
      }
      seenRoundIds.add(fundingRoundId);

      if (!canonicalProjectId) {
        skipped.missingCanonicalProjectId += 1;
        this.pushExample(
          examples.skipped,
          { reason: "missingCanonicalProjectId", fundingRoundId },
          examplesLimit,
        );
        continue;
      }

      const row = this.buildReadModelRow(round, context);
      await this.preferMirroredRowImages(
        row,
        existingImageSnapshotsByRoundId.get(fundingRoundId),
      );
      rows.push(row);
      this.pushExample(
        examples.built,
        {
          fundingRoundId: this.toIdString(row.fundingRoundId),
          canonicalProjectId: this.toIdString(row.canonicalProjectId),
          projectName: row.projectName,
          fundingDate: row.fundingDate?.toISOString?.(),
          dateSource: row.dateSource,
          visible: row.visible,
          investors: row.investors.length,
        },
        examplesLimit,
      );
    }
    await options.assertExecutionActive?.();

    if (duplicateSourceRoundIds.length) {
      skipped.duplicateSourceRounds += duplicateSourceRoundIds.length;
    }

    let written = 0;
    if (write && rows.length) {
      const now = new Date();
      const operations = rows.map((row) => {
        const set = this.cleanObject({
          ...row,
          updatedAt: now,
          materializedAt: now,
        });
        const unset = this.unsetMissingFeedOptionalFields(set);

        return {
          updateOne: {
            filter: { fundingRoundId: row.fundingRoundId },
            update: {
              $set: set,
              ...(Object.keys(unset).length ? { $unset: unset } : {}),
              $setOnInsert: {
                createdAt: now,
              },
            },
            upsert: true,
          },
        };
      });
      await options.assertExecutionActive?.();
      const result = await this.readModel.bulkWrite(operations, {
        ordered: false,
      });
      await options.assertExecutionActive?.();
      written =
        Number((result as any).upsertedCount || 0) +
        Number((result as any).modifiedCount || 0);
    }

    return {
      mode: write ? "write" : "dry-run",
      requestedLimit: limit,
      requestedOffset: offset,
      scannedRounds: rounds.length,
      built: rows.length,
      written,
      skipped,
      duplicateReadModels,
      examples,
    };
  }

  /**
   * Projects are served from ico_project_read_models, while funding imports
   * write source-isolated funding_rounds. This projection keeps the project
   * page current without copying one parser's fields into another parser's
   * raw profile payload.
   */
  async materializeIcoProjectFunding(
    options: FomoV2IcoProjectFundingMaterializeOptions = {},
  ): Promise<FomoV2IcoProjectFundingMaterializeResult> {
    const write = options.write === true;
    if (write && options.confirmWrite !== true) {
      throw new Error(
        "FOMO v2 ICO project funding read-model write requires --confirm-write=true.",
      );
    }
    await options.assertExecutionActive?.();

    const limit = this.positiveInteger(options.limit, 500);
    const offset = this.nonNegativeInteger(options.offset, 0);
    const projects = (await this.icoProjectReadModel
      .find({ sourceType: projectSourceTypeMongoPattern("icodrops") })
      .sort({ _id: 1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec()) as any[];
    await options.assertExecutionActive?.();
    const canonicalProjectIds = this.uniqueObjectIds(
      projects.map((project) => project?.canonicalProjectId),
    );
    const rounds = canonicalProjectIds.length
      ? ((await this.fundingRoundModel
          .find({
            canonicalProjectId: { $in: canonicalProjectIds },
            status: { $nin: this.excludedRoundStatuses },
          })
          .sort({ canonicalProjectId: 1, announcedDate: -1, date: -1, _id: 1 })
          .lean()
          .exec()) as any[])
      : [];
    await options.assertExecutionActive?.();
    const context = await this.loadMaterializeContext(rounds);
    await options.assertExecutionActive?.();
    const fundingRowsByProjectId = new Map<string, any[]>();
    const sourceCounts: Record<string, number> = {};

    for (const round of rounds) {
      const canonicalProjectId = this.toIdString(round?.canonicalProjectId);
      if (!canonicalProjectId) continue;

      const row = {
        ...this.buildReadModelRow(round, context),
        sourceId: this.firstString(round?.sourceId, round?.feedExternalId),
        sourceRefs: this.arrayValue(round?.sourceRefs),
      };
      if (row.visible === false) continue;

      const bucket = fundingRowsByProjectId.get(canonicalProjectId) || [];
      bucket.push(row);
      fundingRowsByProjectId.set(canonicalProjectId, bucket);

      const sourceKey = this.fundingSourceKey(row);
      sourceCounts[sourceKey] = (sourceCounts[sourceKey] || 0) + 1;
    }
    await options.assertExecutionActive?.();

    const now = new Date();
    const projections = projects.map((project) => {
      const projectId = this.toIdString(project?.canonicalProjectId);
      return {
        project,
        aggregate: this.buildIcoProjectFundingAggregate(
          fundingRowsByProjectId.get(projectId) || [],
          now,
          project?.sourceType,
        ),
      };
    });

    let written = 0;
    if (write && projections.length) {
      const operations = projections.map(({ project, aggregate }) => ({
        updateOne: {
          filter: { _id: project._id },
          update: {
            $set: {
              "metadata.fundingAggregate": aggregate,
              updatedAt: now,
            },
          },
          upsert: false,
        },
      }));
      await options.assertExecutionActive?.();
      const result = await this.icoProjectReadModel.bulkWrite(operations, {
        ordered: false,
      });
      await options.assertExecutionActive?.();
      written = Number((result as any).modifiedCount || 0);
    }

    const withFunding = projections.filter(
      ({ aggregate }) => aggregate.hasData === true,
    ).length;

    return {
      mode: write ? "write" : "dry-run",
      requestedLimit: limit,
      requestedOffset: offset,
      scannedProjects: projects.length,
      scannedRounds: rounds.length,
      built: projections.length,
      written,
      withFunding,
      withoutFunding: projections.length - withFunding,
      sourceCounts,
    };
  }

  async findDuplicateReadModels(): Promise<
    FomoV2FundingFeedReadModelMaterializeResult["duplicateReadModels"]
  > {
    const rows = await this.readModel
      .aggregate([
        { $match: { fundingRoundId: { $type: "objectId" } } },
        {
          $group: {
            _id: "$fundingRoundId",
            count: { $sum: 1 },
            ids: { $push: "$_id" },
          },
        },
        { $match: { count: { $gt: 1 } } },
        { $limit: 50 },
      ])
      .exec();

    return (rows as any[]).map((row: any) => ({
      fundingRoundId: this.toIdString(row?._id),
      count: Number(row?.count || 0),
      ids: (row?.ids || []).map((id: any) => this.toIdString(id)).filter(Boolean),
    }));
  }

  buildReadModelRow(
    round: any,
    context: FomoV2FundingFeedReadModelMaterializeContext,
  ): any {
    const fundingRoundId = this.requiredObjectId(round?._id, "fundingRoundId");
    const canonicalProjectId = this.requiredObjectId(
      round?.canonicalProjectId,
      "canonicalProjectId",
    );
    const projectId = this.toIdString(canonicalProjectId);
    const marketProject = context.marketByProjectId.get(projectId);
    const roundSourceType = this.fundingSourceKey(round);
    const icoProject =
      roundSourceType === "unknown"
        ? undefined
        : context.icoByProjectAndSource.get(
            this.icoProjectSourceKey(projectId, roundSourceType),
          );
    const canonicalProject = context.canonicalById.get(projectId);
    const participants =
      context.participantsByRoundId.get(this.toIdString(fundingRoundId)) || [];
    const investors = this.buildInvestorSnapshots(participants, context);
    const dateSelection = this.selectFundingDate(round);
    const score = this.selectProjectFomoScore(
      marketProject,
      icoProject,
      canonicalProject,
    );
    const redFlags = this.selectProjectRedFlags(
      marketProject,
      icoProject,
      canonicalProject,
    );
    const projectName = this.firstString(
      marketProject?.name,
      icoProject?.name,
      canonicalProject?.name,
    );
    const projectSymbol = this.firstString(
      marketProject?.symbol,
      icoProject?.symbol,
      canonicalProject?.symbol,
    );
    const projectSlug = this.firstString(
      marketProject?.slug,
      icoProject?.slug,
      canonicalProject?.slug,
    );
    const projectLogo = this.firstString(
      marketProject?.logo,
      icoProject?.logoUrl,
      canonicalProject?.metadata?.logo,
    );
    const projectCategory = this.firstString(
      marketProject?.category,
      this.firstArrayString(marketProject?.topCategories),
      this.firstArrayString(marketProject?.categories),
      this.firstArrayString(icoProject?.categories),
      canonicalProject?.metadata?.category,
    );
    const projectStatus = this.firstString(
      marketProject?.status,
      icoProject?.status,
      canonicalProject?.status,
    );
    const categoryKeys = this.uniqueStrings([
      projectCategory,
      ...this.arrayStrings(marketProject?.categories),
      ...this.arrayStrings(marketProject?.topCategories),
      ...this.arrayStrings(icoProject?.categories),
      canonicalProject?.metadata?.category,
    ].map((item) => this.normalizeKey(item)));
    const projectStatusKeys = this.uniqueStrings(
      [projectStatus, icoProject?.status, marketProject?.status, canonicalProject?.status]
        .map((item) => this.normalizeKey(item)),
    );
    const fundingTypeKeys = this.uniqueStrings(
      [
        round?.roundName,
        round?.normalizedRoundName,
        round?.normalizedRoundType,
        round?.roundType,
      ].map((item) => this.normalizeKey(item)),
    );
    const chainKeys = this.chainKeys(marketProject);
    const searchValues = [
      projectName,
      projectSymbol,
      projectSlug,
      round?.roundName,
      round?.normalizedRoundName,
      round?.normalizedRoundType,
      round?.roundType,
      round?.primarySource,
      round?.sourceType,
      round?.sourceFeed,
      round?.sourceSlug,
      ...investors.flatMap((investor) => [
        investor.name,
        investor.slug,
        investor.sourceBackerId,
        investor.sourceBackerSlug,
      ]),
    ];
    const searchTokens = this.searchTokens(searchValues);

    return this.cleanObject({
      fundingRoundId,
      canonicalProjectId,
      marketAssetId: this.toObjectId(
        round?.marketAssetId || marketProject?.marketAssetId || icoProject?.marketAssetId,
      ),
      visible: !this.excludedRoundStatuses.includes(String(round?.status || "")),
      roundStatus: round?.status,
      confidence: round?.confidence,
      fundingDate: dateSelection.fundingDate,
      dateSource: dateSelection.dateSource,
      announcedDate: this.toDate(round?.announcedDate),
      roundDate: this.toDate(round?.date),
      roundName: this.firstString(round?.roundName),
      normalizedRoundName: this.firstString(round?.normalizedRoundName),
      roundType: this.firstString(round?.roundType),
      normalizedRoundType: this.firstString(round?.normalizedRoundType),
      fundingTypeKeys,
      raisedAmount: this.toFiniteNumber(round?.raisedAmount),
      raisedCurrency: this.firstString(round?.raisedCurrency),
      valuation: this.toFiniteNumber(round?.valuation),
      tokenPrice: this.toFiniteNumber(round?.tokenPrice),
      tokensForSaleAmount: this.toFiniteNumber(round?.tokensForSaleAmount),
      tokensForSalePercent: this.toFiniteNumber(round?.tokensForSalePercent),
      roi: this.normalizeRoi(round?.roi),
      platformId: this.toObjectId(round?.platformId || round?.platform?.platformId),
      platform: this.normalizePlatform(round?.platform),
      fundsRaisedForSort:
        this.toFiniteNumber(round?.raisedAmount) ??
        this.toFiniteNumber(round?.metadata?.amountUsd) ??
        0,
      preValuationForSort:
        this.toFiniteNumber(round?.valuation) ??
        this.toFiniteNumber(round?.metadata?.valuationUsd) ??
        0,
      primarySource: this.firstString(round?.primarySource),
      sourceType: this.firstString(round?.sourceType),
      sourceFeed: this.firstString(round?.sourceFeed),
      sourceSlug: this.firstString(round?.sourceSlug),
      sourceUrl: this.firstString(round?.sourceUrl),
      projectName,
      projectSymbol,
      projectSlug,
      marketRouteId: this.firstString(
        marketProject?.providerIds?.coingeckoId,
        marketProject?.slug,
      ),
      projectRouteId: this.firstString(
        icoProject?.slug,
        canonicalProject?.slug,
        projectSlug,
      ),
      projectLogo,
      projectCategory,
      categoryKeys,
      projectStatus,
      projectStatusKeys,
      hasToken: this.hasToken(round, marketProject, icoProject, canonicalProject),
      projectFomoScore: score.value,
      projectFomoScoreSource: score.source,
      projectRedFlags: redFlags.value,
      projectRedFlagsSource: redFlags.source,
      projectLikes: this.toFiniteNumber(marketProject?.likes) ?? 0,
      chainKeys,
      investorIds: this.uniqueStrings(
        investors.map((investor) => this.toIdString(investor.backerId)),
      ),
      investorSourceIds: this.uniqueStrings(
        investors.map((investor) => this.firstString(investor.sourceBackerId)),
      ),
      investorSlugs: this.uniqueStrings(
        investors.map((investor) =>
          this.normalizeKey(this.firstString(investor.slug, investor.sourceBackerSlug)),
        ),
      ),
      investorNameKeys: this.uniqueStrings(
        investors.map((investor) => this.normalizeText(investor.name)),
      ),
      investors,
      searchTokens,
      searchPrefixes: this.searchPrefixes(searchTokens),
      sourceUpdatedAt: this.maxDate(round?.updatedAt, marketProject?.updatedAt, icoProject?.updatedAt, canonicalProject?.updatedAt),
      schemaVersion: SCHEMA_VERSION,
    });
  }

  private async preferMirroredRowImages(row: any, existingRow?: any): Promise<void> {
    if (!this.mirrorUrlService) return;

    const projectLogo = await this.mirrorUrlService.preferMirroredUrl(
      row?.projectLogo,
      existingRow?.projectLogo,
    );
    if (projectLogo) row.projectLogo = projectLogo;

    if (!Array.isArray(row?.investors) || !row.investors.length) return;

    const existingInvestorLogoByKey = this.existingInvestorLogoByKey(
      existingRow?.investors,
    );
    await Promise.all(
      row.investors.map(async (investor: any) => {
        if (!investor || typeof investor !== "object") return;
        const currentLogo = this.firstExistingInvestorLogo(
          investor,
          existingInvestorLogoByKey,
        );
        const logo = await this.mirrorUrlService?.preferMirroredUrl(
          investor.logo,
          currentLogo,
        );
        if (logo) investor.logo = logo;
      }),
    );
  }

  private async loadFundingRounds(limit: number, offset: number): Promise<any[]> {
    return this.fundingRoundModel
      .find({})
      .sort({ _id: 1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();
  }

  private async loadExistingImageSnapshots(rounds: any[]): Promise<Map<string, any>> {
    const fundingRoundIds = this.uniqueObjectIds(rounds.map((round) => round?._id));
    if (!fundingRoundIds.length) return new Map();

    const rows = await this.readModel
      .find(
        { fundingRoundId: { $in: fundingRoundIds } },
        { fundingRoundId: 1, projectLogo: 1, investors: 1 },
      )
      .lean()
      .exec();

    return this.firstByObjectId(rows as any[], "fundingRoundId");
  }

  private async loadMaterializeContext(
    rounds: any[],
  ): Promise<FomoV2FundingFeedReadModelMaterializeContext> {
    const canonicalProjectIds = this.uniqueObjectIds(
      rounds.map((round) => round?.canonicalProjectId),
    );
    const fundingRoundIds = this.uniqueObjectIds(rounds.map((round) => round?._id));
    const [
      marketProjects,
      icoProjects,
      canonicalProjects,
      participants,
    ] = await Promise.all([
      canonicalProjectIds.length
        ? this.marketProjectReadModel
            .find({ canonicalProjectId: { $in: canonicalProjectIds } })
            .lean()
            .exec()
        : [],
      canonicalProjectIds.length
        ? this.icoProjectReadModel
            .find({ canonicalProjectId: { $in: canonicalProjectIds } })
            .lean()
            .exec()
        : [],
      canonicalProjectIds.length
        ? this.canonicalProjectModel
            .find({ _id: { $in: canonicalProjectIds } })
            .lean()
            .exec()
        : [],
      fundingRoundIds.length
        ? this.participantModel
            .find({
              fundingRoundId: { $in: fundingRoundIds },
              status: { $nin: this.excludedParticipantStatuses },
            })
            .sort({ fundingRoundId: 1, isLead: -1, backerName: 1, _id: 1 })
            .lean()
            .exec()
        : [],
    ]);
    const backerIds = this.uniqueObjectIds(
      (participants as any[]).map((participant) => participant?.backerId),
    );
    const [backerReadModels, backerSources] = await Promise.all([
      backerIds.length
        ? this.backerReadModel.find({ backerId: { $in: backerIds } }).lean().exec()
        : [],
      backerIds.length
        ? this.backerSourceModel.find({ _id: { $in: backerIds } }).lean().exec()
        : [],
    ]);

    return {
      marketByProjectId: this.firstByObjectId(marketProjects as any[], "canonicalProjectId"),
      icoByProjectAndSource: this.firstIcoByProjectAndSource(
        icoProjects as any[],
      ),
      canonicalById: this.firstByObjectId(canonicalProjects as any[], "_id"),
      participantsByRoundId: this.groupByObjectId(participants as any[], "fundingRoundId"),
      backerReadByBackerId: this.firstByObjectId(backerReadModels as any[], "backerId"),
      backerSourceById: this.firstByObjectId(backerSources as any[], "_id"),
    };
  }

  private buildInvestorSnapshots(
    participants: any[],
    context: FomoV2FundingFeedReadModelMaterializeContext,
  ): FomoV2FundingFeedRoundInvestorSnapshot[] {
    return participants
      .map((participant) => {
        const backerId = this.toIdString(participant?.backerId);
        const readModel = context.backerReadByBackerId.get(backerId);
        const sourceBacker = context.backerSourceById.get(backerId);
        const name = this.firstString(
          readModel?.name,
          sourceBacker?.name,
          participant?.backerName,
          participant?.normalizedBackerName,
          participant?.sourceBackerSlug,
          participant?.sourceBackerId,
        );
        if (!name) return undefined;
        const rating =
          this.toFiniteNumber(readModel?.rating) ??
          this.toFiniteNumber(readModel?.fomoScore) ??
          this.toFiniteNumber(sourceBacker?.rating) ??
          this.toFiniteNumber(sourceBacker?.fomoScore) ??
          0;

        return this.cleanObject({
          backerId: this.toObjectId(participant?.backerId),
          sourceBackerId: this.firstString(participant?.sourceBackerId),
          sourceBackerSlug: this.firstString(participant?.sourceBackerSlug),
          sourceBackerUrl: this.firstString(participant?.sourceBackerUrl),
          name,
          slug: this.firstString(readModel?.slug, sourceBacker?.slug, participant?.sourceBackerSlug),
          niche: this.firstString(
            readModel?.niche,
            sourceBacker?.niche,
            sourceBacker?.metadata?.rawType,
            sourceBacker?.metadata?.type,
            participant?.role,
          ),
          role: this.firstString(participant?.role),
          ventureType: this.firstString(readModel?.backerType, sourceBacker?.backerType, participant?.role),
          isLead: Boolean(participant?.isLead || participant?.role === "lead"),
          logo: this.firstString(readModel?.logoUrl, readModel?.avatarUrl, sourceBacker?.logoUrl, sourceBacker?.avatarUrl),
          rating,
          fomoScore: rating,
        });
      })
      .filter(Boolean) as FomoV2FundingFeedRoundInvestorSnapshot[];
  }

  private existingInvestorLogoByKey(investors: any): Map<string, string> {
    const map = new Map<string, string>();
    if (!Array.isArray(investors)) return map;

    for (const investor of investors) {
      const logo = this.firstString(investor?.logo);
      if (!logo) continue;
      for (const key of this.investorSnapshotKeys(investor)) {
        if (!map.has(key)) map.set(key, logo);
      }
    }

    return map;
  }

  private firstExistingInvestorLogo(
    investor: any,
    existingInvestorLogoByKey: Map<string, string>,
  ): string | undefined {
    for (const key of this.investorSnapshotKeys(investor)) {
      const logo = existingInvestorLogoByKey.get(key);
      if (logo) return logo;
    }
    return undefined;
  }

  private investorSnapshotKeys(investor: any): string[] {
    return this.uniqueStrings([
      this.toIdString(investor?.backerId)
        ? `backerId:${this.toIdString(investor?.backerId)}`
        : undefined,
      this.firstString(investor?.sourceBackerId)
        ? `sourceBackerId:${this.normalizeKey(investor?.sourceBackerId)}`
        : undefined,
      this.firstString(investor?.slug)
        ? `slug:${this.normalizeKey(investor?.slug)}`
        : undefined,
      this.firstString(investor?.sourceBackerSlug)
        ? `sourceBackerSlug:${this.normalizeKey(investor?.sourceBackerSlug)}`
        : undefined,
      this.firstString(investor?.name)
        ? `name:${this.normalizeText(investor?.name)}`
        : undefined,
    ]);
  }

  private selectFundingDate(round: any): DateSelection {
    const announcedDate = this.toDate(round?.announcedDate);
    if (announcedDate) return { fundingDate: announcedDate, dateSource: "announcedDate" };
    const date = this.toDate(round?.date);
    if (date) return { fundingDate: date, dateSource: "date" };
    return { dateSource: "none" };
  }

  private selectProjectFomoScore(
    marketProject: any,
    icoProject: any,
    canonicalProject: any,
  ): ScoreSelection {
    const candidates: Array<[any, ScoreSelection["source"]]> = [
      [marketProject?.fomoScore, "marketProject.fomoScore"],
      [marketProject?.rating, "marketProject.rating"],
      [icoProject?.metadata?.fomoScore, "icoProject.metadata.fomoScore"],
      [canonicalProject?.metadata?.fomoScore, "canonicalProject.metadata.fomoScore"],
    ];
    for (const [value, source] of candidates) {
      const number = this.toFiniteNumber(value);
      if (number !== undefined) return { value: number, source };
    }
    return { value: 0, source: "none" };
  }

  private selectProjectRedFlags(
    marketProject: any,
    icoProject: any,
    canonicalProject: any,
  ): RedFlagsSelection {
    const candidates: Array<[any, RedFlagsSelection["source"]]> = [
      [marketProject?.redFlags, "marketProject.redFlags"],
      [icoProject?.metadata?.redFlags, "icoProject.metadata.redFlags"],
      [canonicalProject?.metadata?.redFlags, "canonicalProject.metadata.redFlags"],
    ];
    for (const [value, source] of candidates) {
      const number = this.toFiniteNumber(value);
      if (number !== undefined) return { value: number, source };
    }
    return { value: 0, source: "none" };
  }

  private hasToken(
    round: any,
    marketProject: any,
    icoProject: any,
    canonicalProject: any,
  ): boolean {
    return Boolean(
      round?.marketAssetId ||
        marketProject?.marketAssetId ||
        marketProject?.providerIds?.coingeckoId ||
        icoProject?.hasMarketData === true ||
        icoProject?.marketAssetId ||
        canonicalProject?.hasMarketData === true,
    );
  }

  private chainKeys(marketProject: any): string[] {
    const contractValues = this.arrayValue(marketProject?.contracts).flatMap(
      (contract: any) => [
        contract?.chain,
        contract?.network,
        contract?.platform,
      ],
    );
    return this.uniqueStrings(contractValues.map((value) => this.normalizeKey(value)));
  }

  private searchTokens(values: any[]): string[] {
    const tokens = values.flatMap((value) =>
      this.normalizeText(value)
        .split(/[^a-z0-9]+/g)
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    );
    return this.uniqueStrings(tokens).slice(0, 300);
  }

  private searchPrefixes(tokens: string[]): string[] {
    const prefixes: string[] = [];
    for (const token of tokens) {
      const max = Math.min(token.length, 32);
      for (let length = 1; length <= max; length += 1) {
        prefixes.push(token.slice(0, length));
      }
    }
    return this.uniqueStrings(prefixes).slice(0, 1000);
  }

  private firstByObjectId(items: any[], field: string): Map<string, any> {
    const map = new Map<string, any>();
    for (const item of items) {
      const id = this.toIdString(item?.[field]);
      if (!id || map.has(id)) continue;
      map.set(id, item);
    }
    return map;
  }

  private groupByObjectId(items: any[], field: string): Map<string, any[]> {
    const map = new Map<string, any[]>();
    for (const item of items) {
      const id = this.toIdString(item?.[field]);
      if (!id) continue;
      const bucket = map.get(id) || [];
      bucket.push(item);
      map.set(id, bucket);
    }
    return map;
  }

  private firstIcoByProjectAndSource(items: any[]): Map<string, any> {
    const ordered = [...items].sort((left, right) => {
      const leftUpdatedAt = this.toDate(left?.updatedAt)?.getTime() ?? -Infinity;
      const rightUpdatedAt =
        this.toDate(right?.updatedAt)?.getTime() ?? -Infinity;
      if (leftUpdatedAt !== rightUpdatedAt) {
        return rightUpdatedAt - leftUpdatedAt;
      }
      return this.toIdString(left?._id).localeCompare(
        this.toIdString(right?._id),
      );
    });
    const map = new Map<string, any>();
    for (const item of ordered) {
      const projectId = this.toIdString(item?.canonicalProjectId);
      const sourceType = normalizeProjectSourceType(item?.sourceType);
      if (!projectId || !sourceType) continue;
      const key = this.icoProjectSourceKey(projectId, sourceType);
      if (!map.has(key)) map.set(key, item);
    }
    return map;
  }

  private icoProjectSourceKey(
    canonicalProjectId: string,
    sourceType: string,
  ): string {
    return `${canonicalProjectId}:${normalizeProjectSourceType(sourceType)}`;
  }

  private buildIcoProjectFundingAggregate(
    rows: any[],
    materializedAt: Date,
    preferredSourceType?: string,
  ): any {
    const sortedRows = [...rows].sort((left, right) => {
      const leftTime = this.toDate(left?.fundingDate)?.getTime() ?? -Infinity;
      const rightTime = this.toDate(right?.fundingDate)?.getTime() ?? -Infinity;
      if (leftTime !== rightTime) return rightTime - leftTime;
      return this.toIdString(left?.fundingRoundId).localeCompare(
        this.toIdString(right?.fundingRoundId),
      );
    });
    const bySource: Record<string, any> = {};

    for (const row of sortedRows) {
      const source = this.fundingSourceKey(row);
      const group = bySource[source] || {
        source,
        roundCount: 0,
        totalRaised: 0,
        rounds: [],
        investors: [],
      };
      const amount = this.toFiniteNumber(row?.raisedAmount);
      const fundingDate = this.toDate(row?.fundingDate);
      group.roundCount += 1;
      if (amount !== undefined && amount > 0) group.totalRaised += amount;
      if (
        fundingDate &&
        (!group.lastFunding || fundingDate.getTime() > group.lastFunding.getTime())
      ) {
        group.lastFunding = fundingDate;
      }
      group.rounds.push(this.buildIcoProjectFundingRound(row));
      group.investors = this.uniqueFundingInvestors([
        ...group.investors,
        ...this.arrayValue(row?.investors),
      ]);
      bySource[source] = group;
    }

    const sourceTypes = Object.keys(bySource).sort((left, right) =>
      left.localeCompare(right),
    );
    const preferredSource = normalizeProjectSourceType(preferredSourceType);
    const selectedSource =
      preferredSource && bySource[preferredSource]
        ? preferredSource
        : sourceTypes[0];
    const selected = selectedSource ? bySource[selectedSource] : undefined;
    const orderedBySource = Object.fromEntries(
      sourceTypes.map((source) => [source, bySource[source]]),
    );

    return this.cleanObject({
      hasData: Boolean(selected?.rounds?.length),
      selectedSource,
      totalRaised:
        selected?.totalRaised > 0 ? selected.totalRaised : undefined,
      lastFunding: selected?.lastFunding,
      rounds: selected?.rounds || [],
      investors: selected?.investors || [],
      sourceTypes,
      bySource: orderedBySource,
      materializedAt,
      schemaVersion: SCHEMA_VERSION,
    });
  }

  private buildIcoProjectFundingRound(row: any): Record<string, any> {
    return this.cleanObject({
      _id: this.toIdString(row?.fundingRoundId),
      id: this.toIdString(row?.fundingRoundId),
      fundingRoundId: this.toIdString(row?.fundingRoundId),
      roundName: this.firstString(row?.roundName, row?.normalizedRoundName),
      type: this.firstString(
        row?.roundType,
        row?.normalizedRoundType,
        row?.roundName,
      ),
      roundType: this.firstString(row?.roundType),
      normalizedRoundType: this.firstString(row?.normalizedRoundType),
      status: this.firstString(row?.roundStatus),
      date: this.toDate(row?.fundingDate),
      fundingDate: this.toDate(row?.fundingDate),
      announcedDate: this.toDate(row?.announcedDate),
      raisedAmount: this.toFiniteNumber(row?.raisedAmount),
      fundsRaised: this.toFiniteNumber(row?.raisedAmount),
      valuation: this.toFiniteNumber(row?.valuation),
      tokenPrice: this.toFiniteNumber(row?.tokenPrice),
      platform: row?.platform,
      investors: this.arrayValue(row?.investors),
      primarySource: this.firstString(row?.primarySource),
      sourceType: this.firstString(row?.sourceType),
      sourceFeed: this.firstString(row?.sourceFeed),
      sourceId: this.firstString(row?.sourceId),
      sourceSlug: this.firstString(row?.sourceSlug),
      sourceUrl: this.firstString(row?.sourceUrl),
      sourceRefs: this.arrayValue(row?.sourceRefs),
    });
  }

  private fundingSourceKey(row: any): string {
    return (
      normalizeProjectSourceType(
        this.firstString(row?.sourceType, row?.primarySource, "unknown"),
      ) || "unknown"
    );
  }

  private uniqueFundingInvestors(investors: any[]): any[] {
    const byKey = new Map<string, any>();
    for (const investor of investors) {
      const key = this.investorSnapshotKeys(investor)[0];
      if (!key || byKey.has(key)) continue;
      byKey.set(key, investor);
    }
    return Array.from(byKey.values());
  }

  private unsetMissingFeedOptionalFields(
    set: Record<string, any>,
  ): Record<string, 1> {
    const unset: Record<string, 1> = {};
    for (const field of FUNDING_FEED_OPTIONAL_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(set, field)) unset[field] = 1;
    }
    return unset;
  }

  private duplicateIds(ids: string[]): string[] {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const id of ids.filter(Boolean)) {
      if (seen.has(id)) duplicates.add(id);
      seen.add(id);
    }
    return Array.from(duplicates);
  }

  private requiredObjectId(value: any, fieldName: string): Types.ObjectId {
    const id = this.toObjectId(value);
    if (!id) throw new Error(`Cannot build funding feed read model without ${fieldName}.`);
    return id;
  }

  private uniqueObjectIds(values: any[]): Types.ObjectId[] {
    const map = new Map<string, Types.ObjectId>();
    for (const value of values) {
      const objectId = this.toObjectId(value);
      if (!objectId) continue;
      map.set(objectId.toHexString(), objectId);
    }
    return Array.from(map.values());
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
      platformId: this.toObjectId(value.platformId || value._id),
      name,
      normalizedName: this.firstString(value.normalizedName),
      logoUrl: this.firstString(value.logoUrl, value.logo, value.image),
      sourceType: this.firstString(value.sourceType),
      sourceId: this.toStringValue(value.sourceId || value.id),
      sourceUrl: this.firstString(value.sourceUrl),
    });
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    const id = this.toIdString(value);
    if (!Types.ObjectId.isValid(id)) return undefined;
    return new Types.ObjectId(id);
  }

  private toIdString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();
    if (value._id && value._id !== value) return this.toIdString(value._id);
    if (typeof value.toString === "function") return value.toString();
    return "";
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

  private maxDate(...values: any[]): Date | undefined {
    const dates = values
      .map((value) => this.toDate(value))
      .filter((date): date is Date => Boolean(date));
    if (!dates.length) return undefined;
    return new Date(Math.max(...dates.map((date) => date.getTime())));
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

  private firstArrayString(value: any): string | undefined {
    return this.arrayStrings(value)[0];
  }

  private arrayStrings(value: any): string[] {
    return this.arrayValue(value)
      .filter((item) => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private arrayValue(value: any): any[] {
    return Array.isArray(value) ? value : [];
  }

  private normalizeKey(value: any): string {
    return this.normalizeText(value)
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  private normalizeText(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  private uniqueStrings(values: Array<string | undefined>): string[] {
    return Array.from(new Set(values.filter(Boolean) as string[]));
  }

  private cleanObject<T extends Record<string, any>>(source: T): Partial<T> {
    const result: Partial<T> = {};
    Object.entries(source).forEach(([key, value]) => {
      if (value === undefined || value === "") return;
      result[key as keyof T] = value as any;
    });
    return result;
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.trunc(parsed);
  }

  private nonNegativeInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return fallback;
    return Math.trunc(parsed);
  }

  private pushExample<T>(items: T[], item: T, limit: number): void {
    if (items.length >= limit) return;
    items.push(item);
  }
}
