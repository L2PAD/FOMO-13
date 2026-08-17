import {
  ConflictException,
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import { FOMO_V2_PARSER_DB_CONNECTION } from "../../ico/ico-parser-db.constants";
import {
  ResolveCanonicalProjectResult,
  ResolveCanonicalProjectService,
} from "../../../services/resolve-canonical-project.service";
import {
  FomoV2SourceSnapshot,
  FomoV2SourceSnapshotDocument,
} from "../../../models/source-snapshot.model";
import {
  buildActivitySourceKey,
  hashActivityPayload,
} from "../helpers/activity-content.helper";
import {
  activitySemanticPayload,
  FomoV2ActivitySourceOrigin,
  normalizeActivitySourceDocument,
} from "../helpers/activity-source-normalize.helper";
import {
  FomoV2Activity,
  FomoV2ActivityDocument,
} from "../models/activity.model";
import {
  FomoV2ActivityCanonicalCandidate,
  FomoV2ActivityCanonicalStatus,
  FomoV2ActivityIngestInput,
} from "../types/activity.types";
import { FomoV2ActivityIngestService } from "./activity-ingest.service";
import { ExternalAssetMirrorWriteService } from "src/storage/external-asset-mirror-write.service";
import {
  FomoV2ParserImportLeaseLostError,
  FomoV2ParserImportRunHandle,
  FomoV2ParserImportRuntimeService,
  normalizeParserImportSourceType,
} from "../../../services/parser-import-runtime.service";
import { FomoV2ParserControlPolicyService } from "../../parser-control/services/parser-control-policy.service";
import {
  FomoV2ParserSnapshotReaderService,
  FomoV2ValidatedParserSnapshot,
} from "../../parser-control/services/parser-snapshot-reader.service";
import { normalizeProjectSourceType } from "../../../shared/source-policy/helpers";

const DEFAULT_IMPORT_LIMIT = 100;
const MAX_IMPORT_LIMIT = 500;
const LEGACY_COLLECTION_NAMES = ["cryptoactivities", "crypto_activities"];
const PARSER_COLLECTION_NAMES = ["crypto_activities", "cryptoactivities"];
const DROPSTAB_ACTIVITIES_UPSTREAM_PARSER_KEY = "activities:dropstab";

export type FomoV2ActivityImportSource = FomoV2ActivitySourceOrigin | "all";

export interface FomoV2ActivityImportPendingOptions {
  source?: FomoV2ActivityImportSource;
  /** Exact provider inside the shared parser activity collection. */
  providerSourceType?: string;
  limit?: number;
  force?: boolean;
  /** Defaults to false. Managed jobs always pass their effective mode. */
  write?: boolean;
  cursor?: string;
  cursors?: Partial<Record<FomoV2ActivitySourceOrigin, string>>;
  /** Internal scheduler option; admin cursors never overwrite cron progress. */
  persistCheckpoint?: boolean;
  snapshotId?: string;
  upstreamRunId?: string;
  upstreamParserKey?: string;
  /** In-process lease/policy fence supplied by the managed parser worker. */
  assertExecutionActive?: () => void | Promise<void>;
}

export interface FomoV2ActivityImportCounts {
  scanned: number;
  staged: number;
  created: number;
  updated: number;
  skippedUnchanged: number;
  skippedInvalid: number;
  failed: number;
  quarantined: number;
}

export interface FomoV2ActivityImportPageResult {
  source: FomoV2ActivitySourceOrigin;
  collection: string;
  database: string;
  cursor?: string;
  nextCursor?: string;
  hasMore: boolean;
  counts: FomoV2ActivityImportCounts;
  canonicalCounts: Record<FomoV2ActivityCanonicalStatus, number>;
  errors: Array<{ id?: string; message: string }>;
}

export interface FomoV2ActivityCanonicalDecision {
  canonicalStatus: FomoV2ActivityCanonicalStatus;
  canonicalProjectId?: string;
  canonicalCandidates: FomoV2ActivityCanonicalCandidate[];
}

interface ActivityProviderBucket {
  sourceType: string;
  filter: Record<string, any>;
  discoveryError?: Error;
}

interface ActivityImportExecutionFence {
  assert(): Promise<void>;
  isFenceError(error: unknown): boolean;
}

@Injectable()
export class FomoV2ActivitySourceImportService {
  private readonly logger = new Logger(FomoV2ActivitySourceImportService.name);
  private cronRunning = false;

  constructor(
    @InjectConnection()
    private readonly mainConnection: Connection,
    @InjectConnection(FOMO_V2_PARSER_DB_CONNECTION)
    private readonly parserConnection: Connection,
    @InjectModel(FomoV2Activity.name)
    private readonly activityModel: Model<FomoV2ActivityDocument>,
    @InjectModel(FomoV2SourceSnapshot.name)
    private readonly sourceSnapshotModel: Model<FomoV2SourceSnapshotDocument>,
    private readonly ingestService: FomoV2ActivityIngestService,
    private readonly canonicalResolver: ResolveCanonicalProjectService,
    private readonly configService: ConfigService,
    private readonly assetMirror?: ExternalAssetMirrorWriteService,
    @Optional()
    private readonly parserImportRuntime?: FomoV2ParserImportRuntimeService,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService,
    @Optional()
    private readonly snapshotReader?: FomoV2ParserSnapshotReaderService
  ) {}

  /** Manual/admin entry point. The returned cursors are opaque and resumable. */
  async importPending(options: FomoV2ActivityImportPendingOptions = {}) {
    const source = options.source || "all";
    // Manual calls are safe by default. Managed jobs always pass their
    // effective mode explicitly after resolving global TEST/PROD policy.
    const write = options.write === true;
    const providerSourceType = options.providerSourceType
      ? normalizeParserImportSourceType(options.providerSourceType)
      : undefined;
    if (providerSourceType && source !== "parser") {
      throw new Error(
        "providerSourceType can only be used with the parser activity source."
      );
    }
    if (write && source === "all") {
      throw new Error(
        "Write mode requires one source bucket: legacy or parser with providerSourceType."
      );
    }
    if (write && source === "parser" && !providerSourceType) {
      throw new Error(
        "Parser activity writes require providerSourceType=dropstab or icodrops."
      );
    }
    if (write && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        `activities:${providerSourceType || source}`
      );
    }
    const executionFence = createActivityImportExecutionFence(
      options.assertExecutionActive
    );
    await executionFence?.assert();
    const limit = options.snapshotId
      ? boundedSnapshotLimit(options.limit)
      : boundedLimit(options.limit);
    if (options.snapshotId) {
      return this.importSnapshot({
        ...options,
        source,
        providerSourceType,
        write,
        limit,
        executionFence,
      });
    }
    const origins: FomoV2ActivitySourceOrigin[] =
      source === "all" ? ["legacy", "parser"] : [source];
    const results: Partial<
      Record<FomoV2ActivitySourceOrigin, FomoV2ActivityImportPageResult>
    > = {};

    for (const origin of origins) {
      await executionFence?.assert();
      const cursor =
        options.cursors?.[origin] ||
        (source === origin ? options.cursor : undefined);
      try {
        results[origin] = await this.importPage(origin, {
          limit,
          cursor,
          force: Boolean(options.force),
          write,
          persistCheckpoint: write && Boolean(options.persistCheckpoint),
          providerSourceType,
          executionFence,
        });
      } catch (error: any) {
        if (executionFence?.isFenceError(error)) throw error;
        results[origin] = failedActivityPage(
          origin,
          origin === "parser"
            ? PARSER_COLLECTION_NAMES[0]
            : LEGACY_COLLECTION_NAMES[0],
          (origin === "parser" ? this.parserConnection : this.mainConnection).db
            ?.databaseName || origin,
          error,
          `origin:${origin}`
        );
      }
      await executionFence?.assert();
    }

    const pages = Object.values(results).filter(
      Boolean
    ) as FomoV2ActivityImportPageResult[];
    return {
      source,
      sourceType: providerSourceType,
      mode: write ? "write" : "dry-run",
      dryRun: !write,
      limit,
      force: Boolean(options.force),
      results,
      counts: sumCounts(pages.map((page) => page.counts)),
      cursors: pages.reduce((result, page) => {
        if (page.nextCursor) result[page.source] = page.nextCursor;
        return result;
      }, {} as Partial<Record<FomoV2ActivitySourceOrigin, string>>),
      hasMore: pages.some((page) => page.hasMore),
      publicationChanged: false,
    };
  }

  private async importSnapshot(options: {
    source: FomoV2ActivityImportSource;
    providerSourceType?: string;
    snapshotId?: string;
    upstreamRunId?: string;
    upstreamParserKey?: string;
    write: boolean;
    force?: boolean;
    limit: number;
    executionFence?: ActivityImportExecutionFence;
  }): Promise<Record<string, any>> {
    if (options.source !== "parser") {
      throw new Error(
        "Activity parser snapshots can only be imported with source=parser."
      );
    }
    const sourceType = normalizeParserImportSourceType(
      options.providerSourceType || ""
    );
    if (sourceType !== "dropstab") {
      throw new Error(
        'Managed activity snapshots currently require providerSourceType="dropstab".'
      );
    }
    if (!this.snapshotReader) {
      throw new Error("Parser snapshot reader is not available.");
    }
    const parserKey =
      cleanString(options.upstreamParserKey) ||
      DROPSTAB_ACTIVITIES_UPSTREAM_PARSER_KEY;
    if (parserKey !== DROPSTAB_ACTIVITIES_UPSTREAM_PARSER_KEY) {
      throw new Error(
        `Dropstab activity snapshot import requires parser ${DROPSTAB_ACTIVITIES_UPSTREAM_PARSER_KEY}.`
      );
    }
    const snapshot = await this.snapshotReader.validate({
      snapshotId: String(options.snapshotId || ""),
      parserKey,
      sourceType,
      write: options.write,
      upstreamRunId: cleanString(options.upstreamRunId),
    });
    return this.importValidatedSnapshot(snapshot, options);
  }

  private async importValidatedSnapshot(
    snapshot: FomoV2ValidatedParserSnapshot,
    options: {
      source: "parser" | FomoV2ActivityImportSource;
      write: boolean;
      force?: boolean;
      limit: number;
      executionFence?: ActivityImportExecutionFence;
    }
  ): Promise<Record<string, any>> {
    const counts = emptyCounts();
    const canonicalCounts = emptyCanonicalCounts();
    const errors: Array<{ id?: string; message: string }> = [];
    const cursor = this.snapshotReader!.cursor(snapshot, {
      limit: options.limit,
    });

    for await (const item of cursor as any) {
      await options.executionFence?.assert();
      const document = this.snapshotReader!.payload(snapshot, item);
      await this.processImportedActivityDocument({
        document,
        origin: "parser",
        force: Boolean(options.force),
        replayRequested: false,
        providerSourceType: snapshot.sourceType,
        write: options.write,
        counts,
        errors,
        canonicalCounts,
      });
      await options.executionFence?.assert();
    }

    const page: FomoV2ActivityImportPageResult = {
      source: "parser",
      collection: "parser_snapshot_items",
      database:
        (this.parserConnection as any).db?.databaseName || "parser",
      hasMore: snapshot.succeeded > counts.scanned,
      counts,
      canonicalCounts,
      errors,
    };
    return {
      source: "parser",
      sourceType: snapshot.sourceType,
      snapshotId: snapshot.snapshotId,
      mode: options.write ? "write" : "dry-run",
      dryRun: !options.write,
      limit: options.limit,
      force: Boolean(options.force),
      results: { parser: page },
      counts,
      cursors: {},
      hasMore: page.hasMore,
      publicationChanged: false,
    };
  }

  /**
   * Scheduler entry point. It is inert unless explicitly enabled. Cursor and
   * lease state are persisted per source by ParserImportRuntime.
   */
  @Cron(process.env.FOMO_V2_ACTIVITY_INGEST_CRON || "0 */10 * * * *", {
    name: "fomo-v2-activity-ingest",
  })
  async importPendingCron(): Promise<void> {
    if (!this.isEnabled("FOMO_V2_ACTIVITY_INGEST_ENABLED", false)) return;
    // Once the persistent control plane is registered it is the sole scheduler;
    // retaining this env cron as a second writer would bypass per-source pause.
    if (this.parserControlPolicy) return;
    if (this.cronRunning) {
      this.logger.warn(
        "FOMO v2 activity ingest skipped: previous run is active."
      );
      return;
    }

    this.cronRunning = true;
    try {
      const result = await this.importPending({
        source: "all",
        limit: this.configImportLimit(
          "FOMO_V2_ACTIVITY_INGEST_LIMIT",
          DEFAULT_IMPORT_LIMIT
        ),
        force: false,
        write: true,
        persistCheckpoint: true,
      });
      const lifecycle = await this.refreshLifecycleStatuses(new Date());
      this.logger.log(
        `FOMO v2 activity ingest scanned=${result.counts.scanned} staged=${result.counts.staged} unchanged=${result.counts.skippedUnchanged} failed=${result.counts.failed} lifecycleUpdated=${lifecycle.updated}`
      );
    } catch (error: any) {
      this.logger.error(
        `FOMO v2 activity ingest failed: ${safeErrorMessage(error)}`
      );
    } finally {
      this.cronRunning = false;
    }
  }

  /**
   * Keeps feed/calendar lifecycle state fresh between parser runs. Transitions
   * are forward-only and never touch cancelled, ended, or explicitly protected
   * lifecycle rows.
   */
  async refreshLifecycleStatuses(
    now = new Date(),
    limit = 2_000
  ): Promise<{ scanned: number; attempted: number; updated: number }> {
    if (this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        "activities:system"
      );
    }
    const rows = await this.activityModel
      .find(
        {
          $or: [
            {
              lifecycleStatus: { $in: ["upcoming", "active"] },
              manualOverrideFields: { $ne: "lifecycleStatus" },
              $or: [
                { "currentDraft.startDate": { $lte: now } },
                { "currentDraft.endDate": { $lt: now } },
              ],
            },
            {
              publicationStatus: "published",
              "publishedMetadata.lifecycleStatus": {
                $in: ["upcoming", "active"],
              },
              $or: [
                { "publishedSnapshot.startDate": { $lte: now } },
                { "publishedSnapshot.endDate": { $lt: now } },
              ],
            },
          ],
        },
        {
          _id: 1,
          revision: 1,
          lifecycleStatus: 1,
          currentDraft: 1,
          publicationStatus: 1,
          publishedMetadata: 1,
          publishedSnapshot: 1,
          manualOverrideFields: 1,
        }
      )
      .sort({ "currentDraft.endDate": 1, _id: 1 })
      .limit(Math.max(1, Math.min(10_000, Math.floor(limit))))
      .lean()
      .exec();
    const operations: any[] = [];
    for (const activity of rows) {
      const draftStatus = String(activity.lifecycleStatus || "");
      const canAdvanceDraft =
        ["upcoming", "active"].includes(draftStatus) &&
        !(activity.manualOverrideFields || []).includes("lifecycleStatus");
      const nextDraftStatus = canAdvanceDraft
        ? nextLifecycleStatus(draftStatus, activity.currentDraft, now)
        : undefined;

      const publishedStatus = String(
        activity.publishedMetadata?.lifecycleStatus || ""
      );
      const canAdvancePublished =
        activity.publicationStatus === "published" &&
        ["upcoming", "active"].includes(publishedStatus);
      const nextPublishedStatus = canAdvancePublished
        ? nextLifecycleStatus(publishedStatus, activity.publishedSnapshot, now)
        : undefined;

      if (!nextDraftStatus && !nextPublishedStatus) continue;
      const nextRevision = Number(activity.revision || 0) + 1;
      const set: Record<string, any> = {};
      const changedFields: string[] = [];
      if (nextDraftStatus) {
        set.lifecycleStatus = nextDraftStatus;
        changedFields.push("lifecycleStatus");
      }
      if (nextPublishedStatus) {
        set["publishedMetadata.lifecycleStatus"] = nextPublishedStatus;
        changedFields.push("publishedMetadata.lifecycleStatus");
      }
      const transitions = [
        nextDraftStatus
          ? `draft ${draftStatus} to ${nextDraftStatus}`
          : undefined,
        nextPublishedStatus
          ? `published ${publishedStatus} to ${nextPublishedStatus}`
          : undefined,
      ].filter(Boolean);
      operations.push({
        updateOne: {
          filter: {
            _id: activity._id,
            revision: activity.revision,
          },
          update: {
            $set: set,
            $inc: { revision: 1 },
            $push: {
              auditTrail: {
                $each: [
                  {
                    action: "edit",
                    actor: "scheduler:activity-lifecycle",
                    at: now,
                    revision: nextRevision,
                    note: `Lifecycle advanced (${transitions.join(
                      ", "
                    )}) from its reviewed snapshot dates.`,
                    changedFields,
                    fromStatus: nextDraftStatus ? draftStatus : undefined,
                    toStatus: nextDraftStatus ? nextDraftStatus : undefined,
                  },
                ],
                $slice: -200,
              },
            },
          },
        },
      });
    }
    if (!operations.length) {
      return { scanned: rows.length, attempted: 0, updated: 0 };
    }
    const result = await this.activityModel.bulkWrite(operations, {
      ordered: false,
    });
    return {
      scanned: rows.length,
      attempted: operations.length,
      updated: Number(result.modifiedCount || 0),
    };
  }

  async stageDocument(
    document: Record<string, any>,
    origin: FomoV2ActivitySourceOrigin,
    options: {
      force?: boolean;
      parserImportRunId?: string;
      assertLease?: () => Promise<void>;
      write?: boolean;
    } = {}
  ): Promise<any> {
    const normalized = normalizeActivitySourceDocument(document, origin);
    if (!normalized) {
      return { staged: false, skipped: "invalid_source_document" };
    }

    const input = normalized.ingestInput;
    const canonicalSource = normalizeProjectSourceType(input.source);
    if (canonicalSource) {
      input.source = canonicalSource;
      normalized.resolverIdentity.source = canonicalSource;
    }
    input.parserImportRunId = options.parserImportRunId;
    const payloadHash = hashActivityPayload(activitySemanticPayload(input));
    input.payloadHash = payloadHash;
    if (!options.force && (await this.isAlreadyStaged(input, payloadHash))) {
      return {
        staged: false,
        skipped: "unchanged",
        slug: input.slug,
      };
    }
    let resolverResult: ResolveCanonicalProjectResult | undefined;
    let resolverError: string | undefined;
    if (options.write !== false) await options.assertLease?.();
    try {
      resolverResult = await this.canonicalResolver.resolve({
        ...normalized.resolverIdentity,
        sourceEntityType: "activity",
      });
      Object.assign(input, mapActivityCanonicalResolution(resolverResult));
    } catch (error: any) {
      // A resolver outage is not equivalent to "no candidates". Stage as
      // unprocessed so the admin queue can retry without a false no-match.
      resolverError = safeErrorMessage(error);
      input.canonicalStatus = "unprocessed";
      delete input.canonicalCandidates;
      delete input.canonicalProjectId;
    }

    if (options.write === false) {
      return {
        staged: true,
        created: true,
        dryRun: true,
        canonicalStatus: input.canonicalStatus || "unprocessed",
        resolverResult,
        resolverError,
      };
    }

    // Network/storage side effects run only for effective WRITE executions.
    // The hash intentionally describes parser data, not mirrored URLs.
    await options.assertLease?.();
    await this.mirrorActivityAssets(input);
    await options.assertLease?.();
    const staged = await this.ingestService.stage(input);
    if (resolverError) {
      const retryError: any = new Error(
        `Canonical resolver failed after the activity was safely staged as unprocessed: ${resolverError}`
      );
      retryError.code = "ACTIVITY_CANONICAL_RESOLVER_RETRY";
      retryError.metadata = {
        partialStagePersisted: true,
        source: input.source,
        sourceId: input.sourceId,
        sourceSnapshotId: staged.sourceSnapshotId,
      };
      throw retryError;
    }
    return {
      ...staged,
      staged: true,
      canonicalStatus:
        input.canonicalStatus ||
        staged.activity?.canonicalResolution?.status ||
        "unprocessed",
      resolverResult,
      resolverError,
    };
  }

  private async mirrorActivityAssets(
    input: FomoV2ActivityIngestInput
  ): Promise<void> {
    if (!this.assetMirror) return;
    const draft: any = input.normalizedDraft || {};
    const documentId = String(input.sourceId || input.sourceSlug || input.slug);
    const entries: Array<{
      owner: Record<string, any>;
      key: string;
      path: string;
    }> = [];
    const add = (
      owner: Record<string, any> | undefined,
      key: string,
      path: string
    ) => {
      if (owner && typeof owner[key] === "string" && owner[key].trim()) {
        entries.push({ owner, key, path });
      }
    };

    add(draft, "logo", "currentDraft.logo");
    add(draft, "projectLogo", "currentDraft.projectLogo");
    (draft.relatedAssets || []).forEach((asset: any, index: number) => {
      add(asset, "image", `currentDraft.relatedAssets[${index}].image`);
      add(asset, "logo", `currentDraft.relatedAssets[${index}].logo`);
    });
    (draft.investors || []).forEach((investor: any, index: number) => {
      add(investor, "logo", `currentDraft.investors[${index}].logo`);
      add(investor, "image", `currentDraft.investors[${index}].image`);
    });
    (draft.taskGuide?.steps || []).forEach((step: any, index: number) => {
      add(step, "image", `currentDraft.taskGuide.steps[${index}].image`);
    });

    for (const entry of entries) {
      const mirrored = await this.assetMirror.mirrorUrl(
        entry.owner[entry.key],
        {
          collection: "activities",
          documentId,
          fieldPath: entry.path,
          sourceName: `activity-import:${input.source}`,
        }
      );
      if (mirrored) entry.owner[entry.key] = mirrored;
    }
  }

  private async importPage(
    origin: FomoV2ActivitySourceOrigin,
    options: {
      limit: number;
      cursor?: string;
      force: boolean;
      write?: boolean;
      persistCheckpoint: boolean;
      providerSourceType?: string;
      providerBucket?: ActivityProviderBucket;
      executionFence?: ActivityImportExecutionFence;
    }
  ): Promise<FomoV2ActivityImportPageResult> {
    await options.executionFence?.assert();
    const write = options.write !== false;
    const connection =
      origin === "parser" ? this.parserConnection : this.mainConnection;
    const collectionNames =
      origin === "parser" ? PARSER_COLLECTION_NAMES : LEGACY_COLLECTION_NAMES;
    const db = connection.db;
    if (!db) {
      throw new ServiceUnavailableException(
        `${origin} Mongo connection is unavailable.`
      );
    }
    const collection = await firstExistingCollection(db, collectionNames);
    if (
      origin === "parser" &&
      !options.providerBucket
    ) {
      let buckets = await discoverActivityProviderBuckets(
        db.collection(collection),
        origin
      );
      if (options.providerSourceType) {
        buckets = buckets.filter(
          (bucket) => bucket.sourceType === options.providerSourceType
        );
      } else if (!options.persistCheckpoint || !this.parserImportRuntime) {
        buckets = [];
      }
      if (!buckets.length && options.providerSourceType) {
        return mergeActivityProviderPages(
          origin,
          collection,
          db.databaseName,
          []
        );
      }
      if (!buckets.length) {
        // Preserve the legacy non-checkpoint path when provider splitting was
        // not requested and the runtime is unavailable.
      } else {
      const providerPages: FomoV2ActivityImportPageResult[] = [];
      for (const providerBucket of buckets) {
        await options.executionFence?.assert();
        if (providerBucket.discoveryError) {
          providerPages.push(
            failedActivityPage(
              origin,
              collection,
              db.databaseName,
              providerBucket.discoveryError,
              `provider:${providerBucket.sourceType}`
            )
          );
          continue;
        }
        try {
          providerPages.push(
            await this.importPage(origin, {
              ...options,
              // A legacy origin cursor cannot safely seed multiple provider
              // checkpoints. Every provider resumes from its own runtime cursor.
              cursor: undefined,
              providerBucket,
            })
          );
        } catch (error: any) {
          if (options.executionFence?.isFenceError(error)) throw error;
          providerPages.push(
            failedActivityPage(
              origin,
              collection,
              db.databaseName,
              error,
              `provider:${providerBucket.sourceType}`
            )
          );
        }
        await options.executionFence?.assert();
      }
      return mergeActivityProviderPages(
        origin,
        collection,
        db.databaseName,
        providerPages
      );
      }
    }
    let run: FomoV2ParserImportRunHandle | undefined;
    const counts = emptyCounts();
    const errors: Array<{ id?: string; message: string }> = [];
    const canonicalCounts = emptyCanonicalCounts();

    try {
      if (write && this.parserImportRuntime && options.persistCheckpoint) {
        run = await this.parserImportRuntime.startRun({
          pipeline: "activities",
          sourceType: options.providerBucket?.sourceType || origin,
          sourceDatabase: db.databaseName,
          sourceCollection: collection,
          dryRun: false,
          // Manual/admin cursors must not seed or rewind scheduler progress.
          cursor: options.persistCheckpoint ? options.cursor : undefined,
          leaseMs: this.configPositiveInteger(
            "FOMO_V2_ACTIVITY_INGEST_LEASE_MS",
            10 * 60 * 1000
          ),
          schemaVersion: "activity-source-v1",
          options: {
            limit: options.limit,
            force: options.force,
            persistCheckpoint: options.persistCheckpoint,
          },
        });
      }

      const effectiveCursor =
        options.cursor || (options.persistCheckpoint ? run?.cursor : undefined);
      const replayedSourceDocumentIds = new Set<string>();
      let replayHasMore = false;
      let replayRetryableFailures = 0;
      if (run && this.parserImportRuntime) {
        const replayPage = await this.parserImportRuntime.listReplayRequests(
          run,
          this.configPositiveInteger(
            "FOMO_V2_ACTIVITY_INGEST_REPLAY_LIMIT",
            25
          )
        );
        replayHasMore = replayPage.hasMore;
        for (const request of replayPage.requests) {
          await options.executionFence?.assert();
          replayedSourceDocumentIds.add(request.sourceDocumentId);
          let replayDocument: Record<string, any> | undefined;
          let replayReadError: any;
          try {
            replayDocument = await readExactActivitySourceDocument(
              db.collection(collection),
              request.sourceDocumentId,
              options.providerBucket?.filter
            );
            if (!replayDocument) {
              replayReadError = new Error(
                `Requeued activity source document ${request.sourceDocumentId} was not found.`
              );
            }
          } catch (error) {
            replayReadError = error;
          }
          const replayOutcome = await this.processImportedActivityDocument({
            document: replayDocument,
            sourceDocumentId: request.sourceDocumentId,
            // A parser correction starts a new retry generation. The stored
            // hash is only useful when the exact source row cannot be read.
            failurePayloadHash: replayDocument
              ? activityFailurePayloadHash(replayDocument, origin)
              : request.payloadHash,
            schemaVersion: request.schemaVersion || "activity-source-v1",
            preflightError: replayReadError,
            origin,
            force: true,
            replayRequested: true,
            run,
            providerSourceType:
              options.providerBucket?.sourceType || origin,
            write,
            counts,
            errors,
            canonicalCounts,
          });
          if (replayOutcome.retryable) replayRetryableFailures += 1;
          await options.executionFence?.assert();
        }
      }
      // Drain the bounded operator replay queue before the normal cursor page.
      // Otherwise a queued row outside this replay slice could be consumed by
      // the unchanged path and have its forced replay request resolved.
      const page = replayHasMore
        ? {
            documents: [] as Record<string, any>[],
            nextCursor: effectiveCursor,
            hasMore: false,
          }
        : await readActivityPage(
            db.collection(collection),
            origin,
            options.limit,
            effectiveCursor,
            run?.cutoffAt,
            options.providerBucket?.filter
          );
      let retryableFailures = 0;

      for (const document of page.documents) {
        await options.executionFence?.assert();
        const sourceDocumentId = documentId(document);
        if (
          sourceDocumentId &&
          replayedSourceDocumentIds.has(sourceDocumentId)
        ) {
          continue;
        }
        const outcome = await this.processImportedActivityDocument({
          document,
          origin,
          force: options.force,
          replayRequested: false,
          run,
          providerSourceType: options.providerBucket?.sourceType || origin,
          write,
          counts,
          errors,
          canonicalCounts,
        });
        if (outcome.retryable) retryableFailures += 1;
        await options.executionFence?.assert();
      }

      const retryPage = retryableFailures > 0;
      const nextCursor = retryPage
        ? effectiveCursor
        : page.nextCursor || effectiveCursor;
      if (run && options.persistCheckpoint && !retryPage) {
        await options.executionFence?.assert();
        await this.parserImportRuntime?.commitPage(run, {
          cursor: nextCursor,
          counters: counts,
          metadata: {
            canonicalCounts,
            replayHasMore,
            replayRetryableFailures,
          },
        });
        await options.executionFence?.assert();
      }
      if (run) {
        await options.executionFence?.assert();
        await this.parserImportRuntime?.completeRun(run, {
          status: counts.failed > 0 ? "partial" : "completed",
          counters: counts,
          metadata: {
            canonicalCounts,
            retryPage,
            replayHasMore,
            replayRetryableFailures,
          },
        });
        await options.executionFence?.assert();
      }

      return {
        source: origin,
        collection,
        database: db.databaseName,
        cursor: effectiveCursor,
        nextCursor,
        hasMore:
          retryPage ||
          page.hasMore ||
          replayHasMore ||
          replayRetryableFailures > 0,
        counts,
        canonicalCounts,
        errors,
      };
    } catch (error) {
      if (options.executionFence?.isFenceError(error)) throw error;
      if (run) {
        await this.parserImportRuntime?.failRun(run, error, counts);
      }
      throw error;
    }
  }

  private async processImportedActivityDocument(input: {
    document?: Record<string, any>;
    sourceDocumentId?: string;
    failurePayloadHash?: string;
    schemaVersion?: string;
    preflightError?: any;
    origin: FomoV2ActivitySourceOrigin;
    force: boolean;
    replayRequested: boolean;
    run?: FomoV2ParserImportRunHandle;
    providerSourceType: string;
    write: boolean;
    counts: FomoV2ActivityImportCounts;
    errors: Array<{ id?: string; message: string }>;
    canonicalCounts: Record<FomoV2ActivityCanonicalStatus, number>;
  }): Promise<{ retryable: boolean }> {
    const sourceDocumentId =
      input.sourceDocumentId || documentId(input.document);
    const failurePayloadHash =
      input.failurePayloadHash ||
      (input.document
        ? activityFailurePayloadHash(input.document, input.origin)
        : undefined);
    input.counts.scanned += 1;
    try {
      if (input.preflightError) throw input.preflightError;
      if (!input.document) {
        throw new Error("Activity source document is unavailable.");
      }
      const result = await this.stageDocument(input.document, input.origin, {
        force: input.force,
        parserImportRunId: input.run?.runId,
        write: input.write,
        assertLease: input.run
          ? () => this.parserImportRuntime!.heartbeat(input.run!)
          : undefined,
      });
      if (result.skipped === "invalid_source_document") {
        input.counts.skippedInvalid += 1;
        throw new Error("Activity source document failed normalization.");
      }
      if (result.skipped === "unchanged") {
        if (input.run && sourceDocumentId) {
          await this.parserImportRuntime?.heartbeat(input.run);
          await this.parserImportRuntime?.resolveDocumentFailure(
            input.run,
            sourceDocumentId
          );
        }
        input.counts.skippedUnchanged += 1;
        return { retryable: false };
      }
      if (input.run && sourceDocumentId) {
        await this.parserImportRuntime?.heartbeat(input.run);
        await this.parserImportRuntime?.resolveDocumentFailure(
          input.run,
          sourceDocumentId
        );
      }
      input.counts.staged += 1;
      if (result.created) input.counts.created += 1;
      else input.counts.updated += 1;
      const canonicalStatus =
        result.canonicalStatus as FomoV2ActivityCanonicalStatus;
      if (canonicalStatus in input.canonicalCounts) {
        input.canonicalCounts[canonicalStatus] += 1;
      }
      return { retryable: false };
    } catch (error: any) {
      if (error instanceof FomoV2ParserImportLeaseLostError) throw error;
      input.counts.failed += 1;
      let quarantined = false;
      if (input.run && sourceDocumentId) {
        await this.parserImportRuntime?.heartbeat(input.run);
        const failure =
          await this.parserImportRuntime?.recordDocumentFailure(input.run, {
            sourceDocumentId,
            error,
            payloadHash: failurePayloadHash,
            schemaVersion: input.schemaVersion || "activity-source-v1",
            maxAttempts: this.configPositiveInteger(
              "FOMO_V2_ACTIVITY_INGEST_MAX_ATTEMPTS",
              3
            ),
            metadata: {
              origin: input.origin,
              providerSourceType: input.providerSourceType,
              replayRequested: input.replayRequested,
              failureType:
                error?.message ===
                "Activity source document failed normalization."
                  ? "invalid_source_document"
                  : undefined,
              ...activityFailureReviewMetadata(error),
            },
          });
        quarantined = Boolean(failure?.quarantined);
      }
      if (quarantined) input.counts.quarantined += 1;
      if (input.errors.length < 25) {
        input.errors.push({
          id: sourceDocumentId,
          message: safeErrorMessage(error),
        });
      }
      return { retryable: !quarantined };
    }
  }

  private async isAlreadyStaged(
    input: FomoV2ActivityIngestInput,
    payloadHash: string
  ): Promise<boolean> {
    const snapshotIdentity = input.sourceId
      ? {
          source: input.source,
          sourceEntityType: "activity",
          sourceId: input.sourceId,
          payloadHash,
        }
      : {
          sourceEntityKey: [
            input.source,
            "activity",
            input.sourceSlug || input.slug,
          ].join(":"),
          payloadHash,
        };
    const identity: any[] = [];
    const sourceKey = buildActivitySourceKey(input.source, input.sourceId);
    if (sourceKey) identity.push({ sourceKeys: sourceKey });
    if (input.parserActivityId) {
      identity.push({
        parserActivityId: input.parserActivityId,
        sources: { $elemMatch: { source: input.source } },
      });
    }
    if (input.legacyActivityId) {
      identity.push({
        legacyActivityId: String(input.legacyActivityId),
        sources: { $elemMatch: { source: input.source } },
      });
      if (Types.ObjectId.isValid(String(input.legacyActivityId))) {
        identity.push({
          _id: new Types.ObjectId(String(input.legacyActivityId)),
          sources: { $elemMatch: { source: input.source } },
        });
      }
    }
    if (input.legacyNumericId !== undefined) {
      identity.push({
        legacyNumericId: input.legacyNumericId,
        sources: { $elemMatch: { source: input.source } },
      });
    }
    if (!identity.length) {
      identity.push({
        slug: input.slug,
        sources: { $elemMatch: { source: input.source } },
      });
    }

    const snapshot = await this.sourceSnapshotModel.exists(snapshotIdentity);
    if (!snapshot?._id) return false;
    const activity = await this.activityModel
      .findOne({
        $and: [
          { $or: identity },
          { sources: { $elemMatch: { source: input.source } } },
          { sourceSnapshotIds: snapshot._id },
        ],
      })
      .select({
        _id: 1,
        sourceKeys: 1,
        sources: 1,
        "canonicalResolution.status": 1,
      })
      .lean()
      .exec();
    if (activity) {
      const providerSources = activityProviderSources(activity);
      if (providerSources.some((source) => source !== input.source)) {
        throw mixedActivityProviderConflict(
          activity,
          input.source,
          providerSources
        );
      }
      if (activity.canonicalResolution?.status === "unprocessed") {
        return false;
      }
    }
    return Boolean(activity);
  }

  private isEnabled(key: string, defaultValue: boolean): boolean {
    const value = this.configService.get<string>(key);
    if (value === undefined || value === null) return defaultValue;
    const normalized = String(value).trim().toLowerCase();
    if (!normalized || ["false", "0", "off", "no"].includes(normalized)) {
      return false;
    }
    if (["true", "1", "on", "yes"].includes(normalized)) return true;
    this.logger.error(
      `Invalid boolean value for ${key}: "${value}". Scheduled writes stay disabled.`
    );
    return false;
  }

  private configImportLimit(key: string, fallback: number): number {
    const value = Number(this.configService.get<string>(key));
    return Number.isFinite(value) ? boundedLimit(value) : fallback;
  }

  private configPositiveInteger(key: string, fallback: number): number {
    const value = Math.floor(Number(this.configService.get<string>(key)));
    return Number.isFinite(value) && value > 0 ? value : fallback;
  }
}

function createActivityImportExecutionFence(
  callback?: () => void | Promise<void>
): ActivityImportExecutionFence | undefined {
  if (!callback) return undefined;
  let fenceFailed = false;
  let fenceError: unknown;
  return {
    async assert(): Promise<void> {
      try {
        await callback();
      } catch (error) {
        fenceFailed = true;
        fenceError = error;
        throw error;
      }
    },
    isFenceError(error: unknown): boolean {
      return fenceFailed && error === fenceError;
    },
  };
}

export function mapActivityCanonicalResolution(
  result: ResolveCanonicalProjectResult
): FomoV2ActivityCanonicalDecision {
  const candidates = dedupeCandidates([
    ...(result.candidates || []),
    ...(result.canonicalProjectId
      ? [
          {
            canonicalProjectId: result.canonicalProjectId,
            confidence: result.confidence,
            matchedBy: result.matchedBy,
            reason: result.reason,
          },
        ]
      : []),
  ]);

  if (result.verified && result.canonicalProjectId) {
    return {
      canonicalStatus: "verified",
      canonicalProjectId: result.canonicalProjectId,
      canonicalCandidates: candidates,
    };
  }
  if (result.status === "conflict" || candidates.length > 1) {
    return {
      canonicalStatus: "conflict",
      canonicalCandidates: candidates,
    };
  }
  if (candidates.length === 1) {
    return {
      canonicalStatus: "proposed",
      canonicalCandidates: candidates,
    };
  }
  return {
    canonicalStatus: "no_candidates",
    canonicalCandidates: [],
  };
}

function dedupeCandidates(
  candidates: any[]
): FomoV2ActivityCanonicalCandidate[] {
  const byId = new Map<string, FomoV2ActivityCanonicalCandidate>();
  for (const candidate of candidates) {
    const id = String(candidate?.canonicalProjectId || "").trim();
    if (!Types.ObjectId.isValid(id)) continue;
    byId.set(id, {
      canonicalProjectId: id,
      confidence: cleanString(candidate.confidence),
      matchedBy: cleanString(candidate.matchedBy),
      reason: cleanString(candidate.reason),
    });
  }
  return Array.from(byId.values());
}

async function firstExistingCollection(
  db: any,
  candidates: string[]
): Promise<string> {
  const rows = await db
    .listCollections({ name: { $in: candidates } }, { nameOnly: true })
    .toArray();
  const existing = new Set(rows.map((row: any) => row.name));
  const collection = candidates.find((name) => existing.has(name));
  if (!collection) {
    throw new ServiceUnavailableException(
      `Activity source collection not found. Expected one of: ${candidates.join(
        ", "
      )}.`
    );
  }
  return collection;
}

async function discoverActivityProviderBuckets(
  collection: any,
  origin: FomoV2ActivitySourceOrigin
): Promise<ActivityProviderBucket[]> {
  const missingPrimary = missingProviderField("primarySource");
  const missingSource = missingProviderField("source");
  const [primaryValues, sourceValues, unscopedCount] = await Promise.all([
    collection.distinct("primarySource"),
    collection.distinct("source", missingPrimary),
    collection.countDocuments(
      { $and: [missingPrimary, missingSource] },
      { limit: 1 }
    ),
  ]);
  const grouped = new Map<
    string,
    {
      sourceType: string;
      primaryValues: string[];
      sourceValues: string[];
      fallback: boolean;
      discoveryError?: Error;
    }
  >();
  const addValue = (value: any, field: "primarySource" | "source") => {
    const raw = cleanString(value);
    if (!raw) return;
    let sourceType: string;
    let discoveryError: Error | undefined;
    try {
      sourceType = normalizeParserImportSourceType(raw);
    } catch (error: any) {
      sourceType = normalizeProjectSourceType(raw) || raw.toLowerCase();
      discoveryError = new Error(
        `Unsupported activity provider "${raw}": ${safeErrorMessage(error)}`
      );
    }
    const groupingKey = discoveryError
      ? `unsupported:${sourceType}`
      : sourceType;
    const bucket = grouped.get(groupingKey) || {
      sourceType,
      primaryValues: [],
      sourceValues: [],
      fallback: false,
      discoveryError,
    };
    const values =
      field === "primarySource" ? bucket.primaryValues : bucket.sourceValues;
    if (!values.includes(raw)) values.push(raw);
    grouped.set(groupingKey, bucket);
  };

  for (const value of primaryValues || []) addValue(value, "primarySource");
  for (const value of sourceValues || []) addValue(value, "source");
  if (Number(unscopedCount || 0) > 0) {
    const sourceType = normalizeParserImportSourceType(origin);
    const bucket = grouped.get(sourceType) || {
      sourceType,
      primaryValues: [],
      sourceValues: [],
      fallback: false,
    };
    bucket.fallback = true;
    grouped.set(sourceType, bucket);
  }

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, values]) => {
      const clauses: Record<string, any>[] = [];
      if (values.primaryValues.length) {
        clauses.push({ primarySource: { $in: values.primaryValues } });
      }
      if (values.sourceValues.length) {
        clauses.push({
          $and: [missingPrimary, { source: { $in: values.sourceValues } }],
        });
      }
      if (values.fallback) {
        clauses.push({ $and: [missingPrimary, missingSource] });
      }
      return {
        sourceType: values.sourceType,
        filter: clauses.length === 1 ? clauses[0] : { $or: clauses },
        discoveryError: values.discoveryError,
      };
    });
}

function missingProviderField(field: string): Record<string, any> {
  return {
    $or: [
      { [field]: { $exists: false } },
      { [field]: null },
      { [field]: "" },
      { [field]: /^\s*$/ },
    ],
  };
}

function mergeActivityProviderPages(
  origin: FomoV2ActivitySourceOrigin,
  collection: string,
  database: string,
  pages: FomoV2ActivityImportPageResult[]
): FomoV2ActivityImportPageResult {
  const canonicalCounts = emptyCanonicalCounts();
  for (const page of pages) {
    for (const status of Object.keys(canonicalCounts) as Array<
      keyof typeof canonicalCounts
    >) {
      canonicalCounts[status] += page.canonicalCounts[status];
    }
  }
  return {
    source: origin,
    collection,
    database,
    cursor: pages.length === 1 ? pages[0].cursor : undefined,
    nextCursor: pages.length === 1 ? pages[0].nextCursor : undefined,
    hasMore: pages.some((page) => page.hasMore),
    counts: sumCounts(pages.map((page) => page.counts)),
    canonicalCounts,
    errors: pages.flatMap((page) => page.errors).slice(0, 25),
  };
}

function failedActivityPage(
  origin: FomoV2ActivitySourceOrigin,
  collection: string,
  database: string,
  error: any,
  scope: string
): FomoV2ActivityImportPageResult {
  const counts = emptyCounts();
  counts.failed = 1;
  return {
    source: origin,
    collection,
    database,
    hasMore: true,
    counts,
    canonicalCounts: emptyCanonicalCounts(),
    errors: [{ id: scope, message: safeErrorMessage(error) }],
  };
}

async function readActivityPage(
  collection: any,
  origin: FomoV2ActivitySourceOrigin,
  limit: number,
  cursor?: string,
  cutoffAt?: Date,
  providerFilter?: Record<string, any>
): Promise<{
  documents: Record<string, any>[];
  nextCursor?: string;
  hasMore: boolean;
}> {
  const decoded = decodeCursor(cursor);
  if (cursor && !decoded) {
    throw new Error("Invalid activity import cursor.");
  }
  const timestampFields =
    origin === "legacy"
      ? [
          "$lastSyncedAt",
          "$syncMeta.parserUpdatedAt",
          "$updatedAt",
          "$createdAt",
        ]
      : ["$updatedAt", "$createdAt"];
  const fallbackDate = {
    $convert: {
      input: "$_id",
      to: "date",
      onError: new Date(0),
      onNull: new Date(0),
    },
  };
  const cursorDate = {
    $convert: {
      input: { $ifNull: [...timestampFields, fallbackDate] },
      to: "date",
      onError: fallbackDate,
      onNull: fallbackDate,
    },
  };
  const pipeline: Record<string, any>[] = [];
  if (providerFilter) pipeline.push({ $match: providerFilter });
  pipeline.push({ $addFields: { __fomoV2ActivityCursorAt: cursorDate } });
  if (cutoffAt) {
    pipeline.push({
      $match: { __fomoV2ActivityCursorAt: { $lte: cutoffAt } },
    });
  }
  if (decoded) {
    pipeline.push({
      $match: {
        $or: [
          { __fomoV2ActivityCursorAt: { $gt: decoded.at } },
          {
            __fomoV2ActivityCursorAt: decoded.at,
            _id: { $gt: decoded.id },
          },
        ],
      },
    });
  }
  pipeline.push(
    { $sort: { __fomoV2ActivityCursorAt: 1, _id: 1 } },
    { $limit: limit + 1 }
  );
  const rows = await collection
    .aggregate(pipeline, { allowDiskUse: false })
    .toArray();
  const hasMore = rows.length > limit;
  const selected = rows.slice(0, limit);
  const last = selected[selected.length - 1];
  const nextCursor = last
    ? encodeCursor(last.__fomoV2ActivityCursorAt, last._id)
    : cursor;
  for (const row of selected) delete row.__fomoV2ActivityCursorAt;
  return { documents: selected, nextCursor, hasMore };
}

async function readExactActivitySourceDocument(
  collection: any,
  sourceDocumentId: string,
  providerFilter?: Record<string, any>
): Promise<Record<string, any> | undefined> {
  const candidates: any[] = [sourceDocumentId];
  if (Types.ObjectId.isValid(sourceDocumentId)) {
    candidates.push(new Types.ObjectId(sourceDocumentId));
  }
  const idFilter = { _id: { $in: candidates } };
  const filter = providerFilter
    ? { $and: [providerFilter, idFilter] }
    : idFilter;
  const rows = await collection.find(filter).limit(2).toArray();
  if (rows.length > 1) {
    throw new Error(
      `Exact activity replay matched multiple rows for ${sourceDocumentId}.`
    );
  }
  return rows[0];
}

function nextLifecycleStatus(
  currentStatus: string,
  content: Record<string, any> | undefined,
  now: Date
): "active" | "ended" | undefined {
  const start = validDate(content?.startDate)?.getTime();
  const end = validDate(content?.endDate)?.getTime();
  const timestamp = now.getTime();
  if (end !== undefined && end < timestamp) return "ended";
  if (
    currentStatus === "upcoming" &&
    start !== undefined &&
    start <= timestamp
  ) {
    return "active";
  }
  return undefined;
}

function encodeCursor(at: any, id: any): string {
  return Buffer.from(
    JSON.stringify({
      at: new Date(at).toISOString(),
      id: String(id),
    }),
    "utf8"
  ).toString("base64url");
}

function decodeCursor(value?: string): { at: Date; id: any } | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(
      Buffer.from(String(value), "base64url").toString("utf8")
    );
    const at = new Date(parsed.at);
    if (!Number.isFinite(at.getTime()) || !parsed.id) return undefined;
    return {
      at,
      id: Types.ObjectId.isValid(String(parsed.id))
        ? new Types.ObjectId(String(parsed.id))
        : parsed.id,
    };
  } catch (_error) {
    return undefined;
  }
}

function emptyCounts(): FomoV2ActivityImportCounts {
  return {
    scanned: 0,
    staged: 0,
    created: 0,
    updated: 0,
    skippedUnchanged: 0,
    skippedInvalid: 0,
    failed: 0,
    quarantined: 0,
  };
}

function sumCounts(
  values: FomoV2ActivityImportCounts[]
): FomoV2ActivityImportCounts {
  return values.reduce((total, counts) => {
    for (const key of Object.keys(total) as Array<
      keyof FomoV2ActivityImportCounts
    >) {
      total[key] += counts[key];
    }
    return total;
  }, emptyCounts());
}

function emptyCanonicalCounts(): Record<FomoV2ActivityCanonicalStatus, number> {
  return {
    unprocessed: 0,
    proposed: 0,
    verified: 0,
    rejected: 0,
    conflict: 0,
    no_candidates: 0,
  };
}

function boundedLimit(value?: number): number {
  const parsed = Math.floor(Number(value || DEFAULT_IMPORT_LIMIT));
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_IMPORT_LIMIT;
  return Math.min(MAX_IMPORT_LIMIT, parsed);
}

function boundedSnapshotLimit(value?: number): number {
  const parsed = Math.floor(Number(value || DEFAULT_IMPORT_LIMIT));
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_IMPORT_LIMIT;
  return Math.min(100_000, parsed);
}

function cleanString(value: any): string | undefined {
  const text = String(value || "").trim();
  return text || undefined;
}

function activityFailurePayloadHash(
  document: Record<string, any>,
  origin: FomoV2ActivitySourceOrigin
): string {
  const normalized = normalizeActivitySourceDocument(document, origin);
  if (normalized) {
    const source = normalizeProjectSourceType(normalized.ingestInput.source);
    if (source) normalized.ingestInput.source = source;
    return hashActivityPayload(activitySemanticPayload(normalized.ingestInput));
  }
  const rawPayload = { ...document };
  delete rawPayload.__fomoV2ActivityCursorAt;
  return hashActivityPayload({ origin, rawPayload });
}

function activityFailureReviewMetadata(error: any): Record<string, any> {
  const response =
    typeof error?.getResponse === "function" ? error.getResponse() : undefined;
  if (!response || typeof response !== "object") {
    return {
      failureCode: error?.code,
      reviewRequired: Boolean(error?.reviewRequired),
      reviewMetadata: error?.metadata,
    };
  }
  return {
    failureCode: response.code,
    reviewRequired: Boolean(response.reviewRequired),
    reviewMetadata: response.metadata,
  };
}

function activityProviderSources(activity: any): string[] {
  const sources = (activity?.sources || []).map((entry: any) =>
    normalizeProjectSourceType(entry?.source)
  );
  const sourceKeys = (activity?.sourceKeys || []).map((key: any) =>
    normalizeProjectSourceType(String(key || "").split(":", 1)[0])
  );
  return Array.from(new Set([...sources, ...sourceKeys].filter(Boolean)));
}

function mixedActivityProviderConflict(
  activity: any,
  incomingSource: string,
  existingSources = activityProviderSources(activity)
): ConflictException {
  return new ConflictException({
    message:
      "Activity aggregate contains identities from multiple parser providers and cannot be updated automatically.",
    code: "ACTIVITY_MIXED_PROVIDER_AGGREGATE",
    reviewRequired: true,
    metadata: {
      action: "controlled_split_backfill",
      activityId: activity?._id ? String(activity._id) : undefined,
      incomingSource,
      existingSources,
    },
  });
}

function documentId(value: any): string | undefined {
  return cleanString(value?._id || value?.parserActivityId || value?.id);
}

function safeErrorMessage(error: any): string {
  return String(error?.message || error?.code || "Unknown import error").slice(
    0,
    500
  );
}

function validDate(value: any): Date | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}
