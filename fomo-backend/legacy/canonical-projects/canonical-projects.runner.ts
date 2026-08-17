import { NestFactory } from "@nestjs/core";
import {
  CanonicalProjectBackfillEntityType,
  CanonicalProjectBackfillService,
} from "./services/canonical-project-backfill.service";
import { CanonicalProjectsCliModule } from "./canonical-projects-cli.module";

type RunnerArgs = {
  dryRun: boolean;
  apply?: boolean;
  confirmApply?: boolean;
  scanLimit?: number;
  progressEvery?: number;
  concurrency?: number;
  bulk?: boolean;
  projectType?: "market" | "project" | "all";
  checkMarketProjectPairs?: boolean;
  entityTypes?: CanonicalProjectBackfillEntityType[];
};

const ALL_ENTITY_TYPES: CanonicalProjectBackfillEntityType[] = [
  "projects",
  "fundingRounds",
  "tokenUnlocks",
  "projectChartHistory",
  "projectComparisonSnapshots",
  "cryptoActivities",
  "projectExchangeTickerCache",
];

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  logProgress(
    `starting mode=${args.apply && args.confirmApply ? "apply" : "dry-run"} scanLimit=${args.scanLimit ?? "all"} entityTypes=${args.entityTypes?.join(",") || "none"} progressEvery=${args.progressEvery ?? 10} concurrency=${args.concurrency ?? 1} bulk=${args.bulk === true} projectType=${args.projectType ?? "all"} checkMarketProjectPairs=${args.checkMarketProjectPairs === true}`,
  );

  const app = await NestFactory.createApplicationContext(CanonicalProjectsCliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(CanonicalProjectBackfillService);
    const result = await service.runBackfill(args);
    logProgress("completed");
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): RunnerArgs {
  const args: RunnerArgs = {
    dryRun: true,
  };
  let sawEntityTypes = false;

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();
    rejectLikelyJoinedOption(key, value);

    if (key === "dry-run" || key === "dryrun") {
      args.dryRun = parseBoolean(value);
    } else if (key === "apply" || key === "write") {
      args.apply = parseBoolean(value);
      if (args.apply) args.dryRun = false;
    } else if (key === "confirm-apply" || key === "confirmapply") {
      args.confirmApply = parseBoolean(value);
    } else if (key === "scan-limit" || key === "scanlimit" || key === "limit") {
      args.scanLimit = parseNumber(value, key);
    } else if (key === "progress-every" || key === "progressevery") {
      args.progressEvery = parseNumber(value, key);
    } else if (key === "concurrency" || key === "parallelism") {
      args.concurrency = parseNumber(value, key);
    } else if (key === "bulk" || key === "bulk-mode" || key === "bulkmode") {
      args.bulk = parseBoolean(value);
    } else if (key === "project-type" || key === "projecttype") {
      args.projectType = parseProjectType(value);
    } else if (key === "check-market-project-pairs" || key === "checkmarketprojectpairs") {
      args.checkMarketProjectPairs = parseBoolean(value);
    } else if (key === "entity-types" || key === "entitytypes") {
      sawEntityTypes = true;
      args.entityTypes = parseEntityTypes(value);
    } else {
      throw new Error(`Unknown option --${rawKey}. Refusing to run canonical-projects with an unrecognized CLI option.`);
    }
  }

  if (!sawEntityTypes) {
    throw new Error(
      "Missing required --entity-types. Refusing to scan all canonical-project entity types from CLI. Use --entity-types=projects,fundingRounds,tokenUnlocks or explicit --entity-types=all.",
    );
  }

  return args;
}

function parseProjectType(value: string): RunnerArgs["projectType"] {
  const normalized = value.trim().toLowerCase();
  if (normalized === "market") return "market";
  if (normalized === "project") return "project";
  if (normalized === "all") return "all";
  throw new Error(`Invalid --project-type value "${value}". Allowed values: market, project, all.`);
}

function parseEntityTypes(value: string): CanonicalProjectBackfillEntityType[] | undefined {
  const aliases: Record<string, CanonicalProjectBackfillEntityType> = {
    projects: "projects",
    project: "projects",
    fundingrounds: "fundingRounds",
    fundinground: "fundingRounds",
    rounds: "fundingRounds",
    tokenunlocks: "tokenUnlocks",
    tokenunlock: "tokenUnlocks",
    unlocks: "tokenUnlocks",
    projectcharthistory: "projectChartHistory",
    charthistory: "projectChartHistory",
    charts: "projectChartHistory",
    projectcomparisonsnapshots: "projectComparisonSnapshots",
    comparisonsnapshots: "projectComparisonSnapshots",
    snapshots: "projectComparisonSnapshots",
    cryptoactivities: "cryptoActivities",
    cryptoactivity: "cryptoActivities",
    activities: "cryptoActivities",
    projectexchangetickercache: "projectExchangeTickerCache",
    exchangetickercache: "projectExchangeTickerCache",
    exchanges: "projectExchangeTickerCache",
  };

  const normalizedValues = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!normalizedValues.length) {
    throw new Error("Invalid --entity-types value. Pass at least one entity type.");
  }

  if (normalizedValues.some((item) => item.toLowerCase() === "all")) {
    if (normalizedValues.length > 1) {
      throw new Error('Invalid --entity-types value. Use either "--entity-types=all" or a comma-separated subset, not both.');
    }
    return ALL_ENTITY_TYPES;
  }

  const unknown: string[] = [];
  const values = normalizedValues
    .map((item) => {
      const key = item.toLowerCase().replace(/[-_]/g, "");
      const entityType = aliases[key];
      if (!entityType) unknown.push(item);
      return entityType;
    })
    .filter(Boolean);

  if (unknown.length) {
    throw new Error(`Invalid --entity-types value(s): ${unknown.join(", ")}.`);
  }

  return Array.from(new Set(values));
}

function parseNumber(value: string, optionName: string): number | undefined {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid --${optionName} value "${value}". Did you miss a space before another --option?`);
  }
  if (parsed <= 0) {
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
  console.error(`[canonical-projects] ${new Date().toISOString()} ${message}`);
}

function rejectLikelyJoinedOption(key: string, value: string) {
  if (value.includes("--")) {
    throw new Error(
      `Invalid --${key} value "${value}". It looks like two CLI options were joined together. Add a space before the next --option.`,
    );
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[canonical-projects] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
