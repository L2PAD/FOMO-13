import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { StatisticsService, StatQuery } from "./statistics.service";

/**
 * Admin/Moderator platform statistics. Read-only aggregations.
 * Moderators can view analytics + anti-fraud + user investigation, but any
 * XP/formula mutation stays in the Rating module with its own audit trail.
 */
@Controller("admin/statistics")
@Roles("admin,moderator")
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly stats: StatisticsService) {}

  @Get("overview")
  overview(@Query() q: StatQuery) {
    return this.stats.overview(q);
  }

  @Get("audience")
  audience(@Query() q: StatQuery) {
    return this.stats.audience(q);
  }

  @Get("funnel")
  funnel(@Query() q: StatQuery) {
    return this.stats.funnel(q);
  }

  @Get("activity")
  activity(@Query() q: StatQuery) {
    return this.stats.activity(q);
  }

  @Get("xp")
  xp(@Query() q: StatQuery) {
    return this.stats.xp(q);
  }

  @Get("tasks")
  tasks(@Query() q: any) {
    return this.stats.tasks(q);
  }

  @Get("fomo-score")
  fomoScore(@Query() q: StatQuery) {
    return this.stats.fomoScore(q);
  }

  @Get("content")
  content(@Query() q: StatQuery) {
    return this.stats.content(q);
  }

  @Get("antifraud")
  antifraud(@Query() q: StatQuery) {
    return this.stats.antifraud(q);
  }

  @Get("users")
  users(@Query() q: any) {
    return this.stats.users(q);
  }

  @Get("users/:id")
  userDetail(@Param("id") id: string) {
    return this.stats.userDetail(id);
  }
}
