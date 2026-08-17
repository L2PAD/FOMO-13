import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import { Model } from "mongoose";
import { Person, PersonDocument } from "src/persons/person.model";
import {
  PersonsAnalyticsSnapshot,
  PersonsAnalyticsSnapshotDocument,
} from "./persons-analytics-snapshot.model";

type PersonsAnalyticsChartItem = {
  label: string;
  value: number;
  topRoles?: string;
  keyRegions?: string;
  sectors?: string;
  topProjects?: string;
};

type PersonsAnalyticsCountryItem = {
  country: string;
  countryCode?: string;
  value: number;
};

type PersonsAnalyticsPreparedCharts = {
  topSectors: PersonsAnalyticsChartItem[];
  personsByCountry: PersonsAnalyticsCountryItem[];
  generatedAt?: Date;
};

const SNAPSHOT_SCOPE = "global";
const SNAPSHOT_VERSION = "persons-analytics-charts-v1";

@Injectable()
export class PersonsAnalyticsSnapshotService {
  private readonly logger = new Logger(PersonsAnalyticsSnapshotService.name);
  private refreshInProgress = false;

  constructor(
    @InjectModel(Person.name)
    private readonly personModel: Model<PersonDocument>,
    @InjectModel(PersonsAnalyticsSnapshot.name)
    private readonly snapshotModel: Model<PersonsAnalyticsSnapshotDocument>,
    private readonly configService: ConfigService,
  ) {}

  @Cron(process.env.PERSONS_ANALYTICS_SNAPSHOT_CRON || "0 25 2 * * *", {
    name: "persons-analytics-snapshot",
  })
  async handleSnapshotCron(): Promise<void> {
    if (!this.isCronEnabled()) return;

    try {
      await this.refreshDailyCharts("cron");
    } catch (error) {
      this.logger.error(
        `Persons analytics snapshot cron failed: ${error.message}`,
        error.stack,
      );
    }
  }

  async getLatestPreparedCharts(): Promise<PersonsAnalyticsPreparedCharts | null> {
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
      topSectors: Array.isArray(snapshot.topSectors)
        ? (snapshot.topSectors as PersonsAnalyticsChartItem[])
        : [],
      personsByCountry: Array.isArray(snapshot.personsByCountry)
        ? (snapshot.personsByCountry as PersonsAnalyticsCountryItem[])
        : [],
      generatedAt: snapshot.generatedAt,
    };
  }

  async refreshDailyCharts(trigger = "manual") {
    if (this.refreshInProgress) {
      return {
        skipped: true,
        reason: "Persons analytics snapshot refresh is already running.",
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
      const [charts, personsCount] = await Promise.all([
        this.buildPreparedCharts(),
        this.personModel.countDocuments({
          projectStatus: { $in: ["active", "Active"] },
        }),
      ]);
      const completedAt = new Date();
      const durationMs = completedAt.getTime() - startedAt.getTime();

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
            topSectors: charts.topSectors,
            personsByCountry: charts.personsByCountry,
            meta: {
              personsCount,
              topSectorsCount: charts.topSectors.length,
              personsByCountryCount: charts.personsByCountry.length,
            },
          },
        },
        { upsert: true },
      );

      this.logger.log(
        `Persons analytics snapshot refreshed in ${durationMs}ms (${trigger}).`,
      );

      return {
        skipped: false,
        scope: SNAPSHOT_SCOPE,
        version: SNAPSHOT_VERSION,
        generatedAt: completedAt,
        durationMs,
        personsCount,
        topSectorsCount: charts.topSectors.length,
        personsByCountryCount: charts.personsByCountry.length,
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

  private async buildPreparedCharts(): Promise<
    Omit<PersonsAnalyticsPreparedCharts, "generatedAt">
  > {
    const [result = {}] = await this.personModel
      .aggregate([
        {
          $match: {
            projectStatus: { $in: ["active", "Active"] },
          },
        },
        this.buildChartComputedStage(),
        {
          $facet: {
            topSectors: [
              { $unwind: "$sectorsComputed" },
              {
                $project: {
                  label: {
                    $trim: { input: { $toString: "$sectorsComputed" } },
                  },
                  country: "$countryComputed",
                  role: {
                    $ifNull: [
                      "$currentRole",
                      {
                        $ifNull: [
                          "$position",
                          {
                            $ifNull: [
                              "$type",
                              {
                                $ifNull: [
                                  {
                                    $arrayElemAt: [
                                      "$specializationsComputed",
                                      0,
                                    ],
                                  },
                                  "$niche",
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                  projects: {
                    $cond: [
                      {
                        $gt: [
                          { $size: { $ifNull: ["$portfolioCoins", []] } },
                          0,
                        ],
                      },
                      "$portfolioCoins",
                      { $ifNull: ["$investmentPorfolio", []] },
                    ],
                  },
                },
              },
              {
                $match: {
                  label: { $nin: ["", "Unknown", "unknown", "N/A", "n/a", "all"] },
                },
              },
              {
                $group: {
                  _id: "$label",
                  value: { $sum: 1 },
                  countries: { $push: "$country" },
                  roles: { $push: "$role" },
                  projects: { $push: "$projects" },
                },
              },
              { $sort: { value: -1, _id: 1 } },
              { $limit: 12 },
              {
                $project: {
                  _id: 0,
                  label: "$_id",
                  value: 1,
                  countries: 1,
                  roles: 1,
                  projects: 1,
                },
              },
            ],
            personsByCountry: [
              {
                $project: {
                  country: {
                    $cond: [
                      {
                        $eq: [
                          {
                            $trim: {
                              input: { $toString: "$countryComputed" },
                            },
                          },
                          "",
                        ],
                      },
                      "Unknown",
                      "$countryComputed",
                    ],
                  },
                  countryCode: "$regionData.id",
                },
              },
              {
                $group: {
                  _id: "$country",
                  countryCode: { $first: "$countryCode" },
                  value: { $sum: 1 },
                },
              },
              { $sort: { value: -1, _id: 1 } },
              { $limit: 200 },
              {
                $project: {
                  _id: 0,
                  country: "$_id",
                  countryCode: 1,
                  value: 1,
                },
              },
            ],
          },
        },
      ])
      .allowDiskUse(true);

    return {
      topSectors: this.serializePersonsSectorAnalytics(result.topSectors || []),
      personsByCountry: this.serializePersonsCountryAnalytics(
        result.personsByCountry || [],
      ),
    };
  }

  private buildChartComputedStage(): any {
    return {
      $addFields: {
        countryComputed: {
          $ifNull: [
            "$tableCountry",
            {
              $ifNull: [
                "$country",
                {
                  $ifNull: [
                    "$location",
                    {
                      $ifNull: [
                        "$regionData.properties.name",
                        {
                          $ifNull: ["$regionData.region", "$regionData.id"],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        specializationsComputed: {
          $filter: {
            input: {
              $setUnion: [
                {
                  $cond: [
                    { $ne: [{ $ifNull: ["$niche", ""] }, ""] },
                    ["$niche"],
                    [],
                  ],
                },
                {
                  $cond: [
                    { $ne: [{ $ifNull: ["$type", ""] }, ""] },
                    ["$type"],
                    [],
                  ],
                },
                {
                  $cond: [
                    { $isArray: "$specializations" },
                    "$specializations",
                    [],
                  ],
                },
              ],
            },
            as: "specialization",
            cond: {
              $and: [
                { $ne: ["$$specialization", null] },
                { $ne: ["$$specialization", ""] },
                { $ne: ["$$specialization", "Unknown"] },
              ],
            },
          },
        },
        sectorsComputed: {
          $filter: {
            input: {
              $setUnion: [
                { $cond: [{ $isArray: "$categories" }, "$categories", []] },
                { $cond: [{ $isArray: "$tags" }, "$tags", []] },
                { $cond: [{ $isArray: "$sectors" }, "$sectors", []] },
                {
                  $cond: [
                    { $isArray: "$industryFocus" },
                    "$industryFocus",
                    [],
                  ],
                },
                {
                  $map: {
                    input: {
                      $cond: [
                        { $isArray: "$roundsByCategory" },
                        "$roundsByCategory",
                        [],
                      ],
                    },
                    as: "category",
                    in: "$$category.name",
                  },
                },
              ],
            },
            as: "sector",
            cond: {
              $and: [
                { $ne: ["$$sector", null] },
                { $ne: ["$$sector", ""] },
                { $ne: ["$$sector", "Unknown"] },
                { $ne: ["$$sector", "all"] },
              ],
            },
          },
        },
      },
    };
  }

  private serializePersonsSectorAnalytics(items: any[] = []) {
    return items.map((item) => ({
      label: this.toCleanString(item?.label),
      value: this.toFiniteNumber(item?.value),
      topRoles: this.formatTopCounts(this.arrayValue(item?.roles)),
      keyRegions: this.formatTopCounts(this.arrayValue(item?.countries)),
      sectors: this.toCleanString(item?.label),
      topProjects: this.formatTopProjects(this.arrayValue(item?.projects)),
    }));
  }

  private serializePersonsCountryAnalytics(
    items: any[] = [],
  ): PersonsAnalyticsCountryItem[] {
    return items.map((item) => ({
      country: this.toCleanString(item?.country) || "Unknown",
      countryCode: this.toCleanString(item?.countryCode) || undefined,
      value: this.toFiniteNumber(item?.value),
    }));
  }

  private formatTopCounts(values: any[], limit = 3): string {
    const counts = new Map<string, number>();

    values.forEach((value) => {
      const label = this.toCleanString(value);
      if (!label) return;
      counts.set(label, (counts.get(label) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([label, count]) => `${label} (${count})`)
      .join(", ");
  }

  private formatTopProjects(projectGroups: any[], limit = 5): string {
    const counts = new Map<string, number>();

    projectGroups
      .flatMap((group) => this.arrayValue(group))
      .forEach((project) => {
        const label = this.toCleanString(
          project?.name || project?.projectName || project?.symbol || project?.slug,
        );
        if (!label) return;
        counts.set(label, (counts.get(label) || 0) + 1);
      });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, limit)
      .map(([label]) => label)
      .join(", ");
  }

  private isCronEnabled() {
    const value = String(
      this.configService.get("PERSONS_ANALYTICS_SNAPSHOT_ENABLED") ?? "true",
    )
      .trim()
      .toLowerCase();
    return !["0", "false", "no", "off"].includes(value);
  }

  private arrayValue(value: any): any[] {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  private toCleanString(value: any): string {
    if (value === undefined || value === null) return "";
    if (typeof value === "object") {
      return this.toCleanString(value.name || value.title || value.value);
    }
    const normalized = String(value).trim();
    if (
      !normalized ||
      normalized === "[object Object]" ||
      normalized.toLowerCase() === "unknown"
    ) {
      return "";
    }
    return normalized;
  }

  private toFiniteNumber(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
