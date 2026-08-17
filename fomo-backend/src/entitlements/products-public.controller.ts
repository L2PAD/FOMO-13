import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Plan } from "./models/plan.model";
import { Subscription } from "./models/subscription.model";
import { AccessResolverService } from "./access-resolver.service";
import { AiCreditsService } from "./ai-credits.service";
import { MEMBERSHIPS_PAGE_DEFAULT, MEMBERSHIPS_PAGE_KEY } from "./memberships-page.default";

/** Public product catalog + memberships. Phase F.1: exactly two purchasable
 *  products — FOMO AI (credits) and FOMO Intel (access-only). The website MUST
 *  render this backend config, never hardcoded JSX offer strings. */
@Controller("products")
export class ProductsPublicController {
  constructor(
    @InjectModel(Plan.name) private readonly planModel: Model<any>,
    @InjectModel(Subscription.name) private readonly subModel: Model<any>,
    @InjectConnection() private readonly conn: Connection,
    private readonly access: AccessResolverService,
    private readonly credits: AiCreditsService,
  ) {}

  /** Public: memberships selling-page content (admin-editable copy). */
  @Get("page/memberships")
  async membershipsPage() {
    const doc: any = await this.conn.collection("product_page_config").findOne({ key: MEMBERSHIPS_PAGE_KEY });
    const merged: any = { ...MEMBERSHIPS_PAGE_DEFAULT, ...(doc || {}) };
    delete merged._id;
    return merged;
  }

  private present(p: any) {
    return {
      code: p.code,
      productType: p.productType || "FOMO_AI",
      name: p.name,
      subtitle: p.subtitle || "",
      slug: p.slug || "",
      description: p.description || "",
      priceUsd: p.priceUsd || 0,
      durationDays: p.durationDays || 30,
      billingPeriod: p.billingPeriod || "MONTH",
      aiCredits: p.productType === "FOMO_INTEL" ? null : (p.aiCredits ?? p.aiCreditsIncluded ?? null),
      recommended: !!p.recommended,
      featured: !!p.featured,
      purchasable: p.purchasable !== false,
      offerItems: (p.offerItems || []).filter((o: any) => o.active !== false).sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0)),
      capabilities: (p.capabilities || []).map((c: any) => c.capabilityKey),
      checkout: {
        enabled: !!(p.checkoutConfig && p.checkoutConfig.enabled),
        status: p.checkoutConfig && p.checkoutConfig.enabled ? "CONNECTED" : "NOT_CONNECTED",
        methods: p.checkoutConfig?.methods || [],
        acceptedAssets: p.checkoutConfig?.acceptedAssets || [],
        networks: p.checkoutConfig?.networks || [],
      },
      externalUrl: p.externalProductConfig?.url || null,
    };
  }

  /** Public marketing catalog — two products, backend-driven. */
  @Get()
  async catalog() {
    const rows = await this.planModel
      .find({ status: "ACTIVE", visible: { $ne: false }, productType: { $in: ["FOMO_AI", "FOMO_INTEL"] } })
      .sort({ sortOrder: 1 })
      .lean();
    return { items: rows.map((r) => this.present(r)) };
  }

  /** The signed-in user's memberships across BOTH products. */
  @Get("my")
  @UseGuards(JwtAuthGuard)
  async my(@Req() req: Request) {
    const userId = String((req.user as any)?._id || "");
    const uoid = new Types.ObjectId(userId);
    const [plans, subs, aiDec, intelDec, balances] = await Promise.all([
      this.planModel.find({ status: "ACTIVE", productType: { $in: ["FOMO_AI", "FOMO_INTEL"] } }).sort({ sortOrder: 1 }).lean(),
      this.subModel.find({ userId: uoid, status: { $in: ["ACTIVE", "GRACE_PERIOD"] } }).sort({ currentPeriodEnd: -1 }).lean(),
      this.access.resolveAccess({ userId, capability: "fomo_ai.access" }),
      this.access.resolveAccess({ userId, capability: "fomo_intel.access" }),
      this.credits.getBalances(userId).catch(() => null),
    ]);

    const subByType = (t: string) => subs.find((s) => (s.productType || "FOMO_AI") === t);
    const build = (productType: string, allowed: boolean) => {
      const plan = plans.find((p) => (p.productType || "FOMO_AI") === productType);
      const sub = subByType(productType);
      return {
        productType,
        name: plan?.name || (productType === "FOMO_AI" ? "FOMO AI" : "FOMO Intel"),
        subtitle: plan?.subtitle || "",
        subscribed: !!sub || allowed,
        status: sub?.status || (allowed ? "ACTIVE" : "NONE"),
        currentPeriodEnd: sub?.currentPeriodEnd || null,
        priceUsd: plan?.priceUsd || 0,
        externalUrl: plan?.externalProductConfig?.url || null,
        credits: productType === "FOMO_AI" ? { available: balances?.available ?? 0, total: balances?.total ?? 0 } : null,
      };
    };

    return {
      fomoAi: build("FOMO_AI", !!aiDec.allowed),
      fomoIntel: build("FOMO_INTEL", !!intelDec.allowed),
    };
  }
}
