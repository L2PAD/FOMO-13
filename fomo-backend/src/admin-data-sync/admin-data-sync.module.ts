import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { AdminDataSyncConfigService } from "./admin-data-sync-config.service";
import { AdminDataSyncController } from "./admin-data-sync.controller";
import { AdminDataSyncDiffService } from "./admin-data-sync-diff.service";
import { AdminDataSyncJobRunnerService } from "./admin-data-sync-job-runner.service";
import {
  adminDataSyncDevConnectionProvider,
  adminDataSyncProdConnectionProvider,
} from "./admin-data-sync-mongo.providers";
import { AdminDataSyncService } from "./admin-data-sync.service";
import {
  AdminDataSyncAudit,
  AdminDataSyncAuditSchema,
} from "./models/admin-data-sync-audit.model";
import {
  AdminDataSyncJob,
  AdminDataSyncJobSchema,
} from "./models/admin-data-sync-job.model";
import {
  AdminDataSyncPromotion,
  AdminDataSyncPromotionSchema,
} from "./models/admin-data-sync-promotion.model";
import {
  AdminDataSyncSnapshot,
  AdminDataSyncSnapshotSchema,
} from "./models/admin-data-sync-snapshot.model";

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: AdminDataSyncJob.name, schema: AdminDataSyncJobSchema },
      {
        name: AdminDataSyncPromotion.name,
        schema: AdminDataSyncPromotionSchema,
      },
      { name: AdminDataSyncSnapshot.name, schema: AdminDataSyncSnapshotSchema },
      { name: AdminDataSyncAudit.name, schema: AdminDataSyncAuditSchema },
    ]),
  ],
  controllers: [AdminDataSyncController],
  providers: [
    AdminDataSyncConfigService,
    adminDataSyncProdConnectionProvider,
    adminDataSyncDevConnectionProvider,
    AdminDataSyncService,
    AdminDataSyncDiffService,
    AdminDataSyncJobRunnerService,
  ],
})
export class AdminDataSyncModule {}
