import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { CryptoTab, IAdminTabColumn, ICustomTabs, TabDocument } from "./model/tab.model";
import {
  CreateAdminTabDto,
  CreateTabDto,
  ReorderAdminTabsDto,
  UpdateAdminTabDto,
  UpdateTabDto,
} from "./dto/tab.dto";
import { User, UserDocument } from "src/user/user.model";
import { Asset, AssetDocument } from "src/assets/models/asset.model";
import { FomoV2MarketProjectReadModelService } from "src/fomo-v2/domains/market/services";
import { FilesService } from "src/files/files.service";

export interface FindTabsParams {
  search?: string;
  page?: number;
  limit?: number;
  userId: string;
  type: "saved" | "explore tabs";
  subType?: "new" | "trending tabs";
}

const ADMIN_TAB_DEFAULT_COLUMNS: Record<
  string,
  {
    label: string;
    name: string;
    blockName: string;
  }
> = {
  usdPrice: { blockName: "Price", label: "USD Price", name: "Price" },
  btcPrice: { blockName: "Price", label: "BTC Price", name: "Price" },
  ethPrice: { blockName: "Price", label: "ETH Price", name: "Price" },
  priceChange1h: { blockName: "Price Change %", label: "1h", name: "1h" },
  priceChange24h: { blockName: "Price Change %", label: "24h", name: "24h" },
  priceChange7d: { blockName: "Price Change %", label: "7d", name: "7d" },
  priceChange1m: { blockName: "Price Change %", label: "1m", name: "1m" },
  priceChange3m: { blockName: "Price Change %", label: "3m", name: "3m" },
  priceChange6m: { blockName: "Price Change %", label: "6m", name: "6m" },
  priceChange1y: { blockName: "Price Change %", label: "1y", name: "1y" },
  priceChangeYtd: { blockName: "Price Change %", label: "Ytd", name: "Ytd" },
  marketCap: {
    blockName: "Market Capitalisation",
    label: "Market Cap",
    name: "Market Cap",
  },
  fdv: {
    blockName: "Market Capitalisation",
    label: "Fully Diluted Valuation (FDV)",
    name: "Fully Diluted Valuation (FDV)",
  },
  circulationSupply: {
    blockName: "Market Capitalisation",
    label: "Circulation Supply",
    name: "Circulation Supply",
  },
  volume24h: { blockName: "Volume", label: "24h", name: "24h" },
  volume7d: { blockName: "Volume", label: "7d", name: "7d" },
  volume1m: { blockName: "Volume", label: "1m", name: "1m" },
  chart24h: { blockName: "Charts", label: "24h Chart", name: "24h Chart" },
  chart7d: { blockName: "Charts", label: "7d Chart", name: "7d Chart" },
  chart1m: { blockName: "Charts", label: "1m Chart", name: "1m Chart" },
  chart3m: { blockName: "Charts", label: "3m Chart", name: "3m Chart" },
  chart6m: { blockName: "Charts", label: "6m Chart", name: "6m Chart" },
  chart1y: { blockName: "Charts", label: "1y Chart", name: "1y Chart" },
  athPrice: { blockName: "ATH/ATL", label: "ATH Price", name: "ATH Price" },
  athDate: { blockName: "ATH/ATL", label: "ATH Date", name: "ATH Date" },
  fromAth: { blockName: "ATH/ATL", label: "% from ATH", name: "% from ATH" },
  atlPrice: { blockName: "ATH/ATL", label: "ATL Price", name: "ATL Price" },
  atlDate: { blockName: "ATH/ATL", label: "ATL Date", name: "ATL Date" },
  fromAtl: { blockName: "ATH/ATL", label: "% from ATL", name: "% from ATL" },
  icoPlatform: {
    blockName: "Fundraising & Vesting",
    label: "ICO Platform",
    name: "ICO Platform",
  },
  investors: {
    blockName: "Fundraising & Vesting",
    label: "Investors",
    name: "Investors",
  },
  usdRoi: {
    blockName: "Fundraising & Vesting",
    label: "USD ROI",
    name: "USD ROI",
  },
  btcRoi: {
    blockName: "Fundraising & Vesting",
    label: "BTC ROI",
    name: "BTC ROI",
  },
  ethRoi: {
    blockName: "Fundraising & Vesting",
    label: "ETH ROI",
    name: "ETH ROI",
  },
  unlockProgress: {
    blockName: "Fundraising & Vesting",
    label: "Unlock Progress",
    name: "Unlock Progress",
  },
  nextUnlock: {
    blockName: "Fundraising & Vesting",
    label: "Next Unlock",
    name: "Next Unlock",
  },
  nextUnlockDate: {
    blockName: "Fundraising & Vesting",
    label: "Next Unlock Date",
    name: "Next Unlock Date",
  },
  totalFundsRaised: {
    blockName: "Fundraising & Vesting",
    label: "Total Funds Raised",
    name: "Total Funds Raised",
  },
  category: { blockName: "Other", label: "Category", name: "Category" },
  exchanges: { blockName: "Other", label: "Exchanges", name: "Exchanges" },
  performance: { blockName: "Other", label: "Performance", name: "Performance" },
  bullishPeriod: {
    blockName: "Other",
    label: "Bullish Period",
    name: "Bullish Period",
  },
  launchDate: {
    blockName: "Other",
    label: "Trade Launch Date",
    name: "Trade Launch Date",
  },
};

@Injectable()
export class TabsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    @InjectModel(CryptoTab.name) private tabModel: Model<TabDocument>,
    private readonly marketProjectReadModelService: FomoV2MarketProjectReadModelService,
    private filesService: FilesService
  ) { }

  private projectFieldMap: Record<string, string | null> = {
    usdPrice: "price",
    btcPrice: "priceBTC",
    ethPrice: "priceETH",
    priceChange1h: "usdQuote.percent_change_1h",
    priceChange24h: "usdQuote.percent_change_24h",
    priceChange7d: "usdQuote.percent_change_7d",
    priceChange1m: null,
    priceChange3m: null,
    priceChange6m: null,
    priceChange1y: null,
    priceChangeYtd: null,
    marketCap: "marketCap",
    fdv: "fullyDilutedMarketCap",
    circulationSupply: "circulatingSupply",
    volume24h: "volume24h",
    volume7d: null,
    volume1m: null,
    chart24h: null,
    chart7d: "chart7d",
    chart1m: null,
    chart3m: null,
    chart6m: null,
    chart1y: null,
    athPrice: "athUsd",
    athDate: "athUsdDate",
    fromAth: null,
    atlPrice: "atlUsd",
    atlDate: "atlUsdDate",
    fromAtl: null,
    icoPlatform: "fundraising.platform",
    investors: "investors",
    usdRoi: null,
    btcRoi: null,
    ethRoi: null,
    unlockProgress: null,
    nextUnlock: null,
    nextUnlockDate: null,
    totalFundsRaised: "totalRaised",
    category: "niche",
    exchanges: "exchange",
    performance: null,
    bullishPeriod: null,
    launchDate: "dateAdded",
  };

  private customTabFallbackFieldMap: Record<string, string[]> = {
    usdPrice: ["price", "usdQuote.price"],
    priceChange24h: [
      "usdQuote.percent_change_24h",
      "priceChange24h",
      "priceChange",
    ],
    priceChange7d: ["usdQuote.percent_change_7d"],
    chart7d: ["chart7d", "history"],
    athPrice: ["athUsd", "ohlcv.quote.USD.high", "yearHigh", "highPrice"],
    athDate: ["athUsdDate", "ohlcv.time_high", "yearHighDate"],
    atlPrice: ["atlUsd", "ohlcv.quote.USD.low", "yearLow", "lowPrice"],
    atlDate: ["atlUsdDate", "ohlcv.time_low", "yearLowDate"],
  };

  private baseCustomTabProjectFields: Record<string, 1> = {
    _id: 1,
    name: 1,
    symbol: 1,
    ticker: 1,
    logo: 1,
    niche: 1,
    price: 1,
    priceBTC: 1,
    priceETH: 1,
    priceChange: 1,
    priceChange24h: 1,
    "usdQuote.percent_change_1h": 1,
    "usdQuote.percent_change_24h": 1,
    "usdQuote.percent_change_7d": 1,
    projectType: 1,
    projectStatus: 1,
    circulatingSupplyPercent: 1,
  };

  private parseArrayToObjectId(
    items: Array<string>
  ): Array<mongoose.Types.ObjectId> {
    if (!items) return [];

    return items.map((id: string) => new mongoose.Types.ObjectId(id));
  }

  private normalizeObjectIdStrings(items?: Array<any>): string[] {
    if (!items) return [];

    return items
      .map((item) => String(item?._id || item))
      .filter((id) => mongoose.Types.ObjectId.isValid(id));
  }

  private normalizeSubtype(
    subtype?: string
  ): "new" | "trending tabs" | undefined {
    const normalized = subtype?.trim().toLowerCase();

    if (normalized === "new") return "new";
    if (normalized === "trending tabs") return "trending tabs";

    return undefined;
  }

  private toObjectId(id?: string): mongoose.Types.ObjectId | undefined {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) return undefined;

    return new mongoose.Types.ObjectId(id);
  }

  private buildFindTabsPipeline(params: {
    search?: string;
    page?: number;
    limit?: number;
    userId?: string;
    creatorId?: string;
    type: "saved" | "explore tabs" | "created" | "public by user";
    subType?: string;
  }): any[] {
    const page = Math.max(Number(params.page) || 1, 1);
    const pageSize = Math.max(Number(params.limit) || 10, 1);
    const userObjectId = this.toObjectId(params.userId);
    const creatorObjectId = this.toObjectId(params.creatorId);
    const subType = this.normalizeSubtype(params.subType);
    const pipeline: any[] = [];

    const match: any = {};

    match.isAdminCreated = { $ne: true };

    if (params.search) {
      match.name = { $regex: params.search, $options: "i" };
    }

    if (params.type === "saved") {
      match.saved = userObjectId;
    }

    if (params.type === "explore tabs") {
      match.isPublic = true;
    }

    if (params.type === "created") {
      match.creator = userObjectId;
    }

    if (params.type === "public by user") {
      match.creator = creatorObjectId;
      match.isPublic = true;
    }

    pipeline.push({ $match: match });

    pipeline.push({
      $addFields: {
        isSaved: userObjectId
          ? { $in: [userObjectId, { $ifNull: ["$saved", []] }] }
          : false,
        isPinned: userObjectId
          ? { $in: [userObjectId, { $ifNull: ["$pined", []] }] }
          : false,
        isCreator: userObjectId ? { $eq: ["$creator", userObjectId] } : false,
        savedCount: { $size: { $ifNull: ["$saved", []] } },
      },
    });

    pipeline.push({
      $addFields: {
        canEdit: "$isCreator",
        canDelete: "$isCreator",
      },
    });

    if (params.type === "saved") {
      pipeline.push({
        $sort: {
          isPinned: -1,
          dateUpdate: -1,
        },
      });
    } else if (subType === "trending tabs") {
      pipeline.push({
        $sort: { savedCount: -1, dateUpdate: -1 },
      });
    } else {
      pipeline.push({
        $sort: { dateUpdate: -1 },
      });
    }

    pipeline.push(
      {
        $lookup: {
          from: this.assetModel.collection.name,
          localField: "includedAssets",
          foreignField: "_id",
          as: "includedAssets",
        },
      },
      {
        $lookup: {
          from: this.assetModel.collection.name,
          localField: "excludedAssets",
          foreignField: "_id",
          as: "excludedAssets",
        },
      },
      {
        $lookup: {
          from: this.userModel.collection.name,
          localField: "creator",
          foreignField: "_id",
          as: "creator",
        },
      },
      {
        $unwind: {
          path: "$creator",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          image: 1,
          saved: 1,
          pined: 1,
          status: 1,
          arrayPlace: 1,
          dateUpdate: 1,
          description: 1,
          includedAssets: 1,
          excludedAssets: 1,
          isPublic: 1,
          isActive: 1,
          isGlobal: 1,
          isAdminCreated: 1,
          sortOrder: 1,
          key: 1,
          type: 1,
          columns: 1,
          filters: 1,
          tabs: 1,
          isSaved: 1,
          isPinned: 1,
          isCreator: 1,
          canEdit: 1,
          canDelete: 1,
          creator: {
            _id: "$creator._id",
            username: "$creator.username",
            photo: "$creator.photo",
            twitterData: "$creator.twitterData",
            discordData: "$creator.discordData",
          },
        },
      }
    );

    pipeline.push({
      $facet: {
        totalCount: [{ $count: "count" }],
        items: [{ $skip: pageSize * (page - 1) }, { $limit: pageSize }],
      },
    });

    return pipeline;
  }

  private normalizeListResponse(
    result: Array<{ totalCount?: Array<{ count: number }>; items?: any[] }>,
    page?: number,
    limit?: number
  ) {
    const safePage = Math.max(Number(page) || 1, 1);
    const safeLimit = Math.max(Number(limit) || 10, 1);
    const firstResult = result[0] || {};
    const items = firstResult.items || [];

    return {
      items,
      total: firstResult.totalCount?.[0]?.count || 0,
      page: safePage,
      limit: safeLimit,
    };
  }

  private getNestedValue(source: any, path?: string | null): any {
    if (!path) return undefined;

    return path.split(".").reduce((value, key) => value?.[key], source);
  }

  private isEmptyCustomTabValue(value: any): boolean {
    if (value === undefined || value === null || value === "") return true;
    if (typeof value === "number") return !Number.isFinite(value);

    return false;
  }

  private getCustomTabFieldPaths(key: string): string[] {
    const primaryPath = this.projectFieldMap[key];
    const fallbackPaths = this.customTabFallbackFieldMap[key] || [];

    return [primaryPath, ...fallbackPaths].filter(
      (path, index, paths): path is string =>
        !!path && paths.indexOf(path) === index
    );
  }

  private toFiniteNumber(value: any): number | undefined {
    const numericValue = Number(value);

    return Number.isFinite(numericValue) ? numericValue : undefined;
  }

  private getProjectUsdPrice(project: any): number | undefined {
    const price = this.toFiniteNumber(project.price);

    return (
      price ?? this.toFiniteNumber(this.getNestedValue(project, "usdQuote.price"))
    );
  }

  private calculateConvertedPrice(
    usdPrice: number | undefined,
    conversionPrice: number
  ): number | undefined {
    if (
      usdPrice === undefined ||
      !Number.isFinite(conversionPrice) ||
      conversionPrice <= 0
    ) {
      return undefined;
    }

    return usdPrice / conversionPrice;
  }

  private createCustomTabValues(
    project: any,
    tabs: CryptoTab["tabs"],
    conversionPrices: { btcPrice: number; ethPrice: number }
  ) {
    return tabs.reduce((values: Record<string, any>, tab) => {
      const usdPrice = this.getProjectUsdPrice(project);
      const fieldValue = this.getCustomTabFieldPaths(tab.key).reduce(
        (resolvedValue: any, fieldPath: string) => {
          if (!this.isEmptyCustomTabValue(resolvedValue)) return resolvedValue;

          return this.getNestedValue(project, fieldPath);
        },
        undefined
      );

      if (tab.key === "usdPrice") {
        values[tab.key] = usdPrice ?? fieldValue;

        return values;
      }

      if (tab.key === "btcPrice") {
        values[tab.key] =
          this.calculateConvertedPrice(usdPrice, conversionPrices.btcPrice) ??
          this.toFiniteNumber(fieldValue) ??
          this.toFiniteNumber(this.getNestedValue(project, "btcQuote.price"));

        return values;
      }

      if (tab.key === "ethPrice") {
        values[tab.key] =
          this.calculateConvertedPrice(usdPrice, conversionPrices.ethPrice) ??
          this.toFiniteNumber(fieldValue) ??
          this.toFiniteNumber(this.getNestedValue(project, "ethQuote.price"));

        return values;
      }

      values[tab.key] = fieldValue;

      return values;
    }, {});
  }

  private async resolveImageValue(image?: string, currentImage?: string): Promise<string | undefined> {
    if (typeof image === "undefined") return currentImage;
    if (!image) return undefined;

    return image.startsWith("data:")
      ? await this.filesService.writeBase64File(image)
      : image;
  }

  private buildAdminTabColumns(
    columns?: IAdminTabColumn[]
  ): Array<
    Required<
      Pick<IAdminTabColumn, "key" | "label" | "enabled" | "order" | "blockName" | "name">
    >
  > {
    return (columns || [])
      .filter((column) => column?.key)
      .map((column, index) => {
        const defaults = ADMIN_TAB_DEFAULT_COLUMNS[column.key] || {
          blockName: "Other",
          label: column.label || column.key,
          name: column.label || column.key,
        };

        return {
          key: column.key,
          label: column.label?.trim() || defaults.label,
          enabled: column.enabled !== false,
          order: Number.isFinite(Number(column.order)) ? Number(column.order) : index,
          blockName: column.blockName?.trim() || defaults.blockName,
          name: column.name?.trim() || defaults.name,
        };
      })
      .sort((a, b) => a.order - b.order);
  }

  private buildTabsFromAdminColumns(
    columns?: IAdminTabColumn[]
  ): Array<ICustomTabs & { blockName: string }> {
    return this.buildAdminTabColumns(columns)
      .filter((column) => column.enabled)
      .map((column, index) => ({
        key: column.key,
        label: column.label,
        name: column.name,
        blockName: column.blockName,
        isActive: column.enabled,
        index,
      }));
  }

  private getAdminListProjection() {
    return {
      _id: 1,
      image: 1,
      name: 1,
      key: 1,
      description: 1,
      type: 1,
      isActive: 1,
      isGlobal: 1,
      isAdminCreated: 1,
      sortOrder: 1,
      columns: 1,
      filters: 1,
      tabs: 1,
      creator: 1,
      updatedBy: 1,
      createdAt: 1,
      updatedAt: 1,
    };
  }

  private async getAdminBasePayload(
    dto: CreateAdminTabDto | UpdateAdminTabDto,
    userId: string,
    currentTab?: CryptoTab | null
  ) {
    const normalizedColumns =
      typeof dto.columns === "undefined"
        ? currentTab?.columns || []
        : this.buildAdminTabColumns(dto.columns);
    const normalizedTabs =
      typeof dto.columns === "undefined"
        ? currentTab?.tabs || []
        : this.buildTabsFromAdminColumns(dto.columns);

    return {
      image: await this.resolveImageValue(dto.image, currentTab?.image),
      name: dto.name?.trim() || currentTab?.name,
      key: dto.key?.trim() || currentTab?.key || "",
      description:
        typeof dto.description === "string"
          ? dto.description.trim()
          : currentTab?.description || "",
      type: dto.type?.trim() || currentTab?.type || "custom",
      isActive:
        typeof dto.isActive === "boolean"
          ? dto.isActive
          : currentTab?.isActive ?? true,
      isGlobal:
        typeof dto.isGlobal === "boolean"
          ? dto.isGlobal
          : currentTab?.isGlobal ?? true,
      isAdminCreated: true,
      sortOrder: Number.isFinite(Number(dto.sortOrder))
        ? Number(dto.sortOrder)
        : currentTab?.sortOrder || 0,
      columns: normalizedColumns,
      filters:
        typeof dto.filters === "undefined" ? currentTab?.filters || {} : dto.filters || {},
      tabs: normalizedTabs,
      updatedBy: new mongoose.Types.ObjectId(userId),
      dateUpdate: new Date(),
    };
  }

  async getProjectsByTabs(
    tabId: string,
    query: any,
    userId?: string
  ): Promise<{
    projects: Array<any>;
    total: number;
    tabData: CryptoTab;
    projection: any;
  }> {
    const tab = await this.tabModel.findById(tabId).lean();
    if (!tab) {
      throw new NotFoundException("Tab not found");
    }

    const userObjectId = this.toObjectId(userId);
    const isCreator =
      userObjectId && String(tab.creator) === String(userObjectId);

    const isPublicTab = Boolean(tab.isPublic || tab.isGlobal);
    const canAccessInactiveAdminTab =
      Boolean(tab.isAdminCreated) && isCreator;

    if ((!isPublicTab && !isCreator) || (tab.isAdminCreated && !tab.isActive && !canAccessInactiveAdminTab)) {
      throw new ForbiddenException("You do not have access to this tab");
    }

    const selectedFields = tab.tabs.map((t) => t.key);
    const projection: any = { ...this.baseCustomTabProjectFields };

    selectedFields.map((item: string | null) => {
      if (!item) return;

      this.getCustomTabFieldPaths(item).forEach((fieldPath) => {
        projection[fieldPath] = 1;
      });
    });

    const includedProjectIds = this.normalizeObjectIdStrings(tab.includedAssets);
    const excludedProjectIds = this.normalizeObjectIdStrings(tab.excludedAssets);
    const includedProjectIdSet = new Set(includedProjectIds);
    const projectsQuery = {
      ...(tab.filters || {}),
      ...(query || {}),
      project: projection,
      includedProjectIds,
      excludedProjectIds,
    };

    const { projects, total } =
      await this.marketProjectReadModelService.getCompatibleMarketProjects(
        projectsQuery
      );

    const shouldLoadConversionPrices = selectedFields.some((field) =>
      ["btcPrice", "ethPrice"].includes(field)
    );
    const conversionPrices = shouldLoadConversionPrices
      ? await this.marketProjectReadModelService.getCoreAssetUsdPrices()
      : { btcPrice: 1, ethPrice: 1 };

    const normalizedProjects = projects.map((project: any) => ({
      ...project,
      isIncludedAsset:
        Boolean(project.isIncludedAsset) || includedProjectIdSet.has(String(project._id)),
      customTabValues: this.createCustomTabValues(
        project,
        tab.tabs,
        conversionPrices
      ),
    }));

    return { projects: normalizedProjects, total, tabData: tab, projection };
  }

  async create(createTabDto: CreateTabDto, userId: string) {
    const image = await this.resolveImageValue(createTabDto.image);

    const tab = new this.tabModel({
      ...createTabDto,
      image,
      includedAssets: this.parseArrayToObjectId(createTabDto.includedAssets),
      excludedAssets: this.parseArrayToObjectId(createTabDto.excludedAssets),
      creator: new mongoose.Types.ObjectId(userId),
      dateUpdate: new Date(),
      saved: [new mongoose.Types.ObjectId(userId)],
      isActive: true,
      isGlobal: false,
      isAdminCreated: false,
    });

    return tab.save();
  }

  async update(id: string, userId: string, updateTabDto: UpdateTabDto) {
    const tab = await this.tabModel.findById(id);

    if (!tab) {
      throw new NotFoundException("Tab not found");
    }

    if (String(tab.creator) !== String(userId)) {
      throw new ForbiddenException("Only tab owner can update this tab");
    }

    const image = await this.resolveImageValue(updateTabDto.image, tab.image);

    return this.tabModel.findByIdAndUpdate(
      id,
      {
        ...updateTabDto,
        image,
        dateUpdate: new Date(),
      },
      { new: true }
    );
  }

  async remove(id: string, userId: string) {
    const objectId = new mongoose.Types.ObjectId(id);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const tab = await this.tabModel.findById(objectId);

    if (!tab) {
      throw new NotFoundException("Tab not found");
    }

    const deletedTab = await this.tabModel.findOneAndDelete({
      _id: objectId,
      creator: userObjectId,
    });

    if (deletedTab) {
      return { success: true, action: "deleted" };
    }

    await this.tabModel.findOneAndUpdate(
      { _id: objectId },
      { $pull: { saved: userObjectId, pined: userObjectId } },
      { new: true }
    );

    return { success: true, action: "unsaved" };
  }

  async saveTab(id: string, userId: string) {
    const tab = await this.tabModel.findById(id);

    if (!tab) {
      throw new NotFoundException("Tab not found");
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const isSaved = tab.saved?.some((savedId) => savedId.equals(userObjectId));

    if (isSaved) {
      const updatedTab = await this.tabModel.findByIdAndUpdate(
        id,
        { $pull: { saved: userObjectId, pined: userObjectId } },
        { new: true }
      );

      return { success: true, isSaved: false, tab: updatedTab };
    } else {
      const updatedTab = await this.tabModel.findByIdAndUpdate(
        id,
        { $addToSet: { saved: userObjectId } },
        { new: true }
      );

      return { success: true, isSaved: true, tab: updatedTab };
    }
  }

  async pinTab(id: string, userId: string) {
    const tab = await this.tabModel.findById(id);

    if (!tab) {
      throw new NotFoundException("Tab not found");
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const isSaved = tab.saved?.some((savedId) => savedId.equals(userObjectId));
    const isPinned = tab.pined?.some((pineId) => pineId.equals(userObjectId));

    if (!isSaved) {
      throw new BadRequestException("Only saved tabs can be pinned");
    }

    if (isPinned) {
      const updatedTab = await this.tabModel.findByIdAndUpdate(
        id,
        { $pull: { pined: userObjectId } },
        { new: true }
      );

      return { success: true, isPinned: false, tab: updatedTab };
    } else {
      const updatedTab = await this.tabModel.findByIdAndUpdate(
        id,
        { $addToSet: { pined: userObjectId } },
        { new: true }
      );

      return { success: true, isPinned: true, tab: updatedTab };
    }
  }

  async findOne(id: string) {
    return this.tabModel.findById(id);
  }

  async findAll(type: string, subtype: string, search: string, page: number) {
    const pageSize = 10;
    const match: any = {};

    if (search) {
      match.name = { $regex: search, $options: "i" };
    }

    if (type === "Saved") {
      if (!search) match.saved = { $exists: true, $not: { $size: 0 } };
    }

    if (type === "Explore Tabs") {
      match.isPublic = true;
      if (subtype === "Trending Tabs") {
        match.status = "Trending";
      }
      if (subtype === "New") {
        match.status = "New";
      }
    }

    const sort: any = {};
    if (type === "Explore Tabs") {
      if (subtype === "Trending Tabs") {
        sort["saved.length"] = -1;
      } else if (subtype === "New") {
        sort.dateUpdate = -1;
      }
    }

    return this.tabModel
      .find(match)
      .sort(sort)
      .skip((page - 1) * pageSize)
      .limit(pageSize);
  }

  async findSaved(params: {
    search?: string;
    page?: number;
    limit?: number;
    userId: string;
    type: "saved" | "explore tabs";
    subType?: string;
  }) {
    const pipeline = this.buildFindTabsPipeline(params);
    const result = await this.tabModel.aggregate(pipeline);
    return this.normalizeListResponse(result, params.page, params.limit);
  }

  async findCreated(params: {
    search?: string;
    page?: number;
    limit?: number;
    userId: string;
  }) {
    const pipeline = this.buildFindTabsPipeline({
      ...params,
      type: "created",
    });
    const result = await this.tabModel.aggregate(pipeline);
    return this.normalizeListResponse(result, params.page, params.limit);
  }

  async findPublicByUser(params: {
    search?: string;
    page?: number;
    limit?: number;
    userId?: string;
    creatorId: string;
  }) {
    const pipeline = this.buildFindTabsPipeline({
      ...params,
      type: "public by user",
    });
    const result = await this.tabModel.aggregate(pipeline);
    return this.normalizeListResponse(result, params.page, params.limit);
  }

  async findAdminTabs(search?: string) {
    const match: any = { isAdminCreated: true };

    if (search?.trim()) {
      match.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { key: { $regex: search.trim(), $options: "i" } },
        { type: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const tabs = await this.tabModel
      .find(match, this.getAdminListProjection())
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return { items: tabs };
  }

  async findAdminTabById(id: string) {
    const tab = await this.tabModel
      .findOne({ _id: id, isAdminCreated: true }, this.getAdminListProjection())
      .lean();

    if (!tab) {
      throw new NotFoundException("Tab not found");
    }

    return tab;
  }

  async createAdminTab(createAdminTabDto: CreateAdminTabDto, userId: string) {
    const adminPayload = await this.getAdminBasePayload(createAdminTabDto, userId);

    const tab = new this.tabModel({
      ...adminPayload,
      creator: new mongoose.Types.ObjectId(userId),
      includedAssets: [],
      excludedAssets: [],
      saved: [],
      pined: [],
      isPublic: true,
      arrayPlace: 0,
    });

    return tab.save();
  }

  async updateAdminTab(id: string, updateAdminTabDto: UpdateAdminTabDto, userId: string) {
    const currentTab = await this.tabModel.findOne({ _id: id, isAdminCreated: true });

    if (!currentTab) {
      throw new NotFoundException("Tab not found");
    }

    const adminPayload = await this.getAdminBasePayload(
      updateAdminTabDto,
      userId,
      currentTab.toObject()
    );

    return this.tabModel.findByIdAndUpdate(
      id,
      {
        ...adminPayload,
        isPublic: true,
      },
      { new: true }
    );
  }

  async removeAdminTab(id: string) {
    const deletedTab = await this.tabModel.findOneAndDelete({
      _id: id,
      isAdminCreated: true,
    });

    if (!deletedTab) {
      throw new NotFoundException("Tab not found");
    }

    return { success: true };
  }

  async toggleAdminTabActive(id: string, userId: string) {
    const currentTab = await this.tabModel.findOne({ _id: id, isAdminCreated: true });

    if (!currentTab) {
      throw new NotFoundException("Tab not found");
    }

    return this.tabModel.findByIdAndUpdate(
      id,
      {
        isActive: !currentTab.isActive,
        updatedBy: new mongoose.Types.ObjectId(userId),
        dateUpdate: new Date(),
      },
      { new: true }
    );
  }

  async reorderAdminTabs(reorderAdminTabsDto: ReorderAdminTabsDto, userId: string) {
    const items = reorderAdminTabsDto?.items || [];

    await Promise.all(
      items.map((item) =>
        this.tabModel.updateOne(
          { _id: item.id, isAdminCreated: true },
          {
            $set: {
              sortOrder: item.sortOrder,
              updatedBy: new mongoose.Types.ObjectId(userId),
              dateUpdate: new Date(),
            },
          }
        )
      )
    );

    return this.findAdminTabs();
  }

  async findGlobalTabs() {
    const tabs = await this.tabModel
      .find(
        {
          isAdminCreated: true,
          isGlobal: true,
          isActive: true,
        },
        this.getAdminListProjection()
      )
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return { items: tabs };
  }

  async findHomeTabs() {
    return this.findGlobalTabs();
  }
}
