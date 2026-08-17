import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  CanonicalProject,
  CanonicalProjectAliasType,
  CanonicalProjectCreatedBy,
  CanonicalProjectSourceProjectType,
} from "../models/canonical-project.model";
import { CanonicalProjectLink } from "../models/canonical-project-link.model";
import { CanonicalProjectLinkAuditLog } from "../models/canonical-project-link-audit-log.model";
import { Project } from "src/projects/project.model";
import { FundingRound } from "src/funding-rounds/models/funding-round.model";
import { TokenUnlock } from "src/token-unlocks/models/token-unlock.model";
import { ProjectChartHistory } from "src/projects/project-chart-history.model";
import { ProjectComparisonSnapshot } from "src/projects/project-comparison-snapshot.model";
import { CryptoActivity } from "src/crypto-activities/models/crypto-activity.model";
import { ProjectExchangeTickerCache } from "src/projects/project-exchange-ticker-cache.model";
import { ProjectIntel } from "src/projects/intel-sync/models/project-intel.model";
import { ProjectUnlocks } from "src/projects/intel-sync/models/project-unlocks.model";

export type CanonicalProjectProviderIds = {
  coingeckoId?: string;
  coinmarketcapId?: string;
  coinMarketCapId?: string;
  dropstabId?: string;
  cryptorankId?: string;
  icodropsId?: string;
};

export type CanonicalProjectLookupCache = {
  byProjectId?: Map<string, any>;
  byProviderKey?: Map<string, any>;
  bySourceKey?: Map<string, any>;
};

export type CanonicalProjectWriteOptions = {
  dryRun?: boolean;
  createdBy?: CanonicalProjectCreatedBy;
  confidence?: number;
  matchedBy?: string;
  reason?: string;
  dryRunCache?: Map<string, any>;
  lookupCache?: CanonicalProjectLookupCache;
};

type ProjectLike = Record<string, any> & {
  _id?: Types.ObjectId;
  name?: string;
  normalizedName?: string;
  symbol?: string;
  slug?: string;
  projectType?: string;
  source?: string;
  sourceId?: string;
  sourceUrl?: string;
  detailUrl?: string;
  sourceMappings?: Array<Record<string, any>>;
  rawIcoData?: Record<string, any>;
};

@Injectable()
export class CanonicalProjectService {
  constructor(
    @InjectModel(CanonicalProject.name)
    private readonly canonicalProjectModel: Model<CanonicalProject>,
    @InjectModel(CanonicalProjectLink.name)
    private readonly canonicalProjectLinkModel: Model<CanonicalProjectLink>,
    @InjectModel(CanonicalProjectLinkAuditLog.name)
    private readonly auditLogModel: Model<CanonicalProjectLinkAuditLog>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    @InjectModel(FundingRound.name)
    private readonly fundingRoundModel: Model<FundingRound>,
    @InjectModel(TokenUnlock.name)
    private readonly tokenUnlockModel: Model<TokenUnlock>,
    @InjectModel(ProjectChartHistory.name)
    private readonly projectChartHistoryModel: Model<ProjectChartHistory>,
    @InjectModel(ProjectComparisonSnapshot.name)
    private readonly projectComparisonSnapshotModel: Model<ProjectComparisonSnapshot>,
    @InjectModel(CryptoActivity.name)
    private readonly cryptoActivityModel: Model<CryptoActivity>,
    @InjectModel(ProjectExchangeTickerCache.name)
    private readonly projectExchangeTickerCacheModel: Model<ProjectExchangeTickerCache>,
    @InjectModel(ProjectIntel.name)
    private readonly projectIntelModel: Model<ProjectIntel>,
    @InjectModel(ProjectUnlocks.name)
    private readonly projectUnlocksModel: Model<ProjectUnlocks>,
  ) { }

  normalizeName(value: string): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  normalizeSymbol(value: string): string {
    return String(value || "")
      .trim()
      .replace(/^\$/, "")
      .toUpperCase();
  }

  async findCanonicalByProjectId(projectId: any): Promise<any | null> {
    const objectId = this.toObjectId(projectId);
    if (!objectId) return null;

    return this.canonicalProjectModel
      .findOne({
        $or: [
          { primaryProjectId: objectId },
          { primaryMarketProjectId: objectId },
          { "sourceRefs.projectId": objectId },
        ],
      })
      .lean();
  }

  async findCanonicalByProviderIds(providerIds: CanonicalProjectProviderIds = {}): Promise<any | null> {
    const normalized = this.normalizeProviderIds(providerIds);
    const or: any[] = [];

    for (const [key, value] of Object.entries(normalized)) {
      if (!value) continue;
      or.push({ [`providerIds.${key}`]: value });
    }

    if (!or.length) return null;
    return this.canonicalProjectModel.findOne({ $or: or }).lean();
  }

  async findCanonicalBySourceRef(source: string, sourceId: any): Promise<any | null> {
    const normalizedSource = this.cleanString(source).toLowerCase();
    const normalizedSourceId = this.cleanString(sourceId);
    if (!normalizedSource || !normalizedSourceId) return null;

    return this.canonicalProjectModel
      .findOne({
        sourceRefs: {
          $elemMatch: {
            source: normalizedSource,
            sourceId: normalizedSourceId,
          },
        },
      })
      .lean();
  }

  async findCanonicalByAlias(type: CanonicalProjectAliasType, value: string): Promise<any | null> {
    const normalizedValue = this.normalizeAliasValue(type, value);
    if (!normalizedValue) return null;

    return this.canonicalProjectModel
      .findOne({
        aliases: {
          $elemMatch: {
            type,
            normalizedValue,
          },
        },
      })
      .lean();
  }

  async findOrCreateFromProject(project: ProjectLike, options: CanonicalProjectWriteOptions = {}): Promise<any> {
    const providerIds = this.providerIdsFromProject(project);
    const cacheKey = this.dryRunCacheKey(project, providerIds);
    if (options.dryRun && options.dryRunCache?.has(cacheKey)) {
      return options.dryRunCache.get(cacheKey);
    }

    const existingByProject =
      this.lookupPreloadedCanonicalByProjectId(project?._id, options) ||
      (options.dryRun && options.lookupCache ? null : await this.findCanonicalByProjectId(project?._id));
    if (existingByProject) return existingByProject;

    const existingByProvider =
      this.lookupPreloadedCanonicalByProviderIds(providerIds, options) ||
      (options.dryRun && options.lookupCache ? null : await this.findCanonicalByProviderIds(providerIds));
    if (existingByProvider) return existingByProvider;

    const source = this.cleanString(project?.source).toLowerCase();
    const sourceId = this.cleanString(project?.sourceId || project?.rawIcoData?.sourceId);
    const existingBySource =
      this.lookupPreloadedCanonicalBySourceRef(source, sourceId, options) ||
      (options.dryRun && options.lookupCache ? null : await this.findCanonicalBySourceRef(source, sourceId));
    if (existingBySource) return existingBySource;

    const payload = this.buildCanonicalProjectPayload(project, providerIds, options);
    if (options.dryRun) {
      const preview = { _id: new Types.ObjectId(), ...payload, __created: true, __dryRun: true };
      options.dryRunCache?.set(cacheKey, preview);
      return preview;
    }

    const created = await this.canonicalProjectModel.create(payload);
    const createdObject = this.toPlain(created);
    createdObject.__created = true;
    await this.writeAudit({
      operation: "propose",
      canonicalProjectId: createdObject._id,
      after: payload,
      confidence: options.confidence,
      matchedBy: options.matchedBy || "project",
      reason: options.reason || "Created canonical project from legacy Project.",
      dryRun: false,
      status: "success",
    });
    return createdObject;
  }

  async findOrCreateFromResolvedProjectLink(resolvedLink: Record<string, any>, options: CanonicalProjectWriteOptions = {}) {
    const project = resolvedLink?.project;
    if (project?._id) return this.findOrCreateFromProject(project, options);

    const projectId = this.toObjectId(resolvedLink?.projectId || resolvedLink?.legacyProjectId);
    if (projectId) {
      const existingByProject =
        this.lookupPreloadedCanonicalByProjectId(projectId, options) ||
        (options.dryRun && options.lookupCache ? null : await this.findCanonicalByProjectId(projectId));
      if (existingByProject) return existingByProject;

      const projectDoc =
        options.dryRun && options.lookupCache
          ? null
          : await this.projectModel.findById(projectId).lean();
      if (projectDoc) return this.findOrCreateFromProject(projectDoc, options);
    }

    return null;
  }

  async attachProjectSourceRef(canonicalProjectId: any, project: ProjectLike, options: CanonicalProjectWriteOptions = {}) {
    const objectId = this.toObjectId(canonicalProjectId);
    if (!objectId || !project?._id || options.dryRun) return;

    const aliases = this.aliasesFromProject(project, options);
    const sourceRefs = this.sourceRefsFromProject(project, options);
    const projectType = this.projectType(project?.projectType);
    const existing = await this.canonicalProjectModel
      .findById(objectId)
      .select({
        primaryProjectId: 1,
        primaryMarketProjectId: 1,
        dataQuality: 1,
        sourceRefs: 1,
      })
      .lean();
    const hasExistingProjectProfile = this.hasProjectProfileSignal(existing);
    const set: any = {
      updatedAt: new Date(),
    };

    if (projectType === "market") {
      set["dataQuality.hasMarketProject"] = true;
    }
    if (projectType === "market" && !existing?.primaryMarketProjectId) set.primaryMarketProjectId = project._id;
    if (
      projectType === "project" &&
      (!existing?.primaryProjectId ||
        this.sameObjectId(existing.primaryProjectId, existing.primaryMarketProjectId) ||
        !hasExistingProjectProfile)
    ) {
      set.primaryProjectId = project._id;
    }
    if (projectType === "project" || projectType === "ico") {
      set["dataQuality.hasProjectProfile"] = true;
      set["dataQuality.hasIcoProject"] = true;
    }

    await this.canonicalProjectModel.findByIdAndUpdate(objectId, {
      $set: set,
      ...(aliases.length ? { $addToSet: { aliases: { $each: aliases } } } : {}),
      ...(sourceRefs.length ? { $addToSet: { sourceRefs: { $each: sourceRefs } } } : {}),
    });

    await this.writeAudit({
      operation: "propose",
      canonicalProjectId: objectId,
      entityType: "project",
      entityId: project._id,
      after: { aliases, sourceRefs, dataQuality: set },
      confidence: options.confidence,
      matchedBy: options.matchedBy || "projectSourceRef",
      reason: options.reason || "Attached legacy Project source references to canonical project.",
      dryRun: false,
      status: "success",
    });
  }

  async markDataQuality(canonicalProjectId: any, entityType: string, options: CanonicalProjectWriteOptions = {}) {
    const objectId = this.toObjectId(canonicalProjectId);
    const dataQualityPath = this.dataQualityPathForEntity(entityType);
    if (!objectId || !dataQualityPath || options.dryRun) return;

    await this.canonicalProjectModel.findByIdAndUpdate(objectId, {
      $set: {
        [dataQualityPath]: true,
        updatedAt: new Date(),
      },
    });

    await this.writeAudit({
      operation: "propose",
      canonicalProjectId: objectId,
      entityType,
      after: { [dataQualityPath]: true },
      dryRun: false,
      status: "success",
      matchedBy: "dataQuality",
      reason: options.reason || `Marked canonical project coverage for ${entityType}.`,
    });
  }

  async getCanonicalProjectGraph(canonicalProjectId: any) {
    const objectId = this.toObjectId(canonicalProjectId);
    if (!objectId) {
      return {
        canonicalProject: null,
        projects: [],
        fundingRounds: [],
        tokenUnlocks: [],
        chartHistoryCoverage: {},
        comparisonSnapshotsCoverage: {},
        activities: [],
        exchangeListings: [],
        links: [],
      };
    }

    const [canonicalProject, links] = await Promise.all([
      this.canonicalProjectModel.findById(objectId).lean(),
      this.canonicalProjectLinkModel.find({ canonicalProjectId: objectId }).sort({ entityType: 1, createdAt: -1 }).lean(),
    ]);

    const idsByType = this.groupEntityIdsByType(links as any[]);
    const [
      projects,
      fundingRounds,
      tokenUnlocks,
      chartHistoryCoverage,
      comparisonSnapshotsCoverage,
      activities,
      exchangeListings,
      projectIntelDocs,
      projectUnlockDocs,
    ] = await Promise.all([
      this.findLinkedDocuments(this.projectModel, idsByType.project, {
        name: 1,
        symbol: 1,
        slug: 1,
        projectType: 1,
        source: 1,
        sourceId: 1,
        coingeckoId: 1,
        coinMarketCapId: 1,
      }),
      this.findLinkedDocuments(this.fundingRoundModel, idsByType.fundingRound, {
        id: 1,
        projectId: 1,
        projectLinks: 1,
        projectName: 1,
        coinSlug: 1,
        coinSymbol: 1,
        date: 1,
        stage: 1,
        fundsRaised: 1,
        tokenPrice: 1,
      }),
      this.findLinkedDocuments(this.tokenUnlockModel, idsByType.tokenUnlock, {
        projectId: 1,
        projectLinks: 1,
        coinSlug: 1,
        coinSymbol: 1,
        projectName: 1,
        nextTokenUnlockDate: 1,
        unlockDate: 1,
      }),
      this.timeSeriesCoverage(this.projectChartHistoryModel, idsByType.projectChartHistory, ["source"]),
      this.timeSeriesCoverage(this.projectComparisonSnapshotModel, idsByType.projectComparisonSnapshot, [
        "bucketGranularity",
      ]),
      this.findLinkedDocuments(this.cryptoActivityModel, idsByType.cryptoActivity, {
        id: 1,
        parserActivityId: 1,
        slug: 1,
        externalSlug: 1,
        coinSlug: 1,
        coinSymbol: 1,
        coinName: 1,
        projectName: 1,
        sourceUrl: 1,
        originalUrl: 1,
        status: 1,
        activityType: 1,
      }),
      this.findLinkedDocuments(this.projectExchangeTickerCacheModel, idsByType.projectExchangeTickerCache, {
        projectId: 1,
        coingeckoId: 1,
        exchangeName: 1,
        exchangeIdentifier: 1,
        pair: 1,
        exchangeType: 1,
        volume24hUsd: 1,
        source: 1,
      }),
      this.findLegacyEnrichmentDocuments(this.projectIntelModel, idsByType.project, {
        projectId: 1,
        profile: 1,
        fundraising: 1,
        tokenomics: 1,
        sourceRefs: 1,
        dataQuality: 1,
        updatedAt: 1,
      }),
      this.findLegacyEnrichmentDocuments(this.projectUnlocksModel, idsByType.project, {
        projectId: 1,
        vestingSchedule: 1,
        unlockingEvents: 1,
        nextUnlockingEvent: 1,
        sourceRefs: 1,
        dataQuality: 1,
        updatedAt: 1,
      }),
    ]);

    return {
      canonicalProject,
      projects,
      fundingRounds,
      tokenUnlocks,
      chartHistoryCoverage,
      comparisonSnapshotsCoverage,
      activities,
      exchangeListings,
      legacyEnrichment: this.summarizeLegacyEnrichment(projectIntelDocs, projectUnlockDocs),
      links,
    };
  }

  async getCoverageStats() {
    const [
      canonicalProjects,
      links,
      verifiedLinks,
      proposedLinks,
      conflictLinks,
      byEntityType,
      withMarketProject,
      withIcoProject,
      withFundingRounds,
      withUnlocks,
      withChartHistory,
      withActivities,
      withExchangeListings,
      projectTypeCoverage,
      legacyEnrichmentCoverage,
    ] = await Promise.all([
      this.canonicalProjectModel.countDocuments({}),
      this.canonicalProjectLinkModel.countDocuments({}),
      this.canonicalProjectLinkModel.countDocuments({ status: "verified" }),
      this.canonicalProjectLinkModel.countDocuments({ status: "proposed" }),
      this.canonicalProjectLinkModel.countDocuments({ status: "conflict" }),
      this.canonicalProjectLinkModel.aggregate([{ $group: { _id: "$entityType", count: { $sum: 1 } } }]),
      this.canonicalProjectModel.countDocuments({ "dataQuality.hasMarketProject": true }),
      this.canonicalProjectModel.countDocuments({ "dataQuality.hasIcoProject": true }),
      this.canonicalProjectModel.countDocuments({ "dataQuality.hasFundingRounds": true }),
      this.canonicalProjectModel.countDocuments({ "dataQuality.hasUnlocks": true }),
      this.canonicalProjectModel.countDocuments({ "dataQuality.hasChartHistory": true }),
      this.canonicalProjectModel.countDocuments({ "dataQuality.hasActivities": true }),
      this.canonicalProjectModel.countDocuments({ "dataQuality.hasExchangeListings": true }),
      this.getProjectTypeCoverage(),
      this.getLegacyEnrichmentCoverage(),
    ]);

    return {
      canonicalProjects,
      links,
      verifiedLinks,
      proposedLinks,
      conflictLinks,
      byEntityType: Object.fromEntries((byEntityType as any[]).map((row) => [row._id, row.count])),
      dataQuality: {
        withMarketProject,
        withIcoProject,
        withFundingRounds,
        withUnlocks,
        withChartHistory,
        withActivities,
        withExchangeListings,
      },
      projectTypeCoverage,
      legacyEnrichmentCoverage,
    };
  }

  private async getProjectTypeCoverage() {
    const marketCanonicalQuery = {
      $or: [
        { primaryMarketProjectId: { $exists: true, $ne: null } },
        { "dataQuality.hasMarketProject": true },
        { "sourceRefs.projectType": "market" },
      ],
    };
    const projectProfileCanonicalQuery = {
      $or: [
        { primaryProjectId: { $exists: true, $ne: null } },
        { "dataQuality.hasProjectProfile": true },
        { "dataQuality.hasIcoProject": true },
        { "sourceRefs.projectType": "project" },
        { "sourceRefs.projectType": "ico" },
      ],
    };

    const [
      marketProjects,
      projectProfiles,
      canonicalWithMarketProject,
      canonicalWithProjectProfile,
      canonicalWithBothMarketAndProject,
      canonicalMarketOnly,
      canonicalProjectOnly,
    ] = await Promise.all([
      this.projectModel.countDocuments({ projectType: "market" }),
      this.projectModel.countDocuments({ projectType: "project" }),
      this.canonicalProjectModel.countDocuments(marketCanonicalQuery),
      this.canonicalProjectModel.countDocuments(projectProfileCanonicalQuery),
      this.canonicalProjectModel.countDocuments({ $and: [marketCanonicalQuery, projectProfileCanonicalQuery] }),
      this.canonicalProjectModel.countDocuments({ $and: [marketCanonicalQuery, { $nor: [projectProfileCanonicalQuery] }] }),
      this.canonicalProjectModel.countDocuments({ $and: [projectProfileCanonicalQuery, { $nor: [marketCanonicalQuery] }] }),
    ]);

    return {
      marketProjects,
      projectProfiles,
      canonicalWithMarketProject,
      canonicalWithProjectProfile,
      canonicalWithBothMarketAndProject,
      canonicalMarketOnly,
      canonicalProjectOnly,
    };
  }

  private async getLegacyEnrichmentCoverage() {
    const [projectIntelProjectIdsRaw, projectUnlockProjectIdsRaw] = await Promise.all([
      this.projectIntelModel.distinct("projectId"),
      this.projectUnlocksModel.distinct("projectId"),
    ]);
    const projectIntelProjectIds = this.toObjectIds(projectIntelProjectIdsRaw);
    const projectUnlockProjectIds = this.toObjectIds(projectUnlockProjectIdsRaw);
    const intelSet = new Set(projectIntelProjectIds.map((id) => id.toString()));
    const unlockSet = new Set(projectUnlockProjectIds.map((id) => id.toString()));
    const bothIntelAndUnlockIds = projectIntelProjectIds.filter((id) => unlockSet.has(id.toString()));

    const [marketProjectsWithIntel, projectProfilesWithIntel, projectProfilesWithUnlocks] = await Promise.all([
      projectIntelProjectIds.length
        ? this.projectModel.countDocuments({ _id: { $in: projectIntelProjectIds }, projectType: "market" })
        : 0,
      projectIntelProjectIds.length
        ? this.projectModel.countDocuments({ _id: { $in: projectIntelProjectIds }, projectType: "project" })
        : 0,
      projectUnlockProjectIds.length
        ? this.projectModel.countDocuments({ _id: { $in: projectUnlockProjectIds }, projectType: "project" })
        : 0,
    ]);

    return {
      withProjectIntel: intelSet.size,
      withProjectUnlocks: unlockSet.size,
      withBothIntelAndUnlocks: bothIntelAndUnlockIds.length,
      marketProjectsWithIntel,
      projectProfilesWithIntel,
      projectProfilesWithUnlocks,
    };
  }

  async mergeCanonicalProjects(sourceCanonicalId: any, targetCanonicalId: any, options: CanonicalProjectWriteOptions = {}) {
    const sourceId = this.toObjectId(sourceCanonicalId);
    const targetId = this.toObjectId(targetCanonicalId);
    if (!sourceId || !targetId) {
      return { status: "skipped", reason: "Invalid source or target canonical project id." };
    }

    const [sourceLinks, targetLinks] = await Promise.all([
      this.canonicalProjectLinkModel.find({ canonicalProjectId: sourceId }).lean(),
      this.canonicalProjectLinkModel.find({ canonicalProjectId: targetId }).lean(),
    ]);

    const targetEntityKeys = new Set(
      (targetLinks as any[]).map((link) => `${link.entityType}:${String(link.entityId)}`),
    );
    const duplicateEntityLinks = (sourceLinks as any[]).filter((link) =>
      targetEntityKeys.has(`${link.entityType}:${String(link.entityId)}`),
    );

    if (duplicateEntityLinks.length) {
      if (!options.dryRun) {
        await this.writeAudit({
          operation: "conflict",
          canonicalProjectId: targetId,
          before: { sourceCanonicalId: sourceId, duplicateEntityLinks },
          dryRun: false,
          status: "conflict",
          reason: "Merge would create duplicate entity links.",
        });
      }
      return { status: "conflict", duplicateEntityLinks };
    }

    if (options.dryRun) {
      return {
        status: "success",
        dryRun: true,
        wouldMoveLinks: (sourceLinks as any[]).length,
      };
    }

    await this.writeAudit({
      operation: "merge",
      canonicalProjectId: targetId,
      before: { sourceCanonicalId: sourceId, sourceLinks },
      dryRun: false,
      status: "success",
      reason: options.reason || "Manual canonical project merge.",
    });

    await this.canonicalProjectLinkModel.updateMany({ canonicalProjectId: sourceId }, { $set: { canonicalProjectId: targetId } });
    await this.canonicalProjectModel.findByIdAndUpdate(sourceId, {
      $set: {
        status: "merged",
        updatedAt: new Date(),
      },
    });

    return { status: "success", movedLinks: (sourceLinks as any[]).length };
  }

  async mergeMarketProjectPair(marketProject: ProjectLike, projectProfile: ProjectLike, options: CanonicalProjectWriteOptions = {}) {
    if (!marketProject?._id || !projectProfile?._id) {
      return { status: "skipped", reason: "Missing market or project profile id." };
    }

    const [existingMarketCanonical, existingProfileCanonical] = await Promise.all([
      this.findCanonicalByProjectId(marketProject._id),
      this.findCanonicalByProjectId(projectProfile._id),
    ]);
    const wouldMergeCanonicalProjects =
      existingMarketCanonical?._id &&
        existingProfileCanonical?._id &&
        !this.sameObjectId(existingMarketCanonical._id, existingProfileCanonical._id)
        ? 1
        : 0;

    if (options.dryRun) {
      return {
        status: "success",
        dryRun: true,
        wouldHaveBothPrimaryIds: true,
        wouldMergeCanonicalProjects,
        canonicalProjectId: existingMarketCanonical?._id || existingProfileCanonical?._id || new Types.ObjectId(),
      };
    }

    const marketCanonical = existingMarketCanonical || (await this.findOrCreateFromProject(marketProject, options));
    const profileCanonical = existingProfileCanonical || (await this.findOrCreateFromProject(projectProfile, options));
    const targetCanonical = marketCanonical || profileCanonical;
    if (!targetCanonical?._id) return { status: "skipped", reason: "Unable to resolve target canonical project." };

    const targetId = this.toObjectId(targetCanonical._id);
    const profileCanonicalId = this.toObjectId(profileCanonical?._id);
    const sourceId = profileCanonicalId && !this.sameObjectId(profileCanonicalId, targetId) ? profileCanonicalId : null;
    if (!targetId) return { status: "skipped", reason: "Invalid target canonical project id." };

    const before = {
      marketCanonicalId: marketCanonical?._id,
      projectProfileCanonicalId: profileCanonical?._id,
      sourceCanonicalId: sourceId,
      targetCanonicalId: targetId,
    };
    let movedLinks = 0;

    if (sourceId) {
      const moveResult = await this.canonicalProjectLinkModel.updateMany(
        { canonicalProjectId: sourceId },
        { $set: { canonicalProjectId: targetId, updatedAt: new Date() } },
      );
      movedLinks = Number((moveResult as any)?.modifiedCount || (moveResult as any)?.nModified || 0);
      await this.canonicalProjectModel.findByIdAndUpdate(sourceId, {
        $set: {
          status: "merged",
          mergedIntoCanonicalProjectId: targetId,
          updatedAt: new Date(),
        },
      });
    }

    const aliases = this.uniqueObjects(
      [...this.aliasesFromProject(marketProject, options), ...this.aliasesFromProject(projectProfile, options)],
      (alias) => `${alias.type}:${alias.normalizedValue}:${alias.source || ""}`,
    );
    const sourceRefs = this.uniqueObjects(
      [...this.sourceRefsFromProject(marketProject, options), ...this.sourceRefsFromProject(projectProfile, options)],
      (ref) => `${ref.source}:${ref.sourceId || ""}:${ref.sourceSlug || ""}:${String(ref.projectId || "")}`,
    );

    await this.canonicalProjectModel.findByIdAndUpdate(targetId, {
      $set: {
        primaryMarketProjectId: marketProject._id,
        primaryProjectId: projectProfile._id,
        status: "active",
        "dataQuality.hasMarketProject": true,
        "dataQuality.hasProjectProfile": true,
        "dataQuality.hasIcoProject": true,
        updatedAt: new Date(),
      },
      ...(aliases.length ? { $addToSet: { aliases: { $each: aliases } } } : {}),
      ...(sourceRefs.length ? { $addToSet: { sourceRefs: { $each: sourceRefs } } } : {}),
    });

    const [marketLink, projectLink] = await Promise.all([
      this.ensureProjectLinkRecord(targetId, marketProject, "market", options),
      this.ensureProjectLinkRecord(targetId, projectProfile, "project", options),
    ]);

    await this.writeAudit({
      operation: "merge",
      canonicalProjectId: targetId,
      before,
      after: {
        primaryMarketProjectId: marketProject._id,
        primaryProjectId: projectProfile._id,
        movedLinks,
        marketLink,
        projectLink,
      },
      confidence: options.confidence,
      matchedBy: options.matchedBy || "marketProjectPairing",
      reason: options.reason || "Merged verified market/project pair into one canonical project.",
      dryRun: false,
      status: "success",
    });

    return {
      status: "success",
      canonicalProjectId: targetId,
      movedLinks,
      mergedCanonicalProjects: sourceId ? 1 : 0,
      marketLink,
      projectLink,
    };
  }

  providerIdsFromProject(project: ProjectLike = {}): CanonicalProjectProviderIds {
    const raw = project.rawIcoData || {};
    const tokenMetrics = project.tokenMetrics || {};
    const providerIds = this.normalizeProviderIds({
      coingeckoId: project.coingeckoId || raw.coingeckoId || raw?.marketData?.coingeckoId || tokenMetrics.coingeckoId,
      coinMarketCapId:
        project.coinMarketCapId ||
        project.coinmarketcapId ||
        raw.coinMarketCapId ||
        raw.coinmarketcapId ||
        raw?.marketData?.coinMarketCapId ||
        tokenMetrics.coinMarketCapId,
      dropstabId: project.dropstabId || raw.dropstabId || raw.dropstabSlug || project.capId,
      cryptorankId: project.cryptorankId || raw.cryptorankId,
      icodropsId: project.icodropsId || raw.icodropsId || (project.source === "icodrops" ? project.sourceId : undefined),
    });

    if (providerIds.coinMarketCapId && !providerIds.coinmarketcapId) {
      providerIds.coinmarketcapId = providerIds.coinMarketCapId;
    }
    if (providerIds.coinmarketcapId && !providerIds.coinMarketCapId) {
      providerIds.coinMarketCapId = providerIds.coinmarketcapId;
    }

    return providerIds;
  }

  private buildCanonicalProjectPayload(
    project: ProjectLike,
    providerIds: CanonicalProjectProviderIds,
    options: CanonicalProjectWriteOptions,
  ) {
    const projectType = this.projectType(project?.projectType);
    const name = this.cleanString(project?.name || project?.rawIcoData?.name || project?.slug || project?.symbol || "Unknown Project");
    const slug = this.normalizeSlug(project?.slug || project?.rawIcoData?.slug || project?.sourceId || "");
    const symbol = this.cleanString(project?.symbol || project?.ticker || project?.rawIcoData?.symbol || project?.rawIcoData?.ticker);

    return {
      name,
      normalizedName: this.normalizeName(project?.normalizedName || name),
      symbol,
      normalizedSymbol: this.normalizeSymbol(symbol),
      slug,
      status: this.hasStrongProjectSignal(project, providerIds) ? "active" : "proposed",
      ...(projectType === "project" ? { primaryProjectId: project?._id } : {}),
      ...(projectType === "market" ? { primaryMarketProjectId: project?._id } : {}),
      providerIds,
      aliases: this.aliasesFromProject(project, options),
      sourceRefs: this.sourceRefsFromProject(project, options),
      dataQuality: {
        hasMarketProject: projectType === "market",
        hasProjectProfile: projectType === "project" || projectType === "ico",
        hasIcoProject: projectType === "project" || projectType === "ico",
      },
      createdBy: options.createdBy || "system",
    };
  }

  private aliasesFromProject(project: ProjectLike = {}, options: CanonicalProjectWriteOptions = {}) {
    const aliases: any[] = [];
    const pushAlias = (type: CanonicalProjectAliasType, value: any, source?: string) => {
      const cleanValue = this.cleanString(value);
      const normalizedValue = this.normalizeAliasValue(type, cleanValue);
      if (!cleanValue || !normalizedValue) return;
      aliases.push({
        type,
        value: cleanValue,
        normalizedValue,
        source,
        confidence: options.confidence,
      });
    };

    pushAlias("name", project.name || project.rawIcoData?.name, project.source);
    pushAlias("slug", project.slug || project.rawIcoData?.slug, project.source);
    pushAlias("symbol", project.symbol || project.ticker || project.rawIcoData?.symbol || project.rawIcoData?.ticker, project.source);

    for (const alias of project.aliases || []) {
      pushAlias("name", alias, project.source);
    }

    for (const [key, value] of Object.entries(this.providerIdsFromProject(project))) {
      pushAlias("providerId", value, key);
    }

    for (const contract of project.contracts || []) {
      pushAlias("contract", contract?.address || contract?.contractAddress || contract, contract?.chain || project.source);
    }

    return this.uniqueObjects(aliases, (alias) => `${alias.type}:${alias.normalizedValue}:${alias.source || ""}`);
  }

  private aliasesFromValues(values: Record<string, any>, options: CanonicalProjectWriteOptions = {}) {
    const aliases: any[] = [];
    const pushAlias = (type: CanonicalProjectAliasType, value: any, source?: string) => {
      const cleanValue = this.cleanString(value);
      const normalizedValue = this.normalizeAliasValue(type, cleanValue);
      if (!cleanValue || !normalizedValue) return;
      aliases.push({ type, value: cleanValue, normalizedValue, source, confidence: options.confidence });
    };

    pushAlias("name", values.name, values.source);
    pushAlias("slug", values.slug || values.sourceSlug, values.source);
    pushAlias("symbol", values.symbol, values.source);

    for (const [key, value] of Object.entries(this.normalizeProviderIds(values.providerIds || {}))) {
      pushAlias("providerId", value, key);
    }

    return this.uniqueObjects(aliases, (alias) => `${alias.type}:${alias.normalizedValue}:${alias.source || ""}`);
  }

  private sourceRefsFromProject(project: ProjectLike = {}, options: CanonicalProjectWriteOptions = {}) {
    const sourceRefs: any[] = [];
    const projectId = this.toObjectId(project._id);
    const projectType = this.projectType(project.projectType);
    const pushSourceRef = (source: any, values: Record<string, any>) => {
      const normalizedSource = this.cleanString(source).toLowerCase();
      if (!normalizedSource && !projectId) return;
      sourceRefs.push({
        source: normalizedSource || "project",
        sourceId: this.cleanString(values.sourceId),
        sourceSlug: this.normalizeSlug(values.sourceSlug || values.slug || ""),
        sourceUrl: this.cleanString(values.sourceUrl),
        projectId,
        projectType,
        confidence: options.confidence,
        matchedBy: options.matchedBy || "project",
        reason: options.reason,
        verified: this.hasStrongProjectSignal(project, this.providerIdsFromProject(project)),
      });
    };

    pushSourceRef(project.source || "project", {
      sourceId: project.sourceId || project.rawIcoData?.sourceId,
      sourceSlug: project.slug || project.rawIcoData?.slug,
      sourceUrl: project.sourceUrl || project.detailUrl,
    });

    for (const mapping of project.sourceMappings || []) {
      pushSourceRef(mapping.source, {
        sourceId: mapping.sourceId,
        sourceSlug: mapping.sourceSlug || mapping.slug,
        sourceUrl: mapping.sourceUrl,
      });
    }

    return this.uniqueObjects(
      sourceRefs,
      (ref) => `${ref.source}:${ref.sourceId || ""}:${ref.sourceSlug || ""}:${String(ref.projectId || "")}`,
    );
  }

  private sourceRefsFromValues(values: Record<string, any>, projectId: Types.ObjectId | null, options: CanonicalProjectWriteOptions = {}) {
    const source = this.cleanString(values.source).toLowerCase();
    if (!source && !projectId) return [];

    return [
      {
        source: source || "resolved",
        sourceId: this.cleanString(values.sourceId),
        sourceSlug: this.normalizeSlug(values.sourceSlug || values.slug || ""),
        sourceUrl: this.cleanString(values.sourceUrl),
        projectId,
        projectType: this.projectType(values.projectType),
        confidence: options.confidence,
        matchedBy: options.matchedBy,
        reason: options.reason,
        verified: Boolean(options.confidence && options.confidence >= 90),
      },
    ];
  }

  private hasStrongProjectSignal(project: ProjectLike = {}, providerIds: CanonicalProjectProviderIds = {}): boolean {
    if (Object.values(providerIds).some(Boolean)) return true;
    if (this.cleanString(project.source) && this.cleanString(project.sourceId)) return true;
    if (Array.isArray(project.sourceMappings) && project.sourceMappings.some((mapping) => mapping?.source && mapping?.sourceId)) {
      return true;
    }
    return false;
  }

  private normalizeProviderIds(providerIds: CanonicalProjectProviderIds = {}): CanonicalProjectProviderIds {
    const normalized: CanonicalProjectProviderIds = {};
    for (const [key, value] of Object.entries(providerIds || {})) {
      const cleanValue = this.cleanString(value);
      if (!cleanValue) continue;
      normalized[key] = cleanValue;
    }

    if (normalized.coinMarketCapId && !normalized.coinmarketcapId) {
      normalized.coinmarketcapId = normalized.coinMarketCapId;
    }
    if (normalized.coinmarketcapId && !normalized.coinMarketCapId) {
      normalized.coinMarketCapId = normalized.coinmarketcapId;
    }

    return normalized;
  }

  private normalizeAliasValue(type: CanonicalProjectAliasType, value: any): string {
    if (type === "name") return this.normalizeName(value);
    if (type === "symbol") return this.normalizeSymbol(value);
    if (type === "slug") return this.normalizeSlug(value);
    if (type === "contract") return this.cleanString(value).toLowerCase();
    return this.cleanString(value).toLowerCase();
  }

  private normalizeSlug(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/^https?:\/\/[^/]+\/?/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private projectType(value: any): CanonicalProjectSourceProjectType {
    const normalized = this.cleanString(value).toLowerCase();
    if (normalized === "market") return "market";
    if (normalized === "ico") return "ico";
    if (normalized === "project") return "project";
    return "raw";
  }

  private hasProjectProfileSignal(canonicalProject: any): boolean {
    if (!canonicalProject) return false;
    if (canonicalProject?.primaryProjectId && !this.sameObjectId(canonicalProject.primaryProjectId, canonicalProject.primaryMarketProjectId)) {
      return true;
    }
    if (canonicalProject?.dataQuality?.hasProjectProfile || canonicalProject?.dataQuality?.hasIcoProject) return true;
    return (canonicalProject?.sourceRefs || []).some((sourceRef) => {
      const projectType = this.projectType(sourceRef?.projectType);
      return projectType === "project" || projectType === "ico";
    });
  }

  private sameObjectId(left: any, right: any): boolean {
    if (!left || !right) return false;
    return String(left) === String(right);
  }

  private dataQualityPathForEntity(entityType: string): string | null {
    const map: Record<string, string> = {
      fundingRound: "dataQuality.hasFundingRounds",
      tokenUnlock: "dataQuality.hasUnlocks",
      projectChartHistory: "dataQuality.hasChartHistory",
      projectComparisonSnapshot: "dataQuality.hasChartHistory",
      cryptoActivity: "dataQuality.hasActivities",
      projectExchangeTickerCache: "dataQuality.hasExchangeListings",
    };
    return map[entityType] || null;
  }

  private dryRunCacheKey(project: ProjectLike, providerIds: CanonicalProjectProviderIds): string {
    const providerKey = Object.entries(providerIds)
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => `${key}:${value}`)
      .sort()
      .join("|");
    if (providerKey) return `provider:${providerKey}`;
    if (project?._id) return `project:${String(project._id)}`;
    return `name:${this.normalizeName(project?.name || "")}|symbol:${this.normalizeSymbol(project?.symbol || "")}`;
  }

  private lookupPreloadedCanonicalByProjectId(projectId: any, options: CanonicalProjectWriteOptions): any | null {
    const objectId = this.toObjectId(projectId);
    if (!objectId) return null;
    return options.lookupCache?.byProjectId?.get(objectId.toString()) || null;
  }

  private lookupPreloadedCanonicalByProviderIds(
    providerIds: CanonicalProjectProviderIds,
    options: CanonicalProjectWriteOptions,
  ): any | null {
    for (const key of this.providerCacheKeys(providerIds)) {
      const canonicalProject = options.lookupCache?.byProviderKey?.get(key);
      if (canonicalProject) return canonicalProject;
    }
    return null;
  }

  private lookupPreloadedCanonicalBySourceRef(
    source: string,
    sourceId: any,
    options: CanonicalProjectWriteOptions,
  ): any | null {
    const key = this.sourceCacheKey(source, sourceId);
    if (!key) return null;
    return options.lookupCache?.bySourceKey?.get(key) || null;
  }

  providerCacheKeys(providerIds: CanonicalProjectProviderIds = {}): string[] {
    return Object.entries(this.normalizeProviderIds(providerIds))
      .filter(([, value]) => Boolean(value))
      .map(([key, value]) => `${key}:${String(value).trim().toLowerCase()}`);
  }

  sourceCacheKey(source: any, sourceId: any): string {
    const normalizedSource = this.cleanString(source).toLowerCase();
    const normalizedSourceId = this.cleanString(sourceId);
    if (!normalizedSource || !normalizedSourceId) return "";
    return `${normalizedSource}:${normalizedSourceId}`;
  }

  private async findLinkedDocuments(model: Model<any>, ids: any[] = [], projection: Record<string, number>) {
    const objectIds = this.toObjectIds(ids);
    if (!objectIds.length) return [];
    return model.find({ _id: { $in: objectIds } }).select(projection).limit(200).lean();
  }

  private async findLegacyEnrichmentDocuments(model: Model<any>, projectIds: any[] = [], projection: Record<string, number>) {
    const objectIds = this.toObjectIds(projectIds);
    if (!objectIds.length) return [];
    return model.find({ projectId: { $in: objectIds } }).select(projection).limit(200).lean();
  }

  private summarizeLegacyEnrichment(projectIntelDocs: any[] = [], projectUnlockDocs: any[] = []) {
    const firstIntel = projectIntelDocs[0] || null;
    const firstUnlocks = projectUnlockDocs[0] || null;

    return {
      projectIntel: {
        exists: Boolean(firstIntel),
        projectId: firstIntel?.projectId ? String(firstIntel.projectId) : null,
        hasProfile: Boolean(firstIntel?.profile && Object.keys(firstIntel.profile || {}).length),
        hasFundraising: Boolean(firstIntel?.fundraising && Object.keys(firstIntel.fundraising || {}).length),
        hasTokenomics: Boolean(firstIntel?.tokenomics && Object.keys(firstIntel.tokenomics || {}).length),
        sourceRefs: firstIntel?.sourceRefs || {},
        items: projectIntelDocs.map((intel) => ({
          projectId: String(intel.projectId),
          hasProfile: Boolean(intel?.profile && Object.keys(intel.profile || {}).length),
          hasFundraising: Boolean(intel?.fundraising && Object.keys(intel.fundraising || {}).length),
          hasTokenomics: Boolean(intel?.tokenomics && Object.keys(intel.tokenomics || {}).length),
          sourceRefs: intel?.sourceRefs || {},
          updatedAt: intel?.updatedAt || null,
        })),
      },
      projectUnlocks: {
        exists: Boolean(firstUnlocks),
        projectId: firstUnlocks?.projectId ? String(firstUnlocks.projectId) : null,
        hasVestingSchedule: Array.isArray(firstUnlocks?.vestingSchedule) && firstUnlocks.vestingSchedule.length > 0,
        hasUnlockingEvents: Array.isArray(firstUnlocks?.unlockingEvents) && firstUnlocks.unlockingEvents.length > 0,
        hasNextUnlock: Boolean(firstUnlocks?.nextUnlockingEvent),
        sourceRefs: firstUnlocks?.sourceRefs || {},
        items: projectUnlockDocs.map((unlocks) => ({
          projectId: String(unlocks.projectId),
          hasVestingSchedule: Array.isArray(unlocks?.vestingSchedule) && unlocks.vestingSchedule.length > 0,
          hasUnlockingEvents: Array.isArray(unlocks?.unlockingEvents) && unlocks.unlockingEvents.length > 0,
          hasNextUnlock: Boolean(unlocks?.nextUnlockingEvent),
          sourceRefs: unlocks?.sourceRefs || {},
          updatedAt: unlocks?.updatedAt || null,
        })),
      },
    };
  }

  private async timeSeriesCoverage(model: Model<any>, ids: any[] = [], dimensionFields: string[] = []) {
    const objectIds = this.toObjectIds(ids);
    if (!objectIds.length) {
      return {
        linkedDocuments: 0,
        firstTimestamp: null,
        lastTimestamp: null,
        dimensions: {},
      };
    }

    const [linkedDocuments, first, last, dimensions] = await Promise.all([
      model.countDocuments({ _id: { $in: objectIds } }),
      model
        .findOne({ _id: { $in: objectIds } })
        .sort({ bucketTimestamp: 1, timestamp: 1, createdAt: 1 })
        .select({ timestamp: 1, bucketTimestamp: 1, dateBucket: 1, createdAt: 1 })
        .lean(),
      model
        .findOne({ _id: { $in: objectIds } })
        .sort({ bucketTimestamp: -1, timestamp: -1, createdAt: -1 })
        .select({ timestamp: 1, bucketTimestamp: 1, dateBucket: 1, createdAt: 1 })
        .lean(),
      Promise.all(
        dimensionFields.map(async (field) => {
          const rows = await model.aggregate([
            { $match: { _id: { $in: objectIds } } },
            { $group: { _id: `$${field}`, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ]);
          return [field, Object.fromEntries(rows.map((row) => [row._id || "unknown", row.count]))];
        }),
      ),
    ]);

    return {
      linkedDocuments,
      firstTimestamp: first?.bucketTimestamp || first?.timestamp || first?.dateBucket || first?.createdAt || null,
      lastTimestamp: last?.bucketTimestamp || last?.timestamp || last?.dateBucket || last?.createdAt || null,
      dimensions: Object.fromEntries(dimensions),
    };
  }

  private groupEntityIdsByType(links: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {
      project: [],
      fundingRound: [],
      tokenUnlock: [],
      projectChartHistory: [],
      projectComparisonSnapshot: [],
      cryptoActivity: [],
      projectExchangeTickerCache: [],
    };

    for (const link of links || []) {
      if (!groups[link.entityType]) groups[link.entityType] = [];
      groups[link.entityType].push(link.entityId);
    }

    return groups;
  }

  private toObjectIds(values: any[] = []): Types.ObjectId[] {
    return values.map((value) => this.toObjectId(value)).filter(Boolean);
  }

  private toObjectId(value: any): Types.ObjectId | null {
    if (!value) return null;
    if (value instanceof Types.ObjectId) return value;
    if (Types.ObjectId.isValid(String(value))) return new Types.ObjectId(String(value));
    return null;
  }

  private cleanString(value: any): string {
    return String(value ?? "").trim();
  }

  private uniqueObjects<T>(values: T[], keyFactory: (value: T) => string): T[] {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const value of values) {
      const key = keyFactory(value);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(value);
    }
    return result;
  }

  private toPlain(value: any): any {
    if (!value) return value;
    if (typeof value.toObject === "function") return value.toObject();
    return value;
  }

  private async writeAudit(entry: Record<string, any>) {
    await this.auditLogModel.create(entry);
  }

  private async ensureProjectLinkRecord(
    canonicalProjectId: Types.ObjectId,
    project: ProjectLike,
    projectType: "market" | "project",
    options: CanonicalProjectWriteOptions,
  ) {
    const projectId = this.toObjectId(project?._id);
    if (!projectId) return { status: "skipped", reason: "Invalid project id." };

    const otherVerified = await this.canonicalProjectLinkModel
      .findOne({
        entityType: "project",
        entityId: projectId,
        status: "verified",
        canonicalProjectId: { $ne: canonicalProjectId },
      })
      .lean();
    if (otherVerified) {
      await this.writeAudit({
        operation: "conflict",
        canonicalProjectId,
        entityType: "project",
        entityId: projectId,
        before: { otherVerified },
        dryRun: false,
        status: "conflict",
        matchedBy: options.matchedBy || "marketProjectPairing",
        reason: "Project already has a verified canonical project link to a different canonical project.",
      });
      return { status: "conflict", conflict: otherVerified };
    }

    const payload = {
      canonicalProjectId,
      entityType: "project",
      entityId: projectId,
      legacyProjectId: projectId,
      projectType,
      source: this.cleanString(project.source || "project"),
      sourceId: this.cleanString(project.sourceId || project.rawIcoData?.sourceId),
      sourceSlug: this.normalizeSlug(project.slug || project.rawIcoData?.slug || ""),
      sourceUrl: this.cleanString(project.sourceUrl || project.detailUrl),
      confidence: Math.max(0, Math.min(Number(options.confidence ?? 100), 100)),
      matchedBy: options.matchedBy || "marketProjectPairing",
      reason: options.reason || "Verified market/project pairing link.",
      status: "verified",
      dryRun: false,
      createdBy: options.createdBy || "system",
      updatedAt: new Date(),
    };

    const result = await this.canonicalProjectLinkModel.updateOne(
      { canonicalProjectId, entityType: "project", entityId: projectId },
      {
        $set: payload,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );

    await this.writeAudit({
      operation: "verify",
      canonicalProjectId,
      entityType: "project",
      entityId: projectId,
      after: payload,
      confidence: payload.confidence,
      matchedBy: payload.matchedBy,
      reason: payload.reason,
      dryRun: false,
      status: "success",
    });

    return {
      status: "verified",
      upserted: Boolean((result as any)?.upsertedCount),
      modified: Boolean((result as any)?.modifiedCount || (result as any)?.nModified),
    };
  }
}
