import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { FomoV2FundingRoundsIntelSyncDto } from "./funding-rounds-compatibility.dto";

describe("FomoV2FundingRoundsIntelSyncDto", () => {
  it("normalizes bounded sync input", async () => {
    const dto = plainToInstance(FomoV2FundingRoundsIntelSyncDto, {
      limit: "200",
      dryRun: "true",
      sourceType: "DROPSTAB",
      sourceDocumentIds: "64b000000000000000000001,64b000000000000000000002",
    });

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto).toEqual(
      expect.objectContaining({
        limit: 200,
        dryRun: true,
        sourceType: "dropstab",
        sourceDocumentIds: [
          "64b000000000000000000001",
          "64b000000000000000000002",
        ],
      })
    );
  });

  it("rejects attempts to exceed the HTTP sync bound", async () => {
    const dto = plainToInstance(FomoV2FundingRoundsIntelSyncDto, {
      limit: "201",
    });

    const errors = await validate(dto);

    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: "limit" })])
    );
  });

  it("rejects malformed booleans instead of silently enabling a mode", async () => {
    const dto = plainToInstance(FomoV2FundingRoundsIntelSyncDto, {
      dryRun: "sometimes",
    });

    const errors = await validate(dto);

    expect(errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ property: "dryRun" })])
    );
  });
});
