import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import { ActivitiesService } from "./activities.service";
import { CryptoActivitiesSyncService } from "./services/crypto-activities-sync.service";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { InternalSyncGuard } from "src/common/guards/internal-sync.guard";
import { IntelSyncWorkerRunnerService } from "src/intel-sync/intel-sync-worker-runner.service";
import { FomoV2ActivityPublicReadService } from "src/fomo-v2/domains/activities";
import { FomoV2ActivityCompatibilityService } from "./services/fomo-v2-activity-compatibility.service";
import {
  CryptoActivitiesSyncDto,
  CryptoActivityBoardDto,
  CryptoActivityBoardColumnDto,
  CryptoActivityBoardQueryDto,
  CryptoActivityBoardTaskDto,
  CryptoActivityCalendarDto,
  CryptoActivityCalendarQueryDto,
  CryptoActivityFilterQueryDto,
  CryptoActivityListQueryDto,
  CryptoActivityReactionDto,
  CryptoActivityReportDto,
  CryptoActivityStepProgressDto,
  CryptoActivityUpdateDto,
} from "./dto/crypto-activity.dto";

@Controller("crypto-activities")
export class ActivitiesController {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly cryptoActivitiesSyncService: CryptoActivitiesSyncService,
    private readonly intelSyncWorkerRunnerService: IntelSyncWorkerRunnerService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly fomoV2ActivityReadService: FomoV2ActivityPublicReadService,
    private readonly fomoV2ActivityCompatibilityService: FomoV2ActivityCompatibilityService
  ) {}

  private getOptionalUser(req: Request): Record<string, any> | undefined {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return undefined;

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get("JWT_SECRET_ACCESS"),
      });

      if (payload?.is2FAEnabled && !payload?.is2FAVerified) {
        return undefined;
      }

      return payload;
    } catch (error) {
      return undefined;
    }
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("board")
  getBoard(@Req() req: Request, @Query() query: CryptoActivityBoardQueryDto) {
    return this.activitiesService.getBoard(req.user, query);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("board/boards")
  createBoard(@Req() req: Request, @Body() dto: CryptoActivityBoardDto) {
    return this.activitiesService.createBoard(req.user, dto);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("board/columns")
  createBoardColumn(
    @Req() req: Request,
    @Body() dto: CryptoActivityBoardColumnDto
  ) {
    return this.activitiesService.createBoardColumn(req.user, dto);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch("board/columns/:id")
  updateBoardColumn(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: CryptoActivityBoardColumnDto
  ) {
    return this.activitiesService.updateBoardColumn(req.user, id, dto);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Delete("board/columns/:id")
  deleteBoardColumn(@Req() req: Request, @Param("id") id: string) {
    return this.activitiesService.deleteBoardColumn(req.user, id);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("board/tasks")
  createBoardTask(
    @Req() req: Request,
    @Body() dto: CryptoActivityBoardTaskDto
  ) {
    return this.activitiesService.createBoardTask(req.user, dto);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("board/tasks/from-fomo/:taskId")
  addFomoTaskToBoard(@Req() req: Request, @Param("taskId") taskId: string) {
    return this.activitiesService.addFomoTaskToBoard(req.user, taskId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch("board/tasks/:id")
  updateBoardTask(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: CryptoActivityBoardTaskDto
  ) {
    return this.activitiesService.updateBoardTask(req.user, id, dto);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Delete("board/tasks/:id")
  deleteBoardTask(@Req() req: Request, @Param("id") id: string) {
    return this.activitiesService.deleteBoardTask(req.user, id);
  }

  @Roles("admin")
  @UseGuards(InternalSyncGuard)
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @Post("sync")
  syncCryptoActivities(
    @Body() dto: CryptoActivitiesSyncDto = {},
    @Query() query: CryptoActivitiesSyncDto = {}
  ) {
    return this.runCryptoActivitiesSync({ ...query, ...dto });
  }

  @Roles("admin")
  @UseGuards(InternalSyncGuard)
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @Post("sync/parser")
  syncCryptoActivitiesFromParser(
    @Body() dto: CryptoActivitiesSyncDto = {},
    @Query() query: CryptoActivitiesSyncDto = {}
  ) {
    return this.runCryptoActivitiesSync({ ...query, ...dto });
  }

  private runCryptoActivitiesSync(dto: CryptoActivitiesSyncDto = {}) {
    const options = {
      limit: this.optionalNumber(dto.limit),
      maxPages: this.optionalNumber(dto.maxPages),
      dryRun: this.isTruthy(dto.dryRun),
      force: this.isTruthy(dto.force),
    };

    if (!options.force) {
      return this.intelSyncWorkerRunnerService.runJob(
        "crypto-activities-parser-sync",
        "manual",
        options
      );
    }

    return this.cryptoActivitiesSyncService.syncCryptoActivities(options);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("sync/runs")
  getSyncRuns(@Query() query: Record<string, any>) {
    return this.cryptoActivitiesSyncService.listSyncRuns(query);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("sync/runs/:id")
  getSyncRun(@Param("id") id: string) {
    return this.cryptoActivitiesSyncService.getSyncRun(id);
  }

  @Get()
  getActivities(
    @Query() query: CryptoActivityListQueryDto,
    @Req() req: Request
  ) {
    const publicQuery: any = { ...query };
    if (query.favourite !== undefined) {
      publicQuery.favourite = this.isTruthy(query.favourite);
    }
    if (query.favorite !== undefined) {
      publicQuery.favorite = this.isTruthy(query.favorite);
    }
    if (query.hasInvestors !== undefined) {
      publicQuery.hasInvestors = this.isTruthy(query.hasInvestors);
    }
    return this.fomoV2ActivityReadService.list(
      publicQuery,
      this.getOptionalUser(req)
    );
  }

  @Get("filters")
  getFilters(@Query() query: CryptoActivityFilterQueryDto) {
    return this.fomoV2ActivityCompatibilityService.getPublicFilters(
      query.limit
    );
  }

  @Get("calendar")
  getCalendar(
    @Query() query: CryptoActivityCalendarQueryDto,
    @Req() req: Request
  ) {
    return this.activitiesService.getCalendar(query, this.getOptionalUser(req));
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  updateActivity(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: CryptoActivityUpdateDto
  ) {
    return this.activitiesService.updateActivity(id, dto, req.user?._id);
  }

  @Get(":id")
  getActivity(@Param("id") id: string, @Req() req: Request) {
    return this.fomoV2ActivityReadService.get(id, this.getOptionalUser(req));
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post(":id/favorite")
  favoriteActivity(@Req() req: Request, @Param("id") id: string) {
    return this.activitiesService.favoriteActivity(id, req.user);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Delete(":id/favorite")
  unfavoriteActivity(@Req() req: Request, @Param("id") id: string) {
    return this.activitiesService.unfavoriteActivity(id, req.user);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post(":id/reaction")
  reactToActivity(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: CryptoActivityReactionDto
  ) {
    return this.activitiesService.reactToActivity(id, req.user, dto);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Delete(":id/reaction")
  removeReactionFromActivity(@Req() req: Request, @Param("id") id: string) {
    return this.activitiesService.removeReactionFromActivity(id, req.user);
  }

  @Post(":id/report")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  reportActivity(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: CryptoActivityReportDto
  ) {
    return this.activitiesService.reportActivity(
      id,
      dto,
      this.getOptionalUser(req)
    );
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post(":id/calendar")
  addToCalendar(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: CryptoActivityCalendarDto
  ) {
    return this.activitiesService.addActivityToCalendar(id, req.user, dto);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Delete(":id/calendar")
  removeFromCalendar(@Req() req: Request, @Param("id") id: string) {
    return this.activitiesService.removeActivityFromCalendar(id, req.user);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch(":id/steps")
  updateStepProgress(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: CryptoActivityStepProgressDto
  ) {
    return this.activitiesService.updateStepProgress(id, req.user, dto);
  }

  private isTruthy(value: any): boolean {
    return ["1", "true", "yes", "on"].includes(
      String(value ?? "").toLowerCase()
    );
  }

  private optionalNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const number = Number(value);
    return Number.isFinite(number)
      ? Math.max(0, Math.trunc(number))
      : undefined;
  }
}
