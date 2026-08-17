import { FomoV2UnlockReminderService } from "./unlock-reminder.service";

function leanResult(value: any) {
  return { lean: jest.fn().mockResolvedValue(value) };
}

describe("FomoV2UnlockReminderService", () => {
  const userId = "64b64c0000000000000000aa";
  const eventId = "64b64c0000000000000000bb";

  it("atomically claims and delivers one due reminder", async () => {
    const event = {
      _id: eventId,
      name: "Solana token unlock",
      projectName: "Solana",
      userId,
    };
    const eventModel = {
      findOneAndUpdate: jest
        .fn()
        .mockReturnValueOnce(leanResult(event))
        .mockReturnValueOnce(leanResult(null)),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const userModel = {
      findById: jest.fn().mockReturnValue(
        leanResult({
          email: "holder@example.com",
          emailNotification: true,
          telegramData: { telegramId: "12345" },
          telegramNotification: true,
        })
      ),
    };
    const emailService = {
      sendNotification: jest.fn().mockResolvedValue(undefined),
    };
    const telegramService = {
      sendNotification: jest.fn().mockResolvedValue({ success: true }),
    };
    const service = new FomoV2UnlockReminderService(
      eventModel as any,
      userModel as any,
      emailService as any,
      telegramService as any
    );

    await service.sendDueUnlockReminders();

    expect(eventModel.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        notifyEnabled: true,
        sourceType: "token_unlock",
      }),
      expect.objectContaining({
        $inc: { notifyAttemptCount: 1 },
        $set: expect.objectContaining({ notifyClaimedBy: expect.any(String) }),
      }),
      expect.objectContaining({ new: true })
    );
    expect(telegramService.sendNotification).toHaveBeenCalledWith(
      "12345",
      "Solana",
      "https://fomo.cx/crypto/calendar"
    );
    expect(emailService.sendNotification).toHaveBeenCalledWith(
      "holder@example.com",
      "Solana",
      "https://fomo.cx/crypto/calendar"
    );
    expect(eventModel.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: eventId }),
      expect.objectContaining({
        $set: { notifySentAt: expect.any(Date) },
      })
    );
  });

  it("releases the claim when delivery fails", async () => {
    const eventModel = {
      findOneAndUpdate: jest
        .fn()
        .mockReturnValueOnce(
          leanResult({
            _id: eventId,
            projectName: "Solana",
            userId,
          })
        )
        .mockReturnValueOnce(leanResult(null)),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const userModel = {
      findById: jest.fn().mockReturnValue(
        leanResult({
          email: "holder@example.com",
          emailNotification: true,
        })
      ),
    };
    const emailService = {
      sendNotification: jest.fn().mockRejectedValue(new Error("email down")),
    };
    const service = new FomoV2UnlockReminderService(
      eventModel as any,
      userModel as any,
      emailService as any,
      { sendNotification: jest.fn() } as any
    );

    await service.sendDueUnlockReminders();

    expect(eventModel.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: eventId }),
      {
        $set: { notifyLastError: "email down" },
        $unset: {
          notifyClaimedAt: "",
          notifyClaimedBy: "",
        },
      }
    );
  });
});
