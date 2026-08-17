import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  ServiceUnavailableException,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import {
  FomoV2ActivityAiReviewApplyDto,
  FomoV2ActivityAiReviewRejectDto,
  FomoV2ActivityAiReviewRequestDto,
  FomoV2ActivityAdminListQueryDto,
  FomoV2ActivityCanonicalNoMatchDto,
  FomoV2ActivityCanonicalRejectDto,
  FomoV2ActivityCanonicalResolveDto,
  FomoV2ActivityCanonicalVerifyDto,
  FomoV2ActivityDecisionDto,
  FomoV2ActivityImportPendingDto,
  FomoV2ActivityLifecycleRefreshDto,
  FomoV2ActivityPatchDto,
} from "../dto";
import {
  FomoV2ActivityAdminService,
  FomoV2ActivityAiReviewService,
  FomoV2ActivityCanonicalReviewService,
  FomoV2ActivitySourceImportService,
} from "../services";

@Controller("admin/fomo-v2/activities")
@Roles("admin")
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 180, ttl: 60_000 } })
export class FomoV2ActivitiesAdminController {
  constructor(
    private readonly activityAdminService: FomoV2ActivityAdminService,
    private readonly activitySourceImportService: FomoV2ActivitySourceImportService,
    private readonly activityAiReviewService: FomoV2ActivityAiReviewService,
    private readonly activityCanonicalReviewService: FomoV2ActivityCanonicalReviewService,
  ) {}

  @Post("import")
  importPending(@Body() body: FomoV2ActivityImportPendingDto) {
    return this.activitySourceImportService.importPending(body);
  }

  @Post("lifecycle-refresh")
  refreshLifecycle(@Body() body: FomoV2ActivityLifecycleRefreshDto) {
    return this.activitySourceImportService.refreshLifecycleStatuses(
      body.now ? new Date(body.now) : new Date(),
      body.limit,
    );
  }

  @Get()
  list(@Query() query: FomoV2ActivityAdminListQueryDto) {
    return this.activityAdminService.list(query);
  }

  @Post()
  create(@Body() body: any, @Req() request: Request) {
    return this.activityAdminService.createManual(body || {}, request.user);
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.activityAdminService.get(id);
  }

  @Patch(":id")
  patch(
    @Param("id") id: string,
    @Body() body: FomoV2ActivityPatchDto,
    @Req() request: Request,
  ) {
    return this.activityAdminService.patch(id, body, request.user);
  }

  @Post(":id/approve")
  approve(
    @Param("id") id: string,
    @Body() body: FomoV2ActivityDecisionDto,
    @Req() request: Request,
  ) {
    return this.activityAdminService.approve(id, body, request.user);
  }

  @Post(":id/publish")
  publish(
    @Param("id") id: string,
    @Body() body: FomoV2ActivityDecisionDto,
    @Req() request: Request,
  ) {
    return this.activityAdminService.publish(id, body, request.user);
  }

  @Post(":id/reject")
  reject(
    @Param("id") id: string,
    @Body() body: FomoV2ActivityDecisionDto,
    @Req() request: Request,
  ) {
    return this.activityAdminService.reject(id, body, request.user);
  }

  @Post(":id/hide")
  hide(
    @Param("id") id: string,
    @Body() body: FomoV2ActivityDecisionDto,
    @Req() request: Request,
  ) {
    return this.activityAdminService.hide(id, body, request.user);
  }

  @Post(":id/unhide")
  unhide(
    @Param("id") id: string,
    @Body() body: FomoV2ActivityDecisionDto,
    @Req() request: Request,
  ) {
    return this.activityAdminService.unhide(id, body, request.user);
  }

  @Post(":id/ai-review")
  async requestAiReview(
    @Param("id") id: string,
    @Body() body: FomoV2ActivityAiReviewRequestDto,
    @Req() request: Request,
  ) {
    const result = await this.activityAiReviewService.requestReview(
      id,
      body.expectedRevision,
      request.user,
    );
    if (result.available === false && "message" in result) {
      throw new ServiceUnavailableException(result.message);
    }
    return result;
  }

  @Post(":id/ai-review/apply")
  applyAiReview(
    @Param("id") id: string,
    @Body() body: FomoV2ActivityAiReviewApplyDto,
    @Req() request: Request,
  ) {
    return this.activityAiReviewService.applyProposal(id, body, request.user);
  }

  @Post(":id/ai-review/reject")
  rejectAiReview(
    @Param("id") id: string,
    @Body() body: FomoV2ActivityAiReviewRejectDto,
    @Req() request: Request,
  ) {
    return this.activityAiReviewService.rejectProposal(id, body, request.user);
  }

  @Post(":id/canonical/resolve")
  resolveCanonical(
    @Param("id") id: string,
    @Body() body: FomoV2ActivityCanonicalResolveDto,
    @Req() request: Request,
  ) {
    return this.activityCanonicalReviewService.resolve(id, body, request.user);
  }

  @Post(":id/canonical/verify")
  verifyCanonical(
    @Param("id") id: string,
    @Body() body: FomoV2ActivityCanonicalVerifyDto,
    @Req() request: Request,
  ) {
    return this.activityCanonicalReviewService.verify(id, body, request.user);
  }

  @Post(":id/canonical/reject")
  rejectCanonical(
    @Param("id") id: string,
    @Body() body: FomoV2ActivityCanonicalRejectDto,
    @Req() request: Request,
  ) {
    return this.activityCanonicalReviewService.reject(id, body, request.user);
  }

  @Post(":id/canonical/no-match")
  noCanonicalMatch(
    @Param("id") id: string,
    @Body() body: FomoV2ActivityCanonicalNoMatchDto,
    @Req() request: Request,
  ) {
    return this.activityCanonicalReviewService.noMatch(id, body, request.user);
  }
}
