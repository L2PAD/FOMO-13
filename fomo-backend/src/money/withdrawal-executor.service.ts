import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { MoneyService } from "./money.service";
import { MoneyChainService } from "./money-chain.service";
import { resolveNetworkConfig } from "./money.config";

/**
 * Withdrawal on-chain executor (Phase H / H27-H28, hardened in H3).
 *
 * Reuses the existing zkSync/USDC rail. It does NOT create a second money engine
 * and does NOT change the contract. It drives an explicit money-withdrawal state
 * machine on the existing Withdraw record via a dedicated `moneyStatus` field
 * (legacy numeric `status` is left untouched):
 *
 *   REQUESTED -> RESERVED -> PROCESSING -> ONCHAIN_PENDING -> CONFIRMED
 *                                       \-> FAILED -> RELEASED
 *
 * SECURITY (H28/H3): the signer is resolved by MoneyChainService from the
 * encrypted Credentials Manager (ENV fallback). It is never returned by any API,
 * never shown in CRM, never logged. If the rail is not fully READY the executor
 * returns EXECUTOR_NOT_CONFIGURED / a readiness code and the manual-confirm
 * fallback stays available.
 *
 * IDEMPOTENCY: an atomic claim (executionLock + moneyStatus guard) guarantees a
 * repeated worker/admin action cannot create a second blockchain transfer, and
 * MoneyService.confirmWithdrawal is idempotent by `withdrawal:<id>`.
 */

@Injectable()
export class WithdrawalExecutorService {
  private readonly logger = new Logger("WithdrawalExecutor");

  constructor(
    @InjectModel("Withdraw") private readonly withdrawModel: Model<any>,
    private readonly money: MoneyService,
    private readonly chain: MoneyChainService,
  ) {}

  /** Composite executor readiness (no secret ever exposed). */
  async status(network?: string) {
    const cfg = resolveNetworkConfig(network);
    const readiness = await this.chain.readiness(cfg.networkId);
    return {
      networkId: cfg.networkId,
      configured: readiness.status === "READY",
      status: readiness.status === "READY" ? "READY" : (readiness.status === "NOT_CONFIGURED" ? "EXECUTOR_NOT_CONFIGURED" : readiness.status),
      fallback: "MANUAL_CONFIRM",
      readiness,
    };
  }

  /**
   * Execute a reserved withdrawal on-chain. Idempotent & safe to retry.
   * Returns a code the admin UI can act on.
   */
  async execute(withdrawalId: string) {
    // Atomic claim: only pick up a withdrawal that is money-reserved and not
    // already being processed. This is the idempotency guard.
    const claimed = await this.withdrawModel.findOneAndUpdate(
      {
        _id: withdrawalId,
        moneyReserved: true,
        executionLock: { $ne: true },
        $or: [{ moneyStatus: { $in: [null, "REQUESTED", "RESERVED", "FAILED"] } }, { moneyStatus: { $exists: false } }],
      },
      { $set: { executionLock: true, moneyStatus: "PROCESSING", executionStartedAt: new Date() } },
      { new: true },
    );
    if (!claimed) {
      const w: any = await this.withdrawModel.findById(withdrawalId).lean();
      if (!w) return { ok: false, code: "NOT_FOUND" };
      return { ok: false, code: "NOT_EXECUTABLE", moneyStatus: w.moneyStatus || null };
    }

    const cfg = resolveNetworkConfig(claimed.network);
    const executable = await this.chain.isExecutable(cfg.networkId);
    if (!executable) {
      const readiness = await this.chain.readiness(cfg.networkId);
      // H28: keep the record reserved & confirmable by an admin manually.
      await this.withdrawModel.updateOne(
        { _id: withdrawalId },
        { $set: { moneyStatus: "REQUESTED", executionLock: false, lastExecutorError: readiness.status, lastExecutorAt: new Date() } },
      );
      return { ok: false, code: readiness.status === "NOT_CONFIGURED" ? "EXECUTOR_NOT_CONFIGURED" : readiness.status, fallback: "MANUAL_CONFIRM", readiness };
    }

    try {
      await this.withdrawModel.updateOne({ _id: withdrawalId }, { $set: { moneyStatus: "ONCHAIN_PENDING" } });
      const signer = await this.chain.signerInfo(cfg.networkId);
      const { txHash } = await this.chain.sendUsdc(claimed.walletAddress, Number(claimed.amount), cfg.networkId);
      // Ledger DEBIT + release reserve (idempotent by `withdrawal:<id>`).
      const r = await this.money.confirmWithdrawal(String(withdrawalId), txHash);
      await this.withdrawModel.updateOne(
        { _id: withdrawalId },
        { $set: { moneyStatus: "CONFIRMED", executionLock: false, lastExecutorError: "", lastExecutorAt: new Date(), executedByCredentialId: signer.credentialId || null } },
      );
      return { ok: true, code: "CONFIRMED", txHash, balance: r.balance };
    } catch (e: any) {
      const msg = String(e?.message || e).slice(0, 200);
      // Failure happened before a confirmed on-chain send -> release the reserve.
      try { await this.money.releaseWithdrawal(String(withdrawalId), "executor failed: " + msg); } catch { /* noop */ }
      await this.withdrawModel.updateOne(
        { _id: withdrawalId },
        { $set: { moneyStatus: "RELEASED", executionLock: false, lastExecutorError: msg, lastExecutorAt: new Date() } },
      );
      this.logger.warn(`Withdrawal ${withdrawalId} executor failed -> RELEASED`);
      return { ok: false, code: "FAILED_RELEASED", error: msg };
    }
  }
}
