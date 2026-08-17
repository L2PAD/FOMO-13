import { BadRequestException } from "@nestjs/common";
import { RatingConfigService } from "./rating-config.service";

describe("RatingConfigService cron validation", () => {
  const service = new RatingConfigService({} as any);

  it("rejects a burst schedule when a short gap is not necessarily the first gap", () => {
    expect(() =>
      (service as any).validateCron("0 0,1,8 * * * *", "UTC", "projects")
    ).toThrow(BadRequestException);

    expect(() =>
      (service as any).validateCron("0 0,1,8 * * * *", "UTC", "projects")
    ).toThrow("schedule interval must be at least 5 minutes");
  });

  it("accepts a schedule whose adjacent occurrences are five minutes apart", () => {
    expect(() =>
      (service as any).validateCron("0 */5 * * * *", "UTC", "users")
    ).not.toThrow();
  });
});

describe("RatingConfigService nested config validation", () => {
  const service = new RatingConfigService({} as any);

  it.each([
    ["entity arrays", { projects: [] }, "projects must be an object"],
    [
      "unknown entity keys",
      { projects: { enabled: true, typo: true } },
      "Unknown projects key(s): typo",
    ],
    [
      "schedule arrays",
      { projects: { schedule: [] } },
      "projects.schedule must be an object",
    ],
    [
      "unknown schedule keys",
      { projects: { schedule: { enabled: true, interval: "daily" } } },
      "Unknown projects.schedule key(s): interval",
    ],
    [
      "unknown formula keys",
      { users: { formula: { modes: {}, expression: "unsafe" } } },
      "Unknown users.formula key(s): expression",
    ],
    [
      "mode arrays",
      { users: { formula: { modes: { default: [] } } } },
      "users.formula.modes.default must be an object",
    ],
    [
      "unknown mode keys",
      {
        users: {
          formula: { modes: { default: { arbitraryJavascript: "1 + 1" } } },
        },
      },
      "Unknown users.formula.modes.default key(s): arbitraryJavascript",
    ],
  ])("rejects %s", (_label, input, message) => {
    expect(() => (service as any).validateNestedConfigShape(input)).toThrow(
      message
    );
  });
});
