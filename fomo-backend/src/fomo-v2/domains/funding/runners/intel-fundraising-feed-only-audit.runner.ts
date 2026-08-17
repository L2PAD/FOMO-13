import { NestFactory } from "@nestjs/core";
import { FomoV2DryRunCliModule } from "../../../fomo-v2-dry-run-cli.module";
import { FomoV2IntelFundraisingGapFillDryRunService } from "../services";

type RunnerArgs = {
  sourceType?: string;
  sourceFeed?: string;
  limit?: number;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  logProgress(
    `starting sourceType=${args.sourceType || "all"} sourceFeed=${
      args.sourceFeed || "intel_fundraising"
    }`
  );

  const app = await NestFactory.createApplicationContext(
    FomoV2DryRunCliModule,
    {
      logger: ["error", "warn"],
    }
  );

  try {
    const service = app.get(FomoV2IntelFundraisingGapFillDryRunService);
    const result = await service.auditFeedOnly(args);
    logProgress("completed");
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): RunnerArgs {
  const args: RunnerArgs = {};
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "sourcetype" || key === "source-type") {
      args.sourceType = cleanString(value);
    } else if (key === "sourcefeed" || key === "source-feed") {
      args.sourceFeed = cleanString(value);
    } else if (key === "limit") {
      args.limit = parsePositiveInteger(value, "limit");
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }
  return args;
}

function cleanString(value: string): string {
  const text = String(value || "").trim().toLowerCase();
  if (!text) throw new Error("Option value cannot be empty.");
  return text;
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

function logProgress(message: string): void {
  console.error(
    `[fomo-v2:intel-fundraising-feed-only-audit] ${new Date().toISOString()} ${message}`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      `[fomo-v2:intel-fundraising-feed-only-audit] ${
        error?.message || error
      }`
    );
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
