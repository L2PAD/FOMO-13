import { Injectable } from "@nestjs/common";
import { CreateProjectDto } from "src/projects/dto/create-project.dto";
import type { Project } from "src/projects/project.model";
import { User, UserRankType } from "src/user/user.model";
import { TwitterDataDto } from "./dto/twitter-data.dto";
import {
  RatingCanonicalService,
  unifiedToLegacyScoreResult,
} from "./unified/rating-canonical.service";
import type { TwitterInput } from "./unified/unified-rating.types";
import {
  applyRuntimeFullnessFormula,
  applyRuntimeRatingFormula,
} from "./rating-formula.runtime";

export type ScoreVersion = "ico-v1" | "market-v1" | "user-v1";

export type ScoreResult = {
  version: ScoreVersion;
  score: number;
  components: Record<string, number>;
  penalties?: Array<{
    key: string;
    value: number;
    reason: string;
  }>;
  caps?: Array<{
    key: string;
    value: number;
    reason: string;
  }>;
  calculatedAt: Date;
};

export type ProjectScores = {
  rating: number;
  fullness: number;
  ratingBreakdown: ScoreResult;
  fullnessBreakdown: ScoreResult;
};

export type UserScores = {
  rating: number;
  fullness: number;
  rank: UserRankType;
  ratingBreakdown: ScoreResult;
  fullnessBreakdown: ScoreResult;
};

@Injectable()
export class RatingService {
  constructor(private readonly canonical: RatingCanonicalService) {}

  calculateRedFlags(flagsCount: number) {
    const count = Math.max(0, Math.floor(this.toNumberSafe(flagsCount)));
    if (!count) return 0;

    return Math.min(100, 30 + (count - 1) * 10);
  }

  calculateProjectRating(project: CreateProjectDto): String {
    let rating = 100;

    for (const key in project) {
      if (key === "redFlags") {
        rating -= this.calculateRedFlags(project[key]);
      }

      if (key === "investors" && !this.hasNonEmptyArray(project[key])) {
        rating -= 10;
      }

      if (key === "team" && !this.hasNonEmptyArray(project[key])) {
        rating -= 3;
      }

      if (key === "advisors" && !this.hasNonEmptyArray(project[key])) {
        rating -= 3;
      }

      if (key === "partners" && !this.hasNonEmptyArray(project[key])) {
        rating -= 4;
      }

      if (key === "fundraising" && !this.hasNonEmptyArray(project[key])) {
        rating -= 10;
      }

      if (key === "tokenMetrics" && !this.hasNonEmptyObject(project[key])) {
        rating -= 10;
      }
    }

    return String(this.clamp(Math.round(rating), 0, 100));
  }

  calculateProjectScores(project: Partial<Project>): ProjectScores {
    return String(project?.projectType || "").toLowerCase() === "market"
      ? this.calculateMarketProjectScores(project)
      : this.calculateIcoProjectScores(project);
  }

  /**
   * COMPATIBILITY ADAPTER. The authoritative project score now comes from the
   * single canonical unified engine (RatingCanonicalService); the legacy ico/
   * market formulas below are retained only as data-extraction helpers and are
   * NOT used to compute the current score anymore. `fullness` is the unified
   * completeness so there is one source per entity.
   */
  private projectScoresFromCanonical(
    project: Partial<Project>,
    version: ScoreVersion
  ): ProjectScores {
    const result = this.canonical.scoreProjectDoc(project);
    const ratingBreakdown = unifiedToLegacyScoreResult(
      result,
      version
    ) as ScoreResult;
    const fullnessBreakdown: ScoreResult = {
      version,
      score: Math.round(Number(result.completeness ?? 0) * 100) / 100,
      components: {},
      calculatedAt: ratingBreakdown.calculatedAt,
    };
    return {
      rating: ratingBreakdown.score,
      fullness: fullnessBreakdown.score,
      ratingBreakdown,
      fullnessBreakdown,
    };
  }

  calculateIcoProjectScores(project: Partial<Project>): ProjectScores {
    return this.projectScoresFromCanonical(project, "ico-v1");
  }

  calculateMarketProjectScores(project: Partial<Project>): ProjectScores {
    return this.projectScoresFromCanonical(project, "market-v1");
  }

  calculateIcoProjectRating(project: Partial<Project>): ScoreResult {
    const raw = this.getRawIcoData(project);
    const saleRounds = this.getSaleRounds(project);
    const tokenomics = this.getTokenomics(project);
    const marketData = this.getMarketData(project);
    const social = this.getSocialData(project);
    const investors = this.getIcoInvestors(project);
    const team = this.getIcoTeam(project);
    const redFlagsCount = this.getRedFlagsCount(project);
    const lastParsedAt = this.getFirstValue(project, [
      "lastParsedAt",
      "rawIcoData.lastParsedAt",
      "rawIcoData.updatedAt",
    ]);
    const totalRaised = this.getFirstValue(project, [
      "totalRaised",
      "fundsRaised",
      "rawIcoData.fundraising.totalRaised",
    ]);

    const components: Record<string, number> = {
      sourceDataConfidence: this.scoreChecks(10, [
        { points: 2, passed: this.hasValue(project.source || raw.source) },
        {
          points: 3,
          passed: this.hasValue(
            project.sourceId ||
              raw.sourceId ||
              project.detailUrl ||
              raw.detailUrl
          ),
        },
        {
          points: 1.5,
          passed: this.hasValue(project.detailUrl || raw.detailUrl),
        },
        { points: 1.5, passed: this.hasValue(lastParsedAt) },
        { points: 2, passed: this.isFreshDate(lastParsedAt, 30) },
      ]),
      profileNarrative: this.scoreChecks(10, [
        { points: 1, passed: this.hasValue(project.name || raw.name) },
        {
          points: 1,
          passed: this.hasValue(
            project.symbol || project.ticker || raw.symbol || raw.ticker
          ),
        },
        { points: 1, passed: this.hasValue(project.logo || raw.logo) },
        {
          points: 2,
          passed: this.hasValue(
            project.descriptionText ||
              project.bio ||
              raw.fullDescription ||
              raw.shortDescription
          ),
        },
        {
          points: 1.5,
          passed:
            this.hasNonEmptyArray(project.categories) ||
            this.hasNonEmptyArray(raw.categories),
        },
        {
          points: 1,
          passed:
            this.hasNonEmptyArray(project.tags) ||
            this.hasNonEmptyArray(raw.tags),
        },
        {
          points: 1.5,
          passed:
            this.hasNonEmptyArray(project.website) ||
            this.hasValue(raw.links?.website),
        },
        {
          points: 1,
          passed:
            this.hasNonEmptyArray(project.descriptionImages) ||
            this.hasNonEmptyArray(raw.screenshots),
        },
      ]),
      fundraisingQuality: this.scoreChecks(22, [
        { points: 5, passed: this.hasNonEmptyArray(saleRounds) },
        { points: 6 * this.getRoundCompleteness(saleRounds), passed: true },
        { points: this.scoreAmount(totalRaised, 5, 100000000), passed: true },
        {
          points: 2,
          passed:
            this.hasValue(project.lastFunding) ||
            this.hasValue(raw.dates?.startDate),
        },
        {
          points: 2,
          passed:
            saleRounds.some((round) =>
              this.hasValue(round?.platform || round?.platformName)
            ) || this.hasNonEmptyArray(raw.launchpads),
        },
        { points: 2, passed: investors.length > 0 },
      ]),
      backersSocialCommunity: this.scoreChecks(18, [
        { points: this.scoreCount(investors.length, 6, 15), passed: true },
        { points: this.scoreCount(team.length, 3, 6), passed: true },
        {
          points: 3,
          passed:
            this.hasNonEmptyArray(project.socialmedia) ||
            this.hasNonEmptyObject(social),
        },
        {
          points: this.scoreCount(this.getTopFollowers(project).length, 3, 10),
          passed: true,
        },
        {
          points: this.scoreAmount(
            social.twitterFollowers || project.twitterFollowers?.[0],
            2,
            1000000
          ),
          passed: true,
        },
        {
          points: 1,
          passed:
            this.hasNonEmptyArray(project.links) ||
            this.hasNonEmptyObject(raw.links),
        },
      ]),
      tokenomics: this.scoreChecks(18, [
        { points: 4, passed: this.hasNonEmptyObject(project.tokenMetrics) },
        { points: 4, passed: this.hasNonEmptyObject(tokenomics) },
        {
          points: 3,
          passed:
            this.hasNonEmptyArray(project.totalAllocation) ||
            this.hasValue(tokenomics.allocation),
        },
        {
          points: 3,
          passed:
            this.hasNonEmptyObject(raw.vesting) ||
            saleRounds.some((round) => this.hasValue(round?.vesting)),
        },
        {
          points: 2,
          passed: this.hasAnyNumber(
            project.totalSupply,
            project.maxSupply,
            project.circulatingSupply,
            tokenomics.totalSupply,
            tokenomics.maxSupply
          ),
        },
        {
          points: 2,
          passed: this.hasAnyNumber(
            project.fullyDilutedMarketCap,
            project.price,
            marketData.fdv,
            marketData.currentPrice,
            tokenomics.tokenPrice
          ),
        },
      ]),
      marketTraction: this.scoreChecks(12, [
        { points: 2, passed: this.hasNonEmptyObject(marketData) },
        {
          points: this.scoreAmount(
            project.marketCap || marketData.marketCap,
            3,
            1000000000
          ),
          passed: true,
        },
        {
          points: this.scoreAmount(
            project.volume24h || marketData.volume24h,
            3,
            100000000
          ),
          passed: true,
        },
        {
          points: 2,
          passed: this.hasAnyNumber(
            project.fullyDilutedMarketCap,
            marketData.fdv,
            marketData.currentPrice,
            project.price
          ),
        },
        {
          points: 2,
          passed:
            this.hasValue(marketData.roi) ||
            this.hasValue(marketData.raw?.dropstabStats?.returns) ||
            this.hasValue(project.roiData),
        },
      ]),
      riskConsistency: this.scoreChecks(10, [
        { points: 3, passed: !project.redStatus && redFlagsCount === 0 },
        { points: 2, passed: this.isFreshDate(lastParsedAt, 30) },
        {
          points: 1,
          passed: this.hasValue(
            project.sourceId ||
              raw.sourceId ||
              project.detailUrl ||
              raw.detailUrl
          ),
        },
        { points: 1, passed: this.hasValue(project.status || raw.status) },
        { points: 1, passed: this.hasNonEmptyObject(raw) },
        {
          points: 2,
          passed:
            this.hasNonEmptyArray(saleRounds) ||
            this.hasNumberValue(totalRaised) ||
            this.hasNonEmptyObject(marketData),
        },
      ]),
    };

    const penalties = this.buildIcoRatingPenalties(project, {
      raw,
      saleRounds,
      tokenomics,
      totalRaised,
      lastParsedAt,
      redFlagsCount,
    });
    const positiveScore = Object.values(components).reduce(
      (sum, value) => sum + value,
      0
    );
    const penaltyScore = penalties.reduce(
      (sum, penalty) => sum + Math.abs(penalty.value),
      0
    );

    return {
      version: "ico-v1",
      score: this.clamp(Math.round(positiveScore - penaltyScore), 0, 100),
      components: this.roundComponents(components),
      penalties,
      calculatedAt: new Date(),
    };
  }

  calculateIcoProjectFullness(project: Partial<Project>): ScoreResult {
    const raw = this.getRawIcoData(project);
    const saleRounds = this.getSaleRounds(project);
    const tokenomics = this.getTokenomics(project);
    const marketData = this.getMarketData(project);
    const social = this.getSocialData(project);
    const investors = this.getIcoInvestors(project);
    const team = this.getIcoTeam(project);

    const components: Record<string, number> = {
      coreIdentity: this.scoreChecks(12, [
        { points: 2, passed: this.hasValue(project.name || raw.name) },
        { points: 1.5, passed: this.hasValue(project.slug || raw.slug) },
        {
          points: 2,
          passed: this.hasValue(
            project.sourceId ||
              raw.sourceId ||
              project.detailUrl ||
              raw.detailUrl
          ),
        },
        { points: 1.5, passed: this.hasValue(project.status || raw.status) },
        {
          points: 1.5,
          passed: this.hasValue(
            project.symbol || project.ticker || raw.symbol || raw.ticker
          ),
        },
        { points: 1.5, passed: this.hasValue(project.logo || raw.logo) },
        {
          points: 2,
          passed:
            this.hasNonEmptyArray(project.categories) ||
            this.hasNonEmptyArray(raw.categories) ||
            this.hasValue(project.type || raw.type),
        },
      ]),
      descriptionMedia: this.scoreChecks(12, [
        {
          points: 3,
          passed: this.hasValue(project.bio || raw.shortDescription),
        },
        {
          points: 4,
          passed: this.hasValue(project.descriptionText || raw.fullDescription),
        },
        {
          points: 3,
          passed:
            this.hasNonEmptyArray(project.descriptionImages) ||
            this.hasNonEmptyArray(raw.screenshots),
        },
        {
          points: 2,
          passed:
            this.hasValue(project.banner) ||
            this.hasValue(project.descriptionImage),
        },
      ]),
      linksSocialExplorers: this.scoreChecks(14, [
        {
          points: 3,
          passed:
            this.hasNonEmptyArray(project.website) ||
            this.hasValue(raw.links?.website),
        },
        {
          points: 4,
          passed:
            this.hasNonEmptyArray(project.socialmedia) ||
            this.hasNonEmptyObject(social),
        },
        {
          points: 3,
          passed:
            this.hasNonEmptyArray(project.explorers) ||
            this.hasValue(raw.links?.explorers) ||
            this.hasValue(raw.links?.explorer),
        },
        {
          points: 2,
          passed: this.hasValue(
            project.detailUrl ||
              raw.detailUrl ||
              project.sourceUrl ||
              raw.sourceUrl
          ),
        },
        {
          points: 2,
          passed:
            this.hasNonEmptyArray(project.links) ||
            this.hasNonEmptyObject(raw.links),
        },
      ]),
      fundraisingData: this.scoreChecks(20, [
        { points: 5, passed: this.hasNonEmptyArray(saleRounds) },
        {
          points: 3,
          passed: this.hasTotalRaisedValue(project, raw, saleRounds),
        },
        {
          points: 3,
          passed: saleRounds.some((round) =>
            this.hasValue(
              round?.type || round?.name || round?.roundName || round?.status
            )
          ),
        },
        {
          points: 3,
          passed:
            saleRounds.some((round) =>
              this.hasValue(round?.startDate || round?.endDate)
            ) || this.hasValue(raw.dates),
        },
        {
          points: 3,
          passed: saleRounds.some((round) =>
            this.hasAnyNumber(
              round?.price,
              round?.valuation,
              round?.tokensForSale,
              round?.raised
            )
          ),
        },
        {
          points: 3,
          passed:
            saleRounds.some((round) =>
              this.hasValue(
                round?.platform || round?.platformName || round?.vesting
              )
            ) || this.hasNonEmptyArray(raw.launchpads),
        },
      ]),
      tokenomicsVestingAllocation: this.scoreChecks(18, [
        { points: 4, passed: this.hasNonEmptyObject(project.tokenMetrics) },
        { points: 4, passed: this.hasNonEmptyObject(tokenomics) },
        {
          points: 3,
          passed:
            this.hasNonEmptyArray(project.totalAllocation) ||
            this.hasValue(tokenomics.allocation),
        },
        {
          points: 3,
          passed:
            this.hasNonEmptyObject(raw.vesting) ||
            saleRounds.some((round) => this.hasValue(round?.vesting)),
        },
        {
          points: 2,
          passed: this.hasAnyNumber(
            project.totalSupply,
            project.maxSupply,
            project.circulatingSupply,
            tokenomics.totalSupply,
            tokenomics.maxSupply
          ),
        },
        {
          points: 2,
          passed: this.hasAnyNumber(
            project.fullyDilutedMarketCap,
            project.price,
            marketData.fdv,
            marketData.currentPrice,
            tokenomics.tokenPrice
          ),
        },
      ]),
      marketData: this.scoreChecks(10, [
        { points: 3, passed: this.hasNonEmptyObject(marketData) },
        {
          points: 2,
          passed: this.hasAnyNumber(project.marketCap, marketData.marketCap),
        },
        {
          points: 2,
          passed: this.hasAnyNumber(
            project.volume24h,
            project.volume,
            marketData.volume24h
          ),
        },
        {
          points: 2,
          passed: this.hasAnyNumber(
            project.price,
            project.fullyDilutedMarketCap,
            marketData.currentPrice,
            marketData.fdv
          ),
        },
        {
          points: 1,
          passed: this.hasValue(
            project.lastFunding || raw.lastSeenAt || raw.updatedAt
          ),
        },
      ]),
      peopleCommunity: this.scoreChecks(14, [
        { points: 4, passed: investors.length > 0 },
        { points: 3, passed: team.length > 0 },
        { points: 2, passed: this.getTopFollowers(project).length > 0 },
        {
          points: 3,
          passed:
            this.hasNonEmptyArray(project.socialmedia) ||
            this.hasNonEmptyObject(social) ||
            this.hasNonEmptyArray(project.twitterFollowers),
        },
        {
          points: 2,
          passed:
            this.hasNonEmptyArray(project.organizations) ||
            this.hasNonEmptyArray(raw.investors),
        },
      ]),
    };
    const score = Object.values(components).reduce(
      (sum, value) => sum + value,
      0
    );

    return {
      version: "ico-v1",
      score: this.clamp(Math.round(score), 0, 100),
      components: this.roundComponents(components),
      calculatedAt: new Date(),
    };
  }

  calculateMarketProjectRating(
    project: Partial<Project>,
    fullness = this.calculateMarketProjectFullness(project).score
  ): ScoreResult {
    const quote = this.getMarketQuote(project);
    const socialLinks = this.getProjectSocialLinks(project);
    const categories = this.getProjectCategories(project);
    const contracts = this.getProjectContracts(project);
    const fundingRounds = [
      ...this.arrayValue((project as any).fundsRounds),
      ...this.arrayValue(project.fundraising),
    ].filter((item) => this.hasValue(item));
    const peopleAndBackers = [
      ...this.arrayValue(project.investors),
      ...this.arrayValue(project.team),
      ...this.arrayValue((project as any).organizations),
      ...this.arrayValue((project as any).contributors),
    ].filter((item) => this.hasValue(item));
    const redFlagsCount = this.getRedFlagsCount(project);
    const lastMarketUpdate = this.getMarketUpdatedAt(project, quote);
    const hasCoreMarketData =
      this.hasPositiveNumber(quote.price) &&
      (this.hasPositiveNumber(quote.marketCap) ||
        this.hasPositiveNumber(quote.volume24h));
    const circulatingSupplyPercent = this.getCirculatingSupplyPercent(
      project,
      quote
    );
    const liquidityRatio = this.getLiquidityRatio(quote);

    const components: Record<string, number> = {
      dataConfidence: this.scoreChecks(10, [
        {
          points: 2,
          passed: this.hasValue(project.source || (project as any).coingeckoId),
        },
        {
          points: 2,
          passed: this.hasValue(
            (project as any).coingeckoId ||
              project.sourceId ||
              project.slug ||
              (project as any).capId
          ),
        },
        {
          points: 2,
          passed:
            this.hasPositiveNumber(quote.rank) ||
            this.hasValue(project.trading || project.status),
        },
        { points: 2, passed: this.hasValue(lastMarketUpdate) },
        { points: 2, passed: this.isFreshDate(lastMarketUpdate, 7) },
      ]),
      marketScaleLiquidity: this.scoreChecks(25, [
        {
          points: this.scoreAmount(quote.marketCap, 8, 50000000000),
          passed: true,
        },
        {
          points: this.scoreAmount(quote.volume24h, 6, 5000000000),
          passed: true,
        },
        { points: this.scoreRank(quote.rank, 4, 500), passed: true },
        {
          points: this.scoreLiquidityRatio(quote.volume24h, quote.marketCap, 4),
          passed: true,
        },
        { points: 3, passed: this.isCurrentlyTrading(project) },
      ]),
      tokenSupplyValuation: this.scoreChecks(15, [
        {
          points: this.scoreSupplyRatio(circulatingSupplyPercent, 4),
          passed: true,
        },
        {
          points: this.scoreFdvToMarketCap(quote.fdv, quote.marketCap, 4),
          passed: true,
        },
        {
          points: 3,
          passed: this.hasAnyPositiveNumber(
            quote.circulatingSupply,
            quote.totalSupply,
            quote.maxSupply
          ),
        },
        {
          points: 2,
          passed:
            this.hasPositiveNumber(quote.price) &&
            this.hasAnyPositiveNumber(
              (project as any).athUsd,
              (project as any).atlUsd
            ),
        },
        {
          points: 2,
          passed:
            contracts.length > 0 ||
            this.hasValue((project as any).tokenAddress),
        },
      ]),
      momentumPerformance: this.scoreChecks(15, [
        {
          points: this.scoreSignedPercent(quote.priceChange24h, 5),
          passed: true,
        },
        {
          points: this.scoreSignedPercent(quote.volumeChange24h, 3),
          passed: true,
        },
        {
          points: this.scorePositiveReturn(
            (project as any).roiData?.roi ||
              (project as any).allTimePriceChange,
            3
          ),
          passed: true,
        },
        {
          points: this.scoreDrawdownFromAth(
            quote.price,
            (project as any).athUsd,
            2
          ),
          passed: true,
        },
        {
          points: 2,
          passed:
            this.hasValue((project as any).chart7d) ||
            this.hasNonEmptyArray((project as any).history) ||
            this.hasValue((project as any).ohlcv),
        },
      ]),
      profileCommunity: this.scoreChecks(15, [
        { points: this.clamp((fullness / 100) * 5, 0, 5), passed: true },
        { points: 3, passed: this.countObjectValues(socialLinks) >= 2 },
        {
          points: this.scoreAmount(
            this.getTwitterFollowers(project),
            3,
            1000000
          ),
          passed: true,
        },
        {
          points: 2,
          passed:
            categories.length > 0 &&
            this.hasValue(this.getProjectDescription(project)),
        },
        {
          points: 2,
          passed:
            peopleAndBackers.length > 0 ||
            fundingRounds.length > 0 ||
            this.hasPositiveNumber(
              (project as any).fundsRaised || project.totalRaised
            ),
        },
      ]),
      resilienceRisk: this.scoreChecks(20, [
        { points: 5, passed: !project.redStatus && redFlagsCount === 0 },
        { points: 3, passed: this.isCurrentlyTrading(project) },
        { points: 4, passed: this.isFreshDate(lastMarketUpdate, 7) },
        {
          points: 3,
          passed:
            !(project as any).anomalyDetected &&
            !this.isMarketQuoteFlagged(project),
        },
        { points: 3, passed: this.isSupplyConsistent(quote) },
        { points: 2, passed: hasCoreMarketData && liquidityRatio > 0 },
      ]),
    };

    const penalties = this.buildMarketRatingPenalties(project, {
      quote,
      redFlagsCount,
      lastMarketUpdate,
      hasCoreMarketData,
      liquidityRatio,
      fullness,
    });
    const rawScore =
      Object.values(components).reduce((sum, value) => sum + value, 0) -
      penalties.reduce((sum, penalty) => sum + Math.abs(penalty.value), 0);
    let score = this.clamp(Math.round(rawScore), 0, 100);
    const caps: NonNullable<ScoreResult["caps"]> = [];

    if (!hasCoreMarketData) {
      caps.push({
        key: "missingCoreMarketData",
        value: 45,
        reason: "Core market data is missing",
      });
    }
    if (fullness < 35) {
      caps.push({
        key: "lowFullness",
        value: 60,
        reason: "Market project completeness is below 35",
      });
    }
    if (!this.isCurrentlyTrading(project)) {
      caps.push({
        key: "inactiveTrading",
        value: 70,
        reason: "Project is not currently trading/active",
      });
    }
    if (
      fullness < 85 ||
      !this.isFreshDate(lastMarketUpdate, 2) ||
      !this.hasPositiveNumber(quote.marketCap) ||
      !this.hasPositiveNumber(quote.volume24h)
    ) {
      caps.push({
        key: "eliteGuardrail",
        value: 94,
        reason: "Elite rating requires complete, fresh market data",
      });
    }
    score = caps.reduce((value, cap) => Math.min(value, cap.value), score);

    return {
      version: "market-v1",
      score,
      components: this.roundComponents(components),
      penalties,
      caps,
      calculatedAt: new Date(),
    };
  }

  calculateMarketProjectFullness(project: Partial<Project>): ScoreResult {
    const quote = this.getMarketQuote(project);
    const socialLinks = this.getProjectSocialLinks(project);
    const categories = this.getProjectCategories(project);
    const contracts = this.getProjectContracts(project);
    const lastMarketUpdate = this.getMarketUpdatedAt(project, quote);
    const description = this.getProjectDescription(project);
    const fundingRounds = [
      ...this.arrayValue((project as any).fundsRounds),
      ...this.arrayValue(project.fundraising),
    ].filter((item) => this.hasValue(item));
    const peopleAndBackers = [
      ...this.arrayValue(project.investors),
      ...this.arrayValue(project.team),
      ...this.arrayValue((project as any).organizations),
      ...this.arrayValue((project as any).contributors),
    ].filter((item) => this.hasValue(item));

    const components: Record<string, number> = {
      identitySource: this.scoreChecks(18, [
        { points: 3, passed: this.hasValue(project.name) },
        {
          points: 2,
          passed: this.hasValue(
            project.symbol || (project as any).ticker || project.niche
          ),
        },
        {
          points: 2,
          passed: this.hasValue(
            project.slug ||
              project.sourceId ||
              (project as any).coingeckoId ||
              (project as any).capId
          ),
        },
        { points: 2, passed: this.hasValue(project.logo) },
        {
          points: 2,
          passed: this.hasValue(
            project.projectType || project.status || project.trading
          ),
        },
        { points: 2, passed: this.hasPositiveNumber(quote.rank) },
        { points: 3, passed: categories.length > 0 },
        {
          points: 2,
          passed: this.hasValue(
            project.source ||
              (project as any).coingeckoId ||
              project.sourceUrl ||
              project.detailUrl
          ),
        },
      ]),
      marketQuote: this.scoreChecks(22, [
        { points: 4, passed: this.hasPositiveNumber(quote.price) },
        { points: 4, passed: this.hasPositiveNumber(quote.marketCap) },
        { points: 4, passed: this.hasPositiveNumber(quote.volume24h) },
        {
          points: 3,
          passed: this.hasAnyNumber(
            quote.priceChange1h,
            quote.priceChange24h,
            quote.priceChange7d
          ),
        },
        { points: 3, passed: this.hasValue(lastMarketUpdate) },
        {
          points: 2,
          passed: this.hasAnyPositiveNumber(
            (project as any).priceBTC,
            (project as any).priceETH,
            (project as any).priceSOL
          ),
        },
        {
          points: 2,
          passed:
            this.hasPositiveNumber(quote.rank) ||
            this.hasValue(project.trading),
        },
      ]),
      supplyValuation: this.scoreChecks(18, [
        { points: 4, passed: this.hasPositiveNumber(quote.circulatingSupply) },
        { points: 3, passed: this.hasPositiveNumber(quote.totalSupply) },
        { points: 2, passed: this.hasPositiveNumber(quote.maxSupply) },
        { points: 3, passed: this.hasPositiveNumber(quote.fdv) },
        {
          points: 2,
          passed: this.hasPositiveNumber(
            this.getCirculatingSupplyPercent(project, quote)
          ),
        },
        {
          points: 2,
          passed:
            contracts.length > 0 ||
            this.hasValue((project as any).tokenAddress),
        },
        {
          points: 2,
          passed:
            this.hasPositiveNumber((project as any).volumeAndMarketCap) ||
            this.getLiquidityRatio(quote) > 0,
        },
      ]),
      descriptionLinks: this.scoreChecks(16, [
        { points: 5, passed: this.hasValue(description) },
        {
          points: 3,
          passed:
            this.hasValue(socialLinks.website) ||
            this.hasNonEmptyArray(project.website),
        },
        {
          points: 3,
          passed:
            this.hasValue(socialLinks.twitter || project.twitterAcc) ||
            this.countObjectValues(socialLinks) >= 2,
        },
        {
          points: 2,
          passed:
            this.hasNonEmptyArray(project.explorers) || contracts.length > 0,
        },
        { points: 2, passed: this.hasNonEmptyArray(project.links) },
        {
          points: 1,
          passed:
            this.hasValue(project.banner) ||
            this.hasNonEmptyArray((project as any).descriptionImages),
        },
      ]),
      performanceHistory: this.scoreChecks(14, [
        {
          points: 3,
          passed: this.hasAnyPositiveNumber(
            (project as any).athUsd,
            (project as any).atlUsd
          ),
        },
        {
          points: 3,
          passed:
            this.hasNonEmptyObject((project as any).priceRange) ||
            this.hasNonEmptyObject((project as any).highs) ||
            this.hasNonEmptyObject((project as any).lows),
        },
        {
          points: 2,
          passed:
            this.hasValue((project as any).chart7d) ||
            this.hasNonEmptyArray((project as any).history) ||
            this.hasValue((project as any).ohlcv),
        },
        { points: 2, passed: this.hasValue((project as any).dateAdded) },
        {
          points: 2,
          passed: this.hasAnyNumber(
            quote.priceChange24h,
            quote.volumeChange24h
          ),
        },
        {
          points: 2,
          passed:
            this.hasValue((project as any).roiData) ||
            this.hasValue((project as any).allTimePriceChange) ||
            this.hasValue((project as any).xfromIco),
        },
      ]),
      communityIntel: this.scoreChecks(12, [
        {
          points: 3,
          passed: this.hasPositiveNumber(this.getTwitterFollowers(project)),
        },
        {
          points: 3,
          passed:
            this.hasPositiveNumber((project as any).twitterScore) ||
            this.hasNonEmptyObject((project as any).twitterData) ||
            this.hasNonEmptyObject((project as any).parsingTwitterData),
        },
        {
          points: 2,
          passed: this.hasPositiveNumber(
            (project as any).fundsRaised || project.totalRaised
          ),
        },
        { points: 2, passed: fundingRounds.length > 0 },
        { points: 2, passed: peopleAndBackers.length > 0 },
      ]),
    };

    return {
      version: "market-v1",
      score: this.clamp(
        Math.round(
          Object.values(components).reduce((sum, value) => sum + value, 0)
        ),
        0,
        100
      ),
      components: this.roundComponents(components),
      calculatedAt: new Date(),
    };
  }

  private buildIcoRatingPenalties(
    project: Partial<Project>,
    context: {
      raw: Record<string, any>;
      saleRounds: any[];
      tokenomics: Record<string, any>;
      totalRaised: any;
      lastParsedAt: any;
      redFlagsCount: number;
    }
  ): ScoreResult["penalties"] {
    const penalties: ScoreResult["penalties"] = [];

    if (project.redStatus === true) {
      penalties.push({
        key: "redStatus",
        value: -15,
        reason: "Project has active red status",
      });
    }

    if (context.redFlagsCount > 0) {
      penalties.push({
        key: "redFlags",
        value: -Math.min(context.redFlagsCount * 5, 25),
        reason: `${context.redFlagsCount} red flag(s) detected`,
      });
    }

    if (
      !this.hasValue(
        project.sourceId ||
          context.raw.sourceId ||
          project.detailUrl ||
          context.raw.detailUrl
      )
    ) {
      penalties.push({
        key: "missingSourceKey",
        value: -10,
        reason: "Missing sourceId/detailUrl",
      });
    }

    if (
      this.hasValue(context.lastParsedAt) &&
      !this.isFreshDate(context.lastParsedAt, 30)
    ) {
      penalties.push({
        key: "staleLastParsedAt",
        value: -8,
        reason: "lastParsedAt is older than 30 days",
      });
    }

    if (
      !this.hasNonEmptyArray(context.saleRounds) &&
      !this.hasTotalRaisedValue(project, context.raw, context.saleRounds)
    ) {
      penalties.push({
        key: "missingFundraising",
        value: -10,
        reason: "No saleRounds and no totalRaised",
      });
    }

    if (
      !this.hasNonEmptyObject(context.tokenomics) &&
      !this.hasNonEmptyObject(project.tokenMetrics)
    ) {
      penalties.push({
        key: "missingTokenomics",
        value: -8,
        reason: "No tokenomics/tokenMetrics",
      });
    }

    return penalties;
  }

  private buildMarketRatingPenalties(
    project: Partial<Project>,
    context: {
      quote: Record<string, any>;
      redFlagsCount: number;
      lastMarketUpdate: any;
      hasCoreMarketData: boolean;
      liquidityRatio: number;
      fullness: number;
    }
  ): ScoreResult["penalties"] {
    const penalties: ScoreResult["penalties"] = [];

    if (project.redStatus === true) {
      penalties.push({
        key: "redStatus",
        value: -15,
        reason: "Market project has active red status",
      });
    }

    if (context.redFlagsCount > 0) {
      penalties.push({
        key: "redFlags",
        value: -Math.min(context.redFlagsCount * 5, 25),
        reason: `${context.redFlagsCount} red flag(s) detected`,
      });
    }

    if (!context.hasCoreMarketData) {
      penalties.push({
        key: "missingMarketData",
        value: -20,
        reason: "Missing positive price plus marketCap or volume24h",
      });
    }

    if (
      this.hasValue(context.lastMarketUpdate) &&
      !this.isFreshDate(context.lastMarketUpdate, 7)
    ) {
      penalties.push({
        key: "staleMarketData",
        value: -10,
        reason: "Market quote is older than 7 days",
      });
    }

    if (!this.isCurrentlyTrading(project)) {
      penalties.push({
        key: "inactiveTrading",
        value: -10,
        reason: "Project is not marked as currently trading/active",
      });
    }

    if (
      this.hasPositiveNumber(context.quote.marketCap) &&
      !this.isSupplyConsistent(context.quote)
    ) {
      penalties.push({
        key: "supplyInconsistency",
        value: -8,
        reason: "Circulating supply is inconsistent with total or max supply",
      });
    }

    if (
      this.hasPositiveNumber(context.quote.marketCap) &&
      context.liquidityRatio > 0 &&
      context.liquidityRatio < 0.001
    ) {
      penalties.push({
        key: "weakLiquidity",
        value: -5,
        reason: "24h volume is below 0.1% of market cap",
      });
    }

    if (
      this.hasPositiveNumber(context.quote.marketCap) &&
      !this.hasPositiveNumber(context.quote.volume24h)
    ) {
      penalties.push({
        key: "missingVolume",
        value: -8,
        reason: "Missing positive 24h volume",
      });
    }

    if (context.fullness < 30) {
      penalties.push({
        key: "lowFullness",
        value: -10,
        reason: "Market project completeness is below 30",
      });
    }

    if (
      !this.hasValue(
        (project as any).coingeckoId ||
          project.sourceId ||
          project.slug ||
          (project as any).capId
      )
    ) {
      penalties.push({
        key: "weakIdentity",
        value: -6,
        reason: "No stable market source id, slug, or capId",
      });
    }

    return penalties;
  }

  private getMarketQuote(project: Partial<Project>): Record<string, any> {
    const usdQuote = (project as any)?.usdQuote || {};
    const rawMarketData = this.getRawMarketData(project);

    return {
      price: this.firstFiniteNumber(
        project.price,
        usdQuote.price,
        rawMarketData.currentPrice,
        rawMarketData.price
      ),
      marketCap: this.firstFiniteNumber(
        project.marketCap,
        usdQuote.market_cap,
        rawMarketData.marketCap
      ),
      volume24h: this.firstFiniteNumber(
        project.volume24h,
        project.volume,
        usdQuote.volume_24h,
        rawMarketData.volume24h
      ),
      volumeChange24h: this.firstFiniteNumber(
        project.volume24hChange,
        usdQuote.volume_change_24h,
        rawMarketData.volumeChange24h
      ),
      fdv: this.firstFiniteNumber(
        project.fullyDilutedMarketCap,
        usdQuote.fully_diluted_market_cap,
        rawMarketData.fdv
      ),
      circulatingSupply: this.firstFiniteNumber(
        project.circulatingSupply,
        rawMarketData.circulatingSupply
      ),
      totalSupply: this.firstFiniteNumber(
        project.totalSupply,
        rawMarketData.totalSupply
      ),
      maxSupply: this.firstFiniteNumber(
        project.maxSupply,
        rawMarketData.maxSupply
      ),
      rank: this.firstFiniteNumber((project as any).rank, rawMarketData.rank),
      priceChange1h: this.firstFiniteNumber(
        usdQuote.percent_change_1h,
        rawMarketData.priceChange1h
      ),
      priceChange24h: this.firstFiniteNumber(
        project.priceChange,
        usdQuote.percent_change_24h,
        rawMarketData.priceChange24h
      ),
      priceChange7d: this.firstFiniteNumber(
        usdQuote.percent_change_7d,
        rawMarketData.priceChange7d
      ),
      lastUpdated: this.getFirstValue(project, [
        "usdQuote.last_updated",
        "usdQuote.lastUpdated",
        "marketData.last_updated",
        "marketData.lastUpdated",
        "lastParsedAt",
      ]),
    };
  }

  private getRawMarketData(project: Partial<Project>): Record<string, any> {
    const raw = this.getRawIcoData(project);
    const marketData = (project as any)?.marketData;

    if (this.hasNonEmptyObject(marketData)) return marketData;
    if (this.hasNonEmptyObject(raw.marketData)) return raw.marketData;

    return {};
  }

  private getMarketUpdatedAt(
    project: Partial<Project>,
    quote: Record<string, any>
  ): any {
    return this.getFirstValue(
      {
        project,
        quote,
      },
      [
        "quote.lastUpdated",
        "project.usdQuote.last_updated",
        "project.usdQuote.lastUpdated",
        "project.marketData.last_updated",
        "project.marketData.lastUpdated",
        "project.lastParsedAt",
        "project.updatedAt",
        "project.createdAt",
      ]
    );
  }

  private getProjectDescription(project: Partial<Project>): any {
    return this.getFirstValue(project, [
      "descriptionText",
      "bio",
      "overviewText",
      "tokenUtilityText",
      "rawIcoData.fullDescription",
      "rawIcoData.shortDescription",
    ]);
  }

  private getProjectSocialLinks(
    project: Partial<Project>
  ): Record<string, any> {
    const links: Record<string, any> = {};

    const addLink = (key: any, href: any) => {
      const normalizedKey = this.toDisplayString(key).toLowerCase();
      const normalizedHref = this.toDisplayString(href);
      if (normalizedKey && normalizedHref && !links[normalizedKey]) {
        links[normalizedKey] = normalizedHref;
      }
    };

    for (const item of this.arrayValue(project.socialmedia)) {
      addLink(
        item?.name || item?.title || item?.type || item?.key,
        item?.href || item?.link || item?.url || item?.value
      );
    }

    for (const item of this.arrayValue(project.links)) {
      addLink(
        item?.name || item?.title || item?.type || item?.key,
        item?.href || item?.link || item?.url || item?.value
      );
    }

    const website = this.arrayValue(project.website)[0];
    if (website) links.website = this.firstLinkValue(website);

    const explorer = this.arrayValue(project.explorers)[0];
    if (explorer) links.explorer = this.firstLinkValue(explorer);

    if (project.twitterAcc) links.twitter = project.twitterAcc;

    return links;
  }

  private getProjectCategories(project: Partial<Project>): string[] {
    const rawValues = [
      ...this.arrayValue(project.categories),
      ...this.arrayValue(project.tags),
      ...this.arrayValue(this.getRawIcoData(project).categories),
      project.type,
      project.niche,
      (project as any).sector,
      typeof (project as any).mainCategory === "string"
        ? (project as any).mainCategory
        : (project as any).mainCategory?.name,
    ];

    return Array.from(
      new Set(
        rawValues.map((item) => this.toDisplayString(item)).filter(Boolean)
      )
    );
  }

  private getProjectContracts(project: Partial<Project>): any[] {
    return [
      ...this.arrayValue((project as any).contracts),
      ...this.arrayValue(project.explorers),
      (project as any).tokenAddress,
    ].filter((item) => this.hasValue(item));
  }

  private getTwitterFollowers(project: Partial<Project>): number {
    const social = this.getSocialData(project);
    return this.firstFiniteNumber(
      social.twitterFollowers,
      this.arrayValue((project as any).twitterFollowers)[0],
      (project as any).twitterData?.followersCount,
      (project as any).parsingTwitterData?.followersCount
    );
  }

  private firstLinkValue(value: any): string | undefined {
    if (typeof value === "string") return value.trim() || undefined;
    if (!value || typeof value !== "object") return undefined;

    return (
      this.toDisplayString(value.href) ||
      this.toDisplayString(value.link) ||
      this.toDisplayString(value.url) ||
      this.toDisplayString(value.value) ||
      undefined
    );
  }

  private isCurrentlyTrading(project: Partial<Project>): boolean {
    const trading = this.toDisplayString(project.trading).toLowerCase();
    const status = this.toDisplayString(project.status).toLowerCase();

    if (trading) {
      return (
        trading.includes("currently_trading") ||
        trading.includes("currently trading") ||
        trading === "trading" ||
        trading === "active"
      );
    }

    return (
      status === "active" || status === "listed" || status.includes("trading")
    );
  }

  private isMarketQuoteFlagged(project: Partial<Project>): boolean {
    const quote = (project as any)?.usdQuote || {};

    return Boolean(
      quote.is_stale ||
        quote.is_anomaly ||
        (project as any).isStale ||
        (project as any).isAnomaly
    );
  }

  private isSupplyConsistent(quote: Record<string, any>): boolean {
    const circulating = this.toNumberSafe(quote.circulatingSupply, 0);
    const total = this.toNumberSafe(quote.totalSupply, 0);
    const max = this.toNumberSafe(quote.maxSupply, 0);

    if (circulating <= 0) return true;
    if (total > 0 && circulating > total * 1.05) return false;
    if (max > 0 && circulating > max * 1.05) return false;

    return true;
  }

  private getCirculatingSupplyPercent(
    project: Partial<Project>,
    quote: Record<string, any>
  ): number {
    const explicit = this.toNumberSafe(
      (project as any).circulatingSupplyPercent,
      0
    );
    if (explicit > 0) return explicit;

    const circulating = this.toNumberSafe(quote.circulatingSupply, 0);
    const denominator =
      this.toNumberSafe(quote.totalSupply, 0) ||
      this.toNumberSafe(quote.maxSupply, 0);
    if (circulating <= 0 || denominator <= 0) return 0;

    return this.clamp((circulating / denominator) * 100, 0, 100);
  }

  private getLiquidityRatio(quote: Record<string, any>): number {
    const volume = this.toNumberSafe(quote.volume24h, 0);
    const marketCap = this.toNumberSafe(quote.marketCap, 0);

    if (volume <= 0 || marketCap <= 0) return 0;
    return volume / marketCap;
  }

  private firstFiniteNumber(...values: any[]): number {
    for (const value of values) {
      const numberValue = this.toNumberSafe(value, Number.NaN);
      if (Number.isFinite(numberValue)) return numberValue;
    }

    return 0;
  }

  private hasPositiveNumber(value: any): boolean {
    return this.toNumberSafe(value, Number.NaN) > 0;
  }

  private hasAnyPositiveNumber(...values: any[]): boolean {
    return values.some((value) => this.hasPositiveNumber(value));
  }

  private scoreRank(
    rankValue: any,
    maxPoints: number,
    weakRank: number
  ): number {
    const rank = this.toNumberSafe(rankValue, 0);
    if (rank <= 0 || weakRank <= 1) return 0;
    if (rank <= 1) return maxPoints;
    if (rank >= weakRank) return 0;

    return this.clamp(
      ((weakRank - rank) / (weakRank - 1)) * maxPoints,
      0,
      maxPoints
    );
  }

  private scoreLiquidityRatio(
    volumeValue: any,
    marketCapValue: any,
    maxPoints: number
  ): number {
    const ratio = this.getLiquidityRatio({
      volume24h: volumeValue,
      marketCap: marketCapValue,
    });
    if (ratio <= 0) return 0;

    return this.clamp((ratio / 0.15) * maxPoints, 0, maxPoints);
  }

  private scoreSupplyRatio(percentValue: any, maxPoints: number): number {
    const percent = this.toNumberSafe(percentValue, 0);
    if (percent <= 0) return 0;

    return this.clamp((percent / 40) * maxPoints, 0, maxPoints);
  }

  private scoreFdvToMarketCap(
    fdvValue: any,
    marketCapValue: any,
    maxPoints: number
  ): number {
    const fdv = this.toNumberSafe(fdvValue, 0);
    const marketCap = this.toNumberSafe(marketCapValue, 0);
    if (fdv <= 0 || marketCap <= 0) return 0;

    const ratio = fdv / marketCap;
    if (ratio <= 1.2) return maxPoints;
    if (ratio <= 3) return maxPoints * 0.8;
    if (ratio <= 10) return maxPoints * 0.4;
    return maxPoints * 0.15;
  }

  private scoreSignedPercent(value: any, maxPoints: number): number {
    const percent = this.toNumberSafe(value, 0);

    return this.clamp(((percent + 50) / 100) * maxPoints, 0, maxPoints);
  }

  private scorePositiveReturn(value: any, maxPoints: number): number {
    const roi = this.toNumberSafe(value, 0);
    if (roi <= 0) return 0;

    return this.clamp(
      (Math.log10(roi + 1) / Math.log10(1000 + 1)) * maxPoints,
      0,
      maxPoints
    );
  }

  private scoreDrawdownFromAth(
    priceValue: any,
    athValue: any,
    maxPoints: number
  ): number {
    const price = this.toNumberSafe(priceValue, 0);
    const ath = this.toNumberSafe(athValue, 0);
    if (price <= 0 || ath <= 0) return 0;

    const ratio = this.clamp(price / ath, 0, 1);
    if (ratio >= 0.8) return maxPoints;
    if (ratio >= 0.5) return maxPoints * 0.75;
    if (ratio >= 0.2) return maxPoints * 0.45;
    return maxPoints * 0.2;
  }

  private countObjectValues(value: Record<string, any>): number {
    if (!value || typeof value !== "object" || Array.isArray(value)) return 0;

    return Object.values(value).filter((item) => this.hasValue(item)).length;
  }

  private toDisplayString(value: any): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean")
      return String(value);
    if (typeof value === "object") {
      return this.toDisplayString(
        value.name || value.title || value.label || value.value || value.slug
      );
    }

    return "";
  }

  private hasValue(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value === "boolean") return true;
    if (typeof value === "string") return value.trim().length > 0;
    if (value instanceof Date) return !Number.isNaN(value.getTime());
    if (Array.isArray(value)) return this.hasNonEmptyArray(value);
    if (typeof value === "object") return this.hasNonEmptyObject(value);

    return true;
  }

  private hasNonEmptyArray(value: any): boolean {
    return Array.isArray(value) && value.some((item) => this.hasValue(item));
  }

  private hasNonEmptyObject(value: any): boolean {
    if (
      !value ||
      typeof value !== "object" ||
      Array.isArray(value) ||
      value instanceof Date
    ) {
      return false;
    }

    return Object.keys(value).some((key) => this.hasValue(value[key]));
  }

  private toNumberSafe(value: any, fallback = 0): number {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : fallback;
    }

    if (typeof value === "string") {
      const normalized = value.replace(/[$,%\s]/g, "").replace(/,/g, "");
      const parsed = Number(normalized);

      return Number.isFinite(parsed) ? parsed : fallback;
    }

    return fallback;
  }

  private hasNumberValue(value: any): boolean {
    if (value === null || value === undefined || value === "") return false;

    return Number.isFinite(this.toNumberSafe(value, Number.NaN));
  }

  private hasAnyNumber(...values: any[]): boolean {
    return values.some((value) => this.hasNumberValue(value));
  }

  private isFreshDate(value: any, maxAgeDays = 30): boolean {
    const date = this.toDateSafe(value);
    if (!date) return false;

    const ageMs = Date.now() - date.getTime();
    return ageMs >= 0 && ageMs <= maxAgeDays * 24 * 60 * 60 * 1000;
  }

  private toDateSafe(value: any): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  private scoreChecks(
    weight: number,
    checks: Array<{ points: number; passed: boolean }>
  ): number {
    const score = checks.reduce(
      (sum, check) => sum + (check.passed ? check.points : 0),
      0
    );

    return this.clamp(score, 0, weight);
  }

  private scoreAmount(
    value: any,
    maxPoints: number,
    strongValue: number
  ): number {
    const amount = this.toNumberSafe(value, 0);
    if (amount <= 0 || strongValue <= 0) return 0;

    const score =
      (Math.log10(amount + 1) / Math.log10(strongValue + 1)) * maxPoints;
    return this.clamp(score, 0, maxPoints);
  }

  private scoreCount(
    count: number,
    maxPoints: number,
    strongCount: number
  ): number {
    if (!Number.isFinite(count) || count <= 0 || strongCount <= 0) return 0;

    return this.clamp((count / strongCount) * maxPoints, 0, maxPoints);
  }

  private sumComponents(components: Record<string, number>): number {
    return Object.values(components).reduce((sum, value) => sum + value, 0);
  }

  private roundComponents(
    components: Record<string, number>
  ): Record<string, number> {
    return Object.entries(components).reduce((acc, [key, value]) => {
      acc[key] = Math.round(value * 100) / 100;
      return acc;
    }, {} as Record<string, number>);
  }

  private getRawIcoData(project: Partial<Project>): Record<string, any> {
    return this.hasNonEmptyObject(project?.rawIcoData)
      ? project.rawIcoData
      : {};
  }

  private getTokenomics(project: Partial<Project>): Record<string, any> {
    const raw = this.getRawIcoData(project);
    const tokenDetails = (project as any)?.tokenDetails;

    if (this.hasNonEmptyObject(raw.tokenomics)) return raw.tokenomics;
    if (this.hasNonEmptyObject(tokenDetails)) return tokenDetails;

    return {};
  }

  private getMarketData(project: Partial<Project>): Record<string, any> {
    const raw = this.getRawIcoData(project);

    if (this.hasNonEmptyObject(raw.marketData)) return raw.marketData;

    const marketData = {
      marketCap: project.marketCap,
      volume24h: project.volume24h || project.volume,
      fdv: project.fullyDilutedMarketCap,
      currentPrice: project.price,
      roi: (project as any)?.roiData?.roi,
    };

    return this.hasNonEmptyObject(marketData) ? marketData : {};
  }

  private getSocialData(project: Partial<Project>): Record<string, any> {
    const raw = this.getRawIcoData(project);
    const social = this.hasNonEmptyObject(raw.social) ? { ...raw.social } : {};

    if (this.hasNonEmptyArray(project.twitterFollowers)) {
      social.twitterFollowers = project.twitterFollowers[0];
    }

    return social;
  }

  private getSaleRounds(project: Partial<Project>): any[] {
    const raw = this.getRawIcoData(project);

    return [
      ...this.arrayValue(project.fundraising),
      ...this.arrayValue((project as any).fundsRounds),
      ...this.arrayValue(raw.saleRounds),
      ...this.arrayValue(raw.fundraising?.rounds),
    ].filter((item) => this.hasValue(item));
  }

  private getIcoInvestors(project: Partial<Project>): any[] {
    const raw = this.getRawIcoData(project);
    const roundInvestors = this.getSaleRounds(project).flatMap((round) =>
      this.arrayValue(round?.investors)
    );

    return [
      ...this.arrayValue(project.investors),
      ...this.arrayValue(raw.uiInvestors),
      ...this.arrayValue(raw.investors),
      ...this.arrayValue(raw.fundraising?.investors),
      ...roundInvestors,
    ].filter((item) => this.hasValue(item));
  }

  private getIcoTeam(project: Partial<Project>): any[] {
    const raw = this.getRawIcoData(project);

    return [
      ...this.arrayValue(project.team),
      ...this.arrayValue((project as any).organizations),
      ...this.arrayValue(raw.team),
      ...this.arrayValue(raw.organizations),
    ].filter((item) => this.hasValue(item));
  }

  private getTopFollowers(project: Partial<Project>): any[] {
    const raw = this.getRawIcoData(project);

    return [
      ...this.arrayValue((project as any).topFollowers),
      ...this.arrayValue((project as any).topfollowers),
      ...this.arrayValue(raw.uiTopFollowers),
      ...this.arrayValue(raw.social?.topFollowers),
    ].filter((item) => this.hasValue(item));
  }

  private arrayValue(value: any): any[] {
    return Array.isArray(value) ? value : [];
  }

  private getRedFlagsCount(project: Partial<Project>): number {
    const redFlags = this.toNumberSafe((project as any).redFlags, 0);
    const redFlagsListCount = Array.isArray((project as any).redFlagsList)
      ? (project as any).redFlagsList.length
      : 0;

    return Math.max(redFlags, redFlagsListCount);
  }

  private getRoundCompleteness(rounds: any[]): number {
    if (!this.hasNonEmptyArray(rounds)) return 0;

    const fields = [
      "name",
      "type",
      "status",
      "startDate",
      "endDate",
      "price",
      "tokensForSale",
      "valuation",
      "raised",
      "platform",
      "platformName",
      "vesting",
    ];
    const roundScores = rounds.map((round) => {
      const filledFields = fields.filter((field) =>
        this.hasValue(round?.[field])
      );

      return filledFields.length / fields.length;
    });

    return (
      roundScores.reduce((sum, score) => sum + score, 0) / roundScores.length
    );
  }

  private hasTotalRaisedValue(
    project: Partial<Project>,
    raw: Record<string, any>,
    saleRounds: any[]
  ): boolean {
    if (this.hasOwnPath(raw, "fundraising.totalRaised")) return true;
    if (this.hasOwnPath(raw, "fundraising.raw.overviewTotalRaised"))
      return true;
    if (saleRounds.some((round) => this.hasNumberValue(round?.raised)))
      return true;

    const totalRaised =
      (project as any).totalRaised ?? (project as any).fundsRaised;
    return (
      this.hasNumberValue(totalRaised) && this.toNumberSafe(totalRaised) > 0
    );
  }

  private getFirstValue(source: any, paths: string[]): any {
    for (const path of paths) {
      const value = this.getPath(source, path);
      if (this.hasValue(value)) return value;
    }

    return undefined;
  }

  private getPath(source: any, path: string): any {
    if (!source || !path) return undefined;

    return path.split(".").reduce((value, key) => {
      if (value === null || value === undefined) return undefined;
      return value[key];
    }, source);
  }

  private hasOwnPath(source: any, path: string): boolean {
    if (!source || !path) return false;

    let value = source;
    for (const key of path.split(".")) {
      if (
        value === null ||
        value === undefined ||
        !Object.prototype.hasOwnProperty.call(value, key)
      ) {
        return false;
      }

      value = value[key];
    }

    return true;
  }

  calculateUserScores(user: Partial<User> & Record<string, any>): UserScores {
    // COMPATIBILITY ADAPTER: authoritative user score comes from the single
    // canonical unified engine. Legacy fullness/rating breakdowns are retained
    // only as helpers; `fullness` is the unified completeness (one source).
    const result = this.canonical.scoreUserDoc(user);
    const ratingBreakdown = unifiedToLegacyScoreResult(
      result,
      "user-v1"
    ) as ScoreResult;
    const fullnessBreakdown: ScoreResult = {
      version: "user-v1",
      score: Math.round(Number(result.completeness ?? 0) * 100) / 100,
      components: {},
      calculatedAt: ratingBreakdown.calculatedAt,
    };

    return {
      rating: ratingBreakdown.score,
      fullness: fullnessBreakdown.score,
      rank: this.calculateUserRank(user?.activityXP ?? user?.points),
      ratingBreakdown,
      fullnessBreakdown,
    };
  }

  calculateUserRating(user: Partial<User> & Record<string, any>): string {
    return String(this.calculateUserScores(user).rating);
  }

  calculateUserFullness(
    user: Partial<User> & Record<string, any>
  ): ScoreResult {
    const socialLinks = this.getUserSocialLinks(user);
    const walletLinksCount = this.getUserWalletLinksCount(user);
    const activityXP = this.toUserNumber(user?.activityXP ?? user?.points);
    const tasksCount = this.getUserTasksCount(user);
    const createdContentCount = this.getUserCreatedContentCount(user);
    const portfolio = this.getUserPortfolioMetrics(user);
    const reviews = this.getUserReviewStats(user);
    const followersCount = this.getUserFollowersCount(user);
    const profileLikesCount = this.arrayValue(user?.likes).length;
    const profileDislikesCount = this.arrayValue(user?.dislikes).length;
    const awardsCount = this.getUserAwardsCount(user);
    const redFlagsCount = this.getUserRedFlagsCount(user);
    const greenFlagsCount = this.getUserGreenFlagsCount(user);

    const components: Record<string, number> = {
      identity: this.scoreChecks(25, [
        {
          points: 4,
          passed: this.hasValue(
            user?.name || user?.twitterData?.name || user?.discordData?.name
          ),
        },
        {
          points: 3,
          passed: this.hasValue(
            user?.username ||
              user?.twitterData?.username ||
              user?.discordData?.username ||
              user?.telegramData?.username
          ),
        },
        {
          points: 3,
          passed: this.hasValue(
            user?.photo || user?.twitterData?.photo || user?.discordData?.photo
          ),
        },
        { points: 4, passed: this.hasValue(user?.bio) },
        { points: 3, passed: this.hasValue(user?.email) },
        { points: 3, passed: this.hasValue(user?.wallet) },
        {
          points: 2,
          passed: this.hasValue(user?.regionData || user?.specialization),
        },
        {
          points: 3,
          passed: this.hasValue(
            user?.createDate || user?.createdAt || user?.fomoId
          ),
        },
      ]),
      contactsAndWallets: this.scoreChecks(20, [
        { points: 4, passed: this.hasValue(socialLinks.twitter) },
        { points: 3, passed: this.hasValue(socialLinks.telegram) },
        { points: 3, passed: this.hasValue(socialLinks.discord) },
        {
          points: this.scoreCount(this.countObjectValues(socialLinks), 4, 4),
          passed: true,
        },
        { points: this.scoreCount(walletLinksCount, 4, 3), passed: true },
        { points: 2, passed: user?.verificationStatus === true },
      ]),
      activityFootprint: this.scoreChecks(20, [
        { points: this.scoreCount(activityXP, 5, 1000), passed: true },
        { points: this.scoreCount(tasksCount, 4, 10), passed: true },
        { points: this.scoreCount(createdContentCount, 5, 10), passed: true },
        {
          points: this.scoreCount(
            this.arrayValue(user?.activity).length,
            3,
            20
          ),
          passed: true,
        },
        {
          points: this.scoreCount(this.toUserNumber(user?.hoursOnline), 3, 100),
          passed: true,
        },
      ]),
      portfolioData: this.scoreChecks(20, [
        { points: this.scoreCount(portfolio.itemsCount, 3, 5), passed: true },
        { points: this.scoreAmount(portfolio.balance, 5, 10000), passed: true },
        {
          points: this.scoreAmount(portfolio.totalInvested, 4, 50000),
          passed: true,
        },
        {
          points: this.scoreCount(portfolio.numberOfDeals, 4, 25),
          passed: true,
        },
        {
          points: this.scorePositiveReturn(portfolio.averageRoi, 3),
          passed: true,
        },
        {
          points: 1,
          passed: this.hasValue(
            user?.lastInvestments || user?.topFundedProject
          ),
        },
      ]),
      reputationData: this.scoreChecks(15, [
        { points: this.scoreCount(reviews.total, 3, 10), passed: true },
        { points: this.scoreCount(followersCount, 3, 1000), passed: true },
        {
          points: this.scoreCount(
            profileLikesCount + profileDislikesCount,
            2,
            20
          ),
          passed: true,
        },
        { points: this.scoreCount(greenFlagsCount, 2, 5), passed: true },
        { points: redFlagsCount === 0 ? 2 : 0, passed: true },
        { points: this.scoreCount(awardsCount, 3, 6), passed: true },
      ]),
    };

    return {
      version: "user-v1",
      score: this.clamp(Math.round(this.sumComponents(components)), 0, 100),
      components: this.roundComponents(components),
      calculatedAt: new Date(),
    };
  }

  calculateUserRatingBreakdown(
    user: Partial<User> & Record<string, any>,
    fullness = this.calculateUserFullness(user).score
  ): ScoreResult {
    const socialLinks = this.getUserSocialLinks(user);
    const activityXP = this.toUserNumber(user?.activityXP ?? user?.points);
    const tasksCount = this.getUserTasksCount(user);
    const createdContentCount = this.getUserCreatedContentCount(user);
    const followersCount = this.getUserFollowersCount(user);
    const followingCount = this.getUserFollowingCount(user);
    const reviews = this.getUserReviewStats(user);
    const redFlagsCount = this.getUserRedFlagsCount(user);
    const referralCount = this.getUserReferralCount(user);
    const socialLinksCount = this.countObjectValues(socialLinks);
    const portfolio = this.getUserPortfolioMetrics(user);

    const components: Record<string, number> = {
      profileCompleteness: this.clamp((fullness / 100) * 30, 0, 30),
      activity: this.scoreChecks(40, [
        { points: this.scoreCount(activityXP, 24, 1000), passed: true },
        { points: this.scoreCount(tasksCount, 5, 10), passed: true },
        {
          points: this.scoreCount(portfolio.numberOfDeals, 5, 50),
          passed: true,
        },
        { points: this.scoreCount(createdContentCount, 3, 20), passed: true },
        { points: this.scoreCount(referralCount, 2, 20), passed: true },
        {
          points: this.scoreCount(this.toUserNumber(user?.hoursOnline), 1, 100),
          passed: true,
        },
      ]),
      reputation: this.scoreChecks(25, [
        { points: 4, passed: user?.verificationStatus === true },
        {
          points: this.scoreReviewQuality(reviews.likes, reviews.dislikes, 10),
          passed: true,
        },
        { points: this.scoreCount(reviews.total, 7, 50), passed: true },
        {
          points:
            reviews.total > 0 && reviews.likes >= reviews.dislikes ? 2 : 0,
          passed: true,
        },
        { points: user?.banned === true ? 0 : 2, passed: true },
      ]),
      socialPresence: this.scoreChecks(5, [
        { points: this.scoreCount(socialLinksCount, 5, 3), passed: true },
        { points: this.scoreCount(followersCount, 0.5, 5000), passed: true },
        {
          points: this.scoreCount(
            this.toUserNumber(user?.twitterScore),
            0.5,
            1000
          ),
          passed: true,
        },
      ]),
    };

    const penalties = this.buildUserRatingPenalties(user, {
      fullness,
      socialLinksCount,
      activityXP,
      followersCount,
      reviews,
      redFlagsCount,
      portfolio,
    });
    const rawScore =
      this.sumComponents(components) -
      penalties.reduce((sum, penalty) => sum + Math.abs(penalty.value), 0);
    let score = this.clamp(Math.round(rawScore), 0, 100);
    const caps: NonNullable<ScoreResult["caps"]> = [];

    if (
      activityXP <= 0 &&
      tasksCount <= 0 &&
      createdContentCount <= 0 &&
      portfolio.itemsCount <= 0 &&
      portfolio.totalInvested <= 0 &&
      followersCount <= 0 &&
      reviews.total <= 0
    ) {
      caps.push({
        key: "noActivitySignals",
        value: 45,
        reason: "No activity, portfolio, social, or review signals",
      });
    }
    if (fullness < 30) {
      caps.push({
        key: "lowFullness",
        value: 60,
        reason: "User profile completeness is below 30",
      });
    }
    if (!this.hasValue(user?.wallet)) {
      caps.push({
        key: "missingWallet",
        value: 70,
        reason: "No wallet connected",
      });
    }
    if (user?.verificationStatus !== true) {
      caps.push({
        key: "unverified",
        value: 95,
        reason: "User is not verified",
      });
    }
    score = caps.reduce((value, cap) => Math.min(value, cap.value), score);

    return {
      version: "user-v1",
      score,
      components: this.roundComponents(components),
      penalties,
      caps,
      calculatedAt: new Date(),
    };
  }

  calculateUserRank(activityXP: any): UserRankType {
    const xp = Math.max(0, Math.floor(this.toUserNumber(activityXP)));

    if (xp >= 900) return "Universal Enlightenment";
    if (xp >= 800) return "Astral Sage";
    if (xp >= 600) return "Celestial Master";
    if (xp >= 400) return "Galactic Navigator";
    if (xp >= 200) return "Cosmic Explorer";

    return "Stellar Awakening";
  }

  private buildUserRatingPenalties(
    user: Partial<User> & Record<string, any>,
    context: {
      fullness: number;
      socialLinksCount: number;
      activityXP: number;
      followersCount: number;
      reviews: { likes: number; dislikes: number; total: number };
      redFlagsCount: number;
      portfolio: {
        itemsCount: number;
        balance: number;
        totalInvested: number;
        numberOfDeals: number;
        averageRoi: number;
      };
    }
  ): Array<{ key: string; value: number; reason: string }> {
    const penalties: Array<{ key: string; value: number; reason: string }> = [];

    if (user?.banned === true) {
      penalties.push({
        key: "banned",
        value: -100,
        reason: "User is banned",
      });
    }

    const positiveReviewRatio =
      context.reviews.total > 0
        ? context.reviews.likes / context.reviews.total
        : 0;
    const hasStrongPositiveTrust =
      user?.verificationStatus === true &&
      context.reviews.total >= 10 &&
      positiveReviewRatio >= 0.75;

    if (context.redFlagsCount > 0) {
      const penaltyValue = hasStrongPositiveTrust
        ? Math.min(Math.ceil(context.redFlagsCount / 10), 5)
        : Math.min(context.redFlagsCount * 8, 40);

      penalties.push({
        key: "redFlags",
        value: -penaltyValue,
        reason: `${context.redFlagsCount} red flag(s) detected`,
      });
    }

    if (
      context.reviews.total >= 3 &&
      context.reviews.dislikes > context.reviews.likes
    ) {
      penalties.push({
        key: "negativeReviews",
        value: -Math.min(
          (context.reviews.dislikes - context.reviews.likes) * 5,
          20
        ),
        reason: "User has more negative OTC reviews than positive reviews",
      });
    }

    if (!this.hasValue(user?.wallet)) {
      penalties.push({
        key: "missingWallet",
        value: -10,
        reason: "No wallet connected",
      });
    }

    if (context.socialLinksCount <= 0) {
      penalties.push({
        key: "missingSocialLinks",
        value: -5,
        reason: "No connected social links",
      });
    }

    if (context.fullness < 30) {
      penalties.push({
        key: "lowFullness",
        value: -10,
        reason: "User profile completeness is below 30",
      });
    }

    if (
      user?.isActive === false &&
      user?.isCodeActivated === false &&
      !this.hasValue(user?.email)
    ) {
      penalties.push({
        key: "inactiveAccount",
        value: -15,
        reason: "Account is not active or code-activated",
      });
    }

    if (
      context.activityXP <= 0 &&
      context.followersCount <= 0 &&
      context.reviews.total <= 0 &&
      context.portfolio.itemsCount <= 0 &&
      context.portfolio.totalInvested <= 0
    ) {
      penalties.push({
        key: "noActivitySignals",
        value: -15,
        reason: "No activity, portfolio, social, or review signals",
      });
    }

    return penalties;
  }

  private getUserSocialLinks(
    user: Partial<User> & Record<string, any>
  ): Record<string, any> {
    const socialNetworks: Record<string, any> =
      user?.socialNetworks && typeof user.socialNetworks === "object"
        ? (user.socialNetworks as Record<string, any>)
        : {};
    const twitterData = (user?.twitterData || {}) as Record<string, any>;
    const telegramData = (user?.telegramData || {}) as Record<string, any>;
    const discordData = (user?.discordData || {}) as Record<string, any>;

    return {
      ...socialNetworks,
      twitter:
        socialNetworks?.twitter ||
        twitterData?.username ||
        twitterData?.url ||
        twitterData?.link,
      telegram:
        socialNetworks?.telegram ||
        telegramData?.username ||
        telegramData?.telegramId,
      discord:
        socialNetworks?.discord ||
        discordData?.username ||
        discordData?.telegramId,
      website: socialNetworks?.website || socialNetworks?.site,
    };
  }

  private getUserWalletLinksCount(
    user: Partial<User> & Record<string, any>
  ): number {
    const walletFields = [
      user?.wallet,
      user?.solanaAddress,
      user?.cosmosAddress,
      user?.polkadotAddress,
      user?.nearAddress,
      user?.kusamaAddress,
    ].filter((value) => this.hasValue(value)).length;

    return walletFields + this.arrayValue(user?.multichainwallet).length;
  }

  private getUserTasksCount(user: Partial<User> & Record<string, any>): number {
    return Math.max(
      this.toUserNumber(user?.tasks),
      this.arrayValue(user?.claimedTasks).length,
      this.toUserNumber(user?.spaceportProgression?.metrics?.tasks)
    );
  }

  private getUserCreatedContentCount(
    user: Partial<User> & Record<string, any>
  ): number {
    return [
      user?.projects,
      user?.persons,
      user?.funds,
      user?.news,
      user?.nfts,
      user?.events,
      user?.actions,
    ].reduce((sum, value) => sum + this.arrayValue(value).length, 0);
  }

  private getUserPortfolioMetrics(user: Partial<User> & Record<string, any>): {
    itemsCount: number;
    balance: number;
    totalInvested: number;
    numberOfDeals: number;
    averageInvestment: number;
    averageRoi: number;
  } {
    const itemsCount = Math.max(
      this.arrayValue(user?.portfolio).length,
      this.arrayValue(user?.investedProjects).length,
      this.arrayValue(user?.claimedProjects).length
    );

    return {
      itemsCount,
      balance: this.toUserNumber(user?.portfolioBalance),
      totalInvested: this.toUserNumber(user?.totalInvested),
      numberOfDeals: this.toUserNumber(user?.numberOfDeals),
      averageInvestment: this.toUserNumber(user?.averageInvestments),
      averageRoi: this.firstUserNumber(
        user?.averageRoi,
        user?.athRoi,
        user?.highestRoi,
        user?.predictionAccuracyPercent,
        user?.predictionAccuracy
      ),
    };
  }

  private getUserReviewStats(user: Partial<User> & Record<string, any>): {
    likes: number;
    dislikes: number;
    total: number;
  } {
    const likes = Math.max(
      this.arrayValue(user?.reviewLikes).length,
      this.toUserNumber(user?.reviewLikesLength)
    );
    const dislikes = Math.max(
      this.arrayValue(user?.reviewDislikes).length,
      this.toUserNumber(user?.reviewDislikesLength)
    );

    return {
      likes,
      dislikes,
      total: likes + dislikes,
    };
  }

  private getUserFollowersCount(
    user: Partial<User> & Record<string, any>
  ): number {
    return Math.max(
      this.toUserNumber(user?.followersCount),
      this.arrayValue(user?.followers).length,
      this.toUserNumber(user?.parsingTwitterData?.followers_count)
    );
  }

  private getUserFollowingCount(
    user: Partial<User> & Record<string, any>
  ): number {
    return Math.max(
      this.arrayValue(user?.following).length,
      this.toUserNumber(user?.parsingTwitterData?.friends_count)
    );
  }

  private getUserReferralCount(
    user: Partial<User> & Record<string, any>
  ): number {
    return Math.max(
      this.toUserNumber(user?.partners),
      this.arrayValue(user?.refLvlOne).length +
        Math.floor(this.arrayValue(user?.refLvlTwo).length / 2)
    );
  }

  private getUserAwardsCount(
    user: Partial<User> & Record<string, any>
  ): number {
    return Math.max(
      this.arrayValue(user?.spaceportClaimedBadges).length +
        this.arrayValue(user?.spaceportClaimedRewards).length,
      this.toUserNumber(user?.spaceportProgression?.earnedBadgesCount)
    );
  }

  private getUserRedFlagsCount(
    user: Partial<User> & Record<string, any>
  ): number {
    return Math.max(
      this.toUserNumber(user?.redFlags),
      this.arrayValue(user?.redFlagsList).length
    );
  }

  private getUserGreenFlagsCount(
    user: Partial<User> & Record<string, any>
  ): number {
    return this.arrayValue(user?.greenFlagsList).length;
  }

  private scoreReviewQuality(
    likes: number,
    dislikes: number,
    maxPoints: number
  ): number {
    const total = likes + dislikes;
    if (total <= 0 || maxPoints <= 0) return 0;

    const positiveRatio = likes / total;
    const confidence = this.clamp(total / 10, 0, 1);

    return this.clamp(
      (positiveRatio * 0.75 + confidence * 0.25) * maxPoints,
      0,
      maxPoints
    );
  }

  private firstUserNumber(...values: any[]): number {
    for (const value of values) {
      const numberValue = this.toUserNumber(value, Number.NaN);
      if (Number.isFinite(numberValue) && numberValue !== 0) return numberValue;
    }

    return 0;
  }

  private toUserNumber(value: any, fallback = 0): number {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : fallback;
    }

    if (typeof value === "string") {
      const parsed = Number(value.replace(/[$,%\s]/g, "").replace(/,/g, ""));
      return Number.isFinite(parsed) ? parsed : fallback;
    }

    return fallback;
  }

  async calculateScore(data: TwitterDataDto): Promise<number> {
    // COMPATIBILITY ADAPTER: reuse the legacy signal extraction to build raw
    // 0-100 sub-signals, then let the SINGLE canonical unified engine apply the
    // canonical weights so the Twitter score has one source of truth.
    const input: TwitterInput = {
      followers: Number(data.followersCount || 0),
      followerQuality: this.scoreFollowersQuality(data.followers || []),
      engagement: this.calculateEngagement(
        data.tweets || [],
        Number(data.followersCount || 0)
      ),
      postingFrequency: this.scorePostingFrequency(data.tweets || []),
      reputation: this.scoreReputation(data),
      cryptoInfluence: this.scoreInfluence(data.followers || []),
      tier1Audience: this.scoreTier1Audience(data.location),
    };
    const result = this.canonical.scoreTwitter(input);
    return Math.round(Number(result.score ?? 0));
  }

  private scoreFollowersCount(count: number): number {
    return count > 1000000 ? 100 : (count / 1000000) * 100;
  }

  private scoreFollowersQuality(followers): number {
    const verified = followers.filter((f) => f.isBlueVerified).length;
    const highInfluence = followers.filter(
      (f) => f.followersCount > 100000
    ).length;
    const bots = followers.filter((f) => f.followersCount < 10).length;

    let qualityScore = 50;
    qualityScore += verified * 2;
    qualityScore += highInfluence;
    qualityScore -= bots * 2;

    return Math.min(100, Math.max(0, qualityScore));
  }

  private calculateEngagement(tweets, followersCount: number): number {
    const recentTweets = tweets.slice(0, 10);
    let totalEngagement = 0;

    for (const tweet of recentTweets) {
      totalEngagement += tweet.likes + tweet.retweets + tweet.replies;
    }

    const ER = (totalEngagement / recentTweets.length / followersCount) * 100;

    if (ER < 0.5) return 10;
    if (ER < 1) return 40;
    if (ER < 2) return 70;
    return 100;
  }

  private scorePostingFrequency(tweets): number {
    if (!tweets.length) return 0;
    const lastTweet = tweets[0].timestamp;
    const daysSinceLastTweet =
      (Date.now() - new Date(lastTweet).getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastTweet > 30) return 10;
    if (daysSinceLastTweet > 7) return 50;
    return 100;
  }

  private scoreReputation(data: TwitterDataDto): number {
    let score = 50;
    if (data.isBlueVerified) score += 30;
    if (data.followersCount > 1000000) score += 20;
    return Math.min(score, 100);
  }

  private scoreInfluence(followers): number {
    const knownInfluencers = [
      "saylor",
      "CoinDesk",
      "CoinMarketCap",
      "TheMoonCarl",
      "rovercrc",
      "Davincij15",
      "Breedlove22",
      "natbrunell",
      "jackmallers",
      "litecoin",
    ];

    const influenceCount = followers.filter((f) =>
      knownInfluencers.includes(f.username.toLowerCase())
    ).length;

    return Math.min(100, influenceCount * 10);
  }

  private scoreTier1Audience(location: string): number {
    const tier1 = ["US", "United States", "Germany", "UK", "Canada", "Europe"];
    if (!location) return 0;

    const match = tier1.some((c) =>
      location.toLowerCase().includes(c.toLowerCase())
    );
    return match ? 100 : 0;
  }
}
