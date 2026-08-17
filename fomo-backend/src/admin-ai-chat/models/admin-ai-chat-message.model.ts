import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export const ADMIN_AI_CHAT_MESSAGE_ROLES = ["user", "assistant", "system"] as const;
export type AdminAiChatMessageRole = typeof ADMIN_AI_CHAT_MESSAGE_ROLES[number];

export const ADMIN_AI_CHAT_MESSAGE_STATUSES = ["done", "error"] as const;
export type AdminAiChatMessageStatus = typeof ADMIN_AI_CHAT_MESSAGE_STATUSES[number];

export type AdminAiChatMessageDocument = HydratedDocument<AdminAiChatMessage>;

@Schema({ collection: "admin_ai_chat_messages", timestamps: true })
export class AdminAiChatMessage {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "AdminAiChatThread", required: true })
  threadId: mongoose.Types.ObjectId;

  @Prop({ enum: ADMIN_AI_CHAT_MESSAGE_ROLES, required: true })
  role: AdminAiChatMessageRole;

  @Prop({ required: true })
  content: string;

  @Prop({ enum: ADMIN_AI_CHAT_MESSAGE_STATUSES, default: "done" })
  status: AdminAiChatMessageStatus;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AdminAiChatMessageSchema = SchemaFactory.createForClass(AdminAiChatMessage);

AdminAiChatMessageSchema.index({ threadId: 1, createdAt: 1 });
