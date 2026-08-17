import { NestFactory } from "@nestjs/core";
import {
  FundingRoundParticipantBackfillOptions,
  FundingRoundParticipantService,
} from "./services/funding-round-participant.service";
import { FundingRoundParticipantsCliModule } from "./funding-round-participants-cli.module";

type RunnerArgs = FundingRoundParticipantBackfillOptions;

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  logProgress(
    `starting mode=${args.apply && args.confirmApply ? "apply" : "dry-run"} scanLimit=${args.scanLimit ?? "all"} roundId=${args.roundId || "all"} progressEvery=${args.progressEvery ?? 10} concurrency=${args.concurrency ?? 1} writeAuditLogs=${args.writeAuditLogs === true}`,
  );

  const app = await NestFactory.createApplicationContext(FundingRoundParticipantsCliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(FundingRoundParticipantService);
    const summary = await service.runBackfill(args);
    logProgress("completed");
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

function parseArgs(argv: string[]): RunnerArgs {
  const args: RunnerArgs = { dryRun: true };

  for (const rawArg of argv) {
    if (!rawArg.startsWith("--")) continue;
    const [rawKey, rawValue] = rawArg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue === undefined ? "true" : rawValue;

    if (key === "dry-run" || key === "dryrun") args.dryRun = parseBoolean(value);
    else if (key === "apply") args.apply = parseBoolean(value);
    else if (key === "confirm-apply" || key === "confirmapply") args.confirmApply = parseBoolean(value);
    else if (key === "write-audit-logs" || key === "writeauditlogs" || key === "audit-logs" || key === "auditlogs")
      args.writeAuditLogs = parseBoolean(value);
    else if (key === "scan-limit" || key === "scanlimit" || key === "limit") args.scanLimit = parseNumber(value);
    else if (key === "round-id" || key === "roundid") args.roundId = value;
    else if (key === "progress-every" || key === "progressevery") args.progressEvery = parseNumber(value);
    else if (key === "concurrency" || key === "parallelism") args.concurrency = parseNumber(value);
  }

  return args;
}

function parseBoolean(value: string): boolean {
  return ["true", "1", "yes", "y"].includes(String(value).trim().toLowerCase());
}

function parseNumber(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : undefined;
}

function logProgress(message: string) {
  console.error(`[funding-round-participants] ${new Date().toISOString()} ${message}`);
}

main().catch((error) => {
  console.error(`[funding-round-participants] ${error?.stack || error?.message || error}`);
  process.exitCode = 1;
});
