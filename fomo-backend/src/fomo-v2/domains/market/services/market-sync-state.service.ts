import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Types } from "mongoose";
import { MarketDataTier } from "src/coingecko/coingecko-market.types";
import {
  FomoV2MarketProjectReadModel,
  FomoV2MarketSyncKind,
  FomoV2MarketSyncState,
} from "../models";
import {
  FomoV2MarketSyncTargetPayload,
} from "./market-sync-queue.constants";
import {
  getFomoV2MarketSyncIntervalMs,
} from "./market-sync-schedule.config";
import {
  resolveFomoV2MarketLatestCadence,
} from "./market-sync-latest-cadence.config";

export interface FomoV2MarketSyncReconcileResult {
  scanned: number;
  upserted: number;
  modified: number;
}

export interface FomoV2MarketSyncClaimOptions {
  kind: FomoV2MarketSyncKind;
  tier: MarketDataTier;
  filter?: Record<string, any>;
  limit: number;
  lockMs: number;
  owner: string;
}

type DueField =
  | "latestDueAt"
  | "historyDueAt"
  | "chart7dDueAt"
  | "performanceDueAt"
  | "roiDueAt"
  | "exchangesDueAt";

const DUE_FIELD_BY_KIND: Record<FomoV2MarketSyncKind, DueField> = {
  latest: "latestDueAt",
  history: "historyDueAt",
  chart7d: "chart7dDueAt",
  performance: "performanceDueAt",
  roi: "roiDueAt",
  exchanges: "exchangesDueAt",
};

@Injectable()
export class FomoV2MarketSyncStateService {
  private readonly logger = new Logger(FomoV2MarketSyncStateService.name);

  constructor(
    @InjectModel(FomoV2MarketSyncState.name)
    private readonly syncStateModel: Model<FomoV2MarketSyncState>,
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly readModel: Model<FomoV2MarketProjectReadModel>,
  ) {}

  async reconcileEligibleProjects(options: { limit?: number } = {}): Promise<FomoV2MarketSyncReconcileResult> {
    const limit = this.positiveInteger(options.limit, 30000);
    const now = new Date();
    const rows = await this.readModel
      .find({
        trading: "CURRENTLY_TRADING",
        status: "active",
        marketAssetId: { $exists: true },
        "providerIds.coingeckoId": { $type: "string", $ne: "" },
      })
      .sort({ rank: 1, _id: 1 })
      .limit(limit)
      .select("canonicalProjectId marketAssetId providerIds symbol name rank tier trading status")
      .lean();

    const operations = (rows as any[])
      .map((row) => this.buildReconcileOperation(row, now))
      .filter(Boolean);

    if (!operations.length) {
      return { scanned: rows.length, upserted: 0, modified: 0 };
    }

    const result = await this.syncStateModel.bulkWrite(operations, { ordered: false });
    return {
      scanned: rows.length,
      upserted: Number((result as any).upsertedCount || 0),
      modified: Number((result as any).modifiedCount || 0),
    };
  }

  async claimDue(options: FomoV2MarketSyncClaimOptions): Promise<FomoV2MarketSyncTargetPayload[]> {
    const limit = this.positiveInteger(options.limit, 100);
    const dueField = DUE_FIELD_BY_KIND[options.kind];
    const now = new Date();
    const lockedUntil = new Date(now.getTime() + options.lockMs);
    const claimed: any[] = [];

    for (let index = 0; index < limit; index += 1) {
      const baseFilter = {
        tier: options.tier,
        trading: "CURRENTLY_TRADING",
        status: "active",
        coingeckoId: { $type: "string", $ne: "" },
        [dueField]: { $lte: now },
      };
      const lockFilter = {
        $or: [
          { lockedUntil: { $exists: false } },
          { lockedUntil: null },
          { lockedUntil: { $lte: now } },
        ],
      };
      const row = await this.syncStateModel
        .findOneAndUpdate(
          options.filter
            ? { $and: [baseFilter, options.filter, lockFilter] }
            : { ...baseFilter, ...lockFilter },
          {
            $set: {
              lockedUntil,
              lockedBy: options.owner,
              lockedKind: options.kind,
              lastClaimedAt: now,
            },
          },
          {
            sort: { [dueField]: 1, rank: 1, _id: 1 },
            new: true,
          },
        )
        .lean();

      if (!row) break;
      claimed.push(row);
    }

    return claimed.map((row) => this.toTargetPayload(row)).filter(Boolean);
  }

  async claimTargets(
    kind: FomoV2MarketSyncKind,
    targets: FomoV2MarketSyncTargetPayload[],
    owner: string,
    lockMs: number,
  ): Promise<FomoV2MarketSyncTargetPayload[]> {
    const ids = targets.map((target) => this.toObjectId(target.syncStateId)).filter(Boolean);
    if (!ids.length) return [];

    const now = new Date();
    const dueField = DUE_FIELD_BY_KIND[kind];
    const result = await this.syncStateModel.updateMany(
      {
        _id: { $in: ids },
        trading: "CURRENTLY_TRADING",
        status: "active",
        [dueField]: { $lte: now },
        $or: [
          { lockedUntil: { $exists: false } },
          { lockedUntil: null },
          { lockedUntil: { $lte: now } },
        ],
      },
      {
        $set: {
          lockedUntil: new Date(now.getTime() + lockMs),
          lockedBy: owner,
          lockedKind: kind,
          lastClaimedAt: now,
        },
      },
    );

    const modified = Number((result as any)?.modifiedCount ?? (result as any)?.nModified ?? 0);
    if (modified <= 0) return [];

    const rows = await this.syncStateModel
      .find({
        _id: { $in: ids },
        lockedBy: owner,
        lockedKind: kind,
      })
      .lean();

    return rows.map((row) => this.toTargetPayload(row)).filter(Boolean);
  }

  async markSuccess(
    kind: FomoV2MarketSyncKind,
    targets: FomoV2MarketSyncTargetPayload[],
    owner: string,
    finishedAt = new Date(),
  ): Promise<void> {
    const dueField = DUE_FIELD_BY_KIND[kind];
    const operations = targets
      .map((target) => {
        const stateId = this.toObjectId(target.syncStateId);
        if (!stateId) return undefined;

        return {
          updateOne: {
            filter: {
              _id: stateId,
              lockedBy: owner,
              lockedKind: kind,
            },
            update: {
              $set: {
                [dueField]: this.nextDueAt(kind, target, finishedAt),
                [`lastSuccessAt.${kind}`]: finishedAt,
                [`errorCount.${kind}`]: 0,
                updatedAt: finishedAt,
              },
              $unset: {
                lockedUntil: "",
                lockedBy: "",
                lockedKind: "",
                [`lastError.${kind}`]: "",
              },
            },
          },
        };
      })
      .filter(Boolean);

    await this.bulkWrite(operations);
  }

  async markFailure(
    kind: FomoV2MarketSyncKind,
    targets: FomoV2MarketSyncTargetPayload[],
    owner: string,
    error: any,
    failedAt = new Date(),
  ): Promise<void> {
    const dueField = DUE_FIELD_BY_KIND[kind];
    const message = this.formatError(error);
    const states = await this.loadStatesByTargetIds(targets);
    const operations = states
      .map((state: any) => {
        const target = targets.find((item) => item.syncStateId === this.toIdString(state._id));
        if (!target) return undefined;

        const nextErrorCount = Number(state.errorCount?.[kind] || 0) + 1;
        const backoffMs = this.failureBackoffMs(
          kind,
          target.tier,
          nextErrorCount,
          target.latestCadence,
        );

        return {
          updateOne: {
            filter: {
              _id: state._id,
              lockedBy: owner,
              lockedKind: kind,
            },
            update: {
              $set: {
                [dueField]: new Date(failedAt.getTime() + backoffMs),
                [`lastErrorAt.${kind}`]: failedAt,
                [`lastError.${kind}`]: message,
                [`errorCount.${kind}`]: nextErrorCount,
                updatedAt: failedAt,
              },
              $unset: {
                lockedUntil: "",
                lockedBy: "",
                lockedKind: "",
              },
            },
          },
        };
      })
      .filter(Boolean);

    await this.bulkWrite(operations);
  }

  async markDueNow(
    kind: FomoV2MarketSyncKind,
    targets: FomoV2MarketSyncTargetPayload[],
    dueAt = new Date(),
  ): Promise<void> {
    const dueField = DUE_FIELD_BY_KIND[kind];
    const ids = targets.map((target) => this.toObjectId(target.syncStateId)).filter(Boolean);
    if (!ids.length) return;

    await this.syncStateModel.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          [dueField]: dueAt,
          updatedAt: dueAt,
        },
      },
    );
  }

  private buildReconcileOperation(row: any, now: Date): any | undefined {
    const marketAssetId = this.toObjectId(row?.marketAssetId);
    const coingeckoId = this.normalizeCoinGeckoId(row?.providerIds?.coingeckoId);
    if (!marketAssetId || !coingeckoId) return undefined;

    const rank = this.toFiniteNumber(row?.rank);
    const tier = this.resolveTier(row?.tier, rank);
    if (!tier) return undefined;

    return {
      updateOne: {
        filter: { marketAssetId },
        update: {
          $set: this.cleanObject({
            canonicalProjectId: this.toObjectId(row?.canonicalProjectId),
            marketAssetId,
            coingeckoId,
            symbol: row?.symbol,
            name: row?.name,
            rank,
            tier,
            trading: row?.trading || "CURRENTLY_TRADING",
            status: row?.status || "active",
            "meta.reconciledAt": now,
            updatedAt: now,
          }),
          $setOnInsert: {
            latestDueAt: now,
            historyDueAt: this.initialDueAt("history", tier, marketAssetId, now),
            chart7dDueAt: this.initialDueAt("chart7d", tier, marketAssetId, now),
            performanceDueAt: this.initialDueAt("performance", tier, marketAssetId, now),
            roiDueAt: this.initialDueAt("roi", tier, marketAssetId, now),
            exchangesDueAt: this.initialDueAt("exchanges", tier, marketAssetId, now),
            createdAt: now,
          },
        },
        upsert: true,
      },
    };
  }

  private async loadStatesByTargetIds(targets: FomoV2MarketSyncTargetPayload[]): Promise<any[]> {
    const ids = targets.map((target) => this.toObjectId(target.syncStateId)).filter(Boolean);
    if (!ids.length) return [];
    return this.syncStateModel.find({ _id: { $in: ids } }).select("_id errorCount").lean();
  }

  private async bulkWrite(operations: any[]): Promise<void> {
    if (!operations.length) return;
    await this.syncStateModel.bulkWrite(operations, { ordered: false });
  }

  private failureBackoffMs(
    kind: FomoV2MarketSyncKind,
    tier: MarketDataTier,
    errorCount: number,
    latestCadence?: FomoV2MarketSyncTargetPayload["latestCadence"],
  ): number {
    const baseMs = this.positiveInteger(process.env.FOMO_V2_MARKET_SYNC_FAILURE_BACKOFF_MS, 5 * 60 * 1000);
    const maxMs = Math.max(
      baseMs,
      this.positiveInteger(
        process.env.FOMO_V2_MARKET_SYNC_FAILURE_MAX_BACKOFF_MS,
        getFomoV2MarketSyncIntervalMs(kind, tier, latestCadence),
      ),
    );
    return Math.min(baseMs * Math.pow(2, Math.max(0, errorCount - 1)), maxMs);
  }

  private initialDueAt(
    kind: FomoV2MarketSyncKind,
    tier: MarketDataTier,
    marketAssetId: Types.ObjectId,
    now: Date,
  ): Date {
    const intervalMs = getFomoV2MarketSyncIntervalMs(kind, tier);
    const jitterMs = this.stableJitterMs(`${marketAssetId.toHexString()}:${kind}`, intervalMs);
    return new Date(now.getTime() + jitterMs);
  }

  private stableJitterMs(value: string, maxMs: number): number {
    if (maxMs <= 0) return 0;
    let hash = 0;
    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }
    return hash % maxMs;
  }

  private toTargetPayload(row: any): FomoV2MarketSyncTargetPayload | undefined {
    const syncStateId = this.toIdString(row?._id);
    const marketAssetId = this.toIdString(row?.marketAssetId);
    const coingeckoId = this.normalizeCoinGeckoId(row?.coingeckoId);
    const tier = this.resolveTier(row?.tier, this.toFiniteNumber(row?.rank));
    const rank = this.toFiniteNumber(row?.rank);

    if (!syncStateId || !marketAssetId || !coingeckoId || !tier) return undefined;

    return this.cleanObject({
      syncStateId,
      marketAssetId,
      canonicalProjectId: this.toIdString(row?.canonicalProjectId),
      coingeckoId,
      symbol: row?.symbol,
      tier,
      rank: rank === null ? undefined : rank,
      claimedAt: this.toIsoString(row?.lastClaimedAt),
      latestCadence: resolveFomoV2MarketLatestCadence(tier, rank),
    }) as FomoV2MarketSyncTargetPayload;
  }

  private resolveTier(value: any, rank: number | null): MarketDataTier | undefined {
    const tier = String(value || "").toUpperCase();
    if (tier === "HOT" || tier === "WARM" || tier === "COLD") return tier;
    if (rank === null || rank < 1) return undefined;
    if (rank <= 250) return "HOT";
    if (rank <= 5500) return "WARM";
    return "COLD";
  }

  private normalizeCoinGeckoId(value: any): string | undefined {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized || undefined;
  }

  private nextDueAt(
    kind: FomoV2MarketSyncKind,
    target: FomoV2MarketSyncTargetPayload,
    finishedAt: Date,
  ): Date {
    const intervalMs = getFomoV2MarketSyncIntervalMs(
      kind,
      target.tier,
      target.latestCadence,
    );

    if (kind === "latest" && target.claimedAt) {
      const claimedAt = new Date(target.claimedAt);
      const anchoredTime = claimedAt.getTime() + intervalMs;
      if (Number.isFinite(anchoredTime) && anchoredTime > finishedAt.getTime()) {
        return new Date(anchoredTime);
      }
    }

    return new Date(finishedAt.getTime() + intervalMs);
  }

  private toIsoString(value: any): string | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value;
    if (value instanceof mongoose.Types.ObjectId) return new Types.ObjectId(value.toHexString());
    const id = String(value?._id || value || "").trim();
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : undefined;
  }

  private toIdString(value: any): string | undefined {
    if (!value) return undefined;
    if (typeof value === "string") return value;
    if (value instanceof Types.ObjectId) return value.toHexString();
    if (value instanceof mongoose.Types.ObjectId) return value.toHexString();
    if (value._id) return this.toIdString(value._id);
    return String(value);
  }

  private toFiniteNumber(value: any): number | null {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
  }

  private cleanObject<T extends Record<string, any>>(source: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(source || {}).filter(([, value]) => value !== undefined && value !== null && value !== ""),
    ) as Partial<T>;
  }

  private formatError(error: any): string {
    return String(error?.message || error || "Unknown error").slice(0, 1000);
  }
}
