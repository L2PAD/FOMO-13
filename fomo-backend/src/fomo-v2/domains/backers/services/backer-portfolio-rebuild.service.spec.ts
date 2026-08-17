import { Types } from "mongoose";
import { FomoV2BackerPortfolioRebuildService } from "./backer-portfolio-rebuild.service";

describe("FomoV2BackerPortfolioRebuildService", () => {
  it("keeps holdings when market read model is missing", async () => {
    const backerId = new Types.ObjectId();
    const canonicalProjectId = new Types.ObjectId();
    const fundingRoundId = new Types.ObjectId();
    const participantId = new Types.ObjectId();
    const holdingModel = fakeHoldingModel();
    holdingModel.bulkWrite.mockResolvedValue({
      upsertedCount: 1,
      modifiedCount: 0,
    });
    const service = new FomoV2BackerPortfolioRebuildService(
      fakeConnection({
        funding_round_participants: [
          {
            _id: participantId,
            fundingRoundId,
            backerId,
            canonicalProjectId,
            isLead: true,
          },
        ],
        funding_rounds: [
          {
            _id: fundingRoundId,
            announcedDate: new Date("2024-01-02T00:00:00.000Z"),
            normalizedRoundType: "seed",
            raisedAmount: 10,
            sourceType: "dropstab",
          },
        ],
        backers: [
          {
            _id: backerId,
            name: "No Market Fund",
            slug: "no-market-fund",
            backerType: "fund",
          },
        ],
        canonical_projects: [
          {
            _id: canonicalProjectId,
            name: "No Market Project",
            slug: "no-market-project",
            symbol: "nmp",
            hasMarketData: false,
          },
        ],
        market_project_read_models: [],
      }),
      holdingModel
    );

    const assertExecutionActive = jest.fn();
    const result = await service.run({
      debug: true,
      write: true,
      replaceExisting: false,
      assertExecutionActive,
    });

    expect(result.errors).toEqual([]);
    expect(result.participantsScanned).toBe(1);
    expect(result.holdingsWouldCreate).toBe(1);
    expect(result.holdingsCreated).toBe(1);
    expect(result.holdingsDeleted).toBe(0);
    expect(result.holdingsWithoutMarketData).toBe(1);
    expect(result.uniqueProjectsWithoutMarketData).toBe(1);
    expect(result.sourcePairs).toBe(1);
    expect(result.holdingPairs).toBe(1);
    expect(result.missingPairs).toBe(0);
    expect(result.debugExamples?.holdingsWithoutMarketData).toEqual([
      {
        backer: "No Market Fund",
        backerId: backerId.toHexString(),
        canonicalProjectId: canonicalProjectId.toHexString(),
        projectName: "No Market Project",
        projectSlug: "no-market-project",
        projectSymbol: "nmp",
        hasMarketData: false,
      },
    ]);
    expect(holdingModel.deleteMany).not.toHaveBeenCalled();
    expect(assertExecutionActive).toHaveBeenCalled();
    expect(holdingModel.bulkWrite).toHaveBeenCalledWith(
      [
        expect.objectContaining({
          updateOne: expect.objectContaining({
            filter: {
              backerId,
              canonicalProjectId,
            },
            upsert: true,
          }),
        }),
      ],
      { ordered: false }
    );
  });
});

function fakeConnection(rowsByCollection: Record<string, any[]>): any {
  return {
    collection: (name: string) => ({
      find: (filter: Record<string, any> = {}) => ({
        toArray: async () =>
          (rowsByCollection[name] || []).filter((row) => matches(row, filter)),
      }),
      findOne: async (filter: Record<string, any> = {}) =>
        (rowsByCollection[name] || []).find((row) => matches(row, filter)) ||
        null,
    }),
  };
}

function fakeHoldingModel(): any {
  return {
    createIndexes: jest.fn(),
    deleteMany: jest.fn(),
    bulkWrite: jest.fn(),
  };
}

function matches(row: Record<string, any>, filter: Record<string, any>): boolean {
  return Object.entries(filter || {}).every(([field, condition]) => {
    const value = row[field];
    if (condition && typeof condition === "object" && "$in" in condition) {
      return condition.$in.some((item: any) => sameId(value, item));
    }
    if (condition && typeof condition === "object" && "$exists" in condition) {
      const exists = value !== undefined;
      if (Boolean(condition.$exists) !== exists) return false;
      if ("$ne" in condition && sameId(value, condition.$ne)) return false;
      return true;
    }
    return sameId(value, condition);
  });
}

function sameId(left: any, right: any): boolean {
  if (left === right) return true;
  if (left === undefined || left === null || right === undefined || right === null) {
    return left === right;
  }
  return String(left) === String(right);
}
