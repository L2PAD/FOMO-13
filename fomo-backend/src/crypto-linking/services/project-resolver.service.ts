import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Project } from "src/projects/project.model";
import { ProjectSourceMap } from "src/projects/intel-sync/models/project-source-map.model";

export type ProjectResolverConfidence = "exact" | "high" | "medium" | "low" | "none";
export type ProjectResolverLinkType = "market" | "project";

export type ProjectResolverInput = {
  source?: string;
  sourceId?: string | number;
  sourceKey?: string | number;
  externalId?: string | number;
  sourceUrl?: string;
  coinSlug?: string;
  slug?: string;
  name?: string;
  symbol?: string;
  coinGeckoId?: string | number;
  coinMarketCapId?: string | number;
  dropstabId?: string | number;
  cryptorankId?: string | number;
  icodropsId?: string | number;
};

export type ProjectResolverCandidate = {
  projectId: Types.ObjectId;
  name: string;
  symbol?: string;
  slug?: string;
  projectType?: string;
  score: number;
  reason: string;
};

export type ProjectResolverProjectLink = {
  projectId: Types.ObjectId;
  projectType: ProjectResolverLinkType;
  confidence: ProjectResolverConfidence;
  matchedBy: string;
  reason: string;
};

export type ProjectResolverResult = {
  projectId: Types.ObjectId | null;
  projectType?: ProjectResolverLinkType;
  projectLinks?: ProjectResolverProjectLink[];
  confidence: ProjectResolverConfidence;
  reason: string;
  matchedBy: string;
  unsafe?: boolean;
  candidates?: ProjectResolverCandidate[];
};

type ProjectCandidateDoc = {
  _id: Types.ObjectId;
  name?: string;
  projectType?: string;
  symbol?: string;
  slug?: string;
  source?: string;
  sourceId?: string;
  rawIcoData?: any;
};

type ResolutionConfig = {
  confidence: ProjectResolverConfidence;
  matchedBy: string;
  reason: string;
  unsafe?: boolean;
};

@Injectable()
export class ProjectResolverService {
  constructor(
    @InjectModel(Project.name) private readonly projectModel: Model<Project>,
    @InjectModel(ProjectSourceMap.name)
    private readonly sourceMapModel: Model<ProjectSourceMap>,
  ) {}

  async resolve(input: ProjectResolverInput): Promise<ProjectResolverResult> {
    const normalized = this.normalizeInput(input);

    const sourceResult = await this.resolveBySourceMapping(normalized);
    if (sourceResult.confidence !== "none") return sourceResult;

    const providerResult = await this.resolveByProviderIds(normalized);
    if (providerResult.confidence !== "none") return providerResult;

    const slugResult = await this.resolveBySlug(normalized);
    if (slugResult.confidence !== "none") return slugResult;

    const nameSymbolResult = await this.resolveByNameAndSymbol(normalized);
    if (nameSymbolResult.confidence !== "none") return nameSymbolResult;

    const nameResult = await this.resolveByName(normalized);
    if (nameResult.confidence !== "none") return nameResult;

    const symbolResult = await this.resolveBySymbol(normalized);
    if (symbolResult.confidence !== "none") return symbolResult;

    return this.noMatch("No exact source mapping, provider id, slug, name+symbol, name, or symbol candidate found.");
  }

  async resolveMany(inputs: ProjectResolverInput[]): Promise<ProjectResolverResult[]> {
    const results: ProjectResolverResult[] = [];
    for (const input of inputs) {
      results.push(await this.resolve(input));
    }
    return results;
  }

  private async resolveBySourceMapping(input: NormalizedProjectResolverInput): Promise<ProjectResolverResult> {
    if (!input.source) return this.noMatch("Missing source for exact source mapping.");

    const sourceIds = this.uniqueStrings([input.sourceId, input.sourceKey, input.externalId]);
    const slugs = this.uniqueStrings([input.slug, input.coinSlug]);
    const urls = this.uniqueStrings([input.sourceUrl, input.normalizedSourceUrl]);

    const sourceMapOr: any[] = [];
    if (sourceIds.length) sourceMapOr.push({ source: input.source, sourceId: { $in: sourceIds } });
    if (slugs.length) sourceMapOr.push({ source: input.source, sourceSlug: { $in: slugs } });
    if (urls.length) sourceMapOr.push({ source: input.source, sourceUrl: { $in: urls } });

    const sourceMapResult = await this.resolveFromSourceMaps(sourceMapOr, {
      confidence: "exact",
      matchedBy: "sourceMapping",
      reason: "Exact project_source_maps match by source and source identifier.",
    });
    if (sourceMapResult.confidence !== "none") return sourceMapResult;

    const legacyOr: any[] = [];
    if (sourceIds.length) legacyOr.push({ source: input.source, sourceId: { $in: sourceIds } });
    if (urls.length) {
      legacyOr.push(
        { source: input.source, detailUrl: { $in: urls } },
        { source: input.source, sourceUrl: { $in: urls } },
      );
    }

    return this.resolveFromProjects(legacyOr, {
      confidence: "exact",
      matchedBy: "legacyProjectSource",
      reason: "Exact legacy Project source/sourceId/sourceUrl match.",
    });
  }

  private async resolveByProviderIds(input: NormalizedProjectResolverInput): Promise<ProjectResolverResult> {
    const providers: Array<{ source: string; ids: string[]; projectOr: any[] }> = [
      {
        source: "coingecko",
        ids: this.uniqueStrings([input.coinGeckoId]),
        projectOr: this.providerProjectQuery("coingeckoId", input.coinGeckoId, [
          "rawIcoData.coingeckoId",
          "rawIcoData.marketData.coingeckoId",
          "tokenMetrics.coingeckoId",
        ]),
      },
      {
        source: "coinmarketcap",
        ids: this.uniqueStrings([input.coinMarketCapId]),
        projectOr: this.providerProjectQuery("coinMarketCapId", input.coinMarketCapId, [
          "rawIcoData.coinMarketCapId",
          "rawIcoData.marketData.coinMarketCapId",
          "tokenMetrics.coinMarketCapId",
        ]),
      },
      {
        source: "dropstab",
        ids: this.uniqueStrings([input.dropstabId]),
        projectOr: [
          ...this.providerProjectQuery("dropstabId", input.dropstabId, [
            "rawIcoData.dropstabId",
            "rawIcoData.dropstabSlug",
          ]),
          ...this.numericProviderProjectQuery("capId", input.dropstabId),
        ],
      },
      {
        source: "cryptorank",
        ids: this.uniqueStrings([input.cryptorankId]),
        projectOr: this.providerProjectQuery("cryptorankId", input.cryptorankId, [
          "rawIcoData.cryptorankId",
        ]),
      },
      {
        source: "icodrops",
        ids: this.uniqueStrings([input.icodropsId]),
        projectOr: this.providerProjectQuery("icodropsId", input.icodropsId, [
          "sourceId",
          "rawIcoData.sourceId",
          "rawIcoData.icodropsId",
        ]),
      },
    ];

    for (const provider of providers) {
      if (!provider.ids.length) continue;

      const sourceMapResult = await this.resolveFromSourceMaps(
        [
          { source: provider.source, sourceId: { $in: provider.ids } },
          { source: provider.source, sourceSlug: { $in: provider.ids } },
        ],
        {
          confidence: "exact",
          matchedBy: `${provider.source}SourceMap`,
          reason: `Exact ${provider.source} project_source_maps provider id match.`,
        },
      );
      if (sourceMapResult.confidence !== "none") return sourceMapResult;

      const projectResult = await this.resolveFromProjects(provider.projectOr, {
        confidence: "exact",
        matchedBy: `${provider.source}ProviderId`,
        reason: `Exact ${provider.source} provider id match on Project fields.`,
      });
      if (projectResult.confidence !== "none") return projectResult;
    }

    return this.noMatch("No provider id candidate found.");
  }

  private async resolveBySlug(input: NormalizedProjectResolverInput): Promise<ProjectResolverResult> {
    const slugs = this.uniqueStrings([input.slug, input.coinSlug]);
    if (!slugs.length) return this.noMatch("Missing slug.");

    return this.resolveFromProjects(
      [
        { slug: { $in: slugs } },
        { sourceId: { $in: slugs } },
        { "rawIcoData.slug": { $in: slugs } },
        { "rawIcoData.sourceId": { $in: slugs } },
        { "rawIcoData.dropstabSlug": { $in: slugs } },
        { "sourceMappings.sourceSlug": { $in: slugs } },
      ],
      {
        confidence: "high",
        matchedBy: "slug",
        reason: "Unique canonical/source slug match.",
      },
    );
  }

  private async resolveByNameAndSymbol(input: NormalizedProjectResolverInput): Promise<ProjectResolverResult> {
    if (!input.normalizedName || !input.symbol) {
      return this.noMatch("Missing name or symbol for name+symbol matching.");
    }

    return this.resolveFromProjects(
      [
        {
          $and: [
            {
              $or: [
                { normalizedName: input.normalizedName },
                { name: input.name },
                { "rawIcoData.name": input.name },
              ],
            },
            {
              $or: [
                { symbol: input.symbol },
                { ticker: input.symbol },
                { niche: input.symbol },
                { "rawIcoData.symbol": input.symbol },
                { "rawIcoData.ticker": input.symbol },
              ],
            },
          ],
        },
      ],
      {
        confidence: "high",
        matchedBy: "name+symbol",
        reason: "Unique normalized name and symbol match.",
      },
    );
  }

  private async resolveByName(input: NormalizedProjectResolverInput): Promise<ProjectResolverResult> {
    if (!input.normalizedName) return this.noMatch("Missing name.");

    return this.resolveFromProjects(
      [
        { normalizedName: input.normalizedName },
        { name: input.name },
        { "rawIcoData.name": input.name },
        { aliases: input.name },
      ],
      {
        confidence: "medium",
        matchedBy: "normalizedName",
        reason: "Unique normalized name match.",
      },
    );
  }

  private async resolveBySymbol(input: NormalizedProjectResolverInput): Promise<ProjectResolverResult> {
    if (!input.symbol) return this.noMatch("Missing symbol.");

    return this.resolveFromProjects(
      [
        { symbol: input.symbol },
        { ticker: input.symbol },
        { niche: input.symbol },
        { "rawIcoData.symbol": input.symbol },
        { "rawIcoData.ticker": input.symbol },
      ],
      {
        confidence: "low",
        matchedBy: "symbol",
        reason: "Symbol-only match is report-only and unsafe for automatic writes.",
        unsafe: true,
      },
    );
  }

  private async resolveFromSourceMaps(or: any[], config: ResolutionConfig): Promise<ProjectResolverResult> {
    if (!or.length) return this.noMatch("No source map query.");

    const sourceMaps = await this.sourceMapModel
      .find({ $or: or })
      .sort({ isVerified: -1, confidence: -1, updatedAt: -1 })
      .limit(25)
      .lean();

    const projectIds = this.uniqueStrings(
      (sourceMaps as any[])
        .map((sourceMap) => sourceMap.projectId)
        .filter(Boolean)
        .map((value) => value.toString()),
    ).filter((value) => Types.ObjectId.isValid(value));

    if (!projectIds.length) return this.noMatch("No source map project ids.");

    const projects = await this.projectModel
      .find({ _id: { $in: projectIds.map((value) => new Types.ObjectId(value)) } })
      .select(this.projectProjection())
      .limit(25)
      .lean();

    return this.toResolution(projects as any[], config);
  }

  private async resolveFromProjects(or: any[], config: ResolutionConfig): Promise<ProjectResolverResult> {
    if (!or.length) return this.noMatch("No project query.");

    const projects = await this.projectModel
      .find({ $or: or })
      .select(this.projectProjection())
      .limit(25)
      .lean();

    return this.toResolution(projects as any[], config);
  }

  private toResolution(projects: ProjectCandidateDoc[], config: ResolutionConfig): ProjectResolverResult {
    const projectDocs = this.dedupeProjects(projects);
    const candidates = projectDocs.map((project) =>
      this.toCandidate(project, this.scoreForConfidence(config.confidence), config.reason),
    );

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
      const typedResolution = config.unsafe ? null : this.toTypedResolution(candidates, config);
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

    return this.noMatch(`No project candidate matched by ${config.matchedBy}.`);
  }

  private providerProjectQuery(field: string, value: any, nestedFields: string[]): any[] {
    const ids = this.uniqueStrings([value]);
    if (!ids.length) return [];
    return [
      { [field]: { $in: ids } },
      ...nestedFields.map((nestedField) => ({ [nestedField]: { $in: ids } })),
    ];
  }

  private numericProviderProjectQuery(field: string, value: any): any[] {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return [];
    return [{ [field]: numeric }];
  }

  private normalizeInput(input: ProjectResolverInput): NormalizedProjectResolverInput {
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

  private projectProjection() {
    return {
      _id: 1,
      name: 1,
      projectType: 1,
      symbol: 1,
      slug: 1,
      source: 1,
      sourceId: 1,
      rawIcoData: 1,
    };
  }

  private toCandidate(project: ProjectCandidateDoc, score: number, reason: string): ProjectResolverCandidate {
    return {
      projectId: project._id,
      name: project.name || "",
      symbol: project.symbol || project.rawIcoData?.symbol || project.rawIcoData?.ticker,
      slug: project.slug || project.rawIcoData?.slug,
      projectType: project.projectType,
      score,
      reason,
    };
  }

  private toTypedResolution(
    candidates: ProjectResolverCandidate[],
    config: ResolutionConfig,
  ): ProjectResolverResult | null {
    const typedCandidates = candidates
      .map((candidate) => ({
        candidate,
        projectType: this.projectLinkType(candidate.projectType),
      }))
      .filter(
        (item): item is { candidate: ProjectResolverCandidate; projectType: ProjectResolverLinkType } =>
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

  private projectLinkType(value: any): ProjectResolverLinkType | null {
    const projectType = String(value || "").trim().toLowerCase();
    if (projectType === "market" || projectType === "project") return projectType;
    return null;
  }

  private dedupeProjects(projects: ProjectCandidateDoc[]): ProjectCandidateDoc[] {
    const byId = new Map<string, ProjectCandidateDoc>();
    for (const project of projects) {
      if (!project?._id) continue;
      byId.set(project._id.toString(), project);
    }
    return Array.from(byId.values());
  }

  private noMatch(reason: string): ProjectResolverResult {
    return {
      projectId: null,
      confidence: "none",
      reason,
      matchedBy: "none",
    };
  }

  private scoreForConfidence(confidence: ProjectResolverConfidence): number {
    if (confidence === "exact") return 100;
    if (confidence === "high") return 90;
    if (confidence === "medium") return 70;
    if (confidence === "low") return 40;
    return 0;
  }

  private cleanIdentifier(value: any): string {
    return String(value ?? "").trim();
  }

  private normalizeSource(value: any): string {
    return String(value || "").trim().toLowerCase();
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

  private cleanText(value: any): string {
    return String(value || "").trim();
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

type NormalizedProjectResolverInput = {
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
