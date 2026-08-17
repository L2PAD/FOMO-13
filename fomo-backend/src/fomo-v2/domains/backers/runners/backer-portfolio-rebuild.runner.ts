import { NestFactory } from "@nestjs/core";
import { FomoV2DryRunCliModule } from "../../../fomo-v2-dry-run-cli.module";
import { FomoV2BackerPortfolioRebuildService } from "../services";

type RunnerArgs = {
  write: boolean;
  debug: boolean;
  backerId?: string;
  backerSlug?: string;
};

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const mode = args.write ? "write" : "dry-run";
  logProgress(`starting ${mode}`);

  const app = await NestFactory.createApplicationContext(
    FomoV2DryRunCliModule,
    {
      logger: ["error", "warn"],
    }
  );

  try {
    const service = app.get(FomoV2BackerPortfolioRebuildService);
    const result = await service.run(args);
    logProgress("completed");
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): RunnerArgs {
  const args: RunnerArgs = { write: false, debug: false };
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim().toLowerCase();
    const value = rawValue.trim();

    if (key === "write" || key === "apply") {
      args.write = parseBoolean(value);
    } else if (key === "dry-run" || key === "dryrun") {
      if (!parseBoolean(value)) {
        throw new Error("Use --write for portfolio rebuild write mode.");
      }
      args.write = false;
    } else if (key === "debug") {
      args.debug = parseBoolean(value);
    } else if (key === "backer" || key === "backer-id" || key === "backerid") {
      args.backerId = cleanString(value);
    } else if (key === "backer-slug" || key === "backerslug") {
      args.backerSlug = cleanString(value);
    } else {
      throw new Error(`Unknown option --${rawKey}.`);
    }
  }
  return args;
}

function cleanString(value: string): string | undefined {
  const text = String(value || "").trim();
  return text || undefined;
}

function parseBoolean(value: string): boolean {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return Boolean(value);
}

function logProgress(message: string): void {
  console.error(
    `[fomo-v2:backer-portfolio-rebuild] ${new Date().toISOString()} ${message}`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      `[fomo-v2:backer-portfolio-rebuild] ${error?.message || error}`
    );
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
