/**
 * News Clustering (MIGRATED verbatim from FOMO-DATA clustering/news-clustering).
 * Groups events by type:mainEntity:dateBucket, merges clusters with Jaccard>0.5.
 * NOTE: publishedAt MUST be a real Date (normalized upstream) to avoid the
 * string-date sorting class of bug found in Phase 2.
 */
import { Injectable } from "@nestjs/common";

export interface NewsEvent {
  id: string; title: string; source: string; publishedAt: Date; type: string;
  entities: Array<{ canonicalId: string; type: string; confidence: number }>; content?: string;
}
export interface NewsCluster {
  id: string; type: string; mainEntity: string; entities: string[]; events: NewsEvent[];
  eventCount: number; score: number; firstSeenAt: Date; lastSeenAt: Date; sources: string[];
}

@Injectable()
export class NewsAiClustering {
  cluster(events: NewsEvent[]): NewsCluster[] {
    const clusters = new Map<string, NewsCluster>();
    for (const event of events) {
      const key = this.buildClusterKey(event);
      if (!clusters.has(key)) {
        clusters.set(key, {
          id: key, type: event.type, mainEntity: event.entities[0]?.canonicalId || "unknown",
          entities: [], events: [], eventCount: 0, score: 0,
          firstSeenAt: event.publishedAt, lastSeenAt: event.publishedAt, sources: [],
        });
      }
      const cluster = clusters.get(key)!;
      cluster.events.push(event);
      cluster.eventCount++;
      for (const e of event.entities) if (!cluster.entities.includes(e.canonicalId)) cluster.entities.push(e.canonicalId);
      if (event.publishedAt < cluster.firstSeenAt) cluster.firstSeenAt = event.publishedAt;
      if (event.publishedAt > cluster.lastSeenAt) cluster.lastSeenAt = event.publishedAt;
      if (!cluster.sources.includes(event.source)) cluster.sources.push(event.source);
      cluster.score = cluster.eventCount;
    }
    return this.mergeSimilarClusters([...clusters.values()]);
  }

  private buildClusterKey(event: NewsEvent): string {
    const mainEntity = event.entities[0]?.canonicalId || "unknown";
    const type = event.type || "generic";
    const dateBucket = event.publishedAt.toISOString().split("T")[0];
    return `${type}:${mainEntity}:${dateBucket}`;
  }

  private mergeSimilarClusters(clusters: NewsCluster[]): NewsCluster[] {
    if (clusters.length < 2) return clusters;
    const merged: NewsCluster[] = [];
    const used = new Set<string>();
    clusters.sort((a, b) => b.score - a.score);
    for (const cluster of clusters) {
      if (used.has(cluster.id)) continue;
      const toMerge = [cluster];
      used.add(cluster.id);
      for (const other of clusters) {
        if (used.has(other.id)) continue;
        if (cluster.type !== other.type) continue;
        if (this.calculateOverlap(cluster.entities, other.entities) > 0.5) { toMerge.push(other); used.add(other.id); }
      }
      merged.push(toMerge.length > 1 ? this.mergeClusterGroup(toMerge) : cluster);
    }
    return merged;
  }

  private calculateOverlap(a: string[], b: string[]): number {
    const setA = new Set(a); const setB = new Set(b);
    const intersection = [...setA].filter((x) => setB.has(x)).length;
    const union = new Set([...a, ...b]).size;
    return union > 0 ? intersection / union : 0;
  }

  private mergeClusterGroup(clusters: NewsCluster[]): NewsCluster {
    const allEvents = clusters.flatMap((c) => c.events);
    const allEntities = [...new Set(clusters.flatMap((c) => c.entities))];
    const allSources = [...new Set(clusters.flatMap((c) => c.sources))];
    const firstSeenAt = new Date(Math.min(...clusters.map((c) => c.firstSeenAt.getTime())));
    const lastSeenAt = new Date(Math.max(...clusters.map((c) => c.lastSeenAt.getTime())));
    const main = clusters[0];
    return {
      id: `merged:${main.type}:${main.mainEntity}`, type: main.type, mainEntity: main.mainEntity,
      entities: allEntities, events: allEvents, eventCount: allEvents.length, score: allEvents.length,
      firstSeenAt, lastSeenAt, sources: allSources,
    };
  }
}
