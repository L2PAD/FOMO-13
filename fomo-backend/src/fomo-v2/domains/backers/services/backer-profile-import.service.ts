import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { FomoV2ReviewBatch } from "../../review/models/review-batch.model";
import { FomoV2ReviewService } from "../../review/services/review.service";
import { FomoV2ParserControlPolicyService } from "../../parser-control/services/parser-control-policy.service";
import {
  FomoV2ParserSnapshotReaderService,
  FomoV2ValidatedParserSnapshot,
} from "../../parser-control/services/parser-snapshot-reader.service";
import {
  normalizeProjectSourceType,
  projectSourceTypeMongoPattern,
} from "../../../shared/source-policy";
import { FOMO_V2_BACKER_PARSER_DB_CONNECTION } from "../backer-parser-db.constants";
import {
  BackerTypeInference,
  buildBackerFingerprint,
  cleanBackerString,
  cleanObject,
  firstValue,
  inferBackerTypeWithReason,
  normalizeBackerName,
  normalizeBackerSocials,
  normalizeBackerUrl,
  slugifyBacker,
  toBackerIdString,
} from "../helpers";
import {
  BackerProfileImportOptions,
  BackerProfileImportResult,
  FomoV2BackerIdentity,
} from "../types";
import {
  FomoV2Backer,
  FomoV2BackerDocument,
  FomoV2BackerSourceProfile,
  FomoV2BackerSourceProfileDocument,
  FomoV2IntelInvestorSource,
} from "../models";
import { FomoV2BackerService } from "./backer.service";

type BackerImportPayload = {
  identity: FomoV2BackerIdentity;
  backer: Record<string, any>;
  sourceProfile: Record<string, any>;
  rawInvestor: Record<string, any>;
  typeInference: BackerTypeInference;
};

type ReviewDecision = {
  reason:
    | "BACKER_POTENTIAL_MATCH"
    | "BACKER_TYPE_CONFLICT"
    | "BACKER_AMBIGUOUS";
  candidates: FomoV2BackerDocument[];
  message: string;
};

const DROPSTAB_INVESTORS_UPSTREAM_PARSER_KEY = "dropstab:investors";

@Injectable()
export class FomoV2BackerProfileImportService {
  private readonly debugLimit = 25;

  constructor(
    private readonly configService: ConfigService,
    private readonly backerService: FomoV2BackerService,
    private readonly reviewService: FomoV2ReviewService,
    @InjectModel(FomoV2IntelInvestorSource.name, FOMO_V2_BACKER_PARSER_DB_CONNECTION)
    private readonly intelInvestorSourceModel: Model<FomoV2IntelInvestorSource>,
    @InjectModel(FomoV2Backer.name)
    private readonly backerModel: Model<FomoV2BackerDocument>,
    @InjectModel(FomoV2BackerSourceProfile.name)
    private readonly sourceProfileModel: Model<FomoV2BackerSourceProfileDocument>,
    @InjectModel(FomoV2ReviewBatch.name)
    private readonly reviewBatchModel: Model<FomoV2ReviewBatch>,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService,
    @Optional()
    private readonly snapshotReader?: FomoV2ParserSnapshotReaderService
  ) {}

  async run(
    options: BackerProfileImportOptions = {}
  ): Promise<BackerProfileImportResult> {
    const write = Boolean(options.write);
    const sourceType =
      normalizeProjectSourceType(options.sourceType || "intel") || "intel";
    if (write && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        `backers:${sourceType}`
      );
    }
    await options.assertExecutionActive?.();
    const debug = Boolean(options.debug);
    const limit = this.parsePositiveInteger(options.limit);
    const result = this.emptyResult(write, debug, sourceType);
    const snapshot = await this.openSnapshot(options, sourceType, write);

    const query = snapshot
      ? undefined
      : this.intelInvestorSourceModel
          .find({ source: projectSourceTypeMongoPattern(sourceType) })
          .sort({ _id: 1 });
    if (query && limit) query.limit(limit);

    const cursor = snapshot
      ? this.snapshotReader!.cursor(snapshot, { limit })
      : query!.lean().cursor();

    for await (const sourceDocument of cursor as any) {
      await options.assertExecutionActive?.();
      const investor = snapshot
        ? this.snapshotReader!.payload(snapshot, sourceDocument)
        : sourceDocument;
      await this.processInvestor(
        investor,
        { write, debug, sourceType },
        result
      );
      await options.assertExecutionActive?.();
    }

    return result;
  }

  private async openSnapshot(
    options: BackerProfileImportOptions,
    sourceType: string,
    write: boolean
  ): Promise<FomoV2ValidatedParserSnapshot | undefined> {
    const snapshotId = cleanBackerString(options.snapshotId);
    if (!snapshotId) return undefined;
    if (!this.snapshotReader) {
      throw new Error("Parser snapshot reader is not available.");
    }
    if (sourceType !== "dropstab") {
      throw new Error(
        'Managed backer snapshots currently require sourceType="dropstab"; backers:intel remains legacy import-only.'
      );
    }
    const parserKey =
      cleanBackerString(options.upstreamParserKey) ||
      DROPSTAB_INVESTORS_UPSTREAM_PARSER_KEY;
    if (parserKey !== DROPSTAB_INVESTORS_UPSTREAM_PARSER_KEY) {
      throw new Error(
        `Dropstab backer snapshot import requires parser ${DROPSTAB_INVESTORS_UPSTREAM_PARSER_KEY}.`
      );
    }
    return this.snapshotReader.validate({
      snapshotId,
      parserKey,
      sourceType,
      write,
      upstreamRunId: cleanBackerString(options.upstreamRunId),
    });
  }

  private async processInvestor(
    investor: Record<string, any>,
    options: { write: boolean; debug: boolean; sourceType: string },
    result: BackerProfileImportResult
  ): Promise<void> {
    result.totalInvestors += 1;

    try {
      const payload = this.toImportPayload(investor, options.sourceType);
      if (!payload) {
        this.recordSkipped(result, "missing_name", {
          sourceDocumentId: toBackerIdString(investor._id),
        });
        return;
      }

      result.byBackerType[payload.identity.backerType] =
        (result.byBackerType[payload.identity.backerType] || 0) + 1;
      if (!payload.typeInference.confident) {
        this.recordWarning(result, payload.typeInference.reason, {
          name: payload.identity.name,
          normalizedName: payload.identity.normalizedName,
          sourceInvestorId: payload.identity.sourceInvestorId,
          defaultBackerType: payload.identity.backerType,
          sourceDocumentId: payload.identity.sourceDocumentId,
        });
      }

      const sourceProfile = payload.identity.sourceInvestorId
        ? await this.backerService.findSourceProfileBySourceIdentity(
            payload.identity.sourceType,
            payload.identity.sourceInvestorId
          )
        : null;
      const existingBySource = sourceProfile?.backerId
        ? await this.backerService.findById(sourceProfile.backerId)
        : payload.identity.sourceInvestorId
          ? await this.backerService.findBySourceIdentity(
              payload.identity.sourceType,
              payload.identity.sourceInvestorId
            )
          : null;
      const existingByFingerprint = await this.backerService.findByFingerprint(
        payload.identity.canonicalFingerprint
      );
      const sameNameCandidates = await this.backerModel
        .find({
          normalizedName: payload.identity.normalizedName,
          status: { $ne: "merged" },
        })
        .sort({ updatedAt: -1 })
        .limit(10)
        .exec();

      const reviewDecision = this.reviewDecision(
        payload,
        existingBySource,
        existingByFingerprint,
        sameNameCandidates
      );

      if (reviewDecision) {
        await this.handleReview(payload, reviewDecision, options, result);
        return;
      }

      // Only an exact source identity is strong enough to update an existing
      // backer automatically. Name/type fingerprints are review evidence.
      const existingBacker = existingBySource;

      if (existingBacker) result.wouldUpdateBackers += 1;
      else result.wouldCreateBackers += 1;

      const existingSourceProfile =
        sourceProfile ||
        (existingBacker
          ? await this.backerService.findSourceProfileForBacker(
              existingBacker._id,
              payload.identity.sourceType
            )
          : null);

      if (existingSourceProfile) result.wouldUpdateSourceProfiles += 1;
      else result.wouldCreateSourceProfiles += 1;

      this.pushDebugExample(result, options.debug, {
        action: existingBacker ? "update_backer" : "create_backer",
        sourceInvestorId: payload.identity.sourceInvestorId,
        name: payload.identity.name,
        normalizedName: payload.identity.normalizedName,
        backerType: payload.identity.backerType,
        existingBackerId: toBackerIdString(existingBacker?._id),
      });

      if (!options.write) return;

      const backerUpsert = await this.backerService.upsertBacker(payload.backer as any);
      this.recordWritten(result.written.backers, backerUpsert.created);

      const sourceProfileUpsert = await this.backerService.upsertSourceProfile({
        ...payload.sourceProfile,
        backerId: backerUpsert.doc._id,
      } as any);
      this.recordWritten(
        result.written.sourceProfiles,
        sourceProfileUpsert.created
      );

      const readModelUpsert = await this.backerService.upsertReadModel(
        this.backerService.buildReadModelInputFromBacker(backerUpsert.doc, true)
      );
      this.recordWritten(result.written.readModels, readModelUpsert.created);
    } catch (error: any) {
      result.errors.push({
        sourceDocumentId: toBackerIdString(investor?._id),
        name: cleanBackerString(investor?.name),
        message: error?.message || String(error),
      });
    }
  }

  private toImportPayload(
    investor: Record<string, any>,
    sourceType: string
  ): BackerImportPayload | null {
    const name = cleanBackerString(investor.name || investor.title);
    if (!name) return null;

    const sourceInvestorId =
      cleanBackerString(investor.sourceInvestorId) ||
      cleanBackerString(investor.sourceId) ||
      cleanBackerString(investor.externalId) ||
      cleanBackerString(investor.id) ||
      cleanBackerString(investor.key) ||
      toBackerIdString(investor._id);
    const sourceSlug = cleanBackerString(
      investor.slug || investor.investorSlug
    );
    const sourceUrl = normalizeBackerUrl(
      firstValue(investor.detailUrl, investor.sourceUrl, investor.url)
    );
    const normalizedName = normalizeBackerName(name);
    const typeInference = inferBackerTypeWithReason(investor);
    const backerType = typeInference.backerType;
    const slug = sourceSlug || slugifyBacker(name);
    const canonicalFingerprint = buildBackerFingerprint({
      normalizedName,
      backerType,
    });
    const links = this.normalizeLinks(investor.links);
    const website = normalizeBackerUrl(
      firstValue(
        investor.website,
        investor.websiteUrl,
        this.linkByTypes(links, ["website", "site"])
      )
    );
    const socials = normalizeBackerSocials({
      ...(investor.socialLinks || {}),
      ...(investor.socials || {}),
      ...(investor.social || {}),
      twitter: firstValue(
        investor.twitter,
        investor.twitterUrl,
        this.linkByTypes(links, ["twitter", "x"])
      ),
      linkedin: firstValue(
        investor.linkedin,
        investor.linkedinUrl,
        this.linkByTypes(links, ["linkedin", "linkedIn"])
      ),
      telegram: firstValue(
        investor.telegram,
        this.linkByTypes(links, ["telegram", "tg"])
      ),
      discord: firstValue(investor.discord, this.linkByTypes(links, ["discord"])),
      medium: firstValue(investor.medium, this.linkByTypes(links, ["medium"])),
      github: firstValue(investor.github, this.linkByTypes(links, ["github"])),
    });
    const logoUrl = normalizeBackerUrl(
      firstValue(investor.logo, investor.image, investor.avatar)
    );
    const country = this.countryName(investor.country);
    const description = cleanBackerString(
      investor.description || investor.bio || investor.about
    );
    const niche = cleanBackerString(investor.type);
    const sourceDocumentId = toBackerIdString(investor._id);

    const identity: FomoV2BackerIdentity = {
      sourceType,
      sourceInvestorId,
      sourceSlug,
      sourceUrl,
      sourceDocumentId,
      name,
      normalizedName,
      slug,
      backerType,
      canonicalFingerprint,
    };

    const sourceRef = cleanObject({
      sourceType,
      sourceId: sourceInvestorId,
      sourceEntityId: investor._id,
      sourceUrl,
      confidence: 1,
      metadata: {
        sourceCollection: "intel_investors",
        sourceSlug,
        sourceDocumentId,
      },
    });

    const metadata = cleanObject({
      importer: "fomo-v2:backer-profile-import",
      sourceCollection: "intel_investors",
      sourceDocumentId,
      sourceKey: cleanBackerString(investor.key),
      rawType: niche,
      ventureType: cleanBackerString(investor.ventureType),
      category:
        cleanBackerString(investor.category) ||
        cleanBackerString(investor.category?.name) ||
        cleanBackerString(investor.category?.title),
      sourceIdentityKey:
        sourceInvestorId && `${sourceType}:${sourceInvestorId}`,
      domainDataSkipped: true,
    });

    return {
      identity,
      rawInvestor: investor,
      typeInference,
      backer: cleanObject({
        name,
        normalizedName,
        slug,
        backerType,
        description,
        website,
        socials,
        logoUrl,
        avatarUrl: backerType === "person" ? logoUrl : undefined,
        country,
        niche,
        status: "active",
        confidence: 1,
        primarySource: sourceType,
        sourceId: sourceInvestorId,
        sourceUrl,
        sourceRefs: [sourceRef],
        canonicalFingerprint,
        metadata,
      }),
      sourceProfile: cleanObject({
        sourceType,
        sourceInvestorId,
        sourceSlug,
        sourceUrl,
        name,
        normalizedName,
        backerType,
        description,
        website,
        socials,
        logoUrl,
        avatarUrl: backerType === "person" ? logoUrl : undefined,
        country,
        sourceEntityId: investor._id,
        metadata,
      }),
    };
  }

  private reviewDecision(
    payload: BackerImportPayload,
    existingBySource: FomoV2BackerDocument | null,
    existingByFingerprint: FomoV2BackerDocument | null,
    sameNameCandidates: FomoV2BackerDocument[]
  ): ReviewDecision | null {
    if (!payload.typeInference.confident) {
      return {
        reason: "BACKER_AMBIGUOUS",
        candidates: this.uniqueBackers([
          existingBySource,
          existingByFingerprint,
          ...sameNameCandidates,
        ]),
        message: `Backer type is uncertain (${payload.typeInference.reason}); manual classification is required.`,
      };
    }

    if (
      existingBySource &&
      existingByFingerprint &&
      String(existingBySource._id) !== String(existingByFingerprint._id)
    ) {
      return {
        reason: "BACKER_POTENTIAL_MATCH",
        candidates: [existingBySource, existingByFingerprint],
        message: "Source identity and canonical fingerprint point to different backers.",
      };
    }

    if (
      existingBySource &&
      this.hasTypeConflict(existingBySource.backerType, payload.identity.backerType)
    ) {
      return {
        reason: "BACKER_TYPE_CONFLICT",
        candidates: [existingBySource],
        message: "Source identity has a different existing backerType.",
      };
    }

    const differentTypeCandidates = sameNameCandidates.filter((candidate) =>
      this.hasTypeConflict(candidate.backerType, payload.identity.backerType)
    );
    if (!existingBySource && !existingByFingerprint && differentTypeCandidates.length) {
      return {
        reason: "BACKER_TYPE_CONFLICT",
        candidates: differentTypeCandidates,
        message: "Same normalizedName exists under a different backerType.",
      };
    }

    const nameOnlyCandidates = this.uniqueBackers([
      existingByFingerprint,
      ...sameNameCandidates,
    ]);
    if (!existingBySource && nameOnlyCandidates.length) {
      return {
        reason: "BACKER_POTENTIAL_MATCH",
        candidates: nameOnlyCandidates,
        message:
          "Name/type identity is not sufficient for an automatic backer merge.",
      };
    }

    return null;
  }

  private uniqueBackers(
    candidates: Array<FomoV2BackerDocument | null | undefined>
  ): FomoV2BackerDocument[] {
    const byId = new Map<string, FomoV2BackerDocument>();
    for (const candidate of candidates) {
      const id = toBackerIdString(candidate?._id);
      if (candidate && id) byId.set(id, candidate);
    }
    return Array.from(byId.values());
  }

  private async handleReview(
    payload: BackerImportPayload,
    decision: ReviewDecision,
    options: { write: boolean; debug: boolean },
    result: BackerProfileImportResult
  ): Promise<void> {
    const fingerprint = this.reviewFingerprint(payload, decision.reason);
    const existingReview = await this.reviewBatchModel
      .findOne({ fingerprint, status: "open" })
      .lean();

    if (existingReview) result.wouldUpdateReviewBatches += 1;
    else result.wouldCreateReviewBatches += 1;

    this.recordSkipped(result, decision.reason, {
      name: payload.identity.name,
      normalizedName: payload.identity.normalizedName,
      backerType: payload.identity.backerType,
      sourceInvestorId: payload.identity.sourceInvestorId,
      message: decision.message,
      candidateIds: decision.candidates.map((candidate) =>
        toBackerIdString(candidate._id)
      ),
    });

    this.pushDebugExample(result, options.debug, {
      action: "review",
      reason: decision.reason,
      name: payload.identity.name,
      normalizedName: payload.identity.normalizedName,
      backerType: payload.identity.backerType,
      message: decision.message,
      candidates: decision.candidates.map((candidate) => ({
        backerId: toBackerIdString(candidate._id),
        name: candidate.name,
        normalizedName: candidate.normalizedName,
        backerType: candidate.backerType,
        primarySource: candidate.primarySource,
        sourceId: candidate.sourceId,
      })),
    });

    if (!options.write) return;

    const review = await this.reviewService.createOrUpdateBatch({
      domain: "backers",
      reason: decision.reason,
      projectKey: payload.identity.sourceInvestorId || payload.identity.sourceSlug,
      projectName: payload.identity.name,
      normalizedProjectName: payload.identity.normalizedName,
      incomingSourceType: payload.identity.sourceType,
      affectedEntityTypes: ["backer", "backer_source_profile"],
      candidateCount: Math.max(1, decision.candidates.length),
      candidates: this.reviewCandidates(payload, decision),
      fingerprint,
      metadata: {
        reviewFingerprintVersion: "backers-v1",
        normalizedName: payload.identity.normalizedName,
        backerType: payload.identity.backerType,
        sourceType: payload.identity.sourceType,
        sourceInvestorId: payload.identity.sourceInvestorId,
        typeInference: payload.typeInference,
        message: decision.message,
      },
    });

    this.recordWritten(result.written.reviewBatches, review.created);
  }

  private reviewCandidates(
    payload: BackerImportPayload,
    decision: ReviewDecision
  ) {
    const sourceCandidate = {
      entityType: "backer_source_profile",
      sourceType: payload.identity.sourceType,
      sourceId: payload.identity.sourceInvestorId,
      sourceEntityId: payload.rawInvestor._id,
      sourceUrl: payload.identity.sourceUrl,
      payload: {
        sourceDocumentId: payload.identity.sourceDocumentId,
        sourceInvestorId: payload.identity.sourceInvestorId,
        sourceSlug: payload.identity.sourceSlug,
        name: payload.identity.name,
        slug: payload.identity.slug,
        backerType: payload.identity.backerType,
      },
      normalizedPayload: {
        normalizedName: payload.identity.normalizedName,
        canonicalFingerprint: payload.identity.canonicalFingerprint,
      },
      confidence: 1,
      metadata: {
        reviewReason: decision.reason,
      },
    };

    return [
      sourceCandidate,
      ...decision.candidates.map((candidate) => ({
        entityType: "backer",
        sourceType: candidate.primarySource,
        sourceId: candidate.sourceId || toBackerIdString(candidate._id),
        payload: {
          backerId: toBackerIdString(candidate._id),
          name: candidate.name,
          slug: candidate.slug,
          backerType: candidate.backerType,
          primarySource: candidate.primarySource,
          sourceId: candidate.sourceId,
        },
        normalizedPayload: {
          normalizedName: candidate.normalizedName,
          canonicalFingerprint: candidate.canonicalFingerprint,
        },
        confidence: candidate.canonicalFingerprint === payload.identity.canonicalFingerprint ? 1 : 0.5,
        metadata: {
          reviewReason: decision.reason,
        },
      })),
    ];
  }

  private reviewFingerprint(
    payload: BackerImportPayload,
    reason: string
  ): string {
    return [
      "backers",
      reason,
      payload.identity.sourceType,
      payload.identity.normalizedName,
      payload.identity.backerType,
    ].join(":");
  }

  private hasTypeConflict(existingType: string, incomingType: string): boolean {
    if (!incomingType || !["fund", "person"].includes(incomingType)) return false;
    if (!existingType || !["fund", "person"].includes(existingType)) return true;
    return existingType !== incomingType;
  }

  private normalizeLinks(value: any): Array<{ type: string; url: string }> {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        if (!item) return null;
        if (typeof item === "string") {
          const url = normalizeBackerUrl(item);
          return url ? { type: "link", url } : null;
        }
        const rawType =
          cleanBackerString(item.type) ||
          cleanBackerString(item.kind) ||
          cleanBackerString(item.name) ||
          cleanBackerString(item.title) ||
          "link";
        const url = normalizeBackerUrl(firstValue(item.url, item.href, item.link));
        return url ? { type: rawType.toLowerCase(), url } : null;
      })
      .filter((item): item is { type: string; url: string } => Boolean(item?.url));
  }

  private linkByTypes(
    links: Array<{ type: string; url: string }>,
    types: string[]
  ): string | undefined {
    const normalizedTypes = types.map((item) => item.toLowerCase());
    return links.find((item) => normalizedTypes.includes(item.type.toLowerCase()))
      ?.url;
  }

  private countryName(value: any): string | undefined {
    if (!value) return undefined;
    if (typeof value === "string") return cleanBackerString(value);
    return cleanBackerString(value.name || value.title || value.label);
  }

  private emptyResult(
    write: boolean,
    debug: boolean,
    sourceType: string
  ): BackerProfileImportResult {
    const result: BackerProfileImportResult = {
      mode: write ? "write" : "dry-run",
      dbName: this.dbName(),
      parserDbName: this.parserDbName(),
      sourceType,
      totalInvestors: 0,
      wouldCreateBackers: 0,
      wouldUpdateBackers: 0,
      wouldCreateSourceProfiles: 0,
      wouldUpdateSourceProfiles: 0,
      wouldCreateReviewBatches: 0,
      wouldUpdateReviewBatches: 0,
      byBackerType: {
        fund: 0,
        person: 0,
      },
      warnings: {
        total: 0,
        byReason: {},
      },
      skipped: {
        total: 0,
        byReason: {},
      },
      written: {
        backers: { created: 0, updated: 0 },
        sourceProfiles: { created: 0, updated: 0 },
        readModels: { created: 0, updated: 0 },
        reviewBatches: { created: 0, updated: 0 },
      },
      errors: [],
    };

    if (debug) {
      result.debugExamples = [];
      result.skipped.examples = [];
      result.warnings.examples = [];
    }

    return result;
  }

  private recordSkipped(
    result: BackerProfileImportResult,
    reason: string,
    example?: Record<string, any>
  ): void {
    result.skipped.total += 1;
    result.skipped.byReason[reason] =
      (result.skipped.byReason[reason] || 0) + 1;
    if (example && result.skipped.examples && result.skipped.examples.length < 20) {
      result.skipped.examples.push(example);
    }
  }

  private recordWarning(
    result: BackerProfileImportResult,
    reason: string,
    example?: Record<string, any>
  ): void {
    result.warnings.total += 1;
    result.warnings.byReason[reason] =
      (result.warnings.byReason[reason] || 0) + 1;
    if (example && result.warnings.examples && result.warnings.examples.length < 20) {
      result.warnings.examples.push(example);
    }
  }

  private recordWritten(
    counter: { created: number; updated: number },
    created: boolean
  ): void {
    if (created) counter.created += 1;
    else counter.updated += 1;
  }

  private pushDebugExample(
    result: BackerProfileImportResult,
    debug: boolean,
    example: Record<string, any>
  ): void {
    if (!debug || !result.debugExamples) return;
    if (result.debugExamples.length >= this.debugLimit) return;
    result.debugExamples.push(example);
  }

  private parsePositiveInteger(value: any): number | undefined {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return Math.trunc(parsed);
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
