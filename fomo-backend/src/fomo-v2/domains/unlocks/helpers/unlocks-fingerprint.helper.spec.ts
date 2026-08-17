import { Types } from "mongoose";
import {
  buildUnlockEventContentHash,
  buildUnlockEventFingerprint,
} from "./unlocks-fingerprint.helper";

describe("unlocks fingerprint helpers", () => {
  const canonicalProjectId = new Types.ObjectId(
    "64b64c000000000000000001"
  );

  it("builds the same fingerprint for the same canonical event across source paths", () => {
    const base = {
      canonicalProjectId,
      vestingDatasetKey: "dropstab:vesting_dataset:64b64c000000000000000001",
      sourceType: "dropstab",
      saleId: 12,
      unlockType: "cliff",
    };

    expect(
      buildUnlockEventFingerprint({
        ...base,
        unlockDate: "2026-01-10T00:00:00.000Z",
        roundName: "Seed Round",
      })
    ).toBe(
      buildUnlockEventFingerprint({
        ...base,
        unlockDate: "2026-01-10T18:30:00.000Z",
        normalizedRoundName: "seed_round",
      })
    );
  });

  it("changes the fingerprint when identity fields change", () => {
    const base = {
      canonicalProjectId,
      vestingDatasetKey: "dropstab:vesting_dataset:64b64c000000000000000001",
      sourceType: "dropstab",
      unlockDate: "2026-01-10",
      roundName: "Seed Round",
      normalizedRoundName: "seed_round",
      unlockType: "cliff",
    };

    expect(buildUnlockEventFingerprint({ ...base, saleId: 12 })).not.toBe(
      buildUnlockEventFingerprint({ ...base, saleId: 13 })
    );
  });

  it("includes sourceType in the canonical fingerprint", () => {
    const base = {
      canonicalProjectId,
      vestingDatasetKey: "vesting_dataset:64b64c000000000000000001",
      saleId: 12,
      unlockDate: "2026-01-10",
      normalizedRoundName: "seed_round",
      unlockType: "cliff",
    };

    expect(
      buildUnlockEventFingerprint({ ...base, sourceType: "dropstab" })
    ).not.toBe(
      buildUnlockEventFingerprint({ ...base, sourceType: "cryptorank" })
    );
  });

  it("includes a stable sourceEventId in the source-scoped fingerprint", () => {
    const base = {
      canonicalProjectId,
      sourceType: "dropstab",
      saleId: 12,
      unlockDate: "2026-01-10",
      normalizedRoundName: "seed_round",
      unlockType: "cliff",
    };

    expect(
      buildUnlockEventFingerprint({ ...base, sourceEventId: "event-100" })
    ).not.toBe(
      buildUnlockEventFingerprint({ ...base, sourceEventId: "event-101" })
    );
  });

  it("canonicalizes source aliases without merging different providers", () => {
    const base = {
      canonicalProjectId,
      unlockDate: "2026-01-10",
      normalizedRoundName: "seed_round",
      unlockType: "cliff",
    };
    expect(
      buildUnlockEventFingerprint({ ...base, sourceType: "drop-stab" })
    ).toBe(buildUnlockEventFingerprint({ ...base, sourceType: "dropstab" }));
    expect(
      buildUnlockEventFingerprint({ ...base, sourceType: "dropstab" })
    ).not.toBe(
      buildUnlockEventFingerprint({ ...base, sourceType: "icodrops" })
    );
  });

  it("ignores vestingDatasetKey in the canonical fingerprint", () => {
    const base = {
      canonicalProjectId,
      sourceType: "dropstab",
      saleId: 12,
      unlockDate: "2026-01-10",
      normalizedRoundName: "seed_round",
      unlockType: "cliff",
    };

    expect(
      buildUnlockEventFingerprint({
        ...base,
        vestingDatasetKey: "dropstab:vesting_dataset:64b64c000000000000000001",
      } as any)
    ).toBe(
      buildUnlockEventFingerprint({
        ...base,
        vestingDatasetKey: "dropstab:vesting_dataset:64b64c00000000000000ffff",
      } as any)
    );
  });

  it("changes content hash for mutable source values and ignores import bookkeeping", () => {
    const base = {
      amount: 1000,
      percentOfSupply: 1.5,
      roundName: "Seed Round",
      normalizedRoundName: "seed_round",
      sourceValueUsd: 250000,
      sourceMarketCapSharePercent: 0.2,
      sourceRefs: [
        {
          source: "dropstab",
          sourceId: "12",
          sourcePath: "nextUnlockingEvent",
          observedAt: new Date("2026-01-01T00:00:00.000Z"),
        },
      ],
      metadata: {
        sourceValues: { status: "upcoming" },
        importedAt: "2026-01-01T00:00:00.000Z",
        eventOrigins: ["provider_next_unlocking_event"],
      },
    };

    expect(buildUnlockEventContentHash(base)).toBe(
      buildUnlockEventContentHash({
        ...base,
        sourceRefs: [
          {
            ...base.sourceRefs[0],
            observedAt: new Date("2026-01-02T00:00:00.000Z"),
          },
        ],
        metadata: {
          ...base.metadata,
          importedAt: "2026-01-02T00:00:00.000Z",
          eventOrigins: ["provider_unlocking_events"],
        },
      })
    );
    expect(buildUnlockEventContentHash(base)).not.toBe(
      buildUnlockEventContentHash({ ...base, amount: 2000 })
    );
  });

  it("changes content hash for source, status, and resolved relation changes", () => {
    const relationA = new Types.ObjectId("64b64c000000000000000010");
    const relationB = new Types.ObjectId("64b64c000000000000000011");
    const base = {
      sourceType: "dropstab",
      sourceEventId: "dropstab:example:event-1",
      statusSource: "upcoming",
      unlockType: "cliff",
      unlockTypes: ["linear", "cliff"],
      isTgeUnlock: false,
      vestingRoundId: relationA,
      amount: 1000,
    };

    expect(buildUnlockEventContentHash(base)).not.toBe(
      buildUnlockEventContentHash({ ...base, sourceType: "icodrops" })
    );
    expect(buildUnlockEventContentHash(base)).not.toBe(
      buildUnlockEventContentHash({ ...base, statusSource: "past" })
    );
    expect(buildUnlockEventContentHash(base)).not.toBe(
      buildUnlockEventContentHash({ ...base, vestingRoundId: relationB })
    );
    expect(buildUnlockEventContentHash(base)).toBe(
      buildUnlockEventContentHash({
        ...base,
        unlockTypes: ["cliff", "linear", "cliff"],
      })
    );
  });
});
