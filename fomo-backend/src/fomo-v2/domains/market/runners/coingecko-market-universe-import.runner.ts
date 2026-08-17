import { NestFactory } from "@nestjs/core";
import { compactDryRunResult } from "./coingecko-market-universe-dry-run.runner";
import { FomoV2CliModule } from "../../../fomo-v2-cli.module";
import {
  CoinGeckoMarketUniverseDryRunService,
  CoinGeckoMarketUniverseImportService,
} from "../services";

type ImportMode = "dry-run" | "write";
type RunnerOutput = "summary" | "full";

export type CoinGeckoImportRunnerArgs = {
  mode: ImportMode;
  limit: number;
  all: boolean;
  page?: number;
  perPage?: number;
  batchSize?: number;
  includePlatforms: boolean;
  examplesLimit: number;
  output: RunnerOutput;
  confirmWrite: boolean;
};

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const dbName = String(process.env.DB_NAME || "fomoland").trim() || "fomoland";
  logProgress(`starting mode=${args.mode} dbName=${dbName} limit=${args.all ? "all" : args.limit}`);

  if (args.mode === "write" && dbName === "fomoland") {
    throw new Error("Refusing to write FOMO v2 CoinGecko market universe to DB_NAME=fomoland.");
  }

  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });

  try {
    if (args.mode === "write") {
      const service = app.get(CoinGeckoMarketUniverseImportService);
      const result = await service.runWrite(args);
      logProgress(`completed migrationRunId=${result.migrationRunId}`);
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    const dryRunService = app.get(CoinGeckoMarketUniverseDryRunService);
    const result = await dryRunService.run(args);
    logProgress("completed dry-run");
    console.log(JSON.stringify(args.output === "full" ? result : compactDryRunResult(result), null, 2));
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): CoinGeckoImportRunnerArgs {
  const args: CoinGeckoImportRunnerArgs = {
    mode: "dry-run",
    limit: 100,
    all: false,
    includePlatforms: true,
    examplesLimit: 5,
    output: "summary",
    confirmWrite: false,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "mode") {
      args.mode = parseMode(value);
    } else if (key === "limit") {
      args.limit = parsePositiveInteger(value, "limit");
    } else if (key === "all") {
      args.all = parseBoolean(value);
    } else if (key === "page") {
      args.page = parsePositiveInteger(value, "page");
    } else if (key === "per-page" || key === "perpage") {
      args.perPage = parsePositiveInteger(value, rawKey);
    } else if (key === "batch-size" || key === "batchsize") {
      args.batchSize = parsePositiveInteger(value, rawKey);
    } else if (key === "include-platforms" || key === "includeplatforms") {
      args.includePlatforms = parseBoolean(value);
    } else if (key === "examples-limit" || key === "exampleslimit") {
      args.examplesLimit = parseNonNegativeInteger(value, rawKey);
    } else if (key === "output") {
      args.output = parseOutput(value);
    } else if (key === "confirm-write" || key === "confirmwrite") {
      args.confirmWrite = parseBoolean(value);
    } else if (key === "write" || key === "apply") {
      if (parseBoolean(value)) args.mode = "write";
    } else if (key === "dry-run" || key === "dryrun") {
      if (!parseBoolean(value)) args.mode = "write";
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  return args;
}

function parseMode(value: string): ImportMode {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "dry-run" || normalized === "dryrun") return "dry-run";
  if (normalized === "write") return "write";
  throw new Error(`Invalid --mode value "${value}". Use "dry-run" or "write".`);
}

function parseOutput(value: string): RunnerOutput {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "summary" || normalized === "full") return normalized;
  throw new Error(`Invalid --output value "${value}". Use "summary" or "full".`);
}

function parsePositiveInteger(value: string, optionName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid --${optionName} value "${value}". Value must be greater than 0.`);
  }
  return Math.trunc(parsed);
}

function parseNonNegativeInteger(value: string, optionName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid --${optionName} value "${value}". Value must be 0 or greater.`);
  }
  return Math.trunc(parsed);
}

function parseBoolean(value: string): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return Boolean(value);
}

function logProgress(message: string) {
  console.error(`[fomo-v2:coingecko-market-import] ${new Date().toISOString()} ${message}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:coingecko-market-import] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
