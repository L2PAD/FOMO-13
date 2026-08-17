// src/portfolio/portfolio.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import mongoose, { ClientSession, Connection, Model } from "mongoose";
import {
  Transaction,
  TransactionDocument,
  Portfolio,
  PortfolioAsset,
  PortfolioCalculatedAsset,
  PortfolioDocument,
  ShareTypes,
} from "./model/portfolio.model";
import { CreatePortfolioDto } from "./dto/create-portfolio.dto";
import { AddAssetDto } from "./dto/add-asset.dto";
import { UpdateAssetDto } from "./dto/update-asset.dto";
import { QueryBattleBoardDto } from "./dto/query-battle-board.dto";
import {
  PublicPortfolioMoversDirection,
  PublicPortfolioMoversRange,
  QueryPublicPortfolioMoversDto,
} from "./dto/query-public-portfolio-movers.dto";
import {
  PortfolioRoiCompareRange,
  QueryPortfolioRoiCompareDto,
} from "./dto/query-portfolio-roi-compare.dto";
import { FilesService } from "../files/files.service";
import { ChartTypes } from "src/analytics/models/chart.model";
import { User, UserDocument } from "src/user/user.model";
import { PortfolioAutoRecalcService } from "./portfolio-auto-recalc.service";
import { PortfolioRecalculationService } from "./portfolio-recalculation.service";
import { PortfolioRecalculationQueueService } from "./portfolio-recalculation-queue.service";
import { FomoV2MarketProjectReadModel } from "src/fomo-v2/models";
import { UserActionLogsService } from "src/user-action-logs/user-action-logs.service";

const PUBLIC_PORTFOLIO_SEARCH_DEFAULT_LIMIT = 12;
const PUBLIC_PORTFOLIO_SEARCH_MAX_LIMIT = 20;
const PUBLIC_PORTFOLIO_SEARCH_MIN_QUERY_LENGTH = 2;
const PUBLIC_PORTFOLIO_SEARCH_MAX_QUERY_LENGTH = 80;
const PUBLIC_PORTFOLIO_MOVERS_DEFAULT_LIMIT = 10;
const PUBLIC_PORTFOLIO_MOVERS_MAX_LIMIT = 20;
const PORTFOLIO_STATS_CHART_BUCKET_MS: Record<ChartTypes, number> = {
  chart24h: 10 * 60 * 1000,
  chart7d: 60 * 60 * 1000,
  chart30d: 60 * 60 * 1000,
  chart90d: 60 * 60 * 1000,
  chart1y: 24 * 60 * 60 * 1000,
  chartAll: 24 * 60 * 60 * 1000,
};

interface PublicPortfolioSearchOwner {
  id?: string;
  displayName: string;
  username?: string;
  avatar?: string;
  fomoId?: number;
}

interface FreshPortfolioDocumentResult {
  portfolio: PortfolioDocument;
  isFresh: boolean;
}

interface PublicPortfolioSearchItem {
  id: string;
  name: string;
  description?: string;
  shareCode: string;
  logo?: string;
  updatedAt?: Date;
  totalBalance: number;
  profitPercent: number;
  owner: PublicPortfolioSearchOwner;
}

interface PublicPortfolioSearchResponse {
  query: string;
  items: PublicPortfolioSearchItem[];
}

export interface PublicPortfolioMoverItem {
  portfolioId: string;
  portfolioName: string;
  shareCode: string;
  totalBalance: number;
  performanceValue: number;
  owner: PublicPortfolioSearchOwner;
}

export interface PublicPortfolioMoversResponse {
  items: PublicPortfolioMoverItem[];
  range: PublicPortfolioMoversRange;
  direction: PublicPortfolioMoversDirection;
  limit: number;
}

export interface BattleBoardItem {
  portfolioId: string;
  portfolioName: string;
  owner: {
    userId: string;
    name: string;
    username: string;
    photo: string;
    twitterData: Record<string, any> | null;
    verificationStatus: boolean;
  };
  metrics: {
    roi30d: number | null;
    currentBalance: number | null;
    change24h: number | null;
    volatility: null;
    riskLevel: null;
  };
}

export interface BattleBoardResponse {
  items: BattleBoardItem[];
  total: number;
  offset: number;
  limit: number;
}

export interface PortfolioRoiComparePoint {
  date: Date;
  roi: number | null;
  totalBalance: number | null;
}

export interface PortfolioRoiCompareItem {
  userId: string;
  portfolioId: string | null;
  hasPublicPortfolio: boolean;
  owner: {
    name: string;
    username: string;
    photo: string;
    twitterData: Record<string, any> | null;
  };
  portfolio: {
    portfolioName: string | null;
    currentBalance: number | null;
    allTimeRoi: number | null;
    change24h: number | null;
    roi24h: number | null;
    roi7d: number | null;
    roi30d: number | null;
    roi90d: number | null;
    roi1y: number | null;
    topHeldToken: string | null;
  };
  chart: {
    points: PortfolioRoiComparePoint[];
    hasHistory: boolean;
    hasBaseline: boolean;
  };
}

export interface PortfolioRoiCompareResponse {
  items: PortfolioRoiCompareItem[];
}

@Injectable()
export class PortfolioService {
  private readonly oneHourChartBaselineToleranceMinutes = Number(
    process.env.PORTFOLIO_1H_BASELINE_TOLERANCE_MINUTES || 10
  );

  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @InjectModel(Portfolio.name)
    private portfolioModel: Model<PortfolioDocument>,
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly marketReadModel: Model<FomoV2MarketProjectReadModel>,
    @InjectModel(Transaction.name)
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly filesService: FilesService,
    private readonly portfolioAutoRecalcService: PortfolioAutoRecalcService,
    private readonly portfolioRecalculationService: PortfolioRecalculationService,
    private readonly portfolioQueueService: PortfolioRecalculationQueueService,
    private readonly userActionLogsService: UserActionLogsService
  ) {}

  private async createTransactionFromAsset(
    portfolioId: mongoose.Types.ObjectId,
    asset: PortfolioAsset,
    session?: ClientSession
  ): Promise<Transaction> {
    const gainLoss = asset.profit || 0;
    const gainLossPercent = asset.profitPercent || 0;

    const created = await this.transactionModel.create([{
      portfolioId,
      projectId: asset.marketAssetId || asset.projectId,
      marketAssetId: asset.marketAssetId || asset.projectId,
      canonicalProjectId: asset.canonicalProjectId,
      type: asset.type,
      quantity: asset.amount,
      currency: asset.currency,
      price: asset.price,
      priceCurrency: asset.priceCurrency,
      total: asset.totalPrice,
      gainLoss,
      gainLossPercent,
      date: asset.date,
      note: asset.note,
      feeType: asset.feeType,
      feeAmount: (asset as any).feeAmount || 0,
      portfolioAssetId: (asset as any)._id,
    }], { session });

    return created[0];
  }

  private calculateCurrentPosition(
    assets: PortfolioAsset[],
    projectId: string
  ): number {
    let position = 0;

    assets.forEach((asset) => {
      if (this.getPortfolioAssetIdentity(asset) === projectId) {
        if (asset.type === "buy") {
          position += asset.amount;
        } else if (asset.type === "sell") {
          position -= asset.amount;
        }
      }
    });

    return position;
  }

  private async runPortfolioWriteTransaction<T>(
    operation: (session?: ClientSession) => Promise<T>
  ): Promise<T> {
    if (process.env.PORTFOLIO_WRITE_TRANSACTIONS_ENABLED !== "true") {
      return operation();
    }

    const session = await this.connection.startSession();

    try {
      let result: T;
      await session.withTransaction(async () => {
        result = await operation(session);
      });

      return result!;
    } finally {
      await session.endSession();
    }
  }

  private parsePortfolioTransactionDate(value: string | Date): Date {
    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException("Invalid transaction date");
    }

    if (date.getTime() > Date.now()) {
      throw new BadRequestException("Transaction date cannot be in the future");
    }

    return date;
  }

  private toObjectIds(values: string[], message: string): mongoose.Types.ObjectId[] {
    if (!Array.isArray(values) || !values.length) {
      throw new BadRequestException(message);
    }

    return values.map((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new BadRequestException(message);
      }

      return new mongoose.Types.ObjectId(value);
    });
  }

  private async getLedgerTransactionsForAsset(
    portfolioId: mongoose.Types.ObjectId,
    marketAssetId: mongoose.Types.ObjectId,
    session?: ClientSession
  ): Promise<any[]> {
    const query = this.transactionModel
      .find({
        portfolioId,
        $or: [{ marketAssetId }, { projectId: marketAssetId }],
      })
      .lean();

    if (session) query.session(session);

    return query.exec();
  }

  private calculateCurrentPositionFromTransactions(transactions: any[]): number {
    return (transactions || []).reduce((position, tx: any) => {
      if (tx.type === "buy") return position + Number(tx.quantity || 0);
      if (tx.type === "sell") return position - Number(tx.quantity || 0);
      return position;
    }, 0);
  }

  private async generateUniqueCode(): Promise<string> {
    let portfolioCode: number;
    let isUnique: boolean = false;

    while (!isUnique) {
      portfolioCode = Math.floor(100000 + Math.random() * 900000);

      const existingCode = await this.portfolioModel
        .findOne({ code: portfolioCode.toString() })
        .exec();
      if (!existingCode) {
        isUnique = true;
      }
    }

    return String(portfolioCode);
  }

  async create(dto: CreatePortfolioDto, userId: string) {
    const exists = await this.portfolioModel.findOne({
      creator: new mongoose.Types.ObjectId(userId),
      name: dto.name.trim(),
    });

    if (exists) {
      throw new BadRequestException("Portfolio with this name already exists");
    }

    const logo = dto.logo ? await this.filesService.writeBase64File(dto.logo) : "";
    const code = await this.generateUniqueCode();

    const portfolio = await this.portfolioModel.create({
      ...dto,
      name: dto.name.trim(),
      logo,
      creator: new mongoose.Types.ObjectId(userId),
      code,
    });

    await this.portfolioRecalculationService.initializeEmptyPortfolio(
      portfolio._id.toString()
    );

    await this.userActionLogsService.log({
      userId,
      actorId: userId,
      actorType: "user",
      category: "portfolio",
      action: "portfolio.created",
      title: "Portfolio created",
      entityType: "portfolio",
      entityId: portfolio._id,
      metadata: {
        name: portfolio.name,
        code: portfolio.code,
        isBattle: portfolio.isBattle,
        isShare: portfolio.isShare,
      },
    });

    return portfolio;
  }

  async update(id: string, dto: CreatePortfolioDto, userId: string) {
    const portfolio = await this.portfolioModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      creator: new mongoose.Types.ObjectId(userId),
    });

    if (!portfolio) {
      throw new NotFoundException("Portfolio not found");
    }

    if (dto.name) {
      const exists = await this.portfolioModel.findOne({
        creator: new mongoose.Types.ObjectId(userId),
        name: dto.name.trim(),
        _id: { $ne: new mongoose.Types.ObjectId(id) },
      });

      if (exists) {
        throw new BadRequestException(
          "You already have a portfolio with this name"
        );
      }
    }

    let logo = portfolio.logo;

    if (dto.logo && dto.logo !== portfolio.logo) {
      logo = await this.filesService.writeBase64File(dto.logo);
    }

    const updated = await this.portfolioModel.findByIdAndUpdate(
      id,
      {
        ...dto,
        name: dto.name?.trim() ?? portfolio.name,
        logo,
      },
      { new: true }
    );

    await this.userActionLogsService.log({
      userId,
      actorId: userId,
      actorType: "user",
      category: "portfolio",
      action: "portfolio.updated",
      title: "Portfolio updated",
      entityType: "portfolio",
      entityId: updated?._id || id,
      metadata: {
        name: updated?.name,
        changedFields: Object.keys(dto || {}),
      },
    });

    return updated;
  }

  async getUserPortfolios(userId: string) {
    if (this.portfolioAutoRecalcService.isAutoRecalcEnabled()) {
      await this.portfolioRecalculationService.markUserPortfoliosViewed(userId);
      await this.portfolioQueueService.enqueueActivePortfoliosBatch({
        userId,
        reason: "stale-on-read",
        priority: 2,
      });
    } else {
      this.portfolioAutoRecalcService.logAutoRecalcSkipped(
        "read-user-portfolios",
        `context=list user=${userId} reason=stale-on-read`
      );
    }

    return this.portfolioModel.aggregate([
      { $match: { creator: new mongoose.Types.ObjectId(userId) } },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          isAssets: {
            $cond: {
              if: { $gt: [{ $size: "$assets" }, 0] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          description: 1,
          code: 1,
          logo: 1,
          isBattle: 1,
          isShare: 1,
          shareType: 1,
          totalBalance: 1,
          profit: 1,
          profitPercent: 1,
          totalInvested: 1,
          performance1h: 1,
          isAssets: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);
  }

  async getBattleBoard(
    query?: QueryBattleBoardDto
  ): Promise<BattleBoardResponse> {
    const offset = Math.max(Number(query?.offset || 0), 0);
    const limit = Math.min(Math.max(Number(query?.limit || 12), 1), 100);
    const search = String(query?.search || "").trim();
    const sortBy = query?.sortBy || "ROI_30D";
    const sortOrder = query?.sortOrder === "asc" ? 1 : -1;
    const escapedSearch = search ? this.escapeRegex(search) : "";
    const searchRegex = escapedSearch ? new RegExp(escapedSearch, "i") : null;

    const sortFieldMap: Record<string, string> = {
      ROI_30D: "metrics.roi30d",
      BALANCE: "metrics.currentBalance",
      CHANGE_24H: "metrics.change24h",
    };
    const sortField = sortFieldMap[sortBy] || sortFieldMap.ROI_30D;

    const pipeline: any[] = [
      {
        $match: {
          isBattle: true,
        },
      },
      {
        $lookup: {
          from: this.userModel.collection.name,
          localField: "creator",
          foreignField: "_id",
          as: "ownerData",
        },
      },
      {
        $unwind: {
          path: "$ownerData",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (searchRegex) {
      pipeline.push({
        $match: {
          $or: [
            { name: searchRegex },
            { "ownerData.name": searchRegex },
            { "ownerData.username": searchRegex },
            { "ownerData.twitterData.name": searchRegex },
            { "ownerData.twitterData.username": searchRegex },
          ],
        },
      });
    }

    pipeline.push(
      {
        $project: {
          _id: 0,
          portfolioId: { $toString: "$_id" },
          portfolioName: { $ifNull: ["$name", "Unnamed portfolio"] },
          owner: {
            userId: {
              $cond: [
                { $ne: ["$ownerData._id", null] },
                { $toString: "$ownerData._id" },
                "",
              ],
            },
            name: {
              $ifNull: [
                "$ownerData.name",
                { $ifNull: ["$ownerData.twitterData.name", "Unnamed user"] },
              ],
            },
            username: {
              $ifNull: [
                "$ownerData.username",
                { $ifNull: ["$ownerData.twitterData.username", ""] },
              ],
            },
            photo: {
              $ifNull: [
                "$ownerData.photo",
                { $ifNull: ["$ownerData.twitterData.photo", ""] },
              ],
            },
            twitterData: { $ifNull: ["$ownerData.twitterData", null] },
            verificationStatus: { $ifNull: ["$ownerData.verificationStatus", false] },
          },
          metrics: {
            roi30d: { $ifNull: ["$performance30d.usd", null] },
            currentBalance: { $ifNull: ["$totalBalance", null] },
            change24h: { $ifNull: ["$performance24h.usd", null] },
            volatility: { $literal: null },
            riskLevel: { $literal: null },
          },
        },
      },
      {
        $addFields: {
          sortValue: {
            $ifNull: [`$${sortField}`, null],
          },
        },
      },
      {
        $sort: {
          sortValue: sortOrder,
          portfolioName: 1,
          portfolioId: 1,
        },
      },
      {
        $facet: {
          items: [{ $skip: offset }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      }
    );

    const result = await this.portfolioModel.aggregate(pipeline).exec();
    const root = result[0] || {};

    return {
      items: Array.isArray(root.items)
        ? root.items.map((item: any) => ({
            ...item,
            sortValue: undefined,
          }))
        : [],
      total: Number(root?.totalCount?.[0]?.count || 0),
      offset,
      limit,
    };
  }

  async getPublicPortfolioRoiCompare(
    query: QueryPortfolioRoiCompareDto
  ): Promise<PortfolioRoiCompareResponse> {
    const requestedUserIds = String(query?.userIds || "")
      .split(",")
      .map((item) => item.trim())
      .filter((item) => mongoose.Types.ObjectId.isValid(item))
      .filter((item, index, array) => array.indexOf(item) === index)
      .slice(0, 5);
    const range = query?.range || "30D";

    if (!requestedUserIds.length) {
      return { items: [] };
    }

    const users = await this.userModel
      .aggregate<any>([
        {
          $match: {
            _id: {
              $in: requestedUserIds.map(
                (item) => new mongoose.Types.ObjectId(item)
              ),
            },
          },
        },
        {
          $lookup: {
            from: this.portfolioModel.collection.name,
            let: { userId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$creator", "$$userId"] },
                      { $eq: ["$isShare", true] },
                      { $eq: ["$shareType", "public"] },
                    ],
                  },
                },
              },
              {
                $sort: {
                  updatedAt: -1,
                  createdAt: -1,
                },
              },
              {
                $limit: 1,
              },
              {
                $project: {
                  _id: 1,
                  name: 1,
                  totalBalance: 1,
                  profitPercent: 1,
                  performance24h: 1,
                  performance7d: 1,
                  performance30d: 1,
                  performance90d: 1,
                  performance1y: 1,
                  calculatedAssets: 1,
                  history: 1,
                },
              },
            ],
            as: "publicPortfolio",
          },
        },
        {
          $addFields: {
            publicPortfolio: { $arrayElemAt: ["$publicPortfolio", 0] },
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            username: 1,
            photo: 1,
            twitterData: 1,
            publicPortfolio: 1,
          },
        },
      ])
      .exec();

    const usersById = new Map(
      users.map((item: any) => [String(item._id), item])
    );

    return {
      items: requestedUserIds.map((userId) => {
        const user = usersById.get(userId);
        const publicPortfolio = user?.publicPortfolio || null;
        const rangeMetrics = publicPortfolio
          ? this.buildPortfolioRoiRangeMetrics(publicPortfolio)
          : null;
        const chart = publicPortfolio
          ? this.buildPortfolioRoiChart(publicPortfolio, range)
          : { points: [], hasHistory: false, hasBaseline: false };

        return {
          userId,
          portfolioId: publicPortfolio?._id ? String(publicPortfolio._id) : null,
          hasPublicPortfolio: Boolean(publicPortfolio?._id),
          owner: {
            name:
              this.getFirstNonEmptyString(
                user?.name,
                user?.twitterData?.name
              ) || "Unnamed user",
            username:
              this.getFirstNonEmptyString(
                user?.username,
                user?.twitterData?.username
              ) || "",
            photo: this.getPublicUserAvatar(user) || "",
            twitterData: user?.twitterData || null,
          },
          portfolio: {
            portfolioName:
              typeof publicPortfolio?.name === "string" && publicPortfolio.name.trim()
                ? publicPortfolio.name.trim()
                : null,
            currentBalance: publicPortfolio
              ? Number(publicPortfolio.totalBalance || 0)
              : null,
            allTimeRoi: publicPortfolio
              ? Number(publicPortfolio.profitPercent || 0)
              : null,
            change24h: rangeMetrics?.roi24h ?? null,
            roi24h: rangeMetrics?.roi24h ?? null,
            roi7d: rangeMetrics?.roi7d ?? null,
            roi30d: rangeMetrics?.roi30d ?? null,
            roi90d: rangeMetrics?.roi90d ?? null,
            roi1y: rangeMetrics?.roi1y ?? null,
            topHeldToken: publicPortfolio
              ? this.getPortfolioTopHeldToken(publicPortfolio)
              : null,
          },
          chart,
        };
      }),
    };
  }

  async getPublicPortfolioMovers(
    query: QueryPublicPortfolioMoversDto
  ): Promise<PublicPortfolioMoversResponse> {
    const range: PublicPortfolioMoversRange = query?.range === "7D" ? "7D" : "24H";
    const direction: PublicPortfolioMoversDirection =
      query?.direction === "losers" ? "losers" : "gainers";
    const limit = this.clampPublicPortfolioMoversLimit(query?.limit);
    const performanceField = range === "7D" ? "performance7d.usd" : "performance24h.usd";
    const performanceMatch = direction === "losers" ? { $lt: 0 } : { $gt: 0 };

    const items = await this.portfolioModel
      .aggregate<any>([
        {
          $match: {
            isShare: true,
            shareType: "public",
          },
        },
        {
          $addFields: {
            performanceValue: {
              $ifNull: [`$${performanceField}`, null],
            },
          },
        },
        {
          $match: {
            performanceValue: performanceMatch,
          },
        },
        {
          $lookup: {
            from: this.userModel.collection.name,
            localField: "creator",
            foreignField: "_id",
            as: "creatorData",
          },
        },
        {
          $unwind: {
            path: "$creatorData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $project: {
            _id: 1,
            name: 1,
            code: 1,
            totalBalance: 1,
            performanceValue: 1,
            updatedAt: 1,
            history: {
              $map: {
                input: { $ifNull: ["$history", []] },
                as: "historyItem",
                in: {
                  date: "$$historyItem.date",
                  totalBalance: "$$historyItem.totalBalance",
                },
              },
            },
            creator: "$creatorData",
          },
        },
      ])
      .exec();

    const filteredItems = items
      .filter((item) => {
        const performanceValue = Number(item?.performanceValue);

        if (!Number.isFinite(performanceValue) || performanceValue === 0) {
          return false;
        }

        // performance24h / performance7d are range deltas and only valid when a baseline exists.
        return this.hasPortfolioHistoryBaseline(item, range);
      })
      .sort((left, right) => {
        const leftValue = Number(left?.performanceValue || 0);
        const rightValue = Number(right?.performanceValue || 0);

        if (leftValue !== rightValue) {
          return direction === "losers"
            ? leftValue - rightValue
            : rightValue - leftValue;
        }

        return (
          new Date(right?.updatedAt || 0).getTime() -
          new Date(left?.updatedAt || 0).getTime()
        );
      })
      .slice(0, limit)
      .map((item) => this.buildPublicPortfolioMoverItem(item));

    return {
      items: filteredItems,
      range,
      direction,
      limit,
    };
  }

  private async getOwnedPortfolioDocument(
    portfolioId: string,
    userId: string,
    session?: ClientSession
  ): Promise<PortfolioDocument> {
    const query = this.portfolioModel.findOne({
      _id: new mongoose.Types.ObjectId(portfolioId),
      creator: new mongoose.Types.ObjectId(userId),
    });
    if (session) query.session(session);

    const portfolio = await query;

    if (!portfolio) throw new NotFoundException("Portfolio not found");

    return portfolio;
  }

  private async getFreshPortfolioDocument(
    portfolioId: string,
    userId?: string
  ): Promise<PortfolioDocument> {
    const result = await this.getPortfolioDocumentWithFreshness(
      portfolioId,
      userId
    );

    return result.portfolio;
  }

  private async getPortfolioDocumentWithFreshness(
    portfolioId: string,
    userId?: string
  ): Promise<FreshPortfolioDocumentResult> {
    if (!this.portfolioAutoRecalcService.isAutoRecalcEnabled()) {
      this.portfolioAutoRecalcService.logAutoRecalcSkipped(
        "read-portfolio",
        `context=read portfolio=${portfolioId} reason=stale-on-read`
      );
      return {
        portfolio: await this.getPersistedPortfolioDocument(
          portfolioId,
          userId
        ),
        isFresh: false,
      };
    }

    const result =
      await this.portfolioRecalculationService.recalculatePortfolioIfStale(
        portfolioId,
        userId,
        true
      );

    if (result.skippedReason === "locked-or-not-found") {
      await this.portfolioQueueService.enqueuePortfolioRecalculation({
        portfolioId,
        userId,
        reason: "stale-on-read",
        force: false,
        markViewed: true,
        priority: 2,
      });
    }

    const portfolio = await this.getPersistedPortfolioDocument(
      portfolioId,
      userId
    );
    const resultIsFresh =
      result.recalculated === true || result.skippedReason === "fresh";

    return {
      portfolio,
      isFresh: resultIsFresh && this.isPortfolioRecalculationSettled(portfolio),
    };
  }

  private isPortfolioRecalculationSettled(
    portfolio: PortfolioDocument
  ): boolean {
    if (portfolio.needsRecalculation) return false;

    const lastMutationTimestamp = new Date(
      portfolio.lastMutationAt as any
    ).getTime();
    if (!Number.isFinite(lastMutationTimestamp)) return true;

    const lastRecalculatedTimestamp = new Date(
      portfolio.lastRecalculatedAt as any
    ).getTime();
    return (
      Number.isFinite(lastRecalculatedTimestamp) &&
      lastMutationTimestamp <= lastRecalculatedTimestamp
    );
  }

  async getOne(portfolioId: string, userId: string) {
    const portfolio = await this.getFreshPortfolioDocument(portfolioId, userId);
    return this.buildPortfolioResponse(portfolio);
  }

  async searchPublicPortfolios(
    query?: string,
    limit?: number | string
  ): Promise<PublicPortfolioSearchResponse> {
    const normalizedQuery = this.normalizePublicPortfolioSearchQuery(query);

    if (normalizedQuery.length < PUBLIC_PORTFOLIO_SEARCH_MIN_QUERY_LENGTH) {
      return {
        query: normalizedQuery,
        items: [],
      };
    }

    const safeLimit = this.clampPublicPortfolioSearchLimit(limit);
    const escapedQuery = this.escapeRegex(normalizedQuery);
    const prefixRegex = new RegExp(`^${escapedQuery}`, "i");
    const containsRegex = new RegExp(escapedQuery, "i");

    const items = await this.portfolioModel
      .aggregate<any>([
        {
          $match: {
            isShare: true,
            shareType: "public",
          },
        },
        {
          $lookup: {
            from: this.userModel.collection.name,
            localField: "creator",
            foreignField: "_id",
            as: "creatorData",
          },
        },
        {
          $unwind: {
            path: "$creatorData",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $or: [
              { code: containsRegex },
              { name: containsRegex },
              { description: containsRegex },
              { "creatorData.name": containsRegex },
              { "creatorData.username": containsRegex },
            ],
          },
        },
        {
          $addFields: {
            searchRank: {
              $switch: {
                branches: [
                  {
                    case: {
                      $regexMatch: {
                        input: { $ifNull: ["$code", ""] },
                        regex: prefixRegex,
                      },
                    },
                    then: 0,
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: { $ifNull: ["$name", ""] },
                        regex: prefixRegex,
                      },
                    },
                    then: 1,
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: { $ifNull: ["$creatorData.name", ""] },
                        regex: prefixRegex,
                      },
                    },
                    then: 2,
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: { $ifNull: ["$creatorData.username", ""] },
                        regex: prefixRegex,
                      },
                    },
                    then: 3,
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: { $ifNull: ["$description", ""] },
                        regex: prefixRegex,
                      },
                    },
                    then: 4,
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: { $ifNull: ["$code", ""] },
                        regex: containsRegex,
                      },
                    },
                    then: 5,
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: { $ifNull: ["$name", ""] },
                        regex: containsRegex,
                      },
                    },
                    then: 6,
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: { $ifNull: ["$creatorData.name", ""] },
                        regex: containsRegex,
                      },
                    },
                    then: 7,
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: { $ifNull: ["$creatorData.username", ""] },
                        regex: containsRegex,
                      },
                    },
                    then: 8,
                  },
                  {
                    case: {
                      $regexMatch: {
                        input: { $ifNull: ["$description", ""] },
                        regex: containsRegex,
                      },
                    },
                    then: 9,
                  },
                ],
                default: 99,
              },
            },
          },
        },
        {
          $sort: {
            searchRank: 1,
            updatedAt: -1,
            name: 1,
          },
        },
        { $limit: safeLimit },
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            code: 1,
            logo: 1,
            totalBalance: 1,
            profitPercent: 1,
            updatedAt: 1,
            creator: {
              _id: "$creatorData._id",
              name: "$creatorData.name",
              username: "$creatorData.username",
              photo: "$creatorData.photo",
              avatar: "$creatorData.avatar",
              twitterData: "$creatorData.twitterData",
              fomoId: "$creatorData.fomoId",
            },
          },
        },
      ])
      .exec();

    return {
      query: normalizedQuery,
      items: items.map((item) => this.buildPublicPortfolioSearchItem(item)),
    };
  }

  async delete(portfolioId: string, userId: string) {
    const result = await this.runPortfolioWriteTransaction(async (session) => {
      const deleteQuery = this.portfolioModel.findOneAndDelete({
          _id: new mongoose.Types.ObjectId(portfolioId),
          creator: new mongoose.Types.ObjectId(userId),
      });
      if (session) deleteQuery.session(session);

      const deletedPortfolio = await deleteQuery;

      if (!deletedPortfolio) throw new NotFoundException("Portfolio not found");

      await this.transactionModel.deleteMany(
        { portfolioId: deletedPortfolio._id },
        { session },
      );

      return deletedPortfolio;
    });

    await this.userActionLogsService.log({
      userId,
      actorId: userId,
      actorType: "user",
      category: "portfolio",
      action: "portfolio.deleted",
      title: "Portfolio deleted",
      entityType: "portfolio",
      entityId: result._id,
      metadata: {
        name: result.name,
        code: result.code,
      },
    });

    return true;
  }

  async addAsset(
    portfolioId: string | undefined,
    dto: AddAssetDto,
    userId: string
  ) {
    const transactionDate = this.parsePortfolioTransactionDate(dto.date);

    const marketAsset = await this.findMarketAssetForPortfolio(dto);
    const marketAssetId = new mongoose.Types.ObjectId(
      marketAsset.marketAssetId.toString()
    );
    const marketAssetIdString = marketAssetId.toString();
    const canonicalProjectId = marketAsset.canonicalProjectId
      ? new mongoose.Types.ObjectId(marketAsset.canonicalProjectId.toString())
      : undefined;

    const writeResult = await this.runPortfolioWriteTransaction(async (session) => {
      let portfolio: PortfolioDocument | null;

      if (portfolioId && portfolioId !== "undefined") {
        portfolio = await this.getOwnedPortfolioDocument(portfolioId, userId, session);
      } else {
        const query = this.portfolioModel
          .findOne({ creator: new mongoose.Types.ObjectId(userId) })
          .sort({ createdAt: -1 });
        if (session) query.session(session);

        portfolio = await query.exec();
      }

      if (!portfolio) {
        throw new NotFoundException("Portfolio not found");
      }

      if (dto.type === "sell") {
        const ledgerTransactions = await this.getLedgerTransactionsForAsset(
          portfolio._id,
          marketAssetId,
          session,
        );
        const currentPosition = ledgerTransactions.length
          ? this.calculateCurrentPositionFromTransactions(ledgerTransactions)
          : this.calculateCurrentPosition(portfolio.assets, marketAssetIdString);

        if (currentPosition < dto.amount) {
          throw new BadRequestException(
            `Not enough tokens to sell. Available: ${currentPosition}, trying to sell: ${dto.amount}`
          );
        }
      }

      const newIndex =
        portfolio.assets.length > 0
          ? Math.max(...portfolio.assets.map((a) => a.index)) + 1
          : 0;

      const newAsset: any = {
        projectId: marketAssetId,
        marketAssetId,
        canonicalProjectId,
        amount: dto.amount,
        currency: dto.currency || marketAsset.symbol || "TKN",
        price: dto.price,
        priceCurrency: dto.priceCurrency,
        date: transactionDate,
        totalPrice: dto.totalPrice,
        note: dto.note,
        feeType: dto.feeType || "usd",
        feeAmount: dto.feeAmount || 0,
        type: dto.type,
        index: newIndex,
        profit: 0,
        profitPercent: 0,
        avgBuyPrice: 0,
        currentValue: 0,
        category: this.getMarketAssetCategory(marketAsset),
      };

      portfolio.assets.push(newAsset);
      portfolio.assets.sort((a, b) => a.index - b.index);

      await portfolio.save({ session });

      const savedAsset = portfolio.assets[portfolio.assets.length - 1];
      await this.createTransactionFromAsset(portfolio._id, savedAsset, session);

      return {
        portfolioId: portfolio._id.toString(),
        portfolioName: portfolio.name,
        savedAsset,
      };
    });

    await this.userActionLogsService.log({
      userId,
      actorId: userId,
      actorType: "user",
      category: "portfolio",
      action: dto.type === "sell" ? "portfolio.asset_sold" : "portfolio.asset_added",
      title: dto.type === "sell" ? "Portfolio asset sold" : "Portfolio asset added",
      entityType: "portfolio",
      entityId: writeResult.portfolioId,
      metadata: {
        portfolioName: writeResult.portfolioName,
        assetId: this.getPortfolioAssetIdentity(writeResult.savedAsset),
        type: dto.type,
        amount: dto.amount,
        currency: dto.currency || marketAsset.symbol || "TKN",
        price: dto.price,
        totalPrice: dto.totalPrice,
      },
    });

    return this.recalculate(
      writeResult.portfolioId,
      userId,
      "event:add-asset"
    );
  }

  async updateAsset(
    portfolioId: string,
    assetId: string,
    dto: UpdateAssetDto,
    userId: string
  ) {
    const portfolio = await this.getOwnedPortfolioDocument(portfolioId, userId);

    const asset = portfolio.assets.find(
      (item: PortfolioAsset) => this.getPortfolioAssetIdentity(item) === assetId
    );
    if (!asset) throw new NotFoundException("Asset not found");

    Object.assign(asset, dto);
    await portfolio.save();

    await this.userActionLogsService.log({
      userId,
      actorId: userId,
      actorType: "user",
      category: "portfolio",
      action: "portfolio.asset_updated",
      title: "Portfolio asset updated",
      entityType: "portfolio",
      entityId: portfolio._id,
      metadata: {
        portfolioName: portfolio.name,
        assetId,
        changedFields: Object.keys(dto || {}),
      },
    });

    return this.recalculate(portfolioId, userId, "event:update-asset");
  }

  async updateVisibleStatus(
    portfolioId: string,
    assetId: string,
    dto: UpdateAssetDto,
    userId: string
  ) {
    const portfolio = await this.getOwnedPortfolioDocument(portfolioId, userId);

    const asset = portfolio.assets.find(
      (item: PortfolioAsset) => this.getPortfolioAssetIdentity(item) === assetId
    );
    if (!asset) throw new NotFoundException("Asset not found");

    Object.assign(asset, dto);
    await portfolio.save();

    await this.userActionLogsService.log({
      userId,
      actorId: userId,
      actorType: "user",
      category: "portfolio",
      action: "portfolio.asset_visibility_updated",
      title: "Portfolio asset visibility updated",
      entityType: "portfolio",
      entityId: portfolio._id,
      metadata: {
        portfolioName: portfolio.name,
        assetId,
        changedFields: Object.keys(dto || {}),
      },
    });

    return this.recalculate(portfolioId, userId, "event:update-asset");
  }

  async removeAssets(
    portfolioId: string,
    projectIds: string[],
    userId: string
  ) {
    const projectIdsObjectId = this.toObjectIds(projectIds, "Project ids are required");
    const projectIdsSet = new Set(
      projectIdsObjectId.map((projectId) => projectId.toString())
    );

    const writeResult = await this.runPortfolioWriteTransaction(async (session) => {
      const portfolio = await this.getOwnedPortfolioDocument(portfolioId, userId, session);

      portfolio.assets = portfolio.assets.filter(
        (a) => !projectIdsSet.has(this.getPortfolioAssetIdentity(a))
      );

      portfolio.assets = portfolio.assets
        .sort((a, b) => a.index - b.index)
        .map((a: any, i) => ({ ...a.toObject(), index: i }));

      await this.transactionModel.deleteMany(
        {
          portfolioId: portfolio._id,
          $or: [
            { marketAssetId: { $in: projectIdsObjectId } },
            { projectId: { $in: projectIdsObjectId } },
          ],
        },
        { session },
      );

      await portfolio.save({ session });

      return {
        portfolioObjectId: portfolio._id,
        portfolioName: portfolio.name,
      };
    });

    await this.userActionLogsService.log({
      userId,
      actorId: userId,
      actorType: "user",
      category: "portfolio",
      action: "portfolio.assets_removed",
      title: "Portfolio assets removed",
      entityType: "portfolio",
      entityId: writeResult.portfolioObjectId,
      metadata: {
        portfolioName: writeResult.portfolioName,
        projectIds,
      },
    });

    return this.recalculate(portfolioId, userId, "event:remove-assets");
  }

  async reorderAssetsBulk(
    portfolioId: string,
    updates: { projectId: string; index: number }[],
    userId: string
  ) {
    const portfolio = await this.getOwnedPortfolioDocument(portfolioId, userId);

    const assets = portfolio.assets;

    const indexMap = new Map(
      updates.map((u) => [u.projectId.toString(), u.index])
    );

    assets.forEach((asset) => {
      const newIndex = indexMap.get(this.getPortfolioAssetIdentity(asset));
      if (typeof newIndex === "number") {
        asset.index = newIndex;
      }
    });

    assets.sort((a, b) => a.index - b.index);

    assets.forEach((asset, i) => (asset.index = i));

    portfolio.markModified("assets");

    await portfolio.save();

    await this.userActionLogsService.log({
      userId,
      actorId: userId,
      actorType: "user",
      category: "portfolio",
      action: "portfolio.assets_reordered",
      title: "Portfolio assets reordered",
      entityType: "portfolio",
      entityId: portfolio._id,
      metadata: {
        portfolioName: portfolio.name,
        updatesCount: updates.length,
      },
    });

    return this.recalculate(portfolioId, userId, "event:reorder-assets");
  }

  async recalculate(
    portfolioId: string,
    userId: string,
    reason: any = "manual"
  ) {
    const result =
      await this.portfolioRecalculationService.recalculatePortfolioByEvent(
        portfolioId,
        reason,
        userId
      );

    if (
      !result.recalculated &&
      result.skippedReason !== "auto-recalc-disabled"
    ) {
      await this.portfolioQueueService.enqueuePortfolioRecalculation({
        portfolioId,
        userId,
        reason,
        force: true,
        priority: reason?.startsWith?.("event:") ? 1 : 3,
      });
    }

    const portfolio = await this.getOwnedPortfolioDocument(portfolioId, userId);
    const portfolioData = await this.buildPortfolioResponse(portfolio);

    return {
      ...portfolioData,
      recalculationPending:
        !result.recalculated && result.skippedReason !== "auto-recalc-disabled",
    };
  }

  async stats(portfolioId: string, userId: string) {
    const portfolio = await this.getFreshPortfolioDocument(portfolioId, userId);

    return {
      totalAssets: (portfolio.calculatedAssets || []).length,
      buys: portfolio.assets.filter((a) => a.type === "buy").length,
      sells: portfolio.assets.filter((a) => a.type === "sell").length,
      balance: portfolio.totalBalance,
      profit: portfolio.profit,
      profitPercent: portfolio.profitPercent,
    };
  }

  async duplicate(id: string, userId: string) {
    const portfolio = await this.portfolioModel.findOne({
      _id: new mongoose.Types.ObjectId(id),
      creator: new mongoose.Types.ObjectId(userId),
    });

    if (!portfolio) {
      throw new NotFoundException("Portfolio not found");
    }

    const baseName = portfolio.name;
    let newName = baseName;
    let counter = 1;

    while (
      await this.portfolioModel.findOne({
        creator: new mongoose.Types.ObjectId(userId),
        name: newName,
      })
    ) {
      newName = `${baseName} (${counter++})`;
    }

    const code = await this.generateUniqueCode();

    const duplicatedAssets = portfolio.assets.map((asset) => ({
      projectId: asset.projectId,
      marketAssetId: asset.marketAssetId || asset.projectId,
      canonicalProjectId: asset.canonicalProjectId,
      amount: asset.amount,
      currency: asset.currency,
      type: asset.type,
      price: asset.price,
      priceCurrency: asset.priceCurrency,
      date: asset.date,
      totalPrice: asset.totalPrice,
      note: asset.note,
      feeType: asset.feeType,
      feeAmount: (asset as any).feeAmount || 0,
      index: asset.index,

      currentValue: asset.currentValue,
      avgBuyPrice: asset.avgBuyPrice,
      profit: asset.profit,
      profitPercent: asset.profitPercent,
      category: asset.category,

      _id: new mongoose.Types.ObjectId(),
      id: undefined,
    }));

    const duplicated = await this.runPortfolioWriteTransaction(async (session) => {
      const created = await this.portfolioModel.create([{
      name: newName,
      description: portfolio.description,
      code,
      logo: portfolio.logo,
      creator: portfolio.creator,
      assets: duplicatedAssets,
      totalBalance: portfolio.totalBalance, // Можно оставить текущий баланс или 0
      profit: portfolio.profit,
      profitPercent: portfolio.profitPercent,
      history: [], // Начинаем с пустой истории
      isBattle: false,
      isShare: false,
      shareType: portfolio.shareType,
      shareLink: null,
      realizedProfit: portfolio.realizedProfit,
      unrealizedProfit: portfolio.unrealizedProfit,
      totalInvested: portfolio.totalInvested,
      ath: portfolio.ath,
      athDate: portfolio.athDate,
      atl: portfolio.atl,
      atlDate: portfolio.atlDate,
      categoryDistribution: { ...portfolio.categoryDistribution },

      performance1h: portfolio.performance1h
        ? { ...portfolio.performance1h }
        : undefined,
      performance24h: portfolio.performance24h
        ? { ...portfolio.performance24h }
        : undefined,
      performance7d: portfolio.performance7d
        ? { ...portfolio.performance7d }
        : undefined,
      performance30d: portfolio.performance30d
        ? { ...portfolio.performance30d }
        : undefined,
      performance90d: portfolio.performance90d
        ? { ...portfolio.performance90d }
        : undefined,
      }], { session });
      const duplicatedPortfolio = created[0];

      const sourceTransactionsQuery = this.transactionModel
        .find({ portfolioId: portfolio._id });
      if (session) sourceTransactionsQuery.session(session);

      const sourceTransactions = await sourceTransactionsQuery.lean();

    if (sourceTransactions.length) {
      await this.transactionModel.insertMany(
        sourceTransactions.map((tx: any) => ({
          portfolioId: duplicatedPortfolio._id,
          projectId: tx.projectId,
          marketAssetId: tx.marketAssetId || tx.projectId,
          canonicalProjectId: tx.canonicalProjectId,
          type: tx.type,
          quantity: tx.quantity,
          currency: tx.currency,
          price: tx.price,
          priceCurrency: tx.priceCurrency,
          total: tx.total,
          gainLoss: tx.gainLoss || 0,
          gainLossPercent: tx.gainLossPercent || 0,
          date: tx.date,
          note: tx.note,
          feeType: tx.feeType,
          feeAmount: tx.feeAmount || 0,
        })),
        { session },
      );
    }

      return duplicatedPortfolio;
    });

    await this.userActionLogsService.log({
      userId,
      actorId: userId,
      actorType: "user",
      category: "portfolio",
      action: "portfolio.duplicated",
      title: "Portfolio duplicated",
      entityType: "portfolio",
      entityId: duplicated._id,
      metadata: {
        sourcePortfolioId: portfolio._id,
        sourceName: portfolio.name,
        name: duplicated.name,
        assetsCount: duplicatedAssets.length,
      },
    });

    return this.recalculate(
      duplicated._id.toString(),
      userId,
      "event:duplicate"
    );
  }

  async toggleBattle(portfolioId: string, userId: string, state: boolean) {
    const portfolio = await this.getOwnedPortfolioDocument(portfolioId, userId);

    if (!portfolio) {
      throw new BadRequestException("Portfolio not found or no access");
    }

    if (state === true) {
      await this.portfolioModel.updateMany(
        {
          creator: new mongoose.Types.ObjectId(userId),
          _id: { $ne: new mongoose.Types.ObjectId(portfolioId) },
        },
        { $set: { isBattle: false } }
      );
    }

    portfolio.isBattle = state;
    await portfolio.save();

    await this.userActionLogsService.log({
      userId,
      actorId: userId,
      actorType: "user",
      category: "portfolio",
      action: "portfolio.battle_status_updated",
      title: "Portfolio battle status updated",
      entityType: "portfolio",
      entityId: portfolio._id,
      metadata: {
        name: portfolio.name,
        isBattle: state,
      },
    });

    return {
      message: state
        ? "Portfolio activated for battle mode"
        : "Portfolio removed from battle mode",
      portfolio,
    };
  }

  async toggleShare(
    id: string,
    userId: string,
    isShare: boolean,
    shareType?: ShareTypes
  ) {
    const portfolio = await this.getOwnedPortfolioDocument(id, userId);

    if (!portfolio) {
      throw new NotFoundException("Portfolio not found");
    }

    if (!isShare) {
      portfolio.isShare = false;
      portfolio.shareType = undefined;
      portfolio.shareLink = null;
      const saved = await portfolio.save();

      await this.userActionLogsService.log({
        userId,
        actorId: userId,
        actorType: "user",
        category: "portfolio",
        action: "portfolio.share_status_updated",
        title: "Portfolio share disabled",
        entityType: "portfolio",
        entityId: saved._id,
        metadata: {
          name: saved.name,
          isShare: false,
        },
      });

      return saved;
    }

    portfolio.isShare = true;
    portfolio.shareType = shareType || "public";

    if (portfolio.shareType === "private") {
      portfolio.shareLink = `${process.env.FRONT_URL}/portfolio/${portfolio.code}`;
    } else {
      portfolio.shareLink = null;
    }

    const saved = await portfolio.save();

    await this.userActionLogsService.log({
      userId,
      actorId: userId,
      actorType: "user",
      category: "portfolio",
      action: "portfolio.share_status_updated",
      title: "Portfolio share enabled",
      entityType: "portfolio",
      entityId: saved._id,
      metadata: {
        name: saved.name,
        isShare: true,
        shareType: saved.shareType,
        shareLink: saved.shareLink,
      },
    });

    return saved;
  }

  async getPortfolioByCode(code: string) {
    const sharedPortfolio = await this.portfolioModel
      .findOne({ code, isShare: true })
      .select("_id")
      .lean();

    if (!sharedPortfolio) {
      return { isSuccess: false, message: "Portfolio not found" };
    }

    await this.getFreshPortfolioDocument(sharedPortfolio._id.toString());

    const portfolio = await this.portfolioModel
      .findOne({ code, isShare: true })
      .populate("creator", "name username photo _id twitterData avatar fomoId");

    if (!portfolio) {
      return { isSuccess: false, message: "Portfolio not found" };
    }

    const portfolioData = await this.buildPortfolioResponse(portfolio);
    portfolioData.history = this.buildPortfolioChartHistory(portfolio, null);

    return { isSuccess: true, data: portfolioData };
  }

  async getPublicPortfolioByUserId(userId: string) {
    const publicPortfolio = await this.portfolioModel
      .findOne({
        creator: new mongoose.Types.ObjectId(userId),
        isShare: true,
        shareType: "public",
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .select("_id")
      .lean();

    if (!publicPortfolio?._id) {
      return { isSuccess: true, data: null };
    }

    await this.getFreshPortfolioDocument(publicPortfolio._id.toString());

    const portfolio = await this.portfolioModel
      .findOne({
        _id: publicPortfolio._id,
        isShare: true,
        shareType: "public",
      })
      .populate("creator", "name username photo _id twitterData avatar fomoId");

    if (!portfolio) {
      return { isSuccess: true, data: null };
    }

    const portfolioData = await this.buildPortfolioResponse(portfolio);
    portfolioData.history = this.buildPortfolioChartHistory(portfolio, null);

    return { isSuccess: true, data: portfolioData };
  }

  async getPortfolioChart(
    portfolioId: string,
    chartType: ChartTypes,
    userId: string
  ): Promise<any[]> {
    const { portfolio, isFresh } =
      await this.getPortfolioDocumentWithFreshness(portfolioId, userId);

    return this.buildPortfolioStatsChart(portfolio, chartType, isFresh);
  }

  async getPublicPortfolioChart(
    portfolioId: string,
    chartType: ChartTypes
  ): Promise<any[]> {
    const portfolio = await this.getPublicPortfolioDocument(portfolioId);
    const { portfolio: freshPortfolio, isFresh } =
      await this.getPortfolioDocumentWithFreshness(
        portfolio._id.toString()
      );

    return this.buildPortfolioStatsChart(freshPortfolio, chartType, isFresh);
  }

  async getPortfolioAssets(portfolioId: string, userId: string) {
    const portfolio = await this.getFreshPortfolioDocument(portfolioId, userId);
    return this.buildFormattedPortfolioAssets(portfolio);
  }

  async getPublicPortfolioAssets(portfolioId: string) {
    const portfolio = await this.getPublicPortfolioDocument(portfolioId);
    const freshPortfolio = await this.getFreshPortfolioDocument(
      portfolio._id.toString()
    );
    return this.buildFormattedPortfolioAssets(freshPortfolio);
  }

  private async buildFormattedPortfolioAssets(portfolio: PortfolioDocument) {
    const calculatedAssets = portfolio.calculatedAssets || [];
    const projectIds = calculatedAssets
      .map((asset) => this.getPortfolioAssetIdentity(asset))
      .filter((projectId) => mongoose.Types.ObjectId.isValid(projectId));
    const projectMap = await this.loadMarketAssetsByIds(projectIds);

    const formattedAssets = calculatedAssets
      .map((asset: any) => {
        const projectId = this.getPortfolioAssetIdentity(asset);
        const project = projectMap.get(projectId);
        const symbol = this.getMarketAssetSymbol(project, asset.currency);

        return {
          projectId,
          marketAssetId: projectId,
          canonicalProjectId: this.getAssetProjectId(
            asset.canonicalProjectId || project?.canonicalProjectId
          ),
          _id: projectId,
          img: project?.logo || "/default.png",
          name: project?.name || "Unknown asset",
          category: asset.category || this.getMarketAssetCategory(project),
          niche: project?.niche || project?.symbol || asset.currency,
          amountUsd: `$${asset.currentValue.toFixed(2)}`,
          amountTkn: `${asset.quantity.toFixed(2)} ${symbol}`,
          invested: `$${asset.invested.toFixed(2)}`,
          avgBuyPrice: `$${asset.averageBuyPrice.toFixed(2)}`,
          profitUsd: asset.unrealizedProfit,
          profitPercent: asset.profitPercent,
          allocationPercent: asset.allocationPercent,
          realizedProfit: asset.realizedProfit,
          totalProfit: asset.totalProfit,
          totalFees: asset.totalFees,
          index: asset.index || 0,
        };
      })
      .sort((a, b) => b.index - a.index);

    return formattedAssets;
  }

  async getPortfolioMovers(portfolioId: string, userId: string) {
    const portfolio = await this.getFreshPortfolioDocument(portfolioId, userId);
    const calculatedAssets = portfolio.calculatedAssets || [];
    const projectIds = calculatedAssets
      .map((asset) => this.getPortfolioAssetIdentity(asset))
      .filter((projectId) => mongoose.Types.ObjectId.isValid(projectId));
    const projectMap = await this.loadMarketAssetsByIds(projectIds);

    const items = calculatedAssets
      .filter((asset: any) => Number(asset.currentPrice) > 0)
      .map((asset: any) => {
        const projectId = this.getPortfolioAssetIdentity(asset);
        const project = projectMap.get(projectId);
        const profit = Number(asset.unrealizedProfit || 0);
        const profitPercent = Number(asset.profitPercent || 0);

        if (!Number.isFinite(profit) || profit === 0) return null;

        return {
          projectId,
          marketAssetId: projectId,
          canonicalProjectId: this.getAssetProjectId(
            asset.canonicalProjectId || project?.canonicalProjectId
          ),
          name: project?.name || "Unknown asset",
          symbol: this.getMarketAssetSymbol(project, asset.currency),
          niche: project?.niche || project?.symbol || asset.currency || "",
          logo: project?.logo || "",
          value: profit,
          percent: profitPercent,
          currentValue: asset.currentValue,
          quantity: asset.quantity,
        };
      })
      .filter(Boolean);

    const gainers = items
      .filter((item: any) => item.value > 0)
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, 3);
    const losers = items
      .filter((item: any) => item.value < 0)
      .sort((a: any, b: any) => a.value - b.value)
      .slice(0, 3);

    return { gainers, losers };
  }

  async getPortfolioTransactions(portfolioId: string, userId: string) {
    const portfolio = await this.getFreshPortfolioDocument(portfolioId, userId);
    return this.buildPortfolioTransactions(portfolio);
  }

  async getPublicPortfolioTransactions(portfolioId: string) {
    const portfolio = await this.getPublicPortfolioDocument(portfolioId);
    const freshPortfolio = await this.getFreshPortfolioDocument(
      portfolio._id.toString()
    );
    return this.buildPortfolioTransactions(freshPortfolio);
  }

  private async buildPortfolioTransactions(portfolio: PortfolioDocument) {
    const transactions = await this.transactionModel
      .find({ portfolioId: portfolio._id })
      .sort({ date: -1, createdAt: -1 })
      .lean();
    const projectIds = transactions
      .map((transaction) => this.getPortfolioAssetIdentity(transaction))
      .filter((projectId) => mongoose.Types.ObjectId.isValid(projectId));
    const projectMap = await this.loadMarketAssetsByIds(projectIds);

    return transactions.map((transaction: any) => {
      const projectId = this.getPortfolioAssetIdentity(transaction);
      const project = projectMap.get(projectId);
      const symbol = this.getMarketAssetSymbol(project, transaction.currency);

      return {
        ...transaction,
        marketAssetId: transaction.marketAssetId || transaction.projectId,
        canonicalProjectId:
          transaction.canonicalProjectId || project?.canonicalProjectId,
        projectId: {
          _id: projectId,
          name: project?.name || "Unknown asset",
          symbol,
          logo: project?.logo || "",
          niche: project?.niche || project?.symbol || symbol,
        },
      };
    });
  }

  private getChartRangeStart(
    chartType: ChartTypes,
    now = new Date()
  ): Date | null {
    switch (chartType) {
      case "chart24h":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case "chart7d":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "chart30d":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "chart90d":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case "chart1y":
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case "chartAll":
      default:
        return null;
    }
  }

  /**
   * Stats charts use a range-specific regular time grid. Full portfolio
   * responses and ROI calculations intentionally keep using
   * buildPortfolioChartHistory directly, because they need the raw history.
   */
  private buildPortfolioStatsChart(
    portfolio: PortfolioDocument,
    chartType: ChartTypes,
    isFresh = true
  ): any[] {
    const now = new Date();
    const from = this.getChartRangeStart(chartType, now);
    const chartHistory = this.buildPortfolioChartHistory(
      portfolio,
      from,
      now,
      isFresh
    );
    const lastHistoryTimestamp = chartHistory.length
      ? new Date(chartHistory[chartHistory.length - 1]?.date).getTime()
      : Number.NaN;
    const effectiveTo = isFresh
      ? now
      : Number.isFinite(lastHistoryTimestamp)
        ? new Date(Math.min(lastHistoryTimestamp, now.getTime()))
        : null;

    if (!effectiveTo) return [];

    return this.resamplePortfolioStatsChart(
      chartHistory,
      chartType,
      from,
      effectiveTo
    );
  }

  /**
   * Converts irregular snapshots into the same kind of fixed time buckets
   * used by the market chart. The last observation wins inside each bucket;
   * empty buckets carry the last known portfolio state forward and are marked
   * as approximations. This keeps timestamps unique and chart spacing stable.
   */
  private resamplePortfolioStatsChart(
    chartHistory: any[],
    chartType: ChartTypes,
    from: Date | null,
    to: Date
  ): any[] {
    const intervalMs = PORTFOLIO_STATS_CHART_BUCKET_MS[chartType];
    const sourceEndTimestamp = to.getTime();
    const sourcePoints = (chartHistory || [])
      .map((point: any) => ({
        point,
        timestamp: new Date(point?.date).getTime(),
      }))
      .filter(
        ({ timestamp }) =>
          Number.isFinite(timestamp) && timestamp <= sourceEndTimestamp
      )
      .sort((left, right) => left.timestamp - right.timestamp);

    if (!sourcePoints.length || !Number.isFinite(intervalMs) || intervalMs <= 0) {
      return [];
    }

    const firstTimestamp = sourcePoints[0].timestamp;
    const requestedStartTimestamp = from?.getTime();
    const gridStartTimestamp =
      Number.isFinite(requestedStartTimestamp) &&
      Number(requestedStartTimestamp) <= sourceEndTimestamp &&
      firstTimestamp <= Number(requestedStartTimestamp)
        ? Number(requestedStartTimestamp)
        : firstTimestamp;
    const gridTimestamps: number[] = [];

    for (
      let timestamp = gridStartTimestamp;
      timestamp < sourceEndTimestamp;
      timestamp += intervalMs
    ) {
      gridTimestamps.push(timestamp);
    }
    if (
      !gridTimestamps.length ||
      gridTimestamps[gridTimestamps.length - 1] !== sourceEndTimestamp
    ) {
      gridTimestamps.push(sourceEndTimestamp);
    }

    const lastBucketIndex = gridTimestamps.length - 1;
    const pointsByBucket = new Map<number, any>();

    for (const { point, timestamp } of sourcePoints) {
      const bucketIndex = Math.min(
        lastBucketIndex,
        Math.max(
          0,
          Math.ceil((timestamp - gridStartTimestamp) / intervalMs)
        )
      );

      pointsByBucket.set(bucketIndex, {
        ...point,
        date: new Date(gridTimestamps[bucketIndex]),
      });
    }

    const populatedBucketIndexes = Array.from(pointsByBucket.keys()).sort(
      (left, right) => left - right
    );
    if (!populatedBucketIndexes.length) return [];

    const firstBucketIndex = populatedBucketIndexes[0];
    const result: any[] = [];
    let lastKnownPoint: any;

    for (
      let bucketIndex = firstBucketIndex;
      bucketIndex <= lastBucketIndex;
      bucketIndex += 1
    ) {
      const bucketTimestamp = gridTimestamps[bucketIndex];
      const observedPoint = pointsByBucket.get(bucketIndex);

      if (observedPoint) {
        lastKnownPoint = observedPoint;
        result.push(observedPoint);
        continue;
      }

      if (!lastKnownPoint) continue;

      result.push({
        ...lastKnownPoint,
        _id: undefined,
        date: new Date(bucketTimestamp),
        isApproximation: true,
        isCurrent: false,
      });
    }

    return result;
  }

  private buildPortfolioChartHistory(
    portfolio: PortfolioDocument,
    from: Date | null,
    now = new Date(),
    allowCurrentPoint = true
  ): any[] {
    const validHistory = (portfolio.history || [])
      .filter((h: any) => {
        const date = new Date(h.date);
        const balance = Number(h.totalBalance);
        return (
          !Number.isNaN(date.getTime()) &&
          Number.isFinite(balance) &&
          balance > 0
        );
      })
      .sort(
        (a: any, b: any) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
      );

    let chartHistory = validHistory;

    if (from) {
      const baseline = [...validHistory].reverse().find((h: any) => {
        const date = new Date(h.date).getTime();
        return (
          date <= from.getTime() &&
          from.getTime() - date <= this.getMaxChartBaselineLookbackMs(from)
        );
      });
      const firstInRange = validHistory.find((h: any) => {
        const date = new Date(h.date).getTime();
        return (
          date >= from.getTime() &&
          date - from.getTime() <= this.getMaxChartBaselineLookbackMs(from)
        );
      });
      const inRange = validHistory.filter(
        (h: any) => new Date(h.date).getTime() >= from.getTime()
      );
      const baselinePoint = baseline || firstInRange;
      chartHistory = baseline ? [baseline, ...inRange] : inRange;
      chartHistory =
        baselinePoint && !chartHistory.some((h: any) => h === baselinePoint)
          ? [baselinePoint, ...chartHistory]
          : chartHistory;
    }

    const latestSnapshot = validHistory[validHistory.length - 1];
    const currentPoint = {
      date: now,
      totalBalance: portfolio.totalBalance || 0,
      totalProfit: portfolio.profit || 0,
      totalProfitPercent: portfolio.profitPercent || 0,
      totalInvested: portfolio.totalInvested || 0,
      btcPrice: latestSnapshot?.btcPrice,
      ethPrice: latestSnapshot?.ethPrice,
      categoryDistribution:
        portfolio.categoryDistribution || latestSnapshot?.categoryDistribution,
      isApproximation: true,
      isCurrent: true,
    };

    const lastPoint = chartHistory[chartHistory.length - 1];
    const hasChartHistory = chartHistory.length > 0;
    const lastPointTimestamp = lastPoint
      ? new Date(lastPoint.date).getTime()
      : Number.NaN;
    const currentMarketDataFingerprint = String(
      portfolio.lastMarketDataFingerprint || ""
    ).trim();
    const historyMarketDataFingerprint = String(
      portfolio.lastHistoryMarketDataFingerprint || ""
    ).trim();
    const hasKnownMarketDataState = Boolean(
      currentMarketDataFingerprint && historyMarketDataFingerprint
    );
    const hasFreshMarketDataSinceHistory =
      hasKnownMarketDataState &&
      currentMarketDataFingerprint !== historyMarketDataFingerprint;
    const hasMeaningfulTimeGap =
      Number.isFinite(lastPointTimestamp) &&
      currentPoint.date.getTime() - lastPointTimestamp >= 5 * 60 * 1000 &&
      (!hasKnownMarketDataState || hasFreshMarketDataSinceHistory);
    const shouldAppendCurrent =
      allowCurrentPoint &&
      Number.isFinite(Number(currentPoint.totalBalance)) &&
      (currentPoint.totalBalance > 0 || hasChartHistory) &&
      (!lastPoint ||
        hasMeaningfulTimeGap ||
        Math.abs(
          Number(lastPoint.totalBalance || 0) - currentPoint.totalBalance
        ) >= 0.01 ||
        Math.abs(
          Number(lastPoint.totalProfit || 0) - currentPoint.totalProfit
        ) >= 0.01);

    if (shouldAppendCurrent) {
      chartHistory = [...chartHistory, currentPoint as any];
    }

    return chartHistory.map((h: any) => ({
      date: h.date,
      totalBalance: h.totalBalance,
      totalProfit: h.totalProfit,
      totalProfitPercent: h.totalProfitPercent,
      totalInvested: h.totalInvested,
      btcPrice: h.btcPrice,
      ethPrice: h.ethPrice,
      categoryDistribution: h.categoryDistribution,
      isApproximation: Boolean(h.isApproximation),
      isCurrent: Boolean(h.isCurrent),
      _id: h._id,
    }));
  }

  private getMaxChartBaselineLookbackMs(from: Date): number {
    const rangeMs = Date.now() - from.getTime();
    if (rangeMs <= 60 * 60 * 1000) {
      return this.oneHourChartBaselineToleranceMinutes * 60 * 1000;
    }

    return Math.max(60 * 60 * 1000, rangeMs * 0.25);
  }

  private buildPortfolioRoiRangeMetrics(portfolio: any): {
    roi24h: number | null;
    roi7d: number | null;
    roi30d: number | null;
    roi90d: number | null;
    roi1y: number | null;
  } {
    return {
      roi24h: this.resolvePortfolioRangeMetric(portfolio, "24H"),
      roi7d: this.resolvePortfolioRangeMetric(portfolio, "7D"),
      roi30d: this.resolvePortfolioRangeMetric(portfolio, "30D"),
      roi90d: this.resolvePortfolioRangeMetric(portfolio, "90D"),
      roi1y: this.resolvePortfolioRangeMetric(portfolio, "1Y"),
    };
  }

  private resolvePortfolioRangeMetric(
    portfolio: any,
    range: Exclude<PortfolioRoiCompareRange, "ALL">
  ): number | null {
    const performanceFieldMap: Record<
      Exclude<PortfolioRoiCompareRange, "ALL">,
      string
    > = {
      "24H": "performance24h",
      "7D": "performance7d",
      "30D": "performance30d",
      "90D": "performance90d",
      "1Y": "performance1y",
    };
    const field = performanceFieldMap[range];
    const hasBaseline = this.hasPortfolioHistoryBaseline(portfolio, range);

    if (!hasBaseline) {
      return null;
    }

    const value = Number(portfolio?.[field]?.usd);
    return Number.isFinite(value) ? value : null;
  }

  private buildPortfolioRoiChart(
    portfolio: any,
    range: PortfolioRoiCompareRange
  ): {
    points: PortfolioRoiComparePoint[];
    hasHistory: boolean;
    hasBaseline: boolean;
  } {
    const from = this.getPortfolioRoiRangeStart(range);
    const validHistory = this.getValidPortfolioRoiHistory(portfolio?.history);
    const hasHistory = validHistory.length > 0;

    if (!hasHistory && !Number.isFinite(Number(portfolio?.totalBalance))) {
      return {
        points: [],
        hasHistory: false,
        hasBaseline: range === "ALL",
      };
    }

    const baseline =
      range === "ALL" ? null : this.findPortfolioRoiBaseline(validHistory, from);
    const hasBaseline = range === "ALL" ? hasHistory : Boolean(baseline);
    const chartHistory = this.buildPortfolioChartHistory(portfolio as any, from);

    const points = chartHistory.map((item: any) => {
      const totalBalance = Number(item?.totalBalance);
      const totalProfitPercent = Number(item?.totalProfitPercent);

      return {
        date: new Date(item.date),
        roi:
          range === "ALL"
            ? Number.isFinite(totalProfitPercent)
              ? totalProfitPercent
              : null
            : hasBaseline && baseline && Number.isFinite(totalProfitPercent)
              ? Number((totalProfitPercent - Number(baseline.totalProfitPercent || 0)).toFixed(2))
              : null,
        totalBalance: Number.isFinite(totalBalance) ? totalBalance : null,
      };
    });

    return {
      points,
      hasHistory,
      hasBaseline,
    };
  }

  private getPortfolioRoiRangeStart(
    range: PortfolioRoiCompareRange
  ): Date | null {
    const now = new Date();

    switch (range) {
      case "24H":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case "7D":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "30D":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case "90D":
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      case "1Y":
        return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      case "ALL":
      default:
        return null;
    }
  }

  private getValidPortfolioRoiHistory(history: any[]): any[] {
    return (history || [])
      .filter((item: any) => {
        const date = new Date(item?.date);
        const balance = Number(item?.totalBalance);

        return (
          !Number.isNaN(date.getTime()) &&
          Number.isFinite(balance) &&
          balance > 0
        );
      })
      .sort(
        (left: any, right: any) =>
          new Date(left.date).getTime() - new Date(right.date).getTime()
      );
  }

  private findPortfolioRoiBaseline(history: any[], from: Date | null): any | null {
    if (!from || !history.length) {
      return null;
    }

    const baselineToleranceMs = this.getMaxChartBaselineLookbackMs(from);
    const baseline = [...history].reverse().find((item: any) => {
      const itemDate = new Date(item.date).getTime();
      return (
        itemDate <= from.getTime() &&
        from.getTime() - itemDate <= baselineToleranceMs
      );
    });

    if (baseline) {
      return baseline;
    }

    const firstInRange = history.find((item: any) => {
      const itemDate = new Date(item.date).getTime();
      return (
        itemDate >= from.getTime() &&
        itemDate - from.getTime() <= baselineToleranceMs
      );
    });

    return firstInRange || null;
  }

  private hasPortfolioHistoryBaseline(
    portfolio: any,
    range: Exclude<PortfolioRoiCompareRange, "ALL">
  ): boolean {
    const from = this.getPortfolioRoiRangeStart(range);
    const history = this.getValidPortfolioRoiHistory(portfolio?.history);

    return Boolean(this.findPortfolioRoiBaseline(history, from));
  }

  private getPortfolioTopHeldToken(portfolio: any): string | null {
    const assets = Array.isArray(portfolio?.calculatedAssets)
      ? portfolio.calculatedAssets
      : [];

    if (!assets.length) {
      return null;
    }

    const topAsset = assets.reduce((bestAsset: any, nextAsset: any) => {
      if (!bestAsset) {
        return nextAsset;
      }

      const bestScore = Number(
        bestAsset?.allocationPercent || bestAsset?.currentValue || 0
      );
      const nextScore = Number(
        nextAsset?.allocationPercent || nextAsset?.currentValue || 0
      );

      return nextScore > bestScore ? nextAsset : bestAsset;
    }, assets[0]);

    return this.getFirstNonEmptyString(
      topAsset?.currency,
      topAsset?.symbol,
      topAsset?.name
    ) || null;
  }

  private normalizePublicPortfolioSearchQuery(query?: string): string {
    return String(query || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, PUBLIC_PORTFOLIO_SEARCH_MAX_QUERY_LENGTH);
  }

  private clampPublicPortfolioSearchLimit(limit?: number | string): number {
    const parsedLimit = Math.floor(Number(limit));

    if (!Number.isFinite(parsedLimit)) {
      return PUBLIC_PORTFOLIO_SEARCH_DEFAULT_LIMIT;
    }

    return Math.min(
      PUBLIC_PORTFOLIO_SEARCH_MAX_LIMIT,
      Math.max(1, parsedLimit)
    );
  }

  private clampPublicPortfolioMoversLimit(limit?: number): number {
    const parsedLimit = Math.floor(Number(limit));

    if (!Number.isFinite(parsedLimit)) {
      return PUBLIC_PORTFOLIO_MOVERS_DEFAULT_LIMIT;
    }

    return Math.min(
      PUBLIC_PORTFOLIO_MOVERS_MAX_LIMIT,
      Math.max(1, parsedLimit)
    );
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private getFirstNonEmptyString(...values: any[]): string | undefined {
    for (const value of values) {
      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }

    return undefined;
  }

  private getPublicUserAvatar(user: any): string | undefined {
    return this.getFirstNonEmptyString(
      user?.photo,
      user?.avatar,
      user?.profileImage,
      user?.profile_image,
      user?.profileImageUrl,
      user?.profile_image_url,
      user?.twitterData?.photo,
      user?.twitterData?.avatar,
      user?.twitterData?.profileImage,
      user?.twitterData?.profile_image,
      user?.twitterData?.profileImageUrl,
      user?.twitterData?.profile_image_url
    );
  }

  private buildPublicPortfolioSearchOwner(
    creator: any
  ): PublicPortfolioSearchOwner {
    const name =
      this.getFirstNonEmptyString(creator?.name, creator?.twitterData?.name) ||
      "";
    const username =
      this.getFirstNonEmptyString(
        creator?.username,
        creator?.twitterData?.username
      ) || "";
    const avatar = this.getPublicUserAvatar(creator);
    const numericFomoId = Number(creator?.fomoId);
    const fomoId = Number.isFinite(numericFomoId) ? numericFomoId : undefined;

    return {
      id: creator?._id ? String(creator._id) : undefined,
      displayName:
        name ||
        username ||
        (typeof fomoId === "number" ? `FOMO #${fomoId}` : "Unknown creator"),
      username: username || undefined,
      avatar: avatar || undefined,
      fomoId,
    };
  }

  private buildPublicPortfolioSearchItem(item: any): PublicPortfolioSearchItem {
    const description =
      typeof item?.description === "string" ? item.description.trim() : "";

    return {
      id: String(item._id),
      name: String(item.name || ""),
      description: description || undefined,
      shareCode: String(item.code || ""),
      logo:
        typeof item?.logo === "string" && item.logo.trim()
          ? item.logo
          : undefined,
      updatedAt: item?.updatedAt,
      totalBalance: Number(item?.totalBalance || 0),
      profitPercent: Number(item?.profitPercent || 0),
      owner: this.buildPublicPortfolioSearchOwner(item?.creator),
    };
  }

  private buildPublicPortfolioMoverItem(item: any): PublicPortfolioMoverItem {
    return {
      portfolioId: String(item?._id || ""),
      portfolioName:
        typeof item?.name === "string" && item.name.trim()
          ? item.name.trim()
          : "Unnamed portfolio",
      shareCode: String(item?.code || ""),
      totalBalance: Number(item?.totalBalance || 0),
      performanceValue: Number(item?.performanceValue || 0),
      owner: this.buildPublicPortfolioSearchOwner(item?.creator),
    };
  }

  private async buildPortfolioResponse(
    portfolio: PortfolioDocument
  ): Promise<any> {
    const portfolioData = portfolio.toObject();
    portfolioData.assets = await this.formatCalculatedPortfolioAssets(
      portfolio.calculatedAssets || []
    );

    const creator =
      portfolioData?.creator && typeof portfolioData.creator === "object"
        ? (portfolioData.creator as Record<string, any>)
        : undefined;

    if (creator) {
      creator.avatar = this.getPublicUserAvatar(creator);
    }

    return {
      ...portfolioData,
      isAssets: (portfolio.assets || []).length > 0,
    };
  }

  private getAssetProjectId(projectId: any): string {
    if (!projectId) return "";
    if (projectId.marketAssetId) return projectId.marketAssetId.toString();
    if (projectId._id) return projectId._id.toString();
    return projectId.toString();
  }

  private getPortfolioAssetIdentity(asset: any): string {
    return this.getAssetProjectId(asset?.marketAssetId || asset?.projectId);
  }

  private getMarketAssetCategory(project: any): string {
    return project?.category || project?.niche || "Other";
  }

  private getMarketAssetSymbol(project: any, fallback?: string): string {
    return project?.symbol || project?.niche || fallback || "TKN";
  }

  private async loadMarketAssetsByIds(
    projectIds: string[]
  ): Promise<Map<string, any>> {
    const uniqueProjectIds = [...new Set(projectIds)].filter((projectId) =>
      mongoose.Types.ObjectId.isValid(projectId)
    );

    if (!uniqueProjectIds.length) return new Map();

    const projects = await this.marketReadModel
      .find({
        marketAssetId: {
          $in: uniqueProjectIds.map(
            (projectId) => new mongoose.Types.ObjectId(projectId)
          ),
        },
      })
      .select("marketAssetId canonicalProjectId name symbol logo niche category price")
      .lean();

    return new Map(
      projects.map((project: any) => [
        project.marketAssetId.toString(),
        project,
      ])
    );
  }

  private async findMarketAssetForPortfolio(dto: AddAssetDto): Promise<any> {
    const marketAssetId = dto.marketAssetId || dto.projectId;
    const candidateFilters: any[] = [];

    if (mongoose.Types.ObjectId.isValid(marketAssetId)) {
      const id = new mongoose.Types.ObjectId(marketAssetId);
      candidateFilters.push(
        { marketAssetId: id },
        { canonicalProjectId: id },
        { _id: id }
      );
    }

    if (mongoose.Types.ObjectId.isValid(dto.canonicalProjectId)) {
      candidateFilters.push({
        canonicalProjectId: new mongoose.Types.ObjectId(dto.canonicalProjectId),
      });
    }

    if (!candidateFilters.length) {
      throw new BadRequestException("Market asset id is required");
    }

    const marketAsset = await this.marketReadModel
      .findOne({ $or: candidateFilters })
      .lean();

    if (!marketAsset?.marketAssetId) {
      throw new NotFoundException("Market asset not found");
    }

    return marketAsset;
  }

  private async formatCalculatedPortfolioAssets(
    calculatedAssets: PortfolioCalculatedAsset[]
  ): Promise<any[]> {
    const projectIds = calculatedAssets
      .map((asset) => this.getPortfolioAssetIdentity(asset))
      .filter((projectId) => mongoose.Types.ObjectId.isValid(projectId));
    const projectMap = await this.loadMarketAssetsByIds(projectIds);

    return calculatedAssets
      .map((asset: any) => {
        const projectId = this.getPortfolioAssetIdentity(asset);
        const project = projectMap.get(projectId);
        const hasCurrentPrice = Number(asset.currentPrice) > 0;
        const symbol = this.getMarketAssetSymbol(project, asset.currency);

        return {
          _id: projectId,
          marketAssetId: projectId,
          canonicalProjectId: this.getAssetProjectId(
            asset.canonicalProjectId || project?.canonicalProjectId
          ),
          projectId: {
            _id: projectId,
            name: project?.name || "Unknown asset",
            symbol,
            logo: project?.logo || "",
            niche: project?.niche || project?.symbol || symbol,
          },
          amount: asset.quantity,
          currency: asset.currency || symbol,
          currentPrice: hasCurrentPrice ? asset.currentPrice : null,
          currentValue: hasCurrentPrice ? asset.currentValue : null,
          hasCurrentPrice,
          totalPrice: asset.invested,
          invested: asset.invested,
          price: asset.averageBuyPrice,
          avgBuyPrice: asset.averageBuyPrice,
          profit: hasCurrentPrice ? asset.unrealizedProfit : null,
          profitPercent: hasCurrentPrice ? asset.profitPercent : null,
          realizedProfit: asset.realizedProfit,
          totalProfit: hasCurrentPrice ? asset.totalProfit : null,
          totalFees: asset.totalFees,
          allocationPercent: asset.allocationPercent,
          category: asset.category,
          index: asset.index || 0,
        };
      })
      .sort((a: any, b: any) => b.index - a.index);
  }

  private async getPersistedPortfolioDocument(
    portfolioId: string,
    userId?: string
  ): Promise<PortfolioDocument> {
    if (userId) {
      return this.getOwnedPortfolioDocument(portfolioId, userId);
    }

    const portfolio = await this.portfolioModel.findById(
      new mongoose.Types.ObjectId(portfolioId)
    );
    if (!portfolio) {
      throw new NotFoundException("Portfolio not found");
    }

    return portfolio;
  }

  private async getPublicPortfolioDocument(
    portfolioId: string
  ): Promise<PortfolioDocument> {
    const portfolio = await this.portfolioModel.findOne({
      _id: new mongoose.Types.ObjectId(portfolioId),
      isShare: true,
      shareType: "public",
    });

    if (!portfolio) {
      throw new NotFoundException("Portfolio not found");
    }

    return portfolio;
  }
}
