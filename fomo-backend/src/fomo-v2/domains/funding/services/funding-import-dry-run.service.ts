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
  buildImportCandidateFingerprint,
  FomoV2ImportCandidate,
  FomoV2ImportCandidateInput,
  FomoV2ImportCandidateService,
} from "../../import-candidates";
import { FomoV2ReviewBatch } from "../../review/models/review-batch.model";
import { FomoV2ParserControlPolicyService } from "../../parser-control/services/parser-control-policy.service";
import { FomoV2ReviewService } from "../../review/services/review.service";
import { FomoV2ReviewCandidateInput } from "../../review/types";
import {
  buildMissingCanonicalProjectReviewFingerprint,
  buildReviewFingerprint,
  buildSourceConflictReviewFingerprint,
} from "../../review/helpers";
import {
  FomoV2ProjectDomainSource,
  FomoV2ProjectDomainSourceService,
  normalizeProjectSourceType,
  projectSourceTypeMongoPattern,
} from "../../../shared/source-policy";
import {
  buildFundingRoundFingerprint,
  buildFundingRoundParticipantFingerprint,
  cleanFundingString,
  cleanObject,
  fundingDateBucket,
  normalizeFundingName,
  normalizeFundingParticipantRole,
  normalizeFundingRoundStatus,
  normalizeFundingRoundType,
  toFundingDate,
} from "../helpers";
import { FomoV2FundingRound, FomoV2FundingRoundParticipant } from "../models";
import { FomoV2FundingService } from "./funding.service";

const PARSER_COLLECTION = "dropstab_coin_detail_data";
const PARSER_SNAPSHOT_COLLECTION = "parser_snapshots";
const PARSER_SNAPSHOT_ITEM_COLLECTION = "parser_snapshot_items";
const DROPSTAB_UPSTREAM_PARSER_KEY = "dropstab:coin-details";
const DEBUG_LIMIT = 20;
const SUPPORTED_SOURCE_TYPES = ["dropstab"] as const;
export const ICODROPS_GENERIC_FUNDING_BLOCKED_MESSAGE =
  "ICODrops funding is only allowed via explicit ico funding fallback flow";

export interface FundingImportDryRunOptions {
  limit?: number;
  debug?: boolean;
  sourceType?: string;
  write?: boolean;
  enrichOnly?: boolean;
  project?: string;
  snapshotId?: string;
  upstreamRunId?: string;
  upstreamParserKey?: string;
  /** In-process lease fence supplied by the managed parser worker. */
  assertExecutionActive?: () => void | Promise<void>;
}

export interface FundingImportDryRunResult {
  mode: "dry-run" | "write";
  enrichOnly: boolean;
  sourceType: string;
  snapshotId?: string;
  dbName: string;
  parserDbName: string;
  totalParserProjects: number;
  projectsWithFundraisingRounds: number;
  resolvedCanonicalProjects: number;
  missingCanonicalProjects: number;
  sourceLocksWouldCreate: number;
  sourceLocksMatched: number;
  sourceConflicts: number;
  roundsFound: number;
  roundsWouldCreate: number;
  roundsWouldUpdateByFingerprint: number;
  roundsWouldUpdateBySourceId: number;
  roundsWouldUpdateByRoundKey: number;
  roundsWouldUpdateByTypeDate: number;
  roundsDuplicateInInput: number;
  roundsSkipped: number;
  participantsFound: number;
  participantsWouldCreate: number;
  participantsWouldUpdateByFingerprint: number;
  participantsWouldUpdateByBackerId: number;
  participantsWouldUpdateByBackerName: number;
  participantsDuplicateInInput: number;
  participantsSkipped: number;
  participantsSkippedMissingBacker: number;
  participantsSkippedAmbiguousBacker: number;
  backersResolved: number;
  backersMissing: number;
  backersAmbiguous: number;
  projectCandidatesWouldCreate: number;
  projectCandidatesWouldUpdate: number;
  backerCandidatesWouldCreate: number;
  backerCandidatesWouldUpdate: number;
  reviewsWouldCreate: number;
  reviewsByReason: Record<string, number>;
  skipped: {
    total: number;
    byReason: Record<string, number>;
    examples?: Array<Record<string, any>>;
  };
  warnings: string[];
  errors: Array<Record<string, any>>;
  debugExamples?: FundingImportDryRunDebugExamples;
}

interface FundingImportDryRunDebugExamples {
  linkedProjects: Array<Record<string, any>>;
  missingCanonicalProject: Array<Record<string, any>>;
  sourceConflict: Array<Record<string, any>>;
  roundsWouldCreate: Array<Record<string, any>>;
  roundsWouldUpdate: Array<Record<string, any>>;
  participantsWouldCreate: Array<Record<string, any>>;
  participantsSkipped: Array<Record<string, any>>;
  backersResolved: Array<Record<string, any>>;
  backersMissing: Array<Record<string, any>>;
  backersAmbiguous: Array<Record<string, any>>;
  projectCandidates: Array<Record<string, any>>;
  backerCandidates: Array<Record<string, any>>;
}

interface ProjectIdentity {
  sourceDocumentId?: string;
  sourceProjectId?: string;
  sourceId?: string;
  sourceSlug?: string;
  rawSlug?: string;
  sourceUrl?: string;
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

interface NormalizedRoundRoi {
  usd?: number;
  btc?: number;
  eth?: number;
}

interface NormalizedRoundPlatform {
  platformId?: Types.ObjectId;
  name?: string;
  normalizedName?: string;
  logoUrl?: string;
  sourceType?: string;
  sourceId?: string;
  sourceUrl?: string;
}

interface NormalizedRoundCandidate {
  canonicalProjectId: Types.ObjectId;
  projectIdentity: ProjectIdentity;
  projectLabel: string;
  sourceIndex: number;
  sourceRound: Record<string, any>;
  roundName?: string;
  normalizedRoundName?: string;
  roundType: string;
  normalizedRoundType: string;
  announcedDate?: Date;
  dateBucket?: string;
  raisedAmount?: number;
  raisedCurrency?: string;
  valuation?: number;
  tokenPrice?: number;
  tokensForSaleAmount?: number;
  tokensForSalePercent?: number;
  roi?: NormalizedRoundRoi;
  platform?: NormalizedRoundPlatform;
  primarySource: string;
  sourceId?: string;
  sourceUrl?: string;
  sourceRefs: Array<Record<string, any>>;
  confidence: string;
  status: string;
  metadata: Record<string, any>;
  roundKey: string;
  canonicalFingerprint: string;
}

interface RoundDecision {
  decision:
    | "create"
    | "update_by_fingerprint"
    | "update_by_source_id"
    | "update_by_round_key"
    | "update_by_type_date";
  existingRound?: Record<string, any>;
  fundingRoundIdentity: Types.ObjectId | string;
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

interface NormalizedParticipantCandidate {
  canonicalProjectId: Types.ObjectId;
  fundingRoundIdentity: Types.ObjectId | string;
  virtualRoundKey: string;
  roundLabel?: string;
  projectLabel: string;
  backerId?: Types.ObjectId;
  backerName?: string;
  normalizedBackerName?: string;
  sourceBackerId?: string;
  sourceBackerSlug?: string;
  sourceBackerUrl?: string;
  sourceBackerRef?: string;
  role: string;
  isLead: boolean;
  primarySource: string;
  sourceRefs: Array<Record<string, any>>;
  confidence: string;
  status: string;
  metadata: Record<string, any>;
  canonicalFingerprint: string;
  backerResolution: BackerResolution;
}

@Injectable()
export class FomoV2FundingImportDryRunService {
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
    @InjectModel(FomoV2ImportCandidate.name)
    private readonly importCandidateModel: Model<any>,
    @InjectModel(FomoV2FundingRound.name)
    private readonly fundingRoundModel: Model<any>,
    @InjectModel(FomoV2FundingRoundParticipant.name)
    private readonly participantModel: Model<any>,
    @InjectModel(FomoV2ProjectDomainSource.name)
    private readonly projectDomainSourceModel: Model<any>,
    @InjectModel(FomoV2ReviewBatch.name)
    private readonly reviewBatchModel: Model<any>,
    private readonly fundingService: FomoV2FundingService,
    private readonly importCandidateService: FomoV2ImportCandidateService,
    private readonly projectDomainSourceService: FomoV2ProjectDomainSourceService,
    private readonly reviewService: FomoV2ReviewService,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService
  ) {}

  async run(
    options: FundingImportDryRunOptions = {}
  ): Promise<FundingImportDryRunResult> {
    if (options.write && options.limit === undefined) {
      throw new Error("Funding write mode requires an explicit --limit.");
    }

    if (options.write && !cleanFundingString(options.snapshotId)) {
      throw new Error(
        "Funding write mode requires an immutable parser snapshotId. Mutable parser collection writes are disabled."
      );
    }

    const write = Boolean(options.write);
    const enrichOnly =
      options.enrichOnly === undefined ? write : Boolean(options.enrichOnly);
    const sourceType = this.normalizeSourceType(options.sourceType);
    if (write && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        `funding:${sourceType}`
      );
    }
    if (sourceType === "icodrops") {
      throw new Error(ICODROPS_GENERIC_FUNDING_BLOCKED_MESSAGE);
    }
    if (!this.isSupportedSourceType(sourceType)) {
      throw new Error(
        `Unsupported funding sourceType "${sourceType}". Generic funding-import supports only: ${SUPPORTED_SOURCE_TYPES.join(
          ", "
        )}. Use the explicit ICODrops funding fallback importer for sourceType=icodrops.`
      );
    }
    const limit = this.parsePositiveInteger(options.limit, 100);
    const debug = Boolean(options.debug);
    const projectFilter = cleanFundingString(options.project);
    const snapshotId = cleanFundingString(options.snapshotId);
    const upstreamParserKey =
      cleanFundingString(options.upstreamParserKey) ||
      DROPSTAB_UPSTREAM_PARSER_KEY;
    if (snapshotId && upstreamParserKey !== DROPSTAB_UPSTREAM_PARSER_KEY) {
      throw new Error(
        `Dropstab funding snapshot import requires parser ${DROPSTAB_UPSTREAM_PARSER_KEY}.`
      );
    }
    const result = this.emptyResult(sourceType, debug, write, enrichOnly);
    const seenRoundKeys = new Set<string>();
    const seenParticipantKeys = new Set<string>();
    const seenReviewFingerprints = new Set<string>();
    const seenCandidateFingerprints = new Set<string>();
    if (snapshotId) result.snapshotId = snapshotId;
    const parserCollection = snapshotId
      ? this.snapshotItemCollection()
      : this.parserCollection();
    const fundraisingQuery = snapshotId
      ? this.snapshotFundraisingRoundsQuery(snapshotId, projectFilter)
      : this.fundraisingRoundsQuery(projectFilter);

    if (snapshotId) {
      await this.validateSnapshot(
        snapshotId,
        sourceType,
        write,
        cleanFundingString(options.upstreamRunId)
      );
      result.totalParserProjects = await parserCollection.countDocuments({
        snapshotId,
        status: "succeeded",
      });
    } else {
      result.totalParserProjects = await parserCollection.countDocuments({});
    }

    result.projectsWithFundraisingRounds =
      await parserCollection.countDocuments(fundraisingQuery);

    if (projectFilter) {
      result.warnings.push(`Filtering parser projects by "${projectFilter}".`);
    }

    if (result.projectsWithFundraisingRounds > limit) {
      result.warnings.push(
        `Processing first ${limit} projects with fundraisingRounds out of ${result.projectsWithFundraisingRounds}.`
      );
    }

    const cursor = parserCollection
      .find(fundraisingQuery)
      .sort(snapshotId ? { entityKey: 1, _id: 1 } : { _id: 1 })
      .limit(limit);

    for await (const sourceDocument of cursor as any) {
      await options.assertExecutionActive?.();
      const sourceProject = snapshotId
        ? this.snapshotItemPayload(sourceDocument, snapshotId, sourceType)
        : sourceDocument;
      await this.processProject(sourceProject, {
        sourceType,
        debug,
        write,
        result,
        enrichOnly,
        seenRoundKeys,
        seenParticipantKeys,
        seenReviewFingerprints,
        seenCandidateFingerprints,
      });
      await options.assertExecutionActive?.();
    }

    return result;
  }

  private async processProject(
    sourceProject: Record<string, any>,
    context: {
      sourceType: string;
      debug: boolean;
      write: boolean;
      result: FundingImportDryRunResult;
      enrichOnly: boolean;
      seenRoundKeys: Set<string>;
      seenParticipantKeys: Set<string>;
      seenReviewFingerprints: Set<string>;
      seenCandidateFingerprints: Set<string>;
    }
  ): Promise<void> {
    const { sourceType, debug, write, result } = context;
    const identity = this.projectIdentity(sourceProject);
    const rounds = this.arrayValue(sourceProject.fundraisingRounds);

    try {
      const resolved = await this.resolveCanonicalProject(identity, sourceType);

      if (!resolved.canonicalProjectId) {
        result.missingCanonicalProjects += 1;
        this.recordSkipped(result, "missing_canonical_project", rounds.length, {
          dropstab: this.dropstabDebugIdentity(identity),
          reason: resolved.reason || "No strong canonical project match.",
        });
        if (context.enrichOnly) return;
        if (resolved.ambiguous) {
          await this.recordReview(context, {
            reason: "POTENTIAL_PROJECT_MATCH",
            sourceType,
            identity,
          });
        } else {
          await this.simulateProjectCandidate(identity, sourceType, context);
        }
        this.pushDebug(debug, result.debugExamples?.missingCanonicalProject, {
          ...this.projectDebugExample(identity, resolved),
          reason: resolved.reason || "No strong canonical project match.",
        });
        return;
      }

      result.resolvedCanonicalProjects += 1;
      this.pushDebug(debug, result.debugExamples?.linkedProjects, {
        ...this.projectDebugExample(identity, resolved),
      });

      const lock = await this.projectDomainSourceModel
        .findOne({
          canonicalProjectId: resolved.canonicalProjectId,
          domain: "funding",
        })
        .lean();

      if (!lock) {
        if (context.enrichOnly) {
          result.sourceConflicts += 1;
          this.recordSkipped(result, "missing_source_lock", rounds.length, {
            dropstab: this.dropstabDebugIdentity(identity),
            canonical: this.canonicalDebug(resolved.canonical),
            incomingSourceType: sourceType,
          });
          return;
        }
        if (!context.enrichOnly) result.sourceLocksWouldCreate += 1;
        if (write && !context.enrichOnly) {
          const lockResult = await this.projectDomainSourceService.ensureLock({
            canonicalProjectId: resolved.canonicalProjectId,
            domain: "funding",
            sourceType,
            reason: "funding_import",
            metadata: {
              importer: "fomo-v2:funding-import",
              sourceCollection: PARSER_COLLECTION,
              sourceDocumentId: identity.sourceDocumentId,
              sourceProjectId: identity.sourceProjectId || identity.sourceId,
              sourceSlug: identity.sourceSlug,
            },
          });
          if (!lockResult.allowed) {
            result.sourceConflicts += 1;
            this.recordSkipped(result, "source_conflict", rounds.length, {
              dropstab: this.dropstabDebugIdentity(identity),
              canonical: this.canonicalDebug(resolved.canonical),
              selectedSourceType: lockResult.currentSourceType,
              incomingSourceType: sourceType,
            });
            await this.recordReview(context, {
              reason: "SOURCE_CONFLICT",
              sourceType,
              identity,
              canonicalProjectId: resolved.canonicalProjectId,
              currentSourceType: lockResult.currentSourceType,
            });
            return;
          }
        }
      } else if (
        this.normalizeSourceType(lock.selectedSourceType) === sourceType
      ) {
        result.sourceLocksMatched += 1;
      } else {
        result.sourceConflicts += 1;
        this.recordSkipped(result, "source_conflict", rounds.length, {
          dropstab: this.dropstabDebugIdentity(identity),
          canonical: this.canonicalDebug(resolved.canonical),
          selectedSourceType: lock.selectedSourceType,
          incomingSourceType: sourceType,
        });
        this.pushDebug(debug, result.debugExamples?.sourceConflict, {
          dropstab: this.dropstabDebugIdentity(identity),
          canonical: this.canonicalDebug(resolved.canonical),
          currentSourceType: lock.selectedSourceType,
          incomingSourceType: sourceType,
        });
        if (!context.enrichOnly) {
          await this.recordReview(context, {
            reason: "SOURCE_CONFLICT",
            sourceType,
            identity,
            canonicalProjectId: resolved.canonicalProjectId,
            currentSourceType: lock.selectedSourceType,
          });
        }
        return;
      }

      for (let index = 0; index < rounds.length; index += 1) {
        await this.processRound(
          rounds[index],
          index,
          identity,
          resolved,
          context
        );
      }
    } catch (error: any) {
      result.errors.push({
        sourceDocumentId: identity.sourceDocumentId,
        sourceProjectId: identity.sourceProjectId || identity.sourceId,
        sourceSlug: identity.sourceSlug,
        name: identity.name,
        message: error?.message || String(error),
      });
    }
  }

  private async processRound(
    sourceRound: Record<string, any>,
    index: number,
    identity: ProjectIdentity,
    resolved: ProjectResolveResult,
    context: {
      sourceType: string;
      debug: boolean;
      write: boolean;
      result: FundingImportDryRunResult;
      enrichOnly: boolean;
      seenRoundKeys: Set<string>;
      seenParticipantKeys: Set<string>;
      seenReviewFingerprints: Set<string>;
      seenCandidateFingerprints: Set<string>;
    }
  ): Promise<void> {
    const { sourceType, debug, write, result } = context;
    const candidate = this.normalizeRound(
      sourceRound,
      index,
      identity,
      resolved.canonicalProjectId as Types.ObjectId,
      sourceType
    );

    if (!candidate) {
      result.roundsSkipped += 1;
      this.recordSkipped(result, "round_validation_failed", 1, {
        project: this.projectLabel(identity),
        sourceIndex: index,
        sourceRound,
      });
      if (!context.enrichOnly) {
        await this.recordReview(context, {
          reason: "ROUND_VALIDATION_FAILED",
          sourceType,
          identity,
          canonicalProjectId: resolved.canonicalProjectId,
          projectKey: `${this.projectKey(identity)}:${index}`,
        });
      }
      return;
    }

    result.roundsFound += 1;

    const duplicateKey = this.roundInputKey(candidate);
    if (context.seenRoundKeys.has(duplicateKey)) {
      result.roundsDuplicateInInput += 1;
      result.roundsSkipped += 1;
      this.recordSkipped(result, "round_duplicate_in_input", 1, {
        project: candidate.projectLabel,
        roundName: candidate.roundName,
        roundKey: candidate.roundKey,
        canonicalFingerprint: candidate.canonicalFingerprint,
      });
      return;
    }
    context.seenRoundKeys.add(duplicateKey);

    const roundDecision = context.enrichOnly
      ? write
        ? await this.writeRoundEnrichment(candidate, result)
        : await this.simulateRoundUpsert(candidate, result, {
            allowCreate: false,
          })
      : write
      ? await this.writeRoundUpsert(candidate, result)
      : await this.simulateRoundUpsert(candidate, result);
    if (!roundDecision) return;
    this.recordRoundDecision(result, candidate, roundDecision, debug);

    if (context.enrichOnly) return;
    const participants = this.participantsFromRound(sourceRound);
    if (!participants.length) return;

    for (const participant of participants) {
      await this.processParticipant(
        participant,
        candidate,
        roundDecision,
        context
      );
    }
  }

  private async processParticipant(
    participant: ParticipantIdentity,
    round: NormalizedRoundCandidate,
    roundDecision: RoundDecision,
    context: {
      sourceType: string;
      debug: boolean;
      write: boolean;
      result: FundingImportDryRunResult;
      seenParticipantKeys: Set<string>;
      seenReviewFingerprints: Set<string>;
      seenCandidateFingerprints: Set<string>;
    }
  ): Promise<void> {
    const { sourceType, debug, result } = context;
    const backerResolution = await this.resolveBacker(participant, sourceType);

    if (backerResolution.status === "resolved") {
      result.backersResolved += 1;
      this.pushDebug(debug, result.debugExamples?.backersResolved, {
        project: round.projectLabel,
        round: round.roundName,
        backerName: participant.backerName,
        normalizedBackerName: participant.normalizedBackerName,
        backerId: this.toIdString(backerResolution.backerId),
        matchedBy: backerResolution.matchedBy,
      });
    } else if (backerResolution.status === "ambiguous") {
      result.backersAmbiguous += 1;
      this.pushDebug(debug, result.debugExamples?.backersAmbiguous, {
        project: round.projectLabel,
        round: round.roundName,
        backerName: participant.backerName,
        normalizedBackerName: participant.normalizedBackerName,
        candidates: (backerResolution.candidates || []).map((candidate) => ({
          backerId: this.toIdString(candidate._id),
          name: candidate.name,
          normalizedName: candidate.normalizedName,
          backerType: candidate.backerType,
        })),
      });
    } else {
      result.backersMissing += 1;
      this.pushDebug(debug, result.debugExamples?.backersMissing, {
        project: round.projectLabel,
        round: round.roundName,
        backerName: participant.backerName,
        normalizedBackerName: participant.normalizedBackerName,
      });
    }

    const candidate = this.normalizeParticipant(
      participant,
      round,
      roundDecision,
      backerResolution,
      sourceType
    );

    if (!candidate) {
      result.participantsSkipped += 1;
      this.recordSkipped(result, "participant_validation_failed", 1, {
        project: round.projectLabel,
        round: round.roundName,
        backerName: participant.backerName,
      });
      await this.recordReview(context, {
        reason: "PARTICIPANT_VALIDATION_FAILED",
        sourceType,
        identity: round.projectIdentity,
        canonicalProjectId: round.canonicalProjectId,
        projectKey: `${round.roundKey}:${participant.backerName || "unknown"}`,
      });
      return;
    }

    result.participantsFound += 1;

    if (backerResolution.status === "missing") {
      result.participantsSkipped += 1;
      result.participantsSkippedMissingBacker += 1;
      this.recordSkipped(result, "MISSING_BACKER", 1, {
        project: candidate.projectLabel,
        round: candidate.roundLabel,
        backerName: candidate.backerName,
        normalizedBackerName: candidate.normalizedBackerName,
      });
      this.pushDebug(debug, result.debugExamples?.participantsSkipped, {
        project: candidate.projectLabel,
        round: candidate.roundLabel,
        backerName: candidate.backerName,
        normalizedBackerName: candidate.normalizedBackerName,
        reason: "MISSING_BACKER",
      });
      await this.simulateBackerCandidate(candidate, sourceType, context);
      return;
    }

    if (backerResolution.status === "ambiguous") {
      result.participantsSkipped += 1;
      result.participantsSkippedAmbiguousBacker += 1;
      this.recordSkipped(result, "BACKER_AMBIGUOUS", 1, {
        project: candidate.projectLabel,
        round: candidate.roundLabel,
        backerName: candidate.backerName,
        normalizedBackerName: candidate.normalizedBackerName,
      });
      await this.recordReview(context, {
        reason: "BACKER_AMBIGUOUS",
        sourceType,
        identity: round.projectIdentity,
        canonicalProjectId: round.canonicalProjectId,
        projectKey: `${round.roundKey}:${participant.normalizedBackerName}`,
      });
      this.pushDebug(debug, result.debugExamples?.participantsSkipped, {
        project: candidate.projectLabel,
        round: candidate.roundLabel,
        backerName: candidate.backerName,
        normalizedBackerName: candidate.normalizedBackerName,
        reason: "BACKER_AMBIGUOUS",
      });
      return;
    }

    if (!candidate.backerId) {
      result.participantsSkipped += 1;
      result.participantsSkippedMissingBacker += 1;
      this.recordSkipped(result, "MISSING_BACKER", 1, {
        project: candidate.projectLabel,
        round: candidate.roundLabel,
        backerName: candidate.backerName,
        normalizedBackerName: candidate.normalizedBackerName,
      });
      await this.simulateBackerCandidate(candidate, sourceType, context);
      return;
    }

    const inputKey = this.participantInputKey(candidate);
    if (context.seenParticipantKeys.has(inputKey)) {
      result.participantsDuplicateInInput += 1;
      result.participantsSkipped += 1;
      this.recordSkipped(result, "participant_duplicate_in_input", 1, {
        project: candidate.projectLabel,
        round: candidate.roundLabel,
        backerName: candidate.backerName,
        normalizedBackerName: candidate.normalizedBackerName,
      });
      return;
    }
    context.seenParticipantKeys.add(inputKey);

    const decision = context.write
      ? await this.writeParticipantUpsert(candidate, result)
      : await this.simulateParticipantUpsert(candidate, result);
    if (decision === "create") {
      this.pushDebug(debug, result.debugExamples?.participantsWouldCreate, {
        project: candidate.projectLabel,
        round: candidate.roundLabel,
        backerName: candidate.backerName,
        normalizedBackerName: candidate.normalizedBackerName,
        backerId: this.toIdString(candidate.backerId),
        decision,
        backerResolution: candidate.backerResolution.status,
      });
    }
  }

  private async simulateRoundUpsert(
    candidate: NormalizedRoundCandidate,
    result: FundingImportDryRunResult,
    options: { allowCreate?: boolean } = {}
  ): Promise<RoundDecision | undefined> {
    const byFingerprint = await this.findSourceScopedRound(
      { canonicalFingerprint: candidate.canonicalFingerprint },
      candidate.primarySource
    );
    if (byFingerprint) {
      result.roundsWouldUpdateByFingerprint += 1;
      return {
        decision: "update_by_fingerprint",
        existingRound: byFingerprint,
        fundingRoundIdentity: byFingerprint._id,
      };
    }

    if (candidate.sourceId) {
      const bySourceId = await this.findSourceScopedRound(
        {
          canonicalProjectId: candidate.canonicalProjectId,
          sourceId: candidate.sourceId,
        },
        candidate.primarySource
      );
      if (bySourceId) {
        result.roundsWouldUpdateBySourceId += 1;
        return {
          decision: "update_by_source_id",
          existingRound: bySourceId,
          fundingRoundIdentity: bySourceId._id,
        };
      }
    }

    const byRoundKey = await this.findSourceScopedRound(
      {
        canonicalProjectId: candidate.canonicalProjectId,
        roundKey: candidate.roundKey,
      },
      candidate.primarySource
    );
    if (byRoundKey) {
      result.roundsWouldUpdateByRoundKey += 1;
      return {
        decision: "update_by_round_key",
        existingRound: byRoundKey,
        fundingRoundIdentity: byRoundKey._id,
      };
    }

    if (candidate.announcedDate && candidate.normalizedRoundType) {
      const byTypeDate = await this.findSourceScopedRound(
        {
          canonicalProjectId: candidate.canonicalProjectId,
          normalizedRoundType: candidate.normalizedRoundType,
          announcedDate: candidate.announcedDate,
        },
        candidate.primarySource
      );
      if (byTypeDate) {
        result.roundsWouldUpdateByTypeDate += 1;
        return {
          decision: "update_by_type_date",
          existingRound: byTypeDate,
          fundingRoundIdentity: byTypeDate._id,
        };
      }
    }

    if (options.allowCreate === false) {
      result.roundsSkipped += 1;
      this.recordSkipped(result, "round_enrich_missing_existing", 1, {
        project: candidate.projectLabel,
        roundName: candidate.roundName,
        roundKey: candidate.roundKey,
        canonicalFingerprint: candidate.canonicalFingerprint,
      });
      return undefined;
    }

    result.roundsWouldCreate += 1;
    return {
      decision: "create",
      fundingRoundIdentity: candidate.roundKey,
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

  private async writeRoundUpsert(
    candidate: NormalizedRoundCandidate,
    result: FundingImportDryRunResult
  ): Promise<RoundDecision> {
    const decision = await this.simulateRoundUpsert(candidate, result);
    if (!decision) {
      throw new Error("Funding write upsert unexpectedly skipped a round.");
    }
    const platform = await this.ensureRoundPlatform(candidate);
    const writePayload = cleanObject({
      canonicalProjectId: candidate.canonicalProjectId,
      roundKey: candidate.roundKey,
      roundName: candidate.roundName,
      normalizedRoundName: candidate.normalizedRoundName,
      roundType: candidate.roundType,
      normalizedRoundType: candidate.normalizedRoundType,
      announcedDate: candidate.announcedDate,
      dateBucket: candidate.dateBucket,
      raisedAmount: candidate.raisedAmount,
      raisedCurrency: candidate.raisedCurrency,
      valuation: candidate.valuation,
      tokenPrice: candidate.tokenPrice,
      tokensForSaleAmount: candidate.tokensForSaleAmount,
      tokensForSalePercent: candidate.tokensForSalePercent,
      roi: candidate.roi,
      platformId: platform?.platformId,
      platform,
      primarySource: candidate.primarySource,
      sourceType: candidate.primarySource,
      sourceId: candidate.sourceId,
      sourceSlug: candidate.projectIdentity.sourceSlug,
      sourceUrl: candidate.sourceUrl,
      sourceRefs: candidate.sourceRefs as any,
      confidence: candidate.confidence,
      status: candidate.status,
      canonicalFingerprint: candidate.canonicalFingerprint,
      metadata: {
        ...candidate.metadata,
        importer: "fomo-v2:funding-import",
        dryRunOnly: false,
      },
    });

    let writtenRound: Record<string, any> | null | undefined;
    if (decision.existingRound?._id) {
      const existingRoundId = this.toObjectId(decision.existingRound._id);
      if (!existingRoundId) {
        throw new Error(
          "Funding write requires a valid existing fundingRoundId."
        );
      }
      writtenRound = await this.fundingRoundModel
        .findOneAndUpdate(
          {
            _id: existingRoundId,
            ...this.roundSourceScope(candidate.primarySource),
          },
          { $set: writePayload },
          { new: true }
        )
        .lean();
      if (
        !writtenRound ||
        !this.roundMatchesSource(writtenRound, candidate.primarySource)
      ) {
        throw new Error(
          "Funding write refused to update a round outside the selected source."
        );
      }
    } else {
      writtenRound = (await this.fundingService.createFundingRound(
        writePayload as any
      )) as any;
    }
    const fundingRoundIdentity = this.toObjectId(writtenRound?._id);
    if (!fundingRoundIdentity) {
      throw new Error("Funding write did not return fundingRoundId.");
    }
    return {
      ...decision,
      existingRound: writtenRound,
      fundingRoundIdentity,
    };
  }

  private async writeRoundEnrichment(
    candidate: NormalizedRoundCandidate,
    result: FundingImportDryRunResult
  ): Promise<RoundDecision | undefined> {
    const decision = await this.simulateRoundUpsert(candidate, result, {
      allowCreate: false,
    });
    if (!decision) return undefined;

    const update = await this.buildRoundEnrichmentUpdate(candidate);
    if (!Object.keys(update).length) {
      result.roundsSkipped += 1;
      this.recordSkipped(result, "round_enrich_no_fields", 1, {
        project: candidate.projectLabel,
        roundName: candidate.roundName,
        roundKey: candidate.roundKey,
        canonicalFingerprint: candidate.canonicalFingerprint,
      });
      return undefined;
    }

    const roundId = this.toObjectId(decision.fundingRoundIdentity);
    if (!roundId) {
      throw new Error(
        "Funding enrichment requires an existing fundingRoundId."
      );
    }

    const writtenRound = await this.fundingRoundModel
      .findOneAndUpdate(
        {
          _id: roundId,
          ...this.roundSourceScope(candidate.primarySource),
        },
        {
          $set: {
            ...update,
            primarySource: candidate.primarySource,
            sourceType: candidate.primarySource,
          },
        },
        { new: true }
      )
      .lean();

    if (
      !writtenRound ||
      !this.roundMatchesSource(writtenRound, candidate.primarySource)
    ) {
      throw new Error(
        "Funding enrichment refused to update a round outside the selected source."
      );
    }

    return {
      ...decision,
      existingRound: writtenRound,
      fundingRoundIdentity: roundId,
    };
  }

  private async buildRoundEnrichmentUpdate(
    candidate: NormalizedRoundCandidate
  ): Promise<Record<string, any>> {
    const platform = await this.ensureRoundPlatform(candidate);
    return cleanObject({
      tokensForSaleAmount: candidate.tokensForSaleAmount,
      tokensForSalePercent: candidate.tokensForSalePercent,
      roi: candidate.roi,
      platformId: platform?.platformId,
      platform,
    });
  }

  private async ensureRoundPlatform(
    candidate: NormalizedRoundCandidate
  ): Promise<NormalizedRoundPlatform | undefined> {
    if (!candidate.platform?.name) return undefined;
    const result = await this.fundingService.ensureFundingPlatform({
      ...candidate.platform,
      sourceType: candidate.platform.sourceType || candidate.primarySource,
      sourceUrl: candidate.platform.sourceUrl || candidate.sourceUrl,
      confidence: candidate.confidence,
      metadata: {
        importer: "fomo-v2:funding-import",
        sourceCollection: PARSER_COLLECTION,
        sourceDocumentId: candidate.projectIdentity.sourceDocumentId,
        sourceProjectId:
          candidate.projectIdentity.sourceProjectId ||
          candidate.projectIdentity.sourceId,
        sourceIndex: candidate.sourceIndex,
      },
    });
    if (!result?.doc) return candidate.platform;
    return this.normalizeRoundPlatform(
      {
        platformId: this.toObjectId((result.doc as any)._id),
        name: (result.doc as any).name,
        normalizedName: (result.doc as any).normalizedName,
        logoUrl: (result.doc as any).logoUrl,
        sourceType: (result.doc as any).sourceType,
        sourceId: (result.doc as any).sourceId,
        sourceUrl: (result.doc as any).sourceUrl,
      },
      candidate.primarySource,
      candidate.sourceUrl
    );
  }

  private async simulateParticipantUpsert(
    candidate: NormalizedParticipantCandidate,
    result: FundingImportDryRunResult
  ): Promise<"create" | "update_by_fingerprint" | "update_by_backer_id"> {
    if (!candidate.backerId) {
      throw new Error("funding_round_participant requires backerId");
    }

    const byFingerprint = await this.participantModel
      .findOne({ canonicalFingerprint: candidate.canonicalFingerprint })
      .lean();
    if (byFingerprint) {
      result.participantsWouldUpdateByFingerprint += 1;
      return "update_by_fingerprint";
    }

    const fundingRoundId = this.toObjectId(candidate.fundingRoundIdentity);
    if (fundingRoundId && candidate.backerId) {
      const byBackerId = await this.participantModel
        .findOne({
          fundingRoundId,
          backerId: candidate.backerId,
        })
        .lean();
      if (byBackerId) {
        result.participantsWouldUpdateByBackerId += 1;
        return "update_by_backer_id";
      }
    }

    result.participantsWouldCreate += 1;
    return "create";
  }

  private async writeParticipantUpsert(
    candidate: NormalizedParticipantCandidate,
    result: FundingImportDryRunResult
  ): Promise<"create" | "update_by_fingerprint" | "update_by_backer_id"> {
    if (!candidate.backerId) {
      throw new Error("funding_round_participant requires backerId");
    }
    const fundingRoundId = this.toObjectId(candidate.fundingRoundIdentity);
    if (!fundingRoundId) {
      throw new Error("funding_round_participant requires fundingRoundId");
    }
    const decision = await this.simulateParticipantUpsert(candidate, result);
    await this.fundingService.upsertFundingRoundParticipant({
      canonicalProjectId: candidate.canonicalProjectId,
      fundingRoundId,
      backerId: candidate.backerId,
      backerName: candidate.backerName,
      normalizedBackerName: candidate.normalizedBackerName,
      sourceBackerRef: candidate.sourceBackerRef,
      sourceBackerId: candidate.sourceBackerId,
      sourceBackerSlug: candidate.sourceBackerSlug,
      sourceBackerUrl: candidate.sourceBackerUrl,
      role: candidate.role,
      isLead: candidate.isLead,
      primarySource: candidate.primarySource,
      sourceRefs: candidate.sourceRefs as any,
      confidence: candidate.confidence,
      status: candidate.status,
      canonicalFingerprint: candidate.canonicalFingerprint,
      metadata: {
        ...candidate.metadata,
        importer: "fomo-v2:funding-import",
        dryRunOnly: false,
      },
    });
    return decision;
  }

  private normalizeRound(
    sourceRound: Record<string, any>,
    index: number,
    identity: ProjectIdentity,
    canonicalProjectId: Types.ObjectId,
    sourceType: string
  ): NormalizedRoundCandidate | null {
    if (!sourceRound || typeof sourceRound !== "object") return null;
    const roundName = cleanFundingString(
      sourceRound.roundName ||
        sourceRound.name ||
        sourceRound.stage ||
        sourceRound.type ||
        "Funding Round"
    );
    const roundType = normalizeFundingRoundType(
      sourceRound.stage || sourceRound.type || roundName
    );
    const normalizedRoundType = cleanFundingString(roundType) || "unknown";
    const normalizedRoundName =
      cleanFundingString(sourceRound.normalizedRoundName) ||
      normalizeFundingName(roundName);
    const announcedDate = toFundingDate(
      sourceRound.date ||
        sourceRound.announcedDate ||
        sourceRound.announceDate ||
        sourceRound.closedAt
    );
    const dateBucket = fundingDateBucket(
      announcedDate,
      sourceRound.date || sourceRound.dateBucket
    );
    const raisedAmount = this.firstNumber(
      sourceRound.raisedAmount,
      sourceRound.amount,
      sourceRound.amountUsd,
      sourceRound.fundsRaised,
      this.parseCurrencyNumber(sourceRound.amountFormatted)
    );
    const valuation = this.firstNumber(
      sourceRound.valuation,
      sourceRound.valuationUsd,
      sourceRound.preValuation,
      this.parseCurrencyNumber(sourceRound.valuationFormatted)
    );
    const tokenPrice = this.firstNumber(
      sourceRound.tokenPrice,
      sourceRound.tokenPriceUsd,
      sourceRound.price,
      this.parseCurrencyNumber(sourceRound.priceFormatted)
    );
    const tokensForSaleAmount = this.firstNumber(
      sourceRound.tokensForSaleAmount,
      sourceRound.tokenForSaleAmount
    );
    const tokensForSalePercent = this.firstNumber(
      sourceRound.tokensForSalePercent,
      sourceRound.totalSupplyPercent,
      this.parsePercentNumber(sourceRound.tokensForSalePercentFormatted)
    );
    const roi = this.normalizeRoundRoi(sourceRound.roi);
    const platform = this.normalizeRoundPlatform(
      sourceRound.platform || sourceRound.platformName,
      sourceType,
      sourceRound.sourceUrl
    );
    const sourceUrl =
      cleanFundingString(sourceRound.sourceUrl) || identity.sourceUrl;
    const projectKey = this.projectKey(identity);
    const roundKey = this.buildRoundKey({
      sourceType,
      projectKey,
      normalizedRoundType,
      normalizedRoundName,
      dateBucket,
      raisedAmount,
      index,
    });
    const sourceId =
      cleanFundingString(
        sourceRound.sourceId ||
          sourceRound.roundId ||
          sourceRound.id ||
          sourceRound.key
      ) || roundKey;
    const sourceRefs = [
      {
        source: sourceType,
        sourceId,
        sourceSlug: identity.sourceSlug,
        sourceUrl,
        sourcePath: `fundraisingRounds.${index}`,
        confidence: "high",
        metadata: {
          sourceDocumentId: identity.sourceDocumentId,
          sourceProjectId: identity.sourceProjectId || identity.sourceId,
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
      projectIdentity: identity,
      projectLabel: this.projectLabel(identity),
      sourceIndex: index,
      sourceRound,
      roundName,
      normalizedRoundName,
      roundType,
      normalizedRoundType,
      announcedDate,
      dateBucket,
      raisedAmount,
      raisedCurrency: raisedAmount === undefined ? undefined : "USD",
      valuation,
      tokenPrice,
      tokensForSaleAmount,
      tokensForSalePercent,
      roi,
      platform,
      primarySource: sourceType,
      sourceId,
      sourceUrl,
      sourceRefs,
      confidence: "high",
      status: normalizeFundingRoundStatus(sourceRound.status || "proposed"),
      metadata: {
        importer: "fomo-v2:funding-import-dry-run",
        sourceCollection: PARSER_COLLECTION,
        sourceDocumentId: identity.sourceDocumentId,
        sourceIndex: index,
        dryRunOnly: true,
      },
      roundKey,
      canonicalFingerprint,
    };
  }

  private normalizeParticipant(
    participant: ParticipantIdentity,
    round: NormalizedRoundCandidate,
    roundDecision: RoundDecision,
    backerResolution: BackerResolution,
    sourceType: string
  ): NormalizedParticipantCandidate | null {
    const backerName = cleanFundingString(participant.backerName);
    const normalizedBackerName =
      cleanFundingString(participant.normalizedBackerName) ||
      normalizeBackerName(backerName);
    if (!backerName || !normalizedBackerName) return null;

    const role = normalizeFundingParticipantRole(undefined, participant.isLead);
    const sourceBackerRef =
      participant.sourceBackerId ||
      participant.sourceBackerSlug ||
      participant.sourceBackerUrl;
    const fundingRoundIdentity = roundDecision.fundingRoundIdentity;
    const sourceRefs = [
      {
        source: sourceType,
        sourceId: participant.sourceBackerId,
        sourceSlug: participant.sourceBackerSlug,
        sourceUrl: participant.sourceBackerUrl || round.sourceUrl,
        sourcePath: `fundraisingRounds.${round.sourceIndex}`,
        confidence: "medium",
        metadata: {
          backerResolution: backerResolution.status,
          sourceDocumentId: round.projectIdentity.sourceDocumentId,
        },
      },
    ];
    const canonicalFingerprint = buildFundingRoundParticipantFingerprint({
      canonicalProjectId: round.canonicalProjectId,
      fundingRoundId: fundingRoundIdentity,
      backerId: backerResolution.backerId,
      backerName,
      normalizedBackerName,
      sourceBackerRef,
      sourceBackerId: participant.sourceBackerId,
      role,
    });

    return {
      canonicalProjectId: round.canonicalProjectId,
      fundingRoundIdentity,
      virtualRoundKey: round.roundKey,
      roundLabel: round.roundName || round.roundKey,
      projectLabel: round.projectLabel,
      backerId: backerResolution.backerId,
      backerName,
      normalizedBackerName,
      sourceBackerId: participant.sourceBackerId,
      sourceBackerSlug: participant.sourceBackerSlug,
      sourceBackerUrl: participant.sourceBackerUrl,
      sourceBackerRef,
      role,
      isLead: participant.isLead,
      primarySource: sourceType,
      sourceRefs,
      confidence: backerResolution.status === "resolved" ? "high" : "medium",
      status: "proposed",
      metadata: {
        importer: "fomo-v2:funding-import-dry-run",
        sourceCollection: PARSER_COLLECTION,
        sourceDocumentId: round.projectIdentity.sourceDocumentId,
        dryRunOnly: true,
        backerResolution: backerResolution.status,
      },
      canonicalFingerprint,
      backerResolution,
    };
  }

  private async resolveCanonicalProject(
    identity: ProjectIdentity,
    sourceType: string
  ): Promise<ProjectResolveResult> {
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
    const clauses = [
      ...this.idVariants(identity).map((sourceProjectId) => ({
        sourceProjectId,
      })),
      ...this.slugVariants(identity).map((sourceSlug) => ({ sourceSlug })),
      ...this.urlVariants(identity.sourceUrl).map((sourceUrl) => ({
        sourceUrl,
      })),
    ];
    if (!clauses.length) {
      return {
        matchedBy: "project_source_profiles",
        score: 0,
        reason: "No source identity values for project_source_profiles.",
      };
    }

    const rows = await this.projectSourceProfileModel
      .find({ sourceType, $or: clauses })
      .limit(25)
      .lean();

    return this.resolveUniqueCanonicalId(rows, "project_source_profiles", 1);
  }

  private async resolveBySourceRegistry(
    identity: ProjectIdentity,
    sourceType: string,
    model: Model<any>,
    matchedBy: string
  ): Promise<ProjectResolveResult> {
    const clauses = [
      ...this.idVariants(identity).map((sourceId) => ({ sourceId })),
      ...this.slugVariants(identity).map((sourceSlug) => ({ sourceSlug })),
      ...this.urlVariants(identity.sourceUrl).map((sourceUrl) => ({
        sourceUrl,
      })),
    ];
    if (!clauses.length) {
      return {
        matchedBy,
        score: 0,
        reason: `No source identity values for ${matchedBy}.`,
      };
    }

    const rows = await model
      .find({
        source: sourceType,
        canonicalProjectId: { $exists: true, $ne: null },
        $or: clauses,
      })
      .limit(25)
      .lean();

    return this.resolveUniqueCanonicalId(rows, matchedBy, 1);
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

  private async resolveBacker(
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

  private participantsFromRound(
    sourceRound: Record<string, any>
  ): ParticipantIdentity[] {
    const byKey = new Map<string, ParticipantIdentity>();
    const push = (value: any, isLead: boolean) => {
      const item = this.participantIdentity(value, isLead);
      if (!item.backerName && !item.sourceBackerId && !item.sourceBackerSlug)
        return;
      const key =
        item.normalizedBackerName ||
        item.sourceBackerId ||
        item.sourceBackerSlug ||
        item.sourceBackerUrl ||
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

    for (const investor of this.arrayValue(sourceRound?.investors)) {
      push(investor, false);
    }
    for (const investor of this.arrayValue(sourceRound?.leadInvestors)) {
      push(investor, true);
    }

    return Array.from(byKey.values()).map((item) => ({
      ...item,
      isLead: Boolean(item.isLead),
    }));
  }

  private participantIdentity(
    value: any,
    isLead: boolean
  ): ParticipantIdentity {
    const source = value && typeof value === "object" ? value : {};
    const backerName =
      typeof value === "string" || typeof value === "number"
        ? cleanFundingString(value)
        : cleanFundingString(
            source.name ||
              source.title ||
              source.investorName ||
              source.backerName ||
              source.label
          );
    return {
      backerName,
      normalizedBackerName: normalizeBackerName(backerName),
      sourceBackerId: cleanFundingString(
        source.sourceInvestorId ||
          source.sourceBackerId ||
          source.sourceId ||
          source.dropstabId ||
          source.id
      ),
      sourceBackerSlug: this.normalizeSlug(
        source.sourceSlug || source.slug || source.investorSlug
      ),
      sourceBackerUrl: this.normalizeUrl(
        source.sourceUrl || source.url || source.href
      ),
      isLead,
    };
  }

  private projectIdentity(sourceProject: Record<string, any>): ProjectIdentity {
    const raw = sourceProject.raw || sourceProject.rawIcoData || {};
    const sourceDocumentId = this.toIdString(sourceProject._id);
    const sourceProjectId = cleanFundingString(
      sourceProject.sourceProjectId ||
        sourceProject.sourceId ||
        sourceProject.coinId ||
        sourceProject.dropstabId ||
        sourceProject.capId ||
        raw.sourceProjectId ||
        raw.sourceId ||
        raw.coinId ||
        raw.dropstabId
    );
    const sourceId = cleanFundingString(
      sourceProject.sourceId || sourceProject.coinId
    );
    const rawSlug = cleanFundingString(
      sourceProject.sourceSlug ||
        sourceProject.coinSlug ||
        sourceProject.slug ||
        sourceProject.dropstabSlug ||
        raw.sourceSlug ||
        raw.coinSlug ||
        raw.slug ||
        raw.dropstabSlug
    );
    const sourceSlug = this.normalizeSlug(rawSlug || sourceProjectId);
    const sourceUrl =
      this.normalizeUrl(
        sourceProject.sourceUrl ||
          sourceProject.fundraising?.sourceUrl ||
          sourceProject.about?.sourceUrl ||
          sourceProject.description?.sourceUrl ||
          sourceProject.fundraisingRounds?.[0]?.sourceUrl ||
          raw.sourceUrl
      ) ||
      (sourceSlug
        ? `https://dropstab.com/coins/${encodeURIComponent(sourceSlug)}`
        : undefined);
    const name = cleanFundingString(
      sourceProject.name ||
        sourceProject.coinName ||
        sourceProject.title ||
        sourceProject.coin?.name ||
        raw.name ||
        raw.coinName
    );
    const symbol = cleanFundingString(
      sourceProject.symbol ||
        sourceProject.ticker ||
        sourceProject.coinSymbol ||
        sourceProject.coin?.symbol ||
        raw.symbol ||
        raw.ticker
    );
    const coingeckoId = this.normalizeProviderId(
      sourceProject.coingeckoId ||
        sourceProject.providerIds?.coingeckoId ||
        sourceProject.marketData?.coingeckoId ||
        raw.coingeckoId ||
        raw.providerIds?.coingeckoId
    );

    return {
      sourceDocumentId,
      sourceProjectId,
      sourceId,
      sourceSlug,
      rawSlug,
      sourceUrl,
      name,
      normalizedName: this.normalizeProjectName(name),
      symbol,
      normalizedSymbol: this.normalizeSymbol(symbol),
      coingeckoId,
    };
  }

  private async simulateProjectCandidate(
    identity: ProjectIdentity,
    sourceType: string,
    context: {
      write: boolean;
      debug: boolean;
      result: FundingImportDryRunResult;
      seenCandidateFingerprints: Set<string>;
    }
  ): Promise<void> {
    const candidate: FomoV2ImportCandidateInput & {
      domain: string;
      entityType: "project";
      sourceType: string;
    } = {
      domain: "funding",
      entityType: "project",
      sourceType,
      sourceId: identity.sourceProjectId || identity.sourceId,
      sourceSlug: identity.sourceSlug,
      sourceUrl: identity.sourceUrl,
      name: identity.name,
      symbol: identity.symbol,
      slug: identity.sourceSlug,
      normalizedName: identity.normalizedName,
      normalizedSymbol: identity.normalizedSymbol,
      normalizedSlug: identity.sourceSlug,
      payload: {
        sourceDocumentId: identity.sourceDocumentId,
        sourceProjectId: identity.sourceProjectId || identity.sourceId,
        sourceSlug: identity.sourceSlug,
        sourceUrl: identity.sourceUrl,
        name: identity.name,
        symbol: identity.symbol,
      },
      normalizedPayload: {
        normalizedName: identity.normalizedName,
        normalizedSymbol: identity.normalizedSymbol,
        normalizedSlug: identity.sourceSlug,
      },
    };
    await this.simulateImportCandidate(candidate, context, "project");
  }

  private async simulateBackerCandidate(
    participant: NormalizedParticipantCandidate,
    sourceType: string,
    context: {
      write: boolean;
      debug: boolean;
      result: FundingImportDryRunResult;
      seenCandidateFingerprints: Set<string>;
    }
  ): Promise<void> {
    const candidate: FomoV2ImportCandidateInput & {
      domain: string;
      entityType: "backer";
      sourceType: string;
    } = {
      domain: "funding",
      entityType: "backer",
      sourceType,
      sourceId: participant.sourceBackerId,
      sourceSlug: participant.sourceBackerSlug,
      sourceUrl: participant.sourceBackerUrl,
      sourcePath: participant.sourceRefs?.[0]?.sourcePath,
      name: participant.backerName,
      normalizedName: participant.normalizedBackerName,
      payload: {
        backerName: participant.backerName,
        sourceBackerId: participant.sourceBackerId,
        sourceBackerSlug: participant.sourceBackerSlug,
        sourceBackerUrl: participant.sourceBackerUrl,
        project: participant.projectLabel,
        round: participant.roundLabel,
      },
      normalizedPayload: {
        normalizedBackerName: participant.normalizedBackerName,
      },
    };
    await this.simulateImportCandidate(candidate, context, "backer");
  }

  private async simulateImportCandidate(
    candidate: FomoV2ImportCandidateInput & {
      domain: string;
      entityType: "project" | "backer";
      sourceType: string;
    },
    context: {
      write: boolean;
      debug: boolean;
      result: FundingImportDryRunResult;
      seenCandidateFingerprints: Set<string>;
    },
    entityType: "project" | "backer"
  ): Promise<void> {
    const candidateFingerprint = buildImportCandidateFingerprint(candidate);
    const alreadySeen =
      context.seenCandidateFingerprints.has(candidateFingerprint);
    if (!alreadySeen)
      context.seenCandidateFingerprints.add(candidateFingerprint);

    let existing: any;
    let action: "create" | "update";
    if (context.write) {
      const written = await this.importCandidateService.createOrUpdateCandidate(
        {
          ...candidate,
          candidateFingerprint,
          metadata: {
            ...(candidate.metadata || {}),
            importer: "fomo-v2:funding-import",
            dryRunOnly: false,
          },
        }
      );
      existing = written.created ? null : written.candidate;
      action = written.created ? "create" : "update";
    } else {
      existing = alreadySeen
        ? { candidateFingerprint }
        : await this.importCandidateModel
            .findOne({ candidateFingerprint })
            .lean();
      action = existing ? "update" : "create";
    }

    if (entityType === "project") {
      if (action === "update") context.result.projectCandidatesWouldUpdate += 1;
      else context.result.projectCandidatesWouldCreate += 1;
      this.pushDebug(
        context.debug,
        context.result.debugExamples?.projectCandidates,
        {
          action,
          candidateFingerprint,
          sourceType: candidate.sourceType,
          name: candidate.name,
          symbol: candidate.symbol,
          slug: candidate.slug || candidate.sourceSlug,
          normalizedName: candidate.normalizedName,
          normalizedSymbol: candidate.normalizedSymbol,
          normalizedSlug: candidate.normalizedSlug,
        }
      );
      return;
    }

    if (action === "update") context.result.backerCandidatesWouldUpdate += 1;
    else context.result.backerCandidatesWouldCreate += 1;
    this.pushDebug(
      context.debug,
      context.result.debugExamples?.backerCandidates,
      {
        action,
        candidateFingerprint,
        sourceType: candidate.sourceType,
        name: candidate.name,
        normalizedName: candidate.normalizedName,
        sourceId: candidate.sourceId,
        sourceSlug: candidate.sourceSlug,
      }
    );
  }

  private async recordReview(
    context: {
      write: boolean;
      result: FundingImportDryRunResult;
      seenReviewFingerprints: Set<string>;
    },
    input: {
      reason: string;
      sourceType: string;
      identity: ProjectIdentity;
      canonicalProjectId?: Types.ObjectId | string;
      currentSourceType?: string;
      projectKey?: string;
    }
  ): Promise<void> {
    const { result, seenReviewFingerprints } = context;
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
    if (seenReviewFingerprints.has(fingerprint)) return;
    seenReviewFingerprints.add(fingerprint);

    if (context.write) {
      const written = await this.writeReview(input, fingerprint, projectKey);
      if (written?.created) result.reviewsWouldCreate += 1;
      return;
    }

    const existing = await this.reviewBatchModel
      .findOne({ fingerprint, status: "open" })
      .lean();
    if (!existing) result.reviewsWouldCreate += 1;
  }

  private async writeReview(
    input: {
      reason: string;
      sourceType: string;
      identity: ProjectIdentity;
      canonicalProjectId?: Types.ObjectId | string;
      currentSourceType?: string;
      projectKey?: string;
    },
    fingerprint: string,
    projectKey?: string
  ): Promise<{ created: boolean } | undefined> {
    const candidates = this.projectReviewCandidates(input);
    const metadata = {
      importer: "fomo-v2:funding-import",
      sourceCollection: PARSER_COLLECTION,
      sourceDocumentId: input.identity.sourceDocumentId,
      sourceProjectId:
        input.identity.sourceProjectId || input.identity.sourceId,
      sourceSlug: input.identity.sourceSlug,
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

  private projectReviewCandidates(input: {
    reason: string;
    sourceType: string;
    identity: ProjectIdentity;
  }): FomoV2ReviewCandidateInput[] {
    return [
      {
        entityType: "project",
        sourceType: input.sourceType,
        sourceId: input.identity.sourceProjectId || input.identity.sourceId,
        sourceUrl: input.identity.sourceUrl,
        payload: {
          reason: input.reason,
          dropstab: this.dropstabDebugIdentity(input.identity),
        },
        normalizedPayload: {
          normalizedName: input.identity.normalizedName,
          normalizedSymbol: input.identity.normalizedSymbol,
          normalizedSlug: input.identity.sourceSlug,
        },
      },
    ];
  }

  private reviewAffectedEntityTypes(reason: string): string[] {
    if (reason === "BACKER_AMBIGUOUS")
      return ["funding_round_participant", "backer"];
    if (reason === "PARTICIPANT_VALIDATION_FAILED")
      return ["funding_round_participant"];
    if (reason === "ROUND_VALIDATION_FAILED") return ["funding_round"];
    if (reason === "POTENTIAL_PROJECT_MATCH")
      return ["canonical_project", "funding_round"];
    return ["funding_round"];
  }

  private reviewFingerprint(input: {
    reason: string;
    sourceType: string;
    identity: ProjectIdentity;
    canonicalProjectId?: Types.ObjectId | string;
    currentSourceType?: string;
    projectKey?: string;
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
      projectKey: input.projectKey,
      normalizedProjectName: input.identity.normalizedName,
      projectName: input.identity.name,
    });
  }

  private recordRoundDecision(
    result: FundingImportDryRunResult,
    candidate: NormalizedRoundCandidate,
    decision: RoundDecision,
    debug: boolean
  ): void {
    const example = {
      project: candidate.projectLabel,
      roundName: candidate.roundName,
      date: candidate.dateBucket,
      amount: candidate.raisedAmount,
      normalizedRoundType: candidate.normalizedRoundType,
      roundKey: candidate.roundKey,
      canonicalFingerprint: candidate.canonicalFingerprint,
      decision: decision.decision,
    };
    if (decision.decision === "create") {
      this.pushDebug(debug, result.debugExamples?.roundsWouldCreate, example);
    } else {
      this.pushDebug(debug, result.debugExamples?.roundsWouldUpdate, example);
    }
  }

  private roundInputKey(candidate: NormalizedRoundCandidate): string {
    return [
      this.toIdString(candidate.canonicalProjectId),
      candidate.canonicalFingerprint,
      candidate.sourceId || "",
      candidate.roundKey,
    ].join(":");
  }

  private participantInputKey(
    candidate: NormalizedParticipantCandidate
  ): string {
    const roundIdentity = this.toIdString(candidate.fundingRoundIdentity);
    const backerIdentity = this.toIdString(candidate.backerId) || "unknown";
    return [roundIdentity, backerIdentity, candidate.canonicalFingerprint].join(
      ":"
    );
  }

  private buildRoundKey(input: {
    sourceType: string;
    projectKey: string;
    normalizedRoundType?: string;
    normalizedRoundName?: string;
    dateBucket?: string;
    raisedAmount?: number;
    index: number;
  }): string {
    const parts = [
      input.sourceType,
      input.projectKey,
      input.normalizedRoundType || "unknown",
      input.dateBucket || "unknown_date",
      this.amountKey(input.raisedAmount),
      input.normalizedRoundName || "unknown_round",
      String(input.index),
    ];
    return parts.map((part) => this.keyPart(part)).join(":");
  }

  private parserCollection(): any {
    const db = (this.parserConnection as any).db;
    if (!db) {
      throw new Error("Parser DB connection is not initialized.");
    }
    return db.collection(PARSER_COLLECTION);
  }

  private snapshotCollection(): any {
    return this.parserDb().collection(PARSER_SNAPSHOT_COLLECTION);
  }

  private snapshotItemCollection(): any {
    return this.parserDb().collection(PARSER_SNAPSHOT_ITEM_COLLECTION);
  }

  private parserDb(): any {
    const db = (this.parserConnection as any).db;
    if (!db) {
      throw new Error("Parser DB connection is not initialized.");
    }
    return db;
  }

  private async validateSnapshot(
    snapshotId: string,
    sourceType: string,
    write = false,
    upstreamRunId?: string
  ): Promise<Record<string, any>> {
    const identities: Record<string, any>[] = [{ snapshotId }];
    if (Types.ObjectId.isValid(snapshotId)) {
      identities.push({ _id: new Types.ObjectId(snapshotId) });
    }
    const manifest = await this.snapshotCollection().findOne({
      $or: identities,
    });
    if (!manifest) {
      throw new Error(`Parser snapshot was not found: ${snapshotId}.`);
    }
    if (String(manifest.snapshotId || snapshotId) !== snapshotId) {
      throw new Error("Parser snapshot identity mismatch.");
    }
    if (String(manifest.parserKey || "") !== DROPSTAB_UPSTREAM_PARSER_KEY) {
      throw new Error(
        `Snapshot ${snapshotId} belongs to parser "${String(
          manifest.parserKey || "unknown"
        )}", expected "${DROPSTAB_UPSTREAM_PARSER_KEY}".`
      );
    }
    if (String(manifest.sourceType || "") !== sourceType) {
      throw new Error(
        `Snapshot ${snapshotId} sourceType mismatch: expected "${sourceType}", received "${String(
          manifest.sourceType || "unknown"
        )}".`
      );
    }
    if (String(manifest.status || "") !== "complete") {
      throw new Error(
        `Snapshot ${snapshotId} is not complete (status=${String(
          manifest.status || "unknown"
        )}).`
      );
    }
    if (write && String(manifest.environment || "") !== "prod") {
      throw new Error(
        `Snapshot ${snapshotId} cannot be written to FOMO DB because its environment is not prod.`
      );
    }
    if (
      upstreamRunId &&
      String(manifest.runId || manifest.upstreamRunId || "") !== upstreamRunId
    ) {
      throw new Error(`Snapshot ${snapshotId} upstream run mismatch.`);
    }
    const foreignItem = await this.snapshotItemCollection().findOne({
      snapshotId,
      status: "succeeded",
      $or: [
        { parserKey: { $ne: DROPSTAB_UPSTREAM_PARSER_KEY } },
        { sourceType: { $ne: sourceType } },
        { payload: { $not: { $type: "object" } } },
        { "payload.source": { $ne: sourceType } },
      ],
    });
    if (foreignItem) {
      throw new Error(
        `Snapshot ${snapshotId} contains a successful item from another parser/source.`
      );
    }
    return manifest;
  }

  private snapshotFundraisingRoundsQuery(
    snapshotId: string,
    projectFilter?: string
  ): Record<string, any> {
    return {
      snapshotId,
      status: "succeeded",
      parserKey: DROPSTAB_UPSTREAM_PARSER_KEY,
      sourceType: "dropstab",
      ...this.fundraisingRoundsQuery(projectFilter, "payload."),
    };
  }

  private snapshotItemPayload(
    item: Record<string, any>,
    snapshotId: string,
    sourceType: string
  ): Record<string, any> {
    if (
      String(item.snapshotId || "") !== snapshotId ||
      String(item.parserKey || "") !== DROPSTAB_UPSTREAM_PARSER_KEY ||
      String(item.sourceType || "") !== sourceType ||
      String(item.status || "") !== "succeeded"
    ) {
      throw new Error(`Snapshot item source mismatch for ${snapshotId}.`);
    }
    if (
      !item.payload ||
      typeof item.payload !== "object" ||
      Array.isArray(item.payload)
    ) {
      throw new Error(
        `Snapshot item ${String(item.entityKey || item._id)} has no payload.`
      );
    }
    if (
      String(item.payload.source || "")
        .trim()
        .toLowerCase() !== sourceType
    ) {
      throw new Error(
        `Snapshot item ${String(
          item.entityKey || item._id
        )} payload source mismatch for ${snapshotId}.`
      );
    }
    return item.payload;
  }

  private fundraisingRoundsQuery(
    projectFilter?: string,
    prefix = ""
  ): Record<string, any> {
    const query: Record<string, any> = {
      [`${prefix}fundraisingRounds`]: { $exists: true, $type: "array" },
      [`${prefix}fundraisingRounds.0`]: { $exists: true },
    };
    const text = cleanFundingString(projectFilter);
    if (!text) return query;
    const normalized = this.normalizeSlug(text);
    const regex = new RegExp(`^${this.escapeRegExp(text)}$`, "i");
    const normalizedRegex = normalized
      ? new RegExp(`^${this.escapeRegExp(normalized)}$`, "i")
      : regex;
    return {
      ...query,
      $or: [
        { [`${prefix}name`]: regex },
        { [`${prefix}coinName`]: regex },
        { [`${prefix}title`]: regex },
        { [`${prefix}symbol`]: regex },
        { [`${prefix}ticker`]: regex },
        { [`${prefix}coinSymbol`]: regex },
        { [`${prefix}sourceSlug`]: normalizedRegex },
        { [`${prefix}coinSlug`]: normalizedRegex },
        { [`${prefix}slug`]: normalizedRegex },
        { [`${prefix}dropstabSlug`]: normalizedRegex },
        { [`${prefix}sourceProjectId`]: regex },
        { [`${prefix}sourceId`]: regex },
        { [`${prefix}coinId`]: regex },
        { [`${prefix}dropstabId`]: regex },
        { [`${prefix}raw.name`]: regex },
        { [`${prefix}raw.coinName`]: regex },
        { [`${prefix}raw.sourceSlug`]: normalizedRegex },
        { [`${prefix}raw.coinSlug`]: normalizedRegex },
        { [`${prefix}raw.slug`]: normalizedRegex },
        { [`${prefix}raw.dropstabSlug`]: normalizedRegex },
        { [`${prefix}raw.sourceProjectId`]: regex },
        { [`${prefix}raw.sourceId`]: regex },
        { [`${prefix}raw.coinId`]: regex },
        { [`${prefix}raw.dropstabId`]: regex },
      ],
    };
  }

  private emptyResult(
    sourceType: string,
    debug: boolean,
    write = false,
    enrichOnly = false
  ): FundingImportDryRunResult {
    const result: FundingImportDryRunResult = {
      mode: write ? "write" : "dry-run",
      enrichOnly,
      sourceType,
      dbName: this.dbName(),
      parserDbName: this.parserDbName(),
      totalParserProjects: 0,
      projectsWithFundraisingRounds: 0,
      resolvedCanonicalProjects: 0,
      missingCanonicalProjects: 0,
      sourceLocksWouldCreate: 0,
      sourceLocksMatched: 0,
      sourceConflicts: 0,
      roundsFound: 0,
      roundsWouldCreate: 0,
      roundsWouldUpdateByFingerprint: 0,
      roundsWouldUpdateBySourceId: 0,
      roundsWouldUpdateByRoundKey: 0,
      roundsWouldUpdateByTypeDate: 0,
      roundsDuplicateInInput: 0,
      roundsSkipped: 0,
      participantsFound: 0,
      participantsWouldCreate: 0,
      participantsWouldUpdateByFingerprint: 0,
      participantsWouldUpdateByBackerId: 0,
      participantsWouldUpdateByBackerName: 0,
      participantsDuplicateInInput: 0,
      participantsSkipped: 0,
      participantsSkippedMissingBacker: 0,
      participantsSkippedAmbiguousBacker: 0,
      backersResolved: 0,
      backersMissing: 0,
      backersAmbiguous: 0,
      projectCandidatesWouldCreate: 0,
      projectCandidatesWouldUpdate: 0,
      backerCandidatesWouldCreate: 0,
      backerCandidatesWouldUpdate: 0,
      reviewsWouldCreate: 0,
      reviewsByReason: {},
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
        linkedProjects: [],
        missingCanonicalProject: [],
        sourceConflict: [],
        roundsWouldCreate: [],
        roundsWouldUpdate: [],
        participantsWouldCreate: [],
        participantsSkipped: [],
        backersResolved: [],
        backersMissing: [],
        backersAmbiguous: [],
        projectCandidates: [],
        backerCandidates: [],
      };
    }

    return result;
  }

  private recordSkipped(
    result: FundingImportDryRunResult,
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
      dropstab: this.dropstabDebugIdentity(identity),
      canonical: this.canonicalDebug(resolved.canonical),
      matchedBy: resolved.matchedBy,
      score: resolved.score,
    };
  }

  private dropstabDebugIdentity(
    identity: ProjectIdentity
  ): Record<string, any> {
    return {
      name: identity.name,
      symbol: identity.symbol,
      slug: identity.sourceSlug || identity.rawSlug,
      sourceUrl: identity.sourceUrl,
      sourceProjectId: identity.sourceProjectId || identity.sourceId,
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
    return this.uniqueStrings([
      identity.sourceProjectId,
      identity.sourceId,
      identity.sourceDocumentId,
    ]);
  }

  private slugVariants(identity: ProjectIdentity): string[] {
    return this.uniqueStrings([
      identity.sourceSlug,
      this.normalizeSlug(identity.rawSlug),
      this.normalizeSlug(identity.sourceProjectId),
    ]);
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

  private normalizeSourceType(value: any): string {
    return normalizeProjectSourceType(value || "dropstab");
  }

  private isSupportedSourceType(sourceType: string): boolean {
    return (SUPPORTED_SOURCE_TYPES as readonly string[]).includes(sourceType);
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

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

  private parseCurrencyNumber(value: any): number | undefined {
    const text = cleanFundingString(value);
    if (!text) return undefined;
    const normalized = text
      .replace(/,/g, "")
      .replace(/\s+/g, "")
      .replace(/[^0-9.+-]/g, "");
    if (!normalized) return undefined;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : undefined;
  }

  private parsePercentNumber(value: any): number | undefined {
    const text = cleanFundingString(value);
    if (!text) return undefined;
    const normalized = text.replace(/,/g, "").replace(/[^0-9.+-]/g, "");
    if (!normalized) return undefined;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : undefined;
  }

  private normalizeRoundRoi(value: any): NormalizedRoundRoi | undefined {
    if (!value || typeof value !== "object") return undefined;
    const roi = cleanObject({
      usd: this.firstNumber(value.usd, value.USD),
      btc: this.firstNumber(value.btc, value.BTC),
      eth: this.firstNumber(value.eth, value.ETH),
    });
    return Object.keys(roi).length ? roi : undefined;
  }

  private normalizeRoundPlatform(
    value: any,
    sourceType: string,
    fallbackSourceUrl?: string
  ): NormalizedRoundPlatform | undefined {
    if (!value) return undefined;
    const source = value && typeof value === "object" ? value : { name: value };
    const name = cleanFundingString(
      source.name || source.title || source.label
    );
    const normalizedName =
      cleanFundingString(source.normalizedName) || normalizeFundingName(name);
    if (!name || !normalizedName) return undefined;

    return cleanObject({
      platformId: this.toObjectId(source.platformId || source._id),
      name,
      normalizedName,
      logoUrl: cleanFundingString(
        source.logoUrl || source.logo || source.image
      ),
      sourceType: cleanFundingString(source.sourceType) || sourceType,
      sourceId: cleanFundingString(
        source.sourceId || source.platformId || source.dropstabId || source.id
      ),
      sourceUrl:
        this.normalizeUrl(source.sourceUrl || source.url) || fallbackSourceUrl,
    });
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
