import { Types } from "mongoose";
import { FomoV2VestingCandidateNormalizerService } from "./vesting-candidate-normalizer.service";

describe("FomoV2VestingCandidateNormalizerService", () => {
  const canonicalProjectId = new Types.ObjectId();

  it("separates schedule-linked and unlinked allocation/round rows without recalculating allocation values", () => {
    const service = new FomoV2VestingCandidateNormalizerService();

    const result = service.normalizeAllocationScheduleCandidates({
      canonicalProjectId,
      sourceType: "dropstab",
      sourceContext: {
        sourceType: "dropstab",
        vestingDatasetKey: "dropstab:vesting_dataset:test",
        sourceProjectKey: "dropstab-project",
        sourceSlug: "example",
        sourceUrl: "https://dropstab.com/coins/example",
        relevantDataHash: "hash",
      },
      sourceProject: {
        _id: new Types.ObjectId(),
        source: "dropstab",
        coinSlug: "example",
        name: "Example",
        symbol: "EX",
        tokenAllocation: [
          { saleId: 1, name: "Team", percent: 12.34, amount: 123_000 },
          { saleId: 2, name: "Reserve", percent: 87.66, amount: 876_000 },
        ],
        vestingRounds: [
          { saleId: 1, roundName: "Team", totalAmount: 123_000 },
          { saleId: 3, roundName: "Treasury", totalAmount: 1_000 },
        ],
        vestingSchedule: [
          {
            saleId: 1,
            roundName: "Team",
            currentUnlockedPercent: 10,
            currentLockedPercent: 90,
          },
        ],
      },
    });

    expect(result.tokenAllocations).toHaveLength(1);
    expect(result.tokenAllocations[0]).toMatchObject({
      saleId: 1,
      name: "Team",
      allocationPercent: 12.34,
      amount: 123_000,
    });
    expect(result.unlinkedTokenAllocations).toHaveLength(1);
    expect(result.unlinkedTokenAllocations[0]).toMatchObject({
      saleId: 2,
      name: "Reserve",
      allocationPercent: 87.66,
      amount: 876_000,
    });
    expect(result.vestingRounds).toHaveLength(1);
    expect(result.vestingRounds[0]).toMatchObject({
      saleId: 1,
      roundName: "Team",
    });
    expect(result.unlinkedVestingRounds).toHaveLength(1);
    expect(result.unlinkedVestingRounds[0]).toMatchObject({
      saleId: 3,
      roundName: "Treasury",
    });
    expect(result.vestingSchedules).toHaveLength(1);
  });
});
