import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type AdReportDocument = HydratedDocument<AdReport>;

/**
 * History of generated / sent advertiser reports for a campaign.
 * status:
 *   'generated'      — report data was produced (available for manual download)
 *   'sent'           — emailed successfully via the shared Resend provider
 *   'not_connected'  — cadence was due but no email provider is connected (NOT a fake send)
 *   'failed'         — provider returned an error
 */
@Schema({ collection: 'ad_reports', timestamps: true })
export class AdReport {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'AdCampaign', required: true })
  campaignId: Types.ObjectId;

  @Prop({ default: '' }) campaignName: string;
  @Prop({ default: 'manual' }) trigger: string; // manual | cadence | on_completion
  @Prop() periodFrom: Date;
  @Prop() periodTo: Date;
  @Prop({ type: [String], default: [] }) recipients: string[];
  @Prop({ default: 'generated' }) status: string;
  @Prop({ default: '' }) error: string;
  @Prop({ type: Object, default: {} }) totals: Record<string, any>;
  @Prop({ default: () => new Date() }) generatedAt: Date;
  @Prop() sentAt: Date;
}

export const AdReportSchema = SchemaFactory.createForClass(AdReport);
AdReportSchema.index({ campaignId: 1, generatedAt: -1 });
