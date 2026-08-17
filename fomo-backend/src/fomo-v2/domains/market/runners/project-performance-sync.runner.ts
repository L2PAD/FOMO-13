import { NestFactory } from "@nestjs/core";
import { FomoV2CliModule } from "../../../fomo-v2-cli.module";
import {
  FomoV2MarketPerformancePeriod,
  FomoV2MarketPerformanceTier,
  FomoV2MarketPerformanceTierRecalculateOptions,
  FomoV2MarketProjectPerformanceService,
} from "../services";
import { FomoV2MarketPerformanceQuote } from "../models";

interface RunnerArgs extends FomoV2MarketPerformanceTierRecalculateOptions {
  mode: "dry-run" | "write";
  confirmWrite: boolean;
}

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  logProgress(
    `starting mode=${args.mode} tier=${args.tier || "HOT"} limit=${args.limit || 100} periods=${(args.periods || []).join(",") || "default"} quotes=${(args.quotes || []).join(",") || "default"}`,
  );

  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(FomoV2MarketProjectPerformanceService);
    const result = await service.recalculateByTier({
      dryRun: args.mode !== "write",
      tier: args.tier,
      limit: args.limit,
      offset: args.offset,
      periods: args.periods,
      quotes: args.quotes,
    });
    console.log(JSON.stringify(result, null, 2));
    logProgress("completed");
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): RunnerArgs {
  const args: RunnerArgs = {
    mode: "dry-run",
    dryRun: true,
    tier: "HOT",
    confirmWrite: false,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "tier") {
      args.tier = parseTier(value);
    } else if (key === "mode") {
      args.mode = parseMode(value);
    } else if (key === "write" || key === "apply") {
      if (parseBoolean(value, rawKey)) args.mode = "write";
    } else if (key === "dry-run" || key === "dryrun") {
      if (parseBoolean(value, rawKey)) args.mode = "dry-run";
    } else if (key === "confirm-write" || key === "confirmwrite") {
      args.confirmWrite = parseBoolean(value, rawKey);
    } else if (key === "limit") {
      args.limit = parsePositiveInteger(value, rawKey);
    } else if (key === "offset" || key === "skip") {
      args.offset = parseNonNegativeInteger(value, rawKey);
    } else if (key === "periods") {
      args.periods = parsePeriods(value);
    } else if (key === "quote" || key === "quotes") {
      args.quotes = parseQuotes(value);
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  args.dryRun = args.mode !== "write";

  if (args.mode === "write" && args.confirmWrite !== true) {
    throw new Error("Write mode requires --confirm-write=true.");
  }

  return args;
}

function parseTier(value: string): FomoV2MarketPerformanceTier {
  const normalized = value.trim().toUpperCase();
  if (normalized === "HOT" || normalized === "WARM" || normalized === "COLD") return normalized;
  if (normalized.toLowerCase() === "all") return "all";
  throw new Error(`Invalid --tier value "${value}". Use HOT, WARM, COLD, or all.`);
}

function parseMode(value: string): RunnerArgs["mode"] {
  const normalized = value.trim().toLowerCase();
  if (normalized === "dry-run" || normalized === "dryrun") return "dry-run";
  if (normalized === "write") return "write";
  throw new Error(`Invalid --mode value "${value}". Use "dry-run" or "write".`);
}

function parsePeriods(value: string): FomoV2MarketPerformancePeriod[] {
  const allowed = new Set(["1h", "24h", "7d", "30d", "90d", "1y"]);
  const periods = splitCsv(value);
  for (const period of periods) {
    if (!allowed.has(period)) {
      throw new Error(`Invalid --periods value "${period}". Use 1h,24h,7d,30d,90d,1y.`);
    }
  }
  return periods as FomoV2MarketPerformancePeriod[];
}

function parseQuotes(value: string): FomoV2MarketPerformanceQuote[] {
  const allowed = new Set(["usd", "btc", "eth", "sol"]);
  const quotes = splitCsv(value).map((quote) => quote.toLowerCase());
  for (const quote of quotes) {
    if (!allowed.has(quote)) {
      throw new Error(`Invalid --quote value "${quote}". Use usd,btc,eth,sol.`);
    }
  }
  return quotes as FomoV2MarketPerformanceQuote[];
}

function splitCsv(value: string): string[] {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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
    throw new Error(`Invalid --${optionName} value "${value}". Value must be greater than or equal to 0.`);
  }
  return Math.trunc(parsed);
}

function parseBoolean(value: string, optionName: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  throw new Error(`Invalid --${optionName} value "${value}". Value must be true or false.`);
}

function logProgress(message: string): void {
  console.error(`[fomo-v2:project-performance-sync] ${new Date().toISOString()} ${message}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:project-performance-sync] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
