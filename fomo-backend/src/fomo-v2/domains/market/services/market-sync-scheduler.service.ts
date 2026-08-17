import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { MarketDataTier } from "src/coingecko/coingecko-market.types";
import { FomoV2MarketSyncKind } from "../models";
import { FomoV2MarketSyncQueueService } from "./market-sync-queue.service";
import { FomoV2MarketSyncStateService } from "./market-sync-state.service";
import { getFomoV2MarketSyncLockMs } from "./market-sync-schedule.config";
import {
  FomoV2MarketLatestCadenceDefinition,
  getFomoV2MarketLatestCadenceDefinitions,
} from "./market-sync-latest-cadence.config";

const TIERS: MarketDataTier[] = ["HOT", "WARM", "COLD"];
const BACKGROUND_KINDS: FomoV2MarketSyncKind[] = ["history", "chart7d", "performance", "roi", "exchanges"];
// Latest processing appends BTC, ETH, and SOL reference IDs. Claiming 247
// projects keeps 247 + 3 IDs within CoinGecko's 250-ID /coins/markets limit.
const DEFAULT_LATEST_BATCH_SIZE = 247;

@Injectable()
export class FomoV2MarketSyncSchedulerService {
  private readonly logger = new Logger(FomoV2MarketSyncSchedulerService.name);
  private readonly ownerPrefix = `${process.env.HOSTNAME || process.pid || "local"}:${process.pid}`;
  private lastReconcileAt = 0;
  private latestRunning = false;
  private backgroundRunning = false;

  constructor(
    private readonly syncStateService: FomoV2MarketSyncStateService,
    private readonly queueService: FomoV2MarketSyncQueueService,
  ) {}

  // Two-second polling keeps a 30-second HOT interval close to its configured
  // cadence without making History/Exchanges poll MongoDB more often.
  @Cron("*/2 * * * * *")
  async enqueueDueLatestMarketSyncJobs(): Promise<void> {
    if (!this.isEnabled()) return;
    if (!this.isKindEnabled("latest")) return;
    if (this.latestRunning) return;

    this.latestRunning = true;
    try {
      await this.enqueueKind("latest");
    } catch (error) {
      this.logger.warn(`FOMO v2 latest market sync scheduler failed: ${error?.message || error}`);
    } finally {
      this.latestRunning = false;
    }
  }

  @Cron("*/30 * * * * *")
  async enqueueDueBackgroundMarketSyncJobs(): Promise<void> {
    if (!this.isEnabled()) return;
    if (this.backgroundRunning) return;

    this.backgroundRunning = true;
    try {
      await this.reconcileIfDue();

      for (const kind of BACKGROUND_KINDS) {
        if (!this.isKindEnabled(kind)) continue;
        await this.enqueueKind(kind);
      }
    } catch (error) {
      this.logger.warn(`FOMO v2 background market sync scheduler failed: ${error?.message || error}`);
    } finally {
      this.backgroundRunning = false;
    }
  }

  private async reconcileIfDue(): Promise<void> {
    const now = Date.now();
    const intervalMs = this.positiveInteger(
      process.env.FOMO_V2_MARKET_SYNC_RECONCILE_INTERVAL_MS,
      5 * 60 * 1000,
    );
    if (this.lastReconcileAt && now - this.lastReconcileAt < intervalMs) return;

    this.lastReconcileAt = now;
    const result = await this.syncStateService.reconcileEligibleProjects({
      limit: this.positiveInteger(process.env.FOMO_V2_MARKET_SYNC_RECONCILE_LIMIT, 30000),
    });

    this.logger.log(
      `FOMO v2 market sync state reconciled scanned=${result.scanned} upserted=${result.upserted} modified=${result.modified}`,
    );
  }

  private async enqueueKind(kind: FomoV2MarketSyncKind): Promise<void> {
    if (kind === "latest") {
      await this.enqueueLatest();
      return;
    }

    const batchSize = this.batchSize(kind);
    const maxBatches = this.maxBatches(kind);

    for (const tier of TIERS) {
      if (!this.isTierEnabled(tier)) continue;

      for (let batchIndex = 0; batchIndex < maxBatches; batchIndex += 1) {
        const claimOwner = this.claimOwner(kind, tier);
        const targets = await this.syncStateService.claimDue({
          kind,
          tier,
          limit: batchSize,
          lockMs: getFomoV2MarketSyncLockMs(kind),
          owner: claimOwner,
        });

        if (!targets.length) break;

        await this.queueService.enqueueBatch({
          kind,
          tier,
          targets,
          claimOwner,
          reason: "cron",
        });

        this.logger.log(`Queued FOMO v2 market ${kind} tier=${tier} targets=${targets.length}`);

        if (targets.length < batchSize) break;
      }
    }
  }

  private async enqueueLatest(): Promise<void> {
    const batchSize = this.batchSize("latest");
    const maxBatches = this.maxBatches("latest");

    for (const definition of getFomoV2MarketLatestCadenceDefinitions()) {
      if (!this.isTierEnabled(definition.tier)) continue;

      for (let batchIndex = 0; batchIndex < maxBatches; batchIndex += 1) {
        const claimOwner = this.claimOwner("latest", definition.tier, definition.cadence);
        const targets = await this.syncStateService.claimDue({
          kind: "latest",
          tier: definition.tier,
          filter: this.latestRankFilter(definition),
          limit: batchSize,
          lockMs: getFomoV2MarketSyncLockMs("latest"),
          owner: claimOwner,
        });

        if (!targets.length) break;

        await this.queueService.enqueueBatch({
          kind: "latest",
          tier: definition.tier,
          latestCadence: definition.cadence,
          targets,
          claimOwner,
          reason: "cron",
        });

        this.logger.log(
          `Queued FOMO v2 market latest cadence=${definition.cadence} tier=${definition.tier} targets=${targets.length}`,
        );

        if (targets.length < batchSize) break;
      }
    }
  }

  private latestRankFilter(definition: FomoV2MarketLatestCadenceDefinition): Record<string, any> | undefined {
    if (definition.rankMode === "all") return undefined;
    if (definition.rankMode === "between") {
      return {
        rank: {
          $gte: definition.minRank,
          $lte: definition.maxRank,
        },
      };
    }

    return {
      $or: [
        { rank: { $lt: definition.minRank } },
        { rank: { $gt: definition.maxRank } },
        { rank: { $exists: false } },
        { rank: null },
      ],
    };
  }

  private claimOwner(kind: FomoV2MarketSyncKind, tier: MarketDataTier, cadence?: string): string {
    const scope = cadence || tier;
    return `${this.ownerPrefix}:${kind}:${scope}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  }

  private batchSize(kind: FomoV2MarketSyncKind): number {
    const specific = process.env[`FOMO_V2_MARKET_SYNC_${kind.toUpperCase()}_BATCH_SIZE`];
    const fallback =
      kind === "history" ? 10 :
      kind === "exchanges" ? 25 :
      kind === "latest" ? DEFAULT_LATEST_BATCH_SIZE :
      100;
    return this.positiveInteger(specific || process.env.FOMO_V2_MARKET_SYNC_BATCH_SIZE, fallback);
  }

  private maxBatches(kind: FomoV2MarketSyncKind): number {
    const specific = process.env[`FOMO_V2_MARKET_SYNC_${kind.toUpperCase()}_MAX_BATCHES_PER_TICK`];
    const fallback = kind === "latest" ? 100 : 20;
    return this.positiveInteger(specific || process.env.FOMO_V2_MARKET_SYNC_MAX_BATCHES_PER_TICK, fallback);
  }

  private isEnabled(): boolean {
    return this.readBoolean("FOMO_V2_MARKET_QUEUE_ENABLED", true) &&
      this.readBoolean("FOMO_V2_MARKET_DATA_ENABLED", false);
  }

  private isKindEnabled(kind: FomoV2MarketSyncKind): boolean {
    if (kind === "history" && !this.readBoolean("COINGECKO_HISTORY_BACKFILL_ENABLED", true)) return false;
    return this.readBoolean(`FOMO_V2_MARKET_SYNC_${kind.toUpperCase()}_ENABLED`, true);
  }

  private isTierEnabled(tier: MarketDataTier): boolean {
    return this.readBoolean(`FOMO_V2_MARKET_DATA_${tier}_ENABLED`, this.readBoolean(`COINGECKO_${tier}_ENABLED`, true));
  }

  private readBoolean(name: string, defaultValue: boolean): boolean {
    const value = process.env[name];
    if (value === undefined || value === null || value === "") return defaultValue;
    const normalized = String(value).trim().toLowerCase();
    if (["false", "0", "off", "no"].includes(normalized)) return false;
    if (["true", "1", "on", "yes"].includes(normalized)) return true;
    return defaultValue;
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
  }
}
