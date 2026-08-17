import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import {
  FomoV2ActivityFiltersQueryDto,
  FomoV2ActivityPromotedQueryDto,
  FomoV2ActivityPublicListQueryDto,
} from "../dto";
import {
  FomoV2ActivityAccessPolicyService,
  FomoV2ActivityOptionalJwtGuard,
  FomoV2ActivityPublicReadService,
} from "../services";

@Controller("fomo-v2/activities")
@UseGuards(FomoV2ActivityOptionalJwtGuard)
@Throttle({ default: { limit: 240, ttl: 60_000 } })
export class FomoV2ActivitiesController {
  constructor(
    private readonly activityReadService: FomoV2ActivityPublicReadService,
    private readonly accessPolicy: FomoV2ActivityAccessPolicyService,
  ) {}

  // User-facing EarlyLand Prime access resolution. The public Prime gate must
  // respect the CRM-configured mode (PUBLIC / NFT / BACKEND_GRANT / OR / AND)
  // and backend grants — NOT just a client-side NFT balance check.
  @Get("my-access")
  async myAccess(@Req() request: Request) {
    const decision = await this.accessPolicy.resolve("prime", request.user as any);
    return {
      hasAccess: !!decision.allowed,
      mode: decision.mode || null,
      matchedBy: decision.matchedBy || null,
      reason: decision.reason || null,
      requirements: (decision as any).requirements || [],
      expiresAt: (decision as any).expiresAt || null,
      authenticated: !!request.user,
    };
  }

  @Get()
  list(
    @Query() query: FomoV2ActivityPublicListQueryDto,
    @Req() request: Request,
  ) {
    return this.activityReadService.list(query, request.user);
  }

  @Get("filters")
  filters(@Query() query: FomoV2ActivityFiltersQueryDto) {
    return this.activityReadService.filters(query);
  }

  @Get("promoted")
  promoted(
    @Query() query: FomoV2ActivityPromotedQueryDto,
    @Req() request: Request,
  ) {
    return this.activityReadService.promoted(query, request.user);
  }

  @Get(":id")
  get(@Param("id") id: string, @Req() request: Request) {
    return this.activityReadService.get(id, request.user);
  }
}
