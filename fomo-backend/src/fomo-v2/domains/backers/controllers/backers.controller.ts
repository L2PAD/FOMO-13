import { Controller, Get, Param, Query, Req } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { FomoV2BackerReadService } from "../services/backer-read.service";

@Controller("fomo-v2/backers")
export class FomoV2BackersController {
  constructor(
    private readonly backerReadService: FomoV2BackerReadService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  private getOptionalUserId(req: Request): string | undefined {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return undefined;

      const payload: any = this.jwtService.verify(token, {
        secret: this.configService.get("JWT_SECRET_ACCESS"),
      });

      return payload?._id;
    } catch (error) {
      return undefined;
    }
  }

  @Get("funds")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  listFunds(@Query() query: Record<string, any>) {
    return this.backerReadService.listFunds(query);
  }

  @Get("funds/filters")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  getFundsFilters(@Query() query: Record<string, any>) {
    return this.backerReadService.getFundsFilters(query);
  }

  @Get("funds/analytics")
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  getFundsAnalytics(@Query() query: Record<string, any>) {
    return this.backerReadService.getFundsAnalytics(query);
  }

  @Get("funds/global-investment-map")
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  getFundsGlobalInvestmentMap(@Query() query: Record<string, any>) {
    return this.backerReadService.getFundsGlobalInvestmentMap(query);
  }

  @Get("funds/project/public")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  getFundsBySlugs(@Query() query: Record<string, any>) {
    return this.backerReadService.getFundsBySlugs(query);
  }

  @Get("funds/:backerId/projects")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  listFundProjects(
    @Param("backerId") backerId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.backerReadService.listFundProjects(backerId, query);
  }

  @Get("funds/:backerId/portfolio")
  @Throttle({ default: { limit: 180, ttl: 60_000 } })
  getFundPortfolio(
    @Param("backerId") backerId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.backerReadService.getFundPortfolio(backerId, query);
  }

  @Get("funds/:backerId/performance")
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  getFundPerformance(
    @Param("backerId") backerId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.backerReadService.getFundPerformance(backerId, query);
  }

  @Get("funds/:backerId/performance/volatility")
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  getFundPerformanceVolatility(
    @Param("backerId") backerId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.backerReadService.getFundPerformanceVolatility(backerId, query);
  }

  @Get("funds/:backerId/performance/market-footprint")
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  getFundMarketFootprint(@Param("backerId") backerId: string) {
    return this.backerReadService.getFundMarketFootprint(backerId);
  }

  @Get("funds/:backerId/performance/search")
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  searchFundPerformanceProjects(
    @Param("backerId") backerId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.backerReadService.searchFundPerformanceProjects(backerId, query);
  }

  @Get("funds/:backerId/comparison")
  @Throttle({ default: { limit: 90, ttl: 60_000 } })
  getFundComparison(
    @Param("backerId") backerId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.backerReadService.getFundComparison(backerId, query);
  }

  @Get("funds/:backerId/comparison/search")
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  searchFundComparisonFunds(
    @Param("backerId") backerId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.backerReadService.searchFundComparisonFunds(backerId, query);
  }

  @Get("funds/:backerId/locked-unlocked-token-distribution")
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  getFundLockedUnlockedTokenDistribution(@Param("backerId") backerId: string) {
    return this.backerReadService.getFundLockedUnlockedTokenDistribution(backerId);
  }

  @Get("funds/:backerId/portfolio-geography")
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  getFundPortfolioGeography(
    @Param("backerId") backerId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.backerReadService.getFundPortfolioGeography(backerId, query);
  }

  @Get("funds/:backerId")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  getFundDetail(@Param("backerId") backerId: string, @Req() req: Request) {
    return this.backerReadService.getFundDetail(
      backerId,
      this.getOptionalUserId(req)
    );
  }

  @Get("persons")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  listPersons(@Query() query: Record<string, any>) {
    return this.backerReadService.listPersons(query);
  }

  @Get("persons/filter-options")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  getPersonsFilterOptions(@Query() query: Record<string, any>) {
    return this.backerReadService.getPersonsFilterOptions(query);
  }

  @Get("persons/analytics")
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  getPersonsAnalytics(@Query() query: Record<string, any>) {
    return this.backerReadService.getPersonsAnalytics(query);
  }

  @Get("persons/:backerId/projects")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  listPersonProjects(
    @Param("backerId") backerId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.backerReadService.listPersonProjects(backerId, query);
  }

  @Get("persons/:backerId/portfolio")
  @Throttle({ default: { limit: 180, ttl: 60_000 } })
  getPersonPortfolio(
    @Param("backerId") backerId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.backerReadService.getPersonPortfolio(backerId, query);
  }

  @Get("persons/:backerId/comparison")
  @Throttle({ default: { limit: 90, ttl: 60_000 } })
  getPersonComparison(
    @Param("backerId") backerId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.backerReadService.getPersonComparison(backerId, query);
  }

  @Get("persons/:backerId/comparison/search")
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  searchPersonComparisonPersons(
    @Param("backerId") backerId: string,
    @Query() query: Record<string, any>,
  ) {
    return this.backerReadService.searchPersonComparisonPersons(backerId, query);
  }

  @Get("persons/:backerId/locked-unlocked-token-distribution")
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  getPersonLockedUnlockedTokenDistribution(@Param("backerId") backerId: string) {
    return this.backerReadService.getPersonLockedUnlockedTokenDistribution(backerId);
  }

  @Get("persons/:backerId")
  @Throttle({ default: { limit: 240, ttl: 60_000 } })
  getPersonDetail(@Param("backerId") backerId: string, @Req() req: Request) {
    return this.backerReadService.getPersonDetail(
      backerId,
      this.getOptionalUserId(req)
    );
  }
}
