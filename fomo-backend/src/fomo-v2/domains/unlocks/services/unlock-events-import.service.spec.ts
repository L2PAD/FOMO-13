import { Types } from "mongoose";
import {
  FomoV2UnlockEventsImportResult,
  FomoV2UnlockEventsImportService,
} from "./unlock-events-import.service";

describe("FomoV2UnlockEventsImportService", () => {
  const canonicalProjectId = new Types.ObjectId("64b64c000000000000000001");

  it("skips inactive tokenomics sources without writing", async () => {
    const harness = createHarness({
      sourceRows: [
        {
          sourceType: "cryptorank",
          vestingDatasetKey:
            "cryptorank:vesting_dataset:64b64c000000000000000001",
        },
      ],
    });

    const result = await harness.service.run({ limit: 1, mode: "next-only" });

    expect(result.dryRun).toBe(true);
    expect(result.sourceEventsFound).toBe(1);
    expect(result.skippedInactiveSource).toBe(1);
    expect(result.skippedSourceConflict).toBe(1);
    expect(result.eventsWouldSkip).toBe(1);
    expect(result.eventsWouldCreate).toBe(0);
    expect(harness.unlocksService.upsertUnlockEvent).not.toHaveBeenCalled();
    expect(harness.unlockEventModel.findOne).not.toHaveBeenCalled();
  });

  it("allows import when existing vesting documents use the incoming sourceType", async () => {
    const harness = createHarness({
      sourceRows: [
        {
          sourceType: "dropstab",
          vestingDatasetKey:
            "dropstab:vesting_dataset:64b64c000000000000000001",
        },
      ],
    });

    const result = await harness.service.run({ limit: 1, mode: "next-only" });

    expect(result.eventsWouldCreate).toBe(1);
    expect(result.eventsWouldSkip).toBe(0);
  });

  it("treats legacy drop-stab vesting rows as the canonical dropstab source", async () => {
    const harness = createHarness({
      sourceRows: [
        {
          sourceType: "dropstab",
          vestingDatasetKey:
            "dropstab:vesting_dataset:64b64c000000000000000001",
        },
        {
          sourceType: "drop-stab",
          vestingDatasetKey:
            "drop-stab:vesting_dataset:64b64c000000000000000001",
        },
      ],
    });

    const result = await harness.service.run({ limit: 1, mode: "next-only" });

    expect(result.eventsWouldCreate).toBe(1);
    expect(result.eventsWouldSkip).toBe(0);
    expect(result.skippedNoActiveVestingSource).toBe(0);
    expect(result.skippedSourceConflict).toBe(0);
  });

  it("infers active vesting source from existing vesting documents", async () => {
    const harness = createHarness({
      sourceRows: [
        {
          sourceType: "dropstab",
          vestingDatasetKey:
            "dropstab:vesting_dataset:64b64c000000000000000001",
        },
      ],
    });

    const result = await harness.service.run({ limit: 1, mode: "next-only" });

    expect(result.eventsWouldCreate).toBe(1);
    expect(result.skippedNoActiveVestingSource).toBe(0);
  });

  it("skips when existing vesting documents have multiple sourceTypes", async () => {
    const harness = createHarness({
      sourceRows: [
        {
          sourceType: "dropstab",
          vestingDatasetKey:
            "dropstab:vesting_dataset:64b64c000000000000000001",
        },
        {
          sourceType: "cryptorank",
          vestingDatasetKey:
            "cryptorank:vesting_dataset:64b64c000000000000000001",
        },
      ],
    });

    const result = await harness.service.run({ limit: 1, mode: "next-only" });

    expect(result.skippedNoActiveVestingSource).toBe(1);
    expect(result.eventsWouldSkip).toBe(1);
    expect(result.eventsWouldCreate).toBe(0);
  });

  it("skips input source that does not match existing vesting documents", async () => {
    const harness = createHarness({
      sourceRows: [
        {
          sourceType: "dropstab",
          vestingDatasetKey:
            "dropstab:vesting_dataset:64b64c000000000000000001",
        },
      ],
    });

    const guard = await (harness.service as any).checkActiveTokenomicsSource({
      canonicalProjectId,
      sourceType: "cryptorank",
      vestingDatasetKey: "cryptorank:vesting_dataset:64b64c000000000000000001",
    });

    expect(guard.allowed).toBe(false);
    expect(guard.skipCounter).toBe("skippedSourceConflict");
  });

  it("skips projects without active vesting source", async () => {
    const harness = createHarness({ sourceRows: [] });

    const result = await harness.service.run({ limit: 1, mode: "next-only" });

    expect(result.skippedNoActiveVestingSource).toBe(1);
    expect(result.eventsWouldSkip).toBe(1);
    expect(result.eventsWouldCreate).toBe(0);
  });

  it("allows dataset key mismatch when sourceType matches", async () => {
    const harness = createHarness({
      sourceRows: [
        {
          sourceType: "dropstab",
          vestingDatasetKey:
            "dropstab:vesting_dataset:64b64c00000000000000ffff",
        },
      ],
    });

    const result = await harness.service.run({ limit: 1, mode: "next-only" });

    expect(result.eventsWouldSkip).toBe(0);
    expect(result.eventsWouldCreate).toBe(1);
  });

  it("reports would-create in dry-run and does not write documents", async () => {
    const harness = createHarness({
      sourceRows: [
        {
          sourceType: "dropstab",
          vestingDatasetKey:
            "dropstab:vesting_dataset:64b64c000000000000000001",
        },
      ],
    });

    const result = await harness.service.run({ limit: 1, mode: "next-only" });

    expect(result.dryRun).toBe(true);
    expect(result.eventsCreated).toBe(0);
    expect(result.eventsWouldCreate).toBe(1);
    expect(harness.unlocksService.upsertUnlockEvent).not.toHaveBeenCalled();
  });

  it("reconciles a corrected provider event without creating a duplicate", async () => {
    const existingEvent = {
      _id: new Types.ObjectId(),
      canonicalProjectId,
      sourceType: "dropstab",
      sourceEventId:
        "dropstab:demo:unlock_event:provider:parent-event:round-a:12:seed_round:2026-01-10:cliff",
      canonicalFingerprint: "old-event-fingerprint",
      saleId: 12,
      normalizedRoundName: "seed_round",
      sourcePath: "unlockingEvents.0.rounds.0",
      metadata: {
        importer: "fomo-v2:unlock-events-import",
        sourceDocumentId: "parser-doc",
        sourceProviderIds: ["parent-event", "round-a"],
        sourceContainerProviderIds: ["parent-event"],
        sourceRoundProviderIds: ["round-a"],
        sourceOccurrenceProviderIds: [
          "event:parent-event:round:round-a",
        ],
      },
    };
    const harness = createHarness({
      reconciliationEvents: [existingEvent],
      upsertResult: { status: "updated", created: false, doc: existingEvent },
    });
    const incoming: any = {
      canonicalProjectId,
      sourceType: "dropstab",
      sourceEventId:
        "dropstab:demo:unlock_event:provider:parent-event:round-a:12:strategic_round:2026-02-10:linear",
      canonicalFingerprint: "new-event-fingerprint",
      unlockKey: "new-event-fingerprint",
      saleId: 12,
      unlockDate: new Date("2026-02-10T00:00:00.000Z"),
      roundName: "Strategic Round",
      normalizedRoundName: "strategic_round",
      unlockType: "linear",
      identityAliases: { sourceEventIds: [] },
      metadata: {
        importer: "fomo-v2:unlock-events-import",
        sourceDocumentId: "parser-doc",
        sourceProviderIds: ["parent-event", "round-a"],
        sourceContainerProviderIds: ["parent-event"],
        sourceRoundProviderIds: ["round-a"],
        sourceOccurrenceProviderIds: [
          "event:parent-event:round:round-a",
        ],
      },
    };
    const result = emptyResult();

    await (harness.service as any).processEvent(incoming, result, true);

    expect(result.eventsUpdated).toBe(1);
    expect(harness.unlocksService.upsertUnlockEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        identityAliases: {
          canonicalFingerprints: ["old-event-fingerprint"],
          sourceEventIds: [existingEvent.sourceEventId],
        },
      })
    );
  });

  it("writes real created counters in write mode", async () => {
    const harness = createHarness({
      sourceRows: [
        {
          sourceType: "dropstab",
          vestingDatasetKey:
            "dropstab:vesting_dataset:64b64c000000000000000001",
        },
      ],
    });

    const result = await harness.service.run({
      limit: 1,
      mode: "next-only",
      write: true,
    });

    expect(result.dryRun).toBe(false);
    expect(result.eventsCreated).toBe(1);
    expect(result.eventsWouldCreate).toBe(0);
    expect(harness.unlocksService.upsertUnlockEvent).toHaveBeenCalledTimes(1);
  });

  it("resolves vesting links only within sourceType", async () => {
    const harness = createHarness();
    const result = emptyResult();
    await (harness.service as any).resolveEventLinks(
      {
        canonicalProjectId,
        sourceType: "dropstab",
        vestingDatasetKey: "dropstab:vesting_dataset:64b64c000000000000000001",
        saleId: 12,
        roundName: "Seed",
        normalizedRoundName: "seed",
      },
      result
    );

    const roundLookup =
      harness.vestingService.findVestingRoundForSource.mock.calls[0][0];
    expect(roundLookup).toEqual(
      expect.objectContaining({ sourceType: "dropstab" })
    );
    expect(roundLookup).not.toHaveProperty("vestingDatasetKey");

    const allocationLookup = (
      harness.tokenAllocationModel.find.mock.calls[0] as any[]
    )[0];
    expect(allocationLookup).toEqual(
      expect.objectContaining({ sourceType: "dropstab" })
    );
    expect(allocationLookup).not.toHaveProperty("vestingDatasetKey");

    const scheduleLookup = (
      harness.vestingScheduleModel.find.mock.calls[0] as any[]
    )[0];
    expect(scheduleLookup).toEqual(
      expect.objectContaining({ sourceType: "dropstab" })
    );
    expect(scheduleLookup).not.toHaveProperty("vestingDatasetKey");
  });

  it("does not resolve links from another sourceType", async () => {
    const harness = createHarness({
      vestingRoundResult: null,
      tokenAllocationDocs: [],
      vestingScheduleDocs: [],
    });
    const result = emptyResult();
    const links = await (harness.service as any).resolveEventLinks(
      {
        canonicalProjectId,
        sourceType: "dropstab",
        vestingDatasetKey: "dropstab:vesting_dataset:64b64c000000000000000001",
        saleId: 12,
        roundName: "Seed",
        normalizedRoundName: "seed",
      },
      result
    );

    expect(links.vestingRoundId).toBeUndefined();
    expect(links.tokenAllocationId).toBeUndefined();
    expect(links.vestingScheduleId).toBeUndefined();
  });

  it("derives the same source identity when an event moves between parser paths", () => {
    const harness = createHarness();
    const identity = {
      sourceDocumentId: "parser-doc-1",
      sourceProjectId: "demo-1",
      sourceId: "demo-1",
      sourceSlug: "demo",
    };
    const round = {
      roundName: "Seed",
      saleId: 12,
      amount: 1000,
      percent: 1,
      unlockType: "CLIFF",
    };
    const common = {
      identity,
      canonicalProjectId,
      sourceType: "dropstab",
      mode: "all",
    };
    const fromNext = (harness.service as any).normalizeProjectUnlockEvents({
      ...common,
      sourceProject: {
        nextUnlockingEvent: {
          unlockDate: "2026-01-10T00:00:00.000Z",
          rounds: [round],
        },
      },
    }).events[0];
    const fromHistory = (harness.service as any).normalizeProjectUnlockEvents({
      ...common,
      sourceProject: {
        unlockingEvents: [
          {
            unlockDate: "2026-01-10T00:00:00.000Z",
            rounds: [round],
          },
        ],
      },
    }).events[0];

    expect(fromNext.sourceEventId).toBe(fromHistory.sourceEventId);
    expect(fromNext.sourceEventId).not.toContain("rounds.0");
    expect(fromNext.canonicalFingerprint).toBe(
      fromHistory.canonicalFingerprint
    );
    expect(fromNext.identityAliases.sourceEventIds[0]).toContain(
      "nextUnlockingEvent.rounds.0"
    );
    expect(fromHistory.identityAliases.sourceEventIds[0]).toContain(
      "unlockingEvents.0.rounds.0"
    );
    expect(fromNext.identityAliases.canonicalFingerprints).toEqual(
      fromHistory.identityAliases.canonicalFingerprints
    );
  });

  it("keeps multiple rounds under one provider parent event distinct", () => {
    const harness = createHarness();
    const normalized = (harness.service as any).normalizeProjectUnlockEvents({
      identity: {
        sourceDocumentId: "parser-doc-1",
        sourceProjectId: "demo-1",
        sourceId: "demo-1",
        sourceSlug: "demo",
      },
      canonicalProjectId,
      sourceType: "dropstab",
      mode: "provider-events",
      sourceProject: {
        unlockingEvents: [
          {
            id: "parent-event-100",
            unlockDate: "2026-01-10T00:00:00.000Z",
            rounds: [
              {
                id: "provider-round-a",
                roundName: "Seed",
                saleId: 12,
                unlockType: "CLIFF",
              },
              {
                id: "provider-round-b",
                roundName: "Private",
                saleId: 13,
                unlockType: "CLIFF",
              },
            ],
          },
        ],
      },
    });

    expect(normalized.events).toHaveLength(2);
    expect(normalized.events[0].sourceEventId).toContain("parent-event-100");
    expect(normalized.events[1].sourceEventId).toContain("parent-event-100");
    expect(normalized.events[0].sourceEventId).not.toBe(
      normalized.events[1].sourceEventId
    );
    expect(normalized.events[0].canonicalFingerprint).not.toBe(
      normalized.events[1].canonicalFingerprint
    );
    expect(normalized.events[0].identityAliases.canonicalFingerprints).toEqual(
      []
    );
    expect(normalized.events[1].identityAliases.canonicalFingerprints).toEqual(
      []
    );
    expect(
      normalized.events[0].metadata.sourceOccurrenceProviderIds
    ).toEqual(["event:parent-event-100:round:provider-round-a"]);
    expect(
      normalized.events[1].metadata.sourceOccurrenceProviderIds
    ).toEqual(["event:parent-event-100:round:provider-round-b"]);
  });

  it("does not reconcile a sibling round through the shared parent event ID", async () => {
    const sourceHarness = createHarness();
    const normalized = (sourceHarness.service as any).normalizeProjectUnlockEvents({
      identity: {
        sourceDocumentId: "parser-doc-1",
        sourceProjectId: "demo-1",
        sourceId: "demo-1",
        sourceSlug: "demo",
      },
      canonicalProjectId,
      sourceType: "dropstab",
      mode: "provider-events",
      sourceProject: {
        unlockingEvents: [
          {
            id: "parent-event-100",
            unlockDate: "2026-01-10T00:00:00.000Z",
            rounds: [
              { id: "provider-round-a", roundName: "Seed", saleId: 12 },
              {
                id: "provider-round-b",
                roundName: "Private",
                saleId: 13,
              },
            ],
          },
        ],
      },
    });
    const persistedFirst = {
      ...normalized.events[0],
      _id: new Types.ObjectId(),
    };
    const reconciliationHarness = createHarness({
      reconciliationEvents: [persistedFirst],
    });

    await expect(
      (reconciliationHarness.service as any).findExistingEvent(
        normalized.events[1]
      )
    ).resolves.toBeNull();
  });

  it("does not reuse a rolling source path for a different provider event", async () => {
    const existing = {
      _id: new Types.ObjectId(),
      canonicalProjectId,
      sourceType: "dropstab",
      sourceEventId: "dropstab:demo:unlock_event:provider:event-a",
      canonicalFingerprint: "event-a-fingerprint",
      sourcePath: "nextUnlockingEvent",
      unlockDate: new Date("2026-01-10T00:00:00.000Z"),
      normalizedRoundName: "seed",
      metadata: {
        importer: "fomo-v2:unlock-events-import",
        sourceDocumentId: "parser-doc",
        sourceProviderIds: ["event-a"],
        sourceContainerProviderIds: ["event-a"],
        sourceOccurrenceProviderIds: ["event:event-a"],
      },
    };
    const incoming: any = {
      canonicalProjectId,
      sourceType: "dropstab",
      sourceEventId: "dropstab:demo:unlock_event:provider:event-b",
      canonicalFingerprint: "event-b-fingerprint",
      sourcePath: "nextUnlockingEvent",
      unlockDate: new Date("2026-01-10T00:00:00.000Z"),
      normalizedRoundName: "seed",
      metadata: {
        importer: "fomo-v2:unlock-events-import",
        sourceDocumentId: "parser-doc",
        sourceProviderIds: ["event-b"],
        sourceContainerProviderIds: ["event-b"],
        sourceOccurrenceProviderIds: ["event:event-b"],
      },
    };
    const harness = createHarness({ reconciliationEvents: [existing] });

    await expect(
      (harness.service as any).findExistingEvent(incoming)
    ).resolves.toBeNull();
  });

  it("does not merge two dates that only share a round provider ID", () => {
    const harness = createHarness();
    const identity = {
      sourceDocumentId: "parser-doc-1",
      sourceProjectId: "demo-1",
      sourceId: "demo-1",
      sourceSlug: "demo",
    };
    const sourceProject = {
      unlockingEvents: [
        {
          unlockDate: "2026-01-10T00:00:00.000Z",
          rounds: [{ id: "round-1", roundName: "Seed", saleId: 12 }],
        },
        {
          unlockDate: "2026-02-10T00:00:00.000Z",
          rounds: [{ id: "round-1", roundName: "Seed", saleId: 12 }],
        },
      ],
    };

    const normalized = (harness.service as any).normalizeProjectUnlockEvents({
      identity,
      canonicalProjectId,
      sourceType: "dropstab",
      mode: "all",
      sourceProject,
    });

    expect(normalized.events).toHaveLength(2);
    expect(normalized.events[0].sourceEventId).not.toBe(
      normalized.events[1].sourceEventId
    );
    expect(normalized.events[0].canonicalFingerprint).not.toBe(
      normalized.events[1].canonicalFingerprint
    );
  });

  function createHarness(
    options: {
      vestingRoundResult?: any;
      tokenAllocationDocs?: any[];
      vestingScheduleDocs?: any[];
      sourceRows?: Array<{ sourceType?: string; vestingDatasetKey?: string }>;
      reconciliationEvents?: any[];
      upsertResult?: any;
    } = {}
  ) {
    const parserCollection = {
      find: jest.fn(() => cursor([sourceProject()])),
    };
    const parserConnection = {
      db: {
        collection: jest.fn(() => parserCollection),
      },
    };
    const unlockEventModel = {
      findOne: jest.fn(() => ({ lean: jest.fn().mockResolvedValue(null) })),
      find: jest.fn(() => findResult(options.reconciliationEvents || [])),
    };
    const tokenAllocationModel = {
      find: jest.fn(() =>
        findResult(
          options.tokenAllocationDocs === undefined
            ? [{ _id: new Types.ObjectId() }]
            : options.tokenAllocationDocs
        )
      ),
      aggregate: jest.fn(() => aggregateResult(options.sourceRows)),
    };
    const vestingRoundModel = {
      aggregate: jest.fn(() => aggregateResult(options.sourceRows)),
    };
    const vestingScheduleModel = {
      find: jest.fn(() =>
        findResult(
          options.vestingScheduleDocs === undefined
            ? [{ _id: new Types.ObjectId() }]
            : options.vestingScheduleDocs
        )
      ),
      aggregate: jest.fn(() => aggregateResult(options.sourceRows)),
    };
    const vestingSummaryModel = {
      aggregate: jest.fn(() => aggregateResult(options.sourceRows)),
    };
    const vestingLinkingService = {
      resolveProject: jest.fn().mockResolvedValue({ canonicalProjectId }),
      resolveMarketAsset: jest.fn().mockResolvedValue({ status: "missing" }),
    };
    const vestingService = {
      findVestingRoundForSource: jest
        .fn()
        .mockResolvedValue(
          options.vestingRoundResult === undefined
            ? { _id: new Types.ObjectId() }
            : options.vestingRoundResult
        ),
    };
    const unlocksService = {
      upsertUnlockEvent: jest
        .fn()
        .mockResolvedValue(
          options.upsertResult || { status: "created", created: true, doc: {} }
        ),
    };
    const service = new FomoV2UnlockEventsImportService(
      parserConnection as any,
      unlockEventModel as any,
      tokenAllocationModel as any,
      vestingRoundModel as any,
      vestingScheduleModel as any,
      vestingSummaryModel as any,
      vestingLinkingService as any,
      vestingService as any,
      unlocksService as any
    );
    return {
      service,
      unlockEventModel,
      tokenAllocationModel,
      vestingRoundModel,
      vestingScheduleModel,
      vestingSummaryModel,
      vestingService,
      unlocksService,
    };
  }

  function sourceProject() {
    return {
      _id: new Types.ObjectId("64b64c000000000000000002"),
      source: "dropstab",
      currencyId: 12,
      coinSlug: "demo",
      identity: { slug: "demo", name: "Demo" },
      nextUnlockingEvent: {
        unlockDate: "2026-01-10T00:00:00.000Z",
        status: "upcoming",
        rounds: [
          {
            roundName: "Seed",
            saleId: 12,
            amount: 1000,
            percent: 1,
            unlockType: "CLIFF",
          },
        ],
      },
    };
  }

  function cursor(docs: any[]) {
    return {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      async *[Symbol.asyncIterator]() {
        for (const doc of docs) yield doc;
      },
    };
  }

  function findResult(docs: any[]) {
    return {
      limit: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(docs),
      }),
    };
  }

  function aggregateResult(
    rows: Array<{ sourceType?: string; vestingDatasetKey?: string }> | undefined
  ) {
    const sourceRows =
      rows === undefined
        ? [
            {
              sourceType: "dropstab",
              vestingDatasetKey:
                "dropstab:vesting_dataset:64b64c000000000000000001",
            },
          ]
        : rows;
    return Promise.resolve(
      sourceRows.map((row) => ({
        _id: row.sourceType,
        count: 1,
      }))
    );
  }

  function emptyResult(): FomoV2UnlockEventsImportResult {
    return {
      mode: "dry-run",
      dryRun: true,
      sourceType: "dropstab",
      unlocksMode: "next-only",
      scannedProjects: 0,
      projectsWithCanonicalId: 0,
      skippedNoCanonicalProject: 0,
      skippedInactiveSource: 0,
      skippedSourceConflict: 0,
      skippedNoActiveVestingSource: 0,
      sourceEventsFound: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsUnchanged: 0,
      eventsSkipped: 0,
      eventsWouldCreate: 0,
      eventsWouldUpdate: 0,
      eventsWouldRemainUnchanged: 0,
      eventsWouldSkip: 0,
      resolveWarnings: 0,
      errors: [],
      warnings: [],
    };
  }
});
