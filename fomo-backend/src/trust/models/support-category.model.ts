import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type SupportCategoryDocument = HydratedDocument<SupportCategory>;

@Schema({ timestamps: true })
export class SupportCategory {
  @Prop({ required: true, unique: true, index: true })
  code: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  icon: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: '' })
  parentCode: string;

  @Prop({ type: [String], default: ['support'] })
  allowedRequestTypes: string[];

  @Prop({ default: 'normal' })
  defaultPriority: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  slaPolicy: Record<string, any>;

  @Prop({ type: [String], default: [] })
  requiredFields: string[];

  @Prop({ default: true })
  publicVisible: boolean;

  @Prop({ default: 'system' })
  source: string;
}

export const SupportCategorySchema = SchemaFactory.createForClass(SupportCategory);
SupportCategorySchema.index({ parentCode: 1, sortOrder: 1 });
