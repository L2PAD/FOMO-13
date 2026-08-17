import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { FomoV2SourceSnapshot } from "../../../models";
import {
  cleanObject,
  dropstabSourceProjectKey,
  dropstabVestingDatasetKey,
  dropstabVestingPayloadHash,
  dropstabVestingProjectIdentity,
  dropstabVestingRelevantPayload,
  dropstabVestingSourceStatePayload,
  normalizeDropstabSourceType,
  toDropstabVestingIdString,
} from "../helpers";
import { FomoV2VestingSourceReaderService } from "./vesting-source-reader.service";
import {
  FomoV2VestingLinkingService,
  FomoV2VestingProjectLinkResult,
} from "./vesting-linking.service";
import { FomoV2ParserControlPolicyService } from "../../parser-control/services/parser-control-policy.service";

const DEBUG_LIMIT = 20;
const SNAPSHOT_SCOPE = "vesting_dataset";

export interface FomoV2VestingSourceSnapshotSyncOptions {
  sourceType?: string;
  limit?: number;
  all?: boolean;
  write?: boolean;
  debug?: boolean;
  sourceSlug?: string;
  sourceProjectKey?: string;
  canonicalProjectId?: string;
}

export interface FomoV2VestingSourceSnapshotSyncResult {
  runner: "fomo-v2:vesting-source-snapshot-sync";
  mode: "dry-run" | "write";
  dbName: string;
  parserDbName: string;
  generatedAt: string;
  sourceType: string;
  scannedParserDocs: number;
  eligibleDocs: number;
  skippedByFilter: number;
  sourceSnapshotsWouldCreate: number;
  sourceSnapshotsWouldReuse: number;
  sourceSnapshotsCreated: number;
  sourceSnapshotsReused: number;
  sourceEntitiesWouldCreate: number;
  sourceEntitiesWouldUpdate: number;
  sourceEntitiesCreated: number;
  sourceEntitiesUpdated: number;
  linkedCanonicalProjects: number;
  sourceOnlyProjects: number;
  ambiguousMatches: number;
  aliasMismatches: number;
  reviewWorthyCases: number;
  beforeCounts: Record<string, number>;
  afterCounts: Record<string, number>;
  examples?: Record<string, Array<Record<string, any>>>;
  warnings: string[];
  errors: Array<Record<string, any>>;
  READ_ONLY?: "YES";
  WRITES_PERFORMED: number;
}

@Injectable()
export class FomoV2VestingSourceSnapshotSyncService {
  constructor(
    private readonly configService: ConfigService,
    private readonly sourceReader: FomoV2VestingSourceReaderService,
    private readonly linkingService: FomoV2VestingLinkingService,
    @InjectModel(FomoV2SourceSnapshot.name)
    private readonly sourceSnapshotModel: Model<FomoV2SourceSnapshot>,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService
  ) {}

  async run(
    options: FomoV2VestingSourceSnapshotSyncOptions = {}
  ): Promise<FomoV2VestingSourceSnapshotSyncResult> {
    const sourceType = normalizeDropstabSourceType(options.sourceType);
    const write = Boolean(options.write);
    if (write && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        `vesting:${sourceType}`
      );
    }
    const limit = options.all
      ? undefined
      : this.parsePositiveInteger(options.limit, 100);
    const result = this.emptyResult(sourceType, write, Boolean(options.debug));
    result.beforeCounts = await this.sourceLayerCounts(sourceType);
    result.eligibleDocs = await this.sourceReader.countEligible({
      sourceType,
      sourceSlug: options.sourceSlug,
      sourceProjectKey: options.sourceProjectKey,
    });

    const cursor = this.sourceReader.findEligible({
      sourceType,
      sourceSlug: options.sourceSlug,
      sourceProjectKey: options.sourceProjectKey,
      limit,
      all: options.all,
    });

    for await (const sourceProject of cursor as any) {
      await this.processSourceProject(sourceProject, options, result);
    }

    result.afterCounts = write
      ? await this.sourceLayerCounts(sourceType)
      : result.beforeCounts;
    if (!write) result.READ_ONLY = "YES";
    return result;
  }

  private async processSourceProject(
    sourceProject: Record<string, any>,
    options: FomoV2VestingSourceSnapshotSyncOptions,
    result: FomoV2VestingSourceSnapshotSyncResult
  ): Promise<void> {
    const sourceType = result.sourceType;
    const identity = dropstabVestingProjectIdentity(sourceProject);
    result.scannedParserDocs += 1;

    try {
      const link = await this.linkingService.resolveProject(
        sourceProject,
        sourceType
      );
      if (
        options.canonicalProjectId &&
        link.canonicalProjectIdString !== options.canonicalProjectId
      ) {
        result.skippedByFilter += 1;
        return;
      }
      this.recordLinkCounters(result, link);

      if (link.status !== "linked" || !link.canonicalProjectId) {
        this.pushExample(result, "snapshots", {
          action: "skip_unlinked",
          sourceSlug: identity.sourceSlug,
          sourceProjectKey: dropstabSourceProjectKey(identity),
          linkStatus: link.status,
          reason: link.reason,
        });
        return;
      }

      const sourceId = dropstabVestingDatasetKey({
        canonicalProjectId: link.canonicalProjectId,
        sourceType,
      });
      const relevantPayload = dropstabVestingRelevantPayload(
        sourceProject,
        SNAPSHOT_SCOPE
      );
      const payloadHash = dropstabVestingPayloadHash(relevantPayload);
      const statePayload = dropstabVestingSourceStatePayload({
        sourceProject,
        sourceType,
        canonicalProjectId: link.canonicalProjectId,
        importStatus: "ready",
        linkStatus: link.status,
        matchedBy: link.matchedBy,
        scope: SNAPSHOT_SCOPE,
      });

      const existingSnapshot = await this.sourceSnapshotModel
        .findOne({
          source: sourceType,
          sourceEntityType: "project",
          sourceId,
          payloadHash,
        })
        .lean();

      if (existingSnapshot) result.sourceSnapshotsWouldReuse += 1;
      else result.sourceSnapshotsWouldCreate += 1;

      if (!options.write) {
        this.pushExample(result, "snapshots", {
          action: existingSnapshot ? "reuse" : "create",
          sourceSlug: identity.sourceSlug,
          sourceProjectKey: dropstabSourceProjectKey(identity),
          canonicalProjectId: link.canonicalProjectIdString,
          vestingDatasetKey: sourceId,
          payloadHash,
          payloadMode: "lightweight_source_state",
          linkStatus: link.status,
        });
        return;
      }

      const snapshot = await this.upsertSourceSnapshot({
        sourceType,
        sourceId,
        identity,
        statePayload,
        payloadHash,
        link,
      });

      if (snapshot.created) {
        result.sourceSnapshotsCreated += 1;
        result.WRITES_PERFORMED += 1;
      } else {
        result.sourceSnapshotsReused += 1;
      }
      this.pushExample(result, "snapshots", {
        action: snapshot.created ? "created" : "reused",
        sourceSlug: identity.sourceSlug,
        sourceProjectKey: dropstabSourceProjectKey(identity),
        canonicalProjectId: link.canonicalProjectIdString,
        sourceSnapshotId: toDropstabVestingIdString((snapshot.doc as any)?._id),
        vestingDatasetKey: sourceId,
        payloadHash,
        payloadMode: "lightweight_source_state",
        linkStatus: link.status,
      });
    } catch (error: any) {
      result.errors.push({
        sourceSlug: identity.sourceSlug,
        sourceProjectKey: dropstabSourceProjectKey(identity),
        message: error?.message || String(error),
      });
    }
  }

  private async upsertSourceSnapshot(input: {
    sourceType: string;
    sourceId: string;
    identity: ReturnType<typeof dropstabVestingProjectIdentity>;
    statePayload: Record<string, any>;
    payloadHash: string;
    link: FomoV2VestingProjectLinkResult;
  }): Promise<{ doc: any; created: boolean }> {
    const raw = await (this.sourceSnapshotModel as any).findOneAndUpdate(
      {
        source: input.sourceType,
        sourceEntityType: "project",
        sourceId: input.sourceId,
        payloadHash: input.payloadHash,
      },
      {
        $setOnInsert: cleanObject({
          source: input.sourceType,
          sourceEntityType: "project",
          sourceId: input.sourceId,
          sourceSlug: input.identity.sourceSlug,
          sourceUrl: input.identity.sourceUrl,
          payloadHash: input.payloadHash,
          rawPayload: input.statePayload,
          normalizedPreview: {
            name: input.identity.name,
            normalizedName: input.identity.normalizedName,
            symbol: input.identity.symbol,
            normalizedSymbol: input.identity.normalizedSymbol,
            providerIds: {
              coingeckoId: input.identity.coingeckoId,
              dropstabId: input.identity.sourceProjectId || input.identity.sourceId,
            },
            blockCounts: input.statePayload.blockCounts,
          },
          capturedAt: new Date(),
          metadata: {
            domain: "vesting",
            scope: SNAPSHOT_SCOPE,
            payloadMode: "lightweight_source_state",
            importer: "fomo-v2:vesting-source-snapshot-sync",
            sourceDocumentId: input.identity.sourceDocumentId,
            sourceProjectKey: dropstabSourceProjectKey(input.identity),
            canonicalProjectId: input.link.canonicalProjectIdString,
            relevantDataHash: input.statePayload.relevantDataHash,
            projectLinkStatus: input.link.status,
            matchedBy: input.link.matchedBy,
            reason: input.link.reason,
          },
        }),
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        rawResult: true,
      }
    );
    return {
      doc: raw?.value || raw,
      created: Boolean(raw?.lastErrorObject?.upserted),
    };
  }

  private recordLinkCounters(
    result: FomoV2VestingSourceSnapshotSyncResult,
    link: FomoV2VestingProjectLinkResult
  ): void {
    if (link.status === "linked") result.linkedCanonicalProjects += 1;
    if (link.status === "source_only") result.sourceOnlyProjects += 1;
    if (link.status === "ambiguous") {
      result.ambiguousMatches += 1;
      result.reviewWorthyCases += 1;
    }
    if (link.status === "alias_mismatch") {
      result.aliasMismatches += 1;
      result.reviewWorthyCases += 1;
    }
  }

  private async sourceLayerCounts(sourceType: string): Promise<Record<string, number>> {
    const sourceSnapshots = await this.sourceSnapshotModel.countDocuments({
      source: sourceType,
      sourceEntityType: "project",
      "metadata.domain": "vesting",
    });
    return { sourceSnapshots };
  }

  private emptyResult(
    sourceType: string,
    write: boolean,
    debug: boolean
  ): FomoV2VestingSourceSnapshotSyncResult {
    const result: FomoV2VestingSourceSnapshotSyncResult = {
      runner: "fomo-v2:vesting-source-snapshot-sync",
      mode: write ? "write" : "dry-run",
      dbName: this.dbName(),
      parserDbName: this.parserDbName(),
      generatedAt: new Date().toISOString(),
      sourceType,
      scannedParserDocs: 0,
      eligibleDocs: 0,
      skippedByFilter: 0,
      sourceSnapshotsWouldCreate: 0,
      sourceSnapshotsWouldReuse: 0,
      sourceSnapshotsCreated: 0,
      sourceSnapshotsReused: 0,
      sourceEntitiesWouldCreate: 0,
      sourceEntitiesWouldUpdate: 0,
      sourceEntitiesCreated: 0,
      sourceEntitiesUpdated: 0,
      linkedCanonicalProjects: 0,
      sourceOnlyProjects: 0,
      ambiguousMatches: 0,
      aliasMismatches: 0,
      reviewWorthyCases: 0,
      beforeCounts: {},
      afterCounts: {},
      warnings: [
        "Vesting source sync writes lightweight source state only; source_entities and raw parser payload snapshots are not used.",
      ],
      errors: [],
      WRITES_PERFORMED: 0,
    };
    if (debug) result.examples = { snapshots: [] };
    return result;
  }

  private pushExample(
    result: FomoV2VestingSourceSnapshotSyncResult,
    key: string,
    value: Record<string, any>
  ): void {
    const examples = result.examples?.[key];
    if (!examples || examples.length >= DEBUG_LIMIT) return;
    examples.push(value);
  }

  private parsePositiveInteger(value: any, fallback: number): number {
    const number = Number(value ?? fallback);
    if (!Number.isFinite(number) || number <= 0) return fallback;
    return Math.trunc(number);
  }

  private dbName(): string {
    return (
      String(this.configService.get("DB_NAME") || process.env.DB_NAME || "fomoland").trim() ||
      "fomoland"
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
