import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type BadgeAuditLogDocument = HydratedDocument<BadgeAuditLog>;

@Schema({ collection: "badge_audit_logs", timestamps: true })
export class BadgeAuditLog {
  // award | revoke | definition.create | definition.update | definition.delete
  @Prop({ required: true, index: true })
  action: string;

  @Prop({ default: "", index: true })
  userId: string;

  @Prop({ default: "", index: true })
  badgeCode: string;

  // "automatic" | "manual" | "admin"
  @Prop({ default: "" })
  actorType: string;

  @Prop({ default: "" })
  actorId: string;

  @Prop({ default: "" })
  reason: string;

  @Prop({ type: Object, default: {} })
  meta: Record<string, any>;
}

export const BadgeAuditLogSchema = SchemaFactory.createForClass(BadgeAuditLog);
