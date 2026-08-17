import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { InvestorCandidateService } from "./investor-candidates.service";

@Controller("admin/investor-candidates")
@Roles("admin")
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class InvestorCandidatesController {
  constructor(private readonly investorCandidateService: InvestorCandidateService) {}

  @Get("coverage")
  async coverage() {
    return this.investorCandidateService.getCoverageStats();
  }

  @Get("evidence/:entityType/:entityId")
  async evidence(@Param("entityType") entityType: string, @Param("entityId") entityId: string) {
    return {
      entityType,
      entityId,
      candidates: await this.investorCandidateService.getCandidatesForEvidence(entityType, entityId),
    };
  }

  @Get("conflicts")
  async conflicts(@Query("limit") limit?: string) {
    return {
      conflicts: await this.investorCandidateService.getConflicts(Number(limit) || 100),
    };
  }

  @Get()
  async list(@Query("status") status?: string, @Query("evidenceType") evidenceType?: string, @Query("limit") limit?: string) {
    return {
      candidates: await this.investorCandidateService.listCandidates({
        status,
        evidenceType,
        limit: Number(limit) || undefined,
      }),
    };
  }

  @Get(":id")
  async get(@Param("id") id: string) {
    return {
      candidate: await this.investorCandidateService.getCandidate(id),
    };
  }
}
