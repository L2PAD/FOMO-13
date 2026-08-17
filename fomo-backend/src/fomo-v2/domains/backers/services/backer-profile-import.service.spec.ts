import { Types } from "mongoose";
import { FomoV2BackerProfileImportService } from "./backer-profile-import.service";

function asyncCursor(rows: any[]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const row of rows) yield row;
    },
  };
}

function sourceFind(rows: any[]) {
  const query: any = {};
  query.sort = jest.fn(() => query);
  query.limit = jest.fn(() => query);
  query.lean = jest.fn(() => query);
  query.cursor = jest.fn(() => asyncCursor(rows));
  return query;
}

function backerFind(rows: any[]) {
  const query: any = {};
  query.sort = jest.fn(() => query);
  query.limit = jest.fn(() => query);
  query.exec = jest.fn().mockResolvedValue(rows);
  return query;
}

function leanOne(value: any) {
  return { lean: jest.fn().mockResolvedValue(value) };
}

function createHarness(input: {
  investor: Record<string, any>;
  existingBySource?: any;
  existingBySourceWithoutProfile?: any;
  existingByFingerprint?: any;
  sameNameCandidates?: any[];
  snapshot?: boolean;
}) {
  const intelInvestorSourceModel = {
    find: jest.fn(() => sourceFind([input.investor])),
  };
  const backerModel = {
    find: jest.fn(() => backerFind(input.sameNameCandidates || [])),
  };
  const reviewBatchModel = {
    findOne: jest.fn(() => leanOne(null)),
  };
  const sourceProfile = input.existingBySource
    ? { backerId: input.existingBySource._id }
    : null;
  const backerService = {
    findSourceProfileBySourceIdentity: jest.fn().mockResolvedValue(sourceProfile),
    findById: jest.fn().mockResolvedValue(input.existingBySource || null),
    findBySourceIdentity: jest
      .fn()
      .mockResolvedValue(input.existingBySourceWithoutProfile || null),
    findByFingerprint: jest
      .fn()
      .mockResolvedValue(input.existingByFingerprint || null),
    findSourceProfileForBacker: jest.fn().mockResolvedValue(sourceProfile),
    upsertBacker: jest.fn(),
    upsertSourceProfile: jest.fn(),
    upsertReadModel: jest.fn(),
    buildReadModelInputFromBacker: jest.fn(),
  };
  const reviewService = {
    createOrUpdateBatch: jest.fn().mockResolvedValue({ created: true }),
  };
  const configService = {
    get: jest.fn((key: string) =>
      key === "DB_PARSER_NAME" ? "parser" : "primary"
    ),
  };
  const snapshot = {
    snapshotId: "snapshot-investors-1",
    parserKey: "dropstab:investors",
    sourceType: "dropstab",
    write: false,
    manifest: {},
    succeeded: 1,
  };
  const snapshotReader = input.snapshot
    ? {
        validate: jest.fn().mockResolvedValue(snapshot),
        cursor: jest.fn().mockReturnValue(asyncCursor([{ entityKey: "fund-a" }])),
        payload: jest.fn().mockReturnValue(input.investor),
      }
    : undefined;
  const service = new FomoV2BackerProfileImportService(
    configService as any,
    backerService as any,
    reviewService as any,
    intelInvestorSourceModel as any,
    backerModel as any,
    {} as any,
    reviewBatchModel as any,
    undefined,
    snapshotReader as any
  );

  return {
    service,
    backerService,
    reviewService,
    intelInvestorSourceModel,
    snapshotReader,
  };
}

describe("FomoV2BackerProfileImportService", () => {
  it("sends uncertain backer types to review instead of defaulting and writing a fund", async () => {
    const harness = createHarness({
      investor: {
        _id: new Types.ObjectId("64b64c000000000000000021"),
        sourceInvestorId: "unknown-investor",
        name: "Unknown Investor",
      },
    });

    const result = await harness.service.run({ write: true, limit: 1 });

    const sourceFilter = (harness.intelInvestorSourceModel.find.mock.calls as any[][])[0][0];
    expect(sourceFilter.source).toEqual(expect.any(RegExp));
    expect(sourceFilter.source.test("intel")).toBe(true);
    expect(sourceFilter.source.test("dropstab")).toBe(false);
    expect(result.skipped.byReason.BACKER_AMBIGUOUS).toBe(1);
    expect(harness.backerService.upsertBacker).not.toHaveBeenCalled();
    expect(harness.reviewService.createOrUpdateBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "BACKER_AMBIGUOUS",
        incomingSourceType: "intel",
        metadata: expect.objectContaining({
          typeInference: expect.objectContaining({ confident: false }),
        }),
      })
    );
  });

  it("sends a single name/type-only match to review instead of merging it", async () => {
    const existing = {
      _id: new Types.ObjectId("64b64c000000000000000022"),
      name: "Example Capital",
      normalizedName: "example_capital",
      backerType: "fund",
      primarySource: "dropstab",
      sourceId: "dropstab-example-capital",
      canonicalFingerprint: "name-type-fingerprint",
    };
    const harness = createHarness({
      investor: {
        _id: new Types.ObjectId("64b64c000000000000000023"),
        sourceInvestorId: "intel-example-capital",
        name: "Example Capital",
        type: "venture capital",
      },
      existingByFingerprint: existing,
      sameNameCandidates: [existing],
    });

    const result = await harness.service.run({ write: true, limit: 1 });

    expect(result.skipped.byReason.BACKER_POTENTIAL_MATCH).toBe(1);
    expect(harness.backerService.upsertBacker).not.toHaveBeenCalled();
    expect(harness.reviewService.createOrUpdateBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: "BACKER_POTENTIAL_MATCH",
        candidateCount: 1,
      })
    );
  });

  it("resumes an importer-created backer when the source profile write previously failed", async () => {
    const orphanBacker = {
      _id: new Types.ObjectId("64b64c000000000000000024"),
      name: "Resume Capital",
      normalizedName: "resume_capital",
      backerType: "fund",
      primarySource: "intel",
      sourceId: "intel-resume-capital",
      canonicalFingerprint: "fund:resume_capital",
    };
    const harness = createHarness({
      investor: {
        _id: new Types.ObjectId("64b64c000000000000000025"),
        sourceInvestorId: "intel-resume-capital",
        name: "Resume Capital",
        type: "venture capital",
      },
      existingBySourceWithoutProfile: orphanBacker,
      existingByFingerprint: orphanBacker,
      sameNameCandidates: [orphanBacker],
    });
    harness.backerService.upsertBacker.mockResolvedValue({
      doc: orphanBacker,
      created: false,
    });
    harness.backerService.upsertSourceProfile.mockResolvedValue({
      doc: { backerId: orphanBacker._id },
      created: true,
    });
    harness.backerService.buildReadModelInputFromBacker.mockReturnValue({
      backerId: orphanBacker._id,
    });
    harness.backerService.upsertReadModel.mockResolvedValue({
      doc: { backerId: orphanBacker._id },
      created: true,
    });

    const result = await harness.service.run({ write: true, limit: 1 });

    expect(result.errors).toEqual([]);
    expect(result.skipped.total).toBe(0);
    expect(harness.reviewService.createOrUpdateBatch).not.toHaveBeenCalled();
    expect(harness.backerService.findBySourceIdentity).toHaveBeenCalledWith(
      "intel",
      "intel-resume-capital"
    );
    expect(harness.backerService.upsertSourceProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceType: "intel",
        sourceInvestorId: "intel-resume-capital",
        backerId: orphanBacker._id,
      })
    );
    expect(harness.backerService.upsertReadModel).toHaveBeenCalled();
  });

  it("imports a Dropstab snapshot with Dropstab identity and never scans the mutable collection", async () => {
    const harness = createHarness({
      snapshot: true,
      investor: {
        _id: new Types.ObjectId("64b64c000000000000000026"),
        source: "dropstab",
        sourceInvestorId: "dropstab-example-capital",
        slug: "example-capital",
        name: "Example Capital",
        type: "venture capital",
      },
    });

    const result = await harness.service.run({
      sourceType: "dropstab",
      snapshotId: "snapshot-investors-1",
      upstreamRunId: "upstream-investors-1",
      upstreamParserKey: "dropstab:investors",
      write: false,
      limit: 1,
    });

    expect(harness.snapshotReader?.validate).toHaveBeenCalledWith({
      snapshotId: "snapshot-investors-1",
      parserKey: "dropstab:investors",
      sourceType: "dropstab",
      write: false,
      upstreamRunId: "upstream-investors-1",
    });
    expect(harness.intelInvestorSourceModel.find).not.toHaveBeenCalled();
    expect(result.sourceType).toBe("dropstab");
    expect(harness.backerService.findSourceProfileBySourceIdentity).toHaveBeenCalledWith(
      "dropstab",
      "dropstab-example-capital"
    );
  });
});
