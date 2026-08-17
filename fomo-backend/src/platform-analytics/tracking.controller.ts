import { Body, Controller, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { TrackingService } from "./tracking.service";

/**
 * PUBLIC analytics ingestion (anonymous allowed). No auth: pre-login visitors
 * must be tracked for the onboarding funnel. Raw events here are NOT XP.
 */
@Controller("analytics")
export class TrackingController {
  constructor(private readonly tracking: TrackingService) {}

  @Post("track")
  async track(@Body() body: any, @Req() req: Request) {
    return this.tracking.track({
      ...body,
      userAgent: body?.userAgent || req.headers["user-agent"] || "",
    });
  }

  @Post("session/start")
  async start(@Body() body: any, @Req() req: Request) {
    return this.tracking.startSession({
      ...body,
      userAgent: body?.userAgent || req.headers["user-agent"] || "",
    });
  }

  @Post("session/end")
  async end(@Body() body: any) {
    return this.tracking.endSession(body?.sessionId, body?.activeMsDelta);
  }

  @Post("identify")
  async identify(@Body() body: any) {
    return this.tracking.identify(body?.sessionId, body?.userId, body?.anonymousId);
  }
}
