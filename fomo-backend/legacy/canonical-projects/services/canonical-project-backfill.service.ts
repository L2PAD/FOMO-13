import { Injectable, Logger, Optional } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Project } from "src/projects/project.model";
import { FundingRound } from "src/funding-rounds/models/funding-round.model";
import { TokenUnlock } from "src/token-unlocks/models/token-unlock.model";
import { ProjectChartHistory } from "src/projects/project-chart-history.model";
import { ProjectComparisonSnapshot } from "src/projects/project-comparison-snapshot.model";
import { CryptoActivity } from "src/crypto-activities/models/crypto-activity.model";
import { ProjectExchangeTickerCache } from "src/projects/project-exchange-ticker-cache.model";
import { ProjectSourceMap } from "src/projects/intel-sync/models/project-source-map.model";
import {
  CanonicalProjectResolverBatchCache,
  CanonicalProjectResolverAdapter,
  CanonicalProjectResolverAdapterInput,
  CanonicalProjectResolverAdapterOutput,
} from "./canonical-project-resolver.adapter";
import { CanonicalProject } from "../models/canonical-project.model";
import { CanonicalProjectLink } from "../models/canonical-project-link.model";
import { CanonicalProjectLinkAuditLog } from "../models/canonical-project-link-audit-log.model";
import { CanonicalProjectLinkService } from "./canonical-project-link.service";
import { CanonicalProjectService } from "./canonical-project.service";
import { ProjectCandidateService } from "src/project-candidates/project-candidates.service";

export type CanonicalProjectBackfillEntityType =
  | "projects"
  | "fundingRounds"
  | "tokenUnlocks"
  | "projectChartHistory"
  | "projectComparisonSnapshots"
  | "cryptoActivities"
  | "projectExchangeTickerCache";

export type CanonicalProjectBackfillOptions = {
  dryRun?: boolean;
  apply?: boolean;
  confirmApply?: boolean;
  scanLimit?: number;
  progressEvery?: number;
  concurrency?: number;
  bulk?: boolean;
  projectType?: "market" | "project" | "all";
  checkMarketProjectPairs?: boolean;
  entityTypes?: CanonicalProjectBackfillEntityType[];
};

type BackfillSummary = {
  mode: "dry-run" | "apply";
  startedAt: string;
  finishedAt?: string;
  scanned: Record<CanonicalProjectBackfillEntityType, number>;
  wouldCreate: {
    canonicalProjects: number;
    canonicalLinks: number;
    links: number;
    projectCandidates: number;
  };
  projectCandidates: {
    wouldCreate: number;
    wouldMergeEvidence: number;
    byEvidenceType: Record<string, number>;
    byStatus: Record<string, number>;
    examples: {
      created: any[];
      mergedEvidence: any[];
      unsafe: any[];
      conflicts: any[];
    };
  };
  wouldVerify: number;
  wouldPropose: number;
  conflicts: number;
  ambiguous: number;
  unsafe: number;
  byEntityType: Record<string, any>;
  examples: {
    created: any[];
    verified: any[];
    proposed: any[];
    conflicts: any[];
    ambiguous: any[];
    unsafe: any[];
  };
  warnings: string[];
  marketProjectPairing?: MarketProjectPairingSummary;
  canonicalProjectShape: {
    wouldHaveBothPrimaryIds: number;
    marketOnly: number;
    projectOnly: number;
    mergedCanonicalProjects: number;
  };
};

type MarketProjectPairingSummary = {
  marketProjectsScanned: number;
  projectProfilesScanned: number;
  pairedMarketProject: number;
  marketOnly: number;
  projectOnly: number;
  verifiedPairs: number;
  proposedPairs: number;
  ambiguousPairs: number;
  unsafePairs: number;
  conflictPairs: number;
  appliedPairs: number;
  mergedCanonicalProjects: number;
  examples: {
    paired: any[];
    marketOnly: any[];
    projectOnly: any[];
    ambiguous: any[];
    unsafe: any[];
    conflicts: any[];
  };
};

type BackfillScanContext = {
  projectById: Map<string, any>;
  canonicalLookupCache: {
    byProjectId: Map<string, any>;
    byProviderKey: Map<string, any>;
    bySourceKey: Map<string, any>;
  };
  linkLookupCache: {
    byEntityCanonical: Map<string, any>;
    verifiedByEntity: Map<string, any>;
    dryRunByEntityCanonical: Map<string, any>;
    dryRunVerifiedByEntity: Map<string, any>;
  };
  projectResolverCache?: CanonicalProjectResolverBatchCache;
};

@Injectable()
export class CanonicalProjectBackfillService {
  private readonly logger = new Logger(CanonicalProjectBackfillService.name);

  constructor(
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
    @InjectModel(ProjectSourceMap.name)
    private readonly projectSourceMapModel: Model<ProjectSourceMap>,
    @InjectModel(CanonicalProject.name)
    private readonly canonicalProjectModel: Model<CanonicalProject>,
    @InjectModel(CanonicalProjectLink.name)
    private readonly canonicalProjectLinkModel: Model<CanonicalProjectLink>,
    @InjectModel(CanonicalProjectLinkAuditLog.name)
    private readonly canonicalProjectLinkAuditLogModel: Model<CanonicalProjectLinkAuditLog>,
    private readonly resolverAdapter: CanonicalProjectResolverAdapter,
    private readonly canonicalProjectService: CanonicalProjectService,
    @Optional()
    private readonly projectCandidateService?: ProjectCandidateService,
  ) { }

  async runBackfill(options: CanonicalProjectBackfillOptions = {}): Promise<BackfillSummary> {
    const startedAt = new Date().toISOString();
    const dryRun = this.resolveDryRunMode(options);
    const summary = this.createSummary(startedAt, dryRun);
    const dryRunCache = new Map<string, any>();
    const progressEvery = this.normalizeProgressEvery(options.progressEvery);
    const concurrency = this.normalizeConcurrency(options.concurrency);

    if (!dryRun) {
      summary.warnings.push(
        "Apply mode writes only canonical_projects/canonical_project_links/canonical_project_link_audit_logs. It never changes legacy entity documents.",
      );
    } else if (options.apply || options.dryRun === false) {
      summary.warnings.push(
        "Apply was requested without confirmApply=true; forced back to dry-run. Production/staging apply requires explicit confirmation.",
      );
    }

    const entityTypes = options.entityTypes?.length ? options.entityTypes : this.allEntityTypes();
    this.logProgress(
      `plan mode=${summary.mode} scanLimit=${options.scanLimit ?? "all"} entityTypes=${entityTypes.join(",")} progressEvery=${progressEvery} concurrency=${concurrency} bulk=${options.bulk === true}`,
    );
    for (const entityType of entityTypes) {
      await this.scanEntityType(entityType, dryRun, dryRunCache, summary, options.scanLimit, progressEvery, concurrency, options);
    }

    if (options.checkMarketProjectPairs) {
      summary.marketProjectPairing = await this.checkMarketProjectPairs(options.scanLimit, dryRun, options.bulk === true);
      summary.canonicalProjectShape = {
        wouldHaveBothPrimaryIds: summary.marketProjectPairing.verifiedPairs,
        marketOnly: summary.marketProjectPairing.marketOnly,
        projectOnly: summary.marketProjectPairing.projectOnly,
        mergedCanonicalProjects: summary.marketProjectPairing.mergedCanonicalProjects,
      };
    }

    summary.finishedAt = new Date().toISOString();
    return summary;
  }

  private async scanEntityType(
    entityType: CanonicalProjectBackfillEntityType,
    dryRun: boolean,
    dryRunCache: Map<string, any>,
    summary: BackfillSummary,
    scanLimit?: number,
    progressEvery = 10,
    concurrency = 1,
    options: CanonicalProjectBackfillOptions = {},
  ) {
    this.logProgress(`${entityType}: loading documents scanLimit=${scanLimit ?? "all"}`);

    if (entityType === "projects") {
      const docs = await this.listDocuments(
        this.projectModel,
        scanLimit,
        this.projectScanFilter(options.projectType),
        this.projectProjection(),
      );
      if (!dryRun && options.bulk) {
        await this.bulkApplyProjectDocs(docs, summary, progressEvery);
        return;
      }
      const scanContext = await this.buildScanContext(entityType, docs, dryRun);
      await this.scanDocs(
        entityType,
        docs,
        dryRun,
        dryRunCache,
        scanContext,
        summary,
        progressEvery,
        concurrency,
        (doc) => ({
          entityType: "project",
          entityId: doc._id,
          projectId: doc._id,
          resolvedProjects: [doc],
          source: doc.source,
          sourceId: doc.sourceId,
          sourceSlug: doc.slug || doc.rawIcoData?.slug,
          sourceUrl: doc.sourceUrl || doc.detailUrl,
          name: doc.name || doc.rawIcoData?.name,
          slug: doc.slug || doc.rawIcoData?.slug,
          symbol: doc.symbol || doc.ticker || doc.rawIcoData?.symbol || doc.rawIcoData?.ticker,
          providerIds: this.providerIdsFromDoc(doc),
          projectType: this.projectType(doc.projectType),
        }),
      );
      return;
    }

    if (entityType === "fundingRounds") {
      const docs = await this.listDocuments(this.fundingRoundModel, scanLimit, {}, this.fundingRoundProjection());
      const scanContext = await this.buildScanContext(entityType, docs, dryRun);
      await this.scanDocs(
        entityType,
        docs,
        dryRun,
        dryRunCache,
        scanContext,
        summary,
        progressEvery,
        concurrency,
        (doc, context) => ({
          entityType: "fundingRound",
          entityId: doc._id,
          projectId: doc.projectId,
          projectLinks: doc.projectLinks,
          resolvedProjects: this.projectsForDoc(context.projectById, doc),
          source: doc.source,
          sourceId: doc.sourceId || doc.sourceKey || doc.roundId || doc.id,
          sourceKey: doc.sourceKey,
          sourceSlug: doc.coinSlug,
          name: doc.projectName,
          slug: doc.coinSlug,
          coinSlug: doc.coinSlug,
          symbol: doc.coinSymbol,
        }),
      );
      return;
    }

    if (entityType === "tokenUnlocks") {
      const docs = await this.listDocuments(this.tokenUnlockModel, scanLimit, {}, this.tokenUnlockProjection());
      const scanContext = await this.buildScanContext(entityType, docs, dryRun);
      await this.scanDocs(
        entityType,
        docs,
        dryRun,
        dryRunCache,
        scanContext,
        summary,
        progressEvery,
        concurrency,
        (doc, context) => ({
          entityType: "tokenUnlock",
          entityId: doc._id,
          projectId: doc.projectId,
          projectLinks: doc.projectLinks,
          resolvedProjects: this.projectsForDoc(context.projectById, doc),
          source: doc.source,
          sourceId: doc.sourceId || doc.sourceKey || doc.coinId,
          sourceKey: doc.sourceKey,
          sourceSlug: doc.coinSlug,
          sourceUrl: doc.sourceUrl || doc.detailUrl,
          name: doc.projectName,
          slug: doc.coinSlug,
          coinSlug: doc.coinSlug,
          symbol: doc.coinSymbol,
        }),
      );
      return;
    }

    if (entityType === "projectChartHistory") {
      const docs = await this.listDocuments(this.projectChartHistoryModel, scanLimit, {}, this.projectChartHistoryProjection());
      const scanContext = await this.buildScanContext(entityType, docs, dryRun);
      await this.scanDocs(
        entityType,
        docs,
        dryRun,
        dryRunCache,
        scanContext,
        summary,
        progressEvery,
        concurrency,
        (doc, context) => ({
          entityType: "projectChartHistory",
          entityId: doc._id,
          projectId: doc.projectId,
          resolvedProjects: this.projectsForDoc(context.projectById, doc),
          source: doc.source,
          sourceSlug: doc.slug,
          slug: doc.slug,
        }),
      );
      return;
    }

    if (entityType === "projectComparisonSnapshots") {
      const docs = await this.listDocuments(
        this.projectComparisonSnapshotModel,
        scanLimit,
        {},
        this.projectComparisonSnapshotProjection(),
      );
      const scanContext = await this.buildScanContext(entityType, docs, dryRun);
      await this.scanDocs(
        entityType,
        docs,
        dryRun,
        dryRunCache,
        scanContext,
        summary,
        progressEvery,
        concurrency,
        (doc, context) => ({
          entityType: "projectComparisonSnapshot",
          entityId: doc._id,
          projectId: doc.projectId,
          resolvedProjects: this.projectsForDoc(context.projectById, doc),
          sourceSlug: doc.slug,
          slug: doc.slug,
        }),
      );
      return;
    }

    if (entityType === "cryptoActivities") {
      const docs = await this.listDocuments(this.cryptoActivityModel, scanLimit, {}, this.cryptoActivityProjection());
      const scanContext = await this.buildScanContext(entityType, docs, dryRun);
      await this.scanDocs(
        entityType,
        docs,
        dryRun,
        dryRunCache,
        scanContext,
        summary,
        progressEvery,
        concurrency,
        (doc) => ({
          entityType: "cryptoActivity",
          entityId: doc._id,
          source: doc.primarySource || doc.source || doc.syncMeta?.sourceSystem,
          sourceId: doc.parserActivityId || doc.id,
          sourceSlug: doc.externalSlug || doc.slug || doc.coinSlug,
          sourceUrl: doc.sourceUrl || doc.originalUrl,
          name: doc.projectName || doc.coinName || doc.name,
          slug: doc.coinSlug || doc.slug || doc.externalSlug,
          coinSlug: doc.coinSlug,
          symbol: doc.coinSymbol || doc.symbol,
        }),
      );
      return;
    }

    if (entityType === "projectExchangeTickerCache") {
      const docs = await this.listDocuments(
        this.projectExchangeTickerCacheModel,
        scanLimit,
        {},
        this.projectExchangeTickerCacheProjection(),
      );
      const scanContext = await this.buildScanContext(entityType, docs, dryRun);
      await this.scanDocs(
        entityType,
        docs,
        dryRun,
        dryRunCache,
        scanContext,
        summary,
        progressEvery,
        concurrency,
        (doc, context) => ({
          entityType: "projectExchangeTickerCache",
          entityId: doc._id,
          projectId: doc.projectId,
          resolvedProjects: this.projectsForDoc(context.projectById, doc),
          source: doc.source || "coingecko",
          sourceId: doc.exchangeIdentifier || doc.pair,
          sourceSlug: doc.coingeckoId,
          sourceUrl: doc.tradeUrl,
          symbol: doc.base,
          providerIds: {
            coingeckoId: doc.coingeckoId,
          },
        }),
      );
    }
  }

  private async scanDocs(
    bucketEntityType: CanonicalProjectBackfillEntityType,
    docs: any[],
    dryRun: boolean,
    dryRunCache: Map<string, any>,
    scanContext: BackfillScanContext,
    summary: BackfillSummary,
    progressEvery: number,
    concurrency: number,
    inputFactory: (doc: any, scanContext: BackfillScanContext) => CanonicalProjectResolverAdapterInput,
  ) {
    const startedAtMs = Date.now();
    this.logProgress(`${bucketEntityType}: loaded ${docs.length} documents`);

    let processed = 0;

    if (concurrency <= 1 || docs.length <= 1) {
      for (let index = 0; index < docs.length; index += 1) {
        const doc = docs[index];
        await this.process(bucketEntityType, doc, inputFactory(doc, scanContext), dryRun, dryRunCache, scanContext, summary);
        processed += 1;
        this.logEntityProgress(bucketEntityType, processed, docs.length, startedAtMs, summary, progressEvery);
      }
    } else {
      let nextIndex = 0;
      const workerCount = Math.min(concurrency, docs.length);
      const workers = Array.from({ length: workerCount }, async () => {
        while (true) {
          const index = nextIndex;
          nextIndex += 1;
          if (index >= docs.length) return;

          const doc = docs[index];
          await this.process(bucketEntityType, doc, inputFactory(doc, scanContext), dryRun, dryRunCache, scanContext, summary);
          processed += 1;
          this.logEntityProgress(bucketEntityType, processed, docs.length, startedAtMs, summary, progressEvery);
        }
      });
      await Promise.all(workers);
    }

    this.logProgress(
      `${bucketEntityType}: completed ${docs.length}/${docs.length} elapsed=${this.formatDuration(Date.now() - startedAtMs)}`,
    );
  }

  private async bulkApplyProjectDocs(docs: any[], summary: BackfillSummary, progressEvery: number) {
    const startedAtMs = Date.now();
    const batchSize = 1000;
    this.logProgress(`projects: bulk applying ${docs.length} documents batchSize=${batchSize}`);

    for (let offset = 0; offset < docs.length; offset += batchSize) {
      const batch = docs.slice(offset, offset + batchSize);
      const canonicalOps: any[] = [];
      const linkOps: any[] = [];
      const auditDocs: any[] = [];

      for (const project of batch) {
        const canonicalProjectId = this.toObjectId(project?._id);
        if (!canonicalProjectId) continue;

        const canonicalDoc = this.bulkCanonicalProjectDoc(project, canonicalProjectId);
        const linkDoc = this.bulkProjectLinkDoc(project, canonicalProjectId);
        canonicalOps.push({
          updateOne: {
            filter: { _id: canonicalProjectId },
            update: { $setOnInsert: canonicalDoc },
            upsert: true,
          },
        });
        linkOps.push({
          updateOne: {
            filter: {
              canonicalProjectId,
              entityType: "project",
              entityId: project._id,
            },
            update: {
              $set: { ...linkDoc, updatedAt: new Date() },
              $setOnInsert: { createdAt: new Date() },
            },
            upsert: true,
          },
        });
        auditDocs.push(...this.bulkProjectAuditDocs(project, canonicalProjectId, canonicalDoc, linkDoc));
      }

      if (canonicalOps.length) await this.canonicalProjectModel.bulkWrite(canonicalOps, { ordered: false });
      if (linkOps.length) await this.canonicalProjectLinkModel.bulkWrite(linkOps, { ordered: false });
      if (auditDocs.length) await this.canonicalProjectLinkAuditLogModel.insertMany(auditDocs, { ordered: false });

      for (const project of batch) {
        const result = this.bulkProjectResult(project);
        summary.scanned.projects += 1;
        this.recordResult("projects", project, this.bulkProjectInput(project), result, summary);
      }

      this.logEntityProgress("projects", Math.min(offset + batch.length, docs.length), docs.length, startedAtMs, summary, progressEvery);
    }

    this.logProgress(`projects: bulk completed ${docs.length}/${docs.length} elapsed=${this.formatDuration(Date.now() - startedAtMs)}`);
  }

  private bulkCanonicalProjectDoc(project: any, canonicalProjectId: Types.ObjectId) {
    const projectType = this.projectType(project?.projectType);
    const providerIds = this.normalizeProviderIds(this.providerIdsFromDoc(project));
    const name = this.cleanString(project?.name || project?.rawIcoData?.name || project?.slug || project?.symbol || "Unknown Project");
    const slug = this.normalizedSlug(project?.slug || project?.rawIcoData?.slug || project?.sourceId || "");
    const symbol = this.cleanString(project?.symbol || project?.ticker || project?.rawIcoData?.symbol || project?.rawIcoData?.ticker);
    const now = new Date();

    return {
      _id: canonicalProjectId,
      name,
      normalizedName: this.normalizedName(project?.normalizedName || name),
      symbol,
      normalizedSymbol: this.normalizedSymbol(symbol),
      slug,
      status: this.hasStrongProjectSignal(project, providerIds) ? "active" : "proposed",
      ...(projectType === "project" ? { primaryProjectId: project?._id } : {}),
      ...(projectType === "market" ? { primaryMarketProjectId: project?._id } : {}),
      providerIds,
      aliases: this.bulkAliasesFromProject(project, providerIds),
      sourceRefs: this.bulkSourceRefsFromProject(project),
      dataQuality: {
        hasMarketProject: projectType === "market",
        hasProjectProfile: projectType === "project" || projectType === "ico",
        hasIcoProject: projectType === "project" || projectType === "ico",
      },
      createdBy: "system",
      createdAt: now,
    };
  }

  private bulkProjectLinkDoc(project: any, canonicalProjectId: Types.ObjectId) {
    const status = this.bulkProjectLinkStatus(project);
    return {
      canonicalProjectId,
      entityType: "project",
      entityId: project._id,
      legacyProjectId: project._id,
      projectType: this.projectType(project.projectType),
      source: this.cleanString(project.source),
      sourceId: this.cleanString(project.sourceId),
      sourceSlug: this.cleanString(project.slug || project.rawIcoData?.slug),
      sourceUrl: this.cleanString(project.sourceUrl || project.detailUrl),
      confidence: status === "verified" ? 100 : 100,
      matchedBy: status === "verified" ? "projectStrongSignal" : "legacyProjectId",
      reason:
        status === "verified"
          ? "Legacy Project has provider/source signal and can be linked to canonical project."
          : "Legacy Project has weak identifiers only; canonical link remains proposed.",
      status,
      dryRun: false,
      createdBy: "system",
    };
  }

  private bulkProjectAuditDocs(project: any, canonicalProjectId: Types.ObjectId, canonicalDoc: any, linkDoc: any) {
    const now = new Date();
    return [
      {
        operation: "propose",
        canonicalProjectId,
        after: canonicalDoc,
        confidence: 100,
        matchedBy: "legacyProjectId",
        reason: "Created canonical project from legacy Project.",
        dryRun: false,
        status: "success",
        createdAt: now,
      },
      {
        operation: "propose",
        canonicalProjectId,
        entityType: "project",
        entityId: project._id,
        after: { aliases: canonicalDoc.aliases, sourceRefs: canonicalDoc.sourceRefs, dataQuality: canonicalDoc.dataQuality },
        confidence: 100,
        matchedBy: "projectSourceRef",
        reason: "Attached legacy Project source references to canonical project.",
        dryRun: false,
        status: "success",
        createdAt: now,
      },
      {
        operation: linkDoc.status === "verified" ? "verify" : "propose",
        canonicalProjectId,
        entityType: "project",
        entityId: project._id,
        after: linkDoc,
        confidence: linkDoc.confidence,
        matchedBy: linkDoc.matchedBy,
        reason: linkDoc.reason,
        dryRun: false,
        status: "success",
        createdAt: now,
      },
    ];
  }

  private bulkProjectResult(project: any): CanonicalProjectResolverAdapterOutput {
    const status = this.bulkProjectLinkStatus(project) as any;
    return {
      canonicalProjectId: project._id,
      status,
      confidence: 100,
      matchedBy: "legacyProjectId",
      reason: "Resolved from existing legacy projectId without changing the source entity.",
      linksCreated: 1,
      conflicts: [],
      canonicalCreated: true,
    };
  }

  private bulkProjectInput(project: any): CanonicalProjectResolverAdapterInput {
    return {
      entityType: "project",
      entityId: project._id,
      projectId: project._id,
      source: project.source,
      sourceId: project.sourceId,
      sourceSlug: project.slug || project.rawIcoData?.slug,
      sourceUrl: project.sourceUrl || project.detailUrl,
      name: project.name || project.rawIcoData?.name,
      slug: project.slug || project.rawIcoData?.slug,
      symbol: project.symbol || project.ticker || project.rawIcoData?.symbol || project.rawIcoData?.ticker,
      providerIds: this.providerIdsFromDoc(project),
      projectType: this.projectType(project.projectType),
    };
  }

  private bulkProjectLinkStatus(project: any): "verified" | "proposed" {
    const providerIds = this.normalizeProviderIds(this.providerIdsFromDoc(project));
    return this.hasStrongProjectSignal(project, providerIds) ? "verified" : "proposed";
  }

  private bulkAliasesFromProject(project: any, providerIds: Record<string, any>) {
    const aliases: any[] = [];
    const pushAlias = (type: string, value: any, source?: string) => {
      const cleanValue = this.cleanString(value);
      const normalizedValue = this.normalizeAliasValue(type, cleanValue);
      if (!cleanValue || !normalizedValue) return;
      aliases.push({ type, value: cleanValue, normalizedValue, source, confidence: 100 });
    };

    pushAlias("name", project.name || project.rawIcoData?.name, project.source);
    pushAlias("slug", project.slug || project.rawIcoData?.slug, project.source);
    pushAlias("symbol", project.symbol || project.ticker || project.rawIcoData?.symbol || project.rawIcoData?.ticker, project.source);
    for (const alias of project.aliases || []) pushAlias("name", alias, project.source);
    for (const [key, value] of Object.entries(providerIds || {})) pushAlias("providerId", value, key);
    for (const contract of project.contracts || []) {
      pushAlias("contract", contract?.address || contract?.contractAddress || contract, contract?.chain || project.source);
    }

    return this.uniqueObjects(aliases, (alias) => `${alias.type}:${alias.normalizedValue}:${alias.source || ""}`);
  }

  private bulkSourceRefsFromProject(project: any) {
    const sourceRefs: any[] = [];
    const projectId = this.toObjectId(project._id);
    const projectType = this.projectType(project.projectType);
    const pushSourceRef = (source: any, values: Record<string, any>) => {
      const normalizedSource = this.cleanString(source).toLowerCase();
      if (!normalizedSource && !projectId) return;
      sourceRefs.push({
        source: normalizedSource || "project",
        sourceId: this.cleanString(values.sourceId),
        sourceSlug: this.normalizedSlug(values.sourceSlug || values.slug || ""),
        sourceUrl: this.cleanString(values.sourceUrl),
        projectId,
        projectType,
        confidence: 100,
        matchedBy: "legacyProjectId",
        reason: "Resolved from existing legacy projectId without changing the source entity.",
        verified: this.hasStrongProjectSignal(project, this.normalizeProviderIds(this.providerIdsFromDoc(project))),
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

  private async buildScanContext(
    bucketEntityType: CanonicalProjectBackfillEntityType,
    docs: any[],
    dryRun: boolean,
  ): Promise<BackfillScanContext> {
    const projectIds = this.collectProjectIdsFromDocs(bucketEntityType, docs);
    const projectById = await this.loadProjectMap(bucketEntityType, docs, projectIds);
    const projectResolverCache = await this.loadProjectResolverBatchCache(bucketEntityType, docs);
    for (const [projectId, project] of projectResolverCache?.projectsById || new Map<string, any>()) {
      projectById.set(projectId, project);
    }
    const [canonicalLookupCache, linkLookupCache] = await Promise.all([
      this.loadCanonicalLookupCache(Array.from(projectById.values())),
      this.loadLinkLookupCache(bucketEntityType, docs, Array.from(projectById.keys())),
    ]);

    this.logProgress(
      `${bucketEntityType}: preloaded projects=${projectById.size} resolverProjects=${projectResolverCache?.projectsById?.size || 0} canonicalProjectRefs=${canonicalLookupCache.byProjectId.size} existingLinks=${linkLookupCache.byEntityCanonical.size} dryRun=${dryRun}`,
    );

    return {
      projectById,
      canonicalLookupCache,
      linkLookupCache,
      projectResolverCache,
    };
  }

  private async loadProjectResolverBatchCache(
    bucketEntityType: CanonicalProjectBackfillEntityType,
    docs: any[],
  ): Promise<CanonicalProjectResolverBatchCache | undefined> {
    if (!["fundingRounds", "tokenUnlocks"].includes(bucketEntityType)) return undefined;

    const inputs = docs
      .filter((doc) => !this.hasDirectProjectLink(doc))
      .map((doc) => this.projectResolverCacheInput(bucketEntityType, doc))
      .filter((input) => this.hasProjectResolverSignals(input));
    if (!inputs.length) return undefined;

    const [projects, sourceMaps] = await Promise.all([
      this.loadProjectResolverCandidateProjects(inputs),
      this.loadProjectResolverSourceMaps(inputs),
    ]);

    const projectsById = new Map<string, any>();
    for (const project of projects as any[]) {
      if (project?._id) projectsById.set(String(project._id), project);
    }

    const sourceMapProjectIds = this.uniqueObjectIds((sourceMaps as any[]).map((sourceMap) => sourceMap?.projectId));
    const missingSourceMapProjectIds = sourceMapProjectIds.filter((projectId) => !projectsById.has(String(projectId)));
    if (missingSourceMapProjectIds.length) {
      const sourceMapProjects = await this.projectModel
        .find({ _id: { $in: missingSourceMapProjectIds } })
        .select(this.projectProjection())
        .lean();
      for (const project of sourceMapProjects as any[]) {
        if (project?._id) projectsById.set(String(project._id), project);
      }
    }

    const cache = this.createProjectResolverBatchCache(projectsById);
    for (const project of projectsById.values()) this.indexProjectResolverProject(cache, project);
    for (const sourceMap of sourceMaps as any[]) this.indexProjectResolverSourceMap(cache, sourceMap);
    return cache;
  }

  private async loadProjectResolverCandidateProjects(inputs: any[]): Promise<any[]> {
    const values = this.collectProjectResolverValues(inputs);
    const or: any[] = [];

    for (const [source, sourceIds] of values.sourceIdsBySource) {
      if (sourceIds.size) or.push({ source, sourceId: { $in: Array.from(sourceIds) } });
    }
    for (const [source, sourceUrls] of values.sourceUrlsBySource) {
      if (sourceUrls.size) {
        const urls = Array.from(sourceUrls);
        or.push({ source, detailUrl: { $in: urls } }, { source, sourceUrl: { $in: urls } });
      }
    }

    if (values.providerIds.coingeckoId.size) {
      const ids = Array.from(values.providerIds.coingeckoId);
      or.push(
        { coingeckoId: { $in: ids } },
        { "rawIcoData.coingeckoId": { $in: ids } },
        { "rawIcoData.marketData.coingeckoId": { $in: ids } },
        { "tokenMetrics.coingeckoId": { $in: ids } },
      );
    }
    if (values.providerIds.coinMarketCapId.size) {
      const ids = Array.from(values.providerIds.coinMarketCapId);
      or.push(
        { coinMarketCapId: { $in: ids } },
        { "rawIcoData.coinMarketCapId": { $in: ids } },
        { "rawIcoData.marketData.coinMarketCapId": { $in: ids } },
        { "tokenMetrics.coinMarketCapId": { $in: ids } },
      );
    }
    if (values.providerIds.dropstabId.size) {
      const ids = Array.from(values.providerIds.dropstabId);
      or.push({ dropstabId: { $in: ids } }, { "rawIcoData.dropstabId": { $in: ids } }, { "rawIcoData.dropstabSlug": { $in: ids } });
    }
    if (values.capIds.size) or.push({ capId: { $in: Array.from(values.capIds) } });
    if (values.providerIds.cryptorankId.size) {
      const ids = Array.from(values.providerIds.cryptorankId);
      or.push({ cryptorankId: { $in: ids } }, { "rawIcoData.cryptorankId": { $in: ids } });
    }
    if (values.providerIds.icodropsId.size) {
      const ids = Array.from(values.providerIds.icodropsId);
      or.push(
        { icodropsId: { $in: ids } },
        { sourceId: { $in: ids } },
        { "rawIcoData.sourceId": { $in: ids } },
        { "rawIcoData.icodropsId": { $in: ids } },
      );
    }

    if (values.slugs.size) {
      const slugs = Array.from(values.slugs);
      or.push(
        { slug: { $in: slugs } },
        { sourceId: { $in: slugs } },
        { "rawIcoData.slug": { $in: slugs } },
        { "rawIcoData.sourceId": { $in: slugs } },
        { "rawIcoData.dropstabSlug": { $in: slugs } },
        { "sourceMappings.sourceSlug": { $in: slugs } },
      );
    }

    if (values.normalizedNames.size) or.push({ normalizedName: { $in: Array.from(values.normalizedNames) } });
    if (values.names.size) {
      const names = Array.from(values.names);
      or.push({ name: { $in: names } }, { "rawIcoData.name": { $in: names } }, { aliases: { $in: names } });
    }

    if (values.symbols.size) {
      const symbols = Array.from(values.symbols);
      or.push(
        { symbol: { $in: symbols } },
        { ticker: { $in: symbols } },
        { niche: { $in: symbols } },
        { "rawIcoData.symbol": { $in: symbols } },
        { "rawIcoData.ticker": { $in: symbols } },
      );
    }

    if (!or.length) return [];
    return this.projectModel.find({ $or: or }).select(this.projectProjection()).lean();
  }

  private async loadProjectResolverSourceMaps(inputs: any[]): Promise<any[]> {
    const values = this.collectProjectResolverValues(inputs);
    const or: any[] = [];

    for (const [source, sourceIds] of values.sourceIdsBySource) {
      if (sourceIds.size) or.push({ source, sourceId: { $in: Array.from(sourceIds) } });
    }
    for (const [source, sourceSlugs] of values.sourceSlugsBySource) {
      if (sourceSlugs.size) or.push({ source, sourceSlug: { $in: Array.from(sourceSlugs) } });
    }
    for (const [source, sourceUrls] of values.sourceUrlsBySource) {
      if (sourceUrls.size) or.push({ source, sourceUrl: { $in: Array.from(sourceUrls) } });
    }

    for (const [source, ids] of Object.entries(values.providerIds)) {
      if (!ids.size) continue;
      const sourceName = source === "coinMarketCapId" ? "coinmarketcap" : source.replace(/Id$/, "").toLowerCase();
      or.push({ source: sourceName, sourceId: { $in: Array.from(ids) } });
      or.push({ source: sourceName, sourceSlug: { $in: Array.from(ids) } });
    }

    if (!or.length) return [];
    return this.projectSourceMapModel
      .find({ $or: or })
      .select(this.projectSourceMapProjection())
      .sort({ isVerified: -1, confidence: -1, updatedAt: -1 })
      .lean();
  }

  private collectProjectResolverValues(inputs: any[]) {
    const sourceIdsBySource = new Map<string, Set<string>>();
    const sourceSlugsBySource = new Map<string, Set<string>>();
    const sourceUrlsBySource = new Map<string, Set<string>>();
    const providerIds = {
      coingeckoId: new Set<string>(),
      coinMarketCapId: new Set<string>(),
      dropstabId: new Set<string>(),
      cryptorankId: new Set<string>(),
      icodropsId: new Set<string>(),
    };
    const capIds = new Set<number>();
    const slugs = new Set<string>();
    const names = new Set<string>();
    const normalizedNames = new Set<string>();
    const symbols = new Set<string>();

    const addScoped = (target: Map<string, Set<string>>, source: any, value: any) => {
      const normalizedSource = this.cleanString(source).toLowerCase();
      const normalizedValue = this.cleanString(value);
      if (!normalizedSource || !normalizedValue) return;
      if (!target.has(normalizedSource)) target.set(normalizedSource, new Set<string>());
      target.get(normalizedSource).add(normalizedValue);
    };

    for (const input of inputs) {
      const source = this.cleanString(input.source).toLowerCase();
      for (const value of this.uniqueStrings([input.sourceId, input.sourceKey, input.externalId])) {
        addScoped(sourceIdsBySource, source, value);
      }
      for (const value of this.uniqueStrings([input.slug, input.coinSlug, input.sourceSlug]).map((value) => this.normalizedSlug(value))) {
        addScoped(sourceSlugsBySource, source, value);
        if (value) slugs.add(value);
      }
      for (const value of this.uniqueStrings([input.sourceUrl, this.normalizedUrl(input.sourceUrl)])) {
        addScoped(sourceUrlsBySource, source, value);
      }

      const providerInput = input.providerIds || {};
      this.addCleanString(providerIds.coingeckoId, providerInput.coingeckoId);
      this.addCleanString(providerIds.coinMarketCapId, providerInput.coinMarketCapId || providerInput.coinmarketcapId);
      this.addCleanString(providerIds.dropstabId, providerInput.dropstabId);
      this.addCleanString(providerIds.cryptorankId, providerInput.cryptorankId);
      this.addCleanString(providerIds.icodropsId, providerInput.icodropsId);
      const capId = Number(providerInput.dropstabId);
      if (Number.isFinite(capId)) capIds.add(capId);

      const name = this.cleanString(input.name);
      if (name) names.add(name);
      const normalizedName = this.normalizedName(input.name);
      if (normalizedName) normalizedNames.add(normalizedName);
      const symbol = this.normalizedSymbol(input.symbol);
      if (symbol) symbols.add(symbol);
    }

    return {
      sourceIdsBySource,
      sourceSlugsBySource,
      sourceUrlsBySource,
      providerIds,
      capIds,
      slugs,
      names,
      normalizedNames,
      symbols,
    };
  }

  private createProjectResolverBatchCache(projectsById: Map<string, any>): CanonicalProjectResolverBatchCache {
    return {
      projectsById,
      sourceMapsBySourceId: new Map<string, any[]>(),
      sourceMapsBySourceSlug: new Map<string, any[]>(),
      sourceMapsBySourceUrl: new Map<string, any[]>(),
      projectsBySourceId: new Map<string, any[]>(),
      projectsBySourceUrl: new Map<string, any[]>(),
      projectsByProvider: new Map<string, any[]>(),
      projectsByCapId: new Map<string, any[]>(),
      projectsBySlug: new Map<string, any[]>(),
      projectsByName: new Map<string, any[]>(),
      projectsBySymbol: new Map<string, any[]>(),
    };
  }

  private indexProjectResolverProject(cache: CanonicalProjectResolverBatchCache, project: any) {
    this.addResolverIndex(cache.projectsBySourceId, this.sourceCacheKey(project?.source, project?.sourceId), project);
    this.addResolverIndex(cache.projectsBySourceUrl, this.sourceCacheKey(project?.source, project?.detailUrl), project);
    this.addResolverIndex(cache.projectsBySourceUrl, this.sourceCacheKey(project?.source, project?.sourceUrl), project);

    this.indexProviderValues(cache, "coingeckoId", [
      project?.coingeckoId,
      project?.rawIcoData?.coingeckoId,
      project?.rawIcoData?.coinGeckoId,
      project?.rawIcoData?.marketData?.coingeckoId,
      project?.rawIcoData?.marketData?.coinGeckoId,
      project?.tokenMetrics?.coingeckoId,
      project?.tokenMetrics?.coinGeckoId,
      ...this.valuesFromArray(project?.tokenMetrics, "coingeckoId"),
      ...this.valuesFromArray(project?.tokenMetrics, "coinGeckoId"),
    ], project);
    this.indexProviderValues(cache, "coinMarketCapId", [
      project?.coinMarketCapId,
      project?.coinmarketcapId,
      project?.rawIcoData?.coinMarketCapId,
      project?.rawIcoData?.coinmarketcapId,
      project?.rawIcoData?.marketData?.coinMarketCapId,
      project?.rawIcoData?.marketData?.coinmarketcapId,
      project?.tokenMetrics?.coinMarketCapId,
      project?.tokenMetrics?.coinmarketcapId,
      ...this.valuesFromArray(project?.tokenMetrics, "coinMarketCapId"),
      ...this.valuesFromArray(project?.tokenMetrics, "coinmarketcapId"),
    ], project);
    this.indexProviderValues(cache, "dropstabId", [project?.dropstabId, project?.rawIcoData?.dropstabId, project?.rawIcoData?.dropstabSlug], project);
    this.indexProviderValues(cache, "cryptorankId", [project?.cryptorankId, project?.rawIcoData?.cryptorankId], project);
    this.indexProviderValues(cache, "icodropsId", [project?.icodropsId, project?.sourceId, project?.rawIcoData?.sourceId, project?.rawIcoData?.icodropsId], project);
    if (project?.capId !== undefined && project?.capId !== null) {
      this.addResolverIndex(cache.projectsByCapId, this.cleanString(project.capId).toLowerCase(), project);
    }

    for (const value of [
      project?.slug,
      project?.sourceId,
      project?.rawIcoData?.slug,
      project?.rawIcoData?.sourceId,
      project?.rawIcoData?.dropstabSlug,
      ...(project?.sourceMappings || []).map((mapping) => mapping?.sourceSlug),
    ]) {
      this.addResolverIndex(cache.projectsBySlug, this.normalizedSlug(value), project);
    }

    for (const value of [
      project?.normalizedName,
      this.normalizedName(project?.name),
      this.normalizedName(project?.rawIcoData?.name),
      ...(project?.aliases || []).map((alias) => this.normalizedName(alias)),
    ]) {
      this.addResolverIndex(cache.projectsByName, value, project);
    }

    for (const value of [project?.symbol, project?.ticker, project?.niche, project?.rawIcoData?.symbol, project?.rawIcoData?.ticker]) {
      this.addResolverIndex(cache.projectsBySymbol, this.normalizedSymbol(value), project);
    }
  }

  private indexProjectResolverSourceMap(cache: CanonicalProjectResolverBatchCache, sourceMap: any) {
    this.addResolverIndex(cache.sourceMapsBySourceId, this.sourceCacheKey(sourceMap?.source, sourceMap?.sourceId), sourceMap);
    this.addResolverIndex(cache.sourceMapsBySourceSlug, this.sourceCacheKey(sourceMap?.source, sourceMap?.sourceSlug), sourceMap);
    this.addResolverIndex(cache.sourceMapsBySourceUrl, this.sourceCacheKey(sourceMap?.source, sourceMap?.sourceUrl), sourceMap);
    this.addResolverIndex(cache.sourceMapsBySourceUrl, this.sourceCacheKey(sourceMap?.source, this.normalizedUrl(sourceMap?.sourceUrl)), sourceMap);
  }

  private projectResolverCacheInput(bucketEntityType: CanonicalProjectBackfillEntityType, doc: any) {
    if (bucketEntityType === "fundingRounds") {
      return {
        source: doc.source,
        sourceId: doc.sourceId || doc.sourceKey || doc.roundId || doc.id,
        sourceKey: doc.sourceKey,
        sourceSlug: doc.coinSlug,
        name: doc.projectName,
        slug: doc.coinSlug,
        coinSlug: doc.coinSlug,
        symbol: doc.coinSymbol,
      };
    }
    if (bucketEntityType === "tokenUnlocks") {
      return {
        source: doc.source,
        sourceId: doc.sourceId || doc.sourceKey || doc.coinId,
        sourceKey: doc.sourceKey,
        sourceSlug: doc.coinSlug,
        sourceUrl: doc.sourceUrl || doc.detailUrl,
        name: doc.projectName,
        slug: doc.coinSlug,
        coinSlug: doc.coinSlug,
        symbol: doc.coinSymbol,
        providerIds: {
          dropstabId: doc.source === "dropstab" ? doc.coinId : undefined,
        },
      };
    }
    if (bucketEntityType === "cryptoActivities") {
      return {
        source: doc.primarySource || doc.source || doc.syncMeta?.sourceSystem,
        sourceId: doc.parserActivityId || doc.id,
        sourceSlug: doc.externalSlug || doc.slug || doc.coinSlug,
        sourceUrl: doc.sourceUrl || doc.originalUrl,
        name: doc.projectName || doc.coinName || doc.name,
        slug: doc.coinSlug || doc.slug || doc.externalSlug,
        coinSlug: doc.coinSlug,
        symbol: doc.coinSymbol || doc.symbol,
      };
    }
    return {};
  }

  private hasDirectProjectLink(doc: any): boolean {
    return Boolean(doc?.projectId || (Array.isArray(doc?.projectLinks) && doc.projectLinks.some((link) => link?.projectId)));
  }

  private hasProjectResolverSignals(input: any): boolean {
    return Boolean(
      input?.source ||
      input?.sourceId ||
      input?.sourceKey ||
      input?.sourceSlug ||
      input?.sourceUrl ||
      input?.name ||
      input?.slug ||
      input?.coinSlug ||
      input?.symbol ||
      Object.values(input?.providerIds || {}).some(Boolean),
    );
  }

  private indexProviderValues(cache: CanonicalProjectResolverBatchCache, field: string, values: any[], project: any) {
    for (const value of values || []) {
      this.addResolverIndex(cache.projectsByProvider, this.providerCacheKey(field, value), project);
    }
  }

  private addResolverIndex(index: Map<string, any[]>, key: string, value: any) {
    if (!key || !value) return;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(value);
  }

  private async checkMarketProjectPairs(scanLimit?: number, dryRun = true, bulk = false): Promise<MarketProjectPairingSummary> {
    this.logProgress(`marketProjectPairing: loading market/project profiles scanLimit=${scanLimit ?? "all"}`);
    const [marketProjects, projectProfiles] = await Promise.all([
      this.listDocuments(this.projectModel, scanLimit, { projectType: "market" }, this.projectProjection()),
      this.listDocuments(this.projectModel, scanLimit, { projectType: "project" }, this.projectProjection()),
    ]);
    const summary = this.createMarketProjectPairingSummary(marketProjects.length, projectProfiles.length);
    const profileIndexes = this.buildProjectProfilePairingIndexes(projectProfiles);
    const typedPairs = await this.loadExistingTypedProjectPairs([...marketProjects, ...projectProfiles]);
    const pairedProjectProfileIds = new Set<string>();
    const conflictedProjectProfileIds = new Set<string>();
    const verifiedPairsForBulkApply: Array<{ marketProject: any; projectProfile: any; result: any }> = [];
    const resolvedPairs = marketProjects.map((marketProject) => ({
      marketProject,
      result: this.resolveMarketProjectPair(marketProject, profileIndexes, typedPairs),
    }));
    const profileClaims = new Map<string, number>();

    for (const { result } of resolvedPairs) {
      if (!["verified", "proposed"].includes(result.status) || !result.projectProfile?._id) continue;
      const projectProfileId = String(result.projectProfile._id);
      profileClaims.set(projectProfileId, (profileClaims.get(projectProfileId) || 0) + 1);
    }
    for (const [projectProfileId, count] of profileClaims.entries()) {
      if (count > 1) conflictedProjectProfileIds.add(projectProfileId);
    }

    for (const { marketProject, result } of resolvedPairs) {
      const resultProjectProfileId = result.projectProfile?._id ? String(result.projectProfile._id) : "";
      if (resultProjectProfileId && conflictedProjectProfileIds.has(resultProjectProfileId)) {
        summary.conflictPairs += 1;
        this.pushExample(
          summary.examples.conflicts,
          this.marketProjectPairExample(marketProject, {
            ...result,
            status: "conflict",
            reason: "Multiple market projects point to the same project profile; automatic pairing is unsafe.",
          }),
        );
        continue;
      }

      if (result.status === "verified" || result.status === "proposed") {
        summary.pairedMarketProject += 1;
        if (result.status === "verified") summary.verifiedPairs += 1;
        if (result.status === "proposed") summary.proposedPairs += 1;
        if (result.projectProfile?._id) pairedProjectProfileIds.add(String(result.projectProfile._id));

        if (result.status === "verified" && result.projectProfile?._id && !dryRun && bulk) {
          verifiedPairsForBulkApply.push({ marketProject, projectProfile: result.projectProfile, result });
        } else if (result.status === "verified" && result.projectProfile?._id && !dryRun) {
          const mergeResult: any = await this.canonicalProjectService.mergeMarketProjectPair(marketProject, result.projectProfile, {
            dryRun,
            confidence: result.confidence || 100,
            matchedBy: result.matchedBy,
            reason: result.reason,
          });
          if (mergeResult?.status === "success") {
            summary.appliedPairs += dryRun ? 0 : 1;
            summary.mergedCanonicalProjects += Number(
              mergeResult.mergedCanonicalProjects || mergeResult.wouldMergeCanonicalProjects || 0,
            );
          } else if (mergeResult?.status === "conflict") {
            summary.conflictPairs += 1;
            this.pushExample(summary.examples.conflicts, this.marketProjectPairExample(marketProject, { ...result, ...mergeResult }));
          }
        }

        this.pushExample(summary.examples.paired, this.marketProjectPairExample(marketProject, result));
      } else if (result.status === "ambiguous") {
        summary.ambiguousPairs += 1;
        this.pushExample(summary.examples.ambiguous, this.marketProjectPairExample(marketProject, result));
      } else if (result.status === "unsafe") {
        summary.unsafePairs += 1;
        this.pushExample(summary.examples.unsafe, this.marketProjectPairExample(marketProject, result));
      } else if (result.status === "conflict") {
        summary.conflictPairs += 1;
        this.pushExample(summary.examples.conflicts, this.marketProjectPairExample(marketProject, result));
      } else {
        summary.marketOnly += 1;
        this.pushExample(summary.examples.marketOnly, this.projectPairingProjectExample(marketProject));
      }
    }

    if (!dryRun && bulk && verifiedPairsForBulkApply.length) {
      const bulkResult = await this.bulkApplyVerifiedMarketProjectPairs(verifiedPairsForBulkApply);
      summary.appliedPairs += bulkResult.appliedPairs;
      summary.mergedCanonicalProjects += bulkResult.mergedCanonicalProjects;
    }

    for (const projectProfile of projectProfiles) {
      if (pairedProjectProfileIds.has(String(projectProfile._id))) continue;
      if (conflictedProjectProfileIds.has(String(projectProfile._id))) continue;
      summary.projectOnly += 1;
      this.pushExample(summary.examples.projectOnly, this.projectPairingProjectExample(projectProfile));
    }

    this.logProgress(
      `marketProjectPairing: completed market=${summary.marketProjectsScanned} project=${summary.projectProfilesScanned} paired=${summary.pairedMarketProject} verified=${summary.verifiedPairs} proposed=${summary.proposedPairs} ambiguous=${summary.ambiguousPairs} unsafe=${summary.unsafePairs} conflicts=${summary.conflictPairs} mergedCanonicalProjects=${summary.mergedCanonicalProjects}`,
    );

    return summary;
  }

  private async bulkApplyVerifiedMarketProjectPairs(
    pairs: Array<{ marketProject: any; projectProfile: any; result: any }>,
  ): Promise<{ appliedPairs: number; mergedCanonicalProjects: number }> {
    this.logProgress(`marketProjectPairing: bulk applying verified pairs count=${pairs.length}`);
    const marketIds = this.uniqueObjectIds(pairs.map((pair) => pair.marketProject?._id));
    const profileIds = this.uniqueObjectIds(pairs.map((pair) => pair.projectProfile?._id));
    const allProjectIds = this.uniqueObjectIds([...marketIds, ...profileIds]);
    const canonicalProjects = await this.canonicalProjectModel
      .find({
        $or: [
          { primaryMarketProjectId: { $in: marketIds } },
          { primaryProjectId: { $in: profileIds } },
          { "sourceRefs.projectId": { $in: allProjectIds } },
        ],
      })
      .select({ _id: 1, primaryMarketProjectId: 1, primaryProjectId: 1, sourceRefs: 1 })
      .lean();
    const canonicalByProjectId = new Map<string, any>();
    for (const canonicalProject of canonicalProjects as any[]) {
      if (canonicalProject.primaryMarketProjectId) canonicalByProjectId.set(String(canonicalProject.primaryMarketProjectId), canonicalProject);
      if (canonicalProject.primaryProjectId) canonicalByProjectId.set(String(canonicalProject.primaryProjectId), canonicalProject);
      for (const sourceRef of canonicalProject.sourceRefs || []) {
        if (sourceRef?.projectId) canonicalByProjectId.set(String(sourceRef.projectId), canonicalProject);
      }
    }

    const canonicalOps: any[] = [];
    const moveLinkOps: any[] = [];
    const upsertLinkOps: any[] = [];
    const auditDocs: any[] = [];
    let mergedCanonicalProjects = 0;
    const now = new Date();

    for (const pair of pairs) {
      const marketProjectId = this.toObjectId(pair.marketProject?._id);
      const profileProjectId = this.toObjectId(pair.projectProfile?._id);
      if (!marketProjectId || !profileProjectId) continue;

      const marketCanonical = canonicalByProjectId.get(String(marketProjectId));
      const profileCanonical = canonicalByProjectId.get(String(profileProjectId));
      const targetId = this.toObjectId(marketCanonical?._id || profileCanonical?._id || marketProjectId);
      const sourceId =
        profileCanonical?._id && targetId && String(profileCanonical._id) !== String(targetId)
          ? this.toObjectId(profileCanonical._id)
          : null;
      if (!targetId) continue;

      const aliases = this.uniqueObjects(
        [
          ...this.bulkAliasesFromProject(pair.marketProject, this.normalizeProviderIds(this.providerIdsFromDoc(pair.marketProject))),
          ...this.bulkAliasesFromProject(pair.projectProfile, this.normalizeProviderIds(this.providerIdsFromDoc(pair.projectProfile))),
        ],
        (alias) => `${alias.type}:${alias.normalizedValue}:${alias.source || ""}`,
      );
      const sourceRefs = this.uniqueObjects(
        [...this.bulkSourceRefsFromProject(pair.marketProject), ...this.bulkSourceRefsFromProject(pair.projectProfile)],
        (ref) => `${ref.source}:${ref.sourceId || ""}:${ref.sourceSlug || ""}:${String(ref.projectId || "")}`,
      );

      if (sourceId) {
        mergedCanonicalProjects += 1;
        moveLinkOps.push({
          updateMany: {
            filter: { canonicalProjectId: sourceId },
            update: { $set: { canonicalProjectId: targetId, updatedAt: now } },
          },
        });
        canonicalOps.push({
          deleteOne: {
            filter: { _id: sourceId },
          },
        });
      }

      canonicalOps.push({
        updateOne: {
          filter: { _id: targetId },
          update: {
            $set: {
              primaryMarketProjectId: marketProjectId,
              primaryProjectId: profileProjectId,
              status: "active",
              "dataQuality.hasMarketProject": true,
              "dataQuality.hasProjectProfile": true,
              "dataQuality.hasIcoProject": true,
              updatedAt: now,
            },
            ...(aliases.length ? { $addToSet: { aliases: { $each: aliases } } } : {}),
            ...(sourceRefs.length ? { $addToSet: { sourceRefs: { $each: sourceRefs } } } : {}),
          },
          upsert: false,
        },
      });

      upsertLinkOps.push(
        this.bulkPairProjectLinkOp(targetId, pair.marketProject, "market", pair.result),
        this.bulkPairProjectLinkOp(targetId, pair.projectProfile, "project", pair.result),
      );
      auditDocs.push({
        operation: "merge",
        canonicalProjectId: targetId,
        before: {
          marketCanonicalId: marketCanonical?._id,
          projectProfileCanonicalId: profileCanonical?._id,
          sourceCanonicalId: sourceId,
        },
        after: {
          primaryMarketProjectId: marketProjectId,
          primaryProjectId: profileProjectId,
          deletedSourceCanonicalProject: Boolean(sourceId),
        },
        confidence: pair.result?.confidence || 100,
        matchedBy: pair.result?.matchedBy,
        reason: pair.result?.reason || "Merged verified market/project pair into one canonical project.",
        dryRun: false,
        status: "success",
        createdAt: now,
      });
    }

    if (moveLinkOps.length) await this.canonicalProjectLinkModel.bulkWrite(moveLinkOps, { ordered: false });
    if (upsertLinkOps.length) await this.canonicalProjectLinkModel.bulkWrite(upsertLinkOps, { ordered: false });
    if (canonicalOps.length) await this.canonicalProjectModel.bulkWrite(canonicalOps, { ordered: false });
    if (auditDocs.length) await this.canonicalProjectLinkAuditLogModel.insertMany(auditDocs, { ordered: false });

    return { appliedPairs: pairs.length, mergedCanonicalProjects };
  }

  private bulkPairProjectLinkOp(canonicalProjectId: Types.ObjectId, project: any, projectType: "market" | "project", result: any) {
    const projectId = this.toObjectId(project?._id);
    const now = new Date();
    return {
      updateOne: {
        filter: { canonicalProjectId, entityType: "project", entityId: projectId },
        update: {
          $set: {
            canonicalProjectId,
            entityType: "project",
            entityId: projectId,
            legacyProjectId: projectId,
            projectType,
            source: this.cleanString(project.source || "project"),
            sourceId: this.cleanString(project.sourceId || project.rawIcoData?.sourceId),
            sourceSlug: this.normalizedSlug(project.slug || project.rawIcoData?.slug || ""),
            sourceUrl: this.cleanString(project.sourceUrl || project.detailUrl),
            confidence: result?.confidence || 100,
            matchedBy: result?.matchedBy || "marketProjectPairing",
            reason: result?.reason || "Verified market/project pairing link.",
            status: "verified",
            dryRun: false,
            createdBy: "system",
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        upsert: true,
      },
    };
  }

  private createMarketProjectPairingSummary(marketProjectsScanned: number, projectProfilesScanned: number): MarketProjectPairingSummary {
    return {
      marketProjectsScanned,
      projectProfilesScanned,
      pairedMarketProject: 0,
      marketOnly: 0,
      projectOnly: 0,
      verifiedPairs: 0,
      proposedPairs: 0,
      ambiguousPairs: 0,
      unsafePairs: 0,
      conflictPairs: 0,
      appliedPairs: 0,
      mergedCanonicalProjects: 0,
      examples: {
        paired: [],
        marketOnly: [],
        projectOnly: [],
        ambiguous: [],
        unsafe: [],
        conflicts: [],
      },
    };
  }

  private buildProjectProfilePairingIndexes(projectProfiles: any[]) {
    const indexes = {
      byId: new Map<string, any>(),
      byProvider: new Map<string, any[]>(),
      bySource: new Map<string, any[]>(),
      bySlugSymbol: new Map<string, any[]>(),
      byNameSymbol: new Map<string, any[]>(),
      bySlug: new Map<string, any[]>(),
      byName: new Map<string, any[]>(),
      bySymbol: new Map<string, any[]>(),
    };

    for (const project of projectProfiles) {
      indexes.byId.set(String(project._id), project);
      for (const key of this.providerPairingKeys(project)) this.addPairingIndex(indexes.byProvider, key, project);
      for (const key of this.sourcePairingKeys(project)) this.addPairingIndex(indexes.bySource, key, project);
      this.addPairingIndex(indexes.bySlugSymbol, this.slugSymbolPairingKey(project), project);
      this.addPairingIndex(indexes.byNameSymbol, this.nameSymbolPairingKey(project), project);
      this.addPairingIndex(indexes.bySlug, this.normalizedSlug(project?.slug || project?.rawIcoData?.slug), project);
      this.addPairingIndex(indexes.byName, this.normalizedName(project?.name || project?.rawIcoData?.name), project);
      this.addPairingIndex(indexes.bySymbol, this.normalizedSymbol(project?.symbol || project?.ticker || project?.rawIcoData?.symbol), project);
    }

    return indexes;
  }

  private async loadExistingTypedProjectPairs(projects: any[]): Promise<Map<string, Set<string>>> {
    const projectIds = this.uniqueObjectIds(projects.map((project) => project?._id));
    const pairs = new Map<string, Set<string>>();
    if (!projectIds.length) return pairs;

    const [rounds, unlocks] = await Promise.all([
      this.fundingRoundModel
        .find({ "projectLinks.projectId": { $in: projectIds } })
        .select({ projectLinks: 1 })
        .limit(5000)
        .lean(),
      this.tokenUnlockModel
        .find({ "projectLinks.projectId": { $in: projectIds } })
        .select({ projectLinks: 1 })
        .limit(5000)
        .lean(),
    ]);

    for (const doc of [...(rounds as any[]), ...(unlocks as any[])]) {
      const marketIds = (doc.projectLinks || [])
        .filter((link) => link?.projectType === "market" && link?.projectId)
        .map((link) => String(link.projectId));
      const projectProfileIds = (doc.projectLinks || [])
        .filter((link) => link?.projectType === "project" && link?.projectId)
        .map((link) => String(link.projectId));
      for (const marketId of marketIds) {
        if (!pairs.has(marketId)) pairs.set(marketId, new Set<string>());
        for (const projectProfileId of projectProfileIds) pairs.get(marketId).add(projectProfileId);
      }
    }

    return pairs;
  }

  private resolveMarketProjectPair(marketProject: any, indexes: any, typedPairs: Map<string, Set<string>>) {
    const marketId = String(marketProject._id);
    const verifiedRules = [
      {
        matchedBy: "existingTypedProjectLinks",
        reason: "Existing legacy projectLinks already connect market/project pair.",
        candidates: Array.from(typedPairs.get(marketId) || []).map((id) => indexes.byId.get(id)).filter(Boolean),
      },
      {
        matchedBy: "providerId",
        reason: "Exact provider id match.",
        candidates: this.candidatesForKeys(indexes.byProvider, this.providerPairingKeys(marketProject)),
      },
      {
        matchedBy: "sourceMapping",
        reason: "Exact source/source mapping match.",
        candidates: this.candidatesForKeys(indexes.bySource, this.sourcePairingKeys(marketProject)),
      },
      {
        matchedBy: "slug+symbol",
        reason: "Same slug and same symbol with no ambiguity.",
        candidates: this.candidatesForKeys(indexes.bySlugSymbol, [this.slugSymbolPairingKey(marketProject)]),
      },
    ];

    const verifiedResult = this.resolveVerifiedPairingRules(verifiedRules);
    if (verifiedResult) return verifiedResult;

    const proposedRules = [
      {
        matchedBy: "name+symbol",
        reason: "Same normalized name and same symbol.",
        candidates: this.candidatesForKeys(indexes.byNameSymbol, [this.nameSymbolPairingKey(marketProject)]),
      },
      {
        matchedBy: "slug",
        reason: "Same slug only.",
        candidates: this.candidatesForKeys(indexes.bySlug, [this.normalizedSlug(marketProject?.slug || marketProject?.rawIcoData?.slug)]),
      },
      {
        matchedBy: "normalizedName",
        reason: "Same normalized name only.",
        candidates: this.candidatesForKeys(indexes.byName, [this.normalizedName(marketProject?.name || marketProject?.rawIcoData?.name)]),
      },
    ];

    for (const rule of proposedRules) {
      const candidates = this.uniqueProjects(rule.candidates);
      if (!candidates.length) continue;
      if (candidates.length > 1) {
        return { status: "ambiguous", matchedBy: rule.matchedBy, reason: rule.reason, candidates };
      }
      return { status: "proposed", matchedBy: rule.matchedBy, reason: rule.reason, confidence: 70, projectProfile: candidates[0] };
    }

    const symbolOnlyCandidates = this.uniqueProjects(
      this.candidatesForKeys(indexes.bySymbol, [this.normalizedSymbol(marketProject?.symbol || marketProject?.ticker)]),
    );
    if (symbolOnlyCandidates.length) {
      return {
        status: "unsafe",
        matchedBy: "symbol",
        reason: "Symbol-only market/project match is unsafe and never verified.",
        confidence: 40,
        candidates: symbolOnlyCandidates,
        projectProfile: symbolOnlyCandidates.length === 1 ? symbolOnlyCandidates[0] : undefined,
      };
    }

    return { status: "marketOnly", matchedBy: "none", reason: "No market/project profile candidate found.", confidence: 0 };
  }

  private resolveVerifiedPairingRules(rules: Array<{ matchedBy: string; reason: string; candidates: any[] }>): any | null {
    const matchedRules = rules
      .map((rule) => ({ ...rule, candidates: this.uniqueProjects(rule.candidates) }))
      .filter((rule) => rule.candidates.length > 0);
    if (!matchedRules.length) return null;

    const candidateIds = new Set<string>();
    for (const rule of matchedRules) {
      if (rule.candidates.length > 1) {
        return { status: "ambiguous", matchedBy: rule.matchedBy, reason: rule.reason, candidates: rule.candidates };
      }
      candidateIds.add(String(rule.candidates[0]._id));
    }

    if (candidateIds.size > 1) {
      return {
        status: "conflict",
        matchedBy: matchedRules.map((rule) => rule.matchedBy).join("+"),
        reason: "Verified pairing rules point to different project profiles.",
        candidates: matchedRules.map((rule) => rule.candidates[0]),
      };
    }

    const firstRule = matchedRules[0];
    return {
      status: "verified",
      matchedBy: matchedRules.map((rule) => rule.matchedBy).join("+"),
      reason: firstRule.reason,
      confidence: 100,
      projectProfile: firstRule.candidates[0],
    };
  }

  private marketProjectPairExample(marketProject: any, result: any) {
    return {
      status: result.status,
      matchedBy: result.matchedBy,
      confidence: result.confidence || 0,
      reason: result.reason,
      marketProject: this.projectPairingProjectExample(marketProject),
      projectProfile: result.projectProfile ? this.projectPairingProjectExample(result.projectProfile) : undefined,
      candidates: (result.candidates || []).slice(0, 5).map((candidate) => this.projectPairingProjectExample(candidate)),
      canonicalProjectShape: result.projectProfile
        ? {
          primaryMarketProjectId: String(marketProject._id),
          primaryProjectId: String(result.projectProfile._id),
        }
        : undefined,
    };
  }

  private projectPairingProjectExample(project: any) {
    return {
      id: String(project?._id || ""),
      projectType: project?.projectType,
      name: project?.name,
      slug: project?.slug || project?.rawIcoData?.slug,
      symbol: project?.symbol || project?.ticker || project?.rawIcoData?.symbol,
      providerIds: this.providerIdsFromDoc(project || {}),
      source: project?.source,
      sourceId: project?.sourceId,
    };
  }

  private async loadProjectMap(
    bucketEntityType: CanonicalProjectBackfillEntityType,
    docs: any[],
    projectIds: Types.ObjectId[],
  ): Promise<Map<string, any>> {
    const projectById = new Map<string, any>();

    if (bucketEntityType === "projects") {
      for (const doc of docs) {
        if (doc?._id) projectById.set(String(doc._id), doc);
      }
      return projectById;
    }

    if (!projectIds.length) return projectById;

    const projects = await this.projectModel.find({ _id: { $in: projectIds } }).select(this.projectProjection()).lean();
    for (const project of projects as any[]) {
      if (project?._id) projectById.set(String(project._id), project);
    }
    return projectById;
  }

  private async loadCanonicalLookupCache(projects: any[]): Promise<BackfillScanContext["canonicalLookupCache"]> {
    const byProjectId = new Map<string, any>();
    const byProviderKey = new Map<string, any>();
    const bySourceKey = new Map<string, any>();
    const projectIds = this.uniqueObjectIds(projects.map((project) => project?._id));
    const providerValues = this.collectProviderValues(projects);
    const sourceValues = this.collectSourceValues(projects);
    const or: any[] = [];

    if (projectIds.length) {
      or.push(
        { primaryProjectId: { $in: projectIds } },
        { primaryMarketProjectId: { $in: projectIds } },
        { "sourceRefs.projectId": { $in: projectIds } },
      );
    }

    for (const [field, values] of Object.entries(providerValues)) {
      if (values.size) or.push({ [`providerIds.${field}`]: { $in: Array.from(values) } });
    }

    for (const [source, sourceIds] of Object.entries(sourceValues)) {
      if (sourceIds.size) {
        or.push({
          sourceRefs: {
            $elemMatch: {
              source,
              sourceId: { $in: Array.from(sourceIds) },
            },
          },
        });
      }
    }

    if (!or.length) return { byProjectId, byProviderKey, bySourceKey };

    const canonicalProjects = await this.canonicalProjectModel.find({ $or: or }).lean();
    for (const canonicalProject of canonicalProjects as any[]) {
      for (const field of ["primaryProjectId", "primaryMarketProjectId"]) {
        if (canonicalProject?.[field]) byProjectId.set(String(canonicalProject[field]), canonicalProject);
      }

      for (const sourceRef of canonicalProject.sourceRefs || []) {
        if (sourceRef?.projectId) byProjectId.set(String(sourceRef.projectId), canonicalProject);
        const sourceKey = this.sourceCacheKey(sourceRef?.source, sourceRef?.sourceId);
        if (sourceKey) bySourceKey.set(sourceKey, canonicalProject);
      }

      for (const [field, value] of Object.entries(canonicalProject.providerIds || {})) {
        const providerKey = this.providerCacheKey(field, value);
        if (providerKey) byProviderKey.set(providerKey, canonicalProject);
      }
    }

    return { byProjectId, byProviderKey, bySourceKey };
  }

  private async loadLinkLookupCache(
    bucketEntityType: CanonicalProjectBackfillEntityType,
    docs: any[],
    projectIdStrings: string[],
  ): Promise<BackfillScanContext["linkLookupCache"]> {
    const byEntityCanonical = new Map<string, any>();
    const verifiedByEntity = new Map<string, any>();
    const dryRunByEntityCanonical = new Map<string, any>();
    const dryRunVerifiedByEntity = new Map<string, any>();
    const or: any[] = [];
    const projectIds = this.uniqueObjectIds(projectIdStrings);
    const entityIds = this.uniqueObjectIds(docs.map((doc) => doc?._id));
    const entityType = this.entityTypeForBucket(bucketEntityType);

    if (projectIds.length) {
      or.push({ entityType: "project", entityId: { $in: projectIds } });
    }
    if (entityIds.length) {
      or.push({ entityType, entityId: { $in: entityIds } });
    }

    if (!or.length) {
      return { byEntityCanonical, verifiedByEntity, dryRunByEntityCanonical, dryRunVerifiedByEntity };
    }

    const links = await this.canonicalProjectLinkModel.find({ $or: or }).lean();
    for (const link of links as any[]) {
      const entityKey = CanonicalProjectLinkService.entityKey(link.entityType, link.entityId);
      const entityCanonicalKey = CanonicalProjectLinkService.entityCanonicalKey(
        link.entityType,
        link.entityId,
        link.canonicalProjectId,
      );
      byEntityCanonical.set(entityCanonicalKey, link);
      if (link.status === "verified") verifiedByEntity.set(entityKey, link);
    }

    return { byEntityCanonical, verifiedByEntity, dryRunByEntityCanonical, dryRunVerifiedByEntity };
  }

  private collectProjectIdsFromDocs(bucketEntityType: CanonicalProjectBackfillEntityType, docs: any[]): Types.ObjectId[] {
    if (bucketEntityType === "projects") {
      return this.uniqueObjectIds(docs.map((doc) => doc?._id));
    }

    const values: any[] = [];
    for (const doc of docs) {
      if (doc?.projectId) values.push(doc.projectId);
      for (const projectLink of doc?.projectLinks || []) {
        if (projectLink?.projectId) values.push(projectLink.projectId);
      }
    }
    return this.uniqueObjectIds(values);
  }

  private projectsForDoc(projectById: Map<string, any>, doc: any): any[] {
    const projectIds = this.uniqueObjectIds([
      doc?.projectId,
      ...(doc?.projectLinks || []).map((projectLink) => projectLink?.projectId),
    ]);
    return projectIds.map((projectId) => projectById.get(String(projectId))).filter(Boolean);
  }

  private async process(
    bucketEntityType: CanonicalProjectBackfillEntityType,
    sourceDoc: any,
    input: CanonicalProjectResolverAdapterInput,
    dryRun: boolean,
    dryRunCache: Map<string, any>,
    scanContext: BackfillScanContext,
    summary: BackfillSummary,
  ) {
    summary.scanned[bucketEntityType] += 1;

    try {
      if (input.entityType === "cryptoActivity") {
        const skippedResult: CanonicalProjectResolverAdapterOutput = {
          status: "skipped",
          confidence: 40,
          matchedBy: "projectCandidate",
          reason: "CryptoActivity is routed to ProjectCandidate until a legacy Project is reviewed or linked.",
          linksCreated: 0,
          conflicts: [],
        };
        this.recordResult(bucketEntityType, sourceDoc, input, skippedResult, summary);
        await this.recordProjectCandidate(bucketEntityType, sourceDoc, input, skippedResult, dryRun, dryRunCache, summary);
        return;
      }

      const result = await this.resolverAdapter.resolveAndLink(input, {
        dryRun,
        dryRunCache,
        projectById: scanContext.projectById,
        projectResolverCache: scanContext.projectResolverCache,
        canonicalLookupCache: scanContext.canonicalLookupCache,
        linkLookupCache: scanContext.linkLookupCache,
        createdBy: "system",
      });
      this.recordResult(bucketEntityType, sourceDoc, input, result, summary);
      if (this.shouldCreateProjectCandidate(input, result)) {
        await this.recordProjectCandidate(bucketEntityType, sourceDoc, input, result, dryRun, dryRunCache, summary);
      }
    } catch (error) {
      this.logger.warn(`Canonical project ${bucketEntityType} dry-run failed for ${sourceDoc?._id}: ${error?.message || error}`);
      summary.unsafe += 1;
      this.pushExample(summary.examples.unsafe, this.example(bucketEntityType, sourceDoc, input, {
        status: "skipped",
        confidence: 0,
        matchedBy: "error",
        reason: error?.message || String(error),
        linksCreated: 0,
        conflicts: [],
        unsafe: true,
      }));
    }
  }

  private shouldCreateProjectCandidate(
    input: CanonicalProjectResolverAdapterInput,
    result: CanonicalProjectResolverAdapterOutput,
  ): boolean {
    if (!["fundingRound", "tokenUnlock"].includes(input.entityType)) return false;
    if (result.canonicalProjectId) return false;
    return result.status === "skipped" || result.unsafe || result.ambiguous;
  }

  private async recordProjectCandidate(
    bucketEntityType: CanonicalProjectBackfillEntityType,
    sourceDoc: any,
    input: CanonicalProjectResolverAdapterInput,
    result: CanonicalProjectResolverAdapterOutput,
    dryRun: boolean,
    dryRunCache: Map<string, any>,
    summary: BackfillSummary,
  ) {
    if (!this.projectCandidateService) {
      summary.warnings.push("ProjectCandidateService is not registered; orphan project evidence was not recorded.");
      return;
    }

    const candidateInput = this.projectCandidateInput(bucketEntityType, sourceDoc, input, result);
    const candidateResult = await this.projectCandidateService.proposeCandidate(candidateInput, {
      dryRun,
      dryRunCache,
    });
    const candidate = candidateResult.candidate || {};
    const evidenceType = candidate.evidenceType || candidateInput.evidenceType || "unknown";
    const status = candidate.status || candidateInput.status || "new";

    if (candidateResult.wouldCreate || candidateResult.created) {
      summary.wouldCreate.projectCandidates += 1;
      summary.projectCandidates.wouldCreate += 1;
      this.pushExample(summary.projectCandidates.examples.created, this.projectCandidateExample(candidate, candidateInput));
    } else if (candidateResult.wouldMergeEvidence || candidateResult.mergedEvidence) {
      summary.projectCandidates.wouldMergeEvidence += 1;
      this.pushExample(summary.projectCandidates.examples.mergedEvidence, this.projectCandidateExample(candidate, candidateInput));
    }

    summary.projectCandidates.byEvidenceType[evidenceType] = (summary.projectCandidates.byEvidenceType[evidenceType] || 0) + 1;
    summary.projectCandidates.byStatus[status] = (summary.projectCandidates.byStatus[status] || 0) + 1;

    if ((candidate.dataQuality?.warnings || candidateInput.dataQuality?.warnings || []).length) {
      this.pushExample(summary.projectCandidates.examples.unsafe, this.projectCandidateExample(candidate, candidateInput));
    }
    if (status === "conflict") {
      this.pushExample(summary.projectCandidates.examples.conflicts, this.projectCandidateExample(candidate, candidateInput));
    }
  }

  private projectCandidateInput(
    bucketEntityType: CanonicalProjectBackfillEntityType,
    sourceDoc: any,
    input: CanonicalProjectResolverAdapterInput,
    result: CanonicalProjectResolverAdapterOutput,
  ) {
    const evidenceType = this.projectCandidateEvidenceType(input.entityType);
    const unsafeWarnings = result.unsafe || result.matchedBy === "symbol" ? ["symbol-only unsafe"] : [];
    return {
      name: input.name,
      symbol: input.symbol,
      slug: input.slug || input.coinSlug || input.sourceSlug,
      source: this.projectCandidateSource(input.source, input.entityType),
      sourceId: input.sourceId || input.sourceKey || input.externalId,
      sourceSlug: input.sourceSlug || input.slug || input.coinSlug,
      sourceUrl: input.sourceUrl,
      evidenceType,
      evidenceEntityId: input.entityId,
      suggestedProjectType: input.entityType === "cryptoActivity" ? "unknown" : "project",
      status: result.ambiguous || result.status === "conflict" ? "conflict" : "new",
      confidence: result.unsafe || result.matchedBy === "symbol" ? 40 : Math.max(0, Math.min(80, Number(result.confidence || 0))),
      matchedBy: result.matchedBy || "none",
      reason:
        result.reason ||
        `No reliable legacy Project._id was available for ${bucketEntityType}; recorded as ProjectCandidate instead of CanonicalProject.`,
      evidenceRef: {
        raw: this.projectCandidateRawEvidence(bucketEntityType, sourceDoc),
      },
      rawEvidence: this.projectCandidateRawEvidence(bucketEntityType, sourceDoc),
      dataQuality: {
        hasFundingRounds: input.entityType === "fundingRound",
        hasUnlocks: input.entityType === "tokenUnlock",
        hasActivities: input.entityType === "cryptoActivity",
        hasProviderId: Object.values(input.providerIds || {}).some(Boolean),
        hasSourceUrl: Boolean(input.sourceUrl),
        warnings: unsafeWarnings,
      },
    };
  }

  private projectCandidateRawEvidence(bucketEntityType: CanonicalProjectBackfillEntityType, sourceDoc: any) {
    if (!sourceDoc) return undefined;
    if (bucketEntityType === "fundingRounds") {
      return {
        _id: sourceDoc._id,
        source: sourceDoc.source,
        sourceId: sourceDoc.sourceId,
        sourceKey: sourceDoc.sourceKey,
        projectName: sourceDoc.projectName,
        coinSlug: sourceDoc.coinSlug,
        coinSymbol: sourceDoc.coinSymbol,
        date: sourceDoc.date,
        stage: sourceDoc.stage,
      };
    }
    if (bucketEntityType === "tokenUnlocks") {
      return {
        _id: sourceDoc._id,
        source: sourceDoc.source,
        sourceId: sourceDoc.sourceId,
        sourceKey: sourceDoc.sourceKey,
        coinId: sourceDoc.coinId,
        projectName: sourceDoc.projectName,
        coinSlug: sourceDoc.coinSlug,
        coinSymbol: sourceDoc.coinSymbol,
      };
    }
    if (bucketEntityType === "cryptoActivities") {
      return {
        _id: sourceDoc._id,
        parserActivityId: sourceDoc.parserActivityId,
        source: sourceDoc.primarySource || sourceDoc.source,
        projectName: sourceDoc.projectName,
        coinName: sourceDoc.coinName,
        coinSlug: sourceDoc.coinSlug,
        coinSymbol: sourceDoc.coinSymbol,
        sourceUrl: sourceDoc.sourceUrl,
        originalUrl: sourceDoc.originalUrl,
      };
    }
    return { _id: sourceDoc._id };
  }

  private projectCandidateExample(candidate: any, input: any) {
    return {
      candidateId: candidate?._id ? String(candidate._id) : undefined,
      evidenceType: candidate?.evidenceType || input.evidenceType,
      evidenceEntityId: candidate?.evidenceEntityId ? String(candidate.evidenceEntityId) : String(input.evidenceEntityId || ""),
      status: candidate?.status || input.status,
      confidence: candidate?.confidence ?? input.confidence,
      matchedBy: candidate?.matchedBy || input.matchedBy,
      reason: candidate?.reason || input.reason,
      name: candidate?.name || input.name,
      slug: candidate?.slug || input.slug,
      symbol: candidate?.symbol || input.symbol,
      source: candidate?.source || input.source,
      sourceId: candidate?.sourceId || input.sourceId,
      warnings: candidate?.dataQuality?.warnings || input.dataQuality?.warnings || [],
    };
  }

  private projectCandidateEvidenceType(entityType: string): "fundingRound" | "tokenUnlock" | "cryptoActivity" | "unknown" {
    if (entityType === "fundingRound") return "fundingRound";
    if (entityType === "tokenUnlock") return "tokenUnlock";
    if (entityType === "cryptoActivity") return "cryptoActivity";
    return "unknown";
  }

  private projectCandidateSource(source: any, entityType: string): string {
    const normalized = this.cleanString(source).toLowerCase().replace(/[-\s]+/g, "_");
    if (normalized) return normalized;
    if (entityType === "cryptoActivity") return "crypto_activity";
    return "unknown";
  }

  private recordResult(
    bucketEntityType: CanonicalProjectBackfillEntityType,
    sourceDoc: any,
    input: CanonicalProjectResolverAdapterInput,
    result: CanonicalProjectResolverAdapterOutput,
    summary: BackfillSummary,
  ) {
    summary.wouldCreate.links += Number(result.linksCreated || 0);
    summary.wouldCreate.canonicalLinks += Number(result.linksCreated || 0);
    if (result.canonicalCreated) {
      summary.wouldCreate.canonicalProjects += 1;
      this.pushExample(summary.examples.created, this.example(bucketEntityType, sourceDoc, input, result));
    }

    if (result.status === "verified") {
      summary.wouldVerify += 1;
      this.pushExample(summary.examples.verified, this.example(bucketEntityType, sourceDoc, input, result));
    } else if (result.status === "proposed") {
      summary.wouldPropose += 1;
      this.pushExample(summary.examples.proposed, this.example(bucketEntityType, sourceDoc, input, result));
    } else if (result.status === "conflict") {
      summary.conflicts += 1;
      this.pushExample(summary.examples.conflicts, this.example(bucketEntityType, sourceDoc, input, result));
    }

    if (result.ambiguous) {
      summary.ambiguous += 1;
      this.pushExample(summary.examples.ambiguous, this.example(bucketEntityType, sourceDoc, input, result));
    }

    if (result.unsafe) {
      summary.unsafe += 1;
      this.pushExample(summary.examples.unsafe, this.example(bucketEntityType, sourceDoc, input, result));
    }

    const byType = summary.byEntityType[input.entityType] || {
      scanned: 0,
      verified: 0,
      proposed: 0,
      conflict: 0,
      skipped: 0,
      links: 0,
      canonicalLinks: 0,
      canonicalProjects: 0,
    };
    byType.scanned += 1;
    byType[result.status] += 1;
    byType.links += Number(result.linksCreated || 0);
    byType.canonicalLinks += Number(result.linksCreated || 0);
    if (result.canonicalCreated) byType.canonicalProjects += 1;
    summary.byEntityType[input.entityType] = byType;
  }

  private createSummary(startedAt: string, dryRun: boolean): BackfillSummary {
    return {
      mode: dryRun ? "dry-run" : "apply",
      startedAt,
      scanned: {
        projects: 0,
        fundingRounds: 0,
        tokenUnlocks: 0,
        projectChartHistory: 0,
        projectComparisonSnapshots: 0,
        cryptoActivities: 0,
        projectExchangeTickerCache: 0,
      },
      wouldCreate: {
        canonicalProjects: 0,
        canonicalLinks: 0,
        links: 0,
        projectCandidates: 0,
      },
      projectCandidates: {
        wouldCreate: 0,
        wouldMergeEvidence: 0,
        byEvidenceType: {},
        byStatus: {},
        examples: {
          created: [],
          mergedEvidence: [],
          unsafe: [],
          conflicts: [],
        },
      },
      wouldVerify: 0,
      wouldPropose: 0,
      conflicts: 0,
      ambiguous: 0,
      unsafe: 0,
      byEntityType: {},
      examples: {
        created: [],
        verified: [],
        proposed: [],
        conflicts: [],
        ambiguous: [],
        unsafe: [],
      },
      warnings: [],
      canonicalProjectShape: {
        wouldHaveBothPrimaryIds: 0,
        marketOnly: 0,
        projectOnly: 0,
        mergedCanonicalProjects: 0,
      },
    };
  }

  private resolveDryRunMode(options: CanonicalProjectBackfillOptions): boolean {
    if (options.apply || options.dryRun === false) {
      return !options.confirmApply;
    }
    return true;
  }

  private normalizeProgressEvery(value: any): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 10;
    return Math.max(1, Math.trunc(parsed));
  }

  private normalizeConcurrency(value: any): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return 1;
    return Math.min(25, Math.max(1, Math.trunc(parsed)));
  }

  private async listDocuments(
    model: Model<any>,
    scanLimit?: number,
    filter: Record<string, any> = {},
    projection?: Record<string, any>,
  ): Promise<any[]> {
    const query = model.find(filter).sort({ _id: 1 });
    if (projection) query.select(projection);
    query.lean();
    if (Number(scanLimit) > 0) query.limit(Math.trunc(Number(scanLimit)));
    return query;
  }

  private projectProjection(): Record<string, any> {
    return {
      _id: 1,
      projectType: 1,
      source: 1,
      sourceId: 1,
      sourceUrl: 1,
      detailUrl: 1,
      name: 1,
      normalizedName: 1,
      slug: 1,
      symbol: 1,
      ticker: 1,
      niche: 1,
      aliases: 1,
      contracts: 1,
      sourceMappings: 1,
      capId: 1,
      coingeckoId: 1,
      coinMarketCapId: 1,
      coinmarketcapId: 1,
      dropstabId: 1,
      cryptorankId: 1,
      icodropsId: 1,
      "rawIcoData.name": 1,
      "rawIcoData.slug": 1,
      "rawIcoData.symbol": 1,
      "rawIcoData.ticker": 1,
      "rawIcoData.sourceId": 1,
      "rawIcoData.coingeckoId": 1,
      "rawIcoData.coinGeckoId": 1,
      "rawIcoData.coinMarketCapId": 1,
      "rawIcoData.coinmarketcapId": 1,
      "rawIcoData.marketData.coingeckoId": 1,
      "rawIcoData.marketData.coinGeckoId": 1,
      "rawIcoData.marketData.coinMarketCapId": 1,
      "rawIcoData.marketData.coinmarketcapId": 1,
      "rawIcoData.dropstabId": 1,
      "rawIcoData.dropstabSlug": 1,
      "rawIcoData.cryptorankId": 1,
      "rawIcoData.icodropsId": 1,
      "tokenMetrics.coingeckoId": 1,
      "tokenMetrics.coinGeckoId": 1,
      "tokenMetrics.coinMarketCapId": 1,
      "tokenMetrics.coinmarketcapId": 1,
    };
  }

  private fundingRoundProjection(): Record<string, any> {
    return {
      _id: 1,
      id: 1,
      projectId: 1,
      projectLinks: 1,
      source: 1,
      sourceId: 1,
      sourceKey: 1,
      roundId: 1,
      projectName: 1,
      coinSlug: 1,
      coinSymbol: 1,
    };
  }

  private tokenUnlockProjection(): Record<string, any> {
    return {
      _id: 1,
      projectId: 1,
      projectLinks: 1,
      source: 1,
      sourceId: 1,
      sourceKey: 1,
      sourceUrl: 1,
      detailUrl: 1,
      coinId: 1,
      coinSlug: 1,
      coinSymbol: 1,
      projectName: 1,
    };
  }

  private projectChartHistoryProjection(): Record<string, any> {
    return {
      _id: 1,
      projectId: 1,
      source: 1,
      slug: 1,
    };
  }

  private projectComparisonSnapshotProjection(): Record<string, any> {
    return {
      _id: 1,
      projectId: 1,
      slug: 1,
    };
  }

  private cryptoActivityProjection(): Record<string, any> {
    return {
      _id: 1,
      primarySource: 1,
      source: 1,
      "syncMeta.sourceSystem": 1,
      parserActivityId: 1,
      id: 1,
      externalSlug: 1,
      slug: 1,
      coinSlug: 1,
      sourceUrl: 1,
      originalUrl: 1,
      projectName: 1,
      coinName: 1,
      name: 1,
      coinSymbol: 1,
      symbol: 1,
    };
  }

  private projectExchangeTickerCacheProjection(): Record<string, any> {
    return {
      _id: 1,
      projectId: 1,
      source: 1,
      exchangeIdentifier: 1,
      pair: 1,
      coingeckoId: 1,
      tradeUrl: 1,
      base: 1,
    };
  }

  private projectSourceMapProjection(): Record<string, any> {
    return {
      _id: 1,
      projectId: 1,
      source: 1,
      sourceId: 1,
      sourceSlug: 1,
      sourceUrl: 1,
      isVerified: 1,
      confidence: 1,
      updatedAt: 1,
    };
  }

  private projectScanFilter(projectType: any): Record<string, any> {
    if (projectType === "market") return { projectType: "market" };
    if (projectType === "project") return { projectType: "project" };
    return {};
  }

  private allEntityTypes(): CanonicalProjectBackfillEntityType[] {
    return [
      "projects",
      "fundingRounds",
      "tokenUnlocks",
      "projectChartHistory",
      "projectComparisonSnapshots",
      "cryptoActivities",
      "projectExchangeTickerCache",
    ];
  }

  private entityTypeForBucket(bucketEntityType: CanonicalProjectBackfillEntityType): CanonicalProjectResolverAdapterInput["entityType"] {
    const map: Record<CanonicalProjectBackfillEntityType, CanonicalProjectResolverAdapterInput["entityType"]> = {
      projects: "project",
      fundingRounds: "fundingRound",
      tokenUnlocks: "tokenUnlock",
      projectChartHistory: "projectChartHistory",
      projectComparisonSnapshots: "projectComparisonSnapshot",
      cryptoActivities: "cryptoActivity",
      projectExchangeTickerCache: "projectExchangeTickerCache",
    };
    return map[bucketEntityType];
  }

  private collectProviderValues(projects: any[]): Record<string, Set<string>> {
    const values: Record<string, Set<string>> = {
      coingeckoId: new Set<string>(),
      coinmarketcapId: new Set<string>(),
      coinMarketCapId: new Set<string>(),
      dropstabId: new Set<string>(),
      cryptorankId: new Set<string>(),
      icodropsId: new Set<string>(),
    };

    for (const project of projects) {
      for (const [field, value] of Object.entries(this.providerIdsFromDoc(project))) {
        const cleanValue = this.cleanString(value);
        if (!cleanValue || !values[field]) continue;
        values[field].add(cleanValue);
      }
    }

    return values;
  }

  private addPairingIndex(index: Map<string, any[]>, key: string, project: any) {
    if (!key) return;
    if (!index.has(key)) index.set(key, []);
    index.get(key).push(project);
  }

  private candidatesForKeys(index: Map<string, any[]>, keys: string[]): any[] {
    return this.uniqueProjects(keys.flatMap((key) => (key ? index.get(key) || [] : [])));
  }

  private uniqueProjects(projects: any[]): any[] {
    const seen = new Set<string>();
    const result: any[] = [];
    for (const project of projects || []) {
      if (!project?._id) continue;
      const key = String(project._id);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(project);
    }
    return result;
  }

  private providerPairingKeys(project: any): string[] {
    return Object.entries(this.providerIdsFromDoc(project || {}))
      .map(([field, value]) => this.providerCacheKey(field, value))
      .filter(Boolean);
  }

  private sourcePairingKeys(project: any): string[] {
    const keys: string[] = [];
    const add = (source: any, sourceId: any) => {
      const key = this.sourceCacheKey(source, sourceId);
      if (key) keys.push(key);
    };

    add(project?.source, project?.sourceId || project?.rawIcoData?.sourceId);
    for (const mapping of project?.sourceMappings || []) {
      add(mapping?.source, mapping?.sourceId);
      add(mapping?.source, mapping?.sourceSlug);
    }

    return Array.from(new Set(keys));
  }

  private slugSymbolPairingKey(project: any): string {
    const slug = this.normalizedSlug(project?.slug || project?.rawIcoData?.slug || project?.sourceId);
    const symbol = this.normalizedSymbol(project?.symbol || project?.ticker || project?.rawIcoData?.symbol);
    return slug && symbol ? `${slug}:${symbol}` : "";
  }

  private nameSymbolPairingKey(project: any): string {
    const name = this.normalizedName(project?.name || project?.rawIcoData?.name);
    const symbol = this.normalizedSymbol(project?.symbol || project?.ticker || project?.rawIcoData?.symbol);
    return name && symbol ? `${name}:${symbol}` : "";
  }

  private normalizedSlug(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/^https?:\/\/[^/]+\/?/i, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  private normalizedName(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private normalizedSymbol(value: any): string {
    return String(value || "")
      .trim()
      .replace(/^\$/, "")
      .toUpperCase();
  }

  private collectSourceValues(projects: any[]): Record<string, Set<string>> {
    const values: Record<string, Set<string>> = {};
    const add = (source: any, sourceId: any) => {
      const normalizedSource = this.cleanString(source).toLowerCase();
      const normalizedSourceId = this.cleanString(sourceId);
      if (!normalizedSource || !normalizedSourceId) return;
      if (!values[normalizedSource]) values[normalizedSource] = new Set<string>();
      values[normalizedSource].add(normalizedSourceId);
    };

    for (const project of projects) {
      add(project?.source, project?.sourceId || project?.rawIcoData?.sourceId);
      for (const mapping of project?.sourceMappings || []) {
        add(mapping?.source, mapping?.sourceId);
      }
    }

    return values;
  }

  private providerIdsFromDoc(doc: any) {
    return {
      coingeckoId:
        doc.coingeckoId ||
        doc.rawIcoData?.coingeckoId ||
        doc.rawIcoData?.coinGeckoId ||
        doc.rawIcoData?.marketData?.coingeckoId ||
        doc.rawIcoData?.marketData?.coinGeckoId ||
        doc.tokenMetrics?.coingeckoId ||
        doc.tokenMetrics?.coinGeckoId,
      coinMarketCapId:
        doc.coinMarketCapId ||
        doc.coinmarketcapId ||
        doc.rawIcoData?.coinMarketCapId ||
        doc.rawIcoData?.coinmarketcapId ||
        doc.rawIcoData?.marketData?.coinMarketCapId ||
        doc.rawIcoData?.marketData?.coinmarketcapId ||
        doc.tokenMetrics?.coinMarketCapId ||
        doc.tokenMetrics?.coinmarketcapId,
      dropstabId: doc.dropstabId || doc.rawIcoData?.dropstabId || doc.rawIcoData?.dropstabSlug || doc.capId,
      cryptorankId: doc.cryptorankId || doc.rawIcoData?.cryptorankId,
      icodropsId: doc.icodropsId || doc.rawIcoData?.icodropsId || (doc.source === "icodrops" ? doc.sourceId : undefined),
    };
  }

  private normalizeProviderIds(providerIds: Record<string, any> = {}): Record<string, string> {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(providerIds || {})) {
      const cleanValue = this.cleanString(value);
      if (!cleanValue) continue;
      normalized[key] = cleanValue;
    }
    if (normalized.coinMarketCapId && !normalized.coinmarketcapId) normalized.coinmarketcapId = normalized.coinMarketCapId;
    if (normalized.coinmarketcapId && !normalized.coinMarketCapId) normalized.coinMarketCapId = normalized.coinmarketcapId;
    return normalized;
  }

  private hasStrongProjectSignal(project: any = {}, providerIds: Record<string, any> = {}): boolean {
    if (Object.values(providerIds || {}).some(Boolean)) return true;
    if (this.cleanString(project.source) && this.cleanString(project.sourceId)) return true;
    return Array.isArray(project.sourceMappings) && project.sourceMappings.some((mapping) => mapping?.source && mapping?.sourceId);
  }

  private normalizeAliasValue(type: string, value: any): string {
    if (type === "name") return this.normalizedName(value);
    if (type === "symbol") return this.normalizedSymbol(value);
    if (type === "slug") return this.normalizedSlug(value);
    if (type === "contract") return this.cleanString(value).toLowerCase();
    return this.cleanString(value).toLowerCase();
  }

  private uniqueObjects<T>(values: T[], keyFactory: (value: T) => string): T[] {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const value of values || []) {
      const key = keyFactory(value);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      result.push(value);
    }
    return result;
  }

  private uniqueObjectIds(values: any[]): Types.ObjectId[] {
    const seen = new Set<string>();
    const result: Types.ObjectId[] = [];
    for (const value of values || []) {
      const objectId = this.toObjectId(value);
      if (!objectId) continue;
      const key = objectId.toString();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(objectId);
    }
    return result;
  }

  private toObjectId(value: any): Types.ObjectId | null {
    if (!value) return null;
    if (value instanceof Types.ObjectId) return value;
    if (Types.ObjectId.isValid(String(value))) return new Types.ObjectId(String(value));
    return null;
  }

  private providerCacheKey(field: any, value: any): string {
    const normalizedField = this.cleanString(field);
    const normalizedValue = this.cleanString(value).toLowerCase();
    if (!normalizedField || !normalizedValue) return "";
    return `${normalizedField}:${normalizedValue}`;
  }

  private sourceCacheKey(source: any, sourceId: any): string {
    const normalizedSource = this.cleanString(source).toLowerCase();
    const normalizedSourceId = this.cleanString(sourceId);
    if (!normalizedSource || !normalizedSourceId) return "";
    return `${normalizedSource}:${normalizedSourceId}`;
  }

  private addCleanString(target: Set<string>, value: any) {
    const cleanValue = this.cleanString(value);
    if (cleanValue) target.add(cleanValue);
  }

  private uniqueStrings(values: any[]): string[] {
    return Array.from(new Set((values || []).map((value) => this.cleanString(value)).filter(Boolean)));
  }

  private normalizedUrl(value: any): string {
    return this.cleanString(value)
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/[?#].*$/, "")
      .replace(/\/+$/, "");
  }

  private valuesFromArray(value: any, field: string): any[] {
    return Array.isArray(value) ? value.map((item) => item?.[field]).filter(Boolean) : [];
  }

  private cleanString(value: any): string {
    return String(value ?? "").trim();
  }

  private projectType(value: any): "market" | "project" | "ico" | "raw" {
    const normalized = String(value || "").trim().toLowerCase();
    if (normalized === "market") return "market";
    if (normalized === "ico") return "ico";
    if (normalized === "project") return "project";
    return "raw";
  }

  private example(
    bucketEntityType: CanonicalProjectBackfillEntityType,
    sourceDoc: any,
    input: CanonicalProjectResolverAdapterInput,
    result: CanonicalProjectResolverAdapterOutput,
  ) {
    return {
      bucketEntityType,
      entityType: input.entityType,
      entityId: String(input.entityId || sourceDoc?._id || ""),
      canonicalProjectId: result.canonicalProjectId ? String(result.canonicalProjectId) : undefined,
      status: result.status,
      confidence: result.confidence,
      matchedBy: result.matchedBy,
      reason: result.reason,
      source: input.source,
      sourceId: input.sourceId,
      slug: input.slug || input.sourceSlug,
      symbol: input.symbol,
      conflicts: result.conflicts?.length || 0,
    };
  }

  private pushExample(target: any[], value: any) {
    if (target.length < 5) target.push(value);
  }

  private logEntityProgress(
    bucketEntityType: CanonicalProjectBackfillEntityType,
    processed: number,
    total: number,
    startedAtMs: number,
    summary: BackfillSummary,
    progressEvery: number,
  ) {
    if (processed !== 1 && processed !== total && processed % progressEvery !== 0) return;

    const elapsedMs = Math.max(Date.now() - startedAtMs, 1);
    const perSecond = processed / (elapsedMs / 1000);
    const remaining = total > processed ? Math.ceil((total - processed) / Math.max(perSecond, 0.001)) : 0;

    this.logProgress(
      `${bucketEntityType}: processed=${processed}/${total} rate=${perSecond.toFixed(2)}/s eta=${remaining}s verified=${summary.wouldVerify} proposed=${summary.wouldPropose} conflicts=${summary.conflicts} unsafe=${summary.unsafe} projectCandidates=${summary.wouldCreate.projectCandidates}`,
    );
  }

  private formatDuration(ms: number): string {
    const seconds = Math.round(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const rest = seconds % 60;
    return `${minutes}m${rest}s`;
  }

  private logProgress(message: string) {
    console.error(`[canonical-projects] ${new Date().toISOString()} ${message}`);
  }
}
