import { Body, Controller, ForbiddenException, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { Roles } from "src/auth/role.decorator";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { NewsAiService } from "./news-ai.service";

// Phase 3 CRM backend (RU). AI synthesis control + drafts + runs + COGS.
@Roles("admin,moderator")
@UseGuards(JwtAuthGuard)
@Controller("admin/news-ai")
export class NewsAiController {
  constructor(private readonly service: NewsAiService) {}

  private requireAdmin(req: Request) {
    const role = (req as any)?.user?.role;
    const roles = Array.isArray(role) ? role.map((r: any) => String(r).toLowerCase()) : [String(role || "").toLowerCase()];
    if (!roles.includes("admin")) throw new ForbiddenException("Требуются права администратора для этого действия.");
  }

  @Get("overview")
  overview() { return this.service.overview(); }

  @Get("drafts")
  drafts(@Query("limit") limit?: string) { return this.service.listDrafts(Number(limit) || 30); }

  @Get("drafts/:hash")
  draft(@Param("hash") hash: string) { return this.service.getDraft(hash); }

  @Get("runs")
  runs(@Query("limit") limit?: string) { return this.service.listRuns(Number(limit) || 20); }

  @Post("generate")
  generate(@Body() body: any, @Req() req: Request) {
    this.requireAdmin(req);
    return this.service.generate({
      windowLimit: body?.windowLimit,
      maxClusters: body?.maxClusters,
      minClusterSize: body?.minClusterSize,
    });
  }
}
