import { NestFactory } from "@nestjs/core";
import { FomoV2CliModule } from "../fomo-v2-cli.module";
import { FomoV2DomainIntegrityAuditService } from "../services";

async function main(): Promise<void> {
  logProgress("starting domain integrity audit");
  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(FomoV2DomainIntegrityAuditService);
    const report = await service.run();
    console.log(JSON.stringify(report, null, 2));
    if (!report.ok) process.exitCode = 1;
    logProgress(report.ok ? "completed ok" : "completed with errors");
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

function logProgress(message: string): void {
  console.error(
    `[fomo-v2:domain-integrity-audit] ${new Date().toISOString()} ${message}`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      `[fomo-v2:domain-integrity-audit] ${error?.message || error}`
    );
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
