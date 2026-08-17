import { Controller, Get, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  FomoV2UnlockCategoriesQueryDto,
  FomoV2UnlockFeedQueryDto,
} from "../dto";
import { FomoV2UnlockFeedReadService } from "../services";

@Controller("fomo-v2/unlocks")
export class FomoV2UnlockFeedController {
  constructor(
    private readonly unlockFeedReadService: FomoV2UnlockFeedReadService
  ) {}

  @Get("categories")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  getCategories(@Query() query: FomoV2UnlockCategoriesQueryDto) {
    return this.unlockFeedReadService.getTokenUnlockCategories(query);
  }

  @Get()
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  async getUnlocks(@Query() query: FomoV2UnlockFeedQueryDto) {
    const result = await this.unlockFeedReadService.getTokenUnlocks(query);

    return {
      ...result,
      total: result.totalCount,
    };
  }
}
