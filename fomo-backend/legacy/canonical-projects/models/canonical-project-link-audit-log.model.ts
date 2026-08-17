import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type CanonicalProjectLinkAuditLogDocument = HydratedDocument<CanonicalProjectLinkAuditLog>;

export type CanonicalProjectLinkAuditOperation =
  | "propose"
  | "verify"
  | "reject"
  | "unlink"
  | "merge"
  | "conflict"
  | "backfill_dry_run"
  | "backfill_apply";

export type CanonicalProjectLinkAuditStatus = "success" | "skipped" | "conflict" | "error";

@Schema({
  collection: "canonical_project_link_audit_logs",
  timestamps: { createdAt: true, updatedAt: false },
  strict: false,
})
export class CanonicalProjectLinkAuditLog {
  @Prop({
    required: true,
    enum: ["propose", "verify", "reject", "unlink", "merge", "conflict", "backfill_dry_run", "backfill_apply"],
    index: true,
  })
  operation: CanonicalProjectLinkAuditOperation;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "CanonicalProject", index: true })
  canonicalProjectId?: mongoose.Types.ObjectId;

  @Prop({ index: true })
  entityType?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, index: true })
  entityId?: mongoose.Types.ObjectId;

  @Prop({ type: Object })
  before?: any;

  @Prop({ type: Object })
  after?: any;

  @Prop()
  confidence?: number;

  @Prop()
  matchedBy?: string;

  @Prop()
  reason?: string;

  @Prop({ required: true, default: true, index: true })
  dryRun: boolean;

  @Prop({ required: true, enum: ["success", "skipped", "conflict", "error"], index: true })
  status: CanonicalProjectLinkAuditStatus;

  @Prop()
  error?: string;
}

export const CanonicalProjectLinkAuditLogSchema =
  SchemaFactory.createForClass(CanonicalProjectLinkAuditLog);

CanonicalProjectLinkAuditLogSchema.index({ operation: 1, createdAt: -1 });
CanonicalProjectLinkAuditLogSchema.index({ canonicalProjectId: 1, createdAt: -1 });
CanonicalProjectLinkAuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
CanonicalProjectLinkAuditLogSchema.index({ status: 1, createdAt: -1 });

