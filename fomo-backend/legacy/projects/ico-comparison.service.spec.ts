import { IcoComparisonService } from "./ico-comparison.service";

const buildService = () =>
  new IcoComparisonService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
  ) as any;

describe("IcoComparisonService peer ranking", () => {
  it("keeps comparison peers with ROI and similar market cap, FDV, and raised funds", () => {
    const service = buildService();
    const target = {
      name: "Target",
      marketCap: 100_000_000,
      fdv: 120_000_000,
      fundraisingTotal: 20_000_000,
      roiX: 10,
      categories: ["Layer 1"],
      chains: ["Solana"],
    };
    const peers = [
      {
        name: "Similar without ROI",
        marketCap: 105_000_000,
        fdv: 118_000_000,
        fundraisingTotal: 19_000_000,
      },
      {
        name: "Far with ROI",
        marketCap: 10_000_000_000,
        fdv: 12_000_000_000,
        fundraisingTotal: 5_000_000_000,
        roiX: 3,
      },
      {
        name: "Similar with ROI",
        marketCap: 150_000_000,
        fdv: 180_000_000,
        fundraisingTotal: 30_000_000,
        roiPercent: 50,
        categories: ["Layer 1"],
        chains: ["Solana"],
      },
      {
        name: "Closest with ROI",
        marketCap: 102_000_000,
        fdv: 122_000_000,
        fundraisingTotal: 21_000_000,
        currentRoiFromIco: -10,
        categories: ["Layer 1"],
        chains: ["Solana"],
      },
    ];

    const result = service.rankComparisonPeers(target, peers, 5);

    expect(result.map((peer: any) => peer.name)).toEqual([
      "Closest with ROI",
      "Similar with ROI",
    ]);
  });

  it("requires at least two comparable size metrics when the target has them", () => {
    const service = buildService();
    const target = {
      marketCap: 100_000_000,
      fdv: 120_000_000,
      fundraisingTotal: 20_000_000,
      roiX: 10,
    };
    const peers = [
      {
        name: "Only market cap",
        marketCap: 100_000_000,
        roiX: 2,
      },
      {
        name: "Market cap and raised",
        marketCap: 110_000_000,
        fundraisingTotal: 22_000_000,
        roiX: 2,
      },
    ];

    const result = service.rankComparisonPeers(target, peers, 5);

    expect(result.map((peer: any) => peer.name)).toEqual(["Market cap and raised"]);
  });

  it("fills remaining peer slots with best real ROI candidates when strict matches are scarce", () => {
    const service = buildService();
    const target = {
      marketCap: 100_000_000,
      fdv: 120_000_000,
      fundraisingTotal: 20_000_000,
      roiX: 10,
    };
    const peers = [
      {
        name: "Strict match",
        marketCap: 120_000_000,
        fdv: 130_000_000,
        fundraisingTotal: 22_000_000,
        roiX: 4,
      },
      {
        name: "Fallback match",
        marketCap: 2_000_000_000,
        fdv: 2_400_000_000,
        fundraisingTotal: 300_000_000,
        roiX: 3,
      },
      {
        name: "Too far",
        marketCap: 40_000_000_000,
        fdv: 50_000_000_000,
        fundraisingTotal: 8_000_000_000,
        roiX: 2,
      },
    ];

    const result = service.rankComparisonPeers(target, peers, 2);

    expect(result.map((peer: any) => peer.name)).toEqual([
      "Strict match",
      "Fallback match",
    ]);
  });

  it("deduplicates project and market records for the same asset", () => {
    const service = buildService();
    const currentProject = {
      _id: "project-solana",
      slug: "solana",
      name: "Solana",
    };
    const peers = [
      {
        _id: "market-solana",
        projectType: "market",
        slug: "solana",
        name: "Solana",
      },
      {
        _id: "market-sui",
        projectType: "market",
        slug: "sui",
        name: "Sui",
      },
      {
        _id: "project-sui",
        projectType: "project",
        slug: "sui",
        name: "SUI",
      },
    ];

    const result = service.dedupeProjects(peers, currentProject);

    expect(result.map((peer: any) => peer._id)).toEqual(["market-sui"]);
  });
});
