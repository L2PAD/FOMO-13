import { Controller, Get, Param, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AnalyticsService } from "./analytics.service";
import { GetChartQueryDto } from "./models/query.dto";
import { ChartTypes, EntityTypes } from "./models/chart.model";
import { GetComparisonDto } from "./models/comparison.dto";

@Controller("analytics")
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get("/charts")
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  getCharts(@Query() query: GetChartQueryDto) {
    const ids: Array<string> = query?.ids?.includes(',') ? query?.ids.split(",") : [query?.ids];
    const entityType: EntityTypes = query?.entityType || "project";
    const chartType: ChartTypes | null = query?.chartType || null;

    return this.analyticsService.getChart(ids[0], entityType, chartType);
  }

  @Get('/comparison')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  async getComparisonList(@Query() query: GetComparisonDto) {
    const { category, sortBy, limit = '50' } = query;
    return this.analyticsService.getComparisonList(category, sortBy, limit);
  }


  @Get('/funds/:regionId')
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  async getFundsStats(@Param('regionId') id: string, @Query("country") country?: string) {
    return this.analyticsService.getFundsStatsByRegion(id, country);
  }
}
