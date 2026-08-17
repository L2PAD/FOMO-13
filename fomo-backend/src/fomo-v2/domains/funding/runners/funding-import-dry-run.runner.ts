import { NestFactory } from "@nestjs/core";
import { FomoV2DryRunCliModule } from "../../../fomo-v2-dry-run-cli.module";
import { normalizeProjectSourceType } from "../../../shared/source-policy";
import {
  assertNoParserImportExecutionErrors,
  assertParserImportSafety,
  parseStrictBoolean,
} from "../../../runners/parser-import-runner.utils";
import {
  FomoV2FundingImportDryRunService,
  FundingImportDryRunOptions,
} from "../services";

type RunnerArgs = Pick<
  FundingImportDryRunOptions,
  "limit" | "debug" | "sourceType" | "enrichOnly" | "project" | "snapshotId"
> & {
  debug: boolean;
  sourceType: string;
  write: boolean;
  confirmWrite: boolean;
  enrichOnly: boolean;
};

const SUPPORTED_SOURCE_TYPES = ["dropstab"] as const;
export const ICODROPS_GENERIC_FUNDING_BLOCKED_MESSAGE =
  "ICODrops funding is only allowed via explicit ico funding fallback flow";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.write ? "write" : "dry-run";

  logProgress(
    `starting ${mode} sourceType=${args.sourceType} limit=${args.limit} debug=${
      args.debug
    } enrichOnly=${args.enrichOnly} project=${args.project || ""}`
  );

  const app = await NestFactory.createApplicationContext(
    FomoV2DryRunCliModule,
    {
      logger: ["error", "warn"],
    }
  );

  try {
    const service = app.get(FomoV2FundingImportDryRunService);
    const result = await service.run(args);
    console.log(JSON.stringify(result, null, 2));
    assertNoParserImportExecutionErrors(result, "Funding import");
    logProgress("completed");
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): RunnerArgs {
  const args: RunnerArgs = {
    debug: false,
    enrichOnly: false,
    sourceType: "dropstab",
    write: false,
    confirmWrite: false,
  };
  let enrichOnlyExplicit = false;

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "limit") {
      args.limit = parsePositiveInteger(value, "limit");
    } else if (key === "debug") {
      args.debug = parseStrictBoolean(value, rawKey);
    } else if (key === "sourcetype" || key === "source-type") {
      args.sourceType = cleanSourceType(value);
    } else if (key === "project" || key === "slug") {
      args.project = cleanProjectFilter(value);
    } else if (key === "snapshotid" || key === "snapshot-id") {
      args.snapshotId = cleanSnapshotId(value);
    } else if (key === "write" || key === "apply") {
      args.write = parseStrictBoolean(value, rawKey);
      if (args.write && !enrichOnlyExplicit) args.enrichOnly = true;
    } else if (key === "confirm-write" || key === "confirmwrite") {
      args.confirmWrite = parseStrictBoolean(value, rawKey);
    } else if (key === "dry-run" || key === "dryrun") {
      if (!parseStrictBoolean(value, rawKey)) {
        throw new Error("Use --write for funding write mode.");
      }
      args.write = false;
    } else if (key === "enrichonly" || key === "enrich-only") {
      args.enrichOnly = parseStrictBoolean(value, rawKey);
      enrichOnlyExplicit = true;
    } else if (key === "fullimport" || key === "full-import") {
      args.enrichOnly = !parseStrictBoolean(value, rawKey);
      enrichOnlyExplicit = true;
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  assertParserImportSafety({
    label: "Funding import",
    write: args.write,
    confirmWrite: args.confirmWrite,
  });

  if (args.write && args.limit === undefined) {
    throw new Error("Funding write mode requires --limit.");
  }
  if (args.write && !args.snapshotId) {
    throw new Error("Funding write mode requires --snapshot-id.");
  }

  return { ...args, limit: args.limit ?? 100 };
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

function cleanProjectFilter(value: string): string {
  const text = String(value || "").trim();
  if (!text) throw new Error("Invalid --project value.");
  return text;
}

function cleanSnapshotId(value: string): string {
  const text = String(value || "").trim();
  if (!text || !/^[a-zA-Z0-9][a-zA-Z0-9:_.-]*$/.test(text)) {
    throw new Error("Invalid --snapshot-id value.");
  }
  return text;
}

function cleanSourceType(value: string): string {
  const sourceType = normalizeProjectSourceType(value);
  if (!sourceType) throw new Error("Invalid --sourceType value.");
  if (sourceType === "icodrops") {
    throw new Error(ICODROPS_GENERIC_FUNDING_BLOCKED_MESSAGE);
  }
  if (!(SUPPORTED_SOURCE_TYPES as readonly string[]).includes(sourceType)) {
    throw new Error(
      `Unsupported funding sourceType "${sourceType}". Generic funding-import supports only: ${SUPPORTED_SOURCE_TYPES.join(
        ", "
      )}. Use fomo-v2:icodrops-funding-fallback for ICODrops funding fallback.`
    );
  }
  return sourceType;
}

function logProgress(message: string): void {
  console.error(
    `[fomo-v2:funding-import] ${new Date().toISOString()} ${message}`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:funding-import] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
