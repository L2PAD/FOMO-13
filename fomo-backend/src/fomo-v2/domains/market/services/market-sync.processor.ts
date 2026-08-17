import { Logger } from "@nestjs/common";
import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import {
  FOMO_V2_MARKET_SYNC_JOBS,
  FOMO_V2_MARKET_SYNC_QUEUE,
  FomoV2MarketSyncBatchPayload,
} from "./market-sync-queue.constants";
import { FomoV2MarketProjectDataUpdateService } from "./market-project-data-update.service";
import { FomoV2CoinGeckoMarketHistorySyncService } from "./coingecko-market-history-sync.service";
import { FomoV2MarketProjectPerformanceService } from "./market-project-performance.service";
import { FomoV2MarketProjectRoiMetricService } from "./market-project-roi-metric.service";
import { FomoV2MarketProjectChartImageService } from "./market-project-chart-image.service";
import { FomoV2ProjectExchangeMarketsService } from "./project-exchange-markets.service";
import { FomoV2MarketSyncStateService } from "./market-sync-state.service";
import { FomoV2MarketSyncQueueService } from "./market-sync-queue.service";
import {
  getFomoV2MarketHistoryDays,
  getFomoV2MarketSyncLockMs,
} from "./market-sync-schedule.config";

@Processor(FOMO_V2_MARKET_SYNC_QUEUE)
export class FomoV2MarketSyncProcessor {
  private readonly logger = new Logger(FomoV2MarketSyncProcessor.name);

  constructor(
    private readonly dataUpdateService: FomoV2MarketProjectDataUpdateService,
    private readonly historySyncService: FomoV2CoinGeckoMarketHistorySyncService,
    private readonly performanceService: FomoV2MarketProjectPerformanceService,
    private readonly roiMetricService: FomoV2MarketProjectRoiMetricService,
    private readonly chartImageService: FomoV2MarketProjectChartImageService,
    private readonly exchangeMarketsService: FomoV2ProjectExchangeMarketsService,
    private readonly syncStateService: FomoV2MarketSyncStateService,
    private readonly queueService: FomoV2MarketSyncQueueService,
  ) {}

  @Process({ name: FOMO_V2_MARKET_SYNC_JOBS.LATEST_BATCH, concurrency: 1 })
  async handleLatestBatch(job: Job<FomoV2MarketSyncBatchPayload>): Promise<void> {
    await this.runJob(job, async (payload) => {
      const result = await this.dataUpdateService.runTier(payload.tier, {
        dryRun: false,
        ignoreJobsEnabled: true,
        ignoreLocalRun: true,
        ignoreTierEnabled: true,
        limit: payload.targets.length,
        marketAssetIds: payload.targets.map((target) => target.marketAssetId),
        recalculateDerived: false,
      });

      this.logger.log(
        `FOMO v2 latest batch finished cadence=${payload.latestCadence || payload.tier} tier=${payload.tier} targets=${payload.targets.length} rowsUpdated=${result.rowsUpdated} historyPointsWritten=${result.historyPointsWritten} requests=${result.requestsMade}`,
      );

      await this.syncStateService.markSuccess("latest", payload.targets, payload.claimOwner);
      await this.queueDerivedJobs(payload, "latest-success");
    });
  }

  @Process({ name: FOMO_V2_MARKET_SYNC_JOBS.HISTORY_BATCH, concurrency: 1 })
  async handleHistoryBatch(job: Job<FomoV2MarketSyncBatchPayload>): Promise<void> {
    await this.runJob(job, async (payload) => {
      const result = await this.historySyncService.sync({
        dryRun: false,
        tier: payload.tier,
        limit: payload.targets.length,
        marketAssetIds: payload.targets.map((target) => target.marketAssetId),
        days: getFomoV2MarketHistoryDays(payload.tier),
        delayMs: this.nonNegativeInteger(process.env.FOMO_V2_MARKET_SYNC_HISTORY_DELAY_MS, 1200),
      });

      this.logger.log(
        `FOMO v2 history batch finished tier=${payload.tier} targets=${payload.targets.length} snapshotsCreated=${result.snapshotsCreated} snapshotsUpdated=${result.snapshotsUpdated} requests=${result.historyRequests}`,
      );

      await this.syncStateService.markSuccess("history", payload.targets, payload.claimOwner);
      await this.queueDerivedJobs(payload, "history-success");
    });
  }

  @Process({ name: FOMO_V2_MARKET_SYNC_JOBS.PERFORMANCE_BATCH, concurrency: 2 })
  async handlePerformanceBatch(job: Job<FomoV2MarketSyncBatchPayload>): Promise<void> {
    await this.runJob(job, async (payload) => {
      const result = await this.performanceService.recalculateForMarketAssets(payload.targets, {
        dryRun: false,
      });

      this.logger.log(
        `FOMO v2 performance batch finished tier=${payload.tier} targets=${payload.targets.length} calculated=${result.calculated} upserted=${result.upserted}`,
      );

      await this.syncStateService.markSuccess("performance", payload.targets, payload.claimOwner);
    });
  }

  @Process({ name: FOMO_V2_MARKET_SYNC_JOBS.CHART7D_BATCH, concurrency: 2 })
  async handleChart7dBatch(job: Job<FomoV2MarketSyncBatchPayload>): Promise<void> {
    await this.runJob(job, async (payload) => {
      const result = await this.chartImageService.render7dForMarketAssets(payload.targets);

      this.logger.log(
        `FOMO v2 chart7d batch finished tier=${payload.tier} targets=${payload.targets.length} rendered=${result.rendered} skippedNoPoints=${result.skippedNoPoints} skippedTooFewPoints=${result.skippedTooFewPoints} failed=${result.failed}`,
      );

      await this.syncStateService.markSuccess("chart7d", payload.targets, payload.claimOwner);
    });
  }

  @Process({ name: FOMO_V2_MARKET_SYNC_JOBS.ROI_BATCH, concurrency: 2 })
  async handleRoiBatch(job: Job<FomoV2MarketSyncBatchPayload>): Promise<void> {
    await this.runJob(job, async (payload) => {
      const result = await this.roiMetricService.recalculateForMarketAssets(payload.targets, {
        dryRun: false,
      });

      this.logger.log(
        `FOMO v2 ROI batch finished tier=${payload.tier} targets=${payload.targets.length} calculated=${result.calculated} upserted=${result.upserted}`,
      );

      await this.syncStateService.markSuccess("roi", payload.targets, payload.claimOwner);
    });
  }

  @Process({ name: FOMO_V2_MARKET_SYNC_JOBS.EXCHANGES_BATCH, concurrency: 1 })
  async handleExchangesBatch(job: Job<FomoV2MarketSyncBatchPayload>): Promise<void> {
    await this.runJob(job, async (payload) => {
      const result = await this.exchangeMarketsService.syncProjectExchangeMarkets({
        marketAssetIds: payload.targets.map((target) => target.marketAssetId),
        write: true,
        includeDerivatives: this.readBoolean("FOMO_V2_MARKET_SYNC_EXCHANGES_INCLUDE_DERIVATIVES", true),
      });

      this.logger.log(
        `FOMO v2 exchanges batch finished tier=${payload.tier} targets=${payload.targets.length} scanned=${result.scanned} marketsWritten=${result.marketsWritten} overviewsWritten=${result.overviewsWritten}`,
      );

      await this.syncStateService.markSuccess("exchanges", payload.targets, payload.claimOwner);
    });
  }

  private async runJob(
    job: Job<FomoV2MarketSyncBatchPayload>,
    handler: (payload: FomoV2MarketSyncBatchPayload) => Promise<void>,
  ): Promise<void> {
    const startedAt = Date.now();
    const payload = job.data;

    this.logger.log(
      `FOMO v2 market job started id=${job.id} kind=${payload.kind} tier=${payload.tier} targets=${payload.targets.length} reason=${payload.reason} queuedAt=${payload.queuedAt}`,
    );

    try {
      await handler(payload);
      this.logger.log(
        `FOMO v2 market job completed id=${job.id} kind=${payload.kind} tier=${payload.tier} durationMs=${Date.now() - startedAt}`,
      );
    } catch (error) {
      try {
        await this.syncStateService.markFailure(payload.kind, payload.targets, payload.claimOwner, error);
      } catch (markFailureError) {
        this.logger.error(
          `FOMO v2 market job failure tracking failed id=${job.id} kind=${payload.kind} error=${
            markFailureError?.message || markFailureError
          }`,
        );
      }
      this.logger.warn(
        `FOMO v2 market job failed id=${job.id} kind=${payload.kind} tier=${payload.tier} error=${error?.message || error}`,
      );
      // Bull only applies attempts/backoff when the processor rejects. Recording
      // the failure is bookkeeping and must never turn a failed job into success.
      throw error;
    }
  }

  private async queueDerivedJobs(
    payload: FomoV2MarketSyncBatchPayload,
    reason: "latest-success" | "history-success",
  ): Promise<void> {
    const performanceOwner = `${payload.claimOwner}:performance`;
    const roiOwner = `${payload.claimOwner}:roi`;
    const [performanceTargets, roiTargets] = await Promise.all([
      this.syncStateService.claimTargets(
        "performance",
        payload.targets,
        performanceOwner,
        getFomoV2MarketSyncLockMs("performance"),
      ),
      this.syncStateService.claimTargets(
        "roi",
        payload.targets,
        roiOwner,
        getFomoV2MarketSyncLockMs("roi"),
      ),
    ]);

    await Promise.all([
      this.queueService.enqueueBatch({
        kind: "performance",
        tier: payload.tier,
        targets: performanceTargets,
        claimOwner: performanceOwner,
        reason,
      }),
      this.queueService.enqueueBatch({
        kind: "roi",
        tier: payload.tier,
        targets: roiTargets,
        claimOwner: roiOwner,
        reason,
      }),
    ]);
  }

  private readBoolean(name: string, defaultValue: boolean): boolean {
    const value = process.env[name];
    if (value === undefined || value === null || value === "") return defaultValue;
    const normalized = String(value).trim().toLowerCase();
    if (["false", "0", "off", "no"].includes(normalized)) return false;
    if (["true", "1", "on", "yes"].includes(normalized)) return true;
    return defaultValue;
  }

  private nonNegativeInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
  }
}
