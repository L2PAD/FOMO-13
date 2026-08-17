import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { FilesService } from "src/files/files.service";
import { CommentsService } from "src/comments/comments.service";

import { Project, ProjectDocument } from "./project.model";
import { Person, PersonDocument } from "src/persons/person.model";
import { News, NewsDocument } from "src/news/models/news.model";
import { User, UserDocument } from "src/user/user.model";
import { Funds, FundsDocument } from "src/funds/funds.model";
import {
  ParticipantsKeys,
} from "./dto/participants-project.dto";
import { CreateProjectDto } from "./dto/create-project.dto";
import {
  RolesDto,
  UpdateProjectByUserDto,
  UpdateProjectDto,
} from "./dto/update-project.dto";
import { QueryProjectDto } from "./dto/query-project.dto";
import { AddActionDto } from "../actions/dto/add-action.dto";
import { ActionsService } from "src/actions/actions.service";
import commentDto from "src/comments/dto/comment.dto";
import { NotificationsService } from "src/notifications/notifications.service";
import { ActivityService } from "src/activity/activity.service";
import {
  ProjectTwitter,
  ProjectTwitterDocument,
} from "src/twitter/project-twitter.model";

const LEGACY_MARKET_PROJECT_TYPE = "market";
const DEFAULT_PROJECT_PAGE_SIZE = 20;
const MAX_PROJECT_PAGE_SIZE = 100;

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Person.name) private personModel: Model<PersonDocument>,
    @InjectModel(News.name) private newsModel: Model<NewsDocument>,
    @InjectModel(Funds.name) private fundModel: Model<FundsDocument>,
    @InjectModel(ProjectTwitter.name)
    private projectTwitterModel: Model<ProjectTwitterDocument>,
    private readonly filesService: FilesService,
    private readonly commentsService: CommentsService,
    private readonly actionsService: ActionsService,
    private readonly notificationsService: NotificationsService,
    private readonly activityService: ActivityService,
  ) {}

  private parseArrayToObjectId(
    items: string | undefined
  ): Array<mongoose.Types.ObjectId> {
    if (!items) return [];

    return items
      .split(",")
      .map((id) => id.trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id: string) => new mongoose.Types.ObjectId(id));
  }

  private getSortKey = (key: string): string => {
    const values: any = {
      Price: "price",
      "1h": "usdQuote.percent_change_1h",
      "24h": "usdQuote.percent_change_24h",
      "7d": "usdQuote.percent_change_7d",
      "Market Cap": "marketCap",
      FDV: "fullyDilutedMarketCap",
      "Volume 24h": "volume24h",
      "Volume (24h)": "volume24h",
      "Volume 7d": "volume7d",
      "Volume 1m": "volume1m",
      "Circulating Supply": "circulatingSupply",
      Asset: "rank",
      createdAt: "createdAt",
      lastFunding: "lastFunding",
      totalRaised: "totalRaised",
      investorsCount: "investorsCount",
      rating: "fomoScoreSort",
      fomoScore: "fomoScoreSort",
      "FOMO Score": "fomoScoreSort",
    };

    return values[key] || "";
  };

  private parseObjectIdList(value?: string[] | string): mongoose.Types.ObjectId[] {
    if (!value) return [];

    const items = Array.isArray(value) ? value : String(value).split(",");

    return items
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
  }

  private parseStringArray(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.map((item) => String(item || "").trim()).filter(Boolean);
    }

    const raw = String(value || "").trim();
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item || "").trim()).filter(Boolean);
      }
    } catch {
      // Comma-separated query values remain supported for legacy community clients.
    }

    return raw.split(",").map((item) => item.trim()).filter(Boolean);
  }

  private escapeRegex(value: unknown): string {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private parseJson<T>(value: unknown, fallback: T, field: string): T {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value !== "string") return value as T;
    if (value.length > 100_000) {
      throw new HttpException(`${field} is too large`, HttpStatus.PAYLOAD_TOO_LARGE);
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      throw new HttpException(`Invalid ${field}`, HttpStatus.BAD_REQUEST);
    }
  }

  private boundedInteger(
    value: unknown,
    fallback: number,
    min: number,
    max: number
  ): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(Math.max(Math.trunc(parsed), min), max);
  }

  private parseQueryString(query: any = {}): Record<string, any> {
    const parsedFilters: Record<string, any> = {};

    for (const key in query) {
      const value = query[key];

      const rangePattern = /\d+-\d+/;

      if (typeof value === "string" && value.includes(",")) {
        const values = value.split(",");

        parsedFilters[key] = values.map((item) => {
          if (rangePattern.test(item)) {
            const [min, max] = item.split("-").map(Number);
            return [min, max];
          }
          return item;
        });
      } else {
        parsedFilters[key] = value;
      }
    }

    return parsedFilters;
  }

  private mergeMatchStages(
    base: Record<string, any> = {},
    extra: Record<string, any> = {}
  ): Record<string, any> {
    const { $and: baseAnd, ...baseRest } = base;
    const { $and: extraAnd, ...extraRest } = extra;
    const merged: Record<string, any> = { ...baseRest, ...extraRest };
    const andConditions = [
      ...(Array.isArray(baseAnd) ? baseAnd : baseAnd ? [baseAnd] : []),
      ...(Array.isArray(extraAnd) ? extraAnd : extraAnd ? [extraAnd] : []),
    ];

    if (andConditions.length) {
      merged.$and = andConditions;
    }

    return merged;
  }

  private buildProjectFilter(query: any): Record<string, any> {
    const andConditions: any[] = [];
    const normalizeRangeItems = (value: any): Array<[number, number]> => {
      const rawItems = Array.isArray(value) ? value : String(value).split(",");

      return rawItems
        .map((item) =>
          Array.isArray(item) ? item : String(item).split("-").map(Number)
        )
        .filter(
          (range) =>
            range.length === 2 &&
            range.every((rangeValue) => Number.isFinite(Number(rangeValue)))
        )
        .map((range) => [Number(range[0]), Number(range[1])] as [number, number]);
    };
    const normalizeStringItems = (value: any): string[] => {
      const rawItems = Array.isArray(value) ? value : String(value).split(",");

      return rawItems
        .map((item) => String(item || "").trim())
        .filter(Boolean);
    };

    if (query.section) {
      andConditions.push({
        sections: { $in: [query.section] },
      });
    }

    if (query.price) {
      const items = Array.isArray(query.price)
        ? query.price
        : [query.price.split("-")];

      const priceConditions = items.map((range: [number, number]) => ({
        price: { $gte: Number(range[0]), $lt: Number(range[1]) },
      }));
      if (priceConditions.length) andConditions.push({ $or: priceConditions });
    }

    if (query.price_checkboxes) {
      const [min, max] = query.price_checkboxes.split("-").map(Number);
      if (min !== undefined && max !== undefined) {
        andConditions.push({ price: { $gte: min, $lt: max } });
      }
    }

    if (query.change24) {
      const items = Array.isArray(query.change24)
        ? query.change24
        : [query.change24];
      const changeConditions = items
        .map((val: string) => {
          const ranges = {
            "0to50": [0, 50],
            "-50to-10": [-50, -10],
            "-10to0": [-10, 0],
            "0to10%": [0, 10],
            "10to50": [10, 50],
            "50to10000000000": [50, 10000000000],
          };
          return ranges[val]
            ? { priceChange: { $gte: ranges[val][0], $lt: ranges[val][1] } }
            : null;
        })
        .filter(Boolean);
      if (changeConditions.length)
        andConditions.push({ $or: changeConditions });
    }

    if (query.volume24) {
      const items = Array.isArray(query.volume24)
        ? query.volume24
        : [query.volume24.split("-")];

      const volumeConditions = items.map(
        (range: [number | string, number | string]) => ({
          volume24h: { $gte: Number(range[0]), $lt: Number(range[1]) },
        })
      );
      if (volumeConditions.length)
        andConditions.push({ $or: volumeConditions });
    }

    if (query.marketCap) {
      const items = Array.isArray(query.marketCap)
        ? query.marketCap
        : [query.marketCap.split("-")];

      const marketCapConditions = items.map(
        (range: [number | string, number | string]) => ({
          marketCap: { $gte: Number(range[0]), $lt: Number(range[1]) },
        })
      );
      if (marketCapConditions.length)
        andConditions.push({ $or: marketCapConditions });
    }

    if (query.fdv) {
      const items = Array.isArray(query.fdv)
        ? query.fdv
        : [query.fdv.split("-")];

      const fdvConditions = items.map((range: [number, number]) => ({
        fullyDilutedMarketCap: {
          $gte: Number(range[0]),
          $lte: Number(range[1]),
        },
      }));

      if (fdvConditions.length) andConditions.push({ $or: fdvConditions });
    }

    if (query.circulationSupply) {
      const [min, max] = query.circulationSupply.split("-").map(Number);
      if (min !== undefined && max !== undefined) {
        andConditions.push({
          circulatingSupplyPercent: { $gte: min, $lte: max },
        });
      }
    }

    if (query.tradeLaunchDate) {
      const days = {
        "<7days": 7,
        "<30days": 30,
        "<90days": 90,
        "<180days": 180,
        "<365days": 365,
      };
      const items = Array.isArray(query.tradeLaunchDate)
        ? query.tradeLaunchDate
        : query.tradeLaunchDate.split("-");

      const isNumericRange =
        items.length === 2 && items.every((item) => !isNaN(Number(item)));

      if (isNumericRange) {
        const [fromDays, toDays] = items.map(Number);

        const fromDate = new Date(Date.now() - toDays * 24 * 60 * 60 * 1000);
        const toDate = new Date(Date.now() - fromDays * 24 * 60 * 60 * 1000);

        andConditions.push({
          dateAdded: { $gte: fromDate, $lte: toDate },
        });
      } else {
        const dateConditions = items
          .map((key: string) => {
            if (key.startsWith("<") && days[key]) {
              const date = new Date(
                Date.now() - days[key] * 24 * 60 * 60 * 1000
              );
              return { dateAdded: { $gte: date } };
            }
            if (key === ">365days") {
              const date = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
              return { dateAdded: { $lt: date } };
            }
            return null;
          })
          .filter(Boolean);

        if (dateConditions.length) {
          andConditions.push({ $or: dateConditions });
        }
      }
    }

    if (query.fundingDates) {
      const daysMap = {
        "<7days": 7,
        "<30days": 30,
        "<90days": 90,
        "<180days": 180,
        "<365days": 365,
      };

      const items = Array.isArray(query.fundingDates)
        ? query.fundingDates
        : query.fundingDates.split("-");

      const isNumericRange =
        items.length === 2 && items.every((item) => !isNaN(Number(item)));

      if (isNumericRange) {
        const [fromDays, toDays] = items.map(Number);
        const fromDate = new Date(Date.now() - toDays * 86400000);
        const toDate = new Date(Date.now() - fromDays * 86400000);

        andConditions.push({
          lastFunding: {
            $gte: fromDate,
            $lte: toDate,
          },
        });
      } else {
        const dateConditions = items
          .map((key: string) => {
            if (key.startsWith("<") && daysMap[key]) {
              const date = new Date(Date.now() - daysMap[key] * 86400000);
              return { lastFunding: { $gte: date } };
            }
            if (key === ">365days") {
              const date = new Date(Date.now() - 365 * 86400000);
              return { lastFunding: { $lt: date } };
            }
            return null;
          })
          .filter(Boolean);

        if (dateConditions.length) {
          andConditions.push({ $or: dateConditions });
        }
      }
    }

    if (query["red-flags"]) {
      const items = Array.isArray(query["red-flags"])
        ? query["red-flags"]
        : [query["red-flags"]];

      const redFlagConditions = items
        .map((val: string) => {
          if (val === "0") {
            return { redFlagsList: { $size: 0 } };
          }
          if (val.includes(">")) {
            const num = parseInt(val.substring(1), 10);
            return {
              $expr: { $gte: [{ $size: "$redFlagsList" }, num] },
            };
          }
          if (val[0] && typeof val[1] === "number") {
            const [min, max] = [val[0], val[1]];
            return {
              $expr: {
                $and: [
                  { $gte: [{ $size: "$redFlagsList" }, min] },
                  { $lte: [{ $size: "$redFlagsList" }, max] },
                ],
              },
            };
          }
          if (val.includes("-")) {
            const [min, max] = val.split("-").map(Number);
            return {
              $expr: {
                $and: [
                  { $gte: [{ $size: "$redFlagsList" }, min] },
                  { $lte: [{ $size: "$redFlagsList" }, max] },
                ],
              },
            };
          }
          return null;
        })
        .filter(Boolean);

      if (redFlagConditions.length) {
        andConditions.push({ $or: redFlagConditions });
      }
    }

    if (query.fomoScore) {
      const items = Array.isArray(query.fomoScore)
        ? query.fomoScore
        : [query.fomoScore.split("-")];
      const fomoConditions = items.map((range: [number, number]) => ({
        fomoScore: { $gte: Number(range[0]), $lte: Number(range[1]) },
      }));

      if (fomoConditions.length) {
        andConditions.push({ $or: fomoConditions });
      }
    }

    if (query?.fundsRaised) {
      const raised = normalizeRangeItems(query.fundsRaised);

      const raisedConditions = raised.map((range: [number, number]) => ({
        totalRaised: { $gte: Number(range[0]), $lte: Number(range[1]) },
      }));

      if (raisedConditions.length) {
        andConditions.push({ $or: raisedConditions });
      }
    }

    if (query.investors) {
      const rawInvestorIds = Array.isArray(query.investors)
        ? query.investors
        : [query.investors];
      const investorIds = rawInvestorIds
        .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
        .map((id: string) => new mongoose.Types.ObjectId(id));

      if (investorIds.length) {
        andConditions.push({
          investors: { $in: investorIds },
        });
      }
    }

    if (query.investorNames) {
      const investorNames = normalizeStringItems(query.investorNames);

      if (investorNames.length) {
        const investorNameRegexes = investorNames.map(
          (name) => new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
        );

        andConditions.push({
          $or: [
            { "rawIcoData.uiInvestors.name": { $in: investorNameRegexes } },
            { "rawIcoData.investors.name": { $in: investorNameRegexes } },
            { "fundraising.investors.name": { $in: investorNameRegexes } },
            { "investors.name": { $in: investorNameRegexes } },
          ],
        });
      }
    }

    return andConditions.length > 0 ? { $and: andConditions } : {};
  }

  private buildProjectPipeline(
    type: string,
    projectStatus: string,
    query: QueryProjectDto = {} as QueryProjectDto
  ): any[] {
    const matchStage: any = {};
    const matchAndConditions: any[] = [];
    const skip = this.boundedInteger(query?.offset, 0, 0, Number.MAX_SAFE_INTEGER);
    const limit = this.boundedInteger(
      query?.limit,
      DEFAULT_PROJECT_PAGE_SIZE,
      1,
      MAX_PROJECT_PAGE_SIZE
    );
    const includedProjectIds = this.parseObjectIdList(query?.includedProjectIds);
    const excludedProjectIds = this.parseObjectIdList(query?.excludedProjectIds);
    const isSandboxQuery = query?.sandbox === true || String(query?.sandbox || "").toLowerCase() === "true";
    const isLightQuery = query?.light === true || String(query?.light || "").toLowerCase() === "true";
    const parseActiveFilterValues = (value?: any): string[] => {
      if (!value) return [];

      const rawValues = Array.isArray(value) ? value : String(value).split(",");

      return rawValues
        .map((item) => String(item || "").trim())
        .filter((item) => item && item.toLowerCase() !== "all");
    };

    if (projectStatus !== "all" && !query?.projectValidation) {
      matchStage.projectStatus = projectStatus;
    }

    if (type !== "all") {
      matchStage.projectType = type;
    } else {
      matchStage.projectType = { $ne: LEGACY_MARKET_PROJECT_TYPE };
    }

    if (type === "project") {
      matchStage.isSandbox = isSandboxQuery ? true : { $ne: true };
    }

    if (type === "market") {
      matchStage.trading = "CURRENTLY_TRADING";
    }

    if (query?.status) {
      matchStage.status = {
        $regex: new RegExp(`^${this.escapeRegex(query.status)}$`, "i"),
      };
    }

    if (query?.searchValue) {
      matchStage.name = {
        $regex: this.escapeRegex(query.searchValue),
        $options: "i",
      };
    }

    if (excludedProjectIds.length) {
      matchStage._id = {
        ...(matchStage._id || {}),
        $nin: excludedProjectIds,
      };
    }

    if (query?.projectTypes && type === "all") {
      const projectTypes = this.parseStringArray(query.projectTypes).filter(
        (projectType) => projectType.toLowerCase() !== LEGACY_MARKET_PROJECT_TYPE
      );
      matchStage.projectType = { $in: projectTypes };
    }

    if (query?.projectValidation) {
      matchStage.projectStatus = {
        $in: this.parseStringArray(query.projectValidation),
      };
    }

    if (query?.totalRaised) {
      const values = this.parseJson<{ from?: number; to?: number }>(
        query.totalRaised,
        {},
        "totalRaised",
      );
      if (!Number.isFinite(Number(values.from)) || !Number.isFinite(Number(values.to))) {
        throw new HttpException("Invalid totalRaised range", HttpStatus.BAD_REQUEST);
      }
      matchStage.totalRaised = { $gte: values.from, $lte: values.to };
    }

    const selectedCategories = parseActiveFilterValues(query?.categories);
    if (selectedCategories.length) {
      const categories = selectedCategories;

      if (type === "project") {
        matchAndConditions.push({
          $or: [
            { "rawIcoData.categories": { $in: categories } },
            { categories: { $in: categories } },
            { mainCategory: { $in: categories } },
            { "mainCategory.name": { $in: categories } },
            { type: { $in: categories } },
          ],
        });
      } else {
        matchStage.type = { $in: categories };
      }
    }

    const selectedFundingTypes = parseActiveFilterValues(query?.fundingType);
    if (selectedFundingTypes.length) {
      const types = selectedFundingTypes;

      if (type === "project") {
        matchAndConditions.push({
          $or: [
            { round: { $in: types } },
            { "fundraising.type": { $in: types } },
            { "fundraising.name": { $in: types } },
            { "rawIcoData.saleRounds.type": { $in: types } },
            { "rawIcoData.saleRounds.name": { $in: types } },
          ],
        });
      } else {
        matchStage.round = { $in: types };
      }
    }

    if (matchAndConditions.length) {
      matchStage.$and = matchAndConditions;
    }

    const pipeline: any[] = [];

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    if (includedProjectIds.length) {
      pipeline.push({
        $addFields: {
          isIncludedAsset: { $in: ["$_id", includedProjectIds] },
          includedAssetOrder: { $indexOfArray: [includedProjectIds, "$_id"] },
        },
      });
    }

    if (!isLightQuery) {
      pipeline.push({
        $lookup: {
          from: this.fundModel.collection.name,
          localField: "investors",
          foreignField: "_id",
          as: "investors",
        },
      });

      pipeline.push({
        $addFields: {
          investors: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$investors", []] } }, 0] },
              "$investors",
              {
                $reduce: {
                  input: {
                    $map: {
                      input: { $ifNull: ["$fundraising", []] },
                      as: "round",
                      in: {
                        $cond: [
                          { $isArray: "$$round.investors" },
                          "$$round.investors",
                          [],
                        ],
                      },
                    },
                  },
                  initialValue: [],
                  in: { $concatArrays: ["$$value", "$$this"] },
                },
              },
            ],
          },
        },
      });
    }

    const projectsPipeline: any[] = [];

    if (isLightQuery) {
      projectsPipeline.push({
        $project: {
          _id: 1,
          id: 1,
          slug: 1,
          name: 1,
          logo: 1,
          image: 1,
          symbol: 1,
          ticker: 1,
          niche: 1,
          type: 1,
          category: 1,
          categories: 1,
          sector: 1,
          stage: 1,
          status: 1,
          projectStatus: 1,
          projectType: 1,
          totalSupply: 1,
          maxSupply: 1,
          circulatingSupply: 1,
          unlockedSupply: 1,
          totalTokensUnlockedAmount: 1,
          "tokenMetrics.totalSupply": 1,
          "tokenMetrics.circulatingSupply": 1,
          "tokenomics.totalSupply": 1,
          "tokenomics.circulatingSupply": 1,
          "tokenomics.ticker": 1,
        },
      });
    } else if (query?.project) {
      try {
        const parsedProject =
          typeof query.project === "string"
            ? JSON.parse(query.project)
            : query.project;

        projectsPipeline.push({
          $project: {
            ...parsedProject,
            projectType: 1,
            projectStatus: 1,
            circulatingSupplyPercent: 1,
            name: 1,
            logo: 1,
            niche: 1,
            isIncludedAsset: 1,
            "usdQuote.percent_change_7d": 1,
            chart7d: 1,
          },
        });
      } catch (e) {
        projectsPipeline.push({
          $project: {
            categories: 0,
            achievements: 0,
            collaborators: 0,
            descriptionImages: 0,
            tokenMetrics: 0,
            team: 0,
            recommendations: 0,
            totalAllocation: 0,
            fundraising: 0,
            advisors: 0,
            descriptionText: 0,
          },
        });
      }
    } else {
      projectsPipeline.push({
        $project: {
          categories: 0,
          achievements: 0,
          collaborators: 0,
          descriptionImages: 0,
          tokenMetrics: 0,
          team: 0,
          recommendations: 0,
          totalAllocation: 0,
          fundraising: 0,
          advisors: 0,
          descriptionText: 0,
        },
      });
    }
    const includedSort = includedProjectIds.length
      ? { isIncludedAsset: -1, includedAssetOrder: 1 }
      : {};
    const sortKey =
      query?.sortKey && query?.sortKey !== "undefined"
        ? this.getSortKey(query.sortKey)
        : "";
    const pageOnlySort = false;

    if (!isLightQuery) {
      projectsPipeline.push({
        $addFields: {
          investorsCount: {
            $size: {
              $cond: [
                {
                  $gt: [
                    { $size: { $ifNull: ["$investors", []] } },
                    0,
                  ],
                },
                { $ifNull: ["$investors", []] },
                {
                  $cond: [
                    {
                      $gt: [
                        {
                          $size: {
                            $ifNull: ["$rawIcoData.uiInvestors", []],
                          },
                        },
                        0,
                      ],
                    },
                    { $ifNull: ["$rawIcoData.uiInvestors", []] },
                    { $ifNull: ["$rawIcoData.investors", []] },
                  ],
                },
              ],
            },
          },
          fomoScoreSort: {
            $let: {
              vars: {
                fomoScoreValue: {
                  $convert: {
                    input: "$fomoScore",
                    to: "double",
                    onError: null,
                    onNull: null,
                  },
                },
                ratingValue: {
                  $convert: {
                    input: "$rating",
                    to: "double",
                    onError: 0,
                    onNull: 0,
                  },
                },
              },
              in: {
                $cond: [
                  { $gt: ["$$fomoScoreValue", 0] },
                  "$$fomoScoreValue",
                  "$$ratingValue",
                ],
              },
            },
          },
        },
      });
    }

    if (pageOnlySort) {
      projectsPipeline.push({
        $sort: {
          ...includedSort,
          rank: 1,
          _id: 1,
        },
      });
      projectsPipeline.push({ $skip: skip });
      projectsPipeline.push({ $limit: limit });
    }

    if (query?.sort) {
      projectsPipeline.push({
        $sort: {
          ...includedSort,
          totalRaised: query.sort === "High" ? -1 : 1,
        },
      });
    }

    if (sortKey) {
      projectsPipeline.push({
        $sort: {
          ...includedSort,
          [sortKey]: Number(query.sortNumberValue) === 1 ? 1 : -1,
        },
      });
    } else if (includedProjectIds.length && !query?.sort) {
      projectsPipeline.push({
        $sort: includedSort,
      });
    }

    if (!pageOnlySort) {
      projectsPipeline.push({ $skip: skip });
      projectsPipeline.push({ $limit: limit });
    }

    pipeline.push({
      $facet: {
        totalCount: [{ $count: "count" }],
        projects: projectsPipeline,
      },
    });

    return pipeline;
  }

  async getProjects(
    type: string,
    projectStatus: string,
    query: QueryProjectDto = {} as QueryProjectDto
  ) {
    if (String(type || "").toLowerCase() === LEGACY_MARKET_PROJECT_TYPE) {
      throw new HttpException(
        "Market projects are served by /fomo-v2/projects/market",
        HttpStatus.GONE
      );
    }

    const pipeline = this.buildProjectPipeline(type, projectStatus, query);
    const filter = this.buildProjectFilter(this.parseQueryString(query));

    if (Object.keys(filter).length > 0) {
      const effectiveFilter = filter;
      const matchIndex = pipeline.findIndex((stage) => !!stage.$match);
      if (matchIndex !== -1) {
        pipeline[matchIndex].$match = this.mergeMatchStages(
          pipeline[matchIndex].$match,
          effectiveFilter
        );
      } else {
        pipeline.unshift({ $match: effectiveFilter });
      }

      const facetIndex = pipeline.findIndex((stage) => !!stage.$facet);
      if (facetIndex !== -1 && pipeline[facetIndex].$facet?.totalCount) {
        const currentMatch = pipeline[facetIndex].$facet.totalCount.find(
          (stage: any) => !!stage.$match
        );
        if (currentMatch) {
          currentMatch.$match = this.mergeMatchStages(
            currentMatch.$match,
            effectiveFilter
          );
        }
      }
    }

    const result = await this.projectModel.aggregate(pipeline);
    const projects: Array<any> = (result[0]?.projects || []).map((project: any) =>
      this.hydrateIcoListProject(project)
    );

    const total: number = result[0]?.totalCount?.[0]?.count || 0;

    return { projects, total };
  }

  private hydrateIcoListProject(project: any): any {
    if (!project || project.source !== "icodrops") {
      return project;
    }

    const rawIcoData = project.rawIcoData || {};

    if (!Array.isArray(project.investors) || !project.investors.length) {
      if (Array.isArray(rawIcoData.uiInvestors) && rawIcoData.uiInvestors.length) {
        project.investors = rawIcoData.uiInvestors;
      } else if (Array.isArray(rawIcoData.investors) && rawIcoData.investors.length) {
        project.investors = rawIcoData.investors;
      } else if (
        Array.isArray(rawIcoData.fundraising?.investors) &&
        rawIcoData.fundraising.investors.length
      ) {
        project.investors = rawIcoData.fundraising.investors;
      }
    }

    return project;
  }

  async getUserProjects(userId: string) {
    const projects: Array<any> = await this.projectModel.aggregate([
      {
        $match: {
          actionInitiator: userId,
          projectType: { $ne: LEGACY_MARKET_PROJECT_TYPE },
        },
      },
      {
        $lookup: {
          from: this.fundModel.collection.name,
          localField: "investors",
          foreignField: "_id",
          as: "investors",
        },
      },
    ]);

    return projects.reverse();
  }

  async getUserInvestProjects(userId: string) {
    const user: UserDocument = await this.userModel.findById(userId);
    if (!user) return [];

    const projectIds: Array<mongoose.Types.ObjectId> =
      (user.investedProjects || [])
        .filter((item: any) => mongoose.Types.ObjectId.isValid(item))
        .map((item: any) => new mongoose.Types.ObjectId(item));

    const projects: Array<any> = await this.projectModel.find({
      _id: { $in: projectIds },
      projectType: { $ne: LEGACY_MARKET_PROJECT_TYPE },
    });

    return projects.reverse();
  }

  async getProject(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException("Project not found", HttpStatus.NOT_FOUND);
    }

    const project = await this.projectModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          projectType: { $ne: LEGACY_MARKET_PROJECT_TYPE },
        },
      },
      {
        $lookup: {
          from: this.newsModel.collection.name,
          localField: "recommendations",
          foreignField: "_id",
          as: "recommendations",
        },
      },
      {
        $lookup: {
          from: this.fundModel.collection.name,
          localField: "investors",
          foreignField: "_id",
          as: "investors",
        },
      },
      {
        $lookup: {
          from: this.personModel.collection.name,
          localField: "team",
          foreignField: "_id",
          as: "team",
        },
      },
      {
        $lookup: {
          from: this.personModel.collection.name,
          localField: "partners",
          foreignField: "_id",
          as: "partners",
        },
      },
      {
        $lookup: {
          from: this.personModel.collection.name,
          localField: "advisors",
          foreignField: "_id",
          as: "advisors",
        },
      },
      {
        $lookup: {
          from: this.projectTwitterModel.collection.name,
          localField: "_id",
          foreignField: "projectId",
          as: "projectTwitterData",
        },
      },
      {
        $unwind: {
          path: "$projectTwitterData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: this.projectModel.collection.name,
          localField: "comparison",
          foreignField: "_id",
          as: "comparison",
        },
      },
      {
        $unwind: {
          path: "$comparison",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "comparison.investors": {
            $cond: {
              if: { $isArray: "$comparison.investors" },
              then: "$comparison.investors",
              else: [],
            },
          },
        },
      },
      {
        $lookup: {
          from: this.fundModel.collection.name,
          let: { investorIds: "$comparison.investors" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$investorIds"],
                },
              },
            },
          ],
          as: "comparison.investorsDetails",
        },
      },
      {
        $group: {
          _id: "$_id",
          projectData: { $first: "$$ROOT" },
          comparison: {
            $push: {
              $cond: {
                if: { $gt: [{ $size: "$comparison.investors" }, 0] },
                then: "$comparison",
                else: "$$REMOVE",
              },
            },
          },
        },
      },
      {
        $addFields: {
          comparison: {
            $cond: {
              if: { $eq: [{ $size: "$comparison" }, 0] },
              then: [],
              else: "$comparison",
            },
          },
        },
      },
    ]);

    if (!project.length)
      throw new HttpException("Project not found", HttpStatus.NOT_FOUND);

    const parsedProject = {
      ...project[0].projectData,
      comparison: project[0].comparison.map((item: any) => {
        return { ...item, investors: item.investorsDetails };
      }),
    };

    this.hydrateParsedIcoProjectFields(parsedProject);
    const rawIcoData = parsedProject.rawIcoData || {};
    if (
      (!Array.isArray(parsedProject.investors) || !parsedProject.investors.length) &&
      Array.isArray(rawIcoData.uiInvestors)
    ) {
      parsedProject.investors = rawIcoData.uiInvestors;
    }

    if (
      (!Array.isArray(parsedProject.topFollowers) || !parsedProject.topFollowers.length) &&
      Array.isArray(parsedProject.topfollowers) &&
      parsedProject.topfollowers.length
    ) {
      parsedProject.topFollowers = parsedProject.topfollowers;
    }

    if (
      (!Array.isArray(parsedProject.topFollowers) || !parsedProject.topFollowers.length) &&
      Array.isArray(rawIcoData.uiTopFollowers)
    ) {
      parsedProject.topFollowers = rawIcoData.uiTopFollowers;
      parsedProject.topfollowers = rawIcoData.uiTopFollowers;
    }

    const projectComments: Array<mongoose.Types.ObjectId> =
      Array.isArray(parsedProject.comments) ? parsedProject.comments : [];

    const comments = await this.commentsService.getComments(projectComments);

    return {
      ...parsedProject,
      comments,
    };
  }

  private hydrateParsedIcoProjectFields(project: any): void {
    const rawIcoData = project?.rawIcoData || {};

    this.assignObjectIfMissing(project, "interestLevel", rawIcoData.interestLevel);
    this.assignObjectIfMissing(project, "dates", rawIcoData.dates);
    this.assignObjectIfMissing(project, "tokenomics", rawIcoData.tokenomics);
    this.assignObjectIfMissing(project, "tokenDetails", rawIcoData.tokenomics);
    this.assignObjectIfMissing(
      project,
      "vesting",
      rawIcoData.vesting || rawIcoData.tokenomics?.raw?.vesting
    );
    this.assignObjectIfMissing(project, "social", rawIcoData.social);

    project.ecosystems = this.mergeStringArrays(project.ecosystems, rawIcoData.ecosystems);
    project.launchpads = this.mergeStringArrays(project.launchpads, rawIcoData.launchpads);

    if (!this.hasItems(project.categories)) {
      project.categories = this.mergeStringArrays(
        rawIcoData.categories,
        rawIcoData.ecosystems,
        rawIcoData.launchpads
      );
    }

    this.assignArrayIfMissing(project, "saleRounds", rawIcoData.saleRounds);
    this.assignArrayIfMissing(project, "fundsRounds", rawIcoData.fundraising?.rounds);

    if (!this.hasItems(project.descriptionImages)) {
      const screenshots = this.normalizeIcoScreenshots(rawIcoData.screenshots);
      if (screenshots.length) {
        project.descriptionImages = screenshots;
      }
    }

    if (!this.hasItems(project.website)) {
      const website = this.firstIcoLinkValue(rawIcoData.links?.website);
      if (website) {
        project.website = [website];
      }
    }

    if (!this.hasItems(project.socialmedia)) {
      const socialmedia = this.normalizeIcoSocialMedia(rawIcoData.links);
      if (socialmedia.length) {
        project.socialmedia = socialmedia;
      }
    }
  }

  private assignObjectIfMissing(target: any, key: string, value: any): void {
    if (
      target?.[key] &&
      typeof target[key] === "object" &&
      !Array.isArray(target[key]) &&
      Object.keys(target[key]).length
    ) {
      return;
    }

    if (value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length) {
      target[key] = value;
    }
  }

  private assignArrayIfMissing(target: any, key: string, value: any): void {
    if (this.hasItems(target?.[key]) || !Array.isArray(value) || !value.length) {
      return;
    }

    target[key] = value;
  }

  private hasItems(value: any): boolean {
    return Array.isArray(value) && value.length > 0;
  }

  private mergeStringArrays(...arrays: any[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const array of arrays) {
      if (!Array.isArray(array)) continue;

      for (const value of array) {
        if (typeof value !== "string") continue;

        const normalized = value.trim();
        if (!normalized) continue;

        const key = normalized.toLowerCase();
        if (seen.has(key)) continue;

        seen.add(key);
        result.push(normalized);
      }
    }

    return result;
  }

  private normalizeIcoScreenshots(values: any): string[] {
    if (!Array.isArray(values)) return [];

    return values
      .map((item) => this.firstIcoLinkValue(item) || (typeof item === "string" ? item : ""))
      .filter((item) => typeof item === "string" && item.trim())
      .filter((item, index, items) => items.indexOf(item) === index);
  }

  private normalizeIcoSocialMedia(links: any): Array<{ href: string; name: string }> {
    const allowed = new Set([
      "website",
      "twitter",
      "x",
      "telegram",
      "discord",
      "medium",
      "github",
      "reddit",
      "youtube",
      "linkedin",
      "whitepaper",
      "docs",
      "dropstab",
    ]);
    const result: Array<{ href: string; name: string }> = [];

    for (const entry of this.collectIcoLinkEntries(links)) {
      const key = entry.key.toLowerCase();
      const label = entry.label.toLowerCase();
      const url = entry.url.toLowerCase();
      const isAllowed =
        allowed.has(key) ||
        ["twitter", "x.com", "t.me", "discord", "medium", "github", "reddit", "youtube", "linkedin"].some(
          (item) => url.includes(item)
        ) ||
        ["facebook", "instagram", "threads", "tiktok"].some((item) => label.includes(item));

      if (!isAllowed) continue;

      if (!result.some((item) => item.href === entry.url)) {
        result.push({ href: entry.url, name: entry.label });
      }
    }

    return result;
  }

  private collectIcoLinkEntries(links: any): Array<{ key: string; label: string; url: string }> {
    const result: Array<{ key: string; label: string; url: string }> = [];
    if (!links || typeof links !== "object") return result;

    for (const [key, value] of Object.entries(links)) {
      const values = Array.isArray(value) ? value : [value];
      for (const item of values) {
        const url = this.firstIcoLinkValue(item);
        if (!url) continue;

        const label =
          (item && typeof item === "object" && typeof (item as any).label === "string" && (item as any).label.trim()) ||
          (item && typeof item === "object" && typeof (item as any).name === "string" && (item as any).name.trim()) ||
          this.toDisplayLabel(key);

        if (!result.some((entry) => entry.key === key && entry.url === url)) {
          result.push({ key, label, url });
        }
      }
    }

    return result;
  }

  private firstIcoLinkValue(value: any): string | undefined {
    if (typeof value === "string") return value.trim() || undefined;

    if (Array.isArray(value)) {
      for (const item of value) {
        const url = this.firstIcoLinkValue(item);
        if (url) return url;
      }
      return undefined;
    }

    if (value && typeof value === "object") {
      return (
        (typeof value.url === "string" && value.url.trim()) ||
        (typeof value.href === "string" && value.href.trim()) ||
        (typeof value.link === "string" && value.link.trim()) ||
        undefined
      );
    }

    return undefined;
  }

  private toDisplayLabel(value: string): string {
    return value
      .replace(/[_-]+/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private assertCommunityProjectType(projectType: unknown): void {
    if (String(projectType || "").toLowerCase() === LEGACY_MARKET_PROJECT_TYPE) {
      throw new HttpException(
        "Legacy market project commands are disabled",
        HttpStatus.GONE
      );
    }
  }

  async createProject(
    createProjectDto: CreateProjectDto,
    initiator?: string,
    actionStatus?: "moderator" | "admin"
  ) {
    this.assertCommunityProjectType(createProjectDto.projectType);

    const actionType: string = `Publication on ${createProjectDto.projectType === "project"
      ? "crypto"
      : createProjectDto.projectType || "crypto"
      } page`;
    const actionDate: Date = new Date();

    const logo = createProjectDto.logo
      ? await this.filesService.writeFile(createProjectDto.logo)
      : "";
    const descriptionImage: string | undefined =
      createProjectDto.descriptionImage
        ? await this.filesService.writeFile(createProjectDto.descriptionImage)
        : "";

    const investors = this.parseArrayToObjectId(createProjectDto.investors);
    const team = this.parseArrayToObjectId(createProjectDto.team);
    const partners = this.parseArrayToObjectId(createProjectDto.partners);
    const recommendations = this.parseArrayToObjectId(
      createProjectDto.recommendations
    );
    const faq = this.parseJson<any[]>(createProjectDto.faq, [], "faq");
    const regionData = this.parseJson<Record<string, any>>(
      createProjectDto.regionData,
      {},
      "regionData",
    );
    const socialmedia = this.parseJson<any[]>(
      createProjectDto.socialmedia,
      [],
      "socialmedia",
    );

    const projectData: any = {
      ...createProjectDto,
      logo: logo,
      descriptionImage,
      investors,
      team,
      partners,
      recommendations,
      actionInitiator: initiator,
      faq,
      regionData,
      socialmedia,
      projectType: createProjectDto.projectType || "project",
    };

    const newProject = await this.projectModel.create(projectData);

    if (initiator && actionStatus) {
      const action: AddActionDto = {
        user: new mongoose.Types.ObjectId(initiator),
        itemId: new mongoose.Types.ObjectId(newProject._id),
        name: "Create project",
        type: actionType,
        value: { name: createProjectDto.name, img: logo },
        date: actionDate,
        status: actionStatus,
        category: "projects",
      };

      await this.actionsService.addAction(action);

      await this.userModel.findByIdAndUpdate(initiator, {
        $inc: { projectLimit: -1 },
      });
    }

    return newProject;
  }

  async createProjectByModerator(
    createProjectDto: CreateProjectDto,
    initiator: string
  ) {
    this.assertCommunityProjectType(createProjectDto.projectType);

    const actionType: string = `Publication on ${createProjectDto.projectType === "project"
      ? "crypto"
      : createProjectDto.projectType
      } page`;
    const actionDate: Date = new Date();

    const logo = await this.filesService.writeFile(createProjectDto.logo);

    const investors = this.parseArrayToObjectId(createProjectDto.investors);

    const projectData: any = {
      ...createProjectDto,
      logo: logo,
      investors,
      action: actionType,
      actionDate: actionDate,
      actionInitiator: initiator,
    };

    const newProject = await this.projectModel.create(projectData);

    const action: AddActionDto = {
      user: new mongoose.Types.ObjectId(initiator),
      itemId: new mongoose.Types.ObjectId(newProject._id),
      name: "Create project",
      type: actionType,
      value: { name: createProjectDto.name, img: logo },
      date: actionDate,
      status: "admin",
      category: "projects",
    };

    await this.actionsService.addAction(action);

    return newProject;
  }

  async editProjectByUser(
    id: string,
    updateProjectDto: UpdateProjectByUserDto,
    initiator: string
  ) {
    const investors: Array<mongoose.Types.ObjectId> =
      updateProjectDto.investors.map(
        (item: string) => new mongoose.Types.ObjectId(item)
      );

    const partners: Array<mongoose.Types.ObjectId> =
      updateProjectDto.partners.map(
        (item: string) => new mongoose.Types.ObjectId(item)
      );

    const team: Array<mongoose.Types.ObjectId> = updateProjectDto.team.map(
      (item: string) => new mongoose.Types.ObjectId(item)
    );

    const advisors: Array<mongoose.Types.ObjectId> =
      updateProjectDto.advisors.map(
        (item: string) => new mongoose.Types.ObjectId(item)
      );

    const comparison: Array<mongoose.Types.ObjectId> =
      updateProjectDto?.comparison?.map(
        (item: string) => new mongoose.Types.ObjectId(item)
      );

    const existingProject = await this.projectModel.findById(id).exec();
    this.assertCommunityProjectType(existingProject?.projectType);

    const newProjectData = {
      ...existingProject.toObject(),
      ...updateProjectDto,
      isDuplicate: true,
      originalEntityId: new mongoose.Types.ObjectId(id),
      _id: new mongoose.Types.ObjectId(),
      projectStatus: "moderator",
      partners,
      team,
      advisors,
      investors,
      comparison,
    };

    if (updateProjectDto?.descriptionImagesToUpdate) {
      const images: Array<string> = [];

      for (
        let i = 0;
        i < updateProjectDto.descriptionImagesToUpdate.length;
        i++
      ) {
        const base64 = updateProjectDto.descriptionImagesToUpdate[i];
        const img = await this.filesService.writeBase64File(base64);

        images.push(img);
      }
      newProjectData.descriptionImages = images;
    }

    const newProject = await this.projectModel.create(newProjectData);

    const actionType: string = `Update project on ${existingProject.projectType === "project"
      ? "crypto"
      : existingProject.projectType
      } page`;

    const action: AddActionDto = {
      user: new mongoose.Types.ObjectId(initiator),
      itemId: new mongoose.Types.ObjectId(newProject._id),
      name: "Update project",
      actionType: "update",
      type: actionType,
      value: { name: newProject.name, img: newProject.logo },
      date: new Date(),
      status: "moderator",
      category: "projects",
    };

    await this.actionsService.addAction(action);

    await this.userModel.findByIdAndUpdate(initiator, {
      $inc: { projectLimit: -1 },
    });

    await this.activityService.createActivity({
      userId: new mongoose.Types.ObjectId(initiator),
      createdAt: new Date(),
      title: "",
      type: "other",
      link: "",
      text: `You have updated the project <button data-path="${existingProject.projectType === "market"
        ? `/crypto/project/${existingProject._id}`
        : `/crypto/projects/${existingProject._id}`
        }" class="inline-button">${existingProject.name}</button>`,
    });

    return newProject;
  }

  async editProject(
    id: string,
    updateProjectDto: UpdateProjectDto,
    roleData: RolesDto,
    initiator: string
  ) {
    const updatedProject = await this.projectModel.findById(id);
    this.assertCommunityProjectType(updatedProject?.projectType);

    const isNewLogo: boolean = typeof updateProjectDto.logo !== "string";

    const newLogo: string =
      isNewLogo && updateProjectDto.logo
        ? await this.filesService.writeFile(updateProjectDto.logo)
        : updatedProject.logo;

    const { success } =
      updatedProject.logo && isNewLogo
        ? await this.filesService.removeFile(updatedProject.logo)
        : { success: true };

    if (!success) return "Update error";

    const investors: Array<mongoose.Types.ObjectId> =
      typeof updateProjectDto.investors === "string"
        ? this.parseArrayToObjectId(updateProjectDto.investors)
        : updateProjectDto.investors.map(
          (item: string) => new mongoose.Types.ObjectId(item)
        );

    const partners: Array<mongoose.Types.ObjectId> =
      updateProjectDto?.partners?.map(
        (item: string) => new mongoose.Types.ObjectId(item)
      );

    const team: Array<mongoose.Types.ObjectId> = updateProjectDto?.team?.map(
      (item: string) => new mongoose.Types.ObjectId(item)
    );

    const advisors: Array<mongoose.Types.ObjectId> =
      updateProjectDto?.advisors?.map(
        (item: string) => new mongoose.Types.ObjectId(item)
      );

    const comparison: Array<mongoose.Types.ObjectId> =
      updateProjectDto?.comparison?.map(
        (item: string) => new mongoose.Types.ObjectId(item)
      );

    const updatedProjectTmp: any = {
      ...updateProjectDto,
      logo: newLogo,
      comments: updatedProject.comments,
      partners,
      investors,
    };

    if (team) updatedProjectTmp.team = team;
    if (partners) updatedProjectTmp.partners = partners;
    if (advisors) updatedProjectTmp.advisors = advisors;
    if (comparison) updatedProjectTmp.comparison = comparison;

    if (roleData.isAdmin) {
      const editedProject = await this.projectModel.findByIdAndUpdate(
        id,
        updatedProjectTmp
      );

      await this.notificationsService.sendUsersNotifications(editedProject);

      return editedProject;
    }

    if (roleData.isModerator) {
      const newProjectData = {
        ...updatedProjectTmp,
        isDuplicate: true,
        projectStatus: "admin",
        originalEntityId: new mongoose.Types.ObjectId(id),
        _id: new mongoose.Types.ObjectId(),
      };

      const newProject = await this.projectModel.create(newProjectData);

      const actionType: string = `Update project on ${newProjectData.projectType === "project"
        ? "crypto"
        : newProjectData.projectType
        } page`;

      const action: AddActionDto = {
        user: new mongoose.Types.ObjectId(initiator),
        itemId: new mongoose.Types.ObjectId(newProject._id),
        name: "Update project",
        actionType: "update",
        type: actionType,
        value: { name: newProject.name, img: newProject.logo },
        date: new Date(),
        status: "admin",
        category: "projects",
      };

      await this.actionsService.addAction(action);

      return newProject;
    }

    if (roleData.isUser) {
      const existingProject = await this.projectModel.findById(id).exec();

      const newProjectData = {
        ...updatedProjectTmp,
        isDuplicate: true,
        originalEntityId: new mongoose.Types.ObjectId(id),
        _id: new mongoose.Types.ObjectId(),
        projectStatus: "moderator",
      };

      const newProject = await this.projectModel.create(newProjectData);

      const actionType: string = `Update project on ${existingProject.projectType === "project"
        ? "crypto"
        : existingProject.projectType
        } page`;

      const action: AddActionDto = {
        user: new mongoose.Types.ObjectId(initiator),
        itemId: new mongoose.Types.ObjectId(newProject._id),
        name: "Update project",
        actionType: "update",
        type: actionType,
        value: { name: newProject.name, img: newProject.logo },
        date: new Date(),
        status: "moderator",
        category: "projects",
      };

      await this.actionsService.addAction(action);

      await this.userModel.findByIdAndUpdate(initiator, {
        $inc: { projectLimit: -1 },
      });

      return newProject;
    }
  }

  async updateProjectParticipants(
    id: string,
    key: ParticipantsKeys,
    data: Array<string>,
    roleData: RolesDto,
    initiator: string
  ): Promise<ProjectDocument> {
    const targetProject = await this.projectModel
      .findById(id)
      .select({ projectType: 1 })
      .lean();
    this.assertCommunityProjectType(targetProject?.projectType);

    const participantsIds: Array<mongoose.Types.ObjectId> = data.map(
      (item: string) => new mongoose.Types.ObjectId(item)
    );

    if (roleData.isAdmin) {
      return this.projectModel.findByIdAndUpdate(id, {
        [key]: participantsIds,
      });
    }

    if (roleData.isModerator) {
      const existingProject = await this.projectModel.findById(id).exec();

      const newProjectData = {
        ...existingProject.toObject(),
        isDuplicate: true,
        projectStatus: "admin",
        originalEntityId: new mongoose.Types.ObjectId(id),
        _id: new mongoose.Types.ObjectId(),
        [key]: participantsIds,
      };

      const newProject = await this.projectModel.create(newProjectData);

      const actionType: string = `Update project on ${existingProject.projectType === "project"
        ? "crypto"
        : existingProject.projectType
        } page`;

      const action: AddActionDto = {
        user: new mongoose.Types.ObjectId(initiator),
        itemId: new mongoose.Types.ObjectId(newProject._id),
        name: "Update project",
        actionType: "update",
        type: actionType,
        value: { name: newProject.name, img: newProject.logo },
        date: new Date(),
        status: "admin",
        category: "projects",
      };

      await this.actionsService.addAction(action);

      return newProject;
    }

    if (roleData.isUser) {
      const existingProject = await this.projectModel.findById(id).exec();

      const newProjectData = {
        ...existingProject.toObject(),
        isDuplicate: true,
        originalEntityId: new mongoose.Types.ObjectId(id),
        _id: new mongoose.Types.ObjectId(),
        projectStatus: "moderator",
        [key]: participantsIds,
      };

      const newProject = await this.projectModel.create(newProjectData);

      const actionType: string = `Update project on ${existingProject.projectType === "project"
        ? "crypto"
        : existingProject.projectType
        } page`;

      const action: AddActionDto = {
        user: new mongoose.Types.ObjectId(initiator),
        itemId: new mongoose.Types.ObjectId(newProject._id),
        name: "Update project",
        actionType: "update",
        type: actionType,
        value: { name: newProject.name, img: newProject.logo },
        date: new Date(),
        status: "moderator",
        category: "projects",
      };

      await this.actionsService.addAction(action);

      await this.userModel.findByIdAndUpdate(initiator, {
        $inc: { projectLimit: -1 },
      });

      return newProject;
    }
  }

  async addComment(id: string, comment: commentDto): Promise<Array<any>> {
    const project = await this.projectModel.findById(id);

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
    const project = await this.projectModel.findOne({ _id: id });

    await this.commentsService.removeComment(comment);

    const filteredComments: Array<any> = project.comments.filter(
      (prComment) => String(prComment._id) !== comment
    );

    project.comments = filteredComments;

    await project.save();

    return filteredComments;
  }

  async removeProject(id: string) {
    const project = await this.projectModel.findOneAndDelete({ _id: id });

    return project;
  }

  async toggleRedStatus(id: string) {
    const project = await this.projectModel.findById(id);

    project.redStatus = !project.redStatus;

    return await project.save();
  }

  async changeStatus(id: string, status: string) {
    const project = await this.projectModel.findById(id);

    project.status = status;

    return await project.save();
  }

  async endProject(id: string, isRefunded: boolean) {
    const project = await this.projectModel.findByIdAndUpdate(id, {
      isRefunded,
      poolActive: false,
      status: "Ended",
    });

    return project;
  }

  async startClaim(id: string, ticker: string) {
    const project = await this.projectModel.findByIdAndUpdate(id, {
      isClaimStart: true,
      ticker,
    });

    return project;
  }

  async addLike(projectId: string, userId: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId).exec();
    const uId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(userId);

    if (project.likes.includes(uId)) {
      return this.projectModel
        .findByIdAndUpdate(projectId, { $pull: { likes: uId } }, { new: true })
        .exec();
    }

    return this.projectModel
      .findByIdAndUpdate(
        projectId,
        {
          $addToSet: { likes: uId },
          $pull: { dislikes: uId },
        },
        { new: true }
      )
      .exec();
  }

  async addDislike(projectId: string, userId: string): Promise<Project> {
    const project = await this.projectModel.findById(projectId).exec();
    const uId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(userId);

    if (project.dislikes.includes(uId)) {
      return this.projectModel
        .findByIdAndUpdate(
          projectId,
          { $pull: { dislikes: uId } },
          { new: true }
        )
        .exec();
    }

    return this.projectModel
      .findByIdAndUpdate(
        projectId,
        {
          $addToSet: { dislikes: uId },
          $pull: { likes: uId },
        },
        { new: true }
      )
      .exec();
  }

  async toggleSection(projectId: string, section: string) {
    const project = await this.projectModel.findById(projectId);

    let update;

    if (project.sections.includes(section)) {
      update = { $pull: { sections: section } };
    } else {
      update = { $addToSet: { sections: section } };
    }

    return this.projectModel.findByIdAndUpdate(projectId, update, { new: true });
  }

}
