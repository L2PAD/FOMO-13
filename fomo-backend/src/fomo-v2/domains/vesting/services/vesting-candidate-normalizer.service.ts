import { Injectable } from "@nestjs/common";
import { Types } from "mongoose";
import {
  buildDropstabCandidateKey,
  buildDropstabSourceRef,
  cleanVestingString,
  DropstabVestingSourceContext,
  dropstabVestingProjectIdentity,
  firstFiniteNumber,
  normalizeDropstabSourceType,
  normalizeVestingName,
  toDropstabVestingIdString,
  toVestingDate,
} from "../helpers";
import {
  FomoV2TokenAllocationInput,
  FomoV2VestingRoundInput,
  FomoV2VestingScheduleInput,
} from "../types";

export interface FomoV2NormalizedAllocationCandidate
  extends FomoV2TokenAllocationInput {
  candidateKey: string;
}

export interface FomoV2NormalizedRoundCandidate
  extends FomoV2VestingRoundInput {
  candidateKey: string;
}

export interface FomoV2NormalizedScheduleCandidate
  extends FomoV2VestingScheduleInput {
  candidateKey: string;
}

export interface FomoV2NormalizedVestingCandidates {
  tokenAllocations: FomoV2NormalizedAllocationCandidate[];
  vestingRounds: FomoV2NormalizedRoundCandidate[];
  vestingSchedules: FomoV2NormalizedScheduleCandidate[];
  unlinkedTokenAllocations: FomoV2NormalizedAllocationCandidate[];
  unlinkedVestingRounds: FomoV2NormalizedRoundCandidate[];
}

@Injectable()
export class FomoV2VestingCandidateNormalizerService {
  normalizeAllocationScheduleCandidates(input: {
    sourceProject: Record<string, any>;
    sourceContext: DropstabVestingSourceContext;
    canonicalProjectId: Types.ObjectId;
    marketAssetId?: Types.ObjectId;
    sourceType?: string;
  }): FomoV2NormalizedVestingCandidates {
    const sourceType = normalizeDropstabSourceType(input.sourceType);
    const explicitRounds = this.normalizeVestingRounds({
      ...input,
      sourceType,
      sourceArray: "vestingRounds",
      rows: this.arrayValue(input.sourceProject.vestingRounds),
    });
    const fallbackRows = this.arrayValue(input.sourceProject.vestingSchedule)
      .length
      ? this.arrayValue(input.sourceProject.vestingSchedule)
      : this.arrayValue(input.sourceProject.vestingTimeline);
    const fallbackRounds = this.normalizeVestingRounds({
      ...input,
      sourceType,
      sourceArray: "vestingSchedule",
      rows: fallbackRows,
    });
    const tokenAllocations = this.normalizeTokenAllocations({
      ...input,
      sourceType,
    });
    const vestingSchedules = this.normalizeVestingSchedules({
      ...input,
      sourceType,
    });
    const scheduleScopedAllocations = this.pickCandidatesForSchedules(
      tokenAllocations,
      vestingSchedules,
      (candidate) => candidate.normalizedName
    );
    const scheduleScopedRounds = this.pickRoundsForSchedules(
      explicitRounds,
      fallbackRounds,
      vestingSchedules
    );
    const reviewableRounds = explicitRounds.length ? explicitRounds : fallbackRounds;
    return {
      tokenAllocations: scheduleScopedAllocations,
      vestingRounds: scheduleScopedRounds,
      vestingSchedules,
      unlinkedTokenAllocations: this.withoutPicked(
        tokenAllocations,
        scheduleScopedAllocations
      ),
      unlinkedVestingRounds: this.withoutPicked(
        reviewableRounds,
        scheduleScopedRounds
      ),
    };
  }

  private normalizeTokenAllocations(input: {
    sourceProject: Record<string, any>;
    sourceContext: DropstabVestingSourceContext;
    canonicalProjectId: Types.ObjectId;
    marketAssetId?: Types.ObjectId;
    sourceType: string;
  }): FomoV2NormalizedAllocationCandidate[] {
    const identity = dropstabVestingProjectIdentity(input.sourceProject);
    return this.arrayValue(input.sourceProject.tokenAllocation)
      .map<FomoV2NormalizedAllocationCandidate | undefined>((item, index) => {
        const name = cleanVestingString(
          item?.name || item?.roundName || item?.saleName
        );
        if (!name) return undefined;
        const saleId = this.cleanSaleId(item?.saleId ?? item?.id);
        const normalizedName = normalizeVestingName(name);
        const sourcePath = `tokenAllocation.${index}`;
        const candidateKey = buildDropstabCandidateKey([
          "token_allocation_candidate",
          input.sourceType,
          toDropstabVestingIdString(input.canonicalProjectId),
          saleId,
          normalizedName,
        ]);
        return {
          candidateKey,
          canonicalProjectId: input.canonicalProjectId,
          marketAssetId: input.marketAssetId,
          sourceType: input.sourceType,
          sourceId: saleId === undefined ? undefined : String(saleId),
          sourceSlug: identity.sourceSlug,
          sourcePath,
          sourceUrl: identity.sourceUrl,
          sourceSnapshotId: input.sourceContext.sourceSnapshotId,
          vestingDatasetKey: input.sourceContext.vestingDatasetKey,
          name,
          normalizedName,
          allocationPercent: firstFiniteNumber(
            item?.allocationPercent,
            item?.percent,
            item?.tokensAllocatedPercent,
            item?.tokensForSalePercent
          ),
          amount: firstFiniteNumber(
            item?.amount,
            item?.tokensAmount,
            item?.tokensAllocatedAmount,
            item?.tokensForSaleAmount
          ),
          saleId,
          primarySource: input.sourceType,
          sourceRefs: [
            buildDropstabSourceRef({
              identity,
              sourceType: input.sourceType,
              sourcePath,
              sourceId: saleId,
              sourceSnapshotId: input.sourceContext.sourceSnapshotId,
              vestingDatasetKey: input.sourceContext.vestingDatasetKey,
              metadata: {
                relevantDataHash: input.sourceContext.relevantDataHash,
              },
            }) as any,
          ],
          provenance: {
            sourceCollection: "dropstab_coin_detail_data",
            sourceDocumentId: identity.sourceDocumentId,
            sourceProjectKey: input.sourceContext.sourceProjectKey,
            relevantDataHash: input.sourceContext.relevantDataHash,
            vestingDatasetKey: input.sourceContext.vestingDatasetKey,
          },
          confidence: "high",
          status: "proposed",
        };
      })
      .filter((item): item is FomoV2NormalizedAllocationCandidate =>
        Boolean(item)
      );
  }

  private normalizeVestingRounds(input: {
    sourceProject: Record<string, any>;
    sourceContext: DropstabVestingSourceContext;
    canonicalProjectId: Types.ObjectId;
    marketAssetId?: Types.ObjectId;
    sourceType: string;
    sourceArray: string;
    rows: any[];
  }): FomoV2NormalizedRoundCandidate[] {
    const identity = dropstabVestingProjectIdentity(input.sourceProject);
    return this.arrayValue(input.rows)
      .map<FomoV2NormalizedRoundCandidate | undefined>((item, index) => {
        const roundName = cleanVestingString(
          item?.roundName || item?.name || item?.saleName || item?.stage
        );
        if (!roundName) return undefined;
        const saleId = this.cleanSaleId(item?.saleId ?? item?.id);
        const normalizedRoundName = normalizeVestingName(roundName);
        const sourcePath = `${input.sourceArray}.${index}`;
        const candidateKey = buildDropstabCandidateKey([
          "vesting_round_candidate",
          input.sourceType,
          toDropstabVestingIdString(input.canonicalProjectId),
          saleId,
          normalizedRoundName,
        ]);
        return {
          candidateKey,
          canonicalProjectId: input.canonicalProjectId,
          marketAssetId: input.marketAssetId,
          sourceType: input.sourceType,
          saleId,
          roundName,
          normalizedRoundName,
          allocationPercent: firstFiniteNumber(
            item?.allocationPercent,
            item?.percent,
            item?.tokensAllocatedPercent
          ),
          totalAmount: firstFiniteNumber(
            item?.totalAmount,
            item?.tokensAmount,
            item?.amount
          ),
          unlockedAmountSource: firstFiniteNumber(
            item?.unlockedAmount,
            item?.unlockedTokensAmount,
            item?.vestedAmount
          ),
          lockedAmountSource: firstFiniteNumber(
            item?.lockedAmount,
            item?.lockedTokensAmount
          ),
          unlockedPercentSource: firstFiniteNumber(
            item?.unlockedPercent,
            item?.vestedPercent,
            item?.currentUnlockedPercent
          ),
          lockedPercentSource: firstFiniteNumber(
            item?.lockedPercent,
            item?.currentLockedPercent
          ),
          valueLockedUsdSource: firstFiniteNumber(
            item?.valueLockedUsd,
            item?.lockedValueUsd
          ),
          lastUnlockDateSource: toVestingDate(item?.lastUnlockDate),
          primarySource: input.sourceType,
          sourceSnapshotId: input.sourceContext.sourceSnapshotId,
          vestingDatasetKey: input.sourceContext.vestingDatasetKey,
          sourceRefs: [
            buildDropstabSourceRef({
              identity,
              sourceType: input.sourceType,
              sourcePath,
              sourceId: saleId,
              sourceSnapshotId: input.sourceContext.sourceSnapshotId,
              vestingDatasetKey: input.sourceContext.vestingDatasetKey,
              metadata: {
                relevantDataHash: input.sourceContext.relevantDataHash,
              },
            }) as any,
          ],
          provenance: {
            sourceCollection: "dropstab_coin_detail_data",
            sourceDocumentId: identity.sourceDocumentId,
            sourceProjectKey: input.sourceContext.sourceProjectKey,
            relevantDataHash: input.sourceContext.relevantDataHash,
            vestingDatasetKey: input.sourceContext.vestingDatasetKey,
          },
          confidence: "high",
          status: "proposed",
          metadata: {
            importer: "fomo-v2:vesting-allocation-schedule-import",
            sourceArray: input.sourceArray,
            sourceIndex: index,
            sourceProjectKey: input.sourceContext.sourceProjectKey,
            secondaryRoundLabel: true,
          },
        };
      })
      .filter((item): item is FomoV2NormalizedRoundCandidate => Boolean(item));
  }

  private normalizeVestingSchedules(input: {
    sourceProject: Record<string, any>;
    sourceContext: DropstabVestingSourceContext;
    canonicalProjectId: Types.ObjectId;
    marketAssetId?: Types.ObjectId;
    sourceType: string;
  }): FomoV2NormalizedScheduleCandidate[] {
    const identity = dropstabVestingProjectIdentity(input.sourceProject);
    const sourceArray = this.arrayValue(input.sourceProject.vestingSchedule).length
      ? "vestingSchedule"
      : "vestingTimeline";
    const rows =
      sourceArray === "vestingSchedule"
        ? this.arrayValue(input.sourceProject.vestingSchedule)
        : this.arrayValue(input.sourceProject.vestingTimeline);
    return rows
      .map<FomoV2NormalizedScheduleCandidate | undefined>((item, index) => {
        const roundName = cleanVestingString(
          item?.roundName || item?.name || item?.saleName
        );
        if (!roundName) return undefined;
        const saleId = this.cleanSaleId(item?.saleId ?? item?.id);
        const normalizedRoundName = normalizeVestingName(roundName);
        const sourcePath = `${sourceArray}.${index}`;
        const candidateKey = buildDropstabCandidateKey([
          "vesting_schedule_candidate",
          input.sourceType,
          toDropstabVestingIdString(input.canonicalProjectId),
          saleId,
          normalizedRoundName,
          sourceArray,
          index,
        ]);
        return {
          candidateKey,
          canonicalProjectId: input.canonicalProjectId,
          marketAssetId: input.marketAssetId,
          sourceType: input.sourceType,
          saleId,
          roundName,
          normalizedRoundName,
          tgeUnlockPercent: firstFiniteNumber(item?.tgeUnlockPercent),
          vestingType: cleanVestingString(item?.vestingType),
          vestingFrequency: cleanVestingString(item?.vestingFrequency),
          vestingDurationMonths: firstFiniteNumber(item?.vestingDurationMonths),
          startDate: toVestingDate(item?.startDate),
          endDate: toVestingDate(item?.endDate),
          dateConfidence: cleanVestingString(item?.dateConfidence),
          currentUnlockedPercentSource: firstFiniteNumber(
            item?.currentUnlockedPercent,
            item?.vestedPercent
          ),
          currentLockedPercentSource: firstFiniteNumber(
            item?.currentLockedPercent,
            item?.lockedPercent
          ),
          sourceSnapshotId: input.sourceContext.sourceSnapshotId,
          vestingDatasetKey: input.sourceContext.vestingDatasetKey,
          sourceRefs: [
            buildDropstabSourceRef({
              identity,
              sourceType: input.sourceType,
              sourcePath,
              sourceId: saleId,
              sourceSnapshotId: input.sourceContext.sourceSnapshotId,
              vestingDatasetKey: input.sourceContext.vestingDatasetKey,
              metadata: {
                relevantDataHash: input.sourceContext.relevantDataHash,
              },
            }) as any,
          ],
          provenance: {
            sourceCollection: "dropstab_coin_detail_data",
            sourceDocumentId: identity.sourceDocumentId,
            sourceProjectKey: input.sourceContext.sourceProjectKey,
            relevantDataHash: input.sourceContext.relevantDataHash,
            vestingDatasetKey: input.sourceContext.vestingDatasetKey,
          },
          confidence: "high",
          status: "proposed",
          metadata: {
            importer: "fomo-v2:vesting-allocation-schedule-import",
            sourceArray,
            sourceIndex: index,
            sourceProjectKey: input.sourceContext.sourceProjectKey,
          },
        };
      })
      .filter((item): item is FomoV2NormalizedScheduleCandidate =>
        Boolean(item)
      );
  }

  private cleanSaleId(value: any): string | number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    return typeof value === "number" && Number.isFinite(value)
      ? value
      : cleanVestingString(value);
  }

  private pickCandidatesForSchedules<
    TCandidate extends {
      candidateKey: string;
      saleId?: number | string;
    }
  >(
    candidates: TCandidate[],
    schedules: FomoV2NormalizedScheduleCandidate[],
    nameValue: (candidate: TCandidate) => string | undefined
  ): TCandidate[] {
    const bySaleId = new Map<string, TCandidate[]>();
    const byName = new Map<string, TCandidate[]>();
    for (const candidate of candidates) {
      this.addCandidate(bySaleId, candidate.saleId, candidate);
      this.addCandidate(byName, nameValue(candidate), candidate);
    }

    const picked = new Map<string, TCandidate>();
    for (const schedule of schedules) {
      const candidate =
        this.firstCandidate(bySaleId, schedule.saleId) ||
        this.firstCandidate(byName, schedule.normalizedRoundName);
      if (candidate) picked.set(candidate.candidateKey, candidate);
    }
    return Array.from(picked.values());
  }

  private pickRoundsForSchedules(
    explicitRounds: FomoV2NormalizedRoundCandidate[],
    fallbackRounds: FomoV2NormalizedRoundCandidate[],
    schedules: FomoV2NormalizedScheduleCandidate[]
  ): FomoV2NormalizedRoundCandidate[] {
    const explicitBySaleId = new Map<string, FomoV2NormalizedRoundCandidate[]>();
    const explicitByName = new Map<string, FomoV2NormalizedRoundCandidate[]>();
    const fallbackBySaleId = new Map<string, FomoV2NormalizedRoundCandidate[]>();
    const fallbackByName = new Map<string, FomoV2NormalizedRoundCandidate[]>();

    for (const round of explicitRounds) {
      this.addCandidate(explicitBySaleId, round.saleId, round);
      this.addCandidate(explicitByName, round.normalizedRoundName, round);
    }
    for (const round of fallbackRounds) {
      this.addCandidate(fallbackBySaleId, round.saleId, round);
      this.addCandidate(fallbackByName, round.normalizedRoundName, round);
    }

    const picked = new Map<string, FomoV2NormalizedRoundCandidate>();
    for (const schedule of schedules) {
      const round =
        this.firstCandidate(explicitBySaleId, schedule.saleId) ||
        this.firstCandidate(explicitByName, schedule.normalizedRoundName) ||
        this.firstCandidate(fallbackBySaleId, schedule.saleId) ||
        this.firstCandidate(fallbackByName, schedule.normalizedRoundName);
      if (round) picked.set(round.candidateKey, round);
    }
    return Array.from(picked.values());
  }

  private addCandidate<TCandidate>(
    map: Map<string, TCandidate[]>,
    value: unknown,
    candidate: TCandidate
  ): void {
    const key = this.relationKey(value);
    if (!key) return;
    map.set(key, [...(map.get(key) || []), candidate]);
  }

  private firstCandidate<TCandidate>(
    map: Map<string, TCandidate[]>,
    value: unknown
  ): TCandidate | undefined {
    const key = this.relationKey(value);
    return key ? map.get(key)?.[0] : undefined;
  }

  private relationKey(value: unknown): string | undefined {
    const text = cleanVestingString(value);
    return text ? text.toLowerCase() : undefined;
  }

  private withoutPicked<
    TCandidate extends {
      candidateKey: string;
    }
  >(candidates: TCandidate[], picked: TCandidate[]): TCandidate[] {
    const pickedKeys = new Set(picked.map((candidate) => candidate.candidateKey));
    return candidates.filter((candidate) => !pickedKeys.has(candidate.candidateKey));
  }

  private arrayValue(value: any): any[] {
    return Array.isArray(value) ? value : [];
  }
}
