import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { FomoV2ActivityOptionalJwtGuard } from "../../activities/services/activity-optional-jwt.guard";
import { FomoV2IcoProjectReadService } from "../../ico/services/ico-project-read.service";
import {
  FomoV2MarketCategoryParamDto,
  FomoV2MarketProjectListQueryDto,
  FomoV2ProjectLookupQueryDto,
  FomoV2ProjectParamDto,
  FomoV2ProjectUnlocksQueryDto,
} from "../dto/market-project-query.dto";
import { FomoV2MarketProjectReadModelService } from "../services/market-project-read-model.service";

@Controller("fomo-v2/projects")
@UseGuards(FomoV2ActivityOptionalJwtGuard)
export class FomoV2MarketProjectsController {
  constructor(
    private readonly marketProjectReadService: FomoV2MarketProjectReadModelService,
    private readonly icoProjectReadService: FomoV2IcoProjectReadService,
  ) {}

  @Get("market/search")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  async searchMarketProjects(@Query() query: FomoV2MarketProjectListQueryDto) {
    const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 50);
    const assets = await this.marketProjectReadService.searchPortfolioAssets(
      query.searchValue || "",
      limit,
    );

    return {
      assets,
      projects: assets,
      total: assets.length,
      limit,
    };
  }

  @Get("market")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  listMarketProjects(@Query() query: FomoV2MarketProjectListQueryDto) {
    return this.marketProjectReadService.getCompatibleMarketProjects(query, {
      fallback: "none",
    });
  }

  @Get("categories")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  getMarketCategories() {
    return this.marketProjectReadService.getMarketCategories();
  }

  @Get("category/:type")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  getMarketCategory(
    @Param() params: FomoV2MarketCategoryParamDto,
    @Query() query: FomoV2MarketProjectListQueryDto,
  ) {
    return this.marketProjectReadService.getMarketCategory(params.type, query);
  }

  @Get(":projectId/detail")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  async getProjectDetail(
    @Param() params: FomoV2ProjectParamDto,
    @Query() query: FomoV2ProjectLookupQueryDto,
    @Req() request: Request,
  ) {
    const projectType = String(query.projectType || "market").toLowerCase();
    const userId = request.user?._id;

    if (projectType === "market" || query.lookup === "coingeckoId") {
      return this.marketProjectReadService.getMarketProjectDetailByCoinGeckoId(
        params.projectId,
        userId,
      );
    }

    if (projectType === "project" || projectType === "ico") {
      return this.icoProjectReadService.getProjectDetailBySlug(
        params.projectId,
        userId,
      );
    }

    try {
      return await this.icoProjectReadService.getProjectDetailBySlug(
        params.projectId,
        userId,
      );
    } catch (error) {
      if (
        !(error instanceof HttpException) ||
        error.getStatus() !== HttpStatus.NOT_FOUND
      ) {
        throw error;
      }
    }

    return this.marketProjectReadService.getEchoProjectDetailBySlug(
      params.projectId,
      userId,
    );
  }

  @Get(":projectId/unlocks")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  getProjectUnlocks(
    @Param() params: FomoV2ProjectParamDto,
    @Query() query: FomoV2ProjectUnlocksQueryDto,
  ) {
    return this.marketProjectReadService.getMarketProjectUnlocks(
      params.projectId,
      query,
    );
  }

  @Get(":projectId/fundraising")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  getProjectFundraising(
    @Param() params: FomoV2ProjectParamDto,
    @Query() query: FomoV2ProjectLookupQueryDto,
  ) {
    return this.marketProjectReadService.getMarketProjectFundraising(
      params.projectId,
      query,
    );
  }
}
