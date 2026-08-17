import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import * as fs from "fs";
import * as path from "path";
import { ensureUploadsDir, UPLOADS_DIR } from "src/config/uploads";
import { Project, ProjectDocument } from "src/projects/project.model";
import { AnalyticsService } from "./analytics.service";
import { Chart, ChartDocument } from "./models/chart.model";

export interface Render7dChartImagesOptions {
  dryRun?: boolean;
  limit?: number;
  batchSize?: number;
  force?: boolean;
  projectIds?: string[];
  cursor?: string;
  wrapOnEmpty?: boolean;
}

export interface Render7dChartImagesResult {
  dryRun: boolean;
  force: boolean;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  chartsScanned: number;
  eligibleCharts: number;
  wouldRender: number;
  rendered: number;
  skippedFresh: number;
  skippedTooFewPoints: number;
  skippedInvalidPoints: number;
  skippedMissingProject: number;
  metadataWouldUpdate: number;
  metadataUpdated: number;
  failed: number;
  nextCursor?: string;
  errors: Array<{ projectId: string; error: string }>;
}

interface NormalizedChartPoint {
  timestamp: number;
  price: { USD: number };
}

@Injectable()
export class ChartImageRendererService {
  private readonly logger = new Logger(ChartImageRendererService.name);
  private cronCursor: string | undefined;
  private isCronRunning = false;
  private disabledLogged = false;

  constructor(
    @InjectModel(Chart.name)
    private readonly chartModel: Model<ChartDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly analyticsService: AnalyticsService,
    private readonly configService: ConfigService,
  ) {}

  @Cron("0 0 * * * *")
  async render7dImagesCron(): Promise<void> {
    if (!this.shouldRunCron()) return;

    if (this.isCronRunning) {
      this.logger.warn("7d chart image render skipped because previous run is still active");
      return;
    }

    this.isCronRunning = true;
    try {
      const result = await this.render7dChartImages({
        dryRun: false,
        limit: this.readPositiveInteger("CHART_7D_IMAGE_RENDER_LIMIT", 250),
        batchSize: this.readPositiveInteger("CHART_7D_IMAGE_RENDER_BATCH_SIZE", 100),
        cursor: this.cronCursor,
        wrapOnEmpty: true,
      });
      this.cronCursor = result.nextCursor;
      this.logger.log(JSON.stringify({ event: "chart_7d_image_render_cron", ...result, errors: undefined }));
    } catch (error) {
      this.logger.warn(`7d chart image render cron failed: ${error?.message || error}`);
    } finally {
      this.isCronRunning = false;
    }
  }

  async render7dChartImages(options: Render7dChartImagesOptions = {}): Promise<Render7dChartImagesResult> {
    const startedAt = new Date();
    const startedMs = Date.now();
    const dryRun = options.dryRun !== false;
    const force = options.force === true;
    const batchSize = Math.max(1, Math.trunc(Number(options.batchSize || 100)));
    const limit = this.normalizeLimit(options.limit);
    const projectObjectIds = this.parseProjectIds(options.projectIds || []);
    let remaining = limit;
    let cursor = this.toObjectId(options.cursor);
    let wrapped = false;

    const result: Render7dChartImagesResult = {
      dryRun,
      force,
      startedAt: startedAt.toISOString(),
      finishedAt: startedAt.toISOString(),
      durationMs: 0,
      chartsScanned: 0,
      eligibleCharts: 0,
      wouldRender: 0,
      rendered: 0,
      skippedFresh: 0,
      skippedTooFewPoints: 0,
      skippedInvalidPoints: 0,
      skippedMissingProject: 0,
      metadataWouldUpdate: 0,
      metadataUpdated: 0,
      failed: 0,
      errors: [],
    };

    ensureUploadsDir();

    while (remaining > 0) {
      const queryLimit = Math.min(batchSize, remaining === Infinity ? batchSize : remaining);
      const charts = await this.loadChartBatch(projectObjectIds, cursor, queryLimit);

      if (!charts.length) {
        if (!projectObjectIds.length && options.wrapOnEmpty && cursor && !wrapped) {
          cursor = undefined;
          wrapped = true;
          continue;
        }
        break;
      }

      result.nextCursor = String(charts[charts.length - 1]._id);
      cursor = charts[charts.length - 1]._id as Types.ObjectId;
      result.chartsScanned += charts.length;
      if (remaining !== Infinity) remaining -= charts.length;

      await this.processChartBatch(charts, result, { dryRun, force });
    }

    result.finishedAt = new Date().toISOString();
    result.durationMs = Date.now() - startedMs;
    return result;
  }

  private async loadChartBatch(
    projectObjectIds: Types.ObjectId[],
    cursor: Types.ObjectId | undefined,
    limit: number,
  ): Promise<any[]> {
    const filter: any = {
      entityType: "project",
      chart7d: { $exists: true, $type: "array", $ne: [] },
    };

    if (projectObjectIds.length) {
      filter.entityId = { $in: projectObjectIds };
    } else if (cursor) {
      filter._id = { $gt: cursor };
    }

    return this.chartModel
      .find(filter, { entityId: 1, chart7d: 1 })
      .sort({ _id: 1 })
      .limit(limit)
      .lean();
  }

  private async processChartBatch(
    charts: any[],
    result: Render7dChartImagesResult,
    options: { dryRun: boolean; force: boolean },
  ): Promise<void> {
    const projectIds = charts
      .map((chart) => chart.entityId)
      .filter((id) => Types.ObjectId.isValid(id));
    const projects = await this.projectModel
      .find(
        { _id: { $in: projectIds } },
        {
          _id: 1,
          slug: 1,
          name: 1,
          chart7d: 1,
          chartImage7d: 1,
          chartImage7dGeneratedAt: 1,
          chartImage7dSourceLastTimestamp: 1,
          chartImage7dPointsCount: 1,
          chartImage7dTrend: 1,
        },
      )
      .lean();
    const projectsById = new Map(projects.map((project: any) => [String(project._id), project]));

    for (const chart of charts) {
      const projectId = String(chart.entityId || "");
      const project = projectsById.get(projectId);

      if (!project) {
        result.skippedMissingProject += 1;
        continue;
      }

      const points = this.normalizeChartPoints(chart.chart7d);
      if (!points.length) {
        result.skippedInvalidPoints += 1;
        continue;
      }
      if (points.length < 4) {
        result.skippedTooFewPoints += 1;
        continue;
      }

      result.eligibleCharts += 1;

      const sourceLastTimestamp = points[points.length - 1].timestamp;
      const imageUrl = this.buildImageUrl(projectId, sourceLastTimestamp);
      const imagePath = path.join(UPLOADS_DIR, `${projectId}.png`);
      const fileExists = fs.existsSync(imagePath);
      const currentSourceTimestamp = this.toTimestamp(project.chartImage7dSourceLastTimestamp);
      const isFresh = fileExists && currentSourceTimestamp >= sourceLastTimestamp;
      const metadataNeedsUpdate = this.projectImageMetadataNeedsUpdate(
        project,
        imageUrl,
        sourceLastTimestamp,
        points.length,
      );

      if (!options.force && isFresh) {
        if (metadataNeedsUpdate) {
          if (options.dryRun) {
            result.metadataWouldUpdate += 1;
          } else {
            const generatedAt = this.getFileMtime(imagePath) || new Date();
            await this.updateProjectImageMetadata(projectId, {
              imageUrl,
              sourceLastTimestamp,
              pointsCount: points.length,
              generatedAt,
              trend: project.chartImage7dTrend || this.determineSimpleTrend(points),
            });
            result.metadataUpdated += 1;
          }
        } else {
          result.skippedFresh += 1;
        }
        continue;
      }

      if (options.dryRun) {
        result.wouldRender += 1;
        continue;
      }

      try {
        const renderResult = await this.analyticsService.generateChartImage(points, projectId, "", "USD");
        await this.updateProjectImageMetadata(projectId, {
          imageUrl,
          sourceLastTimestamp,
          pointsCount: points.length,
          generatedAt: new Date(),
          trend: renderResult.trend,
        });
        result.rendered += 1;
      } catch (error) {
        result.failed += 1;
        result.errors.push({
          projectId,
          error: String(error?.message || error),
        });
      }
    }
  }

  private async updateProjectImageMetadata(
    projectId: string,
    metadata: {
      imageUrl: string;
      sourceLastTimestamp: number;
      pointsCount: number;
      generatedAt: Date;
      trend: string;
    },
  ): Promise<void> {
    await this.projectModel.updateOne(
      { _id: new Types.ObjectId(projectId) },
      {
        $set: {
          chart7d: metadata.imageUrl,
          chartImage7d: metadata.imageUrl,
          chartImage7dGeneratedAt: metadata.generatedAt,
          chartImage7dSourceLastTimestamp: new Date(metadata.sourceLastTimestamp),
          chartImage7dPointsCount: metadata.pointsCount,
          chartImage7dTrend: metadata.trend,
          lastPriceHistoryUpdate: metadata.generatedAt,
        },
      },
    );
  }

  private normalizeChartPoints(input: any[]): NormalizedChartPoint[] {
    if (!Array.isArray(input)) return [];

    const pointsByTimestamp = new Map<number, NormalizedChartPoint>();
    for (const item of input) {
      const timestamp = this.toTimestamp(item?.timestamp);
      const price = this.toFinitePositiveNumber(item?.price?.USD ?? item?.price?.usd ?? item?.price);
      if (!timestamp || price === null) continue;
      pointsByTimestamp.set(timestamp, { timestamp, price: { USD: price } });
    }

    return Array.from(pointsByTimestamp.values()).sort((a, b) => a.timestamp - b.timestamp);
  }

  private projectImageMetadataNeedsUpdate(
    project: any,
    imageUrl: string,
    sourceLastTimestamp: number,
    pointsCount: number,
  ): boolean {
    return (
      project.chart7d !== imageUrl ||
      project.chartImage7d !== imageUrl ||
      this.toTimestamp(project.chartImage7dSourceLastTimestamp) !== sourceLastTimestamp ||
      Number(project.chartImage7dPointsCount || 0) !== pointsCount
    );
  }

  private buildImageUrl(projectId: string, sourceLastTimestamp: number): string {
    return `/${projectId}.png?v=${sourceLastTimestamp}`;
  }

  private determineSimpleTrend(points: NormalizedChartPoint[]): "up" | "down" {
    const first = points[0]?.price?.USD;
    const last = points[points.length - 1]?.price?.USD;
    return Number(last) >= Number(first) ? "up" : "down";
  }

  private getFileMtime(filePath: string): Date | null {
    try {
      return fs.statSync(filePath).mtime;
    } catch {
      return null;
    }
  }

  private normalizeLimit(limit?: number): number {
    const parsed = Number(limit);
    if (!Number.isFinite(parsed)) return 500;
    if (parsed <= 0) return Infinity;
    return Math.trunc(parsed);
  }

  private parseProjectIds(projectIds: string[]): Types.ObjectId[] {
    return projectIds
      .map((projectId) => String(projectId || "").trim())
      .filter((projectId) => Types.ObjectId.isValid(projectId))
      .map((projectId) => new Types.ObjectId(projectId));
  }

  private toObjectId(value?: string): Types.ObjectId | undefined {
    if (!value || !Types.ObjectId.isValid(value)) return undefined;
    return new Types.ObjectId(value);
  }

  private toTimestamp(value: any): number {
    if (value instanceof Date) return value.getTime();
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return numeric < 100000000000 ? numeric * 1000 : numeric;
    }

    const date = value === undefined || value === null || value === "" ? null : new Date(value);
    return date && Number.isFinite(date.getTime()) ? date.getTime() : 0;
  }

  private toFinitePositiveNumber(value: any): number | null {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
  }

  private shouldRunCron(): boolean {
    if (String(this.configService.get("IS_LOCAL_RUN") || "").toLowerCase() === "true") return false;
    if (this.readBooleanFlag("CHART_7D_IMAGE_RENDER_ENABLED", false)) return true;

    if (!this.disabledLogged) {
      this.logger.log("7d chart image render cron disabled by CHART_7D_IMAGE_RENDER_ENABLED=false");
      this.disabledLogged = true;
    }

    return false;
  }

  private readBooleanFlag(name: string, defaultValue: boolean): boolean {
    const value = this.configService.get(name) ?? process.env[name];
    if (value === undefined || value === null || value === "") return defaultValue;
    const normalized = String(value).trim().toLowerCase();
    if (["false", "0", "off", "no"].includes(normalized)) return false;
    if (["true", "1", "on", "yes"].includes(normalized)) return true;
    return defaultValue;
  }

  private readPositiveInteger(name: string, defaultValue: number): number {
    const parsed = Number(this.configService.get(name) ?? process.env[name]);
    return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : defaultValue;
  }
}
