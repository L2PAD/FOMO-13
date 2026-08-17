import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { Deal } from "./deal.model";
import { User } from "src/user/user.model";
import { Chat } from "src/chat/models/chat.model";

export type AppealDocument = HydratedDocument<Appeal>;

export type AppealRole = "buyer" | "seller" | "creator";
export type AppealStatus = "open" | "in_review" | "resolved";

@Schema({ timestamps: true })
export class Appeal {
  @Prop()
  appealId: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: Deal.name, required: true })
  dealId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: User.name, required: true })
  creator: mongoose.Types.ObjectId;

  @Prop({ default: "creator" })
  role: AppealRole;

  @Prop({ default: "" })
  reason: string;

  @Prop({ default: "" })
  description: string;

  @Prop({ default: "" })
  email: string;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ default: "open" })
  status: AppealStatus;

  @Prop({ type: mongoose.Types.ObjectId, ref: User.name, default: null })
  assignedTo: mongoose.Types.ObjectId | null;

  @Prop({ type: mongoose.Types.ObjectId, ref: Chat.name, default: null })
  supportChatId: mongoose.Types.ObjectId | null;

  @Prop({ default: "" })
  resolution: string;

  @Prop({ default: "" })
  txHash: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: User.name, default: null })
  resolvedBy: mongoose.Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  resolvedAt: Date | null;

  @Prop({ default: '' })
  source: string;
}

export const AppealSchema = SchemaFactory.createForClass(Appeal);

AppealSchema.index({ appealId: 1 }, { unique: true, sparse: true });
AppealSchema.index({ dealId: 1 });
AppealSchema.index({ dealId: 1, createdAt: -1 });
AppealSchema.index({ creator: 1, createdAt: -1 });
AppealSchema.index({ status: 1, createdAt: -1 });
