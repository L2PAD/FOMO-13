import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Project,
  ProjectDocument,
} from "src/projects/project.model";

/** Historical helpers replaced by FomoV2MarketProjectReadModelService. */
@Injectable()
export class LegacyProjectMarketReadHelpersService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async getCurrentPrices(projectIds: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    const uniqueProjectIds = [...new Set(projectIds)].filter((id) =>
      Types.ObjectId.isValid(id),
    );
    if (!uniqueProjectIds.length) return prices;

    const projects = await this.projectModel
      .find({ _id: { $in: uniqueProjectIds.map((id) => new Types.ObjectId(id)) } })
      .select("_id price")
      .lean();

    for (const project of projects) prices[project._id.toString()] = project.price || 0;
    return prices;
  }

  async getMainCategories(projectIds: string[]): Promise<Record<string, string>> {
    const categories: Record<string, string> = {};
    const uniqueProjectIds = [...new Set(projectIds)].filter((id) =>
      Types.ObjectId.isValid(id),
    );
    if (!uniqueProjectIds.length) return categories;

    const projects = await this.projectModel
      .find({ _id: { $in: uniqueProjectIds.map((id) => new Types.ObjectId(id)) } })
      .select("_id mainCategory")
      .lean();

    for (const project of projects) {
      categories[project._id.toString()] = project.mainCategory?.name || "";
    }
    return categories;
  }

  async getBTCAndETHPrices(): Promise<{ btcPrice: number; ethPrice: number }> {
    const [btcProject, ethProject] = await Promise.all([
      this.projectModel
        .findOne({ $or: [{ niche: "BTC" }, { symbol: "BTC" }, { ticker: "BTC" }] })
        .select({ price: 1 })
        .lean(),
      this.projectModel
        .findOne({ $or: [{ niche: "ETH" }, { symbol: "ETH" }, { ticker: "ETH" }] })
        .select({ price: 1 })
        .lean(),
    ]);

    return {
      btcPrice: btcProject?.price || 1,
      ethPrice: ethProject?.price || 1,
    };
  }
}
