import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { createHash } from "crypto";
import { FomoV2MarketSyncKind } from "../models";
import {
  FOMO_V2_MARKET_SYNC_JOBS,
  FOMO_V2_MARKET_SYNC_QUEUE,
  FomoV2MarketSyncBatchPayload,
  FomoV2MarketSyncTargetPayload,
} from "./market-sync-queue.constants";

@Injectable()
export class FomoV2MarketSyncQueueService {
  private readonly logger = new Logger(FomoV2MarketSyncQueueService.name);

  constructor(
    @InjectQueue(FOMO_V2_MARKET_SYNC_QUEUE)
    private readonly queue: Queue,
  ) {}

  async enqueueBatch(
    payload: Omit<FomoV2MarketSyncBatchPayload, "queuedAt">,
  ): Promise<void> {
    if (!payload.targets.length) return;

    const jobPayload: FomoV2MarketSyncBatchPayload = {
      ...payload,
      targets: this.dedupeTargets(payload.targets),
      queuedAt: new Date().toISOString(),
    };
    const jobName = this.jobNameForKind(jobPayload.kind);
    const jobId = this.jobId(jobPayload);

    await this.queue.add(jobName, jobPayload, {
      jobId,
      attempts: this.positiveInteger(process.env.FOMO_V2_MARKET_SYNC_QUEUE_ATTEMPTS, 1),
      backoff: {
        type: "exponential",
        delay: this.positiveInteger(process.env.FOMO_V2_MARKET_SYNC_QUEUE_BACKOFF_MS, 30_000),
      },
      priority: this.priority(jobPayload.kind, jobPayload.tier),
      removeOnComplete: this.positiveInteger(process.env.FOMO_V2_MARKET_SYNC_QUEUE_REMOVE_ON_COMPLETE, 1000),
      removeOnFail: this.positiveInteger(process.env.FOMO_V2_MARKET_SYNC_QUEUE_REMOVE_ON_FAIL, 1000),
    });

    this.logger.debug?.(
      `Queued FOMO v2 market sync kind=${jobPayload.kind} cadence=${jobPayload.latestCadence || jobPayload.tier} tier=${jobPayload.tier} targets=${jobPayload.targets.length} jobId=${jobId}`,
    );
  }

  private jobNameForKind(kind: FomoV2MarketSyncKind): string {
    if (kind === "latest") return FOMO_V2_MARKET_SYNC_JOBS.LATEST_BATCH;
    if (kind === "history") return FOMO_V2_MARKET_SYNC_JOBS.HISTORY_BATCH;
    if (kind === "chart7d") return FOMO_V2_MARKET_SYNC_JOBS.CHART7D_BATCH;
    if (kind === "performance") return FOMO_V2_MARKET_SYNC_JOBS.PERFORMANCE_BATCH;
    if (kind === "roi") return FOMO_V2_MARKET_SYNC_JOBS.ROI_BATCH;
    return FOMO_V2_MARKET_SYNC_JOBS.EXCHANGES_BATCH;
  }

  private jobId(payload: FomoV2MarketSyncBatchPayload): string {
    const hash = createHash("sha1")
      .update(payload.targets.map((target) => target.syncStateId).sort().join(","))
      .digest("hex")
      .slice(0, 16);
    return `${payload.kind}:${payload.tier}:${payload.claimOwner}:${hash}`;
  }

  private priority(kind: FomoV2MarketSyncKind, tier: string): number {
    const tierOffset = tier === "HOT" ? 0 : tier === "WARM" ? 3 : 6;
    if (kind === "latest") return 1 + tierOffset;
    if (kind === "chart7d") return 6 + tierOffset;
    if (kind === "performance" || kind === "roi") return 5 + tierOffset;
    if (kind === "history") return 8 + tierOffset;
    return 15 + tierOffset;
  }

  private dedupeTargets(targets: FomoV2MarketSyncTargetPayload[]): FomoV2MarketSyncTargetPayload[] {
    const byState = new Map<string, FomoV2MarketSyncTargetPayload>();
    for (const target of targets || []) {
      if (!target?.syncStateId) continue;
      byState.set(target.syncStateId, target);
    }
    return Array.from(byState.values());
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
  }
}
