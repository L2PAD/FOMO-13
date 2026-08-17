import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { FomoV2SourceSnapshot } from "../../../models";
import { FomoV2ImportCandidateService } from "../../import-candidates";
import { FomoV2ReviewService } from "../../review/services/review.service";
import { FomoV2ParserControlPolicyService } from "../../parser-control/services/parser-control-policy.service";
import {
  FomoV2ParserSnapshotReaderService,
  FomoV2ValidatedParserSnapshot,
} from "../../parser-control/services/parser-snapshot-reader.service";
import { FomoV2ReviewCandidateInput } from "../../review/types";
import {
  FomoV2ProjectDomainSourceService,
  normalizeProjectSourceType,
  projectSourceTypeMongoPattern,
} from "../../../shared/source-policy";
import {
  cleanVestingString,
  buildTokenAllocationFingerprint,
  buildVestingRoundFingerprint,
  buildVestingScheduleFingerprint,
  dropstabSourceProjectKey,
  dropstabVestingDatasetKey,
  dropstabVestingRelevantDataHash,
  dropstabVestingSourceContext,
  dropstabVestingProjectIdentity,
  normalizeDropstabSourceType,
  toDropstabObjectId,
  toDropstabVestingIdString,
} from "../helpers";
import {
  FomoV2TokenAllocation,
  FomoV2VestingRound,
  FomoV2VestingSchedule,
} from "../models";
import {
  FomoV2NormalizedAllocationCandidate,
  FomoV2NormalizedRoundCandidate,
  FomoV2NormalizedScheduleCandidate,
  FomoV2VestingCandidateNormalizerService,
} from "./vesting-candidate-normalizer.service";
import { FomoV2VestingDedupeService } from "./vesting-dedupe.service";
import { FomoV2VestingLinkingService } from "./vesting-linking.service";
import { FomoV2VestingSourceReaderService } from "./vesting-source-reader.service";
import { FomoV2VestingService } from "./vesting.service";

const DEBUG_LIMIT = 20;
const DROPSTAB_COIN_DETAILS_UPSTREAM_PARSER_KEY = "dropstab:coin-details";

interface FomoV2VestingScheduleRelationIssue {
  roundName?: string;
  saleId?: number | string;
  sourcePath?: string;
  allocationLinkStatus: "linked" | "missing" | "ambiguous";
  roundLinkStatus: "linked" | "missing" | "ambiguous";
  allocationMatchCount?: number;
  roundMatchCount?: number;
  missingAllocationId: boolean;
  missingRoundId: boolean;
}

interface FomoV2VestingResolvedCandidate<TCandidate = any> {
  candidate: TCandidate;
  id: Types.ObjectId;
}

interface FomoV2VestingRelationResolution {
  id?: Types.ObjectId;
  status: "linked" | "missing" | "ambiguous";
  matchCount: number;
}

interface FomoV2VestingRelationIndex {
  bySaleId: Map<string, Types.ObjectId[]>;
  byName: Map<string, Types.ObjectId[]>;
}

interface FomoV2VestingRelationIndexes {
  allocationRefs: Array<
    FomoV2VestingResolvedCandidate<FomoV2NormalizedAllocationCandidate>
  >;
  roundRefs: Array<FomoV2VestingResolvedCandidate<FomoV2NormalizedRoundCandidate>>;
  allocationIndex: FomoV2VestingRelationIndex;
  roundIndex: FomoV2VestingRelationIndex;
  allocationById: Map<string, FomoV2NormalizedAllocationCandidate>;
  roundById: Map<string, FomoV2NormalizedRoundCandidate>;
}

interface FomoV2VestingComponentCandidates {
  sourceProject: Record<string, any>;
  tokenAllocations: FomoV2NormalizedAllocationCandidate[];
  vestingRounds: FomoV2NormalizedRoundCandidate[];
  vestingSchedules: FomoV2NormalizedScheduleCandidate[];
  unlinkedTokenAllocations: FomoV2NormalizedAllocationCandidate[];
  unlinkedVestingRounds: FomoV2NormalizedRoundCandidate[];
  canonicalProjectId: Types.ObjectId;
}

interface FomoV2VestingComponentReviewContext {
  skipReason?: string;
  reviewReason?: string;
  reviewScope?: string;
  reasonText?: string;
  crossSourceConflicts?: Array<Record<string, any>>;
}

export interface FomoV2VestingAllocationScheduleImportOptions {
  sourceType?: string;
  limit?: number;
  all?: boolean;
  write?: boolean;
  writeCandidates?: boolean;
  debug?: boolean;
  sourceSlug?: string;
  sourceProjectKey?: string;
  canonicalProjectId?: string;
  snapshotId?: string;
  upstreamRunId?: string;
  upstreamParserKey?: string;
  /** In-process lease/policy fence supplied by the managed parser worker. */
  assertExecutionActive?: () => void | Promise<void>;
}

export interface FomoV2VestingAllocationScheduleImportResult {
  runner: "fomo-v2:vesting-allocation-schedule-import";
  mode: "dry-run" | "write";
  dbName: string;
  parserDbName: string;
  generatedAt: string;
  sourceType: string;
  scannedParserDocs: number;
  eligibleDocs: number;
  skippedByFilter: number;
  linkedCanonicalProjects: number;
  sourceOnlyProjects: number;
  ambiguousMatches: number;
  aliasMismatches: number;
  marketAssetLinked: number;
  marketAssetMissing: number;
  tokenAllocationsFound: number;
  tokenAllocationsWouldCreate: number;
  tokenAllocationsWouldUpdate: number;
  tokenAllocationsCreated: number;
  tokenAllocationsUpdated: number;
  tokenAllocationsUnchanged: number;
  vestingRoundsFound: number;
  vestingRoundsWouldCreate: number;
  vestingRoundsWouldUpdate: number;
  vestingRoundsCreated: number;
  vestingRoundsUpdated: number;
  vestingRoundsUnchanged: number;
  vestingSchedulesFound: number;
  vestingSchedulesWouldCreate: number;
  vestingSchedulesWouldUpdate: number;
  vestingSchedulesCreated: number;
  vestingSchedulesUpdated: number;
  vestingSchedulesUnchanged: number;
  vestingSchedulesSkippedMissingTokenAllocation: number;
  vestingSchedulesMissingTokenAllocationLink: number;
  vestingSchedulesSkippedMissingRound: number;
  vestingSchedulesMissingRoundLink: number;
  unlinkedTokenAllocationsFound: number;
  unlinkedVestingRoundsFound: number;
  existingVestingSourceConflicts: number;
  sourceLocksWouldCreate: number;
  sourceLocksCreated: number;
  sourceLockConflicts: number;
  duplicateGroups: number;
  reviewWorthyCases: number;
  reviewsWouldCreate: number;
  reviewsCreatedOrUpdated: number;
  importCandidatesWouldCreate: number;
  importCandidatesCreatedOrUpdated: number;
  beforeCounts: Record<string, number>;
  afterCounts: Record<string, number>;
  skipped: {
    total: number;
    byReason: Record<string, number>;
    examples?: Array<Record<string, any>>;
  };
  examples?: Record<string, Array<Record<string, any>>>;
  warnings: string[];
  errors: Array<Record<string, any>>;
  READ_ONLY?: "YES";
  WRITES_PERFORMED: number;
}

@Injectable()
export class FomoV2VestingAllocationScheduleImportService {
  constructor(
    private readonly configService: ConfigService,
    private readonly sourceReader: FomoV2VestingSourceReaderService,
    private readonly linkingService: FomoV2VestingLinkingService,
    private readonly normalizer: FomoV2VestingCandidateNormalizerService,
    private readonly dedupe: FomoV2VestingDedupeService,
    private readonly vestingService: FomoV2VestingService,
    private readonly importCandidateService: FomoV2ImportCandidateService,
    private readonly reviewService: FomoV2ReviewService,
    @InjectModel(FomoV2SourceSnapshot.name)
    private readonly sourceSnapshotModel: Model<FomoV2SourceSnapshot>,
    @InjectModel(FomoV2TokenAllocation.name)
    private readonly tokenAllocationModel: Model<FomoV2TokenAllocation>,
    @InjectModel(FomoV2VestingRound.name)
    private readonly vestingRoundModel: Model<FomoV2VestingRound>,
    @InjectModel(FomoV2VestingSchedule.name)
    private readonly vestingScheduleModel: Model<FomoV2VestingSchedule>,
    @Optional()
    private readonly projectDomainSourceService?: FomoV2ProjectDomainSourceService,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService,
    @Optional()
    private readonly snapshotReader?: FomoV2ParserSnapshotReaderService
  ) {}

  async run(
    options: FomoV2VestingAllocationScheduleImportOptions = {}
  ): Promise<FomoV2VestingAllocationScheduleImportResult> {
    const sourceType = normalizeDropstabSourceType(options.sourceType);
    const write = Boolean(options.write);
    if (write && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        `vesting:${sourceType}`
      );
    }
    await options.assertExecutionActive?.();
    const limit = options.all
      ? undefined
      : this.parsePositiveInteger(options.limit, 100);
    const result = this.emptyResult(sourceType, write, Boolean(options.debug));
    result.beforeCounts = await this.domainCounts();
    const sourceFilter = {
      sourceType,
      sourceSlug: options.sourceSlug,
      sourceProjectKey: options.sourceProjectKey,
    };
    const snapshot = await this.openSnapshot(options, sourceType, write);
    const payloadFilter = this.sourceReader.query(sourceFilter);
    result.eligibleDocs = snapshot
      ? await this.snapshotReader!.count(snapshot, payloadFilter)
      : await this.sourceReader.countEligible(sourceFilter);
    const cursor = snapshot
      ? this.snapshotReader!.cursor(snapshot, {
          payloadFilter,
          limit: options.all ? undefined : limit,
        })
      : this.sourceReader.findEligible({
          ...sourceFilter,
          limit,
          all: options.all,
        });

    for await (const sourceDocument of cursor as any) {
      await options.assertExecutionActive?.();
      const sourceProject = snapshot
        ? this.snapshotReader!.payload(snapshot, sourceDocument)
        : sourceDocument;
      await this.processSourceProject(sourceProject, options, result);
      await options.assertExecutionActive?.();
    }

    result.afterCounts = write ? await this.domainCounts() : result.beforeCounts;
    if (!write) result.READ_ONLY = "YES";
    return result;
  }

  private async openSnapshot(
    options: FomoV2VestingAllocationScheduleImportOptions,
    sourceType: string,
    write: boolean
  ): Promise<FomoV2ValidatedParserSnapshot | undefined> {
    const snapshotId = cleanVestingString(options.snapshotId);
    if (!snapshotId) return undefined;
    if (!this.snapshotReader) {
      throw new Error("Parser snapshot reader is not available.");
    }
    if (sourceType !== "dropstab") {
      throw new Error(
        'Vesting snapshot import requires sourceType="dropstab".'
      );
    }
    const parserKey =
      cleanVestingString(options.upstreamParserKey) ||
      DROPSTAB_COIN_DETAILS_UPSTREAM_PARSER_KEY;
    if (parserKey !== DROPSTAB_COIN_DETAILS_UPSTREAM_PARSER_KEY) {
      throw new Error(
        `Vesting snapshot import requires parser ${DROPSTAB_COIN_DETAILS_UPSTREAM_PARSER_KEY}.`
      );
    }
    return this.snapshotReader.validate({
      snapshotId,
      parserKey,
      sourceType,
      write,
      upstreamRunId: cleanVestingString(options.upstreamRunId),
    });
  }

  private async processSourceProject(
    sourceProject: Record<string, any>,
    options: FomoV2VestingAllocationScheduleImportOptions,
    result: FomoV2VestingAllocationScheduleImportResult
  ): Promise<void> {
    const sourceType = result.sourceType;
    const identity = dropstabVestingProjectIdentity(sourceProject);
    result.scannedParserDocs += 1;
    try {
      const link = await this.linkingService.resolveProject(
        sourceProject,
        sourceType
      );
      if (
        options.canonicalProjectId &&
        link.canonicalProjectIdString !== options.canonicalProjectId
      ) {
        result.skippedByFilter += 1;
        return;
      }

      if (link.status !== "linked" || !link.canonicalProjectId) {
        await this.handleUnlinkedProject(sourceProject, link, options, result);
        return;
      }
      result.linkedCanonicalProjects += 1;

      const marketAsset = await this.linkingService.resolveMarketAsset(
        link.canonicalProjectId
      );
      if (marketAsset.marketAssetId) result.marketAssetLinked += 1;
      else result.marketAssetMissing += 1;

      const sourceContext = dropstabVestingSourceContext({
        sourceProject,
        canonicalProjectId: link.canonicalProjectId,
        sourceType,
        sourceSnapshotId: await this.findSourceSnapshotId(
          sourceProject,
          link.canonicalProjectId,
          sourceType
        ),
        scope: "vesting_allocation_schedule",
      });
      const candidates = this.normalizer.normalizeAllocationScheduleCandidates({
        sourceProject,
        sourceContext,
        canonicalProjectId: link.canonicalProjectId,
        marketAssetId: marketAsset.marketAssetId,
        sourceType,
      });
      const allocationDedupe = this.dedupe.dedupeByCandidateKey(
        candidates.tokenAllocations
      );
      const roundDedupe = this.dedupe.dedupeByCandidateKey(
        candidates.vestingRounds
      );
      const scheduleDedupe = this.dedupe.dedupeByCandidateKey(
        candidates.vestingSchedules
      );
      const unlinkedAllocationDedupe = this.dedupe.dedupeByCandidateKey(
        candidates.unlinkedTokenAllocations
      );
      const unlinkedRoundDedupe = this.dedupe.dedupeByCandidateKey(
        candidates.unlinkedVestingRounds
      );
      this.recordDuplicateGroups(result, "token_allocation", allocationDedupe.duplicateGroups);
      this.recordDuplicateGroups(result, "vesting_round", roundDedupe.duplicateGroups);
      this.recordDuplicateGroups(result, "vesting_schedule", scheduleDedupe.duplicateGroups);
      this.recordDuplicateGroups(
        result,
        "unlinked_token_allocation",
        unlinkedAllocationDedupe.duplicateGroups
      );
      this.recordDuplicateGroups(
        result,
        "unlinked_vesting_round",
        unlinkedRoundDedupe.duplicateGroups
      );

      const component = {
        sourceProject,
        tokenAllocations: allocationDedupe.unique,
        vestingRounds: roundDedupe.unique,
        vestingSchedules: scheduleDedupe.unique,
        unlinkedTokenAllocations: unlinkedAllocationDedupe.unique,
        unlinkedVestingRounds: unlinkedRoundDedupe.unique,
        canonicalProjectId: link.canonicalProjectId,
      };

      const relationIssues = this.collectScheduleRelationIssues(component);
      const crossSourceConflicts = await this.findCrossSourceConflicts(
        component,
        sourceType
      );
      const currentSourceLock =
        await this.projectDomainSourceService?.getLock(
          component.canonicalProjectId,
          "vesting"
        );
      if (
        currentSourceLock &&
        normalizeDropstabSourceType(currentSourceLock.selectedSourceType) !==
          sourceType
      ) {
        crossSourceConflicts.unshift({
          reason: "project_domain_source_lock",
          currentSourceType: currentSourceLock.selectedSourceType,
          incomingSourceType: sourceType,
          domain: "vesting",
        });
      }
      if (
        await this.rejectSourceConflicts(
          component,
          relationIssues,
          crossSourceConflicts,
          result,
          options
        )
      ) {
        return;
      }
      if (
        relationIssues.length ||
        component.unlinkedTokenAllocations.length ||
        component.unlinkedVestingRounds.length
      ) {
        this.recordVestingComponentReviewRequired(
          component,
          relationIssues,
          result,
          { skipReason: "vesting_component_review_required" }
        );
        await this.handleVestingComponentRelationReview(
          component,
          relationIssues,
          result,
          options
        );
        return;
      }

      if (!currentSourceLock) result.sourceLocksWouldCreate += 1;
      if (options.write && this.projectDomainSourceService) {
        const sourceLock = await this.projectDomainSourceService.ensureLock({
          canonicalProjectId: component.canonicalProjectId,
          domain: "vesting",
          sourceType,
          reason: "vesting_allocation_schedule_import",
          metadata: {
            importer: "fomo-v2:vesting-allocation-schedule-import",
            sourceDocumentId: dropstabVestingProjectIdentity(sourceProject)
              .sourceDocumentId,
          },
        });
        if (!sourceLock.allowed) {
          await this.rejectSourceConflicts(
            component,
            relationIssues,
            [
              {
                reason: "project_domain_source_lock_race",
                currentSourceType: sourceLock.currentSourceType,
                incomingSourceType: sourceType,
                domain: "vesting",
              },
            ],
            result,
            options
          );
          return;
        }
        if (sourceLock.action === "created_lock") {
          result.sourceLocksCreated += 1;
          result.WRITES_PERFORMED += 1;
        }
      }

      const allocationRefs = await this.processAllocations(
        component.tokenAllocations,
        result,
        Boolean(options.write)
      );
      const roundRefs = await this.processRounds(
        component.vestingRounds,
        result,
        Boolean(options.write)
      );
      await this.processSchedules(
        component.vestingSchedules,
        allocationRefs,
        roundRefs,
        component,
        result,
        options,
        Boolean(options.write)
      );
    } catch (error: any) {
      result.errors.push({
        sourceSlug: identity.sourceSlug,
        sourceProjectKey: dropstabSourceProjectKey(identity),
        message: error?.message || String(error),
      });
    }
  }

  private async processAllocations(
    candidates: FomoV2NormalizedAllocationCandidate[],
    result: FomoV2VestingAllocationScheduleImportResult,
    write: boolean
  ): Promise<
    Array<FomoV2VestingResolvedCandidate<FomoV2NormalizedAllocationCandidate>>
  > {
    const resolved: Array<
      FomoV2VestingResolvedCandidate<FomoV2NormalizedAllocationCandidate>
    > = [];
    for (const candidate of candidates) {
      result.tokenAllocationsFound += 1;
      const existing = await this.findExistingAllocation(candidate);
      if (existing && this.isSourceCandidateUnchanged(existing, candidate)) {
        result.tokenAllocationsUnchanged += 1;
        const existingId = toDropstabObjectId((existing as any)?._id);
        if (existingId) resolved.push({ candidate, id: existingId });
        continue;
      }
      if (existing) result.tokenAllocationsWouldUpdate += 1;
      else result.tokenAllocationsWouldCreate += 1;
      if (!write) {
        resolved.push({
          candidate,
          id: toDropstabObjectId((existing as any)?._id) || new Types.ObjectId(),
        });
        continue;
      }
      const written = await this.vestingService.upsertTokenAllocation(candidate);
      const docId = toDropstabObjectId((written.doc as any)?._id);
      if (docId) resolved.push({ candidate, id: docId });
      if (written.created) result.tokenAllocationsCreated += 1;
      else result.tokenAllocationsUpdated += 1;
      result.WRITES_PERFORMED += 1;
    }
    return resolved;
  }

  private async processRounds(
    candidates: FomoV2NormalizedRoundCandidate[],
    result: FomoV2VestingAllocationScheduleImportResult,
    write: boolean
  ): Promise<
    Array<FomoV2VestingResolvedCandidate<FomoV2NormalizedRoundCandidate>>
  > {
    const resolved: Array<
      FomoV2VestingResolvedCandidate<FomoV2NormalizedRoundCandidate>
    > = [];
    for (const candidate of candidates) {
      result.vestingRoundsFound += 1;
      const existing = await this.findExistingRound(candidate);
      if (existing && this.isSourceCandidateUnchanged(existing, candidate)) {
        result.vestingRoundsUnchanged += 1;
        const existingId = toDropstabObjectId((existing as any)?._id);
        if (existingId) resolved.push({ candidate, id: existingId });
        continue;
      }
      if (existing) result.vestingRoundsWouldUpdate += 1;
      else result.vestingRoundsWouldCreate += 1;
      if (!write) {
        resolved.push({
          candidate,
          id: toDropstabObjectId((existing as any)?._id) || new Types.ObjectId(),
        });
        continue;
      }
      const written = await this.vestingService.upsertVestingRound(candidate);
      const docId = toDropstabObjectId((written.doc as any)?._id);
      if (docId) resolved.push({ candidate, id: docId });
      if (written.created) result.vestingRoundsCreated += 1;
      else result.vestingRoundsUpdated += 1;
      result.WRITES_PERFORMED += 1;
    }
    return resolved;
  }

  private async processSchedules(
    candidates: FomoV2NormalizedScheduleCandidate[],
    allocationRefs: Array<
      FomoV2VestingResolvedCandidate<FomoV2NormalizedAllocationCandidate>
    >,
    roundRefs: Array<
      FomoV2VestingResolvedCandidate<FomoV2NormalizedRoundCandidate>
    >,
    component: FomoV2VestingComponentCandidates,
    result: FomoV2VestingAllocationScheduleImportResult,
    options: FomoV2VestingAllocationScheduleImportOptions,
    write: boolean
  ): Promise<void> {
    const relationIssues: FomoV2VestingScheduleRelationIssue[] = [];
    const allocationIndex = this.buildAllocationRelationIndex(allocationRefs);
    const roundIndex = this.buildRoundRelationIndex(roundRefs);
    for (const candidate of candidates) {
      result.vestingSchedulesFound += 1;
      const allocationResolution = this.resolveAllocationId(
        candidate,
        allocationIndex
      );
      const roundResolution = this.resolveRoundId(candidate, roundIndex);
      const allocationId = allocationResolution.id;
      const roundId = roundResolution.id;

      if (allocationResolution.status !== "linked") {
        result.vestingSchedulesMissingTokenAllocationLink += 1;
        this.pushExample(result, "allocationLinkMissing", {
          roundName: candidate.roundName,
          saleId: candidate.saleId,
          canonicalProjectId: toDropstabVestingIdString(candidate.canonicalProjectId),
          vestingDatasetKey: candidate.vestingDatasetKey,
          sourcePath: candidate.sourcePath,
          status: allocationResolution.status,
          matchCount: allocationResolution.matchCount,
        });
      }
      if (roundResolution.status !== "linked") {
        result.vestingSchedulesMissingRoundLink += 1;
        this.pushExample(result, "roundLinkMissing", {
          roundName: candidate.roundName,
          saleId: candidate.saleId,
          canonicalProjectId: toDropstabVestingIdString(candidate.canonicalProjectId),
          vestingDatasetKey: candidate.vestingDatasetKey,
          sourcePath: candidate.sourcePath,
          status: roundResolution.status,
          matchCount: roundResolution.matchCount,
        });
      }

      if (!allocationId || !roundId) {
        if (!allocationId) result.vestingSchedulesSkippedMissingTokenAllocation += 1;
        if (!roundId) result.vestingSchedulesSkippedMissingRound += 1;
        this.recordSkipped(result, "schedule_missing_required_relation", 1, {
          roundName: candidate.roundName,
          saleId: candidate.saleId,
          sourcePath: candidate.sourcePath,
          missingAllocationId: !allocationId,
          missingRoundId: !roundId,
          allocationLinkStatus: allocationResolution.status,
          roundLinkStatus: roundResolution.status,
          allocationMatchCount: allocationResolution.matchCount,
          roundMatchCount: roundResolution.matchCount,
          canonicalProjectId: toDropstabVestingIdString(candidate.canonicalProjectId),
        });
        relationIssues.push({
          roundName: candidate.roundName,
          saleId: candidate.saleId,
          sourcePath: candidate.sourcePath,
          allocationLinkStatus: allocationResolution.status,
          roundLinkStatus: roundResolution.status,
          allocationMatchCount: allocationResolution.matchCount,
          roundMatchCount: roundResolution.matchCount,
          missingAllocationId: !allocationId,
          missingRoundId: !roundId,
        });
        continue;
      }

      const payload = {
        ...candidate,
        tokenAllocationId: allocationId,
        vestingRoundId: roundId,
        provenance: {
          ...(candidate.provenance || {}),
          allocationLinkStatus: "linked",
          roundLinkStatus: "linked",
        },
        metadata: {
          ...(candidate.metadata || {}),
          allocationLinkStatus: "linked",
          roundLinkStatus: "linked",
        },
      };
      const existing = await this.findExistingSchedule(payload);
      if (
        existing &&
        this.isSourceCandidateUnchanged(existing, payload, [
          "tokenAllocationId",
          "vestingRoundId",
        ])
      ) {
        result.vestingSchedulesUnchanged += 1;
        continue;
      }
      if (existing) result.vestingSchedulesWouldUpdate += 1;
      else result.vestingSchedulesWouldCreate += 1;
      if (!write) continue;
      const written = await this.vestingService.upsertVestingSchedule(payload);
      if (written.created) result.vestingSchedulesCreated += 1;
      else result.vestingSchedulesUpdated += 1;
      result.WRITES_PERFORMED += 1;
    }

    if (relationIssues.length) {
      await this.handleVestingComponentRelationReview(
        component,
        relationIssues,
        result,
        options
      );
    }
  }

  private collectScheduleRelationIssues(
    component: FomoV2VestingComponentCandidates
  ): FomoV2VestingScheduleRelationIssue[] {
    const indexes = this.buildInMemoryRelationIndexes(component);
    const issues: FomoV2VestingScheduleRelationIssue[] = [];
    for (const candidate of component.vestingSchedules) {
      const allocationResolution = this.resolveAllocationId(
        candidate,
        indexes.allocationIndex
      );
      const roundResolution = this.resolveRoundId(candidate, indexes.roundIndex);
      if (
        allocationResolution.status === "linked" &&
        roundResolution.status === "linked"
      ) {
        continue;
      }
      issues.push({
        roundName: candidate.roundName,
        saleId: candidate.saleId,
        sourcePath: candidate.sourcePath,
        allocationLinkStatus: allocationResolution.status,
        roundLinkStatus: roundResolution.status,
        allocationMatchCount: allocationResolution.matchCount,
        roundMatchCount: roundResolution.matchCount,
        missingAllocationId: allocationResolution.status !== "linked",
        missingRoundId: roundResolution.status !== "linked",
      });
    }
    return issues;
  }

  private buildInMemoryRelationIndexes(
    component: FomoV2VestingComponentCandidates
  ): FomoV2VestingRelationIndexes {
    const allocationRefs = component.tokenAllocations.map((candidate) => ({
      candidate,
      id: new Types.ObjectId(),
    }));
    const roundRefs = component.vestingRounds.map((candidate) => ({
      candidate,
      id: new Types.ObjectId(),
    }));
    return {
      allocationRefs,
      roundRefs,
      allocationIndex: this.buildAllocationRelationIndex(allocationRefs),
      roundIndex: this.buildRoundRelationIndex(roundRefs),
      allocationById: new Map(
        allocationRefs.map((ref) => [ref.id.toHexString(), ref.candidate])
      ),
      roundById: new Map(
        roundRefs.map((ref) => [ref.id.toHexString(), ref.candidate])
      ),
    };
  }

  private recordVestingComponentReviewRequired(
    component: FomoV2VestingComponentCandidates,
    relationIssues: FomoV2VestingScheduleRelationIssue[],
    result: FomoV2VestingAllocationScheduleImportResult,
    context: FomoV2VestingComponentReviewContext = {}
  ): void {
    const tokenAllocationCount =
      component.tokenAllocations.length + component.unlinkedTokenAllocations.length;
    const vestingRoundCount =
      component.vestingRounds.length + component.unlinkedVestingRounds.length;
    const vestingScheduleCount = component.vestingSchedules.length;
    const affectedEntityCount =
      tokenAllocationCount + vestingRoundCount + vestingScheduleCount;

    result.tokenAllocationsFound += tokenAllocationCount;
    result.vestingRoundsFound += vestingRoundCount;
    result.vestingSchedulesFound += vestingScheduleCount;
    result.unlinkedTokenAllocationsFound += component.unlinkedTokenAllocations.length;
    result.unlinkedVestingRoundsFound += component.unlinkedVestingRounds.length;
    result.vestingSchedulesSkippedMissingTokenAllocation +=
      relationIssues.filter((issue) => issue.missingAllocationId).length;
    result.vestingSchedulesMissingTokenAllocationLink +=
      relationIssues.filter((issue) => issue.missingAllocationId).length;
    result.vestingSchedulesSkippedMissingRound += relationIssues.filter(
      (issue) => issue.missingRoundId
    ).length;
    result.vestingSchedulesMissingRoundLink += relationIssues.filter(
      (issue) => issue.missingRoundId
    ).length;

    for (const issue of relationIssues) {
      if (issue.missingAllocationId) {
        this.pushExample(result, "allocationLinkMissing", {
          roundName: issue.roundName,
          saleId: issue.saleId,
          canonicalProjectId: toDropstabVestingIdString(
            component.canonicalProjectId
          ),
          sourcePath: issue.sourcePath,
          status: issue.allocationLinkStatus,
          matchCount: issue.allocationMatchCount,
        });
      }
      if (issue.missingRoundId) {
        this.pushExample(result, "roundLinkMissing", {
          roundName: issue.roundName,
          saleId: issue.saleId,
          canonicalProjectId: toDropstabVestingIdString(
            component.canonicalProjectId
          ),
          sourcePath: issue.sourcePath,
          status: issue.roundLinkStatus,
          matchCount: issue.roundMatchCount,
        });
      }
    }

    this.recordSkipped(
      result,
      context.skipReason || "vesting_component_review_required",
      affectedEntityCount,
      {
        canonicalProjectId: toDropstabVestingIdString(
          component.canonicalProjectId
        ),
        tokenAllocationCount,
        vestingRoundCount,
        scheduleCount: vestingScheduleCount,
        unlinkedTokenAllocationCount: component.unlinkedTokenAllocations.length,
        unlinkedVestingRoundCount: component.unlinkedVestingRounds.length,
        relationIssueCount: relationIssues.length,
        missingAllocationId: relationIssues.filter(
          (issue) => issue.missingAllocationId
        ).length,
        missingRoundId: relationIssues.filter((issue) => issue.missingRoundId)
          .length,
        crossSourceConflicts: context.crossSourceConflicts,
      }
    );
  }

  private buildAllocationRelationIndex(
    refs: Array<
      FomoV2VestingResolvedCandidate<FomoV2NormalizedAllocationCandidate>
    >
  ): FomoV2VestingRelationIndex {
    const index = this.emptyRelationIndex();
    for (const ref of refs) {
      this.addRelationIndexValue(index.bySaleId, ref.candidate.saleId, ref.id);
      this.addRelationIndexValue(
        index.byName,
        ref.candidate.normalizedName,
        ref.id
      );
    }
    return index;
  }

  private buildRoundRelationIndex(
    refs: Array<FomoV2VestingResolvedCandidate<FomoV2NormalizedRoundCandidate>>
  ): FomoV2VestingRelationIndex {
    const index = this.emptyRelationIndex();
    for (const ref of refs) {
      this.addRelationIndexValue(index.bySaleId, ref.candidate.saleId, ref.id);
      this.addRelationIndexValue(
        index.byName,
        ref.candidate.normalizedRoundName,
        ref.id
      );
    }
    return index;
  }

  private resolveAllocationId(
    candidate: FomoV2NormalizedScheduleCandidate,
    index: FomoV2VestingRelationIndex
  ): FomoV2VestingRelationResolution {
    return this.resolveRelationId(
      index,
      candidate.saleId,
      candidate.normalizedRoundName
    );
  }

  private resolveRoundId(
    candidate: FomoV2NormalizedScheduleCandidate,
    index: FomoV2VestingRelationIndex
  ): FomoV2VestingRelationResolution {
    return this.resolveRelationId(
      index,
      candidate.saleId,
      candidate.normalizedRoundName
    );
  }

  private resolveRelationId(
    index: FomoV2VestingRelationIndex,
    saleId?: number | string,
    normalizedName?: string
  ): FomoV2VestingRelationResolution {
    const bySaleId = this.relationIndexValues(index.bySaleId, saleId);
    if (bySaleId.length === 1) {
      return { id: bySaleId[0], status: "linked", matchCount: 1 };
    }
    if (bySaleId.length > 1) {
      return { status: "ambiguous", matchCount: bySaleId.length };
    }

    const byName = this.relationIndexValues(index.byName, normalizedName);
    if (byName.length === 1) {
      return { id: byName[0], status: "linked", matchCount: 1 };
    }
    if (byName.length > 1) {
      return { status: "ambiguous", matchCount: byName.length };
    }

    return { status: "missing", matchCount: 0 };
  }

  private emptyRelationIndex(): FomoV2VestingRelationIndex {
    return {
      bySaleId: new Map<string, Types.ObjectId[]>(),
      byName: new Map<string, Types.ObjectId[]>(),
    };
  }

  private addRelationIndexValue(
    map: Map<string, Types.ObjectId[]>,
    value: unknown,
    id: Types.ObjectId
  ): void {
    const key = this.relationIndexKey(value);
    if (!key) return;
    const values = map.get(key) || [];
    if (!values.some((existing) => existing.equals(id))) values.push(id);
    map.set(key, values);
  }

  private relationIndexValues(
    map: Map<string, Types.ObjectId[]>,
    value: unknown
  ): Types.ObjectId[] {
    const key = this.relationIndexKey(value);
    return key ? map.get(key) || [] : [];
  }

  private relationIndexKey(value: unknown): string | undefined {
    const normalized = cleanVestingString(value);
    return normalized ? normalized.toLowerCase() : undefined;
  }

  private async handleVestingComponentRelationReview(
    component: FomoV2VestingComponentCandidates,
    relationIssues: FomoV2VestingScheduleRelationIssue[],
    result: FomoV2VestingAllocationScheduleImportResult,
    options: FomoV2VestingAllocationScheduleImportOptions,
    context: FomoV2VestingComponentReviewContext = {}
  ): Promise<void> {
    const identity = dropstabVestingProjectIdentity(component.sourceProject);
    result.reviewWorthyCases += 1;
    result.reviewsWouldCreate += 1;
    result.importCandidatesWouldCreate += 1;
    const issueSummary = this.vestingComponentIssueSummary(
      component,
      relationIssues
    );
    this.pushExample(result, "vestingComponentReview", {
      sourceSlug: identity.sourceSlug,
      sourceProjectKey: dropstabSourceProjectKey(identity),
      canonicalProjectId: toDropstabVestingIdString(component.canonicalProjectId),
      reviewScope: context.reviewScope || "whole_vesting_component",
      ...issueSummary,
      crossSourceConflicts: context.crossSourceConflicts,
    });

    if (!options.write) return;

    const reviewCandidate = this.vestingComponentReviewCandidate(
      component,
      relationIssues,
      result.sourceType,
      context
    );
    await this.reviewService.createOrUpdateBatch({
      domain: "vesting",
      reason: context.reviewReason || "MISSING_REQUIRED_RELATION",
      canonicalProjectId: component.canonicalProjectId,
      currentSourceType: cleanVestingString(
        context.crossSourceConflicts?.[0]?.currentSourceType ||
          context.crossSourceConflicts?.[0]?.incomingSourceType
      ),
      incomingSourceType: result.sourceType,
      projectKey: dropstabSourceProjectKey(identity),
      projectName: identity.name,
      normalizedProjectName: identity.normalizedName,
      affectedEntityTypes: [
        "vesting_component",
        "token_allocation",
        "vesting_round",
        "vesting_schedule",
      ],
      candidateCount: issueSummary.affectedEntityCount,
      candidates: [reviewCandidate],
      metadata: {
        importer: "fomo-v2:vesting-allocation-schedule-import",
        reviewScope: context.reviewScope || "whole_vesting_component",
        reason:
          context.reasonText ||
          "Vesting relation conflict or missing relation detected; all source vesting rows require admin review before write.",
        ...issueSummary,
        crossSourceConflicts: context.crossSourceConflicts,
      },
    });
    result.reviewsCreatedOrUpdated += 1;
    result.WRITES_PERFORMED += 1;

    await this.createRawVestingComponentImportCandidate(
      component,
      relationIssues,
      result,
      context
    );
  }

  private vestingComponentReviewCandidate(
    component: FomoV2VestingComponentCandidates,
    relationIssues: FomoV2VestingScheduleRelationIssue[],
    sourceType: string,
    context: FomoV2VestingComponentReviewContext = {}
  ): FomoV2ReviewCandidateInput {
    const identity = dropstabVestingProjectIdentity(component.sourceProject);
    return {
      entityType: "vesting_component",
      sourceType,
      sourceId: identity.sourceProjectId || identity.sourceId,
      sourcePath: identity.sourceDocumentId,
      sourceUrl: identity.sourceUrl,
      payload: this.vestingComponentReviewPayload(
        component,
        relationIssues,
        context
      ),
      normalizedPayload: {
        normalizedName: identity.normalizedName,
        normalizedSymbol: identity.normalizedSymbol,
        normalizedSlug: identity.sourceSlug,
      },
      metadata: {
        importer: "fomo-v2:vesting-allocation-schedule-import",
        reviewScope: context.reviewScope || "whole_vesting_component",
        ...this.vestingComponentIssueSummary(component, relationIssues),
        crossSourceConflicts: context.crossSourceConflicts,
        suggestedAction: "review_and_create_vesting_records",
      },
    };
  }

  private async createRawVestingComponentImportCandidate(
    component: FomoV2VestingComponentCandidates,
    relationIssues: FomoV2VestingScheduleRelationIssue[],
    result: FomoV2VestingAllocationScheduleImportResult,
    context: FomoV2VestingComponentReviewContext = {}
  ): Promise<void> {
    const identity = dropstabVestingProjectIdentity(component.sourceProject);
    await this.importCandidateService.createOrUpdateCandidate({
      domain: "vesting",
      entityType: "vesting_component",
      sourceType: result.sourceType,
      sourceId: identity.sourceProjectId || identity.sourceId,
      sourceSlug: identity.sourceSlug,
      sourceUrl: identity.sourceUrl,
      sourcePath: identity.sourceDocumentId,
      name: identity.name,
      symbol: identity.symbol,
      slug: identity.sourceSlug,
      normalizedName: identity.normalizedName,
      normalizedSymbol: identity.normalizedSymbol,
      normalizedSlug: identity.sourceSlug,
      payload: this.vestingComponentReviewPayload(
        component,
        relationIssues,
        context
      ),
      normalizedPayload: {
        normalizedName: identity.normalizedName,
        normalizedSymbol: identity.normalizedSymbol,
        normalizedSlug: identity.sourceSlug,
      },
      metadata: {
        importer: "fomo-v2:vesting-allocation-schedule-import",
        reviewScope: context.reviewScope || "whole_vesting_component",
        ...this.vestingComponentIssueSummary(component, relationIssues),
        crossSourceConflicts: context.crossSourceConflicts,
        suggestedAction: "review_and_create_vesting_records",
      },
    });
    result.importCandidatesCreatedOrUpdated += 1;
    result.WRITES_PERFORMED += 1;
  }

  private async handleUnlinkedProject(
    sourceProject: Record<string, any>,
    link: any,
    options: FomoV2VestingAllocationScheduleImportOptions,
    result: FomoV2VestingAllocationScheduleImportResult
  ): Promise<void> {
    const identity = dropstabVestingProjectIdentity(sourceProject);
    if (link.status === "source_only") {
      result.sourceOnlyProjects += 1;
      result.reviewWorthyCases += 1;
    }
    if (link.status === "ambiguous") {
      result.ambiguousMatches += 1;
      result.reviewWorthyCases += 1;
    }
    if (link.status === "alias_mismatch") {
      result.aliasMismatches += 1;
      result.reviewWorthyCases += 1;
    }

    const candidates = this.projectReviewCandidates(
      sourceProject,
      link,
      result.sourceType
    );
    if (link.status !== "linked") {
      result.reviewsWouldCreate += 1;
      if (options.write) {
        await this.reviewService.createOrUpdateBatch({
          domain: "vesting",
          reason: "POTENTIAL_PROJECT_MATCH",
          incomingSourceType: result.sourceType,
          projectKey: dropstabSourceProjectKey(identity),
          projectName: identity.name,
          normalizedProjectName: identity.normalizedName,
          affectedEntityTypes: [
            "token_allocation",
            "vesting_round",
            "vesting_schedule",
          ],
          candidates,
          candidateCount: candidates.length,
          metadata: {
            importer: "fomo-v2:vesting-allocation-schedule-import",
            projectLinkStatus: link.status,
            reason: link.reason,
            sourceOnlyIsExpectedCoverageGap: link.status === "source_only",
          },
        });
        result.reviewsCreatedOrUpdated += 1;
        result.WRITES_PERFORMED += 1;
      }
      if (options.writeCandidates) {
        result.importCandidatesWouldCreate += 1;
        if (options.write) {
          await this.importCandidateService.createOrUpdateCandidate({
            domain: "vesting",
            entityType: "project",
            sourceType: result.sourceType,
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
              sourceProjectKey: dropstabSourceProjectKey(identity),
              reason: link.reason,
            },
            metadata: {
              importer: "fomo-v2:vesting-allocation-schedule-import",
              writeCandidates: true,
            },
          });
          result.importCandidatesCreatedOrUpdated += 1;
          result.WRITES_PERFORMED += 1;
        }
      }
      return;
    }

  }

  private async findSourceSnapshotId(
    sourceProject: Record<string, any>,
    canonicalProjectId: Types.ObjectId,
    sourceType: string
  ): Promise<Types.ObjectId | undefined> {
    const sourceId = dropstabVestingDatasetKey({
      canonicalProjectId,
      sourceType,
    });
    const payloadHash = dropstabVestingRelevantDataHash(
      sourceProject,
      "vesting_dataset"
    );
    const snapshot = await this.sourceSnapshotModel
      .findOne({
        source: sourceType,
        sourceEntityType: "project",
        sourceId,
        payloadHash,
      })
      .lean();
    return toDropstabObjectId((snapshot as any)?._id);
  }

  private async rejectSourceConflicts(
    component: FomoV2VestingComponentCandidates,
    relationIssues: FomoV2VestingScheduleRelationIssue[],
    crossSourceConflicts: Array<Record<string, any>>,
    result: FomoV2VestingAllocationScheduleImportResult,
    options: FomoV2VestingAllocationScheduleImportOptions
  ): Promise<boolean> {
    if (!crossSourceConflicts.length) return false;
    this.recordVestingComponentReviewRequired(
      component,
      relationIssues,
      result,
      {
        skipReason: "cross_source_vesting_conflict",
        crossSourceConflicts,
      }
    );
    result.existingVestingSourceConflicts += 1;
    if (
      crossSourceConflicts.some((conflict) =>
        String(conflict?.reason || "").startsWith("project_domain_source_lock")
      )
    ) {
      result.sourceLockConflicts += 1;
    }
    await this.handleVestingComponentRelationReview(
      component,
      relationIssues,
      result,
      options,
      {
        reviewReason: "SOURCE_CONFLICT",
        reviewScope: "cross_source_vesting_conflict",
        crossSourceConflicts,
        reasonText:
          "A source-scoped vesting identity or active domain source lock belongs to another provider; the incoming component requires admin review.",
      }
    );
    return true;
  }

  private async findCrossSourceConflicts(
    component: FomoV2VestingComponentCandidates,
    sourceType: string
  ): Promise<Array<Record<string, any>>> {
    const normalizedSourceType = normalizeDropstabSourceType(sourceType);
    const candidates = [
      ...component.tokenAllocations.map((candidate) => ({
        entityType: "token_allocation",
        sourceType: candidate.sourceType,
        fingerprint:
          candidate.canonicalFingerprint ||
          buildTokenAllocationFingerprint(candidate),
      })),
      ...component.vestingRounds.map((candidate) => ({
        entityType: "vesting_round",
        sourceType: candidate.sourceType,
        fingerprint:
          candidate.canonicalFingerprint || buildVestingRoundFingerprint(candidate),
      })),
      ...component.vestingSchedules
        .filter((candidate) => Boolean(candidate.canonicalFingerprint))
        .map((candidate) => ({
          entityType: "vesting_schedule",
          sourceType: candidate.sourceType,
          fingerprint: candidate.canonicalFingerprint as string,
        })),
    ];
    const conflicts: Array<Record<string, any>> = candidates
      .filter(
        (candidate) =>
          normalizeProjectSourceType(candidate.sourceType) !==
          normalizedSourceType
      )
      .map((candidate) => ({
        entityType: candidate.entityType,
        incomingSourceType: candidate.sourceType,
        expectedSourceType: normalizedSourceType,
        canonicalFingerprint: candidate.fingerprint,
        reason: "candidate_source_mismatch",
      }));

    const checks: Array<{
      entityType: string;
      model: Model<any>;
      fingerprints: string[];
    }> = [
      {
        entityType: "token_allocation",
        model: this.tokenAllocationModel,
        fingerprints: candidates
          .filter((candidate) => candidate.entityType === "token_allocation")
          .map((candidate) => candidate.fingerprint),
      },
      {
        entityType: "vesting_round",
        model: this.vestingRoundModel,
        fingerprints: candidates
          .filter((candidate) => candidate.entityType === "vesting_round")
          .map((candidate) => candidate.fingerprint),
      },
      {
        entityType: "vesting_schedule",
        model: this.vestingScheduleModel,
        fingerprints: candidates
          .filter((candidate) => candidate.entityType === "vesting_schedule")
          .map((candidate) => candidate.fingerprint),
      },
    ];

    for (const check of checks) {
      const fingerprints = [...new Set(check.fingerprints.filter(Boolean))];
      if (!fingerprints.length) continue;
      const rows = await check.model
        .find({
          canonicalFingerprint: { $in: fingerprints },
          sourceType: {
            $not: projectSourceTypeMongoPattern(normalizedSourceType),
          },
        })
        .limit(DEBUG_LIMIT)
        .lean();
      conflicts.push(
        ...rows.map((row: any) => ({
          entityType: check.entityType,
          documentId: toDropstabVestingIdString(row?._id),
          currentSourceType: row?.sourceType,
          incomingSourceType: normalizedSourceType,
          canonicalFingerprint: row?.canonicalFingerprint,
          reason: "persisted_fingerprint_owned_by_another_source",
        }))
      );
    }
    return conflicts.slice(0, DEBUG_LIMIT);
  }

  private isSourceCandidateUnchanged(
    existing: Record<string, any>,
    candidate: Record<string, any>,
    relationFields: string[] = []
  ): boolean {
    const existingSource = normalizeProjectSourceType(existing?.sourceType);
    const candidateSource = normalizeProjectSourceType(candidate?.sourceType);
    if (existingSource !== candidateSource) return false;

    const existingHash = cleanVestingString(
      existing?.provenance?.relevantDataHash
    );
    const candidateHash = cleanVestingString(
      candidate?.provenance?.relevantDataHash
    );
    if (!existingHash || !candidateHash || existingHash !== candidateHash) {
      return false;
    }
    if (
      candidate?.vestingDatasetKey &&
      existing?.vestingDatasetKey !== candidate.vestingDatasetKey
    ) {
      return false;
    }
    if (
      candidate?.sourceSnapshotId &&
      !this.sameObjectId(existing?.sourceSnapshotId, candidate.sourceSnapshotId)
    ) {
      return false;
    }
    return relationFields.every((field) =>
      this.sameObjectId(existing?.[field], candidate?.[field])
    );
  }

  private sameObjectId(left: any, right: any): boolean {
    const leftId = toDropstabVestingIdString(left);
    const rightId = toDropstabVestingIdString(right);
    return leftId === rightId;
  }

  private async findExistingAllocation(
    candidate: FomoV2NormalizedAllocationCandidate
  ): Promise<any> {
    const filters: Record<string, any>[] = [];
    const sourceType = projectSourceTypeMongoPattern(candidate.sourceType);
    const canonicalFingerprint =
      candidate.canonicalFingerprint || buildTokenAllocationFingerprint(candidate);
    filters.push({ canonicalFingerprint, sourceType });
    if (candidate.saleId !== undefined) {
      filters.push({
        canonicalProjectId: candidate.canonicalProjectId,
        sourceType,
        saleId: candidate.saleId,
      });
    }
    if (candidate.normalizedName) {
      filters.push({
        canonicalProjectId: candidate.canonicalProjectId,
        sourceType,
        normalizedName: candidate.normalizedName,
      });
    }
    if (!filters.length) return null;
    return this.tokenAllocationModel.findOne({ $or: filters }).lean();
  }

  private async findExistingRound(
    candidate: FomoV2NormalizedRoundCandidate
  ): Promise<any> {
    const filters: Record<string, any>[] = [];
    const sourceType = projectSourceTypeMongoPattern(candidate.sourceType);
    const canonicalFingerprint =
      candidate.canonicalFingerprint || buildVestingRoundFingerprint(candidate);
    filters.push({ canonicalFingerprint, sourceType });
    if (candidate.saleId !== undefined) {
      filters.push({
        canonicalProjectId: candidate.canonicalProjectId,
        sourceType,
        saleId: candidate.saleId,
      });
    }
    if (candidate.normalizedRoundName) {
      filters.push({
        canonicalProjectId: candidate.canonicalProjectId,
        sourceType,
        normalizedRoundName: candidate.normalizedRoundName,
      });
    }
    if (!filters.length) return null;
    return this.vestingRoundModel.findOne({ $or: filters }).lean();
  }

  private async findExistingSchedule(
    candidate: FomoV2NormalizedScheduleCandidate & {
      vestingRoundId?: Types.ObjectId;
      tokenAllocationId?: Types.ObjectId;
    }
  ): Promise<any> {
    const filters: Record<string, any>[] = [];
    const sourceType = projectSourceTypeMongoPattern(candidate.sourceType);
    const canonicalFingerprint =
      candidate.canonicalFingerprint || buildVestingScheduleFingerprint(candidate);
    filters.push({ canonicalFingerprint, sourceType });
    if (candidate.vestingRoundId) {
      filters.push({
        vestingRoundId: candidate.vestingRoundId,
        sourceType,
      });
    }
    if (
      candidate.canonicalProjectId &&
      candidate.sourceType &&
      candidate.saleId !== undefined &&
      candidate.normalizedRoundName
    ) {
      filters.push({
        canonicalProjectId: candidate.canonicalProjectId,
        sourceType,
        saleId: candidate.saleId,
        normalizedRoundName: candidate.normalizedRoundName,
      });
    }
    if (!filters.length) return null;
    return this.vestingScheduleModel.findOne({ $or: filters }).lean();
  }

  private recordDuplicateGroups(
    result: FomoV2VestingAllocationScheduleImportResult,
    entityType: string,
    groups: Array<{ key: string; count: number; candidates: any[] }>
  ): void {
    result.duplicateGroups += groups.length;
    for (const group of groups) {
      this.pushExample(result, "duplicateGroups", {
        entityType,
        key: group.key,
        count: group.count,
        examples: group.candidates.slice(0, 3).map((candidate) => ({
          sourcePath: candidate.sourcePath,
          name: candidate.name || candidate.roundName,
          saleId: candidate.saleId,
          canonicalProjectId: toDropstabVestingIdString(candidate.canonicalProjectId),
        })),
      });
    }
  }

  private projectReviewCandidates(
    sourceProject: Record<string, any>,
    link: any,
    sourceType: string
  ): FomoV2ReviewCandidateInput[] {
    const identity = dropstabVestingProjectIdentity(sourceProject);
    return [
      {
        entityType: "project",
        sourceType,
        sourceId: identity.sourceProjectId || identity.sourceId,
        sourcePath: identity.sourceDocumentId,
        sourceUrl: identity.sourceUrl,
        payload: {
          projectLinkStatus: link.status,
          reason: link.reason,
          sourceSlug: identity.sourceSlug,
          sourceProjectKey: dropstabSourceProjectKey(identity),
          candidates: link.candidates || [],
        },
        normalizedPayload: {
          normalizedName: identity.normalizedName,
          normalizedSymbol: identity.normalizedSymbol,
          normalizedSlug: identity.sourceSlug,
        },
      },
    ];
  }

  private compactAllocationCandidate(
    candidate: FomoV2NormalizedAllocationCandidate
  ): Record<string, any> {
    return {
      sourcePath: candidate.sourcePath,
      saleId: candidate.saleId,
      name: candidate.name,
      normalizedName: candidate.normalizedName,
      allocationPercent: candidate.allocationPercent,
      amount: candidate.amount,
    };
  }

  private compactRoundCandidate(
    candidate: FomoV2NormalizedRoundCandidate
  ): Record<string, any> {
    return {
      sourcePath: (candidate as any).sourcePath,
      saleId: candidate.saleId,
      roundName: candidate.roundName,
      normalizedRoundName: candidate.normalizedRoundName,
      allocationPercent: candidate.allocationPercent,
      totalAmount: candidate.totalAmount,
    };
  }

  private compactScheduleCandidate(
    candidate: FomoV2NormalizedScheduleCandidate
  ): Record<string, any> {
    return {
      sourcePath: candidate.sourcePath,
      saleId: candidate.saleId,
      roundName: candidate.roundName,
      normalizedRoundName: candidate.normalizedRoundName,
      tgeUnlockPercent: candidate.tgeUnlockPercent,
      vestingType: candidate.vestingType,
      vestingFrequency: candidate.vestingFrequency,
      vestingDurationMonths: candidate.vestingDurationMonths,
      startDate: candidate.startDate,
      endDate: candidate.endDate,
    };
  }

  private vestingComponentReviewPayload(
    component: FomoV2VestingComponentCandidates,
    relationIssues: FomoV2VestingScheduleRelationIssue[],
    context: FomoV2VestingComponentReviewContext = {}
  ): Record<string, any> {
    const identity = dropstabVestingProjectIdentity(component.sourceProject);
    return {
      sourceCollection: "dropstab_coin_detail_data",
      sourceDocumentId: identity.sourceDocumentId,
      sourceProjectKey: dropstabSourceProjectKey(identity),
      sourceSlug: identity.sourceSlug,
      canonicalProjectId: toDropstabVestingIdString(component.canonicalProjectId),
      reviewScope: context.reviewScope || "whole_vesting_component",
      relationIssueType: context.crossSourceConflicts?.length
        ? "cross_source_vesting_conflict"
        : "vesting_component_relation_conflict_or_missing",
      reason:
        context.reasonText ||
        "Vesting relation conflict or missing relation detected; all source vesting rows require admin review before write.",
      crossSourceConflicts: context.crossSourceConflicts,
      issueSummary: this.vestingComponentIssueSummary(
        component,
        relationIssues
      ),
      relationIssues,
      normalizedCandidates: {
        tokenAllocations: [
          ...component.tokenAllocations.map((candidate) => ({
            ...this.compactAllocationCandidate(candidate),
            relationStatus: "schedule_linked",
          })),
          ...component.unlinkedTokenAllocations.map((candidate) => ({
            ...this.compactAllocationCandidate(candidate),
            relationStatus: "missing_vesting_schedule_link",
          })),
        ],
        vestingRounds: [
          ...component.vestingRounds.map((candidate) => ({
            ...this.compactRoundCandidate(candidate),
            relationStatus: "schedule_linked",
          })),
          ...component.unlinkedVestingRounds.map((candidate) => ({
            ...this.compactRoundCandidate(candidate),
            relationStatus: "missing_allocation_or_schedule_link",
          })),
        ],
        vestingSchedules: component.vestingSchedules.map((candidate) =>
          this.compactScheduleCandidate(candidate)
        ),
      },
      rawSource: this.rawVestingSourcePayload(component.sourceProject),
    };
  }

  private vestingComponentIssueSummary(
    component: FomoV2VestingComponentCandidates,
    relationIssues: FomoV2VestingScheduleRelationIssue[]
  ): Record<string, any> {
    const tokenAllocationCount =
      component.tokenAllocations.length + component.unlinkedTokenAllocations.length;
    const vestingRoundCount =
      component.vestingRounds.length + component.unlinkedVestingRounds.length;
    const vestingScheduleCount = component.vestingSchedules.length;

    return {
      affectedEntityCount:
        tokenAllocationCount + vestingRoundCount + vestingScheduleCount,
      tokenAllocationCount,
      vestingRoundCount,
      vestingScheduleCount,
      unlinkedTokenAllocationCount: component.unlinkedTokenAllocations.length,
      unlinkedVestingRoundCount: component.unlinkedVestingRounds.length,
      relationIssueCount: relationIssues.length,
      missingAllocationId: relationIssues.filter(
        (issue) => issue.missingAllocationId
      ).length,
      missingRoundId: relationIssues.filter((issue) => issue.missingRoundId)
        .length,
      ambiguousAllocationLink: relationIssues.filter(
        (issue) => issue.allocationLinkStatus === "ambiguous"
      ).length,
      ambiguousRoundLink: relationIssues.filter(
        (issue) => issue.roundLinkStatus === "ambiguous"
      ).length,
      rawSourceCounts: this.rawVestingSourceRowCounts(component.sourceProject),
    };
  }

  private rawVestingSourcePayload(
    sourceProject: Record<string, any>
  ): Record<string, any> {
    const payload: Record<string, any> = {};
    for (const field of [
      "tokenAllocation",
      "vestingRounds",
      "vestingSchedule",
      "vestingTimeline",
      "unlockingEvents",
      "publicVesting",
      "vestingSummary",
    ]) {
      if (sourceProject?.[field] !== undefined) {
        payload[field] = sourceProject[field];
      }
    }
    return payload;
  }

  private rawVestingSourceRowCounts(
    sourceProject: Record<string, any>
  ): Record<string, number> {
    return {
      tokenAllocation: this.rawArrayLength(sourceProject?.tokenAllocation),
      vestingRounds: this.rawArrayLength(sourceProject?.vestingRounds),
      vestingSchedule: this.rawArrayLength(sourceProject?.vestingSchedule),
      vestingTimeline: this.rawArrayLength(sourceProject?.vestingTimeline),
      unlockingEvents: this.rawArrayLength(sourceProject?.unlockingEvents),
    };
  }

  private rawArrayLength(value: any): number {
    return Array.isArray(value) ? value.length : 0;
  }

  private async domainCounts(): Promise<Record<string, number>> {
    const [tokenAllocations, vestingRounds, vestingSchedules] =
      await Promise.all([
        this.tokenAllocationModel.countDocuments(),
        this.vestingRoundModel.countDocuments(),
        this.vestingScheduleModel.countDocuments(),
      ]);
    return { tokenAllocations, vestingRounds, vestingSchedules };
  }

  private recordSkipped(
    result: FomoV2VestingAllocationScheduleImportResult,
    reason: string,
    count = 1,
    example?: Record<string, any>
  ): void {
    result.skipped.total += count;
    result.skipped.byReason[reason] =
      (result.skipped.byReason[reason] || 0) + count;
    if (
      example &&
      result.skipped.examples &&
      result.skipped.examples.length < DEBUG_LIMIT
    ) {
      result.skipped.examples.push(example);
    }
  }

  private pushExample(
    result: FomoV2VestingAllocationScheduleImportResult,
    key: string,
    value: Record<string, any>
  ): void {
    const examples = result.examples?.[key];
    if (!examples || examples.length >= DEBUG_LIMIT) return;
    examples.push(value);
  }

  private emptyResult(
    sourceType: string,
    write: boolean,
    debug: boolean
  ): FomoV2VestingAllocationScheduleImportResult {
    const result: FomoV2VestingAllocationScheduleImportResult = {
      runner: "fomo-v2:vesting-allocation-schedule-import",
      mode: write ? "write" : "dry-run",
      dbName: this.dbName(),
      parserDbName: this.parserDbName(),
      generatedAt: new Date().toISOString(),
      sourceType,
      scannedParserDocs: 0,
      eligibleDocs: 0,
      skippedByFilter: 0,
      linkedCanonicalProjects: 0,
      sourceOnlyProjects: 0,
      ambiguousMatches: 0,
      aliasMismatches: 0,
      marketAssetLinked: 0,
      marketAssetMissing: 0,
      tokenAllocationsFound: 0,
      tokenAllocationsWouldCreate: 0,
      tokenAllocationsWouldUpdate: 0,
      tokenAllocationsCreated: 0,
      tokenAllocationsUpdated: 0,
      tokenAllocationsUnchanged: 0,
      vestingRoundsFound: 0,
      vestingRoundsWouldCreate: 0,
      vestingRoundsWouldUpdate: 0,
      vestingRoundsCreated: 0,
      vestingRoundsUpdated: 0,
      vestingRoundsUnchanged: 0,
      vestingSchedulesFound: 0,
      vestingSchedulesWouldCreate: 0,
      vestingSchedulesWouldUpdate: 0,
      vestingSchedulesCreated: 0,
      vestingSchedulesUpdated: 0,
      vestingSchedulesUnchanged: 0,
      vestingSchedulesSkippedMissingTokenAllocation: 0,
      vestingSchedulesMissingTokenAllocationLink: 0,
      vestingSchedulesSkippedMissingRound: 0,
      vestingSchedulesMissingRoundLink: 0,
      unlinkedTokenAllocationsFound: 0,
      unlinkedVestingRoundsFound: 0,
      existingVestingSourceConflicts: 0,
      sourceLocksWouldCreate: 0,
      sourceLocksCreated: 0,
      sourceLockConflicts: 0,
      duplicateGroups: 0,
      reviewWorthyCases: 0,
      reviewsWouldCreate: 0,
      reviewsCreatedOrUpdated: 0,
      importCandidatesWouldCreate: 0,
      importCandidatesCreatedOrUpdated: 0,
      beforeCounts: {},
      afterCounts: {},
      skipped: {
        total: 0,
        byReason: {},
      },
      warnings: [],
      errors: [],
      WRITES_PERFORMED: 0,
    };
    if (debug) {
      result.skipped.examples = [];
      result.examples = {
        duplicateGroups: [],
        allocationLinkMissing: [],
        roundLinkMissing: [],
        vestingComponentReview: [],
      };
    }
    return result;
  }

  private parsePositiveInteger(value: any, fallback: number): number {
    const number = Number(value ?? fallback);
    if (!Number.isFinite(number) || number <= 0) return fallback;
    return Math.trunc(number);
  }

  private dbName(): string {
    return (
      String(this.configService.get("DB_NAME") || process.env.DB_NAME || "fomoland").trim() ||
      "fomoland"
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
