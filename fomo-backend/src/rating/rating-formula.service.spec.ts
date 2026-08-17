import { RatingFormulaService } from "./rating-formula.service";
import { buildDefaultRatingEntitiesConfig } from "./rating.defaults";
import { RatingService } from "./rating.service";
import { FundsRatingService } from "src/funds/funds-rating.service";

describe("RatingFormulaService", () => {
  const service = new RatingFormulaService();
  const config = buildDefaultRatingEntitiesConfig().users.formula.modes.default;

  it("keeps the built-in score unchanged with default multipliers and caps", () => {
    const result = service.applyRating(
      {
        version: "user-v1",
        score: 45,
        components: { profileCompleteness: 20, activity: 30, reputation: 10 },
        penalties: [{ key: "missingWallet", value: -5, reason: "missing" }],
        caps: [{ key: "noActivitySignals", value: 45, reason: "cap" }],
        calculatedAt: new Date(),
      },
      config
    );

    expect(result.score).toBe(45);
  });

  it("applies configured component and penalty multipliers", () => {
    const result = service.applyRating(
      {
        version: "user-v1",
        score: 20,
        components: { activity: 20 },
        penalties: [{ key: "missingWallet", value: -10, reason: "missing" }],
        calculatedAt: new Date(),
      },
      {
        ...config,
        componentWeights: { ...config.componentWeights, activity: 2 },
        penaltyMultipliers: {
          ...config.penaltyMultipliers,
          missingWallet: 0.5,
        },
      }
    );

    expect(result.score).toBe(35);
    expect(result.components.activity).toBe(40);
    expect(result.penalties?.[0].value).toBe(-5);
  });

  it("can ignore built-in caps explicitly", () => {
    const result = service.applyRating(
      {
        version: "user-v1",
        score: 45,
        components: { activity: 80 },
        caps: [{ key: "cap", value: 45, reason: "cap" }],
        calculatedAt: new Date(),
      },
      { ...config, preserveDefaultCaps: false }
    );

    expect(result.score).toBe(80);
    expect(result.caps).toEqual([]);
  });

  it("applies a configured value to an active known cap", () => {
    const result = service.applyRating(
      {
        version: "user-v1",
        score: 45,
        components: { activity: 80 },
        caps: [{ key: "noActivitySignals", value: 45, reason: "cap" }],
        calculatedAt: new Date(),
      },
      {
        ...config,
        capValues: { ...config.capValues, noActivitySignals: 65 },
      }
    );

    expect(result.score).toBe(65);
    expect(result.caps?.[0].value).toBe(65);
  });

  it("keeps an active elite market guardrail after an upward multiplier", () => {
    const marketConfig =
      buildDefaultRatingEntitiesConfig().projects.formula.modes.market;
    const result = service.applyRating(
      {
        version: "market-v1",
        score: 90,
        components: { marketScaleLiquidity: 90 },
        caps: [
          {
            key: "eliteGuardrail",
            value: 94,
            reason: "Elite rating requires complete, fresh market data",
          },
        ],
        calculatedAt: new Date(),
      },
      {
        ...marketConfig,
        componentWeights: {
          ...marketConfig.componentWeights,
          marketScaleLiquidity: 2,
        },
      }
    );

    expect(result.score).toBe(94);
  });

  it("preserves the real built-in user score with the default config", () => {
    const ratingService = new RatingService(null as any);
    const user = { name: "Sparse", wallet: "0xabc", activityXP: 17 } as any;
    const fullness = ratingService.calculateUserFullness(user);
    const base = ratingService.calculateUserRatingBreakdown(
      user,
      fullness.score
    );
    const configuredFullness = service.applyFullness(fullness, config);
    const configured = service.applyRating(
      ratingService.calculateUserRatingBreakdown(
        user,
        configuredFullness.score
      ),
      config
    );

    expect(configuredFullness.score).toBe(fullness.score);
    expect(configured.score).toBe(base.score);
  });

  it("preserves the real built-in backer score with the default config", () => {
    const fundsRatingService = new FundsRatingService(null as any);
    const backerConfig =
      buildDefaultRatingEntitiesConfig().backers.formula.modes.default;
    const fund = {
      name: "Sparse Fund",
      slug: "sparse-fund",
      projectsCount: 2,
      projects: [{}, {}],
    } as any;
    const fullness = fundsRatingService.calculateFullness(fund);
    const base = fundsRatingService.calculateRating(fund, null, fullness.score);
    const configuredFullness = service.applyFullness(fullness, backerConfig);
    const configured = service.applyRating(
      fundsRatingService.calculateRating(fund, null, configuredFullness.score),
      backerConfig
    );

    expect(configuredFullness.score).toBe(fullness.score);
    expect(configured.score).toBe(base.score);
  });
});
