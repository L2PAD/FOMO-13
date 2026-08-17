import { NestFactory } from "@nestjs/core";
import { CoinGeckoDiagnosticsCliModule } from "./coingecko-diagnostics-cli.module";
import { CoinGeckoAliasMappingService } from "./coingecko-alias-mapping.service";

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(CoinGeckoDiagnosticsCliModule, {
    logger: false,
  });

  try {
    const service = app.get(CoinGeckoAliasMappingService);
    const result = await service.runAliasMapping(options);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

function parseArgs(argv: string[]): any {
  const result: any = { dryRun: true };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim();
    const value = rawValue.trim();

    if (key === "write") {
      result.write = parseBoolean(value);
      result.dryRun = !result.write;
    } else if (key === "dry-run" || key === "dryRun") {
      result.dryRun = parseBoolean(value);
      result.write = !result.dryRun;
    } else if (
      [
        "limit",
        "min-confidence",
        "minConfidence",
        "max-rank",
        "maxRank",
        "top-market-cap-limit",
        "topMarketCapLimit",
        "search-limit",
        "searchLimit",
        "top-important-limit",
        "topImportantLimit",
      ].includes(key)
    ) {
      const normalizedKey = key
        .replace("min-confidence", "minConfidence")
        .replace("max-rank", "maxRank")
        .replace("top-market-cap-limit", "topMarketCapLimit")
        .replace("search-limit", "searchLimit")
        .replace("top-important-limit", "topImportantLimit");
      result[normalizedKey] = parseNumber(value);
    } else if (key === "refresh-existing" || key === "refreshExisting") {
      result.refreshExisting = parseBoolean(value);
    }
  }

  return result;
}

function parseNumber(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : undefined;
}

function parseBoolean(value: string): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return Boolean(value);
}

main().catch((error) => {
  console.error(`[coingecko:alias-mapping] ${error?.message || error}`);
  if (error?.stack) console.error(error.stack);
  process.exitCode = 1;
});
