import { calculateFomoV2CanonicalProjectScores } from "./canonical-project-rating.helper";

describe("calculateFomoV2CanonicalProjectScores", () => {
  const now = new Date("2026-06-15T00:00:00.000Z");

  it("scores a well-covered hybrid project highly", () => {
    const result = calculateFomoV2CanonicalProjectScores({
      calculatedAt: now,
      canonicalProject: {
        name: "Fomo Network",
        normalizedName: "fomo network",
        symbol: "FOMO",
        slug: "fomo-network",
        status: "active",
        primaryWebsiteDomain: "fomo.network",
        providerIds: {
          coingeckoId: "fomo-network",
          cryptorankId: "fomo-network",
        },
        aliases: [
          {
            type: "name",
            value: "Fomo Network",
            normalizedValue: "fomo network",
            confidence: "exact",
          },
          {
            type: "symbol",
            value: "FOMO",
            normalizedValue: "fomo",
            confidence: "high",
          },
          {
            type: "contract",
            value: "0x123",
            normalizedValue: "0x123",
            confidence: "exact",
          },
        ],
        hasMarketData: true,
        metadata: {
          description: "A liquid crypto project with broad ecosystem coverage.",
          logoUrl: "https://fomo.network/logo.png",
          categories: ["DeFi", "Infrastructure"],
          socials: { twitter: "fomonetwork", telegram: "fomo", github: "fomo" },
          twitterFollowers: 250000,
          tokenAllocation: { ecosystem: 40 },
        },
      },
      sources: [
        {
          source: "coingecko",
          status: "active",
          confidence: "exact",
          verified: true,
          sourceId: "fomo-network",
        },
        {
          source: "cryptorank",
          status: "active",
          confidence: "high",
          verified: true,
          sourceId: "fomo-network",
        },
      ],
      marketProject: {
        marketAssetId: "asset1",
        name: "Fomo Network",
        symbol: "FOMO",
        slug: "fomo-network",
        logo: "https://fomo.network/logo.png",
        description: "Market profile",
        website: ["https://fomo.network"],
        categories: ["DeFi", "Infrastructure"],
        socialmedia: [
          { name: "twitter", url: "https://x.com/fomonetwork" },
          { name: "telegram", url: "https://t.me/fomo" },
        ],
        contracts: [{ chain: "ethereum", address: "0x123" }],
        price: 2,
        marketCap: 750_000_000,
        fullyDilutedMarketCap: 1_200_000_000,
        volume24h: 80_000_000,
        volume24hChange: 80,
        rank: 120,
        priceChange: 8,
        circulatingSupply: 400_000_000,
        totalSupply: 700_000_000,
        maxSupply: 1_000_000_000,
        athUsd: 3,
        performance: { usd: { change7d: 12, change30d: 25 } },
        chart7dPointsCount: 168,
        marketDataUpdatedAt: new Date("2026-06-14T12:00:00.000Z"),
      },
      sourceProfiles: [
        {
          sourceType: "icodrops",
          description: "ICO profile",
          website: "https://fomo.network",
          socials: { twitter: "fomonetwork", discord: "fomo" },
          categories: ["DeFi"],
          profileCompleteness: 90,
        },
      ],
      icoProjects: [
        { profileCompleteness: 88, metadata: { tokenomics: { sale: 10 } } },
      ],
      fundingRounds: [
        {
          status: "active",
          roundType: "seed",
          announcedDate: new Date("2026-01-15T00:00:00.000Z"),
          raisedAmount: 12_000_000,
          valuation: 120_000_000,
          confidence: "high",
          sourceRefs: [{ source: "cryptorank" }],
        },
        {
          status: "active",
          roundType: "series_a",
          announcedDate: new Date("2026-05-01T00:00:00.000Z"),
          raisedAmount: 25_000_000,
          confidence: "exact",
        },
      ],
      fundingParticipants: [
        {
          status: "active",
          backerId: "a",
          backerName: "Alpha",
          isLead: true,
          confidence: "high",
        },
        {
          status: "active",
          backerId: "b",
          backerName: "Beta",
          confidence: "medium",
        },
        {
          status: "active",
          backerId: "c",
          backerName: "Gamma",
          confidence: "medium",
        },
      ],
      vestingSummaries: [
        {
          unlockedPercent: 35,
          lockedPercent: 65,
          nextUnlockDate: new Date("2026-07-01T00:00:00.000Z"),
          calculatedAt: new Date("2026-06-14T00:00:00.000Z"),
        },
      ],
    });

    expect(result.ratingBreakdown.version).toBe("canonical-project-v1");
    expect(result.ratingBreakdown.mode).toBe("hybrid");
    expect(result.fomoScore).toBeGreaterThanOrEqual(70);
    expect(result.fullness).toBeGreaterThanOrEqual(75);
  });

  it("lets a pre-market project score from funding and profile signals", () => {
    const result = calculateFomoV2CanonicalProjectScores({
      calculatedAt: now,
      canonicalProject: {
        name: "Early Labs",
        normalizedName: "early labs",
        symbol: "EARLY",
        slug: "early-labs",
        status: "active",
        primaryWebsiteDomain: "early.example",
        providerIds: { icodropsId: "early-labs" },
        aliases: [
          {
            type: "name",
            value: "Early Labs",
            normalizedValue: "early labs",
            confidence: "high",
          },
          {
            type: "symbol",
            value: "EARLY",
            normalizedValue: "early",
            confidence: "high",
          },
          {
            type: "contract",
            value: "0xearly",
            normalizedValue: "0xearly",
            confidence: "medium",
          },
        ],
        metadata: {
          description: "Pre-market project",
          logoUrl: "https://early.example/logo.png",
          categories: ["AI"],
          socials: { twitter: "earlylabs", telegram: "early" },
          tokenAllocation: { community: 50, team: 20 },
          tokenomics: { supply: 1_000_000_000 },
        },
      },
      sources: [
        {
          source: "icodrops",
          status: "active",
          confidence: "high",
          verified: true,
          sourceId: "early-labs",
        },
      ],
      sourceProfiles: [
        {
          description: "Profile",
          website: "https://early.example",
          socials: {
            twitter: "earlylabs",
            telegram: "early",
            discord: "early",
          },
          logoUrl: "https://early.example/logo.png",
          categories: ["AI"],
          profileCompleteness: 80,
        },
      ],
      fundingRounds: [
        {
          status: "active",
          roundType: "seed",
          announcedDate: new Date("2026-03-01T00:00:00.000Z"),
          raisedAmount: 8_000_000,
          confidence: "high",
        },
        {
          status: "active",
          roundType: "strategic",
          announcedDate: new Date("2026-05-01T00:00:00.000Z"),
          raisedAmount: 5_000_000,
          valuation: 80_000_000,
          confidence: "medium",
        },
      ],
      fundingParticipants: [
        {
          status: "active",
          backerId: "lead",
          backerName: "Lead Fund",
          isLead: true,
          confidence: "high",
        },
        {
          status: "active",
          backerId: "angel",
          backerName: "Angel",
          confidence: "medium",
        },
        {
          status: "active",
          backerId: "builder",
          backerName: "Builder Fund",
          confidence: "medium",
        },
      ],
      vestingSummaries: [{ lockedPercent: 100, calculatedAt: now }],
    });

    expect(result.ratingBreakdown.mode).toBe("pre_market");
    expect(result.fomoScore).toBeGreaterThanOrEqual(55);
    expect(result.ratingBreakdown.penalties || []).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "missingMarketData" }),
      ])
    );
  });

  it("caps identity-only projects", () => {
    const result = calculateFomoV2CanonicalProjectScores({
      calculatedAt: now,
      canonicalProject: {
        name: "Name Only",
        normalizedName: "name only",
        symbol: "NAME",
        slug: "name-only",
        status: "proposed",
        primaryWebsiteDomain: "name.example",
        providerIds: { coingeckoId: "name-only" },
        aliases: [
          {
            type: "name",
            value: "Name Only",
            normalizedValue: "name only",
            confidence: "high",
          },
          {
            type: "symbol",
            value: "NAME",
            normalizedValue: "name",
            confidence: "medium",
          },
        ],
        sourceEvidence: { importedFrom: "manual-check" },
      },
    });

    expect(result.ratingBreakdown.mode).toBe("identity_only");
    expect(result.fomoScore).toBeLessThanOrEqual(45);
    expect(result.ratingBreakdown.caps).toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "identityOnly" })])
    );
  });

  it("scores blue-chip market-only projects above 90 without forcing fullness to 100", () => {
    const result = calculateFomoV2CanonicalProjectScores({
      calculatedAt: now,
      canonicalProject: {
        name: "Bitcoin",
        normalizedName: "bitcoin",
        symbol: "BTC",
        slug: "bitcoin",
        status: "active",
        primaryWebsiteDomain: "bitcoin.org",
        providerIds: { coingeckoId: "bitcoin" },
        aliases: [
          {
            type: "name",
            value: "Bitcoin",
            normalizedValue: "bitcoin",
            confidence: "exact",
          },
          {
            type: "symbol",
            value: "BTC",
            normalizedValue: "btc",
            confidence: "exact",
          },
        ],
        hasMarketData: true,
        metadata: {
          description: "Peer-to-peer digital money.",
          logoUrl:
            "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
          categories: ["Layer 1", "Store of Value"],
          socials: { twitter: "bitcoin", github: "bitcoin" },
        },
      },
      sources: [
        {
          source: "coingecko",
          status: "active",
          confidence: "exact",
          verified: true,
          sourceId: "bitcoin",
        },
      ],
      marketProject: {
        marketAssetId: "btc",
        name: "Bitcoin",
        symbol: "BTC",
        slug: "bitcoin",
        logo: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
        description: "Peer-to-peer digital money.",
        website: ["https://bitcoin.org"],
        categories: ["Layer 1", "Store of Value"],
        socialmedia: [
          { name: "twitter", url: "https://x.com/bitcoin" },
          { name: "github", url: "https://github.com/bitcoin" },
        ],
        price: 100_000,
        marketCap: 2_000_000_000_000,
        fullyDilutedMarketCap: 2_100_000_000_000,
        volume24h: 45_000_000_000,
        volume24hChange: 20,
        priceChange: 2,
        circulatingSupply: 19_700_000,
        totalSupply: 21_000_000,
        maxSupply: 21_000_000,
        athUsd: 120_000,
        performance: { usd: { change7d: 4, change30d: 10 } },
        chart7dPointsCount: 168,
        marketDataUpdatedAt: new Date("2026-06-14T12:00:00.000Z"),
      },
    });

    expect(result.ratingBreakdown.mode).toBe("market");
    expect(result.fomoScore).toBeGreaterThanOrEqual(90);
    expect(result.fullness).toBeGreaterThanOrEqual(60);
    expect(result.fullness).toBeLessThan(90);
  });

  it("penalizes and caps stale market data", () => {
    const result = calculateFomoV2CanonicalProjectScores({
      calculatedAt: now,
      canonicalProject: {
        name: "Stale Token",
        normalizedName: "stale token",
        symbol: "STALE",
        slug: "stale-token",
        status: "active",
        providerIds: { coingeckoId: "stale-token" },
        hasMarketData: true,
      },
      sources: [
        {
          source: "coingecko",
          status: "active",
          confidence: "exact",
          verified: true,
          sourceId: "stale-token",
        },
      ],
      marketProject: {
        price: 1,
        marketCap: 500_000_000,
        volume24h: 10_000_000,
        rank: 150,
        marketDataUpdatedAt: new Date("2026-04-01T00:00:00.000Z"),
      },
    });

    expect(result.ratingBreakdown.penalties).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "staleMarketData" }),
      ])
    );
    expect(result.fomoScore).toBeLessThanOrEqual(70);
  });
});
