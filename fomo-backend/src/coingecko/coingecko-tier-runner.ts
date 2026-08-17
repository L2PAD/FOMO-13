import { NestFactory } from "@nestjs/core";
import { CoinGeckoDiagnosticsCliModule } from "./coingecko-diagnostics-cli.module";
import { MarketDataTier } from "./coingecko-market.types";
import { MarketDataOrchestratorService, MarketDataTierRunResult } from "./market-data-orchestrator.service";

interface RunnerOptions {
  tier: MarketDataTier;
  runs: number;
  delayMs: number;
  dryRun: boolean;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(CoinGeckoDiagnosticsCliModule, {
    logger: ["log", "warn", "error"],
  });

  try {
    const service = app.get(MarketDataOrchestratorService);
    const startedAt = new Date();
    const results: MarketDataTierRunResult[] = [];

    for (let index = 0; index < options.runs; index += 1) {
      const result = await service.runTier(options.tier, {
        dryRun: options.dryRun,
        ignoreLocalRun: true,
        ignoreTierEnabled: true,
      });
      results.push(result);

      if (index < options.runs - 1 && options.delayMs > 0) {
        await sleep(options.delayMs);
      }
    }

    console.log(
      JSON.stringify(
        {
          tier: options.tier,
          dryRun: options.dryRun,
          runs: options.runs,
          delayMs: options.delayMs,
          startedAt: startedAt.toISOString(),
          finishedAt: new Date().toISOString(),
          totals: summarizeResults(results),
          results,
        },
        null,
        2,
      ),
    );
  } finally {
    await app.close();
  }
}

function parseArgs(argv: string[]): RunnerOptions {
  const result: RunnerOptions = {
    tier: "HOT" as MarketDataTier,
    runs: 1,
    delayMs: 0,
    dryRun: false,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim();
    const value = rawValue.trim();

    if (key === "tier") {
      result.tier = parseTier(value);
    } else if (key === "runs") {
      result.runs = parsePositiveInteger(value, 1);
    } else if (key === "delay-ms" || key === "delayMs") {
      result.delayMs = parseNonNegativeInteger(value, 0);
    } else if (key === "dry-run" || key === "dryRun") {
      result.dryRun = parseBoolean(value);
    }
  }

  return result;
}

function summarizeResults(results: MarketDataTierRunResult[]): Record<string, number> {
  return results.reduce(
    (summary, result) => ({
      durationMs: summary.durationMs + result.durationMs,
      projectsRequested: summary.projectsRequested + result.projectsRequested,
      projectsWouldUpdate: summary.projectsWouldUpdate + result.projectsWouldUpdate,
      projectsUpdated: summary.projectsUpdated + result.projectsUpdated,
      skippedUnmapped: summary.skippedUnmapped + result.skippedUnmapped,
      missingFromProvider: summary.missingFromProvider + result.missingFromProvider,
      symbolMismatch: summary.symbolMismatch + result.symbolMismatch,
      failedBatches: summary.failedBatches + result.failedBatches,
      requestsMade: summary.requestsMade + result.requestsMade,
    }),
    {
      durationMs: 0,
      projectsRequested: 0,
      projectsWouldUpdate: 0,
      projectsUpdated: 0,
      skippedUnmapped: 0,
      missingFromProvider: 0,
      symbolMismatch: 0,
      failedBatches: 0,
      requestsMade: 0,
    },
  );
}

function parseTier(value: string): MarketDataTier {
  const tier = String(value || "").trim().toUpperCase();
  if (tier === "HOT" || tier === "WARM" || tier === "COLD") return tier;
  throw new Error(`Invalid tier=${value}. Expected HOT, WARM, or COLD.`);
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(`[coingecko:run-tier] ${error?.message || error}`);
  if (error?.stack) console.error(error.stack);
  process.exitCode = 1;
});
