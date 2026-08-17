import { buildDefaultRatingEntitiesConfig } from "./rating.defaults";
import {
  applyRuntimeRatingFormula,
  loadRatingFormulaRuntimeFromMongo,
  setRatingFormulaRuntime,
} from "./rating-formula.runtime";

describe("rating formula runtime loader", () => {
  afterEach(() => {
    setRatingFormulaRuntime({
      version: 1,
      updatedAt: null,
      entities: buildDefaultRatingEntitiesConfig(),
    });
  });

  it("deep-merges a partial persisted singleton with formula defaults", async () => {
    const settingsUpdatedAt = new Date("2026-08-02T00:00:00.000Z");
    const database = {
      collection: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue({
          _id: "global",
          version: 7,
          settingsUpdatedAt,
          entities: {
            users: {
              formula: {
                modes: {
                  default: {
                    componentWeights: { activity: 2 },
                  },
                },
              },
            },
          },
        }),
      }),
    };

    const loaded = await loadRatingFormulaRuntimeFromMongo(database);
    const result = applyRuntimeRatingFormula("users", "default", {
      version: "user-v1",
      score: 20,
      components: { activity: 20 },
      calculatedAt: new Date(),
    });

    expect(database.collection).toHaveBeenCalledWith("rating_configs");
    expect(loaded.version).toBe(7);
    expect(loaded.updatedAt).toEqual(settingsUpdatedAt);
    expect(loaded.entities.projects.formula.modes.market.capValues).toEqual({
      missingCoreMarketData: 45,
      lowFullness: 60,
      inactiveTrading: 70,
      eliteGuardrail: 94,
    });
    expect(result.score).toBe(40);
    expect(result.inputs.ratingConfigVersion).toBe(7);
  });

  it("uses built-in defaults when the singleton does not exist", async () => {
    const database = {
      collection: jest.fn().mockReturnValue({
        findOne: jest.fn().mockResolvedValue(null),
      }),
    };

    const loaded = await loadRatingFormulaRuntimeFromMongo(database);

    expect(loaded.version).toBe(1);
    expect(
      loaded.entities.users.formula.modes.default.componentWeights.activity
    ).toBe(1);
  });

  it("propagates database failures instead of silently switching write scripts to defaults", async () => {
    const database = {
      collection: jest.fn().mockReturnValue({
        findOne: jest.fn().mockRejectedValue(new Error("database unavailable")),
      }),
    };

    await expect(loadRatingFormulaRuntimeFromMongo(database)).rejects.toThrow(
      "database unavailable"
    );
  });
});
