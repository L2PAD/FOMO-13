import { Types } from "mongoose";
import { FomoV2ActivityUserStateService } from "./fomo-v2-activity-user-state.service";

const queryResult = (rows: any[]) => ({
  lean: () => ({ exec: async () => rows }),
});

describe("FomoV2ActivityUserStateService", () => {
  it("uses the explicit v2 relation when returning favourite ids", async () => {
    const legacyId = new Types.ObjectId();
    const v2Id = new Types.ObjectId();
    const favorites = {
      find: jest.fn(() => queryResult([{ activityId: legacyId, v2ActivityId: v2Id }])),
    } as any;
    const service = new FomoV2ActivityUserStateService(
      favorites,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    await expect(
      service.favoriteActivityIds({ _id: new Types.ObjectId() }),
    ).resolves.toEqual([String(v2Id)]);
  });

  it("maps legacy interaction ids through activities.legacyActivityId", async () => {
    const legacyId = new Types.ObjectId();
    const v2Id = new Types.ObjectId();
    const favorites = {
      find: jest.fn(() => queryResult([{ activityId: legacyId }])),
    } as any;
    const activities = {
      find: jest.fn(() =>
        queryResult([{ _id: v2Id, legacyActivityId: String(legacyId) }]),
      ),
    } as any;
    const service = new FomoV2ActivityUserStateService(
      favorites,
      {} as any,
      {} as any,
      {} as any,
      activities,
    );

    await expect(
      service.favoriteActivityIds({ _id: new Types.ObjectId() }),
    ).resolves.toEqual([String(v2Id)]);
  });

  it("returns public reaction counts without requiring authentication", async () => {
    const activityId = new Types.ObjectId();
    const reactions = {
      find: jest.fn(() =>
        queryResult([
          { activityId, reaction: "hot" },
          { activityId, reaction: "hot" },
          { activityId, reaction: "hot" },
        ]),
      ),
    } as any;
    const activities = {
      find: jest.fn(() => queryResult([{ _id: activityId }])),
    } as any;
    const service = new FomoV2ActivityUserStateService(
      {} as any,
      reactions,
      {} as any,
      {} as any,
      activities,
    );

    const result = await service.enrich([String(activityId)]);

    expect(result[String(activityId)].reactionCounts).toEqual({
      like: 0,
      dislike: 0,
      hot: 3,
      interested: 0,
    });
    expect(result[String(activityId)].userState?.isFavourite).toBe(false);
  });
});
