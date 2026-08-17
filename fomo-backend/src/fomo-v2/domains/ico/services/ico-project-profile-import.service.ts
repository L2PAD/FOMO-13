import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  normalizeProjectSourceType,
  projectSourceTypeMongoPattern,
} from "../../../shared/source-policy";
import { ExternalAssetMirrorUrlService } from "src/storage/external-asset-mirror-url.service";
import {
  FomoV2CanonicalProject,
  FomoV2MarketAsset,
  FomoV2ProjectAssetLink,
} from "../../../models";
import { FomoV2ReviewService } from "../../review/services/review.service";
import { FomoV2ParserControlPolicyService } from "../../parser-control/services/parser-control-policy.service";
import {
  FomoV2ParserSnapshotReaderService,
  FomoV2ValidatedParserSnapshot,
} from "../../parser-control/services/parser-snapshot-reader.service";
import { FomoV2ProjectSourceProfile } from "../../project-profiles";
import { FOMO_V2_PARSER_DB_CONNECTION } from "../ico-parser-db.constants";
import {
  cleanProjectProfileString,
  normalizeProjectIdentityValue,
  normalizeProjectSlugForQuery,
  uniqueProjectProfileStrings,
} from "../helpers";
import { FomoV2IcoProjectReadModel, FomoV2IcoProjectSource } from "../models";
import {
  IcoProjectIdentity,
  IcoProjectDiagnosticExample,
  IcoProjectProfileImportOptions,
  IcoProjectProfileImportResult,
  IcoProjectProfilePayload,
  IcoProjectReadModelPayload,
  IcoProjectResolveCandidate,
  IcoProjectResolveResult,
} from "../types";
import { IcoProjectResolverService } from "./ico-project-resolver.service";

type UpsertCounter = { created: number; updated: number };
const ICODROPS_UPSTREAM_PARSER_KEY = "icodrops:projects";

@Injectable()
export class IcoProjectProfileImportService {
  private readonly defaultLimit = 100;
  private readonly defaultBatchSize = 250;
  private readonly defaultExamplesLimit = 5;
  private readonly debugExampleLimits = {
    linkedExisting: 10,
    potentialProjectMatch: 10,
    newProjectCandidate: 20,
  };

  constructor(
    private readonly resolver: IcoProjectResolverService,
    private readonly reviewService: FomoV2ReviewService,
    private readonly configService: ConfigService,
    @InjectModel(FomoV2IcoProjectSource.name, FOMO_V2_PARSER_DB_CONNECTION)
    private readonly icoProjectSourceModel: Model<FomoV2IcoProjectSource>,
    @InjectModel(FomoV2ProjectSourceProfile.name)
    private readonly projectSourceProfileModel: Model<FomoV2ProjectSourceProfile>,
    @InjectModel(FomoV2IcoProjectReadModel.name)
    private readonly icoProjectReadModel: Model<FomoV2IcoProjectReadModel>,
    @InjectModel(FomoV2ProjectAssetLink.name)
    private readonly projectAssetLinkModel: Model<FomoV2ProjectAssetLink>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>,
    @InjectModel(FomoV2MarketAsset.name)
    private readonly marketAssetModel: Model<FomoV2MarketAsset>,
    @Optional()
    private readonly mirrorUrlService?: ExternalAssetMirrorUrlService,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService,
    @Optional()
    private readonly snapshotReader?: FomoV2ParserSnapshotReaderService
  ) {}

  async run(
    options: IcoProjectProfileImportOptions = {}
  ): Promise<IcoProjectProfileImportResult> {
    const sourceType = normalizeProjectSourceType(options.sourceType || "icodrops");
    const write = Boolean(options.write);
    if (write && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        `ico:${sourceType}`
      );
    }
    await options.assertExecutionActive?.();
    const allowCreateCanonicalProjects = Boolean(
      options.allowCreateCanonicalProjects
    );
    const debug = Boolean(options.debug);
    const result = this.emptyResult(
      sourceType,
      write,
      allowCreateCanonicalProjects,
      debug
    );
    const limit = this.resolveLimit(options);
    const examplesLimit = this.parseNonNegativeInteger(
      options.examplesLimit,
      this.defaultExamplesLimit
    );

    const snapshot = await this.openSnapshot(options, sourceType, write);
    const cursor = snapshot
      ? this.snapshotReader!.cursor(snapshot, {
          limit: options.all ? undefined : limit,
        })
      : this.icoProjectSourceModel
          .find(
            this.sourceQuery(
              sourceType,
              Boolean(options.includeLegacyMissingSource)
            )
          )
          .sort({ _id: 1 })
          .limit(options.all ? 0 : limit)
          .batchSize(
            this.parsePositiveInteger(options.batchSize, this.defaultBatchSize)
          )
          .lean()
          .cursor();

    for await (const sourceDocument of cursor as any) {
      if (!options.all && result.totalProjects >= limit) break;
      await options.assertExecutionActive?.();
      const icoProject = snapshot
        ? this.snapshotReader!.payload(snapshot, sourceDocument)
        : sourceDocument;
      await this.processProject(
        icoProject,
        {
          sourceType,
          write,
          debug,
          allowCreateCanonicalProjects,
          examplesLimit,
        },
        result
      );
      await options.assertExecutionActive?.();
    }

    return result;
  }

  private async openSnapshot(
    options: IcoProjectProfileImportOptions,
    sourceType: string,
    write: boolean
  ): Promise<FomoV2ValidatedParserSnapshot | undefined> {
    const snapshotId = cleanProjectProfileString(options.snapshotId);
    if (!snapshotId) return undefined;
    if (!this.snapshotReader) {
      throw new Error("Parser snapshot reader is not available.");
    }
    if (sourceType !== "icodrops") {
      throw new Error(
        'ICO project snapshots currently support only sourceType="icodrops".'
      );
    }
    const parserKey =
      cleanProjectProfileString(options.upstreamParserKey) ||
      ICODROPS_UPSTREAM_PARSER_KEY;
    if (parserKey !== ICODROPS_UPSTREAM_PARSER_KEY) {
      throw new Error(
        `ICO project snapshot import requires parser ${ICODROPS_UPSTREAM_PARSER_KEY}.`
      );
    }
    return this.snapshotReader.validate({
      snapshotId,
      parserKey,
      sourceType,
      write,
      upstreamRunId: cleanProjectProfileString(options.upstreamRunId),
    });
  }

  private async processProject(
    icoProject: Record<string, any>,
    options: {
      sourceType: string;
      write: boolean;
      debug: boolean;
      allowCreateCanonicalProjects: boolean;
      examplesLimit: number;
    },
    result: IcoProjectProfileImportResult
  ): Promise<void> {
    const identity = this.resolver.toIdentity(icoProject, options.sourceType);
    result.totalProjects += 1;

    try {
      const resolveResult = await this.resolver.resolve(icoProject, {
        sourceType: options.sourceType,
        allowCreateCanonicalProjects: options.allowCreateCanonicalProjects,
      });

      if (resolveResult.action === "LINK_EXISTING") {
        result.linkedExisting += 1;
        this.pushExample(
          result.examples.linkedExisting,
          resolveResult,
          options.examplesLimit
        );
        await this.pushDiagnosticExample(
          result.debugExamples?.linkedExisting,
          identity,
          resolveResult,
          this.debugExampleLimits.linkedExisting
        );
        if (options.write) {
          await this.writeLinkedProject(
            icoProject,
            identity,
            resolveResult,
            result
          );
        }
        return;
      }

      if (resolveResult.action === "CREATE_NEW") {
        result.wouldCreateCanonicalProject += 1;
        this.pushExample(
          result.examples.createNew,
          resolveResult,
          options.examplesLimit
        );
        await this.pushDiagnosticExample(
          result.debugExamples?.newProjectCandidate,
          identity,
          {
            ...resolveResult,
            reviewReason: "NEW_PROJECT_CANDIDATE",
          },
          this.debugExampleLimits.newProjectCandidate
        );
        if (options.write && options.allowCreateCanonicalProjects) {
          await this.writeCreatedCanonicalProject(
            icoProject,
            identity,
            resolveResult,
            result
          );
        }
        return;
      }

      if (resolveResult.reviewReason === "NEW_PROJECT_CANDIDATE") {
        result.reviewNewProject += 1;
        result.wouldCreateCanonicalProject += 1;
        this.pushExample(
          result.examples.reviewNewProject,
          resolveResult,
          options.examplesLimit
        );
        await this.pushDiagnosticExample(
          result.debugExamples?.newProjectCandidate,
          identity,
          resolveResult,
          this.debugExampleLimits.newProjectCandidate
        );
      } else {
        result.reviewPotentialMatch += 1;
        this.pushExample(
          result.examples.reviewPotentialMatch,
          resolveResult,
          options.examplesLimit
        );
        await this.pushDiagnosticExample(
          result.debugExamples?.potentialProjectMatch,
          identity,
          resolveResult,
          this.debugExampleLimits.potentialProjectMatch
        );
      }

      if (
        options.write &&
        resolveResult.reviewReason !== "NEW_PROJECT_CANDIDATE"
      ) {
        await this.writeReview(identity, icoProject, resolveResult, result);
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

  private async writeLinkedProject(
    icoProject: Record<string, any>,
    identity: IcoProjectIdentity,
    resolveResult: IcoProjectResolveResult,
    result: IcoProjectProfileImportResult
  ): Promise<void> {
    const canonicalProjectId = this.requireObjectId(
      resolveResult.canonicalProjectId
    );
    const marketAssetId = await this.resolveMarketAssetId(
      canonicalProjectId,
      resolveResult.marketAssetId
    );
    const profilePayload = this.buildProfilePayload(
      icoProject,
      identity,
      canonicalProjectId,
      resolveResult,
      marketAssetId
    );
    const profileUpsert = await this.upsertProfile(profilePayload);
    this.recordUpsert(
      result.written.projectSourceProfiles,
      profileUpsert.created
    );

    const readModelPayload = this.buildReadModelPayload(
      profilePayload,
      marketAssetId
    );
    const readModelUpsert = await this.upsertReadModel(readModelPayload);
    this.recordUpsert(
      result.written.icoProjectReadModels,
      readModelUpsert.created
    );
  }

  private async writeCreatedCanonicalProject(
    icoProject: Record<string, any>,
    identity: IcoProjectIdentity,
    resolveResult: IcoProjectResolveResult,
    result: IcoProjectProfileImportResult
  ): Promise<void> {
    if (!this.canCreateCanonicalProject(identity, resolveResult)) {
      result.errors.push({
        sourceProjectId: identity.sourceProjectId,
        sourceSlug: identity.sourceSlug,
        name: identity.name,
        message:
          "Skipped canonical project creation: CREATE_NEW must have zero candidates, score 0, normalizedName, sourceSlug, and sourceType=icodrops.",
      });
      return;
    }

    const canonicalProjectId = await this.upsertIcoOnlyCanonicalProject(
      icoProject,
      identity,
      result
    );

    await this.writeLinkedProject(
      icoProject,
      identity,
      {
        ...resolveResult,
        canonicalProjectId: this.toIdString(canonicalProjectId),
        hasMarketData: false,
      },
      result
    );
  }

  private async upsertIcoOnlyCanonicalProject(
    icoProject: Record<string, any>,
    identity: IcoProjectIdentity,
    result: IcoProjectProfileImportResult
  ): Promise<Types.ObjectId> {
    const payload = this.buildIcoOnlyCanonicalProjectPayload(
      icoProject,
      identity
    );
    const raw = await (this.canonicalProjectModel as any).findOneAndUpdate(
      this.icoOnlyCanonicalProjectFilter(payload, identity),
      { $setOnInsert: payload },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        rawResult: true,
      }
    );

    const canonicalProjectId = this.toObjectId(raw?.value?._id);
    if (!canonicalProjectId) {
      throw new Error("Failed to create or load ICO-only canonical project.");
    }

    this.recordUpsert(
      result.written.canonicalProjects,
      Boolean(raw?.lastErrorObject?.upserted)
    );
    return canonicalProjectId;
  }

  private buildIcoOnlyCanonicalProjectPayload(
    icoProject: Record<string, any>,
    identity: IcoProjectIdentity
  ): Record<string, any> {
    const slug = identity.querySlug || identity.sourceSlug;
    const sourceDocumentId = this.toIdString(icoProject._id);
    const icodropsId =
      identity.providerIds?.icodropsId ||
      identity.sourceProjectId ||
      identity.sourceSlug;

    return this.cleanObject({
      name: identity.name || identity.sourceSlug,
      normalizedName: identity.normalizedName,
      slug,
      symbol: identity.symbol,
      normalizedSymbol: identity.normalizedSymbol,
      status: "proposed",
      providerIds: this.cleanObject({
        ...identity.providerIds,
        icodropsId,
      }),
      aliases: this.buildIcoOnlyCanonicalAliases(identity, slug),
      createdBy: "import",
      hasMarketData: false,
      originSourceType: "icodrops",
      identitySource: "icodrops",
      identityConfidence: "source_only",
      sourceEvidence: {
        sourceType: identity.sourceType,
        sourceProjectId: identity.sourceProjectId,
        sourceSlug: identity.sourceSlug,
        sourceUrl: identity.sourceUrl,
        sourceDocumentId,
        normalizedName: identity.normalizedName,
        normalizedSymbol: identity.normalizedSymbol,
        normalizedSlug: identity.normalizedSlug,
      },
      metadata: {
        importer: "fomo-v2:ico-project-profile-import",
        sourceCollection: "ico_projects",
        sourceDocumentId,
        marketLayerPriority: true,
        autoCreatedCanonicalProject: true,
        hasMarketData: false,
        originSourceType: "icodrops",
        identitySource: "icodrops",
        identityConfidence: "source_only",
      },
    });
  }

  private buildIcoOnlyCanonicalAliases(
    identity: IcoProjectIdentity,
    slug?: string
  ): Array<Record<string, any>> {
    const aliases: Array<Record<string, any>> = [];
    const seen = new Set<string>();
    const pushAlias = (
      type: string,
      value?: string,
      normalizedValue?: string
    ) => {
      const cleanValue = cleanProjectProfileString(value);
      const normalized = normalizeProjectIdentityValue(
        normalizedValue || cleanValue
      );
      if (!cleanValue || !normalized) return;
      const key = `${type}:${normalized}`;
      if (seen.has(key)) return;
      seen.add(key);
      aliases.push({
        type,
        value: cleanValue,
        normalizedValue: normalized,
        source: "icodrops",
        confidence: "low",
      });
    };

    pushAlias("name", identity.name, identity.normalizedName);
    pushAlias("symbol", identity.symbol, identity.normalizedSymbol);
    pushAlias("slug", slug, normalizeProjectIdentityValue(slug));
    pushAlias("slug", identity.sourceSlug, identity.normalizedSlug);

    return aliases;
  }

  private icoOnlyCanonicalProjectFilter(
    payload: Record<string, any>,
    identity: IcoProjectIdentity
  ): Record<string, any> {
    const icodropsId = payload.providerIds?.icodropsId;
    if (icodropsId) return { "providerIds.icodropsId": icodropsId };
    return {
      originSourceType: identity.sourceType,
      slug: payload.slug,
      normalizedName: payload.normalizedName,
    };
  }

  private canCreateCanonicalProject(
    identity: IcoProjectIdentity,
    resolveResult: IcoProjectResolveResult
  ): boolean {
    return (
      resolveResult.action === "CREATE_NEW" &&
      (resolveResult.candidates || []).length === 0 &&
      Number(resolveResult.confidence || 0) === 0 &&
      Boolean(identity.normalizedName) &&
      Boolean(identity.sourceSlug) &&
      identity.sourceType === "icodrops"
    );
  }

  private async writeReview(
    identity: IcoProjectIdentity,
    icoProject: Record<string, any>,
    resolveResult: IcoProjectResolveResult,
    result: IcoProjectProfileImportResult
  ): Promise<void> {
    const review = await this.reviewService.createOrUpdateBatch({
      domain: "ico",
      reason: resolveResult.reviewReason || "POTENTIAL_PROJECT_MATCH",
      projectKey: identity.sourceProjectId || identity.sourceSlug,
      projectName: identity.name,
      normalizedProjectName: identity.normalizedName,
      incomingSourceType: identity.sourceType,
      affectedEntityTypes: ["ico_project", "canonical_project", "market_asset"],
      candidateCount: resolveResult.candidates?.length || 1,
      candidates: this.reviewCandidates(identity, icoProject, resolveResult),
      fingerprint: this.reviewFingerprint(identity, resolveResult.reviewReason),
      metadata: {
        resolverAction: resolveResult.action,
        resolverReason: resolveResult.reason,
        resolverMatchedBy: resolveResult.matchedBy,
        sourceType: identity.sourceType,
        normalizedSymbol: identity.normalizedSymbol,
        normalizedSlug: identity.normalizedSlug,
        marketLayerPriority: true,
      },
    });
    this.recordUpsert(result.written.reviewBatches, review.created);
  }

  private buildProfilePayload(
    icoProject: Record<string, any>,
    identity: IcoProjectIdentity,
    canonicalProjectId: Types.ObjectId,
    resolveResult: IcoProjectResolveResult,
    marketAssetId?: Types.ObjectId
  ): IcoProjectProfilePayload {
    const raw = icoProject.rawIcoData || {};
    const socials = this.socialsFromProject(icoProject);
    const categories = uniqueProjectProfileStrings([
      ...(this.arrayValue(icoProject.categories) || []),
      ...(this.arrayValue(raw.categories) || []),
      ...(this.arrayValue(icoProject.tags) || []),
      ...(this.arrayValue(raw.tags) || []),
      icoProject.mainCategory?.name,
      raw.mainCategory?.name,
    ]);
    const profileOnlyMetadata = this.icodropsProfileOnlyMetadata(icoProject);

    return this.cleanObject({
      canonicalProjectId,
      sourceType: identity.sourceType,
      sourceProjectId: identity.sourceProjectId,
      sourceSlug: identity.sourceSlug,
      sourceUrl: identity.sourceUrl,
      name: identity.name,
      symbol: identity.symbol,
      slug: identity.querySlug || identity.sourceSlug,
      description: this.descriptionFromProject(icoProject),
      website: this.websiteFromProject(icoProject),
      socials,
      logoUrl: cleanProjectProfileString(
        icoProject.logo ||
          icoProject.logoUrl ||
          raw.logo ||
          raw.logoUrl ||
          icoProject.image
      ),
      categories,
      status: cleanProjectProfileString(
        icoProject.status || icoProject.projectStatus || raw.status
      ),
      launchDate: this.dateValue(
        icoProject.launchDate ||
          raw.launchDate ||
          icoProject.dates?.launchDate ||
          icoProject.dates?.launch ||
          raw.dates?.launchDate ||
          raw.dates?.launch
      ),
      sourceEntityId: this.toObjectId(icoProject.sourceEntityId),
      sourceSnapshotId: this.toObjectId(icoProject.sourceSnapshotId),
      metadata: {
        importer: "fomo-v2:ico-project-profile-import",
        sourceCollection: "ico_projects",
        sourceDocumentId: this.toIdString(icoProject._id),
        resolverAction: resolveResult.action,
        resolverReason: resolveResult.reason,
        resolverMatchedBy: resolveResult.matchedBy,
        resolverConfidence: resolveResult.confidence,
        resolverCandidates: (resolveResult.candidates || []).map(
          (candidate) => ({
            canonicalProjectId: candidate.canonicalProjectId,
            marketAssetId: candidate.marketAssetId,
            source: candidate.source,
            confidence: candidate.confidence,
            matchedBy: candidate.matchedBy,
          })
        ),
        marketAssetId: this.toIdString(marketAssetId),
        marketLayerPriority: true,
        domainDataSkipped: true,
        icodropsProfileOnly: profileOnlyMetadata,
      },
    });
  }

  private buildReadModelPayload(
    profile: IcoProjectProfilePayload,
    marketAssetId?: Types.ObjectId
  ): IcoProjectReadModelPayload {
    return this.cleanObject({
      canonicalProjectId: profile.canonicalProjectId,
      sourceType: profile.sourceType,
      name: profile.name,
      symbol: profile.symbol,
      slug: profile.slug || profile.sourceSlug,
      logoUrl: profile.logoUrl,
      description: profile.description,
      website: profile.website,
      categories: profile.categories || [],
      status: profile.status,
      launchDate: profile.launchDate,
      hasMarketData: Boolean(marketAssetId),
      marketAssetId,
      profileCompleteness: this.profileCompleteness(profile),
      metadata: {
        domainDataSkipped: true,
        icodropsProfileOnly: profile.metadata?.icodropsProfileOnly,
      },
    });
  }

  private async upsertProfile(
    payload: IcoProjectProfilePayload
  ): Promise<{ created: boolean }> {
    await this.assertSourceProfileIdentityAvailable(payload);
    const raw = await (this.projectSourceProfileModel as any).findOneAndUpdate(
      this.profileUpsertFilter(payload),
      {
        $set: this.cleanObject(payload),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        rawResult: true,
      }
    );

    return { created: Boolean(raw?.lastErrorObject?.upserted) };
  }

  private async upsertReadModel(
    payload: IcoProjectReadModelPayload
  ): Promise<{ created: boolean }> {
    const filter = this.readModelUpsertFilter(payload);
    const safePayload = await this.withMirroredReadModelLogo(payload, filter);
    const update: Record<string, any> = {
      $set: this.cleanObject(safePayload),
    };

    if (!safePayload.marketAssetId) {
      update.$unset = { marketAssetId: "" };
    }

    const raw = await (this.icoProjectReadModel as any).findOneAndUpdate(
      filter,
      update,
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        rawResult: true,
      }
    );

    return { created: Boolean(raw?.lastErrorObject?.upserted) };
  }

  private async withMirroredReadModelLogo(
    payload: IcoProjectReadModelPayload,
    filter: Record<string, any>
  ): Promise<IcoProjectReadModelPayload> {
    if (!this.mirrorUrlService) return payload;

    const current = await this.icoProjectReadModel
      .findOne(filter, { logoUrl: 1 })
      .lean();
    const logoUrl = await this.mirrorUrlService.preferMirroredUrl(
      payload.logoUrl,
      (current as any)?.logoUrl
    );

    if (!logoUrl || logoUrl === payload.logoUrl) return payload;
    return { ...payload, logoUrl };
  }

  private profileUpsertFilter(
    payload: IcoProjectProfilePayload
  ): Record<string, any> {
    return {
      canonicalProjectId: payload.canonicalProjectId,
      sourceType: projectSourceTypeMongoPattern(payload.sourceType),
    };
  }

  private readModelUpsertFilter(
    payload: IcoProjectReadModelPayload
  ): Record<string, any> {
    return {
      canonicalProjectId: payload.canonicalProjectId,
      sourceType: projectSourceTypeMongoPattern(payload.sourceType),
    };
  }

  /**
   * A provider identity may only belong to one canonical project. This check
   * prevents an ID/slug upsert from silently moving an ICODrops profile onto a
   * different project while still allowing another provider to use the same
   * external value.
   */
  private async assertSourceProfileIdentityAvailable(
    payload: IcoProjectProfilePayload
  ): Promise<void> {
    const identityClauses: Record<string, any>[] = [];
    if (payload.sourceProjectId) {
      identityClauses.push({ sourceProjectId: payload.sourceProjectId });
    }
    if (payload.sourceSlug) {
      identityClauses.push({ sourceSlug: payload.sourceSlug });
    }
    if (!identityClauses.length) return;

    const conflict = await this.projectSourceProfileModel
      .findOne(
        {
          sourceType: projectSourceTypeMongoPattern(payload.sourceType),
          canonicalProjectId: { $ne: payload.canonicalProjectId },
          $or: identityClauses,
        },
        { _id: 1, canonicalProjectId: 1 }
      )
      .lean();
    if (!conflict) return;
    throw new Error(
      `Source identity conflict: ${payload.sourceType} project ID/slug is already linked to canonical project ${this.toIdString(
        (conflict as any).canonicalProjectId
      )}.`
    );
  }

  private async resolveMarketAssetId(
    canonicalProjectId: Types.ObjectId,
    explicitMarketAssetId?: string
  ): Promise<Types.ObjectId | undefined> {
    const explicit = this.toObjectId(explicitMarketAssetId);
    if (explicit) return explicit;

    const link = await this.projectAssetLinkModel
      .findOne({
        canonicalProjectId,
        status: { $ne: "deprecated" },
      })
      .sort({ verified: -1, status: 1, updatedAt: -1 })
      .lean();

    return this.toObjectId((link as any)?.marketAssetId);
  }

  private reviewCandidates(
    identity: IcoProjectIdentity,
    icoProject: Record<string, any>,
    resolveResult: IcoProjectResolveResult
  ) {
    const candidates = resolveResult.candidates || [];
    if (!candidates.length) {
      return [
        {
          entityType: "ico_project",
          sourceType: identity.sourceType,
          sourceId: identity.sourceProjectId,
          sourceUrl: identity.sourceUrl,
          payload: this.sourceProjectReviewPayload(icoProject, identity),
          normalizedPayload: this.normalizedPayload(identity),
          confidence: 0,
          metadata: {
            reviewReason: resolveResult.reviewReason || "NEW_PROJECT_CANDIDATE",
          },
        },
      ];
    }

    return candidates.map((candidate) => ({
      entityType: candidate.source,
      sourceType: identity.sourceType,
      sourceId:
        candidate.canonicalProjectId ||
        candidate.marketAssetId ||
        candidate.sourceProfileId ||
        identity.sourceProjectId,
      sourceUrl: identity.sourceUrl,
      payload: this.reviewCandidatePayload(candidate),
      normalizedPayload: this.normalizedPayload(identity),
      confidence: candidate.confidence,
      metadata: {
        matchedBy: candidate.matchedBy,
        reason: candidate.reason,
        linkStatus: candidate.linkStatus,
        verified: candidate.verified,
      },
    }));
  }

  private sourceProjectReviewPayload(
    icoProject: Record<string, any>,
    identity: IcoProjectIdentity
  ): Record<string, any> {
    return {
      sourceDocumentId: this.toIdString(icoProject._id),
      sourceProjectId: identity.sourceProjectId,
      sourceSlug: identity.sourceSlug,
      sourceUrl: identity.sourceUrl,
      name: identity.name,
      symbol: identity.symbol,
      slug: identity.slug,
      providerIds: identity.providerIds,
    };
  }

  private reviewCandidatePayload(
    candidate: IcoProjectResolveCandidate
  ): Record<string, any> {
    return {
      canonicalProjectId: candidate.canonicalProjectId,
      marketAssetId: candidate.marketAssetId,
      sourceProfileId: candidate.sourceProfileId,
      source: candidate.source,
      name: candidate.name,
      symbol: candidate.symbol,
      slug: candidate.slug,
      matchedBy: candidate.matchedBy,
      reason: candidate.reason,
      payload: candidate.payload,
    };
  }

  private normalizedPayload(identity: IcoProjectIdentity): Record<string, any> {
    return {
      normalizedName: identity.normalizedName,
      normalizedSymbol: identity.normalizedSymbol,
      normalizedSlug: identity.normalizedSlug,
    };
  }

  private reviewFingerprint(
    identity: IcoProjectIdentity,
    reason = "POTENTIAL_PROJECT_MATCH"
  ): string {
    return [
      "ico_project_profile",
      reason,
      identity.sourceType,
      identity.normalizedName ||
        identity.normalizedSlug ||
        identity.sourceProjectId ||
        "unknown",
      identity.normalizedSymbol || "",
    ].join(":");
  }

  private icodropsProfileOnlyMetadata(
    project: Record<string, any>
  ): Record<string, any> {
    const raw = project.rawIcoData || {};
    const payload: Record<string, any> = {};
    if (this.isNonEmptyProfileOnlyValue(project.fundraising)) {
      payload.fundraising = project.fundraising;
    } else if (this.isNonEmptyProfileOnlyValue(raw.fundraising)) {
      payload.fundraising = raw.fundraising;
    }
    if (this.isNonEmptyProfileOnlyValue(project.tokenomics)) {
      payload.tokenomics = project.tokenomics;
    } else if (this.isNonEmptyProfileOnlyValue(raw.tokenomics)) {
      payload.tokenomics = raw.tokenomics;
    }
    const saleRounds = [
      ...this.arrayValue(project.saleRounds),
      ...this.arrayValue(raw.saleRounds),
      ...this.arrayValue(project.fundraising?.saleRounds),
      ...this.arrayValue(raw.fundraising?.saleRounds),
    ].filter((value) => this.isNonEmptyProfileOnlyValue(value));
    if (saleRounds.length) payload.saleRounds = saleRounds;
    const screenshots = this.profileScreenshots(project);
    if (screenshots.length) payload.screenshots = screenshots;
    return this.cleanObject(payload);
  }

  private profileScreenshots(
    project: Record<string, any>
  ): Array<Record<string, any>> {
    const raw = project.rawIcoData || {};
    const detail = project.rawDetailData || raw.rawDetailData || {};
    return this.normalizeProfileScreenshots([
      ...this.arrayValue(project.screenshots),
      ...this.arrayValue(raw.screenshots),
      ...this.arrayValue(detail.screenshots),
    ]);
  }

  private normalizeProfileScreenshots(
    values: any[]
  ): Array<Record<string, any>> {
    const seen = new Set<string>();
    const screenshots: Array<Record<string, any>> = [];

    for (const value of values) {
      const screenshot = this.normalizeProfileScreenshot(value);
      if (!screenshot?.url || seen.has(screenshot.url)) continue;
      seen.add(screenshot.url);
      screenshots.push(screenshot);
    }

    return screenshots;
  }

  private normalizeProfileScreenshot(
    value: any
  ): Record<string, any> | undefined {
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

  private isNonEmptyProfileOnlyValue(value: any): boolean {
    if (value === undefined || value === null || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    if (value instanceof Date || value instanceof Types.ObjectId) return true;
    if (typeof value === "object") return Object.keys(value).length > 0;
    return true;
  }

  private profileCompleteness(profile: IcoProjectProfilePayload): number {
    const checks = [
      profile.name,
      profile.symbol,
      profile.slug || profile.sourceSlug,
      profile.description,
      profile.website,
      profile.logoUrl,
      profile.categories?.length,
      profile.status,
      profile.launchDate,
    ];
    const filled = checks.filter(Boolean).length;
    return Math.round((filled / checks.length) * 100);
  }

  private descriptionFromProject(
    project: Record<string, any>
  ): string | undefined {
    const raw = project.rawIcoData || {};
    return cleanProjectProfileString(
      project.description ||
        project.fullDescription ||
        project.shortDescription ||
        project.overviewText ||
        raw.description ||
        raw.fullDescription ||
        raw.shortDescription
    );
  }

  private websiteFromProject(project: Record<string, any>): string | undefined {
    const raw = project.rawIcoData || {};
    return this.firstString(
      project.website,
      project.links?.website,
      raw.website,
      raw.links?.website
    );
  }

  private socialsFromProject(project: Record<string, any>) {
    const raw = project.rawIcoData || {};
    const source = {
      ...(raw.social || {}),
      ...(raw.socials || {}),
      ...(raw.links || {}),
      ...(project.social || {}),
      ...(project.socials || {}),
      ...(project.links || {}),
    };

    return this.cleanObject({
      twitter: this.firstString(source.twitter, source.x),
      telegram: this.firstString(source.telegram, source.tg),
      discord: this.firstString(source.discord),
      medium: this.firstString(source.medium),
      github: this.firstString(source.github),
    });
  }

  private sourceQuery(
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

  private emptyResult(
    sourceType: string,
    write: boolean,
    allowCreateCanonicalProjects: boolean,
    debug: boolean
  ): IcoProjectProfileImportResult {
    const result: IcoProjectProfileImportResult = {
      mode: write ? "write" : "dry-run",
      dbName: this.dbName(),
      parserDbName: this.parserDbName(),
      sourceType,
      allowCreateCanonicalProjects,
      totalProjects: 0,
      linkedExisting: 0,
      reviewPotentialMatch: 0,
      reviewNewProject: 0,
      wouldCreateCanonicalProject: 0,
      written: {
        canonicalProjects: { created: 0, updated: 0 },
        projectSourceProfiles: { created: 0, updated: 0 },
        icoProjectReadModels: { created: 0, updated: 0 },
        reviewBatches: { created: 0, updated: 0 },
      },
      errors: [],
      examples: {
        linkedExisting: [],
        reviewPotentialMatch: [],
        reviewNewProject: [],
        createNew: [],
      },
    };

    if (debug) {
      result.debugExamples = {
        linkedExisting: [],
        potentialProjectMatch: [],
        newProjectCandidate: [],
      };
    }

    return result;
  }

  private recordUpsert(counter: UpsertCounter, created: boolean): void {
    if (created) counter.created += 1;
    else counter.updated += 1;
  }

  private pushExample(
    target: IcoProjectResolveResult[],
    value: IcoProjectResolveResult,
    limit: number
  ): void {
    if (target.length < limit) target.push(value);
  }

  private async pushDiagnosticExample(
    target: IcoProjectDiagnosticExample[] | undefined,
    identity: IcoProjectIdentity,
    resolveResult: IcoProjectResolveResult,
    limit: number
  ): Promise<void> {
    if (!target || target.length >= limit) return;
    target.push(await this.buildDiagnosticExample(identity, resolveResult));
  }

  private async buildDiagnosticExample(
    identity: IcoProjectIdentity,
    resolveResult: IcoProjectResolveResult
  ): Promise<IcoProjectDiagnosticExample> {
    const candidates = resolveResult.candidates || [];
    const canonicalIds = uniqueProjectProfileStrings([
      resolveResult.canonicalProjectId,
      ...candidates.map((candidate) => candidate.canonicalProjectId),
    ]);
    const marketAssetIds = uniqueProjectProfileStrings([
      resolveResult.marketAssetId,
      ...candidates.map((candidate) => candidate.marketAssetId),
    ]);

    const [canonicalProjects, marketAssets] = await Promise.all([
      canonicalIds.length
        ? this.canonicalProjectModel
            .find({ _id: { $in: this.toObjectIds(canonicalIds) } })
            .lean()
        : [],
      marketAssetIds.length
        ? this.marketAssetModel
            .find({ _id: { $in: this.toObjectIds(marketAssetIds) } })
            .lean()
        : [],
    ]);

    const canonicalById = new Map(
      (canonicalProjects as any[]).map((project) => [
        this.toIdString(project._id),
        project,
      ])
    );
    const marketAssetById = new Map(
      (marketAssets as any[]).map((asset) => [
        this.toIdString(asset._id),
        asset,
      ])
    );

    return {
      ico: {
        name: identity.name,
        symbol: identity.symbol,
        slug: identity.querySlug || identity.sourceSlug || identity.slug,
      },
      candidates: candidates.map((candidate) => {
        const canonical =
          canonicalById.get(candidate.canonicalProjectId || "") ||
          canonicalById.get(resolveResult.canonicalProjectId || "");
        const marketAsset =
          marketAssetById.get(candidate.marketAssetId || "") ||
          marketAssetById.get(resolveResult.marketAssetId || "");

        return {
          canonicalProjectId: candidate.canonicalProjectId,
          canonical: canonical
            ? {
                name: canonical.name,
                symbol: canonical.symbol,
                slug: canonical.slug,
              }
            : undefined,
          marketAssetId: candidate.marketAssetId,
          marketAsset: marketAsset
            ? {
                name: marketAsset.name,
                symbol: marketAsset.symbol,
                slug: marketAsset.slug,
                coingeckoId: marketAsset.providerIds?.coingeckoId,
              }
            : undefined,
          reason: candidate.reason,
          score: candidate.confidence,
          matchedBy: candidate.matchedBy,
        };
      }),
      reason: resolveResult.reason,
      score: resolveResult.confidence,
      matchedBy: resolveResult.matchedBy,
    };
  }

  private resolveLimit(options: IcoProjectProfileImportOptions): number {
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

  private requireObjectId(value: any): Types.ObjectId {
    const objectId = this.toObjectId(value);
    if (!objectId) throw new Error(`Invalid canonicalProjectId "${value}".`);
    return objectId;
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value;
    const text = this.toIdString(value);
    return Types.ObjectId.isValid(text) ? new Types.ObjectId(text) : undefined;
  }

  private toObjectIds(values: string[]): Types.ObjectId[] {
    return values
      .map((value) => this.toObjectId(value))
      .filter(Boolean) as Types.ObjectId[];
  }

  private toIdString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();
    if (typeof value.toString === "function") return value.toString();
    return "";
  }

  private dateValue(value: any): Date | undefined {
    if (!value) return undefined;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
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

  private cleanObject<T extends Record<string, any>>(input: T): T {
    const output: Record<string, any> = {};
    for (const [key, value] of Object.entries(input || {})) {
      if (value === undefined) continue;
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        !(value instanceof Types.ObjectId)
      ) {
        const nested = this.cleanObject(value);
        if (Object.keys(nested).length) output[key] = nested;
        continue;
      }
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
