import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { Model } from 'mongoose';
import { IntelSyncWorkerRunnerService } from 'src/intel-sync/intel-sync-worker-runner.service';
import {
  IntelSyncTrigger,
  IntelSyncWorkerLaunchResult,
} from 'src/intel-sync/intel-sync.types';
import { CryptoLinkingPublicService } from 'src/crypto-linking/services/crypto-linking-public.service';
import { Project, ProjectDocument } from 'src/projects/project.model';
import {
  FundingRound,
  FundingRoundDocument,
} from './models/funding-round.model';
import { hasFundingRoundToken } from './funding-round-token.util';

type FundingInvestor = FundingRound['investors'][number];

interface FundingRoundsIntelSyncOptions {
  force?: boolean;
}

interface IntelFundraisingApiRound {
  key?: string;
  source?: string;
  round_id?: string;
  coin_slug?: string;
  project_slug?: string;
  slug?: string;
  project_key?: string;
  project?: string;
  project_name?: string;
  name?: string;
  symbol?: string;
  image?: string;
  logo?: string;
  round?: string;
  stage?: string;
  round_type?: string;
  category?: string;
  date?: string | number | Date;
  amount?: number | string;
  raised?: number | string;
  valuation?: number | string;
  investors?: any[];
  lead_investors?: any[];
  leadInvestors?: any[];
  lead_investor?: string;
  updated_at?: Date | string;
  updatedAt?: Date | string;
  createdAt?: Date | string;
}

interface FundraisingApiListResponse {
  ok?: boolean;
  count?: number;
  total?: number;
  offset?: number;
  limit?: number;
  data?: IntelFundraisingApiRound[];
  _meta?: Record<string, any>;
}

@Injectable()
export class FundingRoundsIntelSyncService implements OnModuleInit {
  private readonly logger = new Logger(FundingRoundsIntelSyncService.name);
  private readonly batchSize: number;
  private readonly apiPageSize: number;
  private readonly apiTimeoutMs: number;
  private readonly deltaSyncEnabled: boolean;
  private syncInProgress = false;

  constructor(
    @InjectModel(FundingRound.name)
    private readonly fundingRoundModel: Model<FundingRoundDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly configService: ConfigService,
    private readonly intelSyncWorkerRunnerService: IntelSyncWorkerRunnerService,
    private readonly cryptoLinkingPublicService: CryptoLinkingPublicService,
  ) {
    this.batchSize = Math.max(
      50,
      Number(this.configService.get('FUNDING_ROUNDS_SYNC_BATCH_SIZE') || 500),
    );
    this.apiPageSize = Math.min(
      500,
      Math.max(
        50,
        Number(this.configService.get('FUNDING_ROUNDS_INTEL_API_LIMIT') || 500),
      ),
    );
    this.apiTimeoutMs = Math.max(
      1000,
      Number(
        this.configService.get('FUNDING_ROUNDS_INTEL_API_TIMEOUT_MS') || 30000,
      ),
    );
    this.deltaSyncEnabled =
      String(
        this.configService.get('FUNDING_ROUNDS_INTEL_DELTA_SYNC_ENABLED') ??
          'true',
      ).toLowerCase() === 'true';
  }

  onModuleInit() {
    if (this.isWorkerProcess()) {
      return;
    }

    if (!this.isStartupSyncEnabled()) {
      this.logger.log('Startup sync for funding rounds is disabled');
      return;
    }

    setTimeout(() => {
      void this.syncFromIntelFundraising('startup');
    }, 0);
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async syncFromIntelFundraisingCron(): Promise<void> {
    await this.syncFromIntelFundraising('cron');
  }

  async syncFromIntelFundraising(
    trigger: IntelSyncTrigger,
    options: FundingRoundsIntelSyncOptions = {},
  ): Promise<
    | IntelSyncWorkerLaunchResult
    | { trigger: string; skipped: boolean; processed: number; written: number }
  > {
    if (!options.force && !this.isSyncEnabled()) {
      this.logger.log(`Intel funding sync skipped for ${trigger}: disabled`);
      return { trigger, skipped: true, processed: 0, written: 0 };
    }

    if (!this.isWorkerProcess() && !options.force) {
      return this.intelSyncWorkerRunnerService.runJob(
        'funding-rounds-intel-fundraising',
        trigger,
      );
    }

    return this.executeSyncFromIntelFundraising(trigger, options);
  }

  async executeSyncFromIntelFundraising(
    trigger: IntelSyncTrigger,
    options: FundingRoundsIntelSyncOptions = {},
  ) {
    if (!options.force && !this.isSyncEnabled()) {
      this.logger.log(`Intel funding sync skipped for ${trigger}: disabled`);
      return { trigger, skipped: true, processed: 0, written: 0 };
    }

    if (this.syncInProgress) {
      this.logger.warn(
        `Intel funding sync skipped for ${trigger}: previous sync is still running`,
      );
      return { trigger, skipped: true, processed: 0, written: 0 };
    }

    this.syncInProgress = true;

    try {
      const updatedAfter = await this.resolveSourceWatermark();
      this.logger.log(
        `Starting intel funding sync (${trigger}) from ${this.getApiUrl()}${
          updatedAfter ? ` updated_after=${updatedAfter.toISOString()}` : ' full bootstrap'
        }`,
      );

      let processed = 0;
      let written = 0;
      let fetched = 0;
      let operations: any[] = [];
      let offset = 0;
      let total = Number.MAX_SAFE_INTEGER;
      let maxSourceUpdatedAt: Date | null = null;
      const touchedCoinSlugs = new Set<string>();

      while (offset < total) {
        const page = await this.fetchFundingRoundsPage(offset, updatedAfter);
        const sourceRounds = Array.isArray(page.data) ? page.data : [];
        const reportedTotal = Number(page.total ?? page.count ?? sourceRounds.length);
        total =
          Number.isFinite(reportedTotal) && reportedTotal > 0
            ? reportedTotal
            : sourceRounds.length;
        fetched += sourceRounds.length;

        if (!sourceRounds.length) {
          if (!processed) {
            this.logger.warn(
              `Intel funding sync skipped for ${trigger}: API returned no funding rounds`,
            );
          }
          break;
        }

        for (const sourceRound of sourceRounds) {
          maxSourceUpdatedAt = this.pickMaxDate(
            maxSourceUpdatedAt,
            this.resolveSourceUpdatedAt(sourceRound),
          );
          const normalizedRound = this.transformIntelRound(sourceRound);
          if (!normalizedRound) {
            continue;
          }

          const linkedRound = await this.cryptoLinkingPublicService.enrichFundingRound(normalizedRound);
          const linkedProject = await this.resolveTokenProject(linkedRound);
          const hasToken = hasFundingRoundToken(linkedProject, {
            ...linkedRound,
            type: linkedRound.stage,
          });

          touchedCoinSlugs.add(linkedRound.coinSlug);
          operations.push({
            updateOne: {
              filter: this.buildUpsertFilter(linkedRound),
              update: { $set: { ...linkedRound, hasToken } },
              upsert: true,
            },
          });
          processed += 1;

          if (operations.length >= this.batchSize) {
            await this.fundingRoundModel.bulkWrite(operations, { ordered: false });
            written += operations.length;
            operations = [];
          }
        }

        offset += sourceRounds.length;
      }

      if (operations.length) {
        await this.fundingRoundModel.bulkWrite(operations, { ordered: false });
        written += operations.length;
      }

      await this.refreshProjectFundingState(Array.from(touchedCoinSlugs));
      await this.updateSyncState(maxSourceUpdatedAt, {
        trigger,
        fetched,
        processed,
        written,
        delta: Boolean(updatedAfter),
        updatedAfter: updatedAfter?.toISOString() || null,
      });

      this.logger.log(
        `Intel funding sync finished (${trigger}), fetched: ${fetched}, processed: ${processed}, written: ${written}`,
      );

      return { trigger, skipped: false, processed, written };
    } catch (error) {
      this.logger.error(
        `Intel funding sync failed during ${trigger}: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async fetchFundingRoundsPage(
    offset: number,
    updatedAfter?: Date | null,
  ): Promise<FundraisingApiListResponse> {
    const response = await axios.get<FundraisingApiListResponse>(this.getApiUrl(), {
      params: {
        limit: this.apiPageSize,
        offset,
        ...(updatedAfter ? { updated_after: updatedAfter.toISOString() } : {}),
      },
      timeout: this.apiTimeoutMs,
    });

    return response.data || {};
  }

  private async resolveSourceWatermark(): Promise<Date | null> {
    if (!this.deltaSyncEnabled) {
      return null;
    }

    const state = await this.syncStateCollection().findOne({
      job: 'funding-rounds-intel-fundraising',
    });

    const watermark = this.parseOptionalDate(state?.sourceWatermarkAt);
    if (watermark) {
      return watermark;
    }

    this.logger.log(
      'Intel funding delta watermark is not initialized; next run will bootstrap from full source response',
    );
    return null;
  }

  private async updateSyncState(
    sourceWatermarkAt: Date | null,
    meta: Record<string, any>,
  ): Promise<void> {
    if (!this.deltaSyncEnabled) {
      return;
    }

    const collection = this.syncStateCollection();
    const current = await collection.findOne({
      job: 'funding-rounds-intel-fundraising',
    });
    const nextWatermark = this.pickMaxDate(
      this.parseOptionalDate(current?.sourceWatermarkAt),
      sourceWatermarkAt,
    );
    const now = new Date();

    await collection.updateOne(
      { job: 'funding-rounds-intel-fundraising' },
      {
        $set: {
          job: 'funding-rounds-intel-fundraising',
          source: 'intel_fundraising',
          lastCheckedAt: now,
          lastSuccessAt: now,
          lastRunMeta: meta,
          ...(nextWatermark
            ? {
                sourceWatermarkAt: nextWatermark,
                sourceWatermarkIso: nextWatermark.toISOString(),
              }
            : {}),
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );
  }

  private syncStateCollection() {
    return this.fundingRoundModel.db.collection('intel_sync_state');
  }

  private async resolveTokenProject(round: Partial<FundingRound>): Promise<any | null> {
    const projectId = round.projectId?.toString();
    if (projectId) {
      const project = await this.projectModel.findById(projectId).lean();
      if (project) {
        return project;
      }
    }

    if (round.coinSlug) {
      return this.projectModel
        .findOne({
          $or: [
            { slug: round.coinSlug },
            { sourceId: round.coinSlug },
            { 'rawIcoData.slug': round.coinSlug },
            { 'rawIcoData.sourceId': round.coinSlug },
          ],
        })
        .lean();
    }

    return null;
  }

  private async refreshProjectFundingState(coinSlugs: string[]): Promise<void> {
    const uniqueCoinSlugs = Array.from(
      new Set(
        coinSlugs
          .map((coinSlug) => this.toNonEmptyString(coinSlug))
          .filter((coinSlug): coinSlug is string => Boolean(coinSlug)),
      ),
    );

    if (!uniqueCoinSlugs.length) {
      return;
    }

    const summaries = await this.fundingRoundModel.aggregate<{
      _id: string;
      lastFunding: Date;
      totalRaised: number;
    }>([
      {
        $match: {
          coinSlug: { $in: uniqueCoinSlugs },
        },
      },
      {
        $group: {
          _id: '$coinSlug',
          lastFunding: { $max: '$date' },
          totalRaised: { $sum: '$fundsRaised' },
        },
      },
    ]);

    if (!summaries.length) {
      return;
    }

    const operations = summaries.map((summary) => ({
      updateOne: {
        filter: { slug: summary._id },
        update: {
          $set: {
            lastFunding: summary.lastFunding,
            totalRaised: summary.totalRaised,
            fundsRaised: summary.totalRaised,
          },
        },
      },
    }));

    const result = await this.projectModel.bulkWrite(operations, { ordered: false });

    this.logger.log(
      `Refreshed funding stats for ${result.matchedCount || 0} projects after intel sync`,
    );
  }

  private buildUpsertFilter(round: Partial<FundingRound> & { sourceKey: string }) {
    const orFilters: Record<string, unknown>[] = [{ sourceKey: round.sourceKey }];

    if (round.roundId) {
      orFilters.push({
        roundId: round.roundId,
        coinSlug: round.coinSlug,
      });
    }

    orFilters.push({
      coinSlug: round.coinSlug,
      stage: round.stage,
      date: round.date,
      fundsRaised: round.fundsRaised,
    });

    return { $or: orFilters };
  }

  private transformIntelRound(
    sourceRound: IntelFundraisingApiRound,
  ): (Partial<FundingRound> & { sourceKey: string }) | null {
    const sourceKey = this.resolveSourceKey(sourceRound);
    const projectName =
      this.toNonEmptyString(sourceRound.name) ||
      this.toNonEmptyString(sourceRound.project_name) ||
      this.toNonEmptyString(sourceRound.project) ||
      this.toNonEmptyString(sourceRound.symbol) ||
      'Unknown Project';
    const coinSlug = this.resolveCoinSlug(sourceRound, projectName);
    const normalizedInvestors = this.normalizeInvestors(
      sourceRound.investors,
      sourceRound.lead_investors ||
      sourceRound.leadInvestors ||
      sourceRound.lead_investor,
    );
    const leadInvestors = normalizedInvestors.filter((investor) => investor.lead);
    const roundId = this.toNonEmptyString(sourceRound.round_id);
    const date = this.parseDate(sourceRound.date, sourceRound.updated_at);
    const sourceUpdatedAt = this.resolveSourceUpdatedAt(sourceRound);
    const now = new Date();

    const transformedRound: Partial<FundingRound> & { sourceKey: string } = {
      id: this.hashToNegativeNumber(sourceKey),
      sourceKey,
      source: this.toNonEmptyString(sourceRound.source) || 'intel_fundraising',
      sourceUpdatedAt: sourceUpdatedAt || undefined,
      lastParsedAt: sourceUpdatedAt || now,
      intelSyncMeta: {
        syncedAt: now,
        sourceApiUrl: this.getApiUrl(),
        lastSourceUpdatedAt: sourceUpdatedAt?.toISOString() || null,
      },
      roundId,
      projectName,
      coinSlug,
      coinSymbol: (this.toNonEmptyString(sourceRound.symbol) || '').toUpperCase(),
      fundsRaised: this.toNumber(sourceRound.amount ?? sourceRound.raised),
      preValuation: this.toNumber(sourceRound.valuation),
      preValuationInaccurate: false,
      stage:
        this.toNonEmptyString(sourceRound.round) ||
        this.toNonEmptyString(sourceRound.round_type) ||
        this.toNonEmptyString(sourceRound.stage) ||
        'unknown',
      category: this.toNonEmptyString(sourceRound.category) || 'unknown',
      date,
      investors: normalizedInvestors,
      leadInvestors,
      twitterPerformance: 0,
      tokenForSale: null,
      tokenPrice: null,
      totalSupplyPercent: 0,
      platform: null,
      roiUsd: null,
      distributionType: null,
      details: [],
      trading: false,
      tags: [],
      image:
        this.toNonEmptyString(sourceRound.image) ||
        this.toNonEmptyString(sourceRound.logo) ||
        '',
      saleId: this.hashToNegativeNumber(`${sourceKey}:sale`),
    };

    if (!this.hasRequiredRoundFields(transformedRound)) {
      return null;
    }

    return transformedRound;
  }

  private hasRequiredRoundFields(round: {
    image?: unknown;
    category?: unknown;
    stage?: unknown;
  }): boolean {
    const image = typeof round.image === 'string' ? round.image.trim() : '';
    const category = typeof round.category === 'string' ? round.category.trim() : '';
    const stage = typeof round.stage === 'string' ? round.stage.trim() : '';

    return Boolean(image && category && stage && category !== 'unknown' && stage !== 'unknown');
  }

  private normalizeInvestors(rawInvestors: unknown, rawLeadInvestors: unknown): FundingInvestor[] {
    const investors = Array.isArray(rawInvestors) ? rawInvestors : [];
    const rawLeads = Array.isArray(rawLeadInvestors)
      ? rawLeadInvestors
      : rawLeadInvestors
        ? [rawLeadInvestors]
        : [];
    const leadSet = new Set(
      rawLeads
        .map((lead) => this.extractInvestorIdentity(lead))
        .filter(Boolean)
        .map((lead) => lead.toLowerCase()),
    );

    return investors
      .map((investor, index) => this.normalizeInvestor(investor, leadSet, index))
      .filter((investor): investor is FundingInvestor => Boolean(investor));
  }

  private normalizeInvestor(
    rawInvestor: unknown,
    leadSet: Set<string>,
    index: number,
  ): FundingInvestor | null {
    const identity = this.extractInvestorIdentity(rawInvestor);
    if (!identity) {
      return null;
    }

    const investor =
      typeof rawInvestor === 'string'
        ? { name: rawInvestor }
        : (rawInvestor as Record<string, any>);
    const slugSource =
      this.toNonEmptyString(investor.slug) ||
      this.toNonEmptyString(investor.investorSlug) ||
      identity;
    const investorSlug = this.slugify(slugSource) || `investor-${index + 1}`;
    const lead =
      Boolean(investor.lead) ||
      leadSet.has(identity.toLowerCase()) ||
      leadSet.has(investorSlug.toLowerCase());

    return {
      id: Math.abs(this.hashToNegativeNumber(`${investorSlug}:${identity}`)),
      name: identity,
      investorSlug,
      ventureType:
        this.toNonEmptyString(investor.type) ||
        this.toNonEmptyString(investor.ventureType) ||
        '',
      tier: this.toNonEmptyString(investor.tier) || '',
      image: this.toNonEmptyString(investor.image) || '',
      lead,
    };
  }

  private extractInvestorIdentity(rawInvestor: unknown): string | null {
    if (typeof rawInvestor === 'string') {
      return this.toNonEmptyString(rawInvestor);
    }

    if (!rawInvestor || typeof rawInvestor !== 'object') {
      return null;
    }

    const investor = rawInvestor as Record<string, any>;
    return (
      this.toNonEmptyString(investor.name) ||
      this.toNonEmptyString(investor.title) ||
      this.toNonEmptyString(investor.slug) ||
      this.toNonEmptyString(investor.investorSlug) ||
      null
    );
  }

  private resolveSourceKey(sourceRound: IntelFundraisingApiRound): string {
    return (
      this.toNonEmptyString(sourceRound.key) ||
      this.toNonEmptyString(sourceRound.round_id) ||
      [
        this.resolveCoinSlug(
          sourceRound,
          sourceRound.name || sourceRound.project || 'unknown',
        ),
        this.toNonEmptyString(sourceRound.round) ||
        this.toNonEmptyString(sourceRound.round_type) ||
        this.toNonEmptyString(sourceRound.stage) ||
        'unknown',
        this.stringifyKeyPart(sourceRound.date) || 'nodate',
        this.toNumber(sourceRound.amount ?? sourceRound.raised),
      ].join(':')
    );
  }

  private resolveCoinSlug(
    sourceRound: IntelFundraisingApiRound,
    fallbackName?: string,
  ): string {
    const rawSlug =
      this.toNonEmptyString(sourceRound.coin_slug) ||
      this.toNonEmptyString(sourceRound.project_slug) ||
      this.toNonEmptyString(sourceRound.slug) ||
      this.toNonEmptyString(sourceRound.project_key) ||
      this.toNonEmptyString(sourceRound.project) ||
      this.toNonEmptyString(sourceRound.project_name) ||
      this.toNonEmptyString(sourceRound.name) ||
      this.toNonEmptyString(sourceRound.symbol) ||
      fallbackName ||
      'unknown-project';

    return this.slugify(rawSlug) || 'unknown-project';
  }

  private resolveSourceUpdatedAt(sourceRound: IntelFundraisingApiRound): Date | null {
    return this.parseOptionalDate(
      sourceRound.updated_at ||
        sourceRound.updatedAt ||
        sourceRound.createdAt ||
        null,
    );
  }

  private parseOptionalDate(value: unknown): Date | null {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      const normalized = value > 1_000_000_000_000 ? value : value * 1000;
      const parsed = new Date(normalized);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return null;
      }

      const parsed = new Date(trimmed);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  private pickMaxDate(left: Date | null, right: Date | null): Date | null {
    if (!left) {
      return right;
    }

    if (!right) {
      return left;
    }

    return right.getTime() > left.getTime() ? right : left;
  }

  private parseDate(rawDate: unknown, fallbackDate?: unknown): Date {
    if (rawDate instanceof Date && !Number.isNaN(rawDate.getTime())) {
      return rawDate;
    }

    if (typeof rawDate === 'number' && Number.isFinite(rawDate)) {
      const normalized = rawDate > 1_000_000_000_000 ? rawDate : rawDate * 1000;
      const parsed = new Date(normalized);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }

    if (typeof rawDate === 'string') {
      const trimmed = rawDate.trim();
      if (trimmed) {
        const numericDate = Number(trimmed);
        if (Number.isFinite(numericDate)) {
          return this.parseDate(numericDate, fallbackDate);
        }

        const parsed = new Date(trimmed);
        if (!Number.isNaN(parsed.getTime())) {
          return parsed;
        }
      }
    }

    if (fallbackDate instanceof Date && !Number.isNaN(fallbackDate.getTime())) {
      return fallbackDate;
    }

    if (typeof fallbackDate === 'string' || typeof fallbackDate === 'number') {
      return this.parseDate(fallbackDate);
    }

    return new Date(0);
  }

  private hashToNegativeNumber(value: string): number {
    let hash = 0;

    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 31 + value.charCodeAt(i)) | 0;
    }

    const normalized = Math.abs(hash) || 1;
    return normalized * -1;
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = Number(value.replace(/[^0-9.-]+/g, ''));
      return Number.isFinite(normalized) ? normalized : 0;
    }

    return 0;
  }

  private toNonEmptyString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  private stringifyKeyPart(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString();
    }

    if (typeof value === 'string') {
      return this.toNonEmptyString(value);
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }

    return null;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private isSyncEnabled(): boolean {
    return String(
      this.configService.get('FUNDING_ROUNDS_INTEL_SYNC_ENABLED') ?? 'false',
    ).toLowerCase() === 'true';
  }

  private isWorkerProcess(): boolean {
    return process.env.INTEL_SYNC_WORKER_PROCESS === 'true';
  }

  private isStartupSyncEnabled(): boolean {
    return String(
      this.configService.get('FUNDING_ROUNDS_INTEL_SYNC_ON_STARTUP') ?? 'false',
    ).toLowerCase() === 'true';
  }

  private getApiUrl(): string {
    const explicitUrl = this.configService.get<string>('FUNDING_ROUNDS_INTEL_API_URL');
    if (explicitUrl) {
      return explicitUrl;
    }

    const baseUrl = this.configService.get<string>('INTEL_API_BASE_URL');
    if (baseUrl) {
      return this.buildIntelApiUrl(baseUrl, '/intel/fundraising');
    }

    return 'http://localhost:8001/api/intel/fundraising';
  }

  private buildIntelApiUrl(baseUrl: string, path: string): string {
    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    if (normalizedBaseUrl.endsWith('/api')) {
      return `${normalizedBaseUrl}${normalizedPath}`;
    }

    return `${normalizedBaseUrl}/api${normalizedPath}`;
  }
}
