import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { normalizeProjectSourceType } from "../../../shared/source-policy";
import { FomoV2ReviewBatch } from "../../review/models/review-batch.model";
import {
  buildBackerFingerprint,
  cleanBackerString,
  cleanObject,
  inferBackerType,
  normalizeBackerPayload,
  normalizeBackerSocials,
  normalizeBackerSourceRefs,
  normalizeBackerStatus,
  normalizeBackerUrl,
  normalizeBackerName,
  slugifyBacker,
  toBackerIdString,
  toBackerObjectId,
} from "../helpers";
import {
  BackerDomainAuditResult,
  FomoV2BackerReadModelUpsertInput,
  FomoV2BackerSourceProfileUpsertInput,
  FomoV2BackerType,
  FomoV2BackerUpsertInput,
  FomoV2BackerUpsertResult,
} from "../types";
import {
  FomoV2Backer,
  FomoV2BackerDocument,
  FomoV2BackerReadModel,
  FomoV2BackerReadModelDocument,
  FomoV2BackerSourceProfile,
  FomoV2BackerSourceProfileDocument,
} from "../models";

@Injectable()
export class FomoV2BackerService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(FomoV2Backer.name)
    private readonly backerModel: Model<FomoV2BackerDocument>,
    @InjectModel(FomoV2BackerSourceProfile.name)
    private readonly sourceProfileModel: Model<FomoV2BackerSourceProfileDocument>,
    @InjectModel(FomoV2BackerReadModel.name)
    private readonly readModel: Model<FomoV2BackerReadModelDocument>,
    @InjectModel(FomoV2ReviewBatch.name)
    private readonly reviewBatchModel: Model<FomoV2ReviewBatch>
  ) {}

  async findById(id: Types.ObjectId | string): Promise<FomoV2BackerDocument | null> {
    const objectId = toBackerObjectId(id);
    if (!objectId) return null;
    return this.backerModel.findById(objectId).exec();
  }

  async findByFingerprint(
    canonicalFingerprint: string
  ): Promise<FomoV2BackerDocument | null> {
    const fingerprint = cleanBackerString(canonicalFingerprint);
    if (!fingerprint) return null;
    return this.backerModel.findOne({ canonicalFingerprint: fingerprint }).exec();
  }

  async findBySourceIdentity(
    sourceType: string,
    sourceInvestorId: string
  ): Promise<FomoV2BackerDocument | null> {
    const profile = await this.findSourceProfileBySourceIdentity(
      sourceType,
      sourceInvestorId
    );
    if (profile?.backerId) {
      const backer = await this.findById(profile.backerId);
      if (backer) return backer;
    }

    const normalizedSourceType = normalizeProjectSourceType(sourceType);
    const normalizedSourceId = cleanBackerString(sourceInvestorId);
    if (!normalizedSourceType || !normalizedSourceId) return null;

    return this.backerModel
      .findOne({
        primarySource: normalizedSourceType,
        sourceId: normalizedSourceId,
      })
      .exec();
  }

  async findSourceProfileBySourceIdentity(
    sourceType: string,
    sourceInvestorId: string
  ): Promise<FomoV2BackerSourceProfileDocument | null> {
    const normalizedSourceType = normalizeProjectSourceType(sourceType);
    const normalizedSourceId = cleanBackerString(sourceInvestorId);
    if (!normalizedSourceType || !normalizedSourceId) return null;

    return this.sourceProfileModel
      .findOne({
        sourceType: normalizedSourceType,
        sourceInvestorId: normalizedSourceId,
      })
      .exec();
  }

  async findSourceProfileForBacker(
    backerId: Types.ObjectId | string,
    sourceType: string
  ): Promise<FomoV2BackerSourceProfileDocument | null> {
    const objectId = toBackerObjectId(backerId);
    const normalizedSourceType = normalizeProjectSourceType(sourceType);
    if (!objectId || !normalizedSourceType) return null;

    return this.sourceProfileModel
      .findOne({ backerId: objectId, sourceType: normalizedSourceType })
      .exec();
  }

  async findPotentialMatches(input: {
    normalizedName: string;
    backerType?: FomoV2BackerType | string;
    limit?: number;
  }): Promise<FomoV2BackerDocument[]> {
    const normalizedName = cleanBackerString(input.normalizedName);
    if (!normalizedName) return [];
    const query: Record<string, any> = {
      normalizedName,
      status: { $ne: "merged" },
    };
    if (input.backerType) {
      query.backerType = inferBackerType({ backerType: input.backerType });
    }
    return this.backerModel
      .find(query)
      .sort({ updatedAt: -1 })
      .limit(input.limit || 10)
      .exec();
  }

  async upsertBacker(
    input: FomoV2BackerUpsertInput
  ): Promise<FomoV2BackerUpsertResult<FomoV2BackerDocument>> {
    const payload = this.prepareBackerPayload(input);

    let existing: FomoV2BackerDocument | null = null;
    if (payload.primarySource && payload.sourceId) {
      existing = await this.findBySourceIdentity(
        payload.primarySource,
        payload.sourceId
      );
    }
    if (!existing) {
      existing = await this.findByFingerprint(payload.canonicalFingerprint);
    }

    if (existing) {
      this.mergeBacker(existing, payload);
      await existing.save();
      return { doc: existing, created: false };
    }

    const created = await this.backerModel.create({
      ...payload,
      status: payload.status || "active",
    });
    return { doc: created, created: true };
  }

  async upsertSourceProfile(
    input: FomoV2BackerSourceProfileUpsertInput
  ): Promise<FomoV2BackerUpsertResult<FomoV2BackerSourceProfileDocument>> {
    const payload = this.prepareSourceProfilePayload(input);
    let existing: FomoV2BackerSourceProfileDocument | null = null;

    if (payload.sourceInvestorId) {
      existing = await this.sourceProfileModel
        .findOne({
          sourceType: payload.sourceType,
          sourceInvestorId: payload.sourceInvestorId,
        })
        .exec();
    }

    if (!existing) {
      existing = await this.sourceProfileModel
        .findOne({
          backerId: payload.backerId,
          sourceType: payload.sourceType,
        })
        .exec();
    }

    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      return { doc: existing, created: false };
    }

    const created = await this.sourceProfileModel.create(payload);
    return { doc: created, created: true };
  }

  async upsertReadModel(
    input: FomoV2BackerReadModelUpsertInput
  ): Promise<FomoV2BackerUpsertResult<FomoV2BackerReadModelDocument>> {
    const payload = this.prepareReadModelPayload(input);
    const existing = await this.readModel
      .findOne({ backerId: payload.backerId })
      .exec();

    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      return { doc: existing, created: false };
    }

    const created = await this.readModel.create(payload);
    return { doc: created, created: true };
  }

  buildReadModelInputFromBacker(
    backer: FomoV2BackerDocument | FomoV2Backer,
    hasSourceProfile = false
  ): FomoV2BackerReadModelUpsertInput {
    return {
      backerId: (backer as any)._id,
      name: backer.name,
      normalizedName: backer.normalizedName,
      slug: backer.slug,
      backerType: backer.backerType,
      description: backer.description,
      website: backer.website,
      socials: backer.socials,
      logoUrl: backer.logoUrl,
      avatarUrl: backer.avatarUrl,
      country: backer.country,
      niche: backer.niche || cleanBackerString((backer as any).metadata?.rawType),
      hasSourceProfile,
      primarySource: backer.primarySource,
      profileCompleteness: this.profileCompleteness(backer),
    };
  }

  async auditDomain(): Promise<BackerDomainAuditResult> {
    const [
      backersCount,
      sourceProfilesCount,
      readModelsCount,
      reviewBatchesCount,
      indexes,
      duplicatesByCanonicalFingerprint,
      duplicatesByNormalizedNameAndBackerType,
      sourceProfilesWithoutBackerId,
      readModelsWithoutBackerId,
      danglingSourceProfiles,
      danglingReadModels,
      extraTopLevelFields,
      invalidBackerTypes,
      reviewBatchesByReason,
    ] = await Promise.all([
      this.backerModel.countDocuments(),
      this.sourceProfileModel.countDocuments(),
      this.readModel.countDocuments(),
      this.reviewBatchModel.countDocuments({ domain: "backers" }),
      this.listDomainIndexes(),
      this.backerModel.aggregate([
        {
          $group: {
            _id: "$canonicalFingerprint",
            count: { $sum: 1 },
            ids: { $push: "$_id" },
          },
        },
        { $match: { _id: { $ne: null }, count: { $gt: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 100 },
      ]),
      this.backerModel.aggregate([
        {
          $group: {
            _id: {
              normalizedName: "$normalizedName",
              backerType: "$backerType",
            },
            count: { $sum: 1 },
            ids: { $push: "$_id" },
          },
        },
        {
          $match: {
            "_id.normalizedName": { $ne: null },
            count: { $gt: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 100 },
      ]),
      this.sourceProfileModel.countDocuments({
        $or: [{ backerId: { $exists: false } }, { backerId: null }],
      }),
      this.readModel.countDocuments({
        $or: [{ backerId: { $exists: false } }, { backerId: null }],
      }),
      this.sourceProfileModel.aggregate([
        { $match: { backerId: { $type: "objectId" } } },
        {
          $lookup: {
            from: "backers",
            localField: "backerId",
            foreignField: "_id",
            as: "backer",
          },
        },
        { $match: { backer: { $size: 0 } } },
        { $project: { backer: 0 } },
        { $limit: 100 },
      ]),
      this.readModel.aggregate([
        { $match: { backerId: { $type: "objectId" } } },
        {
          $lookup: {
            from: "backers",
            localField: "backerId",
            foreignField: "_id",
            as: "backer",
          },
        },
        { $match: { backer: { $size: 0 } } },
        { $project: { backer: 0 } },
        { $limit: 100 },
      ]),
      this.extraTopLevelFields(),
      this.invalidBackerTypes(),
      this.reviewBatchModel.aggregate([
        { $match: { domain: "backers" } },
        {
          $group: {
            _id: { reason: "$reason", status: "$status" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.reason": 1, "_id.status": 1 } },
      ]),
    ]);

    return {
      runner: "fomo-v2:backer-domain-audit",
      mode: "read-only",
      dbName: this.dbName(),
      generatedAt: new Date().toISOString(),
      counts: {
        backers: backersCount,
        backer_source_profiles: sourceProfilesCount,
        backer_read_models: readModelsCount,
        backer_review_batches: reviewBatchesCount,
      },
      indexes,
      duplicatesByCanonicalFingerprint,
      duplicatesByNormalizedNameAndBackerType,
      sourceProfilesWithoutBackerId,
      readModelsWithoutBackerId,
      danglingSourceProfiles,
      danglingReadModels,
      extraTopLevelFields,
      invalidBackerTypes,
      reviewBatchesByReason,
      READ_ONLY: "YES",
      WRITES_PERFORMED: 0,
    };
  }

  private prepareBackerPayload(input: FomoV2BackerUpsertInput): FomoV2BackerUpsertInput {
    const normalized = normalizeBackerPayload(input);
    if (!normalized.name || !normalized.normalizedName) {
      throw new Error("Backer name is required.");
    }
    const primarySource = cleanBackerString(input.primarySource)?.toLowerCase();
    const sourceId = cleanBackerString(input.sourceId);
    const canonicalFingerprint =
      cleanBackerString(input.canonicalFingerprint) ||
      buildBackerFingerprint(normalized);

    return cleanObject({
      ...normalized,
      status: normalized.status || normalizeBackerStatus(input.status),
      primarySource,
      sourceId,
      sourceUrl: normalizeBackerUrl(input.sourceUrl),
      sourceRefs: normalizeBackerSourceRefs(input.sourceRefs),
      canonicalFingerprint,
      confidence:
        typeof input.confidence === "number" && Number.isFinite(input.confidence)
          ? input.confidence
          : undefined,
      metadata:
        input.metadata && typeof input.metadata === "object"
          ? input.metadata
          : undefined,
    });
  }

  private prepareSourceProfilePayload(
    input: FomoV2BackerSourceProfileUpsertInput
  ): FomoV2BackerSourceProfileUpsertInput & { backerId: Types.ObjectId } {
    const backerId = toBackerObjectId(input.backerId);
    if (!backerId) throw new Error("Valid backerId is required.");
    const name = cleanBackerString(input.name);
    if (!name) throw new Error("Source profile name is required.");
    const normalizedName =
      cleanBackerString(input.normalizedName) || normalizeBackerName(name);
    const sourceType = normalizeProjectSourceType(input.sourceType);
    if (!sourceType) throw new Error("Source profile sourceType is required.");

    return cleanObject({
      backerId,
      sourceType,
      sourceInvestorId: cleanBackerString(input.sourceInvestorId),
      sourceSlug: cleanBackerString(input.sourceSlug),
      sourceUrl: normalizeBackerUrl(input.sourceUrl),
      name,
      normalizedName,
      backerType: inferBackerType(input),
      description: cleanBackerString(input.description),
      website: normalizeBackerUrl(input.website),
      socials: normalizeBackerSocials(input.socials),
      logoUrl: normalizeBackerUrl(input.logoUrl),
      avatarUrl: normalizeBackerUrl(input.avatarUrl),
      country: cleanBackerString(input.country),
      sourceEntityId:
        toBackerObjectId(input.sourceEntityId) || cleanBackerString(input.sourceEntityId),
      sourceSnapshotId:
        toBackerObjectId(input.sourceSnapshotId) ||
        cleanBackerString(input.sourceSnapshotId),
      metadata:
        input.metadata && typeof input.metadata === "object"
          ? input.metadata
          : undefined,
    }) as any;
  }

  private prepareReadModelPayload(
    input: FomoV2BackerReadModelUpsertInput
  ): FomoV2BackerReadModelUpsertInput & { backerId: Types.ObjectId } {
    const backerId = toBackerObjectId(input.backerId);
    if (!backerId) throw new Error("Valid backerId is required.");
    const name = cleanBackerString(input.name);
    if (!name) throw new Error("Read model name is required.");
    const normalizedName =
      cleanBackerString(input.normalizedName) || normalizeBackerName(name);
    return cleanObject({
      backerId,
      name,
      normalizedName,
      slug: cleanBackerString(input.slug) || slugifyBacker(name),
      backerType: inferBackerType(input),
      description: cleanBackerString(input.description),
      website: normalizeBackerUrl(input.website),
      socials: normalizeBackerSocials(input.socials),
      logoUrl: normalizeBackerUrl(input.logoUrl),
      avatarUrl: normalizeBackerUrl(input.avatarUrl),
      country: cleanBackerString(input.country),
      niche: cleanBackerString(input.niche),
      hasSourceProfile: Boolean(input.hasSourceProfile),
      primarySource: cleanBackerString(input.primarySource)?.toLowerCase(),
      profileCompleteness:
        typeof input.profileCompleteness === "number"
          ? input.profileCompleteness
          : undefined,
    }) as any;
  }

  private mergeBacker(
    existing: FomoV2BackerDocument,
    payload: FomoV2BackerUpsertInput
  ): void {
    existing.name = this.preferredString(existing.name, payload.name);
    existing.normalizedName = payload.normalizedName || existing.normalizedName;
    existing.slug = this.preferredString(existing.slug, payload.slug);

    if (
      (!["fund", "person"].includes(String(existing.backerType))) &&
      payload.backerType
    ) {
      existing.backerType = payload.backerType as FomoV2BackerType;
    }

    for (const field of [
      "description",
      "website",
      "logoUrl",
      "avatarUrl",
      "country",
      "niche",
      "sourceUrl",
    ] as const) {
      const value = cleanBackerString(payload[field]);
      if (value) (existing as any)[field] = value;
    }

    if (payload.socials && Object.keys(payload.socials).length) {
      existing.socials = {
        ...(existing.socials || {}),
        ...(payload.socials || {}),
      };
    }

    if (payload.status && existing.status !== "merged") {
      existing.status = normalizeBackerStatus(payload.status);
    }

    if (
      typeof payload.confidence === "number" &&
      (!existing.confidence || payload.confidence >= existing.confidence)
    ) {
      existing.confidence = payload.confidence;
    }

    if (!existing.primarySource && payload.primarySource) {
      existing.primarySource = payload.primarySource;
    }
    if (!existing.sourceId && payload.sourceId) {
      existing.sourceId = payload.sourceId;
    }
    if (payload.canonicalFingerprint) {
      existing.canonicalFingerprint = payload.canonicalFingerprint;
    }

    existing.sourceRefs = this.mergeSourceRefs(
      existing.sourceRefs || [],
      payload.sourceRefs || []
    );
    existing.metadata = {
      ...(existing.metadata || {}),
      ...(payload.metadata || {}),
    };
  }

  private preferredString(current: any, incoming: any): string {
    return cleanBackerString(incoming) || cleanBackerString(current) || "";
  }

  private mergeSourceRefs(existing: any[], incoming: any[]): any[] {
    const refsByKey = new Map<string, any>();
    for (const ref of [...existing, ...incoming]) {
      if (!ref?.sourceType) continue;
      refsByKey.set(this.sourceRefKey(ref), {
        ...(refsByKey.get(this.sourceRefKey(ref)) || {}),
        ...ref,
      });
    }
    return Array.from(refsByKey.values());
  }

  private sourceRefKey(ref: any): string {
    return [
      normalizeProjectSourceType(ref.sourceType) || "unknown",
      cleanBackerString(ref.sourceId) ||
        toBackerIdString(ref.sourceEntityId) ||
        cleanBackerString(ref.sourcePath) ||
        cleanBackerString(ref.sourceUrl) ||
        "unknown",
    ].join(":");
  }

  private profileCompleteness(backer: Partial<FomoV2Backer>): number {
    const checks = [
      backer.name,
      backer.slug,
      backer.backerType,
      backer.description,
      backer.website,
      backer.socials && Object.keys(backer.socials).length,
      backer.logoUrl || backer.avatarUrl,
      backer.country,
      backer.primarySource && backer.sourceId,
    ];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  }

  private async listDomainIndexes(): Promise<Record<string, string[]>> {
    const entries = await Promise.all([
      this.listIndexNames(this.backerModel),
      this.listIndexNames(this.sourceProfileModel),
      this.listIndexNames(this.readModel),
    ]);
    return {
      backers: entries[0],
      backer_source_profiles: entries[1],
      backer_read_models: entries[2],
    };
  }

  private async listIndexNames(model: Model<any>): Promise<string[]> {
    try {
      const indexes = await model.collection.listIndexes().toArray();
      return indexes.map((index) => String(index.name)).filter(Boolean);
    } catch (error: any) {
      if (error?.codeName === "NamespaceNotFound" || error?.code === 26) {
        return [];
      }
      return [];
    }
  }

  private async extraTopLevelFields(): Promise<Record<string, any[]>> {
    const [backers, sourceProfiles, readModels] = await Promise.all([
      this.extraFieldsForModel(this.backerModel),
      this.extraFieldsForModel(this.sourceProfileModel),
      this.extraFieldsForModel(this.readModel),
    ]);
    return {
      backers,
      backer_source_profiles: sourceProfiles,
      backer_read_models: readModels,
    };
  }

  private async invalidBackerTypes(): Promise<Record<string, any[]>> {
    const allowed = ["fund", "person"];
    const [backers, sourceProfiles, readModels] = await Promise.all([
      this.invalidBackerTypesForModel(this.backerModel, allowed),
      this.invalidBackerTypesForModel(this.sourceProfileModel, allowed),
      this.invalidBackerTypesForModel(this.readModel, allowed),
    ]);
    return {
      backers,
      backer_source_profiles: sourceProfiles,
      backer_read_models: readModels,
    };
  }

  private async invalidBackerTypesForModel(
    model: Model<any>,
    allowed: string[]
  ): Promise<any[]> {
    return model.aggregate([
      {
        $match: {
          $or: [
            { backerType: { $exists: false } },
            { backerType: null },
            { backerType: { $nin: allowed } },
          ],
        },
      },
      {
        $group: {
          _id: "$backerType",
          count: { $sum: 1 },
          ids: { $push: "$_id" },
        },
      },
      {
        $project: {
          count: 1,
          sampleIds: { $slice: ["$ids", 20] },
        },
      },
      { $sort: { count: -1 } },
    ]);
  }

  private async extraFieldsForModel(model: Model<any>): Promise<any[]> {
    const allowed = this.allowedTopLevelFields(model);
    return model.aggregate([
      { $project: { fields: { $objectToArray: "$$ROOT" } } },
      { $unwind: "$fields" },
      { $group: { _id: "$fields.k", count: { $sum: 1 } } },
      { $match: { _id: { $nin: allowed } } },
      { $sort: { count: -1, _id: 1 } },
    ]);
  }

  private allowedTopLevelFields(model: Model<any>): string[] {
    return Array.from(
      new Set([
        "_id",
        "__v",
        ...Object.keys(model.schema.paths).map((path) => path.split(".")[0]),
      ])
    );
  }

  private dbName(): string {
    return (
      String(
        this.configService.get("DB_NAME") || process.env.DB_NAME || "fomoland"
      ).trim() || "fomoland"
    );
  }
}
