import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import axios from "axios";
import { Model, Types } from "mongoose";
import { CryptoLinkingPublicService } from "src/crypto-linking/services/crypto-linking-public.service";
import { Project, ProjectDocument } from "../project.model";
import {
  collectNormalizedUrls,
  compareProjectIdentity,
  normalizeSlug,
  normalizeSymbol,
} from "./project-identity.util";
import { PendingProjectMatch, PendingProjectMatchDocument } from "./models/pending-project-match.model";
import { ProjectIntel, ProjectIntelDocument } from "./models/project-intel.model";
import {
  ProjectSourceMap,
  ProjectSourceMapDocument,
  ProjectSourceMatchMethod,
} from "./models/project-source-map.model";

export interface ProjectIntelSyncOptions {
  dryRun?: boolean;
  limit?: number;
  createMissingProjects?: boolean;
}

export interface ProjectIntelSyncSummary {
  scanned: number;
  matched: number;
  createdProjects: number;
  updatedIntel: number;
  pendingMatches: number;
  skipped: number;
  warnings: string[];
}

interface SourceMatch {
  project?: any;
  confidence: number;
  matchMethod: ProjectSourceMatchMethod;
  reasons: string[];
}

@Injectable()
export class IcodropsProjectIntelSyncService {
  private readonly logger = new Logger(IcodropsProjectIntelSyncService.name);
  private readonly apiLimit: number;
  private readonly apiTimeoutMs: number;

  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectSourceMap.name) private readonly sourceMapModel: Model<ProjectSourceMapDocument>,
    @InjectModel(ProjectIntel.name) private readonly projectIntelModel: Model<ProjectIntelDocument>,
    @InjectModel(PendingProjectMatch.name) private readonly pendingMatchModel: Model<PendingProjectMatchDocument>,
    private readonly configService: ConfigService,
    private readonly cryptoLinkingPublicService: CryptoLinkingPublicService,
  ) {
    this.apiLimit = Math.min(500, Math.max(25, Number(this.configService.get("PROJECT_INTEL_SYNC_API_LIMIT") || 100)));
    this.apiTimeoutMs = Math.max(1000, Number(this.configService.get("PROJECT_INTEL_SYNC_API_TIMEOUT_MS") || 30000));
  }

  async syncIcodropsIntel(options: ProjectIntelSyncOptions = {}): Promise<ProjectIntelSyncSummary> {
    const dryRun = options.dryRun !== false;
    const summary: ProjectIntelSyncSummary = {
      scanned: 0,
      matched: 0,
      createdProjects: 0,
      updatedIntel: 0,
      pendingMatches: 0,
      skipped: 0,
      warnings: [],
    };

    this.logger.log(`[IcodropsIntelSync] start dryRun=${dryRun}`);

    let offset = 0;
    let total = Number.MAX_SAFE_INTEGER;

    while (offset < total) {
      const page = await this.fetchIcodropsPage(offset);
      const items = Array.isArray(page.items) ? page.items : [];
      total = Number.isFinite(Number(page.total)) ? Number(page.total) : offset + items.length;

      if (!items.length) break;

      for (const sourceProject of items) {
        if (options.limit && summary.scanned >= options.limit) break;

        summary.scanned += 1;

        try {
          await this.processSourceProject(sourceProject, dryRun, options, summary);
        } catch (error: any) {
          summary.skipped += 1;
          summary.warnings.push(`${sourceProject.slug || sourceProject.name || "unknown"}: ${error.message}`);
          this.logger.warn(`[IcodropsIntelSync] project failed ${sourceProject.slug || sourceProject.name}: ${error.message}`);
        }
      }

      if (options.limit && summary.scanned >= options.limit) break;
      offset += items.length;
      if (items.length < this.apiLimit) break;
    }

    this.logger.log(
      `[IcodropsIntelSync] scanned=${summary.scanned} matched=${summary.matched} ` +
        `updatedIntel=${summary.updatedIntel} pending=${summary.pendingMatches} skipped=${summary.skipped} dryRun=${dryRun}`,
    );

    return summary;
  }

  private async processSourceProject(
    sourceProject: any,
    dryRun: boolean,
    options: ProjectIntelSyncOptions,
    summary: ProjectIntelSyncSummary,
  ): Promise<void> {
    const match = await this.findProjectMatch(sourceProject);

    if (!match.project && options.createMissingProjects) {
      if (!dryRun) {
        const created = await this.createMinimalProject(sourceProject);
        match.project = created;
      }
      summary.createdProjects += 1;
      match.confidence = 80;
      match.matchMethod = "normalized_slug";
      match.reasons = ["created missing project from ICODrops"];
    }

    if (!match.project || match.confidence < 80) {
      summary.pendingMatches += 1;
      if (!dryRun) {
        await this.upsertPendingMatch(sourceProject, match);
      }
      return;
    }

    summary.matched += 1;

    if (dryRun) {
      summary.updatedIntel += 1;
      return;
    }

    await this.upsertSourceMap(sourceProject, match);
    await this.upsertProjectIntel(sourceProject, match);
    await this.updateProjectEmptyFields(sourceProject, match.project);
    summary.updatedIntel += 1;
  }

  private async findProjectMatch(sourceProject: any): Promise<SourceMatch> {
    const sourceSlug = this.toNonEmptyString(sourceProject.slug);
    const sourceId = this.toNonEmptyString(sourceProject.sourceId || sourceProject._id);

    const cryptoLinkingMatch = await this.findCryptoLinkingMatch(sourceProject, sourceSlug, sourceId);
    if (cryptoLinkingMatch) return cryptoLinkingMatch;

    const mappedProject = await this.findMappedProject(sourceSlug, sourceId);
    if (mappedProject) {
      return {
        project: mappedProject.project,
        confidence: mappedProject.confidence,
        matchMethod: mappedProject.matchMethod,
        reasons: ["existing source map"],
      };
    }

    const legacyClauses = [
      sourceId ? { sourceId } : null,
      sourceSlug ? { sourceId: sourceSlug } : null,
      sourceProject.detailUrl ? { detailUrl: sourceProject.detailUrl } : null,
    ].filter(Boolean);
    if (legacyClauses.length) {
      const legacy = await this.projectModel
        .findOne({
          source: "icodrops",
          $or: legacyClauses,
        })
        .lean();
      if (legacy) return { project: legacy, confidence: 100, matchMethod: "legacy", reasons: ["legacy ICODrops project"] };
    }

    if (sourceSlug) {
      const exactSlug = await this.projectModel.findOne({ slug: sourceSlug }).lean();
      if (exactSlug) return { project: exactSlug, confidence: 90, matchMethod: "exact_slug", reasons: ["exact slug"] };
    }

    const candidates = await this.loadCandidates(sourceProject);
    let best: SourceMatch = { confidence: 0, matchMethod: "normalized_slug", reasons: ["no reliable identity match"] };

    for (const candidate of candidates) {
      const result = compareProjectIdentity(this.toIdentity(sourceProject), this.toIdentity(candidate));
      if (result.confidence > best.confidence) {
        best = { project: candidate, ...result };
      }
    }

    return best;
  }

  private async findCryptoLinkingMatch(
    sourceProject: any,
    sourceSlug?: string,
    sourceId?: string,
  ): Promise<SourceMatch | null> {
    const result = await this.cryptoLinkingPublicService.resolveProject({
      source: "icodrops",
      sourceId,
      sourceKey: sourceId,
      externalId: sourceProject._id,
      sourceUrl: this.toNonEmptyString(sourceProject.detailUrl || sourceProject.sourceUrl),
      coinSlug: sourceSlug,
      slug: sourceSlug,
      name: this.toNonEmptyString(sourceProject.name),
      symbol: normalizeSymbol(sourceProject.symbol || sourceProject.ticker),
      icodropsId: sourceId,
    });
    const confidence = this.toCryptoLinkingConfidence(result.confidence);

    if (!result.projectId || result.unsafe || confidence < 80) {
      return null;
    }

    const project = await this.projectModel.findById(result.projectId).lean();
    if (!project) return null;

    return {
      project,
      confidence,
      matchMethod: this.toProjectSourceMatchMethod(result.matchedBy),
      reasons: [result.reason],
    };
  }

  private async findMappedProject(sourceSlug?: string, sourceId?: string): Promise<any | null> {
    const clauses = [
      sourceSlug ? { sourceSlug } : null,
      sourceId ? { sourceId } : null,
    ].filter(Boolean);
    if (!clauses.length) return null;

    const sourceMap = await this.sourceMapModel
      .findOne({
        source: "icodrops",
        $or: clauses,
      })
      .lean();

    if (!sourceMap?.projectId) return null;

    const project = await this.projectModel.findById(sourceMap.projectId).lean();
    if (!project) return null;

    return {
      project,
      confidence: sourceMap.isVerified ? 100 : sourceMap.confidence || 80,
      matchMethod: sourceMap.matchMethod || "manual",
    };
  }

  private async loadCandidates(sourceProject: any): Promise<any[]> {
    const normalizedSymbol = normalizeSymbol(sourceProject.symbol || sourceProject.ticker);
    const normalizedSlug = normalizeSlug(sourceProject.slug || sourceProject.name);
    const name = this.toNonEmptyString(sourceProject.name);
    const websites = collectNormalizedUrls(sourceProject.links?.website, sourceProject.website);
    const clauses: any[] = [];

    if (normalizedSymbol) clauses.push({ symbol: normalizedSymbol }, { ticker: normalizedSymbol });
    if (normalizedSlug) clauses.push({ slug: normalizedSlug });
    if (name) clauses.push({ name: new RegExp(`^${this.escapeRegex(name)}$`, "i") });
    for (const website of websites) clauses.push({ website: { $in: [website, `https://${website}`, `http://${website}`] } });

    if (!clauses.length) return [];

    return this.projectModel.find({ $or: clauses }).limit(50).lean();
  }

  private async upsertSourceMap(sourceProject: any, match: SourceMatch): Promise<void> {
    const now = new Date();
    await this.sourceMapModel.updateOne(
      { projectId: match.project._id, source: "icodrops" },
      {
        $set: {
          projectId: match.project._id,
          source: "icodrops",
          sourceSlug: this.toNonEmptyString(sourceProject.slug),
          sourceId: this.toNonEmptyString(sourceProject.sourceId || sourceProject._id),
          sourceUrl: this.toNonEmptyString(sourceProject.detailUrl || sourceProject.sourceUrl),
          sourceName: this.toNonEmptyString(sourceProject.name),
          sourceSymbol: normalizeSymbol(sourceProject.symbol || sourceProject.ticker),
          sourceWebsite: this.firstSourceWebsite(sourceProject),
          sourceLinks: collectNormalizedUrls(sourceProject.links),
          matchMethod: match.matchMethod,
          confidence: match.confidence,
          isVerified: match.matchMethod === "manual" || match.confidence >= 90,
          lastSyncedAt: now,
        },
      },
      { upsert: true },
    );
  }

  private async upsertProjectIntel(sourceProject: any, match: SourceMatch): Promise<void> {
    const now = new Date();
    await this.projectIntelModel.updateOne(
      { projectId: match.project._id },
      {
        $set: {
          projectId: match.project._id,
          profile: {
            description: this.toNonEmptyString(sourceProject.fullDescription || sourceProject.shortDescription),
            categories: this.uniqueStrings(sourceProject.categories || []),
            ecosystems: this.uniqueStrings(sourceProject.ecosystems || []),
            links: sourceProject.links || {},
            socials: sourceProject.social || {},
          },
          fundraising: {
            totalRaised: this.toNumber(sourceProject.fundraising?.totalRaised),
            valuation: this.toNumber(sourceProject.fundraising?.valuation || sourceProject.tokenomics?.fdv),
            saleRounds: Array.isArray(sourceProject.saleRounds) ? sourceProject.saleRounds : [],
            investors: this.uniqueObjects([...(sourceProject.investors || []), ...((sourceProject.fundraising?.investors as any[]) || [])]),
            launchpads: this.uniqueStrings(sourceProject.launchpads || []),
          },
          tokenomics: {
            tokenAllocation: sourceProject.tokenomics?.allocation || sourceProject.rawDetailData?.tokenAllocation?.items || [],
            initialMarketCap: this.toNumber(sourceProject.tokenomics?.initialMarketCap),
            fdv: this.toNumber(sourceProject.tokenomics?.fdv || sourceProject.marketData?.fdv),
            supply: {
              totalSupply: this.toNumber(sourceProject.tokenomics?.totalSupply),
              maxSupply: this.toNumber(sourceProject.tokenomics?.maxSupply),
              circulatingSupply: this.toNumber(sourceProject.tokenomics?.circulatingSupply),
            },
            vestingFromIcodrops: sourceProject.vesting || sourceProject.tokenomics?.vestingProgress || {},
          },
          team: Array.isArray(sourceProject.team) ? sourceProject.team : [],
          marketData: sourceProject.marketData || {},
          "sourceRefs.icodrops": {
            sourceProjectId: sourceProject._id || sourceProject.sourceId || sourceProject.slug,
            slug: sourceProject.slug,
            sourceUrl: sourceProject.detailUrl || sourceProject.sourceUrl,
            lastSyncedAt: now,
          },
          "dataQuality.icodropsConfidence": match.confidence,
          "dataQuality.completeness": this.calculateCompleteness(sourceProject),
        },
        $addToSet: {
          "dataQuality.warnings": { $each: match.confidence < 90 ? [`Matched by ${match.matchMethod}`] : [] },
        },
      },
      { upsert: true },
    );
  }

  private async updateProjectEmptyFields(sourceProject: any, project: any): Promise<void> {
    const set: any = {};
    const symbol = normalizeSymbol(sourceProject.symbol || sourceProject.ticker);
    const website = this.firstSourceWebsite(sourceProject);
    const status = this.normalizeDisplayStatus(sourceProject.status);

    if (symbol && this.isEmpty(project.symbol)) set.symbol = symbol;
    if (symbol && this.isEmpty(project.ticker)) set.ticker = symbol;
    if (sourceProject.logo && this.isEmpty(project.logo)) set.logo = sourceProject.logo;
    if (website && this.isEmpty(project.website)) set.website = [website];
    if (sourceProject.links && this.isEmpty(project.links)) set.links = sourceProject.links;
    if (sourceProject.shortDescription && this.isEmpty(project.bio)) set.bio = sourceProject.shortDescription;
    if (status && status !== project.status) set.status = status;

    if (Object.keys(set).length) {
      await this.projectModel.updateOne({ _id: project._id }, { $set: set });
    }
  }

  private async upsertPendingMatch(sourceProject: any, match: SourceMatch): Promise<void> {
    await this.pendingMatchModel.updateOne(
      {
        source: "icodrops",
        sourceSlug: this.toNonEmptyString(sourceProject.slug),
        sourceId: this.toNonEmptyString(sourceProject.sourceId || sourceProject._id),
        candidateProjectId: match.project?._id,
        status: "pending",
      },
      {
        $set: {
          source: "icodrops",
          sourceSlug: this.toNonEmptyString(sourceProject.slug),
          sourceId: this.toNonEmptyString(sourceProject.sourceId || sourceProject._id),
          sourceName: this.toNonEmptyString(sourceProject.name),
          sourceSymbol: normalizeSymbol(sourceProject.symbol || sourceProject.ticker),
          sourceUrl: this.toNonEmptyString(sourceProject.detailUrl || sourceProject.sourceUrl),
          candidateProjectId: match.project?._id,
          candidateName: match.project?.name,
          candidateSymbol: match.project?.symbol || match.project?.ticker,
          candidateSlug: match.project?.slug,
          confidence: match.confidence,
          reasons: match.reasons,
          status: "pending",
        },
      },
      { upsert: true },
    );
  }

  private async createMinimalProject(sourceProject: any): Promise<any> {
    return this.projectModel.create({
      projectType: "project",
      projectStatus: "active",
      status: "active",
      name: this.toNonEmptyString(sourceProject.name) || this.toNonEmptyString(sourceProject.slug) || "Unknown Project",
      slug: normalizeSlug(sourceProject.slug || sourceProject.name),
      symbol: normalizeSymbol(sourceProject.symbol || sourceProject.ticker),
      ticker: normalizeSymbol(sourceProject.ticker || sourceProject.symbol),
      logo: this.toNonEmptyString(sourceProject.logo) || "",
      createdAt: new Date(),
      dateAdded: new Date(),
      sections: [],
      tags: [],
    });
  }

  private async fetchIcodropsPage(offset: number): Promise<any> {
    const response = await axios.get(this.getApiUrl(), {
      params: { limit: this.apiLimit, offset, sort: "-lastParsedAt" },
      timeout: this.apiTimeoutMs,
    });
    return response.data || {};
  }

  private getApiUrl(): string {
    const explicit = this.configService.get<string>("PROJECT_INTEL_ICODROPS_API_URL") || this.configService.get<string>("PROJECTS_INTEL_ICO_API_URL");
    if (explicit) return explicit;

    const baseUrl = this.configService.get<string>("INTEL_API_BASE_URL");
    if (baseUrl) return `${baseUrl.replace(/\/+$/, "")}/ico-projects`;

    return "http://localhost:8001/api/ico-projects";
  }

  private toIdentity(project: any): any {
    return {
      slug: project.slug,
      name: project.name,
      symbol: project.symbol || project.ticker,
      website: project.website || project.links?.website,
      links: project.links,
      contracts: project.contracts,
    };
  }

  private firstSourceWebsite(sourceProject: any): string {
    return collectNormalizedUrls(sourceProject.links?.website, sourceProject.website)[0] || "";
  }

  private toNonEmptyString(value: any): string {
    const text = String(value || "").trim();
    return text ? text : "";
  }

  private toNumber(value: any): number | undefined {
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  private uniqueStrings(value: any): string[] {
    const list = Array.isArray(value) ? value : value ? [value] : [];
    return Array.from(new Set(list.map((item) => String(item || "").trim()).filter(Boolean)));
  }

  private uniqueObjects(value: any[]): any[] {
    const seen = new Set<string>();
    return (Array.isArray(value) ? value : []).filter((item) => {
      const key = `${item?.name || ""}|${item?.url || ""}|${item?.stage || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private isEmpty(value: any): boolean {
    if (value === null || value === undefined || value === "") return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "object") return Object.keys(value).length === 0;
    return false;
  }

  private calculateCompleteness(sourceProject: any): number {
    const checks = [
      sourceProject.name,
      sourceProject.symbol || sourceProject.ticker,
      sourceProject.shortDescription || sourceProject.fullDescription,
      sourceProject.links,
      sourceProject.fundraising?.totalRaised,
      sourceProject.saleRounds?.length,
      sourceProject.tokenomics?.allocation?.length,
      sourceProject.investors?.length,
      sourceProject.team?.length,
      sourceProject.marketData,
    ];
    const filled = checks.filter((item) => !this.isEmpty(item)).length;
    return Math.round((filled / checks.length) * 100);
  }

  private normalizeDisplayStatus(status?: string): string {
    const normalized = this.toNonEmptyString(status)?.toLowerCase();

    if (normalized === "active") return "Active";
    if (normalized === "upcoming") return "Upcoming";
    if (normalized === "ended") return "Ended";

    return "";
  }

  private toCryptoLinkingConfidence(confidence: string): number {
    if (confidence === "exact") return 100;
    if (confidence === "high") return 90;
    if (confidence === "medium") return 70;
    if (confidence === "low") return 40;
    return 0;
  }

  private toProjectSourceMatchMethod(matchedBy: string): ProjectSourceMatchMethod {
    if (matchedBy.includes("source")) return "legacy";
    if (matchedBy.includes("slug")) return "exact_slug";
    if (matchedBy.includes("name+symbol")) return "name_symbol";
    if (matchedBy.includes("website")) return "website";
    if (matchedBy.includes("contract")) return "contract";
    return "normalized_slug";
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
