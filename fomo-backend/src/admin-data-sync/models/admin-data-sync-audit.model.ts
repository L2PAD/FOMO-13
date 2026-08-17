import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type AdminDataSyncAuditDocument = HydratedDocument<AdminDataSyncAudit>;

@Schema({
  collection: "admin_data_sync_audits",
  timestamps: true,
  strict: true,
  autoIndex: false,
})
export class AdminDataSyncAudit {
  @Prop({ required: true, index: true })
  action: string;

  @Prop()
  adminId?: string;

  @Prop()
  jobId?: string;

  @Prop()
  promotionId?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  details?: Record<string, any>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AdminDataSyncAuditSchema =
  SchemaFactory.createForClass(AdminDataSyncAudit);

AdminDataSyncAuditSchema.index(
  { promotionId: 1, createdAt: -1 },
  { name: "idx_admin_data_sync_audit_promotion_created" }
);
AdminDataSyncAuditSchema.index(
  { jobId: 1, createdAt: -1 },
  { name: "idx_admin_data_sync_audit_job_created" }
);

