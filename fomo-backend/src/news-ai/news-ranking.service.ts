/**
 * News Ranking (MIGRATED verbatim from FOMO-DATA ranking/news-ranking).
 * rankScore = 0.3*freq + 0.35*recency + 0.2*sourceWeight + 0.15*entityWeight.
 */
import { Injectable } from "@nestjs/common";
import { NewsCluster } from "./news-clustering.service";

export interface RankedCluster extends NewsCluster {
  rankScore: number;
  rankFactors: { frequency: number; recency: number; sourceWeight: number; entityWeight: number };
}

const SOURCE_WEIGHTS: Record<string, number> = {
  coindesk: 1.2, theblock: 1.2, cointelegraph: 1.1, decrypt: 1.1, bloomberg: 1.3, reuters: 1.3, forbes: 1.2,
  twitter: 0.8, reddit: 0.7, default: 1.0,
};
const TIER1_ENTITIES = new Set([
  "a16z", "paradigm", "polychain", "multicoin", "pantera", "sequoia", "binance", "coinbase", "jump", "alameda",
  "dragonfly", "framework", "variant", "haun", "standard-crypto", "bitcoin", "ethereum", "solana", "polygon",
  "arbitrum", "optimism", "base", "avalanche", "near", "cosmos",
]);

@Injectable()
export class NewsAiRanking {
  rank(clusters: NewsCluster[]): RankedCluster[] {
    const ranked = clusters.map((c) => this.scoreCluster(c));
    ranked.sort((a, b) => b.rankScore - a.rankScore);
    return ranked;
  }

  private scoreCluster(cluster: NewsCluster): RankedCluster {
    const frequency = Math.min(1.0, cluster.eventCount / 10);
    const recency = this.computeRecency(cluster.lastSeenAt);
    const sourceWeight = this.computeSourceWeight(cluster.sources);
    const entityWeight = this.computeEntityWeight(cluster.entities);
    const rankScore = frequency * 0.3 + recency * 0.35 + sourceWeight * 0.2 + entityWeight * 0.15;
    return {
      ...cluster,
      rankScore: Math.round(rankScore * 1000) / 1000,
      rankFactors: {
        frequency: Math.round(frequency * 100) / 100,
        recency: Math.round(recency * 100) / 100,
        sourceWeight: Math.round(sourceWeight * 100) / 100,
        entityWeight: Math.round(entityWeight * 100) / 100,
      },
    };
  }

  private computeRecency(date: Date): number {
    const hoursOld = (Date.now() - new Date(date).getTime()) / 3600000;
    if (hoursOld < 6) return 1.0;
    if (hoursOld < 12) return 0.95;
    if (hoursOld < 24) return 0.85;
    if (hoursOld < 48) return 0.7;
    if (hoursOld < 72) return 0.55;
    if (hoursOld < 168) return 0.4;
    return 0.25;
  }

  private computeSourceWeight(sources: string[]): number {
    if (sources.length === 0) return 0.5;
    let total = 0;
    for (const s of sources) { const k = s.toLowerCase().replace(/[^a-z]/g, ""); total += SOURCE_WEIGHTS[k] || SOURCE_WEIGHTS.default; }
    const avg = total / sources.length;
    const diversityBonus = Math.min(0.2, sources.length * 0.05);
    return Math.min(1.0, (avg / 1.3) * 0.8 + diversityBonus);
  }

  private computeEntityWeight(entities: string[]): number {
    if (entities.length === 0) return 0.5;
    let tier1 = 0;
    for (const e of entities) { const slug = e.toLowerCase().replace(/[^a-z0-9]/g, ""); if (TIER1_ENTITIES.has(slug)) tier1++; }
    return 0.5 + Math.min(0.4, tier1 * 0.1) + Math.min(0.1, entities.length * 0.02);
  }
}
