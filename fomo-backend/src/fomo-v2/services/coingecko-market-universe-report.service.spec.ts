import { buildCoinGeckoMarketUniverseReport } from "./coingecko-market-universe-report.service";

describe("CoinGecko market universe report", () => {
  it("calculates response duplicates, stale assets, and missing links", () => {
    const report = buildCoinGeckoMarketUniverseReport({
      dbName: "fomo_new",
      migrationRun: {
        _id: "run-1",
        status: "completed",
        counters: {
          scanned: 3,
          resolver: {
            matched: 2,
          },
          written: {
            sourceSnapshots: { created: 2, reused: 1 },
            sourceEntities: { created: 1, reused: 2 },
            marketAssets: { created: 1, reused: 2 },
            canonicalProjects: { created: 1, reused: 0 },
            projectAssetLinks: { created: 1, reused: 2 },
            canonicalProjectSources: { created: 1, reused: 2 },
          },
          errorsCount: 0,
        },
        metadata: {
          warnings: [],
        },
      },
      collectionCounts: {
        sourceSnapshots: 4,
      },
      sourceEntities: [
        {
          _id: "source-1",
          sourceId: "bitcoin",
          canonicalProjectId: "project-1",
          metadata: { latestMigrationRunId: "run-1" },
        },
        {
          _id: "source-2",
          sourceId: "ethereum",
          canonicalProjectId: "project-2",
          metadata: { latestMigrationRunId: "run-1" },
        },
        {
          _id: "source-stale",
          sourceId: "old-asset",
          canonicalProjectId: "project-stale",
          metadata: { latestMigrationRunId: "previous-run" },
        },
      ],
      marketAssets: [
        { _id: "asset-1", providerIds: { coingeckoId: "bitcoin" }, name: "Bitcoin" },
        { _id: "asset-2", providerIds: { coingeckoId: "ethereum" }, name: "Ethereum" },
        { _id: "asset-stale", providerIds: { coingeckoId: "old-asset" }, name: "Old Asset" },
      ],
      projectAssetLinks: [
        {
          _id: "link-1",
          canonicalProjectId: "project-1",
          marketAssetId: "asset-1",
          relationType: "primary_token",
          status: "active",
        },
        {
          _id: "link-stale",
          canonicalProjectId: "project-stale",
          marketAssetId: "asset-stale",
          relationType: "primary_token",
          status: "active",
        },
      ],
      canonicalProjectSources: [
        { _id: "source-ref-1", sourceId: "bitcoin", canonicalProjectId: "project-1", status: "active" },
        { _id: "source-ref-2", sourceId: "ethereum", canonicalProjectId: "project-2", status: "active" },
        { _id: "source-ref-stale", sourceId: "old-asset", canonicalProjectId: "project-stale", status: "active" },
      ],
      examplesLimit: 5,
    });

    expect(report.scannedRows).toBe(3);
    expect(report.uniqueCoingeckoIds).toBe(2);
    expect(report.duplicatesInResponse).toBe(1);
    expect(report.staleAssets).toBe(1);
    expect(report.missingLinks).toBe(1);
    expect(report.missingSourceEntities).toBe(0);
    expect(report.missingCanonicalSources).toBe(0);
    expect(report.created.marketAssets).toBe(1);
    expect(report.reused.marketAssets).toBe(2);
    expect(report.updated.marketAssets).toBe(2);
    expect(report.updated.canonicalProjects).toBe(2);
    expect(report.examples.staleAssets).toEqual([{ coingeckoId: "old-asset", name: "Old Asset" }]);
    expect(report.examples.missingLinks).toEqual([
      { coingeckoId: "ethereum", marketAssetId: "asset-2", name: "Ethereum" },
    ]);
  });

  it("reports missing source entities and canonical sources", () => {
    const report = buildCoinGeckoMarketUniverseReport({
      dbName: "fomo_new",
      migrationRun: {
        _id: "run-2",
        counters: {
          scanned: 1,
          written: {},
        },
      },
      collectionCounts: {
        sourceSnapshots: 1,
      },
      sourceEntities: [
        {
          _id: "source-1",
          sourceId: "bitcoin",
          canonicalProjectId: "project-1",
          metadata: { latestMigrationRunId: "run-2" },
        },
      ],
      marketAssets: [
        { _id: "asset-1", providerIds: { coingeckoId: "bitcoin" }, name: "Bitcoin" },
        { _id: "asset-orphan", providerIds: { coingeckoId: "orphan" }, name: "Orphan" },
      ],
      projectAssetLinks: [
        {
          _id: "link-1",
          canonicalProjectId: "project-1",
          marketAssetId: "asset-1",
          relationType: "primary_token",
          status: "active",
        },
      ],
      canonicalProjectSources: [],
      examplesLimit: 1,
    });

    expect(report.missingSourceEntities).toBe(1);
    expect(report.missingCanonicalSources).toBe(1);
    expect(report.examples.missingSourceEntities).toEqual([
      { coingeckoId: "orphan", marketAssetId: "asset-orphan", name: "Orphan" },
    ]);
    expect(report.examples.missingCanonicalSources).toEqual([
      { coingeckoId: "bitcoin", sourceEntityId: "source-1" },
    ]);
  });
});
