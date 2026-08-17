import { Types } from "mongoose";
import { ProjectCandidateService } from "./project-candidates.service";

const query = <T>(value: T) => ({
  lean: jest.fn().mockResolvedValue(value),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
});

describe("ProjectCandidate foundation", () => {
  it("normalizes orphan funding round evidence as a ProjectCandidate", () => {
    const service = new ProjectCandidateService({} as any);
    const roundId = new Types.ObjectId();

    const candidate = service.normalizeCandidate({
      evidenceType: "fundingRound",
      evidenceEntityId: roundId,
      source: "dropstab",
      sourceId: "dropstab:funding:1",
      name: "Orphan Project",
      slug: "orphan-project",
      symbol: "ORPH",
      suggestedProjectType: "project",
      confidence: 70,
    });

    expect(candidate.evidenceType).toBe("fundingRound");
    expect(candidate.evidenceEntityId).toEqual(roundId);
    expect(candidate.normalizedSlug).toBe("orphan-project");
    expect(candidate.normalizedSymbol).toBe("ORPH");
    expect(candidate.suggestedProjectType).toBe("project");
    expect(candidate.dataQuality.hasFundingRounds).toBe(true);
  });

  it("dry-run writes nothing", async () => {
    const model = {
      create: jest.fn(),
      findOne: jest.fn(),
    };
    const service = new ProjectCandidateService(model as any);

    const result = await service.proposeCandidate(
      {
        evidenceType: "tokenUnlock",
        evidenceEntityId: new Types.ObjectId(),
        source: "dropstab",
        sourceId: "unlock:1",
        name: "Unlock Only",
      },
      { dryRun: true, dryRunCache: new Map() },
    );

    expect(result.wouldCreate).toBe(true);
    expect(model.create).not.toHaveBeenCalled();
    expect(model.findOne).not.toHaveBeenCalled();
  });

  it("merges evidence in dry-run instead of creating a duplicate candidate", async () => {
    const service = new ProjectCandidateService({ create: jest.fn(), findOne: jest.fn() } as any);
    const dryRunCache = new Map<string, any>();
    const input = {
      evidenceType: "fundingRound",
      evidenceEntityId: new Types.ObjectId(),
      source: "dropstab",
      sourceId: "dropstab:funding:2",
      slug: "same-candidate",
      name: "Same Candidate",
    };

    const first = await service.proposeCandidate(input, { dryRun: true, dryRunCache });
    const second = await service.proposeCandidate({ ...input, confidence: 80 }, { dryRun: true, dryRunCache });

    expect(first.wouldCreate).toBe(true);
    expect(second.wouldMergeEvidence).toBe(true);
    expect(second.candidate.confidence).toBe(80);
  });

  it("merges funding round and token unlock evidence for the same orphan project identity", async () => {
    const service = new ProjectCandidateService({ create: jest.fn(), findOne: jest.fn() } as any);
    const dryRunCache = new Map<string, any>();

    const first = await service.proposeCandidate(
      {
        evidenceType: "fundingRound",
        evidenceEntityId: new Types.ObjectId(),
        source: "dropstab",
        sourceId: "dropstab:funding:10",
        sourceSlug: "same-orphan",
        slug: "same-orphan",
        name: "Same Orphan",
        symbol: "SAME",
      },
      { dryRun: true, dryRunCache },
    );
    const second = await service.proposeCandidate(
      {
        evidenceType: "tokenUnlock",
        evidenceEntityId: new Types.ObjectId(),
        source: "dropstab",
        sourceId: "dropstab:unlock:99",
        sourceSlug: "same-orphan",
        slug: "same-orphan",
        name: "Same Orphan",
        symbol: "SAME",
      },
      { dryRun: true, dryRunCache },
    );

    expect(first.wouldCreate).toBe(true);
    expect(second.wouldMergeEvidence).toBe(true);
    expect(second.candidate.evidenceRefs).toHaveLength(2);
    expect(second.candidate.dataQuality.hasFundingRounds).toBe(true);
    expect(second.candidate.dataQuality.hasUnlocks).toBe(true);
    expect(dryRunCache.size).toBe(1);
  });

  it("does not merge symbol-only orphan evidence across funding rounds and token unlocks", async () => {
    const service = new ProjectCandidateService({ create: jest.fn(), findOne: jest.fn() } as any);
    const dryRunCache = new Map<string, any>();

    const first = await service.proposeCandidate(
      {
        evidenceType: "fundingRound",
        evidenceEntityId: new Types.ObjectId(),
        source: "dropstab",
        symbol: "ONLY",
        confidence: 40,
        matchedBy: "symbol",
        dataQuality: { warnings: ["symbol-only unsafe"] },
      },
      { dryRun: true, dryRunCache },
    );
    const second = await service.proposeCandidate(
      {
        evidenceType: "tokenUnlock",
        evidenceEntityId: new Types.ObjectId(),
        source: "dropstab",
        symbol: "ONLY",
        confidence: 40,
        matchedBy: "symbol",
        dataQuality: { warnings: ["symbol-only unsafe"] },
      },
      { dryRun: true, dryRunCache },
    );

    expect(first.wouldCreate).toBe(true);
    expect(second.wouldCreate).toBe(true);
    expect(second.wouldMergeEvidence).toBeUndefined();
    expect(dryRunCache.size).toBe(2);
  });

  it("marks an existing Project match without creating a canonical entity", async () => {
    const candidateId = new Types.ObjectId();
    const projectId = new Types.ObjectId();
    const findByIdAndUpdate = jest.fn().mockReturnValue(query({ _id: candidateId, matchedProjectId: projectId }));
    const service = new ProjectCandidateService({ findByIdAndUpdate } as any);

    const result: any = await service.markMatchedExistingProject(candidateId, projectId);

    expect(findByIdAndUpdate).toHaveBeenCalledWith(
      candidateId,
      { $set: { matchedProjectId: projectId, status: "matched_existing_project" } },
      { new: true },
    );
    expect(result.matchedProjectId).toEqual(projectId);
  });
});
