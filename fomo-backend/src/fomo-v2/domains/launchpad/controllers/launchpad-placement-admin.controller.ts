import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/jwt.auth.guard";
import { Roles } from "src/auth/role.decorator";
import {
  FomoV2LaunchpadPlacementAdminQueryDto,
  FomoV2LaunchpadPlacementPatchDto,
  FomoV2LaunchpadPlacementUpsertDto,
} from "../dto";
import { FomoV2LaunchpadPlacementService } from "../services";

@Controller("admin/fomo-v2/launchpad/placements")
@Roles("admin")
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 180, ttl: 60_000 } })
export class FomoV2LaunchpadPlacementAdminController {
  constructor(
    private readonly placementService: FomoV2LaunchpadPlacementService
  ) {}

  @Get()
  list(@Query() query: FomoV2LaunchpadPlacementAdminQueryDto) {
    return this.placementService.listAdmin(query);
  }

  @Post()
  upsert(
    @Body() body: FomoV2LaunchpadPlacementUpsertDto,
    @Req() request: Request
  ) {
    return this.placementService.upsert(body, request.user);
  }

  @Patch(":id")
  patch(
    @Param("id") id: string,
    @Body() body: FomoV2LaunchpadPlacementPatchDto,
    @Req() request: Request
  ) {
    return this.placementService.patch(id, body, request.user);
  }

  @Delete(":id")
  remove(@Param("id") id: string, @Req() request: Request) {
    return this.placementService.remove(id, request.user);
  }
}
