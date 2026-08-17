import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import {
  FomoV2ReviewCaseAdminQuery,
  FomoV2ReviewCaseAdminService,
  FomoV2ReviewCaseDecisionInput,
  FomoV2ReviewCaseUnlockStageInput,
  FomoV2ProjectVestingUpdateInput,
} from "../services/review-case-admin.service";
import {
  FomoV2UnlockEventsImportMode,
  FomoV2UnlockEventsImportService,
} from "../../unlocks/services";

interface FomoV2AdminUnlockImportInput {
  mode?: FomoV2UnlockEventsImportMode;
  source?: string;
  sourceType?: string;
  sourceProjectFilter?: "unlock-eligible" | "vesting-eligible";
}

@Controller("admin/fomo-v2/review-cases")
@Roles("admin")
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 180, ttl: 60_000 } })
export class FomoV2ReviewCaseAdminController {
  constructor(
    @Inject(FomoV2ReviewCaseAdminService)
    private readonly reviewCaseAdminService: FomoV2ReviewCaseAdminService,
    private readonly unlockEventsImportService: FomoV2UnlockEventsImportService
  ) {}

  @Get()
  list(@Query() query: FomoV2ReviewCaseAdminQuery) {
    return this.reviewCaseAdminService.list(query);
  }

  @Get("projects/:canonicalProjectId/vesting")
  getProjectVesting(@Param("canonicalProjectId") canonicalProjectId: string) {
    return this.reviewCaseAdminService.getProjectVesting(canonicalProjectId);
  }

  @Put("projects/:canonicalProjectId/vesting")
  updateProjectVesting(
    @Param("canonicalProjectId") canonicalProjectId: string,
    @Body() body: FomoV2ProjectVestingUpdateInput,
    @Req() request: Request
  ) {
    return this.reviewCaseAdminService.updateProjectVesting(
      canonicalProjectId,
      body,
      request.user
    );
  }

  @Post("unlocks/import")
  importUnlocks(@Body() body: FomoV2AdminUnlockImportInput = {}) {
    return this.unlockEventsImportService.run({
      all: true,
      dryRun: false,
      mode: body.mode || "all",
      source: body.source || body.sourceType || "dropstab",
      sourceProjectFilter: body.sourceProjectFilter || "unlock-eligible",
      sourceType: body.sourceType || body.source || "dropstab",
      write: true,
    });
  }

  @Post("projects/:canonicalProjectId/unlocks/import")
  importProjectUnlocks(
    @Param("canonicalProjectId") canonicalProjectId: string,
    @Body() body: FomoV2AdminUnlockImportInput = {}
  ) {
    return this.unlockEventsImportService.stageProjectUnlocks({
      canonicalProjectId,
      source: body.source || body.sourceType || "dropstab",
      sourceType: body.sourceType || body.source || "dropstab",
    });
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.reviewCaseAdminService.get(id);
  }

  @Post(":id/unlocks/stage")
  stageUnlocks(
    @Param("id") id: string,
    @Body() body: FomoV2ReviewCaseUnlockStageInput = {},
    @Req() request: Request
  ) {
    return this.reviewCaseAdminService.stageUnlocks(id, body, request.user);
  }

  @Post(":id/approve")
  approve(
    @Param("id") id: string,
    @Body() body: FomoV2ReviewCaseDecisionInput,
    @Req() request: Request
  ) {
    return this.reviewCaseAdminService.approve(id, body, request.user);
  }

  @Post(":id/reject")
  reject(
    @Param("id") id: string,
    @Body() body: FomoV2ReviewCaseDecisionInput,
    @Req() request: Request
  ) {
    return this.reviewCaseAdminService.reject(id, body, request.user);
  }

  @Post(":id/ignore")
  ignore(
    @Param("id") id: string,
    @Body() body: FomoV2ReviewCaseDecisionInput,
    @Req() request: Request
  ) {
    return this.reviewCaseAdminService.ignore(id, body, request.user);
  }

  @Post(":id/send-to-parser")
  sendToParser(
    @Param("id") id: string,
    @Body() body: FomoV2ReviewCaseDecisionInput,
    @Req() request: Request
  ) {
    return this.reviewCaseAdminService.sendToParser(id, body, request.user);
  }

  @Post("generate")
  generate(@Body("limit") limit?: number) {
    return this.reviewCaseAdminService.generate(limit);
  }
}
