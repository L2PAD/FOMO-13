import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type ModerationCaseDocument = HydratedDocument<ModerationCase>;

@Schema({ timestamps: true })
export class ModerationCase {
  @Prop({ required: true, unique: true, index: true })
  caseNumber: string;

  @Prop({ default: 'manual' })
  type: string; // suspicious_activity | anti_farm | abuse | manual

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: null, index: true })
  subjectUser: mongoose.Types.ObjectId | null;

  @Prop({ default: 'open', index: true })
  status: string; // open | reviewing | actioned | dismissed

  @Prop({ default: 'normal' })
  severity: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ type: [String], default: [] })
  evidence: string[];

  @Prop({ type: [mongoose.Types.ObjectId], default: [] })
  relatedReports: mongoose.Types.ObjectId[];

  @Prop({ type: mongoose.Types.ObjectId, ref: 'User', default: null })
  assignedModerator: mongoose.Types.ObjectId | null;

  @Prop({ type: [mongoose.Schema.Types.Mixed], default: [] })
  actions: any[];

  @Prop({ default: 'system' })
  source: string;
}

export const ModerationCaseSchema = SchemaFactory.createForClass(ModerationCase);
ModerationCaseSchema.index({ type: 1, status: 1, createdAt: -1 });
