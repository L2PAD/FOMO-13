import { Injectable, NotFoundException } from "@nestjs/common";
import mongoose, { Model } from "mongoose";
import { InjectModel } from "@nestjs/mongoose";
import { Asset, AssetDocument } from "./models/asset.model";
import { CreateAssetDto, UpdateAssetDto } from "./dto/create-asset.dto";
import { FilesService } from "../files/files.service";
import { UserService } from "src/user/user.service";
import { FomoV2MarketProjectReadModelService } from "src/fomo-v2/domains/market/services";

export interface PortfolioAssetSearchResult {
  _id: any;
  projectId: any;
  marketAssetId: any;
  canonicalProjectId?: any;
  type: "buy";
  name: string;
  ticker: string;
  price: number;
  logo: string;
  amount: number;
  totalPrice: number;
  date: Date;
  createAt: Date;
  isSelectedAsset: false;
  projectData: any;
}

@Injectable()
export class AssetsService {
  constructor(
    @InjectModel(Asset.name) private assetModel: Model<AssetDocument>,
    private readonly filesService: FilesService,
    private readonly userService: UserService,
    private readonly marketProjectReadModelService: FomoV2MarketProjectReadModelService
  ) {}

  async create(createAssetDto: CreateAssetDto): Promise<Asset> {
    const logo: string = !createAssetDto.isSelectedAsset
      ? await this.filesService.writeBase64File(createAssetDto.logo)
      : createAssetDto.logo;

    const newAsset = new this.assetModel({
      ...createAssetDto,
      logo,
      creator: new mongoose.Types.ObjectId(createAssetDto.creator),
    });

    await this.userService.addToPortfolio(
      new mongoose.Types.ObjectId(createAssetDto.creator),
      newAsset._id
    );

    return newAsset.save();
  }

  async findAllPaginated(
    _page: number,
    _limit: number,
    searchValue?: string
  ): Promise<PortfolioAssetSearchResult[]> {
    const projects = await this.marketProjectReadModelService.searchPortfolioAssets(
      searchValue,
      20
    );

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

  async findOne(id: string): Promise<Asset> {
    const asset = await this.assetModel.findById(id).exec();
    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }
    return asset;
  }

  async update(id: string, updateAssetDto: UpdateAssetDto): Promise<Asset> {
    const updatedAsset = await this.assetModel
      .findByIdAndUpdate(id, updateAssetDto, { new: true })
      .exec();
    if (!updatedAsset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }
    return updatedAsset;
  }

  async remove(id: string): Promise<void> {
    const result = await this.assetModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }
  }
}
