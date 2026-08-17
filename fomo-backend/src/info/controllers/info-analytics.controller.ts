import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Ip,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";

import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { InfoAnalyticsService } from "../info-analytics.service";

@Controller("info/analytics")
export class InfoAnalyticsController {
  constructor(private readonly analytics: InfoAnalyticsService) {}

  @Post("track")
  track(
    @Body() body: Record<string, any>,
    @Ip() ip: string,
    @Headers("user-agent") userAgent?: string,
    @Headers("referer") referrer?: string
  ) {
    const type =
      body?.type || body?.event_type || body?.event || body?.action || "event";
    return this.analytics.track(type, body, {
      ip,
      user_agent: userAgent,
      referrer,
    });
  }

  @Post(":type")
  trackTyped(
    @Param("type") type: string,
    @Body() body: Record<string, any>,
    @Ip() ip: string,
    @Headers("user-agent") userAgent?: string,
    @Headers("referer") referrer?: string
  ) {
    return this.analytics.track(type, body, {
      ip,
      user_agent: userAgent,
      referrer,
    });
  }
}

@Controller("info/admin/analytics")
@UseGuards(JwtAuthGuard)
@Roles("admin", "moderator")
export class InfoAdminAnalyticsController {
  constructor(private readonly analytics: InfoAnalyticsService) {}

  @Get("stats")
  stats(@Query("period") period?: string) {
    return this.analytics.getStats(period);
  }

  @Get("metrics")
  metrics(@Query("period") period?: string) {
    return this.analytics.getStats(period);
  }

  @Delete("clear")
  @Roles("admin")
  clear() {
    return this.analytics.clear();
  }
}
