import { HttpCode, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import mongoose from "mongoose";

import { User, UserDocument } from "./user.model";
import { Action, ActionDocument } from "src/actions/models/action.model";

import { UserDto } from "./dto/user.dto";
import { AuthService } from "src/auth/auth.service";
import {
  BadRequestException,
  HttpException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common/exceptions";
import { HttpStatus } from "@nestjs/common/enums";
import { UpdateUserDto } from "./dto/update-user.dto";
import { FilesService } from "src/files/files.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UserRating } from "./user.model";
import { InviteModeratorDto } from "./dto/invite-moderator.dto";
import { EmailService } from "../email/email.service";
import { RatingService } from "src/rating/rating.service";
import { Project, ProjectDocument } from "src/projects/project.model";
import { InvitesService } from "src/invites/invites.service";
import { Invite, InviteDocument } from "src/invites/models/invite.model";
import { InviteDto } from "src/invites/dto/invite.dto";
import { QueryUsersDto } from "./dto/query-users-dto";
import { QueryFomiesLeaderboardDto } from "./dto/query-fomies-leaderboard.dto";
import { QueryFomiesSearchDto } from "./dto/query-fomies-search.dto";
import { QueryFomiesShowdownDto } from "./dto/query-fomies-showdown.dto";
import { SpaceportStakingService } from "src/spaceport-staking/spaceport-staking.service";
import { RankResolverService } from "src/xp/rank-resolver.service";
import { XpLedgerService } from "src/xp/xp-ledger.service";
import { BadgesService } from "src/badges/badges.service";
import {
  buildSpaceportProgression,
  getSpaceportLevelsConfig,
  SpaceportProgressionData,
} from "./spaceport-progression";
import { ConnectTelegramDto } from "./dto/connect-telegram.dto";
import { Portfolio, PortfolioDocument } from "src/portfolio/model/portfolio.model";
import { Comment, CommentDocument } from "src/comments/models/comment.model";
import { Ref, RefDocument } from "src/ref/ref.model";
import { Activity, ActivityDocument } from "src/activity/models/activity.model";
import { FomoV2MarketProjectReadModel } from "src/fomo-v2/models";
import {
  SpaceportNftCountStatus,
  SpaceportNftService,
} from "src/spaceport-nft/spaceport-nft.service";
import { Deal, DealDocument } from "src/deals/model/deal.model";
import { Appeal, AppealDocument } from "src/deals/model/appeal.model";
import { Withdraw, WithdrawDocument } from "src/withdraws/model/withdraw.model";
import { Deposit } from "src/deposits/model/deposit.model";
import { Support, SupportDocument } from "src/support/support.model";
import {
  SpaceportConfig,
  DEFAULT_SPACEPORT_LEVELS,
} from "src/spaceport/spaceport.models";
import { UserActionLogsService } from "src/user-action-logs/user-action-logs.service";

export interface UserActivityStatsResponse {
  portfolioSnapshot: {
    totalInvestedUsd: number;
    numberOfDeals: number;
    averageInvestmentUsd: number;
    projectsSupported: number;
    lastInvestmentAt: Date | null;
    averageRoiPercent: number | null;
  };
  statistics: {
    points: number;
    score: number;
    balance: number;
    partners: number;
    awards: number;
  };
  otcP2p: {
    ratingPercent: number;
    sells: number;
    buys: number;
    revenueUsd: number;
  };
}

type UserAdminDossierSection =
  | "summary"
  | "portfolios"
  | "otc"
  | "p2p"
  | "withdraws"
  | "deposits"
  | "comments"
  | "support"
  | "appeals"
  | "logs";

type UserAdminDossierQuery = {
  section?: string;
  offset?: string;
  limit?: string;
};

type UserAdminDossierPagination = {
  offset: number;
  limit: number;
};

type UserAdminDossierPageResponse<T = unknown> = UserAdminDossierPagination & {
  items: T[];
  total: number;
  hasMore: boolean;
};

@Injectable()
export class UserService implements OnModuleInit {
  private readonly logger = new Logger(UserService.name);
  private readonly defaultFomiesFilterValues = {
    rank: ["0-199", "600-799", "200-399", "800-899", "400-599", "900-1000"],
    fomoScore: [
      "0-33",
      "34-66",
      "67-100",
      "verificationStatus=true",
      "verificationStatus=false",
    ],
    redFlags: ["0", "1-9", "10-1000"],
    followers: ["0-100", "501-1000", "101-500", "1000-10000000000"],
    nftsValue: ["0-0", "6-10", "1-5", "10-10000"],
  };

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Action.name) private actionModel: Model<ActionDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Invite.name) private inviteModel: Model<InviteDocument>,
    @InjectModel(Portfolio.name) private portfolioModel: Model<PortfolioDocument>,
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private marketReadModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Ref.name) private refModel: Model<RefDocument>,
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>,
    @InjectModel(Deal.name) private dealModel: Model<DealDocument>,
    @InjectModel(Appeal.name) private appealModel: Model<AppealDocument>,
    @InjectModel(Withdraw.name) private withdrawModel: Model<WithdrawDocument>,
    @InjectModel(Deposit.name) private depositModel: Model<Deposit>,
    @InjectModel(Support.name) private supportModel: Model<SupportDocument>,
    @InjectModel(SpaceportConfig.name) private spaceportConfigModel: Model<SpaceportConfig>,
    private readonly authService: AuthService,
    private readonly filesService: FilesService,
    private readonly emailService: EmailService,
    private readonly ratingService: RatingService,
    private readonly invitesService: InvitesService,
    private readonly spaceportStakingService: SpaceportStakingService,
    private readonly spaceportNftService: SpaceportNftService,
    private readonly userActionLogsService: UserActionLogsService,
    private readonly rankResolver: RankResolverService,
    private readonly xpLedger: XpLedgerService,
    private readonly badgesService: BadgesService
  ) {

    // this.updateUserMenus();

  }

  async onModuleInit() {
    await this.ensureEmailIndex();
  }

  private async ensureEmailIndex(): Promise<void> {
    try {
      await this.userModel.collection.updateMany(
        { email: null as any },
        { $unset: { email: "" } }
      );

      const indexes = await this.userModel.collection.indexes();
      const emailIndex = indexes.find(
        (index: any) =>
          index?.key &&
          Object.keys(index.key).length === 1 &&
          index.key.email === 1
      );

      const hasDesiredPartialIndex =
        emailIndex?.unique === true &&
        emailIndex?.partialFilterExpression?.email?.$type === "string" &&
        emailIndex?.partialFilterExpression?.email?.$ne === "";

      if (emailIndex && !hasDesiredPartialIndex) {
        await this.userModel.collection.dropIndex(emailIndex.name);
      }

      if (!hasDesiredPartialIndex) {
        await this.userModel.collection.createIndex(
          { email: 1 },
          {
            unique: true,
            name: "email_1",
            partialFilterExpression: {
              email: { $type: "string", $ne: "" },
            },
          }
        );
      }
    } catch (error) {
      this.logger.warn(`Failed to ensure partial email index: ${String(error)}`);
    }
  }

  async updateUserMenus() {
    const items = [
      {
        name: "Crypto",
        isVisible: true,
        icon: "crypto",
        items: [
          { name: "Market", href: "/", isVisible: true, isUpdate: false },
          { name: "Funding Feed", href: "/crypto/funding-feed", isVisible: true, isUpdate: false },
          { name: "Echo", href: "/crypto/projects", isVisible: true, isUpdate: false },
          { name: "Eralash", href: "/crypto/eralash", isVisible: true, isUpdate: false },
          { name: "Backer", href: "/crypto/backers", isVisible: true, isUpdate: false },
          { name: "Fomies", href: "/crypto/fomies", isVisible: true, isUpdate: false },
          { name: "Unlocking", href: "/crypto/unlocking", isVisible: true, isUpdate: false },
          { name: "EarlyLand", href: "/crypto/earlyland", isVisible: true, isUpdate: false },
        ],
      },
      {
        name: "Utility",
        isVisible: true,
        icon: "utility",
        items: [
          { name: "NFT Market", href: "/utility/market", isVisible: true, isUpdate: false },
          {
            name: "Bazaar", isVisible: true, isUpdate: false,
            items: [
              { name: "OTC/P2P Market", href: "/utility", isVisible: true, isUpdate: false },
              { name: "My Deals", href: "/utility/my-deals", isVisible: true, isUpdate: false },
              { name: "Top Members", href: "/utility/top-members", isVisible: true, isUpdate: false },
            ],
          },
          { name: "Launch", href: "/utility/launch", isVisible: false, isUpdate: false },
          { name: "Parsing", href: "/utility/parsing", isVisible: false, isUpdate: false },
          { name: "X Rank", href: "/utility/influence", isVisible: false, isUpdate: false },
          { name: "Buzz", href: "/utility/news", isVisible: true, isUpdate: false },
        ],
      },
      {
        name: "Core",
        isVisible: true,
        icon: "gemsLab",
        items: [
          { name: "My Profile", href: "/core/profile", isVisible: true, isUpdate: false },
          { name: "Spaceport", href: "/core/spaceport", isVisible: true, isUpdate: false },
          { name: "Portfolio", href: "/core/portfolio", isVisible: true, isUpdate: false },
          { name: "Chat", href: "/core/fomo-chat", isVisible: true, isUpdate: false },
        ],
      },
    ];

    const result = await this.userModel.updateMany(
      {},
      {
        userMenu: items
      }
    );

    return result;
  }

  private normalizeFilterValues(input?: string): string[] {
    return String(input || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  private hasOnlyDefaultFilterValues(
    input: string | undefined,
    defaultValues: string[]
  ): boolean {
    const values = new Set(this.normalizeFilterValues(input));

    return (
      values.size >= defaultValues.length &&
      defaultValues.every((value) => values.has(value))
    );
  }

  private parseFilterRanges(input?: string): [number, number][] {
    return this.normalizeFilterValues(input)
      .map((value): [number, number] | null => {
        if (value.startsWith(">")) {
          const min = Number(value.slice(1));
          return Number.isFinite(min) ? [min, Number.MAX_SAFE_INTEGER] : null;
        }

        if (!value.includes("-")) return null;

        const [min, max] = value.split("-").map(Number);

        return Number.isFinite(min) && Number.isFinite(max) ? [min, max] : null;
      })
      .filter((range): range is [number, number] => Boolean(range));
  }

  private buildProjectFilter(query: any): Record<string, any> {
    const andConditions: any[] = [];

    const parseRanges = (input: string): [number, number][] => {
      return this.parseFilterRanges(input);
    };

    if (
      query.rank &&
      !this.hasOnlyDefaultFilterValues(
        query.rank,
        this.defaultFomiesFilterValues.rank
      )
    ) {
      const ranges = parseRanges(query.rank);
      const conditions = ranges.map(([min, max]) => ({
        activityXP: { $gte: min, $lte: max },
      }));
      if (conditions.length) andConditions.push({ $or: conditions });
    }

    if (
      query.fomoScore &&
      !this.hasOnlyDefaultFilterValues(
        query.fomoScore,
        this.defaultFomiesFilterValues.fomoScore
      )
    ) {
      const ranges = parseRanges(query.fomoScore);
      const conditions: any[] = [];
      const hasTrue = query.fomoScore.includes("verificationStatus=true");
      const hasFalse = query.fomoScore.includes("verificationStatus=false");

      const includeMissingFomo = ranges.some(([min, _]) => min === 0);

      if (ranges.length) {
        conditions.push(
          ...ranges.map(([min, max]) => {
            const orCondition: any[] = [
              { fomoScore: { $gte: min, $lte: max } },
            ];
            if (min === 0 && includeMissingFomo) {
              orCondition.push({ fomoScore: { $exists: false } });
            }
            return { $or: orCondition };
          })
        );
      }

      if (conditions.length) {
        andConditions.push({ $or: conditions });
      }

      if (hasTrue && !hasFalse) {
        andConditions.push({ verificationStatus: true });
      } else if (hasFalse && !hasTrue) {
        andConditions.push({
          $or: [
            { verificationStatus: false },
            { verificationStatus: { $exists: false } },
          ],
        });
      }
    }

    if (
      query["red-flags"] &&
      !this.hasOnlyDefaultFilterValues(
        query["red-flags"],
        this.defaultFomiesFilterValues.redFlags
      )
    ) {
      const values = query["red-flags"].split(",");
      const conditions = values
        .map((val: string) => {
          if (val === "0") {
            return {
              $or: [{ redFlags: 0 }, { redFlags: { $exists: false } }],
            };
          } else if (val.includes("-")) {
            const [min, max] = val.split("-").map(Number);
            return {
              redFlags: { $gte: min, $lte: max },
            };
          }
          return null;
        })
        .filter(Boolean);

      if (conditions.length) andConditions.push({ $or: conditions });
    }

    if (
      query.followers &&
      !this.hasOnlyDefaultFilterValues(
        query.followers,
        this.defaultFomiesFilterValues.followers
      )
    ) {
      const ranges = parseRanges(query.followers);
      const conditions = ranges.map(([min, max]) => {
        const rangeCondition: any = {
          followersCount: { $gte: min, $lte: max },
        };

        if (min === 0) {
          return {
            $or: [rangeCondition, { followersCount: { $exists: false } }],
          };
        }

        return rangeCondition;
      });

      if (conditions.length) andConditions.push({ $or: conditions });
    }

    if (query.socialNetworks) {
      const socialNetworksQuery: string[] = query.socialNetworks.split(",");

      const hasRange = socialNetworksQuery.includes("0-2");

      const socials = socialNetworksQuery.filter((item) => item !== "0-2");

      const sizeExpr = {
        $size: {
          $filter: {
            input: { $objectToArray: { $ifNull: ["$socialNetworks", {}] } },
            as: "item",
            cond: {
              $and: [
                { $ne: ["$$item.v", null] },
                { $ne: ["$$item.v", ""] },
              ],
            },
          },
        },
      };

      const conditions = [];

      if (socials.length) {
        conditions.push({
          $or: socials.map((social) => ({
            [`socialNetworks.${social}`]: {
              $exists: true,
              $nin: [null, ""],
            },
          })),
        });
      }

      if (hasRange) {
        conditions.push({
          $expr: {
            $gte: [sizeExpr, 2],
          },
        });
      }

      if (conditions.length) {
        andConditions.push({ $and: conditions });
      }
    }

    const filter: Record<string, any> =
      andConditions.length > 0 ? { $and: andConditions } : {};

    return filter;
  }

  private buildUserPipeline(
    query: QueryUsersDto,
    options: { disablePagination?: boolean } = {}
  ): any[] {
    const projectFilters = this.buildProjectFilter(query);

    const baseMatchStage: any = {
      $expr: {
        $and: [
          { $eq: [{ $size: "$role" }, 1] },
          { $eq: [{ $arrayElemAt: ["$role", 0] }, "user"] },
        ],
      },
      isCodeActivated: true,
    };

    const filterMatchStage: any = {};
    const projectAndFilters = projectFilters?.$and || [];

    if (projectAndFilters.length) {
      filterMatchStage.$and = projectAndFilters;
    }

    if (query?.searchValue) {
      filterMatchStage.$or = [
        { name: { $regex: query.searchValue, $options: "i" } },
        { username: { $regex: query.searchValue, $options: "i" } },
        { wallet: { $regex: query.searchValue, $options: "i" } },
      ];
    }

    const skip = Number(query?.offset || 0);
    const limit = Number(query?.limit || 20);

    const pipeline: any[] = [];

    pipeline.push({ $match: baseMatchStage });
    pipeline.push({
      $addFields: {
        activityXP: { $ifNull: ["$activityXP", 0] },
        fomoScore: { $ifNull: ["$fomoScore", 0] },
        followersCount: {
          $cond: [
            { $isArray: "$followers" },
            { $size: "$followers" },
            { $ifNull: ["$followersCount", 0] },
          ],
        },
        redFlags: { $ifNull: ["$redFlags", 0] },
      },
    });

    if (Object.keys(filterMatchStage).length) {
      pipeline.push({ $match: filterMatchStage });
    }

    const userStages: any[] = [];

    if (!options.disablePagination) {
      userStages.push({ $skip: skip }, { $limit: limit });
    }

    userStages.push({
      $project: {
        _id: 1,
        name: 1,
        username: 1,
        wallet: 1,
        followers: 1,
        socialNetworks: 1,
        twitterData: 1,
        discordData: 1,
        rating: 1,
        photo: 1,
        redFlags: 1,
        greenFlagsList: 1,
        activityXP: 1,
        verificationStatus: 1,
        rank: 1,
        reviewLikes: 1,
        followersCount: 1,
        likes: 1,
        dislikes: 1,
      },
    });

    pipeline.push({
      $facet: {
        totalCount: [{ $count: "count" }],
        users: userStages,
      },
    });

    return pipeline;
  }

  private async generateUniqueUserId(): Promise<number> {
    let userId: number;
    let isUnique: boolean = false;

    while (!isUnique) {
      userId = Math.floor(100000 + Math.random() * 900000);

      const existingUser = await this.userModel
        .findOne({ fomoId: userId })
        .exec();
      if (!existingUser) {
        isUnique = true;
      }
    }

    return userId;
  }

  private isUserEditableUpdateKey(key: string): boolean {
    return new Set([
      "name",
      "username",
      "bio",
      "specialization",
      "regionData",
      "socialNetworks",
      "solanaAddress",
      "cosmosAddress",
      "polkadotAddress",
      "nearAddress",
      "kusamaAddress",
      "telegramNotification",
      "emailNotification",
      "isMenuDisplay",
      "userMenu",
      "multichainwallet",
    ]).has(key);
  }

  async initializeUser(
    userDto: UserDto
  ): Promise<{ user: User; token: string }> {
    const candidate = await this.userModel.findOne({ wallet: userDto.wallet });

    if (candidate) {
      const token: string = await this.authService.createInitialToken(
        userDto.wallet
      );

      return { user: candidate, token };
    }

    const token: string = await this.authService.createInitialToken(
      userDto.wallet
    );

    const fomoId: number = await this.generateUniqueUserId();

    const initialUser: User = await this.userModel.create({
      wallet: userDto.wallet,
      fomoId,
      email: String(fomoId),
      isCodeActivated: true,
    });

    return { user: initialUser, token };
  }

  async getInitializeUser(wallet: string): Promise<any> {
    const users = await this.userModel.aggregate([
      {
        $match: {
          wallet,
          isCodeActivated: true,
        },
      },
      {
        $project: {
          password: 0,
        },
      },
    ]);

    if (!users.length) {
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }

    const user: UserDocument & Record<string, any> = users[0];

    if (!user) throw new HttpException("User not found", HttpStatus.NOT_FOUND);

    // Обновляем время последней активности
    const spaceportProgression = await this.buildUserSpaceportProgression(user);
    const onlineDate = new Date();
    await this.userModel.updateOne(
      { _id: user._id },
      {
        $set: {
          onlineDate,
          spaceportProgression,
        },
      }
    );

    const [userInvites, spaceportNftStats, portfolioMainInfo] =
      await Promise.all([
        this.invitesService.getInvites(String(user._id)),
        this.getSpaceportNftStats(user.wallet),
        this.getPortfolioMainInfoStats(
          new mongoose.Types.ObjectId(String(user._id))
        ),
      ]);

    const initializedUser = {
      ...user,
      invites: userInvites,
      onlineDate,
      spaceportProgression,
      spaceportNftCount: spaceportNftStats.count,
      spaceportNftCountStatus: spaceportNftStats.status,
      spaceportNftContract: spaceportNftStats.nftAddress,
      portfolioMainInfo,
      totalInvested: portfolioMainInfo.totalInvestedUsd,
      topFundedProject: portfolioMainInfo.topFundedProject,
      athRoi: portfolioMainInfo.athRoiPercent,
    };

    if (user?.isActive) {
      initializedUser.rating = this.ratingService.calculateUserRating(user);

      return initializedUser;
    }

    return initializedUser;
  }

  private async getSpaceportNftStats(wallet?: string): Promise<{
    count: number | null;
    status: SpaceportNftCountStatus;
    nftAddress?: string;
  }> {
    if (!wallet) {
      return {
        count: null,
        status: "no-wallet",
      };
    }

    try {
      const result = await this.spaceportNftService.getWalletNftCount(wallet);

      return {
        count: result.count,
        status: result.status,
        nftAddress: result.nftAddress,
      };
    } catch {
      return {
        count: null,
        status: "unavailable",
      };
    }
  }

  private async getPortfolioMainInfoStats(userObjectId: mongoose.Types.ObjectId) {
    const result = await this.portfolioModel.aggregate([
      {
        $match: {
          creator: userObjectId,
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalPortfolioInvested: {
                  $sum: { $ifNull: ["$totalInvested", 0] },
                },
              },
            },
          ],
          buyTotals: [
            { $unwind: "$assets" },
            {
              $match: {
                "assets.type": "buy",
              },
            },
            {
              $group: {
                _id: null,
                buyInvestedTotal: {
                  $sum: { $ifNull: ["$assets.totalPrice", 0] },
                },
              },
            },
          ],
          topFundedProject: [
            { $unwind: "$assets" },
            {
              $match: {
                "assets.type": "buy",
                "assets.marketAssetId": { $ne: null },
              },
            },
            {
              $group: {
                _id: "$assets.marketAssetId",
                canonicalProjectId: { $first: "$assets.canonicalProjectId" },
                currency: { $first: "$assets.currency" },
                investedUsd: {
                  $sum: { $ifNull: ["$assets.totalPrice", 0] },
                },
                lastInvestedAt: { $max: "$assets.date" },
              },
            },
            {
              $match: {
                investedUsd: { $gt: 0 },
              },
            },
            {
              $sort: {
                investedUsd: -1,
                lastInvestedAt: -1,
              },
            },
            { $limit: 1 },
            {
              $lookup: {
                from: this.marketReadModel.collection.name,
                localField: "_id",
                foreignField: "marketAssetId",
                as: "project",
              },
            },
            {
              $unwind: {
                path: "$project",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 0,
                id: "$_id",
                name: "$project.name",
                symbol: { $ifNull: ["$project.symbol", "$currency"] },
                logo: "$project.logo",
                marketAssetId: "$_id",
                canonicalProjectId: "$canonicalProjectId",
                investedUsd: 1,
                lastInvestedAt: 1,
              },
            },
          ],
          athRoi: [
            {
              $project: {
                roiValues: {
                  $concatArrays: [
                    {
                      $cond: [
                        { $isArray: "$history" },
                        {
                          $map: {
                            input: "$history",
                            as: "historyItem",
                            in: "$$historyItem.totalProfitPercent",
                          },
                        },
                        [],
                      ],
                    },
                    [{ $ifNull: ["$profitPercent", null] }],
                  ],
                },
              },
            },
            { $unwind: "$roiValues" },
            {
              $match: {
                roiValues: { $type: "number" },
              },
            },
            {
              $group: {
                _id: null,
                athRoiPercent: { $max: "$roiValues" },
              },
            },
          ],
        },
      },
    ]);

    const stats = result?.[0] || {};
    const totalPortfolioInvested = this.toFiniteNumber(
      stats?.totals?.[0]?.totalPortfolioInvested
    );
    const buyInvestedTotal = this.toFiniteNumber(
      stats?.buyTotals?.[0]?.buyInvestedTotal
    );
    const topFundedProject = stats?.topFundedProject?.[0] || null;
    const athRoiPercent = stats?.athRoi?.[0]?.athRoiPercent;
    const topFundedProjectSymbol = this.normalizePortfolioTokenSymbol(
      topFundedProject?.symbol
    );

    return {
      totalInvestedUsd:
        totalPortfolioInvested > 0 ? totalPortfolioInvested : buyInvestedTotal,
      topFundedProject: topFundedProject
        ? {
            id: String(topFundedProject.id || ""),
            name:
              topFundedProject.name ||
              topFundedProjectSymbol ||
              "Unknown project",
            symbol: topFundedProjectSymbol,
            logo: topFundedProject.logo || null,
            marketAssetId: String(topFundedProject.marketAssetId || topFundedProject.id || ""),
            canonicalProjectId: topFundedProject.canonicalProjectId
              ? String(topFundedProject.canonicalProjectId)
              : null,
            investedUsd: this.toFiniteNumber(topFundedProject.investedUsd),
          }
        : null,
      athRoiPercent:
        athRoiPercent === null || athRoiPercent === undefined
          ? null
          : this.toFiniteNumber(athRoiPercent),
    };
  }

  async getUserActivityStats(userId: string): Promise<UserActivityStatsResponse> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return this.getEmptyUserActivityStats();
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [user, portfolioResult, dealResult] = await Promise.all([
      this.userModel
        .findById(userObjectId)
        .select(
          "activityXP points fomoScore partners refLvlOne spaceportClaimedBadges spaceportClaimedRewards reviewLikes reviewDislikes projects news tasks socialNetworks name solanaAddress cosmosAddress polkadotAddress email bio redFlags"
        )
        .lean(),
      this.getPortfolioActivityStats(userObjectId),
      this.getDealActivityStats(userObjectId),
    ]);

    if (!user) {
      return this.getEmptyUserActivityStats();
    }

    const likes = Array.isArray(user.reviewLikes) ? user.reviewLikes.length : 0;
    const dislikes = Array.isArray(user.reviewDislikes)
      ? user.reviewDislikes.length
      : 0;
    const totalReviews = likes + dislikes;

    return {
      portfolioSnapshot: {
        totalInvestedUsd: portfolioResult.totalInvestedUsd,
        numberOfDeals: portfolioResult.numberOfDeals,
        averageInvestmentUsd: portfolioResult.averageInvestmentUsd,
        projectsSupported: portfolioResult.projectsSupported,
        lastInvestmentAt: portfolioResult.lastInvestmentAt,
        averageRoiPercent: portfolioResult.averageRoiPercent,
      },
      statistics: {
        points: this.toFiniteNumber(user.activityXP ?? user.points),
        score: this.calculateProfileScore(user),
        // There is no reliable internal FOMO balance field in the current user schema.
        balance: 0,
        partners: this.getPartnersCount(user),
        awards: this.getAwardsCount(user),
      },
      otcP2p: {
        ratingPercent:
          totalReviews > 0 ? Math.round((likes / totalReviews) * 100) : 0,
        sells: dealResult.sells,
        buys: dealResult.buys,
        revenueUsd: dealResult.revenueUsd,
      },
    };
  }

  async getUserAdminDossier(
    userId: string,
    query: UserAdminDossierQuery = {}
  ): Promise<unknown> {
    const userObjectId = this.parseObjectId(userId, "Invalid user id");
    const userExists = await this.userModel.exists({ _id: userObjectId });

    if (!userExists) {
      throw new NotFoundException("User not found");
    }

    const section = query.section || "summary";
    const allowedSections: UserAdminDossierSection[] = [
      "summary",
      "portfolios",
      "otc",
      "p2p",
      "withdraws",
      "deposits",
      "comments",
      "support",
      "appeals",
      "logs",
    ];

    if (!allowedSections.includes(section as UserAdminDossierSection)) {
      throw new BadRequestException("Unsupported dossier section");
    }

    if (section === "summary") {
      return this.getAdminDossierSummary(userObjectId);
    }

    const pagination = this.parseDossierPagination(query);

    switch (section) {
      case "portfolios":
        return this.getAdminDossierPortfoliosPage(userObjectId, pagination);
      case "otc":
        return this.getAdminDossierDealsPage(userObjectId, "otc", pagination);
      case "p2p":
        return this.getAdminDossierDealsPage(userObjectId, "p2p", pagination);
      case "withdraws":
        return this.getAdminDossierWithdrawsPage(userObjectId, pagination);
      case "deposits":
        return this.getAdminDossierDepositsPage(userObjectId, pagination);
      case "comments":
        return this.getAdminDossierCommentsPage(userObjectId, pagination);
      case "support":
        return this.getAdminDossierSupportPage(userObjectId, pagination);
      case "appeals":
        return this.getAdminDossierAppealsPage(userObjectId, pagination);
      case "logs":
        return this.getAdminDossierLogsPage(userObjectId, pagination);
      default:
        return { items: [], total: 0, ...pagination, hasMore: false };
    }
  }

  private parseObjectId(value: string, errorMessage: string): mongoose.Types.ObjectId {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new BadRequestException(errorMessage);
    }

    return new mongoose.Types.ObjectId(value);
  }

  private parseDossierPagination(query: UserAdminDossierQuery): UserAdminDossierPagination {
    const requestedOffset = Number(query.offset || 0);
    const offset = Number.isFinite(requestedOffset) ? Math.max(requestedOffset, 0) : 0;
    const requestedLimit = Number(query.limit || 10);
    const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 10, 1), 50);

    return { offset, limit };
  }

  private buildDossierPageResponse(
    items: unknown[],
    total: number,
    pagination: UserAdminDossierPagination
  ): UserAdminDossierPageResponse {
    return {
      items,
      total,
      offset: pagination.offset,
      limit: pagination.limit,
      hasMore: pagination.offset + items.length < total,
    };
  }

  private buildUserDealMatch(userObjectId: mongoose.Types.ObjectId, section?: "otc" | "p2p") {
    const participantMatch = {
      $or: [
        { creator: userObjectId },
        { buyer: userObjectId },
        { seller: userObjectId },
      ],
    };

    if (section === "otc") {
      return {
        $and: [
          participantMatch,
          {
            $or: [
              { section: "otc" },
              { section: { $exists: false } },
            ],
          },
        ],
      };
    }

    if (section === "p2p") {
      return {
        $and: [
          participantMatch,
          { section: "p2p" },
        ],
      };
    }

    return participantMatch;
  }

  private async getAdminDossierSummary(userObjectId: mongoose.Types.ObjectId) {
    const [
      activityStats,
      portfolioSummary,
      dealSummary,
      withdrawSummary,
      depositSummary,
      commentsTotal,
      supportTotal,
      appealsSummary,
      logsTotal,
    ] = await Promise.all([
      this.getUserActivityStats(userObjectId.toString()),
      this.getAdminDossierPortfolioSummary(userObjectId),
      this.getAdminDossierDealSummary(userObjectId),
      this.getAdminDossierWithdrawSummary(userObjectId),
      this.getAdminDossierDepositSummary(userObjectId),
      this.commentModel.countDocuments({ author: userObjectId }),
      this.supportModel.countDocuments({ user: userObjectId }),
      this.getAdminDossierAppealsSummary(userObjectId),
      this.userActionLogsService.countByUser(userObjectId),
    ]);

    // 4 canonical axes (reuse existing engines — no parallel recomputation).
    // Missing sources return connected:false instead of a fake 0.
    let axes: any = {
      fomoScore: { connected: false },
      xp: { connected: false },
      spaceport: { connected: false },
      badges: { connected: false },
    };
    let sections: any = {};
    try {
      const user: any = await this.userModel.findById(userObjectId).lean();
      if (user) {
        const progression: any = await this.buildUserSpaceportProgression(user);
        const gx: any = progression?.globalXp || {};
        let fomoValue: number | null = null;
        try { fomoValue = this.toFiniteNumber(this.ratingService.calculateUserRating(user)); } catch (_) { fomoValue = null; }
        let badges: any[] = [];
        try { badges = await this.badgesService.getUserBadges(userObjectId.toString()); } catch (_) { badges = []; }
        axes = {
          fomoScore: fomoValue == null ? { connected: false } : { value: fomoValue, connected: true },
          xp: {
            activityXP: this.toFiniteNumber(user.activityXP),
            rank: gx.rankName || null,
            rankLevel: gx.rank ?? gx.level ?? null,
            progressPercent: gx.progressPercent ?? null,
            connected: true,
          },
          spaceport: {
            level: progression?.currentLevel ?? null,
            levelName: progression?.currentLevelName || null,
            stakingDays: progression?.totalStakingDays ?? 0,
            connected: true,
          },
          badges: {
            earned: Array.isArray(badges) ? badges.length : 0,
            featured: (Array.isArray(badges) ? badges : []).filter((b: any) => b.featured).slice(0, 6),
            items: (Array.isArray(badges) ? badges : []).slice(0, 12),
            connected: true,
          },
        };
        sections = await this.getAdminDossierCanonicalSections(user, userObjectId, {
          progression, badges, fomoValue, commentsTotal,
        });
      }
    } catch (_) {
      /* keep not_connected axes on failure */
    }

    return {
      axes,
      sections,
      activityStats,
      portfolios: portfolioSummary,
      deals: dealSummary,
      withdraws: withdrawSummary,
      deposits: depositSummary,
      community: {
        commentsTotal,
        supportTotal,
        appealsTotal: appealsSummary.total,
        logsTotal,
        appealsByStatus: appealsSummary.byStatus,
      },
    };
  }

  /**
   * Canonical per-tab read-model for Customer 360.
   * Reads ONLY existing sources (user doc + existing collections). Never fabricates
   * data: when a source is genuinely absent it returns { connected:false }.
   */
  private async getAdminDossierCanonicalSections(
    user: any,
    userObjectId: mongoose.Types.ObjectId,
    ctx: { progression?: any; badges?: any[]; fomoValue?: number | null; commentsTotal?: number }
  ): Promise<any> {
    const db = this.userModel.db;
    const idStr = userObjectId.toString();
    const orId: any[] = [{ userId: userObjectId }, { userId: idStr }];
    if (user?.wallet) orId.push({ wallet: user.wallet });
    const safeCount = async (coll: string, q: any): Promise<number | null> => {
      try { return await db.collection(coll).countDocuments(q); } catch (_) { return null; }
    };
    const listCollections = async (): Promise<Set<string>> => {
      try { const cs = await db.db.listCollections().toArray(); return new Set(cs.map((c: any) => c.name)); }
      catch (_) { return new Set(); }
    };
    const collSet = await listCollections();
    const num = (v: any) => this.toFiniteNumber(v);

    // ── Referrals (canonical: user doc) ──
    const referrals = {
      connected: true,
      l1: Array.isArray(user.refLvlOne) ? user.refLvlOne.length : 0,
      l2: Array.isArray(user.refLvlTwo) ? user.refLvlTwo.length : 0,
      partners: num(user.partners),
      inviter: user.inviter || null,
    };

    // ── NFT (canonical: user doc + spaceport openings if present) ──
    const openings = collSet.has("spaceport_openings") ? await safeCount("spaceport_openings", { $or: orId }) : null;
    const nft = {
      connected: true,
      count: Array.isArray(user.nfts) ? user.nfts.length : 0,
      value: num(user.nftsValue),
      staking: num(user.staking),
      openings: openings ?? 0,
    };

    // ── Launchpad (canonical: user doc + launchpad_participants if present) ──
    const lpRecords = collSet.has("launchpad_participants") ? await safeCount("launchpad_participants", { $or: orId }) : null;
    const launchpad = {
      connected: true,
      claimedProjects: Array.isArray(user.claimedProjects) ? user.claimedProjects.length : 0,
      investedProjects: Array.isArray(user.investedProjects) ? user.investedProjects.length : 0,
      participantRecords: lpRecords ?? 0,
    };

    // ── EarlyLand (source = earlylandtaskuserstates; connected only if collection exists) ──
    let earlyland: any = { connected: false, note: "EarlyLand источник не подключён" };
    if (collSet.has("earlylandtaskuserstates")) {
      const el = await safeCount("earlylandtaskuserstates", { $or: [{ userId: userObjectId }, { userId: idStr }] });
      earlyland = { connected: true, taskStates: el ?? 0 };
    }

    // ── Rating / FOMO breakdown (canonical: user doc) ──
    const hasRating = user.lastRatingCalculatedAt != null ||
      (user.ratingBreakdown && Object.keys(user.ratingBreakdown).length > 0) ||
      (ctx.fomoValue != null && ctx.fomoValue > 0) ||
      num(user.fomoScore) > 0;
    const rating = hasRating
      ? {
          connected: true,
          fomoScore: ctx.fomoValue != null ? ctx.fomoValue : num(user.fomoScore),
          rank: user.rank || null,
          risk: user.risk || null,
          redFlags: num(user.redFlags),
          fullness: user.fullness ?? null,
          breakdown: user.ratingBreakdown || {},
          fullnessBreakdown: user.fullnessBreakdown || {},
          lastCalculatedAt: user.lastRatingCalculatedAt || null,
        }
      : { connected: false, note: "Рейтинг ещё не рассчитан" };

    // ── SpacePort detail (canonical: user doc + progression) ──
    const prog = ctx.progression || {};
    const spaceport = {
      connected: true,
      level: prog.currentLevel ?? null,
      levelName: prog.currentLevelName || null,
      stakingDays: prog.totalStakingDays ?? 0,
      stakingXp: num(user.spaceportClaimedStakingXp),
      claimedBadges: Array.isArray(user.spaceportClaimedBadges) ? user.spaceportClaimedBadges.length : 0,
      claimedRewards: Array.isArray(user.spaceportClaimedRewards) ? user.spaceportClaimedRewards.length : 0,
      claimedRewardsList: Array.isArray(user.spaceportClaimedRewards) ? user.spaceportClaimedRewards.slice(0, 30) : [],
      milestones: Array.isArray(prog.milestones) ? prog.milestones : (prog.levels || []),
    };

    // ── Security (canonical: user doc) ──
    const wallets = [
      user.wallet && { chain: "EVM", address: user.wallet },
      user.solanaAddress && { chain: "Solana", address: user.solanaAddress },
      user.cosmosAddress && { chain: "Cosmos", address: user.cosmosAddress },
      user.polkadotAddress && { chain: "Polkadot", address: user.polkadotAddress },
      user.nearAddress && { chain: "NEAR", address: user.nearAddress },
      user.kusamaAddress && { chain: "Kusama", address: user.kusamaAddress },
    ].filter(Boolean);
    const security = {
      connected: true,
      is2FAEnabled: !!user.is2FAEnabled,
      verificationStatus: !!user.verificationStatus,
      kyc: user.kyc || null,
      authProvider: user.authProvider || null,
      emailVerified: !!user.email,
      wallets,
      walletCount: wallets.length,
    };

    // ── Content (canonical: user doc + comments collection) ──
    const content = {
      connected: true,
      comments: num(ctx.commentsTotal),
      projects: Array.isArray(user.projects) ? user.projects.length : 0,
      news: Array.isArray(user.news) ? user.news.length : 0,
      reviewLikes: Array.isArray(user.reviewLikes) ? user.reviewLikes.length : 0,
      reviewDislikes: Array.isArray(user.reviewDislikes) ? user.reviewDislikes.length : 0,
      portfolios: Array.isArray(user.portfolio) ? user.portfolio.length : 0,
    };

    // ── Moderation (canonical: lifecycle state + action logs) ──
    const logsTotal = await safeCount("user_action_logs", { $or: [{ userId: userObjectId }, { userId: idStr }] });
    const moderation = {
      connected: true,
      accountState: user.accountState || (user.banned ? "suspended" : "active"),
      banned: !!user.banned,
      mutedUntil: user.mutedUntil || null,
      muteReason: user.muteReason || "",
      suspendedUntil: user.suspendedUntil || null,
      suspendReason: user.suspendReason || "",
      deletedAt: user.deletedAt || null,
      redFlags: num(user.redFlags),
      redFlagsList: Array.isArray(user.redFlagsList) ? user.redFlagsList : [],
      greenFlagsList: Array.isArray(user.greenFlagsList) ? user.greenFlagsList : [],
      actionLogsTotal: logsTotal ?? 0,
    };

    // ── XP detail (canonical: xp_transactions if present) ──
    let xp: any = { connected: true, activityXP: num(user.activityXP), transactionsTotal: 0 };
    if (collSet.has("xp_transactions")) {
      const txTotal = await safeCount("xp_transactions", { userId: idStr });
      xp.transactionsTotal = txTotal ?? 0;
    }

    return { referrals, nft, launchpad, earlyland, rating, spaceport, security, content, moderation, xp };
  }

  private async getAdminDossierPortfolioSummary(userObjectId: mongoose.Types.ObjectId) {
    const result = await this.portfolioModel.aggregate([
      { $match: { creator: userObjectId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          totalBalance: { $sum: { $ifNull: ["$totalBalance", 0] } },
          totalInvested: { $sum: { $ifNull: ["$totalInvested", 0] } },
          totalProfit: { $sum: { $ifNull: ["$profit", 0] } },
          averageRoiPercent: { $avg: { $ifNull: ["$profitPercent", null] } },
          assetsTotal: { $sum: { $size: { $ifNull: ["$assets", []] } } },
          lastUpdatedAt: { $max: "$updatedAt" },
        },
      },
    ]);

    const summary = result?.[0] || {};

    return {
      total: this.toFiniteNumber(summary.total),
      totalBalance: this.toFiniteNumber(summary.totalBalance),
      totalInvested: this.toFiniteNumber(summary.totalInvested),
      totalProfit: this.toFiniteNumber(summary.totalProfit),
      averageRoiPercent:
        summary.averageRoiPercent === null || summary.averageRoiPercent === undefined
          ? null
          : this.toFiniteNumber(summary.averageRoiPercent),
      assetsTotal: this.toFiniteNumber(summary.assetsTotal),
      lastUpdatedAt: summary.lastUpdatedAt || null,
    };
  }

  private async getAdminDossierDealSummary(userObjectId: mongoose.Types.ObjectId) {
    const result = await this.dealModel.aggregate([
      { $match: this.buildUserDealMatch(userObjectId) },
      {
        $addFields: {
          normalizedSection: { $ifNull: ["$section", "otc"] },
          normalizedTicker: { $toLower: { $ifNull: ["$ticker", ""] } },
          normalizedCurrency: { $toLower: { $ifNull: ["$currency", ""] } },
          isCompleted: { $eq: ["$status", "ended"] },
          isSellerRole: {
            $or: [
              { $eq: ["$creator", userObjectId] },
              { $eq: ["$seller", userObjectId] },
            ],
          },
          isBuyerRole: {
            $and: [
              { $eq: ["$buyer", userObjectId] },
              { $ne: ["$creator", userObjectId] },
              { $ne: [{ $ifNull: ["$seller", null] }, userObjectId] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          otc: { $sum: { $cond: [{ $eq: ["$normalizedSection", "otc"] }, 1, 0] } },
          p2p: { $sum: { $cond: [{ $eq: ["$normalizedSection", "p2p"] }, 1, 0] } },
          active: {
            $sum: {
              $cond: [{ $in: ["$status", ["waiting", "started"]] }, 1, 0],
            },
          },
          ended: { $sum: { $cond: ["$isCompleted", 1, 0] } },
          blocked: { $sum: { $cond: [{ $eq: ["$status", "blocked"] }, 1, 0] } },
          sells: { $sum: { $cond: [{ $and: ["$isCompleted", "$isSellerRole"] }, 1, 0] } },
          buys: { $sum: { $cond: [{ $and: ["$isCompleted", "$isBuyerRole"] }, 1, 0] } },
          revenueUsd: {
            $sum: {
              $cond: [
                {
                  $and: [
                    "$isCompleted",
                    "$isSellerRole",
                    {
                      $or: [
                        { $in: ["$normalizedTicker", ["usd", "usdc"]] },
                        { $in: ["$normalizedCurrency", ["usd", "usdc"]] },
                      ],
                    },
                  ],
                },
                { $ifNull: ["$price", 0] },
                0,
              ],
            },
          },
        },
      },
    ]);

    const summary = result?.[0] || {};

    return {
      total: this.toFiniteNumber(summary.total),
      otc: this.toFiniteNumber(summary.otc),
      p2p: this.toFiniteNumber(summary.p2p),
      active: this.toFiniteNumber(summary.active),
      ended: this.toFiniteNumber(summary.ended),
      blocked: this.toFiniteNumber(summary.blocked),
      sells: this.toFiniteNumber(summary.sells),
      buys: this.toFiniteNumber(summary.buys),
      revenueUsd: this.toFiniteNumber(summary.revenueUsd),
    };
  }

  private async getAdminDossierWithdrawSummary(userObjectId: mongoose.Types.ObjectId) {
    const result = await this.withdrawModel.aggregate([
      { $match: { userId: userObjectId } },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
                totalFee: { $sum: { $ifNull: ["$fee", 0] } },
              },
            },
          ],
          byStatus: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
                amount: { $sum: { $ifNull: ["$amount", 0] } },
              },
            },
          ],
        },
      },
    ]);

    const summary = result?.[0]?.summary?.[0] || {};

    return {
      total: this.toFiniteNumber(summary.total),
      totalAmount: this.toFiniteNumber(summary.totalAmount),
      totalFee: this.toFiniteNumber(summary.totalFee),
      byStatus: result?.[0]?.byStatus || [],
    };
  }

  private async getAdminDossierDepositSummary(userObjectId: mongoose.Types.ObjectId) {
    const result = await this.depositModel.aggregate([
      { $match: { userId: userObjectId } },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                totalAmount: { $sum: { $ifNull: ["$amount", 0] } },
                totalNetAmount: { $sum: { $ifNull: ["$netAmount", 0] } },
                totalServiceFee: { $sum: { $ifNull: ["$serviceFee", 0] } },
              },
            },
          ],
          byStatus: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
                amount: { $sum: { $ifNull: ["$amount", 0] } },
              },
            },
          ],
          byCurrency: [
            {
              $group: {
                _id: "$currency",
                count: { $sum: 1 },
                amount: { $sum: { $ifNull: ["$amount", 0] } },
              },
            },
          ],
        },
      },
    ]);

    const summary = result?.[0]?.summary?.[0] || {};

    return {
      total: this.toFiniteNumber(summary.total),
      totalAmount: this.toFiniteNumber(summary.totalAmount),
      totalNetAmount: this.toFiniteNumber(summary.totalNetAmount),
      totalServiceFee: this.toFiniteNumber(summary.totalServiceFee),
      byStatus: result?.[0]?.byStatus || [],
      byCurrency: result?.[0]?.byCurrency || [],
    };
  }

  private async buildAdminDossierAppealMatch(userObjectId: mongoose.Types.ObjectId) {
    const dealIds: mongoose.Types.ObjectId[] = await this.dealModel.distinct(
      "_id",
      this.buildUserDealMatch(userObjectId)
    );
    const orConditions: Array<Record<string, unknown>> = [{ creator: userObjectId }];

    if (dealIds.length) {
      orConditions.push({ dealId: { $in: dealIds } });
    }

    return { $or: orConditions };
  }

  private async getAdminDossierAppealsSummary(userObjectId: mongoose.Types.ObjectId) {
    const appealMatch = await this.buildAdminDossierAppealMatch(userObjectId);
    const result = await this.appealModel.aggregate([
      { $match: appealMatch },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      total: result.reduce((sum, item) => sum + this.toFiniteNumber(item.count), 0),
      byStatus: result,
    };
  }

  private async getAdminDossierPortfoliosPage(
    userObjectId: mongoose.Types.ObjectId,
    pagination: UserAdminDossierPagination
  ) {
    const result = await this.portfolioModel.aggregate([
      { $match: { creator: userObjectId } },
      { $sort: { updatedAt: -1, createdAt: -1 } },
      {
        $facet: {
          total: [{ $count: "count" }],
          items: [
            { $skip: pagination.offset },
            { $limit: pagination.limit },
            {
              $project: {
                _id: 1,
                name: 1,
                description: 1,
                code: 1,
                logo: 1,
                totalBalance: 1,
                totalInvested: 1,
                profit: 1,
                profitPercent: 1,
                realizedProfit: 1,
                unrealizedProfit: 1,
                isBattle: 1,
                isShare: 1,
                shareType: 1,
                createdAt: 1,
                updatedAt: 1,
                assetCount: { $size: { $ifNull: ["$assets", []] } },
                calculatedAssetCount: { $size: { $ifNull: ["$calculatedAssets", []] } },
                topAssets: { $slice: [{ $ifNull: ["$calculatedAssets", []] }, 5] },
              },
            },
          ],
        },
      },
    ]);

    const items = result?.[0]?.items || [];
    const total = result?.[0]?.total?.[0]?.count || 0;

    return this.buildDossierPageResponse(items, total, pagination);
  }

  private async getAdminDossierDealsPage(
    userObjectId: mongoose.Types.ObjectId,
    section: "otc" | "p2p",
    pagination: UserAdminDossierPagination
  ) {
    const result = await this.dealModel.aggregate([
      { $match: this.buildUserDealMatch(userObjectId, section) },
      {
        $addFields: {
          userRole: {
            $switch: {
              branches: [
                { case: { $eq: ["$creator", userObjectId] }, then: "creator" },
                { case: { $eq: ["$seller", userObjectId] }, then: "seller" },
                { case: { $eq: ["$buyer", userObjectId] }, then: "buyer" },
              ],
              default: "participant",
            },
          },
        },
      },
      { $sort: { createDate: -1, _id: -1 } },
      {
        $facet: {
          total: [{ $count: "count" }],
          items: [
            { $skip: pagination.offset },
            { $limit: pagination.limit },
            ...this.buildDossierDealUserLookupStages("creator"),
            ...this.buildDossierDealUserLookupStages("buyer"),
            ...this.buildDossierDealUserLookupStages("seller"),
            {
              $project: {
                _id: 1,
                userRole: 1,
                type: 1,
                status: 1,
                name: 1,
                amount: 1,
                price: 1,
                ticker: 1,
                currency: 1,
                section: { $ifNull: ["$section", "otc"] },
                serviceType: 1,
                movingTokens: 1,
                isRealAsset: 1,
                isReservedFunds: 1,
                isMakePayment: 1,
                isAppeal: 1,
                isCompleteByAdmin: 1,
                orderNumber: 1,
                dealId: 1,
                createDate: 1,
                lastStatusUpdate: 1,
                creator: 1,
                buyer: 1,
                seller: 1,
              },
            },
          ],
        },
      },
    ]);

    const items = result?.[0]?.items || [];
    const total = result?.[0]?.total?.[0]?.count || 0;

    return this.buildDossierPageResponse(items, total, pagination);
  }

  private buildDossierDealUserLookupStages(fieldName: "creator" | "buyer" | "seller") {
    return [
      {
        $lookup: {
          from: this.userModel.collection.name,
          localField: fieldName,
          foreignField: "_id",
          as: `${fieldName}Data`,
        },
      },
      {
        $unwind: {
          path: `$${fieldName}Data`,
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          [fieldName]: {
            _id: `$${fieldName}Data._id`,
            username: `$${fieldName}Data.username`,
            email: `$${fieldName}Data.email`,
            wallet: `$${fieldName}Data.wallet`,
            photo: `$${fieldName}Data.photo`,
            avatar: `$${fieldName}Data.avatar`,
            twitterData: `$${fieldName}Data.twitterData`,
            fomoId: `$${fieldName}Data.fomoId`,
          },
        },
      },
      {
        $project: {
          [`${fieldName}Data`]: 0,
        },
      },
    ];
  }

  private async getAdminDossierWithdrawsPage(
    userObjectId: mongoose.Types.ObjectId,
    pagination: UserAdminDossierPagination
  ) {
    const filter = { userId: userObjectId };
    const [items, total] = await Promise.all([
      this.withdrawModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.offset)
        .limit(pagination.limit)
        .lean(),
      this.withdrawModel.countDocuments(filter),
    ]);

    return this.buildDossierPageResponse(items, total, pagination);
  }

  private async getAdminDossierDepositsPage(
    userObjectId: mongoose.Types.ObjectId,
    pagination: UserAdminDossierPagination
  ) {
    const filter = { userId: userObjectId };
    const [items, total] = await Promise.all([
      this.depositModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(pagination.offset)
        .limit(pagination.limit)
        .lean(),
      this.depositModel.countDocuments(filter),
    ]);

    return this.buildDossierPageResponse(items, total, pagination);
  }

  private async getAdminDossierCommentsPage(
    userObjectId: mongoose.Types.ObjectId,
    pagination: UserAdminDossierPagination
  ) {
    const result = await this.commentModel.aggregate([
      { $match: { author: userObjectId } },
      { $sort: { date: -1, _id: -1 } },
      {
        $facet: {
          total: [{ $count: "count" }],
          items: [
            { $skip: pagination.offset },
            { $limit: pagination.limit },
            {
              $project: {
                _id: 1,
                date: 1,
                text: 1,
                page: 1,
                path: 1,
                topicName: 1,
                topicKey: 1,
                categoryKey: 1,
                isTopic: 1,
                viewsCount: 1,
                likesCount: { $size: { $ifNull: ["$likes", []] } },
                dislikesCount: { $size: { $ifNull: ["$dislikes", []] } },
                reportsCount: { $size: { $ifNull: ["$reports", []] } },
                answersCount: { $size: { $ifNull: ["$answers", []] } },
              },
            },
          ],
        },
      },
    ]);

    const items = result?.[0]?.items || [];
    const total = result?.[0]?.total?.[0]?.count || 0;

    return this.buildDossierPageResponse(items, total, pagination);
  }

  private async getAdminDossierSupportPage(
    userObjectId: mongoose.Types.ObjectId,
    pagination: UserAdminDossierPagination
  ) {
    const result = await this.supportModel.aggregate([
      { $match: { user: userObjectId } },
      { $sort: { date: -1, _id: -1 } },
      {
        $facet: {
          total: [{ $count: "count" }],
          items: [
            { $skip: pagination.offset },
            { $limit: pagination.limit },
            {
              $lookup: {
                from: this.projectModel.collection.name,
                localField: "project",
                foreignField: "_id",
                as: "projectData",
              },
            },
            {
              $unwind: {
                path: "$projectData",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $project: {
                _id: 1,
                date: 1,
                theme: 1,
                message: 1,
                category: 1,
                file: 1,
                project: {
                  _id: "$projectData._id",
                  name: "$projectData.name",
                  logo: "$projectData.logo",
                },
              },
            },
          ],
        },
      },
    ]);

    const items = result?.[0]?.items || [];
    const total = result?.[0]?.total?.[0]?.count || 0;

    return this.buildDossierPageResponse(items, total, pagination);
  }

  private async getAdminDossierAppealsPage(
    userObjectId: mongoose.Types.ObjectId,
    pagination: UserAdminDossierPagination
  ) {
    const appealMatch = await this.buildAdminDossierAppealMatch(userObjectId);
    const result = await this.appealModel.aggregate([
      { $match: appealMatch },
      { $sort: { createdAt: -1, _id: -1 } },
      {
        $facet: {
          total: [{ $count: "count" }],
          items: [
            { $skip: pagination.offset },
            { $limit: pagination.limit },
            {
              $lookup: {
                from: this.dealModel.collection.name,
                localField: "dealId",
                foreignField: "_id",
                as: "deal",
              },
            },
            { $unwind: { path: "$deal", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                _id: 1,
                appealId: 1,
                role: 1,
                reason: 1,
                description: 1,
                email: 1,
                attachments: 1,
                status: 1,
                supportChatId: 1,
                resolution: 1,
                txHash: 1,
                resolvedAt: 1,
                createdAt: 1,
                updatedAt: 1,
                deal: {
                  _id: "$deal._id",
                  name: "$deal.name",
                  type: "$deal.type",
                  status: "$deal.status",
                  section: { $ifNull: ["$deal.section", "otc"] },
                  amount: "$deal.amount",
                  price: "$deal.price",
                  ticker: "$deal.ticker",
                  currency: "$deal.currency",
                },
              },
            },
          ],
        },
      },
    ]);

    const items = result?.[0]?.items || [];
    const total = result?.[0]?.total?.[0]?.count || 0;

    return this.buildDossierPageResponse(items, total, pagination);
  }

  private async getAdminDossierLogsPage(
    userObjectId: mongoose.Types.ObjectId,
    pagination: UserAdminDossierPagination
  ) {
    const result = await this.userActionLogsService.getUserLogs(
      userObjectId,
      pagination
    );

    return this.buildDossierPageResponse(result.items, result.total, pagination);
  }

  private async getPortfolioActivityStats(userObjectId: mongoose.Types.ObjectId) {
    const result = await this.portfolioModel.aggregate([
      {
        $match: {
          creator: userObjectId,
        },
      },
      {
        $facet: {
          summary: [
            {
              $addFields: {
                assetCount: { $size: { $ifNull: ["$assets", []] } },
              },
            },
            {
              $group: {
                _id: null,
                totalPortfolioInvested: {
                  $sum: { $ifNull: ["$totalInvested", 0] },
                },
                averageRoiPercent: {
                  $avg: {
                    $cond: [
                      { $gt: ["$assetCount", 0] },
                      { $ifNull: ["$profitPercent", null] },
                      null,
                    ],
                  },
                },
              },
            },
          ],
          buyAssets: [
            { $unwind: "$assets" },
            {
              $match: {
                "assets.type": "buy",
              },
            },
            {
              $group: {
                _id: null,
                buyInvestedTotal: {
                  $sum: { $ifNull: ["$assets.totalPrice", 0] },
                },
                averageInvestmentUsd: {
                  $avg: { $ifNull: ["$assets.totalPrice", 0] },
                },
                projectsSupportedSet: { $addToSet: "$assets.marketAssetId" },
                lastInvestmentAt: { $max: "$assets.date" },
              },
            },
            {
              $project: {
                _id: 0,
                buyInvestedTotal: 1,
                averageInvestmentUsd: 1,
                projectsSupported: { $size: "$projectsSupportedSet" },
                lastInvestmentAt: 1,
              },
            },
          ],
          transactions: [
            { $unwind: "$assets" },
            {
              $match: {
                "assets.type": { $in: ["buy", "sell"] },
              },
            },
            {
              $count: "numberOfDeals",
            },
          ],
        },
      },
    ]);

    const summary = result?.[0]?.summary?.[0] || {};
    const buyAssets = result?.[0]?.buyAssets?.[0] || {};
    const transactions = result?.[0]?.transactions?.[0] || {};
    const totalPortfolioInvested = this.toFiniteNumber(
      summary.totalPortfolioInvested
    );
    const buyInvestedTotal = this.toFiniteNumber(buyAssets.buyInvestedTotal);

    return {
      totalInvestedUsd:
        totalPortfolioInvested > 0 ? totalPortfolioInvested : buyInvestedTotal,
      averageInvestmentUsd: this.toFiniteNumber(
        buyAssets.averageInvestmentUsd
      ),
      numberOfDeals: this.toFiniteNumber(transactions.numberOfDeals),
      projectsSupported: this.toFiniteNumber(buyAssets.projectsSupported),
      lastInvestmentAt: buyAssets.lastInvestmentAt || null,
      averageRoiPercent:
        summary.averageRoiPercent === null ||
        summary.averageRoiPercent === undefined
          ? null
          : this.toFiniteNumber(summary.averageRoiPercent),
    };
  }

  private async getDealActivityStats(userObjectId: mongoose.Types.ObjectId) {
    const result = await this.dealModel.aggregate([
      {
        $match: {
          $and: [
            {
              $or: [
                { section: { $in: ["otc", "p2p"] } },
                { section: { $exists: false } },
              ],
            },
            {
              $or: [
                { creator: userObjectId },
                { buyer: userObjectId },
                { seller: userObjectId },
              ],
            },
          ],
        },
      },
      {
        $addFields: {
          pnlCurrency: {
            $toLower: {
              $cond: [
                { $eq: [{ $ifNull: ["$section", "otc"] }, "p2p"] },
                { $ifNull: ["$currency", "usd"] },
                { $ifNull: ["$ticker", ""] },
              ],
            },
          },
          isCompleted: { $eq: ["$status", "ended"] },
          isSellerRole: {
            $or: [
              { $eq: ["$creator", userObjectId] },
              { $eq: ["$seller", userObjectId] },
            ],
          },
          isBuyerRole: {
            $and: [
              { $eq: ["$buyer", userObjectId] },
              { $ne: ["$creator", userObjectId] },
              { $ne: [{ $ifNull: ["$seller", null] }, userObjectId] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalDeals: { $sum: 1 },
          sells: {
            $sum: {
              $cond: [{ $and: ["$isCompleted", "$isSellerRole"] }, 1, 0],
            },
          },
          buys: {
            $sum: {
              $cond: [{ $and: ["$isCompleted", "$isBuyerRole"] }, 1, 0],
            },
          },
          revenueUsd: {
            $sum: {
              $cond: [
                {
                  $and: [
                    "$isCompleted",
                    "$isSellerRole",
                    { $in: ["$pnlCurrency", ["usd", "usdc"]] },
                  ],
                },
                { $ifNull: ["$price", 0] },
                0,
              ],
            },
          },
        },
      },
    ]);

    const stats = result?.[0] || {};

    return {
      totalDeals: this.toFiniteNumber(stats.totalDeals),
      sells: this.toFiniteNumber(stats.sells),
      buys: this.toFiniteNumber(stats.buys),
      revenueUsd: this.toFiniteNumber(stats.revenueUsd),
    };
  }

  private getEmptyUserActivityStats(): UserActivityStatsResponse {
    return {
      portfolioSnapshot: {
        totalInvestedUsd: 0,
        numberOfDeals: 0,
        averageInvestmentUsd: 0,
        projectsSupported: 0,
        lastInvestmentAt: null,
        averageRoiPercent: null,
      },
      statistics: {
        points: 0,
        score: 0,
        balance: 0,
        partners: 0,
        awards: 0,
      },
      otcP2p: {
        ratingPercent: 0,
        sells: 0,
        buys: 0,
        revenueUsd: 0,
      },
    };
  }

  private calculateProfileScore(user: Record<string, any>): number {
    const fomoScore = this.toFiniteNumber(user?.fomoScore);

    if (fomoScore > 0) {
      return fomoScore;
    }

    try {
      const ratingUser = {
        ...user,
        projects: Array.isArray(user?.projects) ? user.projects : [],
        news: Array.isArray(user?.news) ? user.news : [],
        socialNetworks: user?.socialNetworks || null,
        tasks: this.toFiniteNumber(user?.tasks),
        redFlags: this.toFiniteNumber(user?.redFlags),
      } as User;

      return this.toFiniteNumber(this.ratingService.calculateUserRating(ratingUser));
    } catch {
      return 0;
    }
  }

  private getPartnersCount(user: Record<string, any>): number {
    const partners = this.toFiniteNumber(user?.partners);

    if (partners > 0) {
      return partners;
    }

    return Array.isArray(user?.refLvlOne) ? user.refLvlOne.length : 0;
  }

  private getAwardsCount(user: Record<string, any>): number {
    const badges = Array.isArray(user?.spaceportClaimedBadges)
      ? user.spaceportClaimedBadges.length
      : 0;
    const rewards = Array.isArray(user?.spaceportClaimedRewards)
      ? user.spaceportClaimedRewards.length
      : 0;

    return badges + rewards;
  }

  private toFiniteNumber(value: unknown): number {
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  private normalizePortfolioTokenSymbol(value: unknown): string | null {
    const normalizedValue = String(value || "").trim();

    if (!normalizedValue) return null;
    if (normalizedValue.toLowerCase() === "smart contract platform") return null;

    return normalizedValue.toUpperCase();
  }

  /**
   * PUBLIC SpacePort level ladder + global XP rank config (backend single source).
   * Privileges ("What You Unlock") are overlaid from the ADMIN-editable spaceport_config
   * benefits, so whatever admins edit in the panel drives the public website.
   */
  async getSpaceportLevelsConfig() {
    const config = getSpaceportLevelsConfig();
    const benefitsByLevel = await this.getSpaceportLevelBenefits();
    return this.applySpaceportBenefits(config, benefitsByLevel);
  }

  /** Read admin-editable SpacePort level benefits (privileges) keyed by level number. */
  private async getSpaceportLevelBenefits(): Promise<Map<number, string[]>> {
    const benefitsByLevel = new Map<number, string[]>();
    let levels: any[] = DEFAULT_SPACEPORT_LEVELS as any[];

    try {
      const cfg = await this.spaceportConfigModel.findOne().lean().exec();
      if (cfg && Array.isArray((cfg as any).levels) && (cfg as any).levels.length > 0) {
        levels = (cfg as any).levels;
      }
    } catch (error) {
      levels = DEFAULT_SPACEPORT_LEVELS as any[];
    }

    for (const level of levels) {
      const levelNumber = Number(level?.level);
      if (!Number.isFinite(levelNumber)) continue;
      const benefits = Array.isArray(level?.benefits)
        ? level.benefits.map((benefit: any) => String(benefit || "").trim()).filter(Boolean)
        : [];
      benefitsByLevel.set(levelNumber, benefits);
    }

    return benefitsByLevel;
  }

  /**
   * Overlay admin-config benefits onto the SpacePort level views as privileges.
   * Reached-level benefits are shown as "active" (unlocked); not-yet-reached levels
   * are shown as "planned" (coming soon). Falls back to code defaults when a level
   * has no admin-configured benefits.
   */
  private applySpaceportBenefits<T extends { levels?: any[] }>(
    data: T,
    benefitsByLevel: Map<number, string[]>
  ): T {
    if (!data || !Array.isArray(data.levels)) {
      return data;
    }

    data.levels = data.levels.map((level: any) => {
      const benefits = benefitsByLevel.get(Number(level?.level));
      if (!benefits || benefits.length === 0) {
        return level;
      }
      const reached = Boolean(level?.reached);
      return {
        ...level,
        privileges: benefits.map((label, index) => ({
          key: `lvl${level.level}_benefit_${index}`,
          label,
          status: reached ? "active" : "planned",
        })),
      };
    });

    return data;
  }

  private async buildUserSpaceportProgression(user: Partial<UserDocument> & Record<string, any>) {    const wallet = String(user?.wallet || "").trim();
    let stakingSummary: Record<string, any> = {};

    if (wallet) {
      try {
        const stakingHistory = await this.spaceportStakingService.getWalletHistory(wallet);
        stakingSummary =
          stakingHistory && typeof stakingHistory.summary === "object" && stakingHistory.summary
            ? stakingHistory.summary
            : {};
      } catch (error) {
        stakingSummary = {};
      }
    }

    const spaceportCfg = await this.spaceportConfigModel.findOne().lean().exec().catch(() => null);
    const canonicalMilestones =
      Array.isArray((spaceportCfg as any)?.milestones) && (spaceportCfg as any).milestones.length > 0
        ? (spaceportCfg as any).milestones
        : undefined;

    const progression = buildSpaceportProgression({
      stakingSummary,
      xp: user?.activityXP,
      claimedStakingXp: user?.spaceportClaimedStakingXp,
      claimedBadges: Array.isArray(user?.spaceportClaimedBadges)
        ? user.spaceportClaimedBadges
        : [],
      claimedRewards: Array.isArray(user?.spaceportClaimedRewards)
        ? user.spaceportClaimedRewards
        : [],
      tasks: 0,
      otcVolumeUsd: 0,
      launchpads: 0,
      primeProjects: 0,
      milestones: canonicalMilestones,
    });

    // Overlay admin-editable "What You Unlock" benefits from spaceport_config.
    const benefitsByLevel = await this.getSpaceportLevelBenefits();
    const enriched = this.applySpaceportBenefits(progression, benefitsByLevel);

    // Fire-and-forget: evaluate platform badges from confirmed facts (non-blocking).
    try {
      const userId = String((user as any)?._id || "");
      if (userId) {
        void this.badgesService
          .evaluateForUser(userId, {
            xp: Number((user as any)?.activityXP || 0),
            stakingDays: Number((progression as any)?.totalStakingDays || 0),
            accountLevel: Number((progression as any)?.currentLevel || 0),
          })
          .catch(() => undefined);
      }
    } catch (_) {
      // never block profile build on badge evaluation
    }

    return enriched;
  }

  async claimSpaceportReward(userId: string, badgeKeyRaw: string): Promise<{
    success: boolean;
    rewardKey: string;
    xpAwarded: number;
    activityXP: number;
    spaceportProgression: SpaceportProgressionData;
  }> {
    const rewardKey = String(badgeKeyRaw || "").trim().toLowerCase();

    if (!rewardKey) {
      throw new BadRequestException("Unknown Spaceport reward");
    }

    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const spaceportProgression = await this.buildUserSpaceportProgression(user);
    const reward = Array.isArray(spaceportProgression?.stakingRewards)
      ? spaceportProgression.stakingRewards.find((item) => item.key === rewardKey)
      : null;

    if (!reward) {
      throw new NotFoundException("Spaceport reward not found");
    }

    if (reward.claimed) {
      return {
        success: true,
        rewardKey,
        xpAwarded: 0,
        activityXP: Number(user.activityXP || 0),
        spaceportProgression,
      };
    }

    if (!reward.claimable) {
      throw new BadRequestException("Reward is not ready to claim");
    }

    const xpAwarded = Number(reward.rewardXp || 0);
    const claimedRewards = Array.isArray(user.spaceportClaimedRewards)
      ? user.spaceportClaimedRewards.filter((item: any) => item?.key !== rewardKey)
      : [];

    // Award SpacePort reward XP exclusively through the ledger (no direct activityXP write).
    const awardResult = await this.xpLedger.award({
      userId: user._id.toString(),
      eventType: "spaceport_reward",
      source: "system",
      sourceType: "spaceport_reward",
      sourceId: rewardKey,
      baseXpOverride: xpAwarded,
      verified: true,
      reason: "Награда SpacePort получена",
      metadata: { rewardKey, rewardName: (reward as any).name || "" },
    });

    const nextActivityXp =
      typeof awardResult.activityXP === "number"
        ? awardResult.activityXP
        : Number(user.activityXP || 0) + xpAwarded;

    claimedRewards.push({
      key: rewardKey,
      claimedAt: new Date(),
      xpAwarded,
    } as any);

    user.activityXP = nextActivityXp;
    user.spaceportClaimedRewards = claimedRewards as any;

    const updatedSpaceportProgression = await this.buildUserSpaceportProgression(user);
    user.spaceportProgression = updatedSpaceportProgression as any;

    await user.save();

    await this.userActionLogsService.log({
      userId: user._id,
      actorId: user._id,
      actorType: "user",
      category: "spaceport",
      action: "spaceport.reward_claimed",
      title: "Spaceport reward claimed",
      metadata: {
        rewardKey,
        xpAwarded,
        activityXP: nextActivityXp,
      },
    });

    return {
      success: true,
      rewardKey,
      xpAwarded,
      activityXP: nextActivityXp,
      spaceportProgression: updatedSpaceportProgression,
    };
  }

  async getFomiesList(query: QueryUsersDto): Promise<any> {
    if (this.hasNarrowedFomiesNftFilter(query)) {
      const result: Array<any> = await this.userModel.aggregate(
        this.buildUserPipeline(query, { disablePagination: true })
      );

      const users = Array.isArray(result?.[0]?.users) ? result[0].users : [];
      const usersWithNftCounts = await this.enrichFomiesUsersWithSpaceportNftCounts(
        users
      );
      const filteredUsers = this.filterFomiesUsersByNftCount(
        usersWithNftCounts,
        query.nftsValue
      );
      const skip = Number(query?.offset || 0);
      const limit = Number(query?.limit || 20);

      return {
        totalCount: filteredUsers.length,
        users: this.applyResolvedRank(filteredUsers.slice(skip, skip + limit)),
      };
    }

    const result: Array<any> = await this.userModel.aggregate(
      this.buildUserPipeline(query)
    );

    const { totalCount, users } = result[0];
    const usersWithNftCounts = await this.enrichFomiesUsersWithSpaceportNftCounts(
      Array.isArray(users) ? users : []
    );

    return {
      totalCount: totalCount[0]?.count || 0,
      users: this.applyResolvedRank(usersWithNftCounts),
    };
  }

  /**
   * Single source of truth for user rank: derive `rank` from activityXP via RankResolver.
   * Overrides any stored/legacy rank so /crypto/fomies is always consistent.
   */
  private applyResolvedRank(users: Array<any>): Array<any> {
    if (!Array.isArray(users)) return users;
    return users.map((u) => {
      const resolved = this.rankResolver.resolveSync(Number(u?.activityXP) || 0);
      return {
        ...u,
        rank: resolved.name,
        rankKey: resolved.key,
        rankProgressPct: resolved.progressPct,
        xpToNext: resolved.xpToNext,
      };
    });
  }

  private hasNarrowedFomiesNftFilter(query: QueryUsersDto): boolean {
    return Boolean(
      query.nftsValue &&
      !this.hasOnlyDefaultFilterValues(
        query.nftsValue,
        this.defaultFomiesFilterValues.nftsValue
      )
    );
  }

  private filterFomiesUsersByNftCount(users: any[], nftFilter?: string) {
    const ranges = this.parseFilterRanges(nftFilter);

    if (!ranges.length) return users;

    return users.filter((user) => {
      const status = user?.spaceportNftCountStatus;
      const count =
        status === "no-wallet"
          ? 0
          : status === "ready"
            ? Number(user?.spaceportNftCount)
            : null;

      if (count === null || !Number.isFinite(count)) return false;

      return ranges.some(([min, max]) => count >= min && count <= max);
    });
  }

  private async enrichFomiesUsersWithSpaceportNftCounts(users: any[]) {
    const walletAddresses = users
      .map((user) => String(user?.wallet || "").trim())
      .filter(Boolean);
    const nftStatsByWallet =
      await this.spaceportNftService.getWalletNftCounts(walletAddresses);

    return users.map((user) => {
      const wallet = String(user?.wallet || "").trim();
      const normalizedWallet = wallet.toLowerCase();
      const nftStats = nftStatsByWallet[normalizedWallet];

      if (!wallet || !nftStats) {
        return {
          ...user,
          nftsValue: null,
          spaceportNftCount: null,
          spaceportNftCountStatus: "no-wallet",
        };
      }

      return {
        ...user,
        nftsValue: nftStats.status === "ready" ? nftStats.count : null,
        spaceportNftCount: nftStats.count,
        spaceportNftCountStatus: nftStats.status,
        spaceportNftContract: nftStats.nftAddress,
      };
    });
  }

  async getFomiesStatistics(): Promise<any> {
    const stats: any = await this.userModel.aggregate([
      {
        $facet: {
          totalFomies: [{ $match: { role: ["user"] } }, { $count: "count" }],
          verified: [
            { $match: { verificationStatus: true } },
            { $count: "count" },
          ],
          avgXP: [
            {
              $group: {
                _id: null,
                avgXP: { $avg: "$activityXP" },
              },
            },
          ],
          topRank: [
            {
              $addFields: {
                rank: {
                  $switch: {
                    branches: [
                      {
                        case: {
                          $and: [
                            { $gte: ["$activityXP", 900] },
                            { $lte: ["$activityXP", 1000] },
                          ],
                        },
                        then: "Universal Enlightenment",
                      },
                      {
                        case: {
                          $and: [
                            { $gte: ["$activityXP", 800] },
                            { $lte: ["$activityXP", 899] },
                          ],
                        },
                        then: "Astral Sage",
                      },
                      {
                        case: {
                          $and: [
                            { $gte: ["$activityXP", 600] },
                            { $lte: ["$activityXP", 799] },
                          ],
                        },
                        then: "Celestial Master",
                      },
                      {
                        case: {
                          $and: [
                            { $gte: ["$activityXP", 400] },
                            { $lte: ["$activityXP", 599] },
                          ],
                        },
                        then: "Galactic Navigator",
                      },
                      {
                        case: {
                          $and: [
                            { $gte: ["$activityXP", 200] },
                            { $lte: ["$activityXP", 399] },
                          ],
                        },
                        then: "Cosmic Explorer",
                      },
                      {
                        case: {
                          $and: [
                            { $gte: ["$activityXP", 0] },
                            { $lte: ["$activityXP", 199] },
                          ],
                        },
                        then: "Stellar Awakening",
                      },
                    ],
                    default: null,
                  },
                },
              },
            },
            {
              $addFields: {
                rankPriority: {
                  $switch: {
                    branches: [
                      {
                        case: { $eq: ["$rank", "Universal Enlightenment"] },
                        then: 6,
                      },
                      { case: { $eq: ["$rank", "Astral Sage"] }, then: 5 },
                      { case: { $eq: ["$rank", "Celestial Master"] }, then: 4 },
                      {
                        case: { $eq: ["$rank", "Galactic Navigator"] },
                        then: 3,
                      },
                      { case: { $eq: ["$rank", "Cosmic Explorer"] }, then: 2 },
                      {
                        case: { $eq: ["$rank", "Stellar Awakening"] },
                        then: 1,
                      },
                    ],
                    default: 0,
                  },
                },
              },
            },
            { $sort: { rankPriority: -1 } },
            { $limit: 1 },
            { $project: { _id: 0, rank: 1 } },
          ],
        },
      },
      {
        $project: {
          totalFomies: {
            $ifNull: [{ $arrayElemAt: ["$totalFomies.count", 0] }, 0],
          },
          verified: { $ifNull: [{ $arrayElemAt: ["$verified.count", 0] }, 0] },
          avgXP: {
            $ifNull: [
              { $round: [{ $arrayElemAt: ["$avgXP.avgXP", 0] }, 0] },
              0,
            ],
          },
          topRank: { $ifNull: [{ $arrayElemAt: ["$topRank.rank", 0] }, ""] },
        },
      },
    ]);

    // Single source of truth: topRank is resolved from activityXP via RankResolver
    // (the legacy $switch facet above is superseded and will be removed in cleanup).
    const result = stats[0] || {
      totalFomies: 0,
      verified: 0,
      avgXP: 0,
      topRank: "",
    };
    const topUser: any = await this.userModel
      .findOne({ role: ["user"] })
      .sort({ activityXP: -1 })
      .select("activityXP")
      .lean();
    result.topRank = topUser
      ? this.rankResolver.resolveSync(Number(topUser.activityXP) || 0).name
      : "";
    return result;
  }

  async getFomiesLeaderboard(query: QueryFomiesLeaderboardDto): Promise<{
    items: Array<{
      userId: string;
      name: string;
      username: string;
      photo: string;
      twitterData: Record<string, any> | null;
      rating: number;
      activityXP: number;
      followersCount: number;
      roi: number | null;
      roiRange: "24H" | "7D" | "30D" | "90D" | "1Y" | "ALL";
      hasPublicPortfolio: boolean;
    }>;
    total: number;
    offset: number;
    limit: number;
  }> {
    const range = this.normalizeLeaderboardRange(query?.range);
    const sortBy = this.normalizeLeaderboardSort(query?.sortBy);
    const search = String(query?.search || "").trim();
    const offset = Math.max(Number(query?.offset || 0), 0);
    const limit = Math.min(Math.max(Number(query?.limit || 10), 1), 50);

    const pipeline: any[] = [
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $size: "$role" }, 1] },
              { $eq: [{ $arrayElemAt: ["$role", 0] }, "user"] },
            ],
          },
          isCodeActivated: true,
        },
      },
    ];

    if (search) {
      const searchRegex = new RegExp(search, "i");
      pipeline.push({
        $match: {
          $or: [
            { name: searchRegex },
            { username: searchRegex },
            { "twitterData.name": searchRegex },
            { "twitterData.username": searchRegex },
          ],
        },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: this.portfolioModel.collection.name,
          let: { creatorId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$creator", "$$creatorId"] },
                    { $eq: ["$isShare", true] },
                    { $eq: ["$shareType", "public"] },
                  ],
                },
              },
            },
            { $sort: { updatedAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                _id: 1,
                profitPercent: 1,
                performance24h: 1,
                performance7d: 1,
                performance30d: 1,
                performance90d: 1,
                performance1y: 1,
              },
            },
          ],
          as: "publicPortfolio",
        },
      },
      {
        $addFields: {
          publicPortfolio: { $arrayElemAt: ["$publicPortfolio", 0] },
          followersCount: { $size: { $ifNull: ["$followers", []] } },
        },
      },
      {
        $addFields: {
          hasPublicPortfolio: {
            $ne: [{ $ifNull: ["$publicPortfolio._id", null] }, null],
          },
          roi: this.getLeaderboardRoiExpression(range),
        },
      },
      {
        $addFields: {
          hasRoi: { $cond: [{ $ne: ["$roi", null] }, 1, 0] },
        },
      }
    );

    const sortStage =
      sortBy === "ROI"
        ? {
            $sort: {
              hasRoi: -1,
              roi: -1,
              activityXP: -1,
              followersCount: -1,
              _id: 1,
            },
          }
        : {
            $sort: {
              activityXP: -1,
              hasRoi: -1,
              roi: -1,
              followersCount: -1,
              _id: 1,
            },
          };

    pipeline.push(
      sortStage,
      {
        $facet: {
          items: [
            { $skip: offset },
            { $limit: limit },
            {
              $project: {
                _id: 0,
                userId: { $toString: "$_id" },
                name: {
                  $ifNull: [
                    "$name",
                    {
                      $ifNull: ["$twitterData.name", "Unnamed user"],
                    },
                  ],
                },
                username: { $ifNull: ["$username", ""] },
                photo: { $ifNull: ["$photo", ""] },
                twitterData: { $ifNull: ["$twitterData", null] },
                rating: { $ifNull: ["$rating", 0] },
                activityXP: { $ifNull: ["$activityXP", 0] },
                followersCount: { $ifNull: ["$followersCount", 0] },
                roi: { $ifNull: ["$roi", null] },
                roiRange: { $literal: range },
                hasPublicPortfolio: { $ifNull: ["$hasPublicPortfolio", false] },
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      }
    );

    const result = await this.userModel.aggregate(pipeline);
    const payload = result?.[0] || {};

    return {
      items: Array.isArray(payload.items) ? payload.items : [],
      total: payload.totalCount?.[0]?.count || 0,
      offset,
      limit,
    };
  }

  async searchFomiesUsers(query: QueryFomiesSearchDto): Promise<{
    items: Array<{
      userId: string;
      name: string;
      username: string;
      photo: string;
      twitterData: Record<string, any> | null;
      verificationStatus: boolean;
      activityXP: number;
      rank: string;
      followersCount: number;
    }>;
  }> {
    const search = String(query?.search || "").trim();
    const limit = Math.min(Math.max(Number(query?.limit || 10), 1), 10);
    const excludeIds = this.parseObjectIdList(query?.excludeIds);

    if (!search) {
      return { items: [] };
    }

    const searchRegex = new RegExp(search, "i");
    const pipeline: any[] = [
      {
        $match: {
          $expr: {
            $and: [
              { $eq: [{ $size: "$role" }, 1] },
              { $eq: [{ $arrayElemAt: ["$role", 0] }, "user"] },
            ],
          },
          isCodeActivated: true,
          ...(excludeIds.length
            ? {
                _id: {
                  $nin: excludeIds,
                },
              }
            : {}),
          $or: [
            { name: searchRegex },
            { username: searchRegex },
            { "twitterData.name": searchRegex },
            { "twitterData.username": searchRegex },
          ],
        },
      },
      {
        $addFields: {
          followersCount: {
            $size: {
              $ifNull: ["$followers", []],
            },
          },
        },
      },
      {
        $sort: {
          activityXP: -1,
          followersCount: -1,
          _id: 1,
        },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          _id: 0,
          userId: { $toString: "$_id" },
          name: {
            $ifNull: [
              "$name",
              {
                $ifNull: ["$twitterData.name", "Unnamed user"],
              },
            ],
          },
          username: { $ifNull: ["$username", ""] },
          photo: { $ifNull: ["$photo", ""] },
          twitterData: { $ifNull: ["$twitterData", null] },
          verificationStatus: { $ifNull: ["$verificationStatus", false] },
          activityXP: { $ifNull: ["$activityXP", 0] },
          rank: { $ifNull: ["$rank", ""] },
          followersCount: { $ifNull: ["$followersCount", 0] },
        },
      },
    ];

    return {
      items: await this.userModel.aggregate(pipeline),
    };
  }

  async getFomiesShowdown(query: QueryFomiesShowdownDto): Promise<{
    items: Array<{
      userId: string;
      name: string;
      username: string;
      photo: string;
      twitterData: Record<string, any> | null;
      verificationStatus: boolean;
      activityXP: number;
      rank: string;
      followersCount: number | null;
      portfolio: {
        hasPublicPortfolio: boolean;
        roi30d: number | null;
        totalAssets: number | null;
        totalCategories: number | null;
        topHeldToken: string | null;
        linkedPortfoliosCount: number | null;
        portfolioBalance: number | null;
        numberOfDeals: number | null;
        averageRoi: number | null;
      };
      activity: {
        commentsCount: number | null;
        referralCount: number | null;
        activityCount: number | null;
        hoursOnline: number | null;
        claimedTasksCount: number | null;
      };
      interactions: {
        redFlagsCount: number | null;
        memberSince: Date | null;
        location: string | null;
      };
    }>;
  }> {
    const ids = this.parseObjectIdList(query?.ids).slice(0, 5);

    if (!ids.length) {
      return { items: [] };
    }

    const objectIdStringValues = ids.map((id) => id.toString());
    const pipeline: any[] = [
      {
        $match: {
          _id: { $in: ids },
          $expr: {
            $and: [
              { $eq: [{ $size: "$role" }, 1] },
              { $eq: [{ $arrayElemAt: ["$role", 0] }, "user"] },
            ],
          },
          isCodeActivated: true,
        },
      },
      {
        $lookup: {
          from: this.portfolioModel.collection.name,
          let: { creatorId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$creator", "$$creatorId"] },
                    { $eq: ["$isShare", true] },
                    { $eq: ["$shareType", "public"] },
                  ],
                },
              },
            },
            { $sort: { updatedAt: -1 } },
            { $limit: 1 },
            {
              $project: {
                _id: 1,
                profitPercent: 1,
                performance30d: 1,
                categoryDistribution: 1,
                calculatedAssets: 1,
              },
            },
          ],
          as: "publicPortfolio",
        },
      },
      {
        $lookup: {
          from: this.commentModel.collection.name,
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$author", "$$userId"] },
                    {
                      $eq: [
                        { $toString: "$author" },
                        { $toString: "$$userId" },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $count: "count",
            },
          ],
          as: "commentsMeta",
        },
      },
      {
        $lookup: {
          from: this.refModel.collection.name,
          let: { userWallet: "$wallet" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$userAddress", "$$userWallet"] },
              },
            },
            {
              $project: {
                _id: 0,
                partnersCount: {
                  $cond: [
                    { $isArray: "$partnersList" },
                    { $size: "$partnersList" },
                    null,
                  ],
                },
              },
            },
            { $limit: 1 },
          ],
          as: "refMeta",
        },
      },
      {
        $lookup: {
          from: this.activityModel.collection.name,
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$userId", "$$userId"] },
                    {
                      $eq: [
                        { $toString: "$userId" },
                        { $toString: "$$userId" },
                      ],
                    },
                  ],
                },
              },
            },
            {
              $count: "count",
            },
          ],
          as: "activityMeta",
        },
      },
      {
        $addFields: {
          publicPortfolio: { $arrayElemAt: ["$publicPortfolio", 0] },
          commentsCount: {
            $ifNull: [{ $arrayElemAt: ["$commentsMeta.count", 0] }, null],
          },
          followersCount: {
            $cond: [
              { $isArray: "$followers" },
              { $size: "$followers" },
              null,
            ],
          },
          referralCount: {
            $ifNull: [{ $arrayElemAt: ["$refMeta.partnersCount", 0] }, null],
          },
          linkedPortfoliosCount: {
            $cond: [
              { $isArray: "$portfolio" },
              { $size: "$portfolio" },
              null,
            ],
          },
          activityCount: {
            $ifNull: [{ $arrayElemAt: ["$activityMeta.count", 0] }, null],
          },
          claimedTasksCount: {
            $cond: [
              { $isArray: "$claimedTasks" },
              { $size: "$claimedTasks" },
              null,
            ],
          },
        },
      },
      {
        $addFields: {
          totalAssets: {
            $cond: [
              { $isArray: "$publicPortfolio.calculatedAssets" },
              { $size: "$publicPortfolio.calculatedAssets" },
              null,
            ],
          },
          totalCategories: {
            $cond: [
              {
                $and: [
                  { $ne: ["$publicPortfolio", null] },
                  {
                    $eq: [
                      { $type: "$publicPortfolio.categoryDistribution" },
                      "object",
                    ],
                  },
                ],
              },
              {
                $size: {
                  $objectToArray: {
                    $ifNull: ["$publicPortfolio.categoryDistribution", {}],
                  },
                },
              },
              null,
            ],
          },
          topHeldAsset: {
            $cond: [
              { $isArray: "$publicPortfolio.calculatedAssets" },
              {
                $reduce: {
                  input: "$publicPortfolio.calculatedAssets",
                  initialValue: null,
                  in: {
                    $cond: [
                      {
                        $or: [
                          { $eq: ["$$value", null] },
                          {
                            $gt: [
                              { $ifNull: ["$$this.allocationPercent", -1] },
                              { $ifNull: ["$$value.allocationPercent", -1] },
                            ],
                          },
                        ],
                      },
                      "$$this",
                      "$$value",
                    ],
                  },
                },
              },
              null,
            ],
          },
        },
      },
      {
        $lookup: {
          from: this.marketReadModel.collection.name,
          let: { topMarketAssetId: "$topHeldAsset.marketAssetId" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$marketAssetId", "$$topMarketAssetId"] },
              },
            },
            {
              $project: {
                _id: 0,
                symbol: 1,
                name: 1,
              },
            },
            { $limit: 1 },
          ],
          as: "topHeldProject",
        },
      },
      {
        $addFields: {
          topHeldProject: { $arrayElemAt: ["$topHeldProject", 0] },
        },
      },
      {
        $addFields: {
          showdownPortfolio: {
            hasPublicPortfolio: {
              $ne: [{ $ifNull: ["$publicPortfolio._id", null] }, null],
            },
            roi30d: { $ifNull: ["$publicPortfolio.performance30d.usd", null] },
            totalAssets: "$totalAssets",
            totalCategories: "$totalCategories",
            topHeldToken: {
              $cond: [
                { $ne: ["$topHeldProject", null] },
                {
                  $toUpper: {
                    $ifNull: ["$topHeldProject.symbol", "$topHeldProject.name"],
                  },
                },
                null,
              ],
            },
            linkedPortfoliosCount: "$linkedPortfoliosCount",
            portfolioBalance: {
              $cond: [
                { $gt: [{ $ifNull: ["$portfolioBalance", 0] }, 0] },
                "$portfolioBalance",
                null,
              ],
            },
            numberOfDeals: {
              $cond: [
                { $gt: [{ $ifNull: ["$numberOfDeals", 0] }, 0] },
                "$numberOfDeals",
                null,
              ],
            },
            averageRoi: {
              $cond: [
                { $ne: [{ $ifNull: ["$publicPortfolio.profitPercent", null] }, null] },
                "$publicPortfolio.profitPercent",
                null,
              ],
            },
          },
          showdownActivity: {
            commentsCount: "$commentsCount",
            referralCount: "$referralCount",
            activityCount: {
              $cond: [
                { $gt: [{ $ifNull: ["$activityCount", 0] }, 0] },
                "$activityCount",
                null,
              ],
            },
            hoursOnline: {
              $cond: [
                { $gt: [{ $ifNull: ["$hoursOnline", 0] }, 0] },
                "$hoursOnline",
                null,
              ],
            },
            claimedTasksCount: {
              $cond: [
                { $gt: [{ $ifNull: ["$claimedTasksCount", 0] }, 0] },
                "$claimedTasksCount",
                null,
              ],
            },
          },
          showdownInteractions: {
            redFlagsCount: { $ifNull: ["$redFlags", null] },
            memberSince: { $ifNull: ["$createDate", null] },
            location: {
              $cond: [
                { $eq: [{ $type: "$regionData" }, "object"] },
                {
                  $let: {
                    vars: {
                      region: { $ifNull: ["$regionData.region", ""] },
                      country: {
                        $ifNull: ["$regionData.properties.name", ""],
                      },
                    },
                    in: {
                      $cond: [
                        {
                          $or: [
                            { $ne: ["$$region", ""] },
                            { $ne: ["$$country", ""] },
                          ],
                        },
                        {
                          $trim: {
                            input: {
                              $concat: [
                                "$$region",
                                {
                                  $cond: [
                                    {
                                      $and: [
                                        { $ne: ["$$region", ""] },
                                        { $ne: ["$$country", ""] },
                                      ],
                                    },
                                    ", ",
                                    "",
                                  ],
                                },
                                "$$country",
                              ],
                            },
                          },
                        },
                        null,
                      ],
                    },
                  },
                },
                null,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          userId: { $toString: "$_id" },
          name: {
            $ifNull: [
              "$name",
              {
                $ifNull: ["$twitterData.name", "Unnamed user"],
              },
            ],
          },
          username: { $ifNull: ["$username", ""] },
          photo: { $ifNull: ["$photo", ""] },
          twitterData: { $ifNull: ["$twitterData", null] },
          verificationStatus: { $ifNull: ["$verificationStatus", false] },
          activityXP: { $ifNull: ["$activityXP", 0] },
          rank: { $ifNull: ["$rank", ""] },
          followersCount: 1,
          portfolio: "$showdownPortfolio",
          activity: "$showdownActivity",
          interactions: "$showdownInteractions",
        },
      },
    ];

    const items = await this.userModel.aggregate(pipeline);
    const itemsById = new Map(items.map((item: any) => [item.userId, item]));

    return {
      items: objectIdStringValues
        .map((id) => itemsById.get(id))
        .filter(Boolean),
    };
  }

  async loginByWallet(wallet: string): Promise<{ user: User; token: string }> {
    const user = await this.userModel.findOne({ wallet, banned: false });

    if (!user) {
      throw new HttpException("User not exist", HttpStatus.BAD_REQUEST);
    }

    const token: string = await this.authService.createInitialToken(wallet);

    await this.userActionLogsService.log({
      userId: user?._id,
      walletAddress: wallet,
      actorType: "user",
      category: "auth",
      action: "auth.initial_wallet_login",
      title: "Initial wallet login",
      metadata: {
        wallet,
      },
    });

    return { user, token };
  }

  async registrationByEmail(wallet: string, userDto: UserDto) {
    const candidate = await this.getUserByEmail(userDto.email);

    if (candidate) {
      throw new HttpException(
        "User with this email exists",
        HttpStatus.BAD_REQUEST
      );
    }

    const user = await this.authService.registration(wallet, userDto);

    return user;
  }

  async createUserByAdmin(userDto: UserDto) {
    const candidate = await this.getUserByEmail(userDto.email);

    if (candidate) {
      throw new HttpException(
        "User with this email exists",
        HttpStatus.BAD_REQUEST
      );
    }

    await this.authService.registrationByAdmin(userDto, "user");

    return "User created";
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const candidate = await this.userModel.findOne({ _id: new mongoose.Types.ObjectId(id) });

    if (!candidate) {
      throw new HttpException("User not found", HttpStatus.BAD_REQUEST);
    }

    if (updateUserDto.regionData) {
      candidate.regionData = updateUserDto.regionData;
    }

    const changedFields: string[] = [];

    for (const key in updateUserDto) {
      if (!this.isUserEditableUpdateKey(key)) continue;

      if (JSON.stringify(candidate[key]) !== JSON.stringify(updateUserDto[key])) {
        changedFields.push(key);
      }

      candidate[key] = updateUserDto[key];
    }

    await candidate.save();

    if (changedFields.length) {
      await this.userActionLogsService.log({
        userId: candidate._id,
        actorId: candidate._id,
        actorType: "user",
        category: "profile",
        action: "profile.updated",
        title: "Profile updated",
        metadata: {
          changedFields,
        },
      });
    }

    return candidate;
  }

  async connectTelegram(id: string, telegramData: ConnectTelegramDto) {
    const candidate = await this.userModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    if (!candidate) {
      throw new HttpException("User not found", HttpStatus.BAD_REQUEST);
    }

    const nextTelegramData = {
      ...(candidate.telegramData || {}),
      username: String(telegramData?.username || "").trim(),
      name: String(telegramData?.name || "").trim(),
      telegramId: String(telegramData?.telegramId || "").trim(),
    };

    if (!nextTelegramData.telegramId) {
      throw new HttpException("Telegram id is required", HttpStatus.BAD_REQUEST);
    }

    candidate.telegramData = nextTelegramData as any;

    await candidate.save();

    await this.userActionLogsService.log({
      userId: candidate._id,
      actorId: candidate._id,
      actorType: "user",
      category: "profile",
      action: "profile.telegram_connected",
      title: "Telegram connected",
      metadata: {
        username: nextTelegramData.username,
        name: nextTelegramData.name,
        telegramId: nextTelegramData.telegramId,
      },
    });

    return candidate;
  }

  async updateUserPhoto(
    id: string,
    photo: File
  ): Promise<{ isSuccess: boolean; photo: string }> {
    const userToUpdate = await this.userModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
    });

    const photoLink: string = await this.filesService.writeFile(photo);

    userToUpdate.photo && await this.filesService.removeFile(userToUpdate.photo);

    userToUpdate.photo = photoLink;

    await userToUpdate.save();

    await this.userActionLogsService.log({
      userId: userToUpdate._id,
      actorId: userToUpdate._id,
      actorType: "user",
      category: "profile",
      action: "profile.photo_updated",
      title: "Profile photo updated",
      metadata: {
        photo: photoLink,
      },
    });

    return { isSuccess: true, photo: photoLink };
  }

  async updateUserByAdmin(
    userId: string,
    updateUserDto: UpdateUserDto,
    actorId?: string
  ) {
    const candidate = await this.userModel.findById(userId);

    if (!candidate) {
      throw new HttpException("User not found", HttpStatus.BAD_REQUEST);
    }

    const changedFields: string[] = [];

    if (candidate.email !== updateUserDto.email) changedFields.push("email");
    if (candidate.wallet !== updateUserDto.wallet) changedFields.push("wallet");
    if (updateUserDto.username && candidate.username !== updateUserDto.username) {
      changedFields.push("username");
    }
    if (updateUserDto.risk && candidate.risk !== updateUserDto.risk) {
      changedFields.push("risk");
    }

    candidate.email = updateUserDto.email;
    candidate.wallet = updateUserDto.wallet;
    if (updateUserDto.username) candidate.username = updateUserDto.username;
    if (updateUserDto.risk) candidate.risk = updateUserDto.risk;

    await candidate.save();

    if (changedFields.length) {
      await this.userActionLogsService.log({
        userId: candidate._id,
        actorId,
        actorType: "admin",
        category: "profile",
        action: "profile.updated_by_staff",
        title: "Profile updated by staff",
        metadata: {
          changedFields,
        },
      });
    }

    return {
      email: candidate.email,
      wallet: candidate.wallet,
      password: candidate.password,
    };
  }

  async updateVerificationStatus(
    userId: string,
    action: "verification" | "removal-verification" | string,
    actorId?: string
  ): Promise<string> {
    const user: UserDocument = await this.userModel.findByIdAndUpdate(userId, {
      verificationStatus: action === "verification",
    });

    if (!user)
      throw new HttpException(
        "Verification status update error!",
        HttpStatus.BAD_REQUEST
      );

    await this.userActionLogsService.log({
      userId,
      actorId,
      actorType: "admin",
      category: "profile",
      action: "profile.verification_status_updated",
      title: "Verification status updated",
      metadata: {
        action,
        verificationStatus: action === "verification",
      },
    });

    return "Verification status updated";
  }

  async updateUserStatus(userId: string, isBlocked: boolean, actorId?: string) {
    const candidate = await this.userModel.findById(userId);

    if (!candidate) {
      throw new HttpException("User not found", HttpStatus.BAD_REQUEST);
    }

    candidate.banned = isBlocked;

    await candidate.save();

    await this.userActionLogsService.log({
      userId: candidate._id,
      actorId,
      actorType: "admin",
      category: "profile",
      action: "profile.status_updated_by_staff",
      title: "User status updated by staff",
      severity: isBlocked ? "warning" : "info",
      metadata: {
        banned: isBlocked,
      },
    });

    return "User status updated";
  }

  async deleteUser(userId: string) {
    const candidate = await this.userModel.findByIdAndDelete(userId);

    return candidate;
  }

  async login(userDto: UserDto) {
    const candidate = await this.userModel.findOne({
      email: userDto.email,
      wallet: userDto.wallet,
      banned: false,
    });

    if (!candidate.role.includes('admin') && !candidate.role.includes('moderator')) {
      throw new UnauthorizedException('Email login disabled')
    }

    if (!candidate) {
      throw new HttpException(
        "User with this email and wallet does not exist",
        HttpStatus.BAD_REQUEST
      );
    }

    const { tokens, user, requires2FA } = await this.authService.login(
      userDto,
      candidate
    );

    return { tokens, user, requires2FA };
  }

  async loginToAdmin(userDto: UserDto) {
    let query = this.userModel.findOne({ email: userDto.email });

    query = query.where("role").in(["admin", "moderator"]);

    const candidate = await query.exec();

    if (!candidate) {
      throw new HttpException(
        "User with this email does not exist",
        HttpStatus.BAD_REQUEST
      );
    }

    const { tokens, user } = await this.authService.login(userDto, candidate);

    return { tokens, user };
  }

  async getUsers(query: { banned: string; active: string }) {
    const options: any = {};

    const banned: boolean = query.banned === "1";
    const active: boolean = query.active === "1";

    if (banned && !active) {
      options.banned = true;
    }

    if (!banned && active) {
      options.banned = false;
    }

    const users = await this.userModel.find(options);

    return users.reverse();
  }

  async getActiveUsers(
    offset: number,
    limit: number = 10,
    boardId: string,
    search?: string
  ): Promise<any> {
    const options: any = {
      banned: false,
      isActive: true,
      email: { $exists: true, $ne: "" },
      wallet: { $exists: true, $ne: "" },
      twitterData: { $exists: true, $ne: null },
      role: ["user"],
    };

    if (boardId !== "none")
      options.invitedBoards = { $nin: [new mongoose.Types.ObjectId(boardId)] };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      options.$or = [
        { username: searchRegex },
        { email: searchRegex },
        { wallet: searchRegex },
        { fomoId: isNaN(Number(search)) ? -1 : Number(search) },
        { "twitterData.username": searchRegex },
      ];
    }

    const [users, total] = await Promise.all([
      this.userModel
        .find(options)
        .select(
          "email name username fomoId photo rating wallet twitterData invitedBoards"
        )
        .skip(offset)
        .limit(limit),
      this.userModel.countDocuments(options),
    ]);

    return { users, total };
  }

  async getUserByToken(token: string) {
    const user = await this.authService.getDataByToken(token);

    return user;
  }

  async getModerators() {
    const moderators = await this.userModel.aggregate([
      {
        $match: {
          role: { $in: ["moderator"] },
        },
      },
      {
        $lookup: {
          from: this.actionModel.collection.name,
          localField: "_id",
          foreignField: "user",
          as: "actions",
        },
      },
    ]);

    return moderators.reverse();
  }

  /* ─────────────────────────────────────────────────────────────
   * Admin › Settings › Administrators & Moderators
   * Unified moderator management: list with stats, detail, CRUD, tasks.
   * ───────────────────────────────────────────────────────────── */

  private mapModeratorBase(u: any) {
    const wallet = u?.wallet && !String(u.wallet).startsWith("n/a-") ? u.wallet : "";
    const roles: string[] = Array.isArray(u?.role) ? u.role : [];
    const primaryRole = roles.includes("admin") ? "admin" : roles.includes("moderator") ? "moderator" : (roles[0] || "user");
    const status = u?.banned ? "blocked" : u?.isActive === false ? "inactive" : "active";
    return {
      _id: String(u._id),
      email: u?.email || "",
      name: u?.name || "",
      username: u?.username || "",
      avatar: u?.photo || u?.twitterData?.photo || "",
      wallet,
      role: primaryRole,
      roles,
      status,
      is2FAEnabled: !!u?.is2FAEnabled,
      lastLogin: u?.lastLogin || null,
      createdAt: u?.createDate || u?._id?.getTimestamp?.() || null,
      openTasks: Array.isArray(u?.moderatorTasks)
        ? u.moderatorTasks.filter((t: any) => t?.status !== "done").length
        : 0,
    };
  }

  private async computeModeratorStats(userId: mongoose.Types.ObjectId, rejectedEntities = 0) {
    const confirmed = await this.actionModel.countDocuments({ moderatorId: userId });
    const rejected = Number(rejectedEntities || 0);
    const totalHandled = confirmed + rejected;
    const approvalRate = totalHandled > 0 ? Math.round((confirmed / totalHandled) * 1000) / 10 : 0;
    return { confirmed, rejected, totalHandled, approvalRate };
  }

  async getModeratorsAdmin(query: { search?: string; role?: string } = {}) {
    const roleFilter = query.role && ["admin", "moderator"].includes(query.role)
      ? [query.role]
      : ["admin", "moderator"];
    const match: any = { role: { $in: roleFilter } };
    if (query.search && query.search.trim()) {
      const rx = new RegExp(query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      match.$or = [{ email: rx }, { name: rx }, { username: rx }, { wallet: rx }];
    }
    const docs = await this.userModel.find(match).lean();

    const rows = await Promise.all(
      docs.map(async (u: any) => {
        const base = this.mapModeratorBase(u);
        const stats = await this.computeModeratorStats(u._id, u.rejectedEntities);
        return { ...base, stats };
      })
    );
    // Sort: admins first, then by totalHandled desc.
    rows.sort((a, b) => {
      if (a.role !== b.role) return a.role === "admin" ? -1 : 1;
      return b.stats.totalHandled - a.stats.totalHandled;
    });

    const moderators = rows.filter((r) => r.role === "moderator");
    const admins = rows.filter((r) => r.role === "admin");
    const pendingQueue = await this.actionModel.countDocuments({ status: "moderator" });
    const totalConfirmed = rows.reduce((s, r) => s + r.stats.confirmed, 0);
    const totalRejected = rows.reduce((s, r) => s + r.stats.rejected, 0);
    const totalHandled = totalConfirmed + totalRejected;

    const overview = {
      totalModerators: moderators.length,
      totalAdmins: admins.length,
      activeModerators: moderators.filter((m) => m.status === "active").length,
      pendingQueue,
      totalHandled,
      totalConfirmed,
      totalRejected,
      approvalRate: totalHandled > 0 ? Math.round((totalConfirmed / totalHandled) * 1000) / 10 : 0,
    };

    return { success: true, data: { rows, moderators, admins, overview } };
  }

  async getModeratorDetailAdmin(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException("Invalid id", HttpStatus.BAD_REQUEST);
    }
    const u: any = await this.userModel.findById(id).lean();
    if (!u) throw new HttpException("Moderator not found", HttpStatus.NOT_FOUND);

    const base = this.mapModeratorBase(u);
    const stats = await this.computeModeratorStats(u._id, u.rejectedEntities);
    const recentActions = await this.actionModel
      .find({ moderatorId: u._id })
      .sort({ date: -1 })
      .limit(20)
      .lean();

    const tasks = (Array.isArray(u.moderatorTasks) ? u.moderatorTasks : [])
      .slice()
      .sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return {
      success: true,
      data: {
        ...base,
        bio: u.bio || "",
        stats,
        tasks,
        recentActions: recentActions.map((a: any) => ({
          _id: String(a._id),
          name: a.name,
          type: a.type,
          category: a.category,
          actionType: a.actionType,
          date: a.date,
        })),
      },
    };
  }

  async createModeratorByAdminUnified(body: any) {
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    if (!email || !password) {
      throw new HttpException("Email and password are required", HttpStatus.BAD_REQUEST);
    }
    const candidate = await this.getUserByEmail(email);
    if (candidate) {
      throw new HttpException("User with this email exists", HttpStatus.BAD_REQUEST);
    }
    const wallet = body?.wallet && String(body.wallet).trim()
      ? String(body.wallet).trim()
      : `n/a-${new mongoose.Types.ObjectId().toString()}`;

    await this.authService.registrationByAdmin({ email, password, wallet } as any, "moderator");
    const update: any = {};
    if (body?.name) update.name = String(body.name).trim();
    if (Object.keys(update).length) {
      await this.userModel.updateOne({ email }, { $set: update });
    }
    const created: any = await this.userModel.findOne({ email }).lean();
    return { success: true, data: { ...this.mapModeratorBase(created), stats: { confirmed: 0, rejected: 0, totalHandled: 0, approvalRate: 0 } } };
  }

  async updateModeratorByAdmin(id: string, body: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException("Invalid id", HttpStatus.BAD_REQUEST);
    }
    const u: any = await this.userModel.findById(id);
    if (!u) throw new HttpException("Moderator not found", HttpStatus.NOT_FOUND);

    const set: any = {};
    if (typeof body?.name === "string") set.name = body.name.trim();
    if (typeof body?.wallet === "string" && body.wallet.trim()) set.wallet = body.wallet.trim();
    if (body?.status === "blocked") { set.banned = true; }
    if (body?.status === "active") { set.banned = false; set.isActive = true; }
    if (body?.status === "inactive") { set.isActive = false; }
    if (body?.role === "admin" || body?.role === "moderator") { set.role = [body.role]; }

    await this.userModel.updateOne({ _id: id }, { $set: set });
    const updated: any = await this.userModel.findById(id).lean();
    const stats = await this.computeModeratorStats(updated._id, updated.rejectedEntities);
    return { success: true, data: { ...this.mapModeratorBase(updated), stats } };
  }

  async deleteModeratorByAdmin(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException("Invalid id", HttpStatus.BAD_REQUEST);
    }
    const u: any = await this.userModel.findById(id).lean();
    if (!u) throw new HttpException("Moderator not found", HttpStatus.NOT_FOUND);
    const roles: string[] = Array.isArray(u.role) ? u.role : [];
    if (!roles.includes("moderator") && !roles.includes("admin")) {
      throw new HttpException("Not a staff account", HttpStatus.BAD_REQUEST);
    }
    await this.userModel.deleteOne({ _id: id });
    return { success: true, data: { _id: id } };
  }

  async addModeratorTask(id: string, body: any, actorId?: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException("Invalid id", HttpStatus.BAD_REQUEST);
    }
    const u = await this.userModel.findById(id);
    if (!u) throw new HttpException("Moderator not found", HttpStatus.NOT_FOUND);
    const task = {
      _id: new mongoose.Types.ObjectId().toString(),
      title: String(body?.title || "").trim(),
      description: String(body?.description || "").trim(),
      priority: ["low", "medium", "high"].includes(body?.priority) ? body.priority : "medium",
      status: "open",
      dueDate: body?.dueDate ? new Date(body.dueDate) : null,
      createdAt: new Date(),
      createdBy: actorId || null,
    };
    if (!task.title) throw new HttpException("Task title is required", HttpStatus.BAD_REQUEST);
    await this.userModel.updateOne({ _id: id }, { $push: { moderatorTasks: task } });
    return { success: true, data: task };
  }

  async updateModeratorTask(id: string, taskId: string, body: any) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException("Invalid id", HttpStatus.BAD_REQUEST);
    }
    const u: any = await this.userModel.findById(id);
    if (!u) throw new HttpException("Moderator not found", HttpStatus.NOT_FOUND);
    const tasks: any[] = Array.isArray(u.moderatorTasks) ? u.moderatorTasks : [];
    const idx = tasks.findIndex((t) => String(t._id) === String(taskId));
    if (idx === -1) throw new HttpException("Task not found", HttpStatus.NOT_FOUND);
    if (body?.status && ["open", "in_progress", "done"].includes(body.status)) tasks[idx].status = body.status;
    if (typeof body?.title === "string") tasks[idx].title = body.title.trim();
    if (typeof body?.description === "string") tasks[idx].description = body.description.trim();
    if (["low", "medium", "high"].includes(body?.priority)) tasks[idx].priority = body.priority;
    if (body?.dueDate !== undefined) tasks[idx].dueDate = body.dueDate ? new Date(body.dueDate) : null;
    u.moderatorTasks = tasks;
    u.markModified("moderatorTasks");
    await u.save();
    return { success: true, data: tasks[idx] };
  }

  async deleteModeratorTask(id: string, taskId: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new HttpException("Invalid id", HttpStatus.BAD_REQUEST);
    }
    await this.userModel.updateOne({ _id: id }, { $pull: { moderatorTasks: { _id: taskId } } });
    return { success: true, data: { _id: taskId } };
  }

  async getUser(id: string): Promise<UpdateUserDto> {
    const user: Array<any> = await this.userModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: this.projectModel.collection.name,
          localField: "projects",
          foreignField: "_id",
          as: "projects",
        },
      },
    ]);

    return user[0];
  }

  async getUserByEmail(email: string) {
    const user = this.userModel.findOne({ email });

    return user;
  }

  async refresh(token: string) {
    const id = this.authService.checkJwtToken(token, "refresh");

    const candidate = await this.userModel.findById(id);

    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      candidate
    );

    await candidate.save();

    return { accessToken, refreshToken, id, user: candidate };
  }

  async refreshByAccess(token: string) {
    const id = this.authService.checkJwtToken(token, "access");

    const candidate = await this.userModel.findById(id);

    const { accessToken, refreshToken } = await this.authService.refreshTokens(
      candidate
    );

    await candidate.save();

    return { accessToken, refreshToken, id, user: candidate };
  }

  async logout(token: string) {
    const id = this.authService.checkJwtToken(token);

    const candidate = await this.userModel.findById(id);

    await candidate.save();

    return true;
  }

  async changePassword(token: string, passwords: ChangePasswordDto) {
    const id = this.authService.checkJwtToken(token);

    const candidate = await this.userModel.findById(id);

    const newPassword = await this.authService.changePassword(
      passwords,
      candidate.password
    );

    candidate.password = newPassword;

    await candidate.save();

    await this.userActionLogsService.log({
      userId: candidate._id,
      actorId: candidate._id,
      actorType: "user",
      category: "auth",
      action: "auth.password_changed",
      title: "Password changed",
    });

    return { user: candidate };
  }

  async changeEmail(userId: string, email: string) {
    const candidate = await this.userModel.findById(userId);

    const isEmailExist = await this.userModel.findOne({ email });

    if (isEmailExist)
      throw new HttpException(
        `User with email ${email} exist`,
        HttpStatus.BAD_REQUEST
      );

    if (!candidate)
      throw new HttpException("User not found", HttpStatus.BAD_REQUEST);

    await this.emailService.sendChangeMail(email, candidate.email, candidate);

    await this.userActionLogsService.log({
      userId: candidate._id,
      actorId: candidate._id,
      actorType: "user",
      category: "profile",
      action: "profile.email_change_requested",
      title: "Email change requested",
      metadata: {
        previousEmail: candidate.email,
        nextEmail: email,
      },
    });

    return { user: candidate };
  }

  async confirmChange(
    newEmail: string,
    oldEmail: string,
    code: string
  ): Promise<boolean> {
    const candidate: User = await this.userModel.findOneAndUpdate(
      { email: oldEmail, code },
      { email: newEmail }
    );

    return !!candidate;
  }

  async changePoints(users: Array<string>, points: number): Promise<string> {
    for (let index = 0; index < users.length; index++) {
      const id = users[index];

      const user = await this.userModel.findById(id);

      const newPointsValue = Number(user.points)
        ? Number(user.points) + points
        : points;

      user.points = newPointsValue;

      user.status = this.calculateUserStatus(newPointsValue);

      await user.save();
    }

    return "Users reward updated";
  }

  async inviteModeratorByAdmin(moderator: InviteModeratorDto) {
    const candidate = await this.getUserByEmail(moderator.email);

    if (candidate) {
      throw new HttpException(
        "User with this email exists",
        HttpStatus.BAD_REQUEST
      );
    }

    await this.authService.registrationByAdmin(moderator, "moderator");

    return "Moderator created";
  }

  async addPoolProject(
    userId: string,
    projectId: string,
    actionType: "investedProjects" | "claimedProjects"
  ): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(userId, {
      $push: {
        [actionType]: new mongoose.Types.ObjectId(projectId),
      },
    });

    await this.userActionLogsService.log({
      userId,
      actorId: userId,
      actorType: "user",
      category: "profile",
      action: "profile.project_pool_updated",
      title: "Project pool updated",
      entityType: "project",
      entityId: projectId,
      metadata: {
        actionType,
      },
    });

    return user;
  }

  calculateUserStatus(points: number): UserRating {
    switch (true) {
      case points <= 1000:
        return UserRating.birth;
      case points <= 5000:
        return UserRating.journey_start;
      case points <= 10000:
        return UserRating.nft_master;
      case points <= 25000:
        return UserRating.elemental_master;
      case points <= 50000:
        return UserRating.sensei;
      case points <= 100000:
        return UserRating.enlighment;
      default:
        return UserRating.birth;
    }
  }

  async addLike(itemId: string, userId: string): Promise<User> {
    const item = await this.userModel.findById(itemId).exec();
    const uId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(userId);

    if (item.likes.includes(uId)) {
      return this.userModel
        .findByIdAndUpdate(itemId, { $pull: { likes: uId } }, { new: true })
        .exec();
    }

    return this.userModel
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

  async addDislike(itemId: string, userId: string): Promise<User> {
    const item = await this.userModel.findById(itemId).exec();
    const uId: mongoose.Types.ObjectId = new mongoose.Types.ObjectId(userId);

    if (item.dislikes.includes(uId)) {
      return this.userModel
        .findByIdAndUpdate(itemId, { $pull: { dislikes: uId } }, { new: true })
        .exec();
    }

    return this.userModel
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

  async addToPortfolio(
    userId: mongoose.Types.ObjectId,
    itemId: mongoose.Types.ObjectId
  ): Promise<{ isSuccess: boolean }> {
    await this.userModel.findByIdAndUpdate(userId, {
      $push: { portfolio: new mongoose.Types.ObjectId(itemId) },
    });

    return { isSuccess: true };
  }

  async getPublicFollowing(
    userId: string,
    query?: { offset?: number | string; limit?: number | string }
  ): Promise<{
    items: Array<{
      _id: string;
      name: string;
      username: string;
      photo: string;
      avatar: string;
      bio: string;
      followersCount: number;
      followingCount: number;
      rating: number;
      rank: string;
      verificationStatus: boolean;
      twitterData: Record<string, any> | null;
      twitterName: string;
      twitterUsername: string;
      profileLink: string;
    }>;
    total: number;
    offset: number;
    limit: number;
  }> {
    const offset = Math.max(Number(query?.offset || 0), 0);
    const limit = Math.min(Math.max(Number(query?.limit || 12), 1), 50);

    const user = await this.userModel
      .findById(userId)
      .select("following")
      .lean();

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const followingIds = (user.following || [])
      .map((id) => id.toString())
      .reverse();
    const pagedIds = followingIds.slice(offset, offset + limit);

    if (!pagedIds.length) {
      return {
        items: [],
        total: followingIds.length,
        offset,
        limit,
      };
    }

    const users = await this.userModel
      .find({
        _id: {
          $in: pagedIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
      })
      .select(
        "_id name username photo bio followers following rating rank verificationStatus twitterData"
      )
      .lean();

    const usersById = new Map(
      users.map((item: any) => [item._id.toString(), item])
    );

    const items = pagedIds
      .map((id) => usersById.get(id))
      .filter(Boolean)
      .map((item: any) => ({
        _id: item._id.toString(),
        name: item.name || item.twitterData?.name || item.username || "Unnamed user",
        username: item.username || "",
        photo: item.photo || "",
        avatar: item.photo || item.twitterData?.photo || "",
        bio: item.bio || "",
        followersCount: Array.isArray(item.followers) ? item.followers.length : 0,
        followingCount: Array.isArray(item.following) ? item.following.length : 0,
        rating: Number(item.rating || 0),
        rank: item.rank || "",
        verificationStatus: Boolean(item.verificationStatus),
        twitterData: item.twitterData || null,
        twitterName: item.twitterData?.name || "",
        twitterUsername: item.twitterData?.username || "",
        profileLink: `/crypto/fomies/${item._id.toString()}`,
      }));

    return {
      items,
      total: followingIds.length,
      offset,
      limit,
    };
  }

  async followUser(followerId: string, followingId: string, sourceTopicId?: string): Promise<string> {
    if (followerId === followingId) {
      throw new BadRequestException("You cannot follow yourself");
    }

    const follower = await this.userModel.findById(followerId);
    const following = await this.userModel.findById(followingId);

    if (!follower || !following) {
      throw new NotFoundException("User not found");
    }

    if (follower.following.includes(following._id)) return await this.unfollowUser(followerId, followingId);

    follower.following.push(following._id);
    following.followers.push(follower._id);

    await follower.save();
    await following.save();

    // Follow → content attribution: if the follow originated from one of the
    // followed author's topics, record it so `followersFromContent` in the
    // influence read-model reflects real, attributable growth.
    if (sourceTopicId && /^[a-f\d]{24}$/i.test(String(sourceTopicId))) {
      await this.commentModel
        .updateOne(
          { _id: sourceTopicId, isTopic: true, author: following._id },
          { $addToSet: { followsFromContent: follower._id } }
        )
        .catch(() => undefined);
    }

    return "Success!";
  }

  async unfollowUser(followerId: string, followingId: string): Promise<string> {
    const follower = await this.userModel.findById(followerId);
    const following = await this.userModel.findById(followingId);

    if (!follower || !following) {
      throw new NotFoundException("User not found");
    }

    follower.following = follower.following.filter(
      (id) => id.toString() !== followingId
    );

    following.followers = following.followers.filter(
      (id) => id.toString() !== followerId
    );

    await follower.save();
    await following.save();

    // Drop any content-follow attribution for this pair (across the author's topics).
    await this.commentModel
      .updateMany(
        { isTopic: true, author: following._id },
        { $pull: { followsFromContent: follower._id } }
      )
      .catch(() => undefined);

    return "Success!";
  }

  async blockUser(userId: string, blockedUserId: string): Promise<{ success: boolean; message: string }> {
    if (userId === blockedUserId) {
      throw new BadRequestException("You cannot block yourself");
    }

    const user = await this.userModel.findById(userId);
    const blockedUser = await this.userModel.findById(blockedUserId);

    if (!user || !blockedUser) {
      throw new NotFoundException("User not found");
    }

    if (user.blockedUsers.some(id => id.toString() === blockedUserId)) {
      throw new BadRequestException("User is already blocked");
    }

    user.blockedUsers.push(new mongoose.Types.ObjectId(blockedUserId));
    await user.save();

    return { success: true, message: "User blocked successfully" };
  }

  async unblockUser(userId: string, blockedUserId: string): Promise<{ success: boolean; message: string }> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException("User not found");
    }

    user.blockedUsers = user.blockedUsers.filter(
      (id) => id.toString() !== blockedUserId
    );

    await user.save();

    return { success: true, message: "User unblocked successfully" };
  }

  async isUserBlocked(userId: string, targetUserId: string): Promise<boolean> {
    const user = await this.userModel.findById(userId).select('blockedUsers');

    if (!user) {
      return false;
    }

    return user.blockedUsers.some(id => id.toString() === targetUserId);
  }

  private normalizeLeaderboardRange(
    range?: string
  ): "24H" | "7D" | "30D" | "90D" | "1Y" | "ALL" {
    const normalized = String(range || "24H").toUpperCase();

    if (
      normalized === "24H" ||
      normalized === "7D" ||
      normalized === "30D" ||
      normalized === "90D" ||
      normalized === "1Y" ||
      normalized === "ALL"
    ) {
      return normalized;
    }

    return "24H";
  }

  private normalizeLeaderboardSort(sortBy?: string): "ROI" | "XP" {
    return String(sortBy || "ROI").toUpperCase() === "XP" ? "XP" : "ROI";
  }

  private parseObjectIdList(value?: string): mongoose.Types.ObjectId[] {
    const parts = String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const uniqueIds = Array.from(new Set(parts));

    return uniqueIds
      .filter((item) => mongoose.Types.ObjectId.isValid(item))
      .map((item) => new mongoose.Types.ObjectId(item));
  }

  private getLeaderboardRoiExpression(
    range: "24H" | "7D" | "30D" | "90D" | "1Y" | "ALL"
  ) {
    if (range === "ALL") {
      return { $ifNull: ["$publicPortfolio.profitPercent", null] };
    }

    if (range === "24H") {
      return { $ifNull: ["$publicPortfolio.performance24h.usd", null] };
    }

    if (range === "7D") {
      return { $ifNull: ["$publicPortfolio.performance7d.usd", null] };
    }

    if (range === "30D") {
      return { $ifNull: ["$publicPortfolio.performance30d.usd", null] };
    }

    if (range === "90D") {
      return { $ifNull: ["$publicPortfolio.performance90d.usd", null] };
    }

    return { $ifNull: ["$publicPortfolio.performance1y.usd", null] };
  }
}
