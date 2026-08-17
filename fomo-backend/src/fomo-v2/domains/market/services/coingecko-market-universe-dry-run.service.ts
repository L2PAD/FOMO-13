import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CoinGeckoListCoinDto, CoinGeckoMarketDto } from "src/coingecko/coingecko-market.types";
import { CoinGeckoProClientService } from "src/coingecko/coingecko-pro-client.service";
import {
  ResolveCanonicalProjectInput,
  ResolveCanonicalProjectResult,
  ResolveCanonicalProjectService,
} from "./resolve-canonical-project.service";

export interface CoinGeckoMarketUniverseDryRunOptions {
  limit?: number;
  all?: boolean;
  page?: number;
  perPage?: number;
  includePlatforms?: boolean;
  examplesLimit?: number;
  write?: boolean;
}

export interface CoinGeckoMarketUniverseAssetReport {
  coingeckoId: string;
  name: string;
  symbol: string;
  marketCapRank?: number | null;
  sourceUrl: string;
  sourceSnapshotPreview: {
    source: "coingecko";
    sourceEntityType: "asset";
    sourceId: string;
    rawPayload: {
      market: CoinGeckoMarketDto;
      listCoin?: CoinGeckoListCoinDto;
    };
  };
  contracts: ResolveCanonicalProjectInput["contracts"];
  resolver: ResolveCanonicalProjectResult;
  actions: Array<{
    type: string;
    description: string;
    verified?: boolean;
  }>;
}

export interface CoinGeckoMarketUniverseDryRunResult {
  mode: "dry-run";
  dbName: string;
  warnings: string[];
  scanned: number;
  requestedLimit: number | null;
  all?: boolean;
  resolver: {
    matched: number;
    createdCandidate: number;
    proposed: number;
    conflict: number;
    unresolved: number;
  };
  wouldCreate: {
    sourceSnapshots: number;
    sourceEntities: number;
    marketAssets: number;
    canonicalProjects: number;
    projectAssetLinks: number;
    canonicalProjectSources: number;
    dedupeReviewItems: number;
  };
  conflicts: Array<{
    coingeckoId: string;
    name: string;
    conflicts: ResolveCanonicalProjectResult["conflicts"];
  }>;
  examples: {
    createdCandidates: CoinGeckoMarketUniverseAssetReport[];
    matched: CoinGeckoMarketUniverseAssetReport[];
    conflicts: CoinGeckoMarketUniverseAssetReport[];
    proposed: CoinGeckoMarketUniverseAssetReport[];
  };
  assets: CoinGeckoMarketUniverseAssetReport[];
}

@Injectable()
export class CoinGeckoMarketUniverseDryRunService {
  private readonly defaultExampleLimit = 5;

  constructor(
    private readonly coinGeckoClient: CoinGeckoProClientService,
    private readonly resolver: ResolveCanonicalProjectService,
    private readonly configService: ConfigService,
  ) {}

  async run(options: CoinGeckoMarketUniverseDryRunOptions = {}): Promise<CoinGeckoMarketUniverseDryRunResult> {
    if (options.write) {
      throw new Error("FOMO v2 CoinGecko market universe importer is dry-run only in Phase 2. Refusing write mode.");
    }

    const limit = this.resolveLimit(options);
    const exampleLimit = this.parseExamplesLimit(options.examplesLimit);
    const warnings = this.safetyWarnings();
    const markets = await this.fetchMarkets(limit, options);
    const listById = options.includePlatforms === false ? new Map<string, CoinGeckoListCoinDto>() : await this.fetchListById();
    const result = this.emptyResult(options.all ? null : limit, Boolean(options.all), warnings);

    for (const market of markets) {
      const listCoin = listById.get(this.normalizeCoinGeckoId(market.id));
      const resolverInput = this.mapAssetToResolverInput(market, listCoin);
      const resolverResult = await this.resolver.resolveCanonicalProject(resolverInput);
      const assetReport = this.buildAssetReport(market, listCoin, resolverInput, resolverResult);

      result.assets.push(assetReport);
      this.addToSummary(result, assetReport, exampleLimit);
    }

    result.scanned = result.assets.length;
    return result;
  }

  mapAssetToResolverInput(
    market: CoinGeckoMarketDto,
    listCoin?: CoinGeckoListCoinDto,
  ): ResolveCanonicalProjectInput {
    const coingeckoId = this.normalizeCoinGeckoId(market.id || listCoin?.id);
    const name = this.cleanString(market.name || listCoin?.name);
    const symbol = this.cleanString(market.symbol || listCoin?.symbol);
    const normalizedName = this.normalizeName(name);
    const normalizedSymbol = this.normalizeSymbol(symbol);
    const sourceUrl = this.sourceUrl(coingeckoId);
    const contracts = this.contractsFromPlatforms(listCoin?.platforms || {});

    return {
      source: "coingecko",
      sourceEntityType: "asset",
      sourceId: coingeckoId,
      sourceSlug: coingeckoId,
      sourceUrl,
      name,
      normalizedName,
      symbol,
      normalizedSymbol,
      providerIds: { coingeckoId },
      contracts,
      aliases: [
        { type: "name", value: name, normalizedValue: normalizedName },
        { type: "slug", value: coingeckoId, normalizedValue: coingeckoId },
        { type: "symbol", value: symbol, normalizedValue: normalizedSymbol },
      ].filter((alias) => alias.value),
    };
  }

  buildDryRunActions(resolverResult: ResolveCanonicalProjectResult): CoinGeckoMarketUniverseAssetReport["actions"] {
    const actions: CoinGeckoMarketUniverseAssetReport["actions"] = [
      {
        type: "would_create_source_snapshot",
        description: "Would store raw CoinGecko asset payload in source_snapshots.",
      },
      {
        type: "would_create_source_entity",
        description: "Would register CoinGecko asset in source_entities.",
      },
      {
        type: "would_create_market_asset",
        description: "Would create or update market asset identity.",
      },
    ];

    if (resolverResult.status === "conflict") {
      actions.push(
        {
          type: "would_create_dedupe_review_item",
          description: "Would create manual review item because resolver returned conflict.",
        },
        {
          type: "no_verified_link",
          description: "Would not create a verified project asset link for a conflicted resolver result.",
          verified: false,
        },
      );
      return actions;
    }

    if (resolverResult.status === "matched") {
      actions.push({
        type: "would_link_market_asset_to_existing_canonical",
        description: `Would link market asset to existing canonical project ${resolverResult.canonicalProjectId}.`,
        verified: resolverResult.verified,
      });
    } else if (resolverResult.status === "created_candidate") {
      actions.push({
        type: "would_create_canonical_project",
        description: "Would create a new canonical project candidate for this CoinGecko asset.",
        verified: false,
      });
    }

    if (resolverResult.status === "matched" || resolverResult.status === "created_candidate" || resolverResult.status === "proposed") {
      actions.push(
        {
          type: "would_create_project_asset_link",
          description: "Would create project_asset_links association between canonical project and market asset.",
          verified: resolverResult.verified,
        },
        {
          type: "would_create_canonical_project_source",
          description: "Would create canonical_project_sources reference for CoinGecko asset.",
          verified: resolverResult.verified,
        },
      );
    }

    return actions;
  }

  private async fetchMarkets(
    limit: number,
    options: CoinGeckoMarketUniverseDryRunOptions,
  ): Promise<CoinGeckoMarketDto[]> {
    const perPage = Math.max(1, Math.min(250, Math.trunc(Number(options.perPage || Math.min(limit, 250)))));
    let page = Math.max(1, Math.trunc(Number(options.page || 1)));
    const markets: CoinGeckoMarketDto[] = [];

    while (markets.length < limit) {
      const batch = await this.coinGeckoClient.fetchMarketsPage({ page, perPage });
      if (!batch.length) break;
      markets.push(...batch);
      if (batch.length < perPage) break;
      page += 1;
    }

    return markets.slice(0, limit);
  }

  private async fetchListById(): Promise<Map<string, CoinGeckoListCoinDto>> {
    const list = await this.coinGeckoClient.fetchCoinsList(true);
    return new Map(list.map((coin) => [this.normalizeCoinGeckoId(coin.id), coin]));
  }

  private buildAssetReport(
    market: CoinGeckoMarketDto,
    listCoin: CoinGeckoListCoinDto | undefined,
    resolverInput: ResolveCanonicalProjectInput,
    resolverResult: ResolveCanonicalProjectResult,
  ): CoinGeckoMarketUniverseAssetReport {
    return {
      coingeckoId: resolverInput.sourceId || "",
      name: resolverInput.name || "",
      symbol: resolverInput.symbol || "",
      marketCapRank: market.market_cap_rank ?? null,
      sourceUrl: resolverInput.sourceUrl || "",
      sourceSnapshotPreview: {
        source: "coingecko",
        sourceEntityType: "asset",
        sourceId: resolverInput.sourceId || "",
        rawPayload: {
          market,
          ...(listCoin ? { listCoin } : {}),
        },
      },
      contracts: resolverInput.contracts || this.contractsFromPlatforms(listCoin?.platforms || {}),
      resolver: resolverResult,
      actions: this.buildDryRunActions(resolverResult),
    };
  }

  private addToSummary(
    result: CoinGeckoMarketUniverseDryRunResult,
    asset: CoinGeckoMarketUniverseAssetReport,
    exampleLimit: number,
  ): void {
    if (asset.resolver.status === "matched") {
      result.resolver.matched += 1;
      this.pushExample(result.examples.matched, asset, exampleLimit);
    } else if (asset.resolver.status === "created_candidate") {
      result.resolver.createdCandidate += 1;
      this.pushExample(result.examples.createdCandidates, asset, exampleLimit);
    } else if (asset.resolver.status === "proposed") {
      result.resolver.proposed += 1;
      this.pushExample(result.examples.proposed, asset, exampleLimit);
    } else if (asset.resolver.status === "conflict") {
      result.resolver.conflict += 1;
      this.pushExample(result.examples.conflicts, asset, exampleLimit);
      result.conflicts.push({
        coingeckoId: asset.coingeckoId,
        name: asset.name,
        conflicts: asset.resolver.conflicts,
      });
    } else if (asset.resolver.status === "unresolved") {
      result.resolver.unresolved += 1;
    }

    for (const action of asset.actions) {
      this.incrementWouldCreate(result, action.type);
    }
  }

  private incrementWouldCreate(result: CoinGeckoMarketUniverseDryRunResult, actionType: string): void {
    if (actionType === "would_create_source_snapshot") result.wouldCreate.sourceSnapshots += 1;
    if (actionType === "would_create_source_entity") result.wouldCreate.sourceEntities += 1;
    if (actionType === "would_create_market_asset") result.wouldCreate.marketAssets += 1;
    if (actionType === "would_create_canonical_project") result.wouldCreate.canonicalProjects += 1;
    if (actionType === "would_create_project_asset_link") result.wouldCreate.projectAssetLinks += 1;
    if (actionType === "would_create_canonical_project_source") result.wouldCreate.canonicalProjectSources += 1;
    if (actionType === "would_create_dedupe_review_item") result.wouldCreate.dedupeReviewItems += 1;
  }

  private emptyResult(requestedLimit: number | null, all: boolean, warnings: string[]): CoinGeckoMarketUniverseDryRunResult {
    return {
      mode: "dry-run",
      dbName: this.dbName(),
      warnings,
      scanned: 0,
      requestedLimit,
      all,
      resolver: {
        matched: 0,
        createdCandidate: 0,
        proposed: 0,
        conflict: 0,
        unresolved: 0,
      },
      wouldCreate: {
        sourceSnapshots: 0,
        sourceEntities: 0,
        marketAssets: 0,
        canonicalProjects: 0,
        projectAssetLinks: 0,
        canonicalProjectSources: 0,
        dedupeReviewItems: 0,
      },
      conflicts: [],
      examples: {
        createdCandidates: [],
        matched: [],
        conflicts: [],
        proposed: [],
      },
      assets: [],
    };
  }

  private safetyWarnings(): string[] {
    const warnings: string[] = [];
    if (this.dbName() === "fomoland") {
      warnings.push("DB_NAME resolves to fomoland. Phase 2 is dry-run only, but this should not be used for v2 writes.");
    }
    return warnings;
  }

  private resolveLimit(options: CoinGeckoMarketUniverseDryRunOptions): number {
    if (options.all) return Number.MAX_SAFE_INTEGER;
    return this.parseLimit(options.limit);
  }

  private parseLimit(value: any): number {
    const parsed = Number(value || 100);
    if (!Number.isFinite(parsed) || parsed <= 0) return 100;
    return Math.max(1, Math.trunc(parsed));
  }

  private parseExamplesLimit(value: any): number {
    if (value === undefined || value === null || value === "") return this.defaultExampleLimit;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return this.defaultExampleLimit;
    return Math.max(0, Math.min(50, Math.trunc(parsed)));
  }

  private pushExample(
    target: CoinGeckoMarketUniverseAssetReport[],
    asset: CoinGeckoMarketUniverseAssetReport,
    exampleLimit: number,
  ): void {
    if (target.length < exampleLimit) target.push(asset);
  }

  private contractsFromPlatforms(platforms: Record<string, string>): ResolveCanonicalProjectInput["contracts"] {
    return Object.entries(platforms || {})
      .map(([chainSlug, address]) => ({
        chainSlug: this.cleanString(chainSlug).toLowerCase(),
        address: this.cleanString(address).toLowerCase(),
      }))
      .filter((contract) => contract.chainSlug && contract.address);
  }

  private sourceUrl(coingeckoId: string): string {
    return coingeckoId ? `https://www.coingecko.com/en/coins/${encodeURIComponent(coingeckoId)}` : "";
  }

  private dbName(): string {
    return String(this.configService.get("DB_NAME") || process.env.DB_NAME || "fomoland").trim() || "fomoland";
  }

  private normalizeCoinGeckoId(value: any): string {
    return this.cleanString(value).toLowerCase();
  }

  private normalizeName(value: any): string {
    return this.cleanString(value)
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private normalizeSymbol(value: any): string {
    return this.cleanString(value).replace(/^\$/, "").toUpperCase();
  }

  private cleanString(value: any): string {
    return String(value || "").trim();
  }
}
