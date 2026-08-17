import { getModelToken } from "@nestjs/mongoose";
import mongoose from "mongoose";
import { ADMIN_AI_CONNECTION_NAME } from "../admin-ai-chat.constants";
import { AdminAiChatMessage } from "../models/admin-ai-chat-message.model";
import { FomoV2AiRedactionService } from "./fomo-v2-ai-redaction.service";
import { FomoV2AiToolsService } from "./fomo-v2-ai-tools.service";
import { FOMO_V2_AI_TOOL_NAMES } from "./fomo-v2-ai-types";

class FakeReadQuery {
  constructor(protected readonly docs: any[] = []) {}

  select() {
    return this;
  }

  sort() {
    return this;
  }

  limit() {
    return this;
  }

  maxTimeMS() {
    return this;
  }

  lean() {
    return Promise.resolve(this.docs);
  }
}

class FakeReadOneQuery extends FakeReadQuery {
  lean() {
    return Promise.resolve(this.docs[0] || null);
  }
}

class FakeCountQuery {
  constructor(private readonly count: number) {}

  maxTimeMS() {
    return Promise.resolve(this.count);
  }
}

class FakeAggregateQuery {
  option() {
    return Promise.resolve([]);
  }
}

class FakeAdminDb {
  inserted: any[] = [];
  updated: any[] = [];
  deleted: any[] = [];

  collection(name: string) {
    return {
      insertOne: async (document: any) => {
        const _id = new mongoose.Types.ObjectId();
        this.inserted.push({ collectionName: name, document: { _id, ...document } });
        return { acknowledged: true, insertedId: _id };
      },
      updateOne: async (filter: any, update: any) => {
        this.updated.push({ collectionName: name, filter, update, many: false });
        return { acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
      },
      updateMany: async (filter: any, update: any) => {
        this.updated.push({ collectionName: name, filter, update, many: true });
        return { acknowledged: true, matchedCount: 2, modifiedCount: 2, upsertedCount: 0 };
      },
      deleteOne: async (filter: any) => {
        this.deleted.push({ collectionName: name, filter, many: false });
        return { acknowledged: true, deletedCount: 1 };
      },
      deleteMany: async (filter: any) => {
        this.deleted.push({ collectionName: name, filter, many: true });
        return { acknowledged: true, deletedCount: 2 };
      },
    };
  }
}

class FakeReadOnlyModel {
  constructor(private readonly docs: any[] = []) {}

  create(payload: any) {
    return Promise.resolve({ _id: new mongoose.Types.ObjectId(), ...payload });
  }

  find() {
    return new FakeReadQuery(this.docs);
  }

  findOne() {
    return new FakeReadOneQuery(this.docs);
  }

  findById(id?: unknown) {
    const matched = id
      ? this.docs.filter((doc) => String(doc?._id) === String(id))
      : this.docs;
    return new FakeReadOneQuery(matched);
  }

  findOneAndUpdate() {
    return {
      lean: () =>
        Promise.resolve({
          _id: new mongoose.Types.ObjectId(),
          status: "resolved",
        }),
    };
  }

  updateOne() {
    return Promise.resolve({ matchedCount: 1, modifiedCount: 1, upsertedCount: 0 });
  }

  countDocuments() {
    return new FakeCountQuery(this.docs.length);
  }

  aggregate() {
    return new FakeAggregateQuery();
  }
}

function createToolsService(
  documents: Record<string, any[]> = {},
  webSearchProvider?: any,
  exportService?: any
) {
  const model = (name: string) => new FakeReadOnlyModel(documents[name] || []) as any;
  const adminDb = new FakeAdminDb();
  const adminAiConfig = {
    ensureDevDatabaseScope: jest.fn(),
    ensureAiToolDbAccess: jest.fn(),
    assertSafeAiToolInput: jest.fn(),
    isWriteToolsEnabled: jest.fn(() => true),
    getDbName: jest.fn(() => "fomo_dev"),
    getDefaultAccessMode: jest.fn(() => "full_access"),
    normalizeAccessMode: jest.fn((value?: string) => {
      if (value === "read_only" || value === "write_with_approval" || value === "full_access") {
        return value;
      }
      return "full_access";
    }),
  };

  const service = new FomoV2AiToolsService(
    model("canonicalProject"),
    model("canonicalProjectSource"),
    model("sourceEntity"),
    model("sourceSnapshot"),
    model("marketAsset"),
    model("projectAssetLink"),
    model("marketReadModel"),
    model("marketHistory"),
    model("fundingRound"),
    model("fundingParticipant"),
    model("backer"),
    model("backerSource"),
    model("backerHolding"),
    model("tokenAllocation"),
    model("vestingRound"),
    model("vestingSchedule"),
    model("vestingSummary"),
    model("unlockEvent"),
    model("reviewBatch"),
    model("importCandidate"),
    model("projectDomainSource"),
    { db: adminDb } as any,
    adminAiConfig as any,
    new FomoV2AiRedactionService(),
    webSearchProvider,
    exportService
  );

  return { service, adminDb, adminAiConfig };
}

describe("FomoV2AiToolsService smoke safety", () => {
  it("uses the named Admin AI connection token for chat models", () => {
    expect(getModelToken(AdminAiChatMessage.name, ADMIN_AI_CONNECTION_NAME)).not.toBe(
      getModelToken(AdminAiChatMessage.name)
    );
  });

  it("exposes typed dev tools without raw Mongo execution parameters", () => {
    const { service } = createToolsService();
    const definitions = service.getToolDefinitions();
    const names = definitions.map((tool: any) => tool.name);

    expect(names).toEqual([...FOMO_V2_AI_TOOL_NAMES]);
    expect(names).toEqual(
      expect.arrayContaining([
        "fomoDevFindProject",
        "fomoDevCreateReviewCase",
        "fomoDevUpdateProjectFields",
      ])
    );
    expect(names.join(" ")).not.toMatch(/drop|bulkWrite|rawCommand|runCommand|mongosh|eval/i);
    definitions.forEach((definition: any) => {
      expect(definition.type).toBe("function");
      expect(definition.parameters?.properties?.collection).toBeUndefined();
      expect(definition.parameters?.properties?.mongoQuery).toBeUndefined();
      expect(definition.parameters?.properties?.rawCommand).toBeUndefined();
    });
  });

  it("creates raw review and whole-collection export artifacts without reading rows into the model", async () => {
    const createExport = jest.fn(async (input: any) => ({
      id: new mongoose.Types.ObjectId().toString(),
      collectionName: input.collectionName,
      filename: `${input.collectionName}.json.gz`,
      status: "queued",
    }));
    const { service } = createToolsService({}, undefined, { createExport });
    const context = {
      userId: new mongoose.Types.ObjectId().toString(),
      chatId: new mongoose.Types.ObjectId().toString(),
      messageId: new mongoose.Types.ObjectId().toString(),
      accessMode: "read_only" as const,
    };

    const reviews = await service.executeTool(
      "fomoV2ExportVestingReviews",
      { limit: 10, status: "open", format: "json", compression: "none" },
      context
    );
    const collection = await service.executeTool(
      "fomoDevCreateJsonExport",
      { collectionName: "canonical_projects", limit: 0 },
      context
    );

    expect(createExport).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        kind: "vesting_reviews",
        collectionName: "review_batches",
        spec: expect.objectContaining({ limit: 10, status: "open" }),
      }),
      context
    );
    expect(createExport).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        kind: "collection",
        collectionName: "canonical_projects",
        spec: expect.objectContaining({ limit: 0 }),
        format: "jsonl",
        compression: "gzip",
      }),
      context
    );
    expect(reviews.data).toEqual(expect.objectContaining({ status: "queued" }));
    expect(collection.data).toEqual(expect.objectContaining({ status: "queued" }));
  });

  it("runs all named tools against read-only model chains without throwing", async () => {
    const { service } = createToolsService();
    const calls: Array<[string, Record<string, unknown>]> = [
      ["fomoV2CollectionStats", {}],
      ["fomoV2FindProject", { query: "bitcoin" }],
      ["fomoV2GetProjectFullContext", { query: "bitcoin" }],
      ["fomoV2GetMarketContext", { query: "bitcoin" }],
      ["fomoV2GetSourceContext", { query: "bitcoin" }],
      ["fomoV2GetFundingContext", { query: "bitcoin" }],
      ["fomoV2GetBackerContext", { query: "a16z" }],
      ["fomoV2GetTokenomicsContext", { query: "bitcoin" }],
      ["fomoV2FindVestingReviewCases", {}],
      ["fomoV2GetVestingReviewContext", { query: "bitcoin" }],
      ["fomoV2AnalyzeVestingSaleIds", { query: "bitcoin" }],
      ["fomoV2NormalizeVestingNames", { names: ["Private Investors"] }],
      ["fomoV2FindOfficialSourceLinks", { query: "bitcoin" }],
      ["fomoWebSearchOfficialSources", { projectName: "Bitcoin", intent: "tokenomics" }],
      ["fomoWebFetchSourceSummary", { url: "https://bitcoin.org/en/" }],
      ["fomoV2AnalyzeVestingReviewCase", { query: "bitcoin", mode: "analysis_only" }],
      ["fomoV2BuildVestingReviewProposal", { mode: "from_user_json", proposedJson: { tokenAllocation: [] }, useOfficialSources: false }],
      ["fomoV2FindDuplicates", { entityType: "canonicalProject", query: "bitcoin" }],
      ["fomoV2ExplainMissingData", { query: "bitcoin", field: "logo" }],
      ["fomoDevFindProject", { query: "bitcoin" }],
      ["fomoDevSearchReviewCases", { query: "source conflict" }],
      [
        "fomoDevCreateReviewCase",
        { dryRun: true, domain: "sources", reason: "SOURCE_CONFLICT" },
      ],
      [
        "fomoDevUpdateProjectFields",
        {
          dryRun: true,
          canonicalProjectId: new mongoose.Types.ObjectId().toString(),
          fields: { status: "active", fomoScore: 100 },
        },
      ],
      [
        "fomoDevRunImporterForProject",
        { dryRun: false, confirm: true, importerKey: "funding_import", query: "bitcoin" },
      ],
    ];

    for (const [name, input] of calls) {
      const result = await service.executeTool(name, input);
      expect(result).toEqual(
        expect.objectContaining({
          tool: name,
          generatedAt: expect.any(String),
          data: expect.any(Object),
          limits: expect.objectContaining({ maxTimeMS: 5000 }),
        })
      );
      expect(JSON.stringify(result).length).toBeLessThan(20000);
    }
  });

  it("requires confirm=true for non-dry-run typed dev writes", async () => {
    const { service } = createToolsService();

    const result = await service.executeTool("fomoDevCreateReviewCase", {
      dryRun: false,
      domain: "sources",
      reason: "SOURCE_CONFLICT",
    });

    expect(result.data.error).toContain("confirm=true");
  });

  it("blocks dev writes in read_only mode", async () => {
    const { service, adminDb } = createToolsService();

    const result = await service.executeTool(
      "fomoDevInsertOne",
      { collectionName: "ai_scratch", document: { name: "Draft" }, dryRun: false, confirm: true },
      { accessMode: "read_only" }
    );

    expect(result.data.errorCode).toBe("WRITE_TOOLS_DISABLED_BY_ACCESS_MODE");
    expect(adminDb.inserted).toHaveLength(0);
  });

  it("returns a pending approval plan for dev writes in write_with_approval mode", async () => {
    const { service, adminDb } = createToolsService();

    const result = await service.executeTool(
      "fomoDevInsertOne",
      { collectionName: "ai_scratch", document: { name: "Draft" }, dryRun: false, confirm: true },
      { accessMode: "write_with_approval" }
    );

    expect(result.data).toEqual(
      expect.objectContaining({
        status: "pending",
        requiresApproval: true,
        targetDb: "fomo_dev",
        operation: "insertOne",
      })
    );
    expect(result.data.plannedChanges).toEqual(expect.any(Array));
    expect(adminDb.inserted).toHaveLength(0);
  });

  it("executes dev writes immediately in full_access mode when confirmed", async () => {
    const { service, adminDb } = createToolsService();

    const result = await service.executeTool(
      "fomoDevInsertOne",
      { collectionName: "ai_scratch", document: { name: "Draft" }, dryRun: false, confirm: true },
      { accessMode: "full_access" }
    );

    expect(result.data).toEqual(
      expect.objectContaining({
        status: "done",
        createdCount: 1,
      })
    );
    expect(adminDb.inserted).toHaveLength(1);
  });

  it("requires confirm=true for generic updateMany and deleteMany execution", async () => {
    const { service, adminDb } = createToolsService();

    const updateResult = await service.executeTool(
      "fomoDevUpdateMany",
      { collectionName: "ai_scratch", filter: {}, update: { $set: { status: "ok" } }, dryRun: false },
      { accessMode: "full_access" }
    );
    const deleteResult = await service.executeTool(
      "fomoDevDeleteMany",
      { collectionName: "ai_scratch", filter: {}, dryRun: false },
      { accessMode: "full_access" }
    );

    expect(updateResult.data.errorCode).toBe("CONFIRM_REQUIRED");
    expect(deleteResult.data.errorCode).toBe("CONFIRM_REQUIRED");
    expect(adminDb.updated).toHaveLength(0);
    expect(adminDb.deleted).toHaveLength(0);
  });

  it("finds vesting review candidates without projectId", async () => {
    const projectId = new mongoose.Types.ObjectId();
    const allocationId = new mongoose.Types.ObjectId();
    const { service } = createToolsService({
      canonicalProject: [{ _id: projectId, name: "Monad", symbol: "MON", slug: "monad", primaryWebsiteDomain: "monad.xyz" }],
      tokenAllocation: [
        { _id: allocationId, canonicalProjectId: projectId, name: "Private Investors", status: "proposed" },
      ],
      reviewBatch: [
        { _id: new mongoose.Types.ObjectId(), canonicalProjectId: projectId, domain: "vesting", reason: "saleId_review", status: "open" },
      ],
    });

    const result = await service.executeTool("fomoV2FindVestingReviewCases", { limit: 10 });
    const items = (result.data.items as any[]) || [];

    expect(items[0]).toEqual(
      expect.objectContaining({
        canonicalProjectId: String(projectId),
        project: expect.objectContaining({ name: "Monad", symbol: "MON" }),
      })
    );
    expect(items[0].counts.proposedTokenAllocations).toBe(1);
    expect(items[0].counts.missingSaleId).toBe(1);
  });

  it("gets full vesting context and detects missing saleId", async () => {
    const projectId = new mongoose.Types.ObjectId();
    const allocationId = new mongoose.Types.ObjectId();
    const scheduleId = new mongoose.Types.ObjectId();
    const { service } = createToolsService({
      canonicalProject: [{ _id: projectId, name: "Monad", symbol: "MON", slug: "monad", primaryWebsiteDomain: "monad.xyz" }],
      tokenAllocation: [
        { _id: allocationId, canonicalProjectId: projectId, name: "Private Investors", sourceName: "Private Investors", status: "proposed" },
      ],
      vestingSchedule: [
        { _id: scheduleId, canonicalProjectId: projectId, roundName: "Private Investors", status: "proposed" },
      ],
      canonicalProjectSource: [
        { _id: new mongoose.Types.ObjectId(), canonicalProjectId: projectId, sourceUrl: "https://monad.xyz/tokenomics" },
      ],
    });

    const context = await service.executeTool("fomoV2GetVestingReviewContext", {
      canonicalProjectId: String(projectId),
    });
    const saleIds = await service.executeTool("fomoV2AnalyzeVestingSaleIds", {
      canonicalProjectId: String(projectId),
    });

    expect((context.data.proposedData as any).tokenAllocations[0]).toEqual(
      expect.objectContaining({
        id: String(allocationId),
        sourceName: "Private Investors",
      })
    );
    expect(context.data.sourceLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: "https://monad.xyz/tokenomics", officialLikelihood: "high" }),
      ])
    );
    expect((saleIds.data.recommendations as any[])[0]).toEqual(
      expect.objectContaining({
        action: "create_new_sale_id",
        targetIds: expect.arrayContaining([String(allocationId), String(scheduleId)]),
      })
    );
  });

  it("keeps known third-party vesting/source links low confidence", async () => {
    const projectId = new mongoose.Types.ObjectId();
    const { service } = createToolsService({
      canonicalProject: [{ _id: projectId, name: "NEAR Protocol", symbol: "NEAR", slug: "near" }],
      canonicalProjectSource: [
        { _id: new mongoose.Types.ObjectId(), canonicalProjectId: projectId, sourceUrl: "https://dropstab.com/coins/near/vesting" },
        { _id: new mongoose.Types.ObjectId(), canonicalProjectId: projectId, sourceUrl: "https://www.coingecko.com/en/coins/near" },
        { _id: new mongoose.Types.ObjectId(), canonicalProjectId: projectId, sourceUrl: "https://near.org/" },
        { _id: new mongoose.Types.ObjectId(), canonicalProjectId: projectId, sourceUrl: "https://docs.near.org/protocol/network/tokens" },
        { _id: new mongoose.Types.ObjectId(), canonicalProjectId: projectId, sourceUrl: "https://near.org/blog/evolving-near-tokenomics" },
      ],
    });

    const result = await service.executeTool("fomoV2FindOfficialSourceLinks", {
      canonicalProjectId: String(projectId),
      limit: 10,
    });
    const links = (result.data.links as any[]) || [];

    expect(links.find((link) => link.url.includes("dropstab.com"))).toEqual(
      expect.objectContaining({
        type: "third_party",
        officialLikelihood: "low",
      })
    );
    expect(links.find((link) => link.url.includes("coingecko.com"))).toEqual(
      expect.objectContaining({
        type: "third_party",
        officialLikelihood: "low",
      })
    );
    expect(links.find((link) => link.url === "https://near.org/")).toEqual(
      expect.objectContaining({
        type: "website",
        officialLikelihood: "high",
      })
    );
    expect(links.find((link) => link.url.includes("docs.near.org"))).toEqual(
      expect.objectContaining({
        type: "docs",
        officialLikelihood: "high",
      })
    );
    expect(links.find((link) => link.url.includes("near.org/blog"))).toEqual(
      expect.objectContaining({
        type: "blog",
        officialLikelihood: "high",
      })
    );
  });

  it("proposes canonical vesting names while preserving sourceName", async () => {
    const { service } = createToolsService();

    const result = await service.executeTool("fomoV2NormalizeVestingNames", {
      names: ["Private Investors", "Team and Advisors"],
    });
    const candidates = (result.data.nameCandidates as any[]) || [];

    expect(candidates[0]).toEqual(
      expect.objectContaining({
        sourceName: "Private Investors",
        proposedCanonicalName: "Private Round",
        shouldRename: true,
      })
    );
    expect(candidates[1].sourceName).toBe("Team and Advisors");
  });

  it("creates a vesting write proposal and executes it only after approval", async () => {
    const projectId = new mongoose.Types.ObjectId();
    const allocationId = new mongoose.Types.ObjectId();
    const { service, adminDb } = createToolsService({
      canonicalProject: [{ _id: projectId, name: "Monad", symbol: "MON", slug: "monad", primaryWebsiteDomain: "monad.xyz" }],
      tokenAllocation: [
        { _id: allocationId, canonicalProjectId: projectId, name: "Private Investors", sourceName: "Private Investors", status: "proposed" },
      ],
      canonicalProjectSource: [
        { _id: new mongoose.Types.ObjectId(), canonicalProjectId: projectId, sourceUrl: "https://monad.xyz/tokenomics" },
      ],
    });

    const pending = await service.executeTool(
      "fomoV2AnalyzeVestingReviewCase",
      { canonicalProjectId: String(projectId), mode: "proposal", dryRun: false, confirm: true },
      { accessMode: "write_with_approval" }
    );

    expect(pending.data).toEqual(
      expect.objectContaining({
        status: "pending",
        requiresApproval: true,
      })
    );
    expect(pending.data.plannedChanges).toEqual(expect.any(Array));
    expect(adminDb.updated).toHaveLength(0);

    const approved = await service.executeTool(
      "fomoV2AnalyzeVestingReviewCase",
      { canonicalProjectId: String(projectId), mode: "proposal", dryRun: false, confirm: true },
      { accessMode: "full_access", approvalExecution: true }
    );

    expect(approved.data.status).toBe("done");
    expect(adminDb.updated[0]).toEqual(
      expect.objectContaining({
        collectionName: "token_allocations",
        filter: { _id: String(allocationId) },
      })
    );
  });

  it("builds a compare-ready vesting review proposal and validates saleId/percent issues", async () => {
    const { service } = createToolsService();

    const result = await service.executeTool("fomoV2BuildVestingReviewProposal", {
      mode: "from_user_json",
      outputMode: "compare_payload",
      useOfficialSources: false,
      currentJson: {
        tokenAllocation: [
          { name: "Private Round", sourceName: "Private Investors", percent: 100, amount: 1000, saleId: 1, normalizedCategory: "private" },
        ],
        vestingRounds: [],
        vestingSummary: {},
        vestingSchedule: [],
        vestingTimeline: [],
      },
      proposedJson: {
        tokenAllocation: [
          { name: "Private Round", sourceName: "Private Investors", percent: 80, amount: 800, saleId: 1, normalizedCategory: "private" },
          { name: "Team", sourceName: "Team", percent: 10, amount: 100, saleId: 1, normalizedCategory: "team" },
          { name: "Community", sourceName: "Community Grants", percent: 5, amount: 50, normalizedCategory: "community" },
        ],
        vestingRounds: [],
        vestingSummary: {},
        vestingSchedule: [],
        vestingTimeline: [],
      },
    });
    const issues = (result.data.issues as any[]) || [];

    expect(result.data.responseType).toBe("vesting_review_compare");
    expect(result.data.proposedJson).toEqual(
      expect.objectContaining({
        tokenAllocation: expect.arrayContaining([
          expect.objectContaining({ sourceName: "Private Investors" }),
        ]),
      })
    );
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "sale_id_missing" }),
        expect.objectContaining({ type: "sale_id_conflict" }),
        expect.objectContaining({ type: "percent_sum_invalid" }),
      ])
    );
    expect(result.data.plannedChanges).toBeUndefined();
  });

  it("produces planned changes only in vesting write proposal mode", async () => {
    const projectId = new mongoose.Types.ObjectId();
    const allocationId = new mongoose.Types.ObjectId();
    const { service } = createToolsService({
      canonicalProject: [{ _id: projectId, name: "Monad", symbol: "MON", slug: "monad", primaryWebsiteDomain: "monad.xyz" }],
      tokenAllocation: [
        { _id: allocationId, canonicalProjectId: projectId, name: "Private Investors", sourceName: "Private Investors", status: "proposed", saleId: 11, allocationPercent: 100, amount: 1000 },
      ],
      canonicalProjectSource: [
        { _id: new mongoose.Types.ObjectId(), canonicalProjectId: projectId, sourceUrl: "https://monad.xyz/tokenomics" },
      ],
    });

    const compare = await service.executeTool("fomoV2BuildVestingReviewProposal", {
      canonicalProjectId: String(projectId),
      outputMode: "compare_payload",
      useOfficialSources: true,
    });
    const writeProposal = await service.executeTool("fomoV2BuildVestingReviewProposal", {
      canonicalProjectId: String(projectId),
      outputMode: "write_proposal",
      dryRun: true,
      useOfficialSources: true,
    });

    expect(compare.data.responseType).toBe("vesting_review_compare");
    expect(compare.data.plannedChanges).toBeUndefined();
    expect(writeProposal.data.responseType).toBe("vesting_review_compare");
    expect(writeProposal.data.requiresApproval).toBe(true);
    expect(writeProposal.data.plannedChanges).toEqual(expect.any(Array));
  });

  it("blocks approved vesting compare execution when edited payload is invalid", async () => {
    const { service, adminDb } = createToolsService();

    const result = await service.executeTool(
      "fomoV2BuildVestingReviewProposal",
      {
        mode: "from_user_json",
        outputMode: "write_proposal",
        dryRun: false,
        confirm: true,
        proposedJson: {
          tokenAllocation: [
            { name: "Private Round", percent: 100, amount: 1000, saleId: 1, normalizedCategory: "private" },
          ],
          vestingRounds: [],
          vestingSummary: {},
          vestingSchedule: [],
          vestingTimeline: [],
        },
        editedPayload: {
          tokenAllocation: [
            { name: "Broken", percent: 10, amount: 100, normalizedCategory: "private" },
          ],
          vestingRounds: [],
          vestingSummary: {},
          vestingSchedule: [],
          vestingTimeline: [],
        },
      },
      { accessMode: "full_access", approvalExecution: true }
    );

    expect(result.data.errorCode).toBe("VESTING_REVIEW_JSON_INVALID");
    expect(adminDb.updated).toHaveLength(0);
    expect(adminDb.inserted).toHaveLength(0);
  });

  it("returns clear disabled states for web search and blocks unsafe fetch URLs", async () => {
    const { service } = createToolsService();

    const search = await service.executeTool("fomoWebSearchOfficialSources", {
      projectName: "Monad",
      intent: "tokenomics",
    });
    const localhost = await service.executeTool("fomoWebFetchSourceSummary", {
      url: "http://127.0.0.1/admin",
    });
    const protocol = await service.executeTool("fomoWebFetchSourceSummary", {
      url: "file:///etc/passwd",
    });

    expect(search.data.errorCode).toBe("WEB_SEARCH_PROVIDER_NOT_CONFIGURED");
    expect(localhost.data.errorCode).toBe("WEB_FETCH_PRIVATE_URL_BLOCKED");
    expect(protocol.data.errorCode).toBe("WEB_FETCH_PROTOCOL_BLOCKED");
    expect(JSON.stringify(search.data)).not.toMatch(/<html|secret/i);
  });

  it("uses Tavily provider results with official ranking and safe output", async () => {
    const apiKey = "tvly-secret-test-key";
    const search = jest.fn(async ({ query }: any) => ({
      query,
      results: [
        {
          title: "Monad Tokenomics",
          url: "https://monad.xyz/tokenomics?utm_source=test",
          content: "Official tokenomics and vesting schedule.",
          score: 0.91,
          raw_content: `<html>${apiKey}</html>`,
        },
        {
          title: "Monad ICO data",
          url: "https://cryptorank.io/ico/monad",
          content: "Third party overview",
          score: 0.99,
        },
      ],
    }));
    const { service } = createToolsService({}, {
      getStatus: () => ({
        provider: "tavily",
        configured: true,
        enabled: true,
        maxResults: 5,
        timeoutMs: 10000,
        officialPriority: true,
      }),
      search,
    });

    const result = await service.executeTool("fomoWebSearchOfficialSources", {
      projectName: "Monad",
      symbol: "MON",
      website: "https://monad.xyz",
      intent: "tokenomics",
      trustedDomains: ["docs.monad.xyz"],
      limit: 5,
    });
    const results = (result.data.results as any[]) || [];

    expect(search).toHaveBeenCalled();
    expect((result.data.queries as string[])[0]).toContain("site:docs.monad.xyz");
    expect((result.data.queries as string[])).toEqual(
      expect.arrayContaining(["site:monad.xyz tokenomics"])
    );
    expect(results[0]).toEqual(
      expect.objectContaining({
        url: "https://monad.xyz/tokenomics",
        sourceType: "official",
        officialLikelihood: "high",
      })
    );
    expect(results.find((item) => item.domain === "cryptorank.io")).toEqual(
      expect.objectContaining({
        sourceType: "third_party",
        officialLikelihood: "low",
      })
    );
    expect(result.data.summary).toEqual(
      expect.objectContaining({
        provider: "tavily",
        resultCount: expect.any(Number),
        officialHighCount: 1,
        thirdPartyCount: 1,
      })
    );
    expect(JSON.stringify(result.data)).not.toContain(apiKey);
    expect(JSON.stringify(result.data)).not.toContain("<html>");
  });

  it("uses Tavily as vesting review fallback and does not approve on third-party-only evidence", async () => {
    const projectId = new mongoose.Types.ObjectId();
    const allocationId = new mongoose.Types.ObjectId();
    const { service } = createToolsService({
      canonicalProject: [{ _id: projectId, name: "Monad", symbol: "MON", slug: "monad" }],
      tokenAllocation: [
        { _id: allocationId, canonicalProjectId: projectId, name: "Private Investors", status: "proposed" },
      ],
    }, {
      getStatus: () => ({
        provider: "tavily",
        configured: true,
        enabled: true,
        maxResults: 5,
        timeoutMs: 10000,
        officialPriority: true,
      }),
      search: jest.fn(async ({ query }: any) => ({
        query,
        results: [
          {
            title: "Monad tokenomics on CryptoRank",
            url: "https://cryptorank.io/ico/monad",
            content: "Third-party vesting data",
            score: 0.8,
          },
        ],
      })),
    });

    const result = await service.executeTool("fomoV2AnalyzeVestingReviewCase", {
      canonicalProjectId: String(projectId),
      mode: "analysis_only",
      useWebSearch: true,
    });

    expect(result.data.webSearchSummary).toEqual(
      expect.objectContaining({
        provider: "tavily",
        thirdPartyCount: 1,
      })
    );
    expect(result.data.finalRecommendation).toBe("needs_more_sources");
    expect(result.data.requiresApproval).toBe(false);
  });
});
