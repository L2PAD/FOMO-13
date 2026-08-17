import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import {
  CoinGeckoResolutionResult,
  ResolvedCoinGeckoProject,
} from "./coingecko-market.types";
import {
  ProjectSourceMap,
  ProjectSourceMapDocument,
} from "src/projects/intel-sync/models/project-source-map.model";
import { COINGECKO_HOT_ID_OVERRIDES } from "./coingecko-hot-overrides";

interface ProjectMappingCandidate {
  _id: mongoose.Types.ObjectId;
  rank?: number;
  slug?: string;
  symbol?: string;
  name?: string;
  source?: string;
  sourceId?: string;
  rawIcoData?: any;
  tokenMetrics?: any;
}

@Injectable()
export class CoinGeckoProjectResolverService {
  constructor(
    @InjectModel(ProjectSourceMap.name)
    private readonly sourceMapModel: Model<ProjectSourceMapDocument>,
  ) {}

  async resolveProjects(projects: ProjectMappingCandidate[]): Promise<CoinGeckoResolutionResult> {
    if (!projects.length) {
      return { resolved: [], skippedUnmapped: 0 };
    }

    const verifiedMaps = await this.sourceMapModel
      .find({
        source: "coingecko",
        isVerified: true,
        projectId: { $in: projects.map((project) => project._id) },
      })
      .sort({ confidence: -1 })
      .lean();

    const verifiedMapByProjectId = new Map<string, any>();
    for (const sourceMap of verifiedMaps as any[]) {
      const projectId = sourceMap.projectId?.toString();
      const coingeckoId = this.normalizeCoinGeckoId(sourceMap.sourceId || sourceMap.sourceSlug);
      if (!projectId || !coingeckoId || verifiedMapByProjectId.has(projectId)) continue;
      verifiedMapByProjectId.set(projectId, { coingeckoId, sourceMap });
    }

    const resolved: ResolvedCoinGeckoProject[] = [];
    let skippedUnmapped = 0;

    for (const project of projects) {
      const projectId = project._id.toString();
      const verifiedMap = verifiedMapByProjectId.get(projectId);
      const rawIcoDataId = this.normalizeCoinGeckoId(
        project.rawIcoData?.coingeckoId || project.rawIcoData?.marketData?.coingeckoId,
      );
      const tokenMetricsId = this.normalizeCoinGeckoId(project.tokenMetrics?.coingeckoId);
      const manualOverrideId = this.resolveManualOverride(project);
      const safeSlug = this.resolveSafeSlugFallback(project);

      if (verifiedMap?.coingeckoId) {
        resolved.push(this.toResolvedProject(project, verifiedMap.coingeckoId, "source_map"));
      } else if (manualOverrideId) {
        resolved.push(this.toResolvedProject(project, manualOverrideId, "manual_override"));
      } else if (rawIcoDataId) {
        resolved.push(this.toResolvedProject(project, rawIcoDataId, "rawIcoData"));
      } else if (tokenMetricsId) {
        resolved.push(this.toResolvedProject(project, tokenMetricsId, "tokenMetrics"));
      } else if (safeSlug) {
        resolved.push(this.toResolvedProject(project, safeSlug, "safe_slug"));
      } else {
        skippedUnmapped += 1;
      }
    }

    return { resolved, skippedUnmapped };
  }

  private toResolvedProject(
    project: ProjectMappingCandidate,
    coingeckoId: string,
    mappingMethod: ResolvedCoinGeckoProject["mappingMethod"],
  ): ResolvedCoinGeckoProject {
    return {
      projectId: project._id.toString(),
      coingeckoId,
      mappingMethod,
      rank: project.rank,
      slug: project.slug,
      symbol: project.symbol,
      name: project.name,
    };
  }

  private resolveManualOverride(project: ProjectMappingCandidate): string | null {
    const slug = this.normalizeCoinGeckoId(project.slug);
    if (!slug) return null;
    return this.normalizeCoinGeckoId(COINGECKO_HOT_ID_OVERRIDES[slug]);
  }

  private resolveSafeSlugFallback(project: ProjectMappingCandidate): string | null {
    if (!this.isSafeSlugFallbackEnabled()) return null;

    const slug = this.normalizeCoinGeckoId(project.slug);
    if (!slug || !/^[a-z0-9][a-z0-9-]{1,120}$/.test(slug)) return null;

    const source = String(project.source || "").trim().toLowerCase();
    const rawSource = String(project.rawIcoData?.source || project.rawIcoData?.provider || "")
      .trim()
      .toLowerCase();

    if (source === "coingecko" || rawSource === "coingecko") return slug;

    const allowRankedFallback =
      String(process.env.COINGECKO_ALLOW_RANKED_SLUG_FALLBACK || "false").toLowerCase() === "true";
    if (allowRankedFallback && Number(project.rank || 0) > 0) return slug;

    return null;
  }

  private isSafeSlugFallbackEnabled(): boolean {
    const explicit = process.env.COINGECKO_ALLOW_SAFE_SLUG_FALLBACK;
    if (explicit !== undefined) {
      return ["1", "true", "yes", "on"].includes(explicit.trim().toLowerCase());
    }

    return false;
  }

  private normalizeCoinGeckoId(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase();
  }
}
