import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Project, ProjectDocument } from "src/projects/project.model";
import { MarketDataTier, ResolvedCoinGeckoProject } from "./coingecko-market.types";
import { CoinGeckoProjectResolverService } from "./coingecko-project-resolver.service";
import {
  buildCoinGeckoTierRankFilter,
  COINGECKO_TIER_ORDER,
  getCoinGeckoTierDefinition,
  getCoinGeckoTierProjectLimit,
} from "./config/coingecko-tier.config";

@Injectable()
export class CoinGeckoTierAuditService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly projectResolver: CoinGeckoProjectResolverService,
  ) {}

  async auditTiers(): Promise<any> {
    const tiers: Record<MarketDataTier, any> = {
      HOT: null,
      WARM: null,
      COLD: null,
    };
    const total = {
      projects: 0,
      withCoingeckoId: 0,
      withoutCoingeckoId: 0,
      byMappingMethod: this.emptyMethodCounts(),
    };

    for (const tier of COINGECKO_TIER_ORDER) {
      const projects = await this.loadTierProjects(tier);
      const resolution = await this.projectResolver.resolveProjects(projects as any[]);
      const byMappingMethod = this.countMappingMethods(resolution.resolved);
      const withCoingeckoId = resolution.resolved.length;
      const withoutCoingeckoId = projects.length - withCoingeckoId;
      const definition = getCoinGeckoTierDefinition(tier);
      const projectLimit = getCoinGeckoTierProjectLimit(tier);

      tiers[tier] = {
        rankRange: {
          minRank: definition.minRank,
          maxRank: definition.maxRank,
        },
        projectLimit,
        total: projects.length,
        withCoingeckoId,
        withoutCoingeckoId,
        byMappingMethod,
      };

      total.projects += projects.length;
      total.withCoingeckoId += withCoingeckoId;
      total.withoutCoingeckoId += withoutCoingeckoId;
      for (const key of Object.keys(total.byMappingMethod)) {
        total.byMappingMethod[key] += byMappingMethod[key] || 0;
      }
    }

    return {
      sourceOfTruth: "src/coingecko/config/coingecko-tier.config.ts",
      tiers,
      total,
      consistency: {
        liveUpdater: "uses COINGECKO_TIERS via MarketDataOrchestratorService",
        historyBackfill: "uses COINGECKO_TIERS via CoinGeckoHistoryBackfillService",
        unified: true,
      },
    };
  }

  private async loadTierProjects(tier: MarketDataTier): Promise<any[]> {
    const query = this.projectModel
      .find({ rank: buildCoinGeckoTierRankFilter(tier) })
      .sort({ rank: 1 })
      .select("_id rank slug symbol name source sourceId rawIcoData tokenMetrics");

    const limit = getCoinGeckoTierProjectLimit(tier);
    if (limit) query.limit(limit);

    return query.lean();
  }

  private countMappingMethods(resolved: ResolvedCoinGeckoProject[]): Record<string, number> {
    const counts = this.emptyMethodCounts();
    for (const project of resolved) {
      counts[project.mappingMethod] = (counts[project.mappingMethod] || 0) + 1;
    }
    return counts;
  }

  private emptyMethodCounts(): Record<string, number> {
    return {
      source_map: 0,
      manual_override: 0,
      rawIcoData: 0,
      tokenMetrics: 0,
      safe_slug: 0,
    };
  }
}
