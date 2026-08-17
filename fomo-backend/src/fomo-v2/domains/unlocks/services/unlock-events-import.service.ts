import { Injectable, NotFoundException, Optional } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import {
  normalizeProjectSourceType,
  projectSourceTypeMongoPattern,
} from "../../../shared/source-policy";
import { FOMO_V2_PARSER_DB_CONNECTION } from "../../ico";
import { FomoV2ParserControlPolicyService } from "../../parser-control/services/parser-control-policy.service";
import {
  FomoV2ParserSnapshotReaderService,
  FomoV2ValidatedParserSnapshot,
} from "../../parser-control/services/parser-snapshot-reader.service";
import {
  buildDropstabSourceRef,
  buildDropstabVestingQuery,
  dropstabSourceProjectKey,
  dropstabSourceProjectKeyClauses,
  dropstabSourceSlugClauses,
  dropstabVestingDatasetKey,
  dropstabVestingProjectIdentity,
  DropstabVestingProjectIdentity,
  normalizeDropstabSourceType,
  toDropstabObjectId,
} from "../../vesting/helpers/dropstab-vesting-source.helper";
import {
  cleanVestingString,
  normalizeVestingName,
} from "../../vesting/helpers/vesting-normalize.helper";
import {
  FomoV2TokenAllocation,
  FomoV2VestingRound,
  FomoV2VestingSchedule,
  FomoV2VestingSummary,
} from "../../vesting/models";
import { FomoV2VestingLinkingService } from "../../vesting/services/vesting-linking.service";
import { FomoV2VestingService } from "../../vesting/services/vesting.service";
import {
  buildUnlockEventContentHash,
  buildUnlockEventFingerprint,
  cleanObject,
  cleanUnlockString,
  firstFiniteNumber,
  normalizeUnlockName,
  toUnlockDate,
} from "../helpers";
import { FomoV2UnlockEvent } from "../models";
import {
  FomoV2UnlockEventInput,
  FomoV2UnlockEventOrigin,
  FomoV2UnlockUpsertStatus,
} from "../types";
import { FomoV2UnlocksService } from "./unlocks.service";

const PARSER_COLLECTION = "dropstab_coin_detail_data";
const DEFAULT_LIMIT = 100;
const SUPPORTED_SOURCE_TYPES = ["dropstab"];
const DROPSTAB_COIN_DETAILS_UPSTREAM_PARSER_KEY = "dropstab:coin-details";

export type FomoV2UnlockEventsImportMode =
  | "next-only"
  | "provider-events"
  | "all";

export interface FomoV2UnlockEventsImportOptions {
  limit?: number;
  skip?: number;
  all?: boolean;
  source?: string;
  sourceType?: string;
  mode?: FomoV2UnlockEventsImportMode;
  canonicalProjectId?: Types.ObjectId | string;
  write?: boolean;
  dryRun?: boolean;
  sourceProjectFilter?: "unlock-eligible" | "vesting-eligible";
  snapshotId?: string;
  upstreamRunId?: string;
  upstreamParserKey?: string;
  /** In-process lease/policy fence supplied by the managed parser worker. */
  assertExecutionActive?: () => void | Promise<void>;
}

export interface FomoV2UnlockEventsStageOptions {
  canonicalProjectId: Types.ObjectId | string;
  source?: string;
  sourceType?: string;
  sourceSlug?: string;
  sourceProjectKey?: string;
  sourceDocumentId?: string;
}

export interface FomoV2UnlockEventsImportResult {
  mode: "dry-run" | "write";
  dryRun: boolean;
  sourceType: string;
  unlocksMode: FomoV2UnlockEventsImportMode;
  scannedProjects: number;
  projectsWithCanonicalId: number;
  skippedNoCanonicalProject: number;
  skippedInactiveSource: number;
  skippedSourceConflict: number;
  skippedNoActiveVestingSource: number;
  sourceEventsFound: number;
  eventsCreated: number;
  eventsUpdated: number;
  eventsUnchanged: number;
  eventsSkipped: number;
  eventsWouldCreate: number;
  eventsWouldUpdate: number;
  eventsWouldRemainUnchanged: number;
  eventsWouldSkip: number;
  resolveWarnings: number;
  errors: Array<Record<string, any>>;
  warnings: string[];
}

export interface FomoV2UnlockEventsStageResult {
  mode: "review-stage";
  sourceType: string;
  canonicalProjectId: string;
  sourceSlug?: string;
  sourceProjectKey?: string;
  sourceDocumentId?: string;
  sourceUrl?: string;
  rawSource: {
    unlockingEvents: Array<Record<string, any>>;
    nextUnlockingEvent?: Record<string, any>;
  };
  counts: {
    unlockingEvents: number;
    unlockingEventRows: number;
    nextUnlockingEvent: number;
    totalRows: number;
  };
  warnings: string[];
}

interface NormalizedUnlockEventResult {
  sourceEventsFound: number;
  eventsSkipped: number;
  events: FomoV2UnlockEventInput[];
}

interface EventLinks {
  marketAssetId?: Types.ObjectId;
  tokenAllocationId?: Types.ObjectId;
  vestingRoundId?: Types.ObjectId;
  vestingScheduleId?: Types.ObjectId;
}

interface UnlockEventReconciliationContext {
  claimedExistingEventIds: Set<string>;
}

interface EffectiveVestingSource {
  sourceType?: string;
  source: "documents" | "none" | "ambiguous";
  reason: string;
}

type SourceGuardSkipCounter =
  | "skippedInactiveSource"
  | "skippedSourceConflict"
  | "skippedNoActiveVestingSource";

interface SourceGuardResult {
  allowed: boolean;
  activeSourceType?: string;
  reason: string;
  skipCounter?: SourceGuardSkipCounter;
}

@Injectable()
export class FomoV2UnlockEventsImportService {
  constructor(
    @InjectConnection(FOMO_V2_PARSER_DB_CONNECTION)
    private readonly parserConnection: Connection,
    @InjectModel(FomoV2UnlockEvent.name)
    private readonly unlockEventModel: Model<FomoV2UnlockEvent>,
    @InjectModel(FomoV2TokenAllocation.name)
    private readonly tokenAllocationModel: Model<FomoV2TokenAllocation>,
    @InjectModel(FomoV2VestingRound.name)
    private readonly vestingRoundModel: Model<FomoV2VestingRound>,
    @InjectModel(FomoV2VestingSchedule.name)
    private readonly vestingScheduleModel: Model<FomoV2VestingSchedule>,
    @InjectModel(FomoV2VestingSummary.name)
    private readonly vestingSummaryModel: Model<FomoV2VestingSummary>,
    private readonly vestingLinkingService: FomoV2VestingLinkingService,
    private readonly vestingService: FomoV2VestingService,
    private readonly unlocksService: FomoV2UnlocksService,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService,
    @Optional()
    private readonly snapshotReader?: FomoV2ParserSnapshotReaderService
  ) {}

  async run(
    options: FomoV2UnlockEventsImportOptions = {}
  ): Promise<FomoV2UnlockEventsImportResult> {
    const sourceType = this.normalizeSourceType(
      options.sourceType || options.source
    );
    if (!SUPPORTED_SOURCE_TYPES.includes(sourceType)) {
      throw new Error(`Unsupported unlock events sourceType "${sourceType}".`);
    }
    const unlocksMode = this.normalizeMode(options.mode);
    const write = Boolean(options.write) && options.dryRun !== true;
    if (write && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        `unlocks:${sourceType}`
      );
    }
    await options.assertExecutionActive?.();
    const limit = options.all
      ? undefined
      : this.parsePositiveInteger(options.limit, DEFAULT_LIMIT);
    const skip = this.parseNonNegativeInteger(options.skip, 0);
    const canonicalProjectId = this.toOptionalObjectId(
      options.canonicalProjectId,
      "canonicalProjectId"
    );
    const result = this.emptyResult(sourceType, unlocksMode, write);
    const query =
      options.sourceProjectFilter === "vesting-eligible"
        ? buildDropstabVestingQuery({ sourceType })
        : this.unlocksQuery(sourceType);
    const snapshot = await this.openSnapshot(options, sourceType, write);
    const parserCollection = snapshot ? undefined : this.parserCollection();

    let cursor = snapshot
      ? this.snapshotReader!.cursor(snapshot, {
          payloadFilter: query,
          skip,
          limit,
        })
      : parserCollection.find(query).sort({ _id: 1 });
    if (!snapshot && skip > 0) cursor = cursor.skip(skip);
    if (!snapshot && limit !== undefined) cursor = cursor.limit(limit);

    for await (const sourceDocument of cursor as any) {
      await options.assertExecutionActive?.();
      const sourceProject = snapshot
        ? this.snapshotReader!.payload(snapshot, sourceDocument)
        : sourceDocument;
      await this.processProject(sourceProject, {
        canonicalProjectId,
        sourceType,
        unlocksMode,
        write,
        result,
      });
      await options.assertExecutionActive?.();
    }

    return result;
  }

  private async openSnapshot(
    options: FomoV2UnlockEventsImportOptions,
    sourceType: string,
    write: boolean
  ): Promise<FomoV2ValidatedParserSnapshot | undefined> {
    const snapshotId = cleanUnlockString(options.snapshotId);
    if (!snapshotId) return undefined;
    if (!this.snapshotReader) {
      throw new Error("Parser snapshot reader is not available.");
    }
    if (sourceType !== "dropstab") {
      throw new Error(
        'Unlock snapshot import requires sourceType="dropstab".'
      );
    }
    const parserKey =
      cleanUnlockString(options.upstreamParserKey) ||
      DROPSTAB_COIN_DETAILS_UPSTREAM_PARSER_KEY;
    if (parserKey !== DROPSTAB_COIN_DETAILS_UPSTREAM_PARSER_KEY) {
      throw new Error(
        `Unlock snapshot import requires parser ${DROPSTAB_COIN_DETAILS_UPSTREAM_PARSER_KEY}.`
      );
    }
    return this.snapshotReader.validate({
      snapshotId,
      parserKey,
      sourceType,
      write,
      upstreamRunId: cleanUnlockString(options.upstreamRunId),
    });
  }

  async stageProjectUnlocks(
    options: FomoV2UnlockEventsStageOptions
  ): Promise<FomoV2UnlockEventsStageResult> {
    const canonicalProjectId = this.toOptionalObjectId(
      options.canonicalProjectId,
      "canonicalProjectId"
    );
    if (!canonicalProjectId) {
      throw new Error("canonicalProjectId is required.");
    }
    const sourceType = this.normalizeSourceType(
      options.sourceType || options.source
    );
    if (!SUPPORTED_SOURCE_TYPES.includes(sourceType)) {
      throw new Error(`Unsupported unlock events sourceType "${sourceType}".`);
    }

    const sourceProject = await this.findUnlockSourceProject({
      canonicalProjectId,
      sourceType,
      sourceSlug: options.sourceSlug,
      sourceProjectKey: options.sourceProjectKey,
      sourceDocumentId: options.sourceDocumentId,
    });
    const identity = dropstabVestingProjectIdentity(sourceProject);
    const unlockingEvents = this.arrayValue(sourceProject.unlockingEvents).map(
      (event) => this.clonePlain(event)
    );
    const nextUnlockingEvent = sourceProject.nextUnlockingEvent
      ? this.clonePlain(sourceProject.nextUnlockingEvent)
      : undefined;
    const unlockingEventRows = unlockingEvents.reduce(
      (total, event) =>
        total + Math.max(1, this.arrayValue(event?.rounds).length),
      0
    );
    const nextUnlockingEventRows = nextUnlockingEvent
      ? Math.max(1, this.arrayValue(nextUnlockingEvent?.rounds).length)
      : 0;

    return {
      mode: "review-stage",
      sourceType,
      canonicalProjectId: canonicalProjectId.toHexString(),
      sourceSlug: identity.sourceSlug,
      sourceProjectKey: dropstabSourceProjectKey(identity),
      sourceDocumentId: identity.sourceDocumentId,
      sourceUrl: identity.sourceUrl,
      rawSource: cleanObject({
        unlockingEvents,
        nextUnlockingEvent,
      }) as any,
      counts: {
        unlockingEvents: unlockingEvents.length,
        unlockingEventRows,
        nextUnlockingEvent: nextUnlockingEvent ? 1 : 0,
        totalRows: unlockingEventRows + nextUnlockingEventRows,
      },
      warnings: [],
    };
  }

  private async findUnlockSourceProject(input: {
    canonicalProjectId: Types.ObjectId;
    sourceType: string;
    sourceSlug?: string;
    sourceProjectKey?: string;
    sourceDocumentId?: string;
  }): Promise<Record<string, any>> {
    const parserCollection = this.parserCollection();
    const hintedQuery = this.unlocksQuery(input.sourceType);
    const hintClauses = [
      ...dropstabSourceSlugClauses(input.sourceSlug),
      ...dropstabSourceProjectKeyClauses(input.sourceProjectKey),
      ...dropstabSourceProjectKeyClauses(input.sourceDocumentId),
    ];
    if (hintClauses.length) {
      hintedQuery.$and = [{ $or: hintClauses }];
      const hintedDocs = await parserCollection
        .find(hintedQuery)
        .sort({ _id: 1 })
        .limit(10)
        .toArray();
      const hinted = await this.findMatchingUnlockSourceProject(
        hintedDocs,
        input.canonicalProjectId,
        input.sourceType
      );
      if (hinted) return hinted;
      if (hintedDocs.length === 1) return hintedDocs[0];
    }

    const fallback = await this.findMatchingUnlockSourceProject(
      parserCollection
        .find(this.unlocksQuery(input.sourceType))
        .sort({ _id: 1 }),
      input.canonicalProjectId,
      input.sourceType
    );
    if (fallback) return fallback;

    throw new NotFoundException(
      "No Dropstab unlock source project found for this review case."
    );
  }

  private async findMatchingUnlockSourceProject(
    cursor: any,
    canonicalProjectId: Types.ObjectId,
    sourceType: string
  ): Promise<Record<string, any> | undefined> {
    for await (const sourceProject of cursor as any) {
      const projectLink = await this.vestingLinkingService.resolveProject(
        sourceProject,
        sourceType
      );
      if (projectLink.canonicalProjectId?.equals(canonicalProjectId)) {
        return sourceProject;
      }
    }
    return undefined;
  }

  private async processProject(
    sourceProject: Record<string, any>,
    context: {
      canonicalProjectId?: Types.ObjectId;
      sourceType: string;
      unlocksMode: FomoV2UnlockEventsImportMode;
      write: boolean;
      result: FomoV2UnlockEventsImportResult;
    }
  ): Promise<void> {
    const identity = dropstabVestingProjectIdentity(sourceProject);
    context.result.scannedProjects += 1;
    try {
      const projectLink = await this.vestingLinkingService.resolveProject(
        sourceProject,
        context.sourceType
      );
      if (!projectLink.canonicalProjectId) {
        context.result.skippedNoCanonicalProject += 1;
        return;
      }
      if (
        context.canonicalProjectId &&
        !projectLink.canonicalProjectId.equals(context.canonicalProjectId)
      ) {
        return;
      }

      context.result.projectsWithCanonicalId += 1;
      const sourceEventCount = this.countProjectSourceEvents(
        sourceProject,
        context.unlocksMode
      );
      const sourceGuard = await this.checkActiveTokenomicsSource({
        canonicalProjectId: projectLink.canonicalProjectId,
        sourceType: context.sourceType,
      });
      if (!sourceGuard.allowed) {
        context.result.sourceEventsFound += sourceEventCount;
        if (sourceGuard.skipCounter) {
          context.result[sourceGuard.skipCounter] += sourceEventCount;
        }
        if (sourceGuard.skipCounter === "skippedSourceConflict") {
          context.result.skippedInactiveSource += sourceEventCount;
        }
        this.bumpSkipped(context.result, context.write, sourceEventCount);
        if (sourceEventCount > 0) {
          context.result.warnings.push(
            `unlock source skipped: project=${
              identity.sourceSlug || identity.sourceProjectId
            } incoming=${context.sourceType} active=${
              sourceGuard.activeSourceType || "unknown"
            } reason=${sourceGuard.reason}`
          );
        }
        return;
      }
      const marketAssetId = await this.resolveMarketAssetId(
        projectLink.canonicalProjectId,
        identity,
        context.result
      );
      const normalized = this.normalizeProjectUnlockEvents({
        sourceProject,
        identity,
        canonicalProjectId: projectLink.canonicalProjectId,
        marketAssetId,
        sourceType: context.sourceType,
        mode: context.unlocksMode,
      });
      context.result.sourceEventsFound += normalized.sourceEventsFound;
      this.bumpSkipped(context.result, context.write, normalized.eventsSkipped);

      const reconciliation: UnlockEventReconciliationContext = {
        claimedExistingEventIds: new Set<string>(),
      };
      for (const event of normalized.events) {
        await this.processEvent(
          event,
          context.result,
          context.write,
          reconciliation
        );
      }
    } catch (error: any) {
      context.result.errors.push({
        sourceDocumentId: identity.sourceDocumentId,
        sourceSlug: identity.sourceSlug,
        message: error?.message || String(error),
      });
    }
  }

  private normalizeProjectUnlockEvents(input: {
    sourceProject: Record<string, any>;
    identity: DropstabVestingProjectIdentity;
    canonicalProjectId: Types.ObjectId;
    marketAssetId?: Types.ObjectId;
    sourceType: string;
    mode: FomoV2UnlockEventsImportMode;
  }): NormalizedUnlockEventResult {
    const rawEvents: FomoV2UnlockEventInput[] = [];
    let sourceEventsFound = 0;
    let eventsSkipped = 0;
    const vestingDatasetKey = dropstabVestingDatasetKey({
      canonicalProjectId: input.canonicalProjectId,
      sourceType: input.sourceType,
    });
    const sourceFetchedAt = this.sourceFetchedAt(input.sourceProject);
    const importedAt = new Date();

    const push = (
      item: Record<string, any>,
      sourcePath: string,
      eventOrigin: FomoV2UnlockEventOrigin,
      fallbackRound?: Record<string, any>
    ) => {
      sourceEventsFound += 1;
      const unlockDate = toUnlockDate(item?.unlockDate || item?.date);
      if (!unlockDate) {
        eventsSkipped += 1;
        return;
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
      const normalizedRoundName =
        cleanUnlockString(fallbackRound?.normalizedRoundName) ||
        normalizeUnlockName(roundName);
      const saleId = this.cleanSaleId(
        fallbackRound?.saleId ?? fallbackRound?.id ?? item?.saleId
      );
      const unlockType = cleanUnlockString(
        fallbackRound?.unlockType ||
          item?.unlockType ||
          this.arrayValue(item?.unlockTypes)[0]
      );
      const sourceEventId = this.sourceEventId(
        input.sourceType,
        input.identity,
        item,
        fallbackRound,
        saleId,
        normalizedRoundName,
        unlockDate,
        unlockType
      );
      const sourceContainerProviderIds =
        this.sourceContainerProviderIds(item);
      const sourceRoundProviderIds =
        this.sourceRoundProviderIds(fallbackRound);
      const sourceProviderIds = this.uniqueStrings([
        ...sourceContainerProviderIds,
        ...sourceRoundProviderIds,
      ]);
      const sourceOccurrenceProviderIds =
        this.sourceOccurrenceProviderIds({
          sourceContainerProviderIds,
          sourceRoundProviderIds,
          saleId,
          hasFallbackRound: Boolean(fallbackRound),
        });
      const hasProviderIdentity = sourceProviderIds.length > 0;
      const legacySourceEventId = this.legacySourceEventId(
        input.identity,
        sourcePath,
        item,
        saleId,
        normalizedRoundName,
        unlockDate,
        unlockType
      );
      const metadata = cleanObject({
        importer: "fomo-v2:unlock-events-import",
        sourceCollection: PARSER_COLLECTION,
        sourceDocumentId: input.identity.sourceDocumentId,
        sourceProjectKey: dropstabSourceProjectKey(input.identity),
        sourceEventKind: eventOrigin,
        sourcePath,
        sourceProviderIds,
        sourceContainerProviderIds,
        sourceRoundProviderIds,
        sourceOccurrenceProviderIds,
        sourceValues: cleanObject({
          status: cleanUnlockString(item?.statusSource || item?.status),
          isPast: item?.isPast,
          stage: cleanUnlockString(fallbackRound?.stage || item?.stage),
          unlockTypes: this.uniqueStrings([
            ...this.arrayValue(item?.unlockTypes),
            unlockType,
          ]),
          roundsCount: this.arrayValue(item?.rounds).length || undefined,
        }),
      });
      const event: FomoV2UnlockEventInput = {
        canonicalProjectId: input.canonicalProjectId,
        marketAssetId: input.marketAssetId,
        vestingDatasetKey,
        sourceType: input.sourceType as any,
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
        eventOrigin,
        eventOrigins: [eventOrigin],
        sourceFetchedAt,
        importedAt,
        sourceRefs: [
          buildDropstabSourceRef({
            identity: input.identity,
            sourceType: input.sourceType,
            sourcePath,
            sourceId: saleId,
            vestingDatasetKey,
            metadata: { eventOrigin },
          }) as any,
        ],
        metadata,
        identityAliases: {
          sourceEventIds: [legacySourceEventId],
        },
      };
      const canonicalFingerprint = buildUnlockEventFingerprint({
        canonicalProjectId: event.canonicalProjectId,
        sourceType: event.sourceType,
        sourceEventId: event.sourceEventId,
        saleId: event.saleId,
        unlockDate: event.unlockDate,
        roundName: event.roundName,
        normalizedRoundName: event.normalizedRoundName,
        unlockType: event.unlockType,
      });
      event.canonicalFingerprint = canonicalFingerprint;
      event.identityAliases = {
        ...(event.identityAliases || {}),
        canonicalFingerprints: hasProviderIdentity
          ? []
          : [
              buildUnlockEventFingerprint({
                canonicalProjectId: event.canonicalProjectId,
                sourceType: event.sourceType,
                saleId: event.saleId,
                unlockDate: event.unlockDate,
                roundName: event.roundName,
                normalizedRoundName: event.normalizedRoundName,
                unlockType: event.unlockType,
              }),
            ],
      };
      event.unlockKey = canonicalFingerprint;
      event.contentHash = this.eventContentHash(event);
      rawEvents.push(event);
    };

    if (input.mode === "provider-events" || input.mode === "all") {
      this.arrayValue(input.sourceProject.unlockingEvents).forEach(
        (event, eventIndex) => {
          const rounds = this.arrayValue(event?.rounds);
          if (rounds.length) {
            rounds.forEach((round, roundIndex) =>
              push(
                event,
                `unlockingEvents.${eventIndex}.rounds.${roundIndex}`,
                "provider_unlocking_events",
                round
              )
            );
            return;
          }
          push(
            event,
            `unlockingEvents.${eventIndex}`,
            "provider_unlocking_events"
          );
        }
      );
    }

    if (
      (input.mode === "next-only" || input.mode === "all") &&
      input.sourceProject.nextUnlockingEvent
    ) {
      const next = input.sourceProject.nextUnlockingEvent;
      const rounds = this.arrayValue(next?.rounds);
      if (rounds.length) {
        rounds.forEach((round, roundIndex) =>
          push(
            next,
            `nextUnlockingEvent.rounds.${roundIndex}`,
            "provider_next_unlocking_event",
            round
          )
        );
      } else {
        push(next, "nextUnlockingEvent", "provider_next_unlocking_event");
      }
    }

    return {
      sourceEventsFound,
      eventsSkipped,
      events: this.dedupeEvents(rawEvents),
    };
  }

  private async processEvent(
    event: FomoV2UnlockEventInput,
    result: FomoV2UnlockEventsImportResult,
    write: boolean,
    reconciliation?: UnlockEventReconciliationContext
  ): Promise<void> {
    try {
      const links = await this.resolveEventLinks(event, result);
      const linkedEvent = { ...event, ...links };
      linkedEvent.contentHash = this.eventContentHash(linkedEvent);
      const existing = await this.findExistingEvent(linkedEvent);
      if (existing && reconciliation) {
        this.claimExistingEvent(existing, reconciliation);
      }
      if (write) {
        if (existing) {
          linkedEvent.identityAliases = {
            canonicalFingerprints: this.uniqueStrings([
              ...(linkedEvent.identityAliases?.canonicalFingerprints || []),
              existing.canonicalFingerprint,
            ]),
            sourceEventIds: this.uniqueStrings([
              ...(linkedEvent.identityAliases?.sourceEventIds || []),
              existing.sourceEventId,
            ]),
          };
        }
        const written = await this.unlocksService.upsertUnlockEvent(
          linkedEvent
        );
        this.bumpStatus(
          result,
          written.status || (written.created ? "created" : "updated")
        );
        return;
      }
      if (!existing) {
        result.eventsWouldCreate += 1;
      } else if (
        !existing.contentHash ||
        existing.contentHash !== linkedEvent.contentHash
      ) {
        result.eventsWouldUpdate += 1;
      } else {
        result.eventsWouldRemainUnchanged += 1;
      }
    } catch (error: any) {
      this.bumpSkipped(result, write, 1);
      result.errors.push({
        canonicalFingerprint: event.canonicalFingerprint,
        sourcePath: event.sourcePath,
        message: error?.message || String(error),
      });
    }
  }

  private async findExistingEvent(
    event: FomoV2UnlockEventInput
  ): Promise<Record<string, any> | null> {
    const exact = await this.unlockEventModel
      .findOne({ canonicalFingerprint: event.canonicalFingerprint })
      .lean();
    if (exact) return exact as any;

    const sourceDocumentId = cleanUnlockString(
      event.metadata?.sourceDocumentId
    );
    if (!sourceDocumentId) return null;
    const rows = await (this.unlockEventModel as any)
      .find({
        canonicalProjectId: event.canonicalProjectId,
        sourceType: projectSourceTypeMongoPattern(event.sourceType),
        "metadata.importer": "fomo-v2:unlock-events-import",
        "metadata.sourceDocumentId": sourceDocumentId,
      })
      .limit(100)
      .lean();
    if (!rows?.length) return null;

    const incomingProviderIds = this.uniqueStrings(
      event.metadata?.sourceProviderIds || []
    );
    const occurrenceProviderIds = this.uniqueStrings(
      event.metadata?.sourceOccurrenceProviderIds || []
    );
    if (occurrenceProviderIds.length) {
      const occurrenceRows = rows.filter((row: any) =>
        this.providerIdsOverlap(
          occurrenceProviderIds,
          this.persistedEventOccurrenceProviderIds(row)
        )
      );
      if (occurrenceRows.length === 1) return occurrenceRows[0];
      if (occurrenceRows.length > 1) {
        throw new Error(
          `Ambiguous unlock event occurrence identity for parser document ${sourceDocumentId}; ${occurrenceRows.length} rows require review.`
        );
      }
    }

    const incomingContainerIds = this.uniqueStrings(
      event.metadata?.sourceContainerProviderIds || []
    );
    const incomingRoundIds = this.uniqueStrings(
      event.metadata?.sourceRoundProviderIds || []
    );
    const legacyProviderRows = rows.filter((row: any) => {
      const persistedIds = this.persistedEventProviderIds(row);
      if (
        incomingContainerIds.length &&
        incomingRoundIds.length
      ) {
        return (
          this.providerIdsOverlap(incomingContainerIds, persistedIds) &&
          this.providerIdsOverlap(incomingRoundIds, persistedIds)
        );
      }
      if (incomingContainerIds.length && event.saleId !== undefined) {
        return (
          this.providerIdsOverlap(incomingContainerIds, persistedIds) &&
          cleanUnlockString(row.saleId) === cleanUnlockString(event.saleId)
        );
      }
      if (incomingRoundIds.length) {
        return this.providerIdsOverlap(incomingRoundIds, persistedIds);
      }
      if (incomingContainerIds.length && !event.metadata?.sourceRoundProviderIds) {
        return this.providerIdsOverlap(incomingContainerIds, persistedIds);
      }
      return false;
    });
    const hasStrongLegacyOccurrence =
      (incomingContainerIds.length > 0 && incomingRoundIds.length > 0) ||
      (incomingContainerIds.length > 0 && event.saleId !== undefined);
    if (hasStrongLegacyOccurrence && legacyProviderRows.length === 1) {
      return legacyProviderRows[0];
    }
    if (hasStrongLegacyOccurrence && legacyProviderRows.length > 1) {
      throw new Error(
        `Ambiguous legacy unlock occurrence identity for parser document ${sourceDocumentId}; ${legacyProviderRows.length} rows require review.`
      );
    }

    const saleRows =
      event.saleId === undefined
        ? []
        : rows.filter(
            (row: any) =>
              cleanUnlockString(row.saleId) === cleanUnlockString(event.saleId)
          );
    const candidateRows = this.uniqueDocuments([
      ...legacyProviderRows,
      ...saleRows,
      ...(incomingProviderIds.length
        ? rows.filter((row: any) =>
            this.providerIdsOverlap(
              incomingProviderIds,
              this.persistedEventProviderIds(row)
            )
          )
        : []),
    ]);

    const sourcePath = cleanUnlockString(event.sourcePath);
    const samePath = sourcePath
      ? rows.filter(
          (row: any) =>
            cleanUnlockString(row.sourcePath || row?.metadata?.sourcePath) ===
            sourcePath
        )
      : [];
    const hasStrongIncomingOccurrence =
      occurrenceProviderIds.length > 0 ||
      incomingContainerIds.length > 0 ||
      incomingRoundIds.length > 0;
    const compatibleSamePath = hasStrongIncomingOccurrence
      ? samePath.filter((row: any) => {
          const persistedOccurrenceIds =
            this.persistedEventOccurrenceProviderIds(row);
          if (occurrenceProviderIds.length && persistedOccurrenceIds.length) {
            return this.providerIdsOverlap(
              occurrenceProviderIds,
              persistedOccurrenceIds
            );
          }
          const persistedProviderIds = this.persistedEventProviderIds(row);
          if (incomingContainerIds.length && incomingRoundIds.length) {
            return (
              this.providerIdsOverlap(
                incomingContainerIds,
                persistedProviderIds
              ) &&
              this.providerIdsOverlap(incomingRoundIds, persistedProviderIds)
            );
          }
          if (incomingContainerIds.length && event.saleId !== undefined) {
            return (
              this.providerIdsOverlap(
                incomingContainerIds,
                persistedProviderIds
              ) &&
              cleanUnlockString(row.saleId) === cleanUnlockString(event.saleId)
            );
          }
          return this.providerIdsOverlap(
            incomingProviderIds,
            persistedProviderIds
          );
        })
      : samePath;
    if (compatibleSamePath.length === 1) return compatibleSamePath[0];
    if (compatibleSamePath.length > 1) {
      throw new Error(
        `Ambiguous unlock source path ${sourcePath} for parser document ${sourceDocumentId}; ${compatibleSamePath.length} rows require review.`
      );
    }

    const semanticRows = candidateRows.length
      ? candidateRows
      : hasStrongIncomingOccurrence
        ? []
        : rows;
    const sameDate = semanticRows.filter(
      (row: any) =>
        toUnlockDate(row.unlockDate)?.getTime() ===
        toUnlockDate(event.unlockDate)?.getTime()
    );
    const sameDateAndRound = sameDate.filter(
      (row: any) =>
        cleanUnlockString(row.normalizedRoundName) ===
        cleanUnlockString(event.normalizedRoundName)
    );
    if (sameDateAndRound.length === 1) return sameDateAndRound[0];

    if (!sameDateAndRound.length) return null;

    throw new Error(
      `Ambiguous unlock event reconciliation for parser document ${sourceDocumentId}; ${sameDateAndRound.length} compatible occurrences require review.`
    );
  }

  private claimExistingEvent(
    event: Record<string, any>,
    reconciliation: UnlockEventReconciliationContext
  ): void {
    const identity = cleanUnlockString(
      event?._id || event?.canonicalFingerprint || event?.sourceEventId
    );
    if (!identity) {
      throw new Error(
        "Cannot safely reconcile an unlock event without a persisted identity."
      );
    }
    if (reconciliation.claimedExistingEventIds.has(identity)) {
      throw new Error(
        `Unlock event ${identity} was matched by multiple parser occurrences; review is required.`
      );
    }
    reconciliation.claimedExistingEventIds.add(identity);
  }

  private uniqueDocuments(rows: Record<string, any>[]): Record<string, any>[] {
    const seen = new Set<string>();
    return rows.filter((row) => {
      const identity = cleanUnlockString(
        row?._id || row?.canonicalFingerprint || row?.sourceEventId
      );
      if (!identity) return true;
      if (seen.has(identity)) return false;
      seen.add(identity);
      return true;
    });
  }

  private persistedEventProviderIds(event: Record<string, any>): string[] {
    const explicit = this.uniqueStrings(
      event?.metadata?.sourceProviderIds || []
    );
    if (explicit.length) return explicit;
    return String(event?.sourceEventId || "")
      .split(":")
      .filter(Boolean);
  }

  private persistedEventOccurrenceProviderIds(
    event: Record<string, any>
  ): string[] {
    return this.uniqueStrings(
      event?.metadata?.sourceOccurrenceProviderIds || []
    );
  }

  private providerIdsOverlap(left: string[], right: string[]): boolean {
    const rightSet = new Set(right);
    return left.some((value) => rightSet.has(value));
  }

  private async resolveEventLinks(
    event: FomoV2UnlockEventInput,
    result: FomoV2UnlockEventsImportResult
  ): Promise<EventLinks> {
    const links: EventLinks = {
      marketAssetId: toDropstabObjectId(event.marketAssetId),
    };
    try {
      const vestingRound = await this.vestingService.findVestingRoundForSource({
        canonicalProjectId: event.canonicalProjectId,
        sourceType: event.sourceType,
        saleId: event.saleId,
        normalizedRoundName: event.normalizedRoundName,
        roundName: event.roundName,
      });
      links.vestingRoundId = toDropstabObjectId((vestingRound as any)?._id);
    } catch (error: any) {
      this.warnResolve(
        result,
        event,
        `vestingRoundId: ${error?.message || error}`
      );
    }

    links.tokenAllocationId = await this.resolveUniqueId(
      this.tokenAllocationModel,
      [
        event.saleId !== undefined
          ? {
              canonicalProjectId: event.canonicalProjectId,
              sourceType: event.sourceType,
              saleId: event.saleId,
            }
          : undefined,
        event.normalizedRoundName
          ? {
              canonicalProjectId: event.canonicalProjectId,
              sourceType: event.sourceType,
              normalizedName: normalizeVestingName(event.normalizedRoundName),
            }
          : undefined,
      ],
      "tokenAllocationId",
      event,
      result
    );

    links.vestingScheduleId = await this.resolveUniqueId(
      this.vestingScheduleModel,
      [
        links.vestingRoundId
          ? {
              vestingRoundId: links.vestingRoundId,
              sourceType: event.sourceType,
            }
          : undefined,
        event.saleId !== undefined
          ? {
              canonicalProjectId: event.canonicalProjectId,
              sourceType: event.sourceType,
              saleId: event.saleId,
            }
          : undefined,
        event.normalizedRoundName
          ? {
              canonicalProjectId: event.canonicalProjectId,
              sourceType: event.sourceType,
              normalizedRoundName: normalizeVestingName(
                event.normalizedRoundName
              ),
            }
          : undefined,
      ],
      "vestingScheduleId",
      event,
      result
    );

    return links;
  }

  private async resolveMarketAssetId(
    canonicalProjectId: Types.ObjectId,
    identity: DropstabVestingProjectIdentity,
    result: FomoV2UnlockEventsImportResult
  ): Promise<Types.ObjectId | undefined> {
    try {
      const link = await this.vestingLinkingService.resolveMarketAsset(
        canonicalProjectId
      );
      if (link.marketAssetId) return link.marketAssetId;
      if (link.reason) {
        result.resolveWarnings += 1;
        result.warnings.push(
          `marketAssetId ${identity.sourceSlug || identity.sourceProjectId}: ${
            link.reason
          }`
        );
      }
    } catch (error: any) {
      result.resolveWarnings += 1;
      result.warnings.push(
        `marketAssetId ${identity.sourceSlug || identity.sourceProjectId}: ${
          error?.message || error
        }`
      );
    }
    return undefined;
  }

  private async checkActiveTokenomicsSource(input: {
    canonicalProjectId: Types.ObjectId;
    sourceType: string;
  }): Promise<SourceGuardResult> {
    const sourceType = this.normalizeSourceType(input.sourceType);
    const effectiveSource = await this.inferActiveVestingSourceFromDocuments(
      input.canonicalProjectId
    );
    if (!effectiveSource.sourceType) {
      return {
        allowed: false,
        reason: effectiveSource.reason,
        skipCounter: "skippedNoActiveVestingSource",
      };
    }

    const activeSourceType = effectiveSource.sourceType;
    if (activeSourceType !== sourceType) {
      return {
        allowed: false,
        activeSourceType,
        reason: `vesting/tokenomics documents use source ${activeSourceType}`,
        skipCounter: "skippedSourceConflict",
      };
    }

    return {
      allowed: true,
      activeSourceType,
      reason: "vesting_source_authoritative",
    };
  }

  private async inferActiveVestingSourceFromDocuments(
    canonicalProjectId: Types.ObjectId
  ): Promise<EffectiveVestingSource> {
    const rows = (
      await Promise.all([
        this.sourceRowsFromModel(this.tokenAllocationModel, canonicalProjectId),
        this.sourceRowsFromModel(this.vestingRoundModel, canonicalProjectId),
        this.sourceRowsFromModel(this.vestingScheduleModel, canonicalProjectId),
        this.sourceRowsFromModel(this.vestingSummaryModel, canonicalProjectId),
      ])
    ).flat();
    if (!rows.length) {
      return {
        source: "none",
        reason: "No vesting/tokenomics documents to infer active source.",
      };
    }

    const sourceTypes = this.uniqueStrings(rows.map((row) => row.sourceType));
    if (sourceTypes.length !== 1) {
      return {
        source: "ambiguous",
        reason: `Multiple vesting document sourceTypes found: ${sourceTypes.join(
          ", "
        )}`,
      };
    }

    return {
      source: "documents",
      sourceType: sourceTypes[0],
      reason: "Inferred active vesting source from existing vesting documents.",
    };
  }

  private async sourceRowsFromModel(
    model: Model<any>,
    canonicalProjectId: Types.ObjectId
  ): Promise<Array<{ sourceType?: string }>> {
    return model
      .aggregate([
        { $match: { canonicalProjectId } },
        {
          $group: {
            _id: "$sourceType",
            count: { $sum: 1 },
          },
        },
      ])
      .then((rows: any[]) =>
        rows.map((row) => ({
          sourceType: this.normalizeOptionalSourceType(row?._id),
        }))
      );
  }

  private async resolveUniqueId(
    model: Model<any>,
    filters: Array<Record<string, any> | undefined>,
    label: string,
    event: FomoV2UnlockEventInput,
    result: FomoV2UnlockEventsImportResult
  ): Promise<Types.ObjectId | undefined> {
    for (const filter of filters) {
      const cleanFilter = cleanObject(filter || {});
      if (!Object.keys(cleanFilter).length) continue;
      try {
        const docs = await model.find(cleanFilter).limit(2).lean();
        if (docs.length === 1) return toDropstabObjectId(docs[0]?._id);
        if (docs.length > 1) {
          this.warnResolve(
            result,
            event,
            `${label}: matched multiple documents for ${JSON.stringify(
              cleanFilter
            )}`
          );
          return undefined;
        }
      } catch (error: any) {
        this.warnResolve(result, event, `${label}: ${error?.message || error}`);
        return undefined;
      }
    }
    return undefined;
  }

  private dedupeEvents(
    events: FomoV2UnlockEventInput[]
  ): FomoV2UnlockEventInput[] {
    const byFingerprint = new Map<string, FomoV2UnlockEventInput>();
    for (const event of events) {
      if (!event.canonicalFingerprint) continue;
      const existing = byFingerprint.get(event.canonicalFingerprint);
      if (!existing) {
        byFingerprint.set(event.canonicalFingerprint, event);
        continue;
      }
      const origins = this.uniqueStrings([
        ...(existing.eventOrigins || []),
        existing.eventOrigin,
        ...(event.eventOrigins || []),
        event.eventOrigin,
      ]) as FomoV2UnlockEventOrigin[];
      const sourceRefs = this.mergeSourceRefs(
        existing.sourceRefs || [],
        event.sourceRefs || []
      );
      const merged = {
        ...existing,
        eventOrigins: origins,
        sourceRefs,
        metadata: cleanObject({
          ...(existing.metadata || {}),
          mergedSourcePaths: this.uniqueStrings([
            ...this.arrayValue((existing.metadata as any)?.mergedSourcePaths),
            existing.sourcePath,
            event.sourcePath,
          ]),
        }),
        identityAliases: {
          canonicalFingerprints: this.uniqueStrings([
            ...(existing.identityAliases?.canonicalFingerprints || []),
            ...(event.identityAliases?.canonicalFingerprints || []),
          ]),
          sourceEventIds: this.uniqueStrings([
            ...(existing.identityAliases?.sourceEventIds || []),
            ...(event.identityAliases?.sourceEventIds || []),
          ]),
        },
      };
      merged.contentHash = this.eventContentHash(merged);
      byFingerprint.set(event.canonicalFingerprint, merged);
    }
    return Array.from(byFingerprint.values());
  }

  private mergeSourceRefs(left: any[], right: any[]): any[] {
    const refs = [...left, ...right];
    const seen = new Set<string>();
    return refs.filter((ref) => {
      const key = [
        cleanUnlockString(ref?.source),
        cleanUnlockString(ref?.sourceId),
        cleanUnlockString(ref?.sourcePath),
      ].join(":");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private sourceEventId(
    sourceType: string,
    identity: DropstabVestingProjectIdentity,
    item: Record<string, any>,
    fallbackRound: Record<string, any> | undefined,
    saleId: string | number | undefined,
    normalizedRoundName: string | undefined,
    unlockDate: Date,
    unlockType?: string
  ): string {
    const providerIds = this.sourceProviderIds(item, fallbackRound);
    return [
      this.normalizeSourceType(sourceType),
      dropstabSourceProjectKey(identity),
      "unlock_event",
      ...(providerIds.length ? ["provider", ...providerIds] : ["semantic"]),
      saleId,
      normalizedRoundName,
      unlockDate.toISOString().slice(0, 10),
      cleanUnlockString(unlockType)?.toLowerCase(),
    ]
      .map((part) => cleanUnlockString(part) || "")
      .filter(Boolean)
      .join(":");
  }

  private sourceProviderIds(
    item: Record<string, any>,
    fallbackRound?: Record<string, any>
  ): string[] {
    return this.uniqueStrings([
      ...this.sourceContainerProviderIds(item),
      ...this.sourceRoundProviderIds(fallbackRound),
    ]);
  }

  private sourceContainerProviderIds(item: Record<string, any>): string[] {
    return this.uniqueStrings([
      item?.sourceEventId,
      item?.eventId,
      item?.id,
      item?.sourceKey,
    ]);
  }

  private sourceRoundProviderIds(
    fallbackRound?: Record<string, any>
  ): string[] {
    return this.uniqueStrings([
      fallbackRound?.sourceEventId,
      fallbackRound?.roundId,
      fallbackRound?.id,
      fallbackRound?.sourceKey,
    ]);
  }

  private sourceOccurrenceProviderIds(input: {
    sourceContainerProviderIds: string[];
    sourceRoundProviderIds: string[];
    saleId?: string | number;
    hasFallbackRound: boolean;
  }): string[] {
    if (
      input.sourceContainerProviderIds.length &&
      input.sourceRoundProviderIds.length
    ) {
      return input.sourceContainerProviderIds.flatMap((containerId) =>
        input.sourceRoundProviderIds.map(
          (roundId) => `event:${containerId}:round:${roundId}`
        )
      );
    }
    if (
      input.sourceContainerProviderIds.length &&
      input.saleId !== undefined
    ) {
      return input.sourceContainerProviderIds.map(
        (containerId) => `event:${containerId}:sale:${input.saleId}`
      );
    }
    if (
      input.sourceContainerProviderIds.length &&
      !input.hasFallbackRound
    ) {
      return input.sourceContainerProviderIds.map(
        (containerId) => `event:${containerId}`
      );
    }
    return [];
  }

  private legacySourceEventId(
    identity: DropstabVestingProjectIdentity,
    sourcePath: string,
    item: Record<string, any>,
    saleId: string | number | undefined,
    normalizedRoundName: string | undefined,
    unlockDate: Date,
    unlockType?: string
  ): string {
    return [
      dropstabSourceProjectKey(identity),
      cleanUnlockString(item?.sourceEventId || item?.id || item?.sourceKey),
      sourcePath,
      saleId,
      normalizedRoundName,
      unlockDate.toISOString().slice(0, 10),
      cleanUnlockString(unlockType),
    ]
      .map((part) => cleanUnlockString(part) || "")
      .filter(Boolean)
      .join(":");
  }

  private eventContentHash(event: FomoV2UnlockEventInput): string {
    return buildUnlockEventContentHash({
      sourceType: event.sourceType,
      sourceEventId: event.sourceEventId,
      marketAssetId: event.marketAssetId,
      tokenAllocationId: event.tokenAllocationId,
      vestingRoundId: event.vestingRoundId,
      vestingScheduleId: event.vestingScheduleId,
      vestingDatasetKey: event.vestingDatasetKey,
      statusSource: event.statusSource,
      amount: event.amount,
      percentOfSupply: event.percentOfSupply,
      roundName: event.roundName,
      normalizedRoundName: event.normalizedRoundName,
      stage: event.stage,
      unlockType: event.unlockType,
      unlockTypes: event.unlockTypes,
      isTgeUnlock: event.isTgeUnlock,
      sourceValueUsd: event.sourceValueUsd,
      sourceMarketCapSharePercent: event.sourceMarketCapSharePercent,
      sourceRefs: event.sourceRefs,
      metadata: event.metadata,
    });
  }

  private sourceFetchedAt(
    sourceProject: Record<string, any>
  ): Date | undefined {
    return toUnlockDate(
      sourceProject?.sourcePages?.vesting?.fetchedAt ||
        sourceProject?.sourcePages?.tokenUnlocks?.fetchedAt ||
        sourceProject?.parsedAt ||
        sourceProject?.fetchedAt ||
        sourceProject?.updatedAt
    );
  }

  private unlocksQuery(sourceType: string): Record<string, any> {
    return {
      source: sourceType,
      $or: [
        { "unlockingEvents.0": { $exists: true } },
        { nextUnlockingEvent: { $exists: true, $ne: null } },
      ],
    };
  }

  private countProjectSourceEvents(
    sourceProject: Record<string, any>,
    mode: FomoV2UnlockEventsImportMode
  ): number {
    let count = 0;
    if (mode === "provider-events" || mode === "all") {
      for (const event of this.arrayValue(sourceProject.unlockingEvents)) {
        count += Math.max(1, this.arrayValue(event?.rounds).length);
      }
    }
    if (
      (mode === "next-only" || mode === "all") &&
      sourceProject.nextUnlockingEvent
    ) {
      count += Math.max(
        1,
        this.arrayValue(sourceProject.nextUnlockingEvent?.rounds).length
      );
    }
    return count;
  }

  private parserCollection(): any {
    const db = (this.parserConnection as any).db;
    if (!db) throw new Error("Parser DB connection is not initialized.");
    return db.collection(PARSER_COLLECTION);
  }

  private emptyResult(
    sourceType: string,
    unlocksMode: FomoV2UnlockEventsImportMode,
    write: boolean
  ): FomoV2UnlockEventsImportResult {
    return {
      mode: write ? "write" : "dry-run",
      dryRun: !write,
      sourceType,
      unlocksMode,
      scannedProjects: 0,
      projectsWithCanonicalId: 0,
      skippedNoCanonicalProject: 0,
      skippedInactiveSource: 0,
      skippedSourceConflict: 0,
      skippedNoActiveVestingSource: 0,
      sourceEventsFound: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsUnchanged: 0,
      eventsSkipped: 0,
      eventsWouldCreate: 0,
      eventsWouldUpdate: 0,
      eventsWouldRemainUnchanged: 0,
      eventsWouldSkip: 0,
      resolveWarnings: 0,
      errors: [],
      warnings: [],
    };
  }

  private warnResolve(
    result: FomoV2UnlockEventsImportResult,
    event: FomoV2UnlockEventInput,
    message: string
  ): void {
    result.resolveWarnings += 1;
    if (result.warnings.length < 100) {
      result.warnings.push(
        `${message}; event=${event.canonicalFingerprint || event.sourcePath}`
      );
    }
  }

  private bumpStatus(
    result: FomoV2UnlockEventsImportResult,
    status: FomoV2UnlockUpsertStatus
  ): void {
    if (status === "created") result.eventsCreated += 1;
    else if (status === "updated") result.eventsUpdated += 1;
    else if (status === "unchanged") result.eventsUnchanged += 1;
    else result.eventsSkipped += 1;
  }

  private bumpSkipped(
    result: FomoV2UnlockEventsImportResult,
    write: boolean,
    count: number
  ): void {
    if (write) result.eventsSkipped += count;
    else result.eventsWouldSkip += count;
  }

  private normalizeSourceType(value: any): string {
    return normalizeDropstabSourceType(value);
  }

  private normalizeOptionalSourceType(value: any): string | undefined {
    return normalizeProjectSourceType(value) || undefined;
  }

  private normalizeMode(value: any): FomoV2UnlockEventsImportMode {
    const mode = cleanVestingString(value)?.toLowerCase() || "next-only";
    if (["next-only", "provider-events", "all"].includes(mode)) {
      return mode as FomoV2UnlockEventsImportMode;
    }
    throw new Error(
      `Unsupported unlock events mode "${value}". Use next-only, provider-events, or all.`
    );
  }

  private cleanSaleId(value: any): string | number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    return typeof value === "number" && Number.isFinite(value)
      ? value
      : cleanUnlockString(value);
  }

  private parsePositiveInteger(
    value: any,
    fallback: number
  ): number | undefined {
    if (value === undefined || value === null || value === "") return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.trunc(parsed);
  }

  private parseNonNegativeInteger(value: any, fallback: number): number {
    if (value === undefined || value === null || value === "") return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return fallback;
    return Math.trunc(parsed);
  }

  private toOptionalObjectId(
    value: any,
    field: string
  ): Types.ObjectId | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const objectId = toDropstabObjectId(value);
    if (!objectId)
      throw new Error(`Invalid ${field} ObjectId value "${value}".`);
    return objectId;
  }

  private uniqueStrings(values: any[]): string[] {
    return Array.from(
      new Set(values.map((value) => cleanUnlockString(value)).filter(Boolean))
    ) as string[];
  }

  private arrayValue(value: any): any[] {
    if (Array.isArray(value)) return value;
    return value === undefined || value === null ? [] : [value];
  }

  private clonePlain<T>(value: T): T {
    if (value === undefined) return value;
    return JSON.parse(JSON.stringify(value));
  }
}
