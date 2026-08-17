import { Types } from "mongoose";
import { FomoV2IcodropsFundingFallbackImportService } from "./icodrops-funding-fallback-import.service";

function asyncCursor(rows: any[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const row of rows) yield row;
    },
  };
}

function findChain(rows: any[]) {
  const chain: any = {};
  chain.sort = jest.fn(() => chain);
  chain.limit = jest.fn(() => chain);
  chain.lean = jest.fn(() => chain);
  chain.cursor = jest.fn(() => asyncCursor(rows));
  return chain;
}

function leanOne(value: any) {
  return {
    lean: jest.fn().mockResolvedValue(value),
  };
}

function leanMany(values: any[]) {
  const chain: any = {};
  chain.limit = jest.fn(() => chain);
  chain.lean = jest.fn().mockResolvedValue(values);
  return chain;
}

function createService(input: {
  projects: any[];
  canonicalProjectId?: Types.ObjectId;
  primaryRows?: number;
  existingRound?: any;
  reconciliationRounds?: any[];
  resolverResult?: any;
  backersBySourceId?: Record<string, any>;
  sourcePolicyResult?: any;
}) {
  const canonicalProjectId = input.canonicalProjectId || new Types.ObjectId();
  const icoProjectSourceModel = {
    countDocuments: jest.fn((query: any) => {
      const serialized = JSON.stringify(query);
      return Promise.resolve(
        serialized.includes('"$exists":false') ? 0 : input.projects.length
      );
    }),
    find: jest.fn(() => findChain(input.projects)),
  };
  const fundingRoundModel = {
    countDocuments: jest.fn().mockResolvedValue(input.primaryRows || 0),
    findOne: jest.fn(() => leanOne(input.existingRound || null)),
    find: jest.fn(() => leanMany(input.reconciliationRounds || [])),
  };
  const resolver = {
    resolve: jest.fn().mockResolvedValue(
      input.resolverResult || {
        action: "LINK_EXISTING",
        canonicalProjectId: canonicalProjectId.toHexString(),
        confidence: 100,
        matchedBy: "existing_source_profile",
      }
    ),
  };
  const upsertFundingRound = jest.fn().mockResolvedValue({
    created:
      !input.existingRound && !(input.reconciliationRounds || []).length,
    doc: { _id: new Types.ObjectId() },
  });
  const fundingService = {
    upsertFundingRound,
    upsertRoundWithSourcePolicy: jest.fn(async (payload: any) => {
      if (input.sourcePolicyResult) return input.sourcePolicyResult;
      return {
        written: true,
        skipped: false,
        action: "matched_lock",
        result: await upsertFundingRound(payload),
      };
    }),
    upsertFundingRoundParticipant: jest.fn().mockResolvedValue({
      created: true,
      doc: { _id: new Types.ObjectId() },
    }),
  };
  const backerService = {
    findBySourceIdentity: jest.fn(
      async (_sourceType: string, sourceId: string) =>
        input.backersBySourceId?.[sourceId] || null
    ),
  };

  const service = new FomoV2IcodropsFundingFallbackImportService(
    icoProjectSourceModel as any,
    fundingRoundModel as any,
    resolver as any,
    backerService as any,
    fundingService as any
  );

  return {
    service,
    canonicalProjectId,
    icoProjectSourceModel,
    fundingRoundModel,
    resolver,
    backerService,
    fundingService,
  };
}

describe("FomoV2IcodropsFundingFallbackImportService", () => {
  it("stops before the next source project when the managed execution fence closes", async () => {
    const projects = [
      { _id: new Types.ObjectId(), source: "icodrops" },
      { _id: new Types.ObjectId(), source: "icodrops" },
    ];
    const { service } = createService({ projects });
    const processProject = jest
      .spyOn(service as any, "processProject")
      .mockResolvedValue(undefined);
    const fenceError = new Error("managed lease lost");
    const assertExecutionActive = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(fenceError);

    await expect(
      service.run({ limit: 2, assertExecutionActive })
    ).rejects.toBe(fenceError);

    expect(processProject).toHaveBeenCalledTimes(1);
  });

  it("does not let allConfirmed select unbounded service scope", async () => {
    const { service, icoProjectSourceModel } = createService({ projects: [] });

    await service.run({ allConfirmed: true });
    const query = icoProjectSourceModel.find.mock.results[0].value;
    expect(query.limit).toHaveBeenCalledWith(100);
    await expect(service.run({ all: true })).rejects.toThrow(
      "--all requires --all-confirmed"
    );
    await expect(
      service.run({ write: true, allConfirmed: true })
    ).rejects.toThrow("confirmed --all");
  });

  it("queries canonical and legacy ICODrops source tags only", () => {
    const { service } = createService({ projects: [] });

    const sourcePattern = (service as any).sourceQuery().source as RegExp;
    expect(sourcePattern.test("icodrops")).toBe(true);
    expect(sourcePattern.test("ico-drops")).toBe(true);
    expect(sourcePattern.test("dropstab")).toBe(false);
    expect((service as any).missingSourceQuery()).toEqual({
      $or: [{ source: { $exists: false } }, { source: null }, { source: "" }],
    });
    const parserSourcePattern = (service as any).parserQuery().$and[0]
      .source as RegExp;
    expect(parserSourcePattern.test("ICO_Drops")).toBe(true);
    expect(parserSourcePattern.test("drop-stab")).toBe(false);
  });

  it("recognizes legacy aliases as authoritative primary funding", async () => {
    const { service, fundingRoundModel, canonicalProjectId } = createService({
      projects: [],
    });

    await (service as any).countPrimaryFundingRows(canonicalProjectId);
    const query = fundingRoundModel.countDocuments.mock.calls[0][0];
    const sourcePatterns = query.$or[0].primarySource.$in as RegExp[];
    expect(sourcePatterns.some((pattern) => pattern.test("drop-stab"))).toBe(
      true
    );
    expect(
      sourcePatterns.some((pattern) => pattern.test("intel-fund-raising"))
    ).toBe(true);
    expect(sourcePatterns.some((pattern) => pattern.test("icodrops"))).toBe(
      false
    );
  });

  it("skips ICODrops funding when primary funding rows already exist", async () => {
    const { service, fundingService } = createService({
      primaryRows: 1,
      projects: [
        {
          _id: new Types.ObjectId(),
          source: "icodrops",
          slug: "example",
          name: "Example",
          fundraising: {
            rounds: [{ roundName: "Seed", amount: 1000000 }],
          },
        },
      ],
    });

    const result = await service.run({ write: true, limit: 1, debug: true });

    expect(result.fundingSkippedBecausePrimaryExists).toBe(1);
    expect(result.fundingFallbackCreated).toBe(0);
    expect(fundingService.upsertFundingRound).not.toHaveBeenCalled();
  });

  it("creates fallback funding_rounds from ico_projects.fundraising.rounds when primary rows are missing", async () => {
    const { service, fundingService } = createService({
      primaryRows: 0,
      projects: [
        {
          _id: new Types.ObjectId(),
          source: "icodrops",
          sourceId: "example",
          slug: "example",
          detailUrl: "https://icodrops.com/example",
          name: "Example",
          fundraising: {
            rounds: [
              {
                roundName: "Seed",
                date: "2025-01-01",
                amount: 1000000,
                investors: ["A Fund"],
              },
            ],
          },
        },
      ],
    });

    const result = await service.run({ write: true, limit: 1 });

    expect(result.fundingFallbackWouldCreate).toBe(1);
    expect(result.fundingFallbackCreated).toBe(1);
    expect(fundingService.upsertRoundWithSourcePolicy).toHaveBeenCalledTimes(1);
    expect(fundingService.upsertFundingRound).toHaveBeenCalledTimes(1);
    expect(fundingService.upsertFundingRound).toHaveBeenCalledWith(
      expect.objectContaining({
        primarySource: "icodrops",
        sourceType: "icodrops",
        roundName: "Seed",
        confidence: "low",
        importMode: "fallback_profile_only",
        metadata: expect.objectContaining({
          confidenceReason: "profile_only",
          fallback: true,
          importMode: "fallback_profile_only",
          isFallback: true,
        }),
        sourceRefs: [
          expect.objectContaining({
            source: "icodrops",
            sourcePath: "fundraising.rounds.0",
            metadata: expect.objectContaining({
              confidenceReason: "profile_only",
            }),
          }),
        ],
      })
    );
  });

  it("skips and reviews an ICODrops write when the funding source lock belongs to Dropstab", async () => {
    const { service, fundingService } = createService({
      primaryRows: 0,
      sourcePolicyResult: {
        written: false,
        skipped: true,
        reason: "SOURCE_CONFLICT",
        action: "source_conflict",
        lock: { currentSourceType: "dropstab" },
        review: { _id: new Types.ObjectId() },
      },
      projects: [
        {
          _id: new Types.ObjectId(),
          source: "icodrops",
          sourceId: "locked-project",
          slug: "locked-project",
          name: "Locked Project",
          fundraising: {
            rounds: [
              {
                id: "icodrops-round",
                roundName: "Seed",
                date: "2025-01-01",
                amount: 1000000,
                investors: [{ id: "a-fund", name: "A Fund" }],
              },
            ],
          },
        },
      ],
    });

    const result = await service.run({ write: true, limit: 1, debug: true });

    expect(fundingService.upsertRoundWithSourcePolicy).toHaveBeenCalledWith(
      expect.objectContaining({
        canonicalProjectId: expect.any(Types.ObjectId),
        primarySource: "icodrops",
        sourceType: "icodrops",
        sourceId: "icodrops-round",
      })
    );
    expect(fundingService.upsertFundingRound).not.toHaveBeenCalled();
    expect(fundingService.upsertFundingRoundParticipant).not.toHaveBeenCalled();
    expect(result.fundingSkippedBecauseSourceConflict).toBe(1);
    expect(result.skipped.byReason.source_conflict).toBe(1);
    expect(result.roundsSkipped).toBe(1);
    expect(result.fundingFallbackCreated).toBe(0);
    expect(result.fundingFallbackUpdated).toBe(0);
  });

  it("counts fallback participants only from fundraising.rounds investors", async () => {
    const { service } = createService({
      primaryRows: 0,
      projects: [
        {
          _id: new Types.ObjectId(),
          source: "icodrops",
          sourceId: "example",
          slug: "example",
          detailUrl: "https://icodrops.com/example",
          name: "Example",
          fundraising: {
            investors: ["Aggregated Investor"],
            rounds: [
              {
                roundName: "Seed",
                date: "2025-01-01",
                investors: ["A Fund", "A Fund"],
                leadInvestors: [{ name: "Lead Fund", slug: "lead-fund" }],
              },
            ],
          },
        },
      ],
    });

    const result = await service.run({ write: false, limit: 1 });

    expect(result.fundingFallbackWouldCreate).toBe(1);
    expect(result.fundingFallbackParticipantsWouldCreate).toBe(2);
  });

  it("writes participants only when an ICODrops source identity resolves to a backer", async () => {
    const backerId = new Types.ObjectId();
    const { service, fundingService, backerService } = createService({
      primaryRows: 0,
      backersBySourceId: {
        "a-fund": {
          _id: backerId,
          name: "A Fund",
          normalizedName: "a_fund",
        },
      },
      projects: [
        {
          _id: new Types.ObjectId(),
          source: "icodrops",
          sourceId: "example",
          slug: "example",
          name: "Example",
          fundraising: {
            rounds: [
              {
                roundName: "Seed",
                date: "2025-01-01",
                investors: [{ id: "a-fund", name: "A Fund" }, "Name Only"],
              },
            ],
          },
        },
      ],
    });

    const result = await service.run({ write: true, limit: 1 });

    expect(backerService.findBySourceIdentity).toHaveBeenCalledWith(
      "icodrops",
      "a-fund"
    );
    expect(fundingService.upsertFundingRoundParticipant).toHaveBeenCalledTimes(
      1
    );
    expect(fundingService.upsertFundingRoundParticipant).toHaveBeenCalledWith(
      expect.objectContaining({
        backerId,
        backerName: "A Fund",
        primarySource: "icodrops",
        sourceBackerId: "a-fund",
        sourceRefs: [expect.objectContaining({ source: "icodrops" })],
      })
    );
    expect(result.fundingFallbackParticipantsCreated).toBe(1);
    expect(result.fundingFallbackParticipantsSkippedMissingBacker).toBe(1);
  });

  it("keeps fallback round identity stable when parser array order changes", () => {
    const { service, canonicalProjectId } = createService({ projects: [] });
    const identity = {
      sourceDocumentId: "parser-doc",
      sourceProjectId: "example",
      sourceSlug: "example",
    };
    const sourceRound = {
      roundName: "Seed",
      date: "2025-01-01",
      amount: 1000000,
    };

    const first = (service as any).normalizeRound(
      sourceRound,
      0,
      identity,
      canonicalProjectId
    );
    const reordered = (service as any).normalizeRound(
      sourceRound,
      7,
      identity,
      canonicalProjectId
    );

    expect(first.roundKey).toBe(reordered.roundKey);
    expect(first.sourceId).toBe(reordered.sourceId);
    expect(first.canonicalFingerprint).toBe(reordered.canonicalFingerprint);
    expect(first.roundKey).not.toMatch(/:0$/);
  });

  it("reconciles an ID-less round correction without creating a duplicate", async () => {
    const parserDocumentId = new Types.ObjectId();
    const canonicalProjectId = new Types.ObjectId();
    const bootstrap = createService({ projects: [], canonicalProjectId });
    const identity = {
      sourceDocumentId: parserDocumentId.toHexString(),
      sourceProjectId: "example",
      sourceSlug: "example",
    };
    const oldCandidate = (bootstrap.service as any).normalizeRound(
      { roundName: "Seed", date: "2025-01-01", amount: 1_000_000 },
      0,
      identity,
      canonicalProjectId
    );
    const existingRound = {
      _id: new Types.ObjectId(),
      canonicalProjectId,
      sourceType: "icodrops",
      primarySource: "icodrops",
      sourceId: oldCandidate.sourceId,
      roundKey: oldCandidate.roundKey,
      canonicalFingerprint: oldCandidate.canonicalFingerprint,
      normalizedRoundName: oldCandidate.normalizedRoundName,
      normalizedRoundType: oldCandidate.normalizedRoundType,
      announcedDate: oldCandidate.announcedDate,
      metadata: oldCandidate.metadata,
    };
    const { service, fundingService } = createService({
      canonicalProjectId,
      reconciliationRounds: [existingRound],
      projects: [
        {
          _id: parserDocumentId,
          source: "icodrops",
          sourceId: "example",
          slug: "example",
          name: "Example",
          fundraising: {
            rounds: [
              {
                roundName: "Strategic",
                date: "2025-02-01",
                amount: 2_000_000,
              },
            ],
          },
        },
      ],
    });

    const result = await service.run({ write: true, limit: 1 });

    expect(result.fundingFallbackCreated).toBe(0);
    expect(result.fundingFallbackUpdated).toBe(1);
    expect(fundingService.upsertRoundWithSourcePolicy).toHaveBeenCalledWith(
      expect.objectContaining({
        identityAliases: expect.objectContaining({
          canonicalFingerprints: expect.arrayContaining([
            oldCandidate.canonicalFingerprint,
          ]),
          sourceIds: expect.arrayContaining([oldCandidate.sourceId]),
          roundKeys: expect.arrayContaining([oldCandidate.roundKey]),
        }),
      })
    );
  });

  it("does not overwrite an existing ID-less round when a new slot is appended", async () => {
    const canonicalProjectId = new Types.ObjectId();
    const parserDocumentId = new Types.ObjectId().toHexString();
    const { service, fundingRoundModel } = createService({
      canonicalProjectId,
      projects: [],
      reconciliationRounds: [
        {
          _id: new Types.ObjectId(),
          canonicalProjectId,
          sourceType: "icodrops",
          normalizedRoundName: "seed_round",
          normalizedRoundType: "seed",
          announcedDate: new Date("2025-01-01T00:00:00.000Z"),
          metadata: {
            importer: "fomo-v2:icodrops-funding-fallback",
            sourceDocumentId: parserDocumentId,
            sourcePath: "fundraising.rounds.0",
          },
        },
      ],
    });
    const appended = (service as any).normalizeRound(
      { roundName: "Seed", date: "2025-06-01", amount: 5_000_000 },
      1,
      {
        sourceDocumentId: parserDocumentId,
        sourceProjectId: "example",
        sourceSlug: "example",
      },
      canonicalProjectId
    );

    await expect(
      (service as any).findExistingFallbackRound(appended)
    ).resolves.toBeNull();
    expect(fundingRoundModel.find).toHaveBeenCalledTimes(1);
  });

  it("does not weak-match two provider rounds with different ids on the same date/type", async () => {
    const { service, canonicalProjectId, fundingRoundModel } = createService({
      projects: [],
    });
    const identity = {
      sourceDocumentId: "parser-doc",
      sourceProjectId: "example",
      sourceSlug: "example",
    };
    const common = {
      roundName: "Seed",
      date: "2025-01-01",
      amount: 1000000,
    };
    const first = (service as any).normalizeRound(
      { ...common, id: "provider-round-a" },
      0,
      identity,
      canonicalProjectId
    );
    const second = (service as any).normalizeRound(
      { ...common, id: "provider-round-b" },
      1,
      identity,
      canonicalProjectId
    );

    expect(first.sourceId).toBe("provider-round-a");
    expect(second.sourceId).toBe("provider-round-b");
    expect(first.roundKey).not.toBe(second.roundKey);
    expect(first.canonicalFingerprint).not.toBe(second.canonicalFingerprint);
    expect(first.legacyCanonicalFingerprint).toBeUndefined();
    expect(first.legacyRoundKey).toBeUndefined();
    expect(second.legacyCanonicalFingerprint).toBeUndefined();
    expect(second.legacyRoundKey).toBeUndefined();

    await (service as any).findExistingFallbackRound(second);
    const calls = fundingRoundModel.findOne.mock.calls as any[];
    const filter = calls[calls.length - 1][0] as any;
    expect(filter.$or).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          primarySource: expect.any(RegExp),
          sourceId: "provider-round-b",
        }),
        expect.objectContaining({
          sourceType: expect.any(RegExp),
          roundKey: second.roundKey,
        }),
      ])
    );
    const weakDateMatch = filter.$or.find(
      (candidate: any) => candidate.normalizedRoundType === "seed"
    );
    expect(weakDateMatch.$and).toEqual([
      {
        $or: [
          { sourceId: { $exists: false } },
          { sourceId: null },
          { sourceId: "" },
        ],
      },
      {
        $or: [
          { roundKey: { $exists: false } },
          { roundKey: null },
          { roundKey: "" },
        ],
      },
    ]);
  });

  it("matches the exact index-derived v1 identity when rerunning a legacy round", async () => {
    const existingRoundId = new Types.ObjectId();
    const { service, fundingRoundModel, fundingService } = createService({
      primaryRows: 0,
      existingRound: { _id: existingRoundId },
      projects: [
        {
          _id: new Types.ObjectId(),
          source: "icodrops",
          sourceId: "example",
          slug: "example",
          name: "Example",
          fundraising: {
            rounds: [
              {
                roundName: "Seed",
                date: "2025-01-01",
                amount: 1000000,
              },
            ],
          },
        },
      ],
    });

    const result = await service.run({ write: true, limit: 1 });

    const writeInput = fundingService.upsertFundingRound.mock.calls[0][0];
    expect(writeInput.identityAliases.canonicalFingerprints).toHaveLength(1);
    expect(writeInput.identityAliases.canonicalFingerprints[0]).not.toBe(
      writeInput.canonicalFingerprint
    );
    expect(writeInput.identityAliases.sourceIds).toEqual([
      expect.stringMatching(/^icodrops:example:seed:2025_01_01:/),
    ]);
    expect(writeInput.identityAliases.roundKeys).toEqual(
      writeInput.identityAliases.sourceIds
    );

    const lookupFilter = (fundingRoundModel.findOne.mock.calls as any[])[0][0];
    expect(lookupFilter.$or).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          primarySource: expect.any(RegExp),
          sourceId: writeInput.identityAliases.sourceIds[0],
        }),
        expect.objectContaining({
          sourceType: expect.any(RegExp),
          roundKey: writeInput.identityAliases.roundKeys[0],
        }),
        expect.objectContaining({
          sourceType: expect.any(RegExp),
          canonicalFingerprint:
            writeInput.identityAliases.canonicalFingerprints[0],
        }),
      ])
    );
    const scopedPatterns = lookupFilter.$or
      .map((candidate: any) => candidate.sourceType || candidate.primarySource)
      .filter(Boolean);
    expect(
      scopedPatterns.every((pattern: RegExp) => pattern.test("ico-drops"))
    ).toBe(true);
    expect(
      scopedPatterns.some((pattern: RegExp) => pattern.test("dropstab"))
    ).toBe(false);
    expect(result.fundingFallbackWouldUpdate).toBe(1);
    expect(result.fundingFallbackUpdated).toBe(1);
    expect(result.fundingFallbackCreated).toBe(0);
  });

  it("does not use fundraising.totalRaised as canonical round amount", async () => {
    const { service, fundingService } = createService({
      primaryRows: 0,
      projects: [
        {
          _id: new Types.ObjectId(),
          source: "icodrops",
          sourceId: "total-raised-only",
          slug: "total-raised-only",
          detailUrl: "https://icodrops.com/total-raised-only",
          name: "Total Raised Only",
          fundraising: {
            totalRaised: 999000000,
            rounds: [{ roundName: "Seed", date: "2025-01-01" }],
          },
        },
      ],
    });

    await service.run({ write: true, limit: 1 });

    expect(fundingService.upsertFundingRound).toHaveBeenCalledWith(
      expect.not.objectContaining({ raisedAmount: 999000000 })
    );
    expect(fundingService.upsertFundingRound).toHaveBeenCalledWith(
      expect.objectContaining({ raisedAmount: undefined })
    );
  });

  it("keeps saleRounds profile-only and never creates domain rows from saleRounds", async () => {
    const { service, fundingService } = createService({
      primaryRows: 0,
      projects: [
        {
          _id: new Types.ObjectId(),
          source: "icodrops",
          slug: "sale-only",
          name: "Sale Only",
          saleRounds: [
            { roundName: "Private Sale", amount: 100 },
            { roundName: "Public Sale", amount: 200 },
          ],
        },
      ],
    });

    const result = await service.run({ write: true, limit: 1, debug: true });

    expect(result.saleRoundsStoredAsProfileOnly).toBe(2);
    expect(result.saleRoundsDomainWritesBlocked).toBe(2);
    expect(result.roundsFound).toBe(0);
    expect(fundingService.upsertFundingRound).not.toHaveBeenCalled();
  });

  it("keeps ICODrops tokenomics and vesting/unlocks profile-only", async () => {
    const { service, fundingService } = createService({
      primaryRows: 0,
      projects: [
        {
          _id: new Types.ObjectId(),
          source: "icodrops",
          sourceId: "tokenomics-project",
          slug: "tokenomics-project",
          detailUrl: "https://icodrops.com/tokenomics-project",
          name: "Tokenomics Project",
          tokenomics: {
            allocations: [{ name: "Team", percent: 20 }],
            vesting: {
              schedule: "12 month cliff",
              unlocks: [{ date: "2026-01-01", percent: 10 }],
            },
          },
          fundraising: {
            rounds: [{ roundName: "Seed", date: "2025-01-01" }],
          },
        },
      ],
    });

    const result = await service.run({ write: true, limit: 1, debug: true });

    expect(result.tokenomicsStoredAsProfileOnly).toBe(1);
    expect(result.vestingWritesBlocked).toBe(1);
    expect(result.unlockWritesBlocked).toBe(1);
    expect(result.fundingFallbackCreated).toBe(1);
    expect(fundingService.upsertFundingRound).toHaveBeenCalledTimes(1);
  });

  it("skips Kalshi-like ambiguous fallback funding until manual review", async () => {
    const { service, fundingService } = createService({
      primaryRows: 0,
      projects: [
        {
          _id: new Types.ObjectId(),
          source: "icodrops",
          sourceId: "kalshi",
          slug: "kalshi",
          detailUrl: "https://icodrops.com/kalshi",
          name: "Kalshi",
          fundraising: {
            rounds: [{ roundName: "Series E", date: "2025-11-21" }],
          },
        },
      ],
    });

    const result = await service.run({ write: true, limit: 1, debug: true });

    expect(result.ambiguousCanonicalProjectsSkipped).toBe(1);
    expect(result.skipped.byReason.ambiguous_canonical_project).toBe(1);
    expect(result.fundingFallbackCreated).toBe(0);
    expect(fundingService.upsertFundingRound).not.toHaveBeenCalled();
  });
});
