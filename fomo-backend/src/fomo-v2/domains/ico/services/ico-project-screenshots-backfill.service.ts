import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import {
  normalizeProjectSourceType,
  projectSourceTypeMongoPattern,
} from "../../../shared/source-policy";
import { FomoV2ProjectSourceProfile } from "../../project-profiles";
import { FOMO_V2_PARSER_DB_CONNECTION } from "../ico-parser-db.constants";
import {
  cleanProjectProfileString,
  normalizeProjectSlugForQuery,
} from "../helpers";
import { FomoV2IcoProjectReadModel, FomoV2IcoProjectSource } from "../models";
import { FomoV2ParserControlPolicyService } from "../../parser-control/services/parser-control-policy.service";

export interface IcoProjectScreenshotsBackfillOptions {
  write?: boolean;
  sourceType?: string;
  slug?: string;
  limit?: number;
  all?: boolean;
  batchSize?: number;
  examplesLimit?: number;
  includeLegacyMissingSource?: boolean;
}

export interface IcoProjectScreenshotsBackfillResult {
  mode: "dry-run" | "write";
  dbName: string;
  parserDbName: string;
  sourceType: string;
  slug?: string;
  totalProjects: number;
  projectsWithScreenshots: number;
  screenshotsFound: number;
  profileTargets: TargetBackfillStats;
  readModelTargets: TargetBackfillStats;
  missingProfileTargets: number;
  missingReadModelTargets: number;
  errors: Array<{
    sourceProjectId?: string;
    sourceSlug?: string;
    name?: string;
    message: string;
  }>;
  examples: IcoProjectScreenshotsBackfillExample[];
}

interface TargetBackfillStats {
  matched: number;
  alreadyCurrent: number;
  wouldUpdate: number;
  updated: number;
}

interface IcoProjectScreenshotsBackfillExample {
  name?: string;
  sourceProjectId?: string;
  sourceSlug?: string;
  screenshotsCount: number;
  firstScreenshotUrl?: string;
  profileTargetIds: string[];
  readModelTargetIds: string[];
}

interface SourceIdentity {
  sourceProjectId?: string;
  sourceSlug?: string;
  sourceDocumentId?: string;
  name?: string;
}

@Injectable()
export class IcoProjectScreenshotsBackfillService {
  private readonly defaultLimit = 100;
  private readonly defaultBatchSize = 250;
  private readonly defaultExamplesLimit = 5;

  constructor(
    private readonly configService: ConfigService,
    @InjectModel(FomoV2IcoProjectSource.name, FOMO_V2_PARSER_DB_CONNECTION)
    private readonly icoProjectSourceModel: Model<FomoV2IcoProjectSource>,
    @InjectModel(FomoV2ProjectSourceProfile.name)
    private readonly projectSourceProfileModel: Model<FomoV2ProjectSourceProfile>,
    @InjectModel(FomoV2IcoProjectReadModel.name)
    private readonly icoProjectReadModel: Model<FomoV2IcoProjectReadModel>,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService
  ) {}

  async run(
    options: IcoProjectScreenshotsBackfillOptions = {}
  ): Promise<IcoProjectScreenshotsBackfillResult> {
    const sourceType = normalizeProjectSourceType(options.sourceType || "icodrops");
    const write = Boolean(options.write);
    if (write && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        `ico:${sourceType}`
      );
    }
    const slug = normalizeProjectSlugForQuery(options.slug);
    const examplesLimit = this.parseNonNegativeInteger(
      options.examplesLimit,
      this.defaultExamplesLimit
    );
    const result = this.emptyResult(sourceType, write, slug);
    const limit = this.resolveLimit(options);

    const cursor = this.icoProjectSourceModel
      .find(
        this.sourceQuery(
          sourceType,
          slug,
          Boolean(options.includeLegacyMissingSource)
        )
      )
      .sort({ _id: 1 })
      .limit(options.all ? 0 : limit)
      .select({
        _id: 1,
        source: 1,
        sourceId: 1,
        slug: 1,
        name: 1,
        symbol: 1,
        ticker: 1,
        detailUrl: 1,
        sourceUrl: 1,
        screenshots: 1,
        "rawIcoData.screenshots": 1,
        "rawIcoData.slug": 1,
        "rawIcoData.sourceId": 1,
        "rawIcoData.name": 1,
        "rawDetailData.screenshots": 1,
        "rawDetailData.slug": 1,
        "rawDetailData.sourceId": 1,
        "rawDetailData.name": 1,
      })
      .batchSize(
        this.parsePositiveInteger(options.batchSize, this.defaultBatchSize)
      )
      .lean()
      .cursor();

    for await (const icoProject of cursor as any) {
      if (!options.all && result.totalProjects >= limit) break;
      await this.processProject(
        icoProject,
        {
          sourceType,
          write,
          examplesLimit,
        },
        result
      );
    }

    return result;
  }

  private async processProject(
    icoProject: Record<string, any>,
    options: {
      sourceType: string;
      write: boolean;
      examplesLimit: number;
    },
    result: IcoProjectScreenshotsBackfillResult
  ): Promise<void> {
    const identity = this.toIdentity(icoProject);
    result.totalProjects += 1;

    try {
      const screenshots = this.extractScreenshots(icoProject);
      if (!screenshots.length) return;

      result.projectsWithScreenshots += 1;
      result.screenshotsFound += screenshots.length;

      const profileFilter = this.profileTargetFilter(
        options.sourceType,
        identity
      );
      const readModelFilter = this.readModelTargetFilter(
        options.sourceType,
        identity
      );
      if (!profileFilter && !readModelFilter) {
        throw new Error(
          "Could not build target filter for screenshots backfill."
        );
      }

      const [profileTarget, readModelTarget] = await Promise.all([
        profileFilter
          ? this.applyTargetBackfill(
              this.projectSourceProfileModel,
              profileFilter,
              screenshots,
              options.write
            )
          : this.emptyTargetBackfillResult(),
        readModelFilter
          ? this.applyTargetBackfill(
              this.icoProjectReadModel,
              readModelFilter,
              screenshots,
              options.write
            )
          : this.emptyTargetBackfillResult(),
      ]);

      this.addTargetStats(result.profileTargets, profileTarget.stats);
      this.addTargetStats(result.readModelTargets, readModelTarget.stats);
      if (!profileTarget.stats.matched) result.missingProfileTargets += 1;
      if (!readModelTarget.stats.matched) result.missingReadModelTargets += 1;

      if (result.examples.length < options.examplesLimit) {
        result.examples.push({
          name: identity.name,
          sourceProjectId: identity.sourceProjectId,
          sourceSlug: identity.sourceSlug,
          screenshotsCount: screenshots.length,
          firstScreenshotUrl: screenshots[0]?.url,
          profileTargetIds: profileTarget.targetIds,
          readModelTargetIds: readModelTarget.targetIds,
        });
      }
    } catch (error: any) {
      result.errors.push({
        sourceProjectId: identity.sourceProjectId,
        sourceSlug: identity.sourceSlug,
        name: identity.name,
        message: error?.message || String(error),
      });
    }
  }

  private async applyTargetBackfill(
    model: Model<any>,
    filter: Record<string, any>,
    screenshots: Array<Record<string, any>>,
    write: boolean
  ): Promise<{ stats: TargetBackfillStats; targetIds: string[] }> {
    const stats = this.emptyTargetStats();
    const docs = await model
      .find(filter)
      .select({ _id: 1, metadata: 1 })
      .lean();
    const targetIds = docs
      .map((doc: any) => this.toIdString(doc._id))
      .filter(Boolean);

    stats.matched = docs.length;
    for (const doc of docs as any[]) {
      const current = this.normalizeScreenshots(
        this.arrayValue(doc?.metadata?.icodropsProfileOnly?.screenshots)
      );
      if (this.sameScreenshots(current, screenshots)) {
        stats.alreadyCurrent += 1;
        continue;
      }

      if (!write) {
        stats.wouldUpdate += 1;
        continue;
      }

      await model.updateOne(
        { _id: doc._id },
        {
          $set: {
            "metadata.icodropsProfileOnly.screenshots": screenshots,
          },
        }
      );
      stats.updated += 1;
    }

    return { stats, targetIds };
  }

  private sourceQuery(
    sourceType: string,
    slug?: string,
    includeLegacyMissingSource = false
  ): Record<string, any> {
    const filters: Record<string, any>[] = [
      this.sourceTypeQuery(sourceType, includeLegacyMissingSource),
      {
        $or: [
          { "screenshots.0": { $exists: true } },
          { "rawIcoData.screenshots.0": { $exists: true } },
          { "rawDetailData.screenshots.0": { $exists: true } },
        ],
      },
    ];

    if (slug) {
      filters.push({
        $or: [
          { slug },
          { sourceId: slug },
          { "rawIcoData.slug": slug },
          { "rawIcoData.sourceId": slug },
          { "rawDetailData.slug": slug },
          { "rawDetailData.sourceId": slug },
        ],
      });
    }

    return { $and: filters };
  }

  private sourceTypeQuery(
    sourceType: string,
    includeLegacyMissingSource = false
  ): Record<string, any> {
    const sourcePattern = projectSourceTypeMongoPattern(sourceType);
    if (sourceType !== "icodrops" || !includeLegacyMissingSource) {
      return { source: sourcePattern };
    }
    return {
      $or: [
        { source: sourcePattern },
        { source: { $exists: false } },
        { source: null },
        { source: "" },
      ],
    };
  }

  private profileTargetFilter(
    sourceType: string,
    identity: SourceIdentity
  ): Record<string, any> | undefined {
    const clauses = this.targetClauses(identity, true);
    if (!clauses.length) return undefined;
    return {
      sourceType: projectSourceTypeMongoPattern(sourceType),
      $or: clauses,
    };
  }

  private readModelTargetFilter(
    sourceType: string,
    identity: SourceIdentity
  ): Record<string, any> | undefined {
    const clauses = this.targetClauses(identity, false);
    if (!clauses.length) return undefined;
    return {
      sourceType: projectSourceTypeMongoPattern(sourceType),
      $or: clauses,
    };
  }

  private targetClauses(
    identity: SourceIdentity,
    includeProfileFields: boolean
  ): Record<string, any>[] {
    const clauses: Record<string, any>[] = [];
    if (includeProfileFields && identity.sourceProjectId) {
      clauses.push({ sourceProjectId: identity.sourceProjectId });
    }
    if (includeProfileFields && identity.sourceSlug) {
      clauses.push({ sourceSlug: identity.sourceSlug });
    }
    if (identity.sourceSlug) clauses.push({ slug: identity.sourceSlug });
    if (identity.sourceProjectId)
      clauses.push({ slug: identity.sourceProjectId });
    if (identity.sourceDocumentId) {
      clauses.push({ "metadata.sourceDocumentId": identity.sourceDocumentId });
    }
    return clauses;
  }

  private toIdentity(project: Record<string, any>): SourceIdentity {
    const raw = project.rawIcoData || {};
    const detail = project.rawDetailData || {};
    const sourceSlug = normalizeProjectSlugForQuery(
      project.slug ||
        raw.slug ||
        detail.slug ||
        project.sourceId ||
        raw.sourceId ||
        detail.sourceId ||
        this.slugFromUrl(project.detailUrl || project.sourceUrl)
    );
    const sourceProjectId = this.firstString(
      project.sourceId,
      raw.sourceId,
      detail.sourceId,
      sourceSlug
    );

    return {
      sourceProjectId,
      sourceSlug,
      sourceDocumentId: this.toIdString(project._id),
      name: this.firstString(project.name, raw.name, detail.name),
    };
  }

  private extractScreenshots(
    project: Record<string, any>
  ): Array<Record<string, any>> {
    const raw = project.rawIcoData || {};
    const detail = project.rawDetailData || {};
    return this.normalizeScreenshots([
      ...this.arrayValue(project.screenshots),
      ...this.arrayValue(raw.screenshots),
      ...this.arrayValue(detail.screenshots),
    ]);
  }

  private normalizeScreenshots(values: any[]): Array<Record<string, any>> {
    const seen = new Set<string>();
    const screenshots: Array<Record<string, any>> = [];

    for (const value of values) {
      const screenshot = this.normalizeScreenshot(value);
      if (!screenshot?.url || seen.has(screenshot.url)) continue;
      seen.add(screenshot.url);
      screenshots.push(screenshot);
    }

    return screenshots;
  }

  private normalizeScreenshot(value: any): Record<string, any> | undefined {
    const url = this.firstString(
      value?.url,
      value?.src,
      value?.href,
      value?.image,
      value?.imageUrl,
      value
    );
    if (!url) return undefined;

    return this.cleanObject({
      url,
      name: this.firstString(
        value?.name,
        value?.title,
        value?.alt,
        value?.caption
      ),
    });
  }

  private sameScreenshots(
    current: Array<Record<string, any>>,
    next: Array<Record<string, any>>
  ): boolean {
    return JSON.stringify(current) === JSON.stringify(next);
  }

  private emptyResult(
    sourceType: string,
    write: boolean,
    slug?: string
  ): IcoProjectScreenshotsBackfillResult {
    return {
      mode: write ? "write" : "dry-run",
      dbName: this.dbName(),
      parserDbName: this.parserDbName(),
      sourceType,
      slug: slug || undefined,
      totalProjects: 0,
      projectsWithScreenshots: 0,
      screenshotsFound: 0,
      profileTargets: this.emptyTargetStats(),
      readModelTargets: this.emptyTargetStats(),
      missingProfileTargets: 0,
      missingReadModelTargets: 0,
      errors: [],
      examples: [],
    };
  }

  private emptyTargetStats(): TargetBackfillStats {
    return {
      matched: 0,
      alreadyCurrent: 0,
      wouldUpdate: 0,
      updated: 0,
    };
  }

  private emptyTargetBackfillResult(): {
    stats: TargetBackfillStats;
    targetIds: string[];
  } {
    return {
      stats: this.emptyTargetStats(),
      targetIds: [],
    };
  }

  private addTargetStats(
    target: TargetBackfillStats,
    value: TargetBackfillStats
  ): void {
    target.matched += value.matched;
    target.alreadyCurrent += value.alreadyCurrent;
    target.wouldUpdate += value.wouldUpdate;
    target.updated += value.updated;
  }

  private resolveLimit(options: IcoProjectScreenshotsBackfillOptions): number {
    if (options.all) return Number.MAX_SAFE_INTEGER;
    return this.parsePositiveInteger(options.limit, this.defaultLimit);
  }

  private parsePositiveInteger(value: any, fallback: number): number {
    const parsed = Number(value || fallback);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.max(1, Math.trunc(parsed));
  }

  private parseNonNegativeInteger(value: any, fallback: number): number {
    if (value === undefined || value === null || value === "") return fallback;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return fallback;
    return Math.trunc(parsed);
  }

  private arrayValue(value: any): any[] {
    if (Array.isArray(value)) return value;
    return value === undefined || value === null ? [] : [value];
  }

  private firstString(...values: any[]): string | undefined {
    for (const value of values) {
      const candidates = Array.isArray(value) ? value : [value];
      for (const candidate of candidates) {
        const clean =
          typeof candidate === "object"
            ? cleanProjectProfileString(
                candidate?.url || candidate?.href || candidate?.value
              )
            : cleanProjectProfileString(candidate);
        if (clean) return clean;
      }
    }
    return undefined;
  }

  private slugFromUrl(value: any): string | undefined {
    const text = cleanProjectProfileString(value);
    if (!text) return undefined;
    const parts = text.replace(/\/+$/, "").split("/");
    return parts[parts.length - 1];
  }

  private toIdString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();
    if (typeof value.toString === "function") return value.toString();
    return "";
  }

  private cleanObject<T extends Record<string, any>>(input: T): T {
    const output: Record<string, any> = {};
    for (const [key, value] of Object.entries(input || {})) {
      if (value === undefined) continue;
      output[key] = value;
    }
    return output as T;
  }

  private dbName(): string {
    return (
      String(
        this.configService.get("DB_NAME") || process.env.DB_NAME || "fomoland"
      ).trim() || "fomoland"
    );
  }

  private parserDbName(): string {
    return (
      String(
        this.configService.get("DB_PARSER_NAME") ||
          process.env.DB_PARSER_NAME ||
          this.dbName()
      ).trim() || this.dbName()
    );
  }
}
