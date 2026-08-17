import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type AdminAiChatToolRunDocument = HydratedDocument<AdminAiChatToolRun>;

@Schema({ collection: "admin_ai_chat_tool_runs", timestamps: true })
export class AdminAiChatToolRun {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "AdminAiChatThread", required: true })
  threadId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "AdminAiChatMessage", required: true })
  messageId: mongoose.Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: Object, default: {} })
  arguments: Record<string, unknown>;

  @Prop({ enum: ["done", "error", "blocked", "pending"], required: true })
  status: "done" | "error" | "blocked" | "pending";

  @Prop({ default: 0 })
  durationMs: number;

  @Prop({ type: Object, default: {} })
  resultSummary: Record<string, unknown>;

  @Prop({ trim: true })
  errorCode?: string;

  @Prop({ trim: true })
  provider?: string;

  @Prop({ trim: true })
  model?: string;

  @Prop({ trim: true })
  trackingId?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AdminAiChatToolRunSchema =
  SchemaFactory.createForClass(AdminAiChatToolRun);

AdminAiChatToolRunSchema.index({ threadId: 1, createdAt: -1 });
AdminAiChatToolRunSchema.index({ messageId: 1 });
AdminAiChatToolRunSchema.index({ name: 1, status: 1, createdAt: -1 });
