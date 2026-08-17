import { NestFactory } from "@nestjs/core";
import { DropstabInvestorsSyncService } from "./dropstab-investors-sync.service";
import { DropstabInvestorsCliModule } from "./dropstab-investors-cli.module";

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(DropstabInvestorsCliModule, {
    logger: ["error", "warn"],
  });

  try {
    const service = app.get(DropstabInvestorsSyncService);
    const result = await service.auditSync();
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(`[audit:dropstab:investors:sync] ${error?.message || error}`);
  if (error?.stack) console.error(error.stack);
  process.exitCode = 1;
});
