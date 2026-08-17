import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import mongoose, { Connection, Model } from 'mongoose';
import { AdCampaign, AdCampaignDocument } from './models/campaign.model';
import { AdCreative, AdCreativeDocument } from './models/creative.model';
import { AdAdvertiser, AdAdvertiserDocument } from './models/advertiser.model';
import { AdRequest, AdRequestDocument } from './models/ad-request.model';
import { AdDeliveryEvent, AdDeliveryEventDocument } from './models/delivery-event.model';
import { AdPlacementSetting, AdPlacementSettingDocument } from './models/placement-setting.model';
import { AdReport, AdReportDocument } from './models/ad-report.model';
import { EmailService } from '../email/email.service';
import { AD_PLACEMENTS, getPlacement } from './registry';
import { execFile } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const oid = (id: string) => new mongoose.Types.ObjectId(id);
const num = (v: any, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const round = (v: number, p = 2) => Math.round(v * 10 ** p) / 10 ** p;

@Injectable()
export class AdvertisingService {
  constructor(
    @InjectModel(AdCampaign.name) private campaignModel: Model<AdCampaignDocument>,
    @InjectModel(AdCreative.name) private creativeModel: Model<AdCreativeDocument>,
    @InjectModel(AdAdvertiser.name) private advertiserModel: Model<AdAdvertiserDocument>,
    @InjectModel(AdRequest.name) private requestModel: Model<AdRequestDocument>,
    @InjectModel(AdDeliveryEvent.name) private eventModel: Model<AdDeliveryEventDocument>,
    @InjectModel(AdPlacementSetting.name) private placementSettingModel: Model<AdPlacementSettingDocument>,
    @InjectModel(AdReport.name) private reportModel: Model<AdReportDocument>,
    @InjectConnection() private connection: Connection,
    private readonly emailService: EmailService,
  ) {}

  /** Ids of demo/test campaigns — excluded from production analytics. */
  private async demoCampaignIds(): Promise<mongoose.Types.ObjectId[]> {
    const rows = await this.campaignModel.find({ demo: true }, { _id: 1 }).lean();
    return rows.map((r: any) => r._id);
  }

  /** Resend/email provider connection status from shared platform settings. */
  private async emailProviderStatus(): Promise<{ status: string; provider: string; fromEmail: string }> {
    try {
      const s: any = await this.connection.db.collection('email_settings').findOne({});
      const envKey = process.env.RESEND_API_KEY ? 'configured' : '';
      const status = s?.status && s.status !== 'not_configured' ? s.status : (envKey || 'not_connected');
      return { status: status === 'not_configured' ? 'not_connected' : status, provider: s?.provider || 'resend', fromEmail: s?.fromEmail || process.env.MAIL_FROM || '' };
    } catch {
      return { status: process.env.RESEND_API_KEY ? 'configured' : 'not_connected', provider: 'resend', fromEmail: process.env.MAIL_FROM || '' };
    }
  }

  /* ───────────── Advertise requests (public «Your Ad Here») ───────────── */
  async submitAdRequest(body: any) {
    const projectName = String(body?.projectName || '').trim();
    const email = String(body?.email || '').trim();
    if (!projectName || !email) return { success: false, message: 'Project name and email are required' };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { success: false, message: 'Invalid email' };
    const doc = await this.requestModel.create({
      projectName,
      email,
      contactName: String(body?.contactName || '').trim(),
      telegram: String(body?.telegram || '').trim(),
      website: String(body?.website || '').trim(),
      adType: String(body?.adType || '').trim(),
      placement: String(body?.placement || '').trim(),
      budget: String(body?.budget || '').trim(),
      message: String(body?.message || '').trim(),
      source: String(body?.source || '').trim(),
      status: 'new',
    });
    return { success: true, data: { _id: doc._id } };
  }

  async listAdRequests(query: any = {}) {
    const match: any = {};
    if (query.status) match.status = query.status;
    const data = await this.requestModel.find(match).sort({ createdAt: -1 }).lean();
    const counts = await this.requestModel.aggregate([{ $group: { _id: '$status', c: { $sum: 1 } } }]);
    const byStatus: Record<string, number> = {};
    counts.forEach((c: any) => (byStatus[c._id] = c.c));
    return { success: true, data, counts: { ...byStatus, total: data.length } };
  }

  async adRequestCounts() {
    const counts = await this.requestModel.aggregate([{ $group: { _id: '$status', c: { $sum: 1 } } }]);
    const byStatus: Record<string, number> = {};
    counts.forEach((c: any) => (byStatus[c._id] = c.c));
    const total = await this.requestModel.countDocuments();
    return { success: true, data: { ...byStatus, total } };
  }

  async updateAdRequestStatus(id: string, status: string) {
    const allowed = ['new', 'in_review', 'approved', 'rejected'];
    if (!mongoose.Types.ObjectId.isValid(id) || !allowed.includes(status)) return { success: false, message: 'Invalid' };
    await this.requestModel.updateOne({ _id: id }, { $set: { status } });
    return { success: true, data: { _id: id, status } };
  }

  /* ───────── AI-assisted: request → draft campaign → approve/reject ───────── */

  /** Map an advertiser request's adType/placement to a valid registry placement. */
  private resolvePlacementFromRequest(req: any): string {
    if (req?.placement && getPlacement(req.placement)) return req.placement;
    const byType: Record<string, string> = {
      banner_global: 'GLOBAL_TOP_BANNER',
      homepage: 'HOME_HERO',
      floating: 'HOME_HERO',
      local: 'CRYPTO_PROMOTED',
      sponsored: 'CRYPTO_PROMOTED',
    };
    return byType[String(req?.adType || '')] || 'HOME_HERO';
  }

  /** Deterministic draft used when AI is unavailable — guarantees a usable campaign. */
  private templateDraftFromRequest(req: any) {
    const placement = this.resolvePlacementFromRequest(req);
    const brand = String(req.projectName || 'Advertiser').trim();
    return {
      campaign: {
        name: `${brand} — заявка`,
        advertiserName: brand,
        objective: 'awareness',
        placements: [placement],
        priority: 5,
        pacing: 'asap',
      },
      creative: {
        type: 'text',
        brandName: brand,
        headline: `${brand}`.slice(0, 58),
        description: String(req.message || '').slice(0, 140),
        ctaLabel: 'Learn more',
        destinationUrl: String(req.website || '').trim(),
        variant: 'gradient',
        displaySize: 'standard',
        template: 'minimal',
        sponsoredLabel: 'Ad',
      },
    };
  }

  /** Invoke the Python AI helper (Emergent Universal Key / Claude). Returns null on failure. */
  private runAiGenerator(req: any): Promise<{ campaign: any; creative: any } | null> {
    return new Promise((resolve) => {
      let tmp = '';
      try {
        const placements = AD_PLACEMENTS.map((p) => ({ code: p.code, adminName: p.adminName, format: p.format, maxHeadline: p.maxHeadline }));
        const payload = { request: req, placements };
        tmp = path.join(os.tmpdir(), `ad-gen-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
        fs.writeFileSync(tmp, JSON.stringify(payload), 'utf-8');
      } catch {
        return resolve(null);
      }
      const script = path.join(process.cwd(), 'ai_scripts', 'generate_ad_campaign.py');
      const py = process.env.PYTHON_BIN || '/root/.venv/bin/python3';
      execFile(py, [script, tmp], { timeout: 90_000, env: process.env, maxBuffer: 1024 * 1024 }, (err, stdout) => {
        try { if (tmp) fs.unlinkSync(tmp); } catch { /* noop */ }
        if (err) return resolve(null);
        try {
          const parsed = JSON.parse(String(stdout || '').trim());
          if (parsed && parsed.error) return resolve(null);
          if (parsed && parsed.campaign && parsed.creative) return resolve(parsed);
          return resolve(null);
        } catch {
          return resolve(null);
        }
      });
    });
  }

  /** Generate a DRAFT campaign+creative from a request via AI (with template fallback). */
  async aiGenerateFromRequest(requestId: string, actorId?: string) {
    if (!mongoose.Types.ObjectId.isValid(requestId)) return { success: false, message: 'Invalid id' };
    const req: any = await this.requestModel.findById(requestId).lean();
    if (!req) return { success: false, message: 'Request not found' };

    // Remove any previous draft tied to this request (regeneration).
    if (req.linkedCampaignId && mongoose.Types.ObjectId.isValid(req.linkedCampaignId)) {
      await this.campaignModel.deleteOne({ _id: oid(req.linkedCampaignId) });
      await this.creativeModel.deleteMany({ campaignId: oid(req.linkedCampaignId) });
    }

    await this.requestModel.updateOne({ _id: requestId }, { $set: { aiStatus: 'generating', aiNote: '' } });

    const ai = await this.runAiGenerator(req);
    const usedAi = !!ai;
    const draft = ai || this.templateDraftFromRequest(req);

    // Validate/normalize placements against the registry.
    const placements = (Array.isArray(draft.campaign?.placements) ? draft.campaign.placements : [])
      .filter((p: string) => !!getPlacement(p));
    if (!placements.length) placements.push(this.resolvePlacementFromRequest(req));

    const budget = num(String(req.budget || '').replace(/[^0-9.]/g, ''));
    const campaignBody = {
      name: String(draft.campaign?.name || `${req.projectName} — заявка`).slice(0, 120),
      advertiserName: String(draft.campaign?.advertiserName || req.projectName || '').slice(0, 120),
      objective: ['awareness', 'traffic', 'conversions'].includes(draft.campaign?.objective) ? draft.campaign.objective : 'awareness',
      status: 'draft',
      pricingModel: 'fixed',
      rate: 0,
      budget,
      priority: Math.min(10, Math.max(1, num(draft.campaign?.priority, 5))),
      pacing: draft.campaign?.pacing === 'even' ? 'even' : 'asap',
      placements,
      demo: false,
    };
    const created: any = await this.campaignModel.create({
      ...this.sanitizeCampaign(campaignBody),
      createdBy: actorId || 'ai',
      updatedBy: actorId || 'ai',
      aiGenerated: true,
      generatedFromRequestId: String(requestId),
    });

    const creativeBody = {
      type: draft.creative?.type === 'image' ? 'image' : 'text',
      brandName: String(draft.creative?.brandName || req.projectName || '').slice(0, 80),
      headline: String(draft.creative?.headline || req.projectName || '').slice(0, 120),
      description: String(draft.creative?.description || req.message || '').slice(0, 200),
      ctaLabel: String(draft.creative?.ctaLabel || 'Learn more').slice(0, 40),
      destinationUrl: String(draft.creative?.destinationUrl || req.website || '').slice(0, 400),
      variant: ['dark', 'gradient', 'light'].includes(draft.creative?.variant) ? draft.creative.variant : 'gradient',
      displaySize: draft.creative?.displaySize === 'compact' ? 'compact' : 'standard',
      template: ['facts', 'deal', 'offer', 'profile', 'minimal'].includes(draft.creative?.template) ? draft.creative.template : 'minimal',
      sponsoredLabel: ['Ad', 'Sponsored', 'Promoted'].includes(draft.creative?.sponsoredLabel) ? draft.creative.sponsoredLabel : 'Ad',
      enabled: true,
    };
    await this.creativeModel.create({ ...this.sanitizeCreative(creativeBody), campaignId: created._id });

    await this.requestModel.updateOne(
      { _id: requestId },
      { $set: { aiStatus: 'generated', status: 'in_review', linkedCampaignId: String(created._id), aiNote: usedAi ? 'Сгенерировано ИИ (Claude)' : 'Шаблон (ИИ недоступен)' } },
    );

    return { success: true, data: { requestId, campaignId: String(created._id), usedAi } };
  }

  /** Approve the drafted campaign: set it active and mark the request approved. */
  async approveRequestCampaign(requestId: string) {
    if (!mongoose.Types.ObjectId.isValid(requestId)) return { success: false, message: 'Invalid id' };
    const req: any = await this.requestModel.findById(requestId).lean();
    if (!req) return { success: false, message: 'Request not found' };
    if (!req.linkedCampaignId || !mongoose.Types.ObjectId.isValid(req.linkedCampaignId)) return { success: false, message: 'No draft campaign — generate first' };
    await this.campaignModel.updateOne({ _id: oid(req.linkedCampaignId) }, { $set: { status: 'active' } });
    await this.requestModel.updateOne({ _id: requestId }, { $set: { status: 'approved' } });
    return { success: true, data: { requestId, campaignId: req.linkedCampaignId, status: 'approved' } };
  }

  /** Reject: keep the draft campaign (cancelled) for reference, mark request rejected. */
  async rejectRequestCampaign(requestId: string) {
    if (!mongoose.Types.ObjectId.isValid(requestId)) return { success: false, message: 'Invalid id' };
    const req: any = await this.requestModel.findById(requestId).lean();
    if (!req) return { success: false, message: 'Request not found' };
    if (req.linkedCampaignId && mongoose.Types.ObjectId.isValid(req.linkedCampaignId)) {
      await this.campaignModel.updateOne({ _id: oid(req.linkedCampaignId) }, { $set: { status: 'cancelled' } });
    }
    await this.requestModel.updateOne({ _id: requestId }, { $set: { status: 'rejected' } });
    return { success: true, data: { requestId, status: 'rejected' } };
  }

  /* ───────────── Advertisers ───────────── */
  async listAdvertisers() {
    const data = await this.advertiserModel.find().sort({ createdAt: -1 }).lean();
    return { success: true, data };
  }
  async createAdvertiser(body: any) {
    if (!body?.name?.trim()) return { success: false, message: 'Name required' };
    const doc = await this.advertiserModel.create({
      name: body.name.trim(),
      contactEmail: body.contactEmail || '',
      website: body.website || '',
      logoUrl: body.logoUrl || '',
      notes: body.notes || '',
    });
    return { success: true, data: doc };
  }

  /* ───────────── Campaigns ───────────── */
  private async statsForCampaign(id: mongoose.Types.ObjectId) {
    const rows = await this.eventModel.aggregate([
      { $match: { campaignId: id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          sessions: { $addToSet: '$sessionId' },
          spend: { $sum: '$billable' },
        },
      },
    ]);
    const byType: Record<string, any> = {};
    rows.forEach((r) => (byType[r._id] = r));
    const impressions = byType.impression?.count || 0;
    const viewable = byType.viewable_impression?.count || 0;
    const clicks = byType.click?.count || 0;
    const spend = rows.reduce((s, r) => s + (r.spend || 0), 0);
    const uniqueSessions = new Set(
      rows.flatMap((r) => (r.sessions || []).filter((x: string) => x)),
    ).size;
    const ctr = viewable > 0 ? round((clicks / viewable) * 100, 2) : 0;
    const viewability = impressions > 0 ? round((viewable / impressions) * 100, 1) : 0;
    return { impressions, viewable, clicks, uniqueSessions, spend: round(spend, 2), ctr, viewability };
  }

  async listCampaigns(query: any = {}) {
    const match: any = {};
    if (query.status) match.status = query.status;
    if (query.placement) match.placements = query.placement;
    if (query.search) match.name = new RegExp(String(query.search).trim(), 'i');
    const campaigns = await this.campaignModel.find(match).sort({ createdAt: -1 }).lean();
    const data = await Promise.all(
      campaigns.map(async (c: any) => {
        await this.reconcile(c);
        const stats = await this.statsForCampaign(c._id);
        const creativeCount = await this.creativeModel.countDocuments({ campaignId: c._id });
        return { ...c, stats, creativeCount };
      }),
    );
    return { success: true, data };
  }

  async getCampaign(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return { success: false, message: 'Invalid id' };
    const c: any = await this.campaignModel.findById(id).lean();
    if (!c) return { success: false, message: 'Not found' };
    await this.reconcile(c);
    const creatives = await this.creativeModel.find({ campaignId: c._id }).lean();
    const stats = await this.statsForCampaign(c._id);
    return { success: true, data: { ...c, creatives, stats } };
  }

  private sanitizeCampaign(body: any) {
    const out: any = {};
    const fields = ['name', 'objective', 'status', 'pricingModel', 'advertiserName'];
    fields.forEach((f) => { if (body[f] !== undefined) out[f] = body[f]; });
    if (body.rate !== undefined) out.rate = num(body.rate);
    if (body.budget !== undefined) out.budget = num(body.budget);
    if (body.priority !== undefined) out.priority = Math.min(10, Math.max(1, num(body.priority, 5)));
    if (body.startAt !== undefined) out.startAt = body.startAt ? new Date(body.startAt) : null;
    if (body.endAt !== undefined) out.endAt = body.endAt ? new Date(body.endAt) : null;
    if (body.timezone !== undefined) out.timezone = String(body.timezone || 'UTC');
    if (body.pacing !== undefined) out.pacing = body.pacing === 'even' ? 'even' : 'asap';
    if (body.demo !== undefined) out.demo = !!body.demo;
    if (Array.isArray(body.placements)) {
      out.placements = body.placements.filter((p: string) => !!getPlacement(p));
    }
    if (body.targeting && typeof body.targeting === 'object') {
      const t: any = { ...body.targeting };
      const geo = t.geo || {};
      const mode = ['all', 'allow', 'exclude'].includes(geo.mode) ? geo.mode : 'all';
      const countries = Array.isArray(geo.countries)
        ? geo.countries.map((x: string) => String(x).toUpperCase().trim()).filter(Boolean).slice(0, 60)
        : [];
      t.geo = { mode, countries };
      out.targeting = t;
    }
    if (body.frequencyCap && typeof body.frequencyCap === 'object') {
      const f = body.frequencyCap;
      out.frequencyCap = {
        perUserPerDay: num(f.perUserPerDay ?? f.perDay),
        perCampaignPer7d: num(f.perCampaignPer7d),
        guestSessionCap: num(f.guestSessionCap),
      };
    }
    if (body.report && typeof body.report === 'object') {
      const r = body.report;
      const cadence = ['off', 'weekly', 'monthly', 'on_completion'].includes(r.cadence) ? r.cadence : 'off';
      const recipients = Array.isArray(r.recipients)
        ? r.recipients.map((x: string) => String(x).trim()).filter((x: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)).slice(0, 10)
        : [];
      out.report = { cadence, recipients };
    }
    if (body.advertiserId && mongoose.Types.ObjectId.isValid(body.advertiserId)) out.advertiserId = oid(body.advertiserId);
    return out;
  }

  /** Canonical status derived from admin intent + schedule dates. */
  private effectiveStatus(c: any): string {
    const s = c.status || 'draft';
    if (s === 'draft' || s === 'paused' || s === 'cancelled') return s;
    const now = Date.now();
    if (c.endAt && new Date(c.endAt).getTime() < now) return 'completed';
    if (c.startAt && new Date(c.startAt).getTime() > now) return 'scheduled';
    return 'active';
  }

  /** Reconcile & persist status from dates so it is never stuck on a manual toggle. */
  private async reconcile(c: any) {
    const eff = this.effectiveStatus(c);
    if (eff !== c.status) {
      await this.campaignModel.updateOne({ _id: c._id }, { $set: { status: eff } });
      c.status = eff;
    }
    return c;
  }

  async createCampaign(body: any, actorId?: string) {
    if (!body?.name?.trim()) return { success: false, message: 'Campaign name required' };
    const doc = this.sanitizeCampaign(body);
    doc.createdBy = actorId || '';
    doc.updatedBy = actorId || '';
    if (!doc.status) doc.status = 'draft';
    const created = await this.campaignModel.create(doc);
    return { success: true, data: created };
  }

  async updateCampaign(id: string, body: any, actorId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return { success: false, message: 'Invalid id' };
    const set = this.sanitizeCampaign(body);
    set.updatedBy = actorId || '';
    await this.campaignModel.updateOne({ _id: id }, { $set: set });
    const updated = await this.campaignModel.findById(id).lean();
    return { success: true, data: updated };
  }

  async setStatus(id: string, status: string) {
    const allowed = ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'];
    if (!allowed.includes(status)) return { success: false, message: 'Invalid status' };
    await this.campaignModel.updateOne({ _id: id }, { $set: { status } });
    return { success: true, data: { _id: id, status } };
  }

  async deleteCampaign(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return { success: false, message: 'Invalid id' };
    await this.campaignModel.deleteOne({ _id: id });
    await this.creativeModel.deleteMany({ campaignId: oid(id) });
    return { success: true, data: { _id: id } };
  }

  /* ───────────── Creatives ───────────── */
  async listCreatives(campaignId: string) {
    const data = await this.creativeModel.find({ campaignId: oid(campaignId) }).sort({ createdAt: -1 }).lean();
    return { success: true, data };
  }
  async createCreative(campaignId: string, body: any) {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) return { success: false, message: 'Invalid campaign' };
    const doc = await this.creativeModel.create({ ...this.sanitizeCreative(body), campaignId: oid(campaignId) });
    return { success: true, data: doc };
  }
  async updateCreative(id: string, body: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) return { success: false, message: 'Invalid id' };
    await this.creativeModel.updateOne({ _id: id }, { $set: this.sanitizeCreative(body) });
    const updated = await this.creativeModel.findById(id).lean();
    return { success: true, data: updated };
  }
  async deleteCreative(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return { success: false, message: 'Invalid id' };
    await this.creativeModel.deleteOne({ _id: id });
    return { success: true, data: { _id: id } };
  }
  private sanitizeCreative(body: any) {
    const out: any = {};
    ['type', 'brandName', 'logoUrl', 'imageUrl', 'mobileImageUrl', 'headline', 'description', 'ctaLabel', 'destinationUrl', 'sponsoredLabel', 'variant', 'displaySize', 'alt', 'kindOverride', 'progressLabel']
      .forEach((f) => { if (body[f] !== undefined) out[f] = body[f]; });
    // G26: first-party product promotion source
    if (body.creativeSource !== undefined) out.creativeSource = body.creativeSource === 'PRODUCT' ? 'PRODUCT' : 'CUSTOM';
    if (body.productCode !== undefined) out.productCode = String(body.productCode || '').trim();
    if (body.template !== undefined) {
      out.template = ['facts', 'deal', 'offer', 'profile', 'minimal'].includes(body.template) ? body.template : 'facts';
    }
    if (body.progress !== undefined) out.progress = Math.min(100, Math.max(0, num(body.progress)));
    if (body.demo !== undefined) out.demo = !!body.demo;
    if (Array.isArray(body.highlights)) {
      out.highlights = body.highlights
        .filter((h: any) => h && (h.label || h.value))
        .slice(0, 4)
        .map((h: any) => ({
          label: String(h.label || '').trim(),
          value: String(h.value || '').trim(),
          link: String(h.link || '').trim(),
          source: ['manual', 'platform', 'demo'].includes(h.source) ? h.source : 'manual',
        }));
    }
    if (body.enabled !== undefined) out.enabled = !!body.enabled;
    return out;
  }

  /* ───────────── Placements registry + inventory ───────────── */
  async listPlacements() {
    const settings = await this.placementSettingModel.find().lean();
    const map: Record<string, any> = {};
    settings.forEach((s: any) => (map[s.code] = s));
    const data = await Promise.all(
      AD_PLACEMENTS.map(async (p) => {
        const hist = await this.placementHistory(p.code, 14);
        const activeCampaigns = await this.campaignModel.countDocuments({ placements: p.code, status: 'active' });
        const s = map[p.code] || {};
        return {
          ...p,
          enabled: s.enabled !== false,
          mode: s.mode || 'ads',
          rotateAdSeconds: s.rotateAdSeconds || 30,
          rotateFormSeconds: s.rotateFormSeconds || 10,
          live: {
            avgViewablePerDay: hist.avgViewablePerDay,
            avgCtr: hist.avgCtr,
            uniqueReach: hist.uniqueReach,
            competingCampaigns: activeCampaigns,
            dataQuality: hist.dataQuality,
            estimatedInventoryPerDay: hist.dataQuality === 'ok' ? hist.avgViewablePerDay : p.baselineInventoryPerDay,
            inventoryIsBaseline: hist.dataQuality !== 'ok',
          },
        };
      }),
    );
    return { success: true, data };
  }

  async updatePlacementSetting(code: string, body: any) {
    if (!getPlacement(code)) return { success: false, message: 'Unknown placement' };
    const set: any = {};
    if (body.enabled !== undefined) set.enabled = !!body.enabled;
    if (body.mode !== undefined) set.mode = ['ads', 'form', 'rotate'].includes(body.mode) ? body.mode : 'ads';
    if (body.rotateAdSeconds !== undefined) set.rotateAdSeconds = Math.max(3, Math.min(600, num(body.rotateAdSeconds, 30)));
    if (body.rotateFormSeconds !== undefined) set.rotateFormSeconds = Math.max(3, Math.min(600, num(body.rotateFormSeconds, 10)));
    await this.placementSettingModel.updateOne({ code }, { $set: { code, ...set } }, { upsert: true });
    const doc = await this.placementSettingModel.findOne({ code }).lean();
    return { success: true, data: doc };
  }

  async placementConfig(code: string) {
    const s: any = await this.placementSettingModel.findOne({ code }).lean();
    return {
      success: true,
      data: {
        code,
        enabled: s ? s.enabled !== false : true,
        mode: s?.mode || 'ads',
        rotateAdSeconds: s?.rotateAdSeconds || 30,
        rotateFormSeconds: s?.rotateFormSeconds || 10,
      },
    };
  }

  private async placementHistory(placementCode: string, days = 14) {
    const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
    const rows = await this.eventModel.aggregate([
      { $match: { placementCode, day: { $gte: since } } },
      { $group: { _id: '$type', count: { $sum: 1 }, sessions: { $addToSet: '$sessionId' } } },
    ]);
    const byType: Record<string, any> = {};
    rows.forEach((r) => (byType[r._id] = r));
    const viewable = byType.viewable_impression?.count || 0;
    const clicks = byType.click?.count || 0;
    const uniqueReach = new Set(rows.flatMap((r) => (r.sessions || []).filter((x: string) => x))).size;
    const avgViewablePerDay = Math.round(viewable / days);
    const avgCtr = viewable > 0 ? round((clicks / viewable) * 100, 2) : 0;
    const dataQuality = viewable >= 200 ? 'ok' : viewable > 0 ? 'low' : 'insufficient';
    return { viewable, clicks, uniqueReach, avgViewablePerDay, avgCtr, dataQuality };
  }

  /* ───────────── Analytics ───────────── */
  async analyticsOverview(query: any = {}) {
    const days = num(query.days, 30);
    const includeDemo = query.includeDemo === 'true' || query.includeDemo === true;
    const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
    const match: any = { day: { $gte: since } };
    const demoIds = await this.demoCampaignIds();
    if (!includeDemo && demoIds.length) match.campaignId = { $nin: demoIds };

    const totalsRows = await this.eventModel.aggregate([
      { $match: match },
      { $group: { _id: '$type', count: { $sum: 1 }, sessions: { $addToSet: '$sessionId' }, spend: { $sum: '$billable' } } },
    ]);
    const byType: Record<string, any> = {};
    totalsRows.forEach((r) => (byType[r._id] = r));
    const impressions = byType.impression?.count || 0;
    const viewable = byType.viewable_impression?.count || 0;
    const clicks = byType.click?.count || 0;
    const spend = round(totalsRows.reduce((s, r) => s + (r.spend || 0), 0), 2);
    const uniqueSessions = new Set(totalsRows.flatMap((r) => (r.sessions || []).filter((x: string) => x))).size;
    const ctr = viewable > 0 ? round((clicks / viewable) * 100, 2) : 0;
    const viewability = impressions > 0 ? round((viewable / impressions) * 100, 1) : 0;
    const cpm = viewable > 0 ? round((spend / viewable) * 1000, 2) : 0;
    const cpc = clicks > 0 ? round(spend / clicks, 2) : 0;

    const timeseries = await this.eventModel.aggregate([
      { $match: match },
      { $group: { _id: { day: '$day', type: '$type' }, count: { $sum: 1 } } },
      { $group: { _id: '$_id.day', types: { $push: { type: '$_id.type', count: '$count' } } } },
      { $sort: { _id: 1 } },
    ]);
    const series = timeseries.map((d: any) => {
      const m: Record<string, number> = {};
      d.types.forEach((t: any) => (m[t.type] = t.count));
      return { day: d._id, impressions: m.impression || 0, viewable: m.viewable_impression || 0, clicks: m.click || 0 };
    });

    const byPlacement = await this.eventModel.aggregate([
      { $match: match },
      { $group: { _id: { p: '$placementCode', t: '$type' }, count: { $sum: 1 } } },
      { $group: { _id: '$_id.p', types: { $push: { type: '$_id.t', count: '$count' } } } },
    ]);
    const placements = byPlacement.map((row: any) => {
      const m: Record<string, number> = {};
      row.types.forEach((t: any) => (m[t.type] = t.count));
      const v = m.viewable_impression || 0; const cl = m.click || 0;
      const def = getPlacement(row._id);
      return { code: row._id, name: def?.adminName || row._id, viewable: v, clicks: cl, ctr: v > 0 ? round((cl / v) * 100, 2) : 0 };
    }).sort((a, b) => b.viewable - a.viewable);

    // per-campaign for best/worst (exclude demo/test campaigns unless includeDemo)
    const campaigns = ((await this.listCampaigns()).data as any[]).filter((c) => includeDemo || !c.demo);
    const ranked = campaigns
      .filter((c) => c.stats.viewable > 0)
      .map((c) => ({ _id: c._id, name: c.name, ctr: c.stats.ctr, viewable: c.stats.viewable, clicks: c.stats.clicks, spend: c.stats.spend }));
    const best = [...ranked].sort((a, b) => b.ctr - a.ctr).slice(0, 5);
    const worst = [...ranked].sort((a, b) => a.ctr - b.ctr).slice(0, 5);

    const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;
    const scheduled = campaigns.filter((c) => c.status === 'scheduled').length;
    const completed = campaigns.filter((c) => c.status === 'completed').length;
    const totalBudget = round(campaigns.reduce((s, c) => s + num(c.budget), 0), 2);

    return {
      success: true,
      data: {
        includeDemo,
        demoCampaigns: demoIds.length,
        totals: { impressions, viewable, clicks, uniqueSessions, spend, ctr, viewability, cpm, cpc, totalBudget },
        lifecycle: { active: activeCampaigns, scheduled, completed, total: campaigns.length },
        series,
        placements,
        best,
        worst,
      },
    };
  }

  async analyticsCampaign(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return { success: false, message: 'Invalid id' };
    const base = await this.getCampaign(id);
    if (!base?.success) return base;

    const cid = new mongoose.Types.ObjectId(id);
    const match: any = { campaignId: cid };

    // totals by event type
    const totalsRows = await this.eventModel.aggregate([
      { $match: match },
      { $group: { _id: '$type', count: { $sum: 1 }, sessions: { $addToSet: '$sessionId' }, spend: { $sum: '$billable' } } },
    ]);
    const byType: Record<string, any> = {};
    totalsRows.forEach((r) => (byType[r._id] = r));
    const impressions = byType.impression?.count || 0;
    const viewable = byType.viewable_impression?.count || 0;
    const clicks = byType.click?.count || 0;
    const ctaClicks = byType.cta_click?.count || 0;
    const conversions = byType.conversion?.count || 0;
    const spend = round(totalsRows.reduce((s, r) => s + (r.spend || 0), 0), 2);
    const uniqueSessions = new Set(totalsRows.flatMap((r) => (r.sessions || []).filter((x: string) => x))).size;
    const ctr = viewable > 0 ? round((clicks / viewable) * 100, 2) : 0;
    const viewability = impressions > 0 ? round((viewable / impressions) * 100, 1) : 0;
    const cpm = viewable > 0 ? round((spend / viewable) * 1000, 2) : 0;
    const cpc = clicks > 0 ? round(spend / clicks, 2) : 0;
    const conversionRate = clicks > 0 ? round((conversions / clicks) * 100, 2) : 0;
    const costPerConversion = conversions > 0 ? round(spend / conversions, 2) : 0;

    // daily time-series
    const tsRows = await this.eventModel.aggregate([
      { $match: match },
      { $group: { _id: { day: '$day', type: '$type' }, count: { $sum: 1 }, spend: { $sum: '$billable' } } },
      { $group: { _id: '$_id.day', types: { $push: { type: '$_id.type', count: '$count', spend: '$spend' } } } },
      { $sort: { _id: 1 } },
    ]);
    const series = tsRows.map((d: any) => {
      const m: Record<string, number> = {};
      let daySpend = 0;
      d.types.forEach((t: any) => { m[t.type] = t.count; daySpend += t.spend || 0; });
      const v = m.viewable_impression || 0; const cl = m.click || 0;
      return {
        day: d._id,
        impressions: m.impression || 0,
        viewable: v,
        clicks: cl,
        conversions: m.conversion || 0,
        spend: round(daySpend, 2),
        ctr: v > 0 ? round((cl / v) * 100, 2) : 0,
      };
    });

    // per-placement breakdown
    const placeRows = await this.eventModel.aggregate([
      { $match: match },
      { $group: { _id: { p: '$placementCode', t: '$type' }, count: { $sum: 1 }, spend: { $sum: '$billable' } } },
      { $group: { _id: '$_id.p', types: { $push: { type: '$_id.t', count: '$count', spend: '$spend' } } } },
    ]);
    const placements = placeRows.map((row: any) => {
      const m: Record<string, number> = {};
      let sp = 0;
      row.types.forEach((t: any) => { m[t.type] = t.count; sp += t.spend || 0; });
      const v = m.viewable_impression || 0; const cl = m.click || 0;
      const def = getPlacement(row._id);
      return { code: row._id, name: def?.adminName || row._id, viewable: v, clicks: cl, conversions: m.conversion || 0, spend: round(sp, 2), ctr: v > 0 ? round((cl / v) * 100, 2) : 0 };
    }).sort((a, b) => b.viewable - a.viewable);

    // device split (by viewable impressions)
    const deviceRows = await this.eventModel.aggregate([
      { $match: { ...match, type: 'viewable_impression' } },
      { $group: { _id: '$device', count: { $sum: 1 } } },
    ]);
    const devices = deviceRows.map((r: any) => ({ device: r._id || 'unknown', viewable: r.count }));

    // geo breakdown by country: impressions, unique reach, clicks, CTR, spend
    const geoRows = await this.eventModel.aggregate([
      { $match: match },
      { $group: { _id: { c: { $ifNull: ['$country', ''] }, t: '$type' }, count: { $sum: 1 }, spend: { $sum: '$billable' }, sessions: { $addToSet: '$sessionId' } } },
      { $group: { _id: '$_id.c', types: { $push: { type: '$_id.t', count: '$count', spend: '$spend', sessions: '$sessions' } } } },
    ]);
    const countries = geoRows.map((row: any) => {
      const m: Record<string, number> = {};
      let sp = 0; const reach = new Set<string>();
      row.types.forEach((t: any) => {
        m[t.type] = t.count; sp += t.spend || 0;
        if (t.type === 'viewable_impression') (t.sessions || []).forEach((s: string) => { if (s) reach.add(s); });
      });
      const v = m.viewable_impression || 0; const cl = m.click || 0;
      return { country: row._id || 'unknown', impressions: m.impression || 0, viewable: v, clicks: cl, uniqueReach: reach.size, spend: round(sp, 2), ctr: v > 0 ? round((cl / v) * 100, 2) : 0 };
    }).sort((a, b) => b.viewable - a.viewable);

    // per-creative breakdown (A/B comparison)
    const creativeRows = await this.eventModel.aggregate([
      { $match: { ...match, creativeId: { $ne: null } } },
      { $group: { _id: { c: '$creativeId', t: '$type' }, count: { $sum: 1 }, spend: { $sum: '$billable' } } },
      { $group: { _id: '$_id.c', types: { $push: { type: '$_id.t', count: '$count', spend: '$spend' } } } },
    ]);
    const creativeMeta: Record<string, any> = {};
    (base.data.creatives || []).forEach((cr: any) => { creativeMeta[String(cr._id)] = cr; });
    const creatives = creativeRows.map((row: any) => {
      const m: Record<string, number> = {};
      let sp = 0;
      row.types.forEach((t: any) => { m[t.type] = t.count; sp += t.spend || 0; });
      const v = m.viewable_impression || 0; const cl = m.click || 0; const conv = m.conversion || 0;
      const meta = creativeMeta[String(row._id)] || {};
      return {
        creativeId: String(row._id),
        label: meta.headline || meta.brandName || String(row._id).slice(-6),
        brandName: meta.brandName || '',
        variant: meta.variant || '',
        displaySize: meta.displaySize || 'standard',
        enabled: meta.enabled !== false,
        impressions: m.impression || 0,
        viewable: v,
        clicks: cl,
        conversions: conv,
        spend: round(sp, 2),
        ctr: v > 0 ? round((cl / v) * 100, 2) : 0,
        cr: cl > 0 ? round((conv / cl) * 100, 2) : 0,
      };
    }).sort((a, b) => b.ctr - a.ctr);

    const funnel = [
      { step: 'Показы', value: impressions },
      { step: 'Видимые', value: viewable },
      { step: 'Клики', value: clicks },
      { step: 'CTA', value: ctaClicks },
      { step: 'Конверсии', value: conversions },
    ];

    return {
      success: true,
      data: {
        campaign: base.data,
        totals: {
          impressions, viewable, clicks, ctaClicks, conversions, spend,
          uniqueSessions, ctr, viewability, cpm, cpc, conversionRate, costPerConversion,
          budget: num(base.data.budget),
        },
        series,
        placements,
        devices,
        countries,
        creatives,
        funnel,
        hasData: viewable > 0 || impressions > 0 || clicks > 0,
      },
    };
  }

  /* ───────────── Reporting ───────────── */
  private nextReportAt(cadence: string, from = new Date()): Date | null {
    const d = new Date(from);
    if (cadence === 'weekly') { d.setDate(d.getDate() + 7); return d; }
    if (cadence === 'monthly') { d.setMonth(d.getMonth() + 1); return d; }
    return null; // off / on_completion have no fixed next date
  }

  async getReportState(campaignId: string) {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) return { success: false, message: 'Invalid id' };
    const c: any = await this.campaignModel.findById(campaignId).lean();
    if (!c) return { success: false, message: 'Not found' };
    const provider = await this.emailProviderStatus();
    const advertiser = c.advertiserId ? await this.advertiserModel.findById(c.advertiserId).lean() : null;
    const history = await this.reportModel.find({ campaignId: c._id }).sort({ generatedAt: -1 }).limit(20).lean();
    return {
      success: true,
      data: {
        report: c.report || { cadence: 'off', recipients: [] },
        advertiserEmail: (advertiser as any)?.contactEmail || '',
        emailProvider: provider,
        history,
      },
    };
  }

  async updateReportConfig(campaignId: string, body: any) {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) return { success: false, message: 'Invalid id' };
    const cadence = ['off', 'weekly', 'monthly', 'on_completion'].includes(body?.cadence) ? body.cadence : 'off';
    const recipients = Array.isArray(body?.recipients)
      ? body.recipients.map((x: string) => String(x).trim()).filter((x: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x)).slice(0, 10)
      : [];
    const report: any = { cadence, recipients, nextReportAt: this.nextReportAt(cadence) };
    await this.campaignModel.updateOne({ _id: campaignId }, { $set: { report } });
    return { success: true, data: report };
  }

  /** Generate a report entry from REAL campaign stats; email only if provider connected (else 'not_connected'). */
  async generateReport(campaignId: string, opts: { trigger?: string; send?: boolean } = {}) {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) return { success: false, message: 'Invalid id' };
    const analytics = await this.analyticsCampaign(campaignId);
    if (!analytics?.success) return analytics;
    const c: any = analytics.data.campaign;
    const totals = analytics.data.totals;
    const recipients: string[] = [...((c.report?.recipients) || [])];
    const advertiser = c.advertiserId ? await this.advertiserModel.findById(c.advertiserId).lean() : null;
    if ((advertiser as any)?.contactEmail) recipients.unshift((advertiser as any).contactEmail);
    const uniq = Array.from(new Set(recipients.filter(Boolean)));

    const provider = await this.emailProviderStatus();
    const wantSend = opts.send !== false;
    let status = 'generated';
    let error = '';
    let sentAt: Date | undefined;

    if (wantSend) {
      if (provider.status !== 'configured') {
        status = 'not_connected'; // do NOT fake a send when Resend is not connected
      } else if (uniq.length) {
        try {
          const period = `${new Date().toISOString().slice(0, 10)}`;
          const html = `<h2>${c.name} — campaign report</h2><p>Viewable: ${totals.viewable} · Clicks: ${totals.clicks} · CTR: ${totals.ctr}% · Spend: $${totals.spend}</p><p>Full PDF is available in the FOMO CRM.</p>`;
          for (const to of uniq) {
            await (this.emailService as any).sendMessage(to, { title: `${c.name} — report ${period}`, message: html });
          }
          status = 'sent'; sentAt = new Date();
        } catch (e: any) {
          status = 'failed'; error = e?.message || 'send failed';
        }
      }
    }

    const doc = await this.reportModel.create({
      campaignId: new mongoose.Types.ObjectId(campaignId),
      campaignName: c.name,
      trigger: opts.trigger || 'manual',
      periodFrom: c.startAt || null,
      periodTo: c.endAt || new Date(),
      recipients: uniq,
      status, error,
      totals: { viewable: totals.viewable, clicks: totals.clicks, ctr: totals.ctr, spend: totals.spend, conversions: totals.conversions },
      generatedAt: new Date(),
      sentAt,
    });
    await this.campaignModel.updateOne(
      { _id: campaignId },
      { $set: { 'report.lastReportAt': new Date(), 'report.deliveryStatus': status, 'report.nextReportAt': this.nextReportAt(c.report?.cadence || 'off') } },
    );
    return { success: true, data: { report: doc, emailProvider: provider } };
  }

  /* ───────────── Forecast ───────────── */
  async forecast(body: any) {
    const placementCode = body?.placement;
    const def = getPlacement(placementCode);
    if (!def) return { success: false, message: 'Unknown placement' };
    const pricingModel = ['cpm', 'cpc', 'fixed'].includes(body?.pricingModel) ? body.pricingModel : 'cpm';
    const rate = num(body?.rate);
    const budget = num(body?.budget);
    const periodDays = Math.max(1, num(body?.days, 14));

    const hist = await this.placementHistory(placementCode, 14);
    const usingBaseline = hist.dataQuality !== 'ok';
    const dailyViewable = usingBaseline ? def.baselineInventoryPerDay : hist.avgViewablePerDay;
    const ctrFrac = (usingBaseline ? 2.0 : hist.avgCtr) / 100; // baseline 2% CTR
    const inventoryOverPeriod = dailyViewable * periodDays;

    let expectedImpressions = 0;
    let expectedClicks = 0;
    if (pricingModel === 'cpm') {
      const affordable = rate > 0 ? (budget / rate) * 1000 : inventoryOverPeriod;
      expectedImpressions = Math.min(affordable, inventoryOverPeriod);
      expectedClicks = expectedImpressions * ctrFrac;
    } else if (pricingModel === 'cpc') {
      const affordableClicks = rate > 0 ? budget / rate : inventoryOverPeriod * ctrFrac;
      expectedClicks = Math.min(affordableClicks, inventoryOverPeriod * ctrFrac);
      expectedImpressions = ctrFrac > 0 ? expectedClicks / ctrFrac : 0;
    } else {
      expectedImpressions = inventoryOverPeriod;
      expectedClicks = expectedImpressions * ctrFrac;
    }

    const avgFrequency = 1.6; // conservative sessions->impressions ratio
    const uniqueReach = Math.round(expectedImpressions / avgFrequency);
    const spread = usingBaseline ? 0.45 : 0.25;
    const mk = (v: number) => ({ low: Math.round(v * (1 - spread)), expected: Math.round(v), high: Math.round(v * (1 + spread)) });

    const effCpc = expectedClicks > 0 ? round((pricingModel === 'cpc' ? budget : (expectedImpressions / 1000) * rate) / expectedClicks, 2) : 0;
    const effCpm = expectedImpressions > 0 ? round((pricingModel === 'cpm' ? budget : expectedClicks * rate) / expectedImpressions * 1000, 2) : 0;

    return {
      success: true,
      data: {
        placement: { code: def.code, name: def.adminName },
        pricingModel, rate, budget, periodDays,
        dataQuality: hist.dataQuality,
        usingBaseline,
        note: usingBaseline
          ? 'Недостаточно данных для достоверного прогноза — показан baseline-оценка (не реальная история).'
          : 'Прогноз на основе реальной истории плейсмента (14 дней).',
        expectedImpressions: mk(expectedImpressions),
        uniqueReach: mk(uniqueReach),
        expectedClicks: mk(expectedClicks),
        ctr: round(ctrFrac * 100, 2),
        estCpc: effCpc,
        estCpm: effCpm,
        inventoryOverPeriod: Math.round(inventoryOverPeriod),
      },
    };
  }
}
