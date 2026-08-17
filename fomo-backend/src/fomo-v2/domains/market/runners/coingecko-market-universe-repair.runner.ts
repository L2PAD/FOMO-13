import { NestFactory } from "@nestjs/core";
import { FomoV2CliModule } from "../../../fomo-v2-cli.module";
import { CoinGeckoMarketUniverseRepairService } from "../services";

type RepairMode = "dry-run" | "write";

export interface CoinGeckoRepairRunnerArgs {
  mode: RepairMode;
  confirmWrite: boolean;
  limit: number;
  sourceIds: string[];
}

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const dbName = String(process.env.DB_NAME || "fomoland").trim() || "fomoland";
  logProgress(`starting mode=${args.mode} dbName=${dbName} limit=${args.limit}`);

  if (args.mode === "write" && dbName === "fomoland") {
    throw new Error("Refusing to repair FOMO v2 CoinGecko market universe on DB_NAME=fomoland.");
  }

  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(CoinGeckoMarketUniverseRepairService);
    const result = await service.run(args);
    logProgress(`completed planned=${result.planned} repaired=${result.repaired}`);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): CoinGeckoRepairRunnerArgs {
  const args: CoinGeckoRepairRunnerArgs = {
    mode: "dry-run",
    confirmWrite: false,
    limit: 100,
    sourceIds: [],
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "mode") {
      args.mode = parseMode(value);
    } else if (key === "confirm-write" || key === "confirmwrite") {
      args.confirmWrite = parseBoolean(value);
    } else if (key === "limit") {
      args.limit = parsePositiveInteger(value, rawKey);
    } else if (key === "source-id" || key === "sourceid" || key === "source-ids" || key === "sourceids") {
      args.sourceIds = value.split(",").map((item) => item.trim()).filter(Boolean);
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

function parseMode(value: string): RepairMode {
  const normalized = String(value || "").trim().toLowerCase();
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

function parseBoolean(value: string): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return Boolean(value);
}

function logProgress(message: string) {
  console.error(`[fomo-v2:coingecko-market-repair] ${new Date().toISOString()} ${message}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:coingecko-market-repair] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
