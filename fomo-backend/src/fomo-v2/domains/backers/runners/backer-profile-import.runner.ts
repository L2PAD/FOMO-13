import { NestFactory } from "@nestjs/core";
import { FomoV2CliModule } from "../../../fomo-v2-cli.module";
import {
  assertNoParserImportExecutionErrors,
  assertParserImportSafety,
  parseStrictBoolean,
} from "../../../runners/parser-import-runner.utils";
import { FomoV2BackerProfileImportService } from "../services";

type RunnerArgs = {
  write: boolean;
  confirmWrite: boolean;
  all: boolean;
  allConfirmed: boolean;
  debug: boolean;
  limit?: number;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  logProgress(
    `starting mode=${args.write ? "write" : "dry-run"} sourceType=intel limit=${
      args.all ? "all" : args.limit
    } debug=${args.debug}`
  );

  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(FomoV2BackerProfileImportService);
    const result = await service.run(args);
    console.log(JSON.stringify(result, null, 2));
    assertNoParserImportExecutionErrors(result, "Backer profile import");
    logProgress("completed");
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): RunnerArgs {
  const args: RunnerArgs = {
    write: false,
    confirmWrite: false,
    all: false,
    allConfirmed: false,
    debug: false,
    limit: 100,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "write" || key === "apply") {
      args.write = parseStrictBoolean(value, rawKey);
    } else if (key === "confirm-write" || key === "confirmwrite") {
      args.confirmWrite = parseStrictBoolean(value, rawKey);
    } else if (key === "dry-run" || key === "dryrun") {
      args.write = !parseStrictBoolean(value, rawKey);
    } else if (key === "debug") {
      args.debug = parseStrictBoolean(value, rawKey);
    } else if (key === "limit") {
      args.limit = parsePositiveInteger(value, rawKey);
      args.all = false;
    } else if (key === "all") {
      args.all = parseStrictBoolean(value, rawKey);
      if (args.all) args.limit = undefined;
      else if (args.limit === undefined) args.limit = 100;
    } else if (key === "all-confirmed" || key === "allconfirmed") {
      args.allConfirmed = parseStrictBoolean(value, rawKey);
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  assertParserImportSafety({
    label: "Backer profile import",
    write: args.write,
    confirmWrite: args.confirmWrite,
    all: args.all,
    allConfirmed: args.allConfirmed,
  });

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
    `[fomo-v2:backer-profile-import] ${new Date().toISOString()} ${message}`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:backer-profile-import] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
