import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { buildMongoUri } from "src/config/mongo.config";
import {
  Portfolio,
  PortfolioSchema,
  Transaction,
  TransactionSchema,
} from "src/portfolio/model/portfolio.model";
import { PortfolioAutoRecalcService } from "src/portfolio/portfolio-auto-recalc.service";
import { PortfolioCalculationService } from "src/portfolio/portfolio-calculation.service";
import { PortfolioRecalculationService } from "src/portfolio/portfolio-recalculation.service";
import { Project, ProjectSchema } from "src/projects/project.model";
import { AnalyticsModule } from "src/analytics/analytics.module";
import { RatingModule } from "src/rating/rating.module";
import { Chart, ChartSchema } from "src/analytics/models/chart.model";
import { ProjectChartHistory, ProjectChartHistorySchema } from "src/projects/project-chart-history.model";
import {
  ProjectSourceMap,
  ProjectSourceMapSchema,
} from "src/projects/intel-sync/models/project-source-map.model";
import { CoinGeckoMarketDiagnosticsService } from "./coingecko-market-diagnostics.service";
import { CoinGeckoHistoryBackfillService } from "./coingecko-history-backfill.service";
import { CoinGeckoHistoryResetService } from "./coingecko-history-reset.service";
import { CoinGeckoTierAuditService } from "./coingecko-tier-audit.service";
import { CoinGeckoMappingBackfillService } from "./coingecko-mapping-backfill.service";
import { CoinGeckoMarketUpdateService } from "./coingecko-market-update.service";
import { CoinGeckoAliasMappingService } from "./coingecko-alias-mapping.service";
import { CoinGeckoHotMappingAuditService } from "./coingecko-hot-mapping-audit.service";
import { CoinGeckoProClientService } from "./coingecko-pro-client.service";
import { CoinGeckoProjectResolverService } from "./coingecko-project-resolver.service";
import { MarketDataOrchestratorService } from "./market-data-orchestrator.service";

@Module({
  imports: [
    ConfigModule.forRoot(),
    AnalyticsModule,
    RatingModule,
    MongooseModule.forRoot(buildMongoUri(), {
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || "10"),
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || "2"),
      autoIndex: process.env.DB_AUTO_INDEX === "true",
    }),
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Chart.name, schema: ChartSchema },
      { name: ProjectChartHistory.name, schema: ProjectChartHistorySchema },
      { name: ProjectSourceMap.name, schema: ProjectSourceMapSchema },
      { name: Portfolio.name, schema: PortfolioSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  providers: [
    PortfolioAutoRecalcService,
    PortfolioCalculationService,
    PortfolioRecalculationService,
    CoinGeckoProClientService,
    CoinGeckoAliasMappingService,
    CoinGeckoHotMappingAuditService,
    CoinGeckoProjectResolverService,
    CoinGeckoMarketUpdateService,
    CoinGeckoMarketDiagnosticsService,
    CoinGeckoHistoryBackfillService,
    CoinGeckoHistoryResetService,
    CoinGeckoTierAuditService,
    CoinGeckoMappingBackfillService,
    MarketDataOrchestratorService,
  ],
})
export class CoinGeckoDiagnosticsCliModule {}
