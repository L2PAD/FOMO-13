import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { FilesService } from "src/files/files.service";
import { CreateTabDto, UpdateTabDto } from "src/tabs/dto/tab.dto";
import { CryptoTab, TabDocument } from "src/tabs/model/tab.model";
import { User, UserDocument } from "src/user/user.model";
import { FomoV2MarketProjectReadModel } from "../../market/models";
import { FomoV2MarketProjectReadModelService } from "../../market/services";

type TabListType = "saved" | "explore tabs" | "created" | "public by user";

@Injectable()
export class FomoV2TabsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(CryptoTab.name) private readonly tabModel: Model<TabDocument>,
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly marketReadModel: Model<FomoV2MarketProjectReadModel>,
    private readonly marketReadService: FomoV2MarketProjectReadModelService,
    private readonly filesService: FilesService
  ) {}

  private readonly projectFieldMap: Record<string, string | null> = {
    usdPrice: "price",
    btcPrice: "priceBTC",
    ethPrice: "priceETH",
    priceChange1h: "usdQuote.percent_change_1h",
    priceChange24h: "usdQuote.percent_change_24h",
    priceChange7d: "usdQuote.percent_change_7d",
    priceChange1m: "performance.usd.change30d",
    priceChange3m: "performance.usd.change90d",
    priceChange6m: null,
    priceChange1y: "performance.usd.change1y",
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
    fromAth: "athUsdChangePercent",
    atlPrice: "atlUsd",
    atlDate: "atlUsdDate",
    fromAtl: "atlUsdChangePercent",
    icoPlatform: "fundraising.platform",
    investors: "investors",
    usdRoi: "xfromIco",
    btcRoi: null,
    ethRoi: null,
    unlockProgress: null,
    nextUnlock: null,
    nextUnlockDate: null,
    totalFundsRaised: "totalRaised",
    category: "niche",
    exchanges: "exchange",
    performance: "performance",
    bullishPeriod: null,
    launchDate: "dateAdded",
  };

  private readonly customTabFallbackFieldMap: Record<string, string[]> = {
    usdPrice: ["usdQuote.price"],
    btcPrice: ["btcQuote.price"],
    ethPrice: ["ethQuote.price"],
    priceChange24h: ["priceChange24h", "priceChange"],
    chart7d: ["history"],
    fromAth: ["athUsdChangePercent"],
    fromAtl: ["atlUsdChangePercent"],
    totalFundsRaised: ["totalRaised"],
    category: ["category", "type"],
  };

  private readonly baseCustomTabProjectFields: Record<string, 1> = {
    _id: 1,
    name: 1,
    symbol: 1,
    ticker: 1,
    logo: 1,
    niche: 1,
    category: 1,
    price: 1,
    priceBTC: 1,
    priceETH: 1,
    priceChange: 1,
    priceChange24h: 1,
    "usdQuote.percent_change_1h": 1,
    "usdQuote.percent_change_24h": 1,
    "usdQuote.percent_change_7d": 1,
    marketAssetId: 1,
    canonicalProjectId: 1,
    projectType: 1,
    projectStatus: 1,
    circulatingSupplyPercent: 1,
  };

  private parseArrayToObjectId(items?: Array<string>): Array<mongoose.Types.ObjectId> {
    if (!Array.isArray(items)) return [];

    return items
      .map((id) => String(id || "").trim())
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
  }

  private normalizeObjectIdStrings(items?: Array<any>): string[] {
    if (!Array.isArray(items)) return [];

    return items
      .map((item) => String(item?._id || item?.marketAssetId || item || ""))
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
    type: TabListType;
    subType?: string;
  }): any[] {
    const page = Math.max(Number(params.page) || 1, 1);
    const pageSize = Math.max(Number(params.limit) || 10, 1);
    const userObjectId = this.toObjectId(params.userId);
    const creatorObjectId = this.toObjectId(params.creatorId);
    const subType = this.normalizeSubtype(params.subType);
    const match: any = { isAdminCreated: { $ne: true } };

    if (params.search) {
      match.name = { $regex: params.search, $options: "i" };
    }

    if (params.type === "saved") match.saved = userObjectId;
    if (params.type === "explore tabs") match.isPublic = true;
    if (params.type === "created") match.creator = userObjectId;
    if (params.type === "public by user") {
      match.creator = creatorObjectId;
      match.isPublic = true;
    }

    const pipeline: any[] = [
      { $match: match },
      {
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
      },
      {
        $addFields: {
          canEdit: "$isCreator",
          canDelete: "$isCreator",
        },
      },
    ];

    if (params.type === "saved") {
      pipeline.push({ $sort: { isPinned: -1, dateUpdate: -1 } });
    } else if (subType === "trending tabs") {
      pipeline.push({ $sort: { savedCount: -1, dateUpdate: -1 } });
    } else {
      pipeline.push({ $sort: { dateUpdate: -1 } });
    }

    pipeline.push(
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
      },
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          items: [{ $skip: pageSize * (page - 1) }, { $limit: pageSize }],
        },
      }
    );

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
      tabs: items,
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

  private calculatePercentChange(current: any, target: any): number | undefined {
    const currentValue = this.toFiniteNumber(current);
    const targetValue = this.toFiniteNumber(target);
    if (currentValue === undefined || targetValue === undefined || targetValue <= 0) {
      return undefined;
    }

    return ((currentValue - targetValue) / targetValue) * 100;
  }

  private getProjectUsdPrice(project: any): number | undefined {
    return (
      this.toFiniteNumber(project.price) ??
      this.toFiniteNumber(this.getNestedValue(project, "usdQuote.price"))
    );
  }

  private getFundraisingPlatform(project: any): any {
    const fundraising = project?.fundraising;
    if (Array.isArray(fundraising)) {
      return fundraising.find((round) => round?.platform)?.platform;
    }

    return fundraising?.platform;
  }

  private createCustomTabValues(project: any, tabs: CryptoTab["tabs"]) {
    return (tabs || []).reduce((values: Record<string, any>, tab) => {
      const fieldValue = this.getCustomTabFieldPaths(tab.key).reduce(
        (resolvedValue: any, fieldPath: string) => {
          if (!this.isEmptyCustomTabValue(resolvedValue)) return resolvedValue;

          return this.getNestedValue(project, fieldPath);
        },
        undefined
      );

      if (tab.key === "usdPrice") {
        values[tab.key] = this.getProjectUsdPrice(project) ?? fieldValue;
        return values;
      }

      if (tab.key === "fromAth") {
        values[tab.key] =
          this.toFiniteNumber(project.athUsdChangePercent) ??
          this.calculatePercentChange(project.price, project.athUsd) ??
          fieldValue;
        return values;
      }

      if (tab.key === "fromAtl") {
        values[tab.key] =
          this.toFiniteNumber(project.atlUsdChangePercent) ??
          this.calculatePercentChange(project.price, project.atlUsd) ??
          fieldValue;
        return values;
      }

      if (tab.key === "icoPlatform") {
        values[tab.key] = this.getFundraisingPlatform(project) ?? fieldValue;
        return values;
      }

      values[tab.key] = fieldValue;
      return values;
    }, {});
  }

  private async resolveImageValue(
    image?: string,
    currentImage?: string
  ): Promise<string | undefined> {
    if (typeof image === "undefined") return currentImage;
    if (!image) return undefined;

    return image.startsWith("data:")
      ? await this.filesService.writeBase64File(image)
      : image;
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

  private isProjectIncluded(project: any, includedProjectIdSet: Set<string>): boolean {
    return [
      project?._id,
      project?.marketAssetId,
      project?.canonicalProjectId,
    ].some((id) => id && includedProjectIdSet.has(String(id)));
  }

  private async hydrateTabAssetRefs<T extends Record<string, any>>(
    tabs: T[]
  ): Promise<T[]> {
    const assetIds = Array.from(
      new Set(
        tabs.flatMap((tab) => [
          ...this.normalizeObjectIdStrings(tab.includedAssets),
          ...this.normalizeObjectIdStrings(tab.excludedAssets),
        ])
      )
    );

    if (!assetIds.length) return tabs;

    const objectIds = assetIds.map((id) => new mongoose.Types.ObjectId(id));
    const readModels = await this.marketReadModel
      .find(
        {
          $or: [
            { marketAssetId: { $in: objectIds } },
            { canonicalProjectId: { $in: objectIds } },
          ],
        },
        {
          marketAssetId: 1,
          canonicalProjectId: 1,
          name: 1,
          symbol: 1,
          logo: 1,
          price: 1,
          niche: 1,
          category: 1,
        }
      )
      .lean();

    const assetMap = new Map<string, any>();
    readModels.forEach((row: any) => {
      const marketAssetId = String(row.marketAssetId || "");
      const canonicalProjectId = String(row.canonicalProjectId || "");
      const assetRef = {
        _id: marketAssetId,
        projectId: marketAssetId,
        marketAssetId,
        canonicalProjectId: canonicalProjectId || undefined,
        type: "buy",
        name: row.name,
        ticker: row.symbol || row.niche || "",
        symbol: row.symbol,
        logo: row.logo || "",
        price: row.price || 0,
        amount: 0,
        totalPrice: 0,
        date: new Date(),
        createAt: new Date(),
        isSelectedAsset: false,
      };

      if (marketAssetId) assetMap.set(marketAssetId, assetRef);
      if (canonicalProjectId) {
        assetMap.set(canonicalProjectId, {
          ...assetRef,
          _id: canonicalProjectId,
        });
      }
    });

    const mapRefs = (items?: any[]) =>
      this.normalizeObjectIdStrings(items).map((id) => {
        return assetMap.get(id) || { _id: id, marketAssetId: id };
      });

    return tabs.map((tab) => ({
      ...tab,
      includedAssets: mapRefs(tab.includedAssets),
      excludedAssets: mapRefs(tab.excludedAssets),
    }));
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
    if (!tab) throw new NotFoundException("Tab not found");

    const userObjectId = this.toObjectId(userId);
    const isCreator = userObjectId && String(tab.creator) === String(userObjectId);
    const isPublicTab = Boolean(tab.isPublic || tab.isGlobal);
    const canAccessInactiveAdminTab = Boolean(tab.isAdminCreated) && isCreator;

    if (
      (!isPublicTab && !isCreator) ||
      (tab.isAdminCreated && !tab.isActive && !canAccessInactiveAdminTab)
    ) {
      throw new ForbiddenException("You do not have access to this tab");
    }

    const selectedFields = (tab.tabs || []).map((t) => t.key);
    const projection: any = { ...this.baseCustomTabProjectFields };

    selectedFields.forEach((item: string | null) => {
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
      includedProjectIds,
      excludedProjectIds,
    };

    const { projects, total } =
      await this.marketReadService.getCompatibleMarketProjects(projectsQuery, {
        fallback: "none",
      });

    const normalizedProjects = projects.map((project: any) => ({
      ...project,
      isIncludedAsset:
        Boolean(project.isIncludedAsset) ||
        this.isProjectIncluded(project, includedProjectIdSet),
      customTabValues: this.createCustomTabValues(project, tab.tabs || []),
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
    if (!tab) throw new NotFoundException("Tab not found");
    if (String(tab.creator) !== String(userId)) {
      throw new ForbiddenException("Only tab owner can update this tab");
    }

    const updatePayload: any = {
      ...updateTabDto,
      image: await this.resolveImageValue(updateTabDto.image, tab.image),
      dateUpdate: new Date(),
    };

    if (Array.isArray(updateTabDto.includedAssets)) {
      updatePayload.includedAssets = this.parseArrayToObjectId(
        updateTabDto.includedAssets
      );
    }

    if (Array.isArray(updateTabDto.excludedAssets)) {
      updatePayload.excludedAssets = this.parseArrayToObjectId(
        updateTabDto.excludedAssets
      );
    }

    return this.tabModel.findByIdAndUpdate(id, updatePayload, { new: true });
  }

  async remove(id: string, userId: string) {
    const objectId = new mongoose.Types.ObjectId(id);
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const tab = await this.tabModel.findById(objectId);
    if (!tab) throw new NotFoundException("Tab not found");

    const deletedTab = await this.tabModel.findOneAndDelete({
      _id: objectId,
      creator: userObjectId,
    });

    if (deletedTab) return { success: true, action: "deleted" };

    await this.tabModel.findOneAndUpdate(
      { _id: objectId },
      { $pull: { saved: userObjectId, pined: userObjectId } },
      { new: true }
    );

    return { success: true, action: "unsaved" };
  }

  async saveTab(id: string, userId: string) {
    const tab = await this.tabModel.findById(id);
    if (!tab) throw new NotFoundException("Tab not found");

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const isSaved = tab.saved?.some((savedId) => savedId.equals(userObjectId));

    if (isSaved) {
      const updatedTab = await this.tabModel.findByIdAndUpdate(
        id,
        { $pull: { saved: userObjectId, pined: userObjectId } },
        { new: true }
      );

      return { success: true, isSaved: false, tab: updatedTab };
    }

    const updatedTab = await this.tabModel.findByIdAndUpdate(
      id,
      { $addToSet: { saved: userObjectId } },
      { new: true }
    );

    return { success: true, isSaved: true, tab: updatedTab };
  }

  async pinTab(id: string, userId: string) {
    const tab = await this.tabModel.findById(id);
    if (!tab) throw new NotFoundException("Tab not found");

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const isSaved = tab.saved?.some((savedId) => savedId.equals(userObjectId));
    const isPinned = tab.pined?.some((pinedId) => pinedId.equals(userObjectId));

    if (!isSaved) throw new BadRequestException("Only saved tabs can be pinned");

    if (isPinned) {
      const updatedTab = await this.tabModel.findByIdAndUpdate(
        id,
        { $pull: { pined: userObjectId } },
        { new: true }
      );

      return { success: true, isPinned: false, tab: updatedTab };
    }

    const updatedTab = await this.tabModel.findByIdAndUpdate(
      id,
      { $addToSet: { pined: userObjectId } },
      { new: true }
    );

    return { success: true, isPinned: true, tab: updatedTab };
  }

  async findSaved(params: {
    search?: string;
    page?: number;
    limit?: number;
    userId: string;
    type: "saved" | "explore tabs";
    subType?: string;
  }) {
    const result = await this.tabModel.aggregate(this.buildFindTabsPipeline(params));
    const response = this.normalizeListResponse(result, params.page, params.limit);
    const items = await this.hydrateTabAssetRefs(response.items);

    return { ...response, items, tabs: items };
  }

  async findCreated(params: {
    search?: string;
    page?: number;
    limit?: number;
    userId: string;
  }) {
    const result = await this.tabModel.aggregate(
      this.buildFindTabsPipeline({ ...params, type: "created" })
    );
    const response = this.normalizeListResponse(result, params.page, params.limit);
    const items = await this.hydrateTabAssetRefs(response.items);

    return { ...response, items, tabs: items };
  }

  async findPublicByUser(params: {
    search?: string;
    page?: number;
    limit?: number;
    userId?: string;
    creatorId: string;
  }) {
    const result = await this.tabModel.aggregate(
      this.buildFindTabsPipeline({ ...params, type: "public by user" })
    );
    const response = this.normalizeListResponse(result, params.page, params.limit);
    const items = await this.hydrateTabAssetRefs(response.items);

    return { ...response, items, tabs: items };
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
    const items = await this.hydrateTabAssetRefs(tabs);

    return { items, tabs: items };
  }

  async findHomeTabs() {
    return this.findGlobalTabs();
  }
}
