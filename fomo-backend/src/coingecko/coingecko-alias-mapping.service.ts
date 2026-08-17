import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { Transaction, TransactionDocument } from "src/portfolio/model/portfolio.model";
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
import { COINGECKO_TIERS } from "./config/coingecko-tier.config";

interface AliasMappingOptions {
  dryRun?: boolean;
  write?: boolean;
  limit?: number;
  minConfidence?: number;
  maxRank?: number;
  topMarketCapLimit?: number;
  searchLimit?: number;
  topImportantLimit?: number;
  refreshExisting?: boolean;
}

interface Candidate {
  id: string;
  symbol: string;
  name: string;
  platforms?: Record<string, string>;
  source: "list" | "search";
  searchRank?: number | null;
}

@Injectable()
export class CoinGeckoAliasMappingService {
  private readonly logger = new Logger(CoinGeckoAliasMappingService.name);

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectSourceMap.name)
    private readonly sourceMapModel: Model<ProjectSourceMapDocument>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<TransactionDocument>,
    private readonly coinGeckoClient: CoinGeckoProClientService,
  ) { }

  async runAliasMapping(options: AliasMappingOptions = {}): Promise<any> {
    const startedAt = new Date();
    const dryRun = options.write === true ? false : options.dryRun !== false;
    const write = options.write === true && !dryRun;
    const minConfidence = this.clampNumber(options.minConfidence, 90, 0, 100);
    const searchLimit = this.clampNumber(options.searchLimit, 100, 0, 1000);
    const topImportantLimit = this.clampNumber(options.topImportantLimit, 100, 0, 1000);

    if (!this.coinGeckoClient.isConfigured()) {
      throw new Error("COINGECKO_KEY is not configured");
    }

    const projects = await this.loadImportantUnmappedProjects(options);
    const existingVerifiedSourceIds = await this.loadVerifiedCoinGeckoIds();
    const coinList = await this.loadCoinList();
    const indexes = this.buildCoinListIndexes(coinList);
    const candidatesByProjectId = new Map<string, Candidate[]>();
    const searchQueries = this.buildSearchQueries(projects, indexes, searchLimit);
    const searchResultsByQuery = await this.fetchSearchResults(searchQueries);

    for (const project of projects) {
      const candidates = this.buildCandidates(project, indexes, searchResultsByQuery);
      candidatesByProjectId.set(project._id.toString(), candidates);
    }

    const marketsById = await this.fetchCandidateMarkets(candidatesByProjectId);
    const scoredCandidatesByProjectId = new Map<string, any[]>();
    const autoCandidateCounts = new Map<string, number>();

    for (const project of projects) {
      const projectId = project._id.toString();
      const scoredCandidates = this.scoreCandidates(
        project,
        candidatesByProjectId.get(projectId) || [],
        marketsById,
      );
      scoredCandidatesByProjectId.set(projectId, scoredCandidates);

      const best = scoredCandidates[0];
      const second = scoredCandidates[1];
      const ambiguous = second && best && best.confidence - second.confidence < 5;
      const sourceIdAlreadyMapped = best && existingVerifiedSourceIds.has(best.id);
      if (
        best &&
        best.confidence >= minConfidence &&
        !ambiguous &&
        !sourceIdAlreadyMapped &&
        this.canAutoMapCandidate(project, best)
      ) {
        autoCandidateCounts.set(best.id, (autoCandidateCounts.get(best.id) || 0) + 1);
      }
    }

    const summary = this.createSummary(dryRun, write, minConfidence, projects.length);
    const operations: any[] = [];
    const autoMapped: any[] = [];
    const needsManualReview: any[] = [];
    const noCandidates: any[] = [];
    const symbolMismatch: any[] = [];
    const topImportantUnmapped: any[] = [];

    for (const project of projects) {
      summary.scanned += 1;
      const projectId = project._id.toString();
      const scoredCandidates = scoredCandidatesByProjectId.get(projectId) || [];
      const best = scoredCandidates[0];

      if (!best) {
        summary.noCandidates += 1;
        this.pushLimited(noCandidates, topImportantLimit, this.toProjectSummary(project, "no_candidates"));
        this.pushLimited(topImportantUnmapped, topImportantLimit, this.toProjectSummary(project, "no_candidates"));
        continue;
      }

      if (!best.symbolExact && !best.contractMatched) {
        summary.symbolMismatch += 1;
        this.pushLimited(symbolMismatch, topImportantLimit, this.toCandidateReport(project, best, "symbol_mismatch"));
        this.pushLimited(topImportantUnmapped, topImportantLimit, this.toCandidateReport(project, best, "symbol_mismatch"));
        continue;
      }

      const second = scoredCandidates[1];
      const ambiguous = second && best.confidence - second.confidence < 5;
      const duplicateAutoCandidate = (autoCandidateCounts.get(best.id) || 0) > 1;
      const sourceIdAlreadyMapped = existingVerifiedSourceIds.has(best.id);
      const canAutoWrite =
        best.confidence >= minConfidence &&
        !ambiguous &&
        !duplicateAutoCandidate &&
        !sourceIdAlreadyMapped &&
        this.canAutoMapCandidate(project, best);

      if (!canAutoWrite) {
        const reviewStatus = sourceIdAlreadyMapped
          ? "candidate_already_mapped"
          : duplicateAutoCandidate
            ? "duplicate_candidate_id"
            : ambiguous
              ? "ambiguous"
              : "below_auto_threshold";
        summary.needsManualReview += 1;
        this.pushLimited(
          needsManualReview,
          topImportantLimit,
          this.toCandidateReport(project, best, reviewStatus, second),
        );
        this.pushLimited(topImportantUnmapped, topImportantLimit, this.toCandidateReport(project, best, "needs_manual_review"));
        continue;
      }

      summary.autoMapped += 1;
      summary.byMatchMethod[best.matchMethod] = (summary.byMatchMethod[best.matchMethod] || 0) + 1;
      const reportRow = this.toCandidateReport(project, best, "auto_mapped");
      this.pushLimited(autoMapped, topImportantLimit, reportRow);
      operations.push(this.buildSourceMapOperation(project, best));
    }

    if (write && operations.length) {
      summary.written = await this.flushOperations(operations);
    }

    const finishedAt = new Date();
    const report = {
      mode: write ? "write" : "dry-run",
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      summary,
      autoMapped,
      needsManualReview,
      noCandidates,
      symbolMismatch,
      topImportantUnmapped,
    };

    this.logger.log(
      JSON.stringify({
        event: "coingecko_alias_mapping_finished",
        mode: report.mode,
        scanned: summary.scanned,
        autoMapped: summary.autoMapped,
        written: summary.written,
        needsManualReview: summary.needsManualReview,
        noCandidates: summary.noCandidates,
        symbolMismatch: summary.symbolMismatch,
        durationMs: report.durationMs,
      }),
    );

    return report;
  }

  private async loadImportantUnmappedProjects(options: AliasMappingOptions): Promise<any[]> {
    const maxRank = this.clampNumber(options.maxRank, COINGECKO_TIERS.WARM.maxRank, 1, 100000);
    const topMarketCapLimit = this.clampNumber(options.topMarketCapLimit, 500, 0, 5000);
    const limit = this.clampNumber(options.limit, 6000, 1, 50000);
    const verifiedMaps = await this.sourceMapModel
      .find({ source: "coingecko", isVerified: true })
      .select("projectId")
      .lean();
    const verifiedProjectIds = new Set((verifiedMaps as any[]).map((item) => item.projectId?.toString()).filter(Boolean));
    const portfolioProjectIds = await this.transactionModel.distinct("projectId", {});
    const portfolioProjectIdStrings = new Set(portfolioProjectIds.map((id: any) => id?.toString()).filter(Boolean));

    const [rankedProjects, topMarketCapProjects, portfolioProjects] = await Promise.all([
      this.projectModel
        .find({ rank: { $gte: 1, $lte: maxRank } })
        .sort({ rank: 1 })
        .select(this.projectSelectFields())
        .lean(),
      topMarketCapLimit
        ? this.projectModel
          .find({ marketCap: { $gt: 0 } })
          .sort({ marketCap: -1 })
          .limit(topMarketCapLimit)
          .select(this.projectSelectFields())
          .lean()
        : Promise.resolve([]),
      portfolioProjectIdStrings.size
        ? this.projectModel
          .find({ _id: { $in: Array.from(portfolioProjectIdStrings).map((id) => new mongoose.Types.ObjectId(id)) } })
          .select(this.projectSelectFields())
          .lean()
        : Promise.resolve([]),
    ]);

    const projectById = new Map<string, any>();
    for (const project of [...rankedProjects, ...topMarketCapProjects, ...portfolioProjects] as any[]) {
      const id = project._id.toString();
      if (!options.refreshExisting && verifiedProjectIds.has(id)) continue;
      project.inPortfolio = portfolioProjectIdStrings.has(id);
      projectById.set(id, project);
    }

    return Array.from(projectById.values())
      .sort((a, b) => this.importanceScore(b) - this.importanceScore(a))
      .slice(0, limit);
  }

  private async loadVerifiedCoinGeckoIds(): Promise<Set<string>> {
    const verifiedMaps = await this.sourceMapModel
      .find({ source: "coingecko", isVerified: true })
      .select("sourceId sourceSlug")
      .lean();

    return new Set(
      (verifiedMaps as any[])
        .map((item) => this.normalizeCoinGeckoId(item.sourceId || item.sourceSlug))
        .filter(Boolean),
    );
  }

  private async loadCoinList(): Promise<CoinGeckoListCoinDto[]> {
    try {
      return await this.coinGeckoClient.fetchCoinsList(true);
    } catch (error) {
      this.logger.warn(`CoinGecko coins/list with platforms failed, retrying without platforms: ${error?.message || error}`);
      return this.coinGeckoClient.fetchCoinsList(false);
    }
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

  private buildSearchQueries(projects: any[], indexes: any, searchLimit: number): string[] {
    if (!searchLimit) return [];

    const queries: string[] = [];
    const seen = new Set<string>();

    for (const project of projects) {
      if (queries.length >= searchLimit) break;
      const listCandidates = this.buildListCandidates(project, indexes);
      const bestListScore = Math.max(0, ...listCandidates.map((candidate) => this.preliminaryScore(project, candidate)));
      if (bestListScore >= 85) continue;

      for (const query of this.projectQueries(project)) {
        const normalized = query.trim();
        const key = normalized.toLowerCase();
        if (!normalized || seen.has(key)) continue;
        seen.add(key);
        queries.push(normalized);
        if (queries.length >= searchLimit) break;
      }
    }

    return queries;
  }

  private async fetchSearchResults(queries: string[]): Promise<Map<string, Candidate[]>> {
    const results = new Map<string, Candidate[]>();

    for (const query of queries) {
      try {
        const response = await this.coinGeckoClient.search(query);
        results.set(
          query.toLowerCase(),
          (response.coins || []).map((coin: CoinGeckoSearchCoinDto) => ({
            id: this.normalizeCoinGeckoId(coin.id),
            symbol: this.normalizeSymbol(coin.symbol || coin.api_symbol),
            name: coin.name,
            source: "search",
            searchRank: coin.market_cap_rank,
          })),
        );
      } catch (error) {
        this.logger.warn(`CoinGecko search failed query=${query}: ${error?.message || error}`);
      }
    }

    return results;
  }

  private buildCandidates(project: any, indexes: any, searchResultsByQuery: Map<string, Candidate[]>): Candidate[] {
    const candidateById = new Map<string, Candidate>();
    for (const candidate of this.buildListCandidates(project, indexes)) {
      candidateById.set(candidate.id, candidate);
    }

    for (const query of this.projectQueries(project)) {
      const searchCandidates = searchResultsByQuery.get(query.toLowerCase()) || [];
      for (const candidate of searchCandidates.slice(0, 20)) {
        const existing = candidateById.get(candidate.id);
        candidateById.set(candidate.id, {
          ...(existing || candidate),
          searchRank: candidate.searchRank ?? existing?.searchRank,
          source: existing ? existing.source : "search",
        });
      }
    }

    return Array.from(candidateById.values());
  }

  private buildListCandidates(project: any, indexes: any): Candidate[] {
    const candidates = new Map<string, Candidate>();
    const slug = this.normalizeCoinGeckoId(project.slug);
    const symbol = this.normalizeSymbol(project.symbol);

    if (slug && indexes.byId.has(slug)) candidates.set(slug, indexes.byId.get(slug));

    const symbolCandidates = (indexes.bySymbol.get(symbol) || []) as Candidate[];
    for (const candidate of symbolCandidates.slice(0, 250)) candidates.set(candidate.id, candidate);

    for (const name of this.projectNames(project)) {
      const nameCandidates = (indexes.byName.get(this.normalizeName(name)) || []) as Candidate[];
      for (const candidate of nameCandidates.slice(0, 50)) candidates.set(candidate.id, candidate);
    }

    return Array.from(candidates.values());
  }

  private async fetchCandidateMarkets(candidatesByProjectId: Map<string, Candidate[]>): Promise<Map<string, CoinGeckoMarketDto>> {
    const ids = this.uniqueIds(
      Array.from(candidatesByProjectId.values())
        .flat()
        .map((candidate) => candidate.id),
    );
    const marketsById = new Map<string, CoinGeckoMarketDto>();

    for (const batch of this.chunk(ids, this.coinGeckoClient.getMaxBatchSize())) {
      try {
        const markets = await this.coinGeckoClient.fetchMarketsBatch(batch);
        for (const market of markets) {
          const id = this.normalizeCoinGeckoId(market.id);
          if (id) marketsById.set(id, market);
        }
      } catch (error) {
        this.logger.warn(`CoinGecko alias candidate market batch failed ids=${batch.length}: ${error?.message || error}`);
      }
    }

    return marketsById;
  }

  private scoreCandidates(project: any, candidates: Candidate[], marketsById: Map<string, CoinGeckoMarketDto>): any[] {
    return candidates
      .map((candidate) => this.scoreCandidate(project, candidate, marketsById.get(candidate.id)))
      .filter((candidate) => candidate.market)
      .sort((a, b) => b.confidence - a.confidence);
  }

  private scoreCandidate(project: any, candidate: Candidate, market?: CoinGeckoMarketDto): any {
    const reasons: string[] = [];
    let score = 0;
    const projectSymbol = this.normalizeSymbol(project.symbol);
    const candidateSymbol = this.normalizeSymbol(market?.symbol || candidate.symbol);
    const symbolExact = Boolean(projectSymbol && candidateSymbol && projectSymbol === candidateSymbol);
    const projectNames = this.projectNames(project).map((name) => this.normalizeName(name)).filter(Boolean);
    const candidateName = this.normalizeName(market?.name || candidate.name);
    const nameExact = projectNames.includes(candidateName);
    const nameStrong = this.hasStrongNameMatch(projectNames, candidateName);
    const slugScore = this.slugSimilarity(this.normalizeCoinGeckoId(project.slug), candidate.id);
    const contractMatched = this.hasContractMatch(project, candidate);
    const rankScore = this.rankSanityScore(project.rank, market?.market_cap_rank ?? candidate.searchRank);
    const derivativeMismatch = this.hasDerivativeMismatch(project, candidate, market);

    if (symbolExact) {
      score += 35;
      reasons.push("exact symbol");
    }
    if (nameExact) {
      score += 30;
      reasons.push("exact normalized name");
    } else if (nameStrong) {
      score += 18;
      reasons.push("strong normalized name");
    }
    if (slugScore >= 0.85) {
      score += 20;
      reasons.push("strong slug/id similarity");
    } else if (slugScore >= 0.55) {
      score += 10;
      reasons.push("partial slug/id similarity");
    }
    if (contractMatched) {
      score += 40;
      reasons.push("contract match");
    }
    if (rankScore > 0) {
      score += rankScore;
      reasons.push("rank sanity");
    }
    if (derivativeMismatch) {
      score -= 35;
      reasons.push("wrapped/bridged derivative mismatch");
    }
    if (!symbolExact && !contractMatched) {
      score -= 20;
      reasons.push("symbol mismatch");
    }

    const confidence = Math.max(0, Math.min(100, score));
    return {
      ...candidate,
      market,
      confidence,
      reasons,
      symbolExact,
      nameExact,
      nameStrong,
      slugScore,
      contractMatched,
      rankScore,
      derivativeMismatch,
      strongIdentityMatch: nameExact || nameStrong || slugScore >= 0.85,
      matchMethod: contractMatched ? "contract" : nameExact || nameStrong ? "name_symbol" : "normalized_slug",
    };
  }

  private canAutoMapCandidate(project: any, candidate: any): boolean {
    if (!candidate.symbolExact || !candidate.strongIdentityMatch) return false;
    if (candidate.derivativeMismatch) return false;

    if (this.requiresRankSanityForAutoMap(project) && candidate.rankScore <= 0 && candidate.slugScore < 0.85) {
      return false;
    }

    return candidate.contractMatched || candidate.nameExact || candidate.nameStrong || candidate.slugScore >= 0.85;
  }

  private buildSourceMapOperation(project: any, candidate: any): any {
    const market = candidate.market;
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
            sourceSlug: market.id,
            sourceId: market.id,
            sourceUrl: `https://www.coingecko.com/en/coins/${market.id}`,
            sourceName: market.name,
            sourceSymbol: String(market.symbol || "").toUpperCase(),
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

  private async flushOperations(operations: any[]): Promise<number> {
    let written = 0;
    for (const batch of this.chunk(operations, 1000)) {
      const result = await this.sourceMapModel.bulkWrite(batch, { ordered: false });
      written += Number(result.modifiedCount || 0) + Number(result.upsertedCount || 0);
    }
    return written;
  }

  private createSummary(dryRun: boolean, write: boolean, minConfidence: number, projectsLoaded: number): any {
    return {
      dryRun,
      write,
      minConfidence,
      projectsLoaded,
      scanned: 0,
      autoMapped: 0,
      written: 0,
      needsManualReview: 0,
      noCandidates: 0,
      symbolMismatch: 0,
      byMatchMethod: {},
    };
  }

  private toCandidateReport(project: any, candidate: any, status: string, second?: any): any {
    return {
      status,
      projectId: project._id.toString(),
      rank: project.rank,
      marketCap: project.marketCap,
      inPortfolio: Boolean(project.inPortfolio),
      slug: project.slug,
      symbol: project.symbol,
      name: project.name,
      candidate: {
        id: candidate.id,
        symbol: candidate.market?.symbol || candidate.symbol,
        name: candidate.market?.name || candidate.name,
        marketCapRank: candidate.market?.market_cap_rank ?? candidate.searchRank,
        confidence: candidate.confidence,
        reasons: candidate.reasons,
        matchMethod: candidate.matchMethod,
        contractMatched: candidate.contractMatched,
        derivativeMismatch: candidate.derivativeMismatch,
        rankScore: candidate.rankScore,
        slugScore: candidate.slugScore,
      },
      secondCandidate: second
        ? {
          id: second.id,
          symbol: second.market?.symbol || second.symbol,
          name: second.market?.name || second.name,
          confidence: second.confidence,
        }
        : undefined,
    };
  }

  private toProjectSummary(project: any, status: string): any {
    return {
      status,
      projectId: project._id.toString(),
      rank: project.rank,
      marketCap: project.marketCap,
      inPortfolio: Boolean(project.inPortfolio),
      slug: project.slug,
      symbol: project.symbol,
      name: project.name,
    };
  }

  private projectSelectFields(): string {
    return "_id rank slug symbol name marketCap source sourceId rawIcoData tokenMetrics tokenAddress contracts";
  }

  private projectQueries(project: any): string[] {
    return this.uniqueStrings([
      project.name,
      project.symbol,
      project.slug,
      project.rawIcoData?.name,
      project.rawIcoData?.title,
      project.rawIcoData?.symbol,
      project.rawIcoData?.ticker,
      project.rawIcoData?.marketData?.name,
      project.rawIcoData?.marketData?.symbol,
      project.tokenMetrics?.name,
      project.tokenMetrics?.symbol,
    ]);
  }

  private projectNames(project: any): string[] {
    return this.uniqueStrings([
      project.name,
      project.rawIcoData?.name,
      project.rawIcoData?.title,
      project.rawIcoData?.marketData?.name,
      project.tokenMetrics?.name,
    ]);
  }

  private hasContractMatch(project: any, candidate: Candidate): boolean {
    const projectContracts = this.extractContractAddresses(project);
    if (!projectContracts.size || !candidate.platforms) return false;

    const candidateContracts = Object.values(candidate.platforms)
      .map((value) => this.normalizeAddress(value))
      .filter(Boolean);

    return candidateContracts.some((address) => projectContracts.has(address));
  }

  private extractContractAddresses(source: any): Set<string> {
    const result = new Set<string>();
    const visit = (value: any, key = "") => {
      if (value === null || value === undefined) return;
      if (typeof value === "string") {
        const normalized = this.normalizeAddress(value);
        if (normalized && /address|contract|token/i.test(key)) result.add(normalized);
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
    visit(source.tokenMetrics?.contracts, "contracts");
    return result;
  }

  private importanceScore(project: any): number {
    const rank = Number(project.rank || 0);
    const marketCap = Number(project.marketCap || 0);
    let score = 0;
    if (rank > 0) score += Math.max(0, 100000 - rank);
    if (marketCap > 0) score += Math.log10(marketCap + 1) * 1000;
    if (project.inPortfolio) score += 200000;
    return score;
  }

  private rankSanityScore(projectRank: any, providerRank: any): number {
    const left = Number(projectRank || 0);
    const right = Number(providerRank || 0);
    if (!left || !right) return 0;
    const diff = Math.abs(left - right);
    if (diff <= 25) return 15;
    if (diff <= 100) return 12;
    if (diff <= 500) return 8;
    if (diff <= 1500) return 4;
    return 0;
  }

  private requiresRankSanityForAutoMap(project: any): boolean {
    const rank = Number(project.rank || 0);
    const marketCap = Number(project.marketCap || 0);
    return (rank > 0 && rank <= COINGECKO_TIERS.HOT.maxRank) || marketCap >= 100_000_000;
  }

  private hasDerivativeMismatch(project: any, candidate: Candidate, market?: CoinGeckoMarketDto): boolean {
    const projectText = this.normalizeName(
      [
        project.slug,
        project.symbol,
        ...this.projectNames(project),
      ].join(" "),
    );
    const candidateText = this.normalizeName(
      [
        candidate.id,
        candidate.symbol,
        candidate.name,
        market?.symbol,
        market?.name,
      ].join(" "),
    );
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
      if (indicator.patterns.some((pattern) => pattern.test(text))) {
        result.add(indicator.group);
      }
    }

    return result;
  }

  private preliminaryScore(project: any, candidate: Candidate): number {
    let score = 0;
    if (this.normalizeSymbol(project.symbol) === this.normalizeSymbol(candidate.symbol)) score += 35;
    const projectNames = this.projectNames(project).map((name) => this.normalizeName(name));
    if (projectNames.includes(this.normalizeName(candidate.name))) score += 30;
    score += Math.round(this.slugSimilarity(this.normalizeCoinGeckoId(project.slug), candidate.id) * 20);
    return score;
  }

  private hasStrongNameMatch(projectNames: string[], candidateName: string): boolean {
    return projectNames.some((name) => {
      if (!name || !candidateName) return false;
      return name.includes(candidateName) || candidateName.includes(name);
    });
  }

  private slugSimilarity(left: string, right: string): number {
    if (!left || !right) return 0;
    if (left === right) return 1;
    if (this.stripCoinGeckoVersionSuffix(left) === this.stripCoinGeckoVersionSuffix(right)) return 0.95;

    const leftTokens = new Set(left.split("-").filter(Boolean));
    const rightTokens = new Set(right.split("-").filter(Boolean));
    const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
    const union = new Set([...leftTokens, ...rightTokens]).size;
    return union ? intersection / union : 0;
  }

  private stripCoinGeckoVersionSuffix(value: string): string {
    return String(value || "").replace(/-\d+$/, "");
  }

  private pushMapArray<T>(map: Map<string, T[]>, key: string, value: T): void {
    if (!key) return;
    const items = map.get(key) || [];
    items.push(value);
    map.set(key, items);
  }

  private pushLimited<T>(items: T[], limit: number, value: T): void {
    if (items.length >= limit) return;
    items.push(value);
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
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  private normalizeSymbol(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase();
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
    return String(value || "")
      .trim()
      .toLowerCase();
  }
}
