import { Injectable, Optional } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model, Types } from "mongoose";
import { FomoV2SourceSnapshot } from "../../../models";
import { normalizeProjectSourceType } from "../../../shared/source-policy";
import {
  buildActivitySourceKey,
  hashActivityPayload,
  normalizeActivitySlug,
  sanitizeActivityContent,
} from "../helpers";
import { FomoV2Activity, FomoV2ActivityDocument } from "../models";
import { FomoV2ParserControlPolicyService } from "../../parser-control/services/parser-control-policy.service";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;
const SCAN_PAGE_SIZE = 100;
const MAX_AUDIT_ENTRIES = 200;
const OBSOLETE_GLOBAL_PARSER_INDEX = "uniq_activities_parser_id";
const REMEDIATION_ACTOR = "system:activity-source-split";
const SUPPORTED_SPLIT_PROVIDERS = new Set(["dropstab", "icodrops"]);

export interface FomoV2ActivitySourceSplitOptions {
  write?: boolean;
  confirmWrite?: boolean;
  all?: boolean;
  allConfirmed?: boolean;
  limit?: number;
  cursor?: string;
}

export interface FomoV2ActivityProviderPartition {
  provider: string;
  parserActivityId: string;
  sourceKeys: string[];
  sources: Record<string, any>[];
  sourceSnapshotIds: any[];
  currentDraft: Record<string, any>;
  latestSnapshotId: string;
  latestSnapshotAt: string;
}

export interface FomoV2ActivitySourceSplitPlan {
  activityId: string;
  slug: string;
  providers: string[];
  keeperProvider: string;
  previousPublicationStatus: string;
  partitions: FomoV2ActivityProviderPartition[];
  clones: Array<{ provider: string; slug: string }>;
  errors: string[];
}

export interface FomoV2ActivitySourceSplitPreflight {
  topology: "replica-set" | "mongos";
  obsoleteGlobalParserIndexPresent: false;
}

export interface FomoV2ActivitySourceSplitItemResult {
  activityId: string;
  slug?: string;
  providers?: string[];
  keeperProvider?: string;
  previousPublicationStatus?: string;
  clones?: Array<{ provider: string; slug: string }>;
  provenance?: Array<{
    provider: string;
    latestSnapshotId: string;
    latestSnapshotAt: string;
  }>;
  status: "planned" | "applied" | "already-remediated" | "error";
  errors: string[];
}

@Injectable()
export class FomoV2ActivitySourceSplitRemediationService {
  constructor(
    @InjectConnection()
    private readonly connection: Connection,
    @InjectModel(FomoV2Activity.name)
    private readonly activityModel: Model<FomoV2ActivityDocument>,
    @InjectModel(FomoV2SourceSnapshot.name)
    private readonly sourceSnapshotModel: Model<FomoV2SourceSnapshot>,
    @Optional()
    private readonly parserControlPolicy?: FomoV2ParserControlPolicyService
  ) {}

  async run(options: FomoV2ActivitySourceSplitOptions = {}) {
    const normalized = normalizeOptions(options);
    if (normalized.write && this.parserControlPolicy) {
      await this.parserControlPolicy.assertDomainWriteAllowed(
        "activities:split-remediation"
      );
    }
    const preflight = normalized.write
      ? await this.assertWritePreconditions()
      : undefined;
    const items: FomoV2ActivitySourceSplitItemResult[] = [];
    let scanned = 0;
    let afterId: any = normalized.cursor;
    let exhausted = false;
    let stoppedAtLimit = false;

    scan: while (!exhausted) {
      const activities = await this.findCandidatePage(afterId, SCAN_PAGE_SIZE);
      if (!activities.length) {
        exhausted = true;
        break;
      }

      for (const activity of activities) {
        scanned += 1;
        afterId = activity?._id;
        const activityId = idString(activity?._id);
        try {
          const snapshots = await this.loadSnapshots(
            activity?.sourceSnapshotIds || []
          );
          const plan = buildActivitySourceSplitPlan(activity, snapshots);
          if (!plan) continue;

          if (plan.errors.length) {
            items.push(planErrorResult(plan));
          } else if (!normalized.write) {
            items.push({
              ...planSummary(plan),
              status: "planned",
              errors: [],
            });
          } else {
            items.push(await this.applyOne(activityId));
          }
        } catch (error: any) {
          items.push({
            activityId,
            slug: activity?.slug,
            status: "error",
            errors: [safeErrorMessage(error)],
          });
        }

        if (!normalized.all && items.length >= normalized.limit) {
          stoppedAtLimit = true;
          break scan;
        }
      }

      if (activities.length < SCAN_PAGE_SIZE) exhausted = true;
    }

    const errors = items
      .filter((item) => item.status === "error")
      .map((item) => ({ activityId: item.activityId, errors: item.errors }));

    return {
      mode: normalized.write ? "write" : "dry-run",
      generatedAt: new Date().toISOString(),
      scope: normalized.all ? "all" : "bounded",
      limit: normalized.all ? undefined : normalized.limit,
      cursor: normalized.cursor ? idString(normalized.cursor) : undefined,
      scanned,
      mixed: items.length,
      planned: items.filter((item) => item.status === "planned").length,
      applied: items.filter((item) => item.status === "applied").length,
      alreadyRemediated: items.filter(
        (item) => item.status === "already-remediated"
      ).length,
      failed: errors.length,
      hasMore: stoppedAtLimit,
      nextCursor: stoppedAtLimit ? idString(afterId) : undefined,
      preflight,
      errors,
      items,
      sourceSnapshotsDeleted: 0,
      clonesPublished: 0,
    };
  }

  /**
   * A split is only safe on a transaction-capable topology and after the old
   * globally unique parserActivityId index has been removed by the controlled
   * index migration.
   */
  async assertWritePreconditions(): Promise<FomoV2ActivitySourceSplitPreflight> {
    const indexes = await this.activityModel.collection.listIndexes().toArray();
    if (
      indexes.some(
        (index: Record<string, any>) =>
          String(index?.name || "") === OBSOLETE_GLOBAL_PARSER_INDEX
      )
    ) {
      throw new Error(
        `Refusing activity source split while obsolete index ${OBSOLETE_GLOBAL_PARSER_INDEX} exists. Run the controlled FOMO v2 index migration first.`
      );
    }

    if (
      typeof this.connection?.startSession !== "function" ||
      !this.connection?.db
    ) {
      throw new Error(
        "Refusing activity source split: MongoDB transactions are unavailable."
      );
    }

    let hello: Record<string, any>;
    try {
      hello = await this.connection.db.admin().command({ hello: 1 });
    } catch (error: any) {
      throw new Error(
        `Refusing activity source split: transaction topology could not be verified (${safeErrorMessage(
          error
        )}).`
      );
    }

    const topology =
      hello?.msg === "isdbgrid"
        ? "mongos"
        : hello?.setName
        ? "replica-set"
        : undefined;
    if (!topology) {
      throw new Error(
        "Refusing activity source split: MongoDB is not a replica set or mongos, so atomic transactions are unavailable."
      );
    }

    return {
      topology,
      obsoleteGlobalParserIndexPresent: false,
    };
  }

  private async findCandidatePage(afterId: any, limit: number) {
    const identityFilter = afterId ? { _id: { $gt: afterId } } : {};
    return this.activityModel
      .find({
        ...identityFilter,
        $or: [
          { "sources.0": { $exists: true } },
          { "sourceKeys.0": { $exists: true } },
          { "sourceSnapshotIds.0": { $exists: true } },
        ],
      })
      .sort({ _id: 1 })
      .limit(limit)
      .lean()
      .exec();
  }

  private async loadSnapshots(snapshotIds: any[], session?: any) {
    let query: any = this.sourceSnapshotModel
      .find({ _id: { $in: snapshotIds || [] } })
      .lean();
    if (session) query = query.session(session);
    return query.exec();
  }

  private async applyOne(
    activityId: string
  ): Promise<FomoV2ActivitySourceSplitItemResult> {
    const session = await this.connection.startSession();
    if (!session || typeof session.withTransaction !== "function") {
      if (session && typeof session.endSession === "function") {
        await session.endSession();
      }
      throw new Error(
        "Refusing activity source split: MongoDB transaction session is unavailable."
      );
    }
    let item: FomoV2ActivitySourceSplitItemResult | undefined;
    try {
      await session.withTransaction(
        async () => {
          const activity = await this.activityModel
            .findById(activityId)
            .session(session)
            .lean()
            .exec();
          if (!activity) {
            throw new Error("Activity no longer exists.");
          }

          const snapshots = await this.loadSnapshots(
            activity.sourceSnapshotIds || [],
            session
          );
          const plan = buildActivitySourceSplitPlan(activity, snapshots);
          if (!plan) {
            item = {
              activityId,
              slug: activity.slug,
              status: "already-remediated",
              errors: [],
            };
            return;
          }
          if (plan.errors.length) {
            throw new Error(plan.errors.join(" "));
          }

          await this.assertNoIdentityCollisions(plan, activity._id, session);
          const keeper = partitionFor(plan, plan.keeperProvider);
          const nextRevision = Number(activity.revision || 0) + 1;
          const keeperUpdate = await this.activityModel.updateOne(
            { _id: activity._id, revision: activity.revision },
            {
              $set: {
                parserActivityId: keeper.parserActivityId,
                sourceKeys: keeper.sourceKeys,
                sources: keeper.sources,
                sourceSnapshotIds: keeper.sourceSnapshotIds,
                currentDraft: keeper.currentDraft,
                publicationStatus: "draft",
                reviewStatus: "pending_human",
                manualOverrideFields: [],
                aiProposals: [],
                isSponsored: false,
                sponsoredPriority: 0,
              },
              $unset: {
                publishedSnapshot: 1,
                publishedMetadata: 1,
                publicationStatusBeforeHide: 1,
                publishedAt: 1,
                publishedBy: 1,
                hiddenAt: 1,
                hiddenBy: 1,
                hiddenReason: 1,
                reviewedAt: 1,
                reviewedBy: 1,
                rejectedAt: 1,
                rejectedBy: 1,
                rejectedReason: 1,
                importCandidateId: 1,
                reviewBatchId: 1,
              },
              $inc: { revision: 1 },
              $push: {
                auditTrail: {
                  $each: [keeperAuditEntry(plan, nextRevision)],
                  $slice: -MAX_AUDIT_ENTRIES,
                },
              },
            },
            { session, runValidators: true }
          );
          if (Number(keeperUpdate?.matchedCount || 0) !== 1) {
            throw new Error(
              "Activity changed during remediation; transaction was aborted."
            );
          }

          const clones = plan.clones.map((clone) =>
            clonePayload(
              activity,
              partitionFor(plan, clone.provider),
              clone.slug,
              plan.activityId
            )
          );
          if (clones.length) {
            await this.activityModel.create(clones, { session });
          }

          item = {
            ...planSummary(plan),
            status: "applied",
            errors: [],
          };
        },
        {
          readConcern: { level: "snapshot" },
          writeConcern: { w: "majority" },
        }
      );
    } finally {
      if (typeof session.endSession === "function") await session.endSession();
    }

    if (!item) {
      throw new Error("Activity source split transaction returned no result.");
    }
    return item;
  }

  private async assertNoIdentityCollisions(
    plan: FomoV2ActivitySourceSplitPlan,
    originalActivityId: any,
    session: any
  ) {
    const cloneSlugs = plan.clones.map((clone) => clone.slug);
    const sourceKeys = plan.partitions.flatMap(
      (partition) => partition.sourceKeys
    );
    const collision = await this.activityModel
      .findOne({
        _id: { $ne: originalActivityId },
        $or: [
          ...(cloneSlugs.length ? [{ slug: { $in: cloneSlugs } }] : []),
          ...(sourceKeys.length ? [{ sourceKeys: { $in: sourceKeys } }] : []),
        ],
      })
      .session(session)
      .lean()
      .exec();
    if (collision) {
      throw new Error(
        `Deterministic split identity collides with activity ${idString(
          collision._id
        )}; no changes were made.`
      );
    }
  }
}

/** Pure planner used by dry-run and repeated inside the write transaction. */
export function buildActivitySourceSplitPlan(
  activity: Record<string, any>,
  snapshots: Record<string, any>[]
): FomoV2ActivitySourceSplitPlan | null {
  const activityId = idString(activity?._id);
  const slug = normalizeActivitySlug(activity?.slug || "");
  const errors: string[] = [];
  const sources = Array.isArray(activity?.sources) ? activity.sources : [];
  const sourceKeys = Array.isArray(activity?.sourceKeys)
    ? activity.sourceKeys
    : [];
  const snapshotIds = Array.isArray(activity?.sourceSnapshotIds)
    ? activity.sourceSnapshotIds
    : [];
  const snapshotById = new Map(
    (snapshots || []).map((snapshot) => [idString(snapshot?._id), snapshot])
  );

  const sourceProviders = sources
    .map((source) => normalizeProjectSourceType(source?.source))
    .filter(Boolean);
  const parsedKeys = sourceKeys.map(parseSourceKey);
  const snapshotProviders = snapshots
    .map((snapshot) => normalizeProjectSourceType(snapshot?.source))
    .filter(Boolean);
  const providers = Array.from(
    new Set([
      ...sourceProviders,
      ...parsedKeys.map((key) => key.provider).filter(Boolean),
      ...snapshotProviders,
    ])
  ).sort();

  if (providers.length <= 1) return null;
  const unsupportedProviders = providers.filter(
    (provider) => !SUPPORTED_SPLIT_PROVIDERS.has(provider)
  );
  if (unsupportedProviders.length) {
    errors.push(
      `Controlled activity split supports only dropstab/icodrops; unsupported providers: ${unsupportedProviders.join(
        ", "
      )}.`
    );
  }
  if (!activityId) errors.push("Activity _id is missing.");
  if (!slug) errors.push("Activity slug is missing or invalid.");
  if (
    !activity?.canonicalResolution ||
    typeof activity.canonicalResolution !== "object"
  ) {
    errors.push("Activity canonicalResolution is missing.");
  }
  if (!activity?.currentDraft || typeof activity.currentDraft !== "object") {
    errors.push("Activity currentDraft is missing.");
  }
  sources.forEach((source, index) => {
    if (!normalizeProjectSourceType(source?.source)) {
      errors.push(`sources[${index}] has no canonical provider.`);
    }
  });
  parsedKeys.forEach((key, index) => {
    if (!key.provider || !key.sourceId) {
      errors.push(`sourceKeys[${index}] is not a provider:id identity.`);
    }
  });
  snapshots.forEach((snapshot, index) => {
    if (!normalizeProjectSourceType(snapshot?.source)) {
      errors.push(
        `snapshot ${
          idString(snapshot?._id) || index
        } has no canonical provider.`
      );
    }
    if (snapshot?.sourceEntityType !== "activity") {
      errors.push(
        `snapshot ${
          idString(snapshot?._id) || index
        } is not an activity snapshot.`
      );
    }
  });
  for (const snapshotId of snapshotIds) {
    if (!snapshotById.has(idString(snapshotId))) {
      errors.push(`Source snapshot ${idString(snapshotId)} is missing.`);
    }
  }
  if (snapshots.length !== snapshotIds.length) {
    errors.push("Source snapshot references are incomplete or duplicated.");
  }

  const partitions = providers.map((provider) =>
    buildProviderPartition(
      provider,
      activity,
      sources,
      parsedKeys,
      snapshotIds,
      snapshotById,
      errors
    )
  );
  const keeperProvider =
    [...partitions].sort(comparePartitionProvenance)[0]?.provider ||
    providers[0];
  const suffix = hashActivityPayload({ activityId }).slice(0, 10);
  const clones = providers
    .filter((provider) => provider !== keeperProvider)
    .map((provider) => ({
      provider,
      slug: deterministicCloneSlug(slug || "activity", provider, suffix),
    }));

  return {
    activityId,
    slug,
    providers,
    keeperProvider,
    previousPublicationStatus:
      cleanString(activity?.publicationStatus) || "unknown",
    partitions,
    clones,
    errors: Array.from(new Set(errors)),
  };
}

function buildProviderPartition(
  provider: string,
  activity: Record<string, any>,
  sources: Record<string, any>[],
  parsedKeys: ParsedSourceKey[],
  snapshotIds: any[],
  snapshotById: Map<string, Record<string, any>>,
  errors: string[]
): FomoV2ActivityProviderPartition {
  const providerSources: Record<string, any>[] = sources
    .filter((source) => normalizeProjectSourceType(source?.source) === provider)
    .map((source) => ({ ...source, source: provider }));
  const providerKeys = parsedKeys.filter((key) => key.provider === provider);
  const providerSnapshots = snapshotIds
    .map((id) => ({ id, snapshot: snapshotById.get(idString(id)) }))
    .filter(
      (entry) =>
        entry.snapshot &&
        normalizeProjectSourceType(entry.snapshot.source) === provider
    );

  if (!providerSnapshots.length) {
    errors.push(`Provider ${provider} has no linked source snapshot.`);
  }
  providerSources.forEach((source, index) => {
    if (!isValidDateValue(source?.lastSeenAt)) {
      errors.push(
        `Provider ${provider} sources[${index}] has no lastSeenAt timestamp.`
      );
    }
  });
  providerSnapshots.forEach(({ snapshot }) => {
    if (!Number.isFinite(snapshotTimestamp(snapshot))) {
      errors.push(
        `Provider ${provider} snapshot ${idString(
          snapshot?._id
        )} has no capture timestamp.`
      );
    }
  });

  const activityIds = uniqueStrings([
    ...providerSources.map((source) => source?.sourceId),
    ...providerKeys.map((key) => key.sourceId),
  ]);
  const activitySlugs = uniqueStrings(
    providerSources.map((source) => source?.sourceSlug)
  );
  const snapshotIdsStrong = uniqueStrings(
    providerSnapshots.map((entry) => entry.snapshot?.sourceId)
  );
  const snapshotSlugs = uniqueStrings(
    providerSnapshots.map((entry) => entry.snapshot?.sourceSlug)
  );
  if (!activityIds.length && !activitySlugs.length) {
    errors.push(`Provider ${provider} has no activity identity.`);
  }
  if (!snapshotIdsStrong.length && !snapshotSlugs.length) {
    errors.push(`Provider ${provider} snapshots have no stable identity.`);
  }
  const identityMatches =
    activityIds.length && snapshotIdsStrong.length
      ? intersects(activityIds, snapshotIdsStrong)
      : intersects(activitySlugs, snapshotSlugs);
  if (!identityMatches) {
    errors.push(
      `Provider ${provider} activity identity does not match its snapshots.`
    );
  }

  const normalizedSources = providerSources.length
    ? dedupeSources(providerSources)
    : synthesizeSources(provider, providerSnapshots);
  const allIds = uniqueStrings([...activityIds, ...snapshotIdsStrong]);
  const normalizedKeys = uniqueStrings([
    ...providerKeys.map((key) =>
      buildActivitySourceKey(provider, key.sourceId)
    ),
    ...allIds.map((sourceId) => buildActivitySourceKey(provider, sourceId)),
  ]);
  if (!normalizedKeys.length) {
    errors.push(`Provider ${provider} has no source key.`);
  }

  const currentParserId = cleanString(
    activity?.parserActivityId
  )?.toLowerCase();
  const parserActivityId =
    (currentParserId && allIds.includes(currentParserId)
      ? currentParserId
      : allIds[0]) || "";
  if (!parserActivityId) {
    errors.push(`Provider ${provider} has no parser activity id.`);
  }

  const latestSnapshot = [...providerSnapshots].sort((left, right) =>
    compareSnapshotProvenance(left.snapshot, right.snapshot)
  )[0]?.snapshot;
  const latestSnapshotAt = snapshotTimestamp(latestSnapshot);
  const normalizedPreview = latestSnapshot?.normalizedPreview;
  if (!isNonEmptyRecord(normalizedPreview)) {
    errors.push(
      `Provider ${provider} latest snapshot ${idString(
        latestSnapshot?._id
      )} has no normalizedPreview for a provider-scoped draft.`
    );
  }

  return {
    provider,
    parserActivityId,
    sourceKeys: normalizedKeys,
    sources: normalizedSources,
    sourceSnapshotIds: providerSnapshots.map((entry) => entry.id),
    currentDraft: isNonEmptyRecord(normalizedPreview)
      ? (sanitizeActivityContent(normalizedPreview as any) as Record<
          string,
          any
        >)
      : {},
    latestSnapshotId: idString(latestSnapshot?._id),
    latestSnapshotAt: latestSnapshotAt
      ? new Date(latestSnapshotAt).toISOString()
      : "",
  };
}

function clonePayload(
  activity: Record<string, any>,
  partition: FomoV2ActivityProviderPartition,
  slug: string,
  originalActivityId: string
) {
  return {
    slug,
    parserActivityId: partition.parserActivityId,
    sourceKeys: partition.sourceKeys,
    sources: partition.sources,
    sourceSnapshotIds: partition.sourceSnapshotIds,
    canonicalProjectId: activity.canonicalProjectId,
    canonicalResolution: activity.canonicalResolution,
    lifecycleStatus: activity.lifecycleStatus || "upcoming",
    reviewStatus: "pending_human",
    publicationStatus: "draft",
    accessTier: activity.accessTier || "public",
    isSponsored: false,
    sponsoredPriority: 0,
    currentDraft: partition.currentDraft,
    manualOverrideFields: [],
    aiProposals: [],
    revision: 1,
    auditTrail: [
      {
        action: "edit",
        actor: REMEDIATION_ACTOR,
        at: new Date(),
        revision: 1,
        changedFields: [
          "slug",
          "parserActivityId",
          "sources",
          "sourceKeys",
          "sourceSnapshotIds",
          "currentDraft",
          "publicationStatus",
          "reviewStatus",
          "manualOverrideFields",
          "aiProposals",
        ],
        note: `Controlled source split from activity ${originalActivityId}; provider ${partition.provider} rebuilt from snapshot ${partition.latestSnapshotId} (${partition.latestSnapshotAt}); clone forced to draft for human review.`,
      },
    ],
  };
}

function keeperAuditEntry(
  plan: FomoV2ActivitySourceSplitPlan,
  revision: number
) {
  return {
    action: "edit",
    actor: REMEDIATION_ACTOR,
    at: new Date(),
    revision,
    changedFields: [
      "parserActivityId",
      "sources",
      "sourceKeys",
      "sourceSnapshotIds",
      "currentDraft",
      "publicationStatus",
      "reviewStatus",
      "manualOverrideFields",
      "aiProposals",
    ],
    note: `Controlled source split kept provider ${
      plan.keeperProvider
    } from snapshot ${
      partitionFor(plan, plan.keeperProvider).latestSnapshotId
    }; detached ${plan.providers
      .filter((provider) => provider !== plan.keeperProvider)
      .join(", ")} into draft review rows; publication status ${
      plan.previousPublicationStatus
    } was reset to draft pending human review.`,
  };
}

function synthesizeSources(
  provider: string,
  providerSnapshots: Array<{ id: any; snapshot?: Record<string, any> }>
) {
  return dedupeSources(
    providerSnapshots.map(({ snapshot }) => ({
      source: provider,
      sourceId: snapshot?.sourceId,
      sourceSlug: snapshot?.sourceSlug,
      sourceUrl: snapshot?.sourceUrl,
      lastSeenAt: isValidDateValue(snapshot?.providerUpdatedAt)
        ? snapshot?.providerUpdatedAt
        : snapshot?.capturedAt,
    }))
  );
}

function dedupeSources(sources: Record<string, any>[]) {
  const byIdentity = new Map<string, Record<string, any>>();
  for (const source of sources) {
    const identity = [
      normalizeProjectSourceType(source?.source),
      cleanString(source?.sourceId)?.toLowerCase(),
      cleanString(source?.sourceSlug)?.toLowerCase(),
      cleanString(source?.sourceUrl)?.toLowerCase(),
    ].join("|");
    if (!byIdentity.has(identity)) byIdentity.set(identity, source);
  }
  return Array.from(byIdentity.values());
}

interface ParsedSourceKey {
  provider: string;
  sourceId: string;
}

function parseSourceKey(value: any): ParsedSourceKey {
  const text = cleanString(value) || "";
  const separator = text.indexOf(":");
  if (separator <= 0 || separator === text.length - 1) {
    return { provider: "", sourceId: "" };
  }
  return {
    provider: normalizeProjectSourceType(text.slice(0, separator)),
    sourceId: text
      .slice(separator + 1)
      .trim()
      .toLowerCase(),
  };
}

function deterministicCloneSlug(
  baseSlug: string,
  provider: string,
  suffix: string
): string {
  return normalizeActivitySlug(`${baseSlug}-${provider}-${suffix}`);
}

function comparePartitionProvenance(
  left: FomoV2ActivityProviderPartition,
  right: FomoV2ActivityProviderPartition
): number {
  const timestampDifference =
    Date.parse(right.latestSnapshotAt || "") -
    Date.parse(left.latestSnapshotAt || "");
  if (Number.isFinite(timestampDifference) && timestampDifference !== 0) {
    return timestampDifference;
  }
  return left.provider.localeCompare(right.provider);
}

function compareSnapshotProvenance(
  left?: Record<string, any>,
  right?: Record<string, any>
): number {
  const timestampDifference =
    snapshotTimestamp(right) - snapshotTimestamp(left);
  if (Number.isFinite(timestampDifference) && timestampDifference !== 0) {
    return timestampDifference;
  }
  return idString(right?._id).localeCompare(idString(left?._id));
}

function snapshotTimestamp(snapshot?: Record<string, any>): number {
  if (!snapshot) return Number.NaN;
  const capturedAt = new Date(
    snapshot.capturedAt || snapshot.providerUpdatedAt || ""
  ).getTime();
  return Number.isFinite(capturedAt) ? capturedAt : Number.NaN;
}

function isValidDateValue(value: any): boolean {
  return Number.isFinite(new Date(value || "").getTime());
}

function isNonEmptyRecord(value: any): value is Record<string, any> {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length > 0
  );
}

function partitionFor(
  plan: FomoV2ActivitySourceSplitPlan,
  provider: string
): FomoV2ActivityProviderPartition {
  const partition = plan.partitions.find(
    (candidate) => candidate.provider === provider
  );
  if (!partition) throw new Error(`Missing split partition for ${provider}.`);
  return partition;
}

function normalizeOptions(options: FomoV2ActivitySourceSplitOptions) {
  const write = Boolean(options.write);
  const all = Boolean(options.all);
  if (write && options.confirmWrite !== true) {
    throw new Error(
      "Activity source split write mode requires explicit confirmWrite=true."
    );
  }
  if (all && options.allConfirmed !== true) {
    throw new Error(
      "Activity source split full scope requires explicit allConfirmed=true."
    );
  }
  const rawLimit = options.limit ?? DEFAULT_LIMIT;
  const limit = Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new Error(
      `Activity source split limit must be an integer from 1 to ${MAX_LIMIT}.`
    );
  }
  const cursorText = cleanString(options.cursor);
  if (cursorText && !Types.ObjectId.isValid(cursorText)) {
    throw new Error("Activity source split cursor must be a MongoDB ObjectId.");
  }
  if (all && cursorText) {
    throw new Error(
      "Activity source split --all scope cannot start at a cursor."
    );
  }
  return {
    write,
    all,
    limit,
    cursor: cursorText ? new Types.ObjectId(cursorText) : undefined,
  };
}

function planSummary(plan: FomoV2ActivitySourceSplitPlan) {
  return {
    activityId: plan.activityId,
    slug: plan.slug,
    providers: plan.providers,
    keeperProvider: plan.keeperProvider,
    previousPublicationStatus: plan.previousPublicationStatus,
    clones: plan.clones,
    provenance: plan.partitions.map((partition) => ({
      provider: partition.provider,
      latestSnapshotId: partition.latestSnapshotId,
      latestSnapshotAt: partition.latestSnapshotAt,
    })),
  };
}

function planErrorResult(
  plan: FomoV2ActivitySourceSplitPlan
): FomoV2ActivitySourceSplitItemResult {
  return {
    ...planSummary(plan),
    status: "error",
    errors: plan.errors,
  };
}

function uniqueStrings(values: any[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => cleanString(value)?.toLowerCase())
        .filter(Boolean) as string[]
    )
  ).sort();
}

function intersects(left: string[], right: string[]): boolean {
  const rightSet = new Set(right);
  return left.some((value) => rightSet.has(value));
}

function cleanString(value: any): string | undefined {
  if (value === undefined || value === null || typeof value === "object") {
    return undefined;
  }
  const text = String(value).trim();
  return text || undefined;
}

function idString(value: any): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toHexString === "function") return value.toHexString();
  return String(value);
}

function safeErrorMessage(error: any): string {
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message.trim();
  }
  return String(error || "Unknown remediation error");
}
