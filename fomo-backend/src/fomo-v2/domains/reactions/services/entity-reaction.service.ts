import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  FOMO_V2_REACTION_ENTITY_TYPES,
  FOMO_V2_REACTIONS,
  FomoV2EntityReaction,
  FomoV2Reaction,
  FomoV2ReactionEntityType,
} from "../models";

export type FomoV2ReactionState = {
  likes: string[];
  dislikes: string[];
  likesCount: number;
  dislikesCount: number;
  userReaction: FomoV2Reaction | null;
};

const EMPTY_REACTION_STATE: FomoV2ReactionState = {
  likes: [],
  dislikes: [],
  likesCount: 0,
  dislikesCount: 0,
  userReaction: null,
};

@Injectable()
export class FomoV2EntityReactionService {
  constructor(
    @InjectModel(FomoV2EntityReaction.name)
    private readonly reactionModel: Model<FomoV2EntityReaction>
  ) {}

  async toggleReaction(
    rawEntityType: string,
    rawEntityId: any,
    rawUserId: any,
    rawReaction: string
  ): Promise<FomoV2ReactionState> {
    const entityType = this.normalizeEntityType(rawEntityType);
    const reaction = this.normalizeReaction(rawReaction);
    const entityId = this.toObjectId(rawEntityId);
    const userId = this.toObjectId(rawUserId);

    if (!entityType || !entityId || !userId || !reaction) {
      throw new BadRequestException("Invalid reaction target.");
    }

    const current = await this.reactionModel
      .findOne({ entityType, entityId, userId }, { reaction: 1 })
      .lean()
      .exec();

    if (current?.reaction === reaction) {
      await this.reactionModel.deleteOne({ entityType, entityId, userId }).exec();
    } else {
      await this.reactionModel
        .updateOne(
          { entityType, entityId, userId },
          { $set: { entityType, entityId, userId, reaction } },
          { upsert: true }
        )
        .exec();
    }

    return this.getReactionState(entityType, entityId, userId);
  }

  async getReactionState(
    rawEntityType: string,
    rawEntityId: any,
    rawUserId?: any
  ): Promise<FomoV2ReactionState> {
    const entityType = this.normalizeEntityType(rawEntityType);
    const entityId = this.toObjectId(rawEntityId);
    const userId = this.toObjectId(rawUserId);

    if (!entityType || !entityId) return { ...EMPTY_REACTION_STATE };

    const [counts, userReactionDoc] = await Promise.all([
      this.reactionModel
        .aggregate([
          { $match: { entityType, entityId } },
          { $group: { _id: "$reaction", count: { $sum: 1 } } },
        ])
        .exec(),
      userId
        ? this.reactionModel
            .findOne({ entityType, entityId, userId }, { reaction: 1 })
            .lean()
            .exec()
        : Promise.resolve(null),
    ]);

    const likesCount =
      counts.find((item: any) => item?._id === "like")?.count || 0;
    const dislikesCount =
      counts.find((item: any) => item?._id === "dislike")?.count || 0;

    return {
      likes: [],
      dislikes: [],
      likesCount,
      dislikesCount,
      userReaction: this.normalizeReaction(userReactionDoc?.reaction) || null,
    };
  }

  private normalizeEntityType(
    value: any
  ): FomoV2ReactionEntityType | undefined {
    const raw = String(value || "").trim();
    const aliases: Record<string, FomoV2ReactionEntityType> = {
      project: "canonicalProject",
      projects: "canonicalProject",
      "canonical-project": "canonicalProject",
      canonicalProject: "canonicalProject",
      backer: "backer",
      backers: "backer",
    };
    const normalized = aliases[raw];

    return FOMO_V2_REACTION_ENTITY_TYPES.includes(normalized)
      ? normalized
      : undefined;
  }

  private normalizeReaction(value: any): FomoV2Reaction | undefined {
    const normalized = String(value || "").trim().toLowerCase();
    return FOMO_V2_REACTIONS.includes(normalized as FomoV2Reaction)
      ? (normalized as FomoV2Reaction)
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
}
