import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { PortfolioModule } from "src/portfolio/portfolio.module";
import { AnalyticsModule } from "src/analytics/analytics.module";
import { RatingModule } from "src/rating/rating.module";
import { Chart, ChartSchema } from "src/analytics/models/chart.model";
import { Transaction, TransactionSchema } from "src/portfolio/model/portfolio.model";
import { ProjectChartHistory, ProjectChartHistorySchema } from "src/projects/project-chart-history.model";
import { Project, ProjectSchema } from "src/projects/project.model";
import {
  ProjectSourceMap,
  ProjectSourceMapSchema,
} from "src/projects/intel-sync/models/project-source-map.model";
import { CoinGeckoProClientService } from "./coingecko-pro-client.service";
import { CoinGeckoCreditUsageService } from "./coingecko-credit-usage.service";
import { CoinGeckoAliasMappingService } from "./coingecko-alias-mapping.service";
import { CoinGeckoDiagnosticsController } from "./coingecko-diagnostics.controller";
import { CoinGeckoHotMappingAuditService } from "./coingecko-hot-mapping-audit.service";
import { CoinGeckoMappingBackfillService } from "./coingecko-mapping-backfill.service";
import { CoinGeckoMarketDiagnosticsService } from "./coingecko-market-diagnostics.service";
import { CoinGeckoHistoryBackfillService } from "./coingecko-history-backfill.service";
import { CoinGeckoHistoryResetService } from "./coingecko-history-reset.service";
import { CoinGeckoTierAuditService } from "./coingecko-tier-audit.service";
import { CoinGeckoProjectResolverService } from "./coingecko-project-resolver.service";
import { CoinGeckoMarketUpdateService } from "./coingecko-market-update.service";
import { MarketDataOrchestratorService } from "./market-data-orchestrator.service";

@Module({
  imports: [
    ConfigModule.forRoot(),
    JwtModule.register({}),
    PortfolioModule,
    AnalyticsModule,
    RatingModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Chart.name, schema: ChartSchema },
      { name: ProjectChartHistory.name, schema: ProjectChartHistorySchema },
      { name: ProjectSourceMap.name, schema: ProjectSourceMapSchema },
      { name: Transaction.name, schema: TransactionSchema },
    ]),
  ],
  providers: [
    CoinGeckoProClientService,
    CoinGeckoCreditUsageService,
    CoinGeckoAliasMappingService,
    CoinGeckoProjectResolverService,
    CoinGeckoMarketUpdateService,
    CoinGeckoMarketDiagnosticsService,
    CoinGeckoHistoryBackfillService,
    CoinGeckoHistoryResetService,
    CoinGeckoTierAuditService,
    CoinGeckoHotMappingAuditService,
    CoinGeckoMappingBackfillService,
    MarketDataOrchestratorService,
  ],
  controllers: [CoinGeckoDiagnosticsController],
  exports: [
    CoinGeckoProClientService,
    CoinGeckoCreditUsageService,
    CoinGeckoAliasMappingService,
    CoinGeckoProjectResolverService,
    CoinGeckoMarketUpdateService,
    CoinGeckoMarketDiagnosticsService,
    CoinGeckoHistoryBackfillService,
    CoinGeckoHistoryResetService,
    CoinGeckoTierAuditService,
    CoinGeckoHotMappingAuditService,
    CoinGeckoMappingBackfillService,
    MarketDataOrchestratorService,
  ],
})
export class CoinGeckoModule {}
