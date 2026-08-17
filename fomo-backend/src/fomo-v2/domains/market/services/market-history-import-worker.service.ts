import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { MarketDataTier } from "src/coingecko/coingecko-market.types";
import {
  FomoV2CoinGeckoMarketHistorySyncProgressEvent,
  FomoV2CoinGeckoMarketHistorySyncService,
} from "./coingecko-market-history-sync.service";
import { FomoV2MarketHistoryImportAdminService } from "./market-history-import-admin.service";

@Injectable()
export class FomoV2MarketHistoryImportWorkerService {
  private readonly logger = new Logger(FomoV2MarketHistoryImportWorkerService.name);
  private readonly workerId = `${process.env.HOSTNAME || "local"}:${process.pid}:history-import`;
  private running = false;

  constructor(
    private readonly adminService: FomoV2MarketHistoryImportAdminService,
    private readonly historySyncService: FomoV2CoinGeckoMarketHistorySyncService,
  ) {}

  @Cron("*/15 * * * * *")
  async runQueuedImport(): Promise<void> {
    if (!this.isEnabled()) return;
    if (this.running) return;

    this.running = true;
    try {
      const run = await this.adminService.claimNextQueuedRun(this.workerId);
      if (!run) return;

      await this.executeRun(run.toObject());
    } catch (error) {
      this.logger.warn(`FOMO v2 market history import worker failed: ${error?.message || error}`);
    } finally {
      this.running = false;
    }
  }

  async executeRun(run: any): Promise<void> {
    const runId = run?._id;
    if (!runId) return;

    this.logger.log(`FOMO v2 market history import started runId=${runId}`);
    try {
      const tiers = Array.isArray(run.tiers) ? run.tiers : [];
      const options = run.options || {};

      for (const tierState of tiers) {
        const tier = tierState?.tier as MarketDataTier;
        if (!this.isMarketDataTier(tier)) continue;

        await this.adminService.markTierStarted(runId, tier);
        const result = await this.historySyncService.sync({
          dryRun: false,
          tier,
          days: tierState.days,
          limit: Number(options.limit || 0),
          delayMs: Number(options.delayMs || 1500),
          maxRetries: Number(options.maxRetries || 5),
          progress: (event) => this.onTierProgress(runId, event),
        });

        await this.adminService.markTierCompleted(runId, tier, {
          totalAssets: result.assetsScanned,
          processedAssets: result.assetsScanned,
          historyRequests: result.historyRequests,
          snapshotsWouldWrite: result.snapshotsWouldWrite,
          snapshotsCreated: result.snapshotsCreated,
          snapshotsUpdated: result.snapshotsUpdated,
          errorsCount: result.errorsCount,
          durationMs: result.durationMs,
          errors: result.errors,
        });
      }

      await this.adminService.markRunCompleted(runId);
      this.logger.log(`FOMO v2 market history import completed runId=${runId}`);
    } catch (error) {
      await this.adminService.markRunFailed(runId, error);
      this.logger.warn(`FOMO v2 market history import failed runId=${runId} error=${error?.message || error}`);
    }
  }

  private async onTierProgress(
    runId: any,
    event: FomoV2CoinGeckoMarketHistorySyncProgressEvent,
  ): Promise<void> {
    await this.adminService.updateTierProgress(runId, event.tier as MarketDataTier, {
      totalAssets: event.totalAssets,
      processedAssets: event.processedAssets,
      historyRequests: event.result.historyRequests,
      snapshotsWouldWrite: event.result.snapshotsWouldWrite,
      snapshotsCreated: event.result.snapshotsCreated,
      snapshotsUpdated: event.result.snapshotsUpdated,
      errorsCount: event.result.errorsCount,
      errors: event.result.errors,
      lastAsset: event.candidate,
      activeCoingeckoId: event.candidate?.coingeckoId || "",
      activeAssetName: event.candidate?.name || event.candidate?.symbol || "",
    });
  }

  private isEnabled(): boolean {
    const value = process.env.FOMO_V2_MARKET_HISTORY_IMPORT_WORKER_ENABLED;
    if (value === undefined || value === null || value === "") return true;
    const normalized = String(value).trim().toLowerCase();
    if (["false", "0", "off", "no"].includes(normalized)) return false;
    if (["true", "1", "on", "yes"].includes(normalized)) return true;
    return true;
  }

  private isMarketDataTier(value: any): value is MarketDataTier {
    return value === "HOT" || value === "WARM" || value === "COLD";
  }
}
