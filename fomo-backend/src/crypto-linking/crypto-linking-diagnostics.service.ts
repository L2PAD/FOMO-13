import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Funds } from "src/funds/funds.model";
import { Person } from "src/persons/person.model";
import { Project } from "src/projects/project.model";
import { ProjectSourceMap } from "src/projects/intel-sync/models/project-source-map.model";
import type {
  InvestorResolutionResult,
  InvestorResolverInput,
} from "./services/investor-resolver.service";

type Confidence = "exact" | "high" | "medium" | "low" | "none";
type ProjectLinkType = "market" | "project";

type ProjectEntityLink = {
  projectId: string;
  projectType: ProjectLinkType;
  confidence: Confidence;
  matchedBy: string;
  reason: string;
};

type Resolution = {
  projectId: string | null;
  projectType?: ProjectLinkType;
  projectLinks?: ProjectEntityLink[];
  confidence: Confidence;
  reason: string;
  matchedBy: string;
  unsafe?: boolean;
  candidates?: Candidate[];
};

type Candidate = {
  projectId: string;
  name: string;
  symbol?: string;
  slug?: string;
  projectType?: string;
  score: number;
  reason: string;
};

type ProjectLite = {
  _id: any;
  name?: string;
  projectType?: string;
  symbol?: string;
  slug?: string;
  normalizedName?: string;
  source?: string;
  sourceId?: string;
  ticker?: string;
  niche?: string;
  rawIcoData?: any;
};

type ProjectIndex = {
  bySlug: Map<string, ProjectLite[]>;
  bySymbol: Map<string, ProjectLite[]>;
  byName: Map<string, ProjectLite[]>;
  bySourceSlug: Map<string, ProjectLite[]>;
  bySourceId: Map<string, ProjectLite[]>;
  byId: Map<string, ProjectLite>;
};

type InvestorSourceEntity = "project" | "investorPortfolio";

type InvestorSourceRow = {
  rawInvestor: any;
  input: InvestorResolverInput;
  sourceEntity: InvestorSourceEntity;
  sourceEntityId: string;
};

type InvestorResolutionRow = {
  rawInvestor: any;
  resolution: InvestorResolutionResult;
  sourceEntity: InvestorSourceEntity;
  sourceEntityId: string;
};

type InvestorEntityIndex = {
  type: "fund" | "person";
  byDropstabId: Map<number, any[]>;
  bySlug: Map<string, any[]>;
  byName: Map<string, any[]>;
  bySourceId: Map<string, any[]>;
  byUrl: Map<string, any[]>;
};

type InvestorMatchConfig = {
  confidence: "exact" | "high" | "medium" | "low";
  matchedBy: string;
  reason: string;
  score: number;
};

type ProgressReporter = (update: {
  progress?: number;
  stage?: string;
  message?: string;
  meta?: any;
}) => void;

@Injectable()
export class CryptoLinkingDiagnosticsService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(Funds.name) private readonly fundsModel: Model<Funds>,
    @InjectModel(Person.name) private readonly personModel: Model<Person>,
    @InjectModel(ProjectSourceMap.name) private readonly sourceMapModel: Model<ProjectSourceMap>,
  ) {}

  async audit(options: any = {}) {
    const scanLimit = this.toAdminLimit(
      options.scanLimit ?? options.limit,
      500,
      5_000
    );
    const sampleLimit = this.toAdminLimit(options.sampleLimit, 25, 100);
    const investorScanLimit = this.toAdminLimit(
      options.investorScanLimit,
      1_000,
      5_000
    );
    this.reportProgress(options, {
      progress: 5,
      stage: "preparing",
      message: "Preparing crypto linking audit scope",
      meta: { scanLimit, investorScanLimit, sampleLimit },
    });
    this.reportProgress(options, {
      progress: 10,
      stage: "counting",
      message: "Counting crypto entities and existing links",
    });
    const [
      projects,
      funds,
      persons,
      sourceMaps,
    ] = await Promise.all([
      this.projectModel.collection.countDocuments({}),
      this.fundsModel.collection.countDocuments({}),
      this.personModel.collection.countDocuments({}),
      this.sourceMapModel.collection.countDocuments({}),
    ]);

    this.reportProgress(options, {
      progress: 25,
      stage: "sampling",
      message: "Loading project investor references",
      meta: { projects, funds, persons, investorEntities: funds + persons },
    });
    const investorSources = await this.sampleProjectInvestorSources(
      investorScanLimit || scanLimit
    );
    const investorSourceRows = investorSources.length;

    this.reportProgress(options, {
      progress: 75,
      stage: "resolving-investors",
      message: "Resolving investor entities",
      meta: { investorScanLimit },
    });
    const investorResolution = await this.resolveInvestorSources(
      investorSources,
      sampleLimit,
      investorScanLimit
    );

    this.reportProgress(options, {
      progress: 88,
      stage: "building-proposals",
      message: "Building safe proposed updates",
    });
    const proposedUpdates = this.buildProposedUpdates(investorResolution.rows);
    const linked = investorResolution.summary.exactOrHigh;
    const unlinked = investorResolution.summary.unknown;
    const ambiguous = investorResolution.summary.ambiguous;
    const unsafe = investorResolution.summary.lowConfidence +
      investorResolution.summary.ambiguous;
    const samplePoolLimit = Math.max(
      investorResolution.summary.unknown,
      investorResolution.summary.ambiguous,
      investorResolution.summary.lowConfidence
    );

    this.reportProgress(options, {
      progress: 96,
      stage: "finalizing",
      message: "Finalizing audit report",
      meta: {
        proposedInvestors: proposedUpdates.investors.length,
      },
    });

    return {
      dryRun: true,
      generatedAt: new Date().toISOString(),
      scope: {
        scanLimit,
        investorScanLimit,
        sampleLimit,
        note: "Read-only diagnostics. No collection is updated by this endpoint.",
      },
      totals: {
        projects,
        funds,
        persons,
        investors: funds + persons,
        investorEntities: funds + persons,
        linked,
        unlinked,
        ambiguous,
        unsafe,
      },
      missingLinks: {
        investorsWithoutEntity: investorResolution.summary.unknown,
      },
      limits: {
        scanLimit: projects,
        investorScanLimit: investorSourceRows,
        sampleLimit: samplePoolLimit,
        applyLimit: 0,
      },
      diagnostics: {
        sourceMaps,
        investorSourceRows,
        investorResolution: investorResolution.summary,
      },
      samples: {
        ambiguousInvestors: investorResolution.ambiguousSamples,
        lowConfidenceInvestors: investorResolution.lowConfidenceSamples,
        unknownInvestors: investorResolution.unknownSamples,
      },
      proposedUpdates,
      recommendations: [
        "Use project_source_maps as the first exact-match layer for source/sourceId/sourceSlug.",
        "Resolve normal market/project duplicates as typed projectLinks instead of unsafe ambiguity.",
        "Keep investor matching in report mode until reverse-link writes have a schema-safe implementation.",
        "Add normalizedName/sourceMappings style indexes before large batch linking.",
      ],
    };
  }

  private reportProgress(options: any, update: Parameters<ProgressReporter>[0]) {
    const reporter: ProgressReporter | undefined = options?.onProgress;
    if (typeof reporter !== "function") return;

    try {
      reporter(update);
    } catch (error) {
      // Progress reporting must never break read-only diagnostics.
    }
  }

  async auditProject(idOrSlug: string, options: any = {}) {
    const sampleLimit = this.toAdminLimit(options.sampleLimit, 25, 100);
    const project = await this.findProject(idOrSlug);
    if (!project) {
      throw new NotFoundException(`Project not found: ${idOrSlug}`);
    }

    const projectId = this.stringifyId(project._id);
    const slugs = this.projectSlugs(project);
    const symbols = this.projectSymbols(project);
    const names = this.projectNames(project);
    const slugValues = Array.from(slugs);
    const symbolValues = Array.from(symbols);
    const nameValues = Array.from(names);

    const sourceMapsQuery: any = {
      $or: [
        { projectId: new Types.ObjectId(projectId) },
        ...(slugValues.length ? [{ sourceSlug: { $in: slugValues } }] : []),
      ],
    };

    const sourceMaps = await this.sourceMapModel
      .find(sourceMapsQuery)
      .limit(sampleLimit)
      .lean();

    const investorObjectIds = Array.isArray((project as any).investors)
      ? (project as any).investors.filter((value: any) => this.isObjectIdLike(value)).length
      : 0;
    const rawInvestors = this.extractProjectRawInvestors(project);
    const investorResolution = await this.resolveInvestorSources(
      this.collectInvestorSourcesFromProject(project, projectId),
      sampleLimit,
      Math.max(100, sampleLimit * 10),
    );
    const proposedUpdates = this.buildProposedUpdates(investorResolution.rows);

    return {
      dryRun: true,
      generatedAt: new Date().toISOString(),
      project: {
        id: projectId,
        name: project.name,
        symbol: project.symbol,
        slug: project.slug,
        source: project.source,
        sourceId: project.sourceId,
        projectType: project.projectType,
      },
      identifiers: {
        slugs: slugValues,
        symbols: symbolValues,
        names: nameValues,
      },
      linkedData: {
        sourceMaps: sourceMaps.length,
        investorObjectIds,
        rawInvestorNames: rawInvestors.length,
      },
      matchingSamples: {
        sourceMaps: sourceMaps.map((row: any) => ({
          source: row.source,
          sourceSlug: row.sourceSlug,
          sourceId: row.sourceId,
          confidence: row.confidence,
          matchMethod: row.matchMethod,
          isVerified: row.isVerified,
        })),
      },
      diagnostics: {
        investorResolution: investorResolution.summary,
      },
      samples: {
        investors: this.pickSamples(investorResolution.rows, sampleLimit),
        ambiguousInvestors: investorResolution.ambiguousSamples,
        lowConfidenceInvestors: investorResolution.lowConfidenceSamples,
        unknownInvestors: investorResolution.unknownSamples,
      },
      proposedUpdates,
      warnings: this.projectWarnings(project, {
        investorObjectIds,
        rawInvestors,
      }),
    };
  }

  private async sampleProjectInvestorSources(limit: number): Promise<InvestorSourceRow[]> {
    const projects = await this.projectModel.collection
      .find(
        {
          $or: [
            { "rawIcoData.uiInvestors.0": { $exists: true } },
            { "rawIcoData.investors.0": { $exists: true } },
          ],
        },
        {
          projection: {
            _id: 1,
            source: 1,
            "rawIcoData.source": 1,
            "rawIcoData.uiInvestors": 1,
            "rawIcoData.investors": 1,
          },
        }
      )
      .limit(limit)
      .toArray();

    return projects.flatMap((project: any) =>
      this.collectInvestorSourcesFromProject(project, this.stringifyId(project._id))
    );
  }

  private async buildProjectIndex(rows: any[]): Promise<ProjectIndex> {
    const slugs = new Set<string>();
    const symbols = new Set<string>();
    const names = new Set<string>();
    const sourceIdsBySource = new Map<string, Set<string>>();
    const sourceSlugsBySource = new Map<string, Set<string>>();

    for (const row of rows) {
      const sources = this.rowSources(row);
      for (const slug of this.rowSlugs(row)) {
        slugs.add(slug);
        for (const source of sources) this.pushSet(sourceSlugsBySource, source, slug);
      }
      for (const symbol of this.rowSymbols(row)) symbols.add(symbol);
      for (const name of this.rowNames(row)) names.add(name);
      for (const sourceId of this.rowSourceIds(row)) {
        for (const source of sources) this.pushSet(sourceIdsBySource, source, sourceId);
      }
    }

    const sourceMapQuery = this.buildSourceMapQuery(sourceSlugsBySource, sourceIdsBySource);
    const sourceMaps = sourceMapQuery
      ? await this.sourceMapModel.find(sourceMapQuery).lean()
      : [];
    const sourceMapProjectIds = sourceMaps
      .map((row: any) => row.projectId)
      .filter((value: any) => this.isObjectIdLike(value))
      .map((value: any) => new Types.ObjectId(this.stringifyId(value)));

    const projectOr: any[] = [];
    if (slugs.size) {
      const values = Array.from(slugs);
      projectOr.push(
        { slug: { $in: values } },
        { sourceId: { $in: values } },
        { "rawIcoData.slug": { $in: values } },
        { "rawIcoData.sourceId": { $in: values } },
        { "rawIcoData.dropstabSlug": { $in: values } },
      );
    }
    if (symbols.size) {
      const values = Array.from(symbols);
      projectOr.push(
        { symbol: { $in: values } },
        { ticker: { $in: values } },
        { "rawIcoData.symbol": { $in: values } },
        { "rawIcoData.ticker": { $in: values } },
      );
    }
    if (names.size) {
      projectOr.push({ name: { $in: Array.from(names) } }, { "rawIcoData.name": { $in: Array.from(names) } });
    }
    if (sourceMapProjectIds.length) {
      projectOr.push({ _id: { $in: sourceMapProjectIds } });
    }

    const projects: ProjectLite[] = projectOr.length
      ? await this.projectModel.collection
          .find(
            { $or: projectOr },
            {
              projection: {
                _id: 1,
                name: 1,
                projectType: 1,
                normalizedName: 1,
                symbol: 1,
                slug: 1,
                source: 1,
                sourceId: 1,
                ticker: 1,
                niche: 1,
                rawIcoData: 1,
              },
            },
          )
          .limit(10000)
          .toArray()
      : [];

    const index = this.createEmptyProjectIndex();
    for (const project of projects) this.addProjectToIndex(project, index);
    for (const sourceMap of sourceMaps as any[]) {
      const project = index.byId.get(this.stringifyId(sourceMap.projectId));
      if (!project) continue;
      if (sourceMap.sourceSlug) {
        this.addToMap(index.bySourceSlug, this.sourceKey(sourceMap.source, this.normalizeSlug(sourceMap.sourceSlug)), project);
      }
      if (sourceMap.sourceId) {
        this.addToMap(index.bySourceId, this.sourceKey(sourceMap.source, String(sourceMap.sourceId)), project);
      }
    }

    return index;
  }

  private resolveProjectRows(rows: any[], index: ProjectIndex) {
    const resolvedRows = rows.map((row) => {
      const resolution = this.resolveProject(row, index);
      return {
        id: this.stringifyId(row._id),
        source: row.source,
        name: row.projectName || row.detailed?.name,
        slug: row.coinSlug,
        symbol: row.coinSymbol,
        hasProjectId: this.isObjectIdLike(row.projectId),
        hasProjectLinks: this.hasProjectLinks(row.projectLinks),
        projectLinks: this.formatProjectLinks(row.projectLinks),
        ambiguous: !resolution.projectId && Boolean(resolution.candidates && resolution.candidates.length > 1),
        resolution,
      };
    });
    const summary = {
      scanned: rows.length,
      actualLinked: resolvedRows.filter((row) => row.hasProjectId).length,
      highConfidenceResolvable: resolvedRows.filter(
        (row) => !row.hasProjectId && ["exact", "high"].includes(row.resolution.confidence),
      ).length,
      mediumConfidenceResolvable: resolvedRows.filter(
        (row) => !row.hasProjectId && row.resolution.confidence === "medium",
      ).length,
      typedProjectResolvable: resolvedRows.filter(
        (row) => !row.hasProjectId && (row.resolution.projectLinks || []).length > 1,
      ).length,
      actualProjectLinks: resolvedRows.filter((row) => row.hasProjectLinks).length,
      unresolved: resolvedRows.filter((row) => row.resolution.confidence === "none").length,
      ambiguous: resolvedRows.filter((row) => row.ambiguous).length,
      unsafe: resolvedRows.filter((row) => row.resolution.unsafe).length,
    };
    return { rows: resolvedRows, summary };
  }

  private resolveProject(row: any, index: ProjectIndex): Resolution {
    if (this.isObjectIdLike(row.projectId)) {
      return {
        projectId: this.stringifyId(row.projectId),
        confidence: "exact",
        reason: "Row already has projectId.",
        matchedBy: "projectId",
      };
    }

    const sources = this.rowSources(row);
    const slugs = this.rowSlugs(row);
    const sourceIds = this.rowSourceIds(row);
    for (const source of sources) {
      for (const sourceId of sourceIds) {
        const sourceMatch = this.unique(index.bySourceId.get(this.sourceKey(source, sourceId)));
        const resolution = this.projectMatchResolution(sourceMatch, "exact", "sourceId", "project_source_maps exact sourceId match");
        if (resolution) return resolution;
      }
      for (const slug of slugs) {
        const sourceMatch = this.unique(index.bySourceSlug.get(this.sourceKey(source, slug)));
        const resolution = this.projectMatchResolution(sourceMatch, "exact", "sourceSlug", "project_source_maps exact sourceSlug match");
        if (resolution) return resolution;
      }
    }

    for (const slug of slugs) {
      const slugMatch = this.unique(index.bySlug.get(slug));
      const resolution = this.projectMatchResolution(slugMatch, "high", "slug", "Unique canonical slug/source slug match");
      if (resolution) return resolution;
    }

    const names = this.rowNames(row).map((name) => this.normalizeText(name)).filter(Boolean);
    const symbols = this.rowSymbols(row);
    const nameSymbolCandidates = this.intersection(
      names.flatMap((name) => index.byName.get(name) || []),
      symbols.flatMap((symbol) => index.bySymbol.get(symbol) || []),
    );
    const nameSymbolMatch = this.unique(nameSymbolCandidates);
    const nameSymbolResolution = this.projectMatchResolution(
      nameSymbolMatch,
      "high",
      "name+symbol",
      "Unique normalized name and symbol intersection",
    );
    if (nameSymbolResolution) return nameSymbolResolution;

    for (const name of names) {
      const nameMatch = this.unique(index.byName.get(name));
      const resolution = this.projectMatchResolution(nameMatch, "medium", "normalizedName", "Unique normalized name match");
      if (resolution) return resolution;
    }

    for (const symbol of symbols) {
      const symbolMatch = this.unique(index.bySymbol.get(symbol));
      const resolution = this.projectMatchResolution(
        symbolMatch,
        "low",
        "symbol",
        "Symbol-only match is informational and unsafe for writes",
        true,
      );
      if (resolution) return resolution;
    }

    return {
      projectId: null,
      confidence: "none",
      reason: "No source map, slug, name+symbol, name, or safe symbol candidate found.",
      matchedBy: "none",
    };
  }

  private async resolveInvestorSources(
    sources: InvestorSourceRow[],
    sampleLimit: number,
    scanLimit: number,
  ) {
    const selectedSources = scanLimit > 0 ? sources.slice(0, scanLimit) : sources;
    const [funds, persons] = await Promise.all([
      this.fundsModel.find({}).select(this.investorEntityProjection()).lean(),
      this.personModel.find({}).select(this.investorEntityProjection()).lean(),
    ]);
    const fundIndex = this.createInvestorEntityIndex(funds, "fund");
    const personIndex = this.createInvestorEntityIndex(persons, "person");
    const resolutionCache = new Map<string, InvestorResolutionResult>();

    const rows: InvestorResolutionRow[] = selectedSources.map((source) => {
      const cacheKey = this.investorInputCacheKey(source.input);
      let resolution = resolutionCache.get(cacheKey);
      if (!resolution) {
        resolution = this.resolveInvestorInput(source.input, fundIndex, personIndex);
        resolutionCache.set(cacheKey, resolution);
      }

      return {
        rawInvestor: source.rawInvestor,
        sourceEntity: source.sourceEntity,
        sourceEntityId: source.sourceEntityId,
        resolution,
      };
    });

    return {
      rows,
      summary: this.summarizeInvestorResolution(rows),
      ambiguousSamples: this.pickSamples(
        rows.filter((row) => row.resolution.type === "ambiguous"),
        sampleLimit,
      ),
      lowConfidenceSamples: this.pickSamples(
        rows.filter((row) => ["medium", "low"].includes(row.resolution.confidence)),
        sampleLimit,
      ),
      unknownSamples: this.pickSamples(
        rows.filter((row) => row.resolution.type === "unknown"),
        sampleLimit,
      ),
    };
  }

  private summarizeInvestorResolution(rows: InvestorResolutionRow[]) {
    const fundExact = rows.filter((row) => row.resolution.type === "fund" && row.resolution.confidence === "exact").length;
    const fundHigh = rows.filter((row) => row.resolution.type === "fund" && row.resolution.confidence === "high").length;
    const personExact = rows.filter((row) => row.resolution.type === "person" && row.resolution.confidence === "exact").length;
    const personHigh = rows.filter((row) => row.resolution.type === "person" && row.resolution.confidence === "high").length;
    const ambiguous = rows.filter((row) => row.resolution.type === "ambiguous").length;
    const unknown = rows.filter((row) => row.resolution.type === "unknown").length;
    const lowConfidence = rows.filter((row) => ["medium", "low"].includes(row.resolution.confidence)).length;
    return {
      scanned: rows.length,
      fundExact,
      fundHigh,
      personExact,
      personHigh,
      ambiguous,
      unknown,
      lowConfidence,
      exactOrHigh: fundExact + fundHigh + personExact + personHigh,
      missing: unknown,
      unsafe: ambiguous + lowConfidence,
    };
  }

  private buildProposedUpdates(
    investorRows: InvestorResolutionRow[],
  ) {
    return {
      investors: investorRows
        .filter((row) => this.isHighConfidenceInvestorProposal(row))
        .map((row) => {
          const resolution = row.resolution;
          return {
            sourceEntityId: row.sourceEntityId,
            sourceEntity: row.sourceEntity,
            operation: "linkInvestor",
            investorType: resolution.type,
            fundId: resolution.fundId ? this.stringifyId(resolution.fundId) : undefined,
            personId: resolution.personId ? this.stringifyId(resolution.personId) : undefined,
            confidence: resolution.confidence,
            matchedBy: resolution.matchedBy,
            reason: resolution.reason,
          };
        }),
    };
  }

  private isHighConfidenceInvestorProposal(row: InvestorResolutionRow) {
    return (
      ["fund", "person"].includes(row.resolution.type) &&
      ["exact", "high"].includes(row.resolution.confidence)
    );
  }

  private collectInvestorSourcesFromProject(project: any, projectId: string): InvestorSourceRow[] {
    const rows: InvestorSourceRow[] = [];
    const seen = new Set<string>();
    for (const rawInvestor of this.extractProjectRawInvestors(project)) {
      const input = this.toInvestorResolverInput(rawInvestor, project.source || project.rawIcoData?.source);
      const key = this.investorSourceKey("project", projectId, input);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      rows.push({
        rawInvestor,
        input,
        sourceEntity: "project",
        sourceEntityId: projectId,
      });
    }
    return rows;
  }

  private toInvestorResolverInput(rawInvestor: any, fallbackSource?: string): InvestorResolverInput {
    const raw = rawInvestor || {};
    const rawType = raw.type || raw.ventureType || raw.investorType || raw.category;
    return {
      name: raw.name || raw.title || raw.label,
      slug: raw.investorSlug || raw.slug || raw.sourceSlug,
      type: this.normalizeInvestorResolverType(rawType),
      source: raw.source || fallbackSource || (raw.id || raw.dropstabId ? "dropstab" : undefined),
      sourceId: raw.sourceId || raw.externalId || raw.id,
      sourceKey: raw.sourceKey || raw.investorSlug || raw.slug,
      sourceUrl: raw.sourceUrl || raw.detailUrl || raw.url || raw.link,
      dropstabId: raw.dropstabId || raw.id,
      website: raw.website || raw.websiteUrl,
      twitter: raw.twitter || raw.twitterUrl,
      linkedin: raw.linkedin || raw.linkedinUrl,
    };
  }

  private normalizeInvestorResolverType(value: any): "fund" | "person" | "unknown" {
    const normalized = String(value || "").toLowerCase();
    if (!normalized) return "unknown";
    if (/(angel|person|individual|founder|advisor)/.test(normalized)) return "person";
    if (/(fund|venture|capital|vc|labs|dao|investor|incubator|accelerator)/.test(normalized)) return "fund";
    return "unknown";
  }

  private investorSourceKey(sourceEntity: string, sourceEntityId: string, input: InvestorResolverInput) {
    const identity =
      input.dropstabId ||
      input.sourceId ||
      input.sourceKey ||
      input.slug ||
      this.normalizeText(input.name);
    return identity ? `${sourceEntity}:${sourceEntityId}:${identity}` : "";
  }

  private investorInputCacheKey(input: InvestorResolverInput) {
    return [
      input.type || "unknown",
      input.dropstabId || "",
      input.sourceId || "",
      input.sourceKey || "",
      this.normalizeSlug(input.slug),
      this.normalizeText(input.name),
      this.normalizeUrl(input.website),
      this.normalizeUrl(input.twitter),
      this.normalizeUrl(input.linkedin),
      this.normalizeUrl(input.sourceUrl),
    ].join("|");
  }

  private resolveInvestorInput(
    input: InvestorResolverInput,
    fundIndex: InvestorEntityIndex,
    personIndex: InvestorEntityIndex,
  ): InvestorResolutionResult {
    const stages: InvestorMatchConfig[] = [
      {
        confidence: "exact",
        matchedBy: "source",
        reason: "Exact investor source mapping, source id, source URL, or Dropstab id match.",
        score: 100,
      },
      {
        confidence: "high",
        matchedBy: "slug",
        reason: "Unique investor slug/source slug match.",
        score: 90,
      },
      {
        confidence: "high",
        matchedBy: "website/social",
        reason: "Unique exact investor website or social link match.",
        score: 85,
      },
      {
        confidence: "medium",
        matchedBy: "normalizedName",
        reason: "Unique normalized investor name or alias match.",
        score: 75,
      },
    ];

    for (const stage of stages) {
      const candidates = this.dedupeCandidates([
        ...this.investorCandidatesForInput(input, fundIndex, stage),
        ...this.investorCandidatesForInput(input, personIndex, stage),
      ]);
      const resolution = this.toInvestorResolution(candidates, input, stage);
      if (resolution.type !== "unknown" || resolution.confidence !== "none") return resolution;
    }

    return this.unknownInvestorResolution("No investor candidate matched by source id, slug, normalized name, aliases, website, or social links.");
  }

  private investorCandidatesForInput(
    input: InvestorResolverInput,
    index: InvestorEntityIndex,
    config: InvestorMatchConfig,
  ) {
    const candidates: any[] = [];
    if (config.matchedBy === "source") {
      const dropstabId = Number(input.dropstabId || input.sourceId);
      if (Number.isFinite(dropstabId)) {
        for (const entity of index.byDropstabId.get(dropstabId) || []) {
          candidates.push(this.describeInvestorEntity(entity, index.type, config.score, config.matchedBy, config.reason));
        }
      }
      for (const sourceId of this.uniqueStrings([input.sourceId, input.sourceKey, input.dropstabId])) {
        for (const entity of index.bySourceId.get(sourceId) || []) {
          candidates.push(this.describeInvestorEntity(entity, index.type, config.score, config.matchedBy, config.reason));
        }
      }
      for (const url of this.uniqueStrings([this.normalizeUrl(input.sourceUrl)])) {
        for (const entity of index.byUrl.get(url) || []) {
          candidates.push(this.describeInvestorEntity(entity, index.type, config.score, config.matchedBy, config.reason));
        }
      }
      return candidates;
    }

    if (config.matchedBy === "slug") {
      for (const slug of this.uniqueStrings([this.normalizeSlug(input.slug), this.normalizeSlug(input.sourceKey)])) {
        for (const entity of index.bySlug.get(slug) || []) {
          candidates.push(this.describeInvestorEntity(entity, index.type, config.score, config.matchedBy, config.reason));
        }
      }
      return candidates;
    }

    if (config.matchedBy === "website/social") {
      for (const url of this.uniqueStrings([
        this.normalizeUrl(input.website),
        this.normalizeUrl(input.twitter),
        this.normalizeUrl(input.linkedin),
        this.normalizeUrl(input.sourceUrl),
      ])) {
        for (const entity of index.byUrl.get(url) || []) {
          candidates.push(this.describeInvestorEntity(entity, index.type, config.score, config.matchedBy, config.reason));
        }
      }
      return candidates;
    }

    if (config.matchedBy === "normalizedName") {
      for (const name of this.uniqueStrings([this.normalizeText(input.name)])) {
        for (const entity of index.byName.get(name) || []) {
          candidates.push(this.describeInvestorEntity(entity, index.type, config.score, config.matchedBy, config.reason));
        }
      }
    }

    return candidates;
  }

  private toInvestorResolution(
    candidates: any[],
    input: InvestorResolverInput,
    config: InvestorMatchConfig,
  ): InvestorResolutionResult {
    if (!candidates.length) return this.unknownInvestorResolution(`No investor candidate matched by ${config.matchedBy}.`);

    if (candidates.length > 1 || new Set(candidates.map((candidate) => candidate.type)).size > 1) {
      return {
        type: "ambiguous",
        confidence: "none",
        matchedBy: config.matchedBy,
        reason: `Ambiguous investor match: ${candidates.length} candidates matched by ${config.matchedBy}.`,
        candidates,
      };
    }

    const candidate = candidates[0];
    const inputType = this.normalizeInvestorResolverType(input.type);
    if (["medium", "low"].includes(config.confidence) && inputType !== "unknown" && inputType !== candidate.type) {
      return {
        type: "ambiguous",
        confidence: "none",
        matchedBy: "typeMismatch",
        reason: `Input investor type is ${inputType}, but only ${candidate.type} matched at ${config.confidence} confidence.`,
        candidates,
      };
    }

    return {
      type: candidate.type,
      fundId: candidate.type === "fund" ? candidate.id : undefined,
      personId: candidate.type === "person" ? candidate.id : undefined,
      confidence: config.confidence,
      matchedBy: config.matchedBy,
      reason: config.reason,
      candidates,
    };
  }

  private unknownInvestorResolution(reason: string): InvestorResolutionResult {
    return {
      type: "unknown",
      confidence: "none",
      matchedBy: "none",
      reason,
      candidates: [],
    };
  }

  private createInvestorEntityIndex(entities: any[], type: "fund" | "person"): InvestorEntityIndex {
    const byDropstabId = new Map<number, any[]>();
    const bySlug = new Map<string, any[]>();
    const byName = new Map<string, any[]>();
    const bySourceId = new Map<string, any[]>();
    const byUrl = new Map<string, any[]>();
    for (const entity of entities) {
      if (Number.isFinite(entity.dropstabId)) this.addToMap(byDropstabId, entity.dropstabId, entity);
      for (const slug of this.uniqueStrings([
        this.normalizeSlug(entity.slug),
        this.normalizeSlug(entity.sourceKey),
        ...(Array.isArray(entity.sourceMappings)
          ? entity.sourceMappings.map((mapping: any) => this.normalizeSlug(mapping?.sourceSlug))
          : []),
      ])) {
        this.addToMap(bySlug, slug, entity);
      }
      for (const sourceId of this.uniqueStrings([
        entity.sourceKey,
        entity.dropstabId,
        ...(Array.isArray(entity.sourceMappings)
          ? entity.sourceMappings.map((mapping: any) => mapping?.sourceId)
          : []),
      ])) {
        this.addToMap(bySourceId, sourceId, entity);
      }
      for (const name of this.uniqueStrings([
        this.normalizeText(entity.normalizedName || entity.name),
        ...(Array.isArray(entity.aliases) ? entity.aliases.map((alias: any) => this.normalizeText(alias)) : []),
      ])) {
        this.addToMap(byName, name, entity);
      }
      for (const url of this.uniqueStrings(this.investorEntityUrls(entity))) {
        this.addToMap(byUrl, url, entity);
      }
    }
    return { type, byDropstabId, bySlug, byName, bySourceId, byUrl };
  }

  private investorEntityProjection() {
    return {
      _id: 1,
      name: 1,
      slug: 1,
      sourceKey: 1,
      dropstabId: 1,
      normalizedName: 1,
      aliases: 1,
      sourceMappings: 1,
      website: 1,
      websiteUrl: 1,
      twitterUrl: 1,
      linkedinUrl: 1,
      links: 1,
      socialmedia: 1,
      type: 1,
    };
  }

  private async findProject(idOrSlug: string): Promise<any | null> {
    const or: any[] = [
      { slug: idOrSlug },
      { sourceId: idOrSlug },
      { "rawIcoData.slug": idOrSlug },
      { "rawIcoData.sourceId": idOrSlug },
    ];
    if (Types.ObjectId.isValid(idOrSlug)) or.unshift({ _id: new Types.ObjectId(idOrSlug) });
    return this.projectModel.collection.findOne(
      { $or: or },
      {
        projection: {
          _id: 1,
          projectType: 1,
          source: 1,
          sourceId: 1,
          sourceUrl: 1,
          detailUrl: 1,
          name: 1,
          symbol: 1,
          slug: 1,
          ticker: 1,
          niche: 1,
          investors: 1,
          rawIcoData: 1,
        },
      },
    );
  }

  private createEmptyProjectIndex(): ProjectIndex {
    return {
      bySlug: new Map(),
      bySymbol: new Map(),
      byName: new Map(),
      bySourceSlug: new Map(),
      bySourceId: new Map(),
      byId: new Map(),
    };
  }

  private addProjectToIndex(project: ProjectLite, index: ProjectIndex) {
    index.byId.set(this.stringifyId(project._id), project);
    for (const slug of this.projectSlugs(project)) this.addToMap(index.bySlug, slug, project);
    for (const symbol of this.projectSymbols(project)) this.addToMap(index.bySymbol, symbol, project);
    for (const name of this.projectNames(project).map((value) => this.normalizeText(value)).filter(Boolean)) {
      this.addToMap(index.byName, name, project);
    }
    const source = this.normalizedSource(project.source);
    if (source) {
      for (const slug of this.projectSlugs(project)) this.addToMap(index.bySourceSlug, this.sourceKey(source, slug), project);
      if (project.sourceId) this.addToMap(index.bySourceId, this.sourceKey(source, String(project.sourceId)), project);
    }
  }

  private rowSlugs(row: any): string[] {
    const unlockEvents = this.unlockEventSamples(row);
    return this.uniqueStrings([
      row.coinSlug,
      row.projectSlug,
      row.slug,
      row.sourceSlug,
      row.nextUnlockEvent?.coinSlug,
      row.nextUnlockEvent?.projectSlug,
      row.intelSyncMeta?.coinSlug,
      row.intelSyncMeta?.project_slug,
      ...unlockEvents.flatMap((event: any) => [event?.coinSlug, event?.projectSlug]),
    ].map((value) => this.normalizeSlug(value)));
  }

  private rowSourceIds(row: any): string[] {
    const unlockEvents = this.unlockEventSamples(row);
    return this.uniqueStrings([
      row.sourceId,
      row.sourceKey,
      row.roundId,
      row.id,
      row.coinId,
      row.nextUnlockEvent?.sourceId,
      row.nextUnlockEvent?.sourceKey,
      row.nextUnlockEvent?.projectKey,
      row.nextUnlockEvent?.coinId,
      ...unlockEvents.flatMap((event: any) => [
        event?.sourceId,
        event?.sourceKey,
        event?.projectKey,
        event?.coinId,
      ]),
    ].map((value) => (value === undefined || value === null ? "" : String(value))));
  }

  private rowSymbols(row: any): string[] {
    const unlockEvents = this.unlockEventSamples(row);
    return this.uniqueStrings([
      row.coinSymbol,
      row.symbol,
      row.ticker,
      row.detailed?.symbol,
      row.nextUnlockEvent?.symbol,
      row.nextUnlockEvent?.coinSymbol,
      ...unlockEvents.flatMap((event: any) => [event?.symbol, event?.coinSymbol]),
    ].map((value) => this.normalizeSymbol(value)));
  }

  private rowNames(row: any): string[] {
    const unlockEvents = this.unlockEventSamples(row);
    return this.uniqueStrings([
      row.projectName,
      row.name,
      row.detailed?.name,
      row.nextUnlockEvent?.projectName,
      row.nextUnlockEvent?.name,
      ...unlockEvents.flatMap((event: any) => [event?.projectName, event?.name]),
    ].filter(Boolean));
  }

  private rowSources(row: any): string[] {
    const unlockEvents = this.unlockEventSamples(row);
    return this.uniqueStrings([
      row.source,
      ...(Array.isArray(row.sources) ? row.sources : []),
      ...(Array.isArray(row.icoPlatforms) ? row.icoPlatforms : []),
      row.nextUnlockEvent?.source,
      ...unlockEvents.map((event: any) => event?.source),
    ].map((value) => this.normalizedSource(value)));
  }

  private unlockEventSamples(row: any): any[] {
    return [
      ...(Array.isArray(row.unlockEvents) ? row.unlockEvents : []),
      ...(Array.isArray(row.intelNormalizedEvents) ? row.intelNormalizedEvents : []),
    ];
  }

  private projectSlugs(project: any): Set<string> {
    return new Set(this.uniqueStrings([
      project.slug,
      project.sourceId,
      project.rawIcoData?.slug,
      project.rawIcoData?.sourceId,
      project.rawIcoData?.dropstabSlug,
      project.rawIcoData?.coinSlug,
      project.rawIcoData?.coin_slug,
    ].map((value) => this.normalizeSlug(value))));
  }

  private projectSymbols(project: any): Set<string> {
    return new Set(this.uniqueStrings([
      project.symbol,
      project.ticker,
      project.niche,
      project.rawIcoData?.symbol,
      project.rawIcoData?.ticker,
    ].map((value) => this.normalizeSymbol(value))));
  }

  private projectNames(project: any): string[] {
    return this.uniqueStrings([
      project.name,
      project.rawIcoData?.name,
      project.rawIcoData?.projectName,
    ].filter(Boolean));
  }

  private uniqueInvestors(rows: any[]) {
    const map = new Map<string, any>();
    for (const row of rows) {
      const investors = [
        ...(Array.isArray(row.investors) ? row.investors : []),
        ...(Array.isArray(row.leadInvestors) ? row.leadInvestors : []),
      ];
      for (const investor of investors) {
        const slug = this.normalizeSlug(investor.investorSlug || investor.slug);
        const name = String(investor.name || "").trim();
        const id = Number(investor.id);
        const key = slug || (Number.isFinite(id) ? `id:${id}` : this.normalizeText(name));
        if (!key || map.has(key)) continue;
        map.set(key, { id, name, slug, ventureType: investor.ventureType || investor.type });
      }
    }
    return Array.from(map.values());
  }

  private projectMatchResolution(
    match: { unique: boolean; project: ProjectLite; candidates: ProjectLite[] },
    confidence: Confidence,
    matchedBy: string,
    reason: string,
    unsafe = false,
  ): Resolution | null {
    if (match.unique) {
      return {
        ...this.projectResolution(match.project, confidence, matchedBy, reason),
        ...(unsafe ? { unsafe: true } : {}),
      };
    }

    if (match.candidates.length > 1) {
      const typedResolution = unsafe
        ? null
        : this.typedProjectResolution(match.candidates, confidence, matchedBy, reason);
      return typedResolution || this.ambiguousResolution(match.candidates, matchedBy, unsafe);
    }

    return null;
  }

  private typedProjectResolution(
    projects: ProjectLite[],
    confidence: Confidence,
    matchedBy: string,
    reason: string,
  ): Resolution | null {
    const candidates = this.dedupeProjects(projects);
    const typedCandidates = candidates
      .map((project) => ({ project, projectType: this.projectLinkType(project) }))
      .filter((item): item is { project: ProjectLite; projectType: ProjectLinkType } => Boolean(item.projectType));
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
    const typedReason = `${reason}; resolved as a market/project typed pair.`;

    return {
      projectId: this.stringifyId(primary.project._id),
      projectType: primary.projectType,
      projectLinks: typedCandidates.map((item) =>
        this.toProjectEntityLink(item.project, item.projectType, confidence, matchedBy, typedReason),
      ),
      confidence,
      reason: typedReason,
      matchedBy,
      candidates: typedCandidates.map((item) => this.toProjectCandidate(item.project, this.scoreForConfidence(confidence), typedReason)),
    };
  }

  private projectResolution(project: ProjectLite, confidence: Confidence, matchedBy: string, reason: string): Resolution {
    const projectType = this.projectLinkType(project);
    return {
      projectId: this.stringifyId(project._id),
      ...(projectType ? { projectType } : {}),
      ...(projectType ? { projectLinks: [this.toProjectEntityLink(project, projectType, confidence, matchedBy, reason)] } : {}),
      confidence,
      reason,
      matchedBy,
      candidates: [this.toProjectCandidate(project, this.scoreForConfidence(confidence), reason)],
    };
  }

  private ambiguousResolution(projects: ProjectLite[], matchedBy: string, unsafe = false): Resolution {
    return {
      projectId: null,
      confidence: "none",
      reason: `Multiple project candidates matched by ${matchedBy}.`,
      matchedBy,
      unsafe,
      candidates: projects.slice(0, 10).map((project) => this.toProjectCandidate(project, 50, matchedBy)),
    };
  }

  private toProjectCandidate(project: ProjectLite, score: number, reason: string): Candidate {
    return {
      projectId: this.stringifyId(project._id),
      name: project.name || "",
      symbol: project.symbol,
      slug: project.slug,
      projectType: project.projectType,
      score,
      reason,
    };
  }

  private toProjectEntityLink(
    project: ProjectLite,
    projectType: ProjectLinkType,
    confidence: Confidence,
    matchedBy: string,
    reason: string,
  ): ProjectEntityLink {
    return {
      projectId: this.stringifyId(project._id),
      projectType,
      confidence,
      matchedBy,
      reason,
    };
  }

  private projectLinkType(project: { projectType?: any }): ProjectLinkType | null {
    const projectType = String(project?.projectType || "").trim().toLowerCase();
    if (projectType === "market" || projectType === "project") return projectType;
    return null;
  }

  private investorEntityUrls(entity: any): string[] {
    return [
      this.normalizeUrl(entity.website),
      this.normalizeUrl(entity.websiteUrl),
      this.normalizeUrl(entity.twitterUrl),
      this.normalizeUrl(entity.linkedinUrl),
      ...(Array.isArray(entity.links)
        ? entity.links.flatMap((link: any) => [this.normalizeUrl(link?.url), this.normalizeUrl(link?.link)])
        : []),
      ...(Array.isArray(entity.socialmedia)
        ? entity.socialmedia.flatMap((link: any) => [this.normalizeUrl(link?.url), this.normalizeUrl(link?.link)])
        : []),
      ...(Array.isArray(entity.sourceMappings)
        ? entity.sourceMappings.map((mapping: any) => this.normalizeUrl(mapping?.sourceUrl))
        : []),
    ].filter(Boolean);
  }

  private describeInvestorEntity(
    entity: any,
    type: "fund" | "person",
    score: number,
    matchedBy: string,
    reason: string,
  ) {
    return {
      type,
      id: entity._id,
      name: entity.name,
      slug: entity.slug,
      dropstabId: entity.dropstabId,
      score,
      matchedBy,
      reason,
    };
  }

  private dedupeCandidates(candidates: any[]) {
    const map = new Map<string, any>();
    for (const candidate of candidates) {
      const key = `${candidate.type}:${this.stringifyId(candidate.id)}`;
      const existing = map.get(key);
      if (!existing || existing.score < candidate.score) map.set(key, candidate);
    }
    return Array.from(map.values()).sort((a, b) => b.score - a.score);
  }

  private buildSourceMapQuery(sourceSlugsBySource: Map<string, Set<string>>, sourceIdsBySource: Map<string, Set<string>>) {
    const or: any[] = [];
    for (const [source, values] of sourceSlugsBySource.entries()) {
      if (values.size) or.push({ source, sourceSlug: { $in: Array.from(values) } });
    }
    for (const [source, values] of sourceIdsBySource.entries()) {
      if (values.size) or.push({ source, sourceId: { $in: Array.from(values) } });
    }
    return or.length ? { $or: or } : null;
  }

  private sourceKey(source: string, value: string) {
    return `${source}:${value}`;
  }

  private unique(projects?: ProjectLite[]) {
    const candidates = this.dedupeProjects(projects || []);
    return {
      unique: candidates.length === 1,
      project: candidates[0],
      candidates,
    };
  }

  private dedupeProjects(projects: ProjectLite[]) {
    const map = new Map<string, ProjectLite>();
    for (const project of projects) map.set(this.stringifyId(project._id), project);
    return Array.from(map.values());
  }

  private intersection(left: ProjectLite[], right: ProjectLite[]) {
    const rightIds = new Set(right.map((project) => this.stringifyId(project._id)));
    return this.dedupeProjects(left.filter((project) => rightIds.has(this.stringifyId(project._id))));
  }

  private addToMap<TKey, TValue>(map: Map<TKey, TValue[]>, key: TKey, value: TValue) {
    const values = map.get(key) || [];
    values.push(value);
    map.set(key, values);
  }

  private pushSet(map: Map<string, Set<string>>, key: string, value: string) {
    const set = map.get(key) || new Set<string>();
    set.add(value);
    map.set(key, set);
  }

  private normalizeSlug(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private normalizeText(value: any): string {
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

  private normalizedSource(value: any): string {
    return String(value || "").trim().toLowerCase();
  }

  private normalizeUrl(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/[?#].*$/, "")
      .replace(/\/+$/, "");
  }

  private uniqueStrings(values: any[]): string[] {
    return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
  }

  private isObjectIdLike(value: any): boolean {
    if (!value) return false;
    if (value instanceof Types.ObjectId) return true;
    return typeof value === "string" && Types.ObjectId.isValid(value);
  }

  private hasProjectLinks(value: any): boolean {
    return Array.isArray(value) && value.some((link) => this.isObjectIdLike(link?.projectId));
  }

  private formatProjectLinks(value: any): ProjectEntityLink[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((link) => ({
        projectId: this.stringifyId(link?.projectId),
        projectType: this.projectLinkType(link) as ProjectLinkType,
        confidence: link?.confidence as Confidence,
        matchedBy: String(link?.matchedBy || ""),
        reason: String(link?.reason || ""),
      }))
      .filter((link) => Boolean(link.projectId && link.projectType));
  }

  private stringifyId(value: any): string {
    if (!value) return "";
    return typeof value === "string" ? value : value.toString();
  }

  private scoreForConfidence(confidence: Confidence): number {
    if (confidence === "exact") return 100;
    if (confidence === "high") return 90;
    if (confidence === "medium") return 70;
    if (confidence === "low") return 40;
    return 0;
  }

  private toAdminLimit(value: any, fallback = 0, maximum = 5_000) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(maximum, Math.trunc(parsed));
  }

  private pickSamples<T>(rows: T[], limit: number): T[] {
    return rows.slice(0, limit);
  }

  private extractProjectRawInvestors(project: any): any[] {
    const raw = project.rawIcoData || {};
    const values = [
      ...(Array.isArray(raw.uiInvestors) ? raw.uiInvestors : []),
      ...(Array.isArray(raw.investors) ? raw.investors : []),
    ];
    return values.filter(Boolean);
  }

  private projectWarnings(project: any, context: any): string[] {
    const warnings: string[] = [];
    if (!project.source && !project.sourceId) warnings.push("Project has no source/sourceId for exact source mapping.");
    if (!project.slug && !project.rawIcoData?.slug) warnings.push("Project has no canonical slug/raw ICO slug.");
    if (!context.investorObjectIds && context.rawInvestors.length) warnings.push("Project has raw investors, but no ObjectId investors backrefs.");
    return warnings;
  }
}
