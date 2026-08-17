import { NestFactory } from "@nestjs/core";
import { FomoV2DryRunCliModule } from "../../../fomo-v2-dry-run-cli.module";
import {
  assertNoParserImportExecutionErrors,
  assertParserImportSafety,
  parseStrictBoolean,
} from "../../../runners/parser-import-runner.utils";
import {
  FomoV2IntelFundraisingGapFillDryRunService,
  IntelFundraisingGapFillDryRunOptions,
} from "../services";

type RunnerArgs = IntelFundraisingGapFillDryRunOptions & {
  debug: boolean;
  all?: boolean;
  write: boolean;
  confirmWrite: boolean;
  participantsOnly: boolean;
  feedRounds: boolean;
  allConfirmed: boolean;
  canonicalMarketlessOnly: boolean;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.write ? "write" : "dry-run";
  const writeMode = args.participantsOnly
    ? "participants-only"
    : args.feedRounds
    ? "feed-rounds"
    : "dry-run";
  logProgress(
    `starting ${mode} writeMode=${writeMode} sourceFilter=${
      args.sourceType || "all"
    } limit=${
      args.all ? "all" : args.limit || "default"
    } sourceDocumentIds=${
      args.sourceDocumentIds?.length || 0
    } canonicalMarketlessOnly=${args.canonicalMarketlessOnly} debug=${
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
    const service = app.get(FomoV2IntelFundraisingGapFillDryRunService);
    const result = await service.run(args);
    console.log(JSON.stringify(result, null, 2));
    assertNoParserImportExecutionErrors(result, "Intel fundraising import");
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
    participantsOnly: false,
    feedRounds: false,
    allConfirmed: false,
    canonicalMarketlessOnly: false,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "limit") {
      args.limit = parsePositiveInteger(value, "limit");
      args.all = false;
    } else if (key === "all") {
      args.all = parseStrictBoolean(value, rawKey);
      if (args.all) args.limit = undefined;
    } else if (key === "all-confirmed" || key === "allconfirmed") {
      args.allConfirmed = parseStrictBoolean(value, rawKey);
    } else if (key === "debug") {
      args.debug = parseStrictBoolean(value, rawKey);
    } else if (key === "sourcetype" || key === "source-type") {
      args.sourceType = cleanSourceType(value);
    } else if (
      key === "source-document-ids" ||
      key === "sourcedocumentids" ||
      key === "source-document-id" ||
      key === "sourcedocumentid"
    ) {
      args.sourceDocumentIds = [
        ...(args.sourceDocumentIds || []),
        ...parseStringList(value, rawKey),
      ];
    } else if (key === "write" || key === "apply") {
      args.write = parseStrictBoolean(value, rawKey);
    } else if (key === "confirm-write" || key === "confirmwrite") {
      args.confirmWrite = parseStrictBoolean(value, rawKey);
    } else if (key === "participants-only" || key === "participantsonly") {
      args.participantsOnly = parseStrictBoolean(value, rawKey);
    } else if (key === "feed-rounds" || key === "feedrounds") {
      args.feedRounds = parseStrictBoolean(value, rawKey);
    } else if (
      key === "marketless-only" ||
      key === "marketlessonly" ||
      key === "canonical-marketless-only" ||
      key === "canonicalmarketlessonly"
    ) {
      args.canonicalMarketlessOnly = parseStrictBoolean(value, rawKey);
    } else if (key === "dry-run" || key === "dryrun") {
      if (!parseStrictBoolean(value, rawKey)) {
        throw new Error("Use --write for intel fundraising write mode.");
      }
      args.write = false;
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  assertParserImportSafety({
    label: "Intel fundraising import",
    write: args.write,
    confirmWrite: args.confirmWrite,
    all: args.all,
    allConfirmed: args.allConfirmed,
  });

  if (args.participantsOnly && args.feedRounds) {
    throw new Error(
      "Choose only one mode: --participants-only or --feed-rounds."
    );
  }
  if (args.write && !args.participantsOnly && !args.feedRounds) {
    throw new Error(
      "Intel fundraising --write requires --participants-only or --feed-rounds."
    );
  }
  if (args.write && args.limit === undefined && !args.allConfirmed) {
    throw new Error(
      "Intel fundraising --write requires --limit or --all-confirmed."
    );
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

function parseStringList(value: string, optionName: string): string[] {
  const values = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!values.length) {
    throw new Error(`Invalid --${optionName} value. Provide at least one id.`);
  }
  return values;
}

function cleanSourceType(value: string): string {
  const sourceType = String(value || "")
    .trim()
    .toLowerCase();
  if (!sourceType) throw new Error("Invalid --sourceType value.");
  return sourceType;
}

function logProgress(message: string): void {
  console.error(
    `[fomo-v2:intel-fundraising-gap-fill-dry-run] ${new Date().toISOString()} ${message}`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      `[fomo-v2:intel-fundraising-gap-fill-dry-run] ${error?.message || error}`
    );
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
