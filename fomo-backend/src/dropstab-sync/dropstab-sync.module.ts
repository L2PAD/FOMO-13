import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Funds, FundsSchema } from "src/funds/funds.model";
import { Person, PersonSchema } from "src/persons/person.model";
import { Project, ProjectSchema } from "src/projects/project.model";
import { ProjectChartHistory,ProjectChartHistorySchema } from "src/projects/project-chart-history.model";
import { DropstabSyncService } from "./dropstab-sync.service";
import { HttpModule } from "@nestjs/axios";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule } from "@nestjs/config";
import { Chart, ChartSchema } from "src/analytics/models/chart.model";
import { AnalyticsModule } from "src/analytics/analytics.module";
import { Exchange, ExchangeSchema } from "src/exchanges/models/exchange.model";
import { ExchangesModule } from "src/exchanges/exchanges.module";
import { PortfolioModule } from "src/portfolio/portfolio.module";
import { FomoV2ParserControlPolicyModule } from "src/fomo-v2/domains/parser-control";

@Module({
  imports: [
    HttpModule,
    JwtModule,
    AnalyticsModule,
    ExchangesModule,
    PortfolioModule,
    FomoV2ParserControlPolicyModule,
    ConfigModule.forRoot(),
    MongooseModule.forFeature([{ name: Chart.name, schema: ChartSchema }]),
    MongooseModule.forFeature([{ name: Funds.name, schema: FundsSchema }]),
    MongooseModule.forFeature([{ name: Person.name, schema: PersonSchema }]),
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
    MongooseModule.forFeature([{ name: ProjectChartHistory.name, schema: ProjectChartHistorySchema }]),
    MongooseModule.forFeature([{ name: Exchange.name, schema: ExchangeSchema }]),
  ],
  providers: [DropstabSyncService],
  exports: [DropstabSyncService],
})
export class DropstabSyncModule {}
