import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type AdDeliveryEventDocument = HydratedDocument<AdDeliveryEvent>;

export type AdEventType =
  | 'loaded'
  | 'impression'
  | 'viewable_impression'
  | 'click'
  | 'cta_click'
  | 'expand'
  | 'close'
  | 'conversion';

@Schema({ collection: 'ad_delivery_events', timestamps: true })
export class AdDeliveryEvent {
  @Prop({ required: true }) deliveryId: string; // one serve = one deliveryId
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'AdCampaign' }) campaignId: Types.ObjectId;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'AdCreative' }) creativeId: Types.ObjectId;
  @Prop({ required: true }) placementCode: string;
  @Prop({ required: true }) type: AdEventType;

  @Prop({ default: '' }) sessionId: string;
  @Prop({ default: '' }) anonId: string;
  @Prop({ default: 'desktop' }) device: string;
  @Prop({ default: false }) loggedIn: boolean;
  @Prop({ default: '' }) country: string;

  @Prop({ default: 0 }) viewablePct: number;
  @Prop({ default: 0 }) dwellMs: number;
  @Prop({ default: 0 }) billable: number; // spend attributed to this event

  @Prop({ default: '', unique: true, sparse: true }) dedupeKey: string;

  @Prop({ default: () => new Date() }) ts: Date;
  @Prop({ default: () => new Date().toISOString().slice(0, 10) }) day: string;
}

export const AdDeliveryEventSchema = SchemaFactory.createForClass(AdDeliveryEvent);
AdDeliveryEventSchema.index({ campaignId: 1, day: 1 });
AdDeliveryEventSchema.index({ placementCode: 1, type: 1, day: 1 });
