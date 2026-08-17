import { NestFactory } from "@nestjs/core";
import { FomoV2DryRunCliModule } from "../../../fomo-v2-dry-run-cli.module";
import {
  assertNoParserImportExecutionErrors,
  assertParserImportSafety,
  parseStrictBoolean,
} from "../../../runners/parser-import-runner.utils";
import {
  FomoV2UnlocksMode,
  FomoV2VestingImportOptions,
  FomoV2VestingImportService,
} from "../services";

type RunnerArgs = FomoV2VestingImportOptions & {
  debug: boolean;
  sourceType: string;
  write: boolean;
  confirmWrite: boolean;
  allConfirmed: boolean;
  all: boolean;
  includeUnlocks: boolean;
  unlocksMode: FomoV2UnlocksMode;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  assertLegacyVestingWriteEnabled(args, process.env);
  const mode = args.write ? "write" : "dry-run";
  logProgress(
    `starting ${mode} sourceType=${args.sourceType} limit=${
      args.limit ?? "all"
    } sourceSlug=${args.sourceSlug || "any"} sourceProjectId=${
      args.sourceProjectId || "any"
    } debug=${args.debug} includeUnlocks=${args.includeUnlocks} unlocksMode=${
      args.unlocksMode
    }`
  );

  const app = await NestFactory.createApplicationContext(
    FomoV2DryRunCliModule,
    {
      logger: ["error", "warn"],
    }
  );

  try {
    const service = app.get(FomoV2VestingImportService);
    const result = await service.run(args);
    console.log(JSON.stringify(result, null, 2));
    assertNoParserImportExecutionErrors(result, "Vesting import");
    logProgress("completed");
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): RunnerArgs {
  const args: RunnerArgs = {
    debug: false,
    sourceType: "dropstab",
    write: false,
    confirmWrite: false,
    all: false,
    includeUnlocks: false,
    unlocksMode: "none",
    allConfirmed: false,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "limit") {
      args.limit = parsePositiveInteger(value, "limit");
    } else if (key === "all") {
      args.all = parseStrictBoolean(value, rawKey);
    } else if (key === "all-confirmed" || key === "allconfirmed") {
      args.allConfirmed = parseStrictBoolean(value, rawKey);
    } else if (key === "debug") {
      args.debug = parseStrictBoolean(value, rawKey);
    } else if (key === "sourcetype" || key === "source-type") {
      args.sourceType = cleanSourceType(value);
    } else if (
      key === "source-slug" ||
      key === "sourceslug" ||
      key === "project"
    ) {
      args.sourceSlug = cleanOptionalString(value);
    } else if (
      key === "source-project-id" ||
      key === "sourceprojectid" ||
      key === "currency-id" ||
      key === "currencyid"
    ) {
      args.sourceProjectId = cleanOptionalString(value);
    } else if (key === "include-unlocks" || key === "includeunlocks") {
      args.includeUnlocks = parseStrictBoolean(value, rawKey);
    } else if (key === "unlocks-mode" || key === "unlocksmode") {
      args.unlocksMode = cleanUnlocksMode(value);
    } else if (key === "write" || key === "apply") {
      args.write = parseStrictBoolean(value, rawKey);
    } else if (key === "confirm-write" || key === "confirmwrite") {
      args.confirmWrite = parseStrictBoolean(value, rawKey);
    } else if (key === "dry-run" || key === "dryrun") {
      if (!parseStrictBoolean(value, rawKey)) {
        throw new Error("Use --write for vesting write mode.");
      }
      args.write = false;
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  assertParserImportSafety({
    label: "Vesting import",
    write: args.write,
    confirmWrite: args.confirmWrite,
    all: args.all,
    allConfirmed: args.allConfirmed,
  });
  if (args.write && args.limit === undefined && !args.allConfirmed) {
    throw new Error("Vesting write mode requires --limit or --all-confirmed.");
  }

  if (!args.all && args.limit === undefined) args.limit = 100;
  return args;
}

/**
 * The allocation/schedule importer is the authoritative write path. The
 * legacy all-in-one importer remains available for dry-run diagnostics and an
 * explicitly enabled recovery window only.
 */
export function assertLegacyVestingWriteEnabled(
  args: Pick<RunnerArgs, "write">,
  env: NodeJS.ProcessEnv = process.env
): void {
  if (!args.write) return;
  const enabled = ["1", "true"].includes(
    String(env.FOMO_V2_LEGACY_VESTING_WRITE_ENABLED || "")
      .trim()
      .toLowerCase()
  );
  if (!enabled) {
    throw new Error(
      "Legacy vesting write pipeline is disabled. Use fomo-v2:vesting-allocation-schedule-import or explicitly enable FOMO_V2_LEGACY_VESTING_WRITE_ENABLED=true for controlled recovery."
    );
  }
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

function cleanSourceType(value: string): string {
  const sourceType = String(value || "")
    .trim()
    .toLowerCase();
  if (!sourceType) throw new Error("Invalid --sourceType value.");
  return sourceType;
}

function cleanOptionalString(value: string): string {
  return String(value || "").trim();
}

function cleanUnlocksMode(value: string): FomoV2UnlocksMode {
  const mode = String(value || "")
    .trim()
    .toLowerCase();
  if (["none", "daily", "monthly", "next-only"].includes(mode)) {
    return mode as FomoV2UnlocksMode;
  }
  throw new Error(
    `Invalid --unlocks-mode value "${value}". Use daily, monthly, next-only, or none.`
  );
}

function logProgress(message: string): void {
  console.error(
    `[fomo-v2:vesting-import] ${new Date().toISOString()} ${message}`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:vesting-import] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
