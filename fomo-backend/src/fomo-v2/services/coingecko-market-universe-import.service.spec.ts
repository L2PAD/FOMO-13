import { Types } from "mongoose";
import { CoinGeckoMarketUniverseDryRunService } from "./coingecko-market-universe-dry-run.service";
import { CoinGeckoMarketUniverseImportService } from "./coingecko-market-universe-import.service";
import { ResolveCanonicalProjectResult } from "./resolve-canonical-project.service";

const createdCandidateResult = (): ResolveCanonicalProjectResult => ({
  status: "created_candidate",
  verified: false,
  confidence: "none",
  matchedBy: "none",
  reason: "No existing canonical project matched.",
  candidates: [],
  conflicts: [],
  actions: [],
});

const conflictResult = (): ResolveCanonicalProjectResult => ({
  status: "conflict",
  verified: false,
  confidence: "none",
  matchedBy: "provider_id",
  reason: "Multiple canonical projects matched provider id.",
  candidates: [
    { canonicalProjectId: new Types.ObjectId().toHexString(), confidence: "exact", matchedBy: "provider_id", reason: "a" },
    { canonicalProjectId: new Types.ObjectId().toHexString(), confidence: "exact", matchedBy: "provider_id", reason: "b" },
  ],
  conflicts: [{ type: "provider_id", reason: "duplicate", candidateIds: ["a", "b"] }],
  actions: [],
});

const weakSymbolConflictResult = (): ResolveCanonicalProjectResult => ({
  status: "conflict",
  verified: false,
  confidence: "none",
  matchedBy: "symbol_only",
  reason: "Multiple canonical projects matched symbol-only lookup.",
  candidates: [
    { canonicalProjectId: new Types.ObjectId().toHexString(), confidence: "low", matchedBy: "symbol_only", reason: "candidate a" },
    { canonicalProjectId: new Types.ObjectId().toHexString(), confidence: "low", matchedBy: "symbol_only", reason: "candidate b" },
  ],
  conflicts: [{ type: "symbol_only", reason: "duplicate symbol", candidateIds: ["a", "b"] }],
  actions: [],
});

const matchedResult = (canonicalProjectId: string, matchedBy: "provider_id" | "contract" = "provider_id"): ResolveCanonicalProjectResult => ({
  status: "matched",
  canonicalProjectId,
  verified: true,
  confidence: "exact",
  matchedBy,
  reason: `Exact ${matchedBy} match.`,
  candidates: [{ canonicalProjectId, confidence: "exact", matchedBy, reason: `Exact ${matchedBy} match.` }],
  conflicts: [],
  actions: [],
});

const proposedSymbolOnlyResult = (canonicalProjectId: string): ResolveCanonicalProjectResult => ({
  status: "proposed",
  canonicalProjectId,
  verified: false,
  confidence: "low",
  matchedBy: "symbol_only",
  reason: "Symbol-only match is proposed only and never verified.",
  candidates: [{ canonicalProjectId, confidence: "low", matchedBy: "symbol_only", reason: "Symbol-only candidate." }],
  conflicts: [],
  actions: [],
});

describe("CoinGeckoMarketUniverseImportService", () => {
  it("refuses write without confirm flag", async () => {
    const harness = createHarness();

    await expect(harness.service.runWrite({ mode: "write", limit: 1 })).rejects.toThrow("confirm-write");
    expect(harness.migrationRunWriter.startRun).not.toHaveBeenCalled();
    expect(harness.models.sourceSnapshots.docs).toHaveLength(0);
  });

  it("refuses write on fomoland", async () => {
    const harness = createHarness({ dbName: "fomoland" });

    await expect(harness.service.runWrite({ mode: "write", confirmWrite: true, limit: 1 })).rejects.toThrow("fomoland");
    expect(harness.migrationRunWriter.startRun).not.toHaveBeenCalled();
  });

  it("creates expected docs for sample asset", async () => {
    const harness = createHarness();

    const result = await harness.service.runWrite({ mode: "write", confirmWrite: true, limit: 1 });

    expect(result.scanned).toBe(1);
    expect(result.resolver.createdCandidate).toBe(1);
    expect(result.written.sourceSnapshots.created).toBe(1);
    expect(result.written.sourceEntities.created).toBe(1);
    expect(result.written.marketAssets.created).toBe(1);
    expect(result.written.canonicalProjects.created).toBe(1);
    expect(result.written.projectAssetLinks.created).toBe(1);
    expect(result.written.canonicalProjectSources.created).toBe(1);

    expect(harness.models.sourceSnapshots.docs).toHaveLength(1);
    expect(harness.models.sourceEntities.docs).toHaveLength(1);
    expect(harness.models.marketAssets.docs).toHaveLength(1);
    expect(harness.models.canonicalProjects.docs).toHaveLength(1);
    expect(harness.models.projectAssetLinks.docs).toHaveLength(1);
    expect(harness.models.canonicalProjectSources.docs).toHaveLength(1);

    expect(harness.models.canonicalProjects.docs[0]).toMatchObject({
      name: "Ethereum",
      normalizedName: "ethereum",
      providerIds: { coingeckoId: "ethereum" },
      createdBy: "import",
      status: "active",
    });
    expect(harness.models.marketAssets.docs[0]).toMatchObject({
      name: "Ethereum",
      normalizedSymbol: "ETH",
      providerIds: { coingeckoId: "ethereum" },
      contractKeys: ["ethereum:0xabc"],
    });
    expect(harness.models.projectAssetLinks.docs[0]).toMatchObject({
      relationType: "primary_token",
      status: "active",
      verified: true,
    });
    expect(harness.models.canonicalProjectSources.docs[0]).toMatchObject({
      source: "coingecko",
      sourceEntityType: "asset",
      sourceId: "ethereum",
      status: "active",
      verified: true,
    });
    expect(harness.models.sourceSnapshots.docs[0].rawPayload.market.current_price).toBeUndefined();
    expect(harness.models.marketAssets.docs[0].metadata.current_price).toBeUndefined();
  });

  it("keeps requested write limit without capping to 1000", async () => {
    const harness = createHarness();

    const result = await harness.service.runWrite({ mode: "write", confirmWrite: true, limit: 3000 });

    expect(result.requestedLimit).toBe(3000);
    expect(result.all).toBe(false);
    expect(harness.migrationRunWriter.startRun).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          limit: 3000,
          all: false,
        }),
      }),
    );
  });

  it("supports all mode with null requested limit", async () => {
    const harness = createHarness();

    const result = await harness.service.runWrite({ mode: "write", confirmWrite: true, all: true });

    expect(result.requestedLimit).toBeNull();
    expect(result.all).toBe(true);
    expect(result.scanned).toBe(1);
    expect(harness.migrationRunWriter.startRun).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.objectContaining({
          limit: null,
          all: true,
        }),
      }),
    );
  });

  it("is idempotent on second run", async () => {
    const harness = createHarness();

    await harness.service.runWrite({ mode: "write", confirmWrite: true, limit: 1 });
    const second = await harness.service.runWrite({ mode: "write", confirmWrite: true, limit: 1 });

    expect(harness.models.sourceSnapshots.docs).toHaveLength(1);
    expect(harness.models.sourceEntities.docs).toHaveLength(1);
    expect(harness.models.marketAssets.docs).toHaveLength(1);
    expect(harness.models.canonicalProjects.docs).toHaveLength(1);
    expect(harness.models.projectAssetLinks.docs).toHaveLength(1);
    expect(harness.models.canonicalProjectSources.docs).toHaveLength(1);
    expect(second.written.sourceSnapshots.reused).toBe(1);
    expect(second.written.sourceEntities.reused).toBe(1);
    expect(second.written.marketAssets.reused).toBe(1);
    expect(second.written.canonicalProjects.reused).toBe(1);
    expect(second.written.projectAssetLinks.reused).toBe(1);
    expect(second.written.canonicalProjectSources.reused).toBe(1);
  });

  it("dedupes source snapshots by payload hash", async () => {
    const harness = createHarness();

    await harness.service.runWrite({ mode: "write", confirmWrite: true, limit: 1 });
    const firstHash = harness.models.sourceSnapshots.docs[0].payloadHash;
    await harness.service.runWrite({ mode: "write", confirmWrite: true, limit: 1 });

    expect(harness.models.sourceSnapshots.docs).toHaveLength(1);
    expect(harness.models.sourceSnapshots.docs[0].payloadHash).toBe(firstHash);
  });

  it("does not write profile, funding, unlock, or chart collections", async () => {
    const harness = createHarness();

    const result = await harness.service.runWrite({ mode: "write", confirmWrite: true, limit: 1 });

    expect(result.collectionsTouched).toEqual([
      "migration_runs",
      "source_snapshots",
      "source_entities",
      "market_assets",
      "canonical_projects",
      "project_asset_links",
      "canonical_project_sources",
    ]);
    expect(result.collectionsTouched).not.toEqual(
      expect.arrayContaining(["project_profiles", "funding_rounds", "unlock_events", "charts"]),
    );
  });

  it("conflict result prevents canonical source and asset link writes", async () => {
    const harness = createHarness({ resolverResult: conflictResult() });

    const result = await harness.service.runWrite({ mode: "write", confirmWrite: true, limit: 1 });

    expect(result.resolver.conflict).toBe(1);
    expect(result.skipped.conflicts).toBe(1);
    expect(harness.models.sourceSnapshots.docs).toHaveLength(1);
    expect(harness.models.sourceEntities.docs).toHaveLength(1);
    expect(harness.models.marketAssets.docs).toHaveLength(1);
    expect(harness.models.canonicalProjects.docs).toHaveLength(0);
    expect(harness.models.projectAssetLinks.docs).toHaveLength(0);
    expect(harness.models.canonicalProjectSources.docs).toHaveLength(0);
  });

  it("CoinGecko asset with weak symbol-only conflict still creates its own canonical project", async () => {
    const harness = createHarness({ resolverResult: weakSymbolConflictResult() });

    const result = await harness.service.runWrite({ mode: "write", confirmWrite: true, limit: 1 });

    expect(result.resolver.createdCandidate).toBe(1);
    expect(result.resolver.conflict).toBe(0);
    expect(result.skipped.conflicts).toBe(0);
    expect(harness.models.canonicalProjects.docs).toHaveLength(1);
    expect(harness.models.sourceEntities.docs[0]).toMatchObject({
      resolutionStatus: "created",
      matchedBy: "none",
    });
    expect(harness.models.projectAssetLinks.docs[0]).toMatchObject({
      status: "active",
      verified: true,
      matchedBy: "provider_id",
    });
    expect(harness.models.canonicalProjectSources.docs[0]).toMatchObject({
      status: "active",
      verified: true,
      matchedBy: "provider_id",
    });
  });

  it("CoinGecko asset with symbol-only candidate still creates its own canonical project", async () => {
    const weakCandidateId = new Types.ObjectId().toHexString();
    const harness = createHarness({ resolverResult: proposedSymbolOnlyResult(weakCandidateId) });

    const result = await harness.service.runWrite({ mode: "write", confirmWrite: true, limit: 1 });

    expect(result.resolver.createdCandidate).toBe(1);
    expect(result.resolver.proposed).toBe(0);
    expect(result.warnings[0]).toContain("symbol_only");
    expect(harness.models.canonicalProjects.docs).toHaveLength(1);
    expect(harness.models.canonicalProjects.docs[0]._id.toHexString()).not.toBe(weakCandidateId);
    expect(harness.models.canonicalProjects.docs[0]).toMatchObject({
      name: "Ethereum",
      providerIds: { coingeckoId: "ethereum" },
      status: "active",
    });
    expect(harness.models.canonicalProjects.docs[0].metadata.dedupeHints[0]).toMatchObject({
      candidateCanonicalProjectId: weakCandidateId,
      matchedBy: "symbol_only",
    });
    expect(harness.models.sourceEntities.docs[0]).toMatchObject({
      resolutionStatus: "created",
      matchedBy: "none",
      confidence: "none",
    });
    expect(harness.models.sourceEntities.docs[0].metadata.coinGeckoPolicyOverride).toMatchObject({
      originalStatus: "proposed",
      originalMatchedBy: "symbol_only",
      originalCanonicalProjectId: weakCandidateId,
    });
    expect(harness.models.projectAssetLinks.docs[0]).toMatchObject({
      status: "active",
      verified: true,
      matchedBy: "provider_id",
    });
    expect(harness.models.canonicalProjectSources.docs[0]).toMatchObject({
      status: "active",
      verified: true,
      matchedBy: "provider_id",
    });
  });

  it("exact CoinGecko id match reuses existing canonical project", async () => {
    const canonicalProjectId = new Types.ObjectId();
    const harness = createHarness({ resolverResult: matchedResult(canonicalProjectId.toHexString(), "provider_id") });
    harness.models.canonicalProjects.docs.push({
      _id: canonicalProjectId,
      name: "Existing Ethereum",
      providerIds: { coingeckoId: "ethereum" },
    });

    const result = await harness.service.runWrite({ mode: "write", confirmWrite: true, limit: 1 });

    expect(result.resolver.matched).toBe(1);
    expect(result.resolver.createdCandidate).toBe(0);
    expect(harness.models.canonicalProjects.docs).toHaveLength(1);
    expect(normalizeValue(harness.models.projectAssetLinks.docs[0].canonicalProjectId)).toBe(canonicalProjectId.toHexString());
    expect(harness.models.projectAssetLinks.docs[0]).toMatchObject({
      status: "active",
      verified: true,
      matchedBy: "provider_id",
    });
    expect(harness.models.sourceEntities.docs[0]).toMatchObject({
      resolutionStatus: "matched",
      matchedBy: "provider_id",
    });
  });

  it("contract match reuses existing canonical project", async () => {
    const canonicalProjectId = new Types.ObjectId();
    const harness = createHarness({ resolverResult: matchedResult(canonicalProjectId.toHexString(), "contract") });
    harness.models.canonicalProjects.docs.push({
      _id: canonicalProjectId,
      name: "Existing Contract Project",
    });

    const result = await harness.service.runWrite({ mode: "write", confirmWrite: true, limit: 1 });

    expect(result.resolver.matched).toBe(1);
    expect(result.resolver.createdCandidate).toBe(0);
    expect(harness.models.canonicalProjects.docs).toHaveLength(1);
    expect(normalizeValue(harness.models.projectAssetLinks.docs[0].canonicalProjectId)).toBe(canonicalProjectId.toHexString());
    expect(harness.models.projectAssetLinks.docs[0]).toMatchObject({
      status: "active",
      verified: true,
      matchedBy: "contract",
    });
  });
});

function createHarness(options: { dbName?: string; resolverResult?: ResolveCanonicalProjectResult } = {}) {
  const models = {
    sourceSnapshots: new FakeModel("source_snapshots"),
    sourceEntities: new FakeModel("source_entities"),
    canonicalProjects: new FakeModel("canonical_projects"),
    canonicalProjectSources: new FakeModel("canonical_project_sources"),
    marketAssets: new FakeModel("market_assets"),
    projectAssetLinks: new FakeModel("project_asset_links"),
  };
  const configService = {
    get: jest.fn((key: string) => (key === "DB_NAME" ? options.dbName || "fomo_new" : undefined)),
  };
  const coinGeckoClient = {
    fetchMarketsPage: jest.fn().mockImplementation(({ page }) =>
      Promise.resolve(
        page === 1
          ? [
              {
                id: "ethereum",
                name: "Ethereum",
                symbol: "eth",
                image: "https://assets.coingecko.com/ethereum.png",
                market_cap_rank: 2,
                current_price: 100,
                total_volume: 123,
              },
            ]
          : [],
      ),
    ),
    fetchCoinsList: jest.fn().mockResolvedValue([
      {
        id: "ethereum",
        name: "Ethereum",
        symbol: "eth",
        platforms: { ethereum: "0xABC" },
      },
    ]),
  };
  const resolver = {
    resolveCanonicalProject: jest.fn().mockResolvedValue(options.resolverResult || createdCandidateResult()),
  };
  const migrationRunWriter = {
    startRun: jest.fn().mockResolvedValue({
      id: new Types.ObjectId().toHexString(),
      runKey: "coingecko_market_universe:test",
    }),
    completeRun: jest.fn().mockResolvedValue(undefined),
    failRun: jest.fn().mockResolvedValue(undefined),
  };
  const dryRunMapper = new CoinGeckoMarketUniverseDryRunService(
    coinGeckoClient as any,
    resolver as any,
    configService as any,
  );

  return {
    service: new CoinGeckoMarketUniverseImportService(
      coinGeckoClient as any,
      resolver as any,
      dryRunMapper as any,
      migrationRunWriter as any,
      configService as any,
      models.sourceSnapshots as any,
      models.sourceEntities as any,
      models.canonicalProjects as any,
      models.canonicalProjectSources as any,
      models.marketAssets as any,
      models.projectAssetLinks as any,
    ),
    models,
    migrationRunWriter,
  };
}

class FakeModel {
  docs: any[] = [];

  constructor(readonly collectionName: string) {}

  async findOneAndUpdate(filter: Record<string, any>, update: Record<string, any>) {
    let doc = this.docs.find((candidate) => matches(candidate, filter));
    const created = !doc;

    if (!doc) {
      doc = { _id: new Types.ObjectId() };
      applySet(doc, update.$setOnInsert || {});
      this.docs.push(doc);
    }

    applySet(doc, update.$set || {});

    return {
      value: doc,
      lastErrorObject: created ? { upserted: doc._id } : { updatedExisting: true },
    };
  }

  async updateOne(filter: Record<string, any>, update: Record<string, any>) {
    const doc = this.docs.find((candidate) => matches(candidate, filter));
    if (!doc) return { matchedCount: 0, modifiedCount: 0 };
    applySet(doc, update.$set || {});
    if (update.$push) {
      for (const [path, value] of Object.entries(update.$push)) {
        const current = getPath(doc, path);
        setPath(doc, path, Array.isArray(current) ? [...current, value] : [value]);
      }
    }
    return { matchedCount: 1, modifiedCount: 1 };
  }
}

function matches(doc: any, filter: Record<string, any>): boolean {
  return Object.entries(filter).every(([path, expected]) => normalizeValue(getPath(doc, path)) === normalizeValue(expected));
}

function applySet(doc: any, values: Record<string, any>) {
  for (const [path, value] of Object.entries(values || {})) {
    if (value === undefined) continue;
    setPath(doc, path, value);
  }
}

function getPath(doc: any, path: string): any {
  return path.split(".").reduce((current, part) => (current ? current[part] : undefined), doc);
}

function setPath(doc: any, path: string, value: any) {
  const parts = path.split(".");
  let current = doc;
  for (const part of parts.slice(0, -1)) {
    if (!current[part] || typeof current[part] !== "object") current[part] = {};
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

function normalizeValue(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toHexString === "function") return value.toHexString();
  if (typeof value.toString === "function") return value.toString();
  return JSON.stringify(value);
}
