import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import { Purchase } from "./models/purchase.model";
import { MoneyService } from "./money.service";
import { MoneyChainService } from "./money-chain.service";
import { SubscriptionService } from "../entitlements/subscription.service";
import { ACTIVE_MONEY_NETWORK } from "./money.config";

const r6 = (v: number) => Math.round((Number(v) || 0) * 1e6) / 1e6;
const oid = (id: string) => new Types.ObjectId(id);

/**
 * H4 — Canonical custody-aware Purchase Saga.
 *
 * Turns the proven MoneyChainService primitives into a state machine so a
 * membership purchase actually reduces the on-chain usdBalance(user) (via the
 * fee-free escrow path) — not only the MoneyLedger. Built AROUND the existing
 * MoneyLedger / Purchase model / SubscriptionService (no rewrites, no new
 * contract, no feePermille change).
 *
 * States: CREATED → LEDGER_RESERVED → CUSTODY_ITEM_READY → USER_SIGNATURE_REQUIRED
 *  → USER_TX_SUBMITTED → CUSTODY_LOCKED → OWNER_SETTLEMENT_PENDING → OWNER_SETTLED
 *  → PROVISIONING → SETTLED  (+ CANCELLED/RELEASED, OWNER_SETTLEMENT_FAILED→MANUAL_REVIEW,
 *  PROVISIONING_FAILED→REFUND_REQUIRED, REFUND_*→REFUNDED).
 *
 * Absence of the owner key blocks ONLY the on-chain steps (item create + owner
 * settlement); everything else is fully operational + idempotent.
 */
@Injectable()
export class MoneySagaService {
  private readonly logger = new Logger("MoneySaga");
  constructor(
    @InjectModel(Purchase.name) private readonly purchaseModel: Model<any>,
    @InjectModel("Plan") private readonly planModel: Model<any>,
    private readonly money: MoneyService,
    private readonly chain: MoneyChainService,
    private readonly subs: SubscriptionService,
    @InjectConnection() private readonly conn: Connection,
  ) {}

  private async userWallet(userId: string): Promise<string> {
    try {
      const u: any = await this.conn.collection("users").findOne({ _id: oid(userId) }, { projection: { wallet: 1 } });
      return String(u?.wallet || "").trim();
    } catch { return ""; }
  }

  private async resolvePlan(body: { planCode?: string; productCode?: string }) {
    const plan: any = body.planCode
      ? await this.planModel.findOne({ code: body.planCode }).lean()
      : await this.planModel.findOne({ productType: body.productCode || "FOMO_AI", status: "ACTIVE" }).sort({ sortOrder: 1 }).lean();
    if (!plan) throw new NotFoundException("Product/plan not found");
    return plan;
  }

  /** Sum of amounts escrowed on-chain but not yet ledger-debited (for this user). */
  async custodyLockedSum(userId: string, asset = "USDC"): Promise<number> {
    const rows = await this.purchaseModel.aggregate([
      { $match: { userId: oid(userId), settlementAsset: asset, flow: "CUSTODY", status: { $in: MoneyService.CUSTODY_LOCKED_STATUSES } } },
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]);
    return r6(rows[0]?.sum || 0);
  }

  // ---------------------------------------------------------------- START
  async start(userId: string, body: { planCode?: string; productCode?: string; idempotencyKey?: string }) {
    const plan = await this.resolvePlan(body);
    const asset = "USDC";
    const amount = r6(plan.priceUsd || 0);
    const idem = body.idempotencyKey || `custody:${userId}:${plan.code}:${Date.now()}`;

    const existing: any = await this.purchaseModel.findOne({ idempotencyKey: idem }).lean();
    if (existing) return this.present(existing);

    // 1) Ledger balance must cover it.
    const bal = await this.money.balance(userId, asset);
    if (bal.available < amount) {
      throw new BadRequestException(`Insufficient FOMO Balance. Available ${bal.available} ${asset}, need ${amount} ${asset}.`);
    }

    // 2) Cross-check on-chain usdBalance(user) if wallet + RPC known. A silent
    //    divergence must BLOCK the purchase, never pick one number blindly.
    const wallet = await this.userWallet(userId);
    if (wallet) {
      const onchain = await this.chain.usdBalanceOf(wallet, ACTIVE_MONEY_NETWORK);
      if (onchain != null && onchain + 1e-6 < amount) {
        throw new BadRequestException(`BALANCE_RECONCILIATION_REQUIRED: ledger available ${bal.available} but on-chain usdBalance ${onchain} < ${amount}. Blocked.`);
      }
    }

    const cfg = await this.chain.netConfig(ACTIVE_MONEY_NETWORK);
    const netVerDoc: any = await this.conn.collection("money_network_configs").findOne({ networkId: ACTIVE_MONEY_NETWORK }, { projection: { version: 1 } }).catch(() => null);

    const purchase: any = await this.purchaseModel.create({
      userId: oid(userId),
      productCode: plan.productType || "FOMO_AI",
      planCode: plan.code,
      productId: String(plan._id || ""),
      productSnapshot: { name: plan.name, priceUsd: plan.priceUsd, durationDays: plan.durationDays, aiCredits: plan.aiCredits ?? plan.aiCreditsIncluded, productVersion: plan.version || 1 },
      economicsSnapshot: { priceUsd: amount, platformFeeUsd: 0, feePolicy: "PURCHASE=NONE (marketplace 5% not applied)" },
      settlementAsset: asset,
      amount,
      flow: "CUSTODY",
      status: "LEDGER_RESERVED",
      idempotencyKey: idem,
      custody: {
        contractAddress: cfg.treasuryAddress,
        networkConfigVersion: netVerDoc?.version ?? null,
        itemPrice: amount,
        userWallet: wallet,
        takeFee: false,
      },
    });

    // 3) Claim a pre-provisioned settlement lot from the pool. Lots are created
    //    ahead of time by the owner via CRM Connect Wallet (no server key ever).
    //    If the pool is empty for this price we DO NOT fail — park at
    //    CUSTODY_ITEM_PENDING so no money is lost and the operator can top up.
    const claimed = await this.claimSettlementItem(amount, String(purchase._id));
    if (claimed) {
      purchase.custody.itemId = claimed.itemId;
      purchase.custody.itemCreateTxHash = claimed.createTxHash;
      purchase.status = "USER_SIGNATURE_REQUIRED";
      await purchase.save();
    } else {
      purchase.status = "CUSTODY_ITEM_PENDING";
      purchase.failReason = `PENDING_PROVISIONING: no available settlement lot at ${amount} USDC. Operator must create lots in CRM.`;
      await purchase.save();
    }
    return this.present(purchase.toObject());
  }

  // ---------------------------------------------- SETTLEMENT LOT POOL
  // One-time custody items pre-created by the owner (fee-free), consumed 1:1 by
  // purchases. Keyed by exact price. No server-held key — owner signs createItem.
  private poolCol() { return this.conn.collection("money_settlement_items"); }

  /** Atomically claim the oldest AVAILABLE lot at a price for a purchase. */
  async claimSettlementItem(price: number, purchaseId: string) {
    const res: any = await this.poolCol().findOneAndUpdate(
      { price, network: ACTIVE_MONEY_NETWORK, status: "AVAILABLE" },
      { $set: { status: "RESERVED", purchaseId, reservedAt: new Date() } },
      { returnDocument: "after", sort: { createdAt: 1 } },
    );
    const doc = res && (res.value !== undefined ? res.value : res);
    return doc && doc.itemId ? doc : null;
  }

  /** Return a lot to the pool (purchase released BEFORE any on-chain lock). */
  async releaseSettlementItem(purchaseId: string) {
    await this.poolCol().updateOne(
      { purchaseId: String(purchaseId), status: "RESERVED" },
      { $set: { status: "AVAILABLE", purchaseId: null, releasedAt: new Date() } },
    );
  }

  /** Mark a lot consumed (settled/refunded on-chain — cannot be reused). */
  async consumeSettlementItem(purchaseId: string) {
    await this.poolCol().updateOne(
      { purchaseId: String(purchaseId), status: { $in: ["RESERVED", "AVAILABLE"] } },
      { $set: { status: "CONSUMED", consumedAt: new Date() } },
    );
  }

  /** Owner signed createItem(price) in CRM → verify + register lot as AVAILABLE (idempotent). */
  async addSettlementItem(price: number, txHash: string, actor = "admin") {
    const v = await this.chain.verifyItemCreatedOnChain(txHash, ACTIVE_MONEY_NETWORK);
    if (!v.verified || !v.itemId) throw new BadRequestException(`ITEM_CREATE_VERIFY_FAILED: ${v.reason}`);
    const exists = await this.poolCol().findOne({ itemId: v.itemId });
    if (exists) return { added: false, itemId: v.itemId, reason: "ALREADY_STORED" };
    await this.poolCol().insertOne({
      itemId: v.itemId, price: r6(price), network: ACTIVE_MONEY_NETWORK,
      status: "AVAILABLE", createTxHash: txHash, createdBy: actor,
      createBlock: v.blockNumber ?? null, createdAt: new Date(),
    });
    return { added: true, itemId: v.itemId };
  }

  /** Pool stock per price: available / reserved / consumed. */
  async settlementPoolSummary() {
    const rows = await this.poolCol().aggregate([
      { $match: { network: ACTIVE_MONEY_NETWORK } },
      { $group: { _id: { price: "$price", status: "$status" }, n: { $sum: 1 } } },
    ]).toArray();
    const byPrice: Record<string, any> = {};
    for (const r of rows as any[]) {
      const p = String(r._id.price);
      byPrice[p] = byPrice[p] || { price: r._id.price, available: 0, reserved: 0, consumed: 0 };
      if (r._id.status === "AVAILABLE") byPrice[p].available = r.n;
      else if (r._id.status === "RESERVED") byPrice[p].reserved = r.n;
      else if (r._id.status === "CONSUMED") byPrice[p].consumed = r.n;
    }
    return { network: ACTIVE_MONEY_NETWORK, prices: Object.values(byPrice).sort((a: any, b: any) => a.price - b.price) };
  }

  // -------------------------------------------------------- CUSTODY CONFIRM
  /** User submitted the safeMoneyUSD lock tx. Backend RPC-verifies it (idempotent). */
  async confirmCustodyTx(userId: string, purchaseId: string, txHash: string) {
    if (!/^0x[a-fA-F0-9]{64}$/.test(String(txHash || ""))) throw new BadRequestException("INVALID_TX_HASH");
    const p: any = await this.purchaseModel.findById(purchaseId);
    if (!p) throw new NotFoundException("Purchase not found");
    if (String(p.userId) !== String(userId)) throw new BadRequestException("Purchase belongs to another user");
    if (p.flow !== "CUSTODY") throw new BadRequestException("Not a custody purchase");

    // Idempotent: already locked / settled with the same tx → return current state.
    if (["CUSTODY_LOCKED", "OWNER_SETTLEMENT_PENDING", "OWNER_SETTLING", "OWNER_SETTLED", "PROVISIONING", "SETTLED"].includes(p.status)) {
      return this.present(p.toObject());
    }
    if (!["USER_SIGNATURE_REQUIRED", "USER_TX_SUBMITTED", "CUSTODY_ITEM_READY"].includes(p.status)) {
      throw new BadRequestException(`Cannot confirm custody tx from status ${p.status}`);
    }
    p.status = "USER_TX_SUBMITTED";
    p.custody.userLockTxHash = txHash;
    await p.save();

    const v = await this.chain.verifyCustodyLockOnChain(txHash, p.custody.userWallet, ACTIVE_MONEY_NETWORK);
    if (!v.verified) {
      // keep USER_TX_SUBMITTED so the user can retry the SAME tx (no re-pay).
      return { ...this.present(p.toObject()), verification: v };
    }
    if (p.custody.itemId && v.itemId && String(v.itemId) !== String(p.custody.itemId)) {
      throw new BadRequestException(`ITEM_MISMATCH: locked item ${v.itemId} != expected ${p.custody.itemId}`);
    }
    p.status = "CUSTODY_LOCKED";
    p.custody.userLockBlock = v.blockNumber ?? null;
    p.custody.userLockConfirmedAt = new Date();
    if (!p.custody.itemId && v.itemId) p.custody.itemId = String(v.itemId);
    p.paidAt = p.paidAt || new Date();
    await p.save();

    // Auto owner settlement if credential is READY, else park pending.
    const settled = await this.settleOwner(String(p._id), "auto").catch((e) => ({ error: String(e?.message || e) }));
    const fresh: any = await this.purchaseModel.findById(p._id).lean();
    return { ...this.present(fresh), autoSettlement: settled };
  }

  // -------------------------------------------------------- OWNER SETTLEMENT
  /**
   * Owner-signed fee-free settlement. Atomic single-tx guard: only ONE caller
   * can transition CUSTODY_LOCKED/OWNER_SETTLEMENT_PENDING → OWNER_SETTLING, so
   * 10 concurrent calls still produce ONE on-chain tx. Idempotent when SETTLED.
   */
  async settleOwner(purchaseId: string, actor = "admin") {
    const p0: any = await this.purchaseModel.findById(purchaseId).lean();
    if (!p0) throw new NotFoundException("Purchase not found");
    if (["OWNER_SETTLED", "PROVISIONING", "SETTLED"].includes(p0.status)) {
      // Already past on-chain settlement — ensure provisioning finished, idempotently.
      return this.provisionAndFinish(purchaseId);
    }

    const info = await this.chain.ownerSettlementInfo(ACTIVE_MONEY_NETWORK);
    if (!info.ready) {
      await this.purchaseModel.updateOne({ _id: oid(purchaseId), status: { $in: ["CUSTODY_LOCKED", "OWNER_SETTLEMENT_PENDING"] } }, { $set: { status: "OWNER_SETTLEMENT_PENDING", failReason: `PENDING_OPERATOR: ${info.reason}` } });
      const cur: any = await this.purchaseModel.findById(purchaseId).lean();
      return { status: cur.status, pendingReason: info.reason, present: this.present(cur) };
    }

    // Atomic claim: CUSTODY_LOCKED|OWNER_SETTLEMENT_PENDING -> OWNER_SETTLING.
    const claimed: any = await this.purchaseModel.findOneAndUpdate(
      { _id: oid(purchaseId), status: { $in: ["CUSTODY_LOCKED", "OWNER_SETTLEMENT_PENDING"] } },
      { $set: { status: "OWNER_SETTLING", "custody.ownerCredentialId": info.address ? "active" : "" } },
      { new: true },
    );
    if (!claimed) {
      // Someone else is settling (OWNER_SETTLING) or state advanced — return current.
      const cur: any = await this.purchaseModel.findById(purchaseId).lean();
      return { status: cur.status, present: this.present(cur), note: "settlement already in progress or done" };
    }

    // Pre-broadcast invariants re-check.
    if (!claimed.custody?.itemId) {
      await this.purchaseModel.updateOne({ _id: claimed._id }, { $set: { status: "MANUAL_REVIEW", failReason: "no itemId at settlement" } });
      throw new BadRequestException("OWNER_SETTLEMENT_FAILED: missing itemId");
    }

    try {
      const res = await this.chain.executeOwnerResolve(claimed.custody.itemId, false, ACTIVE_MONEY_NETWORK);
      await this.purchaseModel.updateOne({ _id: claimed._id }, {
        $set: {
          status: "OWNER_SETTLED",
          "custody.ownerSettlementTxHash": res.txHash,
          "custody.ownerAddress": info.address || "",
          "custody.ownerSettledAt": new Date(),
        },
      });
    } catch (e: any) {
      await this.purchaseModel.updateOne({ _id: claimed._id }, { $set: { status: "OWNER_SETTLEMENT_FAILED", failReason: String(e?.message || e).slice(0, 200) } });
      // Retryable: leave for retry/MANUAL_REVIEW (funds stay custody-locked, never lost).
      throw new BadRequestException(`OWNER_SETTLEMENT_FAILED: ${String(e?.message || e)}`);
    }

    return this.provisionAndFinish(purchaseId);
  }

  /** After OWNER_SETTLED: ledger DEBIT (idempotent) + provision subscription → SETTLED. */
  async provisionAndFinish(purchaseId: string) {
    const p: any = await this.purchaseModel.findById(purchaseId);
    if (!p) throw new NotFoundException("Purchase not found");
    if (p.status === "SETTLED") return this.present(p.toObject());
    if (!["OWNER_SETTLED", "PROVISIONING"].includes(p.status)) {
      // Not yet settled on-chain — nothing to provision.
      return this.present(p.toObject());
    }
    p.status = "PROVISIONING"; await p.save();

    try {
      // Ledger DEBIT once (only AFTER on-chain owner settlement).
      await this.money.writeLedgerEntry({
        userId: p.userId, asset: p.settlementAsset, network: p.network, type: "PURCHASE", direction: "DEBIT",
        amount: p.amount, referenceType: "PURCHASE", referenceId: String(p._id),
        idempotencyKey: `purchase_settlement:${p._id}`, metadata: { productCode: p.productCode, planCode: p.planCode, flow: "CUSTODY", ownerTx: p.custody?.ownerSettlementTxHash },
      });

      // Provision via canonical SubscriptionService (renewal-aware).
      let subscriptionId = p.subscriptionId;
      let credits = p.aiCreditsGranted;
      if (!subscriptionId) {
        const productType = p.productCode || "FOMO_AI";
        const existingSub: any = await this.conn.collection("entitlement_subscriptions").findOne({ userId: p.userId, productType, status: { $in: ["ACTIVE", "GRACE_PERIOD"] } });
        if (existingSub) {
          const days = Number(p.productSnapshot?.durationDays) || 30;
          await this.subs.extend(String(existingSub._id), days);
          subscriptionId = String(existingSub._id);
          p.isRenewal = true;
        } else {
          const sub: any = await this.subs.create({ userId: String(p.userId), planCode: p.planCode, source: "CRYPTO_PAYMENT" } as any);
          await this.subs.activate(String(sub._id));
          subscriptionId = String(sub._id);
        }
        credits = Number(p.productSnapshot?.aiCredits) || 0;
      }
      p.subscriptionId = subscriptionId;
      p.aiCreditsGranted = credits;
      p.status = "SETTLED";
      p.settledAt = new Date();
      await p.save();
      return this.present(p.toObject());
    } catch (e: any) {
      p.status = "PROVISIONING_FAILED"; p.failReason = String(e?.message || e).slice(0, 200); await p.save();
      // Money already moved on-chain to platform → refund must go back on-chain.
      await this.purchaseModel.updateOne({ _id: p._id }, { $set: { status: "REFUND_REQUIRED" } });
      throw new BadRequestException(`PROVISIONING_FAILED → REFUND_REQUIRED: ${p.failReason}`);
    }
  }

  // ---------------------------------------------------------------- REFUND
  /**
   * Pre-settlement refund: funds are custody-locked but NOT yet owner-settled →
   * owner adminResolveUSD(itemId, refundToBuyer=true, takeFee=false) returns the
   * escrow to the buyer, then release the ledger reservation. If already
   * OWNER_SETTLED, a simple reverse is NOT assumed → REFUND_MANUAL_REVIEW.
   */
  async refund(purchaseId: string, actor = "admin") {
    const p: any = await this.purchaseModel.findById(purchaseId);
    if (!p) throw new NotFoundException("Purchase not found");
    if (p.status === "REFUNDED") return this.present(p.toObject());

    if (["OWNER_SETTLED", "PROVISIONING", "SETTLED"].includes(p.status)) {
      p.status = "REFUND_MANUAL_REVIEW";
      p.failReason = "Post-settlement refund cannot be auto-reversed on this contract; requires manual/forensic handling.";
      await p.save();
      throw new BadRequestException("REFUND_MANUAL_REVIEW: funds already settled to platform seller.");
    }
    if (!["CUSTODY_LOCKED", "OWNER_SETTLEMENT_PENDING", "REFUND_REQUIRED", "REFUND_PENDING"].includes(p.status)) {
      // Pre-lock states: nothing on-chain to refund; just cancel + release reservation.
      p.status = "RELEASED"; await p.save();
      return this.present(p.toObject());
    }

    p.status = "REFUND_PENDING"; await p.save();
    const info = await this.chain.ownerSettlementInfo(ACTIVE_MONEY_NETWORK);
    if (!info.ready) {
      p.failReason = `PENDING_OPERATOR: owner credential required for on-chain refund (${info.reason})`; await p.save();
      return { status: "REFUND_PENDING", pendingReason: info.reason, present: this.present(p.toObject()) };
    }
    try {
      const res = await this.chain.executeOwnerResolve(p.custody.itemId, true, ACTIVE_MONEY_NETWORK);
      p.custody.refundTxHash = res.txHash;
      p.custody.refundedAt = new Date();
      p.status = "REFUNDED";
      p.settledAt = p.settledAt || new Date();
      await p.save();
      // No ledger DEBIT happened pre-settlement, so releasing the reservation is
      // simply leaving REFUNDED (excluded from RESERVED_STATUSES).
      return this.present(p.toObject());
    } catch (e: any) {
      p.status = "REFUND_MANUAL_REVIEW"; p.failReason = String(e?.message || e).slice(0, 200); await p.save();
      throw new BadRequestException(`REFUND failed → MANUAL_REVIEW: ${p.failReason}`);
    }
  }

  // ============================================================
  // H5 — CLIENT-SIGNED owner actions (operator connects the owner
  // wallet in the CRM and signs createItem / adminResolveUSD; the
  // backend holds NO owner key and only verifies the resulting tx).
  // ============================================================

  /** Tell the CRM exactly what the connected owner wallet must sign next. */
  async prepareOwnerAction(purchaseId: string) {
    const p: any = await this.purchaseModel.findById(purchaseId).lean();
    if (!p) throw new NotFoundException("Purchase not found");
    if (p.flow !== "CUSTODY") throw new BadRequestException("Not a custody purchase");

    if (["OWNER_SETTLED", "PROVISIONING", "SETTLED"].includes(p.status)) {
      return { purchaseId, action: "none", done: true, status: p.status, message: "Уже сеттлмент выполнен." };
    }
    if (["REFUNDED"].includes(p.status)) {
      return { purchaseId, action: "none", done: true, status: p.status, message: "Возврат уже выполнен." };
    }

    const amount = Number(p.amount);
    // No settlement lot yet → owner must create it first (fee-free per-purchase item).
    if (!p.custody?.itemId) {
      const params = await this.chain.createItemParams(amount, ACTIVE_MONEY_NETWORK);
      return {
        purchaseId, action: "createItem", status: p.status, amount,
        contract: params.contract, args: params.args, priceHuman: params.priceHuman,
        message: "Создайте расчётный лот (createItem). Подпись кошельком-владельцем.",
      };
    }
    // Item exists → owner settles it fee-free.
    const cs = await this.chain.custodyConnectStatus(ACTIVE_MONEY_NETWORK);
    return {
      purchaseId, action: "adminResolve", status: p.status, amount,
      contract: cs.contract, itemId: String(p.custody.itemId), refundToBuyer: false, takeFee: false,
      message: "Подтвердите сеттлмент (adminResolveUSD, без комиссии). Подпись кошельком-владельцем.",
    };
  }

  /** Owner signed createItem in the CRM → verify + record itemId, advance to USER_SIGNATURE_REQUIRED. */
  async submitItemCreated(purchaseId: string, txHash: string) {
    const p: any = await this.purchaseModel.findById(purchaseId);
    if (!p) throw new NotFoundException("Purchase not found");
    if (p.flow !== "CUSTODY") throw new BadRequestException("Not a custody purchase");
    if (p.custody?.itemId) return this.present(p.toObject()); // idempotent

    const v = await this.chain.verifyItemCreatedOnChain(txHash, ACTIVE_MONEY_NETWORK);
    if (!v.verified) throw new BadRequestException(`ITEM_CREATE_VERIFY_FAILED: ${v.reason}`);
    p.custody = p.custody || {};
    p.custody.itemId = v.itemId;
    p.custody.itemCreateTxHash = txHash;
    p.custody.ownerAddress = v.from || p.custody.ownerAddress;
    if (["LEDGER_RESERVED", "CUSTODY_ITEM_PENDING", "CREATED"].includes(p.status)) p.status = "USER_SIGNATURE_REQUIRED";
    await p.save();
    return this.present(p.toObject());
  }

  /** Owner signed adminResolveUSD(itemId,false,false) in the CRM → verify + settle + provision. */
  async submitOwnerSettle(purchaseId: string, txHash: string, actor = "admin") {
    const p: any = await this.purchaseModel.findById(purchaseId);
    if (!p) throw new NotFoundException("Purchase not found");
    if (p.flow !== "CUSTODY") throw new BadRequestException("Not a custody purchase");
    if (["OWNER_SETTLED", "PROVISIONING", "SETTLED"].includes(p.status)) {
      return this.provisionAndFinish(purchaseId); // idempotent
    }
    if (!p.custody?.itemId) throw new BadRequestException("OWNER_SETTLEMENT_FAILED: missing itemId (create the lot first)");

    const v = await this.chain.verifyOwnerResolveOnChain(txHash, p.custody.itemId, false, ACTIVE_MONEY_NETWORK);
    if (!v.verified) throw new BadRequestException(`OWNER_SETTLE_VERIFY_FAILED: ${v.reason}`);

    await this.purchaseModel.updateOne({ _id: p._id }, {
      $set: {
        status: "OWNER_SETTLED",
        "custody.ownerSettlementTxHash": txHash,
        "custody.ownerAddress": v.from || p.custody?.ownerAddress || "",
        "custody.ownerSettlementBlock": v.blockNumber ?? null,
        "custody.ownerSettledAt": new Date(),
        "custody.settledBy": actor,
      },
    });
    await this.consumeSettlementItem(String(p._id)); // lot used on-chain
    return this.provisionAndFinish(purchaseId);
  }

  /** Owner signed adminResolveUSD(itemId,true,false) in the CRM (pre-settlement refund) → verify + REFUNDED. */
  async submitRefund(purchaseId: string, txHash: string, actor = "admin") {
    const p: any = await this.purchaseModel.findById(purchaseId);
    if (!p) throw new NotFoundException("Purchase not found");
    if (p.status === "REFUNDED") return this.present(p.toObject());
    if (["OWNER_SETTLED", "PROVISIONING", "SETTLED"].includes(p.status)) {
      throw new BadRequestException("REFUND_MANUAL_REVIEW: funds already settled to platform seller.");
    }
    if (!p.custody?.itemId) throw new BadRequestException("REFUND_FAILED: missing itemId");

    const v = await this.chain.verifyOwnerResolveOnChain(txHash, p.custody.itemId, true, ACTIVE_MONEY_NETWORK);
    if (!v.verified) throw new BadRequestException(`REFUND_VERIFY_FAILED: ${v.reason}`);
    p.custody.refundTxHash = txHash;
    p.custody.refundedAt = new Date();
    p.custody.refundedBy = actor;
    p.status = "REFUNDED";
    p.settledAt = p.settledAt || new Date();
    await p.save();
    await this.consumeSettlementItem(String(p._id)); // lot used on-chain (refund resolve)
    return this.present(p.toObject());
  }

  // ---------------------------------------------------------------- PRESENT
  private present(p: any) {
    const cu = p.custody || {};
    const custodyAction = p.status === "USER_SIGNATURE_REQUIRED"
      ? { contract: cu.contractAddress, method: "safeMoneyUSD", itemId: cu.itemId, useInternal: true, amount: Number(p.amount).toFixed(6) }
      : null;
    return {
      purchaseId: String(p._id),
      status: p.status,
      flow: p.flow,
      amount: p.amount,
      asset: p.settlementAsset,
      productCode: p.productCode,
      planCode: p.planCode,
      custodyAction,
      custody: {
        contract: cu.contractAddress, itemId: cu.itemId || null,
        userLockTxHash: cu.userLockTxHash || null, userLockConfirmedAt: cu.userLockConfirmedAt || null,
        ownerSettlementTxHash: cu.ownerSettlementTxHash || null, ownerSettledAt: cu.ownerSettledAt || null,
        refundTxHash: cu.refundTxHash || null,
      },
      subscriptionId: p.subscriptionId || null,
      aiCreditsGranted: p.aiCreditsGranted || 0,
      failReason: p.failReason || "",
      operatorPending: ["CUSTODY_ITEM_PENDING", "OWNER_SETTLEMENT_PENDING", "REFUND_PENDING"].includes(p.status),
    };
  }

  async get(purchaseId: string) {
    const p: any = await this.purchaseModel.findById(purchaseId).lean();
    if (!p) throw new NotFoundException("Purchase not found");
    return this.present(p);
  }
}
