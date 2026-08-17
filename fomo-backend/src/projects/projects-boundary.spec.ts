import { HttpStatus } from "@nestjs/common";
import { ProjectsController } from "./projects.controller";
import { ProjectsModule } from "./projects.module";
import { ProjectsService } from "./projects.service";

describe("Projects legacy boundary", () => {
  it("does not expose retired project read endpoints from the controller", () => {
    const methods = Object.getOwnPropertyNames(ProjectsController.prototype);

    expect(methods).not.toEqual(
      expect.arrayContaining([
        "getProjectIntel",
        "getProjectUnlocks",
        "getProjectFundraising",
        "getProjectIcoComparison",
        "searchProjectIcoComparison",
        "getProjectIcoComparisonHistory",
        "getProjectExchangeOverview",
        "getMarketV2Parity",
        "getCategoriesProjects",
        "getCategoryProjects",
        "changeSponsoredStatus",
        "changeSandboxStatus",
        "changeEralashStatus",
      ]),
    );
  });

  it("keeps community/user command endpoints active", () => {
    const methods = Object.getOwnPropertyNames(ProjectsController.prototype);

    expect(methods).toEqual(
      expect.arrayContaining([
        "getAllUserProjects",
        "createProjectByUser",
        "updateProjectByUser",
        "updateByProject",
        "addComment",
        "likeProject",
        "dislikeProject",
      ]),
    );
  });

  it("keeps retired providers out of the HTTP module", () => {
    const controllers = Reflect.getMetadata("controllers", ProjectsModule) || [];
    const providers = Reflect.getMetadata("providers", ProjectsModule) || [];
    const providerNames = providers.map((provider: any) => provider?.name);

    expect(controllers).toEqual([ProjectsController]);
    expect(providerNames).not.toEqual(
      expect.arrayContaining([
        "ProjectIntelAdminService",
        "ProjectIntelReadService",
        "IcoComparisonService",
        "IcoComparisonTimeseriesService",
        "ProjectExchangeOverviewService",
        "ProjectsIntelIcosSyncService",
        "IcodropsProjectIntelSyncService",
        "DropstabProjectUnlocksSyncService",
      ]),
    );
  });

  it("rejects the retired legacy market list before touching MongoDB", async () => {
    const service = Object.create(ProjectsService.prototype) as ProjectsService;

    await expect(service.getProjects("market", "active", {})).rejects.toMatchObject({
      status: HttpStatus.GONE,
    });
  });
});
