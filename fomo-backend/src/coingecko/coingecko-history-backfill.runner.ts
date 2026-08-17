import { NestFactory } from "@nestjs/core";
import { CoinGeckoDiagnosticsCliModule } from "./coingecko-diagnostics-cli.module";
import { CoinGeckoHistoryBackfillOptions, CoinGeckoHistoryBackfillService } from "./coingecko-history-backfill.service";
import { MarketDataTier } from "./coingecko-market.types";

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(CoinGeckoDiagnosticsCliModule, {
    logger: ["log", "warn", "error"],
  });

  try {
    const service = app.get(CoinGeckoHistoryBackfillService);
    const result = await service.backfillCoinGeckoHistory(options);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

function parseArgs(argv: string[]): CoinGeckoHistoryBackfillOptions {
  const result: CoinGeckoHistoryBackfillOptions = {
    tier: "HOT",
    limit: 500,
    skip: 0,
    dryRun: true,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim();
    const value = rawValue.trim();

    if (key === "tier") {
      result.tier = parseTier(value);
    } else if (key === "limit") {
      result.limit = parsePositiveInteger(value, result.limit || 500);
    } else if (key === "skip" || key === "offset") {
      result.skip = parseNonNegativeInteger(value, result.skip || 0);
    } else if (key === "dry-run" || key === "dryRun") {
      result.dryRun = parseBoolean(value);
    } else if (key === "write") {
      result.dryRun = !parseBoolean(value);
    } else if (key === "project-ids" || key === "projectIds") {
      result.projectIds = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (key === "days") {
      result.days = parseDays(value);
    } else if (key === "interval") {
      result.interval = parseInterval(value);
    } else if (key === "profile") {
      result.profile = parseProfile(value);
    } else if (key === "windows") {
      result.windows = parseWindows(value);
    } else if (key === "reset-before-write" || key === "resetBeforeWrite") {
      result.resetBeforeWrite = parseBoolean(value);
    } else if (key === "delay-ms" || key === "delayMs") {
      result.delayMs = parseNonNegativeInteger(value, 1200);
    } else if (key === "batch-size" || key === "batchSize") {
      result.batchSize = parsePositiveInteger(value, 1);
    } else if (key === "max-retries" || key === "maxRetries") {
      result.maxRetries = parsePositiveInteger(value, 3);
    }
  }

  return result;
}

function parseTier(value: string): MarketDataTier {
  const tier = String(value || "").trim().toUpperCase();
  if (tier === "HOT" || tier === "WARM" || tier === "COLD") return tier;
  throw new Error(`Invalid tier=${value}. Expected HOT, WARM, or COLD.`);
}

function parseDays(value: string): string | number {
  const trimmed = String(value || "").trim();
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : trimmed || "max";
}

function parseInterval(value: string): string | undefined {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized || normalized === "auto") return undefined;
  if (normalized === "5m" || normalized === "hourly" || normalized === "daily") return normalized;
  throw new Error(`Invalid interval=${value}. Expected auto, 5m, hourly, or daily.`);
}

function parseProfile(value: string): "single" | "dense" | "complete" {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "single" || normalized === "dense" || normalized === "complete") return normalized;
  throw new Error(`Invalid profile=${value}. Expected single, dense, or complete.`);
}

function parseWindows(value: string): Array<{ days: string | number; interval?: string; label?: string }> {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [daysRaw, intervalRaw] = item.split(":");
      const days = parseDays(daysRaw);
      const interval = parseInterval(intervalRaw || "auto");
      return {
        days,
        ...(interval ? { interval } : {}),
      };
    });
}

function parsePositiveInteger(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

function parseNonNegativeInteger(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
}

function parseBoolean(value: string): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return Boolean(value);
}

main().catch((error) => {
  console.error(`[coingecko:history-backfill] ${error?.message || error}`);
  if (error?.stack) console.error(error.stack);
  process.exitCode = 1;
});
