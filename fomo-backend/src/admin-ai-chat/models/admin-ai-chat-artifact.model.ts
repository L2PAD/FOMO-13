import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export const ADMIN_AI_CHAT_ARTIFACT_STATUSES = [
  "queued",
  "processing",
  "ready",
  "failed",
] as const;

export type AdminAiChatArtifactStatus =
  (typeof ADMIN_AI_CHAT_ARTIFACT_STATUSES)[number];
export type AdminAiChatArtifactDocument = HydratedDocument<AdminAiChatArtifact>;

@Schema({ collection: "admin_ai_chat_artifacts", timestamps: true, autoIndex: false })
export class AdminAiChatArtifact {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "AdminAiChatThread", required: true })
  threadId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "AdminAiChatMessage", required: true })
  requestMessageId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, required: true })
  createdBy: mongoose.Types.ObjectId;

  @Prop({ required: true, enum: ["collection", "vesting_reviews"] })
  kind: "collection" | "vesting_reviews";

  @Prop({ required: true })
  dbTarget: string;

  @Prop({ required: true })
  collectionName: string;

  @Prop({ type: Object, default: {} })
  spec: Record<string, unknown>;

  @Prop({ required: true, enum: ["json", "jsonl"], default: "jsonl" })
  format: "json" | "jsonl";

  @Prop({ required: true, enum: ["none", "gzip"], default: "gzip" })
  compression: "none" | "gzip";

  @Prop({ required: true })
  filename: string;

  @Prop({ enum: ADMIN_AI_CHAT_ARTIFACT_STATUSES, default: "queued" })
  status: AdminAiChatArtifactStatus;

  @Prop({ default: 0 })
  progress: number;

  @Prop({ default: 0 })
  documentCount: number;

  @Prop({ default: 0 })
  bytes: number;

  @Prop()
  sha256?: string;

  @Prop()
  storageKey?: string;

  @Prop()
  contentType?: string;

  @Prop()
  errorCode?: string;

  @Prop()
  errorMessage?: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop()
  startedAt?: Date;

  @Prop()
  completedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AdminAiChatArtifactSchema =
  SchemaFactory.createForClass(AdminAiChatArtifact);

AdminAiChatArtifactSchema.index({ createdBy: 1, createdAt: -1 });
AdminAiChatArtifactSchema.index({ threadId: 1, createdAt: -1 });
AdminAiChatArtifactSchema.index({ status: 1, createdAt: 1 });
AdminAiChatArtifactSchema.index({ expiresAt: 1 });
