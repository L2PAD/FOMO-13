import { NestFactory } from "@nestjs/core";
import { FomoV2CliModule } from "../../../fomo-v2-cli.module";
import { FomoV2BackerService } from "../services";

async function main(): Promise<void> {
  parseArgs(process.argv.slice(2));
  logProgress("starting read-only audit");

  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(FomoV2BackerService);
    const result = await service.auditDomain();
    console.log(JSON.stringify(result, null, 2));
    logProgress("completed");
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

export function parseArgs(argv: string[]): void {
  for (const arg of argv) {
    if (!arg.startsWith("--")) continue;
    throw new Error(`Unknown option ${arg}.`);
  }
}

function logProgress(message: string): void {
  console.error(
    `[fomo-v2:backer-domain-audit] ${new Date().toISOString()} ${message}`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:backer-domain-audit] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
