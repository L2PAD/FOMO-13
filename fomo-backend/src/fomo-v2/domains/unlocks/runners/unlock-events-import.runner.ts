import { NestFactory } from "@nestjs/core";
import { FomoV2DryRunCliModule } from "../../../fomo-v2-dry-run-cli.module";
import { normalizeProjectSourceType } from "../../../shared/source-policy";
import {
  assertNoParserImportExecutionErrors,
  assertParserImportSafety,
  parseStrictBoolean,
} from "../../../runners/parser-import-runner.utils";
import {
  FomoV2UnlockEventsImportMode,
  FomoV2UnlockEventsImportOptions,
  FomoV2UnlockEventsImportService,
} from "../services";

type RunnerArgs = FomoV2UnlockEventsImportOptions & {
  source: string;
  mode: FomoV2UnlockEventsImportMode;
  write: boolean;
  confirmWrite: boolean;
  allConfirmed: boolean;
  dryRun: boolean;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const runMode = args.write ? "write" : "dry-run";
  logProgress(
    `starting ${runMode} source=${args.source} mode=${args.mode} limit=${
      args.limit ?? "default"
    } skip=${args.skip ?? 0} canonicalProjectId=${
      args.canonicalProjectId || "any"
    }`
  );

  const app = await NestFactory.createApplicationContext(
    FomoV2DryRunCliModule,
    {
      logger: ["error", "warn"],
    }
  );

  try {
    const service = app.get(FomoV2UnlockEventsImportService);
    const result = await service.run(args);
    console.log(JSON.stringify(result, null, 2));
    assertNoParserImportExecutionErrors(result, "Unlock events import");
    logProgress("completed");
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): RunnerArgs {
  const args: RunnerArgs = {
    source: "dropstab",
    mode: "next-only",
    write: false,
    confirmWrite: false,
    allConfirmed: false,
    dryRun: true,
  };
  let limitProvided = false;

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "limit") {
      args.limit = parsePositiveInteger(value, "limit");
      limitProvided = true;
    } else if (key === "skip") {
      args.skip = parseNonNegativeInteger(value, "skip");
    } else if (
      key === "source" ||
      key === "sourcetype" ||
      key === "source-type"
    ) {
      args.source = cleanSourceType(value);
      args.sourceType = args.source;
    } else if (key === "mode") {
      args.mode = cleanMode(value);
    } else if (key === "canonical-project-id" || key === "canonicalprojectid") {
      args.canonicalProjectId = value;
    } else if (key === "write" || key === "apply") {
      args.write = parseStrictBoolean(value, rawKey);
      args.dryRun = !args.write;
    } else if (key === "confirm-write" || key === "confirmwrite") {
      args.confirmWrite = parseStrictBoolean(value, rawKey);
    } else if (key === "all") {
      args.all = parseStrictBoolean(value, rawKey);
      if (args.all) args.limit = undefined;
    } else if (key === "all-confirmed" || key === "allconfirmed") {
      args.allConfirmed = parseStrictBoolean(value, rawKey);
    } else if (key === "dry-run" || key === "dryrun") {
      if (!parseStrictBoolean(value, rawKey)) {
        throw new Error("Use --write for unlock events write mode.");
      }
      args.write = false;
      args.dryRun = true;
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  assertParserImportSafety({
    label: "Unlock events import",
    write: args.write,
    confirmWrite: args.confirmWrite,
    all: args.all,
    allConfirmed: args.allConfirmed,
  });
  if (args.write && !limitProvided && !args.allConfirmed) {
    throw new Error(
      "Unlock events write mode requires --limit or --all-confirmed=true."
    );
  }
  if (!limitProvided && !args.all) args.limit = 100;
  args.sourceType = args.source;
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

function parseNonNegativeInteger(value: string, optionName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(
      `Invalid --${optionName} value "${value}". Value must be 0 or greater.`
    );
  }
  return Math.trunc(parsed);
}

function cleanSourceType(value: string): string {
  const sourceType = normalizeProjectSourceType(value);
  if (!sourceType) throw new Error("Invalid --source value.");
  return sourceType;
}

function cleanMode(value: string): FomoV2UnlockEventsImportMode {
  const mode = String(value || "")
    .trim()
    .toLowerCase();
  if (["next-only", "provider-events", "all"].includes(mode)) {
    return mode as FomoV2UnlockEventsImportMode;
  }
  throw new Error(
    `Invalid --mode value "${value}". Use next-only, provider-events, or all.`
  );
}

function logProgress(message: string): void {
  console.error(
    `[fomo-v2:unlock-events-import] ${new Date().toISOString()} ${message}`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:unlock-events-import] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
