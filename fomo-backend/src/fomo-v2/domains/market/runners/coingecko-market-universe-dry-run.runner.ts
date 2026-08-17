import { NestFactory } from "@nestjs/core";
import {
  CoinGeckoMarketUniverseAssetReport,
  CoinGeckoMarketUniverseDryRunResult,
  CoinGeckoMarketUniverseDryRunService,
} from "../services/coingecko-market-universe-dry-run.service";
import { FomoV2DryRunCliModule } from "../../../fomo-v2-dry-run-cli.module";

type RunnerOutput = "summary" | "full";

type RunnerArgs = {
  limit: number;
  all: boolean;
  page?: number;
  perPage?: number;
  includePlatforms: boolean;
  examplesLimit: number;
  output: RunnerOutput;
  write: boolean;
};

type CompactAssetReport = {
  coingeckoId: string;
  name: string;
  symbol: string;
  marketCapRank?: number | null;
  sourceUrl: string;
  contractsCount: number;
  resolver: {
    status: string;
    canonicalProjectId?: string;
    verified: boolean;
    confidence: string;
    matchedBy: string;
    reason: string;
    candidatesCount: number;
    conflictsCount: number;
  };
  actions: string[];
};

type CompactDryRunResult = Omit<CoinGeckoMarketUniverseDryRunResult, "assets" | "examples"> & {
  output: "summary";
  examples: {
    createdCandidates: CompactAssetReport[];
    matched: CompactAssetReport[];
    conflicts: CompactAssetReport[];
    proposed: CompactAssetReport[];
  };
};

export async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.write) {
    throw new Error("FOMO v2 CoinGecko market universe runner is dry-run only in Phase 2. Remove --write.");
  }

  const dbName = String(process.env.DB_NAME || "fomoland").trim() || "fomoland";
  logProgress(`starting dry-run dbName=${dbName} limit=${args.all ? "all" : args.limit} output=${args.output}`);
  if (dbName === "fomoland") {
    logProgress("warning: DB_NAME resolves to fomoland; dry-run will not write, but use fomo_new for v2 validation");
  }

  const app = await NestFactory.createApplicationContext(FomoV2DryRunCliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(CoinGeckoMarketUniverseDryRunService);
    const result = await service.run(args);
    logProgress("completed");
    const output = args.output === "full" ? result : compactDryRunResult(result);
    console.log(JSON.stringify(output, null, 2));
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): RunnerArgs {
  const args: RunnerArgs = {
    limit: 100,
    all: false,
    includePlatforms: true,
    examplesLimit: 5,
    output: "summary",
    write: false,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "limit") {
      args.limit = parsePositiveInteger(value, "limit");
    } else if (key === "all") {
      args.all = parseBoolean(value);
    } else if (key === "page") {
      args.page = parsePositiveInteger(value, "page");
    } else if (key === "per-page" || key === "perpage") {
      args.perPage = parsePositiveInteger(value, rawKey);
    } else if (key === "include-platforms" || key === "includeplatforms") {
      args.includePlatforms = parseBoolean(value);
    } else if (key === "examples-limit" || key === "exampleslimit") {
      args.examplesLimit = parseNonNegativeInteger(value, rawKey);
    } else if (key === "output") {
      args.output = parseOutput(value);
    } else if (key === "write" || key === "apply") {
      args.write = parseBoolean(value);
    } else if (key === "dry-run" || key === "dryrun") {
      if (!parseBoolean(value)) {
        throw new Error("Phase 2 runner supports only --dry-run=true.");
      }
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }

  return args;
}

export function compactDryRunResult(result: CoinGeckoMarketUniverseDryRunResult): CompactDryRunResult {
  return {
    mode: result.mode,
    output: "summary",
    dbName: result.dbName,
    warnings: result.warnings,
    scanned: result.scanned,
    requestedLimit: result.requestedLimit,
    resolver: result.resolver,
    wouldCreate: result.wouldCreate,
    conflicts: result.conflicts,
    examples: {
      createdCandidates: result.examples.createdCandidates.map(compactAssetReport),
      matched: result.examples.matched.map(compactAssetReport),
      conflicts: result.examples.conflicts.map(compactAssetReport),
      proposed: result.examples.proposed.map(compactAssetReport),
    },
  };
}

function compactAssetReport(asset: CoinGeckoMarketUniverseAssetReport): CompactAssetReport {
  return {
    coingeckoId: asset.coingeckoId,
    name: asset.name,
    symbol: asset.symbol,
    marketCapRank: asset.marketCapRank,
    sourceUrl: asset.sourceUrl,
    contractsCount: asset.contracts?.length || 0,
    resolver: {
      status: asset.resolver.status,
      canonicalProjectId: asset.resolver.canonicalProjectId,
      verified: asset.resolver.verified,
      confidence: asset.resolver.confidence,
      matchedBy: asset.resolver.matchedBy,
      reason: asset.resolver.reason,
      candidatesCount: asset.resolver.candidates.length,
      conflictsCount: asset.resolver.conflicts.length,
    },
    actions: asset.actions.map((action) => action.type),
  };
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

function parseOutput(value: string): RunnerOutput {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "summary" || normalized === "full") return normalized;
  throw new Error(`Invalid --output value "${value}". Use "summary" or "full".`);
}

function parseBoolean(value: string): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return Boolean(value);
}

function logProgress(message: string) {
  console.error(`[fomo-v2:coingecko-market-dry-run] ${new Date().toISOString()} ${message}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:coingecko-market-dry-run] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
