import "dotenv/config";
import axios from "axios";
import mongoose, { Model } from "mongoose";
import { buildMongoUri } from "src/config/mongo.config";
import { AssetStorageService } from "../asset-storage.service";
import {
  ExternalAssetMirror,
  ExternalAssetMirrorDocument,
  ExternalAssetMirrorProvider,
  ExternalAssetMirrorSchema,
  ExternalAssetMirrorStatus,
} from "../external-asset-mirror.model";
import {
  ImageInventorySource,
  MARKET_PROJECT_LOGO_SOURCE,
  findDisabledMirrorSource,
  findMirrorSource,
  sourceKey,
} from "../image-inventory.config";
import {
  ImageUrlCategory,
  buildLegacyUploadUrl,
  classifyImageValue,
  contentTypeToExtension,
  getImageFieldValues,
  isMirrorCandidateCategory,
  normalizeContentType,
  normalizeSourceUrl,
  parseBoolean,
  parseNonNegativeInteger,
  parsePositiveInteger,
  providerFromCategory,
  sha256,
  topLevelField,
} from "../image-inventory.utils";

interface RunnerArgs {
  source: string;
  mode: "dry-run" | "write";
  limit: number;
  offset: number;
  concurrency: number;
  timeoutMs: number;
  retries: number;
  retryFailed: boolean;
  failedRetryAfterHours: number;
  examplesLimit: number;
  confirmWrite: boolean;
}

interface MirrorExample {
  sourceUrl: string;
  publicUrl?: string;
  collection: string;
  documentId: string;
  fieldPath: string;
  reason?: string;
}

interface MirrorReport {
  mode: "dry-run" | "write";
  source: string;
  scannedDocs: number;
  processedCandidates: number;
  foundUrls: number;
  skippedAlreadyR2: number;
  skippedEmpty: number;
  skippedInvalid: number;
  skippedUnsupportedMime: number;
  wouldDownload: number;
  downloaded: number;
  uploaded: number;
  reusedExistingMapping: number;
  skippedFailedMapping: number;
  retriedFailed: number;
  failedRetrySucceeded: number;
  failedRetryStillFailed: number;
  failedDownload: number;
  failedUpload: number;
  dbWouldUpdate: number;
  dbUpdated: number;
  examples: {
    wouldDownload: MirrorExample[];
    reusedExistingMapping: MirrorExample[];
    uploaded: MirrorExample[];
    skipped: MirrorExample[];
    errors: MirrorExample[];
  };
}

interface DownloadedImage {
  buffer: Buffer;
  contentType: string;
  size: number;
}

interface MirrorUsage {
  collection: string;
  documentId: string;
  fieldPath: string;
  sourceName: string;
  database?: string;
}

type MirrorModel = Model<ExternalAssetMirrorDocument>;

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const source = requireMirrorSource(args.source);
  const sourceName = sourceKey(source);

  logProgress(
    `starting mode=${args.mode} source=${args.source} limit=${args.limit} offset=${args.offset} concurrency=${args.concurrency}`,
  );

  if (args.mode === "write" && process.env.STORAGE_DRIVER !== "r2") {
    throw new Error("Write mirror requires STORAGE_DRIVER=r2.");
  }

  mongoose.set("strictQuery", false);
  await mongoose.connect(buildMongoUri(), { autoIndex: false });

  try {
    const db = mongoose.connection.db;
    const mirrorModel = getMirrorModel();

    if (args.mode === "write") {
      await ensureMirrorIndexes(db);
    }

    const sourceDb = source.database
      ? mongoose.connection.getClient().db(source.database)
      : db;
    const collectionExists = await sourceDb
      .listCollections({ name: source.collection })
      .hasNext();
    const collection = sourceDb.collection(source.collection);
    const report = createReport(args);
    const storage = args.mode === "write" ? new AssetStorageService() : undefined;
    const cursor = collectionExists
      ? collection
          .find(
            {},
            {
              projection: {
                [topLevelField(source.fieldPath)]: 1,
              },
            },
          )
          .sort({ _id: 1 })
          .skip(args.offset)
          .batchSize(Math.max(args.concurrency * 4, 25))
      : undefined;
    let batch: any[] = [];

    if (!collectionExists) {
      logProgress(`source collection ${source.collection} does not exist; nothing to scan`);
    } else {
      for await (const doc of cursor!) {
        if (report.processedCandidates >= args.limit) break;

        batch.push(doc);

        const batchSize = Math.min(args.concurrency, args.limit - report.processedCandidates);
        if (batch.length >= batchSize) {
          await processDocumentBatch({
            args,
            batch,
            collection,
            fieldPath: source.fieldPath,
            mirrorModel,
            report,
            sourceCollection: source.collection,
            sourceDatabase: source.database,
            sourceName,
            storage,
          });
          batch = [];
        }
      }
    }

    if (batch.length && report.processedCandidates < args.limit) {
      await processDocumentBatch({
        args,
        batch,
        collection,
        fieldPath: source.fieldPath,
        mirrorModel,
        report,
        sourceCollection: source.collection,
        sourceDatabase: source.database,
        sourceName,
        storage,
      });
    }

    console.log(JSON.stringify(report, null, 2));
    logProgress("completed");
  } finally {
    await mongoose.disconnect();
    logProgress("closed mongo connection");
  }
}

async function processDocumentBatch(params: {
  args: RunnerArgs;
  batch: any[];
  collection: any;
  fieldPath: string;
  mirrorModel: MirrorModel;
  report: MirrorReport;
  sourceCollection: string;
  sourceDatabase?: string;
  sourceName: string;
  storage?: AssetStorageService;
}): Promise<void> {
  await mapLimit(params.batch, params.args.concurrency, async (doc) => {
    await processDocument({
      args: params.args,
      collection: params.collection,
      doc,
      fieldPath: params.fieldPath,
      mirrorModel: params.mirrorModel,
      report: params.report,
      sourceCollection: params.sourceCollection,
      sourceDatabase: params.sourceDatabase,
      sourceName: params.sourceName,
      storage: params.storage,
    });
  });
}

async function processDocument(params: {
  args: RunnerArgs;
  collection: any;
  doc: any;
  fieldPath: string;
  mirrorModel: MirrorModel;
  report: MirrorReport;
  sourceCollection: string;
  sourceDatabase?: string;
  sourceName: string;
  storage?: AssetStorageService;
}): Promise<void> {
  params.report.scannedDocs += 1;

  const values = getImageFieldValues(params.doc, params.fieldPath);

  for (const fieldValue of values) {
    if (params.report.processedCandidates >= params.args.limit) break;

    await processValue({
      args: params.args,
      collection: params.collection,
      doc: params.doc,
      displayFieldPath: fieldValue.displayPath,
      fieldPath: params.fieldPath,
      mirrorModel: params.mirrorModel,
      report: params.report,
      sourceCollection: params.sourceCollection,
      sourceDatabase: params.sourceDatabase,
      sourceName: params.sourceName,
      storage: params.storage,
      value: fieldValue.value,
    });
  }
}

async function processValue(params: {
  args: RunnerArgs;
  collection: any;
  doc: any;
  displayFieldPath: string;
  fieldPath: string;
  mirrorModel: MirrorModel;
  report: MirrorReport;
  sourceCollection: string;
  sourceDatabase?: string;
  sourceName: string;
  storage?: AssetStorageService;
  value: unknown;
}): Promise<void> {
  const {
    args,
    collection,
    doc,
    displayFieldPath,
    fieldPath,
    mirrorModel,
    report,
    sourceCollection,
    sourceDatabase,
    sourceName,
    storage,
    value,
  } = params;
  const category = classifyImageValue(value);
  const usage: MirrorUsage = {
    collection: sourceCollection,
    documentId: String(doc._id),
    fieldPath: displayFieldPath,
    sourceName,
    ...(sourceDatabase ? { database: sourceDatabase } : {}),
  };

  if (category === "empty") {
    report.skippedEmpty += 1;
    addExample(report.examples.skipped, args.examplesLimit, usage, "", "empty");
    return;
  }

  if (category === "invalid" || category === "data_image_base64") {
    report.skippedInvalid += 1;
    addExample(report.examples.skipped, args.examplesLimit, usage, stringifyValue(value), category);
    return;
  }

  report.foundUrls += 1;

  if (category === "already_r2_assets") {
    report.skippedAlreadyR2 += 1;
    addExample(report.examples.skipped, args.examplesLimit, usage, stringifyValue(value), "already_r2_assets");
    return;
  }

  if (!isMirrorCandidateCategory(category)) {
    report.skippedInvalid += 1;
    addExample(report.examples.skipped, args.examplesLimit, usage, stringifyValue(value), category);
    return;
  }

  const sourceUrl = normalizeSourceUrl(String(value));
  const downloadUrl =
    category === "local_uploads_relative" ? buildLegacyUploadUrl(sourceUrl) : sourceUrl;
  const sourceUrlHash = sha256(sourceUrl);
  const provider = providerFromCategory(category);
  const existingMapping = await mirrorModel
    .findOne({ sourceUrlHash })
    .lean()
    .exec();
  const failedRetryDecision =
    existingMapping?.status === "failed"
      ? getFailedRetryDecision(existingMapping, args)
      : undefined;

  if (existingMapping?.status === "failed" && !failedRetryDecision?.shouldRetry) {
    report.skippedFailedMapping += 1;
    addExample(
      report.examples.skipped,
      args.examplesLimit,
      usage,
      sourceUrl,
      failedRetryDecision?.reason || "failed_mapping",
    );
    return;
  }

  if (!reserveCandidateSlot(report, args.limit)) {
    return;
  }

  if (existingMapping?.status === "ok" && existingMapping.publicUrl) {
    report.reusedExistingMapping += 1;
    addExample(
      report.examples.reusedExistingMapping,
      args.examplesLimit,
      usage,
      sourceUrl,
      undefined,
      existingMapping.publicUrl,
    );

    if (args.mode === "dry-run") {
      report.dbWouldUpdate += 1;
      return;
    }

    await addMirrorUsage(mirrorModel, sourceUrlHash, usage);
    await updateSourceField(collection, doc._id, displayFieldPath, existingMapping.publicUrl);
    report.dbUpdated += 1;
    return;
  }

  const isRetryingFailed = existingMapping?.status === "failed";
  if (isRetryingFailed) {
    report.retriedFailed += 1;
  }

  if (args.mode === "dry-run") {
    report.wouldDownload += 1;
    report.dbWouldUpdate += 1;
    addExample(report.examples.wouldDownload, args.examplesLimit, usage, sourceUrl);
    return;
  }

  let downloaded: DownloadedImage;
  try {
    downloaded = await downloadImage(downloadUrl, {
      maxBytes: getMaxUploadBytes(),
      retries: args.retries,
      timeoutMs: args.timeoutMs,
    });
    report.downloaded += 1;
  } catch (error: any) {
    report.failedDownload += 1;
    if (isRetryingFailed) report.failedRetryStillFailed += 1;
    const message = getErrorMessage(error);
    const httpStatus = getHttpStatus(error);
    addExample(report.examples.errors, args.examplesLimit, usage, sourceUrl, `download: ${message}`);
    await upsertMirror({
      contentType: undefined,
      error: message,
      httpStatus,
      incrementRetryCount: isRetryingFailed,
      mirrorModel,
      provider,
      sourceUrl,
      sourceUrlHash,
      status: "failed",
      usage,
    });
    return;
  }

  const extension = contentTypeToExtension(downloaded.contentType);
  if (!extension) {
    report.skippedUnsupportedMime += 1;
    addExample(
      report.examples.skipped,
      args.examplesLimit,
      usage,
      sourceUrl,
      `unsupported_mime:${downloaded.contentType}`,
    );
    await upsertMirror({
      contentType: downloaded.contentType,
      error: `Unsupported content-type ${downloaded.contentType}`,
      mirrorModel,
      provider,
      size: downloaded.size,
      sourceUrl,
      sourceUrlHash,
      status: "skipped",
      usage,
    });
    return;
  }

  try {
    const assetKey = `external/${provider}/${sourceUrlHash}.${extension}`;
    const storedAsset = await storage!.writeFile({
      buffer: downloaded.buffer,
      key: assetKey,
      mimeType: downloaded.contentType,
      originalName: `${sourceUrlHash}.${extension}`,
    });

    report.uploaded += 1;
    if (isRetryingFailed) report.failedRetrySucceeded += 1;
    await upsertMirror({
      assetKey: storedAsset.key,
      contentType: downloaded.contentType,
      mirrorModel,
      provider,
      publicUrl: storedAsset.url,
      size: downloaded.size,
      sourceUrl,
      sourceUrlHash,
      status: "ok",
      usage,
    });
    await updateSourceField(collection, doc._id, displayFieldPath, storedAsset.url);
    report.dbUpdated += 1;
    addExample(report.examples.uploaded, args.examplesLimit, usage, sourceUrl, undefined, storedAsset.url);
  } catch (error: any) {
    report.failedUpload += 1;
    if (isRetryingFailed) report.failedRetryStillFailed += 1;
    const message = getErrorMessage(error);
    addExample(report.examples.errors, args.examplesLimit, usage, sourceUrl, `upload: ${message}`);
    await upsertMirror({
      contentType: downloaded.contentType,
      error: message,
      httpStatus: getHttpStatus(error),
      incrementRetryCount: isRetryingFailed,
      mirrorModel,
      provider,
      size: downloaded.size,
      sourceUrl,
      sourceUrlHash,
      status: "failed",
      usage,
    });
  }
}

function parseArgs(argv: string[]): RunnerArgs {
  const args: RunnerArgs = {
    source: MARKET_PROJECT_LOGO_SOURCE,
    mode: "dry-run",
    limit: 100,
    offset: 0,
    concurrency: 3,
    timeoutMs: 10_000,
    retries: 1,
    retryFailed: false,
    failedRetryAfterHours: 24,
    examplesLimit: 10,
    confirmWrite: false,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "source") {
      args.source = value;
    } else if (key === "limit") {
      args.limit = parsePositiveInteger(value, rawKey, args.limit);
    } else if (key === "offset") {
      args.offset = parseNonNegativeInteger(value, rawKey, args.offset);
    } else if (key === "concurrency") {
      args.concurrency = parsePositiveInteger(value, rawKey, args.concurrency);
    } else if (key === "timeout-ms" || key === "timeoutms") {
      args.timeoutMs = parsePositiveInteger(value, rawKey, args.timeoutMs);
    } else if (key === "retries") {
      args.retries = parseNonNegativeInteger(value, rawKey, args.retries);
    } else if (key === "retry-failed" || key === "retryfailed") {
      args.retryFailed = parseBoolean(value, rawKey);
    } else if (key === "failed-retry-after-hours" || key === "failedretryafterhours") {
      args.failedRetryAfterHours = parseNonNegativeInteger(
        value,
        rawKey,
        args.failedRetryAfterHours,
      );
    } else if (key === "examples-limit" || key === "exampleslimit" || key === "examples") {
      args.examplesLimit = parseNonNegativeInteger(value, rawKey, args.examplesLimit);
    } else if (key === "dry-run" || key === "dryrun") {
      if (parseBoolean(value, rawKey)) args.mode = "dry-run";
    } else if (key === "confirm-write" || key === "confirmwrite") {
      args.confirmWrite = parseBoolean(value, rawKey);
      if (args.confirmWrite) args.mode = "write";
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  args.concurrency = Math.max(1, Math.min(args.concurrency, 5));

  if (args.mode === "write" && args.confirmWrite !== true) {
    throw new Error("Write mode requires --confirm-write=true.");
  }

  return args;
}

function requireMirrorSource(value: string): ImageInventorySource {
  const disabledSource = findDisabledMirrorSource(value);
  if (disabledSource) {
    throw new Error(`Source is disabled for mirror/write: ${sourceKey(disabledSource)}`);
  }

  const source = findMirrorSource(value);
  if (!source) {
    throw new Error(`Source "${value}" is not in image mirror allowlist.`);
  }

  return source;
}

function getMirrorModel(): MirrorModel {
  return (mongoose.models.ExternalAssetMirror ||
    mongoose.model<ExternalAssetMirrorDocument>(
      ExternalAssetMirror.name,
      ExternalAssetMirrorSchema,
    )) as MirrorModel;
}

async function ensureMirrorIndexes(db: any): Promise<void> {
  const collection = db.collection("external_asset_mirrors");
  const existingIndexes = await collection.indexes().catch((error: any) => {
    if (error?.codeName === "NamespaceNotFound") return [];
    throw error;
  });

  await createIndexIfMissing(collection, existingIndexes, { sourceUrlHash: 1 }, {
    name: "uniq_external_asset_mirrors_source_url_hash",
    unique: true,
  });
  await createIndexIfMissing(collection, existingIndexes, { status: 1 }, {
    name: "idx_external_asset_mirrors_status",
  });
  await createIndexIfMissing(collection, existingIndexes, { provider: 1 }, {
    name: "idx_external_asset_mirrors_provider",
  });
  await createIndexIfMissing(collection, existingIndexes, { publicUrl: 1 }, {
    name: "idx_external_asset_mirrors_public_url",
    sparse: true,
  });
}

async function createIndexIfMissing(
  collection: any,
  existingIndexes: any[],
  key: Record<string, 1>,
  options: { name: string; unique?: boolean; sparse?: boolean },
): Promise<void> {
  const existing = existingIndexes.find((index) => sameIndexKey(index.key, key));

  if (existing) {
    if (options.unique && existing.unique !== true) {
      throw new Error(
        `Existing index ${existing.name} on ${Object.keys(key).join(",")} is not unique.`,
      );
    }

    return;
  }

  await collection.createIndex(key, options);
}

function sameIndexKey(left: Record<string, any>, right: Record<string, any>): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function createReport(args: RunnerArgs): MirrorReport {
  return {
    mode: args.mode,
    source: args.source,
    scannedDocs: 0,
    processedCandidates: 0,
    foundUrls: 0,
    skippedAlreadyR2: 0,
    skippedEmpty: 0,
    skippedInvalid: 0,
    skippedUnsupportedMime: 0,
    wouldDownload: 0,
    downloaded: 0,
    uploaded: 0,
    reusedExistingMapping: 0,
    skippedFailedMapping: 0,
    retriedFailed: 0,
    failedRetrySucceeded: 0,
    failedRetryStillFailed: 0,
    failedDownload: 0,
    failedUpload: 0,
    dbWouldUpdate: 0,
    dbUpdated: 0,
    examples: {
      wouldDownload: [],
      reusedExistingMapping: [],
      uploaded: [],
      skipped: [],
      errors: [],
    },
  };
}

function reserveCandidateSlot(report: MirrorReport, limit: number): boolean {
  if (report.processedCandidates >= limit) return false;

  report.processedCandidates += 1;
  return true;
}

function getFailedRetryDecision(
  mapping: any,
  args: RunnerArgs,
): { shouldRetry: boolean; reason: string } {
  if (args.retryFailed) {
    return { shouldRetry: true, reason: "retry_failed_forced" };
  }

  const lastCheckedAt = mapping.lastCheckedAt ? new Date(mapping.lastCheckedAt).getTime() : 0;
  if (!lastCheckedAt) {
    return { shouldRetry: true, reason: "retry_failed_missing_last_checked_at" };
  }

  const retryAfterMs = args.failedRetryAfterHours * 60 * 60 * 1000;
  if (retryAfterMs <= 0) {
    return { shouldRetry: true, reason: "retry_failed_ttl_elapsed" };
  }

  if (Date.now() - lastCheckedAt >= retryAfterMs) {
    return { shouldRetry: true, reason: "retry_failed_ttl_elapsed" };
  }

  return { shouldRetry: false, reason: "failed_mapping_recent" };
}

function getErrorMessage(error: any): string {
  return error?.message || String(error);
}

function getHttpStatus(error: any): number | undefined {
  const status = error?.response?.status;
  return typeof status === "number" ? status : undefined;
}

async function downloadImage(
  url: string,
  options: { maxBytes: number; retries: number; timeoutMs: number },
): Promise<DownloadedImage> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= options.retries; attempt++) {
    try {
      const response = await axios.get<ArrayBuffer>(url, {
        headers: {
          Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif,*/*;q=0.8",
          "User-Agent": "FOMO asset mirror/1.0",
        },
        maxContentLength: options.maxBytes,
        responseType: "arraybuffer",
        timeout: options.timeoutMs,
        validateStatus: (status) => status >= 200 && status < 300,
      });
      const buffer = Buffer.from(response.data);
      const headerContentType = normalizeContentType(response.headers["content-type"] as string);
      const contentType = detectImageContentType(buffer) || headerContentType;

      if (buffer.length > options.maxBytes) {
        throw new Error(`Downloaded file is too large: ${buffer.length} bytes`);
      }

      return {
        buffer,
        contentType,
        size: buffer.length,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function detectImageContentType(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 6 &&
    buffer.slice(0, 6).toString("ascii").match(/^GIF8[79]a$/)
  ) {
    return "image/gif";
  }

  if (
    buffer.length >= 12 &&
    buffer.slice(0, 4).toString("ascii") === "RIFF" &&
    buffer.slice(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

async function upsertMirror(params: {
  assetKey?: string;
  contentType?: string;
  error?: string;
  httpStatus?: number;
  incrementRetryCount?: boolean;
  mirrorModel: MirrorModel;
  provider: ExternalAssetMirrorProvider;
  publicUrl?: string;
  size?: number;
  sourceUrl: string;
  sourceUrlHash: string;
  status: ExternalAssetMirrorStatus;
  usage: MirrorUsage;
}): Promise<void> {
  const now = new Date();
  const setPayload: Record<string, any> = {
    provider: params.provider,
    status: params.status,
    lastCheckedAt: now,
  };

  if (params.assetKey) setPayload.assetKey = params.assetKey;
  if (params.publicUrl) setPayload.publicUrl = params.publicUrl;
  if (params.contentType) setPayload.contentType = params.contentType;
  if (typeof params.size === "number") setPayload.size = params.size;
  if (params.status === "ok") setPayload.mirroredAt = now;
  if (params.error) {
    setPayload.error = params.error;
    setPayload.lastError = params.error;
    setPayload.lastErrorAt = now;
  }
  if (typeof params.httpStatus === "number") setPayload.httpStatus = params.httpStatus;

  const unsetPayload =
    params.error
      ? {}
      : {
          error: "",
          lastError: "",
          lastErrorAt: "",
          httpStatus: "",
        };
  const setOnInsertPayload: Record<string, any> = {
    sourceUrl: params.sourceUrl,
    sourceUrlHash: params.sourceUrlHash,
    firstSeenAt: now,
  };

  if (!params.incrementRetryCount) {
    setOnInsertPayload.retryCount = 0;
  }

  await params.mirrorModel.updateOne(
    { sourceUrlHash: params.sourceUrlHash },
    {
      $setOnInsert: setOnInsertPayload,
      $set: setPayload,
      ...(Object.keys(unsetPayload).length ? { $unset: unsetPayload } : {}),
      ...(params.incrementRetryCount ? { $inc: { retryCount: 1 } } : {}),
      $addToSet: {
        usages: params.usage,
      },
    },
    { upsert: true },
  );
}

async function addMirrorUsage(
  mirrorModel: MirrorModel,
  sourceUrlHash: string,
  usage: MirrorUsage,
): Promise<void> {
  await mirrorModel.updateOne(
    { sourceUrlHash },
    {
      $set: {
        lastCheckedAt: new Date(),
      },
      $addToSet: {
        usages: usage,
      },
    },
  );
}

async function updateSourceField(
  collection: any,
  documentId: any,
  displayFieldPath: string,
  publicUrl: string,
): Promise<void> {
  const updatePath = displayPathToMongoPath(displayFieldPath);

  await collection.updateOne(
    { _id: documentId },
    {
      $set: {
        [updatePath]: publicUrl,
      },
    },
  );
}

function displayPathToMongoPath(displayFieldPath: string): string {
  return displayFieldPath.replace(/\[(\d+)\]/g, ".$1");
}

async function mapLimit<T>(
  items: T[],
  concurrency: number,
  handler: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      await handler(items[currentIndex]);
    }
  });

  await Promise.all(workers);
}

function getMaxUploadBytes(): number {
  const maxUploadMb = Number(process.env.R2_MAX_UPLOAD_MB || 10);
  const safeMaxUploadMb =
    Number.isFinite(maxUploadMb) && maxUploadMb > 0 ? maxUploadMb : 10;

  return safeMaxUploadMb * 1024 * 1024;
}

function addExample(
  bucket: MirrorExample[],
  examplesLimit: number,
  usage: MirrorUsage,
  sourceUrl: string,
  reason?: string,
  publicUrl?: string,
): void {
  if (examplesLimit <= 0 || bucket.length >= examplesLimit) return;

  bucket.push({
    sourceUrl,
    publicUrl,
    collection: usage.collection,
    documentId: usage.documentId,
    fieldPath: usage.fieldPath,
    reason,
  });
}

function stringifyValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";

  try {
    return JSON.stringify(value);
  } catch (error) {
    return String(value);
  }
}

function logProgress(message: string): void {
  console.error(`[external-assets-mirror] ${new Date().toISOString()} ${message}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[external-assets-mirror] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
