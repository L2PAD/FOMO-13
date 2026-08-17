import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import axios from "axios";
import { Model } from "mongoose";
import { CryptoLinkingPublicService } from "src/crypto-linking/services/crypto-linking-public.service";
import { Project, ProjectDocument } from "../project.model";
import { compareProjectIdentity, normalizeSlug, normalizeSymbol } from "./project-identity.util";
import { PendingProjectMatch, PendingProjectMatchDocument } from "./models/pending-project-match.model";
import { ProjectIntel, ProjectIntelDocument } from "./models/project-intel.model";
import { ProjectUnlocks, ProjectUnlocksDocument } from "./models/project-unlocks.model";
import {
  ProjectSourceMap,
  ProjectSourceMapDocument,
  ProjectSourceMatchMethod,
} from "./models/project-source-map.model";
import { ProjectIntelSyncOptions, ProjectIntelSyncSummary } from "./icodrops-project-intel-sync.service";

interface SourceMatch {
  project?: any;
  confidence: number;
  matchMethod: ProjectSourceMatchMethod;
  reasons: string[];
}

interface DropstabBulkOperations {
  sourceMaps: any[];
  projectUnlocks: any[];
  projectIntel: any[];
  pendingMatches: any[];
}

@Injectable()
export class DropstabProjectUnlocksSyncService implements OnModuleInit {
  private readonly logger = new Logger(DropstabProjectUnlocksSyncService.name);
  private readonly apiLimit: number;
  private readonly apiTimeoutMs: number;
  private readonly bulkWriteSize: number;

  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectSourceMap.name) private readonly sourceMapModel: Model<ProjectSourceMapDocument>,
    @InjectModel(ProjectIntel.name) private readonly projectIntelModel: Model<ProjectIntelDocument>,
    @InjectModel(ProjectUnlocks.name) private readonly projectUnlocksModel: Model<ProjectUnlocksDocument>,
    @InjectModel(PendingProjectMatch.name) private readonly pendingMatchModel: Model<PendingProjectMatchDocument>,
    private readonly configService: ConfigService,
    private readonly cryptoLinkingPublicService: CryptoLinkingPublicService,
  ) {
    this.apiLimit = Math.min(200, Math.max(10, Number(this.configService.get("PROJECT_INTEL_DROPSTAB_API_LIMIT") || 100)));
    this.apiTimeoutMs = Math.max(1000, Number(this.configService.get("PROJECT_INTEL_DROPSTAB_API_TIMEOUT_MS") || 30000));
    this.bulkWriteSize = Math.min(1000, Math.max(1, Number(this.configService.get("PROJECT_INTEL_DROPSTAB_BULK_WRITE_SIZE") || 100)));
  }

  onModuleInit(): void {
    if (!this.isStartupSyncEnabled()) {
      this.logger.log("[DropstabUnlocksSync] startup sync is disabled");
      return;
    }

    const delayMs = this.getNumber("PROJECT_INTEL_DROPSTAB_STARTUP_DELAY_MS", 5000, 0, 600000);
    const dryRun = this.getBoolean("PROJECT_INTEL_DROPSTAB_STARTUP_DRY_RUN", false);
    const limit = this.getOptionalNumber("PROJECT_INTEL_DROPSTAB_STARTUP_LIMIT", 1, 100000);

    setTimeout(() => {
      void this.syncDropstabUnlocks({ dryRun, limit }).catch((error: any) => {
        this.logger.error(`[DropstabUnlocksSync] startup sync failed: ${error.message}`, error.stack);
      });
    }, delayMs);
  }

  async syncDropstabUnlocks(options: ProjectIntelSyncOptions = {}): Promise<ProjectIntelSyncSummary> {
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

    this.logger.log(`[DropstabUnlocksSync] start dryRun=${dryRun} bulkWriteSize=${this.bulkWriteSize}`);

    let offset = 0;
    let total = Number.MAX_SAFE_INTEGER;
    const bulk = this.createBulkOperations();

    while (offset < total) {
      const page = await this.fetchDropstabPage(offset);
      const items = Array.isArray(page.items) ? page.items : [];
      total = Number.isFinite(Number(page.total)) ? Number(page.total) : offset + items.length;

      if (!items.length) break;

      for (const sourceProject of items) {
        if (options.limit && summary.scanned >= options.limit) break;
        summary.scanned += 1;

        try {
          await this.processDropstabProject(sourceProject, dryRun, summary, bulk);
          if (this.totalBulkOperations(bulk) >= this.bulkWriteSize) {
            await this.flushBulkOperations(bulk);
          }
        } catch (error: any) {
          summary.skipped += 1;
          summary.warnings.push(`${sourceProject.coinSlug || sourceProject.coinName || "unknown"}: ${error.message}`);
          this.logger.warn(`[DropstabUnlocksSync] project failed ${sourceProject.coinSlug || sourceProject.coinName}: ${error.message}`);
        }
      }

      if (options.limit && summary.scanned >= options.limit) break;
      offset += items.length;
      if (items.length < this.apiLimit) break;
    }

    await this.flushBulkOperations(bulk);

    this.logger.log(
      `[DropstabUnlocksSync] scanned=${summary.scanned} matched=${summary.matched} ` +
        `updated=${summary.updatedIntel} pending=${summary.pendingMatches} skipped=${summary.skipped} dryRun=${dryRun}`,
    );

    return summary;
  }

  private async processDropstabProject(
    sourceProject: any,
    dryRun: boolean,
    summary: ProjectIntelSyncSummary,
    bulk: DropstabBulkOperations,
  ): Promise<void> {
    const match = await this.findProjectMatch(sourceProject);

    if (!match.project || match.confidence < 80) {
      summary.pendingMatches += 1;
      if (!dryRun) bulk.pendingMatches.push(this.buildPendingMatchOperation(sourceProject, match));
      return;
    }

    summary.matched += 1;

    if (dryRun) {
      summary.updatedIntel += 1;
      return;
    }

    bulk.sourceMaps.push(this.buildSourceMapOperation(sourceProject, match));
    bulk.projectUnlocks.push(this.buildProjectUnlocksOperation(sourceProject, match));
    bulk.projectIntel.push(this.buildProjectIntelOperation(sourceProject, match));
    summary.updatedIntel += 1;
  }

  private async findProjectMatch(sourceProject: any): Promise<SourceMatch> {
    const sourceSlug = this.toNonEmptyString(sourceProject.coinSlug);
    const sourceId = this.toNonEmptyString(sourceProject._id);

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

    const icodropsMappedProject = await this.findIcodropsMappedProject(sourceProject);
    if (icodropsMappedProject) {
      return {
        project: icodropsMappedProject.project,
        confidence: icodropsMappedProject.confidence,
        matchMethod: icodropsMappedProject.matchMethod,
        reasons: icodropsMappedProject.reasons,
      };
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
      source: "dropstab",
      sourceId,
      sourceKey: sourceId,
      externalId: sourceProject._id,
      sourceUrl: this.resolveDropstabSourceUrl(sourceProject),
      coinSlug: sourceSlug,
      slug: sourceSlug,
      name: this.toNonEmptyString(sourceProject.coinName),
      symbol: normalizeSymbol(sourceProject.coinSymbol),
      dropstabId: sourceId,
      icodropsId: this.toNonEmptyString(sourceProject.icoProjectId),
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
        source: "dropstab",
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

  private async findIcodropsMappedProject(sourceProject: any): Promise<any | null> {
    const icoSlug = this.toNonEmptyString(sourceProject.icoSlug);
    const icoProjectId = this.toNonEmptyString(sourceProject.icoProjectId);
    const clauses = [
      icoSlug ? { sourceSlug: icoSlug } : null,
      icoSlug ? { sourceId: icoSlug } : null,
      icoProjectId ? { sourceId: icoProjectId } : null,
    ].filter(Boolean);
    if (!clauses.length) return null;

    const sourceMap = await this.sourceMapModel
      .findOne({
        source: "icodrops",
        $or: clauses,
      })
      .sort({ isVerified: -1, confidence: -1, updatedAt: -1 })
      .lean();

    if (!sourceMap?.projectId) return null;

    const project = await this.projectModel.findById(sourceMap.projectId).lean();
    if (!project) return null;

    return {
      project,
      confidence: sourceMap.isVerified ? 100 : Math.max(80, sourceMap.confidence || 80),
      matchMethod: sourceMap.matchMethod || "legacy",
      reasons: ["linked through ICODrops source map"],
    };
  }

  private async loadCandidates(sourceProject: any): Promise<any[]> {
    const normalizedSymbol = normalizeSymbol(sourceProject.coinSymbol);
    const normalizedSlug = normalizeSlug(sourceProject.coinSlug || sourceProject.coinName);
    const name = this.toNonEmptyString(sourceProject.coinName);
    const clauses: any[] = [];

    if (normalizedSymbol) clauses.push({ symbol: normalizedSymbol }, { ticker: normalizedSymbol });
    if (normalizedSlug) clauses.push({ slug: normalizedSlug });
    if (name) clauses.push({ name: new RegExp(`^${this.escapeRegex(name)}$`, "i") });

    if (!clauses.length) return [];

    return this.projectModel.find({ $or: clauses }).limit(50).lean();
  }

  private buildSourceMapOperation(sourceProject: any, match: SourceMatch): any {
    const now = new Date();
    return {
      updateOne: {
        filter: { projectId: match.project._id, source: "dropstab" },
        update: {
          $set: {
            projectId: match.project._id,
            source: "dropstab",
            sourceSlug: this.toNonEmptyString(sourceProject.coinSlug),
            sourceId: this.toNonEmptyString(sourceProject._id),
            sourceUrl: this.resolveDropstabSourceUrl(sourceProject),
            sourceName: this.toNonEmptyString(sourceProject.coinName),
            sourceSymbol: normalizeSymbol(sourceProject.coinSymbol),
            sourceLinks: this.normalizeSourceLinks(sourceProject).map((item: any) => item.url),
            matchMethod: match.matchMethod,
            confidence: match.confidence,
            isVerified: match.matchMethod === "manual" || match.confidence >= 90,
            lastSyncedAt: now,
          },
        },
        upsert: true,
      },
    };
  }

  private buildProjectUnlocksOperation(sourceProject: any, match: SourceMatch): any {
    const now = new Date();
    return {
      updateOne: {
        filter: { projectId: match.project._id, source: "dropstab" },
        update: {
          $set: {
            projectId: match.project._id,
            source: "dropstab",
            tokenAllocation: sourceProject.tokenAllocation || [],
            vestingSummary: sourceProject.vestingSummary || {},
            vestingSchedule: sourceProject.vestingSchedule || [],
            vestingRounds: sourceProject.vestingRounds || [],
            vestingTimeline: sourceProject.vestingTimeline || [],
            unlockingEvents: sourceProject.unlockingEvents || [],
            nextUnlockingEvent: sourceProject.nextUnlockingEvent || null,
            publicVesting: sourceProject.publicVesting || null,
            sourceLinks: sourceProject.sourceLinks || [],
            dataQuality: sourceProject.dataQuality || {},
            sourceRefs: {
              dropstab: {
                sourceProjectId: sourceProject._id,
                slug: sourceProject.coinSlug,
                sourceUrl: this.resolveDropstabSourceUrl(sourceProject),
                icoProjectId: sourceProject.icoProjectId,
                icoSlug: sourceProject.icoSlug,
                icoName: sourceProject.icoName,
                icoSymbol: sourceProject.icoSymbol,
                lastSyncedAt: now,
              },
            },
          },
        },
        upsert: true,
      },
    };
  }

  private buildProjectIntelOperation(sourceProject: any, match: SourceMatch): any {
    const now = new Date();
    const about = this.normalizeDropstabAbout(sourceProject.about);
    const description = this.normalizeDropstabDescription(sourceProject.description, about);
    const fundraisingRounds = this.normalizeDropstabFundraisingRounds(sourceProject.fundraisingRounds);
    const fundraising = this.normalizeDropstabFundraising(sourceProject.fundraising, fundraisingRounds);
    const sourceLinks = this.normalizeSourceLinks(sourceProject);
    const dataQuality = this.compactObject(sourceProject.dataQuality || {});
    const sourceRef = this.compactObject({
      sourceProjectId: sourceProject._id,
      slug: sourceProject.coinSlug,
      sourceUrl: this.resolveDropstabSourceUrl(sourceProject),
      icoProjectId: sourceProject.icoProjectId,
      icoSlug: sourceProject.icoSlug,
      icoName: sourceProject.icoName,
      icoSymbol: sourceProject.icoSymbol,
      lastSyncedAt: now,
    }) || { lastSyncedAt: now };
    const dropstabIntel = this.compactObject({
      about,
      description,
      fundraising,
      fundraisingRounds: fundraisingRounds.length ? fundraisingRounds : undefined,
      sourceLinks,
      parsedAt: this.toDateOrUndefined(sourceProject.parsedAt),
      dataQuality,
      sourceRef,
    });
    const set: any = {
      projectId: match.project._id,
      dropstab: dropstabIntel,
      "sourceRefs.dropstab": sourceRef,
      "dataQuality.dropstabConfidence": match.confidence,
      "dataQuality.dropstabBlocks": {
        hasAbout: Boolean(about),
        hasDescription: Boolean(description),
        hasFundraising: Boolean(fundraising),
        hasFundraisingRounds: fundraisingRounds.length > 0,
      },
    };

    if (about) {
      set.about = about;
      set["profile.dropstabAbout"] = about;
      if (about.categories?.length) set["profile.dropstabCategories"] = about.categories;
      if (about.tags?.length) set["profile.dropstabTags"] = about.tags;
      const links = this.compactObject({
        website: about.website,
        whitepaper: about.whitepaper,
        docs: about.docs,
      });
      if (links) set["profile.dropstabLinks"] = links;
      if (about.socials) set["profile.dropstabSocials"] = about.socials;
    }

    if (description) {
      set.description = description;
      set["profile.dropstabDescription"] = description;
    }

    if (fundraising) {
      set["fundraising.dropstab"] = fundraising;
      if (fundraising.totalRaised !== undefined) set["fundraising.dropstabTotalRaised"] = fundraising.totalRaised;
      if (fundraising.valuation !== undefined) set["fundraising.dropstabValuation"] = fundraising.valuation;
      if (fundraising.investors?.length) set["fundraising.dropstabInvestors"] = fundraising.investors;
      if (fundraising.leadInvestors?.length) set["fundraising.dropstabLeadInvestors"] = fundraising.leadInvestors;
    }

    if (fundraisingRounds.length) {
      set["fundraising.fundraisingRounds"] = fundraisingRounds;
      set["fundraising.dropstabRounds"] = fundraisingRounds;
      set["fundraising.dropstabRoundsCount"] = fundraisingRounds.length;
    }

    return {
      updateOne: {
        filter: { projectId: match.project._id },
        update: {
          $set: set,
          $addToSet: {
            "dataQuality.warnings": {
              $each: (sourceProject.dataQuality?.warnings || []).slice(0, 10),
            },
          },
        },
        upsert: true,
      },
    };
  }

  private buildPendingMatchOperation(sourceProject: any, match: SourceMatch): any {
    return {
      updateOne: {
        filter: {
          source: "dropstab",
          sourceSlug: this.toNonEmptyString(sourceProject.coinSlug),
          sourceId: this.toNonEmptyString(sourceProject._id),
          candidateProjectId: match.project?._id,
          status: "pending",
        },
        update: {
          $set: {
            source: "dropstab",
            sourceSlug: this.toNonEmptyString(sourceProject.coinSlug),
            sourceId: this.toNonEmptyString(sourceProject._id),
            sourceName: this.toNonEmptyString(sourceProject.coinName),
            sourceSymbol: normalizeSymbol(sourceProject.coinSymbol),
            sourceUrl: this.toNonEmptyString(sourceProject.sourceUrl),
            candidateProjectId: match.project?._id,
            candidateName: match.project?.name,
            candidateSymbol: match.project?.symbol || match.project?.ticker,
            candidateSlug: match.project?.slug,
            confidence: match.confidence,
            reasons: match.reasons,
            status: "pending",
          },
        },
        upsert: true,
      },
    };
  }

  private createBulkOperations(): DropstabBulkOperations {
    return {
      sourceMaps: [],
      projectUnlocks: [],
      projectIntel: [],
      pendingMatches: [],
    };
  }

  private totalBulkOperations(bulk: DropstabBulkOperations): number {
    return bulk.sourceMaps.length + bulk.projectUnlocks.length + bulk.projectIntel.length + bulk.pendingMatches.length;
  }

  private async flushBulkOperations(bulk: DropstabBulkOperations): Promise<void> {
    if (!this.totalBulkOperations(bulk)) return;

    const [sourceMaps, projectUnlocks, projectIntel, pendingMatches] = [
      bulk.sourceMaps.splice(0),
      bulk.projectUnlocks.splice(0),
      bulk.projectIntel.splice(0),
      bulk.pendingMatches.splice(0),
    ];

    try {
      await Promise.all([
        sourceMaps.length
          ? this.sourceMapModel.bulkWrite(sourceMaps, { ordered: false })
          : Promise.resolve(),
        projectUnlocks.length
          ? this.projectUnlocksModel.bulkWrite(projectUnlocks, { ordered: false })
          : Promise.resolve(),
        projectIntel.length
          ? this.projectIntelModel.bulkWrite(projectIntel, { ordered: false })
          : Promise.resolve(),
        pendingMatches.length
          ? this.pendingMatchModel.bulkWrite(pendingMatches, { ordered: false })
          : Promise.resolve(),
      ]);
    } catch (error) {
      bulk.sourceMaps.unshift(...sourceMaps);
      bulk.projectUnlocks.unshift(...projectUnlocks);
      bulk.projectIntel.unshift(...projectIntel);
      bulk.pendingMatches.unshift(...pendingMatches);
      throw error;
    }
  }

  private async fetchDropstabPage(offset: number): Promise<any> {
    const response = await axios.get(this.getApiUrl(), {
      params: { limit: this.apiLimit, offset },
      timeout: this.apiTimeoutMs,
    });
    return response.data || {};
  }

  private getApiUrl(): string {
    const explicit = this.configService.get<string>("PROJECT_INTEL_DROPSTAB_API_URL");
    if (explicit) return explicit;

    const baseUrl = this.configService.get<string>("INTEL_API_BASE_URL");
    if (baseUrl) return `${baseUrl.replace(/\/+$/, "")}/dropstab-projects`;

    return "http://localhost:8001/api/dropstab-projects";
  }

  private isStartupSyncEnabled(): boolean {
    return this.getBoolean("PROJECT_INTEL_DROPSTAB_SYNC_ON_STARTUP", false);
  }

  private getBoolean(key: string, fallback: boolean): boolean {
    const value = this.configService.get<string>(key);
    if (value === undefined || value === null || value === "") return fallback;
    const normalized = String(value).trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
    return fallback;
  }

  private getNumber(key: string, fallback: number, min: number, max: number): number {
    const parsed = Number(this.configService.get(key));
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(min, Math.min(max, Math.trunc(parsed)));
  }

  private getOptionalNumber(key: string, min: number, max: number): number | undefined {
    const value = this.configService.get(key);
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return undefined;
    return Math.max(min, Math.min(max, Math.trunc(parsed)));
  }

  private toIdentity(project: any): any {
    return {
      slug: project.coinSlug || project.slug,
      name: project.coinName || project.name,
      symbol: project.coinSymbol || project.symbol || project.ticker,
      website: project.website,
      links: project.links,
      contracts: project.contracts,
    };
  }

  private toNonEmptyString(value: any): string {
    const text = String(value || "").trim();
    return text ? text : "";
  }

  private normalizeDropstabAbout(value: any): any | undefined {
    if (!value || typeof value !== "object") return undefined;

    return this.compactObject({
      title: this.toOptionalString(value.title),
      text: this.toOptionalString(value.text),
      paragraphs: this.uniqueStrings(value.paragraphs),
      categories: this.uniqueStrings(value.categories),
      tags: this.uniqueStrings(value.tags),
      website: this.toOptionalString(value.website),
      whitepaper: this.toOptionalString(value.whitepaper),
      docs: this.toOptionalString(value.docs),
      socials: this.compactObject(value.socials || {}),
      sourceUrl: this.toOptionalString(value.sourceUrl),
      parsedAt: this.toDateOrUndefined(value.parsedAt),
    });
  }

  private normalizeDropstabDescription(value: any, about?: any): any | undefined {
    const source = value && typeof value === "object" ? value : {};
    const paragraphs = this.uniqueStrings(source.paragraphs);
    const full = this.toOptionalString(source.full) || this.toOptionalString(about?.text);

    return this.compactObject({
      short: this.toOptionalString(source.short),
      full,
      paragraphs: paragraphs.length ? paragraphs : this.uniqueStrings(about?.paragraphs),
      sourceUrl: this.toOptionalString(source.sourceUrl || about?.sourceUrl),
      parsedAt: this.toDateOrUndefined(source.parsedAt || about?.parsedAt),
    });
  }

  private normalizeDropstabFundraising(value: any, rounds: any[]): any | undefined {
    const source = value && typeof value === "object" ? value : {};
    const investors = this.uniqueStrings([
      ...(source.investors || []),
      ...rounds.flatMap((round) => round.investors || []),
    ]);
    const leadInvestors = this.uniqueStrings([
      ...(source.leadInvestors || []),
      ...rounds.flatMap((round) => round.leadInvestors || []),
    ]);
    const totalRaised = this.toNumber(source.totalRaised) ?? this.sumNumbers(rounds.map((round) => round.amount));
    const valuation = this.toNumber(source.valuation);

    return this.compactObject({
      totalRaised,
      totalRaisedFormatted: this.toOptionalString(source.totalRaisedFormatted),
      valuation,
      valuationFormatted: this.toOptionalString(source.valuationFormatted),
      investorsCount: this.toNumber(source.investorsCount) ?? (investors.length || undefined),
      roundsCount: this.toNumber(source.roundsCount) ?? (rounds.length || undefined),
      leadInvestors,
      investors,
      sourceUrl: this.toOptionalString(source.sourceUrl),
      parsedAt: this.toDateOrUndefined(source.parsedAt),
    });
  }

  private normalizeDropstabFundraisingRounds(value: any): any[] {
    const rounds = Array.isArray(value) ? value : [];
    return rounds
      .map((round) => this.normalizeDropstabFundraisingRound(round))
      .filter(Boolean);
  }

  private normalizeDropstabFundraisingRound(round: any): any | undefined {
    if (!round || typeof round !== "object") return undefined;

    return this.compactObject({
      roundName: this.toOptionalString(round.roundName),
      date: this.toOptionalString(round.date),
      amount: this.toNumber(round.amount),
      amountFormatted: this.toOptionalString(round.amountFormatted),
      valuation: this.toNumber(round.valuation),
      valuationFormatted: this.toOptionalString(round.valuationFormatted),
      price: this.toNumber(round.price),
      priceFormatted: this.toOptionalString(round.priceFormatted),
      tokensForSale: this.toOptionalString(round.tokensForSale),
      investors: this.uniqueStrings(round.investors),
      leadInvestors: this.uniqueStrings(round.leadInvestors),
      stage: this.toOptionalString(round.stage),
      type: this.toOptionalString(round.type),
      sourceUrl: this.toOptionalString(round.sourceUrl),
    });
  }

  private normalizeSourceLinks(sourceProject: any): any[] {
    const links = Array.isArray(sourceProject.sourceLinks) ? sourceProject.sourceLinks : [];
    const normalized = links
      .map((item: any) => this.compactObject({
        label: this.toOptionalString(item?.label || item?.type || item?.name),
        url: this.toOptionalString(item?.url || item),
      }))
      .filter((item: any) => item?.url);
    const sourceUrl = this.resolveDropstabSourceUrl(sourceProject);
    if (sourceUrl && !normalized.some((item: any) => item.url === sourceUrl)) {
      normalized.unshift({ label: "Dropstab", url: sourceUrl });
    }
    return normalized;
  }

  private resolveDropstabSourceUrl(sourceProject: any): string {
    return (
      this.toOptionalString(sourceProject.sourceUrl) ||
      this.toOptionalString(sourceProject.about?.sourceUrl) ||
      this.toOptionalString(sourceProject.description?.sourceUrl) ||
      this.toOptionalString(sourceProject.fundraising?.sourceUrl) ||
      this.toOptionalString(sourceProject.fundraisingRounds?.[0]?.sourceUrl) ||
      (this.toNonEmptyString(sourceProject.coinSlug)
        ? `https://dropstab.com/coins/${encodeURIComponent(this.toNonEmptyString(sourceProject.coinSlug))}`
        : "")
    );
  }

  private toOptionalString(value: any): string | undefined {
    const text = this.toNonEmptyString(value);
    return text || undefined;
  }

  private toNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? number : undefined;
  }

  private sumNumbers(values: any[]): number | undefined {
    const total = values.reduce((sum, value) => {
      const number = this.toNumber(value);
      return number === undefined ? sum : sum + number;
    }, 0);
    return total > 0 ? total : undefined;
  }

  private toDateOrUndefined(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : undefined;
  }

  private uniqueStrings(value: any): string[] {
    const list = Array.isArray(value) ? value : value ? [value] : [];
    return Array.from(
      new Set(
        list
          .map((item) => String(item || "").trim())
          .filter(Boolean),
      ),
    );
  }

  private compactObject(value: any): any | undefined {
    if (!value || typeof value !== "object") return undefined;
    const result: any = {};

    for (const [key, raw] of Object.entries(value)) {
      let item: any = raw;
      if (item && typeof item === "object" && !Array.isArray(item) && !(item instanceof Date)) {
        item = this.compactObject(item);
      }
      if (item === undefined || item === null || item === "") continue;
      if (Array.isArray(item) && !item.length) continue;
      if (item && typeof item === "object" && !(item instanceof Date) && !Array.isArray(item) && !Object.keys(item).length) continue;
      result[key] = item;
    }

    return Object.keys(result).length ? result : undefined;
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
