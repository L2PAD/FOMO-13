import { NestFactory } from "@nestjs/core";
import { FomoV2CliModule } from "../../../fomo-v2-cli.module";
import {
  assertNoParserImportExecutionErrors,
  assertParserImportSafety,
  parseStrictBoolean,
} from "../../../runners/parser-import-runner.utils";
import { IcoProjectProfileImportService } from "../services";

type RunnerArgs = {
  write: boolean;
  confirmWrite: boolean;
  debug: boolean;
  limit: number;
  all: boolean;
  allConfirmed: boolean;
  batchSize?: number;
  examplesLimit?: number;
  sourceType: string;
  allowCreateCanonicalProjects: boolean;
  includeLegacyMissingSource: boolean;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  logProgress(
    `starting mode=${args.write ? "write" : "dry-run"} sourceType=${
      args.sourceType
    } limit=${args.all ? "all" : args.limit} debug=${
      args.debug
    } allowCreateCanonicalProjects=${args.allowCreateCanonicalProjects}`
  );

  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(IcoProjectProfileImportService);
    const result = await service.run(args);
    console.log(JSON.stringify(result, null, 2));
    assertNoParserImportExecutionErrors(result, "ICO project profile import");
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
    debug: false,
    limit: 100,
    all: false,
    allConfirmed: false,
    sourceType: "icodrops",
    allowCreateCanonicalProjects: false,
    includeLegacyMissingSource: false,
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
    } else if (key === "debug") {
      args.debug = parseStrictBoolean(value, rawKey);
    } else if (key === "dry-run" || key === "dryrun") {
      args.write = !parseStrictBoolean(value, rawKey);
    } else if (key === "limit") {
      args.limit = parsePositiveInteger(value, rawKey);
    } else if (key === "all") {
      args.all = parseStrictBoolean(value, rawKey);
    } else if (key === "all-confirmed" || key === "allconfirmed") {
      args.allConfirmed = parseStrictBoolean(value, rawKey);
    } else if (key === "batch-size" || key === "batchsize") {
      args.batchSize = parsePositiveInteger(value, rawKey);
    } else if (key === "examples-limit" || key === "exampleslimit") {
      args.examplesLimit = parseNonNegativeInteger(value, rawKey);
    } else if (key === "source-type" || key === "sourcetype") {
      args.sourceType = parseNonEmptyString(value, rawKey).toLowerCase();
    } else if (
      key === "allow-create-canonical-projects" ||
      key === "allowcreatecanonicalprojects"
    ) {
      args.allowCreateCanonicalProjects = parseStrictBoolean(value, rawKey);
    } else if (
      key === "include-legacy-missing-source" ||
      key === "includelegacymissingsource"
    ) {
      args.includeLegacyMissingSource = parseStrictBoolean(value, rawKey);
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  assertParserImportSafety({
    label: "ICO project profile import",
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

function parseNonNegativeInteger(value: string, optionName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(
      `Invalid --${optionName} value "${value}". Value must be 0 or greater.`
    );
  }
  return Math.trunc(parsed);
}

function parseNonEmptyString(value: string, optionName: string): string {
  const text = String(value || "").trim();
  if (!text)
    throw new Error(`Invalid --${optionName} value. Value must not be empty.`);
  return text;
}

function logProgress(message: string): void {
  console.error(
    `[fomo-v2:ico-project-profile-import] ${new Date().toISOString()} ${message}`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      `[fomo-v2:ico-project-profile-import] ${error?.message || error}`
    );
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
