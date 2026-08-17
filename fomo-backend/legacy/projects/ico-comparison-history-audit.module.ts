import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { Chart, ChartSchema } from "src/analytics/models/chart.model";
import { buildMongoUri } from "src/config/mongo.config";
import { IcoComparisonHistoryAuditService } from "./ico-comparison-history-audit.service";
import { ProjectChartHistory, ProjectChartHistorySchema } from "./project-chart-history.model";
import { Project, ProjectSchema } from "./project.model";

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          uri: buildMongoUri({
            DB_URL: configService.get<string>("DB_URL"),
            DB_NAME: configService.get<string>("DB_NAME"),
          } as NodeJS.ProcessEnv),
          maxPoolSize: parseInt(configService.get<string>("DB_MAX_POOL_SIZE") || "10", 10),
          minPoolSize: parseInt(configService.get<string>("DB_MIN_POOL_SIZE") || "2", 10),
          autoIndex: false,
        };
      },
    }),
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: ProjectChartHistory.name, schema: ProjectChartHistorySchema },
      { name: Chart.name, schema: ChartSchema },
    ]),
  ],
  providers: [IcoComparisonHistoryAuditService],
  exports: [IcoComparisonHistoryAuditService],
})
export class IcoComparisonHistoryAuditModule {}
