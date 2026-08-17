import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import {
  FomoV2AdminHistoryImportStartInput,
  FomoV2AdminMarketProjectQuery,
  FomoV2MarketHistoryImportAdminService,
} from "../services/market-history-import-admin.service";
import {
  FomoV2MarketScheduleRebaseInput,
  FomoV2MarketSyncScheduleRebaseService,
} from "../services/market-sync-schedule-rebase.service";

@Controller("admin/fomo-v2/market")
@Roles("admin")
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 180, ttl: 60_000 } })
export class FomoV2MarketAdminController {
  constructor(
    private readonly marketAdminService: FomoV2MarketHistoryImportAdminService,
    private readonly scheduleRebaseService: FomoV2MarketSyncScheduleRebaseService,
  ) {}

  @Get("projects")
  listMarketProjects(@Query() query: FomoV2AdminMarketProjectQuery) {
    return this.marketAdminService.listMarketProjects(query);
  }

  @Patch("projects/:id/sponsored")
  changeProjectSponsoredStatus(@Param("id") id: string) {
    return this.marketAdminService.updateSponsoredStatus(id);
  }

  @Patch("projects/:id/eralash")
  changeProjectEralashStatus(@Param("id") id: string) {
    return this.marketAdminService.updateEralashStatus(id);
  }

  @Post("history-import")
  startHistoryImport(
    @Body() body: FomoV2AdminHistoryImportStartInput = {},
    @Req() request: Request,
  ) {
    return this.marketAdminService.startHistoryImport(body, request.user);
  }

  @Get("history-import")
  listHistoryImports(@Query() query: any) {
    return this.marketAdminService.listHistoryImportRuns(query);
  }

  @Get("history-import/latest")
  getLatestHistoryImport() {
    return this.marketAdminService.getLatestHistoryImportRun();
  }

  @Get("history-import/:id")
  getHistoryImport(@Param("id") id: string) {
    return this.marketAdminService.getHistoryImportRun(id);
  }

  @Post("schedule/rebase")
  rebaseSchedule(@Body() body: FomoV2MarketScheduleRebaseInput = {}) {
    return this.scheduleRebaseService.rebase(body);
  }
}
