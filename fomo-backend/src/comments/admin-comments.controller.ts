import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { ContentInfluenceService } from "./content-influence.service";

/**
 * Admin-facing Content Influence explainability read-models.
 *
 * Mounted at /api/admin/comments so Customer 360 can ask a single question:
 *   GET /api/admin/comments/users/:userId/influence
 * and get the WHOLE story — summary, per-period rollups, top-performing topics,
 * the XP milestone timeline (read from the XP Ledger) and the anti-farming
 * exclusion counters. This is the same backend read-model the public profile
 * and the Top Contributors leaderboard derive their numbers from.
 */
@Controller("admin/comments")
export class AdminCommentsController {
  constructor(private readonly contentInfluence: ContentInfluenceService) {}

  @Roles("admin,moderator")
  @UseGuards(JwtAuthGuard)
  @Get("users/:userId/influence")
  getUserInfluence(@Param("userId") userId: string) {
    return this.contentInfluence.getUserInfluence(userId);
  }
}
