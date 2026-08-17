import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import {
  FomoV2EntityFlagCreateInput,
  FomoV2EntityFlagListQuery,
  FomoV2EntityFlagReviewInput,
  FomoV2EntityFlagService,
} from "../services";

@Controller()
export class FomoV2EntityFlagsController {
  constructor(private readonly flagService: FomoV2EntityFlagService) {}

  @Get("fomo-v2/flags/:entityType/:entityId")
  getFlags(
    @Param("entityType") entityType: string,
    @Param("entityId") entityId: string
  ) {
    return this.flagService.getFlagState(entityType, entityId);
  }

  @Roles("any")
  @UseGuards(JwtAuthGuard)
  @Post("fomo-v2/flags")
  createFlag(@Body() body: FomoV2EntityFlagCreateInput, @Req() req: Request) {
    return this.flagService.createFlag(body, req.user?._id);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/fomo-v2/flags")
  listAdminFlags(@Query() query: FomoV2EntityFlagListQuery) {
    return this.flagService.listAdmin(query);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Get("admin/fomo-v2/flags/:id")
  getAdminFlag(@Param("id") id: string) {
    return this.flagService.getAdminFlag(id);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin/fomo-v2/flags/:id/confirm")
  confirmFlag(
    @Param("id") id: string,
    @Body() body: FomoV2EntityFlagReviewInput,
    @Req() req: Request
  ) {
    return this.flagService.confirmFlag(id, req.user?._id, body);
  }

  @Roles("admin")
  @UseGuards(JwtAuthGuard)
  @Post("admin/fomo-v2/flags/:id/reject")
  rejectFlag(
    @Param("id") id: string,
    @Body() body: FomoV2EntityFlagReviewInput,
    @Req() req: Request
  ) {
    return this.flagService.rejectFlag(id, req.user?._id, body);
  }
}
