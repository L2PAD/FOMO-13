import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { randomUUID } from "crypto";
import { hostname } from "os";
import {
  FomoV2LaunchpadChainEvent,
  FomoV2LaunchpadParticipant,
  FomoV2LaunchpadPool,
  FomoV2LaunchpadSyncState,
} from "../models";
import { FomoV2LaunchpadUserAction } from "../types";
import {
  FomoV2LaunchpadChainService,
  FomoV2LaunchpadDecodedEvent,
} from "./launchpad-chain.service";
import { FomoV2LaunchpadDeploymentService } from "./launchpad-deployment.service";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const PARTICIPANT_EVENTS = new Set([
  "Invested",
  "ReceiptMinted",
  "ReceiptUpdated",
  "Claimed",
  "NftStaked",
  "NftUnstaked",
]);
const LEASE_PROGRESS_EVENT_INTERVAL = 50;

class LaunchpadIndexerLeaseLostError extends Error {
  constructor() {
    super("Launchpad indexer lease was lost to another worker.");
    this.name = "LaunchpadIndexerLeaseLostError";
  }
}

@Injectable()
export class FomoV2LaunchpadSyncService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FomoV2LaunchpadSyncService.name);
  private scannerRunning = false;
  private scannerTimer?: NodeJS.Timeout;
  private readonly leaseOwner = `${hostname()}:${process.pid}:${randomUUID()}`;

  constructor(
    @InjectModel(FomoV2LaunchpadPool.name)
    private readonly poolModel: Model<FomoV2LaunchpadPool>,
    @InjectModel(FomoV2LaunchpadParticipant.name)
    private readonly participantModel: Model<FomoV2LaunchpadParticipant>,
    @InjectModel(FomoV2LaunchpadChainEvent.name)
    private readonly chainEventModel: Model<FomoV2LaunchpadChainEvent>,
    @InjectModel(FomoV2LaunchpadSyncState.name)
    private readonly syncStateModel: Model<FomoV2LaunchpadSyncState>,
    private readonly chainService: FomoV2LaunchpadChainService,
    private readonly deploymentService: FomoV2LaunchpadDeploymentService
  ) {}

  async syncPoolById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error("Launchpad pool not found.");
    const pool = await this.poolModel.findById(id);
    if (!pool || !pool.poolId) throw new Error("Launchpad pool not found or not verified.");
    const state = await this.refreshPool(pool);
    return { poolId: pool.poolId, onchainState: state };
  }

  async relinkAndReplayPoolEvents(id: string, snapshotBlock?: number) {
    if (!Types.ObjectId.isValid(id)) throw new Error("Launchpad pool not found.");
    const pool = await this.poolModel.findById(id);
    if (!pool || !pool.poolId) {
      throw new Error("Launchpad pool not found or not verified.");
    }
    return this.relinkAndReplayPool(pool, snapshotBlock);
  }

  async verifyAndApplyUserTransaction(params: {
    pool: any;
    txHash: string;
    action: FomoV2LaunchpadUserAction;
    wallet: string;
  }) {
    const verification = await this.chainService.verifyUserTransaction(
      params.txHash,
      params.action,
      params.pool.poolId,
      params.wallet
    );
    let eventIds: string[] = [];
    if (verification.status === "confirmed") {
      const finalizedBlock = this.latestEventBlock(verification.events);
      eventIds = await this.applyEvents(
        verification.events,
        undefined,
        finalizedBlock
      );
      const document = await this.poolModel.findById(params.pool._id);
      if (document) await this.refreshPool(document, finalizedBlock);
      await this.refreshParticipantFromChain(
        params.pool,
        params.wallet,
        finalizedBlock
      );
    }
    return { ...verification, eventIds };
  }

  async applyEvents(
    events: FomoV2LaunchpadDecodedEvent[],
    heartbeat?: () => Promise<void>,
    snapshotBlock?: number
  ): Promise<string[]> {
    const deployment = this.deploymentService.getDeployment();
    const insertedIds: string[] = [];
    const participantKeys = new Set<string>();
    const affectedPoolIds = new Set<string>();

    await heartbeat?.();
    for (let eventIndex = 0; eventIndex < events.length; eventIndex += 1) {
      if (
        eventIndex > 0 &&
        eventIndex % LEASE_PROGRESS_EVENT_INTERVAL === 0
      ) {
        await heartbeat?.();
      }
      const event = events[eventIndex];
      const onchainPoolId = this.eventPoolId(event);
      const pool = onchainPoolId
        ? await this.poolModel.findOne({
            chainId: deployment.chainId,
            launchpadAddress: deployment.launchpadAddress.toLowerCase(),
            poolId: onchainPoolId,
          })
        : undefined;
      const wallet = this.eventWallet(event);
      let created: any;
      try {
        created = await this.chainEventModel.create({
          launchpadPoolId: pool?._id,
          chainId: deployment.chainId,
          launchpadAddress: deployment.launchpadAddress.toLowerCase(),
          onchainPoolId,
          transactionHash: event.transactionHash.toLowerCase(),
          logIndex: event.logIndex,
          blockNumber: event.blockNumber,
          blockNumberValue: Number(event.blockNumber),
          blockHash: event.blockHash.toLowerCase(),
          eventName: event.eventName,
          walletAddress: wallet,
          receiptTokenId: this.eventReceiptTokenId(event),
          values: event.values,
          observedAt: new Date(),
        });
      } catch (error: any) {
        if (error?.code === 11000) {
          created = await this.chainEventModel.findOne({
            chainId: deployment.chainId,
            launchpadAddress: deployment.launchpadAddress.toLowerCase(),
            transactionHash: event.transactionHash.toLowerCase(),
            logIndex: event.logIndex,
          });
          if (created && pool) {
            await this.chainEventModel.updateOne(
              { _id: created._id },
              {
                $set: {
                  launchpadPoolId: pool._id,
                  onchainPoolId,
                  walletAddress: wallet,
                  receiptTokenId: this.eventReceiptTokenId(event),
                },
              }
            );
          }
        } else {
          throw error;
        }
      }
      if (created?._id) insertedIds.push(String(created._id));
      if (pool) {
        affectedPoolIds.add(String(pool._id));
        // Re-applying absolute pool fields is safe and repairs a crash that
        // happened after the immutable event insert but before aggregation.
        await this.applyPoolEvent(pool, event);
        if (wallet && PARTICIPANT_EVENTS.has(event.eventName)) {
          participantKeys.add(`${String(pool._id)}:${wallet}`);
        }
      }
    }

    for (const key of participantKeys) {
      await heartbeat?.();
      const separator = key.indexOf(":");
      await this.rebuildParticipant(key.slice(0, separator), key.slice(separator + 1));
    }
    for (const poolId of affectedPoolIds) {
      await heartbeat?.();
      const pool = await this.poolModel.findById(poolId);
      if (pool?.poolId) {
        try {
          await this.refreshPool(pool, snapshotBlock);
        } catch (error: any) {
          this.logger.warn(`Pool ${pool.poolId} RPC refresh failed: ${String(error?.message || error)}`);
        }
      }
    }
    await heartbeat?.();
    return insertedIds;
  }

  async runScannerOnce() {
    if (!this.indexerEnabled()) return { enabled: false };
    if (this.scannerRunning) return { enabled: true, skipped: "already_running" };
    this.scannerRunning = true;
    let leasedStateId: any;
    try {
      const deployment = this.deploymentService.getDeployment();
      const startBlock = this.envInt("FOMO_V2_LAUNCHPAD_DEPLOYMENT_BLOCK", 0);
      if (startBlock <= 0) {
        throw new Error("FOMO_V2_LAUNCHPAD_DEPLOYMENT_BLOCK must be configured when indexer is enabled.");
      }
      const head = await this.chainService.getHeadBlockNumber();
      const finalizedHead = Math.max(startBlock - 1, head - deployment.confirmations);
      const leaseTtlMs = this.indexerLeaseTtlMs();
      await this.syncStateModel.updateOne(
        { chainId: deployment.chainId, launchpadAddress: deployment.launchpadAddress.toLowerCase() },
        {
          $setOnInsert: {
            chainId: deployment.chainId,
            launchpadAddress: deployment.launchpadAddress.toLowerCase(),
            nextBlock: String(startBlock),
            consecutiveErrors: 0,
          },
        },
        { upsert: true }
      );
      const now = new Date();
      let state: any = await this.syncStateModel.findOneAndUpdate(
        {
          chainId: deployment.chainId,
          launchpadAddress: deployment.launchpadAddress.toLowerCase(),
          $or: [
            { leaseUntil: { $exists: false } },
            { leaseUntil: { $lte: now } },
          ],
        },
        {
          $set: {
            leaseOwner: this.leaseOwner,
            leaseUntil: new Date(Date.now() + leaseTtlMs),
          },
        },
        { new: true }
      );
      if (!state) return { enabled: true, skipped: "leased_by_another_worker" };
      leasedStateId = state._id;
      const heartbeat = () => this.renewLease(state._id, leaseTtlMs);
      await heartbeat();
      state = await this.rewindIfReorged(state, startBlock, heartbeat);
      const nextBlock = Math.max(startBlock, Number(state.nextBlock || startBlock));
      if (nextBlock > finalizedHead) {
        await this.relinkKnownPoolEvents(finalizedHead, heartbeat);
        await this.refreshStalePools(finalizedHead, heartbeat);
        await heartbeat();
        await this.releaseLease(state._id, { lastSyncedAt: new Date(), lastError: undefined, consecutiveErrors: 0 });
        return { enabled: true, head, finalizedHead, nextBlock, scanned: 0 };
      }
      const batchSize = this.envInt("FOMO_V2_LAUNCHPAD_INDEXER_BLOCK_RANGE", 2_000);
      const toBlock = Math.min(finalizedHead, nextBlock + batchSize - 1);
      await heartbeat();
      const events = await this.chainService.scanEvents(nextBlock, toBlock);
      // The log RPC may be slow. Revalidate ownership before making any
      // canonical-range mutations based on its response.
      await heartbeat();
      await this.reconcileCanonicalRange(nextBlock, toBlock, events, heartbeat);
      await heartbeat();
      const eventIds = await this.applyEvents(events, heartbeat, toBlock);
      await this.relinkKnownPoolEvents(toBlock, heartbeat);
      await this.refreshStalePools(toBlock, heartbeat);
      await heartbeat();
      const finalizedBlockHash = await this.chainService.getBlockHash(toBlock);
      if (!finalizedBlockHash) {
        throw new Error(`RPC did not return a hash for finalized block ${toBlock}.`);
      }
      await heartbeat();
      await this.releaseLease(state._id, {
        nextBlock: String(toBlock + 1),
        finalizedBlock: String(toBlock),
        finalizedBlockHash,
        lastSyncedAt: new Date(),
        lastError: undefined,
        consecutiveErrors: 0,
      });
      return { enabled: true, head, finalizedHead, fromBlock: nextBlock, toBlock, events: eventIds.length };
    } catch (error: any) {
      if (leasedStateId) {
        await this.syncStateModel.updateOne(
          { _id: leasedStateId, leaseOwner: this.leaseOwner },
          {
            $set: { leaseUntil: new Date(0), lastError: String(error?.message || error) },
            $unset: { leaseOwner: 1 },
            $inc: { consecutiveErrors: 1 },
          }
        );
      }
      throw error;
    } finally {
      this.scannerRunning = false;
    }
  }

  async scheduledScan(): Promise<void> {
    if (!this.indexerEnabled()) return;
    try {
      await this.runScannerOnce();
    } catch (error: any) {
      this.logger.error(`Launchpad scanner failed: ${String(error?.message || error)}`);
    }
  }

  onModuleInit(): void {
    if (!this.indexerEnabled()) return;
    this.scannerTimer = setInterval(() => void this.scheduledScan(), 15_000);
    void this.scheduledScan();
  }

  onModuleDestroy(): void {
    if (this.scannerTimer) clearInterval(this.scannerTimer);
  }

  private async refreshPool(
    pool: any,
    snapshotBlock?: number
  ): Promise<Record<string, any>> {
    let finalizedBlock = snapshotBlock;
    if (finalizedBlock === undefined) {
      const head = await this.chainService.getHeadBlockNumber();
      finalizedBlock = Math.max(
        0,
        head - this.deploymentService.getDeployment().confirmations
      );
    }
    const info = await this.chainService.readPoolInfo(pool.poolId, finalizedBlock);
    if (!info.exists) throw new Error(`Pool ${pool.poolId} does not exist on-chain.`);
    const now = new Date();
    const contributionFilter = {
      launchpadPoolId: pool._id,
      $or: [
        { investedAmount: { $regex: /^[0-9]*[1-9][0-9]*$/ } },
        { grossAmount: { $regex: /^[0-9]*[1-9][0-9]*$/ } },
      ],
    };
    const [participantCount, claimedParticipantCount] = await Promise.all([
      this.participantModel.countDocuments(contributionFilter),
      this.participantModel.countDocuments({
        ...contributionFilter,
        claimed: true,
      }),
    ]);
    const previousState =
      pool.onchainState?.toObject?.() || pool.onchainState || {};
    const projectTokenMetadata = await this.resolveProjectTokenMetadata(
      info.projectToken,
      previousState.projectTokenMetadata
    );
    pool.onchainState = {
      ...previousState,
      ...info,
      participantCount,
      claimedParticipantCount,
      ...(projectTokenMetadata ? { projectTokenMetadata } : {}),
      lastSyncedBlock: String(finalizedBlock),
      lastSyncedAt: now,
    };
    if (["active", "closed"].includes(pool.status)) {
      pool.status = info.closed ? "closed" : "active";
    }
    await pool.save();
    return pool.onchainState;
  }

  private async refreshParticipantFromChain(
    pool: any,
    walletAddress: string,
    snapshotBlock?: number
  ): Promise<void> {
    try {
      const state = await this.chainService.readUserState(
        pool.poolId,
        walletAddress,
        snapshotBlock
      );
      const wallet = walletAddress.toLowerCase();
      const set: Record<string, any> = {
        investedAmount: state.investedAmount,
        receiptTokenIds: state.receiptTokenIds,
        activeStakedTokenIds: state.activeStakedTokenIds,
        activeStakeCount: state.activeStakeCount,
        claimed: state.claimed,
        claimKind: state.claimKind,
        lastObservedAt: new Date(),
      };
      // previewClaim is zero after a receipt is burned. Keep the immutable
      // Claimed event amount instead of erasing settlement history.
      if (!state.claimed) set.claimAmount = state.claimAmount;
      await this.participantModel.updateOne(
        { launchpadPoolId: pool._id, walletAddress: wallet },
        {
          $setOnInsert: {
            chainId: pool.chainId,
            launchpadAddress: pool.launchpadAddress,
            onchainPoolId: pool.poolId,
            grossAmount: "0",
            netAmount: "0",
            feeAmount: "0",
          },
          $set: set,
        },
        { upsert: true }
      );
    } catch (error: any) {
      this.logger.warn(`Participant RPC refresh failed: ${String(error?.message || error)}`);
    }
  }

  private async relinkKnownPoolEvents(
    snapshotBlock: number,
    heartbeat?: () => Promise<void>
  ): Promise<void> {
    const deployment = this.deploymentService.getDeployment();
    const unboundPoolIds = await this.chainEventModel.distinct("onchainPoolId", {
      chainId: deployment.chainId,
      launchpadAddress: deployment.launchpadAddress.toLowerCase(),
      onchainPoolId: { $type: "string" },
      $or: [
        { launchpadPoolId: { $exists: false } },
        { launchpadPoolId: null },
      ],
    });
    if (!unboundPoolIds.length) return;
    const pools = await this.poolModel
      .find({
        chainId: deployment.chainId,
        launchpadAddress: deployment.launchpadAddress.toLowerCase(),
        poolId: { $in: unboundPoolIds.map(String) },
      })
      .sort({ _id: 1 })
      .limit(100);
    for (const pool of pools) {
      await heartbeat?.();
      await this.relinkAndReplayPool(pool, snapshotBlock, heartbeat);
    }
  }

  private async relinkAndReplayPool(
    pool: any,
    snapshotBlock?: number,
    heartbeat?: () => Promise<void>
  ): Promise<{ linkedEvents: number; rebuiltParticipants: number }> {
    const eventFilter = {
      chainId: pool.chainId,
      launchpadAddress: String(pool.launchpadAddress).toLowerCase(),
      onchainPoolId: String(pool.poolId),
    };
    const relinked = await this.chainEventModel.updateMany(
      {
        ...eventFilter,
        $or: [
          { launchpadPoolId: { $exists: false } },
          { launchpadPoolId: null },
        ],
      },
      { $set: { launchpadPoolId: pool._id } }
    );
    await heartbeat?.();
    const events: any[] = await this.chainEventModel
      .find({ ...eventFilter, launchpadPoolId: pool._id })
      .lean();
    this.sortChainEvents(events);
    const latestEventBlock = events.reduce<number | undefined>(
      (latest, event) => {
        const block = Number(event.blockNumberValue ?? event.blockNumber);
        if (!Number.isSafeInteger(block) || block < 0) return latest;
        return latest === undefined ? block : Math.max(latest, block);
      },
      undefined
    );
    const refreshSnapshotBlock =
      snapshotBlock === undefined
        ? latestEventBlock
        : latestEventBlock === undefined
          ? snapshotBlock
          : Math.max(snapshotBlock, latestEventBlock);

    const state = {
      ...(pool.onchainState?.toObject?.() || pool.onchainState || {}),
    };
    for (const event of events) {
      switch (event.eventName) {
        case "PoolClosed":
          state.closed = true;
          state.raisedAmount = String(
            event.values?.raisedAmount || state.raisedAmount || "0"
          );
          pool.status = "closed";
          break;
        case "PoolFeeUpdated":
          state.feePercent = String(event.values?.newFeePercent);
          break;
        case "ProjectTokensDeposited":
          state.projectToken = String(
            event.values?.projectToken || ZERO_ADDRESS
          ).toLowerCase();
          state.projectTokenAmount = String(event.values?.amount || "0");
          state.claimEnabled = true;
          state.stakeReleaseEnabled = true;
          break;
      }
    }
    if (events.length) {
      state.lastEventBlock = events[events.length - 1].blockNumber;
      pool.onchainState = state;
      await pool.save();
    }

    const participantWallets = Array.from(
      new Set(
        events
          .filter(
            (event) =>
              PARTICIPANT_EVENTS.has(event.eventName) && event.walletAddress
          )
          .map((event) => String(event.walletAddress).toLowerCase())
      )
    );
    for (const wallet of participantWallets) {
      await heartbeat?.();
      await this.rebuildParticipant(String(pool._id), wallet);
    }

    const contributionFilter = {
      launchpadPoolId: pool._id,
      $or: [
        { investedAmount: { $regex: /^[0-9]*[1-9][0-9]*$/ } },
        { grossAmount: { $regex: /^[0-9]*[1-9][0-9]*$/ } },
      ],
    };
    const [participantCount, claimedParticipantCount] = await Promise.all([
      this.participantModel.countDocuments(contributionFilter),
      this.participantModel.countDocuments({
        ...contributionFilter,
        claimed: true,
      }),
    ]);
    const latestPool = await this.poolModel.findById(pool._id);
    if (latestPool) {
      latestPool.onchainState = {
        ...(latestPool.onchainState?.toObject?.() ||
          latestPool.onchainState || {}),
        participantCount,
        claimedParticipantCount,
      };
      await latestPool.save();
      try {
        // A create may be confirmed after the finalized indexer has already
        // stored later pool events without a backend relation. Never refresh
        // the replayed state at the older create block and roll it backwards.
        await this.refreshPool(latestPool, refreshSnapshotBlock);
      } catch (error: any) {
        this.logger.warn(
          `Relinked pool ${pool.poolId} finalized refresh failed: ${String(
            error?.message || error
          )}`
        );
      }
    }
    return {
      linkedEvents: Number(
        relinked.modifiedCount ?? (relinked as any).nModified ??
          (relinked as any).n ?? 0
      ),
      rebuiltParticipants: participantWallets.length,
    };
  }

  private async applyPoolEvent(pool: any, event: FomoV2LaunchpadDecodedEvent): Promise<void> {
    const state = { ...(pool.onchainState?.toObject?.() || pool.onchainState || {}) };
    switch (event.eventName) {
      case "PoolClosed":
        state.closed = true;
        state.raisedAmount = String(event.values.raisedAmount || state.raisedAmount || "0");
        pool.status = "closed";
        break;
      case "PoolFeeUpdated":
        state.feePercent = String(event.values.newFeePercent);
        break;
      case "ProjectTokensDeposited":
        state.projectToken = String(event.values.projectToken).toLowerCase();
        state.projectTokenAmount = String(event.values.amount);
        state.claimEnabled = true;
        state.stakeReleaseEnabled = true;
        break;
      default:
        return;
    }
    state.lastEventBlock = event.blockNumber;
    pool.onchainState = state;
    await pool.save();
  }

  private async rebuildParticipant(poolId: string, walletAddress: string): Promise<void> {
    const pool = await this.poolModel.findById(poolId).lean();
    if (!pool) return;
    const events: any[] = await this.chainEventModel
      .find({ launchpadPoolId: new Types.ObjectId(poolId), walletAddress })
      .lean();
    this.sortChainEvents(events);
    if (!events.length) {
      await this.participantModel.deleteOne({ launchpadPoolId: pool._id, walletAddress });
      return;
    }
    let gross = BigInt(0);
    let net = BigInt(0);
    let fee = BigInt(0);
    let investedAmount = BigInt(0);
    let claimAmount = BigInt(0);
    let claimed = false;
    const receipts = new Set<string>();
    const staked = new Set<string>();
    for (const event of events) {
      const values = event.values || {};
      if (event.eventName === "Invested") {
        gross += BigInt(values.grossAmount || 0);
        net += BigInt(values.netAmount || 0);
        fee += BigInt(values.feeAmount || 0);
        // ReceiptUpdated/positions are authoritative when available. Gross is
        // the safer event-only fallback; fees must not silently reduce a refund.
        investedAmount += BigInt(values.grossAmount || 0);
      } else if (event.eventName === "ReceiptMinted") {
        receipts.add(String(values.receiptTokenId));
      } else if (event.eventName === "ReceiptUpdated") {
        receipts.add(String(values.receiptTokenId));
        investedAmount = BigInt(values.newAmount || 0);
      } else if (event.eventName === "NftStaked") {
        staked.add(String(values.tokenId));
      } else if (event.eventName === "NftUnstaked") {
        staked.delete(String(values.tokenId));
      } else if (event.eventName === "Claimed") {
        receipts.add(String(values.receiptTokenId));
        investedAmount = BigInt(values.investedAmount || investedAmount);
        claimAmount += BigInt(values.claimAmount || 0);
        claimed = true;
      }
    }
    const projectToken = String((pool as any).onchainState?.projectToken || "").toLowerCase();
    const investToken = String((pool as any).onchainState?.investToken || (pool as any).createParams?.investToken || "").toLowerCase();
    const claimKind =
      projectToken && projectToken !== ZERO_ADDRESS
        ? projectToken === investToken
          ? "payment_token_refund"
          : "project_token"
        : undefined;
    await this.participantModel.updateOne(
      { launchpadPoolId: pool._id, walletAddress },
      {
        $set: {
          chainId: (pool as any).chainId,
          launchpadAddress: (pool as any).launchpadAddress,
          onchainPoolId: (pool as any).poolId,
          grossAmount: gross.toString(),
          netAmount: net.toString(),
          feeAmount: fee.toString(),
          investedAmount: investedAmount.toString(),
          receiptTokenIds: Array.from(receipts),
          activeStakedTokenIds: Array.from(staked),
          activeStakeCount: staked.size,
          claimed,
          claimAmount: claimAmount.toString(),
          claimKind,
          firstSeenBlock: events[0].blockNumber,
          lastSeenBlock: events[events.length - 1].blockNumber,
          lastObservedAt: new Date(),
        },
      },
      { upsert: true }
    );
  }

  private async rewindIfReorged(
    state: any,
    startBlock: number,
    heartbeat?: () => Promise<void>
  ): Promise<any> {
    if (!state.finalizedBlock || !state.finalizedBlockHash) return state;
    const actualHash = await this.chainService.getBlockHash(Number(state.finalizedBlock));
    if (!actualHash) {
      throw new Error(
        `RPC did not return a hash for checkpoint block ${state.finalizedBlock}.`
      );
    }
    if (actualHash === String(state.finalizedBlockHash).toLowerCase()) return state;
    const depth = this.envInt("FOMO_V2_LAUNCHPAD_INDEXER_REORG_DEPTH", 20);
    const rewindBlock = Math.max(startBlock, Number(state.finalizedBlock) - depth);
    await heartbeat?.();
    const affected = await this.chainEventModel
      .find({
        chainId: state.chainId,
        launchpadAddress: state.launchpadAddress,
        blockNumberValue: { $gte: rewindBlock },
      })
      .select("launchpadPoolId walletAddress")
      .lean();
    await heartbeat?.();
    await this.chainEventModel.deleteMany({
      chainId: state.chainId,
      launchpadAddress: state.launchpadAddress,
      blockNumberValue: { $gte: rewindBlock },
    });
    const keys = new Set(
      affected
        .filter((row: any) => row.launchpadPoolId && row.walletAddress)
        .map((row: any) => `${String(row.launchpadPoolId)}:${row.walletAddress}`)
    );
    for (const key of keys) {
      await heartbeat?.();
      const separator = key.indexOf(":");
      await this.rebuildParticipant(key.slice(0, separator), key.slice(separator + 1));
    }
    const affectedPoolIds = Array.from(
      new Set(
        affected
          .map((row: any) => String(row.launchpadPoolId || ""))
          .filter(Boolean)
      )
    );
    for (const poolId of affectedPoolIds) {
      await heartbeat?.();
      const pool = await this.poolModel.findById(poolId);
      if (!pool?.poolId) continue;
      try {
        await this.refreshPool(pool, Number(state.finalizedBlock));
      } catch (error: any) {
        this.logger.warn(`Reorg pool refresh failed for ${pool.poolId}: ${String(error?.message || error)}`);
      }
    }
    state.nextBlock = String(rewindBlock);
    state.finalizedBlock = undefined;
    state.finalizedBlockHash = undefined;
    await heartbeat?.();
    await this.updateStateWhileLeased(state._id, {
      $set: { nextBlock: String(rewindBlock) },
      $unset: { finalizedBlock: 1, finalizedBlockHash: 1 },
    });
    return state;
  }

  private async reconcileCanonicalRange(
    fromBlock: number,
    toBlock: number,
    canonicalEvents: FomoV2LaunchpadDecodedEvent[],
    heartbeat?: () => Promise<void>
  ): Promise<void> {
    const deployment = this.deploymentService.getDeployment();
    const stored: any[] = await this.chainEventModel
      .find({
        chainId: deployment.chainId,
        launchpadAddress: deployment.launchpadAddress.toLowerCase(),
        blockNumberValue: { $gte: fromBlock, $lte: toBlock },
      })
      .lean();
    await heartbeat?.();
    const canonicalKeys = new Set(
      canonicalEvents.map(
        (event) =>
          `${event.transactionHash.toLowerCase()}:${event.logIndex}:${event.blockHash.toLowerCase()}`
      )
    );
    const stale = stored.filter(
      (event) =>
        !canonicalKeys.has(
          `${String(event.transactionHash).toLowerCase()}:${event.logIndex}:${String(
            event.blockHash
          ).toLowerCase()}`
        )
    );
    if (!stale.length) return;
    await heartbeat?.();
    await this.chainEventModel.deleteMany({
      _id: { $in: stale.map((event) => event._id) },
    });
    const participantKeys = new Set(
      stale
        .filter((event) => event.launchpadPoolId && event.walletAddress)
        .map(
          (event) =>
            `${String(event.launchpadPoolId)}:${String(event.walletAddress).toLowerCase()}`
        )
    );
    for (const key of participantKeys) {
      await heartbeat?.();
      const separator = key.indexOf(":");
      await this.rebuildParticipant(key.slice(0, separator), key.slice(separator + 1));
    }
    const poolIds = Array.from(
      new Set(
        stale
          .map((event) => String(event.launchpadPoolId || ""))
          .filter(Boolean)
      )
    );
    for (const poolId of poolIds) {
      await heartbeat?.();
      const pool = await this.poolModel.findById(poolId);
      if (!pool?.poolId) continue;
      try {
        await this.refreshPool(pool, toBlock);
      } catch (error: any) {
        this.logger.warn(
          `Canonical-range reorg refresh failed for ${pool.poolId}: ${String(
            error?.message || error
          )}`
        );
      }
    }
  }

  private async releaseLease(id: any, fields: Record<string, any>): Promise<void> {
    const set: Record<string, any> = { leaseUntil: new Date(0) };
    const unset: Record<string, 1> = { leaseOwner: 1 };
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) unset[key] = 1;
      else set[key] = value;
    }
    const result = await this.syncStateModel.updateOne(
      { _id: id, leaseOwner: this.leaseOwner },
      { $set: set, $unset: unset }
    );
    this.assertLeaseMutation(result);
  }

  private async renewLease(id: any, leaseTtlMs: number): Promise<void> {
    const result = await this.syncStateModel.updateOne(
      { _id: id, leaseOwner: this.leaseOwner },
      { $set: { leaseUntil: new Date(Date.now() + leaseTtlMs) } }
    );
    this.assertLeaseMutation(result);
  }

  private async updateStateWhileLeased(
    id: any,
    update: Record<string, any>
  ): Promise<void> {
    const result = await this.syncStateModel.updateOne(
      { _id: id, leaseOwner: this.leaseOwner },
      update
    );
    this.assertLeaseMutation(result);
  }

  private assertLeaseMutation(result: any): void {
    const matched = result?.matchedCount ?? result?.n;
    if (matched !== undefined && Number(matched) < 1) {
      throw new LaunchpadIndexerLeaseLostError();
    }
    if (result?.acknowledged === false) {
      throw new LaunchpadIndexerLeaseLostError();
    }
  }

  private eventPoolId(event: FomoV2LaunchpadDecodedEvent): string | undefined {
    const value = event.values?.poolId;
    return value === undefined ? undefined : String(value);
  }

  private sortChainEvents(events: any[]): void {
    events.sort((left, right) => {
      const leftBlock = BigInt(left.blockNumber || 0);
      const rightBlock = BigInt(right.blockNumber || 0);
      if (leftBlock !== rightBlock) return leftBlock < rightBlock ? -1 : 1;
      const leftLog = BigInt(left.logIndex || 0);
      const rightLog = BigInt(right.logIndex || 0);
      return leftLog === rightLog ? 0 : leftLog < rightLog ? -1 : 1;
    });
  }

  private eventWallet(event: FomoV2LaunchpadDecodedEvent): string | undefined {
    const value = event.values?.user || event.values?.investor;
    return value ? String(value).toLowerCase() : undefined;
  }

  private eventReceiptTokenId(event: FomoV2LaunchpadDecodedEvent): string | undefined {
    const value = event.values?.receiptTokenId;
    return value === undefined ? undefined : String(value);
  }

  private latestEventBlock(
    events: FomoV2LaunchpadDecodedEvent[]
  ): number | undefined {
    const blocks = events
      .map((event) => Number(event.blockNumber))
      .filter((block) => Number.isSafeInteger(block) && block >= 0);
    return blocks.length ? Math.max(...blocks) : undefined;
  }

  private async resolveProjectTokenMetadata(
    address: any,
    existing: any
  ): Promise<Record<string, any> | undefined> {
    const normalized = String(address || "").toLowerCase();
    if (!normalized || normalized === ZERO_ADDRESS) return undefined;
    if (
      String(existing?.address || "").toLowerCase() === normalized &&
      existing?.symbol &&
      existing?.decimals !== undefined
    ) {
      return existing;
    }
    try {
      return await this.chainService.readTokenMetadata(normalized);
    } catch {
      return existing;
    }
  }

  private async refreshStalePools(
    snapshotBlock: number,
    heartbeat?: () => Promise<void>
  ): Promise<void> {
    const deployment = this.deploymentService.getDeployment();
    const refreshAgeMs = Math.max(
      60_000,
      this.envInt("FOMO_V2_LAUNCHPAD_INDEXER_POOL_REFRESH_MS", 300_000)
    );
    const batchSize = Math.max(
      1,
      this.envInt("FOMO_V2_LAUNCHPAD_INDEXER_POOL_REFRESH_BATCH", 20)
    );
    const staleBefore = new Date(Date.now() - refreshAgeMs);
    const pools: any[] = await this.poolModel
      .find({
        chainId: deployment.chainId,
        launchpadAddress: deployment.launchpadAddress.toLowerCase(),
        poolId: { $type: "string", $ne: "" },
        status: { $in: ["active", "closed"] },
        $or: [
          { "onchainState.lastSyncedAt": { $exists: false } },
          { "onchainState.lastSyncedAt": { $lt: staleBefore } },
        ],
      })
      .sort({ "onchainState.lastSyncedAt": 1, _id: 1 })
      .limit(batchSize);
    for (const pool of pools) {
      await heartbeat?.();
      try {
        await this.refreshPool(pool, snapshotBlock);
      } catch (error: any) {
        this.logger.warn(
          `Periodic finalized refresh failed for pool ${pool.poolId}: ${String(
            error?.message || error
          )}`
        );
      }
    }
  }

  private indexerEnabled(): boolean {
    return String(process.env.FOMO_V2_LAUNCHPAD_INDEXER_ENABLED || "false").toLowerCase() === "true";
  }

  private indexerLeaseTtlMs(): number {
    // Renewals fence each mutation; the longer default also protects the
    // single eth_getLogs request, which cannot be heartbeat-interrupted.
    return Math.max(
      120_000,
      this.envInt("FOMO_V2_LAUNCHPAD_INDEXER_LEASE_TTL_MS", 600_000)
    );
  }

  private envInt(name: string, fallback: number): number {
    const value = Number(process.env[name]);
    return Number.isSafeInteger(value) && value >= 0 ? value : fallback;
  }
}
