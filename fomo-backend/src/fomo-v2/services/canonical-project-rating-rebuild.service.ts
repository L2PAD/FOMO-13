import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  FomoV2CanonicalProject,
  FomoV2CanonicalProjectSource,
  FomoV2FundingRound,
  FomoV2FundingRoundParticipant,
  FomoV2IcoProjectReadModel,
  FomoV2MarketProjectReadModel,
  FomoV2ProjectSourceProfile,
  FomoV2VestingSummary,
} from "../models";
import {
  calculateFomoV2CanonicalProjectScores,
  FomoV2CanonicalProjectScores,
} from "../shared/scoring";

export interface FomoV2CanonicalProjectRatingRebuildOptions {
  dryRun?: boolean;
  confirmWrite?: boolean;
  force?: boolean;
  limit?: number;
  offset?: number;
  canonicalProjectId?: string;
  statuses?: string[];
  includeInactive?: boolean;
  examplesLimit?: number;
}

export interface FomoV2CanonicalProjectRatingRebuildResult {
  mode: "dry-run" | "write";
  force: boolean;
  requestedLimit: number;
  offset: number;
  scanned: number;
  calculated: number;
  wouldUpdate: number;
  updated: number;
  skipped: {
    invalidCanonicalProjectId: number;
  };
  byScoreMode: Record<string, number>;
  examples: Array<Record<string, any>>;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
}

type CanonicalProjectRatingContext = {
  sourcesByProjectId: Map<string, any[]>;
  marketProjectsByProjectId: Map<string, any[]>;
  icoProjectsByProjectId: Map<string, any[]>;
  sourceProfilesByProjectId: Map<string, any[]>;
  fundingRoundsByProjectId: Map<string, any[]>;
  fundingParticipantsByProjectId: Map<string, any[]>;
  vestingSummariesByProjectId: Map<string, any[]>;
};

@Injectable()
export class FomoV2CanonicalProjectRatingRebuildService {
  private readonly logger = new Logger(
    FomoV2CanonicalProjectRatingRebuildService.name
  );

  constructor(
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>,
    @InjectModel(FomoV2CanonicalProjectSource.name)
    private readonly canonicalProjectSourceModel: Model<FomoV2CanonicalProjectSource>,
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly marketProjectReadModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(FomoV2IcoProjectReadModel.name)
    private readonly icoProjectReadModel: Model<FomoV2IcoProjectReadModel>,
    @InjectModel(FomoV2ProjectSourceProfile.name)
    private readonly projectSourceProfileModel: Model<FomoV2ProjectSourceProfile>,
    @InjectModel(FomoV2FundingRound.name)
    private readonly fundingRoundModel: Model<FomoV2FundingRound>,
    @InjectModel(FomoV2FundingRoundParticipant.name)
    private readonly fundingRoundParticipantModel: Model<FomoV2FundingRoundParticipant>,
    @InjectModel(FomoV2VestingSummary.name)
    private readonly vestingSummaryModel: Model<FomoV2VestingSummary>
  ) {}

  async rebuild(
    options: FomoV2CanonicalProjectRatingRebuildOptions = {}
  ): Promise<FomoV2CanonicalProjectRatingRebuildResult> {
    const startedAt = new Date();
    const startedMs = Date.now();
    const dryRun = options.dryRun !== false;
    const force = options.force === true;
    const limit = this.positiveInteger(options.limit, 100);
    const offset = this.nonNegativeInteger(options.offset, 0);
    const examplesLimit = this.nonNegativeInteger(options.examplesLimit, 10);
    const result: FomoV2CanonicalProjectRatingRebuildResult = {
      mode: dryRun ? "dry-run" : "write",
      force,
      requestedLimit: limit,
      offset,
      scanned: 0,
      calculated: 0,
      wouldUpdate: 0,
      updated: 0,
      skipped: {
        invalidCanonicalProjectId: 0,
      },
      byScoreMode: {},
      examples: [],
      startedAt: startedAt.toISOString(),
    };

    if (!dryRun && options.confirmWrite !== true) {
      throw new Error(
        "FOMO v2 canonical rating rebuild write requires --confirm-write=true."
      );
    }

    const query = this.buildCanonicalProjectQuery(options);
    if (!query) {
      result.skipped.invalidCanonicalProjectId = 1;
      return this.finishResult(result, startedMs);
    }

    const canonicalProjects = await this.loadCanonicalProjects(query, {
      limit,
      offset,
    });
    result.scanned = canonicalProjects.length;
    if (!canonicalProjects.length) return this.finishResult(result, startedMs);

    const canonicalProjectIds = canonicalProjects
      .map((project) => this.toObjectId(project._id))
      .filter((id): id is Types.ObjectId => Boolean(id));
    const context = await this.loadRatingContext(canonicalProjectIds);
    const operations: any[] = [];

    for (const canonicalProject of canonicalProjects) {
      const projectId = this.toIdString(canonicalProject._id);
      const scores = calculateFomoV2CanonicalProjectScores({
        canonicalProject,
        sources: context.sourcesByProjectId.get(projectId) || [],
        marketProjects: context.marketProjectsByProjectId.get(projectId) || [],
        icoProjects: context.icoProjectsByProjectId.get(projectId) || [],
        sourceProfiles: context.sourceProfilesByProjectId.get(projectId) || [],
        fundingRounds: context.fundingRoundsByProjectId.get(projectId) || [],
        fundingParticipants:
          context.fundingParticipantsByProjectId.get(projectId) || [],
        vestingSummaries:
          context.vestingSummariesByProjectId.get(projectId) || [],
        calculatedAt: startedAt,
      });

      result.calculated += 1;
      result.byScoreMode[scores.ratingBreakdown.mode] =
        (result.byScoreMode[scores.ratingBreakdown.mode] || 0) + 1;

      const shouldUpdate =
        force || this.hasScoreChanged(canonicalProject, scores);
      if (!shouldUpdate) continue;

      result.wouldUpdate += 1;
      this.pushExample(
        result.examples,
        this.buildExample(canonicalProject, scores),
        examplesLimit
      );
      operations.push({
        updateOne: {
          filter: { _id: canonicalProject._id },
          update: { $set: this.buildUpdateSet(scores) },
        },
      });
    }

    if (!dryRun && operations.length) {
      result.updated = await this.bulkWriteUpdates(operations);
    }

    return this.finishResult(result, startedMs);
  }

  private buildCanonicalProjectQuery(
    options: FomoV2CanonicalProjectRatingRebuildOptions
  ): Record<string, any> | null {
    if (options.canonicalProjectId) {
      const id = this.toObjectId(options.canonicalProjectId);
      return id ? { _id: id } : null;
    }

    const query: Record<string, any> = {};
    const statuses = this.cleanStrings(options.statuses);

    if (statuses.length) {
      query.status = { $in: statuses };
    } else if (options.includeInactive !== true) {
      query.status = { $in: ["active", "proposed"] };
    }

    return query;
  }

  private loadCanonicalProjects(
    query: Record<string, any>,
    options: { limit: number; offset: number }
  ): Promise<any[]> {
    return this.canonicalProjectModel
      .find(query)
      .sort({ _id: 1 })
      .skip(options.offset)
      .limit(options.limit)
      .select(
        [
          "_id",
          "name",
          "normalizedName",
          "slug",
          "symbol",
          "normalizedSymbol",
          "status",
          "primaryWebsiteDomain",
          "providerIds",
          "aliases",
          "createdBy",
          "hasMarketData",
          "originSourceType",
          "identitySource",
          "identityConfidence",
          "sourceEvidence",
          "metadata",
          "fomoScore",
          "rating",
          "fullness",
          "ratingBreakdown",
          "fullnessBreakdown",
          "lastRatingCalculatedAt",
          "updatedAt",
          "createdAt",
        ].join(" ")
      )
      .lean()
      .exec();
  }

  private async loadRatingContext(
    canonicalProjectIds: Types.ObjectId[]
  ): Promise<CanonicalProjectRatingContext> {
    const query = { canonicalProjectId: { $in: canonicalProjectIds } };
    const [
      sources,
      marketProjects,
      icoProjects,
      sourceProfiles,
      fundingRounds,
      fundingParticipants,
      vestingSummaries,
    ] = await Promise.all([
      this.canonicalProjectSourceModel
        .find(query)
        .select(
          "canonicalProjectId source sourceEntityType sourceId sourceSlug sourceUrl websiteDomain sourceEntityId sourceSnapshotId confidence matchedBy reason verified status metadata updatedAt createdAt"
        )
        .lean(),
      this.marketProjectReadModel
        .find(query)
        .select(
          [
            "canonicalProjectId",
            "marketAssetId",
            "projectKind",
            "name",
            "symbol",
            "slug",
            "logo",
            "rank",
            "tier",
            "trading",
            "status",
            "price",
            "priceChange",
            "marketCap",
            "fullyDilutedMarketCap",
            "volume24h",
            "volume24hChange",
            "circulatingSupply",
            "totalSupply",
            "maxSupply",
            "athUsd",
            "usdQuote",
            "performance",
            "performanceUpdatedAt",
            "marketDataUpdatedAt",
            "chart7d",
            "chart7dTrend",
            "chart7dPointsCount",
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
            "links",
            "providerIds",
            "sourceCoverage",
            "updatedAt",
            "createdAt",
          ].join(" ")
        )
        .lean(),
      this.icoProjectReadModel
        .find(query)
        .select(
          "canonicalProjectId sourceType name symbol slug logoUrl description website categories status launchDate hasMarketData marketAssetId profileCompleteness metadata updatedAt createdAt"
        )
        .lean(),
      this.projectSourceProfileModel
        .find(query)
        .select(
          "canonicalProjectId sourceType sourceProjectId sourceSlug sourceUrl name symbol slug description website socials logoUrl categories status launchDate sourceEntityId sourceSnapshotId metadata updatedAt createdAt"
        )
        .lean(),
      this.fundingRoundModel
        .find(query)
        .select(
          "canonicalProjectId marketAssetId roundKey roundName normalizedRoundName roundType normalizedRoundType status announcedDate date raisedAmount raisedCurrency valuation tokenPrice primarySource sourceType sourceId sourceSlug sourceUrl sourceRefs confidence metadata updatedAt createdAt"
        )
        .lean(),
      this.fundingRoundParticipantModel
        .find(query)
        .select(
          "canonicalProjectId fundingRoundId backerId backerName normalizedBackerName sourceBackerRef sourceBackerId sourceBackerSlug role isLead status primarySource confidence metadata updatedAt createdAt"
        )
        .lean(),
      this.vestingSummaryModel
        .find(query)
        .select(
          "canonicalProjectId sourceType vestingDatasetKey totalAmount unlockedAmount lockedAmount untrackedAmount unlockedPercent lockedPercent untrackedPercent lastUnlockDate nextUnlockDate sourceUnlockedValueUsd sourceLockedValueUsd calculatedAt updatedAt createdAt"
        )
        .lean(),
    ]);

    return {
      sourcesByProjectId: this.groupByCanonicalProjectId(sources),
      marketProjectsByProjectId: this.groupByCanonicalProjectId(marketProjects),
      icoProjectsByProjectId: this.groupByCanonicalProjectId(icoProjects),
      sourceProfilesByProjectId: this.groupByCanonicalProjectId(sourceProfiles),
      fundingRoundsByProjectId: this.groupByCanonicalProjectId(fundingRounds),
      fundingParticipantsByProjectId:
        this.groupByCanonicalProjectId(fundingParticipants),
      vestingSummariesByProjectId:
        this.groupByCanonicalProjectId(vestingSummaries),
    };
  }

  private hasScoreChanged(
    canonicalProject: any,
    scores: FomoV2CanonicalProjectScores
  ): boolean {
    return (
      this.roundScore(canonicalProject?.fomoScore) !== scores.fomoScore ||
      this.roundScore(canonicalProject?.rating) !== scores.rating ||
      this.roundScore(canonicalProject?.fullness) !== scores.fullness ||
      canonicalProject?.ratingBreakdown?.version !==
        scores.ratingBreakdown.version ||
      canonicalProject?.ratingBreakdown?.mode !== scores.ratingBreakdown.mode ||
      canonicalProject?.fullnessBreakdown?.version !==
        scores.fullnessBreakdown.version ||
      !canonicalProject?.lastRatingCalculatedAt ||
      this.roundScore(canonicalProject?.metadata?.fomoScore) !==
        scores.fomoScore
    );
  }

  private buildUpdateSet(
    scores: FomoV2CanonicalProjectScores
  ): Record<string, any> {
    return {
      fomoScore: scores.fomoScore,
      rating: scores.rating,
      fullness: scores.fullness,
      ratingBreakdown: scores.ratingBreakdown,
      fullnessBreakdown: scores.fullnessBreakdown,
      lastRatingCalculatedAt: scores.ratingBreakdown.calculatedAt,
      "metadata.fomoScore": scores.fomoScore,
      "metadata.rating": scores.rating,
      "metadata.fullness": scores.fullness,
      "metadata.ratingBreakdown": scores.ratingBreakdown,
      "metadata.fullnessBreakdown": scores.fullnessBreakdown,
      "metadata.lastRatingCalculatedAt": scores.ratingBreakdown.calculatedAt,
    };
  }

  private buildExample(
    canonicalProject: any,
    scores: FomoV2CanonicalProjectScores
  ): Record<string, any> {
    return {
      canonicalProjectId: this.toIdString(canonicalProject?._id),
      name: canonicalProject?.name,
      previousFomoScore: this.roundScore(canonicalProject?.fomoScore),
      fomoScore: scores.fomoScore,
      fullness: scores.fullness,
      mode: scores.ratingBreakdown.mode,
      topComponents: this.topComponents(scores.ratingBreakdown.components),
      penalties: (scores.ratingBreakdown.penalties || []).slice(0, 3),
      caps: (scores.ratingBreakdown.caps || []).slice(0, 3),
    };
  }

  private async bulkWriteUpdates(operations: any[]): Promise<number> {
    const result: any = await this.canonicalProjectModel.bulkWrite(operations, {
      ordered: false,
    });
    const updated = Number(result?.modifiedCount || result?.nModified || 0);
    this.logger.log(`Updated ${updated} canonical project rating row(s).`);

    return updated;
  }

  private finishResult(
    result: FomoV2CanonicalProjectRatingRebuildResult,
    startedMs: number
  ): FomoV2CanonicalProjectRatingRebuildResult {
    result.finishedAt = new Date().toISOString();
    result.durationMs = Date.now() - startedMs;

    return result;
  }

  private groupByCanonicalProjectId(rows: any[]): Map<string, any[]> {
    const map = new Map<string, any[]>();

    for (const row of rows || []) {
      const key = this.toIdString(row?.canonicalProjectId);
      if (!key) continue;

      const items = map.get(key) || [];
      items.push(row);
      map.set(key, items);
    }

    return map;
  }

  private topComponents(
    components: Record<string, number> = {}
  ): Record<string, number> {
    return Object.fromEntries(
      Object.entries(components)
        .sort((left, right) => right[1] - left[1])
        .slice(0, 4)
    );
  }

  private pushExample(examples: any[], example: any, limit: number): void {
    if (examples.length < limit) examples.push(example);
  }

  private toObjectId(value: any): Types.ObjectId | null {
    const id = this.toIdString(value);
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null;
  }

  private toIdString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();
    if (value._id) return this.toIdString(value._id);

    return String(value);
  }

  private cleanStrings(values: any): string[] {
    const array = Array.isArray(values) ? values : values ? [values] : [];

    return Array.from(
      new Set(
        array
          .flatMap((value) => String(value || "").split(","))
          .map((value) => value.trim())
          .filter(Boolean)
      )
    );
  }

  private roundScore(value: any): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;

    return Math.round(parsed);
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
}
