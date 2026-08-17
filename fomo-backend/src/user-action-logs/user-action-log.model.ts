import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type UserActionLogDocument = HydratedDocument<UserActionLog>;

export type UserActionLogActorType = "user" | "admin" | "moderator" | "system";
export type UserActionLogSeverity = "info" | "warning" | "critical";

@Schema({
  collection: "user_action_logs",
  timestamps: true,
})
export class UserActionLog {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  })
  userId: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
    index: true,
  })
  actorId?: mongoose.Types.ObjectId | null;

  @Prop({ type: String, default: "user" })
  actorType: UserActionLogActorType;

  @Prop({ type: String, required: true, index: true })
  category: string;

  @Prop({ type: String, required: true, index: true })
  action: string;

  @Prop({ type: String, default: "info" })
  severity: UserActionLogSeverity;

  @Prop({ type: String, default: "" })
  title: string;

  @Prop({ type: String, default: "" })
  description: string;

  @Prop({ type: String, default: "", index: true })
  entityType: string;

  @Prop({ type: String, default: "", index: true })
  entityId: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;

  @Prop({ type: Object, default: {} })
  request: Record<string, unknown>;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserActionLogSchema = SchemaFactory.createForClass(UserActionLog);

UserActionLogSchema.index({ userId: 1, createdAt: -1 });
UserActionLogSchema.index({ userId: 1, category: 1, createdAt: -1 });
UserActionLogSchema.index({ userId: 1, action: 1, createdAt: -1 });
UserActionLogSchema.index({ actorId: 1, createdAt: -1 });
UserActionLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
