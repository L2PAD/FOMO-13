import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { SpaceportService } from "./spaceport.service";

/** Public (authenticated) Spaceport contract for the main website. */
@Controller("spaceport")
@UseGuards(JwtAuthGuard)
export class SpaceportController {
  constructor(private readonly spaceport: SpaceportService) {}

  private uid(req: Request, fallback?: string) {
    return (req.user as any)?._id || fallback;
  }

  @Get("config")
  async config() {
    return this.spaceport.getConfig();
  }

  @Get("me")
  async me(@Req() req: Request, @Query("userId") userId?: string) {
    return this.spaceport.buildMe(this.uid(req, userId));
  }

  @Get("history")
  async history(@Req() req: Request, @Query("userId") userId?: string) {
    return this.spaceport.getHistory(this.uid(req, userId));
  }

  @Get("rewards")
  async rewards(@Req() req: Request, @Query("userId") userId?: string) {
    return this.spaceport.getRewards(this.uid(req, userId));
  }

  @Post("stake")
  async stake(@Req() req: Request, @Body() body: any) {
    if (body?.periodDays) await this.spaceport.setSelectedPeriod(this.uid(req, body?.userId), body.periodDays);
    if (body?.txHash) {
      await this.spaceport.stakingService.create({ ...body, action: "stake" });
    }
    return this.spaceport.buildMe(this.uid(req, body?.userId));
  }

  @Post("unstake")
  async unstake(@Req() req: Request, @Body() body: any) {
    if (body?.txHash) {
      await this.spaceport.stakingService.create({ ...body, action: "unstake" });
    }
    return this.spaceport.buildMe(this.uid(req, body?.userId));
  }
}

/** Admin Spaceport configuration (milestones + levels + preview). */
@Controller("admin/spaceport")
@Roles("admin")
@UseGuards(JwtAuthGuard)
export class AdminSpaceportController {
  constructor(private readonly spaceport: SpaceportService) {}

  @Get("config")
  async getConfig() {
    return this.spaceport.getConfig();
  }

  @Post("config")
  async putConfig(@Body() body: any) {
    return this.spaceport.updateConfig(body);
  }

  @Get("preview/:userId")
  async preview(@Param("userId") userId: string) {
    return this.spaceport.buildMe(userId);
  }
}
