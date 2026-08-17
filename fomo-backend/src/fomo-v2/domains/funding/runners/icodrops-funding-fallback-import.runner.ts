import { NestFactory } from "@nestjs/core";
import { FomoV2DryRunCliModule } from "../../../fomo-v2-dry-run-cli.module";
import {
  assertNoParserImportExecutionErrors,
  assertParserImportSafety,
  parseStrictBoolean,
} from "../../../runners/parser-import-runner.utils";
import {
  FomoV2IcodropsFundingFallbackImportService,
  IcodropsFundingFallbackImportOptions,
} from "../services";

type RunnerArgs = IcodropsFundingFallbackImportOptions & {
  debug: boolean;
  write: boolean;
  confirmWrite: boolean;
  allConfirmed: boolean;
  all: boolean;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.write ? "write" : "dry-run";
  logProgress(
    `starting ${mode} limit=${args.all ? "all" : args.limit} debug=${
      args.debug
    }`
  );

  const app = await NestFactory.createApplicationContext(
    FomoV2DryRunCliModule,
    {
      logger: ["error", "warn"],
    }
  );

  try {
    const service = app.get(FomoV2IcodropsFundingFallbackImportService);
    const result = await service.run(args);
    console.log(JSON.stringify(result, null, 2));
    assertNoParserImportExecutionErrors(
      result,
      "ICODrops funding fallback import"
    );
    logProgress("completed");
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): RunnerArgs {
  const args: RunnerArgs = {
    debug: false,
    write: false,
    confirmWrite: false,
    all: false,
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
    } else if (key === "write" || key === "apply") {
      args.write = parseStrictBoolean(value, rawKey);
    } else if (key === "confirm-write" || key === "confirmwrite") {
      args.confirmWrite = parseStrictBoolean(value, rawKey);
    } else if (key === "dry-run" || key === "dryrun") {
      if (!parseStrictBoolean(value, rawKey)) {
        throw new Error(
          "Use --write for ICODrops funding fallback write mode."
        );
      }
      args.write = false;
    } else if (key === "source-type" || key === "sourcetype") {
      throw new Error(
        "ICODrops funding fallback importer is explicit and does not accept --source-type."
      );
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  assertParserImportSafety({
    label: "ICODrops funding fallback import",
    write: args.write,
    confirmWrite: args.confirmWrite,
    all: args.all,
    allConfirmed: args.allConfirmed,
  });
  if (args.write && args.limit === undefined && !args.allConfirmed) {
    throw new Error(
      "ICODrops funding fallback write mode requires --limit or --all-confirmed."
    );
  }

  if (!args.all && args.limit === undefined) args.limit = 100;
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

function logProgress(message: string): void {
  console.error(
    `[fomo-v2:icodrops-funding-fallback] ${new Date().toISOString()} ${message}`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      `[fomo-v2:icodrops-funding-fallback] ${error?.message || error}`
    );
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
