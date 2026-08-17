import { NestFactory } from "@nestjs/core";
import { FomoV2DryRunCliModule } from "../../../fomo-v2-dry-run-cli.module";
import {
  assertNoParserImportExecutionErrors,
  assertParserImportSafety,
  parseStrictBoolean,
} from "../../../runners/parser-import-runner.utils";
import { FomoV2ActivitySourceSplitRemediationService } from "../services";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

export interface ActivitySourceSplitRunnerArgs {
  write: boolean;
  confirmWrite: boolean;
  all: boolean;
  allConfirmed: boolean;
  limit?: number;
  cursor?: string;
}

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  logProgress(
    `starting mode=${args.write ? "write" : "dry-run"} scope=${
      args.all ? "all" : `limit:${args.limit}`
    }`
  );
  const app = await NestFactory.createApplicationContext(
    FomoV2DryRunCliModule,
    { logger: ["error", "warn"] }
  );

  try {
    const service = app.get(FomoV2ActivitySourceSplitRemediationService);
    // Service preflight verifies both topology and the absence of the old
    // global parserActivityId unique index before any write transaction opens.
    const result = await service.run(args);
    console.log(JSON.stringify(result, null, 2));
    assertNoParserImportExecutionErrors(
      result,
      "Activity source split remediation"
    );
    logProgress("completed");
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): ActivitySourceSplitRunnerArgs {
  const args: ActivitySourceSplitRunnerArgs = {
    write: false,
    confirmWrite: false,
    all: false,
    allConfirmed: false,
    limit: DEFAULT_LIMIT,
  };
  let limitProvided = false;

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const rawOption = arg.slice(2);
    const hasExplicitValue = rawOption.includes("=");
    const [rawKey, rawValue = "true"] = rawOption.split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "write") {
      requireExplicitBoolean(hasExplicitValue, "write");
      args.write = parseStrictBoolean(value, rawKey);
    } else if (key === "confirm-write") {
      requireExplicitBoolean(hasExplicitValue, "confirm-write");
      args.confirmWrite = parseStrictBoolean(value, rawKey);
    } else if (key === "all") {
      requireExplicitBoolean(hasExplicitValue, "all");
      args.all = parseStrictBoolean(value, rawKey);
    } else if (key === "all-confirmed") {
      requireExplicitBoolean(hasExplicitValue, "all-confirmed");
      args.allConfirmed = parseStrictBoolean(value, rawKey);
    } else if (key === "limit") {
      args.limit = parseLimit(value);
      limitProvided = true;
    } else if (key === "cursor") {
      if (!/^[a-f0-9]{24}$/i.test(value)) {
        throw new Error("Invalid --cursor value. Use a MongoDB ObjectId.");
      }
      args.cursor = value.toLowerCase();
    } else if (key === "dry-run" || key === "dryrun") {
      if (!parseStrictBoolean(value, rawKey)) {
        throw new Error(
          "Use --write=true for activity source split write mode."
        );
      }
      args.write = false;
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  if (args.all && limitProvided) {
    throw new Error("Use either --limit or --all=true, not both.");
  }
  if (args.all && args.cursor) {
    throw new Error("Use either --cursor or --all=true, not both.");
  }
  assertParserImportSafety({
    label: "Activity source split remediation",
    write: args.write,
    confirmWrite: args.confirmWrite,
    all: args.all,
    allConfirmed: args.allConfirmed,
  });
  if (args.all) args.limit = undefined;
  else if (!limitProvided) args.limit = DEFAULT_LIMIT;
  return args;
}

function requireExplicitBoolean(
  hasExplicitValue: boolean,
  optionName: string
): void {
  if (!hasExplicitValue) {
    throw new Error(
      `Use explicit --${optionName}=true or --${optionName}=false.`
    );
  }
}

function parseLimit(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
    throw new Error(
      `Invalid --limit value "${value}". Use an integer from 1 to ${MAX_LIMIT}.`
    );
  }
  return parsed;
}

function logProgress(message: string): void {
  console.error(
    `[fomo-v2:activity-source-split] ${new Date().toISOString()} ${message}`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:activity-source-split] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
