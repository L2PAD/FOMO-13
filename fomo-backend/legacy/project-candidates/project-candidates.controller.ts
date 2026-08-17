import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { ProjectCandidateService } from "./project-candidates.service";

@Controller("admin/project-candidates")
@Roles("admin")
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class ProjectCandidatesController {
  constructor(private readonly projectCandidateService: ProjectCandidateService) {}

  @Get("coverage")
  async coverage() {
    return this.projectCandidateService.getCoverageStats();
  }

  @Get("evidence/:entityType/:entityId")
  async evidence(@Param("entityType") entityType: string, @Param("entityId") entityId: string) {
    return {
      entityType,
      entityId,
      candidates: await this.projectCandidateService.getCandidatesForEvidence(entityType, entityId),
    };
  }

  @Get("conflicts")
  async conflicts(@Query("limit") limit?: string) {
    return {
      conflicts: await this.projectCandidateService.getConflicts(Number(limit) || 100),
    };
  }

  @Get()
  async list(@Query("status") status?: string, @Query("evidenceType") evidenceType?: string, @Query("limit") limit?: string) {
    return {
      candidates: await this.projectCandidateService.listCandidates({
        status,
        evidenceType,
        limit: Number(limit) || undefined,
      }),
    };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return {
      candidate: await this.projectCandidateService.getCandidate(id),
    };
  }
}
