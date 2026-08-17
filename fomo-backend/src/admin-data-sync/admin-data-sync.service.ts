import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model } from "mongoose";
import {
  ADMIN_DATA_SYNC_DEV_CONNECTION,
  ADMIN_DATA_SYNC_PROD_CONNECTION,
} from "./admin-data-sync.constants";
import { AdminDataSyncConfigService } from "./admin-data-sync-config.service";
import { AdminDataSyncDiffService, AdminDataSyncDiffInput } from "./admin-data-sync-diff.service";
import { AdminDataSyncJobRunnerService } from "./admin-data-sync-job-runner.service";
import {
  AdminDataSyncJob,
  AdminDataSyncJobDocument,
} from "./models/admin-data-sync-job.model";

@Injectable()
export class AdminDataSyncService {
  private readonly logger = new Logger(AdminDataSyncService.name);

  constructor(
    @InjectConnection(ADMIN_DATA_SYNC_PROD_CONNECTION)
    private readonly prodConnection: Connection,
    @InjectConnection(ADMIN_DATA_SYNC_DEV_CONNECTION)
    private readonly devConnection: Connection,
    @InjectModel(AdminDataSyncJob.name)
    private readonly jobModel: Model<AdminDataSyncJobDocument>,
    private readonly config: AdminDataSyncConfigService,
    private readonly jobRunner: AdminDataSyncJobRunnerService,
    private readonly diffService: AdminDataSyncDiffService
  ) {}

  getConfig() {
    return this.config.getPublicConfig();
  }

  async listJobs(limit = 50) {
    return this.jobModel
      .find({})
      .sort({ createdAt: -1 })
      .limit(Math.min(Math.max(Number(limit) || 50, 1), 100))
      .lean();
  }

  async getJob(jobId: string) {
    const job = await this.jobModel.findById(jobId).lean();
    if (!job) throw new NotFoundException("Data sync job was not found");
    return job;
  }

  async previewProdToDev() {
    this.config.assertProdToDevEnabled();
    this.config.assertSafeConnectionRouting();
    this.logger.log(this.config.formatConnectionSummary());

    const sourceDb = this.config.getProdDbName();
    const targetDb = this.config.getDevDbName();
    const allowlistedCollections = this.config.getProdToDevAllowlist();
    const source = this.getDb(
      this.prodConnection,
      sourceDb,
      ADMIN_DATA_SYNC_PROD_CONNECTION
    );
    const target = this.getOptionalDb(
      this.devConnection,
      targetDb,
      ADMIN_DATA_SYNC_DEV_CONNECTION
    );
    const sourceCounts: Record<string, number | null> = {};
    const targetCounts: Record<string, number | null> = {};
    const missingCollections: string[] = [];
    const warnings: string[] = [];

    for (const collection of allowlistedCollections) {
      sourceCounts[collection] = await this.countCollectionForPreview(
        source,
        sourceDb,
        collection,
        warnings
      );
      targetCounts[collection] = await this.countCollectionForPreview(
        target,
        targetDb,
        collection,
        warnings
      );
    }

    warnings.push(
      "Missing collection detection is skipped in container-safe preview because listCollections is not required."
    );

    return {
      sourceDb,
      targetDb,
      allowlistedCollections,
      sourceCounts,
      targetCounts,
      missingCollections,
      missingCollectionDetection: "skipped",
      warnings,
      sensitiveCollectionsExcluded: this.config.getSensitiveCollections(),
      estimatedRisk: allowlistedCollections.includes("market_project_histories")
        ? "medium"
        : "low",
      backupWillBeCreated: true,
    };
  }

  runProdToDev(adminId: string) {
    return this.jobRunner.queueProdToDevJob(adminId);
  }

  createDevToProdDiff(adminId: string, input: AdminDataSyncDiffInput) {
    return this.diffService.createDiff(adminId, input);
  }

  createPromotion(adminId: string, input: AdminDataSyncDiffInput) {
    return this.diffService.createDiff(adminId, input);
  }

  listPromotions(limit = 50) {
    return this.diffService.listPromotions(limit);
  }

  getPromotion(promotionId: string) {
    return this.diffService.getPromotion(promotionId);
  }

  approvePromotion(adminId: string, promotionId: string) {
    return this.diffService.approvePromotion(adminId, promotionId);
  }

  rejectPromotion(adminId: string, promotionId: string) {
    return this.diffService.rejectPromotion(adminId, promotionId);
  }

  applyPromotion(
    adminId: string,
    promotionId: string,
    input: { confirmationPhrase?: string }
  ) {
    return this.diffService.applyPromotion(adminId, promotionId, input);
  }

  private async countCollectionForPreview(
    db: any,
    dbName: string,
    collection: string,
    warnings: string[]
  ): Promise<number | null> {
    if (!db) {
      const message = `Admin Data Sync cannot read ${dbName}.${collection}; count unavailable. Mongo connection is not configured`;
      warnings.push(message);
      this.logger.warn(message);
      return null;
    }

    try {
      return await db.collection(collection).countDocuments({});
    } catch (error) {
      const message = `Admin Data Sync cannot read ${dbName}.${collection}; count unavailable. ${this.safeMongoErrorMessage(
        error
      )}`;
      warnings.push(message);
      this.logger.warn(message);
      return null;
    }
  }

  private getDb(
    connection: Connection,
    dbName: string,
    connectionName: string
  ): any {
    const db = this.getOptionalDb(connection, dbName, connectionName);
    if (!db) {
      throw new ServiceUnavailableException(
        `Admin Data Sync Mongo connection ${connectionName} is not available`
      );
    }

    return db;
  }

  private getOptionalDb(
    connection: Connection,
    dbName: string,
    connectionName: string
  ): any | null {
    const client = (connection as any)?.client;
    if (!client?.db) {
      this.logger.warn(
        `Admin Data Sync Mongo connection ${connectionName} is unavailable for ${dbName}`
      );
      return null;
    }

    return client.db(dbName);
  }

  private safeMongoErrorMessage(error: any): string {
    const code = error?.code ? `code=${error.code}` : "";
    const codeName = error?.codeName ? `codeName=${error.codeName}` : "";
    const message = String(error?.message || error || "Unknown Mongo error")
      .replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, "mongodb://[redacted]@")
      .slice(0, 500);
    return [code, codeName, message].filter(Boolean).join(" ");
  }
}
