import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type SocialNotificationDocument = HydratedDocument<SocialNotification>;

/**
 * Social notification — the full FOMO social loop.
 * Created whenever another user interacts with your content: repost, reply,
 * like, follow or quote. Self-actions never notify. Separate collection from the
 * legacy content-subscription notifications.
 */
export type SocialNotificationType = "REPOST" | "REPLY" | "LIKE" | "FOLLOW" | "QUOTE";

@Schema({ timestamps: true })
export class SocialNotification {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  recipient: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  actor: Types.ObjectId;

  @Prop({ enum: ["REPOST", "REPLY", "LIKE", "FOLLOW", "QUOTE"], required: true })
  type: SocialNotificationType;

  @Prop({ type: Types.ObjectId, ref: "Comment", default: null })
  topicId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: "Comment", default: null })
  commentId: Types.ObjectId | null;

  @Prop({ default: "" })
  preview: string;

  @Prop({ default: false, index: true })
  read: boolean;
}

export const SocialNotificationSchema = SchemaFactory.createForClass(SocialNotification);
SocialNotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
SocialNotificationSchema.index({ recipient: 1, actor: 1, type: 1, topicId: 1, commentId: 1 });
