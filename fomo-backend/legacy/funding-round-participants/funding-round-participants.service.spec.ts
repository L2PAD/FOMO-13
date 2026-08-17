import { Types } from "mongoose";
import { FundingRoundSchema } from "src/funding-rounds/models/funding-round.model";
import { FundingRoundParticipantResolverService } from "./services/funding-round-participant-resolver.service";
import { FundingRoundParticipantService } from "./services/funding-round-participant.service";

const mongooseQuery = <T>(value: T) => {
  const chain: any = {
    select: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    sort: jest.fn(() => chain),
    lean: jest.fn(() => chain),
    then: (resolve: any, reject: any) => Promise.resolve(value).then(resolve, reject),
    catch: (reject: any) => Promise.resolve(value).catch(reject),
  };
  return chain;
};

function createResolver({
  funds = [],
  persons = [],
  canonicalProjectId = null,
  fundsFind,
  personsFind,
}: {
  funds?: any[];
  persons?: any[];
  canonicalProjectId?: any;
  fundsFind?: jest.Mock;
  personsFind?: jest.Mock;
} = {}) {
  const fundsModel = { find: fundsFind || jest.fn().mockReturnValue(mongooseQuery(funds)) };
  const personModel = { find: personsFind || jest.fn().mockReturnValue(mongooseQuery(persons)) };
  const canonicalProjectLinkService = {
    resolveCanonicalForEntity: jest.fn().mockResolvedValue({
      status: canonicalProjectId ? "verified" : "skipped",
      canonicalProjectId,
    }),
  };
  return {
    resolver: new FundingRoundParticipantResolverService(fundsModel as any, personModel as any, canonicalProjectLinkService as any),
    fundsModel,
    personModel,
    canonicalProjectLinkService,
  };
}

function createParticipantService(overrides: Record<string, any> = {}) {
  const participantModel = overrides.participantModel || {
    findOne: jest.fn().mockReturnValue(mongooseQuery(null)),
    create: jest.fn(async (payload) => ({ ...payload, _id: new Types.ObjectId(), toObject: () => ({ ...payload, _id: new Types.ObjectId() }) })),
    insertMany: jest.fn(async (payloads) => payloads.map((payload) => ({ ...payload, _id: new Types.ObjectId() }))),
    countDocuments: jest.fn().mockResolvedValue(0),
    distinct: jest.fn().mockResolvedValue([]),
    aggregate: jest.fn().mockResolvedValue([]),
    find: jest.fn().mockReturnValue(mongooseQuery([])),
  };
  const auditLogModel = overrides.auditLogModel || { create: jest.fn() };
  const fundingRoundModel = overrides.fundingRoundModel || {
    find: jest.fn().mockReturnValue(mongooseQuery([])),
  };
  const resolverService = overrides.resolverService || {
    resolveRound: jest.fn().mockResolvedValue({ rawInvestorsScanned: 0, participants: [] }),
  };

  return {
    service: new FundingRoundParticipantService(
      participantModel as any,
      auditLogModel as any,
      fundingRoundModel as any,
      resolverService as any,
      overrides.investorCandidateService as any,
    ),
    participantModel,
    auditLogModel,
    fundingRoundModel,
    resolverService,
  };
}

describe("FundingRoundParticipant foundation", () => {
  it("resolves exact dropstabId to Fund", async () => {
    const fundId = new Types.ObjectId();
    const { resolver } = createResolver({
      funds: [{ _id: fundId, name: "Paradigm", slug: "paradigm", dropstabId: 101 }],
      persons: [],
    });

    const result = await resolver.resolveInvestor({ id: 101, name: "Paradigm", investorSlug: "paradigm" });

    expect(result.matchStatus).toBe("verified");
    expect(result.participantType).toBe("fund");
    expect(String(result.fundId)).toBe(String(fundId));
    expect(result.matchedBy).toBe("dropstabId");
  });

  it("resolves exact dropstabId to Person", async () => {
    const personId = new Types.ObjectId();
    const { resolver } = createResolver({
      funds: [],
      persons: [{ _id: personId, name: "Jane Doe", slug: "jane-doe", dropstabId: 202 }],
    });

    const result = await resolver.resolveInvestor({ id: 202, name: "Jane Doe", investorSlug: "jane-doe" });

    expect(result.matchStatus).toBe("verified");
    expect(result.participantType).toBe("person");
    expect(String(result.personId)).toBe(String(personId));
  });

  it("resolves exact slug match", async () => {
    const fundId = new Types.ObjectId();
    const fundsFind = jest.fn((query) => {
      const serialized = JSON.stringify(query);
      return mongooseQuery(serialized.includes("a16z-crypto") ? [{ _id: fundId, name: "a16z crypto", slug: "a16z-crypto" }] : []);
    });
    const { resolver } = createResolver({ fundsFind, persons: [] });

    const result = await resolver.resolveInvestor({ name: "a16z crypto", investorSlug: "a16z-crypto" });

    expect(result.matchStatus).toBe("verified");
    expect(result.participantType).toBe("fund");
    expect(result.matchedBy).toBe("slug");
  });

  it("marks ambiguous candidates as conflict", async () => {
    const { resolver } = createResolver({
      funds: [{ _id: new Types.ObjectId(), name: "Coinbase Ventures", slug: "coinbase-ventures", dropstabId: 303 }],
      persons: [{ _id: new Types.ObjectId(), name: "Coinbase Ventures", slug: "coinbase-ventures", dropstabId: 303 }],
    });

    const result = await resolver.resolveInvestor({ id: 303, name: "Coinbase Ventures", investorSlug: "coinbase-ventures" });

    expect(result.matchStatus).toBe("conflict");
    expect(result.participantType).toBe("unknown");
    expect(result.candidates).toHaveLength(2);
  });

  it("keeps unmatched investor unmatched", async () => {
    const { resolver } = createResolver({ funds: [], persons: [] });

    const result = await resolver.resolveInvestor({ name: "Unknown Backer", investorSlug: "unknown-backer" });

    expect(result.matchStatus).toBe("unmatched");
    expect(result.participantType).toBe("unknown");
  });

  it("dry-run writes nothing", async () => {
    const roundId = new Types.ObjectId();
    const participant = {
      fundingRoundId: roundId,
      participantType: "fund",
      fundId: new Types.ObjectId(),
      role: "participant",
      sourceInvestorSlug: "test-fund",
      allocationMethod: "unknown",
      confidence: 100,
      matchedBy: "dropstabId",
      matchStatus: "verified",
    };
    const participantModel = {
      findOne: jest.fn().mockReturnValue(mongooseQuery(null)),
      create: jest.fn(),
    };
    const auditLogModel = { create: jest.fn() };
    const fundingRoundModel = {
      find: jest.fn().mockReturnValue(mongooseQuery([{ _id: roundId, investors: [{ id: 1, name: "Test Fund" }] }])),
    };
    const resolverService = {
      resolveRound: jest.fn().mockResolvedValue({ rawInvestorsScanned: 1, participants: [participant] }),
    };
    const { service } = createParticipantService({ participantModel, auditLogModel, fundingRoundModel, resolverService });

    const summary = await service.runBackfill({ dryRun: true, scanLimit: 1 });

    expect(summary.wouldCreate).toBe(1);
    expect(participantModel.create).not.toHaveBeenCalled();
    expect(auditLogModel.create).not.toHaveBeenCalled();
  });

  it("apply skips funding round participant audit logs by default", async () => {
    const roundId = new Types.ObjectId();
    const participant = {
      fundingRoundId: roundId,
      participantType: "fund",
      fundId: new Types.ObjectId(),
      role: "participant",
      sourceInvestorSlug: "test-fund",
      allocationMethod: "unknown",
      confidence: 100,
      matchedBy: "dropstabId",
      matchStatus: "verified",
    };
    const participantModel = {
      findOne: jest.fn().mockReturnValue(mongooseQuery(null)),
      create: jest.fn(async (payload) => ({
        ...payload,
        _id: new Types.ObjectId(),
        toObject: () => ({ ...payload, _id: new Types.ObjectId() }),
      })),
      insertMany: jest.fn(async (payloads) => payloads.map((payload) => ({ ...payload, _id: new Types.ObjectId() }))),
      find: jest.fn().mockReturnValue(mongooseQuery([])),
    };
    const auditLogModel = { create: jest.fn() };
    const fundingRoundModel = {
      find: jest.fn().mockReturnValue(mongooseQuery([{ _id: roundId, investors: [{ id: 1, name: "Test Fund" }] }])),
    };
    const resolverService = {
      resolveRound: jest.fn().mockResolvedValue({ rawInvestorsScanned: 1, participants: [participant] }),
    };
    const { service } = createParticipantService({ participantModel, auditLogModel, fundingRoundModel, resolverService });

    const summary = await service.runBackfill({ apply: true, confirmApply: true, scanLimit: 1 });

    expect(summary.mode).toBe("apply");
    expect(summary.wouldCreate).toBe(1);
    expect(participantModel.insertMany).toHaveBeenCalledTimes(1);
    expect(participantModel.create).not.toHaveBeenCalled();
    expect(auditLogModel.create).not.toHaveBeenCalled();
    expect(summary.warnings).toContain("FundingRoundParticipant audit-log writes are disabled by default for backfill apply.");
  });

  it("can explicitly write participant audit logs when requested", async () => {
    const roundId = new Types.ObjectId();
    const participant = {
      fundingRoundId: roundId,
      participantType: "fund",
      fundId: new Types.ObjectId(),
      role: "participant",
      sourceInvestorSlug: "test-fund",
      allocationMethod: "unknown",
      confidence: 100,
      matchedBy: "dropstabId",
      matchStatus: "verified",
    };
    const participantModel = {
      findOne: jest.fn().mockReturnValue(mongooseQuery(null)),
      create: jest.fn(async (payload) => ({
        ...payload,
        _id: new Types.ObjectId(),
        toObject: () => ({ ...payload, _id: new Types.ObjectId() }),
      })),
      insertMany: jest.fn(),
      find: jest.fn().mockReturnValue(mongooseQuery([])),
    };
    const auditLogModel = { create: jest.fn() };
    const fundingRoundModel = {
      find: jest.fn().mockReturnValue(mongooseQuery([{ _id: roundId, investors: [{ id: 1, name: "Test Fund" }] }])),
    };
    const resolverService = {
      resolveRound: jest.fn().mockResolvedValue({ rawInvestorsScanned: 1, participants: [participant] }),
    };
    const { service } = createParticipantService({ participantModel, auditLogModel, fundingRoundModel, resolverService });

    await service.runBackfill({ apply: true, confirmApply: true, writeAuditLogs: true, scanLimit: 1 });

    expect(participantModel.create).toHaveBeenCalledTimes(1);
    expect(auditLogModel.create).toHaveBeenCalledTimes(1);
  });

  it("creates InvestorCandidate for unmatched investor and keeps unknown participant edge", async () => {
    const roundId = new Types.ObjectId();
    const investorCandidateId = new Types.ObjectId();
    const participant = {
      fundingRoundId: roundId,
      participantType: "unknown",
      role: "participant",
      source: "dropstab",
      sourceInvestorId: "missing-1",
      sourceInvestorSlug: "missing-investor",
      sourceInvestorName: "Missing Investor",
      allocationMethod: "unknown",
      confidence: 0,
      matchedBy: "none",
      reason: "No fund/person candidate matched by dropstab id, source id, source mapping, slug, or normalized name.",
      matchStatus: "unmatched",
      rawInvestor: { id: "missing-1", name: "Missing Investor" },
    };
    const participantModel = {
      findOne: jest.fn().mockReturnValue(mongooseQuery(null)),
      create: jest.fn(),
    };
    const fundingRoundModel = {
      find: jest.fn().mockReturnValue(mongooseQuery([{ _id: roundId, investors: [{ id: "missing-1", name: "Missing Investor" }] }])),
    };
    const resolverService = {
      buildBatchCache: jest.fn().mockResolvedValue(undefined),
      resolveRound: jest.fn().mockResolvedValue({ rawInvestorsScanned: 1, participants: [participant] }),
    };
    const investorCandidateService = {
      proposeCandidate: jest.fn(async (input) => ({
        wouldCreate: true,
        candidate: { _id: investorCandidateId, ...input, status: "new" },
      })),
    };
    const { service } = createParticipantService({
      participantModel,
      fundingRoundModel,
      resolverService,
      investorCandidateService,
    });

    const summary = await service.runBackfill({ dryRun: true, scanLimit: 1 });

    expect(summary.investorCandidates.wouldCreate).toBe(1);
    expect(summary.investorCandidateMatches).toBe(1);
    expect(summary.examples.unmatched[0].investorCandidateId).toBe(String(investorCandidateId));
    expect(investorCandidateService.proposeCandidate).toHaveBeenCalledWith(
      expect.objectContaining({
        evidenceType: "fundingRound",
        fundingRoundId: roundId,
        name: "Missing Investor",
        sourceInvestorSlug: "missing-investor",
      }),
      expect.objectContaining({ dryRun: true }),
    );
  });

  it("participant creation is idempotent", async () => {
    const roundId = new Types.ObjectId();
    const existing = { _id: new Types.ObjectId(), fundingRoundId: roundId, matchStatus: "verified" };
    const participantModel = {
      findOne: jest.fn().mockReturnValue(mongooseQuery(existing)),
      create: jest.fn(),
    };
    const { service } = createParticipantService({ participantModel });

    const result = await service.ensureParticipant({
      fundingRoundId: roundId,
      participantType: "fund",
      fundId: new Types.ObjectId(),
      role: "participant",
      sourceInvestorSlug: "idempotent-fund",
      allocationMethod: "unknown",
      confidence: 100,
      matchedBy: "dropstabId",
      reason: "test",
      matchStatus: "verified",
    } as any);

    expect(result.idempotent).toBe(true);
    expect(participantModel.create).not.toHaveBeenCalled();
  });

  it("resolves canonicalProjectId from FundingRound canonical link", async () => {
    const roundId = new Types.ObjectId();
    const canonicalProjectId = new Types.ObjectId();
    const fundId = new Types.ObjectId();
    const { resolver } = createResolver({
      canonicalProjectId,
      funds: [{ _id: fundId, name: "Dragonfly", slug: "dragonfly", dropstabId: 404 }],
    });

    const result = await resolver.resolveRound({
      _id: roundId,
      projectId: new Types.ObjectId(),
      fundsRaised: 1000000,
      investors: [{ id: 404, name: "Dragonfly", investorSlug: "dragonfly", lead: false }],
      leadInvestors: [],
    } as any);

    expect(String(result.canonicalProjectId)).toBe(String(canonicalProjectId));
    expect(String(result.participants[0].canonicalProjectId)).toBe(String(canonicalProjectId));
  });

  it("flags estimated allocation methods explicitly", async () => {
    const roundId = new Types.ObjectId();
    const { resolver } = createResolver({ funds: [], persons: [] });

    const result = await resolver.resolveRound({
      _id: roundId,
      fundsRaised: 1000000,
      investors: [
        { id: 1, name: "Lead Fund", investorSlug: "lead-fund", lead: true },
        { id: 2, name: "Other Fund", investorSlug: "other-fund" },
      ],
      leadInvestors: [{ id: 1, name: "Lead Fund", investorSlug: "lead-fund" }],
    } as any);

    const lead = result.participants.find((item) => item.sourceInvestorSlug === "lead-fund");
    const other = result.participants.find((item) => item.sourceInvestorSlug === "other-fund");
    expect(lead.allocationMethod).toBe("lead_estimate");
    expect(other.allocationMethod).toBe("equal_split_estimate");
    expect(lead.allocationMethod).not.toBe("exact");
    expect(other.allocationMethod).not.toBe("exact");
  });

  it("does not add participant fields to FundingRound API schema", () => {
    expect(FundingRoundSchema.path("investors")).toBeTruthy();
    expect(FundingRoundSchema.path("projectId")).toBeTruthy();
    expect(FundingRoundSchema.path("projectLinks")).toBeTruthy();
    expect(FundingRoundSchema.path("canonicalProjectId")).toBeUndefined();
    expect(FundingRoundSchema.path("fundingRoundParticipants")).toBeUndefined();
  });
});
