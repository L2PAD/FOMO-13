import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Roles } from "src/auth/role.decorator";
import { InternalSyncGuard } from "src/common/guards/internal-sync.guard";
import { IntelSyncWorkerRunnerService } from "src/intel-sync/intel-sync-worker-runner.service";
import { DropstabInvestorsSyncService } from "./dropstab-investors-sync.service";
import { BackersPersonsQuery, InvestorsService } from "./investors.service";
import { PersonsAnalyticsSnapshotService } from "./persons-analytics-snapshot.service";

@Controller("investors")
export class InvestorsController {
  constructor(
    private readonly investorsService: InvestorsService,
    private readonly dropstabInvestorsSyncService: DropstabInvestorsSyncService,
    private readonly intelSyncWorkerRunnerService: IntelSyncWorkerRunnerService,
    private readonly personsAnalyticsSnapshotService: PersonsAnalyticsSnapshotService,
  ) {}

  private parseBackersPersonsQuery(query: any): BackersPersonsQuery {
    const arrayParams = new Set([
      "specialization",
      "country",
      "region",
      "regionData.region",
      "industryFocus",
      "sector",
      "sectors",
      "roi",
      "totalInvestments",
      "rating",
      "fullness",
      "fomoScore",
      "redFlags",
      "red-flags",
      "followers",
    ]);
    const scalarParams = new Set([
      "page",
      "limit",
      "offset",
      "name",
      "search",
      "searchValue",
      "additionalStatus",
      "sortBy",
      "sortOrder",
    ]);
    const parsedQuery: Record<string, any> = {};

    for (const [key, value] of Object.entries(query || {})) {
      const normalizedKey = key === "red-flags" ? "redFlags" : key;

      if (arrayParams.has(key)) {
        const values = Array.isArray(value)
          ? value.flatMap((item) => String(item).split(","))
          : String(value || "").split(",");
        parsedQuery[normalizedKey] = values
          .map((item: string) => item.trim())
          .filter(Boolean);
        continue;
      }

      if (scalarParams.has(key)) {
        parsedQuery[normalizedKey] = Array.isArray(value) ? value[0] : value;
      }
    }

    if (parsedQuery.page) parsedQuery.page = Number(parsedQuery.page);
    if (parsedQuery.limit) parsedQuery.limit = Number(parsedQuery.limit);
    if (parsedQuery.offset) parsedQuery.offset = Number(parsedQuery.offset);

    return parsedQuery as BackersPersonsQuery;
  }

  private parseBoolean(value: any, fallback: boolean): boolean {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "boolean") return value;
    const normalized = String(value).trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(normalized)) return true;
    if (["0", "false", "no", "off"].includes(normalized)) return false;
    return fallback;
  }

  private parseNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : undefined;
  }

  private parseString(value: any): string | undefined {
    const normalized = String(value ?? "").trim();
    return normalized || undefined;
  }

  @Get()
  list(@Query() query: any) {
    return this.investorsService.list(query);
  }

  @Roles("admin")
  @UseGuards(InternalSyncGuard)
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @Post("sync/dropstab")
  syncDropstabInvestors(
    @Body() body: Record<string, any> = {},
    @Query() query: Record<string, any> = {},
  ) {
    const input = { ...query, ...body };
    const options = {
      limit: this.parseNumber(input.limit),
      offset: this.parseNumber(input.offset),
      onlyWithDetails: this.parseBoolean(input.onlyWithDetails, true),
      onlyUpdatedSince: this.parseString(input.onlyUpdatedSince || input.updatedSince),
      dryRun: this.parseBoolean(input.dryRun, false),
      includeRaw: this.parseBoolean(input.includeRaw, false),
      apiUrl: this.parseString(input.apiUrl),
    };
    const force = this.parseBoolean(input.force, false);

    if (!force) {
      return this.intelSyncWorkerRunnerService.runJob("dropstab-investors", "manual", options);
    }

    return this.dropstabInvestorsSyncService.sync(options);
  }

  @Get("persons")
  getBackersPersons(@Query() query: any) {
    return this.investorsService.getBackersPersons(
      this.parseBackersPersonsQuery(query),
    );
  }

  @Get("persons/analytics")
  getBackersPersonsAnalytics(@Query() query: any) {
    return this.investorsService.getBackersPersonsAnalytics(
      this.parseBackersPersonsQuery(query),
    );
  }

  @Roles("admin")
  @UseGuards(InternalSyncGuard)
  @Throttle({ default: { limit: 2, ttl: 60_000 } })
  @Post("persons/analytics/snapshot/refresh")
  refreshPersonsAnalyticsSnapshot() {
    return this.personsAnalyticsSnapshotService.refreshDailyCharts("manual");
  }

  @Get("persons/filter-options")
  getBackersPersonsFilterOptions(@Query() query: any) {
    return this.investorsService.getBackersPersonsFilterOptions(
      this.parseBackersPersonsQuery(query),
    );
  }

  @Get("project/:project/top")
  getProjectTopInvestors(@Param("project") project: string, @Query() query: any) {
    return this.investorsService.getProjectTopInvestors(project, query);
  }

  @Get(":slug/portfolio-geography")
  getPortfolioGeography(@Param("slug") slug: string, @Query() query: any) {
    return this.investorsService.getPortfolioGeography(slug, query);
  }

  @Get(":slug")
  getBySlug(@Param("slug") slug: string, @Query() query: any) {
    return this.investorsService.getBySlug(slug, query);
  }

  @Get(":slug/projects")
  getInvestorProjects(@Param("slug") slug: string, @Query() query: any) {
    return this.investorsService.getInvestorProjects(slug, query);
  }
}
