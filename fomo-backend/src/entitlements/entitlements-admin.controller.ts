import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types, isValidObjectId } from "mongoose";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { Capability } from "./models/capability.model";
import { Plan } from "./models/plan.model";
import { Subscription } from "./models/subscription.model";
import { Entitlement } from "./models/entitlement.model";
import { AccessResolverService } from "./access-resolver.service";
import { SubscriptionService } from "./subscription.service";
import { AiCreditsService } from "./ai-credits.service";
import { AiUsageEvent, AiCreditTransaction } from "./models/ai-credit.model";
import { AiProviderPricingService } from "./ai/ai-provider-pricing.service";
import { CreditPricingService } from "./ai/credit-pricing.service";
import { AiAnalyticsService } from "./ai/ai-analytics.service";
import { ProviderCredentialsService } from "./ai/provider-credentials.service";
import { FomoAiGateway } from "./ai/fomo-ai-gateway.service";
import { FomoAiService } from "./ai/fomo-ai.service";
import { FomoKnowledgeProvider } from "./ai/fomo-knowledge.provider";
import { CAPABILITY_REGISTRY } from "./entitlements.constants";
import { MEMBERSHIPS_PAGE_DEFAULT, MEMBERSHIPS_PAGE_KEY } from "./memberships-page.default";

const actorOf = (req: Request): string => {
  const u = req.user as any;
  return String(u?.email || u?.name || u?._id || "admin");
};

/** Admin (RU CRM) surface for the FOMO Monetization Core. */
@Controller("admin/entitlements")
@Roles("admin")
@UseGuards(JwtAuthGuard)
export class EntitlementsAdminController {
  constructor(
    @InjectModel(Capability.name) private readonly capabilityModel: Model<any>,
    @InjectModel(Plan.name) private readonly planModel: Model<any>,
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<any>,
    @InjectModel(Entitlement.name) private readonly entitlementModel: Model<any>,
    @InjectModel(AiUsageEvent.name) private readonly usageModel: Model<any>,
    @InjectModel(AiCreditTransaction.name) private readonly txModel: Model<any>,
    private readonly resolver: AccessResolverService,
    private readonly subs: SubscriptionService,
    private readonly credits: AiCreditsService,
    private readonly providerPricing: AiProviderPricingService,
    private readonly creditPricing: CreditPricingService,
    private readonly analytics: AiAnalyticsService,
    private readonly credentials: ProviderCredentialsService,
    private readonly gateway: FomoAiGateway,
    private readonly fomoAi: FomoAiService,
    private readonly knowledge: FomoKnowledgeProvider,
    @InjectConnection() private readonly conn: Connection,
  ) {}

  // ---------- Memberships selling-page CMS (G24/G25) ----------
  @Get("page/memberships")
  async getMembershipsPage() {
    const doc: any = await this.conn.collection("product_page_config").findOne({ key: MEMBERSHIPS_PAGE_KEY });
    const merged: any = { ...MEMBERSHIPS_PAGE_DEFAULT, ...(doc || {}) };
    delete merged._id;
    return { ok: true, config: merged };
  }

  @Put("page/memberships")
  async saveMembershipsPage(@Body() body: any) {
    const allowed = ["heroBadge", "heroTitle", "heroSubtitle", "valueProps", "faqTitle", "faq", "nftOfferTitle", "nftOfferText", "nftOfferCta", "footnote"];
    const update: any = { key: MEMBERSHIPS_PAGE_KEY, updatedAt: new Date() };
    for (const k of allowed) if (body[k] !== undefined) update[k] = body[k];
    await this.conn.collection("product_page_config").updateOne({ key: MEMBERSHIPS_PAGE_KEY }, { $set: update }, { upsert: true });
    const doc: any = await this.conn.collection("product_page_config").findOne({ key: MEMBERSHIPS_PAGE_KEY });
    const merged: any = { ...MEMBERSHIPS_PAGE_DEFAULT, ...(doc || {}) };
    delete merged._id;
    return { ok: true, config: merged };
  }

  // ---------- Capabilities / Plans ----------
  @Get("capabilities")
  async capabilities() {
    const rows = await this.capabilityModel.find().sort({ domain: 1, key: 1 }).lean();
    return { items: rows, total: rows.length };
  }

  @Get("plans")
  async plans() {
    const rows = await this.planModel.find().sort({ sortOrder: 1 }).lean();
    return { items: rows, total: rows.length };
  }

  @Post("plans")
  async upsertPlan(@Body() body: any) {
    if (!body?.code) return { ok: false, error: "code required" };
    const existing: any = await this.planModel.findOne({ code: body.code });
    const version = existing ? (existing.version || 1) + 1 : 1;
    // Phase F.1: FOMO Intel is access-only — never carries a credit economy.
    if (body.productType === "FOMO_INTEL") {
      body.aiCredits = null;
      body.aiCreditsIncluded = 0;
    }
    await this.planModel.updateOne(
      { code: body.code },
      { $set: { ...body, version, isDemo: existing?.isDemo ?? false } },
      { upsert: true },
    );
    return { ok: true, code: body.code, version };
  }

  /**
   * Permanently delete a plan (e.g. a leftover test package). Guarded so we can
   * never orphan a live customer: refuse if any non-terminal subscription or
   * in-flight purchase references it — the operator must archive it instead.
   * Historical (terminal) purchases keep their own immutable planSnapshot, so a
   * delete never rewrites financial history.
   */
  @Delete("plans/:code")
  async deletePlan(@Param("code") code: string, @Req() req: Request) {
    const plan: any = await this.planModel.findOne({ code }).lean();
    if (!plan) return { ok: false, error: "PLAN_NOT_FOUND" };

    const activeSubs = await this.subscriptionModel.countDocuments({
      planId: plan._id,
      status: { $in: ["ACTIVE", "GRACE_PERIOD", "PENDING"] },
    });
    if (activeSubs > 0) {
      return { ok: false, error: `Нельзя удалить: ${activeSubs} активн(ая/ых) подписк(а/и) используют этот тариф. Сначала переведите его в «Архив».` };
    }

    const IN_FLIGHT = [
      "RESERVED", "PAID", "SETTLING", "LEDGER_RESERVED", "CUSTODY_ITEM_PENDING",
      "USER_SIGNATURE_REQUIRED", "USER_TX_SUBMITTED", "CUSTODY_LOCKED",
      "OWNER_SETTLEMENT_PENDING", "OWNER_SETTLING", "OWNER_SETTLED", "PROVISIONING",
    ];
    const inFlight = await this.conn.collection("money_purchases").countDocuments({
      planCode: code, status: { $in: IN_FLIGHT },
    });
    if (inFlight > 0) {
      return { ok: false, error: `Нельзя удалить: есть ${inFlight} незавершённ(ая/ых) покупк(а/и) по этому тарифу. Дождитесь их завершения или переведите тариф в «Архив».` };
    }

    await this.planModel.deleteOne({ code });
    this.log(`plan '${code}' deleted by ${actorOf(req)}`);
    return { ok: true, deleted: code };
  }

  private log(msg: string) { try { console.log(`[EntitlementsAdmin] ${msg}`); } catch { /* noop */ } }

  // ---------- Overview ----------
  @Get("overview")
  async overview() {
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 86400000);
    const [activeSubs, plansCount, entitlementsActive, grantsLegacy, expiringSoon, creditRules] = await Promise.all([
      this.subscriptionModel.countDocuments({ status: "ACTIVE" }),
      this.planModel.countDocuments({ status: "ACTIVE" }),
      this.entitlementModel.countDocuments({ status: "ACTIVE", $or: [{ validUntil: null }, { validUntil: { $gt: now } }] }),
      this.entitlementModel.countDocuments({ sourceType: "ADMIN_GRANT", status: "ACTIVE" }),
      this.subscriptionModel.countDocuments({ status: "ACTIVE", currentPeriodEnd: { $gte: now, $lte: soon } }),
      this.credits.listRules(),
    ]);
    return {
      activeSubscriptions: activeSubs,
      activePlans: plansCount,
      activeEntitlements: entitlementsActive,
      manualGrants: grantsLegacy,
      nftDerivedEntitlements: await this.entitlementModel.countDocuments({ sourceType: "NFT_EVENT", status: "ACTIVE" }),
      expiringSoon,
      creditRules: creditRules.length,
      // No real checkout/usage yet -> no invented numbers.
      mrrUsd: null,
      aiCreditsGranted: null,
      aiCreditsConsumed: null,
      aiCogsUsd: null,
      grossMarginPct: null,
    };
  }

  // ---------- Access resolution / Diagnostics ----------
  @Get("access")
  async access(@Query("userId") userId: string, @Query("capability") capability: string) {
    return this.resolver.resolveAccess({ userId, capability });
  }

  @Get("diagnostics")
  async diagnostics(@Query("query") query: string) {
    const user = await this.findUser(String(query || ""));
    if (!user) return { found: false, query };
    const userId = String(user._id);
    const [decisions, subs, entitlements, balances] = await Promise.all([
      this.resolver.resolveMany(userId, CAPABILITY_REGISTRY.map((c) => c.key)),
      this.subscriptionModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).lean(),
      this.entitlementModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).lean(),
      this.credits.getBalances(userId).catch(() => null),
    ]);
    return {
      found: true,
      user: { _id: userId, email: user.email, wallet: user.wallet, role: user.role },
      subscriptions: subs,
      entitlements,
      credits: balances,
      access: decisions,
      resolvedAt: new Date(),
    };
  }

  // ---------- Direct capability grants (Доступы) ----------
  @Post("grants")
  async grant(
    @Body() body: { user?: string; capabilityKey?: string; reason?: string; validUntil?: string },
    @Req() req: Request,
  ) {
    const user = await this.findUser(String(body.user || ""));
    if (!user) return { ok: false, error: "Пользователь не найден (ID / 0x-кошелёк / email)" };
    const capabilityKey = String(body.capabilityKey || "");
    if (!CAPABILITY_REGISTRY.some((c) => c.key === capabilityKey)) return { ok: false, error: "Неизвестная capability" };
    let validUntil: Date | null = null;
    if (body.validUntil) {
      const d = new Date(body.validUntil);
      if (!Number.isNaN(d.getTime())) validUntil = d;
    }
    const created = await this.entitlementModel.create({
      userId: new Types.ObjectId(String(user._id)),
      capabilityKey,
      sourceType: "ADMIN_GRANT",
      validFrom: new Date(),
      validUntil,
      status: "ACTIVE",
      reason: String(body.reason || ""),
      grantedBy: actorOf(req),
    });
    return { ok: true, id: String(created._id), capabilityKey, userId: String(user._id) };
  }

  @Post("grants/:id/revoke")
  async revokeGrant(@Param("id") id: string) {
    await this.entitlementModel.updateOne({ _id: new Types.ObjectId(id) }, { $set: { status: "REVOKED", revokedAt: new Date() } });
    return { ok: true };
  }

  /** List manual capability grants (ADMIN_GRANT) with user info for the Доступы tab. */
  @Get("grants")
  async listGrants() {
    const rows = await this.entitlementModel
      .find({ sourceType: { $in: ["ADMIN_GRANT", "PROMO"] } })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    const userIds = Array.from(new Set(rows.map((r: any) => String(r.userId))));
    const users = await this.entitlementModel.db
      .collection("users")
      .find({ _id: { $in: userIds.map((u) => new Types.ObjectId(u)) } })
      .project({ email: 1, wallet: 1 })
      .toArray();
    const byId: any = {};
    users.forEach((u: any) => (byId[String(u._id)] = u));
    return {
      items: rows.map((r: any) => ({
        _id: String(r._id),
        userId: String(r.userId),
        email: byId[String(r.userId)]?.email || "",
        wallet: byId[String(r.userId)]?.wallet || "",
        capabilityKey: r.capabilityKey,
        sourceType: r.sourceType,
        validFrom: r.validFrom,
        validUntil: r.validUntil,
        status: r.status,
        reason: r.reason,
        grantedBy: r.grantedBy,
      })),
      total: rows.length,
    };
  }

  // ---------- Subscriptions ----------
  @Get("subscriptions")
  async subscriptions(@Query("status") status?: string) {
    const q: any = {};
    if (status) q.status = status.toUpperCase();
    const rows = await this.subscriptionModel.find(q).sort({ createdAt: -1 }).limit(500).lean();
    return { items: rows, total: rows.length };
  }

  @Post("subscriptions")
  async createSub(@Body() body: { user?: string; planCode?: string; planId?: string; source?: string; activate?: boolean }, @Req() req: Request) {
    const user = await this.findUser(String(body.user || ""));
    if (!user) return { ok: false, error: "Пользователь не найден" };
    let sub = await this.subs.create({
      userId: String(user._id),
      planCode: body.planCode,
      planId: body.planId,
      source: body.source || "ADMIN_GRANT",
      originWallet: user.wallet || "",
      createdBy: actorOf(req),
    });
    if (body.activate !== false) sub = await this.subs.activate(String(sub._id));
    return { ok: true, subscription: sub };
  }

  @Post("subscriptions/:id/activate")
  async activateSub(@Param("id") id: string) {
    return { ok: true, subscription: await this.subs.activate(id) };
  }
  @Post("subscriptions/:id/extend")
  async extendSub(@Param("id") id: string, @Body() body: { days?: number }) {
    return { ok: true, subscription: await this.subs.extend(id, Number(body.days) || 30) };
  }
  @Post("subscriptions/:id/cancel")
  async cancelSub(@Param("id") id: string) {
    return { ok: true, subscription: await this.subs.cancel(id) };
  }
  @Post("subscriptions/:id/revoke")
  async revokeSub(@Param("id") id: string) {
    return { ok: true, subscription: await this.subs.revoke(id) };
  }
  @Post("subscriptions/:id/expire")
  async expireSub(@Param("id") id: string) {
    return { ok: true, subscription: await this.subs.expire(id) };
  }
  @Post("subscriptions/run-expiry")
  async runExpiry() {
    return { ok: true, result: await this.subs.runExpiryReconciliation() };
  }

  // ---------- AI Credits ----------
  @Get("credits/rules")
  async creditRules() {
    const items = await this.credits.listRules();
    return { items, total: items.length };
  }
  @Get("credits/balance")
  async creditBalance(@Query("userId") userId: string) {
    return this.credits.getBalances(userId);
  }
  @Post("credits/adjust")
  async creditAdjust(@Body() body: { user?: string; delta?: number; reason?: string }, @Req() req: Request) {
    const user = await this.findUser(String(body.user || ""));
    if (!user) return { ok: false, error: "Пользователь не найден" };
    const r = await this.credits.adminAdjust(String(user._id), Number(body.delta) || 0, String(body.reason || ""), actorOf(req));
    return { ok: true, tx: r.tx };
  }
  @Post("credits/topup")
  async creditTopup(@Body() body: { user?: string; amount?: number; idempotencyKey?: string }) {
    const user = await this.findUser(String(body.user || ""));
    if (!user) return { ok: false, error: "Пользователь не найден" };
    const r = await this.credits.topUp(String(user._id), Number(body.amount) || 0, body.idempotencyKey);
    return { ok: true, duplicate: r.duplicate, tx: r.tx };
  }
  // test/diagnostic reserve+capture (real AI pipeline connects later)
  @Post("credits/reserve")
  async creditReserve(@Body() body: { userId?: string; operationType?: string; credits?: number; idempotencyKey?: string }) {
    const est = typeof body.credits === "number" ? body.credits : await this.credits.ruleCost(String(body.operationType || "ask_fomo"));
    const r = await this.credits.reserve(String(body.userId), String(body.operationType || "ask_fomo"), est, body.idempotencyKey);
    return { ok: true, duplicate: r.duplicate, reservation: r.reservation, estimated: est };
  }
  @Post("credits/reservations/:id/capture")
  async creditCapture(@Param("id") id: string, @Body() body: { actual?: number }) {
    return { ok: true, ...(await this.credits.capture(id, typeof body.actual === "number" ? body.actual : undefined, { dataMode: "mock" } as any)) };
  }
  @Post("credits/reservations/:id/release")
  async creditRelease(@Param("id") id: string) {
    return { ok: true, ...(await this.credits.release(id)) };
  }

  // ---------- AI Provider Pricing (P5) ----------
  @Get("ai/pricing")
  async aiPricing() {
    const items = await this.providerPricing.listPrices();
    return { items, total: items.length };
  }
  @Post("ai/pricing")
  async aiPricingUpsert(@Body() body: any, @Req() req: Request) {
    return { ok: true, price: await this.providerPricing.upsertPrice(body || {}, actorOf(req)) };
  }
  @Post("ai/pricing/:id/active")
  async aiPricingActive(@Param("id") id: string, @Body() body: { active?: boolean }) {
    return this.providerPricing.setPriceActive(id, body?.active !== false);
  }
  @Get("ai/settings")
  async aiSettings() {
    return this.providerPricing.getSettings();
  }
  @Post("ai/settings")
  async aiSettingsUpdate(@Body() body: any, @Req() req: Request) {
    return this.providerPricing.updateSettings(body || {}, actorOf(req));
  }

  // Live connectivity probe for the active provider ("Проверить ключ" button).
  // Unbilled: no ledger movement, no usage event. Returns real status.
  @Post("ai/settings/test")
  async aiSettingsTest(@Body() body: any) {
    return this.gateway.testConnection(body?.model ? String(body.model) : undefined);
  }

  // ---------- Unit-economics: product budget + simulator (spec §7-11, §53-56) ----------
  @Get("ai/economics")
  async aiEconomics() {
    const econ = await this.creditPricing.getEconomics();
    const budget = this.creditPricing.deriveBudget(econ);
    const opAvgCosts = await this.analytics.observedOpAvgCosts();
    return { economics: econ, budget, opAvgCosts };
  }

  @Post("ai/economics/simulate")
  async aiEconomicsSimulate(@Body() body: any) {
    const econ = await this.creditPricing.getEconomics();
    const input = {
      priceUsd: body?.priceUsd ?? econ.priceUsd,
      periodDays: body?.periodDays ?? econ.periodDays,
      includedCredits: body?.includedCredits ?? econ.includedCredits,
      targetGrossMarginPct: body?.targetGrossMarginPct ?? econ.targetGrossMarginPct,
      paymentFeeReservePct: body?.paymentFeeReservePct ?? econ.paymentFeeReservePct,
      infraReservePct: body?.infraReservePct ?? econ.infraReservePct,
      creditSafetyFactor: body?.creditSafetyFactor ?? econ.creditSafetyFactor,
      expectedUtilizationPct: body?.expectedUtilizationPct ?? 0.7,
    };
    const opAvgCosts = await this.analytics.observedOpAvgCosts();
    return this.creditPricing.simulate(input, opAvgCosts);
  }

  // ---------- Economics Dashboard read-model (Phase B / P7-P10) ----------
  @Get("ai/economics/dashboard")
  async aiEconomicsDashboard(@Query("days") days?: string) {
    return this.analytics.dashboard(Math.min(Number(days) || 30, 365));
  }

  @Get("ai/analytics/operations")
  async aiOperationAnalytics(@Query("days") days?: string) {
    const items = await this.analytics.operationAnalytics(Math.min(Number(days) || 30, 365));
    return { items, total: items.length };
  }

  @Get("ai/analytics/providers")
  async aiProviderAnalytics(@Query("days") days?: string) {
    const items = await this.analytics.providerAnalytics(Math.min(Number(days) || 30, 365));
    return { items, total: items.length };
  }

  // ---------- Users Analytics table (Phase C / P15) ----------
  @Get("ai/users")
  async aiUsers(@Query("limit") limit?: string) {
    return this.analytics.usersList(Math.min(Number(limit) || 100, 500));
  }

  // ---------- Credit expiry worker (Phase A / P3) ----------
  @Post("ai/credits/run-expiry")
  async runCreditExpiry() {
    const result = await this.subs.runExpiryReconciliation();
    const lifecycle = await this.credits.lifecycleTotals();
    return { ok: true, result, lifecycle };
  }

  // ---------- AI Health / provider statuses (Phase E / P27, P45) ----------
  @Get("ai/health")
  async aiHealth() {
    const conn = await this.gateway.testConnection().catch((e: any) => ({ ok: false, message: String(e?.message || e) } as any));
    const providerStatus = this.deriveProviderStatus(conn);
    let knowledgeOk = false;
    try {
      const h = await this.knowledge.health();
      knowledgeOk = h.some((s: any) => s.connected && s.count > 0);
    } catch { knowledgeOk = false; }
    let ledgerOk = true;
    try { await this.credits.lifecycleTotals(); } catch { ledgerOk = false; }
    return {
      ai: {
        gateway: "ok",
        provider: conn.mode || "unknown",
        providerStatus,
        providerMessage: conn.message,
        knowledge: knowledgeOk ? "ok" : "degraded",
        creditLedger: ledgerOk ? "ok" : "down",
      },
    };
  }

  private deriveProviderStatus(conn: any): string {
    if (!conn) return "UNREACHABLE";
    if (conn.mode === "mock") return "DISABLED";
    if (conn.ok) return "READY";
    if (conn.reason === "no_key") return "CREDENTIALS_MISSING";
    if (conn.status === 429) return "PROVIDER_BALANCE_EMPTY";
    if (conn.status === 401 || conn.status === 403) return "CREDENTIALS_MISSING";
    return "UNREACHABLE";
  }

  @Get("ai/providers/status")
  async aiProvidersStatus() {
    const settings = await this.providerPricing.getSettings();
    const active = String(settings.activeProvider || "openai");
    const conn = await this.gateway.testConnection().catch(() => null);
    const activeStatus = this.deriveProviderStatus(conn);
    const providers = [
      {
        key: "emergent",
        name: "Emergent LLM",
        configured: !!settings.emergentConfigured,
        active: active === "emergent",
        status: active === "emergent" ? activeStatus : settings.emergentConfigured ? "READY" : "CREDENTIALS_MISSING",
      },
      {
        key: "openai",
        name: "OpenAI",
        configured: !!settings.openAiConfigured,
        active: active === "openai",
        status: active === "openai" ? activeStatus : settings.openAiConfigured ? "READY" : "CREDENTIALS_MISSING",
      },
      { key: "mock", name: "Mock", configured: true, active: active === "mock", status: active === "mock" ? "DISABLED" : "DISABLED" },
    ];
    return { activeProvider: active, connection: conn, providers };
  }

  // ---------- Knowledge Registry (Phase D / P17-P19) ----------
  @Get("ai/knowledge/registry")
  async knowledgeRegistry() {
    const items = await this.knowledge.health();
    const mapFreshness = (s: any): string => {
      if (!s.connected) return "NOT_CONNECTED";
      if (s.count === 0) return "EMPTY";
      if (s.freshness?.status === "fresh") return "FRESH";
      if (s.freshness?.status === "stale") return "STALE";
      return "UNKNOWN";
    };
    const rows = items.map((s: any) => ({
      key: s.domain,
      name: s.domain,
      source: s.source,
      connected: s.connected,
      recordsCount: s.count,
      lastObservedAt: s.freshness?.updatedAt || null,
      freshnessStatus: mapFreshness(s),
      lastError: s.status === "error" ? s.note || "error" : null,
      requests24h: s.requests24h,
      errors: s.errors,
      avgLatencyMs: s.avgLatencyMs,
      public: s.public,
    }));
    return { items: rows, connected: rows.filter((r) => r.connected).length, total: rows.length };
  }

  // ---------- Provider Credentials Manager (Phase F / P51-P55) ----------
  private async writeAudit(entry: any) {
    try { await this.conn.collection("ai_admin_audit").insertOne({ ...entry, at: new Date() }); } catch { /* audit best-effort */ }
  }

  @Get("ai/provider-credentials")
  async listCredentials() {
    return this.credentials.list();
  }

  @Post("ai/provider-credentials")
  async createCredential(@Body() body: any, @Req() req: Request) {
    const r = await this.credentials.create(body || {}, actorOf(req));
    await this.writeAudit(r.audit);
    return { ok: true, credential: r.credential };
  }

  @Patch("ai/provider-credentials/:id")
  async patchCredential(@Param("id") id: string, @Body() body: any, @Req() req: Request) {
    const r = await this.credentials.patch(id, body || {}, actorOf(req));
    await this.writeAudit(r.audit);
    return { ok: true, rotated: r.rotated, credential: r.credential };
  }

  @Delete("ai/provider-credentials/:id")
  async deleteCredential(@Param("id") id: string, @Req() req: Request) {
    const r = await this.credentials.remove(id, actorOf(req));
    await this.writeAudit(r.audit);
    return r;
  }

  @Post("ai/provider-credentials/migrate-env")
  async migrateEnvCredentials(@Req() req: Request) {
    const r = await this.credentials.migrateFromEnv(actorOf(req));
    await this.writeAudit(r.audit);
    return r;
  }

  @Post("ai/provider-credentials/:id/test")
  async testCredential(@Param("id") id: string) {
    return this.credentials.test(id);
  }

  @Post("ai/provider-credentials/:id/activate")
  async activateCredential(@Param("id") id: string, @Req() req: Request) {
    const r = await this.credentials.activate(id, actorOf(req));
    await this.writeAudit(r.audit);
    return { ok: true };
  }

  @Post("ai/provider-credentials/:id/deactivate")
  async deactivateCredential(@Param("id") id: string, @Req() req: Request) {
    const r = await this.credentials.deactivate(id, actorOf(req));
    await this.writeAudit(r.audit);
    return { ok: true };
  }

  // ---------- Per-user AI economics (Phase F / P58-P66) ----------
  @Get("ai/users/:userId/economics")
  async aiUserEconomics(@Param("userId") userId: string) {
    return this.analytics.userEconomics(userId);
  }

  // ---------- FOMO AI Gateway (P2) — execute / estimate ----------
  @Post("ai/gateway/execute")
  async gatewayExecute(@Body() body: any) {
    // Admin diagnostic execution. Resolves the target user; billingContext from body.
    const user = body?.userId ? await this.findUser(String(body.userId)) : null;
    const userId = user ? String(user._id) : String(body?.userId || "");
    return this.gateway.execute({
      userId,
      operation: String(body?.operation || "ask_fomo"),
      input: body?.input || "Diagnostic ping from admin.",
      capability: body?.capability,
      billingContext: body?.billingContext || "USER",
      mode: body?.mode || "CHAT",
      jsonSchema: body?.jsonSchema,
      idempotencyKey: body?.idempotencyKey,
      system: body?.system,
      forceMock: body?.forceMock === true,
    });
  }
  @Get("ai/gateway/estimate")
  async gatewayEstimate(@Query("userId") userId: string, @Query("operation") operation: string) {
    const user = userId ? await this.findUser(userId) : null;
    return this.gateway.estimateOnly({ userId: user ? String(user._id) : String(userId || ""), operation: operation || "ask_fomo" });
  }

  // ---------- FOMO Knowledge Layer (P10-P12) ----------
  @Get("ai/knowledge/health")
  async knowledgeHealth() {
    const items = await this.fomoAi.knowledgeHealth();
    return { items, connected: items.filter((i) => i.connected).length, total: items.length };
  }

  @Post("ai/knowledge/test")
  async knowledgeTest(@Body() body: { domain?: string; query?: string }) {
    return this.fomoAi.testSource(String(body?.domain || "projects"), String(body?.query || ""), { isAdmin: true });
  }

  // Grounded FOMO AI answer (admin diagnostic; USER billing against target user).
  @Post("ai/ask")
  async aiAsk(@Body() body: any) {
    const user = body?.userId ? await this.findUser(String(body.userId)) : null;
    return this.fomoAi.ask({
      userId: user ? String(user._id) : String(body?.userId || ""),
      operation: String(body?.operation || "ask_fomo"),
      query: String(body?.query || "What early crypto opportunities does FOMO track?"),
      capability: body?.capability,
      idempotencyKey: body?.idempotencyKey,
      billingContext: body?.billingContext || "USER",
      isAdmin: true,
    });
  }

  // ---------- AI Usage + Economics dashboards (P8/P9) ----------
  @Get("ai/usage")
  async aiUsage(@Query("userId") userId?: string, @Query("limit") limit?: string) {
    const q: any = {};
    if (userId) {
      const user = await this.findUser(userId);
      if (user) q.userId = new Types.ObjectId(String(user._id));
    }
    const items = await this.usageModel.find(q).sort({ createdAt: -1 }).limit(Math.min(Number(limit) || 100, 500)).lean();
    return { items, total: items.length };
  }

  @Get("ai/usage/summary")
  async aiUsageSummary(@Query("days") days?: string) {
    const since = new Date(Date.now() - (Number(days) || 30) * 86400_000);
    // Only COMPLETED events; real and mock reported separately (never mixed).
    const agg = await this.usageModel.aggregate([
      { $match: { status: "COMPLETED", createdAt: { $gte: since } } },
      {
        $group: {
          _id: { dataMode: "$dataMode", billingContext: "$billingContext" },
          requests: { $sum: 1 },
          users: { $addToSet: "$userId" },
          inputTokens: { $sum: "$inputTokens" },
          outputTokens: { $sum: "$outputTokens" },
          creditsCaptured: { $sum: "$creditsCaptured" },
          providerCostUsd: { $sum: "$providerCostUsd" },
          totalCostUsd: { $sum: "$totalCostUsd" },
          avgLatencyMs: { $avg: "$latencyMs" },
        },
      },
    ]);
    const buckets = agg.map((a: any) => ({
      dataMode: a._id.dataMode,
      billingContext: a._id.billingContext,
      requests: a.requests,
      uniqueUsers: (a.users || []).length,
      inputTokens: a.inputTokens,
      outputTokens: a.outputTokens,
      creditsCaptured: a.creditsCaptured,
      providerCostUsd: Math.round((a.providerCostUsd || 0) * 1e6) / 1e6,
      totalCostUsd: Math.round((a.totalCostUsd || 0) * 1e6) / 1e6,
      avgCreditsPerRequest: a.requests ? Math.round((a.creditsCaptured / a.requests) * 100) / 100 : 0,
      avgLatencyMs: Math.round(a.avgLatencyMs || 0),
    }));
    const real = buckets.filter((b) => b.dataMode === "real");
    const realProviderCost = real.reduce((s, b) => s + b.providerCostUsd, 0);
    const realUserCredits = real.filter((b) => b.billingContext === "USER").reduce((s, b) => s + b.creditsCaptured, 0);
    return {
      sinceDays: Number(days) || 30,
      buckets,
      real: {
        note: "Real revenue appears only after real checkout. Below is provider COGS from real requests.",
        providerCogsUsd: Math.round(realProviderCost * 1e6) / 1e6,
        userCreditsCaptured: realUserCredits,
      },
      hasRealData: real.length > 0,
    };
  }

  // Per-user AI analytics for Customer 360 (P9)
  @Get("ai/user-analytics")
  async aiUserAnalytics(@Query("userId") userId: string) {
    const user = await this.findUser(userId);
    if (!user) return { ok: false, error: "Пользователь не найден" };
    const uid = new Types.ObjectId(String(user._id));
    const since = new Date(Date.now() - 30 * 86400_000);
    const [balances, usageAgg, topOp, ledger] = await Promise.all([
      this.credits.getBalances(String(user._id)),
      this.usageModel.aggregate([
        { $match: { userId: uid, status: "COMPLETED", createdAt: { $gte: since } } },
        { $group: { _id: null, requests: { $sum: 1 }, providerCostUsd: { $sum: "$providerCostUsd" }, creditsCaptured: { $sum: "$creditsCaptured" }, lastAt: { $max: "$createdAt" } } },
      ]),
      this.usageModel.aggregate([
        { $match: { userId: uid, status: "COMPLETED" } },
        { $group: { _id: "$operationType", c: { $sum: 1 } } },
        { $sort: { c: -1 } },
        { $limit: 1 },
      ]),
      this.txModel.find({ userId: uid }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);
    const u = usageAgg[0] || {};
    const sub: any = await this.subscriptionModel
      .findOne({ userId: uid, status: { $in: ["ACTIVE", "GRACE_PERIOD"] } })
      .sort({ currentPeriodEnd: -1 })
      .lean();
    // Phase C (P16): lifecycle + top operations list for the Customer 360 AI section.
    const [lifecycle, topOps] = await Promise.all([
      this.credits.userLifecycle(String(user._id)).catch(() => null),
      this.usageModel.aggregate([
        { $match: { userId: uid, status: "COMPLETED", createdAt: { $gte: since } } },
        { $group: { _id: "$operationType", count: { $sum: 1 }, credits: { $sum: "$creditsCaptured" }, cogsUsd: { $sum: "$providerCostUsd" } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
    ]);
    return {
      ok: true,
      userId: String(user._id),
      wallet: user.wallet || "",
      email: user.email || "",
      subscription: sub
        ? {
            plan: sub.planSnapshot?.name || sub.planSnapshot?.code || "—",
            planCode: sub.planSnapshot?.code || "",
            status: sub.status,
            periodStart: sub.currentPeriodStart || null,
            periodEnd: sub.currentPeriodEnd || null,
            priceUsd: sub.planSnapshot?.priceUsd ?? null,
            aiCreditsIncluded: sub.planSnapshot?.aiCreditsIncluded ?? null,
            source: sub.source || "",
            economicsSnapshot: sub.economicsSnapshot || null,
          }
        : null,
      balances,
      lifecycle: lifecycle
        ? {
            grantedMonthly: lifecycle.grantedMonthly,
            capturedMonthly: lifecycle.capturedMonthly,
            expiredUnused: lifecycle.expiredUnused,
            utilizationPct: lifecycle.utilizationPct,
            expiresAt: lifecycle.expiresAt,
            expiring7dCredits: lifecycle.expiring7dCredits,
            expiring30dCredits: lifecycle.expiring30dCredits,
          }
        : null,
      ai: {
        requests30d: u.requests || 0,
        providerCostGeneratedUsd: Math.round((u.providerCostUsd || 0) * 1e6) / 1e6,
        creditsSpent30d: u.creditsCaptured || 0,
        avgCostPerRequestUsd: u.requests ? Math.round((u.providerCostUsd / u.requests) * 1e6) / 1e6 : 0,
        lastRequestAt: u.lastAt || null,
        topOperation: topOp[0]?._id || null,
        topOperations: (topOps || []).map((t: any) => ({ operation: t._id, count: t.count, credits: t.credits, cogsUsd: Math.round((t.cogsUsd || 0) * 1e6) / 1e6 })),
      },
      ledger,
    };
  }

  private async findUser(raw: string): Promise<any | null> {
    const value = String(raw || "").trim();
    if (!value) return null;
    const users = this.entitlementModel.db.collection("users");
    if (isValidObjectId(value)) return users.findOne({ _id: new Types.ObjectId(value) });
    if (value.startsWith("0x")) return users.findOne({ wallet: value.toLowerCase() });
    if (value.includes("@")) return users.findOne({ email: value.toLowerCase() });
    return users.findOne({ username: value });
  }
}
