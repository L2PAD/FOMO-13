import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bull";
import { MongooseModule } from "@nestjs/mongoose";
import { ScheduleModule } from "@nestjs/schedule";
import { getBullModuleOptions } from "src/config/bull.config";
import { isCronEnabled } from "src/config/cron.config";
import { buildMongoUri } from "src/config/mongo.config";
import { FomoV2Module } from "./fomo-v2.module";
import {
  FOMO_V2_MARKET_SYNC_QUEUE,
  FomoV2MarketHistoryImportWorkerService,
  FomoV2MarketSyncProcessor,
  FomoV2MarketSyncQueueService,
  FomoV2MarketSyncSchedulerService,
} from "./domains/market";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot(getBullModuleOptions()),
    MongooseModule.forRoot(buildMongoUri(), {
      maxPoolSize: parseInt(process.env.FOMO_V2_MARKET_WORKER_DB_MAX_POOL_SIZE || process.env.DB_MAX_POOL_SIZE || "10", 10),
      minPoolSize: parseInt(process.env.FOMO_V2_MARKET_WORKER_DB_MIN_POOL_SIZE || process.env.DB_MIN_POOL_SIZE || "2", 10),
      autoIndex: process.env.DB_AUTO_INDEX === "true",
    }),
    BullModule.registerQueue({
      name: FOMO_V2_MARKET_SYNC_QUEUE,
      limiter: {
        max: parseInt(process.env.FOMO_V2_MARKET_SYNC_QUEUE_RATE_LIMIT_MAX || "60", 10),
        duration: parseInt(process.env.FOMO_V2_MARKET_SYNC_QUEUE_RATE_LIMIT_DURATION_MS || "60000", 10),
      },
    }),
    ...(isCronEnabled() ? [ScheduleModule.forRoot()] : []),
    FomoV2Module,
  ],
  providers: [
    FomoV2MarketSyncQueueService,
    FomoV2MarketSyncSchedulerService,
    FomoV2MarketSyncProcessor,
    FomoV2MarketHistoryImportWorkerService,
  ],
})
export class FomoV2MarketWorkerModule {}
