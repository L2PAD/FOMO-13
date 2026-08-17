// EPIC CAL-2 · Digest controllers (admin CRUD/AI + public read + live reactions)
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards, UseInterceptors, UploadedFile } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Request } from "express";
import { Roles } from "src/auth/role.decorator";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { OptionalJwtGuard } from "src/auth/optional-jwt.guard";
import { DigestService } from "./digest.service";

@Controller("admin/calendar/digests")
export class AdminDigestController {
  constructor(private readonly digests: DigestService) {}

  private actor(req: Request): string | undefined {
    return (req.user as any)?._id;
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Get()
  list(@Query() q: any) { return this.digests.adminList(q); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Post("generate")
  generate(@Body() body: any, @Req() req: Request) { return this.digests.generateDraft(body, this.actor(req)); }

  // Manual trigger for the weekly auto-draft (also runs automatically via cron).
  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Post("generate/weekly")
  generateWeekly() { return this.digests.maybeGenerateWeeklyDraft(true); }

  // Upload a cover image file (instead of pasting a URL).
  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Post("cover")
  @UseInterceptors(FileInterceptor("file", { limits: { files: 1, fileSize: 5 * 1024 * 1024 } }))
  uploadCover(@UploadedFile() file: any) { return this.digests.uploadCover(file); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Get(":id")
  get(@Param("id") id: string) { return this.digests.adminGet(id); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() body: any, @Req() req: Request) { return this.digests.create(body, this.actor(req)); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  patch(@Param("id") id: string, @Body() body: any, @Req() req: Request) { return this.digests.patch(id, body, this.actor(req)); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  remove(@Param("id") id: string) { return this.digests.remove(id); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Post(":id/publish")
  publish(@Param("id") id: string, @Req() req: Request) { return this.digests.setStatus(id, "PUBLISHED", this.actor(req)); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Post(":id/unpublish")
  unpublish(@Param("id") id: string, @Req() req: Request) { return this.digests.setStatus(id, "DRAFT", this.actor(req)); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Post(":id/archive")
  archive(@Param("id") id: string, @Req() req: Request) { return this.digests.setStatus(id, "ARCHIVED", this.actor(req)); }
}

@Controller("calendar/digests")
export class PublicDigestController {
  constructor(private readonly digests: DigestService) {}

  private viewer(req: Request): string | undefined {
    return (req.user as any)?._id;
  }

  @UseGuards(OptionalJwtGuard)
  @Get()
  list(@Query() q: any, @Req() req: Request) { return this.digests.publicList(q, this.viewer(req)); }

  @UseGuards(OptionalJwtGuard)
  @Get(":id")
  get(@Param("id") id: string, @Req() req: Request) { return this.digests.publicGet(id, this.viewer(req)); }

  // Live reactions — any authenticated user can like / repost a published digest.
  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post(":id/like")
  like(@Param("id") id: string, @Req() req: Request) {
    return this.digests.toggleReaction(id, "likes", (req.user as any)?._id);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post(":id/repost")
  repost(@Param("id") id: string, @Req() req: Request) {
    return this.digests.toggleReaction(id, "reposts", (req.user as any)?._id);
  }
}
