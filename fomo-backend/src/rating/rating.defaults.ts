import {
  RATING_ENTITY_TYPES,
  RatingEntitiesConfig,
  RatingEntityType,
  RatingFormulaCatalog,
  RatingFormulaModeConfig,
  RatingRuntimeState,
} from "./rating.types";

type ModeDefaults = {
  components: string[];
  fullnessComponents: string[];
  penalties: string[];
  capValues: Record<string, number>;
};

const MODE_DEFAULTS: Record<RatingEntityType, Record<string, ModeDefaults>> = {
  projects: {
    ico: {
      components: [
        "sourceDataConfidence",
        "profileNarrative",
        "fundraisingQuality",
        "backersSocialCommunity",
        "tokenomics",
        "marketTraction",
        "riskConsistency",
      ],
      fullnessComponents: [
        "coreIdentity",
        "descriptionMedia",
        "linksSocialExplorers",
        "fundraisingData",
        "tokenomicsVestingAllocation",
        "marketData",
        "peopleCommunity",
      ],
      penalties: [
        "redStatus",
        "redFlags",
        "missingSourceKey",
        "staleLastParsedAt",
        "missingFundraising",
        "missingTokenomics",
      ],
      capValues: {},
    },
    market: {
      components: [
        "dataConfidence",
        "marketScaleLiquidity",
        "tokenSupplyValuation",
        "momentumPerformance",
        "profileCommunity",
        "resilienceRisk",
      ],
      fullnessComponents: [
        "identitySource",
        "marketQuote",
        "supplyValuation",
        "descriptionLinks",
        "performanceHistory",
        "communityIntel",
      ],
      penalties: [
        "redStatus",
        "redFlags",
        "missingMarketData",
        "staleMarketData",
        "inactiveTrading",
        "supplyInconsistency",
        "weakLiquidity",
        "missingVolume",
        "lowFullness",
        "weakIdentity",
      ],
      capValues: {
        missingCoreMarketData: 45,
        lowFullness: 60,
        inactiveTrading: 70,
        eliteGuardrail: 94,
      },
    },
  },
  backers: {
    default: {
      components: [
        "sourceDataConfidence",
        "profileCompleteness",
        "portfolioStrength",
        "roiPerformance",
        "fundraisingActivity",
        "coInvestorNetwork",
        "socialMarketPresence",
        "riskConsistency",
      ],
      fullnessComponents: [
        "basicProfile",
        "socialLinks",
        "investmentData",
        "stats",
      ],
      penalties: [
        "redStatus",
        "redFlags",
        "missingPortfolio",
        "missingInvestorDetail",
        "missingSocialLinks",
        "staleActivity",
      ],
      capValues: { missingPortfolio: 45, missingStableSource: 60 },
    },
  },
  users: {
    default: {
      components: [
        "profileCompleteness",
        "activity",
        "reputation",
        "socialPresence",
      ],
      fullnessComponents: [
        "identity",
        "contactsAndWallets",
        "activityFootprint",
        "portfolioData",
        "reputationData",
      ],
      penalties: [
        "banned",
        "redFlags",
        "negativeReviews",
        "missingWallet",
        "missingSocialLinks",
        "lowFullness",
        "inactiveAccount",
        "noActivitySignals",
      ],
      capValues: {
        noActivitySignals: 45,
        lowFullness: 60,
        missingWallet: 70,
        unverified: 95,
      },
    },
  },
};

const schedule = (cron: string) => ({
  enabled: false,
  cron,
  timezone: "UTC",
});

function multipliers(keys: string[]): Record<string, number> {
  return Object.fromEntries(keys.map((key) => [key, 1]));
}

function modeConfig(defaults: ModeDefaults): RatingFormulaModeConfig {
  return {
    componentWeights: multipliers(defaults.components),
    fullnessComponentWeights: multipliers(defaults.fullnessComponents),
    penaltyMultipliers: multipliers(defaults.penalties),
    capValues: { ...defaults.capValues },
    minScore: 0,
    maxScore: 100,
    preserveDefaultCaps: true,
  };
}

function modes(
  entityType: RatingEntityType
): Record<string, RatingFormulaModeConfig> {
  return Object.fromEntries(
    Object.entries(MODE_DEFAULTS[entityType]).map(([key, defaults]) => [
      key,
      modeConfig(defaults),
    ])
  );
}

export function buildDefaultRatingEntitiesConfig(): RatingEntitiesConfig {
  return {
    projects: {
      enabled: true,
      batchSize: 200,
      schedule: schedule("0 0 2 * * *"),
      formula: { modes: modes("projects") },
    },
    backers: {
      enabled: true,
      batchSize: 200,
      schedule: schedule("0 15 2 * * *"),
      formula: { modes: modes("backers") },
    },
    users: {
      enabled: true,
      batchSize: 200,
      schedule: schedule("0 30 2 * * *"),
      formula: { modes: modes("users") },
    },
  };
}

export function buildIdleRatingRuntime(): RatingRuntimeState {
  return {
    state: "idle",
    running: false,
    runId: null,
    trigger: null,
    configVersion: null,
    fence: 0,
    startedAt: null,
    heartbeatAt: null,
    leaseExpiresAt: null,
    finishedAt: null,
    lastRunAt: null,
    lastResult: null,
    lastError: null,
  };
}

export function getRatingFormulaCatalog(): RatingFormulaCatalog {
  return Object.fromEntries(
    RATING_ENTITY_TYPES.map((entityType) => [
      entityType,
      Object.fromEntries(
        Object.entries(MODE_DEFAULTS[entityType]).map(([mode, defaults]) => [
          mode,
          {
            components: [...defaults.components],
            fullnessComponents: [...defaults.fullnessComponents],
            penalties: [...defaults.penalties],
            caps: Object.keys(defaults.capValues),
          },
        ])
      ),
    ])
  ) as RatingFormulaCatalog;
}
