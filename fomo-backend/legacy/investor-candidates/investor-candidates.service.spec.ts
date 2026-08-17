import { Types } from "mongoose";
import { InvestorCandidateService } from "./investor-candidates.service";

const query = <T>(value: T) => ({
  lean: jest.fn().mockResolvedValue(value),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
});

describe("InvestorCandidate foundation", () => {
  it("normalizes unmatched funding round investor evidence", () => {
    const service = new InvestorCandidateService({} as any);
    const roundId = new Types.ObjectId();

    const candidate = service.normalizeCandidate({
      name: "Missing Capital",
      slug: "missing-capital",
      source: "dropstab",
      sourceInvestorId: "123",
      evidenceType: "fundingRound",
      evidenceEntityId: roundId,
      fundingRoundId: roundId,
      role: "participant",
    });

    expect(candidate.normalizedName).toBe("missing capital");
    expect(candidate.normalizedSlug).toBe("missing-capital");
    expect(candidate.evidenceType).toBe("fundingRound");
    expect(candidate.evidenceRefs[0].fundingRoundId).toEqual(roundId);
    expect(candidate.dataQuality.hasSourceId).toBe(true);
    expect(candidate.dataQuality.hasSlug).toBe(true);
  });

  it("dry-run writes nothing", async () => {
    const model = {
      create: jest.fn(),
      findOne: jest.fn(),
    };
    const service = new InvestorCandidateService(model as any);

    const result = await service.proposeCandidate(
      {
        name: "Dry Run Backer",
        source: "dropstab",
        sourceInvestorId: "dry-1",
        evidenceType: "fundingRound",
        evidenceEntityId: new Types.ObjectId(),
      },
      { dryRun: true, dryRunCache: new Map() },
    );

    expect(result.wouldCreate).toBe(true);
    expect(model.create).not.toHaveBeenCalled();
    expect(model.findOne).not.toHaveBeenCalled();
  });

  it("merges repeated dry-run evidence instead of duplicating candidate", async () => {
    const service = new InvestorCandidateService({ create: jest.fn(), findOne: jest.fn() } as any);
    const dryRunCache = new Map<string, any>();
    const input = {
      name: "Repeated Backer",
      source: "dropstab",
      sourceInvestorId: "repeat-1",
      sourceInvestorSlug: "repeated-backer",
      evidenceType: "fundingRound",
      evidenceEntityId: new Types.ObjectId(),
    };

    const first = await service.proposeCandidate(input, { dryRun: true, dryRunCache });
    const second = await service.proposeCandidate({ ...input, evidenceEntityId: new Types.ObjectId() }, { dryRun: true, dryRunCache });

    expect(first.wouldCreate).toBe(true);
    expect(second.wouldMergeEvidence).toBe(true);
    expect(second.candidate.evidenceRefs).toHaveLength(2);
  });

  it("lists coverage grouped by status/evidence/type", async () => {
    const model = {
      countDocuments: jest.fn().mockResolvedValue(2),
      aggregate: jest
        .fn()
        .mockResolvedValueOnce([{ _id: "new", count: 2 }])
        .mockResolvedValueOnce([{ _id: "fundingRound", count: 2 }])
        .mockResolvedValueOnce([{ _id: "unknown", count: 2 }]),
    };
    const service = new InvestorCandidateService(model as any);

    const stats = await service.getCoverageStats();

    expect(stats.investorCandidates).toBe(2);
    expect(stats.byStatus.new).toBe(2);
    expect(stats.byEvidenceType.fundingRound).toBe(2);
    expect(stats.byCandidateType.unknown).toBe(2);
  });
});
