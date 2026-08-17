import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReportReasonDocument = HydratedDocument<ReportReason>;

export const REPORT_TARGET_TYPES = [
  'USER', 'COMMENT', 'MESSAGE', 'CONTENT', 'PORTFOLIO', 'PROJECT', 'OTC_LISTING', 'P2P_LISTING', 'OTHER',
] as const;

@Schema({ timestamps: true })
export class ReportReason {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true })
  label: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: 'custom' })
  reasonClass: string; // system | custom

  @Prop({ type: [String], default: ['USER'] })
  allowedTargetTypes: string[];

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: 'system' })
  source: string;
}

export const ReportReasonSchema = SchemaFactory.createForClass(ReportReason);
