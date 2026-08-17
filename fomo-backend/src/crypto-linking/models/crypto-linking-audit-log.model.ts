import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type CryptoLinkingAuditLogDocument = HydratedDocument<CryptoLinkingAuditLog>;

export type CryptoLinkingEntityType =
  | "project"
  | "fund"
  | "person"
  | "investor";

@Schema({
  collection: "crypto_linking_audit_logs",
  timestamps: { createdAt: true, updatedAt: false },
  strict: false,
})
export class CryptoLinkingAuditLog {
  @Prop({ required: true })
  operation: string;

  @Prop({ required: true })
  entityType: CryptoLinkingEntityType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  entityId: mongoose.Types.ObjectId;

  @Prop()
  targetEntityType?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId })
  targetEntityId?: mongoose.Types.ObjectId;

  @Prop({ type: [Object], default: [] })
  projectLinks?: Array<Record<string, any>>;

  @Prop({ required: true })
  confidence: string;

  @Prop({ required: true })
  matchedBy: string;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true, default: true })
  dryRun: boolean;

  @Prop({ required: true, default: "applied" })
  status: "applied" | "skipped" | "conflict" | "failed";

  @Prop()
  error?: string;

  @Prop({ type: Object })
  before?: any;

  @Prop({ type: Object })
  after?: any;

  @Prop()
  source?: string;

  @Prop()
  batchId?: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const CryptoLinkingAuditLogSchema = SchemaFactory.createForClass(CryptoLinkingAuditLog);

CryptoLinkingAuditLogSchema.index({ entityType: 1, entityId: 1 });
CryptoLinkingAuditLogSchema.index({ operation: 1 });
CryptoLinkingAuditLogSchema.index({ createdAt: -1 });
CryptoLinkingAuditLogSchema.index({ batchId: 1 });
CryptoLinkingAuditLogSchema.index({ dryRun: 1 });
CryptoLinkingAuditLogSchema.index({ status: 1 });
