import { forwardRef, Inject, Injectable, Optional } from "@nestjs/common";
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
import { FOMO_V2_PARSER_DB_CONNECTION } from "../../ico";
import {
  buildImportCandidateFingerprint,
  FomoV2ImportCandidate,
  FomoV2ImportCandidateInput,
  FomoV2ImportCandidateService,
} from "../../import-candidates";
import { FomoV2ProjectSourceProfile } from "../../project-profiles";
import { FomoV2ReviewBatch } from "../../review/models/review-batch.model";
import { FomoV2ReviewService } from "../../review/services/review.service";
import { FomoV2ReviewCandidateInput } from "../../review/types";
import {
  FomoV2ProjectDomainSourceService,
  normalizeProjectSourceType,
  projectSourceTypeMongoPattern,
} from "../../../shared/source-policy";
import {
  buildReviewFingerprint,
  buildSourceConflictReviewFingerprint,
} from "../../review/helpers";
import {
  buildUnlockEventFingerprint,
  cleanUnlockString,
  FomoV2UnlockEvent,
  FomoV2UnlockEventInput,
  normalizeUnlockName,
  toUnlockDate,
} from "../../unlocks";
import {
  FomoV2UnlockEventsImportMode,
  FomoV2UnlockEventsImportResult,
  FomoV2UnlockEventsImportService,
} from "../../unlocks/services/unlock-events-import.service";
import { FomoV2UnlocksService } from "../../unlocks/services/unlocks.service";
import {
  buildTokenAllocationFingerprint,
  buildVestingRoundFingerprint,
  buildVestingScheduleFingerprint,
  buildVestingSummaryFingerprint,
  cleanVestingString,
  firstFiniteNumber,
  hasNonEmptyVestingSummary,
  hasVestingImportData,
  normalizeVestingName,
  toVestingDate,
} from "../helpers";
import {
  FomoV2TokenAllocation,
  FomoV2VestingRound,
  FomoV2VestingSchedule,
  FomoV2VestingSummary,
} from "../models";
import {
  FomoV2TokenAllocationInput,
  FomoV2VestingRoundInput,
  FomoV2VestingScheduleInput,
  FomoV2VestingSummaryInput,
} from "../types";
import { FomoV2VestingService } from "./vesting.service";
import { FomoV2ParserControlPolicyService } from "../../parser-control/services/parser-control-policy.service";

const PARSER_COLLECTION = "dropstab_coin_detail_data";
const DEBUG_LIMIT = 20;
const SUPPORTED_SOURCE_TYPES = ["dropstab"];

export interface FomoV2VestingImportOptions {
  limit?: number;
  all?: boolean;
  debug?: boolean;
  sourceType?: string;
  sourceSlug?: string;
  sourceProjectId?: string;
  write?: boolean;
  includeUnlocks?: boolean;
  unlocksMode?: FomoV2UnlocksMode;
}

export type FomoV2UnlocksMode = "none" | "daily" | "monthly" | "next-only";

export interface FomoV2VestingImportResult {
  mode: "dry-run" | "write";
  sourceType: string;
  includeUnlocks: boolean;
  unlocksMode: FomoV2UnlocksMode;
  totalDocs: number;
  docsWithVesting: number;
  eligibleDocs: number;
  resolvedProjects: number;
  missingProjects: number;
  sourceConflicts: number;
  tokenAllocationsFound: number;
  tokenAllocationsWithoutName: number;
  tokenAllocationsWouldCreate: number;
  tokenAllocationsWouldUpdate: number;
  vestingRoundsFound: number;
  vestingRoundsWithoutRoundName: number;
  vestingRoundsWouldCreate: number;
  vestingRoundsWouldUpdate: number;
  vestingSchedulesFound: number;
  vestingSchedulesWithoutRoundName: number;
  vestingSchedulesWithoutMatchedRound: number;
  vestingSchedulesWouldCreate: number;
  vestingSchedulesWouldUpdate: number;
  unlockEventsFound: number;
  unlockEventsWithoutDate: number;
  unlockEventsWithoutRoundName: number;
  unlockEventsWithoutSaleId: number;
  unlockEventsSkippedByMode: number;
  unlockEventsWouldCreate: number;
  unlockEventsWouldUpdate: number;
  emptySummariesSkipped: number;
  summariesWouldCreate: number;
  summariesWouldUpdate: number;
  projectCandidatesWouldCreate: number;
  reviewsWouldCreate: number;
  skipped: {
    total: number;
    byReason: Record<string, number>;
    examples?: Array<Record<string, any>>;
  };
  warnings: string[];
  errors: Array<Record<string, any>>;
  debugExamples?: Record<string, Array<Record<string, any>>>;
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

interface ImportContext {
  sourceType: string;
  debug: boolean;
  write: boolean;
  includeUnlocks: boolean;
  unlocksMode: FomoV2UnlocksMode;
  result: FomoV2VestingImportResult;
  seenCandidateFingerprints: Set<string>;
  seenReviewFingerprints: Set<string>;
  writtenTokenAllocationIds: Map<string, Types.ObjectId>;
  writtenRoundIds: Map<string, Types.ObjectId>;
  writtenUnlockIds: Map<string, Types.ObjectId>;
  writtenUnlockIdsByDate: Map<string, Types.ObjectId>;
}

@Injectable()
export class FomoV2VestingImportService {
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
    @InjectModel(FomoV2ReviewBatch.name)
    private readonly reviewBatchModel: Model<any>,
    @InjectModel(FomoV2ImportCandidate.name)
    private readonly importCandidateModel: Model<any>,
    @InjectModel(FomoV2TokenAllocation.name)
    private readonly tokenAllocationModel: Model<any>,
    @InjectModel(FomoV2VestingRound.name)
    private readonly vestingRoundModel: Model<any>,
    @InjectModel(FomoV2VestingSchedule.name)
    private readonly vestingScheduleModel: Model<any>,
    @InjectModel(FomoV2UnlockEvent.name)
    private readonly unlockEventModel: Model<any>,
    @InjectModel(FomoV2VestingSummary.name)
    private readonly vestingSummaryModel: Model<any>,
    private readonly vestingService: FomoV2VestingService,
    @Inject(FomoV2UnlocksService)
    private readonly unlocksService: FomoV2UnlocksService,
    @Inject(forwardRef(() => FomoV2UnlockEventsImportService))
    private readonly unlockEventsImportService: FomoV2UnlockEventsImportService,
    private readonly importCandidateService: FomoV2ImportCandidateService,
    private readonly reviewService: FomoV2ReviewService,
    @Optional()
    private readonly projectDomainSourceService?: FomoV2ProjectDomainSourceService,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService
  ) {}

  async run(
    options: FomoV2VestingImportOptions = {}
  ): Promise<FomoV2VestingImportResult> {
    const sourceType = this.normalizeSourceType(options.sourceType);
    if (!SUPPORTED_SOURCE_TYPES.includes(sourceType)) {
      throw new Error(`Unsupported vesting sourceType "${sourceType}".`);
    }
    const includeUnlocks = Boolean(options.includeUnlocks);
    const unlocksMode = this.normalizeUnlocksMode(options.unlocksMode);
    if (!includeUnlocks && unlocksMode !== "none") {
      throw new Error("Use --include-unlocks with --unlocks-mode.");
    }
    if (includeUnlocks && unlocksMode === "none") {
      throw new Error(
        "Use --unlocks-mode=daily, --unlocks-mode=monthly, or --unlocks-mode=next-only with --include-unlocks."
      );
    }
    const write = Boolean(options.write);
    if (write && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        `vesting:${sourceType}`
      );
    }
    const all = Boolean(options.all);
    if (write && options.limit === undefined && !all) {
      throw new Error("Vesting write mode requires --limit or --all-confirmed.");
    }
    if (includeUnlocks && unlocksMode === "monthly") {
      throw new Error(
        "Monthly unlock aggregation is not implemented in unlock-events import; --unlocks-mode=monthly is deprecated/unsupported."
      );
    }

    const debug = Boolean(options.debug);
    const limit = all ? undefined : this.parsePositiveInteger(options.limit, 100);
    const result = this.emptyResult(
      sourceType,
      debug,
      write,
      includeUnlocks,
      includeUnlocks ? unlocksMode : "none"
    );
    const parserCollection = this.parserCollection();
    const query = this.vestingQuery(sourceType, {
      sourceSlug: options.sourceSlug,
      sourceProjectId: options.sourceProjectId,
    });

    result.totalDocs = await parserCollection.countDocuments({ source: sourceType });
    result.eligibleDocs = await parserCollection.countDocuments(query);
    result.docsWithVesting = result.eligibleDocs;
    if (limit !== undefined && result.eligibleDocs > limit) {
      result.warnings.push(
        `Processing first ${limit} eligible docs out of ${result.eligibleDocs}.`
      );
    }

    let cursor = parserCollection.find(query).sort({ _id: 1 });
    if (limit !== undefined) cursor = cursor.limit(limit);

    const context: ImportContext = {
      sourceType,
      debug,
      write,
      includeUnlocks,
      unlocksMode: includeUnlocks ? unlocksMode : "none",
      result,
      seenCandidateFingerprints: new Set<string>(),
      seenReviewFingerprints: new Set<string>(),
      writtenTokenAllocationIds: new Map<string, Types.ObjectId>(),
      writtenRoundIds: new Map<string, Types.ObjectId>(),
      writtenUnlockIds: new Map<string, Types.ObjectId>(),
      writtenUnlockIdsByDate: new Map<string, Types.ObjectId>(),
    };

    for await (const sourceProject of cursor as any) {
      await this.processProject(sourceProject, context);
    }

    if (includeUnlocks) {
      const unlockImport = await this.unlockEventsImportService.run({
        source: sourceType,
        sourceType,
        mode: this.toUnlockEventsImportMode(unlocksMode),
        limit,
        all,
        write,
        sourceProjectFilter: "vesting-eligible",
      });
      this.mergeUnlockImportResult(result, unlockImport);
    }

    return result;
  }

  private async processProject(
    sourceProject: Record<string, any>,
    context: ImportContext
  ): Promise<void> {
    const identity = this.projectIdentity(sourceProject);
    const itemCounts = this.projectItemCounts(sourceProject);
    if (!hasVestingImportData(sourceProject)) {
      this.recordSkipped(context.result, "ineligible_vesting_payload", 1, {
        dropstab: this.dropstabDebugIdentity(identity),
      });
      return;
    }
    try {
      const resolved = await this.resolveCanonicalProject(
        identity,
        context.sourceType
      );
      if (!resolved.canonicalProjectId) {
        context.result.missingProjects += 1;
        this.recordSkipped(context.result, "missing_canonical_project", itemCounts.total || 1, {
          dropstab: this.dropstabDebugIdentity(identity),
          reason: resolved.reason || "No safe canonical project match.",
        });
        if (resolved.ambiguous) {
          await this.recordReview(context, {
            reason: "POTENTIAL_PROJECT_MATCH",
            domain: "vesting",
            identity,
            sourceType: context.sourceType,
          });
        } else {
          await this.simulateProjectCandidate(identity, context);
        }
        this.pushDebug(context, "missingProjects", this.projectDebug(identity, resolved));
        return;
      }

      context.result.resolvedProjects += 1;
      this.pushDebug(context, "resolvedProjects", this.projectDebug(identity, resolved));

      if (this.projectDomainSourceService) {
        const existingLock = await this.projectDomainSourceService.getLock(
          resolved.canonicalProjectId,
          "vesting"
        );
        if (
          existingLock &&
          this.normalizeSourceType(existingLock.selectedSourceType) !==
            context.sourceType
        ) {
          context.result.sourceConflicts += 1;
          this.recordSkipped(
            context.result,
            "source_conflict",
            itemCounts.total || 1,
            {
              selectedSourceType: existingLock.selectedSourceType,
              incomingSourceType: context.sourceType,
            }
          );
          await this.recordReview(context, {
            reason: "SOURCE_CONFLICT",
            domain: "vesting",
            identity,
            sourceType: context.sourceType,
            canonicalProjectId: resolved.canonicalProjectId,
            currentSourceType: existingLock.selectedSourceType,
          });
          return;
        }
        if (context.write) {
          const lockResult = await this.projectDomainSourceService.ensureLock({
            canonicalProjectId: resolved.canonicalProjectId,
            domain: "vesting",
            sourceType: context.sourceType,
            reason: "legacy_vesting_import_recovery",
            metadata: {
              importer: "fomo-v2:vesting-import",
              sourceDocumentId: identity.sourceDocumentId,
            },
          });
          if (!lockResult.allowed) {
            context.result.sourceConflicts += 1;
            this.recordSkipped(
              context.result,
              "source_conflict",
              itemCounts.total || 1
            );
            await this.recordReview(context, {
              reason: "SOURCE_CONFLICT",
              domain: "vesting",
              identity,
              sourceType: context.sourceType,
              canonicalProjectId: resolved.canonicalProjectId,
              currentSourceType: lockResult.currentSourceType,
            });
            return;
          }
        }
      }

      const normalized = this.normalizeProjectPayload(
        sourceProject,
        identity,
        resolved.canonicalProjectId,
        context.sourceType,
        context
      );
      for (const allocation of normalized.tokenAllocations) {
        await this.processTokenAllocation(allocation, context);
      }
      for (const round of normalized.vestingRounds) {
        await this.processVestingRound(round, context);
      }
      for (const schedule of normalized.vestingSchedules) {
        await this.processVestingSchedule(schedule, context);
      }
      if (!context.includeUnlocks) {
        context.result.unlockEventsFound += normalized.unlockEvents.length;
        context.result.unlockEventsSkippedByMode += normalized.unlockEvents.length;
      }
      if (normalized.summary) {
        await this.processVestingSummary(normalized.summary, context);
      }
    } catch (error: any) {
      context.result.errors.push({
        sourceDocumentId: identity.sourceDocumentId,
        sourceSlug: identity.sourceSlug,
        message: error?.message || String(error),
      });
      this.recordSkipped(context.result, "error", itemCounts.total || 1, {
        dropstab: this.dropstabDebugIdentity(identity),
        message: error?.message || String(error),
      });
    }
  }

  private normalizeProjectPayload(
    sourceProject: Record<string, any>,
    identity: ProjectIdentity,
    canonicalProjectId: Types.ObjectId,
    sourceType: string,
    context: ImportContext
  ): {
    tokenAllocations: FomoV2TokenAllocationInput[];
    vestingRounds: FomoV2VestingRoundInput[];
    vestingSchedules: FomoV2VestingScheduleInput[];
    unlockEvents: FomoV2UnlockEventInput[];
    summary?: FomoV2VestingSummaryInput;
  } {
    const tokenAllocations = this.normalizeTokenAllocations(
      sourceProject,
      identity,
      canonicalProjectId,
      sourceType
    );
    const explicitRounds = this.normalizeVestingRounds(
      sourceProject,
      identity,
      canonicalProjectId,
      sourceType
    );
    const fallbackRounds = explicitRounds.length
      ? []
      : this.normalizeFallbackRoundsFromSchedules(
          sourceProject,
          identity,
          canonicalProjectId,
          sourceType
        );
    const vestingRounds = explicitRounds.length ? explicitRounds : fallbackRounds;
    this.collectTokenAllocationQuality(sourceProject, identity, context);
    this.collectVestingRoundQuality(sourceProject, identity, context);
    this.collectVestingScheduleQuality(
      sourceProject,
      identity,
      vestingRounds,
      context
    );
    const vestingSchedules = this.normalizeVestingSchedules(
      sourceProject,
      identity,
      canonicalProjectId,
      sourceType,
      vestingRounds,
      tokenAllocations
    );
    const unlockEvents = this.normalizeUnlockEvents(
      sourceProject,
      identity,
      canonicalProjectId,
      sourceType,
      context.unlocksMode
    );
    this.collectUnlockEventQuality(sourceProject, identity, context);
    const summary = this.normalizeSummary(
      sourceProject,
      canonicalProjectId,
      sourceType,
      unlockEvents,
      context
    );

    return {
      tokenAllocations,
      vestingRounds,
      vestingSchedules,
      unlockEvents,
      summary,
    };
  }

  private normalizeTokenAllocations(
    sourceProject: Record<string, any>,
    identity: ProjectIdentity,
    canonicalProjectId: Types.ObjectId,
    sourceType: string
  ): FomoV2TokenAllocationInput[] {
    return this.arrayValue(sourceProject.tokenAllocation)
      .map<FomoV2TokenAllocationInput | undefined>((item, index) => {
        const name = cleanVestingString(
          item?.name || item?.roundName || item?.saleName
        );
        if (!name) return undefined;
        const saleId = this.cleanSaleId(item?.saleId ?? item?.id);
        const normalizedName = normalizeVestingName(name);
        const sourcePath = `tokenAllocation.${index}`;
        return {
          canonicalProjectId,
          sourceType,
          sourceId: saleId === undefined ? undefined : String(saleId),
          sourceSlug: identity.sourceSlug,
          sourcePath,
          sourceUrl: identity.sourceUrl,
          name,
          normalizedName,
          allocationPercent: firstFiniteNumber(
            item?.allocationPercent,
            item?.percent,
            item?.tokensAllocatedPercent,
            item?.tokensForSalePercent
          ),
          amount: firstFiniteNumber(
            item?.amount,
            item?.tokensAmount,
            item?.tokensAllocatedAmount,
            item?.tokensForSaleAmount
          ),
          saleId,
          primarySource: sourceType,
          sourceRefs: [this.sourceRef(identity, sourceType, sourcePath, saleId)],
          canonicalFingerprint: buildTokenAllocationFingerprint({
            canonicalProjectId,
            sourceType,
            saleId,
            name,
            normalizedName,
          }),
        };
      })
      .filter((item): item is FomoV2TokenAllocationInput => Boolean(item));
  }

  private normalizeVestingRounds(
    sourceProject: Record<string, any>,
    identity: ProjectIdentity,
    canonicalProjectId: Types.ObjectId,
    sourceType: string
  ): FomoV2VestingRoundInput[] {
    return this.arrayValue(sourceProject.vestingRounds)
      .map((item, index) =>
        this.normalizeVestingRound(
          item,
          index,
          "vestingRounds",
          identity,
          canonicalProjectId,
          sourceType
        )
      )
      .filter((item): item is FomoV2VestingRoundInput => Boolean(item));
  }

  private normalizeFallbackRoundsFromSchedules(
    sourceProject: Record<string, any>,
    identity: ProjectIdentity,
    canonicalProjectId: Types.ObjectId,
    sourceType: string
  ): FomoV2VestingRoundInput[] {
    const rows = this.arrayValue(sourceProject.vestingSchedule).length
      ? this.arrayValue(sourceProject.vestingSchedule)
      : this.arrayValue(sourceProject.vestingTimeline);
    return rows
      .map((item, index) =>
        this.normalizeVestingRound(
          item,
          index,
          "vestingSchedule",
          identity,
          canonicalProjectId,
          sourceType
        )
      )
      .filter((item): item is FomoV2VestingRoundInput => Boolean(item));
  }

  private normalizeVestingRound(
    item: Record<string, any>,
    index: number,
    sourceArray: string,
    identity: ProjectIdentity,
    canonicalProjectId: Types.ObjectId,
    sourceType: string
  ): FomoV2VestingRoundInput | undefined {
    const roundName = cleanVestingString(
      item?.roundName || item?.name || item?.saleName || item?.stage
    );
    if (!roundName) return undefined;
    const saleId = this.cleanSaleId(item?.saleId ?? item?.id);
    const normalizedRoundName = normalizeVestingName(roundName);
    const sourcePath = `${sourceArray}.${index}`;
    return {
      canonicalProjectId,
      sourceType,
      saleId,
      roundName,
      normalizedRoundName,
      allocationPercent: firstFiniteNumber(
        item?.allocationPercent,
        item?.percent,
        item?.tokensAllocatedPercent
      ),
      totalAmount: firstFiniteNumber(
        item?.totalAmount,
        item?.tokensAmount,
        item?.amount
      ),
      unlockedAmountSource: firstFiniteNumber(
        item?.unlockedAmount,
        item?.unlockedTokensAmount,
        item?.vestedAmount
      ),
      lockedAmountSource: firstFiniteNumber(
        item?.lockedAmount,
        item?.lockedTokensAmount
      ),
      unlockedPercentSource: firstFiniteNumber(
        item?.unlockedPercent,
        item?.vestedPercent,
        item?.currentUnlockedPercent
      ),
      lockedPercentSource: firstFiniteNumber(
        item?.lockedPercent,
        item?.currentLockedPercent
      ),
      valueLockedUsdSource: firstFiniteNumber(
        item?.valueLockedUsd,
        item?.lockedValueUsd
      ),
      lastUnlockDateSource: toVestingDate(item?.lastUnlockDate),
      primarySource: sourceType,
      sourceRefs: [this.sourceRef(identity, sourceType, sourcePath, saleId)],
      canonicalFingerprint: buildVestingRoundFingerprint({
        canonicalProjectId,
        sourceType,
        saleId,
        roundName,
        normalizedRoundName,
      }),
      metadata: {
        importer: "fomo-v2:vesting-import",
        sourceArray,
        sourceIndex: index,
        raw: item,
      },
    };
  }

  private normalizeVestingSchedules(
    sourceProject: Record<string, any>,
    identity: ProjectIdentity,
    canonicalProjectId: Types.ObjectId,
    sourceType: string,
    rounds: FomoV2VestingRoundInput[],
    tokenAllocations: FomoV2TokenAllocationInput[]
  ): FomoV2VestingScheduleInput[] {
    const sourceArray = this.arrayValue(sourceProject.vestingSchedule).length
      ? "vestingSchedule"
      : "vestingTimeline";
    const rows =
      sourceArray === "vestingSchedule"
        ? this.arrayValue(sourceProject.vestingSchedule)
        : this.arrayValue(sourceProject.vestingTimeline);
    return rows
      .map<FomoV2VestingScheduleInput | undefined>((item, index) => {
        const roundName = cleanVestingString(
          item?.roundName || item?.name || item?.saleName
        );
        if (!roundName) return undefined;
        const saleId = this.cleanSaleId(item?.saleId ?? item?.id);
        const normalizedRoundName = normalizeVestingName(roundName);
        const matchedRound = this.findRoundInput(rounds, {
          saleId,
          normalizedRoundName,
        });
        const matchedAllocation = this.findTokenAllocationInput(tokenAllocations, {
          saleId,
          normalizedName: normalizedRoundName,
        });
        const virtualRoundId =
          matchedRound?.canonicalFingerprint ||
          buildVestingRoundFingerprint({
            canonicalProjectId,
            sourceType,
            saleId,
            roundName,
            normalizedRoundName,
          });
        const virtualTokenAllocationId =
          matchedAllocation?.canonicalFingerprint ||
          buildTokenAllocationFingerprint({
            canonicalProjectId,
            sourceType,
            saleId,
            name: roundName,
            normalizedName: normalizedRoundName,
          });
        const sourcePath = `${sourceArray}.${index}`;
        return {
          canonicalProjectId,
          tokenAllocationId: virtualTokenAllocationId,
          vestingRoundId: virtualRoundId,
          sourceType,
          saleId,
          roundName,
          normalizedRoundName,
          tgeUnlockPercent: firstFiniteNumber(item?.tgeUnlockPercent),
          vestingType: cleanVestingString(item?.vestingType),
          vestingFrequency: cleanVestingString(item?.vestingFrequency),
          vestingDurationMonths: firstFiniteNumber(
            item?.vestingDurationMonths
          ),
          startDate: toVestingDate(item?.startDate),
          endDate: toVestingDate(item?.endDate),
          dateConfidence: cleanVestingString(item?.dateConfidence),
          currentUnlockedPercentSource: firstFiniteNumber(
            item?.currentUnlockedPercent,
            item?.vestedPercent
          ),
          currentLockedPercentSource: firstFiniteNumber(
            item?.currentLockedPercent,
            item?.lockedPercent
          ),
          sourceRefs: [this.sourceRef(identity, sourceType, sourcePath, saleId)],
          canonicalFingerprint: buildVestingScheduleFingerprint({
            canonicalProjectId,
            vestingRoundId: virtualRoundId,
            sourceType,
            saleId,
            roundName,
            normalizedRoundName,
          }),
          metadata: {
            importer: "fomo-v2:vesting-import",
            sourceArray,
            sourceIndex: index,
            raw: item,
          },
        };
      })
      .filter((item): item is FomoV2VestingScheduleInput => Boolean(item));
  }

  private normalizeUnlockEvents(
    sourceProject: Record<string, any>,
    identity: ProjectIdentity,
    canonicalProjectId: Types.ObjectId,
    sourceType: string,
    unlocksMode: FomoV2UnlocksMode
  ): FomoV2UnlockEventInput[] {
    const outputs: FomoV2UnlockEventInput[] = [];
    const push = (
      item: Record<string, any>,
      sourcePath: string,
      fallbackRound?: Record<string, any>
    ) => {
      const unlockDate = toUnlockDate(item?.unlockDate || item?.date);
      if (!unlockDate) return;
      const roundName = cleanUnlockString(
        fallbackRound?.roundName ||
          fallbackRound?.name ||
          fallbackRound?.sale ||
          item?.roundName ||
          item?.stage ||
          (Array.isArray(item?.roundNames) && item.roundNames.length === 1
            ? item.roundNames[0]
            : undefined)
      );
      const normalizedRoundName = normalizeUnlockName(roundName);
      const saleId = this.cleanSaleId(
        fallbackRound?.saleId ?? fallbackRound?.id ?? item?.saleId
      );
      const unlockType = cleanUnlockString(
        fallbackRound?.unlockType ||
          item?.unlockType ||
          this.arrayValue(item?.unlockTypes)[0]
      );
      const sourceEventId = cleanUnlockString(
        item?.sourceEventId || item?.id || item?.sourceKey || sourcePath
      );
      outputs.push({
        canonicalProjectId,
        sourceType,
        sourceEventId,
        saleId,
        sourcePath,
        unlockDate,
        statusSource:
          cleanUnlockString(item?.statusSource || item?.status) ||
          (item?.isPast === true ? "past" : "upcoming"),
        amount: firstFiniteNumber(fallbackRound?.amount, item?.amount),
        percentOfSupply: firstFiniteNumber(
          fallbackRound?.percent,
          item?.percent,
          item?.percentOfSupply
        ),
        roundName,
        normalizedRoundName: normalizedRoundName || undefined,
        stage: cleanUnlockString(fallbackRound?.stage || item?.stage),
        unlockType,
        unlockTypes: this.uniqueStrings([
          ...this.arrayValue(item?.unlockTypes),
          unlockType,
        ]),
        isTgeUnlock:
          fallbackRound?.isTgeUnlock === undefined &&
          item?.isTgeUnlock === undefined
            ? undefined
            : Boolean(fallbackRound?.isTgeUnlock ?? item?.isTgeUnlock),
        sourceValueUsd: firstFiniteNumber(
          fallbackRound?.valueUsd,
          item?.valueUsd,
          item?.sourceValueUsd
        ),
        sourceMarketCapSharePercent: firstFiniteNumber(
          fallbackRound?.marketCapSharePercent,
          item?.marketCapSharePercent,
          item?.sourceMarketCapSharePercent
        ),
        sourceRefs: [this.sourceRef(identity, sourceType, sourcePath, saleId)],
        metadata: {
          importer: "fomo-v2:vesting-import",
          raw: item,
          rawRound: fallbackRound,
        },
      });
    };

    const includeDailyUnlockingEvents =
      unlocksMode === "none" ||
      unlocksMode === "daily" ||
      unlocksMode === "monthly";
    if (includeDailyUnlockingEvents) {
      this.arrayValue(sourceProject.unlockingEvents).forEach(
        (event, eventIndex) => {
          const rounds = this.arrayValue(event?.rounds);
          if (rounds.length) {
            rounds.forEach((round, roundIndex) =>
              push(
                event,
                `unlockingEvents.${eventIndex}.rounds.${roundIndex}`,
                round
              )
            );
          } else {
            push(event, `unlockingEvents.${eventIndex}`);
          }
        }
      );
    }

    const includeNextUnlockingEvent =
      unlocksMode === "none" ||
      unlocksMode === "daily" ||
      unlocksMode === "next-only";
    if (includeNextUnlockingEvent && sourceProject.nextUnlockingEvent) {
      const next = sourceProject.nextUnlockingEvent;
      const rounds = this.arrayValue(next?.rounds);
      if (rounds.length) {
        rounds.forEach((round, roundIndex) =>
          push(next, `nextUnlockingEvent.rounds.${roundIndex}`, round)
        );
      } else {
        push(next, "nextUnlockingEvent");
      }
    }

    const normalizedOutputs =
      unlocksMode === "monthly"
        ? this.aggregateMonthlyUnlockEvents(outputs)
        : outputs;
    const byFingerprint = new Map<string, FomoV2UnlockEventInput>();
    for (const event of normalizedOutputs) {
      const fingerprint = buildUnlockEventFingerprint({
        canonicalProjectId,
        sourceType,
        saleId: event.saleId,
        unlockDate: event.unlockDate,
        roundName: event.roundName,
        normalizedRoundName: event.normalizedRoundName,
        unlockType: event.unlockType,
      });
      if (!byFingerprint.has(fingerprint)) {
        byFingerprint.set(fingerprint, {
          ...event,
          canonicalFingerprint: fingerprint,
        });
      }
    }
    return Array.from(byFingerprint.values());
  }

  private aggregateMonthlyUnlockEvents(
    events: FomoV2UnlockEventInput[]
  ): FomoV2UnlockEventInput[] {
    const buckets = new Map<
      string,
      FomoV2UnlockEventInput & {
        eventCount: number;
        amountTotal?: number;
        percentTotal?: number;
        valueTotal?: number;
        marketCapShareTotal?: number;
      }
    >();

    for (const event of events) {
      const month = this.monthBucket(event.unlockDate);
      if (!month) continue;
      const key = [
        this.toIdString(event.canonicalProjectId),
        event.sourceType,
        month,
        event.saleId === undefined ? "" : String(event.saleId),
        event.normalizedRoundName || normalizeUnlockName(event.roundName),
        cleanUnlockString(event.unlockType)?.toLowerCase() || "",
      ].join("|");
      const existing = buckets.get(key);
      if (existing) {
        existing.eventCount += 1;
        existing.amountTotal = this.addOptionalNumbers(
          existing.amountTotal,
          event.amount
        );
        existing.percentTotal = this.addOptionalNumbers(
          existing.percentTotal,
          event.percentOfSupply
        );
        existing.valueTotal = this.addOptionalNumbers(
          existing.valueTotal,
          event.sourceValueUsd
        );
        existing.marketCapShareTotal = this.addOptionalNumbers(
          existing.marketCapShareTotal,
          event.sourceMarketCapSharePercent
        );
        continue;
      }

      const unlockDate = new Date(`${month}-01T00:00:00.000Z`);
      buckets.set(key, {
        ...event,
        sourceEventId: `monthly:${month}:${
          event.saleId ?? event.normalizedRoundName ?? "unknown"
        }:${event.unlockType ?? "unknown"}`,
        sourcePath: `unlockingEvents.monthly.${month}`,
        unlockDate,
        statusSource:
          unlockDate.getTime() < Date.now() ? "past" : "upcoming",
        metadata: {
          ...(event.metadata || {}),
          unlocksMode: "monthly",
          month,
          firstSourcePath: event.sourcePath,
        },
        eventCount: 1,
        amountTotal: event.amount,
        percentTotal: event.percentOfSupply,
        valueTotal: event.sourceValueUsd,
        marketCapShareTotal: event.sourceMarketCapSharePercent,
      });
    }

    return Array.from(buckets.values()).map((bucket) => {
      const {
        eventCount,
        amountTotal,
        percentTotal,
        valueTotal,
        marketCapShareTotal,
        metadata,
        ...event
      } = bucket;
      return {
        ...event,
        amount: amountTotal,
        percentOfSupply: percentTotal,
        sourceValueUsd: valueTotal,
        sourceMarketCapSharePercent: marketCapShareTotal,
        metadata: {
          ...(metadata || {}),
          eventCount,
        },
      };
    });
  }

  private normalizeSummary(
    sourceProject: Record<string, any>,
    canonicalProjectId: Types.ObjectId,
    sourceType: string,
    unlockEvents: FomoV2UnlockEventInput[],
    context: ImportContext
  ): FomoV2VestingSummaryInput | undefined {
    const summary = sourceProject.vestingSummary || {};
    if (!hasNonEmptyVestingSummary(summary)) {
      if (
        summary &&
        typeof summary === "object" &&
        Object.keys(summary).length > 0
      ) {
        context.result.emptySummariesSkipped += 1;
        this.pushDebug(context, "summaries", {
          action: "skip_empty_summary",
          sourceDocumentId: this.toIdString(sourceProject._id),
        });
      }
      return undefined;
    }
    const sorted = [...unlockEvents]
      .map((event) => toUnlockDate(event.unlockDate))
      .filter((date): date is Date => Boolean(date))
      .sort((left, right) => left.getTime() - right.getTime());
    const now = Date.now();
    const next = sorted.find((date) => date.getTime() >= now);
    const last = [...sorted].reverse().find((date) => date.getTime() < now);
    return {
      canonicalProjectId,
      sourceType,
      totalAmount: firstFiniteNumber(summary?.totalAmount),
      unlockedAmount: firstFiniteNumber(summary?.unlockedAmount),
      lockedAmount: firstFiniteNumber(summary?.lockedAmount),
      untrackedAmount: firstFiniteNumber(summary?.untrackedAmount),
      unlockedPercent: firstFiniteNumber(summary?.unlockedPercent),
      lockedPercent: firstFiniteNumber(summary?.lockedPercent),
      untrackedPercent: firstFiniteNumber(summary?.untrackedPercent),
      lastUnlockDate: toVestingDate(summary?.lastUnlockDate) || last,
      nextUnlockDate:
        toVestingDate(summary?.nextUnlockDate) ||
        toVestingDate(sourceProject.nextUnlockingEvent?.unlockDate) ||
        next,
      sourceUnlockedValueUsd: firstFiniteNumber(summary?.unlockedValueUsd),
      sourceLockedValueUsd: firstFiniteNumber(summary?.lockedValueUsd),
      calculatedAt: new Date(),
    };
  }

  private collectTokenAllocationQuality(
    sourceProject: Record<string, any>,
    identity: ProjectIdentity,
    context: ImportContext
  ): void {
    this.arrayValue(sourceProject.tokenAllocation).forEach((item, index) => {
      const name = cleanVestingString(
        item?.name || item?.roundName || item?.saleName
      );
      if (!name) {
        this.recordQualityIssue(
          context,
          "tokenAllocationsWithoutName",
          identity,
          { sourcePath: `tokenAllocation.${index}` }
        );
      }
    });
  }

  private collectVestingRoundQuality(
    sourceProject: Record<string, any>,
    identity: ProjectIdentity,
    context: ImportContext
  ): void {
    this.arrayValue(sourceProject.vestingRounds).forEach((item, index) => {
      const roundName = cleanVestingString(
        item?.roundName || item?.name || item?.saleName || item?.stage
      );
      if (!roundName) {
        this.recordQualityIssue(
          context,
          "vestingRoundsWithoutRoundName",
          identity,
          { sourcePath: `vestingRounds.${index}` }
        );
      }
    });
  }

  private collectVestingScheduleQuality(
    sourceProject: Record<string, any>,
    identity: ProjectIdentity,
    rounds: FomoV2VestingRoundInput[],
    context: ImportContext
  ): void {
    const sourceArray = this.arrayValue(sourceProject.vestingSchedule).length
      ? "vestingSchedule"
      : "vestingTimeline";
    const rows =
      sourceArray === "vestingSchedule"
        ? this.arrayValue(sourceProject.vestingSchedule)
        : this.arrayValue(sourceProject.vestingTimeline);
    rows.forEach((item, index) => {
      const roundName = cleanVestingString(
        item?.roundName || item?.name || item?.saleName
      );
      const sourcePath = `${sourceArray}.${index}`;
      if (!roundName) {
        this.recordQualityIssue(
          context,
          "vestingSchedulesWithoutRoundName",
          identity,
          { sourcePath }
        );
        return;
      }
      const saleId = this.cleanSaleId(item?.saleId ?? item?.id);
      const normalizedRoundName = normalizeVestingName(roundName);
      if (!this.findRoundInput(rounds, { saleId, normalizedRoundName })) {
        this.recordQualityIssue(
          context,
          "vestingSchedulesWithoutMatchedRound",
          identity,
          { sourcePath, roundName, saleId }
        );
      }
    });
  }

  private collectUnlockEventQuality(
    sourceProject: Record<string, any>,
    identity: ProjectIdentity,
    context: ImportContext
  ): void {
    const inspect = (
      item: Record<string, any>,
      sourcePath: string,
      fallbackRound?: Record<string, any>
    ) => {
      if (!toUnlockDate(item?.unlockDate || item?.date)) {
        this.recordQualityIssue(context, "unlockEventsWithoutDate", identity, {
          sourcePath,
        });
      }
      const roundName = cleanUnlockString(
        fallbackRound?.roundName ||
          fallbackRound?.name ||
          fallbackRound?.sale ||
          item?.roundName ||
          item?.stage ||
          (Array.isArray(item?.roundNames) && item.roundNames.length === 1
            ? item.roundNames[0]
            : undefined)
      );
      if (!roundName) {
        this.recordQualityIssue(
          context,
          "unlockEventsWithoutRoundName",
          identity,
          { sourcePath }
        );
      }
      const saleId = this.cleanSaleId(
        fallbackRound?.saleId ?? fallbackRound?.id ?? item?.saleId
      );
      if (saleId === undefined) {
        this.recordQualityIssue(
          context,
          "unlockEventsWithoutSaleId",
          identity,
          { sourcePath, roundName }
        );
      }
    };

    this.arrayValue(sourceProject.unlockingEvents).forEach((event, eventIndex) => {
      const rounds = this.arrayValue(event?.rounds);
      if (rounds.length) {
        rounds.forEach((round, roundIndex) =>
          inspect(event, `unlockingEvents.${eventIndex}.rounds.${roundIndex}`, round)
        );
      } else {
        inspect(event, `unlockingEvents.${eventIndex}`);
      }
    });

    if (sourceProject.nextUnlockingEvent) {
      const next = sourceProject.nextUnlockingEvent;
      const rounds = this.arrayValue(next?.rounds);
      if (rounds.length) {
        rounds.forEach((round, roundIndex) =>
          inspect(next, `nextUnlockingEvent.rounds.${roundIndex}`, round)
        );
      } else {
        inspect(next, "nextUnlockingEvent");
      }
    }
  }

  private recordQualityIssue(
    context: ImportContext,
    key: keyof FomoV2VestingImportResult,
    identity: ProjectIdentity,
    example: Record<string, any>
  ): void {
    (context.result as any)[key] = ((context.result as any)[key] || 0) + 1;
    this.pushDebug(context, "qualityIssues", {
      issue: key,
      dropstab: this.dropstabDebugIdentity(identity),
      ...example,
    });
  }

  private async processTokenAllocation(
    input: FomoV2TokenAllocationInput,
    context: ImportContext
  ): Promise<void> {
    context.result.tokenAllocationsFound += 1;
    if (context.write) {
      const written = await this.vestingService.upsertTokenAllocation(input);
      const id = this.toObjectId((written.doc as any)?._id);
      if (id && input.canonicalFingerprint) {
        context.writtenTokenAllocationIds.set(input.canonicalFingerprint, id);
      }
      this.bumpCreateUpdate(
        context.result,
        "tokenAllocationsWouldCreate",
        "tokenAllocationsWouldUpdate",
        written.created
      );
      this.pushDebug(context, "tokenAllocations", {
        action: written.created ? "create" : "update",
        name: input.name,
        canonicalFingerprint: input.canonicalFingerprint,
      });
      return;
    }
    const sourceType = projectSourceTypeMongoPattern(input.sourceType);
    const existing = await this.tokenAllocationModel
      .findOne({
        $or: [
          {
            canonicalFingerprint: input.canonicalFingerprint,
            sourceType,
          },
          ...(input.saleId !== undefined
            ? [
                {
                  canonicalProjectId: input.canonicalProjectId,
                  sourceType,
                  saleId: input.saleId,
                },
              ]
            : []),
          {
            canonicalProjectId: input.canonicalProjectId,
            sourceType,
            normalizedName: input.normalizedName,
          },
        ],
      })
      .lean();
    if (input.canonicalFingerprint) {
      context.writtenTokenAllocationIds.set(
        input.canonicalFingerprint,
        this.toObjectId((existing as any)?._id) || new Types.ObjectId()
      );
    }
    this.bumpCreateUpdate(
      context.result,
      "tokenAllocationsWouldCreate",
      "tokenAllocationsWouldUpdate",
      !existing
    );
  }

  private async processVestingRound(
    input: FomoV2VestingRoundInput,
    context: ImportContext
  ): Promise<void> {
    context.result.vestingRoundsFound += 1;
    if (context.write) {
      const written = await this.vestingService.upsertVestingRound(input);
      const id = this.toObjectId((written.doc as any)?._id);
      if (id && input.canonicalFingerprint) {
        context.writtenRoundIds.set(input.canonicalFingerprint, id);
      }
      this.bumpCreateUpdate(
        context.result,
        "vestingRoundsWouldCreate",
        "vestingRoundsWouldUpdate",
        written.created
      );
      return;
    }
    const sourceType = projectSourceTypeMongoPattern(input.sourceType);
    const existing = await this.vestingRoundModel
      .findOne({
        $or: [
          {
            canonicalFingerprint: input.canonicalFingerprint,
            sourceType,
          },
          ...(input.saleId !== undefined
            ? [
                {
                  canonicalProjectId: input.canonicalProjectId,
                  sourceType,
                  saleId: input.saleId,
                },
              ]
            : []),
          {
            canonicalProjectId: input.canonicalProjectId,
            sourceType,
            normalizedRoundName: input.normalizedRoundName,
          },
        ],
      })
      .lean();
    if (input.canonicalFingerprint) {
      context.writtenRoundIds.set(
        input.canonicalFingerprint,
        this.toObjectId((existing as any)?._id) || new Types.ObjectId()
      );
    }
    this.bumpCreateUpdate(
      context.result,
      "vestingRoundsWouldCreate",
      "vestingRoundsWouldUpdate",
      !existing
    );
  }

  private async processVestingSchedule(
    input: FomoV2VestingScheduleInput,
    context: ImportContext
  ): Promise<void> {
    const tokenAllocationId = await this.resolveTokenAllocationId(input, context);
    if (!tokenAllocationId) {
      this.recordSkipped(context.result, "missing_token_allocation", 1, {
        roundName: input.roundName,
        saleId: input.saleId,
      });
      return;
    }
    const roundId = await this.resolveVestingRoundId(input, context);
    if (!roundId) {
      this.recordSkipped(context.result, "missing_vesting_round", 1, {
        roundName: input.roundName,
        saleId: input.saleId,
      });
      return;
    }
    const scheduleInput = {
      ...input,
      tokenAllocationId,
      vestingRoundId: roundId,
      canonicalFingerprint: buildVestingScheduleFingerprint({
        canonicalProjectId: input.canonicalProjectId,
        vestingRoundId: roundId,
        sourceType: input.sourceType,
        saleId: input.saleId,
        roundName: input.roundName,
        normalizedRoundName: input.normalizedRoundName,
      }),
    };
    context.result.vestingSchedulesFound += 1;
    if (context.write) {
      const written =
        await this.vestingService.upsertVestingSchedule(scheduleInput);
      this.bumpCreateUpdate(
        context.result,
        "vestingSchedulesWouldCreate",
        "vestingSchedulesWouldUpdate",
        written.created
      );
      return;
    }
    const sourceType = projectSourceTypeMongoPattern(input.sourceType);
    const existing = await this.vestingScheduleModel
      .findOne({
        $or: [
          {
            canonicalFingerprint: scheduleInput.canonicalFingerprint,
            sourceType,
          },
          { vestingRoundId: roundId, sourceType },
          ...(input.saleId !== undefined
            ? [
                {
                  canonicalProjectId: input.canonicalProjectId,
                  sourceType,
                  saleId: input.saleId,
                },
              ]
            : []),
        ],
      })
      .lean();
    this.bumpCreateUpdate(
      context.result,
      "vestingSchedulesWouldCreate",
      "vestingSchedulesWouldUpdate",
      !existing
    );
  }

  private async processUnlockEvent(
    input: FomoV2UnlockEventInput,
    context: ImportContext
  ): Promise<void> {
    const vestingRoundId = await this.resolveUnlockVestingRoundId(input);
    const unlockInput = {
      ...input,
      vestingRoundId,
      canonicalFingerprint: buildUnlockEventFingerprint({
        canonicalProjectId: input.canonicalProjectId,
        sourceType: input.sourceType,
        saleId: input.saleId,
        unlockDate: input.unlockDate,
        roundName: input.roundName,
        normalizedRoundName: input.normalizedRoundName,
        unlockType: input.unlockType,
      }),
    };
    context.result.unlockEventsFound += 1;
    if (context.write) {
      const written = await this.unlocksService.upsertUnlockEvent(unlockInput);
      const id = this.toObjectId((written.doc as any)?._id);
      if (id && unlockInput.canonicalFingerprint) {
        context.writtenUnlockIds.set(unlockInput.canonicalFingerprint, id);
      }
      const unlockDateKey = this.dateKey(unlockInput.unlockDate);
      if (id && unlockDateKey && !context.writtenUnlockIdsByDate.has(unlockDateKey)) {
        context.writtenUnlockIdsByDate.set(unlockDateKey, id);
      }
      this.bumpCreateUpdate(
        context.result,
        "unlockEventsWouldCreate",
        "unlockEventsWouldUpdate",
        written.created
      );
      return;
    }
    const existing = await this.unlockEventModel
      .findOne({
        $or: [
          {
            canonicalFingerprint: unlockInput.canonicalFingerprint,
            sourceType: input.sourceType,
          },
          ...(input.saleId !== undefined
            ? [
                {
                  canonicalProjectId: input.canonicalProjectId,
                  sourceType: input.sourceType,
                  saleId: input.saleId,
                  unlockDate: toUnlockDate(input.unlockDate),
                  unlockType: cleanUnlockString(input.unlockType),
                },
              ]
            : []),
        ],
      })
      .lean();
    this.bumpCreateUpdate(
      context.result,
      "unlockEventsWouldCreate",
      "unlockEventsWouldUpdate",
      !existing
    );
  }

  private async processVestingSummary(
    input: FomoV2VestingSummaryInput,
    context: ImportContext
  ): Promise<void> {
    const summaryInput = {
      ...input,
      nextUnlockEventId:
        this.findWrittenNextUnlockId(input.nextUnlockDate, context) ||
        input.nextUnlockEventId,
    };
    if (context.write) {
      const written = await this.vestingService.upsertVestingSummary(summaryInput);
      this.bumpCreateUpdate(
        context.result,
        "summariesWouldCreate",
        "summariesWouldUpdate",
        written.created
      );
      return;
    }
    const existing = await this.vestingSummaryModel
      .findOne({
        canonicalProjectId: input.canonicalProjectId,
        sourceType: projectSourceTypeMongoPattern(input.sourceType),
      })
      .lean();
    this.bumpCreateUpdate(
      context.result,
      "summariesWouldCreate",
      "summariesWouldUpdate",
      !existing
    );
  }

  private async resolveVestingRoundId(
    schedule: FomoV2VestingScheduleInput,
    context: ImportContext
  ): Promise<Types.ObjectId | undefined> {
    const direct = this.toObjectId(schedule.vestingRoundId);
    if (direct) return direct;
    const fromWritten = context.writtenRoundIds.get(
      String(schedule.vestingRoundId || "")
    );
    if (fromWritten) return fromWritten;
    const existing = await this.vestingService.findVestingRoundForSource({
      canonicalProjectId: schedule.canonicalProjectId,
      sourceType: schedule.sourceType,
      saleId: schedule.saleId,
      normalizedRoundName: schedule.normalizedRoundName,
      roundName: schedule.roundName,
    });
    const existingId = this.toObjectId((existing as any)?._id);
    if (existingId) return existingId;
    return context.write ? undefined : new Types.ObjectId();
  }

  private async resolveTokenAllocationId(
    schedule: FomoV2VestingScheduleInput,
    context: ImportContext
  ): Promise<Types.ObjectId | undefined> {
    const direct = this.toObjectId(schedule.tokenAllocationId);
    if (direct) return direct;
    const fromWritten = context.writtenTokenAllocationIds.get(
      String(schedule.tokenAllocationId || "")
    );
    if (fromWritten) return fromWritten;

    const normalizedName =
      cleanVestingString(schedule.normalizedRoundName) ||
      normalizeVestingName(schedule.roundName);
    const filters: Record<string, any>[] = [
      ...(schedule.tokenAllocationId
        ? [
            {
              canonicalFingerprint: String(schedule.tokenAllocationId),
              sourceType: schedule.sourceType,
            },
          ]
        : []),
      ...(schedule.saleId !== undefined
        ? [
            {
              canonicalProjectId: schedule.canonicalProjectId,
              sourceType: schedule.sourceType,
              saleId: schedule.saleId,
            },
          ]
        : []),
      ...(normalizedName
        ? [
            {
              canonicalProjectId: schedule.canonicalProjectId,
              sourceType: schedule.sourceType,
              normalizedName,
            },
          ]
        : []),
    ];
    if (!filters.length) return context.write ? undefined : new Types.ObjectId();

    const existing = await this.tokenAllocationModel
      .findOne(filters.length === 1 ? filters[0] : { $or: filters })
      .lean();
    const existingId = this.toObjectId((existing as any)?._id);
    if (existingId) return existingId;
    return context.write ? undefined : new Types.ObjectId();
  }

  private async resolveUnlockVestingRoundId(
    event: FomoV2UnlockEventInput
  ): Promise<Types.ObjectId | undefined> {
    const existing = await this.vestingService.findVestingRoundForSource({
      canonicalProjectId: event.canonicalProjectId,
      sourceType: event.sourceType,
      saleId: event.saleId,
      normalizedRoundName: event.normalizedRoundName,
      roundName: event.roundName,
    });
    return this.toObjectId((existing as any)?._id);
  }

  private findWrittenNextUnlockId(
    nextUnlockDate: any,
    context: ImportContext
  ): Types.ObjectId | undefined {
    const key = this.dateKey(nextUnlockDate);
    return key ? context.writtenUnlockIdsByDate.get(key) : undefined;
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
    if (canonicalSourceMatch.canonicalProjectId || canonicalSourceMatch.ambiguous)
      return canonicalSourceMatch;

    if (identity.coingeckoId) {
      const coingeckoMatch = await this.resolveByMarketAssets(
        { "providerIds.coingeckoId": identity.coingeckoId },
        "market_assets_coingecko_id",
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
        "market_assets_name_symbol",
        0.95
      );
      if (nameSymbolMatch.canonicalProjectId || nameSymbolMatch.ambiguous)
        return nameSymbolMatch;
    }

    if (identity.normalizedName && identity.sourceSlug) {
      const nameSlugMatch = await this.resolveByMarketAssets(
        { normalizedName: identity.normalizedName, slug: identity.sourceSlug },
        "market_assets_name_slug",
        0.95
      );
      if (nameSlugMatch.canonicalProjectId || nameSlugMatch.ambiguous)
        return nameSlugMatch;
    }

    return {
      matchedBy: "none",
      score: 0,
      reason:
        profileMatch.reason ||
        sourceEntityMatch.reason ||
        canonicalSourceMatch.reason ||
        "No source profile, source registry, coingecko, name+symbol, or name+slug match.",
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

  private async simulateProjectCandidate(
    identity: ProjectIdentity,
    context: ImportContext
  ): Promise<void> {
    const candidate: FomoV2ImportCandidateInput & {
      domain: string;
      entityType: "project";
      sourceType: string;
    } = {
      domain: "vesting",
      entityType: "project",
      sourceType: context.sourceType,
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
    const candidateFingerprint = buildImportCandidateFingerprint(candidate);
    if (context.seenCandidateFingerprints.has(candidateFingerprint)) return;
    context.seenCandidateFingerprints.add(candidateFingerprint);

    if (context.write) {
      const written = await this.importCandidateService.createOrUpdateCandidate({
        ...candidate,
        candidateFingerprint,
        metadata: {
          importer: "fomo-v2:vesting-import",
          sourceCollection: PARSER_COLLECTION,
          dryRunOnly: false,
        },
      });
      if (written.created) context.result.projectCandidatesWouldCreate += 1;
    } else {
      const existing = await this.importCandidateModel
        .findOne({ candidateFingerprint })
        .lean();
      if (!existing) context.result.projectCandidatesWouldCreate += 1;
    }
  }

  private async recordReview(
    context: ImportContext,
    input: {
      reason: string;
      domain: string;
      sourceType: string;
      identity: ProjectIdentity;
      canonicalProjectId?: Types.ObjectId | string;
      currentSourceType?: string;
    }
  ): Promise<void> {
    const projectKey =
      input.identity.sourceProjectId ||
      input.identity.sourceId ||
      input.identity.sourceSlug ||
      input.identity.sourceDocumentId;
    const fingerprint =
      input.reason === "SOURCE_CONFLICT"
        ? buildSourceConflictReviewFingerprint({
            canonicalProjectId: input.canonicalProjectId,
            domain: input.domain,
            currentSourceType: input.currentSourceType,
            incomingSourceType: input.sourceType,
          })
        : buildReviewFingerprint({
            domain: input.domain,
            reason: input.reason,
            canonicalProjectId: input.canonicalProjectId,
            incomingSourceType: input.sourceType,
            projectKey,
            projectName: input.identity.name,
            normalizedProjectName: input.identity.normalizedName,
          });
    if (context.seenReviewFingerprints.has(fingerprint)) return;
    context.seenReviewFingerprints.add(fingerprint);

    const candidates = this.projectReviewCandidates(input);
    if (context.write) {
      const metadata = {
        importer: "fomo-v2:vesting-import",
        sourceCollection: PARSER_COLLECTION,
        sourceDocumentId: input.identity.sourceDocumentId,
        sourceProjectId: input.identity.sourceProjectId || input.identity.sourceId,
        sourceSlug: input.identity.sourceSlug,
        dryRunOnly: false,
      };
      const written =
        input.reason === "SOURCE_CONFLICT" &&
        input.canonicalProjectId &&
        input.currentSourceType
          ? await this.reviewService.createSourceConflictReview({
              canonicalProjectId: input.canonicalProjectId,
              domain: input.domain,
              currentSourceType: input.currentSourceType,
              incomingSourceType: input.sourceType,
              affectedEntityTypes: [
                "token_allocation",
                "vesting_round",
                "vesting_schedule",
                "unlock_event",
                "vesting_summary",
              ],
              candidates,
              metadata,
            })
          : await this.reviewService.createOrUpdateBatch({
              domain: input.domain,
              reason: input.reason,
              canonicalProjectId: input.canonicalProjectId,
              projectKey,
              projectName: input.identity.name,
              normalizedProjectName: input.identity.normalizedName,
              incomingSourceType: input.sourceType,
              affectedEntityTypes: ["canonical_project", "vesting_round"],
              candidates,
              candidateCount: candidates.length,
              fingerprint,
              metadata,
            });
      if (written?.created) context.result.reviewsWouldCreate += 1;
      return;
    }

    const existing = await this.reviewBatchModel
      .findOne({ fingerprint, status: "open" })
      .lean();
    if (!existing) context.result.reviewsWouldCreate += 1;
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
        sourcePath: input.identity.sourceDocumentId,
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

  private projectIdentity(sourceProject: Record<string, any>): ProjectIdentity {
    const raw = sourceProject.raw || {};
    const identity = sourceProject.identity || {};
    const sourceDocumentId = this.toIdString(sourceProject._id);
    const currencyId = cleanVestingString(sourceProject.currencyId);
    const sourceProjectId = cleanVestingString(
      sourceProject.sourceProjectId ||
        sourceProject.sourceId ||
        sourceProject.coinId ||
        currencyId ||
        raw.sourceProjectId ||
        raw.coinId
    );
    const rawSlug = cleanVestingString(
      sourceProject.coinSlug ||
        identity.slug ||
        sourceProject.sourceSlug ||
        sourceProject.slug ||
        raw.coinSlug ||
        raw.slug
    );
    const sourceSlug = this.normalizeSlug(rawSlug || sourceProjectId);
    const sourceUrl =
      this.normalizeUrl(sourceProject.sourceUrl || identity.sourceUrl) ||
      (sourceSlug
        ? `https://dropstab.com/coins/${encodeURIComponent(sourceSlug)}`
        : undefined);
    const name = cleanVestingString(
      identity.name ||
        sourceProject.name ||
        sourceProject.coinName ||
        raw.name ||
        raw.coinName
    );
    const symbol = cleanVestingString(
      identity.symbol ||
        sourceProject.symbol ||
        sourceProject.coinSymbol ||
        raw.symbol ||
        raw.ticker
    );
    const coingeckoId = this.normalizeProviderId(
      sourceProject.coingeckoId ||
        sourceProject.providerIds?.coingeckoId ||
        sourceProject.market?.coingeckoId ||
        raw.coingeckoId ||
        raw.providerIds?.coingeckoId
    );
    return {
      sourceDocumentId,
      sourceProjectId,
      sourceId: currencyId || sourceProjectId,
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

  private sourceRef(
    identity: ProjectIdentity,
    sourceType: string,
    sourcePath: string,
    sourceId?: string | number
  ): any {
    return {
      source: sourceType,
      sourceId:
        sourceId === undefined
          ? identity.sourceProjectId || identity.sourceId
          : String(sourceId),
      sourceSlug: identity.sourceSlug,
      sourceUrl: identity.sourceUrl,
      sourcePath,
      observedAt: new Date(),
      confidence: "high",
      metadata: { sourceDocumentId: identity.sourceDocumentId },
    };
  }

  private projectItemCounts(sourceProject: Record<string, any>) {
    const tokenAllocations = this.arrayValue(sourceProject.tokenAllocation).length;
    const vestingRounds = this.arrayValue(sourceProject.vestingRounds).length;
    const vestingSchedules =
      this.arrayValue(sourceProject.vestingSchedule).length ||
      this.arrayValue(sourceProject.vestingTimeline).length;
    const unlockEvents =
      this.arrayValue(sourceProject.unlockingEvents).length +
      (sourceProject.nextUnlockingEvent ? 1 : 0);
    return {
      tokenAllocations,
      vestingRounds,
      vestingSchedules,
      unlockEvents,
      total: tokenAllocations + vestingRounds + vestingSchedules + unlockEvents,
    };
  }

  private parserCollection(): any {
    const db = (this.parserConnection as any).db;
    if (!db) throw new Error("Parser DB connection is not initialized.");
    return db.collection(PARSER_COLLECTION);
  }

  private vestingQuery(
    sourceType: string,
    filter: { sourceSlug?: string; sourceProjectId?: string } = {},
  ): Record<string, any> {
    const baseQuery = {
      source: sourceType,
      $or: [
        { "tokenAllocation.0": { $exists: true } },
        { "vestingRounds.0": { $exists: true } },
        { "vestingSchedule.0": { $exists: true } },
        { "vestingTimeline.0": { $exists: true } },
        { "unlockingEvents.0": { $exists: true } },
        ...this.vestingSummaryMeaningfulClauses(),
      ],
    };
    const sourceSlug = this.normalizeSlug(filter.sourceSlug);
    const sourceProjectId = cleanVestingString(filter.sourceProjectId);
    const projectClauses: Array<Record<string, any>> = [];

    if (sourceSlug) {
      projectClauses.push(
        { coinSlug: sourceSlug },
        { sourceSlug },
        { slug: sourceSlug },
        { "identity.slug": sourceSlug },
        { "raw.coinSlug": sourceSlug },
        { "raw.slug": sourceSlug },
      );
    }
    if (sourceProjectId) {
      projectClauses.push(
        { currencyId: sourceProjectId },
        { sourceProjectId },
        { sourceId: sourceProjectId },
        { coinId: sourceProjectId },
        { "raw.currencyId": sourceProjectId },
        { "raw.sourceProjectId": sourceProjectId },
        { "raw.sourceId": sourceProjectId },
        { "raw.coinId": sourceProjectId },
      );
    }

    return projectClauses.length
      ? { $and: [baseQuery, { $or: projectClauses }] }
      : baseQuery;
  }

  private vestingSummaryMeaningfulClauses(): Array<Record<string, any>> {
    return [
      "totalAmount",
      "unlockedAmount",
      "lockedAmount",
      "untrackedAmount",
      "unlockedPercent",
      "lockedPercent",
      "untrackedPercent",
      "lastUnlockDate",
      "nextUnlockDate",
    ].map((field) => ({
      [`vestingSummary.${field}`]: { $exists: true, $nin: [null, ""] },
    }));
  }

  private emptyResult(
    sourceType: string,
    debug: boolean,
    write: boolean,
    includeUnlocks: boolean,
    unlocksMode: FomoV2UnlocksMode
  ): FomoV2VestingImportResult {
    const result: FomoV2VestingImportResult = {
      mode: write ? "write" : "dry-run",
      sourceType,
      includeUnlocks,
      unlocksMode,
      totalDocs: 0,
      docsWithVesting: 0,
      eligibleDocs: 0,
      resolvedProjects: 0,
      missingProjects: 0,
      sourceConflicts: 0,
      tokenAllocationsFound: 0,
      tokenAllocationsWithoutName: 0,
      tokenAllocationsWouldCreate: 0,
      tokenAllocationsWouldUpdate: 0,
      vestingRoundsFound: 0,
      vestingRoundsWithoutRoundName: 0,
      vestingRoundsWouldCreate: 0,
      vestingRoundsWouldUpdate: 0,
      vestingSchedulesFound: 0,
      vestingSchedulesWithoutRoundName: 0,
      vestingSchedulesWithoutMatchedRound: 0,
      vestingSchedulesWouldCreate: 0,
      vestingSchedulesWouldUpdate: 0,
      unlockEventsFound: 0,
      unlockEventsWithoutDate: 0,
      unlockEventsWithoutRoundName: 0,
      unlockEventsWithoutSaleId: 0,
      unlockEventsSkippedByMode: 0,
      unlockEventsWouldCreate: 0,
      unlockEventsWouldUpdate: 0,
      emptySummariesSkipped: 0,
      summariesWouldCreate: 0,
      summariesWouldUpdate: 0,
      projectCandidatesWouldCreate: 0,
      reviewsWouldCreate: 0,
      skipped: { total: 0, byReason: {} },
      warnings: [],
      errors: [],
    };
    if (debug) {
      result.skipped.examples = [];
      result.debugExamples = {
        resolvedProjects: [],
        missingProjects: [],
        sourceConflicts: [],
        tokenAllocations: [],
        vestingRounds: [],
        vestingSchedules: [],
        unlockEvents: [],
        summaries: [],
        qualityIssues: [],
        projectCandidates: [],
        reviews: [],
      };
    }
    return result;
  }

  private recordSkipped(
    result: FomoV2VestingImportResult,
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
    context: ImportContext,
    key: string,
    value: Record<string, any>
  ): void {
    const target = context.result.debugExamples?.[key];
    if (!context.debug || !target || target.length >= DEBUG_LIMIT) return;
    target.push(value);
  }

  private bumpCreateUpdate(
    result: FomoV2VestingImportResult,
    createKey: keyof FomoV2VestingImportResult,
    updateKey: keyof FomoV2VestingImportResult,
    created: boolean
  ): void {
    if (created) (result as any)[createKey] += 1;
    else (result as any)[updateKey] += 1;
  }

  private projectDebug(identity: ProjectIdentity, resolved: ProjectResolveResult) {
    return {
      dropstab: this.dropstabDebugIdentity(identity),
      canonical: this.canonicalDebug(resolved.canonical),
      matchedBy: resolved.matchedBy,
      score: resolved.score,
      reason: resolved.reason,
    };
  }

  private dropstabDebugIdentity(identity: ProjectIdentity) {
    return {
      name: identity.name,
      symbol: identity.symbol,
      slug: identity.sourceSlug || identity.rawSlug,
      sourceProjectId: identity.sourceProjectId || identity.sourceId,
      sourceUrl: identity.sourceUrl,
    };
  }

  private canonicalDebug(value?: Record<string, any>) {
    if (!value) return undefined;
    return {
      canonicalProjectId: this.toIdString(value._id),
      name: value.name,
      symbol: value.symbol,
      slug: value.slug,
    };
  }

  private findRoundInput(
    rounds: FomoV2VestingRoundInput[],
    input: { saleId?: string | number; normalizedRoundName?: string }
  ): FomoV2VestingRoundInput | undefined {
    if (input.saleId !== undefined) {
      const bySale = rounds.find((round) => round.saleId === input.saleId);
      if (bySale) return bySale;
    }
    if (input.normalizedRoundName) {
      return rounds.find(
        (round) => round.normalizedRoundName === input.normalizedRoundName
      );
    }
    return undefined;
  }

  private findTokenAllocationInput(
    tokenAllocations: FomoV2TokenAllocationInput[],
    input: { saleId?: string | number; normalizedName?: string }
  ): FomoV2TokenAllocationInput | undefined {
    if (input.saleId !== undefined) {
      const bySale = tokenAllocations.find((allocation) => allocation.saleId === input.saleId);
      if (bySale) return bySale;
    }
    if (input.normalizedName) {
      return tokenAllocations.find(
        (allocation) => allocation.normalizedName === input.normalizedName
      );
    }
    return undefined;
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

  private normalizeSourceType(value: any): string {
    return normalizeProjectSourceType(value || "dropstab");
  }

  private toUnlockEventsImportMode(
    unlocksMode: FomoV2UnlocksMode
  ): FomoV2UnlockEventsImportMode {
    if (unlocksMode === "next-only") return "next-only";
    if (unlocksMode === "daily") return "all";
    if (unlocksMode === "monthly") {
      throw new Error(
        "Monthly unlock aggregation is not implemented in unlock-events import; --unlocks-mode=monthly is deprecated/unsupported."
      );
    }
    return "next-only";
  }

  private mergeUnlockImportResult(
    result: FomoV2VestingImportResult,
    unlockImport: FomoV2UnlockEventsImportResult
  ): void {
    result.unlockEventsFound = unlockImport.sourceEventsFound;
    result.unlockEventsSkippedByMode = unlockImport.dryRun
      ? unlockImport.eventsWouldSkip
      : unlockImport.eventsSkipped;
    result.unlockEventsWouldCreate = unlockImport.dryRun
      ? unlockImport.eventsWouldCreate
      : unlockImport.eventsCreated;
    result.unlockEventsWouldUpdate = unlockImport.dryRun
      ? unlockImport.eventsWouldUpdate + unlockImport.eventsWouldRemainUnchanged
      : unlockImport.eventsUpdated + unlockImport.eventsUnchanged;
    if (unlockImport.skippedInactiveSource) {
      result.warnings.push(
        `Unlock events skipped by inactive tokenomics source: ${unlockImport.skippedInactiveSource}.`
      );
    }
    if (unlockImport.skippedSourceConflict) {
      result.warnings.push(
        `Unlock events skipped by source conflict: ${unlockImport.skippedSourceConflict}.`
      );
    }
    if (unlockImport.skippedNoActiveVestingSource) {
      result.warnings.push(
        `Unlock events skipped without active vesting source: ${unlockImport.skippedNoActiveVestingSource}.`
      );
    }
    if (unlockImport.resolveWarnings) {
      result.warnings.push(
        `Unlock event link resolve warnings: ${unlockImport.resolveWarnings}.`
      );
    }
    result.warnings.push(...unlockImport.warnings);
    result.errors.push(
      ...unlockImport.errors.map((error) => ({
        domain: "unlocks",
        ...error,
      }))
    );
  }

  private normalizeUnlocksMode(value: any): FomoV2UnlocksMode {
    const mode = cleanVestingString(value)?.toLowerCase() || "none";
    if (["none", "daily", "monthly", "next-only"].includes(mode)) {
      return mode as FomoV2UnlocksMode;
    }
    throw new Error(
      `Unsupported unlocksMode "${value}". Use daily, monthly, next-only, or none.`
    );
  }

  private normalizeProjectName(value: any): string | undefined {
    const text = cleanVestingString(value);
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
    const text = cleanVestingString(value);
    if (!text) return undefined;
    return text.replace(/^\$/, "").toUpperCase();
  }

  private normalizeSlug(value: any): string | undefined {
    const text = cleanVestingString(value);
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
    return cleanVestingString(value)?.toLowerCase();
  }

  private normalizeUrl(value: any): string | undefined {
    const text = cleanVestingString(value);
    if (!text) return undefined;
    const prepared = /^[a-z]+:\/\//i.test(text) ? text : `https://${text}`;
    try {
      const parsed = new URL(prepared);
      const path = parsed.pathname.replace(/\/+$/, "");
      return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${path}${parsed.search}`;
    } catch {
      return text;
    }
  }

  private cleanSaleId(value: any): string | number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    return typeof value === "number" && Number.isFinite(value)
      ? value
      : cleanVestingString(value);
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

  private dateKey(value: any): string | undefined {
    const date = toVestingDate(value);
    return date ? date.toISOString().slice(0, 10) : undefined;
  }

  private monthBucket(value: any): string | undefined {
    const date = toVestingDate(value);
    return date ? date.toISOString().slice(0, 7) : undefined;
  }

  private addOptionalNumbers(
    left: number | undefined,
    right: number | undefined
  ): number | undefined {
    const leftNumber = Number(left);
    const rightNumber = Number(right);
    const hasLeft = Number.isFinite(leftNumber);
    const hasRight = Number.isFinite(rightNumber);
    if (!hasLeft && !hasRight) return undefined;
    return (hasLeft ? leftNumber : 0) + (hasRight ? rightNumber : 0);
  }

  private uniqueStrings(values: any[]): string[] {
    return Array.from(
      new Set(values.map((value) => cleanVestingString(value)).filter(Boolean))
    ) as string[];
  }

  private arrayValue(value: any): any[] {
    if (Array.isArray(value)) return value;
    return value === undefined || value === null ? [] : [value];
  }
}
