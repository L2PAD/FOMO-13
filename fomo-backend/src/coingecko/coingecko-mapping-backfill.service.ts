import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { Project, ProjectDocument } from "src/projects/project.model";
import {
  ProjectSourceMap,
  ProjectSourceMapDocument,
  ProjectSourceMatchMethod,
} from "src/projects/intel-sync/models/project-source-map.model";
import { CoinGeckoMarketDto } from "./coingecko-market.types";
import { CoinGeckoProClientService } from "./coingecko-pro-client.service";

interface MappingBackfillOptions {
  dryRun?: boolean;
  write?: boolean;
  limit?: number;
  offset?: number;
  minConfidence?: number;
  topSkippedLimit?: number;
  refreshExisting?: boolean;
}

interface MappingCandidate {
  project: any;
  coingeckoId: string;
  candidateSource: "rawIcoData" | "tokenMetrics" | "safe_slug";
}

@Injectable()
export class CoinGeckoMappingBackfillService {
  private readonly logger = new Logger(CoinGeckoMappingBackfillService.name);
  private readonly defaultBatchDelayMs = Number(process.env.COINGECKO_MAPPING_BACKFILL_BATCH_DELAY_MS || 150);

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectSourceMap.name)
    private readonly sourceMapModel: Model<ProjectSourceMapDocument>,
    private readonly coinGeckoClient: CoinGeckoProClientService,
  ) {}

  async backfillProjectSourceMaps(options: MappingBackfillOptions = {}): Promise<any> {
    const dryRun = options.write === true ? false : options.dryRun !== false;
    const write = options.write === true && !dryRun;
    const minConfidence = this.clampNumber(options.minConfidence, 90, 0, 100);
    const topSkippedLimit = this.clampNumber(options.topSkippedLimit, 100, 0, 1000);
    const startedAt = new Date();

    if (!this.coinGeckoClient.isConfigured()) {
      throw new Error("COINGECKO_KEY is not configured");
    }

    const projects = await this.loadProjects(options);
    const existingMapsByProjectId = await this.loadExistingMaps(projects);
    const candidateCountsById = this.countCandidateIds(projects);
    const summary = this.createSummary(dryRun, write, minConfidence, projects.length);
    const operations: any[] = [];
    const topSkipped: any[] = [];
    const sampleWrites: any[] = [];

    const candidates = projects
      .filter((project) => {
        const existingMap = existingMapsByProjectId.get(project._id.toString());
        return options.refreshExisting || !existingMap?.isVerified;
      })
      .map((project) => this.resolveCandidate(project))
      .filter((candidate): candidate is MappingCandidate => Boolean(candidate));
    const uniqueIds = this.uniqueIds(
      candidates
        .filter((candidate) => candidateCountsById.get(candidate.coingeckoId) === 1)
        .map((candidate) => candidate.coingeckoId),
    );

    const marketsById = await this.fetchMarkets(uniqueIds, summary);

    for (const project of projects) {
      summary.scanned += 1;

      const projectId = project._id.toString();
      const existingMap = existingMapsByProjectId.get(projectId);
      if (existingMap?.isVerified && !options.refreshExisting) {
        summary.existingVerified += 1;
        continue;
      }

      const candidate = this.resolveCandidate(project);
      if (!candidate) {
        summary.skippedUnresolved += 1;
        this.pushSkipped(topSkipped, topSkippedLimit, project, "unresolved");
        continue;
      }

      if ((candidateCountsById.get(candidate.coingeckoId) || 0) > 1) {
        summary.skippedDuplicateCandidateId += 1;
        this.pushSkipped(topSkipped, topSkippedLimit, project, "duplicate_candidate_id", candidate.coingeckoId);
        continue;
      }

      const market = marketsById.get(candidate.coingeckoId);
      if (!market) {
        summary.missingFromProvider += 1;
        this.pushSkipped(topSkipped, topSkippedLimit, project, "missing_from_provider", candidate.coingeckoId);
        continue;
      }

      const match = this.buildMatch(project, candidate, market);
      summary.byCandidateSource[candidate.candidateSource] += 1;

      if (!match.symbolCompatible) {
        summary.symbolMismatch += 1;
        this.pushSkipped(topSkipped, topSkippedLimit, project, "symbol_mismatch", candidate.coingeckoId, {
          projectSymbol: project.symbol,
          providerSymbol: market.symbol,
        });
        continue;
      }

      if (match.confidence < minConfidence) {
        summary.belowConfidence += 1;
        this.pushSkipped(topSkipped, topSkippedLimit, project, "below_confidence", candidate.coingeckoId, {
          confidence: match.confidence,
        });
        continue;
      }

      summary.highConfidence += 1;
      summary.byMatchMethod[match.matchMethod] = (summary.byMatchMethod[match.matchMethod] || 0) + 1;

      const operation = this.buildSourceMapOperation(project, candidate, market, match);
      operations.push(operation);
      if (sampleWrites.length < 25) sampleWrites.push(this.toSampleWrite(project, candidate, market, match));
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
      topSkipped,
      sampleWrites,
    };

    this.logger.log(
      JSON.stringify({
        event: "coingecko_mapping_backfill_finished",
        mode: report.mode,
        scanned: summary.scanned,
        highConfidence: summary.highConfidence,
        written: summary.written,
        missingFromProvider: summary.missingFromProvider,
        symbolMismatch: summary.symbolMismatch,
        durationMs: report.durationMs,
      }),
    );

    return report;
  }

  private async loadProjects(options: MappingBackfillOptions): Promise<any[]> {
    const query = this.projectModel
      .find({ rank: { $ne: null } })
      .sort({ rank: 1 })
      .select("_id rank slug symbol name rawIcoData tokenMetrics")
      .lean();

    if (options.offset) query.skip(Math.max(0, Math.trunc(options.offset)));
    if (options.limit) query.limit(Math.max(0, Math.trunc(options.limit)));

    return query;
  }

  private async loadExistingMaps(projects: any[]): Promise<Map<string, any>> {
    const projectIds = projects.map((project) => project._id);
    if (!projectIds.length) return new Map();

    const maps = await this.sourceMapModel
      .find({ source: "coingecko", projectId: { $in: projectIds } })
      .sort({ isVerified: -1, confidence: -1, updatedAt: -1 })
      .lean();

    const result = new Map<string, any>();
    for (const sourceMap of maps as any[]) {
      const projectId = sourceMap.projectId?.toString();
      if (!projectId || result.has(projectId)) continue;
      result.set(projectId, sourceMap);
    }
    return result;
  }

  private countCandidateIds(projects: any[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const project of projects) {
      const candidate = this.resolveCandidate(project);
      if (!candidate) continue;
      counts.set(candidate.coingeckoId, (counts.get(candidate.coingeckoId) || 0) + 1);
    }
    return counts;
  }

  private resolveCandidate(project: any): MappingCandidate | null {
    const rawIcoDataId = this.normalizeCoinGeckoId(
      project.rawIcoData?.coingeckoId || project.rawIcoData?.marketData?.coingeckoId,
    );
    if (rawIcoDataId) {
      return { project, coingeckoId: rawIcoDataId, candidateSource: "rawIcoData" };
    }

    const tokenMetricsId = this.normalizeCoinGeckoId(project.tokenMetrics?.coingeckoId);
    if (tokenMetricsId) {
      return { project, coingeckoId: tokenMetricsId, candidateSource: "tokenMetrics" };
    }

    const safeSlug = this.normalizeCoinGeckoId(project.slug);
    if (safeSlug && /^[a-z0-9][a-z0-9-]{1,120}$/.test(safeSlug)) {
      return { project, coingeckoId: safeSlug, candidateSource: "safe_slug" };
    }

    return null;
  }

  private async fetchMarkets(ids: string[], summary: any): Promise<Map<string, CoinGeckoMarketDto>> {
    const marketsById = new Map<string, CoinGeckoMarketDto>();

    for (const batch of this.chunk(ids, this.coinGeckoClient.getMaxBatchSize())) {
      try {
        const markets = await this.coinGeckoClient.fetchMarketsBatch(batch);
        summary.providerRequests += 1;
        for (const market of markets) {
          const id = this.normalizeCoinGeckoId(market.id);
          if (id) marketsById.set(id, market);
        }
      } catch (error) {
        summary.failedBatches += 1;
        this.logger.warn(`CoinGecko mapping backfill batch failed ids=${batch.length} error=${error?.message || error}`);
      }

      if (this.defaultBatchDelayMs > 0) {
        await this.sleep(this.defaultBatchDelayMs);
      }
    }

    summary.providerIdsRequested = ids.length;
    summary.providerIdsReturned = marketsById.size;
    return marketsById;
  }

  private buildMatch(project: any, candidate: MappingCandidate, market: CoinGeckoMarketDto): any {
    const projectSymbol = this.normalizeSymbol(project.symbol);
    const marketSymbol = this.normalizeSymbol(market.symbol);
    const projectName = this.normalizeName(project.name);
    const marketName = this.normalizeName(market.name);
    const symbolCompatible = !projectSymbol || !marketSymbol || projectSymbol === marketSymbol;
    const nameCompatible = Boolean(projectName && marketName && projectName === marketName);

    if (candidate.candidateSource === "rawIcoData") {
      return {
        confidence: symbolCompatible ? 98 : 50,
        matchMethod: "legacy" as ProjectSourceMatchMethod,
        symbolCompatible,
        nameCompatible,
      };
    }

    if (candidate.candidateSource === "tokenMetrics") {
      return {
        confidence: symbolCompatible ? 96 : 50,
        matchMethod: "legacy" as ProjectSourceMatchMethod,
        symbolCompatible,
        nameCompatible,
      };
    }

    return {
      confidence: symbolCompatible && nameCompatible ? 95 : symbolCompatible ? 90 : 40,
      matchMethod: "exact_slug" as ProjectSourceMatchMethod,
      symbolCompatible,
      nameCompatible,
    };
  }

  private buildSourceMapOperation(
    project: any,
    candidate: MappingCandidate,
    market: CoinGeckoMarketDto,
    match: any,
  ): any {
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
            matchMethod: match.matchMethod,
            confidence: match.confidence,
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
      existingVerified: 0,
      highConfidence: 0,
      written: 0,
      skippedUnresolved: 0,
      skippedDuplicateCandidateId: 0,
      missingFromProvider: 0,
      symbolMismatch: 0,
      belowConfidence: 0,
      providerRequests: 0,
      providerIdsRequested: 0,
      providerIdsReturned: 0,
      failedBatches: 0,
      byCandidateSource: {
        rawIcoData: 0,
        tokenMetrics: 0,
        safe_slug: 0,
      },
      byMatchMethod: {},
    };
  }

  private toSampleWrite(project: any, candidate: MappingCandidate, market: CoinGeckoMarketDto, match: any): any {
    return {
      projectId: project._id.toString(),
      rank: project.rank,
      slug: project.slug,
      symbol: project.symbol,
      name: project.name,
      coingeckoId: market.id,
      providerSymbol: market.symbol,
      providerName: market.name,
      candidateSource: candidate.candidateSource,
      matchMethod: match.matchMethod,
      confidence: match.confidence,
    };
  }

  private pushSkipped(
    topSkipped: any[],
    limit: number,
    project: any,
    reason: string,
    coingeckoId?: string,
    extra: Record<string, any> = {},
  ): void {
    if (topSkipped.length >= limit) return;
    topSkipped.push({
      projectId: project._id.toString(),
      rank: project.rank,
      slug: project.slug,
      symbol: project.symbol,
      name: project.name,
      coingeckoId,
      reason,
      ...extra,
    });
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

  private chunk<T>(items: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  }

  private clampNumber(value: any, fallback: number, min: number, max: number): number {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) return fallback;
    return Math.max(min, Math.min(max, Math.trunc(numberValue)));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
}
