import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import { FomoV2ReviewService } from "../../review/services/review.service";
import { FomoV2ReviewCandidateInput } from "../../review/types";
import {
  FomoV2ProjectDomainSourceService,
  normalizeProjectSourceType,
  projectSourceTypeMongoPattern,
} from "../../../shared/source-policy";
import {
  buildFundingRoundFingerprint,
  buildFundingRoundParticipantFingerprint,
  cleanFundingString,
  cleanObject,
  fundingDateBucket,
  normalizeFundingConfidence,
  normalizeFundingCurrency,
  normalizeFundingName,
  normalizeFundingParticipantRole,
  normalizeFundingParticipantStatus,
  normalizeFundingRoundStatus,
  normalizeFundingRoundType,
  normalizeFundingSourceRefs,
  toFundingDate,
  toFundingObjectId,
} from "../helpers";
import {
  FomoV2FundingRoundCreateInput,
  FomoV2FundingRoundParticipantCreateInput,
  FomoV2FundingRoundParticipantSourcePolicyInput,
  FomoV2FundingRoundParticipantUpsertInput,
  FomoV2FundingPlatformSnapshotInput,
  FomoV2FundingPlatformUpsertInput,
  FomoV2FundingRoundRoiInput,
  FomoV2FundingRoundSourcePolicyInput,
  FomoV2FundingRoundUpsertInput,
  FomoV2FundingSourcePolicyResult,
  FomoV2FundingSourceRef,
  FomoV2FundingUpsertResult,
} from "../types";
import {
  FomoV2FundingPlatform,
  FomoV2FundingPlatformDocument,
  FomoV2FundingRound,
  FomoV2FundingRoundDocument,
  FomoV2FundingRoundPlatformSnapshot,
  FomoV2FundingRoundParticipant,
  FomoV2FundingRoundParticipantDocument,
} from "../models";

@Injectable()
export class FomoV2FundingService {
  constructor(
    @InjectModel(FomoV2FundingRound.name)
    private readonly fundingRoundModel: Model<FomoV2FundingRound>,
    @InjectModel(FomoV2FundingRoundParticipant.name)
    private readonly participantModel: Model<FomoV2FundingRoundParticipant>,
    @InjectModel(FomoV2FundingPlatform.name)
    private readonly platformModel: Model<FomoV2FundingPlatform>,
    private readonly projectDomainSourceService: FomoV2ProjectDomainSourceService,
    private readonly reviewService: FomoV2ReviewService
  ) {}

  async createFundingRound(
    input: FomoV2FundingRoundCreateInput
  ): Promise<FomoV2FundingRoundDocument> {
    const enriched = await this.withEnsuredPlatform(input);
    return this.fundingRoundModel.create(
      this.buildFundingRoundPayload(enriched)
    );
  }

  async upsertFundingRound(
    input: FomoV2FundingRoundUpsertInput
  ): Promise<FomoV2FundingUpsertResult<FomoV2FundingRoundDocument>> {
    const enriched = await this.withEnsuredPlatform(input);
    const payload = this.buildFundingRoundPayload(enriched);
    const filter = this.buildFundingRoundUpsertFilter(payload, enriched);
    return this.findOneAndUpsert(
      this.fundingRoundModel,
      filter,
      {
        canonicalProjectId: payload.canonicalProjectId,
      },
      payload
    );
  }

  async ensureFundingPlatform(
    input: FomoV2FundingPlatformUpsertInput
  ): Promise<FomoV2FundingUpsertResult<FomoV2FundingPlatformDocument> | null> {
    const payload = this.buildFundingPlatformPayload(input);
    if (!payload) return null;
    return this.findOneAndUpsert(
      this.platformModel,
      { normalizedName: payload.normalizedName },
      {
        name: payload.name,
        normalizedName: payload.normalizedName,
      },
      payload
    );
  }

  async upsertRoundWithSourcePolicy(
    input: FomoV2FundingRoundSourcePolicyInput
  ): Promise<FomoV2FundingSourcePolicyResult<FomoV2FundingRoundDocument>> {
    const sourceType = this.requireSourceType(
      input.sourceType || input.primarySource
    );
    const canonicalProjectId = toFundingObjectId(input.canonicalProjectId);
    const candidates = this.reviewCandidates(
      "funding_round",
      sourceType,
      input
    );

    if (!canonicalProjectId) {
      const review =
        await this.reviewService.createMissingCanonicalProjectReview({
          domain: "funding",
          incomingSourceType: sourceType,
          projectKey: input.projectKey || input.sourceSlug || input.sourceId,
          projectName: input.projectName || input.roundName,
          affectedEntityTypes: ["funding_round"],
          candidates,
          syncRunId: input.syncRunId,
          metadata: input.metadata,
        });
      return {
        written: false,
        skipped: true,
        reason: "MISSING_CANONICAL_PROJECT",
        action: "review_created_or_updated",
        review,
      };
    }

    const lock = await this.projectDomainSourceService.ensureLock({
      canonicalProjectId,
      domain: "funding",
      sourceType,
      syncRunId: input.syncRunId,
      reason: input.metadata?.sourcePolicyReason,
      metadata: input.metadata,
    });

    if (!lock.allowed) {
      const review = await this.reviewService.createSourceConflictReview({
        canonicalProjectId,
        domain: "funding",
        currentSourceType: lock.currentSourceType,
        incomingSourceType: sourceType,
        affectedEntityTypes: ["funding_round"],
        candidates,
        syncRunId: input.syncRunId,
        metadata: input.metadata,
      });
      return {
        written: false,
        skipped: true,
        reason: "SOURCE_CONFLICT",
        action: lock.action,
        lock,
        review,
      };
    }

    const result = await this.upsertFundingRound({
      ...input,
      canonicalProjectId,
      primarySource: input.primarySource || sourceType,
    });
    return {
      written: true,
      skipped: false,
      action: lock.action,
      lock,
      result,
    };
  }

  async findFundingRoundById(
    id: Types.ObjectId | string
  ): Promise<FomoV2FundingRoundDocument | null> {
    const _id = toFundingObjectId(id);
    if (!_id) return null;
    return this.fundingRoundModel.findById(_id).exec();
  }

  async findFundingRoundsByProject(
    canonicalProjectId: Types.ObjectId | string
  ): Promise<FomoV2FundingRound[]> {
    const projectId = this.requireObjectId(
      canonicalProjectId,
      "canonicalProjectId"
    );
    return this.fundingRoundModel
      .find({ canonicalProjectId: projectId })
      .sort({ announcedDate: -1, updatedAt: -1 })
      .lean();
  }

  async findFundingRoundByFingerprint(
    canonicalFingerprint: string
  ): Promise<FomoV2FundingRound | null> {
    const fingerprint = cleanFundingString(canonicalFingerprint);
    if (!fingerprint) return null;
    return this.fundingRoundModel
      .findOne({ canonicalFingerprint: fingerprint })
      .lean();
  }

  async findFundingRoundBySourceRef(input: {
    canonicalProjectId: Types.ObjectId | string;
    source: string;
    sourceId: string;
  }): Promise<FomoV2FundingRound | null> {
    const canonicalProjectId = this.requireObjectId(
      input.canonicalProjectId,
      "canonicalProjectId"
    );
    const source = this.normalizeOptionalSourceType(input.source);
    const sourceId = cleanFundingString(input.sourceId);
    if (!source || !sourceId) return null;
    return this.fundingRoundModel
      .findOne({ canonicalProjectId, primarySource: source, sourceId })
      .lean();
  }

  async createFundingRoundParticipant(
    input: FomoV2FundingRoundParticipantCreateInput
  ): Promise<FomoV2FundingRoundParticipantDocument> {
    return this.participantModel.create(this.buildParticipantPayload(input));
  }

  async upsertFundingRoundParticipant(
    input: FomoV2FundingRoundParticipantUpsertInput
  ): Promise<FomoV2FundingUpsertResult<FomoV2FundingRoundParticipantDocument>> {
    const payload = this.buildParticipantPayload(input);
    const filter = this.buildParticipantUpsertFilter(payload);
    return this.findOneAndUpsert(
      this.participantModel,
      filter,
      {
        canonicalProjectId: payload.canonicalProjectId,
        fundingRoundId: payload.fundingRoundId,
        canonicalFingerprint: payload.canonicalFingerprint,
      },
      payload
    );
  }

  async upsertParticipantWithSourcePolicy(
    input: FomoV2FundingRoundParticipantSourcePolicyInput
  ): Promise<
    FomoV2FundingSourcePolicyResult<FomoV2FundingRoundParticipantDocument>
  > {
    const sourceType = this.requireSourceType(
      input.sourceType || input.primarySource
    );
    const canonicalProjectId = toFundingObjectId(input.canonicalProjectId);
    const candidates = this.reviewCandidates(
      "funding_round_participant",
      sourceType,
      input
    );

    if (!toFundingObjectId(input.backerId)) {
      return {
        written: false,
        skipped: true,
        reason: "MISSING_BACKER_ID",
        action: "skipped",
      };
    }

    if (!canonicalProjectId) {
      const review =
        await this.reviewService.createMissingCanonicalProjectReview({
          domain: "funding",
          incomingSourceType: sourceType,
          projectKey:
            input.projectKey || input.sourceBackerRef || input.sourceBackerId,
          projectName: input.projectName,
          affectedEntityTypes: ["funding_round_participant"],
          candidates,
          syncRunId: input.syncRunId,
          metadata: input.metadata,
        });
      return {
        written: false,
        skipped: true,
        reason: "MISSING_CANONICAL_PROJECT",
        action: "review_created_or_updated",
        review,
      };
    }

    const lock = await this.projectDomainSourceService.ensureLock({
      canonicalProjectId,
      domain: "funding",
      sourceType,
      syncRunId: input.syncRunId,
      reason: input.metadata?.sourcePolicyReason,
      metadata: input.metadata,
    });

    if (!lock.allowed) {
      const review = await this.reviewService.createSourceConflictReview({
        canonicalProjectId,
        domain: "funding",
        currentSourceType: lock.currentSourceType,
        incomingSourceType: sourceType,
        affectedEntityTypes: ["funding_round_participant"],
        candidates,
        syncRunId: input.syncRunId,
        metadata: input.metadata,
      });
      return {
        written: false,
        skipped: true,
        reason: "SOURCE_CONFLICT",
        action: lock.action,
        lock,
        review,
      };
    }

    const result = await this.upsertFundingRoundParticipant({
      ...input,
      canonicalProjectId,
      fundingRoundId: this.requireObjectId(
        input.fundingRoundId,
        "fundingRoundId"
      ),
      primarySource: input.primarySource || sourceType,
    });
    return {
      written: true,
      skipped: false,
      action: lock.action,
      lock,
      result,
    };
  }

  async findFundingRoundParticipants(
    fundingRoundId: Types.ObjectId | string
  ): Promise<FomoV2FundingRoundParticipant[]> {
    const roundId = this.requireObjectId(fundingRoundId, "fundingRoundId");
    return this.participantModel
      .find({ fundingRoundId: roundId })
      .sort({ isLead: -1, backerName: 1 })
      .lean();
  }

  async findFundingParticipantsByProject(
    canonicalProjectId: Types.ObjectId | string
  ): Promise<FomoV2FundingRoundParticipant[]> {
    const projectId = this.requireObjectId(
      canonicalProjectId,
      "canonicalProjectId"
    );
    return this.participantModel
      .find({ canonicalProjectId: projectId })
      .sort({ updatedAt: -1 })
      .lean();
  }

  private async withEnsuredPlatform<
    TInput extends FomoV2FundingRoundCreateInput
  >(input: TInput): Promise<TInput> {
    const platform = input.platform;
    if (!platform || input.platformId || platform.platformId) return input;
    const platformName = cleanFundingString(platform.name);
    if (!platformName) return input;

    const result = await this.ensureFundingPlatform({
      ...platform,
      sourceType:
        platform.sourceType || input.sourceType || input.primarySource,
      sourceUrl: platform.sourceUrl || input.sourceUrl,
      confidence: input.confidence,
      metadata: {
        ...(platform as any).metadata,
        sourceRoundId: input.sourceId,
        sourceSlug: input.sourceSlug,
      },
    });
    if (!result?.doc) return input;

    const snapshot = this.platformSnapshot(result.doc);
    return {
      ...input,
      platformId: snapshot?.platformId,
      platform: snapshot,
    };
  }

  private buildFundingPlatformPayload(
    input: FomoV2FundingPlatformUpsertInput
  ): Record<string, any> | undefined {
    const name = cleanFundingString(input.name);
    const normalizedName =
      cleanFundingString(input.normalizedName) || normalizeFundingName(name);
    if (!name || !normalizedName) return undefined;
    const sourceType = this.normalizeOptionalSourceType(input.sourceType);
    const sourceId = cleanFundingString(input.sourceId || input.id);
    const sourceRefs = this.platformSourceRefs(input, sourceType, sourceId);

    return cleanObject({
      name,
      normalizedName,
      logoUrl: cleanFundingString(input.logoUrl || input.logo || input.image),
      sourceType,
      sourceId,
      sourceUrl: cleanFundingString(input.sourceUrl),
      sourceRefs,
      provenance: input.provenance || {},
      confidence: normalizeFundingConfidence(input.confidence),
      metadata: input.metadata || {},
    });
  }

  private buildFundingRoundPayload(
    input: FomoV2FundingRoundCreateInput
  ): Record<string, any> {
    const canonicalProjectId = this.requireObjectId(
      input.canonicalProjectId,
      "canonicalProjectId"
    );
    const sourceRefs = this.sourceRefsWithDirectRef(input.sourceRefs, input);
    const primaryRef = sourceRefs[0];
    const primarySource =
      this.normalizeOptionalSourceType(input.primarySource) ||
      primaryRef?.source;
    const sourceType =
      this.normalizeOptionalSourceType(input.sourceType) ||
      primarySource ||
      primaryRef?.source;
    const roundType = normalizeFundingRoundType(
      input.roundType || input.roundName
    );
    const announcedDate = toFundingDate(input.announcedDate || input.date);
    const date = toFundingDate(input.date || announcedDate);
    const raisedAmount = this.firstNumber(input.raisedAmount, input.amountUsd);
    const raisedCurrency =
      raisedAmount !== undefined || input.raisedCurrency !== undefined
        ? normalizeFundingCurrency(input.raisedCurrency, "USD")
        : undefined;
    const valuation = this.firstNumber(input.valuation, input.valuationUsd);
    const tokenPrice = this.firstNumber(input.tokenPrice, input.tokenPriceUsd);
    const tokensForSaleAmount = this.firstNumber(input.tokensForSaleAmount);
    const tokensForSalePercent = this.firstNumber(input.tokensForSalePercent);
    const roi = this.normalizeRoundRoi(input.roi);
    const platform = this.platformSnapshot({
      ...(input.platform || {}),
      platformId: input.platformId || input.platform?.platformId,
    });
    const normalizedRoundName =
      cleanFundingString(input.normalizedRoundName) ||
      normalizeFundingName(input.roundName);
    const normalizedRoundType =
      cleanFundingString(input.normalizedRoundType) || roundType;
    const sourceEntityId = toFundingObjectId(
      input.sourceEntityId || primaryRef?.sourceEntityId
    );
    const sourceSnapshotId = toFundingObjectId(
      input.sourceSnapshotId || primaryRef?.sourceSnapshotId
    );

    const payload = cleanObject({
      canonicalProjectId,
      marketAssetId: toFundingObjectId(input.marketAssetId),
      roundKey: cleanFundingString(input.roundKey),
      roundName: cleanFundingString(input.roundName),
      normalizedRoundName: normalizedRoundName || undefined,
      roundType,
      normalizedRoundType,
      status: normalizeFundingRoundStatus(input.status),
      announcedDate,
      date,
      dateBucket:
        cleanFundingString(input.dateBucket) ||
        fundingDateBucket(announcedDate || date),
      raisedAmount,
      raisedCurrency,
      valuation,
      tokenPrice,
      tokensForSaleAmount,
      tokensForSalePercent,
      roi,
      platformId: toFundingObjectId(input.platformId || platform?.platformId),
      platform,
      primarySource,
      sourceId: cleanFundingString(input.sourceId) || primaryRef?.sourceId,
      sourceSlug:
        cleanFundingString(input.sourceSlug) || primaryRef?.sourceSlug,
      sourceUrl: cleanFundingString(input.sourceUrl) || primaryRef?.sourceUrl,
      sourceEntityKey:
        cleanFundingString(input.sourceEntityKey) ||
        primaryRef?.sourceEntityKey,
      sourceEntityId,
      sourceSnapshotId,
      sourceRefs,
      provenance: input.provenance || {},
      confidence: normalizeFundingConfidence(input.confidence),
      sourceType,
      isFeedOnly:
        input.isFeedOnly === undefined ? undefined : Boolean(input.isFeedOnly),
      sourceFeed: cleanFundingString(input.sourceFeed),
      feedExternalId: cleanFundingString(input.feedExternalId),
      importMode: cleanFundingString(input.importMode),
      metadata: input.metadata || {},
    });

    return {
      ...payload,
      canonicalFingerprint:
        cleanFundingString(input.canonicalFingerprint) ||
        buildFundingRoundFingerprint({
          canonicalProjectId,
          roundType: payload.roundType,
          normalizedRoundType: payload.normalizedRoundType,
          roundName: payload.roundName,
          normalizedRoundName: payload.normalizedRoundName,
          announcedDate: payload.announcedDate,
          date: payload.date,
          dateBucket: payload.dateBucket,
          raisedAmount: payload.raisedAmount,
          valuation: payload.valuation,
          tokenPrice: payload.tokenPrice,
          sourceRefs,
          primarySource: payload.primarySource,
          sourceId: payload.sourceId,
        }),
    };
  }

  private buildParticipantPayload(
    input: FomoV2FundingRoundParticipantCreateInput
  ): Record<string, any> {
    const canonicalProjectId = this.requireObjectId(
      input.canonicalProjectId,
      "canonicalProjectId"
    );
    const fundingRoundId = this.requireObjectId(
      input.fundingRoundId,
      "fundingRoundId"
    );
    const sourceRefs = this.sourceRefsWithDirectRef(input.sourceRefs, input);
    const primaryRef = sourceRefs[0];
    const primarySource =
      this.normalizeOptionalSourceType(input.primarySource) ||
      primaryRef?.source;
    const backerId = toFundingObjectId(input.backerId);
    if (!backerId)
      throw new Error("funding_round_participant requires backerId");
    const backerName = cleanFundingString(
      input.backerName || input.participantName
    );
    const normalizedBackerName =
      cleanFundingString(input.normalizedBackerName) ||
      normalizeFundingName(backerName);
    const role = normalizeFundingParticipantRole(input.role, input.isLead);
    const sourceEntityId = toFundingObjectId(
      input.sourceEntityId || primaryRef?.sourceEntityId
    );
    const sourceSnapshotId = toFundingObjectId(
      input.sourceSnapshotId || primaryRef?.sourceSnapshotId
    );

    const payload = cleanObject({
      canonicalProjectId,
      fundingRoundId,
      backerId,
      backerName,
      normalizedBackerName: normalizedBackerName || undefined,
      sourceBackerRef: cleanFundingString(input.sourceBackerRef),
      sourceBackerId: cleanFundingString(input.sourceBackerId),
      sourceBackerSlug: cleanFundingString(input.sourceBackerSlug),
      sourceBackerUrl: cleanFundingString(input.sourceBackerUrl),
      role,
      isLead:
        input.isLead === undefined ? role === "lead" : Boolean(input.isLead),
      status: normalizeFundingParticipantStatus(input.status),
      primarySource,
      sourceEntityKey:
        cleanFundingString(input.sourceEntityKey) ||
        primaryRef?.sourceEntityKey,
      sourceEntityId,
      sourceSnapshotId,
      sourceRefs,
      provenance: input.provenance || {},
      confidence: normalizeFundingConfidence(input.confidence),
      metadata: input.metadata || {},
    });

    return {
      ...payload,
      canonicalFingerprint:
        cleanFundingString(input.canonicalFingerprint) ||
        buildFundingRoundParticipantFingerprint({
          canonicalProjectId,
          fundingRoundId,
          backerId,
          backerName: payload.backerName,
          normalizedBackerName: payload.normalizedBackerName,
          sourceBackerRef: payload.sourceBackerRef,
          sourceBackerId: payload.sourceBackerId,
          sourceEntityId,
          role,
        }),
    };
  }

  private buildFundingRoundUpsertFilter(
    payload: Record<string, any>,
    input: FomoV2FundingRoundUpsertInput | Record<string, any> = {}
  ): FilterQuery<FomoV2FundingRound> {
    const sourceType = payload.sourceType || payload.primarySource;
    const sourceTypeFilter = projectSourceTypeMongoPattern(sourceType);
    const primarySourceFilter = projectSourceTypeMongoPattern(
      payload.primarySource || sourceType
    );
    const identityAliases = (input as any).identityAliases || {};
    const legacyCanonicalFingerprints = this.uniqueStrings(
      identityAliases.canonicalFingerprints || []
    );
    const legacySourceIds = this.uniqueStrings(identityAliases.sourceIds || []);
    const legacyRoundKeys = this.uniqueStrings(identityAliases.roundKeys || []);
    const legacyProviderIdentityGuard = this.legacyProviderIdentityGuard(
      payload,
      ["sourceId", "roundKey", "feedExternalId"]
    );
    const filters: Record<string, any>[] = [
      { canonicalFingerprint: payload.canonicalFingerprint },
    ];
    if (
      payload.canonicalProjectId &&
      sourceType &&
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
      payload.primarySource &&
      legacySourceIds.length
    ) {
      filters.push({
        canonicalProjectId: payload.canonicalProjectId,
        primarySource: primarySourceFilter,
        sourceId: { $in: legacySourceIds },
      });
    }
    if (payload.canonicalProjectId && sourceType && legacyRoundKeys.length) {
      filters.push({
        canonicalProjectId: payload.canonicalProjectId,
        sourceType: sourceTypeFilter,
        roundKey: { $in: legacyRoundKeys },
      });
    }
    if (
      payload.canonicalProjectId &&
      payload.primarySource &&
      payload.sourceId
    ) {
      filters.push({
        canonicalProjectId: payload.canonicalProjectId,
        primarySource: primarySourceFilter,
        sourceId: payload.sourceId,
      });
    }
    if (payload.canonicalProjectId && sourceType && payload.roundKey) {
      filters.push({
        canonicalProjectId: payload.canonicalProjectId,
        sourceType: sourceTypeFilter,
        roundKey: payload.roundKey,
      });
    }
    if (
      payload.canonicalProjectId &&
      sourceType &&
      payload.normalizedRoundType &&
      payload.announcedDate
    ) {
      filters.push({
        canonicalProjectId: payload.canonicalProjectId,
        sourceType: sourceTypeFilter,
        normalizedRoundType: payload.normalizedRoundType,
        announcedDate: payload.announcedDate,
        ...legacyProviderIdentityGuard,
      });
    }
    return filters.length === 1 ? filters[0] : { $or: filters };
  }

  private legacyProviderIdentityGuard(
    payload: Record<string, any>,
    fields: string[]
  ): Record<string, any> {
    const incomingIdentityFields = fields.filter((field) =>
      Boolean(cleanFundingString(payload[field]))
    );
    if (!incomingIdentityFields.length) return {};
    return {
      $and: incomingIdentityFields.map((field) => ({
        $or: [
          { [field]: { $exists: false } },
          { [field]: null },
          { [field]: "" },
        ],
      })),
    };
  }

  private uniqueStrings(values: any[]): string[] {
    return Array.from(
      new Set(values.map((value) => cleanFundingString(value)).filter(Boolean))
    ) as string[];
  }

  private buildParticipantUpsertFilter(
    payload: Record<string, any>
  ): FilterQuery<FomoV2FundingRoundParticipant> {
    const filters: Record<string, any>[] = [
      { canonicalFingerprint: payload.canonicalFingerprint },
    ];
    if (payload.fundingRoundId && payload.backerId) {
      filters.push({
        fundingRoundId: payload.fundingRoundId,
        backerId: payload.backerId,
      });
    }
    return filters.length === 1 ? filters[0] : { $or: filters };
  }

  private normalizeRoundRoi(
    value: FomoV2FundingRoundRoiInput | undefined
  ): Record<string, number> | undefined {
    if (!value || typeof value !== "object") return undefined;
    const roi = cleanObject({
      usd: this.firstNumber(value.usd, value.USD),
      btc: this.firstNumber(value.btc, value.BTC),
      eth: this.firstNumber(value.eth, value.ETH),
    });
    return Object.keys(roi).length ? roi : undefined;
  }

  private platformSnapshot(
    value?: FomoV2FundingPlatformSnapshotInput | FomoV2FundingPlatformDocument
  ): FomoV2FundingRoundPlatformSnapshot | undefined {
    if (!value || typeof value !== "object") return undefined;
    const name = cleanFundingString((value as any).name);
    const normalizedName =
      cleanFundingString((value as any).normalizedName) ||
      normalizeFundingName(name);
    if (!name || !normalizedName) return undefined;
    const platformId = toFundingObjectId(
      (value as any).platformId || (value as any)._id
    );

    return cleanObject({
      platformId,
      name,
      normalizedName,
      logoUrl: cleanFundingString(
        (value as any).logoUrl || (value as any).logo || (value as any).image
      ),
      sourceType: this.normalizeOptionalSourceType((value as any).sourceType),
      sourceId: cleanFundingString(
        (value as any).sourceId || (value as any).id
      ),
      sourceUrl: cleanFundingString((value as any).sourceUrl),
    });
  }

  private platformSourceRefs(
    input: FomoV2FundingPlatformUpsertInput,
    sourceType?: string,
    sourceId?: string
  ): FomoV2FundingSourceRef[] {
    const normalized = this.normalizeSourceRefs(input.sourceRefs);
    if (!sourceType) return normalized;
    const directRef = cleanObject({
      source: sourceType,
      sourceId,
      sourceUrl: cleanFundingString(input.sourceUrl),
      confidence: normalizeFundingConfidence(input.confidence),
    });
    const hasSameRef = normalized.some(
      (ref) =>
        ref.source === directRef.source &&
        ref.sourceId === directRef.sourceId &&
        ref.sourceUrl === directRef.sourceUrl
    );
    return hasSameRef ? normalized : [directRef, ...normalized];
  }

  private sourceRefsWithDirectRef(
    sourceRefs: FomoV2FundingSourceRef[] | undefined,
    input: Record<string, any>
  ): FomoV2FundingSourceRef[] {
    const normalized = this.normalizeSourceRefs(sourceRefs);
    const directSource = this.normalizeOptionalSourceType(input.primarySource);
    if (!directSource) return normalized;
    const directRef = cleanObject({
      source: directSource,
      sourceId: cleanFundingString(input.sourceId),
      sourceSlug: cleanFundingString(input.sourceSlug),
      sourceUrl: cleanFundingString(input.sourceUrl),
      sourceEntityKey: cleanFundingString(input.sourceEntityKey),
      sourceEntityId: toFundingObjectId(input.sourceEntityId),
      sourceSnapshotId: toFundingObjectId(input.sourceSnapshotId),
      confidence: normalizeFundingConfidence(input.confidence),
    });
    const hasSameRef = normalized.some(
      (ref) =>
        ref.source === directRef.source &&
        ref.sourceId === directRef.sourceId &&
        ref.sourceEntityKey === directRef.sourceEntityKey
    );
    return hasSameRef ? normalized : [directRef, ...normalized];
  }

  private reviewCandidates(
    entityType: string,
    sourceType: string,
    input: Record<string, any>
  ): FomoV2ReviewCandidateInput[] {
    if (
      Array.isArray(input.reviewCandidates) &&
      input.reviewCandidates.length
    ) {
      return input.reviewCandidates.map((candidate) => ({
        entityType: candidate.entityType || entityType,
        sourceType: candidate.sourceType || sourceType,
        sourceId: candidate.sourceId || input.sourceId || input.sourceBackerId,
        sourceEntityId: candidate.sourceEntityId || input.sourceEntityId,
        sourceSnapshotId: candidate.sourceSnapshotId || input.sourceSnapshotId,
        sourcePath: candidate.sourcePath || input.sourcePath,
        sourceUrl:
          candidate.sourceUrl || input.sourceUrl || input.sourceBackerUrl,
        payload: candidate.payload || input,
        normalizedPayload: candidate.normalizedPayload,
        confidence: candidate.confidence,
        metadata: candidate.metadata,
      }));
    }
    return [
      {
        entityType,
        sourceType,
        sourceId: input.sourceId || input.sourceBackerId,
        sourceEntityId: input.sourceEntityId,
        sourceSnapshotId: input.sourceSnapshotId,
        sourcePath: input.sourcePath,
        sourceUrl: input.sourceUrl || input.sourceBackerUrl,
        payload: input,
        normalizedPayload: {
          roundType: input.roundType,
          roundName: input.roundName,
          backerName: input.backerName || input.participantName,
        },
        metadata: input.metadata,
      },
    ];
  }

  private requireSourceType(value: any): string {
    const sourceType = this.normalizeOptionalSourceType(value);
    if (!sourceType)
      throw new Error("Funding source policy requires sourceType.");
    return sourceType;
  }

  private normalizeOptionalSourceType(value: any): string | undefined {
    return normalizeProjectSourceType(value) || undefined;
  }

  private normalizeSourceRefs(
    value: FomoV2FundingSourceRef[] | undefined
  ): FomoV2FundingSourceRef[] {
    return normalizeFundingSourceRefs(value).map((ref) => ({
      ...ref,
      source: normalizeProjectSourceType(ref.source),
    }));
  }

  private requireObjectId(value: any, field: string): Types.ObjectId {
    const objectId = toFundingObjectId(value);
    if (!objectId)
      throw new Error(`Invalid ${field} ObjectId value "${value}".`);
    return objectId;
  }

  private firstNumber(...values: any[]): number | undefined {
    for (const value of values) {
      if (value === undefined || value === null || value === "") continue;
      const number = Number(value);
      if (Number.isFinite(number)) return number;
    }
    return undefined;
  }

  private async findOneAndUpsert<T>(
    model: Model<T>,
    filter: FilterQuery<T>,
    setOnInsert: Record<string, any>,
    set: Record<string, any>
  ): Promise<FomoV2FundingUpsertResult<any>> {
    const insertPayload = cleanObject(setOnInsert);
    const setPayload = cleanObject(set);
    for (const key of Object.keys(insertPayload)) {
      if (Object.prototype.hasOwnProperty.call(setPayload, key))
        delete setPayload[key];
    }
    const raw = await (model as any).findOneAndUpdate(
      filter,
      {
        $setOnInsert: insertPayload,
        $set: setPayload,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        rawResult: true,
      }
    );
    return {
      doc: raw?.value || raw,
      created: Boolean(raw?.lastErrorObject?.upserted),
    };
  }
}
