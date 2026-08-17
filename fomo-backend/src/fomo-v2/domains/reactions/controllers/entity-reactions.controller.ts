import { Controller, Param, Patch, Req, UseGuards } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import { FomoV2EntityReactionService } from "../services";

@Controller("fomo-v2/reactions")
export class FomoV2EntityReactionsController {
  constructor(private readonly reactionService: FomoV2EntityReactionService) {}

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Patch(":entityType/:entityId/:reaction")
  toggleReaction(
    @Param("entityType") entityType: string,
    @Param("entityId") entityId: string,
    @Param("reaction") reaction: string,
    @Req() req: Request
  ) {
    return this.reactionService.toggleReaction(
      entityType,
      entityId,
      req.user?._id,
      reaction
    );
  }
}
