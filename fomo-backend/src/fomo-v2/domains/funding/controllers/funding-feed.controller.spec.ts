import { FomoV2FundingFeedController } from "./funding-feed.controller";

describe("FomoV2FundingFeedController", () => {
  it("returns project rounds from the native FOMO v2 route", async () => {
    const service = {
      getProjectRounds: jest.fn().mockResolvedValue([{ _id: "round-1" }]),
    };
    const controller = new FomoV2FundingFeedController(service as any);

    await expect(
      controller.getProjectRounds("bitcoin", {
        lookup: "slug",
        limit: 50,
      }),
    ).resolves.toEqual([{ _id: "round-1" }]);
    expect(service.getProjectRounds).toHaveBeenCalledWith("bitcoin", {
      lookup: "slug",
      limit: 50,
    });
  });
});
