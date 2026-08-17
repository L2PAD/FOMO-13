import { NestFactory } from "@nestjs/core";
import { FomoV2CliModule } from "../fomo-v2-cli.module";
import {
  FomoV2CanonicalProjectRatingRebuildOptions,
  FomoV2CanonicalProjectRatingRebuildService,
} from "../services";

interface RunnerArgs extends FomoV2CanonicalProjectRatingRebuildOptions {
  mode: "dry-run" | "write";
  confirmWrite: boolean;
}

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  logProgress(
    `starting mode=${args.mode} limit=${args.limit || 100} offset=${
      args.offset || 0
    } statuses=${
      (args.statuses || []).join(",") ||
      (args.includeInactive ? "all" : "active,proposed")
    } canonicalProjectId=${args.canonicalProjectId || "all"} force=${
      args.force === true
    }`
  );

  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(FomoV2CanonicalProjectRatingRebuildService);
    const result = await service.rebuild({
      ...args,
      dryRun: args.mode !== "write",
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
    confirmWrite: false,
    force: false,
    limit: 100,
    offset: 0,
    examplesLimit: 10,
    includeInactive: false,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "mode") {
      args.mode = parseMode(value);
    } else if (key === "write" || key === "apply") {
      if (parseBoolean(value, rawKey)) args.mode = "write";
    } else if (key === "dry-run" || key === "dryrun") {
      if (parseBoolean(value, rawKey)) args.mode = "dry-run";
    } else if (key === "confirm-write" || key === "confirmwrite") {
      args.confirmWrite = parseBoolean(value, rawKey);
    } else if (key === "force") {
      args.force = parseBoolean(value, rawKey);
    } else if (key === "limit") {
      args.limit = parsePositiveInteger(value, rawKey);
    } else if (key === "offset" || key === "skip") {
      args.offset = parseNonNegativeInteger(value, rawKey);
    } else if (
      key === "examples-limit" ||
      key === "exampleslimit" ||
      key === "examples"
    ) {
      args.examplesLimit = parseNonNegativeInteger(value, rawKey);
    } else if (
      key === "canonical-project-id" ||
      key === "canonicalprojectid" ||
      key === "id"
    ) {
      args.canonicalProjectId = value;
    } else if (key === "status" || key === "statuses") {
      args.statuses = splitCsv(value);
    } else if (
      key === "include-inactive" ||
      key === "includeinactive" ||
      key === "all-statuses"
    ) {
      args.includeInactive = parseBoolean(value, rawKey);
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

function parseMode(value: string): RunnerArgs["mode"] {
  const normalized = value.trim().toLowerCase();
  if (normalized === "dry-run" || normalized === "dryrun") return "dry-run";
  if (normalized === "write") return "write";

  throw new Error(`Invalid --mode value "${value}". Use "dry-run" or "write".`);
}

function parsePositiveInteger(value: string, optionName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid --${optionName} value "${value}". Value must be greater than 0.`
    );
  }

  return Math.trunc(parsed);
}

function parseNonNegativeInteger(value: string, optionName: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(
      `Invalid --${optionName} value "${value}". Value must be greater than or equal to 0.`
    );
  }

  return Math.trunc(parsed);
}

function parseBoolean(value: string, optionName: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;

  throw new Error(
    `Invalid --${optionName} value "${value}". Value must be true or false.`
  );
}

function splitCsv(value: string): string[] {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function logProgress(message: string): void {
  console.error(
    `[fomo-v2:canonical-rating-rebuild] ${new Date().toISOString()} ${message}`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      `[fomo-v2:canonical-rating-rebuild] ${error?.message || error}`
    );
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
