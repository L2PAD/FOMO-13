import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { Chart, ChartDocument } from "src/analytics/models/chart.model";
import {
  ProjectChartHistory,
  ProjectChartHistoryDocument,
} from "src/projects/project-chart-history.model";
import { Project, ProjectDocument } from "src/projects/project.model";

export interface CoinGeckoHistoryResetOptions {
  dryRun?: boolean;
  write?: boolean;
  projectIds?: string[];
  resetCharts?: boolean;
  resetRawHistory?: boolean;
  resetProjectLegacyFields?: boolean;
}

@Injectable()
export class CoinGeckoHistoryResetService {
  private readonly logger = new Logger(CoinGeckoHistoryResetService.name);

  constructor(
    @InjectModel(Chart.name)
    private readonly chartModel: Model<ChartDocument>,
    @InjectModel(ProjectChartHistory.name)
    private readonly projectChartHistoryModel: Model<ProjectChartHistoryDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly configService: ConfigService,
  ) {}

  async resetProjectPriceHistory(options: CoinGeckoHistoryResetOptions = {}): Promise<any> {
    const startedAt = new Date();
    const dryRun = options.write === true ? false : options.dryRun !== false;
    const projectIds = this.toObjectIds(options.projectIds || []);
    const chartFilter: any = { entityType: "project" };
    const historyFilter: any = { projectId: { $exists: true } };
    const projectFilter: any = {
      $or: [
        { chart7d: { $exists: true } },
        { chartImage7d: { $exists: true } },
        { lastPriceHistoryUpdate: { $exists: true } },
      ],
    };

    if (projectIds.length) {
      chartFilter.entityId = { $in: projectIds };
      historyFilter.projectId = { $in: projectIds };
      projectFilter._id = { $in: projectIds };
    }

    const resetCharts = options.resetCharts !== false;
    const resetRawHistory = options.resetRawHistory !== false;
    const resetProjectLegacyFields = options.resetProjectLegacyFields !== false;
    const counts = {
      projectCharts: resetCharts ? await this.chartModel.countDocuments(chartFilter) : 0,
      projectChartHistories: resetRawHistory
        ? await this.projectChartHistoryModel.countDocuments(historyFilter)
        : 0,
      rawBucketedHistory: resetRawHistory
        ? await this.projectChartHistoryModel.countDocuments({
            ...historyFilter,
            bucketTimestamp: { $type: "date" },
          })
        : 0,
      projectsWithLegacyChartFields: resetProjectLegacyFields
        ? await this.projectModel.countDocuments(projectFilter)
        : 0,
    };
    const summary = {
      dryRun,
      enabled: dryRun || this.readBooleanFlag("COINGECKO_HISTORY_RESET_ENABLED", false),
      startedAt: startedAt.toISOString(),
      finishedAt: "",
      projectScope: projectIds.length ? projectIds.map((id) => id.toString()) : "all",
      countsBefore: counts,
      deletedProjectCharts: 0,
      deletedProjectChartHistories: 0,
      unsetProjectLegacyFields: 0,
      backupReminder: [
        "mongodump --db <db_name> --collection charts --out ./backup-before-coingecko-history-reset",
        "mongodump --db <db_name> --collection projectcharthistories --out ./backup-before-coingecko-history-reset",
      ],
    };

    if (!dryRun && !summary.enabled) {
      summary.finishedAt = new Date().toISOString();
      return {
        ...summary,
        disabledReason: "COINGECKO_HISTORY_RESET_ENABLED=false",
      };
    }

    if (!dryRun) {
      if (resetCharts) {
        const result = await this.chartModel.deleteMany(chartFilter);
        summary.deletedProjectCharts = Number(result.deletedCount || 0);
      }

      if (resetRawHistory) {
        const result = await this.projectChartHistoryModel.deleteMany(historyFilter);
        summary.deletedProjectChartHistories = Number(result.deletedCount || 0);
      }

      if (resetProjectLegacyFields) {
        const result = await this.projectModel.updateMany(projectFilter, {
          $unset: {
            chart7d: "",
            chartImage7d: "",
            chartImage7dGeneratedAt: "",
            chartImage7dSourceLastTimestamp: "",
            chartImage7dPointsCount: "",
            chartImage7dTrend: "",
            lastPriceHistoryUpdate: "",
          },
        });
        summary.unsetProjectLegacyFields = Number((result as any).modifiedCount || 0);
      }
    }

    summary.finishedAt = new Date().toISOString();
    this.logger.log(
      JSON.stringify({
        event: "coingecko_history_reset_finished",
        dryRun,
        countsBefore: summary.countsBefore,
        deletedProjectCharts: summary.deletedProjectCharts,
        deletedProjectChartHistories: summary.deletedProjectChartHistories,
        unsetProjectLegacyFields: summary.unsetProjectLegacyFields,
      }),
    );

    return summary;
  }

  private toObjectIds(projectIds: string[]): mongoose.Types.ObjectId[] {
    return [...new Set(projectIds)]
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
  }

  private readBooleanFlag(name: string, defaultValue: boolean): boolean {
    const value = this.configService.get(name) ?? process.env[name];
    if (value === undefined || value === null || value === "") return defaultValue;
    const normalized = String(value).trim().toLowerCase();
    if (["false", "0", "off", "no"].includes(normalized)) return false;
    if (["true", "1", "on", "yes"].includes(normalized)) return true;
    return defaultValue;
  }
}
