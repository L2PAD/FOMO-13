import "dotenv/config";
import mongoose, { Types } from "mongoose";
import { buildMongoUri } from "src/config/mongo.config";

type RunnerMode = "dry-run" | "write";

const CLEANUP_MERGES = ["amplifyworld", "creatorbid", "exchangeart"] as const;
const REF_FIELDS = ["canonicalProjectId", "projectId", "canonicalId"] as const;
const CANONICAL_COLLECTION = "canonical_projects";

interface RunnerArgs {
  mode: RunnerMode;
}

interface CleanupPlanItem {
  normalizedName: string;
  source: Record<string, any> | null;
  target: Record<string, any> | null;
  errors: string[];
  plannedDeletes: Array<{
    collection: string;
    count: number;
    byField: Record<string, number>;
  }>;
  sourceCanonicalDeleteCount: number;
  targetRefCountsBefore: Record<string, number>;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  await mongoose.connect(buildMongoUri(), {
    maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || "10", 10),
    minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || "0", 10),
    autoIndex: false,
  });

  try {
    const db = mongoose.connection.db;
    const report = await buildReport(db);
    report.mode = args.mode;

    const errors = report.items.flatMap((item: CleanupPlanItem) => item.errors);
    if (args.mode === "write" && errors.length > 0) {
      report.applied = false;
      report.blocked = true;
      console.log(JSON.stringify(report, null, 2));
      process.exitCode = 1;
      return;
    }

    if (args.mode === "write") {
      report.writeResult = await applyCleanup(db, report.items);
      report.after = await verifyAfter(db, report.items);
      report.applied = true;
    } else {
      report.applied = false;
    }

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

async function buildReport(db: any): Promise<Record<string, any>> {
  const collectionNames = await listCollectionNames(db);
  const items: CleanupPlanItem[] = [];

  for (const normalizedName of CLEANUP_MERGES) {
    const source = await db.collection(CANONICAL_COLLECTION).findOne({
      normalizedName,
      hasMarketData: false,
    });
    const target = await db.collection(CANONICAL_COLLECTION).findOne({
      normalizedName,
      hasMarketData: true,
    });

    const item: CleanupPlanItem = {
      normalizedName,
      source: source ? summarizeCanonical(source) : null,
      target: target ? summarizeCanonical(target) : null,
      errors: [],
      plannedDeletes: [],
      sourceCanonicalDeleteCount: source ? 1 : 0,
      targetRefCountsBefore: {},
    };

    if (!source) item.errors.push("Missing source canonical with hasMarketData=false.");
    if (!target) item.errors.push("Missing target canonical with hasMarketData=true.");

    if (source) {
      item.plannedDeletes = await buildDeletePlan(db, collectionNames, source._id);
    }
    if (target) {
      item.targetRefCountsBefore = await countRefsByCollection(db, collectionNames, target._id);
    }

    items.push(item);
  }

  return {
    generatedAt: new Date().toISOString(),
    mode: "dry-run",
    applied: false,
    blocked: false,
    allowlist: CLEANUP_MERGES,
    refFields: REF_FIELDS,
    protected: {
      targetCanonical: "unchanged",
      xai: "not in cleanup allowlist",
    },
    items,
  };
}

async function buildDeletePlan(
  db: any,
  collectionNames: string[],
  sourceId: Types.ObjectId,
): Promise<CleanupPlanItem["plannedDeletes"]> {
  const deletes: CleanupPlanItem["plannedDeletes"] = [];

  for (const collectionName of collectionNames) {
    if (collectionName === CANONICAL_COLLECTION) continue;
    const collection = db.collection(collectionName);
    const filter = refFilter(sourceId);
    const count = await collection.countDocuments(filter);
    if (count === 0) continue;

    const byField: Record<string, number> = {};
    for (const field of REF_FIELDS) {
      byField[field] = await collection.countDocuments(refFieldFilter(field, sourceId));
    }

    deletes.push({ collection: collectionName, count, byField });
  }

  return deletes.sort((left, right) => left.collection.localeCompare(right.collection));
}

async function countRefsByCollection(
  db: any,
  collectionNames: string[],
  targetId: Types.ObjectId,
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const collectionName of collectionNames) {
    if (collectionName === CANONICAL_COLLECTION) continue;
    const count = await db.collection(collectionName).countDocuments(refFilter(targetId));
    if (count > 0) counts[collectionName] = count;
  }
  return counts;
}

async function applyCleanup(db: any, items: CleanupPlanItem[]): Promise<Record<string, any>> {
  const result: Record<string, any> = {};

  for (const item of items) {
    if (!item.source) continue;
    const sourceId = new Types.ObjectId(item.source._id);
    const itemResult: Record<string, any> = {
      deletedRefs: {},
      deletedSourceCanonical: 0,
    };

    for (const planned of item.plannedDeletes) {
      const deleteResult = await db.collection(planned.collection).deleteMany(refFilter(sourceId));
      itemResult.deletedRefs[planned.collection] = deleteResult.deletedCount || 0;
    }

    const canonicalDelete = await db.collection(CANONICAL_COLLECTION).deleteOne({
      _id: sourceId,
      hasMarketData: false,
    });
    itemResult.deletedSourceCanonical = canonicalDelete.deletedCount || 0;
    result[item.normalizedName] = itemResult;
  }

  return result;
}

async function verifyAfter(db: any, items: CleanupPlanItem[]): Promise<Record<string, any>> {
  const collectionNames = await listCollectionNames(db);
  const output: Record<string, any> = {};

  for (const item of items) {
    const sourceId = item.source?._id ? new Types.ObjectId(item.source._id) : null;
    const targetId = item.target?._id ? new Types.ObjectId(item.target._id) : null;
    output[item.normalizedName] = {
      sourceCanonicalExists: sourceId
        ? await db.collection(CANONICAL_COLLECTION).countDocuments({ _id: sourceId })
        : null,
      refsToSource: sourceId
        ? await countRefsByCollection(db, collectionNames, sourceId)
        : null,
      targetCanonicalExists: targetId
        ? await db.collection(CANONICAL_COLLECTION).countDocuments({ _id: targetId, hasMarketData: true })
        : null,
      targetRefCountsBefore: item.targetRefCountsBefore,
      targetRefCountsAfter: targetId
        ? await countRefsByCollection(db, collectionNames, targetId)
        : null,
    };
  }

  output.xai = {
    sourceCanonicalStillExists: await db.collection(CANONICAL_COLLECTION).countDocuments({
      normalizedName: "xai",
      hasMarketData: false,
    }),
    targetCanonicalStillExists: await db.collection(CANONICAL_COLLECTION).countDocuments({
      normalizedName: "xai",
      hasMarketData: true,
    }),
  };

  return output;
}

async function listCollectionNames(db: any): Promise<string[]> {
  const collections = await db.listCollections().toArray();
  return collections
    .map((collection: any) => String(collection.name))
    .filter((name: string) => !name.startsWith("system."));
}

function refFilter(id: Types.ObjectId): Record<string, any> {
  return {
    $or: REF_FIELDS.map((field) => refFieldFilter(field, id)),
  };
}

function refFieldFilter(field: string, id: Types.ObjectId): Record<string, any> {
  return {
    [field]: { $in: [id, id.toHexString()] },
  };
}

function summarizeCanonical(doc: Record<string, any>): Record<string, any> {
  return {
    _id: idString(doc._id),
    name: doc.name,
    slug: doc.slug,
    symbol: doc.symbol,
    normalizedName: doc.normalizedName,
    normalizedSymbol: doc.normalizedSymbol,
    status: doc.status,
    hasMarketData: doc.hasMarketData,
    providerIds: doc.providerIds || {},
  };
}

function idString(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value.toHexString === "function") return value.toHexString();
  return String(value);
}

function parseArgs(argv: string[]): RunnerArgs {
  const args: RunnerArgs = { mode: "dry-run" };
  for (const arg of argv) {
    if (arg === "--write" || arg === "--apply") {
      args.mode = "write";
    } else if (arg === "--dry-run") {
      args.mode = "dry-run";
    } else if (arg.startsWith("--mode=")) {
      const mode = arg.slice("--mode=".length);
      if (mode !== "dry-run" && mode !== "write") {
        throw new Error(`Invalid mode "${mode}".`);
      }
      args.mode = mode;
    } else if (arg.startsWith("--")) {
      throw new Error(`Unknown option ${arg}.`);
    }
  }
  return args;
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:controlled-canonical-project-cleanup] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
