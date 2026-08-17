import { NestFactory } from "@nestjs/core";
import { FomoV2CliModule } from "../../../fomo-v2-cli.module";
import { FomoV2ReviewService } from "../services";

async function main(): Promise<void> {
  logProgress("starting review domain audit");
  const app = await NestFactory.createApplicationContext(FomoV2CliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(FomoV2ReviewService);
    const report = await service.auditReviewDomain();
    console.log(JSON.stringify(report, null, 2));
    logProgress("completed");
  } finally {
    await app.close();
    logProgress("closed application context");
  }
}

function logProgress(message: string): void {
  console.error(
    `[fomo-v2:review-domain-audit] ${new Date().toISOString()} ${message}`
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`[fomo-v2:review-domain-audit] ${error?.message || error}`);
    if (error?.stack) console.error(error.stack);
    process.exitCode = 1;
  });
}
