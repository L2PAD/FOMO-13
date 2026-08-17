import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  FomoV2Activity,
  FomoV2ActivityDocument,
  FomoV2ActivityInteractionState,
  FomoV2ActivityUserStateResolver,
} from "src/fomo-v2/domains/activities";
import {
  CryptoActivityCalendarItem,
  CryptoActivityCalendarItemDocument,
} from "../models/crypto-activity-calendar-item.model";
import {
  CryptoActivityFavorite,
  CryptoActivityFavoriteDocument,
} from "../models/crypto-activity-favorite.model";
import {
  CryptoActivityReaction,
  CryptoActivityReactionDocument,
  CryptoActivityReactionType,
} from "../models/crypto-activity-reaction.model";
import {
  CryptoActivityStepProgress,
  CryptoActivityStepProgressDocument,
} from "../models/crypto-activity-step-progress.model";

const REACTIONS: CryptoActivityReactionType[] = [
  "like",
  "dislike",
  "hot",
  "interested",
];

@Injectable()
export class FomoV2ActivityUserStateService
  implements FomoV2ActivityUserStateResolver
{
  constructor(
    @InjectModel(CryptoActivityFavorite.name)
    private readonly favoriteModel: Model<CryptoActivityFavoriteDocument>,
    @InjectModel(CryptoActivityReaction.name)
    private readonly reactionModel: Model<CryptoActivityReactionDocument>,
    @InjectModel(CryptoActivityCalendarItem.name)
    private readonly calendarItemModel: Model<CryptoActivityCalendarItemDocument>,
    @InjectModel(CryptoActivityStepProgress.name)
    private readonly stepProgressModel: Model<CryptoActivityStepProgressDocument>,
    @InjectModel(FomoV2Activity.name)
    private readonly fomoV2ActivityModel: Model<FomoV2ActivityDocument>,
  ) {}

  async favoriteActivityIds(user: Record<string, any>): Promise<string[]> {
    const userId = this.userObjectId(user);
    if (!userId) return [];
    const rows = await this.favoriteModel
      .find({ userId }, { activityId: 1, v2ActivityId: 1 })
      .lean()
      .exec();
    const explicitIds = rows
      .map((row) => String(row.v2ActivityId || ""))
      .filter((id) => Types.ObjectId.isValid(id));
    const legacyIds = rows
      .filter((row) => !row.v2ActivityId)
      .map((row) => String(row.activityId || ""))
      .filter((id) => Types.ObjectId.isValid(id));
    const mappedLegacyIds = await this.resolveLegacyIds(legacyIds);

    return Array.from(new Set([...explicitIds, ...mappedLegacyIds]));
  }

  async enrich(
    activityIds: string[],
    user?: Record<string, any>,
  ): Promise<Record<string, FomoV2ActivityInteractionState>> {
    const objectIds = this.uniqueObjectIds(activityIds);
    if (!objectIds.length) return {};
    const relationToV2Id = await this.targetRelationMap(objectIds);
    const relationIds = this.uniqueObjectIds(Array.from(relationToV2Id.keys()));
    const result: Record<string, FomoV2ActivityInteractionState> = {};
    objectIds.forEach((id) => {
      result[String(id)] = {
        reactionCounts: { like: 0, dislike: 0, hot: 0, interested: 0 },
        userState: {
          isFavourite: false,
          reaction: null,
          isAddedToCalendar: false,
          completedStepIds: [],
        },
      };
    });

    const relationMatch = this.relationMatch(relationIds);
    const reactionRows = await this.reactionModel
      .find(relationMatch, { activityId: 1, v2ActivityId: 1, reaction: 1 })
      .lean()
      .exec();
    reactionRows.forEach((row) => {
      const id = this.resolveTargetId(row, relationToV2Id);
      const reaction = row?.reaction as CryptoActivityReactionType;
      if (!result[id] || !REACTIONS.includes(reaction)) return;
      result[id].reactionCounts![reaction] += 1;
    });

    const userId = this.userObjectId(user);
    if (!userId) return result;
    const userMatch = { userId, ...relationMatch };
    const [favorites, reactions, calendarItems, stepProgress] = await Promise.all([
      this.favoriteModel
        .find(userMatch, { activityId: 1, v2ActivityId: 1 })
        .lean()
        .exec(),
      this.reactionModel
        .find(userMatch, { activityId: 1, v2ActivityId: 1, reaction: 1 })
        .lean()
        .exec(),
      this.calendarItemModel
        .find(userMatch, { activityId: 1, v2ActivityId: 1 })
        .lean()
        .exec(),
      this.stepProgressModel
        .find(userMatch, {
          activityId: 1,
          v2ActivityId: 1,
          completedStepIds: 1,
        })
        .lean()
        .exec(),
    ]);

    favorites.forEach((row) => {
      const state = result[this.resolveTargetId(row, relationToV2Id)]?.userState;
      if (state) state.isFavourite = true;
    });
    reactions.forEach((row) => {
      const state = result[this.resolveTargetId(row, relationToV2Id)]?.userState;
      if (state) state.reaction = row.reaction;
    });
    calendarItems.forEach((row) => {
      const state = result[this.resolveTargetId(row, relationToV2Id)]?.userState;
      if (state) state.isAddedToCalendar = true;
    });
    stepProgress.forEach((row) => {
      const state = result[this.resolveTargetId(row, relationToV2Id)]?.userState;
      if (!state) return;
      state.completedStepIds = Array.from(
        new Set(
          (row.completedStepIds || [])
            .map((value) => String(value || "").trim())
            .filter(Boolean),
        ),
      );
    });

    return result;
  }

  private relationMatch(ids: Types.ObjectId[]) {
    return {
      $or: [
        { v2ActivityId: { $in: ids } },
        { activityId: { $in: ids } },
      ],
    };
  }

  private relationId(row: any): string {
    return String(row?.v2ActivityId || row?.activityId || "");
  }

  private resolveTargetId(row: any, relationToV2Id: Map<string, string>): string {
    const explicitV2Id = String(row?.v2ActivityId || "");
    if (explicitV2Id && relationToV2Id.has(explicitV2Id)) {
      return relationToV2Id.get(explicitV2Id)!;
    }
    return relationToV2Id.get(String(row?.activityId || "")) || "";
  }

  private async resolveLegacyIds(legacyIds: string[]): Promise<string[]> {
    const validIds = Array.from(
      new Set(legacyIds.filter((id) => Types.ObjectId.isValid(id))),
    );
    if (!validIds.length) return [];
    const rows = await this.fomoV2ActivityModel
      .find(
        {
          $or: [
            { _id: { $in: validIds.map((id) => new Types.ObjectId(id)) } },
            { legacyActivityId: { $in: validIds } },
          ],
        },
        { _id: 1, legacyActivityId: 1 },
      )
      .lean()
      .exec();
    const byLegacyId = new Map<string, string>();
    rows.forEach((row: any) => {
      const v2Id = String(row._id);
      byLegacyId.set(v2Id, v2Id);
      if (row.legacyActivityId) byLegacyId.set(String(row.legacyActivityId), v2Id);
    });
    return validIds.map((id) => byLegacyId.get(id)).filter(Boolean) as string[];
  }

  private async targetRelationMap(
    targetIds: Types.ObjectId[],
  ): Promise<Map<string, string>> {
    const targetStrings = targetIds.map((id) => String(id));
    const rows = await this.fomoV2ActivityModel
      .find(
        { _id: { $in: targetIds } },
        { _id: 1, legacyActivityId: 1 },
      )
      .lean()
      .exec();
    const relationToV2Id = new Map<string, string>();
    targetStrings.forEach((id) => relationToV2Id.set(id, id));
    rows.forEach((row: any) => {
      const v2Id = String(row._id);
      relationToV2Id.set(v2Id, v2Id);
      const legacyId = String(row.legacyActivityId || "");
      if (Types.ObjectId.isValid(legacyId)) {
        relationToV2Id.set(legacyId, v2Id);
      }
    });
    return relationToV2Id;
  }

  private userObjectId(user?: Record<string, any>): Types.ObjectId | null {
    const id = String(user?._id || user?.id || "").trim();
    return Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null;
  }

  private uniqueObjectIds(values: string[]): Types.ObjectId[] {
    return Array.from(
      new Set(
        values
          .map((value) => String(value || ""))
          .filter((value) => Types.ObjectId.isValid(value)),
      ),
    ).map((value) => new Types.ObjectId(value));
  }
}
