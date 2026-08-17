import { BadRequestException } from "@nestjs/common";
import { Types } from "mongoose";
import { ActivitiesService } from "./activities.service";

const queryResult = <T>(value: T) => {
  const query: any = {
    exec: jest.fn().mockResolvedValue(value),
  };
  query.sort = jest.fn().mockReturnValue(query);
  query.lean = jest.fn().mockReturnValue(query);
  query.select = jest.fn().mockReturnValue(query);
  query.then = (resolve: any, reject: any) =>
    Promise.resolve(value).then(resolve, reject);
  return query;
};

describe("ActivitiesService v2 relation compatibility", () => {
  const userId = new Types.ObjectId();
  const v2ActivityId = new Types.ObjectId();
  const legacyActivityId = new Types.ObjectId();

  const createService = (overrides: Record<string, any> = {}) => {
    const emptyModel = {
      find: jest.fn().mockReturnValue(queryResult([])),
      findOne: jest.fn().mockReturnValue(queryResult(null)),
      findOneAndUpdate: jest.fn().mockResolvedValue(null),
      findOneAndDelete: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      countDocuments: jest.fn().mockResolvedValue(0),
      insertMany: jest.fn().mockResolvedValue([]),
    };
    const favoriteModel = overrides.favoriteModel || { ...emptyModel };
    const reactionModel = overrides.reactionModel || { ...emptyModel };
    const reportModel = overrides.reportModel || {
      ...emptyModel,
      create: jest.fn(),
    };
    const calendarItemModel = overrides.calendarItemModel || { ...emptyModel };
    const boardModel = overrides.boardModel || { ...emptyModel };
    const boardColumnModel = overrides.boardColumnModel || { ...emptyModel };
    const boardTaskModel = overrides.boardTaskModel || { ...emptyModel };
    const stepProgressModel = overrides.stepProgressModel || { ...emptyModel };
    const taskModel = overrides.taskModel || { ...emptyModel };
    const taskUserStateModel = overrides.taskUserStateModel || { ...emptyModel };
    const userModel = overrides.userModel || { ...emptyModel };
    const compatibilityService = overrides.compatibilityService || {
      resolveForInteraction: jest.fn().mockResolvedValue({
        activityId: v2ActivityId,
        v2ActivityId,
        legacyActivityId,
        activity: {},
      }),
      viewerId: jest.fn().mockReturnValue(String(userId)),
      requireAccess: jest.fn().mockResolvedValue({ allowed: true }),
      resolveAccess: jest.fn().mockResolvedValue({ allowed: true }),
      resolveObjectIds: jest.fn().mockResolvedValue({
        activities: new Map(),
        knownV2Ids: new Set(),
        blockedIds: new Set(),
      }),
      relationId: jest.fn((row: any) =>
        String(row?.v2ActivityId || row?.activityId || "")
      ),
    };
    const service = new ActivitiesService(
      overrides.activityModel || (emptyModel as any),
      favoriteModel as any,
      reactionModel as any,
      reportModel as any,
      calendarItemModel as any,
      boardModel as any,
      boardColumnModel as any,
      boardTaskModel as any,
      stepProgressModel as any,
      emptyModel as any,
      emptyModel as any,
      taskModel as any,
      taskUserStateModel as any,
      userModel as any,
      compatibilityService as any
    );

    return {
      service,
      favoriteModel,
      reactionModel,
      reportModel,
      calendarItemModel,
      boardColumnModel,
      boardTaskModel,
      taskModel,
      taskUserStateModel,
      userModel,
      compatibilityService,
    };
  };

  it("maps admin tasks as immutable global board items", () => {
    const { service } = createService();
    const taskId = new Types.ObjectId();
    const columnId = new Types.ObjectId();
    const mapped = (service as any).mapAdminTaskForUi(
      {
        _id: taskId,
        v2ActivityId,
        name: "Join the campaign",
        accessTier: "prime",
        date: new Date("2026-07-20T00:00:00.000Z"),
      },
      { status: "in-progress" },
      [{ _id: columnId, title: "In Progress" }],
      { _id: v2ActivityId, projectName: "Demo activity" },
      { allowed: false, contentRedacted: true, reason: "nft_required" }
    );

    expect(mapped).toEqual(
      expect.objectContaining({
        id: `admin-task-${taskId}`,
        sourceType: "admin-task",
        isGlobal: true,
        isSystem: true,
        canDelete: false,
        canEdit: false,
        isPrime: true,
        isLocked: true,
        status: "in-progress",
        columnId: String(columnId),
      })
    );
  });

  it("rejects deletion of shared admin tasks before touching user board rows", async () => {
    const { service, boardTaskModel } = createService();

    await expect(
      service.deleteBoardTask(
        { _id: userId },
        `admin-task-${new Types.ObjectId()}`
      )
    ).rejects.toThrow("Shared Earlyland tasks cannot be deleted");
    expect(boardTaskModel.findOneAndDelete).not.toHaveBeenCalled();
  });

  it("migrates an old favorite relation and removes its parallel v2 duplicate", async () => {
    const oldRowId = new Types.ObjectId();
    const v2RowId = new Types.ObjectId();
    const favoriteModel = {
      find: jest.fn().mockReturnValue(
        queryResult([
          { _id: oldRowId, activityId: legacyActivityId },
          { _id: v2RowId, activityId: v2ActivityId, v2ActivityId },
        ])
      ),
      deleteMany: jest.fn().mockResolvedValue({ deletedCount: 1 }),
      findOneAndUpdate: jest.fn().mockResolvedValue({ _id: v2RowId }),
    };
    const { service } = createService({ favoriteModel });

    await service.favoriteActivity(String(legacyActivityId), { _id: userId });

    const identityQuery = favoriteModel.find.mock.calls[0][0];
    expect(identityQuery.userId).toEqual(userId);
    expect(identityQuery.$or[0]).toEqual({ v2ActivityId });
    expect(identityQuery.$or[1].activityId.$in.map(String)).toEqual(
      expect.arrayContaining([String(v2ActivityId), String(legacyActivityId)])
    );
    expect(favoriteModel.deleteMany).toHaveBeenCalledWith({
      _id: { $in: [oldRowId] },
      userId,
    });
    expect(favoriteModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: v2RowId, userId },
      {
        $set: {
          userId,
          activityId: v2ActivityId,
          v2ActivityId,
          activityEntity: "fomo_v2",
        },
      },
      { new: true }
    );
  });

  it("removes favorites, reactions, and calendar rows through both identities", async () => {
    const favoriteModel = { deleteMany: jest.fn().mockResolvedValue({}) };
    const reactionModel = { deleteMany: jest.fn().mockResolvedValue({}) };
    const calendarItemModel = { deleteMany: jest.fn().mockResolvedValue({}) };
    const { service } = createService({
      favoriteModel,
      reactionModel,
      calendarItemModel,
    });

    await service.unfavoriteActivity(String(v2ActivityId), { _id: userId });
    await service.removeReactionFromActivity(String(v2ActivityId), {
      _id: userId,
    });
    await service.removeActivityFromCalendar(String(v2ActivityId), {
      _id: userId,
    });

    for (const model of [favoriteModel, reactionModel, calendarItemModel]) {
      const query = model.deleteMany.mock.calls[0][0];
      expect(query.$or[0]).toEqual({ v2ActivityId });
      expect(query.$or[1].activityId.$in.map(String)).toEqual(
        expect.arrayContaining([String(v2ActivityId), String(legacyActivityId)])
      );
    }
  });

  it("accepts a serialized v2 activity date when adding it to the calendar", async () => {
    const calendarItemModel = {
      find: jest.fn().mockReturnValue(queryResult([])),
      findOneAndUpdate: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
    };
    const compatibilityService = {
      resolveForInteraction: jest.fn().mockResolvedValue({
        activityId: v2ActivityId,
        v2ActivityId,
        legacyActivityId,
        activity: { endDate: "2026-08-15T00:00:00.000Z" },
      }),
      viewerId: jest.fn().mockReturnValue(String(userId)),
    };
    const { service } = createService({
      calendarItemModel,
      compatibilityService,
    });

    await service.addActivityToCalendar(
      String(legacyActivityId),
      { _id: userId },
      {}
    );

    expect(calendarItemModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.any(Object),
      {
        $set: expect.objectContaining({
          activityId: v2ActivityId,
          v2ActivityId,
          date: new Date("2026-08-15T00:00:00.000Z"),
        }),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  });

  it("updates an authenticated report in place across old and v2 ids", async () => {
    const oldReportId = new Types.ObjectId();
    const reportModel = {
      find: jest
        .fn()
        .mockReturnValue(
          queryResult([{ _id: oldReportId, activityId: legacyActivityId }])
        ),
      deleteMany: jest.fn(),
      findOneAndUpdate: jest.fn().mockResolvedValue({ _id: oldReportId }),
      create: jest.fn(),
    };
    const { service } = createService({ reportModel });

    await service.reportActivity(
      String(legacyActivityId),
      { reason: "wrong_data", message: "Please review" },
      { _id: userId }
    );

    expect(reportModel.create).not.toHaveBeenCalled();
    expect(reportModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: oldReportId, userId },
      {
        $set: expect.objectContaining({
          activityId: v2ActivityId,
          v2ActivityId,
          activityEntity: "fomo_v2",
          reason: "wrong_data",
          message: "Please review",
        }),
      },
      { new: true }
    );
  });

  it("restores missing defaults and returns custom board columns with their tasks", async () => {
    const customId = new Types.ObjectId();
    const todoId = new Types.ObjectId();
    const progressId = new Types.ObjectId();
    const completedId = new Types.ObjectId();
    const existingColumns = [
      { _id: customId, title: "Review", order: 0 },
      { _id: todoId, title: "To Do", order: 1 },
    ];
    const allColumns = [
      ...existingColumns,
      { _id: progressId, title: "In Progress", order: 2 },
      { _id: completedId, title: "Completed", order: 3 },
    ];
    const boardColumnModel = {
      find: jest
        .fn()
        .mockReturnValueOnce(queryResult(existingColumns))
        .mockReturnValueOnce(queryResult(allColumns)),
      insertMany: jest.fn().mockResolvedValue([]),
    };
    const customTaskId = new Types.ObjectId();
    const boardTaskModel = {
      find: jest.fn().mockReturnValue(
        queryResult([
          {
            _id: customTaskId,
            userId,
            columnId: customId,
            title: "Manual review",
            projectName: "Manual review",
            status: "todo",
            order: 0,
          },
        ])
      ),
    };
    const boardModel = {
      find: jest.fn().mockReturnValue(queryResult([])),
    };
    const { service } = createService({
      boardColumnModel,
      boardTaskModel,
      boardModel,
    });

    const result = await service.getBoard({ _id: userId });

    expect(boardColumnModel.insertMany).toHaveBeenCalledWith([
      { userId, title: "In Progress", order: 2 },
      { userId, title: "Completed", order: 3 },
    ]);
    expect(result.columns.map((column) => column.id)).toEqual([
      String(customId),
      "todo",
      "in-progress",
      "completed",
    ]);
    expect(result.columns[0]).toEqual(
      expect.objectContaining({
        backendId: String(customId),
        label: "Review",
      })
    );
    expect(result.columns[0].tasks).toHaveLength(1);
    expect(result.columns[0].tasks[0].id).toBe(String(customTaskId));
  });

  it("bounds calendar queries to a valid one-year window", () => {
    const { service } = createService();

    expect(() =>
      (service as any).getCalendarRange({
        startDate: "2024-01-01",
        endDate: "2026-01-01",
      })
    ).toThrow(BadRequestException);
    expect(() =>
      (service as any).getCalendarRange({
        startDate: "2026-08-01",
        endDate: "2026-07-01",
      })
    ).toThrow("Calendar end date must be after start date");
  });

  it("does not reconstruct a gated v2 calendar source URL from social links", () => {
    const { service } = createService();
    const item = (service as any).mapActivityToCalendarItem(
      {
        _id: v2ActivityId,
        v2ActivityId: String(v2ActivityId),
        name: "Locked activity",
        socialLinks: { website: "https://example.test/private" },
      },
      new Date("2026-07-16T00:00:00.000Z")
    );

    expect(item.sourceUrl).toBeUndefined();
  });
});
