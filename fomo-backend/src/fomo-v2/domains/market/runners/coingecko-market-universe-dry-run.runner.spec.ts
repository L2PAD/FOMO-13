import { compactDryRunResult, parseArgs } from "./coingecko-market-universe-dry-run.runner";
import { CoinGeckoMarketUniverseDryRunResult } from "../services/coingecko-market-universe-dry-run.service";

describe("CoinGecko market universe dry-run runner", () => {
  it("uses compact summary output by default", () => {
    const args = parseArgs(["--limit=100"]);

    expect(args).toMatchObject({
      limit: 100,
      all: false,
      output: "summary",
      examplesLimit: 5,
      includePlatforms: true,
      write: false,
    });
  });

  it("parses all mode", () => {
    const args = parseArgs(["--all=true", "--limit=3000"]);

    expect(args.all).toBe(true);
    expect(args.limit).toBe(3000);
  });

  it("parses full output and examples limit", () => {
    const args = parseArgs(["--output=full", "--examples-limit=10", "--include-platforms=false"]);

    expect(args.output).toBe("full");
    expect(args.examplesLimit).toBe(10);
    expect(args.includePlatforms).toBe(false);
  });

  it("rejects invalid output mode", () => {
    expect(() => parseArgs(["--output=raw"])).toThrow('Use "summary" or "full"');
  });

  it("compacts result without assets or raw payload", () => {
    const result = fullResultFixture();

    const compact = compactDryRunResult(result);
    const serialized = JSON.stringify(compact);

    expect((compact as any).assets).toBeUndefined();
    expect(serialized).not.toContain("rawPayload");
    expect(serialized).not.toContain("current_price");
    expect(compact.examples.createdCandidates[0]).toMatchObject({
      coingeckoId: "bitcoin",
      name: "Bitcoin",
      symbol: "btc",
      contractsCount: 0,
      resolver: {
        status: "created_candidate",
        verified: false,
        confidence: "none",
        matchedBy: "none",
        candidatesCount: 0,
        conflictsCount: 0,
      },
      actions: [
        "would_create_source_snapshot",
        "would_create_source_entity",
        "would_create_market_asset",
        "would_create_canonical_project",
      ],
    });
  });
});

function fullResultFixture(): CoinGeckoMarketUniverseDryRunResult {
  const asset = {
    coingeckoId: "bitcoin",
    name: "Bitcoin",
    symbol: "btc",
    marketCapRank: 1,
    sourceUrl: "https://www.coingecko.com/en/coins/bitcoin",
    sourceSnapshotPreview: {
      source: "coingecko" as const,
      sourceEntityType: "asset" as const,
      sourceId: "bitcoin",
      rawPayload: {
        market: {
          id: "bitcoin",
          name: "Bitcoin",
          symbol: "btc",
          current_price: 100,
        } as any,
      },
    },
    contracts: [],
    resolver: {
      status: "created_candidate" as const,
      verified: false,
      confidence: "none" as const,
      matchedBy: "none" as const,
      reason: "No verified canonical project match found.",
      candidates: [],
      conflicts: [],
      actions: [],
    },
    actions: [
      {
        type: "would_create_source_snapshot",
        description: "Would store raw CoinGecko asset payload in source_snapshots.",
      },
      {
        type: "would_create_source_entity",
        description: "Would register CoinGecko asset in source_entities.",
      },
      {
        type: "would_create_market_asset",
        description: "Would create or update market asset identity.",
      },
      {
        type: "would_create_canonical_project",
        description: "Would create a new canonical project candidate for this CoinGecko asset.",
        verified: false,
      },
    ],
  };

  return {
    mode: "dry-run",
    dbName: "fomo_new",
    warnings: [],
    scanned: 1,
    requestedLimit: 1,
    resolver: {
      matched: 0,
      createdCandidate: 1,
      proposed: 0,
      conflict: 0,
      unresolved: 0,
    },
    wouldCreate: {
      sourceSnapshots: 1,
      sourceEntities: 1,
      marketAssets: 1,
      canonicalProjects: 1,
      projectAssetLinks: 0,
      canonicalProjectSources: 0,
      dedupeReviewItems: 0,
    },
    conflicts: [],
    examples: {
      createdCandidates: [asset],
      matched: [],
      conflicts: [],
      proposed: [],
    },
    assets: [asset],
  };
}
