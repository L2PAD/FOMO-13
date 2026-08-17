import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { v4 as uuidv4 } from "uuid";

/**
 * Real session/activity tracking layer for platform analytics.
 * These are RAW analytics events — they are NOT XP. XP is only awarded by the
 * XP ledger after qualification/anti-farm. Raw page_view/heartbeat never grant XP.
 */

/** A browsing session (anonymous or authenticated). */
@Schema({ collection: "user_sessions", timestamps: true })
export class UserSession extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  _id: string;

  @Prop({ type: String, required: true, unique: true, index: true })
  sessionId: string;

  @Prop({ type: String, default: "", index: true })
  anonymousId: string;

  @Prop({ type: String, default: null, index: true })
  userId: string | null;

  @Prop({ type: Boolean, default: false })
  isAuthenticated: boolean;

  @Prop({ type: Date, default: () => new Date(), index: true })
  startedAt: Date;

  @Prop({ type: Date, default: () => new Date(), index: true })
  lastActivityAt: Date;

  @Prop({ type: Date, default: null })
  endedAt: Date | null;

  /** Foreground, non-idle active time in milliseconds (client-measured, server-capped). */
  @Prop({ type: Number, default: 0 })
  activeMs: number;

  @Prop({ type: Number, default: 0 })
  pageViews: number;

  @Prop({ type: Number, default: 0 })
  eventsCount: number;

  @Prop({ type: String, default: "" })
  entryPage: string;

  @Prop({ type: String, default: "" })
  lastPage: string;

  @Prop({ type: String, default: "" })
  referrer: string;

  @Prop({ type: String, default: "" })
  userAgent: string;
}
export const UserSessionSchema = SchemaFactory.createForClass(UserSession);

/** A single raw analytics event. */
@Schema({ collection: "user_activity_events", timestamps: true })
export class UserActivityEvent extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  _id: string;

  @Prop({ type: String, default: "", index: true })
  sessionId: string;

  @Prop({ type: String, default: "", index: true })
  anonymousId: string;

  @Prop({ type: String, default: null, index: true })
  userId: string | null;

  @Prop({ type: String, required: true, index: true })
  eventType: string;

  @Prop({ type: String, default: "" })
  page: string;

  @Prop({ type: Date, default: () => new Date(), index: true })
  occurredAt: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}
export const UserActivityEventSchema = SchemaFactory.createForClass(UserActivityEvent);
UserActivityEventSchema.index({ userId: 1, occurredAt: -1 });
UserActivityEventSchema.index({ eventType: 1, occurredAt: -1 });

/** Per-day rollup for fast DAU/active-time queries. */
@Schema({ collection: "user_activity_daily", timestamps: true })
export class UserActivityDaily extends Document {
  @Prop({ type: String, default: () => uuidv4() })
  _id: string;

  /** UTC day key YYYY-MM-DD. */
  @Prop({ type: String, required: true, index: true })
  day: string;

  @Prop({ type: String, default: "", index: true })
  anonymousId: string;

  @Prop({ type: String, default: null, index: true })
  userId: string | null;

  @Prop({ type: Number, default: 0 })
  activeMs: number;

  @Prop({ type: Number, default: 0 })
  events: number;

  @Prop({ type: Number, default: 0 })
  pageViews: number;

  @Prop({ type: Number, default: 0 })
  sessions: number;
}
export const UserActivityDailySchema = SchemaFactory.createForClass(UserActivityDaily);
UserActivityDailySchema.index({ day: 1, userId: 1 });
