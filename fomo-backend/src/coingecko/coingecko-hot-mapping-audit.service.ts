import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { Project, ProjectDocument } from "src/projects/project.model";
import {
  ProjectSourceMap,
  ProjectSourceMapDocument,
  ProjectSourceMatchMethod,
} from "src/projects/intel-sync/models/project-source-map.model";
import {
  CoinGeckoListCoinDto,
  CoinGeckoMarketDto,
  CoinGeckoSearchCoinDto,
} from "./coingecko-market.types";
import { CoinGeckoProClientService } from "./coingecko-pro-client.service";
import { COINGECKO_HOT_ID_OVERRIDES } from "./coingecko-hot-overrides";
import { buildCoinGeckoTierRankFilter, getCoinGeckoTierProjectLimit } from "./config/coingecko-tier.config";

interface HotMappingAuditOptions {
  dryRun?: boolean;
  write?: boolean;
  minConfidence?: number;
  topCandidates?: number;
}

interface Candidate {
  id: string;
  symbol: string;
  name: string;
  source: "override" | "list" | "search";
  platforms?: Record<string, string>;
  searchRank?: number | null;
}

@Injectable()
export class CoinGeckoHotMappingAuditService {
  private readonly logger = new Logger(CoinGeckoHotMappingAuditService.name);

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectSourceMap.name)
    private readonly sourceMapModel: Model<ProjectSourceMapDocument>,
    private readonly coinGeckoClient: CoinGeckoProClientService,
  ) {}

  async runHotMappingAudit(options: HotMappingAuditOptions = {}): Promise<any> {
    const startedAt = new Date();
    const dryRun = options.write === true ? false : options.dryRun !== false;
    const write = options.write === true && !dryRun;
    const minConfidence = this.clampNumber(options.minConfidence, 85, 0, 100);
    const topCandidates = this.clampNumber(options.topCandidates, 5, 1, 20);

    if (!this.coinGeckoClient.isConfigured()) {
      throw new Error("COINGECKO_KEY is not configured");
    }

    const hotProjects = await this.loadHotProjects();
    const existingMapsByProjectId = await this.loadExistingMaps(hotProjects);
    const verifiedProjectIds = new Set<string>();
    const verifiedSourceIds = new Set<string>();

    for (const maps of existingMapsByProjectId.values()) {
      for (const map of maps) {
        const sourceId = this.normalizeCoinGeckoId(map.sourceId || map.sourceSlug);
        if (!map.isVerified || !sourceId) continue;
        verifiedProjectIds.add(map.projectId?.toString());
        verifiedSourceIds.add(sourceId);
      }
    }

    const unmappedProjects = hotProjects.filter((project) => !verifiedProjectIds.has(project._id.toString()));
    const coinList = await this.coinGeckoClient.fetchCoinsList(true);
    const indexes = this.buildCoinListIndexes(coinList);
    const candidatesByProjectId = new Map<string, Candidate[]>();
    const searchResultsByQuery = await this.fetchSearchResults(unmappedProjects);

    for (const project of unmappedProjects) {
      candidatesByProjectId.set(project._id.toString(), this.buildCandidates(project, indexes, searchResultsByQuery));
    }

    const marketsById = await this.fetchCandidateMarkets(candidatesByProjectId);
    const operations: any[] = [];
    const autoWritten: any[] = [];
    const manualReview: any[] = [];
    const unresolved: any[] = [];
    const providerMissing: any[] = [];
    const symbolMismatch: any[] = [];

    for (const project of unmappedProjects) {
      const scored = this.scoreCandidates(project, candidatesByProjectId.get(project._id.toString()) || [], marketsById);
      const best = scored[0];

      if (!best) {
        const row = this.toProjectAuditRow(project, existingMapsByProjectId, "no_candidates");
        unresolved.push(row);
        manualReview.push(row);
        continue;
      }

      if (!best.market) {
        const row = this.toCandidateAuditRow(project, best, existingMapsByProjectId, "provider_missing", scored, topCandidates);
        providerMissing.push(row);
        manualReview.push(row);
        continue;
      }

      if (!best.symbolExact) {
        const row = this.toCandidateAuditRow(project, best, existingMapsByProjectId, "symbol_mismatch", scored, topCandidates);
        symbolMismatch.push(row);
        manualReview.push(row);
        continue;
      }

      const second = scored[1];
      const ambiguous = second && best.confidence - second.confidence < 5;
      const sourceIdAlreadyMapped = verifiedSourceIds.has(best.id);
      const canWrite =
        best.confidence >= minConfidence &&
        best.nameSimilarity >= 0.75 &&
        !best.derivativeMismatch &&
        !ambiguous &&
        !sourceIdAlreadyMapped;

      if (!canWrite) {
        const status = sourceIdAlreadyMapped
          ? "candidate_already_mapped"
          : ambiguous
            ? "ambiguous"
            : "below_auto_threshold";
        manualReview.push(this.toCandidateAuditRow(project, best, existingMapsByProjectId, status, scored, topCandidates));
        continue;
      }

      const reportRow = this.toCandidateAuditRow(project, best, existingMapsByProjectId, "auto_mapped", scored, topCandidates);
      autoWritten.push(reportRow);
      operations.push(this.buildSourceMapOperation(project, best));
    }

    let written = 0;
    if (write && operations.length) {
      const result = await this.sourceMapModel.bulkWrite(operations, { ordered: false });
      written = Number(result.modifiedCount || 0) + Number(result.upsertedCount || 0);
    }

    const finishedAt = new Date();
    const report = {
      mode: write ? "write" : "dry-run",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      summary: {
        dryRun,
        write,
        minConfidence,
        hotProjects: hotProjects.length,
        existingVerified: verifiedProjectIds.size,
        hotUnmappedBefore: unmappedProjects.length,
        autoMappable: autoWritten.length,
        written,
        manualReview: manualReview.length,
        unresolved: unresolved.length,
        providerMissing: providerMissing.length,
        symbolMismatch: symbolMismatch.length,
        projectedHotCoverageAfterWrite: verifiedProjectIds.size + (write ? written : autoWritten.length),
      },
      autoWritten,
      manualReview,
      unresolved,
      providerMissing,
      symbolMismatch,
    };

    this.logger.log(
      JSON.stringify({
        event: "coingecko_hot_mapping_audit_finished",
        mode: report.mode,
        hotUnmappedBefore: report.summary.hotUnmappedBefore,
        autoMappable: report.summary.autoMappable,
        written: report.summary.written,
        manualReview: report.summary.manualReview,
        durationMs: report.durationMs,
      }),
    );

    return report;
  }

  private async loadHotProjects(): Promise<any[]> {
    return this.projectModel
      .find({ rank: buildCoinGeckoTierRankFilter("HOT") })
      .sort({ rank: 1 })
      .limit(getCoinGeckoTierProjectLimit("HOT") || 250)
      .select("_id rank slug symbol name marketCap rawIcoData tokenMetrics tokenAddress contracts")
      .lean();
  }

  private async loadExistingMaps(projects: any[]): Promise<Map<string, any[]>> {
    const maps = await this.sourceMapModel
      .find({
        source: "coingecko",
        projectId: { $in: projects.map((project) => project._id) },
      })
      .sort({ confidence: -1 })
      .lean();
    const result = new Map<string, any[]>();

    for (const map of maps as any[]) {
      const projectId = map.projectId?.toString();
      if (!projectId) continue;
      const items = result.get(projectId) || [];
      items.push(map);
      result.set(projectId, items);
    }

    return result;
  }

  private buildCoinListIndexes(coins: CoinGeckoListCoinDto[]): any {
    const byId = new Map<string, Candidate>();
    const bySymbol = new Map<string, Candidate[]>();
    const byName = new Map<string, Candidate[]>();

    for (const coin of coins) {
      const candidate: Candidate = {
        id: this.normalizeCoinGeckoId(coin.id),
        symbol: this.normalizeSymbol(coin.symbol),
        name: coin.name,
        platforms: coin.platforms || {},
        source: "list",
      };
      if (!candidate.id) continue;
      byId.set(candidate.id, candidate);
      this.pushMapArray(bySymbol, candidate.symbol, candidate);
      this.pushMapArray(byName, this.normalizeName(candidate.name), candidate);
    }

    return { byId, bySymbol, byName };
  }

  private async fetchSearchResults(projects: any[]): Promise<Map<string, Candidate[]>> {
    const result = new Map<string, Candidate[]>();
    const queries = this.uniqueStrings(projects.flatMap((project) => this.projectQueries(project)));

    for (const query of queries) {
      try {
        const response = await this.coinGeckoClient.search(query);
        result.set(
          query.toLowerCase(),
          (response.coins || []).map((coin: CoinGeckoSearchCoinDto) => ({
            id: this.normalizeCoinGeckoId(coin.id),
            symbol: this.normalizeSymbol(coin.symbol || coin.api_symbol),
            name: coin.name,
            searchRank: coin.market_cap_rank,
            source: "search",
          })),
        );
      } catch (error) {
        this.logger.warn(`CoinGecko HOT mapping search failed query=${query}: ${error?.message || error}`);
      }
    }

    return result;
  }

  private buildCandidates(project: any, indexes: any, searchResultsByQuery: Map<string, Candidate[]>): Candidate[] {
    const candidates = new Map<string, Candidate>();
    const overrideId = this.normalizeCoinGeckoId(COINGECKO_HOT_ID_OVERRIDES[this.normalizeCoinGeckoId(project.slug)]);
    const projectSymbol = this.normalizeSymbol(project.symbol);
    const projectSlug = this.normalizeCoinGeckoId(project.slug);

    if (overrideId) {
      const overrideCandidate = indexes.byId.get(overrideId) || {
        id: overrideId,
        symbol: "",
        name: overrideId,
        source: "override",
      };
      candidates.set(overrideId, { ...overrideCandidate, source: "override" });
    }

    if (projectSlug && indexes.byId.has(projectSlug)) this.setCandidate(candidates, indexes.byId.get(projectSlug));

    for (const candidate of ((indexes.bySymbol.get(projectSymbol) || []) as Candidate[]).slice(0, 250)) {
      this.setCandidate(candidates, candidate);
    }

    for (const name of this.projectNames(project)) {
      for (const candidate of ((indexes.byName.get(this.normalizeName(name)) || []) as Candidate[]).slice(0, 50)) {
        this.setCandidate(candidates, candidate);
      }
    }

    for (const query of this.projectQueries(project)) {
      for (const candidate of (searchResultsByQuery.get(query.toLowerCase()) || []).slice(0, 20)) {
        const existing = candidates.get(candidate.id);
        candidates.set(candidate.id, {
          ...(existing || candidate),
          searchRank: candidate.searchRank ?? existing?.searchRank,
          source: existing?.source === "override" ? "override" : existing ? existing.source : "search",
        });
      }
    }

    return Array.from(candidates.values());
  }

  private setCandidate(candidates: Map<string, Candidate>, candidate: Candidate): void {
    const existing = candidates.get(candidate.id);
    if (existing?.source === "override") return;
    candidates.set(candidate.id, candidate);
  }

  private async fetchCandidateMarkets(candidatesByProjectId: Map<string, Candidate[]>): Promise<Map<string, CoinGeckoMarketDto>> {
    const ids = this.uniqueIds(Array.from(candidatesByProjectId.values()).flat().map((candidate) => candidate.id));
    const result = new Map<string, CoinGeckoMarketDto>();

    for (const batch of this.chunk(ids, this.coinGeckoClient.getMaxBatchSize())) {
      try {
        const markets = await this.coinGeckoClient.fetchMarketsBatch(batch);
        for (const market of markets) {
          const id = this.normalizeCoinGeckoId(market.id);
          if (id) result.set(id, market);
        }
      } catch (error) {
        this.logger.warn(`CoinGecko HOT candidate market batch failed ids=${batch.length}: ${error?.message || error}`);
      }
    }

    return result;
  }

  private scoreCandidates(project: any, candidates: Candidate[], marketsById: Map<string, CoinGeckoMarketDto>): any[] {
    return candidates
      .map((candidate) => this.scoreCandidate(project, candidate, marketsById.get(candidate.id)))
      .filter((candidate) => candidate.id)
      .sort((a, b) => b.confidence - a.confidence);
  }

  private scoreCandidate(project: any, candidate: Candidate, market?: CoinGeckoMarketDto): any {
    const projectSymbol = this.normalizeSymbol(project.symbol);
    const candidateSymbol = this.normalizeSymbol(market?.symbol || candidate.symbol);
    const symbolExact = Boolean(projectSymbol && candidateSymbol && projectSymbol === candidateSymbol);
    const nameSimilarity = this.bestNameSimilarity(project, market?.name || candidate.name);
    const slugSimilarity = this.slugSimilarity(this.normalizeCoinGeckoId(project.slug), candidate.id);
    const rankSanity = this.rankSanity(project.rank, market?.market_cap_rank ?? candidate.searchRank);
    const contractMatched = this.hasContractMatch(project, candidate);
    const derivativeMismatch = this.hasDerivativeMismatch(project, candidate, market);
    const reasons: string[] = [];

    if (symbolExact) reasons.push("exact symbol");
    if (nameSimilarity >= 0.95) reasons.push("exact/near name");
    else if (nameSimilarity >= 0.75) reasons.push("strong name similarity");
    if (rankSanity > 0) reasons.push("rank sanity");
    if (slugSimilarity >= 0.85) reasons.push("strong slug/id similarity");
    else if (slugSimilarity >= 0.45) reasons.push("partial slug/id similarity");
    if (contractMatched) reasons.push("contract match");
    if (candidate.source === "override") reasons.push("manual override");
    if (derivativeMismatch) reasons.push("wrapped/bridged derivative mismatch");
    if (!symbolExact) reasons.push("symbol mismatch");
    if (!market) reasons.push("missing provider market row");

    let confidence =
      (symbolExact ? 40 : 0) +
      nameSimilarity * 40 +
      rankSanity * 10 +
      slugSimilarity * 10 +
      (contractMatched ? 15 : 0) +
      (candidate.source === "override" ? 5 : 0);

    if (derivativeMismatch) confidence -= 35;
    if (!market) confidence -= 20;
    if (!symbolExact) confidence -= 20;

    confidence = Math.max(0, Math.min(100, Math.round(confidence)));

    return {
      ...candidate,
      market,
      providerSymbol: market?.symbol || candidate.symbol,
      providerName: market?.name || candidate.name,
      marketCapRank: market?.market_cap_rank ?? candidate.searchRank,
      providerMarketCap: market?.market_cap,
      confidence,
      reasons,
      symbolExact,
      nameSimilarity: Number(nameSimilarity.toFixed(3)),
      slugSimilarity: Number(slugSimilarity.toFixed(3)),
      rankSanity: Number(rankSanity.toFixed(3)),
      contractMatched,
      derivativeMismatch,
      matchMethod: candidate.source === "override"
        ? "manual_override"
        : contractMatched
          ? "contract"
          : "name_symbol",
    };
  }

  private buildSourceMapOperation(project: any, candidate: any): any {
    return {
      updateOne: {
        filter: {
          projectId: new mongoose.Types.ObjectId(project._id.toString()),
          source: "coingecko",
        },
        update: {
          $set: {
            projectId: new mongoose.Types.ObjectId(project._id.toString()),
            source: "coingecko",
            sourceSlug: candidate.market.id,
            sourceId: candidate.market.id,
            sourceUrl: `https://www.coingecko.com/en/coins/${candidate.market.id}`,
            sourceName: candidate.market.name,
            sourceSymbol: String(candidate.market.symbol || "").toUpperCase(),
            matchMethod: candidate.matchMethod as ProjectSourceMatchMethod,
            confidence: candidate.confidence,
            isVerified: true,
            lastSyncedAt: new Date(),
          },
        },
        upsert: true,
      },
    };
  }

  private toCandidateAuditRow(
    project: any,
    candidate: any,
    existingMapsByProjectId: Map<string, any[]>,
    status: string,
    candidates: any[],
    topCandidates: number,
  ): any {
    return {
      ...this.toProjectAuditRow(project, existingMapsByProjectId, status),
      candidate: this.toCandidateSummary(candidate),
      candidates: candidates.slice(0, topCandidates).map((item) => this.toCandidateSummary(item)),
    };
  }

  private toProjectAuditRow(project: any, existingMapsByProjectId: Map<string, any[]>, status: string): any {
    return {
      status,
      projectId: project._id.toString(),
      rank: project.rank,
      slug: project.slug,
      name: project.name,
      symbol: project.symbol,
      marketCap: project.marketCap,
      rawIcoDataCoingeckoId: project.rawIcoData?.coingeckoId || project.rawIcoData?.marketData?.coingeckoId || null,
      tokenMetricsCoingeckoId: project.tokenMetrics?.coingeckoId || null,
      existingMappings: (existingMapsByProjectId.get(project._id.toString()) || []).map((map) => ({
        sourceId: map.sourceId,
        sourceSlug: map.sourceSlug,
        sourceName: map.sourceName,
        sourceSymbol: map.sourceSymbol,
        matchMethod: map.matchMethod,
        confidence: map.confidence,
        isVerified: map.isVerified,
      })),
    };
  }

  private toCandidateSummary(candidate: any): any {
    return {
      id: candidate.id,
      symbol: candidate.providerSymbol,
      name: candidate.providerName,
      marketCapRank: candidate.marketCapRank,
      marketCap: candidate.providerMarketCap,
      confidence: candidate.confidence,
      matchMethod: candidate.matchMethod,
      source: candidate.source,
      symbolExact: candidate.symbolExact,
      nameSimilarity: candidate.nameSimilarity,
      slugSimilarity: candidate.slugSimilarity,
      rankSanity: candidate.rankSanity,
      contractMatched: candidate.contractMatched,
      derivativeMismatch: candidate.derivativeMismatch,
      reasons: candidate.reasons,
    };
  }

  private projectQueries(project: any): string[] {
    return this.uniqueStrings([
      project.slug,
      project.name,
      project.symbol,
      project.rawIcoData?.name,
      project.rawIcoData?.title,
      project.rawIcoData?.symbol,
      project.rawIcoData?.ticker,
      project.tokenMetrics?.name,
      project.tokenMetrics?.symbol,
    ]);
  }

  private projectNames(project: any): string[] {
    return this.uniqueStrings([
      project.name,
      project.rawIcoData?.name,
      project.rawIcoData?.title,
      project.tokenMetrics?.name,
    ]);
  }

  private bestNameSimilarity(project: any, candidateName: string): number {
    const candidate = this.normalizeName(candidateName);
    if (!candidate) return 0;

    return Math.max(0, ...this.projectNames(project).map((name) => this.nameSimilarity(this.normalizeName(name), candidate)));
  }

  private nameSimilarity(left: string, right: string): number {
    if (!left || !right) return 0;
    if (left === right) return 1;
    if (left.includes(right) || right.includes(left)) return 0.85;

    const leftTokens = this.nameTokens(left);
    const rightTokens = this.nameTokens(right);
    if (!leftTokens.size || !rightTokens.size) return 0;
    const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
    const smaller = Math.min(leftTokens.size, rightTokens.size);
    const union = new Set([...leftTokens, ...rightTokens]).size;
    return Math.max(intersection / smaller * 0.85, intersection / union);
  }

  private nameTokens(value: string): Set<string> {
    return new Set(
      value
        .split(" ")
        .map((token) => token.trim())
        .filter((token) => token && !["prev", "old", "new", "token", "coin"].includes(token)),
    );
  }

  private slugSimilarity(left: string, right: string): number {
    if (!left || !right) return 0;
    if (left === right) return 1;
    if (this.compactSlug(left) === this.compactSlug(right)) return 0.95;
    if (this.stripCoinGeckoVersionSuffix(left) === this.stripCoinGeckoVersionSuffix(right)) return 0.95;

    const leftTokens = new Set(left.split("-").filter(Boolean));
    const rightTokens = new Set(right.split("-").filter(Boolean));
    const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
    const union = new Set([...leftTokens, ...rightTokens]).size;
    return union ? intersection / union : 0;
  }

  private rankSanity(projectRank: any, providerRank: any): number {
    const left = Number(projectRank || 0);
    const right = Number(providerRank || 0);
    if (!left || !right) return 0;
    const diff = Math.abs(left - right);
    if (diff <= 25) return 1;
    if (diff <= 100) return 0.9;
    if (diff <= 500) return 0.8;
    if (diff <= 1500) return 0.5;
    return 0;
  }

  private hasContractMatch(project: any, candidate: Candidate): boolean {
    const projectContracts = this.extractContractAddresses(project);
    if (!projectContracts.size || !candidate.platforms) return false;

    return Object.values(candidate.platforms)
      .map((value) => this.normalizeAddress(value))
      .filter(Boolean)
      .some((address) => projectContracts.has(address));
  }

  private extractContractAddresses(source: any): Set<string> {
    const result = new Set<string>();
    const visit = (value: any, key = "") => {
      if (value === null || value === undefined) return;
      if (typeof value === "string") {
        const matches = value.match(/0x[a-fA-F0-9]{40}/g) || [];
        for (const match of matches) {
          if (/address|contract|token|explorer|url/i.test(key)) result.add(this.normalizeAddress(match));
        }
        return;
      }
      if (Array.isArray(value)) {
        for (const item of value) visit(item, key);
        return;
      }
      if (typeof value === "object") {
        for (const [childKey, childValue] of Object.entries(value)) {
          visit(childValue, childKey);
        }
      }
    };

    visit(source.tokenAddress, "tokenAddress");
    visit(source.contracts, "contracts");
    visit(source.rawIcoData?.contracts, "contracts");
    visit(source.rawIcoData?.contractAddress, "contractAddress");
    visit(source.rawIcoData?.links, "links");
    visit(source.tokenMetrics?.contracts, "contracts");
    return result;
  }

  private hasDerivativeMismatch(project: any, candidate: Candidate, market?: CoinGeckoMarketDto): boolean {
    const projectText = this.normalizeName([project.slug, project.symbol, ...this.projectNames(project)].join(" "));
    const candidateText = this.normalizeName([candidate.id, candidate.symbol, candidate.name, market?.symbol, market?.name].join(" "));
    const candidateGroups = this.derivativeIndicatorGroups(candidateText);
    if (!candidateGroups.size) return false;

    const projectGroups = this.derivativeIndicatorGroups(projectText);
    for (const group of candidateGroups) {
      if (!projectGroups.has(group)) return true;
    }

    return false;
  }

  private derivativeIndicatorGroups(value: string): Set<string> {
    const result = new Set<string>();
    const text = ` ${value} `;
    const indicators: Array<{ group: string; patterns: RegExp[] }> = [
      { group: "wrapped", patterns: [/\bwrapped\b/] },
      { group: "pegged", patterns: [/\bpeg\b/, /\bpegged\b/, /\bbinance peg\b/] },
      { group: "bridged", patterns: [/\bbridged\b/, /\bbridge\b/, /\bwormhole\b/, /\bportal\b/, /\baxelar\b/, /\bmultichain\b/, /\blayerzero\b/] },
      { group: "staked", patterns: [/\bstaked\b/, /\bstaking\b/, /\bliquid staked\b/] },
      { group: "restaked", patterns: [/\brestaked\b/, /\brestaking\b/] },
      { group: "synthetic", patterns: [/\bsynthetic\b/, /\bsynth\b/] },
    ];

    for (const indicator of indicators) {
      if (indicator.patterns.some((pattern) => pattern.test(text))) result.add(indicator.group);
    }

    return result;
  }

  private pushMapArray<T>(map: Map<string, T[]>, key: string, value: T): void {
    if (!key) return;
    const items = map.get(key) || [];
    items.push(value);
    map.set(key, items);
  }

  private uniqueIds(ids: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const id of ids) {
      const normalized = this.normalizeCoinGeckoId(id);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      result.push(normalized);
    }
    return result;
  }

  private uniqueStrings(values: any[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const value of values) {
      const normalized = String(value || "").trim();
      const key = normalized.toLowerCase();
      if (!normalized || seen.has(key)) continue;
      seen.add(key);
      result.push(normalized);
    }
    return result;
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  }

  private clampNumber(value: any, fallback: number, min: number, max: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, Math.trunc(parsed)));
  }

  private normalizeCoinGeckoId(value: any): string {
    return String(value || "").trim().toLowerCase();
  }

  private normalizeSymbol(value: any): string {
    return String(value || "").trim().toLowerCase();
  }

  private normalizeName(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private normalizeAddress(value: any): string {
    return String(value || "").trim().toLowerCase();
  }

  private compactSlug(value: string): string {
    return String(value || "").replace(/-/g, "");
  }

  private stripCoinGeckoVersionSuffix(value: string): string {
    return String(value || "").replace(/-\d+$/, "");
  }
}
