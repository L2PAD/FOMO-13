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
import { RatingService } from 'src/rating/rating.service';
import { Project, ProjectDocument } from './project.model';

interface IcoDropsProject {
  source?: string;
  sourceId?: string;
  name?: string;
  slug?: string;
  symbol?: string;
  ticker?: string;
  logo?: string;
  shortDescription?: string;
  fullDescription?: string;
  status?: string;
  type?: string;
  categories?: string[];
  ecosystems?: string[];
  launchpads?: string[];
  tags?: string[];
  detailUrl?: string;
  sourceUrl?: string;
  dates?: Record<string, any>;
  saleRounds?: any[];
  fundraising?: Record<string, any>;
  tokenomics?: Record<string, any>;
  vesting?: Record<string, any>;
  marketData?: Record<string, any>;
  links?: Record<string, any>;
  screenshots?: any[];
  team?: any[];
  investors?: any[];
  social?: Record<string, any>;
  firstSeenAt?: string | Date;
  lastSeenAt?: string | Date;
  lastParsedAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: any;
}

interface IcoProjectsApiResponse {
  total?: number;
  offset?: number;
  limit?: number;
  sort?: string;
  items?: IcoDropsProject[];
}

interface ProjectsIntelIcosSyncRunOptions {
  force?: boolean;
}

@Injectable()
export class ProjectsIntelIcosSyncService implements OnModuleInit {
  private readonly logger = new Logger(ProjectsIntelIcosSyncService.name);
  private readonly batchSize: number;
  private readonly apiPageSize: number;
  private readonly apiTimeoutMs: number;
  private syncInProgress = false;

  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    private readonly configService: ConfigService,
    private readonly intelSyncWorkerRunnerService: IntelSyncWorkerRunnerService,
    private readonly ratingService: RatingService,
  ) {
    this.batchSize = Math.max(
      50,
      Number(this.configService.get('PROJECTS_INTEL_ICO_SYNC_BATCH_SIZE') || 250),
    );
    this.apiPageSize = Math.min(
      500,
      Math.max(
        50,
        Number(this.configService.get('PROJECTS_INTEL_ICO_API_LIMIT') || 200),
      ),
    );
    this.apiTimeoutMs = Math.max(
      1000,
      Number(
        this.configService.get('PROJECTS_INTEL_ICO_API_TIMEOUT_MS') || 30000,
      ),
    );
  }

  onModuleInit() {
    if (this.isWorkerProcess()) {
      return;
    }

    if (!this.isStartupSyncEnabled()) {
      this.logger.log('Startup sync for intel ICO projects is disabled');
      return;
    }

    setTimeout(() => {
      void this.syncProjectsFromIntelIcos('startup');
    }, 0);
  }

  async syncProjectsFromIntelIcos(
    trigger: IntelSyncTrigger,
    options: ProjectsIntelIcosSyncRunOptions = {},
  ): Promise<
    | IntelSyncWorkerLaunchResult
    | { trigger: string; skipped: boolean; processed: number; written: number }
  > {
    if (!options.force && !this.isSyncEnabled()) {
      this.logger.log(`Intel ICO project sync skipped for ${trigger}: disabled`);
      return { trigger, skipped: true, processed: 0, written: 0 };
    }

    if (!this.isWorkerProcess() && !options.force) {
      return this.intelSyncWorkerRunnerService.runJob(
        'projects-intel-icos',
        trigger,
      );
    }

    return this.executeSyncProjectsFromIntelIcos(trigger, options);
  }

  async executeSyncProjectsFromIntelIcos(
    trigger: IntelSyncTrigger,
    options: ProjectsIntelIcosSyncRunOptions = {},
  ): Promise<{ trigger: string; skipped: boolean; processed: number; written: number }> {
    if (!options.force && !this.isSyncEnabled()) {
      this.logger.log(`Intel ICO project sync skipped for ${trigger}: disabled`);
      return { trigger, skipped: true, processed: 0, written: 0 };
    }

    if (this.syncInProgress) {
      this.logger.warn(
        `Intel ICO project sync skipped for ${trigger}: previous sync is still running`,
      );
      return { trigger, skipped: true, processed: 0, written: 0 };
    }

    this.syncInProgress = true;

    try {
      this.logger.log(
        `Starting intel ICO project sync (${trigger}) from ${this.getApiUrl()}`,
      );

      let processed = 0;
      let written = 0;
      let offset = 0;
      let total = Number.MAX_SAFE_INTEGER;
      let operations: any[] = [];
      const scoringExamples: Array<{
        name: string;
        rating: string | number;
        fullness: string;
        penalties: string;
      }> = [];

      while (offset < total) {
        const response = await this.fetchProjectsPage(offset);
        const sourceProjects = Array.isArray(response.items) ? response.items : [];
        const responseTotal = Number(response.total);
        total = Number.isFinite(responseTotal)
          ? responseTotal
          : offset + sourceProjects.length;

        if (!sourceProjects.length) {
          if (!processed) {
            this.logger.warn(
              `Intel ICO project sync skipped for ${trigger}: API returned no ICO projects`,
            );
          }
          break;
        }

        for (const sourceProject of sourceProjects) {
          const normalizedProject = this.transformIntelIcoProject(sourceProject);
          if (!normalizedProject) {
            continue;
          }

          const filter = this.buildUpsertFilter(normalizedProject);
          if (!filter) {
            this.logger.warn(
              `Skipping ICO project without source key: ${sourceProject.name || sourceProject.slug || 'unknown'}`,
            );
            continue;
          }

          if (scoringExamples.length < 3) {
            const scoring = (normalizedProject.rawIcoData as any)?.scoring;
            const topPenalties =
              scoring?.ratingBreakdown?.penalties
                ?.slice(0, 3)
                .map((penalty) => `${penalty.key}:${penalty.value}`)
                .join(', ') || 'none';

            scoringExamples.push({
              name: normalizedProject.name || sourceProject.name || sourceProject.slug || 'unknown',
              rating: normalizedProject.rating || 'n/a',
              fullness: normalizedProject.fullness || 'n/a',
              penalties: topPenalties,
            });
          }

          const {
            sections: _sections,
            isSponsored: _isSponsored,
            isEralash: _isEralash,
            comments: _comments,
            investors: _investors,
            team: _team,
            advisors: _advisors,
            partners: _partners,
            comparison: _comparison,
            ...projectSet
          } = normalizedProject as any;
          operations.push({
            updateOne: {
              filter,
              update: {
                $set: projectSet,
                $addToSet: {
                  sections: 'funding-feed',
                },
                $setOnInsert: {
                  createdAt: new Date(),
                  actionDate: new Date(),
                  isSponsored: false,
                  isEralash: false,
                  comments: [],
                  investors: [],
                  team: [],
                  advisors: [],
                  partners: [],
                  comparison: [],
                },
              },
              upsert: true,
            },
          });
          processed += 1;

          if (operations.length >= this.batchSize) {
            await this.projectModel.bulkWrite(operations, { ordered: false });
            written += operations.length;
            operations = [];
          }
        }

        offset += sourceProjects.length;

        if (sourceProjects.length < this.apiPageSize) {
          break;
        }
      }

      if (operations.length) {
        await this.projectModel.bulkWrite(operations, { ordered: false });
        written += operations.length;
      }

      this.logger.log(
        `Intel ICO project sync finished (${trigger}), processed: ${processed}, written: ${written}`,
      );

      for (const example of scoringExamples) {
        this.logger.log(
          `ICO scoring sample: project=${example.name}, rating=${example.rating}, fullness=${example.fullness}, topPenalties=${example.penalties}`,
        );
      }

      return { trigger, skipped: false, processed, written };
    } catch (error) {
      this.logger.error(
        `Intel ICO project sync failed during ${trigger}: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async fetchProjectsPage(offset: number): Promise<IcoProjectsApiResponse> {
    const response = await axios.get<IcoProjectsApiResponse>(this.getApiUrl(), {
      params: {
        limit: this.apiPageSize,
        offset,
        sort: '-lastParsedAt',
      },
      timeout: this.apiTimeoutMs,
    });

    return response.data || {};
  }

  private buildUpsertFilter(project: Partial<Project>): Record<string, any> | null {
    const source = this.toNonEmptyString(project.source) || 'icodrops';
    const sourceId = this.toNonEmptyString(project.sourceId);
    const detailUrl = this.toNonEmptyString(project.detailUrl);

    if (sourceId) {
      return { source, sourceId };
    }

    if (detailUrl) {
      return { source, detailUrl };
    }

    return null;
  }

  private transformIntelIcoProject(sourceProject: IcoDropsProject): Partial<Project> | null {
    const rawName = this.toNonEmptyString(sourceProject.name);
    const rawSlug = this.toNonEmptyString(sourceProject.slug);
    const detailUrl = this.toNonEmptyString(sourceProject.detailUrl);
    const sourceId =
      this.toNonEmptyString(sourceProject.sourceId) ||
      rawSlug ||
      (detailUrl ? this.slugify(detailUrl.replace(/^https?:\/\//i, '')) : undefined);

    if (!rawName && !rawSlug) {
      return null;
    }

    if (!sourceId && !detailUrl) {
      return null;
    }

    const name = rawName || rawSlug || 'Unknown Project';
    const slug = rawSlug || this.slugify(name);
    const symbol = this.toNonEmptyString(sourceProject.symbol || sourceProject.ticker) || '';
    const ticker = this.toNonEmptyString(sourceProject.ticker || sourceProject.symbol) || symbol;
    const status = this.normalizeDisplayStatus(sourceProject.status);
    const lastParsedAt =
      this.parseDate(sourceProject.lastParsedAt) ||
      this.parseDate(sourceProject.updatedAt) ||
      new Date();
    const firstSeenAt = this.parseDate(sourceProject.firstSeenAt) || lastParsedAt;
    const categories = this.uniqueStrings([
      ...(sourceProject.categories || []),
      ...(sourceProject.ecosystems || []),
      ...(sourceProject.launchpads || []),
    ]);
    const tags = this.uniqueStrings(sourceProject.tags || []);
    const cleanFullDescription = this.cleanDescription(sourceProject.fullDescription);
    const cleanShortDescription = this.cleanDescription(sourceProject.shortDescription);
    const descriptionText = this.toHtmlDescription(cleanFullDescription || cleanShortDescription || '');
    const website = this.firstLinkValue(sourceProject.links?.website);
    const projectLinks = this.normalizeProjectLinks(sourceProject);
    const socialmedia = this.normalizeSocialMedia(sourceProject.links);
    const explorers = this.extractExplorerLinks(sourceProject.links);
    const bridge = this.extractBridgeLinks(sourceProject.links);
    const icoInvestors = this.normalizeInvestorsForUi([
      ...(sourceProject.investors || []),
      ...((sourceProject.fundraising?.investors as any[]) || []),
    ]);
    const topFollowers = this.normalizeTopFollowers(sourceProject.social?.topFollowers);
    const fundraising = this.normalizeFundraisingRounds(sourceProject);
    const totalRaised =
      this.toNumber(sourceProject.fundraising?.totalRaised) ||
      fundraising.reduce((sum, round) => sum + this.toNumber(round.raised), 0);
    const lastFunding = this.resolveLastFunding(sourceProject, fundraising) || lastParsedAt;
    const marketData = sourceProject.marketData || {};
    const tokenomics = sourceProject.tokenomics || {};
    const tokenMetrics = this.normalizeTokenMetrics(sourceProject, ticker);
    const totalAllocation = this.normalizeTokenAllocation(tokenomics.allocation);
    const marketCap = this.toNumber(marketData.marketCap);
    const volume24h = this.toNumber(marketData.volume24h);
    const fullyDilutedMarketCap = this.toNumber(marketData.fdv || tokenomics.fdv);
    const price = this.toNumber(marketData.currentPrice || tokenomics.tokenPrice);
    const totalSupply = this.toNumber(tokenomics.totalSupply || tokenMetrics.totalSupply);
    const maxSupply = this.toNumber(tokenomics.maxSupply || tokenMetrics.maxSupply);
    const circulatingSupply = this.toNumber(tokenomics.circulatingSupply || tokenMetrics.circulatingSupply);
    const rawIcoData = {
      ...sourceProject,
      uiInvestors: icoInvestors,
      uiTopFollowers: topFollowers,
    };

    const projectData: Partial<Project> = {
      source: 'icodrops',
      sourceId: sourceId || detailUrl,
      sourceUrl: this.toNonEmptyString(sourceProject.sourceUrl) || 'https://icodrops.com/',
      detailUrl,
      lastParsedAt,
      rawIcoData,
      interestLevel: sourceProject.interestLevel || null,
      dates: sourceProject.dates || {},
      ecosystems: this.uniqueStrings(sourceProject.ecosystems || []),
      launchpads: this.uniqueStrings(sourceProject.launchpads || []),
      saleRounds: Array.isArray(sourceProject.saleRounds) ? sourceProject.saleRounds : [],
      tokenomics,
      vesting: sourceProject.vesting || {},
      social: sourceProject.social || {},
      projectType: 'project',
      projectStatus: 'active',
      status,
      sections: ['funding-feed'],
      name,
      symbol: symbol.toUpperCase(),
      ticker: ticker.toUpperCase(),
      slug,
      logo: this.toNonEmptyString(sourceProject.logo) || '',
      niche: ticker.toUpperCase() || symbol.toUpperCase(),
      type: this.toNonEmptyString(sourceProject.type) || categories[0] || status,
      bio: cleanShortDescription || cleanFullDescription || '',
      descriptionText,
      overviewText: descriptionText,
      categories,
      tags,
      mainCategory: categories[0] || null,
      website: website ? [website] : [],
      links: projectLinks,
      socialmedia,
      explorers,
      bridge,
      fundraising,
      fundsRounds: sourceProject.fundraising?.rounds || [],
      round: fundraising[0]?.type || this.toNonEmptyString(sourceProject.type) || '',
      totalRaised,
      fundsRaised: totalRaised,
      lastFunding,
      dateAdded: firstSeenAt,
      tokenMetrics,
      totalAllocation,
      marketCap,
      volume: volume24h,
      volume24h,
      volume24hChange: this.toNumber(marketData.priceChange24h),
      fullyDilutedMarketCap,
      price,
      totalSupply,
      maxSupply,
      circulatingSupply,
      volumeAndMarketCap: marketCap ? volume24h / marketCap : 0,
      roiData: {
        roi: this.toNumber(marketData.roi),
        currentPrice: price,
        returns: marketData.raw?.dropstabStats?.returns || null,
      },
      tokenDistribution: totalAllocation,
      tokenDetails: tokenomics,
      hardCap: this.toNonEmptyString(sourceProject.fundraising?.raw?.overviewTotalRaised) || '',
      inititialMarketCap: fullyDilutedMarketCap ? String(fullyDilutedMarketCap) : '',
      valuation: fullyDilutedMarketCap ? String(fullyDilutedMarketCap) : '',
      topfollowers: topFollowers,
      topFollowers,
      twitterFollowers: sourceProject.social?.twitterFollowers ? [sourceProject.social.twitterFollowers] : [],
      twitterPerformance: this.toNumber(sourceProject.social?.raw?.twitterPerformance),
      descriptionImages: this.normalizeScreenshots(sourceProject.screenshots),
      organizations: this.normalizeOrganizations(sourceProject.team),
      isMainProject: true,
      isSponsored: false,
      comments: [],
      investors: [],
      team: [],
      advisors: [],
      partners: [],
      comparison: [],
    };
    const scores = this.ratingService.calculateIcoProjectScores(projectData);

    return {
      ...projectData,
      rating: String(scores.rating),
      fomoScore: scores.rating,
      fullness: `${scores.fullness}%`,
      rawIcoData: {
        ...rawIcoData,
        scoring: scores,
      },
    };
  }

  private cleanDescription(value?: unknown): string {
    const text = this.toNonEmptyString(value);
    if (!text || /^show\s+more$/i.test(text)) {
      return '';
    }
    return text;
  }

  private toHtmlDescription(value: string): string {
    const text = this.cleanDescription(value);
    if (!text) return '';
    return text
      .split(/\n{2,}/)
      .map((part) => `<p>${this.escapeHtml(part.trim())}</p>`)
      .join('');
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private normalizeProjectLinks(sourceProject: IcoDropsProject): Array<any> {
    const links: Array<any> = [];

    if (sourceProject.detailUrl) {
      links.push({ title: 'ICODrops', link: sourceProject.detailUrl, type: 'source' });
    }

    for (const item of this.collectLinkEntries(sourceProject.links)) {
      links.push({
        title: item.label,
        link: item.url,
        type: item.key,
      });
    }

    return this.uniqueObjects(links, (item) => `${item.type || ''}|${item.link || ''}`);
  }

  private normalizeSocialMedia(links?: Record<string, any>): Array<{ href: string; name: string }> {
    const allowed = new Set([
      'website',
      'twitter',
      'x',
      'telegram',
      'discord',
      'medium',
      'github',
      'reddit',
      'youtube',
      'linkedin',
      'whitepaper',
      'dropstab',
    ]);
    const result: Array<{ href: string; name: string }> = [];

    for (const item of this.collectLinkEntries(links)) {
      const key = item.key.toLowerCase();
      const label = item.label.toLowerCase();
      const isAllowed =
        allowed.has(key) ||
        ['twitter', 'x.com', 't.me', 'discord', 'medium', 'github', 'reddit', 'youtube', 'linkedin'].some((value) =>
          item.url.toLowerCase().includes(value),
        ) ||
        ['facebook', 'instagram', 'threads', 'tiktok'].some((value) => label.includes(value));

      if (!isAllowed) continue;

      result.push({
        href: item.url,
        name: item.label,
      });
    }

    return this.uniqueObjects(result, (item) => item.href);
  }

  private extractExplorerLinks(links?: Record<string, any>): string[] {
    return this.collectLinkEntries(links)
      .filter((item) => {
        const url = item.url.toLowerCase();
        const label = item.label.toLowerCase();
        return item.key === 'explorer' || /scan|explorer|ethplorer/.test(url) || /scan|explorer/.test(label);
      })
      .map((item) => item.url)
      .filter((url, index, values) => values.indexOf(url) === index);
  }

  private extractBridgeLinks(links?: Record<string, any>): string[] {
    return this.collectLinkEntries(links)
      .filter((item) => {
        const value = `${item.label} ${item.url}`.toLowerCase();
        return /bridge|router|multichain|anyswap/.test(value);
      })
      .map((item) => item.url)
      .filter((url, index, values) => values.indexOf(url) === index);
  }

  private collectLinkEntries(links?: Record<string, any>): Array<{ key: string; label: string; url: string }> {
    const result: Array<{ key: string; label: string; url: string }> = [];
    if (!links || typeof links !== 'object') return result;

    for (const [key, value] of Object.entries(links)) {
      const values = Array.isArray(value) ? value : [value];
      for (const item of values) {
        if (!item) continue;
        const url = this.firstLinkValue(item);
        if (!url) continue;
        const label =
          this.toNonEmptyString((item as any).label) ||
          this.toNonEmptyString((item as any).name) ||
          this.toDisplayLabel(key);
        result.push({ key, label, url });
      }
    }

    return this.uniqueObjects(result, (item) => `${item.key}|${item.url}`);
  }

  private firstLinkValue(value: any): string | undefined {
    if (typeof value === 'string') return this.toNonEmptyString(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        const url = this.firstLinkValue(item);
        if (url) return url;
      }
      return undefined;
    }
    if (value && typeof value === 'object') {
      return (
        this.toNonEmptyString(value.url) ||
        this.toNonEmptyString(value.href) ||
        this.toNonEmptyString(value.link)
      );
    }
    return undefined;
  }

  private normalizeFundraisingRounds(sourceProject: IcoDropsProject): Array<any> {
    const rawRounds = Array.isArray(sourceProject.saleRounds) && sourceProject.saleRounds.length
      ? sourceProject.saleRounds
      : ((sourceProject.fundraising?.rounds as any[]) || []);
    const projectInvestors = this.normalizeInvestorsForUi([
      ...(sourceProject.investors || []),
      ...((sourceProject.fundraising?.investors as any[]) || []),
    ]);

    return this.uniqueObjects(rawRounds, (round) =>
      `${round.roundName || round.name || round.type || ''}|${round.rawDate || round.date?.raw || ''}|${round.raise || round.raised || ''}`,
    ).map((round) => {
      const infoBlocks = round.raw?.infoBlocks || {};
      const startDate = this.extractRoundStartDate(round);
      const endDate = this.extractRoundEndDate(round);
      const raised = this.toNumber(round.raised ?? round.raise ?? infoBlocks.Raised?.money ?? infoBlocks.Raised?.text);
      const tokenPrice = this.toNumber(round.price ?? infoBlocks.Price?.money ?? infoBlocks.Price?.text);
      const tokenSold = this.toNumber(round.tokensForSale ?? infoBlocks['Tokens For Round']?.money ?? infoBlocks['Tokens For Round']?.text);
      const preValuation = this.toNumber(round.preValuation ?? round.valuation ?? infoBlocks['Pre-Valuation']?.money ?? infoBlocks['Pre-Valuation']?.text);
      const platformName =
        this.toNonEmptyString(round.platform) ||
        this.toNonEmptyString(round.launchpad) ||
        this.toNonEmptyString(infoBlocks.Platform?.text) ||
        sourceProject.launchpads?.[0] ||
        'ICODrops';
      const investors = this.normalizeInvestorsForUi(round.investors || []);

      return {
        icon: this.resolveFundraisingIcon(round.status || sourceProject.status),
        name: this.toNonEmptyString(round.roundName || round.name || round.type) || '',
        type: this.toNonEmptyString(round.type || round.roundName || round.name) || '',
        status: this.toNonEmptyString(round.status) || this.normalizeDisplayStatus(sourceProject.status),
        startDate,
        endDate,
        goal: preValuation || raised,
        raised,
        price: round.price,
        tokenPrice,
        tokensForSale: round.tokensForSale,
        tokenSold,
        totalSupply: this.toNumber(sourceProject.tokenomics?.totalSupply),
        valuation: round.valuation || round.preValuation || '',
        preValuation,
        platform: platformName,
        platformName,
        platformImg: '',
        distributionType: this.toNonEmptyString(round.status) || this.normalizeDisplayStatus(sourceProject.status),
        vesting:
          round.vesting ||
          round.distributionType ||
          infoBlocks.Distribution?.text ||
          '',
        investors: investors.length ? investors : projectInvestors,
        usdRoi: this.toNumber(round.roi ?? infoBlocks.ROI?.money ?? infoBlocks.ROI?.text),
        btcRoi: this.toNumber(infoBlocks.ROI?.raw?.btc),
        ethRoi: this.toNumber(infoBlocks.ROI?.raw?.eth),
        athRoi: this.toNumber(round.athRoi),
        currenciesList: [],
        sourceLinks: Array.isArray(round.links) ? round.links : [],
        raw: round.raw,
      };
    });
  }

  private normalizeTokenMetrics(sourceProject: IcoDropsProject, ticker: string): Record<string, string> {
    const tokenomics = sourceProject.tokenomics || {};
    const marketData = sourceProject.marketData || {};
    return {
      ticker,
      ticket: ticker,
      tokenType: this.toNonEmptyString(sourceProject.type) || '',
      tokenPrice: this.toMetricString(marketData.currentPrice || tokenomics.tokenPrice),
      totalSupply: this.toMetricString(tokenomics.totalSupply),
      maxSupply: this.toMetricString(tokenomics.maxSupply),
      circulatingSupply: this.toMetricString(tokenomics.circulatingSupply),
      blockchain: sourceProject.ecosystems?.[0] || '',
    };
  }

  private normalizeTokenAllocation(allocation: any): Array<{ name: string; value: number; allocated: number }> {
    if (!Array.isArray(allocation)) return [];
    return allocation
      .map((item) => ({
        name: this.toNonEmptyString(item?.name || item?.label) || 'Allocation',
        value: this.toNumber(item?.value ?? item?.percent),
        allocated: this.toNumber(item?.allocated ?? item?.tokens ?? item?.amount),
      }))
      .filter((item) => item.name || item.value || item.allocated);
  }

  private normalizeInvestorsForUi(values: any[] = []): Array<any> {
    return this.uniqueObjects(values, (item) => `${item?.slug || ''}|${item?.name || ''}|${item?.url || ''}`)
      .map((item, index) => {
        const name = this.toNonEmptyString(item?.name || item?.title) || `Investor ${index + 1}`;
        const slug = this.toNonEmptyString(item?.slug) || this.slugify(name);
        return {
          ...item,
          id: item?.id || item?._id || slug || String(index),
          name,
          img: item?.img || item?.logo || item?.image || '',
          logo: item?.logo || item?.img || item?.image || '',
          banner: item?.banner || item?.type || item?.tier || item?.stage || '',
          rating: item?.rating || this.ratingFromTier(item?.tier),
          isLead: Boolean(item?.isLead || item?.lead),
        };
      });
  }

  private normalizeTopFollowers(values: any): Array<any> {
    if (!Array.isArray(values)) return [];
    return this.uniqueObjects(values, (item) => `${item?.username || ''}|${item?.name || ''}|${item?.url || ''}`)
      .map((item, index) => ({
        ...item,
        id: item?.id || item?.username || item?.handle || String(index),
        name: item?.name || item?.username || `Follower ${index + 1}`,
        username: String(item?.username || item?.handle || '').replace(/^@/, ''),
        avatar: item?.avatar || item?.logo || item?.image || '',
        followersCount: this.toNumber(item?.followersCount ?? item?.followers),
      }));
  }

  private normalizeScreenshots(values: any): string[] {
    if (!Array.isArray(values)) return [];
    return values
      .map((item) => this.firstLinkValue(item) || this.toNonEmptyString(item))
      .filter(Boolean)
      .filter((url, index, items) => items.indexOf(url) === index) as string[];
  }

  private normalizeOrganizations(values: any): Array<any> {
    if (!Array.isArray(values)) return [];
    return values
      .map((item) => ({
        name: this.toNonEmptyString(item?.name) || '',
        description: this.toNonEmptyString(item?.role || item?.title || item?.position || item?.description) || '',
        logo: item?.logo || item?.image || '',
        url: item?.url || '',
      }))
      .filter((item) => item.name);
  }

  private resolveLastFunding(sourceProject: IcoDropsProject, fundraising: Array<any>): Date | undefined {
    const dates = fundraising
      .map((round) => round.endDate || round.startDate)
      .filter((date) => date instanceof Date && !Number.isNaN(date.getTime())) as Date[];

    const projectDate =
      this.parseDate(sourceProject.dates?.startDate?.normalized) ||
      this.parseDate(sourceProject.dates?.startDate?.raw);
    if (projectDate) dates.push(projectDate);

    if (!dates.length) return undefined;
    return new Date(Math.max(...dates.map((date) => date.getTime())));
  }

  private extractRoundStartDate(round: any): Date | undefined {
    return (
      this.parseDate(round?.startDate) ||
      this.parseDate(round?.date?.startDate?.normalized) ||
      this.parseDate(round?.date?.date?.normalized) ||
      this.parseDate(round?.date?.raw) ||
      this.parseDate(round?.rawDate)
    );
  }

  private extractRoundEndDate(round: any): Date | undefined {
    return (
      this.parseDate(round?.endDate) ||
      this.parseDate(round?.date?.endDate?.normalized)
    );
  }

  private toDisplayLabel(value: string): string {
    return value
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private toMetricString(value: unknown): string {
    const numeric = this.toNumber(value);
    if (numeric) return String(numeric);
    return this.toNonEmptyString(value) || '';
  }

  private ratingFromTier(value: unknown): number {
    const tier = this.toNonEmptyString(value)?.toLowerCase() || '';
    if (tier.includes('1')) return 90;
    if (tier.includes('2')) return 75;
    if (tier.includes('3')) return 60;
    return 0;
  }

  private uniqueStrings(values: any[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const value of values || []) {
      const text = this.toNonEmptyString(value);
      if (!text) continue;
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(text);
    }
    return result;
  }

  private uniqueObjects<T>(values: T[] = [], keyFn: (item: any) => string): T[] {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const value of values || []) {
      if (!value) continue;
      const key = keyFn(value) || JSON.stringify(value);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(value);
    }
    return result;
  }

  private resolveFundraisingIcon(status?: string): 'selected' | 'privateSell' | 'hourGlass' {
    switch ((status || '').toLowerCase()) {
      case 'active':
        return 'selected';
      case 'upcoming':
        return 'hourGlass';
      default:
        return 'privateSell';
    }
  }

  private normalizeDisplayStatus(status?: string): string {
    const normalized = this.toNonEmptyString(status)?.toLowerCase();

    if (normalized === 'active') {
      return 'Active';
    }

    if (normalized === 'upcoming') {
      return 'Upcoming';
    }

    if (normalized === 'ended') {
      return 'Ended';
    }

    return 'Active';
  }

  private parseDate(value?: string | number | Date): Date | undefined {
    if (!value) {
      return undefined;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? undefined : value;
    }

    if (typeof value === 'number') {
      const parsedDate = new Date(value > 1_000_000_000_000 ? value : value * 1000);
      return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
    }

    const normalized = String(value).trim();
    if (!normalized) {
      return undefined;
    }

    if (/^\d+$/.test(normalized)) {
      return this.parseDate(Number(normalized));
    }

    const directDate = new Date(normalized);
    if (!Number.isNaN(directDate.getTime())) {
      return directDate;
    }

    const cleaned = normalized.replace(/^from\s+/i, '');
    const cleanedDate = new Date(cleaned);
    if (!Number.isNaN(cleanedDate.getTime())) {
      return cleanedDate;
    }

    return undefined;
  }

  private toNumber(value?: unknown): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? 0 : value.getTime();
    }

    const normalized = this.toNonEmptyString(value);
    if (!normalized) {
      return 0;
    }

    const match = normalized.match(/\$?\s*([\d.,]+)\s*([KMBT])?/i);
    if (!match) {
      return 0;
    }

    let amount = Number(match[1].replace(/,/g, ''));
    if (!Number.isFinite(amount)) {
      return 0;
    }

    const suffix = match[2]?.toUpperCase();
    if (suffix === 'K') amount *= 1_000;
    if (suffix === 'M') amount *= 1_000_000;
    if (suffix === 'B') amount *= 1_000_000_000;
    if (suffix === 'T') amount *= 1_000_000_000_000;

    return amount;
  }

  private toNonEmptyString(value?: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const normalized = value.trim();
    return normalized ? normalized : undefined;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private isSyncEnabled(): boolean {
    return String(
      this.configService.get('PROJECTS_INTEL_ICO_SYNC_ENABLED') ?? 'false',
    ).toLowerCase() === 'true';
  }

  private isWorkerProcess(): boolean {
    return process.env.INTEL_SYNC_WORKER_PROCESS === 'true';
  }

  private isStartupSyncEnabled(): boolean {
    return String(
      this.configService.get('PROJECTS_INTEL_ICO_SYNC_ON_STARTUP') ?? 'false',
    ).toLowerCase() === 'true';
  }

  private getApiUrl(): string {
    const explicitUrl = this.configService.get<string>('PROJECTS_INTEL_ICO_API_URL');
    if (explicitUrl) {
      return explicitUrl;
    }

    const baseUrl = this.configService.get<string>('INTEL_API_BASE_URL');
    if (baseUrl) {
      return `${baseUrl.replace(/\/+$/, '')}/ico-projects`;
    }

    return 'http://localhost:8001/api/ico-projects';
  }
}
