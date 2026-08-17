import { Controller, Get, Param, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  FomoV2IcoProjectFiltersQueryDto,
  FomoV2IcoProjectListQueryDto,
} from "../dto/ico-project-query.dto";
import { FomoV2IcoProjectComparisonReadService } from "../services/ico-project-comparison-read.service";
import { FomoV2IcoProjectReadService } from "../services/ico-project-read.service";

@Controller("fomo-v2/ico-projects")
export class FomoV2IcoProjectsController {
  constructor(
    private readonly icoProjectReadService: FomoV2IcoProjectReadService,
    private readonly icoProjectComparisonReadService: FomoV2IcoProjectComparisonReadService
  ) {}

  @Get("filters")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  async getFilters(@Query() query: FomoV2IcoProjectFiltersQueryDto) {
    const limit = query.limit || 8;
    const filters = await this.icoProjectReadService.getFilterOptions(limit);

    return {
      ...filters,
      limit,
    };
  }

  @Get(":slug/comparison")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  getProjectComparison(@Param("slug") slug: string, @Query() query: any) {
    return this.icoProjectComparisonReadService.getIcoComparison(slug, query);
  }

  @Get(":slug/comparison/search")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  searchProjectComparison(@Param("slug") slug: string, @Query() query: any) {
    return this.icoProjectComparisonReadService.searchIcoComparisonProjects(
      slug,
      query
    );
  }

  @Get(":slug/comparison/history")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  getProjectComparisonHistory(
    @Param("slug") slug: string,
    @Query() query: any
  ) {
    return this.icoProjectComparisonReadService.getIcoComparisonHistory(
      slug,
      query
    );
  }

  @Get(":slug")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  getProject(@Param("slug") slug: string) {
    return this.icoProjectReadService.getProjectDetailBySlug(slug);
  }

  @Get()
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  async listProjects(@Query() query: FomoV2IcoProjectListQueryDto) {
    const limit = query.limit ? Number(query.limit) : 30;
    const offset = query.offset ? Number(query.offset) : 0;
    const { projects, total } =
      await this.icoProjectReadService.getCompatibleIcoProjects(query);

    return {
      projects,
      total,
      limit,
      offset,
    };
  }
}
