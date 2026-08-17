import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { SupportCategory, SupportCategoryDocument } from './models/support-category.model';
import { ReportReason, ReportReasonDocument } from './models/report-reason.model';
import { TrustReport, TrustReportDocument } from './models/trust-report.model';
import { SupportTicket, SupportTicketDocument } from './models/support-ticket.model';
import { ModerationCase, ModerationCaseDocument } from './models/moderation-case.model';
import { Appeal, AppealDocument } from '../deals/model/appeal.model';
import { UserActionLogsService } from '../user-action-logs/user-action-logs.service';
import { CANONICAL_CATEGORIES, CANONICAL_REASONS } from './canonical';

const rid = (n = 4) => Math.random().toString(36).slice(2, 2 + n).toUpperCase();

@Injectable()
export class TrustService {
  constructor(
    @InjectModel(SupportCategory.name) private categoryModel: Model<SupportCategoryDocument>,
    @InjectModel(ReportReason.name) private reasonModel: Model<ReportReasonDocument>,
    @InjectModel(TrustReport.name) private reportModel: Model<TrustReportDocument>,
    @InjectModel(SupportTicket.name) private ticketModel: Model<SupportTicketDocument>,
    @InjectModel(ModerationCase.name) private caseModel: Model<ModerationCaseDocument>,
    @InjectModel(Appeal.name) private appealModel: Model<AppealDocument>,
    private readonly auditLogs: UserActionLogsService,
  ) {}

  /* ── Audit: reuse the existing user_action_logs store ── */
  private async audit(input: {
    userId?: any; actorId?: any; action: string; title?: string; description?: string;
    entityType?: string; entityId?: any; before?: any; after?: any; reason?: string;
  }) {
    try {
      await this.auditLogs.log({
        userId: input.userId || undefined,
        actorId: input.actorId || undefined,
        actorType: 'moderator',
        category: 'trust',
        action: input.action,
        severity: 'info',
        title: input.title || input.action,
        description: input.description || '',
        entityType: input.entityType || '',
        entityId: input.entityId,
        metadata: { before: input.before, after: input.after, reason: input.reason },
      });
    } catch { /* best-effort audit */ }
  }

  /* ── Categories ── */
  async listCategories(publicOnly = false) {
    const q: any = {};
    if (publicOnly) { q.active = true; q.publicVisible = true; }
    const all = await this.categoryModel.find(q).sort({ sortOrder: 1, name: 1 }).lean();
    return all;
  }

  async categoriesTree(publicOnly = false) {
    const all = await this.listCategories(publicOnly);
    const byParent: Record<string, any[]> = {};
    all.forEach((c: any) => { const p = c.parentCode || ''; (byParent[p] = byParent[p] || []).push(c); });
    const build = (parent: string): any[] => (byParent[parent] || []).map((c: any) => ({ ...c, children: build(c.code) }));
    return build('');
  }

  async createCategory(dto: any) {
    if (!dto?.code || !dto?.name) throw new BadRequestException('code and name are required');
    const exists = await this.categoryModel.findOne({ code: dto.code });
    if (exists) throw new BadRequestException('category code already exists');
    return this.categoryModel.create({ ...dto, source: dto.source || 'custom' });
  }

  async updateCategory(code: string, dto: any) {
    const cat = await this.categoryModel.findOne({ code });
    if (!cat) throw new NotFoundException('category not found');
    const patch = { ...dto };
    delete patch.code; // code is immutable
    Object.assign(cat, patch);
    return cat.save();
  }

  async deleteCategory(code: string) {
    const children = await this.categoryModel.countDocuments({ parentCode: code });
    if (children > 0) throw new BadRequestException('remove or reassign child categories first');
    await this.categoryModel.deleteOne({ code });
    return { success: true };
  }

  /* ── Report reasons ── */
  async listReasons(targetType?: string, activeOnly = false) {
    const q: any = {};
    if (activeOnly) q.active = true;
    if (targetType) q.allowedTargetTypes = targetType;
    return this.reasonModel.find(q).sort({ sortOrder: 1, label: 1 }).lean();
  }

  async createReason(dto: any) {
    if (!dto?.code || !dto?.label) throw new BadRequestException('code and label are required');
    const exists = await this.reasonModel.findOne({ code: dto.code });
    if (exists) throw new BadRequestException('reason code already exists');
    return this.reasonModel.create({ ...dto, reasonClass: 'custom', source: 'custom' });
  }

  async updateReason(code: string, dto: any) {
    const reason = await this.reasonModel.findOne({ code });
    if (!reason) throw new NotFoundException('reason not found');
    const patch = { ...dto };
    delete patch.code;
    if (reason.reasonClass === 'system') { delete patch.reasonClass; } // cannot demote system
    Object.assign(reason, patch);
    return reason.save();
  }

  async deleteReason(code: string) {
    const reason = await this.reasonModel.findOne({ code });
    if (!reason) throw new NotFoundException('reason not found');
    if (reason.reasonClass === 'system') throw new BadRequestException('system reasons cannot be deleted; deactivate instead');
    await this.reasonModel.deleteOne({ code });
    return { success: true };
  }

  /* ── Unified reports ── */
  async createReport(dto: any, reporterId?: string) {
    if (!dto?.targetType) throw new BadRequestException('targetType is required');
    return this.reportModel.create({
      reporter: reporterId || null,
      targetType: dto.targetType,
      targetId: dto.targetId || '',
      targetSnapshot: dto.targetSnapshot || {},
      reasonCode: dto.reasonCode || '',
      subReason: dto.subReason || '',
      description: dto.description || '',
      evidence: dto.evidence || [],
      priority: dto.priority || 'normal',
      status: 'new',
      source: dto.source || 'user',
    });
  }

  async listReports(filters: any = {}) {
    const q: any = {};
    if (filters.targetType && filters.targetType !== 'all') q.targetType = filters.targetType;
    if (filters.status && filters.status !== 'all') q.status = filters.status;
    if (filters.reasonCode && filters.reasonCode !== 'all') q.reasonCode = filters.reasonCode;
    if (!filters.includeDemo) q.source = { $ne: 'demo-seed' };
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 100;
    const items = await this.reportModel.find(q)
      .populate('reporter', 'username wallet photo')
      .populate('assignedModerator', 'username')
      .sort({ createdAt: -1 }).limit(limit).lean();
    return { data: items, total: items.length };
  }

  async getReport(id: string) {
    const r = await this.reportModel.findById(id)
      .populate('reporter', 'username wallet photo')
      .populate('assignedModerator', 'username').lean();
    if (!r) throw new NotFoundException('report not found');
    return r;
  }

  async updateReport(id: string, dto: any, moderatorId?: string) {
    const r = await this.reportModel.findById(id);
    if (!r) throw new NotFoundException('report not found');
    const before = { status: r.status, priority: r.priority, assignedModerator: r.assignedModerator };
    if (dto.status) r.status = dto.status;
    if (dto.priority) r.priority = dto.priority;
    if (dto.resolution !== undefined) r.resolution = dto.resolution;
    if (dto.assign) r.assignedModerator = moderatorId as any;
    if (dto.action) r.actions.push({ ...dto.action, actor: moderatorId || null, at: new Date() });
    const saved = await r.save();
    await this.audit({
      userId: r.targetType === 'USER' ? r.targetId : r.reporter,
      actorId: moderatorId,
      action: dto.status === 'resolved' ? 'report_resolved' : dto.status === 'rejected' ? 'report_rejected' : dto.assign ? 'report_assigned' : 'report_updated',
      title: `Report ${r.targetType} ${dto.status || 'updated'}`,
      entityType: 'trust_report', entityId: id,
      before, after: { status: r.status, priority: r.priority }, reason: dto.resolution,
    });
    return saved;
  }

  /* ── Support tickets ── */
  private genTicket() { return `FOMO-${Date.now().toString(36).toUpperCase()}-${rid(3)}`; }

  async createTicket(dto: any, requesterId?: string) {
    const ticketNumber = this.genTicket();
    const now = new Date();
    const messages = dto.message ? [{ author: requesterId || null, authorType: 'user', body: dto.message, attachments: dto.attachments || [], createdAt: now }] : [];
    // Resolve SLA from the ticket's category (or its parent). Only set when configured.
    let sla: Record<string, any> = {};
    let priority = dto.priority || 'normal';
    if (dto.categoryCode) {
      const cat = await this.categoryModel.findOne({ code: dto.categoryCode }).lean();
      const parent = cat?.parentCode ? await this.categoryModel.findOne({ code: cat.parentCode }).lean() : null;
      const policy = (cat?.slaPolicy && Object.keys(cat.slaPolicy).length ? cat.slaPolicy : parent?.slaPolicy) || {};
      if (!dto.priority && cat?.defaultPriority) priority = cat.defaultPriority;
      if (policy.firstResponseHours || policy.resolutionHours) {
        sla = {
          firstResponseHours: policy.firstResponseHours || null,
          resolutionHours: policy.resolutionHours || null,
          firstResponseDueAt: policy.firstResponseHours ? new Date(now.getTime() + policy.firstResponseHours * 36e5) : null,
          resolutionDueAt: policy.resolutionHours ? new Date(now.getTime() + policy.resolutionHours * 36e5) : null,
        };
      }
    }
    return this.ticketModel.create({
      ticketNumber,
      requester: requesterId || null,
      categoryCode: dto.categoryCode || '',
      subcategoryCode: dto.subcategoryCode || '',
      subject: dto.subject || '',
      status: 'new',
      priority,
      context: dto.context || {},
      attachments: dto.attachments || [],
      messages,
      timeline: [{ type: 'created', meta: {}, actor: requesterId || null, at: now }],
      sla,
      lastReplyAt: messages.length ? now : null,
      source: dto.source || 'user',
    });
  }

  async listTickets(filters: any = {}) {
    const q: any = {};
    if (filters.status && filters.status !== 'all') q.status = filters.status;
    if (filters.categoryCode && filters.categoryCode !== 'all') q.categoryCode = filters.categoryCode;
    if (filters.priority && filters.priority !== 'all') q.priority = filters.priority;
    if (!filters.includeDemo) q.source = { $ne: 'demo-seed' };
    const limit = Number(filters.limit) > 0 ? Number(filters.limit) : 100;
    const items = await this.ticketModel.find(q)
      .populate('requester', 'username wallet photo')
      .populate('assignee', 'username')
      .sort({ createdAt: -1 }).limit(limit).lean();
    return { data: items, total: items.length };
  }

  async myTickets(userId: string) {
    return this.ticketModel.find({ requester: userId }).sort({ createdAt: -1 }).lean();
  }

  async getTicket(id: string) {
    const t = await this.ticketModel.findById(id)
      .populate('requester', 'username wallet photo')
      .populate('assignee', 'username')
      .populate('messages.author', 'username photo role').lean();
    if (!t) throw new NotFoundException('ticket not found');
    return t;
  }

  async addTicketMessage(id: string, dto: any, actorId?: string) {
    const t = await this.ticketModel.findById(id);
    if (!t) throw new NotFoundException('ticket not found');
    const authorType = dto.authorType || 'agent';
    t.messages.push({ author: actorId || null, authorType, body: dto.body || '', attachments: dto.attachments || [], createdAt: new Date() } as any);
    t.lastReplyAt = new Date();
    if (authorType === 'user') { t.status = 'waiting_team'; t.timeline.push({ type: 'user_replied', meta: {}, actor: actorId || null, at: new Date() } as any); }
    else if (authorType === 'agent') { t.status = 'waiting_user'; t.timeline.push({ type: 'agent_replied', meta: {}, actor: actorId || null, at: new Date() } as any); }
    return t.save();
  }

  async updateTicket(id: string, dto: any, actorId?: string) {
    const t = await this.ticketModel.findById(id);
    if (!t) throw new NotFoundException('ticket not found');
    if (dto.status && dto.status !== t.status) { t.timeline.push({ type: 'status_changed', meta: { from: t.status, to: dto.status }, actor: actorId || null, at: new Date() } as any); t.status = dto.status; }
    if (dto.priority) t.priority = dto.priority;
    if (dto.categoryCode) { t.timeline.push({ type: 'category_changed', meta: { to: dto.categoryCode }, actor: actorId || null, at: new Date() } as any); t.categoryCode = dto.categoryCode; }
    if (dto.subcategoryCode !== undefined) t.subcategoryCode = dto.subcategoryCode;
    if (dto.assign) { t.assignee = actorId as any; t.timeline.push({ type: 'assigned', meta: {}, actor: actorId || null, at: new Date() } as any); }
    const saved = await t.save();
    await this.audit({
      userId: t.requester, actorId,
      action: dto.status ? 'ticket_status_changed' : dto.assign ? 'ticket_assigned' : dto.priority ? 'ticket_priority_changed' : 'ticket_updated',
      title: `Ticket ${t.ticketNumber}`, entityType: 'support_ticket', entityId: id,
      after: { status: t.status, priority: t.priority },
    });
    return saved;
  }

  /* ── Moderation cases ── */
  private genCase() { return `MOD-${Date.now().toString(36).toUpperCase()}-${rid(3)}`; }

  async createCase(dto: any, actorId?: string) {
    return this.caseModel.create({
      caseNumber: this.genCase(),
      type: dto.type || 'manual',
      subjectUser: dto.subjectUser || null,
      status: 'open',
      severity: dto.severity || 'normal',
      description: dto.description || '',
      evidence: dto.evidence || [],
      relatedReports: dto.relatedReports || [],
      assignedModerator: actorId || null,
      source: dto.source || 'manual',
    });
  }

  async listCases(filters: any = {}) {
    const q: any = {};
    if (filters.type && filters.type !== 'all') q.type = filters.type;
    if (filters.status && filters.status !== 'all') q.status = filters.status;
    if (!filters.includeDemo) q.source = { $ne: 'demo-seed' };
    const items = await this.caseModel.find(q)
      .populate('subjectUser', 'username wallet photo')
      .populate('assignedModerator', 'username')
      .sort({ createdAt: -1 }).limit(200).lean();
    return { data: items, total: items.length };
  }

  async getCase(id: string) {
    const c = await this.caseModel.findById(id).populate('subjectUser', 'username wallet photo').lean();
    if (!c) throw new NotFoundException('case not found');
    return c;
  }

  async updateCase(id: string, dto: any, actorId?: string) {
    const c = await this.caseModel.findById(id);
    if (!c) throw new NotFoundException('case not found');
    const before = { status: c.status, severity: c.severity };
    if (dto.status) c.status = dto.status;
    if (dto.severity) c.severity = dto.severity;
    if (dto.action) c.actions.push({ ...dto.action, actor: actorId || null, at: new Date() });
    const saved = await c.save();
    await this.audit({
      userId: c.subjectUser, actorId,
      action: dto.action?.type ? `moderation_${dto.action.type}` : dto.status ? 'moderation_status_changed' : 'moderation_updated',
      title: `Case ${c.caseNumber}`, entityType: 'moderation_case', entityId: id,
      before, after: { status: c.status, severity: c.severity }, reason: dto.action?.reason,
    });
    return saved;
  }

  /* ── Customer 360 aggregation for one user ── */
  async userTrustSummary(userId: string) {
    const oid: any = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    const [
      ticketsOpen, ticketsClosed, lastTicket,
      reportsBy, reportsAgainst, reportsConfirmed, reportsRejected,
      casesOpen, casesTotal,
      disputesFiled, disputesOpen, disputesResolved,
    ] = await Promise.all([
      this.ticketModel.countDocuments({ requester: oid, status: { $nin: ['resolved', 'closed'] } }),
      this.ticketModel.countDocuments({ requester: oid, status: { $in: ['resolved', 'closed'] } }),
      this.ticketModel.findOne({ requester: oid }).sort({ createdAt: -1 }).select('ticketNumber subject status createdAt').lean(),
      this.reportModel.countDocuments({ reporter: oid }),
      this.reportModel.countDocuments({ targetType: 'USER', targetId: userId }),
      this.reportModel.countDocuments({ targetType: 'USER', targetId: userId, status: 'resolved' }),
      this.reportModel.countDocuments({ targetType: 'USER', targetId: userId, status: 'rejected' }),
      this.caseModel.countDocuments({ subjectUser: oid, status: { $in: ['open', 'reviewing'] } }),
      this.caseModel.countDocuments({ subjectUser: oid }),
      this.appealModel.countDocuments({ creator: oid }),
      this.appealModel.countDocuments({ creator: oid, status: { $in: ['open', 'in_review'] } }),
      this.appealModel.countDocuments({ creator: oid, status: 'resolved' }),
    ]);
    return {
      support: { open: ticketsOpen, closed: ticketsClosed, lastTicket: lastTicket || null },
      reports: { filed: reportsBy, received: reportsAgainst, confirmed: reportsConfirmed, rejected: reportsRejected },
      disputes: { filed: disputesFiled, open: disputesOpen, resolved: disputesResolved },
      moderation: { openCases: casesOpen, totalCases: casesTotal },
    };
  }

  /* ── Analytics overview ── */
  async analyticsOverview(includeDemo = false) {
    const src = includeDemo ? {} : { source: { $ne: 'demo-seed' } };
    const [tickets, ticketOpen, ticketResolved, reports, reportsByType, cases] = await Promise.all([
      this.ticketModel.countDocuments(src),
      this.ticketModel.countDocuments({ ...src, status: { $in: ['new', 'open', 'waiting_user', 'waiting_team', 'reopened'] } }),
      this.ticketModel.countDocuments({ ...src, status: { $in: ['resolved', 'closed'] } }),
      this.reportModel.countDocuments(src),
      this.reportModel.aggregate([{ $match: src }, { $group: { _id: '$targetType', count: { $sum: 1 } } }]),
      this.caseModel.countDocuments(src),
    ]);
    return {
      tickets: { total: tickets, open: ticketOpen, resolved: ticketResolved },
      reports: { total: reports, byTargetType: reportsByType },
      moderation: { total: cases },
    };
  }

  /* ── Seed canonical taxonomy ── */
  // Default SLA policies applied to top-level categories (hours). Sub-categories inherit.
  private readonly SLA_BY_TOP: Record<string, { firstResponseHours: number; resolutionHours: number; priority: string }> = {
    trading: { firstResponseHours: 4, resolutionHours: 24, priority: 'high' },
    account: { firstResponseHours: 12, resolutionHours: 48, priority: 'normal' },
    fomo: { firstResponseHours: 24, resolutionHours: 72, priority: 'normal' },
    products: { firstResponseHours: 24, resolutionHours: 72, priority: 'normal' },
  };

  async seedCanonical() {
    let cats = 0, reasons = 0;
    for (let i = 0; i < CANONICAL_CATEGORIES.length; i++) {
      const c = CANONICAL_CATEGORIES[i];
      const topCode = c.parentCode || c.code;
      const sla = this.SLA_BY_TOP[topCode];
      await this.categoryModel.updateOne(
        { code: c.code },
        { $set: {
            name: c.name, parentCode: c.parentCode || '', icon: c.icon || '',
            allowedRequestTypes: c.allowedRequestTypes || ['support'],
            publicVisible: c.publicVisible !== false, active: true, source: 'system',
            defaultPriority: sla?.priority || 'normal',
            slaPolicy: sla ? { firstResponseHours: sla.firstResponseHours, resolutionHours: sla.resolutionHours } : {},
          }, $setOnInsert: { sortOrder: i } },
        { upsert: true },
      );
      cats++;
    }
    for (let i = 0; i < CANONICAL_REASONS.length; i++) {
      const r = CANONICAL_REASONS[i];
      await this.reasonModel.updateOne(
        { code: r.code },
        { $set: { label: r.label, allowedTargetTypes: r.allowedTargetTypes, reasonClass: 'system', active: true, source: 'system' }, $setOnInsert: { sortOrder: i } },
        { upsert: true },
      );
      reasons++;
    }
    return { categories: cats, reasons };
  }

  /* ── Demo seed (source='demo-seed', excluded from analytics by default) ── */
  async resetDemo() {
    const [t, r, c] = await Promise.all([
      this.ticketModel.deleteMany({ source: 'demo-seed' }),
      this.reportModel.deleteMany({ source: 'demo-seed' }),
      this.caseModel.deleteMany({ source: 'demo-seed' }),
    ]);
    return { tickets: t.deletedCount, reports: r.deletedCount, cases: c.deletedCount };
  }

  async seedDemo() {
    await this.resetDemo();
    const now = Date.now();
    // Support tickets across lifecycle
    const tickets = [
      { subject: 'Cannot connect my wallet', categoryCode: 'account_wallet', status: 'new', priority: 'high',
        messages: [{ authorType: 'user', body: 'MetaMask keeps rejecting the signature on login.', createdAt: new Date(now - 36e5) }] },
      { subject: 'XP did not update after SpacePort staking', categoryCode: 'fomo_xp_rank', status: 'waiting_user', priority: 'normal',
        messages: [
          { authorType: 'user', body: 'I staked 3 days ago but XP is still 0.', createdAt: new Date(now - 72e5) },
          { authorType: 'agent', body: 'Thanks! Could you share your wallet address so we can check the milestone?', createdAt: new Date(now - 68e5) },
        ] },
      { subject: 'Launchpad allocation question', categoryCode: 'products_launchpad', status: 'waiting_team', priority: 'normal',
        messages: [
          { authorType: 'user', body: 'Was my allocation confirmed for the last round?', createdAt: new Date(now - 90e5) },
          { authorType: 'agent', body: 'Checking with the launch team now.', createdAt: new Date(now - 80e5) },
          { authorType: 'internal', body: 'Internal: verify against launchpad snapshot.', createdAt: new Date(now - 79e5) },
        ] },
      { subject: 'Email change not received', categoryCode: 'account_email', status: 'resolved', priority: 'low',
        messages: [
          { authorType: 'user', body: 'Verification email never arrived.', createdAt: new Date(now - 200e5) },
          { authorType: 'agent', body: 'Re-sent to your inbox, please check spam. Marking resolved.', createdAt: new Date(now - 190e5) },
        ] },
    ];
    for (const t of tickets) {
      await this.ticketModel.create({
        ticketNumber: this.genTicket(), requester: null, categoryCode: t.categoryCode, subject: t.subject,
        status: t.status, priority: t.priority, source: 'demo-seed',
        messages: t.messages.map((m: any) => ({ author: null, authorType: m.authorType, body: m.body, attachments: [], createdAt: m.createdAt })),
        timeline: [{ type: 'created', meta: { demo: true }, actor: null, at: new Date(now - 210e5) }],
        lastReplyAt: t.messages[t.messages.length - 1].createdAt,
      });
    }
    // Unified reports across target types
    const reports = [
      { targetType: 'USER', reasonCode: 'impersonation', description: 'Pretends to be a well-known founder.', priority: 'high',
        targetSnapshot: { username: 'fake_vitalik', wallet: '0xA1b2...9F', page: '/persons/vitalik' } },
      { targetType: 'COMMENT', reasonCode: 'harassment', description: 'Insulting other users under a project.', priority: 'normal',
        targetSnapshot: { text: 'You are all clueless losers, this project is trash', author: 'rude_guy', page: '/crypto/projects/acme' } },
      { targetType: 'MESSAGE', reasonCode: 'spam', description: 'Dropping referral links in DMs.', priority: 'normal',
        targetSnapshot: { text: 'Join my signals group 5x guaranteed t.me/xxx', author: 'spammer99', context: ['hey', 'Join my signals group 5x guaranteed t.me/xxx', 'stop pls'] } },
      { targetType: 'USER', reasonCode: 'suspicious_trading', description: 'Repeated cancels after funds reserved.', priority: 'urgent',
        targetSnapshot: { username: 'wash_trader', wallet: '0xC3d4...11' } },
    ];
    for (const r of reports) await this.reportModel.create({ ...r, reporter: null, status: 'new', source: 'demo-seed' });
    // Moderation case
    await this.caseModel.create({
      caseNumber: this.genCase(), type: 'anti_farm', subjectUser: null, status: 'reviewing', severity: 'high',
      description: 'Cluster of accounts farming XP from the same device fingerprint.', evidence: [], source: 'demo-seed',
    });
    return this.analyticsOverview(true);
  }
}
