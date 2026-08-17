import { NestFactory } from "@nestjs/core";
import { FomoV2CliModule } from "../../../fomo-v2-cli.module";
import { CoinGeckoMarketUniverseReportService } from "../services";

export type CoinGeckoMarketReportRunnerArgs = {
  runId?: string;
  examplesLimit: number;
};

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const dbName = String(process.env.DB_NAME || "fomoland").trim() || "fomoland";
  logProgress(`starting dbName=${dbName}${args.runId ? ` runId=${args.runId}` : ""}`);

  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(CoinGeckoMarketUniverseReportService);
    const report = await service.buildReport(args);
    console.log(JSON.stringify(report, null, 2));
    logProgress("completed");
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): CoinGeckoMarketReportRunnerArgs {
  const args: CoinGeckoMarketReportRunnerArgs = {
    examplesLimit: 10,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "run-id" || key === "runid") {
      args.runId = value;
    } else if (key === "examples-limit" || key === "exampleslimit") {
      args.examplesLimit = parseNonNegativeInteger(value, rawKey);
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  return args;
}

function parseNonNegativeInteger(value: string, optionName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid --${optionName} value "${value}". Value must be 0 or greater.`);
  }
  return Math.trunc(parsed);
}

function logProgress(message: string) {
  console.error(`[fomo-v2:coingecko-market-report] ${new Date().toISOString()} ${message}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:coingecko-market-report] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
