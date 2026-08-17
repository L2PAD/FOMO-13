import { Module } from "@nestjs/common";
import { IntelSyncWorkerRunnerService } from "./intel-sync-worker-runner.service";

@Module({
  providers: [IntelSyncWorkerRunnerService],
  exports: [IntelSyncWorkerRunnerService],
})
export class IntelSyncModule {}
