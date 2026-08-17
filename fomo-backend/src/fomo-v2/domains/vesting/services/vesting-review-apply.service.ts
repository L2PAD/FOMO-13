import { Inject, Injectable } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { ClientSession, Connection, Model, Types } from "mongoose";
import {
  dropstabVestingSourceContext,
  firstFiniteNumber,
  hasNonEmptyVestingSummary,
  hasVestingImportData,
  normalizeDropstabSourceType,
  normalizeVestingName,
  toVestingDate,
} from "../helpers";
import { FomoV2UnlockEvent } from "../../unlocks/models/unlock-event.model";
import { FomoV2UnlocksService } from "../../unlocks/services/unlocks.service";
import type { FomoV2UnlockEventInput } from "../../unlocks/types";
import {
  FomoV2TokenAllocation,
  FomoV2VestingRound,
  FomoV2VestingSchedule,
  FomoV2VestingSummary,
} from "../models";
import {
  FomoV2NormalizedAllocationCandidate,
  FomoV2NormalizedRoundCandidate,
  FomoV2NormalizedScheduleCandidate,
  FomoV2VestingCandidateNormalizerService,
} from "./vesting-candidate-normalizer.service";
import { FomoV2VestingDedupeService } from "./vesting-dedupe.service";
import { FomoV2VestingService } from "./vesting.service";

interface ResolvedCandidate<TCandidate = any> {
  candidate: TCandidate;
  id: Types.ObjectId;
}

interface RelationIndex {
  bySaleId: Map<string, Types.ObjectId[]>;
  byName: Map<string, Types.ObjectId[]>;
}

interface ReviewBatchIdentity {
  canonicalProjectId: Types.ObjectId;
  sourceType: string;
  sourceProjectKey?: string;
  sourceSlug?: string;
  sourceDocumentId?: string;
  sourceUrl?: string;
  projectName?: string;
  symbol?: string;
}

export interface FomoV2VestingReviewApplyResult {
  applied: boolean;
  reason?: string;
  replacementScope: "canonical_project";
  canonicalProjectId?: string;
  sourceType?: string;
  sourceSlug?: string;
  sourceProjectKey?: string;
  deleted: {
    tokenAllocations: number;
    vestingRounds: number;
    vestingSchedules: number;
    vestingSummaries: number;
    unlockEvents: number;
  };
  written: {
    tokenAllocations: number;
    vestingRounds: number;
    vestingSchedules: number;
    vestingSummaries: number;
    unlockEvents: number;
  };
  skipped: {
    vestingSchedulesMissingTokenAllocation: number;
    vestingSchedulesMissingRound: number;
    vestingSchedulesAmbiguousTokenAllocation: number;
    vestingSchedulesAmbiguousRound: number;
  };
  duplicateGroups: {
    tokenAllocations: number;
    vestingRounds: number;
    vestingSchedules: number;
  };
  warnings: string[];
}

export interface FomoV2VestingReviewApplyOptions {
  rawSourceOverride?: Record<string, any>;
}

export interface FomoV2ProjectVestingSnapshot {
  canonicalProjectId: string;
  sourceType?: string;
  sourceSlug?: string;
  sourceProjectKey?: string;
  sourceUrl?: string;
  counts: {
    tokenAllocation: number;
    vestingRounds: number;
    vestingSchedule: number;
    vestingSummary: number;
  };
  rawSource: {
    tokenAllocation: Array<Record<string, any>>;
    vestingRounds: Array<Record<string, any>>;
    vestingSchedule: Array<Record<string, any>>;
    vestingSummary: Record<string, any>;
  };
}

export interface FomoV2ProjectVestingReplaceInput {
  canonicalProjectId: Types.ObjectId | string;
  sourceType?: string;
  sourceSlug?: string;
  sourceProjectKey?: string;
  sourceDocumentId?: string;
  sourceUrl?: string;
  projectName?: string;
  symbol?: string;
  rawSource?: Record<string, any>;
}

@Injectable()
export class FomoV2VestingReviewApplyService {
  constructor(
    private readonly normalizer: FomoV2VestingCandidateNormalizerService,
    private readonly dedupe: FomoV2VestingDedupeService,
    private readonly vestingService: FomoV2VestingService,
    @Inject(FomoV2UnlocksService)
    private readonly unlocksService: FomoV2UnlocksService,
    @InjectConnection()
    private readonly connection: Connection,
    @InjectModel(FomoV2TokenAllocation.name)
    private readonly tokenAllocationModel: Model<FomoV2TokenAllocation>,
    @InjectModel(FomoV2VestingRound.name)
    private readonly vestingRoundModel: Model<FomoV2VestingRound>,
    @InjectModel(FomoV2VestingSchedule.name)
    private readonly vestingScheduleModel: Model<FomoV2VestingSchedule>,
    @InjectModel(FomoV2VestingSummary.name)
    private readonly vestingSummaryModel: Model<FomoV2VestingSummary>,
    @InjectModel(FomoV2UnlockEvent.name)
    private readonly unlockEventModel: Model<FomoV2UnlockEvent>
  ) {}

  canApplyReviewBatch(batch: any): boolean {
    if (cleanString(batch?.domain) !== "vesting") return false;
    const firstCandidate = this.firstCandidate(batch);
    const suggestedAction =
      cleanString(readPath(firstCandidate, "metadata.suggestedAction")) ||
      cleanString(readPath(batch, "metadata.suggestedAction"));
    const reviewScope = cleanString(readPath(batch, "metadata.reviewScope"));
    const reason = cleanString(batch?.reason);
    return (
      cleanString(firstCandidate?.entityType) === "vesting_component" &&
      Boolean(this.toObjectId(batch?.canonicalProjectId)) &&
      (suggestedAction === "review_and_create_vesting_records" ||
        reviewScope === "whole_vesting_component" ||
        reviewScope === "existing_vesting_source" ||
        reason === "MISSING_REQUIRED_RELATION" ||
        reason === "EXISTING_SOURCE_VESTING")
    );
  }

  async applyReviewBatch(
    batch: any,
    options: FomoV2VestingReviewApplyOptions = {}
  ): Promise<FomoV2VestingReviewApplyResult> {
    const identity = this.reviewBatchIdentity(batch);
    if (!identity) {
      return this.emptyResult({
        applied: false,
        reason: "not_applicable",
      });
    }

    const sourceProject = await this.sourceProjectForBatch(
      batch,
      identity,
      options.rawSourceOverride
    );
    const marketAssetId = this.toObjectId(
      readPath(batch, "metadata.marketAssetId")
    );
    return this.applySourceProject(identity, sourceProject, {
      marketAssetId,
      emptyErrorMessage:
        "Approved vesting review has no vesting rows to apply.",
    });
  }

  async getConfirmedProjectVesting(
    canonicalProjectIdInput: Types.ObjectId | string
  ): Promise<FomoV2ProjectVestingSnapshot> {
    const canonicalProjectId = this.toObjectId(canonicalProjectIdInput);
    if (!canonicalProjectId) {
      throw new Error("canonicalProjectId is required.");
    }

    const filter = { canonicalProjectId };
    const [allocations, rounds, schedules, summaries] = await Promise.all([
      this.tokenAllocationModel
        .find(filter)
        .sort({ allocationPercent: -1, amount: -1, name: 1 })
        .lean(),
      this.vestingRoundModel
        .find(filter)
        .sort({ allocationPercent: -1, totalAmount: -1, roundName: 1 })
        .lean(),
      this.vestingScheduleModel
        .find(filter)
        .sort({ startDate: 1, endDate: 1, roundName: 1 })
        .lean(),
      this.vestingSummaryModel
        .find(filter)
        .sort({ calculatedAt: -1, updatedAt: -1 })
        .lean(),
    ]);
    const rows = [
      ...allocations,
      ...rounds,
      ...schedules,
      ...summaries,
    ] as Array<Record<string, any>>;

    return {
      canonicalProjectId: canonicalProjectId.toHexString(),
      sourceType: this.firstRowString(rows, "sourceType"),
      sourceSlug: this.firstRowString(
        rows,
        "sourceSlug",
        "sourceRefs.0.sourceSlug",
        "provenance.sourceSlug"
      ),
      sourceProjectKey: this.firstRowString(
        rows,
        "provenance.sourceProjectKey",
        "sourceRefs.0.metadata.sourceProjectKey"
      ),
      sourceUrl: this.firstRowString(
        rows,
        "sourceUrl",
        "sourceRefs.0.sourceUrl",
        "provenance.sourceUrl"
      ),
      counts: {
        tokenAllocation: allocations.length,
        vestingRounds: rounds.length,
        vestingSchedule: schedules.length,
        vestingSummary: summaries.length,
      },
      rawSource: {
        tokenAllocation: sortRawTokenAllocations(
          allocations.map((row: any) => this.allocationRawRow(row))
        ),
        vestingRounds: rounds.map((row: any) => this.roundRawRow(row)),
        vestingSchedule: schedules.map((row: any) => this.scheduleRawRow(row)),
        vestingSummary: summaries[0]
          ? this.summaryRawRow(summaries[0] as any)
          : {},
      },
    };
  }

  async replaceProjectVestingFromRaw(
    input: FomoV2ProjectVestingReplaceInput
  ): Promise<FomoV2VestingReviewApplyResult> {
    const canonicalProjectId = this.toObjectId(input.canonicalProjectId);
    if (!canonicalProjectId) {
      throw new Error("canonicalProjectId is required.");
    }
    const identity: ReviewBatchIdentity = {
      canonicalProjectId,
      sourceType: normalizeDropstabSourceType(input.sourceType || "manual"),
      sourceProjectKey: cleanString(input.sourceProjectKey),
      sourceSlug: cleanString(input.sourceSlug),
      sourceDocumentId: cleanString(input.sourceDocumentId),
      sourceUrl: cleanString(input.sourceUrl),
      projectName: cleanString(input.projectName),
      symbol: cleanString(input.symbol)?.toUpperCase(),
    };
    const sourceProject = this.composeSourceProject(
      this.vestingRawSourceOverride(input.rawSource || {}),
      identity
    );
    return this.applySourceProject(identity, sourceProject, {
      emptyErrorMessage:
        "Confirmed vesting update has no vesting rows to apply.",
    });
  }

  private async applySourceProject(
    identity: ReviewBatchIdentity,
    sourceProject: Record<string, any>,
    options: {
      marketAssetId?: Types.ObjectId;
      emptyErrorMessage: string;
    }
  ): Promise<FomoV2VestingReviewApplyResult> {
    const session = await this.connection.startSession();
    let result: FomoV2VestingReviewApplyResult | undefined;

    try {
      await session.withTransaction(
        async () => {
          result = await this.applySourceProjectInTransaction(
            identity,
            sourceProject,
            options,
            session
          );
        },
        {
          readConcern: { level: "snapshot" },
          writeConcern: { w: "majority" },
          readPreference: "primary",
        }
      );
    } finally {
      await session.endSession();
    }

    if (!result) {
      throw new Error(
        "Vesting replacement transaction completed without a result."
      );
    }
    return result;
  }

  private async applySourceProjectInTransaction(
    identity: ReviewBatchIdentity,
    sourceProject: Record<string, any>,
    options: {
      marketAssetId?: Types.ObjectId;
      emptyErrorMessage: string;
    },
    session: ClientSession
  ): Promise<FomoV2VestingReviewApplyResult> {
    const sourceContext = dropstabVestingSourceContext({
      sourceProject,
      canonicalProjectId: identity.canonicalProjectId,
      sourceType: identity.sourceType,
      scope: "vesting_allocation_schedule",
    });
    const normalized = this.normalizer.normalizeAllocationScheduleCandidates({
      sourceProject,
      sourceContext,
      canonicalProjectId: identity.canonicalProjectId,
      marketAssetId: options.marketAssetId,
      sourceType: identity.sourceType,
    });
    const tokenAllocationDedupe = this.dedupe.dedupeByCandidateKey([
      ...normalized.tokenAllocations,
      ...normalized.unlinkedTokenAllocations,
    ]);
    const roundDedupe = this.dedupe.dedupeByCandidateKey([
      ...normalized.vestingRounds,
      ...normalized.unlinkedVestingRounds,
    ]);
    const scheduleDedupe = this.dedupe.dedupeByCandidateKey(
      normalized.vestingSchedules
    );
    const summaryInput = this.summaryInput(
      sourceProject,
      identity.canonicalProjectId,
      identity.sourceType
    );
    const hasUnlockEvents = this.hasUnlockEventRows(sourceProject);

    if (
      !tokenAllocationDedupe.unique.length &&
      !roundDedupe.unique.length &&
      !scheduleDedupe.unique.length &&
      !summaryInput &&
      !hasUnlockEvents
    ) {
      throw new Error(options.emptyErrorMessage);
    }

    const result = this.emptyResult({
      applied: true,
      canonicalProjectId: identity.canonicalProjectId.toHexString(),
      sourceType: identity.sourceType,
      sourceSlug: identity.sourceSlug,
      sourceProjectKey: identity.sourceProjectKey,
    });
    result.duplicateGroups = {
      tokenAllocations: tokenAllocationDedupe.duplicateGroups.length,
      vestingRounds: roundDedupe.duplicateGroups.length,
      vestingSchedules: scheduleDedupe.duplicateGroups.length,
    };

    const deleted = await this.replaceProjectVesting(
      identity.canonicalProjectId,
      { unlockEvents: hasUnlockEvents },
      session
    );
    result.deleted = deleted;

    const allocationRefs = await this.writeAllocations(
      tokenAllocationDedupe.unique,
      session
    );
    result.written.tokenAllocations = allocationRefs.length;

    const roundRefs = await this.writeRounds(roundDedupe.unique, session);
    result.written.vestingRounds = roundRefs.length;

    const scheduleWrite = await this.writeSchedules(
      scheduleDedupe.unique,
      allocationRefs,
      roundRefs,
      session
    );
    result.written.vestingSchedules = scheduleWrite.written;
    result.skipped = scheduleWrite.skipped;

    if (summaryInput) {
      await this.vestingService.upsertVestingSummary(summaryInput, session);
      result.written.vestingSummaries = 1;
    }

    const unlockEventWrite = await this.writeUnlockEvents(
      sourceProject,
      identity,
      {
        marketAssetId: options.marketAssetId,
        allocationRefs,
        roundRefs,
        scheduleRefs: scheduleWrite.refs,
      },
      session
    );
    result.written.unlockEvents = unlockEventWrite.written;

    if (scheduleWrite.warnings.length) {
      result.warnings.push(...scheduleWrite.warnings);
    }
    if (unlockEventWrite.warnings.length) {
      result.warnings.push(...unlockEventWrite.warnings);
    }
    return result;
  }

  private async writeAllocations(
    candidates: FomoV2NormalizedAllocationCandidate[],
    session: ClientSession
  ): Promise<Array<ResolvedCandidate<FomoV2NormalizedAllocationCandidate>>> {
    const resolved: Array<
      ResolvedCandidate<FomoV2NormalizedAllocationCandidate>
    > = [];
    for (const candidate of candidates) {
      const written = await this.vestingService.upsertTokenAllocation(
        {
          ...candidate,
          status: "active",
        },
        session
      );
      const id = this.toObjectId((written.doc as any)?._id);
      if (id) resolved.push({ candidate, id });
    }
    return resolved;
  }

  private async writeRounds(
    candidates: FomoV2NormalizedRoundCandidate[],
    session: ClientSession
  ): Promise<Array<ResolvedCandidate<FomoV2NormalizedRoundCandidate>>> {
    const resolved: Array<ResolvedCandidate<FomoV2NormalizedRoundCandidate>> =
      [];
    for (const candidate of candidates) {
      const written = await this.vestingService.upsertVestingRound(
        {
          ...candidate,
          status: "active",
        },
        session
      );
      const id = this.toObjectId((written.doc as any)?._id);
      if (id) resolved.push({ candidate, id });
    }
    return resolved;
  }

  private async writeSchedules(
    candidates: FomoV2NormalizedScheduleCandidate[],
    allocationRefs: Array<
      ResolvedCandidate<FomoV2NormalizedAllocationCandidate>
    >,
    roundRefs: Array<ResolvedCandidate<FomoV2NormalizedRoundCandidate>>,
    session: ClientSession
  ): Promise<{
    written: number;
    refs: Array<ResolvedCandidate<FomoV2NormalizedScheduleCandidate>>;
    skipped: FomoV2VestingReviewApplyResult["skipped"];
    warnings: string[];
  }> {
    const allocationIndex = this.buildAllocationIndex(allocationRefs);
    const roundIndex = this.buildRoundIndex(roundRefs);
    const skipped = {
      vestingSchedulesMissingTokenAllocation: 0,
      vestingSchedulesMissingRound: 0,
      vestingSchedulesAmbiguousTokenAllocation: 0,
      vestingSchedulesAmbiguousRound: 0,
    };
    const warnings: string[] = [];
    const refs: Array<ResolvedCandidate<FomoV2NormalizedScheduleCandidate>> =
      [];
    let written = 0;

    for (const candidate of candidates) {
      const allocation = this.resolveAllocation(candidate, allocationIndex);
      const round = this.resolveRound(candidate, roundIndex);
      if (allocation.status !== "linked" || round.status !== "linked") {
        warnings.push(
          `Created vesting schedule ${
            candidate.sourcePath ||
            candidate.roundName ||
            candidate.saleId ||
            "unknown"
          } with partial links: allocation=${allocation.status}, round=${
            round.status
          }.`
        );
      }

      const write = await this.vestingService.upsertVestingSchedule(
        {
          ...candidate,
          ...(allocation.id ? { tokenAllocationId: allocation.id } : {}),
          ...(round.id ? { vestingRoundId: round.id } : {}),
          status: "active",
          metadata: {
            ...(candidate.metadata || {}),
            approvedReviewApply: true,
            allocationLinkStatus: allocation.status,
            roundLinkStatus: round.status,
          },
        },
        session
      );
      const id = this.toObjectId((write.doc as any)?._id);
      if (id) refs.push({ candidate, id });
      written += 1;
    }

    return { written, refs, skipped, warnings };
  }

  private async writeUnlockEvents(
    sourceProject: Record<string, any>,
    identity: ReviewBatchIdentity,
    refs: {
      marketAssetId?: Types.ObjectId;
      allocationRefs: Array<
        ResolvedCandidate<FomoV2NormalizedAllocationCandidate>
      >;
      roundRefs: Array<ResolvedCandidate<FomoV2NormalizedRoundCandidate>>;
      scheduleRefs: Array<ResolvedCandidate<FomoV2NormalizedScheduleCandidate>>;
    },
    session: ClientSession
  ): Promise<{ written: number; warnings: string[] }> {
    const inputs = this.reviewUnlockEventInputs(sourceProject, identity, refs);
    let written = 0;

    for (const input of inputs) {
      const result = await this.unlocksService.upsertUnlockEvent(
        input,
        session
      );
      if (!result.skipped) written += 1;
    }

    return { written, warnings: [] };
  }

  private reviewUnlockEventInputs(
    sourceProject: Record<string, any>,
    identity: ReviewBatchIdentity,
    refs: {
      marketAssetId?: Types.ObjectId;
      allocationRefs: Array<
        ResolvedCandidate<FomoV2NormalizedAllocationCandidate>
      >;
      roundRefs: Array<ResolvedCandidate<FomoV2NormalizedRoundCandidate>>;
      scheduleRefs: Array<ResolvedCandidate<FomoV2NormalizedScheduleCandidate>>;
    }
  ): FomoV2UnlockEventInput[] {
    const allocationIndex = this.buildAllocationIndex(refs.allocationRefs);
    const roundIndex = this.buildRoundIndex(refs.roundRefs);
    const scheduleIndex = this.buildScheduleIndex(refs.scheduleRefs);
    const outputs: FomoV2UnlockEventInput[] = [];
    const push = (
      event: Record<string, any>,
      sourcePath: string,
      eventOrigin:
        | "provider_unlocking_events"
        | "provider_next_unlocking_event",
      fallbackRound?: Record<string, any>
    ) => {
      const unlockDate = toVestingDate(event?.unlockDate || event?.date);
      if (!unlockDate) return;
      const roundName = cleanString(
        fallbackRound?.roundName ||
          fallbackRound?.name ||
          fallbackRound?.sale ||
          event?.roundName ||
          event?.stage ||
          (Array.isArray(event?.roundNames) && event.roundNames.length === 1
            ? event.roundNames[0]
            : undefined)
      );
      const normalizedRoundName = normalizeVestingName(roundName);
      const saleId = this.cleanSaleId(
        fallbackRound?.saleId ?? fallbackRound?.id ?? event?.saleId
      );
      const unlockType = cleanString(
        fallbackRound?.unlockType ||
          event?.unlockType ||
          fallbackRound?.type ||
          event?.type ||
          arrayValue(event?.unlockTypes)[0]
      );
      const links = this.resolveUnlockEventLinks(
        saleId,
        normalizedRoundName,
        allocationIndex,
        roundIndex,
        scheduleIndex
      );

      outputs.push({
        canonicalProjectId: identity.canonicalProjectId,
        marketAssetId: refs.marketAssetId,
        ...(links.tokenAllocationId
          ? { tokenAllocationId: links.tokenAllocationId }
          : {}),
        ...(links.vestingRoundId
          ? { vestingRoundId: links.vestingRoundId }
          : {}),
        ...(links.vestingScheduleId
          ? { vestingScheduleId: links.vestingScheduleId }
          : {}),
        sourceType: identity.sourceType,
        sourceEventId: cleanString(
          event?.sourceEventId || event?.id || event?.sourceKey || sourcePath
        ),
        saleId,
        sourcePath,
        unlockDate,
        statusSource:
          cleanString(event?.statusSource || event?.status) ||
          (unlockDate.getTime() < Date.now() ? "past" : "upcoming"),
        amount: firstFiniteNumber(
          fallbackRound?.amount,
          fallbackRound?.tokensAmount,
          fallbackRound?.tokens,
          event?.amount,
          event?.tokensAmount,
          event?.tokens
        ),
        percentOfSupply: firstFiniteNumber(
          fallbackRound?.percentOfSupply,
          fallbackRound?.percent,
          event?.percentOfSupply,
          event?.percent
        ),
        roundName,
        normalizedRoundName: normalizedRoundName || undefined,
        stage: cleanString(fallbackRound?.stage || event?.stage),
        unlockType,
        unlockTypes: uniqueStrings([
          ...arrayValue(fallbackRound?.unlockTypes),
          ...arrayValue(event?.unlockTypes),
          unlockType,
        ]),
        isTgeUnlock:
          fallbackRound?.isTgeUnlock === undefined &&
          event?.isTgeUnlock === undefined
            ? undefined
            : Boolean(fallbackRound?.isTgeUnlock ?? event?.isTgeUnlock),
        sourceValueUsd: firstFiniteNumber(
          fallbackRound?.valueUsd,
          fallbackRound?.sourceValueUsd,
          event?.valueUsd,
          event?.sourceValueUsd
        ),
        sourceMarketCapSharePercent: firstFiniteNumber(
          fallbackRound?.marketCapSharePercent,
          fallbackRound?.sourceMarketCapSharePercent,
          event?.marketCapSharePercent,
          event?.sourceMarketCapSharePercent
        ),
        eventOrigin,
        eventOrigins: [eventOrigin],
        sourceRefs: [this.unlockSourceRef(identity, sourcePath, saleId)],
        metadata: {
          approvedReviewApply: true,
          sourceProjectKey: identity.sourceProjectKey,
          sourceSlug: identity.sourceSlug,
          raw: event,
          rawRound: fallbackRound,
          linkStatus: links.status,
        },
      });
    };

    arrayValue(sourceProject?.unlockingEvents).forEach((event, eventIndex) => {
      const rounds = arrayValue(event?.rounds);
      if (rounds.length) {
        rounds.forEach((round, roundIndex) =>
          push(
            event,
            `unlockingEvents.${eventIndex}.rounds.${roundIndex}`,
            "provider_unlocking_events",
            round
          )
        );
      } else {
        push(
          event,
          `unlockingEvents.${eventIndex}`,
          "provider_unlocking_events"
        );
      }
    });

    if (sourceProject?.nextUnlockingEvent) {
      const event = sourceProject.nextUnlockingEvent;
      const rounds = arrayValue(event?.rounds);
      if (rounds.length) {
        rounds.forEach((round, roundIndex) =>
          push(
            event,
            `nextUnlockingEvent.rounds.${roundIndex}`,
            "provider_next_unlocking_event",
            round
          )
        );
      } else {
        push(event, "nextUnlockingEvent", "provider_next_unlocking_event");
      }
    }

    const byKey = new Map<string, FomoV2UnlockEventInput>();
    for (const input of outputs) {
      const key = [
        input.saleId ?? "",
        toVestingDate(input.unlockDate)?.toISOString().slice(0, 10) || "",
        input.normalizedRoundName || normalizeVestingName(input.roundName),
        cleanString(input.unlockType)?.toLowerCase() || "",
      ].join("|");
      if (!byKey.has(key)) byKey.set(key, input);
    }
    return Array.from(byKey.values());
  }

  private resolveUnlockEventLinks(
    saleId: string | number | undefined,
    normalizedRoundName: string | undefined,
    allocationIndex: RelationIndex,
    roundIndex: RelationIndex,
    scheduleIndex: RelationIndex
  ): {
    tokenAllocationId?: Types.ObjectId;
    vestingRoundId?: Types.ObjectId;
    vestingScheduleId?: Types.ObjectId;
    status: Record<string, string>;
  } {
    const allocation =
      this.resolveRelation(allocationIndex.bySaleId, saleId) ||
      this.resolveRelation(allocationIndex.byName, normalizedRoundName);
    const round =
      this.resolveRelation(roundIndex.bySaleId, saleId) ||
      this.resolveRelation(roundIndex.byName, normalizedRoundName);
    const schedule =
      this.resolveRelation(scheduleIndex.bySaleId, saleId) ||
      this.resolveRelation(scheduleIndex.byName, normalizedRoundName);

    return {
      tokenAllocationId:
        allocation?.status === "linked" ? allocation.id : undefined,
      vestingRoundId: round?.status === "linked" ? round.id : undefined,
      vestingScheduleId:
        schedule?.status === "linked" ? schedule.id : undefined,
      status: {
        allocation: allocation?.status || "missing",
        round: round?.status || "missing",
        schedule: schedule?.status || "missing",
      },
    };
  }

  private buildScheduleIndex(
    refs: Array<ResolvedCandidate<FomoV2NormalizedScheduleCandidate>>
  ): RelationIndex {
    const index = this.emptyRelationIndex();
    for (const ref of refs) {
      this.addIndexValue(index.bySaleId, ref.candidate.saleId, ref.id);
      this.addIndexValue(
        index.byName,
        ref.candidate.normalizedRoundName,
        ref.id
      );
    }
    return index;
  }

  private unlockSourceRef(
    identity: ReviewBatchIdentity,
    sourcePath: string,
    saleId?: string | number
  ) {
    return {
      source: identity.sourceType,
      sourceId: identity.sourceProjectKey || identity.sourceDocumentId,
      sourceSlug: identity.sourceSlug,
      sourceUrl: identity.sourceUrl,
      sourcePath,
      confidence: "high",
      metadata: {
        sourceProjectKey: identity.sourceProjectKey,
        saleId,
        approvedReviewApply: true,
      },
    };
  }

  private hasUnlockEventRows(sourceProject: Record<string, any>): boolean {
    return (
      arrayValue(sourceProject?.unlockingEvents).length > 0 ||
      Boolean(sourceProject?.nextUnlockingEvent)
    );
  }

  private cleanSaleId(value: any): string | number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    return typeof value === "number" && Number.isFinite(value)
      ? value
      : cleanString(value);
  }

  private async replaceProjectVesting(
    canonicalProjectId: Types.ObjectId,
    options: { unlockEvents?: boolean },
    session: ClientSession
  ): Promise<FomoV2VestingReviewApplyResult["deleted"]> {
    const filter = { canonicalProjectId };
    const schedules = await this.vestingScheduleModel.deleteMany(filter, {
      session,
    });
    const rounds = await this.vestingRoundModel.deleteMany(filter, { session });
    const allocations = await this.tokenAllocationModel.deleteMany(filter, {
      session,
    });
    const summaries = await this.vestingSummaryModel.deleteMany(filter, {
      session,
    });
    const unlockEvents = options.unlockEvents
      ? await this.unlockEventModel.deleteMany(filter, { session })
      : { deletedCount: 0 };
    return {
      tokenAllocations: Number((allocations as any)?.deletedCount || 0),
      vestingRounds: Number((rounds as any)?.deletedCount || 0),
      vestingSchedules: Number((schedules as any)?.deletedCount || 0),
      vestingSummaries: Number((summaries as any)?.deletedCount || 0),
      unlockEvents: Number((unlockEvents as any)?.deletedCount || 0),
    };
  }

  private async sourceProjectForBatch(
    batch: any,
    identity: ReviewBatchIdentity,
    rawSourceOverride?: Record<string, any>
  ): Promise<Record<string, any>> {
    if (rawSourceOverride !== undefined) {
      return this.composeSourceProject(
        this.vestingRawSourceOverride(rawSourceOverride),
        identity
      );
    }

    const fromReview = this.composeSourceProject(
      this.firstCandidatePayload(batch)?.rawSource || {},
      identity
    );
    if (hasVestingImportData(fromReview)) return fromReview;
    throw new Error(
      "Approved vesting review does not include raw vesting source payload."
    );
  }

  private composeSourceProject(
    rawSource: Record<string, any>,
    identity: ReviewBatchIdentity
  ): Record<string, any> {
    const sourceSlug = identity.sourceSlug;
    const sourceProjectId = identity.sourceProjectKey;
    return {
      ...(rawSource || {}),
      _id:
        this.toObjectId(identity.sourceDocumentId) || identity.sourceDocumentId,
      source: identity.sourceType,
      sourceProjectId,
      sourceId: sourceProjectId,
      currencyId: sourceProjectId,
      sourceSlug,
      coinSlug: sourceSlug,
      slug: sourceSlug,
      sourceUrl: identity.sourceUrl,
      name: identity.projectName,
      symbol: identity.symbol,
      identity: {
        name: identity.projectName,
        symbol: identity.symbol,
        slug: sourceSlug,
        sourceUrl: identity.sourceUrl,
      },
    };
  }

  private reviewBatchIdentity(batch: any): ReviewBatchIdentity | undefined {
    const canonicalProjectId = this.toObjectId(batch?.canonicalProjectId);
    if (!canonicalProjectId) return undefined;
    const firstCandidate = this.firstCandidate(batch);
    const firstPayload = firstCandidate?.payload || {};
    const normalizedPayload = firstCandidate?.normalizedPayload || {};
    const sourceType = normalizeDropstabSourceType(
      firstCandidate?.sourceType ||
        batch?.incomingSourceType ||
        batch?.currentSourceType ||
        "dropstab"
    );
    const sourceSlug =
      cleanString(firstPayload.sourceSlug) ||
      cleanString(normalizedPayload.normalizedSlug);
    const sourceProjectKey =
      cleanString(firstCandidate?.sourceId) ||
      cleanString(firstPayload.sourceProjectKey) ||
      cleanString(batch?.projectKey);
    return {
      canonicalProjectId,
      sourceType,
      sourceProjectKey,
      sourceSlug,
      sourceDocumentId:
        cleanString(firstPayload.sourceDocumentId) ||
        cleanString(firstCandidate?.sourcePath),
      sourceUrl:
        cleanString(firstCandidate?.sourceUrl) ||
        cleanString(firstPayload.sourceUrl),
      projectName:
        cleanString(batch?.projectName) ||
        cleanString(firstPayload.name) ||
        sourceSlug,
      symbol:
        cleanString(firstPayload.symbol) ||
        cleanString(normalizedPayload.normalizedSymbol)?.toUpperCase(),
    };
  }

  private summaryInput(
    sourceProject: Record<string, any>,
    canonicalProjectId: Types.ObjectId,
    sourceType: string
  ) {
    const summary = sourceProject?.vestingSummary || {};
    if (!hasNonEmptyVestingSummary(summary)) return undefined;
    return {
      canonicalProjectId,
      sourceType,
      totalAmount: firstFiniteNumber(summary.totalAmount),
      unlockedAmount: firstFiniteNumber(summary.unlockedAmount),
      lockedAmount: firstFiniteNumber(summary.lockedAmount),
      untrackedAmount: firstFiniteNumber(summary.untrackedAmount),
      unlockedPercent: firstFiniteNumber(summary.unlockedPercent),
      lockedPercent: firstFiniteNumber(summary.lockedPercent),
      untrackedPercent: firstFiniteNumber(summary.untrackedPercent),
      lastUnlockDate: toVestingDate(summary.lastUnlockDate),
      nextUnlockDate: toVestingDate(summary.nextUnlockDate),
      sourceUnlockedValueUsd: firstFiniteNumber(summary.unlockedValueUsd),
      sourceLockedValueUsd: firstFiniteNumber(summary.lockedValueUsd),
      calculatedAt: new Date(),
    };
  }

  private allocationRawRow(row: any): Record<string, any> {
    return cleanRawRecord({
      saleId: row.saleId,
      name: row.name,
      normalizedName: row.normalizedName,
      percent: row.allocationPercent,
      amount: row.amount,
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      sourceSlug: row.sourceSlug,
      sourcePath: row.sourcePath,
      sourceUrl: row.sourceUrl,
      vestingDatasetKey: row.vestingDatasetKey,
    });
  }

  private roundRawRow(row: any): Record<string, any> {
    return cleanRawRecord({
      saleId: row.saleId,
      roundName: row.roundName,
      normalizedRoundName: row.normalizedRoundName,
      allocationPercent: row.allocationPercent,
      totalAmount: row.totalAmount,
      unlockedAmount: row.unlockedAmountSource,
      lockedAmount: row.lockedAmountSource,
      vestedPercent: row.unlockedPercentSource,
      unlockedPercent: row.unlockedPercentSource,
      lockedPercent: row.lockedPercentSource,
      valueLockedUsd: row.valueLockedUsdSource,
      lastUnlockDate: isoDate(row.lastUnlockDateSource),
      sourceType: row.sourceType,
      vestingDatasetKey: row.vestingDatasetKey,
    });
  }

  private scheduleRawRow(row: any): Record<string, any> {
    return cleanRawRecord({
      saleId: row.saleId,
      roundName: row.roundName,
      normalizedRoundName: row.normalizedRoundName,
      tgeUnlockPercent: row.tgeUnlockPercent,
      vestingType: row.vestingType,
      vestingFrequency: row.vestingFrequency,
      vestingDurationMonths: row.vestingDurationMonths,
      currentUnlockedPercent: row.currentUnlockedPercentSource,
      currentLockedPercent: row.currentLockedPercentSource,
      startDate: isoDate(row.startDate),
      endDate: isoDate(row.endDate),
      dateConfidence: row.dateConfidence,
      sourceType: row.sourceType,
      vestingDatasetKey: row.vestingDatasetKey,
    });
  }

  private summaryRawRow(row: any): Record<string, any> {
    return cleanRawRecord({
      totalAmount: row.totalAmount,
      unlockedAmount: row.unlockedAmount,
      lockedAmount: row.lockedAmount,
      untrackedAmount: row.untrackedAmount,
      unlockedPercent: row.unlockedPercent,
      lockedPercent: row.lockedPercent,
      untrackedPercent: row.untrackedPercent,
      unlockedValueUsd: row.sourceUnlockedValueUsd,
      lockedValueUsd: row.sourceLockedValueUsd,
      lastUnlockDate: isoDate(row.lastUnlockDate),
      nextUnlockDate: isoDate(row.nextUnlockDate),
      sourceType: row.sourceType,
      vestingDatasetKey: row.vestingDatasetKey,
    });
  }

  private firstRowString(rows: Array<Record<string, any>>, ...paths: string[]) {
    for (const row of rows) {
      for (const path of paths) {
        const value = cleanString(readPath(row, path));
        if (value) return value;
      }
    }
    return undefined;
  }

  private buildAllocationIndex(
    refs: Array<ResolvedCandidate<FomoV2NormalizedAllocationCandidate>>
  ): RelationIndex {
    const index = this.emptyRelationIndex();
    for (const ref of refs) {
      this.addIndexValue(index.bySaleId, ref.candidate.saleId, ref.id);
      this.addIndexValue(index.byName, ref.candidate.normalizedName, ref.id);
    }
    return index;
  }

  private buildRoundIndex(
    refs: Array<ResolvedCandidate<FomoV2NormalizedRoundCandidate>>
  ): RelationIndex {
    const index = this.emptyRelationIndex();
    for (const ref of refs) {
      this.addIndexValue(index.bySaleId, ref.candidate.saleId, ref.id);
      this.addIndexValue(
        index.byName,
        ref.candidate.normalizedRoundName,
        ref.id
      );
    }
    return index;
  }

  private resolveAllocation(
    candidate: FomoV2NormalizedScheduleCandidate,
    index: RelationIndex
  ): { id?: Types.ObjectId; status: "linked" | "missing" | "ambiguous" } {
    return (
      this.resolveRelation(index.bySaleId, candidate.saleId) ||
      this.resolveRelation(index.byName, candidate.normalizedRoundName) || {
        status: "missing",
      }
    );
  }

  private resolveRound(
    candidate: FomoV2NormalizedScheduleCandidate,
    index: RelationIndex
  ): { id?: Types.ObjectId; status: "linked" | "missing" | "ambiguous" } {
    return (
      this.resolveRelation(index.bySaleId, candidate.saleId) ||
      this.resolveRelation(index.byName, candidate.normalizedRoundName) || {
        status: "missing",
      }
    );
  }

  private resolveRelation(
    map: Map<string, Types.ObjectId[]>,
    value: unknown
  ):
    | { id?: Types.ObjectId; status: "linked" | "missing" | "ambiguous" }
    | undefined {
    const key = relationKey(value);
    if (!key) return undefined;
    const ids = map.get(key) || [];
    if (ids.length === 1) return { id: ids[0], status: "linked" };
    if (ids.length > 1) return { status: "ambiguous" };
    return undefined;
  }

  private addIndexValue(
    map: Map<string, Types.ObjectId[]>,
    value: unknown,
    id: Types.ObjectId
  ): void {
    const key = relationKey(value);
    if (!key) return;
    map.set(key, [...(map.get(key) || []), id]);
  }

  private emptyRelationIndex(): RelationIndex {
    return {
      bySaleId: new Map<string, Types.ObjectId[]>(),
      byName: new Map<string, Types.ObjectId[]>(),
    };
  }

  private firstCandidate(batch: any): any {
    return (batch?.candidates || [])[0] || {};
  }

  private firstCandidatePayload(batch: any): Record<string, any> {
    return this.firstCandidate(batch)?.payload || {};
  }

  private vestingRawSourceOverride(input: any): Record<string, any> {
    if (!input || typeof input !== "object" || Array.isArray(input)) return {};
    const source =
      input.rawSource && typeof input.rawSource === "object"
        ? input.rawSource
        : input;
    const output: Record<string, any> = {};
    for (const field of [
      "tokenAllocation",
      "vestingRounds",
      "vestingSchedule",
      "vestingTimeline",
      "unlockingEvents",
      "publicVesting",
    ]) {
      if (Array.isArray(source[field])) output[field] = source[field];
    }
    if (
      source.nextUnlockingEvent &&
      typeof source.nextUnlockingEvent === "object" &&
      !Array.isArray(source.nextUnlockingEvent)
    ) {
      output.nextUnlockingEvent = source.nextUnlockingEvent;
    }
    if (
      source.vestingSummary &&
      typeof source.vestingSummary === "object" &&
      !Array.isArray(source.vestingSummary)
    ) {
      output.vestingSummary = source.vestingSummary;
    }
    return output;
  }

  private emptyResult(
    input: Partial<FomoV2VestingReviewApplyResult> = {}
  ): FomoV2VestingReviewApplyResult {
    return {
      applied: Boolean(input.applied),
      reason: input.reason,
      replacementScope: "canonical_project",
      canonicalProjectId: input.canonicalProjectId,
      sourceType: input.sourceType,
      sourceSlug: input.sourceSlug,
      sourceProjectKey: input.sourceProjectKey,
      deleted: {
        tokenAllocations: 0,
        vestingRounds: 0,
        vestingSchedules: 0,
        vestingSummaries: 0,
        unlockEvents: 0,
      },
      written: {
        tokenAllocations: 0,
        vestingRounds: 0,
        vestingSchedules: 0,
        vestingSummaries: 0,
        unlockEvents: 0,
      },
      skipped: {
        vestingSchedulesMissingTokenAllocation: 0,
        vestingSchedulesMissingRound: 0,
        vestingSchedulesAmbiguousTokenAllocation: 0,
        vestingSchedulesAmbiguousRound: 0,
      },
      duplicateGroups: {
        tokenAllocations: 0,
        vestingRounds: 0,
        vestingSchedules: 0,
      },
      warnings: [],
    };
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value;
    const text = cleanString(value);
    return text && Types.ObjectId.isValid(text)
      ? new Types.ObjectId(text)
      : undefined;
  }
}

function cleanString(value: any): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function arrayValue(value: any): any[] {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function uniqueStrings(values: any[]): string[] {
  return Array.from(
    new Set(values.map((value) => cleanString(value)).filter(Boolean))
  ) as string[];
}

function relationKey(value: unknown): string | undefined {
  const text = cleanString(value);
  return text ? text.toLowerCase() : undefined;
}

function cleanRawRecord(input: Record<string, any>): Record<string, any> {
  return Object.entries(input).reduce<Record<string, any>>(
    (output, [key, value]) => {
      if (value === undefined || value === null || value === "") return output;
      output[key] = value;
      return output;
    },
    {}
  );
}

function sortRawTokenAllocations(
  rows: Array<Record<string, any>>
): Array<Record<string, any>> {
  return [...rows].sort((left, right) => {
    const leftPercent = firstSortableNumber(
      left.percent,
      left.allocationPercent,
      left.tokensAllocatedPercent,
      left.tokensForSalePercent
    );
    const rightPercent = firstSortableNumber(
      right.percent,
      right.allocationPercent,
      right.tokensAllocatedPercent,
      right.tokensForSalePercent
    );
    if (leftPercent !== rightPercent) return rightPercent - leftPercent;

    const leftAmount = firstSortableNumber(
      left.amount,
      left.tokensAmount,
      left.tokensAllocatedAmount,
      left.tokensForSaleAmount
    );
    const rightAmount = firstSortableNumber(
      right.amount,
      right.tokensAmount,
      right.tokensAllocatedAmount,
      right.tokensForSaleAmount
    );
    return rightAmount - leftAmount;
  });
}

function firstSortableNumber(...values: any[]): number {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function isoDate(value: any): string | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function readPath(input: any, path: string): any {
  return path
    .split(".")
    .reduce(
      (value, key) =>
        value === undefined || value === null ? undefined : value[key],
      input
    );
}
