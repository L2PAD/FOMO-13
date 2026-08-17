import { Types } from "mongoose";
import { FomoV2UnlocksService } from "./unlocks.service";

function leanResult(value: any) {
  return {
    session: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(value),
  };
}

describe("FomoV2UnlocksService", () => {
  const canonicalProjectId = new Types.ObjectId("64b64c000000000000000001");

  it("creates an unlock event with a status result", async () => {
    const createdDoc = { _id: new Types.ObjectId() };
    const model = {
      findOne: jest.fn().mockReturnValue(leanResult(null)),
      create: jest.fn().mockResolvedValue(createdDoc),
    };
    const service = new FomoV2UnlocksService(model as any);

    const result = await service.upsertUnlockEvent({
      canonicalProjectId,
      sourceType: "drop-stab" as any,
      unlockDate: "2026-01-10",
      roundName: "Seed Round",
      saleId: 12,
      unlockType: "cliff",
      eventOrigin: "provider_next_unlocking_event",
      contentHash: "hash-a",
      sourceRefs: [{ source: "ICO-Drops" as any, sourceId: "provider-event" }],
    });

    expect(result.status).toBe("created");
    expect(result.created).toBe(true);
    expect(model.create).toHaveBeenCalledWith(
      expect.objectContaining({
        canonicalProjectId,
        sourceType: "dropstab",
        sourceRefs: expect.arrayContaining([
          expect.objectContaining({ source: "dropstab" }),
          expect.objectContaining({ source: "icodrops" }),
        ]),
        eventOrigin: "provider_next_unlocking_event",
        eventOrigins: ["provider_next_unlocking_event"],
        contentHash: "hash-a",
      })
    );
  });

  it("keeps every fallback identity lookup scoped to sourceType", async () => {
    const model = {
      findOne: jest.fn().mockReturnValue(leanResult(null)),
      create: jest.fn().mockResolvedValue({ _id: new Types.ObjectId() }),
    };
    const service = new FomoV2UnlocksService(model as any);

    await service.upsertUnlockEvent({
      canonicalProjectId,
      sourceType: "dropstab" as any,
      sourceEventId: "dropstab:example:event-1",
      unlockKey: "legacy-unlock-key",
      vestingRoundId: new Types.ObjectId(),
      unlockDate: "2026-01-10",
      roundName: "Seed Round",
      saleId: 12,
      unlockType: "cliff",
    });

    const filter = model.findOne.mock.calls[0][0];
    expect(filter.$or).toEqual(expect.any(Array));
    for (const candidate of filter.$or) {
      if (candidate.canonicalFingerprint) continue;
      expect(candidate.sourceType).toBeInstanceOf(RegExp);
      expect(candidate.sourceType.test("dropstab")).toBe(true);
      expect(candidate.sourceType.test("drop-stab")).toBe(true);
      expect(candidate.sourceType.test("icodrops")).toBe(false);
    }
  });

  it("does not weak-match another provider event id on the same date/type", () => {
    const service = new FomoV2UnlocksService({} as any);
    const common = {
      canonicalProjectId,
      sourceType: "dropstab" as any,
      unlockDate: "2026-01-10",
      roundName: "Seed Round",
      normalizedRoundName: "seed_round",
      unlockType: "cliff",
    };
    const first = (service as any).buildUnlockEventPayload({
      ...common,
      sourceEventId: "provider-event-a",
      saleId: "shared-provider-round",
    });
    const second = (service as any).buildUnlockEventPayload({
      ...common,
      sourceEventId: "provider-event-b",
      saleId: "shared-provider-round",
    });
    const filter = (service as any).unlockEventFilter(second);

    expect(first.canonicalFingerprint).not.toBe(second.canonicalFingerprint);
    expect(filter.$or).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceType: expect.any(RegExp),
          sourceEventId: "provider-event-b",
          saleId: "shared-provider-round",
          unlockDate: new Date("2026-01-10T00:00:00.000Z"),
          normalizedRoundName: "seed_round",
          unlockType: "cliff",
        }),
      ])
    );
    const weakNameMatch = filter.$or.find(
      (candidate: any) =>
        candidate.normalizedRoundName === "seed_round" &&
        !candidate.sourceEventId
    );
    expect(weakNameMatch.$and).toEqual([
      {
        $or: [
          { sourceEventId: { $exists: false } },
          { sourceEventId: null },
          { sourceEventId: "" },
        ],
      },
      {
        $or: [{ saleId: { $exists: false } }, { saleId: null }, { saleId: "" }],
      },
    ]);
    const saleMatchWithoutEventId = filter.$or.find(
      (candidate: any) =>
        candidate.saleId === "shared-provider-round" && !candidate.sourceEventId
    );
    expect(saleMatchWithoutEventId.$and).toEqual([
      {
        $or: [
          { sourceEventId: { $exists: false } },
          { sourceEventId: null },
          { sourceEventId: "" },
        ],
      },
    ]);
  });

  it("includes the provider round discriminator when a parent event id is shared", () => {
    const service = new FomoV2UnlocksService({} as any);
    const common = {
      canonicalProjectId,
      sourceType: "dropstab" as any,
      sourceEventId: "shared-parent-event",
      unlockDate: "2026-01-10",
      roundName: "Seed Round",
      normalizedRoundName: "seed_round",
      unlockType: "cliff",
    };
    const first = (service as any).buildUnlockEventPayload({
      ...common,
      saleId: "provider-round-a",
    });
    const second = (service as any).buildUnlockEventPayload({
      ...common,
      saleId: "provider-round-b",
    });
    const filter = (service as any).unlockEventFilter(second);

    expect(first.canonicalFingerprint).not.toBe(second.canonicalFingerprint);
    const sourceEventMatches = filter.$or.filter(
      (candidate: any) => candidate.sourceEventId === "shared-parent-event"
    );
    expect(sourceEventMatches).toHaveLength(1);
    expect(sourceEventMatches[0]).toEqual(
      expect.objectContaining({
        saleId: "provider-round-b",
        unlockDate: new Date("2026-01-10T00:00:00.000Z"),
        normalizedRoundName: "seed_round",
      })
    );
  });

  it("updates an exact path-derived legacy sourceEventId instead of creating a duplicate", async () => {
    const existingId = new Types.ObjectId();
    const legacySourceEventId =
      "demo:parent-event:unlockingEvents.0.rounds.0:12:seed_round:2026-01-10:CLIFF";
    const model = {
      findOne: jest.fn().mockReturnValue(
        leanResult({
          _id: existingId,
          sourceType: "dropstab",
          sourceEventId: legacySourceEventId,
          contentHash: "legacy-content-hash",
          eventOrigins: [],
        })
      ),
      findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: existingId }),
      create: jest.fn(),
    };
    const service = new FomoV2UnlocksService(model as any);

    const result = await service.upsertUnlockEvent({
      canonicalProjectId,
      sourceType: "dropstab" as any,
      sourceEventId:
        "dropstab:demo:unlock_event:provider:parent-event:12:seed_round:2026-01-10:cliff",
      saleId: 12,
      unlockDate: "2026-01-10",
      roundName: "Seed Round",
      normalizedRoundName: "seed_round",
      unlockType: "CLIFF",
      amount: 1000,
      identityAliases: {
        sourceEventIds: [legacySourceEventId],
      },
    });

    const filter = model.findOne.mock.calls[0][0];
    expect(filter.$or).toEqual(
      expect.arrayContaining([
        {
          canonicalProjectId,
          sourceType: expect.any(RegExp),
          sourceEventId: { $in: [legacySourceEventId] },
          unlockDate: new Date("2026-01-10T00:00:00.000Z"),
        },
      ])
    );
    expect(result.status).toBe("updated");
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      existingId,
      expect.objectContaining({
        $set: expect.objectContaining({
          sourceEventId: expect.stringContaining("dropstab:demo:unlock_event"),
        }),
      }),
      { new: true, setDefaultsOnInsert: true }
    );
    expect(model.create).not.toHaveBeenCalled();
  });

  it("reconciles and canonicalizes a legacy drop-stab source row", async () => {
    const existingId = new Types.ObjectId();
    const legacyFingerprint = "legacy-drop-stab-fingerprint";
    const model = {
      findOne: jest.fn().mockReturnValue(
        leanResult({
          _id: existingId,
          sourceType: "drop-stab",
          canonicalFingerprint: legacyFingerprint,
          contentHash: "legacy-content-hash",
          eventOrigins: [],
        })
      ),
      findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: existingId }),
      create: jest.fn(),
    };
    const service = new FomoV2UnlocksService(model as any);

    const result = await service.upsertUnlockEvent({
      canonicalProjectId,
      sourceType: "dropstab" as any,
      sourceEventId: "event-1",
      unlockDate: "2026-01-10",
      roundName: "Seed",
      unlockType: "cliff",
      identityAliases: { canonicalFingerprints: [legacyFingerprint] },
    });

    const aliasFilter = model.findOne.mock.calls[0][0].$or.find(
      (candidate: any) => candidate.canonicalFingerprint?.$in
    );
    expect(aliasFilter.sourceType).toBeInstanceOf(RegExp);
    expect(aliasFilter.sourceType.test("drop-stab")).toBe(true);
    expect(aliasFilter.sourceType.test("icodrops")).toBe(false);
    expect(result.status).toBe("updated");
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      existingId,
      expect.objectContaining({
        $set: expect.objectContaining({ sourceType: "dropstab" }),
      }),
      { new: true, setDefaultsOnInsert: true }
    );
    expect(model.create).not.toHaveBeenCalled();
  });

  it("merges origins and reports unchanged when content hash is stable", async () => {
    const existingId = new Types.ObjectId();
    const model = {
      findOne: jest.fn().mockReturnValue(
        leanResult({
          _id: existingId,
          sourceType: "dropstab",
          contentHash: "hash-a",
          eventOrigins: ["provider_unlocking_events"],
        })
      ),
      findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: existingId }),
    };
    const service = new FomoV2UnlocksService(model as any);

    const result = await service.upsertUnlockEvent({
      canonicalProjectId,
      sourceType: "dropstab" as any,
      unlockDate: "2026-01-10",
      roundName: "Seed Round",
      saleId: 12,
      unlockType: "cliff",
      eventOrigin: "provider_next_unlocking_event",
      contentHash: "hash-a",
    });

    expect(result.status).toBe("unchanged");
    expect(result.created).toBe(false);
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      existingId,
      {
        $set: expect.objectContaining({
          eventOrigins: [
            "provider_unlocking_events",
            "provider_next_unlocking_event",
          ],
        }),
      },
      { new: true, setDefaultsOnInsert: true }
    );
  });

  it("uses one session for the lookup and insert", async () => {
    const session = { id: "vesting-review-session" } as any;
    const createdDoc = { _id: new Types.ObjectId() };
    const findQuery = leanResult(null);
    const model = {
      findOne: jest.fn().mockReturnValue(findQuery),
      create: jest.fn().mockResolvedValue([createdDoc]),
    };
    const service = new FomoV2UnlocksService(model as any);

    const result = await service.upsertUnlockEvent(
      {
        canonicalProjectId,
        sourceType: "dropstab" as any,
        unlockDate: "2026-01-10",
        roundName: "Seed Round",
        saleId: 12,
        unlockType: "cliff",
        contentHash: "hash-a",
      },
      session
    );

    expect(findQuery.session).toHaveBeenCalledWith(session);
    expect(model.create).toHaveBeenCalledWith(
      [expect.objectContaining({ canonicalProjectId, contentHash: "hash-a" })],
      { session }
    );
    expect(result.doc).toBe(createdDoc);
  });

  it("uses one session for the lookup and update", async () => {
    const session = { id: "vesting-review-session" } as any;
    const existingId = new Types.ObjectId();
    const findQuery = leanResult({
      _id: existingId,
      contentHash: "hash-a",
      eventOrigins: [],
    });
    const model = {
      findOne: jest.fn().mockReturnValue(findQuery),
      findByIdAndUpdate: jest.fn().mockResolvedValue({ _id: existingId }),
    };
    const service = new FomoV2UnlocksService(model as any);

    await service.upsertUnlockEvent(
      {
        canonicalProjectId,
        sourceType: "dropstab" as any,
        unlockDate: "2026-01-10",
        roundName: "Seed Round",
        saleId: 12,
        unlockType: "cliff",
        contentHash: "hash-b",
      },
      session
    );

    expect(findQuery.session).toHaveBeenCalledWith(session);
    expect(model.findByIdAndUpdate).toHaveBeenCalledWith(
      existingId,
      expect.any(Object),
      { new: true, setDefaultsOnInsert: true, session }
    );
  });
});
