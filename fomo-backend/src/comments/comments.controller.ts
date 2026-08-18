import {
  UseGuards,
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  Put,
  Patch,
  Delete,
  Query,
} from "@nestjs/common";
import { Request } from "express";
import { CommentsService } from "./comments.service";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { OptionalJwtGuard } from "src/auth/optional-jwt.guard";
import { BuzzAccessGuard } from "./buzz-access.guard";
import { AccessResolverService } from "src/entitlements/access-resolver.service";
import { Roles } from "src/auth/role.decorator";
import commentDto from "./dto/comment.dto";
import mongoose from "mongoose";
import { ContentInfluenceService } from "./content-influence.service";

@Controller("comments")
export class CommentsController {
  constructor(
    private readonly commentsService: CommentsService,
    private readonly accessResolver: AccessResolverService,
    private readonly contentInfluence: ContentInfluenceService,
  ) { }

  // Content Influence — recompute author XP milestones for recent topics (admin).
  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Post("/admin/influence/recalc")
  recalcInfluence() { return this.contentInfluence.recalcRecent(); }

  // Content Influence read-model for a single topic (explainability).
  @Get("/topic/:id/influence")
  getTopicInfluence(@Req() req: Request) {
    return this.contentInfluence.getTopicInfluence(req.params.id);
  }

  // Global Top Contributors from the influence read-model (time-decay: 7d/30d/all).
  @Get("/contributors")
  getTopContributors(@Req() req: Request) {
    const period = (req.query.period as any) || "30d";
    return this.contentInfluence.getTopContributors(period);
  }

  // BUZZ-AI Stage 2 — access probe for the product access screen (never 403 here).
  // BUZZ-AI Stage 4 — admin "AI в обсуждениях" settings + budgets
  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Get("/admin/ai/settings")
  getBuzzAiSettings() { return this.commentsService.getBuzzAiSettings(); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Patch("/admin/ai/settings")
  updateBuzzAiSettings(@Body() body: any) { return this.commentsService.updateBuzzAiSettings(body); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Get("/admin/ai/budget")
  getBuzzAiBudget() { return this.commentsService.getBuzzAiBudget(); }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Get("/admin/buzz/stats")
  getBuzzStats() { return this.commentsService.getBuzzStats(); }

  @UseGuards(OptionalJwtGuard)
  @Get("/feed/access")
  feedAccess(@Req() req: Request) {
    // Staff (admin/moderator) moderate the gated community, so the client gate
    // must mirror the server-side BuzzAccessGuard staff bypass — otherwise staff
    // see a paywall on a feed they are allowed to open.
    const user: any = req.user;
    const rawRoles = user?.role ?? user?.roles ?? [];
    const roles = (Array.isArray(rawRoles) ? rawRoles : [rawRoles]).map((r: any) =>
      String(r).toLowerCase(),
    );
    if (roles.includes("admin") || roles.includes("moderator")) {
      return {
        capability: "BUZZ_FEED_ACCESS",
        allowed: true,
        membership: { active: true, expiresAt: null },
        sources: [{ type: "staff" }],
        reason: null,
      };
    }
    return this.accessResolver.buzzFeedAccess(user?._id);
  }

  @Get("/:page")
  getComments(@Param("page") page: string) {
    return this.commentsService.getAllComments(page);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("/user/all")
  getUserComments(@Req() req: Request, @Param("page") page: string) {
    const userId: string = req.user._id;

    return this.commentsService.getAllComments(page, userId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("/user/topic")
  getUserTopicComments(@Req() req: Request, @Param("page") page: string) {
    const userId: string = req.user._id;

    return this.commentsService.getAllComments(page, userId, true);
  }

  @Get("/user/:id")
  getCommentsByUserId(@Param("id") id: string) {
    return this.commentsService.getAllComments('', id);
  }

  @UseGuards(OptionalJwtGuard, BuzzAccessGuard)
  @Get("/topic/all")
  getTopicComments(@Req() req: Request, @Query() query: Record<string, string | undefined>) {
    return this.commentsService.getTopicComments(query, req.user?._id);
  }

  @UseGuards(OptionalJwtGuard, BuzzAccessGuard)
  @Get("/topic/:id")
  getTopicDetail(@Req() req: Request, @Param("id") id: string) {
    return this.commentsService.getTopicDetail(id, req.user?._id);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("/admin/reported")
  getReportedComments() {
    return this.commentsService.getReportedComments();
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Get("/admin/reported/all")
  getAllReportedContent() {
    return this.commentsService.getAllReportedContent();
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard, BuzzAccessGuard)
  @Post("/:page")
  createComment(@Req() req: Request, @Body() comment: commentDto) {
    const userId: string = req.user._id;
    const page: string = req.params.page;

    return this.commentsService.createComment({
      ...comment,
      author: new mongoose.Types.ObjectId(userId),
      page,
    });
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard, BuzzAccessGuard)
  @Post("/answer/:id")
  addReply(@Req() req: Request, @Body() comment: commentDto) {
    const commentId: string = req.params.id;
    const userId: string = req.user._id;

    return this.commentsService.addReply(commentId, userId, comment);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard, BuzzAccessGuard)
  @Post("/topic/:id/ai-reply")
  aiThreadReply(@Req() req: Request, @Param("id") id: string) {
    return this.commentsService.aiThreadReply(id, req.user._id);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard, BuzzAccessGuard)
  @Post("/topic/:id/summary/regenerate")
  regenerateTopicSummary(@Req() req: Request, @Param("id") id: string) {
    return this.commentsService.regenerateTopicSummary(id, req.user._id);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard, BuzzAccessGuard)
  @Post("/topic/:id/suggestion")
  generateTopicSuggestion(@Req() req: Request, @Param("id") id: string) {
    return this.commentsService.generateTopicSuggestion(id, req.user._id);
  }

  // NEWS-1 Phase 6A P3 — page-scoped Discussion AI Summary (e.g. News item).
  // GET is public so the EN news page can render the cached summary + STALE state.
  @Get("/discussion/:page/summary")
  getDiscussionSummary(@Param("page") page: string) {
    return this.commentsService.getDiscussionSummary(page);
  }

  // Manual regeneration triggers a REAL FomoAiGateway call (INTERNAL billing).
  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("/discussion/:page/summary/regenerate")
  regenerateDiscussionSummary(@Req() req: Request, @Param("page") page: string) {
    return this.commentsService.regenerateDiscussionSummary(page, req.user?._id);
  }


  @Roles("any")
  @UseGuards(JwtAuthGuard, BuzzAccessGuard)
  @Put("like/:id")
  addLike(@Req() req: Request) {
    const commentId: string = req.params.id;
    const userId: string = req.user._id;

    return this.commentsService.addLike(commentId, userId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard, BuzzAccessGuard)
  @Put("repost/:id")
  toggleRepost(@Req() req: Request) {
    return this.commentsService.toggleRepost(req.params.id, req.user._id as string);
  }

  // Public list of a user's reposted topics (Fomies FOMO block). Auth optional.
  @UseGuards(OptionalJwtGuard)
  @Get("reposts/user/:userId")
  getUserReposts(@Req() req: Request) {
    return this.commentsService.getRepostsForUser(req.params.userId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard, BuzzAccessGuard)
  @Put("dislike/:id")
  addDislike(@Req() req: Request) {
    const commentId: string = req.params.id;
    const userId: string = req.user._id;

    return this.commentsService.addDislike(commentId, userId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard, BuzzAccessGuard)
  @Patch("report/:id")
  addReport(@Req() req: Request, @Body() body: { reason?: string }) {
    const commentId: string = req.params.id;
    const userId: string = req.user._id;

    return this.commentsService.addReport(commentId, userId, body?.reason);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Patch("admin/:id/moderation")
  setModeration(@Param("id") id: string, @Body() body: { status: "PUBLISHED" | "HIDDEN" | "REMOVED" }) {
    return this.commentsService.setModerationStatus(id, body?.status);
  }

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Patch("admin/:id/dismiss-reports")
  dismissReports(@Param("id") id: string) {
    return this.commentsService.dismissReports(id);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard, BuzzAccessGuard)
  @Delete("/delete/:id")
  deleteComment(@Req() req: Request) {
    const commentId: string = req.params.id;
    const userId: string = req.user._id;

    return this.commentsService.removeComment(commentId, userId);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Delete("admin/delete/:id")
  deleteCommentByAdmin(@Req() req: Request) {
    const commentId: string = req.params.id;

    return this.commentsService.removeComment(commentId, '',true);
  }
}
