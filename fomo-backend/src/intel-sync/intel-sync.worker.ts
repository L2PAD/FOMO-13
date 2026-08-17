import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { CryptoActivitiesSyncService } from "src/crypto-activities/services/crypto-activities-sync.service";
import { FundsIntelInvestorsSyncService } from "src/funds/funds-intel-investors-sync.service";
import { DropstabInvestorsSyncService } from "src/investors/dropstab-investors-sync.service";
import { IntelSyncWorkerModule } from "./intel-sync-worker.module";
import { IntelSyncJobName, IntelSyncTrigger } from "./intel-sync.types";

async function bootstrap() {
  const logger = new Logger("IntelSyncWorker");
  const job = process.argv[2] as IntelSyncJobName | undefined;
  const trigger = (process.argv[3] as IntelSyncTrigger | undefined) || "manual";
  const options = parseWorkerOptions();

  if (!job) {
    logger.error("Intel sync worker job is not specified");
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(IntelSyncWorkerModule, {
    bufferLogs: true,
  });

  try {
    logger.log(`Worker started for job=${job} trigger=${trigger}`);

    switch (job) {
      case "funds-intel-investors":
        await app
          .get(FundsIntelInvestorsSyncService)
          .executeSyncFromIntelInvestors(trigger, { force: true });
        break;
      case "dropstab-investors":
        await app
          .get(DropstabInvestorsSyncService)
          .sync(options);
        break;
      case "crypto-activities-parser-sync":
        await app
          .get(CryptoActivitiesSyncService)
          .syncCryptoActivities(options, trigger);
        break;
      default:
        logger.error(`Unsupported intel sync worker job: ${job}`);
        process.exitCode = 1;
        return;
    }

    logger.log(`Worker finished for job=${job} trigger=${trigger}`);
  } catch (error) {
    logger.error(
      `Worker failed for job=${job}: ${error.message}`,
      error.stack,
    );
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}

function parseWorkerOptions(): Record<string, any> {
  try {
    const raw = process.env.INTEL_SYNC_WORKER_OPTIONS;
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

void bootstrap();
