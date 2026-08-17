import { GUARDS_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import { InternalSyncGuard } from "src/common/guards/internal-sync.guard";
import { FomoV2FundingRoundsCompatibilityController } from "./funding-rounds-compatibility.controller";

describe("FomoV2FundingRoundsCompatibilityController", () => {
  const createController = () => {
    const readService = {
      getFilterOptions: jest.fn(),
      getProjectRounds: jest.fn(),
      listRounds: jest.fn(),
    };
    const syncService = {
      run: jest.fn(),
    };

    return {
      controller: new FomoV2FundingRoundsCompatibilityController(
        readService as any,
        syncService as any
      ),
      readService,
      syncService,
    };
  };

  it("keeps the legacy rounds controller path", () => {
    expect(
      Reflect.getMetadata(
        PATH_METADATA,
        FomoV2FundingRoundsCompatibilityController
      )
    ).toBe("rounds");
  });

  it("preserves the legacy list response envelope", async () => {
    const { controller, readService } = createController();
    readService.listRounds.mockResolvedValue({
      rounds: [{ _id: "round-1" }],
      total: 1,
    });

    await expect(
      controller.listRounds({ limit: 25, offset: 5 })
    ).resolves.toEqual({
      rounds: [{ _id: "round-1" }],
      total: 1,
      limit: 25,
      offset: 5,
    });
    expect(readService.listRounds).toHaveBeenCalledWith({
      limit: 25,
      offset: 5,
    });
  });

  it("preserves the legacy filters envelope and default limit", async () => {
    const { controller, readService } = createController();
    readService.getFilterOptions.mockResolvedValue({
      categories: [{ key: "defi", label: "DeFi", count: 2 }],
      fundingTypes: [],
    });

    await expect(controller.getFilterOptions({})).resolves.toEqual({
      categories: [{ key: "defi", label: "DeFi", count: 2 }],
      fundingTypes: [],
      limit: 8,
    });
    expect(readService.getFilterOptions).toHaveBeenCalledWith(8);
  });

  it("resolves project rounds through the v2 read service", async () => {
    const { controller, readService } = createController();
    readService.getProjectRounds.mockResolvedValue([{ _id: "round-1" }]);

    await expect(
      controller.getProjectRounds(
        { project: "bitcoin" },
        { lookup: "slug", limit: 50 }
      )
    ).resolves.toEqual([{ _id: "round-1" }]);
    expect(readService.getProjectRounds).toHaveBeenCalledWith("bitcoin", {
      lookup: "slug",
      limit: 50,
    });
  });

  it("runs a bounded v2 feed-round write by default", async () => {
    const { controller, syncService } = createController();
    syncService.run.mockResolvedValue({ mode: "write" });

    await expect(controller.syncIntelFundingRounds({}, {})).resolves.toEqual({
      mode: "write",
    });
    expect(syncService.run).toHaveBeenCalledWith({
      limit: 100,
      sourceType: "dropstab",
      sourceDocumentIds: undefined,
      debug: false,
      canonicalMarketlessOnly: false,
      write: true,
      feedRounds: true,
      participantsOnly: false,
      all: false,
      allConfirmed: false,
    });
  });

  it("supports dry-run preview and never lets force remove the hard limit", async () => {
    const { controller, syncService } = createController();
    syncService.run.mockResolvedValue({ mode: "dry-run" });

    await controller.syncIntelFundingRounds(
      { limit: 150, force: true },
      { limit: 500 as any, dryRun: true }
    );

    expect(syncService.run).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 200,
        write: false,
        feedRounds: false,
        all: false,
        allConfirmed: false,
      })
    );
  });

  it("uses the existing admin/internal sync guard semantics", () => {
    const handler =
      FomoV2FundingRoundsCompatibilityController.prototype
        .syncIntelFundingRounds;

    expect(Reflect.getMetadata("roles", handler)).toEqual(["admin"]);
    expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(
      InternalSyncGuard
    );
  });
});
