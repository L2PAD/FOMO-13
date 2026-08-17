import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { createHash } from "crypto";
import { Model, Types } from "mongoose";
import { CoinGeckoListCoinDto, CoinGeckoMarketDto } from "src/coingecko/coingecko-market.types";
import { CoinGeckoProClientService } from "src/coingecko/coingecko-pro-client.service";
import {
  FomoV2CanonicalProject,
  FomoV2CanonicalProjectSource,
  FomoV2MarketAsset,
  FomoV2ProjectAssetLink,
  FomoV2SourceEntity,
  FomoV2SourceSnapshot,
} from "../models";
import { FomoV2ContractIdentity, FomoV2LinkStatus, FomoV2ResolutionStatus } from "../../../fomo-v2.types";
import { CoinGeckoMarketUniverseDryRunService } from "./coingecko-market-universe-dry-run.service";
import { FomoV2MigrationRunWriterService } from "../../../services/migration-run-writer.service";
import { ResolveCanonicalProjectInput, ResolveCanonicalProjectResult, ResolveCanonicalProjectService } from "./resolve-canonical-project.service";
import { FomoV2ParserControlPolicyService } from "../../parser-control/services/parser-control-policy.service";

export interface CoinGeckoMarketUniverseImportOptions {
  mode?: "dry-run" | "write";
  limit?: number;
  all?: boolean;
  page?: number;
  perPage?: number;
  batchSize?: number;
  includePlatforms?: boolean;
  confirmWrite?: boolean;
}

export interface CoinGeckoMarketUniverseImportResult {
  mode: "write";
  dbName: string;
  migrationRunId: string;
  migrationRunKey: string;
  requestedLimit: number | null;
  all?: boolean;
  scanned: number;
  resolver: {
    matched: number;
    createdCandidate: number;
    proposed: number;
    conflict: number;
    unresolved: number;
  };
  written: {
    sourceSnapshots: UpsertCounter;
    sourceEntities: UpsertCounter;
    marketAssets: UpsertCounter;
    canonicalProjects: UpsertCounter;
    projectAssetLinks: UpsertCounter;
    canonicalProjectSources: UpsertCounter;
  };
  skipped: {
    conflicts: number;
    unresolved: number;
    linksWithoutCanonicalProject: number;
  };
  warnings: string[];
  errors: Array<{
    coingeckoId?: string;
    message: string;
  }>;
  collectionsTouched: string[];
  examples: Array<{
    coingeckoId: string;
    name: string;
    canonicalProjectId?: string;
    marketAssetId?: string;
    sourceSnapshotId?: string;
    resolverStatus: string;
    linkStatus?: string;
  }>;
}

interface UpsertCounter {
  created: number;
  reused: number;
}

interface UpsertResult {
  doc: any;
  created: boolean;
}

@Injectable()
export class CoinGeckoMarketUniverseImportService {
  private readonly exampleLimit = 10;

  constructor(
    private readonly coinGeckoClient: CoinGeckoProClientService,
    private readonly resolver: ResolveCanonicalProjectService,
    private readonly dryRunMapper: CoinGeckoMarketUniverseDryRunService,
    private readonly migrationRunWriter: FomoV2MigrationRunWriterService,
    private readonly configService: ConfigService,
    @InjectModel(FomoV2SourceSnapshot.name)
    private readonly sourceSnapshotModel: Model<FomoV2SourceSnapshot>,
    @InjectModel(FomoV2SourceEntity.name)
    private readonly sourceEntityModel: Model<FomoV2SourceEntity>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>,
    @InjectModel(FomoV2CanonicalProjectSource.name)
    private readonly canonicalProjectSourceModel: Model<FomoV2CanonicalProjectSource>,
    @InjectModel(FomoV2MarketAsset.name)
    private readonly marketAssetModel: Model<FomoV2MarketAsset>,
    @InjectModel(FomoV2ProjectAssetLink.name)
    private readonly projectAssetLinkModel: Model<FomoV2ProjectAssetLink>,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService,
  ) {}

  async runWrite(options: CoinGeckoMarketUniverseImportOptions = {}): Promise<CoinGeckoMarketUniverseImportResult> {
    this.assertWriteAllowed(options);
    if (this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        "market:coingecko"
      );
    }

    const dbName = this.dbName();
    const limit = this.resolveLimit(options);
    const migrationRun = await this.migrationRunWriter.startRun({
      type: "coingecko_market_universe",
      dryRun: false,
      dbName,
      options: {
        mode: "write",
        limit: options.all ? null : limit,
        all: Boolean(options.all),
        page: options.page,
        perPage: options.perPage,
        batchSize: options.batchSize,
        includePlatforms: options.includePlatforms !== false,
      },
      metadata: {
        guardrails: [
          "confirm_write_required",
          "fomoland_refused",
          "legacy_project_not_touched",
          "price_history_charts_not_written",
        ],
      },
    });

    const result = this.emptyResult(dbName, options.all ? null : limit, Boolean(options.all), migrationRun.id, migrationRun.runKey);

    try {
      const listById =
        options.includePlatforms === false ? new Map<string, CoinGeckoListCoinDto>() : await this.fetchListById();
      const pageSize = this.pageSize(limit, options);
      let page = this.parsePositiveInteger(options.page, 1);

      while (result.scanned < limit) {
        const markets = await this.coinGeckoClient.fetchMarketsPage({ page, perPage: pageSize });
        if (!markets.length) break;

        for (const market of markets) {
          if (result.scanned >= limit) break;
          await this.importMarket(market, listById, migrationRun.id, result);
        }

        if (markets.length < pageSize) break;
        page += 1;
      }

      await this.migrationRunWriter.completeRun(migrationRun.id, this.resultCounters(result), {
        warnings: result.warnings,
        errors: result.errors,
        collectionsTouched: result.collectionsTouched,
      });
      return result;
    } catch (error) {
      await this.migrationRunWriter.failRun(migrationRun.id, error, this.resultCounters(result), {
        warnings: result.warnings,
        errors: result.errors,
        collectionsTouched: result.collectionsTouched,
      });
      throw error;
    }
  }

  private async importMarket(
    market: CoinGeckoMarketDto,
    listById: Map<string, CoinGeckoListCoinDto>,
    migrationRunId: string,
    result: CoinGeckoMarketUniverseImportResult,
  ): Promise<void> {
    const coingeckoId = this.normalizeProviderId(market.id);

    try {
      const listCoin = listById.get(coingeckoId);
      const resolverInput = this.dryRunMapper.mapAssetToResolverInput(market, listCoin);
      const rawResolverResult = await this.resolver.resolveCanonicalProject(resolverInput);
      const resolverResult = await this.applyCoinGeckoBootstrapPolicy(resolverInput, rawResolverResult, result);
      this.incrementResolver(result, resolverResult);

      const sourceSnapshot = await this.upsertSourceSnapshot(resolverInput, market, listCoin, migrationRunId);
      this.recordUpsert(result.written.sourceSnapshots, sourceSnapshot.created);

      const marketAsset = await this.upsertMarketAsset(resolverInput, market, sourceSnapshot.doc, migrationRunId);
      this.recordUpsert(result.written.marketAssets, marketAsset.created);

      const canonicalProject = await this.resolveOrCreateCanonicalProject(
        resolverInput,
        resolverResult,
        market,
        sourceSnapshot.doc,
        migrationRunId,
      );
      if (canonicalProject.created !== undefined) {
        this.recordUpsert(result.written.canonicalProjects, canonicalProject.created);
      }

      const sourceEntity = await this.upsertSourceEntity(
        resolverInput,
        resolverResult,
        sourceSnapshot.doc,
        canonicalProject.id,
        migrationRunId,
      );
      this.recordUpsert(result.written.sourceEntities, sourceEntity.created);

      await this.sourceSnapshotModel.updateOne(
        { _id: this.toObjectId(sourceSnapshot.doc._id) },
        { $set: { sourceEntityId: this.toObjectId(sourceEntity.doc._id) } },
      );

      if (!canonicalProject.id) {
        if (resolverResult.status === "conflict") result.skipped.conflicts += 1;
        if (resolverResult.status === "unresolved") result.skipped.unresolved += 1;
        result.skipped.linksWithoutCanonicalProject += 1;
        this.pushExample(result, resolverInput, resolverResult, undefined, marketAsset.doc, sourceSnapshot.doc);
        result.scanned += 1;
        return;
      }

      const linkState = this.linkState(resolverResult);
      const projectAssetLink = await this.upsertProjectAssetLink(
        canonicalProject.id,
        marketAsset.doc,
        sourceSnapshot.doc,
        resolverResult,
        linkState,
        migrationRunId,
      );
      this.recordUpsert(result.written.projectAssetLinks, projectAssetLink.created);

      const canonicalProjectSource = await this.upsertCanonicalProjectSource(
        resolverInput,
        canonicalProject.id,
        sourceEntity.doc,
        sourceSnapshot.doc,
        resolverResult,
        linkState,
        migrationRunId,
      );
      this.recordUpsert(result.written.canonicalProjectSources, canonicalProjectSource.created);

      this.pushExample(result, resolverInput, resolverResult, canonicalProject.id, marketAsset.doc, sourceSnapshot.doc, linkState.status);
      result.scanned += 1;
    } catch (error: any) {
      result.errors.push({
        coingeckoId,
        message: error?.message || String(error),
      });
      result.scanned += 1;
    }
  }

  private async upsertSourceSnapshot(
    input: ResolveCanonicalProjectInput,
    market: CoinGeckoMarketDto,
    listCoin: CoinGeckoListCoinDto | undefined,
    migrationRunId: string,
  ): Promise<UpsertResult> {
    const rawPayload = this.identityRawPayload(market, listCoin);
    const payloadHash = this.payloadHash(rawPayload);
    const sourceEntityKey = this.sourceEntityKey(input);

    return this.upsertOne(this.sourceSnapshotModel, {
      source: input.source,
      sourceEntityType: input.sourceEntityType,
      sourceId: input.sourceId,
      payloadHash,
    }, {
      $setOnInsert: {
        source: input.source,
        sourceEntityType: input.sourceEntityType,
        sourceId: input.sourceId,
        sourceSlug: input.sourceSlug,
        sourceUrl: input.sourceUrl,
        sourceEntityKey,
        payloadHash,
        rawPayload,
        normalizedPreview: {
          name: input.name,
          normalizedName: input.normalizedName,
          symbol: input.symbol,
          normalizedSymbol: input.normalizedSymbol,
          providerIds: input.providerIds,
          contractsCount: input.contracts?.length || 0,
        },
        migrationRunId: this.toObjectId(migrationRunId),
        capturedAt: new Date(),
        metadata: {
          importer: "fomo-v2:coingecko-market-import",
          phase: 3,
        },
      },
    });
  }

  private async upsertMarketAsset(
    input: ResolveCanonicalProjectInput,
    market: CoinGeckoMarketDto,
    sourceSnapshot: any,
    migrationRunId: string,
  ): Promise<UpsertResult> {
    const contracts = this.marketAssetContracts(input.contracts || []);
    const contractKeys = contracts.map((contract) => contract.chainKey + ":" + contract.normalizedAddress);
    const now = new Date();

    return this.upsertOne(this.marketAssetModel, {
      "providerIds.coingeckoId": input.providerIds?.coingeckoId,
    }, {
      $setOnInsert: {
        firstSeenAt: now,
      },
      $set: {
        assetType: contracts.length ? "token" : "coin",
        name: input.name || input.sourceId || "Unknown CoinGecko asset",
        normalizedName: input.normalizedName,
        symbol: input.symbol,
        normalizedSymbol: input.normalizedSymbol,
        slug: input.sourceSlug,
        providerIds: this.cleanObject(input.providerIds || {}),
        contracts,
        contractKeys,
        status: "active",
        lastSeenAt: now,
        metadata: {
          source: "coingecko",
          sourceUrl: input.sourceUrl,
          image: (market as any).image,
          marketCapRank: (market as any).market_cap_rank ?? null,
          latestSourceSnapshotId: this.toIdString(sourceSnapshot?._id),
          latestMigrationRunId: migrationRunId,
          quoteFieldsCopied: false,
        },
      },
    });
  }

  private async resolveOrCreateCanonicalProject(
    input: ResolveCanonicalProjectInput,
    resolverResult: ResolveCanonicalProjectResult,
    market: CoinGeckoMarketDto,
    sourceSnapshot: any,
    migrationRunId: string,
  ): Promise<{ id?: string; created?: boolean }> {
    if (resolverResult.status === "conflict" || resolverResult.status === "unresolved") {
      return {};
    }

    if (resolverResult.status === "matched" || resolverResult.status === "proposed") {
      const canonicalProjectId = resolverResult.canonicalProjectId;
      if (!canonicalProjectId) return {};

      if (resolverResult.verified) {
        await this.canonicalProjectModel.updateOne(
          { _id: this.toObjectId(canonicalProjectId) },
          {
            $set: {
              "providerIds.coingeckoId": input.providerIds?.coingeckoId,
              "metadata.latestCoinGeckoSourceSnapshotId": this.toIdString(sourceSnapshot?._id),
              "metadata.latestCoinGeckoMigrationRunId": migrationRunId,
            },
          },
        );
      }

      return { id: canonicalProjectId };
    }

    const now = new Date();
    const canonical = await this.upsertOne(this.canonicalProjectModel, {
      "providerIds.coingeckoId": input.providerIds?.coingeckoId,
    }, {
      $setOnInsert: {
        name: input.name || input.sourceId || "Unknown CoinGecko asset",
        normalizedName: input.normalizedName,
        slug: input.sourceSlug,
        symbol: input.symbol,
        normalizedSymbol: input.normalizedSymbol,
        status: "active",
        providerIds: this.cleanObject(input.providerIds || {}),
        aliases: this.canonicalAliases(input),
        createdBy: "import",
        "metadata.bootstrapSource": "coingecko_market_universe",
        "metadata.source": "coingecko",
        "metadata.sourceUrl": input.sourceUrl,
        "metadata.image": (market as any).image,
        "metadata.marketCapRank": (market as any).market_cap_rank ?? null,
        "metadata.firstSourceSnapshotId": this.toIdString(sourceSnapshot?._id),
        "metadata.firstMigrationRunId": migrationRunId,
        "metadata.createdAt": now.toISOString(),
        "metadata.dedupeHints": this.dedupeHints(resolverResult),
      },
      $set: {
        "metadata.latestCoinGeckoSourceSnapshotId": this.toIdString(sourceSnapshot?._id),
        "metadata.latestCoinGeckoMigrationRunId": migrationRunId,
      },
    });

    return {
      id: this.toIdString(canonical.doc?._id),
      created: canonical.created,
    };
  }

  private async upsertSourceEntity(
    input: ResolveCanonicalProjectInput,
    resolverResult: ResolveCanonicalProjectResult,
    sourceSnapshot: any,
    canonicalProjectId: string | undefined,
    migrationRunId: string,
  ): Promise<UpsertResult> {
    const now = new Date();
    const resolutionStatus = this.resolutionStatus(resolverResult);

    return this.upsertOne(this.sourceEntityModel, {
      entityKey: this.sourceEntityKey(input),
    }, {
      $setOnInsert: {
        entityKey: this.sourceEntityKey(input),
        source: input.source,
        sourceEntityType: input.sourceEntityType,
        sourceId: input.sourceId,
        sourceSlug: input.sourceSlug,
        sourceUrl: input.sourceUrl,
        providerIds: this.cleanObject(input.providerIds || {}),
        firstSeenAt: now,
      },
      $set: {
        canonicalProjectId: canonicalProjectId ? this.toObjectId(canonicalProjectId) : undefined,
        latestSourceSnapshotId: this.toObjectId(sourceSnapshot?._id),
        resolutionStatus,
        confidence: resolverResult.confidence,
        matchedBy: resolverResult.matchedBy,
        reason: resolverResult.reason,
        lastSeenAt: now,
        metadata: {
          latestMigrationRunId: migrationRunId,
          resolverCandidates: resolverResult.candidates,
          resolverConflicts: resolverResult.conflicts,
          coinGeckoPolicyOverride: this.coinGeckoPolicyOverride(resolverResult),
        },
      },
    });
  }

  private async upsertProjectAssetLink(
    canonicalProjectId: string,
    marketAsset: any,
    sourceSnapshot: any,
    resolverResult: ResolveCanonicalProjectResult,
    linkState: { status: FomoV2LinkStatus; verified: boolean; confidence: string; matchedBy: string; reason: string },
    migrationRunId: string,
  ): Promise<UpsertResult> {
    return this.upsertOne(this.projectAssetLinkModel, {
      canonicalProjectId: this.toObjectId(canonicalProjectId),
      marketAssetId: this.toObjectId(marketAsset?._id),
      relationType: "primary_token",
    }, {
      $setOnInsert: {
        canonicalProjectId: this.toObjectId(canonicalProjectId),
        marketAssetId: this.toObjectId(marketAsset?._id),
        relationType: "primary_token",
      },
      $set: {
        status: linkState.status,
        confidence: linkState.confidence,
        source: "coingecko",
        sourceSnapshotId: this.toObjectId(sourceSnapshot?._id),
        verified: linkState.verified,
        matchedBy: linkState.matchedBy,
        reason: linkState.reason,
        metadata: {
          latestMigrationRunId: migrationRunId,
          resolverStatus: resolverResult.status,
          coinGeckoPolicyOverride: this.coinGeckoPolicyOverride(resolverResult),
        },
      },
    });
  }

  private async upsertCanonicalProjectSource(
    input: ResolveCanonicalProjectInput,
    canonicalProjectId: string,
    sourceEntity: any,
    sourceSnapshot: any,
    resolverResult: ResolveCanonicalProjectResult,
    linkState: { status: FomoV2LinkStatus; verified: boolean; confidence: string; matchedBy: string; reason: string },
    migrationRunId: string,
  ): Promise<UpsertResult> {
    return this.upsertOne(this.canonicalProjectSourceModel, {
      source: input.source,
      sourceEntityType: input.sourceEntityType,
      sourceId: input.sourceId,
    }, {
      $setOnInsert: {
        source: input.source,
        sourceEntityType: input.sourceEntityType,
        sourceId: input.sourceId,
      },
      $set: {
        canonicalProjectId: this.toObjectId(canonicalProjectId),
        sourceSlug: input.sourceSlug,
        sourceUrl: input.sourceUrl,
        sourceEntityId: this.toObjectId(sourceEntity?._id),
        sourceSnapshotId: this.toObjectId(sourceSnapshot?._id),
        confidence: linkState.confidence,
        matchedBy: linkState.matchedBy,
        reason: linkState.reason,
        verified: linkState.verified,
        status: linkState.status,
        metadata: {
          latestMigrationRunId: migrationRunId,
          resolverStatus: resolverResult.status,
          coinGeckoPolicyOverride: this.coinGeckoPolicyOverride(resolverResult),
        },
      },
    });
  }

  private async applyCoinGeckoBootstrapPolicy(
    input: ResolveCanonicalProjectInput,
    resolverResult: ResolveCanonicalProjectResult,
    result: CoinGeckoMarketUniverseImportResult,
  ): Promise<ResolveCanonicalProjectResult> {
    if (!this.isCoinGeckoAsset(input)) return resolverResult;
    if (resolverResult.status === "created_candidate" || resolverResult.status === "unresolved") {
      return resolverResult;
    }
    if (resolverResult.status === "conflict" && !this.isWeakCoinGeckoMatch(resolverResult)) {
      return resolverResult;
    }
    if (this.isReusableCoinGeckoExactMatch(resolverResult)) return resolverResult;
    if (await this.hasVerifiedCoinGeckoCanonicalSource(input, resolverResult)) return resolverResult;

    const weakMatchedBy = resolverResult.matchedBy;
    const warning = [
      "CoinGecko bootstrap created its own canonical project instead of reusing weak resolver candidate",
      `sourceId=${input.sourceId || ""}`,
      `matchedBy=${weakMatchedBy}`,
      `candidateIds=${resolverResult.candidates.map((candidate) => candidate.canonicalProjectId).join(",")}`,
    ].join(" ");
    result.warnings.push(warning);

    return {
      status: "created_candidate",
      verified: false,
      confidence: "none",
      matchedBy: "none",
      reason: `CoinGecko market bootstrap ignores weak ${weakMatchedBy} resolver matches and creates a separate canonical project.`,
      candidates: resolverResult.candidates,
      conflicts: resolverResult.conflicts,
      actions: [
        {
          type: "would_create_canonical_project",
          description: "Would create canonical project for CoinGecko asset because weak resolver match is only a similarity hint.",
        },
        {
          type: "dedupe_similarity_hint",
          description: `Original resolver returned ${resolverResult.status}/${weakMatchedBy}; keep as manual dedupe hint only.`,
        },
      ],
      ...(resolverResult as any).policyOverride
        ? {}
        : {
            policyOverride: {
              policy: "coingecko_bootstrap_weak_match_creates_canonical",
              originalStatus: resolverResult.status,
              originalMatchedBy: resolverResult.matchedBy,
              originalConfidence: resolverResult.confidence,
              originalVerified: resolverResult.verified,
              originalCanonicalProjectId: resolverResult.canonicalProjectId,
              originalReason: resolverResult.reason,
              originalCandidates: resolverResult.candidates,
            },
          },
    } as ResolveCanonicalProjectResult;
  }

  private isCoinGeckoAsset(input: ResolveCanonicalProjectInput): boolean {
    return input.source === "coingecko" && input.sourceEntityType === "asset";
  }

  private isReusableCoinGeckoExactMatch(resolverResult: ResolveCanonicalProjectResult): boolean {
    return (
      resolverResult.status === "matched" &&
      resolverResult.verified &&
      (resolverResult.matchedBy === "provider_id" || resolverResult.matchedBy === "contract")
    );
  }

  private isWeakCoinGeckoMatch(resolverResult: ResolveCanonicalProjectResult): boolean {
    return (
      resolverResult.matchedBy === "name_only" ||
      resolverResult.matchedBy === "symbol_only" ||
      resolverResult.matchedBy === "strong_identity_bundle"
    );
  }

  private async hasVerifiedCoinGeckoCanonicalSource(
    input: ResolveCanonicalProjectInput,
    resolverResult: ResolveCanonicalProjectResult,
  ): Promise<boolean> {
    if (resolverResult.status !== "matched" || !resolverResult.canonicalProjectId) return false;

    const sourceClauses = [
      input.sourceId ? { sourceId: input.sourceId } : undefined,
      input.sourceUrl ? { sourceUrl: input.sourceUrl } : undefined,
    ].filter(Boolean);
    if (!sourceClauses.length) return false;

    const query = {
      canonicalProjectId: this.toObjectId(resolverResult.canonicalProjectId),
      source: input.source,
      sourceEntityType: input.sourceEntityType,
      verified: true,
      status: "active",
      $or: sourceClauses,
    };
    const doc = await this.canonicalProjectSourceModel.findOne(query).lean();
    return Boolean(doc);
  }

  private async upsertOne(model: Model<any>, filter: Record<string, any>, update: Record<string, any>): Promise<UpsertResult> {
    const raw = await (model as any).findOneAndUpdate(this.cleanObject(filter), this.cleanUpdate(update), {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      rawResult: true,
    });

    return {
      doc: raw?.value || raw,
      created: Boolean(raw?.lastErrorObject?.upserted),
    };
  }

  private linkState(resolverResult: ResolveCanonicalProjectResult): {
    status: FomoV2LinkStatus;
    verified: boolean;
    confidence: string;
    matchedBy: string;
    reason: string;
  } {
    if (resolverResult.status === "created_candidate") {
      return {
        status: "active",
        verified: true,
        confidence: "exact",
        matchedBy: "provider_id",
        reason: "Created from verified CoinGecko provider id during FOMO v2 market universe bootstrap.",
      };
    }

    const verified = Boolean(resolverResult.verified);
    return {
      status: verified ? "active" : "proposed",
      verified,
      confidence: resolverResult.confidence,
      matchedBy: resolverResult.matchedBy,
      reason: resolverResult.reason,
    };
  }

  private resolutionStatus(resolverResult: ResolveCanonicalProjectResult): FomoV2ResolutionStatus {
    if (resolverResult.status === "created_candidate") return "created";
    if (resolverResult.status === "matched") return "matched";
    if (resolverResult.status === "proposed") return "proposed";
    if (resolverResult.status === "conflict") return "conflict";
    return "unresolved";
  }

  private dedupeHints(resolverResult: ResolveCanonicalProjectResult): Record<string, any>[] | undefined {
    const override = this.coinGeckoPolicyOverride(resolverResult);
    if (!override) return undefined;
    return (override.originalCandidates || []).map((candidate: any) => ({
      candidateCanonicalProjectId: candidate.canonicalProjectId,
      confidence: candidate.confidence,
      matchedBy: candidate.matchedBy,
      reason: candidate.reason,
      policy: override.policy,
      originalStatus: override.originalStatus,
    }));
  }

  private coinGeckoPolicyOverride(resolverResult: ResolveCanonicalProjectResult): Record<string, any> | undefined {
    return (resolverResult as any).policyOverride;
  }

  private identityRawPayload(market: CoinGeckoMarketDto, listCoin?: CoinGeckoListCoinDto): Record<string, any> {
    return {
      market: {
        id: market.id,
        name: market.name,
        symbol: market.symbol,
        image: (market as any).image,
        market_cap_rank: (market as any).market_cap_rank ?? null,
      },
      ...(listCoin
        ? {
            listCoin: {
              id: listCoin.id,
              name: listCoin.name,
              symbol: listCoin.symbol,
              platforms: listCoin.platforms || {},
            },
          }
        : {}),
    };
  }

  private marketAssetContracts(
    contracts: Array<{ chainId?: string; chainSlug?: string; address: string }>,
  ): FomoV2ContractIdentity[] {
    return contracts
      .map((contract) => {
        const chainKey = String(contract.chainId || contract.chainSlug || "").trim().toLowerCase();
        const normalizedAddress = String(contract.address || "").trim().toLowerCase();
        if (!chainKey || !normalizedAddress) return undefined;
        return {
          chainId: contract.chainId,
          chainSlug: contract.chainSlug,
          chainKey,
          address: contract.address,
          normalizedAddress,
          source: "coingecko",
          verified: true,
        };
      })
      .filter(Boolean) as FomoV2ContractIdentity[];
  }

  private canonicalAliases(input: ResolveCanonicalProjectInput): any[] {
    const seen = new Set<string>();
    return (input.aliases || [])
      .map((alias) => ({
        type: alias.type,
        value: alias.value,
        normalizedValue: alias.normalizedValue || alias.value,
        source: "coingecko",
        confidence: "exact",
      }))
      .filter((alias) => {
        if (!alias.type || !alias.value || !alias.normalizedValue) return false;
        const key = `${alias.type}:${alias.normalizedValue}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  private async fetchListById(): Promise<Map<string, CoinGeckoListCoinDto>> {
    const list = await this.coinGeckoClient.fetchCoinsList(true);
    return new Map(list.map((coin) => [this.normalizeProviderId(coin.id), coin]));
  }

  private assertWriteAllowed(options: CoinGeckoMarketUniverseImportOptions): void {
    if (options.mode && options.mode !== "write") {
      throw new Error("CoinGecko market universe import service only performs write mode. Use dry-run service for dry-run.");
    }
    if (!options.confirmWrite) {
      throw new Error("Refusing write mode without --confirm-write=true.");
    }
    if (this.dbName() === "fomoland") {
      throw new Error("Refusing to write FOMO v2 CoinGecko market universe to DB_NAME=fomoland.");
    }
  }

  private emptyResult(
    dbName: string,
    requestedLimit: number | null,
    all: boolean,
    migrationRunId: string,
    migrationRunKey: string,
  ): CoinGeckoMarketUniverseImportResult {
    return {
      mode: "write",
      dbName,
      migrationRunId,
      migrationRunKey,
      requestedLimit,
      all,
      scanned: 0,
      resolver: {
        matched: 0,
        createdCandidate: 0,
        proposed: 0,
        conflict: 0,
        unresolved: 0,
      },
      written: {
        sourceSnapshots: { created: 0, reused: 0 },
        sourceEntities: { created: 0, reused: 0 },
        marketAssets: { created: 0, reused: 0 },
        canonicalProjects: { created: 0, reused: 0 },
        projectAssetLinks: { created: 0, reused: 0 },
        canonicalProjectSources: { created: 0, reused: 0 },
      },
      skipped: {
        conflicts: 0,
        unresolved: 0,
        linksWithoutCanonicalProject: 0,
      },
      warnings: [],
      errors: [],
      collectionsTouched: [
        "migration_runs",
        "source_snapshots",
        "source_entities",
        "market_assets",
        "canonical_projects",
        "project_asset_links",
        "canonical_project_sources",
      ],
      examples: [],
    };
  }

  private resultCounters(result: CoinGeckoMarketUniverseImportResult): Record<string, any> {
    return {
      scanned: result.scanned,
      resolver: result.resolver,
      written: result.written,
      skipped: result.skipped,
      errorsCount: result.errors.length,
    };
  }

  private incrementResolver(result: CoinGeckoMarketUniverseImportResult, resolverResult: ResolveCanonicalProjectResult): void {
    if (resolverResult.status === "matched") result.resolver.matched += 1;
    if (resolverResult.status === "created_candidate") result.resolver.createdCandidate += 1;
    if (resolverResult.status === "proposed") result.resolver.proposed += 1;
    if (resolverResult.status === "conflict") result.resolver.conflict += 1;
    if (resolverResult.status === "unresolved") result.resolver.unresolved += 1;
  }

  private recordUpsert(counter: UpsertCounter, created: boolean): void {
    if (created) counter.created += 1;
    else counter.reused += 1;
  }

  private pushExample(
    result: CoinGeckoMarketUniverseImportResult,
    input: ResolveCanonicalProjectInput,
    resolverResult: ResolveCanonicalProjectResult,
    canonicalProjectId: string | undefined,
    marketAsset: any,
    sourceSnapshot: any,
    linkStatus?: string,
  ): void {
    if (result.examples.length >= this.exampleLimit) return;
    result.examples.push({
      coingeckoId: input.providerIds?.coingeckoId || input.sourceId || "",
      name: input.name || "",
      canonicalProjectId,
      marketAssetId: this.toIdString(marketAsset?._id),
      sourceSnapshotId: this.toIdString(sourceSnapshot?._id),
      resolverStatus: resolverResult.status,
      linkStatus,
    });
  }

  private sourceEntityKey(input: ResolveCanonicalProjectInput): string {
    return [input.source, input.sourceEntityType, input.sourceId || input.sourceSlug].filter(Boolean).join(":");
  }

  private payloadHash(payload: Record<string, any>): string {
    return createHash("sha256").update(this.stableStringify(payload)).digest("hex");
  }

  private stableStringify(value: any): string {
    if (value === null || value === undefined) return "null";
    if (value instanceof Date) return JSON.stringify(value.toISOString());
    if (Array.isArray(value)) return `[${value.map((item) => this.stableStringify(item)).join(",")}]`;
    if (typeof value === "object") {
      const keys = Object.keys(value).filter((key) => value[key] !== undefined).sort();
      return `{${keys.map((key) => `${JSON.stringify(key)}:${this.stableStringify(value[key])}`).join(",")}}`;
    }
    return JSON.stringify(value);
  }

  private cleanUpdate(update: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    for (const [operator, value] of Object.entries(update)) {
      cleaned[operator] = this.cleanObject(value as Record<string, any>);
    }
    return cleaned;
  }

  private cleanObject<T extends Record<string, any>>(input: T): T {
    const output: Record<string, any> = {};
    for (const [key, value] of Object.entries(input || {})) {
      if (value === undefined) continue;
      output[key] = value;
    }
    return output as T;
  }

  private resolveLimit(options: CoinGeckoMarketUniverseImportOptions): number {
    if (options.all) return Number.MAX_SAFE_INTEGER;
    return this.parseLimit(options.limit);
  }

  private parseLimit(value: any): number {
    const parsed = Number(value || 100);
    if (!Number.isFinite(parsed) || parsed <= 0) return 100;
    return Math.max(1, Math.trunc(parsed));
  }

  private parsePositiveInteger(value: any, fallback: number): number {
    const parsed = Number(value || fallback);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.trunc(parsed);
  }

  private pageSize(limit: number, options: CoinGeckoMarketUniverseImportOptions): number {
    const raw = options.perPage || options.batchSize || Math.min(limit, 250);
    const parsed = this.parsePositiveInteger(raw, Math.min(limit, 250));
    return Math.max(1, Math.min(250, parsed));
  }

  private dbName(): string {
    return String(this.configService.get("DB_NAME") || process.env.DB_NAME || "fomoland").trim() || "fomoland";
  }

  private normalizeProviderId(value: any): string {
    return String(value || "").trim().toLowerCase();
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
