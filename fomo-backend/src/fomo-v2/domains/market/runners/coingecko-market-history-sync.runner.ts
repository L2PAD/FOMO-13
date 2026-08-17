import { NestFactory } from "@nestjs/core";
import {
  FomoV2CoinGeckoMarketHistoryDays,
  FomoV2CoinGeckoMarketHistorySyncOptions,
  FomoV2CoinGeckoMarketHistorySyncService,
  FomoV2CoinGeckoMarketHistorySyncTier,
} from "../services";
import { FomoV2CliModule } from "../../../fomo-v2-cli.module";

interface RunnerArgs extends FomoV2CoinGeckoMarketHistorySyncOptions {
  mode: "dry-run" | "write";
  confirmWrite: boolean;
}

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  logProgress(
    `starting mode=${args.mode} tier=${args.tier || "HOT"} days=${args.days || "tier-default"} limit=${args.limit || 50} offset=${args.offset || 0}`,
  );

  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(FomoV2CoinGeckoMarketHistorySyncService);
    const result = await service.sync({
      dryRun: args.mode !== "write",
      tier: args.tier,
      limit: args.limit,
      offset: args.offset,
      days: args.days,
      marketAssetId: args.marketAssetId,
      canonicalProjectId: args.canonicalProjectId,
      providerAssetId: args.providerAssetId,
      coingeckoId: args.coingeckoId,
      vsCurrency: args.vsCurrency,
      delayMs: args.delayMs,
      maxRetries: args.maxRetries,
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
      args.limit = parseLimit(value, rawKey);
    } else if (key === "offset" || key === "skip") {
      args.offset = parseNonNegativeInteger(value, rawKey);
    } else if (key === "days") {
      args.days = parseDays(value);
    } else if (key === "marketassetid" || key === "market-asset-id") {
      args.marketAssetId = value;
    } else if (key === "canonicalprojectid" || key === "canonical-project-id") {
      args.canonicalProjectId = value;
    } else if (key === "providerassetid" || key === "provider-asset-id") {
      args.providerAssetId = value;
    } else if (key === "coingeckoid" || key === "coingecko-id") {
      args.coingeckoId = value;
    } else if (key === "vs_currency" || key === "vs-currency" || key === "vscurrency") {
      args.vsCurrency = value;
    } else if (key === "delay-ms" || key === "delayms") {
      args.delayMs = parseNonNegativeInteger(value, rawKey);
    } else if (key === "max-retries" || key === "maxretries") {
      args.maxRetries = parsePositiveInteger(value, rawKey);
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

function parseTier(value: string): FomoV2CoinGeckoMarketHistorySyncTier {
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

function parseDays(value: string): FomoV2CoinGeckoMarketHistoryDays {
  const normalized = value.trim().toLowerCase();
  if (normalized === "max") return "max";

  const parsed = Number(normalized);
  if (Number.isFinite(parsed) && parsed > 0) return Math.trunc(parsed);
  throw new Error(`Invalid --days value "${value}". Use a positive number of days or max.`);
}

function parseLimit(value: string, optionName: string): number {
  const normalized = value.trim().toLowerCase();
  if (normalized === "all" || normalized === "0") return 0;
  return parsePositiveInteger(value, optionName);
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
  console.error(`[fomo-v2:coingecko-market-history-sync] ${new Date().toISOString()} ${message}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:coingecko-market-history-sync] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
