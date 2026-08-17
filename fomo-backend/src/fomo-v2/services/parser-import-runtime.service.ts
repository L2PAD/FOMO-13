import { ConflictException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomBytes, randomUUID } from "crypto";
import { hostname } from "os";
import { Model, Types } from "mongoose";
import {
  FomoV2ParserImportCheckpoint,
  FomoV2ParserImportCheckpointDocument,
  FomoV2ParserImportFailure,
  FomoV2ParserImportFailureDocument,
  FomoV2ParserImportRun,
  FomoV2ParserImportRunStatus,
} from "../models";
import {
  normalizeProjectDomain,
  normalizeProjectSourceType,
} from "../shared/source-policy/helpers";

const DEFAULT_LEASE_MS = 2 * 60 * 1000;
const MIN_LEASE_MS = 10 * 1000;
const MAX_LEASE_MS = 30 * 60 * 1000;
const DEFAULT_MAX_ATTEMPTS = 3;
const MAX_ERROR_SAMPLES = 25;

/**
 * Runtime identities are deliberately closed: accepting an arbitrary spelling
 * would silently create a second checkpoint and retry budget for one provider.
 * Operational sources keep legacy/manual callers compatible.
 */
export const FOMO_V2_PARSER_IMPORT_SOURCE_TYPES = [
  "dropstab",
  "icodrops",
  "intel",
  "intel_fundraising",
  "coingecko",
  "cryptorank",
  "coinmarketcap",
  "legacy",
  "parser",
  "system",
  "manual",
] as const;

export interface FomoV2ParserImportIdentity {
  pipeline: string;
  sourceType: string;
  sourceDatabase: string;
  sourceCollection: string;
}

export interface StartFomoV2ParserImportRunInput
  extends FomoV2ParserImportIdentity {
  dryRun: boolean;
  cursor?: string;
  cutoffAt?: Date;
  leaseMs?: number;
  leaseOwner?: string;
  runKey?: string;
  schemaVersion?: string;
  resolverVersion?: string;
  options?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface FomoV2ParserImportRunHandle
  extends FomoV2ParserImportIdentity {
  runId: string;
  runKey: string;
  checkpointId: string;
  leaseOwner: string;
  leaseMs: number;
  cursor?: string;
  cutoffAt: Date;
}

export interface FomoV2ParserImportDocumentFailureResult {
  attempts: number;
  quarantined: boolean;
}

export interface FomoV2ParserImportFailureQuery
  extends FomoV2ParserImportIdentity {
  sourceDocumentId?: string;
  status?: "retrying" | "quarantined" | "resolved";
  limit?: number;
}

export interface FomoV2ParserImportReplayRequest {
  sourceDocumentId: string;
  payloadHash?: string;
  schemaVersion?: string;
  replayRequestedAt?: Date;
}

export interface FomoV2ParserImportReplayRequestPage {
  requests: FomoV2ParserImportReplayRequest[];
  hasMore: boolean;
}

export class FomoV2ParserImportLeaseLostError extends ConflictException {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Shared operational boundary for parser imports. Domain identity stays in the
 * domain importers; this service only owns source-scoped run state, leases,
 * durable cursors, and poison-document quarantine.
 */
@Injectable()
export class FomoV2ParserImportRuntimeService {
  private indexPreflight?: Promise<void>;

  constructor(
    @InjectModel(FomoV2ParserImportRun.name)
    private readonly runModel: Model<FomoV2ParserImportRun>,
    @InjectModel(FomoV2ParserImportCheckpoint.name)
    private readonly checkpointModel: Model<FomoV2ParserImportCheckpoint>,
    @InjectModel(FomoV2ParserImportFailure.name)
    private readonly failureModel: Model<FomoV2ParserImportFailure>
  ) {}

  async startRun(
    input: StartFomoV2ParserImportRunInput
  ): Promise<FomoV2ParserImportRunHandle> {
    const identity = normalizeIdentity(input);
    await this.ensureRuntimeIndexes();
    const now = new Date();
    const cutoffAt = validDate(input.cutoffAt) || now;
    const leaseMs = boundedLeaseMs(input.leaseMs);
    const leaseOwner =
      cleanText(input.leaseOwner, 300) ||
      `${hostname()}:${process.pid}:${randomUUID()}`;
    const runId = new Types.ObjectId();
    const runKey =
      cleanText(input.runKey, 500) ||
      `${identity.pipeline}:${
        identity.sourceType
      }:${now.toISOString()}:${randomBytes(4).toString("hex")}`;

    const checkpoint = await this.acquireCheckpoint({
      ...identity,
      runId,
      leaseOwner,
      leaseExpiresAt: new Date(now.getTime() + leaseMs),
      initialCursor: cleanText(input.cursor, 4_000),
      now,
    });
    const cursor = cleanText(input.cursor, 4_000) || checkpoint.cursor;

    try {
      await this.runModel.create({
        _id: runId,
        runKey,
        ...identity,
        status: "running",
        dryRun: Boolean(input.dryRun),
        startedAt: now,
        cutoffAt,
        cursorStart: cursor,
        leaseOwner,
        heartbeatAt: now,
        schemaVersion: cleanText(input.schemaVersion, 200),
        resolverVersion: cleanText(input.resolverVersion, 200),
        options: input.options || {},
        counters: {},
        errorSamples: [],
        metadata: input.metadata || {},
      });
    } catch (error) {
      await this.releaseLease(checkpoint._id, runId, leaseOwner);
      throw error;
    }

    return {
      ...identity,
      runId: runId.toHexString(),
      runKey,
      checkpointId: toIdString(checkpoint._id),
      leaseOwner,
      leaseMs,
      cursor,
      cutoffAt,
    };
  }

  async heartbeat(handle: FomoV2ParserImportRunHandle): Promise<void> {
    const now = new Date();
    const leaseExpiresAt = new Date(now.getTime() + handle.leaseMs);
    const result = await this.checkpointModel
      .updateOne(this.ownedCheckpointFilter(handle), {
        $set: { leaseExpiresAt, lastRunAt: now },
      })
      .exec();
    this.requireMatchedLease(result, handle);
    await this.runModel
      .updateOne(
        { _id: handle.runId, status: "running" },
        { $set: { heartbeatAt: now } }
      )
      .exec();
  }

  async assertLease(handle: FomoV2ParserImportRunHandle): Promise<void> {
    const lease = await this.checkpointModel
      .exists(this.ownedCheckpointFilter(handle))
      .exec();
    if (lease) return;
    throw new FomoV2ParserImportLeaseLostError(
      `Parser import lease was lost for ${handle.pipeline}/${handle.sourceType}/${handle.sourceCollection}.`
    );
  }

  async commitPage(
    handle: FomoV2ParserImportRunHandle,
    input: {
      cursor?: string;
      counters?: Record<string, any>;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    const now = new Date();
    const cursor = cleanText(input.cursor, 4_000);
    const checkpointSet: Record<string, any> = {
      leaseExpiresAt: new Date(now.getTime() + handle.leaseMs),
      lastRunAt: now,
      lastRunId: new Types.ObjectId(handle.runId),
      cutoffAt: handle.cutoffAt,
    };
    if (cursor) checkpointSet.cursor = cursor;

    const checkpointResult = await this.checkpointModel
      .updateOne(this.ownedCheckpointFilter(handle), {
        $set: checkpointSet,
      })
      .exec();
    this.requireMatchedLease(checkpointResult, handle);

    const runSet: Record<string, any> = {
      heartbeatAt: now,
      counters: input.counters || {},
    };
    if (cursor) runSet.cursorEnd = cursor;
    if (input.metadata) runSet.metadata = input.metadata;
    await this.runModel
      .updateOne({ _id: handle.runId }, { $set: runSet })
      .exec();
    if (cursor) handle.cursor = cursor;
  }

  async recordDocumentFailure(
    handle: FomoV2ParserImportRunHandle,
    input: {
      sourceDocumentId: string;
      error: any;
      maxAttempts?: number;
      payloadHash?: string;
      schemaVersion?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<FomoV2ParserImportDocumentFailureResult> {
    await this.assertLease(handle);
    const sourceDocumentId = requiredText(
      input.sourceDocumentId,
      "sourceDocumentId",
      1_000
    );
    const maxAttempts = boundedMaxAttempts(input.maxAttempts);
    const now = new Date();
    const identity = {
      pipeline: handle.pipeline,
      sourceType: handle.sourceType,
      sourceDatabase: handle.sourceDatabase,
      sourceCollection: handle.sourceCollection,
      sourceDocumentId,
    };
    const errorMessage = safeErrorMessage(input.error);
    const errorStack = cleanText(input.error?.stack, 8_000);
    const payloadHash = cleanText(input.payloadHash, 500);
    const schemaVersion = cleanText(input.schemaVersion, 200);

    // Quarantine is scoped to a semantic payload generation. Once the parser
    // emits a changed payload/schema, retry it from attempt one even if the
    // previous generation exhausted its budget.
    if (payloadHash || schemaVersion) {
      const previous = await this.failureModel
        .findOne(identity)
        .select({ _id: 1, payloadHash: 1, schemaVersion: 1 })
        .lean()
        .exec();
      if (
        previous &&
        ((payloadHash && previous.payloadHash !== payloadHash) ||
          (schemaVersion && previous.schemaVersion !== schemaVersion))
      ) {
        await this.assertLease(handle);
        await this.failureModel
          .updateOne(
            { _id: previous._id },
            {
              $set: {
                attempts: 0,
                status: "retrying",
                firstFailedAt: now,
                payloadHash,
                schemaVersion,
              },
              $unset: { resolvedAt: "", errorStack: "" },
            }
          )
          .exec();
      }
    }
    const update = {
      $setOnInsert: {
        ...identity,
        firstFailedAt: now,
      },
      $set: {
        status: "retrying",
        lastRunId: new Types.ObjectId(handle.runId),
        lastFailedAt: now,
        errorMessage,
        errorStack,
        payloadHash,
        schemaVersion,
        metadata: input.metadata || {},
      },
      $inc: { attempts: 1 },
      $unset: { resolvedAt: "" },
    };

    let failure: FomoV2ParserImportFailureDocument;
    try {
      failure = await this.failureModel
        .findOneAndUpdate(identity, update, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        })
        .exec();
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      failure = await this.failureModel
        .findOneAndUpdate(identity, update, { new: true })
        .exec();
    }

    const attempts = Number(failure?.attempts || 1);
    const quarantined = attempts >= maxAttempts;
    if (quarantined && failure?.status !== "quarantined") {
      await this.failureModel
        .updateOne({ _id: failure._id }, { $set: { status: "quarantined" } })
        .exec();
    }

    await this.runModel
      .updateOne(
        { _id: handle.runId, status: "running" },
        {
          $inc: { "counters.failed": 1 },
          $push: {
            errorSamples: {
              $each: [
                {
                  sourceDocumentId,
                  errorMessage,
                  attempts,
                  quarantined,
                  failedAt: now,
                },
              ],
              $slice: -MAX_ERROR_SAMPLES,
            },
          },
        }
      )
      .exec();

    return { attempts, quarantined };
  }

  async resolveDocumentFailure(
    handle: FomoV2ParserImportRunHandle,
    sourceDocumentId: string
  ): Promise<void> {
    await this.assertLease(handle);
    const id = cleanText(sourceDocumentId, 1_000);
    if (!id) return;
    await this.failureModel
      .updateOne(
        {
          pipeline: handle.pipeline,
          sourceType: handle.sourceType,
          sourceDatabase: handle.sourceDatabase,
          sourceCollection: handle.sourceCollection,
          sourceDocumentId: id,
        },
        {
          $set: {
            status: "resolved",
            resolvedAt: new Date(),
            attempts: 0,
            errorMessage: "",
            metadata: {},
          },
          $unset: { errorStack: "", replayRequestedAt: "" },
        }
      )
      .exec();
  }

  async listDocumentFailures(
    input: FomoV2ParserImportFailureQuery
  ): Promise<Record<string, any>[]> {
    const identity = normalizeIdentity(input);
    const filter: Record<string, any> = { ...identity };
    const sourceDocumentId = cleanText(input.sourceDocumentId, 1_000);
    if (sourceDocumentId) filter.sourceDocumentId = sourceDocumentId;
    if (input.status) filter.status = input.status;
    const limit = boundedRecoveryLimit(input.limit);
    return this.failureModel
      .find(filter)
      .sort({ lastFailedAt: -1, _id: -1 })
      .limit(limit)
      .lean()
      .exec() as unknown as Promise<Record<string, any>[]>;
  }

  async listReplayRequests(
    handle: FomoV2ParserImportRunHandle,
    limit = 25
  ): Promise<FomoV2ParserImportReplayRequestPage> {
    await this.assertLease(handle);
    const boundedLimit = boundedReplayLimit(limit);
    const rows = (await this.failureModel
      .find({
        pipeline: handle.pipeline,
        sourceType: handle.sourceType,
        sourceDatabase: handle.sourceDatabase,
        sourceCollection: handle.sourceCollection,
        status: "retrying",
        replayRequestedAt: { $exists: true },
      })
      .sort({ replayRequestedAt: 1, _id: 1 })
      .limit(boundedLimit + 1)
      .select({
        _id: 0,
        sourceDocumentId: 1,
        payloadHash: 1,
        schemaVersion: 1,
        replayRequestedAt: 1,
      })
      .lean()
      .exec()) as unknown as FomoV2ParserImportReplayRequest[];
    return {
      requests: rows.slice(0, boundedLimit),
      hasMore: rows.length > boundedLimit,
    };
  }

  async requeueDocumentFailure(
    input: FomoV2ParserImportIdentity & { sourceDocumentId: string }
  ): Promise<Record<string, any>> {
    const identity = normalizeIdentity(input);
    const sourceDocumentId = requiredText(
      input.sourceDocumentId,
      "sourceDocumentId",
      1_000
    );
    await this.ensureRuntimeIndexes();
    const now = new Date();
    const operationId = new Types.ObjectId();
    const operationOwner = `failure-requeue:${randomUUID()}`;
    const checkpoint = await this.checkpointModel
      .findOneAndUpdate(
        {
          ...identity,
          $or: [
            { leaseExpiresAt: { $lte: now } },
            { leaseExpiresAt: { $exists: false } },
            { leaseExpiresAt: null },
          ],
        },
        {
          $set: {
            activeRunId: operationId,
            leaseOwner: operationOwner,
            leaseExpiresAt: new Date(now.getTime() + 30_000),
            lastRunAt: now,
          },
        },
        { new: false }
      )
      .exec();
    if (!checkpoint) {
      throw new ConflictException(
        `Cannot requeue ${identity.pipeline}/${identity.sourceType}/${sourceDocumentId} while its import lease is active.`
      );
    }
    try {
      const failure = await this.failureModel
        .findOneAndUpdate(
          { ...identity, sourceDocumentId },
          {
            $set: {
              status: "retrying",
              attempts: 0,
              replayRequestedAt: now,
              "metadata.requeuedAt": now,
              "metadata.requeueMode": "operator",
            },
            $unset: { resolvedAt: "" },
          },
          { new: true }
        )
        .lean()
        .exec();
      if (!failure) {
        throw new Error(
          `Parser import failure not found for ${identity.pipeline}/${identity.sourceType}/${sourceDocumentId}.`
        );
      }
      return failure as unknown as Record<string, any>;
    } finally {
      await this.releaseLease(
        checkpoint._id as Types.ObjectId,
        operationId,
        operationOwner
      );
    }
  }

  private ensureRuntimeIndexes(): Promise<void> {
    if (!this.indexPreflight) {
      this.indexPreflight = this.verifyRuntimeIndexes().catch((error) => {
        // A controlled migration may be completed while the process stays up;
        // let the next cron tick re-check instead of caching a rejection.
        this.indexPreflight = undefined;
        throw error;
      });
    }
    return this.indexPreflight;
  }

  private async verifyRuntimeIndexes(): Promise<void> {
    let checkpointIndexes: any[];
    let failureIndexes: any[];
    try {
      [checkpointIndexes, failureIndexes] = await Promise.all([
        this.checkpointModel.collection.indexes(),
        this.failureModel.collection.indexes(),
      ]);
    } catch (error: any) {
      throw new Error(
        `Parser import runtime index preflight failed: ${safeErrorMessage(
          error
        )}. Run the controlled FOMO v2 index migration before starting imports.`
      );
    }
    const requirements = [
      {
        name: "uniq_parser_import_checkpoints_source",
        indexes: checkpointIndexes,
        key: {
          pipeline: 1,
          sourceType: 1,
          sourceDatabase: 1,
          sourceCollection: 1,
        },
      },
      {
        name: "uniq_parser_import_failures_source_document",
        indexes: failureIndexes,
        key: {
          pipeline: 1,
          sourceType: 1,
          sourceDatabase: 1,
          sourceCollection: 1,
          sourceDocumentId: 1,
        },
      },
    ];
    const missing = requirements
      .filter(
        ({ name, indexes, key }) =>
          !(indexes || []).some(
            (index: any) =>
              index?.name === name &&
              index?.unique === true &&
              index?.partialFilterExpression === undefined &&
              sameIndexKey(index?.key, key)
          )
      )
      .map(({ name }) => name);
    if (missing.length) {
      throw new Error(
        `Parser import runtime requires unique indexes: ${missing.join(
          ", "
        )}. Run the controlled FOMO v2 index migration before starting imports.`
      );
    }

    const replayQueueIndex = (failureIndexes || []).some(
      (index: any) =>
        index?.name === "idx_parser_import_failures_replay_queue" &&
        index?.unique !== true &&
        sameIndexKey(index?.key, {
          pipeline: 1,
          sourceType: 1,
          sourceDatabase: 1,
          sourceCollection: 1,
          status: 1,
          replayRequestedAt: 1,
          _id: 1,
        }) &&
        JSON.stringify(index?.partialFilterExpression || null) ===
          JSON.stringify({
            status: "retrying",
            replayRequestedAt: { $exists: true },
          })
    );
    if (!replayQueueIndex) {
      throw new Error(
        "Parser import runtime requires index idx_parser_import_failures_replay_queue. Run the controlled FOMO v2 index migration before starting imports."
      );
    }
  }

  async completeRun(
    handle: FomoV2ParserImportRunHandle,
    input: {
      status?: Extract<FomoV2ParserImportRunStatus, "completed" | "partial">;
      counters?: Record<string, any>;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    const status = input.status || "completed";
    const now = new Date();
    const checkpointSet: Record<string, any> = {
      lastRunId: new Types.ObjectId(handle.runId),
      lastRunAt: now,
    };
    if (status === "completed") {
      checkpointSet.lastCompletedRunId = new Types.ObjectId(handle.runId);
    }
    const releaseResult = await this.checkpointModel
      .updateOne(this.ownedCheckpointFilter(handle), {
        $set: checkpointSet,
        $unset: {
          leaseOwner: "",
          leaseExpiresAt: "",
          activeRunId: "",
        },
      })
      .exec();
    this.requireMatchedLease(releaseResult, handle);
    await this.runModel
      .updateOne(
        { _id: handle.runId },
        {
          $set: {
            status,
            finishedAt: now,
            counters: input.counters || {},
            metadata: input.metadata || {},
          },
        }
      )
      .exec();
  }

  async failRun(
    handle: FomoV2ParserImportRunHandle,
    error: any,
    counters: Record<string, any> = {}
  ): Promise<void> {
    const now = new Date();
    await this.releaseLease(
      new Types.ObjectId(handle.checkpointId),
      new Types.ObjectId(handle.runId),
      handle.leaseOwner
    );
    await this.runModel
      .updateOne(
        { _id: handle.runId, status: "running" },
        {
          $set: {
            status: "failed",
            finishedAt: now,
            counters,
          },
          $push: {
            errorSamples: {
              $each: [
                {
                  errorMessage: safeErrorMessage(error),
                  failedAt: now,
                },
              ],
              $slice: -MAX_ERROR_SAMPLES,
            },
          },
        }
      )
      .exec();
  }

  private async acquireCheckpoint(input: {
    pipeline: string;
    sourceType: string;
    sourceDatabase: string;
    sourceCollection: string;
    runId: Types.ObjectId;
    leaseOwner: string;
    leaseExpiresAt: Date;
    initialCursor?: string;
    now: Date;
  }): Promise<FomoV2ParserImportCheckpointDocument> {
    const identity = {
      pipeline: input.pipeline,
      sourceType: input.sourceType,
      sourceDatabase: input.sourceDatabase,
      sourceCollection: input.sourceCollection,
    };
    const filter = {
      ...identity,
      $or: [
        { leaseExpiresAt: { $lte: input.now } },
        { leaseExpiresAt: { $exists: false } },
        { leaseExpiresAt: null },
      ],
    };
    const lease = {
      leaseOwner: input.leaseOwner,
      leaseExpiresAt: input.leaseExpiresAt,
      activeRunId: input.runId,
      lastRunAt: input.now,
    };
    let checkpoint = await this.checkpointModel
      .findOneAndUpdate(filter, { $set: lease }, { new: false })
      .exec();
    if (checkpoint) {
      await this.markExpiredRunAbandoned(checkpoint, input);
      return checkpoint;
    }

    try {
      checkpoint = await this.checkpointModel.create({
        ...identity,
        cursor: input.initialCursor,
        ...lease,
      });
      return checkpoint;
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      checkpoint = await this.checkpointModel
        .findOneAndUpdate(filter, { $set: lease }, { new: false })
        .exec();
      if (checkpoint) {
        await this.markExpiredRunAbandoned(checkpoint, input);
        return checkpoint;
      }
    }

    throw new ConflictException(
      `Parser import lease is already held for ${input.pipeline}/${input.sourceType}/${input.sourceCollection}.`
    );
  }

  private async markExpiredRunAbandoned(
    checkpoint: FomoV2ParserImportCheckpointDocument,
    input: {
      runId: Types.ObjectId;
      leaseOwner: string;
      now: Date;
    }
  ): Promise<void> {
    const previousRunId = checkpoint.activeRunId;
    if (!previousRunId || String(previousRunId) === input.runId.toHexString()) {
      return;
    }
    try {
      await this.runModel
        .updateOne(
          { _id: previousRunId, status: "running" },
          {
            $set: {
              status: "abandoned",
              finishedAt: input.now,
              "metadata.reason": "lease_expired",
              "metadata.takenOverByRunId": input.runId.toHexString(),
            },
            $push: {
              errorSamples: {
                $each: [
                  {
                    reason: "lease_expired",
                    takenOverByRunId: input.runId.toHexString(),
                    failedAt: input.now,
                  },
                ],
                $slice: -MAX_ERROR_SAMPLES,
              },
            },
          }
        )
        .exec();
    } catch (error) {
      // Do not leave a lease owned by a run that was never created when the
      // audit transition itself cannot be persisted.
      await this.releaseLease(
        checkpoint._id as Types.ObjectId,
        input.runId,
        input.leaseOwner
      );
      throw error;
    }
  }

  private ownedCheckpointFilter(handle: FomoV2ParserImportRunHandle) {
    return {
      _id: new Types.ObjectId(handle.checkpointId),
      leaseOwner: handle.leaseOwner,
      activeRunId: new Types.ObjectId(handle.runId),
      leaseExpiresAt: { $gt: new Date() },
    };
  }

  private requireMatchedLease(
    result: { matchedCount?: number; n?: number },
    handle: FomoV2ParserImportRunHandle
  ): void {
    if (Number(result?.matchedCount ?? result?.n ?? 0) > 0) return;
    throw new FomoV2ParserImportLeaseLostError(
      `Parser import lease was lost for ${handle.pipeline}/${handle.sourceType}/${handle.sourceCollection}.`
    );
  }

  private async releaseLease(
    checkpointId: Types.ObjectId,
    runId: Types.ObjectId,
    leaseOwner: string
  ): Promise<void> {
    await this.checkpointModel
      .updateOne(
        {
          _id: checkpointId,
          activeRunId: runId,
          leaseOwner,
        },
        {
          $unset: {
            leaseOwner: "",
            leaseExpiresAt: "",
            activeRunId: "",
          },
        }
      )
      .exec();
  }
}

function normalizeIdentity(
  input: FomoV2ParserImportIdentity
): FomoV2ParserImportIdentity {
  const pipeline = normalizeProjectDomain(input.pipeline);
  const sourceType = normalizeParserImportSourceType(input.sourceType);
  if (!pipeline) throw new Error("Parser import pipeline is required.");
  return {
    pipeline,
    sourceType,
    sourceDatabase: requiredText(input.sourceDatabase, "sourceDatabase", 500),
    sourceCollection: requiredText(
      input.sourceCollection,
      "sourceCollection",
      500
    ),
  };
}

export function normalizeParserImportSourceType(value: any): string {
  const sourceType = normalizeProjectSourceType(value);
  if (!sourceType) throw new Error("Parser import sourceType is required.");
  if (
    !(FOMO_V2_PARSER_IMPORT_SOURCE_TYPES as readonly string[]).includes(
      sourceType
    )
  ) {
    throw new Error(
      `Unsupported parser import sourceType "${value}". Allowed sources: ${FOMO_V2_PARSER_IMPORT_SOURCE_TYPES.join(
        ", "
      )}.`
    );
  }
  return sourceType;
}

function boundedLeaseMs(value?: number): number {
  const parsed = Math.floor(Number(value || DEFAULT_LEASE_MS));
  if (!Number.isFinite(parsed)) return DEFAULT_LEASE_MS;
  return Math.min(MAX_LEASE_MS, Math.max(MIN_LEASE_MS, parsed));
}

function boundedMaxAttempts(value?: number): number {
  const parsed = Math.floor(Number(value || DEFAULT_MAX_ATTEMPTS));
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_MAX_ATTEMPTS;
  return Math.min(100, parsed);
}

function boundedRecoveryLimit(value?: number): number {
  const parsed = Math.floor(Number(value || 50));
  if (!Number.isFinite(parsed) || parsed < 1) return 50;
  return Math.min(100, parsed);
}

function boundedReplayLimit(value?: number): number {
  const parsed = Math.floor(Number(value || 25));
  if (!Number.isFinite(parsed) || parsed < 1) return 25;
  return Math.min(50, parsed);
}

function validDate(value?: Date): Date | undefined {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : undefined;
}

function requiredText(value: any, field: string, maxLength: number): string {
  const text = cleanText(value, maxLength);
  if (!text) throw new Error(`Parser import ${field} is required.`);
  return text;
}

function cleanText(value: any, maxLength: number): string | undefined {
  const text = String(value || "").trim();
  return text ? text.slice(0, maxLength) : undefined;
}

function safeErrorMessage(error: any): string {
  return String(
    error?.message || error?.code || error || "Unknown error"
  ).slice(0, 1_000);
}

function sameIndexKey(
  actual: Record<string, any> | undefined,
  expected: Record<string, number>
): boolean {
  if (!actual || typeof actual !== "object") return false;
  const actualEntries = Object.entries(actual);
  const expectedEntries = Object.entries(expected);
  return (
    actualEntries.length === expectedEntries.length &&
    expectedEntries.every(
      ([field, direction], index) =>
        actualEntries[index]?.[0] === field &&
        Number(actualEntries[index]?.[1]) === direction
    )
  );
}

function toIdString(value: any): string {
  if (!value) return "";
  if (typeof value.toHexString === "function") return value.toHexString();
  return String(value);
}
