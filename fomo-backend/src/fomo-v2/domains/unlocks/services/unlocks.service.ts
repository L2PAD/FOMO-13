import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { ClientSession, FilterQuery, Model, Types } from "mongoose";
import {
  normalizeProjectSourceType,
  projectSourceTypeMongoPattern,
} from "../../../shared/source-policy";
import {
  buildUnlockEventContentHash,
  buildUnlockEventFingerprint,
  cleanObject,
  cleanUnlockString,
  firstFiniteNumber,
  normalizeUnlockName,
  normalizeUnlockSourceRefs,
  toUnlockDate,
  toUnlockObjectId,
} from "../helpers";
import {
  FOMO_V2_UNLOCK_EVENT_ORIGINS,
  FomoV2UnlockEventInput,
  FomoV2UnlockEventOrigin,
  FomoV2UnlockSourceRef,
  FomoV2UnlockUpsertResult,
} from "../types";
import { FomoV2UnlockEvent, FomoV2UnlockEventDocument } from "../models";

@Injectable()
export class FomoV2UnlocksService {
  constructor(
    @InjectModel(FomoV2UnlockEvent.name)
    private readonly unlockEventModel: Model<FomoV2UnlockEvent>
  ) {}

  async upsertUnlockEvent(
    input: FomoV2UnlockEventInput,
    session?: ClientSession
  ): Promise<FomoV2UnlockUpsertResult<FomoV2UnlockEventDocument>> {
    const payload = this.buildUnlockEventPayload(input);
    return this.findOneAndMergeUnlockEvent(
      this.unlockEventFilter(payload, input),
      payload,
      session
    );
  }

  private buildUnlockEventPayload(
    input: FomoV2UnlockEventInput
  ): Record<string, any> {
    const canonicalProjectId = this.requireObjectId(
      input.canonicalProjectId,
      "canonicalProjectId"
    );
    const marketAssetId = toUnlockObjectId(input.marketAssetId);
    const tokenAllocationId = toUnlockObjectId(input.tokenAllocationId);
    const vestingRoundId = toUnlockObjectId(input.vestingRoundId);
    const vestingScheduleId = toUnlockObjectId(input.vestingScheduleId);
    const sourceType = this.requireSourceType(input.sourceType);
    const unlockDate = toUnlockDate(input.unlockDate);
    if (!unlockDate) throw new Error("Unlock event requires unlockDate.");
    const roundName = cleanUnlockString(input.roundName);
    const normalizedRoundName =
      cleanUnlockString(input.normalizedRoundName) ||
      normalizeUnlockName(roundName);
    const eventOrigin = this.normalizeEventOrigin(input.eventOrigin);
    const eventOrigins = this.normalizeEventOrigins([
      ...(input.eventOrigins || []),
      eventOrigin,
    ]);
    const payload = cleanObject({
      canonicalProjectId,
      marketAssetId,
      tokenAllocationId,
      vestingRoundId,
      vestingScheduleId,
      vestingDatasetKey: cleanUnlockString(input.vestingDatasetKey),
      unlockKey: cleanUnlockString(input.unlockKey),
      sourceType,
      sourceEventId: cleanUnlockString(input.sourceEventId),
      saleId: this.cleanSaleId(input.saleId),
      sourcePath: cleanUnlockString(input.sourcePath),
      unlockDate,
      statusSource: cleanUnlockString(input.statusSource),
      amount: firstFiniteNumber(input.amount),
      percentOfSupply: firstFiniteNumber(input.percentOfSupply),
      roundName,
      normalizedRoundName: normalizedRoundName || undefined,
      stage: cleanUnlockString(input.stage),
      unlockType: cleanUnlockString(input.unlockType),
      unlockTypes: this.uniqueStrings(input.unlockTypes || []),
      isTgeUnlock:
        input.isTgeUnlock === undefined
          ? undefined
          : Boolean(input.isTgeUnlock),
      sourceValueUsd: firstFiniteNumber(input.sourceValueUsd),
      sourceMarketCapSharePercent: firstFiniteNumber(
        input.sourceMarketCapSharePercent
      ),
      eventOrigin,
      eventOrigins,
      sourceFetchedAt: toUnlockDate(input.sourceFetchedAt),
      importedAt: toUnlockDate(input.importedAt) || new Date(),
      sourceRefs: this.sourceRefsWithDirectRef(input.sourceRefs, {
        ...input,
        sourceType,
      }),
      metadata: input.metadata || {},
    });

    return {
      ...payload,
      canonicalFingerprint:
        cleanUnlockString(input.canonicalFingerprint) ||
        buildUnlockEventFingerprint({
          canonicalProjectId,
          sourceType,
          sourceEventId: payload.sourceEventId,
          saleId: payload.saleId,
          unlockDate,
          roundName,
          normalizedRoundName,
          unlockType: payload.unlockType,
        }),
      contentHash:
        cleanUnlockString(input.contentHash) ||
        buildUnlockEventContentHash({
          sourceType: payload.sourceType,
          sourceEventId: payload.sourceEventId,
          marketAssetId: payload.marketAssetId,
          tokenAllocationId: payload.tokenAllocationId,
          vestingRoundId: payload.vestingRoundId,
          vestingScheduleId: payload.vestingScheduleId,
          vestingDatasetKey: payload.vestingDatasetKey,
          statusSource: payload.statusSource,
          amount: payload.amount,
          percentOfSupply: payload.percentOfSupply,
          roundName: payload.roundName,
          normalizedRoundName: payload.normalizedRoundName,
          stage: payload.stage,
          unlockType: payload.unlockType,
          unlockTypes: payload.unlockTypes,
          isTgeUnlock: payload.isTgeUnlock,
          sourceValueUsd: payload.sourceValueUsd,
          sourceMarketCapSharePercent: payload.sourceMarketCapSharePercent,
          sourceRefs: payload.sourceRefs,
          metadata: payload.metadata,
        }),
    };
  }

  private unlockEventFilter(
    payload: Record<string, any>,
    input: FomoV2UnlockEventInput | Record<string, any> = {}
  ): FilterQuery<FomoV2UnlockEvent> {
    const identityAliases = (input as any).identityAliases || {};
    const legacyCanonicalFingerprints = this.uniqueStrings(
      identityAliases.canonicalFingerprints || []
    );
    const legacySourceEventIds = this.uniqueStrings(
      identityAliases.sourceEventIds || []
    );
    const sourceTypeFilter = projectSourceTypeMongoPattern(payload.sourceType);
    const filters: Record<string, any>[] = [
      { canonicalFingerprint: payload.canonicalFingerprint },
    ];
    if (
      payload.canonicalProjectId &&
      payload.sourceType &&
      legacyCanonicalFingerprints.length
    ) {
      filters.push({
        canonicalProjectId: payload.canonicalProjectId,
        sourceType: sourceTypeFilter,
        canonicalFingerprint: { $in: legacyCanonicalFingerprints },
      });
    }
    if (
      payload.canonicalProjectId &&
      payload.sourceType &&
      legacySourceEventIds.length
    ) {
      filters.push({
        canonicalProjectId: payload.canonicalProjectId,
        sourceType: sourceTypeFilter,
        sourceEventId: { $in: legacySourceEventIds },
        unlockDate: payload.unlockDate,
      });
    }
    if (
      payload.canonicalProjectId &&
      payload.sourceType &&
      payload.sourceEventId
    ) {
      filters.push(
        cleanObject({
          canonicalProjectId: payload.canonicalProjectId,
          sourceType: sourceTypeFilter,
          sourceEventId: payload.sourceEventId,
          saleId: payload.saleId,
          unlockDate: payload.unlockDate,
          normalizedRoundName: payload.normalizedRoundName,
          unlockType: payload.unlockType,
        })
      );
    }
    if (payload.unlockKey) {
      filters.push({
        canonicalProjectId: payload.canonicalProjectId,
        sourceType: sourceTypeFilter,
        unlockKey: payload.unlockKey,
      });
    }
    if (
      payload.canonicalProjectId &&
      payload.sourceType &&
      payload.saleId !== undefined &&
      payload.unlockDate
    ) {
      filters.push({
        canonicalProjectId: payload.canonicalProjectId,
        sourceType: sourceTypeFilter,
        saleId: payload.saleId,
        unlockDate: payload.unlockDate,
        unlockType: payload.unlockType,
        ...this.legacyUnlockProviderIdentityGuard(payload, ["saleId"]),
      });
    }
    if (payload.vestingRoundId && payload.unlockDate && payload.unlockType) {
      filters.push({
        vestingRoundId: payload.vestingRoundId,
        sourceType: sourceTypeFilter,
        unlockDate: payload.unlockDate,
        unlockType: payload.unlockType,
        ...this.legacyUnlockProviderIdentityGuard(payload),
      });
    }
    if (
      payload.canonicalProjectId &&
      payload.unlockDate &&
      payload.normalizedRoundName &&
      payload.unlockType
    ) {
      filters.push({
        canonicalProjectId: payload.canonicalProjectId,
        sourceType: sourceTypeFilter,
        unlockDate: payload.unlockDate,
        normalizedRoundName: payload.normalizedRoundName,
        unlockType: payload.unlockType,
        ...this.legacyUnlockProviderIdentityGuard(payload),
      });
    }
    return filters.length === 1 ? filters[0] : { $or: filters };
  }

  private legacyUnlockProviderIdentityGuard(
    payload: Record<string, any>,
    matchedFields: string[] = []
  ): Record<string, any> {
    const providerIdentityFields = ["sourceEventId", "saleId"].filter(
      (field) =>
        !matchedFields.includes(field) &&
        payload[field] !== undefined &&
        payload[field] !== null &&
        payload[field] !== ""
    );
    if (!providerIdentityFields.length) return {};
    return {
      $and: providerIdentityFields.map((field) => ({
        $or: [
          { [field]: { $exists: false } },
          { [field]: null },
          { [field]: "" },
        ],
      })),
    };
  }

  private normalizeEventOrigin(
    value: any
  ): FomoV2UnlockEventOrigin | undefined {
    const origin = cleanUnlockString(value) as
      | FomoV2UnlockEventOrigin
      | undefined;
    return origin && FOMO_V2_UNLOCK_EVENT_ORIGINS.includes(origin)
      ? origin
      : undefined;
  }

  private normalizeEventOrigins(values: any[]): FomoV2UnlockEventOrigin[] {
    return Array.from(
      new Set(
        values.map((value) => this.normalizeEventOrigin(value)).filter(Boolean)
      )
    ) as FomoV2UnlockEventOrigin[];
  }

  private mergeEventOrigins(
    existing: Record<string, any>,
    payload: Record<string, any>
  ): FomoV2UnlockEventOrigin[] {
    return this.normalizeEventOrigins([
      ...(existing.eventOrigins || []),
      existing.eventOrigin,
      ...(payload.eventOrigins || []),
      payload.eventOrigin,
    ]);
  }

  private sameOrigins(left: any[] = [], right: any[] = []): boolean {
    const leftValues = this.normalizeEventOrigins(left).sort();
    const rightValues = this.normalizeEventOrigins(right).sort();
    return (
      leftValues.length === rightValues.length &&
      leftValues.every((value, index) => value === rightValues[index])
    );
  }

  private sourceRefsWithDirectRef(
    sourceRefs: FomoV2UnlockSourceRef[] | undefined,
    input: Record<string, any>
  ): FomoV2UnlockSourceRef[] {
    const normalized = normalizeUnlockSourceRefs(sourceRefs).map((ref) => ({
      ...ref,
      source: normalizeProjectSourceType(ref.source),
    }));
    const directSource = normalizeProjectSourceType(input.sourceType);
    if (!directSource) return normalized;
    const directRef = cleanObject({
      source: directSource,
      sourceId: cleanUnlockString(input.sourceEventId),
      sourceSlug: cleanUnlockString(input.sourceSlug),
      sourceUrl: cleanUnlockString(input.sourceUrl),
      sourcePath: cleanUnlockString(input.sourcePath),
      sourceEntityKey: cleanUnlockString(input.sourceEntityKey),
      sourceEntityId: toUnlockObjectId(input.sourceEntityId),
      sourceSnapshotId: toUnlockObjectId(input.sourceSnapshotId),
      confidence: input.confidence || "high",
      observedAt: toUnlockDate(input.observedAt),
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
    if (!sourceType) throw new Error("Unlock sourceType is required.");
    return sourceType;
  }

  private requireObjectId(value: any, field: string): Types.ObjectId {
    const objectId = toUnlockObjectId(value);
    if (!objectId)
      throw new Error(`Invalid ${field} ObjectId value "${value}".`);
    return objectId;
  }

  private cleanSaleId(value: any): string | number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    return typeof value === "number" && Number.isFinite(value)
      ? value
      : cleanUnlockString(value);
  }

  private uniqueStrings(values: any[]): string[] {
    return Array.from(
      new Set(values.map((value) => cleanUnlockString(value)).filter(Boolean))
    ) as string[];
  }

  private async findOneAndMergeUnlockEvent(
    filter: FilterQuery<FomoV2UnlockEvent>,
    payload: Record<string, any>,
    session?: ClientSession
  ): Promise<FomoV2UnlockUpsertResult<FomoV2UnlockEventDocument>> {
    const findQuery = this.unlockEventModel.findOne(filter);
    if (session) findQuery.session(session);
    const existing = await findQuery.lean();
    if (!existing) {
      const doc = session
        ? (await this.unlockEventModel.create([payload], { session }))[0]
        : await this.unlockEventModel.create(payload);
      return {
        doc,
        created: true,
        status: "created",
        updated: false,
        unchanged: false,
        skipped: false,
      };
    }

    const mergedOrigins = this.mergeEventOrigins(existing, payload);
    const contentChanged =
      !existing.contentHash ||
      existing.contentHash !== payload.contentHash ||
      existing.sourceType !== payload.sourceType;
    const originsChanged = !this.sameOrigins(
      existing.eventOrigins,
      mergedOrigins
    );
    const setPayload = contentChanged
      ? cleanObject({ ...payload, eventOrigins: mergedOrigins })
      : cleanObject({
          eventOrigin: payload.eventOrigin || existing.eventOrigin,
          eventOrigins: originsChanged ? mergedOrigins : existing.eventOrigins,
          importedAt: payload.importedAt || new Date(),
        });

    const doc = await this.unlockEventModel.findByIdAndUpdate(
      existing._id,
      { $set: setPayload },
      {
        new: true,
        setDefaultsOnInsert: true,
        ...(session ? { session } : {}),
      }
    );

    return {
      doc: doc as FomoV2UnlockEventDocument,
      created: false,
      status: contentChanged ? "updated" : "unchanged",
      updated: contentChanged,
      unchanged: !contentChanged,
      skipped: false,
    };
  }
}
