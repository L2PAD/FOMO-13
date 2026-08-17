import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type EventDocument = HydratedDocument<Event>;

@Schema({ timestamps: true })
export class Event {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  date: Date;

  @Prop({required:true})
  endDate:Date  

  @Prop()
  time: string;

  @Prop()
  endTime: string;

  @Prop({required:true,default:'moderator'})
  status: string;

  @Prop()
  stars: number;

  @Prop()
  projectId: mongoose.Types.ObjectId;

  @Prop({required: true })
  page: string

  @Prop({default:false})
  isPrivate:boolean

  @Prop({required:false})
  userId:mongoose.Types.ObjectId

  @Prop()
  sourceType?: string;

  @Prop()
  sourceId?: string;

  @Prop()
  projectName?: string;

  @Prop()
  projectSlug?: string;

  @Prop()
  projectLogo?: string;

  @Prop()
  tokenSymbol?: string;

  @Prop()
  unlockDate?: Date;

  @Prop()
  unlockAmount?: number;

  @Prop()
  unlockValueUsd?: number;

  @Prop()
  unlockPercent?: number;

  @Prop({ default: false })
  notifyEnabled?: boolean;

  @Prop()
  notifyAt?: Date;

  @Prop()
  notifyBeforeMinutes?: number;

  @Prop()
  notifySentAt?: Date;

  @Prop()
  notifyClaimedAt?: Date;

  @Prop()
  notifyClaimedBy?: string;

  @Prop({ default: 0 })
  notifyAttemptCount?: number;

  @Prop()
  notifyLastError?: string;

  @Prop()
  description?: string;

  // ── EPIC CAL-1: canonical unified calendar fields (all optional, non-breaking) ──
  // P2/P3: source vs type registry
  @Prop({ index: true })
  eventType?: string; // e.g. TOKEN_UNLOCK, PROJECT_UPDATE, ANNOUNCEMENT, DEADLINE...

  @Prop()
  category?: string;

  // P1: visibility & lifecycle
  @Prop({ default: "PUBLIC", index: true })
  visibility?: string; // PUBLIC | AUTHENTICATED | PRIVATE | SEGMENT

  @Prop({ index: true })
  lifecycleStatus?: string; // DRAFT | SCHEDULED | PUBLISHED | CANCELLED | COMPLETED | ARCHIVED

  @Prop({ default: false })
  allDay?: boolean;

  @Prop()
  timezone?: string; // canonical storage UTC; source tz for display

  @Prop()
  priority?: number;

  // P7: card / CTA
  @Prop()
  image?: string;

  @Prop()
  icon?: string;

  @Prop()
  colorKey?: string;

  // EPIC CAL-2: cross-through to an in-app News article (Buzz News base logic).
  @Prop()
  relatedArticleId?: string;

  @Prop()
  ctaLabel?: string;

  @Prop()
  ctaUrl?: string;

  // related entity (P14)
  @Prop()
  entityType?: string;

  @Prop()
  entityId?: string;

  @Prop({ type: [String], default: undefined })
  tags?: string[];

  // P32: scheduling
  @Prop()
  publishAt?: Date;

  @Prop()
  publishedAt?: Date;

  // P15: AI-ready provenance
  @Prop()
  sourceUrl?: string;

  @Prop()
  sourceName?: string;

  @Prop()
  sourcePublishedAt?: Date;

  @Prop({ default: "MANUAL" })
  generatedBy?: string; // MANUAL | CLAUDE | OPENAI | IMPORT

  @Prop()
  generationRunId?: string;

  @Prop()
  confidence?: number;

  @Prop({ default: "UNREVIEWED" })
  reviewStatus?: string; // UNREVIEWED | REVIEWED | APPROVED | REJECTED

  @Prop()
  externalEventId?: string; // P38 idempotency

  @Prop({ index: true })
  dataMode?: string; // "demo" → excluded from public/digest/analytics (P9)

  @Prop()
  source?: string;

  @Prop({ type: mongoose.Types.ObjectId })
  createdBy?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId })
  updatedBy?: mongoose.Types.ObjectId;
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.index(
  { userId: 1, sourceType: 1, sourceId: 1 },
  {
    name: "user_source_calendar_event_unique",
    unique: true,
    partialFilterExpression: {
      userId: { $exists: true },
      sourceType: { $exists: true },
      sourceId: { $exists: true },
    },
  }
);

EventSchema.index(
  { sourceType: 1, notifyEnabled: 1, notifySentAt: 1, notifyAt: 1 },
  {
    name: "idx_due_source_notifications",
    partialFilterExpression: {
      notifyEnabled: true,
      notifyAt: { $type: "date" },
    },
  },
);

// EPIC CAL-1 indexes (non-breaking, sparse/partial)
EventSchema.index(
  { externalEventId: 1 },
  {
    name: "idx_external_event_id",
    unique: true,
    partialFilterExpression: { externalEventId: { $type: "string" } },
  },
);
EventSchema.index(
  { visibility: 1, lifecycleStatus: 1, date: 1 },
  { name: "idx_visibility_lifecycle_date" },
);
EventSchema.index(
  { eventType: 1, date: 1 },
  { name: "idx_type_date" },
);
