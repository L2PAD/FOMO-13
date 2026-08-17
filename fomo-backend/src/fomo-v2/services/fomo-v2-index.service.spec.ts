import {
  FOMO_V2_OWNED_PRIMARY_MODEL_DEFINITIONS,
  FOMO_V2_OWNED_PRIMARY_MODEL_NAMES,
  FOMO_V2_PARSER_REGISTRATION_MODEL_NAMES,
} from "../persistence";
import { FomoV2IndexService } from "./fomo-v2-index.service";
import { FomoV2FundingRoundSchema } from "../domains/funding/models";

describe("FomoV2IndexService", () => {
  it("blocks unlock_events canonicalFingerprint unique index when duplicates exist", async () => {
    const service = new (FomoV2IndexService as any)({ get: jest.fn() }, {});
    const model = {
      collection: {
        collectionName: "unlock_events",
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([
            {
              _id: "duplicate-fingerprint",
              count: 2,
              ids: ["64b64c000000000000000001", "64b64c000000000000000002"],
            },
          ]),
        }),
      },
    };

    await expect(
      (service as any).assertSafeToCreateDeclaredIndexes(model)
    ).rejects.toThrow("duplicate canonicalFingerprint");
  });

  it("indexes the owned primary registry exactly once", () => {
    expect(FOMO_V2_OWNED_PRIMARY_MODEL_NAMES).toEqual(
      FOMO_V2_OWNED_PRIMARY_MODEL_DEFINITIONS.map(
        (definition) => definition.name
      )
    );
    expect(new Set(FOMO_V2_OWNED_PRIMARY_MODEL_NAMES).size).toBe(
      FOMO_V2_OWNED_PRIMARY_MODEL_NAMES.length
    );
    expect(FOMO_V2_OWNED_PRIMARY_MODEL_NAMES).toEqual(
      [...FOMO_V2_OWNED_PRIMARY_MODEL_NAMES].sort((left, right) =>
        left.localeCompare(right)
      )
    );
    expect(
      FOMO_V2_PARSER_REGISTRATION_MODEL_NAMES.filter((name) =>
        FOMO_V2_OWNED_PRIMARY_MODEL_NAMES.includes(name)
      )
    ).toEqual([]);
  });

  it("declares funding round date uniqueness within provider sourceId", () => {
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
    expect(definition?.[1]?.unique).toBe(true);
  });

  it("marks the old cross-source funding date index obsolete", () => {
    const service = new (FomoV2IndexService as any)({ get: jest.fn() }, {});
    const obsolete = (service as any).obsoleteIndexNames(
      { collection: { collectionName: "funding_rounds" } },
      [
        "_id_",
        "uniq_funding_rounds_project_type_announced_date",
        "uniq_funding_rounds_project_source_type_announced_date",
      ]
    );

    expect(obsolete).toEqual([
      "uniq_funding_rounds_project_type_announced_date",
      "uniq_funding_rounds_project_source_type_announced_date",
    ]);
  });

  it("marks the old global parser activity id index obsolete", () => {
    const service = new (FomoV2IndexService as any)({ get: jest.fn() }, {});

    expect(
      (service as any).obsoleteIndexNames(
        { collection: { collectionName: "activities" } },
        ["_id_", "uniq_activities_parser_id"]
      )
    ).toEqual(["uniq_activities_parser_id"]);
  });

  it("marks legacy cross-source vesting name indexes obsolete", () => {
    const service = new (FomoV2IndexService as any)({ get: jest.fn() }, {});

    expect(
      (service as any).obsoleteIndexNames(
        { collection: { collectionName: "token_allocations" } },
        ["_id_", "uniq_token_allocations_project_normalized_name"]
      )
    ).toEqual(["uniq_token_allocations_project_normalized_name"]);
    expect(
      (service as any).obsoleteIndexNames(
        { collection: { collectionName: "vesting_rounds" } },
        ["_id_", "uniq_vesting_rounds_project_normalized_round"]
      )
    ).toEqual(["uniq_vesting_rounds_project_normalized_round"]);
    expect(
      (service as any).obsoleteIndexNames(
        { collection: { collectionName: "vesting_schedules" } },
        ["_id_", "idx_vesting_schedules_project_normalized_round"]
      )
    ).toEqual(["idx_vesting_schedules_project_normalized_round"]);
  });

  it("marks legacy non-unique ICO source indexes obsolete", () => {
    const service = new (FomoV2IndexService as any)({ get: jest.fn() }, {});

    expect(
      (service as any).obsoleteIndexNames(
        { collection: { collectionName: "project_source_profiles" } },
        [
          "_id_",
          "idx_project_source_profiles_source_slug",
          "idx_project_source_profiles_source_project_id",
        ]
      )
    ).toEqual([
      "idx_project_source_profiles_source_slug",
      "idx_project_source_profiles_source_project_id",
    ]);
    expect(
      (service as any).obsoleteIndexNames(
        { collection: { collectionName: "ico_project_read_models" } },
        ["_id_", "idx_ico_project_read_models_project_source"]
      )
    ).toEqual(["idx_ico_project_read_models_project_source"]);
  });

  it("blocks a source identity index when one provider ID is linked twice", async () => {
    const service = new (FomoV2IndexService as any)({ get: jest.fn() }, {});
    const model = {
      collection: {
        collectionName: "project_source_profiles",
        aggregate: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([
            {
              _id: { sourceType: "icodrops", sourceProjectId: "same-id" },
              count: 2,
              ids: ["one", "two"],
            },
          ]),
        }),
      },
    };

    await expect(
      (service as any).assertSafeToCreateDeclaredIndexes(model)
    ).rejects.toThrow("duplicate sourceType/sourceProjectId");

    expect(model.collection.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        { $match: { sourceProjectId: { $type: "string" } } },
      ])
    );
  });

  it("audits every row covered by the non-partial ICO project/source index", async () => {
    const service = new (FomoV2IndexService as any)({ get: jest.fn() }, {});
    const aggregate = jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]),
    });
    const model = {
      collection: {
        collectionName: "ico_project_read_models",
        aggregate,
      },
    };

    await (service as any).assertSafeToCreateDeclaredIndexes(model);

    expect(aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([{ $match: {} }])
    );
  });

  it("creates replacement indexes before dropping obsolete indexes", async () => {
    const calls: string[] = [];
    const listIndexes = jest
      .fn()
      .mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([
          { name: "_id_" },
          {
            name: "idx_project_source_profiles_source_slug",
            key: { sourceSlug: 1 },
          },
        ]),
      })
      .mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([
          { name: "_id_" },
          { name: "uniq_project_source_profiles_source_slug" },
        ]),
      });
    const aggregate = jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]),
    });
    const model = {
      collection: {
        collectionName: "project_source_profiles",
        listIndexes,
        aggregate,
        createIndex: jest.fn(async () => {
          calls.push("create");
        }),
        dropIndex: jest.fn(async () => {
          calls.push("drop");
        }),
      },
      schema: {
        indexes: jest.fn().mockReturnValue([
          [
            { sourceType: 1, sourceSlug: 1 },
            { name: "uniq_project_source_profiles_source_slug" },
          ],
        ]),
      },
    };
    const service = new (FomoV2IndexService as any)(
      { get: jest.fn().mockReturnValue("test") },
      {}
    );
    jest.spyOn(service as any, "indexedModels").mockReturnValue([model]);

    const result = await service.ensureIndexes({ confirmWrite: true });

    expect(calls).toEqual(["create", "drop"]);
    expect(result.collections[0].droppedIndexes).toEqual([
      "idx_project_source_profiles_source_slug",
    ]);
  });

  it("does not drop any obsolete index when a later replacement build fails", async () => {
    const first = {
      collection: {
        collectionName: "funding_rounds",
        listIndexes: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([
            { name: "_id_" },
            {
              name: "uniq_funding_rounds_project_type_announced_date",
              key: { legacyFundingIdentity: 1 },
            },
          ]),
        }),
        dropIndex: jest.fn(),
        createIndex: jest.fn().mockResolvedValue("new_funding_index"),
      },
      schema: {
        indexes: jest.fn().mockReturnValue([
          [{ canonicalFingerprint: 1 }, { name: "new_funding_index" }],
        ]),
      },
    };
    const second = {
      collection: {
        collectionName: "token_allocations",
        listIndexes: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([
            { name: "_id_" },
            {
              name: "uniq_token_allocations_project_normalized_name",
              key: { legacyAllocationIdentity: 1 },
            },
          ]),
        }),
        dropIndex: jest.fn(),
        createIndex: jest
          .fn()
          .mockRejectedValue(new Error("late unique index build failed")),
      },
      schema: {
        indexes: jest.fn().mockReturnValue([
          [{ canonicalFingerprint: 1 }, { name: "new_allocation_index" }],
        ]),
      },
    };
    const service = new (FomoV2IndexService as any)(
      { get: jest.fn().mockReturnValue("test") },
      {}
    );
    jest
      .spyOn(service as any, "indexedModels")
      .mockReturnValue([first, second]);

    await expect(
      service.ensureIndexes({ confirmWrite: true })
    ).rejects.toThrow("late unique index build failed");

    expect(first.collection.createIndex).toHaveBeenCalledTimes(1);
    expect(first.collection.dropIndex).not.toHaveBeenCalled();
    expect(second.collection.dropIndex).not.toHaveBeenCalled();
  });

  it("replaces a controlled same-key index without triggering IndexOptionsConflict", async () => {
    const calls: string[] = [];
    let oldIndexPresent = true;
    const listIndexes = jest
      .fn()
      .mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([
          { name: "_id_", key: { _id: 1 } },
          {
            name: "uniq_activities_parser_id",
            key: { parserActivityId: 1 },
            unique: true,
            sparse: true,
          },
        ]),
      })
      .mockReturnValueOnce({
        toArray: jest.fn().mockResolvedValue([
          { name: "_id_", key: { _id: 1 } },
          {
            name: "idx_activities_parser_id",
            key: { parserActivityId: 1 },
            sparse: true,
          },
        ]),
      });
    const model = {
      collection: {
        collectionName: "activities",
        listIndexes,
        dropIndex: jest.fn(async () => {
          calls.push("drop");
          oldIndexPresent = false;
        }),
        createIndex: jest.fn(async () => {
          calls.push("create");
          if (oldIndexPresent) {
            const error: any = new Error("IndexOptionsConflict");
            error.code = 85;
            throw error;
          }
          return "idx_activities_parser_id";
        }),
      },
      schema: {
        indexes: jest.fn().mockReturnValue([
          [
            { parserActivityId: 1 },
            { name: "idx_activities_parser_id", sparse: true },
          ],
        ]),
      },
    };
    const service = new (FomoV2IndexService as any)(
      { get: jest.fn().mockReturnValue("test") },
      {}
    );
    jest.spyOn(service as any, "indexedModels").mockReturnValue([model]);

    const result = await service.ensureIndexes({ confirmWrite: true });

    expect(calls).toEqual(["drop", "create"]);
    expect(result.collections[0].droppedIndexes).toEqual([
      "uniq_activities_parser_id",
    ]);
    expect(result.collections[0].createdIndexes).toEqual([
      "idx_activities_parser_id",
    ]);
  });
});
