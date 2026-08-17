import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type AdminAiChatThreadDocument = HydratedDocument<AdminAiChatThread>;

@Schema({ collection: "admin_ai_chat_threads", timestamps: true })
export class AdminAiChatThread {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  createdBy: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "AdminAiChatFolder", default: null })
  folderId?: mongoose.Types.ObjectId | null;

  @Prop({ default: false })
  isPinned: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AdminAiChatThreadSchema = SchemaFactory.createForClass(AdminAiChatThread);

AdminAiChatThreadSchema.index({ createdBy: 1, updatedAt: -1 });
AdminAiChatThreadSchema.index({ createdBy: 1, folderId: 1, updatedAt: -1 });
