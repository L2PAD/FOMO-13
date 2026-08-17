import { isFomoV2UnlockReminderWorkerEnabled } from "./unlock-reminder.config";

describe("isFomoV2UnlockReminderWorkerEnabled", () => {
  it("is disabled by default and for invalid values", () => {
    expect(isFomoV2UnlockReminderWorkerEnabled(undefined)).toBe(false);
    expect(isFomoV2UnlockReminderWorkerEnabled("")).toBe(false);
    expect(isFomoV2UnlockReminderWorkerEnabled("false")).toBe(false);
    expect(isFomoV2UnlockReminderWorkerEnabled("unexpected")).toBe(false);
  });

  it("requires an explicit enabled value", () => {
    expect(isFomoV2UnlockReminderWorkerEnabled("true")).toBe(true);
    expect(isFomoV2UnlockReminderWorkerEnabled("1")).toBe(true);
    expect(isFomoV2UnlockReminderWorkerEnabled("YES")).toBe(true);
    expect(isFomoV2UnlockReminderWorkerEnabled("on")).toBe(true);
  });
});
