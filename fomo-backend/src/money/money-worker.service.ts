import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Purchase } from "./models/purchase.model";
import { MoneyChainService } from "./money-chain.service";
import { ACTIVE_MONEY_NETWORK } from "./money.config";
import { MoneySagaService } from "./money-saga.service";

/*
 * H5 — Auto-retry worker for stuck custody purchases.
 *
 * SAFETY MODEL:
 *   - The backend holds NO signing key, so the worker NEVER broadcasts a new
 *     on-chain tx. It only (a) RE-VERIFIES an already-submitted txHash and
 *     advances the saga, or (b) retries backend-only steps (provisioning).
 *   - Each purchase is claimed with an atomic processing-lock (worker.lockedUntil)
 *     so two instances never process the same operation concurrently.
 *   - Exponential backoff; after MAX_ATTEMPTS a genuinely failing op is parked
 *     as MANUAL_REVIEW. OWNER_SETTLEMENT_PENDING without an owner tx legitimately
 *     awaits the owner and is polled with a long interval (not counted as failure)
 *     until a hard SLA, then flagged for MANUAL_REVIEW.
 */
@Injectable()
export class MoneyWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger("MoneyWorker");
  private timer: any = null;
  private running = false;

  private readonly BACKOFF_MS = [10_000, 30_000, 120_000, 300_000, 900_000];
  private readonly MAX_ATTEMPTS = 5;
  private readonly OWNER_PENDING_POLL_MS = 300_000; // 5 min
  private readonly OWNER_PENDING_SLA_MS = 24 * 3600_000; // 24h → MANUAL_REVIEW
  private readonly LOCK_MS = 120_000;
  private readonly TICK_MS = 20_000;
  private readonly MANAGED = ["USER_TX_SUBMITTED", "OWNER_SETTLED", "PROVISIONING", "OWNER_SETTLEMENT_PENDING"];

  constructor(
    @InjectModel(Purchase.name) private readonly purchaseModel: Model<Purchase>,
    private readonly chain: MoneyChainService,
    private readonly saga: MoneySagaService,
  ) {}

  onModuleInit() {
    if (String(process.env.MONEY_WORKER_DISABLED || "").toLowerCase() === "true") {
      this.log.warn("MoneyWorker disabled via MONEY_WORKER_DISABLED");
      return;
    }
    this.timer = setInterval(() => this.tick().catch((e) => this.log.error(`tick: ${e?.message || e}`)), this.TICK_MS);
    this.log.log("MoneyWorker started (auto-retry stuck custody purchases)");
  }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }

  private async tick() {
    if (this.running) return; // single-flight in this instance
    this.running = true;
    try {
      for (let i = 0; i < 8; i++) {
        const p = await this.claim();
        if (!p) break;
        await this.handle(p);
      }
    } finally { this.running = false; }
  }

  /** Atomically claim one due, unlocked, managed purchase. */
  private async claim(): Promise<any> {
    const now = new Date();
    const res: any = await this.purchaseModel.findOneAndUpdate(
      {
        flow: "CUSTODY",
        status: { $in: this.MANAGED },
        $and: [
          { $or: [{ "worker.nextAttemptAt": { $lte: now } }, { "worker.nextAttemptAt": { $exists: false } }, { "worker.nextAttemptAt": null }] },
          { $or: [{ "worker.lockedUntil": { $lte: now } }, { "worker.lockedUntil": { $exists: false } }, { "worker.lockedUntil": null }] },
        ],
      },
      { $set: { "worker.lockedUntil": new Date(now.getTime() + this.LOCK_MS), "worker.lastRunAt": now } },
      { returnDocument: "after", sort: { "worker.nextAttemptAt": 1, updatedAt: 1 } } as any,
    );
    return res && (res.value !== undefined ? res.value : res);
  }

  private async handle(p: any) {
    const id = String(p._id);
    try {
      if (p.status === "USER_TX_SUBMITTED") {
        if (!p.custody?.userLockTxHash) return this.backoff(id, p, "no userLockTxHash yet");
        const v = await this.chain.verifyCustodyLockOnChain(p.custody.userLockTxHash, p.custody.userWallet, ACTIVE_MONEY_NETWORK);
        if (v.verified) {
          await this.purchaseModel.updateOne({ _id: p._id }, { $set: { status: "OWNER_SETTLEMENT_PENDING", "custody.lockVerifiedAt": new Date() }, $unset: { "worker.nextAttemptAt": "", "worker.lockedUntil": "", "worker.attempts": "" } });
          this.log.log(`${id}: user lock verified → OWNER_SETTLEMENT_PENDING`);
          return;
        }
        return this.backoff(id, p, `lock not verified: ${v.reason}`);
      }

      if (p.status === "OWNER_SETTLED" || p.status === "PROVISIONING") {
        await this.saga.provisionAndFinish(id); // backend-only, safe to retry
        await this.clearWorker(id);
        this.log.log(`${id}: provisioning retried → finished`);
        return;
      }

      if (p.status === "OWNER_SETTLEMENT_PENDING") {
        if (p.custody?.ownerSettlementTxHash) {
          const v = await this.chain.verifyOwnerResolveOnChain(p.custody.ownerSettlementTxHash, p.custody.itemId, false, ACTIVE_MONEY_NETWORK);
          if (v.verified) {
            await this.saga.submitOwnerSettle(id, p.custody.ownerSettlementTxHash, "worker");
            await this.clearWorker(id);
            this.log.log(`${id}: owner settle tx verified → settled`);
            return;
          }
          return this.backoff(id, p, `owner settle tx not verified: ${v.reason}`);
        }
        // Legitimately awaiting the owner's signature — poll slowly, escalate after SLA.
        const ageMs = Date.now() - new Date(p.createdAt || Date.now()).getTime();
        if (ageMs > this.OWNER_PENDING_SLA_MS) return this.escalate(id, "OWNER_SETTLEMENT_SLA_EXCEEDED: awaiting owner > 24h");
        return this.reschedule(id, this.OWNER_PENDING_POLL_MS, { "worker.needsOwnerAction": true });
      }
    } catch (e: any) {
      return this.backoff(id, p, e?.message || String(e));
    }
  }

  private async clearWorker(id: string) {
    await this.purchaseModel.updateOne({ _id: id }, { $unset: { "worker.nextAttemptAt": "", "worker.lockedUntil": "", "worker.attempts": "", "worker.needsOwnerAction": "" } });
  }

  private async reschedule(id: string, delayMs: number, extraSet: any = {}) {
    await this.purchaseModel.updateOne({ _id: id }, { $set: { "worker.nextAttemptAt": new Date(Date.now() + delayMs), ...extraSet }, $unset: { "worker.lockedUntil": "" } });
  }

  private async backoff(id: string, p: any, reason: string) {
    const attempts = Number(p?.worker?.attempts || 0) + 1;
    if (attempts >= this.MAX_ATTEMPTS) return this.escalate(id, `MAX_ATTEMPTS: ${reason}`);
    const delay = this.BACKOFF_MS[Math.min(attempts - 1, this.BACKOFF_MS.length - 1)];
    await this.purchaseModel.updateOne({ _id: id }, { $set: { "worker.attempts": attempts, "worker.lastError": String(reason).slice(0, 300), "worker.nextAttemptAt": new Date(Date.now() + delay) }, $unset: { "worker.lockedUntil": "" } });
    this.log.warn(`${id}: retry ${attempts}/${this.MAX_ATTEMPTS} in ${delay / 1000}s (${reason})`);
  }

  private async escalate(id: string, reason: string) {
    await this.purchaseModel.updateOne({ _id: id }, { $set: { status: "MANUAL_REVIEW", failReason: String(reason).slice(0, 300), "worker.escalatedAt": new Date() }, $unset: { "worker.lockedUntil": "", "worker.nextAttemptAt": "" } });
    this.log.error(`${id}: escalated to MANUAL_REVIEW (${reason})`);
  }
}
