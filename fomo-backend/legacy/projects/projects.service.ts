import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Types } from "mongoose";
import { FilesService } from "src/files/files.service";
import { RatingService } from "src/rating/rating.service";
import { CommentsService } from "src/comments/comments.service";

import { Project, ProjectDocument } from "./project.model";
import { Person, PersonDocument } from "src/persons/person.model";
import { News, NewsDocument } from "src/news/models/news.model";
import { User, UserDocument } from "src/user/user.model";
import { Funds, FundsDocument } from "src/funds/funds.model";
import {
  ParticipantsKeys,
  ParticipantsProjectDto,
} from "./dto/participants-project.dto";
import { CreateProjectDto } from "./dto/create-project.dto";
import {
  RolesDto,
  UpdateProjectByUserDto,
  UpdateProjectDto,
} from "./dto/update-project.dto";
import { QueryProjectDto } from "./dto/query-project.dto";
import { Comment, CommentDocument } from "src/comments/models/comment.model";
import { AddActionDto } from "../actions/dto/add-action.dto";
import { ActionsService } from "src/actions/actions.service";
import commentDto from "src/comments/dto/comment.dto";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { TwitterService } from "src/twitter/twitter.service";
import { NotificationsService } from "src/notifications/notifications.service";
import {
  Notification,
  NotificationDocument,
} from "src/notifications/model/notification.model";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression, Interval } from "@nestjs/schedule";
import { ActivityService } from "src/activity/activity.service";
import {
  ProjectTwitter,
  ProjectTwitterDocument,
} from "src/twitter/project-twitter.model";
import {
  ProjectChartHistory,
  ProjectChartHistoryDocument,
} from "./project-chart-history.model";
import {
  ProjectsCategories,
  ProjectsCategoriesDocument,
} from "./categories.model";
import {
  ProjectSourceMap,
  ProjectSourceMapDocument,
} from "./intel-sync/models/project-source-map.model";
import axios from "axios";
import { FundingRound, FundingRoundDocument } from "src/funding-rounds/models/funding-round.model";
import { ProjectsIntelIcosSyncService } from "./projects-intel-icos-sync.service";
import { PortfolioRecalculationService } from "src/portfolio/portfolio-recalculation.service";
import { COINGECKO_TIERS } from "src/coingecko/config/coingecko-tier.config";
import {
  FomoV2IcoProjectReadService,
  FomoV2MarketProjectReadModelService,
} from "src/fomo-v2/services";

export interface IProjectMarketData {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  num_market_pairs: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  infinite_supply: boolean;
  last_updated: string;
  date_added: string;
  tags: Array<string>;
  platform: any;
  self_reported_circulating_supply: any;
  self_reported_market_cap: any;
  description: string;
  twitterAcc: string;
  tokenAddress: string | undefined;
  quote: {
    USD: {
      price: number;
      volume_24h: number;
      volume_change_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      market_cap: number;
      market_cap_dominance: number;
      fully_diluted_market_cap: number;
      last_updated: string;
    };
    BTC: {
      price: number;
      volume_24h: number;
      volume_change_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      market_cap: number;
      market_cap_dominance: number;
      fully_diluted_market_cap: number;
      last_updated: string;
    };
    ETH: {
      price: number;
      volume_24h: number;
      volume_change_24h: number;
      percent_change_1h: number;
      percent_change_24h: number;
      percent_change_7d: number;
      market_cap: number;
      market_cap_dominance: number;
      fully_diluted_market_cap: number;
      last_updated: string;
    };
  };
}

export interface IProjectMetaData {
  id: number;
  name: string;
  symbol: string;
  category: string;
  description: string;
  slug: string;
  logo: string;
  subreddit: string;
  notice: string;
  tags: string[];
  tagNames: string[];
  tagGroups: string[];
  urls: {
    website: string[];
    twitter: string[];
    message_board: string[];
    chat: string[];
    facebook: string[];
    explorer: string[];
    reddit: string[];
    technical_doc: string[];
    source_code: string[];
    announcement: string[];
  };
  platform: {
    id: string;
    name: string;
    slug: string;
    symbol: string;
    token_address: string;
  };
  date_added: string;
  twitter_username: string;
  is_hidden: number;
  date_launched: string;
  contract_address: Array<{
    contract: string;
    platform: string;
  }>;
  self_reported_circulating_supply: number | null;
  self_reported_tags: string[] | null;
  self_reported_market_cap: number | null;
  infinite_supply: boolean;
}

type MarketCategoryType = "recently" | "gainers" | "trending" | "accumulation";
const MARKET_VISIBLE_RANK_FILTER = {
  $gte: COINGECKO_TIERS.HOT.minRank,
  $lte: COINGECKO_TIERS.WARM.maxRank,
};

@Injectable()
export class ProjectsService {
  private readonly apiUrl = "https://pro-api.coinmarketcap.com/v1";
  private readonly apiUrlV2 = "https://pro-api.coinmarketcap.com/v2";
  private coinGeckoProjectIdsCache:
    | { expiresAt: number; ids: mongoose.Types.ObjectId[] }
    | null = null;
  private marketCategoriesCache: { expiresAt: number; result: any } | null = null;

  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(ProjectChartHistory.name)
    private readonly projectChartHistoryModel: Model<ProjectChartHistoryDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Comment.name) private Comment: Model<CommentDocument>,
    @InjectModel(Person.name) private personModel: Model<PersonDocument>,
    @InjectModel(News.name) private newsModel: Model<NewsDocument>,
    @InjectModel(Funds.name) private fundModel: Model<FundsDocument>,
    @InjectModel(FundingRound.name) private fundingRound: Model<FundingRoundDocument>,
    @InjectModel(ProjectTwitter.name)
    private projectTwitterModel: Model<ProjectTwitterDocument>,
    @InjectModel(Notification.name)
    notificationModel: Model<NotificationDocument>,
    @InjectModel(ProjectsCategories.name)
    private projectsCategoriesModel: Model<ProjectsCategoriesDocument>,
    @InjectModel(ProjectSourceMap.name)
    private projectSourceMapModel: Model<ProjectSourceMapDocument>,
    private readonly filesService: FilesService,
    private readonly configService: ConfigService,
    private readonly ratingService: RatingService,
    private readonly commentsService: CommentsService,
    private readonly actionsService: ActionsService,
    private readonly twitterService: TwitterService,
    private readonly httpService: HttpService,
    private readonly notificationsService: NotificationsService,
    private readonly activityService: ActivityService,
    private readonly projectsIntelIcosSyncService: ProjectsIntelIcosSyncService,
    private readonly portfolioRecalculationService: PortfolioRecalculationService,
    private readonly fomoV2MarketReadModelService: FomoV2MarketProjectReadModelService,
    private readonly fomoV2IcoProjectReadService: FomoV2IcoProjectReadService,
  ) {
    // this.handleCron();
    // this.update200Projects()
    // this.updateProjectsInfo()
    // this.getIcoAndSave()
    // this.removeProjectsWithFundingFeedSection()
  }


  async removeProjectsWithFundingFeedSection(): Promise<{ deletedCount?: number }> {
    try {
      const result = await this.projectModel.deleteMany({ sections: "funding-feed" });
      return result;
    } catch (error) {
      throw error;
    }
  }

  // @Cron(CronExpression.EVERY_12_HOURS)
  async handleCron() {
    if (this.configService.get("IS_LOCAL_RUN") === "true") return;

    console.log("🔄 Cron: Updating projects info...");
    await this.updateProjectsInfo();
  }

  async update200Projects() {
    console.log("Legacy public CoinGecko top-200 updater is disabled. CoinGecko PRO tiered orchestrator owns quote updates.");
  }

  private async update200ProjectsLegacy() {
    try {
      if (this.configService.get("IS_LOCAL_RUN") === "true") return;

      const projects = await this.projectModel
        .find({ rank: { $ne: null } })
        .sort({ rank: 1 })
        .limit(200)
        .select("_id slug");

      const slugs = projects.map((p) => p.slug);

      const marketData = await this.fetchMarketData(slugs);

      const operations = marketData.map((data) => ({
        updateOne: {
          filter: { slug: data.id },
          update: {
            $set: {
              price: data.current_price,
              priceChange: data.price_change_percentage_24h,
              volume24h: data.total_volume,
              marketCap: data.market_cap,
              circulatingSupply: data.circulating_supply,
              totalSupply: data.total_supply,
              maxSupply: data.max_supply,
              athUsd: data.ath,
              athUsdDate: new Date(data.ath_date),
              atlUsd: data.atl,
              atlUsdDate: new Date(data.atl_date),
              usdQuote: {
                price: data.current_price,
                percent_change_1h: data.price_change_percentage_1h_in_currency,
                percent_change_24h:
                  data.price_change_percentage_24h_in_currency,
                percent_change_7d: data.price_change_percentage_7d_in_currency,
                last_updated: data.last_updated,
              },
              marketDataUpdatedAt: data.last_updated
                ? new Date(data.last_updated)
                : new Date(),
            },
          },
        },
      }));

      await this.projectModel.bulkWrite(operations);
      await this.portfolioRecalculationService.markPortfoliosForMarketData(
        projects.map((project) => project._id.toString())
      );
      console.log(`TOP 200 PROJECTS UPDATES ${new Date().toISOString()}`);
    } catch (error) {
      console.error("Error updating projects:", error);
    }
  }

  private async fetchMarketData(slugs: string[]) {
    const url = "https://api.coingecko.com/api/v3/coins/markets";
    const params = {
      vs_currency: "usd",
      ids: slugs.join(","),
      order: "market_cap_desc",
      per_page: slugs.length,
      page: 1,
      price_change_percentage: "1h,24h,7d",
    };

    const response = await axios.get(url, { params });
    return response.data;
  }

  private async updateProjectsInfo(): Promise<void> {
    const total = 100;
    let skip = 0;
    let limit = 200;

    const projects: Array<{ _id: Types.ObjectId; symbol: string }> =
      await this.projectModel
        .find({})
        .skip(skip)
        .limit(limit)
        .select("symbol")
        .lean();

    for (let i = 0; i < projects.length; i++) {
      const project = projects[i];
      const url: string = `https://data.messari.io/api/v1/assets/${project.symbol}/profile`;

      try {
        const data = await this.safeRequest(url, {}, {}, 1);
        const updateData = {
          descriptionText:
            `<h2>About ${project.symbol}</h2><br/>${data.overview}<br/><br/>${data.technology}<br/><br/>
          `
              .split("\n\n")
              .map((p) => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
              .join(""),
          consensusAlgorithm: data.consensus_algorithm,
          banner: data.tagline || "",
          tokenDistribution: data.token_distribution,
          tokenDetails: data.token_details,
          sector: data.sector || "",
          organizations: data.organizations || [],
          contributors: data.contributors || [],
        };
        await this.projectModel.updateOne(
          { _id: project._id },
          { $set: updateData }
        );
      } catch (error: any) {
        console.error(
          `Failed to fetch data for project ${project.symbol}:`,
          error.message
        );
      }

      await this.sleep(2000);
      console.log(`Processed project: ${project.symbol}`);
    }
  }

  private async safeRequest(
    url: string,
    params: any,
    headers: any,
    retries = 5
  ): Promise<any> {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const res = await firstValueFrom(
          this.httpService.get(url, { headers, params })
        );
        return res.data.data;
      } catch (error: any) {
        const status = error?.response?.status;
        const message = error?.response?.data || error.message;

        console.warn(
          `Request to ${url} failed on attempt ${attempt + 1
          }/${retries}. Status: ${status}`
        );

        if (status === 429 || status >= 500) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`Waiting ${delay}ms before retry...`);
          await this.sleep(delay);
        } else {
          throw new Error(
            `Request failed with status ${status}. Message: ${JSON.stringify(
              message
            )}`
          );
        }

        if (attempt === retries - 1) {
          throw new Error(
            `Failed after ${retries} retries. Last status: ${status}, message: ${JSON.stringify(
              message
            )}`
          );
        }
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
    );
  }

  private parseArrayToObjectId(
    items: string | undefined
  ): Array<mongoose.Types.ObjectId> {
    if (!items) return [];

    return items
      .split(",")
      .map((id: string) => new mongoose.Types.ObjectId(id));
  }

  private getProjectMarketData = async (
    projectName: string
  ): Promise<IProjectMarketData | undefined> => {
    const headers = {
      "X-CMC_PRO_API_KEY": this.configService.get("COINMARKET_KEY"),
    };

    const resMarket = await firstValueFrom(
      this.httpService.get(
        `${this.apiUrl}/cryptocurrency/listings/latest?limit=${5000}`,
        { headers }
      )
    );
    const projectData: IProjectMarketData | undefined =
      resMarket?.data?.data &&
      resMarket.data.data.find(
        (item: any) => item.name.toLowerCase() === projectName.toLowerCase()
      );

    if (!projectData) return;

    const projectMarketData = await firstValueFrom(
      this.httpService.get(
        `${this.apiUrl}/cryptocurrency/map?start=${projectData?.id}&symbol=${projectData?.symbol}`,
        { headers }
      )
    );
    const projectDataWithAddress: any | undefined =
      projectMarketData?.data?.data.find(
        (item: any) => item.name.toLowerCase() === projectName.toLowerCase()
      );
    const tokenAddress: string | undefined =
      projectDataWithAddress?.platform?.token_address;

    const params = {
      id: String(projectData?.id),
    };

    const resMetadata = await firstValueFrom(
      this.httpService.get(`${this.apiUrl}/cryptocurrency/info`, {
        params,
        headers,
      })
    );

    return {
      ...projectData,
      description: resMetadata.data.data[String(projectData.id)]?.description,
      twitterAcc:
        resMetadata.data.data[String(projectData.id)]?.urls?.twitter[0] || "",
      tokenAddress,
    };
  };

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
      const investorIds = Array.isArray(query.investors)
        ? query.investors.map((id: string) => new mongoose.Types.ObjectId(id))
        : [new mongoose.Types.ObjectId(query.investors)];

      andConditions.push({
        investors: { $in: investorIds },
      });
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
    const skip = Number(query?.offset || 0);
    const limit = Number(query?.limit || 20);
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
    }

    if (type === "project") {
      matchStage.isSandbox = isSandboxQuery ? true : { $ne: true };
    }

    if (type === "market") {
      matchStage.trading = "CURRENTLY_TRADING";
    }

    if (query?.status) {
      matchStage.status = { $regex: new RegExp(query.status, "i") };
    }

    if (query?.searchValue) {
      matchStage.name = { $regex: query.searchValue, $options: "i" };
    }

    if (query?.additionalStatus === "sponsored") {
      matchStage.isSponsored = true;
    }

    if (query?.additionalStatus === "eralash") {
      matchStage.isEralash = true;
    }

    if (excludedProjectIds.length) {
      matchStage._id = {
        ...(matchStage._id || {}),
        $nin: excludedProjectIds,
      };
    }

    if (query?.projectTypes) {
      matchStage.projectType = {
        $in: JSON.parse(String(query.projectTypes)),
      };
    }

    if (query?.projectValidation) {
      matchStage.projectStatus = {
        $in: JSON.parse(String(query.projectValidation)),
      };
    }

    if (query?.totalRaised) {
      const values = JSON.parse(String(query.totalRaised));
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

    if (query?.section === 'funding-feed') {
      pipeline.push({
        $lookup: {
          from: this.fundingRound.collection.name,
          let: { projectSlug: "$slug" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$coinSlug", "$$projectSlug"] }
              }
            }
          ],
          as: "fundingRounds"
        }
      });

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
    const pageOnlySort = type === "market";

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
          [sortKey]: Number(query.sortNumberValue),
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
    if (type === "market" && String(query?.readModel || "").toLowerCase() === "v2") {
      return this.fomoV2MarketReadModelService.getCompatibleMarketProjects(query, {
        fallback: query?.fallback,
      });
    }

    if (type === "project" && String(query?.readModel || "").toLowerCase() === "v2") {
      return this.fomoV2IcoProjectReadService.getCompatibleIcoProjects(query);
    }

    const pipeline = this.buildProjectPipeline(type, projectStatus, query);
    const filter = this.buildProjectFilter(this.parseQueryString(query));

    if (Object.keys(filter).length > 0) {
      const effectiveFilter =
        type === "market"
          ? this.mergeMatchStages(filter, { rank: MARKET_VISIBLE_RANK_FILTER })
          : filter;
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

  async getMarketV2ParityReport(query: any = {}): Promise<any> {
    return this.fomoV2MarketReadModelService.buildParityReport({
      limit: Number(query?.limit || 100),
      offset: Number(query?.offset || 0),
      examplesLimit: Number(query?.examplesLimit || query?.examples || 10),
    });
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

  async getIcoProjectFilters(
    limit?: string
  ): Promise<{
    categories: Array<{ key: string; label: string; count: number }>;
    fundingTypes: Array<{ key: string; label: string; count: number }>;
  }> {
    const optionLimit = Math.min(Math.max(Number(limit) || 8, 1), 24);
    const baseMatch = { source: "icodrops", projectType: "project" };
    const normalizeOptionsPipeline = (ignoredValues: string[] = []): any[] => [
      {
        $project: {
          value: {
            $trim: {
              input: { $toString: "$values" },
            },
          },
        },
      },
      {
        $match: {
          value: {
            $nin: [
              null,
              "",
              "-",
              "all",
              "Show all",
              "Unknown",
              "N/A",
              "null",
              "undefined",
              ...ignoredValues,
            ],
          },
        },
      },
      { $group: { _id: "$value", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: optionLimit },
      { $project: { _id: 0, key: "$_id", label: "$_id", count: 1 } },
    ];

    const [categories, fundingTypes] = await Promise.all([
      this.projectModel.aggregate([
        { $match: baseMatch },
        {
          $project: {
            rawCategories: { $ifNull: ["$rawIcoData.categories", []] },
            categories: { $ifNull: ["$categories", []] },
            type: "$type",
            mainCategoryValue: {
              $cond: [
                { $eq: [{ $type: "$mainCategory" }, "string"] },
                "$mainCategory",
                "$mainCategory.name",
              ],
            },
          },
        },
        {
          $project: {
            categories: {
              $cond: [
                { $gt: [{ $size: "$rawCategories" }, 0] },
                "$rawCategories",
                "$categories",
              ],
            },
            type: 1,
            mainCategoryValue: 1,
          },
        },
        {
          $project: {
            values: {
              $cond: [
                { $gt: [{ $size: "$categories" }, 0] },
                "$categories",
                {
                  $filter: {
                    input: ["$mainCategoryValue", "$type"],
                    as: "value",
                    cond: {
                      $and: [
                        { $ne: ["$$value", null] },
                        { $ne: ["$$value", ""] },
                      ],
                    },
                  },
                },
              ],
            },
          },
        },
        { $unwind: "$values" },
        ...normalizeOptionsPipeline(),
      ]),
      this.projectModel.aggregate([
        { $match: baseMatch },
        {
          $project: {
            roundValues: {
              $filter: {
                input: ["$round"],
                as: "value",
                cond: {
                  $and: [
                    { $ne: ["$$value", null] },
                    { $ne: ["$$value", ""] },
                  ],
                },
              },
            },
            fundraisingTypes: {
              $map: {
                input: { $ifNull: ["$fundraising", []] },
                as: "round",
                in: "$$round.type",
              },
            },
            fundraisingNames: {
              $map: {
                input: { $ifNull: ["$fundraising", []] },
                as: "round",
                in: "$$round.name",
              },
            },
            rawSaleRoundTypes: {
              $map: {
                input: { $ifNull: ["$rawIcoData.saleRounds", []] },
                as: "round",
                in: "$$round.type",
              },
            },
            rawSaleRoundNames: {
              $map: {
                input: { $ifNull: ["$rawIcoData.saleRounds", []] },
                as: "round",
                in: "$$round.name",
              },
            },
            rawSaleRoundRoundNames: {
              $map: {
                input: { $ifNull: ["$rawIcoData.saleRounds", []] },
                as: "round",
                in: "$$round.roundName",
              },
            },
          },
        },
        {
          $project: {
            values: {
              $setUnion: [
                "$roundValues",
                "$fundraisingTypes",
                "$fundraisingNames",
                "$rawSaleRoundTypes",
                "$rawSaleRoundNames",
                "$rawSaleRoundRoundNames",
              ],
            },
          },
        },
        { $unwind: "$values" },
        ...normalizeOptionsPipeline(["Active", "Upcoming", "Ended"]),
      ]),
    ]);

    return {
      categories,
      fundingTypes,
    };
  }

  private getMarketDataFreshWindowMs(): number {
    const hours = Number(this.configService.get("MARKET_DATA_FRESH_HOURS") || 72);

    return Math.max(1, hours) * 60 * 60 * 1000;
  }

  private async getVerifiedCoinGeckoProjectIds(): Promise<mongoose.Types.ObjectId[]> {
    const now = Date.now();

    if (this.coinGeckoProjectIdsCache && this.coinGeckoProjectIdsCache.expiresAt > now) {
      return this.coinGeckoProjectIdsCache.ids;
    }

    const rawIds = await this.projectSourceMapModel.distinct("projectId", {
      source: "coingecko",
      isVerified: true,
    });
    const ids = rawIds
      .map((id: any) => String(id || ""))
      .filter((id: string) => mongoose.Types.ObjectId.isValid(id))
      .map((id: string) => new mongoose.Types.ObjectId(id));
    const ttlMs = Number(this.configService.get("MARKET_CATEGORY_COINGECKO_IDS_CACHE_MS") || 300000);

    this.coinGeckoProjectIdsCache = {
      expiresAt: now + Math.max(1000, ttlMs),
      ids,
    };

    return ids;
  }

  private clamp01(expression: any): any {
    return { $min: [1, { $max: [0, expression] }] };
  }

  private logWeightExpression(valueExpression: any, floor: number, ceiling: number): any {
    const minLog = Math.log10(floor);
    const maxLog = Math.log10(ceiling);

    return this.clamp01({
      $divide: [
        {
          $subtract: [
            { $log10: { $max: [valueExpression, 1] } },
            minLog,
          ],
        },
        maxLog - minLog,
      ],
    });
  }

  private scoreExpression(weightExpression: any): any {
    return { $multiply: [weightExpression, 100] };
  }

  private positivePercentScoreExpression(field: string, capPercent: number): any {
    return this.scoreExpression(
      this.clamp01({
        $divide: [
          { $max: [{ $ifNull: [`$${field}`, 0] }, 0] },
          capPercent,
        ],
      })
    );
  }

  private rankScoreExpression(maxRank = 5500): any {
    const rankWeight = this.clamp01({
      $subtract: [
        1,
        {
          $divide: [
            { $subtract: ["$rank", 1] },
            maxRank - 1,
          ],
        },
      ],
    });

    return this.scoreExpression({
      $cond: [
        {
          $and: [
            { $gt: ["$rank", 0] },
            { $lte: ["$rank", maxRank] },
          ],
        },
        rankWeight,
        0,
      ],
    });
  }

  private freshnessWeightExpression(now: Date): any {
    return this.clamp01({
      $subtract: [
        1,
        {
          $divide: [
            { $subtract: [now, "$effectiveMarketDataUpdatedAt"] },
            this.getMarketDataFreshWindowMs(),
          ],
        },
      ],
    });
  }

  private volumeToMarketCapExpression(): any {
    return {
      $cond: [
        { $gt: ["$marketCap", 0] },
        { $divide: ["$volume24h", "$marketCap"] },
        0,
      ],
    };
  }

  private volumeToMarketCapScoreExpression(): any {
    return this.scoreExpression(
      this.clamp01({
        $divide: [this.volumeToMarketCapExpression(), 0.5],
      })
    );
  }

  private stabilityScoreExpression(): any {
    return this.scoreExpression({
      $subtract: [
        1,
        this.clamp01({
          $divide: [
            { $abs: { $ifNull: ["$priceChange", 0] } },
            20,
          ],
        }),
      ],
    });
  }

  private recencyScoreExpression(now: Date): any {
    const recentWindowMs = 180 * 24 * 60 * 60 * 1000;

    return this.scoreExpression(
      this.clamp01({
        $subtract: [
          1,
          {
            $divide: [
              { $subtract: [now, "$dateAdded"] },
              recentWindowMs,
            ],
          },
        ],
      })
    );
  }

  private buildMarketEligibilityStages(
    verifiedCoinGeckoProjectIds: mongoose.Types.ObjectId[] = []
  ): any[] {
    const freshCutoff = new Date(Date.now() - this.getMarketDataFreshWindowMs());
    const coinGeckoEligibility: any[] = [
      { coingeckoId: { $exists: true, $nin: [null, ""] } },
    ];

    if (verifiedCoinGeckoProjectIds.length) {
      coinGeckoEligibility.push({ _id: { $in: verifiedCoinGeckoProjectIds } });
    }

    return [
      {
        $addFields: {
          effectiveMarketDataUpdatedAt: {
            $ifNull: [
              {
                $convert: {
                  input: "$marketDataUpdatedAt",
                  to: "date",
                  onError: null,
                  onNull: null,
                },
              },
              {
                $ifNull: [
                  {
                    $convert: {
                      input: "$usdQuote.last_updated",
                      to: "date",
                      onError: null,
                      onNull: null,
                    },
                  },
                  {
                    $convert: {
                      input: "$lastPriceHistoryUpdate",
                      to: "date",
                      onError: null,
                      onNull: null,
                    },
                  },
                ],
              },
            ],
          },
        },
      },
      {
        $match: {
          price: { $gt: 0 },
          volume24h: { $gt: 0 },
          marketCap: { $gt: 0 },
          effectiveMarketDataUpdatedAt: { $gte: freshCutoff },
          $or: coinGeckoEligibility,
        },
      },
    ];
  }

  private buildMarketCategoryFilterStage(type: MarketCategoryType): any {
    switch (type) {
      case "recently":
        return {
          $match: {
            dateAdded: { $exists: true, $ne: null },
            volume24h: { $gt: 10_000 },
            price: { $gt: 0 },
          },
        };
      case "gainers":
        return {
          $match: {
            priceChange: { $gt: 0 },
            volume24h: { $gte: 100_000 },
            marketCap: { $gte: 1_000_000 },
            rank: MARKET_VISIBLE_RANK_FILTER,
          },
        };
      case "trending":
        return {
          $match: {
            volume24h: { $gte: 50_000 },
            marketCap: { $gte: 500_000 },
            priceChange: { $gt: -300, $lt: 300 },
          },
        };
      case "accumulation":
        return {
          $match: {
            volume24h: { $gte: 100_000 },
            marketCap: { $gte: 1_000_000 },
            priceChange: { $gte: -10, $lte: 20 },
          },
        };
      default:
        throw new Error("Invalid type");
    }
  }

  private buildMarketCategoryScoreStage(type: MarketCategoryType): any {
    const now = new Date();
    const liquidityWeight = this.logWeightExpression("$volume24h", 100_000, 50_000_000);
    const liquidityScore = this.scoreExpression(liquidityWeight);
    const marketCapWeight = this.logWeightExpression("$marketCap", 1_000_000, 1_000_000_000);
    const marketCapScore = this.scoreExpression(marketCapWeight);
    const freshnessWeight = this.freshnessWeightExpression(now);
    const volume24hChangeScore = this.positivePercentScoreExpression("volume24hChange", 300);
    const priceChange24hScore = this.positivePercentScoreExpression("priceChange", 100);
    const scoreField = this.getMarketCategoryScoreField(type);
    let scoreExpression: any;

    switch (type) {
      case "gainers":
        scoreExpression = {
          $multiply: [
            "$priceChange",
            liquidityWeight,
            marketCapWeight,
            freshnessWeight,
          ],
        };
        break;
      case "trending":
        scoreExpression = {
          $add: [
            { $multiply: [volume24hChangeScore, 0.55] },
            { $multiply: [priceChange24hScore, 0.25] },
            { $multiply: [this.scoreExpression(this.logWeightExpression("$volume24h", 50_000, 50_000_000)), 0.15] },
            { $multiply: [this.rankScoreExpression(), 0.05] },
          ],
        };
        break;
      case "accumulation":
        scoreExpression = {
          $add: [
            { $multiply: [volume24hChangeScore, 0.45] },
            { $multiply: [this.volumeToMarketCapScoreExpression(), 0.30] },
            { $multiply: [liquidityScore, 0.15] },
            { $multiply: [this.stabilityScoreExpression(), 0.10] },
          ],
        };
        break;
      case "recently":
        scoreExpression = {
          $add: [
            { $multiply: [this.recencyScoreExpression(now), 0.55] },
            { $multiply: [this.scoreExpression(this.logWeightExpression("$volume24h", 10_000, 10_000_000)), 0.25] },
            { $multiply: [marketCapScore, 0.10] },
            { $multiply: [this.positivePercentScoreExpression("priceChange", 50), 0.10] },
          ],
        };
        break;
      default:
        throw new Error("Invalid type");
    }

    return {
      $addFields: {
        [scoreField]: scoreExpression,
        marketCategoryScore: scoreExpression,
        volumeToMarketCap: this.volumeToMarketCapExpression(),
      },
    };
  }

  private getMarketCategoryScoreField(type: MarketCategoryType): string {
    const fields: Record<MarketCategoryType, string> = {
      recently: "recentlyAddedScore",
      gainers: "gainerScore",
      trending: "trendingScore",
      accumulation: "accumulationScore",
    };

    return fields[type];
  }

  private getMarketCategorySort(type: MarketCategoryType): Record<string, 1 | -1> {
    const scoreField = this.getMarketCategoryScoreField(type);

    switch (type) {
      case "recently":
        return { [scoreField]: -1, dateAdded: -1, volume24h: -1, rank: 1 };
      case "gainers":
        return { [scoreField]: -1, priceChange: -1, volume24h: -1, rank: 1 };
      case "trending":
        return { [scoreField]: -1, volume24hChange: -1, volume24h: -1, rank: 1 };
      case "accumulation":
        return { [scoreField]: -1, volume24hChange: -1, volumeToMarketCap: -1, rank: 1 };
      default:
        throw new Error("Invalid type");
    }
  }

  private buildMarketCategoryFacet(
    type: MarketCategoryType,
    limit: number,
    fields: Record<string, any>,
    includeEligibility = true,
    verifiedCoinGeckoProjectIds: mongoose.Types.ObjectId[] = []
  ): any[] {
    return [
      ...(includeEligibility
        ? this.buildMarketEligibilityStages(verifiedCoinGeckoProjectIds)
        : []),
      this.buildMarketCategoryFilterStage(type),
      this.buildMarketCategoryScoreStage(type),
      { $sort: this.getMarketCategorySort(type) },
      { $limit: limit },
      { $project: fields },
    ];
  }

  async getMarketCategories(query: QueryProjectDto = {} as QueryProjectDto): Promise<any> {
    if (String(query?.readModel || "").toLowerCase() === "v2") {
      return this.fomoV2MarketReadModelService.getMarketCategories();
    }

    const cacheNow = Date.now();

    if (this.marketCategoriesCache && this.marketCategoriesCache.expiresAt > cacheNow) {
      return this.marketCategoriesCache.result;
    }

    const fields = {
      coingeckoId: 1,
      effectiveCoinGeckoId: 1,
      marketDataUpdatedAt: 1,
      effectiveMarketDataUpdatedAt: 1,
      volume24hChange: 1,
      price: 1,
      priceChange: 1,
      volume24h: 1,
      volumeToMarketCap: 1,
      dateAdded: 1,
      name: 1,
      symbol: 1,
      rank: 1,
      niche: 1,
      logo: 1,
      _id: 1,
      marketCap: 1,
      usdQuote: 1,
      circulatingSupply: 1,
      circulatingSupplyPercent: 1,
      fundsRaised: 1,
      fundsRounds: 1,
      marketCategoryScore: 1,
      recentlyAddedScore: 1,
      gainerScore: 1,
      trendingScore: 1,
      accumulationScore: 1,
    };
    const verifiedCoinGeckoProjectIds = await this.getVerifiedCoinGeckoProjectIds();

    const [marketCategoriesResult, hotProjects] = await Promise.all([
      this.projectModel
        .aggregate([
          ...this.buildMarketEligibilityStages(verifiedCoinGeckoProjectIds),
          {
            $facet: {
              recentlyAdded: this.buildMarketCategoryFacet("recently", 20, fields, false),
              topGainers: this.buildMarketCategoryFacet("gainers", 20, fields, false),
              trending: this.buildMarketCategoryFacet("trending", 20, fields, false),
              accumulation: this.buildMarketCategoryFacet("accumulation", 20, fields, false),
            },
          },
        ])
        .allowDiskUse(true),
      this.projectModel.aggregate([
        { $match: { trading: "CURRENTLY_TRADING" } },
        { $sort: { rank: 1 } },
        { $limit: 100 },
        { $sort: { fundsRaised: -1 } },
        { $limit: 20 },
        { $project: fields },
      ]),
    ]);
    const marketCategories = marketCategoriesResult[0] || {};

    const result = {
      recentlyAdded: marketCategories.recentlyAdded || [],
      topGainers: marketCategories.topGainers || [],
      trending: marketCategories.trending || [],
      accumulation: marketCategories.accumulation || [],
      hotProjects,
    };
    const cacheTtlMs = Number(this.configService.get("MARKET_CATEGORIES_CACHE_MS") || 60000);

    this.marketCategoriesCache = {
      expiresAt: Date.now() + Math.max(1000, cacheTtlMs),
      result,
    };

    return result;
  }

  async getMarketCategory(
    type: MarketCategoryType,
    query?: any
  ): Promise<{ projects: any[]; total: number }> {
    if (String(query?.readModel || "").toLowerCase() === "v2") {
      return this.fomoV2MarketReadModelService.getMarketCategory(type, query);
    }

    const skip = Number(query?.offset || 0);
    const limit = Number(query?.limit || 20);
    const filter = this.buildProjectFilter(this.parseQueryString(query));
    const verifiedCoinGeckoProjectIds = await this.getVerifiedCoinGeckoProjectIds();

    const fields = {
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
    };

    const pipeline: any = [
      ...this.buildMarketEligibilityStages(verifiedCoinGeckoProjectIds),
      this.buildMarketCategoryFilterStage(type),
      ...(Object.keys(filter).length > 0 ? [{ $match: filter }] : []),
      ...(query?.searchValue
        ? [{ $match: { name: { $regex: query.searchValue, $options: "i" } } }]
        : []),
      this.buildMarketCategoryScoreStage(type),
      { $sort: this.getMarketCategorySort(type) },
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          projects: [{ $skip: skip }, { $limit: limit }, { $project: fields }],
        },
      },
    ];
    const result = await this.projectModel.aggregate(pipeline);

    const totalCount = result[0]?.totalCount?.[0]?.count || 0;
    const projects = result[0]?.projects || [];

    return { projects, total: totalCount };
  }

  async getUserProjects(userId: string) {
    const projects: Array<any> = await this.projectModel.aggregate([
      {
        $match: {
          actionInitiator: userId,
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

    const projectIds: Array<mongoose.Types.ObjectId> =
      user.investedProjects.map(
        (item: any) => new mongoose.Types.ObjectId(item)
      );

    const projects: Array<any> = await this.projectModel.find({
      _id: projectIds,
    });

    return projects.reverse();
  }

  async getProject(
    id: string,
    query: QueryProjectDto = {} as QueryProjectDto,
    userId?: string
  ) {
    if (String(query?.readModel || "").toLowerCase() === "v2") {
      const projectType = String(query?.projectType || query?.lookup || "").toLowerCase();
      const lookup = String(query?.lookup || "").toLowerCase();

      if (projectType === "market" || lookup === "coingeckoid") {
        return this.fomoV2MarketReadModelService.getMarketProjectDetailByCoinGeckoId(
          id,
          userId
        );
      }

      if (projectType === "project") {
        return this.fomoV2IcoProjectReadService.getProjectDetailBySlug(
          id,
          userId
        );
      }

      if (projectType === "echo" || lookup === "slug") {
        try {
          return await this.fomoV2IcoProjectReadService.getProjectDetailBySlug(
            id,
            userId
          );
        } catch (error) {
          if (
            !(error instanceof HttpException) ||
            error.getStatus() !== HttpStatus.NOT_FOUND
          ) {
            throw error;
          }
        }

        return this.fomoV2MarketReadModelService.getEchoProjectDetailBySlug(
          id,
          userId
        );
      }
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException("Project not found", HttpStatus.NOT_FOUND);
    }

    const project = await this.projectModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
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
    await this.enrichIcoProjectWithMarketData(parsedProject);

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

  private async enrichIcoProjectWithMarketData(project: any): Promise<void> {
    if (!project || String(project.projectType || "").toLowerCase() === "market") {
      return;
    }

    const marketProject = await this.findMarketCounterpart(project);
    if (!marketProject) return;

    const numericFields = [
      "price",
      "priceBTC",
      "priceETH",
      "priceSOL",
      "priceChange",
      "marketCap",
      "volume",
      "volume24h",
      "volume24hChange",
      "circulatingSupply",
      "circulatingSupplyPercent",
      "dominance",
      "fullyDilutedMarketCap",
      "totalSupply",
      "maxSupply",
      "volumeAndMarketCap",
      "rank",
      "tvl",
    ];

    for (const field of numericFields) {
      this.assignMarketNumber(project, field, marketProject[field]);
    }

    this.assignStringIfPresent(project, "bio", marketProject.bio);
    this.assignStringIfPresent(project, "twitterAcc", marketProject.twitterAcc);
    if (!this.nonEmptyString(project.tokenAddress)) {
      this.assignStringIfPresent(project, "tokenAddress", marketProject.tokenAddress);
    }

    if (this.nonEmptyString(marketProject.descriptionText)) {
      project.descriptionText = marketProject.descriptionText;
    } else if (this.nonEmptyString(marketProject.bio)) {
      project.descriptionText = this.plainTextToHtml(marketProject.bio);
    }

    if (marketProject.mainCategory && Object.keys(marketProject.mainCategory).length) {
      project.mainCategory = marketProject.mainCategory;
    }

    if (Array.isArray(marketProject.categories) && marketProject.categories.length) {
      project.categories = marketProject.categories;
    }

    if (marketProject.tokenDetails && Object.keys(marketProject.tokenDetails).length) {
      project.marketTokenDetails = marketProject.tokenDetails;
    }

    if (Array.isArray(marketProject.contracts) && marketProject.contracts.length) {
      if (!Array.isArray(project.contracts) || !project.contracts.length) {
        project.contracts = marketProject.contracts;
      }

      if (!this.nonEmptyString(project.tokenAddress)) {
        const firstContract = this.getContractAddress(marketProject.contracts[0]);
        if (firstContract) {
          project.tokenAddress = firstContract;
        }
      }
    }

    project.marketDataSource = {
      projectId: String(marketProject._id),
      slug: marketProject.slug || null,
      symbol: marketProject.symbol || marketProject.ticker || marketProject.niche || null,
      type: "market",
    };
  }

  private async findMarketCounterpart(project: any): Promise<any | null> {
    const rawIcoData = project?.rawIcoData || {};
    const slugs = this.uniqueNonEmptyStrings([
      project?.slug,
      project?.sourceId,
      rawIcoData?.slug,
      rawIcoData?.sourceId,
      rawIcoData?.project?.slug,
      rawIcoData?.profile?.slug,
    ]).map((value) => value.toLowerCase());
    const symbols = this.uniqueNonEmptyStrings([
      project?.symbol,
      project?.ticker,
      project?.niche,
      rawIcoData?.symbol,
      rawIcoData?.ticker,
      rawIcoData?.tokenMetrics?.ticker,
      rawIcoData?.tokenomics?.ticker,
    ]);
    const names = this.uniqueNonEmptyStrings([
      project?.name,
      rawIcoData?.name,
      rawIcoData?.project?.name,
      rawIcoData?.profile?.name,
    ]);
    const baseQuery: any = { projectType: "market" };

    if (project?._id) {
      baseQuery._id = { $ne: project._id };
    }

    const marketFields = [
      "_id",
      "name",
      "slug",
      "symbol",
      "ticker",
      "niche",
      "projectType",
      "trading",
      "price",
      "priceBTC",
      "priceETH",
      "priceSOL",
      "priceChange",
      "marketCap",
      "volume",
      "volume24h",
      "volume24hChange",
      "circulatingSupply",
      "circulatingSupplyPercent",
      "dominance",
      "fullyDilutedMarketCap",
      "totalSupply",
      "maxSupply",
      "volumeAndMarketCap",
      "rank",
      "tvl",
      "bio",
      "descriptionText",
      "twitterAcc",
      "tokenAddress",
      "mainCategory",
      "categories",
      "tokenDetails",
      "contracts",
    ].join(" ");

    const bySlug = await this.findMarketByExactFields(baseQuery, ["slug", "sourceId"], slugs, marketFields);
    if (bySlug) return bySlug;

    const bySymbol = await this.findMarketByExactFields(
      baseQuery,
      ["symbol", "ticker", "niche"],
      symbols,
      marketFields
    );
    if (bySymbol) return bySymbol;

    return this.findMarketByExactFields(baseQuery, ["name"], names, marketFields);
  }

  private async findMarketByExactFields(
    baseQuery: any,
    fields: string[],
    values: string[],
    select: string
  ): Promise<any | null> {
    if (!values.length) return null;

    const expressions = values.map((value) => this.exactRegex(value));
    const query = {
      ...baseQuery,
      $or: fields.flatMap((field) =>
        expressions.map((expression) => ({ [field]: expression }))
      ),
    };

    return this.projectModel.findOne(query).select(select).lean();
  }

  private assignMarketNumber(target: any, key: string, value: any): void {
    const number = Number(value);
    if (!Number.isFinite(number)) return;

    const current = Number(target?.[key]);
    if (number !== 0 || !Number.isFinite(current) || current === 0) {
      target[key] = number;
    }
  }

  private assignStringIfPresent(target: any, key: string, value: any): void {
    if (this.nonEmptyString(value)) {
      target[key] = String(value).trim();
    }
  }

  private getContractAddress(contract: any): string {
    if (typeof contract === "string") return contract.trim();
    if (!contract || typeof contract !== "object") return "";

    const value =
      contract.contract ??
      contract.address ??
      contract.contractAddress ??
      contract.tokenAddress ??
      contract.value;

    return typeof value === "string" ? value.trim() : "";
  }

  private nonEmptyString(value: any): boolean {
    return typeof value === "string" && value.trim().length > 0;
  }

  private uniqueNonEmptyStrings(values: any[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const value of values) {
      if (value === undefined || value === null) continue;
      const text = String(value).trim();
      const key = text.toLowerCase();
      if (!text || seen.has(key)) continue;
      seen.add(key);
      result.push(text);
    }

    return result;
  }

  private exactRegex(value: string): RegExp {
    return new RegExp(`^${this.escapeRegExp(value)}$`, "i");
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private plainTextToHtml(value: string): string {
    const escaped = String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    return `<p>${escaped.replace(/\n/g, "<br/>")}</p>`;
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

  async searchAndTransformToAssets(query: string): Promise<Array<any>> {
    const projects =
      await this.fomoV2MarketReadModelService.searchPortfolioAssets(query, 20);

    return projects.map((project) => ({
      _id: project.marketAssetId,
      projectId: project.marketAssetId,
      marketAssetId: project.marketAssetId,
      canonicalProjectId: project.canonicalProjectId,
      type: "buy",
      name: project.name,
      ticker: project.symbol || project.niche || "",
      price: project.price || 0,
      logo: project.logo || "",
      amount: 0,
      totalPrice: 0,
      date: new Date(),
      createAt: new Date(),
      isSelectedAsset: false,
      projectData: project,
    }));
  }

  private buildMarketProjectScoringFields(projectData: any): Record<string, any> | undefined {
    if (String(projectData?.projectType || "").toLowerCase() !== "market") {
      return undefined;
    }

    const scores = this.ratingService.calculateMarketProjectScores(projectData);

    return {
      rating: String(scores.rating),
      fomoScore: scores.rating,
      fullness: `${scores.fullness}%`,
      ratingBreakdown: scores.ratingBreakdown,
      fullnessBreakdown: scores.fullnessBreakdown,
      lastRatingCalculatedAt: scores.ratingBreakdown.calculatedAt,
    };
  }

  private applyMarketProjectScoring(projectData: any): void {
    const scoringFields = this.buildMarketProjectScoringFields(projectData);
    if (scoringFields) {
      Object.assign(projectData, scoringFields);
    }
  }

  async createProject(
    createProjectDto: CreateProjectDto,
    initiator?: string,
    actionStatus?: "moderator" | "admin"
  ) {
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
    const faq = createProjectDto.faq ? JSON.parse(createProjectDto.faq) : [];
    const regionData = createProjectDto.regionData
      ? JSON.parse(createProjectDto.regionData)
      : {};
    const socialmedia = createProjectDto.socialmedia
      ? JSON.parse(createProjectDto.socialmedia)
      : [];

    const marketData: IProjectMarketData | undefined = undefined;
    // await this.getProjectMarketData(createProjectDto.name)

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

    if (marketData) {
      (projectData.price = marketData?.quote?.USD?.price || 0),
        (projectData.priceBTC = marketData?.quote?.BTC?.price || 0),
        (projectData.marketCap = marketData?.quote?.USD?.market_cap),
        (projectData.priceChange =
          marketData?.quote?.USD?.percent_change_24h || 0),
        (projectData.volume24h = marketData?.quote?.USD?.volume_24h || 0),
        (projectData.volume24hChange =
          marketData?.quote?.USD?.volume_change_24h || 0),
        (projectData.circulatingSupply = marketData?.circulating_supply || 0),
        (projectData.symbol = marketData?.symbol || ""),
        (projectData.totalSupply = marketData?.total_supply || 0),
        (projectData.fullyDilutedMarketCap =
          marketData?.quote?.USD?.fully_diluted_market_cap || 0),
        (projectData.bio = marketData?.description || ""),
        (projectData.twitterAcc = marketData?.twitterAcc || ""),
        (projectData.dominance =
          marketData?.quote?.USD?.market_cap_dominance || 0),
        (projectData.marketDataUpdatedAt = marketData?.quote?.USD?.last_updated
          ? new Date(marketData.quote.USD.last_updated)
          : new Date()),
        (projectData.volumeAndMarketCap = isNaN(
          marketData?.quote?.USD?.volume_24h / marketData?.quote?.USD.market_cap
        )
          ? 0
          : marketData?.quote?.USD?.volume_24h /
          marketData?.quote?.USD.market_cap),
        (projectData.tokenAddress = marketData?.tokenAddress || "");
    }

    // const username: string | undefined = marketData?.twitterAcc
    //   ?.split("/")
    //   ?.pop();

    // if (username) {
    //   const twitterData = await this.twitterService.getTweets(username);

    //   projectData.news = twitterData;
    // }

    this.applyMarketProjectScoring(projectData);

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
    const actionType: string = `Publication on ${createProjectDto.projectType === "project"
      ? "crypto"
      : createProjectDto.projectType
      } page`;
    const actionDate: Date = new Date();

    const logo = await this.filesService.writeFile(createProjectDto.logo);

    const investors = this.parseArrayToObjectId(createProjectDto.investors);

    // const marketData: IProjectMarketData | undefined =
    //   await this.getProjectMarketData(createProjectDto.name);

    // const projectData: any = {
    //   ...createProjectDto,
    //   logo: logo,
    //   investors,
    //   action: actionType,
    //   actionDate: actionDate,
    //   actionInitiator: initiator,
    //   price: marketData.quote.USD.price,
    //   priceBTC: marketData.quote.BTC.price,
    //   marketCap: marketData.quote.USD.market_cap,
    //   volume24h: marketData.quote.USD.volume_24h,
    //   volume24hChange: marketData.quote.USD.volume_change_24h,
    //   circulatingSupply: marketData.circulating_supply,
    //   symbol: marketData.symbol,
    //   totalSupply: marketData.total_supply,
    //   fullyDilutedMarketCap: marketData.quote.USD.fully_diluted_market_cap,
    //   bio: marketData.description,
    //   twitterAcc: marketData.twitterAcc,
    //   dominance: marketData.quote.USD.market_cap_dominance,
    //   volumeAndMarketCap:
    //     marketData.quote.USD.volume_24h / marketData.quote.USD.market_cap,
    // };

    const projectData: any = {
      ...createProjectDto,
      logo: logo,
      investors,
      action: actionType,
      actionDate: actionDate,
      actionInitiator: initiator,
    };

    this.applyMarketProjectScoring(projectData);

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

    this.applyMarketProjectScoring(newProjectData);

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

    const scoringFields = this.buildMarketProjectScoringFields({
      ...updatedProject.toObject(),
      ...updatedProjectTmp,
    });
    if (scoringFields) {
      Object.assign(updatedProjectTmp, scoringFields);
    }

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

  async updateSponsoredStatus(id: string) {
    const project = await this.projectModel.findById(id);

    project.isSponsored = !project.isSponsored;

    return await project.save();
  }

  async updateSandboxStatus(id: string) {
    const project = await this.projectModel.findById(id);

    project.isSandbox = !project.isSandbox;

    return await project.save();
  }

  async updateEralashStatus(id: string) {
    const project = await this.projectModel.findById(id);

    project.isEralash = !project.isEralash;
    project.eralashAdded = new Date();

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

  async getCurrentPrices(projectIds: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    const uniqueProjectIds = [...new Set(projectIds)].filter(id => Types.ObjectId.isValid(id));

    if (!uniqueProjectIds.length) return prices;

    const projects = await this.projectModel
      .find({ _id: { $in: uniqueProjectIds.map(id => new Types.ObjectId(id)) } })
      .select('_id price')
      .lean();

    for (const project of projects) {
      prices[project._id.toString()] = project.price || 0;
    }

    return prices;
  }

  async getMainCategories(projectIds: string[]): Promise<Record<string, string>> {
    const categories: Record<string, string> = {};
    const uniqueProjectIds = [...new Set(projectIds)].filter(id => Types.ObjectId.isValid(id));

    if (!uniqueProjectIds.length) return categories;

    const projects = await this.projectModel
      .find({ _id: { $in: uniqueProjectIds.map(id => new Types.ObjectId(id)) } })
      .select('_id mainCategory')
      .lean();

    for (const project of projects) {
      categories[project._id.toString()] = project.mainCategory?.name || '';
    }

    return categories;
  }

  async getBTCAndETHPrices(): Promise<{ btcPrice: number; ethPrice: number }> {
    try {
      const btcProject = await this.projectModel
        .findOne({ $or: [{ niche: "BTC" }, { symbol: "BTC" }, { ticker: "BTC" }] })
        .select({ price: 1 })
        .lean();
      const ethProject = await this.projectModel
        .findOne({ $or: [{ niche: "ETH" }, { symbol: "ETH" }, { ticker: "ETH" }] })
        .select({ price: 1 })
        .lean();

      return {
        btcPrice: btcProject?.price || 1,
        ethPrice: ethProject?.price || 1,
      };
    } catch (error) {
      console.error("Error getting BTC/ETH prices:", error);
      return { btcPrice: 1, ethPrice: 1 };
    }
  }
}
