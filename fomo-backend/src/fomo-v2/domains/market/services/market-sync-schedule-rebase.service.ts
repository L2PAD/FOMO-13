import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { createHash } from "crypto";
import { Model } from "mongoose";
import { MarketDataTier } from "src/coingecko/coingecko-market.types";
import { FomoV2MarketSyncState } from "../models";
import { getFomoV2MarketSyncIntervalMs } from "./market-sync-schedule.config";
import {
  FOMO_V2_MARKET_LATEST_CADENCE_ORDER,
  FomoV2MarketLatestCadence,
  getFomoV2MarketLatestHotWarmMaxRank,
  getFomoV2MarketLatestHotWarmMinRank,
  getFomoV2MarketLatestIntervalMs,
  isFomoV2MarketLatestHotWarmEnabled,
  resolveFomoV2MarketLatestCadence,
} from "./market-sync-latest-cadence.config";

const TIERS: MarketDataTier[] = ["HOT", "WARM", "COLD"];
const CONFIRMATION = "REBASE_HISTORY_EXCHANGES";
const WRITE_BATCH_SIZE = 500;

type RebaseKind = "history" | "exchanges";

export interface FomoV2MarketScheduleRebaseInput {
  dryRun?: boolean;
  confirm?: string;
}

interface DateWindow {
  earliest: string | null;
  latest: string | null;
}

interface KindWindows {
  history: DateWindow;
  exchanges: DateWindow;
}

interface RebaseCounts {
  scanned: number;
  eligible: number;
  skippedLocked: number;
  planned: number;
  matched: number;
  modified: number;
  skippedDuringApply: number;
}

interface RebasePlanRow {
  id: any;
  tier: MarketDataTier;
  historyDueAt: Date;
  exchangesDueAt: Date;
}

interface TierSummary {
  counts: RebaseCounts;
  intervalsMs: Record<RebaseKind, number>;
  windows: {
    before: KindWindows;
    after: KindWindows;
  };
}

interface LatestCadenceSummary {
  enabled: boolean;
  hotWarmRankRange: {
    minRank: number;
    maxRank: number;
  };
  byCadence: Record<
    FomoV2MarketLatestCadence,
    {
      projects: number;
      intervalMs: number;
    }
  >;
}

@Injectable()
export class FomoV2MarketSyncScheduleRebaseService {
  private readonly logger = new Logger(FomoV2MarketSyncScheduleRebaseService.name);
  private applyInProgress = false;

  constructor(
    @InjectModel(FomoV2MarketSyncState.name)
    private readonly syncStateModel: Model<FomoV2MarketSyncState>,
  ) {}

  async rebase(
    input: FomoV2MarketScheduleRebaseInput = {},
    generatedAt = new Date(),
  ): Promise<any> {
    const dryRun = input.dryRun !== false;
    if (!dryRun && input.confirm !== CONFIRMATION) {
      throw new BadRequestException(
        `Applying the schedule rebase requires confirm=${CONFIRMATION}`,
      );
    }
    if (dryRun) return this.executeRebase(true, generatedAt);
    if (this.applyInProgress) {
      throw new ConflictException("A market schedule rebase is already in progress");
    }

    this.applyInProgress = true;
    try {
      return await this.executeRebase(false, generatedAt);
    } finally {
      this.applyInProgress = false;
    }
  }

  private async executeRebase(dryRun: boolean, generatedAt: Date): Promise<any> {
    const intervalsMs = this.intervalsByKindAndTier();
    const rows = await this.syncStateModel
      .find({
        tier: { $in: TIERS },
        trading: "CURRENTLY_TRADING",
        status: "active",
        coingeckoId: { $type: "string", $ne: "" },
      })
      .select("_id tier rank historyDueAt exchangesDueAt lockedUntil")
      .lean();

    const summaries = this.emptyTierSummaries(intervalsMs);
    const latestCadence = this.emptyLatestCadenceSummary();
    const plans: RebasePlanRow[] = [];

    for (const rawRow of rows as any[]) {
      const tier = this.normalizeTier(rawRow?.tier);
      if (!tier) continue;

      const cadence = resolveFomoV2MarketLatestCadence(tier, this.toFiniteNumber(rawRow?.rank));
      latestCadence.byCadence[cadence].projects += 1;

      const summary = summaries[tier];
      summary.counts.scanned += 1;

      if (this.isActivelyLocked(rawRow?.lockedUntil, generatedAt)) {
        summary.counts.skippedLocked += 1;
        continue;
      }

      const id = rawRow?._id;
      const idString = String(id || "");
      if (!id || !idString) continue;

      this.includeBeforeWindows(summary.windows.before, rawRow);

      const plan: RebasePlanRow = {
        id,
        tier,
        historyDueAt: this.futureDueAt(
          generatedAt,
          idString,
          "history",
          intervalsMs.history[tier],
        ),
        exchangesDueAt: this.futureDueAt(
          generatedAt,
          idString,
          "exchanges",
          intervalsMs.exchanges[tier],
        ),
      };

      plans.push(plan);
      summary.counts.eligible += 1;
      summary.counts.planned += 1;
      this.includeWindow(summary.windows.after.history, plan.historyDueAt);
      this.includeWindow(summary.windows.after.exchanges, plan.exchangesDueAt);
    }

    if (!dryRun) {
      for (const tier of TIERS) {
        const tierPlans = plans.filter((plan) => plan.tier === tier);
        const writeCounts = await this.applyPlans(tierPlans, generatedAt);
        const counts = summaries[tier].counts;
        counts.matched = writeCounts.matched;
        counts.modified = writeCounts.modified;
        counts.skippedDuringApply = Math.max(0, counts.planned - counts.matched);
      }

      this.logger.log(
        `FOMO v2 market schedule rebase applied planned=${plans.length} matched=${this.sumCounts(summaries).matched} modified=${this.sumCounts(summaries).modified}`,
      );
    }

    const counts = this.sumCounts(summaries);
    return {
      dryRun,
      applied: !dryRun,
      generatedAt: generatedAt.toISOString(),
      confirmationRequired: CONFIRMATION,
      scope: {
        collection: "market_sync_states",
        fields: ["historyDueAt", "exchangesDueAt"],
        kinds: ["history", "exchanges"],
        activeOnly: true,
        unlockedOnly: true,
        windowsDescribe: "eligible unlocked rows",
      },
      counts,
      intervalsMs,
      latestCadence,
      windows: this.combineWindows(summaries),
      byTier: summaries,
    };
  }

  private async applyPlans(
    plans: RebasePlanRow[],
    generatedAt: Date,
  ): Promise<{ matched: number; modified: number }> {
    let matched = 0;
    let modified = 0;

    for (let offset = 0; offset < plans.length; offset += WRITE_BATCH_SIZE) {
      const chunk = plans.slice(offset, offset + WRITE_BATCH_SIZE);
      const operations = chunk.map((plan) => ({
        updateOne: {
          filter: {
            _id: plan.id,
            tier: plan.tier,
            trading: "CURRENTLY_TRADING",
            status: "active",
            $or: [
              { lockedUntil: { $exists: false } },
              { lockedUntil: null },
              { lockedUntil: { $lte: generatedAt } },
            ],
          },
          update: {
            $set: {
              historyDueAt: plan.historyDueAt,
              exchangesDueAt: plan.exchangesDueAt,
            },
          },
        },
      }));

      // Use the native collection so Mongoose timestamps cannot add updatedAt.
      // This operation must write only the two schedule fields above.
      const result: any = await (this.syncStateModel.collection as any).bulkWrite(
        operations,
        { ordered: false },
      );
      matched += Number(result?.matchedCount || 0);
      modified += Number(result?.modifiedCount || 0);
    }

    return { matched, modified };
  }

  private intervalsByKindAndTier(): Record<RebaseKind, Record<MarketDataTier, number>> {
    return {
      history: {
        HOT: getFomoV2MarketSyncIntervalMs("history", "HOT"),
        WARM: getFomoV2MarketSyncIntervalMs("history", "WARM"),
        COLD: getFomoV2MarketSyncIntervalMs("history", "COLD"),
      },
      exchanges: {
        HOT: getFomoV2MarketSyncIntervalMs("exchanges", "HOT"),
        WARM: getFomoV2MarketSyncIntervalMs("exchanges", "WARM"),
        COLD: getFomoV2MarketSyncIntervalMs("exchanges", "COLD"),
      },
    };
  }

  private emptyTierSummaries(
    intervals: Record<RebaseKind, Record<MarketDataTier, number>>,
  ): Record<MarketDataTier, TierSummary> {
    return Object.fromEntries(
      TIERS.map((tier) => [
        tier,
        {
          counts: this.emptyCounts(),
          intervalsMs: {
            history: intervals.history[tier],
            exchanges: intervals.exchanges[tier],
          },
          windows: {
            before: this.emptyKindWindows(),
            after: this.emptyKindWindows(),
          },
        },
      ]),
    ) as Record<MarketDataTier, TierSummary>;
  }

  private emptyCounts(): RebaseCounts {
    return {
      scanned: 0,
      eligible: 0,
      skippedLocked: 0,
      planned: 0,
      matched: 0,
      modified: 0,
      skippedDuringApply: 0,
    };
  }

  private emptyLatestCadenceSummary(): LatestCadenceSummary {
    return {
      enabled: isFomoV2MarketLatestHotWarmEnabled(),
      hotWarmRankRange: {
        minRank: getFomoV2MarketLatestHotWarmMinRank(),
        maxRank: getFomoV2MarketLatestHotWarmMaxRank(),
      },
      byCadence: Object.fromEntries(
        FOMO_V2_MARKET_LATEST_CADENCE_ORDER.map((cadence) => [
          cadence,
          {
            projects: 0,
            intervalMs: getFomoV2MarketLatestIntervalMs(cadence),
          },
        ]),
      ) as LatestCadenceSummary["byCadence"],
    };
  }

  private emptyKindWindows(): KindWindows {
    return {
      history: { earliest: null, latest: null },
      exchanges: { earliest: null, latest: null },
    };
  }

  private includeBeforeWindows(windows: KindWindows, row: any): void {
    this.includeWindow(windows.history, this.toDate(row?.historyDueAt));
    this.includeWindow(windows.exchanges, this.toDate(row?.exchangesDueAt));
  }

  private includeWindow(window: DateWindow, value?: Date): void {
    if (!value) return;
    const iso = value.toISOString();
    if (!window.earliest || iso < window.earliest) window.earliest = iso;
    if (!window.latest || iso > window.latest) window.latest = iso;
  }

  private combineWindows(summaries: Record<MarketDataTier, TierSummary>): {
    before: KindWindows;
    after: KindWindows;
  } {
    const combined = {
      before: this.emptyKindWindows(),
      after: this.emptyKindWindows(),
    };

    for (const tier of TIERS) {
      for (const stage of ["before", "after"] as const) {
        for (const kind of ["history", "exchanges"] as const) {
          const source = summaries[tier].windows[stage][kind];
          if (source.earliest) this.includeWindow(combined[stage][kind], new Date(source.earliest));
          if (source.latest) this.includeWindow(combined[stage][kind], new Date(source.latest));
        }
      }
    }

    return combined;
  }

  private sumCounts(summaries: Record<MarketDataTier, TierSummary>): RebaseCounts {
    const total = this.emptyCounts();
    for (const tier of TIERS) {
      for (const key of Object.keys(total) as Array<keyof RebaseCounts>) {
        total[key] += summaries[tier].counts[key];
      }
    }
    return total;
  }

  private futureDueAt(
    now: Date,
    id: string,
    kind: RebaseKind,
    intervalMs: number,
  ): Date {
    const digest = createHash("sha256")
      .update(`${id}:${kind}:schedule-rebase-v1`)
      .digest();
    const hash = digest.readUIntBE(0, 6);
    const jitterMs = 1 + (hash % intervalMs);
    return new Date(now.getTime() + jitterMs);
  }

  private isActivelyLocked(value: any, now: Date): boolean {
    const lockedUntil = this.toDate(value);
    return Boolean(lockedUntil && lockedUntil.getTime() > now.getTime());
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : undefined;
  }

  private toFiniteNumber(value: any): number | null {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private normalizeTier(value: any): MarketDataTier | undefined {
    const tier = String(value || "").toUpperCase();
    return TIERS.includes(tier as MarketDataTier) ? (tier as MarketDataTier) : undefined;
  }
}
