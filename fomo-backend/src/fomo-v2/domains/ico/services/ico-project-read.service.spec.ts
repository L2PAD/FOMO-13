import { Types } from "mongoose";
import { FomoV2IcoProjectReadService } from "./ico-project-read.service";

describe("FomoV2IcoProjectReadService funding projection", () => {
  const service = new FomoV2IcoProjectReadService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any
  );
  const canonicalProjectId = new Types.ObjectId(
    "64b000000000000000000031"
  );
  const context = {
    rows: [],
    canonicalById: new Map([
      [canonicalProjectId.toHexString(), { _id: canonicalProjectId }],
    ]),
    marketByCanonicalId: new Map(),
  };

  function projectRow(fundingAggregate: any) {
    return {
      _id: new Types.ObjectId("64b000000000000000000032"),
      canonicalProjectId,
      sourceType: "icodrops",
      name: "Source-aware project",
      symbol: "SAP",
      slug: "source-aware-project",
      categories: ["Infrastructure"],
      metadata: {
        icodropsProfileOnly: {
          fundraising: {
            totalRaised: 1_000,
            rounds: [
              {
                type: "Legacy",
                raisedAmount: 1_000,
                investors: [{ name: "Legacy investor" }],
              },
            ],
          },
        },
        fundingAggregate,
      },
    };
  }

  it("prefers the materialized funding aggregate and preserves source identity", () => {
    const fundingAggregate = {
      hasData: true,
      totalRaised: 3_000_000,
      lastFunding: new Date("2025-01-01T00:00:00.000Z"),
      sourceTypes: ["dropstab", "icodrops"],
      selectedSource: "icodrops",
      bySource: {
        dropstab: { source: "dropstab", roundCount: 1 },
        icodrops: { source: "icodrops", roundCount: 1 },
      },
      investors: [{ name: "Materialized investor" }],
      rounds: [
        {
          fundingRoundId: "64b000000000000000000034",
          roundName: "Private",
          type: "private",
          raisedAmount: 3_000_000,
          fundingDate: new Date("2025-01-01T00:00:00.000Z"),
          sourceType: "icodrops",
          primarySource: "icodrops",
          sourceId: "ico-round",
        },
      ],
    };

    const result = (service as any).toLegacyProjectShape(
      projectRow(fundingAggregate),
      context,
      "test"
    );

    expect(result.totalRaised).toBe(3_000_000);
    expect(result.lastFunding).toBe("2025-01-01T00:00:00.000Z");
    expect(result.investors).toEqual([
      expect.objectContaining({ name: "Materialized investor" }),
    ]);
    expect(result.fundingSources).toEqual(["dropstab", "icodrops"]);
    expect(result.fundingSelectedSource).toBe("icodrops");
    expect(result.fundingBySource).toEqual(fundingAggregate.bySource);
    expect(result.fundraising).toEqual([
      expect.objectContaining({
        fundingRoundId: "64b000000000000000000034",
        sourceType: "icodrops",
        primarySource: "icodrops",
        sourceId: "ico-round",
      }),
    ]);
  });

  it("falls back to the native ICODrops profile when no domain funding exists", () => {
    const result = (service as any).toLegacyProjectShape(
      projectRow({ hasData: false, rounds: [], investors: [] }),
      context,
      "test"
    );

    expect(result.totalRaised).toBe(1_000);
    expect(result.fundraising[0]).toEqual(
      expect.objectContaining({ type: "Legacy", raisedAmount: 1_000 })
    );
    expect(result.investors[0]).toEqual(
      expect.objectContaining({ name: "Legacy investor" })
    );
    expect(result.fundingSources).toBeUndefined();
  });
});
