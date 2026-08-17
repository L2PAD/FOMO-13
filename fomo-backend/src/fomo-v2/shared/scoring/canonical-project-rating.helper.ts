import type {
  FomoV2CanonicalProjectScoreMode,
  FomoV2CanonicalProjectScoreResult,
} from "../../models/canonical-project.model";
import type { FomoV2Confidence } from "../../fomo-v2.types";

export type FomoV2CanonicalProjectRatingInput = {
  canonicalProject?: Record<string, any> | null;
  sources?: Array<Record<string, any>>;
  marketProject?: Record<string, any> | null;
  marketProjects?: Array<Record<string, any>>;
  icoProjects?: Array<Record<string, any>>;
  sourceProfiles?: Array<Record<string, any>>;
  fundingRounds?: Array<Record<string, any>>;
  fundingParticipants?: Array<Record<string, any>>;
  vestingSummaries?: Array<Record<string, any>>;
  redFlags?: number | any[];
  calculatedAt?: Date;
};

export type FomoV2CanonicalProjectScores = {
  fomoScore: number;
  rating: number;
  fullness: number;
  ratingBreakdown: FomoV2CanonicalProjectScoreResult;
  fullnessBreakdown: FomoV2CanonicalProjectScoreResult;
  metadataPatch: Record<string, any>;
};

type ComponentWeights = Record<string, number>;

type RatingContext = {
  canonicalProject: Record<string, any>;
  sources: Array<Record<string, any>>;
  marketProject: Record<string, any>;
  marketProjects: Array<Record<string, any>>;
  icoProjects: Array<Record<string, any>>;
  sourceProfiles: Array<Record<string, any>>;
  fundingRounds: Array<Record<string, any>>;
  fundingParticipants: Array<Record<string, any>>;
  vestingSummaries: Array<Record<string, any>>;
  redFlagsCount: number;
  calculatedAt: Date;
  mode: FomoV2CanonicalProjectScoreMode;
};

const RATING_VERSION = "canonical-project-v1" as const;

const RATING_WEIGHTS: Record<
  FomoV2CanonicalProjectScoreMode,
  ComponentWeights
> = {
  hybrid: {
    identityTrust: 10,
    sourceConfidence: 8,
    profileCoverage: 12,
    marketQuality: 28,
    marketMomentum: 8,
    fundingBackers: 16,
    tokenomicsVesting: 10,
    community: 4,
    riskResilience: 4,
  },
  market: {
    identityTrust: 12,
    sourceConfidence: 10,
    profileCoverage: 7,
    marketQuality: 60,
    marketMomentum: 4,
    tokenomicsVesting: 3,
    riskResilience: 4,
  },
  pre_market: {
    identityTrust: 12,
    sourceConfidence: 8,
    profileCoverage: 14,
    marketQuality: 8,
    fundingBackers: 26,
    tokenomicsVesting: 16,
    community: 8,
    riskResilience: 8,
  },
  identity_only: {
    identityTrust: 35,
    sourceConfidence: 35,
    profileCoverage: 20,
    riskResilience: 10,
  },
};

const FULLNESS_WEIGHTS: Record<
  FomoV2CanonicalProjectScoreMode,
  ComponentWeights
> = {
  hybrid: {
    identityCoverage: 15,
    sourceCoverage: 12,
    profileData: 18,
    marketData: 20,
    fundingData: 15,
    tokenData: 13,
    communityData: 7,
  },
  market: {
    identityCoverage: 16,
    sourceCoverage: 12,
    profileData: 18,
    marketData: 25,
    fundingData: 8,
    tokenData: 14,
    communityData: 7,
  },
  pre_market: {
    identityCoverage: 18,
    sourceCoverage: 12,
    profileData: 20,
    fundingData: 22,
    tokenData: 18,
    communityData: 10,
  },
  identity_only: {
    identityCoverage: 45,
    sourceCoverage: 35,
    profileData: 20,
  },
};

const CONFIDENCE_SCORE: Record<FomoV2Confidence, number> = {
  exact: 100,
  high: 85,
  medium: 60,
  low: 30,
  none: 0,
};

export function calculateFomoV2CanonicalProjectScores(
  input: FomoV2CanonicalProjectRatingInput
): FomoV2CanonicalProjectScores {
  const context = buildRatingContext(input);
  const fullnessComponents = roundComponents(
    calculateFullnessComponents(context)
  );
  const fullness = weightedScore(
    fullnessComponents,
    FULLNESS_WEIGHTS[context.mode]
  );
  const ratingComponents = roundComponents(calculateRatingComponents(context));
  const penalties = buildRatingPenalties(context, fullness, ratingComponents);
  const penaltyScore = penalties.reduce(
    (sum, penalty) => sum + Math.abs(penalty.value),
    0
  );
  const uncappedScore = clamp(
    Math.round(
      weightedScore(ratingComponents, RATING_WEIGHTS[context.mode]) -
        penaltyScore
    ),
    0,
    100
  );
  const caps = buildRatingCaps(
    context,
    fullness,
    ratingComponents,
    uncappedScore
  );
  const fomoScore = applyCaps(uncappedScore, caps);
  const calculatedAt = context.calculatedAt;
  const sharedInputs = buildScoreInputs(context);

  const ratingBreakdown: FomoV2CanonicalProjectScoreResult = {
    version: RATING_VERSION,
    mode: context.mode,
    score: fomoScore,
    components: ratingComponents,
    componentWeights: RATING_WEIGHTS[context.mode],
    penalties,
    caps: caps.filter((cap) => uncappedScore > cap.value),
    inputs: {
      ...sharedInputs,
      uncappedScore,
      fullness,
    },
    calculatedAt,
  };
  const fullnessBreakdown: FomoV2CanonicalProjectScoreResult = {
    version: RATING_VERSION,
    mode: context.mode,
    score: fullness,
    components: fullnessComponents,
    componentWeights: FULLNESS_WEIGHTS[context.mode],
    inputs: sharedInputs,
    calculatedAt,
  };

  return {
    fomoScore,
    rating: fomoScore,
    fullness,
    ratingBreakdown,
    fullnessBreakdown,
    metadataPatch: {
      fomoScore,
      rating: fomoScore,
      fullness,
      ratingBreakdown,
      fullnessBreakdown,
      lastRatingCalculatedAt: calculatedAt,
    },
  };
}

function buildRatingContext(
  input: FomoV2CanonicalProjectRatingInput
): RatingContext {
  const canonicalProject = objectValue(input.canonicalProject);
  const marketProjects = [
    ...arrayValue(input.marketProject).map(objectValue),
    ...arrayValue(input.marketProjects).map(objectValue),
  ].filter(hasObjectValues);
  const contextBase = {
    canonicalProject,
    sources: arrayValue(input.sources).map(objectValue).filter(hasObjectValues),
    marketProject: chooseMarketProject(marketProjects),
    marketProjects,
    icoProjects: arrayValue(input.icoProjects)
      .map(objectValue)
      .filter(hasObjectValues),
    sourceProfiles: arrayValue(input.sourceProfiles)
      .map(objectValue)
      .filter(hasObjectValues),
    fundingRounds: arrayValue(input.fundingRounds)
      .map(objectValue)
      .filter(hasObjectValues),
    fundingParticipants: arrayValue(input.fundingParticipants)
      .map(objectValue)
      .filter(hasObjectValues),
    vestingSummaries: arrayValue(input.vestingSummaries)
      .map(objectValue)
      .filter(hasObjectValues),
    redFlagsCount: resolveRedFlagsCount(input.redFlags, canonicalProject),
    calculatedAt: input.calculatedAt || new Date(),
  };

  return {
    ...contextBase,
    mode: resolveScoreMode(contextBase),
  };
}

function resolveScoreMode(
  context: Omit<RatingContext, "mode">
): FomoV2CanonicalProjectScoreMode {
  const hasMarket =
    hasCoreMarketSignal(context.marketProject) ||
    context.canonicalProject.hasMarketData === true;
  const hasIcoOrFunding =
    context.icoProjects.length > 0 ||
    context.fundingRounds.length > 0 ||
    context.fundingParticipants.length > 0 ||
    context.vestingSummaries.length > 0;

  if (hasMarket && hasIcoOrFunding) return "hybrid";
  if (hasMarket) return "market";
  if (hasIcoOrFunding || context.sourceProfiles.length > 0) return "pre_market";

  return "identity_only";
}

function calculateRatingComponents(
  context: RatingContext
): Record<string, number> {
  return {
    identityTrust: calculateIdentityTrust(context),
    sourceConfidence: calculateSourceConfidence(context),
    profileCoverage: calculateProfileCoverage(context),
    marketQuality: calculateMarketQuality(context),
    marketMomentum: calculateMarketMomentum(context),
    fundingBackers: calculateFundingBackers(context),
    tokenomicsVesting: calculateTokenomicsVesting(context),
    community: calculateCommunity(context),
    riskResilience: calculateRiskResilience(context),
  };
}

function calculateFullnessComponents(
  context: RatingContext
): Record<string, number> {
  return {
    identityCoverage: calculateIdentityCoverage(context),
    sourceCoverage: calculateSourceCoverage(context),
    profileData: calculateProfileDataCoverage(context),
    marketData: calculateMarketDataCoverage(context),
    fundingData: calculateFundingDataCoverage(context),
    tokenData: calculateTokenDataCoverage(context),
    communityData: calculateCommunityDataCoverage(context),
  };
}

function calculateIdentityTrust(context: RatingContext): number {
  const project = context.canonicalProject;
  const identity = getIdentityValues(context);
  const providerIdsCount = countObjectValues(project.providerIds);
  const aliasCount = arrayValue(project.aliases).length;

  return scoreChecks([
    { points: 15, passed: hasValue(identity.name) },
    { points: 8, passed: hasValue(project.normalizedName) },
    { points: 8, passed: hasValue(identity.symbol) },
    { points: 15, passed: hasValue(identity.slug) || providerIdsCount > 0 },
    {
      points: 12,
      passed: hasValue(identity.websiteDomain) || hasValue(identity.website),
    },
    { points: scoreRatioPoints(aliasCount, 3, 8), passed: true },
    {
      points: 8,
      passed: project.status === "active" || project.status === "proposed",
    },
    {
      points: 8,
      passed: project.status !== "merged" && project.status !== "deprecated",
    },
    {
      points: 8,
      passed:
        hasObjectValues(project.sourceEvidence) || context.sources.length > 0,
    },
    {
      points: 10,
      passed: hasTrustedSource(context) || project.createdBy === "manual",
    },
  ]);
}

function calculateSourceConfidence(context: RatingContext): number {
  const activeSources = getActiveSources(context);
  const verifiedSources = activeSources.filter(
    (source) => source.verified === true
  );
  const conflictSources = context.sources.filter(
    (source) => source.status === "conflict"
  );
  const providerIdsCount = countObjectValues(
    context.canonicalProject.providerIds
  );
  const bestConfidence = Math.max(
    confidenceScore(context.canonicalProject.identityConfidence),
    ...activeSources.map((source) => confidenceScore(source.confidence)),
    ...arrayValue(context.canonicalProject.aliases).map((alias) =>
      confidenceScore(alias?.confidence)
    )
  );

  return scoreChecks([
    { points: scoreRatioPoints(activeSources.length, 2, 20), passed: true },
    {
      points: activeSources.length
        ? (verifiedSources.length / activeSources.length) * 20
        : 0,
      passed: true,
    },
    { points: (bestConfidence / 100) * 25, passed: true },
    { points: scoreRatioPoints(providerIdsCount, 2, 15), passed: true },
    {
      points: 10,
      passed: activeSources.some((source) =>
        hasAnyValue(
          source.sourceId,
          source.sourceSlug,
          source.sourceUrl,
          source.websiteDomain
        )
      ),
    },
    { points: 10, passed: conflictSources.length === 0 },
  ]);
}

function calculateProfileCoverage(context: RatingContext): number {
  const profile = getProfileValues(context);
  const socialCount = countObjectValues(profile.socials);
  const bestCompleteness = Math.max(
    ...context.icoProjects.map((item) => toNumber(item.profileCompleteness, 0)),
    ...context.sourceProfiles.map((item) =>
      toNumber(item.profileCompleteness, 0)
    ),
    toNumber(context.canonicalProject.metadata?.profileCompleteness, 0)
  );

  return scoreChecks([
    { points: 20, passed: hasValue(profile.description) },
    { points: 12, passed: hasValue(profile.logo) },
    { points: 10, passed: hasValue(profile.website) },
    {
      points: scoreRatioPoints(profile.categories.length, 3, 16),
      passed: true,
    },
    { points: scoreRatioPoints(socialCount, 3, 16), passed: true },
    {
      points: scoreRatioPoints(
        context.sourceProfiles.length + context.icoProjects.length,
        2,
        10
      ),
      passed: true,
    },
    { points: clamp(bestCompleteness, 0, 100) * 0.08, passed: true },
    {
      points: 8,
      passed:
        hasValue(context.marketProject.description) ||
        hasValue(context.marketProject.logo),
    },
  ]);
}

function calculateMarketQuality(context: RatingContext): number {
  const market = context.marketProject;
  const quote = getMarketQuote(market);
  const freshness = freshnessScore(
    getMarketUpdatedAt(market),
    7,
    context.calculatedAt
  );

  const rawScore = scoreChecks([
    {
      points: scoreLogPoints(quote.marketCap, 1_000_000, 50_000_000_000, 35),
      passed: true,
    },
    {
      points: scoreLogPoints(quote.volume24h, 50_000, 5_000_000_000, 15),
      passed: true,
    },
    { points: scoreRankPoints(quote.rank, 500, 25), passed: true },
    {
      points: scoreLiquidityPoints(quote.volume24h, quote.marketCap, 8, 0.05),
      passed: true,
    },
    { points: 7, passed: quote.price > 0 },
    { points: freshness * 0.1, passed: true },
  ]);

  const marketLeaderFloor = rawScore >= 85 && freshness > 0 ? 96 : 0;

  return Math.max(
    rawScore,
    marketLeaderFloor,
    blueChipMarketQualityFloor(quote, freshness)
  );
}

function calculateMarketMomentum(context: RatingContext): number {
  const market = context.marketProject;
  const quote = getMarketQuote(market);
  const performance = objectValue(market.performance?.usd);

  return scoreChecks([
    {
      points: scoreSignedPercentPoints(quote.priceChange24h, 50, 25),
      passed: true,
    },
    {
      points: scoreSignedPercentPoints(
        firstNumber(performance.change7d, quote.priceChange7d),
        100,
        20
      ),
      passed: true,
    },
    {
      points: scoreSignedPercentPoints(performance.change30d, 150, 15),
      passed: true,
    },
    {
      points: scorePositivePercentPoints(quote.volumeChange24h, 300, 20),
      passed: true,
    },
    {
      points: 10,
      passed:
        hasAnyValue(market.chart7d, market.chart7dTrend) ||
        toNumber(market.chart7dPointsCount, 0) > 0,
    },
    {
      points: scoreDrawdownPoints(quote.price, market.athUsd, 10),
      passed: true,
    },
  ]);
}

function calculateFundingBackers(context: RatingContext): number {
  const rounds = context.fundingRounds.filter(
    (round) => round.status !== "deprecated" && round.status !== "conflict"
  );
  const participants = context.fundingParticipants.filter(
    (participant) =>
      participant.status !== "deprecated" && participant.status !== "conflict"
  );
  const totalRaised = Math.max(
    sumFundingRaised(rounds),
    toNumber(context.canonicalProject.metadata?.totalRaised, 0)
  );
  const uniqueBackers = uniqueStrings(
    participants.map((participant) =>
      firstString(
        participant.backerId,
        participant.backerName,
        participant.normalizedBackerName,
        participant.sourceBackerId
      )
    )
  ).length;
  const leadBackers = participants.filter(
    (participant) => participant.isLead === true || participant.role === "lead"
  ).length;
  const latestFundingDate = latestDate(
    rounds.map((round) => firstDate(round.announcedDate, round.date))
  );
  const averageConfidence = averageScore([
    ...rounds.map((round) => confidenceScore(round.confidence)),
    ...participants.map((participant) =>
      confidenceScore(participant.confidence)
    ),
  ]);

  return scoreChecks([
    {
      points: scoreLogPoints(totalRaised, 100_000, 100_000_000, 25),
      passed: true,
    },
    { points: scoreRatioPoints(rounds.length, 4, 15), passed: true },
    { points: scoreRatioPoints(uniqueBackers, 20, 20), passed: true },
    { points: scoreRatioPoints(leadBackers, 5, 15), passed: true },
    {
      points:
        freshnessScore(latestFundingDate, 730, context.calculatedAt) * 0.1,
      passed: true,
    },
    { points: averageConfidence * 0.1, passed: true },
    {
      points: 5,
      passed: rounds.some((round) =>
        hasAnyPositiveNumber(
          round.valuation,
          round.tokenPrice,
          round.metadata?.valuationUsd
        )
      ),
    },
  ]);
}

function calculateTokenomicsVesting(context: RatingContext): number {
  const market = context.marketProject;
  const quote = getMarketQuote(market);
  const contracts = getContracts(context);
  const vestingSummary = chooseLatestVestingSummary(context.vestingSummaries);
  const allocation = firstValue(
    context.canonicalProject.metadata?.tokenAllocation,
    context.canonicalProject.metadata?.tokenomics,
    ...context.icoProjects.map((item) => item.metadata?.tokenomics),
    ...context.icoProjects.map((item) => item.metadata?.tokenAllocation)
  );

  return scoreChecks([
    { points: scoreRatioPoints(contracts.length, 2, 15), passed: true },
    {
      points: scoreChecks([
        { points: 7, passed: quote.circulatingSupply > 0 },
        { points: 6, passed: quote.totalSupply > 0 },
        { points: 5, passed: quote.maxSupply > 0 || quote.totalSupply > 0 },
      ]),
      passed: true,
    },
    {
      points: scoreFdvToMarketCapPoints(quote.fdv, quote.marketCap, 15),
      passed: true,
    },
    { points: context.vestingSummaries.length > 0 ? 18 : 0, passed: true },
    {
      points: hasAnyValue(
        vestingSummary.nextUnlockDate,
        vestingSummary.lastUnlockDate
      )
        ? 12
        : 0,
      passed: true,
    },
    {
      points: hasObjectValues(allocation) || Array.isArray(allocation) ? 10 : 0,
      passed: true,
    },
    {
      points:
        market.marketAssetId || context.canonicalProject.hasMarketData === true
          ? 12
          : 0,
      passed: true,
    },
  ]);
}

function calculateCommunity(context: RatingContext): number {
  const profile = getProfileValues(context);
  const socialCount = countObjectValues(profile.socials);
  const twitterFollowers = firstNumber(
    context.canonicalProject.metadata?.twitterFollowers,
    context.marketProject.twitterFollowers,
    context.marketProject.twitterData?.followersCount,
    context.marketProject.parsingTwitterData?.followersCount,
    ...context.sourceProfiles.map((item) => item.metadata?.twitterFollowers)
  );

  return scoreChecks([
    { points: scoreRatioPoints(socialCount, 4, 30), passed: true },
    {
      points: scoreLogPoints(twitterFollowers, 1_000, 1_000_000, 30),
      passed: true,
    },
    {
      points: 15,
      passed: hasAnyValue(
        profile.socials?.twitter,
        profile.socials?.telegram,
        profile.socials?.discord
      ),
    },
    {
      points: 15,
      passed: hasAnyValue(profile.socials?.github, profile.socials?.medium),
    },
    {
      points: 10,
      passed:
        context.fundingParticipants.length > 0 ||
        context.sourceProfiles.length > 0,
    },
  ]);
}

function calculateRiskResilience(context: RatingContext): number {
  const project = context.canonicalProject;
  const marketQuote = getMarketQuote(context.marketProject);
  const marketAgeDays = daysSince(
    getMarketUpdatedAt(context.marketProject),
    context.calculatedAt
  );
  let score = 100;

  if (project.status === "merged") score -= 100;
  if (project.status === "deprecated") score -= 70;
  if (project.status === "proposed") score -= 10;
  if (context.sources.some((source) => source.status === "conflict"))
    score -= 20;
  if (!hasTrustedSource(context)) score -= 20;
  if (context.redFlagsCount > 0)
    score -= Math.min(context.redFlagsCount * 10, 40);
  if (
    (context.mode === "market" || context.mode === "hybrid") &&
    marketAgeDays > 14
  )
    score -= marketAgeDays > 30 ? 25 : 15;
  if (
    marketQuote.marketCap > 0 &&
    marketQuote.volume24h > 0 &&
    marketQuote.volume24h / marketQuote.marketCap < 0.001
  )
    score -= 10;
  if (!isSupplyConsistent(marketQuote)) score -= 20;
  if (
    !hasValue(getIdentityValues(context).websiteDomain) &&
    !hasValue(getProfileValues(context).website)
  )
    score -= 5;

  return clamp(score, 0, 100);
}

function calculateIdentityCoverage(context: RatingContext): number {
  const project = context.canonicalProject;
  const identity = getIdentityValues(context);

  return scoreChecks([
    { points: 15, passed: hasValue(identity.name) },
    { points: 10, passed: hasValue(project.normalizedName) },
    { points: 10, passed: hasValue(identity.symbol) },
    { points: 12, passed: hasValue(identity.slug) },
    { points: 15, passed: countObjectValues(project.providerIds) > 0 },
    {
      points: scoreRatioPoints(arrayValue(project.aliases).length, 4, 16),
      passed: true,
    },
    { points: 10, passed: hasValue(project.status) },
    {
      points: 12,
      passed: hasAnyValue(identity.websiteDomain, identity.website),
    },
  ]);
}

function calculateSourceCoverage(context: RatingContext): number {
  const sources = context.sources;
  const activeSources = getActiveSources(context);
  const sourceWithEntity = sources.filter((source) =>
    hasAnyValue(source.sourceEntityId, source.sourceSnapshotId)
  );
  const bestConfidence = Math.max(
    confidenceScore(context.canonicalProject.identityConfidence),
    ...sources.map((source) => confidenceScore(source.confidence))
  );

  return scoreChecks([
    { points: scoreRatioPoints(sources.length, 4, 25), passed: true },
    { points: scoreRatioPoints(activeSources.length, 3, 20), passed: true },
    { points: (bestConfidence / 100) * 20, passed: true },
    { points: scoreRatioPoints(sourceWithEntity.length, 2, 15), passed: true },
    { points: 10, passed: sources.some((source) => source.verified === true) },
    {
      points: 10,
      passed: sources.every((source) => source.status !== "conflict"),
    },
  ]);
}

function calculateProfileDataCoverage(context: RatingContext): number {
  const profile = getProfileValues(context);

  return scoreChecks([
    { points: 22, passed: hasValue(profile.description) },
    { points: 12, passed: hasValue(profile.logo) },
    { points: 12, passed: hasValue(profile.website) },
    {
      points: scoreRatioPoints(profile.categories.length, 4, 18),
      passed: true,
    },
    {
      points: scoreRatioPoints(countObjectValues(profile.socials), 4, 18),
      passed: true,
    },
    { points: 8, passed: context.sourceProfiles.length > 0 },
    {
      points: 10,
      passed:
        context.icoProjects.length > 0 ||
        hasObjectValues(context.canonicalProject.metadata),
    },
  ]);
}

function calculateMarketDataCoverage(context: RatingContext): number {
  const market = context.marketProject;
  const quote = getMarketQuote(market);

  return scoreChecks([
    { points: 14, passed: quote.price > 0 },
    { points: 14, passed: quote.marketCap > 0 },
    { points: 14, passed: quote.volume24h > 0 },
    { points: 10, passed: quote.rank > 0 },
    {
      points: 12,
      passed: hasAnyNumber(
        quote.priceChange1h,
        quote.priceChange24h,
        quote.priceChange7d
      ),
    },
    { points: 12, passed: hasValue(getMarketUpdatedAt(market)) },
    {
      points: 12,
      passed: hasAnyPositiveNumber(
        quote.circulatingSupply,
        quote.totalSupply,
        quote.maxSupply
      ),
    },
    {
      points: 12,
      passed: hasAnyValue(
        market.chart7d,
        market.performance,
        market.chart7dTrend
      ),
    },
  ]);
}

function calculateFundingDataCoverage(context: RatingContext): number {
  const rounds = context.fundingRounds;
  const participants = context.fundingParticipants;

  return scoreChecks([
    { points: 20, passed: rounds.length > 0 },
    {
      points: 15,
      passed: rounds.some((round) =>
        hasAnyPositiveNumber(round.raisedAmount, round.metadata?.amountUsd)
      ),
    },
    {
      points: 15,
      passed: rounds.some((round) =>
        hasAnyValue(round.announcedDate, round.date)
      ),
    },
    {
      points: 15,
      passed: rounds.some((round) =>
        hasAnyValue(round.roundType, round.roundName, round.normalizedRoundType)
      ),
    },
    { points: 15, passed: participants.length > 0 },
    {
      points: 10,
      passed: participants.some((participant) =>
        hasAnyValue(participant.backerId, participant.backerName)
      ),
    },
    {
      points: 10,
      passed: rounds.some(
        (round) =>
          arrayValue(round.sourceRefs).length > 0 ||
          hasAnyValue(round.sourceId, round.sourceUrl)
      ),
    },
  ]);
}

function calculateTokenDataCoverage(context: RatingContext): number {
  const quote = getMarketQuote(context.marketProject);
  const vestingSummary = chooseLatestVestingSummary(context.vestingSummaries);

  return scoreChecks([
    { points: 18, passed: getContracts(context).length > 0 },
    { points: 15, passed: quote.circulatingSupply > 0 },
    { points: 15, passed: quote.totalSupply > 0 || quote.maxSupply > 0 },
    { points: 12, passed: quote.fdv > 0 },
    { points: 15, passed: context.vestingSummaries.length > 0 },
    {
      points: 10,
      passed: hasAnyValue(
        vestingSummary.unlockedPercent,
        vestingSummary.lockedPercent
      ),
    },
    {
      points: 10,
      passed: hasAnyValue(
        vestingSummary.nextUnlockDate,
        vestingSummary.lastUnlockDate
      ),
    },
    {
      points: 5,
      passed: hasAnyValue(
        context.canonicalProject.metadata?.tokenomics,
        context.canonicalProject.metadata?.tokenAllocation
      ),
    },
  ]);
}

function calculateCommunityDataCoverage(context: RatingContext): number {
  const profile = getProfileValues(context);
  const socials = profile.socials;

  return scoreChecks([
    { points: 25, passed: countObjectValues(socials) > 0 },
    { points: 15, passed: hasValue(socials?.twitter) },
    { points: 15, passed: hasValue(socials?.telegram) },
    { points: 15, passed: hasValue(socials?.discord) },
    { points: 10, passed: hasValue(socials?.github) },
    { points: 10, passed: hasValue(socials?.medium) },
    {
      points: 10,
      passed: hasAnyPositiveNumber(
        context.canonicalProject.metadata?.twitterFollowers,
        context.marketProject.twitterData?.followersCount
      ),
    },
  ]);
}

function buildRatingPenalties(
  context: RatingContext,
  fullness: number,
  components: Record<string, number>
): FomoV2CanonicalProjectScoreResult["penalties"] {
  const penalties: FomoV2CanonicalProjectScoreResult["penalties"] = [];
  const marketQuote = getMarketQuote(context.marketProject);
  const marketAgeDays = daysSince(
    getMarketUpdatedAt(context.marketProject),
    context.calculatedAt
  );
  const hasCoreMarket = hasCoreMarketSignal(context.marketProject);

  if (context.redFlagsCount > 0) {
    penalties.push({
      key: "redFlags",
      value: -Math.min(context.redFlagsCount * 5, 25),
      reason: `${context.redFlagsCount} red flag(s) detected`,
    });
  }

  if (context.sources.some((source) => source.status === "conflict")) {
    penalties.push({
      key: "sourceConflict",
      value: -15,
      reason: "Canonical project has conflicting source links",
    });
  }

  if (!hasTrustedSource(context)) {
    penalties.push({
      key: "missingTrustedSource",
      value: -10,
      reason: "No active source, provider id, or source evidence",
    });
  }

  if (
    (context.mode === "market" || context.mode === "hybrid") &&
    !hasCoreMarket
  ) {
    penalties.push({
      key: "missingMarketData",
      value: -20,
      reason: "Missing positive price plus marketCap or volume24h",
    });
  }

  if (
    (context.mode === "market" || context.mode === "hybrid") &&
    marketAgeDays > 7
  ) {
    penalties.push({
      key: "staleMarketData",
      value: marketAgeDays > 30 ? -15 : -10,
      reason: "Market data is older than the fresh window",
    });
  }

  if (
    marketQuote.marketCap > 0 &&
    marketQuote.volume24h > 0 &&
    marketQuote.volume24h / marketQuote.marketCap < 0.001
  ) {
    penalties.push({
      key: "weakLiquidity",
      value: -5,
      reason: "24h volume is below 0.1% of market cap",
    });
  }

  if (!isSupplyConsistent(marketQuote)) {
    penalties.push({
      key: "supplyInconsistency",
      value: -8,
      reason: "Circulating supply exceeds total or max supply",
    });
  }

  if (fullness < 30) {
    penalties.push({
      key: "lowFullness",
      value: -10,
      reason: "Canonical project data completeness is below 30",
    });
  }

  if (components.identityTrust < 40) {
    penalties.push({
      key: "weakIdentity",
      value: -6,
      reason: "Identity signals are weak",
    });
  }

  return penalties;
}

function buildRatingCaps(
  context: RatingContext,
  fullness: number,
  components: Record<string, number>,
  score: number
): FomoV2CanonicalProjectScoreResult["caps"] {
  const caps: FomoV2CanonicalProjectScoreResult["caps"] = [];
  const marketAgeDays = daysSince(
    getMarketUpdatedAt(context.marketProject),
    context.calculatedAt
  );

  if (context.canonicalProject.status === "merged") {
    caps.push({
      key: "mergedStatus",
      value: 0,
      reason: "Merged canonical projects should not rank independently",
    });
  }
  if (context.canonicalProject.status === "deprecated") {
    caps.push({
      key: "deprecatedStatus",
      value: 20,
      reason: "Deprecated canonical projects are capped",
    });
  }
  if (context.mode === "identity_only") {
    caps.push({
      key: "identityOnly",
      value: 45,
      reason: "Only identity signals are available",
    });
  }
  if (!hasTrustedSource(context)) {
    caps.push({
      key: "noTrustedSource",
      value: 55,
      reason: "No trusted source evidence",
    });
  }
  if (components.identityTrust < 40) {
    caps.push({
      key: "weakIdentity",
      value: 50,
      reason: "Identity trust is below 40",
    });
  }
  if (fullness < 30) {
    caps.push({
      key: "lowFullness",
      value: 60,
      reason: "Completeness is below 30",
    });
  }
  if (
    (context.mode === "market" || context.mode === "hybrid") &&
    !hasCoreMarketSignal(context.marketProject)
  ) {
    caps.push({
      key: "missingCoreMarket",
      value: 65,
      reason: "Market mode without core market quote",
    });
  }
  if (
    (context.mode === "market" || context.mode === "hybrid") &&
    marketAgeDays > 30
  ) {
    caps.push({
      key: "staleMarketData",
      value: 70,
      reason: "Market data is older than 30 days",
    });
  }
  if (
    context.canonicalProject.status === "proposed" &&
    components.sourceConfidence < 80
  ) {
    caps.push({
      key: "proposedLowConfidence",
      value: 85,
      reason: "Proposed project has sub-high source confidence",
    });
  }
  if (
    score >= 95 &&
    (fullness < 85 || components.sourceConfidence < 80 || marketAgeDays > 2)
  ) {
    caps.push({
      key: "eliteGuardrail",
      value: 94,
      reason:
        "Elite score requires high fullness, source confidence, and freshness",
    });
  }

  return caps;
}

function applyCaps(
  score: number,
  caps: FomoV2CanonicalProjectScoreResult["caps"] = []
): number {
  return caps.reduce((current, cap) => Math.min(current, cap.value), score);
}

function buildScoreInputs(context: RatingContext): Record<string, any> {
  const marketQuote = getMarketQuote(context.marketProject);

  return {
    sourceCount: context.sources.length,
    activeSourceCount: getActiveSources(context).length,
    providerIdsCount: countObjectValues(context.canonicalProject.providerIds),
    marketProjectCount: context.marketProjects.length,
    icoProjectCount: context.icoProjects.length,
    sourceProfileCount: context.sourceProfiles.length,
    fundingRoundCount: context.fundingRounds.length,
    fundingParticipantCount: context.fundingParticipants.length,
    vestingSummaryCount: context.vestingSummaries.length,
    redFlagsCount: context.redFlagsCount,
    marketCap: marketQuote.marketCap,
    volume24h: marketQuote.volume24h,
    rank: marketQuote.rank,
  };
}

function getIdentityValues(context: RatingContext): Record<string, any> {
  const project = context.canonicalProject;
  const market = context.marketProject;
  const profile = firstObject(context.sourceProfiles);
  const ico = firstObject(context.icoProjects);

  return {
    name: firstString(project.name, market.name, profile.name, ico.name),
    symbol: firstString(
      project.symbol,
      market.symbol,
      profile.symbol,
      ico.symbol
    ),
    slug: firstString(
      project.slug,
      market.slug,
      profile.slug,
      profile.sourceSlug,
      ico.slug
    ),
    websiteDomain: firstString(
      project.primaryWebsiteDomain,
      firstDomain(profile.website),
      firstDomain(market.website)
    ),
    website: firstString(
      profile.website,
      firstArrayValue(market.website),
      ico.website,
      project.metadata?.website
    ),
  };
}

function getProfileValues(context: RatingContext): Record<string, any> {
  const project = context.canonicalProject;
  const market = context.marketProject;
  const sourceProfiles = context.sourceProfiles;
  const icoProjects = context.icoProjects;
  const metadata = objectValue(project.metadata);

  return {
    description: firstString(
      metadata.description,
      metadata.bio,
      market.description,
      market.descriptionText,
      market.bio,
      ...sourceProfiles.map((profile) => profile.description),
      ...icoProjects.map((ico) => ico.description)
    ),
    logo: firstString(
      metadata.logo,
      metadata.logoUrl,
      metadata.image,
      market.logo,
      ...sourceProfiles.map((profile) => profile.logoUrl),
      ...icoProjects.map((ico) => ico.logoUrl)
    ),
    website: firstString(
      metadata.website,
      firstArrayValue(market.website),
      ...sourceProfiles.map((profile) => profile.website),
      ...icoProjects.map((ico) => ico.website)
    ),
    categories: uniqueStrings([
      ...arrayValue(metadata.categories).map(String),
      ...arrayValue(market.categories).map(String),
      ...arrayValue(market.topCategories).map(String),
      ...sourceProfiles.flatMap((profile) =>
        arrayValue(profile.categories).map(String)
      ),
      ...icoProjects.flatMap((ico) => arrayValue(ico.categories).map(String)),
    ]),
    socials: mergeSocials(
      metadata.socials,
      socialsFromArray(market.socialmedia),
      socialsFromArray(market.links),
      ...sourceProfiles.map((profile) => profile.socials)
    ),
  };
}

function getMarketQuote(market: Record<string, any>): Record<string, number> {
  const usdQuote = objectValue(market.usdQuote);
  const metadata = objectValue(market.metadata);
  const performance = objectValue(market.performance?.usd);

  return {
    price: firstNumber(market.price, usdQuote.price, metadata.price),
    marketCap: firstNumber(
      market.marketCap,
      usdQuote.market_cap,
      metadata.marketCap
    ),
    volume24h: firstNumber(
      market.volume24h,
      market.volume,
      usdQuote.volume_24h,
      metadata.volume24h
    ),
    volumeChange24h: firstNumber(
      market.volume24hChange,
      usdQuote.volume_change_24h,
      metadata.volumeChange24h
    ),
    fdv: firstNumber(
      market.fullyDilutedMarketCap,
      usdQuote.fully_diluted_market_cap,
      metadata.fdv
    ),
    circulatingSupply: firstNumber(
      market.circulatingSupply,
      metadata.circulatingSupply
    ),
    totalSupply: firstNumber(market.totalSupply, metadata.totalSupply),
    maxSupply: firstNumber(market.maxSupply, metadata.maxSupply),
    rank: firstNumber(market.rank, metadata.marketCapRank),
    priceChange1h: firstNumber(
      usdQuote.percent_change_1h,
      performance.change1h
    ),
    priceChange24h: firstNumber(
      market.priceChange,
      usdQuote.percent_change_24h,
      performance.change24h
    ),
    priceChange7d: firstNumber(
      usdQuote.percent_change_7d,
      performance.change7d
    ),
  };
}

function getMarketUpdatedAt(market: Record<string, any>): Date | undefined {
  return firstDate(
    market.marketDataUpdatedAt,
    market.performanceUpdatedAt,
    market.usdQuote?.last_updated,
    market.usdQuote?.lastUpdated,
    market.updatedAt
  );
}

function getContracts(context: RatingContext): any[] {
  const aliases = arrayValue(context.canonicalProject.aliases).filter(
    (alias) => alias?.type === "contract"
  );

  return [
    ...aliases,
    ...arrayValue(context.canonicalProject.metadata?.contracts),
    ...arrayValue(context.marketProject.contracts),
    context.marketProject.tokenAddress,
  ].filter(hasValue);
}

function getActiveSources(context: RatingContext): Array<Record<string, any>> {
  return context.sources.filter(
    (source) => source.status !== "deprecated" && source.status !== "conflict"
  );
}

function hasTrustedSource(context: RatingContext): boolean {
  return (
    getActiveSources(context).length > 0 ||
    countObjectValues(context.canonicalProject.providerIds) > 0 ||
    hasObjectValues(context.canonicalProject.sourceEvidence)
  );
}

function hasCoreMarketSignal(market: Record<string, any>): boolean {
  const quote = getMarketQuote(market);

  return quote.price > 0 && (quote.marketCap > 0 || quote.volume24h > 0);
}

function chooseMarketProject(
  marketProjects: Array<Record<string, any>>
): Record<string, any> {
  const candidates = marketProjects.filter(hasObjectValues);
  if (!candidates.length) return {};

  return candidates.sort(
    (left, right) => marketPriority(right) - marketPriority(left)
  )[0];
}

function marketPriority(project: Record<string, any>): number {
  const quote = getMarketQuote(project);
  const rankBonus = quote.rank > 0 ? 1_000_000 / quote.rank : 0;

  return (
    quote.marketCap +
    quote.volume24h * 0.05 +
    rankBonus +
    toNumber(project.fomoScore, 0) * 10_000
  );
}

function chooseLatestVestingSummary(
  summaries: Array<Record<string, any>>
): Record<string, any> {
  if (!summaries.length) return {};

  return summaries
    .slice()
    .sort(
      (left, right) =>
        dateTime(right.calculatedAt || right.updatedAt) -
        dateTime(left.calculatedAt || left.updatedAt)
    )[0];
}

function sumFundingRaised(rounds: Array<Record<string, any>>): number {
  return rounds.reduce(
    (sum, round) =>
      sum +
      firstNumber(
        round.raisedAmount,
        round.metadata?.amountUsd,
        round.metadata?.raisedAmount
      ),
    0
  );
}

function weightedScore(
  components: Record<string, number>,
  weights: ComponentWeights
): number {
  const score = Object.keys(weights).reduce(
    (sum, key) => sum + (toNumber(components[key], 0) * weights[key]) / 100,
    0
  );

  return clamp(Math.round(score), 0, 100);
}

function scoreChecks(
  checks: Array<{ points: number; passed: boolean }>
): number {
  return clamp(
    checks.reduce((sum, check) => sum + (check.passed ? check.points : 0), 0),
    0,
    100
  );
}

function scoreRatioPoints(
  value: any,
  fullAt: number,
  maxPoints: number
): number {
  if (fullAt <= 0 || maxPoints <= 0) return 0;

  return clamp((toNumber(value, 0) / fullAt) * maxPoints, 0, maxPoints);
}

function scoreLogPoints(
  value: any,
  floor: number,
  ceiling: number,
  maxPoints: number
): number {
  const numberValue = toNumber(value, 0);
  if (numberValue <= 0 || floor <= 0 || ceiling <= floor || maxPoints <= 0)
    return 0;

  const minLog = Math.log10(floor);
  const maxLog = Math.log10(ceiling);
  const weight =
    (Math.log10(Math.max(numberValue, 1)) - minLog) / (maxLog - minLog);

  return clamp(weight * maxPoints, 0, maxPoints);
}

function scoreRankPoints(
  rankValue: any,
  maxRank: number,
  maxPoints: number
): number {
  const rank = toNumber(rankValue, 0);
  if (rank <= 0 || maxRank <= 1) return 0;

  return clamp(((maxRank - rank) / (maxRank - 1)) * maxPoints, 0, maxPoints);
}

function scoreLiquidityPoints(
  volumeValue: any,
  marketCapValue: any,
  maxPoints: number,
  targetRatio = 0.15
): number {
  const volume = toNumber(volumeValue, 0);
  const marketCap = toNumber(marketCapValue, 0);
  if (volume <= 0 || marketCap <= 0 || targetRatio <= 0) return 0;

  return clamp((volume / marketCap / targetRatio) * maxPoints, 0, maxPoints);
}

function blueChipMarketQualityFloor(
  quote: Record<string, number>,
  freshness: number
): number {
  if (quote.price <= 0 || quote.marketCap <= 0) return 0;
  if (freshness < 60) return 0;

  if (quote.marketCap >= 100_000_000_000) return 96;
  if (quote.rank <= 0) return 0;
  if (quote.rank <= 20 && quote.marketCap >= 10_000_000_000) return 96;
  if (quote.rank <= 100 && quote.marketCap >= 1_000_000_000) return 82;

  return 0;
}

function scoreSignedPercentPoints(
  value: any,
  capPercent: number,
  maxPoints: number
): number {
  const percent = toNumber(value, 0);
  if (capPercent <= 0 || maxPoints <= 0) return 0;

  return clamp(
    ((percent + capPercent) / (capPercent * 2)) * maxPoints,
    0,
    maxPoints
  );
}

function scorePositivePercentPoints(
  value: any,
  capPercent: number,
  maxPoints: number
): number {
  const percent = toNumber(value, 0);
  if (capPercent <= 0 || maxPoints <= 0) return 0;

  return clamp((Math.max(percent, 0) / capPercent) * maxPoints, 0, maxPoints);
}

function scoreDrawdownPoints(
  priceValue: any,
  athValue: any,
  maxPoints: number
): number {
  const price = toNumber(priceValue, 0);
  const ath = toNumber(athValue, 0);
  if (price <= 0 || ath <= 0) return 0;
  if (price >= ath) return maxPoints;

  const drawdown = clamp((ath - price) / ath, 0, 1);

  return clamp((1 - drawdown) * maxPoints, 0, maxPoints);
}

function scoreFdvToMarketCapPoints(
  fdvValue: any,
  marketCapValue: any,
  maxPoints: number
): number {
  const fdv = toNumber(fdvValue, 0);
  const marketCap = toNumber(marketCapValue, 0);
  if (fdv <= 0 || marketCap <= 0) return 0;

  const ratio = fdv / marketCap;
  if (ratio <= 1.2) return maxPoints;
  if (ratio <= 3) return maxPoints * 0.8;
  if (ratio <= 10) return maxPoints * 0.4;

  return maxPoints * 0.15;
}

function freshnessScore(date: any, windowDays: number, now: Date): number {
  const ageDays = daysSince(date, now);
  if (!Number.isFinite(ageDays) || windowDays <= 0) return 0;

  return clamp((1 - ageDays / windowDays) * 100, 0, 100);
}

function confidenceScore(value: any): number {
  const normalized = String(value || "none")
    .trim()
    .toLowerCase() as FomoV2Confidence;

  return CONFIDENCE_SCORE[normalized] ?? 0;
}

function isSupplyConsistent(quote: Record<string, number>): boolean {
  const circulating = toNumber(quote.circulatingSupply, 0);
  const total = toNumber(quote.totalSupply, 0);
  const max = toNumber(quote.maxSupply, 0);

  if (circulating <= 0) return true;
  if (total > 0 && circulating > total * 1.05) return false;
  if (max > 0 && circulating > max * 1.05) return false;

  return true;
}

function mergeSocials(...values: any[]): Record<string, string> {
  const result: Record<string, string> = {};

  for (const value of values) {
    const socials = objectValue(value);
    for (const [key, href] of Object.entries(socials)) {
      const normalizedKey = String(key || "")
        .trim()
        .toLowerCase();
      const normalizedHref = firstString(href);
      if (normalizedKey && normalizedHref && !result[normalizedKey]) {
        result[normalizedKey] = normalizedHref;
      }
    }
  }

  return result;
}

function socialsFromArray(value: any): Record<string, string> {
  const result: Record<string, string> = {};

  for (const item of arrayValue(value)) {
    const row = objectValue(item);
    const key = firstString(row.name, row.title, row.type, row.key);
    const href = firstString(row.href, row.link, row.url, row.value);
    if (key && href) result[key.toLowerCase()] = href;
  }

  return result;
}

function resolveRedFlagsCount(
  value: any,
  project: Record<string, any>
): number {
  if (Array.isArray(value)) return value.length;
  const explicit = toNumber(value, Number.NaN);
  if (Number.isFinite(explicit)) return Math.max(0, Math.floor(explicit));

  return Math.max(
    0,
    Math.floor(
      firstNumber(
        project.metadata?.redFlags,
        project.metadata?.redFlagsCount,
        Array.isArray(project.metadata?.redFlagsList)
          ? project.metadata.redFlagsList.length
          : 0
      )
    )
  );
}

function averageScore(values: number[]): number {
  const finiteValues = values.filter((value) => Number.isFinite(value));
  if (!finiteValues.length) return 0;

  return (
    finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length
  );
}

function roundComponents(
  components: Record<string, number>
): Record<string, number> {
  return Object.fromEntries(
    Object.entries(components).map(([key, value]) => [
      key,
      Math.round(clamp(value, 0, 100) * 10) / 10,
    ])
  );
}

function objectValue(value: any): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function arrayValue(value: any): any[] {
  if (Array.isArray(value)) return value;
  return hasValue(value) ? [value] : [];
}

function firstObject(values: Array<Record<string, any>>): Record<string, any> {
  return values.find(hasObjectValues) || {};
}

function firstArrayValue(value: any): any {
  return arrayValue(value).find(hasValue);
}

function firstValue(...values: any[]): any {
  return values.find(hasValue);
}

function firstString(...values: any[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) return trimmed;
    }

    if (typeof value === "number" && Number.isFinite(value))
      return String(value);
  }

  return undefined;
}

function firstNumber(...values: any[]): number {
  for (const value of values) {
    const numberValue = toNumber(value, Number.NaN);
    if (Number.isFinite(numberValue)) return numberValue;
  }

  return 0;
}

function firstDate(...values: any[]): Date | undefined {
  for (const value of values) {
    const date = toDate(value);
    if (date) return date;
  }

  return undefined;
}

function latestDate(values: any[]): Date | undefined {
  const dates = values.map(toDate).filter(Boolean) as Date[];
  if (!dates.length) return undefined;

  return dates.sort((left, right) => right.getTime() - left.getTime())[0];
}

function toNumber(value: any, fallback = 0): number {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,%\s]/g, "").replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function toDate(value: any): Date | undefined {
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    if (Number.isFinite(date.getTime())) return date;
  }

  return undefined;
}

function daysSince(value: any, now: Date): number {
  const date = toDate(value);
  if (!date) return Number.POSITIVE_INFINITY;

  return Math.max(0, (now.getTime() - date.getTime()) / 86_400_000);
}

function dateTime(value: any): number {
  return toDate(value)?.getTime() || 0;
}

function firstDomain(value: any): string | undefined {
  const href = firstString(Array.isArray(value) ? value[0] : value);
  if (!href) return undefined;

  try {
    return new URL(
      href.startsWith("http") ? href : `https://${href}`
    ).hostname.replace(/^www\./, "");
  } catch {
    return (
      href
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0] || undefined
    );
  }
}

function uniqueStrings(values: any[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => firstString(value))
        .filter(Boolean)
        .map((value) => value!.toLowerCase())
    )
  );
}

function countObjectValues(value: any): number {
  return Object.values(objectValue(value)).filter(hasValue).length;
}

function hasObjectValues(value: any): boolean {
  return countObjectValues(value) > 0;
}

function hasValue(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;

  return true;
}

function hasAnyValue(...values: any[]): boolean {
  return values.some(hasValue);
}

function hasAnyNumber(...values: any[]): boolean {
  return values.some((value) => Number.isFinite(toNumber(value, Number.NaN)));
}

function hasAnyPositiveNumber(...values: any[]): boolean {
  return values.some((value) => toNumber(value, Number.NaN) > 0);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
