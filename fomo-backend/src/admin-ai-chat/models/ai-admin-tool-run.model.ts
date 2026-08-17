import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type AiAdminToolRunDocument = HydratedDocument<AiAdminToolRun>;

@Schema({ collection: "ai_admin_tool_runs" })
export class AiAdminToolRun {
  @Prop({ trim: true })
  userId?: string;

  @Prop({ trim: true })
  chatId?: string;

  @Prop({ trim: true })
  messageId?: string;

  @Prop({ required: true, trim: true })
  toolName: string;

  @Prop({ required: true, trim: true })
  dbName: string;

  @Prop({ trim: true })
  targetDb?: string;

  @Prop({ trim: true })
  accessMode?: string;

  @Prop({ default: false })
  requiresApproval: boolean;

  @Prop({
    enum: ["not_required", "pending", "approved", "rejected"],
    default: "not_required",
  })
  approvalStatus: "not_required" | "pending" | "approved" | "rejected";

  @Prop({ type: mongoose.Schema.Types.Mixed })
  approvedBy?: mongoose.Types.ObjectId | string;

  @Prop()
  approvedAt?: Date;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  editedPayload?: unknown;

  @Prop()
  editedPayloadAt?: Date;

  @Prop({ trim: true })
  adminNote?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  rejectedBy?: mongoose.Types.ObjectId | string;

  @Prop()
  rejectedAt?: Date;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  collectionName?: string | string[];

  @Prop({ trim: true })
  operation?: string;

  @Prop({ type: Object, default: {} })
  input: Record<string, unknown>;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  plannedChanges?: unknown;

  @Prop({ default: false })
  dryRun: boolean;

  @Prop({ default: false })
  confirm: boolean;

  @Prop({ enum: ["done", "error", "blocked", "pending"], required: true })
  status: "done" | "error" | "blocked" | "pending";

  @Prop({ type: Object, default: {} })
  resultSummary: Record<string, unknown>;

  @Prop({ default: 0 })
  createdCount: number;

  @Prop({ default: 0 })
  updatedCount: number;

  @Prop({ default: 0 })
  modifiedCount: number;

  @Prop({ type: [String], default: [] })
  affectedIds: string[];

  @Prop({ trim: true })
  error?: string;

  @Prop({ required: true })
  startedAt: Date;

  @Prop({ required: true })
  finishedAt: Date;

  @Prop()
  executedAt?: Date;
}

export const AiAdminToolRunSchema = SchemaFactory.createForClass(AiAdminToolRun);

AiAdminToolRunSchema.index({ userId: 1, startedAt: -1 });
AiAdminToolRunSchema.index({ chatId: 1, messageId: 1, startedAt: 1 });
AiAdminToolRunSchema.index({ toolName: 1, status: 1, startedAt: -1 });
AiAdminToolRunSchema.index({ dbName: 1, startedAt: -1 });
AiAdminToolRunSchema.index({ approvalStatus: 1, startedAt: -1 });
