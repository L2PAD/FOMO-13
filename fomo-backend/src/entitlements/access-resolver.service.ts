import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, isValidObjectId } from "mongoose";
import { Entitlement } from "./models/entitlement.model";
import { Subscription } from "./models/subscription.model";
import { Plan } from "./models/plan.model";
import {
  BILLING_BOUNDARY_CAPABILITIES,
  accessTypeOf,
  CAPABILITY_ELIGIBILITY_PROVIDER,
  MEMBERSHIP_CAPABILITY_KEY,
  DEFAULT_MEMBERSHIP_CAPABILITIES,
} from "./entitlements.constants";

export interface MembershipSource {
  type: string; // SUBSCRIPTION | NFT_ACTIVATION | ADMIN_GRANT | ...
  sourceId?: string;
  expiresAt: Date | null;
  tokenId?: string;
  plan?: string | null;
}

export interface AccessDecision {
  allowed: boolean;
  capability: string;
  accessType: string;
  source: string | null;
  sourceId?: string;
  plan?: string | null;
  validUntil?: Date | null;
  // HYBRID / EXTERNAL_ELIGIBILITY contract:
  accessAllowed?: boolean;
  eligibilityRequired?: boolean;
  eligibilityProvider?: string;
  legacySource?: boolean;
  requirements: Array<{ type: string; plans?: string[]; note?: string }>;
  reason: string | null;
  // ── Phase G unified membership contract ──
  membership?: { active: boolean; expiresAt: Date | null };
  sources?: MembershipSource[];
  matchedBy?: string | null;
}

/**
 * Phase G — Unified FOMO Access Engine.
 *
 * There are NO access modes (no NFT_ONLY / SUBSCRIPTION_ONLY / AND / OR). There
 * is ONE canonical right — FOMO AI Membership — obtainable from several
 * independent sources (subscription, NFT activation, admin grant, future promo).
 *
 *   allowed = anyActiveMembershipEntitlement && capabilityIncludedInProduct
 *
 * Each source keeps its own provenance/lifecycle; the effective access window is
 * the MAX expiry across active sources — never an implicit merge of one source
 * by another.
 */
@Injectable()
export class AccessResolverService {
  private membershipCapsCache: { at: number; set: Set<string> } | null = null;

  constructor(
    @InjectModel(Entitlement.name) private readonly entitlementModel: Model<any>,
    @InjectModel(Subscription.name) private readonly subscriptionModel: Model<any>,
    @InjectModel(Plan.name) private readonly planModel: Model<any>,
  ) {}

  private now() {
    return new Date();
  }

  /** Capabilities unlocked by an active membership = active FOMO_AI product caps
   *  ∪ safe defaults. Cached ~30s. */
  private async getMembershipCapabilities(): Promise<Set<string>> {
    if (this.membershipCapsCache && Date.now() - this.membershipCapsCache.at < 30000) {
      return this.membershipCapsCache.set;
    }
    const set = new Set<string>(DEFAULT_MEMBERSHIP_CAPABILITIES);
    try {
      const plans = await this.planModel
        .find({ productType: "FOMO_AI", status: "ACTIVE" })
        .select({ capabilities: 1 })
        .lean();
      for (const p of plans as any[]) {
        for (const c of p.capabilities || []) {
          if (c?.capabilityKey && c.capabilityKey !== MEMBERSHIP_CAPABILITY_KEY) set.add(c.capabilityKey);
        }
      }
    } catch {
      /* fall back to defaults */
    }
    this.membershipCapsCache = { at: Date.now(), set };
    return set;
  }

  private async findActiveEntitlement(userId: string, capability: string) {
    const now = this.now();
    return this.entitlementModel
      .findOne({
        userId: new Types.ObjectId(userId),
        capabilityKey: capability,
        status: "ACTIVE",
        $or: [{ validUntil: null }, { validUntil: { $gt: now } }],
      })
      .sort({ validUntil: -1, createdAt: -1 })
      .lean();
  }

  /** All ACTIVE membership entitlements for a user (any source). */
  private async findActiveMemberships(userId: string) {
    const now = this.now();
    return this.entitlementModel
      .find({
        userId: new Types.ObjectId(userId),
        capabilityKey: MEMBERSHIP_CAPABILITY_KEY,
        status: "ACTIVE",
        $or: [{ validUntil: null }, { validUntil: { $gt: now } }],
      })
      .sort({ validUntil: -1 })
      .lean();
  }

  private maxExpiry(list: Array<{ validUntil: Date | null }>): Date | null {
    let max: Date | null = null;
    let hasInfinite = false;
    for (const e of list) {
      if (e.validUntil === null) hasInfinite = true;
      else if (!max || e.validUntil > max) max = e.validUntil;
    }
    return hasInfinite ? null : max;
  }

  private async subscriptionPlanCode(sourceId: string): Promise<string | null> {
    if (!isValidObjectId(String(sourceId))) return null;
    const sub: any = await this.subscriptionModel.findById(sourceId).lean();
    return sub?.planSnapshot?.code || null;
  }

  /** The user's canonical membership status + provenance. */
  async getMembership(userId: string): Promise<{ active: boolean; expiresAt: Date | null; sources: MembershipSource[] }> {
    if (!userId || !isValidObjectId(userId)) return { active: false, expiresAt: null, sources: [] };
    const ents: any[] = await this.findActiveMemberships(userId);
    const sources: MembershipSource[] = [];
    for (const e of ents) {
      sources.push({
        type: e.sourceType,
        sourceId: String(e.sourceId || e._id),
        expiresAt: e.validUntil || null,
        tokenId: e.metadata?.tokenId,
        plan: e.sourceType === "SUBSCRIPTION" ? await this.subscriptionPlanCode(e.sourceId) : null,
      });
    }
    return { active: ents.length > 0, expiresAt: this.maxExpiry(ents), sources };
  }

  async resolveAccess(params: { userId?: string; capability: string }): Promise<AccessDecision> {
    const capability = params.capability;
    const userId = String(params.userId || "");
    const accessType = accessTypeOf(capability);
    const eligibilityProvider = CAPABILITY_ELIGIBILITY_PROVIDER[capability];

    const base: AccessDecision = {
      allowed: false,
      capability,
      accessType,
      source: null,
      plan: null,
      validUntil: null,
      requirements: [],
      reason: null,
      membership: { active: false, expiresAt: null },
      sources: [],
      matchedBy: null,
    };

    if (BILLING_BOUNDARY_CAPABILITIES.has(capability)) {
      return { ...base, reason: "billing_boundary", source: "external" };
    }
    if (!userId || !isValidObjectId(userId)) {
      return { ...base, reason: "auth_required", requirements: [{ type: "auth" }] };
    }

    // Unified membership status (shared by all access types below).
    const membership = await this.getMembership(userId);
    const membershipInfo = { active: membership.active, expiresAt: membership.expiresAt };
    const matchedBy = membership.sources[0]?.type || null;

    // EXTERNAL_ELIGIBILITY — owned by existing engine. Report, never emulate.
    if (accessType === "EXTERNAL_ELIGIBILITY") {
      return {
        ...base,
        allowed: false,
        accessAllowed: true,
        eligibilityRequired: true,
        eligibilityProvider,
        reason: "external_eligibility_required",
        requirements: [{ type: "external_engine", note: `${eligibilityProvider} eligibility (existing engine)` }],
      };
    }

    // HYBRID — access layer via membership, eligibility via external engine.
    if (accessType === "HYBRID") {
      return {
        ...base,
        allowed: false,
        accessAllowed: membership.active,
        eligibilityRequired: true,
        eligibilityProvider,
        membership: membershipInfo,
        sources: membership.sources,
        matchedBy,
        validUntil: membership.expiresAt,
        reason: membership.active ? "external_eligibility_required" : "capability_required",
        requirements: membership.active
          ? [{ type: "external_engine", note: `${eligibilityProvider} eligibility (NFT/staking)` }]
          : [{ type: "membership" }, { type: "external_engine" }],
      };
    }

    // ACCESS_ONLY — unlocked by an active membership whose product includes the cap.
    const membershipCaps = await this.getMembershipCapabilities();
    const capIncluded = capability === MEMBERSHIP_CAPABILITY_KEY || membershipCaps.has(capability);
    const grantedByMembership = membership.active && capIncluded;

    // Back-compat: an explicit legacy/direct entitlement for this exact capability.
    let directEnt: any = null;
    if (!grantedByMembership) directEnt = await this.findActiveEntitlement(userId, capability);

    if (grantedByMembership || directEnt) {
      const sources = grantedByMembership
        ? membership.sources
        : [{ type: directEnt.sourceType, sourceId: String(directEnt._id), expiresAt: directEnt.validUntil || null, plan: null } as MembershipSource];
      const validUntil = grantedByMembership ? membership.expiresAt : directEnt.validUntil || null;
      return {
        ...base,
        allowed: true,
        accessAllowed: true,
        source: sources[0]?.type || "entitlement",
        sourceId: sources[0]?.sourceId,
        plan: sources[0]?.plan || null,
        validUntil,
        legacySource: !grantedByMembership,
        membership: membershipInfo,
        sources,
        matchedBy: sources[0]?.type || null,
      };
    }

    return {
      ...base,
      allowed: false,
      accessAllowed: false,
      membership: membershipInfo,
      sources: membership.sources,
      reason: membership.active ? "capability_not_in_product" : "membership_required",
      requirements: [{ type: "membership" }],
    };
  }

  async resolveMany(userId: string, capabilities: string[]): Promise<AccessDecision[]> {
    return Promise.all(capabilities.map((c) => this.resolveAccess({ userId, capability: c })));
  }

  async isAllowed(userId: string | undefined, capability: string): Promise<AccessDecision> {
    return this.resolveAccess({ userId, capability });
  }

  /**
   * BUZZ-AI Stage 2 — BUZZ_FEED_ACCESS.
   * Reuses the unified membership engine: access to the gated community Feed and
   * its social actions is granted by ANY active membership source
   * (qualifying subscription OR qualifying NFT benefit OR admin grant).
   * News & Calendar are NOT gated by this.
   */
  async buzzFeedAccess(userId?: string): Promise<{
    capability: string;
    allowed: boolean;
    membership: { active: boolean; expiresAt: Date | null };
    sources: MembershipSource[];
    reason: string | null;
  }> {
    const uid = String(userId || "");
    if (!uid || !isValidObjectId(uid)) {
      return {
        capability: "BUZZ_FEED_ACCESS",
        allowed: false,
        membership: { active: false, expiresAt: null },
        sources: [],
        reason: "auth_required",
      };
    }
    const membership = await this.getMembership(uid);
    return {
      capability: "BUZZ_FEED_ACCESS",
      allowed: membership.active,
      membership: { active: membership.active, expiresAt: membership.expiresAt },
      sources: membership.sources,
      reason: membership.active ? null : "access_required",
    };
  }

  /** P20 — human-readable access explanation for a capability. */
  async explainAccess(userId: string, capability: string) {
    const decision = await this.resolveAccess({ userId, capability });
    const lines: string[] = [];
    lines.push(`FINAL: ${decision.allowed ? "ALLOW" : "DENY"}`);
    lines.push(
      decision.membership?.active
        ? `FOMO AI Membership ACTIVE${decision.membership.expiresAt ? ` until ${new Date(decision.membership.expiresAt).toISOString().slice(0, 10)}` : ""}`
        : "FOMO AI Membership: not active",
    );
    for (const s of decision.sources || []) {
      const exp = s.expiresAt ? new Date(s.expiresAt).toISOString().slice(0, 10) : "∞";
      lines.push(`${s.type}${s.tokenId ? ` #${s.tokenId}` : ""}: active until ${exp}`);
    }
    if (!decision.allowed) {
      lines.push(
        decision.reason === "capability_not_in_product"
          ? "Reason: this capability is not included in the current product."
          : "Reason: your FOMO AI access has expired or is not active.",
      );
    }
    return { ...decision, explanation: lines };
  }

  /* ───────── Admin grant (P13) ───────── */
  async adminGrant(params: { userId: string; days: number; reason?: string; grantedBy?: string; capabilityKey?: string }) {
    if (!isValidObjectId(params.userId)) return { success: false, message: "invalid userId" };
    const now = new Date();
    const until = new Date(now.getTime() + (params.days || 30) * 86400000);
    const ent = await this.entitlementModel.create({
      userId: new Types.ObjectId(params.userId),
      capabilityKey: params.capabilityKey || MEMBERSHIP_CAPABILITY_KEY,
      sourceType: "ADMIN_GRANT",
      sourceId: "",
      validFrom: now,
      validUntil: until,
      status: "ACTIVE",
      reason: params.reason || "admin grant",
      grantedBy: params.grantedBy || "admin",
      metadata: {},
    });
    return { success: true, data: (ent as any).toObject() };
  }

  async revokeEntitlement(id: string) {
    if (!isValidObjectId(id)) return { success: false, message: "invalid id" };
    await this.entitlementModel.updateOne({ _id: id }, { $set: { status: "REVOKED", revokedAt: new Date() } });
    return { success: true };
  }

  listEntitlements(userId: string) {
    if (!isValidObjectId(userId)) return [];
    return this.entitlementModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).lean();
  }
}
