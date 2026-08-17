import { NestFactory } from "@nestjs/core";
import { IcoComparisonHistoryAuditModule } from "./ico-comparison-history-audit.module";
import { IcoComparisonHistoryAuditService } from "./ico-comparison-history-audit.service";

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
  const app = await NestFactory.createApplicationContext(IcoComparisonHistoryAuditModule, {
    bufferLogs: true,
  });

  try {
    const service = app.get(IcoComparisonHistoryAuditService);
    const report = await service.audit({
      limit: getNumberArg("limit"),
      offset: getNumberArg("offset"),
      onlyWithHistory: hasFlag("only-with-history"),
      sortByHistoryCount: hasFlag("sort-by-history-count"),
    });

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exitCode = 1;
});
