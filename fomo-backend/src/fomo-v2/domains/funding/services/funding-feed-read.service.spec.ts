import { FomoV2FundingFeedReadService } from "./funding-feed-read.service";

describe("FomoV2FundingFeedReadService list pipeline sorting", () => {
  const service = new FomoV2FundingFeedReadService(
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any,
    {} as any
  );

  it("sorts only inside the selected fast-list window", () => {
    const pipeline = (service as any).fastListPipeline(
      { mode: "fundsRaisedDesc" },
      20,
      100
    );
    const facet = pipeline.find((stage: any) => stage.$facet).$facet;

    expect(facet.total).toEqual([{ $count: "count" }]);
    expect(facet.rounds.slice(0, 4)).toEqual([
      { $sort: { fundingDate: -1, _id: 1 } },
      { $skip: 20 },
      { $limit: 100 },
      { $sort: { fundsRaisedForSort: -1, fundingDate: -1, _id: 1 } },
    ]);
  });

  it("sorts only inside the selected post-lookup window", () => {
    const pipeline = (service as any).fullLookupListPipeline(
      { mode: "fomoScoreDesc" },
      0,
      100,
      [{ $match: { hasToken: true } }]
    );
    const facet = pipeline.find((stage: any) => stage.$facet).$facet;

    expect(facet.total).toEqual([{ $count: "count" }]);
    expect(facet.rounds).toEqual([
      { $sort: { fundingDate: -1, _id: 1 } },
      { $skip: 0 },
      { $limit: 100 },
      { $sort: { projectFomoScore: -1, fundingDate: -1, _id: 1 } },
    ]);
  });

  it("loads project data after selecting the fast-list window for fomoScore sorting", () => {
    const pipeline = (service as any).fastListPipeline(
      { mode: "fomoScoreDesc" },
      0,
      100
    );
    const facet = pipeline.find((stage: any) => stage.$facet).$facet;

    expect(facet.rounds.slice(0, 3)).toEqual([
      { $sort: { fundingDate: -1, _id: 1 } },
      { $skip: 0 },
      { $limit: 100 },
    ]);
    expect(facet.rounds[facet.rounds.length - 1]).toEqual({
      $sort: { projectFomoScore: -1, fundingDate: -1, _id: 1 },
    });
  });

  it("builds indexed read-model filters for search and investor filtering", () => {
    const investorId = "64b000000000000000000001";
    const match = (service as any).buildReadModelMatch({
      search: "Animoca Brands",
      categories: "DeFi",
      investors: investorId,
      investorNames: "A16Z",
      hasToken: "yes",
      fomoScore: "50-100",
    });

    expect(match.$and).toEqual(
      expect.arrayContaining([
        { visible: true },
        {
          $and: [{ searchPrefixes: "animoca" }, { searchPrefixes: "brands" }],
        },
        { categoryKeys: { $in: ["defi"] } },
        {
          $or: [
            { investorIds: { $in: [investorId] } },
            { investorNameKeys: { $in: ["a16z"] } },
          ],
        },
        { hasToken: true },
        { $or: [{ projectFomoScore: { $gte: 50, $lte: 100 } }] },
      ])
    );
  });
});
