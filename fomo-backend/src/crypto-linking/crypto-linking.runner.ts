import { NestFactory } from "@nestjs/core";
import { CryptoLinkingDiagnosticsService } from "./crypto-linking-diagnostics.service";
import { CryptoLinkingCliModule } from "./crypto-linking-cli.module";
import { CryptoEntityLinkerService } from "./services/crypto-entity-linker.service";

type RunnerMode = "audit" | "apply" | "batch";

type RunnerArgs = {
  mode: RunnerMode;
  dryRun?: boolean;
  apply?: boolean;
  scanLimit?: number;
  investorScanLimit?: number;
  applyLimit?: number;
  entityTypes?: Array<"investors">;
  allowedConfidence?: Array<"exact" | "high">;
  batchId?: string;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  logProgress(`starting mode=${args.mode} scanLimit=${args.scanLimit ?? "default"} investorScanLimit=${args.investorScanLimit ?? "default"}`);
  const app = await NestFactory.createApplicationContext(CryptoLinkingCliModule, {
    logger: ["error", "warn"],
  });

  try {
    logProgress("connected application context");
    const result = await runMode(app, args);
    logProgress("completed");
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

async function runMode(app: any, args: RunnerArgs) {
  if (args.mode === "batch") {
    logProgress(`loading batch report batchId=${args.batchId || "(missing)"}`);
    const linker = app.get(CryptoEntityLinkerService);
    if (!args.batchId) {
      throw new Error("--batchId is required for --mode=batch");
    }
    return linker.batchReport(args.batchId);
  }

  if (args.mode === "apply") {
    logProgress(`running controlled apply dryRun=${args.dryRun !== false} apply=${args.apply === true}`);
    const linker = app.get(CryptoEntityLinkerService);
    return linker.applyProposedUpdates({
      dryRun: args.dryRun,
      apply: args.apply,
      scanLimit: args.scanLimit,
      investorScanLimit: args.investorScanLimit,
      applyLimit: args.applyLimit,
      entityTypes: args.entityTypes,
      allowedConfidence: args.allowedConfidence,
      batchId: args.batchId,
    });
  }

  const diagnostics = app.get(CryptoLinkingDiagnosticsService);
  logProgress("running read-only diagnostics audit");
  return diagnostics.audit({
    dryRun: true,
    scanLimit: args.scanLimit,
    investorScanLimit: args.investorScanLimit,
    applyLimit: args.applyLimit,
  });
}

function parseArgs(argv: string[]): RunnerArgs {
  const args: RunnerArgs = {
    mode: "audit",
    dryRun: true,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = normalizeKey(rawKey);
    const value = rawValue.trim();

    if (key === "mode") {
      args.mode = parseMode(value);
    } else if (key === "apply" || key === "write") {
      const enabled = parseBoolean(value);
      args.apply = enabled;
      if (enabled) args.mode = "apply";
    } else if (key === "dryrun" || key === "dry-run") {
      args.dryRun = parseBoolean(value);
    } else if (key === "scanlimit" || key === "scan-limit" || key === "limit") {
      args.scanLimit = parseNumber(value);
    } else if (key === "investorscanlimit" || key === "investor-scan-limit") {
      args.investorScanLimit = parseNumber(value);
    } else if (key === "applylimit" || key === "apply-limit") {
      args.applyLimit = parseNumber(value);
    } else if (key === "entitytypes" || key === "entity-types") {
      args.entityTypes = parseEntityTypes(value);
    } else if (key === "allowedconfidence" || key === "allowed-confidence") {
      args.allowedConfidence = parseAllowedConfidence(value);
    } else if (key === "batchid" || key === "batch-id") {
      args.batchId = value;
    }
  }

  return args;
}

function parseMode(value: string): RunnerMode {
  const normalized = value.trim().toLowerCase();
  if (normalized === "apply") return "apply";
  if (normalized === "batch" || normalized === "report") return "batch";
  return "audit";
}

function parseEntityTypes(value: string): RunnerArgs["entityTypes"] {
  const allowed = new Set(["investors"]);
  const aliases: Record<string, "investors"> = {
    investors: "investors",
    investor: "investors",
  };
  const values = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => aliases[item.toLowerCase()] || item)
    .filter((item): item is "investors" => allowed.has(item));
  return Array.from(new Set(values));
}

function parseAllowedConfidence(value: string): RunnerArgs["allowedConfidence"] {
  const values = value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter((item): item is "exact" | "high" => item === "exact" || item === "high");
  return values.length ? Array.from(new Set(values)) : undefined;
}

function parseNumber(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : undefined;
}

function parseBoolean(value: string): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return Boolean(value);
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function logProgress(message: string) {
  console.error(`[crypto-linking] ${new Date().toISOString()} ${message}`);
}

main().catch((error) => {
  console.error(`[crypto-linking] ${error?.message || error}`);
  if (error?.stack) console.error(error.stack);
  process.exitCode = 1;
});
