import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilesService } from "src/files/files.service";
import { Model } from "mongoose";
import { CreateFundsDto } from "./dto/create-funds.dto";
import { AddActionDto } from "../actions/dto/add-action.dto";
import { Funds, FundsDocument } from "./funds.model";
import { CommentsService } from "src/comments/comments.service";
import { ActionsService } from "src/actions/actions.service";
import commentDto from "src/comments/dto/comment.dto";
import mongoose from "mongoose";
import { UpdateFundDto } from "./dto/update-fund.dto";
import { User, UserDocument } from "src/user/user.model";
import { Project, ProjectDocument } from "src/projects/project.model";
import { RolesDto } from "src/projects/dto/update-project.dto";
import { InvestmentFilters } from "./funds.controller";
import { ActivityService } from "src/activity/activity.service";
import {
  ProjectTwitter,
  ProjectTwitterDocument,
} from "src/twitter/project-twitter.model";
import { HttpService } from "@nestjs/axios";
import axios from "axios";
import { Investor as InvestorEntity, InvestorDocument } from "src/investors/investor.model";
import { FundsRatingService } from "./funds-rating.service";
import { FomoV2FundingFeedRoundReadModel } from "src/fomo-v2/domains/funding/models";
import { AppCacheService } from "src/common/cache/cache.service";
import { CACHE_TTL_SECONDS } from "src/common/cache/cache.constants";
import { CacheKeys } from "src/common/cache/cache.keys";
import { FundsAnalyticsSnapshotService } from "./funds-analytics-snapshot.service";

export class BinanceListing {
  totalProjects: number;
  listedProjects: number;
  listedPercent: number;
}

export interface Investor {
  id: number;
  investorSlug: string;
  name: string;
  image: string;
  rank: number;
  country: string;
  description: string;
  ventureType: string;
  tier: string;
  twitterScore: number;
  lastRoundDate: string;
  roundsPerYear: number;
  publicSalesCount: number;
  retailRoiPercent: number;
  privateRoiPercent: number;
  totalInvestments: number;
  leadInvestments: number;
  binanceListing: BinanceListing;
  links: Array<Record<string, any>>;
  portfolioCoinsCount: number;
}

type FundsSortBy =
  | "name"
  | "rating"
  | "fullness"
  | "projectsCount"
  | "supportedProjectsCount"
  | "roi"
  | "country"
  | "lastUpdatedAt"
  | "dropstabRank"
  | "foundedDate"
  | "industryFocus";

type FundsSortOrder = "asc" | "desc";

type FundsRecalculateOptions = {
  dryRun?: boolean;
  batchSize?: number;
  limit?: number;
};

type FundDetailOptions = {
  includeRaw?: boolean;
};

type InvestorEnrichmentResult = {
  investor: any | null;
  status: "matched" | "not_found" | "ambiguous";
  matchedBy?: string;
};

type FindFundLinkedProjectsOptions = {
  includeLookupProjects?: boolean;
  includeTokenSupply?: boolean;
  limit?: number;
};

type FundsFundingDynamicsRow = {
  date: Date | string;
  category?: string;
  amount: number;
  keyProjects?: Array<{
    name?: string;
    amount?: number;
    category?: string;
  }>;
};

type FundingBackerIdentity = {
  name?: string;
  slug?: string;
  sourceKey?: string;
  sourceId?: string | number;
};

type FundsFundingDynamicsPoint = {
  name: string;
  date: string;
  periodEnd: string;
  totalInvestment: number;
  categories: string[];
  keyProjects: Array<{
    name: string;
    amount: number;
    category: string;
  }>;
  investments0: number;
  investments1: number;
  investments2: number;
  investments3: number;
  investments4: number;
  investments5: number;
};

@Injectable()
export class FundsService {
  constructor(
    @InjectModel(Funds.name) private fundModel: Model<FundsDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectTwitter.name)
    private projectTwitterModel: Model<ProjectTwitterDocument>,
    @InjectModel(InvestorEntity.name)
    private investorModel: Model<InvestorDocument>,
    @InjectModel(FomoV2FundingFeedRoundReadModel.name)
    private fundingRoundModel: Model<FomoV2FundingFeedRoundReadModel>,
    private readonly filesService: FilesService,
    private readonly commentsService: CommentsService,
    private readonly actionsService: ActionsService,
    private readonly activityService: ActivityService,
    private readonly httpService: HttpService,
    private readonly fundsRatingService: FundsRatingService,
    private readonly fundsAnalyticsSnapshotService: FundsAnalyticsSnapshotService,
    private readonly cacheService: AppCacheService
  ) {}

  private parseArrayToObjectId(
    items: string | undefined
  ): Array<mongoose.Types.ObjectId> {
    if (!items) return [];

    return items
      .split(",")
      .map((id: string) => new mongoose.Types.ObjectId(id));
  }

  private buildFundsQuery(filters: InvestmentFilters = {}): any {
    const query: any = {};
    const andConditions: any[] = [];

    const niche = this.cleanFilterValues(filters.niche);
    if (niche.length) {
      andConditions.push({
        $or: [{ niche: { $in: niche } }, { type: { $in: niche } }],
      });
    }

    const industryFocus = this.cleanFilterValues(filters.industryFocus);
    if (industryFocus.length) {
      andConditions.push({
        $or: [
          { industryFocus: { $in: industryFocus } },
          { categories: { $in: industryFocus } },
          { "roundsByCategory.name": { $in: industryFocus } },
        ],
      });
    }

    const region = this.cleanFilterValues(filters["regionData.region"]);
    if (region.length) {
      andConditions.push({
        $or: [
          { "regionData.region": { $in: region } },
          { "regionData.region.name": { $in: region } },
          { "regionData.region.label": { $in: region } },
          { "regionData.region.value": { $in: region } },
          { "regionData.id": { $in: region } },
          { "regionData.properties.region": { $in: region } },
          { "regionData.properties.name": { $in: region } },
          { country: { $in: region } },
          { countryName: { $in: region } },
          { location: { $in: region } },
        ],
      });
    }

    const country = this.cleanFilterValues((filters as any).country);
    if (country.length) {
      andConditions.push({
        $or: [
          { country: { $in: country } },
          { "regionData.properties.name": { $in: country } },
          { "regionData.id": { $in: country } },
        ],
      });
    }

    const status = this.cleanFilterValues(filters.status);
    if (status.length) {
      andConditions.push({
        status: {
          $in: Array.from(
            new Set([
              ...status,
              ...status.map((item: string) => item.toLowerCase()),
            ]),
          ),
        },
      });
    }

    const investAmountRanges = [
      ...this.parseRangeFilters(filters.investAmount),
      ...this.parseRangeFilters(filters.investAmount_checkboxes),
    ];
    if (investAmountRanges.length) {
      const conditions = investAmountRanges.map(([min, max]) => ({
        investAmount: { $gte: min, $lte: max },
      }));
      andConditions.push({ $or: conditions });
    }

    const roiRanges = this.parseRangeFilters(filters.roi);
    if (roiRanges.length) {
      const conditions = roiRanges.map(([min, max]) => ({
        $or: [
          { tableRoi: { $gte: min, $lte: max } },
          { roi: { $gte: min, $lte: max } },
          { averageRoi: { $gte: min, $lte: max } },
          { privateRoiPercent: { $gte: min, $lte: max } },
          { retailRoiPercent: { $gte: min, $lte: max } },
        ],
      }));
      andConditions.push({ $or: conditions });
    }

    const fomoScoreRanges = this.parseRangeFilters(filters.fomoScore);
    if (fomoScoreRanges.length) {
      const conditions = fomoScoreRanges.map(([min, max]) => ({
        $or: [
          { tableRating: { $gte: min, $lte: max } },
          { fomoScore: { $gte: min, $lte: max } },
          { rating: { $gte: min, $lte: max } },
        ],
      }));
      andConditions.push({ $or: conditions });
    }

    const foundedDateRanges = this.parseRangeFilters(filters.foundedDate);
    if (foundedDateRanges.length) {
      const conditions = foundedDateRanges.map(([startYear, endYear]) => {
        const startDate = new Date(startYear, 0, 1);
        const endDate = new Date(endYear, 11, 31);
        return {
          $or: [
            { foundedDate: { $gte: startDate, $lte: endDate } },
            { foundedYear: { $gte: startYear, $lte: endYear } },
            { founded: { $gte: startYear, $lte: endYear } },
            { yearFounded: { $gte: startYear, $lte: endYear } },
            {
              $expr: {
                $and: [
                  {
                    $gte: [
                      {
                        $convert: {
                          input: "$foundedDate",
                          to: "date",
                          onError: new Date(0),
                          onNull: new Date(0),
                        },
                      },
                      startDate,
                    ],
                  },
                  {
                    $lte: [
                      {
                        $convert: {
                          input: "$foundedDate",
                          to: "date",
                          onError: new Date(0),
                          onNull: new Date(0),
                        },
                      },
                      endDate,
                    ],
                  },
                ],
              },
            },
            {
              $expr: {
                $and: [
                  {
                    $gte: [
                      {
                        $convert: {
                          input: "$foundedDate",
                          to: "int",
                          onError: 0,
                          onNull: 0,
                        },
                      },
                      startYear,
                    ],
                  },
                  {
                    $lte: [
                      {
                        $convert: {
                          input: "$foundedDate",
                          to: "int",
                          onError: 0,
                          onNull: 0,
                        },
                      },
                      endYear,
                    ],
                  },
                ],
              },
            },
          ],
        };
      });
      andConditions.push({ $or: conditions });
    }

    const projectRanges = this.parseRangeFilters(filters.projects);
    if (projectRanges.length) {
      const conditions = projectRanges.map(([min, max]) => ({
        $or: [
          { tableProjectsCount: { $gte: min, $lte: max } },
          { tableSupportedProjectsCount: { $gte: min, $lte: max } },
          { projectsCount: { $gte: min, $lte: max } },
          { supportedProjectsCount: { $gte: min, $lte: max } },
          { totalInvestments: { $gte: min, $lte: max } },
          { numberOfInvestments: { $gte: min, $lte: max } },
          { portfolioCoinsCount: { $gte: min, $lte: max } },
          { "binanceListing.totalProjects": { $gte: min, $lte: max } },
          {
            $expr: {
              $and: [
                { $gte: [{ $size: { $ifNull: ["$supportedProjects", []] } }, min] },
                { $lte: [{ $size: { $ifNull: ["$supportedProjects", []] } }, max] },
              ],
            },
          },
          {
            $expr: {
              $and: [
                { $gte: [{ $size: { $ifNull: ["$supportedProjectsPreview", []] } }, min] },
                { $lte: [{ $size: { $ifNull: ["$supportedProjectsPreview", []] } }, max] },
              ],
            },
          },
          {
            $expr: {
              $and: [
                { $gte: [{ $size: { $ifNull: ["$portfolio", []] } }, min] },
                { $lte: [{ $size: { $ifNull: ["$portfolio", []] } }, max] },
              ],
            },
          },
          {
            $expr: {
              $and: [
                { $gte: [{ $size: { $ifNull: ["$projects", []] } }, min] },
                { $lte: [{ $size: { $ifNull: ["$projects", []] } }, max] },
              ],
            },
          },
        ],
      }));
      andConditions.push({ $or: conditions });
    }

    const search = this.toNonEmptyString((filters as any).search || filters.name);
    if (search) {
      const escapedSearch = this.escapeRegExp(search);
      andConditions.push({
        $or: [
          { name: { $regex: escapedSearch, $options: "i" } },
          { slug: { $regex: escapedSearch, $options: "i" } },
          { sourceKey: { $regex: escapedSearch, $options: "i" } },
        ],
      });
    }

    if (andConditions.length) {
      query.$and = andConditions;
    }

    return query;
  }

  private cleanFilterValues(value: any): string[] {
    const values = Array.isArray(value) ? value : value ? [value] : [];

    return values
      .flatMap((item) => String(item || "").split(","))
      .map((item) => item.trim())
      .filter((item) => item && item.toLowerCase() !== "all");
  }

  private parseRangeFilters(value: any): Array<[number, number]> {
    return this.cleanFilterValues(value)
      .map((range) => {
        const [min, max] = range.split("-").map(Number);
        if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
        return [Math.min(min, max), Math.max(min, max)] as [number, number];
      })
      .filter((item): item is [number, number] => Boolean(item));
  }

  private toNonEmptyString(value: any): string {
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    if (typeof value !== "string") return "";

    return value.trim();
  }

  private toNumber(value: any): number {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[$,%\s]/g, "").replace(/,/g, ""));
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }

  private toOptionalNumber(value: any): number | undefined {
    if (value === null || value === undefined || value === "") return undefined;
    if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[$,%\s]/g, "").replace(/,/g, ""));
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
  }

  private firstFiniteNumber(...values: any[]): number | undefined {
    for (const value of values) {
      const numberValue = this.toOptionalNumber(value);
      if (numberValue !== undefined) return numberValue;
    }

    return undefined;
  }

  private firstPositiveNumber(...values: any[]): number | undefined {
    for (const value of values) {
      const numberValue = this.toOptionalNumber(value);
      if (numberValue !== undefined && numberValue > 0) return numberValue;
    }

    return undefined;
  }

  private roundNumber(value: any): number {
    const numberValue = this.toNumber(value);
    return Math.round(numberValue * 100) / 100;
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private resolveSort(query?: InvestmentFilters): Record<string, 1 | -1> {
    const allowedSortFields: Record<FundsSortBy, string> = {
      name: "name",
      rating: "tableRating",
      fullness: "tableFullness",
      projectsCount: "tableProjectsCount",
      supportedProjectsCount: "tableSupportedProjectsCount",
      roi: "tableRoi",
      country: "tableCountry",
      lastUpdatedAt: "tableLastUpdatedAt",
      dropstabRank: "dropstabRank",
      foundedDate: "foundedDate",
      industryFocus: "industryFocus",
    };
    const requestedSortBy = this.toNonEmptyString((query as any)?.sortBy) as FundsSortBy;
    const sortField = allowedSortFields[requestedSortBy] || "tableRating";
    const sortOrder: 1 | -1 =
      String((query as any)?.sortOrder || "desc").toLowerCase() === "asc" ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    if (sortField !== "tableRating") sort.tableRating = -1;
    if (sortField !== "tableProjectsCount") sort.tableProjectsCount = -1;
    sort.name = 1;

    return sort;
  }

  private buildInvestorLookupStage(): any {
    return {
      $lookup: {
        from: this.investorModel.collection.name,
        let: {
          slug: { $ifNull: ["$slug", ""] },
          sourceKey: { $ifNull: ["$sourceKey", ""] },
          name: { $ifNull: ["$name", ""] },
          normalizedName: {
            $toLower: {
              $trim: { input: { $ifNull: ["$name", ""] } },
            },
          },
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  {
                    $and: [
                      { $ne: ["$$slug", ""] },
                      { $eq: ["$slug", "$$slug"] },
                    ],
                  },
                  {
                    $and: [
                      { $ne: ["$$sourceKey", ""] },
                      { $eq: ["$sourceRefs.key", "$$sourceKey"] },
                    ],
                  },
                  {
                    $and: [
                      { $ne: ["$$sourceKey", ""] },
                      { $eq: ["$sourceId", "$$sourceKey"] },
                    ],
                  },
                  {
                    $and: [
                      { $ne: ["$$normalizedName", ""] },
                      { $eq: ["$normalizedName", "$$normalizedName"] },
                    ],
                  },
                  {
                    $and: [
                      { $ne: ["$$name", ""] },
                      { $eq: ["$name", "$$name"] },
                    ],
                  },
                ],
              },
            },
          },
          { $sort: { lastDetailParsedAt: -1, lastSyncedAt: -1 } },
          { $limit: 1 },
          {
            $project: {
              name: 1,
              slug: 1,
              logo: 1,
              description: 1,
              type: 1,
              category: 1,
              country: 1,
              location: 1,
              website: 1,
              socialLinks: 1,
              stats: 1,
              portfolio: 1,
              fundraisingRounds: 1,
              coInvestors: 1,
              sectors: 1,
              tags: 1,
              source: 1,
              sourceId: 1,
              lastParsedAt: 1,
              lastDetailParsedAt: 1,
              lastSyncedAt: 1,
            },
          },
        ],
        as: "investorDetail",
      },
    };
  }

  private buildInvestorDetailNormalizeStage(): any {
    return {
      $addFields: {
        investorDetail: {
          $cond: [
            { $isArray: "$investorDetail" },
            { $arrayElemAt: ["$investorDetail", 0] },
            "$investorDetail",
          ],
        },
      },
    };
  }

  private buildComputedFieldsStage(): any {
    const toNumber = (input: any) => ({
      $convert: { input, to: "double", onError: 0, onNull: 0 },
    });
    const numericFullness = {
      $convert: {
        input: {
          $replaceAll: {
            input: { $toString: { $ifNull: ["$fullness", "0"] } },
            find: "%",
            replacement: "",
          },
        },
        to: "double",
        onError: 0,
        onNull: 0,
      },
    };

    return {
      $addFields: {
        ratingNumber: {
          $let: {
            vars: {
              values: [
                toNumber("$tableRating"),
                toNumber("$rating"),
                toNumber("$fomoScore"),
                toNumber("$ratingBreakdown.score"),
              ],
            },
            in: {
              $ifNull: [
                {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$$values",
                        as: "value",
                        cond: { $ne: ["$$value", 0] },
                      },
                    },
                    0,
                  ],
                },
                0,
              ],
            },
          },
        },
        fullnessNumber: {
          $let: {
            vars: {
              values: [toNumber("$tableFullness"), numericFullness, toNumber("$fullnessBreakdown.score")],
            },
            in: {
              $ifNull: [
                {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$$values",
                        as: "value",
                        cond: { $ne: ["$$value", 0] },
                      },
                    },
                    0,
                  ],
                },
                0,
              ],
            },
          },
        },
        roiComputed: {
          $let: {
            vars: {
              values: [
                toNumber("$tableRoi"),
                toNumber("$roi"),
                toNumber("$averageRoi"),
                toNumber("$privateRoiPercent"),
                toNumber("$retailRoiPercent"),
              ],
            },
            in: {
              $ifNull: [
                {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: "$$values",
                        as: "value",
                        cond: { $ne: ["$$value", 0] },
                      },
                    },
                    0,
                  ],
                },
                0,
              ],
            },
          },
        },
        projectsCountComputed: {
          $max: [
            toNumber("$tableProjectsCount"),
            toNumber("$projectsCount"),
            toNumber("$supportedProjectsCount"),
            toNumber("$totalInvestments"),
            toNumber("$numberOfInvestments"),
            toNumber("$portfolioCoinsCount"),
            toNumber("$binanceListing.totalProjects"),
            { $size: { $ifNull: ["$projects", []] } },
            { $size: { $ifNull: ["$portfolioCoins", []] } },
          ],
        },
        supportedProjectsCountComputed: {
          $max: [
            toNumber("$tableSupportedProjectsCount"),
            toNumber("$supportedProjectsCount"),
            toNumber("$portfolioCoinsCount"),
            { $size: { $ifNull: ["$projects", []] } },
            { $size: { $ifNull: ["$portfolioCoins", []] } },
          ],
        },
        countryComputed: {
          $ifNull: [
            "$tableCountry",
            {
              $ifNull: [
                "$country",
                {
                  $ifNull: [
                    "$regionData.properties.name",
                    "",
                  ],
                },
              ],
            },
          ],
        },
        lastUpdatedAtComputed: {
          $ifNull: [
            "$tableLastUpdatedAt",
            {
              $ifNull: [
                "$updatedAt",
                {
                  $ifNull: [
                    "$lastRoundDate",
                    {
                      $ifNull: [
                        "$actionDate",
                        "$createdAt",
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    };
  }

  private buildFundsListProjection(): Record<string, any> {
    return {
      _id: 1,
      id: { $toString: "$_id" },
      name: 1,
      slug: 1,
      logo: 1,
      type: 1,
      niche: 1,
      country: "$countryComputed",
      countryFlag: 1,
      rating: "$ratingNumber",
      fomoScore: 1,
      fullness: "$fullnessNumber",
      ratingBreakdown: 1,
      fullnessBreakdown: 1,
      roi: "$roiComputed",
      projectsCount: "$projectsCountComputed",
      supportedProjectsCount: "$supportedProjectsCountComputed",
      supportedProjectsPreview: 1,
      sectors: 1,
      tags: 1,
      socialLinks: 1,
      lastUpdatedAt: "$lastUpdatedAtComputed",
      foundedDate: 1,
      regionData: 1,
      websiteUrl: 1,
      twitterUrl: 1,
      linkedinUrl: 1,
      socialmedia: 1,
      description: 1,
      bio: 1,
      categories: 1,
      totalInvestments: 1,
      numberOfInvestments: 1,
      publicSalesCount: 1,
      twitterScore: 1,
      lastRoundDate: 1,
      lastFunding: 1,
      redFlags: 1,
      redFlagsList: 1,
      redStatus: 1,
      status: 1,
      currentAum: 1,
      investAmount: 1,
      leadInvestments: 1,
      dropstabRank: 1,
      binanceListing: 1,
      portfolioCoinsCount: 1,
    };
  }

  private buildSupportedProjectsPreviewStage(): any {
    return {
      $addFields: {
        supportedProjectsPreview: {
          $map: {
            input: {
              $slice: [
                {
                  $cond: [
                    { $gt: [{ $size: { $ifNull: ["$portfolioCoins", []] } }, 0] },
                    "$portfolioCoins",
            [],
                  ],
                },
                6,
              ],
            },
            as: "project",
            in: {
              id: {
                $toString: {
                  $ifNull: [
                    "$$project.currencyId",
                    {
                      $ifNull: [
                        "$$project.matchedProjectId",
                        {
                          $ifNull: ["$$project.slug", "$$project.name"],
                        },
                      ],
                    },
                  ],
                },
              },
              name: {
                $ifNull: [
                  "$$project.name",
                  {
                    $ifNull: ["$$project.projectName", "$$project.slug"],
                  },
                ],
              },
              slug: {
                $ifNull: ["$$project.slug", "$$project.projectSlug"],
              },
              logo: {
                $ifNull: ["$$project.image", "$$project.logo"],
              },
            },
          },
        },
        sectors: {
          $setUnion: [
            { $ifNull: ["$categories", []] },
            {
              $map: {
                input: { $ifNull: ["$roundsByCategory", []] },
                as: "category",
                in: "$$category.name",
              },
            },
            {
              $cond: [
                { $ne: [{ $ifNull: ["$industryFocus", ""] }, ""] },
                ["$industryFocus"],
                [],
              ],
            },
            [],
          ],
        },
        tags: { $ifNull: ["$investorDetail.tags", []] },
        socialLinks: {
          website: {
            $ifNull: ["$websiteUrl", ""],
          },
          twitter: {
            $ifNull: ["$twitterUrl", ""],
          },
          linkedin: {
            $ifNull: ["$linkedinUrl", ""],
          },
          telegram: "",
        },
      },
    };
  }

  private formatRoiDisplay(value: number): string {
    if (!Number.isFinite(value) || value === 0) return "";
    if (Math.abs(value) <= 20) return `${value.toFixed(2).replace(/\.00$/, "")}x`;
    return `${value > 0 ? "+" : ""}${Math.round(value)}%`;
  }

  private serializeFundListItem(item: any): any {
    const currentRating = this.roundNumber(item.rating);
    const currentFullness = this.roundNumber(item.fullness);
    const shouldCalculateScores = currentRating <= 0 || currentFullness <= 0;
    const calculatedScores = shouldCalculateScores
      ? this.fundsRatingService.calculateBackerScores(item)
      : null;
    const rating = currentRating > 0 ? currentRating : this.roundNumber(calculatedScores?.rating);
    const fullness = currentFullness > 0 ? currentFullness : this.roundNumber(calculatedScores?.fullness);
    const roi = Number(item.roi || 0);
    const supportedProjectsPreview = Array.isArray(item.supportedProjectsPreview)
      ? item.supportedProjectsPreview.filter((project: any) => project?.name)
      : [];

    const country = this.toDisplayString(
      this.firstNonEmpty(
        item.country,
        item.countryName,
        item.regionData?.properties?.name,
        item.regionData?.region,
        item.regionData?.id,
      ),
    );
    const regionData =
      item.regionData && typeof item.regionData === "object"
        ? {
            ...item.regionData,
            region: this.toDisplayString(item.regionData.region),
            id: this.toDisplayString(item.regionData.id),
            properties: {
              ...(item.regionData.properties || {}),
              name: this.toDisplayString(item.regionData.properties?.name),
            },
          }
        : item.regionData;

    return {
      _id: item._id,
      id: String(item._id || item.id),
      name: item.name,
      slug: item.slug,
      logo: item.logo,
      type: item.type,
      niche: item.niche,
      country,
      countryFlag: item.countryFlag,
      regionData,
      foundedDate: item.foundedDate,
      lastUpdatedAt: item.lastUpdatedAt,
      sectors: item.sectors,
      tags: item.tags,
      websiteUrl: item.websiteUrl,
      twitterUrl: item.twitterUrl,
      linkedinUrl: item.linkedinUrl,
      socialmedia: item.socialmedia,
      dropstabRank: item.dropstabRank,
      binanceListing: item.binanceListing,
      portfolioCoinsCount: item.portfolioCoinsCount,
      ratingBreakdown: item.ratingBreakdown || calculatedScores?.ratingBreakdown,
      fullnessBreakdown: item.fullnessBreakdown || calculatedScores?.fullnessBreakdown,
      fomoScore: item.fomoScore,
      rating,
      fullness,
      roi: this.roundNumber(roi),
      roiDisplay: this.formatRoiDisplay(roi),
      projectsCount: Math.round(Number(item.projectsCount || 0)),
      supportedProjectsCount: Math.round(Number(item.supportedProjectsCount || 0)),
      supportedProjectsPreview,
      socialLinks: {
        ...(item.socialLinks || {}),
        website: item.socialLinks?.website || item.websiteUrl || item.website?.[0],
        twitter: item.socialLinks?.twitter || item.twitterUrl,
        linkedin: item.socialLinks?.linkedin || item.linkedinUrl,
      },
    };
  }

  private buildFundDetailQuery(id: string): Record<string, any> {
    const identifier = this.toNonEmptyString(id);
    const or: any[] = [];

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      or.push({ _id: new mongoose.Types.ObjectId(identifier) });
    }

    if (identifier) {
      or.push(
        { slug: identifier },
        { sourceKey: identifier },
        { sourceId: identifier },
        { fundId: identifier },
      );
    }

    const numericIdentifier = Number(identifier);
    if (Number.isFinite(numericIdentifier)) {
      or.push({ dropstabId: numericIdentifier }, { fundId: numericIdentifier });
    }

    return or.length ? { $or: or } : { _id: null };
  }

  private buildFundDetailProjection(includeRaw?: boolean): Record<string, any> {
    if (includeRaw) return {};

    return {
      raw: 0,
      rawDetailData: 0,
      rawTableData: 0,
      "intelInvestorData.raw": 0,
    };
  }

  private async findFundDetailDocument(
    id: string,
    includeRaw?: boolean,
  ): Promise<any | null> {
    const identifier = this.toNonEmptyString(id);
    const projection = this.buildFundDetailProjection(includeRaw);

    if (!identifier) return null;

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      const fundByObjectId = await this.fundModel
        .findById(identifier, projection)
        .lean();

      if (fundByObjectId) return fundByObjectId;
    }

    const exactStringQueries = [
      { slug: identifier },
      { sourceKey: identifier },
      { sourceId: identifier },
      { fundId: identifier },
    ];

    for (const query of exactStringQueries) {
      const fund = await this.fundModel.findOne(query, projection).lean();
      if (fund) return fund;
    }

    const numericIdentifier = Number(identifier);
    if (Number.isFinite(numericIdentifier)) {
      const exactNumericQueries = [
        { dropstabId: numericIdentifier },
        { fundId: numericIdentifier },
      ];

      for (const query of exactNumericQueries) {
        const fund = await this.fundModel.findOne(query, projection).lean();
        if (fund) return fund;
      }
    }

    return null;
  }

  private buildInvestorDetailProjection(includeRaw?: boolean): Record<string, any> {
    if (includeRaw) return {};

    return {
      raw: 0,
      rawDetailData: 0,
      rawTableData: 0,
    };
  }

  private async findInvestorDetailForFundDetail(
    fund: any,
    includeRaw?: boolean,
  ): Promise<InvestorEnrichmentResult> {
    const projection = this.buildInvestorDetailProjection(includeRaw);
    const strongOr: any[] = [];

    if (fund?.slug) strongOr.push({ slug: fund.slug });
    if (fund?.sourceKey) {
      strongOr.push(
        { "sourceRefs.key": fund.sourceKey },
        { sourceId: fund.sourceKey },
      );
    }
    if (fund?.dropstabId) strongOr.push({ sourceId: String(fund.dropstabId) });

    const website = this.normalizeExternalUrl(
      fund?.websiteUrl || fund?.website?.[0],
      true,
    );
    if (website) {
      strongOr.push(
        { website },
        { "socialLinks.website": website },
      );
    }

    if (strongOr.length) {
      const matches = await this.investorModel
        .find({ $or: strongOr }, projection)
        .sort({ lastDetailParsedAt: -1, lastSyncedAt: -1 })
        .limit(2)
        .lean();

      if (matches.length) {
        return {
          investor: matches[0],
          status: "matched",
          matchedBy: "slug/source/website",
        };
      }
    }

    const normalizedName = fund?.name ? this.normalizeName(fund.name) : "";
    const nameOr: any[] = [];
    if (normalizedName) nameOr.push({ normalizedName });
    if (fund?.name) nameOr.push({ name: fund.name });

    if (!nameOr.length) {
      return { investor: null, status: "not_found" };
    }

    const nameMatches = await this.investorModel
      .find({ $or: nameOr }, projection)
      .sort({ lastDetailParsedAt: -1, lastSyncedAt: -1 })
      .limit(2)
      .lean();

    if (nameMatches.length === 1) {
      return {
        investor: nameMatches[0],
        status: "matched",
        matchedBy: "name",
      };
    }

    if (nameMatches.length > 1) {
      return { investor: null, status: "ambiguous", matchedBy: "name" };
    }

    return { investor: null, status: "not_found" };
  }

  private arrayValue(value: any): any[] {
    return Array.isArray(value) ? value : [];
  }

  private firstNonEmpty(...values: any[]): any {
    return values.find((value) => this.hasMeaningfulValue(value));
  }

  private hasMeaningfulValue(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === "number") return Number.isFinite(value) && value !== 0;
    if (typeof value === "boolean") return true;
    if (typeof value === "string") {
      const normalized = value.trim();
      return Boolean(normalized && normalized !== "0" && normalized !== "-");
    }
    if (value instanceof Date) return !Number.isNaN(value.getTime());
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;

    return true;
  }

  private normalizeExternalUrl(value: any, allowBareDomain = false): string {
    const rawValue = this.toNonEmptyString(value);
    if (!rawValue) return "";

    if (/^(javascript|data|vbscript):/i.test(rawValue)) return "";
    if (/^https?:\/\//i.test(rawValue)) return rawValue;
    if (allowBareDomain && /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(rawValue)) {
      return `https://${rawValue}`;
    }

    return "";
  }

  private toDisplayString(value: any): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "object") {
      return this.toDisplayString(value.name || value.label || value.title || value.value);
    }

    const normalized = String(value).trim();
    if (!normalized || normalized === "[object Object]") return "";
    return normalized;
  }

  private uniqueStrings(values: any[], limit = 50): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const value of values) {
      const item = this.toDisplayString(value);
      if (!item) continue;
      const key = item.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(item);
      if (result.length >= limit) break;
    }

    return result;
  }

  private socialLinksFromArray(items: any[]): Record<string, string> {
    return items.reduce((acc, item) => {
      const key = this.toDisplayString(item?.name || item?.key || item?.type)
        .toLowerCase()
        .replace(/\s+/g, "");
      const href = this.normalizeExternalUrl(
        item?.href || item?.url || item?.link,
        key === "website",
      );

      if (key && href) acc[key] = href;
      return acc;
    }, {} as Record<string, string>);
  }

  private normalizeSocialLinks(fund: any, investor: any): Record<string, string> {
    const fromSocialMedia = this.socialLinksFromArray(this.arrayValue(fund?.socialmedia));
    const investorLinks = investor?.socialLinks || {};
    const directLinks = {
      website:
        fund?.websiteUrl ||
        fund?.website?.[0] ||
        investor?.website ||
        investorLinks.website,
      twitter: fund?.twitterUrl || investorLinks.twitter || fromSocialMedia.twitter,
      linkedin: fund?.linkedinUrl || investorLinks.linkedin || fromSocialMedia.linkedin,
      telegram: investorLinks.telegram || fromSocialMedia.telegram,
      discord: investorLinks.discord || fromSocialMedia.discord,
      medium: investorLinks.medium || fromSocialMedia.medium,
      github: investorLinks.github || fromSocialMedia.github,
      crunchbase: fund?.crunchbaseUrl || investorLinks.crunchbase || fromSocialMedia.crunchbase,
    };
    const merged = {
      ...investorLinks,
      ...fromSocialMedia,
      ...directLinks,
    };
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(merged)) {
      const normalized = this.normalizeExternalUrl(value, key === "website");
      if (normalized) result[key] = normalized;
    }

    return result;
  }

  private socialmediaFromLinks(socialLinks: Record<string, string>): Array<{ name: string; href: string }> {
    return Object.entries(socialLinks)
      .filter(([, href]) => Boolean(href))
      .map(([name, href]) => ({ name, href }));
  }

  private serializeSupportedProject(item: any, source = "portfolio"): any | null {
    const name = this.firstNonEmpty(item?.name, item?.projectName, item?.title);
    if (!name) return null;

    const slug = this.firstNonEmpty(item?.slug, item?.projectSlug);
    const logo = this.firstNonEmpty(
      item?.logo,
      item?.image,
      item?.metadataLogo,
      item?.projectLogo,
    );
    const amount = this.firstNonEmpty(
      item?.amount,
      item?.fundsRaised,
      item?.totalRaised,
      item?.investedAmount,
    );
    const roundDate = this.firstNonEmpty(
      item?.date,
      item?.roundDate,
      item?.lastRoundDate,
      item?.lastFunding,
    );

    return {
      id: this.toDisplayString(
        item?._id ||
          item?.id ||
          item?.matchedProjectId ||
          item?.currencyId ||
          slug ||
          name,
      ),
      name: this.toDisplayString(name),
      slug: this.toDisplayString(slug),
      logo: this.toDisplayString(logo),
      image: this.toDisplayString(item?.image || logo),
      symbol: this.toDisplayString(item?.symbol || item?.ticker),
      category: this.toDisplayString(item?.category || item?.sector || item?.niche),
      stage: this.toDisplayString(item?.stage || item?.round || item?.investedRound),
      roundDate,
      amount: this.roundNumber(amount),
      roi: this.roundNumber(this.firstNonEmpty(item?.roi, item?.currentRoi, item?.roiUsd)),
      price: this.roundNumber(
        this.firstNonEmpty(
          item?.price,
          item?.currentPrice,
          item?.priceUsd,
          item?.usdQuote?.price,
          item?.roiData?.currentPrice,
        ),
      ),
      circulatingSupply: this.toOptionalNumber(
        this.firstFiniteNumber(
          item?.circulatingSupply,
          item?.tokenMetrics?.circulatingSupply,
          item?.tokenomics?.circulatingSupply,
          item?.unlockedSupply,
          item?.totalTokensUnlockedAmount,
        ),
      ),
      totalSupply: this.toOptionalNumber(
        this.firstFiniteNumber(
          item?.totalSupply,
          item?.tokenMetrics?.totalSupply,
          item?.tokenomics?.totalSupply,
          item?.maxSupply,
        ),
      ),
      maxSupply: this.toOptionalNumber(item?.maxSupply),
      unlockedSupply: this.toOptionalNumber(item?.unlockedSupply),
      totalTokensUnlockedAmount: this.toOptionalNumber(item?.totalTokensUnlockedAmount),
      status: this.toDisplayString(item?.status || item?.projectStatus),
      source,
    };
  }

  private serializeLinkedProject(project: any): any | null {
    if (!project?.name) return null;

    return this.serializeSupportedProject(
      {
        _id: project._id,
        name: project.name,
        slug: project.slug,
        logo: project.logo || project.image || project.metadataLogo,
        symbol: project.symbol || project.ticker,
        category: project.sector || project.niche || project.categories?.[0],
        stage: project.stage || project.round,
        roundDate: project.lastFunding,
        amount: project.fundsRaised || project.totalRaised,
        roi: project.roiData?.roi || project.xfromIco?.USD,
        price: project.price || project.usdQuote?.price || project.roiData?.currentPrice,
        circulatingSupply: project.circulatingSupply,
        totalSupply: project.totalSupply,
        maxSupply: project.maxSupply,
        tokenMetrics: project.tokenMetrics,
        tokenomics: project.tokenomics,
        unlockedSupply: project.unlockedSupply,
        totalTokensUnlockedAmount: project.totalTokensUnlockedAmount,
        status: project.status || project.projectStatus,
      },
      "linkedProject",
    );
  }

  private uniqueProjects(projects: any[], limit = 200): any[] {
    const seen = new Set<string>();
    const result: any[] = [];

    for (const project of projects) {
      if (!project?.name) continue;
      const key = String(project.slug || project.id || project.name).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(project);
      if (result.length >= limit) break;
    }

    return result;
  }

  private normalizeProjectLookupKey(value: any): string {
    return this.toDisplayString(value).trim().toLowerCase();
  }

  private getProjectLookupKeys(project: any): string[] {
    return [
      project?._id,
      project?.id,
      project?.matchedProjectId,
      project?.currencyId,
      project?.slug,
      project?.projectSlug,
      project?.sourceId,
      project?.name,
      project?.projectName,
      project?.title,
    ]
      .map((value) => this.normalizeProjectLookupKey(value))
      .filter(Boolean);
  }

  private buildProjectDetailsLookup(projects: any[]): Map<string, any> {
    const lookup = new Map<string, any>();

    projects.forEach((project) => {
      this.getProjectLookupKeys(project).forEach((key) => lookup.set(key, project));
    });

    return lookup;
  }

  private getProjectPrimaryKey(project: any): string {
    return (
      this.normalizeProjectLookupKey(
        project?.slug ||
          project?.projectSlug ||
          project?._id ||
          project?.id ||
          project?.matchedProjectId ||
          project?.currencyId ||
          project?.name ||
          project?.projectName,
      ) || ""
    );
  }

  private buildSupportedProjects(fund: any, investor: any, linkedProjects: any[]): any[] {
    const fromPortfolioCoins = this.arrayValue(fund?.portfolioCoins)
      .map((item) => this.serializeSupportedProject(item, "fund.portfolioCoins"))
      .filter(Boolean);
    const fromInvestorPortfolio = this.arrayValue(investor?.portfolio)
      .map((item) => this.serializeSupportedProject(item, "investor.portfolio"))
      .filter(Boolean);
    const fromLinkedProjects = this.arrayValue(linkedProjects)
      .map((item) => this.serializeLinkedProject(item))
      .filter(Boolean);
    const fromRounds = this.arrayValue(investor?.fundraisingRounds)
      .map((item) =>
        this.serializeSupportedProject(
          {
            name: item?.projectName || item?.name,
            slug: item?.projectSlug || item?.slug,
            logo: item?.projectLogo || item?.logo,
            category: item?.category,
            stage: item?.round || item?.stage,
            date: item?.date,
            amount: item?.amount,
            roi: this.firstNonEmpty(item?.roi, item?.currentRoi, item?.roiUsd, item?.usdRoi),
          },
          "investor.fundraisingRounds",
        ),
      )
      .filter(Boolean);

    return this.uniqueProjects([
      ...fromPortfolioCoins,
      ...fromInvestorPortfolio,
      ...fromLinkedProjects,
      ...fromRounds,
    ]);
  }

  private collectProjectLookupValues(fund: any, investor: any): {
    ids: mongoose.Types.ObjectId[];
    slugs: string[];
    names: string[];
  } {
    const ids = new Set<string>();
    const slugs = new Set<string>();
    const names = new Set<string>();
    const addProject = (item: any) => {
      if (!item) return;

      const project = item.project || item;
      const id = this.toDisplayString(
        project?._id || project?.id || project?.matchedProjectId || project?.currencyId,
      );
      const slug = this.toDisplayString(project?.slug || project?.projectSlug);
      const name = this.toDisplayString(
        project?.name || project?.projectName || project?.title,
      );

      if (id && mongoose.Types.ObjectId.isValid(id)) ids.add(id);
      if (slug) slugs.add(slug);
      if (name) names.add(name);
    };

    [
      ...this.arrayValue(fund?.portfolioCoins),
      ...this.arrayValue(fund?.supportedProjects),
      ...this.arrayValue(fund?.investmentPorfolio),
      ...this.arrayValue(investor?.portfolio),
      ...this.arrayValue(investor?.portfolioProjects),
      ...this.arrayValue(investor?.projects),
      ...this.arrayValue(investor?.fundraisingRounds),
    ].forEach(addProject);

    return {
      ids: Array.from(ids)
        .slice(0, 250)
        .map((id) => new mongoose.Types.ObjectId(id)),
      slugs: Array.from(slugs).slice(0, 250),
      names: Array.from(names).slice(0, 250),
    };
  }

  private buildLinkedProjectProjection(includeTokenSupply = false): Record<string, number> {
    const projection: Record<string, number> = {
      name: 1,
      slug: 1,
      logo: 1,
      image: 1,
      metadataLogo: 1,
      symbol: 1,
      ticker: 1,
      categories: 1,
      niche: 1,
      sector: 1,
      stage: 1,
      round: 1,
      lastFunding: 1,
      fundsRaised: 1,
      totalRaised: 1,
      roiData: 1,
      xfromIco: 1,
      rating: 1,
      status: 1,
      projectStatus: 1,
    };

    if (!includeTokenSupply) return projection;

    return {
      ...projection,
      circulatingSupply: 1,
      totalSupply: 1,
      maxSupply: 1,
      tokenMetrics: 1,
      tokenomics: 1,
      unlockedSupply: 1,
      totalTokensUnlockedAmount: 1,
    };
  }

  private async findFundLinkedProjects(
    fund: any,
    investor: any,
    options: FindFundLinkedProjectsOptions = {},
  ): Promise<any[]> {
    const orConditions: any[] = [{ investors: fund._id }];
    const {
      includeLookupProjects = false,
      includeTokenSupply = false,
      limit = includeLookupProjects ? 300 : 200,
    } = options;

    if (includeLookupProjects) {
      const lookupValues = this.collectProjectLookupValues(fund, investor);

      if (lookupValues.ids.length) orConditions.push({ _id: { $in: lookupValues.ids } });
      if (lookupValues.slugs.length) orConditions.push({ slug: { $in: lookupValues.slugs } });
      if (lookupValues.names.length) orConditions.push({ name: { $in: lookupValues.names } });
    }

    return this.projectModel
      .find(
        {
          projectStatus: "active",
          $or: orConditions,
        },
        this.buildLinkedProjectProjection(includeTokenSupply),
      )
      .limit(limit)
      .lean();
  }

  private buildFundraisingRounds(investor: any, supportedProjects: any[]): any[] {
    const projectsBySlug = new Map<string, any>();
    const projectsByName = new Map<string, any>();

    for (const project of supportedProjects) {
      if (project.slug) projectsBySlug.set(String(project.slug).toLowerCase(), project);
      if (project.name) projectsByName.set(String(project.name).toLowerCase(), project);
    }

    return this.arrayValue(investor?.fundraisingRounds)
      .map((round: any, index: number) => {
        const projectName = this.toDisplayString(round?.projectName || round?.name);
        const projectSlug = this.toDisplayString(round?.projectSlug || round?.slug);
        const project =
          (projectSlug && projectsBySlug.get(projectSlug.toLowerCase())) ||
          (projectName && projectsByName.get(projectName.toLowerCase())) ||
          null;
        const roundName = this.toDisplayString(round?.round || round?.roundName || round?.stage);
        const endDate = this.firstNonEmpty(
          round?.endDate,
          round?.dateEnd,
          round?.endsAt,
          round?.date?.endDate?.normalized,
          round?.date?.endDate,
          round?.date,
        );
        const roundRoi = this.roundNumber(
          this.firstNonEmpty(
            round?.roi,
            round?.currentRoi,
            round?.roiUsd,
            round?.usdRoi,
            round?.roiData?.roi,
            round?.xfromIco?.USD,
            project?.roi,
            project?.currentRoi,
            project?.roiUsd,
            project?.roiData?.roi,
            project?.xfromIco?.USD,
          ),
        );

        return {
          id: this.toDisplayString(round?._id || round?.id || `${projectSlug || projectName}-${index}`),
          projectName,
          projectSlug,
          projectLogo: this.toDisplayString(round?.projectLogo || round?.logo || project?.logo),
          category: this.toDisplayString(round?.category || round?.projectCategory || project?.category),
          projectCategory: this.toDisplayString(project?.category || project?.niche),
          roundName,
          stage: this.toDisplayString(round?.stage || roundName),
          date: round?.date,
          endDate,
          amount: this.roundNumber(round?.amount),
          roi: roundRoi,
          valuation: this.roundNumber(round?.valuation),
          status: this.normalizeFundraisingRoundStatus(round, endDate),
          leadInvestors: round?.isLead ? [projectName].filter(Boolean) : [],
          coInvestors: this.arrayValue(round?.investors),
        };
      })
      .filter((round) => round.projectName || round.roundName)
      .slice(0, 100);
  }

  private normalizeFundraisingRoundStatus(round: any, endDate?: any): "Active" | "Ended" {
    const normalizedStatus = this.toDisplayString(
      this.firstNonEmpty(round?.status, round?.roundStatus),
    ).toLowerCase();

    if (["ended", "closed", "complete", "completed", "finished"].includes(normalizedStatus)) return "Ended";
    if (["active", "open", "ongoing", "live"].includes(normalizedStatus)) return "Active";

    const date = this.toValidDate(endDate || round?.date);
    if (!date) return "Active";

    return date.getTime() <= Date.now() ? "Ended" : "Active";
  }

  private normalizeCoInvestors(fund: any, investor: any): any[] {
    const fundCoInvestors = this.arrayValue(fund?.coInvestors).map((item: any) => ({
      id: this.toDisplayString(item?._id || item?.id || item?.investorSlug || item?.slug),
      name: this.toDisplayString(item?.name),
      slug: this.toDisplayString(item?.slug || item?.investorSlug),
      logo: this.toDisplayString(item?.logo || item?.image),
      type: this.toDisplayString(item?.type || item?.ventureType),
      dealsCount: this.toNumber(item?.count || item?.investmentsCount),
      lastRoundDate: item?.lastRoundDate || item?.latestRound,
    }));
    const investorCoInvestors = this.arrayValue(investor?.coInvestors).map((item: any) => ({
      id: this.toDisplayString(item?._id || item?.id || item?.sourceId || item?.slug),
      name: this.toDisplayString(item?.name),
      slug: this.toDisplayString(item?.slug || item?.investorSlug),
      logo: this.toDisplayString(item?.logo || item?.image),
      type: this.toDisplayString(item?.type || item?.ventureType),
      dealsCount: this.toNumber(item?.investmentsCount || item?.count),
      lastRoundDate: item?.latestRound || item?.lastRoundDate,
    }));
    const seen = new Set<string>();
    const result: any[] = [];

    for (const item of [...fundCoInvestors, ...investorCoInvestors]) {
      if (!item.name) continue;
      const key = String(item.slug || item.name).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(item);
      if (result.length >= 100) break;
    }

    return result;
  }

  private median(values: number[]): number {
    const sortedValues = values
      .filter((value) => Number.isFinite(value) && value > 0)
      .sort((a, b) => a - b);
    if (!sortedValues.length) return 0;
    const middle = Math.floor(sortedValues.length / 2);

    if (sortedValues.length % 2) return sortedValues[middle];
    return (sortedValues[middle - 1] + sortedValues[middle]) / 2;
  }

  private latestDate(...values: any[]): any {
    const dates = values
      .flat()
      .map((value) => {
        if (!value) return null;
        const date = value instanceof Date ? value : new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
      })
      .filter(Boolean) as Date[];

    if (!dates.length) return undefined;

    return new Date(Math.max(...dates.map((date) => date.getTime())));
  }

  private toValidDate(value: any): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private buildStats(
    fund: any,
    investor: any,
    supportedProjects: any[],
    fundraisingRounds: any[],
    coInvestors: any[],
  ): any {
    const roundAmounts = fundraisingRounds
      .map((round) => this.toNumber(round.amount))
      .filter((value) => value > 0);
    const averageRoundSize = roundAmounts.length
      ? roundAmounts.reduce((sum, value) => sum + value, 0) / roundAmounts.length
      : 0;
    const totalInvestments = Math.max(
      this.toNumber(fund?.totalInvestments),
      this.toNumber(fund?.numberOfInvestments),
      this.toNumber(investor?.stats?.totalInvestments),
      supportedProjects.length,
    );

    return {
      totalInvestments,
      leadInvestments: this.toNumber(fund?.leadInvestments || investor?.stats?.leadInvestments),
      coInvestments: coInvestors.length,
      exits: Math.max(
        this.toNumber(fund?.recentExits?.length),
        this.toNumber(investor?.stats?.exits),
      ),
      unicorns: this.toNumber(investor?.stats?.unicorns),
      averageRoundSize: this.roundNumber(averageRoundSize),
      medianRoundSize: this.roundNumber(this.median(roundAmounts)),
      lastInvestmentDate: this.latestDate(
        fund?.lastRoundDate,
        fund?.lastFunding,
        investor?.lastDetailParsedAt,
        supportedProjects.map((project) => project.roundDate),
        fundraisingRounds.map((round) => round.date),
      ),
      portfolioProjects: supportedProjects.length,
      totalInvestedAmount: this.roundNumber(
        this.firstNonEmpty(fund?.totalInvested, fund?.investAmount, fund?.currentAum),
      ),
    };
  }

  private buildLegacyInvestmentPortfolio(supportedProjects: any[]): any[] {
    return supportedProjects.slice(0, 100).map((project, index) => ({
      id: index + 1,
      project: {
        _id: project.id,
        name: project.name,
        logo: project.logo || project.image,
        niche: project.category || project.stage || "",
        status: project.status || "Active",
      },
      investedRound: project.stage || "-",
      investedAmount: this.toNumber(project.amount),
      currentRoi: this.toNumber(project.roi),
      status: /exit/i.test(project.status || "") ? "Exit" : "Active",
      exitDate: project.exitDate || "",
      exitRoi: this.toNumber(project.exitRoi),
    }));
  }

  private buildProjectInvestmentPortfolio(supportedProjects: any[], fundraisingRounds: any[]): any[] {
    return supportedProjects.slice(0, 100).map((project, index) => {
      const recentRound = this.findRecentFundraisingRound(project, fundraisingRounds);

      return {
        id: index + 1,
        project: {
          _id: project.id || project.slug,
          name: project.name,
          logo: project.logo || project.image,
          niche: project.category || project.stage || "",
          price: this.toNumber(project.price),
          status: project.status || "Active",
        },
        investedRound: recentRound?.roundName || recentRound?.stage || project.stage || "-",
        investedAmount: this.toNumber(recentRound?.amount),
        currentRoi: this.toNumber(project.roi),
        status: recentRound
          ? this.normalizeFundraisingRoundStatus(recentRound, recentRound.endDate || recentRound.date)
          : "Active",
        exitDate: recentRound?.endDate || recentRound?.date || "",
      };
    }).filter((item) => item.project.name);
  }

  private findRecentFundraisingRound(project: any, fundraisingRounds: any[]): any | null {
    const projectSlug = this.toDisplayString(project?.slug || project?.projectSlug).toLowerCase();
    const projectName = this.toDisplayString(project?.name || project?.projectName).toLowerCase();

    const matchedRounds = fundraisingRounds.filter((round) => {
      const roundSlug = this.toDisplayString(round?.projectSlug || round?.slug).toLowerCase();
      const roundName = this.toDisplayString(round?.projectName || round?.name).toLowerCase();

      return (
        Boolean(projectSlug && roundSlug && projectSlug === roundSlug) ||
        Boolean(projectName && roundName && projectName === roundName)
      );
    });

    if (!matchedRounds.length) return null;

    return matchedRounds.sort((left, right) => {
      const leftTime = this.fundraisingRoundTimestamp(left);
      const rightTime = this.fundraisingRoundTimestamp(right);
      return rightTime - leftTime;
    })[0];
  }

  private fundraisingRoundTimestamp(round: any): number {
    const date = this.toValidDate(round?.endDate || round?.date);
    return date?.getTime() || 0;
  }

  private getDistributionProjectCategory(project: any): string {
    const categories = this.arrayValue(project?.categories)
      .map((item) => this.toDisplayString(item))
      .filter(Boolean);

    return (
      categories[0] ||
      this.toDisplayString(
        project?.category ||
          project?.sector ||
          project?.niche ||
          project?.stage ||
          project?.round,
      ) ||
      "Other"
    );
  }

  private getDistributionProjectTotalSupply(project: any): number | undefined {
    return this.firstPositiveNumber(
      project?.totalSupply,
      project?.tokenMetrics?.totalSupply,
      project?.tokenomics?.totalSupply,
      project?.tokenomics?.supply?.totalSupply,
      project?.rawIcoData?.tokenomics?.supply?.totalSupply,
      project?.maxSupply,
    );
  }

  private getDistributionProjectUnlockedSupply(project: any): number | undefined {
    return this.firstPositiveNumber(
      project?.circulatingSupply,
      project?.tokenMetrics?.circulatingSupply,
      project?.tokenomics?.circulatingSupply,
      project?.tokenomics?.supply?.circulatingSupply,
      project?.rawIcoData?.tokenomics?.supply?.circulatingSupply,
      project?.unlockedSupply,
      project?.totalTokensUnlockedAmount,
    );
  }

  private mergeDistributionProjects(projects: any[], linkedProjects: any[]): any[] {
    const detailsLookup = this.buildProjectDetailsLookup(linkedProjects);
    const merged = new Map<string, any>();

    projects.filter(Boolean).forEach((project) => {
      const projectDetails = this.getProjectLookupKeys(project)
        .map((key) => detailsLookup.get(key))
        .find(Boolean);
      const hydratedProject = projectDetails ? { ...project, ...projectDetails } : project;
      const key = this.getProjectPrimaryKey(hydratedProject);

      if (!key) return;

      merged.set(key, {
        ...(merged.get(key) || {}),
        ...hydratedProject,
      });
    });

    return Array.from(merged.values());
  }

  private buildLockedUnlockedDistribution(
    fund: any,
    supportedProjects: any[],
    linkedProjects: any[],
  ): any[] {
    const sourceProjects = this.mergeDistributionProjects(
      [
        ...this.arrayValue(fund?.investmentPorfolio).map((item) => item?.project),
        ...supportedProjects,
        ...this.arrayValue(fund?.supportedProjects),
        ...this.arrayValue(fund?.portfolioCoins),
        ...linkedProjects,
      ],
      linkedProjects,
    );
    const grouped = new Map<string, any>();

    sourceProjects.forEach((project) => {
      const totalSupply = this.getDistributionProjectTotalSupply(project);
      const unlockedSupply = this.getDistributionProjectUnlockedSupply(project);

      if (!totalSupply || totalSupply <= 0 || !unlockedSupply || unlockedSupply < 0) {
        return;
      }

      const unlocked = Math.min(unlockedSupply, totalSupply);
      const locked = Math.max(totalSupply - unlocked, 0);
      const category = this.getDistributionProjectCategory(project);
      const symbol = this.toDisplayString(project?.symbol || project?.ticker || project?.niche) || "TKN";
      const existing =
        grouped.get(category) ||
        ({
          name: category,
          locked: 0,
          unlocked: 0,
          symbol,
          items: [],
        } as any);

      existing.locked += locked;
      existing.unlocked += unlocked;
      existing.items = [
        ...(existing.items || []),
        {
          logo: this.toDisplayString(project?.logo || project?.image || project?.metadataLogo),
          name: this.toDisplayString(project?.name || project?.projectName) || "-",
          nich: this.getDistributionProjectCategory(project),
          locked,
          unlocked,
          symbol,
        },
      ];
      grouped.set(category, existing);
    });

    return Array.from(grouped.values())
      .map((item) => ({
        ...item,
        locked: this.roundNumber(item.locked),
        unlocked: this.roundNumber(item.unlocked),
        items: this.arrayValue(item.items)
          .sort((left, right) => {
            return right.locked + right.unlocked - (left.locked + left.unlocked);
          })
          .map((project) => ({
            ...project,
            locked: this.roundNumber(project.locked),
            unlocked: this.roundNumber(project.unlocked),
          })),
      }))
      .sort((left, right) => {
        return right.locked + right.unlocked - (left.locked + left.unlocked);
      })
      .slice(0, 5);
  }

  private buildLegacyActivities(fund: any, fundraisingRounds: any[]): any[] {
    if (this.arrayValue(fund?.activities).length) return fund.activities;

    return fundraisingRounds.slice(0, 10).map((round, index) => ({
      id: round.id || `${round.projectSlug || round.projectName}-${index}`,
      project: {
        _id: round.projectSlug,
        name: round.projectName,
        logo: round.projectLogo,
        niche: round.stage || round.roundName || "",
      },
      description: "",
      round: round.roundName || round.stage || "",
      date: round.date || new Date(),
    }));
  }

  private serializeFundDetail(
    fund: any,
    enrichment: InvestorEnrichmentResult,
    comments: any[],
    linkedProjects: any[],
    projectTwitterData: any,
    includeRaw?: boolean,
  ): any {
    const investor = enrichment.investor;
    const supportedProjects = this.buildSupportedProjects(fund, investor, linkedProjects);
    const fundraisingRounds = this.buildFundraisingRounds(investor, supportedProjects);
    const coInvestors = this.normalizeCoInvestors(fund, investor);
    const socialLinks = this.normalizeSocialLinks(fund, investor);
    const socialmedia = this.socialmediaFromLinks(socialLinks);
    const description = this.toDisplayString(
      this.firstNonEmpty(
        fund?.descriptionText,
        fund?.description,
        fund?.about,
        fund?.bio,
        investor?.description,
        investor?.about,
      ),
    );
    const ratingSource = {
      ...fund,
      projects: linkedProjects,
      portfolioCoins: fund?.portfolioCoins?.length
        ? fund.portfolioCoins
        : supportedProjects,
      coInvestors,
      socialmedia,
      websiteUrl: socialLinks.website || fund?.websiteUrl,
      twitterUrl: socialLinks.twitter || fund?.twitterUrl,
      linkedinUrl: socialLinks.linkedin || fund?.linkedinUrl,
    };
    const currentRating = this.roundNumber(fund?.rating);
    const currentFullness = this.roundNumber(fund?.fullness);
    const calculatedScores =
      currentRating <= 0 || currentFullness <= 0
        ? this.fundsRatingService.calculateBackerScores(ratingSource, investor)
        : null;
    const rating =
      currentRating > 0 ? currentRating : this.roundNumber(calculatedScores?.rating);
    const fullness =
      currentFullness > 0
        ? currentFullness
        : this.roundNumber(calculatedScores?.fullness);
    const roi = this.roundNumber(
      this.firstNonEmpty(
        fund?.roi,
        fund?.averageRoi,
        fund?.retailRoiPercent,
        fund?.privateRoiPercent,
        investor?.stats?.avgPublicRoi,
        investor?.stats?.avgPrivateRoi,
      ),
    );
    const projectsCount = Math.max(
      this.fundsRatingService.getProjectsCount(fund, investor),
      supportedProjects.length,
    );
    const supportedProjectsCount = Math.max(
      this.toNumber(fund?.supportedProjectsCount),
      projectsCount,
      supportedProjects.length,
    );
    const country = this.toDisplayString(
      this.firstNonEmpty(
        fund?.country,
        fund?.countryName,
        fund?.regionData?.properties?.name,
        investor?.country,
        investor?.location,
      ),
    );
    const location = this.toDisplayString(
      this.firstNonEmpty(
        fund?.location,
        fund?.regionData?.region,
        fund?.regionData?.id,
        investor?.location,
        investor?.country,
      ),
    );
    const type = this.toDisplayString(
      this.firstNonEmpty(fund?.type, fund?.niche, investor?.type, investor?.category),
    );
    const sectors = this.uniqueStrings([
      ...this.arrayValue(fund?.categories),
      ...this.arrayValue(investor?.sectors),
      ...this.arrayValue(fund?.roundsByCategory).map((item) => item?.name),
      fund?.industryFocus,
      investor?.category,
    ]);
    const tags = this.uniqueStrings([
      ...this.arrayValue(investor?.tags),
      ...this.arrayValue(fund?.tags),
    ], 20);
    const investmentStages = this.uniqueStrings([
      ...this.arrayValue(fund?.roundsByStage).map((item) => item?.name),
      ...fundraisingRounds.map((round) => round.stage || round.roundName),
    ]);
    const stats = this.buildStats(
      fund,
      investor,
      supportedProjects,
      fundraisingRounds,
      coInvestors,
    );
    const regionData =
      fund?.regionData ||
      (country
        ? {
            id: country,
            region: location || country,
            properties: { name: country },
          }
        : undefined);
    const detail: any = {
      _id: String(fund?._id || ""),
      id: String(fund?._id || ""),
      slug: fund?.slug,
      name: fund?.name,
      logo: this.toDisplayString(this.firstNonEmpty(fund?.logo, investor?.logo)),
      avatar: this.toDisplayString(this.firstNonEmpty(fund?.logo, investor?.logo)),
      type,
      niche: fund?.niche || type,
      status: fund?.status || "Active",
      country,
      location,
      regionData,
      countryFlag: fund?.countryFlag,
      description,
      about: description,
      descriptionText: description,
      bio: description,
      banner: fund?.banner || type || "",
      rating,
      fomoScore: fund?.fomoScore || rating,
      fullness,
      ratingBreakdown: fund?.ratingBreakdown || calculatedScores?.ratingBreakdown,
      fullnessBreakdown: fund?.fullnessBreakdown || calculatedScores?.fullnessBreakdown,
      lastRatingCalculatedAt: fund?.lastRatingCalculatedAt,
      roi,
      roiDisplay: this.formatRoiDisplay(roi),
      averageRoi: this.roundNumber(fund?.averageRoi || roi),
      privateRoiPercent: this.roundNumber(fund?.privateRoiPercent),
      retailRoiPercent: this.roundNumber(fund?.retailRoiPercent || roi),
      projectsCount,
      supportedProjectsCount,
      supportedProjects,
      supportedProjectsPreview: supportedProjects.slice(0, 6),
      fundraisingRounds,
      coInvestors,
      sectors,
      tags,
      categories: sectors,
      investmentStages,
      socialLinks,
      socialmedia: socialmedia.length ? socialmedia : fund?.socialmedia || [],
      stats,
      source: {
        sourceName: fund?.source || investor?.source,
        sourceUrl: fund?.sourceUrl || investor?.detailUrl,
        detailUrl: investor?.detailUrl,
        lastParsedAt: fund?.lastParsedAt || investor?.lastParsedAt,
        lastDetailParsedAt: investor?.lastDetailParsedAt,
        lastSyncedAt: investor?.lastSyncedAt,
        enrichedFromInvestor: Boolean(investor),
        matchedBy: enrichment.matchedBy,
      },
      dataQuality: {
        enrichmentStatus: enrichment.status,
        matchedBy: enrichment.matchedBy,
        supportedProjectsCount,
        fundraisingRoundsCount: fundraisingRounds.length,
        coInvestorsCount: coInvestors.length,
      },
      totalRaised: fund?.totalRaised || stats.totalInvestedAmount || 0,
      totalInvestments: stats.totalInvestments,
      numberOfInvestments: stats.totalInvestments,
      leadInvestments: stats.leadInvestments,
      currentAum: fund?.currentAum || fund?.investAmount || stats.totalInvestedAmount,
      investAmount: fund?.investAmount || fund?.currentAum || stats.totalInvestedAmount,
      foundedDate: fund?.foundedDate,
      lastFunding: fund?.lastFunding || stats.lastInvestmentDate,
      lastRoundDate: fund?.lastRoundDate || stats.lastInvestmentDate,
      roundsByCategory: fund?.roundsByCategory || [],
      roundsByStage: fund?.roundsByStage || [],
      georaphyInvestments: fund?.georaphyInvestments || [],
      investmentPorfolio:
        supportedProjects.length
          ? this.buildProjectInvestmentPortfolio(supportedProjects, fundraisingRounds)
          : fund?.investmentPorfolio?.length
          ? fund.investmentPorfolio
          : this.buildLegacyInvestmentPortfolio(supportedProjects),
      activities: this.buildLegacyActivities(fund, fundraisingRounds),
      recentExits: fund?.recentExits || [],
      projects: linkedProjects,
      portfolioCoins: fund?.portfolioCoins || [],
      portfolioCoinsCount: fund?.portfolioCoinsCount || supportedProjects.length,
      comments,
      projectTwitterData,
      greenFlagsList: fund?.greenFlagsList || [],
      redFlagsList: fund?.redFlagsList || [],
      redFlags: fund?.redFlags || 0,
      redStatus: fund?.redStatus || false,
      isSponsored: fund?.isSponsored || false,
      likes: fund?.likes || [],
      dislikes: fund?.dislikes || [],
      createdAt: fund?.createdAt,
      updatedAt: fund?.updatedAt || fund?.actionDate,
    };

    if (includeRaw) {
      detail.raw = {
        fund,
        investor,
      };
    }

    return detail;
  }

  private addFilterOptionValue(target: Map<string, number>, value: any): void {
    if (Array.isArray(value)) {
      value.forEach((item) => this.addFilterOptionValue(target, item));
      return;
    }

    const label = this.toDisplayString(value);
    if (!label || label.toLowerCase() === "unknown") return;

    target.set(label, (target.get(label) || 0) + 1);
  }

  private mapFilterOptions(values: Map<string, number>) {
    return Array.from(values.entries())
      .map(([label, count]) => ({
        key: label,
        label,
        count,
      }))
      .sort((first, second) => {
        if (second.count !== first.count) return second.count - first.count;
        return first.label.localeCompare(second.label);
      })
      .slice(0, 80);
  }

  async getFundsFilters() {
    return this.cacheService.wrap({
      key: CacheKeys.funds.filters(),
      ttl: CACHE_TTL_SECONDS.fundsFilters,
      factory: async () => {
        const fundTypes = new Map<string, number>();
        const industryFocus = new Map<string, number>();
        const funds = await this.fundModel
          .find(
            { status: { $in: ["active", "Active"] } },
            {
              type: 1,
              niche: 1,
              industryFocus: 1,
              categories: 1,
              roundsByCategory: 1,
            },
          )
          .lean();

        funds.forEach((fund: any) => {
          this.addFilterOptionValue(fundTypes, fund?.type);
          this.addFilterOptionValue(fundTypes, fund?.niche);
          this.addFilterOptionValue(industryFocus, fund?.industryFocus);
          this.addFilterOptionValue(industryFocus, fund?.categories);
          this.addFilterOptionValue(
            industryFocus,
            this.arrayValue(fund?.roundsByCategory).map((item) => item?.name),
          );
        });

        return {
          fundTypes: this.mapFilterOptions(fundTypes),
          industryFocus: this.mapFilterOptions(industryFocus),
        };
      },
    });
  }

  async getFunds(status: string, query?: InvestmentFilters) {
    const searchParams: any =
      status === "all" || query?.status?.length ? {} : { status };

    if (query?.additionalStatus === "sponsored") {
      searchParams.isSponsored = true;
    }

    const page = Math.max(Number(query?.page) || 1, 1);
    const limit = Math.min(Math.max(Number(query?.limit) || 100, 1), 500);
    const skip = (page - 1) * limit;

    const queryFilters: any = query ? this.buildFundsQuery(query) : null;
    const matchStage: any[] = [{ $match: searchParams }];
    if (queryFilters && Object.keys(queryFilters).length > 0) {
      matchStage.push({ $match: queryFilters });
    }

    const preSortStages: any[] = [
      ...matchStage,
      this.buildComputedFieldsStage(),
    ];

    const pipeline: any[] = [
      ...preSortStages,
      { $sort: this.resolveSort(query) },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: limit },
            this.buildSupportedProjectsPreviewStage(),
            { $project: this.buildFundsListProjection() },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
      {
        $project: {
          items: 1,
          totalCount: {
            $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0],
          },
        },
      },
    ];

    const result = await this.fundModel.aggregate(pipeline).allowDiskUse(true);
    const total = Number(result[0]?.totalCount || 0);
    const items = (result[0]?.items || []).map((item: any) =>
      this.serializeFundListItem(item),
    );

    return {
      items,
      totalCount: total,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private getFundingDynamicsGroupKey(date: Date, groupByDays: number): string {
    if (groupByDays <= 1) {
      return date.toISOString().split("T")[0];
    }

    const periodMs = groupByDays * 24 * 60 * 60 * 1000;
    const periodStart = new Date(Math.floor(date.getTime() / periodMs) * periodMs);

    return periodStart.toISOString().split("T")[0];
  }

  private formatFundingDynamicsPeriod(date: Date, groupByDays: number): string {
    if (groupByDays <= 1) {
      return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
    }

    const endDate = new Date(date.getTime() + (groupByDays - 1) * 24 * 60 * 60 * 1000);

    if (groupByDays === 7) {
      return `Week of ${date.toLocaleDateString("en-US", { day: "2-digit", month: "short" })}`;
    }

    return `${date.toLocaleDateString("en-US", { day: "2-digit", month: "short" })} - ${endDate.toLocaleDateString("en-US", { day: "2-digit", month: "short" })}`;
  }

  private buildFundingDynamicsChart(
    rows: FundsFundingDynamicsRow[] = [],
    options: {
      maxPeriods: number;
      groupByDays: number;
      fromDate?: Date;
      topCategories?: number;
    },
  ): FundsFundingDynamicsPoint[] {
    const topCategoriesLimit = options.topCategories || 6;
    const normalizedRows = rows
      .map((row) => {
        const date = row.date instanceof Date ? row.date : new Date(row.date);
        const amount = this.toNumber(row.amount);
        const category = this.toDisplayString(row.category) || "Unknown";

        return {
          date,
          amount,
          category,
          keyProjects: this.arrayValue(row.keyProjects)
            .map((project) => ({
              name: this.toDisplayString(project?.name) || "Unknown",
              amount: this.toNumber(project?.amount),
              category: this.toDisplayString(project?.category) || category,
            }))
            .filter((project) => project.amount > 0),
        };
      })
      .filter((row) => {
        if (!row.amount || Number.isNaN(row.date.getTime())) return false;
        if (options.fromDate && row.date < options.fromDate) return false;
        return true;
      });

    const categoryTotals = new Map<string, number>();
    normalizedRows.forEach((row) => {
      categoryTotals.set(row.category, (categoryTotals.get(row.category) || 0) + row.amount);
    });
    const topCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, topCategoriesLimit)
      .map(([category]) => category);
    const groupedByPeriod = new Map<string, typeof normalizedRows>();

    normalizedRows.forEach((row) => {
      const groupKey = this.getFundingDynamicsGroupKey(row.date, options.groupByDays);
      groupedByPeriod.set(groupKey, [...(groupedByPeriod.get(groupKey) || []), row]);
    });

    return Array.from(groupedByPeriod.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-options.maxPeriods)
      .map(([periodKey, periodRows]) => {
        const periodStart = new Date(periodKey);
        const periodEnd = new Date(
          periodStart.getTime() + (options.groupByDays - 1) * 24 * 60 * 60 * 1000,
        );
        const item: FundsFundingDynamicsPoint = {
          name: this.formatFundingDynamicsPeriod(periodStart, options.groupByDays),
          date: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          totalInvestment: 0,
          categories: topCategories,
          keyProjects: periodRows
            .flatMap((row) => row.keyProjects)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 3),
          investments0: 0,
          investments1: 0,
          investments2: 0,
          investments3: 0,
          investments4: 0,
          investments5: 0,
        };

        topCategories.forEach((category, index) => {
          const amount = periodRows
            .filter((row) => row.category === category)
            .reduce((sum, row) => sum + row.amount, 0);
          (item as any)[`investments${index}`] = Math.round(amount * 100) / 100;
          item.totalInvestment += amount;
        });

        item.totalInvestment = Math.round(item.totalInvestment * 100) / 100;

        return item;
      })
      .filter((item) => item.totalInvestment > 0);
  }

  private buildFundingDynamics(rows: FundsFundingDynamicsRow[] = []) {
    const now = new Date();

    return {
      chart90d: this.buildFundingDynamicsChart(rows, {
        maxPeriods: 13,
        groupByDays: 7,
        fromDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      }),
      chart1y: this.buildFundingDynamicsChart(rows, {
        maxPeriods: 12,
        groupByDays: 30,
        fromDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      }),
      chartAll: this.buildFundingDynamicsChart(rows, {
        maxPeriods: 24,
        groupByDays: 30,
      }),
    };
  }

  private hasFundingDynamicsScope(query?: InvestmentFilters): boolean {
    if (!query) return false;

    const ignoredKeys = new Set([
      "page",
      "limit",
      "sortBy",
      "sortOrder",
      "quickFilter",
      "status",
    ]);

    return Object.entries(query).some(([key, value]) => {
      if (ignoredKeys.has(key)) return false;
      if (Array.isArray(value)) return this.cleanFilterValues(value).length > 0;
      if (typeof value === "string") return value.trim() !== "";
      return value !== undefined && value !== null;
    });
  }

  private async getFundingRoundsDynamics(
    query?: InvestmentFilters,
    backers: FundingBackerIdentity[] = [],
  ) {
    const shouldScopeByBackers = this.hasFundingDynamicsScope(query);
    const backerConditions = this.buildFundingRoundBackerConditions(backers);

    if (shouldScopeByBackers && !backerConditions.length) {
      return this.buildFundingDynamics([]);
    }

    const match: Record<string, any> = {
      visible: true,
      raisedAmount: { $gt: 0 },
      fundingDate: { $ne: null },
    };
    const andFilters: any[] = [];
    const industryConditions = this.buildFundingRoundIndustryConditions(
      query?.industryFocus,
    );
    const searchValue = this.toNonEmptyString(query?.name || query?.search);

    if (shouldScopeByBackers && backerConditions.length) {
      andFilters.push({ $or: backerConditions });
    } else if (searchValue) {
      const searchRegex = new RegExp(this.escapeRegExp(searchValue), "i");
      andFilters.push({
        $or: [
          { "investors.name": searchRegex },
          { "investors.slug": searchRegex },
          { "investors.sourceBackerSlug": searchRegex },
          { projectName: searchRegex },
          { projectSlug: searchRegex },
          { projectSymbol: searchRegex },
        ],
      });
    }

    if (industryConditions.length) {
      andFilters.push({ $or: industryConditions });
    }

    if (andFilters.length) {
      match.$and = andFilters;
    }

    const rows = await this.fundingRoundModel
      .aggregate<FundsFundingDynamicsRow>([
        { $match: match },
        { $sort: { fundingDate: -1 } },
        { $limit: 12000 },
        {
          $project: {
            _id: 0,
            date: "$fundingDate",
            amount: "$raisedAmount",
            category: {
              $ifNull: [
                "$projectCategory",
                {
                  $ifNull: ["$roundType", "Unknown"],
                },
              ],
            },
            keyProjects: [
              {
                name: {
                  $ifNull: [
                    "$projectSymbol",
                    {
                      $ifNull: ["$projectName", "$projectSlug"],
                    },
                  ],
                },
                amount: "$raisedAmount",
                category: {
                  $ifNull: [
                    "$projectCategory",
                    {
                      $ifNull: ["$roundType", "Unknown"],
                    },
                  ],
                },
              },
            ],
          },
        },
      ])
      .allowDiskUse(true);

    return this.buildFundingDynamics(rows);
  }

  private buildFundingRoundsMatch(
    query?: InvestmentFilters,
    backers: FundingBackerIdentity[] = [],
    fromDate?: Date,
  ): Record<string, any> | null {
    const shouldScopeByBackers = this.hasFundingDynamicsScope(query);
    const backerConditions = this.buildFundingRoundBackerConditions(backers);

    if (shouldScopeByBackers && !backerConditions.length) {
      return null;
    }

    const match: Record<string, any> = {
      visible: true,
      raisedAmount: { $gt: 0 },
      fundingDate: { $ne: null },
    };
    const andFilters: any[] = [];
    const industryConditions = this.buildFundingRoundIndustryConditions(
      query?.industryFocus,
    );
    const searchValue = this.toNonEmptyString(query?.name || query?.search);

    if (fromDate) {
      match.fundingDate = { $gte: fromDate };
    }

    if (shouldScopeByBackers && backerConditions.length) {
      andFilters.push({ $or: backerConditions });
    } else if (searchValue) {
      const searchRegex = new RegExp(this.escapeRegExp(searchValue), "i");
      andFilters.push({
        $or: [
          { "investors.name": searchRegex },
          { "investors.slug": searchRegex },
          { "investors.sourceBackerSlug": searchRegex },
          { projectName: searchRegex },
          { projectSlug: searchRegex },
          { projectSymbol: searchRegex },
        ],
      });
    }

    if (industryConditions.length) {
      andFilters.push({ $or: industryConditions });
    }

    if (andFilters.length) {
      match.$and = andFilters;
    }

    return match;
  }

  private buildFundingRoundBackerConditions(
    backers: FundingBackerIdentity[],
  ): any[] {
    const names = this.uniqueStrings(backers.map((item) => item?.name), 5000);
    const slugs = this.uniqueStrings(
      backers.flatMap((item) => [
        item?.slug,
        this.fundingBackerSlugFromSourceKey(item?.sourceKey),
      ]),
      5000,
    );
    const sourceIds = this.uniqueStrings(
      backers.map((item) => item?.sourceId),
      5000,
    );
    const nameKeys = this.uniqueStrings(
      names.map((name) => this.normalizeFundingReadModelText(name)),
      5000,
    );
    const slugKeys = this.uniqueStrings(
      [...slugs, ...sourceIds].map((slug) =>
        this.normalizeFundingReadModelKey(slug),
      ),
      5000,
    );
    const conditions: any[] = [];

    if (nameKeys.length) {
      conditions.push({ investorNameKeys: { $in: nameKeys } });
    }
    if (slugKeys.length) {
      conditions.push({ investorSlugs: { $in: slugKeys } });
    }
    if (sourceIds.length) {
      conditions.push({ investorSourceIds: { $in: sourceIds } });
    }

    return conditions;
  }

  private fundingBackerSlugFromSourceKey(value: any): string {
    const sourceKey = this.toDisplayString(value);
    if (!sourceKey) return "";
    const namespacedSlug = sourceKey.match(/(?:^|:)investor:([^:]+)$/i)?.[1];
    if (namespacedSlug) return namespacedSlug;

    return sourceKey.includes(":") ? "" : sourceKey;
  }

  private buildFundingRoundIndustryConditions(value: any): any[] {
    const displayValues = this.cleanFilterValues(value);
    const normalizedKeys = this.uniqueStrings(
      displayValues.map((item) => this.normalizeFundingReadModelKey(item)),
      50,
    );
    if (!displayValues.length) return [];

    return [
      { projectCategory: { $in: displayValues } },
      ...(normalizedKeys.length
        ? [
            { categoryKeys: { $in: normalizedKeys } },
            { fundingTypeKeys: { $in: normalizedKeys } },
          ]
        : []),
      { roundType: { $in: displayValues } },
    ];
  }

  private normalizeFundingReadModelKey(value: any): string {
    return this.normalizeFundingReadModelText(value)
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  private normalizeFundingReadModelText(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  private async getFundingRoundsIndustryAllocation(
    query?: InvestmentFilters,
    backers: FundingBackerIdentity[] = [],
    fromDate?: Date,
  ) {
    const match = this.buildFundingRoundsMatch(query, backers, fromDate);

    if (!match) return [];

    return this.fundingRoundModel
      .aggregate([
        { $match: match },
        {
          $project: {
            amount: "$raisedAmount",
            category: {
              $trim: {
                input: {
                  $convert: {
                    input: {
                      $ifNull: [
                        "$projectCategory",
                        {
                          $ifNull: ["$roundType", "Unknown"],
                        },
                      ],
                    },
                    to: "string",
                    onError: "",
                    onNull: "",
                  },
                },
              },
            },
            projectKey: {
              $toLower: {
                $trim: {
                  input: {
                    $convert: {
                      input: {
                        $ifNull: [
                          "$projectSlug",
                          {
                            $ifNull: [
                              "$projectSymbol",
                              {
                                $ifNull: ["$projectName", "$projectRouteId"],
                              },
                            ],
                          },
                        ],
                      },
                      to: "string",
                      onError: "",
                      onNull: "",
                    },
                  },
                },
              },
            },
            projectName: {
              $trim: {
                input: {
                  $convert: {
                    input: {
                      $ifNull: [
                        "$projectName",
                        {
                          $ifNull: ["$projectSymbol", "$projectSlug"],
                        },
                      ],
                    },
                    to: "string",
                    onError: "",
                    onNull: "",
                  },
                },
              },
            },
            projectImage: "$projectLogo",
          },
        },
        {
          $match: {
            category: { $nin: ["", "[object Object]", "All", "all"] },
            projectName: { $ne: "" },
          },
        },
        {
          $group: {
            _id: {
              category: "$category",
              projectKey: "$projectKey",
            },
            name: { $first: "$projectName" },
            image: { $first: "$projectImage" },
            amount: { $sum: "$amount" },
          },
        },
        { $sort: { amount: -1, name: 1 } },
        {
          $group: {
            _id: "$_id.category",
            value: { $sum: "$amount" },
            projectsCount: { $sum: 1 },
            topProjects: {
              $push: {
                name: "$name",
                image: "$image",
                amount: "$amount",
              },
            },
          },
        },
        { $sort: { value: -1, _id: 1 } },
        { $limit: 24 },
        {
          $project: {
            _id: 0,
            label: "$_id",
            value: { $round: ["$value", 2] },
            projectsCount: 1,
            topProjects: { $slice: ["$topProjects", 5] },
          },
        },
      ])
      .allowDiskUse(true);
  }

  private async getIndustryAllocationByPeriod(
    query?: InvestmentFilters,
    backers: FundingBackerIdentity[] = [],
  ) {
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    const [
      chart24h,
      chart7d,
      chart30d,
      chart90d,
      chart1y,
      chartAll,
    ] = await Promise.all([
      this.getFundingRoundsIndustryAllocation(query, backers, new Date(now.getTime() - day)),
      this.getFundingRoundsIndustryAllocation(query, backers, new Date(now.getTime() - 7 * day)),
      this.getFundingRoundsIndustryAllocation(query, backers, new Date(now.getTime() - 30 * day)),
      this.getFundingRoundsIndustryAllocation(query, backers, new Date(now.getTime() - 90 * day)),
      this.getFundingRoundsIndustryAllocation(query, backers, new Date(now.getTime() - 365 * day)),
      this.getFundingRoundsIndustryAllocation(query, backers),
    ]);

    return {
      chart24h,
      chart7d,
      chart30d,
      chart90d,
      chart1y,
      chartAll,
    };
  }

  async getFundsAnalytics(query?: InvestmentFilters) {
    const searchParams: any = query?.status?.length ? {} : { status: "active" };
    const shouldScopeFundingDynamics = this.hasFundingDynamicsScope(query);

    if (query?.additionalStatus === "sponsored") {
      searchParams.isSponsored = true;
    }

    const queryFilters = query ? this.buildFundsQuery(query) : null;
    const matchStage: any[] = [{ $match: searchParams }];
    if (queryFilters && Object.keys(queryFilters).length > 0) {
      matchStage.push({ $match: queryFilters });
    }

    const pipeline: any[] = [
      ...matchStage,
      this.buildComputedFieldsStage(),
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalBackers: { $sum: 1 },
                totalProjectsSupported: { $sum: "$projectsCountComputed" },
                averageRating: { $avg: "$ratingNumber" },
                averageFullness: { $avg: "$fullnessNumber" },
                withSocialLinks: {
                  $sum: {
                    $cond: [
                      {
                        $or: [
                          { $gt: [{ $size: { $ifNull: ["$socialmedia", []] } }, 0] },
                          { $gt: [{ $size: { $ifNull: ["$links", []] } }, 0] },
                          { $ne: [{ $ifNull: ["$websiteUrl", ""] }, ""] },
                          { $ne: [{ $ifNull: ["$twitterUrl", ""] }, ""] },
                          { $ne: [{ $ifNull: ["$investorDetail.website", ""] }, ""] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                withPortfolio: {
                  $sum: {
                    $cond: [{ $gt: ["$projectsCountComputed", 0] }, 1, 0],
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                totalBackers: 1,
                totalProjectsSupported: { $round: ["$totalProjectsSupported", 0] },
                averageRating: { $round: ["$averageRating", 1] },
                averageFullness: { $round: ["$averageFullness", 1] },
                withSocialLinks: 1,
                withPortfolio: 1,
              },
            },
          ],
          backersByType: [
            {
              $project: {
                typeValue: {
                  $ifNull: [
                    "$type",
                    {
                      $ifNull: [
                        "$niche",
                        {
                          $ifNull: ["$investorDetail.type", "Unknown"],
                        },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                label: {
                  $cond: [
                    { $eq: [{ $trim: { input: { $toString: "$typeValue" } } }, ""] },
                    "Unknown",
                    "$typeValue",
                  ],
                },
              },
            },
            { $group: { _id: "$label", value: { $sum: 1 } } },
            { $sort: { value: -1, _id: 1 } },
            { $limit: 12 },
            { $project: { _id: 0, label: "$_id", value: 1 } },
          ],
          topSectors: [
            {
              $project: {
                rawSectors: {
                  $setUnion: [
                    { $ifNull: ["$sectors", []] },
                    { $ifNull: ["$categories", []] },
                    {
                      $map: {
                        input: { $ifNull: ["$roundsByCategory", []] },
                        as: "round",
                        in: "$$round.name",
                      },
                    },
                    { $ifNull: ["$investorDetail.sectors", []] },
                    {
                      $cond: [
                        { $ne: [{ $trim: { input: { $toString: { $ifNull: ["$industryFocus", ""] } } } }, ""] },
                        ["$industryFocus"],
                        [],
                      ],
                    },
                    {
                      $cond: [
                        { $ne: [{ $trim: { input: { $toString: { $ifNull: ["$niche", ""] } } } }, ""] },
                        ["$niche"],
                        [],
                      ],
                    },
                  ],
                },
              },
            },
            {
              $project: {
                sectorLabels: {
                  $filter: {
                    input: {
                      $map: {
                        input: "$rawSectors",
                        as: "sector",
                        in: {
                          $trim: {
                            input: {
                              $convert: {
                                input: "$$sector",
                                to: "string",
                                onError: "",
                                onNull: "",
                              },
                            },
                          },
                        },
                      },
                    },
                    as: "label",
                    cond: {
                      $and: [
                        { $ne: ["$$label", ""] },
                        { $ne: [{ $toLower: "$$label" }, "all"] },
                        { $ne: ["$$label", "[object Object]"] },
                      ],
                    },
                  },
                },
              },
            },
            {
              $project: {
                sectorLabels: {
                  $cond: [
                    { $gt: [{ $size: "$sectorLabels" }, 0] },
                    "$sectorLabels",
                    ["Unknown"],
                  ],
                },
              },
            },
            { $unwind: { path: "$sectorLabels", preserveNullAndEmptyArrays: true } },
            { $group: { _id: "$sectorLabels", value: { $sum: 1 } } },
            { $sort: { value: -1, _id: 1 } },
            { $limit: 24 },
            { $project: { _id: 0, label: "$_id", value: 1 } },
          ],
          backersByCountry: [
            {
              $project: {
                country: {
                  $ifNull: [
                    "$countryComputed",
                    {
                      $ifNull: ["$regionData.id", "Unknown"],
                    },
                  ],
                },
                countryCode: "$regionData.id",
              },
            },
            {
              $project: {
                country: {
                  $cond: [
                    { $eq: [{ $trim: { input: { $toString: "$country" } } }, ""] },
                    "Unknown",
                    "$country",
                  ],
                },
                countryCode: 1,
              },
            },
            {
              $group: {
                _id: "$country",
                countryCode: { $first: "$countryCode" },
                value: { $sum: 1 },
              },
            },
            { $sort: { value: -1, _id: 1 } },
            { $limit: 200 },
            {
              $project: {
                _id: 0,
                country: "$_id",
                countryCode: 1,
                value: 1,
              },
            },
          ],
          fundingBackers: shouldScopeFundingDynamics
            ? [
                { $limit: 5000 },
                {
                  $project: {
                    _id: 0,
                    name: 1,
                    slug: 1,
                    sourceKey: 1,
                    sourceId: {
                      $ifNull: ["$investorSnapshot.sourceId", "$dropstabId"],
                    },
                  },
                },
              ]
            : [
                { $match: { _id: { $exists: false } } },
                {
                  $project: {
                    _id: 0,
                    name: 1,
                    slug: 1,
                    sourceKey: 1,
                    sourceId: {
                      $ifNull: ["$investorSnapshot.sourceId", "$dropstabId"],
                    },
                  },
                },
              ],
        },
      },
    ];

    const [result = {}] = await this.fundModel.aggregate(pipeline);
    const preparedCharts = shouldScopeFundingDynamics
      ? null
      : await this.fundsAnalyticsSnapshotService.getLatestPreparedCharts();
    const [fundingDynamics, topSectorsByPeriod] = preparedCharts
      ? [preparedCharts.fundingDynamics, preparedCharts.topSectorsByPeriod]
      : await Promise.all([
          this.getFundingRoundsDynamics(query, result.fundingBackers || []),
          this.getIndustryAllocationByPeriod(query, result.fundingBackers || []),
        ]);
    const summary = result.summary?.[0] || {
      totalBackers: 0,
      totalProjectsSupported: 0,
      averageRating: 0,
      averageFullness: 0,
      withSocialLinks: 0,
      withPortfolio: 0,
    };
    const topSectors = topSectorsByPeriod.chartAll?.length
      ? topSectorsByPeriod.chartAll
      : preparedCharts?.topSectors?.length
        ? preparedCharts.topSectors
        : result.topSectors || [];

    return {
      summary,
      backersByType: result.backersByType || [],
      topSectors,
      topSectorsByPeriod,
      backersByCountry: result.backersByCountry || [],
      fundingDynamics,
    };
  }

  async recalculateFundRating(id: string, options: { dryRun?: boolean } = {}) {
    const fund = await this.fundModel.findById(id).lean();
    if (!fund) {
      throw new HttpException("Fund not found", HttpStatus.NOT_FOUND);
    }

    const investorDetail = await this.findInvestorDetailForFund(fund);
    const scores = this.fundsRatingService.calculateBackerScores(
      fund as any,
      investorDetail,
    );
    const projectsCount = this.fundsRatingService.getProjectsCount(
      fund as any,
      investorDetail,
    );

    if (!options.dryRun) {
      await this.fundModel.updateOne(
        { _id: fund._id },
        {
          $set: {
            rating: scores.rating,
            fomoScore: scores.rating,
            fullness: scores.fullness,
            ratingBreakdown: scores.ratingBreakdown,
            fullnessBreakdown: scores.fullnessBreakdown,
            lastRatingCalculatedAt: scores.ratingBreakdown.calculatedAt,
            projectsCount,
            supportedProjectsCount: projectsCount,
          },
        },
      );
    }

    return {
      id: String(fund._id),
      name: fund.name,
      dryRun: Boolean(options.dryRun),
      ...scores,
    };
  }

  async recalculateFundsRating(options: FundsRecalculateOptions = {}) {
    const dryRun = Boolean(options.dryRun);
    const batchSize = Math.max(Number(options.batchSize || 200), 1);
    const limit = Number(options.limit || 0);
    const cursor = this.fundModel
      .find(
        {},
        {
          coInvestors: 1,
          portfolioCoins: 1,
          roundsByCategory: 1,
          roundsByStage: 1,
          intelInvestorData: 1,
          name: 1,
          slug: 1,
          sourceKey: 1,
          source: 1,
          logo: 1,
          bio: 1,
          description: 1,
          websiteUrl: 1,
          twitterUrl: 1,
          linkedinUrl: 1,
          socialmedia: 1,
          country: 1,
          regionData: 1,
          type: 1,
          niche: 1,
          categories: 1,
          projects: 1,
          projectsCount: 1,
          supportedProjectsCount: 1,
          totalInvestments: 1,
          numberOfInvestments: 1,
          portfolioCoinsCount: 1,
          binanceListing: 1,
          roi: 1,
          averageRoi: 1,
          privateRoiPercent: 1,
          retailRoiPercent: 1,
          leadInvestments: 1,
          publicSalesCount: 1,
          twitterScore: 1,
          lastRoundDate: 1,
          lastFunding: 1,
          redFlags: 1,
          redFlagsList: 1,
          redStatus: 1,
          status: 1,
        },
      )
      .lean()
      .cursor();
    const operations: any[] = [];
    const summary: any = {
      dryRun,
      scanned: 0,
      updated: 0,
      errors: 0,
      examples: [],
    };

    for await (const fund of cursor as any) {
      if (limit && summary.scanned >= limit) break;
      summary.scanned += 1;

      try {
        const investorDetail = await this.findInvestorDetailForFund(fund);
        const scores = this.fundsRatingService.calculateBackerScores(
          fund as any,
          investorDetail,
        );
        const projectsCount = this.fundsRatingService.getProjectsCount(
          fund as any,
          investorDetail,
        );

        if (summary.examples.length < 10) {
          summary.examples.push({
            id: String(fund._id),
            name: fund.name,
            rating: scores.rating,
            fullness: scores.fullness,
            projectsCount,
          });
        }

        if (!dryRun) {
          operations.push({
            updateOne: {
              filter: { _id: fund._id },
              update: {
                $set: {
                  rating: scores.rating,
                  fomoScore: scores.rating,
                  fullness: scores.fullness,
                  ratingBreakdown: scores.ratingBreakdown,
                  fullnessBreakdown: scores.fullnessBreakdown,
                  lastRatingCalculatedAt: scores.ratingBreakdown.calculatedAt,
                  projectsCount,
                  supportedProjectsCount: projectsCount,
                },
              },
            },
          });
        }

        if (operations.length >= batchSize) {
          const result = await this.fundModel.bulkWrite(operations, {
            ordered: false,
          });
          summary.updated += result.modifiedCount + result.upsertedCount;
          operations.length = 0;
        }
      } catch (error) {
        summary.errors += 1;
        console.error(
          `Failed to calculate fund rating for ${fund?.name || fund?._id}: ${error.message}`,
        );
      }
    }

    if (!dryRun && operations.length) {
      const result = await this.fundModel.bulkWrite(operations, {
        ordered: false,
      });
      summary.updated += result.modifiedCount + result.upsertedCount;
    }

    return summary;
  }

  private async findInvestorDetailForFund(fund: any): Promise<any | null> {
    const or: any[] = [];
    if (fund.slug) or.push({ slug: fund.slug });
    if (fund.sourceKey) {
      or.push({ "sourceRefs.key": fund.sourceKey }, { sourceId: fund.sourceKey });
    }
    if (fund.name) {
      or.push({ normalizedName: this.normalizeName(fund.name) }, { name: fund.name });
    }

    if (!or.length) return null;

    return this.investorModel
      .findOne(
        { $or: or },
        {
          raw: 0,
          rawDetailData: 0,
          rawTableData: 0,
        },
      )
      .sort({ lastDetailParsedAt: -1, lastSyncedAt: -1 })
      .lean();
  }

  private normalizeName(value: string): string {
    return this.toNonEmptyString(value)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  private calculateFundScoreFields(fund: Record<string, any>): Record<string, any> {
    const scores = this.fundsRatingService.calculateBackerScores(fund as any);
    const projectsCount = this.fundsRatingService.getProjectsCount(fund as any);

    return {
      rating: scores.rating,
      fomoScore: scores.rating,
      fullness: scores.fullness,
      ratingBreakdown: scores.ratingBreakdown,
      fullnessBreakdown: scores.fullnessBreakdown,
      lastRatingCalculatedAt: scores.ratingBreakdown.calculatedAt,
      projectsCount,
      supportedProjectsCount: projectsCount,
    };
  }

  private async getFundsLegacyDisabled(status: string, query?: InvestmentFilters) {
    const searchParams: any =
      status === "all" || query?.status?.length ? {} : { status };

    if (query?.additionalStatus === "sponsored")
      searchParams.isSponsored = true;

    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 100;
    const skip = (page - 1) * limit;

    const queryFilters: any = query ? this.buildFundsQuery(query) : null;

    const matchStage: any[] = [{ $match: searchParams }];
    if (queryFilters && Object.keys(queryFilters).length > 0) {
      matchStage.push({ $match: queryFilters });
    }

    const pipeline: any[] = [
      ...matchStage,
      {
        $facet: {
          items: [
            // { $sort: { _id: -1 } }, // сортировка, при необходимости можно изменить
            { $skip: skip },
            { $limit: limit },
            { $project: this.buildFundsListProjection() },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
      {
        $project: {
          items: 1,
          totalCount: {
            $ifNull: [{ $arrayElemAt: ["$totalCount.count", 0] }, 0],
          },
        },
      },
    ];

    const result = await this.fundModel.aggregate(pipeline);

    return result[0]; // { items: [...], totalCount: number }
  }
  async getInvestorsBySlug(query?: {
    page: string;
    limit: string;
    slugs: string;
  }) {
    const page = Number(query?.page) || 1;
    const limit = Number(query?.limit) || 100;
    const skip = (page - 1) * limit;

    const slugs: string[] =
      query?.slugs?.split(",").map((slug) => slug.trim()) || [];

    const result = await this.fundModel.aggregate([
      {
        $match: {
          slug: { $in: slugs },
        },
      },
      { $skip: skip },
      { $limit: limit },
    ]);

    return {items:result,totalCount:result.length};
  }

  async getFund(id: string, options: FundDetailOptions = {}) {
    const fund = await this.findFundDetailDocument(id, options.includeRaw);

    if (!fund) {
      throw new HttpException("Fund not found", HttpStatus.NOT_FOUND);
    }

    const [projectTwitterData, comments, enrichment] = await Promise.all([
      this.projectTwitterModel.findOne({ projectId: fund._id }).lean(),
      this.commentsService.getComments(fund.comments || []),
      this.findInvestorDetailForFundDetail(fund, options.includeRaw),
    ]);
    const linkedProjects = await this.findFundLinkedProjects(
      fund,
      enrichment.investor,
      { includeLookupProjects: false, includeTokenSupply: false },
    );

    return this.serializeFundDetail(
      fund,
      enrichment,
      comments,
      linkedProjects,
      projectTwitterData,
      options.includeRaw,
    );



    // Комментарии отдельно (если comments — массив ObjectId)
  }

  async getFundLockedUnlockedTokenDistribution(id: string) {
    const fund = await this.findFundDetailDocument(id, false);

    if (!fund) {
      throw new HttpException("Fund not found", HttpStatus.NOT_FOUND);
    }

    const enrichment = await this.findInvestorDetailForFundDetail(fund, false);
    const linkedProjects = await this.findFundLinkedProjects(
      fund,
      enrichment.investor,
      { includeLookupProjects: true, includeTokenSupply: true, limit: 300 },
    );
    const supportedProjects = this.buildSupportedProjects(
      fund,
      enrichment.investor,
      linkedProjects,
    );
    const items = this.buildLockedUnlockedDistribution(
      fund,
      supportedProjects,
      linkedProjects,
    );

    return {
      ok: true,
      items,
      total: items.length,
    };
  }

  async getModeratorFunds() {
    return this.fundModel.find();
  }

  async getAdminFunds() {
    return this.fundModel.find();
  }

  async createFundByAdmin(createFundsDto: CreateFundsDto) {
    const logo = await this.filesService.writeFile(createFundsDto.logo);

    const investors =
      createFundsDto.investors[0]?.length &&
      JSON.parse(createFundsDto.investors[0]);

    const newProjectData = {
      ...createFundsDto,
      logo: logo,
      investors,
      projectStatus: "active",
      lastFunding: "",
    };
    const newProject = await this.fundModel.create({
      ...newProjectData,
      ...this.calculateFundScoreFields(newProjectData),
    });

    return newProject;
  }

  async createFund(
    createFundsDto: CreateFundsDto,
    initiator: string,
    actionStatus?: "moderator" | "admin"
  ) {
    const actionType: string = `Publication fund on Crypto page`;
    const actionDate: Date = new Date();

    const logo = createFundsDto.logo
      ? await this.filesService.writeFile(createFundsDto.logo)
      : "";

    const investors =
      createFundsDto.investors[0]?.length &&
      JSON.parse(createFundsDto.investors[0]);

    const regionData = createFundsDto.regionData
      ? JSON.parse(createFundsDto.regionData)
      : {};
    const projects = createFundsDto.projects
      ? this.parseArrayToObjectId(createFundsDto.projects)
      : [];

    const socialmedia = createFundsDto.socialmedia
      ? JSON.parse(createFundsDto.socialmedia)
      : [];

    const newFundData = {
      ...createFundsDto,
      logo: logo,
      action: actionType,
      actionDate: actionDate,
      actionInitiator: initiator,
      investors,
      projectStatus: actionStatus,
      regionData,
      socialmedia,
      projects,
      lastFunding: "",
    };
    const newFund = await this.fundModel.create({
      ...newFundData,
      ...this.calculateFundScoreFields(newFundData),
    });

    const action: AddActionDto = {
      user: new mongoose.Types.ObjectId(initiator),
      name: "Create fund",
      type: actionType,
      value: { name: createFundsDto.name, img: logo },
      date: new Date(),
      category: "funds",
      status: actionStatus,
      itemId: newFund._id,
    };

    await this.actionsService.addAction(action);

    if (actionStatus === "moderator") {
      await this.userModel.findByIdAndUpdate(initiator, {
        $inc: { projectLimit: -1 },
      });
    }

    return newFund;
  }

  async editFundByUser(
    id: string,
    updateFundDto: UpdateFundDto,
    initiator: string
  ) {
    const updatedProject = await this.fundModel.findById(id);

    const updatedProjectTmp = {
      ...updateFundDto,
      comments: updatedProject.comments,
    };

    const oldFunds: Array<mongoose.Types.ObjectId> =
      updateFundDto?.oldFunds?.map((id) => new mongoose.Types.ObjectId(id));
    const newFunds: Array<mongoose.Types.ObjectId> =
      updateFundDto?.newFunds?.map((id) => new mongoose.Types.ObjectId(id));
    const oldProjectIds: Array<mongoose.Types.ObjectId> =
      updateFundDto?.oldProjectIds?.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
    const newProjectIds: Array<mongoose.Types.ObjectId> =
      updateFundDto?.newProjectIds?.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
    const isProjectsUpdate: boolean =
      oldFunds && newFunds && oldProjectIds && !!newProjectIds;

    const newProjectData = {
      ...updatedProject.toObject(),
      ...updatedProjectTmp,
      isDuplicate: true,
      originalEntityId: new mongoose.Types.ObjectId(id),
      _id: new mongoose.Types.ObjectId(),
      projectStatus: "moderator",
    };
    Object.assign(newProjectData, this.calculateFundScoreFields(newProjectData));

    const newProject = await this.fundModel.create(newProjectData);

    const actionType: string = `Update fund on crypto page`;

    const action: AddActionDto = {
      user: new mongoose.Types.ObjectId(initiator),
      itemId: new mongoose.Types.ObjectId(newProject._id),
      name: "Update fund",
      actionType: "update",
      type: actionType,
      value: { name: newProject.name, img: newProject.logo },
      date: new Date(),
      status: "moderator",
      category: "funds",
    };

    if (isProjectsUpdate) {
      (action.oldFunds = oldFunds),
        (action.newFunds = newFunds),
        (action.oldProjectIds = oldProjectIds),
        (action.newProjectIds = newProjectIds);
    }

    await this.actionsService.addAction(action);

    await this.userModel.findByIdAndUpdate(initiator, {
      $inc: { fundLimit: -1 },
    });

    await this.activityService.createActivity({
      userId: new mongoose.Types.ObjectId(initiator),
      createdAt: new Date(),
      title: "",
      type: "other",
      link: "",
      text: `You have updated the fund <button data-path="/crypto/funds/${updatedProject._id}" class="inline-button">${updatedProject.name}</button>`,
    });

    return newProject;
  }

  async editFund(
    id: string,
    updateFundDto: UpdateFundDto,
    roleData: RolesDto,
    initiator: string
  ) {
    const updatedProject = await this.fundModel.findById(id);

    const isNewLogo: boolean =
      typeof updateFundDto.logo !== "string" && !!updateFundDto.logo;

    const newLogo: string = isNewLogo
      ? await this.filesService.writeFile(updateFundDto.logo)
      : updatedProject.logo;

    const { success } =
      updatedProject.logo && isNewLogo
        ? await this.filesService.removeFile(updatedProject.logo)
        : { success: true };

    if (!success) return "Update error";

    const investors =
      updateFundDto?.investors &&
      updateFundDto?.investors[0]?.length &&
      JSON.parse(updateFundDto?.investors[0]);

    const oldFunds: Array<mongoose.Types.ObjectId> =
      updateFundDto?.oldFunds?.map((id) => new mongoose.Types.ObjectId(id));
    const newFunds: Array<mongoose.Types.ObjectId> =
      updateFundDto?.newFunds?.map((id) => new mongoose.Types.ObjectId(id));
    const oldProjectIds: Array<mongoose.Types.ObjectId> =
      updateFundDto?.oldProjectIds?.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
    const newProjectIds: Array<mongoose.Types.ObjectId> =
      updateFundDto?.newProjectIds?.map(
        (id) => new mongoose.Types.ObjectId(id)
      );

    const isProjectsUpdate: boolean =
      oldFunds && newFunds && oldProjectIds && !!newProjectIds;

    const updatedProjectTmp = {
      ...updateFundDto,
      logo: newLogo,
      comments: updatedProject.comments,
      investors,
    };
    const updatedScoreFields = this.calculateFundScoreFields({
      ...updatedProject.toObject(),
      ...updatedProjectTmp,
    });

    if (roleData.isAdmin) {
      const editedProject = await this.fundModel.findByIdAndUpdate(
        id,
        {
          ...updatedProjectTmp,
          ...updatedScoreFields,
        }
      );

      if (isProjectsUpdate) {
        await this.updateFundProject({
          oldFunds,
          newFunds,
          newProjectIds,
          oldProjectIds,
        });
      }

      return editedProject;
    }

    if (roleData.isModerator) {
      const newProjectData = {
        ...updatedProjectTmp,
        ...updatedScoreFields,
        isDuplicate: true,
        projectStatus: "admin",
        originalEntityId: new mongoose.Types.ObjectId(id),
        _id: new mongoose.Types.ObjectId(),
      };

      const newProject = await this.fundModel.create(newProjectData);

      const actionType: string = `Update fund on crypto page`;

      const action: AddActionDto = {
        user: new mongoose.Types.ObjectId(initiator),
        itemId: new mongoose.Types.ObjectId(newProject._id),
        name: "Update fund",
        actionType: "update",
        type: actionType,
        value: { name: newProject.name, img: newProject.logo },
        date: new Date(),
        status: "admin",
        category: "funds",
      };

      if (isProjectsUpdate) {
        (action.oldFunds = oldFunds),
          (action.newFunds = newFunds),
          (action.oldProjectIds = oldProjectIds),
          (action.newProjectIds = newProjectIds);
      }

      await this.actionsService.addAction(action);

      return newProject;
    }
  }

  async updateFundProject(projects: {
    oldFunds: Array<mongoose.Types.ObjectId>;
    newFunds: Array<mongoose.Types.ObjectId>;
    newProjectIds: Array<mongoose.Types.ObjectId>;
    oldProjectIds: Array<mongoose.Types.ObjectId>;
  }): Promise<any> {
    const { oldFunds, newFunds, oldProjectIds, newProjectIds } = projects;

    return await this.projectModel.bulkWrite([
      {
        updateMany: {
          filter: { _id: { $in: oldProjectIds } },
          // @ts-ignore
          update: { $pull: { investors: { $in: oldFunds } } },
        },
      },
      {
        updateMany: {
          filter: { _id: { $in: newProjectIds } },
          // @ts-ignore
          update: { $addToSet: { investors: { $each: newFunds } } },
        },
      },
    ]);
  }

  async addComment(id: string, comment: commentDto): Promise<Array<any>> {
    const project = await this.fundModel.findById(id);

    const createdComment = await this.commentsService.createComment(comment);

    if (project.comments) {
      project.comments = [createdComment._id, ...project.comments];
    } else {
      project.comments = [createdComment._id];
    }

    await project.save();

    return project.comments;
  }

  async removeComment(id: string, comment: string): Promise<Array<any>> {
    const project = await this.fundModel.findOne({ _id: id });

    await this.commentsService.removeComment(comment);

    const filteredComments: Array<any> = project.comments.filter(
      (prComment) => String(prComment._id) !== comment
    );

    project.comments = filteredComments;

    await project.save();

    return filteredComments;
  }

  async removeProject(id: string) {
    const project = await this.fundModel.findOneAndDelete({ _id: id });

    return project;
  }

  async toggleRedStatus(id: string) {
    const project = await this.fundModel.findById(id);

    project.redStatus = !project.redStatus;

    return await project.save();
  }

  async changeStatus(id: string, status: string) {
    const project = await this.fundModel.findById(id);

    project.status = status;

    return await project.save();
  }

  async updateSponsoredStatus(id: string) {
    const project = await this.fundModel.findById(id);

    project.isSponsored = !project.isSponsored;

    return await project.save();
  }

  async addLike(itemId: string, userId: string): Promise<Funds> {
    const item = await this.fundModel.findById(itemId).exec();
    const uId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(userId);

    if (item.likes.includes(uId)) {
      return this.fundModel
        .findByIdAndUpdate(itemId, { $pull: { likes: uId } }, { new: true })
        .exec();
    }

    return this.fundModel
      .findByIdAndUpdate(
        itemId,
        {
          $addToSet: { likes: uId },
          $pull: { dislikes: uId },
        },
        { new: true }
      )
      .exec();
  }

  async addDislike(itemId: string, userId: string): Promise<Funds> {
    const item = await this.fundModel.findById(itemId).exec();
    const uId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(userId);

    if (item.dislikes.includes(uId)) {
      return this.fundModel
        .findByIdAndUpdate(itemId, { $pull: { dislikes: uId } }, { new: true })
        .exec();
    }

    return this.fundModel
      .findByIdAndUpdate(
        itemId,
        {
          $addToSet: { dislikes: uId },
          $pull: { likes: uId },
        },
        { new: true }
      )
      .exec();
  }
}
