import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  FomoV2CanonicalProjectSource,
  FomoV2MarketAsset,
  FomoV2MigrationRun,
  FomoV2ProjectAssetLink,
  FomoV2SourceEntity,
  FomoV2SourceSnapshot,
} from "../models";

type CollectionCounters = {
  sourceSnapshots: number;
  sourceEntities: number;
  marketAssets: number;
  canonicalProjects: number;
  projectAssetLinks: number;
  canonicalProjectSources: number;
};

export interface CoinGeckoMarketUniverseReportOptions {
  runId?: string;
  examplesLimit?: number;
}

export interface CoinGeckoMarketUniverseReport {
  dbName: string;
  migrationRun?: {
    id: string;
    runKey?: string;
    status?: string;
    startedAt?: Date;
    finishedAt?: Date;
    options?: Record<string, any>;
    errorsCount: number;
    warningsCount: number;
  };
  scannedRows: number;
  uniqueCoingeckoIds: number;
  duplicatesInResponse: number;
  created: CollectionCounters;
  reused: CollectionCounters;
  updated: CollectionCounters;
  staleAssets: number;
  missingLinks: number;
  missingSourceEntities: number;
  missingCanonicalSources: number;
  database: {
    totalCoingeckoSourceEntities: number;
    totalCoingeckoMarketAssets: number;
    totalProjectAssetLinks: number;
    totalCanonicalProjectSources: number;
    totalSourceSnapshots: number;
  };
  consistency: {
    sourceEntitiesWithoutCanonical: number;
    sourceEntitiesWithoutMarketAsset: number;
    duplicateSourceEntities: number;
    duplicateMarketAssets: number;
    duplicateCanonicalProjectSources: number;
    duplicateProjectAssetLinks: number;
  };
  examples: {
    staleAssets: Array<{ coingeckoId: string; name?: string }>;
    missingLinks: Array<{ coingeckoId: string; marketAssetId: string; name?: string }>;
    missingSourceEntities: Array<{ coingeckoId: string; marketAssetId: string; name?: string }>;
    missingCanonicalSources: Array<{ coingeckoId: string; sourceEntityId: string }>;
  };
}

export interface CoinGeckoMarketUniverseReportInput {
  dbName: string;
  migrationRun?: any;
  collectionCounts: {
    sourceSnapshots: number;
  };
  sourceEntities: any[];
  marketAssets: any[];
  projectAssetLinks: any[];
  canonicalProjectSources: any[];
  examplesLimit: number;
}

@Injectable()
export class CoinGeckoMarketUniverseReportService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(FomoV2MigrationRun.name)
    private readonly migrationRunModel: Model<FomoV2MigrationRun>,
    @InjectModel(FomoV2SourceSnapshot.name)
    private readonly sourceSnapshotModel: Model<FomoV2SourceSnapshot>,
    @InjectModel(FomoV2SourceEntity.name)
    private readonly sourceEntityModel: Model<FomoV2SourceEntity>,
    @InjectModel(FomoV2MarketAsset.name)
    private readonly marketAssetModel: Model<FomoV2MarketAsset>,
    @InjectModel(FomoV2ProjectAssetLink.name)
    private readonly projectAssetLinkModel: Model<FomoV2ProjectAssetLink>,
    @InjectModel(FomoV2CanonicalProjectSource.name)
    private readonly canonicalProjectSourceModel: Model<FomoV2CanonicalProjectSource>,
  ) {}

  async buildReport(options: CoinGeckoMarketUniverseReportOptions = {}): Promise<CoinGeckoMarketUniverseReport> {
    const examplesLimit = this.parseExamplesLimit(options.examplesLimit);
    const migrationRun = await this.findMigrationRun(options.runId);

    const [
      sourceSnapshotCount,
      sourceEntities,
      marketAssets,
      projectAssetLinks,
      canonicalProjectSources,
    ] = await Promise.all([
      this.sourceSnapshotModel.countDocuments({ source: "coingecko", sourceEntityType: "asset" }),
      this.sourceEntityModel
        .find(
          { source: "coingecko", sourceEntityType: "asset" },
          { sourceId: 1, canonicalProjectId: 1, metadata: 1 },
        )
        .lean(),
      this.marketAssetModel
        .find(
          { "providerIds.coingeckoId": { $exists: true, $ne: null } },
          { providerIds: 1, name: 1, metadata: 1 },
        )
        .lean(),
      this.projectAssetLinkModel
        .find(
          {},
          { canonicalProjectId: 1, marketAssetId: 1, relationType: 1, status: 1 },
        )
        .lean(),
      this.canonicalProjectSourceModel
        .find(
          { source: "coingecko", sourceEntityType: "asset" },
          { sourceId: 1, sourceEntityId: 1, canonicalProjectId: 1, status: 1 },
        )
        .lean(),
    ]);

    return buildCoinGeckoMarketUniverseReport({
      dbName: this.dbName(),
      migrationRun,
      collectionCounts: {
        sourceSnapshots: sourceSnapshotCount,
      },
      sourceEntities,
      marketAssets,
      projectAssetLinks,
      canonicalProjectSources,
      examplesLimit,
    });
  }

  private async findMigrationRun(runId?: string): Promise<any | undefined> {
    if (runId) {
      return this.migrationRunModel.findById(runId).lean();
    }

    return this.migrationRunModel
      .findOne({
        type: "coingecko_market_universe",
        dryRun: false,
        status: "completed",
      })
      .sort({ startedAt: -1, _id: -1 })
      .lean();
  }

  private dbName(): string {
    return String(this.configService.get<string>("DB_NAME") || process.env.DB_NAME || "fomoland").trim() || "fomoland";
  }

  private parseExamplesLimit(value?: number): number {
    if (!Number.isFinite(value)) return 10;
    return Math.max(0, Math.trunc(Number(value)));
  }
}

export function buildCoinGeckoMarketUniverseReport(
  input: CoinGeckoMarketUniverseReportInput,
): CoinGeckoMarketUniverseReport {
  const migrationRun = input.migrationRun;
  const migrationRunId = toIdString(migrationRun?._id);
  const scannedRows = numberAt(migrationRun?.counters, ["scanned"]);

  const sourceEntities = input.sourceEntities || [];
  const marketAssets = input.marketAssets || [];
  const projectAssetLinks = input.projectAssetLinks || [];
  const canonicalProjectSources = input.canonicalProjectSources || [];

  const sourceEntityIds = sourceEntities.map((entity) => stringValue(entity.sourceId)).filter(Boolean);
  const sourceEntityIdSet = new Set(sourceEntityIds);
  const touchedSourceEntityIds = new Set(
    sourceEntities
      .filter((entity) => migrationRunId && stringValue(entity.metadata?.latestMigrationRunId) === migrationRunId)
      .map((entity) => stringValue(entity.sourceId))
      .filter(Boolean),
  );

  const marketAssetIds = marketAssets.map((asset) => stringValue(asset.providerIds?.coingeckoId)).filter(Boolean);
  const marketAssetIdSet = new Set(marketAssetIds);
  const activePrimaryMarketAssetLinks = new Set(
    projectAssetLinks
      .filter((link) => link.status === "active" && link.relationType === "primary_token")
      .map((link) => toIdString(link.marketAssetId))
      .filter(Boolean),
  );

  const canonicalSourceIds = canonicalProjectSources.map((source) => stringValue(source.sourceId)).filter(Boolean);
  const canonicalSourceIdSet = new Set(canonicalSourceIds);
  const projectAssetLinkKeys = projectAssetLinks.map((link) =>
    [
      toIdString(link.canonicalProjectId),
      toIdString(link.marketAssetId),
      stringValue(link.relationType),
    ].join(":"),
  );

  const staleAssetDocs = marketAssets.filter((asset) => {
    const coingeckoId = stringValue(asset.providerIds?.coingeckoId);
    return coingeckoId && migrationRunId && !touchedSourceEntityIds.has(coingeckoId);
  });

  const missingLinkDocs = marketAssets.filter((asset) => !activePrimaryMarketAssetLinks.has(toIdString(asset._id)));
  const missingSourceEntityDocs = marketAssets.filter((asset) => {
    const coingeckoId = stringValue(asset.providerIds?.coingeckoId);
    return coingeckoId && !sourceEntityIdSet.has(coingeckoId);
  });
  const missingCanonicalSourceDocs = sourceEntities.filter((entity) => {
    const coingeckoId = stringValue(entity.sourceId);
    return coingeckoId && !canonicalSourceIdSet.has(coingeckoId);
  });

  const uniqueCoingeckoIds = migrationRunId ? touchedSourceEntityIds.size : sourceEntityIdSet.size;
  const created = collectionCounters(migrationRun, "created");
  const reused = collectionCounters(migrationRun, "reused");
  const updated = {
    ...reused,
    canonicalProjects: numberAt(migrationRun?.counters, ["resolver", "matched"]),
  };

  return {
    dbName: input.dbName,
    migrationRun: migrationRun
      ? {
          id: migrationRunId,
          runKey: migrationRun.runKey,
          status: migrationRun.status,
          startedAt: migrationRun.startedAt,
          finishedAt: migrationRun.finishedAt,
          options: migrationRun.options,
          errorsCount: numberAt(migrationRun?.counters, ["errorsCount"]),
          warningsCount: Array.isArray(migrationRun?.metadata?.warnings) ? migrationRun.metadata.warnings.length : 0,
        }
      : undefined,
    scannedRows,
    uniqueCoingeckoIds,
    duplicatesInResponse: Math.max(0, scannedRows - uniqueCoingeckoIds),
    created,
    reused,
    updated,
    staleAssets: staleAssetDocs.length,
    missingLinks: missingLinkDocs.length,
    missingSourceEntities: missingSourceEntityDocs.length,
    missingCanonicalSources: missingCanonicalSourceDocs.length,
    database: {
      totalCoingeckoSourceEntities: sourceEntityIdSet.size,
      totalCoingeckoMarketAssets: marketAssetIdSet.size,
      totalProjectAssetLinks: projectAssetLinks.length,
      totalCanonicalProjectSources: canonicalSourceIdSet.size,
      totalSourceSnapshots: input.collectionCounts.sourceSnapshots,
    },
    consistency: {
      sourceEntitiesWithoutCanonical: sourceEntities.filter((entity) => !entity.canonicalProjectId).length,
      sourceEntitiesWithoutMarketAsset: sourceEntities.filter((entity) => {
        const coingeckoId = stringValue(entity.sourceId);
        return coingeckoId && !marketAssetIdSet.has(coingeckoId);
      }).length,
      duplicateSourceEntities: duplicateCount(sourceEntityIds),
      duplicateMarketAssets: duplicateCount(marketAssetIds),
      duplicateCanonicalProjectSources: duplicateCount(canonicalSourceIds),
      duplicateProjectAssetLinks: duplicateCount(projectAssetLinkKeys),
    },
    examples: {
      staleAssets: staleAssetDocs.slice(0, input.examplesLimit).map((asset) => ({
        coingeckoId: stringValue(asset.providerIds?.coingeckoId),
        name: asset.name,
      })),
      missingLinks: missingLinkDocs.slice(0, input.examplesLimit).map((asset) => ({
        coingeckoId: stringValue(asset.providerIds?.coingeckoId),
        marketAssetId: toIdString(asset._id),
        name: asset.name,
      })),
      missingSourceEntities: missingSourceEntityDocs.slice(0, input.examplesLimit).map((asset) => ({
        coingeckoId: stringValue(asset.providerIds?.coingeckoId),
        marketAssetId: toIdString(asset._id),
        name: asset.name,
      })),
      missingCanonicalSources: missingCanonicalSourceDocs.slice(0, input.examplesLimit).map((entity) => ({
        coingeckoId: stringValue(entity.sourceId),
        sourceEntityId: toIdString(entity._id),
      })),
    },
  };
}

function collectionCounters(migrationRun: any, key: "created" | "reused"): CollectionCounters {
  return {
    sourceSnapshots: numberAt(migrationRun?.counters, ["written", "sourceSnapshots", key]),
    sourceEntities: numberAt(migrationRun?.counters, ["written", "sourceEntities", key]),
    marketAssets: numberAt(migrationRun?.counters, ["written", "marketAssets", key]),
    canonicalProjects: numberAt(migrationRun?.counters, ["written", "canonicalProjects", key]),
    projectAssetLinks: numberAt(migrationRun?.counters, ["written", "projectAssetLinks", key]),
    canonicalProjectSources: numberAt(migrationRun?.counters, ["written", "canonicalProjectSources", key]),
  };
}

function numberAt(value: any, path: string[]): number {
  let current = value;
  for (const key of path) {
    current = current?.[key];
  }
  return Number.isFinite(Number(current)) ? Number(current) : 0;
}

function duplicateCount(values: string[]): number {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return duplicates.size;
}

function stringValue(value: any): string {
  return typeof value === "string" ? value : "";
}

function toIdString(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toHexString === "function") return value.toHexString();
  if (typeof value.toString === "function") return value.toString();
  return "";
}
