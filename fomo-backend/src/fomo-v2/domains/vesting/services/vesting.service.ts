import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ClientSession, FilterQuery, Model, Types } from "mongoose";
import {
  normalizeProjectSourceType,
  projectSourceTypeMongoPattern,
  projectSourceTypeStorageAliases,
} from "../../../shared/source-policy";
import {
  buildTokenAllocationFingerprint,
  buildVestingRoundFingerprint,
  buildVestingScheduleFingerprint,
  buildVestingSummaryFingerprint,
  cleanObject,
  cleanVestingString,
  firstFiniteNumber,
  normalizeVestingConfidence,
  normalizeVestingName,
  normalizeVestingSourceRefs,
  toVestingDate,
  toVestingObjectId,
} from "../helpers";
import {
  FomoV2TokenAllocationInput,
  FomoV2VestingRoundInput,
  FomoV2VestingScheduleInput,
  FomoV2VestingSourceRef,
  FomoV2VestingSummaryInput,
  FomoV2VestingUpsertResult,
} from "../types";
import {
  FomoV2TokenAllocation,
  FomoV2TokenAllocationDocument,
  FomoV2VestingRound,
  FomoV2VestingRoundDocument,
  FomoV2VestingSchedule,
  FomoV2VestingScheduleDocument,
  FomoV2VestingSummary,
  FomoV2VestingSummaryDocument,
} from "../models";

@Injectable()
export class FomoV2VestingService {
  constructor(
    @InjectModel(FomoV2TokenAllocation.name)
    private readonly tokenAllocationModel: Model<FomoV2TokenAllocation>,
    @InjectModel(FomoV2VestingRound.name)
    private readonly vestingRoundModel: Model<FomoV2VestingRound>,
    @InjectModel(FomoV2VestingSchedule.name)
    private readonly vestingScheduleModel: Model<FomoV2VestingSchedule>,
    @InjectModel(FomoV2VestingSummary.name)
    private readonly vestingSummaryModel: Model<FomoV2VestingSummary>
  ) {}

  async upsertTokenAllocation(
    input: FomoV2TokenAllocationInput,
    session?: ClientSession
  ): Promise<FomoV2VestingUpsertResult<FomoV2TokenAllocationDocument>> {
    const payload = this.buildTokenAllocationPayload(input);
    return this.findOneAndUpsert(
      this.tokenAllocationModel,
      this.tokenAllocationFilter(payload, input),
      {
        canonicalProjectId: payload.canonicalProjectId,
        canonicalFingerprint: payload.canonicalFingerprint,
      },
      payload,
      session
    );
  }

  async upsertVestingRound(
    input: FomoV2VestingRoundInput,
    session?: ClientSession
  ): Promise<FomoV2VestingUpsertResult<FomoV2VestingRoundDocument>> {
    const payload = this.buildVestingRoundPayload(input);
    return this.findOneAndUpsert(
      this.vestingRoundModel,
      this.vestingRoundFilter(payload, input),
      {
        canonicalProjectId: payload.canonicalProjectId,
        canonicalFingerprint: payload.canonicalFingerprint,
      },
      payload,
      session
    );
  }

  async upsertVestingSchedule(
    input: FomoV2VestingScheduleInput,
    session?: ClientSession
  ): Promise<FomoV2VestingUpsertResult<FomoV2VestingScheduleDocument>> {
    const payload = this.buildVestingSchedulePayload(input);
    return this.findOneAndUpsert(
      this.vestingScheduleModel,
      this.vestingScheduleFilter(payload, input),
      {
        canonicalProjectId: payload.canonicalProjectId,
        vestingRoundId: payload.vestingRoundId,
        canonicalFingerprint: payload.canonicalFingerprint,
      },
      payload,
      session
    );
  }

  async upsertVestingSummary(
    input: FomoV2VestingSummaryInput,
    session?: ClientSession
  ): Promise<FomoV2VestingUpsertResult<FomoV2VestingSummaryDocument>> {
    const payload = this.buildVestingSummaryPayload(input);
    return this.findOneAndUpsert(
      this.vestingSummaryModel,
      this.vestingSummaryFilter(payload, input),
      {
        canonicalProjectId: payload.canonicalProjectId,
        canonicalFingerprint: payload.canonicalFingerprint,
      },
      payload,
      session
    );
  }

  async findVestingRoundForSource(
    input: {
      canonicalProjectId: Types.ObjectId | string;
      sourceType: string;
      vestingDatasetKey?: string;
      saleId?: number | string;
      normalizedRoundName?: string;
      roundName?: string;
    },
    session?: ClientSession
  ): Promise<FomoV2VestingRound | null> {
    const canonicalProjectId = this.requireObjectId(
      input.canonicalProjectId,
      "canonicalProjectId"
    );
    const sourceType = this.requireSourceType(input.sourceType);
    const sourceTypeMatcher = this.sourceTypeMatcher(sourceType);
    const saleId = this.cleanSaleId(input.saleId);
    if (saleId !== undefined) {
      const bySaleQuery = this.vestingRoundModel.findOne(
        cleanObject({
          canonicalProjectId,
          sourceType: sourceTypeMatcher,
          saleId,
        })
      );
      if (session) bySaleQuery.session(session);
      const bySale = await bySaleQuery.lean();
      if (bySale) return bySale;
    }

    const normalizedRoundName =
      cleanVestingString(input.normalizedRoundName) ||
      normalizeVestingName(input.roundName);
    if (!normalizedRoundName) return null;
    const byNameQuery = this.vestingRoundModel.findOne(
      cleanObject({
        canonicalProjectId,
        sourceType: sourceTypeMatcher,
        normalizedRoundName,
      })
    );
    if (session) byNameQuery.session(session);
    return byNameQuery.lean();
  }

  private buildTokenAllocationPayload(
    input: FomoV2TokenAllocationInput
  ): Record<string, any> {
    const canonicalProjectId = this.requireObjectId(
      input.canonicalProjectId,
      "canonicalProjectId"
    );
    const sourceType = this.requireSourceType(input.sourceType);
    const name = this.requireString(input.name, "name");
    const normalizedName =
      cleanVestingString(input.normalizedName) || normalizeVestingName(name);
    const sourceRefs = this.sourceRefsWithDirectRef(input.sourceRefs, {
      ...input,
      primarySource: input.primarySource || sourceType,
      sourceType,
    });
    const payload = cleanObject({
      canonicalProjectId,
      marketAssetId: toVestingObjectId(input.marketAssetId),
      sourceType,
      sourceId: cleanVestingString(input.sourceId),
      sourceSlug: cleanVestingString(input.sourceSlug),
      sourcePath: cleanVestingString(input.sourcePath),
      sourceUrl: cleanVestingString(input.sourceUrl),
      sourceEntityKey: cleanVestingString(input.sourceEntityKey),
      sourceEntityId: toVestingObjectId(input.sourceEntityId),
      sourceSnapshotId: toVestingObjectId(input.sourceSnapshotId),
      vestingDatasetKey: cleanVestingString(input.vestingDatasetKey),
      name,
      normalizedName,
      allocationPercent: firstFiniteNumber(input.allocationPercent),
      amount: firstFiniteNumber(input.amount),
      saleId: this.cleanSaleId(input.saleId),
      primarySource: this.requireSourceType(input.primarySource || sourceType),
      sourceRefs,
      provenance: input.provenance || {},
      confidence: normalizeVestingConfidence(input.confidence || "high"),
      status: this.normalizeDomainStatus(input.status),
    });

    return {
      ...payload,
      canonicalFingerprint:
        cleanVestingString(input.canonicalFingerprint) ||
        buildTokenAllocationFingerprint({
          canonicalProjectId,
          sourceType,
          saleId: payload.saleId,
          name,
          normalizedName,
        }),
    };
  }

  private buildVestingRoundPayload(
    input: FomoV2VestingRoundInput
  ): Record<string, any> {
    const canonicalProjectId = this.requireObjectId(
      input.canonicalProjectId,
      "canonicalProjectId"
    );
    const sourceType = this.requireSourceType(input.sourceType);
    const roundName = this.requireString(input.roundName, "roundName");
    const normalizedRoundName =
      cleanVestingString(input.normalizedRoundName) ||
      normalizeVestingName(roundName);
    const sourceRefs = this.sourceRefsWithDirectRef(input.sourceRefs, {
      ...input,
      primarySource: input.primarySource || sourceType,
      sourceType,
    });
    const payload = cleanObject({
      canonicalProjectId,
      marketAssetId: toVestingObjectId(input.marketAssetId),
      sourceType,
      saleId: this.cleanSaleId(input.saleId),
      roundName,
      normalizedRoundName,
      allocationPercent: firstFiniteNumber(input.allocationPercent),
      totalAmount: firstFiniteNumber(input.totalAmount),
      unlockedAmountSource: firstFiniteNumber(input.unlockedAmountSource),
      lockedAmountSource: firstFiniteNumber(input.lockedAmountSource),
      unlockedPercentSource: firstFiniteNumber(input.unlockedPercentSource),
      lockedPercentSource: firstFiniteNumber(input.lockedPercentSource),
      valueLockedUsdSource: firstFiniteNumber(input.valueLockedUsdSource),
      lastUnlockDateSource: toVestingDate(input.lastUnlockDateSource),
      primarySource: this.requireSourceType(input.primarySource || sourceType),
      sourcePath: cleanVestingString(input.sourcePath),
      sourceEntityKey: cleanVestingString(input.sourceEntityKey),
      sourceEntityId: toVestingObjectId(input.sourceEntityId),
      sourceSnapshotId: toVestingObjectId(input.sourceSnapshotId),
      vestingDatasetKey: cleanVestingString(input.vestingDatasetKey),
      sourceRefs,
      provenance: input.provenance || {},
      confidence: normalizeVestingConfidence(input.confidence || "high"),
      status: this.normalizeDomainStatus(input.status),
      metadata: input.metadata || {},
    });

    return {
      ...payload,
      canonicalFingerprint:
        cleanVestingString(input.canonicalFingerprint) ||
        buildVestingRoundFingerprint({
          canonicalProjectId,
          sourceType,
          saleId: payload.saleId,
          roundName,
          normalizedRoundName,
        }),
    };
  }

  private buildVestingSchedulePayload(
    input: FomoV2VestingScheduleInput
  ): Record<string, any> {
    const canonicalProjectId = this.requireObjectId(
      input.canonicalProjectId,
      "canonicalProjectId"
    );
    const tokenAllocationId = toVestingObjectId(input.tokenAllocationId);
    const vestingRoundId = toVestingObjectId(input.vestingRoundId);
    const sourceType = this.requireSourceType(input.sourceType);
    const roundName = this.requireString(input.roundName, "roundName");
    const normalizedRoundName =
      cleanVestingString(input.normalizedRoundName) ||
      normalizeVestingName(roundName);
    const payload = cleanObject({
      canonicalProjectId,
      marketAssetId: toVestingObjectId(input.marketAssetId),
      tokenAllocationId,
      vestingRoundId,
      sourceType,
      saleId: this.cleanSaleId(input.saleId),
      roundName,
      normalizedRoundName,
      tgeUnlockPercent: firstFiniteNumber(input.tgeUnlockPercent),
      vestingType: cleanVestingString(input.vestingType),
      vestingFrequency: cleanVestingString(input.vestingFrequency),
      vestingDurationMonths: firstFiniteNumber(input.vestingDurationMonths),
      startDate: toVestingDate(input.startDate),
      endDate: toVestingDate(input.endDate),
      dateConfidence: cleanVestingString(input.dateConfidence),
      currentUnlockedPercentSource: firstFiniteNumber(
        input.currentUnlockedPercentSource
      ),
      currentLockedPercentSource: firstFiniteNumber(
        input.currentLockedPercentSource
      ),
      sourceRefs: this.sourceRefsWithDirectRef(input.sourceRefs, {
        ...input,
        sourceType,
        primarySource: sourceType,
      }),
      sourceEntityKey: cleanVestingString(input.sourceEntityKey),
      sourceEntityId: toVestingObjectId(input.sourceEntityId),
      sourceSnapshotId: toVestingObjectId(input.sourceSnapshotId),
      vestingDatasetKey: cleanVestingString(input.vestingDatasetKey),
      provenance: input.provenance || {},
      confidence: normalizeVestingConfidence(input.confidence || "high"),
      status: this.normalizeDomainStatus(input.status),
      metadata: input.metadata || {},
    });

    return {
      ...payload,
      canonicalFingerprint:
        cleanVestingString(input.canonicalFingerprint) ||
        buildVestingScheduleFingerprint({
          canonicalProjectId,
          vestingRoundId,
          sourceType,
          saleId: payload.saleId,
          roundName,
          normalizedRoundName,
        }),
    };
  }

  private buildVestingSummaryPayload(
    input: FomoV2VestingSummaryInput
  ): Record<string, any> {
    const canonicalProjectId = this.requireObjectId(
      input.canonicalProjectId,
      "canonicalProjectId"
    );
    const sourceType = this.requireSourceType(input.sourceType);
    const payload = cleanObject({
      canonicalProjectId,
      sourceType,
      vestingDatasetKey: cleanVestingString(input.vestingDatasetKey),
      totalAmount: firstFiniteNumber(input.totalAmount),
      unlockedAmount: firstFiniteNumber(input.unlockedAmount),
      lockedAmount: firstFiniteNumber(input.lockedAmount),
      untrackedAmount: firstFiniteNumber(input.untrackedAmount),
      unlockedPercent: firstFiniteNumber(input.unlockedPercent),
      lockedPercent: firstFiniteNumber(input.lockedPercent),
      untrackedPercent: firstFiniteNumber(input.untrackedPercent),
      lastUnlockDate: toVestingDate(input.lastUnlockDate),
      nextUnlockDate: toVestingDate(input.nextUnlockDate),
      nextUnlockEventId: toVestingObjectId(input.nextUnlockEventId),
      sourceUnlockedValueUsd: firstFiniteNumber(input.sourceUnlockedValueUsd),
      sourceLockedValueUsd: firstFiniteNumber(input.sourceLockedValueUsd),
      calculatedAt: toVestingDate(input.calculatedAt) || new Date(),
    });

    return {
      ...payload,
      canonicalFingerprint: buildVestingSummaryFingerprint({
        canonicalProjectId,
        sourceType,
      }),
    };
  }

  private tokenAllocationFilter(
    payload: Record<string, any>,
    input: FomoV2TokenAllocationInput
  ) {
    const sourceType = this.sourceTypeMatcher(payload.sourceType);
    const canonicalFingerprint = this.canonicalFingerprintQuery(payload, input);
    const filters: Record<string, any>[] = [
      {
        canonicalFingerprint,
        sourceType,
      },
    ];
    if (payload.saleId !== undefined) {
      filters.push({
        canonicalProjectId: payload.canonicalProjectId,
        sourceType,
        saleId: payload.saleId,
      });
    }
    if (payload.normalizedName) {
      filters.push({
        canonicalProjectId: payload.canonicalProjectId,
        sourceType,
        normalizedName: payload.normalizedName,
      });
    }
    return filters.length === 1 ? filters[0] : { $or: filters };
  }

  private vestingRoundFilter(
    payload: Record<string, any>,
    input: FomoV2VestingRoundInput
  ) {
    const sourceType = this.sourceTypeMatcher(payload.sourceType);
    const canonicalFingerprint = this.canonicalFingerprintQuery(payload, input);
    const filters: Record<string, any>[] = [
      {
        canonicalFingerprint,
        sourceType,
      },
    ];
    if (payload.saleId !== undefined) {
      filters.push({
        canonicalProjectId: payload.canonicalProjectId,
        sourceType,
        saleId: payload.saleId,
      });
    }
    if (payload.normalizedRoundName) {
      filters.push({
        canonicalProjectId: payload.canonicalProjectId,
        sourceType,
        normalizedRoundName: payload.normalizedRoundName,
      });
    }
    return filters.length === 1 ? filters[0] : { $or: filters };
  }

  private vestingScheduleFilter(
    payload: Record<string, any>,
    input: FomoV2VestingScheduleInput
  ) {
    const sourceType = this.sourceTypeMatcher(payload.sourceType);
    const canonicalFingerprint = this.canonicalFingerprintQuery(payload, input);
    const filters: Record<string, any>[] = [
      {
        canonicalFingerprint,
        sourceType,
      },
    ];
    if (payload.vestingRoundId) {
      filters.push({
        vestingRoundId: payload.vestingRoundId,
        sourceType,
      });
    }
    if (payload.normalizedRoundName) {
      filters.push(
        cleanObject({
          canonicalProjectId: payload.canonicalProjectId,
          sourceType,
          saleId: payload.saleId,
          normalizedRoundName: payload.normalizedRoundName,
        })
      );
    }
    return filters.length === 1 ? filters[0] : { $or: filters };
  }

  private vestingSummaryFilter(
    payload: Record<string, any>,
    input: FomoV2VestingSummaryInput
  ) {
    const sourceType = this.sourceTypeMatcher(payload.sourceType);
    const canonicalFingerprint = this.canonicalFingerprintQuery(payload, input);
    return {
      $or: [
        {
          canonicalProjectId: payload.canonicalProjectId,
          sourceType,
        },
        { canonicalFingerprint, sourceType },
      ],
    };
  }

  private canonicalFingerprintQuery(
    payload: Record<string, any>,
    input: { identityAliases?: { canonicalFingerprints?: string[] } }
  ): string | { $in: string[] } {
    const values = Array.from(
      new Set(
        [
          payload.canonicalFingerprint,
          ...(input.identityAliases?.canonicalFingerprints || []),
        ]
          .map((value) => cleanVestingString(value))
          .filter(Boolean)
      )
    ) as string[];
    return values.length > 1 ? { $in: values } : values[0];
  }

  private sourceTypeMatcher(value: any): string | RegExp {
    const sourceType = this.requireSourceType(value);
    return projectSourceTypeStorageAliases(sourceType).length > 1
      ? projectSourceTypeMongoPattern(sourceType)
      : sourceType;
  }

  private sourceRefsWithDirectRef(
    sourceRefs: FomoV2VestingSourceRef[] | undefined,
    input: Record<string, any>
  ): FomoV2VestingSourceRef[] {
    const normalized = normalizeVestingSourceRefs(sourceRefs);
    const directSource = normalizeProjectSourceType(
      input.primarySource || input.sourceType
    );
    if (!directSource) return normalized;
    const directRef = cleanObject({
      source: directSource,
      sourceId: cleanVestingString(input.sourceId),
      sourceSlug: cleanVestingString(input.sourceSlug),
      sourceUrl: cleanVestingString(input.sourceUrl),
      sourcePath: cleanVestingString(input.sourcePath),
      sourceEntityKey: cleanVestingString(input.sourceEntityKey),
      sourceEntityId: toVestingObjectId(input.sourceEntityId),
      sourceSnapshotId: toVestingObjectId(input.sourceSnapshotId),
      confidence: input.confidence || "high",
      observedAt: toVestingDate(input.observedAt),
      metadata: input.metadata,
    });
    const hasSameRef = normalized.some(
      (ref) =>
        ref.source === directRef.source &&
        ref.sourceId === directRef.sourceId &&
        ref.sourcePath === directRef.sourcePath
    );
    return hasSameRef ? normalized : [directRef, ...normalized];
  }

  private requireSourceType(value: any): string {
    const sourceType = normalizeProjectSourceType(value);
    if (!sourceType) throw new Error("Vesting sourceType is required.");
    return sourceType;
  }

  private requireString(value: any, field: string): string {
    const text = cleanVestingString(value);
    if (!text) throw new Error(`Vesting ${field} is required.`);
    return text;
  }

  private requireObjectId(value: any, field: string): Types.ObjectId {
    const objectId = toVestingObjectId(value);
    if (!objectId)
      throw new Error(`Invalid ${field} ObjectId value "${value}".`);
    return objectId;
  }

  private cleanSaleId(value: any): string | number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    return typeof value === "number" && Number.isFinite(value)
      ? value
      : cleanVestingString(value);
  }

  private normalizeDomainStatus(value: any): string {
    const status = cleanVestingString(value)?.toLowerCase();
    if (
      status &&
      ["active", "proposed", "conflict", "superseded", "deprecated"].includes(
        status
      )
    ) {
      return status;
    }
    return "proposed";
  }

  private async findOneAndUpsert<T>(
    model: Model<T>,
    filter: FilterQuery<T>,
    setOnInsert: Record<string, any>,
    set: Record<string, any>,
    session?: ClientSession
  ): Promise<FomoV2VestingUpsertResult<any>> {
    const insertPayload = cleanObject(setOnInsert);
    const setPayload = cleanObject(set);
    for (const key of Object.keys(insertPayload)) {
      if (Object.prototype.hasOwnProperty.call(setPayload, key)) {
        delete setPayload[key];
      }
    }
    const raw = await (model as any).findOneAndUpdate(
      filter,
      { $setOnInsert: insertPayload, $set: setPayload },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        rawResult: true,
        ...(session ? { session } : {}),
      }
    );
    return {
      doc: raw?.value || raw,
      created: Boolean(raw?.lastErrorObject?.upserted),
    };
  }
}
