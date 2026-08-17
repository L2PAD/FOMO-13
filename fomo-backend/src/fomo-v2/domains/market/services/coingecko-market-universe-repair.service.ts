import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  FomoV2CanonicalProject,
  FomoV2CanonicalProjectSource,
  FomoV2MarketAsset,
  FomoV2ProjectAssetLink,
  FomoV2SourceEntity,
  FomoV2SourceSnapshot,
} from "../models";
import { FomoV2MigrationRunWriterService } from "../../../services/migration-run-writer.service";
import { FomoV2ParserControlPolicyService } from "../../parser-control/services/parser-control-policy.service";

export interface CoinGeckoMarketUniverseRepairOptions {
  mode?: "dry-run" | "write";
  confirmWrite?: boolean;
  limit?: number;
  sourceIds?: string[];
}

export interface CoinGeckoMarketUniverseRepairResult {
  mode: "dry-run" | "write";
  dbName: string;
  migrationRunId?: string;
  scanned: number;
  planned: number;
  repaired: number;
  skipped: number;
  would: {
    createCanonicalProjects: number;
    updateSourceEntities: number;
    updateProjectAssetLinks: number;
    updateCanonicalProjectSources: number;
  };
  written: {
    canonicalProjects: UpsertCounter;
    sourceEntitiesUpdated: number;
    projectAssetLinksUpdated: number;
    canonicalProjectSourcesUpdated: number;
  };
  warnings: string[];
  errors: Array<{ sourceId?: string; message: string }>;
  items: CoinGeckoMarketUniverseRepairItem[];
}

interface UpsertCounter {
  created: number;
  reused: number;
}

interface CoinGeckoMarketUniverseRepairItem {
  sourceEntityId: string;
  sourceId: string;
  marketAssetId?: string;
  oldCanonicalProjectId?: string;
  newCanonicalProjectId?: string;
  oldProjectAssetLinkId?: string;
  canonicalProjectSourceId?: string;
  action: "would_repair" | "repaired" | "skipped" | "error";
  reason: string;
  similarityHints: any[];
}

@Injectable()
export class CoinGeckoMarketUniverseRepairService {
  constructor(
    private readonly configService: ConfigService,
    private readonly migrationRunWriter: FomoV2MigrationRunWriterService,
    @InjectModel(FomoV2SourceEntity.name)
    private readonly sourceEntityModel: Model<FomoV2SourceEntity>,
    @InjectModel(FomoV2SourceSnapshot.name)
    private readonly sourceSnapshotModel: Model<FomoV2SourceSnapshot>,
    @InjectModel(FomoV2MarketAsset.name)
    private readonly marketAssetModel: Model<FomoV2MarketAsset>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>,
    @InjectModel(FomoV2ProjectAssetLink.name)
    private readonly projectAssetLinkModel: Model<FomoV2ProjectAssetLink>,
    @InjectModel(FomoV2CanonicalProjectSource.name)
    private readonly canonicalProjectSourceModel: Model<FomoV2CanonicalProjectSource>,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService,
  ) {}

  async run(options: CoinGeckoMarketUniverseRepairOptions = {}): Promise<CoinGeckoMarketUniverseRepairResult> {
    const mode = options.mode || "dry-run";
    if (mode === "write") this.assertWriteAllowed(options);
    if (mode === "write" && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        "market:coingecko"
      );
    }

    const result = this.emptyResult(mode);
    const entities = await this.findRepairCandidates(options);
    result.scanned = entities.length;

    let migrationRunId = "";
    if (mode === "write") {
      const run = await this.migrationRunWriter.startRun({
        type: "manual",
        dryRun: false,
        dbName: result.dbName,
        options: {
          repair: "coingecko_weak_proposed_canonical_creation",
          limit: options.limit,
          sourceIds: options.sourceIds,
        },
      });
      migrationRunId = run.id;
      result.migrationRunId = run.id;
    }

    try {
      for (const entity of entities) {
        await this.repairEntity(entity, mode, migrationRunId, result);
      }

      if (mode === "write" && migrationRunId) {
        await this.migrationRunWriter.completeRun(migrationRunId, {
          scanned: result.scanned,
          planned: result.planned,
          repaired: result.repaired,
          skipped: result.skipped,
          written: result.written,
          errorsCount: result.errors.length,
        }, {
          warnings: result.warnings,
          errors: result.errors,
        });
      }

      return result;
    } catch (error) {
      if (mode === "write" && migrationRunId) {
        await this.migrationRunWriter.failRun(migrationRunId, error, {
          scanned: result.scanned,
          planned: result.planned,
          repaired: result.repaired,
          skipped: result.skipped,
          written: result.written,
          errorsCount: result.errors.length,
        });
      }
      throw error;
    }
  }

  private async findRepairCandidates(options: CoinGeckoMarketUniverseRepairOptions): Promise<any[]> {
    const query: Record<string, any> = {
      source: "coingecko",
      sourceEntityType: "asset",
      resolutionStatus: { $in: ["proposed", "conflict"] },
      "providerIds.coingeckoId": { $type: "string" },
      matchedBy: { $in: ["name_only", "symbol_only", "strong_identity_bundle"] },
    };
    if (options.sourceIds?.length) {
      query.sourceId = { $in: options.sourceIds };
    }

    return this.sourceEntityModel
      .find(query)
      .sort({ sourceId: 1 })
      .limit(this.parseLimit(options.limit))
      .lean();
  }

  private async repairEntity(
    entity: any,
    mode: "dry-run" | "write",
    migrationRunId: string,
    result: CoinGeckoMarketUniverseRepairResult,
  ): Promise<void> {
    const sourceId = this.cleanString(entity.sourceId || entity.providerIds?.coingeckoId);
    try {
      const marketAsset = await this.marketAssetModel.findOne({ "providerIds.coingeckoId": sourceId }).lean();
      if (!marketAsset) {
        result.skipped += 1;
        result.items.push(this.item(entity, "skipped", "Missing market asset for proposed CoinGecko source entity."));
        return;
      }

      const sourceSnapshot = await this.sourceSnapshotModel
        .findOne({ source: "coingecko", sourceEntityType: "asset", sourceId })
        .sort({ capturedAt: -1, _id: -1 })
        .lean();
      const existingCanonical = await this.canonicalProjectModel
        .findOne({ "providerIds.coingeckoId": sourceId })
        .lean();
      const existingProposedLink = await this.projectAssetLinkModel
        .findOne({
          marketAssetId: this.toObjectId(marketAsset._id),
          relationType: "primary_token",
          source: "coingecko",
          status: "proposed",
        })
        .lean();
      const existingSource = await this.canonicalProjectSourceModel
        .findOne({ source: "coingecko", sourceEntityType: "asset", sourceId })
        .lean();

      result.planned += 1;
      result.would.createCanonicalProjects += existingCanonical ? 0 : 1;
      result.would.updateSourceEntities += 1;
      result.would.updateProjectAssetLinks += 1;
      result.would.updateCanonicalProjectSources += 1;

      if (mode === "dry-run") {
        result.items.push({
          ...this.item(entity, "would_repair", "Would create own canonical project for weak CoinGecko proposed/conflict match."),
          marketAssetId: this.toIdString(marketAsset._id),
          oldProjectAssetLinkId: this.toIdString(existingProposedLink?._id),
          canonicalProjectSourceId: this.toIdString(existingSource?._id),
          newCanonicalProjectId: this.toIdString(existingCanonical?._id),
        });
        return;
      }

      const canonical = await this.upsertCanonicalProject(entity, marketAsset, sourceSnapshot, migrationRunId);
      this.recordUpsert(result.written.canonicalProjects, canonical.created);
      const newCanonicalProjectId = this.toIdString(canonical.doc?._id);

      await this.sourceEntityModel.updateOne(
        { _id: this.toObjectId(entity._id) },
        {
          $set: {
            canonicalProjectId: this.toObjectId(newCanonicalProjectId),
            latestSourceSnapshotId: sourceSnapshot?._id ? this.toObjectId(sourceSnapshot._id) : undefined,
            resolutionStatus: "created",
            confidence: "exact",
            matchedBy: "provider_id",
            reason: "Repaired CoinGecko weak proposed match by creating canonical project from verified coingeckoId.",
            lastSeenAt: new Date(),
            "metadata.coinGeckoPolicyRepair": this.repairMetadata(entity, migrationRunId),
          },
        },
      );
      result.written.sourceEntitiesUpdated += 1;

      if (sourceSnapshot?._id) {
        await this.sourceSnapshotModel.updateOne(
          { _id: this.toObjectId(sourceSnapshot._id) },
          { $set: { sourceEntityId: this.toObjectId(entity._id) } },
        );
      }

      await this.updateProjectAssetLink(
        existingProposedLink,
        newCanonicalProjectId,
        marketAsset,
        sourceSnapshot,
        entity,
        migrationRunId,
      );
      result.written.projectAssetLinksUpdated += 1;

      await this.updateCanonicalProjectSource(
        newCanonicalProjectId,
        entity,
        sourceSnapshot,
        migrationRunId,
      );
      result.written.canonicalProjectSourcesUpdated += 1;

      result.repaired += 1;
      result.items.push({
        ...this.item(entity, "repaired", "Created own canonical project for weak CoinGecko proposed/conflict match."),
        marketAssetId: this.toIdString(marketAsset._id),
        oldProjectAssetLinkId: this.toIdString(existingProposedLink?._id),
        canonicalProjectSourceId: this.toIdString(existingSource?._id),
        newCanonicalProjectId,
      });
    } catch (error: any) {
      result.errors.push({ sourceId, message: error?.message || String(error) });
      result.items.push(this.item(entity, "error", error?.message || String(error)));
    }
  }

  private async upsertCanonicalProject(
    entity: any,
    marketAsset: any,
    sourceSnapshot: any,
    migrationRunId: string,
  ): Promise<{ doc: any; created: boolean }> {
    const sourceId = this.cleanString(entity.sourceId || entity.providerIds?.coingeckoId);
    const now = new Date();
    const raw = await (this.canonicalProjectModel as any).findOneAndUpdate(
      { "providerIds.coingeckoId": sourceId },
      {
        $setOnInsert: {
          name: marketAsset.name || sourceId,
          normalizedName: marketAsset.normalizedName,
          slug: marketAsset.slug || sourceId,
          symbol: marketAsset.symbol,
          normalizedSymbol: marketAsset.normalizedSymbol,
          status: "active",
          providerIds: { coingeckoId: sourceId },
          aliases: this.aliasesFromMarketAsset(marketAsset, sourceId),
          createdBy: "import",
          "metadata.bootstrapSource": "coingecko_market_universe",
          "metadata.source": "coingecko",
          "metadata.sourceUrl": entity.sourceUrl,
          "metadata.image": marketAsset.metadata?.image,
          "metadata.marketCapRank": marketAsset.metadata?.marketCapRank ?? null,
          "metadata.firstSourceSnapshotId": this.toIdString(sourceSnapshot?._id),
          "metadata.firstMigrationRunId": migrationRunId,
          "metadata.createdAt": now.toISOString(),
        },
        $set: {
          "metadata.latestCoinGeckoSourceSnapshotId": this.toIdString(sourceSnapshot?._id),
          "metadata.latestCoinGeckoMigrationRunId": migrationRunId,
          "metadata.repairedFromWeakProposed": true,
          "metadata.dedupeHints": this.similarityHints(entity),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        rawResult: true,
      },
    );

    return {
      doc: raw?.value || raw,
      created: Boolean(raw?.lastErrorObject?.upserted),
    };
  }

  private async updateProjectAssetLink(
    existingProposedLink: any,
    canonicalProjectId: string,
    marketAsset: any,
    sourceSnapshot: any,
    entity: any,
    migrationRunId: string,
  ): Promise<void> {
    const update = {
      $set: {
        status: "active",
        confidence: "exact",
        source: "coingecko",
        sourceSnapshotId: sourceSnapshot?._id ? this.toObjectId(sourceSnapshot._id) : undefined,
        verified: true,
        matchedBy: "provider_id",
        reason: "Repaired CoinGecko weak proposed link by using verified coingeckoId.",
        "metadata.latestMigrationRunId": migrationRunId,
        "metadata.resolverStatus": "created_candidate",
        "metadata.coinGeckoPolicyRepair": this.repairMetadata(entity, migrationRunId),
      },
    };

    if (existingProposedLink?._id) {
      await this.projectAssetLinkModel.updateOne({ _id: this.toObjectId(existingProposedLink._id) }, update);
      return;
    }

    await (this.projectAssetLinkModel as any).findOneAndUpdate(
      {
        canonicalProjectId: this.toObjectId(canonicalProjectId),
        marketAssetId: this.toObjectId(marketAsset._id),
        relationType: "primary_token",
      },
      {
        $setOnInsert: {
          canonicalProjectId: this.toObjectId(canonicalProjectId),
          marketAssetId: this.toObjectId(marketAsset._id),
          relationType: "primary_token",
        },
        ...update,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  private async updateCanonicalProjectSource(
    canonicalProjectId: string,
    entity: any,
    sourceSnapshot: any,
    migrationRunId: string,
  ): Promise<void> {
    await (this.canonicalProjectSourceModel as any).findOneAndUpdate(
      { source: "coingecko", sourceEntityType: "asset", sourceId: entity.sourceId },
      {
        $setOnInsert: {
          source: "coingecko",
          sourceEntityType: "asset",
          sourceId: entity.sourceId,
        },
        $set: {
          canonicalProjectId: this.toObjectId(canonicalProjectId),
          sourceSlug: entity.sourceSlug,
          sourceUrl: entity.sourceUrl,
          sourceEntityId: this.toObjectId(entity._id),
          sourceSnapshotId: sourceSnapshot?._id ? this.toObjectId(sourceSnapshot._id) : undefined,
          confidence: "exact",
          matchedBy: "provider_id",
          reason: "Repaired CoinGecko weak proposed source by using verified coingeckoId.",
          verified: true,
          status: "active",
          "metadata.latestMigrationRunId": migrationRunId,
          "metadata.resolverStatus": "created_candidate",
          "metadata.coinGeckoPolicyRepair": this.repairMetadata(entity, migrationRunId),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  private item(entity: any, action: CoinGeckoMarketUniverseRepairItem["action"], reason: string): CoinGeckoMarketUniverseRepairItem {
    return {
      sourceEntityId: this.toIdString(entity._id),
      sourceId: this.cleanString(entity.sourceId || entity.providerIds?.coingeckoId),
      oldCanonicalProjectId: this.toIdString(entity.canonicalProjectId),
      action,
      reason,
      similarityHints: this.similarityHints(entity),
    };
  }

  private repairMetadata(entity: any, migrationRunId: string): Record<string, any> {
    return {
      policy: "coingecko_bootstrap_weak_match_repair",
      migrationRunId,
      previousCanonicalProjectId: this.toIdString(entity.canonicalProjectId),
      previousResolutionStatus: entity.resolutionStatus,
      previousMatchedBy: entity.matchedBy,
      previousConfidence: entity.confidence,
      previousReason: entity.reason,
      similarityHints: this.similarityHints(entity),
    };
  }

  private similarityHints(entity: any): any[] {
    return Array.isArray(entity.metadata?.resolverCandidates) ? entity.metadata.resolverCandidates : [];
  }

  private aliasesFromMarketAsset(marketAsset: any, sourceId: string): any[] {
    const aliases = [
      { type: "name", value: marketAsset.name, normalizedValue: marketAsset.normalizedName },
      { type: "slug", value: marketAsset.slug || sourceId, normalizedValue: marketAsset.slug || sourceId },
      { type: "symbol", value: marketAsset.symbol, normalizedValue: marketAsset.normalizedSymbol },
    ];
    const seen = new Set<string>();
    return aliases.filter((alias) => {
      if (!alias.value || !alias.normalizedValue) return false;
      const key = `${alias.type}:${alias.normalizedValue}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((alias) => ({
      ...alias,
      source: "coingecko",
      confidence: "exact",
    }));
  }

  private assertWriteAllowed(options: CoinGeckoMarketUniverseRepairOptions): void {
    if (!options.confirmWrite) {
      throw new Error("Refusing repair write mode without --confirm-write=true.");
    }
    if (this.dbName() === "fomoland") {
      throw new Error("Refusing to repair FOMO v2 CoinGecko market universe on DB_NAME=fomoland.");
    }
  }

  private emptyResult(mode: "dry-run" | "write"): CoinGeckoMarketUniverseRepairResult {
    return {
      mode,
      dbName: this.dbName(),
      scanned: 0,
      planned: 0,
      repaired: 0,
      skipped: 0,
      would: {
        createCanonicalProjects: 0,
        updateSourceEntities: 0,
        updateProjectAssetLinks: 0,
        updateCanonicalProjectSources: 0,
      },
      written: {
        canonicalProjects: { created: 0, reused: 0 },
        sourceEntitiesUpdated: 0,
        projectAssetLinksUpdated: 0,
        canonicalProjectSourcesUpdated: 0,
      },
      warnings: [],
      errors: [],
      items: [],
    };
  }

  private recordUpsert(counter: UpsertCounter, created: boolean): void {
    if (created) counter.created += 1;
    else counter.reused += 1;
  }

  private parseLimit(value: any): number {
    const parsed = Number(value || 100);
    if (!Number.isFinite(parsed) || parsed <= 0) return 100;
    return Math.max(1, Math.min(1000, Math.trunc(parsed)));
  }

  private dbName(): string {
    return String(this.configService.get("DB_NAME") || process.env.DB_NAME || "fomoland").trim() || "fomoland";
  }

  private cleanString(value: any): string {
    return String(value || "").trim();
  }

  private toObjectId(value: any): any {
    const id = this.toIdString(value);
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : value;
  }

  private toIdString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();
    if (typeof value.toString === "function") return value.toString();
    return "";
  }
}
