import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { CanonicalProjectService } from "./services/canonical-project.service";
import { CanonicalProjectLinkService } from "./services/canonical-project-link.service";

@Controller("admin/canonical-projects")
@Roles("admin")
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class CanonicalProjectsController {
  constructor(
    private readonly canonicalProjectService: CanonicalProjectService,
    private readonly canonicalProjectLinkService: CanonicalProjectLinkService,
  ) {}

  @Get("coverage")
  async coverage() {
    return this.canonicalProjectService.getCoverageStats();
  }

  @Get("entity/:entityType/:entityId")
  async entity(@Param("entityType") entityType: string, @Param("entityId") entityId: string) {
    const [resolution, links] = await Promise.all([
      this.canonicalProjectLinkService.resolveCanonicalForEntity(entityType, entityId),
      this.canonicalProjectLinkService.getLinksForEntity(entityType, entityId),
    ]);
    return {
      entityType,
      entityId,
      resolution,
      links,
    };
  }

  @Get("conflicts")
  async conflicts(@Query("limit") limit?: string) {
    return {
      conflicts: await this.canonicalProjectLinkService.getConflicts(Number(limit) || 100),
    };
  }

  @Get(":id/graph")
  async graph(@Param("id") id: string) {
    return this.canonicalProjectService.getCanonicalProjectGraph(id);
  }
}
