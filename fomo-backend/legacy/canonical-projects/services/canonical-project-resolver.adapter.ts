import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Project } from "src/projects/project.model";
import {
  ProjectResolverConfidence,
  ProjectResolverResult,
  ProjectResolverService,
} from "src/crypto-linking/services/project-resolver.service";
import {
  CanonicalProjectLookupCache,
  CanonicalProjectService,
  CanonicalProjectProviderIds,
} from "./canonical-project.service";
import { CanonicalProjectLinkLookupCache, CanonicalProjectLinkService } from "./canonical-project-link.service";
import {
  CanonicalProjectLinkEntityType,
  CanonicalProjectLinkProjectType,
  CanonicalProjectLinkStatus,
} from "../models/canonical-project-link.model";

export type CanonicalProjectResolverAdapterInput = {
  entityType: CanonicalProjectLinkEntityType;
  entityId: any;
  projectId?: any;
  projectLinks?: Array<{
    projectId: any;
    projectType?: "market" | "project" | "ico" | "raw";
    confidence?: ProjectResolverConfidence | string;
    matchedBy?: string;
    reason?: string;
  }>;
  source?: string;
  sourceId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
  sourceKey?: string;
  externalId?: string;
  name?: string;
  slug?: string;
  symbol?: string;
  coinSlug?: string;
  providerIds?: CanonicalProjectProviderIds;
  projectType?: CanonicalProjectLinkProjectType;
  resolvedProjects?: ProjectLike[];
};

export type CanonicalProjectResolverAdapterOptions = {
  dryRun?: boolean;
  createdBy?: "system" | "manual";
  dryRunCache?: Map<string, any>;
  projectById?: Map<string, ProjectLike>;
  projectResolverCache?: CanonicalProjectResolverBatchCache;
  canonicalLookupCache?: CanonicalProjectLookupCache;
  linkLookupCache?: CanonicalProjectLinkLookupCache;
};

export type CanonicalProjectResolverAdapterOutput = {
  canonicalProjectId?: Types.ObjectId;
  status: "verified" | "proposed" | "conflict" | "skipped";
  confidence: number;
  matchedBy: string;
  reason: string;
  linksCreated: number;
  conflicts: any[];
  canonicalCreated?: boolean;
  ambiguous?: boolean;
  unsafe?: boolean;
};

type ProjectLike = Record<string, any> & { _id?: Types.ObjectId; projectType?: string };

export type CanonicalProjectResolverBatchCache = {
  projectsById: Map<string, ProjectLike>;
  sourceMapsBySourceId: Map<string, any[]>;
  sourceMapsBySourceSlug: Map<string, any[]>;
  sourceMapsBySourceUrl: Map<string, any[]>;
  projectsBySourceId: Map<string, ProjectLike[]>;
  projectsBySourceUrl: Map<string, ProjectLike[]>;
  projectsByProvider: Map<string, ProjectLike[]>;
  projectsByCapId: Map<string, ProjectLike[]>;
  projectsBySlug: Map<string, ProjectLike[]>;
  projectsByName: Map<string, ProjectLike[]>;
  projectsBySymbol: Map<string, ProjectLike[]>;
};

type CachedResolutionConfig = {
  confidence: ProjectResolverConfidence;
  matchedBy: string;
  reason: string;
  unsafe?: boolean;
};

type NormalizedCachedProjectResolverInput = {
  source: string;
  sourceId: string;
  sourceKey: string;
  externalId: string;
  sourceUrl: string;
  normalizedSourceUrl: string;
  coinSlug: string;
  slug: string;
  name: string;
  normalizedName: string;
  symbol: string;
  coinGeckoId: string;
  coinMarketCapId: string;
  dropstabId: string;
  cryptorankId: string;
  icodropsId: string;
};

@Injectable()
export class CanonicalProjectResolverAdapter {
  private readonly projectIdentityLocks = new Map<string, Promise<any>>();

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    private readonly projectResolverService: ProjectResolverService,
    private readonly canonicalProjectService: CanonicalProjectService,
    private readonly canonicalProjectLinkService: CanonicalProjectLinkService,
  ) {}

  async resolveAndLink(
    input: CanonicalProjectResolverAdapterInput,
    options: CanonicalProjectResolverAdapterOptions = {},
  ): Promise<CanonicalProjectResolverAdapterOutput> {
    const directProjectIds = this.collectProjectIds(input);
    if (directProjectIds.length) {
      return this.withProjectIdentityLock(directProjectIds, () => this.resolveDirectProjectLinks(input, directProjectIds, options));
    }

    const resolverInput = {
      source: input.source,
      sourceId: input.sourceId,
      sourceKey: input.sourceKey,
      externalId: input.externalId,
      sourceUrl: input.sourceUrl,
      coinSlug: input.coinSlug || input.sourceSlug || input.slug,
      slug: input.slug || input.sourceSlug || input.coinSlug,
      name: input.name,
      symbol: input.symbol,
      coinGeckoId: input.providerIds?.coingeckoId,
      coinMarketCapId: input.providerIds?.coinMarketCapId || input.providerIds?.coinmarketcapId,
      dropstabId: input.providerIds?.dropstabId,
      cryptorankId: input.providerIds?.cryptorankId,
      icodropsId: input.providerIds?.icodropsId,
    };
    const resolverResult =
      this.resolveFromProjectResolverCache(resolverInput, options.projectResolverCache) ||
      (await this.projectResolverService.resolve(resolverInput));

    if (!resolverResult.projectId) {
      return {
        status: "skipped",
        confidence: this.scoreForConfidence(resolverResult.confidence),
        matchedBy: resolverResult.matchedBy,
        reason: resolverResult.reason,
        linksCreated: 0,
        conflicts: [],
        ambiguous: Boolean(resolverResult.candidates?.length),
        unsafe: Boolean(resolverResult.unsafe),
      };
    }

    if (resolverResult.unsafe || resolverResult.matchedBy === "symbol") {
      return {
        status: "skipped",
        confidence: this.scoreForConfidence(resolverResult.confidence),
        matchedBy: resolverResult.matchedBy,
        reason: resolverResult.reason || "Unsafe project resolver match was not linked to CanonicalProject.",
        linksCreated: 0,
        conflicts: [],
        ambiguous: Boolean(resolverResult.candidates && resolverResult.candidates.length > 1),
        unsafe: true,
      };
    }

    if (this.requiresVerifiedResolverMatch(input.entityType) && !this.isVerifiedResolverMatch(resolverResult)) {
      return {
        status: "skipped",
        confidence: this.scoreForConfidence(resolverResult.confidence),
        matchedBy: resolverResult.matchedBy,
        reason: resolverResult.reason || "Resolver match was not strong enough for automatic CanonicalProjectLink creation.",
        linksCreated: 0,
        conflicts: [],
        ambiguous: Boolean(resolverResult.candidates && resolverResult.candidates.length > 1),
        unsafe: false,
      };
    }

    const projectLinks =
      resolverResult.projectLinks?.length
        ? resolverResult.projectLinks.map((link) => ({
            projectId: link.projectId,
            projectType: link.projectType,
            confidence: link.confidence,
            matchedBy: link.matchedBy,
            reason: link.reason,
          }))
        : [
            {
              projectId: resolverResult.projectId,
              projectType: resolverResult.projectType,
              confidence: resolverResult.confidence,
              matchedBy: resolverResult.matchedBy,
              reason: resolverResult.reason,
            },
          ];

    const resolvedProjectIds = this.collectProjectIds({ projectLinks });
    return this.withProjectIdentityLock(
      resolvedProjectIds,
      () =>
        this.resolveDirectProjectLinks(
          {
            ...input,
            projectId: resolverResult.projectId,
            projectLinks,
          },
          resolvedProjectIds,
          {
            ...options,
            resolverResult,
          } as any,
        ),
    );
  }

  private async withProjectIdentityLock<T>(projectIds: Types.ObjectId[], operation: () => Promise<T>): Promise<T> {
    const key = this.projectIdentityLockKey(projectIds);
    if (!key) return operation();

    const previous = this.projectIdentityLocks.get(key) || Promise.resolve();
    let release: () => void = () => undefined;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const chained = previous.then(() => current, () => current);
    this.projectIdentityLocks.set(key, chained);

    try {
      await previous.catch(() => undefined);
      return await operation();
    } finally {
      release();
      if (this.projectIdentityLocks.get(key) === chained) {
        this.projectIdentityLocks.delete(key);
      }
    }
  }

  private projectIdentityLockKey(projectIds: Types.ObjectId[]): string {
    return projectIds.map((projectId) => projectId.toString()).sort().join("|");
  }

  private async resolveDirectProjectLinks(
    input: CanonicalProjectResolverAdapterInput,
    projectIds: Types.ObjectId[],
    options: CanonicalProjectResolverAdapterOptions & { resolverResult?: ProjectResolverResult } = {},
  ): Promise<CanonicalProjectResolverAdapterOutput> {
    const projects = await this.loadProjectsForDirectLinks(input, projectIds, options);
    if (!projects.length) {
      return {
        status: "skipped",
        confidence: 0,
        matchedBy: "legacyProjectId",
        reason: "Project ids were present but no legacy Project documents were found.",
        linksCreated: 0,
        conflicts: [],
      };
    }

    const primaryProject = this.choosePrimaryProject(projects as any[], input.projectLinks);
    const resolverResult = options.resolverResult;
    const confidence = resolverResult
      ? this.scoreForConfidence(resolverResult.confidence)
      : this.maxConfidenceFromProjectLinks(input.projectLinks);
    const matchedBy = resolverResult?.matchedBy || (input.projectLinks?.length ? "legacyProjectLinks" : "legacyProjectId");
    const reason =
      resolverResult?.reason ||
      (input.projectLinks?.length
        ? "Resolved from existing legacy projectLinks without changing the source entity."
        : "Resolved from existing legacy projectId without changing the source entity.");
    const linkStatus = this.statusForInput(input, resolverResult);
    const existingCanonicalResolution = await this.resolveExistingCanonicalForProjects(projects as ProjectLike[], options);

    if (existingCanonicalResolution.conflicts.length) {
      return {
        canonicalProjectId: existingCanonicalResolution.canonicalProject?._id,
        status: "conflict",
        confidence,
        matchedBy,
        reason: `${reason}; project links point to multiple existing canonical projects.`,
        linksCreated: 0,
        conflicts: existingCanonicalResolution.conflicts,
        ambiguous: true,
        unsafe: false,
      };
    }

    const canonicalProject =
      existingCanonicalResolution.canonicalProject ||
      (await this.canonicalProjectService.findOrCreateFromProject(primaryProject, {
        dryRun: options.dryRun,
        createdBy: options.createdBy,
        confidence,
        matchedBy,
        reason,
        dryRunCache: options.dryRunCache,
        lookupCache: options.canonicalLookupCache,
      }));

    let linksCreated = 0;
    const conflicts: any[] = [];
    const canonicalProjectId = canonicalProject._id;
    let primaryProjectLinkResult: any = null;

    for (const project of projects as ProjectLike[]) {
      await this.canonicalProjectService.attachProjectSourceRef(canonicalProjectId, project, {
        dryRun: options.dryRun,
        confidence,
        matchedBy,
        reason,
      });

      const projectLinkStatus = this.projectSelfLinkStatus(project);
      const projectLinkResult = await this.canonicalProjectLinkService.ensureLink(
        {
          canonicalProjectId,
          entityType: "project",
          entityId: project._id,
          legacyProjectId: project._id,
          projectType: this.projectType(project.projectType),
          source: project.source,
          sourceId: project.sourceId,
          sourceSlug: project.slug || project.rawIcoData?.slug,
          sourceUrl: project.sourceUrl || project.detailUrl,
          confidence: projectLinkStatus === "verified" ? 100 : confidence,
          matchedBy: projectLinkStatus === "verified" ? "projectStrongSignal" : matchedBy,
          reason:
            projectLinkStatus === "verified"
              ? "Legacy Project has provider/source signal and can be linked to canonical project."
              : "Legacy Project has weak identifiers only; canonical link remains proposed.",
          status: projectLinkStatus,
          dryRun: options.dryRun,
          createdBy: options.createdBy,
        },
        { dryRun: options.dryRun, createdBy: options.createdBy, lookupCache: options.linkLookupCache },
      );
      linksCreated += Number(projectLinkResult.linksCreated || 0);
      if (String(project._id) === String(primaryProject._id)) primaryProjectLinkResult = projectLinkResult;
      if (projectLinkResult.status === "conflict") conflicts.push(...((projectLinkResult as any).conflicts || []));
    }

    const entityLinkStatus = input.entityType === "project" ? this.projectSelfLinkStatus(primaryProject) : linkStatus;
    const entityLinkResult =
      input.entityType === "project"
        ? primaryProjectLinkResult || { status: entityLinkStatus, linksCreated: 0 }
        : await this.canonicalProjectLinkService.ensureLink(
            {
              canonicalProjectId,
              entityType: input.entityType,
              entityId: input.entityId,
              legacyProjectId: input.projectId || primaryProject._id,
              projectType: input.projectType || this.projectType(primaryProject.projectType),
              source: input.source || primaryProject.source,
              sourceId: input.sourceId || primaryProject.sourceId,
              sourceSlug: input.sourceSlug || input.slug || primaryProject.slug || primaryProject.rawIcoData?.slug,
              sourceUrl: input.sourceUrl || primaryProject.sourceUrl || primaryProject.detailUrl,
              confidence,
              matchedBy,
              reason,
              status: entityLinkStatus,
              dryRun: options.dryRun,
              createdBy: options.createdBy,
            },
            { dryRun: options.dryRun, createdBy: options.createdBy, lookupCache: options.linkLookupCache },
          );

    if (input.entityType !== "project") {
      linksCreated += Number(entityLinkResult.linksCreated || 0);
    }
    if (entityLinkResult.status === "conflict") conflicts.push(...((entityLinkResult as any).conflicts || []));

    if (entityLinkResult.status !== "conflict") {
      await this.canonicalProjectService.markDataQuality(canonicalProjectId, input.entityType, {
        dryRun: options.dryRun,
      });
    }

    return {
      canonicalProjectId,
      status: conflicts.length ? "conflict" : (entityLinkResult.status as any),
      confidence,
      matchedBy,
      reason,
      linksCreated,
      conflicts,
      canonicalCreated: Boolean(canonicalProject.__created),
      ambiguous: false,
      unsafe: Boolean(resolverResult?.unsafe),
    };
  }

  private collectProjectIds(input: Pick<CanonicalProjectResolverAdapterInput, "projectId" | "projectLinks">): Types.ObjectId[] {
    const ids = [
      input.projectId,
      ...(input.projectLinks || []).map((link) => link.projectId),
    ]
      .map((id) => this.toObjectId(id))
      .filter(Boolean);

    const seen = new Set<string>();
    return ids.filter((id) => {
      const key = id.toString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async loadProjectsForDirectLinks(
    input: CanonicalProjectResolverAdapterInput,
    projectIds: Types.ObjectId[],
    options: CanonicalProjectResolverAdapterOptions,
  ): Promise<ProjectLike[]> {
    const byId = new Map<string, ProjectLike>();
    for (const project of input.resolvedProjects || []) {
      if (project?._id) byId.set(String(project._id), project);
    }
    for (const [key, project] of options.projectById || new Map<string, ProjectLike>()) {
      byId.set(key, project);
    }

    const missingProjectIds = projectIds.filter((projectId) => !byId.has(projectId.toString()));
    if (missingProjectIds.length) {
      const fetchedProjects = await this.projectModel.find({ _id: { $in: missingProjectIds } }).lean();
      for (const project of fetchedProjects as ProjectLike[]) {
        if (project?._id) byId.set(String(project._id), project);
      }
    }

    return projectIds.map((projectId) => byId.get(projectId.toString())).filter(Boolean);
  }

  private choosePrimaryProject(projects: ProjectLike[], projectLinks: CanonicalProjectResolverAdapterInput["projectLinks"] = []) {
    const projectTypeById = new Map(projectLinks.map((link) => [String(link.projectId), link.projectType]));
    const sorted = [...projects].sort((a, b) => {
      const aType = projectTypeById.get(String(a._id)) || a.projectType;
      const bType = projectTypeById.get(String(b._id)) || b.projectType;
      return this.projectTypeRank(aType) - this.projectTypeRank(bType);
    });
    return sorted[0];
  }

  private async resolveExistingCanonicalForProjects(
    projects: ProjectLike[],
    options: CanonicalProjectResolverAdapterOptions,
  ): Promise<{ canonicalProject: any | null; conflicts: any[] }> {
    const byCanonicalId = new Map<string, any>();

    for (const project of projects || []) {
      if (!project?._id) continue;
      const cachedCanonical = options.canonicalLookupCache?.byProjectId?.get(String(project._id));
      const canonicalProject =
        cachedCanonical ||
        (options.dryRun && options.canonicalLookupCache
          ? null
          : typeof this.canonicalProjectService.findCanonicalByProjectId === "function"
            ? await this.canonicalProjectService.findCanonicalByProjectId(project._id)
            : null);
      if (!canonicalProject?._id) continue;
      byCanonicalId.set(String(canonicalProject._id), canonicalProject);
    }

    const canonicalProjects = Array.from(byCanonicalId.values());
    if (canonicalProjects.length <= 1) {
      return { canonicalProject: canonicalProjects[0] || null, conflicts: [] };
    }

    return {
      canonicalProject: canonicalProjects[0],
      conflicts: canonicalProjects.map((canonicalProject) => ({
        canonicalProjectId: canonicalProject._id,
        primaryMarketProjectId: canonicalProject.primaryMarketProjectId,
        primaryProjectId: canonicalProject.primaryProjectId,
      })),
    };
  }

  private projectTypeRank(value: any): number {
    const projectType = this.projectType(value);
    if (projectType === "project" || projectType === "ico") return 0;
    if (projectType === "market") return 1;
    return 2;
  }

  private statusForInput(
    input: CanonicalProjectResolverAdapterInput,
    resolverResult?: ProjectResolverResult,
  ): CanonicalProjectLinkStatus {
    if (!resolverResult) return "verified";
    if (resolverResult.unsafe || resolverResult.matchedBy === "symbol") return "proposed";
    if (resolverResult.confidence === "exact" || resolverResult.confidence === "high") return "verified";
    return "proposed";
  }

  private requiresVerifiedResolverMatch(entityType: string): boolean {
    return entityType === "fundingRound" || entityType === "tokenUnlock";
  }

  private isVerifiedResolverMatch(resolverResult?: ProjectResolverResult): boolean {
    return resolverResult?.confidence === "exact" || resolverResult?.confidence === "high";
  }

  private projectSelfLinkStatus(project: ProjectLike): CanonicalProjectLinkStatus {
    const providerIds = this.canonicalProjectService.providerIdsFromProject(project);
    if (Object.values(providerIds).some(Boolean)) return "verified";
    if (project.source && project.sourceId) return "verified";
    if (Array.isArray(project.sourceMappings) && project.sourceMappings.some((mapping) => mapping?.source && mapping?.sourceId)) {
      return "verified";
    }
    return "proposed";
  }

  private maxConfidenceFromProjectLinks(projectLinks: CanonicalProjectResolverAdapterInput["projectLinks"] = []): number {
    if (!projectLinks.length) return 100;
    return Math.max(...projectLinks.map((link) => this.scoreForConfidence(link.confidence as ProjectResolverConfidence)));
  }

  private scoreForConfidence(confidence: ProjectResolverConfidence | string): number {
    if (confidence === "exact") return 100;
    if (confidence === "high") return 90;
    if (confidence === "medium") return 70;
    if (confidence === "low") return 40;
    return 0;
  }

  private projectType(value: any): CanonicalProjectLinkProjectType {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "market") return "market";
    if (normalized === "ico") return "ico";
    if (normalized === "project") return "project";
    return "raw";
  }

  private toObjectId(value: any): Types.ObjectId | null {
    if (!value) return null;
    if (value instanceof Types.ObjectId) return value;
    if (Types.ObjectId.isValid(String(value))) return new Types.ObjectId(String(value));
    return null;
  }

  private resolveFromProjectResolverCache(
    input: Parameters<ProjectResolverService["resolve"]>[0],
    cache?: CanonicalProjectResolverBatchCache,
  ): ProjectResolverResult | null {
    if (!cache) return null;
    const normalized = this.normalizeCachedResolverInput(input);

    const sourceResult = this.resolveCachedBySourceMapping(normalized, cache);
    if (sourceResult.confidence !== "none") return sourceResult;

    const providerResult = this.resolveCachedByProviderIds(normalized, cache);
    if (providerResult.confidence !== "none") return providerResult;

    const slugResult = this.resolveCachedBySlug(normalized, cache);
    if (slugResult.confidence !== "none") return slugResult;

    const nameSymbolResult = this.resolveCachedByNameAndSymbol(normalized, cache);
    if (nameSymbolResult.confidence !== "none") return nameSymbolResult;

    const nameResult = this.resolveCachedByName(normalized, cache);
    if (nameResult.confidence !== "none") return nameResult;

    const symbolResult = this.resolveCachedBySymbol(normalized, cache);
    if (symbolResult.confidence !== "none") return symbolResult;

    return this.cachedNoMatch("No exact source mapping, provider id, slug, name+symbol, name, or symbol candidate found.");
  }

  private resolveCachedBySourceMapping(
    input: NormalizedCachedProjectResolverInput,
    cache: CanonicalProjectResolverBatchCache,
  ): ProjectResolverResult {
    if (!input.source) return this.cachedNoMatch("Missing source for exact source mapping.");

    const sourceIds = this.uniqueStrings([input.sourceId, input.sourceKey, input.externalId]);
    const slugs = this.uniqueStrings([input.slug, input.coinSlug]);
    const urls = this.uniqueStrings([input.sourceUrl, input.normalizedSourceUrl]);
    const sourceMapProjects = this.projectsFromSourceMaps(cache, [
      ...sourceIds.flatMap((value) => cache.sourceMapsBySourceId.get(this.sourceScopedKey(input.source, value)) || []),
      ...slugs.flatMap((value) => cache.sourceMapsBySourceSlug.get(this.sourceScopedKey(input.source, value)) || []),
      ...urls.flatMap((value) => cache.sourceMapsBySourceUrl.get(this.sourceScopedKey(input.source, value)) || []),
    ]);

    const sourceMapResult = this.cachedResolution(sourceMapProjects, {
      confidence: "exact",
      matchedBy: "sourceMapping",
      reason: "Exact project_source_maps match by source and source identifier.",
    });
    if (sourceMapResult.confidence !== "none") return sourceMapResult;

    const legacyProjects = this.uniqueProjects([
      ...sourceIds.flatMap((value) => cache.projectsBySourceId.get(this.sourceScopedKey(input.source, value)) || []),
      ...urls.flatMap((value) => cache.projectsBySourceUrl.get(this.sourceScopedKey(input.source, value)) || []),
    ]);

    return this.cachedResolution(legacyProjects, {
      confidence: "exact",
      matchedBy: "legacyProjectSource",
      reason: "Exact legacy Project source/sourceId/sourceUrl match.",
    });
  }

  private resolveCachedByProviderIds(
    input: NormalizedCachedProjectResolverInput,
    cache: CanonicalProjectResolverBatchCache,
  ): ProjectResolverResult {
    const providers: Array<{ source: string; ids: string[]; providerFields: string[]; capId?: boolean }> = [
      { source: "coingecko", ids: this.uniqueStrings([input.coinGeckoId]), providerFields: ["coingeckoId"] },
      { source: "coinmarketcap", ids: this.uniqueStrings([input.coinMarketCapId]), providerFields: ["coinMarketCapId"] },
      { source: "dropstab", ids: this.uniqueStrings([input.dropstabId]), providerFields: ["dropstabId"], capId: true },
      { source: "cryptorank", ids: this.uniqueStrings([input.cryptorankId]), providerFields: ["cryptorankId"] },
      { source: "icodrops", ids: this.uniqueStrings([input.icodropsId]), providerFields: ["icodropsId"] },
    ];

    for (const provider of providers) {
      if (!provider.ids.length) continue;
      const sourceMapProjects = this.projectsFromSourceMaps(cache, [
        ...provider.ids.flatMap((value) => cache.sourceMapsBySourceId.get(this.sourceScopedKey(provider.source, value)) || []),
        ...provider.ids.flatMap((value) => cache.sourceMapsBySourceSlug.get(this.sourceScopedKey(provider.source, value)) || []),
      ]);
      const sourceMapResult = this.cachedResolution(sourceMapProjects, {
        confidence: "exact",
        matchedBy: `${provider.source}SourceMap`,
        reason: `Exact ${provider.source} project_source_maps provider id match.`,
      });
      if (sourceMapResult.confidence !== "none") return sourceMapResult;

      const projects = this.uniqueProjects([
        ...provider.providerFields.flatMap((field) =>
          provider.ids.flatMap((value) => cache.projectsByProvider.get(this.providerScopedKey(field, value)) || []),
        ),
        ...(provider.capId
          ? provider.ids.flatMap((value) => cache.projectsByCapId.get(this.normalizeProviderValue(value)) || [])
          : []),
      ]);
      const projectResult = this.cachedResolution(projects, {
        confidence: "exact",
        matchedBy: `${provider.source}ProviderId`,
        reason: `Exact ${provider.source} provider id match on Project fields.`,
      });
      if (projectResult.confidence !== "none") return projectResult;
    }

    return this.cachedNoMatch("No provider id candidate found.");
  }

  private resolveCachedBySlug(
    input: NormalizedCachedProjectResolverInput,
    cache: CanonicalProjectResolverBatchCache,
  ): ProjectResolverResult {
    const slugs = this.uniqueStrings([input.slug, input.coinSlug]);
    if (!slugs.length) return this.cachedNoMatch("Missing slug.");
    return this.cachedResolution(
      this.uniqueProjects(slugs.flatMap((slug) => cache.projectsBySlug.get(slug) || [])),
      {
        confidence: "high",
        matchedBy: "slug",
        reason: "Unique canonical/source slug match.",
      },
    );
  }

  private resolveCachedByNameAndSymbol(
    input: NormalizedCachedProjectResolverInput,
    cache: CanonicalProjectResolverBatchCache,
  ): ProjectResolverResult {
    if (!input.normalizedName || !input.symbol) {
      return this.cachedNoMatch("Missing name or symbol for name+symbol matching.");
    }
    const byName = new Set((cache.projectsByName.get(input.normalizedName) || []).map((project) => String(project._id)));
    const projects = (cache.projectsBySymbol.get(input.symbol) || []).filter((project) => byName.has(String(project._id)));
    return this.cachedResolution(projects, {
      confidence: "high",
      matchedBy: "name+symbol",
      reason: "Unique normalized name and symbol match.",
    });
  }

  private resolveCachedByName(
    input: NormalizedCachedProjectResolverInput,
    cache: CanonicalProjectResolverBatchCache,
  ): ProjectResolverResult {
    if (!input.normalizedName) return this.cachedNoMatch("Missing name.");
    return this.cachedResolution(cache.projectsByName.get(input.normalizedName) || [], {
      confidence: "medium",
      matchedBy: "normalizedName",
      reason: "Unique normalized name match.",
    });
  }

  private resolveCachedBySymbol(
    input: NormalizedCachedProjectResolverInput,
    cache: CanonicalProjectResolverBatchCache,
  ): ProjectResolverResult {
    if (!input.symbol) return this.cachedNoMatch("Missing symbol.");
    return this.cachedResolution(cache.projectsBySymbol.get(input.symbol) || [], {
      confidence: "low",
      matchedBy: "symbol",
      reason: "Symbol-only match is report-only and unsafe for automatic writes.",
      unsafe: true,
    });
  }

  private cachedResolution(projects: ProjectLike[], config: CachedResolutionConfig): ProjectResolverResult {
    const projectDocs = this.uniqueProjects(projects);
    const candidates = projectDocs.map((project) => ({
      projectId: project._id,
      name: project.name || "",
      symbol: project.symbol || project.rawIcoData?.symbol || project.rawIcoData?.ticker,
      slug: project.slug || project.rawIcoData?.slug,
      projectType: project.projectType,
      score: this.scoreForConfidence(config.confidence),
      reason: config.reason,
    }));

    if (candidates.length === 1) {
      const projectType = this.projectLinkType(candidates[0].projectType);
      return {
        projectId: candidates[0].projectId,
        ...(projectType ? { projectType } : {}),
        ...(projectType
          ? {
              projectLinks: [
                {
                  projectId: candidates[0].projectId,
                  projectType,
                  confidence: config.confidence,
                  matchedBy: config.matchedBy,
                  reason: config.reason,
                },
              ],
            }
          : {}),
        confidence: config.confidence,
        reason: config.reason,
        matchedBy: config.matchedBy,
        unsafe: config.unsafe,
        candidates,
      };
    }

    if (candidates.length > 1) {
      const typedResolution = config.unsafe ? null : this.cachedTypedResolution(candidates, config);
      if (typedResolution) return typedResolution;
      return {
        projectId: null,
        confidence: "none",
        reason: `Ambiguous project match: ${candidates.length} candidates matched by ${config.matchedBy}.`,
        matchedBy: config.matchedBy,
        unsafe: true,
        candidates,
      };
    }

    return this.cachedNoMatch(`No project candidate matched by ${config.matchedBy}.`);
  }

  private cachedTypedResolution(candidates: ProjectResolverResult["candidates"], config: CachedResolutionConfig): ProjectResolverResult | null {
    const typedCandidates = (candidates || [])
      .map((candidate) => ({
        candidate,
        projectType: this.projectLinkType(candidate.projectType),
      }))
      .filter((item): item is { candidate: ProjectResolverResult["candidates"][number]; projectType: "market" | "project" } =>
        Boolean(item.projectType),
      );
    const typedProjectTypes = new Set(typedCandidates.map((item) => item.projectType));
    if (
      typedCandidates.length !== candidates.length ||
      typedCandidates.length !== typedProjectTypes.size ||
      !typedProjectTypes.has("market") ||
      !typedProjectTypes.has("project")
    ) {
      return null;
    }

    const primary = typedCandidates.find((item) => item.projectType === "project") || typedCandidates[0];
    const reason = `${config.reason}; resolved as a market/project typed pair.`;
    return {
      projectId: primary.candidate.projectId,
      projectType: primary.projectType,
      projectLinks: typedCandidates.map((item) => ({
        projectId: item.candidate.projectId,
        projectType: item.projectType,
        confidence: config.confidence,
        matchedBy: config.matchedBy,
        reason,
      })),
      confidence: config.confidence,
      reason,
      matchedBy: config.matchedBy,
      candidates,
    };
  }

  private projectsFromSourceMaps(cache: CanonicalProjectResolverBatchCache, sourceMaps: any[]): ProjectLike[] {
    return this.uniqueProjects(
      (sourceMaps || [])
        .map((sourceMap) => cache.projectsById.get(String(sourceMap?.projectId || "")))
        .filter(Boolean),
    );
  }

  private cachedNoMatch(reason: string): ProjectResolverResult {
    return {
      projectId: null,
      confidence: "none",
      reason,
      matchedBy: "none",
    };
  }

  private normalizeCachedResolverInput(input: Parameters<ProjectResolverService["resolve"]>[0]): NormalizedCachedProjectResolverInput {
    return {
      source: this.normalizeSource(input.source),
      sourceId: this.cleanIdentifier(input.sourceId),
      sourceKey: this.cleanIdentifier(input.sourceKey),
      externalId: this.cleanIdentifier(input.externalId),
      sourceUrl: this.cleanUrl(input.sourceUrl, false),
      normalizedSourceUrl: this.cleanUrl(input.sourceUrl, true),
      coinSlug: this.normalizeSlug(input.coinSlug),
      slug: this.normalizeSlug(input.slug),
      name: this.cleanText(input.name),
      normalizedName: this.normalizeName(input.name),
      symbol: this.normalizeSymbol(input.symbol),
      coinGeckoId: this.cleanIdentifier(input.coinGeckoId),
      coinMarketCapId: this.cleanIdentifier(input.coinMarketCapId),
      dropstabId: this.cleanIdentifier(input.dropstabId),
      cryptorankId: this.cleanIdentifier(input.cryptorankId),
      icodropsId: this.cleanIdentifier(input.icodropsId),
    };
  }

  private projectLinkType(value: any): "market" | "project" | null {
    const projectType = String(value || "").trim().toLowerCase();
    if (projectType === "market" || projectType === "project") return projectType;
    return null;
  }

  private uniqueProjects(projects: ProjectLike[]): ProjectLike[] {
    const byId = new Map<string, ProjectLike>();
    for (const project of projects || []) {
      if (project?._id) byId.set(String(project._id), project);
    }
    return Array.from(byId.values());
  }

  private sourceScopedKey(source: any, value: any): string {
    const normalizedSource = this.normalizeSource(source);
    const normalizedValue = this.cleanIdentifier(value);
    return normalizedSource && normalizedValue ? `${normalizedSource}:${normalizedValue}` : "";
  }

  private providerScopedKey(field: any, value: any): string {
    const normalizedField = this.cleanIdentifier(field);
    const normalizedValue = this.normalizeProviderValue(value);
    return normalizedField && normalizedValue ? `${normalizedField}:${normalizedValue}` : "";
  }

  private normalizeProviderValue(value: any): string {
    return this.cleanIdentifier(value).toLowerCase();
  }

  private normalizeSource(value: any): string {
    return String(value || "").trim().toLowerCase();
  }

  private cleanIdentifier(value: any): string {
    return String(value ?? "").trim();
  }

  private cleanText(value: any): string {
    return String(value || "").trim();
  }

  private normalizeSlug(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/^https?:\/\/[^/]+\/?/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private normalizeName(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private normalizeSymbol(value: any): string {
    return String(value || "")
      .trim()
      .replace(/^\$/, "")
      .toUpperCase();
  }

  private cleanUrl(value: any, normalize: boolean): string {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (!normalize) return raw;
    return raw
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/[?#].*$/, "")
      .replace(/\/+$/, "");
  }

  private uniqueStrings(values: any[]): string[] {
    return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
  }
}
