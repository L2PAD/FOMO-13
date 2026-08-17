import { BadRequestException, ConflictException } from "@nestjs/common";
import { Types } from "mongoose";
import { FomoV2ActivityAdminService } from "./activity-admin.service";

const resultQuery = (value: any) => ({
  lean: jest.fn().mockReturnValue({
    exec: jest.fn().mockResolvedValue(value),
  }),
});

describe("FomoV2ActivityAdminService publication transitions", () => {
  const activityId = new Types.ObjectId();
  const activity = {
    _id: activityId,
    slug: "demo-airdrop",
    revision: 4,
    lifecycleStatus: "active",
    reviewStatus: "approved",
    publicationStatus: "draft",
    accessTier: "public",
    canonicalResolution: { status: "no_candidates", candidates: [] },
    currentDraft: {
      name: "Demo Airdrop",
      activityType: "airdrop",
      description: { aboutHtml: "<p>Reviewed</p>" },
    },
  };

  function createService(overrides: Record<string, any> = {}) {
    const currentActivity = { ...activity, ...overrides };
    const activityModel = {
      findOne: jest.fn().mockReturnValue(resultQuery(currentActivity)),
      findOneAndUpdate: jest.fn().mockImplementation((_filter, update) =>
        resultQuery({
          ...currentActivity,
          ...update.$set,
          revision: currentActivity.revision + 1,
        }),
      ),
    };
    const canonicalProjectModel = { exists: jest.fn() };
    return {
      service: new FomoV2ActivityAdminService(
        activityModel as any,
        canonicalProjectModel as any,
      ),
      activityModel,
    };
  }

  it("atomically copies currentDraft to publishedSnapshot under a revision predicate", async () => {
    const { service, activityModel } = createService();

    const result = await service.publish(
      String(activityId),
      { expectedRevision: 4, reason: "Ready" },
      { _id: "admin-1" },
    );

    expect(activityModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: activityId, revision: 4 },
      expect.objectContaining({
        $set: expect.objectContaining({
          publicationStatus: "published",
          publishedMetadata: {
            slug: "demo-airdrop",
            lifecycleStatus: "active",
            accessTier: "public",
          },
          publishedSnapshot: expect.objectContaining({
            name: "Demo Airdrop",
            activityType: "airdrop",
          }),
        }),
        $inc: { revision: 1 },
      }),
      { new: true, runValidators: true },
    );
    expect(result.publicationStatus).toBe("published");
    expect(result.revision).toBe(5);
  });

  it("rejects stale writes before changing publication state", async () => {
    const { service, activityModel } = createService();

    await expect(
      service.publish(String(activityId), { expectedRevision: 3 }, { _id: "admin-1" }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(activityModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("blocks approval while a canonical candidate is still disputed", async () => {
    const { service, activityModel } = createService({
      reviewStatus: "pending_human",
      canonicalResolution: { status: "conflict", candidates: [] },
    });

    await expect(
      service.approve(String(activityId), { expectedRevision: 4 }, { _id: "admin-1" }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(activityModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("does not freeze every source field when the admin submits an unchanged full draft", async () => {
    const { service, activityModel } = createService({
      reviewStatus: "pending_human",
      manualOverrideFields: ["review.title"],
    });

    await service.patch(
      String(activityId),
      { expectedRevision: 4, currentDraft: activity.currentDraft },
      { _id: "admin-1" },
    );

    const update = activityModel.findOneAndUpdate.mock.calls[0][1];
    expect(update.$set.manualOverrideFields).toEqual(["review.title"]);
    expect(update.$push.auditTrail.$each[0].changedFields).toEqual([]);
  });

  it("records only the changed leaf as a manual source override", async () => {
    const { service, activityModel } = createService({
      reviewStatus: "pending_human",
      manualOverrideFields: [],
    });

    await service.patch(
      String(activityId),
      {
        expectedRevision: 4,
        currentDraft: {
          ...activity.currentDraft,
          description: { aboutHtml: "<p>Edited by reviewer</p>" },
        },
      },
      { _id: "admin-1" },
    );

    const update = activityModel.findOneAndUpdate.mock.calls[0][1];
    expect(update.$set.manualOverrideFields).toEqual([
      "description.aboutHtml",
    ]);
    expect(update.$set.manualOverrideFields).not.toContain("name");
    expect(update.$push.auditTrail.$each[0].changedFields).toEqual([
      "currentDraft.description.aboutHtml",
    ]);
  });

  it("updates Earlyland banner placement without invalidating reviewed content", async () => {
    const { service, activityModel } = createService({
      isSponsored: false,
      sponsoredPriority: 0,
    });

    await service.patch(
      String(activityId),
      {
        expectedRevision: 4,
        isSponsored: true,
        sponsoredPriority: 25,
      },
      { _id: "admin-1" },
    );

    const update = activityModel.findOneAndUpdate.mock.calls[0][1];
    expect(update.$set).toMatchObject({
      isSponsored: true,
      sponsoredPriority: 25,
    });
    expect(update.$set.reviewStatus).toBeUndefined();
    expect(update.$push.auditTrail.$each[0].changedFields).toEqual([
      "isSponsored",
      "sponsoredPriority",
    ]);
  });

  it("requires audited actions for every publication state change", async () => {
    const { service, activityModel } = createService();

    await expect(
      service.patch(
        String(activityId),
        { expectedRevision: 4, publicationStatus: "draft" },
        { _id: "admin-1" },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(activityModel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("restores the reviewed published snapshot after hide even while a newer draft needs changes", async () => {
    const { service, activityModel } = createService({
      reviewStatus: "needs_changes",
      publicationStatus: "hidden",
      publicationStatusBeforeHide: "published",
      hiddenAt: new Date("2026-07-10T00:00:00.000Z"),
      publishedSnapshot: activity.currentDraft,
      publishedMetadata: {
        slug: activity.slug,
        lifecycleStatus: activity.lifecycleStatus,
        accessTier: activity.accessTier,
      },
    });

    await service.unhide(
      String(activityId),
      { expectedRevision: 4 },
      { _id: "admin-1" },
    );

    const update = activityModel.findOneAndUpdate.mock.calls[0][1];
    expect(update.$set.publicationStatus).toBe("published");
    expect(update.$unset.hiddenAt).toBe(1);
  });
});
