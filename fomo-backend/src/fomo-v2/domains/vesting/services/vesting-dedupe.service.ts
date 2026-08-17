import { Injectable } from "@nestjs/common";

export interface FomoV2VestingDedupeGroup<TCandidate = any> {
  key: string;
  count: number;
  candidates: TCandidate[];
}

export interface FomoV2VestingDedupeResult<TCandidate = any> {
  unique: TCandidate[];
  duplicateGroups: FomoV2VestingDedupeGroup<TCandidate>[];
}

@Injectable()
export class FomoV2VestingDedupeService {
  dedupeByCandidateKey<TCandidate extends { candidateKey: string }>(
    candidates: TCandidate[]
  ): FomoV2VestingDedupeResult<TCandidate> {
    const groups = new Map<string, TCandidate[]>();
    for (const candidate of candidates) {
      const key = candidate.candidateKey || "unknown";
      groups.set(key, [...(groups.get(key) || []), candidate]);
    }
    const unique: TCandidate[] = [];
    const duplicateGroups: FomoV2VestingDedupeGroup<TCandidate>[] = [];
    for (const [key, group] of groups.entries()) {
      if (group.length > 1) {
        duplicateGroups.push({ key, count: group.length, candidates: group });
      }
      unique.push(group[0]);
    }
    return { unique, duplicateGroups };
  }
}
