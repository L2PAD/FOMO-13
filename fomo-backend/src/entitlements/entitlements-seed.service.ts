import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Capability } from "./models/capability.model";
import { Plan } from "./models/plan.model";
import { Entitlement } from "./models/entitlement.model";
import { AiCreditRule } from "./models/ai-credit.model";
import { AiProviderPrice, AiGlobalSettings } from "./models/ai-provider-price.model";
import { CAPABILITY_REGISTRY, accessTypeOf, CAPABILITY_ELIGIBILITY_PROVIDER } from "./entitlements.constants";

/** Seeds capability registry + 3 demo AI plans + AI credit rules + AI provider
 *  pricing, and migrates legacy EarlyLand grants -> canonical Entitlements (B2).
 *  Idempotent. */
@Injectable()
export class EntitlementsSeedService implements OnModuleInit {
  private readonly logger = new Logger("EntitlementsSeed");

  constructor(
    @InjectModel(Capability.name) private readonly capabilityModel: Model<any>,
    @InjectModel(Plan.name) private readonly planModel: Model<any>,
    @InjectModel(Entitlement.name) private readonly entModel: Model<any>,
    @InjectModel(AiCreditRule.name) private readonly ruleModel: Model<any>,
    @InjectModel(AiProviderPrice.name) private readonly priceModel: Model<any>,
    @InjectModel(AiGlobalSettings.name) private readonly settingsModel: Model<any>,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureAiIndexes();
      await this.seedCapabilities();
      await this.seedPlans();
      await this.seedCreditRules();
      await this.seedProviderPricing();
      await this.seedAiSettings();
      await this.migrateLegacyEarlylandGrants();
    } catch (e: any) {
      this.logger.warn(`seed/migration skipped: ${e?.message || e}`);
    }
  }

  /**
   * autoIndex is disabled in this environment (DB_AUTO_INDEX!=='true'), so the
   * financial-critical unique indexes must be created explicitly. Ironclad
   * idempotency (P8) depends on the ai_usage_events unique index. If legacy
   * duplicates exist we dedupe (keep the earliest) before building the index.
   */
  private async ensureAiIndexes() {
    const colls = ["ai_usage_events", "ai_credit_transactions", "ai_credit_reservations"];
    const field = "idempotencyKey";
    for (const collName of colls) {
      const coll = this.entModel.db.collection(collName);
      // Drop any legacy sparse/plain index on the field so we can (re)build the
      // correct PARTIAL unique index (unique only when key is a string).
      try {
        const idx = await coll.indexes();
        for (const i of idx) {
          if (i.name !== "_id_" && i.key && i.key[field] !== undefined && !i.partialFilterExpression) {
            await coll.dropIndex(i.name).catch(() => undefined);
          }
        }
      } catch {
        /* collection may not exist yet */
      }
      const build = async () =>
        coll.createIndex(
          { [field]: 1 },
          { unique: true, partialFilterExpression: { [field]: { $type: "string" } } },
        );
      try {
        await build();
      } catch (e: any) {
        // De-dupe existing string keys (keep earliest) then retry.
        const dups = await coll
          .aggregate([
            { $match: { [field]: { $type: "string" } } },
            { $group: { _id: `$${field}`, ids: { $push: "$_id" }, n: { $sum: 1 } } },
            { $match: { n: { $gt: 1 } } },
          ])
          .toArray();
        let removed = 0;
        for (const d of dups) {
          const ids = (d.ids as any[]).sort((a, b) => String(a).localeCompare(String(b))).slice(1);
          if (ids.length) {
            await coll.deleteMany({ _id: { $in: ids } });
            removed += ids.length;
          }
        }
        if (removed) this.logger.warn(`${collName}: removed ${removed} duplicate ${field} docs before indexing`);
        await build().catch((e2: any) => this.logger.warn(`${collName} index ensure failed: ${e2?.message || e2}`));
      }
    }
    this.logger.log("AI critical unique (partial) indexes ensured");
  }

  private async seedCapabilities() {
    for (const c of CAPABILITY_REGISTRY) {
      await this.capabilityModel.updateOne(
        { key: c.key },
        {
          $set: {
            name: c.name,
            domain: c.domain,
            description: c.description || "",
            system: true,
            accessType: accessTypeOf(c.key),
            eligibilityProvider: CAPABILITY_ELIGIBILITY_PROVIDER[c.key] || "",
          },
          $setOnInsert: { active: true },
        },
        { upsert: true },
      );
    }
    this.logger.log(`capabilities ensured: ${CAPABILITY_REGISTRY.length}`);
  }

  private async seedPlans() {
    const common = { status: "ACTIVE", billingPeriod: "MONTH", durationDays: 30, version: 1, creditRollover: "NONE" };
    const plans = [
      {
        code: "FOMO_AI_STARTER",
        name: "FOMO AI Starter",
        description: "DEMO (test starter values). Base AI, Prime, basic Parsing.",
        priceUsd: 19,
        aiCreditsIncluded: 300,
        sortOrder: 1,
        capabilities: [
          { capabilityKey: "fomo_ai.access" },
          { capabilityKey: "earlyland.prime" },
          { capabilityKey: "parsing.access" },
          { capabilityKey: "xrank.access" },
        ],
      },
      {
        code: "FOMO_AI_PRO",
        name: "FOMO AI Pro",
        description: "DEMO (test starter values). More credits, full Parsing/XRank, portfolio.",
        priceUsd: 49,
        aiCreditsIncluded: 1000,
        sortOrder: 2,
        featured: true,
        capabilities: [
          { capabilityKey: "fomo_ai.access" },
          { capabilityKey: "fomo_ai.portfolio_analysis" },
          { capabilityKey: "earlyland.prime" },
          { capabilityKey: "parsing.access" },
          { capabilityKey: "parsing.advanced" },
          { capabilityKey: "xrank.access" },
        ],
      },
      {
        code: "FOMO_AI_RESEARCH",
        name: "FOMO AI Research",
        description: "DEMO (test starter values). Large credit pool, deep research.",
        priceUsd: 149,
        aiCreditsIncluded: 4000,
        sortOrder: 3,
        capabilities: [
          { capabilityKey: "fomo_ai.access" },
          { capabilityKey: "fomo_ai.deep_research" },
          { capabilityKey: "fomo_ai.portfolio_analysis" },
          { capabilityKey: "earlyland.prime" },
          { capabilityKey: "parsing.access" },
          { capabilityKey: "parsing.advanced" },
          { capabilityKey: "xrank.access" },
          { capabilityKey: "blockcore.access" },
        ],
      },
    ];
    for (const p of plans) {
      // only $setOnInsert dynamic pricing/caps so admin edits + version bumps persist
      await this.planModel.updateOne(
        { code: p.code },
        { $setOnInsert: { ...p, ...common, isDemo: true } },
        { upsert: true },
      );
    }

    // ---- Phase F.1: TWO independent commercial products ----
    // 1) FOMO AI — credit economy. 2) FOMO Intel — access-only (no credits),
    // external product (billing boundary). NO Starter/Pro/Research tiers.
    const fomoAiCheckout = { enabled: false, methods: ["CRYPTO"], acceptedAssets: ["USDT", "USDC"], networks: ["ETHEREUM", "BSC", "ARBITRUM"], settlementCurrency: "USD", priceUsd: 49 };
    const fomoAi = {
      code: "FOMO_AI_MEMBERSHIP",
      name: "FOMO AI",
      subtitle: "AI research & crypto intelligence",
      slug: "fomo-ai",
      description: "DEMO price (configurable). An AI product on top of all FOMO Data: chat, project/fund/person analysis, Market Brief, Compare, Deep Research, Portfolio. Includes AI credits.",
      productType: "FOMO_AI",
      priceUsd: 49,
      aiCredits: 1000,
      aiCreditsIncluded: 1000,
      sortOrder: 0,
      featured: true,
      recommended: true,
      purchasable: true,
      visible: true,
      capabilities: [
        { capabilityKey: "fomo_ai.access" },
        { capabilityKey: "fomo_ai.portfolio_analysis" },
        { capabilityKey: "fomo_ai.deep_research" },
        { capabilityKey: "earlyland.prime" },
        { capabilityKey: "parsing.access" },
        { capabilityKey: "parsing.advanced" },
        { capabilityKey: "xrank.access" },
      ],
      offerItems: [
        { title: "FOMO AI Chat & Ask FOMO", description: "Grounded answers across all FOMO data", icon: "sparkles", active: true, sortOrder: 1, linkedCapability: "fomo_ai.access" },
        { title: "Project / Fund / Person analysis", description: "Analyze, Compare, Market Brief", icon: "trending-up", active: true, sortOrder: 2, linkedCapability: "fomo_ai.access" },
        { title: "Deep Research & Portfolio", description: "Broad multi-source research", icon: "microscope", active: true, sortOrder: 3, linkedCapability: "fomo_ai.deep_research" },
        { title: "EarlyLand Prime", description: "Prime activities access", icon: "crown", active: true, sortOrder: 4, linkedCapability: "earlyland.prime" },
        { title: "Advanced Parsing & XRank", description: "Premium X analytics", icon: "radar", active: true, sortOrder: 5, linkedCapability: "xrank.access" },
        { title: "1000 AI credits / period", description: "Operations are credit-priced", icon: "coins", active: true, sortOrder: 6 },
      ],
      checkoutConfig: fomoAiCheckout,
      externalProductConfig: null,
    };
    const fomoIntel = {
      code: "FOMO_INTEL_SUB",
      name: "FOMO Intel",
      subtitle: "Trading intelligence platform",
      slug: "fomo-intel",
      description: "A standalone product: trading intelligence, forecasting, sentiment, on-chain/exchange analytics, market signals. Subscription access, WITHOUT AI credits.",
      productType: "FOMO_INTEL",
      priceUsd: 79,
      aiCredits: null,
      aiCreditsIncluded: 0,
      sortOrder: 1,
      featured: true,
      recommended: false,
      purchasable: true,
      visible: true,
      allowNftActivation: false,
      capabilities: [{ capabilityKey: "fomo_intel.access" }],
      offerItems: [
        { title: "Trading intelligence", description: "Real-time trading signals & analytics", icon: "activity", active: true, sortOrder: 1, linkedCapability: "fomo_intel.access" },
        { title: "Prediction & sentiment", description: "Forecasting and sentiment models", icon: "brain", active: true, sortOrder: 2 },
        { title: "On-chain & exchange analytics", description: "Deep market analytics", icon: "line-chart", active: true, sortOrder: 3 },
        { title: "No AI credit limits", description: "Access-based subscription", icon: "infinity", active: true, sortOrder: 4 },
      ],
      checkoutConfig: { enabled: false, methods: ["CRYPTO"], acceptedAssets: ["USDT", "USDC"], networks: ["ETHEREUM"], settlementCurrency: "USD", priceUsd: 79 },
      externalProductConfig: { url: process.env.FOMO_INTEL_URL || "https://intel.fomo.fund", ssoHandoff: false },
    };

    for (const prod of [fomoAi, fomoIntel]) {
      await this.planModel.updateOne(
        { code: prod.code },
        { $setOnInsert: { ...prod, ...common, status: "ACTIVE", isDemo: true } },
        { upsert: true },
      );
      // Backfill structural (product) fields on already-existing docs without
      // clobbering admin-edited marketing (offerItems/checkoutConfig only if empty).
      const existing = await this.planModel.findOne({ code: prod.code }).lean();
      const structural: any = { productType: prod.productType, aiCredits: prod.aiCredits, status: "ACTIVE" };
      if (existing && (existing.slug === undefined || existing.slug === "")) structural.slug = prod.slug;
      if (existing && (existing.subtitle === undefined || existing.subtitle === "")) structural.subtitle = prod.subtitle;
      if (existing && existing.purchasable === undefined) structural.purchasable = true;
      if (existing && existing.visible === undefined) structural.visible = true;
      if (existing && existing.recommended === undefined) structural.recommended = prod.recommended;
      if (existing && (!existing.offerItems || existing.offerItems.length === 0)) structural.offerItems = prod.offerItems;
      if (existing && (!existing.checkoutConfig || existing.checkoutConfig.enabled === undefined)) structural.checkoutConfig = prod.checkoutConfig;
      if (existing && existing.externalProductConfig === undefined) structural.externalProductConfig = prod.externalProductConfig;
      await this.planModel.updateOne({ code: prod.code }, { $set: structural });
    }

    // Deprecate the 3 artificial tiers — NOT sold anymore (keep docs + snapshots).
    await this.planModel.updateMany(
      { code: { $in: ["FOMO_AI_STARTER", "FOMO_AI_PRO", "FOMO_AI_RESEARCH"] } },
      { $set: { status: "ARCHIVED", featured: false, purchasable: false, visible: false, productType: "FOMO_AI" } },
    );

    this.logger.log(`plans ensured: 2 products (FOMO AI + FOMO Intel); ${plans.length} legacy tiers archived`);
  }

  private async seedCreditRules() {
    // pricingMode HYBRID by default: baseCredits + cost-based variable, clamped.
    const rules = [
      { operationType: "ask_fomo", name: "Ask FOMO", baseCredits: 1, fixedCredits: 1, capabilityRequired: "fomo_ai.access", billingContext: "USER", modelClass: "FAST", pricingMode: "HYBRID", targetMarkup: 2, safetyFactor: 1.2, minCredits: 1, maxCredits: 20, estInputTokens: 1200, estOutputTokens: 500 },
      { operationType: "token_analysis", name: "Token Analysis", baseCredits: 2, fixedCredits: 2, capabilityRequired: "fomo_ai.access", billingContext: "USER", modelClass: "STANDARD", pricingMode: "HYBRID", targetMarkup: 2, safetyFactor: 1.2, minCredits: 2, maxCredits: 30, estInputTokens: 2000, estOutputTokens: 900 },
      { operationType: "compare_projects", name: "Compare Projects", baseCredits: 4, fixedCredits: 4, capabilityRequired: "fomo_ai.access", billingContext: "USER", modelClass: "STANDARD", pricingMode: "HYBRID", targetMarkup: 2, safetyFactor: 1.2, minCredits: 3, maxCredits: 40, estInputTokens: 3000, estOutputTokens: 1200 },
      { operationType: "market_brief", name: "Market Brief", baseCredits: 4, fixedCredits: 4, capabilityRequired: "fomo_ai.access", billingContext: "USER", modelClass: "STANDARD", pricingMode: "HYBRID", targetMarkup: 2, safetyFactor: 1.2, minCredits: 3, maxCredits: 40, estInputTokens: 3000, estOutputTokens: 1200 },
      { operationType: "portfolio_analysis", name: "Portfolio Analysis", baseCredits: 8, fixedCredits: 8, capabilityRequired: "fomo_ai.portfolio_analysis", billingContext: "USER", modelClass: "REASONING", pricingMode: "HYBRID", targetMarkup: 2, safetyFactor: 1.25, minCredits: 5, maxCredits: 80, estInputTokens: 4000, estOutputTokens: 2000 },
      { operationType: "deep_research", name: "Deep Research", baseCredits: 10, fixedCredits: 10, capabilityRequired: "fomo_ai.deep_research", billingContext: "USER", modelClass: "DEEP_RESEARCH", pricingMode: "HYBRID", targetMarkup: 2, safetyFactor: 1.3, minCredits: 8, maxCredits: 150, estInputTokens: 8000, estOutputTokens: 4000 },
      // Internal admin operations: no user credits, but provider COGS is logged.
      { operationType: "activity_ai_review", name: "Activity AI Review (internal)", baseCredits: 0, fixedCredits: 0, capabilityRequired: "", billingContext: "INTERNAL", modelClass: "STANDARD", pricingMode: "COST_BASED", targetMarkup: 2, safetyFactor: 1.2, minCredits: 0, maxCredits: 0, estInputTokens: 3000, estOutputTokens: 1500 },
      { operationType: "admin_ai_chat", name: "Admin AI Chat (internal)", baseCredits: 0, fixedCredits: 0, capabilityRequired: "", billingContext: "INTERNAL", modelClass: "STANDARD", pricingMode: "COST_BASED", targetMarkup: 2, safetyFactor: 1.2, minCredits: 0, maxCredits: 0, estInputTokens: 4000, estOutputTokens: 1500 },
      { operationType: "buzz_post_summary", name: "Buzz Post Summary (internal)", baseCredits: 0, fixedCredits: 0, capabilityRequired: "", billingContext: "INTERNAL", modelClass: "FAST", pricingMode: "COST_BASED", targetMarkup: 2, safetyFactor: 1.2, minCredits: 0, maxCredits: 0, estInputTokens: 1500, estOutputTokens: 500 },
    ];
    for (const r of rules) {
      // Policy fields ($set) are upgraded on every boot; product credit values
      // (baseCredits/fixedCredits) are insert-only so admin edits persist.
      const { baseCredits, fixedCredits, ...policy } = r;
      await this.ruleModel.updateOne(
        { operationType: r.operationType },
        {
          $set: { ...policy, modelPolicy: {} },
          $setOnInsert: { baseCredits, fixedCredits, active: true, version: 1 },
        },
        { upsert: true },
      );
    }
    this.logger.log(`credit rules ensured: ${rules.length}`);
  }

  /** P5: seed OpenAI provider prices (USD per 1M tokens). SEED ESTIMATES —
   *  admin must verify against the current provider price list. Insert-only so
   *  admin edits + new price versions persist across boots. */
  private async seedProviderPricing() {
    const now = new Date();
    const prices = [
      { provider: "openai", model: "gpt-4.1-mini", inputPer1M: 0.4, outputPer1M: 1.6, cachedInputPer1M: 0.1, reasoningPer1M: null },
      { provider: "openai", model: "gpt-4.1", inputPer1M: 2.0, outputPer1M: 8.0, cachedInputPer1M: 0.5, reasoningPer1M: null },
      { provider: "openai", model: "gpt-5.5", inputPer1M: 1.25, outputPer1M: 10.0, cachedInputPer1M: 0.125, reasoningPer1M: 10.0 },
    ];
    let seeded = 0;
    for (const p of prices) {
      const res = await this.priceModel.updateOne(
        { provider: p.provider, model: p.model, effectiveTo: null },
        {
          $setOnInsert: {
            ...p,
            currency: "USD",
            effectiveFrom: now,
            effectiveTo: null,
            active: true,
            sourceNote: "SEED ESTIMATE — verify against current provider pricing",
            updatedBy: "seed",
          },
        },
        { upsert: true },
      );
      if ((res as any).upsertedCount) seeded++;
    }
    this.logger.log(`provider prices ensured: ${prices.length} (new: ${seeded})`);
  }

  private async seedAiSettings() {
    await this.settingsModel.updateOne(
      { key: "default" },
      { $setOnInsert: { key: "default", allowUnpricedModels: false, defaultRevenuePerCreditUsd: 0.049, infrastructureCostPerRequestUsd: 0 } },
      { upsert: true },
    );
  }

  /** B2: legacy earlyland_access_grants -> Entitlement(LEGACY_BACKEND_GRANT). */
  private async migrateLegacyEarlylandGrants() {
    const grants = await this.entModel.db
      .collection("earlyland_access_grants")
      .find({ revokedAt: null })
      .toArray();
    let migrated = 0;
    for (const g of grants) {
      // Preserve full provenance of the legacy grant so the migrated Entitlement
      // is a faithful historical record (issuer, issuedAt, label, original id).
      const res = await this.entModel.updateOne(
        { userId: g.userId, capabilityKey: "earlyland.prime", sourceType: "LEGACY_BACKEND_GRANT", sourceId: String(g._id) },
        {
          $set: {
            userId: g.userId,
            capabilityKey: "earlyland.prime",
            sourceType: "LEGACY_BACKEND_GRANT",
            sourceId: String(g._id),
            validFrom: g.grantedAt || g.createdAt || new Date(),
            validUntil: g.expiresAt || null,
            status: "ACTIVE",
            reason: g.reason || "migrated legacy earlyland grant",
            // original issuer preserved (was "migration" before — that erased provenance)
            grantedBy: g.grantedBy || "legacy-migration",
            revokedAt: null,
            metadata: {
              legacyLabel: g.userLabel || "",
              legacyGrantId: String(g._id),
              legacyGrantedBy: g.grantedBy || "",
              legacyGrantedAt: g.grantedAt || g.createdAt || null,
              migratedAt: new Date(),
              migratedFrom: "earlyland_access_grants",
            },
          },
        },
        { upsert: true },
      );
      if ((res as any).upsertedCount) migrated++;
    }
    if (grants.length) this.logger.log(`legacy earlyland grants migrated: ${migrated}/${grants.length}`);
  }
}
