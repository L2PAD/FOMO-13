import { Controller, Get, Inject, Param, Query } from "@nestjs/common";
import { FomoV2MarketProjectChartReadService } from "../services/market-project-chart-read.service";
import { FomoV2MarketProjectTokenComparisonService } from "../services/market-project-token-comparison.service";
import {
  FomoV2ProjectExchangeMarketsService,
  type FomoV2ExchangeOverviewType,
} from "../services/project-exchange-markets.service";

@Controller("fomo-v2/projects")
export class FomoV2ProjectExchangeMarketsController {
  constructor(
    @Inject(FomoV2ProjectExchangeMarketsService)
    private readonly exchangeMarketsService: FomoV2ProjectExchangeMarketsService,
    @Inject(FomoV2MarketProjectChartReadService)
    private readonly chartReadService: FomoV2MarketProjectChartReadService,
    @Inject(FomoV2MarketProjectTokenComparisonService)
    private readonly tokenComparisonService: FomoV2MarketProjectTokenComparisonService,
  ) {}

  @Get("market/search")
  searchMarketProjects(@Query() query: any) {
    return this.chartReadService.searchMarketProjects(query);
  }

  @Get(":projectId/chart")
  getProjectChart(@Param("projectId") projectId: string, @Query() query: any) {
    return this.chartReadService.getProjectChart(projectId, query);
  }

  @Get(":projectId/token-comparison")
  getProjectTokenComparison(@Param("projectId") projectId: string, @Query() query: any) {
    return this.tokenComparisonService.getProjectTokenComparison(projectId, query);
  }

  @Get(":projectId/exchange-overview")
  getExchangeOverview(@Param("projectId") projectId: string) {
    return this.exchangeMarketsService.getProjectExchangeOverview(projectId);
  }

  @Get(":projectId/exchange-markets")
  getExchangeMarkets(
    @Param("projectId") projectId: string,
    @Query("type") type?: FomoV2ExchangeOverviewType,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.exchangeMarketsService.getProjectExchangeMarkets(projectId, {
      type,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
