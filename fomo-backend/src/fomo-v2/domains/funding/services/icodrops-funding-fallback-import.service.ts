import { Injectable, Optional } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { projectSourceTypeMongoPattern } from "../../../shared/source-policy";
import { FomoV2BackerService } from "../../backers/services/backer.service";
import { FOMO_V2_PARSER_DB_CONNECTION } from "../../ico";
import { FomoV2IcoProjectSource } from "../../ico/models";
import { IcoProjectResolverService } from "../../ico/services";
import {
  buildLegacyFundingRoundFingerprint,
  buildFundingRoundFingerprint,
  cleanFundingString,
  fundingDateBucket,
  normalizeFundingName,
  normalizeFundingRoundStatus,
  normalizeFundingRoundType,
  toFundingDate,
} from "../helpers";
import { FomoV2FundingRound } from "../models";
import { FomoV2FundingService } from "./funding.service";
import { FomoV2ParserControlPolicyService } from "../../parser-control/services/parser-control-policy.service";
import {
  FomoV2ParserSnapshotReaderService,
  FomoV2ValidatedParserSnapshot,
} from "../../parser-control/services/parser-snapshot-reader.service";

const SOURCE_TYPE = "icodrops";
const UPSTREAM_PARSER_KEY = "icodrops:projects";
const PARSER_COLLECTION = "ico_projects";
const DEBUG_LIMIT = 20;
const PRIMARY_FUNDING_SOURCES = ["dropstab", "intel_fundraising"];
const PRIMARY_FUNDING_FEEDS = ["intel_fundraising"];

export interface IcodropsFundingFallbackImportOptions {
  limit?: number;
  all?: boolean;
  allConfirmed?: boolean;
  debug?: boolean;
  write?: boolean;
  snapshotId?: string;
  upstreamRunId?: string;
  upstreamParserKey?: string;
  sourceType?: string;
  /** In-process lease/policy fence supplied by the managed parser worker. */
  assertExecutionActive?: () => void | Promise<void>;
}

export interface IcodropsFundingFallbackImportResult {
  mode: "dry-run" | "write";
  sourceType: "icodrops";
  totalParserProjects: number;
  projectsWithFundraisingRounds: number;
  projectsWithFundingMissingSource: number;
  resolvedCanonicalProjects: number;
  missingCanonicalProjects: number;
  fundingSkippedBecausePrimaryExists: number;
  fundingSkippedBecauseSourceConflict: number;
  fundingFallbackWouldCreate: number;
  fundingFallbackWouldUpdate: number;
  fundingFallbackCreated: number;
  fundingFallbackUpdated: number;
  fundingFallbackParticipantsWouldCreate: number;
  fundingFallbackParticipantsCreated: number;
  fundingFallbackParticipantsUpdated: number;
  fundingFallbackParticipantsSkippedMissingBacker: number;
  ambiguousCanonicalProjectsSkipped: number;
  roundsFound: number;
  roundsSkipped: number;
  saleRoundsStoredAsProfileOnly: number;
  saleRoundsDomainWritesBlocked: number;
  tokenomicsStoredAsProfileOnly: number;
  vestingWritesBlocked: number;
  unlockWritesBlocked: number;
  icodropsGenericFundingBlocked: number;
  skipped: {
    total: number;
    byReason: Record<string, number>;
    examples?: Array<Record<string, any>>;
  };
  warnings: string[];
  errors: Array<Record<string, any>>;
  debugExamples?: Record<string, Array<Record<string, any>>>;
}

interface ProjectIdentity {
  sourceDocumentId?: string;
  sourceProjectId?: string;
  sourceSlug?: string;
  sourceUrl?: string;
  name?: string;
  symbol?: string;
}

interface IcodropsFallbackParticipant {
  backerName?: string;
  normalizedBackerName?: string;
  sourceBackerId?: string;
  sourceBackerSlug?: string;
  sourceBackerUrl?: string;
  isLead: boolean;
}

interface NormalizedIcodropsRound {
  canonicalProjectId: Types.ObjectId;
  projectIdentity: ProjectIdentity;
  sourceIndex: number;
  sourceRound: Record<string, any>;
  roundName: string;
  normalizedRoundName?: string;
  roundType: string;
  normalizedRoundType: string;
  announcedDate?: Date;
  dateBucket?: string;
  raisedAmount?: number;
  raisedCurrency?: string;
  valuation?: number;
  tokenPrice?: number;
  primarySource: "icodrops";
  sourceId: string;
  sourceSlug?: string;
  sourceUrl?: string;
  sourceRefs: Array<Record<string, any>>;
  confidence: "low";
  status: string;
  metadata: Record<string, any>;
  roundKey: string;
  canonicalFingerprint: string;
  legacyCanonicalFingerprint?: string;
  legacyRoundKey?: string;
  legacySourceId?: string;
  hasProviderSourceId: boolean;
}

@Injectable()
export class FomoV2IcodropsFundingFallbackImportService {
  constructor(
    @InjectModel(FomoV2IcoProjectSource.name, FOMO_V2_PARSER_DB_CONNECTION)
    private readonly icoProjectSourceModel: Model<FomoV2IcoProjectSource>,
    @InjectModel(FomoV2FundingRound.name)
    private readonly fundingRoundModel: Model<FomoV2FundingRound>,
    private readonly resolver: IcoProjectResolverService,
    private readonly backerService: FomoV2BackerService,
    private readonly fundingService: FomoV2FundingService,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService,
    @Optional()
    private readonly snapshotReader?: FomoV2ParserSnapshotReaderService
  ) {}

  async run(
    options: IcodropsFundingFallbackImportOptions = {}
  ): Promise<IcodropsFundingFallbackImportResult> {
    const write = Boolean(options.write);
    if (write && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        "funding:icodrops"
      );
    }
    await options.assertExecutionActive?.();
    if (options.all && !options.allConfirmed) {
      throw new Error(
        "ICODrops funding fallback --all requires --all-confirmed."
      );
    }
    if (
      write &&
      options.limit === undefined &&
      !(options.all && options.allConfirmed)
    ) {
      throw new Error(
        "ICODrops funding fallback write mode requires --limit or confirmed --all."
      );
    }

    const debug = Boolean(options.debug);
    const limit = options.all
      ? Number.MAX_SAFE_INTEGER
      : this.parsePositiveInteger(options.limit, 100);
    const result = this.emptyResult(write, debug);
    const snapshot = await this.openSnapshot(options, write);
    const query = this.parserQuery();

    result.totalParserProjects = snapshot
      ? snapshot.succeeded
      : await this.icoProjectSourceModel.countDocuments(this.sourceQuery());
    result.projectsWithFundraisingRounds = snapshot
      ? await this.snapshotReader!.count(
          snapshot,
          this.fundraisingRoundsQuery()
        )
      : await this.icoProjectSourceModel.countDocuments(query);
    result.projectsWithFundingMissingSource = snapshot
      ? 0
      : await this.icoProjectSourceModel.countDocuments({
          $and: [this.missingSourceQuery(), this.fundraisingRoundsQuery()],
        });
    if (result.projectsWithFundingMissingSource > 0) {
      this.recordSkipped(
        result,
        "missing_source",
        result.projectsWithFundingMissingSource
      );
      result.warnings.push(
        `Excluded ${result.projectsWithFundingMissingSource} parser projects with funding data because source is missing.`
      );
    }
    if (
      !options.all &&
      result.projectsWithFundraisingRounds > limit
    ) {
      result.warnings.push(
        `Processing first ${limit} ICODrops projects with fundraising.rounds out of ${result.projectsWithFundraisingRounds}.`
      );
    }

    const cursor = snapshot
      ? this.snapshotReader!.cursor(snapshot, {
          payloadFilter: this.fundraisingRoundsQuery(),
          limit: options.all ? undefined : limit,
        })
      : this.icoProjectSourceModel
          .find(query)
          .sort({ _id: 1 })
          .limit(options.all ? 0 : limit)
          .lean()
          .cursor();

    for await (const sourceDocument of cursor as any) {
      await options.assertExecutionActive?.();
      const icoProject = snapshot
        ? this.snapshotReader!.payload(snapshot, sourceDocument)
        : sourceDocument;
      await this.processProject(icoProject, { write, debug, result });
      await options.assertExecutionActive?.();
    }

    return result;
  }

  private async openSnapshot(
    options: IcodropsFundingFallbackImportOptions,
    write: boolean
  ): Promise<FomoV2ValidatedParserSnapshot | undefined> {
    const snapshotId = cleanFundingString(options.snapshotId);
    if (!snapshotId) return undefined;
    if (!this.snapshotReader) {
      throw new Error("Parser snapshot reader is not available.");
    }
    const sourceType = cleanFundingString(options.sourceType) || SOURCE_TYPE;
    if (sourceType !== SOURCE_TYPE) {
      throw new Error(
        `ICODrops funding snapshot sourceType must be "${SOURCE_TYPE}".`
      );
    }
    const parserKey =
      cleanFundingString(options.upstreamParserKey) || UPSTREAM_PARSER_KEY;
    if (parserKey !== UPSTREAM_PARSER_KEY) {
      throw new Error(
        `ICODrops funding snapshot import requires parser ${UPSTREAM_PARSER_KEY}.`
      );
    }
    return this.snapshotReader.validate({
      snapshotId,
      parserKey,
      sourceType,
      write,
      upstreamRunId: cleanFundingString(options.upstreamRunId),
    });
  }

  private async processProject(
    icoProject: Record<string, any>,
    context: {
      write: boolean;
      debug: boolean;
      result: IcodropsFundingFallbackImportResult;
    }
  ): Promise<void> {
    const identity = this.projectIdentity(icoProject);
    const rounds = this.fundraisingRoundsFromProject(icoProject);
    const saleRounds = this.saleRoundsFromProject(icoProject);
    this.recordSaleRoundsBlocked(context, identity, saleRounds);
    this.recordProfileOnlyEvidenceBlocked(context, identity, icoProject);

    try {
      const resolved = await this.resolver.resolve(icoProject, {
        sourceType: SOURCE_TYPE,
      });
      const canonicalProjectId = this.toObjectId(resolved.canonicalProjectId);
      if (resolved.action !== "LINK_EXISTING" || !canonicalProjectId) {
        context.result.missingCanonicalProjects += 1;
        this.recordSkipped(
          context.result,
          "missing_or_unconfirmed_canonical_project",
          rounds.length || 1,
          {
            icodrops: this.projectDebugIdentity(identity),
            resolverAction: resolved.action,
            resolverReason: resolved.reason,
          }
        );
        this.pushDebug(context, "missingCanonicalProjects", {
          icodrops: this.projectDebugIdentity(identity),
          resolverAction: resolved.action,
          resolverReason: resolved.reason,
        });
        return;
      }

      context.result.resolvedCanonicalProjects += 1;

      const ambiguityReason = this.fallbackAmbiguityReason(identity, resolved);
      if (ambiguityReason) {
        const skippedCount = rounds.length || 1;
        context.result.ambiguousCanonicalProjectsSkipped += skippedCount;
        this.recordSkipped(
          context.result,
          "ambiguous_canonical_project",
          skippedCount,
          {
            icodrops: this.projectDebugIdentity(identity),
            canonicalProjectId: this.toIdString(canonicalProjectId),
            resolverReason: resolved.reason,
            reason: ambiguityReason,
          }
        );
        this.pushDebug(context, "ambiguousCanonicalProjects", {
          icodrops: this.projectDebugIdentity(identity),
          canonicalProjectId: this.toIdString(canonicalProjectId),
          resolverReason: resolved.reason,
          reason: ambiguityReason,
        });
        return;
      }

      const primaryRows = await this.countPrimaryFundingRows(
        canonicalProjectId
      );
      if (primaryRows > 0) {
        const skippedCount = rounds.length || 1;
        context.result.fundingSkippedBecausePrimaryExists += skippedCount;
        this.recordSkipped(
          context.result,
          "primary_funding_exists",
          skippedCount,
          {
            icodrops: this.projectDebugIdentity(identity),
            canonicalProjectId: this.toIdString(canonicalProjectId),
            primaryFundingRows: primaryRows,
          }
        );
        this.pushDebug(context, "primaryFundingExists", {
          icodrops: this.projectDebugIdentity(identity),
          canonicalProjectId: this.toIdString(canonicalProjectId),
          primaryFundingRows: primaryRows,
          skippedRounds: rounds.length,
        });
        return;
      }

      for (let index = 0; index < rounds.length; index += 1) {
        await this.processRound(
          rounds[index],
          index,
          identity,
          canonicalProjectId,
          context
        );
      }
    } catch (error: any) {
      context.result.errors.push({
        sourceDocumentId: identity.sourceDocumentId,
        sourceProjectId: identity.sourceProjectId,
        sourceSlug: identity.sourceSlug,
        name: identity.name,
        message: error?.message || String(error),
      });
    }
  }

  private async processRound(
    sourceRound: Record<string, any>,
    index: number,
    identity: ProjectIdentity,
    canonicalProjectId: Types.ObjectId,
    context: {
      write: boolean;
      debug: boolean;
      result: IcodropsFundingFallbackImportResult;
    }
  ): Promise<void> {
    const candidate = this.normalizeRound(
      sourceRound,
      index,
      identity,
      canonicalProjectId
    );
    if (!candidate) {
      context.result.roundsSkipped += 1;
      this.recordSkipped(context.result, "round_validation_failed", 1, {
        icodrops: this.projectDebugIdentity(identity),
        sourcePath: `fundraising.rounds.${index}`,
        sourceRound,
      });
      return;
    }

    context.result.roundsFound += 1;
    const participants = this.participantsFromRound(sourceRound);
    const existing = await this.findExistingFallbackRound(candidate);
    if (existing) {
      context.result.fundingFallbackWouldUpdate += 1;
    } else {
      context.result.fundingFallbackWouldCreate += 1;
      context.result.fundingFallbackParticipantsWouldCreate +=
        participants.length;
    }

    this.pushDebug(
      context,
      existing ? "fundingFallbackWouldUpdate" : "fundingFallbackWouldCreate",
      {
        icodrops: this.projectDebugIdentity(identity),
        roundName: candidate.roundName,
        dateBucket: candidate.dateBucket,
        raisedAmount: candidate.raisedAmount,
        participants: participants.length,
        canonicalFingerprint: candidate.canonicalFingerprint,
      }
    );

    if (!context.write) return;

    const sourcePolicyWrite =
      await this.fundingService.upsertRoundWithSourcePolicy({
        canonicalProjectId: candidate.canonicalProjectId,
        roundKey: candidate.roundKey,
        roundName: candidate.roundName,
        normalizedRoundName: candidate.normalizedRoundName,
        roundType: candidate.roundType,
        normalizedRoundType: candidate.normalizedRoundType,
        announcedDate: candidate.announcedDate,
        dateBucket: candidate.dateBucket,
        raisedAmount: candidate.raisedAmount,
        raisedCurrency: candidate.raisedCurrency,
        valuation: candidate.valuation,
        tokenPrice: candidate.tokenPrice,
        primarySource: candidate.primarySource,
        sourceType: SOURCE_TYPE,
        sourceId: candidate.sourceId,
        sourceSlug: candidate.sourceSlug,
        sourceUrl: candidate.sourceUrl,
        sourceRefs: candidate.sourceRefs as any,
        confidence: candidate.confidence,
        status: candidate.status,
        canonicalFingerprint: candidate.canonicalFingerprint,
        identityAliases: {
          canonicalFingerprints: this.uniqueStrings([
            candidate.legacyCanonicalFingerprint,
            existing?.canonicalFingerprint,
          ]),
          sourceIds: this.uniqueStrings([
            candidate.legacySourceId,
            existing?.sourceId,
          ]),
          roundKeys: this.uniqueStrings([
            candidate.legacyRoundKey,
            existing?.roundKey,
          ]),
        },
        importMode: "fallback_profile_only",
        metadata: {
          ...candidate.metadata,
          dryRunOnly: false,
          sourcePolicyReason: "icodrops_funding_fallback",
        },
      });

    if (!sourcePolicyWrite.written || !sourcePolicyWrite.result) {
      const reason =
        sourcePolicyWrite.reason === "SOURCE_CONFLICT"
          ? "source_conflict"
          : "source_policy_rejected";
      context.result.roundsSkipped += 1;
      if (sourcePolicyWrite.reason === "SOURCE_CONFLICT") {
        context.result.fundingSkippedBecauseSourceConflict += 1;
      }
      this.recordSkipped(context.result, reason, 1, {
        icodrops: this.projectDebugIdentity(identity),
        canonicalProjectId: this.toIdString(candidate.canonicalProjectId),
        sourceRoundId: candidate.sourceId,
        sourcePolicyAction: sourcePolicyWrite.action,
        currentSourceType: sourcePolicyWrite.lock?.currentSourceType,
        incomingSourceType: SOURCE_TYPE,
      });
      this.pushDebug(context, "sourceConflicts", {
        icodrops: this.projectDebugIdentity(identity),
        canonicalProjectId: this.toIdString(candidate.canonicalProjectId),
        sourceRoundId: candidate.sourceId,
        sourcePolicyReason: sourcePolicyWrite.reason,
        sourcePolicyAction: sourcePolicyWrite.action,
        currentSourceType: sourcePolicyWrite.lock?.currentSourceType,
      });
      return;
    }

    const written = sourcePolicyWrite.result;

    if (written.created) context.result.fundingFallbackCreated += 1;
    else context.result.fundingFallbackUpdated += 1;

    const fundingRoundId = this.toObjectId((written.doc as any)?._id);
    if (!fundingRoundId) {
      if (participants.length) {
        context.result.errors.push({
          sourceDocumentId: identity.sourceDocumentId,
          sourceId: candidate.sourceId,
          message:
            "Funding round write did not return a valid _id; participants were not written.",
        });
      }
      return;
    }

    for (const participant of participants) {
      await this.writeParticipant(
        participant,
        candidate,
        fundingRoundId,
        context.result
      );
    }
  }

  private normalizeRound(
    sourceRound: Record<string, any>,
    index: number,
    identity: ProjectIdentity,
    canonicalProjectId: Types.ObjectId
  ): NormalizedIcodropsRound | null {
    if (!sourceRound || typeof sourceRound !== "object") return null;
    const roundName = cleanFundingString(
      sourceRound.roundName ||
        sourceRound.name ||
        sourceRound.stage ||
        sourceRound.type
    );
    if (!roundName) return null;

    const announcedDate = toFundingDate(
      sourceRound.date ||
        sourceRound.announcedDate ||
        sourceRound.announceDate ||
        sourceRound.closedAt
    );
    const raisedAmount = this.firstNumber(
      sourceRound.raisedAmount,
      sourceRound.amount,
      sourceRound.amountUsd,
      sourceRound.fundsRaised,
      this.parseCurrencyNumber(sourceRound.amountFormatted)
    );
    const investorsCount =
      this.arrayValue(sourceRound.investors).length +
      this.arrayValue(sourceRound.leadInvestors).length;
    const sourceUrl =
      cleanFundingString(sourceRound.sourceUrl || sourceRound.url) ||
      identity.sourceUrl;

    if (
      raisedAmount === undefined &&
      !announcedDate &&
      investorsCount === 0 &&
      !sourceUrl &&
      !sourceRound.evidence
    ) {
      return null;
    }

    const roundType = normalizeFundingRoundType(
      sourceRound.stage || sourceRound.type || roundName
    );
    const normalizedRoundType = cleanFundingString(roundType) || "unknown";
    const normalizedRoundName = normalizeFundingName(roundName);
    const dateBucket = fundingDateBucket(
      announcedDate,
      sourceRound.date || sourceRound.dateBucket
    );
    const valuation = this.firstNumber(
      sourceRound.valuation,
      sourceRound.valuationUsd,
      sourceRound.preValuation,
      this.parseCurrencyNumber(sourceRound.valuationFormatted)
    );
    const tokenPrice = this.firstNumber(
      sourceRound.tokenPrice,
      sourceRound.tokenPriceUsd,
      sourceRound.price,
      this.parseCurrencyNumber(sourceRound.priceFormatted)
    );
    const explicitSourceId = cleanFundingString(
      sourceRound.sourceId ||
        sourceRound.roundId ||
        sourceRound.id ||
        sourceRound.key
    );
    const roundKey = this.buildRoundKey({
      projectKey: this.projectKey(identity),
      sourceId: explicitSourceId,
      normalizedRoundType,
      normalizedRoundName,
      dateBucket,
      raisedAmount,
    });
    const sourceId = explicitSourceId || roundKey;
    const legacyRoundKey = explicitSourceId
      ? undefined
      : this.buildLegacyRoundKey({
          projectKey: this.projectKey(identity),
          normalizedRoundType,
          normalizedRoundName,
          dateBucket,
          raisedAmount,
          index,
        });
    const legacySourceId = legacyRoundKey;
    const sourcePath = `fundraising.rounds.${index}`;
    const sourceRefs = [
      {
        source: SOURCE_TYPE,
        sourceId,
        sourceSlug: identity.sourceSlug,
        sourceUrl,
        sourcePath,
        confidence: "low",
        metadata: {
          sourceCollection: PARSER_COLLECTION,
          sourceDocumentId: identity.sourceDocumentId,
          sourceProjectId: identity.sourceProjectId,
          confidenceReason: "profile_only",
        },
      },
    ];
    const canonicalFingerprint = buildFundingRoundFingerprint({
      canonicalProjectId,
      roundType,
      normalizedRoundType,
      roundName,
      normalizedRoundName,
      announcedDate,
      dateBucket,
      raisedAmount,
      valuation,
      tokenPrice,
      sourceRefs: sourceRefs as any,
      primarySource: SOURCE_TYPE,
      sourceId,
    });
    const legacyCanonicalFingerprint = explicitSourceId
      ? undefined
      : buildLegacyFundingRoundFingerprint({
          canonicalProjectId,
          roundType,
          normalizedRoundType,
          roundName,
          normalizedRoundName,
          announcedDate,
          dateBucket,
          raisedAmount,
          valuation,
          tokenPrice,
          sourceRefs: sourceRefs as any,
          primarySource: SOURCE_TYPE,
          sourceId: legacySourceId,
        });

    return {
      canonicalProjectId,
      projectIdentity: identity,
      sourceIndex: index,
      sourceRound,
      roundName,
      normalizedRoundName,
      roundType,
      normalizedRoundType,
      announcedDate,
      dateBucket,
      raisedAmount,
      raisedCurrency: raisedAmount === undefined ? undefined : "USD",
      valuation,
      tokenPrice,
      primarySource: SOURCE_TYPE,
      sourceId,
      sourceSlug: identity.sourceSlug,
      sourceUrl,
      sourceRefs,
      confidence: "low",
      status: normalizeFundingRoundStatus(sourceRound.status || "proposed"),
      metadata: {
        importer: "fomo-v2:icodrops-funding-fallback",
        sourceCollection: PARSER_COLLECTION,
        sourceDocumentId: identity.sourceDocumentId,
        sourcePath,
        sourceIndex: index,
        importMode: "fallback_profile_only",
        fallback: true,
        isFallback: true,
        confidenceReason: "profile_only",
        profileOnlySource: true,
        saleRoundsDomainWritesBlocked: true,
        dryRunOnly: true,
      },
      roundKey,
      canonicalFingerprint,
      legacyCanonicalFingerprint,
      legacyRoundKey,
      legacySourceId,
      hasProviderSourceId: Boolean(explicitSourceId),
    };
  }

  private async countPrimaryFundingRows(
    canonicalProjectId: Types.ObjectId
  ): Promise<number> {
    const primarySourceMatchers = PRIMARY_FUNDING_SOURCES.map((source) =>
      projectSourceTypeMongoPattern(source)
    );
    const primaryFeedMatchers = PRIMARY_FUNDING_FEEDS.map((source) =>
      projectSourceTypeMongoPattern(source)
    );
    return this.fundingRoundModel.countDocuments({
      canonicalProjectId,
      $or: [
        { primarySource: { $in: primarySourceMatchers } },
        { sourceType: { $in: primarySourceMatchers } },
        { sourceFeed: { $in: primaryFeedMatchers } },
      ],
    });
  }

  private async findExistingFallbackRound(
    candidate: NormalizedIcodropsRound
  ): Promise<Record<string, any> | null> {
    const legacyIdentityGuard = this.legacyRoundIdentityGuard(candidate);
    const sourcePattern = projectSourceTypeMongoPattern(SOURCE_TYPE);
    const exact = await (this.fundingRoundModel as any)
      .findOne({
        $or: [
          { canonicalFingerprint: candidate.canonicalFingerprint },
          ...(candidate.legacyCanonicalFingerprint
            ? [
                {
                  canonicalProjectId: candidate.canonicalProjectId,
                  sourceType: sourcePattern,
                  canonicalFingerprint: candidate.legacyCanonicalFingerprint,
                },
              ]
            : []),
          {
            canonicalProjectId: candidate.canonicalProjectId,
            primarySource: sourcePattern,
            sourceId: candidate.sourceId,
          },
          {
            canonicalProjectId: candidate.canonicalProjectId,
            sourceType: sourcePattern,
            roundKey: candidate.roundKey,
          },
          ...(candidate.legacySourceId
            ? [
                {
                  canonicalProjectId: candidate.canonicalProjectId,
                  primarySource: sourcePattern,
                  sourceId: candidate.legacySourceId,
                },
              ]
            : []),
          ...(candidate.legacyRoundKey
            ? [
                {
                  canonicalProjectId: candidate.canonicalProjectId,
                  sourceType: sourcePattern,
                  roundKey: candidate.legacyRoundKey,
                },
              ]
            : []),
          ...(candidate.announcedDate
            ? [
                {
                  canonicalProjectId: candidate.canonicalProjectId,
                  sourceType: sourcePattern,
                  normalizedRoundType: candidate.normalizedRoundType,
                  announcedDate: candidate.announcedDate,
                  ...legacyIdentityGuard,
                },
              ]
            : []),
        ],
      })
      .lean();
    if (exact || candidate.hasProviderSourceId) return exact;
    return this.findIdlessRoundForReconciliation(candidate);
  }

  /**
   * ICODrops profile rounds sometimes have no provider ID. Their semantic
   * fingerprint is intentionally order-independent, but a parser correction
   * can change it. Reconcile only inside the same parser project and provider;
   * ambiguous candidates fail closed instead of creating another round.
   */
  private async findIdlessRoundForReconciliation(
    candidate: NormalizedIcodropsRound
  ): Promise<Record<string, any> | null> {
    const sourceDocumentId = cleanFundingString(
      candidate.projectIdentity.sourceDocumentId
    );
    if (!sourceDocumentId) return null;
    const rows = await (this.fundingRoundModel as any)
      .find({
        canonicalProjectId: candidate.canonicalProjectId,
        sourceType: projectSourceTypeMongoPattern(SOURCE_TYPE),
        "metadata.importer": "fomo-v2:icodrops-funding-fallback",
        "metadata.sourceDocumentId": sourceDocumentId,
      })
      .limit(100)
      .lean();
    if (!rows?.length) return null;

    const sourcePath = cleanFundingString(candidate.metadata?.sourcePath);
    const samePath = sourcePath
      ? rows.filter(
          (row: any) =>
            cleanFundingString(row?.metadata?.sourcePath) === sourcePath
        )
      : [];
    if (samePath.length === 1) return samePath[0];
    if (samePath.length > 1) {
      throw new Error(
        `Ambiguous ID-less ICODrops funding source path ${sourcePath} for parser document ${sourceDocumentId}; ${samePath.length} rows require review.`
      );
    }

    // A different persisted parser path is a different occurrence. Semantic
    // fallback is reserved for legacy rows written before sourcePath existed.
    const legacyRows = rows.filter(
      (row: any) => !cleanFundingString(row?.metadata?.sourcePath)
    );
    if (!legacyRows.length) return null;

    const sameNameAndType = legacyRows.filter(
      (row: any) =>
        cleanFundingString(row.normalizedRoundName) ===
          cleanFundingString(candidate.normalizedRoundName) &&
        cleanFundingString(row.normalizedRoundType) ===
          cleanFundingString(candidate.normalizedRoundType)
    );
    if (sameNameAndType.length === 1) return sameNameAndType[0];

    const sameTypeAndDate = candidate.announcedDate
      ? legacyRows.filter(
          (row: any) =>
            cleanFundingString(row.normalizedRoundType) ===
              cleanFundingString(candidate.normalizedRoundType) &&
            toFundingDate(row.announcedDate)?.getTime() ===
              candidate.announcedDate?.getTime()
        )
      : [];
    if (sameTypeAndDate.length === 1) return sameTypeAndDate[0];

    if (!sameNameAndType.length && !sameTypeAndDate.length) {
      return null;
    }

    throw new Error(
      `Ambiguous ID-less ICODrops funding round reconciliation for parser document ${sourceDocumentId}; ${legacyRows.length} legacy same-provider rows require review.`
    );
  }

  private legacyRoundIdentityGuard(
    candidate: NormalizedIcodropsRound
  ): Record<string, any> {
    const identityFields = ["sourceId", "roundKey"].filter((field) =>
      Boolean(cleanFundingString((candidate as any)[field]))
    );
    if (!identityFields.length) return {};
    return {
      $and: identityFields.map((field) => ({
        $or: [
          { [field]: { $exists: false } },
          { [field]: null },
          { [field]: "" },
        ],
      })),
    };
  }

  private recordSaleRoundsBlocked(
    context: {
      debug: boolean;
      result: IcodropsFundingFallbackImportResult;
    },
    identity: ProjectIdentity,
    saleRounds: any[]
  ): void {
    if (!saleRounds.length) return;
    context.result.saleRoundsStoredAsProfileOnly += saleRounds.length;
    context.result.saleRoundsDomainWritesBlocked += saleRounds.length;
    this.pushDebug(context, "saleRoundsDomainWritesBlocked", {
      icodrops: this.projectDebugIdentity(identity),
      count: saleRounds.length,
      reason:
        "saleRounds are profile-only evidence and never create domain rows.",
    });
  }

  private recordProfileOnlyEvidenceBlocked(
    context: {
      debug: boolean;
      result: IcodropsFundingFallbackImportResult;
    },
    identity: ProjectIdentity,
    project: Record<string, any>
  ): void {
    const tokenomics = this.tokenomicsFromProject(project);
    if (tokenomics.length) {
      context.result.tokenomicsStoredAsProfileOnly += tokenomics.length;
      this.pushDebug(context, "tokenomicsStoredAsProfileOnly", {
        icodrops: this.projectDebugIdentity(identity),
        count: tokenomics.length,
        reason:
          "ICODrops tokenomics stay on profile/read-model metadata and never create token allocation rows.",
      });
    }

    const vestingEvidence = this.vestingEvidenceFromProject(project);
    if (vestingEvidence.length) {
      context.result.vestingWritesBlocked += vestingEvidence.length;
      this.pushDebug(context, "vestingWritesBlocked", {
        icodrops: this.projectDebugIdentity(identity),
        count: vestingEvidence.length,
        reason: "ICODrops vesting evidence never creates vesting domain rows.",
      });
    }

    const unlockEvidence = this.unlockEvidenceFromProject(project);
    if (unlockEvidence.length) {
      context.result.unlockWritesBlocked += unlockEvidence.length;
      this.pushDebug(context, "unlockWritesBlocked", {
        icodrops: this.projectDebugIdentity(identity),
        count: unlockEvidence.length,
        reason: "ICODrops unlock evidence never creates unlock domain rows.",
      });
    }
  }

  private fundraisingRoundsFromProject(project: Record<string, any>): any[] {
    const raw = project.rawIcoData || {};
    const rounds = this.arrayValue(project.fundraising?.rounds);
    if (rounds.length) return rounds;
    return this.arrayValue(raw.fundraising?.rounds);
  }

  private saleRoundsFromProject(project: Record<string, any>): any[] {
    const raw = project.rawIcoData || {};
    return [
      ...this.arrayValue(project.saleRounds),
      ...this.arrayValue(raw.saleRounds),
      ...this.arrayValue(project.fundraising?.saleRounds),
      ...this.arrayValue(raw.fundraising?.saleRounds),
    ];
  }

  private tokenomicsFromProject(project: Record<string, any>): any[] {
    const raw = project.rawIcoData || {};
    return this.nonEmptyValues([project.tokenomics, raw.tokenomics]);
  }

  private vestingEvidenceFromProject(project: Record<string, any>): any[] {
    const raw = project.rawIcoData || {};
    const tokenomics = [
      ...this.arrayValue(project.tokenomics),
      ...this.arrayValue(raw.tokenomics),
    ];
    return this.nonEmptyValues([
      project.vesting,
      raw.vesting,
      project.vestingSchedule,
      raw.vestingSchedule,
      project.vestingSchedules,
      raw.vestingSchedules,
      ...tokenomics.map((item) => item?.vesting),
      ...tokenomics.map((item) => item?.vestingSchedule),
      ...tokenomics.map((item) => item?.vestingSchedules),
    ]);
  }

  private unlockEvidenceFromProject(project: Record<string, any>): any[] {
    const raw = project.rawIcoData || {};
    const tokenomics = [
      ...this.arrayValue(project.tokenomics),
      ...this.arrayValue(raw.tokenomics),
    ];
    return this.nonEmptyValues([
      project.unlocks,
      raw.unlocks,
      project.unlockEvents,
      raw.unlockEvents,
      ...tokenomics.map((item) => item?.unlocks),
      ...tokenomics.map((item) => item?.unlockEvents),
      ...tokenomics.map((item) => item?.vesting?.unlocks),
      ...tokenomics.map((item) => item?.vesting?.unlockEvents),
    ]);
  }

  private projectIdentity(project: Record<string, any>): ProjectIdentity {
    const raw = project.rawIcoData || {};
    const sourceDocumentId = this.toIdString(project._id);
    const sourceProjectId = cleanFundingString(
      project.sourceProjectId ||
        project.sourceId ||
        project.icodropsId ||
        raw.sourceProjectId ||
        raw.sourceId ||
        raw.icodropsId ||
        sourceDocumentId
    );
    const sourceSlug = this.normalizeSlug(
      project.sourceSlug ||
        project.slug ||
        raw.sourceSlug ||
        raw.slug ||
        sourceProjectId
    );
    return {
      sourceDocumentId,
      sourceProjectId,
      sourceSlug,
      sourceUrl: cleanFundingString(
        project.sourceUrl || project.detailUrl || raw.sourceUrl || raw.detailUrl
      ),
      name: cleanFundingString(project.name || raw.name),
      symbol: cleanFundingString(
        project.symbol || project.ticker || raw.symbol || raw.ticker
      ),
    };
  }

  private parserQuery(): Record<string, any> {
    return {
      $and: [this.sourceQuery(), this.fundraisingRoundsQuery()],
    };
  }

  private sourceQuery(): Record<string, any> {
    return { source: projectSourceTypeMongoPattern(SOURCE_TYPE) };
  }

  private missingSourceQuery(): Record<string, any> {
    return {
      $or: [{ source: { $exists: false } }, { source: null }, { source: "" }],
    };
  }

  private fundraisingRoundsQuery(): Record<string, any> {
    return {
      $or: [
        { "fundraising.rounds.0": { $exists: true } },
        { "rawIcoData.fundraising.rounds.0": { $exists: true } },
      ],
    };
  }

  private emptyResult(
    write: boolean,
    debug: boolean
  ): IcodropsFundingFallbackImportResult {
    const result: IcodropsFundingFallbackImportResult = {
      mode: write ? "write" : "dry-run",
      sourceType: SOURCE_TYPE,
      totalParserProjects: 0,
      projectsWithFundraisingRounds: 0,
      projectsWithFundingMissingSource: 0,
      resolvedCanonicalProjects: 0,
      missingCanonicalProjects: 0,
      fundingSkippedBecausePrimaryExists: 0,
      fundingSkippedBecauseSourceConflict: 0,
      fundingFallbackWouldCreate: 0,
      fundingFallbackWouldUpdate: 0,
      fundingFallbackCreated: 0,
      fundingFallbackUpdated: 0,
      fundingFallbackParticipantsWouldCreate: 0,
      fundingFallbackParticipantsCreated: 0,
      fundingFallbackParticipantsUpdated: 0,
      fundingFallbackParticipantsSkippedMissingBacker: 0,
      ambiguousCanonicalProjectsSkipped: 0,
      roundsFound: 0,
      roundsSkipped: 0,
      saleRoundsStoredAsProfileOnly: 0,
      saleRoundsDomainWritesBlocked: 0,
      tokenomicsStoredAsProfileOnly: 0,
      vestingWritesBlocked: 0,
      unlockWritesBlocked: 0,
      icodropsGenericFundingBlocked: 0,
      skipped: {
        total: 0,
        byReason: {},
      },
      warnings: [],
      errors: [],
    };

    if (debug) {
      result.skipped.examples = [];
      result.debugExamples = {
        missingCanonicalProjects: [],
        primaryFundingExists: [],
        sourceConflicts: [],
        fundingFallbackWouldCreate: [],
        fundingFallbackWouldUpdate: [],
        saleRoundsDomainWritesBlocked: [],
        tokenomicsStoredAsProfileOnly: [],
        vestingWritesBlocked: [],
        unlockWritesBlocked: [],
        ambiguousCanonicalProjects: [],
      };
    }

    return result;
  }

  private recordSkipped(
    result: IcodropsFundingFallbackImportResult,
    reason: string,
    count = 1,
    example?: Record<string, any>
  ): void {
    const amount = Math.max(0, Number(count || 0));
    result.skipped.total += amount;
    result.skipped.byReason[reason] =
      (result.skipped.byReason[reason] || 0) + amount;
    if (
      example &&
      result.skipped.examples &&
      result.skipped.examples.length < DEBUG_LIMIT
    ) {
      result.skipped.examples.push(example);
    }
  }

  private pushDebug(
    context: { debug: boolean; result: IcodropsFundingFallbackImportResult },
    key: string,
    value: Record<string, any>
  ): void {
    const target = context.result.debugExamples?.[key];
    if (!context.debug || !target || target.length >= DEBUG_LIMIT) return;
    target.push(value);
  }

  private buildRoundKey(input: {
    projectKey: string;
    sourceId?: string;
    normalizedRoundType?: string;
    normalizedRoundName?: string;
    dateBucket?: string;
    raisedAmount?: number;
  }): string {
    return [
      SOURCE_TYPE,
      input.projectKey,
      ...(input.sourceId
        ? ["source_id", input.sourceId]
        : [
            "semantic",
            input.normalizedRoundType || "unknown",
            input.dateBucket || "unknown_date",
            this.amountKey(input.raisedAmount),
            input.normalizedRoundName || "unknown_round",
          ]),
    ]
      .map((part) => this.keyPart(part))
      .join(":");
  }

  private buildLegacyRoundKey(input: {
    projectKey: string;
    normalizedRoundType?: string;
    normalizedRoundName?: string;
    dateBucket?: string;
    raisedAmount?: number;
    index: number;
  }): string {
    return [
      SOURCE_TYPE,
      input.projectKey,
      input.normalizedRoundType || "unknown",
      input.dateBucket || "unknown_date",
      this.amountKey(input.raisedAmount),
      input.normalizedRoundName || "unknown_round",
      String(input.index),
    ]
      .map((part) => this.keyPart(part))
      .join(":");
  }

  private projectKey(identity: ProjectIdentity): string {
    return (
      identity.sourceProjectId ||
      identity.sourceSlug ||
      identity.sourceDocumentId ||
      "unknown_project"
    );
  }

  private projectDebugIdentity(identity: ProjectIdentity): Record<string, any> {
    return {
      name: identity.name,
      symbol: identity.symbol,
      slug: identity.sourceSlug,
      sourceUrl: identity.sourceUrl,
      sourceProjectId: identity.sourceProjectId,
    };
  }

  private fallbackAmbiguityReason(
    identity: ProjectIdentity,
    resolved: Record<string, any>
  ): string | undefined {
    const candidateCanonicalIds = this.uniqueStrings(
      this.arrayValue(resolved?.candidates).map(
        (candidate) => candidate?.canonicalProjectId
      )
    );
    if (candidateCanonicalIds.length > 1) {
      return "Resolver returned multiple canonical candidates.";
    }
    if (this.isKnownAmbiguousFallbackIdentity(identity)) {
      return "Known ambiguous ICODrops funding identity requires manual canonical review before fallback writes.";
    }
    return undefined;
  }

  private isKnownAmbiguousFallbackIdentity(identity: ProjectIdentity): boolean {
    return [
      identity.name,
      identity.sourceSlug,
      identity.sourceProjectId,
      identity.sourceUrl,
    ]
      .map((value) => this.keyPart(value))
      .some((value) => value === "kalshi" || value.includes("kalshi"));
  }

  private participantsFromRound(
    sourceRound: Record<string, any>
  ): IcodropsFallbackParticipant[] {
    const byKey = new Map<string, IcodropsFallbackParticipant>();
    const push = (value: any, isLead: boolean) => {
      const participant = this.participantIdentity(value, isLead);
      const key =
        participant.normalizedBackerName ||
        participant.sourceBackerId ||
        participant.sourceBackerSlug ||
        participant.sourceBackerUrl ||
        participant.backerName ||
        "";
      if (!key) return;
      const existing = byKey.get(key);
      if (existing) {
        existing.isLead = existing.isLead || participant.isLead;
        existing.sourceBackerId =
          existing.sourceBackerId || participant.sourceBackerId;
        existing.sourceBackerSlug =
          existing.sourceBackerSlug || participant.sourceBackerSlug;
        existing.sourceBackerUrl =
          existing.sourceBackerUrl || participant.sourceBackerUrl;
        return;
      }
      byKey.set(key, participant);
    };

    for (const investor of this.arrayValue(sourceRound?.investors)) {
      push(investor, false);
    }
    for (const investor of this.arrayValue(sourceRound?.leadInvestors)) {
      push(investor, true);
    }

    return Array.from(byKey.values());
  }

  private participantIdentity(
    value: any,
    isLead: boolean
  ): IcodropsFallbackParticipant {
    const source = value && typeof value === "object" ? value : {};
    const backerName =
      typeof value === "string" || typeof value === "number"
        ? cleanFundingString(value)
        : cleanFundingString(
            source.name ||
              source.backerName ||
              source.investorName ||
              source.title
          );
    return {
      backerName,
      normalizedBackerName: normalizeFundingName(backerName),
      sourceBackerId: cleanFundingString(
        source.sourceBackerId || source.id || source.sourceId
      ),
      sourceBackerSlug: this.normalizeSlug(
        source.sourceBackerSlug || source.slug
      ),
      sourceBackerUrl: cleanFundingString(source.sourceBackerUrl || source.url),
      isLead,
    };
  }

  private async writeParticipant(
    participant: IcodropsFallbackParticipant,
    round: NormalizedIcodropsRound,
    fundingRoundId: Types.ObjectId,
    result: IcodropsFundingFallbackImportResult
  ): Promise<void> {
    const sourceIdentities = this.uniqueStrings([
      participant.sourceBackerId,
      participant.sourceBackerSlug,
    ]);
    let backer: any = null;
    for (const sourceIdentity of sourceIdentities) {
      backer = await this.backerService.findBySourceIdentity(
        SOURCE_TYPE,
        sourceIdentity
      );
      if (backer?._id) break;
    }

    const backerId = this.toObjectId(backer?._id);
    if (!backerId) {
      result.fundingFallbackParticipantsSkippedMissingBacker += 1;
      return;
    }

    const sourceBackerId =
      participant.sourceBackerId ||
      participant.sourceBackerSlug ||
      participant.normalizedBackerName;
    try {
      const written = await this.fundingService.upsertFundingRoundParticipant({
        canonicalProjectId: round.canonicalProjectId,
        fundingRoundId,
        backerId,
        backerName: participant.backerName || backer.name,
        normalizedBackerName:
          participant.normalizedBackerName || backer.normalizedName,
        sourceBackerRef: sourceBackerId
          ? `${SOURCE_TYPE}:${sourceBackerId}`
          : undefined,
        sourceBackerId: participant.sourceBackerId,
        sourceBackerSlug: participant.sourceBackerSlug,
        sourceBackerUrl: participant.sourceBackerUrl,
        role: participant.isLead ? "lead" : "participant",
        isLead: participant.isLead,
        status: "proposed",
        primarySource: SOURCE_TYPE,
        sourceRefs: [
          {
            source: SOURCE_TYPE,
            sourceId: sourceBackerId,
            sourceUrl: participant.sourceBackerUrl,
            sourcePath: round.metadata.sourcePath,
            confidence: "low",
            metadata: {
              sourceCollection: PARSER_COLLECTION,
              sourceDocumentId: round.projectIdentity.sourceDocumentId,
              sourceRoundId: round.sourceId,
              sourceRoundKey: round.roundKey,
            },
          },
        ] as any,
        confidence: "low",
        metadata: {
          importer: "fomo-v2:icodrops-funding-fallback",
          fallback: true,
          isFallback: true,
          sourceRoundId: round.sourceId,
          sourceRoundKey: round.roundKey,
        },
      });
      if (written.created) result.fundingFallbackParticipantsCreated += 1;
      else result.fundingFallbackParticipantsUpdated += 1;
    } catch (error: any) {
      result.errors.push({
        sourceDocumentId: round.projectIdentity.sourceDocumentId,
        sourceRoundId: round.sourceId,
        sourceBackerId,
        backerName: participant.backerName,
        message: error?.message || String(error),
      });
    }
  }

  private parseCurrencyNumber(value: any): number | undefined {
    const text = cleanFundingString(value);
    if (!text) return undefined;
    const normalized = text
      .replace(/,/g, "")
      .replace(/\s+/g, "")
      .replace(/[^0-9.+-]/g, "");
    if (!normalized) return undefined;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : undefined;
  }

  private firstNumber(...values: any[]): number | undefined {
    for (const value of values) {
      if (value === undefined || value === null || value === "") continue;
      const number = Number(value);
      if (Number.isFinite(number)) return number;
    }
    return undefined;
  }

  private amountKey(value: any): string {
    const number = Number(value);
    if (!Number.isFinite(number)) return "unknown_amount";
    return String(Math.round(number));
  }

  private keyPart(value: any): string {
    return (
      String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "unknown"
    );
  }

  private parsePositiveInteger(value: any, fallback: number): number {
    const parsed = Number(value || fallback);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.trunc(parsed);
  }

  private normalizeSlug(value: any): string | undefined {
    const text = cleanFundingString(value);
    if (!text) return undefined;
    const withoutUrl = text.replace(/^https?:\/\/[^/]+\/?/i, "");
    const slug = withoutUrl
      .toLowerCase()
      .replace(/['"]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug || undefined;
  }

  private arrayValue(value: any): any[] {
    if (Array.isArray(value)) return value;
    return value === undefined || value === null ? [] : [value];
  }

  private nonEmptyValues(values: any[]): any[] {
    return values
      .flatMap((value) => this.arrayValue(value))
      .filter((value) => {
        if (value === undefined || value === null || value === "") return false;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === "object") return Object.keys(value).length > 0;
        return true;
      });
  }

  private uniqueStrings(values: any[]): string[] {
    return Array.from(
      new Set(values.map((value) => cleanFundingString(value)).filter(Boolean))
    ) as string[];
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value;
    const text = this.toIdString(value);
    return Types.ObjectId.isValid(text) ? new Types.ObjectId(text) : undefined;
  }

  private toIdString(value: any): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value.toHexString === "function") return value.toHexString();
    if (typeof value.toString === "function") return value.toString();
    return "";
  }
}
