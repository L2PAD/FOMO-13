import { NestFactory } from "@nestjs/core";
import { FomoV2DryRunCliModule } from "../../../fomo-v2-dry-run-cli.module";
import { FomoV2BackerListReadModelService } from "../services";

type RunnerArgs = {
  write: boolean;
  confirmWrite: boolean;
  all: boolean;
  limit?: number;
  offset?: number;
  examplesLimit?: number;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  logProgress(
    `starting mode=${args.write ? "write" : "dry-run"} all=${args.all} limit=${args.limit || "default"} offset=${args.offset || 0}`,
  );

  const app = await NestFactory.createApplicationContext(
    FomoV2DryRunCliModule,
    { logger: ["error", "warn"] },
  );

  try {
    const service = app.get(FomoV2BackerListReadModelService);
    const result = args.all
      ? await materializeAll(service, args)
      : await service.materialize(args);
    logProgress("completed");
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): RunnerArgs {
  const args: RunnerArgs = {
    write: false,
    confirmWrite: false,
    all: false,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "write" || key === "apply") {
      args.write = parseBoolean(value);
    } else if (key === "dry-run" || key === "dryrun") {
      if (!parseBoolean(value)) {
        throw new Error("Use --write for write mode.");
      }
      args.write = false;
    } else if (key === "all") {
      args.all = parseBoolean(value);
    } else if (key === "confirm-write" || key === "confirmwrite") {
      args.confirmWrite = parseBoolean(value);
    } else if (key === "limit") {
      args.limit = parsePositiveInteger(value, rawKey);
    } else if (key === "offset") {
      args.offset = parseNonNegativeInteger(value, rawKey);
    } else if (key === "examples-limit" || key === "exampleslimit") {
      args.examplesLimit = parseNonNegativeInteger(value, rawKey);
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  return args;
}

async function materializeAll(
  service: FomoV2BackerListReadModelService,
  args: RunnerArgs,
) {
  const batchSize = args.limit || 1000;
  let offset = args.offset || 0;
  let scannedBackers = 0;
  let built = 0;
  let written = 0;
  const skipped = {
    missingBackerId: 0,
    missingName: 0,
  };
  const examples = {
    built: [] as any[],
    skipped: [] as any[],
  };

  while (true) {
    const result = await service.materialize({
      ...args,
      limit: batchSize,
      offset,
    });
    logProgress(
      `batch offset=${offset} scanned=${result.scannedBackers} built=${result.built} written=${result.written}`,
    );

    scannedBackers += result.scannedBackers;
    built += result.built;
    written += result.written;
    skipped.missingBackerId += result.skipped.missingBackerId;
    skipped.missingName += result.skipped.missingName;
    pushExamples(examples.built, result.examples.built, args.examplesLimit);
    pushExamples(examples.skipped, result.examples.skipped, args.examplesLimit);

    if (result.scannedBackers < batchSize) break;
    offset += batchSize;
  }

  return {
    mode: args.write ? "write" : "dry-run",
    all: true,
    batchSize,
    requestedOffset: args.offset || 0,
    scannedBackers,
    built,
    written,
    skipped,
    examples,
  };
}

function pushExamples(target: any[], source: any[], limit = 10): void {
  for (const item of source || []) {
    if (target.length >= limit) return;
    target.push(item);
  }
}

function parsePositiveInteger(value: string, optionName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid --${optionName} value "${value}".`);
  }
  return Math.trunc(parsed);
}

function parseNonNegativeInteger(value: string, optionName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid --${optionName} value "${value}".`);
  }
  return Math.trunc(parsed);
}

function parseBoolean(value: string): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return Boolean(value);
}

function logProgress(message: string): void {
  console.error(
    `[fomo-v2:backer-list-read-model-materialize] ${new Date().toISOString()} ${message}`,
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      `[fomo-v2:backer-list-read-model-materialize] ${error?.message || error}`,
    );
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
