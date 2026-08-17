import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { calculateObjectSize } from "bson";
import mongoose from "mongoose";
import { AnyBulkWriteOperation, Db, Document, ObjectId } from "mongodb";
import { buildMongoUri as buildConfiguredMongoUri } from "src/config/mongo.config";

export const LONG_RANGE_CHART_FIELDS = ["chart90d", "chart1y", "chartAll"] as const;
export type LongRangeChartField = (typeof LONG_RANGE_CHART_FIELDS)[number];

export const PROJECT_CHART_LONG_RANGE_FILTER = {
  entityType: "project",
  $or: [
    { chart90d: { $exists: true } },
    { chart1y: { $exists: true } },
    { chartAll: { $exists: true } },
  ],
} as const;

const PROJECT_CHART_LONG_RANGE_PROJECTION = {
  _id: 1,
  entityId: 1,
  entityType: 1,
  chart90d: 1,
  chart1y: 1,
  chartAll: 1,
} as const;

export type TrimMode = "dry-run" | "archive" | "write";
export type ArchiveTarget = "jsonl" | "collection";

export type TrimProjectChartLongRangesOptions = {
  mode: TrimMode;
  batchSize: number;
  skip: number;
  limit?: number;
  archiveTarget: ArchiveTarget;
  archiveDir: string;
  archiveCollection: string;
  migrationId: string;
  confirmArchive: boolean;
  confirmWrite: boolean;
  progressEvery: number;
  help?: boolean;
};

export type FieldSizeStats = {
  docs: number;
  arrays: number;
  points: number;
  bsonBytes: number;
};

export type TrimProjectChartLongRangesResult = {
  mode: TrimMode;
  migrationId: string;
  filter: typeof PROJECT_CHART_LONG_RANGE_FILTER;
  batchSize: number;
  skip: number;
  limit?: number;
  matchingDocs: number;
  scannedDocs: number;
  archivedDocs: number;
  unsetDocs: number;
  modifiedDocs: number;
  archiveTarget?: ArchiveTarget;
  archivePath?: string;
  archiveCollection?: string;
  totalLongRangeBsonBytes: number;
  fieldStats: Record<LongRangeChartField, FieldSizeStats>;
  warnings: string[];
};

type ChartLongRangeDoc = Document & {
  _id: ObjectId;
  entityId?: ObjectId;
  entityType?: string;
};

type ArchiveRecord = {
  _id: string;
  migrationId: string;
  archivedAt: Date;
  sourceCollection: "charts";
  chartId: ObjectId;
  entityId?: ObjectId;
  entityType: "project";
  fields: Partial<Record<LongRangeChartField, unknown>>;
  fieldSizes: Record<LongRangeChartField, FieldSizeStats>;
  totalLongRangeBsonBytes: number;
};

const DEFAULT_ARCHIVE_COLLECTION = "project_chart_long_range_archives";

export function parseTrimProjectChartLongRangesArgs(argv: string[]): TrimProjectChartLongRangesOptions {
  const now = new Date().toISOString().replace(/[:.]/g, "-");
  const args: TrimProjectChartLongRangesOptions = {
    mode: "dry-run",
    batchSize: 100,
    skip: 0,
    archiveTarget: "jsonl",
    archiveDir: path.resolve(process.cwd(), "backups", "chart-long-range-trim"),
    archiveCollection: DEFAULT_ARCHIVE_COLLECTION,
    migrationId: `chart-long-range-trim-${now}`,
    confirmArchive: false,
    confirmWrite: false,
    progressEvery: 1000,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;

    const [rawKey, rawValue] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue === undefined ? "true" : rawValue.trim();
    rejectJoinedOption(key, value);

    if (key === "help" || key === "h") {
      args.help = true;
    } else if (key === "dry-run" || key === "dryrun") {
      if (parseBoolean(value)) args.mode = "dry-run";
    } else if (key === "archive") {
      args.mode = "archive";
      if (rawValue !== undefined) args.archiveTarget = parseArchiveTarget(value);
    } else if (key === "write") {
      if (parseBoolean(value)) args.mode = "write";
    } else if (key === "mode") {
      args.mode = parseMode(value);
    } else if (key === "archive-target" || key === "archivetarget") {
      args.archiveTarget = parseArchiveTarget(value);
    } else if (key === "archive-dir" || key === "archivedir") {
      args.archiveDir = path.resolve(value);
    } else if (key === "archive-collection" || key === "archivecollection") {
      args.archiveCollection = value || DEFAULT_ARCHIVE_COLLECTION;
    } else if (key === "migration-id" || key === "migrationid") {
      args.migrationId = value;
    } else if (key === "confirm-archive" || key === "confirmarchive") {
      args.confirmArchive = parseBoolean(value);
    } else if (key === "confirm-write" || key === "confirmwrite") {
      args.confirmWrite = parseBoolean(value);
    } else if (key === "batch-size" || key === "batchsize") {
      args.batchSize = parsePositiveInt(value, "batch-size");
    } else if (key === "skip") {
      args.skip = parseNonNegativeInt(value, "skip");
    } else if (key === "limit") {
      args.limit = parseNonNegativeInt(value, "limit");
    } else if (key === "progress-every" || key === "progressevery") {
      args.progressEvery = parsePositiveInt(value, "progress-every");
    } else {
      throw new Error(`Unknown option --${rawKey}. Refusing to run chart trim migration.`);
    }
  }

  return args;
}

export function validateTrimProjectChartLongRangesOptions(options: TrimProjectChartLongRangesOptions): string[] {
  const warnings: string[] = [];

  if (options.mode === "archive" && !options.confirmArchive) {
    throw new Error("Archive mode requires --confirm-archive=true.");
  }

  if (options.mode === "write" && !options.confirmWrite) {
    throw new Error("Write mode requires --confirm-write=true. Dry-run is the default.");
  }

  if (options.mode === "write") {
    warnings.push("Write mode archives each batch before unsetting chart90d/chart1y/chartAll.");
    warnings.push("Only project charts are touched; short ranges and non-project charts are excluded by filter.");
  }

  if (options.archiveTarget === "collection") {
    warnings.push(
      "Archive target is a Mongo collection. This preserves rollback data in Mongo but does not reduce total Mongo storage until the archive is exported and removed.",
    );
  }

  return warnings;
}

export async function runTrimProjectChartLongRanges(
  db: Db,
  options: TrimProjectChartLongRangesOptions,
): Promise<TrimProjectChartLongRangesResult> {
  const warnings = validateTrimProjectChartLongRangesOptions(options);
  const charts = db.collection("charts");
  const matchingDocs = await charts.countDocuments(PROJECT_CHART_LONG_RANGE_FILTER);
  const result: TrimProjectChartLongRangesResult = {
    mode: options.mode,
    migrationId: options.migrationId,
    filter: PROJECT_CHART_LONG_RANGE_FILTER,
    batchSize: options.batchSize,
    skip: options.skip,
    limit: options.limit,
    matchingDocs,
    scannedDocs: 0,
    archivedDocs: 0,
    unsetDocs: 0,
    modifiedDocs: 0,
    archiveTarget: options.mode === "dry-run" ? undefined : options.archiveTarget,
    archiveCollection:
      options.mode !== "dry-run" && options.archiveTarget === "collection" ? options.archiveCollection : undefined,
    totalLongRangeBsonBytes: 0,
    fieldStats: emptyFieldStats(),
    warnings,
  };

  const archivePath =
    options.mode !== "dry-run" && options.archiveTarget === "jsonl"
      ? initializeArchiveJsonl(options.archiveDir, options.migrationId)
      : undefined;
  result.archivePath = archivePath;

  const cursor = charts
    .find(PROJECT_CHART_LONG_RANGE_FILTER, { projection: PROJECT_CHART_LONG_RANGE_PROJECTION })
    .sort({ _id: 1 })
    .skip(options.skip)
    .batchSize(options.batchSize);

  if (options.limit && options.limit > 0) {
    cursor.limit(options.limit);
  }

  let batch: ChartLongRangeDoc[] = [];
  while (await cursor.hasNext()) {
    const doc = (await cursor.next()) as ChartLongRangeDoc | null;
    if (!doc) continue;
    batch.push(doc);

    if (batch.length >= options.batchSize) {
      await processBatch(db, batch, options, result, archivePath);
      batch = [];
      logProgressIfNeeded(result, options);
    }
  }

  if (batch.length) {
    await processBatch(db, batch, options, result, archivePath);
    logProgressIfNeeded(result, options);
  }

  return result;
}

export function calculateLongRangeFieldStats(doc: Document): {
  fieldStats: Record<LongRangeChartField, FieldSizeStats>;
  totalLongRangeBsonBytes: number;
  presentFields: LongRangeChartField[];
} {
  const fieldStats = emptyFieldStats();
  const presentFields: LongRangeChartField[] = [];
  let totalLongRangeBsonBytes = 0;

  for (const field of LONG_RANGE_CHART_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(doc, field)) continue;

    presentFields.push(field);
    const value = doc[field];
    const bsonBytes = calculateObjectSize({ [field]: value }, { ignoreUndefined: true });
    fieldStats[field].docs += 1;
    fieldStats[field].bsonBytes += bsonBytes;

    if (Array.isArray(value)) {
      fieldStats[field].arrays += 1;
      fieldStats[field].points += value.length;
    }

    totalLongRangeBsonBytes += bsonBytes;
  }

  return {
    fieldStats,
    totalLongRangeBsonBytes,
    presentFields,
  };
}

export function buildArchiveRecord(doc: ChartLongRangeDoc, migrationId: string, archivedAt = new Date()): ArchiveRecord {
  const { fieldStats, totalLongRangeBsonBytes, presentFields } = calculateLongRangeFieldStats(doc);
  const fields: Partial<Record<LongRangeChartField, unknown>> = {};

  for (const field of presentFields) {
    fields[field] = doc[field];
  }

  return {
    _id: `${migrationId}:${String(doc._id)}`,
    migrationId,
    archivedAt,
    sourceCollection: "charts",
    chartId: doc._id,
    entityId: doc.entityId,
    entityType: "project",
    fields,
    fieldSizes: fieldStats,
    totalLongRangeBsonBytes,
  };
}

export function buildUnsetOperation(doc: ChartLongRangeDoc): AnyBulkWriteOperation<Document> {
  return {
    updateOne: {
      filter: {
        _id: doc._id,
        entityType: "project",
      },
      update: {
        $unset: {
          chart90d: "",
          chart1y: "",
          chartAll: "",
        },
      },
    },
  };
}

export function buildMongoUri(env: NodeJS.ProcessEnv = process.env): string {
  return buildConfiguredMongoUri(env);
}

export function helpText(): string {
  return [
    "Usage:",
    "  ts-node -r tsconfig-paths/register src/scripts/trim-project-chart-long-ranges.ts --dry-run",
    "  ts-node -r tsconfig-paths/register src/scripts/trim-project-chart-long-ranges.ts --mode=archive --confirm-archive=true --archive-target=jsonl",
    "  ts-node -r tsconfig-paths/register src/scripts/trim-project-chart-long-ranges.ts --mode=write --confirm-write=true --archive-target=jsonl",
    "",
    "Modes:",
    "  dry-run   Count matching project chart docs and estimate BSON size. Default. No writes.",
    "  archive   Archive chart90d/chart1y/chartAll only. Does not unset. Requires --confirm-archive=true.",
    "  write     Archive each batch, then $unset chart90d/chart1y/chartAll. Requires --confirm-write=true.",
    "",
    "Options:",
    "  --batch-size=100",
    "  --limit=0",
    "  --skip=0",
    "  --archive-target=jsonl|collection",
    "  --archive-dir=backups/chart-long-range-trim",
    "  --archive-collection=project_chart_long_range_archives",
    "  --migration-id=<stable-id>",
    "  --progress-every=1000",
  ].join("\n");
}

async function processBatch(
  db: Db,
  batch: ChartLongRangeDoc[],
  options: TrimProjectChartLongRangesOptions,
  result: TrimProjectChartLongRangesResult,
  archivePath?: string,
): Promise<void> {
  const archiveRecords = batch.map((doc) => buildArchiveRecord(doc, options.migrationId));

  for (const record of archiveRecords) {
    result.scannedDocs += 1;
    result.totalLongRangeBsonBytes += record.totalLongRangeBsonBytes;
    mergeFieldStats(result.fieldStats, record.fieldSizes);
  }

  if (options.mode === "dry-run") return;

  await archiveBatch(db, archiveRecords, options, archivePath);
  result.archivedDocs += archiveRecords.length;

  if (options.mode !== "write") return;

  const unsetResult = await db.collection("charts").bulkWrite(batch.map(buildUnsetOperation), { ordered: false });
  result.unsetDocs += batch.length;
  result.modifiedDocs += Number(unsetResult.modifiedCount || 0);
}

async function archiveBatch(
  db: Db,
  archiveRecords: ArchiveRecord[],
  options: TrimProjectChartLongRangesOptions,
  archivePath?: string,
): Promise<void> {
  if (!archiveRecords.length) return;

  if (options.archiveTarget === "collection") {
    await db.collection(options.archiveCollection).bulkWrite(
      archiveRecords.map((record) => ({
        replaceOne: {
          filter: { _id: record._id },
          replacement: record,
          upsert: true,
        },
      })),
      { ordered: false },
    );
    return;
  }

  if (!archivePath) {
    throw new Error("JSONL archive path is not initialized.");
  }

  fs.appendFileSync(archivePath, archiveRecords.map((record) => JSON.stringify(record)).join("\n") + "\n");
}

function initializeArchiveJsonl(archiveDir: string, migrationId: string): string {
  fs.mkdirSync(archiveDir, { recursive: true });
  const archivePath = path.join(archiveDir, `${migrationId}.jsonl`);
  const fileHandle = fs.openSync(archivePath, "wx");
  fs.closeSync(fileHandle);
  return archivePath;
}

function mergeFieldStats(target: Record<LongRangeChartField, FieldSizeStats>, source: Record<LongRangeChartField, FieldSizeStats>) {
  for (const field of LONG_RANGE_CHART_FIELDS) {
    target[field].docs += source[field].docs;
    target[field].arrays += source[field].arrays;
    target[field].points += source[field].points;
    target[field].bsonBytes += source[field].bsonBytes;
  }
}

function emptyFieldStats(): Record<LongRangeChartField, FieldSizeStats> {
  return {
    chart90d: { docs: 0, arrays: 0, points: 0, bsonBytes: 0 },
    chart1y: { docs: 0, arrays: 0, points: 0, bsonBytes: 0 },
    chartAll: { docs: 0, arrays: 0, points: 0, bsonBytes: 0 },
  };
}

function parseMode(value: string): TrimMode {
  const normalized = value.trim().toLowerCase();
  if (normalized === "dry-run" || normalized === "dryrun") return "dry-run";
  if (normalized === "archive") return "archive";
  if (normalized === "write") return "write";
  throw new Error(`Unsupported mode "${value}". Use dry-run, archive, or write.`);
}

function parseArchiveTarget(value: string): ArchiveTarget {
  const normalized = value.trim().toLowerCase();
  if (normalized === "jsonl") return "jsonl";
  if (normalized === "collection") return "collection";
  throw new Error(`Unsupported archive target "${value}". Use jsonl or collection.`);
}

function parsePositiveInt(value: string, name: string): number {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed > 0) return parsed;
  throw new Error(`--${name} must be a positive integer.`);
}

function parseNonNegativeInt(value: string, name: string): number {
  const parsed = Number(value);
  if (Number.isInteger(parsed) && parsed >= 0) return parsed;
  throw new Error(`--${name} must be a non-negative integer.`);
}

function parseBoolean(value: string): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return Boolean(value);
}

function rejectJoinedOption(key: string, value: string) {
  if (value.includes("--")) {
    throw new Error(`Invalid --${key} value "${value}". Add a space before the next --option.`);
  }
}

function logProgressIfNeeded(result: TrimProjectChartLongRangesResult, options: TrimProjectChartLongRangesOptions): void {
  if (!options.progressEvery || result.scannedDocs % options.progressEvery !== 0) return;
  console.error(
    `[chart-trim] scanned=${result.scannedDocs} archived=${result.archivedDocs} unset=${result.unsetDocs} ` +
      `approxLongRangeBytes=${result.totalLongRangeBsonBytes}`,
  );
}

async function main(): Promise<void> {
  const options = parseTrimProjectChartLongRangesArgs(process.argv.slice(2));
  if (options.help) {
    console.log(helpText());
    return;
  }

  validateTrimProjectChartLongRangesOptions(options);

  const modeForLog = options.mode;
  console.error(
    `[chart-trim] starting mode=${modeForLog} batchSize=${options.batchSize} limit=${options.limit || "none"} skip=${options.skip}`,
  );

  await mongoose.connect(buildMongoUri(), {
    maxPoolSize: Number(process.env.DB_MAX_POOL_SIZE || 10),
    minPoolSize: Number(process.env.DB_MIN_POOL_SIZE || 0),
  });

  try {
    const result = await runTrimProjectChartLongRanges(mongoose.connection.db, options);
    console.error("[chart-trim] completed");
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongoose.disconnect();
    console.error("[chart-trim] closed db connection");
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[chart-trim] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
