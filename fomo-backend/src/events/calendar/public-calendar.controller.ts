// EPIC CAL-1 · P19 Public Calendar API (safe DTO, visibility + lifecycle + publishAt)
import { Controller, Get, Param, Query, Req } from "@nestjs/common";
import { Request } from "express";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { CalendarService } from "./calendar.service";

@Controller("calendar")
export class PublicCalendarController {
  constructor(
    private readonly calendar: CalendarService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private isAuthed(req: Request): boolean {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return false;
      this.jwtService.verify(token, { secret: this.configService.get("JWT_SECRET_ACCESS") });
      return true;
    } catch { return false; }
  }

  @Get("types")
  types() { return this.calendar.types(); }

  @Get("events")
  list(@Query() q: any, @Req() req: Request) {
    return this.calendar.publicList(q, this.isAuthed(req));
  }

  @Get("events/:id")
  get(@Param("id") id: string) { return this.calendar.publicGet(id); }

  @Get("digest")
  digest(@Query("period") period: string, @Req() req: Request) {
    return this.calendar.digest(period === "month" ? "month" : "week", this.isAuthed(req));
  }
}
