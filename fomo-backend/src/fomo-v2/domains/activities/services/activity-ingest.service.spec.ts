import { Types } from "mongoose";
import { FomoV2ActivitySchema } from "../models";
import { FomoV2ActivityIngestService } from "./activity-ingest.service";

const resultQuery = (value: any) => ({
  lean: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(value) }),
});

const listQuery = (value: any) => ({
  limit: jest.fn().mockReturnValue(resultQuery(value)),
});

describe("FomoV2ActivityIngestService", () => {
  it("keeps parserActivityId as a non-unique compatibility lookup", () => {
    const indexes = FomoV2ActivitySchema.indexes() as any[];
    const parserIndex = indexes.find(
      ([, options]) => options?.name === "idx_activities_parser_id"
    );

    expect(parserIndex?.[0]).toEqual({ parserActivityId: 1 });
    expect(parserIndex?.[1]?.unique).not.toBe(true);
    expect(
      indexes.some(
        ([, options]) => options?.name === "uniq_activities_parser_id"
      )
    ).toBe(false);
  });

  it("creates separate aggregates for identical parser ids and semantics from different providers", async () => {
    const activities: any[] = [];
    const activityModel = {
      findOne: jest.fn().mockImplementation(() => resultQuery(null)),
      find: jest
        .fn()
        .mockImplementation(({ slug }) =>
          listQuery(activities.filter((activity) => activity.slug === slug))
        ),
      create: jest.fn().mockImplementation(async (value) => {
        const created = { _id: new Types.ObjectId(), ...value };
        activities.push(created);
        return created;
      }),
    };
    const sourceSnapshotModel = {
      findOneAndUpdate: jest
        .fn()
        .mockImplementation(() => resultQuery({ _id: new Types.ObjectId() })),
    };
    const importCandidateService = {
      createOrUpdateCandidate: jest.fn().mockImplementation(async () => ({
        candidate: { _id: new Types.ObjectId() },
      })),
    };
    const reviewService = {
      createOrUpdateBatch: jest.fn().mockImplementation(async () => ({
        batch: { _id: new Types.ObjectId() },
      })),
    };
    const service = new FomoV2ActivityIngestService(
      activityModel as any,
      sourceSnapshotModel as any,
      importCandidateService as any,
      reviewService as any
    );
    const base = {
      parserActivityId: "42",
      sourceId: "42",
      sourceSlug: "same-campaign",
      slug: "same-campaign",
      rawPayload: { id: "42" },
      normalizedDraft: {
        name: "Same Campaign",
        projectName: "Same Campaign",
        activityType: "Quest",
        startDate: new Date("2026-09-01T00:00:00.000Z"),
      },
      canonicalCandidates: [],
      canonicalStatus: "no_candidates" as const,
    };

    await service.stage({ ...base, source: "dropstab" });
    await service.stage({ ...base, source: "icodrops" });

    expect(activities).toHaveLength(2);
    expect(activities.map((activity) => activity.sourceKeys)).toEqual([
      ["dropstab:42"],
      ["icodrops:42"],
    ]);
    expect(activities[0].slug).toBe("same-campaign");
    expect(activities[1].slug).toMatch(/^same-campaign-[a-f0-9]{8}$/);
    expect(activities.map((activity) => activity.parserActivityId)).toEqual([
      "42",
      "42",
    ]);
    const secondStrongFilter = activityModel.findOne.mock.calls
      .map(([filter]) => filter)
      .find((filter) =>
        (filter.$or || []).some(
          (clause: any) =>
            clause.parserActivityId === "42" &&
            clause.sources?.$elemMatch?.source === "icodrops"
        )
      );
    expect(secondStrongFilter.$or).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          parserActivityId: "42",
          sources: { $elemMatch: { source: "icodrops" } },
        }),
      ])
    );
  });

  it("rejects an exact source key on a legacy mixed-provider aggregate", async () => {
    const activityId = new Types.ObjectId();
    const activityModel = {
      findOne: jest.fn().mockReturnValue(
        resultQuery({
          _id: activityId,
          sourceKeys: ["dropstab:42", "icodrops:42"],
          sources: [{ source: "dropstab" }, { source: "icodrops" }],
        })
      ),
    };
    const service = new FomoV2ActivityIngestService(
      activityModel as any,
      {} as any,
      {} as any,
      {} as any
    );

    let conflict: any;
    try {
      await (service as any).findExisting({
        source: "dropstab",
        sourceId: "42",
        parserActivityId: "42",
        slug: "same-campaign",
      });
    } catch (error) {
      conflict = error;
    }

    expect(conflict?.getResponse()).toEqual(
      expect.objectContaining({
        code: "ACTIVITY_MIXED_PROVIDER_AGGREGATE",
        reviewRequired: true,
        metadata: expect.objectContaining({
          action: "controlled_split_backfill",
          activityId: activityId.toHexString(),
          incomingSource: "dropstab",
        }),
      })
    );
  });

  it("only accepts a slug fallback when project, type, and campaign date agree", () => {
    const service = new FomoV2ActivityIngestService(
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );
    const candidate = {
      currentDraft: {
        projectName: "Demo Project",
        activityType: "airdrop",
        startDate: new Date("2026-08-01T00:00:00.000Z"),
      },
    };

    expect(
      (service as any).isControlledSlugMatch(candidate, {
        normalizedDraft: {
          projectName: "Demo Project",
          activityType: "airdrop",
          startDate: new Date("2026-08-01T12:00:00.000Z"),
        },
      })
    ).toBe(true);
    expect(
      (service as any).isControlledSlugMatch(candidate, {
        normalizedDraft: {
          projectName: "Demo Project",
          activityType: "airdrop",
          startDate: new Date("2026-09-01T00:00:00.000Z"),
        },
      })
    ).toBe(false);
  });

  it("recognizes a repeated, already-linked source snapshot as a no-op", () => {
    const service = new FomoV2ActivityIngestService(
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );
    const snapshotId = new Types.ObjectId();
    const activity = {
      sourceSnapshotIds: [snapshotId],
      sources: [
        {
          source: "dropstab",
          sourceId: "source-1",
          sourceSlug: "same-airdrop",
          sourceUrl: "https://example.com/activity",
        },
      ],
      lifecycleStatus: "active",
      currentDraft: { name: "Same", activityType: "airdrop" },
      manualOverrideFields: [],
      canonicalResolution: {
        status: "no_candidates",
        reason:
          "No canonical project candidate found. Activity may be standalone.",
        candidates: [],
      },
    };
    const input = {
      source: "dropstab",
      sourceId: "source-1",
      sourceSlug: "same-airdrop",
      sourceUrl: "https://example.com/activity",
      slug: "same-airdrop",
      lifecycleStatus: "active",
      normalizedDraft: { name: "Same", activityType: "airdrop" },
      canonicalStatus: "no_candidates",
      canonicalCandidates: [],
    };

    expect(
      (service as any).isIdempotentNoop(activity, input, { _id: snapshotId })
    ).toBe(true);
  });

  it("never changes publication or hidden state when applying a new source snapshot", async () => {
    const activityModel = {
      findOneAndUpdate: jest
        .fn()
        .mockReturnValue(resultQuery({ _id: "activity-1" })),
    };
    const service = new FomoV2ActivityIngestService(
      activityModel as any,
      {} as any,
      {} as any,
      {} as any
    );
    const activity = {
      _id: new Types.ObjectId(),
      revision: 7,
      slug: "hidden-airdrop",
      lifecycleStatus: "active",
      reviewStatus: "approved",
      publicationStatus: "hidden",
      hiddenAt: new Date(),
      currentDraft: { name: "Old", activityType: "airdrop" },
      sourceKeys: [],
      sources: [],
      manualOverrideFields: [],
      canonicalResolution: { status: "verified" },
    };

    await (service as any).updateExisting(
      activity,
      {
        source: "dropstab",
        sourceId: "source-1",
        slug: "hidden-airdrop",
        normalizedDraft: { name: "New", activityType: "airdrop" },
        lifecycleStatus: "active",
        canonicalCandidates: [],
        canonicalStatus: "no_candidates",
      },
      { _id: new Types.ObjectId() },
      { _id: new Types.ObjectId() },
      { _id: new Types.ObjectId() }
    );

    const update = activityModel.findOneAndUpdate.mock.calls[0][1];
    expect(update.$set.publicationStatus).toBeUndefined();
    expect(update.$set.hiddenAt).toBeUndefined();
    expect(update.$unset).toBeUndefined();
    expect(update.$set.reviewStatus).toBe("needs_changes");
  });

  it("gives a brand-new sparse aggregate a publishable activity type default", async () => {
    const activityModel = { create: jest.fn(async (value) => value) };
    const service = new FomoV2ActivityIngestService(
      activityModel as any,
      {} as any,
      {} as any,
      {} as any
    );

    await (service as any).createActivity(
      {
        source: "parser",
        sourceId: "sparse-1",
        slug: "sparse-project",
        normalizedDraft: {
          name: "Sparse Project",
          projectName: "Sparse Project",
        },
        canonicalStatus: "no_candidates",
        canonicalCandidates: [],
      },
      { _id: new Types.ObjectId() },
      { _id: new Types.ObjectId() },
      { _id: new Types.ObjectId() }
    );

    expect(activityModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        currentDraft: expect.objectContaining({
          name: "Sparse Project",
          activityType: "Other",
        }),
      })
    );
  });

  it("keeps only the latest 100 unique source snapshots", async () => {
    const activityModel = {
      findOneAndUpdate: jest
        .fn()
        .mockReturnValue(resultQuery({ _id: "activity-1" })),
    };
    const service = new FomoV2ActivityIngestService(
      activityModel as any,
      {} as any,
      {} as any,
      {} as any
    );
    const sourceSnapshotIds = Array.from(
      { length: 105 },
      () => new Types.ObjectId()
    );
    const latest = new Types.ObjectId();

    await (service as any).updateExisting(
      {
        _id: new Types.ObjectId(),
        revision: 3,
        lifecycleStatus: "active",
        reviewStatus: "pending_ai",
        currentDraft: { name: "Bounded", activityType: "Quest" },
        sourceKeys: [],
        sources: [],
        sourceSnapshotIds: [...sourceSnapshotIds, sourceSnapshotIds[104]],
        manualOverrideFields: [],
        canonicalResolution: { status: "verified" },
      },
      {
        source: "parser",
        sourceId: "bounded-1",
        slug: "bounded",
        normalizedDraft: { name: "Bounded" },
        lifecycleStatus: "active",
        canonicalCandidates: [],
        canonicalStatus: "no_candidates",
      },
      { _id: latest },
      { _id: new Types.ObjectId() },
      { _id: new Types.ObjectId() }
    );

    const update = activityModel.findOneAndUpdate.mock.calls[0][1];
    const stored = update.$set.sourceSnapshotIds;
    expect(stored).toHaveLength(100);
    expect(new Set(stored.map(String)).size).toBe(100);
    expect(String(stored[99])).toBe(latest.toHexString());
    expect(update.$addToSet).toBeUndefined();
  });

  it.each(["ended", "cancelled"])(
    "never reopens a terminal %s activity from source ingest",
    async (lifecycleStatus) => {
      const activityModel = {
        findOneAndUpdate: jest
          .fn()
          .mockReturnValue(resultQuery({ _id: "activity-1" })),
      };
      const service = new FomoV2ActivityIngestService(
        activityModel as any,
        {} as any,
        {} as any,
        {} as any
      );

      await (service as any).updateExisting(
        {
          _id: new Types.ObjectId(),
          revision: 2,
          lifecycleStatus,
          reviewStatus: "pending_ai",
          currentDraft: { name: "Terminal", activityType: "Quest" },
          sourceKeys: [],
          sources: [],
          sourceSnapshotIds: [],
          manualOverrideFields: [],
          canonicalResolution: { status: "verified" },
        },
        {
          source: "parser",
          sourceId: "terminal-1",
          slug: "terminal",
          normalizedDraft: { name: "Terminal" },
          lifecycleStatus: "upcoming",
          canonicalCandidates: [],
          canonicalStatus: "no_candidates",
        },
        { _id: new Types.ObjectId() },
        { _id: new Types.ObjectId() },
        { _id: new Types.ObjectId() }
      );

      expect(
        activityModel.findOneAndUpdate.mock.calls[0][1].$set.lifecycleStatus
      ).toBe(lifecycleStatus);
    }
  );

  it("preserves an explicit reviewer no-match canonical decision", async () => {
    const activityModel = {
      findOneAndUpdate: jest
        .fn()
        .mockReturnValue(resultQuery({ _id: "activity-1" })),
    };
    const service = new FomoV2ActivityIngestService(
      activityModel as any,
      {} as any,
      {} as any,
      {} as any
    );

    await (service as any).updateExisting(
      {
        _id: new Types.ObjectId(),
        revision: 5,
        lifecycleStatus: "active",
        reviewStatus: "pending_human",
        currentDraft: { name: "Standalone", activityType: "Quest" },
        sourceKeys: [],
        sources: [],
        sourceSnapshotIds: [],
        manualOverrideFields: [],
        canonicalResolution: {
          status: "no_candidates",
          resolvedAt: new Date("2026-07-01T00:00:00.000Z"),
          resolvedBy: "admin-reviewer",
          reason: "Confirmed standalone",
          candidates: [],
        },
      },
      {
        source: "parser",
        sourceId: "standalone-1",
        slug: "standalone",
        normalizedDraft: { name: "Standalone" },
        lifecycleStatus: "active",
        canonicalCandidates: [
          { canonicalProjectId: new Types.ObjectId(), confidence: "low" },
        ],
        canonicalStatus: "proposed",
      },
      { _id: new Types.ObjectId() },
      { _id: new Types.ObjectId() },
      { _id: new Types.ObjectId() }
    );

    const set = activityModel.findOneAndUpdate.mock.calls[0][1].$set;
    expect(set.canonicalResolution).toBeUndefined();
    expect(set.canonicalProjectId).toBeUndefined();
  });
});
