import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  normalizeProjectSourceType,
  projectSourceTypeMongoPattern,
} from "../../../shared/source-policy";
import { FomoV2ReviewBatch } from "../../review/models/review-batch.model";
import { FomoV2ProjectSourceProfile } from "../../project-profiles";
import { FOMO_V2_PARSER_DB_CONNECTION } from "../ico-parser-db.constants";
import {
  FomoV2IcoProjectReadModel,
  FomoV2IcoProjectSource,
} from "../models";

export interface IcoProjectProfileAuditResult {
  runner: "fomo-v2:ico-project-profile-audit";
  mode: "read-only";
  dbName: string;
  parserDbName: string;
  generatedAt: string;
  duplicatesByCanonicalProjectAndSourceType: any[];
  profilesWithoutCanonicalProjectId: number;
  readModelsWithoutCanonicalProjectId: number;
  reviewCountsByReason: any[];
  profileCoverage: {
    sourceType: string;
    sourceProjects: number;
    projectSourceProfiles: number;
    icoProjectReadModels: number;
    linkedCanonicalProjects: number;
    coveragePercent: number;
  };
  READ_ONLY: "YES";
  WRITES_PERFORMED: 0;
}

@Injectable()
export class IcoProjectProfileAuditService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(FomoV2IcoProjectSource.name, FOMO_V2_PARSER_DB_CONNECTION)
    private readonly icoProjectSourceModel: Model<FomoV2IcoProjectSource>,
    @InjectModel(FomoV2ProjectSourceProfile.name)
    private readonly projectSourceProfileModel: Model<FomoV2ProjectSourceProfile>,
    @InjectModel(FomoV2IcoProjectReadModel.name)
    private readonly icoProjectReadModel: Model<FomoV2IcoProjectReadModel>,
    @InjectModel(FomoV2ReviewBatch.name)
    private readonly reviewBatchModel: Model<FomoV2ReviewBatch>,
  ) {}

  async run(sourceType = "icodrops"): Promise<IcoProjectProfileAuditResult> {
    const normalizedSourceType = normalizeProjectSourceType(
      sourceType || "icodrops"
    );
    const [
      duplicatesByCanonicalProjectAndSourceType,
      profilesWithoutCanonicalProjectId,
      readModelsWithoutCanonicalProjectId,
      reviewCountsByReason,
      sourceProjects,
      projectSourceProfiles,
      icoProjectReadModels,
      linkedCanonicalProjectIds,
    ] = await Promise.all([
      this.projectSourceProfileModel.aggregate([
        {
          $group: {
            _id: {
              canonicalProjectId: "$canonicalProjectId",
              sourceType: "$sourceType",
            },
            count: { $sum: 1 },
            ids: { $push: "$_id" },
          },
        },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.projectSourceProfileModel.countDocuments({
        $or: [
          { canonicalProjectId: { $exists: false } },
          { canonicalProjectId: null },
        ],
      }),
      this.icoProjectReadModel.countDocuments({
        $or: [
          { canonicalProjectId: { $exists: false } },
          { canonicalProjectId: null },
        ],
      }),
      this.reviewBatchModel.aggregate([
        {
          $match: {
            domain: "ico",
            reason: {
              $in: ["POTENTIAL_PROJECT_MATCH", "NEW_PROJECT_CANDIDATE"],
            },
          },
        },
        {
          $group: {
            _id: { reason: "$reason", status: "$status" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.reason": 1, "_id.status": 1 } },
      ]),
      this.icoProjectSourceModel.countDocuments(this.sourceQuery(normalizedSourceType)),
      this.projectSourceProfileModel.countDocuments({
        sourceType: projectSourceTypeMongoPattern(normalizedSourceType),
      }),
      this.icoProjectReadModel.countDocuments({
        sourceType: projectSourceTypeMongoPattern(normalizedSourceType),
      }),
      this.projectSourceProfileModel.distinct("canonicalProjectId", {
        sourceType: projectSourceTypeMongoPattern(normalizedSourceType),
      }),
    ]);

    return {
      runner: "fomo-v2:ico-project-profile-audit",
      mode: "read-only",
      dbName: this.dbName(),
      parserDbName: this.parserDbName(),
      generatedAt: new Date().toISOString(),
      duplicatesByCanonicalProjectAndSourceType,
      profilesWithoutCanonicalProjectId,
      readModelsWithoutCanonicalProjectId,
      reviewCountsByReason,
      profileCoverage: {
        sourceType: normalizedSourceType,
        sourceProjects,
        projectSourceProfiles,
        icoProjectReadModels,
        linkedCanonicalProjects: linkedCanonicalProjectIds.length,
        coveragePercent: sourceProjects
          ? Math.round((projectSourceProfiles / sourceProjects) * 10000) / 100
          : 0,
      },
      READ_ONLY: "YES",
      WRITES_PERFORMED: 0,
    };
  }

  private sourceQuery(sourceType: string): Record<string, any> {
    return { source: projectSourceTypeMongoPattern(sourceType) };
  }

  private dbName(): string {
    return (
      String(this.configService.get("DB_NAME") || process.env.DB_NAME || "fomoland").trim() ||
      "fomoland"
    );
  }

  private parserDbName(): string {
    return (
      String(
        this.configService.get("DB_PARSER_NAME") ||
          process.env.DB_PARSER_NAME ||
          this.dbName(),
      ).trim() || this.dbName()
    );
  }
}
