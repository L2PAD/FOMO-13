import { Types } from "mongoose";
import { FomoV2FundingFeedReadModelService } from "./funding-feed-read-model.service";

const model = () => ({} as any);

describe("FomoV2FundingFeedReadModelService", () => {
  const service = new FomoV2FundingFeedReadModelService(
    model(),
    model(),
    model(),
    model(),
    model(),
    model(),
    model(),
    model()
  );

  const fundingRoundId = new Types.ObjectId("64b000000000000000000010");
  const canonicalProjectId = new Types.ObjectId("64b000000000000000000011");
  const marketAssetId = new Types.ObjectId("64b000000000000000000012");

  const context = {
    marketByProjectId: new Map([
      [
        canonicalProjectId.toHexString(),
        {
          canonicalProjectId,
          marketAssetId,
          name: "Market Project",
          symbol: "MKT",
          slug: "market-project",
          logo: "market.png",
          category: "DeFi",
          providerIds: { coingeckoId: "market-project-id" },
          fomoScore: 87,
          redFlags: 2,
          contracts: [{ chain: "Ethereum", network: "Mainnet" }],
        },
      ],
    ]),
    icoByProjectAndSource: new Map(),
    canonicalById: new Map([
      [
        canonicalProjectId.toHexString(),
        {
          _id: canonicalProjectId,
          name: "Canonical Project",
          slug: "canonical-project",
          metadata: { category: "Infra" },
        },
      ],
    ]),
    participantsByRoundId: new Map(),
    backerReadByBackerId: new Map(),
    backerSourceById: new Map(),
  };

  it("uses announcedDate before date and never falls back to createdAt", () => {
    const row = service.buildReadModelRow(
      {
        _id: fundingRoundId,
        canonicalProjectId,
        announcedDate: new Date("2024-05-10T00:00:00.000Z"),
        date: new Date("2023-05-10T00:00:00.000Z"),
        createdAt: new Date("2022-05-10T00:00:00.000Z"),
        status: "confirmed",
      },
      context as any
    );

    expect(row.fundingDate.toISOString()).toBe("2024-05-10T00:00:00.000Z");
    expect(row.dateSource).toBe("announcedDate");

    const withoutAnnouncedDate = service.buildReadModelRow(
      {
        _id: fundingRoundId,
        canonicalProjectId,
        date: new Date("2023-05-10T00:00:00.000Z"),
        createdAt: new Date("2022-05-10T00:00:00.000Z"),
        status: "confirmed",
      },
      context as any
    );

    expect(withoutAnnouncedDate.fundingDate.toISOString()).toBe(
      "2023-05-10T00:00:00.000Z"
    );
    expect(withoutAnnouncedDate.dateSource).toBe("date");

    const withoutRoundDates = service.buildReadModelRow(
      {
        _id: fundingRoundId,
        canonicalProjectId,
        createdAt: new Date("2022-05-10T00:00:00.000Z"),
        status: "confirmed",
      },
      context as any
    );

    expect(withoutRoundDates.fundingDate).toBeUndefined();
    expect(withoutRoundDates.dateSource).toBe("none");
  });

  it("does not materialize sourceSlug as project identity fallback", () => {
    const row = service.buildReadModelRow(
      {
        _id: fundingRoundId,
        canonicalProjectId,
        sourceSlug: "source-only-slug",
        status: "confirmed",
      },
      {
        marketByProjectId: new Map(),
        icoByProjectAndSource: new Map(),
        canonicalById: new Map(),
        participantsByRoundId: new Map(),
        backerReadByBackerId: new Map(),
        backerSourceById: new Map(),
      } as any
    );

    expect(row.projectName).toBeUndefined();
    expect(row.projectSlug).toBeUndefined();
    expect(row.projectRouteId).toBeUndefined();
    expect(row.sourceSlug).toBe("source-only-slug");
  });

  it("uses ICO enrichment only when the round source matches exactly", () => {
    const icoProfile = {
      canonicalProjectId,
      sourceType: "icodrops",
      name: "ICODrops Profile",
      symbol: "ICO",
    };
    const sourceContext = {
      marketByProjectId: new Map(),
      icoByProjectAndSource: new Map([
        [`${canonicalProjectId.toHexString()}:icodrops`, icoProfile],
      ]),
      canonicalById: new Map(),
      participantsByRoundId: new Map(),
      backerReadByBackerId: new Map(),
      backerSourceById: new Map(),
    };

    const icodropsRow = service.buildReadModelRow(
      {
        _id: fundingRoundId,
        canonicalProjectId,
        sourceType: "ICO-Drops",
        status: "confirmed",
      },
      sourceContext as any
    );
    const dropstabRow = service.buildReadModelRow(
      {
        _id: new Types.ObjectId("64b000000000000000000013"),
        canonicalProjectId,
        sourceType: "dropstab",
        status: "confirmed",
      },
      sourceContext as any
    );

    expect(icodropsRow.projectName).toBe("ICODrops Profile");
    expect(icodropsRow.projectSymbol).toBe("ICO");
    expect(dropstabRow.projectName).toBeUndefined();
    expect(dropstabRow.projectSymbol).toBeUndefined();
  });

  it("refuses write mode when duplicate read-model rows already exist", async () => {
    const serviceWithMocks = new FomoV2FundingFeedReadModelService(
      {
        aggregate: jest.fn(),
      } as any,
      {
        find: jest.fn(() => ({
          sort: jest.fn(() => ({
            skip: jest.fn(() => ({
              limit: jest.fn(() => ({
                lean: jest.fn(() => ({
                  exec: jest.fn().mockResolvedValue([]),
                })),
              })),
            })),
          })),
        })),
      } as any,
      model(),
      model(),
      model(),
      model(),
      model(),
      model()
    );
    jest.spyOn(serviceWithMocks, "findDuplicateReadModels").mockResolvedValue([
      {
        fundingRoundId: fundingRoundId.toHexString(),
        count: 2,
        ids: ["a", "b"],
      },
    ]);

    await expect(
      serviceWithMocks.materialize({ write: true, confirmWrite: true })
    ).rejects.toThrow(/duplicate read-model rows/i);
  });

  describe("materialize", () => {
    function createFeedHarness(rounds: any[] = []) {
      const query: any = {};
      query.sort = jest.fn(() => query);
      query.skip = jest.fn(() => query);
      query.limit = jest.fn(() => query);
      query.lean = jest.fn(() => query);
      query.exec = jest.fn().mockResolvedValue(rounds);
      const readModel = {
        bulkWrite: jest
          .fn()
          .mockResolvedValue({ modifiedCount: 1, upsertedCount: 0 }),
      };
      const serviceWithMocks = new FomoV2FundingFeedReadModelService(
        readModel as any,
        { find: jest.fn(() => query) } as any,
        model(),
        model(),
        model(),
        model(),
        model(),
        model()
      );
      jest
        .spyOn(serviceWithMocks, "findDuplicateReadModels")
        .mockResolvedValue([]);
      jest
        .spyOn(serviceWithMocks as any, "loadMaterializeContext")
        .mockResolvedValue(context);

      return { serviceWithMocks, readModel, query };
    }

    it("reports the duplicate blocker in dry-run and uses stable _id paging", async () => {
      const { serviceWithMocks, readModel, query } = createFeedHarness();
      const duplicates = [
        {
          fundingRoundId: fundingRoundId.toHexString(),
          count: 2,
          ids: ["a", "b"],
        },
      ];
      jest
        .spyOn(serviceWithMocks, "findDuplicateReadModels")
        .mockResolvedValue(duplicates);

      const result = await serviceWithMocks.materialize({ write: false });

      expect(result.duplicateReadModels).toEqual(duplicates);
      expect(query.sort).toHaveBeenCalledWith({ _id: 1 });
      expect(readModel.bulkWrite).not.toHaveBeenCalled();
    });

    it("unsets optional fields omitted by a newer source row", async () => {
      const { serviceWithMocks, readModel } = createFeedHarness([
        {
          _id: fundingRoundId,
          canonicalProjectId,
          sourceType: "dropstab",
          status: "confirmed",
        },
      ]);

      await serviceWithMocks.materialize({
        write: true,
        confirmWrite: true,
      });

      const update = readModel.bulkWrite.mock.calls[0][0][0].updateOne.update;
      expect(update.$set.sourceType).toBe("dropstab");
      expect(update.$unset).toEqual(
        expect.objectContaining({
          raisedAmount: 1,
          valuation: 1,
          tokenPrice: 1,
          sourceUrl: 1,
        })
      );
      expect(update.$unset).not.toHaveProperty("sourceType");
    });

    it("propagates the fence immediately before feed bulkWrite", async () => {
      const { serviceWithMocks, readModel } = createFeedHarness([
        {
          _id: fundingRoundId,
          canonicalProjectId,
          sourceType: "dropstab",
          status: "confirmed",
        },
      ]);
      const fenceError = new Error("managed lease lost");
      const assertExecutionActive = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(fenceError);

      await expect(
        serviceWithMocks.materialize({
          write: true,
          confirmWrite: true,
          assertExecutionActive,
        })
      ).rejects.toBe(fenceError);

      expect(readModel.bulkWrite).not.toHaveBeenCalled();
    });

    it("propagates a fence failure detected after feed bulkWrite", async () => {
      const { serviceWithMocks, readModel } = createFeedHarness([
        {
          _id: fundingRoundId,
          canonicalProjectId,
          sourceType: "dropstab",
          status: "confirmed",
        },
      ]);
      const fenceError = new Error("managed lease lost after write");
      let bulkCompleted = false;
      readModel.bulkWrite.mockImplementation(async () => {
        bulkCompleted = true;
        return { modifiedCount: 1, upsertedCount: 0 };
      });
      const assertExecutionActive = jest.fn(async () => {
        if (bulkCompleted) throw fenceError;
      });

      await expect(
        serviceWithMocks.materialize({
          write: true,
          confirmWrite: true,
          assertExecutionActive,
        })
      ).rejects.toBe(fenceError);

      expect(readModel.bulkWrite).toHaveBeenCalledTimes(1);
    });
  });

  describe("materializeIcoProjectFunding", () => {
    function leanExec(value: any) {
      return {
        lean: jest.fn(() => ({ exec: jest.fn().mockResolvedValue(value) })),
      };
    }

    function sortedLeanExec(value: any) {
      return {
        sort: jest.fn(() => leanExec(value)),
      };
    }

    function pagedLeanExec(value: any) {
      return {
        sort: jest.fn(() => ({
          skip: jest.fn(() => ({
            limit: jest.fn(() => leanExec(value)),
          })),
        })),
      };
    }

    function createProjectFundingHarness() {
      const project = {
        _id: new Types.ObjectId("64b000000000000000000020"),
        canonicalProjectId,
        sourceType: "icodrops",
        name: "Project",
      };
      const rounds = [
        {
          _id: new Types.ObjectId("64b000000000000000000021"),
          canonicalProjectId,
          sourceType: "dropstab",
          primarySource: "dropstab",
          sourceId: "drop-round",
          sourceRefs: [{ sourceType: "dropstab", sourceId: "drop-round" }],
          roundName: "Seed",
          roundType: "seed",
          normalizedRoundType: "seed",
          status: "confirmed",
          announcedDate: new Date("2025-02-01T00:00:00.000Z"),
          raisedAmount: 2_000_000,
          confidence: "high",
        },
        {
          _id: new Types.ObjectId("64b000000000000000000022"),
          canonicalProjectId,
          sourceType: "icodrops",
          primarySource: "icodrops",
          sourceId: "ico-round",
          sourceRefs: [{ sourceType: "icodrops", sourceId: "ico-round" }],
          roundName: "Private",
          roundType: "private",
          normalizedRoundType: "private",
          status: "confirmed",
          announcedDate: new Date("2025-01-01T00:00:00.000Z"),
          raisedAmount: 3_000_000,
          confidence: "high",
        },
      ];
      const icoProjectModel = {
        find: jest.fn((filter: any) =>
          filter?.sourceType
            ? pagedLeanExec([project])
            : leanExec([project])
        ),
        bulkWrite: jest
          .fn()
          .mockResolvedValue({ modifiedCount: 1, upsertedCount: 0 }),
      };
      const serviceWithMocks = new FomoV2FundingFeedReadModelService(
        model(),
        { find: jest.fn(() => sortedLeanExec(rounds)) } as any,
        { find: jest.fn(() => sortedLeanExec([])) } as any,
        model(),
        model(),
        { find: jest.fn(() => leanExec([])) } as any,
        icoProjectModel as any,
        { find: jest.fn(() => leanExec([{ _id: canonicalProjectId }])) } as any
      );

      return { serviceWithMocks, icoProjectModel };
    }

    it("requires explicit write confirmation", async () => {
      const { serviceWithMocks } = createProjectFundingHarness();

      await expect(
        serviceWithMocks.materializeIcoProjectFunding({ write: true })
      ).rejects.toThrow(/confirm-write=true/i);
    });

    it("keeps complete source snapshots and selects the ICO project source for top-level funding", async () => {
      const { serviceWithMocks, icoProjectModel } =
        createProjectFundingHarness();

      const result = await serviceWithMocks.materializeIcoProjectFunding({
        write: true,
        confirmWrite: true,
      });

      expect(result).toEqual(
        expect.objectContaining({
          mode: "write",
          scannedProjects: 1,
          scannedRounds: 2,
          built: 1,
          written: 1,
          withFunding: 1,
          withoutFunding: 0,
          sourceCounts: { dropstab: 1, icodrops: 1 },
        })
      );
      const aggregate =
        icoProjectModel.bulkWrite.mock.calls[0][0][0].updateOne.update.$set[
          "metadata.fundingAggregate"
        ];
      expect(aggregate).toEqual(
        expect.objectContaining({
          hasData: true,
          selectedSource: "icodrops",
          totalRaised: 3_000_000,
          sourceTypes: ["dropstab", "icodrops"],
          bySource: {
            dropstab: expect.objectContaining({
              source: "dropstab",
              roundCount: 1,
              totalRaised: 2_000_000,
              rounds: [
                expect.objectContaining({
                  sourceType: "dropstab",
                  sourceId: "drop-round",
                }),
              ],
            }),
            icodrops: expect.objectContaining({
              source: "icodrops",
              roundCount: 1,
              totalRaised: 3_000_000,
              rounds: [
                expect.objectContaining({
                  sourceType: "icodrops",
                  sourceId: "ico-round",
                }),
              ],
            }),
          },
        })
      );
      expect(aggregate.rounds).toEqual([
        expect.objectContaining({
          sourceType: "icodrops",
          primarySource: "icodrops",
          sourceId: "ico-round",
        }),
      ]);
      expect(
        icoProjectModel.bulkWrite.mock.calls[0][0][0].updateOne.update.$set
          .updatedAt
      ).toEqual(expect.any(Date));
    });

    it("uses a deterministic source fallback when the ICO row source has no rounds", () => {
      const { serviceWithMocks } = createProjectFundingHarness();
      const aggregate = (serviceWithMocks as any).buildIcoProjectFundingAggregate(
        [
          {
            fundingRoundId: "64b000000000000000000022",
            sourceType: "icodrops",
            raisedAmount: 3_000_000,
          },
          {
            fundingRoundId: "64b000000000000000000021",
            sourceType: "dropstab",
            raisedAmount: 2_000_000,
          },
        ],
        new Date("2026-08-02T00:00:00.000Z"),
        "coingecko"
      );

      expect(aggregate.selectedSource).toBe("dropstab");
      expect(aggregate.totalRaised).toBe(2_000_000);
      expect(aggregate.rounds).toEqual([
        expect.objectContaining({ sourceType: "dropstab" }),
      ]);
    });

    it("propagates the fence immediately before project bulkWrite", async () => {
      const { serviceWithMocks, icoProjectModel } =
        createProjectFundingHarness();
      const fenceError = new Error("managed lease lost");
      const assertExecutionActive = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(fenceError);

      await expect(
        serviceWithMocks.materializeIcoProjectFunding({
          write: true,
          confirmWrite: true,
          assertExecutionActive,
        })
      ).rejects.toBe(fenceError);

      expect(icoProjectModel.bulkWrite).not.toHaveBeenCalled();
    });

    it("propagates a fence failure detected after project bulkWrite", async () => {
      const { serviceWithMocks, icoProjectModel } =
        createProjectFundingHarness();
      const fenceError = new Error("managed lease lost after write");
      let bulkCompleted = false;
      icoProjectModel.bulkWrite.mockImplementation(async () => {
        bulkCompleted = true;
        return { modifiedCount: 1, upsertedCount: 0 };
      });
      const assertExecutionActive = jest.fn(async () => {
        if (bulkCompleted) throw fenceError;
      });

      await expect(
        serviceWithMocks.materializeIcoProjectFunding({
          write: true,
          confirmWrite: true,
          assertExecutionActive,
        })
      ).rejects.toBe(fenceError);

      expect(icoProjectModel.bulkWrite).toHaveBeenCalledTimes(1);
    });

    it("builds a dry run without changing the ICO read model", async () => {
      const { serviceWithMocks, icoProjectModel } =
        createProjectFundingHarness();

      const result = await serviceWithMocks.materializeIcoProjectFunding({
        write: false,
      });

      expect(result.mode).toBe("dry-run");
      expect(result.written).toBe(0);
      expect(result.built).toBe(1);
      expect(icoProjectModel.bulkWrite).not.toHaveBeenCalled();
    });
  });
});
