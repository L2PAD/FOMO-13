import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, isValidObjectId } from "mongoose";
import { Subscription } from "./models/subscription.model";
import { Plan } from "./models/plan.model";
import { Entitlement } from "./models/entitlement.model";
import { AiCreditsService } from "./ai-credits.service";
import { CreditPricingService } from "./ai/credit-pricing.service";
import { MEMBERSHIP_CAPABILITY_KEY } from "./entitlements.constants";

// Allowed status transitions (state machine). EXPIRED->ACTIVE is NOT allowed
// (that requires a new period/extension).
const TRANSITIONS: Record<string, string[]> = {
  PENDING: ["ACTIVE", "CANCELLED", "REVOKED"],
  ACTIVE: ["GRACE_PERIOD", "CANCELLED", "REVOKED", "EXPIRED"],
  GRACE_PERIOD: ["ACTIVE", "EXPIRED", "REVOKED"],
  CANCELLED: [],
  EXPIRED: [],
  REVOKED: [],
  REFUNDED: [],
};

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectModel(Subscription.name) private readonly subModel: Model<any>,
    @InjectModel(Plan.name) private readonly planModel: Model<any>,
    @InjectModel(Entitlement.name) private readonly entModel: Model<any>,
    private readonly credits: AiCreditsService,
    private readonly creditPricing: CreditPricingService,
  ) {}

  private oid(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException("invalid id");
    return new Types.ObjectId(id);
  }

  private assertTransition(from: string, to: string) {
    if (!(TRANSITIONS[from] || []).includes(to)) {
      throw new BadRequestException(`invalid transition ${from} -> ${to}`);
    }
  }

  private planSnapshot(plan: any) {
    return {
      code: plan.code,
      name: plan.name,
      version: plan.version,
      productType: plan.productType || "FOMO_AI",
      capabilities: plan.capabilities || [],
      aiCreditsIncluded: plan.aiCreditsIncluded || 0,
      aiCredits: plan.aiCredits === undefined ? null : plan.aiCredits,
      durationDays: plan.durationDays || 30,
      priceUsd: plan.priceUsd || 0,
      creditRollover: plan.creditRollover || "NONE",
      gracePeriodHours: plan.gracePeriodHours || 0,
    };
  }

  /** Credits belong to the FOMO AI product economy ONLY. FOMO Intel is
   *  access-only and never grants credits (Phase F.1 P3/P10). */
  private async grantAiCreditsIfApplicable(sub: any) {
    if ((sub.planSnapshot?.productType || "FOMO_AI") !== "FOMO_AI") return;
    const amount = sub.planSnapshot?.aiCredits ?? sub.planSnapshot?.aiCreditsIncluded ?? 0;
    if (!amount || amount <= 0) return;
    await this.credits.grantSubscriptionCredits(
      String(sub.userId),
      amount,
      String(sub._id),
      sub.currentPeriodStart,
      sub.currentPeriodEnd,
    );
  }

  /** Phase A / P1: freeze the immutable economics snapshot for the sold period. */
  private async freezeEconomicsSnapshot(sub: any) {
    if ((sub.planSnapshot?.productType || "FOMO_AI") !== "FOMO_AI") return;
    try {
      sub.economicsSnapshot = await this.creditPricing.buildEconomicsSnapshot(sub.planSnapshot, {
        start: sub.currentPeriodStart,
        end: sub.currentPeriodEnd,
      });
      await sub.save();
    } catch {
      /* snapshot is best-effort; grant/economics still function from globals */
    }
  }

  async create(params: {
    userId: string;
    planId?: string;
    planCode?: string;
    source?: string;
    originWallet?: string;
    createdBy?: string;
  }) {
    const plan: any = params.planId
      ? await this.planModel.findById(params.planId).lean()
      : await this.planModel.findOne({ code: params.planCode }).lean();
    if (!plan) throw new NotFoundException("plan not found");
    const snapshot = this.planSnapshot(plan);
    const sub = await this.subModel.create({
      userId: this.oid(params.userId),
      planId: plan._id,
      planVersion: plan.version,
      productType: plan.productType || "FOMO_AI",
      status: "PENDING",
      source: params.source || "ADMIN_GRANT",
      originWallet: params.originWallet || "",
      planSnapshot: snapshot,
      priceSnapshot: { priceUsd: plan.priceUsd },
      createdBy: params.createdBy || "admin",
    });
    return sub;
  }

  /** Materialize entitlements from the subscription's plan snapshot. */
  private async materialize(sub: any) {
    const start = sub.currentPeriodStart || new Date();
    const end = sub.currentPeriodEnd || null;
    const productType = sub.planSnapshot?.productType || "FOMO_AI";

    // Phase G: the canonical FOMO AI Membership right (FOMO_AI product only).
    // Access to premium capabilities is resolved via this membership + the
    // product's included capability set (see AccessResolver).
    if (productType === "FOMO_AI") {
      await this.entModel.updateOne(
        { userId: sub.userId, capabilityKey: MEMBERSHIP_CAPABILITY_KEY, sourceType: "SUBSCRIPTION", sourceId: String(sub._id) },
        {
          $set: {
            userId: sub.userId,
            capabilityKey: MEMBERSHIP_CAPABILITY_KEY,
            sourceType: "SUBSCRIPTION",
            sourceId: String(sub._id),
            validFrom: start,
            validUntil: end,
            status: "ACTIVE",
            reason: `plan ${sub.planSnapshot?.code}`,
            grantedBy: "subscription",
            revokedAt: null,
            metadata: { productCode: sub.planSnapshot?.code },
          },
        },
        { upsert: true },
      );
    }

    // Back-compat: also materialize per-capability entitlements listed on the plan
    // (keeps any direct-capability consumers working during the transition).
    const caps: any[] = sub.planSnapshot?.capabilities || [];
    for (const c of caps) {
      const capabilityKey = c.capabilityKey;
      await this.entModel.updateOne(
        { userId: sub.userId, capabilityKey, sourceType: "SUBSCRIPTION", sourceId: String(sub._id) },
        {
          $set: {
            userId: sub.userId,
            capabilityKey,
            sourceType: "SUBSCRIPTION",
            sourceId: String(sub._id),
            validFrom: start,
            validUntil: end,
            status: "ACTIVE",
            reason: `plan ${sub.planSnapshot?.code}`,
            grantedBy: "subscription",
            revokedAt: null,
          },
        },
        { upsert: true },
      );
    }
  }

  private async expireEntitlementsOf(sub: any) {
    await this.entModel.updateMany(
      { sourceType: "SUBSCRIPTION", sourceId: String(sub._id), status: "ACTIVE" },
      { $set: { status: "EXPIRED" } },
    );
  }

  async activate(subId: string) {
    const sub: any = await this.subModel.findById(subId);
    if (!sub) throw new NotFoundException("subscription not found");
    this.assertTransition(sub.status, "ACTIVE");
    const now = new Date();
    const days = sub.planSnapshot?.durationDays || 30;
    sub.currentPeriodStart = now;
    sub.currentPeriodEnd = new Date(now.getTime() + days * 86400000);
    sub.graceUntil = null;
    sub.status = "ACTIVE";
    await sub.save();
    await this.materialize(sub);
    await this.freezeEconomicsSnapshot(sub);
    // Credits belong to FOMO AI economy only (Intel = access-only).
    await this.grantAiCreditsIfApplicable(sub);
    return sub;
  }

  async extend(subId: string, days: number) {
    const sub: any = await this.subModel.findById(subId);
    if (!sub) throw new NotFoundException("subscription not found");
    if (!["ACTIVE", "GRACE_PERIOD"].includes(sub.status)) {
      throw new BadRequestException("can only extend ACTIVE/GRACE_PERIOD");
    }
    const base = sub.currentPeriodEnd && sub.currentPeriodEnd > new Date() ? sub.currentPeriodEnd : new Date();
    sub.currentPeriodStart = new Date();
    sub.currentPeriodEnd = new Date(base.getTime() + days * 86400000);
    sub.status = "ACTIVE";
    sub.graceUntil = null;
    await sub.save();
    await this.materialize(sub);
    await this.freezeEconomicsSnapshot(sub);
    await this.grantAiCreditsIfApplicable(sub);
    return sub;
  }

  async cancel(subId: string) {
    const sub: any = await this.subModel.findById(subId);
    if (!sub) throw new NotFoundException("subscription not found");
    this.assertTransition(sub.status, "CANCELLED");
    sub.status = "CANCELLED";
    sub.autoRenew = false;
    await sub.save();
    // keep entitlements until natural expiry (period end); expiry worker will drop them
    return sub;
  }

  async revoke(subId: string, reason = "revoked") {
    const sub: any = await this.subModel.findById(subId);
    if (!sub) throw new NotFoundException("subscription not found");
    this.assertTransition(sub.status, "REVOKED");
    sub.status = "REVOKED";
    await sub.save();
    await this.expireEntitlementsOf(sub); // immediate
    return sub;
  }

  async expire(subId: string) {
    const sub: any = await this.subModel.findById(subId);
    if (!sub) throw new NotFoundException("subscription not found");
    if (!["ACTIVE", "GRACE_PERIOD"].includes(sub.status)) {
      throw new BadRequestException("only ACTIVE/GRACE_PERIOD can expire");
    }
    sub.status = "EXPIRED";
    await sub.save();
    await this.expireEntitlementsOf(sub);
    // Phase A (P2-P4): expire remaining monthly credits for THIS period via an
    // idempotent EXPIRATION ledger op (records breakage). Rollover NONE only.
    if ((sub.planSnapshot?.creditRollover || "NONE") === "NONE") {
      await this.credits.expireSubscriptionPeriod(
        String(sub.userId),
        String(sub._id),
        sub.currentPeriodStart || sub.createdAt || new Date(),
        sub.currentPeriodEnd || null,
      );
    }
    return sub;
  }

  /** C3: idempotent expiry reconciliation worker. */
  async runExpiryReconciliation() {
    const now = new Date();
    const result = { toGrace: 0, expired: 0 };
    // ACTIVE past period end
    const activeDue = await this.subModel.find({ status: "ACTIVE", currentPeriodEnd: { $lt: now } });
    for (const sub of activeDue) {
      const graceHours = sub.planSnapshot?.gracePeriodHours || 0;
      if (graceHours > 0) {
        this.assertTransition(sub.status, "GRACE_PERIOD");
        sub.status = "GRACE_PERIOD";
        sub.graceUntil = new Date((sub.currentPeriodEnd as Date).getTime() + graceHours * 3600000);
        await sub.save();
        result.toGrace++;
      } else {
        await this.expire(String(sub._id));
        result.expired++;
      }
    }
    // GRACE past graceUntil
    const graceDue = await this.subModel.find({ status: "GRACE_PERIOD", graceUntil: { $lt: now } });
    for (const sub of graceDue) {
      await this.expire(String(sub._id));
      result.expired++;
    }
    return result;
  }
}
