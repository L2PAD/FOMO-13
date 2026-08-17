import { Controller, Get, Inject, Param, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  FomoV2FundingFeedFiltersQueryDto,
  FomoV2FundingFeedInvestorsQueryDto,
  FomoV2FundingFeedListQueryDto,
  FomoV2FundingProjectRoundsQueryDto,
  FomoV2ProjectTopInvestorsQueryDto,
} from "../dto/funding-feed-query.dto";
import { FomoV2FundingFeedReadService } from "../services/funding-feed-read.service";

@Controller("fomo-v2/funding-feed")
export class FomoV2FundingFeedController {
  constructor(
    @Inject(FomoV2FundingFeedReadService)
    private readonly fundingFeedReadService: FomoV2FundingFeedReadService,
  ) {}

  @Get("filters")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  async getFilterOptions(@Query() query: FomoV2FundingFeedFiltersQueryDto) {
    const limit = query.limit || 8;
    const filters = await this.fundingFeedReadService.getFilterOptions(limit);

    return {
      ...filters,
      limit,
    };
  }

  @Get("investors/search")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  searchInvestors(@Query() query: FomoV2FundingFeedInvestorsQueryDto) {
    return this.fundingFeedReadService.searchInvestors(query);
  }

  @Get("projects/:project/investors")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  getProjectTopInvestors(
    @Param("project") project: string,
    @Query() query: FomoV2ProjectTopInvestorsQueryDto,
  ) {
    return this.fundingFeedReadService.getProjectTopInvestors(project, query);
  }

  @Get("projects/:project/rounds")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  getProjectRounds(
    @Param("project") project: string,
    @Query() query: FomoV2FundingProjectRoundsQueryDto,
  ) {
    return this.fundingFeedReadService.getProjectRounds(project, query);
  }

  @Get()
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  async listRounds(@Query() query: FomoV2FundingFeedListQueryDto) {
    const limit = query.limit ? Number(query.limit) : 100;
    const offset = query.offset ? Number(query.offset) : 0;
    const { rounds, total } = await this.fundingFeedReadService.listRounds(query);

    return {
      rounds,
      total,
      limit,
      offset,
    };
  }
}
