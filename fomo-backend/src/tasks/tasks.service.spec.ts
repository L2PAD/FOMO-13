import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TasksService } from './tasks.service';

describe('TasksService Earlyland global tasks', () => {
  const createService = (overrides: Record<string, any> = {}) => {
    const taskModel = overrides.taskModel || {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };
    const projectModel = overrides.projectModel || {
      collection: { name: 'projects' },
    };
    const userModel = overrides.userModel || {
      collection: { name: 'users' },
      findById: jest.fn(),
    };
    const commentModel = overrides.commentModel || {};
    const refModel = overrides.refModel || {};
    const taskUserStateModel = overrides.taskUserStateModel || {
      deleteMany: jest.fn(),
    };
    const activityModel = overrides.activityModel || {
      findById: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
    };
    const activityAccessPolicy = overrides.activityAccessPolicy || {
      resolve: jest.fn().mockResolvedValue({
        allowed: true,
        contentRedacted: false,
      }),
    };
    const emptyModel = {};
    const service = new TasksService(
      taskModel as any,
      projectModel as any,
      userModel as any,
      commentModel as any,
      refModel as any,
      taskUserStateModel as any,
      activityModel as any,
      activityAccessPolicy as any,
    );

    return {
      service,
      taskModel,
      projectModel,
      userModel,
      commentModel,
      refModel,
      taskUserStateModel,
      activityModel,
      activityAccessPolicy,
    };
  };

  it('requires every new default task to be linked to a v2 activity', async () => {
    const { service, taskModel } = createService();

    await expect(
      service.createTask({
        name: 'Shared task',
        type: 'default',
        accessTier: 'public',
      } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(taskModel.create).not.toHaveBeenCalled();
  });

  it('persists the activity relation and Prime tier as a global admin task', async () => {
    const activityId = new Types.ObjectId();
    const taskModel = { create: jest.fn().mockResolvedValue({}) };
    const activityModel = {
      findById: jest.fn().mockResolvedValue({ _id: activityId }),
    };
    const { service } = createService({ taskModel, activityModel });

    await service.createTask({
      name: 'Prime shared task',
      type: 'default',
      v2ActivityId: String(activityId),
      accessTier: 'prime',
    } as any);

    expect(taskModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        v2ActivityId: activityId,
        activityEntity: 'fomo_v2',
        accessTier: 'prime',
        scope: 'global',
        origin: 'admin',
      }),
    );
  });

  it('denies claiming a Prime task when Spaceport entitlement is absent', async () => {
    const taskId = new Types.ObjectId();
    const activityId = new Types.ObjectId();
    const user = {
      _id: new Types.ObjectId(),
      claimedTasks: [],
      toObject: () => ({ _id: 'user' }),
    };
    const taskModel = {
      findById: jest.fn().mockResolvedValue({
        _id: taskId,
        v2ActivityId: activityId,
        accessTier: 'prime',
        points: 10,
      }),
    };
    const activityModel = {
      findById: jest.fn().mockResolvedValue({
        _id: activityId,
        accessTier: 'public',
        publicationStatus: 'published',
        publishedSnapshot: { name: 'Prime activity' },
        publishedMetadata: { accessTier: 'public' },
      }),
    };
    const activityAccessPolicy = {
      resolve: jest.fn().mockResolvedValue({
        allowed: false,
        contentRedacted: true,
        reason: 'nft_required',
      }),
    };
    const { service } = createService({
      taskModel,
      activityModel,
      activityAccessPolicy,
      userModel: { findById: jest.fn().mockResolvedValue(user) },
    });

    await expect(
      service.claimTask(String(taskId), String(user._id)),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(activityAccessPolicy.resolve).toHaveBeenCalledWith(
      'prime',
      expect.objectContaining({ _id: 'user' }),
    );
  });

  it('fails closed when a shared task points to an unpublished activity', async () => {
    const taskId = new Types.ObjectId();
    const activityId = new Types.ObjectId();
    const user = {
      _id: new Types.ObjectId(),
      claimedTasks: [],
      toObject: () => ({ _id: 'user' }),
    };
    const activityAccessPolicy = { resolve: jest.fn() };
    const { service } = createService({
      taskModel: {
        findById: jest.fn().mockResolvedValue({
          _id: taskId,
          type: 'default',
          v2ActivityId: activityId,
          accessTier: 'public',
          points: 10,
        }),
      },
      activityModel: {
        findById: jest.fn().mockResolvedValue({
          _id: activityId,
          publicationStatus: 'draft',
        }),
      },
      activityAccessPolicy,
      userModel: {
        collection: { name: 'users' },
        findById: jest.fn().mockResolvedValue(user),
      },
    });

    await expect(
      service.claimTask(String(taskId), String(user._id)),
    ).rejects.toThrow('Linked Earlyland activity is not published');
    expect(activityAccessPolicy.resolve).not.toHaveBeenCalled();
  });

  it('hides unpublished and inaccessible Prime tasks from non-staff lists', async () => {
    const viewerId = new Types.ObjectId();
    const otherUserId = new Types.ObjectId();
    const publicActivityId = new Types.ObjectId();
    const primeActivityId = new Types.ObjectId();
    const draftActivityId = new Types.ObjectId();
    const rows = [
      {
        _id: new Types.ObjectId(),
        type: 'default',
        name: 'Public task',
        v2ActivityId: publicActivityId,
        awardedUsers: [viewerId, otherUserId],
        usersRequests: [otherUserId],
        awarded: [{ _id: viewerId, email: 'viewer@example.test' }],
        requeries: [{ _id: otherUserId, email: 'other@example.test' }],
      },
      {
        _id: new Types.ObjectId(),
        type: 'default',
        name: 'Locked Prime task',
        v2ActivityId: primeActivityId,
        accessTier: 'prime',
      },
      {
        _id: new Types.ObjectId(),
        type: 'default',
        name: 'Draft task',
        v2ActivityId: draftActivityId,
      },
    ];
    const taskModel = { aggregate: jest.fn().mockResolvedValue(rows) };
    const activityModel = {
      find: jest.fn().mockResolvedValue([
        {
          _id: publicActivityId,
          publicationStatus: 'published',
          publishedSnapshot: { name: 'Public' },
          publishedMetadata: { accessTier: 'public' },
        },
        {
          _id: primeActivityId,
          publicationStatus: 'published',
          publishedSnapshot: { name: 'Prime' },
          publishedMetadata: { accessTier: 'prime' },
        },
        {
          _id: draftActivityId,
          publicationStatus: 'draft',
        },
      ]),
    };
    const activityAccessPolicy = {
      resolve: jest.fn(async (tier: string) => ({
        allowed: tier === 'public',
        contentRedacted: tier !== 'public',
        ...(tier === 'prime' ? { reason: 'nft_required' } : {}),
      })),
    };
    const { service } = createService({
      taskModel,
      activityModel,
      activityAccessPolicy,
    });

    const result = await service.getTasks('default', {}, {
      _id: viewerId,
      role: 'user',
    });

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(
      expect.objectContaining({
        name: 'Public task',
        awardedUsers: [String(viewerId)],
        usersRequests: [],
        awarded: undefined,
        requeries: undefined,
      }),
    );
    const pipeline = taskModel.aggregate.mock.calls[0][0];
    for (const lookup of pipeline.filter((stage: any) => stage.$lookup)) {
      if (!['awarded', 'requeries'].includes(lookup.$lookup.as)) continue;
      expect(lookup.$lookup.pipeline[0].$project).toEqual({
        _id: 1,
        email: 1,
        name: 1,
        nickname: 1,
        avatar: 1,
      });
    }
  });
});
