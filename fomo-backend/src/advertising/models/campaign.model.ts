import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type AdCampaignDocument = HydratedDocument<AdCampaign>;

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled';
export type PricingModel = 'cpm' | 'cpc' | 'fixed';

@Schema({ collection: 'ad_campaigns', timestamps: true })
export class AdCampaign {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'AdAdvertiser' })
  advertiserId: Types.ObjectId;

  @Prop({ default: '' }) advertiserName: string;
  @Prop({ required: true }) name: string;
  @Prop({ default: 'awareness' }) objective: string;

  @Prop({ default: 'draft' }) status: CampaignStatus;

  @Prop({ default: 'cpm' }) pricingModel: PricingModel;
  @Prop({ default: 0 }) rate: number;      // CPM: price per 1000 viewable impr; CPC: price per click; fixed: total
  @Prop({ default: 0 }) budget: number;    // total budget (0 = unlimited/sponsorship)
  @Prop({ default: 0 }) spend: number;

  @Prop() startAt: Date;
  @Prop() endAt: Date;

  @Prop({ type: [String], default: [] }) placements: string[];
  @Prop({ default: 5 }) priority: number;  // 1..10 (weighted rotation)

  // Config-driven targeting. Each signal is optional; connection state lives in service.
  @Prop({ type: Object, default: {} }) targeting: Record<string, any>;

  // frequencyCap: { perUserPerDay?, perCampaignPer7d?, guestSessionCap?, perDay?(legacy) }
  @Prop({ type: Object, default: {} }) frequencyCap: Record<string, any>;

  // Delivery pacing across the flight: 'even' (spread budget/day) | 'asap'.
  @Prop({ default: 'asap' }) pacing: string;

  // IANA timezone used for schedule boundaries & report cadence (e.g. 'UTC', 'Europe/Berlin').
  @Prop({ default: 'UTC' }) timezone: string;

  // Demo/test campaign — excluded from production analytics, flagged in CRM.
  @Prop({ default: false }) demo: boolean;

  // AI-assisted drafting provenance (from an advertiser request via the AI helper).
  @Prop({ default: false }) aiGenerated: boolean;
  @Prop({ default: '' }) generatedFromRequestId: string;

  // Automated advertiser report config:
  // { cadence:'off'|'weekly'|'monthly'|'on_completion', recipients:string[],
  //   lastReportAt?:Date, nextReportAt?:Date, deliveryStatus?:string }
  @Prop({ type: Object, default: {} }) report: Record<string, any>;

  @Prop({ default: '' }) createdBy: string;
  @Prop({ default: '' }) updatedBy: string;
}

export const AdCampaignSchema = SchemaFactory.createForClass(AdCampaign);
