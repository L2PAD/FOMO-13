import { Injectable, Logger, OnModuleInit, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import axios from "axios";
import { Model, Types } from "mongoose";
import { IntelSyncWorkerRunnerService } from "src/intel-sync/intel-sync-worker-runner.service";
import {
  IntelSyncTrigger,
  IntelSyncWorkerLaunchResult,
} from "src/intel-sync/intel-sync.types";
import { Funds, FundsDocument } from "./funds.model";
import { FundsRatingService } from "./funds-rating.service";
import { Person, PersonDocument } from "src/persons/person.model";
import { PersonsRatingService } from "src/persons/persons-rating.service";
import { FomoV2ParserControlPolicyService } from "src/fomo-v2/domains/parser-control";

interface IntelInvestorApiItem {
  key?: string;
  externalId?: string | number;
  id?: string | number;
  source?: string;
  name?: string;
  slug?: string;
  tier?: string | number | Record<string, any>;
  type?: string;
  ventureType?: string;
  category?: string | Record<string, any>;
  image?: string;
  logo?: string;
  investments_count?: number | string;
  totalInvestments?: number | string;
  portfolio_value?: number | string;
  website?: string;
  twitter?: string;
  twitterUrl?: string;
  linkedin?: string;
  linkedinUrl?: string;
  crunchbase?: string;
  crunchbaseUrl?: string;
  description?: string;
  rank?: number | string;
  rating?: number | string;
  lead?: boolean;
  leadInvestments?: number | string;
  publicSalesCount?: number | string;
  roundsPerYear?: number | string;
  twitterScore?: number | string;
  lastRoundDate?: string | Date | number;
  saleIds?: Array<number | string>;
  country?: string | Record<string, any>;
  links?: any[];
  avgPrivateRoi?: Record<string, any>;
  avgPublicRoi?: Record<string, any>;
  binanceListed?: Record<string, any>;
  coInvestments?: any[];
  portfolioProjects?: any[];
  roundsDistribution?: Record<string, any>;
  rounds_count?: number | string;
  total_invested?: number | string;
  projects?: any[];
  first_seen?: string | Date;
  last_seen?: string | Date;
  updated_at?: string | Date;
  raw?: any;
}

interface IntelInvestorsApiResponse {
  total?: number;
  limit?: number;
  offset?: number;
  investors?: IntelInvestorApiItem[];
}

type TargetCollection = "funds" | "persons";

interface FundsIntelInvestorsSyncOptions {
  force?: boolean;
}

interface ExistingEntityRef {
  _id?: Types.ObjectId;
  collection: TargetCollection;
  sourceKey?: string;
  slug?: string;
  name?: string;
}

interface ExistingEntityIndexes {
  bySourceKey: Map<string, ExistingEntityRef[]>;
  bySlug: Map<string, ExistingEntityRef[]>;
  byName: Map<string, ExistingEntityRef[]>;
  byWebsite: Map<string, ExistingEntityRef[]>;
  byTwitter: Map<string, ExistingEntityRef[]>;
}

interface NormalizedIntelInvestor {
  source: string;
  sourceKey: string;
  externalId: string;
  name: string;
  slug: string;
  type: string;
  ventureType: string;
  category: string;
  image: string;
  websiteUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  crunchbaseUrl: string;
  description: string;
  tier: string;
  rank: number;
  rating: number;
  isLeadInvestor: boolean;
  leadInvestments: number;
  publicSalesCount: number;
  roundsPerYear: number;
  twitterScore: number;
  investmentsCount: number;
  portfolioValue: number;
  totalInvested: number;
  portfolioCount: number;
  lastRoundDate?: Date;
  saleIds: Array<number | string>;
  countryName: string;
  countryFlag: string;
  privateRoiPercent: number;
  retailRoiPercent: number;
  binanceListing: Record<string, any>;
  roundsByCategory: Array<{ name: string; amount: number; value: number }>;
  roundsByStage: Array<{ name: string; amount: number; value: number }>;
  coInvestors: Array<{
    id: number;
    investorSlug: string;
    name: string;
    ventureType: string;
    image: string;
    lastRoundDate?: Date;
    count: number;
  }>;
  portfolioCoins: Array<{
    name: string;
    slug: string;
    symbol: string;
    image: string;
    currencyId?: number;
    lastRoundDate?: Date;
    fundsRaised?: number;
    marketCap?: number;
    roi?: number;
    price?: number;
    status?: string;
  }>;
  sourceLinks: Array<{ title: string; link: string; type: string }>;
  intelInvestorData: Record<string, any>;
  firstSeen?: Date;
  lastSeen?: Date;
  updatedAt: Date;
  targetCollection: TargetCollection;
}

@Injectable()
export class FundsIntelInvestorsSyncService implements OnModuleInit {
  private readonly logger = new Logger(FundsIntelInvestorsSyncService.name);
  private readonly batchSize: number;
  private readonly apiPageSize: number;
  private readonly apiTimeoutMs: number;
  private syncInProgress = false;

  constructor(
    @InjectModel(Funds.name)
    private readonly fundsModel: Model<FundsDocument>,
    @InjectModel(Person.name)
    private readonly personModel: Model<PersonDocument>,
    private readonly configService: ConfigService,
    private readonly intelSyncWorkerRunnerService: IntelSyncWorkerRunnerService,
    private readonly fundsRatingService: FundsRatingService,
    private readonly personsRatingService: PersonsRatingService,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService,
  ) {
    this.batchSize = Math.max(
      50,
      Number(this.configService.get("FUNDS_INTEL_INVESTORS_SYNC_BATCH_SIZE") || 250),
    );
    this.apiPageSize = Math.min(
      500,
      Math.max(
        50,
        Number(this.configService.get("FUNDS_INTEL_INVESTORS_API_LIMIT") || 200),
      ),
    );
    this.apiTimeoutMs = Math.max(
      1000,
      Number(
        this.configService.get("FUNDS_INTEL_INVESTORS_API_TIMEOUT_MS") || 30000,
      ),
    );
  }

  onModuleInit() {
    if (this.isWorkerProcess()) {
      return;
    }

    if (!this.isStartupSyncEnabled()) {
      this.logger.log("Startup sync for intel investors is disabled");
      return;
    }

    setTimeout(() => {
      void this.syncFromIntelInvestors("startup");
    }, 0);
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  async syncFromIntelInvestorsCron(): Promise<void> {
    await this.syncFromIntelInvestors("cron");
  }

  async syncFromIntelInvestors(
    trigger: IntelSyncTrigger,
    options: FundsIntelInvestorsSyncOptions = {},
  ): Promise<
    | IntelSyncWorkerLaunchResult
    | {
        trigger: string;
        skipped: boolean;
        processed: number;
        fundsWritten: number;
        personsWritten: number;
      }
  > {
    if (
      this.parserControlPolicy &&
      !(await this.parserControlPolicy.canWriteDomainData("backers:intel"))
    ) {
      return {
        trigger,
        skipped: true,
        processed: 0,
        fundsWritten: 0,
        personsWritten: 0,
      };
    }
    if (!options.force && !this.isSyncEnabled()) {
      this.logger.log(`Intel investors sync skipped for ${trigger}: disabled`);
      return {
        trigger,
        skipped: true,
        processed: 0,
        fundsWritten: 0,
        personsWritten: 0,
      };
    }

    if (!this.isWorkerProcess() && !options.force) {
      return this.intelSyncWorkerRunnerService.runJob(
        "funds-intel-investors",
        trigger,
      );
    }

    return this.executeSyncFromIntelInvestors(trigger, options);
  }

  async executeSyncFromIntelInvestors(
    trigger: IntelSyncTrigger,
    options: FundsIntelInvestorsSyncOptions = {},
  ): Promise<{
    trigger: string;
    skipped: boolean;
    processed: number;
    fundsWritten: number;
    personsWritten: number;
  }> {
    if (this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed("backers:intel");
    }
    if (!options.force && !this.isSyncEnabled()) {
      this.logger.log(`Intel investors sync skipped for ${trigger}: disabled`);
      return {
        trigger,
        skipped: true,
        processed: 0,
        fundsWritten: 0,
        personsWritten: 0,
      };
    }

    if (this.syncInProgress) {
      this.logger.warn(
        `Intel investors sync skipped for ${trigger}: previous sync is still running`,
      );
      return {
        trigger,
        skipped: true,
        processed: 0,
        fundsWritten: 0,
        personsWritten: 0,
      };
    }

    this.syncInProgress = true;

    try {
      this.logger.log(
        `Starting intel investors sync (${trigger}) from ${this.getApiUrl()}`,
      );

      const indexes = await this.loadExistingIndexes();
      let offset = 0;
      let total = Number.MAX_SAFE_INTEGER;
      let processed = 0;
      let fundsWritten = 0;
      let personsWritten = 0;
      let fundOperations: any[] = [];
      let personOperations: any[] = [];

      while (offset < total) {
        const page = await this.fetchInvestorsPage(offset);
        const sourceInvestors = Array.isArray(page.investors) ? page.investors : [];
        total = Number(page.total || sourceInvestors.length);

        if (!sourceInvestors.length) {
          if (!processed) {
            this.logger.warn(
              `Intel investors sync skipped for ${trigger}: API returned no investors`,
            );
          }
          break;
        }

        for (const sourceInvestor of sourceInvestors) {
          const normalizedInvestor = this.normalizeInvestor(sourceInvestor);

          if (!normalizedInvestor) {
            continue;
          }

          const targetEntity = this.findEntityInCollection(
            normalizedInvestor,
            indexes,
            normalizedInvestor.targetCollection,
          );
          const existingEntity =
            targetEntity || this.findExistingEntity(normalizedInvestor, indexes);
          const destination = normalizedInvestor.targetCollection;

          if (
            existingEntity?._id &&
            existingEntity.collection !== destination
          ) {
            const deleteOperation = {
              deleteOne: {
                filter: { _id: existingEntity._id },
              },
            };

            if (existingEntity.collection === "persons") {
              personOperations.push(deleteOperation);
            } else {
              fundOperations.push(deleteOperation);
            }
          }

          const operation = this.buildOperation(
            destination,
            normalizedInvestor,
            targetEntity,
          );

          if (destination === "persons") {
            personOperations.push(operation);
          } else {
            fundOperations.push(operation);
          }

          this.registerEntity(indexes, {
            collection: destination,
            _id: existingEntity?._id,
            sourceKey: normalizedInvestor.sourceKey,
            slug: normalizedInvestor.slug,
            name: normalizedInvestor.name,
          }, normalizedInvestor);

          processed += 1;

          if (fundOperations.length + personOperations.length >= this.batchSize) {
            fundsWritten += await this.flushOperations(this.fundsModel, fundOperations);
            personsWritten += await this.flushOperations(
              this.personModel,
              personOperations,
            );
            fundOperations = [];
            personOperations = [];
          }
        }

        offset += sourceInvestors.length;
      }

      fundsWritten += await this.flushOperations(this.fundsModel, fundOperations);
      personsWritten += await this.flushOperations(this.personModel, personOperations);

      this.logger.log(
        `Intel investors sync finished (${trigger}), processed: ${processed}, funds written: ${fundsWritten}, persons written: ${personsWritten}`,
      );

      return {
        trigger,
        skipped: false,
        processed,
        fundsWritten,
        personsWritten,
      };
    } catch (error) {
      this.logger.error(
        `Intel investors sync failed during ${trigger}: ${error.message}`,
        error.stack,
      );
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async fetchInvestorsPage(
    offset: number,
  ): Promise<IntelInvestorsApiResponse> {
    const response = await axios.get<IntelInvestorsApiResponse>(this.getApiUrl(), {
      params: {
        limit: this.apiPageSize,
        offset,
      },
      timeout: this.apiTimeoutMs,
    });

    return response.data || {};
  }

  private async loadExistingIndexes(): Promise<ExistingEntityIndexes> {
    const [funds, persons] = await Promise.all([
      this.fundsModel
        .find(
          {},
          {
            _id: 1,
            sourceKey: 1,
            slug: 1,
            name: 1,
            website: 1,
            socialmedia: 1,
            links: 1,
          },
        )
        .lean(),
      this.personModel
        .find(
          {},
          {
            _id: 1,
            sourceKey: 1,
            slug: 1,
            name: 1,
            website: 1,
            socialmedia: 1,
            links: 1,
          },
        )
        .lean(),
    ]);

    const indexes: ExistingEntityIndexes = {
      bySourceKey: new Map(),
      bySlug: new Map(),
      byName: new Map(),
      byWebsite: new Map(),
      byTwitter: new Map(),
    };

    for (const fund of funds) {
      this.registerExistingDocument(indexes, fund, "funds");
    }

    for (const person of persons) {
      this.registerExistingDocument(indexes, person, "persons");
    }

    return indexes;
  }

  private registerExistingDocument(
    indexes: ExistingEntityIndexes,
    doc: any,
    collection: TargetCollection,
  ) {
    const entityRef: ExistingEntityRef = {
      _id: doc._id,
      collection,
      sourceKey: this.toNonEmptyString(doc.sourceKey),
      slug: this.toNonEmptyString(doc.slug),
      name: this.toNonEmptyString(doc.name),
    };

    this.registerEntity(indexes, entityRef, {
      sourceKey: entityRef.sourceKey || "",
      name: entityRef.name || "",
      slug: entityRef.slug || "",
      websiteUrl: this.extractWebsiteUrl(doc),
      twitterUrl: this.extractTwitterUrl(doc),
    });
  }

  private registerEntity(
    indexes: ExistingEntityIndexes,
    entityRef: ExistingEntityRef,
    investor: Pick<
      NormalizedIntelInvestor,
      "sourceKey" | "slug" | "name" | "websiteUrl" | "twitterUrl"
    >,
  ) {
    this.addIndexedValue(indexes.bySourceKey, investor.sourceKey, entityRef);
    this.addIndexedValue(indexes.bySlug, investor.slug, entityRef);
    this.addIndexedValue(indexes.byName, investor.name, entityRef);
    this.addIndexedValue(indexes.byWebsite, investor.websiteUrl, entityRef);
    this.addIndexedValue(indexes.byTwitter, investor.twitterUrl, entityRef);
  }

  private addIndexedValue(
    map: Map<string, ExistingEntityRef[]>,
    rawValue: string,
    entityRef: ExistingEntityRef,
  ) {
    const value = this.normalizeMatchValue(rawValue);
    if (!value) {
      return;
    }

    const items = map.get(value) || [];
    const alreadyExists = items.some(
      (item) =>
        item.collection === entityRef.collection &&
        String(item._id || item.sourceKey || item.slug || item.name) ===
        String(entityRef._id || entityRef.sourceKey || entityRef.slug || entityRef.name),
    );

    if (!alreadyExists) {
      items.push(entityRef);
      map.set(value, items);
    }
  }

  private findExistingEntity(
    investor: NormalizedIntelInvestor,
    indexes: ExistingEntityIndexes,
  ): ExistingEntityRef | undefined {
    const preferredCollections: TargetCollection[] =
      investor.targetCollection === "persons"
        ? ["persons", "funds"]
        : ["funds", "persons"];

    return (
      this.findPreferredEntity(
        indexes.bySourceKey.get(this.normalizeMatchValue(investor.sourceKey)),
        preferredCollections,
      ) ||
      this.findPreferredEntity(
        indexes.bySlug.get(this.normalizeMatchValue(investor.slug)),
        preferredCollections,
      ) ||
      this.findPreferredEntity(
        indexes.byTwitter.get(this.normalizeMatchValue(investor.twitterUrl)),
        preferredCollections,
      ) ||
      this.findPreferredEntity(
        indexes.byWebsite.get(this.normalizeMatchValue(investor.websiteUrl)),
        preferredCollections,
      ) ||
      this.findPreferredEntity(
        indexes.byName.get(this.normalizeMatchValue(investor.name)),
        preferredCollections,
      )
    );
  }

  private findEntityInCollection(
    investor: NormalizedIntelInvestor,
    indexes: ExistingEntityIndexes,
    collection: TargetCollection,
  ): ExistingEntityRef | undefined {
    return (
      this.findPreferredEntity(
        indexes.bySourceKey.get(this.normalizeMatchValue(investor.sourceKey)),
        [collection],
      ) ||
      this.findPreferredEntity(
        indexes.bySlug.get(this.normalizeMatchValue(investor.slug)),
        [collection],
      ) ||
      this.findPreferredEntity(
        indexes.byTwitter.get(this.normalizeMatchValue(investor.twitterUrl)),
        [collection],
      ) ||
      this.findPreferredEntity(
        indexes.byWebsite.get(this.normalizeMatchValue(investor.websiteUrl)),
        [collection],
      ) ||
      this.findPreferredEntity(
        indexes.byName.get(this.normalizeMatchValue(investor.name)),
        [collection],
      )
    );
  }

  private findPreferredEntity(
    items: ExistingEntityRef[] | undefined,
    preferredCollections: TargetCollection[],
  ): ExistingEntityRef | undefined {
    if (!items?.length) {
      return undefined;
    }

    for (const collection of preferredCollections) {
      const matchedItem = items.find((item) => item.collection === collection);
      if (matchedItem) {
        return matchedItem;
      }
    }

    return items[0];
  }

  private buildOperation(
    destination: TargetCollection,
    investor: NormalizedIntelInvestor,
    existingEntity?: ExistingEntityRef,
  ) {
    const filter = existingEntity?._id
      ? { _id: existingEntity._id }
      : investor.sourceKey
        ? { sourceKey: investor.sourceKey }
        : investor.slug
          ? { slug: investor.slug }
          : { name: investor.name };

    const update =
      destination === "persons"
        ? this.buildPersonUpdate(investor)
        : this.buildFundUpdate(investor);

    return {
      updateOne: {
        filter,
        update: {
          $set: update,
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    };
  }

  private buildFundUpdate(investor: NormalizedIntelInvestor): Partial<Funds> {
    const categoryList = investor.category ? [investor.category] : [];
    const roi = investor.retailRoiPercent || investor.privateRoiPercent || 0;
    const links = this.buildLinks(
      investor.websiteUrl,
      investor.twitterUrl,
      investor.linkedinUrl,
      investor.crunchbaseUrl,
      investor.sourceLinks,
    );
    const socialmedia = this.buildSocialmedia(
      investor.websiteUrl,
      investor.twitterUrl,
      investor.linkedinUrl,
      investor.crunchbaseUrl,
    );

    const update: Partial<Funds> = {
      source: investor.source,
      sourceKey: investor.sourceKey,
      projectStatus: "active",
      status: "active",
      name: investor.name,
      slug: investor.slug,
      logo: investor.image,
      type: investor.ventureType || investor.type,
      niche: investor.category || investor.ventureType || investor.type || "Investor",
      bio: investor.description,
      tier: investor.tier,
      rating: investor.rating ? String(investor.rating) : "",
      websiteUrl: investor.websiteUrl,
      twitterUrl: investor.twitterUrl,
      linkedinUrl: investor.linkedinUrl,
      crunchbaseUrl: investor.crunchbaseUrl,
      website: investor.websiteUrl ? [investor.websiteUrl] : [],
      links,
      socialmedia,
      categories: categoryList,
      investments: String(investor.investmentsCount || 0),
      totalInvestments: investor.investmentsCount,
      numberOfInvestments: investor.investmentsCount,
      portfolioCoinsCount: investor.portfolioCount,
      currentAum: investor.portfolioValue,
      leadInvestments: investor.leadInvestments,
      publicSalesCount: investor.publicSalesCount,
      roi,
      averageRoi: roi,
      privateRoiPercent: investor.privateRoiPercent,
      retailRoiPercent: investor.retailRoiPercent,
      twitterScore: investor.twitterScore,
      binanceListing: investor.binanceListing,
      dropstabId: this.toNumber(investor.externalId),
      dropstabRank: investor.rank,
      country: investor.countryName,
      countryFlag: investor.countryFlag,
      lastRoundDate: investor.lastRoundDate,
      saleIds: investor.saleIds,
      isLeadInvestor: investor.isLeadInvestor,
      roundsByCategory: investor.roundsByCategory,
      roundsByStage: investor.roundsByStage,
      coInvestors: investor.coInvestors,
      portfolioCoins: investor.portfolioCoins,
      foundedDate: investor.firstSeen,
      lastFunding: this.toIsoString(
        investor.lastRoundDate || investor.lastSeen || investor.updatedAt,
      ),
      totalRaised: String(investor.totalInvested || 0),
      actionDate: new Date(),
      isSponsored: false,
      intelInvestorData: investor.intelInvestorData,
    };
    const scores = this.fundsRatingService.calculateBackerScores(update as any);
    const projectsCount = this.fundsRatingService.getProjectsCount(update as any);

    return {
      ...update,
      rating: String(scores.rating),
      fomoScore: scores.rating,
      fullness: `${scores.fullness}%`,
      tableRating: scores.rating,
      tableFullness: scores.fullness,
      tableRoi: roi,
      tableProjectsCount: projectsCount,
      tableSupportedProjectsCount: projectsCount,
      tableCountry: investor.countryName,
      tableLastUpdatedAt: new Date(),
      ratingBreakdown: scores.ratingBreakdown,
      fullnessBreakdown: scores.fullnessBreakdown,
      lastRatingCalculatedAt: scores.ratingBreakdown.calculatedAt,
      projectsCount,
      supportedProjectsCount: projectsCount,
    };
  }

  private buildPersonUpdate(investor: NormalizedIntelInvestor): Partial<Person> {
    const categoryList = investor.category ? [investor.category] : [];
    const roi = investor.retailRoiPercent || investor.privateRoiPercent || 0;
    const links = this.buildLinks(
      investor.websiteUrl,
      investor.twitterUrl,
      investor.linkedinUrl,
      investor.crunchbaseUrl,
      investor.sourceLinks,
    );
    const socialmedia = this.buildSocialmedia(
      investor.websiteUrl,
      investor.twitterUrl,
      investor.linkedinUrl,
      investor.crunchbaseUrl,
    );

    const personUpdate = {
      source: investor.source,
      sourceKey: investor.sourceKey,
      projectStatus: "active",
      status: "active",
      name: investor.name,
      slug: investor.slug,
      logo: investor.image,
      type: investor.ventureType || investor.type,
      niche: investor.category || investor.ventureType || investor.type || "Angel Investor",
      bio: investor.description,
      descriptionText: investor.description,
      tier: investor.tier,
      rating: investor.rating ? String(investor.rating) : "",
      tableRating: investor.rating,
      tableFullness: 0,
      tableRoi: roi,
      tableProjectsCount: investor.investmentsCount,
      tableSupportedProjectsCount: investor.portfolioCount,
      tableCountry: investor.countryName,
      tableLastUpdatedAt: new Date(),
      websiteUrl: investor.websiteUrl,
      twitterUrl: investor.twitterUrl,
      linkedinUrl: investor.linkedinUrl,
      crunchbaseUrl: investor.crunchbaseUrl,
      website: investor.websiteUrl ? [investor.websiteUrl] : [],
      links,
      socialmedia,
      categories: categoryList,
      investments: String(investor.investmentsCount || 0),
      totalInvestments: investor.investmentsCount,
      portfolioCoinsCount: investor.portfolioCount,
      leadInvestments: investor.leadInvestments,
      publicSalesCount: investor.publicSalesCount,
      roi,
      averageRoi: roi,
      athRoi: roi ? String(roi) : "",
      highestRoi: roi ? String(roi) : "",
      privateRoiPercent: investor.privateRoiPercent,
      retailRoiPercent: investor.retailRoiPercent,
      twitterScore: investor.twitterScore,
      binanceListing: investor.binanceListing,
      dropstabId: this.toNumber(investor.externalId),
      dropstabRank: investor.rank,
      country: investor.countryName,
      countryFlag: investor.countryFlag,
      lastRoundDate: investor.lastRoundDate,
      saleIds: investor.saleIds,
      isLeadInvestor: investor.isLeadInvestor,
      roundsByCategory: investor.roundsByCategory,
      roundsByStage: investor.roundsByStage,
      coInvestors: investor.coInvestors,
      portfolioCoins: investor.portfolioCoins,
      totalInvested: String(investor.totalInvested || investor.portfolioValue || 0),
      lastFunding: this.toIsoString(
        investor.lastRoundDate || investor.lastSeen || investor.updatedAt,
      ),
      actionDate: new Date(),
      isSponsored: false,
      intelInvestorData: investor.intelInvestorData,
    };
    const scores = this.personsRatingService.calculatePersonScores(personUpdate as any);
    const projectsCount = this.personsRatingService.getProjectsCount(personUpdate as any);

    return {
      ...personUpdate,
      rating: String(scores.rating),
      fomoScore: scores.rating,
      fullness: `${scores.fullness}%`,
      tableRating: scores.rating,
      tableFullness: scores.fullness,
      tableProjectsCount: projectsCount,
      tableSupportedProjectsCount: projectsCount,
      ratingBreakdown: scores.ratingBreakdown,
      fullnessBreakdown: scores.fullnessBreakdown,
      lastRatingCalculatedAt: scores.ratingBreakdown.calculatedAt,
    };
  }

  private buildLinks(
    websiteUrl: string,
    twitterUrl: string,
    linkedinUrl: string,
    crunchbaseUrl: string,
    sourceLinks: Array<{ title: string; link: string; type: string }> = [],
  ) {
    const links: Array<{ title: string; link: string; type: string }> = [];

    if (websiteUrl) {
      links.push({ title: "Website", link: websiteUrl, type: "website" });
    }

    if (twitterUrl) {
      links.push({ title: "Twitter", link: twitterUrl, type: "twitter" });
    }

    if (linkedinUrl) {
      links.push({ title: "LinkedIn", link: linkedinUrl, type: "linkedin" });
    }

    if (crunchbaseUrl) {
      links.push({ title: "Crunchbase", link: crunchbaseUrl, type: "crunchbase" });
    }

    for (const item of sourceLinks) {
      if (!item?.link) {
        continue;
      }

      if (!links.some((existing) => existing.link === item.link)) {
        links.push(item);
      }
    }

    return links;
  }

  private buildSocialmedia(
    websiteUrl: string,
    twitterUrl: string,
    linkedinUrl: string,
    crunchbaseUrl: string,
  ) {
    const socialmedia: Array<{ href: string; icon: string; name: string }> = [];

    if (websiteUrl) {
      socialmedia.push({ href: websiteUrl, icon: "", name: "website" });
    }

    if (twitterUrl) {
      socialmedia.push({ href: twitterUrl, icon: "", name: "twitter" });
    }

    if (linkedinUrl) {
      socialmedia.push({ href: linkedinUrl, icon: "", name: "linkedin" });
    }

    if (crunchbaseUrl) {
      socialmedia.push({ href: crunchbaseUrl, icon: "", name: "crunchbase" });
    }

    return socialmedia;
  }

  private normalizeInvestor(
    investor: IntelInvestorApiItem,
  ): NormalizedIntelInvestor | null {
    const name = this.toNonEmptyString(investor.name);
    if (!name) {
      return null;
    }

    const source = this.toNonEmptyString(investor.source) || "intel";
    const slug =
      this.toNonEmptyString(investor.slug) || this.slugify(name);
    const sourceKey =
      this.toNonEmptyString(investor.key) ||
      `${source}:investor:${slug || this.slugify(name)}`;
    const externalId =
      this.toNonEmptyString(investor.externalId) ||
      this.toNonEmptyString(investor.id);
    const type =
      this.toNonEmptyString(investor.type) ||
      this.toNonEmptyString(investor.ventureType) ||
      "Investor";
    const ventureType =
      this.toNonEmptyString(investor.ventureType) || type;
    const category =
      this.toNonEmptyString(investor.category) ||
      this.toNonEmptyString((investor.category as any)?.name);
    const image =
      this.toNonEmptyString(investor.image) ||
      this.toNonEmptyString(investor.logo);
    const sourceLinks = this.normalizeSourceLinks(investor.links);
    const websiteUrl =
      this.normalizeUrl(this.toNonEmptyString(investor.website)) ||
      this.extractLinkByTypes(sourceLinks, ["website"]);
    const twitterUrl = this.normalizeTwitterUrl(
      this.toNonEmptyString(investor.twitterUrl) ||
      this.toNonEmptyString(investor.twitter) ||
      this.extractLinkByTypes(sourceLinks, ["twitter"]),
    );
    const linkedinUrl =
      this.normalizeUrl(
        this.toNonEmptyString(investor.linkedinUrl) ||
        this.toNonEmptyString(investor.linkedin),
      ) || this.extractLinkByTypes(sourceLinks, ["linkedin"]);
    const crunchbaseUrl =
      this.normalizeUrl(
        this.toNonEmptyString(investor.crunchbaseUrl) ||
        this.toNonEmptyString(investor.crunchbase),
      ) || this.extractLinkByTypes(sourceLinks, ["crunchbase"]);
    const description = this.toNonEmptyString(investor.description);
    const tier = this.normalizeTier(investor.tier);
    const rank = this.toNumber(investor.rank);
    const rating = this.toNumber(investor.rating);
    const isLeadInvestor = Boolean(investor.lead);
    const leadInvestments = this.toNumber(investor.leadInvestments);
    const publicSalesCount = this.toNumber(investor.publicSalesCount);
    const roundsPerYear = this.toNumber(investor.roundsPerYear);
    const twitterScore = this.toNumber(investor.twitterScore);
    const investmentsCount =
      this.toNumber(investor.totalInvestments) ||
      this.toNumber(investor.investments_count) ||
      this.toNumber(investor.rounds_count);
    const portfolioValue = this.toNumber(investor.portfolio_value);
    const totalInvested = this.toNumber(investor.total_invested);
    const portfolioCoins = this.normalizePortfolioProjects(
      Array.isArray(investor.portfolioProjects)
        ? investor.portfolioProjects
        : investor.projects,
    );
    const portfolioCount = portfolioCoins.length;
    const lastRoundDate = this.parseDate(investor.lastRoundDate as any);
    const saleIds = Array.isArray(investor.saleIds) ? investor.saleIds : [];
    const country = this.normalizeCountry(investor.country);
    const privateRoiPercent = this.extractUsdMetric(investor.avgPrivateRoi);
    const retailRoiPercent = this.extractUsdMetric(investor.avgPublicRoi);
    const binanceListing = this.normalizeBinanceListing(investor.binanceListed);
    const roundsByCategory = this.normalizeDistributionItems(
      (investor.roundsDistribution as any)?.category,
    );
    const roundsByStage = this.normalizeDistributionItems(
      (investor.roundsDistribution as any)?.stage,
    );
    const coInvestors = this.normalizeCoInvestors(investor.coInvestments);
    const firstSeen = this.parseDate(investor.first_seen);
    const lastSeen =
      this.parseDate(investor.last_seen) || this.parseDate(investor.updated_at);
    const updatedAt = this.parseDate(investor.updated_at) || new Date();
    const intelInvestorData = {
      externalId,
      ventureType,
      rank,
      rating,
      lead: isLeadInvestor,
      leadInvestments,
      publicSalesCount,
      roundsPerYear,
      twitterScore,
      lastRoundDate,
      saleIds,
      country,
      avgPrivateRoi: investor.avgPrivateRoi || {},
      avgPublicRoi: investor.avgPublicRoi || {},
      binanceListed: binanceListing,
      links: sourceLinks,
      roundsDistribution: {
        category: roundsByCategory,
        stage: roundsByStage,
      },
      coInvestments: coInvestors,
      portfolioProjects: portfolioCoins,
      raw: investor.raw || investor,
    };

    return {
      source,
      sourceKey,
      externalId,
      name,
      slug,
      type,
      ventureType,
      category,
      image,
      websiteUrl,
      twitterUrl,
      linkedinUrl,
      crunchbaseUrl,
      description,
      tier,
      rank,
      rating,
      isLeadInvestor,
      leadInvestments,
      publicSalesCount,
      roundsPerYear,
      twitterScore,
      investmentsCount,
      portfolioValue,
      totalInvested,
      portfolioCount,
      lastRoundDate,
      saleIds,
      countryName: country.name,
      countryFlag: country.flag,
      privateRoiPercent,
      retailRoiPercent,
      binanceListing,
      roundsByCategory,
      roundsByStage,
      coInvestors,
      portfolioCoins,
      sourceLinks,
      intelInvestorData,
      firstSeen,
      lastSeen,
      updatedAt,
      targetCollection: this.isAngelInvestor(ventureType || type) ? "persons" : "funds",
    };
  }

  private async flushOperations<T>(
    model: Model<T>,
    operations: any[],
  ): Promise<number> {
    if (!operations.length) {
      return 0;
    }

    await model.bulkWrite(operations, { ordered: false });
    return operations.length;
  }

  private extractWebsiteUrl(doc: any): string {
    const directWebsite = this.toNonEmptyString(doc.website);
    if (directWebsite) {
      return this.normalizeUrl(directWebsite);
    }

    if (Array.isArray(doc.website)) {
      for (const item of doc.website) {
        const normalizedItem = this.normalizeUrl(this.extractLinkValue(item));
        if (normalizedItem) {
          return normalizedItem;
        }
      }
    }

    if (Array.isArray(doc.links)) {
      for (const item of doc.links) {
        const normalizedItem = this.normalizeUrl(this.extractLinkValue(item));
        if (normalizedItem && !normalizedItem.includes("x.com/") && !normalizedItem.includes("twitter.com/")) {
          return normalizedItem;
        }
      }
    }

    if (Array.isArray(doc.socialmedia)) {
      for (const item of doc.socialmedia) {
        const normalizedItem = this.normalizeUrl(this.extractLinkValue(item));
        if (normalizedItem && !normalizedItem.includes("x.com/") && !normalizedItem.includes("twitter.com/")) {
          return normalizedItem;
        }
      }
    }

    return "";
  }

  private extractTwitterUrl(doc: any): string {
    if (Array.isArray(doc.links)) {
      for (const item of doc.links) {
        const twitterUrl = this.normalizeTwitterUrl(this.extractLinkValue(item));
        if (twitterUrl) {
          return twitterUrl;
        }
      }
    }

    if (Array.isArray(doc.socialmedia)) {
      for (const item of doc.socialmedia) {
        const twitterUrl = this.normalizeTwitterUrl(this.extractLinkValue(item));
        if (twitterUrl) {
          return twitterUrl;
        }
      }
    }

    return "";
  }

  private extractLinkValue(item: any): string {
    if (!item) {
      return "";
    }

    if (typeof item === "string") {
      return item;
    }

    return (
      this.toNonEmptyString(item.link) ||
      this.toNonEmptyString(item.href) ||
      this.toNonEmptyString(item.url) ||
      ""
    );
  }

  private normalizeSourceLinks(
    links: any,
  ): Array<{ title: string; link: string; type: string }> {
    if (!Array.isArray(links)) {
      return [];
    }

    return links
      .map((item) => {
        if (!item) {
          return null;
        }

        if (typeof item === "string") {
          const normalizedLink = this.normalizeUrl(item);
          return normalizedLink
            ? { title: normalizedLink, link: normalizedLink, type: "link" }
            : null;
        }

        const rawType =
          this.toNonEmptyString(item.type) ||
          this.toNonEmptyString(item.kind) ||
          this.toNonEmptyString(item.name) ||
          "link";
        const normalizedType = rawType.toLowerCase();
        const rawLink = this.extractLinkValue(item);
        const normalizedLink =
          normalizedType === "twitter"
            ? this.normalizeTwitterUrl(rawLink)
            : this.normalizeUrl(rawLink);

        if (!normalizedLink) {
          return null;
        }

        return {
          title:
            this.toNonEmptyString(item.title) ||
            this.toNonEmptyString(item.label) ||
            rawType,
          link: normalizedLink,
          type: normalizedType,
        };
      })
      .filter(
        (item): item is { title: string; link: string; type: string } =>
          Boolean(item?.link),
      );
  }

  private extractLinkByTypes(
    links: Array<{ title: string; link: string; type: string }>,
    types: string[],
  ): string {
    const normalizedTypes = types.map((item) => item.toLowerCase());
    return (
      links.find((item) => normalizedTypes.includes(item.type.toLowerCase()))?.link ||
      ""
    );
  }

  private normalizeCountry(value: IntelInvestorApiItem["country"]): {
    name: string;
    flag: string;
  } {
    if (!value) {
      return { name: "", flag: "" };
    }

    if (typeof value === "string") {
      return { name: value.trim(), flag: "" };
    }

    return {
      name:
        this.toNonEmptyString((value as any).name) ||
        this.toNonEmptyString((value as any).title),
      flag:
        this.normalizeUrl(this.toNonEmptyString((value as any).flag)) ||
        this.normalizeUrl(this.toNonEmptyString((value as any).flagUrl)) ||
        this.normalizeUrl(this.toNonEmptyString((value as any).image)),
    };
  }

  private extractUsdMetric(value: any): number {
    if (!value || typeof value !== "object") {
      return 0;
    }

    return this.toNumber((value as any).USD);
  }

  private normalizeBinanceListing(value: IntelInvestorApiItem["binanceListed"]) {
    if (!value || typeof value !== "object") {
      return {};
    }

    return {
      totalProjects: this.toNumber((value as any).totalProjects),
      listedProjects: this.toNumber((value as any).listedProjects),
      listedPercent: this.toNumber((value as any).listedPercent),
    };
  }

  private normalizeDistributionItems(items: any): Array<{
    name: string;
    amount: number;
    value: number;
  }> {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item) => ({
      name: this.toNonEmptyString(item?.name),
      amount: this.toNumber(item?.amount),
      value: this.toNumber(item?.value),
    }));
  }

  private normalizeCoInvestors(items: any): Array<{
    id: number;
    investorSlug: string;
    name: string;
    ventureType: string;
    image: string;
    lastRoundDate?: Date;
    count: number;
  }> {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item) => ({
      id: this.toNumber(item?.id),
      investorSlug:
        this.toNonEmptyString(item?.investorSlug) ||
        this.toNonEmptyString(item?.slug),
      name: this.toNonEmptyString(item?.name),
      ventureType:
        this.toNonEmptyString(item?.ventureType) ||
        this.toNonEmptyString(item?.type),
      image:
        this.normalizeUrl(this.toNonEmptyString(item?.image)) ||
        this.normalizeUrl(this.toNonEmptyString(item?.logo)),
      lastRoundDate: this.parseDate(item?.lastRoundDate),
      count: this.toNumber(item?.count),
    }));
  }

  private normalizePortfolioProjects(items: any): Array<{
    name: string;
    slug: string;
    symbol: string;
    image: string;
    currencyId?: number;
    lastRoundDate?: Date;
    fundsRaised?: number;
    marketCap?: number;
    roi?: number;
    price?: number;
    status?: string;
  }> {
    if (!Array.isArray(items)) {
      return [];
    }

    return items.map((item) => ({
      name: this.toNonEmptyString(item?.name),
      slug:
        this.toNonEmptyString(item?.slug) ||
        this.toNonEmptyString(item?.projectSlug),
      symbol: this.toNonEmptyString(item?.symbol),
      image:
        this.normalizeUrl(this.toNonEmptyString(item?.image)) ||
        this.normalizeUrl(this.toNonEmptyString(item?.logo)),
      currencyId: this.toOptionalNumber(item?.currencyId),
      lastRoundDate: this.parseDate(item?.lastRoundDate),
      fundsRaised: this.toOptionalNumber(item?.fundsRaised),
      marketCap: this.toOptionalNumber(item?.marketCap),
      roi: this.toOptionalNumber(item?.roi),
      price: this.toOptionalNumber(item?.price),
      status: this.toNonEmptyString(item?.status),
    }));
  }

  private normalizeTier(value: IntelInvestorApiItem["tier"]): string {
    if (typeof value === "number") {
      return String(value);
    }

    if (typeof value === "string") {
      return value.trim();
    }

    if (value && typeof value === "object") {
      return (
        this.toNonEmptyString(value.name) ||
        this.toNonEmptyString(value.label) ||
        this.toNonEmptyString(value.tier) ||
        ""
      );
    }

    return "";
  }

  private isAngelInvestor(type: string): boolean {
    return /angel investor/i.test(type);
  }

  private normalizeTwitterUrl(value: string): string {
    const twitterValue = this.toNonEmptyString(value);
    if (!twitterValue) {
      return "";
    }

    if (/twitter\.com|x\.com/i.test(twitterValue)) {
      return this.normalizeUrl(twitterValue);
    }

    const handle = twitterValue.replace(/^@/, "").trim();
    if (!handle) {
      return "";
    }

    return `https://x.com/${handle.toLowerCase()}`;
  }

  private normalizeUrl(value: string): string {
    const rawValue = this.toNonEmptyString(value);
    if (!rawValue) {
      return "";
    }

    const preparedValue = /^[a-z]+:\/\//i.test(rawValue)
      ? rawValue
      : `https://${rawValue}`;

    try {
      const parsed = new URL(preparedValue);
      const normalizedPath = parsed.pathname.replace(/\/+$/, "");
      return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${normalizedPath}`;
    } catch {
      return rawValue.trim();
    }
  }

  private normalizeMatchValue(value: string): string {
    return this.toNonEmptyString(value).toLowerCase();
  }

  private toIsoString(value?: Date): string {
    return value instanceof Date && !Number.isNaN(value.getTime())
      ? value.toISOString()
      : "";
  }

  private parseDate(value?: string | Date | number): Date | undefined {
    if (!value) {
      return undefined;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? undefined : value;
    }

    if (typeof value === "number") {
      const parsedDate = new Date(value > 1e12 ? value : value * 1000);
      return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
    }

    const parsedDate = new Date(String(value));
    return Number.isNaN(parsedDate.getTime()) ? undefined : parsedDate;
  }

  private toNumber(value?: string | number): number {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    const stringValue = this.toNonEmptyString(value);
    if (!stringValue) {
      return 0;
    }

    const normalizedValue = stringValue.replace(/[^0-9.-]/g, "");
    const parsedValue = Number(normalizedValue);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  private toOptionalNumber(value?: string | number): number | undefined {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    const parsed = this.toNumber(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private toNonEmptyString(value?: unknown): string {
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }

    if (typeof value !== "string") {
      return "";
    }

    const normalized = value.trim();
    return normalized || "";
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private isSyncEnabled(): boolean {
    return (
      String(
        this.configService.get("FUNDS_INTEL_INVESTORS_SYNC_ENABLED") ?? "false",
      ).toLowerCase() === "true"
    );
  }

  private isWorkerProcess(): boolean {
    return process.env.INTEL_SYNC_WORKER_PROCESS === "true";
  }

  private isStartupSyncEnabled(): boolean {
    return (
      String(
        this.configService.get("FUNDS_INTEL_INVESTORS_SYNC_ON_STARTUP") ?? "false",
      ).toLowerCase() === "true"
    );
  }

  private getApiUrl(): string {
    const explicitUrl = this.configService.get<string>("FUNDS_INTEL_INVESTORS_API_URL");
    if (explicitUrl) {
      return explicitUrl;
    }

    const baseUrl = this.configService.get<string>("INTEL_API_BASE_URL");
    if (baseUrl) {
      return `${baseUrl.replace(/\/+$/, "")}/intel/investors`;
    }

    return "http://localhost:8001/api/intel/investors";
  }
}
