import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  Project,
  ProjectDocument,
} from "src/projects/project.model";

/**
 * Historical command handler retained for reference only.
 *
 * Market sponsorship, sandbox and carousel state now belongs to fomo_v2 read
 * model materialization and is no longer mutable through `/projects`.
 */
@Injectable()
export class LegacyProjectMarketAdminFlagsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async updateSponsoredStatus(id: string) {
    const project = await this.projectModel.findById(id);
    project.isSponsored = !project.isSponsored;
    return project.save();
  }

  async updateSandboxStatus(id: string) {
    const project = await this.projectModel.findById(id);
    project.isSandbox = !project.isSandbox;
    return project.save();
  }

  async updateEralashStatus(id: string) {
    const project = await this.projectModel.findById(id);
    project.isEralash = !project.isEralash;
    project.eralashAdded = new Date();
    return project.save();
  }
}
