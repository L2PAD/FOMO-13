import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdRequestDocument = HydratedDocument<AdRequest>;

@Schema({ collection: 'ad_requests', timestamps: true })
export class AdRequest {
  @Prop({ required: true }) projectName: string;
  @Prop({ default: '' }) contactName: string;
  @Prop({ required: true }) email: string;
  @Prop({ default: '' }) telegram: string;
  @Prop({ default: '' }) website: string;
  @Prop({ default: '' }) adType: string;       // banner_global | local | homepage | sponsored | newsletter | other
  @Prop({ default: '' }) placement: string;   // desired placement code (optional)
  @Prop({ default: '' }) budget: string;       // free text budget range
  @Prop({ default: '' }) message: string;
  @Prop({ default: 'new' }) status: string;    // new | in_review | approved | rejected
  @Prop({ default: '' }) source: string;       // route the request came from

  // ── AI-assisted campaign drafting ──
  // aiStatus: none | generating | generated | failed
  @Prop({ default: 'none' }) aiStatus: string;
  @Prop({ default: '' }) aiNote: string;        // last AI message / error (for admin)
  @Prop({ default: '' }) linkedCampaignId: string; // draft campaign created from this request
}

export const AdRequestSchema = SchemaFactory.createForClass(AdRequest);
