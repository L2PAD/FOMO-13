import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type SupportTicketDocument = HydratedDocument<SupportTicket>;

@Schema({ _id: false })
export class TicketMessage {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: null })
  author: mongoose.Types.ObjectId | null;
  @Prop({ default: 'user' })
  authorType: string; // user | agent | internal
  @Prop({ default: '' })
  body: string;
  @Prop({ type: [String], default: [] })
  attachments: string[];
  @Prop({ default: Date.now })
  createdAt: Date;
}
export const TicketMessageSchema = SchemaFactory.createForClass(TicketMessage);

@Schema({ _id: false })
export class TimelineEvent {
  @Prop() type: string;
  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} }) meta: Record<string, any>;
  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: null }) actor: mongoose.Types.ObjectId | null;
  @Prop({ default: Date.now }) at: Date;
}
export const TimelineEventSchema = SchemaFactory.createForClass(TimelineEvent);

@Schema({ timestamps: true })
export class SupportTicket {
  @Prop({ required: true, unique: true, index: true })
  ticketNumber: string;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: null, index: true })
  requester: mongoose.Types.ObjectId | null;

  @Prop({ default: '' })
  categoryCode: string;

  @Prop({ default: '' })
  subcategoryCode: string;

  @Prop({ default: '' })
  subject: string;

  @Prop({ default: 'new', index: true })
  status: string; // new | open | waiting_user | waiting_team | resolved | closed | reopened

  @Prop({ default: 'normal' })
  priority: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  context: Record<string, any>;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: null })
  assignee: mongoose.Types.ObjectId | null;

  @Prop({ type: [TicketMessageSchema], default: [] })
  messages: TicketMessage[];

  @Prop({ type: [TimelineEventSchema], default: [] })
  timeline: TimelineEvent[];

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  sla: Record<string, any>;

  @Prop({ default: null })
  lastReplyAt: Date | null;

  @Prop({ default: 'user' })
  source: string;
}

export const SupportTicketSchema = SchemaFactory.createForClass(SupportTicket);
SupportTicketSchema.index({ status: 1, createdAt: -1 });
