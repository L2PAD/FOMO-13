import { FomoParserAiToolsService } from "./fomo-parser-ai-tools.service";
import { FomoV2AiRedactionService } from "./fomo-v2-ai-redaction.service";

class FakeCursor {
  private limitValue = 100;

  constructor(private readonly docs: any[]) {}

  sort() {
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  async toArray() {
    return this.docs.slice(0, this.limitValue);
  }
}

class FakeCollection {
  inserted: any[] = [];
  updated: any[] = [];
  deleted: any[] = [];

  constructor(
    private readonly docs: any[],
    private readonly options: { rejectWrites?: boolean } = {}
  ) {}

  private assertWriteAllowed() {
    if (!this.options.rejectWrites) return;
    const error = new Error("not authorized on parser_new_dev to execute command");
    (error as any).code = 13;
    throw error;
  }

  find() {
    return new FakeCursor(this.docs);
  }

  async findOne() {
    return this.docs[0] || null;
  }

  async countDocuments() {
    return this.docs.length;
  }

  async insertOne(document: any) {
    this.assertWriteAllowed();
    const insertedId = `inserted-${this.inserted.length + 1}`;
    this.inserted.push({ insertedId, document });
    return { acknowledged: true, insertedId };
  }

  async updateOne(filter: any, update: any) {
    this.assertWriteAllowed();
    this.updated.push({ filter, update, many: false });
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
  }

  async updateMany(filter: any, update: any) {
    this.assertWriteAllowed();
    this.updated.push({ filter, update, many: true });
    return { acknowledged: true, matchedCount: 2, modifiedCount: 2, upsertedCount: 0 };
  }

  async deleteOne(filter: any) {
    this.assertWriteAllowed();
    this.deleted.push({ filter, many: false });
    return { acknowledged: true, deletedCount: 1 };
  }

  async deleteMany(filter: any) {
    this.assertWriteAllowed();
    this.deleted.push({ filter, many: true });
    return { acknowledged: true, deletedCount: 2 };
  }
}

class FakeDb {
  readonly collectionInstances = new Map<string, FakeCollection>();

  constructor(
    private readonly collections: Record<string, any[]>,
    private readonly options: { rejectWrites?: boolean } = {}
  ) {}

  collection(name: string) {
    if (!this.collectionInstances.has(name)) {
      this.collectionInstances.set(
        name,
        new FakeCollection(this.collections[name] || [], this.options)
      );
    }
    return this.collectionInstances.get(name) as FakeCollection;
  }

  listCollections(filter: { name?: string }) {
    const docs =
      filter.name && Object.prototype.hasOwnProperty.call(this.collections, filter.name)
        ? [{ name: filter.name }]
        : [];

    return {
      toArray: async () => docs,
    };
  }
}

function createService(
  collections: Record<string, any[]> = {},
  readyState = 1,
  overrides: Record<string, any> = {}
) {
  const db = new FakeDb(collections, overrides.fakeDbOptions);
  const config = {
    ensureDevDatabaseScope: jest.fn(),
    ensureAiToolDbAccess: jest.fn(),
    assertSafeAiToolInput: jest.fn(),
    getParserDbName: jest.fn(() => "parser_new_dev"),
    isParserWriteToolsEnabled: jest.fn(() => true),
    getDefaultAccessMode: jest.fn(() => "full_access"),
    normalizeAccessMode: jest.fn((value?: string) => {
      if (value === "read_only" || value === "write_with_approval" || value === "full_access") {
        return value;
      }
      return "full_access";
    }),
    ...overrides,
  };

  const service = new FomoParserAiToolsService(
    {
      readyState,
      db,
    } as any,
    config as any,
    new FomoV2AiRedactionService()
  );

  return { service, db, config };
}

describe("FomoParserAiToolsService", () => {
  it("returns parser DB status for legacy and optional parser v2 collections", async () => {
    const { service } = createService({
      ico_projects: [{ _id: "ico-1", name: "Monad" }],
      intel_fundraising: [{ _id: "funding-1", projectName: "Monad" }],
      parser_runs: [{ _id: "run-1", createdAt: new Date("2026-07-02T00:00:00.000Z") }],
      parser_raw_documents: [],
    });

    const result = await service.executeTool("fomoParserDbStatus", {});
    const legacyCollections = (result.data.legacyParserCollections as any[]) || [];
    const parserV2Collections = (result.data.parserV2Collections as any[]) || [];
    const summary = result.data.summary as any;

    expect(result.data.connected).toBe(true);
    expect(legacyCollections.find((item) => item.name === "ico_projects")).toEqual(
      expect.objectContaining({
        exists: true,
        count: 1,
      })
    );
    expect(parserV2Collections.find((item) => item.name === "parser_runs")).toEqual(
      expect.objectContaining({
        exists: true,
        count: 1,
      })
    );
    expect(parserV2Collections.find((item) => item.name === "parser_raw_documents")).toEqual(
      expect.objectContaining({
        exists: true,
        count: 0,
      })
    );
    expect(summary).toEqual(
      expect.objectContaining({
        legacyCollectionsFound: 2,
        legacyDocumentsTotal: 2,
        parserV2CollectionsFound: 2,
        healthy: true,
      })
    );
  });

  it("does not treat missing parser v2 collections as an error when legacy data exists", async () => {
    const { service } = createService({
      ico_projects: [{ _id: "ico-1", name: "Monad" }],
    });

    const result = await service.executeTool("fomoParserDbStatus", {});
    const parserV2Collections = (result.data.parserV2Collections as any[]) || [];
    const summary = result.data.summary as any;

    expect(result.data.connected).toBe(true);
    expect(parserV2Collections.find((item) => item.name === "parser_runs")).toEqual(
      expect.objectContaining({
        exists: false,
        collectionMissing: true,
      })
    );
    expect(summary.healthy).toBe(true);
    expect(summary.warnings).not.toEqual(
      expect.arrayContaining([expect.stringContaining("parser_runs")])
    );
  });

  it("returns collection stats for legacy parser collections", async () => {
    const { service } = createService({
      ico_projects: [{ _id: "ico-1" }],
      dropstab_coin_catalog: [{ _id: "coin-1" }],
      intel_fundraising: [{ _id: "funding-1" }, { _id: "funding-2" }],
    });

    const result = await service.executeTool("fomoParserCollectionStats", {});
    const collections = (result.data.collections as any[]) || [];

    expect(collections.find((item) => item.name === "ico_projects")).toEqual(
      expect.objectContaining({ exists: true, count: 1 })
    );
    expect(collections.find((item) => item.name === "intel_fundraising")).toEqual(
      expect.objectContaining({ exists: true, count: 2 })
    );
    expect((result.data.summary as any).totalDocuments).toBe(4);
  });

  it("profiles multiple legacy parser collections in one tool call without raw payload", async () => {
    const { service } = createService({
      ico_projects: [
        {
          _id: "ico-1",
          name: "Monad",
          slug: "monad",
          website: "https://monad.xyz",
          rawHtml: "<html>secret raw page</html>",
          project: { name: "Monad", sourceId: "ico-monad" },
        },
      ],
      dropstab_coin_detail_data: [
        {
          _id: "dropstab-1",
          coinName: "Monad",
          coinSlug: "monad",
          detailUrl: "https://dropstab.com/coins/monad",
        },
      ],
      intel_fundraising: [
        { _id: "funding-1", projectName: "Monad", amountUsd: 225000000 },
      ],
      intel_investors: [
        { _id: "investor-1", name: "Paradigm", projects: [{ name: "Monad" }] },
      ],
      intel_unlocks: [
        { _id: "unlock-1", projectName: "Monad", unlockDate: "2026-08-01" },
      ],
    });

    const result = await service.executeTool("fomoParserProfileCollections", {
      collectionNames: [
        "ico_projects",
        "dropstab_coin_detail_data",
        "intel_fundraising",
        "intel_investors",
        "intel_unlocks",
      ],
      sampleSize: 5,
    });
    const collections = (result.data.collections as any[]) || [];
    const icoProfile = collections.find((item) => item.collectionName === "ico_projects");

    expect(collections).toHaveLength(5);
    expect(icoProfile.topLevelFields.map((item: any) => item.field)).toEqual(
      expect.arrayContaining(["name", "slug", "website"])
    );
    expect(icoProfile.nestedFieldPaths.map((item: any) => item.path)).toEqual(
      expect.arrayContaining(["project.name", "project.sourceId"])
    );
    expect(icoProfile.identityFieldCandidates.namePaths).toEqual(
      expect.arrayContaining(["name", "project.name"])
    );
    expect(JSON.stringify(result)).not.toContain("secret raw page");
    expect((result.data.summary as any).totalDocs).toBe(5);
  });

  it("finds cross-source matches by slug and name without shared projectId", async () => {
    const { service } = createService({
      ico_projects: [{ _id: "ico-1", name: "Monad", slug: "monad", symbol: "MON" }],
      dropstab_coin_detail_data: [
        { _id: "dropstab-1", coinName: "Monad", coinSlug: "monad", coinSymbol: "MON" },
      ],
    });

    const result = await service.executeTool("fomoParserFindCrossSourceMatches", {
      leftCollection: "ico_projects",
      rightCollection: "dropstab_coin_detail_data",
      limit: 10,
    });
    const matches = (result.data.strongMatches as any[]) || [];

    expect(matches[0]).toEqual(
      expect.objectContaining({
        category: "strong",
        confidence: expect.any(Number),
        reasonCodes: expect.arrayContaining(["exact_normalized_slug"]),
      })
    );
    expect(matches[0].left.name).toBe("Monad");
    expect(matches[0].right.name).toBe("Monad");
    expect((result.data.summary as any).strong).toBe(1);
    expect(result.data.weakMatches).toEqual([]);
  });

  it("keeps weak short-symbol/name matches out of strong cross-source results", async () => {
    const { service } = createService({
      ico_projects: [{ _id: "ico-u", name: "U", symbol: "U" }],
      dropstab_coin_detail_data: [
        { _id: "dropstab-u", coinName: "Utexo", coinSymbol: "U" },
        { _id: "dropstab-u-short", coinName: "U", coinSymbol: "U" },
      ],
    });

    const result = await service.executeTool("fomoParserFindCrossSourceMatches", {
      leftCollection: "ico_projects",
      rightCollection: "dropstab_coin_detail_data",
      minConfidence: 0,
      limit: 10,
    });

    expect(result.data.strongMatches).toEqual([]);
    expect((result.data.weakMatches as any[]).map((item) => item.reasonCodes).flat()).toEqual(
      expect.arrayContaining(["short_exact_name"])
    );
  });

  it("finds top parser projects by detected identity path instead of grouping into null", async () => {
    const { service } = createService({
      intel_fundraising: [
        { _id: "funding-1", project: { name: "Monad" }, amountUsd: 100 },
        { _id: "funding-2", project: { name: "Monad" }, amountUsd: 200 },
        { _id: "funding-3", project: { name: "Berachain" }, amountUsd: 50 },
      ],
    });

    const result = await service.executeTool("fomoParserFindTopProjectsByCollection", {
      collectionName: "intel_fundraising",
      groupBy: "project",
      limit: 5,
    });
    const items = (result.data.items as any[]) || [];

    expect(result.data.selectedPath).toBe("project.name");
    expect(items[0].name).toBe("Monad");
    expect(items[0].identityPreview.projectName).toBe("Monad");
    expect(items[0].counts.records).toBe(2);
    expect(items[0].counts.intel_fundraising).toBe(2);
    expect(items[0].sampleIds).toEqual(["funding-1", "funding-2"]);
    expect(items[0].fundraisingPreview.amountsPreview).toEqual(
      expect.arrayContaining(["100", "200"])
    );
    expect((result.data.summary as any).warnings).toEqual([]);
  });

  it("finds project parser context without projectId", async () => {
    const { service } = createService({
      ico_projects: [{ _id: "ico-1", name: "Monad", slug: "monad" }],
      dropstab_coin_detail_data: [
        { _id: "dropstab-1", name: "Monad", coinSlug: "monad", website: "https://monad.xyz" },
      ],
    });

    const result = await service.executeTool("fomoParserFindProjectParserContext", {
      query: "Monad",
    });
    const matches = (result.data.matches as any[]) || [];

    expect(matches.map((item) => item.source)).toEqual(
      expect.arrayContaining(["ico_projects", "dropstab_coin_detail_data"])
    );
  });

  it("creates only a blocked safe proposal for allowlisted parser scripts", async () => {
    const { service } = createService({});

    const result = await service.executeTool("fomoParserCreateRunProposal", {
      scriptKey: "dropstab_investors_dry_run",
      args: { limit: 25, dryRun: false },
      reason: "Preview investors sync",
    });

    expect(result.data).toEqual(
      expect.objectContaining({
        scriptKey: "dropstab_investors_dry_run",
        canExecuteFromChatTool: false,
        requiresEmailConfirmation: true,
      })
    );
    expect((result.data.normalizedArgs as any).dryRun).toBe(true);
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("returns raw document preview without raw payload", async () => {
    const { service } = createService({
      parser_raw_documents: [
        {
          _id: "raw-1",
          sourceKey: "icodrops",
          sourceUrl: "https://example.test/project",
          payloadHash: "hash-1",
          contentType: "text/html",
          status: "captured",
          normalizedPreview: "Safe parser preview",
          rawPayload: { secret: "must-not-leak" },
        },
      ],
    });

    const result = await service.executeTool("fomoParserGetRawDocument", {
      rawId: "raw-1",
    });

    expect(result.data.rawDocument).toEqual(
      expect.objectContaining({
        rawId: "raw-1",
        payloadPreview: "Safe parser preview",
      })
    );
    expect(JSON.stringify(result)).not.toContain("must-not-leak");
    expect(JSON.stringify(result)).not.toContain("rawPayload");
  });

  it("blocks dangerous aggregate stages in tool input", async () => {
    const { service } = createService({ parser_runs: [] });

    const result = await service.executeTool("fomoParserListRuns", {
      pipeline: [{ $out: "unsafe_collection" }],
    });

    expect(result.data.error).toContain("Forbidden parser DB operation");
  });

  it("exposes named parser dev tools without raw Mongo execution", () => {
    const { service } = createService();
    const definitions = service.getToolDefinitions();
    const names = definitions.map((definition: any) => definition.name).join(" ");

    expect(names).toContain("fomoParserDbStatus");
    expect(names).toContain("fomoParserFindProjectParserContext");
    expect(names).toContain("fomoParserSearchDropstabCatalog");
    expect(names).toContain("fomoParserGetDropstabCatalogItem");
    expect(names).toContain("fomoParserGetDropstabDetailData");
    expect(names).toContain("fomoParserDevInsertOne");
    expect(names).toContain("fomoParserDevDeleteMany");
    expect(names).not.toMatch(/bulkWrite|replace|rawCommand|runCommand|adminCommand|eval|shell/i);
  });

  it("blocks parser dev writes when parser write tools are disabled", async () => {
    const { service } = createService(
      {},
      1,
      {
        ensureAiToolDbAccess: jest.fn(({ access }) => {
          if (access === "write") {
            const error = new Error("Parser DB write tools are disabled");
            (error as any).code = "PARSER_DEV_WRITE_NOT_AUTHORIZED";
            throw error;
          }
        }),
        isParserWriteToolsEnabled: jest.fn(() => false),
      }
    );

    const result = await service.executeTool(
      "fomoParserDevInsertOne",
      { collectionName: "parser_scratch", document: { name: "Draft" }, dryRun: false, confirm: true },
      { accessMode: "full_access" }
    );

    expect(result.data.errorCode).toBe("PARSER_DEV_WRITE_NOT_AUTHORIZED");
  });

  it("allows parser_new_dev writes when flag and access mode allow execution", async () => {
    const { service, db } = createService({});

    const result = await service.executeTool(
      "fomoParserDevInsertOne",
      { collectionName: "parser_scratch", document: { name: "Draft" }, dryRun: false, confirm: true },
      { accessMode: "full_access" }
    );

    expect(result.data).toEqual(
      expect.objectContaining({
        status: "done",
        createdCount: 1,
        targetDb: "parser_new_dev",
      })
    );
    expect(db.collection("parser_scratch").inserted).toHaveLength(1);
  });

  it("returns PARSER_DEV_WRITE_NOT_AUTHORIZED when Mongo rejects parser_new_dev writes", async () => {
    const { service, db } = createService({}, 1, {
      fakeDbOptions: { rejectWrites: true },
    });

    const result = await service.executeTool(
      "fomoParserDevInsertOne",
      { collectionName: "parser_scratch", document: { name: "Draft" }, dryRun: false, confirm: true },
      { accessMode: "full_access" }
    );

    expect(result.data).toEqual(
      expect.objectContaining({
        error: "PARSER_DEV_WRITE_NOT_AUTHORIZED",
        errorCode: "PARSER_DEV_WRITE_NOT_AUTHORIZED",
      })
    );
    expect(db.collection("parser_scratch").inserted).toHaveLength(0);
  });
});
