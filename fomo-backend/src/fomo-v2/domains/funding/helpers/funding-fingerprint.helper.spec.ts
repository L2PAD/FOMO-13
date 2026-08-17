import { Types } from "mongoose";
import { buildFundingRoundFingerprint } from "./funding-fingerprint.helper";

describe("funding fingerprint helpers", () => {
  const canonicalProjectId = new Types.ObjectId(
    "64b64c000000000000000001"
  );

  it("scopes otherwise identical funding rounds by source", () => {
    const base = {
      canonicalProjectId,
      roundName: "Seed",
      normalizedRoundType: "seed",
      announcedDate: "2025-01-01",
      raisedAmount: 1_000_000,
      sourceId: "round-1",
    };

    expect(
      buildFundingRoundFingerprint({ ...base, primarySource: "dropstab" })
    ).not.toBe(
      buildFundingRoundFingerprint({ ...base, primarySource: "icodrops" })
    );
  });

  it("normalizes source casing while preserving stable source ids", () => {
    const base = {
      canonicalProjectId,
      roundName: "Seed",
      announcedDate: "2025-01-01",
      primarySource: "ICODROPS",
    };

    expect(
      buildFundingRoundFingerprint({ ...base, sourceId: "round-1" })
    ).toBe(
      buildFundingRoundFingerprint({
        ...base,
        primarySource: "icodrops",
        sourceId: "round-1",
      })
    );
    expect(
      buildFundingRoundFingerprint({ ...base, sourceId: "round-1" })
    ).not.toBe(
      buildFundingRoundFingerprint({ ...base, sourceId: "round-2" })
    );
  });
});
