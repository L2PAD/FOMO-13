import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Funds, FundsDocument } from "src/funds/funds.model";
import { Project, ProjectDocument } from "src/projects/project.model";
import { Investor, InvestorDocument } from "./investor.model";
import { Person, PersonDocument } from "src/persons/person.model";
import { PersonsAnalyticsSnapshotService } from "./persons-analytics-snapshot.service";

type PersonsSortBy =
  | "name"
  | "rating"
  | "fullness"
  | "projectsCount"
  | "supportedProjectsCount"
  | "roi"
  | "country"
  | "specialization"
  | "lastUpdatedAt"
  | "dropstabRank"
  | "fomoScore"
  | "athRoi"
  | "totalInvested"
  | "totalInvestments";

type PersonsSortOrder = "asc" | "desc";

export interface BackersPersonsQuery {
  page?: number;
  limit?: number;
  offset?: number;
  name?: string;
  search?: string;
  searchValue?: string;
  specialization?: string[];
  country?: string[];
  region?: string[];
  "regionData.region"?: string[];
  industryFocus?: string[];
  sector?: string[];
  sectors?: string[];
  roi?: string[];
  totalInvestments?: string[];
  rating?: string[];
  fullness?: string[];
  fomoScore?: string[];
  redFlags?: string[];
  followers?: string[];
  additionalStatus?: "sponsored" | "eralash" | string;
  sortBy?: string;
  sortOrder?: PersonsSortOrder | string;
}

@Injectable()
export class InvestorsService {
  private readonly portfolioGeographyCache = new Map<string, { expiresAt: number; data: any }>();
  private readonly portfolioGeographyCacheTtlMs = 5 * 60 * 1000;

  private readonly regionOrder = [
    "North America",
    "Europe",
    "Asia-Pacific",
    "Middle East",
    "Latin America",
    "Africa",
    "Offshore/Caribbean",
    "Unknown",
  ];

  private readonly countryRegionMap: Record<string, string> = {
    "united-states-of-america": "North America",
    "united-states": "North America",
    usa: "North America",
    canada: "North America",
    "puerto-rico": "North America",
    "united-kingdom": "Europe",
    germany: "Europe",
    switzerland: "Europe",
    austria: "Europe",
    spain: "Europe",
    france: "Europe",
    netherlands: "Europe",
    portugal: "Europe",
    malta: "Europe",
    andorra: "Europe",
    bulgaria: "Europe",
    denmark: "Europe",
    estonia: "Europe",
    ireland: "Europe",
    italy: "Europe",
    russia: "Europe",
    slovenia: "Europe",
    sweden: "Europe",
    china: "Asia-Pacific",
    singapore: "Asia-Pacific",
    "hong-kong": "Asia-Pacific",
    "south-korea": "Asia-Pacific",
    india: "Asia-Pacific",
    japan: "Asia-Pacific",
    vietnam: "Asia-Pacific",
    philippines: "Asia-Pacific",
    thailand: "Asia-Pacific",
    malaysia: "Asia-Pacific",
    bangladesh: "Asia-Pacific",
    indonesia: "Asia-Pacific",
    taiwan: "Asia-Pacific",
    australia: "Asia-Pacific",
    "new-zealand": "Asia-Pacific",
    "united-arab-emirates": "Middle East",
    israel: "Middle East",
    brazil: "Latin America",
    argentina: "Latin America",
    "south-africa": "Africa",
    seychelles: "Africa",
    "cayman-islands": "Offshore/Caribbean",
    "virgin-islands-british": "Offshore/Caribbean",
  };

  private readonly personsNonSpecializationLabels = [
    "",
    "Unknown",
    "unknown",
    "N/A",
    "n/a",
    "all",
    "Fraud",
    "fraud",
    "Scam",
    "scam",
  ];

  constructor(
    @InjectModel(Investor.name)
    private readonly investorModel: Model<InvestorDocument>,
    @InjectModel(Person.name)
    private readonly personModel: Model<PersonDocument>,
    @InjectModel(Funds.name)
    private readonly fundsModel: Model<FundsDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly personsAnalyticsSnapshotService: PersonsAnalyticsSnapshotService,
  ) {}

  private numberExpression(input: any): any {
    const stringValue = { $toString: { $ifNull: [input, "0"] } };
    const withoutDollar = {
      $replaceAll: { input: stringValue, find: { $literal: "$" }, replacement: "" },
    };
    const withoutPercent = {
      $replaceAll: { input: withoutDollar, find: "%", replacement: "" },
    };
    const withoutCommas = {
      $replaceAll: { input: withoutPercent, find: ",", replacement: "" },
    };
    const withoutX = {
      $replaceAll: { input: withoutCommas, find: "x", replacement: "" },
    };

    return {
      $convert: {
        input: withoutX,
        to: "double",
        onError: 0,
        onNull: 0,
      },
    };
  }

  private cleanPersonsFilterValues(value: any): string[] {
    const values = Array.isArray(value) ? value : value ? [value] : [];

    return values
      .flatMap((item) => String(item || "").split(","))
      .map((item) => item.trim())
      .filter((item) => item && item.toLowerCase() !== "all");
  }

  private parsePersonsRangeFilters(value: any): Array<[number, number]> {
    return this.cleanPersonsFilterValues(value)
      .map((range) => {
        const [min, max] = range.split("-").map(Number);
        if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
        return [Math.min(min, max), Math.max(min, max)] as [number, number];
      })
      .filter((item): item is [number, number] => Boolean(item));
  }

  private rangeConditions(
    ranges: Array<[number, number]>,
    fields: string[],
  ): any[] {
    return ranges.map(([min, max]) => ({
      $or: fields.map((field) => ({
        [field]: { $gte: min, $lte: max },
      })),
    }));
  }

  private buildBackersPersonsMatchStages(query: BackersPersonsQuery = {}) {
    const preComputedConditions: any[] = [
      { projectStatus: { $in: ["active", "Active"] } },
    ];
    const computedConditions: any[] = [];

    if (query.additionalStatus === "sponsored") {
      preComputedConditions.push({ isSponsored: true });
    }
    if (query.additionalStatus === "eralash") {
      preComputedConditions.push({ isEralash: true });
    }

    const search = this.toCleanString(
      query.name || query.search || query.searchValue,
    );
    if (search) {
      const escapedSearch = this.escapeRegExp(search);
      preComputedConditions.push({
        $or: [
          { name: { $regex: escapedSearch, $options: "i" } },
          { slug: { $regex: escapedSearch, $options: "i" } },
          { niche: { $regex: escapedSearch, $options: "i" } },
          { type: { $regex: escapedSearch, $options: "i" } },
          { country: { $regex: escapedSearch, $options: "i" } },
          { location: { $regex: escapedSearch, $options: "i" } },
          { bio: { $regex: escapedSearch, $options: "i" } },
          { descriptionText: { $regex: escapedSearch, $options: "i" } },
          { currentRole: { $regex: escapedSearch, $options: "i" } },
          { organizationName: { $regex: escapedSearch, $options: "i" } },
        ],
      });
    }

    const specializations = this.cleanPersonsFilterValues(query.specialization);
    if (specializations.length) {
      preComputedConditions.push({
        $or: [
          { categories: { $in: specializations } },
          { tags: { $in: specializations } },
          { sectors: { $in: specializations } },
          { industryFocus: { $in: specializations } },
          { "roundsByCategory.name": { $in: specializations } },
        ],
      });
    }

    const countries = [
      ...this.cleanPersonsFilterValues(query.country),
      ...this.cleanPersonsFilterValues(query.region),
      ...this.cleanPersonsFilterValues(query["regionData.region"]),
    ];
    if (countries.length) {
      preComputedConditions.push({
        $or: [
          { country: { $in: countries } },
          { location: { $in: countries } },
          { tableCountry: { $in: countries } },
          { "regionData.region": { $in: countries } },
          { "regionData.id": { $in: countries } },
          { "regionData.properties.name": { $in: countries } },
        ],
      });
    }

    const sectors = [
      ...this.cleanPersonsFilterValues(query.industryFocus),
      ...this.cleanPersonsFilterValues(query.sector),
      ...this.cleanPersonsFilterValues(query.sectors),
    ];
    if (sectors.length) {
      preComputedConditions.push({
        $or: [
          { categories: { $in: sectors } },
          { tags: { $in: sectors } },
          { "roundsByCategory.name": { $in: sectors } },
          { industryFocus: { $in: sectors } },
        ],
      });
    }

    const roiRanges = this.parsePersonsRangeFilters(query.roi);
    if (roiRanges.length) {
      computedConditions.push({
        $or: this.rangeConditions(roiRanges, ["roiComputed"]),
      });
    }

    const investmentRanges = this.parsePersonsRangeFilters(query.totalInvestments);
    if (investmentRanges.length) {
      computedConditions.push({
        $or: this.rangeConditions(investmentRanges, [
          "totalInvestedNumber",
          "projectsCountComputed",
          "supportedProjectsCountComputed",
        ]),
      });
    }

    const ratingRanges = [
      ...this.parsePersonsRangeFilters(query.rating),
      ...this.parsePersonsRangeFilters(query.fomoScore),
    ];
    if (ratingRanges.length) {
      computedConditions.push({
        $or: this.rangeConditions(ratingRanges, ["ratingNumber"]),
      });
    }

    const fullnessRanges = this.parsePersonsRangeFilters(query.fullness);
    if (fullnessRanges.length) {
      computedConditions.push({
        $or: this.rangeConditions(fullnessRanges, ["fullnessNumber"]),
      });
    }

    const fomoValues = this.cleanPersonsFilterValues(query.fomoScore);
    const hasVerified = fomoValues.includes("verificationStatus=true");
    const hasUnverified = fomoValues.includes("verificationStatus=false");
    if (hasVerified && !hasUnverified) {
      preComputedConditions.push({ isSponsored: true });
    } else if (hasUnverified && !hasVerified) {
      preComputedConditions.push({
        $or: [{ isSponsored: false }, { isSponsored: { $exists: false } }],
      });
    }

    const redFlagRanges = this.cleanPersonsFilterValues(query.redFlags);
    if (redFlagRanges.length) {
      const redFlagConditions = redFlagRanges
        .map((value) => {
          if (value === "0") {
            return {
              $expr: {
                $eq: [{ $size: { $ifNull: ["$redFlagsList", []] } }, 0],
              },
            };
          }
          const [min, max] = value.split("-").map(Number);
          if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
          return {
            $expr: {
              $and: [
                { $gte: [{ $size: { $ifNull: ["$redFlagsList", []] } }, min] },
                { $lte: [{ $size: { $ifNull: ["$redFlagsList", []] } }, max] },
              ],
            },
          };
        })
        .filter(Boolean);

      if (redFlagConditions.length) {
        preComputedConditions.push({ $or: redFlagConditions });
      }
    }

    const followersRanges = this.parsePersonsRangeFilters(query.followers);
    if (followersRanges.length) {
      computedConditions.push({
        $or: this.rangeConditions(followersRanges, ["followersCountComputed"]),
      });
    }

    return {
      preComputedMatch: preComputedConditions.length
        ? { $and: preComputedConditions }
        : {},
      computedMatch: computedConditions.length
        ? { $and: computedConditions }
        : {},
    };
  }

  private hasBackersPersonsAnalyticsScope(query: BackersPersonsQuery = {}) {
    const scopedKeys: Array<keyof BackersPersonsQuery> = [
      "name",
      "search",
      "searchValue",
      "specialization",
      "country",
      "region",
      "regionData.region",
      "industryFocus",
      "sector",
      "sectors",
      "roi",
      "totalInvestments",
      "rating",
      "fullness",
      "fomoScore",
      "redFlags",
      "followers",
      "additionalStatus",
    ];

    return scopedKeys.some((key) => {
      const value = query[key];
      if (Array.isArray(value)) return this.cleanPersonsFilterValues(value).length > 0;
      return Boolean(this.toCleanString(value));
    });
  }

  private buildBackersPersonsComputedStages(): any[] {
    const toNumber = (input: any) => this.numberExpression(input);
    const portfolioCountExpression = {
      $max: [
        toNumber("$tableProjectsCount"),
        toNumber("$projectsCount"),
        toNumber("$supportedProjectsCount"),
        toNumber("$totalInvestments"),
        toNumber("$numberOfInvestments"),
        toNumber("$portfolioCoinsCount"),
        { $size: { $ifNull: ["$participated", []] } },
        { $size: { $ifNull: ["$portfolioCoins", []] } },
        { $size: { $ifNull: ["$investmentPorfolio", []] } },
      ],
    };

    return [
      {
        $addFields: {
          ratingRawNumber: {
            $let: {
              vars: {
                values: [
                  toNumber("$tableRating"),
                  toNumber("$rating"),
                  toNumber("$fomoScore"),
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
                          cond: { $gt: ["$$value", 0] },
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
          fullnessRawNumber: {
            $let: {
              vars: {
                values: [toNumber("$tableFullness"), toNumber("$fullness")],
              },
              in: {
                $ifNull: [
                  {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$$values",
                          as: "value",
                          cond: { $gt: ["$$value", 0] },
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
                  toNumber("$athRoi"),
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
          projectsCountComputed: portfolioCountExpression,
          supportedProjectsCountComputed: {
            $max: [
              toNumber("$tableSupportedProjectsCount"),
              toNumber("$supportedProjectsCount"),
              toNumber("$portfolioCoinsCount"),
              { $size: { $ifNull: ["$participated", []] } },
              { $size: { $ifNull: ["$portfolioCoins", []] } },
              { $size: { $ifNull: ["$investmentPorfolio", []] } },
            ],
          },
          totalInvestedNumber: {
            $let: {
              vars: {
                values: [
                  toNumber("$totalInvested"),
                  toNumber("$totalInvestments"),
                  toNumber("$investAmount"),
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
                          cond: { $gt: ["$$value", 0] },
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
          countryComputed: {
            $ifNull: [
              "$tableCountry",
              {
                $ifNull: [
                  "$country",
                  {
                    $ifNull: [
                      "$location",
                      {
                        $ifNull: [
                          "$regionData.properties.name",
                          {
                            $ifNull: ["$regionData.region", "$regionData.id"],
                          },
                        ],
                      },
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
                      "$syncedInvestorAt",
                      {
                        $ifNull: [
                          "$lastRoundDate",
                          {
                            $ifNull: ["$actionDate", "$createdAt"],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          dropstabRankNumber: toNumber("$dropstabRank"),
          followersCountComputed: {
            $max: [
              toNumber("$followersCount"),
              toNumber("$twitterFollowersCount"),
              toNumber("$parsingTwitterData.followersCount"),
              { $size: { $ifNull: ["$topfollowers", []] } },
            ],
          },
          specializationsComputed: {
            $filter: {
              input: {
                $setUnion: [
                  {
                    $cond: [
                      { $ne: [{ $ifNull: ["$niche", ""] }, ""] },
                      ["$niche"],
                      [],
                    ],
                  },
                  {
                    $cond: [
                      { $ne: [{ $ifNull: ["$type", ""] }, ""] },
                      ["$type"],
                      [],
                    ],
                  },
                  {
                    $cond: [
                      { $isArray: "$specializations" },
                      "$specializations",
                      [],
                    ],
                  },
                ],
              },
              as: "specialization",
              cond: {
                $and: [
                  { $ne: ["$$specialization", null] },
                  { $ne: ["$$specialization", ""] },
                  { $ne: ["$$specialization", "Unknown"] },
                ],
              },
            },
          },
          sectorsComputed: {
            $filter: {
              input: {
                $setUnion: [
                  { $cond: [{ $isArray: "$categories" }, "$categories", []] },
                  { $cond: [{ $isArray: "$tags" }, "$tags", []] },
                  {
                    $cond: [{ $isArray: "$sectors" }, "$sectors", []],
                  },
                  {
                    $cond: [
                      { $isArray: "$industryFocus" },
                      "$industryFocus",
                      [],
                    ],
                  },
                  {
                    $map: {
                      input: {
                        $cond: [
                          { $isArray: "$roundsByCategory" },
                          "$roundsByCategory",
                          [],
                        ],
                      },
                      as: "category",
                      in: "$$category.name",
                    },
                  },
                ],
              },
              as: "sector",
              cond: {
                $and: [
                  { $ne: ["$$sector", null] },
                  { $ne: ["$$sector", ""] },
                  { $ne: ["$$sector", "Unknown"] },
                  { $ne: ["$$sector", "all"] },
                ],
              },
            },
          },
          socialLinksComputed: {
            website: {
              $ifNull: [
                "$websiteUrl",
                {
                  $ifNull: [
                    "$socialLinks.website",
                    { $arrayElemAt: [{ $ifNull: ["$website", []] }, 0] },
                  ],
                },
              ],
            },
            twitter: {
              $ifNull: ["$twitterUrl", "$socialLinks.twitter"],
            },
            linkedin: {
              $ifNull: ["$linkedinUrl", "$socialLinks.linkedin"],
            },
            telegram: {
              $ifNull: ["$telegramUrl", "$socialLinks.telegram"],
            },
            discord: {
              $ifNull: ["$discordUrl", "$socialLinks.discord"],
            },
          },
        },
      },
      {
        $addFields: {
          hasSocialLinksComputed: {
            $or: [
              { $gt: [{ $size: { $ifNull: ["$socialmedia", []] } }, 0] },
              { $gt: [{ $size: { $ifNull: ["$links", []] } }, 0] },
              { $ne: [{ $ifNull: ["$socialLinksComputed.website", ""] }, ""] },
              { $ne: [{ $ifNull: ["$socialLinksComputed.twitter", ""] }, ""] },
              { $ne: [{ $ifNull: ["$socialLinksComputed.linkedin", ""] }, ""] },
              { $ne: [{ $ifNull: ["$socialLinksComputed.telegram", ""] }, ""] },
              { $ne: [{ $ifNull: ["$socialLinksComputed.discord", ""] }, ""] },
            ],
          },
          hasPortfolioComputed: {
            $gt: ["$supportedProjectsCountComputed", 0],
          },
        },
      },
      {
        $addFields: {
          profileFullnessComputed: {
            $min: [
              100,
              {
                $add: [
                  { $cond: [{ $ne: [{ $ifNull: ["$name", ""] }, ""] }, 15, 0] },
                  { $cond: [{ $ne: [{ $ifNull: ["$logo", ""] }, ""] }, 10, 0] },
                  {
                    $cond: [
                      {
                        $or: [
                          { $ne: [{ $ifNull: ["$bio", ""] }, ""] },
                          { $ne: [{ $ifNull: ["$descriptionText", ""] }, ""] },
                        ],
                      },
                      15,
                      0,
                    ],
                  },
                  { $cond: [{ $ne: [{ $ifNull: ["$countryComputed", ""] }, ""] }, 10, 0] },
                  { $cond: [{ $gt: [{ $size: "$specializationsComputed" }, 0] }, 10, 0] },
                  { $cond: ["$hasSocialLinksComputed", 15, 0] },
                  { $cond: ["$hasPortfolioComputed", 20, 0] },
                  { $cond: [{ $gt: [{ $size: "$sectorsComputed" }, 0] }, 5, 0] },
                ],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          fullnessNumber: {
            $cond: [
              { $gt: ["$fullnessRawNumber", 0] },
              "$fullnessRawNumber",
              "$profileFullnessComputed",
            ],
          },
          ratingFallbackNumber: {
            $min: [
              100,
              {
                $add: [
                  { $multiply: ["$profileFullnessComputed", 0.45] },
                  { $min: [{ $multiply: ["$supportedProjectsCountComputed", 5] }, 30] },
                  { $cond: [{ $gt: ["$roiComputed", 0] }, 15, 0] },
                  { $cond: ["$hasSocialLinksComputed", 10, 0] },
                ],
              },
            ],
          },
        },
      },
      {
        $addFields: {
          ratingNumber: {
            $cond: [
              { $gt: ["$ratingRawNumber", 0] },
              "$ratingRawNumber",
              "$ratingFallbackNumber",
            ],
          },
        },
      },
    ];
  }

  private buildBackersPersonsSupportedProjectsStage(): any {
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
                    { $ifNull: ["$investmentPorfolio", []] },
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
              image: {
                $ifNull: ["$$project.image", "$$project.logo"],
              },
              symbol: "$$project.symbol",
            },
          },
        },
      },
    };
  }

  private buildBackersPersonsListProjection(): Record<string, any> {
    return {
      _id: 1,
      id: { $toString: "$_id" },
      slug: 1,
      name: 1,
      avatar: "$logo",
      logo: 1,
      type: 1,
      niche: 1,
      specialization: { $arrayElemAt: ["$specializationsComputed", 0] },
      specializations: "$specializationsComputed",
      country: "$countryComputed",
      location: "$countryComputed",
      currentRole: { $ifNull: ["$currentRole", "$type"] },
      organizationName: 1,
      organizationSlug: 1,
      organizationLogo: 1,
      rating: "$ratingNumber",
      fullness: "$fullnessNumber",
      roi: "$roiComputed",
      athRoi: "$roiComputed",
      totalInvested: "$totalInvestedNumber",
      projectsCount: "$projectsCountComputed",
      supportedProjectsCount: "$supportedProjectsCountComputed",
      supportedProjectsPreview: 1,
      sectors: "$sectorsComputed",
      tags: 1,
      socialLinks: "$socialLinksComputed",
      socialmedia: 1,
      websiteUrl: 1,
      twitterUrl: 1,
      linkedinUrl: 1,
      lastUpdatedAt: "$lastUpdatedAtComputed",
      regionData: 1,
      countryFlag: 1,
      dropstabRank: 1,
      fomoScore: "$ratingNumber",
      redFlags: 1,
      redFlagsList: 1,
      redStatus: 1,
      likes: 1,
      status: 1,
      banner: 1,
      bio: 1,
      descriptionText: 1,
      totalInvestments: 1,
      portfolioCoinsCount: 1,
      publicSalesCount: 1,
      twitterScore: 1,
      lastRoundDate: 1,
      lastFunding: 1,
    };
  }

  private resolveBackersPersonsSort(query?: BackersPersonsQuery): Record<string, 1 | -1> {
    const allowedSortFields: Record<PersonsSortBy, string> = {
      name: "name",
      rating: "ratingNumber",
      fullness: "fullnessNumber",
      projectsCount: "projectsCountComputed",
      supportedProjectsCount: "supportedProjectsCountComputed",
      roi: "roiComputed",
      country: "countryComputed",
      specialization: "specializationSort",
      lastUpdatedAt: "lastUpdatedAtComputed",
      dropstabRank: "dropstabRankNumber",
      fomoScore: "ratingNumber",
      athRoi: "roiComputed",
      totalInvested: "totalInvestedNumber",
      totalInvestments: "totalInvestedNumber",
    };
    let requestedSortBy = this.toCleanString(query?.sortBy) as PersonsSortBy;
    let requestedSortOrder = this.toCleanString(query?.sortOrder).toLowerCase();

    if (requestedSortBy.includes(",")) {
      const [field, order] = requestedSortBy.split(",");
      requestedSortBy = field as PersonsSortBy;
      requestedSortOrder = order === "1" || order === "asc" ? "asc" : "desc";
    }

    const sortField = allowedSortFields[requestedSortBy] || "ratingNumber";
    const sortOrder: 1 | -1 = requestedSortOrder === "asc" ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    if (sortField !== "ratingNumber") sort.ratingNumber = -1;
    if (sortField !== "supportedProjectsCountComputed") {
      sort.supportedProjectsCountComputed = -1;
    }
    sort.name = 1;

    return sort;
  }

  private formatPersonRoiDisplay(value: number): string {
    if (!Number.isFinite(value) || value === 0) return "";
    if (Math.abs(value) <= 20) return `${value.toFixed(2).replace(/\.00$/, "")}x`;
    return `${value > 0 ? "+" : ""}${Math.round(value)}%`;
  }

  private serializeBackersPersonListItem(item: any): any {
    const specializations = this.arrayValue(item.specializations)
      .map((value) => this.toCleanString(value))
      .filter(Boolean);
    const specialization =
      this.toCleanString(item.specialization) ||
      this.toCleanString(item.niche) ||
      specializations[0] ||
      "";
    const country = this.toCleanString(
      this.firstNonEmpty(
        item.country,
        item.location,
        item.regionData?.properties?.name,
        item.regionData?.region,
        item.regionData?.id,
      ),
    );
    const regionData =
      item.regionData && typeof item.regionData === "object"
        ? {
            ...item.regionData,
            region: this.toCleanString(item.regionData.region),
            id: this.toCleanString(item.regionData.id),
            properties: {
              ...(item.regionData.properties || {}),
              name: this.toCleanString(item.regionData.properties?.name),
            },
          }
        : item.regionData;
    const supportedProjectsPreview = Array.isArray(item.supportedProjectsPreview)
      ? item.supportedProjectsPreview.filter((project: any) =>
          Boolean(this.toCleanString(project?.name)),
        )
      : [];
    const socialLinks = Object.entries(item.socialLinks || {}).reduce(
      (acc, [key, value]) => {
        const normalizedValue = this.toCleanString(value);
        if (normalizedValue) acc[key] = normalizedValue;
        return acc;
      },
      {} as Record<string, string>,
    );
    const rating = this.roundNumber(item.rating);
    const fullness = this.roundNumber(item.fullness);
    const roi = this.roundNumber(item.roi);

    return {
      _id: item._id,
      id: String(item._id || item.id),
      slug: item.slug,
      name: this.toCleanString(item.name),
      avatar: item.avatar || item.logo,
      logo: item.logo || item.avatar || "",
      type: item.type || specialization,
      niche: specialization,
      specialization,
      specializations,
      country,
      location: item.location || country,
      currentRole: item.currentRole || item.type || specialization || undefined,
      organizationName: item.organizationName,
      organizationSlug: item.organizationSlug,
      organizationLogo: item.organizationLogo,
      rating,
      fullness,
      roi,
      roiDisplay: this.formatPersonRoiDisplay(roi),
      athRoi: roi,
      totalInvested: this.roundNumber(item.totalInvested),
      projectsCount: Math.max(0, Math.round(this.roundNumber(item.projectsCount))),
      supportedProjectsCount: Math.max(
        0,
        Math.round(this.roundNumber(item.supportedProjectsCount)),
      ),
      supportedProjectsPreview,
      sectors: this.arrayValue(item.sectors).map((value) => this.toCleanString(value)).filter(Boolean),
      tags: this.arrayValue(item.tags).map((value) => this.toCleanString(value)).filter(Boolean),
      socialLinks,
      socialmedia: item.socialmedia || [],
      websiteUrl: item.websiteUrl || socialLinks.website,
      twitterUrl: item.twitterUrl || socialLinks.twitter,
      linkedinUrl: item.linkedinUrl || socialLinks.linkedin,
      lastUpdatedAt: item.lastUpdatedAt,
      regionData,
      countryFlag: item.countryFlag,
      dropstabRank: item.dropstabRank,
      fomoScore: rating,
      redFlags: item.redFlags,
      redFlagsList: item.redFlagsList || [],
      redStatus: item.redStatus,
      likes: item.likes || [],
      status: item.status,
      banner: item.banner,
      bio: item.bio,
      descriptionText: item.descriptionText,
      totalInvestments: item.totalInvestments,
      portfolioCoinsCount: item.portfolioCoinsCount,
      publicSalesCount: item.publicSalesCount,
      twitterScore: item.twitterScore,
      lastRoundDate: item.lastRoundDate,
      lastFunding: item.lastFunding,
    };
  }

  async getBackersPersons(query: BackersPersonsQuery = {}) {
    const limit = this.parseLimit(query.limit, 100);
    const offset = this.parseOffset(query.offset);
    const page = Math.max(Number(query.page) || Math.floor(offset / limit) + 1, 1);
    const skip = (page - 1) * limit;
    const { preComputedMatch, computedMatch } =
      this.buildBackersPersonsMatchStages(query);
    const computedStages = this.buildBackersPersonsComputedStages();
    const pipeline: any[] = [];

    if (Object.keys(preComputedMatch).length) {
      pipeline.push({ $match: preComputedMatch });
    }

    pipeline.push(...computedStages);
    pipeline.push({
      $addFields: {
        specializationSort: {
          $ifNull: [{ $arrayElemAt: ["$specializationsComputed", 0] }, ""],
        },
      },
    });

    if (Object.keys(computedMatch).length) {
      pipeline.push({ $match: computedMatch });
    }

    pipeline.push(
      { $sort: this.resolveBackersPersonsSort(query) },
      {
        $facet: {
          items: [
            { $skip: skip },
            { $limit: limit },
            this.buildBackersPersonsSupportedProjectsStage(),
            { $project: this.buildBackersPersonsListProjection() },
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
    );

    const [result = {}] = await this.personModel.aggregate(pipeline).allowDiskUse(true);
    const total = Number(result.totalCount || 0);
    const items = (result.items || []).map((item: any) =>
      this.serializeBackersPersonListItem(item),
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

  async getProjectTopInvestors(projectIdOrSlug: string, query: any = {}) {
    const project = await this.findProjectForTopInvestors(projectIdOrSlug);
    const includeAll = this.parseBoolean(query.all, false);
    const limit = includeAll ? null : this.parseLimit(query.limit, 100);

    if (!project) {
      return {
        ok: false,
        error: "Project not found",
        items: [],
        investors: [],
        total: 0,
        limit,
      };
    }

    const candidates = this.collectProjectInvestorCandidates(project);
    if (!candidates.length) {
      return {
        ok: true,
        items: [],
        investors: [],
        total: 0,
        limit,
      };
    }

    const entityQuery = this.buildTopInvestorEntityQuery(candidates);
    if (!Object.keys(entityQuery).length) {
      return {
        ok: true,
        items: [],
        investors: [],
        total: 0,
        limit,
      };
    }

    const projection = {
      name: 1,
      slug: 1,
      sourceKey: 1,
      sourceId: 1,
      normalizedName: 1,
      aliases: 1,
      logo: 1,
      avatar: 1,
      image: 1,
      type: 1,
      niche: 1,
      banner: 1,
      descriptionText: 1,
      bio: 1,
      rating: 1,
      fomoScore: 1,
      ratingBreakdown: 1,
      projectsCount: 1,
      supportedProjectsCount: 1,
      portfolioCoinsCount: 1,
      totalInvestments: 1,
      roi: 1,
    };

    const [funds, persons] = await Promise.all([
      this.fundsModel.find(entityQuery, projection).lean(),
      this.personModel.find(entityQuery, projection).lean(),
    ]);

    const matchedItems = [
      ...funds.map((item: any) => this.serializeTopInvestorEntity(item, "fund", candidates)),
      ...persons.map((item: any) => this.serializeTopInvestorEntity(item, "person", candidates)),
    ]
      .filter((item) => Boolean(item?.name));

    const dedupedItems: any[] = Array.from(
      matchedItems.reduce((map, item) => {
        const key = item.candidateKey || item.id;
        const existing = map.get(key);
        const shouldReplace =
          !existing ||
          Number(item.matchScore || 0) > Number(existing.matchScore || 0) ||
          (
            Number(item.matchScore || 0) === Number(existing.matchScore || 0) &&
            Number(item.rating || 0) > Number(existing.rating || 0)
          );

        if (shouldReplace) {
          map.set(key, item);
        }

        return map;
      }, new Map<string, any>()).values(),
    );

    const sortedItems = dedupedItems
      .sort((left, right) => {
        const ratingDiff = Number(right.rating || 0) - Number(left.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        const leadDiff = Number(Boolean(right.isLead)) - Number(Boolean(left.isLead));
        if (leadDiff !== 0) return leadDiff;
        const projectsDiff = Number(right.projectsCount || 0) - Number(left.projectsCount || 0);
        if (projectsDiff !== 0) return projectsDiff;
        return left.name.localeCompare(right.name);
      })
      .map(({ candidateKey, matchScore, candidateOrder, ...item }) => item);
    const items = limit === null ? sortedItems : sortedItems.slice(0, limit);

    return {
      ok: true,
      items,
      investors: items,
      total: items.length,
      totalAvailable: sortedItems.length,
      limit,
    };
  }

  async getBackersPersonsFilterOptions(query: BackersPersonsQuery = {}) {
    const { preComputedMatch, computedMatch } =
      this.buildBackersPersonsMatchStages({
        ...query,
        specialization: [],
      });
    const pipeline: any[] = [];

    if (Object.keys(preComputedMatch).length) {
      pipeline.push({ $match: preComputedMatch });
    }

    pipeline.push(...this.buildBackersPersonsComputedStages());

    if (Object.keys(computedMatch).length) {
      pipeline.push({ $match: computedMatch });
    }

    pipeline.push(
      { $unwind: "$sectorsComputed" },
      {
        $project: {
          label: {
            $trim: { input: { $toString: "$sectorsComputed" } },
          },
        },
      },
      {
        $match: {
          label: { $nin: this.personsNonSpecializationLabels },
        },
      },
      { $group: { _id: "$label", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 9 },
      { $project: { _id: 0, label: "$_id" } },
    );

    const rows = await this.personModel.aggregate(pipeline).allowDiskUse(true);
    const sectors = rows.map((item: any) => item.label).filter(Boolean);

    return {
      sectors,
      specializations: sectors,
    };
  }

  private formatTopCounts(values: any[], limit = 3): string {
    const counts = new Map<string, number>();

    values.forEach((value) => {
      const label = this.toCleanString(value);
      if (!label) return;
      counts.set(label, (counts.get(label) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([label, count]) => `${label} (${count})`)
      .join(", ");
  }

  private formatTopProjects(projectGroups: any[], limit = 5): string {
    const counts = new Map<string, number>();

    projectGroups
      .flatMap((group) => this.arrayValue(group))
      .forEach((project) => {
        const label = this.toCleanString(
          project?.name || project?.projectName || project?.symbol || project?.slug,
        );
        if (!label) return;
        counts.set(label, (counts.get(label) || 0) + 1);
      });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([label]) => label)
      .join(", ");
  }

  private serializePersonsSectorAnalytics(items: any[] = []) {
    return items.map((item) => ({
      label: this.toCleanString(item?.label),
      value: this.toFiniteNumber(item?.value),
      topRoles: this.formatTopCounts(this.arrayValue(item?.roles)),
      keyRegions: this.formatTopCounts(this.arrayValue(item?.countries)),
      sectors: this.toCleanString(item?.label),
      topProjects: this.formatTopProjects(this.arrayValue(item?.projects)),
    }));
  }

  async getBackersPersonsAnalytics(query: BackersPersonsQuery = {}) {
    const preparedCharts = this.hasBackersPersonsAnalyticsScope(query)
      ? null
      : await this.personsAnalyticsSnapshotService.getLatestPreparedCharts();
    const { preComputedMatch, computedMatch } =
      this.buildBackersPersonsMatchStages(query);
    const pipeline: any[] = [];

    if (Object.keys(preComputedMatch).length) {
      pipeline.push({ $match: preComputedMatch });
    }

    pipeline.push(...this.buildBackersPersonsComputedStages());

    if (Object.keys(computedMatch).length) {
      pipeline.push({ $match: computedMatch });
    }

    pipeline.push({
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalPersons: { $sum: 1 },
              totalProjectsSupported: { $sum: "$supportedProjectsCountComputed" },
              averageRating: { $avg: "$ratingNumber" },
              averageFullness: { $avg: "$fullnessNumber" },
              withSocialLinks: {
                $sum: { $cond: ["$hasSocialLinksComputed", 1, 0] },
              },
              withPortfolio: {
                $sum: { $cond: ["$hasPortfolioComputed", 1, 0] },
              },
            },
          },
          {
            $project: {
              _id: 0,
              totalPersons: 1,
              totalProjectsSupported: { $round: ["$totalProjectsSupported", 0] },
              averageRating: { $round: ["$averageRating", 1] },
              averageFullness: { $round: ["$averageFullness", 1] },
              withSocialLinks: 1,
              withPortfolio: 1,
            },
          },
        ],
        personsBySpecialization: [
          { $unwind: "$specializationsComputed" },
          {
            $project: {
              label: {
                $trim: { input: { $toString: "$specializationsComputed" } },
              },
            },
          },
          {
            $match: {
              label: { $nin: this.personsNonSpecializationLabels },
            },
          },
          { $group: { _id: "$label", value: { $sum: 1 } } },
          { $sort: { value: -1, _id: 1 } },
          { $limit: 12 },
          { $project: { _id: 0, label: "$_id", value: 1 } },
        ],
        topSectors: [
          ...(preparedCharts?.topSectors?.length
            ? [{ $match: { _id: { $exists: false } } }]
            : []),
          { $unwind: "$sectorsComputed" },
          {
            $project: {
              label: { $trim: { input: { $toString: "$sectorsComputed" } } },
              country: "$countryComputed",
              role: {
                $ifNull: [
                  "$currentRole",
                  {
                    $ifNull: [
                      "$position",
                      {
                        $ifNull: [
                          "$type",
                          {
                            $ifNull: [
                              { $arrayElemAt: ["$specializationsComputed", 0] },
                              "$niche",
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              projects: {
                $cond: [
                  { $gt: [{ $size: { $ifNull: ["$portfolioCoins", []] } }, 0] },
                  "$portfolioCoins",
                  { $ifNull: ["$investmentPorfolio", []] },
                ],
              },
            },
          },
          {
            $match: {
              label: { $nin: ["", "Unknown", "unknown", "N/A", "n/a", "all"] },
            },
          },
          {
            $group: {
              _id: "$label",
              value: { $sum: 1 },
              countries: { $push: "$country" },
              roles: { $push: "$role" },
              projects: { $push: "$projects" },
            },
          },
          { $sort: { value: -1, _id: 1 } },
          { $limit: 12 },
          {
            $project: {
              _id: 0,
              label: "$_id",
              value: 1,
              countries: 1,
              roles: 1,
              projects: 1,
            },
          },
        ],
        personsByCountry: [
          ...(preparedCharts?.personsByCountry?.length
            ? [{ $match: { _id: { $exists: false } } }]
            : []),
          {
            $project: {
              country: {
                $cond: [
                  { $eq: [{ $trim: { input: { $toString: "$countryComputed" } } }, ""] },
                  "Unknown",
                  "$countryComputed",
                ],
              },
              countryCode: "$regionData.id",
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
      },
    });

    const [result = {}] = await this.personModel.aggregate(pipeline).allowDiskUse(true);
    const summary = result.summary?.[0] || {
      totalPersons: 0,
      totalProjectsSupported: 0,
      averageRating: 0,
      averageFullness: 0,
      withSocialLinks: 0,
      withPortfolio: 0,
    };
    const filterOptions = await this.getBackersPersonsFilterOptions(query);
    const topSectors = preparedCharts?.topSectors?.length
      ? preparedCharts.topSectors
      : this.serializePersonsSectorAnalytics(result.topSectors || []);
    const personsByCountry = preparedCharts?.personsByCountry?.length
      ? preparedCharts.personsByCountry
      : result.personsByCountry || [];

    return {
      summary,
      personsBySpecialization: result.personsBySpecialization || [],
      topSectors,
      personsByCountry,
      filterOptions,
    };
  }

  async list(query: any): Promise<any> {
    const filter: any = {};
    if (query.source) filter.source = query.source;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: "i" } },
        { slug: { $regex: query.search, $options: "i" } },
      ];
    }

    const limit = this.parseLimit(query.limit, 50);
    const offset = this.parseOffset(query.offset);
    const sort: Record<string, 1 | -1> = {};
    sort[this.safeSortField(query.sort) || "lastDetailParsedAt"] = -1;

    const projection = this.buildProjection(query);
    const [investors, total] = await Promise.all([
      this.investorModel.find(filter, projection).sort(sort).skip(offset).limit(limit).lean(),
      this.investorModel.countDocuments(filter),
    ]);

    return {
      ok: true,
      total,
      limit,
      offset,
      investors,
    };
  }

  async getBySlug(slug: string, query: any): Promise<any> {
    const projection = this.buildProjection(query);
    const investor =
      (await this.investorModel
        .findOne(
          {
            $or: [
              { slug },
              { "sourceRefs.key": slug },
              { detailUrl: { $regex: `/investors/${this.escapeRegExp(slug)}$`, $options: "i" } },
            ],
          },
          projection,
        )
        .lean()) || (await this.findInvestorBySlugifiedName(slug, projection));

    if (!investor) {
      return { ok: false, error: "Investor not found" };
    }

    return { ok: true, investor };
  }

  async getInvestorProjects(slug: string, query: any): Promise<any> {
    const investor = await this.investorModel
      .findOne(
        { $or: [{ slug }, { "sourceRefs.key": slug }] },
        { name: 1, slug: 1, portfolio: 1, fundraisingRounds: 1 },
      )
      .lean();

    if (!investor) {
      return { ok: false, error: "Investor not found" };
    }

    const includeRounds = this.parseBoolean(query.includeRounds, true);
    const onlyLinked = this.parseBoolean(query.onlyLinked, false);
    const portfolio = (investor.portfolio || []).filter((item: any) =>
      onlyLinked ? Boolean(item.matchedProjectId) : true,
    );
    const rounds = includeRounds
      ? (investor.fundraisingRounds || []).filter((item: any) =>
          onlyLinked ? Boolean(item.matchedProjectId || item.matchedFundingRoundId) : true,
        )
      : undefined;

    return {
      ok: true,
      investor: {
        name: investor.name,
        slug: investor.slug,
      },
      portfolioCount: portfolio.length,
      portfolio,
      fundraisingRoundsCount: rounds?.length,
      fundraisingRounds: rounds,
    };
  }

  async getPortfolioGeography(slug: string, query: any): Promise<any> {
    const includeUnknown = this.parseBoolean(query.includeUnknown, true);
    const minCoInvestors = this.parseLimit(query.minCoInvestors, 1);
    const selectedOnly = this.parseBoolean(query.selectedOnly, false);
    const selectedProjectSlug = this.slugify(query.projectSlug || "");
    const selectedRegion = this.toCleanString(query.region);
    const cacheKey = this.portfolioGeographyCacheKey({
      slug: this.slugify(slug) || slug,
      includeUnknown,
      minCoInvestors,
      selectedOnly,
      selectedProjectSlug,
      selectedRegion,
    });
    const cachedGeography = this.getPortfolioGeographyCache(cacheKey);
    if (cachedGeography) return cachedGeography;

    const investorProjection = {
      name: 1,
      slug: 1,
      logo: 1,
      portfolio: 1,
      fundraisingRounds: 1,
    };
    const investor =
      (await this.investorModel
        .findOne(
          {
            $or: [
              { slug },
              { "sourceRefs.key": slug },
              { detailUrl: { $regex: `/investors/${this.escapeRegExp(slug)}$`, $options: "i" } },
            ],
          },
          investorProjection,
        )
        .lean()) || (await this.findInvestorBySlugifiedName(slug, investorProjection));

    if (!investor) {
      return this.setPortfolioGeographyCache(cacheKey, this.emptyPortfolioGeography(slug, "Investor not found"));
    }

    const sourceProjects = this.buildInvestorProjectMap(investor);
    const sourceProjectRows = Array.from(sourceProjects.values());
    const selectedSourceProject = selectedProjectSlug
      ? sourceProjectRows.find((project) => project.key === selectedProjectSlug || project.projectSlug === selectedProjectSlug)
      : undefined;
    const buildSelectedOnlyResponse = (projectSlugValue: string | null, investors: any[] = []) => {
      const summary = {
        portfolioProjects: sourceProjects.size,
        projectsWithCoInvestors: 0,
        totalCoInvestors: 0,
        investorsWithLocation: 0,
        investorsWithoutLocation: 0,
        regionCoveragePercent: 0,
      };

      return {
        ok: true,
        investor: {
          slug: investor.slug || slug,
          name: investor.name || "",
          logo: investor.logo || "",
        },
        summary,
        regions: [],
        projects: [],
        selected: {
          projectSlug: projectSlugValue,
          region: selectedRegion || null,
          investors,
        },
        dataQuality: { ...summary },
      };
    };

    if (selectedOnly && !selectedProjectSlug) {
      return this.setPortfolioGeographyCache(cacheKey, buildSelectedOnlyResponse(null));
    }

    if (selectedOnly && !selectedSourceProject) {
      return this.setPortfolioGeographyCache(cacheKey, buildSelectedOnlyResponse(selectedProjectSlug || null));
    }

    const projectsForMatching = selectedOnly && selectedSourceProject ? [selectedSourceProject] : sourceProjectRows;
    const projectKeys = projectsForMatching.map((project) => project.key).filter(Boolean);
    const projectNames = projectsForMatching.map((project) => project.projectName).filter(Boolean);
    const candidateQuery = this.buildCoInvestorCandidateQuery(projectKeys, projectNames);
    const allInvestors = await this.findPortfolioGeographyCandidates(
      candidateQuery,
      projectKeys,
      projectNames,
      selectedOnly,
    );

    const projectRows = projectsForMatching.map((project) => ({
      ...project,
      coInvestors: new Map<string, any>(),
    }));
    const projectRowsByKey = new Map(projectRows.map((project) => [project.key, project]));

    for (const candidate of allInvestors) {
      if (this.sameInvestor(candidate, investor)) continue;
      const candidateProjects = this.buildInvestorProjectKeySet(candidate);

      for (const [projectKey, matchedBy] of candidateProjects.entries()) {
        const project = projectRowsByKey.get(projectKey);
        if (!project) continue;
        const key = candidate.slug || candidate.name;
        if (!key) continue;
        project.coInvestors.set(key, {
          ...candidate,
          matchedBy,
        });
      }
    }

    const selectedProject = selectedProjectSlug
      ? projectRows.find((project) => project.key === selectedProjectSlug || project.projectSlug === selectedProjectSlug)
      : undefined;

    if (selectedOnly) {
      const selectedInvestors = this.serializeSelectedGeographyInvestors(
        selectedProject,
        selectedRegion,
        includeUnknown,
      );
      return this.setPortfolioGeographyCache(
        cacheKey,
        buildSelectedOnlyResponse(selectedProject?.projectSlug || selectedProjectSlug || null, selectedInvestors),
      );
    }

    const allUniqueCoInvestors = new Map<string, any>();
    for (const project of projectRows) {
      for (const coInvestor of project.coInvestors.values()) {
        const key = coInvestor.slug || coInvestor.name;
        if (key) allUniqueCoInvestors.set(key, coInvestor);
      }
    }

    const investorsWithLocation = Array.from(allUniqueCoInvestors.values()).filter((item) =>
      Boolean(this.cleanLocation(item)),
    ).length;
    const totalCoInvestors = allUniqueCoInvestors.size;
    const investorsWithoutLocation = Math.max(0, totalCoInvestors - investorsWithLocation);
    const regionCoveragePercent = this.percent(investorsWithLocation, totalCoInvestors);

    const visibleProjectRows = projectRows
      .map((project) => this.serializeGeographyProject(project, includeUnknown))
      .filter((project) => project.coInvestorCount >= minCoInvestors)
      .sort((a, b) => b.coInvestorCount - a.coInvestorCount || a.projectName.localeCompare(b.projectName));

    const regions = this.buildGeographyRegions(projectRows, includeUnknown);
    const selectedInvestors = this.serializeSelectedGeographyInvestors(
      selectedProject,
      selectedRegion,
      includeUnknown,
    );

    const summary = {
      portfolioProjects: sourceProjects.size,
      projectsWithCoInvestors: projectRows.filter((project) => project.coInvestors.size > 0).length,
      totalCoInvestors,
      investorsWithLocation,
      investorsWithoutLocation,
      regionCoveragePercent,
    };

    return this.setPortfolioGeographyCache(
      cacheKey,
      {
        ok: true,
        investor: {
          slug: investor.slug || slug,
          name: investor.name || "",
          logo: investor.logo || "",
        },
        summary,
        regions,
        projects: visibleProjectRows,
        selected: {
          projectSlug: selectedProject?.projectSlug || selectedProjectSlug || null,
          region: selectedRegion || null,
          investors: selectedInvestors,
        },
        dataQuality: { ...summary },
      },
    );
  }

  private buildProjection(query: any): Record<string, 0> {
    const projection: Record<string, 0> = {};
    if (!this.parseBoolean(query.includePortfolio, false)) projection.portfolio = 0;
    if (!this.parseBoolean(query.includeRounds, false)) projection.fundraisingRounds = 0;
    if (!this.parseBoolean(query.includeCoInvestors, false)) projection.coInvestors = 0;
    projection.rawDetailData = 0;
    projection.raw = 0;
    projection.rawTableData = 0;
    return projection;
  }

  private async findInvestorBySlugifiedName(slug: string, projection: any): Promise<any | null> {
    const requestedSlug = this.slugify(slug);
    if (!requestedSlug) return null;

    const candidates = await this.investorModel.find({ source: "dropstab" }, projection).lean();
    return (
      candidates.find((candidate: any) => this.slugify(candidate?.name) === requestedSlug) ||
      candidates.find((candidate: any) => this.slugify(candidate?.slug) === requestedSlug) ||
      null
    );
  }

  private buildCoInvestorCandidateQuery(projectKeys: string[], projectNames: string[]): any {
    const or: any[] = [];
    if (projectKeys.length) {
      or.push(
        { "portfolio.projectSlug": { $in: projectKeys } },
        { "portfolio.slug": { $in: projectKeys } },
        { "fundraisingRounds.projectSlug": { $in: projectKeys } },
        { "fundraisingRounds.slug": { $in: projectKeys } },
      );
    }
    if (projectNames.length) {
      or.push(
        { "portfolio.name": { $in: projectNames } },
        { "portfolio.projectName": { $in: projectNames } },
        { "fundraisingRounds.name": { $in: projectNames } },
        { "fundraisingRounds.projectName": { $in: projectNames } },
      );
    }

    return or.length ? { source: "dropstab", $or: or } : { source: "dropstab", _id: { $exists: false } };
  }

  private async findPortfolioGeographyCandidates(
    candidateQuery: any,
    projectKeys: string[],
    projectNames: string[],
    selectedOnly: boolean,
  ): Promise<any[]> {
    const baseProjection: any = {
      name: 1,
      slug: 1,
      logo: 1,
      country: 1,
      location: 1,
      category: 1,
      type: 1,
      ventureType: 1,
      niche: 1,
    };

    if (selectedOnly) {
      return this.investorModel
        .find(
          candidateQuery,
          {
            ...baseProjection,
            portfolio: 1,
            fundraisingRounds: 1,
            coInvestors: 1,
            stats: 1,
          },
        )
        .lean();
    }

    return this.investorModel
      .aggregate([
        { $match: candidateQuery },
        {
          $project: {
            ...baseProjection,
            portfolio: this.geographyMatchedItemsExpression("portfolio", projectKeys, projectNames),
            fundraisingRounds: this.geographyMatchedItemsExpression("fundraisingRounds", projectKeys, projectNames),
          },
        },
      ])
      .allowDiskUse(true)
      .exec();
  }

  private geographyMatchedItemsExpression(field: "portfolio" | "fundraisingRounds", projectKeys: string[], projectNames: string[]): any {
    const conditions: any[] = [];

    if (projectKeys.length) {
      conditions.push(
        { $in: [`$$item.projectSlug`, projectKeys] },
        { $in: [`$$item.slug`, projectKeys] },
      );
    }

    if (projectNames.length) {
      conditions.push(
        { $in: [`$$item.name`, projectNames] },
        { $in: [`$$item.projectName`, projectNames] },
      );
    }

    if (!conditions.length) return [];

    return {
      $filter: {
        input: { $ifNull: [`$${field}`, []] },
        as: "item",
        cond: { $or: conditions },
      },
    };
  }

  private emptyPortfolioGeography(slug: string, error?: string): any {
    const summary = {
      portfolioProjects: 0,
      projectsWithCoInvestors: 0,
      totalCoInvestors: 0,
      investorsWithLocation: 0,
      investorsWithoutLocation: 0,
      regionCoveragePercent: 0,
    };

    return {
      ok: !error,
      error,
      investor: {
        slug,
        name: "",
        logo: "",
      },
      summary,
      regions: [],
      projects: [],
      selected: {
        projectSlug: null,
        region: null,
        investors: [],
      },
      dataQuality: { ...summary },
    };
  }

  private portfolioGeographyCacheKey(value: Record<string, any>): string {
    return JSON.stringify(value);
  }

  private getPortfolioGeographyCache(key: string): any | null {
    const cached = this.portfolioGeographyCache.get(key);
    if (!cached) return null;

    if (cached.expiresAt <= Date.now()) {
      this.portfolioGeographyCache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setPortfolioGeographyCache(key: string, data: any): any {
    const now = Date.now();

    for (const [cachedKey, cachedValue] of this.portfolioGeographyCache.entries()) {
      if (cachedValue.expiresAt <= now) this.portfolioGeographyCache.delete(cachedKey);
    }

    while (this.portfolioGeographyCache.size >= 200) {
      const oldestKey = this.portfolioGeographyCache.keys().next().value;
      if (!oldestKey) break;
      this.portfolioGeographyCache.delete(oldestKey);
    }

    this.portfolioGeographyCache.set(key, {
      expiresAt: now + this.portfolioGeographyCacheTtlMs,
      data,
    });

    return data;
  }

  private buildInvestorProjectMap(investor: any): Map<string, any> {
    const projects = new Map<string, any>();
    const portfolio = Array.isArray(investor?.portfolio) ? investor.portfolio : [];
    const fallbackRounds = Array.isArray(investor?.fundraisingRounds) ? investor.fundraisingRounds : [];
    const sourceItems = portfolio.length ? portfolio : fallbackRounds;

    for (const item of sourceItems) {
      const key = this.projectKey(item);
      if (!key || projects.has(key)) continue;
      projects.set(key, {
        key,
        projectSlug: this.projectSlug(item) || key,
        projectName: this.projectName(item) || key,
        logo: this.toCleanString(this.firstNonEmpty(item?.logo, item?.image, item?.projectLogo)),
        symbol: this.toCleanString(item?.symbol || item?.ticker),
        category: this.toCleanString(item?.category || item?.sector || item?.niche || item?.stage || item?.round),
        projectUrl: this.toCleanString(item?.projectUrl),
      });
    }

    return projects;
  }

  private buildInvestorProjectKeySet(investor: any): Map<string, string> {
    const keys = new Map<string, string>();
    for (const item of Array.isArray(investor?.portfolio) ? investor.portfolio : []) {
      const key = this.projectKey(item);
      if (key) keys.set(key, keys.has(key) ? `${keys.get(key)}+portfolio` : "portfolio");
    }
    for (const item of Array.isArray(investor?.fundraisingRounds) ? investor.fundraisingRounds : []) {
      const key = this.projectKey(item);
      if (!key) continue;
      const existing = keys.get(key);
      keys.set(key, existing ? `${existing}+fundraisingRounds` : "fundraisingRounds");
    }
    return keys;
  }

  private geographyPreviewProject(item: any): any | null {
    const name = this.projectName(item);
    if (!name) return null;

    return {
      id: this.toCleanString(item?._id || item?.id || item?.projectSlug || item?.slug || name),
      name,
      slug: this.projectSlug(item),
      logo: this.toCleanString(this.firstNonEmpty(item?.logo, item?.image, item?.projectLogo)),
      image: this.toCleanString(this.firstNonEmpty(item?.image, item?.logo, item?.projectLogo)),
      symbol: this.toCleanString(item?.symbol || item?.ticker),
      category: this.toCleanString(item?.category || item?.sector || item?.niche || item?.stage || item?.round),
    };
  }

  private geographyPreviewInvestor(item: any): any | null {
    const name = this.toCleanString(item?.name);
    if (!name) return null;

    return {
      id: this.toCleanString(item?._id || item?.id || item?.slug || item?.investorSlug || name),
      name,
      slug: this.toCleanString(item?.slug || item?.investorSlug),
      logo: this.toCleanString(item?.logo || item?.image),
      image: this.toCleanString(item?.image || item?.logo),
      category: this.toCleanString(item?.category || item?.type || item?.ventureType || item?.niche),
    };
  }

  private uniqueGeographyPreviewItems(items: any[], limit = 6): any[] {
    const seen = new Set<string>();
    const result: any[] = [];

    for (const item of items) {
      if (!item?.name) continue;
      const key = String(item.slug || item.id || item.name).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(item);
      if (result.length >= limit) break;
    }

    return result;
  }

  private serializeGeographyProject(project: any, includeUnknown: boolean): any {
    const coInvestors = Array.from(project.coInvestors.values()).filter((investor: any) =>
      includeUnknown ? true : this.regionForInvestor(investor) !== "Unknown",
    );
    const regionBuckets = new Map<string, { investorsCount: number; investors: any[] }>();

    for (const coInvestor of coInvestors) {
      const region = this.regionForInvestor(coInvestor);
      const bucket = regionBuckets.get(region) || { investorsCount: 0, investors: [] };
      bucket.investorsCount += 1;
      bucket.investors.push(coInvestor);
      regionBuckets.set(region, bucket);
    }

    const regionCounts = this.sortRegions(
      Array.from(regionBuckets.entries()).map(([region, bucket]) => ({
        region,
        investorsCount: bucket.investorsCount,
        percent: this.percent(bucket.investorsCount, coInvestors.length),
        coInvestorsPreview: this.uniqueGeographyPreviewItems(
          bucket.investors
            .sort((a: any, b: any) => this.toCleanString(a?.name).localeCompare(this.toCleanString(b?.name)))
            .map((investor: any) => this.geographyPreviewInvestor(investor))
            .filter(Boolean),
        ),
      })),
    );

    return {
      projectSlug: project.projectSlug || project.key,
      projectName: project.projectName || project.key,
      logo: project.logo || "",
      symbol: project.symbol || "",
      category: project.category || "",
      coInvestorCount: coInvestors.length,
      regionCounts,
    };
  }

  private buildGeographyRegions(projectRows: Array<any>, includeUnknown: boolean): any[] {
    const buckets = new Map<string, { investors: Set<string>; projects: Set<string> }>();

    for (const project of projectRows) {
      for (const investor of project.coInvestors.values()) {
        const region = this.regionForInvestor(investor);
        if (!includeUnknown && region === "Unknown") continue;
        if (!buckets.has(region)) {
          buckets.set(region, { investors: new Set<string>(), projects: new Set<string>() });
        }
        const bucket = buckets.get(region);
        bucket?.investors.add(investor.slug || investor.name);
        bucket?.projects.add(project.projectSlug || project.key);
      }
    }

    const total = Array.from(buckets.values()).reduce((sum, bucket) => sum + bucket.investors.size, 0);

    return this.sortRegions(
      Array.from(buckets.entries()).map(([region, bucket]) => ({
        region,
        coInvestorCount: bucket.investors.size,
        projectCount: bucket.projects.size,
        percent: this.percent(bucket.investors.size, total),
      })),
    );
  }

  private serializeSelectedGeographyInvestors(project: any, selectedRegion: string, includeUnknown: boolean): any[] {
    if (!project) return [];

    return Array.from(project.coInvestors.values())
      .filter((investor: any) => {
        const region = this.regionForInvestor(investor);
        if (!includeUnknown && region === "Unknown") return false;
        return selectedRegion ? region === selectedRegion : true;
      })
      .map((investor: any) => {
        const country = this.cleanLocation(investor);
        const portfolioProjects = Array.isArray(investor.portfolio) && investor.portfolio.length
          ? investor.portfolio
          : this.arrayValue(investor.fundraisingRounds);
        const coInvestors = this.arrayValue(investor.coInvestors);

        return {
          slug: investor.slug || "",
          name: investor.name || "",
          logo: investor.logo || "",
          category: this.toCleanString(investor.category || investor.type || investor.ventureType || investor.niche),
          country: country || null,
          region: this.regionForInvestor(investor),
          matchedBy: investor.matchedBy || "portfolio",
          portfolioProjectsCount:
            this.toFiniteNumber(investor?.stats?.portfolioProjects) ||
            portfolioProjects.length,
          portfolioProjectsPreview: this.uniqueGeographyPreviewItems(
            portfolioProjects
              .map((item: any) => this.geographyPreviewProject(item))
              .filter(Boolean),
          ),
          coInvestmentsCount: coInvestors.length,
          coInvestorsPreview: this.uniqueGeographyPreviewItems(
            coInvestors
              .map((item: any) => this.geographyPreviewInvestor(item))
              .filter(Boolean),
          ),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private sameInvestor(a: any, b: any): boolean {
    return Boolean((a?._id && b?._id && String(a._id) === String(b._id)) || (a?.slug && b?.slug && a.slug === b.slug));
  }

  private projectKey(item: any): string {
    return this.projectSlug(item) || this.slugify(this.projectName(item));
  }

  private projectSlug(item: any): string {
    return this.slugify(item?.projectSlug || item?.slug || this.slugFromUrl(item?.projectUrl));
  }

  private projectName(item: any): string {
    return this.toCleanString(item?.projectName || item?.name || item?.title);
  }

  private slugFromUrl(value: any): string {
    const match = String(value || "").match(/\/(?:coins|ico)\/([^/?#]+)/i);
    return match?.[1] || "";
  }

  private regionForInvestor(investor: any): string {
    const location = this.cleanLocation(investor);
    if (!location) return "Unknown";
    return this.countryRegionMap[this.slugify(location)] || "Unknown";
  }

  private cleanLocation(investor: any): string {
    return this.toCleanString(investor?.country) || this.toCleanString(investor?.location);
  }

  private sortRegions<T extends { region: string; coInvestorCount?: number; investorsCount?: number }>(rows: T[]): T[] {
    return rows.sort((a, b) => {
      const orderDiff = this.regionOrder.indexOf(a.region) - this.regionOrder.indexOf(b.region);
      if (orderDiff !== 0) return orderDiff;
      const aCount = a.coInvestorCount ?? a.investorsCount ?? 0;
      const bCount = b.coInvestorCount ?? b.investorsCount ?? 0;
      return bCount - aCount || a.region.localeCompare(b.region);
    });
  }

  private async findProjectForTopInvestors(projectIdOrSlug: string): Promise<any | null> {
    const identifier = this.toCleanString(projectIdOrSlug);
    if (!identifier) return null;

    const clauses: any[] = [
      { slug: identifier },
      { sourceId: identifier },
      { dropstabId: identifier },
      { icodropsId: identifier },
      { "rawIcoData.slug": identifier },
      { "rawIcoData.sourceId": identifier },
      { "rawIcoData.dropstabSlug": identifier },
      { "rawIcoData.dropstabId": identifier },
      { "rawIcoData.icodropsId": identifier },
    ];

    if (Types.ObjectId.isValid(identifier)) {
      clauses.unshift({ _id: new Types.ObjectId(identifier) });
    }

    return this.projectModel
      .findOne(
        { $or: clauses },
        {
          investors: 1,
          fundraising: 1,
          fundsRounds: 1,
          rawIcoData: 1,
        },
      )
      .lean();
  }

  private collectProjectInvestorCandidates(project: any): any[] {
    const rawIcoData = project?.rawIcoData || {};
    const rawFundraising = rawIcoData?.fundraising || {};
    const projectLevelValues = [
      ...this.arrayValue(project?.investors),
      ...this.arrayValue(project?.fundraising?.investors),
      ...this.arrayValue(rawIcoData?.uiInvestors),
      ...this.arrayValue(rawIcoData?.investors),
      ...this.arrayValue(rawFundraising?.investors),
    ];
    const roundLevelValues = [
      ...this.arrayValue(project?.fundraising).flatMap((round: any) => this.arrayValue(round?.investors)),
      ...this.arrayValue(project?.fundsRounds).flatMap((round: any) => this.arrayValue(round?.investors)),
      ...this.arrayValue(rawFundraising?.rounds).flatMap((round: any) => this.arrayValue(round?.investors)),
      ...this.arrayValue(rawIcoData?.saleRounds).flatMap((round: any) => this.arrayValue(round?.investors)),
    ];
    const values = projectLevelValues.length ? projectLevelValues : roundLevelValues;
    const seen = new Set<string>();
    const result: any[] = [];

    values.forEach((value, index) => {
      const candidate = this.normalizeProjectInvestorCandidate(value, index);
      const key =
        candidate.objectId ||
        candidate.slug ||
        candidate.sourceKey ||
        this.normalizeName(candidate.name);

      if (!key || seen.has(key)) return;
      seen.add(key);
      result.push(candidate);
    });

    return result;
  }

  private normalizeProjectInvestorCandidate(value: any, index: number): any {
    if (Types.ObjectId.isValid(value)) {
      return {
        objectId: String(value),
        name: "",
        slug: "",
        sourceKey: "",
        isLead: false,
        order: index,
      };
    }

    const source = typeof value === "object" && value ? value : {};
    const rawName = typeof value === "string" ? value : this.firstNonEmpty(source.name, source.title, source.label);
    const rawSlug = this.firstNonEmpty(source.slug, source.sourceKey, source.key, source.id);
    const objectId = this.firstNonEmpty(source._id, source.id);

    return {
      objectId: Types.ObjectId.isValid(objectId) ? String(objectId) : "",
      name: this.toCleanString(rawName),
      slug: this.slugify(rawSlug || rawName),
      sourceKey: this.toCleanString(source.sourceKey || source.key),
      isLead: Boolean(source.isLead || source.lead),
      order: index,
    };
  }

  private buildTopInvestorEntityQuery(candidates: any[]): Record<string, any> {
    const objectIds = this.uniqueStrings(candidates.map((item) => item.objectId))
      .filter((value) => Types.ObjectId.isValid(value))
      .map((value) => new Types.ObjectId(value));
    const names = this.uniqueStrings(candidates.map((item) => item.name));
    const slugs = this.uniqueStrings(candidates.flatMap((item) => [item.slug, item.sourceKey]));
    const normalizedNames = this.uniqueStrings(names.map((name) => this.normalizeName(name)));
    const or: any[] = [];

    if (objectIds.length) {
      or.push({ _id: { $in: objectIds } });
    }

    if (slugs.length) {
      or.push(
        { slug: { $in: slugs } },
        { sourceKey: { $in: slugs } },
        { sourceId: { $in: slugs } },
      );
    }

    if (normalizedNames.length) {
      or.push({ normalizedName: { $in: normalizedNames } });
    }

    if (names.length) {
      const exactNameRegexes = names.map((name) => new RegExp(`^${this.escapeRegExp(name)}$`, "i"));
      or.push(
        { name: { $in: exactNameRegexes } },
        { aliases: { $in: names } },
      );
    }

    return or.length ? { $or: or } : {};
  }

  private serializeTopInvestorEntity(entity: any, entityType: "fund" | "person", candidates: any[]): any {
    const match = candidates
      .map((item) => ({
        candidate: item,
        score: this.topInvestorCandidateMatchScore(item, entity),
      }))
      .filter((item) => item.score > 0)
      .sort((left, right) => {
        const scoreDiff = right.score - left.score;
        if (scoreDiff !== 0) return scoreDiff;
        return Number(left.candidate.order || 0) - Number(right.candidate.order || 0);
      })[0];
    const candidate = match?.candidate;
    if (!candidate) return null;

    const id = String(entity?._id || entity?.id || "");
    const rating = this.roundNumber(
      this.firstNonEmpty(entity?.rating, entity?.fomoScore, entity?.ratingBreakdown?.score),
    );
    const routeId = entityType === "fund" ? entity?.slug || id : id;

    return {
      _id: entity._id,
      id,
      entityType,
      type: entity.type || entity.niche || (entityType === "fund" ? "Fund" : "Person"),
      name: this.toCleanString(entity.name),
      slug: entity.slug,
      logo: entity.logo || entity.avatar || entity.image || "",
      description: entity.banner || entity.type || entity.niche || entity.descriptionText || entity.bio || "",
      rating,
      fomoScore: rating,
      isLead: Boolean(candidate?.isLead),
      candidateKey: this.topInvestorCandidateKey(candidate),
      candidateOrder: candidate.order,
      matchScore: match.score,
      projectsCount: this.roundNumber(
        this.firstNonEmpty(entity.projectsCount, entity.supportedProjectsCount, entity.portfolioCoinsCount),
      ),
      totalInvestments: entity.totalInvestments,
      roi: entity.roi,
      url: entityType === "fund"
        ? `/crypto/funds/${routeId}`
        : `/crypto/persons/${routeId}`,
    };
  }

  private candidateMatchesEntity(candidate: any, entity: any): boolean {
    return this.topInvestorCandidateMatchScore(candidate, entity) > 0;
  }

  private topInvestorCandidateMatchScore(candidate: any, entity: any): number {
    const entityId = String(entity?._id || entity?.id || "");
    if (candidate.objectId && candidate.objectId === entityId) return 100;

    const candidateName = this.toCleanString(candidate.name);
    const entityName = this.toCleanString(entity?.name);
    if (candidateName && entityName && candidateName.toLowerCase() === entityName.toLowerCase()) return 90;

    const candidateNormalizedName = this.normalizeName(candidate.name);
    if (candidateNormalizedName && candidateNormalizedName === this.normalizeName(entity?.name)) return 85;

    const candidateSlugs = [candidate.slug, candidate.sourceKey]
      .map((value) => this.toCleanString(value))
      .filter(Boolean);
    const entitySlugs = [
      entity?.slug,
      entity?.sourceKey,
      entity?.sourceId,
    ]
      .map((value) => this.toCleanString(value))
      .filter(Boolean);
    if (candidateSlugs.some((value) => entitySlugs.includes(value))) return 80;

    const entityAliases = Array.isArray(entity?.aliases)
      ? entity.aliases.map((alias: any) => this.normalizeName(alias)).filter(Boolean)
      : [];
    if (candidateNormalizedName && entityAliases.includes(candidateNormalizedName)) return 40;

    return 0;
  }

  private topInvestorCandidateKey(candidate: any): string {
    return (
      candidate.objectId ||
      candidate.slug ||
      candidate.sourceKey ||
      this.normalizeName(candidate.name)
    );
  }

  private uniqueStrings(values: any[]): string[] {
    return Array.from(
      new Set(
        values
          .map((value) => this.toCleanString(value))
          .filter(Boolean),
      ),
    );
  }

  private normalizeName(value: any): string {
    return this.toCleanString(value)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private percent(value: number, total: number): number {
    if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) return 0;
    return Number(((value / total) * 100).toFixed(1));
  }

  private arrayValue(value: any): any[] {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  private firstNonEmpty(...values: any[]): any {
    return values.find((value) => Boolean(this.toCleanString(value)));
  }

  private roundNumber(value: any): number {
    const numberValue = this.toFiniteNumber(value);
    return Math.round(numberValue * 100) / 100;
  }

  private toCleanString(value: any): string {
    if (value === undefined || value === null) return "";
    if (typeof value === "object") {
      return this.toCleanString(value.name || value.title || value.value);
    }
    const normalized = String(value).trim();
    if (!normalized || normalized === "[object Object]" || normalized.toLowerCase() === "unknown") return "";
    return normalized;
  }

  private toFiniteNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private slugify(value: any): string {
    return this.toCleanString(value)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private parseLimit(value: any, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 500) : fallback;
  }

  private parseOffset(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  }

  private parseBoolean(value: any, fallback: boolean): boolean {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value;
    const normalized = String(value).trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
    return fallback;
  }

  private safeSortField(value: any): string {
    const allowed = new Set([
      "lastDetailParsedAt",
      "lastSyncedAt",
      "name",
      "stats.totalInvestments",
      "stats.portfolioProjects",
    ]);
    const field = String(value || "").trim();
    return allowed.has(field) ? field : "";
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
