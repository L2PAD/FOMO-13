import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type AdminAiChatFolderDocument = HydratedDocument<AdminAiChatFolder>;

@Schema({ collection: "admin_ai_chat_folders", timestamps: true })
export class AdminAiChatFolder {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  createdBy: mongoose.Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AdminAiChatFolderSchema = SchemaFactory.createForClass(AdminAiChatFolder);

AdminAiChatFolderSchema.index({ createdBy: 1, updatedAt: -1 });
