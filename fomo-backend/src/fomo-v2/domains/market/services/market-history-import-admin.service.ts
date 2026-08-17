import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Types } from "mongoose";
import { MarketDataTier } from "src/coingecko/coingecko-market.types";
import {
  FomoV2MarketHistoryImportDays,
  FomoV2MarketHistoryImportRun,
  FomoV2MarketHistoryImportRunDocument,
  FomoV2MarketHistoryImportStatus,
  FomoV2MarketHistoryImportTierState,
  FomoV2MarketProjectReadModel,
  FomoV2ProjectMarketSnapshot,
} from "../models";

export interface FomoV2AdminMarketProjectQuery {
  limit?: number | string;
  offset?: number | string;
  page?: number | string;
  searchValue?: string;
  search?: string;
  tier?: MarketDataTier | "all";
  trading?: string;
  status?: string;
  additionalStatus?: "sponsored" | "eralash" | string;
}

export interface FomoV2AdminHistoryImportStartInput {
  tiers?: Array<MarketDataTier | { tier?: MarketDataTier; days?: FomoV2MarketHistoryImportDays }>;
  delayMs?: number;
  maxRetries?: number;
  limit?: number;
  force?: boolean;
  source?: string;
}

interface NormalizedHistoryImportTier {
  tier: MarketDataTier;
  days: FomoV2MarketHistoryImportDays;
}

const DEFAULT_IMPORT_TIERS: NormalizedHistoryImportTier[] = [
  { tier: "HOT", days: "max" },
  { tier: "WARM", days: 730 },
  { tier: "COLD", days: 365 },
];

const ACTIVE_STATUSES: FomoV2MarketHistoryImportStatus[] = ["queued", "running"];

@Injectable()
export class FomoV2MarketHistoryImportAdminService {
  private readonly logger = new Logger(FomoV2MarketHistoryImportAdminService.name);

  constructor(
    @InjectModel(FomoV2MarketHistoryImportRun.name)
    private readonly importRunModel: Model<FomoV2MarketHistoryImportRun>,
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly readModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(FomoV2ProjectMarketSnapshot.name)
    private readonly snapshotModel: Model<FomoV2ProjectMarketSnapshot>,
  ) {}

  async listMarketProjects(query: FomoV2AdminMarketProjectQuery = {}): Promise<any> {
    const limit = this.clampInteger(query.limit, 20, 1, 100);
    const page = this.clampInteger(query.page, 1, 1, 10_000);
    const offset = query.offset !== undefined
      ? this.clampInteger(query.offset, 0, 0, 1_000_000)
      : (page - 1) * limit;
    const filter = this.buildMarketProjectFilter(query);

    const [total, rows] = await Promise.all([
      this.readModel.countDocuments(filter),
      this.readModel
        .find(filter)
        .sort({ rank: 1, _id: 1 })
        .skip(offset)
        .limit(limit)
        .select(
          "_id canonicalProjectId marketAssetId providerIds name symbol logo niche category rank tier trading status price priceChange marketCap volume24h marketDataUpdatedAt chart7dUpdatedAt chart7dPointsCount chart7dTrend performanceUpdatedAt isSponsored isEralash eralashAdded",
        )
        .lean(),
    ]);
    const marketAssetIds = rows
      .map((row: any) => this.toObjectId(row.marketAssetId))
      .filter((value): value is Types.ObjectId => Boolean(value));
    const snapshotStats = await this.loadSnapshotStats(marketAssetIds);

    return {
      source: "fomo_v2_market_project_read_models",
      total,
      limit,
      offset,
      page,
      projects: rows.map((row: any) => this.toAdminMarketProject(row, snapshotStats)),
    };
  }

  async updateSponsoredStatus(id: string): Promise<any> {
    const project = await this.findMarketProjectForStatus(id);
    if (!project) throw new NotFoundException("FOMO v2 market project not found");

    const isSponsored = !Boolean(project.isSponsored);
    const updated = await this.readModel
      .findByIdAndUpdate(
        project._id,
        {
          $set: {
            isSponsored,
            updatedAt: new Date(),
          },
        },
        { new: true },
      )
      .select(
        "_id canonicalProjectId marketAssetId providerIds name symbol logo niche category rank tier trading status price priceChange marketCap volume24h marketDataUpdatedAt chart7dUpdatedAt chart7dPointsCount chart7dTrend performanceUpdatedAt isSponsored isEralash eralashAdded",
      )
      .lean();

    return {
      success: true,
      project: this.toAdminMarketProject(updated, new Map()),
    };
  }

  async updateEralashStatus(id: string): Promise<any> {
    const project = await this.findMarketProjectForStatus(id);
    if (!project) throw new NotFoundException("FOMO v2 market project not found");

    const isEralash = !Boolean(project.isEralash);
    const now = new Date();
    const updated = await this.readModel
      .findByIdAndUpdate(
        project._id,
        {
          $set: {
            isEralash,
            updatedAt: now,
            ...(isEralash ? { eralashAdded: now } : {}),
          },
          ...(!isEralash ? { $unset: { eralashAdded: "" } } : {}),
        },
        { new: true },
      )
      .select(
        "_id canonicalProjectId marketAssetId providerIds name symbol logo niche category rank tier trading status price priceChange marketCap volume24h marketDataUpdatedAt chart7dUpdatedAt chart7dPointsCount chart7dTrend performanceUpdatedAt isSponsored isEralash eralashAdded",
      )
      .lean();

    return {
      success: true,
      project: this.toAdminMarketProject(updated, new Map()),
    };
  }

  async startHistoryImport(
    input: FomoV2AdminHistoryImportStartInput = {},
    user?: any,
  ): Promise<any> {
    const force = input.force === true;
    const active = await this.importRunModel
      .findOne({ status: { $in: ACTIVE_STATUSES } })
      .sort({ createdAt: -1 })
      .lean();

    if (active && !force) {
      return {
        started: false,
        reason: "active_history_import_exists",
        run: this.serializeRun(active),
      };
    }

    const now = new Date();
    const tiers = this.normalizeImportTiers(input.tiers).map((item) => ({
      tier: item.tier,
      days: item.days,
      status: "pending",
      totalAssets: 0,
      processedAssets: 0,
      historyRequests: 0,
      snapshotsWouldWrite: 0,
      snapshotsCreated: 0,
      snapshotsUpdated: 0,
      errorsCount: 0,
    }));
    const run = await this.importRunModel.create({
      status: "queued",
      source: input.source || "admin",
      requestedBy: this.userId(user),
      requestedByEmail: user?.email,
      progressPercent: 0,
      tiers,
      options: {
        delayMs: this.nonNegativeInteger(input.delayMs, 1500),
        maxRetries: this.positiveInteger(input.maxRetries, 5),
        limit: this.nonNegativeLimit(input.limit, 0),
      },
      totals: this.emptyTotals(),
      warnings: [],
      errors: [],
      lastHeartbeatAt: now,
    });

    return {
      started: true,
      run: this.serializeRun(run.toObject()),
    };
  }

  async listHistoryImportRuns(query: any = {}): Promise<any> {
    const limit = this.clampInteger(query.limit, 10, 1, 50);
    const rows = await this.importRunModel
      .find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return {
      runs: rows.map((row) => this.serializeRun(row)),
    };
  }

  async getLatestHistoryImportRun(): Promise<any> {
    const run = await this.importRunModel.findOne({}).sort({ createdAt: -1 }).lean();
    return {
      run: run ? this.serializeRun(run) : null,
    };
  }

  async getHistoryImportRun(id: string): Promise<any> {
    const objectId = this.parseObjectId(id, "id");
    const run = await this.importRunModel.findById(objectId).lean();
    if (!run) throw new NotFoundException("History import run not found");
    return {
      run: this.serializeRun(run),
    };
  }

  async claimNextQueuedRun(workerId: string): Promise<FomoV2MarketHistoryImportRunDocument | null> {
    const now = new Date();
    return this.importRunModel.findOneAndUpdate(
      { status: "queued" },
      {
        $set: {
          status: "running",
          workerId,
          startedAt: now,
          lastHeartbeatAt: now,
          progressPercent: 0,
        },
      },
      {
        sort: { createdAt: 1 },
        new: true,
      },
    );
  }

  async markTierStarted(runId: any, tier: MarketDataTier): Promise<void> {
    const now = new Date();
    await this.importRunModel.updateOne(
      { _id: runId, "tiers.tier": tier },
      {
        $set: {
          status: "running",
          activeTier: tier,
          activeCoingeckoId: "",
          activeAssetName: "",
          lastHeartbeatAt: now,
          "tiers.$.status": "running",
          "tiers.$.startedAt": now,
        },
      },
    );
  }

  async updateTierProgress(
    runId: any,
    tier: MarketDataTier,
    patch: Partial<FomoV2MarketHistoryImportTierState> & {
      activeCoingeckoId?: string;
      activeAssetName?: string;
    },
  ): Promise<void> {
    const now = new Date();
    const set: Record<string, any> = {
      lastHeartbeatAt: now,
    };

    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      if (key === "activeCoingeckoId" || key === "activeAssetName") {
        set[key] = value;
      } else {
        set[`tiers.$.${key}`] = value;
      }
    }

    await this.importRunModel.updateOne(
      { _id: runId, "tiers.tier": tier },
      { $set: set },
    );
    await this.refreshRunTotals(runId);
  }

  async markTierCompleted(
    runId: any,
    tier: MarketDataTier,
    patch: Partial<FomoV2MarketHistoryImportTierState>,
  ): Promise<void> {
    await this.updateTierProgress(runId, tier, {
      ...patch,
      status: "completed",
      finishedAt: new Date(),
    });
  }

  async markRunCompleted(runId: any): Promise<void> {
    const now = new Date();
    const run = await this.importRunModel.findById(runId).lean();
    const startedAt = run?.startedAt ? new Date(run.startedAt) : undefined;
    await this.importRunModel.updateOne(
      { _id: runId },
      {
        $set: {
          status: "completed",
          activeTier: "",
          activeCoingeckoId: "",
          activeAssetName: "",
          progressPercent: 100,
          finishedAt: now,
          durationMs: startedAt ? Math.max(0, now.getTime() - startedAt.getTime()) : undefined,
          lastHeartbeatAt: now,
        },
      },
    );
  }

  async markRunFailed(runId: any, error: any): Promise<void> {
    const now = new Date();
    const message = this.formatError(error);
    const run = await this.importRunModel.findById(runId).lean();
    const startedAt = run?.startedAt ? new Date(run.startedAt) : undefined;

    await this.importRunModel.updateOne(
      { _id: runId },
      {
        $set: {
          status: "failed",
          errorMessage: message,
          finishedAt: now,
          durationMs: startedAt ? Math.max(0, now.getTime() - startedAt.getTime()) : undefined,
          lastHeartbeatAt: now,
        },
        $push: {
          errors: {
            message,
            at: now,
          },
        },
      },
    );
  }

  serializeRun(run: any): any {
    const tiers = Array.isArray(run?.tiers) ? run.tiers : [];
    const totals = this.calculateTotals(tiers);
    return {
      id: this.toIdString(run?._id),
      status: run?.status,
      source: run?.source,
      requestedBy: run?.requestedBy,
      requestedByEmail: run?.requestedByEmail,
      workerId: run?.workerId,
      activeTier: run?.activeTier,
      activeCoingeckoId: run?.activeCoingeckoId,
      activeAssetName: run?.activeAssetName,
      progressPercent: this.roundPercent(run?.progressPercent ?? totals.progressPercent),
      startedAt: run?.startedAt,
      finishedAt: run?.finishedAt,
      lastHeartbeatAt: run?.lastHeartbeatAt,
      durationMs: run?.durationMs,
      options: run?.options || {},
      tiers,
      totals: {
        ...(run?.totals || {}),
        ...totals,
      },
      warnings: run?.warnings || [],
      errors: run?.errors || [],
      errorMessage: run?.errorMessage,
      createdAt: run?.createdAt,
      updatedAt: run?.updatedAt,
    };
  }

  private buildMarketProjectFilter(query: FomoV2AdminMarketProjectQuery): Record<string, any> {
    const filter: Record<string, any> = {
      trading: query.trading || "CURRENTLY_TRADING",
      status: query.status || "active",
      marketAssetId: { $exists: true },
      rank: { $type: "number", $gt: 0 },
      "providerIds.coingeckoId": { $type: "string", $ne: "" },
    };
    const tier = String(query.tier || "all").toUpperCase();
    if (tier === "HOT" || tier === "WARM" || tier === "COLD") {
      filter.tier = tier;
    }

    const additionalStatus = String(query.additionalStatus || "").toLowerCase();
    if (additionalStatus === "sponsored") {
      filter.isSponsored = true;
    }
    if (additionalStatus === "eralash") {
      filter.isEralash = true;
    }

    const search = String(query.searchValue || query.search || "").trim();
    if (search) {
      const pattern = new RegExp(this.escapeRegExp(search), "i");
      filter.$or = [
        { name: pattern },
        { symbol: pattern },
        { "providerIds.coingeckoId": pattern },
      ];
    }

    return filter;
  }

  private async findMarketProjectForStatus(id: string): Promise<any | null> {
    const text = String(id || "").trim();
    if (!text) return null;

    const or: any[] = [
      { "providerIds.coingeckoId": text.toLowerCase() },
      { legacyRouteId: text },
    ];

    if (Types.ObjectId.isValid(text)) {
      const objectId = new Types.ObjectId(text);
      or.push(
        { _id: objectId },
        { marketAssetId: objectId },
        { canonicalProjectId: objectId },
        { legacyProjectId: objectId },
      );
    }

    return this.readModel.findOne({ $or: or }).lean();
  }

  private async loadSnapshotStats(marketAssetIds: Types.ObjectId[]): Promise<Map<string, any>> {
    if (!marketAssetIds.length) return new Map();
    const rows = await this.snapshotModel.aggregate([
      {
        $match: {
          marketAssetId: { $in: marketAssetIds },
          provider: "coingecko",
          priceUsd: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: "$marketAssetId",
          historyPoints: { $sum: 1 },
          firstHistoryAt: { $min: "$timestamp" },
          latestHistoryAt: { $max: "$timestamp" },
        },
      },
    ]);

    return new Map(rows.map((row: any) => [this.toIdString(row._id), row]));
  }

  private toAdminMarketProject(row: any, snapshotStats: Map<string, any>): any {
    const marketAssetId = this.toIdString(row.marketAssetId);
    const stats = snapshotStats.get(marketAssetId || "") || {};

    return {
      _id: this.toIdString(row._id),
      readModelId: this.toIdString(row._id),
      canonicalProjectId: this.toIdString(row.canonicalProjectId),
      marketAssetId,
      coingeckoId: row.providerIds?.coingeckoId,
      name: row.name,
      symbol: row.symbol,
      logo: row.logo,
      niche: row.niche || row.category,
      tier: row.tier,
      rank: row.rank,
      trading: row.trading,
      status: row.status,
      price: row.price,
      priceChange: row.priceChange,
      marketCap: row.marketCap,
      volume24h: row.volume24h,
      marketDataUpdatedAt: row.marketDataUpdatedAt,
      chart7dUpdatedAt: row.chart7dUpdatedAt,
      chart7dPointsCount: row.chart7dPointsCount,
      chart7dTrend: row.chart7dTrend,
      performanceUpdatedAt: row.performanceUpdatedAt,
      isSponsored: Boolean(row.isSponsored),
      isEralash: Boolean(row.isEralash),
      eralashAdded: row.eralashAdded,
      historyPoints: stats.historyPoints || 0,
      firstHistoryAt: stats.firstHistoryAt,
      latestHistoryAt: stats.latestHistoryAt,
    };
  }

  private normalizeImportTiers(input: FomoV2AdminHistoryImportStartInput["tiers"]): NormalizedHistoryImportTier[] {
    const raw = Array.isArray(input) && input.length ? input : DEFAULT_IMPORT_TIERS;
    const seen = new Set<string>();
    const result: NormalizedHistoryImportTier[] = [];

    for (const item of raw) {
      const tier = typeof item === "string" ? item : item?.tier;
      if (!this.isMarketDataTier(tier) || seen.has(tier)) continue;
      seen.add(tier);
      result.push({
        tier,
        days: this.normalizeDays(typeof item === "string" ? undefined : item?.days, tier),
      });
    }

    return result.length ? result : DEFAULT_IMPORT_TIERS;
  }

  private normalizeDays(value: any, tier: MarketDataTier): FomoV2MarketHistoryImportDays {
    if (value === "max") return "max";
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return Math.trunc(parsed);
    if (tier === "HOT") return "max";
    if (tier === "WARM") return 730;
    return 365;
  }

  private async refreshRunTotals(runId: any): Promise<void> {
    const run = await this.importRunModel.findById(runId).select("tiers").lean();
    if (!run) return;
    const totals = this.calculateTotals(run.tiers || []);
    await this.importRunModel.updateOne(
      { _id: runId },
      {
        $set: {
          totals,
          progressPercent: totals.progressPercent,
        },
      },
    );
  }

  private calculateTotals(tiers: any[]): Record<string, any> {
    const totals = {
      totalAssets: 0,
      processedAssets: 0,
      historyRequests: 0,
      snapshotsWouldWrite: 0,
      snapshotsCreated: 0,
      snapshotsUpdated: 0,
      errorsCount: 0,
      progressPercent: 0,
    };

    for (const tier of tiers || []) {
      totals.totalAssets += Number(tier?.totalAssets || 0);
      totals.processedAssets += Number(tier?.processedAssets || 0);
      totals.historyRequests += Number(tier?.historyRequests || 0);
      totals.snapshotsWouldWrite += Number(tier?.snapshotsWouldWrite || 0);
      totals.snapshotsCreated += Number(tier?.snapshotsCreated || 0);
      totals.snapshotsUpdated += Number(tier?.snapshotsUpdated || 0);
      totals.errorsCount += Number(tier?.errorsCount || 0);
    }

    totals.progressPercent = totals.totalAssets > 0
      ? this.roundPercent((totals.processedAssets / totals.totalAssets) * 100)
      : 0;
    return totals;
  }

  private emptyTotals(): Record<string, any> {
    return this.calculateTotals([]);
  }

  private userId(user: any): string | undefined {
    return this.toIdString(user?._id || user?.id);
  }

  private parseObjectId(value: string, fieldName: string): Types.ObjectId {
    const text = String(value || "").trim();
    if (!Types.ObjectId.isValid(text)) {
      throw new Error(`Invalid ${fieldName} value "${value}". Expected Mongo ObjectId.`);
    }
    return new Types.ObjectId(text);
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value;
    if (value instanceof mongoose.Types.ObjectId) return new Types.ObjectId(value.toHexString());
    const text = String(value?._id || value || "").trim();
    return Types.ObjectId.isValid(text) ? new Types.ObjectId(text) : undefined;
  }

  private toIdString(value: any): string | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value.toHexString();
    if (value instanceof mongoose.Types.ObjectId) return value.toHexString();
    return String(value?._id || value || "").trim() || undefined;
  }

  private isMarketDataTier(value: any): value is MarketDataTier {
    return value === "HOT" || value === "WARM" || value === "COLD";
  }

  private nonNegativeLimit(value: any, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    if (parsed <= 0) return 0;
    return Math.trunc(parsed);
  }

  private nonNegativeInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : fallback;
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : fallback;
  }

  private clampInteger(value: any, fallback: number, min: number, max: number): number {
    const parsed = Number(value);
    const normalized = Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
    return Math.max(min, Math.min(max, normalized));
  }

  private roundPercent(value: any): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.round(Math.max(0, Math.min(100, parsed)) * 100) / 100;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private formatError(error: any): string {
    return String(error?.message || error || "Unknown error");
  }
}
