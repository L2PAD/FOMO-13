import { Controller, Get, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { FomoV2LaunchpadPlacementPublicQueryDto } from "../dto";
import { FomoV2LaunchpadPlacementService } from "../services";

@Controller("fomo-v2/launchpad/placements")
@Throttle({ default: { limit: 240, ttl: 60_000 } })
export class FomoV2LaunchpadPlacementController {
  constructor(
    private readonly placementService: FomoV2LaunchpadPlacementService
  ) {}

  @Get()
  list(@Query() query: FomoV2LaunchpadPlacementPublicQueryDto) {
    return this.placementService.listPublic(query);
  }
}
