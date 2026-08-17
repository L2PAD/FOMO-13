import { BadRequestException } from "@nestjs/common";
import { Types } from "mongoose";
import { FomoV2LaunchpadPlacementSchema } from "../models";
import { FomoV2LaunchpadPlacementService } from "./launchpad-placement.service";

const placementId = new Types.ObjectId("507f1f77bcf86cd799439011");
const poolId = new Types.ObjectId("507f1f77bcf86cd799439012");
const projectId = new Types.ObjectId("507f1f77bcf86cd799439013");

const pool = {
  _id: poolId,
  canonicalProjectId: projectId,
  status: "active",
  publicationStatus: "published",
  chainId: 97,
  launchpadAddress: "0x0608b52aac58e7313481d0809e8b4525bdd11d33",
  poolId: "7",
  createParams: { targetAmount: "1000000000000000000000" },
  metadata: { cardLabel: "IDO" },
  onchainState: { raisedAmount: "10" },
};

const canonicalProject = {
  _id: projectId,
  name: "Launch Project",
  slug: "launch-project",
  symbol: "LP",
  status: "active",
  metadata: {
    logo: "https://cdn.example/logo.png",
    website: "https://project.example",
    description: "Project description",
  },
};

function createService(overrides: Record<string, any> = {}) {
  const placementModel = {
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
    updateMany: jest.fn().mockResolvedValue({ modifiedCount: 0 }),
    findByIdAndUpdate: jest.fn(),
    findById: jest.fn(),
    deleteOne: jest.fn(),
    ...overrides.placementModel,
  };
  const poolModel = {
    findById: jest.fn(),
    find: jest.fn(),
    ...overrides.poolModel,
  };
  const canonicalProjectModel = {
    findById: jest.fn(),
    find: jest.fn(),
    ...overrides.canonicalProjectModel,
  };
  return {
    service: new FomoV2LaunchpadPlacementService(
      placementModel as any,
      poolModel as any,
      canonicalProjectModel as any
    ),
    placementModel,
    poolModel,
    canonicalProjectModel,
  };
}

describe("FomoV2LaunchpadPlacementService", () => {
  it("declares one placement per pool and surface with explicit public indexes", () => {
    const indexes = FomoV2LaunchpadPlacementSchema.indexes();

    expect(indexes).toEqual(
      expect.arrayContaining([
        [
          { launchpadPoolId: 1, surface: 1 },
          expect.objectContaining({
            unique: true,
            name: "uniq_launchpad_placement_pool_surface",
          }),
        ],
        [
          { surface: 1 },
          expect.objectContaining({
            unique: true,
            name: "uniq_launchpad_featured_placement_surface",
          }),
        ],
        [
          expect.objectContaining({ surface: 1, enabled: 1, sortOrder: 1 }),
          expect.objectContaining({
            name: "idx_launchpad_placements_public_surface_order",
          }),
        ],
      ])
    );
  });

  it("publicly reads only explicit placements backed by active published pools", async () => {
    const row = {
      _id: placementId,
      launchpadPoolId: poolId,
      surface: "launchpad",
      enabled: true,
      featured: true,
      ad: false,
      sortOrder: 5,
      banner: { desktopUrl: "https://cdn.example/banner.png" },
      pool,
      canonicalProject,
    };
    const { service, placementModel } = createService({
      placementModel: {
        aggregate: jest
          .fn()
          .mockResolvedValue([{ items: [row], count: [{ total: 1 }] }]),
      },
    });

    const result = await service.listPublic({
      surface: "launchpad",
      limit: 10,
      offset: 0,
    });

    const pipeline = placementModel.aggregate.mock.calls[0][0];
    expect(pipeline[0]).toEqual({
      $match: {
        surface: "launchpad",
        enabled: true,
        "banner.desktopUrl": { $type: "string", $regex: /\S/ },
      },
    });
    expect(pipeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          $lookup: expect.objectContaining({ from: "launchpad_pools" }),
        }),
        {
          $match: {
          "pool.status": { $in: ["active", "closed"] },
            "pool.publicationStatus": "published",
            "pool.poolId": { $type: "string", $ne: "" },
          },
        },
      ])
    );
    expect(result).toMatchObject({
      total: 1,
      items: [
        {
          surface: "launchpad",
          featured: true,
          pool: { id: String(poolId), poolId: "7" },
          canonicalProject: { name: "Launch Project" },
        },
      ],
    });
  });

  it("upserts independently by pool and surface and records the admin actor", async () => {
    const savedPlacement = {
      _id: placementId,
      launchpadPoolId: poolId,
      surface: "crypto_projects",
      enabled: true,
      featured: false,
      ad: true,
      sortOrder: 20,
      banner: { desktopUrl: "/uploads/project-banner.png" },
      createdBy: "admin-7",
      updatedBy: "admin-7",
      toObject() {
        return { ...this, toObject: undefined };
      },
    };
    const { service, placementModel } = createService({
      placementModel: {
        findOneAndUpdate: jest.fn().mockResolvedValue(savedPlacement),
      },
      poolModel: {
        findById: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(pool),
        }),
      },
      canonicalProjectModel: {
        findById: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(canonicalProject),
        }),
      },
    });

    const result = await service.upsert(
      {
        launchpadPoolId: String(poolId),
        surface: "crypto_projects",
        enabled: true,
        ad: true,
        sortOrder: 20,
        banner: { desktopUrl: "/uploads/project-banner.png" },
      },
      { _id: "admin-7" }
    );

    expect(placementModel.findOneAndUpdate).toHaveBeenCalledWith(
      { launchpadPoolId: poolId, surface: "crypto_projects" },
      expect.objectContaining({
        $set: expect.objectContaining({ updatedBy: "admin-7", ad: true }),
        $setOnInsert: expect.objectContaining({ createdBy: "admin-7" }),
      }),
      expect.objectContaining({ upsert: true, new: true })
    );
    expect(result.placement).toMatchObject({
      surface: "crypto_projects",
      ad: true,
      updatedBy: "admin-7",
    });
  });

  it("demotes the previous featured project on the same surface", async () => {
    const savedPlacement = {
      _id: placementId,
      launchpadPoolId: poolId,
      surface: "launchpad",
      enabled: true,
      featured: true,
      ad: false,
      sortOrder: 1,
      banner: { desktopUrl: "/uploads/featured.png" },
      createdBy: "admin-7",
      updatedBy: "admin-7",
      toObject() { return { ...this, toObject: undefined }; },
    };
    const { service, placementModel } = createService({
      placementModel: { findOneAndUpdate: jest.fn().mockResolvedValue(savedPlacement) },
      poolModel: {
        findById: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(pool) }),
      },
      canonicalProjectModel: {
        findById: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(canonicalProject) }),
      },
    });

    await service.upsert(
      {
        launchpadPoolId: String(poolId),
        surface: "launchpad",
        featured: true,
        banner: { desktopUrl: "/uploads/featured.png" },
      },
      { _id: "admin-7" }
    );

    expect(placementModel.updateMany).toHaveBeenCalledWith(
      {
        surface: "launchpad",
        featured: true,
        launchpadPoolId: { $ne: poolId },
      },
      { $set: { featured: false, updatedBy: "admin-7" } }
    );
  });

  it("rejects executable banner links even when called outside DTO validation", async () => {
    const { service } = createService();

    await expect(
      service.patch(
        String(placementId),
        {
          banner: {
            desktopUrl: "https://cdn.example/banner.png",
            linkUrl: "javascript:alert(1)",
          },
        },
        { _id: "admin-1" }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("requires a desktop banner for every explicit page placement", async () => {
    const { service, poolModel } = createService({
      poolModel: {
        findById: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(pool),
        }),
      },
    });

    await expect(
      service.upsert(
        {
          launchpadPoolId: String(poolId),
          surface: "launchpad",
        } as any,
        { _id: "admin-1" }
      )
    ).rejects.toThrow(
      "A desktop banner is required for an explicit page placement."
    );

    expect(poolModel.findById).toHaveBeenCalledWith(poolId);
  });

  it("does not allow an existing placement banner to be cleared", async () => {
    const { service } = createService();

    await expect(
      service.patch(
        String(placementId),
        { banner: { desktopUrl: "" } },
        { _id: "admin-1" }
      )
    ).rejects.toThrow(
      "banner.desktopUrl is required for an explicit page placement."
    );
  });
});
