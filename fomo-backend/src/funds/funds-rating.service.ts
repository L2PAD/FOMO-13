import { Injectable } from "@nestjs/common";
import type { Funds } from "./funds.model";
import {
  RatingCanonicalService,
  unifiedToLegacyScoreResult,
} from "src/rating/unified/rating-canonical.service";
import {
  applyRuntimeFullnessFormula,
  applyRuntimeRatingFormula,
} from "src/rating/rating-formula.runtime";

type ScorePenalty = {
  key: string;
  value: number;
  reason: string;
};

export type BackerScoreResult = {
  version: "backer-v1";
  score: number;
  components: Record<string, number>;
  penalties?: ScorePenalty[];
  caps?: Array<{
    key: string;
    value: number;
    reason: string;
  }>;
  calculatedAt: Date;
};

export type BackerScores = {
  rating: number;
  fullness: number;
  ratingBreakdown: BackerScoreResult;
  fullnessBreakdown: BackerScoreResult;
};

@Injectable()
export class FundsRatingService {
  constructor(private readonly canonical: RatingCanonicalService) {}

  calculateBackerScores(
    fund: Partial<Funds> & Record<string, any>,
    investorDetail?: Record<string, any> | null
  ): BackerScores {
    // COMPATIBILITY ADAPTER: the authoritative fund/backer score now comes from
    // the single canonical unified engine (RatingCanonicalService). The legacy
    // backer-v1 completeness formula is retained only as a secondary metric
    // (`fullness`) and is no longer used as the current rating.
    const source = { ...(fund || {}), ...(investorDetail || {}) };
    const result = this.canonical.scoreFundDoc(source);
    const ratingBreakdown = unifiedToLegacyScoreResult(
      result,
      "backer-v1"
    ) as BackerScoreResult;
    const fullnessBreakdown: BackerScoreResult = {
      version: "backer-v1",
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

  calculateFullness(
    fund: Partial<Funds> & Record<string, any>,
    investorDetail?: Record<string, any> | null
  ): BackerScoreResult {
    const description =
      fund.bio || fund.description || investorDetail?.description;
    const socialLinks = this.getSocialLinks(fund, investorDetail);
    const projectsCount = this.getProjectsCount(fund, investorDetail);
    const fundraisingRounds = this.arrayValue(
      investorDetail?.fundraisingRounds?.length
        ? investorDetail?.fundraisingRounds
        : fund.roundsByStage
    );
    const coInvestors = this.arrayValue(
      fund.coInvestors?.length ? fund.coInvestors : investorDetail?.coInvestors
    );
    const sectors = this.getSectors(fund, investorDetail);

    const components: Record<string, number> = {
      basicProfile: this.scoreChecks(25, [
        { points: 4, passed: this.hasValue(fund.name) },
        { points: 4, passed: this.hasValue(fund.logo || investorDetail?.logo) },
        { points: 5, passed: this.hasValue(description) },
        {
          points: 4,
          passed: this.hasValue(
            fund.websiteUrl || investorDetail?.website || socialLinks.website
          ),
        },
        {
          points: 4,
          passed: this.hasValue(
            fund.type ||
              fund.niche ||
              investorDetail?.type ||
              investorDetail?.category
          ),
        },
        {
          points: 4,
          passed: this.hasValue(
            fund.country ||
              fund.regionData?.properties?.name ||
              investorDetail?.country ||
              investorDetail?.location
          ),
        },
      ]),
      socialLinks: this.scoreChecks(15, [
        { points: 4, passed: this.hasValue(socialLinks.twitter) },
        { points: 3, passed: this.hasValue(socialLinks.linkedin) },
        { points: 2, passed: this.hasValue(socialLinks.telegram) },
        { points: 2, passed: this.hasValue(socialLinks.discord) },
        { points: 2, passed: this.hasValue(socialLinks.medium) },
        {
          points: 2,
          passed: this.hasValue(
            socialLinks.github || socialLinks.crunchbase || socialLinks.website
          ),
        },
      ]),
      investmentData: this.scoreChecks(30, [
        { points: this.scoreCount(projectsCount, 10, 100), passed: true },
        {
          points: this.scoreCount(fundraisingRounds.length, 6, 20),
          passed: true,
        },
        { points: this.scoreCount(coInvestors.length, 5, 40), passed: true },
        { points: this.scoreCount(sectors.length, 5, 8), passed: true },
        {
          points: 4,
          passed:
            this.hasTruthy(fund.isLeadInvestor) ||
            this.toNumber(fund.leadInvestments) > 0,
        },
      ]),
      stats: this.scoreChecks(30, [
        {
          points: this.scoreRoi(this.getRoi(fund, investorDetail), 8),
          passed: true,
        },
        {
          points: this.scoreCount(
            this.toNumber(
              fund.totalInvestments ||
                fund.numberOfInvestments ||
                investorDetail?.stats?.totalInvestments
            ),
            7,
            100
          ),
          passed: true,
        },
        {
          points: this.scoreCount(
            this.toNumber(
              fund.publicSalesCount || investorDetail?.stats?.publicSalesCount
            ),
            4,
            20
          ),
          passed: true,
        },
        {
          points: this.hasValue(
            fund.lastRoundDate ||
              fund.lastFunding ||
              investorDetail?.lastDetailParsedAt
          )
            ? 5
            : 0,
          passed: true,
        },
        {
          points: this.scoreAmount(
            fund.currentAum || fund.investAmount,
            6,
            1000000000
          ),
          passed: true,
        },
      ]),
    };

    return {
      version: "backer-v1",
      score: this.clamp(Math.round(this.sumComponents(components)), 0, 100),
      components: this.roundComponents(components),
      calculatedAt: new Date(),
    };
  }

  calculateRating(
    fund: Partial<Funds> & Record<string, any>,
    investorDetail?: Record<string, any> | null,
    fullness = this.calculateFullness(fund, investorDetail).score
  ): BackerScoreResult {
    const projectsCount = this.getProjectsCount(fund, investorDetail);
    const roi = this.getRoi(fund, investorDetail);
    const coInvestors = this.arrayValue(
      fund.coInvestors?.length ? fund.coInvestors : investorDetail?.coInvestors
    );
    const sectors = this.getSectors(fund, investorDetail);
    const socialLinks = this.getSocialLinks(fund, investorDetail);
    const lastActivity =
      fund.lastRoundDate ||
      fund.lastFunding ||
      investorDetail?.lastDetailParsedAt;
    const portfolioItems = this.arrayValue(
      fund.portfolioCoins?.length
        ? fund.portfolioCoins
        : investorDetail?.portfolio
    );
    const marketCapSum = portfolioItems.reduce(
      (sum, item) => sum + this.toNumber(item?.marketCap),
      0
    );

    const components: Record<string, number> = {
      sourceDataConfidence: this.scoreChecks(10, [
        {
          points: 2,
          passed: this.hasValue(fund.source || investorDetail?.source),
        },
        {
          points: 2,
          passed: this.hasValue(
            fund.sourceKey ||
              fund.dropstabId ||
              investorDetail?.sourceId ||
              investorDetail?.slug
          ),
        },
        {
          points: 2,
          passed:
            Boolean(investorDetail) || this.hasValue(fund.intelInvestorData),
        },
        { points: 2, passed: this.hasValue(lastActivity) },
        { points: 2, passed: this.isFreshDate(lastActivity, 180) },
      ]),
      profileCompleteness: this.clamp((fullness / 100) * 10, 0, 10),
      portfolioStrength: this.scoreChecks(25, [
        { points: this.scoreCount(projectsCount, 10, 150), passed: true },
        { points: this.scoreAmount(marketCapSum, 5, 2000000000), passed: true },
        {
          points: this.scoreCount(
            this.toNumber(fund?.binanceListing?.listedProjects),
            4,
            20
          ),
          passed: true,
        },
        {
          points: this.scoreCount(this.toNumber(fund.leadInvestments), 3, 25),
          passed: true,
        },
        { points: this.scoreCount(sectors.length, 3, 8), passed: true },
      ]),
      roiPerformance: this.scoreRoi(roi, 20),
      fundraisingActivity: this.scoreChecks(15, [
        {
          points: this.scoreCount(
            this.arrayValue(fund.roundsByStage).length,
            4,
            8
          ),
          passed: true,
        },
        {
          points: this.scoreCount(
            this.arrayValue(fund.roundsByCategory).length,
            3,
            8
          ),
          passed: true,
        },
        {
          points: this.scoreCount(
            this.toNumber(
              fund.totalInvestments ||
                fund.numberOfInvestments ||
                investorDetail?.stats?.totalInvestments
            ),
            4,
            120
          ),
          passed: true,
        },
        { points: 4, passed: this.isFreshDate(lastActivity, 365) },
      ]),
      coInvestorNetwork: this.scoreChecks(10, [
        { points: this.scoreCount(coInvestors.length, 6, 80), passed: true },
        {
          points: this.scoreCount(
            this.sumCoInvestorCounts(coInvestors),
            4,
            200
          ),
          passed: true,
        },
      ]),
      socialMarketPresence: this.scoreChecks(5, [
        { points: 2, passed: this.countObjectValues(socialLinks) >= 2 },
        {
          points: this.scoreCount(
            this.toNumber(
              fund.twitterScore || investorDetail?.stats?.twitterScore
            ),
            3,
            1000
          ),
          passed: true,
        },
      ]),
      riskConsistency: this.scoreChecks(5, [
        {
          points: 2,
          passed: !fund.redStatus && this.toNumber(fund.redFlags) === 0,
        },
        {
          points: 1,
          passed: this.hasValue(fund.status || investorDetail?.status),
        },
        { points: 1, passed: projectsCount > 0 },
        {
          points: 1,
          passed:
            this.hasValue(fund.name) &&
            this.hasValue(fund.slug || investorDetail?.slug),
        },
      ]),
    };

    const penalties = this.buildRatingPenalties(fund, investorDetail, {
      projectsCount,
      lastActivity,
      socialLinks,
    });
    const rawScore =
      this.sumComponents(components) -
      penalties.reduce((sum, penalty) => sum + Math.abs(penalty.value), 0);
    let score = this.clamp(Math.round(rawScore), 0, 100);
    const caps: NonNullable<BackerScoreResult["caps"]> = [];

    if (projectsCount <= 0) {
      caps.push({
        key: "missingPortfolio",
        value: 45,
        reason: "No portfolio or investment count data",
      });
    }
    if (
      !investorDetail &&
      !this.hasValue(fund.sourceKey || fund.dropstabId || fund.slug)
    ) {
      caps.push({
        key: "missingStableSource",
        value: 60,
        reason: "No enriched detail or stable source identity",
      });
    }
    score = caps.reduce((value, cap) => Math.min(value, cap.value), score);

    return {
      version: "backer-v1",
      score,
      components: this.roundComponents(components),
      penalties,
      caps,
      calculatedAt: new Date(),
    };
  }

  getProjectsCount(
    fund: Partial<Funds> & Record<string, any>,
    investorDetail?: Record<string, any> | null
  ): number {
    return Math.max(
      this.toNumber(fund.projectsCount),
      this.toNumber(fund.supportedProjectsCount),
      this.toNumber(fund.totalInvestments),
      this.toNumber(fund.numberOfInvestments),
      this.toNumber(fund.portfolioCoinsCount),
      this.toNumber(fund?.binanceListing?.totalProjects),
      this.arrayValue(fund.projects).length,
      this.arrayValue(fund.portfolioCoins).length,
      this.arrayValue(investorDetail?.portfolio).length,
      this.toNumber(investorDetail?.stats?.portfolioProjects),
      this.toNumber(investorDetail?.stats?.totalInvestments)
    );
  }

  getRoi(
    fund: Partial<Funds> & Record<string, any>,
    investorDetail?: Record<string, any> | null
  ): number {
    const values = [
      fund.roi,
      fund.averageRoi,
      fund.privateRoiPercent,
      fund.retailRoiPercent,
      fund.intelInvestorData?.avgPrivateRoi?.USD,
      fund.intelInvestorData?.avgPublicRoi?.USD,
      investorDetail?.stats?.avgPublicRoi,
      investorDetail?.stats?.avgPrivateRoi,
    ].map((value) => this.toNumber(value));

    return values.find((value) => value !== 0) || 0;
  }

  private buildRatingPenalties(
    fund: Partial<Funds> & Record<string, any>,
    investorDetail: Record<string, any> | null | undefined,
    context: {
      projectsCount: number;
      lastActivity: any;
      socialLinks: Record<string, any>;
    }
  ): ScorePenalty[] {
    const penalties: ScorePenalty[] = [];

    if (fund.redStatus === true) {
      penalties.push({
        key: "redStatus",
        value: -15,
        reason: "Backer has active red status",
      });
    }

    const redFlags = Math.max(
      this.toNumber(fund.redFlags),
      this.arrayValue(fund.redFlagsList).length
    );
    if (redFlags > 0) {
      penalties.push({
        key: "redFlags",
        value: -Math.min(redFlags * 5, 25),
        reason: `${redFlags} red flag(s) detected`,
      });
    }

    if (context.projectsCount <= 0) {
      penalties.push({
        key: "missingPortfolio",
        value: -20,
        reason: "No portfolio or investment count data",
      });
    }

    if (!investorDetail && !this.hasValue(fund.intelInvestorData)) {
      penalties.push({
        key: "missingInvestorDetail",
        value: -8,
        reason: "No enriched investor detail found",
      });
    }

    if (!this.countObjectValues(context.socialLinks)) {
      penalties.push({
        key: "missingSocialLinks",
        value: -5,
        reason: "No social or website links",
      });
    }

    if (
      this.hasValue(context.lastActivity) &&
      !this.isFreshDate(context.lastActivity, 365)
    ) {
      penalties.push({
        key: "staleActivity",
        value: -6,
        reason: "Last investment activity is older than 365 days",
      });
    }

    return penalties;
  }

  private getSectors(
    fund: Partial<Funds> & Record<string, any>,
    investorDetail?: Record<string, any> | null
  ): string[] {
    const rawValues = [
      ...this.arrayValue(fund.categories),
      ...this.arrayValue(fund.tags),
      ...this.arrayValue(investorDetail?.tags),
      ...this.arrayValue(investorDetail?.sectors),
      ...this.arrayValue(fund.roundsByCategory).map((item) => item?.name),
      fund.industryFocus,
    ];

    return Array.from(
      new Set(
        rawValues.map((item) => this.toDisplayString(item)).filter(Boolean)
      )
    );
  }

  private getSocialLinks(
    fund: Partial<Funds> & Record<string, any>,
    investorDetail?: Record<string, any> | null
  ): Record<string, any> {
    const fromSocialMedia = this.arrayValue(fund.socialmedia).reduce(
      (acc, item) => {
        const key = this.toDisplayString(
          item?.name || item?.type || item?.key
        ).toLowerCase();
        const href = item?.href || item?.link || item?.url;
        if (key && href) acc[key] = href;
        return acc;
      },
      {} as Record<string, any>
    );

    return {
      ...fromSocialMedia,
      ...(investorDetail?.socialLinks || {}),
      website:
        fund.websiteUrl || investorDetail?.website || fromSocialMedia.website,
      twitter:
        fund.twitterUrl ||
        investorDetail?.socialLinks?.twitter ||
        fromSocialMedia.twitter,
      linkedin:
        fund.linkedinUrl ||
        investorDetail?.socialLinks?.linkedin ||
        fromSocialMedia.linkedin,
      crunchbase:
        fund.crunchbaseUrl ||
        investorDetail?.socialLinks?.crunchbase ||
        fromSocialMedia.crunchbase,
    };
  }

  private scoreRoi(value: any, maxPoints: number): number {
    const roi = this.toNumber(value);
    if (roi <= 0) return 0;

    if (roi <= 10) {
      return this.clamp((roi / 10) * maxPoints, 0, maxPoints);
    }

    return this.clamp(
      (Math.log10(roi + 1) / Math.log10(1000 + 1)) * maxPoints,
      0,
      maxPoints
    );
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
    const amount = this.toNumber(value);
    if (amount <= 0 || strongValue <= 0) return 0;

    return this.clamp(
      (Math.log10(amount + 1) / Math.log10(strongValue + 1)) * maxPoints,
      0,
      maxPoints
    );
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

  private sumCoInvestorCounts(items: any[]): number {
    return items.reduce(
      (sum, item) => sum + this.toNumber(item?.count || 1),
      0
    );
  }

  private countObjectValues(value: Record<string, any>): number {
    return Object.values(value || {}).filter((item) => this.hasValue(item))
      .length;
  }

  private hasTruthy(value: any): boolean {
    return value === true || value === "true" || value === 1 || value === "1";
  }

  private hasValue(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === "number") return Number.isFinite(value);
    if (typeof value === "boolean") return true;
    if (typeof value === "string") return value.trim().length > 0;
    if (value instanceof Date) return !Number.isNaN(value.getTime());
    if (Array.isArray(value)) return value.some((item) => this.hasValue(item));
    if (typeof value === "object") {
      return Object.keys(value).some((key) => this.hasValue(value[key]));
    }

    return true;
  }

  private isFreshDate(value: any, maxAgeDays: number): boolean {
    const date = this.toDate(value);
    if (!date) return false;

    const ageMs = Date.now() - date.getTime();
    return ageMs >= 0 && ageMs <= maxAgeDays * 24 * 60 * 60 * 1000;
  }

  private toDate(value: any): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private toNumber(value: any): number {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value === "string") {
      const normalized = value.replace(/[$,%\s]/g, "").replace(/,/g, "");
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private toDisplayString(value: any): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      return this.toDisplayString(
        value.name || value.label || value.title || value.value
      );
    }

    const normalized = String(value).trim();
    return normalized && normalized !== "[object Object]" ? normalized : "";
  }

  private arrayValue(value: any): any[] {
    return Array.isArray(value) ? value : [];
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}
