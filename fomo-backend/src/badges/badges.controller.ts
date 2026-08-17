import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { Roles } from "src/auth/role.decorator";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { BadgesService } from "./badges.service";

@Controller()
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  // ----------------------------- PUBLIC -----------------------------
  @Get("badges")
  async getPublicBadges() {
    return this.badgesService.getPublicBadges();
  }

  @UseGuards(JwtAuthGuard)
  @Get("me/badges")
  async getMyBadges(@Req() req: Request) {
    const userId = String((req.user as any)?._id || "");
    const earned = await this.badgesService.getUserBadges(userId);
    return { badges: earned };
  }

  @UseGuards(JwtAuthGuard)
  @Post("me/badges/featured")
  async setMyFeatured(@Req() req: Request, @Body() body: { codes: string[] }) {
    const userId = String((req.user as any)?._id || "");
    return this.badgesService.setFeatured(userId, body?.codes || []);
  }

  @UseGuards(JwtAuthGuard)
  @Put("me/badges/featured")
  async putMyFeatured(@Req() req: Request, @Body() body: { codes: string[] }) {
    const userId = String((req.user as any)?._id || "");
    return this.badgesService.setFeatured(userId, body?.codes || []);
  }

  @Get("users/:id/badges")
  async getUserBadges(@Param("id") id: string) {
    const badges = await this.badgesService.getUserBadges(id);
    return { badges };
  }

  // ----------------------------- ADMIN ------------------------------
  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/badges")
  async listDefinitions() {
    return this.badgesService.listDefinitions();
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/badges/diagnostics")
  async diagnostics() {
    return this.badgesService.getDiagnostics();
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/badges/analytics")
  async analytics() {
    return this.badgesService.getAnalytics();
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/badges/history")
  async history(@Query("userId") userId?: string, @Query("limit") limit?: string) {
    return this.badgesService.getHistory(Number(limit || 100), userId);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin/badges")
  async create(@Req() req: Request, @Body() body: any) {
    const adminId = String((req.user as any)?._id || "");
    return this.badgesService.createDefinition(body, adminId);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Put("admin/badges/:code")
  async update(@Req() req: Request, @Param("code") code: string, @Body() body: any) {
    const adminId = String((req.user as any)?._id || "");
    return this.badgesService.updateDefinition(code, body, adminId);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Delete("admin/badges/:code")
  async remove(@Req() req: Request, @Param("code") code: string) {
    const adminId = String((req.user as any)?._id || "");
    return this.badgesService.deleteDefinition(code, adminId);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin/users/:userId/badges/:code")
  async awardManual(
    @Req() req: Request,
    @Param("userId") userId: string,
    @Param("code") code: string,
    @Body() body: { reason: string },
  ) {
    const adminId = String((req.user as any)?._id || "");
    return this.badgesService.manualAward(userId, code, adminId, body?.reason || "");
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Delete("admin/users/:userId/badges/:code")
  async revoke(
    @Req() req: Request,
    @Param("userId") userId: string,
    @Param("code") code: string,
    @Body() body: { reason: string },
  ) {
    const adminId = String((req.user as any)?._id || "");
    return this.badgesService.revoke(userId, code, adminId, body?.reason || "");
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin/badges/evaluate/:userId")
  async evaluate(@Param("userId") userId: string, @Body() body: Record<string, number>) {
    return this.badgesService.evaluateForUser(userId, body || {});
  }
}
