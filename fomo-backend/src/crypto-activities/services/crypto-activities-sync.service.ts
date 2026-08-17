import { Injectable, Logger, NotFoundException, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import axios, { AxiosRequestConfig } from "axios";
import mongoose, { Model } from "mongoose";
import { IntelSyncWorkerRunnerService } from "src/intel-sync/intel-sync-worker-runner.service";
import { FomoV2ParserControlPolicyService } from "src/fomo-v2/domains/parser-control";
import {
  mapParserActivityToCryptoActivity,
  MappedParserCryptoActivity,
  normalizeComparableText,
  ParserCryptoActivity,
  stableNegativeId,
} from "../mappers/parser-activity.mapper";
import { CryptoActivity, CryptoActivityDocument } from "../models/crypto-activity.model";
import {
  CryptoActivitiesSyncLock,
  CryptoActivitiesSyncLockDocument,
} from "../models/crypto-activities-sync-lock.model";
import {
  CryptoActivitiesSyncRun,
  CryptoActivitiesSyncRunDocument,
  CryptoActivitiesSyncRunStatus,
} from "../models/crypto-activities-sync-run.model";

export interface CryptoActivitiesSyncOptions {
  limit?: number;
  maxPages?: number;
  dryRun?: boolean;
  force?: boolean;
}

export interface CryptoActivitiesSyncResult {
  startedAt: Date;
  finishedAt?: Date;
  fetched: number;
  created: number;
  updated: number;
  linked: number;
  skipped: number;
  failed: number;
  duplicatesPrevented: number;
  dryRun: boolean;
  wouldCreate?: number;
  wouldUpdate?: number;
  wouldLink?: number;
  errors: Array<{
    sourceId?: string;
    slug?: string;
    error: string;
  }>;
}

interface ParserListResponse {
  items?: ParserCryptoActivity[];
  data?: ParserCryptoActivity[];
  total?: number;
  limit?: number;
  offset?: number;
  hasMore?: boolean;
}

interface ExistingActivityMatch {
  activity?: CryptoActivityDocument;
  matchType: string;
  confidence: number;
  ambiguous?: boolean;
}

const LOCK_KEY = "crypto-activities-sync";
const LOCK_TTL_MS = 30 * 60 * 1000;

@Injectable()
export class CryptoActivitiesSyncService {
  private readonly logger = new Logger(CryptoActivitiesSyncService.name);
  private readonly batchSize: number;
  private readonly apiTimeoutMs: number;
  private readonly maxRetries: number;

  constructor(
    @InjectModel(CryptoActivity.name)
    private readonly activityModel: Model<CryptoActivityDocument>,
    @InjectModel(CryptoActivitiesSyncRun.name)
    private readonly syncRunModel: Model<CryptoActivitiesSyncRunDocument>,
    @InjectModel(CryptoActivitiesSyncLock.name)
    private readonly syncLockModel: Model<CryptoActivitiesSyncLockDocument>,
    private readonly configService: ConfigService,
    private readonly intelSyncWorkerRunnerService: IntelSyncWorkerRunnerService,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService,
  ) {
    this.batchSize = Math.max(
      1,
      Number(this.configService.get("CRYPTO_ACTIVITIES_SYNC_BATCH_SIZE") || 50),
    );
    this.apiTimeoutMs = Math.max(
      1000,
      Number(this.configService.get("CRYPTO_ACTIVITIES_SYNC_TIMEOUT_MS") || 20000),
    );
    this.maxRetries = Math.max(
      0,
      Number(this.configService.get("CRYPTO_ACTIVITIES_SYNC_MAX_RETRIES") || 2),
    );
  }

  @Cron(process.env.CRYPTO_ACTIVITIES_SYNC_CRON || "0 */6 * * *")
  async syncCryptoActivitiesCron(): Promise<void> {
    if (!this.isCronEnabled()) {
      this.logger.log("Crypto activities parser sync skipped: disabled");
      return;
    }

    if (
      this.parserControlPolicy &&
      !(await this.parserControlPolicy.canWriteDomainData("activities:legacy"))
    ) {
      return;
    }

    this.intelSyncWorkerRunnerService.runJob("crypto-activities-parser-sync", "cron");
  }

  async syncCryptoActivities(
    options: CryptoActivitiesSyncOptions = {},
    trigger = "manual",
  ): Promise<CryptoActivitiesSyncResult> {
    const startedAt = new Date();
    const dryRun = this.toBoolean(options.dryRun, false);
    if (!dryRun && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        "activities:legacy"
      );
    }
    const result: CryptoActivitiesSyncResult = {
      startedAt,
      fetched: 0,
      created: 0,
      updated: 0,
      linked: 0,
      skipped: 0,
      failed: 0,
      duplicatesPrevented: 0,
      dryRun,
      errors: [],
    };

    const owner = this.buildLockOwner();
    const lock = await this.acquireLock(owner, Boolean(options.force));
    if (!lock) {
      result.skipped = 1;
      result.finishedAt = new Date();
      result.errors.push({
        error: "Crypto activities sync is already running",
      });
      return this.decorateDryRunResult(result);
    }

    const run = await this.syncRunModel.create({
      startedAt,
      status: "running",
      dryRun,
      trigger,
      errors: [],
    });

    try {
      const limit = this.parseLimit(
        options.limit ?? this.configService.get("CRYPTO_ACTIVITIES_SYNC_LIMIT"),
      );
      const maxPages = this.parseMaxPages(
        options.maxPages ?? this.configService.get("CRYPTO_ACTIVITIES_SYNC_MAX_PAGES"),
      );

      await this.executeSyncPages(limit, maxPages, result);

      result.finishedAt = new Date();
      const status = this.resolveRunStatus(result);
      await this.finishRun(run._id, status, result);

      this.logger.log(
        `Crypto activities sync finished (${trigger}, dryRun=${dryRun}): fetched=${result.fetched}, created=${result.created}, updated=${result.updated}, linked=${result.linked}, skipped=${result.skipped}, failed=${result.failed}`,
      );

      return this.decorateDryRunResult(result);
    } catch (error) {
      result.failed += 1;
      result.finishedAt = new Date();
      result.errors.push({ error: this.formatError(error) });
      await this.finishRun(run._id, "failed", result);
      throw error;
    } finally {
      await this.releaseLock(owner);
    }
  }

  async listSyncRuns(query: Record<string, any> = {}) {
    const limit = Math.min(Math.max(Number(query.limit || 20), 1), 100);
    const offset = Math.max(Number(query.offset || 0), 0);
    const [total, items] = await Promise.all([
      this.syncRunModel.countDocuments({}),
      this.syncRunModel
        .find({})
        .sort({ startedAt: -1, createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
    ]);

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async getSyncRun(id: string) {
    const objectId = mongoose.Types.ObjectId.isValid(id)
      ? new mongoose.Types.ObjectId(id)
      : null;
    const run = objectId ? await this.syncRunModel.findById(objectId).lean() : null;
    if (!run) throw new NotFoundException("Crypto activities sync run not found");

    return run;
  }

  async findExistingActivityForParsedActivity(
    parsed: MappedParserCryptoActivity,
  ): Promise<ExistingActivityMatch> {
    const parserActivityId = this.toNonEmptyString(parsed.parserActivityId);
    if (parserActivityId) {
      const activity = await this.activityModel.findOne({ parserActivityId });
      if (activity) return { activity, matchType: "parserActivityId", confidence: 100 };
    }

    const slug = this.toNonEmptyString(parsed.slug);
    if (slug) {
      const activity = await this.activityModel.findOne({ slug });
      if (activity) return { activity, matchType: "slug", confidence: 96 };
    }

    const externalSlug = this.toNonEmptyString(parsed.externalSlug);
    if (externalSlug) {
      const activity = await this.activityModel.findOne({ externalSlug });
      if (activity) return { activity, matchType: "externalSlug", confidence: 94 };
    }

    const sourceUrls = this.sourceUrls(parsed);
    if (sourceUrls.length) {
      const activity = await this.activityModel.findOne({
        $or: [{ sourceUrl: { $in: sourceUrls } }, { "sources.url": { $in: sourceUrls } }],
      });
      if (activity) return { activity, matchType: "sourceUrl", confidence: 92 };
    }

    if (parsed.coinSlug && parsed.activityType && parsed.sourceUrl) {
      const activity = await this.activityModel.findOne({
        coinSlug: parsed.coinSlug,
        activityType: parsed.activityType,
        $or: [{ sourceUrl: parsed.sourceUrl }, { "sources.url": parsed.sourceUrl }],
      });
      if (activity) return { activity, matchType: "coinSlug+activityType+sourceUrl", confidence: 90 };
    }

    const exactName = this.toNonEmptyString(parsed.projectName || parsed.name || parsed.coinName);
    if (exactName && parsed.activityType) {
      const escaped = this.escapeRegex(exactName);
      const candidates = await this.activityModel
        .find({
          activityType: parsed.activityType,
          $or: [
            { projectName: new RegExp(`^${escaped}$`, "i") },
            { name: new RegExp(`^${escaped}$`, "i") },
            { coinName: new RegExp(`^${escaped}$`, "i") },
          ],
        })
        .limit(3);

      if (candidates.length === 1) {
        return { activity: candidates[0], matchType: "projectName+activityType", confidence: 82 };
      }

      if (candidates.length > 1) {
        return { matchType: "projectName+activityType", confidence: 70, ambiguous: true };
      }
    }

    const fuzzyMatch = await this.findFuzzyMatch(parsed);
    if (fuzzyMatch) return fuzzyMatch;

    return { matchType: "none", confidence: 0 };
  }

  private async executeSyncPages(
    limit: number,
    maxPages: number,
    result: CryptoActivitiesSyncResult,
  ): Promise<void> {
    let offset = 0;
    let pageIndex = 0;
    let hasMore = true;
    let pageBuffer: ParserCryptoActivity[] = [];

    while (hasMore && pageIndex < maxPages) {
      const page = await this.fetchParserActivitiesPage(limit, offset);
      const items = this.extractPageItems(page);
      result.fetched += items.length;

      pageBuffer.push(...items);
      while (pageBuffer.length >= this.batchSize) {
        const batch = pageBuffer.splice(0, this.batchSize);
        await this.processBatch(batch, result);
      }

      const reportedHasMore = Boolean(page?.hasMore);
      hasMore = reportedHasMore && items.length > 0;
      offset += items.length || limit;
      pageIndex += 1;

      if (!reportedHasMore && items.length < limit) {
        break;
      }
    }

    if (pageBuffer.length) {
      await this.processBatch(pageBuffer, result);
    }
  }

  private async processBatch(
    items: ParserCryptoActivity[],
    result: CryptoActivitiesSyncResult,
  ): Promise<void> {
    for (const item of items) {
      await this.processParserActivity(item, result);
    }
  }

  private async processParserActivity(
    item: ParserCryptoActivity,
    result: CryptoActivitiesSyncResult,
  ): Promise<void> {
    const sourceId = this.parserSourceId(item);
    const slug = this.toNonEmptyString(item.slug || item.coinSlug || item.externalSlug);

    try {
      const detail = await this.fetchParserActivityDetailSafe(item, result);
      const mapped = mapParserActivityToCryptoActivity(detail || item);
      if (!mapped) {
        result.skipped += 1;
        result.errors.push({
          sourceId,
          slug,
          error: "Parser activity cannot be mapped",
        });
        return;
      }

      const match = await this.findExistingActivityForParsedActivity(mapped);
      if (match.ambiguous) {
        result.skipped += 1;
        result.errors.push({
          sourceId: mapped.parserActivityId || sourceId,
          slug: mapped.slug,
          error: `Ambiguous activity match (${match.matchType})`,
        });
        return;
      }

      if (result.dryRun) {
        this.countDryRunOperation(match, result);
        return;
      }

      if (match.activity) {
        const wasLinked = !match.activity.parserActivityId;
        await this.updateExistingActivity(match.activity, mapped);
        result.duplicatesPrevented += 1;
        if (wasLinked) result.linked += 1;
        else result.updated += 1;
        return;
      }

      await this.createActivity(mapped);
      result.created += 1;
    } catch (error) {
      result.failed += 1;
      result.errors.push({
        sourceId,
        slug,
        error: this.formatError(error),
      });
      this.logger.warn(
        `Crypto activity sync failed for ${sourceId || slug || "unknown"}: ${this.formatError(error)}`,
      );
    }
  }

  private async fetchParserActivityDetailSafe(
    item: ParserCryptoActivity,
    result: CryptoActivitiesSyncResult,
  ): Promise<ParserCryptoActivity | null> {
    const id =
      this.toNonEmptyString(item._id) ||
      this.toNonEmptyString(item.slug) ||
      this.toNonEmptyString(item.coinSlug) ||
      this.toNonEmptyString(item.id);

    if (!id) return null;

    try {
      return await this.fetchParserActivityDetail(id);
    } catch (error) {
      result.errors.push({
        sourceId: this.parserSourceId(item),
        slug: this.toNonEmptyString(item.slug || item.coinSlug),
        error: `Detail fetch failed, using list item: ${this.formatError(error)}`,
      });
      return null;
    }
  }

  private countDryRunOperation(
    match: ExistingActivityMatch,
    result: CryptoActivitiesSyncResult,
  ): void {
    if (!match.activity) {
      result.created += 1;
      return;
    }

    result.duplicatesPrevented += 1;
    if (!match.activity.parserActivityId) result.linked += 1;
    else result.updated += 1;
  }

  private async createActivity(mapped: MappedParserCryptoActivity): Promise<void> {
    const createData: any = {
      ...mapped,
      id: await this.uniqueLegacyId(mapped),
      lastSyncedAt: new Date(),
      syncMeta: this.buildSyncMeta(mapped),
    };

    try {
      await this.activityModel.create(createData);
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) throw error;

      const retryMatch = await this.findExistingActivityForParsedActivity(mapped);
      if (!retryMatch.activity) throw error;

      await this.updateExistingActivity(retryMatch.activity, mapped);
    }
  }

  private async updateExistingActivity(
    existing: CryptoActivityDocument,
    mapped: MappedParserCryptoActivity,
  ): Promise<void> {
    const update = this.buildMergedUpdate(existing, mapped);
    this.logger.debug(
      `Updating crypto activity ${mapped.parserActivityId}: ${Object.keys(update.$set || {}).sort().join(", ")}`,
    );
    await this.activityModel.updateOne({ _id: existing._id }, update);
  }

  private buildMergedUpdate(
    existing: CryptoActivityDocument,
    mapped: MappedParserCryptoActivity,
  ): Record<string, any> {
    const existingObject: any = existing.toObject();
    const manualFields = new Set<string>(existingObject.manualOverrides?.fields || []);
    const $set: Record<string, any> = {
      lastSyncedAt: new Date(),
      syncMeta: this.buildSyncMeta(mapped),
    };

    const scalarFields = [
      "parserActivityId",
      "externalSlug",
      "primarySource",
      "source",
      "sourceUrl",
      "originalUrl",
      "projectName",
      "name",
      "symbol",
      "coinSlug",
      "coinName",
      "coinSymbol",
      "logo",
      "projectLogo",
      "score",
      "status",
      "activityType",
      "category",
      "difficulty",
      "cost",
      "timeEstimate",
      "taskFrequency",
      "isHot",
      "isLocked",
      "rewardLabel",
      "startDate",
      "endDate",
      "approxStartDate",
      "approxEndDate",
      "statusUpdatedAt",
      "rewardSupply",
      "rewardAmount",
      "rewardDistribution",
      "rewardDistributionApprox",
      "participants",
      "fundsRaised",
      "joinLink",
      "review",
      "metrics",
      "flags",
      "parserMeta",
      "updatedAt",
    ];

    for (const field of scalarFields) {
      if (this.isManualLocked(field, manualFields)) continue;
      if (field === "slug" && existingObject.slug && !existingObject.parserActivityId) continue;

      const value = (mapped as any)[field];
      if (this.hasMeaningfulValue(value)) {
        $set[field] = value;
      }
    }

    if (!existingObject.slug && mapped.slug && !this.isManualLocked("slug", manualFields)) {
      $set.slug = mapped.slug;
    }

    if (!this.isManualLocked("description", manualFields)) {
      $set.description = this.mergeDescription(existingObject.description, mapped.description);
    }

    if (!this.isManualLocked("sourceMeta", manualFields)) {
      $set.sourceMeta = this.mergeSourceMeta(existingObject.sourceMeta, mapped.sourceMeta);
    }

    if (!this.isManualLocked("rawSourceData", manualFields)) {
      $set.rawSourceData = this.pickRicherObject(existingObject.rawSourceData, mapped.rawSourceData);
    }

    this.setMergedArray($set, manualFields, "sources", existingObject.sources, mapped.sources, (item) =>
      `${item?.source || ""}:${item?.url || ""}`,
    );
    this.setMergedArray($set, manualFields, "tags", existingObject.tags, mapped.tags, (item) => item);
    if (!this.isManualLocked("requirements", manualFields)) {
      const requirements = this.mergeRequirements(existingObject.requirements, (mapped as any).requirements);
      if (requirements.length) $set.requirements = requirements;
    }
    this.setMergedArray($set, manualFields, "ecosystem", existingObject.ecosystem, mapped.ecosystem, (item) => item);
    this.setMergedArray($set, manualFields, "platform", existingObject.platform, mapped.platform, (item) => item);
    this.setMergedArray($set, manualFields, "videoGuides", existingObject.videoGuides, mapped.videoGuides, (item) => item);
    this.setMergedArray($set, manualFields, "rewards", existingObject.rewards, mapped.rewards, (item) => this.stableKey(item));
    this.setMergedArray($set, manualFields, "investors", existingObject.investors, mapped.investors, (item) => this.stableKey(item));
    this.setMergedArray($set, manualFields, "relatedAssets", existingObject.relatedAssets, mapped.relatedAssets, (item) =>
      item?.slug || item?.name || this.stableKey(item),
    );
    this.setMergedArray($set, manualFields, "links", existingObject.links, mapped.links, (item) => item?.url || this.stableKey(item));
    this.setMergedArray($set, manualFields, "timeline", existingObject.timeline, mapped.timeline, (item) =>
      `${item?.title || ""}:${item?.date ? new Date(item.date).toISOString() : ""}`,
    );

    if (!this.isManualLocked("socialLinks", manualFields)) {
      $set.socialLinks = this.mergeSocialLinks(existingObject.socialLinks, mapped.socialLinks);
    }

    if (!this.isManualLocked("taskGuide", manualFields)) {
      $set.taskGuide = this.mergeTaskGuide(existingObject.taskGuide, mapped.taskGuide);
    }

    return { $set };
  }

  private buildSyncMeta(mapped: MappedParserCryptoActivity) {
    return {
      sourceSystem: "crypto-activities-parser",
      parserUpdatedAt: this.toDateFromTimestamp(mapped.updatedAt),
      parserCreatedAt: this.toDateFromTimestamp(mapped.createdAt),
      lastSyncRunAt: new Date(),
    };
  }

  private async uniqueLegacyId(mapped: MappedParserCryptoActivity): Promise<number> {
    let candidate = mapped.id || stableNegativeId(mapped.parserActivityId);

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const existing = await this.activityModel.findOne({ id: candidate }).lean();
      if (!existing || existing.parserActivityId === mapped.parserActivityId) return candidate;

      candidate = stableNegativeId(`${mapped.parserActivityId}:${attempt + 1}`);
    }

    return candidate;
  }

  private async fetchParserActivitiesPage(
    limit: number,
    offset: number,
  ): Promise<ParserListResponse> {
    const url = `${this.getBaseUrl()}/crypto-activities`;
    return this.requestJson<ParserListResponse>(url, {
      params: { limit, offset },
    });
  }

  private async fetchParserActivityDetail(id: string): Promise<ParserCryptoActivity> {
    const url = `${this.getBaseUrl()}/crypto-activities/${encodeURIComponent(id)}`;
    return this.requestJson<ParserCryptoActivity>(url);
  }

  private async requestJson<T>(
    url: string,
    config: AxiosRequestConfig = {},
    attempt = 0,
  ): Promise<T> {
    try {
      const response = await axios.get<T>(url, {
        ...config,
        timeout: this.apiTimeoutMs,
        headers: {
          ...(config.headers || {}),
          ...this.getAuthHeaders(),
        },
      });

      return response.data;
    } catch (error) {
      if (attempt >= this.maxRetries) throw error;
      await this.sleep(Math.min(1000 * Math.pow(2, attempt), 5000));
      return this.requestJson<T>(url, config, attempt + 1);
    }
  }

  private extractPageItems(page: ParserListResponse): ParserCryptoActivity[] {
    if (Array.isArray(page?.items)) return page.items;
    if (Array.isArray(page?.data)) return page.data;
    return [];
  }

  private async acquireLock(
    owner: string,
    force: boolean,
  ): Promise<CryptoActivitiesSyncLockDocument | null> {
    const now = new Date();
    if (force) {
      await this.syncLockModel.deleteOne({ key: LOCK_KEY });
    }

    try {
      return await this.syncLockModel.findOneAndUpdate(
        {
          key: LOCK_KEY,
          $or: [
            { expiresAt: { $lte: now } },
            { expiresAt: { $exists: false } },
          ],
        },
        {
          $set: {
            key: LOCK_KEY,
            owner,
            acquiredAt: now,
            expiresAt: new Date(now.getTime() + LOCK_TTL_MS),
          },
        },
        { upsert: true, new: true },
      );
    } catch (error) {
      if (this.isDuplicateKeyError(error)) return null;
      throw error;
    }
  }

  private async releaseLock(owner: string): Promise<void> {
    await this.syncLockModel.deleteOne({ key: LOCK_KEY, owner });
  }

  private async finishRun(
    id: any,
    status: CryptoActivitiesSyncRunStatus,
    result: CryptoActivitiesSyncResult,
  ): Promise<void> {
    await this.syncRunModel.updateOne(
      { _id: id },
      {
        $set: {
          finishedAt: result.finishedAt || new Date(),
          status,
          fetched: result.fetched,
          created: result.created,
          updated: result.updated,
          linked: result.linked,
          skipped: result.skipped,
          failed: result.failed,
          duplicatesPrevented: result.duplicatesPrevented,
          errors: result.errors.slice(0, 100),
        },
      },
    );
  }

  private resolveRunStatus(result: CryptoActivitiesSyncResult): CryptoActivitiesSyncRunStatus {
    if (result.failed > 0 && result.fetched === 0) return "failed";
    if (result.failed > 0 || result.errors.length > 0) return "partial";
    return "completed";
  }

  private decorateDryRunResult(result: CryptoActivitiesSyncResult): CryptoActivitiesSyncResult {
    if (!result.dryRun) return result;

    return {
      ...result,
      wouldCreate: result.created,
      wouldUpdate: result.updated,
      wouldLink: result.linked,
    };
  }

  private async findFuzzyMatch(
    parsed: MappedParserCryptoActivity,
  ): Promise<ExistingActivityMatch | null> {
    const parsedName = normalizeComparableText(
      parsed.projectName || parsed.name || parsed.coinName || parsed.slug,
    );
    if (!parsedName || !parsed.activityType) return null;

    const candidates = await this.activityModel
      .find({
        activityType: parsed.activityType,
        $or: [
          { coinSlug: parsed.coinSlug },
          { tags: { $in: parsed.tags || [] } },
          { category: parsed.category },
        ],
      })
      .limit(20);

    const scored = candidates
      .map((activity) => ({
        activity,
        score: this.scoreFuzzyMatch(activity, parsed, parsedName),
      }))
      .filter((item) => item.score >= 86)
      .sort((left, right) => right.score - left.score);

    if (!scored.length) return null;
    if (scored.length > 1 && scored[0].score - scored[1].score < 8) {
      return { matchType: "fuzzy", confidence: scored[0].score, ambiguous: true };
    }

    return {
      activity: scored[0].activity,
      matchType: "fuzzy",
      confidence: scored[0].score,
    };
  }

  private scoreFuzzyMatch(
    activity: CryptoActivityDocument,
    parsed: MappedParserCryptoActivity,
    parsedName: string,
  ): number {
    const activityObject: any = activity.toObject();
    const activityName = normalizeComparableText(
      activityObject.projectName || activityObject.name || activityObject.coinName || activityObject.slug,
    );
    let score = Math.round(this.similarity(activityName, parsedName) * 70);

    if (activityObject.activityType === parsed.activityType) score += 15;
    if (activityObject.coinSlug && activityObject.coinSlug === parsed.coinSlug) score += 10;
    if (this.datesAreCompatible(activityObject, parsed)) score += 5;

    return Math.min(100, score);
  }

  private datesAreCompatible(left: any, right: any): boolean {
    const leftStart = this.dateTime(left.startDate);
    const rightStart = this.dateTime(right.startDate);
    const leftEnd = this.dateTime(left.endDate);
    const rightEnd = this.dateTime(right.endDate);

    if (leftStart && rightStart && Math.abs(leftStart - rightStart) > 45 * 24 * 60 * 60 * 1000) {
      return false;
    }

    if (leftEnd && rightEnd && Math.abs(leftEnd - rightEnd) > 45 * 24 * 60 * 60 * 1000) {
      return false;
    }

    return true;
  }

  private similarity(left: string, right: string): number {
    if (!left || !right) return 0;
    if (left === right) return 1;

    const leftTokens = new Set(left.split("-").filter(Boolean));
    const rightTokens = new Set(right.split("-").filter(Boolean));
    const intersection = [...leftTokens].filter((token) => rightTokens.has(token)).length;
    const union = new Set([...leftTokens, ...rightTokens]).size;

    return union ? intersection / union : 0;
  }

  private setMergedArray(
    target: Record<string, any>,
    manualFields: Set<string>,
    field: string,
    existingValue: any,
    mappedValue: any,
    keyFn: (item: any) => string,
  ): void {
    if (this.isManualLocked(field, manualFields)) return;
    const merged = this.mergeArrays(existingValue, mappedValue, keyFn);
    if (merged.length) target[field] = merged;
  }

  private mergeArrays(existingValue: any, mappedValue: any, keyFn: (item: any) => string): any[] {
    const merged: any[] = [];
    const seen = new Set<string>();

    for (const item of [...(Array.isArray(existingValue) ? existingValue : []), ...(Array.isArray(mappedValue) ? mappedValue : [])]) {
      if (!this.hasMeaningfulValue(item)) continue;
      const key = normalizeComparableText(keyFn(item) || this.stableKey(item));
      if (!key || seen.has(key)) continue;

      seen.add(key);
      merged.push(item);
    }

    return merged;
  }

  private mergeDescription(existingDescription: any, mappedDescription: any) {
    return {
      about:
        this.pickRicherText(existingDescription?.about, mappedDescription?.about) ||
        this.toNonEmptyString(existingDescription?.about) ||
        "",
      aboutHtml:
        this.pickRicherText(existingDescription?.aboutHtml, mappedDescription?.aboutHtml) ||
        this.toNonEmptyString(existingDescription?.aboutHtml) ||
        "",
      howToParticipate:
        this.pickRicherText(existingDescription?.howToParticipate, mappedDescription?.howToParticipate) ||
        this.toNonEmptyString(existingDescription?.howToParticipate) ||
        "",
      howToParticipateHtml:
        this.pickRicherText(existingDescription?.howToParticipateHtml, mappedDescription?.howToParticipateHtml) ||
        this.toNonEmptyString(existingDescription?.howToParticipateHtml) ||
        "",
    };
  }

  private mergeSourceMeta(existingMeta: any, mappedMeta: any) {
    if (!this.hasMeaningfulValue(existingMeta)) return mappedMeta;
    if (!this.hasMeaningfulValue(mappedMeta)) return existingMeta;

    const { bySource: existingBySource = {}, ...existingTopLevel } = existingMeta || {};
    const { bySource: mappedBySource = {}, ...mappedTopLevel } = mappedMeta || {};
    const existingSource = this.toNonEmptyString(existingMeta?.source);
    const mappedSource = this.toNonEmptyString(mappedMeta?.source);
    const bySource = {
      ...existingBySource,
      ...mappedBySource,
    };

    if (existingSource) bySource[existingSource] = { ...existingTopLevel };
    if (mappedSource) bySource[mappedSource] = { ...mappedTopLevel };

    return {
      ...existingTopLevel,
      ...mappedTopLevel,
      bySource,
    };
  }

  private pickRicherText(existingValue: any, mappedValue: any): string {
    const existing = this.toNonEmptyString(existingValue) || "";
    const incoming = this.toNonEmptyString(mappedValue) || "";

    if (!incoming) return existing;
    if (!existing) return incoming;
    if (incoming.length >= existing.length + 80) return incoming;
    if (incoming.length >= Math.ceil(existing.length * 1.25)) return incoming;

    return existing;
  }

  private mergeSocialLinks(existingLinks: any, mappedLinks: any) {
    const result = { ...(existingLinks || {}) };

    for (const key of ["website", "twitter", "telegram", "discord", "docs"]) {
      const value = this.toNonEmptyString(mappedLinks?.[key]);
      if (value) result[key] = value;
    }

    result.custom = this.mergeArrays(existingLinks?.custom, mappedLinks?.custom, (item) => item?.url || this.stableKey(item));
    return result;
  }

  private mergeTaskGuide(existingGuide: any, mappedGuide: any) {
    const result = { ...(existingGuide || {}) };

    for (const key of ["title", "description", "descriptionHtml", "ctaLabel", "ctaUrl", "successMessage"]) {
      const value = key === "description" || key === "descriptionHtml"
        ? this.pickRicherText(existingGuide?.[key], mappedGuide?.[key])
        : this.toNonEmptyString(mappedGuide?.[key]);
      if (value) result[key] = value;
    }

    if (mappedGuide?.isLocked !== undefined) result.isLocked = Boolean(mappedGuide.isLocked);
    const existingSteps = Array.isArray(existingGuide?.steps) ? existingGuide.steps : [];
    const mappedSteps = Array.isArray(mappedGuide?.steps) ? mappedGuide.steps : [];
    const mergedSteps = this.shouldPreferMappedSteps(existingSteps, mappedSteps)
      ? this.mergeGuideSteps(mappedSteps, existingSteps)
      : this.mergeGuideSteps(existingSteps, mappedSteps);
    result.steps = this.pruneGenericSteps(mergedSteps);

    return result;
  }

  private mergeGuideSteps(primarySteps: any[], secondarySteps: any[]): any[] {
    const merged: any[] = [];
    const indexByKey = new Map<string, number>();

    for (const item of [...primarySteps, ...secondarySteps]) {
      if (!this.hasMeaningfulValue(item)) continue;

      const key = normalizeComparableText(
        this.toNonEmptyString(item?.id) ||
          this.toNonEmptyString(item?.title) ||
          `${this.toNonEmptyString(item?.description) || ""}:${this.toNonEmptyString(item?.video) || ""}`,
      );
      if (!key) continue;

      const existingIndex = indexByKey.get(key);
      if (existingIndex === undefined) {
        indexByKey.set(key, merged.length);
        merged.push(item);
        continue;
      }

      const current = merged[existingIndex] || {};
      merged[existingIndex] = {
        ...current,
        id: this.toNonEmptyString(current.id) || this.toNonEmptyString(item?.id) || "",
        title: this.toNonEmptyString(current.title) || this.toNonEmptyString(item?.title) || "",
        description: this.pickRicherText(current.description, item?.description),
        descriptionHtml: this.pickRicherText(current.descriptionHtml, item?.descriptionHtml),
        image: this.toNonEmptyString(current.image) || this.toNonEmptyString(item?.image) || "",
        video: this.toNonEmptyString(current.video) || this.toNonEmptyString(item?.video) || "",
      };
    }

    return merged;
  }

  private mergeRequirements(existingValue: any, mappedValue: any): string[] {
    const merged = this.mergeArrays(existingValue, mappedValue, (item) => item);
    return this.pruneGenericRequirements(merged);
  }

  private shouldPreferMappedSteps(existingSteps: any[], mappedSteps: any[]): boolean {
    if (!mappedSteps.length) return false;
    if (!existingSteps.length) return true;

    const existingQuality = this.stepsQuality(existingSteps);
    const mappedQuality = this.stepsQuality(mappedSteps);

    if (mappedSteps.length >= 4 && mappedQuality >= existingQuality + 200) return true;
    if (mappedSteps.length > existingSteps.length && mappedQuality >= existingQuality) return true;

    return false;
  }

  private stepsQuality(steps: any[]): number {
    return steps.reduce((total, step) => {
      const title = this.toNonEmptyString(step?.title) || "";
      const description = this.toNonEmptyString(step?.description) || "";
      const hasSpecificTitle = title && !/^step\s+\d+$/i.test(title);
      return total + description.length + (hasSpecificTitle ? 50 : 0) + (description.length >= 120 ? 30 : 0);
    }, 0);
  }

  private pruneGenericSteps(steps: any[]): any[] {
    const richSteps = steps.filter((step) => !this.isGenericStep(step));
    if (richSteps.length < 3) return steps;
    return steps.filter((step) => !this.isGenericStep(step));
  }

  private isGenericStep(step: any): boolean {
    const title = this.toNonEmptyString(step?.title) || "";
    const description = this.toNonEmptyString(step?.description) || "";
    if (!/^step\s+\d+$/i.test(title)) return false;

    const normalized = description.toLowerCase();
    return (
      !this.toNonEmptyString(step?.id) ||
      /official site.*(eligibility|requirements)/i.test(description) ||
      /official social channels/i.test(description) ||
      normalized.length < 120
    );
  }

  private pruneGenericRequirements(requirements: any[]): string[] {
    const strings = requirements
      .map((item) => this.toNonEmptyString(item))
      .filter(Boolean) as string[];
    const richCount = strings.filter((item) => !this.isGenericRequirement(item)).length;
    if (richCount < 3) return strings;
    return strings.filter((item) => !this.isGenericRequirement(item));
  }

  private isGenericRequirement(value: string): boolean {
    return (
      /official site.*(eligibility|requirements)/i.test(value) ||
      /official social channels/i.test(value)
    );
  }

  private pickRicherObject(existingValue: any, mappedValue: any): any {
    if (!this.hasMeaningfulValue(existingValue)) return mappedValue;
    if (!this.hasMeaningfulValue(mappedValue)) return existingValue;
    return this.objectQuality(mappedValue) >= this.objectQuality(existingValue) ? mappedValue : existingValue;
  }

  private objectQuality(value: any): number {
    if (!value || typeof value !== "object") return 0;
    let score = Object.keys(value).length * 5;
    const sections = value.sections || value.rawPayload?.sections;
    if (sections) {
      score += Number(sections.aboutLength || 0);
      score += Number(sections.detailsLength || 0);
      score += Number(sections.stepsCount || 0) * 100;
    }
    return score;
  }

  private sourceUrls(parsed: MappedParserCryptoActivity): string[] {
    return Array.from(
      new Set(
        [
          this.toNonEmptyString(parsed.sourceUrl),
          this.toNonEmptyString((parsed as any).originalUrl),
          ...(Array.isArray(parsed.sources)
            ? parsed.sources.map((item: any) => this.toNonEmptyString(item?.url))
            : []),
        ].filter(Boolean),
      ),
    );
  }

  private parserSourceId(item: ParserCryptoActivity): string | undefined {
    return (
      this.toNonEmptyString(item.parserActivityId) ||
      this.toNonEmptyString(item._id) ||
      this.toNonEmptyString(item.id) ||
      this.toNonEmptyString(item.slug)
    );
  }

  private getBaseUrl(): string {
    return String(
      this.configService.get("CRYPTO_ACTIVITIES_SYNC_BASE_URL") ||
        "http://localhost:8017/api",
    ).replace(/\/+$/, "");
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.toNonEmptyString(
      this.configService.get("CRYPTO_ACTIVITIES_SYNC_TOKEN"),
    );
    return token ? { Authorization: `Bearer ${token}`, "X-Admin-Token": token } : {};
  }

  private isCronEnabled(): boolean {
    return String(
      this.configService.get("CRYPTO_ACTIVITIES_SYNC_ENABLED") ?? "false",
    ).toLowerCase() === "true";
  }

  private parseLimit(value: any): number {
    const parsed = Number(value || 100);
    if (!Number.isFinite(parsed) || parsed <= 0) return 100;
    return Math.min(Math.floor(parsed), 100);
  }

  private parseMaxPages(value: any): number {
    const parsed = Number(value || 20);
    if (!Number.isFinite(parsed) || parsed <= 0) return 20;
    return Math.min(Math.floor(parsed), 100);
  }

  private toBoolean(value: any, fallback: boolean): boolean {
    if (value === undefined || value === null || value === "") return fallback;
    return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
  }

  private toNonEmptyString(value: unknown): string | undefined {
    if (value === null || value === undefined) return undefined;
    const text = String(value).trim();
    return text ? text : undefined;
  }

  private hasMeaningfulValue(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (value instanceof Date) return !Number.isNaN(value.getTime());
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  }

  private isManualLocked(field: string, manualFields: Set<string>): boolean {
    const root = field.split(".")[0];
    return manualFields.has(field) || manualFields.has(root);
  }

  private stableKey(value: any): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    try {
      return JSON.stringify(value);
    } catch (error) {
      return String(value);
    }
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  private dateTime(value: any): number | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }

  private toDateFromTimestamp(value: any): Date | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private isDuplicateKeyError(error: any): boolean {
    return error?.code === 11000 || String(error?.message || "").includes("E11000");
  }

  private buildLockOwner(): string {
    return `${process.pid}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
  }

  private formatError(error: any): string {
    return error?.response?.data?.message || error?.message || String(error);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
