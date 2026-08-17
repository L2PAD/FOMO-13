import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { Req } from "@nestjs/common";
import { Roles } from "src/auth/role.decorator";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { NewsParserService } from "./news-parser.service";

// CRM News Control Center backend (P20–P34). RU-facing UI consumes these.
@Roles("admin,moderator")
@UseGuards(JwtAuthGuard)
@Controller("admin/news-parser")
export class NewsParserController {
  constructor(private readonly service: NewsParserService) {}

  @Get("overview")
  overview() {
    return this.service.overview();
  }

  @Get("stats")
  stats(@Query("days") days?: string) {
    return this.service.stats(Number(days) || 7);
  }

  @Get("global")
  getGlobal() {
    return this.service.getGlobal();
  }

  @Post("global/pause")
  pauseGlobal() {
    return this.service.setGlobalPaused(true);
  }

  @Post("global/resume")
  resumeGlobal() {
    return this.service.setGlobalPaused(false);
  }

  @Post("seed")
  seed() {
    return this.service.seedSources();
  }

  @Get("sources")
  sources(
    @Query("tier") tier?: string,
    @Query("status") status?: string,
    @Query("q") q?: string
  ) {
    return this.service.listSources({ tier, status, q });
  }

  @Get("sources/:id")
  source(@Param("id") id: string) {
    return this.service.getSource(id);
  }

  @Post("sources")
  createSource(@Body() body: any) {
    return this.service.createSource(body);
  }

  @Patch("sources/:id")
  updateSource(@Param("id") id: string, @Body() body: any) {
    return this.service.updateSource(id, body);
  }

  @Delete("sources/:id")
  deleteSource(@Param("id") id: string) {
    return this.service.deleteSource(id);
  }

  @Post("sources/:id/run")
  runSource(@Param("id") id: string, @Req() req: Request) {
    return this.service.enqueueSource(id, "manual", String((req as any)?.user?._id || "admin"));
  }

  @Post("sources/:id/pause")
  pauseSource(@Param("id") id: string) {
    return this.service.setSourceStatus(id, "PAUSED");
  }

  @Post("sources/:id/resume")
  resumeSource(@Param("id") id: string) {
    return this.service.setSourceStatus(id, "ACTIVE");
  }

  @Post("sources/:id/test")
  testSource(@Param("id") id: string) {
    return this.service.testSource(id);
  }

  @Post("run/tier/:tier")
  runTier(@Param("tier") tier: "A" | "B" | "C", @Req() req: Request) {
    return this.service.enqueueTier(tier, String((req as any)?.user?._id || "admin"));
  }

  @Post("run/all")
  runAll(@Req() req: Request) {
    return this.service.enqueueAll(String((req as any)?.user?._id || "admin"));
  }

  @Get("runs")
  runs(@Query("limit") limit?: string, @Query("sourceId") sourceId?: string) {
    return this.service.listRuns(Number(limit) || 30, sourceId);
  }

  @Get("runs/:id")
  run(@Param("id") id: string) {
    return this.service.getRun(id);
  }
}
