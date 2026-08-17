import { NestFactory } from "@nestjs/core";
import { CoinGeckoDiagnosticsCliModule } from "./coingecko-diagnostics-cli.module";
import { CoinGeckoHistoryResetOptions, CoinGeckoHistoryResetService } from "./coingecko-history-reset.service";

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(CoinGeckoDiagnosticsCliModule, {
    logger: ["log", "warn", "error"],
  });

  try {
    const service = app.get(CoinGeckoHistoryResetService);
    const result = await service.resetProjectPriceHistory(options);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

function parseArgs(argv: string[]): CoinGeckoHistoryResetOptions {
  const result: CoinGeckoHistoryResetOptions = {
    dryRun: true,
    resetCharts: true,
    resetRawHistory: true,
    resetProjectLegacyFields: true,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim();
    const value = rawValue.trim();

    if (key === "dry-run" || key === "dryRun") {
      result.dryRun = parseBoolean(value);
      result.write = !result.dryRun;
    } else if (key === "write") {
      result.write = parseBoolean(value);
      result.dryRun = !result.write;
    } else if (key === "project-ids" || key === "projectIds") {
      result.projectIds = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (key === "reset-charts" || key === "resetCharts") {
      result.resetCharts = parseBoolean(value);
    } else if (key === "reset-raw-history" || key === "resetRawHistory") {
      result.resetRawHistory = parseBoolean(value);
    } else if (key === "reset-project-legacy-fields" || key === "resetProjectLegacyFields") {
      result.resetProjectLegacyFields = parseBoolean(value);
    }
  }

  return result;
}

function parseBoolean(value: string): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return Boolean(value);
}

main().catch((error) => {
  console.error(`[coingecko:history-reset] ${error?.message || error}`);
  if (error?.stack) console.error(error.stack);
  process.exitCode = 1;
});
