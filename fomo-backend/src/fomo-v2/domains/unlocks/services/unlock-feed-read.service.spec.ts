import { Types } from "mongoose";
import { FomoV2UnlockFeedReadService } from "./unlock-feed-read.service";

function leanResult(value: any) {
  return { lean: jest.fn().mockResolvedValue(value) };
}

describe("FomoV2UnlockFeedReadService", () => {
  it("resolves multiple calendar aliases in one unlock-event query", async () => {
    const eventId = new Types.ObjectId();
    const canonicalProjectId = new Types.ObjectId();
    const marketAssetId = new Types.ObjectId();
    const event = {
      _id: eventId,
      canonicalFingerprint: "unlock-fingerprint",
      canonicalProjectId,
      marketAssetId,
      percentOfSupply: 2,
      sourceType: "intel_unlocks",
      unlockDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    };
    const limit = jest.fn().mockReturnValue(leanResult([event]));
    const unlockEventModel = {
      find: jest.fn().mockReturnValue({ limit }),
    };
    const marketReadModel = {
      find: jest.fn().mockReturnValue(
        leanResult([
          {
            canonicalProjectId,
            marketAssetId,
            name: "Solana",
            providerIds: { coingeckoId: "solana" },
            slug: "solana",
            symbol: "SOL",
          },
        ])
      ),
    };
    const emptyModel = {
      find: jest.fn().mockReturnValue(leanResult([])),
    };
    const service = new FomoV2UnlockFeedReadService(
      unlockEventModel as any,
      marketReadModel as any,
      emptyModel as any,
      emptyModel as any,
      emptyModel as any
    );

    const result = await service.resolveCalendarEvents([
      String(eventId),
      "unlock-fingerprint",
    ]);

    expect(unlockEventModel.find).toHaveBeenCalledTimes(1);
    expect(limit).toHaveBeenCalledWith(8);
    expect(result.get(String(eventId))?.sourceId).toBe(String(eventId));
    expect(result.get("unlock-fingerprint")?.sourceId).toBe(String(eventId));
  });
});
