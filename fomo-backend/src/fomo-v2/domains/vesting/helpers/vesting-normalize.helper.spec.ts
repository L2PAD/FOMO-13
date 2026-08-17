import {
  hasNonEmptyVestingSummary,
  hasVestingImportData,
  normalizeVestingSourceRef,
} from "./vesting-normalize.helper";
import { buildVestingRoundFingerprint } from "./vesting-fingerprint.helper";
import { Types } from "mongoose";

describe("vesting normalize helpers", () => {
  it("treats empty vesting summaries as empty", () => {
    expect(hasNonEmptyVestingSummary(undefined)).toBe(false);
    expect(hasNonEmptyVestingSummary({})).toBe(false);
    expect(
      hasNonEmptyVestingSummary({
        totalAmount: null,
        unlockedAmount: undefined,
        lockedPercent: Number.NaN,
        lastUnlockDate: "",
      })
    ).toBe(false);
  });

  it("detects meaningful vesting summary fields", () => {
    expect(hasNonEmptyVestingSummary({ unlockedPercent: 0 })).toBe(true);
    expect(hasNonEmptyVestingSummary({ nextUnlockDate: "2026-01-01" })).toBe(
      true
    );
  });

  it("keeps empty-summary-only documents ineligible", () => {
    expect(
      hasVestingImportData({
        vestingSummary: {
          totalAmount: null,
          unlockedPercent: null,
          lastUnlockDate: null,
        },
      })
    ).toBe(false);
  });

  it("accepts documents with token allocations or unlocking events", () => {
    expect(hasVestingImportData({ tokenAllocation: [{ name: "Team" }] })).toBe(
      true
    );
    expect(
      hasVestingImportData({ unlockingEvents: [{ unlockDate: "2026-01-01" }] })
    ).toBe(true);
  });

  it("canonicalizes provider aliases in refs and fingerprints", () => {
    expect(normalizeVestingSourceRef({ source: "Drop-Stab" })?.source).toBe(
      "dropstab"
    );
    const canonicalProjectId = new Types.ObjectId(
      "64b64c000000000000000001"
    );
    expect(
      buildVestingRoundFingerprint({
        canonicalProjectId,
        sourceType: "drop-stab",
        saleId: 1,
        roundName: "Seed",
      })
    ).toBe(
      buildVestingRoundFingerprint({
        canonicalProjectId,
        sourceType: "dropstab",
        saleId: 1,
        roundName: "Seed",
      })
    );
  });
});
