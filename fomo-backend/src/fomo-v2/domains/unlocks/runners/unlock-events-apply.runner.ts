import { NestFactory } from "@nestjs/core";
import { FomoV2DryRunCliModule } from "../../../fomo-v2-dry-run-cli.module";
import {
  FomoV2UnlockEventApplyOptions,
  FomoV2UnlockEventApplyService,
} from "../services";

type RunnerArgs = FomoV2UnlockEventApplyOptions & {
  write: boolean;
  dryRun: boolean;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const runMode = args.write ? "write" : "dry-run";
  logProgress(
    `starting ${runMode} limit=${args.limit ?? "default"} now=${
      args.now || "current"
    } canonicalProjectId=${args.canonicalProjectId || "any"} sourceType=${
      args.sourceType || "any"
    }`
  );

  const app = await NestFactory.createApplicationContext(FomoV2DryRunCliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(FomoV2UnlockEventApplyService);
    const result = await service.run(args);
    logProgress("completed");
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): RunnerArgs {
  const args: RunnerArgs = {
    write: false,
    dryRun: true,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "limit") {
      args.limit = parsePositiveInteger(value, "limit");
    } else if (key === "now") {
      args.now = parseDate(value, "now");
    } else if (
      key === "canonical-project-id" ||
      key === "canonicalprojectid"
    ) {
      args.canonicalProjectId = value;
    } else if (key === "source" || key === "sourcetype" || key === "source-type") {
      args.sourceType = cleanSourceType(value);
    } else if (key === "max-attempts" || key === "maxattempts") {
      args.maxAttempts = parsePositiveInteger(value, "max-attempts");
    } else if (key === "write" || key === "apply") {
      args.write = parseBoolean(value);
      args.dryRun = !args.write;
    } else if (key === "dry-run" || key === "dryrun") {
      if (!parseBoolean(value)) {
        throw new Error("Use --write for unlock event apply write mode.");
      }
      args.write = false;
      args.dryRun = true;
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  return args;
}

function parsePositiveInteger(value: string, optionName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid --${optionName} value "${value}". Value must be greater than 0.`
    );
  }
  return Math.trunc(parsed);
}

function parseDate(value: string, optionName: string): Date {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error(`Invalid --${optionName} date "${value}".`);
  }
  return date;
}

function parseBoolean(value: string): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return Boolean(value);
}

function cleanSourceType(value: string): string {
  const sourceType = String(value || "").trim().toLowerCase();
  if (!sourceType) throw new Error("Invalid --source value.");
  return sourceType;
}

function logProgress(message: string): void {
  console.error(
    `[fomo-v2:unlock-events-apply] ${new Date().toISOString()} ${message}`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:unlock-events-apply] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
