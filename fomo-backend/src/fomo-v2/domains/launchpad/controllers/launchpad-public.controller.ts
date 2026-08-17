import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  FomoV2LaunchpadPublicDetailQueryDto,
  FomoV2LaunchpadPublicListQueryDto,
  FomoV2LaunchpadVerifyUserTransactionDto,
} from "../dto";
import { FomoV2LaunchpadPublicService } from "../services";

@Controller("fomo-v2/launchpad")
@Throttle({ default: { limit: 180, ttl: 60_000 } })
export class FomoV2LaunchpadPublicController {
  constructor(private readonly service: FomoV2LaunchpadPublicService) {}

  @Get()
  list(@Query() query: FomoV2LaunchpadPublicListQueryDto) {
    return this.service.list(query);
  }

  @Post(":idOrSlug/transactions/verify")
  verifyTransaction(
    @Param("idOrSlug") idOrSlug: string,
    @Body() body: FomoV2LaunchpadVerifyUserTransactionDto
  ) {
    return this.service.verifyTransaction(idOrSlug, body);
  }

  @Get(":idOrSlug")
  detail(
    @Param("idOrSlug") idOrSlug: string,
    @Query() query: FomoV2LaunchpadPublicDetailQueryDto
  ) {
    return this.service.detail(idOrSlug, query.wallet);
  }
}
