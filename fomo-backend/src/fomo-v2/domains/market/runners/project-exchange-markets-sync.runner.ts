import { NestFactory } from "@nestjs/core";
import { FomoV2CliModule } from "../../../fomo-v2-cli.module";
import {
  FomoV2ProjectExchangeMarketsService,
  FomoV2ProjectExchangeMarketsSyncOptions,
} from "../services";

interface RunnerArgs extends FomoV2ProjectExchangeMarketsSyncOptions {
  mode: "dry-run" | "write";
}

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  logProgress(
    `starting mode=${args.mode} target=${args.canonicalProjectId || args.marketAssetId || args.coingeckoId || (args.all ? "all" : "batch")} limit=${args.limit || 100}`,
  );

  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(FomoV2ProjectExchangeMarketsService);
    const result = await service.syncProjectExchangeMarkets({
      canonicalProjectId: args.canonicalProjectId,
      marketAssetId: args.marketAssetId,
      coingeckoId: args.coingeckoId,
      limit: args.limit,
      all: args.all,
      write: args.mode === "write",
      includeDerivatives: args.includeDerivatives,
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
    limit: 100,
    all: false,
    write: false,
    includeDerivatives: true,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "canonical-project-id" || key === "canonicalprojectid" || key === "project-id" || key === "projectid") {
      args.canonicalProjectId = value;
    } else if (key === "market-asset-id" || key === "marketassetid" || key === "asset-id" || key === "assetid") {
      args.marketAssetId = value;
    } else if (key === "coingecko-id" || key === "coingeckoid") {
      args.coingeckoId = value;
    } else if (key === "limit") {
      args.limit = parsePositiveInteger(value, rawKey);
    } else if (key === "all") {
      args.all = parseBoolean(value, rawKey);
    } else if (key === "mode") {
      args.mode = parseMode(value);
    } else if (key === "write" || key === "apply") {
      if (parseBoolean(value, rawKey)) args.mode = "write";
    } else if (key === "dry-run" || key === "dryrun") {
      if (parseBoolean(value, rawKey)) args.mode = "dry-run";
    } else if (key === "include-derivatives" || key === "includederivatives") {
      args.includeDerivatives = parseBoolean(value, rawKey);
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  args.write = args.mode === "write";
  return args;
}

function parseMode(value: string): RunnerArgs["mode"] {
  const normalized = value.trim().toLowerCase();
  if (normalized === "dry-run" || normalized === "dryrun") return "dry-run";
  if (normalized === "write") return "write";
  throw new Error(`Invalid --mode value "${value}". Use "dry-run" or "write".`);
}

function parsePositiveInteger(value: string, optionName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid --${optionName} value "${value}". Value must be greater than 0.`);
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
  console.error(`[fomo-v2:sync-project-exchange-markets] ${new Date().toISOString()} ${message}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:sync-project-exchange-markets] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
