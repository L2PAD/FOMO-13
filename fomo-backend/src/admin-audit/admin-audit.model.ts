import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

export type AdminAuditEventDocument = HydratedDocument<AdminAuditEvent>;

/**
 * NEWS-1 Phase 6A P8 — minimal reusable admin audit trail.
 * A single generic, append-only event model consumed by any admin domain
 * (first consumer: News). NEVER store secrets/keys in before/after/reason.
 */
@Schema({ collection: "admin_audit_events", timestamps: false })
export class AdminAuditEvent {
  @Prop({ index: true })
  actorId: string;

  @Prop()
  actorRole: string;

  @Prop({ index: true })
  domain: string; // e.g. NEWS, SOURCE, AI_POLICY

  @Prop({ index: true })
  action: string; // e.g. NEWS_PUBLISHED

  @Prop()
  targetType: string;

  @Prop({ index: true })
  targetId: string;

  @Prop({ type: Object, default: null })
  before: any;

  @Prop({ type: Object, default: null })
  after: any;

  @Prop()
  reason: string;

  @Prop({ default: () => new Date(), index: true })
  createdAt: Date;
}

export const AdminAuditEventSchema = SchemaFactory.createForClass(AdminAuditEvent);
