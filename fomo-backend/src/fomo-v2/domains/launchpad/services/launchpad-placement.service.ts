import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { FomoV2CanonicalProject } from "../../../models";
import {
  FomoV2LaunchpadPlacementAdminQueryDto,
  FomoV2LaunchpadPlacementBannerDto,
  FomoV2LaunchpadPlacementPatchDto,
  FomoV2LaunchpadPlacementPublicQueryDto,
  FomoV2LaunchpadPlacementUpsertDto,
} from "../dto";
import { FomoV2LaunchpadPlacement, FomoV2LaunchpadPool } from "../models";

@Injectable()
export class FomoV2LaunchpadPlacementService {
  constructor(
    @InjectModel(FomoV2LaunchpadPlacement.name)
    private readonly placementModel: Model<FomoV2LaunchpadPlacement>,
    @InjectModel(FomoV2LaunchpadPool.name)
    private readonly poolModel: Model<FomoV2LaunchpadPool>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>
  ) {}

  async listAdmin(query: FomoV2LaunchpadPlacementAdminQueryDto = {}) {
    const limit = query.limit || 30;
    const offset = query.offset || 0;
    const filter: Record<string, any> = {};
    if (query.surface) filter.surface = query.surface;
    if (
      query.poolId &&
      query.launchpadPoolId &&
      query.poolId !== query.launchpadPoolId
    ) {
      throw new BadRequestException(
        "poolId and launchpadPoolId must identify the same pool."
      );
    }
    const requestedPoolId = query.poolId || query.launchpadPoolId;
    if (requestedPoolId) {
      filter.launchpadPoolId = new Types.ObjectId(requestedPoolId);
    }
    if (query.enabled !== undefined) filter.enabled = query.enabled;

    const [total, placements] = await Promise.all([
      this.placementModel.countDocuments(filter),
      this.placementModel
        .find(filter)
        .sort({ surface: 1, featured: -1, ad: -1, sortOrder: 1, _id: 1 })
        .skip(offset)
        .limit(limit)
        .lean(),
    ]);
    const { pools, canonicalProjects } = await this.loadRelations(placements);

    return {
      items: placements.map((placement: any) => {
        const pool = pools.get(String(placement.launchpadPoolId));
        const canonicalProject = pool
          ? canonicalProjects.get(String(pool.canonicalProjectId))
          : undefined;
        return this.presentPlacement(placement, pool, canonicalProject, true);
      }),
      total,
      limit,
      offset,
    };
  }

  async upsert(input: FomoV2LaunchpadPlacementUpsertDto, user?: any) {
    const launchpadPoolId = this.toObjectId(
      input.launchpadPoolId,
      "Launchpad pool not found."
    );
    const pool = await this.poolModel.findById(launchpadPoolId).lean();
    if (!pool) throw new NotFoundException("Launchpad pool not found.");
    if (!input.banner) {
      throw new BadRequestException(
        "A desktop banner is required for an explicit page placement."
      );
    }

    const actor = this.actor(user);
    const set: Record<string, any> = { updatedBy: actor };
    this.assignEditableFields(set, input);
    if (input.featured === true) {
      await this.placementModel.updateMany(
        {
          surface: input.surface,
          featured: true,
          launchpadPoolId: { $ne: launchpadPoolId },
        },
        { $set: { featured: false, updatedBy: actor } }
      );
    }

    let placement: any;
    try {
      placement = await this.placementModel.findOneAndUpdate(
        { launchpadPoolId, surface: input.surface },
        {
          $set: set,
          $setOnInsert: {
            launchpadPoolId,
            surface: input.surface,
            createdBy: actor,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException(
          "This launchpad pool already has a placement on this surface."
        );
      }
      throw error;
    }
    if (!placement) {
      throw new ConflictException("Launchpad placement could not be saved.");
    }

    const canonicalProject = await this.canonicalProjectModel
      .findById(pool.canonicalProjectId)
      .lean();
    return {
      placement: this.presentPlacement(
        this.asPlain(placement),
        pool,
        canonicalProject,
        true
      ),
    };
  }

  async patch(id: string, input: FomoV2LaunchpadPlacementPatchDto, user?: any) {
    const placementId = this.toObjectId(id, "Launchpad placement not found.");
    const set: Record<string, any> = { updatedBy: this.actor(user) };
    this.assignEditableFields(set, input);
    if (Object.keys(set).length === 1) {
      throw new BadRequestException("No placement changes were provided.");
    }

    if (input.featured === true) {
      const current = await this.placementModel.findById(placementId).lean();
      if (!current) throw new NotFoundException("Launchpad placement not found.");
      await this.placementModel.updateMany(
        { surface: current.surface, featured: true, _id: { $ne: placementId } },
        { $set: { featured: false, updatedBy: this.actor(user) } }
      );
    }
    let placement: any;
    try {
      placement = await this.placementModel.findByIdAndUpdate(
        placementId,
        { $set: set },
        { new: true, runValidators: true }
      );
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictException("This surface already has a featured project.");
      }
      throw error;
    }
    if (!placement)
      throw new NotFoundException("Launchpad placement not found.");

    const pool = await this.poolModel
      .findById(placement.launchpadPoolId)
      .lean();
    const canonicalProject = pool
      ? await this.canonicalProjectModel
          .findById(pool.canonicalProjectId)
          .lean()
      : undefined;
    return {
      placement: this.presentPlacement(
        this.asPlain(placement),
        pool,
        canonicalProject,
        true
      ),
    };
  }

  async remove(id: string, user?: any) {
    const placementId = this.toObjectId(id, "Launchpad placement not found.");
    const placement = await this.placementModel.findById(placementId).lean();
    if (!placement)
      throw new NotFoundException("Launchpad placement not found.");

    const result = await this.placementModel.deleteOne({ _id: placementId });
    if (result.deletedCount !== 1) {
      throw new ConflictException("Launchpad placement was not deleted.");
    }
    return {
      deleted: true,
      id: String(placementId),
      audit: { deletedBy: this.actor(user), deletedAt: new Date() },
    };
  }

  async listPublic(query: FomoV2LaunchpadPlacementPublicQueryDto) {
    const limit = query.limit || 30;
    const offset = query.offset || 0;
    const [result] = await this.placementModel.aggregate([
      {
        $match: {
          surface: query.surface,
          enabled: true,
          "banner.desktopUrl": { $type: "string", $regex: /\S/ },
        },
      },
      {
        $lookup: {
          from: "launchpad_pools",
          localField: "launchpadPoolId",
          foreignField: "_id",
          as: "pool",
        },
      },
      { $unwind: "$pool" },
      {
        $match: {
          "pool.status": { $in: ["active", "closed"] },
          "pool.publicationStatus": "published",
          "pool.poolId": { $type: "string", $ne: "" },
        },
      },
      {
        $lookup: {
          from: "canonical_projects",
          localField: "pool.canonicalProjectId",
          foreignField: "_id",
          as: "canonicalProject",
        },
      },
      { $unwind: "$canonicalProject" },
      {
        $sort: {
          featured: -1,
          ad: -1,
          sortOrder: 1,
          _id: 1,
        },
      },
      {
        $facet: {
          items: [{ $skip: offset }, { $limit: limit }],
          count: [{ $count: "total" }],
        },
      },
    ]);

    const rows = result?.items || [];
    return {
      items: rows.map((row: any) =>
        this.presentPlacement(row, row.pool, row.canonicalProject, false)
      ),
      total: result?.count?.[0]?.total || 0,
      limit,
      offset,
    };
  }

  private async loadRelations(placements: any[]) {
    const poolIds = [
      ...new Set(
        placements
          .map((placement) => String(placement.launchpadPoolId || ""))
          .filter(Boolean)
      ),
    ];
    const poolRows = poolIds.length
      ? await this.poolModel.find({ _id: { $in: poolIds } }).lean()
      : [];
    const pools = new Map(
      poolRows.map((pool: any) => [String(pool._id), pool])
    );
    const canonicalProjectIds = [
      ...new Set(
        poolRows
          .map((pool: any) => String(pool.canonicalProjectId || ""))
          .filter(Boolean)
      ),
    ];
    const canonicalProjectRows = canonicalProjectIds.length
      ? await this.canonicalProjectModel
          .find({ _id: { $in: canonicalProjectIds } })
          .lean()
      : [];
    const canonicalProjects = new Map(
      canonicalProjectRows.map((project: any) => [String(project._id), project])
    );
    return { pools, canonicalProjects };
  }

  private assignEditableFields(
    target: Record<string, any>,
    input: FomoV2LaunchpadPlacementUpsertDto | FomoV2LaunchpadPlacementPatchDto
  ): void {
    if (input.enabled !== undefined) target.enabled = input.enabled;
    if (input.featured !== undefined) target.featured = input.featured;
    if (input.ad !== undefined) target.ad = input.ad;
    if (input.sortOrder !== undefined) target.sortOrder = input.sortOrder;
    if (input.banner !== undefined) {
      target.banner = this.sanitizeBanner(input.banner);
    }
  }

  private sanitizeBanner(
    banner: FomoV2LaunchpadPlacementBannerDto
  ): Record<string, string> {
    const output: Record<string, string> = {};
    for (const key of ["desktopUrl", "mobileUrl", "linkUrl"] as const) {
      const value = this.cleanString(banner?.[key]);
      if (!value) continue;
      if (!/^(?:https?:\/\/|\/(?!\/))/i.test(value)) {
        throw new BadRequestException(
          `${key} must be an absolute HTTP(S) URL or a root-relative path.`
        );
      }
      if (value.length > 2048) {
        throw new BadRequestException(`${key} exceeds 2048 characters.`);
      }
      output[key] = value;
    }
    if (!output.desktopUrl) {
      throw new BadRequestException(
        "banner.desktopUrl is required for an explicit page placement."
      );
    }
    const alt = this.cleanString(banner?.alt);
    if (alt) {
      if (alt.length > 500) {
        throw new BadRequestException("banner.alt exceeds 500 characters.");
      }
      output.alt = alt;
    }
    return output;
  }

  private presentPlacement(
    placement: any,
    pool: any,
    canonicalProject: any,
    includeAudit: boolean
  ) {
    const response: Record<string, any> = {
      id: String(placement._id),
      launchpadPoolId: String(placement.launchpadPoolId),
      surface: placement.surface,
      enabled: Boolean(placement.enabled),
      featured: Boolean(placement.featured),
      ad: Boolean(placement.ad),
      sortOrder: Number(placement.sortOrder || 0),
      banner: placement.banner || {},
      pool: pool ? this.presentPool(pool) : undefined,
      canonicalProject: canonicalProject
        ? this.presentCanonicalProject(canonicalProject)
        : undefined,
    };
    if (includeAudit) {
      response.createdBy = placement.createdBy;
      response.updatedBy = placement.updatedBy;
      response.createdAt = placement.createdAt;
      response.updatedAt = placement.updatedAt;
    }
    return response;
  }

  private presentPool(pool: any) {
    return {
      id: String(pool._id),
      canonicalProjectId: String(pool.canonicalProjectId),
      status: pool.status,
      publicationStatus: pool.publicationStatus,
      chainId: pool.chainId,
      launchpadAddress: pool.launchpadAddress,
      poolId: pool.poolId,
      createParams: pool.createParams || {},
      metadata: pool.metadata || {},
      onchainState: pool.onchainState || {},
      publishedAt: pool.publishedAt,
    };
  }

  private presentCanonicalProject(project: any) {
    const metadata = project.metadata || {};
    return {
      id: String(project._id),
      name: project.name,
      slug: project.slug,
      symbol: project.symbol,
      status: project.status,
      logo: metadata.logo,
      website:
        metadata.website ||
        (project.primaryWebsiteDomain
          ? `https://${project.primaryWebsiteDomain}`
          : undefined),
      description: metadata.description,
      metadata,
      createdForLaunchpad: Boolean(project.createdForLaunchpad),
    };
  }

  private toObjectId(value: string, notFoundMessage: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new NotFoundException(notFoundMessage);
    }
    return new Types.ObjectId(value);
  }

  private asPlain(value: any): any {
    return value && typeof value.toObject === "function"
      ? value.toObject()
      : value;
  }

  private actor(user: any): string {
    return (
      this.cleanString(user?._id || user?.id || user?.sub || user?.email) ||
      "admin"
    );
  }

  private cleanString(value: unknown): string | undefined {
    const text = typeof value === "string" ? value.trim() : "";
    return text || undefined;
  }
}
