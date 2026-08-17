import { UpdateNewsDto } from "./dto/update-news.dto";
import { BadRequestException, HttpException, HttpStatus, Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Types } from "mongoose";
import { News, NewsDocument, NewsSections } from "./models/news.model";
import {
  NEWS_ARTICLES_CONNECTION,
  NewsArticleSource,
  NewsArticleSourceDocument,
} from "./models/news-article-source.model";
import { ProjectDocument, Project } from "src/projects/project.model";
import { FilesService } from "src/files/files.service";
import { CreateNewsDto } from "./dto/create-news.dto";
import { ActionsService } from "../actions/actions.service";
import { RecommendationDto } from "./dto/recommendation.dto";
import { AddActionDto } from "src/actions/dto/add-action.dto";
import { User, UserDocument } from "src/user/user.model";
import { Cron, CronExpression } from "@nestjs/schedule";
import { createHash } from "crypto";
import { QueryNewsDto } from "./dto/query-news.dto";

@Injectable()
export class NewsService implements OnModuleInit {
  private readonly logger = new Logger(NewsService.name);
  private isNewsArticlesSyncRunning = false;

  constructor(
    @InjectModel(News.name) private newsModel: Model<NewsDocument>,
    @InjectModel(NewsArticleSource.name, NEWS_ARTICLES_CONNECTION)
    private newsArticleSourceModel: Model<NewsArticleSourceDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly filesService: FilesService,
    private readonly actionsService: ActionsService
  ) {
    // this.updateManyNews()
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.ensureNewsImportIndexes();
    } catch (error: any) {
      this.logger.error(
        `[NewsImport] Failed to ensure import indexes: ${error?.message || error}`,
        error?.stack,
      );
    }
  }

  async updateManyNews() {
    await this.newsModel.updateMany({}, { newsSection: 'default' })
  }

  private getReadTime(text, { wpm = 200, html = false, round = true } = {}): number {
    if (!text || typeof text !== 'string') return 0;

    const cleanText = html
      ? text.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ')
      : text.replace(/[^\w\s]|_/g, ' ').replace(/\s+/g, ' ');


    const wordCount = cleanText.trim() ? cleanText.trim().split(/\s+/).length : 0;


    const minutes = Math.max(0.5, wordCount / wpm);

    return round ? Math.ceil(minutes) : minutes;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async syncNewsArticlesCron(): Promise<void> {
    if (process.env.NEWS_ARTICLES_IMPORT_ENABLED === "false") {
      return;
    }

    if (this.isNewsArticlesSyncRunning) {
      this.logger.warn("[NewsImport] Previous news_articles sync is still running, skipping cron tick");
      return;
    }

    this.isNewsArticlesSyncRunning = true;
    try {
      const result = await this.syncNewsFromArticlesCollection();
      this.logger.log(
        `[NewsImport] Cron completed: candidates=${result.candidates}, saved=${result.saved}, duplicates=${result.duplicates}, failed=${result.failed}`,
      );
    } finally {
      this.isNewsArticlesSyncRunning = false;
    }
  }

  async getActiveNewsCount(): Promise<number> {
    return this.newsModel.countDocuments({ status: "active", newsSection: "default" });
  }

  async syncNewsFromArticlesCollection(limit: number = 30): Promise<{    candidates: number;
    saved: number;
    duplicates: number;
    failed: number;
    invalid: number;
  }> {
    // NEWS-1 fix: select by real ingestion recency, not lexicographic date strings.
    // `published_at`/`created_at` are stored as RFC-822 strings; sorting them
    // lexicographically buried fresh articles behind stale "Wed, .. 2024" rows,
    // so newly parsed articles never reached canonical News. We now drive the
    // import off insertion order (_id desc) and drain the backlog idempotently
    // by marking each processed raw article with ingest_status.
    const batchLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const result = {
      candidates: 0,
      saved: 0,
      duplicates: 0,
      failed: 0,
      invalid: 0,
    };

    const articles = await this.newsArticleSourceModel
      .find({ ingest_status: { $nin: ["imported", "invalid"] } })
      .sort({ _id: -1 })
      .limit(batchLimit)
      .lean();

    result.candidates = articles.length;

    for (const article of articles) {
      const markRaw = async (ingest_status: string, extra: Record<string, any> = {}) => {
        if (!article?._id) return;
        try {
          await this.newsArticleSourceModel.updateOne(
            { _id: article._id },
            { $set: { ingest_status, importedAt: new Date(), ...extra } },
          );
        } catch {
          /* non-fatal: raw marking is best-effort */
        }
      };
      try {
        const mapped = this.mapNewsArticleToNews(article);
        if (!mapped) {
          result.invalid++;
          result.failed++;
          this.logger.warn(`[NewsImport] Skipped invalid source article: ${this.describeSourceArticle(article)}`);
          await markRaw("invalid");
          continue;
        }

        const duplicateFilters = this.getDuplicateFilters(mapped);
        const existing = duplicateFilters.length
          ? await this.newsModel.exists({ $or: duplicateFilters })
          : null;

        if (existing) {
          result.duplicates++;
          await markRaw("imported");
          continue;
        }

        await this.newsModel.create(mapped);
        result.saved++;
        await markRaw("imported");
      } catch (error: any) {
        result.failed++;
        this.logger.error(
          `[NewsImport] Failed to import source article ${this.describeSourceArticle(article)}: ${error?.message || error}`,
          error?.stack,
        );
      }
    }

    this.logger.log(
      `[NewsImport] Batch finished: candidates=${result.candidates}, saved=${result.saved}, duplicates=${result.duplicates}, invalid=${result.invalid}, failed=${result.failed}`,
    );

    return result;
  }

  private mapNewsArticleToNews(article: any): Partial<News> | null {
    const title = this.cleanText(this.pickString(article?.title));
    const text = this.cleanText(
      this.pickString(article?.content, article?.summary, article?.description, article?.text),
    );

    if (!title || !text) {
      return null;
    }

    const tags = this.normalizeStringArray(article?.tags, article?.categories);
    const sourceUrl = this.normalizeUrl(this.pickString(article?.url, article?.link));
    const sourceName = this.cleanText(this.pickString(article?.source_name, article?.source));
    const externalId = this.pickString(article?.id);
    const sourceId = this.pickString(article?.source_id, article?.feedId);
    const sourceContentHash = this.pickString(article?.content_hash, article?.contentHash);
    const date = this.parseArticleDate(article);
    const contentHash = sourceContentHash || this.createFallbackContentHash({
      sourceName,
      sourceUrl,
      title,
      date,
    });

    return {
      title,
      text,
      date,
      type: tags[0] || "Crypto",
      image: this.normalizeUrl(this.pickString(article?.image_url, article?.image, article?.thumbnail)) || undefined,
      page: "crypto",
      sourceUrl: sourceUrl || undefined,
      externalId: externalId || undefined,
      sourceId: sourceId || undefined,
      sourceName: sourceName || undefined,
      contentHash,
      language: this.pickString(article?.language) || undefined,
      tags,
      actionType: "news",
      actionDate: new Date(),
      action: "imported_from_news_articles",
      status: "active",
      isAdminCreate: false,
      author: this.cleanText(this.pickString(article?.author)) || sourceName || "News",
      newsSection: "default",
      readTime: String(this.getReadTime(text)),
      isUserCreator: false,
    };
  }

  private getDuplicateFilters(news: Partial<News>): Record<string, any>[] {
    const filters: Record<string, any>[] = [];

    if (news.externalId) filters.push({ externalId: news.externalId });
    if (news.sourceUrl) filters.push({ sourceUrl: news.sourceUrl });
    if (news.contentHash) filters.push({ contentHash: news.contentHash });

    return filters;
  }

  private parseArticleDate(article: any): Date {
    const values = [
      article?.published_at,
      article?.pubDate,
      article?.created_at,
      article?.createdAt,
    ];

    for (const value of values) {
      const date = this.toValidDate(value);
      if (date) return date;
    }

    if (article?._id instanceof Types.ObjectId) {
      return article._id.getTimestamp();
    }

    return new Date();
  }

  private toValidDate(value: any): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private normalizeStringArray(...values: any[]): string[] {
    const items = values.flatMap((value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === "string") return value.split(",");
      return [];
    });

    return Array.from(new Set(
      items
        .map((item) => this.cleanText(this.pickString(item)))
        .filter(Boolean),
    ));
  }

  private pickString(...values: any[]): string {
    for (const value of values) {
      if (value === null || value === undefined) continue;

      if (typeof value === "string" || typeof value === "number") {
        const normalized = String(value).trim();
        if (normalized) return normalized;
      }

      if (typeof value === "object") {
        const nested = this.pickString(value.name, value.title, value.url);
        if (nested) return nested;
      }
    }

    return "";
  }

  private cleanText(value: string): string {
    if (!value) return "";

    return value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, "\"")
      .replace(/&#39;/gi, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  private normalizeUrl(value: string): string {
    const raw = this.pickString(value);
    if (!raw) return "";

    try {
      const parsed = new URL(raw);
      parsed.hash = "";
      for (const key of Array.from(parsed.searchParams.keys())) {
        if (/^(utm_|fbclid$|gclid$|yclid$|mc_cid$|mc_eid$)/i.test(key)) {
          parsed.searchParams.delete(key);
        }
      }
      return parsed.toString();
    } catch {
      return raw;
    }
  }

  private createFallbackContentHash(input: {
    sourceName?: string;
    sourceUrl?: string;
    title: string;
    date: Date;
  }): string {
    const stableValue = [
      input.sourceName || "",
      input.sourceUrl || "",
      input.title,
      input.date?.toISOString?.() || "",
    ].join("|").toLowerCase();

    return `fallback:${createHash("sha256").update(stableValue).digest("hex")}`;
  }

  private describeSourceArticle(article: any): string {
    return JSON.stringify({
      id: article?.id,
      url: article?.url || article?.link,
      title: article?.title,
    });
  }

  private async ensureNewsImportIndexes(): Promise<void> {
    await this.ensureUniquePartialIndex("externalId", "uniq_news_external_id");
    await this.ensureUniquePartialIndex("sourceUrl", "uniq_news_source_url");
  }

  private async ensureUniquePartialIndex(field: "externalId" | "sourceUrl", name: string): Promise<void> {
    const collection = this.newsModel.collection;
    const duplicates = await collection.aggregate([
      {
        $match: {
          [field]: { $exists: true, $type: "string", $ne: "" },
        },
      },
      {
        $group: {
          _id: `$${field}`,
          count: { $sum: 1 },
        },
      },
      { $match: { count: { $gt: 1 } } },
      { $limit: 5 },
    ]).toArray();

    if (duplicates.length) {
      this.logger.warn(
        `[NewsImport] Skip unique index ${name}: found duplicate ${field} values ${JSON.stringify(duplicates)}`,
      );
      return;
    }

    const indexes = await collection.indexes();
    const sameKeyIndex = indexes.find((index: any) => JSON.stringify(index.key) === JSON.stringify({ [field]: 1 }));

    if (sameKeyIndex?.unique) {
      return;
    }

    if (sameKeyIndex && !sameKeyIndex.unique) {
      this.logger.warn(
        `[NewsImport] Skip unique index ${name}: existing non-unique index ${sameKeyIndex.name} uses ${field}`,
      );
      return;
    }

    try {
      await collection.createIndex(
        { [field]: 1 },
        {
          name,
          unique: true,
          partialFilterExpression: {
            [field]: { $exists: true, $type: "string" },
          },
        },
      );
    } catch (error: any) {
      if (error?.code === 85 || error?.codeName === "IndexOptionsConflict") {
        this.logger.warn(`[NewsImport] Index ${name} already exists with different options/name`);
        return;
      }
      throw error;
    }
  }

  recommendationsToArray(recsId: string): Array<mongoose.Types.ObjectId> {
    return recsId.length
      ? recsId?.split(",")?.map((id: string) => new mongoose.Types.ObjectId(id))
      : [];
  }

  async getAllNews(page: string) {
    const news = await this.newsModel.find({ page });

    return news.reverse();
  }

  async getNews(
    page: string,
    limit: number = 10,
    offset: number = 0,
    userId?: string,
    query?: QueryNewsDto
  ): Promise<{ total: number; news: Array<News> }> {
    const matchStage = this.buildNewsMatchStage(page, userId, query);

    if (this.shouldUseBalancedCryptoNews(page, limit, offset, userId, query)) {
      return this.getBalancedCryptoNews(matchStage, limit);
    }

    const results: any = await this.newsModel.aggregate([
      {
        $match: matchStage,
      },
      {
        $lookup: {
          from: this.userModel.collection.name,
          localField: "creator",
          foreignField: "_id",
          as: "creator",
        },
      },
      {
        $sort: { date: -1 },
      },
      {
        $facet: {
          totalCount: [{ $count: "count" }],
          news: [{ $skip: offset }, { $limit: limit }],
        },
      },
    ]);

    const total = results[0]?.totalCount[0]?.count || 0;
    const news = results[0]?.news || [];

    return { total, news };
  }

  private shouldUseBalancedCryptoNews(
    page: string,
    limit: number,
    offset: number,
    userId?: string,
    query?: QueryNewsDto
  ): boolean {
    const hasExtendedFilters =
      Boolean(this.normalizeOptionalString(query?.search)) ||
      this.parseCategoryFilter(query?.category).length > 0 ||
      Boolean(query?.fromDate) ||
      Boolean(query?.toDate);

    return (
      page === "crypto" &&
      !userId &&
      offset === 0 &&
      limit > 0 &&
      (query?.section || "default") === "default" &&
      query?.creator !== "user" &&
      !hasExtendedFilters
    );
  }

  private buildNewsMatchStage(
    page: string,
    userId?: string,
    query?: QueryNewsDto
  ): Record<string, any> {
    const matchStage: Record<string, any> = {};
    const andConditions: Record<string, any>[] = [];
    const search = this.normalizeOptionalString(query?.search);
    const categories = this.parseCategoryFilter(query?.category);
    const fromDate = this.parseOptionalDate(query?.fromDate, "fromDate");
    const toDate = this.parseOptionalDate(query?.toDate, "toDate");

    if (page !== "all" && query?.section !== "fomo-update") {
      matchStage.page = page;
    }

    if (userId) {
      matchStage.creator = new mongoose.Types.ObjectId(userId);
    }

    if (!userId) {
      matchStage.status = "active";
    }

    if (query?.section) {
      matchStage.newsSection = query.section;
    }

    matchStage.isUserCreator = query?.creator === "user";

    if (search) {
      const searchRegex = new RegExp(this.escapeRegex(search), "i");
      andConditions.push({
        $or: [
          { title: searchRegex },
          { text: searchRegex },
          { author: searchRegex },
          { sourceName: searchRegex },
        ],
      });
    }

    if (categories.length) {
      const categoryRegexes = categories.map(
        (category) => new RegExp(`^${this.escapeRegex(category)}$`, "i")
      );

      andConditions.push({
        $or: [
          { type: { $in: categoryRegexes } },
          { tags: { $in: categoryRegexes } },
        ],
      });
    }

    if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {};

      if (fromDate) {
        const inclusiveStart = new Date(fromDate);
        inclusiveStart.setHours(0, 0, 0, 0);
        dateFilter.$gte = inclusiveStart;
      }

      if (toDate) {
        const inclusiveEnd = new Date(toDate);
        inclusiveEnd.setHours(23, 59, 59, 999);
        dateFilter.$lte = inclusiveEnd;
      }

      andConditions.push({ date: dateFilter });
    }

    if (andConditions.length) {
      matchStage.$and = andConditions;
    }

    return matchStage;
  }

  private async getBalancedCryptoNews(
    matchStage: Record<string, any>,
    limit: number
  ): Promise<{ total: number; news: Array<News> }> {
    const normalizedLimit = Math.max(limit || 24, 1);
    const total = await this.newsModel.countDocuments(matchStage);

    if (!total) {
      return { total, news: [] };
    }

    const latestNews = await this.newsModel
      .findOne(matchStage, { date: 1 })
      .sort({ date: -1, _id: -1 })
      .lean();

    if (!latestNews?.date) {
      return { total, news: [] };
    }

    const latestDayStart = this.getUtcDayStart(latestNews.date);
    const latestDayEnd = new Date(latestDayStart);
    latestDayEnd.setUTCDate(latestDayEnd.getUTCDate() + 1);

    const topLimit = Math.min(6, normalizedLimit);
    const selected: any[] = [];
    const selectedIds = new Set<string>();

    await this.appendCandidates(selected, selectedIds, topLimit, {
      ...matchStage,
      date: { $gte: latestDayStart, $lt: latestDayEnd },
      ...this.imageExistsMatch(),
    });

    if (selected.length < topLimit) {
      await this.appendCandidates(selected, selectedIds, topLimit - selected.length, {
        ...matchStage,
        date: { $gte: latestDayStart, $lt: latestDayEnd },
      });
    }

    if (selected.length < topLimit) {
      await this.appendCandidates(selected, selectedIds, topLimit - selected.length, {
        ...matchStage,
        date: { $lt: latestDayStart },
        ...this.imageExistsMatch(),
      });
    }

    const remainingLimit = normalizedLimit - selected.length;
    if (remainingLimit > 0) {
      const remainingCandidates = await this.newsModel
        .find({
          ...matchStage,
          _id: { $nin: Array.from(selectedIds).map((id) => new mongoose.Types.ObjectId(id)) },
        })
        .sort({ date: -1, _id: -1 })
        .limit(Math.max(remainingLimit * 12, 160))
        .lean();

      const balanced = this.pickRoundRobinByDay(remainingCandidates, remainingLimit, 7);
      for (const item of balanced) {
        const id = String(item._id);
        if (!selectedIds.has(id) && selected.length < normalizedLimit) {
          selected.push(item);
          selectedIds.add(id);
        }
      }
    }

    if (selected.length < normalizedLimit) {
      await this.appendCandidates(selected, selectedIds, normalizedLimit - selected.length, {
        ...matchStage,
      });
    }

    const news = await this.getNewsByIdsInOrder(selected.map((item) => item._id));
    return { total, news };
  }

  private async appendCandidates(
    selected: any[],
    selectedIds: Set<string>,
    limit: number,
    filter: Record<string, any>
  ): Promise<void> {
    if (limit <= 0) return;

    const excludeIds = Array.from(selectedIds).map((id) => new mongoose.Types.ObjectId(id));
    const docs = await this.newsModel
      .find({
        ...filter,
        ...(excludeIds.length ? { _id: { $nin: excludeIds } } : {}),
      })
      .sort({ date: -1, _id: -1 })
      .limit(limit)
      .lean();

    for (const doc of docs) {
      const id = String(doc._id);
      if (!selectedIds.has(id)) {
        selected.push(doc);
        selectedIds.add(id);
      }
    }
  }

  private pickRoundRobinByDay(candidates: any[], limit: number, maxDays?: number): any[] {
    const groupedByDay = new Map<string, any[]>();

    for (const item of candidates) {
      const day = this.getUtcDayKey(item.date);
      if (!groupedByDay.has(day)) groupedByDay.set(day, []);
      groupedByDay.get(day).push(item);
    }

    const days = Array.from(groupedByDay.keys()).sort().reverse().slice(0, maxDays);
    const result: any[] = [];

    while (result.length < limit && days.length) {
      let pickedInPass = false;

      for (const day of days) {
        const bucket = groupedByDay.get(day);
        const item = bucket?.shift();
        if (item) {
          result.push(item);
          pickedInPass = true;
          if (result.length >= limit) break;
        }
      }

      if (!pickedInPass) break;
    }

    return result;
  }

  private async getNewsByIdsInOrder(ids: mongoose.Types.ObjectId[]): Promise<Array<News>> {
    if (!ids.length) return [];

    const rows: any[] = await this.newsModel.aggregate([
      {
        $match: { _id: { $in: ids } },
      },
      {
        $lookup: {
          from: this.userModel.collection.name,
          localField: "creator",
          foreignField: "_id",
          as: "creator",
        },
      },
    ]);

    const byId = new Map(rows.map((item) => [String(item._id), item]));
    return ids.map((id) => byId.get(String(id))).filter(Boolean);
  }

  private imageExistsMatch(): Record<string, any> {
    return {
      image: { $exists: true, $type: "string", $regex: /\S/ },
    };
  }

  private getUtcDayStart(value: Date): Date {
    const date = new Date(value);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  }

  private getUtcDayKey(value: Date): string {
    return this.getUtcDayStart(value).toISOString().slice(0, 10);
  }

  private normalizeOptionalString(value?: string): string | undefined {
    const normalized = String(value || "").trim();
    return normalized ? normalized : undefined;
  }

  private parseCategoryFilter(value?: string): string[] {
    const normalized = this.normalizeOptionalString(value);

    if (!normalized) {
      return [];
    }

    return Array.from(
      new Set(
        normalized
          .split(",")
          .map((item) => item.trim().toLowerCase())
          .filter(Boolean)
      )
    );
  }

  private parseOptionalDate(value?: string, fieldName: string = "date"): Date | undefined {
    const normalized = this.normalizeOptionalString(value);

    if (!normalized) {
      return undefined;
    }

    const slashDateMatch = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const parsed = slashDateMatch
      ? new Date(
        Number(slashDateMatch[3]),
        Number(slashDateMatch[2]) - 1,
        Number(slashDateMatch[1])
      )
      : new Date(normalized);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid ${fieldName}: ${value}`);
    }

    return parsed;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async getNewsItem(id: string) {
    const newsItem = await this.newsModel.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
        },
      },
      {
        $lookup: {
          from: this.userModel.collection.name,
          localField: "creator",
          foreignField: "_id",
          as: "creator",
        },
      },
    ]);

    const recsId: Array<mongoose.Types.ObjectId> = newsItem[0].recommendations;

    const recommendations = await this.newsModel.find({ _id: recsId });

    return { ...newsItem[0], recommendationNewsItems: recommendations };
  }

  async createNews(createNewsDto: CreateNewsDto, initiator?: string) {
    const image = createNewsDto.image
      ? await this.filesService.writeFile(createNewsDto.image)
      : "";

    const recommendations: Array<mongoose.Types.ObjectId> =
      this.recommendationsToArray(createNewsDto.recommendations || "");

    const news: any = {
      ...createNewsDto,
      rejected: false,
      image: image,
      recommendations,
      isAdminCreate: !initiator,
      readTime: this.getReadTime(createNewsDto.text),
      newsSection: createNewsDto.newsSection || 'default'
    };

    if (initiator) news.creator = new mongoose.Types.ObjectId(initiator);

    const createdNews = await this.newsModel.create(news);

    if (initiator) {
      const action: AddActionDto = {
        user: new mongoose.Types.ObjectId(initiator),
        name: "Create news",
        type: `News publication on ${createNewsDto?.page || "crypto"} page`,
        value: { name: createNewsDto.title, img: image },
        date: new Date(),
        category: "news",
        status: "moderator",
        itemId: createdNews._id,
      };
      await this.userModel.findByIdAndUpdate(initiator, {
        $inc: { newsLimit: -1 },
      });
      await this.actionsService.addAction(action);
    }

    return createdNews;
  }

  async createNewsByModerator(createNewsDto: CreateNewsDto, initiator: string) {
    const image = await this.filesService.writeFile(createNewsDto.image);

    const recommendations: Array<mongoose.Types.ObjectId> =
      this.recommendationsToArray(createNewsDto.recommendations);

    const news: any = {
      ...createNewsDto,
      rejected: false,
      image: image,
      actionInitiator: initiator,
      recommendations,
      creator: initiator,
      readTime: this.getReadTime(createNewsDto.text),
      newsSection: createNewsDto.newsSection || 'default'
    };

    const createdNews = await this.newsModel.create(news);

    const action: AddActionDto = {
      user: new mongoose.Types.ObjectId(initiator),
      name: "Create news",
      type: `News publication on ${createNewsDto?.page || "crypto"} page`,
      value: { name: createNewsDto.title, img: image },
      date: new Date(),
      category: "news",
      status: "admin",
      itemId: createdNews._id,
    };

    await this.actionsService.addAction(action);

    return createdNews;
  }

  async updateNews(id: string, updateNewsDto: UpdateNewsDto) {
    const recommendations: Array<mongoose.Types.ObjectId> =
      this.recommendationsToArray(updateNewsDto.recommendations);

    if (typeof updateNewsDto.image !== "string") {
      const image = await this.filesService.writeFile(updateNewsDto.image);
      return await this.newsModel.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            ...updateNewsDto, image: image, recommendations,
            readTime: this.getReadTime(updateNewsDto.text)
          }
        }
      );
    }
    return await this.newsModel.findOneAndUpdate(
      { _id: id },
      { $set: { ...updateNewsDto, recommendations } }
    );
  }

  async deleteModeratorUnconfirmedNews(id: string) {
    return await this.newsModel.findOneAndDelete({ _id: id });
  }

  async deleteAdminUnconfirmedNews(id: string) {
    return await this.newsModel.findOneAndDelete({ _id: id });
  }

  async deleteNews(id: string) {
    return await this.newsModel.findOneAndDelete({ _id: id });
  }

  async addLike(newsId: string, userId: string): Promise<News> {
    const news = await this.newsModel.findById(newsId).exec();

    if (news.likes.includes(new mongoose.Types.ObjectId(userId))) {
      return this.newsModel
        .findByIdAndUpdate(newsId, { $pull: { likes: userId } }, { new: true })
        .exec();
    }

    return this.newsModel
      .findByIdAndUpdate(
        newsId,
        {
          $addToSet: { likes: userId },
          $pull: { dislikes: userId },
        },
        { new: true }
      )
      .exec();
  }

  async addDislike(newsId: string, userId: string): Promise<News> {
    const news = await this.newsModel.findById(newsId).exec();

    if (news.dislikes.includes(new mongoose.Types.ObjectId(userId))) {
      return this.newsModel
        .findByIdAndUpdate(
          newsId,
          { $pull: { dislikes: userId } },
          { new: true }
        )
        .exec();
    }

    return this.newsModel
      .findByIdAndUpdate(
        newsId,
        {
          $addToSet: { dislikes: userId },
          $pull: { likes: userId },
        },
        { new: true }
      )
      .exec();
  }

  async addView(newsId: string, wallet: string): Promise<News> {
    const userId: string = await this.userModel.findOne({ wallet })

    if (!userId) throw new HttpException('User not found', HttpStatus.BAD_REQUEST)

    return this.newsModel.findByIdAndUpdate(
      newsId,
      { $addToSet: { views: new mongoose.Types.ObjectId(userId) } },
      { new: true }
    );
  }

  async getFomoUpdates(): Promise<Array<{ _id: string; page: string, date: Date, title: string }>> {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - 30);

    return this.newsModel.find(
      {
        newsSection: "fomo-update",
        date: { $gte: dateLimit }
      },
      { _id: 1, page: 1, date: 1, title: 1 }
    ).lean();
  }
}
