import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import { MoneyLedgerEntry } from "./models/money-ledger.model";
import { Purchase } from "./models/purchase.model";
import { SubscriptionService } from "../entitlements/subscription.service";
import { AiAnalyticsService } from "../entitlements/ai/ai-analytics.service";
import { MoneyChainService } from "./money-chain.service";
import { MONEY_NETWORKS, ACTIVE_MONEY_NETWORK, resolveNetworkConfig } from "./money.config";

const r6 = (v: number) => Math.round((Number(v) || 0) * 1e6) / 1e6;
const r4 = (v: number) => Math.round((Number(v) || 0) * 1e4) / 1e4;
const oid = (id: string) => new Types.ObjectId(id);

/**
 * MoneyService (Phase H). Accounting layer on top of the EXISTING zkSync/USDC
 * deposit+withdraw rail. Balances derive from the ledger (available/reserved),
 * never from a mutable field. Reserved = sum of RESERVED purchases + pending
 * withdrawals. FOMO Money is a separate economy from AI Credits.
 */
@Injectable()
export class MoneyService {
  constructor(
    @InjectModel(MoneyLedgerEntry.name) private readonly ledger: Model<any>,
    @InjectModel(Purchase.name) private readonly purchaseModel: Model<any>,
    @InjectModel("Deposit") private readonly depositModel: Model<any>,
    @InjectModel("Withdraw") private readonly withdrawModel: Model<any>,
    @InjectModel("Plan") private readonly planModel: Model<any>,
    private readonly subs: SubscriptionService,
    private readonly aiAnalytics: AiAnalyticsService,
    private readonly chain: MoneyChainService,
    @InjectConnection() private readonly conn: Connection,
  ) {}

  private async writeEntry(e: any) {
    if (e.idempotencyKey) {
      const existing = await this.ledger.findOne({ idempotencyKey: e.idempotencyKey }).lean();
      if (existing) return { entry: existing, duplicate: true };
    }
    try {
      const doc = await this.ledger.create(e);
      return { entry: doc.toObject(), duplicate: false };
    } catch (err: any) {
      if (err?.code === 11000) {
        const existing = await this.ledger.findOne({ idempotencyKey: e.idempotencyKey }).lean();
        return { entry: existing, duplicate: true };
      }
      throw err;
    }
  }

  /** Public, idempotent ledger write used by the H4 custody saga service. */
  async writeLedgerEntry(e: any) { return this.writeEntry(e); }

  /** In-flight purchase statuses that reserve money (committed, not yet DEBITed).
   *  Only states where funds are actually committed on-chain (user submitted a
   *  lock tx) or in the legacy ledger flow reserve. Pre-lock custody states
   *  (CUSTODY_ITEM_PENDING/READY, USER_SIGNATURE_REQUIRED) do NOT reserve — the
   *  user has not moved any funds yet, so an abandoned/unprovisioned checkout
   *  must never block a withdrawal of real balance. */
  static readonly RESERVED_STATUSES = [
    "RESERVED", "PAID", "SETTLING", // legacy LEDGER flow
    "LEDGER_RESERVED",
    "USER_TX_SUBMITTED", "CUSTODY_LOCKED",
    "OWNER_SETTLEMENT_PENDING", "OWNER_SETTLING",
  ];
  /** Statuses where funds are escrowed on-chain but the ledger is not yet debited. */
  static readonly CUSTODY_LOCKED_STATUSES = ["CUSTODY_LOCKED", "OWNER_SETTLEMENT_PENDING", "OWNER_SETTLING"];

  /** Balance for a user+asset, derived from ledger + outstanding reservations. */
  async balance(userId: string, asset = "USDC", network = "ZKSYNC") {
    const agg = await this.ledger.aggregate([
      { $match: { userId: oid(userId), asset } },
      { $group: { _id: "$direction", sum: { $sum: "$amount" } } },
    ]);
    let credit = 0, debit = 0;
    for (const a of agg) { if (a._id === "CREDIT") credit = a.sum; else debit = a.sum; }
    const total = r6(credit - debit);
    const pReserved = await this.purchaseModel.aggregate([
      { $match: { userId: oid(userId), settlementAsset: asset, status: { $in: MoneyService.RESERVED_STATUSES } } },
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]);
    const wResRows = await this.withdrawModel.find({
      $or: [{ userId: oid(userId) }, { userId: userId }],
      status: { $in: [0, 1] }, moneyReserved: true,
    }).select({ amount: 1 }).lean();
    const reserved = r6((pReserved[0]?.sum || 0) + wResRows.reduce((s: number, w: any) => s + (Number(w.amount) || 0), 0));
    return { asset, network, available: r6(total - reserved), reserved, total };
  }

  /**
   * H5 — DOUBLE-SPEND FORENSICS (critical invariant after pure-ledger purchases).
   * Internal purchases DEBIT the MoneyLedger but do NOT reduce the old contract's
   * on-chain usdBalance(user). If a user could call withdrawUSD() directly for their
   * full on-chain balance, they'd double-spend. This compares, per user, the canonical
   * ledger `available` vs on-chain usdBalance(wallet) and flags divergence.
   *   doubleSpendRisk = onChainUsdBalance > ledgerAvailable  (user can pull more than owed)
   */
  async custodyDoubleSpendForensics() {
    const uids: any[] = await this.ledger.distinct("userId");
    const users: any[] = [];
    for (const uid of uids) {
      let ledgerAvailable = 0;
      try { ledgerAvailable = (await this.balance(String(uid))).available; } catch { /* noop */ }
      const u = await this.conn.collection("users").findOne({ _id: uid }, { projection: { wallet: 1 } });
      const wallet = String(u?.wallet || "").toLowerCase();
      let onChainUsdBalance: number | null = null;
      if (wallet) { try { onChainUsdBalance = await this.chain.usdBalanceOf(wallet, ACTIVE_MONEY_NETWORK); } catch { onChainUsdBalance = null; } }
      const delta = onChainUsdBalance == null ? null : r6(onChainUsdBalance - ledgerAvailable);
      const doubleSpendRisk = onChainUsdBalance != null && onChainUsdBalance > ledgerAvailable + 0.000001;
      users.push({ userId: String(uid), wallet: wallet || null, ledgerAvailable, onChainUsdBalance, delta, doubleSpendRisk });
    }
    const atRisk = users.filter((x) => x.doubleSpendRisk);
    const totalExcess = r6(atRisk.reduce((s, x) => s + (x.delta || 0), 0));
    return {
      checked: users.length,
      anyRisk: atRisk.length > 0,
      atRiskCount: atRisk.length,
      totalOnChainExcess: totalExcess,
      note: atRisk.length
        ? "On-chain usdBalance exceeds ledger available for some users. The old contract's withdrawUSD() uses on-chain balance, so a DIRECT contract call could over-withdraw. Enforce settlement (reduce on-chain right after internal purchases) or migrate to a ledger-authoritative withdraw contract before freezing."
        : "No divergence: on-chain usdBalance <= ledger available for all users.",
      users,
    };
  }

  async transactions(userId: string, limit = 100) {
    return this.ledger.find({ userId: oid(userId) }).sort({ createdAt: -1 }).limit(limit).lean();
  }

  /** H5 — auto-discover recent on-chain deposits not yet credited to this user. */
  async recoverableDeposits(userId: string, network = "ZKSYNC") {
    const wallet = String((await this.conn.collection("users").findOne({ _id: oid(userId) }, { projection: { wallet: 1 } }))?.wallet || "").toLowerCase();
    if (!wallet) return { wallet: null, items: [] };
    const candidates = await this.chain.scanIncomingDeposits(wallet, ACTIVE_MONEY_NETWORK);
    if (!candidates.length) return { wallet, items: [] };
    const hashes = candidates.map((c) => c.txHash);
    const credited = await this.depositModel.find({ transactionHash: { $in: hashes } }, { transactionHash: 1 }).lean();
    const creditedSet = new Set((credited as any[]).map((d) => String(d.transactionHash).toLowerCase()));
    const items = candidates
      .filter((c) => !creditedSet.has(String(c.txHash).toLowerCase()))
      .sort((a, b) => b.blockNumber - a.blockNumber);
    return { wallet, items };
  }

  // ---- Deposit: independently verify on-chain, then credit ledger (idempotent) ----
  /**
   * H4/P14 — Deposit Recovery by txHash (code-driven, NO manual ledger edits).
   * Given ANY real on-chain deposit tx to the custody treasury, this RPC-verifies
   * it, upserts the canonical `deposits` record, and credits the MoneyLedger —
   * fully idempotent (by txHash). This is how a "stuck" real deposit becomes the
   * user's FOMO Balance: the balance always DERIVES from confirmed on-chain
   * deposits, we never hand-adjust it.
   */
  async recoverDepositByTx(userId: string, txHash: string, network = "ZKSYNC") {
    if (!/^0x[a-fA-F0-9]{64}$/.test(String(txHash || ""))) throw new BadRequestException("INVALID_TX_HASH");
    const wallet = String((await this.conn.collection("users").findOne({ _id: oid(userId) }, { projection: { wallet: 1 } }))?.wallet || "").toLowerCase();
    if (!wallet) throw new BadRequestException("У пользователя не привязан кошелёк");

    const v = await this.chain.verifyDepositOnChain(txHash, ACTIVE_MONEY_NETWORK);
    if (!v.verified) throw new BadRequestException(`On-chain verification failed: ${v.reason}`);
    if (v.from && String(v.from).toLowerCase() !== wallet) {
      throw new BadRequestException(`WRONG_SENDER: on-chain sender ${v.from} != wallet ${wallet}`);
    }
    const amount = r6(v.amount ?? 0);
    if (amount <= 0) throw new BadRequestException("Deposit amount is zero / not a USDC transfer");

    // Upsert the canonical deposit record (idempotent by unique transactionHash).
    let dep: any = await this.depositModel.findOne({ transactionHash: txHash });
    if (!dep) {
      dep = await this.depositModel.create({
        userId, currency: "USDC", amount, netAmount: amount, serviceFee: 0,
        network, walletAddress: v.from || wallet, transactionHash: txHash,
        status: "confirmed", confirmations: v.confirmations || 0,
      });
    } else if (String(dep.userId) !== String(userId)) {
      throw new BadRequestException("Deposit belongs to another user");
    } else {
      dep.status = "confirmed"; dep.confirmations = v.confirmations || dep.confirmations; await dep.save();
    }

    const { entry, duplicate } = await this.writeEntry({
      userId: oid(userId), asset: "USDC", network, type: "DEPOSIT", direction: "CREDIT",
      amount, referenceType: "DEPOSIT", referenceId: String(dep._id), txHash,
      idempotencyKey: `deposit:${network}:${txHash}`,
      metadata: { recovered: true, onchain: { from: v.from, to: v.to, token: v.token, amount: v.amount, confirmations: v.confirmations, blockNumber: v.blockNumber } },
    });
    return { ok: true, duplicate, credited: duplicate ? 0 : amount, txHash, status: "CREDITED", balance: await this.balance(userId, "USDC", network) };
  }

  async confirmDeposit(userId: string, txHash: string, network = "ZKSYNC") {
    if (!txHash) throw new BadRequestException("txHash required");
    const dep: any = await this.depositModel.findOne({ transactionHash: txHash }).lean();
    if (!dep) throw new NotFoundException("Deposit transaction not found. Submit the on-chain deposit first.");
    if (String(dep.userId) !== String(userId)) throw new BadRequestException("Deposit belongs to another user");
    if (String(dep.userId) !== String(userId)) throw new BadRequestException("Deposit belongs to another user");
    const asset = String(dep.currency || "USDC").toUpperCase();
    const amount = r6(dep.netAmount ?? dep.amount); // credit net of service fee

    // H3 — independent on-chain verification. A frontend-submitted txHash is NOT
    // sufficient. On MAINNET, RPC verification is MANDATORY: if the RPC is
    // missing/unreachable we DO NOT credit — the deposit is parked for manual
    // review. The trust-the-record fallback is allowed ONLY in an explicit
    // non-mainnet dev/test mode (MONEY_ALLOW_DEV_DEPOSIT_TRUST=true).
    const netCfg = await this.chain.netConfig(ACTIVE_MONEY_NETWORK);
    const isMainnet = netCfg.isMainnet;
    const devTrust = String(process.env.MONEY_ALLOW_DEV_DEPOSIT_TRUST || "").toLowerCase() === "true";
    const mode = await this.chain.depositVerificationMode(ACTIVE_MONEY_NETWORK);
    let onchain: any = null;
    if (mode === "RPC_VERIFY") {
      const v = await this.chain.verifyDepositOnChain(txHash, ACTIVE_MONEY_NETWORK);
      if (!v.verified) throw new BadRequestException(`On-chain verification failed: ${v.reason}`);
      // H4/P5 — the on-chain sender MUST be this deposit's (authenticated user's)
      // wallet. Prevents crediting a deposit from someone else's transaction.
      const claimedWallet = String(dep.walletAddress || dep.fromAddress || "").toLowerCase();
      if (v.from && claimedWallet && String(v.from).toLowerCase() !== claimedWallet) {
        throw new BadRequestException(`WRONG_SENDER: on-chain sender ${v.from} != deposit wallet ${claimedWallet}`);
      }
      if (v.amount != null && amount - Number(v.amount) > 0.000001) {
        throw new BadRequestException(`Amount mismatch: ledger ${amount} > on-chain ${v.amount}`);
      }
      onchain = { from: v.from, to: v.to, token: v.token, amount: v.amount, confirmations: v.confirmations, blockNumber: v.blockNumber };
    } else {
      // No live RPC verification available.
      if (isMainnet || !devTrust) {
        await this.depositModel.updateOne({ _id: dep._id }, { $set: { moneyStatus: "VERIFICATION_UNAVAILABLE", moneyReviewReason: "RPC verification unavailable on mainnet" } }).catch(() => {});
        throw new BadRequestException("VERIFICATION_UNAVAILABLE: RPC verification is required on mainnet. Deposit is NOT credited and is pending manual review. Configure a zkSync RPC to enable RPC_VERIFY.");
      }
      // Explicit dev/test only (non-mainnet + flag).
      if (String(dep.status).toLowerCase() !== "confirmed") throw new BadRequestException("Deposit not yet confirmed on-chain");
      onchain = { devTrusted: true };
    }

    const key = `deposit:${network}:${txHash}`;
    const { entry, duplicate } = await this.writeEntry({
      userId: oid(userId), asset, network, type: "DEPOSIT", direction: "CREDIT",
      amount, referenceType: "DEPOSIT", referenceId: String(dep._id), txHash,
      idempotencyKey: key, metadata: { grossAmount: dep.amount, serviceFee: dep.serviceFee, verificationMode: mode, onchain },
    });
    return { ok: true, duplicate, credited: duplicate ? 0 : amount, verificationMode: mode, balance: await this.balance(userId, asset, network) };
  }

  // ---- Purchase + atomic settlement ----
  async checkout(userId: string, body: { planCode?: string; productCode?: string; idempotencyKey?: string }) {
    const plan: any = body.planCode
      ? await this.planModel.findOne({ code: body.planCode }).lean()
      : await this.planModel.findOne({ productType: body.productCode || "FOMO_AI", status: "ACTIVE" }).sort({ sortOrder: 1 }).lean();
    if (!plan) throw new NotFoundException("Product/plan not found");
    const asset = "USDC";
    const amount = r6(plan.priceUsd || 0);
    const bal = await this.balance(userId, asset);
    if (bal.available < amount) {
      throw new BadRequestException(`Insufficient FOMO Balance. Available ${bal.available} ${asset}, need ${amount} ${asset}.`);
    }
    const idem = body.idempotencyKey || `purchase:${userId}:${plan.code}:${Date.now()}`;
    // Reuse an in-flight/settled purchase for the same idempotencyKey.
    const existing: any = await this.purchaseModel.findOne({ idempotencyKey: idem }).lean();
    if (existing) return this.presentPurchase(existing, userId);

    const purchase = await this.purchaseModel.create({
      userId: oid(userId),
      productCode: plan.productType || "FOMO_AI",
      planCode: plan.code,
      productSnapshot: { name: plan.name, priceUsd: plan.priceUsd, durationDays: plan.durationDays, aiCredits: plan.aiCredits ?? plan.aiCreditsIncluded, productVersion: plan.version || 1 },
      settlementAsset: asset,
      amount,
      status: "RESERVED",
      idempotencyKey: idem,
    });
    return this.settle(String(purchase._id));
  }

  /** Idempotent settlement state-machine (safe to resume). */
  async settle(purchaseId: string) {
    const p: any = await this.purchaseModel.findById(purchaseId);
    if (!p) throw new NotFoundException("Purchase not found");
    if (p.status === "SETTLED") return this.presentPurchase(p.toObject(), String(p.userId));
    if (p.status === "FAILED" || p.status === "REFUNDED") throw new BadRequestException(`Purchase is ${p.status}`);

    try {
      p.status = "SETTLING"; await p.save();
      // 1) Debit money ledger (idempotent).
      await this.writeEntry({
        userId: p.userId, asset: p.settlementAsset, network: p.network, type: "PURCHASE", direction: "DEBIT",
        amount: p.amount, referenceType: "PURCHASE", referenceId: String(p._id),
        idempotencyKey: `purchase_settlement:${p._id}`, metadata: { productCode: p.productCode, planCode: p.planCode },
      });
      // 2) Provision product via existing subscription lifecycle (credits granted inside activate).
      let subscriptionId = p.subscriptionId;
      let credits = p.aiCreditsGranted;
      if (!subscriptionId) {
        // Renewal-aware (H34): if the user already has an ACTIVE/GRACE FOMO_AI
        // subscription for the same product, EXTEND the period (new immutable
        // economicsSnapshot + fresh monthly AI-credit grant) instead of creating
        // a parallel subscription. Otherwise create + activate a new one. Either
        // path goes exclusively through the canonical SubscriptionService.
        const productType = p.productCode || "FOMO_AI";
        const existingSub: any = await this.conn.collection("entitlement_subscriptions").findOne({
          userId: p.userId, productType, status: { $in: ["ACTIVE", "GRACE_PERIOD"] },
        });
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
      p.paidAt = p.paidAt || new Date();
      p.settledAt = new Date();
      await p.save();
      return this.presentPurchase(p.toObject(), String(p.userId));
    } catch (e: any) {
      p.status = "FAILED"; p.failReason = String(e?.message || e).slice(0, 200); await p.save();
      // Atomicity: if the money DEBIT was already committed, reverse it with a
      // compensating REFUND so no money is lost when provisioning fails.
      const committed = await this.ledger.findOne({ idempotencyKey: `purchase_settlement:${p._id}` }).lean();
      if (committed) {
        await this.writeEntry({
          userId: p.userId, asset: p.settlementAsset, network: p.network, type: "REFUND", direction: "CREDIT",
          amount: p.amount, referenceType: "PURCHASE", referenceId: String(p._id),
          idempotencyKey: `purchase_refund:${p._id}`, metadata: { reason: "settlement_failed" },
        });
        p.status = "REFUNDED"; await p.save();
      }
      throw new BadRequestException("Settlement failed: " + p.failReason);
    }
  }

  private async presentPurchase(p: any, userId: string) {
    return {
      ok: true,
      purchase: {
        id: String(p._id), productCode: p.productCode, planCode: p.planCode, amount: p.amount,
        asset: p.settlementAsset, status: p.status, subscriptionId: p.subscriptionId,
        aiCreditsGranted: p.aiCreditsGranted, settledAt: p.settledAt,
      },
      balance: await this.balance(userId, p.settlementAsset),
    };
  }

  // ---- Withdraw lifecycle (reserve -> execute via existing engine -> confirm/release) ----
  async requestWithdrawal(userId: string, body: { amount: number; destination: string; asset?: string; network?: string }) {
    const asset = (body.asset || "USDC").toUpperCase();
    const amount = r6(body.amount);
    if (amount <= 0) throw new BadRequestException("Amount must be > 0");
    const bal = await this.balance(userId, asset);
    if (bal.available < amount) throw new BadRequestException(`Insufficient available balance (${bal.available} ${asset}).`);
    // Create a withdraw record reusing the existing model, flagged as money-layer reserved.
    const w = await this.withdrawModel.create({
      userId: String(userId), amount, currency: asset, network: body.network || "ZKSYNC",
      walletAddress: body.destination, status: 0, moneyReserved: true, moneyStatus: "REQUESTED",
    });
    return { ok: true, withdrawalId: String(w._id), balance: await this.balance(userId, asset) };
  }

  /** Admin/worker confirms an on-chain withdrawal -> ledger DEBIT + release reserve. */
  async confirmWithdrawal(withdrawalId: string, txHash?: string) {
    const w: any = await this.withdrawModel.findById(withdrawalId);
    if (!w) throw new NotFoundException("Withdrawal not found");
    const asset = String(w.currency || "USDC").toUpperCase();
    const { duplicate } = await this.writeEntry({
      userId: oid(String(w.userId)), asset, network: w.network || "ZKSYNC", type: "WITHDRAWAL", direction: "DEBIT",
      amount: r6(w.amount), referenceType: "WITHDRAWAL", referenceId: String(w._id), txHash: txHash || "",
      idempotencyKey: `withdrawal:${w._id}`, metadata: {},
    });
    w.status = 2; w.moneyReserved = false; w.moneyStatus = "CONFIRMED"; if (txHash) w.transactionHash = txHash; await w.save();
    return { ok: true, duplicate, balance: await this.balance(String(w.userId), asset) };
  }

  async releaseWithdrawal(withdrawalId: string, reason = "withdrawal failed") {
    const w: any = await this.withdrawModel.findById(withdrawalId);
    if (!w) throw new NotFoundException("Withdrawal not found");
    w.status = 4; w.moneyReserved = false; w.moneyStatus = "RELEASED"; w.reason = reason; await w.save();
    return { ok: true, balance: await this.balance(String(w.userId), String(w.currency || "USDC").toUpperCase()) };
  }

  /**
   * H4/P15 — user-signed (web3) withdrawal confirm. The user calls the contract's
   * native fee-free `withdrawUSD(amount)` in MetaMask; the backend independently
   * RPC-verifies (caller==user wallet, target==contract, selector, confirmations)
   * BEFORE writing the ledger WITHDRAWAL + releasing the reserve. No server signer
   * (WITHDRAWAL_SIGNER) is required for this rail. Idempotent by withdrawal id.
   */
  async confirmWithdrawalWeb3(userId: string, withdrawalId: string, txHash: string) {
    const w: any = await this.withdrawModel.findById(withdrawalId);
    if (!w) throw new NotFoundException("Withdrawal not found");
    if (String(w.userId) !== String(userId)) throw new BadRequestException("Withdrawal belongs to another user");
    const asset = String(w.currency || "USDC").toUpperCase();
    if (String(w.moneyStatus) === "CONFIRMED") return { ok: true, duplicate: true, balance: await this.balance(userId, asset) };

    const wallet = (await this.conn.collection("users").findOne({ _id: oid(userId) }, { projection: { wallet: 1 } }))?.wallet || w.walletAddress || "";
    const v = await this.chain.verifyWithdrawalOnChain(txHash, String(wallet), ACTIVE_MONEY_NETWORK);
    if (!v.verified) {
      w.moneyStatus = "ONCHAIN_PENDING"; w.lastExecutorError = v.reason; if (txHash) w.transactionHash = txHash; await w.save();
      throw new BadRequestException(`WITHDRAWAL_VERIFY_FAILED: ${v.reason}`);
    }
    if (v.amount != null && Math.abs(Number(v.amount) - r6(w.amount)) > 0.000001) {
      throw new BadRequestException(`Amount mismatch: withdrawal ${r6(w.amount)} != on-chain ${v.amount}`);
    }
    const { duplicate } = await this.writeEntry({
      userId: oid(userId), asset, network: w.network || "ZKSYNC", type: "WITHDRAWAL", direction: "DEBIT",
      amount: r6(w.amount), referenceType: "WITHDRAWAL", referenceId: String(w._id), txHash,
      idempotencyKey: `withdrawal:${w._id}`, metadata: { web3: true, onchain: { from: v.from, confirmations: v.confirmations, blockNumber: v.blockNumber } },
    });
    w.status = 2; w.moneyReserved = false; w.moneyStatus = "CONFIRMED"; w.transactionHash = txHash; await w.save();
    return { ok: true, duplicate, credited: 0, debited: r6(w.amount), balance: await this.balance(userId, asset) };
  }

  /**
   * FOMO Intel integration export (pull webhook). Intel access is provisioned on an
   * EXTERNAL site, so this exposes who PAID here (wallet + email + period) so the
   * external admin can grant/revoke access. Read-only; secret-protected in controller.
   */
  async intelEntitlementsExport(productType = "FOMO_INTEL") {
    const subs = await this.conn.collection("entitlement_subscriptions")
      .find({ productType, status: { $in: ["ACTIVE", "GRACE_PERIOD"] } })
      .project({ userId: 1, status: 1, currentPeriodStart: 1, currentPeriodEnd: 1, planCode: 1 })
      .toArray();
    const ids = subs.map((s: any) => { try { return new Types.ObjectId(String(s.userId)); } catch { return null; } }).filter(Boolean) as Types.ObjectId[];
    const users = await this.conn.collection("users").find({ _id: { $in: ids } }).project({ email: 1, wallet: 1, username: 1 }).toArray();
    const uMap: Record<string, any> = {}; users.forEach((u: any) => (uMap[String(u._id)] = u));
    const items = subs.map((s: any) => {
      const u = uMap[String(s.userId)] || {};
      return {
        userId: String(s.userId), email: u.email || "", wallet: (u.wallet || "").toLowerCase(), username: u.username || "",
        product: productType, planCode: s.planCode || "", status: s.status,
        periodStart: s.currentPeriodStart || null, periodEnd: s.currentPeriodEnd || null, accessGranted: true,
      };
    });
    return { product: productType, count: items.length, generatedAt: new Date().toISOString(), items };
  }


  /** H4/P8 — per-user custody reconciliation (on-chain usdBalance vs ledger, custody-lock aware). */
  async custodyReconcileUser(userId: string) {
    const bal = await this.balance(userId);
    const wallet = (await this.conn.collection("users").findOne({ _id: oid(userId) }, { projection: { wallet: 1 } }))?.wallet || "";
    const lockedRows = await this.purchaseModel.aggregate([
      { $match: { userId: oid(userId), settlementAsset: "USDC", flow: "CUSTODY", status: { $in: MoneyService.CUSTODY_LOCKED_STATUSES } } },
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]);
    const custodyLocked = r6(lockedRows[0]?.sum || 0);
    const recon = await this.chain.custodyReconcile(String(wallet), bal.total, bal.reserved, custodyLocked, ACTIVE_MONEY_NETWORK);
    return { userId, wallet: wallet || null, balance: bal, ...recon };
  }

  // ---- Admin ----
  async adjust(userId: string, body: { amount: number; asset?: string; reason: string; reference?: string }, actor: string) {
    const asset = (body.asset || "USDC").toUpperCase();
    const amount = r6(Math.abs(body.amount));
    const direction = body.amount >= 0 ? "CREDIT" : "DEBIT";
    if (!body.reason) throw new BadRequestException("Reason is required");
    const before = await this.balance(userId, asset);
    if (direction === "DEBIT" && before.available < amount) throw new BadRequestException("Adjustment would make available negative");
    await this.writeEntry({
      userId: oid(userId), asset, network: "ZKSYNC", type: "ADMIN_ADJUSTMENT", direction, amount,
      referenceType: "ADMIN", referenceId: body.reference || "", idempotencyKey: `adjust:${userId}:${Date.now()}`,
      metadata: { reason: body.reason, reference: body.reference || "", before: before.total }, createdBy: actor,
    });
    const after = await this.balance(userId, asset);
    return { ok: true, before: before.total, delta: body.amount, after: after.total, balance: after };
  }

  async userMoney(userId: string) {
    const [bal, txns, purchases] = await Promise.all([
      this.balance(userId),
      this.transactions(userId, 50),
      this.purchaseModel.find({ userId: oid(userId) }).sort({ createdAt: -1 }).limit(20).lean(),
    ]);
    const lifetime = await this.ledger.aggregate([
      { $match: { userId: oid(userId) } },
      { $group: { _id: "$type", sum: { $sum: "$amount" } } },
    ]);
    const lt: Record<string, number> = {};
    lifetime.forEach((r: any) => (lt[r._id] = r6(r.sum)));
    return {
      userId, balance: bal,
      lifetime: { deposited: lt.DEPOSIT || 0, withdrawn: lt.WITHDRAWAL || 0, purchases: lt.PURCHASE || 0, adjustments: lt.ADMIN_ADJUSTMENT || 0 },
      transactions: txns, purchases,
    };
  }

  async overview() {
    const byType = await this.ledger.aggregate([{ $group: { _id: "$direction", sum: { $sum: "$amount" } } }]);
    let credit = 0, debit = 0; byType.forEach((r: any) => { if (r._id === "CREDIT") credit = r.sum; else debit = r.sum; });
    const now = Date.now();
    const d = (t: string, since?: Date) => this.ledger.aggregate([{ $match: { type: t, ...(since ? { createdAt: { $gte: since } } : {}) } }, { $group: { _id: null, sum: { $sum: "$amount" }, c: { $sum: 1 } } }]);
    const since30 = new Date(now - 30 * 86400000); const since1 = new Date(now - 86400000);
    const [depLt, dep30, dep1, wdLt, wd30, refLt, ref30] = await Promise.all([
      d("DEPOSIT"), d("DEPOSIT", since30), d("DEPOSIT", since1),
      d("WITHDRAWAL"), d("WITHDRAWAL", since30), d("REFUND"), d("REFUND", since30),
    ]);
    const revenue = await this.purchaseModel.aggregate([
      { $match: { status: "SETTLED" } },
      { $group: { _id: "$productCode", sum: { $sum: "$amount" }, c: { $sum: 1 } } },
    ]);
    const rev: Record<string, number> = {}; const revC: Record<string, number> = {};
    revenue.forEach((r: any) => { rev[r._id] = r6(r.sum); revC[r._id] = r.c; });
    const purLt = await this.purchaseModel.aggregate([{ $match: { status: "SETTLED" } }, { $group: { _id: null, sum: { $sum: "$amount" }, c: { $sum: 1 } } }]);
    const pur30 = await this.purchaseModel.aggregate([{ $match: { status: "SETTLED", settledAt: { $gte: since30 } } }, { $group: { _id: null, sum: { $sum: "$amount" }, c: { $sum: 1 } } }]);
    const pur1 = await this.purchaseModel.aggregate([{ $match: { status: "SETTLED", settledAt: { $gte: since1 } } }, { $group: { _id: null, sum: { $sum: "$amount" }, c: { $sum: 1 } } }]);
    const pendingSettle = await this.purchaseModel.countDocuments({ status: { $in: ["RESERVED", "PAID", "SETTLING"] } });
    const failedSettle = await this.purchaseModel.countDocuments({ status: "FAILED" });
    const refundedCount = await this.purchaseModel.countDocuments({ status: "REFUNDED" });
    const pendingWithdrawals = await this.withdrawModel.countDocuments({ moneyReserved: true });
    const failedWithdrawals = await this.withdrawModel.countDocuments({ moneyStatus: "RELEASED" });
    const confirmedWithdrawals = await this.withdrawModel.countDocuments({ moneyStatus: "CONFIRMED" });
    // Aggregate liability split (available vs reserved) across all users.
    const balances = await this.balancesTable(1000);
    const availTot = r6(balances.items.reduce((s, b) => s + b.available, 0));
    const resvTot = r6(balances.items.reduce((s, b) => s + b.reserved, 0));
    const payers = balances.items.filter((b) => b.total > 0).length;

    return {
      internalFunds: { total: r6(credit - debit), credited: r6(credit), debited: r6(debit) },
      liability: { total: r6(availTot + resvTot), available: availTot, reserved: resvTot, payers },
      deposits: { lifetime: r6(depLt[0]?.sum || 0), last24h: r6(dep1[0]?.sum || 0), last30d: r6(dep30[0]?.sum || 0), count30d: dep30[0]?.c || 0 },
      withdrawals: { confirmedLifetime: r6(wdLt[0]?.sum || 0), last30d: r6(wd30[0]?.sum || 0), count30d: wd30[0]?.c || 0, pending: pendingWithdrawals, confirmed: confirmedWithdrawals, failed: failedWithdrawals },
      purchases: { volumeLifetime: r6(purLt[0]?.sum || 0), volume30d: r6(pur30[0]?.sum || 0), volume24h: r6(pur1[0]?.sum || 0), countLifetime: purLt[0]?.c || 0, count30d: pur30[0]?.c || 0 },
      refunds: { lifetime: r6(refLt[0]?.sum || 0), last30d: r6(ref30[0]?.sum || 0), count: refundedCount },
      realizedRevenue: { fomoAiUsd: rev.FOMO_AI || 0, fomoIntelUsd: rev.FOMO_INTEL || 0, topupUsd: rev.AI_CREDIT_TOPUP || 0, total: r6((rev.FOMO_AI || 0) + (rev.FOMO_INTEL || 0) + (rev.AI_CREDIT_TOPUP || 0)) },
      settlements: { pending: pendingSettle, failed: failedSettle, refunded: refundedCount },
      network: this.activeNetwork(),
    };
  }

  activeNetwork() {
    const cfg = MONEY_NETWORKS[ACTIVE_MONEY_NETWORK] || resolveNetworkConfig();
    return { networkId: cfg.networkId, chainId: cfg.chainId, name: cfg.name, tokenSymbol: cfg.tokenSymbol, decimals: cfg.decimals };
  }

  /** Derive the explicit money-withdrawal state (H26) from record fields. */
  private moneyStatusOf(w: any): string {
    if (w.moneyStatus) return w.moneyStatus;
    if (w.moneyReserved) return "REQUESTED";
    if (Number(w.status) === 2 || w.transactionHash) return "CONFIRMED";
    if (Number(w.status) === 4) return "RELEASED";
    return "REQUESTED";
  }

  // ---- H25: purchases operational table + full chain drill-down ----
  async purchasesTable(limit = 100, status?: string) {
    const q: any = {};
    if (status) q.status = status;
    const rows = await this.purchaseModel.find(q).sort({ createdAt: -1 }).limit(Math.min(limit, 500)).lean();
    const userIds = [...new Set(rows.map((r: any) => String(r.userId)))].map((id) => new Types.ObjectId(id));
    const users = await this.conn.collection("users").find({ _id: { $in: userIds } }).project({ email: 1, wallet: 1, username: 1 }).toArray();
    const uMap: Record<string, any> = {}; users.forEach((u: any) => (uMap[String(u._id)] = u));
    return {
      items: rows.map((p: any) => ({
        id: String(p._id), userId: String(p.userId),
        user: uMap[String(p.userId)] ? { email: uMap[String(p.userId)].email, wallet: uMap[String(p.userId)].wallet, username: uMap[String(p.userId)].username } : null,
        productCode: p.productCode, planCode: p.planCode, amount: p.amount, asset: p.settlementAsset,
        status: p.status, isRenewal: !!p.isRenewal, subscriptionId: p.subscriptionId, aiCreditsGranted: p.aiCreditsGranted,
        createdAt: p.createdAt, settledAt: p.settledAt, failReason: p.failReason || "",
      })),
      total: rows.length,
    };
  }

  async purchaseChain(purchaseId: string) {
    const p: any = await this.purchaseModel.findById(purchaseId).lean();
    if (!p) throw new NotFoundException("Purchase not found");
    const debit: any = await this.ledger.findOne({ idempotencyKey: `purchase_settlement:${p._id}` }).lean();
    const refund: any = await this.ledger.findOne({ idempotencyKey: `purchase_refund:${p._id}` }).lean();
    let sub: any = null;
    if (p.subscriptionId) { try { sub = await this.conn.collection("entitlement_subscriptions").findOne({ _id: new Types.ObjectId(String(p.subscriptionId)) }); } catch { sub = null; } }
    let creditsTx: any = null;
    if (p.subscriptionId) creditsTx = await this.conn.collection("ai_credit_transactions").findOne({ sourceId: String(p.subscriptionId) });

    // H4 — custody saga chain (user lock tx + owner settlement tx + explorer links).
    if (p.flow === "CUSTODY") {
      const cu = p.custody || {};
      const explorer = (tx: string) => (tx ? `https://era.zksync.network/tx/${tx}` : null);
      const csteps = [
        { step: "PURCHASE_CREATED", actor: "USER", ok: true, at: p.createdAt, detail: `${p.productCode} ${p.amount} ${p.settlementAsset}`, idempotencyKey: p.idempotencyKey },
        { step: "MONEY_RESERVED", actor: "PLATFORM", ok: ["LEDGER_RESERVED","CUSTODY_ITEM_PENDING","CUSTODY_ITEM_READY","USER_SIGNATURE_REQUIRED","USER_TX_SUBMITTED","CUSTODY_LOCKED","OWNER_SETTLEMENT_PENDING","OWNER_SETTLING","OWNER_SETTLED","PROVISIONING","SETTLED","REFUNDED","RELEASED"].includes(p.status), at: p.createdAt, detail: `${p.amount} ${p.settlementAsset} reserved` },
        { step: "CUSTODY_ITEM", actor: "PLATFORM_OWNER", ok: !!cu.itemId, at: null, detail: cu.itemId ? `item #${cu.itemId}` : "pending owner signer", txHash: cu.itemCreateTxHash || "", explorer: explorer(cu.itemCreateTxHash) },
        { step: "USER_LOCK", actor: "USER", ok: !!cu.userLockTxHash && !!cu.userLockConfirmedAt, at: cu.userLockConfirmedAt, detail: cu.userLockTxHash ? `safeMoneyUSD lock (block ${cu.userLockBlock ?? "?"})` : "awaiting user MetaMask signature", txHash: cu.userLockTxHash || "", explorer: explorer(cu.userLockTxHash) },
        { step: "OWNER_SETTLEMENT", actor: "PLATFORM_OWNER", ok: !!cu.ownerSettlementTxHash, at: cu.ownerSettledAt, detail: cu.ownerSettlementTxHash ? `adminResolveUSD fee-free (block ${cu.ownerSettlementBlock ?? "?"})` : (p.status === "OWNER_SETTLEMENT_PENDING" ? "PENDING_OPERATOR: owner credential not active" : "not settled"), txHash: cu.ownerSettlementTxHash || "", explorer: explorer(cu.ownerSettlementTxHash) },
        { step: "MONEY_DEBIT", actor: "PLATFORM", ok: !!debit, at: debit?.createdAt, detail: debit ? `-${debit.amount} ${debit.asset}` : "not debited" },
        { step: "SUBSCRIPTION_PROVISIONED", actor: "PLATFORM", ok: !!p.subscriptionId, at: sub?.currentPeriodStart, detail: sub ? `${sub.status}${p.isRenewal ? " (renewal/extend)" : ""}` : "none", id: p.subscriptionId || null },
        { step: "AI_CREDITS_GRANTED", actor: "PLATFORM", ok: Number(p.aiCreditsGranted) > 0, at: creditsTx?.createdAt, detail: `${p.aiCreditsGranted || 0} credits` },
        { step: p.status === "REFUNDED" ? "REFUNDED" : "SETTLED", actor: p.status === "REFUNDED" ? "PLATFORM_OWNER" : "PLATFORM", ok: ["SETTLED", "REFUNDED"].includes(p.status), at: p.settledAt || cu.refundedAt, detail: p.status, error: p.failReason || undefined, txHash: cu.refundTxHash || "", explorer: explorer(cu.refundTxHash) },
      ];
      return { purchase: { id: String(p._id), userId: String(p.userId), flow: "CUSTODY", status: p.status, amount: p.amount, asset: p.settlementAsset, productCode: p.productCode, planCode: p.planCode, custody: cu }, steps: csteps };
    }

    const steps = [
      { step: "PURCHASE_CREATED", ok: true, at: p.createdAt, detail: `${p.productCode} ${p.amount} ${p.settlementAsset}`, id: String(p._id), idempotencyKey: p.idempotencyKey },
      { step: "MONEY_RESERVED", ok: true, at: p.createdAt, detail: `${p.amount} ${p.settlementAsset} reserved`, status: "RESERVED" },
      { step: "MONEY_DEBIT", ok: !!debit, at: debit?.createdAt, detail: debit ? `-${debit.amount} ${debit.asset}` : "not debited", id: debit ? String(debit._id) : null, idempotencyKey: `purchase_settlement:${p._id}` },
      { step: "SUBSCRIPTION_PROVISIONED", ok: !!p.subscriptionId, at: sub?.currentPeriodStart, detail: sub ? `${sub.status} until ${sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toISOString() : "-"}${p.isRenewal ? " (renewal/extend)" : ""}` : "none", id: p.subscriptionId || null },
      { step: "ECONOMICS_SNAPSHOT", ok: !!(sub && sub.economicsSnapshot), at: sub?.currentPeriodStart, detail: sub?.economicsSnapshot ? `price ${sub.economicsSnapshot.priceUsd ?? p.amount} USD` : "none" },
      { step: "AI_CREDITS_GRANTED", ok: Number(p.aiCreditsGranted) > 0, at: creditsTx?.createdAt, detail: `${p.aiCreditsGranted || 0} credits`, id: creditsTx ? String(creditsTx._id) : null },
      { step: p.status === "REFUNDED" ? "REFUNDED" : "SETTLED", ok: ["SETTLED", "REFUNDED"].includes(p.status), at: p.settledAt, detail: p.status, error: p.failReason || undefined },
    ];
    if (refund) steps.push({ step: "COMPENSATING_REFUND", ok: true, at: refund.createdAt, detail: `+${refund.amount} ${refund.asset}`, idempotencyKey: `purchase_refund:${p._id}` } as any);
    return { purchase: { id: String(p._id), userId: String(p.userId), status: p.status, amount: p.amount, asset: p.settlementAsset, productCode: p.productCode, planCode: p.planCode }, steps };
  }

  // ---- H26: withdrawals operational queue ----
  async withdrawalsTable(limit = 100) {
    const rows = await this.withdrawModel.find({ $or: [{ moneyReserved: true }, { moneyStatus: { $exists: true } }] }).sort({ createdAt: -1 }).limit(Math.min(limit, 500)).lean();
    const userIds = [...new Set(rows.map((r: any) => String(r.userId)))].filter(Boolean).map((id) => { try { return new Types.ObjectId(id); } catch { return null; } }).filter(Boolean) as Types.ObjectId[];
    const users = await this.conn.collection("users").find({ _id: { $in: userIds } }).project({ email: 1, wallet: 1 }).toArray();
    const uMap: Record<string, any> = {}; users.forEach((u: any) => (uMap[String(u._id)] = u));
    return {
      items: rows.map((w: any) => ({
        id: String(w._id), userId: String(w.userId),
        user: uMap[String(w.userId)] ? { email: uMap[String(w.userId)].email, wallet: uMap[String(w.userId)].wallet } : null,
        amount: w.amount, asset: (w.currency || "USDC"), destination: w.walletAddress, network: w.network || "ZKSYNC",
        moneyStatus: this.moneyStatusOf(w), txHash: w.transactionHash || "", lastExecutorError: w.lastExecutorError || "",
        requestedAt: w.createdAt, updatedAt: w.updatedAt,
      })),
      total: rows.length,
    };
  }

  // ---- H29: reconciliation read-model (accounting identity) ----
  async reconciliation() {
    const sums: Record<string, number> = {};
    const agg = await this.ledger.aggregate([{ $group: { _id: { type: "$type", dir: "$direction" }, sum: { $sum: "$amount" } } }]);
    agg.forEach((r: any) => { sums[`${r._id.type}:${r._id.dir}`] = r6(r.sum); });
    const confirmedDeposits = sums["DEPOSIT:CREDIT"] || 0;
    const adminCredits = sums["ADMIN_ADJUSTMENT:CREDIT"] || 0;
    const adminDebits = sums["ADMIN_ADJUSTMENT:DEBIT"] || 0;
    const refunds = sums["REFUND:CREDIT"] || 0;
    const settledPurchases = sums["PURCHASE:DEBIT"] || 0;
    const confirmedWithdrawals = sums["WITHDRAWAL:DEBIT"] || 0;
    const calculated = r6(confirmedDeposits + adminCredits + refunds - settledPurchases - confirmedWithdrawals - adminDebits);
    // Independent recomputation from per-user balances.
    const balances = await this.balancesTable(1000);
    const ledgerLiability = r6(balances.items.reduce((s, b) => s + b.total, 0));
    const difference = r6(ledgerLiability - calculated);
    const sources: string[] = [];
    if (Math.abs(difference) > 1e-6) {
      sources.push("Ledger total (per-user) does not match the accounting identity. Check for entries with missing type/direction or manual DB edits.");
    }
    return {
      inputs: { confirmedDeposits, adminCredits, refunds, settledPurchases, confirmedWithdrawals, adminDebits },
      calculatedLiability: calculated,
      ledgerLiability,
      difference,
      status: Math.abs(difference) <= 1e-6 ? "HEALTHY" : "RECONCILIATION_WARNING",
      sources,
    };
  }

  // ---- H30: treasury / network diagnostics (NO secrets) ----
  async diagnostics() {
    const cfg = MONEY_NETWORKS[ACTIVE_MONEY_NETWORK] || resolveNetworkConfig();
    const lastDeposit: any = await this.ledger.findOne({ type: "DEPOSIT" }).sort({ createdAt: -1 }).lean();
    const lastWithdrawal: any = await this.ledger.findOne({ type: "WITHDRAWAL" }).sort({ createdAt: -1 }).lean();
    const lastFailed: any = await this.withdrawModel.findOne({ moneyStatus: "RELEASED" }).sort({ updatedAt: -1 }).lean();
    const executorPk = process.env.MONEY_EXECUTOR_PK || process.env.MONEY_TREASURY_PK || "";
    const rpc = process.env.MONEY_ZKSYNC_RPC_URL || process.env.MONEY_RPC_URL || "";
    const recon = await this.reconciliation();
    return {
      network: { networkId: cfg.networkId, chainId: cfg.chainId, name: cfg.name },
      token: { symbol: cfg.tokenSymbol, address: cfg.tokenAddress, decimals: cfg.decimals },
      treasuryAddress: cfg.treasuryAddress,
      depositEnabled: cfg.depositEnabled,
      withdrawalEnabled: cfg.withdrawalEnabled,
      rpcConfigured: !!rpc,
      executorStatus: executorPk && rpc ? "READY" : "EXECUTOR_NOT_CONFIGURED",
      executorFallback: "MANUAL_CONFIRM",
      lastConfirmedDeposit: lastDeposit ? { at: lastDeposit.createdAt, amount: lastDeposit.amount, txHash: lastDeposit.txHash } : null,
      lastSuccessfulWithdrawal: lastWithdrawal ? { at: lastWithdrawal.createdAt, amount: lastWithdrawal.amount, txHash: lastWithdrawal.txHash } : null,
      lastExecutorError: lastFailed ? { at: lastFailed.updatedAt, error: lastFailed.lastExecutorError } : null,
      reconciliation: { status: recon.status, difference: recon.difference },
    };
  }

  /**
   * H4 — Money analytics for the "Статистика" tab: real daily inflow/outflow
   * series, lifetime totals, funds held in-system vs on the custody contract,
   * and a distribution breakdown. All derived from the real MoneyLedger + chain.
   */
  async moneyStats(days = 30) {
    const since = new Date(Date.now() - days * 86400000);
    const [dayAgg, totalsAgg, dirAgg, onContract, wdCount, wdReqCount] = await Promise.all([
      this.ledger.aggregate([
        { $match: { asset: "USDC", createdAt: { $gte: since } } },
        { $group: { _id: { d: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, type: "$type", dir: "$direction" }, sum: { $sum: "$amount" }, c: { $sum: 1 } } },
      ]),
      this.ledger.aggregate([{ $match: { asset: "USDC" } }, { $group: { _id: { type: "$type", dir: "$direction" }, sum: { $sum: "$amount" }, c: { $sum: 1 } } }]),
      this.ledger.aggregate([{ $match: { asset: "USDC" } }, { $group: { _id: "$direction", sum: { $sum: "$amount" } } }]),
      this.chain.contractTokenBalance(ACTIVE_MONEY_NETWORK),
      this.withdrawModel.countDocuments({ moneyStatus: "CONFIRMED" }).catch(() => 0),
      this.withdrawModel.countDocuments({ $or: [{ moneyReserved: true }, { moneyStatus: { $exists: true } }] }).catch(() => 0),
    ]);

    // daily inflow (DEPOSIT credit) vs outflow (WITHDRAWAL debit)
    const dmap: Record<string, { deposits: number; withdrawals: number; purchases: number }> = {};
    dayAgg.forEach((r: any) => {
      const d = r._id.d; (dmap[d] || (dmap[d] = { deposits: 0, withdrawals: 0, purchases: 0 }));
      if (r._id.type === "DEPOSIT" && r._id.dir === "CREDIT") dmap[d].deposits = r6(r.sum);
      if (r._id.type === "WITHDRAWAL" && r._id.dir === "DEBIT") dmap[d].withdrawals = r6(r.sum);
      if (r._id.type === "PURCHASE" && r._id.dir === "DEBIT") dmap[d].purchases = r6(r.sum);
    });
    const series: any[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dd = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const v = dmap[dd] || { deposits: 0, withdrawals: 0, purchases: 0 };
      series.push({ date: dd, ...v, net: r6(v.deposits - v.withdrawals) });
    }

    const T: Record<string, number> = {};
    totalsAgg.forEach((r: any) => { T[`${r._id.type}:${r._id.dir}`] = r6(r.sum); });
    let credit = 0, debit = 0; dirAgg.forEach((r: any) => { if (r._id === "CREDIT") credit = r6(r.sum); else debit = r6(r.sum); });
    const inSystem = r6(credit - debit);
    const depositsLifetime = T["DEPOSIT:CREDIT"] || 0;
    const withdrawalsLifetime = T["WITHDRAWAL:DEBIT"] || 0;
    const purchasesLifetime = T["PURCHASE:DEBIT"] || 0;

    return {
      days,
      kpis: {
        inSystem,                          // обязательства перед пользователями (в системе)
        onContract: onContract,            // реально держит смарт-контракт (on-chain)
        depositsLifetime, withdrawalsLifetime, purchasesLifetime,
        netInflow: r6(depositsLifetime - withdrawalsLifetime),
        withdrawalsConfirmed: wdCount, withdrawalRequests: wdReqCount,
        reconDelta: onContract == null ? null : r6(onContract - inSystem),
      },
      series,
      distribution: [
        { key: "in_system", label: "В системе (баланс)", value: inSystem },
        { key: "withdrawn", label: "Выведено", value: withdrawalsLifetime },
        { key: "purchases", label: "Покупки", value: purchasesLifetime },
      ].filter((x) => x.value > 0),
    };
  }

  /**
   * H5/P15 — decompose the on-chain custody contract balance by ORIGIN, so the
   * gap between total contract assets and user liabilities is explained, not
   * flagged as a false error. Only a proven mismatch (liabilities > on-chain
   * backing) is CRITICAL; legacy/OTC residue stays "unclassified" and HEALTHY.
   */
  async contractDecomposition() {
    // On-chain reads can return null on a cold RPC connection — retry once so the
    // decomposition never falsely reports "all null / HEALTHY" on first hit.
    const readOnce = () => Promise.all([
      this.chain.contractTokenBalance(ACTIVE_MONEY_NETWORK),
      this.chain.contractOwner(ACTIVE_MONEY_NETWORK),
    ]);
    let [totalAssets, owner] = await readOnce();
    if (totalAssets == null || owner == null) {
      await new Promise((r) => setTimeout(r, 600));
      const retry = await readOnce();
      totalAssets = totalAssets ?? retry[0];
      owner = owner ?? retry[1];
    }
    let platformOwned = owner ? await this.chain.usdBalanceOf(owner, ACTIVE_MONEY_NETWORK) : null;
    if (owner && platformOwned == null) {
      await new Promise((r) => setTimeout(r, 400));
      platformOwned = await this.chain.usdBalanceOf(owner, ACTIVE_MONEY_NETWORK);
    }
    const dirAgg = await this.ledger.aggregate([{ $match: { asset: "USDC" } }, { $group: { _id: "$direction", sum: { $sum: "$amount" } } }]);
    let credit = 0, debit = 0; dirAgg.forEach((r: any) => { if (r._id === "CREDIT") credit = r6(r.sum); else debit = r6(r.sum); });
    const knownUserLiabilities = r6(credit - debit);
    const lockedRows = await this.purchaseModel.aggregate([
      { $match: { settlementAsset: "USDC", flow: "CUSTODY", status: { $in: MoneyService.CUSTODY_LOCKED_STATUSES } } },
      { $group: { _id: null, sum: { $sum: "$amount" } } },
    ]);
    const pendingSettlements = r6(lockedRows[0]?.sum || 0);
    const total = totalAssets == null ? null : r6(totalAssets);
    const known = r6(knownUserLiabilities + (platformOwned || 0) + pendingSettlements);
    const unclassified = total == null ? null : r6(total - known);
    // TRUE mismatch = we owe users MORE than the whole contract holds (unbackable),
    // or negative unclassified (we counted more than exists on-chain). Legacy/OTC
    // residue (unclassified > 0) is EXPECTED and NOT unhealthy.
    const trueMismatch = total == null ? false : (knownUserLiabilities > total + 0.01) || ((unclassified as number) < -0.01);
    // Never show a false-green when on-chain reads are unavailable: report READS_UNAVAILABLE.
    const status = total == null
      ? "READS_UNAVAILABLE"
      : trueMismatch
        ? "CRITICAL_MISMATCH"
        : ((unclassified || 0) > 0.01 ? "HEALTHY_WITH_UNCLASSIFIED" : "HEALTHY");
    // Arithmetic invariant guard: totalAssets ≈ known + platformOwned + pending + unclassified (≤ 1e-6 USDC).
    const invariantSum = total == null ? null : r6(knownUserLiabilities + (platformOwned || 0) + pendingSettlements + (unclassified as number));
    const invariantOk = total == null ? null : Math.abs((total as number) - (invariantSum as number)) <= 0.000001;
    return {
      contractAddress: await this.chain.custodyContract(ACTIVE_MONEY_NETWORK),
      totalAssets: total,
      knownMoneyLiabilities: knownUserLiabilities,
      platformOwned, pendingFomoSettlement: pendingSettlements,
      knownOtcExposure: null, knownLegacyBalances: null,
      unclassified, trueMismatch, status,
      healthy: total == null ? null : !trueMismatch,
      invariantOk, invariantSum,
      components: [
        { key: "known_money_liabilities", label: "Средства пользователей (Money-ledger)", value: knownUserLiabilities },
        { key: "platform_owned", label: "Платформенные средства (owner on-chain)", value: platformOwned },
        { key: "pending_fomo_settlement", label: "Незавершённые сеттлменты FOMO", value: pendingSettlements },
        { key: "known_otc_exposure", label: "OTC/P2P (не индексируется модулем)", value: null },
        { key: "known_legacy_balances", label: "Legacy / внешние пользователи", value: null },
        { key: "unclassified", label: "Не классифицировано текущим Money-модулем", value: unclassified },
      ],
      note: "unclassified — это НЕ ошибка: контракт исторически обслуживает OTC/P2P и старые балансы, которые Money-модуль пока не индексирует. Проблема (CRITICAL_MISMATCH) — только если обязательства перед пользователями превышают активы контракта.",
    };
  }

  /** H4 — owner-settlement readiness + custody item strategy (no secrets). */
  async ownerSettlementStatus() {    const info = await this.chain.ownerSettlementInfo(ACTIVE_MONEY_NETWORK);
    const custodyContract = await this.chain.custodyContract(ACTIVE_MONEY_NETWORK);
    return { ...info, custodyContract, itemStrategy: this.chain.custodyItemStrategy() };
  }

  /**
   * H5 FINAL — Revenue Analytics (compact). Realized revenue from SETTLED
   * purchases only; refunds are excluded (they move out of SETTLED status) and
   * reported separately. Buckets today / 7d / 30d, by-product split, settlement
   * success %, average ticket, and a 30-day daily series for one chart.
   */
  async revenueAnalytics() {
    const dayMs = 86400000;
    const now = Date.now();
    const rows: any[] = await this.purchaseModel.find(
      { status: { $in: ["SETTLED", "REFUNDED"] } },
      { amount: 1, productCode: 1, status: 1, ownerSettledAt: 1, createdAt: 1, refundedAt: 1 },
    ).lean();
    const settled = rows.filter((r) => r.status === "SETTLED");
    const refunded = rows.filter((r) => r.status === "REFUNDED");
    const tOf = (r: any) => new Date(r.ownerSettledAt || r.createdAt || Date.now()).getTime();
    const sumIn = (list: any[], days: number) => list.filter((r) => now - tOf(r) <= days * dayMs).reduce((s, r) => s + (r.amount || 0), 0);

    const revenue = {
      today: sumIn(settled, 1),
      d7: sumIn(settled, 7),
      d30: sumIn(settled, 30),
      all: settled.reduce((s, r) => s + (r.amount || 0), 0),
    };

    const statusRows = await this.purchaseModel.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]);
    const sc: Record<string, number> = {}; statusRows.forEach((r: any) => { sc[r._id] = r.n; });
    const settledCount = settled.length;
    const refundedCount = refunded.length;
    const failedCount = (sc["FAILED"] || 0) + (sc["PROVISIONING_FAILED"] || 0) + (sc["MANUAL_REVIEW"] || 0) + (sc["REFUND_MANUAL_REVIEW"] || 0);
    const terminalTotal = settledCount + refundedCount + failedCount;
    const settlementSuccess = terminalTotal > 0 ? Math.round((settledCount / terminalTotal) * 1000) / 10 : 100;
    const avgTicket = settledCount > 0 ? Math.round((revenue.all / settledCount) * 100) / 100 : 0;
    const refundedAmount = refunded.reduce((s, r) => s + (r.amount || 0), 0);

    const byProduct: Record<string, { revenue: number; count: number }> = {};
    settled.forEach((r) => {
      const k = r.productCode || "UNKNOWN";
      if (!byProduct[k]) byProduct[k] = { revenue: 0, count: 0 };
      byProduct[k].revenue += r.amount || 0;
      byProduct[k].count += 1;
    });

    const chart: { date: string; revenue: number; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * dayMs); d.setHours(0, 0, 0, 0);
      const ds = d.getTime(); const de = ds + dayMs;
      const list = settled.filter((r) => { const t = tOf(r); return t >= ds && t < de; });
      chart.push({ date: new Date(ds).toISOString().slice(0, 10), revenue: Math.round(list.reduce((s, r) => s + (r.amount || 0), 0) * 100) / 100, count: list.length });
    }

    return {
      currency: "USDC",
      revenue,
      purchases: { settled: settledCount, refunded: refundedCount, failed: failedCount },
      settlementSuccess,
      avgTicket,
      refundedAmount,
      byProduct,
      chart,
    };
  }

  /**
   * H5 FINAL — Checkout readiness preflight. Tells the public memberships page,
   * BEFORE the user commits, whether a purchase can complete: money engine
   * reachable, custody owner-settlement ready, and a settlement lot available at
   * each price. Returns a per-price lot pool with a READY/LOW/OUT status + a
   * user-facing message (never leaks "lot"/"item"). CRM gets the precise reason.
   */
  async checkoutReadiness() {
    const MIN_STOCK = 10;
    const [owner, decomp] = await Promise.all([
      this.ownerSettlementStatus().catch(() => null as any),
      this.contractDecomposition().catch(() => null as any),
    ]);
    const custodyReachable = decomp ? decomp.status !== "READS_UNAVAILABLE" : false;
    const moneyEngineHealthy = custodyReachable;
    const ownerSettlementReady = !!owner?.ready;

    const rows = await this.conn.collection("money_settlement_items").aggregate([
      { $match: { network: ACTIVE_MONEY_NETWORK } },
      { $group: { _id: { price: "$price", status: "$status" }, n: { $sum: 1 } } },
    ]).toArray();

    const lots: Record<string, { price: number; available: number; reserved: number; consumed: number; minStock: number; status: string; publicMessage: string; adminReason: string }> = {};
    const ensure = (price: number) => {
      const key = String(price);
      if (!lots[key]) lots[key] = { price, available: 0, reserved: 0, consumed: 0, minStock: MIN_STOCK, status: "OUT", publicMessage: "", adminReason: "" };
      return lots[key];
    };
    rows.forEach((r: any) => {
      const e = ensure(r._id.price);
      if (r._id.status === "AVAILABLE") e.available = r.n;
      else if (r._id.status === "RESERVED") e.reserved = r.n;
      else e.consumed += r.n;
    });
    Object.values(lots).forEach((e) => {
      if (!moneyEngineHealthy || !custodyReachable) {
        e.status = "UNAVAILABLE";
        e.adminReason = "Money engine / custody contract unreachable (RPC).";
      } else if (e.available <= 0) {
        e.status = "OUT";
        e.adminReason = `No available settlement lots for $${e.price}. Create more in Эквайринг → Расчётные лоты.`;
      } else if (e.available < e.minStock) {
        e.status = "LOW";
        e.adminReason = `Settlement lots running low for $${e.price} — ${e.available} left (min ${e.minStock}).`;
      } else {
        e.status = "READY";
      }
      e.publicMessage = e.status === "READY" || e.status === "LOW"
        ? ""
        : "Purchases are temporarily unavailable. Please try again shortly.";
    });

    const globalReady = moneyEngineHealthy && custodyReachable;
    return {
      moneyEngineHealthy,
      custodyReachable,
      ownerSettlementReady,
      minStock: MIN_STOCK,
      globalStatus: globalReady ? "READY" : "UNAVAILABLE",
      lots,
    };
  }

  /**
   * H5/P16 — OPERATOR CONTROL OVERVIEW. A single aggregate for the CRM "Обзор"
   * tab: system health, items needing attention, custody reconciliation and
   * TODAY activity, plus one global status badge (operational / degraded /
   * action_required). Pure read-only composition of existing canonical methods.
   */
  async operatorOverview() {
    const [ov, recon, decomp, owner, forensics] = await Promise.all([
      this.overview().catch(() => null as any),
      this.reconciliation().catch(() => null as any),
      this.contractDecomposition().catch(() => null as any),
      this.ownerSettlementStatus().catch(() => null as any),
      this.custodyDoubleSpendForensics().catch(() => null as any),
    ]);

    // Purchase status histogram (custody + legacy flows).
    const statusRows = await this.purchaseModel.aggregate([{ $group: { _id: "$status", c: { $sum: 1 } } }]);
    const pc: Record<string, number> = {}; statusRows.forEach((r: any) => { pc[r._id] = r.c; });
    const cnt = (...ss: string[]) => ss.reduce((s, k) => s + (pc[k] || 0), 0);

    const manualReview = cnt("MANUAL_REVIEW", "REFUND_MANUAL_REVIEW");
    const provisioningFailed = cnt("PROVISIONING_FAILED", "REFUND_REQUIRED");
    const ownerPending = cnt("OWNER_SETTLEMENT_PENDING", "OWNER_SETTLING", "CUSTODY_LOCKED");
    const itemPending = cnt("CUSTODY_ITEM_PENDING");
    const legacyFailed = cnt("FAILED");
    const pendingWithdrawals = ov?.withdrawals?.pending || 0;
    const failedWithdrawals = ov?.withdrawals?.failed || 0;

    // Settlement lot pool availability (pre-provisioned by the owner in CRM).
    let lotsAvailable = 0;
    try {
      const lotRows = await this.conn.collection("money_settlement_items").aggregate([{ $group: { _id: "$status", c: { $sum: 1 } } }]).toArray();
      lotRows.forEach((r: any) => { if (r._id === "AVAILABLE") lotsAvailable = r.c; });
    } catch { /* noop */ }

    // ---- SYSTEM HEALTH ----
    const rpcOk = decomp ? decomp.status !== "READS_UNAVAILABLE" : false;
    const custodyOk = !!owner?.ready;
    const ledgerOk = recon?.status === "HEALTHY";
    const reconOk = decomp ? !decomp.trueMismatch : false;
    const noDoubleSpend = forensics ? !forensics.anyRisk : true;
    const workerOk = manualReview === 0;
    const systemHealth = [
      { key: "rpc", label: "RPC / zkSync Era", ok: rpcOk, detail: rpcOk ? "on-chain reads OK" : "on-chain reads unavailable" },
      { key: "custody", label: "Custody owner-settlement", ok: custodyOk, detail: owner?.reason || (custodyOk ? "READY" : "not ready") },
      { key: "checkout", label: "Checkout (settlement lots)", ok: rpcOk && lotsAvailable > 0, detail: lotsAvailable > 0 ? `${lotsAvailable} lots available` : "no settlement lots" },
      { key: "ledger", label: "MoneyLedger identity", ok: ledgerOk, detail: recon ? `Δ ${recon.difference}` : "n/a" },
      { key: "reconciliation", label: "On-chain backing", ok: reconOk, detail: decomp?.status || "READS_UNAVAILABLE" },
      { key: "double_spend", label: "Double-spend guard", ok: noDoubleSpend, detail: noDoubleSpend ? "no divergence" : `${forensics?.atRiskCount || 0} at risk` },
      { key: "worker", label: "Auto-retry worker", ok: workerOk, detail: manualReview ? `${manualReview} escalated` : "no escalations" },
    ];

    // ---- NEEDS ATTENTION ----
    const needsAttention = [
      { key: "double_spend_risk", label: "Double-spend риск (on-chain > ledger)", count: forensics?.atRiskCount || 0, severity: "critical" },
      { key: "true_mismatch", label: "Обязательства превышают активы контракта", count: decomp?.trueMismatch ? 1 : 0, severity: "critical" },
      { key: "manual_review", label: "Покупки: требуется ручная проверка", count: manualReview, severity: "critical" },
      { key: "provisioning_failed", label: "Провижининг/возврат требуется", count: provisioningFailed, severity: "warning" },
      { key: "owner_settlement_pending", label: "Ожидают сеттлмент владельцем", count: ownerPending, severity: "warning" },
      { key: "item_pending", label: "Нет расчётного лота для checkout", count: itemPending, severity: "warning" },
      { key: "withdrawals_failed", label: "Выводы: сбой (released)", count: failedWithdrawals, severity: "warning" },
      { key: "legacy_failed", label: "Legacy-покупки: сбой", count: legacyFailed, severity: "warning" },
      { key: "withdrawals_pending", label: "Выводы в резерве (ожидают)", count: pendingWithdrawals, severity: "info" },
    ].filter((x) => x.count > 0);

    // ---- RECONCILIATION ----
    const reconciliation = {
      totalAssets: decomp?.totalAssets ?? null,
      liabilities: decomp?.knownMoneyLiabilities ?? null,
      platformOwned: decomp?.platformOwned ?? null,
      pendingFomoSettlement: decomp?.pendingFomoSettlement ?? null,
      unclassified: decomp?.unclassified ?? null,
      trueMismatch: decomp?.trueMismatch ?? null,
      status: decomp?.status ?? "READS_UNAVAILABLE",
      ledgerIdentity: recon ? { status: recon.status, difference: recon.difference, calculated: recon.calculatedLiability, ledger: recon.ledgerLiability } : null,
      doubleSpend: forensics ? { anyRisk: forensics.anyRisk, atRiskCount: forensics.atRiskCount, totalExcess: forensics.totalOnChainExcess } : null,
    };

    // ---- TODAY ----
    const today = {
      depositsSum: ov?.deposits?.last24h ?? 0,
      purchasesSum: ov?.purchases?.volume24h ?? 0,
      withdrawalsPending: pendingWithdrawals,
      withdrawalsConfirmed: ov?.withdrawals?.confirmed ?? 0,
      liability: ov?.liability ?? null,
      lotsAvailable,
    };

    // ---- GLOBAL STATUS ----
    const critical = !!(forensics?.anyRisk) || !!(decomp?.trueMismatch) || manualReview > 0 || (recon && recon.status !== "HEALTHY");
    const degraded = !rpcOk || !custodyOk || ownerPending > 0 || provisioningFailed > 0 || itemPending > 0 || failedWithdrawals > 0 || ((decomp?.unclassified || 0) > 0.01);
    const globalStatus = critical ? "action_required" : degraded ? "degraded" : "operational";

    return {
      generatedAt: new Date().toISOString(),
      globalStatus,
      network: ov?.network || this.activeNetwork(),
      systemHealth,
      needsAttention,
      reconciliation,
      today,
    };
  }

  // ---- H37: money slice for global Statistics ----
  async statisticsSlice() {
    const ov = await this.overview();
    const settledCount = ov.purchases.countLifetime || 0;
    const avgPurchase = settledCount > 0 ? r6((ov.purchases.volumeLifetime || 0) / settledCount) : 0;
    // Funded = users with any confirmed deposit. Paying = users with >=1 SETTLED purchase.
    const [fundedIds, payingIds, activeSubs] = await Promise.all([
      this.ledger.distinct("userId", { type: "DEPOSIT", direction: "CREDIT" }),
      this.purchaseModel.distinct("userId", { status: "SETTLED" }),
      this.conn.collection("entitlement_subscriptions").countDocuments({ status: { $in: ["ACTIVE", "GRACE_PERIOD"] }, productType: "FOMO_AI" }),
    ]);
    const settlementSuccessPct = (settledCount + (ov.settlements.failed || 0)) > 0
      ? r4(settledCount / (settledCount + (ov.settlements.failed || 0))) : null;
    const refundRatePct = (ov.purchases.countLifetime || 0) > 0
      ? r4((ov.refunds.count || 0) / (ov.purchases.countLifetime || 0)) : null;
    return {
      deposits: ov.deposits, purchases: ov.purchases, withdrawals: ov.withdrawals,
      realizedRevenue: ov.realizedRevenue, refunds: ov.refunds,
      liability: ov.liability,
      fundedUsers: fundedIds.length,
      payingUsers: payingIds.length,
      activeSubscriptions: activeSubs,
      activePayers: ov.liability.payers, averagePurchase: avgPurchase, failedSettlements: ov.settlements.failed,
      settlementSuccessPct, refundRatePct,
      network: ov.network,
    };
  }

  /** H37: daily money timeseries for the Statistics finance charts (deposits/withdrawals/purchases/realized revenue). */
  async statisticsTimeseries(days = 30) {
    const since = new Date(Date.now() - Math.max(1, days) * 86400000);
    const [ledgerRows, purchaseRows] = await Promise.all([
      this.ledger.aggregate([
        { $match: { createdAt: { $gte: since }, type: { $in: ["DEPOSIT", "WITHDRAWAL"] } } },
        { $group: { _id: { d: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, t: "$type" }, sum: { $sum: "$amount" } } },
      ]),
      this.purchaseModel.aggregate([
        { $match: { status: "SETTLED", settledAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$settledAt" } }, sum: { $sum: "$amount" }, c: { $sum: 1 } } },
      ]),
    ]);
    const map: Record<string, any> = {};
    const ensure = (d: string) => (map[d] || (map[d] = { date: d, deposits: 0, withdrawals: 0, purchases: 0, revenue: 0, purchaseCount: 0 }));
    ledgerRows.forEach((r: any) => {
      const row = ensure(r._id.d);
      if (r._id.t === "DEPOSIT") row.deposits = r6(r.sum);
      else row.withdrawals = r6(r.sum);
    });
    purchaseRows.forEach((r: any) => {
      const row = ensure(r._id);
      row.purchases = r6(r.sum); row.revenue = r6(r.sum); row.purchaseCount = r.c;
    });
    const series = Object.values(map).sort((a: any, b: any) => (a.date < b.date ? -1 : 1));
    return { days, series, hasData: series.length > 0 };
  }

  /** Human-readable profitability status from realized revenue vs contribution (canonical, backend-only). */
  private profitabilityStatus(realizedRevenueUsd: number, cogsUsd: number, contributionUsd: number | null, hasActivePaidSub: boolean, targetMarginPct = 0.5): string {
    if ((realizedRevenueUsd || 0) <= 0) {
      // No money actually passed through checkout — access may be NFT/admin grant.
      return (cogsUsd > 0 || hasActivePaidSub) ? "NO_PAID_REVENUE" : "NO_ACTIVITY";
    }
    const margin = (contributionUsd ?? (realizedRevenueUsd - cogsUsd)) / realizedRevenueUsd;
    if (margin < 0) return "OVER_TARGET_COGS";
    if (margin < targetMarginPct) return "AT_RISK";
    return "HEALTHY";
  }

  /**
   * H37: single canonical per-user finance table for the Statistics finance slice.
   * Merges money (balance + lifetime ledger + realized revenue from SETTLED purchases)
   * with the AI economics read-model (AiAnalyticsService.usersList) so numbers stay
   * consistent with Customer 360. The frontend renders these values verbatim.
   */
  async financeUsersTable(limit = 100) {
    const balances = await this.balancesTable(Math.min(limit, 500));
    const ids = balances.items.map((b) => oid(b.userId));

    const [ledgerAgg, revAgg, users, aiUsers] = await Promise.all([
      this.ledger.aggregate([
        { $match: { userId: { $in: ids } } },
        { $group: { _id: { u: "$userId", t: "$type", d: "$direction" }, sum: { $sum: "$amount" } } },
      ]),
      this.purchaseModel.aggregate([
        { $match: { userId: { $in: ids }, status: "SETTLED" } },
        { $group: { _id: "$userId", sum: { $sum: "$amount" }, c: { $sum: 1 } } },
      ]),
      this.conn.collection("users").find({ _id: { $in: ids } }).project({ email: 1, wallet: 1, username: 1 }).toArray(),
      this.aiAnalytics.usersList(500).catch(() => ({ items: [] as any[] })),
    ]);

    const lt: Record<string, Record<string, number>> = {};
    ledgerAgg.forEach((r: any) => { const u = String(r._id.u); (lt[u] || (lt[u] = {}))[`${r._id.t}:${r._id.d}`] = r6(r.sum); });
    const revMap: Record<string, { sum: number; c: number }> = {};
    revAgg.forEach((r: any) => (revMap[String(r._id)] = { sum: r6(r.sum), c: r.c }));
    const uMap: Record<string, any> = {}; users.forEach((u: any) => (uMap[String(u._id)] = u));
    const aiMap: Record<string, any> = {}; (aiUsers.items || []).forEach((a: any) => (aiMap[String(a.userId)] = a));

    const items = balances.items.map((b) => {
      const u = String(b.userId);
      const money = lt[u] || {};
      const ai = aiMap[u] || {};
      const realized = revMap[u]?.sum || 0;
      const cogs = r6(ai.cogs30dUsd || 0);
      const netPlan = ai.netPlanValueUsd != null ? Number(ai.netPlanValueUsd) : null;
      const hasPaidSub = !!(ai.membership && ai.membership !== "—");
      // Contribution = net plan value − COGS (net of payment/infra reserves); margin = contribution / realized.
      const contribution = realized > 0 ? r6((netPlan ?? realized) - cogs) : (cogs > 0 ? r6(-cogs) : 0);
      const margin = realized > 0 ? r4(contribution / realized) : null;
      return {
        userId: u,
        email: uMap[u]?.email || ai.email || "",
        wallet: uMap[u]?.wallet || ai.wallet || "",
        username: uMap[u]?.username || "",
        balance: b.total, available: b.available, reserved: b.reserved,
        deposited: money["DEPOSIT:CREDIT"] || 0,
        withdrawn: money["WITHDRAWAL:DEBIT"] || 0,
        purchased: money["PURCHASE:DEBIT"] || 0,
        membership: ai.membership || "—",
        aiCreditsUsed: ai.spent || 0,
        aiCreditsRemaining: ai.remaining || 0,
        providerCogsUsd: cogs,
        realizedRevenueUsd: realized,
        contributionUsd: contribution,
        marginPct: margin,
        purchaseCount: revMap[u]?.c || 0,
        status: this.profitabilityStatus(realized, cogs, contribution, hasPaidSub),
        lastActivity: b.lastActivity,
      };
    });
    items.sort((a, b) => (b.balance || 0) - (a.balance || 0));
    return { items, total: items.length };
  }

  // ---- H31/H32: Customer 360 finance + unified timeline ----
  async userFinance(userId: string) {
    const uid = oid(userId);
    const [bal, txns, purchases] = await Promise.all([
      this.balance(userId),
      this.transactions(userId, 100),
      this.purchaseModel.find({ userId: uid }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);
    const lifetime = await this.ledger.aggregate([
      { $match: { userId: uid } },
      { $group: { _id: { type: "$type", dir: "$direction" }, sum: { $sum: "$amount" } } },
    ]);
    const lt: Record<string, number> = {}; lifetime.forEach((r: any) => (lt[`${r._id.type}:${r._id.dir}`] = r6(r.sum)));
    // Realized revenue = ONLY money that actually passed through checkout (SETTLED purchases).
    const realized = r6(purchases.filter((p: any) => p.status === "SETTLED").reduce((s: number, p: any) => s + Number(p.amount || 0), 0));
    const sub: any = await this.conn.collection("entitlement_subscriptions").findOne({ userId: uid, productType: "FOMO_AI" }, { sort: { currentPeriodEnd: -1 } as any });
    // AI credits (separate economy — display alongside but never as USD).
    let credits: any = null;
    try {
      const uidVariants = [userId, uid] as any[];
      const lastTx = await this.conn.collection("ai_credit_transactions").find({ userId: { $in: uidVariants } }).sort({ createdAt: -1 }).limit(1).toArray();
      if (lastTx.length) {
        const grantAgg = await this.conn.collection("ai_credit_transactions").aggregate([
          { $match: { userId: { $in: uidVariants }, type: /GRANT/i } },
          { $group: { _id: null, sum: { $sum: "$credits" } } },
        ]).toArray();
        credits = { available: Number(lastTx[0].balanceAfter) || 0, total: Number(grantAgg[0]?.sum) || 0 };
      }
    } catch { credits = null; }
    // Unified timeline (H32).
    const timeline = txns.map((t: any) => ({
      at: t.createdAt, type: t.type, direction: t.direction, amount: t.amount, asset: t.asset,
      txHash: t.txHash || "", referenceType: t.referenceType, referenceId: t.referenceId,
      label: t.type === "PURCHASE" ? (t.metadata?.productCode === "FOMO_AI" ? "FOMO AI Membership" : (t.metadata?.productCode || "Purchase")) : t.type,
    }));
    return {
      userId,
      balance: bal,
      commerce: {
        depositedLifetime: lt["DEPOSIT:CREDIT"] || 0,
        withdrawnLifetime: lt["WITHDRAWAL:DEBIT"] || 0,
        purchasesLifetime: lt["PURCHASE:DEBIT"] || 0,
        refundedLifetime: lt["REFUND:CREDIT"] || 0,
        adjustmentsCredit: lt["ADMIN_ADJUSTMENT:CREDIT"] || 0,
        adjustmentsDebit: lt["ADMIN_ADJUSTMENT:DEBIT"] || 0,
        realizedRevenue: realized,
      },
      subscription: sub ? {
        productType: sub.productType, planCode: sub.planSnapshot?.code, status: sub.status,
        source: sub.source, currentPeriodEnd: sub.currentPeriodEnd,
        // H38/H39: realized revenue is 0 when access came from NFT/ADMIN_GRANT (no money through checkout).
        realizedFromCheckout: ["CRYPTO_PAYMENT", "PURCHASE"].includes(sub.source) ? realized : 0,
        paidAmount: ["CRYPTO_PAYMENT", "PURCHASE"].includes(sub.source) ? realized : 0,
      } : null,
      aiCredits: credits ? { available: credits.available ?? credits.balance ?? 0, total: credits.total ?? credits.granted ?? 0 } : null,
      purchases: purchases.map((p: any) => ({ id: String(p._id), productCode: p.productCode, amount: p.amount, status: p.status, settledAt: p.settledAt, isRenewal: !!p.isRenewal })),
      timeline,
    };
  }

  async balancesTable(limit = 100) {
    const rows = await this.ledger.aggregate([
      { $group: { _id: "$userId", credit: { $sum: { $cond: [{ $eq: ["$direction", "CREDIT"] }, "$amount", 0] } }, debit: { $sum: { $cond: [{ $eq: ["$direction", "DEBIT"] }, "$amount", 0] } }, last: { $max: "$createdAt" } } },
      { $sort: { credit: -1 } },
      { $limit: limit },
    ]);
    const items = await Promise.all(rows.map(async (r: any) => {
      const b = await this.balance(String(r._id));
      return { userId: String(r._id), available: b.available, reserved: b.reserved, total: b.total, lastActivity: r.last };
    }));
    // attach email/wallet for admin search
    try {
      const ids = items.map((i) => { try { return new Types.ObjectId(i.userId); } catch { return null; } }).filter(Boolean) as Types.ObjectId[];
      const users = await this.conn.collection("users").find({ _id: { $in: ids } }).project({ email: 1, wallet: 1, username: 1 }).toArray();
      const uMap: Record<string, any> = {}; users.forEach((u: any) => (uMap[String(u._id)] = u));
      items.forEach((i: any) => { const u = uMap[i.userId] || {}; i.email = u.email || ""; i.wallet = u.wallet || ""; i.username = u.username || ""; });
    } catch { /* noop */ }
    return { items, total: items.length };
  }

  /** Explain Money: full chain for a user/txHash/purchaseId. */
  async explain(q: { userId?: string; txHash?: string; purchaseId?: string }) {
    const steps: any[] = [];
    if (q.txHash) {
      const dep: any = await this.depositModel.findOne({ transactionHash: q.txHash }).lean();
      steps.push({ step: "on_chain_deposit_record", ok: !!dep, detail: dep ? `${dep.currency} ${dep.amount} status=${dep.status}` : "not found" });
      const led = await this.ledger.findOne({ txHash: q.txHash }).lean();
      steps.push({ step: "money_ledger_credit", ok: !!led, detail: led ? `${(led as any).type} ${(led as any).amount}` : "not credited" });
    }
    if (q.purchaseId) {
      const p: any = await this.purchaseModel.findById(q.purchaseId).lean();
      steps.push({ step: "purchase", ok: !!p, detail: p ? `${p.productCode} ${p.amount} status=${p.status}` : "not found" });
      if (p) {
        const led = await this.ledger.findOne({ idempotencyKey: `purchase_settlement:${p._id}` }).lean();
        steps.push({ step: "money_debit", ok: !!led, detail: led ? `${(led as any).amount}` : "not debited" });
        steps.push({ step: "subscription", ok: !!p.subscriptionId, detail: p.subscriptionId || "none" });
        steps.push({ step: "ai_credits_granted", ok: p.aiCreditsGranted > 0, detail: String(p.aiCreditsGranted) });
      }
    }
    if (q.userId) steps.push({ step: "balance", ok: true, detail: JSON.stringify(await this.balance(q.userId)) });
    return { steps };
  }
}
