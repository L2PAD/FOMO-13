import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types, isValidObjectId } from "mongoose";
import { NftBenefitRule } from "./models/nft-benefit-rule.model";
import { NftAccessActivation } from "./models/nft-access-activation.model";
import { Entitlement } from "./models/entitlement.model";
import { NftOwnershipProvider } from "./nft-ownership.provider";
import { MEMBERSHIP_CAPABILITY_KEY } from "./entitlements.constants";

const norm = (s: string) => String(s || "").trim().toLowerCase();

/**
 * Phase G — NFT Access Engine. Turns NFT ownership into a TEMPORARY FOMO AI
 * Membership entitlement (never permanent). Handles idempotent activation,
 * transfer reconciliation (remaining period follows the token), and expiry.
 */
@Injectable()
export class NftAccessService implements OnModuleInit {
  private readonly logger = new Logger("NftAccess");

  constructor(
    @InjectModel(NftBenefitRule.name) private readonly ruleModel: Model<any>,
    @InjectModel(NftAccessActivation.name) private readonly actModel: Model<any>,
    @InjectModel(Entitlement.name) private readonly entModel: Model<any>,
    private readonly ownership: NftOwnershipProvider,
    @InjectConnection() private readonly conn: Connection,
  ) {}

  async onModuleInit() {
    try {
      const count = await this.ruleModel.countDocuments();
      if (count === 0) {
        await this.ruleModel.create({
          name: "FOMO Genesis Access",
          chainId: "1",
          contractAddress: "0xf0m0genesis000000000000000000000000c0de",
          enabled: true,
          benefitType: "FOMO_AI_MEMBERSHIP",
          durationDays: 30,
          activationMode: "MANUAL",
          transferableDuringActivePeriod: true,
          reactivateAfterExpiry: false,
          maxActivationsPerToken: 1,
          demo: true,
        });
        this.logger.log("seeded demo NFT benefit rule: FOMO Genesis Access");
      }
    } catch (e: any) {
      this.logger.warn(`nft rule seed skipped: ${e?.message || e}`);
    }
  }

  private async audit(type: string, payload: Record<string, any>) {
    try {
      await this.conn.collection("nft_access_audit").insertOne({ type, ...payload, at: new Date() });
    } catch {
      /* audit best-effort */
    }
  }

  /* ───────── Benefit rules (admin) ───────── */
  listRules() {
    return this.ruleModel.find().sort({ createdAt: -1 }).lean();
  }
  async createRule(body: any) {
    const doc = await this.ruleModel.create({ ...body, contractAddress: norm(body.contractAddress) });
    return doc.toObject();
  }
  async updateRule(id: string, body: any) {
    if (!isValidObjectId(id)) return null;
    const set = { ...body };
    if (set.contractAddress) set.contractAddress = norm(set.contractAddress);
    await this.ruleModel.updateOne({ _id: id }, { $set: set });
    return this.ruleModel.findById(id).lean();
  }

  private async findRule(chainId: string, contract: string) {
    const now = new Date();
    return this.ruleModel
      .findOne({
        chainId: String(chainId),
        contractAddress: norm(contract),
        enabled: true,
        $and: [
          { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
          { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] },
        ],
      })
      .lean();
  }

  private async findLiveActivation(chainId: string, contract: string, tokenId: string) {
    return this.actModel
      .findOne({ chainId: String(chainId), contractAddress: norm(contract), tokenId: String(tokenId), status: "ACTIVE" })
      .sort({ accessEndsAt: -1 });
  }

  /* ───────── Activation (P6) — idempotent ───────── */
  async activate(params: {
    userId: string;
    wallet: string;
    chainId: string;
    contract: string;
    tokenId: string;
    txHash?: string;
  }) {
    const { userId, wallet, chainId, contract, tokenId } = params;
    if (!isValidObjectId(userId)) return { success: false, code: "auth_required", message: "Требуется вход" };
    if (!wallet) return { success: false, code: "wallet_required", message: "Не указан кошелёк" };

    const rule: any = await this.findRule(chainId, contract);
    if (!rule) return { success: false, code: "no_rule", message: "Коллекция не участвует в акции доступа" };

    const owns = await this.ownership.hasToken(wallet, chainId, contract, tokenId);
    if (!owns) return { success: false, code: "not_owner", message: "NFT не принадлежит указанному кошельку" };

    // Idempotent: a live activation for this token → return it (no fresh period).
    const existing: any = await this.findLiveActivation(chainId, contract, tokenId);
    if (existing) {
      // keep owner link fresh if the same user re-checks
      return { success: true, code: "already_active", data: existing.toObject(), reused: true };
    }

    // Enforce max activations per token (across all statuses).
    const totalActs = await this.actModel.countDocuments({ chainId: String(chainId), contractAddress: norm(contract), tokenId: String(tokenId) });
    if (totalActs >= (rule.maxActivationsPerToken || 1) && !rule.reactivateAfterExpiry) {
      return { success: false, code: "activation_exhausted", message: "Лимит активаций для этого токена исчерпан" };
    }

    const now = new Date();
    const ends = new Date(now.getTime() + (rule.durationDays || 30) * 86400000);
    const act: any = await this.actModel.create({
      chainId: String(chainId),
      contractAddress: norm(contract),
      tokenId: String(tokenId),
      ruleId: rule._id,
      activatedAt: now,
      accessStartsAt: now,
      accessEndsAt: ends,
      durationDays: rule.durationDays || 30,
      activatedByUserId: new Types.ObjectId(userId),
      activatedByWallet: norm(wallet),
      currentOwnerWallet: norm(wallet),
      currentOwnerUserId: new Types.ObjectId(userId),
      status: "ACTIVE",
      activationTransactionHash: params.txHash || "",
      metadata: { ruleName: rule.name },
    });

    const ent = await this.materializeEntitlement(String(userId), act, now, ends);
    act.entitlementId = String(ent._id);
    await act.save();

    await this.audit("NFT_ACCESS_ACTIVATED", { tokenId, chainId, contract: norm(contract), userId, wallet: norm(wallet), expiresAt: ends });
    return { success: true, code: "activated", data: act.toObject() };
  }

  private async materializeEntitlement(userId: string, act: any, from: Date, until: Date) {
    return this.entModel.create({
      userId: new Types.ObjectId(userId),
      capabilityKey: MEMBERSHIP_CAPABILITY_KEY,
      sourceType: "NFT_ACTIVATION",
      sourceId: String(act._id),
      validFrom: from,
      validUntil: until,
      status: "ACTIVE",
      reason: `nft ${act.tokenId}`,
      grantedBy: "nft-activation",
      metadata: { tokenId: act.tokenId, contractAddress: act.contractAddress, chainId: act.chainId },
    });
  }

  /* ───────── Transfer reconciliation (P7/P9) ───────── */
  async reconcileTransfer(params: { chainId: string; contract: string; tokenId: string; newWallet: string; newUserId?: string; txHash?: string }) {
    const { chainId, contract, tokenId, newWallet } = params;
    // Update the test ownership ledger (real provider would receive a chain event).
    await this.ownership.setOwner(chainId, contract, tokenId, newWallet);

    const act: any = await this.findLiveActivation(chainId, contract, tokenId);
    if (!act) {
      await this.audit("NFT_TRANSFER_NO_ACTIVATION", { tokenId, chainId, contract: norm(contract), newWallet: norm(newWallet) });
      return { success: true, code: "no_active_pass", message: "Активного access-pass нет — переданы только NFT-права" };
    }

    const rule: any = act.ruleId ? await this.ruleModel.findById(act.ruleId).lean() : null;
    if (rule && rule.transferableDuringActivePeriod === false) {
      // Access does not follow the token: revoke old owner's entitlement.
      if (act.entitlementId && isValidObjectId(act.entitlementId)) {
        await this.entModel.updateOne({ _id: act.entitlementId }, { $set: { status: "REVOKED", revokedAt: new Date() } });
      }
      act.status = "REVOKED";
      await act.save();
      await this.audit("NFT_ACCESS_TRANSFER_NON_TRANSFERABLE", { tokenId, chainId, contract: norm(contract) });
      return { success: true, code: "non_transferable", message: "Правило не разрешает передачу доступа — доступ отозван" };
    }

    const fromUser = act.currentOwnerUserId ? String(act.currentOwnerUserId) : null;
    const remainingDays = Math.max(0, Math.ceil((+act.accessEndsAt - Date.now()) / 86400000));

    act.currentOwnerWallet = norm(newWallet);
    act.currentOwnerUserId = params.newUserId && isValidObjectId(params.newUserId) ? new Types.ObjectId(params.newUserId) : null;

    // Move the SAME entitlement (same expiresAt) to the new user.
    if (params.newUserId && isValidObjectId(params.newUserId)) {
      if (act.entitlementId && isValidObjectId(act.entitlementId)) {
        await this.entModel.updateOne(
          { _id: act.entitlementId },
          { $set: { userId: new Types.ObjectId(params.newUserId), status: "ACTIVE", revokedAt: null, reason: `nft ${tokenId} (transferred)` } },
        );
      } else {
        const ent = await this.materializeEntitlement(params.newUserId, act, act.accessStartsAt, act.accessEndsAt);
        act.entitlementId = String(ent._id);
      }
    } else if (act.entitlementId && isValidObjectId(act.entitlementId)) {
      // New owner not linked to a platform user yet — suspend the pass until they connect.
      await this.entModel.updateOne({ _id: act.entitlementId }, { $set: { status: "REVOKED", revokedAt: new Date() } });
    }
    await act.save();

    await this.audit("NFT_ACCESS_TRANSFERRED", {
      fromUser,
      toUser: params.newUserId || null,
      tokenId,
      chainId,
      contract: norm(contract),
      remainingDays,
      expiresAt: act.accessEndsAt,
      txHash: params.txHash || "",
    });
    return { success: true, code: "transferred", data: act.toObject(), remainingDays };
  }

  async revokeActivation(id: string, reason = "admin_revoke") {
    if (!isValidObjectId(id)) return { success: false, message: "invalid id" };
    const act: any = await this.actModel.findById(id);
    if (!act) return { success: false, message: "not found" };
    act.status = "REVOKED";
    await act.save();
    if (act.entitlementId && isValidObjectId(act.entitlementId)) {
      await this.entModel.updateOne({ _id: act.entitlementId }, { $set: { status: "REVOKED", revokedAt: new Date() } });
    }
    await this.audit("NFT_ACCESS_REVOKED", { id, tokenId: act.tokenId, reason });
    return { success: true };
  }

  /** Mark past-due activations EXPIRED and expire their entitlements. */
  async runExpiry() {
    const now = new Date();
    const due = await this.actModel.find({ status: "ACTIVE", accessEndsAt: { $lt: now } });
    let expired = 0;
    for (const act of due) {
      act.status = "EXPIRED";
      await act.save();
      if (act.entitlementId && isValidObjectId(act.entitlementId)) {
        await this.entModel.updateOne({ _id: act.entitlementId, status: "ACTIVE" }, { $set: { status: "EXPIRED" } });
      }
      expired++;
    }
    return { expired };
  }

  listActivations(filter: any = {}) {
    return this.actModel.find(filter).sort({ createdAt: -1 }).limit(200).lean();
  }
  listTransfers() {
    return this.conn.collection("nft_access_audit").find({ type: /TRANSFER/ }).sort({ at: -1 }).limit(200).toArray();
  }

  /* ───────── Diagnostics (P15) ───────── */
  async diagnostics(params: { wallet?: string; chainId?: string; contract?: string; tokenId?: string }) {
    const { chainId, contract, tokenId } = params;
    const out: any = { input: params };
    const rule: any = contract && chainId ? await this.findRule(chainId, contract) : null;
    out.collectionEligible = !!rule;
    out.rule = rule ? { name: rule.name, durationDays: rule.durationDays, maxActivationsPerToken: rule.maxActivationsPerToken, reactivateAfterExpiry: rule.reactivateAfterExpiry } : null;
    if (chainId && contract && tokenId) {
      const owner = await this.ownership.getOwner(chainId, contract, tokenId);
      out.currentOwner = owner;
      out.ownerMatches = params.wallet ? owner === norm(params.wallet) : null;
      const act: any = await this.actModel.findOne({ chainId: String(chainId), contractAddress: norm(contract), tokenId: String(tokenId) }).sort({ createdAt: -1 }).lean();
      if (act) {
        const remainingDays = Math.max(0, Math.ceil((+new Date(act.accessEndsAt) - Date.now()) / 86400000));
        out.activation = {
          status: act.status,
          activatedAt: act.activatedAt,
          accessStartsAt: act.accessStartsAt,
          accessEndsAt: act.accessEndsAt,
          remainingDays,
          currentOwnerWallet: act.currentOwnerWallet,
        };
        out.premiumAccess = act.status === "ACTIVE" && +new Date(act.accessEndsAt) > Date.now() ? "ALLOW" : "DENY";
      } else {
        out.activation = null;
        out.premiumAccess = "DENY";
      }
    }
    out.launchpadEligibility = "independent (existing NFT/staking engine)";
    return out;
  }

  /** TEST helper exposed to admin: set/mint token ownership. */
  setTestOwnership(chainId: string, contract: string, tokenId: string, wallet: string) {
    return this.ownership.setOwner(chainId, contract, tokenId, wallet);
  }

  /** Resolve a platform userId from an authenticated wallet (wallet-JWTs may omit _id). */
  async resolveUserIdByWallet(wallet: string): Promise<string> {
    const w = norm(wallet);
    if (!w) return "";
    const u = await this.conn.collection("users").findOne({ wallet: w }, { projection: { _id: 1 } });
    return u ? String(u._id) : "";
  }

  /** DEV/TEST ONLY — backdate the active activation for a token then reconcile expiry. */
  async testExpireToken(chainId: string, contract: string, tokenId: string) {
    if ((process.env.NFT_OWNERSHIP_PROVIDER || "test") !== "test") {
      return { ok: false, error: "test expire disabled outside test provider" };
    }
    const past = new Date(Date.now() - 24 * 3600 * 1000);
    const r = await this.actModel.updateMany(
      { chainId: String(chainId), contractAddress: norm(contract), tokenId: String(tokenId), status: "ACTIVE" },
      { $set: { accessEndsAt: past, accessStartsAt: new Date(Date.now() - 40 * 24 * 3600 * 1000) } },
    );
    const expiry = await this.runExpiry();
    return { ok: true, backdated: r.modifiedCount, expiry };
  }

  /**
   * G27 — presentation-ready NFT access for the CURRENT user's wallet.
   * Enumerates the user's owned tokens (via the ownership provider ledger) that
   * fall under an active benefit rule and resolves each token's benefit state.
   * The public frontend must NOT assemble rules+activations+entitlements itself.
   */
  async myNftAccess(userId: string, wallet: string) {
    const providerMode = process.env.NFT_OWNERSHIP_PROVIDER || "test";
    const w = norm(wallet);
    const out: any = { providerMode, tokens: [] as any[] };
    if (!w) return out;
    const rules: any[] = await this.ruleModel.find({ enabled: true }).lean();
    for (const rule of rules) {
      const owned = await this.conn
        .collection("nft_test_ownership")
        .find({ chainId: String(rule.chainId), contractAddress: norm(rule.contractAddress), ownerWallet: w })
        .toArray();
      for (const o of owned) {
        const tokenId = String(o.tokenId);
        const act: any = await this.actModel
          .findOne({ chainId: String(rule.chainId), contractAddress: norm(rule.contractAddress), tokenId })
          .sort({ createdAt: -1 })
          .lean();
        let status = "AVAILABLE";
        let activatedAt: Date | null = null;
        let expiresAt: Date | null = null;
        let remainingDays: number | null = null;
        let canActivate = true;
        if (act) {
          activatedAt = act.activatedAt || null;
          expiresAt = act.accessEndsAt || null;
          const live = act.status === "ACTIVE" && +new Date(act.accessEndsAt) > Date.now();
          remainingDays = Math.max(0, Math.ceil((+new Date(act.accessEndsAt) - Date.now()) / 86400000));
          if (live) {
            const isActivator = String(act.activatedByUserId || "") === String(userId);
            const isCurrentOwner = String(act.currentOwnerUserId || "") === String(userId);
            status = !isActivator && isCurrentOwner ? "TRANSFERRED" : "ACTIVE";
            canActivate = false;
          } else {
            status = "EXPIRED";
            remainingDays = 0;
            canActivate = !!rule.reactivateAfterExpiry;
          }
        }
        if (status === "AVAILABLE") {
          const totalActs = await this.actModel.countDocuments({ chainId: String(rule.chainId), contractAddress: norm(rule.contractAddress), tokenId });
          if (totalActs >= (rule.maxActivationsPerToken || 1) && !rule.reactivateAfterExpiry) canActivate = false;
        }
        out.tokens.push({
          chainId: String(rule.chainId),
          contractAddress: norm(rule.contractAddress),
          tokenId,
          collection: { name: rule.name, image: rule.image || null },
          ownership: { verified: true, wallet: w },
          benefit: {
            eligible: true,
            durationDays: rule.durationDays || 30,
            benefitType: rule.benefitType || "FOMO_AI_MEMBERSHIP",
            status,
            activatedAt,
            expiresAt,
            remainingDays,
            canActivate,
          },
          utilities: { launchpad: "independent", spaceport: "independent", market: "independent" },
        });
      }
    }
    return out;
  }
}
