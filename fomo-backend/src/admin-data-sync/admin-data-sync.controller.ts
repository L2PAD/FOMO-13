import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { AdminDataSyncDiffInput } from "./admin-data-sync-diff.service";
import { AdminDataSyncService } from "./admin-data-sync.service";

@Controller("admin-data-sync")
@Roles("admin")
@UseGuards(JwtAuthGuard)
export class AdminDataSyncController {
  constructor(private readonly adminDataSyncService: AdminDataSyncService) {}

  @Get("config")
  getConfig() {
    return this.adminDataSyncService.getConfig();
  }

  @Get("jobs")
  listJobs(@Query("limit") limit?: string) {
    return this.adminDataSyncService.listJobs(Number(limit) || 50);
  }

  @Get("jobs/:jobId")
  getJob(@Param("jobId") jobId: string) {
    return this.adminDataSyncService.getJob(jobId);
  }

  @Post("prod-to-dev/preview")
  previewProdToDev() {
    return this.adminDataSyncService.previewProdToDev();
  }

  @Post("prod-to-dev/run")
  runProdToDev(@Req() req: Request) {
    return this.adminDataSyncService.runProdToDev(this.adminId(req));
  }

  @Post("dev-to-prod/diff")
  createDevToProdDiff(@Req() req: Request, @Body() body: AdminDataSyncDiffInput) {
    return this.adminDataSyncService.createDevToProdDiff(
      this.adminId(req),
      body || {}
    );
  }

  @Get("dev-to-prod/promotions")
  listPromotions(@Query("limit") limit?: string) {
    return this.adminDataSyncService.listPromotions(Number(limit) || 50);
  }

  @Post("dev-to-prod/promotions")
  createPromotion(@Req() req: Request, @Body() body: AdminDataSyncDiffInput) {
    return this.adminDataSyncService.createPromotion(this.adminId(req), body || {});
  }

  @Get("dev-to-prod/promotions/:promotionId")
  getPromotion(@Param("promotionId") promotionId: string) {
    return this.adminDataSyncService.getPromotion(promotionId);
  }

  @Post("dev-to-prod/promotions/:promotionId/approve")
  approvePromotion(@Req() req: Request, @Param("promotionId") promotionId: string) {
    return this.adminDataSyncService.approvePromotion(this.adminId(req), promotionId);
  }

  @Post("dev-to-prod/promotions/:promotionId/apply")
  applyPromotion(
    @Req() req: Request,
    @Param("promotionId") promotionId: string,
    @Body() body: { confirmationPhrase?: string }
  ) {
    return this.adminDataSyncService.applyPromotion(
      this.adminId(req),
      promotionId,
      body || {}
    );
  }

  @Post("dev-to-prod/promotions/:promotionId/reject")
  rejectPromotion(@Req() req: Request, @Param("promotionId") promotionId: string) {
    return this.adminDataSyncService.rejectPromotion(this.adminId(req), promotionId);
  }

  private adminId(req: Request): string {
    return String(req.user?._id || req.user?.id || "");
  }
}

