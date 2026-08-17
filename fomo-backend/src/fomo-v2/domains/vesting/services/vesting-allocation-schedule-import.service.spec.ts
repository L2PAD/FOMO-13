import { Types } from "mongoose";
import { FomoV2VestingAllocationScheduleImportService } from "./vesting-allocation-schedule-import.service";

describe("FomoV2VestingAllocationScheduleImportService", () => {
  const canonicalProjectId = new Types.ObjectId();
  const marketAssetId = new Types.ObjectId();

  function serviceWithCandidates(
    candidates: Record<string, any>,
    existingRows: {
      tokenAllocation?: Record<string, any> | null;
      vestingRound?: Record<string, any> | null;
      vestingSchedule?: Record<string, any> | null;
      sourceSnapshot?: Record<string, any> | null;
      crossSourceAllocations?: Record<string, any>[];
      crossSourceRounds?: Record<string, any>[];
      crossSourceSchedules?: Record<string, any>[];
      projectSourceLock?: Record<string, any> | null;
      ensureLockResult?: Record<string, any>;
    } = {
      tokenAllocation: null,
      vestingRound: null,
      vestingSchedule: null,
      sourceSnapshot: null,
    }
  ) {
    const configService = {
      get: jest.fn((key: string) => {
        if (key === "DB_NAME") return "fomo_new";
        if (key === "DB_PARSER_NAME") return "parser_new";
        return undefined;
      }),
    };
    const linkingService = {
      resolveProject: jest.fn().mockResolvedValue({
        status: "linked",
        canonicalProjectId,
        canonicalProjectIdString: canonicalProjectId.toHexString(),
      }),
      resolveMarketAsset: jest.fn().mockResolvedValue({ marketAssetId }),
    };
    const normalizer = {
      normalizeAllocationScheduleCandidates: jest.fn().mockReturnValue(candidates),
    };
    const dedupe = {
      dedupeByCandidateKey: jest.fn((items: any[]) => ({
        unique: items,
        duplicateGroups: [],
      })),
    };
    const vestingService = {
      upsertTokenAllocation: jest.fn().mockResolvedValue({
        doc: { _id: new Types.ObjectId() },
        created: true,
      }),
      upsertVestingRound: jest.fn().mockResolvedValue({
        doc: { _id: new Types.ObjectId() },
        created: true,
      }),
      upsertVestingSchedule: jest.fn().mockResolvedValue({
        doc: { _id: new Types.ObjectId() },
        created: true,
      }),
    };
    const importCandidateService = {
      createOrUpdateCandidate: jest.fn().mockResolvedValue({}),
    };
    const reviewService = {
      createOrUpdateBatch: jest.fn().mockResolvedValue({}),
    };
    const modelMock = (
      existing: Record<string, any> | null | undefined,
      crossSourceRows: Record<string, any>[] = []
    ) => ({
      countDocuments: jest.fn().mockResolvedValue(existing ? 1 : 0),
      findOne: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(existing || null),
      }),
      find: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(crossSourceRows),
        }),
      }),
    });
    const sourceSnapshotModel = {
      findOne: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(existingRows.sourceSnapshot || null),
      }),
    };
    const tokenAllocationModel = modelMock(
      existingRows.tokenAllocation,
      existingRows.crossSourceAllocations
    );
    const vestingRoundModel = modelMock(
      existingRows.vestingRound,
      existingRows.crossSourceRounds
    );
    const vestingScheduleModel = modelMock(
      existingRows.vestingSchedule,
      existingRows.crossSourceSchedules
    );
    const projectDomainSourceService = {
      getLock: jest
        .fn()
        .mockResolvedValue(existingRows.projectSourceLock || null),
      ensureLock: jest.fn().mockResolvedValue(
        existingRows.ensureLockResult || {
          allowed: true,
          action: "created_lock",
          lock: { selectedSourceType: "dropstab" },
        }
      ),
    };

    const service = new FomoV2VestingAllocationScheduleImportService(
      configService as any,
      {} as any,
      linkingService as any,
      normalizer as any,
      dedupe as any,
      vestingService as any,
      importCandidateService as any,
      reviewService as any,
      sourceSnapshotModel as any,
      tokenAllocationModel as any,
      vestingRoundModel as any,
      vestingScheduleModel as any,
      projectDomainSourceService as any
    );

    return {
      service,
      vestingService,
      importCandidateService,
      reviewService,
      linkingService,
      normalizer,
      sourceSnapshotModel,
      tokenAllocationModel,
      vestingRoundModel,
      vestingScheduleModel,
      projectDomainSourceService,
    };
  }

  it("quarantines the whole project/source vesting component when any relation is missing or conflicting", async () => {
    const sourceProject = {
      _id: new Types.ObjectId(),
      source: "dropstab",
      currencyId: "solana-source-id",
      coinSlug: "solana",
      name: "Solana",
      symbol: "SOL",
      tokenAllocation: [
        { saleId: 1, name: "Team", percent: 12, amount: 120 },
        { saleId: 1, name: "Team duplicate", percent: 13, amount: 130 },
        { saleId: 2, name: "Community Reserve", percent: 38.9, amount: 194500000 },
      ],
      vestingRounds: [{ saleId: 1, roundName: "Team", totalAmount: 120 }],
      vestingSchedule: [{ saleId: 1, roundName: "Team" }],
    };

    const candidates = {
      tokenAllocations: [
        allocationCandidate(1, "Team", "tokenAllocation.0"),
        allocationCandidate(1, "Team duplicate", "tokenAllocation.1"),
      ],
      vestingRounds: [roundCandidate(1, "Team", "vestingRounds.0")],
      vestingSchedules: [scheduleCandidate(1, "Team", "vestingSchedule.0")],
      unlinkedTokenAllocations: [
        allocationCandidate(2, "Community Reserve", "tokenAllocation.2"),
      ],
      unlinkedVestingRounds: [],
    };

    const {
      service,
      vestingService,
      importCandidateService,
      reviewService,
    } = serviceWithCandidates(candidates);
    const result = (service as any).emptyResult("dropstab", true, true);

    await (service as any).processSourceProject(
      sourceProject,
      { write: true, debug: true },
      result
    );

    expect(vestingService.upsertTokenAllocation).not.toHaveBeenCalled();
    expect(vestingService.upsertVestingRound).not.toHaveBeenCalled();
    expect(vestingService.upsertVestingSchedule).not.toHaveBeenCalled();
    expect(reviewService.createOrUpdateBatch).toHaveBeenCalledTimes(1);
    expect(importCandidateService.createOrUpdateCandidate).toHaveBeenCalledTimes(1);

    expect(result.tokenAllocationsFound).toBe(3);
    expect(result.vestingRoundsFound).toBe(1);
    expect(result.vestingSchedulesFound).toBe(1);
    expect(result.tokenAllocationsWouldCreate).toBe(0);
    expect(result.vestingRoundsWouldCreate).toBe(0);
    expect(result.vestingSchedulesWouldCreate).toBe(0);
    expect(result.unlinkedTokenAllocationsFound).toBe(1);
    expect(result.reviewWorthyCases).toBe(1);
    expect(result.importCandidatesCreatedOrUpdated).toBe(1);

    const reviewInput = reviewService.createOrUpdateBatch.mock.calls[0][0];
    const reviewPayload = reviewInput.candidates[0].payload;
    expect(reviewInput.candidateCount).toBe(5);
    expect(reviewPayload.relationIssues).toHaveLength(1);
    expect(reviewPayload.issueSummary.ambiguousAllocationLink).toBe(1);
    expect(reviewPayload.rawSource.tokenAllocation).toEqual(
      sourceProject.tokenAllocation
    );
    expect(reviewPayload.normalizedCandidates.tokenAllocations).toHaveLength(3);

    const importPayload =
      importCandidateService.createOrUpdateCandidate.mock.calls[0][0].payload;
    expect(importPayload.rawSource.vestingSchedule).toEqual(
      sourceProject.vestingSchedule
    );
    expect(importPayload.issueSummary.unlinkedTokenAllocationCount).toBe(1);
  });

  it("reuses unchanged rows without quarantining or domain-row writes", async () => {
    const sourceProject = {
      _id: new Types.ObjectId(),
      source: "dropstab",
      currencyId: "solana-source-id",
      coinSlug: "solana",
      name: "Solana",
      symbol: "SOL",
      tokenAllocation: [{ saleId: 1, name: "Team", percent: 12, amount: 120 }],
      vestingRounds: [{ saleId: 1, roundName: "Team", totalAmount: 120 }],
      vestingSchedule: [{ saleId: 1, roundName: "Team" }],
    };
    const candidates = {
      tokenAllocations: [
        allocationCandidate(1, "Team", "tokenAllocation.0", "source-hash")
      ],
      vestingRounds: [
        roundCandidate(1, "Team", "vestingRounds.0", "source-hash")
      ],
      vestingSchedules: [
        scheduleCandidate(1, "Team", "vestingSchedule.0", "source-hash")
      ],
      unlinkedTokenAllocations: [],
      unlinkedVestingRounds: [],
    };
    const allocationId = new Types.ObjectId();
    const roundId = new Types.ObjectId();
    const scheduleId = new Types.ObjectId();

    const {
      service,
      vestingService,
      importCandidateService,
      reviewService,
    } = serviceWithCandidates(candidates, {
      tokenAllocation: sourceRow(allocationId, "source-hash"),
      vestingRound: sourceRow(roundId, "source-hash"),
      vestingSchedule: {
        ...sourceRow(scheduleId, "source-hash"),
        tokenAllocationId: allocationId,
        vestingRoundId: roundId,
      },
    });
    const result = (service as any).emptyResult("dropstab", true, true);

    await (service as any).processSourceProject(
      sourceProject,
      { write: true, debug: true },
      result
    );

    expect(vestingService.upsertTokenAllocation).not.toHaveBeenCalled();
    expect(vestingService.upsertVestingRound).not.toHaveBeenCalled();
    expect(vestingService.upsertVestingSchedule).not.toHaveBeenCalled();
    expect(reviewService.createOrUpdateBatch).not.toHaveBeenCalled();
    expect(importCandidateService.createOrUpdateCandidate).not.toHaveBeenCalled();
    expect(result.tokenAllocationsFound).toBe(1);
    expect(result.vestingRoundsFound).toBe(1);
    expect(result.vestingSchedulesFound).toBe(1);
    expect(result.tokenAllocationsWouldCreate).toBe(0);
    expect(result.vestingRoundsWouldCreate).toBe(0);
    expect(result.vestingSchedulesWouldCreate).toBe(0);
    expect(result.tokenAllocationsUnchanged).toBe(1);
    expect(result.vestingRoundsUnchanged).toBe(1);
    expect(result.vestingSchedulesUnchanged).toBe(1);
    expect(result.existingVestingSourceConflicts).toBe(0);
    expect(result.sourceLocksCreated).toBe(1);
    expect(result.WRITES_PERFORMED).toBe(1);
  });

  it("treats a persisted drop-stab alias as the same provider", async () => {
    const candidates = {
      tokenAllocations: [
        allocationCandidate(1, "Team", "tokenAllocation.0", "source-hash"),
      ],
      vestingRounds: [],
      vestingSchedules: [],
      unlinkedTokenAllocations: [],
      unlinkedVestingRounds: [],
    };
    const existing = {
      ...sourceRow(new Types.ObjectId(), "source-hash"),
      sourceType: "drop-stab",
    };
    const { service, vestingService, tokenAllocationModel } =
      serviceWithCandidates(candidates, { tokenAllocation: existing });

    expect(
      (service as any).isSourceCandidateUnchanged(
        existing,
        candidates.tokenAllocations[0]
      )
    ).toBe(true);
    await (service as any).findCrossSourceConflicts(
      candidates,
      "dropstab"
    );
    const query = tokenAllocationModel.find.mock.calls[0][0];
    expect(query.sourceType.$not).toBeInstanceOf(RegExp);
    expect(query.sourceType.$not.test("drop-stab")).toBe(true);
    expect(query.sourceType.$not.test("icodrops")).toBe(false);
    expect(vestingService.upsertTokenAllocation).not.toHaveBeenCalled();
  });

  it("repairs a partial same-source component by reusing existing rows and upserting missing rows", async () => {
    const sourceProject = {
      _id: new Types.ObjectId(),
      source: "dropstab",
      currencyId: "solana-source-id",
      coinSlug: "solana",
      name: "Solana",
      symbol: "SOL",
      tokenAllocation: [{ saleId: 1, name: "Team" }],
      vestingRounds: [{ saleId: 1, roundName: "Team" }],
      vestingSchedule: [{ saleId: 1, roundName: "Team" }],
    };
    const candidates = {
      tokenAllocations: [
        allocationCandidate(1, "Team", "tokenAllocation.0", "source-hash")
      ],
      vestingRounds: [
        roundCandidate(1, "Team", "vestingRounds.0", "source-hash")
      ],
      vestingSchedules: [
        scheduleCandidate(1, "Team", "vestingSchedule.0", "source-hash")
      ],
      unlinkedTokenAllocations: [],
      unlinkedVestingRounds: [],
    };
    const allocationId = new Types.ObjectId();
    const roundId = new Types.ObjectId();
    const snapshotId = new Types.ObjectId();
    const {
      service,
      vestingService,
      reviewService,
      normalizer,
    } = serviceWithCandidates(candidates, {
      tokenAllocation: sourceRow(allocationId, "source-hash"),
      vestingRound: null,
      vestingSchedule: null,
      sourceSnapshot: { _id: snapshotId },
    });
    vestingService.upsertVestingRound.mockResolvedValue({
      doc: { _id: roundId },
      created: true,
    });

    const result = (service as any).emptyResult("dropstab", true, true);
    await (service as any).processSourceProject(
      sourceProject,
      { write: true, debug: true },
      result
    );

    expect(vestingService.upsertTokenAllocation).not.toHaveBeenCalled();
    expect(vestingService.upsertVestingRound).toHaveBeenCalledTimes(1);
    expect(vestingService.upsertVestingSchedule).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "dropstab",
        tokenAllocationId: allocationId,
        vestingRoundId: roundId,
      })
    );
    expect(reviewService.createOrUpdateBatch).not.toHaveBeenCalled();
    expect(result.tokenAllocationsUnchanged).toBe(1);
    expect(result.vestingRoundsCreated).toBe(1);
    expect(result.vestingSchedulesCreated).toBe(1);
    expect(
      normalizer.normalizeAllocationScheduleCandidates.mock.calls[0][0]
        .sourceContext.sourceSnapshotId
    ).toEqual(snapshotId);
  });

  it("quarantines a persisted fingerprint owned by another source", async () => {
    const sourceProject = {
      _id: new Types.ObjectId(),
      source: "dropstab",
      currencyId: "solana-source-id",
      coinSlug: "solana",
      name: "Solana",
      symbol: "SOL",
      tokenAllocation: [{ saleId: 1, name: "Team" }],
      vestingRounds: [{ saleId: 1, roundName: "Team" }],
      vestingSchedule: [{ saleId: 1, roundName: "Team" }],
    };
    const candidates = {
      tokenAllocations: [allocationCandidate(1, "Team", "tokenAllocation.0")],
      vestingRounds: [roundCandidate(1, "Team", "vestingRounds.0")],
      vestingSchedules: [scheduleCandidate(1, "Team", "vestingSchedule.0")],
      unlinkedTokenAllocations: [],
      unlinkedVestingRounds: [],
    };
    const {
      service,
      vestingService,
      importCandidateService,
      reviewService,
    } = serviceWithCandidates(candidates, {
      crossSourceAllocations: [
        {
          _id: new Types.ObjectId(),
          sourceType: "icodrops",
          canonicalFingerprint: "conflicting-fingerprint",
        },
      ],
    });
    const result = (service as any).emptyResult("dropstab", true, true);

    await (service as any).processSourceProject(
      sourceProject,
      { write: true, debug: true },
      result
    );

    expect(vestingService.upsertTokenAllocation).not.toHaveBeenCalled();
    expect(vestingService.upsertVestingRound).not.toHaveBeenCalled();
    expect(vestingService.upsertVestingSchedule).not.toHaveBeenCalled();
    expect(reviewService.createOrUpdateBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "SOURCE_CONFLICT",
        currentSourceType: "icodrops",
        incomingSourceType: "dropstab",
      })
    );
    expect(importCandidateService.createOrUpdateCandidate).toHaveBeenCalledTimes(1);
    expect(result.existingVestingSourceConflicts).toBe(1);
    expect(result.skipped.byReason.cross_source_vesting_conflict).toBe(3);
  });

  it("rejects a provider that does not own the active vesting source lock", async () => {
    const candidates = {
      tokenAllocations: [allocationCandidate(1, "Team", "tokenAllocation.0")],
      vestingRounds: [roundCandidate(1, "Team", "vestingRounds.0")],
      vestingSchedules: [scheduleCandidate(1, "Team", "vestingSchedule.0")],
      unlinkedTokenAllocations: [],
      unlinkedVestingRounds: [],
    };
    const { service, vestingService, reviewService } = serviceWithCandidates(
      candidates,
      {
        projectSourceLock: {
          selectedSourceType: "icodrops",
          status: "locked",
        },
      }
    );
    const result = (service as any).emptyResult("dropstab", true, true);

    await (service as any).processSourceProject(
      {
        _id: new Types.ObjectId(),
        source: "dropstab",
        currencyId: "source-project",
        name: "Source Project",
        tokenAllocation: [{ saleId: 1, name: "Team" }],
        vestingRounds: [{ saleId: 1, roundName: "Team" }],
        vestingSchedule: [{ saleId: 1, roundName: "Team" }],
      },
      { write: true, debug: true },
      result
    );

    expect(vestingService.upsertTokenAllocation).not.toHaveBeenCalled();
    expect(vestingService.upsertVestingRound).not.toHaveBeenCalled();
    expect(vestingService.upsertVestingSchedule).not.toHaveBeenCalled();
    expect(reviewService.createOrUpdateBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "SOURCE_CONFLICT",
        currentSourceType: "icodrops",
        incomingSourceType: "dropstab",
      })
    );
    expect(result.sourceLockConflicts).toBe(1);
  });

  it("creates an import candidate for an unlinked project when requested", async () => {
    const { service, linkingService, importCandidateService, reviewService } =
      serviceWithCandidates({
        tokenAllocations: [],
        vestingRounds: [],
        vestingSchedules: [],
        unlinkedTokenAllocations: [],
        unlinkedVestingRounds: [],
      });
    linkingService.resolveProject.mockResolvedValue({
      status: "source_only",
      reason: "no canonical project",
    });
    const result = (service as any).emptyResult("icodrops", true, true);

    await (service as any).processSourceProject(
      {
        _id: new Types.ObjectId(),
        source: "icodrops",
        currencyId: "new-project",
        name: "New Project",
      },
      { write: true, writeCandidates: true },
      result
    );

    expect(reviewService.createOrUpdateBatch).toHaveBeenCalledTimes(1);
    expect(importCandidateService.createOrUpdateCandidate).toHaveBeenCalledWith(
      expect.objectContaining({ sourceType: "icodrops" })
    );
    expect(result.importCandidatesWouldCreate).toBe(1);
    expect(result.importCandidatesCreatedOrUpdated).toBe(1);
  });

  function allocationCandidate(
    saleId: number,
    name: string,
    sourcePath: string,
    relevantDataHash?: string
  ): Record<string, any> {
    return {
      candidateKey: `allocation:${sourcePath}`,
      canonicalProjectId,
      marketAssetId,
      sourceType: "dropstab",
      sourcePath,
      saleId,
      name,
      normalizedName: name.toLowerCase(),
      allocationPercent: saleId,
      amount: saleId * 100,
      provenance: relevantDataHash ? { relevantDataHash } : {},
    };
  }

  function roundCandidate(
    saleId: number,
    roundName: string,
    sourcePath: string,
    relevantDataHash?: string
  ): Record<string, any> {
    return {
      candidateKey: `round:${sourcePath}`,
      canonicalProjectId,
      marketAssetId,
      sourceType: "dropstab",
      sourcePath,
      saleId,
      roundName,
      normalizedRoundName: roundName.toLowerCase(),
      totalAmount: saleId * 100,
      provenance: relevantDataHash ? { relevantDataHash } : {},
    };
  }

  function scheduleCandidate(
    saleId: number,
    roundName: string,
    sourcePath: string,
    relevantDataHash?: string
  ): Record<string, any> {
    return {
      candidateKey: `schedule:${sourcePath}`,
      canonicalProjectId,
      marketAssetId,
      sourceType: "dropstab",
      sourcePath,
      saleId,
      roundName,
      normalizedRoundName: roundName.toLowerCase(),
      provenance: relevantDataHash ? { relevantDataHash } : {},
    };
  }

  function sourceRow(
    _id: Types.ObjectId,
    relevantDataHash: string
  ): Record<string, any> {
    return {
      _id,
      sourceType: "dropstab",
      provenance: { relevantDataHash },
    };
  }
});
