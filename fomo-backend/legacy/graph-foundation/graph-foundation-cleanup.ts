import * as fs from "fs";
import * as path from "path";
import { Db } from "mongodb";

export const GRAPH_FOUNDATION_COLLECTIONS = [
  "canonical_projects",
  "canonical_project_links",
  "canonical_project_link_audit_logs",
  "project_candidates",
  "funding_round_participants",
  "funding_round_participant_audit_logs",
  "investor_candidates",
] as const;

export type GraphFoundationCollection = (typeof GRAPH_FOUNDATION_COLLECTIONS)[number];

export type GraphFoundationCleanupOptions = {
  dryRun?: boolean;
  apply?: boolean;
  confirmCleanup?: boolean;
  backup?: boolean;
  backupDir?: string;
};

export type GraphFoundationCleanupResult = {
  mode: "dry-run" | "apply";
  collections: Record<GraphFoundationCollection, number>;
  deleted: Record<GraphFoundationCollection, number>;
  afterCounts?: Record<GraphFoundationCollection, number>;
  backupDir?: string;
  warnings: string[];
};

export type GraphFoundationCleanupArgs = GraphFoundationCleanupOptions;

export function parseCleanupArgs(argv: string[]): GraphFoundationCleanupArgs {
  const args: GraphFoundationCleanupArgs = {
    dryRun: true,
    backup: true,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();
    rejectJoinedOption(key, value);

    if (key === "dry-run" || key === "dryrun") {
      args.dryRun = parseBoolean(value);
    } else if (key === "apply" || key === "write") {
      args.apply = parseBoolean(value);
      if (args.apply) args.dryRun = false;
    } else if (key === "confirm-cleanup" || key === "confirmcleanup") {
      args.confirmCleanup = parseBoolean(value);
    } else if (key === "backup") {
      args.backup = parseBoolean(value);
    } else if (key === "backup-dir" || key === "backupdir") {
      args.backupDir = value;
    } else {
      throw new Error(`Unknown option --${rawKey}. Refusing to run graph-foundation cleanup.`);
    }
  }

  return args;
}

export async function runGraphFoundationCleanup(
  db: Db,
  options: GraphFoundationCleanupOptions = {},
): Promise<GraphFoundationCleanupResult> {
  const counts = await countGraphFoundationCollections(db);
  const apply = Boolean(options.apply && options.confirmCleanup && options.dryRun !== true);
  const result: GraphFoundationCleanupResult = {
    mode: apply ? "apply" : "dry-run",
    collections: counts,
    deleted: emptyCollectionCounts(),
    warnings: [
      "Only additive graph/candidate/participant collections are included.",
      "Legacy collections are not touched: projects, fundingrounds, tokenunlocks, funds, persons, investors, project_intel, project_unlocks.",
    ],
  };

  if (!apply) {
    if (options.apply && !options.confirmCleanup) {
      result.warnings.push("Apply requested without --confirm-cleanup=true; forced to dry-run.");
    }
    return result;
  }

  if (options.backup !== false) {
    const backupDir = options.backupDir || defaultBackupDir();
    await backupGraphFoundationCollections(db, backupDir);
    result.backupDir = backupDir;
  }

  for (const collectionName of GRAPH_FOUNDATION_COLLECTIONS) {
    const deleteResult = await db.collection(collectionName).deleteMany({});
    result.deleted[collectionName] = deleteResult.deletedCount || 0;
  }

  result.afterCounts = await countGraphFoundationCollections(db);
  return result;
}

async function countGraphFoundationCollections(db: Db): Promise<Record<GraphFoundationCollection, number>> {
  const counts = emptyCollectionCounts();
  await Promise.all(
    GRAPH_FOUNDATION_COLLECTIONS.map(async (collectionName) => {
      counts[collectionName] = await db.collection(collectionName).countDocuments({});
    }),
  );
  return counts;
}

async function backupGraphFoundationCollections(db: Db, backupDir: string): Promise<void> {
  fs.mkdirSync(backupDir, { recursive: true });
  for (const collectionName of GRAPH_FOUNDATION_COLLECTIONS) {
    const docs = await db.collection(collectionName).find({}).toArray();
    fs.writeFileSync(path.join(backupDir, `${collectionName}.json`), JSON.stringify(docs, null, 2));
  }
}

function emptyCollectionCounts(): Record<GraphFoundationCollection, number> {
  return Object.fromEntries(GRAPH_FOUNDATION_COLLECTIONS.map((collectionName) => [collectionName, 0])) as Record<
    GraphFoundationCollection,
    number
  >;
}

function defaultBackupDir(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.resolve(process.cwd(), "backups", "graph-foundation-cleanup", timestamp);
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
