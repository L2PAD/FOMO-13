import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { ConfigService } from "@nestjs/config";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Queue } from "bull";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { createReadStream, createWriteStream, existsSync } from "fs";
import { mkdir, rename, rm, stat } from "fs/promises";
import { once } from "events";
import * as os from "os";
import * as path from "path";
import { PassThrough, Transform } from "stream";
import { pipeline } from "stream/promises";
import { createGzip } from "zlib";
import { Connection, Model, Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { ADMIN_AI_CONNECTION_NAME } from "./admin-ai-chat.constants";
import { AdminAiChatConfigService } from "./admin-ai-chat-config.service";
import {
  ADMIN_AI_EXPORT_JOB,
  ADMIN_AI_EXPORT_QUEUE,
} from "./admin-ai-export.constants";
import {
  AdminAiChatArtifact,
  AdminAiChatArtifactDocument,
} from "./models/admin-ai-chat-artifact.model";
import { AdminAiToolExecutionContext } from "./fomo-v2-context/fomo-v2-ai-types";

export type AdminAiExportFormat = "json" | "jsonl";
export type AdminAiExportCompression = "none" | "gzip";

type CreateExportInput = {
  kind: "collection" | "vesting_reviews";
  collectionName: string;
  spec: Record<string, unknown>;
  format?: AdminAiExportFormat;
  compression?: AdminAiExportCompression;
  filenamePrefix?: string;
};

const FORBIDDEN_COLLECTION_PATTERN =
  /(^system\.|\$|\0|fomo_prod|fomo_live|fomo_market|prod|production|live)/i;
const SENSITIVE_COLLECTION_PATTERN =
  /(^|[_-])(users?|sessions?|auth|passwords?|wallets?|admin_ai_chat|ai_admin_tool_runs)([_-]|$)/i;
const FORBIDDEN_MONGO_KEYS = new Set([
  "$where",
  "$function",
  "$accumulator",
  "$out",
  "$merge",
]);

@Injectable()
export class AdminAiExportService {
  private readonly logger = new Logger(AdminAiExportService.name);

  constructor(
    @InjectModel(AdminAiChatArtifact.name, ADMIN_AI_CONNECTION_NAME)
    private readonly artifactModel: Model<AdminAiChatArtifactDocument>,
    @InjectConnection(ADMIN_AI_CONNECTION_NAME)
    private readonly adminConnection: Connection,
    @InjectQueue(ADMIN_AI_EXPORT_QUEUE)
    private readonly exportQueue: Queue,
    private readonly configService: ConfigService,
    private readonly adminAiConfig: AdminAiChatConfigService
  ) {}

  async createExport(input: CreateExportInput, context: AdminAiToolExecutionContext) {
    this.adminAiConfig.ensureAiToolDbAccess({
      dbName: this.adminAiConfig.getDbName(),
      access: "read",
      accessMode: context.accessMode,
    });
    // Fail before queueing when the eventual download URL cannot be signed.
    this.signingSecret();

    const createdBy = this.objectId(context.userId, "Admin export requires userId");
    const threadId = this.objectId(context.chatId, "Admin export requires chatId");
    const requestMessageId = this.objectId(
      context.messageId,
      "Admin export requires messageId"
    );
    const collectionName = this.safeCollectionName(input.collectionName);
    this.assertSafeSpec(input.spec);

    const format: AdminAiExportFormat = input.format === "json" ? "json" : "jsonl";
    const compression: AdminAiExportCompression =
      input.compression === "none" ? "none" : "gzip";
    const expiresAt = new Date(Date.now() + this.artifactTtlMs());
    const filename = this.buildFilename(
      input.filenamePrefix || collectionName,
      format,
      compression
    );

    const artifact = await this.artifactModel.create({
      threadId,
      requestMessageId,
      createdBy,
      kind: input.kind,
      dbTarget: this.adminAiConfig.getDbName(),
      collectionName,
      spec: input.spec,
      format,
      compression,
      filename,
      status: "queued",
      expiresAt,
      contentType:
        compression === "gzip"
          ? "application/gzip"
          : format === "jsonl"
            ? "application/x-ndjson"
            : "application/json",
    });

    try {
      await this.exportQueue.add(
        ADMIN_AI_EXPORT_JOB,
        { artifactId: String(artifact._id) },
        {
          jobId: `admin-ai-export:${artifact._id}`,
          attempts: 2,
          backoff: { type: "exponential", delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 100,
        }
      );
    } catch (error: any) {
      await this.artifactModel.updateOne(
        { _id: artifact._id },
        {
          $set: {
            status: "failed",
            errorCode: "EXPORT_QUEUE_UNAVAILABLE",
            errorMessage: "JSON export queue is unavailable",
            completedAt: new Date(),
          },
        }
      );
      this.logger.warn(`Failed to queue Admin AI export: ${error?.name || "QueueError"}`);
      throw new ServiceUnavailableException("JSON export queue is unavailable");
    }

    void this.cleanupExpiredArtifacts();
    return this.toDescriptor(artifact.toObject());
  }

  async getArtifactForAdmin(adminId: string, artifactId: string) {
    const artifact = await this.artifactModel
      .findOne({
        _id: this.objectId(artifactId, "Invalid artifact id"),
        createdBy: this.objectId(adminId, "Invalid admin id"),
      })
      .lean();
    if (!artifact) throw new NotFoundException("Export artifact not found");
    if (new Date(artifact.expiresAt).getTime() <= Date.now()) {
      throw new NotFoundException("Export artifact has expired");
    }
    return this.toDescriptor(artifact, true);
  }

  async getDownload(artifactId: string, expires: string, signature: string) {
    const artifactObjectId = this.objectId(artifactId, "Invalid artifact id");
    const expiresAt = Number(expires);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now() || expiresAt > Date.now() + 15 * 60_000) {
      throw new BadRequestException("Download link has expired");
    }
    const expected = this.downloadSignature(artifactId, expiresAt);
    if (!this.safeSignatureEquals(expected, signature)) {
      throw new BadRequestException("Invalid download signature");
    }

    const artifact = await this.artifactModel.findById(artifactObjectId).lean();
    if (!artifact || artifact.status !== "ready" || !artifact.storageKey) {
      throw new NotFoundException("Export artifact is not ready");
    }
    if (new Date(artifact.expiresAt).getTime() <= Date.now()) {
      throw new NotFoundException("Export artifact has expired");
    }

    const filePath = this.resolveStoragePath(artifact.storageKey);
    if (!existsSync(filePath)) throw new NotFoundException("Export file not found");
    return {
      artifact,
      filePath,
      stream: createReadStream(filePath),
    };
  }

  async processArtifact(artifactId: string) {
    const artifact = await this.artifactModel.findById(artifactId).lean();
    if (!artifact || artifact.status === "ready") return;

    const startedAt = new Date();
    await this.artifactModel.updateOne(
      { _id: artifact._id },
      {
        $set: {
          status: "processing",
          startedAt,
          progress: 0,
          errorCode: null,
          errorMessage: null,
        },
      }
    );

    const exportDir = await this.ensureExportDir();
    const extension = `${artifact.format === "json" ? "json" : "jsonl"}${
      artifact.compression === "gzip" ? ".gz" : ""
    }`;
    const storageKey = `${artifact._id}-${uuidv4()}.${extension}`;
    const finalPath = path.join(exportDir, storageKey);
    const partialPath = `${finalPath}.part`;

    try {
      const source = await this.createDocumentSource(artifact);
      const serializer = new PassThrough();
      const hash = createHash("sha256");
      let bytes = 0;
      let documentCount = 0;
      const hashTransform = new Transform({
        transform(chunk, _encoding, callback) {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          hash.update(buffer);
          bytes += buffer.length;
          callback(null, buffer);
        },
      });
      const output = createWriteStream(partialPath, { flags: "wx" });
      const streams = artifact.compression === "gzip"
        ? [serializer, createGzip({ level: 6 }), hashTransform, output]
        : [serializer, hashTransform, output];
      const writePromise = pipeline(streams as any);

      if (artifact.format === "json") await this.writeChunk(serializer, "[\n");
      for await (const document of source.documents) {
        const serialized = JSON.stringify(document);
        if (artifact.format === "json") {
          await this.writeChunk(serializer, `${documentCount ? ",\n" : ""}${serialized}`);
        } else {
          await this.writeChunk(serializer, `${serialized}\n`);
        }
        documentCount += 1;
        if (documentCount % this.progressBatchSize() === 0) {
          await this.artifactModel.updateOne(
            { _id: artifact._id },
            {
              $set: {
                documentCount,
                progress: source.expectedCount
                  ? Math.min(99, Math.floor((documentCount / source.expectedCount) * 100))
                  : 0,
              },
            }
          );
        }
      }
      if (artifact.format === "json") await this.writeChunk(serializer, "\n]\n");
      serializer.end();
      await writePromise;
      await rename(partialPath, finalPath);
      const fileStat = await stat(finalPath);

      await this.artifactModel.updateOne(
        { _id: artifact._id },
        {
          $set: {
            status: "ready",
            progress: 100,
            documentCount,
            bytes: fileStat.size || bytes,
            sha256: hash.digest("hex"),
            storageKey,
            completedAt: new Date(),
          },
        }
      );
      this.logger.log(
        `Admin AI export ready artifact=${artifact._id} collection=${artifact.collectionName} documents=${documentCount} bytes=${fileStat.size}`
      );
    } catch (error: any) {
      await Promise.allSettled([
        rm(partialPath, { force: true }),
        rm(finalPath, { force: true }),
      ]);
      await this.artifactModel.updateOne(
        { _id: artifact._id },
        {
          $set: {
            status: "failed",
            errorCode: String(error?.code || error?.name || "EXPORT_FAILED").slice(0, 120),
            errorMessage: String(error?.message || "JSON export failed").slice(0, 500),
            completedAt: new Date(),
          },
        }
      );
      this.logger.warn(
        `Admin AI export failed artifact=${artifact._id} code=${error?.code || error?.name || "EXPORT_FAILED"}`
      );
      throw error;
    }
  }

  async markArtifactQueuedForRetry(artifactId: string) {
    await this.artifactModel.updateOne(
      { _id: this.objectId(artifactId, "Invalid artifact id"), status: "failed" },
      {
        $set: {
          status: "queued",
          progress: 0,
          documentCount: 0,
          bytes: 0,
          errorCode: null,
          errorMessage: null,
          completedAt: null,
        },
      }
    );
  }

  private async createDocumentSource(artifact: any): Promise<{
    documents: AsyncIterable<any>;
    expectedCount?: number;
  }> {
    this.adminAiConfig.ensureAiToolDbAccess({
      dbName: artifact.dbTarget,
      access: "read",
      accessMode: "read_only",
    });
    const collectionName = this.safeCollectionName(artifact.collectionName);
    this.assertSafeSpec(artifact.spec || {});

    if (artifact.kind === "vesting_reviews") {
      return this.vestingReviewSource(artifact.spec || {});
    }

    const filter = this.objectValue(artifact.spec?.filter);
    const projection = this.objectValue(artifact.spec?.projection);
    const sort = this.sortValue(artifact.spec?.sort);
    const limit = this.nonNegativeInteger(artifact.spec?.limit, 0);
    const effectiveLimit = this.applyConfiguredDocumentLimit(limit);
    const collection = this.adminConnection.db.collection(collectionName);
    let expectedCount: number | undefined;
    try {
      const expectedCountRaw = Object.keys(filter).length
        ? await collection.countDocuments(filter, {
            maxTimeMS: this.exportMaxTimeMs(),
          })
        : await collection.estimatedDocumentCount({
            maxTimeMS: this.exportMaxTimeMs(),
          });
      expectedCount = effectiveLimit
        ? Math.min(expectedCountRaw, effectiveLimit)
        : expectedCountRaw;
    } catch (error: any) {
      this.logger.warn(
        `Admin AI export count unavailable collection=${collectionName} code=${error?.code || error?.name || "COUNT_FAILED"}`
      );
    }
    let cursor = collection.find(filter, {
      ...(Object.keys(projection).length ? { projection } : {}),
      noCursorTimeout: true,
      maxTimeMS: this.exportMaxTimeMs(),
    } as any);
    cursor = cursor.sort(Object.keys(sort).length ? sort : { _id: 1 });
    cursor = cursor.batchSize(this.cursorBatchSize());
    if (effectiveLimit) cursor = cursor.limit(effectiveLimit);
    return { documents: cursor as any, expectedCount };
  }

  private async vestingReviewSource(spec: Record<string, unknown>) {
    const limit = this.applyConfiguredDocumentLimit(
      this.positiveInteger(spec.limit, 10, 1, 1000)
    );
    const status = String(spec.status || "open").trim() || "open";
    const domain = String(spec.domain || "vesting").trim().toLowerCase();
    const match: Record<string, unknown> = { status };
    if (domain !== "all") match.domain = { $regex: /vesting|tokenomics|unlock|allocation/i };

    const ranked = await this.adminConnection.db
      .collection("review_batches")
      .aggregate(
        [
          { $match: match },
          {
            $lookup: {
              from: "market_project_read_models",
              localField: "canonicalProjectId",
              foreignField: "canonicalProjectId",
              pipeline: [
                { $sort: { rank: 1, marketCap: -1, _id: 1 } },
                { $limit: 1 },
                { $project: { _id: 1, canonicalProjectId: 1, rank: 1, marketCap: 1, tier: 1 } },
              ],
              as: "marketContext",
            },
          },
          {
            $addFields: {
              projectRank: {
                $ifNull: [{ $arrayElemAt: ["$marketContext.rank", 0] }, 2147483647],
              },
              projectMarketCap: {
                $ifNull: [{ $arrayElemAt: ["$marketContext.marketCap", 0] }, -1],
              },
            },
          },
          { $sort: { projectRank: 1, projectMarketCap: -1, lastSeenAt: -1, _id: 1 } },
          { $limit: limit },
          { $project: { _id: 1, projectRank: 1 } },
        ],
        { maxTimeMS: this.exportMaxTimeMs(), allowDiskUse: true }
      )
      .toArray();

    const reviewIds = ranked.map((item: any) => item._id);
    const reviews = reviewIds.length
      ? await this.adminConnection.db
          .collection("review_batches")
          .find({ _id: { $in: reviewIds } })
          .toArray()
      : [];
    const reviewById = new Map(reviews.map((item: any) => [String(item._id), item]));
    async function* documents() {
      for (const rankedItem of ranked) {
        const review = reviewById.get(String(rankedItem._id));
        if (!review) continue;
        // Keep the artifact raw: lookup data is used only to order review_batches.
        yield review;
      }
    }

    return { documents: documents(), expectedCount: ranked.length };
  }

  private toDescriptor(artifact: any, includeDownload = false) {
    const descriptor: Record<string, unknown> = {
      id: String(artifact._id),
      kind: artifact.kind,
      collectionName: artifact.collectionName,
      filename: artifact.filename,
      format: artifact.format,
      compression: artifact.compression,
      status: artifact.status,
      progress: Number(artifact.progress || 0),
      documentCount: Number(artifact.documentCount || 0),
      bytes: Number(artifact.bytes || 0),
      sha256: artifact.sha256,
      contentType: artifact.contentType,
      expiresAt: artifact.expiresAt,
      errorCode: artifact.errorCode,
      errorMessage: artifact.errorMessage,
    };
    if (includeDownload && artifact.status === "ready") {
      const expires = Date.now() + this.downloadTtlMs();
      descriptor.downloadUrl = `/admin-ai-chat/artifacts/${artifact._id}/download?expires=${expires}&signature=${this.downloadSignature(
        String(artifact._id),
        expires
      )}`;
    }
    return descriptor;
  }

  private async writeChunk(stream: PassThrough, chunk: string) {
    if (!stream.write(chunk, "utf8")) await once(stream, "drain");
  }

  private async ensureExportDir() {
    const exportDir = this.exportDir();
    await mkdir(exportDir, { recursive: true });
    return exportDir;
  }

  private exportDir() {
    const configured = String(
      this.configService.get<string>("AI_ADMIN_EXPORT_DIR") || ""
    ).trim();
    return path.resolve(configured || path.join(os.tmpdir(), "fomo-admin-ai-exports"));
  }

  private resolveStoragePath(storageKey: string) {
    const safeKey = path.basename(String(storageKey || ""));
    if (!safeKey || safeKey !== storageKey) throw new BadRequestException("Invalid storage key");
    const exportDir = this.exportDir();
    const resolved = path.resolve(exportDir, safeKey);
    if (path.dirname(resolved) !== exportDir) throw new BadRequestException("Invalid storage path");
    return resolved;
  }

  private buildFilename(prefix: string, format: AdminAiExportFormat, compression: AdminAiExportCompression) {
    const safePrefix = String(prefix || "export")
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "export";
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    return `${safePrefix}-${stamp}.${format === "json" ? "json" : "jsonl"}${
      compression === "gzip" ? ".gz" : ""
    }`;
  }

  private safeCollectionName(value: unknown) {
    const name = String(value || "").trim().slice(0, 120);
    if (!name || FORBIDDEN_COLLECTION_PATTERN.test(name) || SENSITIVE_COLLECTION_PATTERN.test(name)) {
      throw new BadRequestException("Collection is not allowed for raw JSON export");
    }
    return name;
  }

  private assertSafeSpec(value: unknown, depth = 0) {
    if (depth > 12) throw new BadRequestException("Export query is too deeply nested");
    if (value === null || value === undefined || typeof value !== "object") return;
    if (Array.isArray(value)) {
      if (value.length > 1000) throw new BadRequestException("Export query array is too large");
      value.forEach((item) => this.assertSafeSpec(item, depth + 1));
      return;
    }
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (!key || key.includes("\0") || FORBIDDEN_MONGO_KEYS.has(key)) {
        throw new BadRequestException("Export query contains a forbidden MongoDB operator");
      }
      this.assertSafeSpec(item, depth + 1);
    }
  }

  private objectValue(value: unknown): Record<string, any> {
    return value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, any>)
      : {};
  }

  private sortValue(value: unknown): Record<string, 1 | -1> {
    return Object.entries(this.objectValue(value)).reduce((acc, [key, direction]) => {
      if (!key.startsWith("$") && !key.includes("\0")) acc[key] = Number(direction) === -1 ? -1 : 1;
      return acc;
    }, {} as Record<string, 1 | -1>);
  }

  private objectId(value: unknown, message: string) {
    const normalized = String(value || "").trim();
    if (!Types.ObjectId.isValid(normalized)) throw new BadRequestException(message);
    return new Types.ObjectId(normalized);
  }

  private positiveInteger(value: unknown, fallback: number, min: number, max: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(parsed)));
  }

  private nonNegativeInteger(value: unknown, fallback: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return fallback;
    return Math.floor(parsed);
  }

  private applyConfiguredDocumentLimit(requestedLimit: number) {
    const configured = this.nonNegativeInteger(
      this.configService.get<string>("AI_ADMIN_EXPORT_MAX_DOCUMENTS"),
      0
    );
    if (!configured) return requestedLimit;
    if (!requestedLimit) return configured;
    return Math.min(requestedLimit, configured);
  }

  private artifactTtlMs() {
    return this.positiveInteger(
      this.configService.get<string>("AI_ADMIN_EXPORT_TTL_HOURS"),
      24,
      1,
      168
    ) * 60 * 60_000;
  }

  private downloadTtlMs() {
    return this.positiveInteger(
      this.configService.get<string>("AI_ADMIN_EXPORT_DOWNLOAD_TTL_SECONDS"),
      600,
      60,
      900
    ) * 1000;
  }

  private cursorBatchSize() {
    return this.positiveInteger(
      this.configService.get<string>("AI_ADMIN_EXPORT_CURSOR_BATCH_SIZE"),
      500,
      10,
      5000
    );
  }

  private progressBatchSize() {
    return this.positiveInteger(
      this.configService.get<string>("AI_ADMIN_EXPORT_PROGRESS_BATCH_SIZE"),
      500,
      10,
      10000
    );
  }

  private exportMaxTimeMs() {
    return this.positiveInteger(
      this.configService.get<string>("AI_ADMIN_EXPORT_MAX_TIME_MS"),
      30 * 60_000,
      10_000,
      6 * 60 * 60_000
    );
  }

  private signingSecret() {
    const secret = String(
      this.configService.get<string>("AI_ADMIN_EXPORT_SIGNING_SECRET") ||
        this.configService.get<string>("SESSION_SECRET") ||
        this.configService.get<string>("JWT_SECRET") ||
        ""
    );
    if (!secret) throw new ServiceUnavailableException("Export signing secret is not configured");
    return secret;
  }

  private downloadSignature(artifactId: string, expires: number) {
    return createHmac("sha256", this.signingSecret())
      .update(`${artifactId}:${expires}`)
      .digest("hex");
  }

  private safeSignatureEquals(expected: string, actual: string) {
    const left = Buffer.from(expected, "utf8");
    const right = Buffer.from(String(actual || ""), "utf8");
    return left.length === right.length && timingSafeEqual(left, right);
  }

  private async cleanupExpiredArtifacts() {
    try {
      const expired = await this.artifactModel
        .find({ expiresAt: { $lte: new Date() } })
        .select("_id storageKey")
        .limit(100)
        .lean();
      await Promise.allSettled(
        expired
          .filter((artifact) => artifact.storageKey)
          .map((artifact) => rm(this.resolveStoragePath(String(artifact.storageKey)), { force: true }))
      );
      if (expired.length) {
        await this.artifactModel.deleteMany({ _id: { $in: expired.map((item) => item._id) } });
      }
    } catch (error: any) {
      this.logger.warn(`Admin AI export cleanup failed: ${error?.name || "CleanupError"}`);
    }
  }
}
