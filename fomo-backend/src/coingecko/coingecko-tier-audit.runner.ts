import { NestFactory } from "@nestjs/core";
import { CoinGeckoDiagnosticsCliModule } from "./coingecko-diagnostics-cli.module";
import { CoinGeckoTierAuditService } from "./coingecko-tier-audit.service";

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(CoinGeckoDiagnosticsCliModule, {
    logger: false,
  });

  try {
    const service = app.get(CoinGeckoTierAuditService);
    const result = await service.auditTiers();
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(`[coingecko:tier-audit] ${error?.message || error}`);
  if (error?.stack) console.error(error.stack);
  process.exitCode = 1;
});
