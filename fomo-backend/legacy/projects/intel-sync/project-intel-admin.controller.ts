import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { Roles } from "src/auth/role.decorator";
import { DropstabProjectUnlocksSyncService } from "./dropstab-project-unlocks-sync.service";
import { IcodropsProjectIntelSyncService } from "./icodrops-project-intel-sync.service";
import { ProjectIntelAdminService } from "./project-intel-admin.service";
import { ProjectsIntelIcosSyncService } from "../projects-intel-icos-sync.service";
import { ProjectIntelInternalSyncGuard } from "./project-intel-internal-sync.guard";
import { IntelSyncWorkerRunnerService } from "src/intel-sync/intel-sync-worker-runner.service";

@Controller("admin/project-intel")
@Roles("admin")
@UseGuards(ProjectIntelInternalSyncGuard)
export class ProjectIntelAdminController {
  constructor(
    private readonly icodropsProjectIntelSyncService: IcodropsProjectIntelSyncService,
    private readonly dropstabProjectUnlocksSyncService: DropstabProjectUnlocksSyncService,
    private readonly projectIntelAdminService: ProjectIntelAdminService,
    private readonly projectsIntelIcosSyncService: ProjectsIntelIcosSyncService,
    private readonly intelSyncWorkerRunnerService: IntelSyncWorkerRunnerService,
  ) {}

  @Post("sync/icodrops")
  async syncIcodrops(@Query() query: any, @Body() body: any = {}) {
    const options = {
      dryRun: !this.isFalse(query.dryRun ?? body.dryRun),
      limit: this.optionalNumber(query.limit ?? body.limit),
      createMissingProjects: this.isTruthy(query.createMissingProjects ?? body.createMissingProjects),
    };
    const force = this.isTruthy(query.force ?? body.force ?? false);

    if (!force) {
      return this.intelSyncWorkerRunnerService.runJob("project-intel-icodrops", "manual", options);
    }

    return this.icodropsProjectIntelSyncService.syncIcodropsIntel(options);
  }

  @Post("sync/dropstab")
  async syncDropstab(@Query() query: any, @Body() body: any = {}) {
    const options = {
      dryRun: !this.isFalse(query.dryRun ?? body.dryRun),
      limit: this.optionalNumber(query.limit ?? body.limit),
    };
    const force = this.isTruthy(query.force ?? body.force ?? false);

    if (!force) {
      return this.intelSyncWorkerRunnerService.runJob("project-intel-dropstab", "manual", options);
    }

    return this.dropstabProjectUnlocksSyncService.syncDropstabUnlocks(options);
  }

  @Post("sync/ico-projects")
  async syncIcoProjects(@Query() query: any, @Body() body: any = {}) {
    const force = this.isTruthy(query.force ?? body.force ?? false);
    if (!force) {
      return this.intelSyncWorkerRunnerService.runJob("projects-intel-icos", "manual");
    }

    return this.projectsIntelIcosSyncService.executeSyncProjectsFromIntelIcos("manual", { force: true });
  }

  @Get("pending-matches")
  async pendingMatches(@Query() query: any) {
    return this.projectIntelAdminService.listPendingMatches(query);
  }

  @Post("pending-matches/:id/approve")
  async approvePendingMatch(@Param("id") id: string, @Body() body: any = {}) {
    return this.projectIntelAdminService.approvePendingMatch(id, body);
  }

  @Post("pending-matches/:id/reject")
  async rejectPendingMatch(@Param("id") id: string) {
    return this.projectIntelAdminService.rejectPendingMatch(id);
  }

  private isFalse(value: any): boolean {
    return ["0", "false", "no", "off"].includes(String(value ?? "").toLowerCase());
  }

  private isTruthy(value: any): boolean {
    return ["1", "true", "yes", "on"].includes(String(value ?? "").toLowerCase());
  }

  private optionalNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : undefined;
  }
}
