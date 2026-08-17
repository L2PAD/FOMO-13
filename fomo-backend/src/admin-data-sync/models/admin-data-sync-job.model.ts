import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export const ADMIN_DATA_SYNC_JOB_STATUSES = [
  "queued",
  "running",
  "success",
  "failed",
  "cancelled",
] as const;

export type AdminDataSyncJobStatus =
  (typeof ADMIN_DATA_SYNC_JOB_STATUSES)[number];

export type AdminDataSyncJobDocument = HydratedDocument<AdminDataSyncJob>;

@Schema({
  collection: "admin_data_sync_jobs",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class AdminDataSyncJob {
  @Prop({ type: String, required: true, enum: ["prod_to_dev"] })
  type: "prod_to_dev";

  @Prop({
    type: String,
    required: true,
    enum: ADMIN_DATA_SYNC_JOB_STATUSES,
    index: true,
  })
  status: AdminDataSyncJobStatus;

  @Prop()
  startedByAdminId?: string;

  @Prop()
  startedAt?: Date;

  @Prop()
  finishedAt?: Date;

  @Prop()
  durationMs?: number;

  @Prop({ required: true })
  sourceDb: string;

  @Prop({ required: true })
  targetDb: string;

  @Prop({ type: [String], default: [] })
  collections: string[];

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  copiedCounts?: Record<string, number>;

  @Prop({ type: [String], default: [] })
  skippedCollections?: string[];

  @Prop()
  backupPath?: string;

  @Prop()
  errorSummary?: string;

  @Prop()
  stdoutSummary?: string;

  @Prop()
  stderrSummary?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AdminDataSyncJobSchema =
  SchemaFactory.createForClass(AdminDataSyncJob);

AdminDataSyncJobSchema.index(
  { status: 1, createdAt: -1 },
  { name: "idx_admin_data_sync_jobs_status_created" }
);
AdminDataSyncJobSchema.index(
  { type: 1, status: 1 },
  { name: "idx_admin_data_sync_jobs_type_status" }
);
AdminDataSyncJobSchema.index(
  { createdAt: -1 },
  { name: "idx_admin_data_sync_jobs_created_desc" }
);

