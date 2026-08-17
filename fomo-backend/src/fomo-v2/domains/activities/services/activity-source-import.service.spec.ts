import { Types } from "mongoose";
import {
  FomoV2ActivitySourceImportService,
  mapActivityCanonicalResolution,
} from "./activity-source-import.service";
import { FomoV2ParserImportLeaseLostError } from "../../../services/parser-import-runtime.service";

const findOneQuery = (value: any) => {
  const query: any = {
    select: jest.fn(),
    lean: jest.fn(),
    exec: jest.fn().mockResolvedValue(value),
  };
  query.select.mockReturnValue(query);
  query.lean.mockReturnValue(query);
  return query;
};

describe("mapActivityCanonicalResolution", () => {
  const projectId = new Types.ObjectId().toHexString();

  it("auto-verifies only resolver-verified exact identities", () => {
    expect(
      mapActivityCanonicalResolution({
        status: "matched",
        canonicalProjectId: projectId,
        verified: true,
        confidence: "exact",
        matchedBy: "provider_id",
        reason: "exact provider id",
        candidates: [],
        conflicts: [],
        actions: [],
      })
    ).toEqual(
      expect.objectContaining({
        canonicalStatus: "verified",
        canonicalProjectId: projectId,
      })
    );
  });

  it("keeps weak matches as admin proposals", () => {
    const decision = mapActivityCanonicalResolution({
      status: "proposed",
      canonicalProjectId: projectId,
      verified: false,
      confidence: "medium",
      matchedBy: "name_only",
      reason: "name-only",
      candidates: [],
      conflicts: [],
      actions: [],
    });
    expect(decision.canonicalStatus).toBe("proposed");
    expect(decision.canonicalProjectId).toBeUndefined();
    expect(decision.canonicalCandidates).toHaveLength(1);
  });

  it("allows a standalone activity when the resolver found no candidate", () => {
    expect(
      mapActivityCanonicalResolution({
        status: "created_candidate",
        verified: false,
        confidence: "none",
        matchedBy: "none",
        reason: "none",
        candidates: [],
        conflicts: [],
        actions: [],
      })
    ).toEqual({
      canonicalStatus: "no_candidates",
      canonicalCandidates: [],
    });
  });
});

describe("FomoV2ActivitySourceImportService", () => {
  it("requires an exact provider bucket for parser writes", async () => {
    const service = new FomoV2ActivitySourceImportService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { get: jest.fn() } as any
    );

    await expect(
      service.importPending({ source: "parser", write: true })
    ).rejects.toThrow("providerSourceType=dropstab or icodrops");
    await expect(
      service.importPending({ source: "all", write: true })
    ).rejects.toThrow("Write mode requires one source bucket");
  });

  it("propagates a managed execution fence and stops before the next activity document", async () => {
    const rows = [
      {
        _id: new Types.ObjectId(),
        name: "First activity",
        __fomoV2ActivityCursorAt: new Date("2026-07-01T00:00:00.000Z"),
      },
      {
        _id: new Types.ObjectId(),
        name: "Second activity",
        __fomoV2ActivityCursorAt: new Date("2026-07-01T00:00:01.000Z"),
      },
    ];
    const db = {
      databaseName: "fomo_new",
      listCollections: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{ name: "cryptoactivities" }]),
      }),
      collection: jest.fn().mockReturnValue({
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue(rows),
        }),
      }),
    };
    const service = new FomoV2ActivitySourceImportService(
      { db } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { get: jest.fn() } as any
    );
    const stageDocument = jest.spyOn(service, "stageDocument").mockResolvedValue({
      staged: true,
      created: true,
      canonicalStatus: "no_candidates",
    });
    const fenceError = new Error("managed lease lost");
    const assertExecutionActive = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(fenceError);

    await expect(
      service.importPending({
        source: "legacy",
        limit: 10,
        write: false,
        assertExecutionActive,
      })
    ).rejects.toBe(fenceError);

    expect(stageDocument).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["true", true],
    ["1", true],
    ["yes", true],
    ["on", true],
    ["false", false],
    ["", false],
    ["flase", false],
  ])("parses the write-cron opt-in value %p as %p", (value, expected) => {
    const service = new FomoV2ActivitySourceImportService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { get: jest.fn().mockReturnValue(value) } as any
    );

    expect(
      (service as any).isEnabled("FOMO_V2_ACTIVITY_INGEST_ENABLED", false)
    ).toBe(expected);
  });

  it("orchestrates resolver evidence into the existing idempotent stage service", async () => {
    const projectId = new Types.ObjectId().toHexString();
    const sourceSnapshotModel = { exists: jest.fn().mockResolvedValue(null) };
    const activityModel = { exists: jest.fn().mockResolvedValue(null) };
    const ingestService = {
      stage: jest.fn().mockResolvedValue({
        created: true,
        activity: { canonicalResolution: { status: "verified" } },
      }),
    };
    const resolver = {
      resolve: jest.fn().mockResolvedValue({
        status: "matched",
        canonicalProjectId: projectId,
        verified: true,
        confidence: "exact",
        matchedBy: "source_url",
        reason: "exact URL",
        candidates: [],
        conflicts: [],
        actions: [],
      }),
    };
    const assetMirror = {
      mirrorUrl: jest
        .fn()
        .mockResolvedValue("https://assets.fomo.cx/external/unknown/gamma.jpg"),
    };
    const service = new FomoV2ActivitySourceImportService(
      {} as any,
      {} as any,
      activityModel as any,
      sourceSnapshotModel as any,
      ingestService as any,
      resolver as any,
      { get: jest.fn() } as any,
      assetMirror as any
    );

    const result = await service.stageDocument(
      {
        _id: new Types.ObjectId(),
        source: "ICO-Drops",
        sourceUrl: "https://example.test/activity",
        name: "Gamma",
        logo: "https://airdrops.io/wp-content/uploads/gamma.jpg",
        activityType: "Quest",
      },
      "parser"
    );

    expect(result.canonicalStatus).toBe("verified");
    const stagedInput = ingestService.stage.mock.calls[0][0];
    expect(stagedInput).toEqual(
      expect.objectContaining({
        source: "icodrops",
        canonicalStatus: "verified",
        canonicalProjectId: projectId,
        normalizedDraft: expect.objectContaining({
          logo: "https://assets.fomo.cx/external/unknown/gamma.jpg",
          projectLogo: "https://assets.fomo.cx/external/unknown/gamma.jpg",
        }),
      })
    );
    expect(resolver.resolve).toHaveBeenCalledWith(
      expect.objectContaining({ source: "icodrops" })
    );
    expect(assetMirror.mirrorUrl).toHaveBeenCalledWith(
      "https://airdrops.io/wp-content/uploads/gamma.jpg",
      expect.objectContaining({
        collection: "activities",
        fieldPath: "currentDraft.logo",
      })
    );
    expect(stagedInput).not.toHaveProperty("publicationStatus");
  });

  it("keeps dry-run free of mirror and ingest writes", async () => {
    const ingestService = { stage: jest.fn() };
    const resolver = {
      resolve: jest.fn().mockResolvedValue({
        status: "created_candidate",
        verified: false,
        confidence: "none",
        matchedBy: "none",
        reason: "none",
        candidates: [],
        conflicts: [],
        actions: [],
      }),
    };
    const assetMirror = { mirrorUrl: jest.fn() };
    const service = new FomoV2ActivitySourceImportService(
      {} as any,
      {} as any,
      { exists: jest.fn().mockResolvedValue(null) } as any,
      { exists: jest.fn().mockResolvedValue(null) } as any,
      ingestService as any,
      resolver as any,
      { get: jest.fn() } as any,
      assetMirror as any
    );

    await expect(
      service.stageDocument(
        {
          _id: new Types.ObjectId(),
          source: "dropstab",
          sourceUrl: "https://example.test/dry-run-activity",
          name: "Dry run activity",
          activityType: "Quest",
        },
        "parser",
        { write: false }
      )
    ).resolves.toEqual(
      expect.objectContaining({ staged: true, dryRun: true })
    );
    expect(resolver.resolve).toHaveBeenCalledTimes(1);
    expect(assetMirror.mirrorUrl).not.toHaveBeenCalled();
    expect(ingestService.stage).not.toHaveBeenCalled();
  });

  it("does not restage an unchanged snapshot that already has an aggregate", async () => {
    const snapshotId = new Types.ObjectId();
    const sourceSnapshotModel = {
      exists: jest.fn().mockResolvedValue({ _id: snapshotId }),
    };
    const activityModel = {
      findOne: jest.fn().mockReturnValue(
        findOneQuery({
          _id: "a",
          sources: [{ source: "legacy" }],
          canonicalResolution: { status: "no_candidates" },
        })
      ),
    };
    const ingestService = { stage: jest.fn() };
    const resolver = { resolve: jest.fn() };
    const service = new FomoV2ActivitySourceImportService(
      {} as any,
      {} as any,
      activityModel as any,
      sourceSnapshotModel as any,
      ingestService as any,
      resolver as any,
      { get: jest.fn() } as any
    );

    await expect(
      service.stageDocument(
        { _id: new Types.ObjectId(), name: "Delta", activityType: "Quest" },
        "legacy"
      )
    ).resolves.toEqual(
      expect.objectContaining({ staged: false, skipped: "unchanged" })
    );
    expect(resolver.resolve).not.toHaveBeenCalled();
    expect(ingestService.stage).not.toHaveBeenCalled();
    expect(activityModel.findOne).toHaveBeenCalledWith({
      $and: expect.arrayContaining([{ sourceSnapshotIds: snapshotId }]),
    });
  });

  it("restages after a partial write when the snapshot is not linked to the aggregate", async () => {
    const snapshotId = new Types.ObjectId();
    const sourceSnapshotModel = {
      exists: jest.fn().mockResolvedValue({ _id: snapshotId }),
    };
    const activityModel = {
      findOne: jest.fn().mockReturnValue(findOneQuery(null)),
    };
    const ingestService = {
      stage: jest.fn().mockResolvedValue({
        updated: true,
        activity: { canonicalResolution: { status: "no_candidates" } },
      }),
    };
    const resolver = {
      resolve: jest.fn().mockResolvedValue({
        status: "created_candidate",
        verified: false,
        confidence: "none",
        matchedBy: "none",
        reason: "none",
        candidates: [],
        conflicts: [],
        actions: [],
      }),
    };
    const service = new FomoV2ActivitySourceImportService(
      {} as any,
      {} as any,
      activityModel as any,
      sourceSnapshotModel as any,
      ingestService as any,
      resolver as any,
      { get: jest.fn() } as any
    );

    await expect(
      service.stageDocument(
        {
          _id: new Types.ObjectId(),
          source: "dropstab",
          name: "Partial Delta",
          activityType: "Quest",
        },
        "parser"
      )
    ).resolves.toEqual(expect.objectContaining({ staged: true }));
    expect(activityModel.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        $and: expect.arrayContaining([{ sourceSnapshotIds: snapshotId }]),
      })
    );
    expect(resolver.resolve).toHaveBeenCalledTimes(1);
    expect(ingestService.stage).toHaveBeenCalledTimes(1);
  });

  it("does not mirror, resolve, or stage after losing the provider lease", async () => {
    const assetMirror = { mirrorUrl: jest.fn() };
    const ingestService = { stage: jest.fn() };
    const resolver = { resolve: jest.fn() };
    const service = new FomoV2ActivitySourceImportService(
      {} as any,
      {} as any,
      { exists: jest.fn().mockResolvedValue(null) } as any,
      { exists: jest.fn().mockResolvedValue(null) } as any,
      ingestService as any,
      resolver as any,
      { get: jest.fn() } as any,
      assetMirror as any
    );

    await expect(
      service.stageDocument(
        {
          _id: new Types.ObjectId(),
          source: "dropstab",
          name: "Lost Lease Quest",
          activityType: "Quest",
          logo: "https://example.test/logo.png",
        },
        "parser",
        {
          assertLease: jest
            .fn()
            .mockRejectedValue(
              new FomoV2ParserImportLeaseLostError("lease lost")
            ),
        }
      )
    ).rejects.toBeInstanceOf(FomoV2ParserImportLeaseLostError);
    expect(assetMirror.mirrorUrl).not.toHaveBeenCalled();
    expect(resolver.resolve).not.toHaveBeenCalled();
    expect(ingestService.stage).not.toHaveBeenCalled();
  });

  it("ignores raw parser capture timestamps when computing idempotency", async () => {
    const sourceSnapshotModel = {
      exists: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ _id: "snapshot-1" }),
    };
    const activityModel = {
      findOne: jest.fn().mockReturnValue(
        findOneQuery({
          _id: "activity-1",
          sources: [{ source: "dropstab" }],
          canonicalResolution: { status: "no_candidates" },
        })
      ),
    };
    const ingestService = {
      stage: jest.fn().mockResolvedValue({
        created: true,
        activity: { canonicalResolution: { status: "no_candidates" } },
      }),
    };
    const resolver = {
      resolve: jest.fn().mockResolvedValue({
        status: "created_candidate",
        verified: false,
        confidence: "none",
        matchedBy: "none",
        reason: "none",
        candidates: [],
        conflicts: [],
        actions: [],
      }),
    };
    const service = new FomoV2ActivitySourceImportService(
      {} as any,
      {} as any,
      activityModel as any,
      sourceSnapshotModel as any,
      ingestService as any,
      resolver as any,
      { get: jest.fn() } as any
    );
    const sourceId = new Types.ObjectId();
    const base = {
      _id: sourceId,
      slug: "stable-quest",
      source: "dropstab",
      name: "Stable Quest",
      activityType: "Quest",
    };

    await service.stageDocument(
      {
        ...base,
        updatedAt: "2026-07-01T00:00:00.000Z",
        parserMeta: { fetchedAt: "2026-07-01T00:00:01.000Z" },
      },
      "parser"
    );
    await expect(
      service.stageDocument(
        {
          ...base,
          updatedAt: "2026-07-02T00:00:00.000Z",
          parserMeta: { fetchedAt: "2026-07-02T00:00:01.000Z" },
        },
        "parser"
      )
    ).resolves.toEqual(
      expect.objectContaining({ staged: false, skipped: "unchanged" })
    );

    expect(sourceSnapshotModel.exists.mock.calls[0][0].payloadHash).toBe(
      sourceSnapshotModel.exists.mock.calls[1][0].payloadHash
    );
    expect(ingestService.stage).toHaveBeenCalledTimes(1);
    expect(resolver.resolve).toHaveBeenCalledTimes(1);
  });

  it("retries an unchanged snapshot while canonical resolution is unprocessed after a resolver outage", async () => {
    const snapshotId = new Types.ObjectId();
    const sourceSnapshotModel = {
      exists: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ _id: snapshotId }),
    };
    const activityModel = {
      findOne: jest.fn().mockReturnValue(
        findOneQuery({
          _id: new Types.ObjectId(),
          sources: [{ source: "dropstab" }],
          sourceKeys: ["dropstab:resolver-retry-1"],
          canonicalResolution: { status: "unprocessed" },
        })
      ),
    };
    const ingestService = {
      stage: jest.fn().mockResolvedValue({
        created: false,
        sourceSnapshotId: snapshotId.toHexString(),
        activity: { canonicalResolution: { status: "unprocessed" } },
      }),
    };
    const resolver = {
      resolve: jest
        .fn()
        .mockRejectedValueOnce(new Error("resolver unavailable"))
        .mockResolvedValueOnce({
          status: "created_candidate",
          verified: false,
          confidence: "none",
          matchedBy: "none",
          reason: "none",
          candidates: [],
          conflicts: [],
          actions: [],
        }),
    };
    const service = new FomoV2ActivitySourceImportService(
      {} as any,
      {} as any,
      activityModel as any,
      sourceSnapshotModel as any,
      ingestService as any,
      resolver as any,
      { get: jest.fn() } as any
    );
    const document = {
      _id: "resolver-retry-1",
      source: "dropstab",
      name: "Resolver Retry",
      activityType: "Quest",
    };

    await expect(service.stageDocument(document, "parser")).rejects.toEqual(
      expect.objectContaining({
        code: "ACTIVITY_CANONICAL_RESOLVER_RETRY",
        metadata: expect.objectContaining({ partialStagePersisted: true }),
      })
    );
    await expect(service.stageDocument(document, "parser")).resolves.toEqual(
      expect.objectContaining({
        staged: true,
        canonicalStatus: "no_candidates",
      })
    );
    expect(resolver.resolve).toHaveBeenCalledTimes(2);
    expect(ingestService.stage).toHaveBeenCalledTimes(2);
  });

  it("rejects an unchanged mixed-provider aggregate for controlled split review", async () => {
    const snapshotId = new Types.ObjectId();
    const activityId = new Types.ObjectId();
    const activityModel = {
      findOne: jest.fn().mockReturnValue(
        findOneQuery({
          _id: activityId,
          sourceKeys: ["dropstab:mixed-1", "icodrops:mixed-1"],
          sources: [{ source: "dropstab" }, { source: "icodrops" }],
          canonicalResolution: { status: "verified" },
        })
      ),
    };
    const ingestService = { stage: jest.fn() };
    const service = new FomoV2ActivitySourceImportService(
      {} as any,
      {} as any,
      activityModel as any,
      { exists: jest.fn().mockResolvedValue({ _id: snapshotId }) } as any,
      ingestService as any,
      { resolve: jest.fn() } as any,
      { get: jest.fn() } as any
    );

    let conflict: any;
    try {
      await service.stageDocument(
        {
          _id: "mixed-1",
          source: "dropstab",
          name: "Mixed Legacy Aggregate",
          activityType: "Quest",
        },
        "parser"
      );
    } catch (error) {
      conflict = error;
    }

    expect(conflict?.getResponse()).toEqual(
      expect.objectContaining({
        code: "ACTIVITY_MIXED_PROVIDER_AGGREGATE",
        reviewRequired: true,
        metadata: expect.objectContaining({
          action: "controlled_split_backfill",
          incomingSource: "dropstab",
          existingSources: expect.arrayContaining(["dropstab", "icodrops"]),
        }),
      })
    );
    expect(ingestService.stage).not.toHaveBeenCalled();
  });

  it("refreshes lifecycle statuses forward without touching publication state", async () => {
    const rows = [
      {
        _id: new Types.ObjectId(),
        revision: 1,
        lifecycleStatus: "upcoming",
        currentDraft: {
          startDate: new Date("2026-01-01T00:00:00.000Z"),
          endDate: new Date("2027-01-01T00:00:00.000Z"),
        },
      },
      {
        _id: new Types.ObjectId(),
        revision: 5,
        lifecycleStatus: "active",
        currentDraft: { endDate: new Date("2026-02-01T00:00:00.000Z") },
      },
      {
        _id: new Types.ObjectId(),
        revision: 8,
        lifecycleStatus: "upcoming",
        currentDraft: {
          startDate: new Date("2027-01-01T00:00:00.000Z"),
        },
        publicationStatus: "published",
        publishedMetadata: { lifecycleStatus: "active" },
        publishedSnapshot: {
          endDate: new Date("2026-03-01T00:00:00.000Z"),
        },
      },
    ];
    let operations: any[] = [];
    const activityModel = {
      find: jest.fn().mockReturnValue({
        sort: () => ({
          limit: () => ({ lean: () => ({ exec: async () => rows }) }),
        }),
      }),
      bulkWrite: jest.fn(async (value) => {
        operations = value;
        return { modifiedCount: value.length };
      }),
    };
    const service = new FomoV2ActivitySourceImportService(
      {} as any,
      {} as any,
      activityModel as any,
      {} as any,
      {} as any,
      {} as any,
      { get: jest.fn() } as any
    );

    await expect(
      service.refreshLifecycleStatuses(new Date("2026-07-01T00:00:00.000Z"))
    ).resolves.toEqual({ scanned: 3, attempted: 3, updated: 3 });
    expect(operations[0].updateOne.update.$set).toEqual({
      lifecycleStatus: "active",
    });
    expect(operations[1].updateOne.update.$set).toEqual({
      lifecycleStatus: "ended",
    });
    expect(operations[2].updateOne.update.$set).toEqual({
      "publishedMetadata.lifecycleStatus": "ended",
    });
    expect(
      operations.some(
        (operation) =>
          operation.updateOne.update.$set.publicationStatus !== undefined ||
          operation.updateOne.update.$set.publishedSnapshot !== undefined
      )
    ).toBe(false);
  });

  it("does not advance the cursor past a failed import page", async () => {
    const cursorBeforePage = Buffer.from(
      JSON.stringify({
        at: "2026-06-30T00:00:00.000Z",
        id: new Types.ObjectId().toHexString(),
      }),
      "utf8"
    ).toString("base64url");
    const sourceRow = {
      _id: new Types.ObjectId(),
      name: "Retry Me",
      __fomoV2ActivityCursorAt: new Date("2026-07-01T00:00:00.000Z"),
    };
    const db = {
      databaseName: "fomo_new",
      listCollections: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{ name: "cryptoactivities" }]),
      }),
      collection: jest.fn().mockReturnValue({
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([sourceRow]),
        }),
      }),
    };
    const service = new FomoV2ActivitySourceImportService(
      { db } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { get: jest.fn() } as any
    );
    jest
      .spyOn(service, "stageDocument")
      .mockRejectedValueOnce(new Error("temporary stage failure"));

    const result = await (service as any).importPage("legacy", {
      limit: 10,
      cursor: cursorBeforePage,
      force: false,
      persistCheckpoint: false,
    });

    expect(result.counts.failed).toBe(1);
    expect(result.nextCursor).toBe(cursorBeforePage);
    expect(result.hasMore).toBe(true);
    expect(result.errors[0]).toEqual(
      expect.objectContaining({ message: "temporary stage failure" })
    );
  });

  it("advances a persisted source cursor after a poison row is quarantined", async () => {
    const sourceRow = {
      _id: new Types.ObjectId(),
      name: "Poison Row",
      __fomoV2ActivityCursorAt: new Date("2026-07-01T00:00:00.000Z"),
    };
    const db = {
      databaseName: "fomo_new",
      listCollections: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{ name: "cryptoactivities" }]),
      }),
      collection: jest.fn().mockReturnValue({
        distinct: jest.fn().mockResolvedValue([]),
        countDocuments: jest.fn().mockResolvedValue(1),
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([sourceRow]),
        }),
      }),
    };
    const run = {
      pipeline: "activities",
      sourceType: "legacy",
      sourceDatabase: "fomo_new",
      sourceCollection: "cryptoactivities",
      runId: new Types.ObjectId().toHexString(),
      runKey: "activities:legacy:test",
      checkpointId: new Types.ObjectId().toHexString(),
      leaseOwner: "test-worker",
      leaseMs: 60_000,
      cutoffAt: new Date(),
    };
    const runtime = {
      startRun: jest.fn().mockResolvedValue(run),
      listReplayRequests: jest
        .fn()
        .mockResolvedValue({ requests: [], hasMore: false }),
      heartbeat: jest.fn().mockResolvedValue(undefined),
      recordDocumentFailure: jest
        .fn()
        .mockResolvedValue({ attempts: 3, quarantined: true }),
      resolveDocumentFailure: jest.fn(),
      commitPage: jest.fn().mockResolvedValue(undefined),
      completeRun: jest.fn().mockResolvedValue(undefined),
      failRun: jest.fn().mockResolvedValue(undefined),
    };
    const service = new FomoV2ActivitySourceImportService(
      { db } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { get: jest.fn() } as any,
      undefined,
      runtime as any
    );
    jest
      .spyOn(service, "stageDocument")
      .mockRejectedValueOnce(new Error("permanent invalid payload"));

    const result = await (service as any).importPage("legacy", {
      limit: 10,
      force: false,
      persistCheckpoint: true,
    });

    expect(result.counts).toEqual(
      expect.objectContaining({ failed: 1, quarantined: 1 })
    );
    expect(result.nextCursor).toEqual(expect.any(String));
    expect(result.hasMore).toBe(false);
    expect(runtime.startRun).toHaveBeenCalledWith(
      expect.objectContaining({ sourceType: "legacy" })
    );
    expect(runtime.commitPage).toHaveBeenCalledWith(
      run,
      expect.objectContaining({ cursor: result.nextCursor })
    );
    expect(runtime.completeRun).toHaveBeenCalledWith(
      run,
      expect.objectContaining({ status: "partial" })
    );
  });

  it("uses separate provider checkpoints, filters, and the configured lease for a mixed parser collection", async () => {
    const aggregate = jest.fn().mockImplementation((pipeline: any[]) => {
      const filterText = JSON.stringify(pipeline[0]?.$match || {});
      const source = filterText.includes("ICO-Drops")
        ? "ICO-Drops"
        : "dropstab";
      return {
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            source,
            name: `${source} activity`,
            __fomoV2ActivityCursorAt: new Date("2026-07-01T00:00:00.000Z"),
          },
        ]),
      };
    });
    const collectionApi = {
      distinct: jest
        .fn()
        .mockImplementation((field: string) =>
          Promise.resolve(
            field === "primarySource" ? [] : ["dropstab", "ICO-Drops"]
          )
        ),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate,
    };
    const db = {
      databaseName: "parser_new",
      listCollections: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{ name: "crypto_activities" }]),
      }),
      collection: jest.fn().mockReturnValue(collectionApi),
    };
    const runtime = {
      startRun: jest.fn().mockImplementation(async (input: any) => ({
        pipeline: input.pipeline,
        sourceType: input.sourceType,
        sourceDatabase: input.sourceDatabase,
        sourceCollection: input.sourceCollection,
        runId: new Types.ObjectId().toHexString(),
        runKey: `activities:${input.sourceType}`,
        checkpointId: new Types.ObjectId().toHexString(),
        leaseOwner: `worker:${input.sourceType}`,
        leaseMs: input.leaseMs,
        cutoffAt: new Date("2026-08-01T00:00:00.000Z"),
      })),
      listReplayRequests: jest
        .fn()
        .mockResolvedValue({ requests: [], hasMore: false }),
      heartbeat: jest.fn().mockResolvedValue(undefined),
      resolveDocumentFailure: jest.fn(),
      commitPage: jest.fn(),
      completeRun: jest.fn(),
      failRun: jest.fn(),
    };
    const config = {
      get: jest.fn((key: string) =>
        key === "FOMO_V2_ACTIVITY_INGEST_LEASE_MS" ? "600000" : undefined
      ),
    };
    const service = new FomoV2ActivitySourceImportService(
      {} as any,
      { db } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      config as any,
      undefined,
      runtime as any
    );
    jest.spyOn(service, "stageDocument").mockResolvedValue({
      staged: true,
      created: true,
      canonicalStatus: "no_candidates",
    });

    const result = await (service as any).importPage("parser", {
      limit: 10,
      force: false,
      persistCheckpoint: true,
    });

    expect(
      runtime.startRun.mock.calls.map(([input]: any[]) => input.sourceType)
    ).toEqual(["dropstab", "icodrops"]);
    expect(runtime.startRun).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ sourceType: "dropstab", leaseMs: 600000 })
    );
    expect(runtime.startRun).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ sourceType: "icodrops", leaseMs: 600000 })
    );
    const filters = aggregate.mock.calls.map(
      ([pipeline]) => pipeline[0].$match
    );
    expect(JSON.stringify(filters)).toContain("dropstab");
    expect(JSON.stringify(filters)).toContain("ICO-Drops");
    expect(result.counts).toEqual(
      expect.objectContaining({ scanned: 2, staged: 2, created: 2 })
    );
  });

  it("continues with icodrops when the dropstab provider lease fails", async () => {
    const collectionApi = {
      distinct: jest
        .fn()
        .mockImplementation((field: string) =>
          Promise.resolve(
            field === "primarySource" ? [] : ["dropstab", "icodrops"]
          )
        ),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          {
            _id: new Types.ObjectId(),
            source: "icodrops",
            name: "ICODrops survives",
            __fomoV2ActivityCursorAt: new Date("2026-07-01T00:00:00.000Z"),
          },
        ]),
      }),
    };
    const db = {
      databaseName: "parser_new",
      listCollections: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{ name: "crypto_activities" }]),
      }),
      collection: jest.fn().mockReturnValue(collectionApi),
    };
    const runtime = {
      startRun: jest.fn().mockImplementation(async (input: any) => {
        if (input.sourceType === "dropstab") {
          throw new Error("dropstab lease is held");
        }
        return {
          pipeline: input.pipeline,
          sourceType: input.sourceType,
          sourceDatabase: input.sourceDatabase,
          sourceCollection: input.sourceCollection,
          runId: new Types.ObjectId().toHexString(),
          runKey: "activities:icodrops",
          checkpointId: new Types.ObjectId().toHexString(),
          leaseOwner: "worker:icodrops",
          leaseMs: 60_000,
          cutoffAt: new Date("2026-08-01T00:00:00.000Z"),
        };
      }),
      listReplayRequests: jest
        .fn()
        .mockResolvedValue({ requests: [], hasMore: false }),
      heartbeat: jest.fn(),
      resolveDocumentFailure: jest.fn(),
      commitPage: jest.fn(),
      completeRun: jest.fn(),
      failRun: jest.fn(),
    };
    const service = new FomoV2ActivitySourceImportService(
      {} as any,
      { db } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { get: jest.fn() } as any,
      undefined,
      runtime as any
    );
    const stage = jest.spyOn(service, "stageDocument").mockResolvedValue({
      staged: true,
      created: true,
      canonicalStatus: "no_candidates",
    });

    const result = await (service as any).importPage("parser", {
      limit: 10,
      force: false,
      persistCheckpoint: true,
    });

    expect(
      runtime.startRun.mock.calls.map(([input]: any[]) => input.sourceType)
    ).toEqual(["dropstab", "icodrops"]);
    expect(stage).toHaveBeenCalledTimes(1);
    expect(result.counts).toEqual(
      expect.objectContaining({ failed: 1, staged: 1, created: 1 })
    );
    expect(result.errors).toEqual([
      expect.objectContaining({
        id: "provider:dropstab",
        message: "dropstab lease is held",
      }),
    ]);
  });

  it("reports an unsupported provider bucket without blocking supported providers", async () => {
    const collectionApi = {
      distinct: jest
        .fn()
        .mockImplementation((field: string) =>
          Promise.resolve(
            field === "primarySource"
              ? []
              : ["dropstab", "dropstab-v2", "icodrops"]
          )
        ),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockReturnValue({
        toArray: jest.fn().mockImplementation(async () => [
          {
            _id: new Types.ObjectId(),
            source: "supported",
            name: "Supported activity",
            __fomoV2ActivityCursorAt: new Date("2026-07-01T00:00:00.000Z"),
          },
        ]),
      }),
    };
    const db = {
      databaseName: "parser_new",
      listCollections: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{ name: "crypto_activities" }]),
      }),
      collection: jest.fn().mockReturnValue(collectionApi),
    };
    const runtime = {
      startRun: jest.fn().mockImplementation(async (input: any) => ({
        pipeline: input.pipeline,
        sourceType: input.sourceType,
        sourceDatabase: input.sourceDatabase,
        sourceCollection: input.sourceCollection,
        runId: new Types.ObjectId().toHexString(),
        runKey: `activities:${input.sourceType}`,
        checkpointId: new Types.ObjectId().toHexString(),
        leaseOwner: `worker:${input.sourceType}`,
        leaseMs: 60_000,
        cutoffAt: new Date("2026-08-01T00:00:00.000Z"),
      })),
      listReplayRequests: jest
        .fn()
        .mockResolvedValue({ requests: [], hasMore: false }),
      heartbeat: jest.fn(),
      resolveDocumentFailure: jest.fn(),
      commitPage: jest.fn(),
      completeRun: jest.fn(),
      failRun: jest.fn(),
    };
    const service = new FomoV2ActivitySourceImportService(
      {} as any,
      { db } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { get: jest.fn() } as any,
      undefined,
      runtime as any
    );
    const stage = jest.spyOn(service, "stageDocument").mockResolvedValue({
      staged: true,
      created: true,
      canonicalStatus: "no_candidates",
    });

    const result = await (service as any).importPage("parser", {
      limit: 10,
      force: false,
      persistCheckpoint: true,
    });

    expect(
      runtime.startRun.mock.calls.map(([input]: any[]) => input.sourceType)
    ).toEqual(["dropstab", "icodrops"]);
    expect(stage).toHaveBeenCalledTimes(2);
    expect(result.counts).toEqual(
      expect.objectContaining({ failed: 1, staged: 2 })
    );
    expect(result.errors).toEqual([
      expect.objectContaining({
        id: "provider:dropstab_v2",
        message: expect.stringContaining("Unsupported activity provider"),
      }),
    ]);
  });

  it("retries a malformed provider row and advances only after quarantine", async () => {
    const sourceRow = {
      _id: new Types.ObjectId(),
      source: "dropstab",
      __fomoV2ActivityCursorAt: new Date("2026-07-01T00:00:00.000Z"),
    };
    const collectionApi = {
      distinct: jest
        .fn()
        .mockImplementation((field: string) =>
          Promise.resolve(field === "source" ? ["dropstab"] : [])
        ),
      countDocuments: jest.fn().mockResolvedValue(0),
      aggregate: jest.fn().mockReturnValue({
        toArray: jest.fn().mockImplementation(async () => [{ ...sourceRow }]),
      }),
    };
    const db = {
      databaseName: "parser_new",
      listCollections: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{ name: "crypto_activities" }]),
      }),
      collection: jest.fn().mockReturnValue(collectionApi),
    };
    const run = () => ({
      pipeline: "activities",
      sourceType: "dropstab",
      sourceDatabase: "parser_new",
      sourceCollection: "crypto_activities",
      runId: new Types.ObjectId().toHexString(),
      runKey: "activities:dropstab:test",
      checkpointId: new Types.ObjectId().toHexString(),
      leaseOwner: "worker",
      leaseMs: 60_000,
      cutoffAt: new Date("2026-08-01T00:00:00.000Z"),
    });
    const runtime = {
      startRun: jest.fn().mockImplementation(async () => run()),
      listReplayRequests: jest
        .fn()
        .mockResolvedValue({ requests: [], hasMore: false }),
      heartbeat: jest.fn().mockResolvedValue(undefined),
      recordDocumentFailure: jest
        .fn()
        .mockResolvedValueOnce({ attempts: 1, quarantined: false })
        .mockResolvedValueOnce({ attempts: 2, quarantined: true }),
      resolveDocumentFailure: jest.fn(),
      commitPage: jest.fn(),
      completeRun: jest.fn(),
      failRun: jest.fn(),
    };
    const service = new FomoV2ActivitySourceImportService(
      {} as any,
      { db } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { get: jest.fn() } as any,
      undefined,
      runtime as any
    );

    const first = await (service as any).importPage("parser", {
      limit: 10,
      force: false,
      persistCheckpoint: true,
    });
    const second = await (service as any).importPage("parser", {
      limit: 10,
      force: false,
      persistCheckpoint: true,
    });

    expect(first).toEqual(
      expect.objectContaining({
        hasMore: true,
        counts: expect.objectContaining({
          failed: 1,
          skippedInvalid: 1,
          quarantined: 0,
        }),
      })
    );
    expect(second).toEqual(
      expect.objectContaining({
        hasMore: false,
        counts: expect.objectContaining({
          failed: 1,
          skippedInvalid: 1,
          quarantined: 1,
        }),
      })
    );
    expect(runtime.recordDocumentFailure).toHaveBeenCalledTimes(2);
    expect(runtime.resolveDocumentFailure).not.toHaveBeenCalled();
    expect(runtime.commitPage).toHaveBeenCalledTimes(1);
  });

  it("replays an exact queued document even when the checkpoint is already past it", async () => {
    const harness = replayHarness({ hasMore: true });

    const result = await (harness.service as any).importPage("parser", {
      limit: 10,
      force: false,
      persistCheckpoint: true,
      providerBucket: {
        sourceType: "dropstab",
        filter: { source: "dropstab" },
      },
    });

    expect(harness.stage).toHaveBeenCalledWith(
      harness.document,
      "parser",
      expect.objectContaining({ force: true })
    );
    expect(harness.runtime.resolveDocumentFailure).toHaveBeenCalledWith(
      harness.run,
      String(harness.document._id)
    );
    expect(harness.collection.aggregate).not.toHaveBeenCalled();
    expect(result.nextCursor).toBe(harness.run.cursor);
    expect(result.hasMore).toBe(true);
  });

  it("uses the current parser payload generation when an exact replay fails", async () => {
    const harness = replayHarness({ hasMore: false, stageError: "still bad" });

    await (harness.service as any).importPage("parser", {
      limit: 10,
      force: false,
      persistCheckpoint: true,
      providerBucket: {
        sourceType: "dropstab",
        filter: { source: "dropstab" },
      },
    });

    const failureInput =
      harness.runtime.recordDocumentFailure.mock.calls[0][1];
    expect(failureInput.payloadHash).toEqual(expect.any(String));
    expect(failureInput.payloadHash).not.toBe("stale-payload-hash");
    expect(failureInput.metadata.replayRequested).toBe(true);
  });

  function replayHarness(options: {
    hasMore: boolean;
    stageError?: string;
  }) {
    const document = {
      _id: new Types.ObjectId(),
      source: "dropstab",
      sourceId: "dropstab-replay-1",
      name: "Replayed activity",
      activityType: "Airdrop",
    };
    const collection = {
      find: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([document]),
        }),
      }),
      aggregate: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([]),
      }),
    };
    const db = {
      databaseName: "parser_new",
      listCollections: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([{ name: "crypto_activities" }]),
      }),
      collection: jest.fn().mockReturnValue(collection),
    };
    const run = {
      pipeline: "activities",
      sourceType: "dropstab",
      sourceDatabase: "parser_new",
      sourceCollection: "crypto_activities",
      runId: new Types.ObjectId().toHexString(),
      runKey: "activities:dropstab:replay",
      checkpointId: new Types.ObjectId().toHexString(),
      leaseOwner: "replay-worker",
      leaseMs: 60_000,
      cursor: Buffer.from(
        JSON.stringify({
          at: "2026-07-15T00:00:00.000Z",
          id: new Types.ObjectId().toHexString(),
        }),
        "utf8"
      ).toString("base64url"),
      cutoffAt: new Date("2026-08-01T00:00:00.000Z"),
    };
    const runtime = {
      startRun: jest.fn().mockResolvedValue(run),
      listReplayRequests: jest.fn().mockResolvedValue({
        requests: [
          {
            sourceDocumentId: String(document._id),
            payloadHash: "stale-payload-hash",
            schemaVersion: "activity-source-v1",
          },
        ],
        hasMore: options.hasMore,
      }),
      heartbeat: jest.fn().mockResolvedValue(undefined),
      resolveDocumentFailure: jest.fn().mockResolvedValue(undefined),
      recordDocumentFailure: jest
        .fn()
        .mockResolvedValue({ attempts: 1, quarantined: false }),
      commitPage: jest.fn().mockResolvedValue(undefined),
      completeRun: jest.fn().mockResolvedValue(undefined),
      failRun: jest.fn().mockResolvedValue(undefined),
    };
    const service = new FomoV2ActivitySourceImportService(
      {} as any,
      { db } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { get: jest.fn() } as any,
      undefined,
      runtime as any
    );
    const stage = jest.spyOn(service, "stageDocument");
    if (options.stageError) {
      stage.mockRejectedValue(new Error(options.stageError));
    } else {
      stage.mockResolvedValue({
        staged: true,
        created: false,
        canonicalStatus: "no_candidates",
      });
    }
    return { service, document, collection, runtime, run, stage };
  }
});
