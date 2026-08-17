import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  FOMO_V2_FLAG_ENTITY_TYPES,
  FOMO_V2_FLAG_STATUSES,
  FOMO_V2_FLAG_TYPES,
  FomoV2EntityFlag,
  FomoV2FlagEntityType,
  FomoV2FlagStatus,
  FomoV2FlagType,
} from "../models";

export interface FomoV2EntityFlagCreateInput {
  entityType?: string;
  entityId?: string;
  flagType?: string;
  title?: string;
  description?: string;
  sourceUrl?: string;
}

export interface FomoV2EntityFlagReviewInput {
  adminComment?: string;
  xpDelta?: number;
}

export interface FomoV2EntityFlagListQuery {
  status?: string;
  entityType?: string;
  flagType?: string;
  search?: string;
  page?: string | number;
  limit?: string | number;
}

const EMPTY_FLAG_STATE = {
  flags: [] as any[],
  greenFlagsList: [] as any[],
  yellowFlagsList: [] as any[],
  redFlagsList: [] as any[],
  greenFlagsCount: 0,
  yellowFlagsCount: 0,
  redFlagsCount: 0,
};

@Injectable()
export class FomoV2EntityFlagService {
  constructor(
    @InjectModel(FomoV2EntityFlag.name)
    private readonly flagModel: Model<FomoV2EntityFlag>
  ) {}

  async createFlag(
    input: FomoV2EntityFlagCreateInput,
    submittedByUserId: any
  ) {
    const entityType = this.normalizeEntityType(input?.entityType);
    const entityId = this.toIdString(input?.entityId);
    const flagType = this.normalizeFlagType(input?.flagType);
    const userId = this.toObjectId(submittedByUserId);
    const description = this.cleanText(input?.description, 4000);
    const title = this.cleanText(input?.title, 160);
    const sourceUrl = this.cleanText(input?.sourceUrl, 600);

    if (!entityType || !entityId || !flagType || !userId || !description) {
      throw new BadRequestException("Invalid flag payload.");
    }

    const flag = await this.flagModel.create({
      entityType,
      entityId,
      flagType,
      title,
      description,
      sourceUrl,
      status: "pending",
      submittedByUserId: userId,
    });

    return {
      ok: true,
      isSuccess: true,
      flag: this.serializeFlag(flag.toObject ? flag.toObject() : flag, true),
    };
  }

  async getFlagState(rawEntityType: any, rawEntityId: any) {
    const entityType = this.normalizeEntityType(rawEntityType);
    const entityId = this.toIdString(rawEntityId);
    if (!entityType || !entityId) return { ...EMPTY_FLAG_STATE };

    const rows = await this.flagModel
      .find({
        entityType: { $in: this.getPublicReadEntityTypes(entityType) },
        entityId,
        status: "confirmed",
      })
      .sort({ createdAt: -1, _id: -1 })
      .lean()
      .exec();

    return this.buildFlagState(rows);
  }

  async listAdmin(query: FomoV2EntityFlagListQuery = {}) {
    const page = this.positiveInteger(query.page, 1, 100000);
    const limit = this.positiveInteger(query.limit, 30, 200);
    const filter: Record<string, any> = {};
    const status = this.normalizeStatus(query.status);
    const entityType = this.normalizeEntityType(query.entityType);
    const flagType = this.normalizeFlagType(query.flagType);
    const search = this.cleanText(query.search, 160);

    if (status) filter.status = status;
    if (entityType) filter.entityType = entityType;
    if (flagType) filter.flagType = flagType;
    if (search) {
      const regex = new RegExp(this.escapeRegExp(search), "i");
      filter.$or = [
        { title: regex },
        { description: regex },
        { sourceUrl: regex },
        { entityId: regex },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total, statusCounts, typeCounts] = await Promise.all([
      this.flagModel
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.flagModel.countDocuments(filter),
      this.flagModel
        .aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ])
        .exec(),
      this.flagModel
        .aggregate([
          { $match: filter },
          { $group: { _id: "$flagType", count: { $sum: 1 } } },
        ])
        .exec(),
    ]);

    return {
      items: items.map((item) => this.serializeFlag(item, true)),
      total,
      page,
      limit,
      pages: Math.max(Math.ceil(total / limit), 1),
      counts: {
        byStatus: this.countRowsToRecord(statusCounts),
        byType: this.countRowsToRecord(typeCounts),
      },
    };
  }

  async getAdminFlag(id: string) {
    const flag = await this.findFlagById(id);
    return this.serializeFlag(flag, true);
  }

  async confirmFlag(id: string, adminId: any, input: FomoV2EntityFlagReviewInput = {}) {
    return this.reviewFlag(id, "confirmed", adminId, input);
  }

  async rejectFlag(id: string, adminId: any, input: FomoV2EntityFlagReviewInput = {}) {
    return this.reviewFlag(id, "rejected", adminId, input);
  }

  private async reviewFlag(
    id: string,
    status: FomoV2FlagStatus,
    adminId: any,
    input: FomoV2EntityFlagReviewInput
  ) {
    const reviewedByAdminId = this.toObjectId(adminId);
    const flagId = this.toObjectId(id);
    if (!reviewedByAdminId) {
      throw new BadRequestException("Invalid admin user.");
    }
    if (!flagId) throw new NotFoundException("FOMO v2 flag not found.");

    const flag = await this.flagModel
      .findByIdAndUpdate(
        flagId,
        {
          $set: {
            status,
            reviewedByAdminId,
            reviewedAt: new Date(),
            adminComment: this.cleanText(input?.adminComment, 1000),
            xpDelta: this.toOptionalNumber(input?.xpDelta),
          },
        },
        { new: true }
      )
      .lean()
      .exec();

    if (!flag) throw new NotFoundException("FOMO v2 flag not found.");

    return {
      ok: true,
      isSuccess: true,
      flag: this.serializeFlag(flag, true),
    };
  }

  private async findFlagById(id: string): Promise<any> {
    const objectId = this.toObjectId(id);
    if (!objectId) throw new NotFoundException("FOMO v2 flag not found.");

    const flag = await this.flagModel.findById(objectId).lean().exec();
    if (!flag) throw new NotFoundException("FOMO v2 flag not found.");

    return flag;
  }

  private buildFlagState(rows: any[]) {
    const flags = rows.map((row) => this.serializeFlag(row));
    const greenFlagsList = flags.filter((flag) => flag.flagType === "green");
    const yellowFlagsList = flags.filter((flag) => flag.flagType === "yellow");
    const redFlagsList = flags.filter((flag) => flag.flagType === "red");

    return {
      flags,
      greenFlagsList,
      yellowFlagsList,
      redFlagsList,
      greenFlagsCount: greenFlagsList.length,
      yellowFlagsCount: yellowFlagsList.length,
      redFlagsCount: redFlagsList.length,
    };
  }

  private serializeFlag(row: any, includeReviewFields = false) {
    const flagType = this.normalizeFlagType(row?.flagType) || "red";
    const sourceUrl = this.cleanText(row?.sourceUrl, 600);

    return this.cleanObject({
      _id: this.toIdString(row?._id),
      id: this.toIdString(row?._id),
      entityType: this.normalizeEntityType(row?.entityType),
      entityId: this.toIdString(row?.entityId),
      flagType,
      title: row?.title,
      description: row?.description,
      sourceUrl,
      status: this.normalizeStatus(row?.status),
      text: row?.description || row?.title || "",
      link: sourceUrl,
      links: sourceUrl,
      type: flagType === "green",
      submittedByUserId: includeReviewFields
        ? this.toIdString(row?.submittedByUserId)
        : undefined,
      reviewedByAdminId: includeReviewFields
        ? this.toIdString(row?.reviewedByAdminId)
        : undefined,
      reviewedAt: includeReviewFields ? row?.reviewedAt : undefined,
      adminComment: includeReviewFields ? row?.adminComment : undefined,
      xpDelta: includeReviewFields ? row?.xpDelta : undefined,
      createdAt: row?.createdAt,
      updatedAt: row?.updatedAt,
    });
  }

  private normalizeEntityType(value: any): FomoV2FlagEntityType | undefined {
    const raw = String(value || "").trim();
    const normalized = raw.toLowerCase().replace(/-/g, "_");
    const aliases: Record<string, FomoV2FlagEntityType> = {
      market: "market_project",
      project: "market_project",
      market_project: "market_project",
      canonicalproject: "market_project",
      canonical_project: "market_project",
      ico: "ico_project",
      ico_project: "ico_project",
      backer: "backer",
      fund: "backer",
      funds: "backer",
      person: "person",
      people: "person",
      persons: "person",
    };
    const result = aliases[normalized] || aliases[raw];

    return FOMO_V2_FLAG_ENTITY_TYPES.includes(result)
      ? result
      : undefined;
  }

  private normalizeFlagType(value: any): FomoV2FlagType | undefined {
    const normalized = String(value || "").trim().toLowerCase();
    return FOMO_V2_FLAG_TYPES.includes(normalized as FomoV2FlagType)
      ? (normalized as FomoV2FlagType)
      : undefined;
  }

  private getPublicReadEntityTypes(
    entityType: FomoV2FlagEntityType
  ): FomoV2FlagEntityType[] {
    if (entityType === "market_project" || entityType === "ico_project") {
      return ["market_project", "ico_project"];
    }

    return [entityType];
  }

  private normalizeStatus(value: any): FomoV2FlagStatus | undefined {
    const normalized = String(value || "").trim().toLowerCase();
    return FOMO_V2_FLAG_STATUSES.includes(normalized as FomoV2FlagStatus)
      ? (normalized as FomoV2FlagStatus)
      : undefined;
  }

  private toObjectId(value: any): Types.ObjectId | null {
    const id = this.toIdString(value);
    if (!id || !Types.ObjectId.isValid(id)) return null;

    try {
      return new Types.ObjectId(id);
    } catch (error) {
      return null;
    }
  }

  private toIdString(value: any): string {
    if (!value) return "";
    if (value instanceof Types.ObjectId) return value.toHexString();
    if (typeof value === "object" && value._id) return this.toIdString(value._id);
    if (typeof value === "object" && typeof value.toString === "function") {
      const stringified = value.toString();
      return stringified === "[object Object]" ? "" : stringified;
    }

    return String(value).trim();
  }

  private cleanText(value: any, maxLength: number): string {
    return String(value || "").trim().slice(0, maxLength);
  }

  private positiveInteger(value: any, fallback: number, max = 1000): number {
    const parsed = Math.trunc(Number(value));
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.min(parsed, max);
  }

  private toOptionalNumber(value: any): number | undefined {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private countRowsToRecord(rows: any[]): Record<string, number> {
    return (rows || []).reduce<Record<string, number>>((acc, row) => {
      if (row?._id) acc[String(row._id)] = Number(row.count || 0);
      return acc;
    }, {});
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private cleanObject<T extends Record<string, any>>(value: T): Partial<T> {
    return Object.entries(value).reduce<Record<string, any>>((acc, [key, item]) => {
      if (item !== undefined && item !== null && item !== "") acc[key] = item;
      return acc;
    }, {}) as Partial<T>;
  }
}
