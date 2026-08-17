import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Types } from "mongoose";
import { FomoV2ActivityCompatibilityService } from "./fomo-v2-activity-compatibility.service";

const publishedRow = (overrides: Record<string, any> = {}) => {
  const publishedMetadata = {
    slug: "safe-activity",
    lifecycleStatus: "active",
    accessTier: "public",
    ...(overrides.publishedMetadata || {}),
  };

  return {
    _id: new Types.ObjectId(),
    slug: "draft-slug",
    lifecycleStatus: "upcoming",
    publicationStatus: "published",
    accessTier: "public",
    publishedSnapshot: {
      name: "Safe activity",
      joinLink: "https://example.test/join",
      taskGuide: { steps: [{ id: "one", title: "Private step" }] },
      description: { about: "Public teaser", howToParticipate: "Private" },
    },
    sources: [{ sourceUrl: "https://example.test/source" }],
    ...overrides,
    publishedMetadata,
  };
};

describe("FomoV2ActivityCompatibilityService", () => {
  const findOneResult = (row: any) => ({
    lean: () => ({ exec: async () => row }),
  });
  const findResult = (rows: any[]) => ({
    lean: () => ({ exec: async () => rows }),
  });

  it("does not fall through when a matching v2 activity is hidden", async () => {
    const row = publishedRow({
      publicationStatus: "hidden",
      hiddenAt: new Date(),
    });
    const model = { findOne: jest.fn(() => findOneResult(row)) } as any;
    const policy = { resolve: jest.fn() } as any;
    const service = new FomoV2ActivityCompatibilityService(model, policy);

    await expect(
      service.resolveForInteraction(String(row._id), {
        _id: new Types.ObjectId(),
      })
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(policy.resolve).not.toHaveBeenCalled();
  });

  it("enforces Prime entitlement before returning interaction content", async () => {
    const row = publishedRow({ publishedMetadata: { accessTier: "prime" } });
    const model = { findOne: jest.fn(() => findOneResult(row)) } as any;
    const policy = {
      resolve: jest.fn(async () => ({
        allowed: false,
        contentRedacted: true,
        reason: "nft_required",
      })),
    } as any;
    const service = new FomoV2ActivityCompatibilityService(model, policy);

    await expect(
      service.resolveForInteraction(String(row._id), {
        _id: new Types.ObjectId(),
        wallet: "0x0000000000000000000000000000000000000001",
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("redacts premium instructions in calendar hydration", async () => {
    const row = publishedRow({
      publishedMetadata: { accessTier: "prime" },
      publishedSnapshot: {
        name: "Safe activity",
        joinLink: "https://example.test/join",
        links: [{ label: "Private", url: "https://example.test/private" }],
        socialLinks: { website: "https://example.test/private" },
        requirements: ["Private requirement"],
        rewards: [{ label: "Private reward" }],
        investors: [{ name: "Private investor" }],
        taskGuide: { steps: [{ id: "one", title: "Private step" }] },
        description: {
          about: "Should also be private for a Prime activity",
          aboutHtml: '<a href="https://example.test/private">Private</a>',
          howToParticipate: "Private",
        },
      },
    });
    const model = {
      find: jest.fn(() => ({
        sort: () => ({ lean: () => ({ exec: async () => [row] }) }),
      })),
    } as any;
    const policy = {
      resolve: jest.fn(async () => ({
        allowed: false,
        contentRedacted: true,
        reason: "nft_required",
      })),
    } as any;
    const service = new FomoV2ActivityCompatibilityService(model, policy);

    const [activity] = await service.listCalendarActivities(
      new Date("2026-07-01T00:00:00.000Z"),
      new Date("2026-08-01T00:00:00.000Z"),
      { _id: new Types.ObjectId() }
    );

    expect(activity.description).toBeUndefined();
    expect(activity.joinLink).toBeUndefined();
    expect(activity.taskGuide).toBeUndefined();
    expect(activity.requirements).toBeUndefined();
    expect(activity.rewards).toBeUndefined();
    expect(activity.investors).toBeUndefined();
    expect(activity.socialLinks).toBeUndefined();
    expect(activity.sourceUrl).toBeUndefined();
    expect(activity.viewerAccess.reason).toBe("nft_required");
  });

  it("sanitizes historical HTML during compatibility hydration", async () => {
    const row = publishedRow({
      publishedSnapshot: {
        name: "Historical activity",
        description: {
          aboutHtml:
            '<div onmouseover="steal()">Safe <em>overview</em></div>' +
            '<iframe src="https://evil.test"></iframe>',
        },
        review: {
          textHtml: '<a href="javascript:alert(1)">Review</a>',
        },
      },
    });
    const model = {
      find: jest.fn(() => ({
        sort: () => ({ lean: () => ({ exec: async () => [row] }) }),
      })),
    } as any;
    const policy = {
      resolve: jest.fn(async () => ({ allowed: true, contentRedacted: false })),
    } as any;
    const service = new FomoV2ActivityCompatibilityService(model, policy);

    const [activity] = await service.listCalendarActivities(
      new Date("2026-07-01T00:00:00.000Z"),
      new Date("2026-08-01T00:00:00.000Z"),
      { _id: new Types.ObjectId() },
    );

    expect(activity.description.aboutHtml).toContain("<em>overview</em>");
    expect(activity.description.aboutHtml).not.toMatch(/onmouseover|iframe/i);
    expect(activity.review.textHtml).toBe("<a>Review</a>");
  });

  it("uses immutable published metadata instead of draft top-level fields", async () => {
    const publishedCanonicalId = new Types.ObjectId();
    const row = publishedRow({
      slug: "changed-draft-slug",
      lifecycleStatus: "cancelled",
      accessTier: "public",
      canonicalProjectId: new Types.ObjectId(),
      publishedMetadata: {
        slug: "published-slug",
        lifecycleStatus: "ended",
        accessTier: "prime",
        canonicalProjectId: publishedCanonicalId,
      },
    });
    const model = { findOne: jest.fn(() => findOneResult(row)) } as any;
    const policy = {
      resolve: jest.fn(async () => ({ allowed: true, contentRedacted: false })),
    } as any;
    const service = new FomoV2ActivityCompatibilityService(model, policy);

    const result = await service.resolveForInteraction("published-slug", {
      _id: new Types.ObjectId(),
    });

    expect(policy.resolve).toHaveBeenCalledWith("prime", expect.any(Object));
    expect(result?.activity).toEqual(
      expect.objectContaining({
        slug: "published-slug",
        lifecycleStatus: "ended",
        accessTier: "prime",
        canonicalProjectId: String(publishedCanonicalId),
      })
    );
    expect(model.findOne.mock.calls[0][0].$or[0]).toEqual({
      "publishedMetadata.slug": "published-slug",
    });
  });

  it("redacts nested locked review and task guide on a public activity", async () => {
    const row = publishedRow({
      publishedSnapshot: {
        name: "Safe activity",
        joinLink: "https://example.test/join",
        links: [{ label: "Join", url: "https://example.test/join" }],
        videoGuides: ["https://example.test/video"],
        description: {
          about: "Public overview",
          aboutHtml: "<p>Public overview</p>",
          howToParticipate: "Private steps",
          howToParticipateHtml: "<p>Private steps</p>",
        },
        review: {
          isLocked: true,
          text: "Private FOMO review",
          html: "<p>Private FOMO review</p>",
        },
        taskGuide: {
          isLocked: true,
          steps: [{ id: "one", title: "Private step" }],
        },
      },
    });
    const model = {
      find: jest.fn(() => ({
        sort: () => ({ lean: () => ({ exec: async () => [row] }) }),
      })),
    } as any;
    const policy = {
      resolve: jest.fn(async (tier: string) =>
        tier === "public"
          ? { allowed: true, contentRedacted: false }
          : {
              allowed: false,
              contentRedacted: true,
              reason: "nft_required",
            }
      ),
    } as any;
    const service = new FomoV2ActivityCompatibilityService(model, policy);

    const [activity] = await service.listCalendarActivities(
      new Date("2026-07-01T00:00:00.000Z"),
      new Date("2026-08-01T00:00:00.000Z"),
      { _id: new Types.ObjectId() }
    );

    expect(activity.review).toEqual({ isLocked: true });
    expect(activity.taskGuide).toEqual({ isLocked: true });
    expect(activity.description).toEqual({
      about: "Public overview",
      aboutHtml: "<p>Public overview</p>",
    });
    expect(activity.joinLink).toBeUndefined();
    expect(activity.links).toBeUndefined();
    expect(activity.videoGuides).toBeUndefined();
    expect(activity.sourceUrl).toBeUndefined();
    expect(activity.contentAccess.review.reason).toBe("nft_required");
    expect(activity.contentAccess.taskGuide.reason).toBe("nft_required");
    expect(model.find.mock.calls[0][0].$and).toContainEqual({
      publishedMetadata: { $exists: true, $ne: null },
    });
  });

  it("hydrates old calendar and board relations through the legacy activity id", async () => {
    const legacyActivityId = new Types.ObjectId();
    const row = publishedRow({ legacyActivityId });
    const model = { find: jest.fn(() => findResult([row])) } as any;
    const policy = {
      resolve: jest.fn(async () => ({
        allowed: true,
        contentRedacted: false,
      })),
    } as any;
    const service = new FomoV2ActivityCompatibilityService(model, policy);

    const result = await service.resolveObjectIds(
      [legacyActivityId.toHexString()],
      { _id: new Types.ObjectId() }
    );
    const calendarRelation = { activityId: legacyActivityId };
    const boardRelation = { v2ActivityId: row._id };
    const calendarActivity = result.activities.get(
      service.relationId(calendarRelation)
    );
    const boardActivity = result.activities.get(
      service.relationId(boardRelation)
    );

    expect(calendarActivity).toBeDefined();
    expect(boardActivity).toBe(calendarActivity);
    expect(calendarActivity?.id).toBe(String(row._id));
    expect(result.knownV2Ids).toEqual(
      new Set([String(row._id), String(legacyActivityId)])
    );
    expect(result.blockedIds).toEqual(new Set());

    const identityFilter = model.find.mock.calls[0][0];
    expect(identityFilter.$or[0]._id.$in.map(String)).toEqual([
      String(legacyActivityId),
    ]);
    expect(identityFilter.$or[1].legacyActivityId.$in).toEqual([
      String(legacyActivityId),
    ]);
  });

  it("does not hydrate draft or hidden v2 rows through legacy relations", async () => {
    const hiddenLegacyId = new Types.ObjectId();
    const draftLegacyId = new Types.ObjectId();
    const hiddenRow = publishedRow({
      legacyActivityId: hiddenLegacyId.toHexString(),
      hiddenAt: new Date(),
    });
    const draftRow = publishedRow({
      legacyActivityId: draftLegacyId,
      publicationStatus: "draft",
    });
    const model = {
      find: jest.fn(() => findResult([hiddenRow, draftRow])),
    } as any;
    const policy = { resolve: jest.fn() } as any;
    const service = new FomoV2ActivityCompatibilityService(model, policy);

    const result = await service.resolveObjectIds(
      [hiddenLegacyId, draftLegacyId.toHexString()],
      { _id: new Types.ObjectId() },
      { includeRedacted: true }
    );

    expect(result.activities).toEqual(new Map());
    expect(result.knownV2Ids).toEqual(
      new Set([
        String(hiddenRow._id),
        String(hiddenLegacyId),
        String(draftRow._id),
        String(draftLegacyId),
      ])
    );
    expect(result.blockedIds).toEqual(result.knownV2Ids);
    expect(policy.resolve).not.toHaveBeenCalled();
  });

  it("calculates Others from everything after the first five activity types", async () => {
    const model = {
      countDocuments: jest.fn().mockResolvedValue(20),
      aggregate: jest
        .fn()
        .mockResolvedValueOnce([
          { _id: "Other", count: 8 },
          { _id: "Airdrop", count: 5 },
          { _id: "Quest", count: 3 },
          { _id: "Testnet", count: 2 },
          { _id: "Node", count: 1 },
          { _id: "Whitelist", count: 1 },
        ])
        .mockResolvedValueOnce([]),
    } as any;
    const service = new FomoV2ActivityCompatibilityService(model, {} as any);

    const result = await service.getPublicFilters(9);

    expect(result.otherActivityCount).toBe(1);
    expect(model.aggregate.mock.calls[0][0][0].$match.$and).toContainEqual({
      publishedMetadata: { $exists: true, $ne: null },
    });
  });
});
