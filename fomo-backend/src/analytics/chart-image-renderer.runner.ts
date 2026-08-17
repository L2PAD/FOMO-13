import { NestFactory } from "@nestjs/core";
import {
  ChartImageRendererService,
  Render7dChartImagesOptions,
} from "./chart-image-renderer.service";
import { ChartImageRendererCliModule } from "./chart-image-renderer-cli.module";

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const app = await NestFactory.createApplicationContext(ChartImageRendererCliModule, {
    logger: ["log", "warn", "error"],
  });

  try {
    const service = app.get(ChartImageRendererService);
    const result = await service.render7dChartImages(options);
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

function parseArgs(argv: string[]): Render7dChartImagesOptions {
  const result: Render7dChartImagesOptions = {
    dryRun: true,
    limit: 500,
    batchSize: 100,
  };

  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    const [rawKey, rawValue = "true"] = arg.slice(2).split("=");
    const key = rawKey.trim();
    const value = rawValue.trim();

    if (key === "dry-run" || key === "dryRun") {
      result.dryRun = parseBoolean(value);
    } else if (key === "write") {
      result.dryRun = !parseBoolean(value);
    } else if (key === "limit") {
      result.limit = parseLimit(value);
    } else if (key === "batch-size" || key === "batchSize") {
      result.batchSize = parsePositiveInteger(value, result.batchSize || 100);
    } else if (key === "force") {
      result.force = parseBoolean(value);
    } else if (key === "project-ids" || key === "projectIds") {
      result.projectIds = value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    } else if (key === "cursor") {
      result.cursor = value;
    }
  }

  return result;
}

function parseLimit(value: string): number {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "all" || normalized === "0") return 0;
  return parsePositiveInteger(normalized, 500);
}

function parsePositiveInteger(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
}

function parseBoolean(value: string): boolean {
  const normalized = String(value || "").trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return Boolean(value);
}

main().catch((error) => {
  console.error(`[chart-images:render-7d] ${error?.message || error}`);
  if (error?.stack) console.error(error.stack);
  process.exitCode = 1;
});
