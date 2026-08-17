import "dotenv/config";
import mongoose from "mongoose";
import { buildMongoUri } from "src/config/mongo.config";
import { parseCleanupArgs, runGraphFoundationCleanup } from "./graph-foundation-cleanup";

async function main(): Promise<void> {
  const args = parseCleanupArgs(process.argv.slice(2));
  const uri = buildMongoUri();
  const mode = args.apply && args.confirmCleanup && args.dryRun !== true ? "apply" : "dry-run";
  logProgress(`starting mode=${mode} backup=${args.backup !== false}`);

  await mongoose.connect(uri, {
    maxPoolSize: Number(process.env.DB_MAX_POOL_SIZE || 10),
    minPoolSize: Number(process.env.DB_MIN_POOL_SIZE || 0),
  });

  try {
    const result = await runGraphFoundationCleanup(mongoose.connection.db, args);
    logProgress("completed");
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await mongoose.disconnect();
    logProgress("closed db connection");
  }
}

function logProgress(message: string) {
  console.error(`[graph-foundation:cleanup] ${new Date().toISOString()} ${message}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[graph-foundation:cleanup] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
