import { Injectable } from "@nestjs/common";
import type { Person } from "./person.model";
import {
  RatingCanonicalService,
  unifiedToLegacyScoreResult,
} from "src/rating/unified/rating-canonical.service";

type ScorePenalty = {
  key: string;
  value: number;
  reason: string;
};

export type PersonScoreResult = {
  version: "person-v1";
  score: number;
  components: Record<string, number>;
  penalties?: ScorePenalty[];
  calculatedAt: Date;
};

export type PersonScores = {
  rating: number;
  fullness: number;
  ratingBreakdown: PersonScoreResult;
  fullnessBreakdown: PersonScoreResult;
};

@Injectable()
export class PersonsRatingService {
  constructor(private readonly canonical: RatingCanonicalService) {}

  calculatePersonScores(person: Partial<Person> & Record<string, any>): PersonScores {
    // COMPATIBILITY ADAPTER: authoritative person score comes from the single
    // canonical unified engine. `fullness` is the unified completeness so there
    // is exactly one source per entity.
    const result = this.canonical.scorePersonDoc(person);
    const ratingBreakdown = unifiedToLegacyScoreResult(
      result,
      "person-v1"
    ) as PersonScoreResult;
    const fullnessBreakdown: PersonScoreResult = {
      version: "person-v1",
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

  calculateFullness(person: Partial<Person> & Record<string, any>): PersonScoreResult {
    const socialLinks = this.getSocialLinks(person);
    const description = person.bio || person.descriptionText || person.description || person.intelInvestorData?.description;
    const projectsCount = this.getProjectsCount(person);
    const categories = this.getCategories(person);
    const professionalBlocks = [
      ...this.arrayValue(person.educationBlock),
      ...this.arrayValue(person.experienceBlock),
      ...this.arrayValue(person.contributionsBlock),
      ...this.arrayValue(person.networkBlock),
      ...this.arrayValue(person.influenceBlock),
    ];

    const components: Record<string, number> = {
      identity: this.scoreChecks(24, [
        { points: 4, passed: this.hasValue(person.name) },
        { points: 4, passed: this.hasValue(person.logo) },
        { points: 5, passed: this.hasValue(description) },
        { points: 3, passed: this.hasValue(person.country || person.regionData?.properties?.name) },
        { points: 3, passed: this.hasValue(person.type || person.niche || person.tier) },
        { points: 3, passed: this.hasValue(person.slug || person.sourceKey || person.dropstabId) },
        { points: 2, passed: this.hasValue(person.banner) },
      ]),
      socialPresence: this.scoreChecks(16, [
        { points: 4, passed: this.hasValue(socialLinks.twitter) },
        { points: 3, passed: this.hasValue(socialLinks.linkedin) },
        { points: 3, passed: this.hasValue(socialLinks.website) },
        { points: 2, passed: this.hasValue(socialLinks.crunchbase) },
        { points: 2, passed: this.countObjectValues(socialLinks) >= 2 },
        { points: 2, passed: this.arrayValue(person.links).length > 0 },
      ]),
      investmentProfile: this.scoreChecks(30, [
        { points: this.scoreCount(projectsCount, 10, 80), passed: true },
        { points: this.scoreCount(this.getPortfolioItems(person).length, 6, 40), passed: true },
        { points: this.scoreCount(categories.length, 5, 10), passed: true },
        { points: this.scoreCount(this.arrayValue(person.roundsByCategory).length, 3, 8), passed: true },
        { points: this.scoreCount(this.arrayValue(person.roundsByStage).length, 3, 8), passed: true },
        { points: 3, passed: this.hasValue(person.lastRoundDate || person.lastFunding) },
      ]),
      trackRecord: this.scoreChecks(18, [
        { points: this.scoreRoi(this.getRoi(person), 6), passed: true },
        { points: this.scoreAmount(person.totalInvested, 4, 50000000), passed: true },
        { points: this.scoreCount(this.toNumber(person.leadInvestments), 3, 20), passed: true },
        { points: this.scoreCount(this.toNumber(person.publicSalesCount), 3, 30), passed: true },
        { points: 2, passed: this.hasValue(person.topFundedProject || person.projectSupported) },
      ]),
      personContext: this.scoreChecks(12, [
        { points: this.scoreCount(professionalBlocks.length, 5, 8), passed: true },
        { points: 2, passed: this.hasValue(person.achievementsBlock) },
        { points: 2, passed: this.arrayValue(person.colleagues).length > 0 },
        { points: 2, passed: this.arrayValue(person.coInvestors).length > 0 },
        { points: 1, passed: this.arrayValue(person.greenFlagsList).length > 0 },
      ]),
    };

    return {
      version: "person-v1",
      score: this.clamp(Math.round(this.sumComponents(components)), 0, 100),
      components: this.roundComponents(components),
      calculatedAt: new Date(),
    };
  }

  calculateRating(
    person: Partial<Person> & Record<string, any>,
    fullness = this.calculateFullness(person).score,
  ): PersonScoreResult {
    const projectsCount = this.getProjectsCount(person);
    const portfolioItems = this.getPortfolioItems(person);
    const categories = this.getCategories(person);
    const socialLinks = this.getSocialLinks(person);
    const roi = this.getRoi(person);
    const lastActivity = person.lastRoundDate || person.lastFunding || person.syncedInvestorAt || person.createdAt;
    const likesBalance = this.arrayValue(person.likes).length - this.arrayValue(person.dislikes).length;

    const components: Record<string, number> = {
      dataConfidence: this.scoreChecks(10, [
        { points: 2, passed: this.hasValue(person.source || person.syncedInvestorSource) },
        { points: 2, passed: this.hasValue(person.sourceKey || person.slug || person.dropstabId) },
        { points: 2, passed: this.hasValue(person.intelInvestorData || person.investorSnapshot) },
        { points: 2, passed: this.hasValue(lastActivity) },
        { points: 2, passed: this.isFreshDate(lastActivity, 365) },
      ]),
      profileCompleteness: this.clamp((fullness / 100) * 10, 0, 10),
      portfolioStrength: this.scoreChecks(25, [
        { points: this.scoreCount(projectsCount, 10, 120), passed: true },
        { points: this.scoreCount(portfolioItems.length, 5, 60), passed: true },
        { points: this.scoreCount(this.toNumber(person.leadInvestments), 4, 25), passed: true },
        { points: this.scoreCount(this.toNumber(person.publicSalesCount), 3, 40), passed: true },
        { points: this.scoreCount(categories.length, 3, 10), passed: true },
      ]),
      performance: this.scoreChecks(18, [
        { points: this.scoreRoi(roi, 14), passed: true },
        { points: this.scoreAmount(person.totalInvested, 4, 100000000), passed: true },
      ]),
      activityMomentum: this.scoreChecks(10, [
        { points: 6, passed: this.isFreshDate(lastActivity, 365) },
        { points: 2, passed: this.isFreshDate(lastActivity, 90) },
        { points: 2, passed: this.toNumber(person.publicSalesCount) > 0 || this.arrayValue(person.saleIds).length > 0 },
      ]),
      networkPresence: this.scoreChecks(12, [
        { points: this.scoreCount(this.arrayValue(person.coInvestors).length, 4, 50), passed: true },
        { points: this.scoreCount(this.arrayValue(person.colleagues).length, 2, 20), passed: true },
        { points: this.scoreCount(this.countObjectValues(socialLinks), 3, 4), passed: true },
        { points: this.scoreCount(this.toNumber(person.twitterScore), 2, 1000), passed: true },
        { points: likesBalance > 0 ? 1 : 0, passed: true },
      ]),
      riskConsistency: this.scoreChecks(15, [
        { points: 4, passed: !person.redStatus && this.toNumber(person.redFlags) === 0 },
        { points: 3, passed: this.arrayValue(person.redFlagsList).length === 0 },
        { points: 2, passed: this.hasValue(person.status) },
        { points: 2, passed: projectsCount > 0 },
        { points: 2, passed: this.hasValue(person.name) && this.hasValue(person.slug || person.sourceKey) },
        { points: 2, passed: fullness >= 50 },
      ]),
    };

    const penalties = this.buildRatingPenalties(person, {
      projectsCount,
      lastActivity,
      socialLinks,
      fullness,
    });
    const rawScore =
      this.sumComponents(components) -
      penalties.reduce((sum, penalty) => sum + Math.abs(penalty.value), 0);
    let score = this.clamp(Math.round(rawScore), 0, 100);

    if (projectsCount <= 0) score = Math.min(score, 45);
    if (fullness < 35) score = Math.min(score, 55);
    if (!this.hasValue(person.sourceKey || person.slug || person.dropstabId)) score = Math.min(score, 70);
    if (score >= 95 && (fullness < 85 || projectsCount < 40 || this.countObjectValues(socialLinks) < 2)) {
      score = 94;
    }

    return {
      version: "person-v1",
      score,
      components: this.roundComponents(components),
      penalties,
      calculatedAt: new Date(),
    };
  }

  getProjectsCount(person: Partial<Person> & Record<string, any>): number {
    return Math.max(
      this.toNumber(person.totalInvestments),
      this.toNumber(person.numberOfInvestments),
      this.toNumber(person.portfolioCoinsCount),
      this.toNumber(person.projectsCount),
      this.toNumber(person.supportedProjectsCount),
      this.arrayValue(person.portfolioCoins).length,
      this.arrayValue(person.participated).length,
      this.arrayValue(person.investmentPorfolio).length,
      this.arrayValue(person.investmentPortfolio).length,
      this.arrayValue(person.projects).length,
      this.toNumber(person.investorSnapshot?.stats?.totalInvestments),
      this.toNumber(person.intelInvestorData?.stats?.totalInvestments),
    );
  }

  getRoi(person: Partial<Person> & Record<string, any>): number {
    const values = [
      person.roi,
      person.averageRoi,
      person.athRoi,
      person.highestRoi,
      person.privateRoiPercent,
      person.retailRoiPercent,
      person.intelInvestorData?.avgPrivateRoi?.USD,
      person.intelInvestorData?.avgPublicRoi?.USD,
      person.investorSnapshot?.stats?.avgPublicRoi,
      person.investorSnapshot?.stats?.avgPrivateRoi,
    ].map((value) => this.toNumber(value));

    return values.find((value) => value !== 0) || 0;
  }

  private buildRatingPenalties(
    person: Partial<Person> & Record<string, any>,
    context: {
      projectsCount: number;
      lastActivity: any;
      socialLinks: Record<string, any>;
      fullness: number;
    },
  ): ScorePenalty[] {
    const penalties: ScorePenalty[] = [];

    if (person.redStatus === true) {
      penalties.push({
        key: "redStatus",
        value: -15,
        reason: "Person has active red status",
      });
    }

    const redFlags = Math.max(
      this.toNumber(person.redFlags),
      this.arrayValue(person.redFlagsList).length,
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
        key: "missingInvestments",
        value: -25,
        reason: "No investments, portfolio, or participated projects",
      });
    }

    if (!this.countObjectValues(context.socialLinks)) {
      penalties.push({
        key: "missingSocialLinks",
        value: -5,
        reason: "No social or website links",
      });
    }

    if (!this.hasValue(person.sourceKey || person.slug || person.dropstabId)) {
      penalties.push({
        key: "weakIdentity",
        value: -6,
        reason: "No stable source key, slug, or external id",
      });
    }

    if (this.hasValue(context.lastActivity) && !this.isFreshDate(context.lastActivity, 730)) {
      penalties.push({
        key: "staleActivity",
        value: -8,
        reason: "Last visible activity is older than 730 days",
      });
    }

    if (context.fullness < 30) {
      penalties.push({
        key: "lowFullness",
        value: -10,
        reason: "Profile completeness is below 30",
      });
    }

    return penalties;
  }

  private getPortfolioItems(person: Partial<Person> & Record<string, any>): any[] {
    const items = [
      ...this.arrayValue(person.portfolioCoins),
      ...this.arrayValue(person.participated),
      ...this.arrayValue(person.investmentPorfolio),
      ...this.arrayValue(person.investmentPortfolio),
      ...this.arrayValue(person.projects),
    ];

    return items;
  }

  private getCategories(person: Partial<Person> & Record<string, any>): string[] {
    const rawValues = [
      ...this.arrayValue(person.categories),
      ...this.arrayValue(person.tags),
      ...this.arrayValue(person.roundsByCategory).map((item) => item?.name),
      person.niche,
      person.type,
    ];

    return Array.from(
      new Set(
        rawValues
          .map((item) => this.toDisplayString(item))
          .filter(Boolean),
      ),
    );
  }

  private getSocialLinks(person: Partial<Person> & Record<string, any>): Record<string, any> {
    const fromSocialMedia = this.arrayValue(person.socialmedia).reduce(
      (acc, item) => {
        const key = this.toDisplayString(item?.name || item?.type || item?.key || item?.title).toLowerCase();
        const href = item?.href || item?.link || item?.url || item?.value;
        if (key && href) acc[key] = href;
        return acc;
      },
      {} as Record<string, any>,
    );
    const fromLinks = this.arrayValue(person.links).reduce(
      (acc, item) => {
        const key = this.toDisplayString(item?.type || item?.name || item?.title).toLowerCase();
        const href = item?.href || item?.link || item?.url || item?.value;
        if (key && href) acc[key] = href;
        return acc;
      },
      {} as Record<string, any>,
    );

    return {
      ...fromSocialMedia,
      ...fromLinks,
      website: person.websiteUrl || fromSocialMedia.website || fromLinks.website || this.arrayValue(person.website)[0],
      twitter: person.twitterUrl || fromSocialMedia.twitter || fromLinks.twitter || fromSocialMedia.x || fromLinks.x,
      linkedin: person.linkedinUrl || fromSocialMedia.linkedin || fromLinks.linkedin,
      crunchbase: person.crunchbaseUrl || fromSocialMedia.crunchbase || fromLinks.crunchbase,
    };
  }

  private scoreChecks(
    weight: number,
    checks: Array<{ points: number; passed: boolean }>,
  ): number {
    const score = checks.reduce(
      (sum, check) => sum + (check.passed ? check.points : 0),
      0,
    );

    return this.clamp(score, 0, weight);
  }

  private scoreRoi(value: any, maxPoints: number): number {
    const roi = this.toNumber(value);
    if (roi <= 0) return 0;

    if (roi <= 10) {
      return this.clamp((roi / 10) * maxPoints, 0, maxPoints);
    }

    return this.clamp((Math.log10(roi + 1) / Math.log10(1000 + 1)) * maxPoints, 0, maxPoints);
  }

  private scoreAmount(value: any, maxPoints: number, strongValue: number): number {
    const amount = this.toNumber(value);
    if (amount <= 0 || strongValue <= 0) return 0;

    return this.clamp(
      (Math.log10(amount + 1) / Math.log10(strongValue + 1)) * maxPoints,
      0,
      maxPoints,
    );
  }

  private scoreCount(count: number, maxPoints: number, strongCount: number): number {
    if (!Number.isFinite(count) || count <= 0 || strongCount <= 0) return 0;

    return this.clamp((count / strongCount) * maxPoints, 0, maxPoints);
  }

  private sumComponents(components: Record<string, number>): number {
    return Object.values(components).reduce((sum, value) => sum + value, 0);
  }

  private roundComponents(components: Record<string, number>): Record<string, number> {
    return Object.entries(components).reduce((acc, [key, value]) => {
      acc[key] = Math.round(value * 100) / 100;
      return acc;
    }, {} as Record<string, number>);
  }

  private countObjectValues(value: Record<string, any>): number {
    return Object.values(value || {}).filter((item) => this.hasValue(item)).length;
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
      const parsed = Number(value.replace(/[$,%\s]/g, "").replace(/,/g, ""));
      return Number.isFinite(parsed) ? parsed : 0;
    }
    return 0;
  }

  private toDisplayString(value: any): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      return this.toDisplayString(value.name || value.label || value.title || value.value);
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
