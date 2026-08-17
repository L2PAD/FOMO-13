import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import {
  FomoV2UnlockCalendarActionDto,
  FomoV2UnlockFeedQueryDto,
  FomoV2UnlockUserActionsQueryDto,
} from "./unlock-query.dto";

describe("fomo v2 unlock DTOs", () => {
  it("normalizes bounded feed query values", async () => {
    const dto = plainToInstance(FomoV2UnlockFeedQueryDto, {
      limit: "50",
      minValueUsd: "1000.50",
      offset: "10",
      small_unlocks: "false",
      sortBy: "nextUnlockValueUsd",
      sortOrder: "desc",
      status: "upcoming",
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({
      limit: 50,
      minValueUsd: 1000.5,
      offset: 10,
      small_unlocks: false,
    });
  });

  it("rejects unsafe feed bounds and unknown booleans", async () => {
    const dto = plainToInstance(FomoV2UnlockFeedQueryDto, {
      limit: "101",
      offset: "100001",
      small_unlocks: "sometimes",
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property).sort()).toEqual([
      "limit",
      "offset",
      "small_unlocks",
    ]);
  });

  it("normalizes comma-separated and repeated action ids", async () => {
    const dto = plainToInstance(FomoV2UnlockUserActionsQueryDto, {
      ids: ["id-one,id-two", "id-one"],
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.ids).toEqual(["id-one", "id-two"]);
  });

  it("rejects reminder offsets outside the supported year", async () => {
    const dto = plainToInstance(FomoV2UnlockCalendarActionDto, {
      notifyBeforeMinutes: String(365 * 24 * 60 + 1),
      notifyEnabled: "true",
    });

    const errors = await validate(dto);
    expect(errors.map((error) => error.property)).toContain(
      "notifyBeforeMinutes"
    );
    expect(dto.notifyEnabled).toBe(true);
  });
});
