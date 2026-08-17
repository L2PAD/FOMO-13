import { Types } from "mongoose";
import { CanonicalProjectService } from "./services/canonical-project.service";
import { CanonicalProjectLinkService } from "./services/canonical-project-link.service";
import { CanonicalProjectResolverAdapter } from "./services/canonical-project-resolver.adapter";
import { CanonicalProjectBackfillService } from "./services/canonical-project-backfill.service";
import { parseArgs } from "./canonical-projects.runner";
import { ProjectSchema } from "src/projects/project.model";
import { FundingRoundSchema } from "src/funding-rounds/models/funding-round.model";
import { TokenUnlockSchema } from "src/token-unlocks/models/token-unlock.model";
import { CryptoActivitySchema } from "src/crypto-activities/models/crypto-activity.model";

const query = <T>(value: T) => ({
  lean: jest.fn().mockResolvedValue(value),
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
});

const mongooseQuery = <T>(value: T) => {
  const chain: any = {
    lean: jest.fn(() => chain),
    sort: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    select: jest.fn(() => chain),
    then: (resolve: any, reject: any) => Promise.resolve(value).then(resolve, reject),
    catch: (reject: any) => Promise.resolve(value).catch(reject),
  };
  return chain;
};

function createBackfillService(overrides: Record<string, any> = {}) {
  const projectModel = overrides.projectModel || { find: jest.fn().mockReturnValue(mongooseQuery([])) };
  const fundingRoundModel = overrides.fundingRoundModel || { find: jest.fn().mockReturnValue(mongooseQuery([])) };
  const tokenUnlockModel = overrides.tokenUnlockModel || { find: jest.fn().mockReturnValue(mongooseQuery([])) };
  const emptyModel = { find: jest.fn().mockReturnValue(mongooseQuery([])) };

  return new CanonicalProjectBackfillService(
    projectModel as any,
    fundingRoundModel as any,
    tokenUnlockModel as any,
    (overrides.projectChartHistoryModel || emptyModel) as any,
    (overrides.projectComparisonSnapshotModel || emptyModel) as any,
    (overrides.cryptoActivityModel || emptyModel) as any,
    (overrides.projectExchangeTickerCacheModel || emptyModel) as any,
    (overrides.projectSourceMapModel || emptyModel) as any,
    (overrides.canonicalProjectModel || { find: jest.fn().mockReturnValue(mongooseQuery([])) }) as any,
    (overrides.canonicalProjectLinkModel || { find: jest.fn().mockReturnValue(mongooseQuery([])) }) as any,
    (overrides.canonicalProjectLinkAuditLogModel || { insertMany: jest.fn(), create: jest.fn() }) as any,
    (overrides.resolverAdapter || { resolveAndLink: jest.fn().mockResolvedValue({ status: "skipped", confidence: 0, matchedBy: "none", reason: "test", linksCreated: 0, conflicts: [] }) }) as any,
    (overrides.canonicalProjectService || {
      mergeMarketProjectPair: jest.fn().mockResolvedValue({ status: "success", dryRun: true, wouldHaveBothPrimaryIds: true }),
    }) as any,
    overrides.projectCandidateService as any,
  );
}

describe("Canonical project foundation", () => {
  it("canonical runner parses only explicitly requested entity types", () => {
    const args = parseArgs([
      "--dry-run",
      "--scan-limit=24000",
      "--entity-types=projects,fundingRounds,tokenUnlocks",
      "--progress-every=100",
      "--concurrency=10",
      "--bulk",
    ]);

    expect(args.entityTypes).toEqual(["projects", "fundingRounds", "tokenUnlocks"]);
    expect(args.scanLimit).toBe(24000);
    expect(args.progressEvery).toBe(100);
    expect(args.concurrency).toBe(10);
    expect(args.bulk).toBe(true);
  });

  it("canonical runner refuses to default to all entity types without explicit entity-types", () => {
    expect(() => parseArgs(["--dry-run", "--scan-limit=24000"])).toThrow(/Missing required --entity-types/);
  });

  it("canonical runner rejects joined CLI options before scanning", () => {
    expect(() =>
      parseArgs([
        "--dry-run",
        "--scan-limit=24000--entity-types=projects,fundingRounds,tokenUnlocks",
        "--progress-every=100",
      ]),
    ).toThrow(/joined together|miss a space/i);
  });

  it("reuses the same CanonicalProject for the same provider id", async () => {
    const existing = { _id: new Types.ObjectId(), providerIds: { coingeckoId: "bitcoin" } };
    const canonicalModel = {
      findOne: jest.fn().mockReturnValueOnce(query(null)).mockReturnValueOnce(query(existing)),
      create: jest.fn(),
    };

    const service = new CanonicalProjectService(
      canonicalModel as any,
      {} as any,
      { create: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const result = await service.findOrCreateFromProject({
      _id: new Types.ObjectId(),
      name: "Bitcoin",
      symbol: "BTC",
      coingeckoId: "bitcoin",
    });

    expect(result).toBe(existing);
    expect(canonicalModel.create).not.toHaveBeenCalled();
  });

  it("keeps Project links idempotent", async () => {
    const canonicalProjectId = new Types.ObjectId();
    const entityId = new Types.ObjectId();
    const existing = {
      _id: new Types.ObjectId(),
      canonicalProjectId,
      entityType: "project",
      entityId,
      status: "proposed",
      confidence: 70,
    };
    const linkModel = {
      findOne: jest.fn().mockReturnValueOnce(query(existing)),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };
    const auditModel = { create: jest.fn() };
    const service = new CanonicalProjectLinkService(linkModel as any, auditModel as any);

    const result = await service.ensureLink({
      canonicalProjectId,
      entityType: "project",
      entityId,
      confidence: 70,
      status: "proposed",
    });

    expect((result as any).idempotent).toBe(true);
    expect(linkModel.create).not.toHaveBeenCalled();
    expect(auditModel.create).not.toHaveBeenCalled();
  });

  it("resolves FundingRound market/project projectLinks to one CanonicalProject", async () => {
    const marketId = new Types.ObjectId();
    const icoId = new Types.ObjectId();
    const canonicalProjectId = new Types.ObjectId();
    const fundingRoundId = new Types.ObjectId();
    const market = { _id: marketId, projectType: "market", name: "Aptos", symbol: "APT", source: "coingecko", sourceId: "aptos" };
    const ico = { _id: icoId, projectType: "project", name: "Aptos", symbol: "APT", source: "icodrops", sourceId: "aptos" };

    const adapter = new CanonicalProjectResolverAdapter(
      { find: jest.fn().mockReturnValue(query([market, ico])) } as any,
      {} as any,
      {
        findOrCreateFromProject: jest.fn().mockResolvedValue({ _id: canonicalProjectId }),
        providerIdsFromProject: jest.fn().mockReturnValue({}),
        attachProjectSourceRef: jest.fn().mockResolvedValue(undefined),
        markDataQuality: jest.fn().mockResolvedValue(undefined),
      } as any,
      {
        ensureLink: jest.fn(async (input) => ({ status: input.status, linksCreated: 1 })),
      } as any,
    );

    const result = await adapter.resolveAndLink({
      entityType: "fundingRound",
      entityId: fundingRoundId,
      projectLinks: [
        { projectId: marketId, projectType: "market", confidence: "high" },
        { projectId: icoId, projectType: "project", confidence: "high" },
      ],
    });

    expect(result.canonicalProjectId).toEqual(canonicalProjectId);
    expect(result.status).toBe("verified");
    expect(result.linksCreated).toBe(3);
  });

  it("does not link FundingRound when projectLinks point to different CanonicalProjects", async () => {
    const marketId = new Types.ObjectId();
    const profileId = new Types.ObjectId();
    const marketCanonicalId = new Types.ObjectId();
    const profileCanonicalId = new Types.ObjectId();
    const fundingRoundId = new Types.ObjectId();
    const market = { _id: marketId, projectType: "market", name: "Market", symbol: "MKT" };
    const profile = { _id: profileId, projectType: "project", name: "Profile", symbol: "PRF" };
    const ensureLink = jest.fn();
    const findOrCreateFromProject = jest.fn();

    const adapter = new CanonicalProjectResolverAdapter(
      { find: jest.fn().mockReturnValue(query([market, profile])) } as any,
      {} as any,
      {
        findCanonicalByProjectId: jest.fn(async (projectId) => {
          if (String(projectId) === String(marketId)) return { _id: marketCanonicalId, primaryMarketProjectId: marketId };
          if (String(projectId) === String(profileId)) return { _id: profileCanonicalId, primaryProjectId: profileId };
          return null;
        }),
        findOrCreateFromProject,
        providerIdsFromProject: jest.fn().mockReturnValue({}),
        attachProjectSourceRef: jest.fn().mockResolvedValue(undefined),
        markDataQuality: jest.fn().mockResolvedValue(undefined),
      } as any,
      { ensureLink } as any,
    );

    const result = await adapter.resolveAndLink({
      entityType: "fundingRound",
      entityId: fundingRoundId,
      projectLinks: [
        { projectId: marketId, projectType: "market", confidence: "high" },
        { projectId: profileId, projectType: "project", confidence: "high" },
      ],
    });

    expect(result.status).toBe("conflict");
    expect(result.linksCreated).toBe(0);
    expect(result.ambiguous).toBe(true);
    expect(ensureLink).not.toHaveBeenCalled();
    expect(findOrCreateFromProject).not.toHaveBeenCalled();
  });

  it("does not verify TokenUnlock symbol-only matches", async () => {
    const projectId = new Types.ObjectId();
    const canonicalProjectId = new Types.ObjectId();
    const unlockId = new Types.ObjectId();
    const project = { _id: projectId, projectType: "project", name: "Example", symbol: "EX" };
    const ensureLink = jest.fn(async (input) => ({ status: input.status, linksCreated: 1 }));

    const adapter = new CanonicalProjectResolverAdapter(
      { find: jest.fn().mockReturnValue(query([project])) } as any,
      {
        resolve: jest.fn().mockResolvedValue({
          projectId,
          projectType: "project",
          projectLinks: [{ projectId, projectType: "project", confidence: "low", matchedBy: "symbol" }],
          confidence: "low",
          matchedBy: "symbol",
          reason: "Symbol-only match is report-only and unsafe for automatic writes.",
          unsafe: true,
        }),
      } as any,
      {
        findOrCreateFromProject: jest.fn().mockResolvedValue({ _id: canonicalProjectId }),
        providerIdsFromProject: jest.fn().mockReturnValue({}),
        attachProjectSourceRef: jest.fn().mockResolvedValue(undefined),
        markDataQuality: jest.fn().mockResolvedValue(undefined),
      } as any,
      { ensureLink } as any,
    );

    const result = await adapter.resolveAndLink({
      entityType: "tokenUnlock",
      entityId: unlockId,
      symbol: "EX",
    });

    const entityLinkInput = ensureLink.mock.calls.find((call) => call[0].entityType === "tokenUnlock")?.[0];
    expect(result.status).toBe("skipped");
    expect(result.unsafe).toBe(true);
    expect(entityLinkInput).toBeUndefined();
  });

  it("does not link FundingRound from weak resolver-only matches", async () => {
    const projectId = new Types.ObjectId();
    const roundId = new Types.ObjectId();
    const project = { _id: projectId, projectType: "project", name: "Weak Match", symbol: "WEAK" };
    const findOrCreateFromProject = jest.fn().mockResolvedValue({ _id: new Types.ObjectId() });
    const ensureLink = jest.fn(async (input) => ({ status: input.status, linksCreated: 1 }));

    const adapter = new CanonicalProjectResolverAdapter(
      { find: jest.fn().mockReturnValue(query([project])) } as any,
      {
        resolve: jest.fn().mockResolvedValue({
          projectId,
          projectType: "project",
          projectLinks: [{ projectId, projectType: "project", confidence: "medium", matchedBy: "normalizedName" }],
          confidence: "medium",
          matchedBy: "normalizedName",
          reason: "Unique normalized name match.",
          unsafe: false,
        }),
      } as any,
      {
        findOrCreateFromProject,
        providerIdsFromProject: jest.fn().mockReturnValue({}),
        attachProjectSourceRef: jest.fn().mockResolvedValue(undefined),
        markDataQuality: jest.fn().mockResolvedValue(undefined),
      } as any,
      { ensureLink } as any,
    );

    const result = await adapter.resolveAndLink({
      entityType: "fundingRound",
      entityId: roundId,
      name: "Weak Match",
    });

    expect(result.status).toBe("skipped");
    expect(result.confidence).toBe(70);
    expect(result.matchedBy).toBe("normalizedName");
    expect(findOrCreateFromProject).not.toHaveBeenCalled();
    expect(ensureLink).not.toHaveBeenCalled();
  });

  it("keeps CryptoActivity weak matches proposed", async () => {
    const projectId = new Types.ObjectId();
    const canonicalProjectId = new Types.ObjectId();
    const activityId = new Types.ObjectId();
    const project = { _id: projectId, projectType: "project", name: "Example", symbol: "EX" };

    const adapter = new CanonicalProjectResolverAdapter(
      { find: jest.fn().mockReturnValue(query([project])) } as any,
      {
        resolve: jest.fn().mockResolvedValue({
          projectId,
          projectType: "project",
          projectLinks: [{ projectId, projectType: "project", confidence: "medium", matchedBy: "normalizedName" }],
          confidence: "medium",
          matchedBy: "normalizedName",
          reason: "Unique normalized name match.",
          unsafe: false,
        }),
      } as any,
      {
        findOrCreateFromProject: jest.fn().mockResolvedValue({ _id: canonicalProjectId }),
        providerIdsFromProject: jest.fn().mockReturnValue({}),
        attachProjectSourceRef: jest.fn().mockResolvedValue(undefined),
        markDataQuality: jest.fn().mockResolvedValue(undefined),
      } as any,
      {
        ensureLink: jest.fn(async (input) => ({ status: input.status, linksCreated: 1 })),
      } as any,
    );

    const result = await adapter.resolveAndLink({
      entityType: "cryptoActivity",
      entityId: activityId,
      name: "Example",
    });

    expect(result.status).toBe("proposed");
    expect(result.confidence).toBe(70);
  });

  it("does not overwrite an existing verified link on conflict", async () => {
    const canonicalProjectId = new Types.ObjectId();
    const otherCanonicalProjectId = new Types.ObjectId();
    const entityId = new Types.ObjectId();
    const existingVerified = {
      _id: new Types.ObjectId(),
      canonicalProjectId: otherCanonicalProjectId,
      entityType: "fundingRound",
      entityId,
      status: "verified",
    };
    const linkModel = {
      findOne: jest.fn().mockReturnValueOnce(query(null)).mockReturnValueOnce(query(existingVerified)),
      create: jest.fn().mockImplementation(async (payload) => ({ toObject: () => ({ _id: new Types.ObjectId(), ...payload }) })),
      findByIdAndUpdate: jest.fn(),
    };
    const auditModel = { create: jest.fn() };
    const service = new CanonicalProjectLinkService(linkModel as any, auditModel as any);

    const result = await service.ensureLink({
      canonicalProjectId,
      entityType: "fundingRound",
      entityId,
      confidence: 100,
      status: "verified",
    });

    expect(result.status).toBe("conflict");
    expect(linkModel.findByIdAndUpdate).not.toHaveBeenCalledWith(existingVerified._id, expect.anything(), expect.anything());
    expect(linkModel.create.mock.calls[0][0].status).toBe("conflict");
    expect(existingVerified.status).toBe("verified");
  });

  it("does not write in dry-run mode", async () => {
    const linkModel = {
      findOne: jest.fn().mockReturnValueOnce(query(null)),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };
    const auditModel = { create: jest.fn() };
    const service = new CanonicalProjectLinkService(linkModel as any, auditModel as any);

    const result = await service.ensureLink(
      {
        canonicalProjectId: new Types.ObjectId(),
        entityType: "tokenUnlock",
        entityId: new Types.ObjectId(),
        confidence: 70,
        status: "proposed",
      },
      { dryRun: true },
    );

    expect(result.dryRun).toBe(true);
    expect(linkModel.create).not.toHaveBeenCalled();
    expect(linkModel.findByIdAndUpdate).not.toHaveBeenCalled();
    expect(auditModel.create).not.toHaveBeenCalled();
  });

  it("does not create CanonicalProject from a resolved link without legacy Project._id", async () => {
    const canonicalModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    const service = new CanonicalProjectService(
      canonicalModel as any,
      {} as any,
      { create: jest.fn() } as any,
      { findById: jest.fn() } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const result = await service.findOrCreateFromResolvedProjectLink({ name: "Orphan Round Project", symbol: "ORP" }, { dryRun: true });

    expect(result).toBeNull();
    expect(canonicalModel.create).not.toHaveBeenCalled();
  });

  it("routes FundingRound without legacy Project._id to ProjectCandidate instead of CanonicalProject", async () => {
    const round = {
      _id: new Types.ObjectId(),
      source: "dropstab",
      sourceId: "dropstab:funding:1",
      projectName: "Orphan Round",
      coinSlug: "orphan-round",
      coinSymbol: "ORPH",
    };
    const projectCandidateService = {
      proposeCandidate: jest.fn(async (input) => ({
        wouldCreate: true,
        candidate: {
          _id: new Types.ObjectId(),
          ...input,
          evidenceType: "fundingRound",
          status: "new",
        },
      })),
    };
    const service = createBackfillService({
      fundingRoundModel: { find: jest.fn().mockReturnValue(mongooseQuery([round])) },
      projectCandidateService,
    });

    const summary = await service.runBackfill({ dryRun: true, entityTypes: ["fundingRounds"], scanLimit: 1 });

    expect(summary.wouldCreate.canonicalProjects).toBe(0);
    expect(summary.wouldCreate.canonicalLinks).toBe(0);
    expect(summary.wouldCreate.projectCandidates).toBe(1);
    expect(projectCandidateService.proposeCandidate).toHaveBeenCalledWith(
      expect.objectContaining({
        evidenceType: "fundingRound",
        evidenceEntityId: round._id,
        suggestedProjectType: "project",
      }),
      expect.objectContaining({ dryRun: true }),
    );
  });

  it("routes TokenUnlock symbol-only evidence to unsafe ProjectCandidate instead of CanonicalProject", async () => {
    const unlock = {
      _id: new Types.ObjectId(),
      source: "dropstab",
      coinSymbol: "ONLY",
    };
    const projectCandidateService = {
      proposeCandidate: jest.fn(async (input) => ({
        wouldCreate: true,
        candidate: {
          _id: new Types.ObjectId(),
          ...input,
          evidenceType: "tokenUnlock",
          status: "new",
        },
      })),
    };
    const service = createBackfillService({
      tokenUnlockModel: { find: jest.fn().mockReturnValue(mongooseQuery([unlock])) },
      resolverAdapter: {
        resolveAndLink: jest.fn().mockResolvedValue({
          status: "skipped",
          confidence: 40,
          matchedBy: "symbol",
          reason: "Symbol-only match is report-only and unsafe for automatic writes.",
          linksCreated: 0,
          conflicts: [],
          unsafe: true,
        }),
      },
      projectCandidateService,
    });

    const summary = await service.runBackfill({ dryRun: true, entityTypes: ["tokenUnlocks"], scanLimit: 1 });

    expect(summary.wouldCreate.canonicalProjects).toBe(0);
    expect(summary.wouldCreate.projectCandidates).toBe(1);
    expect(summary.projectCandidates.examples.unsafe[0].warnings).toContain("symbol-only unsafe");
  });

  it("leaves current public legacy schemas without canonicalProjectId contract changes", () => {
    expect(ProjectSchema.path("projectType")).toBeTruthy();
    expect(FundingRoundSchema.path("projectId")).toBeTruthy();
    expect(FundingRoundSchema.path("projectLinks")).toBeTruthy();
    expect(TokenUnlockSchema.path("projectId")).toBeTruthy();
    expect(TokenUnlockSchema.path("projectLinks")).toBeTruthy();
    expect(CryptoActivitySchema.path("coinSlug")).toBeTruthy();

    expect(ProjectSchema.path("canonicalProjectId")).toBeUndefined();
    expect(FundingRoundSchema.path("canonicalProjectId")).toBeUndefined();
    expect(TokenUnlockSchema.path("canonicalProjectId")).toBeUndefined();
    expect(CryptoActivitySchema.path("canonicalProjectId")).toBeUndefined();
  });

  it("project-type=market filters project dry-run to market projects", async () => {
    const projectModel = { find: jest.fn().mockReturnValue(mongooseQuery([])) };
    const service = createBackfillService({ projectModel });

    await service.runBackfill({ dryRun: true, entityTypes: ["projects"], projectType: "market", scanLimit: 100 });

    expect(projectModel.find).toHaveBeenCalledWith({ projectType: "market" });
  });

  it("project-type=project filters project dry-run to project profile docs", async () => {
    const projectModel = { find: jest.fn().mockReturnValue(mongooseQuery([])) };
    const service = createBackfillService({ projectModel });

    await service.runBackfill({ dryRun: true, entityTypes: ["projects"], projectType: "project", scanLimit: 100 });

    expect(projectModel.find).toHaveBeenCalledWith({ projectType: "project" });
  });

  it("bulk project apply writes CanonicalProject, link, and audit records without per-document resolver calls", async () => {
    const market = {
      _id: new Types.ObjectId(),
      projectType: "market",
      name: "Bitcoin",
      slug: "bitcoin",
      symbol: "BTC",
      coingeckoId: "bitcoin",
    };
    const profile = {
      _id: new Types.ObjectId(),
      projectType: "project",
      name: "New Profile",
      slug: "new-profile",
      symbol: "NEW",
    };
    const projectModel = { find: jest.fn().mockReturnValue(mongooseQuery([market, profile])) };
    const canonicalProjectModel = { bulkWrite: jest.fn().mockResolvedValue({}) };
    const canonicalProjectLinkModel = { bulkWrite: jest.fn().mockResolvedValue({}) };
    const canonicalProjectLinkAuditLogModel = { insertMany: jest.fn().mockResolvedValue([]) };
    const resolverAdapter = { resolveAndLink: jest.fn() };
    const service = createBackfillService({
      projectModel,
      canonicalProjectModel,
      canonicalProjectLinkModel,
      canonicalProjectLinkAuditLogModel,
      resolverAdapter,
    });

    const summary = await service.runBackfill({
      apply: true,
      confirmApply: true,
      bulk: true,
      entityTypes: ["projects"],
      scanLimit: 2,
    });

    expect(summary.scanned.projects).toBe(2);
    expect(summary.wouldCreate.canonicalProjects).toBe(2);
    expect(summary.wouldCreate.canonicalLinks).toBe(2);
    expect(summary.byEntityType.project.verified).toBe(1);
    expect(summary.byEntityType.project.proposed).toBe(1);
    expect(canonicalProjectModel.bulkWrite).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ ordered: false }));
    expect(canonicalProjectLinkModel.bulkWrite).toHaveBeenCalledWith(expect.any(Array), expect.objectContaining({ ordered: false }));
    expect(canonicalProjectLinkAuditLogModel.insertMany).toHaveBeenCalledWith(expect.any(Array), { ordered: false });
    expect(resolverAdapter.resolveAndLink).not.toHaveBeenCalled();
  });

  it("bulk apply merges verified market/project pairs into one canonical node", async () => {
    const market = { _id: new Types.ObjectId(), projectType: "market", name: "Celestia", slug: "celestia", symbol: "TIA" };
    const profile = { _id: new Types.ObjectId(), projectType: "project", name: "Celestia", slug: "celestia", symbol: "TIA" };
    const projectModel = {
      find: jest.fn((filter) => {
        if (filter.projectType === "market") return mongooseQuery([market]);
        if (filter.projectType === "project") return mongooseQuery([profile]);
        return mongooseQuery([market, profile]);
      }),
    };
    const canonicalProjectModel = {
      bulkWrite: jest.fn().mockResolvedValue({}),
      find: jest.fn().mockReturnValue(
        mongooseQuery([
          { _id: market._id, primaryMarketProjectId: market._id, sourceRefs: [{ projectId: market._id }] },
          { _id: profile._id, primaryProjectId: profile._id, sourceRefs: [{ projectId: profile._id }] },
        ]),
      ),
    };
    const canonicalProjectLinkModel = {
      bulkWrite: jest.fn().mockResolvedValue({}),
      find: jest.fn().mockReturnValue(mongooseQuery([])),
    };
    const canonicalProjectLinkAuditLogModel = { insertMany: jest.fn().mockResolvedValue([]) };
    const mergeMarketProjectPair = jest.fn();
    const service = createBackfillService({
      projectModel,
      canonicalProjectModel,
      canonicalProjectLinkModel,
      canonicalProjectLinkAuditLogModel,
      canonicalProjectService: { mergeMarketProjectPair },
    });

    const summary = await service.runBackfill({
      apply: true,
      confirmApply: true,
      bulk: true,
      entityTypes: ["projects"],
      scanLimit: 2,
      checkMarketProjectPairs: true,
    });

    expect(summary.marketProjectPairing.verifiedPairs).toBe(1);
    expect(summary.marketProjectPairing.appliedPairs).toBe(1);
    expect(summary.marketProjectPairing.mergedCanonicalProjects).toBe(1);
    expect(summary.canonicalProjectShape).toEqual({
      wouldHaveBothPrimaryIds: 1,
      marketOnly: 0,
      projectOnly: 0,
      mergedCanonicalProjects: 1,
    });
    expect(mergeMarketProjectPair).not.toHaveBeenCalled();
    expect(canonicalProjectLinkModel.bulkWrite).toHaveBeenCalledWith(
      [expect.objectContaining({ updateMany: expect.objectContaining({ filter: { canonicalProjectId: profile._id } }) })],
      expect.objectContaining({ ordered: false }),
    );
    expect(canonicalProjectModel.bulkWrite).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ deleteOne: { filter: { _id: profile._id } } }),
        expect.objectContaining({
          updateOne: expect.objectContaining({
            filter: { _id: market._id },
            update: expect.objectContaining({
              $set: expect.objectContaining({
                primaryMarketProjectId: market._id,
                primaryProjectId: profile._id,
              }),
            }),
          }),
        }),
      ]),
      expect.objectContaining({ ordered: false }),
    );
  });

  it("pairs market and project profile with the same strong provider signal", async () => {
    const marketId = new Types.ObjectId();
    const profileId = new Types.ObjectId();
    const market = { _id: marketId, projectType: "market", name: "Aptos", slug: "aptos", symbol: "APT", coingeckoId: "aptos" };
    const profile = { _id: profileId, projectType: "project", name: "Aptos", slug: "aptos-ico", symbol: "APT", coingeckoId: "aptos" };
    const projectModel = {
      find: jest.fn((filter) => mongooseQuery(filter.projectType === "market" ? [market] : [profile])),
    };
    const service = createBackfillService({ projectModel });

    const summary = await service.runBackfill({
      dryRun: true,
      entityTypes: ["projects"],
      scanLimit: 1,
      checkMarketProjectPairs: true,
    });

    expect(summary.marketProjectPairing.verifiedPairs).toBe(1);
    expect(summary.marketProjectPairing.examples.paired[0].canonicalProjectShape).toEqual({
      primaryMarketProjectId: String(marketId),
      primaryProjectId: String(profileId),
    });
  });

  it("pairs market and project profile with same slug and symbol when unambiguous", async () => {
    const market = { _id: new Types.ObjectId(), projectType: "market", name: "Celestia", slug: "celestia", symbol: "TIA" };
    const profile = { _id: new Types.ObjectId(), projectType: "project", name: "Celestia", slug: "celestia", symbol: "TIA" };
    const projectModel = {
      find: jest.fn((filter) => mongooseQuery(filter.projectType === "market" ? [market] : [profile])),
    };
    const service = createBackfillService({ projectModel });

    const summary = await service.runBackfill({
      dryRun: true,
      entityTypes: ["projects"],
      scanLimit: 1,
      checkMarketProjectPairs: true,
    });

    expect(summary.marketProjectPairing.verifiedPairs).toBe(1);
    expect(summary.marketProjectPairing.examples.paired[0].matchedBy).toContain("slug+symbol");
  });

  it("applies verified market/project pairing into one CanonicalProject shape", async () => {
    const market = { _id: new Types.ObjectId(), projectType: "market", name: "Celestia", slug: "celestia", symbol: "TIA" };
    const profile = { _id: new Types.ObjectId(), projectType: "project", name: "Celestia", slug: "celestia", symbol: "TIA" };
    const mergeMarketProjectPair = jest.fn().mockResolvedValue({
      status: "success",
      canonicalProjectId: new Types.ObjectId(),
      mergedCanonicalProjects: 1,
    });
    const projectModel = {
      find: jest.fn((filter) => mongooseQuery(filter.projectType === "market" ? [market] : [profile])),
    };
    const service = createBackfillService({
      projectModel,
      canonicalProjectService: { mergeMarketProjectPair },
    });

    const summary = await service.runBackfill({
      apply: true,
      confirmApply: true,
      entityTypes: ["projects"],
      scanLimit: 1,
      checkMarketProjectPairs: true,
    });

    expect(summary.marketProjectPairing.verifiedPairs).toBe(1);
    expect(summary.marketProjectPairing.appliedPairs).toBe(1);
    expect(summary.canonicalProjectShape).toEqual({
      wouldHaveBothPrimaryIds: 1,
      marketOnly: 0,
      projectOnly: 0,
      mergedCanonicalProjects: 1,
    });
    expect(mergeMarketProjectPair).toHaveBeenCalledWith(
      market,
      profile,
      expect.objectContaining({ dryRun: false, matchedBy: "slug+symbol" }),
    );
  });

  it("mergeMarketProjectPair moves separate CanonicalProjects into one active node", async () => {
    const marketId = new Types.ObjectId();
    const profileId = new Types.ObjectId();
    const marketCanonicalId = new Types.ObjectId();
    const profileCanonicalId = new Types.ObjectId();
    const market = { _id: marketId, projectType: "market", name: "Merge Me", slug: "merge-me", symbol: "MRG" };
    const profile = { _id: profileId, projectType: "project", name: "Merge Me", slug: "merge-me", symbol: "MRG" };
    const canonicalModel = {
      findOne: jest
        .fn()
        .mockReturnValueOnce(query({ _id: marketCanonicalId, primaryMarketProjectId: marketId }))
        .mockReturnValueOnce(query({ _id: profileCanonicalId, primaryProjectId: profileId })),
      findByIdAndUpdate: jest.fn().mockResolvedValue({}),
      create: jest.fn(),
    };
    const linkModel = {
      updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      findOne: jest.fn().mockReturnValue(query(null)),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const auditModel = { create: jest.fn() };
    const service = new CanonicalProjectService(
      canonicalModel as any,
      linkModel as any,
      auditModel as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );

    const result = await service.mergeMarketProjectPair(market, profile, {
      matchedBy: "slug+symbol",
      reason: "Same slug and symbol.",
      confidence: 100,
    });

    expect(result.mergedCanonicalProjects).toBe(1);
    expect(linkModel.updateMany).toHaveBeenCalledWith(
      { canonicalProjectId: profileCanonicalId },
      { $set: { canonicalProjectId: marketCanonicalId, updatedAt: expect.any(Date) } },
    );
    expect(canonicalModel.findByIdAndUpdate).toHaveBeenCalledWith(
      profileCanonicalId,
      expect.objectContaining({
        $set: expect.objectContaining({ status: "merged", mergedIntoCanonicalProjectId: marketCanonicalId }),
      }),
    );
    expect(canonicalModel.findByIdAndUpdate).toHaveBeenCalledWith(
      marketCanonicalId,
      expect.objectContaining({
        $set: expect.objectContaining({
          primaryMarketProjectId: marketId,
          primaryProjectId: profileId,
          status: "active",
        }),
      }),
    );
    expect(linkModel.updateOne).toHaveBeenCalledWith(
      { canonicalProjectId: marketCanonicalId, entityType: "project", entityId: marketId },
      expect.anything(),
      { upsert: true },
    );
    expect(linkModel.updateOne).toHaveBeenCalledWith(
      { canonicalProjectId: marketCanonicalId, entityType: "project", entityId: profileId },
      expect.anything(),
      { upsert: true },
    );
  });

  it("keeps symbol-only market/project candidates unsafe and never verified", async () => {
    const market = { _id: new Types.ObjectId(), projectType: "market", name: "Alpha", slug: "alpha", symbol: "AAA" };
    const profile = { _id: new Types.ObjectId(), projectType: "project", name: "Different", slug: "different", symbol: "AAA" };
    const mergeMarketProjectPair = jest.fn();
    const projectModel = {
      find: jest.fn((filter) => mongooseQuery(filter.projectType === "market" ? [market] : [profile])),
    };
    const service = createBackfillService({ projectModel, canonicalProjectService: { mergeMarketProjectPair } });

    const summary = await service.runBackfill({
      dryRun: true,
      entityTypes: ["projects"],
      scanLimit: 1,
      checkMarketProjectPairs: true,
    });

    expect(summary.marketProjectPairing.unsafePairs).toBe(1);
    expect(summary.marketProjectPairing.verifiedPairs).toBe(0);
    expect(mergeMarketProjectPair).not.toHaveBeenCalled();
  });

  it("does not verify ambiguous market/project candidates", async () => {
    const market = { _id: new Types.ObjectId(), projectType: "market", name: "Ambiguous", slug: "ambiguous", symbol: "AMB" };
    const profileA = { _id: new Types.ObjectId(), projectType: "project", name: "Ambiguous A", slug: "ambiguous", symbol: "AMB" };
    const profileB = { _id: new Types.ObjectId(), projectType: "project", name: "Ambiguous B", slug: "ambiguous", symbol: "AMB" };
    const projectModel = {
      find: jest.fn((filter) => mongooseQuery(filter.projectType === "market" ? [market] : [profileA, profileB])),
    };
    const service = createBackfillService({ projectModel });

    const summary = await service.runBackfill({
      dryRun: true,
      entityTypes: ["projects"],
      scanLimit: 2,
      checkMarketProjectPairs: true,
    });

    expect(summary.marketProjectPairing.ambiguousPairs).toBe(1);
    expect(summary.marketProjectPairing.verifiedPairs).toBe(0);
  });

  it("does not merge when multiple market projects point to the same project profile", async () => {
    const profile = { _id: new Types.ObjectId(), projectType: "project", name: "Equilibrium", slug: "equilibrium", symbol: "EQ" };
    const marketA = { _id: new Types.ObjectId(), projectType: "market", name: "Equilibrium Games", slug: "equilibrium", symbol: "EQ" };
    const marketB = { _id: new Types.ObjectId(), projectType: "market", name: "Equilibrium", slug: "equilibrium-2", symbol: "EQ" };
    const mergeMarketProjectPair = jest.fn();
    const projectModel = {
      find: jest.fn((filter) => {
        if (filter.projectType === "market") return mongooseQuery([marketA, marketB]);
        if (filter.projectType === "project") return mongooseQuery([profile]);
        return mongooseQuery([marketA, marketB, profile]);
      }),
    };
    const service = createBackfillService({
      projectModel,
      canonicalProjectService: { mergeMarketProjectPair },
    });

    const summary = await service.runBackfill({
      apply: true,
      confirmApply: true,
      entityTypes: ["projects"],
      scanLimit: 2,
      checkMarketProjectPairs: true,
    });

    expect(summary.marketProjectPairing.conflictPairs).toBe(2);
    expect(summary.marketProjectPairing.verifiedPairs).toBe(0);
    expect(summary.marketProjectPairing.appliedPairs).toBe(0);
    expect(summary.marketProjectPairing.projectOnly).toBe(0);
    expect(mergeMarketProjectPair).not.toHaveBeenCalled();
  });

  it("includes ProjectIntel and ProjectUnlocks as graph enrichment without standalone canonical links", async () => {
    const canonicalProjectId = new Types.ObjectId();
    const projectId = new Types.ObjectId();
    const link = { _id: new Types.ObjectId(), canonicalProjectId, entityType: "project", entityId: projectId, status: "verified" };
    const project = { _id: projectId, projectType: "project", name: "Enriched", slug: "enriched", symbol: "ENR" };
    const projectIntel = {
      projectId,
      profile: { categories: ["Infra"] },
      fundraising: { totalRaised: 100 },
      tokenomics: { fdv: 1000 },
      sourceRefs: { dropstab: { slug: "enriched" } },
    };
    const projectUnlocks = {
      projectId,
      vestingSchedule: [{ date: "2026-01-01" }],
      unlockingEvents: [{ unlockDate: "2026-01-01" }],
      nextUnlockingEvent: { unlockDate: "2026-01-01" },
      sourceRefs: { dropstab: { slug: "enriched" } },
    };
    const service = new CanonicalProjectService(
      { findById: jest.fn().mockReturnValue(mongooseQuery({ _id: canonicalProjectId })) } as any,
      { find: jest.fn().mockReturnValue(mongooseQuery([link])) } as any,
      { create: jest.fn() } as any,
      { find: jest.fn().mockReturnValue(mongooseQuery([project])) } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      { find: jest.fn().mockReturnValue(mongooseQuery([projectIntel])) } as any,
      { find: jest.fn().mockReturnValue(mongooseQuery([projectUnlocks])) } as any,
    );

    const graph = await service.getCanonicalProjectGraph(canonicalProjectId);

    expect(graph.legacyEnrichment.projectIntel.exists).toBe(true);
    expect(graph.legacyEnrichment.projectUnlocks.exists).toBe(true);
    expect(graph.links.some((item) => ["projectIntel", "projectUnlocks"].includes(item.entityType))).toBe(false);
  });
});
