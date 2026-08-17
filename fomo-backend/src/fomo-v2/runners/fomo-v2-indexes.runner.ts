import { NestFactory } from "@nestjs/core";
import { FomoV2CliModule } from "../fomo-v2-cli.module";
import { FomoV2IndexService, FomoV2MigrationRunWriterService } from "../services";
import { parseStrictBoolean } from "./parser-import-runner.utils";

type IndexRunnerArgs = {
  force: boolean;
  confirmWrite: boolean;
};

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const dbName = String(process.env.DB_NAME || "fomoland").trim() || "fomoland";
  assertIndexWriteSafety(args, {
    dbName,
    nodeEnv: process.env.NODE_ENV,
  });

  logProgress(`starting index runner dbName=${dbName}`);
  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });

  let migrationRunId = "";
  try {
    const migrationRuns = app.get(FomoV2MigrationRunWriterService);
    const indexService = app.get(FomoV2IndexService);
    const run = await migrationRuns.startRun({
      type: "schema_indexes",
      dryRun: false,
      dbName,
      options: {
        force: args.force,
        confirmWrite: args.confirmWrite,
      },
      metadata: { runner: "fomo-v2:indexes" },
    });
    migrationRunId = run.id;
    logProgress(`migrationRunId=${run.id}`);

    const result = await indexService.ensureIndexes(args);
    await migrationRuns.completeRun(run.id, {
      collections: result.collections.map((collection) => ({
        collection: collection.collection,
        declaredIndexes: collection.declaredIndexes.length,
        createdIndexes: collection.createdIndexes,
        droppedIndexes: collection.droppedIndexes,
      })),
    }, { dbName: result.dbName });

    logProgress("completed");
    console.log(JSON.stringify({ ...result, migrationRunId: run.id, migrationRunKey: run.runKey }, null, 2));
  } catch (error) {
    if (migrationRunId) {
      const migrationRuns = app.get(FomoV2MigrationRunWriterService);
      await migrationRuns.failRun(migrationRunId, error);
    }
    throw error;
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): IndexRunnerArgs {
  const args: IndexRunnerArgs = { force: false, confirmWrite: false };
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "force") {
      args.force = parseStrictBoolean(value, "force");
    } else if (key === "confirm-write") {
      args.confirmWrite = parseStrictBoolean(value, "confirm-write");
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }
  return args;
}

export function assertIndexWriteSafety(
  args: IndexRunnerArgs,
  environment: { dbName: string; nodeEnv?: string }
): void {
  if (!args.confirmWrite) {
    throw new Error(
      "FOMO v2 index migration requires --confirm-write=true."
    );
  }
  const production =
    String(environment.nodeEnv || "").trim().toLowerCase() === "production";
  if ((production || environment.dbName === "fomoland") && !args.force) {
    throw new Error(
      `Refusing to replace FOMO v2 indexes on ${production ? "production" : "DB_NAME=fomoland"} without --force=true.`
    );
  }
}

function logProgress(message: string) {
  console.error(`[fomo-v2:indexes] ${new Date().toISOString()} ${message}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:indexes] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
