import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Connection, Model } from 'mongoose';
import { AdCampaign, AdCampaignDocument } from './models/campaign.model';
import { AdCreative, AdCreativeDocument } from './models/creative.model';
import { AdDeliveryEvent, AdDeliveryEventDocument, AdEventType } from './models/delivery-event.model';
import { AdDailyAggregate, AdDailyAggregateDocument } from './models/daily-aggregate.model';
import { AdPlacementSetting, AdPlacementSettingDocument } from './models/placement-setting.model';
import { getPlacement } from './registry';

// Direction/context label per placement surface — describes WHAT is being promoted,
// so the hover popover is framed by the page's product direction (not junk meta).
const PLACEMENT_KIND: Record<string, string> = {
  spaceport: 'Staking · early launches',
  launchpad: 'Launchpad · investment deals',
  otc: 'OTC · offers & deals',
  echo: 'ICO / IDO projects',
  bakers: 'Funds & people',
  backers: 'Funds & people',
  fomies: 'FOMO users',
  unlocking: 'Token unlocks',
  yuryland: 'Early activity · drops, testnets',
  earlyland: 'Early activity · drops, testnets',
  funding: 'Project fundraising',
  bazar: 'Marketplace',
  gemslab: 'GemsLab · curated',
  crypto: 'Crypto market',
  home: 'Homepage promo',
  global: 'Sponsor',
};


const BILLABLE_ONCE: AdEventType[] = ['loaded', 'impression', 'viewable_impression', 'expand', 'close'];
// impression/viewable/expand/close/loaded => one per deliveryId. click/cta_click => one per deliveryId per type.

@Injectable()
export class DeliveryService {
  constructor(
    @InjectModel(AdCampaign.name) private campaignModel: Model<AdCampaignDocument>,
    @InjectModel(AdCreative.name) private creativeModel: Model<AdCreativeDocument>,
    @InjectModel(AdDeliveryEvent.name) private eventModel: Model<AdDeliveryEventDocument>,
    @InjectModel(AdDailyAggregate.name) private aggModel: Model<AdDailyAggregateDocument>,
    @InjectModel(AdPlacementSetting.name) private placementSettingModel: Model<AdPlacementSettingDocument>,
    @InjectConnection() private readonly conn: Connection,
  ) {}

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /**
   * G26 — resolve first-party product content from the Product CMS (plans).
   * Returns presentation overlaid on the creative so price/benefits are always
   * the single source of truth. Never invents data — falls back to CUSTOM if the
   * product is missing/inactive.
   */
  private async resolveProductContent(productCode: string): Promise<null | {
    headline: string; description: string; ctaLabel: string; destinationUrl: string;
    brandName: string; priceUsd: number; highlights: { label: string; value: string; source: string }[];
  }> {
    if (!productCode) return null;
    try {
      const plan: any = await this.conn.collection('entitlement_plans').findOne({ code: productCode });
      if (!plan || plan.status !== 'ACTIVE') return null;
      const offers = (plan.offerItems || []).filter((o: any) => o?.active !== false).sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
      const price = Number(plan.priceUsd || 0);
      const period = plan.durationDays || 30;
      const isIntel = plan.productType === 'FOMO_INTEL';
      return {
        headline: plan.name || 'FOMO',
        description: plan.subtitle || plan.description || '',
        ctaLabel: isIntel ? 'Open FOMO Intel' : `Get ${plan.name} · $${price}/${period}d`,
        destinationUrl: isIntel ? (plan.externalProductConfig?.url || '/utility/memberships') : '/utility/memberships',
        brandName: plan.name || 'FOMO',
        priceUsd: price,
        highlights: [
          { label: 'Price', value: `$${price} / ${period}d`, source: 'platform' },
          ...(isIntel ? [] : [{ label: 'AI credits', value: String(plan.aiCredits ?? plan.aiCreditsIncluded ?? 0), source: 'platform' }]),
          ...offers.slice(0, 3).map((o: any) => ({ label: o.title, value: o.description || '✓', source: 'platform' })),
        ].slice(0, 4),
      };
    } catch {
      return null;
    }
  }

  /** Auto-transition schedule states based on time (keeps status honest). */
  private isLiveNow(c: AdCampaign): boolean {
    const now = Date.now();
    if (c.status === 'paused' || c.status === 'cancelled' || c.status === 'completed' || c.status === 'draft') {
      return false;
    }
    if (c.startAt && new Date(c.startAt).getTime() > now) return false;
    if (c.endAt && new Date(c.endAt).getTime() < now) return false;
    return c.status === 'active' || c.status === 'scheduled';
  }

  private budgetRemaining(c: AdCampaign): boolean {
    if (!c.budget || c.budget <= 0) return true; // sponsorship / unlimited
    return c.spend < c.budget;
  }

  private targetingMatch(c: AdCampaign, ctx: { device: string; loggedIn: boolean; country: string }): boolean {
    const t = c.targeting || {};
    if (t.device && t.device !== 'all' && t.device !== ctx.device) return false;
    if (t.audience && t.audience !== 'all') {
      if (t.audience === 'guest' && ctx.loggedIn) return false;
      if (t.audience === 'user' && !ctx.loggedIn) return false;
    }
    // Unified geo targeting layer: { mode:'all'|'allow'|'exclude', countries:[ISO2] }
    const geo = t.geo || {};
    const mode = geo.mode || 'all';
    if (mode !== 'all' && Array.isArray(geo.countries) && geo.countries.length) {
      const list = geo.countries.map((x: string) => String(x).toUpperCase());
      const cc = String(ctx.country || '').toUpperCase();
      if (mode === 'allow') {
        // Unknown country cannot satisfy an allow-list → do not serve.
        if (!cc || !list.includes(cc)) return false;
      } else if (mode === 'exclude') {
        if (cc && list.includes(cc)) return false;
      }
    }
    return true;
  }

  /** Effective flight length in days (used for even pacing). */
  private periodDays(c: AdCampaign): number {
    if (c.startAt && c.endAt) {
      const d = (new Date(c.endAt).getTime() - new Date(c.startAt).getTime()) / 864e5;
      return Math.max(1, Math.round(d));
    }
    return 30;
  }

  async serve(params: {
    placement: string;
    device?: string;
    loggedIn?: boolean;
    sessionId?: string;
    anonId?: string;
    country?: string;
  }) {
    const placement = getPlacement(params.placement);
    if (!placement) return { filled: false, reason: 'unknown_placement' };
    // Placement metadata so the public site can render a visible slot (with an
    // "Advertise here" placeholder) even when no paid campaign fills it.
    const pmeta = { code: placement.code, name: placement.adminName, format: placement.format, kind: (placement as any).kind, group: placement.group, route: placement.route, aspectDesktop: placement.aspectDesktop, aspectMobile: placement.aspectMobile };

    // admin per-placement on/off switch + display mode (ads | form | rotate)
    const setting: any = await this.placementSettingModel.findOne({ code: placement.code }).lean();
    const mode = setting?.mode || 'ads';
    const rotate = { rotateAdSeconds: setting?.rotateAdSeconds || 30, rotateFormSeconds: setting?.rotateFormSeconds || 10 };
    if (setting && setting.enabled === false) return { filled: false, reason: 'placement_disabled', mode: 'form', placement: pmeta, ...rotate };
    // 'form' mode: never serve a paid ad here — the public site shows the request form instead.
    if (mode === 'form') return { filled: false, reason: 'form_mode', mode, placement: pmeta, ...rotate };

    const device = params.device === 'mobile' ? 'mobile' : 'desktop';
    const loggedIn = !!params.loggedIn;
    const sessionId = params.sessionId || '';
    const country = String(params.country || '').toUpperCase();

    const candidates = await this.campaignModel
      .find({ placements: placement.code })
      .lean();

    const eligible: AdCampaign[] = [];
    for (const c of candidates as any[]) {
      if (!this.isLiveNow(c)) continue;
      if (!this.budgetRemaining(c)) continue;
      if (!this.targetingMatch(c, { device, loggedIn, country })) continue;

      const fc = c.frequencyCap || {};
      // guest session cap: total impressions per session for guests
      const guestCap = Number(fc.guestSessionCap || 0);
      if (!loggedIn && guestCap > 0 && sessionId) {
        const seen = await this.eventModel.countDocuments({ campaignId: c._id, sessionId, type: 'impression' });
        if (seen >= guestCap) continue;
      }
      // per user/session per day
      const perDay = Number(fc.perUserPerDay || fc.perDay || 0);
      if (perDay > 0 && sessionId) {
        const shown = await this.eventModel.countDocuments({ campaignId: c._id, sessionId, type: 'impression', day: this.today() });
        if (shown >= perDay) continue;
      }
      // per campaign per rolling 7 days (per session)
      const per7 = Number(fc.perCampaignPer7d || 0);
      if (per7 > 0 && sessionId) {
        const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
        const shown7 = await this.eventModel.countDocuments({ campaignId: c._id, sessionId, type: 'impression', day: { $gte: since } });
        if (shown7 >= per7) continue;
      }

      // even pacing: do not burn the whole flight in a single day
      if (c.pacing === 'even' && c.budget > 0) {
        const dailyTarget = c.budget / this.periodDays(c);
        const agg = await this.aggModel.aggregate([
          { $match: { campaignId: c._id, day: this.today() } },
          { $group: { _id: null, spend: { $sum: '$spend' } } },
        ]);
        const todaySpend = agg[0]?.spend || 0;
        if (dailyTarget > 0 && todaySpend >= dailyTarget) continue;
      }

      eligible.push(c);
    }

    if (!eligible.length) return { filled: false, reason: 'no_campaign', mode, placement: pmeta, ...rotate };

    // weighted rotation by priority
    const totalWeight = eligible.reduce((s, c) => s + Math.max(1, c.priority || 1), 0);
    let r = Math.random() * totalWeight;
    let chosen = eligible[0];
    for (const c of eligible) {
      r -= Math.max(1, c.priority || 1);
      if (r <= 0) { chosen = c; break; }
    }

    const creatives = await this.creativeModel
      .find({ campaignId: (chosen as any)._id, enabled: true })
      .lean();
    if (!creatives.length) return { filled: false, reason: 'no_creative', placement: pmeta, ...rotate };
    const creative: any = creatives[Math.floor(Math.random() * creatives.length)];

    const deliveryId = new mongoose.Types.ObjectId().toString();

    // G26 — first-party product promotion: overlay live Product CMS content.
    let productContent: any = null;
    if (String(creative.creativeSource || 'CUSTOM') === 'PRODUCT') {
      productContent = await this.resolveProductContent(String(creative.productCode || ''));
    }
    const effHeadline = productContent?.headline || creative.headline;
    const effDescription = productContent?.description || creative.description;
    const effCtaLabel = productContent?.ctaLabel || creative.ctaLabel;
    const effDestination = productContent?.destinationUrl || creative.destinationUrl;
    const effBrand = productContent?.brandName || creative.brandName;
    const effHighlights = productContent
      ? productContent.highlights
      : (Array.isArray(creative.highlights)
          ? creative.highlights
              .filter((h: any) => h && h.label && h.value)
              .slice(0, 4)
              .map((h: any) => ({ label: h.label, value: h.value, link: h.link || '', source: h.source || 'manual' }))
          : []);

    return {
      filled: true,
      deliveryId,
      mode,
      ...rotate,
      placement: {
        code: placement.code,
        format: placement.format,
        aspectDesktop: placement.aspectDesktop,
        aspectMobile: placement.aspectMobile,
        kind: (creative.kindOverride && String(creative.kindOverride).trim())
          || PLACEMENT_KIND[placement.surface] || PLACEMENT_KIND[placement.code] || 'Промо',
      },
      campaignId: String((chosen as any)._id),
      creativeId: String(creative._id),
      creative: {
        type: creative.type,
        creativeSource: creative.creativeSource || 'CUSTOM',
        productCode: productContent ? creative.productCode : '',
        brandName: effBrand,
        logoUrl: creative.logoUrl,
        imageUrl: creative.imageUrl,
        mobileImageUrl: creative.mobileImageUrl,
        headline: effHeadline,
        description: effDescription,
        ctaLabel: effCtaLabel,
        destinationUrl: effDestination,
        sponsoredLabel: creative.sponsoredLabel || 'Ad',
        variant: creative.variant || 'gradient',
        displaySize: creative.displaySize || 'standard',
        template: creative.template || 'facts',
        progress: Number(creative.progress || 0),
        progressLabel: creative.progressLabel || '',
        alt: creative.alt,
        highlights: effHighlights,
      },
    };
  }

  async track(body: {
    deliveryId: string;
    campaignId?: string;
    creativeId?: string;
    placement: string;
    type: AdEventType;
    sessionId?: string;
    anonId?: string;
    device?: string;
    loggedIn?: boolean;
    country?: string;
    viewablePct?: number;
    dwellMs?: number;
  }) {
    const allowed: AdEventType[] = ['loaded', 'impression', 'viewable_impression', 'click', 'cta_click', 'expand', 'close', 'conversion'];
    if (!body?.deliveryId || !allowed.includes(body.type) || !body.placement) {
      return { ok: false, reason: 'invalid' };
    }

    // anti-spam: viewable must actually be viewable
    if (body.type === 'viewable_impression') {
      const pct = Number(body.viewablePct || 0);
      const dwell = Number(body.dwellMs || 0);
      if (pct < 50 || dwell < 800) return { ok: false, reason: 'not_viewable' };
    }

    // dedupe: one per (deliveryId + type) for all non-conversion events
    const dedupeKey = body.type === 'conversion' ? '' : `${body.deliveryId}:${body.type}`;
    if (dedupeKey) {
      const exists = await this.eventModel.exists({ dedupeKey });
      if (exists) return { ok: true, deduped: true };
    }

    const campaignId = body.campaignId && mongoose.Types.ObjectId.isValid(body.campaignId)
      ? new mongoose.Types.ObjectId(body.campaignId) : undefined;
    const creativeId = body.creativeId && mongoose.Types.ObjectId.isValid(body.creativeId)
      ? new mongoose.Types.ObjectId(body.creativeId) : undefined;

    // spend attribution
    let billable = 0;
    let campaign: any = null;
    if (campaignId) campaign = await this.campaignModel.findById(campaignId);
    if (campaign) {
      if (campaign.pricingModel === 'cpm' && body.type === 'viewable_impression') {
        billable = Number(campaign.rate || 0) / 1000;
      } else if (campaign.pricingModel === 'cpc' && body.type === 'click') {
        billable = Number(campaign.rate || 0);
      }
    }

    const day = this.today();
    try {
      await this.eventModel.create({
        deliveryId: body.deliveryId,
        campaignId,
        creativeId,
        placementCode: body.placement,
        type: body.type,
        sessionId: body.sessionId || '',
        anonId: body.anonId || '',
        device: body.device === 'mobile' ? 'mobile' : 'desktop',
        loggedIn: !!body.loggedIn,
        country: body.country || '',
        viewablePct: Number(body.viewablePct || 0),
        dwellMs: Number(body.dwellMs || 0),
        billable,
        dedupeKey: dedupeKey || undefined,
        ts: new Date(),
        day,
      });
    } catch (e: any) {
      if (e?.code === 11000) return { ok: true, deduped: true };
      throw e;
    }

    // rollup daily aggregate
    const inc: any = {};
    if (body.type === 'impression') inc.impressions = 1;
    if (body.type === 'viewable_impression') inc.viewable = 1;
    if (body.type === 'click') inc.clicks = 1;
    if (body.type === 'cta_click') inc.ctaClicks = 1;
    if (body.type === 'expand') inc.expands = 1;
    if (billable) inc.spend = billable;
    if (Object.keys(inc).length && campaignId) {
      await this.aggModel.updateOne(
        { day, campaignId, placementCode: body.placement },
        { $inc: inc },
        { upsert: true },
      );
    }

    // update campaign spend
    if (billable && campaign) {
      campaign.spend = Number(campaign.spend || 0) + billable;
      if (campaign.budget > 0 && campaign.spend >= campaign.budget) {
        campaign.status = 'completed';
      }
      await campaign.save();
    }

    return { ok: true };
  }
}
