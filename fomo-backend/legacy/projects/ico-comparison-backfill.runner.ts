import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { IcoComparisonBackfillModule } from "./ico-comparison-backfill.module";
import { IcoComparisonBackfillService } from "./ico-comparison-backfill.service";

function getArgValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);

  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0) return process.argv[index + 1];

  return undefined;
}

function getNumberArg(name: string): number | undefined {
  const value = getArgValue(name);
  if (value === undefined) return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

async function run(): Promise<void> {
  const logger = new Logger("IcoComparisonBackfillRunner");
  const app = await NestFactory.createApplicationContext(IcoComparisonBackfillModule, {
    bufferLogs: true,
  });

  try {
    const service = app.get(IcoComparisonBackfillService);
    const summary = await service.runBackfill({
      write: hasFlag("write") || !hasFlag("dry-run"),
      limit: getNumberArg("limit"),
      offset: getNumberArg("offset"),
      cursor: getArgValue("cursor"),
      batchSize: getNumberArg("batch-size"),
      projectBatchSize: getNumberArg("project-batch-size"),
      includeExternal: hasFlag("skip-external")
        ? false
        : hasFlag("include-external")
        ? true
        : undefined,
      externalDays: getNumberArg("external-days"),
      externalDelayMs: getNumberArg("external-delay-ms"),
      minLocalPointsForExternal: getNumberArg("min-local-points-for-external"),
      skipAverages: hasFlag("skip-averages"),
      bucketLimit: getNumberArg("bucket-limit"),
      averageBucketBatchSize: getNumberArg("average-bucket-batch-size"),
      averagesOnly: hasFlag("averages-only"),
    });

    // Keep script output visible even when Nest buffers framework logs.
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
