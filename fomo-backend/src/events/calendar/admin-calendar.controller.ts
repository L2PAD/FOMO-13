// EPIC CAL-1 · P18 Admin Calendar API
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { Roles } from "src/auth/role.decorator";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { CalendarService } from "./calendar.service";

@Controller("admin/calendar")
export class AdminCalendarController {
  constructor(private readonly calendar: CalendarService) {}

  private actor(req: Request): string | undefined {
    return (req.user as any)?._id;
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Get("events/types")
  types() { return this.calendar.types(); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Get("events/diagnostics")
  diagnostics() { return this.calendar.diagnostics(); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Get("events")
  list(@Query() q: any) { return this.calendar.adminList(q); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Get("events/:id")
  get(@Param("id") id: string) { return this.calendar.adminGet(id); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Post("events")
  create(@Body() body: any, @Req() req: Request) { return this.calendar.create(body, this.actor(req)); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Patch("events/:id")
  patch(@Param("id") id: string, @Body() body: any, @Req() req: Request) { return this.calendar.patch(id, body, this.actor(req)); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Delete("events/:id")
  remove(@Param("id") id: string) { return this.calendar.remove(id); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Post("events/:id/publish")
  publish(@Param("id") id: string, @Req() req: Request) { return this.calendar.publish(id, this.actor(req)); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Post("events/:id/unpublish")
  unpublish(@Param("id") id: string, @Req() req: Request) { return this.calendar.unpublish(id, this.actor(req)); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Post("events/:id/cancel")
  cancel(@Param("id") id: string, @Req() req: Request) { return this.calendar.cancel(id, this.actor(req)); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Post("events/:id/duplicate")
  duplicate(@Param("id") id: string, @Req() req: Request) { return this.calendar.duplicate(id, this.actor(req)); }

  // adapters (P11/P12/unlocks) — idempotent upsert from a source entity
  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Post("events/from-source")
  fromSource(@Body() body: any) { return this.calendar.upsertFromSource(body); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Post("events/maintenance/complete-expired")
  completeExpired() { return this.calendar.completeExpired(); }
}
