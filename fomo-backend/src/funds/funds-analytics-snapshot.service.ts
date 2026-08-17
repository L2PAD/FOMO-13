import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import { Model } from "mongoose";
import { FomoV2FundingFeedRoundReadModel } from "src/fomo-v2/domains/funding/models";
import {
  FundsAnalyticsSnapshot,
  FundsAnalyticsSnapshotDocument,
} from "./funds-analytics-snapshot.model";

type FundsFundingDynamicsRow = {
  date: Date | string;
  category?: string;
  amount: number;
  keyProjects?: Array<{
    name?: string;
    amount?: number;
    category?: string;
  }>;
};

type FundsFundingDynamicsPoint = {
  name: string;
  date: string;
  periodEnd: string;
  totalInvestment: number;
  categories: string[];
  keyProjects: Array<{
    name: string;
    amount: number;
    category: string;
  }>;
  investments0: number;
  investments1: number;
  investments2: number;
  investments3: number;
  investments4: number;
  investments5: number;
};

type FundsAnalyticsPreparedCharts = {
  fundingDynamics: Record<string, FundsFundingDynamicsPoint[]>;
  topSectorsByPeriod: Record<string, any[]>;
  topSectors: any[];
  generatedAt?: Date;
};

const SNAPSHOT_SCOPE = "global";
const SNAPSHOT_VERSION = "funds-analytics-charts-v1";

@Injectable()
export class FundsAnalyticsSnapshotService {
  private readonly logger = new Logger(FundsAnalyticsSnapshotService.name);
  private refreshInProgress = false;

  constructor(
    @InjectModel(FomoV2FundingFeedRoundReadModel.name)
    private readonly fundingRoundModel: Model<FomoV2FundingFeedRoundReadModel>,
    @InjectModel(FundsAnalyticsSnapshot.name)
    private readonly snapshotModel: Model<FundsAnalyticsSnapshotDocument>,
    private readonly configService: ConfigService,
  ) {}

  @Cron(process.env.FUNDS_ANALYTICS_SNAPSHOT_CRON || "0 15 2 * * *", {
    name: "funds-analytics-snapshot",
  })
  async handleSnapshotCron(): Promise<void> {
    if (!this.isCronEnabled()) return;

    try {
      await this.refreshDailyCharts("cron");
    } catch (error) {
      this.logger.error(
        `Funds analytics snapshot cron failed: ${error.message}`,
        error.stack,
      );
    }
  }

  async getLatestPreparedCharts(): Promise<FundsAnalyticsPreparedCharts | null> {
    const snapshot = await this.snapshotModel
      .findOne({
        scope: SNAPSHOT_SCOPE,
        version: SNAPSHOT_VERSION,
        status: "ready",
      })
      .sort({ generatedAt: -1 })
      .lean();

    if (!snapshot) return null;

    return {
      fundingDynamics: snapshot.fundingDynamics || {},
      topSectorsByPeriod: snapshot.topSectorsByPeriod || {},
      topSectors: Array.isArray(snapshot.topSectors) ? snapshot.topSectors : [],
      generatedAt: snapshot.generatedAt,
    };
  }

  async refreshDailyCharts(trigger = "manual") {
    if (this.refreshInProgress) {
      return {
        skipped: true,
        reason: "Funds analytics snapshot refresh is already running.",
      };
    }

    this.refreshInProgress = true;
    const startedAt = new Date();

    await this.snapshotModel.updateOne(
      { scope: SNAPSHOT_SCOPE, version: SNAPSHOT_VERSION },
      {
        $set: {
          scope: SNAPSHOT_SCOPE,
          version: SNAPSHOT_VERSION,
          status: "building",
          trigger,
          startedAt,
          error: null,
        },
      },
      { upsert: true },
    );

    try {
      const [fundingDynamics, topSectorsByPeriod, fundingRoundsCount] =
        await Promise.all([
          this.getFundingRoundsDynamics(),
          this.getIndustryAllocationByPeriod(),
          this.fundingRoundModel.countDocuments({
            visible: true,
            raisedAmount: { $gt: 0 },
            fundingDate: { $ne: null },
          }),
        ]);
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();
      const topSectors = Array.isArray(topSectorsByPeriod.chartAll)
        ? topSectorsByPeriod.chartAll
        : [];

      await this.snapshotModel.updateOne(
        { scope: SNAPSHOT_SCOPE, version: SNAPSHOT_VERSION },
        {
          $set: {
            scope: SNAPSHOT_SCOPE,
            version: SNAPSHOT_VERSION,
            generatedAt: completedAt,
            startedAt,
            completedAt,
            durationMs,
            status: "ready",
            trigger,
            error: null,
            fundingDynamics,
            topSectorsByPeriod,
            topSectors,
            meta: {
              fundingRoundsCount,
              topSectorsCount: topSectors.length,
              fundingDynamicsPoints: this.countFundingDynamicsPoints(fundingDynamics),
            },
          },
        },
        { upsert: true },
      );

      this.logger.log(
        `Funds analytics snapshot refreshed in ${durationMs}ms (${trigger}).`,
      );

      return {
        skipped: false,
        scope: SNAPSHOT_SCOPE,
        version: SNAPSHOT_VERSION,
        generatedAt: completedAt,
        durationMs,
        fundingRoundsCount,
        topSectorsCount: topSectors.length,
        fundingDynamicsPoints: this.countFundingDynamicsPoints(fundingDynamics),
      };
    } catch (error) {
      await this.snapshotModel.updateOne(
        { scope: SNAPSHOT_SCOPE, version: SNAPSHOT_VERSION },
        {
          $set: {
            status: "failed",
            completedAt: new Date(),
            durationMs: Date.now() - startedAt.getTime(),
            trigger,
            error: error?.message || String(error),
          },
        },
        { upsert: true },
      );
      throw error;
    } finally {
      this.refreshInProgress = false;
    }
  }

  private async getFundingRoundsDynamics() {
    const rows = await this.fundingRoundModel
      .aggregate<FundsFundingDynamicsRow>([
        {
          $match: {
            visible: true,
            raisedAmount: { $gt: 0 },
            fundingDate: { $ne: null },
          },
        },
        { $sort: { fundingDate: -1 } },
        { $limit: 12000 },
        {
          $project: {
            _id: 0,
            date: "$fundingDate",
            amount: "$raisedAmount",
            category: {
              $ifNull: [
                "$projectCategory",
                {
                  $ifNull: ["$roundType", "Unknown"],
                },
              ],
            },
            keyProjects: [
              {
                name: {
                  $ifNull: [
                    "$projectSymbol",
                    {
                      $ifNull: ["$projectName", "$projectSlug"],
                    },
                  ],
                },
                amount: "$raisedAmount",
                category: {
                  $ifNull: [
                    "$projectCategory",
                    {
                      $ifNull: ["$roundType", "Unknown"],
                    },
                  ],
                },
              },
            ],
          },
        },
      ])
      .allowDiskUse(true);

    return this.buildFundingDynamics(rows);
  }

  private buildFundingDynamics(rows: FundsFundingDynamicsRow[] = []) {
    const now = new Date();

    return {
      chart90d: this.buildFundingDynamicsChart(rows, {
        maxPeriods: 13,
        groupByDays: 7,
        fromDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      }),
      chart1y: this.buildFundingDynamicsChart(rows, {
        maxPeriods: 12,
        groupByDays: 30,
        fromDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
      }),
      chartAll: this.buildFundingDynamicsChart(rows, {
        maxPeriods: 24,
        groupByDays: 30,
      }),
    };
  }

  private buildFundingDynamicsChart(
    rows: FundsFundingDynamicsRow[] = [],
    options: {
      maxPeriods: number;
      groupByDays: number;
      fromDate?: Date;
      topCategories?: number;
    },
  ): FundsFundingDynamicsPoint[] {
    const topCategoriesLimit = options.topCategories || 6;
    const normalizedRows = rows
      .map((row) => {
        const date = row.date instanceof Date ? row.date : new Date(row.date);
        const amount = this.toNumber(row.amount);
        const category = this.toDisplayString(row.category) || "Unknown";

        return {
          date,
          amount,
          category,
          keyProjects: this.arrayValue(row.keyProjects)
            .map((project) => ({
              name: this.toDisplayString(project?.name) || "Unknown",
              amount: this.toNumber(project?.amount),
              category: this.toDisplayString(project?.category) || category,
            }))
            .filter((project) => project.amount > 0),
        };
      })
      .filter((row) => {
        if (!row.amount || Number.isNaN(row.date.getTime())) return false;
        if (options.fromDate && row.date < options.fromDate) return false;
        return true;
      });

    const categoryTotals = new Map<string, number>();
    normalizedRows.forEach((row) => {
      categoryTotals.set(row.category, (categoryTotals.get(row.category) || 0) + row.amount);
    });
    const topCategories = Array.from(categoryTotals.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, topCategoriesLimit)
      .map(([category]) => category);
    const groupedByPeriod = new Map<string, typeof normalizedRows>();

    normalizedRows.forEach((row) => {
      const groupKey = this.getFundingDynamicsGroupKey(row.date, options.groupByDays);
      groupedByPeriod.set(groupKey, [...(groupedByPeriod.get(groupKey) || []), row]);
    });

    return Array.from(groupedByPeriod.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-options.maxPeriods)
      .map(([periodKey, periodRows]) => {
        const periodStart = new Date(periodKey);
        const periodEnd = new Date(
          periodStart.getTime() + (options.groupByDays - 1) * 24 * 60 * 60 * 1000,
        );
        const item: FundsFundingDynamicsPoint = {
          name: this.formatFundingDynamicsPeriodLabel(periodStart, options.groupByDays),
          date: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          totalInvestment: 0,
          categories: topCategories,
          keyProjects: periodRows
            .flatMap((row) => row.keyProjects)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 3),
          investments0: 0,
          investments1: 0,
          investments2: 0,
          investments3: 0,
          investments4: 0,
          investments5: 0,
        };

        topCategories.forEach((category, index) => {
          const amount = periodRows
            .filter((row) => row.category === category)
            .reduce((sum, row) => sum + row.amount, 0);
          (item as any)[`investments${index}`] = Math.round(amount * 100) / 100;
          item.totalInvestment += amount;
        });

        item.totalInvestment = Math.round(item.totalInvestment * 100) / 100;

        return item;
      })
      .filter((item) => item.totalInvestment > 0);
  }

  private async getIndustryAllocationByPeriod() {
    const now = new Date();
    const day = 24 * 60 * 60 * 1000;
    const [chart24h, chart7d, chart30d, chart90d, chart1y, chartAll] =
      await Promise.all([
        this.getFundingRoundsIndustryAllocation(new Date(now.getTime() - day)),
        this.getFundingRoundsIndustryAllocation(new Date(now.getTime() - 7 * day)),
        this.getFundingRoundsIndustryAllocation(new Date(now.getTime() - 30 * day)),
        this.getFundingRoundsIndustryAllocation(new Date(now.getTime() - 90 * day)),
        this.getFundingRoundsIndustryAllocation(new Date(now.getTime() - 365 * day)),
        this.getFundingRoundsIndustryAllocation(),
      ]);

    return {
      chart24h,
      chart7d,
      chart30d,
      chart90d,
      chart1y,
      chartAll,
    };
  }

  private async getFundingRoundsIndustryAllocation(fromDate?: Date) {
    const match: Record<string, any> = {
      visible: true,
      raisedAmount: { $gt: 0 },
      fundingDate: fromDate ? { $gte: fromDate } : { $ne: null },
    };

    return this.fundingRoundModel
      .aggregate([
        { $match: match },
        {
          $project: {
            amount: "$raisedAmount",
            category: {
              $trim: {
                input: {
                  $convert: {
                    input: {
                      $ifNull: [
                        "$projectCategory",
                        {
                          $ifNull: ["$roundType", "Unknown"],
                        },
                      ],
                    },
                    to: "string",
                    onError: "",
                    onNull: "",
                  },
                },
              },
            },
            projectKey: {
              $trim: {
                input: {
                  $convert: {
                    input: {
                      $ifNull: [
                        "$projectSlug",
                        {
                          $ifNull: ["$projectSymbol", "$projectName"],
                        },
                      ],
                    },
                    to: "string",
                    onError: "",
                    onNull: "",
                  },
                },
              },
            },
            projectName: {
              $trim: {
                input: {
                  $convert: {
                    input: {
                      $ifNull: [
                        "$projectSymbol",
                        {
                          $ifNull: ["$projectName", "$projectSlug"],
                        },
                      ],
                    },
                    to: "string",
                    onError: "",
                    onNull: "",
                  },
                },
              },
            },
            projectImage: "$projectLogo",
          },
        },
        {
          $match: {
            category: { $nin: ["", "[object Object]", "All", "all"] },
            projectName: { $ne: "" },
          },
        },
        {
          $group: {
            _id: {
              category: "$category",
              projectKey: "$projectKey",
            },
            name: { $first: "$projectName" },
            image: { $first: "$projectImage" },
            amount: { $sum: "$amount" },
          },
        },
        { $sort: { amount: -1, name: 1 } },
        {
          $group: {
            _id: "$_id.category",
            value: { $sum: "$amount" },
            projectsCount: { $sum: 1 },
            topProjects: {
              $push: {
                name: "$name",
                image: "$image",
                amount: "$amount",
              },
            },
          },
        },
        { $sort: { value: -1, _id: 1 } },
        { $limit: 24 },
        {
          $project: {
            _id: 0,
            label: "$_id",
            value: { $round: ["$value", 2] },
            projectsCount: 1,
            topProjects: { $slice: ["$topProjects", 5] },
          },
        },
      ])
      .allowDiskUse(true);
  }

  private getFundingDynamicsGroupKey(date: Date, groupByDays: number) {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);

    if (groupByDays === 1) {
      return normalizedDate.toISOString();
    }

    const start = new Date(normalizedDate);
    const day = start.getUTCDay();
    const diff = groupByDays === 7 ? (day === 0 ? -6 : 1 - day) : 0;
    start.setUTCDate(start.getUTCDate() + diff);

    if (groupByDays === 30) {
      start.setUTCDate(1);
    }

    return start.toISOString();
  }

  private formatFundingDynamicsPeriodLabel(date: Date, groupByDays: number) {
    if (groupByDays === 1) {
      return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
    }

    const endDate = new Date(date.getTime() + (groupByDays - 1) * 24 * 60 * 60 * 1000);

    if (groupByDays === 7) {
      return `Week of ${date.toLocaleDateString("en-US", { day: "2-digit", month: "short" })}`;
    }

    return `${date.toLocaleDateString("en-US", { day: "2-digit", month: "short" })} - ${endDate.toLocaleDateString("en-US", { day: "2-digit", month: "short" })}`;
  }

  private countFundingDynamicsPoints(fundingDynamics: Record<string, any[]>) {
    return Object.values(fundingDynamics || {}).reduce(
      (sum, items) => sum + (Array.isArray(items) ? items.length : 0),
      0,
    );
  }

  private isCronEnabled() {
    const value = String(
      this.configService.get("FUNDS_ANALYTICS_SNAPSHOT_ENABLED") ?? "true",
    )
      .trim()
      .toLowerCase();
    return !["0", "false", "no", "off"].includes(value);
  }

  private arrayValue(value: any): any[] {
    return Array.isArray(value) ? value : [];
  }

  private toDisplayString(value: any): string {
    if (value === undefined || value === null) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
    return "";
  }

  private toNumber(value: any): number {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }
}
