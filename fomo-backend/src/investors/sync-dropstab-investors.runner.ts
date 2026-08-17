import { NestFactory } from "@nestjs/core";
import { DropstabInvestorsSyncOptions, DropstabInvestorsSyncService } from "./dropstab-investors-sync.service";
import { DropstabInvestorsCliModule } from "./dropstab-investors-cli.module";

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(DropstabInvestorsCliModule, {
    logger: ["error", "warn", "log"],
  });

  try {
    const service = app.get(DropstabInvestorsSyncService);
    const result = await service.sync(args);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

function parseArgs(argv: string[]): DropstabInvestorsSyncOptions {
  const result: DropstabInvestorsSyncOptions = {};

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim();
    const value = rawValue.trim();

    if (["limit", "offset"].includes(key)) {
      (result as any)[key] = parseNumber(value);
    } else if (key === "only-with-details" || key === "onlyWithDetails") {
      result.onlyWithDetails = parseBoolean(value);
    } else if (key === "updated-since" || key === "onlyUpdatedSince") {
      result.onlyUpdatedSince = value;
    } else if (key === "dry-run" || key === "dryRun") {
      result.dryRun = parseBoolean(value);
    } else if (key === "include-raw" || key === "includeRaw") {
      result.includeRaw = parseBoolean(value);
    } else if (key === "api-url" || key === "apiUrl") {
      result.apiUrl = value;
    }
  }

  return result;
}

function parseNumber(value: string): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseBoolean(value: string): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return Boolean(value);
}

main().catch((error) => {
  console.error(`[sync:dropstab:investors] ${error?.message || error}`);
  if (error?.stack) console.error(error.stack);
  process.exitCode = 1;
});
