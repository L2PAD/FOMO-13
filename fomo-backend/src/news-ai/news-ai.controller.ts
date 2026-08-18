import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { Roles } from "src/auth/role.decorator";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { NewsAiService } from "./news-ai.service";

// Phase 3/4 CRM backend (RU). AI synthesis + queue + budget + moderation lifecycle.
@Roles("admin,moderator")
@UseGuards(JwtAuthGuard)
@Controller("admin/news-ai")
export class NewsAiController {
  constructor(private readonly service: NewsAiService) {}

  private actor(req: Request): string {
    return String((req as any)?.user?.email || (req as any)?.user?._id || "admin");
  }
  private requireAdmin(req: Request) {
    const role = (req as any)?.user?.role;
    const roles = Array.isArray(role) ? role.map((r: any) => String(r).toLowerCase()) : [String(role || "").toLowerCase()];
    if (!roles.includes("admin")) throw new ForbiddenException("Требуются права администратора для этого действия.");
  }

  // ── overview / budget / settings ──
  @Get("overview")
  overview() { return this.service.overview(); }

  @Get("budget")
  budget() { return this.service.budgetStatus(); }

  @Get("settings")
  getSettings() { return this.service.getSettings(); }

  @Patch("settings")
  updateSettings(@Body() body: any, @Req() req: Request) { this.requireAdmin(req); return this.service.updateSettings(body || {}, this.actor(req)); }

  // ── generation (queue) ──
  @Post("generate")
  generate(@Body() body: any, @Req() req: Request) {
    this.requireAdmin(req);
    return this.service.enqueueGeneration({ windowLimit: body?.windowLimit, maxClusters: body?.maxClusters, minSources: body?.minSources });
  }

  @Get("runs")
  runs(@Query("limit") limit?: string) { return this.service.listRuns(Number(limit) || 20); }

  // ── drafts / moderation lifecycle ──
  @Get("drafts")
  drafts(@Query("limit") limit?: string, @Query("status") status?: string) { return this.service.listDrafts(Number(limit) || 50, status); }

  @Get("drafts/:hash")
  draft(@Param("hash") hash: string) { return this.service.getDraft(hash); }

  @Patch("drafts/:hash")
  edit(@Param("hash") hash: string, @Body() body: any, @Req() req: Request) { this.requireAdmin(req); return this.service.editDraft(hash, body?.editorial || body || {}, this.actor(req)); }

  @Post("drafts/:hash/approve")
  approve(@Param("hash") hash: string, @Req() req: Request) { this.requireAdmin(req); return this.service.approve(hash, this.actor(req)); }

  @Post("drafts/:hash/reject")
  reject(@Param("hash") hash: string, @Req() req: Request) { this.requireAdmin(req); return this.service.reject(hash, this.actor(req)); }

  @Post("drafts/:hash/regenerate")
  regenerate(@Param("hash") hash: string, @Req() req: Request) { this.requireAdmin(req); return this.service.regenerate(hash); }

  @Post("drafts/:hash/publish")
  publish(@Param("hash") hash: string, @Req() req: Request) { this.requireAdmin(req); return this.service.publish(hash, this.actor(req)); }

  @Post("drafts/:hash/unpublish")
  unpublish(@Param("hash") hash: string, @Req() req: Request) { this.requireAdmin(req); return this.service.unpublish(hash, this.actor(req)); }
}
