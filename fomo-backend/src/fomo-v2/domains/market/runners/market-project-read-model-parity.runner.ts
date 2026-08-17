import { NestFactory } from "@nestjs/core";
import { FomoV2CliModule } from "../../../fomo-v2-cli.module";
import {
  FomoV2MarketProjectReadModelService,
  FomoV2MarketReadModelParityOptions,
} from "../services";

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  logProgress(`starting limit=${args.limit} offset=${args.offset || 0}`);

  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(FomoV2MarketProjectReadModelService);
    const report = await service.buildParityReport(args);
    console.log(JSON.stringify(report, null, 2));
    logProgress("completed");
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): FomoV2MarketReadModelParityOptions {
  const args: FomoV2MarketReadModelParityOptions = {
    limit: 100,
    offset: 0,
    examplesLimit: 10,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "limit") {
      args.limit = parsePositiveInteger(value, rawKey);
    } else if (key === "offset") {
      args.offset = parseNonNegativeInteger(value, rawKey);
    } else if (key === "examples-limit" || key === "exampleslimit" || key === "examples") {
      args.examplesLimit = parseNonNegativeInteger(value, rawKey);
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  return args;
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
    throw new Error(`Invalid --${optionName} value "${value}". Value must be 0 or greater.`);
  }
  return Math.trunc(parsed);
}

function logProgress(message: string): void {
  console.error(`[fomo-v2:market-read-model-parity] ${new Date().toISOString()} ${message}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:market-read-model-parity] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
