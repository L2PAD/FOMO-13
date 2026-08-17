import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { FomoV2MarketWorkerModule } from "./fomo-v2/fomo-v2-market-worker.module";

async function bootstrap(): Promise<void> {
  process.env.FOMO_V2_MARKET_QUEUE_ENABLED = process.env.FOMO_V2_MARKET_QUEUE_ENABLED || "true";
  process.env.FOMO_V2_MARKET_WORKER_PROCESS = "true";

  const logger = new Logger("FomoV2MarketWorker");
  await NestFactory.createApplicationContext(FomoV2MarketWorkerModule, {
    logger: ["log", "error", "warn", "debug"],
  });
  logger.log("FOMO v2 market worker started");
}

bootstrap().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(`[fomo-v2-market-worker] ${error?.message || error}`);
  if (error?.stack) {
    // eslint-disable-next-line no-console
    console.error(error.stack);
  }
  process.exitCode = 1;
});
