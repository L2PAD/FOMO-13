import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import {
  FomoV2CanonicalProject,
  FomoV2CanonicalProjectSource,
  FomoV2MarketAsset,
  FomoV2ProjectAssetLink,
  FomoV2SourceEntity,
} from "../../../models";
import { FOMO_V2_PARSER_DB_CONNECTION } from "../../ico/ico-parser-db.constants";
import { FomoV2ProjectSourceProfile } from "../../project-profiles";
import {
  FomoV2Backer,
  FomoV2BackerSourceProfile,
  normalizeBackerName,
} from "../../backers";
import {
  FomoV2ProjectDomainSource,
  FomoV2ProjectDomainSourceService,
  normalizeProjectSourceType,
  projectSourceTypeMongoPattern,
} from "../../../shared/source-policy";
import { FomoV2ParserControlPolicyService } from "../../parser-control/services/parser-control-policy.service";
import {
  FomoV2ParserSnapshotReaderService,
  FomoV2ValidatedParserSnapshot,
} from "../../parser-control/services/parser-snapshot-reader.service";
import {
  buildImportCandidateFingerprint,
  FomoV2ImportCandidate,
  FomoV2ImportCandidateInput,
  FomoV2ImportCandidateService,
} from "../../import-candidates";
import {
  buildMissingCanonicalProjectReviewFingerprint,
  buildReviewFingerprint,
  buildSourceConflictReviewFingerprint,
} from "../../review/helpers";
import { FomoV2ReviewBatch } from "../../review/models/review-batch.model";
import { FomoV2ReviewService } from "../../review/services/review.service";
import { FomoV2ReviewCandidateInput } from "../../review/types";
import {
  buildFundingRoundFingerprint,
  buildFundingRoundParticipantFingerprint,
  cleanFundingString,
  fundingDateBucket,
  normalizeFundingName,
  normalizeFundingParticipantRole,
  normalizeFundingRoundStatus,
  normalizeFundingRoundType,
} from "../helpers";
import { FomoV2FundingRound, FomoV2FundingRoundParticipant } from "../models";
import { FomoV2FundingService } from "./funding.service";

const INTEL_FUNDRAISING_COLLECTION = "intel_fundraising";
const INTEL_FUNDRAISING_SOURCE_FEED = "intel_fundraising";
const DROPSTAB_FUNDRAISING_UPSTREAM_PARSER_KEY = "dropstab:fundraising";
const DEBUG_LIMIT = 20;
const SUPPORTED_SOURCE_TYPES = ["dropstab"] as const;

export type IntelFundraisingGapFillWriteMode =
  | "dry-run"
  | "participants-only"
  | "feed-rounds";

export interface IntelFundraisingGapFillDryRunOptions {
  limit?: number;
  all?: boolean;
  allConfirmed?: boolean;
  debug?: boolean;
  sourceType?: string;
  sourceDocumentIds?: string[];
  write?: boolean;
  participantsOnly?: boolean;
  feedRounds?: boolean;
  canonicalMarketlessOnly?: boolean;
  snapshotId?: string;
  upstreamRunId?: string;
  upstreamParserKey?: string;
  /** In-process lease/policy fence supplied by the managed parser worker. */
  assertExecutionActive?: () => void | Promise<void>;
}

export interface IntelFundraisingGapFillBySourceSummary {
  total: number;
  resolvedProjects: number;
  matchedExistingRounds: number;
  newRoundCandidates: number;
  sourceConflicts: number;
  sourceLocksMatched: number;
  sourceLocksWouldCreate: number;
  roundEnrichmentCandidates: number;
  participantsFound: number;
  backersResolved: number;
  newParticipantsForExistingRounds: number;
  feedRoundsWouldCreate: number;
  feedRoundsCreated: number;
  participantsWouldCreate: number;
  participantsCreated: number;
}

export interface IntelFundraisingGapFillDryRunResult {
  mode: "dry-run" | "write";
  writeMode: IntelFundraisingGapFillWriteMode;
  sourceCollection: string;
  sourceFeed: string;
  supportedSourceTypes: string[];
  sourceFilter?: string;
  sourceDocumentIdsFilter?: string[];
  canonicalMarketlessOnly: boolean;
  dbName: string;
  parserDbName: string;
  totalParserRows: number;
  rowsScanned: number;
  rowsWithSupportedSource: number;
  missingSource: number;
  unsupportedSource: number;
  resolvedCanonicalProjects: number;
  resolvedProjects: number;
  canonicalProjectsSkippedWithMarketData: number;
  missingCanonicalProjects: number;
  missingProjects: number;
  sourceLocksMatched: number;
  sourceLocksWouldCreate: number;
  sourceLocksCreated: number;
  sourceConflicts: number;
  roundsFound: number;
  matchedExistingRounds: number;
  matchedByFingerprint: number;
  matchedBySourceId: number;
  matchedByRoundKey: number;
  matchedByTypeDate: number;
  economicSimilaritySignals: number;
  highRiskEconomicSimilaritySignals: number;
  newRoundCandidates: number;
  feedRoundsWouldCreate: number;
  feedRoundsCreated: number;
  roundEnrichmentCandidates: number;
  roundDifferenceSignals: number;
  roundFieldsWouldEnrich: Record<string, number>;
  roundFieldDifferenceSignals: Record<string, number>;
  participantsFound: number;
  participantsForMatchedRounds: number;
  participantsForNewRoundCandidates: number;
  backersResolved: number;
  backersMissing: number;
  backersAmbiguous: number;
  participantsMatchedExisting: number;
  newParticipantsForExistingRounds: number;
  newParticipantsForNewRoundCandidates: number;
  participantsWouldCreate: number;
  participantsCreated: number;
  participantEnrichmentCandidates: number;
  participantFieldsWouldEnrich: Record<string, number>;
  participantsSkipped: number;
  participantsSkippedMissingBacker: number;
  participantsSkippedAmbiguousBacker: number;
  projectCandidatesWouldCreate: number;
  projectCandidatesWouldUpdate: number;
  projectCandidatesCreated: number;
  projectCandidatesUpdated: number;
  backerCandidatesWouldCreate: number;
  backerCandidatesWouldUpdate: number;
  backerCandidatesCreated: number;
  backerCandidatesUpdated: number;
  reviewsWouldCreate: number;
  reviewsWouldUpdate: number;
  reviewsCreated: number;
  reviewsUpdated: number;
  reviewsByReason: Record<string, number>;
  bySourceType: Record<string, IntelFundraisingGapFillBySourceSummary>;
  skipped: {
    total: number;
    byReason: Record<string, number>;
    examples?: Array<Record<string, any>>;
  };
  warnings: string[];
  errors: Array<Record<string, any>>;
  debugExamples?: {
    missingSource: Array<Record<string, any>>;
    unsupportedSource: Array<Record<string, any>>;
    linkedProjects: Array<Record<string, any>>;
    missingCanonicalProject: Array<Record<string, any>>;
    sourceConflict: Array<Record<string, any>>;
    matchedExistingRounds: Array<Record<string, any>>;
    newRoundCandidates: Array<Record<string, any>>;
    roundEnrichmentCandidates: Array<Record<string, any>>;
    economicSimilaritySignals: Array<Record<string, any>>;
    feedRoundsWouldCreate: Array<Record<string, any>>;
    newParticipantsForExistingRounds: Array<Record<string, any>>;
    backersMissing: Array<Record<string, any>>;
    backersAmbiguous: Array<Record<string, any>>;
    projectCandidates: Array<Record<string, any>>;
    backerCandidates: Array<Record<string, any>>;
    reviews: Array<Record<string, any>>;
  };
}

interface ProjectIdentity {
  sourceDocumentId?: string;
  sourceProjectId?: string;
  sourceId?: string;
  sourceSlug?: string;
  rawSlug?: string;
  sourceUrl?: string;
  sourcePath?: string;
  name?: string;
  normalizedName?: string;
  symbol?: string;
  normalizedSymbol?: string;
  coingeckoId?: string;
}

interface ProjectResolveResult {
  canonicalProjectId?: Types.ObjectId;
  canonicalProjectIdString?: string;
  canonical?: Record<string, any>;
  matchedBy: string;
  score: number;
  reason?: string;
  ambiguous?: boolean;
}

interface IntelRoundCandidate {
  canonicalProjectId: Types.ObjectId;
  sourceDocumentId?: string;
  sourceType: string;
  sourceFeed: string;
  feedExternalId?: string;
  sourceRow: Record<string, any>;
  projectIdentity: ProjectIdentity;
  projectLabel: string;
  roundName?: string;
  normalizedRoundName?: string;
  roundType: string;
  normalizedRoundType: string;
  hasRoundStage: boolean;
  announcedDate?: Date;
  dateBucket?: string;
  raisedAmount?: number;
  raisedCurrency?: string;
  valuation?: number;
  tokenPrice?: number;
  primarySource: string;
  sourceId?: string;
  sourceUrl?: string;
  importMode?: string;
  isFeedOnly?: boolean;
  sourceRefs: Array<Record<string, any>>;
  status: string;
  roundKey: string;
  canonicalFingerprint: string;
}

interface ExistingRoundDecision {
  decision:
    | "matched_by_fingerprint"
    | "matched_by_source_id"
    | "matched_by_round_key"
    | "matched_by_type_date"
    | "new_round_candidate";
  existingRound?: Record<string, any>;
  economicSimilarity?: Record<string, any>;
  highRiskEconomicSimilarity?: boolean;
  feedRoundWouldCreate?: boolean;
}

interface ParticipantIdentity {
  backerName?: string;
  normalizedBackerName?: string;
  sourceBackerId?: string;
  sourceBackerSlug?: string;
  sourceBackerUrl?: string;
  isLead: boolean;
}

interface BackerResolution {
  status: "resolved" | "missing" | "ambiguous";
  matchedBy: string;
  backerId?: Types.ObjectId;
  backer?: Record<string, any>;
  candidates?: Array<Record<string, any>>;
}

interface MarketlessCanonicalIdentityIndex {
  totalCanonicalProjects: number;
  bySourceIdentity: Map<string, Array<Record<string, any>>>;
  bySourceUrl: Map<string, Array<Record<string, any>>>;
  byName: Map<string, Array<Record<string, any>>>;
  byNameSymbol: Map<string, Array<Record<string, any>>>;
  sourceIdentityValuesByProjectId: Map<string, string[]>;
}

interface IntelGapFillContext {
  debug: boolean;
  write: boolean;
  writeMode: IntelFundraisingGapFillWriteMode;
  canonicalMarketlessOnly: boolean;
  result: IntelFundraisingGapFillDryRunResult;
  seenCandidateFingerprints: Set<string>;
  seenReviewFingerprints: Set<string>;
}

@Injectable()
export class FomoV2IntelFundraisingGapFillDryRunService {
  private readonly projectResolutionCache = new Map<
    string,
    Promise<ProjectResolveResult>
  >();
  private readonly backerResolutionCache = new Map<
    string,
    Promise<BackerResolution>
  >();
  private marketlessCanonicalIdentityIndex?: Promise<MarketlessCanonicalIdentityIndex>;

  constructor(
    private readonly configService: ConfigService,
    @InjectConnection(FOMO_V2_PARSER_DB_CONNECTION)
    private readonly parserConnection: Connection,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<any>,
    @InjectModel(FomoV2ProjectSourceProfile.name)
    private readonly projectSourceProfileModel: Model<any>,
    @InjectModel(FomoV2SourceEntity.name)
    private readonly sourceEntityModel: Model<any>,
    @InjectModel(FomoV2CanonicalProjectSource.name)
    private readonly canonicalProjectSourceModel: Model<any>,
    @InjectModel(FomoV2MarketAsset.name)
    private readonly marketAssetModel: Model<any>,
    @InjectModel(FomoV2ProjectAssetLink.name)
    private readonly projectAssetLinkModel: Model<any>,
    @InjectModel(FomoV2Backer.name)
    private readonly backerModel: Model<any>,
    @InjectModel(FomoV2BackerSourceProfile.name)
    private readonly backerSourceProfileModel: Model<any>,
    @InjectModel(FomoV2FundingRound.name)
    private readonly fundingRoundModel: Model<any>,
    @InjectModel(FomoV2FundingRoundParticipant.name)
    private readonly participantModel: Model<any>,
    @InjectModel(FomoV2ProjectDomainSource.name)
    private readonly projectDomainSourceModel: Model<any>,
    @InjectModel(FomoV2ImportCandidate.name)
    private readonly importCandidateModel: Model<any>,
    @InjectModel(FomoV2ReviewBatch.name)
    private readonly reviewBatchModel: Model<any>,
    private readonly projectDomainSourceService: FomoV2ProjectDomainSourceService,
    private readonly fundingService: FomoV2FundingService,
    private readonly importCandidateService: FomoV2ImportCandidateService,
    private readonly reviewService: FomoV2ReviewService,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService,
    @Optional()
    private readonly snapshotReader?: FomoV2ParserSnapshotReaderService
  ) {}

  async run(
    options: IntelFundraisingGapFillDryRunOptions = {}
  ): Promise<IntelFundraisingGapFillDryRunResult> {
    const debug = Boolean(options.debug);
    const write = Boolean(options.write);
    if (write && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        "funding:intel_fundraising"
      );
    }
    await options.assertExecutionActive?.();
    const writeMode = this.resolveWriteMode(options);
    const snapshotId = cleanFundingString(options.snapshotId);
    const sourceFilter = this.normalizeOptionalSourceType(
      options.sourceType || (snapshotId ? "dropstab" : undefined)
    );
    const sourceDocumentIdsFilter = this.normalizeSourceDocumentIds(
      options.sourceDocumentIds
    );
    const canonicalMarketlessOnly = Boolean(options.canonicalMarketlessOnly);
    const hasExplicitLimit =
      options.limit !== undefined && options.limit !== null;
    if (options.all && !options.allConfirmed) {
      throw new Error("Intel fundraising --all requires --all-confirmed.");
    }
    if (write && !hasExplicitLimit && !(options.all && options.allConfirmed)) {
      throw new Error(
        "Intel fundraising write mode requires --limit or confirmed --all."
      );
    }
    const limit = options.all
      ? undefined
      : this.parsePositiveInteger(options.limit, 100);
    const result = this.emptyResult(
      debug,
      sourceFilter,
      write,
      writeMode,
      canonicalMarketlessOnly,
      sourceDocumentIdsFilter
    );
    const context: IntelGapFillContext = {
      debug,
      write,
      writeMode,
      canonicalMarketlessOnly,
      result,
      seenCandidateFingerprints: new Set(),
      seenReviewFingerprints: new Set(),
    };
    const snapshot = await this.openSnapshot(
      options,
      sourceFilter,
      write
    );
    const parserCollection = snapshot ? undefined : this.parserCollection();
    const query: Record<string, any> = sourceFilter
      ? { source: sourceFilter }
      : {};
    if (sourceDocumentIdsFilter.length) {
      query._id = {
        $in: sourceDocumentIdsFilter.map((id) => new Types.ObjectId(id)),
      };
    }

    const snapshotPayloadFilter = sourceDocumentIdsFilter.length
      ? {
          _id: {
            $in: sourceDocumentIdsFilter.map((id) => new Types.ObjectId(id)),
          },
        }
      : undefined;
    result.totalParserRows = snapshot
      ? await this.snapshotReader!.count(snapshot, snapshotPayloadFilter)
      : await parserCollection.countDocuments(query);
    if (limit !== undefined && result.totalParserRows > limit) {
      result.warnings.push(
        `Processing first ${limit} intel_fundraising rows out of ${result.totalParserRows}.`
      );
    }

    let cursor = snapshot
      ? this.snapshotReader!.cursor(snapshot, {
          payloadFilter: snapshotPayloadFilter,
          limit,
        })
      : parserCollection.find(query).sort({ _id: 1 });
    if (!snapshot && limit !== undefined) cursor = cursor.limit(limit);

    for await (const sourceDocument of cursor as any) {
      await options.assertExecutionActive?.();
      const row = snapshot
        ? this.snapshotReader!.payload(snapshot, sourceDocument)
        : sourceDocument;
      await this.processRow(row, context);
      await options.assertExecutionActive?.();
    }

    return result;
  }

  private async openSnapshot(
    options: IntelFundraisingGapFillDryRunOptions,
    sourceType: string | undefined,
    write: boolean
  ): Promise<FomoV2ValidatedParserSnapshot | undefined> {
    const snapshotId = cleanFundingString(options.snapshotId);
    if (!snapshotId) return undefined;
    if (!this.snapshotReader) {
      throw new Error("Parser snapshot reader is not available.");
    }
    if (sourceType !== "dropstab") {
      throw new Error(
        'Intel fundraising snapshot import requires sourceType="dropstab".'
      );
    }
    const parserKey =
      cleanFundingString(options.upstreamParserKey) ||
      DROPSTAB_FUNDRAISING_UPSTREAM_PARSER_KEY;
    if (parserKey !== DROPSTAB_FUNDRAISING_UPSTREAM_PARSER_KEY) {
      throw new Error(
        `Intel fundraising snapshot import requires parser ${DROPSTAB_FUNDRAISING_UPSTREAM_PARSER_KEY}.`
      );
    }
    return this.snapshotReader.validate({
      snapshotId,
      parserKey,
      sourceType,
      write,
      upstreamRunId: cleanFundingString(options.upstreamRunId),
    });
  }

  async auditFeedOnly(
    options: {
      sourceType?: string;
      sourceFeed?: string;
      limit?: number;
    } = {}
  ): Promise<Record<string, any>> {
    const sourceType = this.normalizeOptionalSourceType(options.sourceType);
    const sourceFeed =
      cleanFundingString(options.sourceFeed) || INTEL_FUNDRAISING_SOURCE_FEED;
    const match = {
      isFeedOnly: true,
      sourceFeed,
      ...(sourceType ? { sourceType } : {}),
    };
    const bySource = await this.fundingRoundModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            sourceType: "$sourceType",
            sourceFeed: "$sourceFeed",
          },
          rounds: { $sum: 1 },
        },
      },
      { $sort: { "_id.sourceType": 1, "_id.sourceFeed": 1 } },
    ]);
    const participantCounts = await this.fundingRoundModel.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "funding_round_participants",
          localField: "_id",
          foreignField: "fundingRoundId",
          as: "participants",
        },
      },
      {
        $project: {
          sourceType: 1,
          sourceFeed: 1,
          feedExternalId: 1,
          roundName: 1,
          dateBucket: 1,
          participantsCount: { $size: "$participants" },
        },
      },
      {
        $group: {
          _id: {
            sourceType: "$sourceType",
            sourceFeed: "$sourceFeed",
          },
          rounds: { $sum: 1 },
          participantsAttached: { $sum: "$participantsCount" },
          roundsWithoutParticipants: {
            $sum: { $cond: [{ $eq: ["$participantsCount", 0] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.sourceType": 1, "_id.sourceFeed": 1 } },
    ]);
    const examples = await this.fundingRoundModel
      .find(match)
      .select({
        _id: 1,
        canonicalProjectId: 1,
        sourceType: 1,
        sourceFeed: 1,
        feedExternalId: 1,
        roundName: 1,
        dateBucket: 1,
        raisedAmount: 1,
      })
      .sort({ createdAt: -1, _id: -1 })
      .limit(this.parsePositiveInteger(options.limit, 20))
      .lean();

    return {
      mode: "read-only-audit",
      dbName: this.dbName(),
      sourceFeed,
      sourceType,
      totalFeedOnlyRounds: await this.fundingRoundModel.countDocuments(match),
      bySource,
      participantCounts,
      examples: examples.map((row) => ({
        fundingRoundId: this.toIdString(row._id),
        canonicalProjectId: this.toIdString(row.canonicalProjectId),
        sourceType: row.sourceType,
        sourceFeed: row.sourceFeed,
        feedExternalId: row.feedExternalId,
        roundName: row.roundName,
        dateBucket: row.dateBucket,
        raisedAmount: row.raisedAmount,
      })),
      manualRollbackQuery: {
        funding_rounds: match,
        funding_round_participants:
          "Delete only participants whose fundingRoundId is in the matched funding_rounds _id set.",
      },
    };
  }

  private async processRow(
    row: Record<string, any>,
    context: IntelGapFillContext
  ): Promise<void> {
    const { result, debug } = context;
    result.rowsScanned += 1;
    const sourceType = this.normalizeOptionalSourceType(row?.source);
    const sourceDocumentId = this.toIdString(row?._id);

    if (!sourceType) {
      result.missingSource += 1;
      this.recordSkipped(result, "MISSING_SOURCE", 1, {
        sourceDocumentId,
        key: row?.key,
        project: row?.project,
        round: row?.round,
      });
      this.pushDebug(debug, result.debugExamples?.missingSource, {
        sourceDocumentId,
        key: row?.key,
        project: row?.project,
        round: row?.round,
      });
      return;
    }

    const sourceSummary = this.sourceSummary(result, sourceType);
    sourceSummary.total += 1;

    if (!this.isSupportedSourceType(sourceType)) {
      result.unsupportedSource += 1;
      this.recordSkipped(result, "UNSUPPORTED_SOURCE", 1, {
        sourceType,
        sourceDocumentId,
        key: row?.key,
        project: row?.project,
        round: row?.round,
      });
      this.pushDebug(debug, result.debugExamples?.unsupportedSource, {
        sourceType,
        sourceDocumentId,
        key: row?.key,
        project: row?.project,
        round: row?.round,
      });
      return;
    }

    result.rowsWithSupportedSource += 1;
    const identity = this.projectIdentity(row, sourceType);

    try {
      const resolved = await this.resolveCanonicalProject(
        identity,
        sourceType,
        context
      );
      if (!resolved.canonicalProjectId) {
        result.missingCanonicalProjects += 1;
        result.missingProjects += 1;
        this.recordSkipped(result, "missing_canonical_project", 1, {
          sourceType,
          project: this.projectLabel(identity),
          sourceDocumentId,
          reason: resolved.reason || "No canonical project match.",
        });
        if (resolved.ambiguous) {
          await this.recordReview(context, {
            reason: "POTENTIAL_PROJECT_MATCH",
            sourceType,
            identity,
            projectKey: this.projectKey(identity),
          });
        } else {
          await this.simulateProjectCandidate(identity, sourceType, context);
        }
        this.pushDebug(debug, result.debugExamples?.missingCanonicalProject, {
          ...this.projectDebugExample(identity, resolved),
          sourceType,
          reason: resolved.reason || "No canonical project match.",
        });
        return;
      }

      if (
        context.canonicalMarketlessOnly &&
        !this.isMarketlessResolve(resolved)
      ) {
        result.canonicalProjectsSkippedWithMarketData += 1;
        this.recordSkipped(result, "canonical_project_not_marketless", 1, {
          sourceType,
          project: this.projectLabel(identity),
          sourceDocumentId,
          canonicalProjectId: this.toIdString(resolved.canonicalProjectId),
          hasMarketData: resolved.canonical?.hasMarketData,
          matchedBy: resolved.matchedBy,
        });
        return;
      }

      result.resolvedCanonicalProjects += 1;
      result.resolvedProjects += 1;
      sourceSummary.resolvedProjects += 1;
      this.pushDebug(debug, result.debugExamples?.linkedProjects, {
        ...this.projectDebugExample(identity, resolved),
        sourceType,
      });

      const lock = await this.projectDomainSourceModel
        .findOne({
          canonicalProjectId: resolved.canonicalProjectId,
          domain: "funding",
        })
        .lean();

      if (!lock) {
        result.sourceLocksWouldCreate += 1;
        sourceSummary.sourceLocksWouldCreate += 1;
      } else if (
        this.normalizeOptionalSourceType(lock.selectedSourceType) === sourceType
      ) {
        result.sourceLocksMatched += 1;
        sourceSummary.sourceLocksMatched += 1;
      } else {
        result.sourceConflicts += 1;
        sourceSummary.sourceConflicts += 1;
        this.recordSkipped(result, "source_conflict", 1, {
          sourceType,
          selectedSourceType: lock.selectedSourceType,
          project: this.projectLabel(identity),
          canonicalProjectId: this.toIdString(resolved.canonicalProjectId),
        });
        await this.recordReview(context, {
          reason: "SOURCE_CONFLICT",
          sourceType,
          identity,
          canonicalProjectId: resolved.canonicalProjectId,
          currentSourceType: lock.selectedSourceType,
        });
        this.pushDebug(debug, result.debugExamples?.sourceConflict, {
          sourceType,
          selectedSourceType: lock.selectedSourceType,
          project: this.projectLabel(identity),
          canonical: this.canonicalDebug(resolved.canonical),
        });
        return;
      }

      const candidate = this.normalizeRound(
        row,
        identity,
        resolved.canonicalProjectId,
        sourceType
      );
      if (!candidate) {
        result.roundsFound += 1;
        result.newRoundCandidates += 1;
        sourceSummary.newRoundCandidates += 1;
        this.recordSkipped(result, "round_validation_failed", 1, {
          sourceType,
          project: this.projectLabel(identity),
          sourceDocumentId,
        });
        return;
      }

      result.roundsFound += 1;
      const decision = await this.findExistingRound(candidate);
      let participantDecision = decision;
      if (decision.decision === "new_round_candidate") {
        result.newRoundCandidates += 1;
        sourceSummary.newRoundCandidates += 1;
        this.pushDebug(debug, result.debugExamples?.newRoundCandidates, {
          ...this.roundDebug(candidate),
          sourceType,
          economicSimilarity: decision.economicSimilarity,
        });
        if (decision.economicSimilarity) {
          result.economicSimilaritySignals += 1;
          if (decision.highRiskEconomicSimilarity) {
            result.highRiskEconomicSimilaritySignals += 1;
          }
          this.pushDebug(
            debug,
            result.debugExamples?.economicSimilaritySignals,
            {
              ...this.roundDebug(candidate),
              sourceType,
              economicSimilarity: decision.economicSimilarity,
              highRisk: Boolean(decision.highRiskEconomicSimilarity),
            }
          );
        }
        const feedEligibility = this.feedRoundEligibility(candidate, decision);
        if (feedEligibility.allowed) {
          result.feedRoundsWouldCreate += 1;
          sourceSummary.feedRoundsWouldCreate += 1;
          this.pushDebug(debug, result.debugExamples?.feedRoundsWouldCreate, {
            ...this.roundDebug(candidate),
            feedExternalId: candidate.feedExternalId,
            sourceFeed: candidate.sourceFeed,
          });
          if (context.write && context.writeMode === "feed-rounds") {
            const lockReady = await this.ensureSourceLockForWrite(
              candidate,
              sourceSummary,
              context,
              false
            );
            if (!lockReady) return;
            const written = await this.writeFeedRound(candidate);
            if (written?.created) result.feedRoundsCreated += 1;
            if (written?.created) sourceSummary.feedRoundsCreated += 1;
            if (written?.doc) {
              participantDecision = {
                decision: "matched_by_source_id",
                existingRound: written.doc,
              };
            }
          } else if (context.writeMode === "feed-rounds") {
            participantDecision = {
              ...decision,
              feedRoundWouldCreate: true,
            };
          }
        } else if (
          context.write &&
          context.writeMode === "feed-rounds" &&
          feedEligibility.reason === "ECONOMIC_SIMILARITY_REVIEW"
        ) {
          await this.recordReview(context, {
            reason: "ECONOMIC_SIMILARITY_REVIEW",
            sourceType,
            identity,
            canonicalProjectId: resolved.canonicalProjectId,
            projectKey: candidate.feedExternalId || candidate.roundKey,
            round: candidate,
            economicSimilarity: decision.economicSimilarity,
          });
          this.recordSkipped(result, "ECONOMIC_SIMILARITY_REVIEW", 1, {
            sourceType,
            project: candidate.projectLabel,
            round: candidate.roundName,
            feedExternalId: candidate.feedExternalId,
          });
        } else if (context.write && context.writeMode === "feed-rounds") {
          this.recordSkipped(
            result,
            feedEligibility.reason || "feed_round_not_safe",
            1,
            {
              sourceType,
              project: candidate.projectLabel,
              round: candidate.roundName,
              feedExternalId: candidate.feedExternalId,
            }
          );
        }
      } else {
        this.recordExistingRoundDecision(
          result,
          sourceSummary,
          candidate,
          decision,
          debug
        );
        this.recordRoundEnrichment(
          result,
          candidate,
          decision.existingRound,
          debug
        );
      }

      const participants = this.participantsFromRow(row, result);
      if (!participants.length) return;

      for (const participant of participants) {
        await this.processParticipant(
          participant,
          candidate,
          participantDecision,
          sourceSummary,
          context
        );
      }
    } catch (error: any) {
      result.errors.push({
        sourceType,
        sourceDocumentId,
        key: row?.key,
        project: row?.project,
        round: row?.round,
        message: error?.message || String(error),
      });
    }
  }

  private async processParticipant(
    participant: ParticipantIdentity,
    round: IntelRoundCandidate,
    roundDecision: ExistingRoundDecision,
    sourceSummary: IntelFundraisingGapFillBySourceSummary,
    context: IntelGapFillContext
  ): Promise<void> {
    const { result, debug } = context;
    result.participantsFound += 1;
    sourceSummary.participantsFound += 1;
    if (roundDecision.existingRound?._id) {
      result.participantsForMatchedRounds += 1;
    } else {
      result.participantsForNewRoundCandidates += 1;
    }

    const backerResolution = await this.resolveBacker(
      participant,
      round.sourceType
    );
    if (backerResolution.status === "missing") {
      result.backersMissing += 1;
      result.participantsSkipped += 1;
      result.participantsSkippedMissingBacker += 1;
      this.recordSkipped(result, "MISSING_BACKER", 1, {
        project: round.projectLabel,
        round: round.roundName,
        backerName: participant.backerName,
        normalizedBackerName: participant.normalizedBackerName,
      });
      this.pushDebug(debug, result.debugExamples?.backersMissing, {
        project: round.projectLabel,
        round: round.roundName,
        backerName: participant.backerName,
        normalizedBackerName: participant.normalizedBackerName,
      });
      await this.simulateBackerCandidate(participant, round, context);
      return;
    }

    if (backerResolution.status === "ambiguous") {
      result.backersAmbiguous += 1;
      result.participantsSkipped += 1;
      result.participantsSkippedAmbiguousBacker += 1;
      this.recordSkipped(result, "BACKER_AMBIGUOUS", 1, {
        project: round.projectLabel,
        round: round.roundName,
        backerName: participant.backerName,
        normalizedBackerName: participant.normalizedBackerName,
      });
      this.pushDebug(debug, result.debugExamples?.backersAmbiguous, {
        project: round.projectLabel,
        round: round.roundName,
        backerName: participant.backerName,
        normalizedBackerName: participant.normalizedBackerName,
        candidates: (backerResolution.candidates || []).map((candidate) => ({
          backerId: this.toIdString(candidate._id),
          name: candidate.name,
          normalizedName: candidate.normalizedName,
        })),
      });
      await this.recordReview(context, {
        reason: "BACKER_AMBIGUOUS",
        sourceType: round.sourceType,
        identity: round.projectIdentity,
        canonicalProjectId: round.canonicalProjectId,
        projectKey: round.feedExternalId || round.roundKey,
        participant,
        round,
        backerCandidates: backerResolution.candidates,
      });
      return;
    }

    result.backersResolved += 1;
    sourceSummary.backersResolved += 1;

    const existingRoundId = this.toObjectId(roundDecision.existingRound?._id);
    if (!existingRoundId) {
      result.newParticipantsForNewRoundCandidates += 1;
      if (
        context.writeMode === "feed-rounds" &&
        roundDecision.feedRoundWouldCreate
      ) {
        result.participantsWouldCreate += 1;
        sourceSummary.participantsWouldCreate += 1;
      }
      return;
    }

    const existingParticipant = await this.participantModel
      .findOne({
        fundingRoundId: existingRoundId,
        backerId: backerResolution.backerId,
      })
      .lean();

    if (!existingParticipant) {
      result.newParticipantsForExistingRounds += 1;
      sourceSummary.newParticipantsForExistingRounds += 1;
      result.participantsWouldCreate += 1;
      sourceSummary.participantsWouldCreate += 1;
      if (
        context.write &&
        (context.writeMode === "participants-only" ||
          context.writeMode === "feed-rounds")
      ) {
        const lockReady = await this.ensureSourceLockForWrite(
          round,
          sourceSummary,
          context,
          true
        );
        if (!lockReady) return;
        const written = await this.writeParticipant(
          participant,
          round,
          existingRoundId,
          backerResolution
        );
        if (written?.created) {
          result.participantsCreated += 1;
          sourceSummary.participantsCreated += 1;
        }
      }
      if (
        debug &&
        result.debugExamples?.newParticipantsForExistingRounds &&
        result.debugExamples.newParticipantsForExistingRounds.length <
          DEBUG_LIMIT
      ) {
        const existingParticipantsCount =
          await this.participantModel.countDocuments({
            fundingRoundId: existingRoundId,
          });
        result.debugExamples.newParticipantsForExistingRounds.push({
          project: round.projectLabel,
          round: round.roundName,
          existingRound: {
            fundingRoundId: this.toIdString(existingRoundId),
            roundName:
              roundDecision.existingRound?.roundName ||
              roundDecision.existingRound?.normalizedRoundName,
            normalizedRoundType:
              roundDecision.existingRound?.normalizedRoundType,
            dateBucket: roundDecision.existingRound?.dateBucket,
            raisedAmount: roundDecision.existingRound?.raisedAmount,
            sourceId: roundDecision.existingRound?.sourceId,
            matchedBy: roundDecision.decision,
          },
          existingParticipantsCount,
          candidateInvestor: {
            backerName: participant.backerName,
            normalizedBackerName: participant.normalizedBackerName,
            sourceBackerId: participant.sourceBackerId,
            sourceBackerSlug: participant.sourceBackerSlug,
            sourceBackerUrl: participant.sourceBackerUrl,
          },
          resolvedBacker: {
            backerId: this.toIdString(backerResolution.backerId),
            matchedBy: backerResolution.matchedBy,
            name: backerResolution.backer?.name,
            normalizedName: backerResolution.backer?.normalizedName,
          },
          whyParticipantConsideredNew:
            "No funding_round_participants row exists for existing fundingRoundId + resolved backerId.",
          matchCriteria: {
            fundingRoundId: this.toIdString(existingRoundId),
            backerId: this.toIdString(backerResolution.backerId),
          },
        });
      }
      return;
    }

    result.participantsMatchedExisting += 1;
    const participantEnrichmentFields = this.participantEnrichmentFields(
      participant,
      existingParticipant
    );
    if (participantEnrichmentFields.length) {
      result.participantEnrichmentCandidates += 1;
      for (const field of participantEnrichmentFields) {
        this.increment(result.participantFieldsWouldEnrich, field);
      }
    }
  }

  private normalizeRound(
    row: Record<string, any>,
    identity: ProjectIdentity,
    canonicalProjectId: Types.ObjectId,
    sourceType: string
  ): IntelRoundCandidate | null {
    const roundName = cleanFundingString(
      row.round ||
        row.roundName ||
        row.stage ||
        row.raw?.stage ||
        "Funding Round"
    );
    const roundType = normalizeFundingRoundType(row.round || row.raw?.stage);
    const normalizedRoundType = cleanFundingString(roundType) || "unknown";
    const hasRoundStage = Boolean(
      cleanFundingString(
        row.round || row.roundName || row.stage || row.raw?.stage
      )
    );
    const normalizedRoundName =
      cleanFundingString(row.normalizedRoundName) ||
      normalizeFundingName(roundName);
    const announcedDate = this.toIntelFundingDate(
      row.date || row.announcedDate || row.raw?.announceDate
    );
    const dateBucket = fundingDateBucket(
      announcedDate,
      row.dateBucket || row.date || row.raw?.announceDate
    );
    const raisedAmount = this.firstNumber(row.amount, row.raw?.fundsRaised);
    const valuation = this.firstNumber(row.valuation, row.raw?.preValuation);
    const tokenPrice = this.firstNumber(row.tokenPrice, row.raw?.tokenPrice);
    const feedExternalId = cleanFundingString(
      row.externalId || row.raw?.saleId
    );
    const sourceId = feedExternalId;
    const sourceUrl = identity.sourceUrl;
    const rawInvestors = this.arrayValue(row.raw?.investors);
    const rawLeadInvestors = this.arrayValue(row.raw?.leadInvestors);
    const topLevelInvestors = this.arrayValue(row.investors);
    const rawVentureCapitals = this.arrayValue(row.raw?.ventureCapitals);
    const projectKey = this.projectKey(identity);
    const roundKey = this.buildRoundKey({
      sourceType,
      projectKey,
      normalizedRoundType,
      normalizedRoundName,
      dateBucket,
      raisedAmount,
      sourceId,
    });
    const sourceRefs = [
      {
        source: sourceType,
        sourceId,
        sourceSlug: identity.sourceSlug,
        sourceUrl,
        sourcePath: `${INTEL_FUNDRAISING_COLLECTION}.${this.toIdString(
          row._id
        )}`,
        confidence: "high",
        metadata: {
          originFeed: INTEL_FUNDRAISING_COLLECTION,
          feedOnly: true,
          feedExternalId,
          sourceCollection: INTEL_FUNDRAISING_COLLECTION,
          sourceDocumentId: this.toIdString(row._id),
          key: row.key,
          externalId: feedExternalId,
          projectKey: row.project_key || row.raw?.slug,
          tableFilter: row.tableFilter || row.filter || row.raw?.tableFilter,
          hiddenInvestorsIncluded:
            rawInvestors.length > topLevelInvestors.length,
          visibleInvestorsCount: topLevelInvestors.length,
          rawInvestorsCount: rawInvestors.length,
          rawLeadInvestorsCount: rawLeadInvestors.length,
          rawVentureCapitalsCount: rawVentureCapitals.length,
        },
      },
    ].filter((item) => item.source);
    const canonicalFingerprint = buildFundingRoundFingerprint({
      canonicalProjectId,
      roundType,
      normalizedRoundType,
      roundName,
      normalizedRoundName,
      announcedDate,
      dateBucket,
      raisedAmount,
      valuation,
      tokenPrice,
      sourceRefs: sourceRefs as any,
      primarySource: sourceType,
      sourceId,
    });

    return {
      canonicalProjectId,
      sourceDocumentId: this.toIdString(row._id),
      sourceType,
      sourceFeed: INTEL_FUNDRAISING_SOURCE_FEED,
      feedExternalId,
      sourceRow: row,
      projectIdentity: identity,
      projectLabel: this.projectLabel(identity),
      roundName,
      normalizedRoundName,
      roundType,
      normalizedRoundType,
      hasRoundStage,
      announcedDate,
      dateBucket,
      raisedAmount,
      raisedCurrency: raisedAmount === undefined ? undefined : "USD",
      valuation,
      tokenPrice,
      primarySource: sourceType,
      sourceId,
      sourceUrl,
      importMode: "gap_fill_round_candidate",
      isFeedOnly: true,
      sourceRefs,
      status: normalizeFundingRoundStatus(row.status || "proposed"),
      roundKey,
      canonicalFingerprint,
    };
  }

  private async findExistingRound(
    candidate: IntelRoundCandidate
  ): Promise<ExistingRoundDecision> {
    const byFingerprint = await this.findSourceScopedRound(
      { canonicalFingerprint: candidate.canonicalFingerprint },
      candidate.sourceType
    );
    if (byFingerprint) {
      return {
        decision: "matched_by_fingerprint",
        existingRound: byFingerprint,
      };
    }

    if (candidate.sourceId) {
      const bySourceId = await this.findSourceScopedRound(
        {
          canonicalProjectId: candidate.canonicalProjectId,
          sourceId: candidate.sourceId,
        },
        candidate.sourceType
      );
      if (bySourceId) {
        return {
          decision: "matched_by_source_id",
          existingRound: bySourceId,
        };
      }
    }

    const byRoundKey = await this.findSourceScopedRound(
      {
        canonicalProjectId: candidate.canonicalProjectId,
        roundKey: candidate.roundKey,
      },
      candidate.sourceType
    );
    if (byRoundKey) {
      return {
        decision: "matched_by_round_key",
        existingRound: byRoundKey,
      };
    }

    if (candidate.announcedDate && candidate.normalizedRoundType) {
      const byTypeDate = await this.findSourceScopedRound(
        {
          canonicalProjectId: candidate.canonicalProjectId,
          normalizedRoundType: candidate.normalizedRoundType,
          announcedDate: candidate.announcedDate,
        },
        candidate.sourceType
      );
      if (byTypeDate) {
        return {
          decision: "matched_by_type_date",
          existingRound: byTypeDate,
        };
      }
    }

    const economicSimilarity = await this.findEconomicSimilarity(candidate);
    return {
      decision: "new_round_candidate",
      economicSimilarity,
      highRiskEconomicSimilarity: Boolean(economicSimilarity?.highRisk),
    };
  }

  private async findSourceScopedRound(
    identityFilter: Record<string, any>,
    sourceType: string
  ): Promise<Record<string, any> | null> {
    const row = await this.fundingRoundModel
      .findOne({
        ...identityFilter,
        ...this.roundSourceScope(sourceType),
      })
      .lean();
    return row && this.roundMatchesSource(row, sourceType) ? row : null;
  }

  private roundSourceScope(sourceType: string): Record<string, any> {
    const sourcePattern = projectSourceTypeMongoPattern(sourceType);
    return {
      $or: [
        { primarySource: sourcePattern },
        {
          primarySource: { $in: [null, ""] },
          sourceType: sourcePattern,
        },
        {
          primarySource: { $in: [null, ""] },
          sourceType: { $in: [null, ""] },
          "sourceRefs.source": sourcePattern,
        },
      ],
    };
  }

  private roundMatchesSource(
    round: Record<string, any>,
    sourceType: string
  ): boolean {
    const expected = normalizeProjectSourceType(sourceType);
    const primarySource = normalizeProjectSourceType(round?.primarySource);
    if (primarySource) return primarySource === expected;
    const persistedSourceType = normalizeProjectSourceType(round?.sourceType);
    if (persistedSourceType) return persistedSourceType === expected;
    const refSources = this.uniqueStrings(
      this.arrayValue(round?.sourceRefs).map((ref) =>
        normalizeProjectSourceType(ref?.source || ref?.sourceType)
      )
    );
    return (
      refSources.length > 0 && refSources.every((value) => value === expected)
    );
  }

  private async findEconomicSimilarity(
    candidate: IntelRoundCandidate
  ): Promise<Record<string, any> | undefined> {
    if (!candidate.dateBucket && candidate.raisedAmount === undefined) {
      return undefined;
    }

    const clauses: Array<Record<string, any>> = [];
    if (candidate.dateBucket && candidate.raisedAmount !== undefined) {
      clauses.push({
        dateBucket: candidate.dateBucket,
        raisedAmount: candidate.raisedAmount,
      });
    }
    if (candidate.dateBucket && candidate.normalizedRoundName) {
      clauses.push({
        dateBucket: candidate.dateBucket,
        normalizedRoundName: candidate.normalizedRoundName,
      });
    }
    if (!clauses.length) return undefined;

    const rows = await this.fundingRoundModel
      .find({
        canonicalProjectId: candidate.canonicalProjectId,
        $or: clauses,
      })
      .select({
        _id: 1,
        roundName: 1,
        normalizedRoundName: 1,
        normalizedRoundType: 1,
        dateBucket: 1,
        raisedAmount: 1,
        valuation: 1,
        tokenPrice: 1,
        sourceId: 1,
      })
      .limit(5)
      .lean();

    if (!rows.length) return undefined;
    const highRiskRows = rows.filter((row) =>
      this.isHighRiskEconomicSimilarity(candidate, row)
    );
    return {
      count: rows.length,
      highRisk: highRiskRows.length > 0,
      candidates: rows.map((row) => ({
        fundingRoundId: this.toIdString(row._id),
        roundName: row.roundName || row.normalizedRoundName,
        type: row.normalizedRoundType,
        dateBucket: row.dateBucket,
        raisedAmount: row.raisedAmount,
        valuation: row.valuation,
        tokenPrice: row.tokenPrice,
        sourceId: row.sourceId,
        highRisk: highRiskRows.some(
          (highRiskRow) =>
            this.toIdString(highRiskRow._id) === this.toIdString(row._id)
        ),
      })),
    };
  }

  private isHighRiskEconomicSimilarity(
    candidate: IntelRoundCandidate,
    existing: Record<string, any>
  ): boolean {
    const sameDateAmount =
      Boolean(
        candidate.dateBucket && candidate.dateBucket === existing.dateBucket
      ) &&
      candidate.raisedAmount !== undefined &&
      this.equalValue(candidate.raisedAmount, existing.raisedAmount);
    if (!sameDateAmount) return false;
    return Boolean(
      (candidate.valuation !== undefined &&
        this.equalValue(candidate.valuation, existing.valuation)) ||
        (candidate.tokenPrice !== undefined &&
          this.equalValue(candidate.tokenPrice, existing.tokenPrice)) ||
        (candidate.normalizedRoundName &&
          candidate.normalizedRoundName === existing.normalizedRoundName) ||
        (candidate.normalizedRoundType &&
          candidate.normalizedRoundType === existing.normalizedRoundType)
    );
  }

  private feedRoundEligibility(
    candidate: IntelRoundCandidate,
    decision: ExistingRoundDecision
  ): { allowed: boolean; reason?: string } {
    if (decision.decision !== "new_round_candidate") {
      return { allowed: false, reason: "not_new_round_candidate" };
    }
    if (decision.highRiskEconomicSimilarity) {
      return { allowed: false, reason: "ECONOMIC_SIMILARITY_REVIEW" };
    }
    if (!candidate.feedExternalId) {
      return { allowed: false, reason: "MISSING_FEED_EXTERNAL_ID" };
    }
    if (!candidate.announcedDate && !candidate.dateBucket) {
      return { allowed: false, reason: "MISSING_ROUND_DATE" };
    }
    if (
      !candidate.hasRoundStage ||
      candidate.normalizedRoundType === "unknown"
    ) {
      return { allowed: false, reason: "MISSING_ROUND_STAGE" };
    }
    return { allowed: true };
  }

  private async ensureSourceLockForWrite(
    round: IntelRoundCandidate,
    sourceSummary: IntelFundraisingGapFillBySourceSummary,
    context: IntelGapFillContext,
    requireExisting: boolean
  ): Promise<boolean> {
    if (requireExisting) {
      const existingLock = await this.projectDomainSourceModel
        .findOne({
          canonicalProjectId: round.canonicalProjectId,
          domain: "funding",
        })
        .lean();
      if (
        !existingLock ||
        this.normalizeOptionalSourceType(existingLock.selectedSourceType) !==
          round.sourceType
      ) {
        context.result.sourceConflicts += 1;
        sourceSummary.sourceConflicts += 1;
        this.recordSkipped(
          context.result,
          existingLock ? "source_conflict" : "missing_source_lock",
          1,
          {
            sourceType: round.sourceType,
            selectedSourceType: existingLock?.selectedSourceType,
            project: round.projectLabel,
            canonicalProjectId: this.toIdString(round.canonicalProjectId),
          }
        );
        await this.recordReview(context, {
          reason: "SOURCE_CONFLICT",
          sourceType: round.sourceType,
          identity: round.projectIdentity,
          canonicalProjectId: round.canonicalProjectId,
          currentSourceType: existingLock?.selectedSourceType,
          round,
        });
        return false;
      }
    }

    const lockResult = await this.projectDomainSourceService.ensureLock({
      canonicalProjectId: round.canonicalProjectId,
      domain: "funding",
      sourceType: round.sourceType,
      reason: "intel_fundraising_gap_fill",
      metadata: {
        importer: "fomo-v2:intel-fundraising-gap-fill",
        sourceCollection: INTEL_FUNDRAISING_COLLECTION,
        sourceDocumentId: round.sourceDocumentId,
        sourceProjectId: round.projectIdentity.sourceProjectId,
        sourceSlug: round.projectIdentity.sourceSlug,
        feedExternalId: round.feedExternalId,
        writeMode: context.writeMode,
      },
    });
    if (lockResult.allowed) {
      if (lockResult.action === "created_lock") {
        context.result.sourceLocksCreated += 1;
      }
      return true;
    }

    context.result.sourceConflicts += 1;
    sourceSummary.sourceConflicts += 1;
    this.recordSkipped(context.result, "source_conflict", 1, {
      sourceType: round.sourceType,
      selectedSourceType: lockResult.currentSourceType,
      project: round.projectLabel,
      canonicalProjectId: this.toIdString(round.canonicalProjectId),
    });
    await this.recordReview(context, {
      reason: "SOURCE_CONFLICT",
      sourceType: round.sourceType,
      identity: round.projectIdentity,
      canonicalProjectId: round.canonicalProjectId,
      currentSourceType: lockResult.currentSourceType,
      round,
    });
    return false;
  }

  private async writeFeedRound(
    candidate: IntelRoundCandidate
  ): Promise<{ doc?: Record<string, any>; created: boolean } | undefined> {
    const metadata = this.feedRoundMetadata(candidate);
    const written = await this.fundingService.upsertFundingRound({
      canonicalProjectId: candidate.canonicalProjectId,
      roundKey: candidate.roundKey,
      roundName: candidate.roundName,
      normalizedRoundName: candidate.normalizedRoundName,
      roundType: candidate.roundType,
      normalizedRoundType: candidate.normalizedRoundType,
      status: candidate.status,
      announcedDate: candidate.announcedDate,
      date: candidate.announcedDate,
      dateBucket: candidate.dateBucket,
      raisedAmount: candidate.raisedAmount,
      raisedCurrency: candidate.raisedCurrency,
      valuation: candidate.valuation,
      tokenPrice: candidate.tokenPrice,
      primarySource: candidate.primarySource,
      sourceType: candidate.sourceType,
      sourceId: candidate.sourceId,
      sourceSlug: candidate.projectIdentity.sourceSlug,
      sourceUrl: candidate.sourceUrl,
      sourceRefs: candidate.sourceRefs as any,
      canonicalFingerprint: candidate.canonicalFingerprint,
      confidence: "high",
      isFeedOnly: true,
      sourceFeed: candidate.sourceFeed,
      feedExternalId: candidate.feedExternalId,
      importMode: candidate.importMode || "gap_fill_round_candidate",
      provenance: {
        originFeed: INTEL_FUNDRAISING_COLLECTION,
        importMode: "gap_fill_round_candidate",
      },
      metadata,
    });
    return { doc: written.doc as any, created: Boolean(written.created) };
  }

  private async writeParticipant(
    participant: ParticipantIdentity,
    round: IntelRoundCandidate,
    fundingRoundId: Types.ObjectId,
    backerResolution: BackerResolution
  ): Promise<{ doc?: Record<string, any>; created: boolean } | undefined> {
    if (!backerResolution.backerId) return undefined;
    const role = normalizeFundingParticipantRole(undefined, participant.isLead);
    const sourceBackerRef =
      participant.sourceBackerId ||
      participant.sourceBackerSlug ||
      participant.sourceBackerUrl ||
      participant.normalizedBackerName;
    const sourceRefs = [
      {
        source: round.sourceType,
        sourceId: round.feedExternalId,
        sourceSlug: round.projectIdentity.sourceSlug,
        sourceUrl: round.sourceUrl,
        sourcePath: `${INTEL_FUNDRAISING_COLLECTION}.${round.sourceDocumentId}.raw.investors`,
        confidence: "high",
        metadata: {
          originFeed: INTEL_FUNDRAISING_COLLECTION,
          feedExternalId: round.feedExternalId,
          sourceCollection: INTEL_FUNDRAISING_COLLECTION,
          sourceDocumentId: round.sourceDocumentId,
          participantSource: "raw.investors/raw.leadInvestors",
          sourceBackerId: participant.sourceBackerId,
          sourceBackerSlug: participant.sourceBackerSlug,
        },
      },
    ];
    const canonicalFingerprint = buildFundingRoundParticipantFingerprint({
      canonicalProjectId: round.canonicalProjectId,
      fundingRoundId,
      backerId: backerResolution.backerId,
      backerName: participant.backerName,
      normalizedBackerName: participant.normalizedBackerName,
      sourceBackerRef,
      sourceBackerId: participant.sourceBackerId,
      role,
    });
    const written = await this.fundingService.upsertFundingRoundParticipant({
      canonicalProjectId: round.canonicalProjectId,
      fundingRoundId,
      backerId: backerResolution.backerId,
      backerName: participant.backerName || backerResolution.backer?.name,
      normalizedBackerName:
        participant.normalizedBackerName ||
        backerResolution.backer?.normalizedName,
      sourceBackerRef,
      sourceBackerId: participant.sourceBackerId,
      sourceBackerSlug: participant.sourceBackerSlug,
      sourceBackerUrl: participant.sourceBackerUrl,
      role,
      isLead: participant.isLead,
      status: "proposed",
      primarySource: round.sourceType,
      sourceRefs: sourceRefs as any,
      confidence: "high",
      canonicalFingerprint,
      metadata: {
        originFeed: INTEL_FUNDRAISING_COLLECTION,
        feedOnly: Boolean(round.isFeedOnly),
        feedExternalId: round.feedExternalId,
        importMode: round.importMode || "gap_fill_round_candidate",
      },
    });
    return { doc: written.doc as any, created: Boolean(written.created) };
  }

  private feedRoundMetadata(
    candidate: IntelRoundCandidate
  ): Record<string, any> {
    const raw = candidate.sourceRow?.raw || {};
    const visibleInvestorsCount = this.arrayValue(
      candidate.sourceRow?.investors
    ).length;
    const rawInvestorsCount = this.arrayValue(raw.investors).length;
    const rawLeadInvestorsCount = this.arrayValue(raw.leadInvestors).length;
    const rawVentureCapitalsCount = this.arrayValue(raw.ventureCapitals).length;
    return {
      originFeed: INTEL_FUNDRAISING_COLLECTION,
      sourceCollection: INTEL_FUNDRAISING_COLLECTION,
      sourceDocumentId: candidate.sourceDocumentId,
      sourceType: candidate.sourceType,
      sourceFeed: candidate.sourceFeed,
      feedOnly: true,
      feedExternalId: candidate.feedExternalId,
      importMode: candidate.importMode || "gap_fill_round_candidate",
      tableFilter:
        candidate.sourceRow?.tableFilter ||
        candidate.sourceRow?.filter ||
        raw.tableFilter,
      hiddenInvestorsIncluded: rawInvestorsCount > visibleInvestorsCount,
      visibleInvestorsCount,
      rawInvestorsCount,
      rawLeadInvestorsCount,
      rawVentureCapitalsCount,
    };
  }

  private async simulateProjectCandidate(
    identity: ProjectIdentity,
    sourceType: string,
    context: IntelGapFillContext
  ): Promise<void> {
    await this.recordImportCandidate(
      {
        domain: "funding",
        entityType: "project",
        sourceType,
        sourceId: identity.sourceProjectId || identity.sourceId,
        sourceSlug: identity.sourceSlug,
        sourceUrl: identity.sourceUrl,
        sourcePath: identity.sourcePath,
        name: identity.name,
        symbol: identity.symbol,
        slug: identity.sourceSlug,
        normalizedName: identity.normalizedName,
        normalizedSymbol: identity.normalizedSymbol,
        normalizedSlug: identity.sourceSlug,
        payload: {
          sourceDocumentId: identity.sourceDocumentId,
          sourceProjectId: identity.sourceProjectId,
          sourceSlug: identity.sourceSlug,
          name: identity.name,
          symbol: identity.symbol,
        },
        normalizedPayload: {
          normalizedName: identity.normalizedName,
          normalizedSymbol: identity.normalizedSymbol,
          normalizedSlug: identity.sourceSlug,
        },
      },
      "project",
      context
    );
  }

  private async simulateBackerCandidate(
    participant: ParticipantIdentity,
    round: IntelRoundCandidate,
    context: IntelGapFillContext
  ): Promise<void> {
    await this.recordImportCandidate(
      {
        domain: "funding",
        entityType: "backer",
        sourceType: round.sourceType,
        sourceId: participant.sourceBackerId,
        sourceSlug: participant.sourceBackerSlug,
        sourceUrl: participant.sourceBackerUrl,
        sourcePath: `${INTEL_FUNDRAISING_COLLECTION}.${round.sourceDocumentId}.raw.investors`,
        name: participant.backerName,
        normalizedName: participant.normalizedBackerName,
        payload: {
          project: round.projectLabel,
          round: round.roundName,
          feedExternalId: round.feedExternalId,
          backerName: participant.backerName,
          sourceBackerId: participant.sourceBackerId,
          sourceBackerSlug: participant.sourceBackerSlug,
          sourceBackerUrl: participant.sourceBackerUrl,
        },
        normalizedPayload: {
          normalizedBackerName: participant.normalizedBackerName,
        },
      },
      "backer",
      context
    );
  }

  private async recordImportCandidate(
    candidate: FomoV2ImportCandidateInput,
    entityType: "project" | "backer",
    context: IntelGapFillContext
  ): Promise<void> {
    const candidateFingerprint = buildImportCandidateFingerprint(candidate);
    if (context.seenCandidateFingerprints.has(candidateFingerprint)) return;
    context.seenCandidateFingerprints.add(candidateFingerprint);

    if (context.write) {
      const written = await this.importCandidateService.createOrUpdateCandidate(
        {
          ...candidate,
          candidateFingerprint,
          metadata: {
            ...(candidate.metadata || {}),
            importer: "fomo-v2:intel-fundraising-gap-fill",
            sourceCollection: INTEL_FUNDRAISING_COLLECTION,
            dryRunOnly: false,
            writeMode: context.writeMode,
          },
        }
      );
      this.recordCandidateAction(context.result, entityType, written.created);
      this.pushCandidateDebug(
        context,
        entityType,
        written.created ? "create" : "update",
        candidate,
        candidateFingerprint
      );
      return;
    }

    const existing = await this.importCandidateModel
      .findOne({ candidateFingerprint })
      .lean();
    this.recordCandidateWouldAction(context.result, entityType, !existing);
    this.pushCandidateDebug(
      context,
      entityType,
      existing ? "update" : "create",
      candidate,
      candidateFingerprint
    );
  }

  private recordCandidateAction(
    result: IntelFundraisingGapFillDryRunResult,
    entityType: "project" | "backer",
    created: boolean
  ): void {
    if (entityType === "project") {
      if (created) result.projectCandidatesCreated += 1;
      else result.projectCandidatesUpdated += 1;
      return;
    }
    if (created) result.backerCandidatesCreated += 1;
    else result.backerCandidatesUpdated += 1;
  }

  private recordCandidateWouldAction(
    result: IntelFundraisingGapFillDryRunResult,
    entityType: "project" | "backer",
    wouldCreate: boolean
  ): void {
    if (entityType === "project") {
      if (wouldCreate) result.projectCandidatesWouldCreate += 1;
      else result.projectCandidatesWouldUpdate += 1;
      return;
    }
    if (wouldCreate) result.backerCandidatesWouldCreate += 1;
    else result.backerCandidatesWouldUpdate += 1;
  }

  private pushCandidateDebug(
    context: IntelGapFillContext,
    entityType: "project" | "backer",
    action: "create" | "update",
    candidate: FomoV2ImportCandidateInput,
    candidateFingerprint: string
  ): void {
    const target =
      entityType === "project"
        ? context.result.debugExamples?.projectCandidates
        : context.result.debugExamples?.backerCandidates;
    this.pushDebug(context.debug, target, {
      action,
      candidateFingerprint,
      sourceType: candidate.sourceType,
      name: candidate.name,
      symbol: candidate.symbol,
      sourceId: candidate.sourceId,
      sourceSlug: candidate.sourceSlug,
      normalizedName: candidate.normalizedName,
      normalizedSymbol: candidate.normalizedSymbol,
      normalizedSlug: candidate.normalizedSlug,
    });
  }

  private async recordReview(
    context: IntelGapFillContext,
    input: {
      reason: string;
      sourceType: string;
      identity: ProjectIdentity;
      canonicalProjectId?: Types.ObjectId | string;
      currentSourceType?: string;
      projectKey?: string;
      participant?: ParticipantIdentity;
      round?: IntelRoundCandidate;
      economicSimilarity?: Record<string, any>;
      backerCandidates?: Array<Record<string, any>>;
    }
  ): Promise<void> {
    const result = context.result;
    result.reviewsByReason[input.reason] =
      (result.reviewsByReason[input.reason] || 0) + 1;
    const projectKey =
      input.projectKey ||
      input.identity.sourceProjectId ||
      input.identity.sourceId ||
      input.identity.sourceSlug ||
      input.identity.sourceDocumentId;
    const fingerprint = this.reviewFingerprint({
      ...input,
      projectKey,
    });
    if (context.seenReviewFingerprints.has(fingerprint)) return;
    context.seenReviewFingerprints.add(fingerprint);

    const candidates = this.reviewCandidates(input);
    if (context.write) {
      const written = await this.writeReview(
        input,
        fingerprint,
        projectKey,
        candidates
      );
      if (written?.created) result.reviewsCreated += 1;
      else result.reviewsUpdated += 1;
      this.pushReviewDebug(
        context,
        input,
        fingerprint,
        written?.created ? "create" : "update"
      );
      return;
    }

    const existing = await this.reviewBatchModel
      .findOne({ fingerprint, status: "open" })
      .lean();
    if (existing) result.reviewsWouldUpdate += 1;
    else result.reviewsWouldCreate += 1;
    this.pushReviewDebug(
      context,
      input,
      fingerprint,
      existing ? "update" : "create"
    );
  }

  private async writeReview(
    input: {
      reason: string;
      sourceType: string;
      identity: ProjectIdentity;
      canonicalProjectId?: Types.ObjectId | string;
      currentSourceType?: string;
      projectKey?: string;
      participant?: ParticipantIdentity;
      round?: IntelRoundCandidate;
      economicSimilarity?: Record<string, any>;
    },
    fingerprint: string,
    projectKey: string | undefined,
    candidates: FomoV2ReviewCandidateInput[]
  ): Promise<{ created: boolean } | undefined> {
    const metadata = {
      importer: "fomo-v2:intel-fundraising-gap-fill",
      sourceCollection: INTEL_FUNDRAISING_COLLECTION,
      sourceDocumentId: input.identity.sourceDocumentId,
      sourceProjectId:
        input.identity.sourceProjectId || input.identity.sourceId,
      sourceSlug: input.identity.sourceSlug,
      feedExternalId: input.round?.feedExternalId,
      dryRunOnly: false,
    };

    if (
      input.reason === "SOURCE_CONFLICT" &&
      input.canonicalProjectId &&
      input.currentSourceType
    ) {
      return this.reviewService.createSourceConflictReview({
        canonicalProjectId: input.canonicalProjectId,
        domain: "funding",
        currentSourceType: input.currentSourceType,
        incomingSourceType: input.sourceType,
        affectedEntityTypes: ["funding_round", "funding_round_participant"],
        candidates,
        metadata,
      });
    }

    if (input.reason === "MISSING_CANONICAL_PROJECT") {
      return this.reviewService.createMissingCanonicalProjectReview({
        domain: "funding",
        incomingSourceType: input.sourceType,
        projectKey,
        projectName: input.identity.name,
        normalizedProjectName: input.identity.normalizedName,
        affectedEntityTypes: ["funding_round"],
        candidates,
        metadata,
      });
    }

    return this.reviewService.createOrUpdateBatch({
      domain: "funding",
      reason: input.reason,
      canonicalProjectId: input.canonicalProjectId,
      projectKey,
      projectName: input.identity.name,
      normalizedProjectName: input.identity.normalizedName,
      currentSourceType: input.currentSourceType,
      incomingSourceType: input.sourceType,
      affectedEntityTypes: this.reviewAffectedEntityTypes(input.reason),
      candidates,
      candidateCount: candidates.length,
      fingerprint,
      metadata,
    });
  }

  private reviewCandidates(input: {
    reason: string;
    sourceType: string;
    identity: ProjectIdentity;
    participant?: ParticipantIdentity;
    round?: IntelRoundCandidate;
    economicSimilarity?: Record<string, any>;
    backerCandidates?: Array<Record<string, any>>;
  }): FomoV2ReviewCandidateInput[] {
    const candidates: FomoV2ReviewCandidateInput[] = [
      {
        entityType: "project",
        sourceType: input.sourceType,
        sourceId: input.identity.sourceProjectId || input.identity.sourceId,
        sourcePath: input.identity.sourcePath,
        sourceUrl: input.identity.sourceUrl,
        payload: {
          reason: input.reason,
          sourceProjectId: input.identity.sourceProjectId,
          sourceSlug: input.identity.sourceSlug,
          name: input.identity.name,
          symbol: input.identity.symbol,
        },
        normalizedPayload: {
          normalizedName: input.identity.normalizedName,
          normalizedSymbol: input.identity.normalizedSymbol,
          normalizedSlug: input.identity.sourceSlug,
        },
      },
    ];
    if (input.round) {
      candidates.push({
        entityType: "funding_round",
        sourceType: input.sourceType,
        sourceId: input.round.feedExternalId || input.round.sourceId,
        sourcePath: `${INTEL_FUNDRAISING_COLLECTION}.${input.round.sourceDocumentId}`,
        sourceUrl: input.round.sourceUrl,
        payload: {
          roundName: input.round.roundName,
          normalizedRoundType: input.round.normalizedRoundType,
          dateBucket: input.round.dateBucket,
          raisedAmount: input.round.raisedAmount,
          feedExternalId: input.round.feedExternalId,
          economicSimilarity: input.economicSimilarity,
        },
        normalizedPayload: {
          normalizedRoundName: input.round.normalizedRoundName,
          normalizedRoundType: input.round.normalizedRoundType,
        },
      });
    }
    if (input.participant) {
      candidates.push({
        entityType: "backer",
        sourceType: input.sourceType,
        sourceId: input.participant.sourceBackerId,
        sourcePath: input.round
          ? `${INTEL_FUNDRAISING_COLLECTION}.${input.round.sourceDocumentId}.raw.investors`
          : undefined,
        sourceUrl: input.participant.sourceBackerUrl,
        payload: {
          backerName: input.participant.backerName,
          normalizedBackerName: input.participant.normalizedBackerName,
          candidates: input.backerCandidates?.map((candidate) => ({
            backerId: this.toIdString(candidate._id),
            name: candidate.name,
            normalizedName: candidate.normalizedName,
          })),
        },
        normalizedPayload: {
          normalizedBackerName: input.participant.normalizedBackerName,
        },
      });
    }
    return candidates;
  }

  private reviewAffectedEntityTypes(reason: string): string[] {
    if (reason === "BACKER_AMBIGUOUS") {
      return ["funding_round_participant", "backer"];
    }
    if (reason === "POTENTIAL_PROJECT_MATCH") {
      return ["canonical_project", "funding_round"];
    }
    if (reason === "ECONOMIC_SIMILARITY_REVIEW") return ["funding_round"];
    if (reason === "SOURCE_CONFLICT") {
      return ["funding_round", "funding_round_participant"];
    }
    return ["funding_round"];
  }

  private reviewFingerprint(input: {
    reason: string;
    sourceType: string;
    identity: ProjectIdentity;
    canonicalProjectId?: Types.ObjectId | string;
    currentSourceType?: string;
    projectKey?: string;
    round?: IntelRoundCandidate;
    participant?: ParticipantIdentity;
  }): string {
    if (input.reason === "MISSING_CANONICAL_PROJECT") {
      return buildMissingCanonicalProjectReviewFingerprint({
        domain: "funding",
        incomingSourceType: input.sourceType,
        projectKey: input.projectKey,
        projectName: input.identity.name,
        normalizedProjectName: input.identity.normalizedName,
      });
    }
    if (input.reason === "SOURCE_CONFLICT") {
      return buildSourceConflictReviewFingerprint({
        canonicalProjectId: input.canonicalProjectId,
        domain: "funding",
        currentSourceType: input.currentSourceType,
        incomingSourceType: input.sourceType,
      });
    }
    return buildReviewFingerprint({
      domain: "funding",
      reason: input.reason,
      canonicalProjectId: input.canonicalProjectId,
      incomingSourceType: input.sourceType,
      projectKey:
        input.projectKey ||
        input.round?.feedExternalId ||
        input.round?.roundKey ||
        input.participant?.normalizedBackerName,
      normalizedProjectName: input.identity.normalizedName,
      projectName: input.identity.name,
    });
  }

  private pushReviewDebug(
    context: IntelGapFillContext,
    input: { reason: string; sourceType: string; round?: IntelRoundCandidate },
    fingerprint: string,
    action: "create" | "update"
  ): void {
    this.pushDebug(context.debug, context.result.debugExamples?.reviews, {
      action,
      reason: input.reason,
      sourceType: input.sourceType,
      fingerprint,
      round: input.round ? this.roundDebug(input.round) : undefined,
    });
  }

  private recordExistingRoundDecision(
    result: IntelFundraisingGapFillDryRunResult,
    sourceSummary: IntelFundraisingGapFillBySourceSummary,
    candidate: IntelRoundCandidate,
    decision: ExistingRoundDecision,
    debug = false
  ): void {
    result.matchedExistingRounds += 1;
    sourceSummary.matchedExistingRounds += 1;
    if (decision.decision === "matched_by_fingerprint")
      result.matchedByFingerprint += 1;
    if (decision.decision === "matched_by_source_id")
      result.matchedBySourceId += 1;
    if (decision.decision === "matched_by_round_key")
      result.matchedByRoundKey += 1;
    if (decision.decision === "matched_by_type_date")
      result.matchedByTypeDate += 1;
    this.pushDebug(debug, result.debugExamples?.matchedExistingRounds, {
      ...this.roundDebug(candidate),
      decision: decision.decision,
      fundingRoundId: this.toIdString(decision.existingRound?._id),
    });
  }

  private recordRoundEnrichment(
    result: IntelFundraisingGapFillDryRunResult,
    candidate: IntelRoundCandidate,
    existingRound: Record<string, any> | undefined,
    debug: boolean
  ): void {
    if (!existingRound) return;
    const enrichFields: string[] = [];
    const differenceFields: string[] = [];
    this.compareField(
      "announcedDate",
      candidate.dateBucket,
      existingRound.dateBucket,
      enrichFields,
      differenceFields
    );
    this.compareField(
      "raisedAmount",
      candidate.raisedAmount,
      existingRound.raisedAmount,
      enrichFields,
      differenceFields
    );
    this.compareField(
      "valuation",
      candidate.valuation,
      existingRound.valuation,
      enrichFields,
      differenceFields
    );
    this.compareField(
      "tokenPrice",
      candidate.tokenPrice,
      existingRound.tokenPrice,
      enrichFields,
      differenceFields
    );
    if (candidate.sourceUrl && !existingRound.sourceUrl)
      enrichFields.push("sourceUrl");

    const hasIntelSourceRef = (existingRound.sourceRefs || []).some(
      (ref: any) =>
        ref?.source === candidate.sourceType &&
        ref?.metadata?.sourceCollection === INTEL_FUNDRAISING_COLLECTION
    );
    if (!hasIntelSourceRef) enrichFields.push("sourceRefs.intel_fundraising");

    if (enrichFields.length) {
      result.roundEnrichmentCandidates += 1;
      const sourceSummary = result.bySourceType[candidate.sourceType];
      if (sourceSummary) sourceSummary.roundEnrichmentCandidates += 1;
      for (const field of enrichFields)
        this.increment(result.roundFieldsWouldEnrich, field);
      this.pushDebug(debug, result.debugExamples?.roundEnrichmentCandidates, {
        ...this.roundDebug(candidate),
        fundingRoundId: this.toIdString(existingRound._id),
        enrichFields,
      });
    }

    if (differenceFields.length) {
      result.roundDifferenceSignals += 1;
      for (const field of differenceFields) {
        this.increment(result.roundFieldDifferenceSignals, field);
      }
    }
  }

  private compareField(
    field: string,
    incoming: any,
    existing: any,
    enrichFields: string[],
    differenceFields: string[]
  ): void {
    if (incoming === undefined || incoming === null || incoming === "") return;
    if (existing === undefined || existing === null || existing === "") {
      enrichFields.push(field);
      return;
    }
    if (!this.equalValue(incoming, existing)) differenceFields.push(field);
  }

  private participantEnrichmentFields(
    participant: ParticipantIdentity,
    existingParticipant: Record<string, any>
  ): string[] {
    const fields: string[] = [];
    if (participant.isLead && !existingParticipant.isLead)
      fields.push("isLead");
    if (participant.sourceBackerId && !existingParticipant.sourceBackerId)
      fields.push("sourceBackerId");
    if (participant.sourceBackerSlug && !existingParticipant.sourceBackerSlug)
      fields.push("sourceBackerSlug");
    if (participant.sourceBackerUrl && !existingParticipant.sourceBackerUrl)
      fields.push("sourceBackerUrl");
    return fields;
  }

  private async resolveCanonicalProject(
    identity: ProjectIdentity,
    sourceType: string,
    context?: Pick<IntelGapFillContext, "canonicalMarketlessOnly">
  ): Promise<ProjectResolveResult> {
    const cacheKey = [
      context?.canonicalMarketlessOnly ? "marketless" : "all",
      sourceType,
      ...this.idVariants(identity),
      ...this.slugVariants(identity),
      ...this.projectUrlVariants(identity.sourceUrl),
      ...this.sourcePathVariants(identity),
      identity.normalizedName || "",
      identity.normalizedSymbol || "",
    ].join("|");
    const cached = this.projectResolutionCache.get(cacheKey);
    if (cached) return cached;
    const promise = this.resolveCanonicalProjectUncached(
      identity,
      sourceType,
      context
    );
    this.projectResolutionCache.set(cacheKey, promise);
    return promise;
  }

  private async resolveCanonicalProjectUncached(
    identity: ProjectIdentity,
    sourceType: string,
    context?: Pick<IntelGapFillContext, "canonicalMarketlessOnly">
  ): Promise<ProjectResolveResult> {
    if (context?.canonicalMarketlessOnly) {
      const marketlessMatch = await this.resolveByMarketlessCanonicalIdentity(
        identity,
        "marketless_canonical_projects"
      );
      if (marketlessMatch.canonicalProjectId || marketlessMatch.ambiguous)
        return marketlessMatch;

      return {
        matchedBy: "none",
        score: 0,
        reason:
          marketlessMatch.reason ||
          "No canonical_projects hasMarketData=false identity match.",
      };
    }

    const profileMatch = await this.resolveByProjectSourceProfile(
      identity,
      sourceType
    );
    if (profileMatch.canonicalProjectId || profileMatch.ambiguous)
      return profileMatch;

    const sourceEntityMatch = await this.resolveBySourceRegistry(
      identity,
      sourceType,
      this.sourceEntityModel,
      "source_entities"
    );
    if (sourceEntityMatch.canonicalProjectId || sourceEntityMatch.ambiguous)
      return sourceEntityMatch;

    const canonicalSourceMatch = await this.resolveBySourceRegistry(
      identity,
      sourceType,
      this.canonicalProjectSourceModel,
      "canonical_project_sources"
    );
    if (
      canonicalSourceMatch.canonicalProjectId ||
      canonicalSourceMatch.ambiguous
    )
      return canonicalSourceMatch;

    if (identity.coingeckoId) {
      const coingeckoMatch = await this.resolveByMarketAssets(
        { "providerIds.coingeckoId": identity.coingeckoId },
        "market_coingecko_id",
        1
      );
      if (coingeckoMatch.canonicalProjectId || coingeckoMatch.ambiguous)
        return coingeckoMatch;
    }

    if (identity.normalizedName && identity.normalizedSymbol) {
      const nameSymbolMatch = await this.resolveByMarketAssets(
        {
          normalizedName: identity.normalizedName,
          normalizedSymbol: identity.normalizedSymbol,
        },
        "market_normalized_symbol_name",
        0.95
      );
      if (nameSymbolMatch.canonicalProjectId || nameSymbolMatch.ambiguous)
        return nameSymbolMatch;
    }

    if (identity.normalizedName && identity.sourceSlug) {
      const slugNameMatch = await this.resolveByMarketAssets(
        {
          normalizedName: identity.normalizedName,
          slug: identity.sourceSlug,
        },
        "market_normalized_slug_name",
        0.95
      );
      if (slugNameMatch.canonicalProjectId || slugNameMatch.ambiguous)
        return slugNameMatch;
    }

    return {
      matchedBy: "none",
      score: 0,
      reason:
        profileMatch.reason ||
        sourceEntityMatch.reason ||
        canonicalSourceMatch.reason ||
        "No project_source_profiles, source registry, or strong market match.",
    };
  }

  private async resolveByProjectSourceProfile(
    identity: ProjectIdentity,
    sourceType: string
  ): Promise<ProjectResolveResult> {
    const searches = [
      {
        label: "sourceProjectId",
        clauses: this.idVariants(identity).map((sourceProjectId) => ({
          sourceProjectId,
        })),
      },
      {
        label: "sourceSlug",
        clauses: this.slugVariants(identity).map((sourceSlug) => ({
          sourceSlug,
        })),
      },
      {
        label: "sourceUrl",
        clauses: this.projectUrlVariants(identity.sourceUrl).map(
          (sourceUrl) => ({
            sourceUrl,
          })
        ),
      },
    ];
    if (!searches.some((search) => search.clauses.length)) {
      return {
        matchedBy: "project_source_profiles",
        score: 0,
        reason: "No source identity values for project_source_profiles.",
      };
    }

    let lastReason = "project_source_profiles had no canonical match.";
    for (const search of searches) {
      if (!search.clauses.length) continue;
      const rows = await this.projectSourceProfileModel
        .find({ sourceType, $or: search.clauses })
        .limit(25)
        .lean();
      const resolved = await this.resolveUniqueCanonicalId(
        rows,
        `project_source_profiles.${search.label}`,
        1
      );
      if (resolved.canonicalProjectId || resolved.ambiguous) return resolved;
      lastReason = resolved.reason || lastReason;
    }

    return {
      matchedBy: "project_source_profiles",
      score: 0,
      reason: lastReason,
    };
  }

  private async resolveBySourceRegistry(
    identity: ProjectIdentity,
    sourceType: string,
    model: Model<any>,
    matchedBy: string
  ): Promise<ProjectResolveResult> {
    const supportsSourcePath = Boolean(
      (model as any).schema?.path?.("sourcePath")
    );
    const searches = [
      {
        label: "sourceId",
        clauses: this.idVariants(identity).map((sourceId) => ({ sourceId })),
      },
      {
        label: "sourceSlug",
        clauses: this.slugVariants(identity).map((sourceSlug) => ({
          sourceSlug,
        })),
      },
      {
        label: "sourcePath",
        clauses: supportsSourcePath
          ? this.sourcePathVariants(identity).map((sourcePath) => ({
              sourcePath,
            }))
          : [],
      },
      {
        label: "sourceUrl",
        clauses: this.projectUrlVariants(identity.sourceUrl).map(
          (sourceUrl) => ({
            sourceUrl,
          })
        ),
      },
    ];
    if (!searches.some((search) => search.clauses.length)) {
      return {
        matchedBy,
        score: 0,
        reason: `No source identity values for ${matchedBy}.`,
      };
    }

    let lastReason = `${matchedBy} had no canonical match.`;
    for (const search of searches) {
      if (!search.clauses.length) continue;
      const baseQuery: Record<string, any> = {
        source: sourceType,
        canonicalProjectId: { $exists: true, $ne: null },
        $or: search.clauses,
      };
      if (matchedBy === "source_entities") {
        baseQuery.sourceEntityType = { $in: ["project", "project_enrichment"] };
      }
      const rows = await model.find(baseQuery).limit(25).lean();
      const resolved = await this.resolveUniqueCanonicalId(
        rows,
        `${matchedBy}.${search.label}`,
        1
      );
      if (resolved.canonicalProjectId || resolved.ambiguous) return resolved;
      lastReason = resolved.reason || lastReason;
    }

    return {
      matchedBy,
      score: 0,
      reason: lastReason,
    };
  }

  private async resolveByMarketAssets(
    query: Record<string, any>,
    matchedBy: string,
    score: number
  ): Promise<ProjectResolveResult> {
    const assets = await this.marketAssetModel
      .find({ ...query, status: { $ne: "deprecated" } })
      .limit(25)
      .lean();
    const marketAssetIds = assets
      .map((asset) => this.toObjectId(asset?._id))
      .filter(Boolean) as Types.ObjectId[];
    if (!marketAssetIds.length) {
      return { matchedBy, score: 0, reason: `No ${matchedBy} market asset.` };
    }

    const links = await this.projectAssetLinkModel
      .find({
        marketAssetId: { $in: marketAssetIds },
        status: { $ne: "deprecated" },
      })
      .limit(25)
      .lean();

    return this.resolveUniqueCanonicalId(links, matchedBy, score);
  }

  private async resolveByMarketlessCanonicalIdentity(
    identity: ProjectIdentity,
    matchedByPrefix: string
  ): Promise<ProjectResolveResult> {
    const index = await this.getMarketlessCanonicalIdentityIndex();
    const sourceIdentityValues = this.marketlessSourceIdentityValues([
      ...this.slugVariants(identity),
      ...this.idVariants(identity),
    ]);

    if (sourceIdentityValues.length) {
      const rows = this.lookupMarketlessRows(
        index.bySourceIdentity,
        sourceIdentityValues
      );
      const resolved = this.resolveUniqueCanonicalRows(
        rows,
        `${matchedByPrefix}.source_identity`,
        0.98
      );
      if (resolved.canonicalProjectId || resolved.ambiguous) return resolved;
    }

    const urls = this.projectUrlVariants(identity.sourceUrl);
    if (urls.length) {
      const rows = this.lookupMarketlessRows(index.bySourceUrl, urls);
      const resolved = this.resolveUniqueCanonicalRows(
        rows,
        `${matchedByPrefix}.source_url`,
        0.98
      );
      if (resolved.canonicalProjectId || resolved.ambiguous) return resolved;
    }

    const names = this.marketlessNameValues(identity);
    const symbols = this.marketlessSymbolValues(identity);
    let blockedNameSymbolReason: string | undefined;
    if (names.length && symbols.length) {
      const nameSymbolKeys = names.flatMap((name) =>
        symbols.map((symbol) => `${name}|${symbol}`)
      );
      const rows = this.lookupMarketlessRows(
        index.byNameSymbol,
        nameSymbolKeys
      );
      const resolved = this.resolveUniqueCanonicalRows(
        rows,
        `${matchedByPrefix}.name_symbol`,
        0.95
      );
      if (resolved.canonicalProjectId) {
        if (this.isSafeNameSymbolResolve(identity, resolved.canonical, index)) {
          return resolved;
        }
        blockedNameSymbolReason =
          "name_symbol matched, but source identity did not match canonical source identity.";
      } else if (resolved.ambiguous) {
        return resolved;
      }
    }

    return {
      matchedBy: matchedByPrefix,
      score: 0,
      reason:
        blockedNameSymbolReason ||
        "No canonical_projects hasMarketData=false identity match.",
    };
  }

  private async resolveUniqueCanonicalId(
    rows: Array<Record<string, any>>,
    matchedBy: string,
    score: number
  ): Promise<ProjectResolveResult> {
    const ids = this.uniqueStrings(
      rows.map((row) => this.toIdString(row?.canonicalProjectId))
    );
    if (ids.length !== 1) {
      return {
        matchedBy,
        score: 0,
        ambiguous: ids.length > 1,
        reason: ids.length
          ? `${matchedBy} matched multiple canonical projects.`
          : `${matchedBy} had no canonical match.`,
      };
    }

    const canonicalProjectId = this.toObjectId(ids[0]);
    const canonical = canonicalProjectId
      ? await this.canonicalProjectModel.findById(canonicalProjectId).lean()
      : null;
    return {
      canonicalProjectId,
      canonicalProjectIdString: ids[0],
      canonical: canonical || { _id: canonicalProjectId },
      matchedBy,
      score,
    };
  }

  private isMarketlessResolve(resolved: ProjectResolveResult): boolean {
    return resolved.canonical?.hasMarketData === false;
  }

  private marketlessCanonicalQuery(): Record<string, any> {
    return {
      hasMarketData: false,
      status: { $ne: "merged" },
    };
  }

  private async getMarketlessCanonicalIdentityIndex(): Promise<MarketlessCanonicalIdentityIndex> {
    if (!this.marketlessCanonicalIdentityIndex) {
      this.marketlessCanonicalIdentityIndex =
        this.buildMarketlessCanonicalIdentityIndex();
    }
    return this.marketlessCanonicalIdentityIndex;
  }

  private async buildMarketlessCanonicalIdentityIndex(): Promise<MarketlessCanonicalIdentityIndex> {
    const projects = await this.canonicalProjectModel
      .find(this.marketlessCanonicalQuery())
      .select({
        _id: 1,
        name: 1,
        normalizedName: 1,
        slug: 1,
        symbol: 1,
        normalizedSymbol: 1,
        providerIds: 1,
        aliases: 1,
        sourceEvidence: 1,
        hasMarketData: 1,
        status: 1,
      })
      .lean();
    const index: MarketlessCanonicalIdentityIndex = {
      totalCanonicalProjects: projects.length,
      bySourceIdentity: new Map(),
      bySourceUrl: new Map(),
      byName: new Map(),
      byNameSymbol: new Map(),
      sourceIdentityValuesByProjectId: new Map(),
    };
    const projectsById = new Map<string, Record<string, any>>();
    for (const project of projects) {
      projectsById.set(this.toIdString(project._id), project);
      this.addMarketlessCanonicalProjectToIndex(index, project);
    }

    const canonicalProjectIds = projects
      .map((project) => this.toObjectId(project._id))
      .filter(Boolean) as Types.ObjectId[];
    if (!canonicalProjectIds.length) return index;

    const [profiles, canonicalSources, sourceEntities] = await Promise.all([
      this.projectSourceProfileModel
        .find({ canonicalProjectId: { $in: canonicalProjectIds } })
        .select({
          canonicalProjectId: 1,
          sourceProjectId: 1,
          sourceSlug: 1,
          sourceUrl: 1,
          slug: 1,
          name: 1,
          symbol: 1,
        })
        .lean(),
      this.canonicalProjectSourceModel
        .find({ canonicalProjectId: { $in: canonicalProjectIds } })
        .select({
          canonicalProjectId: 1,
          sourceId: 1,
          sourceSlug: 1,
          sourceUrl: 1,
        })
        .lean(),
      this.sourceEntityModel
        .find({ canonicalProjectId: { $in: canonicalProjectIds } })
        .select({
          canonicalProjectId: 1,
          sourceId: 1,
          sourceSlug: 1,
          sourceUrl: 1,
        })
        .lean(),
    ]);

    for (const source of [
      ...profiles,
      ...canonicalSources,
      ...sourceEntities,
    ]) {
      const project = projectsById.get(
        this.toIdString(source.canonicalProjectId)
      );
      if (!project) continue;
      this.addMarketlessSourceIdentityToIndex(index, project, source);
    }

    return index;
  }

  private addMarketlessCanonicalProjectToIndex(
    index: MarketlessCanonicalIdentityIndex,
    project: Record<string, any>
  ): void {
    const sourceEvidence = project.sourceEvidence || {};
    const aliases = this.arrayValue(project.aliases);
    this.addMarketlessSourceIdentityValues(index, project, [
      project.slug,
      project.providerIds?.icodropsId,
      sourceEvidence.sourceProjectId,
      sourceEvidence.sourceSlug,
      sourceEvidence.normalizedSlug,
      ...aliases
        .filter((alias) => alias?.type === "slug")
        .flatMap((alias) => [alias.value, alias.normalizedValue]),
    ]);
    this.addMarketlessUrlValues(index, project, [
      sourceEvidence.sourceUrl,
      project.sourceUrl,
    ]);

    const names = this.compactValues([
      project.name,
      project.normalizedName,
      sourceEvidence.normalizedName,
      ...aliases
        .filter((alias) => alias?.type === "name")
        .flatMap((alias) => [alias.value, alias.normalizedValue]),
    ]).filter((value) => value.length >= 3);
    const symbols = this.uniqueStrings([
      project.symbol,
      project.normalizedSymbol,
      sourceEvidence.normalizedSymbol,
      ...aliases
        .filter((alias) => alias?.type === "symbol")
        .flatMap((alias) => [alias.value, alias.normalizedValue]),
    ]).flatMap((value) => {
      const normalized = this.normalizeSymbol(value);
      return normalized ? [normalized, normalized.toLowerCase()] : [];
    });

    this.addMarketlessRows(index.byName, names, project);
    for (const name of names) {
      for (const symbol of symbols) {
        this.addMarketlessRows(
          index.byNameSymbol,
          [`${name}|${symbol}`],
          project
        );
      }
    }
  }

  private addMarketlessSourceIdentityToIndex(
    index: MarketlessCanonicalIdentityIndex,
    project: Record<string, any>,
    source: Record<string, any>
  ): void {
    this.addMarketlessSourceIdentityValues(index, project, [
      source.sourceId,
      source.sourceProjectId,
      source.sourceSlug,
      source.slug,
    ]);
    this.addMarketlessUrlValues(index, project, [source.sourceUrl]);
    this.addMarketlessRows(
      index.byName,
      this.compactValues([source.name]).filter((value) => value.length >= 3),
      project
    );
  }

  private addMarketlessSourceIdentityValues(
    index: MarketlessCanonicalIdentityIndex,
    project: Record<string, any>,
    values: any[]
  ): void {
    const sourceIdentityValues = this.marketlessSourceIdentityValues(values);
    this.addMarketlessProjectSourceIdentityValues(
      index,
      project,
      sourceIdentityValues
    );
    this.addMarketlessRows(
      index.bySourceIdentity,
      sourceIdentityValues,
      project
    );
  }

  private addMarketlessProjectSourceIdentityValues(
    index: MarketlessCanonicalIdentityIndex,
    project: Record<string, any>,
    values: string[]
  ): void {
    const projectId = this.toIdString(project._id);
    if (!projectId) return;
    const existing = index.sourceIdentityValuesByProjectId.get(projectId) || [];
    index.sourceIdentityValuesByProjectId.set(
      projectId,
      this.uniqueStrings([...existing, ...values]).map((value) =>
        value.toLowerCase()
      )
    );
  }

  private addMarketlessUrlValues(
    index: MarketlessCanonicalIdentityIndex,
    project: Record<string, any>,
    values: any[]
  ): void {
    this.addMarketlessRows(
      index.bySourceUrl,
      values.flatMap((value) => this.urlVariants(value)),
      project
    );
  }

  private addMarketlessRows(
    map: Map<string, Array<Record<string, any>>>,
    keys: any[],
    project: Record<string, any>
  ): void {
    for (const key of this.uniqueStrings(keys)) {
      const normalizedKey = this.marketlessLookupKey(key);
      if (!normalizedKey) continue;
      const rows = map.get(normalizedKey) || [];
      if (
        !rows.some(
          (row) => this.toIdString(row._id) === this.toIdString(project._id)
        )
      ) {
        rows.push(project);
      }
      map.set(normalizedKey, rows);
    }
  }

  private lookupMarketlessRows(
    map: Map<string, Array<Record<string, any>>>,
    keys: any[]
  ): Array<Record<string, any>> {
    const byId = new Map<string, Record<string, any>>();
    for (const key of keys) {
      const normalizedKey = this.marketlessLookupKey(key);
      if (!normalizedKey) continue;
      for (const row of map.get(normalizedKey) || []) {
        byId.set(this.toIdString(row._id), row);
      }
    }
    return Array.from(byId.values());
  }

  private resolveUniqueCanonicalRows(
    rows: Array<Record<string, any>>,
    matchedBy: string,
    score: number
  ): ProjectResolveResult {
    const byId = new Map<string, Record<string, any>>();
    for (const row of rows) {
      const id = this.toIdString(row?._id);
      if (id) byId.set(id, row);
    }
    const ids = Array.from(byId.keys());
    if (ids.length !== 1) {
      return {
        matchedBy,
        score: 0,
        ambiguous: ids.length > 1,
        reason: ids.length
          ? `${matchedBy} matched multiple marketless canonical projects.`
          : `${matchedBy} had no marketless canonical match.`,
      };
    }

    const canonicalProjectId = this.toObjectId(ids[0]);
    return {
      canonicalProjectId,
      canonicalProjectIdString: ids[0],
      canonical: byId.get(ids[0]),
      matchedBy,
      score,
    };
  }

  private isSafeNameSymbolResolve(
    identity: ProjectIdentity,
    canonical: Record<string, any> | undefined,
    index: MarketlessCanonicalIdentityIndex
  ): boolean {
    const canonicalProjectId = this.toIdString(canonical?._id);
    if (!canonicalProjectId) return false;
    const canonicalIdentityValues =
      index.sourceIdentityValuesByProjectId.get(canonicalProjectId) || [];
    if (!canonicalIdentityValues.length) return true;

    const incomingIdentityValues = this.marketlessSourceIdentityValues([
      ...this.slugVariants(identity),
      ...this.idVariants(identity),
    ]).map((value) => value.toLowerCase());

    if (!incomingIdentityValues.length) return false;
    const incoming = new Set(incomingIdentityValues);
    return canonicalIdentityValues.some((value) => incoming.has(value));
  }

  private async resolveBacker(
    participant: ParticipantIdentity,
    sourceType: string
  ): Promise<BackerResolution> {
    const cacheKey = [
      sourceType,
      participant.sourceBackerId || "",
      participant.sourceBackerSlug || "",
      participant.sourceBackerUrl || "",
      participant.normalizedBackerName || "",
    ].join("|");
    const cached = this.backerResolutionCache.get(cacheKey);
    if (cached) return cached;
    const promise = this.resolveBackerUncached(participant, sourceType);
    this.backerResolutionCache.set(cacheKey, promise);
    return promise;
  }

  private async resolveBackerUncached(
    participant: ParticipantIdentity,
    sourceType: string
  ): Promise<BackerResolution> {
    const sourceClauses = [
      ...(participant.sourceBackerId
        ? [{ sourceInvestorId: participant.sourceBackerId }]
        : []),
      ...(participant.sourceBackerSlug
        ? [{ sourceSlug: participant.sourceBackerSlug }]
        : []),
      ...this.urlVariants(participant.sourceBackerUrl).map((sourceUrl) => ({
        sourceUrl,
      })),
    ];

    if (sourceClauses.length) {
      const profiles = await this.backerSourceProfileModel
        .find({
          sourceType: projectSourceTypeMongoPattern(sourceType),
          $or: sourceClauses,
        })
        .limit(10)
        .lean();
      const backerIds = this.uniqueStrings(
        profiles.map((profile) => this.toIdString(profile?.backerId))
      );
      if (backerIds.length === 1) {
        const backerId = this.toObjectId(backerIds[0]);
        const backer = backerId
          ? await this.backerModel.findById(backerId).lean()
          : null;
        if (backer) {
          return {
            status: "resolved",
            matchedBy: "backer_source_profiles",
            backerId,
            backer,
          };
        }
      } else if (backerIds.length > 1) {
        return {
          status: "ambiguous",
          matchedBy: "backer_source_profiles",
          candidates: profiles,
        };
      }
    }

    if (!participant.normalizedBackerName) {
      return { status: "missing", matchedBy: "none" };
    }

    const candidates = await this.backerModel
      .find({
        normalizedName: participant.normalizedBackerName,
        status: { $ne: "merged" },
      })
      .sort({ updatedAt: -1 })
      .limit(11)
      .lean();

    if (candidates.length > 0) {
      return {
        status: "ambiguous",
        matchedBy: "backers.normalizedName_review_required",
        candidates,
      };
    }
    return { status: "missing", matchedBy: "none" };
  }

  private participantsFromRow(
    row: Record<string, any>,
    result?: IntelFundraisingGapFillDryRunResult
  ): ParticipantIdentity[] {
    const byKey = new Map<string, ParticipantIdentity>();
    const rawInvestors = this.arrayValue(row.raw?.investors);
    const rawLeadInvestors = this.arrayValue(row.raw?.leadInvestors);
    const topLevelInvestors = this.arrayValue(row.investors);
    const leadNames = new Set(
      rawLeadInvestors
        .map((item) => {
          if (typeof item === "string") return normalizeBackerName(item);
          return normalizeBackerName(item?.name || item?.title);
        })
        .filter(Boolean)
    );

    const push = (value: any, isLead = false) => {
      const item = this.participantIdentity(value, isLead, leadNames);
      if (!item.backerName && !item.sourceBackerId && !item.sourceBackerSlug)
        return;
      const key =
        item.sourceBackerId ||
        item.sourceBackerSlug ||
        item.sourceBackerUrl ||
        item.normalizedBackerName ||
        item.backerName ||
        "";
      if (!key) return;
      const existing = byKey.get(key);
      if (existing) {
        existing.isLead = existing.isLead || item.isLead;
        existing.sourceBackerId =
          existing.sourceBackerId || item.sourceBackerId;
        existing.sourceBackerSlug =
          existing.sourceBackerSlug || item.sourceBackerSlug;
        existing.sourceBackerUrl =
          existing.sourceBackerUrl || item.sourceBackerUrl;
        return;
      }
      byKey.set(key, item);
    };

    for (const investor of rawInvestors) {
      push(investor, Boolean(investor?.lead));
    }
    for (const investor of rawLeadInvestors) {
      push(investor, true);
    }

    if (!byKey.size && topLevelInvestors.length) {
      this.recordWarning(result, "USED_TOP_LEVEL_INVESTORS_FALLBACK");
      for (const investor of topLevelInvestors) {
        push(investor);
      }
    }

    return Array.from(byKey.values()).map((item) => ({
      ...item,
      isLead: Boolean(item.isLead),
    }));
  }

  private participantIdentity(
    value: any,
    isLead: boolean,
    leadNames: Set<string>
  ): ParticipantIdentity {
    const source = value && typeof value === "object" ? value : {};
    const raw = source.raw || {};
    const backerName =
      typeof value === "string" || typeof value === "number"
        ? cleanFundingString(value)
        : cleanFundingString(
            source.name ||
              source.title ||
              source.investorName ||
              source.backerName ||
              raw.name
          );
    const normalizedBackerName = normalizeBackerName(backerName);
    return {
      backerName,
      normalizedBackerName,
      sourceBackerId: cleanFundingString(
        source.sourceInvestorId ||
          source.sourceBackerId ||
          source.sourceId ||
          source.dropstabId ||
          source.id ||
          raw.id
      ),
      sourceBackerSlug: this.normalizeSlug(
        source.sourceSlug || source.slug || source.investorSlug || raw.slug
      ),
      sourceBackerUrl: this.investorUrl(source),
      isLead:
        Boolean(isLead || source.lead || raw.lead) ||
        Boolean(normalizedBackerName && leadNames.has(normalizedBackerName)),
    };
  }

  private projectIdentity(
    row: Record<string, any>,
    sourceType: string
  ): ProjectIdentity {
    const raw = row.raw || {};
    const sourceDocumentId = this.toIdString(row._id);
    const sourceProjectId = cleanFundingString(raw.currencyId);
    const sourceId = cleanFundingString(sourceProjectId);
    const rawSlug = cleanFundingString(row.project_key || raw.slug);
    const sourceSlug = this.normalizeSlug(rawSlug);
    const incomingSourceUrl = this.normalizeUrl(
      row.projectSourceUrl || raw.sourceUrl
    );
    const generatedSourceUrl =
      sourceSlug && sourceType === "dropstab"
        ? `https://dropstab.com/coins/${encodeURIComponent(sourceSlug)}`
        : undefined;
    const sourceUrl = this.isProjectSourceUrl(incomingSourceUrl)
      ? incomingSourceUrl
      : generatedSourceUrl;
    const sourcePath =
      sourceSlug && sourceType === "dropstab"
        ? `/coins/${sourceSlug}`
        : undefined;
    const name = cleanFundingString(row.project || raw.name);
    const symbol = cleanFundingString(row.symbol || raw.symbol);
    const coingeckoId = this.normalizeProviderId(
      row.coingeckoId || row.providerIds?.coingeckoId || raw.coingeckoId
    );

    return {
      sourceDocumentId,
      sourceProjectId,
      sourceId,
      sourceSlug,
      rawSlug,
      sourceUrl,
      sourcePath,
      name,
      normalizedName: this.normalizeProjectName(name),
      symbol,
      normalizedSymbol: this.normalizeSymbol(symbol),
      coingeckoId,
    };
  }

  private emptyResult(
    debug: boolean,
    sourceFilter: string | undefined,
    write: boolean,
    writeMode: IntelFundraisingGapFillWriteMode,
    canonicalMarketlessOnly: boolean,
    sourceDocumentIdsFilter: string[] = []
  ): IntelFundraisingGapFillDryRunResult {
    const result: IntelFundraisingGapFillDryRunResult = {
      mode: write ? "write" : "dry-run",
      writeMode,
      sourceCollection: INTEL_FUNDRAISING_COLLECTION,
      sourceFeed: INTEL_FUNDRAISING_SOURCE_FEED,
      supportedSourceTypes: [...SUPPORTED_SOURCE_TYPES],
      sourceFilter,
      sourceDocumentIdsFilter: sourceDocumentIdsFilter.length
        ? sourceDocumentIdsFilter
        : undefined,
      canonicalMarketlessOnly,
      dbName: this.dbName(),
      parserDbName: this.parserDbName(),
      totalParserRows: 0,
      rowsScanned: 0,
      rowsWithSupportedSource: 0,
      missingSource: 0,
      unsupportedSource: 0,
      resolvedCanonicalProjects: 0,
      resolvedProjects: 0,
      canonicalProjectsSkippedWithMarketData: 0,
      missingCanonicalProjects: 0,
      missingProjects: 0,
      sourceLocksMatched: 0,
      sourceLocksWouldCreate: 0,
      sourceLocksCreated: 0,
      sourceConflicts: 0,
      roundsFound: 0,
      matchedExistingRounds: 0,
      matchedByFingerprint: 0,
      matchedBySourceId: 0,
      matchedByRoundKey: 0,
      matchedByTypeDate: 0,
      economicSimilaritySignals: 0,
      highRiskEconomicSimilaritySignals: 0,
      newRoundCandidates: 0,
      feedRoundsWouldCreate: 0,
      feedRoundsCreated: 0,
      roundEnrichmentCandidates: 0,
      roundDifferenceSignals: 0,
      roundFieldsWouldEnrich: {},
      roundFieldDifferenceSignals: {},
      participantsFound: 0,
      participantsForMatchedRounds: 0,
      participantsForNewRoundCandidates: 0,
      backersResolved: 0,
      backersMissing: 0,
      backersAmbiguous: 0,
      participantsMatchedExisting: 0,
      newParticipantsForExistingRounds: 0,
      newParticipantsForNewRoundCandidates: 0,
      participantsWouldCreate: 0,
      participantsCreated: 0,
      participantEnrichmentCandidates: 0,
      participantFieldsWouldEnrich: {},
      participantsSkipped: 0,
      participantsSkippedMissingBacker: 0,
      participantsSkippedAmbiguousBacker: 0,
      projectCandidatesWouldCreate: 0,
      projectCandidatesWouldUpdate: 0,
      projectCandidatesCreated: 0,
      projectCandidatesUpdated: 0,
      backerCandidatesWouldCreate: 0,
      backerCandidatesWouldUpdate: 0,
      backerCandidatesCreated: 0,
      backerCandidatesUpdated: 0,
      reviewsWouldCreate: 0,
      reviewsWouldUpdate: 0,
      reviewsCreated: 0,
      reviewsUpdated: 0,
      reviewsByReason: {},
      bySourceType: {},
      skipped: {
        total: 0,
        byReason: {},
      },
      warnings: [],
      errors: [],
    };

    if (debug) {
      result.skipped.examples = [];
      result.debugExamples = {
        missingSource: [],
        unsupportedSource: [],
        linkedProjects: [],
        missingCanonicalProject: [],
        sourceConflict: [],
        matchedExistingRounds: [],
        newRoundCandidates: [],
        roundEnrichmentCandidates: [],
        economicSimilaritySignals: [],
        feedRoundsWouldCreate: [],
        newParticipantsForExistingRounds: [],
        backersMissing: [],
        backersAmbiguous: [],
        projectCandidates: [],
        backerCandidates: [],
        reviews: [],
      };
    }

    return result;
  }

  private sourceSummary(
    result: IntelFundraisingGapFillDryRunResult,
    sourceType: string
  ): IntelFundraisingGapFillBySourceSummary {
    if (!result.bySourceType[sourceType]) {
      result.bySourceType[sourceType] = {
        total: 0,
        resolvedProjects: 0,
        matchedExistingRounds: 0,
        newRoundCandidates: 0,
        sourceConflicts: 0,
        sourceLocksMatched: 0,
        sourceLocksWouldCreate: 0,
        roundEnrichmentCandidates: 0,
        participantsFound: 0,
        backersResolved: 0,
        newParticipantsForExistingRounds: 0,
        feedRoundsWouldCreate: 0,
        feedRoundsCreated: 0,
        participantsWouldCreate: 0,
        participantsCreated: 0,
      };
    }
    return result.bySourceType[sourceType];
  }

  private isSupportedSourceType(sourceType: string): boolean {
    return (SUPPORTED_SOURCE_TYPES as readonly string[]).includes(sourceType);
  }

  private resolveWriteMode(
    options: IntelFundraisingGapFillDryRunOptions
  ): IntelFundraisingGapFillWriteMode {
    const participantsOnly = Boolean(options.participantsOnly);
    const feedRounds = Boolean(options.feedRounds);
    if (participantsOnly && feedRounds) {
      throw new Error(
        "Choose only one intel fundraising mode: --participants-only or --feed-rounds."
      );
    }
    if (options.write && !participantsOnly && !feedRounds) {
      throw new Error(
        "Intel fundraising --write requires --participants-only or --feed-rounds."
      );
    }
    if (participantsOnly) return "participants-only";
    if (feedRounds) return "feed-rounds";
    return "dry-run";
  }

  private parserCollection(): any {
    const db = (this.parserConnection as any).db;
    if (!db) throw new Error("Parser DB connection is not initialized.");
    return db.collection(INTEL_FUNDRAISING_COLLECTION);
  }

  private recordSkipped(
    result: IntelFundraisingGapFillDryRunResult,
    reason: string,
    count = 1,
    example?: Record<string, any>
  ): void {
    const amount = Math.max(0, Number(count || 0));
    result.skipped.total += amount;
    result.skipped.byReason[reason] =
      (result.skipped.byReason[reason] || 0) + amount;
    if (
      example &&
      result.skipped.examples &&
      result.skipped.examples.length < DEBUG_LIMIT
    ) {
      result.skipped.examples.push(example);
    }
  }

  private recordWarning(
    result: IntelFundraisingGapFillDryRunResult | undefined,
    warning: string
  ): void {
    if (!result) return;
    if (!result.warnings.includes(warning)) result.warnings.push(warning);
  }

  private pushDebug(
    debug: boolean,
    target: Array<Record<string, any>> | undefined,
    value: Record<string, any>
  ): void {
    if (!debug || !target || target.length >= DEBUG_LIMIT) return;
    target.push(value);
  }

  private projectDebugExample(
    identity: ProjectIdentity,
    resolved: ProjectResolveResult
  ): Record<string, any> {
    return {
      sourceProject: {
        name: identity.name,
        symbol: identity.symbol,
        slug: identity.sourceSlug || identity.rawSlug,
        sourceUrl: identity.sourceUrl,
        sourceProjectId: identity.sourceProjectId || identity.sourceId,
      },
      canonical: this.canonicalDebug(resolved.canonical),
      matchedBy: resolved.matchedBy,
      score: resolved.score,
    };
  }

  private roundDebug(candidate: IntelRoundCandidate): Record<string, any> {
    return {
      project: candidate.projectLabel,
      roundName: candidate.roundName,
      normalizedRoundType: candidate.normalizedRoundType,
      dateBucket: candidate.dateBucket,
      raisedAmount: candidate.raisedAmount,
      valuation: candidate.valuation,
      sourceId: candidate.sourceId,
      feedExternalId: candidate.feedExternalId,
      sourceFeed: candidate.sourceFeed,
      roundKey: candidate.roundKey,
      canonicalFingerprint: candidate.canonicalFingerprint,
    };
  }

  private canonicalDebug(
    value?: Record<string, any>
  ): Record<string, any> | undefined {
    if (!value) return undefined;
    return {
      canonicalProjectId: this.toIdString(value._id),
      name: value.name,
      symbol: value.symbol,
      slug: value.slug,
    };
  }

  private idVariants(identity: ProjectIdentity): string[] {
    return this.uniqueStrings([identity.sourceProjectId, identity.sourceId]);
  }

  private slugVariants(identity: ProjectIdentity): string[] {
    return this.uniqueStrings([
      identity.sourceSlug,
      this.normalizeSlug(identity.rawSlug),
    ]);
  }

  private sourcePathVariants(identity: ProjectIdentity): string[] {
    return this.uniqueStrings([identity.sourcePath]);
  }

  private projectUrlVariants(value: any): string[] {
    const normalized = this.normalizeUrl(value);
    if (!this.isProjectSourceUrl(normalized)) return [];
    return this.uniqueStrings([normalized, normalized?.replace(/\/+$/, "")]);
  }

  private urlVariants(value: any): string[] {
    const normalized = this.normalizeUrl(value);
    if (!normalized) return [];
    return this.uniqueStrings([normalized, normalized.replace(/\/+$/, "")]);
  }

  private projectKey(identity: ProjectIdentity): string {
    return (
      identity.sourceProjectId ||
      identity.sourceId ||
      identity.sourceSlug ||
      identity.sourceDocumentId ||
      "unknown_project"
    );
  }

  private projectLabel(identity: ProjectIdentity): string {
    return (
      identity.name ||
      identity.sourceSlug ||
      identity.sourceProjectId ||
      identity.sourceDocumentId ||
      "unknown project"
    );
  }

  private buildRoundKey(input: {
    sourceType: string;
    projectKey: string;
    normalizedRoundType?: string;
    normalizedRoundName?: string;
    dateBucket?: string;
    raisedAmount?: number;
    sourceId?: string;
  }): string {
    const parts = [
      input.sourceType,
      input.projectKey,
      input.normalizedRoundType || "unknown",
      input.dateBucket || "unknown_date",
      this.amountKey(input.raisedAmount),
      input.normalizedRoundName || "unknown_round",
      input.sourceId || "unknown_source_id",
    ];
    return parts.map((part) => this.keyPart(part)).join(":");
  }

  private investorUrl(source: Record<string, any>): string | undefined {
    const direct = this.normalizeUrl(
      source.sourceUrl || source.url || source.href || source.raw?.sourceUrl
    );
    if (direct) return direct;
    const link = this.arrayValue(source.links || source.raw?.links)
      .map((item) => item?.link || item?.url || item?.href)
      .find(Boolean);
    return this.normalizeUrl(link);
  }

  private toIntelFundingDate(value: any): Date | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    if (value instanceof Date)
      return Number.isNaN(value.getTime()) ? undefined : value;
    const number = Number(value);
    if (Number.isFinite(number)) {
      const milliseconds = number > 10_000_000_000 ? number : number * 1000;
      const date = new Date(milliseconds);
      return Number.isNaN(date.getTime()) ? undefined : date;
    }
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private normalizeOptionalSourceType(value: any): string | undefined {
    const normalized = normalizeProjectSourceType(value);
    return normalized || undefined;
  }

  private normalizeProjectName(value: any): string | undefined {
    const text = cleanFundingString(value);
    if (!text) return undefined;
    return text
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private compactProjectName(value: any): string | undefined {
    return this.normalizeProjectName(value)?.replace(/\s+/g, "");
  }

  private compactValues(values: any[]): string[] {
    return this.uniqueStrings(
      values.map((value) => this.compactProjectName(value)).filter(Boolean)
    );
  }

  private marketlessSourceIdentityValues(values: any[]): string[] {
    return this.uniqueStrings([
      ...values,
      ...values.map((value) => this.normalizeSlug(value)),
      ...values.map((value) => this.compactProjectName(value)),
    ]);
  }

  private marketlessLookupKey(value: any): string | undefined {
    const text = cleanFundingString(value);
    if (!text) return undefined;
    return text.toLowerCase();
  }

  private marketlessNameValues(identity: ProjectIdentity): string[] {
    return this.compactValues([
      identity.name,
      identity.normalizedName,
      identity.sourceSlug,
      identity.rawSlug,
    ]).filter((value) => value.length >= 3);
  }

  private marketlessSymbolValues(identity: ProjectIdentity): string[] {
    const symbol = this.normalizeSymbol(identity.symbol);
    const normalizedSymbol = this.normalizeSymbol(identity.normalizedSymbol);
    return this.uniqueStrings([
      symbol,
      symbol?.toLowerCase(),
      normalizedSymbol,
      normalizedSymbol?.toLowerCase(),
    ]);
  }

  private normalizeSymbol(value: any): string | undefined {
    const text = cleanFundingString(value);
    if (!text) return undefined;
    return text.replace(/^\$/, "").toUpperCase();
  }

  private normalizeSlug(value: any): string | undefined {
    const text = cleanFundingString(value);
    if (!text) return undefined;
    const withoutUrl = text.replace(/^https?:\/\/[^/]+\/?/i, "");
    const slug = withoutUrl
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug || undefined;
  }

  private normalizeProviderId(value: any): string | undefined {
    return cleanFundingString(value)?.toLowerCase();
  }

  private normalizeUrl(value: any): string | undefined {
    const text = cleanFundingString(value);
    if (!text) return undefined;
    const prepared = /^[a-z]+:\/\//i.test(text) ? text : `https://${text}`;
    try {
      const parsed = new URL(prepared);
      const path = parsed.pathname.replace(/\/+$/, "");
      return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${path}${
        parsed.search
      }`;
    } catch {
      return text;
    }
  }

  private isProjectSourceUrl(value: any): boolean {
    const normalized = this.normalizeUrl(value);
    if (!normalized) return false;
    try {
      const parsed = new URL(normalized);
      const path = parsed.pathname.replace(/\/+$/g, "").toLowerCase();
      if (!path || path === "/") return false;
      if (
        path.includes("/latest-fundraising-rounds") ||
        path.includes("/category/") ||
        path === "/category" ||
        path.includes("/fundraising")
      ) {
        return false;
      }
      if (parsed.hostname.toLowerCase().endsWith("dropstab.com")) {
        return /^\/coins\/[^/]+$/.test(path);
      }
      return true;
    } catch {
      return false;
    }
  }

  private firstNumber(...values: any[]): number | undefined {
    for (const value of values) {
      if (value === undefined || value === null || value === "") continue;
      const number = Number(value);
      if (Number.isFinite(number)) return number;
    }
    return undefined;
  }

  private amountKey(value: any): string {
    const number = Number(value);
    if (!Number.isFinite(number)) return "unknown_amount";
    return String(Math.round(number));
  }

  private keyPart(value: any): string {
    return (
      String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "unknown"
    );
  }

  private normalizeSourceDocumentIds(values?: string[]): string[] {
    const ids = this.uniqueStrings(
      (values || [])
        .flatMap((value) => String(value || "").split(","))
        .map((value) => value.trim())
        .filter(Boolean)
    );
    for (const id of ids) {
      if (!/^[a-f0-9]{24}$/i.test(id)) {
        throw new Error(`Invalid sourceDocumentId "${id}".`);
      }
    }
    return ids.map((id) => id.toLowerCase());
  }

  private parsePositiveInteger(value: any, fallback: number): number {
    const parsed = Number(value || fallback);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.trunc(parsed);
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value;
    const text = this.toIdString(value);
    return Types.ObjectId.isValid(text) ? new Types.ObjectId(text) : undefined;
  }

  private toIdString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();
    if (typeof value.toString === "function") return value.toString();
    return "";
  }

  private uniqueStrings(values: any[]): string[] {
    return Array.from(
      new Set(values.map((value) => cleanFundingString(value)).filter(Boolean))
    ) as string[];
  }

  private arrayValue(value: any): any[] {
    if (Array.isArray(value)) return value;
    return value === undefined || value === null ? [] : [value];
  }

  private equalValue(left: any, right: any): boolean {
    if (left instanceof Date || right instanceof Date) {
      const leftDate =
        left instanceof Date ? left : this.toIntelFundingDate(left);
      const rightDate =
        right instanceof Date ? right : this.toIntelFundingDate(right);
      return Boolean(
        leftDate &&
          rightDate &&
          leftDate.toISOString().slice(0, 10) ===
            rightDate.toISOString().slice(0, 10)
      );
    }
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
      return Math.abs(leftNumber - rightNumber) < 1e-9;
    }
    return String(left) === String(right);
  }

  private increment(target: Record<string, number>, key: string): void {
    target[key] = (target[key] || 0) + 1;
  }

  private dbName(): string {
    return (
      String(
        this.configService.get("DB_NAME") || process.env.DB_NAME || "fomoland"
      ).trim() || "fomoland"
    );
  }

  private parserDbName(): string {
    return (
      String(
        this.configService.get("DB_PARSER_NAME") ||
          process.env.DB_PARSER_NAME ||
          this.dbName()
      ).trim() || this.dbName()
    );
  }
}
