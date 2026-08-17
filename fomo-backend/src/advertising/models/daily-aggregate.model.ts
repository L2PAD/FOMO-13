import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type AdDailyAggregateDocument = HydratedDocument<AdDailyAggregate>;

@Schema({ collection: 'ad_daily_aggregates', timestamps: true })
export class AdDailyAggregate {
  @Prop({ required: true }) day: string;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'AdCampaign' }) campaignId: Types.ObjectId;
  @Prop({ default: '' }) placementCode: string;

  @Prop({ default: 0 }) impressions: number;
  @Prop({ default: 0 }) viewable: number;
  @Prop({ default: 0 }) clicks: number;
  @Prop({ default: 0 }) ctaClicks: number;
  @Prop({ default: 0 }) expands: number;
  @Prop({ default: 0 }) spend: number;
}

export const AdDailyAggregateSchema = SchemaFactory.createForClass(AdDailyAggregate);
AdDailyAggregateSchema.index({ day: 1, campaignId: 1, placementCode: 1 }, { unique: true });
