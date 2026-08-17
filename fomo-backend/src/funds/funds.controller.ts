import {
  UseGuards,
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  Query,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { FundsService } from "./funds.service";
import { FormDataRequest } from "nestjs-form-data/dist/decorators";
import { Roles } from "src/auth/role.decorator";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { CreateFundsDto } from "./dto/create-funds.dto";
import commentDto from "src/comments/dto/comment.dto";
import { UpdateFundDto } from "./dto/update-fund.dto";
import { Request } from "express";
import mongoose from "mongoose";
import { Limits } from "src/limits/limit.decorator";
import { LimitGuard } from "src/limits/limit.guard";
import { RolesDto } from "src/projects/dto/update-project.dto";
import { FundsIntelInvestorsSyncService } from "./funds-intel-investors-sync.service";
import { FundsAnalyticsSnapshotService } from "./funds-analytics-snapshot.service";
import { FundsQueryDto } from "./dto/funds-query.dto";
import { InternalSyncGuard } from "src/common/guards/internal-sync.guard";
import { IntelSyncWorkerRunnerService } from "src/intel-sync/intel-sync-worker-runner.service";

export interface InvestmentFilters {
  page?: number;
  limit?: number;
  name?: string;
  search?: string;
  niche?: string[];
  investAmount?: string[];
  investAmount_checkboxes?: string[];
  projects?: string[];
  industryFocus?: string[];
  foundedDate?: string[];
  "regionData.region"?: string[];
  country?: string[];
  roi?: string[];
  status?: string[];
  fomoScore?: string[];
  additionalStatus?: "sponsored" | string;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | string;
  quickFilter?: string;
}

@Controller("funds")
export class FundsController {
  constructor(
    private readonly fundsService: FundsService,
    private readonly fundsIntelInvestorsSyncService: FundsIntelInvestorsSyncService,
    private readonly fundsAnalyticsSnapshotService: FundsAnalyticsSnapshotService,
    private readonly intelSyncWorkerRunnerService: IntelSyncWorkerRunnerService,
  ) {}

  private parseFundsQuery(query: FundsQueryDto | Record<string, any>): InvestmentFilters {
    const arrayParams = new Set([
      "niche",
      "investAmount",
      "investAmount_checkboxes",
      "projects",
      "industryFocus",
      "foundedDate",
      "regionData.region",
      "country",
      "roi",
      "status",
      "fomoScore",
    ]);
    const scalarParams = new Set([
      "page",
      "limit",
      "name",
      "search",
      "additionalStatus",
      "sortBy",
      "sortOrder",
      "quickFilter",
    ]);
    const parsedQuery: Record<string, any> = {};

    for (const [key, value] of Object.entries(query || {})) {
      if (arrayParams.has(key)) {
        parsedQuery[key] = Array.isArray(value)
          ? value.flatMap((item) => String(item).split(","))
          : String(value || "").split(",");
        parsedQuery[key] = parsedQuery[key]
          .map((item: string) => item.trim())
          .filter(Boolean)
          .slice(0, 50)
          .map((item: string) => item.slice(0, 120));
        continue;
      }

      if (scalarParams.has(key)) {
        const scalarValue = Array.isArray(value) ? value[0] : value;
        parsedQuery[key] = typeof scalarValue === "string"
          ? scalarValue.trim().slice(0, 120)
          : scalarValue;
      }
    }

    if (parsedQuery.page) parsedQuery.page = Number(parsedQuery.page);
    if (parsedQuery.limit) parsedQuery.limit = Number(parsedQuery.limit);

    return parsedQuery as InvestmentFilters;
  }

  private isTruthy(value: any): boolean {
    return ["1", "true", "yes", "on"].includes(String(value ?? "").trim().toLowerCase());
  }

  @Get()
  getFunds(@Query() query: FundsQueryDto): Promise<any> {
    const projectStatus: string = "active";

    return this.fundsService.getFunds(
      projectStatus,
      this.parseFundsQuery(query),
    );
  }

  @Roles("admin")
  @UseGuards(InternalSyncGuard)
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @Post("sync/intel-investors")
  syncIntelInvestors(
    @Body() body: Record<string, any> = {},
    @Query() query: Record<string, any> = {},
  ) {
    const force = this.isTruthy(query.force ?? body.force ?? false);
    if (!force) {
      return this.intelSyncWorkerRunnerService.runJob("funds-intel-investors", "manual");
    }

    return this.fundsIntelInvestorsSyncService.executeSyncFromIntelInvestors("manual", { force: true });
  }

  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @Get("analytics")
  getFundsAnalytics(@Query() query: FundsQueryDto) {
    return this.fundsService.getFundsAnalytics(this.parseFundsQuery(query));
  }

  @Roles("admin")
  @UseGuards(InternalSyncGuard)
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @Post("analytics/snapshot/refresh")
  refreshFundsAnalyticsSnapshot() {
    return this.fundsAnalyticsSnapshotService.refreshDailyCharts("manual");
  }

  @Get("filters")
  getFundsFilters() {
    return this.fundsService.getFundsFilters();
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("rating/recalculate")
  recalculateFundsRating(@Query() query: any) {
    return this.fundsService.recalculateFundsRating({
      dryRun: String(query?.dryRun || "").toLowerCase() === "true",
      batchSize: Number(query?.batchSize || 200),
      limit: Number(query?.limit || 0),
    });
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("rating/recalculate/:id")
  recalculateFundRating(@Param("id") id: string, @Query() query: any) {
    return this.fundsService.recalculateFundRating(id, {
      dryRun: String(query?.dryRun || "").toLowerCase() === "true",
    });
  }

  @Get("project/public")
  getInvestors(@Query() query: {page:string,limit:string,slugs:string}): Promise<any> {
    return this.fundsService.getInvestorsBySlug(query);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Get("data/all")
  getAdminFunds(): Promise<any> {
    const projectStatus: string = "all";

    return this.fundsService.getFunds(projectStatus);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/:id/raw")
  getAdminFundRaw(@Param("id") id: string) {
    return this.fundsService.getFund(id, { includeRaw: true });
  }

  @Get(":id/locked-unlocked-token-distribution")
  getFundLockedUnlockedTokenDistribution(@Param("id") id: string) {
    return this.fundsService.getFundLockedUnlockedTokenDistribution(id);
  }

  @Get(":id")
  getFund(@Param("id") id: string) {
    return this.fundsService.getFund(id, { includeRaw: false });
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin")
  @FormDataRequest()
  @HttpCode(HttpStatus.CREATED)
  createFund(@Body() createFundsDto: CreateFundsDto) {
    return this.fundsService.createFundByAdmin(createFundsDto);
  }

  @Roles("moderator")
  @UseGuards(JwtAuthGuard)
  @Post("moderator")
  @FormDataRequest()
  @HttpCode(HttpStatus.CREATED)
  moderatorFund(@Req() req: Request) {
    const id: string = req.user._id;
    const createFundsDto: CreateFundsDto = req.body;

    return this.fundsService.createFund(createFundsDto, id, "admin");
  }

  @Roles("user")
  @Limits("fundLimit")
  @UseGuards(JwtAuthGuard, LimitGuard)
  @Post("user")
  @FormDataRequest()
  @HttpCode(HttpStatus.CREATED)
  createFundByUser(@Req() req: Request) {
    const id: string = req.user._id;
    const createFundsDto: CreateFundsDto = req.body;

    return this.fundsService.createFund(createFundsDto, id, "moderator");
  }

  @Roles("user")
  @Limits("personLimit")
  @UseGuards(JwtAuthGuard, LimitGuard)
  @Put("user/:id")
  @FormDataRequest()
  updateFundByUser(
    @Req() req: Request,
    @Body() updateFundsDto: UpdateFundDto,
    @Param("id") id: string
  ) {
    const initiator: string = req.user._id;

    return this.fundsService.editFundByUser(id, updateFundsDto, initiator);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Put(":id")
  @FormDataRequest()
  updateFund(
    @Req() req: Request,
    @Body() updateFundsDto: UpdateFundDto,
    @Param("id") id: string
  ) {
    const userId: string = req.user._id;
    const rolesData: RolesDto = {
      isAdmin: req.user.role.includes("admin"),
      isModerator: req.user.role.includes("moderator"),
      isUser: req.user.role.includes("user"),
    };
    return this.fundsService.editFund(id, updateFundsDto, rolesData, userId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("comment/:id")
  addComment(@Req() req: Request) {
    const comment: commentDto = req.body;
    const userId: string = req.user._id;
    const itemId: string = req.params.id;

    return this.fundsService.addComment(itemId, {
      ...comment,
      author: new mongoose.Types.ObjectId(userId),
    });
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Delete("comment/:id/:comment")
  removeComment(@Param() params) {
    const { id, comment } = params;
    return this.fundsService.removeComment(id, comment);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  removeProject(@Param() params) {
    const { id } = params;
    return this.fundsService.removeProject(id);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  changeRedStatus(@Param() params) {
    const { id } = params;
    return this.fundsService.toggleRedStatus(id);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Patch("/:status/:id")
  changeStatus(@Param() params) {
    const { id, status }: { id: string; status: string } = params;
    return this.fundsService.changeStatus(id, status);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Patch("sponsored/update/:id")
  changeSponsoredStatus(@Param() params) {
    const { id }: { id: string } = params;
    return this.fundsService.updateSponsoredStatus(id);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch("action/like/:id")
  async likeProject(@Req() req: Request, @Param("id") fundId: string) {
    const userId: string = req.user._id;

    return this.fundsService.addLike(fundId, userId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch("action/dislike/:id")
  async dislikeProject(@Req() req: Request, @Param("id") fundId: string) {
    const userId: string = req.user._id;

    return this.fundsService.addDislike(fundId, userId);
  }
}
