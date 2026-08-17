import {
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { AdminDataSyncConfigService } from "./admin-data-sync-config.service";
import {
  AdminDataSyncAudit,
  AdminDataSyncAuditDocument,
} from "./models/admin-data-sync-audit.model";
import {
  AdminDataSyncJob,
  AdminDataSyncJobDocument,
} from "./models/admin-data-sync-job.model";

const ACTIVE_JOB_STATUSES = ["queued", "running"];

@Injectable()
export class AdminDataSyncJobRunnerService {
  private readonly logger = new Logger(AdminDataSyncJobRunnerService.name);

  constructor(
    @InjectModel(AdminDataSyncJob.name)
    private readonly jobModel: Model<AdminDataSyncJobDocument>,
    @InjectModel(AdminDataSyncAudit.name)
    private readonly auditModel: Model<AdminDataSyncAuditDocument>,
    private readonly config: AdminDataSyncConfigService
  ) {}

  async queueProdToDevJob(adminId: string) {
    this.config.assertProdToDevEnabled();
    this.config.assertSafeConnectionRouting();
    const runMode = this.config.getProdToDevRunMode();

    if (runMode === "disabled") {
      throw new ServiceUnavailableException(
        "Prod to dev run is disabled. Run the VPS script manually or enable a safe runner."
      );
    }

    if (runMode === "backend-native") {
      throw new ServiceUnavailableException(
        "Backend-native prod to dev sync is not implemented yet. Use disabled or host-runner mode."
      );
    }

    const activeJob = await this.jobModel
      .findOne({
        type: "prod_to_dev",
        status: { $in: ACTIVE_JOB_STATUSES },
      })
      .lean();

    if (activeJob) {
      throw new ConflictException("A prod to dev sync job is already running");
    }

    const job = await this.jobModel.create({
      type: "prod_to_dev",
      status: "queued",
      startedByAdminId: adminId,
      sourceDb: this.config.getProdDbName(),
      targetDb: this.config.getDevDbName(),
      collections: this.config.getProdToDevAllowlist(),
      copiedCounts: {},
      skippedCollections: [],
      stdoutSummary:
        runMode === "host-runner"
          ? "Queued for external host runner. Backend container did not execute Docker or shell commands."
          : undefined,
    });

    await this.auditModel.create({
      action: "prod_to_dev_job_queued",
      adminId,
      jobId: String(job._id),
      details: {
        sourceDb: job.sourceDb,
        targetDb: job.targetDb,
        collections: job.collections,
        runMode,
      },
    });

    return {
      jobId: String(job._id),
      status: job.status,
      runMode,
    };
  }

  private errorMessage(error: any): string {
    const message = String(error?.message || error || "Unknown error").slice(
      0,
      1000
    );
    this.logger.error(message);
    return message;
  }
}
