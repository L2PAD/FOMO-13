import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type TrustReportDocument = HydratedDocument<TrustReport>;

@Schema({ timestamps: true })
export class TrustReport {
  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: null, index: true })
  reporter: mongoose.Types.ObjectId | null;

  @Prop({ required: true, index: true })
  targetType: string;

  @Prop({ default: '' })
  targetId: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  targetSnapshot: Record<string, any>;

  @Prop({ default: '' })
  reasonCode: string;

  @Prop({ default: '' })
  subReason: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: [String], default: [] })
  evidence: string[];

  @Prop({ default: 'normal' })
  priority: string;

  @Prop({ default: 'new', index: true })
  status: string; // new | open | reviewing | resolved | rejected

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: null })
  assignedModerator: mongoose.Types.ObjectId | null;

  @Prop({ default: '' })
  resolution: string;

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  actions: any[];

  @Prop({ default: 'user' })
  source: string;
}

export const TrustReportSchema = SchemaFactory.createForClass(TrustReport);
TrustReportSchema.index({ targetType: 1, status: 1, createdAt: -1 });
