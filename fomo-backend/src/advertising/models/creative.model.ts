import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type AdCreativeDocument = HydratedDocument<AdCreative>;

@Schema({ collection: 'ad_creatives', timestamps: true })
export class AdCreative {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'AdCampaign', required: true })
  campaignId: Types.ObjectId;

  @Prop({ default: 'image' }) type: string;      // image | text | rich
  @Prop({ default: '' }) brandName: string;
  @Prop({ default: '' }) logoUrl: string;
  @Prop({ default: '' }) imageUrl: string;       // desktop cover
  @Prop({ default: '' }) mobileImageUrl: string; // optional mobile cover
  @Prop({ default: '' }) headline: string;
  @Prop({ default: '' }) description: string;
  @Prop({ default: 'Learn more' }) ctaLabel: string;
  @Prop({ default: '' }) destinationUrl: string;
  @Prop({ default: 'Ad' }) sponsoredLabel: string;
  // ── G26: creative content source ──
  //   CUSTOM  → advertiser-authored fields below (default)
  //   PRODUCT → first-party promotion: name/subtitle/CTA/price/benefits are
  //             pulled LIVE from the Product CMS (plans) so a $49→$59 change in
  //             one place propagates to site + memberships + internal banners.
  @Prop({ default: 'CUSTOM' }) creativeSource: string; // CUSTOM | PRODUCT
  @Prop({ default: '' }) productCode: string;          // Plan.code when creativeSource=PRODUCT

  @Prop({ default: 'gradient' }) variant: string; // dark | light | gradient
  @Prop({ default: 'standard' }) displaySize: string; // standard | compact — how prominently the ad renders on the public site
  @Prop({ default: '' }) alt: string;
  @Prop({ default: true }) enabled: boolean;

  // ── Local banner content model (fully admin-configurable) ──
  // template controls HOW the content is shown in the local popover:
  //   facts   → grid of label/value facts (default)
  //   deal    → launchpad-style rows + funding progress bar + CTA
  //   offer   → OTC/P2P offer rows (asset / price / volume)
  //   profile → fund / person / user card (avatar + stat rows)
  //   minimal → headline + description + CTA only
  @Prop({ default: 'facts' }) template: string;

  // Editable category/direction chip shown in the popover (overrides the auto one).
  @Prop({ default: '' }) kindOverride: string;

  // Optional progress bar (0–100), used mainly by the "deal" template.
  @Prop({ default: 0 }) progress: number;
  @Prop({ default: '' }) progressLabel: string;

  // Demo/test creative — never counted in production analytics; flagged in CRM.
  @Prop({ default: false }) demo: boolean;

  // Product facts shown in the popover. Each fact: label/value, optional link,
  // and data provenance so unverified numbers are never passed off as real:
  //   'manual' (advertiser-provided) | 'platform' (platform-derived) | 'demo'.
  // The block is fully optional — not every ad format needs facts.
  @Prop({ type: [{ label: String, value: String, link: String, source: String }], default: [] })
  highlights: { label: string; value: string; link?: string; source?: string }[];
}

export const AdCreativeSchema = SchemaFactory.createForClass(AdCreative);
