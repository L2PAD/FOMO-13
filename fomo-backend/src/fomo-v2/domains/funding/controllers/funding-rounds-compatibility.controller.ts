import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Roles } from "src/auth/role.decorator";
import { InternalSyncGuard } from "src/common/guards/internal-sync.guard";
import {
  FomoV2FundingFeedFiltersQueryDto,
  FomoV2FundingFeedListQueryDto,
  FomoV2FundingProjectRoundsQueryDto,
} from "../dto/funding-feed-query.dto";
import {
  FomoV2FundingRoundsCompatibilityProjectParamsDto,
  FomoV2FundingRoundsIntelSyncDto,
} from "../dto/funding-rounds-compatibility.dto";
import { FomoV2FundingFeedReadService } from "../services/funding-feed-read.service";
import { FomoV2IntelFundraisingGapFillDryRunService } from "../services/intel-fundraising-gap-fill-dry-run.service";

const DEFAULT_SYNC_LIMIT = 100;
const MAX_SYNC_LIMIT = 200;

/**
 * Temporary route compatibility boundary for consumers of the former
 * FundingRoundsModule. All persistence and reads are owned by FOMO v2.
 */
@Controller("rounds")
export class FomoV2FundingRoundsCompatibilityController {
  constructor(
    @Inject(FomoV2FundingFeedReadService)
    private readonly fundingFeedReadService: FomoV2FundingFeedReadService,
    @Inject(FomoV2IntelFundraisingGapFillDryRunService)
    private readonly intelFundraisingSyncService: FomoV2IntelFundraisingGapFillDryRunService
  ) {}

  @Roles("admin")
  @UseGuards(InternalSyncGuard)
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @Post("sync/intel")
  syncIntelFundingRounds(
    @Body() body: FomoV2FundingRoundsIntelSyncDto,
    @Query() query: FomoV2FundingRoundsIntelSyncDto
  ) {
    const input = this.mergeSyncInput(body, query);
    const limit = Math.min(
      Math.max(Number(input.limit) || DEFAULT_SYNC_LIMIT, 1),
      MAX_SYNC_LIMIT
    );
    const dryRun = input.dryRun === true;

    return this.intelFundraisingSyncService.run({
      limit,
      sourceType: input.sourceType || "dropstab",
      sourceDocumentIds: input.sourceDocumentIds,
      debug: input.debug === true,
      canonicalMarketlessOnly: input.canonicalMarketlessOnly === true,
      write: !dryRun,
      feedRounds: !dryRun,
      participantsOnly: false,
      all: false,
      allConfirmed: false,
    });
  }

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

  @Get()
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  async listRounds(@Query() query: FomoV2FundingFeedListQueryDto) {
    const limit = query.limit ? Number(query.limit) : 100;
    const offset = query.offset ? Number(query.offset) : 0;
    const { rounds, total } = await this.fundingFeedReadService.listRounds(
      query
    );

    return {
      rounds,
      total,
      limit,
      offset,
    };
  }

  @Get(":project")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  getProjectRounds(
    @Param() params: FomoV2FundingRoundsCompatibilityProjectParamsDto,
    @Query() query: FomoV2FundingProjectRoundsQueryDto
  ) {
    return this.fundingFeedReadService.getProjectRounds(params.project, query);
  }

  private mergeSyncInput(
    body: FomoV2FundingRoundsIntelSyncDto | undefined,
    query: FomoV2FundingRoundsIntelSyncDto | undefined
  ): FomoV2FundingRoundsIntelSyncDto {
    return {
      ...(body || {}),
      ...(query || {}),
    };
  }
}
