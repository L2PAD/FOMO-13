import { Injectable, Logger, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import axios from "axios";
import { Model, Types } from "mongoose";
import { CryptoLinkingPublicService } from "src/crypto-linking/services/crypto-linking-public.service";
import type {
  ProjectResolverConfidence,
  ProjectResolverInput,
  ProjectResolverProjectLink,
  ProjectResolverResult,
} from "src/crypto-linking/services/project-resolver.service";
import { FomoV2FundingFeedRoundReadModel } from "src/fomo-v2/domains/funding/models";
import { FomoV2ParserControlPolicyService } from "src/fomo-v2/domains/parser-control";
import { Funds, FundsDocument } from "src/funds/funds.model";
import { FundsRatingService } from "src/funds/funds-rating.service";
import { Person, PersonDocument } from "src/persons/person.model";
import { PersonsRatingService } from "src/persons/persons-rating.service";
import { Project, ProjectDocument } from "src/projects/project.model";
import { Investor, InvestorDocument } from "./investor.model";

export interface DropstabInvestorsSyncOptions {
  limit?: number;
  offset?: number;
  onlyWithDetails?: boolean;
  onlyUpdatedSince?: string;
  dryRun?: boolean;
  includeRaw?: boolean;
  apiUrl?: string;
}

interface BackerReadModelSyncOptions {
  limit?: number;
  offset?: number;
  dryRun?: boolean;
  slug?: string;
}

interface SourceInvestorsResponse {
  ok?: boolean;
  total?: number;
  limit?: number;
  offset?: number;
  investors?: any[];
}

interface ProjectIndexItem {
  id: Types.ObjectId;
  name?: string;
  slug?: string;
  projectType?: string;
  sourceId?: string;
  detailUrl?: string;
  sourceUrl?: string;
}

type CachedProjectResolution = Promise<ProjectResolverResult>;

interface ProjectIndexes {
  bySlug: Map<string, ProjectIndexItem>;
  bySourceId: Map<string, ProjectIndexItem>;
  byDetailUrl: Map<string, ProjectIndexItem>;
  byName: Map<string, ProjectIndexItem>;
}

interface FundingRoundIndexItem {
  id: Types.ObjectId;
  projectKeys: string[];
  projectName?: string;
  stageKeys: string[];
  date?: Date;
}

interface FundingRoundIndexes {
  byProjectStageDate: Map<string, FundingRoundIndexItem | null>;
  byNameStageDate: Map<string, FundingRoundIndexItem | null>;
}

@Injectable()
export class DropstabInvestorsSyncService {
  private readonly logger = new Logger(DropstabInvestorsSyncService.name);
  private readonly syncVersion = "dropstab-investors-sync-v1";

  constructor(
    @InjectModel(Investor.name)
    private readonly investorModel: Model<InvestorDocument>,
    @InjectModel(Funds.name)
    private readonly fundsModel: Model<FundsDocument>,
    @InjectModel(Person.name)
    private readonly personModel: Model<PersonDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(FomoV2FundingFeedRoundReadModel.name)
    private readonly fundingRoundModel: Model<FomoV2FundingFeedRoundReadModel>,
    private readonly configService: ConfigService,
    private readonly fundsRatingService: FundsRatingService,
    private readonly personsRatingService: PersonsRatingService,
    private readonly cryptoLinkingPublicService: CryptoLinkingPublicService,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService
  ) {}

  async sync(options: DropstabInvestorsSyncOptions = {}): Promise<any> {
    const limit = this.normalizeLimit(options.limit);
    const offset = this.normalizeOffset(options.offset);
    const dryRun = Boolean(options.dryRun);
    if (!dryRun && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        "backers:dropstab"
      );
    }

    if (!dryRun) {
      await this.ensureIndexes();
    }

    const [projectIndexes, fundingRoundIndexes, page] = await Promise.all([
      this.loadProjectIndexes(),
      this.loadFundingRoundIndexes(),
      this.fetchInvestorsPage({
        ...options,
        limit,
        offset,
      }),
    ]);

    const sourceInvestors = Array.isArray(page.investors) ? page.investors : [];
    const projectResolutionCache = new Map<string, CachedProjectResolution>();
    const summary = {
      dryRun,
      sourceTotal: page.total || sourceInvestors.length,
      limit,
      offset,
      fetched: sourceInvestors.length,
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      withDetails: 0,
      withPortfolio: 0,
      withFundraisingRounds: 0,
      withCoInvestors: 0,
      linkedPortfolioProjects: 0,
      unlinkedPortfolioProjects: 0,
      linkedFundingRounds: 0,
      unlinkedFundingRounds: 0,
      errors: [] as Array<{ slug?: string; name?: string; message: string }>,
    };

    for (const sourceInvestor of sourceInvestors) {
      try {
        const investor = await this.normalizeInvestor(
          sourceInvestor,
          projectIndexes,
          fundingRoundIndexes,
          projectResolutionCache
        );
        if (!investor) {
          summary.skipped += 1;
          continue;
        }

        summary.processed += 1;
        if (investor.lastDetailParsedAt) summary.withDetails += 1;
        if (investor.portfolio?.length) summary.withPortfolio += 1;
        if (investor.fundraisingRounds?.length)
          summary.withFundraisingRounds += 1;
        if (investor.coInvestors?.length) summary.withCoInvestors += 1;

        for (const item of investor.portfolio || []) {
          if (item.matchedProjectId) summary.linkedPortfolioProjects += 1;
          else summary.unlinkedPortfolioProjects += 1;
        }

        for (const item of investor.fundraisingRounds || []) {
          if (item.matchedFundingRoundId) summary.linkedFundingRounds += 1;
          else summary.unlinkedFundingRounds += 1;
        }

        const existing = await this.findExistingInvestor(investor);
        if (existing) summary.updated += 1;
        else summary.created += 1;

        if (dryRun) {
          continue;
        }

        const set = this.buildNonEmptySet(investor);
        const filter = existing?._id
          ? { _id: existing._id }
          : investor.slug
          ? { source: investor.source, slug: investor.slug }
          : investor.detailUrl
          ? { source: investor.source, detailUrl: investor.detailUrl }
          : {
              source: investor.source,
              normalizedName: investor.normalizedName,
            };

        const savedInvestor = await this.investorModel
          .findOneAndUpdate(
            filter,
            {
              $set: set,
              $setOnInsert: { createdAt: new Date() },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          )
          .lean();

        await this.syncInvestorToBackerReadModel({
          ...investor,
          _id: savedInvestor?._id || existing?._id,
        } as any);
      } catch (error) {
        const message = error?.message || "Unknown sync error";
        summary.errors.push({
          slug: this.toNonEmptyString(sourceInvestor?.slug),
          name: this.toNonEmptyString(sourceInvestor?.name),
          message,
        });
      }
    }

    return summary;
  }

  async auditSync(): Promise<any> {
    const sourceStatus = await this.fetchSourceStatus().catch((error) => ({
      error: error?.message || "Unable to fetch source status",
    }));
    const sourceInvestorsAvailable = Number(
      (sourceStatus as any)?.totalDropstabInvestors || 0
    );

    const [
      syncedInvestors,
      syncedWithDetails,
      staleSyncedInvestors,
      withPortfolio,
      withFundingRounds,
      withCoInvestors,
      linkedPortfolioProjects,
      unlinkedPortfolioProjects,
      duplicatesBySlug,
      duplicatesByDetailUrl,
      normalizedNameCollisions,
      lastSyncedBounds,
      parserVersionBreakdown,
      dataQualityBreakdown,
    ] = await Promise.all([
      this.investorModel.countDocuments({ source: "dropstab" }),
      this.investorModel.countDocuments({
        source: "dropstab",
        lastDetailParsedAt: { $exists: true, $ne: null },
        "dataQuality.detailParseStatus": { $in: ["success", "partial"] },
      }),
      this.investorModel.countDocuments({
        source: "dropstab",
        $or: [
          { lastSyncedAt: { $exists: false } },
          { lastSyncedAt: null },
          { $expr: { $lt: ["$lastSyncedAt", "$lastDetailParsedAt"] } },
        ],
      }),
      this.investorModel.countDocuments({
        source: "dropstab",
        "portfolio.0": { $exists: true },
      }),
      this.investorModel.countDocuments({
        source: "dropstab",
        "fundraisingRounds.0": { $exists: true },
      }),
      this.investorModel.countDocuments({
        source: "dropstab",
        "coInvestors.0": { $exists: true },
      }),
      this.countPortfolioLinks(true),
      this.countPortfolioLinks(false),
      this.duplicateGroups("slug"),
      this.duplicateGroups("detailUrl"),
      this.normalizedNameCollisions(),
      this.investorModel
        .aggregate([
          {
            $match: {
              source: "dropstab",
              lastSyncedAt: { $exists: true, $ne: null },
            },
          },
          {
            $group: {
              _id: null,
              min: { $min: "$lastSyncedAt" },
              max: { $max: "$lastSyncedAt" },
            },
          },
        ])
        .exec(),
      this.breakdown("parserVersion"),
      this.breakdown("dataQuality.detailParseStatus"),
    ]);

    const bounds = lastSyncedBounds[0] || {};

    return {
      sourceInvestorsAvailable,
      sourceStatus,
      syncedInvestors,
      syncedWithDetails,
      missingInMainBackend: sourceInvestorsAvailable
        ? Math.max(0, sourceInvestorsAvailable - syncedInvestors)
        : null,
      staleSyncedInvestors,
      withPortfolio,
      withFundingRounds,
      withCoInvestors,
      linkedPortfolioProjects,
      unlinkedPortfolioProjects,
      duplicatesBySlug,
      duplicatesByDetailUrl,
      normalizedNameCollisions,
      lastSyncedAtMin: bounds.min || null,
      lastSyncedAtMax: bounds.max || null,
      parserVersionBreakdown,
      dataQualityBreakdown,
      recommendations: this.buildAuditRecommendations({
        sourceInvestorsAvailable,
        syncedInvestors,
        staleSyncedInvestors,
        duplicatesBySlugCount: duplicatesBySlug.length,
        duplicatesByDetailUrlCount: duplicatesByDetailUrl.length,
        normalizedNameCollisionsCount: normalizedNameCollisions.length,
        unlinkedPortfolioProjects,
      }),
    };
  }

  async syncBackerReadModelsFromStoredInvestors(
    options: BackerReadModelSyncOptions = {}
  ): Promise<any> {
    const limit = this.normalizeOffset(options.limit) || 0;
    const offset = this.normalizeOffset(options.offset);
    const dryRun = Boolean(options.dryRun);
    if (!dryRun && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        "backers:dropstab"
      );
    }
    const query: Record<string, any> = { source: "dropstab" };
    if (options.slug) {
      query.slug = options.slug;
    }
    const cursor = this.investorModel
      .find(query)
      .sort({ lastSyncedAt: -1, lastDetailParsedAt: -1, name: 1 })
      .skip(offset)
      .limit(limit || 0)
      .lean()
      .cursor();
    const summary = {
      dryRun,
      offset,
      limit: limit || "all",
      processed: 0,
      fundsSynced: 0,
      personsSynced: 0,
      skipped: 0,
      errors: [] as Array<{ slug?: string; name?: string; message: string }>,
    };
    const fundOperations: any[] = [];
    const personOperations: any[] = [];
    const flush = async () => {
      if (dryRun) return;

      const operationsToFlush = [
        { model: this.fundsModel, operations: fundOperations },
        { model: this.personModel, operations: personOperations },
      ];

      for (const item of operationsToFlush) {
        if (!item.operations.length) continue;

        const operations = item.operations.splice(0, item.operations.length);
        await (item.model as any).bulkWrite(operations, { ordered: false });
      }
    };

    for await (const investor of cursor as any) {
      try {
        const operation =
          this.buildInvestorToBackerReadModelOperation(investor);
        if (!operation) {
          summary.skipped += 1;
          continue;
        }

        summary.processed += 1;

        if (!dryRun) {
          if (operation.target === "persons") {
            personOperations.push(operation.updateOne);
          } else {
            fundOperations.push(operation.updateOne);
          }

          if (fundOperations.length + personOperations.length >= 500) {
            await flush();
          }
        }

        if (operation.target === "persons") {
          summary.personsSynced += 1;
        } else {
          summary.fundsSynced += 1;
        }
      } catch (error) {
        summary.errors.push({
          slug: this.toNonEmptyString(investor?.slug),
          name: this.toNonEmptyString(investor?.name),
          message: error?.message || "Unknown read model sync error",
        });
      }
    }

    await flush();

    return summary;
  }

  private async fetchInvestorsPage(
    options: DropstabInvestorsSyncOptions
  ): Promise<SourceInvestorsResponse> {
    const response = await axios.get<SourceInvestorsResponse>(
      this.getInvestorsApiUrl(options.apiUrl),
      {
        params: {
          source: "dropstab",
          includeDetails: true,
          includePortfolio: true,
          includeRaw: Boolean(options.includeRaw),
          onlyWithDetails: Boolean(options.onlyWithDetails),
          updatedSince: options.onlyUpdatedSince,
          limit: options.limit,
          offset: options.offset,
        },
        timeout: this.getApiTimeoutMs(),
      }
    );

    return response.data || {};
  }

  private async fetchSourceStatus(): Promise<any> {
    const response = await axios.get(this.getSourceStatusUrl(), {
      timeout: this.getApiTimeoutMs(),
    });
    return response.data || {};
  }

  private async normalizeInvestor(
    source: any,
    projectIndexes: ProjectIndexes,
    fundingRoundIndexes: FundingRoundIndexes,
    projectResolutionCache: Map<string, CachedProjectResolution>
  ): Promise<Partial<Investor> | null> {
    const name = this.toNonEmptyString(source?.name);
    const slug = this.toNonEmptyString(source?.slug) || this.slugify(name);
    if (!name || !slug) {
      return null;
    }

    const sourceId =
      this.toNonEmptyString(source?.sourceId) ||
      this.toNonEmptyString(source?.externalId) ||
      this.toNonEmptyString(source?.id);
    const detailUrl = this.normalizeDropstabInvestorUrl(
      this.toNonEmptyString(source?.detailUrl) ||
        (slug ? `https://dropstab.com/investors/${slug}` : "")
    );
    const socialLinks = this.cleanObject({
      ...(source?.socialLinks || {}),
      website: source?.socialLinks?.website || source?.website,
      twitter:
        source?.socialLinks?.twitter || source?.twitter || source?.twitterUrl,
      linkedin: source?.socialLinks?.linkedin || source?.linkedin,
      telegram: source?.socialLinks?.telegram || source?.telegram,
      discord: source?.socialLinks?.discord || source?.discord,
      medium: source?.socialLinks?.medium || source?.medium,
      github: source?.socialLinks?.github || source?.github,
      crunchbase: source?.socialLinks?.crunchbase || source?.crunchbase,
    });
    const portfolio = await Promise.all(
      this.arrayValue(source?.portfolio || source?.portfolioProjects).map(
        (item: any) =>
          this.withProjectLink(
            this.normalizePortfolioItem(item),
            projectIndexes,
            projectResolutionCache
          )
      )
    );
    const fundraisingRounds = await Promise.all(
      this.arrayValue(source?.fundraisingRounds).map(async (item: any) => {
        const round = await this.withProjectLink(
          this.normalizeFundraisingRound(item),
          projectIndexes,
          projectResolutionCache
        );
        return this.withFundingRoundLink(round, fundingRoundIndexes);
      })
    );

    return this.cleanObject({
      source: "dropstab",
      sourceId,
      syncSource: "api-backend-dropstab",
      syncVersion: this.syncVersion,
      name,
      normalizedName: this.normalizeName(name),
      slug,
      detailUrl,
      logo:
        this.toNonEmptyString(source?.logo) ||
        this.toNonEmptyString(source?.image),
      description: this.toNonEmptyString(source?.description),
      type:
        this.toNonEmptyString(source?.type) ||
        this.toNonEmptyString(source?.ventureType),
      category: source?.category,
      country: this.normalizeCountry(source?.country),
      location: this.toNonEmptyString(source?.location),
      website:
        this.toNonEmptyString(source?.website) ||
        this.toNonEmptyString(socialLinks.website),
      socialLinks,
      stats: this.cleanObject(source?.stats || {}),
      portfolio,
      fundraisingRounds,
      coInvestors: this.arrayValue(
        source?.coInvestors || source?.coInvestments
      ).map((item: any) => this.normalizeCoInvestor(item)),
      sectors: this.arrayValue(source?.sectors),
      chains: this.arrayValue(source?.chains),
      tags: this.arrayValue(source?.tags)
        .map((item: any) => this.toNonEmptyString(item))
        .filter(Boolean),
      lastParsedAt: this.parseDate(source?.lastParsedAt || source?.updated_at),
      lastDetailParsedAt: this.parseDate(source?.lastDetailParsedAt),
      lastSyncedAt: new Date(),
      parserVersion: this.toNonEmptyString(source?.parserVersion),
      dataQuality: this.cleanObject(source?.dataQuality || {}),
      sourceRefs: this.cleanObject({
        key: source?.key,
        externalId: source?.externalId,
        detailUrl,
      }),
    });
  }

  private normalizePortfolioItem(item: any): any {
    return this.cleanObject({
      sourceId:
        this.toNonEmptyString(item?.sourceId) ||
        this.toNonEmptyString(item?.id || item?.currencyId || item?.coinId),
      sourceKey: this.toNonEmptyString(item?.sourceKey || item?.projectKey),
      name:
        this.toNonEmptyString(item?.name) ||
        this.toNonEmptyString(item?.projectName),
      slug:
        this.toNonEmptyString(item?.slug) ||
        this.toNonEmptyString(item?.projectSlug),
      projectSlug:
        this.toNonEmptyString(item?.projectSlug) ||
        this.toNonEmptyString(item?.slug),
      projectUrl: this.normalizeDropstabProjectUrl(
        item?.projectUrl || item?.sourceUrl
      ),
      symbol: this.toNonEmptyString(
        item?.symbol || item?.ticker || item?.coinSymbol
      ),
      logo:
        this.toNonEmptyString(item?.logo) || this.toNonEmptyString(item?.image),
      category: this.toNonEmptyString(item?.category),
      round: this.toNonEmptyString(item?.round),
      date: this.parseDate(item?.date),
      amount: this.toOptionalNumber(item?.amount),
      amountRaw: this.toNonEmptyString(item?.amountRaw),
      price: this.toOptionalNumber(item?.price),
      roi: this.toOptionalNumber(item?.roi),
      status: this.toNonEmptyString(item?.status),
    });
  }

  private normalizeFundraisingRound(item: any): any {
    return this.cleanObject({
      sourceId:
        this.toNonEmptyString(item?.sourceId) ||
        this.toNonEmptyString(item?.id || item?.roundId || item?.coinId),
      sourceKey: this.toNonEmptyString(item?.sourceKey || item?.projectKey),
      projectName:
        this.toNonEmptyString(item?.projectName) ||
        this.toNonEmptyString(item?.name),
      projectSlug:
        this.toNonEmptyString(item?.projectSlug) ||
        this.toNonEmptyString(item?.slug),
      projectUrl: this.normalizeDropstabProjectUrl(
        item?.projectUrl || item?.sourceUrl
      ),
      symbol: this.toNonEmptyString(
        item?.symbol || item?.ticker || item?.coinSymbol
      ),
      round:
        this.toNonEmptyString(item?.round) ||
        this.toNonEmptyString(item?.stage),
      date: this.parseDate(item?.date),
      amount: this.toOptionalNumber(item?.amount),
      amountRaw: this.toNonEmptyString(item?.amountRaw),
      valuation: this.toOptionalNumber(item?.valuation),
      valuationRaw: this.toNonEmptyString(item?.valuationRaw),
      investors: this.arrayValue(item?.investors)
        .map((investor: any) =>
          this.toNonEmptyString(investor?.name || investor)
        )
        .filter(Boolean),
      isLead: Boolean(item?.isLead || item?.lead),
      category: this.toNonEmptyString(item?.category),
    });
  }

  private normalizeCoInvestor(item: any): any {
    return this.cleanObject({
      name: this.toNonEmptyString(item?.name),
      slug:
        this.toNonEmptyString(item?.slug) ||
        this.toNonEmptyString(item?.investorSlug),
      url: this.normalizeDropstabInvestorUrl(item?.url),
      logo:
        this.toNonEmptyString(item?.logo) || this.toNonEmptyString(item?.image),
      investmentsCount: this.toOptionalNumber(
        item?.investmentsCount || item?.count
      ),
      latestRound: this.parseDate(item?.latestRound || item?.lastRoundDate),
      type:
        this.toNonEmptyString(item?.type) ||
        this.toNonEmptyString(item?.ventureType),
    });
  }

  private async withProjectLink(
    item: any,
    indexes: ProjectIndexes,
    projectResolutionCache: Map<string, CachedProjectResolution>
  ): Promise<any> {
    const detailUrl = this.normalizeDropstabProjectUrl(
      item.projectUrl || item.sourceUrl
    );
    const slug = this.normalizeMatchValue(
      item.projectSlug || item.slug || this.slugFromUrl(detailUrl)
    );
    const name = this.normalizeName(item.projectName || item.name);
    const resolverResult = await this.resolveProjectForInvestorItem(
      item,
      projectResolutionCache
    );

    if (this.isWritableProjectResolution(resolverResult)) {
      return this.cleanObject({
        ...item,
        projectId: resolverResult.projectId,
        matchedProjectId: resolverResult.projectId,
        projectType: resolverResult.projectType,
        projectLinks: this.projectLinksWithLinkedAt(resolverResult),
        matchMethod: resolverResult.matchedBy,
        matchConfidence: this.confidenceScore(resolverResult.confidence),
        matchReason: resolverResult.reason,
      });
    }

    const matched =
      (slug && indexes.bySlug.get(slug)) ||
      (slug && indexes.bySourceId.get(slug)) ||
      (detailUrl && indexes.byDetailUrl.get(detailUrl)) ||
      (name && indexes.byName.get(name));

    if (!matched) {
      return {
        ...item,
        matchedProjectId: undefined,
        matchMethod: "none",
        matchConfidence: 0,
      };
    }

    const matchMethod =
      slug && matched.slug && this.normalizeMatchValue(matched.slug) === slug
        ? "slug"
        : slug &&
          matched.sourceId &&
          this.normalizeMatchValue(matched.sourceId) === slug
        ? "sourceId"
        : detailUrl &&
          this.normalizeDropstabProjectUrl(
            matched.detailUrl || matched.sourceUrl
          ) === detailUrl
        ? "detailUrl"
        : "name";
    const confidence: ProjectResolverConfidence =
      matchMethod === "name" ? "medium" : "high";

    return this.cleanObject({
      ...item,
      projectId: matched.id,
      matchedProjectId: matched.id,
      projectLinks: this.localProjectLinks(matched, confidence, matchMethod),
      matchMethod,
      matchConfidence: this.confidenceScore(confidence),
      matchReason: `Local ${matchMethod} project index match.`,
    });
  }

  private async resolveProjectForInvestorItem(
    item: any,
    projectResolutionCache: Map<string, CachedProjectResolution>
  ): Promise<ProjectResolverResult> {
    const inputs = this.investorProjectInputs(item);
    if (!inputs.length) {
      return this.noProjectResolution("No investor project fields.");
    }

    const cacheKey = JSON.stringify(inputs);
    let pending = projectResolutionCache.get(cacheKey);
    if (!pending) {
      pending = this.cryptoLinkingPublicService.resolveProject(inputs);
      projectResolutionCache.set(cacheKey, pending);
    }

    try {
      return await pending;
    } catch (error) {
      projectResolutionCache.delete(cacheKey);
      return this.noProjectResolution(
        error?.message || "Project resolver failed."
      );
    }
  }

  private investorProjectInputs(item: any): ProjectResolverInput[] {
    const detailUrl = this.normalizeDropstabProjectUrl(
      item?.projectUrl || item?.sourceUrl
    );
    const slug = this.toNonEmptyString(
      item?.projectSlug || item?.slug || this.slugFromUrl(detailUrl)
    );
    const sourceId = this.toNonEmptyString(
      item?.sourceId || item?.externalId || item?.currencyId || item?.coinId
    );
    const sourceKey = this.toNonEmptyString(
      item?.sourceKey || item?.projectKey
    );
    const name = this.toNonEmptyString(item?.projectName || item?.name);
    const symbol = this.toNonEmptyString(
      item?.symbol || item?.ticker || item?.coinSymbol
    );

    if (!sourceId && !sourceKey && !detailUrl && !slug && !name && !symbol) {
      return [];
    }

    const input = this.cleanObject<ProjectResolverInput>({
      source: "dropstab",
      sourceId: sourceId || slug,
      sourceKey: sourceKey || slug,
      externalId: sourceId,
      sourceUrl: detailUrl,
      coinSlug: slug,
      slug,
      name,
      symbol,
      dropstabId: sourceId,
    });

    return Object.keys(input).length ? [input] : [];
  }

  private isWritableProjectResolution(
    result: ProjectResolverResult | null
  ): result is ProjectResolverResult & { projectId: Types.ObjectId } {
    return Boolean(
      result?.projectId &&
        !result.unsafe &&
        (result.confidence === "exact" || result.confidence === "high")
    );
  }

  private projectLinksWithLinkedAt(
    result: ProjectResolverResult & { projectId: Types.ObjectId }
  ): Array<ProjectResolverProjectLink & { linkedAt: Date }> {
    const linkedAt = new Date();
    const links = (
      result.projectLinks?.length
        ? result.projectLinks
        : result.projectType
        ? [
            {
              projectId: result.projectId,
              projectType: result.projectType,
              confidence: result.confidence,
              matchedBy: result.matchedBy,
              reason: result.reason,
            },
          ]
        : []
    ) as ProjectResolverProjectLink[];

    return links
      .filter((link) => link.projectId && link.projectType)
      .map((link) => ({ ...link, linkedAt }));
  }

  private localProjectLinks(
    matched: ProjectIndexItem,
    confidence: ProjectResolverConfidence,
    matchedBy: string
  ): Array<ProjectResolverProjectLink & { linkedAt: Date }> {
    const projectType = this.projectLinkType(matched.projectType);
    if (!projectType) return [];

    return [
      {
        projectId: matched.id,
        projectType,
        confidence,
        matchedBy,
        reason: `Local ${matchedBy} project index match.`,
        linkedAt: new Date(),
      },
    ];
  }

  private projectLinkType(
    value: any
  ): ProjectResolverProjectLink["projectType"] | null {
    const projectType = this.toNonEmptyString(value).toLowerCase();
    if (projectType === "market" || projectType === "project")
      return projectType;
    return null;
  }

  private confidenceScore(confidence: ProjectResolverConfidence): number {
    if (confidence === "exact") return 100;
    if (confidence === "high") return 90;
    if (confidence === "medium") return 70;
    if (confidence === "low") return 40;
    return 0;
  }

  private noProjectResolution(reason: string): ProjectResolverResult {
    return {
      projectId: null,
      confidence: "none",
      matchedBy: "none",
      reason,
    };
  }

  private withFundingRoundLink(item: any, indexes: FundingRoundIndexes): any {
    const projectSlug = this.normalizeMatchValue(item.projectSlug || item.slug);
    const projectName = this.normalizeName(item.projectName || item.name);
    const stage = this.normalizeName(item.round || item.stage);
    const dateKey = this.dateKey(item.date);
    const byProject = indexes.byProjectStageDate.get(
      this.roundKey(projectSlug, stage, dateKey)
    );
    const byName = indexes.byNameStageDate.get(
      this.roundKey(projectName, stage, dateKey)
    );
    const matched = byProject || byName;

    if (!matched) {
      return {
        ...item,
        matchedFundingRoundId: undefined,
        fundingRoundMatchMethod: "none",
        fundingRoundMatchConfidence: 0,
      };
    }

    return {
      ...item,
      matchedFundingRoundId: matched.id,
      fundingRoundMatchMethod: byProject
        ? "projectSlug+stage+date"
        : "projectName+stage+date",
      fundingRoundMatchConfidence: byProject ? 90 : 75,
    };
  }

  private async syncInvestorToBackerReadModel(
    investor: Partial<Investor>
  ): Promise<void> {
    const operation = this.buildInvestorToBackerReadModelOperation(investor);
    if (!operation) {
      return;
    }

    const targetModel =
      operation.target === "persons" ? this.personModel : this.fundsModel;
    await (targetModel as any).bulkWrite([operation.updateOne], { ordered: false });
  }

  private buildInvestorToBackerReadModelOperation(
    investor: Partial<Investor>
  ): { target: "funds" | "persons"; updateOne: any } | null {
    const target = this.isAngelInvestor(investor.type || "")
      ? "persons"
      : "funds";
    const filter = this.buildBackerFilter(investor);

    if (!filter) {
      return null;
    }

    const update =
      target === "persons"
        ? this.buildPersonReadModelUpdate(investor)
        : this.buildFundReadModelUpdate(investor);

    return {
      target,
      updateOne: {
        updateOne: {
          filter,
          update: {
            $set: update,
            $setOnInsert: {
              source: investor.source || "dropstab",
              sourceKey: this.investorSourceKey(investor),
              projectStatus: "active",
              status: "active",
              createdAt: new Date(),
            },
          },
          upsert: true,
        },
      },
    };
  }

  private buildBackerFilter(investor: Partial<Investor>): any | null {
    const or: any[] = [];
    const slug = this.toNonEmptyString(investor.slug);
    const name = this.toNonEmptyString(investor.name);
    const sourceKey = this.investorSourceKey(investor);

    if (slug) or.push({ slug });
    if (sourceKey) or.push({ sourceKey });
    if (name) or.push({ name });

    return or.length ? { $or: or } : null;
  }

  private buildFundReadModelUpdate(
    investor: Partial<Investor>
  ): Record<string, any> {
    const linkedProjectIds = this.linkedProjectIds(investor);
    const baseUpdate: Record<string, any> = this.cleanObject<
      Record<string, any>
    >({
      ...this.buildCommonBackerReadModelUpdate(investor),
      ...(linkedProjectIds.length ? { projects: linkedProjectIds } : {}),
    });
    const scores = this.fundsRatingService.calculateBackerScores(
      baseUpdate as any,
      investor as any
    );
    const projectsCount = this.fundsRatingService.getProjectsCount(
      baseUpdate as any,
      investor as any
    );

    return {
      ...baseUpdate,
      rating: String(scores.rating),
      fomoScore: scores.rating,
      fullness: `${scores.fullness}%`,
      tableRating: scores.rating,
      tableFullness: scores.fullness,
      tableRoi: this.toNumber(baseUpdate.roi),
      tableProjectsCount: projectsCount,
      tableSupportedProjectsCount: projectsCount,
      tableCountry: this.toNonEmptyString(baseUpdate.country),
      tableLastUpdatedAt: new Date(),
      ratingBreakdown: scores.ratingBreakdown,
      fullnessBreakdown: scores.fullnessBreakdown,
      lastRatingCalculatedAt: scores.ratingBreakdown.calculatedAt,
      projectsCount,
      supportedProjectsCount: projectsCount,
      syncedInvestorId: (investor as any)._id,
      syncedInvestorSource: investor.source || "dropstab",
      syncedInvestorAt: new Date(),
    };
  }

  private buildPersonReadModelUpdate(
    investor: Partial<Investor>
  ): Record<string, any> {
    const linkedProjectIds = this.linkedProjectIds(investor);
    const commonUpdate = this.buildCommonBackerReadModelUpdate(investor);
    const baseUpdate: Record<string, any> = this.cleanObject<
      Record<string, any>
    >({
      ...commonUpdate,
      ...(linkedProjectIds.length ? { participated: linkedProjectIds } : {}),
      ...(commonUpdate.portfolioCoins?.length
        ? { investmentPorfolio: commonUpdate.portfolioCoins }
        : {}),
    });
    const scores = this.personsRatingService.calculatePersonScores(
      baseUpdate as any
    );
    const projectsCount = this.personsRatingService.getProjectsCount(
      baseUpdate as any
    );
    const roi = this.toNumber(baseUpdate.roi);

    return {
      ...baseUpdate,
      rating: String(scores.rating),
      fomoScore: scores.rating,
      fullness: `${scores.fullness}%`,
      athRoi: roi ? String(roi) : "",
      highestRoi: roi ? String(roi) : "",
      tableRating: scores.rating,
      tableFullness: scores.fullness,
      tableRoi: roi,
      tableProjectsCount: projectsCount,
      tableSupportedProjectsCount: projectsCount,
      tableCountry: this.toNonEmptyString(baseUpdate.country),
      tableLastUpdatedAt: new Date(),
      ratingBreakdown: scores.ratingBreakdown,
      fullnessBreakdown: scores.fullnessBreakdown,
      lastRatingCalculatedAt: scores.ratingBreakdown.calculatedAt,
      syncedInvestorId: (investor as any)._id,
      syncedInvestorSource: investor.source || "dropstab",
      syncedInvestorAt: new Date(),
    };
  }

  private buildCommonBackerReadModelUpdate(
    investor: Partial<Investor>
  ): Record<string, any> {
    const stats = (investor.stats || {}) as Record<string, any>;
    const socialLinks = (investor.socialLinks || {}) as Record<string, any>;
    const portfolio = this.arrayValue(investor.portfolio);
    const fundraisingRounds = this.arrayValue(investor.fundraisingRounds);
    const coInvestors = this.arrayValue(investor.coInvestors);
    const avgPublicRoi = this.toNumber(stats.avgPublicRoi);
    const avgPrivateRoi = this.toNumber(stats.avgPrivateRoi);
    const latestRound = this.latestDate([
      investor.lastDetailParsedAt,
      ...fundraisingRounds.map((round: any) => round?.date),
      ...portfolio.map((project: any) => project?.lastRoundDate),
    ]);

    return this.cleanObject({
      name: investor.name,
      slug: investor.slug,
      logo: investor.logo,
      type: investor.type,
      niche: investor.type || "Investor",
      bio: investor.description,
      description: investor.description,
      country: investor.country || investor.location,
      websiteUrl: socialLinks.website || investor.website,
      twitterUrl: socialLinks.twitter,
      linkedinUrl: socialLinks.linkedin,
      crunchbaseUrl: socialLinks.crunchbase,
      website:
        socialLinks.website || investor.website
          ? [socialLinks.website || investor.website]
          : [],
      links: this.linksFromSocialLinks(socialLinks, investor.website),
      socialmedia: this.socialmediaFromSocialLinks(
        socialLinks,
        investor.website
      ),
      categories: this.arrayValue(investor.tags).length
        ? investor.tags
        : investor.sectors,
      totalInvestments:
        this.toNumber(stats.totalInvestments) ||
        portfolio.length ||
        fundraisingRounds.length,
      numberOfInvestments:
        this.toNumber(stats.totalInvestments) ||
        portfolio.length ||
        fundraisingRounds.length,
      portfolioCoinsCount:
        this.toNumber(stats.portfolioProjects) || portfolio.length,
      leadInvestments: this.toNumber(stats.leadInvestments),
      publicSalesCount: this.toNumber(stats.publicSalesCount),
      privateRoiPercent: avgPrivateRoi,
      retailRoiPercent: avgPublicRoi,
      averageRoi: avgPublicRoi || avgPrivateRoi,
      roi: avgPublicRoi || avgPrivateRoi,
      twitterScore: this.toNumber(stats.twitterScore),
      binanceListing: stats.binanceListed,
      dropstabId: this.toNumber(investor.sourceId),
      dropstabRank: this.toNumber(stats.rank),
      lastRoundDate: latestRound,
      lastFunding: latestRound ? latestRound.toISOString() : "",
      roundsByCategory: this.sectorsToRounds(investor.sectors),
      roundsByStage: this.roundsToStageBuckets(fundraisingRounds),
      coInvestors: coInvestors.map((item: any) => ({
        id: this.toNumber(item?.sourceId),
        investorSlug: this.toNonEmptyString(item?.slug),
        name: this.toNonEmptyString(item?.name),
        ventureType: this.toNonEmptyString(item?.type),
        image: this.toNonEmptyString(item?.logo),
        lastRoundDate: this.parseDate(item?.latestRound),
        count: this.toNumber(item?.investmentsCount),
      })),
      portfolioCoins: portfolio.map((item: any) => ({
        name: this.toNonEmptyString(item?.name),
        slug: this.toNonEmptyString(item?.slug || item?.projectSlug),
        symbol: this.toNonEmptyString(item?.symbol),
        image: this.toNonEmptyString(item?.logo),
        projectId: item?.projectId || item?.matchedProjectId,
        matchedProjectId: item?.matchedProjectId || item?.projectId,
        projectLinks: this.arrayValue(item?.projectLinks),
        matchMethod: this.toNonEmptyString(item?.matchMethod),
        matchConfidence: this.toOptionalNumber(item?.matchConfidence),
        lastRoundDate: this.parseDate(item?.date),
        roi: this.toOptionalNumber(item?.roi),
        price: this.toOptionalNumber(item?.price),
        status: this.toNonEmptyString(item?.status),
      })),
      actionDate: new Date(),
      investorSnapshot: {
        source: investor.source,
        sourceId: investor.sourceId,
        sourceKey: this.investorSourceKey(investor),
        lastSyncedAt: investor.lastSyncedAt,
        lastDetailParsedAt: investor.lastDetailParsedAt,
        stats,
      },
    });
  }

  private linkedProjectIds(investor: Partial<Investor>): Types.ObjectId[] {
    const byId = new Map<string, Types.ObjectId>();
    const items = [
      ...this.arrayValue(investor.portfolio),
      ...this.arrayValue(investor.fundraisingRounds),
    ];

    for (const item of items) {
      this.collectProjectId(byId, item?.projectId);
      this.collectProjectId(byId, item?.matchedProjectId);
      for (const link of this.arrayValue(item?.projectLinks)) {
        this.collectProjectId(byId, link?.projectId);
      }
    }

    return Array.from(byId.values());
  }

  private collectProjectId(
    target: Map<string, Types.ObjectId>,
    value: any
  ): void {
    const objectId = this.toObjectId(value);
    if (!objectId) return;
    target.set(objectId.toString(), objectId);
  }

  private investorSourceKey(investor: Partial<Investor>): string {
    return (
      this.toNonEmptyString((investor.sourceRefs as any)?.key) ||
      (investor.slug
        ? `${investor.source || "dropstab"}:investor:${investor.slug}`
        : "")
    );
  }

  private linksFromSocialLinks(
    socialLinks: Record<string, any>,
    website?: string
  ): Array<{ title: string; link: string; type: string }> {
    const entries = {
      website: socialLinks.website || website,
      twitter: socialLinks.twitter,
      linkedin: socialLinks.linkedin,
      crunchbase: socialLinks.crunchbase,
    };

    return Object.entries(entries)
      .filter(([, link]) => Boolean(link))
      .map(([type, link]) => ({
        title: type.charAt(0).toUpperCase() + type.slice(1),
        link: String(link),
        type,
      }));
  }

  private socialmediaFromSocialLinks(
    socialLinks: Record<string, any>,
    website?: string
  ): Array<{ href: string; icon: string; name: string }> {
    return this.linksFromSocialLinks(socialLinks, website).map((item) => ({
      href: item.link,
      icon: "",
      name: item.type,
    }));
  }

  private sectorsToRounds(
    sectors: any
  ): Array<{ name: string; amount: number; value: number }> {
    return this.arrayValue(sectors)
      .map((item: any) => ({
        name: this.toNonEmptyString(item?.name || item),
        amount: this.toNumber(item?.count),
        value: this.toNumber(item?.percent),
      }))
      .filter((item) => item.name);
  }

  private roundsToStageBuckets(
    rounds: any[]
  ): Array<{ name: string; amount: number; value: number }> {
    const buckets = new Map<string, number>();

    for (const round of rounds) {
      const name = this.toNonEmptyString(round?.round) || "Unknown";
      buckets.set(name, (buckets.get(name) || 0) + 1);
    }

    return Array.from(buckets.entries()).map(([name, amount]) => ({
      name,
      amount,
      value: amount,
    }));
  }

  private latestDate(values: any[]): Date | undefined {
    const timestamps = values
      .map((value) => this.parseDate(value)?.getTime())
      .filter((value): value is number => Number.isFinite(value));
    if (!timestamps.length) return undefined;

    return new Date(Math.max(...timestamps));
  }

  private async findExistingInvestor(
    investor: Partial<Investor>
  ): Promise<InvestorDocument | null> {
    const or: any[] = [];
    if (investor.slug)
      or.push({ source: investor.source, slug: investor.slug });
    if (investor.detailUrl)
      or.push({ source: investor.source, detailUrl: investor.detailUrl });
    if (!or.length && investor.normalizedName) {
      or.push({
        source: investor.source,
        normalizedName: investor.normalizedName,
      });
    }

    if (!or.length) {
      return null;
    }

    return this.investorModel.findOne({ $or: or }).lean() as any;
  }

  private buildNonEmptySet(investor: Partial<Investor>): Record<string, any> {
    const set: Record<string, any> = {};

    for (const [key, value] of Object.entries(investor)) {
      if (key === "_id" || value === undefined || value === null) continue;
      if (
        key === "lastSyncedAt" ||
        key === "syncSource" ||
        key === "syncVersion"
      ) {
        set[key] = value;
        continue;
      }
      if (!this.shouldSetValue(value)) continue;
      set[key] = value;
    }

    return set;
  }

  private async loadProjectIndexes(): Promise<ProjectIndexes> {
    const docs = await this.projectModel
      .find(
        {},
        {
          _id: 1,
          name: 1,
          slug: 1,
          projectType: 1,
          sourceId: 1,
          sourceUrl: 1,
          detailUrl: 1,
          "rawIcoData.slug": 1,
          "rawIcoData.sourceId": 1,
        }
      )
      .lean();

    const indexes: ProjectIndexes = {
      bySlug: new Map(),
      bySourceId: new Map(),
      byDetailUrl: new Map(),
      byName: new Map(),
    };

    for (const doc of docs) {
      const item: ProjectIndexItem = {
        id: doc._id,
        name: this.toNonEmptyString(doc.name),
        slug: this.toNonEmptyString(doc.slug || doc.rawIcoData?.slug),
        projectType: this.toNonEmptyString(doc.projectType),
        sourceId: this.toNonEmptyString(
          doc.sourceId || doc.rawIcoData?.sourceId
        ),
        detailUrl: this.toNonEmptyString(doc.detailUrl),
        sourceUrl: this.toNonEmptyString(doc.sourceUrl),
      };
      this.setIfAbsent(
        indexes.bySlug,
        this.normalizeMatchValue(item.slug),
        item
      );
      this.setIfAbsent(
        indexes.bySourceId,
        this.normalizeMatchValue(item.sourceId),
        item
      );
      this.setIfAbsent(
        indexes.byDetailUrl,
        this.normalizeDropstabProjectUrl(item.detailUrl || item.sourceUrl),
        item
      );
      this.setIfAbsent(indexes.byName, this.normalizeName(item.name), item);
    }

    return indexes;
  }

  private async loadFundingRoundIndexes(): Promise<FundingRoundIndexes> {
    const docs = await this.fundingRoundModel
      .find(
        { visible: true },
        {
          fundingRoundId: 1,
          projectSlug: 1,
          projectRouteId: 1,
          marketRouteId: 1,
          sourceSlug: 1,
          projectName: 1,
          roundName: 1,
          normalizedRoundName: 1,
          roundType: 1,
          normalizedRoundType: 1,
          fundingTypeKeys: 1,
          fundingDate: 1,
        },
      )
      .lean();
    const indexes: FundingRoundIndexes = {
      byProjectStageDate: new Map(),
      byNameStageDate: new Map(),
    };

    for (const doc of docs) {
      const fundingRoundId = this.toObjectId(doc.fundingRoundId);
      if (!fundingRoundId) continue;

      const item: FundingRoundIndexItem = {
        id: fundingRoundId,
        projectKeys: this.uniqueNonEmptyStrings(
          [
            doc.projectSlug,
            doc.projectRouteId,
            doc.marketRouteId,
            doc.sourceSlug,
          ].map((value) => this.normalizeMatchValue(value)),
        ),
        projectName: this.toNonEmptyString(doc.projectName),
        stageKeys: this.uniqueNonEmptyStrings(
          [
            doc.roundName,
            doc.normalizedRoundName,
            doc.roundType,
            doc.normalizedRoundType,
            ...this.arrayValue(doc.fundingTypeKeys),
          ].map((value) => this.normalizeName(value)),
        ),
        date: this.parseDate(doc.fundingDate),
      };
      const dateKey = this.dateKey(item.date);

      for (const stageKey of item.stageKeys) {
        for (const projectKey of item.projectKeys) {
          this.setFundingRoundIndex(
            indexes.byProjectStageDate,
            this.roundKey(projectKey, stageKey, dateKey),
            item,
          );
        }
        this.setFundingRoundIndex(
          indexes.byNameStageDate,
          this.roundKey(
            this.normalizeName(item.projectName),
            stageKey,
            dateKey,
          ),
          item,
        );
      }
    }

    return indexes;
  }

  private async ensureIndexes(): Promise<void> {
    await Promise.allSettled([
      this.investorModel.collection.createIndex(
        { source: 1, slug: 1 },
        {
          unique: true,
          sparse: true,
          name: "investors_source_slug_unique",
          partialFilterExpression: {
            source: { $type: "string" },
            slug: { $type: "string" },
          },
        }
      ),
      this.investorModel.collection.createIndex(
        { source: 1, detailUrl: 1 },
        {
          unique: true,
          sparse: true,
          name: "investors_source_detail_url_unique",
          partialFilterExpression: {
            source: { $type: "string" },
            detailUrl: { $type: "string" },
          },
        }
      ),
      this.investorModel.collection.createIndex(
        { normalizedName: 1 },
        { name: "investors_normalized_name_idx" }
      ),
      this.investorModel.collection.createIndex(
        { lastDetailParsedAt: -1 },
        { name: "investors_last_detail_parsed_idx" }
      ),
      this.investorModel.collection.createIndex(
        { lastSyncedAt: -1 },
        { name: "investors_last_synced_idx" }
      ),
    ]);
  }

  private async countPortfolioLinks(linked: boolean): Promise<number> {
    const rows = await this.investorModel
      .aggregate([
        { $match: { source: "dropstab", "portfolio.0": { $exists: true } } },
        { $unwind: "$portfolio" },
        {
          $match: linked
            ? { "portfolio.matchedProjectId": { $exists: true, $ne: null } }
            : {
                $or: [
                  { "portfolio.matchedProjectId": { $exists: false } },
                  { "portfolio.matchedProjectId": null },
                ],
              },
        },
        { $count: "count" },
      ])
      .exec();

    return rows[0]?.count || 0;
  }

  private async duplicateGroups(field: string): Promise<any[]> {
    return this.investorModel
      .aggregate([
        { $match: { source: "dropstab", [field]: { $exists: true, $ne: "" } } },
        {
          $group: {
            _id: `$${field}`,
            count: { $sum: 1 },
            examples: {
              $push: { name: "$name", slug: "$slug", detailUrl: "$detailUrl" },
            },
          },
        },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 50 },
        {
          $project: {
            _id: 0,
            value: "$_id",
            count: 1,
            examples: { $slice: ["$examples", 10] },
          },
        },
      ])
      .exec();
  }

  private async normalizedNameCollisions(): Promise<any[]> {
    return this.investorModel
      .aggregate([
        {
          $match: {
            source: "dropstab",
            normalizedName: { $exists: true, $ne: "" },
          },
        },
        {
          $group: {
            _id: "$normalizedName",
            count: { $sum: 1 },
            slugs: { $addToSet: "$slug" },
            examples: { $push: { name: "$name", slug: "$slug" } },
          },
        },
        { $match: { count: { $gt: 1 }, "slugs.1": { $exists: true } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 50 },
        {
          $project: {
            _id: 0,
            normalizedName: "$_id",
            count: 1,
            examples: { $slice: ["$examples", 10] },
          },
        },
      ])
      .exec();
  }

  private async breakdown(field: string): Promise<Record<string, number>> {
    const rows = await this.investorModel
      .aggregate([
        { $match: { source: "dropstab" } },
        {
          $group: {
            _id: { $ifNull: [`$${field}`, "unknown"] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ])
      .exec();

    return rows.reduce((acc, row) => {
      acc[String(row._id || "unknown")] = row.count || 0;
      return acc;
    }, {} as Record<string, number>);
  }

  private buildAuditRecommendations(input: {
    sourceInvestorsAvailable: number;
    syncedInvestors: number;
    staleSyncedInvestors: number;
    duplicatesBySlugCount: number;
    duplicatesByDetailUrlCount: number;
    normalizedNameCollisionsCount: number;
    unlinkedPortfolioProjects: number;
  }): string[] {
    const recommendations: string[] = [];
    if (!input.sourceInvestorsAvailable) {
      recommendations.push(
        "Source sync-status is unavailable; verify INTEL_API_BASE_URL or DROPSTAB_INVESTORS_API_URL."
      );
    }
    if (
      input.sourceInvestorsAvailable &&
      input.syncedInvestors < input.sourceInvestorsAvailable
    ) {
      recommendations.push(
        "Continue bounded rollout with --only-with-details=true and small --limit batches."
      );
    }
    if (input.staleSyncedInvestors > 0) {
      recommendations.push(
        "Run an updated-since batch for stale investors after source details parsing advances."
      );
    }
    if (
      input.duplicatesBySlugCount ||
      input.duplicatesByDetailUrlCount ||
      input.normalizedNameCollisionsCount
    ) {
      recommendations.push(
        "Review duplicate groups manually; do not auto-merge normalized name collisions."
      );
    }
    if (input.unlinkedPortfolioProjects > 0) {
      recommendations.push(
        "Improve source project slug/detailUrl mappings before using portfolio links for analytics."
      );
    }
    if (!recommendations.length) {
      recommendations.push("No immediate sync issues detected.");
    }
    return recommendations;
  }

  private getInvestorsApiUrl(explicitUrl?: string): string {
    const configured =
      explicitUrl ||
      this.configService.get<string>("DROPSTAB_INVESTORS_API_URL");
    if (configured) {
      return configured;
    }

    const baseUrl = this.configService.get<string>("INTEL_API_BASE_URL");
    if (baseUrl) {
      return `${baseUrl.replace(/\/+$/, "")}/intel/investors`;
    }

    return "http://localhost:8001/api/intel/investors";
  }

  private getSourceStatusUrl(): string {
    const baseUrl = this.configService.get<string>("INTEL_API_BASE_URL");
    if (baseUrl) {
      return `${baseUrl.replace(/\/+$/, "")}/dropstab/investors/sync-status`;
    }

    const investorsUrl = this.getInvestorsApiUrl();
    return investorsUrl.replace(
      /\/intel\/investors(?:\?.*)?$/,
      "/dropstab/investors/sync-status"
    );
  }

  private getApiTimeoutMs(): number {
    return Math.max(
      1000,
      Number(
        this.configService.get("DROPSTAB_INVESTORS_SYNC_TIMEOUT_MS") || 30000
      )
    );
  }

  private normalizeLimit(value?: number): number {
    const parsed = Number(
      value || this.configService.get("DROPSTAB_INVESTORS_SYNC_LIMIT") || 100
    );
    return Number.isFinite(parsed) && parsed > 0
      ? Math.min(Math.floor(parsed), 500)
      : 100;
  }

  private normalizeOffset(value?: number): number {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
  }

  private normalizeCountry(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value.trim();
    return (
      this.toNonEmptyString(value.name) || this.toNonEmptyString(value.title)
    );
  }

  private arrayValue(value: any): any[] {
    return Array.isArray(value) ? value : [];
  }

  private cleanObject<T extends Record<string, any>>(value: T): T {
    if (!value || typeof value !== "object") return value;
    const result: Record<string, any> = {};
    for (const [key, item] of Object.entries(value)) {
      const sanitized = this.sanitize(item);
      if (sanitized === undefined) continue;
      if (typeof sanitized === "string" && !sanitized.trim()) continue;
      if (Array.isArray(sanitized) && !sanitized.length) continue;
      if (
        sanitized &&
        typeof sanitized === "object" &&
        !Array.isArray(sanitized) &&
        !(sanitized instanceof Date) &&
        !this.isObjectIdLike(sanitized) &&
        !Object.keys(sanitized).length
      ) {
        continue;
      }
      result[key] = sanitized;
    }
    return result as T;
  }

  private sanitize(value: any): any {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value === "number")
      return Number.isFinite(value) ? value : undefined;
    if (value instanceof Date)
      return Number.isNaN(value.getTime()) ? undefined : value;
    if (this.isObjectIdLike(value)) return value;
    if (Array.isArray(value))
      return value
        .map((item) => this.sanitize(item))
        .filter((item) => item !== undefined);
    if (typeof value === "object") return this.cleanObject(value);
    return value;
  }

  private isObjectIdLike(value: any): boolean {
    return value instanceof Types.ObjectId || value?._bsontype === "ObjectId";
  }

  private toObjectId(value: any): Types.ObjectId | null {
    if (!value) return null;
    if (value instanceof Types.ObjectId) return value;
    if (value?._bsontype === "ObjectId")
      return new Types.ObjectId(value.toString());
    const asString = this.toNonEmptyString(value);
    return asString && Types.ObjectId.isValid(asString)
      ? new Types.ObjectId(asString)
      : null;
  }

  private shouldSetValue(value: any): boolean {
    if (value === undefined || value === null) return false;
    if (value instanceof Date) return !Number.isNaN(value.getTime());
    if (this.isObjectIdLike(value)) return true;
    if (typeof value === "string") return Boolean(value.trim());
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  }

  private parseDate(value: any): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date)
      return Number.isNaN(value.getTime()) ? undefined : value;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  private dateKey(value: any): string {
    const date = this.parseDate(value);
    return date ? date.toISOString().slice(0, 10) : "";
  }

  private roundKey(project: string, stage: string, date: string): string {
    if (!project || !stage || !date) return "";
    return [project, stage, date].join("|");
  }

  private setFundingRoundIndex(
    map: Map<string, FundingRoundIndexItem | null>,
    key: string,
    item: FundingRoundIndexItem,
  ): void {
    if (!key) return;
    if (!map.has(key)) {
      map.set(key, item);
      return;
    }

    const existing = map.get(key);
    if (existing && existing.id.toHexString() === item.id.toHexString()) return;

    // A composite key that identifies multiple rounds is unsafe for linking.
    map.set(key, null);
  }

  private uniqueNonEmptyStrings(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
  }

  private slugFromUrl(value: string): string {
    const match = String(value || "").match(/\/(?:coins|ico)\/([^/?#]+)/i);
    return match?.[1] || "";
  }

  private normalizeDropstabInvestorUrl(value: any): string {
    const raw = this.toNonEmptyString(value);
    if (!raw) return "";
    const withHost = raw.startsWith("/") ? `https://dropstab.com${raw}` : raw;
    return withHost
      .replace(/^http:\/\//i, "https://")
      .replace("/investor/", "/investors/")
      .replace(/\/+$/, "");
  }

  private normalizeDropstabProjectUrl(value: any): string {
    const raw = this.toNonEmptyString(value);
    if (!raw) return "";
    const withHost = raw.startsWith("/") ? `https://dropstab.com${raw}` : raw;
    return withHost.replace(/^http:\/\//i, "https://").replace(/\/+$/, "");
  }

  private normalizeMatchValue(value: any): string {
    return this.toNonEmptyString(value).toLowerCase();
  }

  private normalizeName(value: any): string {
    return this.toNonEmptyString(value)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private isAngelInvestor(type: string): boolean {
    return /angel investor/i.test(this.toNonEmptyString(type));
  }

  private toNonEmptyString(value: any): string {
    if (typeof value === "number" && Number.isFinite(value))
      return String(value);
    return typeof value === "string" ? value.trim() : "";
  }

  private toNumber(value: any): number {
    if (value === undefined || value === null || value === "") return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;

    const parsed = Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private toOptionalNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed =
      typeof value === "number"
        ? value
        : Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private slugify(value: string): string {
    return this.toNonEmptyString(value)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private setIfAbsent<T>(map: Map<string, T>, key: string, value: T): void {
    if (!key || map.has(key)) return;
    map.set(key, value);
  }
}
