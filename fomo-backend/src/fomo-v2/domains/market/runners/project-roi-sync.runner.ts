import { NestFactory } from "@nestjs/core";
import { FomoV2CliModule } from "../../../fomo-v2-cli.module";
import {
  FomoV2MarketProjectRoiMetricService,
  FomoV2MarketRoiTier,
  FomoV2MarketRoiTierRecalculateOptions,
} from "../services";

interface RunnerArgs extends FomoV2MarketRoiTierRecalculateOptions {
  mode: "dry-run" | "write";
  confirmWrite: boolean;
}

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  logProgress(
    `starting mode=${args.mode} tier=${args.tier || "HOT"} limit=${args.limit || 100} coingeckoId=${args.coingeckoId || "all"}`,
  );

  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(FomoV2MarketProjectRoiMetricService);
    const result = await service.recalculateByTier({
      dryRun: args.mode !== "write",
      tier: args.tier,
      limit: args.limit,
      offset: args.offset,
      coingeckoId: args.coingeckoId,
      marketAssetId: args.marketAssetId,
      canonicalProjectId: args.canonicalProjectId,
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
    } else if (key === "coingecko-id" || key === "coingeckoid") {
      args.coingeckoId = value;
    } else if (key === "market-asset-id" || key === "marketassetid") {
      args.marketAssetId = value;
    } else if (key === "canonical-project-id" || key === "canonicalprojectid") {
      args.canonicalProjectId = value;
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

function parseTier(value: string): FomoV2MarketRoiTier {
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
  console.error(`[fomo-v2:project-roi-sync] ${new Date().toISOString()} ${message}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:project-roi-sync] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
