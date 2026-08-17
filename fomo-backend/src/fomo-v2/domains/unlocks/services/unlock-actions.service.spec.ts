import { Types } from "mongoose";
import { FomoV2UnlockActionsService } from "./unlock-actions.service";

function leanResult(value: any) {
  return { lean: jest.fn().mockResolvedValue(value) };
}

describe("FomoV2UnlockActionsService", () => {
  const userId = "64b64c0000000000000000aa";
  const unlockId = "64b64c0000000000000000bb";
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  function createResolution(overrides: Record<string, any> = {}) {
    return {
      sourceId: unlockId,
      unlock: {
        coinSlug: "solana",
        coinSymbol: "sol",
        detailed: {
          image: "sol.png",
          name: "Solana",
          symbol: "SOL",
        },
        nextUnlockTokensAmount: 472602,
        nextUnlockValueUsd: 1000,
        nextUnlockPercent: 0.09,
      },
      unlockEvent: {
        id: unlockId,
        allocation: "Alameda & FTX Bankruptcy",
        coinSlug: "solana",
        symbol: "SOL",
        tokensAmount: 472602,
        tokensPercent: 0.09,
        unlockDate: futureDate,
        unlockValueUsd: 1000,
      },
      ...overrides,
    };
  }

  it("creates a private crypto calendar event for a v2 unlock", async () => {
    const createdEvent = { _id: new Types.ObjectId(), sourceId: unlockId };
    const eventModel = {
      create: jest.fn().mockResolvedValue(createdEvent),
      findOne: jest.fn().mockResolvedValue(null),
    };
    const feedReadService = {
      resolveCalendarEvent: jest.fn().mockResolvedValue(createResolution()),
    };
    const service = new FomoV2UnlockActionsService(
      eventModel as any,
      feedReadService as any
    );

    const result = await service.addUnlockToCalendar(userId, unlockId);

    expect(result.success).toBe(true);
    expect(result.alreadyExists).toBe(false);
    expect(eventModel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        isPrivate: true,
        page: "crypto",
        projectName: "Solana",
        projectSlug: "solana",
        sourceId: unlockId,
        sourceType: "token_unlock",
        status: "active",
        tokenSymbol: "SOL",
        unlockAmount: 472602,
        unlockPercent: 0.09,
        userId: new Types.ObjectId(userId),
      })
    );
  });

  it("returns user action state by requested alias id", async () => {
    const aliasId = "source-fingerprint";
    const eventModel = {
      find: jest.fn().mockReturnValue(
        leanResult([
          {
            notifyAt: futureDate,
            notifyEnabled: true,
            sourceId: unlockId,
          },
        ])
      ),
    };
    const feedReadService = {
      resolveCalendarEvents: jest.fn().mockResolvedValue(
        new Map([
          [aliasId, createResolution({ sourceId: unlockId })],
        ]),
      ),
    };
    const service = new FomoV2UnlockActionsService(
      eventModel as any,
      feedReadService as any
    );

    const result = await service.getUserActions(userId, aliasId);

    expect(result[aliasId]).toEqual({
      inCalendar: true,
      notifyAt: futureDate,
      reminderEnabled: true,
    });
    expect(result[unlockId]).toEqual(result[aliasId]);
  });

  it("enables reminder on an existing calendar event", async () => {
    const existingEvent = { _id: new Types.ObjectId(), sourceId: unlockId };
    const updatedEvent = {
      ...existingEvent,
      notifyEnabled: true,
    };
    const eventModel = {
      findOne: jest.fn().mockResolvedValue(existingEvent),
      findOneAndUpdate: jest.fn().mockResolvedValue(updatedEvent),
    };
    const feedReadService = {
      resolveCalendarEvent: jest.fn().mockResolvedValue(createResolution()),
    };
    const service = new FomoV2UnlockActionsService(
      eventModel as any,
      feedReadService as any
    );

    const result = await service.enableUnlockReminder(userId, unlockId, {
      notifyBeforeMinutes: 60,
    });

    expect(result.success).toBe(true);
    expect(result.alreadyExists).toBe(true);
    expect(eventModel.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: existingEvent._id },
      {
        $set: expect.objectContaining({
          notifyBeforeMinutes: 60,
          notifyEnabled: true,
        }),
        $unset: {
          notifyClaimedAt: "",
          notifyClaimedBy: "",
          notifyLastError: "",
          notifySentAt: "",
        },
      },
      { new: true }
    );
  });
});
