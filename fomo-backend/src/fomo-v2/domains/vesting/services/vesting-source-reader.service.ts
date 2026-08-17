import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { FOMO_V2_PARSER_DB_CONNECTION } from "../../ico";
import {
  buildDropstabVestingQuery,
  DropstabVestingSourceFilters,
  normalizeDropstabSourceType,
} from "../helpers";
import { FomoV2DropstabVestingSource } from "../models";

export interface FomoV2VestingSourceReaderOptions
  extends DropstabVestingSourceFilters {
  limit?: number;
  all?: boolean;
}

@Injectable()
export class FomoV2VestingSourceReaderService {
  constructor(
    @InjectModel(FomoV2DropstabVestingSource.name, FOMO_V2_PARSER_DB_CONNECTION)
    private readonly dropstabVestingSourceModel: Model<FomoV2DropstabVestingSource>
  ) {}

  countSourceProjects(sourceType = "dropstab"): Promise<number> {
    return this.dropstabVestingSourceModel.countDocuments({
      source: normalizeDropstabSourceType(sourceType),
    }).exec();
  }

  countEligible(options: FomoV2VestingSourceReaderOptions = {}): Promise<number> {
    return this.dropstabVestingSourceModel.countDocuments(
      this.query(options)
    ).exec();
  }

  findEligible(options: FomoV2VestingSourceReaderOptions = {}): any {
    let query = this.dropstabVestingSourceModel
      .find(this.query(options))
      .sort({ _id: 1 })
      .lean();
    if (!options.all && options.limit !== undefined) {
      query = query.limit(options.limit);
    }
    return query.cursor();
  }

  query(options: FomoV2VestingSourceReaderOptions = {}): Record<string, any> {
    return buildDropstabVestingQuery({
      sourceType: options.sourceType,
      sourceSlug: options.sourceSlug,
      sourceProjectKey: options.sourceProjectKey,
    });
  }
}
