import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  FomoV2Backer,
  FomoV2BackerListReadModel,
  FomoV2BackerPortfolioHolding,
  FomoV2BackerReadModel,
} from "../models";
import { FomoV2FundingRound } from "../../funding";
import { FomoV2IcoProjectReadModel } from "../../ico";
import { FomoV2MarketProjectReadModel } from "../../market";
import { FomoV2CanonicalProject } from "../../../models";

export interface FomoV2BackerListReadModelMaterializeOptions {
  limit?: number;
  offset?: number;
  write?: boolean;
  confirmWrite?: boolean;
  examplesLimit?: number;
  assertExecutionActive?: () => void | Promise<void>;
}

export interface FomoV2BackerListReadModelMaterializeResult {
  mode: "dry-run" | "write";
  requestedLimit: number;
  requestedOffset: number;
  scannedBackers: number;
  built: number;
  written: number;
  skipped: {
    missingBackerId: number;
    missingName: number;
  };
  examples: {
    built: any[];
    skipped: any[];
  };
}

type BackerMaterializeContext = {
  sourceByBackerId: Map<string, any>;
  holdingsByBackerId: Map<string, any[]>;
  roundsById: Map<string, any>;
  projectCategoriesByCanonicalId: Map<string, string[]>;
};

const SCHEMA_VERSION = 1;
const EXCLUDED_PROJECT_CATEGORY_KEYS = new Set([
  "funding",
  "intel_fundraising",
  "source_funding",
  "pre_seed",
  "preseed",
  "private",
  "private_sale",
  "seed",
  "series",
  "series_a",
  "series_b",
  "series_c",
  "series_d",
  "series_e",
  "strategic",
  "strategic_round",
  "public",
  "public_sale",
  "grant",
  "ico",
  "ido",
  "ieo",
  "pre_sale",
  "presale",
  "token_sale",
  "angel_investor",
  "fund",
  "person",
]);

@Injectable()
export class FomoV2BackerListReadModelService {
  constructor(
    @InjectModel(FomoV2BackerListReadModel.name)
    private readonly listReadModel: Model<FomoV2BackerListReadModel>,
    @InjectModel(FomoV2BackerReadModel.name)
    private readonly profileReadModel: Model<FomoV2BackerReadModel>,
    @InjectModel(FomoV2Backer.name)
    private readonly backerModel: Model<FomoV2Backer>,
    @InjectModel(FomoV2BackerPortfolioHolding.name)
    private readonly holdingModel: Model<FomoV2BackerPortfolioHolding>,
    @InjectModel(FomoV2FundingRound.name)
    private readonly fundingRoundModel: Model<FomoV2FundingRound>,
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly marketProjectReadModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(FomoV2IcoProjectReadModel.name)
    private readonly icoProjectReadModel: Model<FomoV2IcoProjectReadModel>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>,
  ) {}

  async materialize(
    options: FomoV2BackerListReadModelMaterializeOptions = {},
  ): Promise<FomoV2BackerListReadModelMaterializeResult> {
    const write = options.write === true;
    if (write && options.confirmWrite !== true) {
      throw new Error(
        "FOMO v2 backer list read-model write requires --confirm-write=true.",
      );
    }
    await options.assertExecutionActive?.();

    const limit = this.positiveInteger(options.limit, 1000);
    const offset = this.nonNegativeInteger(options.offset, 0);
    const examplesLimit = this.nonNegativeInteger(options.examplesLimit, 10);
    const profiles = await this.profileReadModel
      .find({})
      .sort({ _id: 1 })
      .skip(offset)
      .limit(limit)
      .lean()
      .exec();
    const context = await this.loadContext(profiles as any[]);
    await options.assertExecutionActive?.();
    const rows: any[] = [];
    const skipped = {
      missingBackerId: 0,
      missingName: 0,
    };
    const examples = {
      built: [] as any[],
      skipped: [] as any[],
    };

    for (const [profileIndex, profile] of (profiles as any[]).entries()) {
      if (profileIndex % 100 === 0) {
        await options.assertExecutionActive?.();
      }
      const backerId = this.toObjectId(profile?.backerId);
      if (!backerId) {
        skipped.missingBackerId += 1;
        this.pushExample(examples.skipped, { reason: "missingBackerId" }, examplesLimit);
        continue;
      }

      const name = this.firstString(profile?.name);
      if (!name) {
        skipped.missingName += 1;
        this.pushExample(
          examples.skipped,
          { reason: "missingName", backerId: this.toIdString(backerId) },
          examplesLimit,
        );
        continue;
      }

      const row = this.buildReadModelRow(profile, context);
      rows.push(row);
      this.pushExample(
        examples.built,
        {
          backerId: this.toIdString(row.backerId),
          name: row.name,
          backerType: row.backerType,
          projectsCount: row.projectsCount,
          rating: row.rating,
        },
        examplesLimit,
      );
    }

    let written = 0;
    if (write && rows.length) {
      await options.assertExecutionActive?.();
      await this.listReadModel.createIndexes();
      await options.assertExecutionActive?.();
      const now = new Date();
      const result = await this.listReadModel.bulkWrite(
        rows.map((row) => ({
          updateOne: {
            filter: { backerId: row.backerId },
            update: {
              $set: {
                ...row,
                updatedAt: now,
                materializedAt: now,
              },
              $setOnInsert: {
                createdAt: now,
              },
            },
            upsert: true,
          },
        })),
        { ordered: false },
      );
      await options.assertExecutionActive?.();
      written =
        Number((result as any).upsertedCount || 0) +
        Number((result as any).modifiedCount || 0);
    }

    return {
      mode: write ? "write" : "dry-run",
      requestedLimit: limit,
      requestedOffset: offset,
      scannedBackers: profiles.length,
      built: rows.length,
      written,
      skipped,
      examples,
    };
  }

  buildReadModelRow(profile: any, context: BackerMaterializeContext): any {
    const backerId = this.requiredObjectId(profile?.backerId, "backerId");
    const source = context.sourceByBackerId.get(this.toIdString(backerId));
    const adminFlags = source?.metadata?.admin || {};
    const holdings = context.holdingsByBackerId.get(this.toIdString(backerId)) || [];
    const socialLinks = this.socialLinks(profile?.socials || source?.socials);
    const socialmedia = this.toSocialMedia(socialLinks);
    const projects = this.projectPreview(holdings);
    const supportedProjectsCount = holdings.length;
    const totalKnownRaisedAmount = holdings.reduce(
      (sum, holding) => sum + (this.toFiniteNumber(holding?.totalKnownRaisedAmountUsd) || 0),
      0,
    );
    const leadInvestments = holdings.filter((holding) => Boolean(holding?.isLead)).length;
    const roundIds = this.uniqueStrings(
      holdings.flatMap((holding) =>
        this.arrayValue(holding?.roundIds).map((id: any) => this.toIdString(id)),
      ),
    );
    const rounds = roundIds
      .map((id) => context.roundsById.get(id))
      .filter(Boolean);
    const roi = this.averageRoi(rounds);
    const sectors = this.projectCategoriesForHoldings(holdings, context).slice(0, 120);
    const country = this.firstString(profile?.country, source?.country);
    const regionData = this.regionData(country);
    const niche = this.firstString(
      profile?.niche,
      source?.niche,
      source?.metadata?.rawType,
      profile?.backerType,
    );
    const type = profile?.backerType === "person"
      ? this.firstString(niche, "Angel Investor")
      : this.firstString(niche, "Ventures Capital");
    const specializations =
      profile?.backerType === "person"
        ? this.uniqueStrings([type, niche, ...sectors].filter(Boolean) as string[])
        : [];
    const lastRoundDate = this.maxDate(...holdings.map((holding) => holding?.lastRoundDate));
    const lastUpdatedAt = this.maxDate(profile?.updatedAt, source?.updatedAt, lastRoundDate) || new Date();
    const profileCompleteness = this.toFiniteNumber(profile?.profileCompleteness) || 0;
    const fullness = this.scoreFullness(profileCompleteness, supportedProjectsCount, socialmedia.length);
    const rating = this.scoreRating({
      incoming: this.toFiniteNumber((profile as any)?.rating ?? (profile as any)?.fomoScore),
      profileCompleteness,
      projectsCount: supportedProjectsCount,
      leadInvestments,
      roi,
      hasSocialLinks: socialmedia.length > 0,
    });
    const tags = this.uniqueStrings([
      profile?.primarySource,
      source?.primarySource,
      source?.metadata?.sourceCollection,
    ].map((value) => this.toDisplayString(value))).filter(Boolean);
    const searchTokens = this.searchTokens([
      profile?.name,
      profile?.slug,
      source?.sourceId,
      source?.sourceUrl,
      country,
      niche,
      type,
      ...sectors,
      ...projects.flatMap((project) => [project.name, project.slug, project.symbol]),
    ]);

    return this.cleanObject({
      backerId,
      backerType: profile?.backerType === "person" ? "person" : "fund",
      visible: adminFlags.visible === false ? false : true,
      status: this.firstString(adminFlags.status, source?.status, "active"),
      name: this.firstString(profile?.name),
      normalizedName: this.firstString(profile?.normalizedName),
      slug: this.firstString(profile?.slug, source?.slug),
      routeId: this.firstString(profile?.slug, source?.slug, this.toIdString(backerId)),
      logo: this.firstString(profile?.logoUrl, source?.logoUrl, profile?.avatarUrl, source?.avatarUrl),
      avatar: this.firstString(profile?.avatarUrl, profile?.logoUrl, source?.avatarUrl, source?.logoUrl),
      type,
      niche,
      specialization: specializations[0],
      specializations,
      country,
      location: country,
      regionData,
      descriptionText: this.firstString(profile?.description, source?.description),
      bio: this.firstString(profile?.description, source?.description),
      websiteUrl: socialLinks.website,
      twitterUrl: socialLinks.twitter,
      linkedinUrl: socialLinks.linkedin,
      socialLinks,
      socialmedia,
      sectors,
      tags,
      rating,
      fomoScore: rating,
      fullness,
      roi,
      roiDisplay: this.formatRoiDisplay(roi),
      totalInvested:
        profile?.backerType === "person"
          ? supportedProjectsCount
          : Math.round(totalKnownRaisedAmount),
      projectsCount: supportedProjectsCount,
      supportedProjectsCount,
      portfolioCoinsCount: supportedProjectsCount,
      supportedProjectsPreview: projects,
      leadInvestments,
      followersCount: this.toFiniteNumber(source?.metadata?.followers) || 0,
      isSponsored: Boolean(adminFlags.isSponsored),
      isEralash: Boolean(adminFlags.isEralash),
      eralashAdded: this.toDate(adminFlags.eralashAdded),
      redFlags: this.toFiniteNumber(adminFlags.redFlags) || 0,
      redFlagsList: this.arrayValue(adminFlags.redFlagsList),
      redStatus: Boolean(adminFlags.redStatus),
      likes: [],
      lastRoundDate,
      lastFunding: lastRoundDate,
      lastUpdatedAt,
      nicheKeys: this.keys([niche, type, ...specializations]),
      sectorKeys: this.keys(sectors),
      countryKeys: this.keys([country, regionData?.id, regionData?.properties?.name]),
      regionKeys: this.keys([regionData?.region, regionData?.subregion, country]),
      searchTokens,
      sourceUpdatedAt: lastUpdatedAt,
      schemaVersion: SCHEMA_VERSION,
    });
  }

  private async loadContext(profiles: any[]): Promise<BackerMaterializeContext> {
    const backerIds = this.uniqueObjectIds(profiles.map((profile) => profile?.backerId));
    const [sources, holdings] = await Promise.all([
      backerIds.length
        ? this.backerModel.find({ _id: { $in: backerIds } }).lean().exec()
        : [],
      backerIds.length
        ? this.holdingModel
            .find({ backerId: { $in: backerIds } })
            .sort({ backerId: 1, hasMarketData: -1, lastRoundDate: -1, projectName: 1 })
            .lean()
            .exec()
        : [],
    ]);
    const roundIds = this.uniqueObjectIds(
      (holdings as any[]).flatMap((holding) => this.arrayValue(holding?.roundIds)),
    );
    const canonicalProjectIds = this.uniqueObjectIds(
      (holdings as any[]).map((holding) => holding?.canonicalProjectId),
    );
    const [rounds, marketProjects, icoProjects, canonicalProjects] = await Promise.all([
      roundIds.length
        ? this.fundingRoundModel
            .find({ _id: { $in: roundIds } }, { _id: 1, roi: 1 })
            .lean()
            .exec()
        : [],
      canonicalProjectIds.length
        ? this.marketProjectReadModel
            .find(
              { canonicalProjectId: { $in: canonicalProjectIds } },
              { canonicalProjectId: 1, category: 1, categories: 1, niche: 1, symbol: 1 },
            )
            .lean()
            .exec()
        : [],
      canonicalProjectIds.length
        ? this.icoProjectReadModel
            .find(
              { canonicalProjectId: { $in: canonicalProjectIds } },
              { canonicalProjectId: 1, categories: 1, symbol: 1, metadata: 1 },
            )
            .lean()
            .exec()
        : [],
      canonicalProjectIds.length
        ? this.canonicalProjectModel
            .find(
              { _id: { $in: canonicalProjectIds } },
              { _id: 1, symbol: 1, metadata: 1 },
            )
            .lean()
            .exec()
        : [],
    ]);

    return {
      sourceByBackerId: this.firstById(sources as any[], "_id"),
      holdingsByBackerId: this.groupById(holdings as any[], "backerId"),
      roundsById: this.firstById(rounds as any[], "_id"),
      projectCategoriesByCanonicalId: this.buildProjectCategoriesByCanonicalId(
        marketProjects as any[],
        icoProjects as any[],
        canonicalProjects as any[],
      ),
    };
  }

  private buildProjectCategoriesByCanonicalId(
    marketProjects: any[],
    icoProjects: any[],
    canonicalProjects: any[],
  ): Map<string, string[]> {
    const output = new Map<string, string[]>();
    const add = (canonicalProjectId: any, categories: any[], symbol?: any) => {
      const id = this.toIdString(canonicalProjectId);
      if (!id) return;

      const current = output.get(id) || [];
      const next = this.uniqueStrings([
        ...current,
        ...categories
          .map((item) => this.toDisplayString(item))
          .filter((item) => this.isProjectCategoryLabel(item, symbol)),
      ]);

      output.set(id, next);
    };

    marketProjects.forEach((project) => {
      add(
        project?.canonicalProjectId,
        [
          project?.category,
          ...this.arrayValue(project?.categories),
          project?.niche,
        ],
        project?.symbol,
      );
    });

    icoProjects.forEach((project) => {
      add(
        project?.canonicalProjectId,
        [
          ...this.arrayValue(project?.categories),
          project?.metadata?.category,
          ...this.arrayValue(project?.metadata?.categories),
        ],
        project?.symbol,
      );
    });

    canonicalProjects.forEach((project) => {
      add(
        project?._id,
        [
          project?.metadata?.category,
          project?.metadata?.mainCategory,
          project?.metadata?.mainCategory?.name,
          ...this.arrayValue(project?.metadata?.categories),
        ],
        project?.symbol,
      );
    });

    return output;
  }

  private projectCategoriesForHoldings(
    holdings: any[],
    context: BackerMaterializeContext,
  ): string[] {
    return this.uniqueStrings(
      holdings.flatMap((holding) => {
        const id = this.toIdString(holding?.canonicalProjectId);
        return id ? context.projectCategoriesByCanonicalId.get(id) || [] : [];
      }),
    );
  }

  private isProjectCategoryLabel(value: any, symbol?: any): value is string {
    const label = this.firstString(value);
    if (!label) return false;

    const normalized = this.normalizeKey(label);
    if (!normalized) return false;

    if (EXCLUDED_PROJECT_CATEGORY_KEYS.has(normalized)) return false;

    const symbolKey = this.normalizeKey(symbol);
    if (symbolKey && normalized === symbolKey) return false;

    return true;
  }

  private projectPreview(holdings: any[]): Array<Record<string, any>> {
    return holdings
      .slice()
      .sort((left, right) => {
        if (Boolean(right?.hasMarketData) !== Boolean(left?.hasMarketData)) {
          return Number(Boolean(right?.hasMarketData)) - Number(Boolean(left?.hasMarketData));
        }
        return this.dateNumber(right?.lastRoundDate) - this.dateNumber(left?.lastRoundDate);
      })
      .slice(0, 6)
      .map((holding) =>
        this.cleanObject({
          id: this.toIdString(holding?.canonicalProjectId) || holding?.projectSlug || holding?.projectName,
          name: this.firstString(holding?.projectName, holding?.projectSlug),
          slug: this.firstString(holding?.projectSlug),
          symbol: this.firstString(holding?.projectSymbol),
          logo: this.firstString(holding?.projectLogoUrl),
          image: this.firstString(holding?.projectLogoUrl),
        }),
      )
      .filter((project) => project.name);
  }

  private averageRoi(rounds: any[]): number {
    const values = rounds
      .map((round) => this.toFiniteNumber(round?.roi?.usd ?? round?.roi))
      .filter((value): value is number => value !== undefined && value !== 0);
    if (!values.length) return 0;
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    return this.roundNumber(average);
  }

  private scoreFullness(
    profileCompleteness: number,
    projectsCount: number,
    socialLinksCount: number,
  ): number {
    return Math.min(
      100,
      Math.round(
        profileCompleteness * 0.65 +
          Math.min(projectsCount, 60) * 0.35 +
          Math.min(socialLinksCount, 4) * 3,
      ),
    );
  }

  private scoreRating(input: {
    incoming?: number;
    profileCompleteness: number;
    projectsCount: number;
    leadInvestments: number;
    roi: number;
    hasSocialLinks: boolean;
  }): number {
    if (input.incoming && input.incoming > 0) return Math.round(input.incoming);
    const roiScore = input.roi > 0 ? Math.min(20, Math.log1p(input.roi) * 5) : 0;
    return Math.min(
      100,
      Math.round(
        10 +
          input.profileCompleteness * 0.2 +
          Math.min(input.projectsCount, 120) * 0.25 +
          Math.min(input.leadInvestments, 20) * 0.5 +
          roiScore +
          (input.hasSocialLinks ? 5 : 0),
      ),
    );
  }

  private socialLinks(value: any): Record<string, string> {
    const links = value && typeof value === "object" ? value : {};
    return this.cleanObject({
      website: this.firstString(links.website, links.web, links.site),
      twitter: this.firstString(links.twitter, links.x),
      linkedin: this.firstString(links.linkedin, links.linkedIn),
      telegram: this.firstString(links.telegram, links.tg),
      discord: this.firstString(links.discord),
      medium: this.firstString(links.medium),
      github: this.firstString(links.github),
    }) as Record<string, string>;
  }

  private toSocialMedia(links: Record<string, string>): Array<Record<string, string>> {
    return Object.entries(links)
      .filter(([, href]) => Boolean(href))
      .map(([name, href]) => ({ name, href }));
  }

  private regionData(country?: string): Record<string, any> | undefined {
    const normalized = this.normalizeKey(country);
    if (!normalized) return undefined;
    const map: Record<string, { id: string; name: string; region: string; subregion?: string }> = {
      united_states_of_america: {
        id: "USA",
        name: "United States",
        region: "Americas",
        subregion: "North America",
      },
      united_states: {
        id: "USA",
        name: "United States",
        region: "Americas",
        subregion: "North America",
      },
      china: { id: "CHN", name: "China", region: "Asia", subregion: "Eastern Asia" },
      singapore: { id: "SGP", name: "Singapore", region: "Asia", subregion: "South-eastern Asia" },
      united_kingdom: { id: "GBR", name: "United Kingdom", region: "Europe" },
      switzerland: { id: "CHE", name: "Switzerland", region: "Europe" },
      germany: { id: "DEU", name: "Germany", region: "Europe" },
      hong_kong: { id: "HKG", name: "Hong Kong", region: "Asia", subregion: "Eastern Asia" },
      finland: { id: "FIN", name: "Finland", region: "Europe" },
    };
    const item = map[normalized] || {
      id: country,
      name: country || "",
      region: country || "",
    };
    return {
      id: item.id,
      properties: { name: item.name },
      region: item.region,
      subregion: item.subregion,
      type: "Feature",
    };
  }

  private formatRoiDisplay(value: number): string {
    if (!Number.isFinite(value) || value === 0) return "";
    if (Math.abs(value) <= 20) return `${value.toFixed(2).replace(/\.00$/, "")}x`;
    return `${value > 0 ? "+" : ""}${Math.round(value)}%`;
  }

  private keys(values: any[]): string[] {
    return this.uniqueStrings(values.map((value) => this.normalizeKey(value))).filter(Boolean);
  }

  private searchTokens(values: any[]): string[] {
    return this.uniqueStrings(
      values.flatMap((value) =>
        this.normalizeText(value)
          .split(/[^a-z0-9]+/g)
          .map((token) => token.trim())
          .filter(Boolean),
      ),
    ).slice(0, 300);
  }

  private firstById(items: any[], field: string): Map<string, any> {
    const output = new Map<string, any>();
    for (const item of items) {
      const id = this.toIdString(item?.[field]);
      if (!id || output.has(id)) continue;
      output.set(id, item);
    }
    return output;
  }

  private groupById(items: any[], field: string): Map<string, any[]> {
    const output = new Map<string, any[]>();
    for (const item of items) {
      const id = this.toIdString(item?.[field]);
      if (!id) continue;
      const bucket = output.get(id) || [];
      bucket.push(item);
      output.set(id, bucket);
    }
    return output;
  }

  private uniqueObjectIds(values: any[]): Types.ObjectId[] {
    const output = new Map<string, Types.ObjectId>();
    for (const value of values) {
      const objectId = this.toObjectId(value);
      if (objectId) output.set(objectId.toHexString(), objectId);
    }
    return Array.from(output.values());
  }

  private requiredObjectId(value: any, field: string): Types.ObjectId {
    const objectId = this.toObjectId(value);
    if (!objectId) throw new Error(`Cannot build backer list read model without ${field}.`);
    return objectId;
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    const id = this.toIdString(value);
    if (!Types.ObjectId.isValid(id)) return undefined;
    return new Types.ObjectId(id);
  }

  private toIdString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();
    if (value._id && value._id !== value) return this.toIdString(value._id);
    if (typeof value.toString === "function") return value.toString();
    return "";
  }

  private toFiniteNumber(value: any): number | undefined {
    if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^0-9.-]+/g, ""));
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  private roundNumber(value: any): number {
    const number = this.toFiniteNumber(value);
    return number === undefined ? 0 : Math.round(number * 100) / 100;
  }

  private maxDate(...values: any[]): Date | undefined {
    const dates = values
      .map((value) => this.toDate(value))
      .filter((date): date is Date => Boolean(date));
    if (!dates.length) return undefined;
    return new Date(Math.max(...dates.map((date) => date.getTime())));
  }

  private toDate(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime()) ? date : undefined;
  }

  private dateNumber(value: any): number {
    return this.toDate(value)?.getTime() || 0;
  }

  private firstString(...values: any[]): string | undefined {
    for (const value of values) {
      if (typeof value !== "string" && typeof value !== "number") continue;
      const text = String(value).trim();
      if (text && text !== "[object Object]") return text;
    }
    return undefined;
  }

  private toDisplayString(value: any): string | undefined {
    if (typeof value === "string" || typeof value === "number") {
      return this.firstString(value);
    }
    if (value && typeof value === "object") {
      return this.firstString(value.name, value.label, value.title, value.value);
    }
    return undefined;
  }

  private normalizeKey(value: any): string {
    return this.normalizeText(value)
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  private normalizeText(value: any): string {
    return String(value || "").trim().toLowerCase();
  }

  private uniqueStrings(values: Array<string | undefined>): string[] {
    return Array.from(new Set(values.filter(Boolean) as string[]));
  }

  private arrayValue(value: any): any[] {
    return Array.isArray(value) ? value : [];
  }

  private cleanObject<T extends Record<string, any>>(source: T): Partial<T> {
    const result: Partial<T> = {};
    Object.entries(source).forEach(([key, value]) => {
      if (value === undefined || value === "") return;
      result[key as keyof T] = value as any;
    });
    return result;
  }

  private positiveInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.trunc(parsed);
  }

  private nonNegativeInteger(value: any, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return fallback;
    return Math.trunc(parsed);
  }

  private pushExample<T>(items: T[], item: T, limit: number): void {
    if (items.length >= limit) return;
    items.push(item);
  }
}
