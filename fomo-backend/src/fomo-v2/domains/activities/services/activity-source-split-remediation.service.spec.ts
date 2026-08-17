import { Types } from "mongoose";
import {
  buildActivitySourceSplitPlan,
  FomoV2ActivitySourceSplitRemediationService,
} from "./activity-source-split-remediation.service";

describe("activity source split remediation planner", () => {
  it("canonicalizes providers and builds deterministic provider-only rows", () => {
    const fixture = mixedFixture();
    const plan = buildActivitySourceSplitPlan(
      fixture.activity,
      fixture.snapshots
    );

    expect(plan).toMatchObject({
      activityId: String(fixture.activity._id),
      providers: ["dropstab", "icodrops"],
      keeperProvider: "dropstab",
      errors: [],
    });
    expect(plan?.clones).toEqual([
      {
        provider: "icodrops",
        slug: expect.stringMatching(/^mixed-airdrop-icodrops-[a-f0-9]{10}$/),
      },
    ]);
    expect(plan?.partitions).toEqual([
      expect.objectContaining({
        provider: "dropstab",
        parserActivityId: "drop-1",
        sourceKeys: ["dropstab:drop-1"],
        sourceSnapshotIds: [fixture.activity.sourceSnapshotIds[0]],
        sources: [expect.objectContaining({ source: "dropstab" })],
        currentDraft: { name: "Dropstab draft", activityType: "Airdrop" },
      }),
      expect.objectContaining({
        provider: "icodrops",
        parserActivityId: "ico-1",
        sourceKeys: ["icodrops:ico-1"],
        sourceSnapshotIds: [fixture.activity.sourceSnapshotIds[1]],
        sources: [expect.objectContaining({ source: "icodrops" })],
        currentDraft: { name: "ICODrops draft", activityType: "Quest" },
      }),
    ]);

    const rerunPlan = buildActivitySourceSplitPlan(
      {
        ...fixture.activity,
        sources: plan?.partitions[0].sources,
        sourceKeys: plan?.partitions[0].sourceKeys,
        sourceSnapshotIds: plan?.partitions[0].sourceSnapshotIds,
      },
      [fixture.snapshots[0]]
    );
    expect(rerunPlan).toBeNull();
  });

  it("fails closed when a provider snapshot is missing or mismatched", () => {
    const fixture = mixedFixture();
    const missing = buildActivitySourceSplitPlan(fixture.activity, [
      fixture.snapshots[0],
    ]);
    expect(missing?.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Source snapshot"),
        "Provider icodrops has no linked source snapshot.",
        "Provider icodrops snapshots have no stable identity.",
      ])
    );

    const mismatch = buildActivitySourceSplitPlan(fixture.activity, [
      fixture.snapshots[0],
      { ...fixture.snapshots[1], sourceId: "other-id" },
    ]);
    expect(mismatch?.errors).toContain(
      "Provider icodrops activity identity does not match its snapshots."
    );
  });

  it("fails closed for mixed legacy/provider aggregates", () => {
    const fixture = mixedFixture();
    const legacySnapshot = {
      ...fixture.snapshots[1],
      source: "legacy",
      sourceId: "legacy-1",
      sourceSlug: "legacy-airdrop",
    };
    const activity = {
      ...fixture.activity,
      sources: [
        fixture.activity.sources[0],
        {
          ...fixture.activity.sources[1],
          source: "legacy",
          sourceId: "legacy-1",
          sourceSlug: "legacy-airdrop",
        },
      ],
      sourceKeys: ["dropstab:drop-1", "legacy:legacy-1"],
    };

    const plan = buildActivitySourceSplitPlan(activity, [
      fixture.snapshots[0],
      legacySnapshot,
    ]);

    expect(plan?.errors).toContain(
      "Controlled activity split supports only dropstab/icodrops; unsupported providers: legacy."
    );
  });

  it("chooses the keeper from latest traceable provenance, not alphabetically", () => {
    const fixture = mixedFixture();
    fixture.snapshots[1] = {
      ...fixture.snapshots[1],
      capturedAt: new Date("2026-08-02T00:00:00.000Z"),
    };

    const plan = buildActivitySourceSplitPlan(
      fixture.activity,
      fixture.snapshots
    );

    expect(plan?.keeperProvider).toBe("icodrops");
    expect(plan?.clones.map((clone) => clone.provider)).toEqual(["dropstab"]);
    expect(
      plan?.partitions.find((partition) => partition.provider === "icodrops")
        ?.latestSnapshotId
    ).toBe(String(fixture.snapshots[1]._id));
  });
});

describe("FomoV2ActivitySourceSplitRemediationService", () => {
  it("rejects an invalid resume cursor before querying data", async () => {
    const fixture = mixedFixture();
    const mocks = serviceMocks(fixture);
    const service = new FomoV2ActivitySourceSplitRemediationService(
      mocks.connection as any,
      mocks.activityModel as any,
      mocks.snapshotModel as any
    );

    await expect(service.run({ cursor: "bad", limit: 1 })).rejects.toThrow(
      "cursor must be a MongoDB ObjectId"
    );
    expect(mocks.activityModel.find).not.toHaveBeenCalled();
  });

  it("is dry-run by default and does not open a transaction", async () => {
    const fixture = mixedFixture();
    const mocks = serviceMocks(fixture);
    const service = new FomoV2ActivitySourceSplitRemediationService(
      mocks.connection as any,
      mocks.activityModel as any,
      mocks.snapshotModel as any
    );

    const result = await service.run({ limit: 5 });

    expect(result).toMatchObject({
      mode: "dry-run",
      scope: "bounded",
      limit: 5,
      scanned: 1,
      mixed: 1,
      planned: 1,
      applied: 0,
      failed: 0,
      sourceSnapshotsDeleted: 0,
      clonesPublished: 0,
    });
    expect(mocks.connection.startSession).not.toHaveBeenCalled();
    expect(mocks.activityModel.updateOne).not.toHaveBeenCalled();
    expect(mocks.activityModel.create).not.toHaveBeenCalled();
  });

  it("refuses write while the obsolete global parser id index exists", async () => {
    const fixture = mixedFixture();
    const mocks = serviceMocks(fixture);
    mocks.listIndexes.mockReturnValue({
      toArray: jest
        .fn()
        .mockResolvedValue([
          { name: "_id_" },
          { name: "uniq_activities_parser_id" },
        ]),
    });
    const service = new FomoV2ActivitySourceSplitRemediationService(
      mocks.connection as any,
      mocks.activityModel as any,
      mocks.snapshotModel as any
    );

    await expect(
      service.run({ write: true, confirmWrite: true, limit: 1 })
    ).rejects.toThrow("uniq_activities_parser_id");
    expect(mocks.activityModel.find).not.toHaveBeenCalled();
    expect(mocks.connection.startSession).not.toHaveBeenCalled();
  });

  it("refuses write on a non-transactional topology", async () => {
    const fixture = mixedFixture();
    const mocks = serviceMocks(fixture);
    mocks.hello.mockResolvedValue({ ok: 1 });
    const service = new FomoV2ActivitySourceSplitRemediationService(
      mocks.connection as any,
      mocks.activityModel as any,
      mocks.snapshotModel as any
    );

    await expect(
      service.run({ write: true, confirmWrite: true, limit: 1 })
    ).rejects.toThrow("not a replica set or mongos");
    expect(mocks.activityModel.find).not.toHaveBeenCalled();
    expect(mocks.connection.startSession).not.toHaveBeenCalled();
  });

  it("reports a missing transaction session without writing", async () => {
    const fixture = mixedFixture();
    const mocks = serviceMocks(fixture);
    delete (mocks.session as any).withTransaction;
    const service = new FomoV2ActivitySourceSplitRemediationService(
      mocks.connection as any,
      mocks.activityModel as any,
      mocks.snapshotModel as any
    );

    const result = await service.run({
      write: true,
      confirmWrite: true,
      limit: 1,
    });

    expect(result.failed).toBe(1);
    expect(result.errors[0].errors[0]).toContain(
      "transaction session is unavailable"
    );
    expect(mocks.session.endSession).toHaveBeenCalledTimes(1);
    expect(mocks.activityModel.updateOne).not.toHaveBeenCalled();
    expect(mocks.activityModel.create).not.toHaveBeenCalled();
  });

  it("splits keeper and draft clone within one transaction", async () => {
    const fixture = mixedFixture();
    const mocks = serviceMocks(fixture);
    const service = new FomoV2ActivitySourceSplitRemediationService(
      mocks.connection as any,
      mocks.activityModel as any,
      mocks.snapshotModel as any
    );

    const result = await service.run({
      write: true,
      confirmWrite: true,
      limit: 1,
    });

    expect(result).toMatchObject({
      mode: "write",
      applied: 1,
      failed: 0,
      preflight: {
        topology: "replica-set",
        obsoleteGlobalParserIndexPresent: false,
      },
    });
    expect(mocks.session.withTransaction).toHaveBeenCalledTimes(1);
    expect(mocks.session.endSession).toHaveBeenCalledTimes(1);
    expect(mocks.activityModel.updateOne).toHaveBeenCalledWith(
      { _id: fixture.activity._id, revision: 7 },
      expect.objectContaining({
        $set: expect.objectContaining({
          parserActivityId: "drop-1",
          sourceKeys: ["dropstab:drop-1"],
          sources: [expect.objectContaining({ source: "dropstab" })],
          sourceSnapshotIds: [fixture.activity.sourceSnapshotIds[0]],
          currentDraft: {
            name: "Dropstab draft",
            activityType: "Airdrop",
          },
          publicationStatus: "draft",
          reviewStatus: "pending_human",
          manualOverrideFields: [],
          aiProposals: [],
        }),
        $unset: expect.objectContaining({
          publishedSnapshot: 1,
          publishedMetadata: 1,
          publishedAt: 1,
          reviewedAt: 1,
          importCandidateId: 1,
        }),
        $inc: { revision: 1 },
      }),
      expect.objectContaining({ session: mocks.session, runValidators: true })
    );

    const clones = mocks.activityModel.create.mock.calls[0][0];
    expect(clones).toHaveLength(1);
    expect(clones[0]).toMatchObject({
      parserActivityId: "ico-1",
      sourceKeys: ["icodrops:ico-1"],
      sources: [expect.objectContaining({ source: "icodrops" })],
      sourceSnapshotIds: [fixture.activity.sourceSnapshotIds[1]],
      publicationStatus: "draft",
      reviewStatus: "pending_human",
      isSponsored: false,
      currentDraft: { name: "ICODrops draft", activityType: "Quest" },
      manualOverrideFields: [],
      revision: 1,
    });
    expect(clones[0]).not.toHaveProperty("publishedSnapshot");
    expect(clones[0]).not.toHaveProperty("publishedMetadata");
    expect(clones[0]).not.toHaveProperty("legacyActivityId");
    expect(clones[0].auditTrail[0].note).toContain("provider icodrops");
    const collisionFilter = (
      mocks.activityModel.findOne.mock.calls as any
    )[0][0];
    expect(collisionFilter._id.$ne).toBe(fixture.activity._id);
  });

  it("paginates past same-provider rows before applying the mixed-row limit", async () => {
    const fixture = mixedFixture();
    const mocks = serviceMocks(fixture);
    const sameProviderRows = Array.from({ length: 100 }, (_value, index) => ({
      ...fixture.activity,
      _id: new Types.ObjectId(
        `64${index.toString(16).padStart(22, "0")}`.slice(0, 24)
      ),
      parserActivityId: "drop-1",
      sourceKeys: ["dropstab:drop-1"],
      sources: [fixture.activity.sources[0]],
      sourceSnapshotIds: [fixture.activity.sourceSnapshotIds[0]],
    }));
    mocks.activityModel.find
      .mockReturnValueOnce(boundedQuery(sameProviderRows))
      .mockReturnValueOnce(boundedQuery([fixture.activity]));
    const service = new FomoV2ActivitySourceSplitRemediationService(
      mocks.connection as any,
      mocks.activityModel as any,
      mocks.snapshotModel as any
    );

    const result = await service.run({ limit: 1 });

    expect(result).toMatchObject({
      scanned: 101,
      mixed: 1,
      planned: 1,
      hasMore: true,
      nextCursor: String(fixture.activity._id),
    });
    expect(mocks.activityModel.find).toHaveBeenCalledTimes(2);
    expect((mocks.activityModel.find.mock.calls as any)[1][0]._id.$gt).toBe(
      sameProviderRows[99]._id
    );
  });

  it("reports identity errors without starting a partial write", async () => {
    const fixture = mixedFixture();
    fixture.snapshots[1] = {
      ...fixture.snapshots[1],
      sourceId: "different",
    };
    const mocks = serviceMocks(fixture);
    const service = new FomoV2ActivitySourceSplitRemediationService(
      mocks.connection as any,
      mocks.activityModel as any,
      mocks.snapshotModel as any
    );

    const result = await service.run({
      write: true,
      confirmWrite: true,
      limit: 1,
    });

    expect(result.failed).toBe(1);
    expect(result.errors[0].errors).toContain(
      "Provider icodrops activity identity does not match its snapshots."
    );
    expect(mocks.connection.startSession).not.toHaveBeenCalled();
    expect(mocks.activityModel.updateOne).not.toHaveBeenCalled();
  });
});

function mixedFixture() {
  const activityId = new Types.ObjectId("64b000000000000000000001");
  const dropSnapshotId = new Types.ObjectId("64b000000000000000000011");
  const icoSnapshotId = new Types.ObjectId("64b000000000000000000012");
  const now = new Date("2026-08-01T00:00:00.000Z");
  const activity: Record<string, any> = {
    _id: activityId,
    slug: "mixed-airdrop",
    parserActivityId: "drop-1",
    sourceKeys: ["drop-stab:drop-1", "ICO-Drops:ico-1"],
    sources: [
      {
        source: "drop-stab",
        sourceId: "drop-1",
        sourceSlug: "mixed-airdrop",
        lastSeenAt: now,
      },
      {
        source: "ICO-Drops",
        sourceId: "ico-1",
        sourceSlug: "mixed-airdrop",
        lastSeenAt: now,
      },
    ],
    sourceSnapshotIds: [dropSnapshotId, icoSnapshotId],
    canonicalProjectId: new Types.ObjectId("64b000000000000000000021"),
    canonicalResolution: { status: "verified" },
    lifecycleStatus: "active",
    reviewStatus: "approved",
    publicationStatus: "published",
    accessTier: "prime",
    isSponsored: true,
    sponsoredPriority: 10,
    currentDraft: { name: "Mixed", activityType: "Airdrop" },
    publishedSnapshot: { name: "Mixed", activityType: "Airdrop" },
    publishedMetadata: { slug: "mixed-airdrop" },
    manualOverrideFields: ["name"],
    aiProposals: [{ proposalId: "old" }],
    revision: 7,
    auditTrail: [],
    legacyActivityId: "legacy-1",
  };
  const snapshots = [
    {
      _id: dropSnapshotId,
      source: "drop-stab",
      sourceEntityType: "activity",
      sourceId: "drop-1",
      sourceSlug: "mixed-airdrop",
      capturedAt: now,
      normalizedPreview: {
        name: "Dropstab draft",
        activityType: "Airdrop",
      },
    },
    {
      _id: icoSnapshotId,
      source: "ico_drops",
      sourceEntityType: "activity",
      sourceId: "ico-1",
      sourceSlug: "mixed-airdrop",
      capturedAt: now,
      normalizedPreview: {
        name: "ICODrops draft",
        activityType: "Quest",
      },
    },
  ];
  return { activity, snapshots };
}

function serviceMocks(fixture: ReturnType<typeof mixedFixture>) {
  const session = {
    withTransaction: jest.fn(async (callback: () => Promise<void>) =>
      callback()
    ),
    endSession: jest.fn().mockResolvedValue(undefined),
  };
  const hello = jest.fn().mockResolvedValue({ setName: "rs0", ok: 1 });
  const connection = {
    db: { admin: jest.fn(() => ({ command: hello })) },
    startSession: jest.fn().mockResolvedValue(session),
  };
  const listIndexes = jest.fn().mockReturnValue({
    toArray: jest
      .fn()
      .mockResolvedValue([
        { name: "_id_" },
        { name: "idx_activities_parser_id" },
      ]),
  });
  const activityModel = {
    collection: { listIndexes },
    find: jest.fn(() => boundedQuery([fixture.activity])),
    findById: jest.fn(() => sessionQuery(fixture.activity)),
    findOne: jest.fn(() => sessionQuery(null)),
    updateOne: jest
      .fn()
      .mockResolvedValue({ matchedCount: 1, modifiedCount: 1 }),
    create: jest.fn().mockResolvedValue([]),
  };
  const snapshotModel = {
    find: jest.fn((filter: any) => {
      const ids = (filter?._id?.$in || []).map(String);
      return sessionQuery(
        fixture.snapshots.filter((snapshot) =>
          ids.includes(String(snapshot._id))
        )
      );
    }),
  };
  return {
    session,
    hello,
    connection,
    listIndexes,
    activityModel,
    snapshotModel,
  };
}

function boundedQuery(result: any) {
  const query: any = {
    sort: jest.fn(() => query),
    limit: jest.fn(() => query),
    lean: jest.fn(() => query),
    exec: jest.fn().mockResolvedValue(result),
  };
  return query;
}

function sessionQuery(result: any) {
  const query: any = {
    session: jest.fn(() => query),
    lean: jest.fn(() => query),
    exec: jest.fn().mockResolvedValue(result),
  };
  return query;
}
