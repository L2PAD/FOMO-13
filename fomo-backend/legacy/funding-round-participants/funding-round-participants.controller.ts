import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { FundingRoundParticipantService } from "./services/funding-round-participant.service";

@Controller("admin/funding-round-participants")
@Roles("admin")
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class FundingRoundParticipantsController {
  constructor(private readonly fundingRoundParticipantService: FundingRoundParticipantService) {}

  @Get("coverage")
  async coverage() {
    return this.fundingRoundParticipantService.getCoverageStats();
  }

  @Get("round/:roundId")
  async round(@Param("roundId") roundId: string) {
    return this.fundingRoundParticipantService.getForRound(roundId);
  }

  @Get("fund/:fundId")
  async fund(@Param("fundId") fundId: string) {
    return this.fundingRoundParticipantService.getForFund(fundId);
  }

  @Get("person/:personId")
  async person(@Param("personId") personId: string) {
    return this.fundingRoundParticipantService.getForPerson(personId);
  }

  @Get("conflicts")
  async conflicts(@Query("limit") limit?: string) {
    return {
      conflicts: await this.fundingRoundParticipantService.getConflicts(Number(limit) || 100),
    };
  }
}
