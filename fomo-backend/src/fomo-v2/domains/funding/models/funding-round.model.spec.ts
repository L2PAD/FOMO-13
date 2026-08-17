import { FomoV2FundingRoundSchema } from "./funding-round.model";

describe("FomoV2FundingRoundSchema provider identity indexes", () => {
  it("allows same-source same-date rounds when provider sourceId differs", () => {
    const indexes = FomoV2FundingRoundSchema.indexes() as any[];
    const definition = indexes.find(
      ([, options]) =>
        options?.name ===
        "uniq_funding_rounds_project_source_id_type_announced_date"
    );

    expect(definition?.[0]).toEqual({
      canonicalProjectId: 1,
      sourceType: 1,
      sourceId: 1,
      normalizedRoundType: 1,
      announcedDate: 1,
    });
    expect(definition?.[1]).toEqual(
      expect.objectContaining({
        unique: true,
        partialFilterExpression: expect.objectContaining({
          sourceType: { $type: "string" },
          sourceId: { $type: "string" },
        }),
      })
    );
  });
});
