import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type UserBadgeStatus = "earned" | "revoked";

export type UserBadgeDocument = HydratedDocument<UserBadge>;

@Schema({ collection: "user_badges", timestamps: true })
export class UserBadge {
  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true, index: true })
  badgeCode: string;

  @Prop({ default: "earned", index: true })
  status: UserBadgeStatus;

  @Prop({ default: null })
  earnedAt: Date | null;

  // How the badge was granted: "automatic" | "manual"
  @Prop({ default: "automatic" })
  sourceType: string;

  @Prop({ default: "" })
  sourceId: string;

  @Prop({ type: Object, default: {} })
  progressSnapshot: Record<string, any>;

  // Whether the user pinned this badge as featured on their profile.
  @Prop({ default: false })
  featured: boolean;

  @Prop({ default: 0 })
  featuredOrder: number;

  @Prop({ default: "" })
  issuedBy: string;

  @Prop({ default: "" })
  reason: string;

  @Prop({ default: null })
  revokedAt: Date | null;

  @Prop({ default: "" })
  revokedBy: string;

  @Prop({ default: "" })
  revokeReason: string;
}

export const UserBadgeSchema = SchemaFactory.createForClass(UserBadge);

// One badge can be held only once per user.
UserBadgeSchema.index({ userId: 1, badgeCode: 1 }, { unique: true });
