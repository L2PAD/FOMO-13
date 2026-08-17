import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { FomoV2ImportCandidateService } from "../../import-candidates";
import { FomoV2ReviewService } from "../../review/services/review.service";
import { FomoV2SourceSnapshot } from "../../../models";
import { normalizeProjectSourceType } from "../../../shared/source-policy/helpers";
import {
  activitySemanticPayload,
  buildActivitySourceKey,
  hashActivityPayload,
  mergeActivitySourceContent,
  normalizeActivitySlug,
  sanitizeActivityContent,
} from "../helpers";
import { FomoV2Activity, FomoV2ActivityDocument } from "../models";
import {
  FomoV2ActivityCanonicalStatus,
  FomoV2ActivityIngestInput,
} from "../types";

const MAX_INGEST_RETRIES = 3;
const MAX_AUDIT_ENTRIES = 200;

@Injectable()
export class FomoV2ActivityIngestService {
  constructor(
    @InjectModel(FomoV2Activity.name)
    private readonly activityModel: Model<FomoV2ActivityDocument>,
    @InjectModel(FomoV2SourceSnapshot.name)
    private readonly sourceSnapshotModel: Model<FomoV2SourceSnapshot>,
    private readonly importCandidateService: FomoV2ImportCandidateService,
    private readonly reviewService: FomoV2ReviewService
  ) {}

  async stage(input: FomoV2ActivityIngestInput) {
    const normalized = this.normalizeInput(input);
    const snapshot = await this.createSourceSnapshot(normalized);
    let existingHint = await this.findExisting(normalized);
    if (
      existingHint &&
      this.isIdempotentNoop(existingHint, normalized, snapshot)
    ) {
      return {
        activity: existingHint,
        created: false,
        unchanged: true,
        sourceSnapshotId: String((snapshot as any)._id),
        importCandidateId: existingHint.importCandidateId
          ? String(existingHint.importCandidateId)
          : undefined,
        reviewBatchId: existingHint.reviewBatchId
          ? String(existingHint.reviewBatchId)
          : undefined,
      };
    }
    const importCandidateResult =
      await this.importCandidateService.createOrUpdateCandidate({
        domain: "activities",
        entityType: "activity",
        sourceType: normalized.source,
        sourceId: normalized.sourceId,
        sourceSlug: normalized.sourceSlug,
        sourceUrl: normalized.sourceUrl,
        name:
          normalized.normalizedDraft.name ||
          normalized.normalizedDraft.projectName,
        symbol: normalized.normalizedDraft.symbol,
        slug: normalized.slug,
        payload: normalized.rawPayload,
        normalizedPayload: normalized.normalizedDraft,
        syncRunId: normalized.syncRunId,
        metadata: {
          sourceSnapshotId: String((snapshot as any)._id),
          parserVersion: normalized.parserVersion,
          parserImportRunId: normalized.parserImportRunId
            ? String(normalized.parserImportRunId)
            : undefined,
        },
      });
    const reviewResult = await this.createReviewBatch(
      normalized,
      snapshot,
      importCandidateResult.candidate
    );

    for (let attempt = 0; attempt < MAX_INGEST_RETRIES; attempt += 1) {
      const existing = existingHint || (await this.findExisting(normalized));
      existingHint = undefined;
      if (!existing) {
        try {
          const created = await this.createActivity(
            normalized,
            snapshot,
            importCandidateResult.candidate,
            reviewResult.batch
          );
          return {
            activity: created,
            created: true,
            sourceSnapshotId: String((snapshot as any)._id),
            importCandidateId: String(
              (importCandidateResult.candidate as any)._id
            ),
            reviewBatchId: String((reviewResult.batch as any)._id),
          };
        } catch (error: any) {
          if (error?.code !== 11000 || attempt === MAX_INGEST_RETRIES - 1) {
            throw error;
          }
          continue;
        }
      }

      const updated = await this.updateExisting(
        existing,
        normalized,
        snapshot,
        importCandidateResult.candidate,
        reviewResult.batch
      );
      if (updated) {
        return {
          activity: updated,
          created: false,
          sourceSnapshotId: String((snapshot as any)._id),
          importCandidateId: String(
            (importCandidateResult.candidate as any)._id
          ),
          reviewBatchId: String((reviewResult.batch as any)._id),
        };
      }
    }

    throw new ConflictException("Activity changed repeatedly during ingest.");
  }

  private normalizeInput(input: FomoV2ActivityIngestInput) {
    const source = normalizeProjectSourceType(input?.source);
    const slug = normalizeActivitySlug(input?.slug || input?.sourceSlug || "");
    if (!source) throw new BadRequestException("Activity source is required.");
    if (!slug) throw new BadRequestException("Activity slug is required.");
    if (!input?.rawPayload || typeof input.rawPayload !== "object") {
      throw new BadRequestException("Activity rawPayload is required.");
    }
    const normalizedDraft = sanitizeActivityContent(
      input.normalizedDraft || {}
    );
    const canonicalCandidates = (input.canonicalCandidates || [])
      .filter((candidate) =>
        Types.ObjectId.isValid(String(candidate.canonicalProjectId))
      )
      .map((candidate) => ({
        ...candidate,
        canonicalProjectId: new Types.ObjectId(
          String(candidate.canonicalProjectId)
        ),
      }));
    const canonicalProjectId = input.canonicalProjectId
      ? this.toObjectId(input.canonicalProjectId, "canonicalProjectId")
      : undefined;
    const canonicalStatus = this.canonicalStatus(
      input,
      canonicalProjectId,
      canonicalCandidates.length
    );

    const normalized = {
      ...input,
      source,
      slug,
      normalizedDraft,
      canonicalCandidates,
      canonicalProjectId,
      canonicalStatus,
      legacyActivityId: input.legacyActivityId
        ? String(input.legacyActivityId)
        : undefined,
    };
    return {
      ...normalized,
      payloadHash:
        input.payloadHash ||
        hashActivityPayload(activitySemanticPayload(normalized)),
    };
  }

  private async createSourceSnapshot(input: any) {
    const sourceEntityKey = [
      input.source,
      "activity",
      input.sourceId || input.sourceSlug || input.slug,
    ].join(":");
    const identity = input.sourceId
      ? {
          source: input.source,
          sourceEntityType: "activity",
          sourceId: input.sourceId,
          payloadHash: input.payloadHash,
        }
      : { sourceEntityKey, payloadHash: input.payloadHash };
    const setOnInsert: Record<string, any> = {
      source: input.source,
      sourceEntityType: "activity",
      sourceId: input.sourceId,
      sourceSlug: input.sourceSlug || input.slug,
      sourceUrl: input.sourceUrl,
      sourceEntityKey,
      payloadHash: input.payloadHash,
      rawPayload: input.rawPayload,
      normalizedPreview: input.normalizedDraft,
      capturedAt: new Date(),
      providerUpdatedAt: input.providerUpdatedAt,
      parserVersion: input.parserVersion,
      metadata: { domain: "activities" },
    };
    const migrationRunId = this.optionalObjectId(input.syncRunId);
    if (migrationRunId) setOnInsert.migrationRunId = migrationRunId;
    const parserImportRunId = this.optionalObjectId(input.parserImportRunId);
    if (parserImportRunId) setOnInsert.parserImportRunId = parserImportRunId;

    return this.sourceSnapshotModel
      .findOneAndUpdate(
        identity,
        { $setOnInsert: setOnInsert },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      )
      .lean()
      .exec();
  }

  private async createReviewBatch(input: any, snapshot: any, candidate: any) {
    const reason =
      input.canonicalStatus === "conflict" ||
      input.canonicalStatus === "proposed"
        ? "LOW_CONFIDENCE_MATCH"
        : input.canonicalStatus === "unprocessed" ||
          input.canonicalStatus === "no_candidates"
        ? "MISSING_CANONICAL_PROJECT"
        : "ACTIVITY_EDITORIAL_REVIEW";
    return this.reviewService.createOrUpdateBatch({
      domain: "activities",
      reason,
      canonicalProjectId: input.canonicalProjectId,
      projectKey: input.slug,
      projectName:
        input.normalizedDraft.projectName || input.normalizedDraft.name,
      normalizedProjectName: String(
        input.normalizedDraft.projectName || input.normalizedDraft.name || ""
      ).toLowerCase(),
      incomingSourceType: input.source,
      affectedEntityTypes: ["activity"],
      candidates: [
        {
          entityType: "activity",
          sourceType: input.source,
          sourceId: input.sourceId,
          sourceSnapshotId: snapshot._id,
          sourceUrl: input.sourceUrl,
          payload: {
            activitySlug: input.slug,
            importCandidateId: String(candidate._id),
          },
          normalizedPayload: input.normalizedDraft,
          metadata: {
            canonicalStatus: input.canonicalStatus,
            canonicalCandidates: input.canonicalCandidates,
          },
        },
      ],
      candidateCount: Math.max(1, input.canonicalCandidates.length),
      fingerprint: `activities:${input.source}:${input.sourceId || input.slug}`,
      syncRunId: input.syncRunId,
      metadata: {
        activitySlug: input.slug,
        sourceSnapshotId: String(snapshot._id),
        importCandidateId: String(candidate._id),
      },
    });
  }

  private async findExisting(input: any): Promise<any> {
    const or: any[] = [];
    const sourceKey = buildActivitySourceKey(input.source, input.sourceId);
    if (sourceKey) or.push({ sourceKeys: sourceKey });
    if (input.parserActivityId) {
      or.push({
        parserActivityId: input.parserActivityId,
        sources: { $elemMatch: { source: input.source } },
      });
    }
    if (input.legacyActivityId) {
      or.push({
        legacyActivityId: input.legacyActivityId,
        sources: { $elemMatch: { source: input.source } },
      });
      if (Types.ObjectId.isValid(input.legacyActivityId)) {
        or.push({
          _id: new Types.ObjectId(input.legacyActivityId),
          sources: { $elemMatch: { source: input.source } },
        });
      }
    }
    if (input.legacyNumericId !== undefined) {
      or.push({
        legacyNumericId: input.legacyNumericId,
        sources: { $elemMatch: { source: input.source } },
      });
    }
    if (input.sourceUrl) {
      or.push({
        sources: {
          $elemMatch: { source: input.source, sourceUrl: input.sourceUrl },
        },
      });
    }
    if (input.sourceSlug) {
      or.push({
        sources: {
          $elemMatch: { source: input.source, sourceSlug: input.sourceSlug },
        },
      });
    }
    if (or.length) {
      const strongMatch = await this.activityModel
        .findOne({ $or: or })
        .lean()
        .exec();
      if (strongMatch) {
        this.assertProviderIsolation(strongMatch, input.source);
        return strongMatch;
      }
    }

    const slugCandidates = await this.activityModel
      .find({ slug: input.slug })
      .limit(10)
      .lean()
      .exec();
    const compatible = slugCandidates.find(
      (candidate) =>
        this.hasProviderIdentity(candidate, input.source) &&
        this.isControlledSlugMatch(candidate, input)
    );
    if (compatible) return compatible;

    if (slugCandidates.length) {
      input.slug = `${input.slug}-${hashActivityPayload({
        source: input.source,
        sourceId: input.sourceId,
        sourceSlug: input.sourceSlug,
        sourceUrl: input.sourceUrl,
        payloadHash: input.payloadHash,
      }).slice(0, 8)}`;
    }
    return null;
  }

  private isControlledSlugMatch(candidate: any, input: any): boolean {
    const current = candidate?.currentDraft || {};
    const incoming = input?.normalizedDraft || {};
    const currentName = this.normalizeIdentityText(
      current.projectName || current.name
    );
    const incomingName = this.normalizeIdentityText(
      incoming.projectName || incoming.name
    );
    const currentType = this.normalizeIdentityText(current.activityType);
    const incomingType = this.normalizeIdentityText(incoming.activityType);
    if (!currentName || currentName !== incomingName) return false;
    if (!currentType || currentType !== incomingType) return false;

    const incomingDates = [incoming.startDate, incoming.endDate]
      .map((value) => this.dateKey(value))
      .filter(Boolean);
    if (!incomingDates.length) return false;
    const currentDates = new Set(
      [current.startDate, current.endDate]
        .map((value) => this.dateKey(value))
        .filter(Boolean)
    );
    return incomingDates.some((date) => currentDates.has(date));
  }

  private assertProviderIsolation(activity: any, incomingSource: string): void {
    const providerSources = this.providerSources(activity);
    const conflictingSources = providerSources.filter(
      (source) => source !== incomingSource
    );
    if (!conflictingSources.length) return;
    throw new ConflictException({
      message:
        "Activity aggregate contains identities from multiple parser providers and cannot be updated automatically.",
      code: "ACTIVITY_MIXED_PROVIDER_AGGREGATE",
      reviewRequired: true,
      metadata: {
        action: "controlled_split_backfill",
        activityId: activity?._id ? String(activity._id) : undefined,
        incomingSource,
        existingSources: providerSources,
      },
    });
  }

  private hasProviderIdentity(activity: any, source: string): boolean {
    return this.providerSources(activity).includes(source);
  }

  private providerSources(activity: any): string[] {
    const fromSources = (activity?.sources || []).map((entry: any) =>
      normalizeProjectSourceType(entry?.source)
    );
    const fromSourceKeys = (activity?.sourceKeys || []).map((key: any) =>
      normalizeProjectSourceType(String(key || "").split(":", 1)[0])
    );
    return Array.from(
      new Set([...fromSources, ...fromSourceKeys].filter(Boolean))
    );
  }

  private async createActivity(
    input: any,
    snapshot: any,
    importCandidate: any,
    reviewBatch: any
  ) {
    const sourceKey = buildActivitySourceKey(input.source, input.sourceId);
    const revision = 1;
    const payload: any = {
      slug: input.slug,
      legacyActivityId: input.legacyActivityId,
      legacyNumericId: input.legacyNumericId,
      parserActivityId: input.parserActivityId,
      sourceKeys: sourceKey ? [sourceKey] : [],
      sources: [this.sourceRef(input)],
      sourceSnapshotIds: [snapshot._id],
      importCandidateId: importCandidate._id,
      reviewBatchId: reviewBatch._id,
      canonicalProjectId: input.canonicalProjectId,
      canonicalResolution: this.canonicalResolution(input),
      lifecycleStatus: input.lifecycleStatus || "upcoming",
      reviewStatus: "pending_ai",
      publicationStatus: "draft",
      accessTier: input.accessTier || "public",
      // Sparse updates must not synthesize "Other" and overwrite a reviewed
      // type. A brand-new aggregate still receives the minimum publishable
      // default until an editor or richer source provides a concrete type.
      currentDraft: sanitizeActivityContent({
        ...input.normalizedDraft,
        activityType: input.normalizedDraft.activityType || "Other",
      }),
      manualOverrideFields: [],
      aiProposals: [],
      revision,
      auditTrail: [
        {
          action: "ingest",
          actor: `parser:${input.source}`,
          at: new Date(),
          revision,
          changedFields: [],
          note: "Activity staged for AI and human review.",
        },
      ],
    };
    if (
      input.legacyActivityId &&
      Types.ObjectId.isValid(input.legacyActivityId)
    ) {
      payload._id = new Types.ObjectId(input.legacyActivityId);
    }
    return this.activityModel.create(payload);
  }

  private async updateExisting(
    activity: any,
    input: any,
    snapshot: any,
    importCandidate: any,
    reviewBatch: any
  ) {
    this.assertProviderIsolation(activity, input.source);
    const nextRevision = Number(activity.revision || 0) + 1;
    const sourceKey = buildActivitySourceKey(input.source, input.sourceId);
    const sourceKeys = Array.from(
      new Set([
        ...(activity.sourceKeys || []),
        ...(sourceKey ? [sourceKey] : []),
      ])
    );
    const sources = this.mergeSources(
      activity.sources || [],
      this.sourceRef(input)
    );
    const sourceSnapshotIds = this.boundedSourceSnapshotIds(
      activity.sourceSnapshotIds || [],
      snapshot._id
    );
    const currentDraft = sanitizeActivityContent(
      mergeActivitySourceContent(
        activity.currentDraft || {},
        input.normalizedDraft,
        activity.manualOverrideFields || []
      )
    );
    const set: Record<string, any> = {
      sourceKeys,
      sources,
      importCandidateId: importCandidate._id,
      reviewBatchId: reviewBatch._id,
      sourceSnapshotIds,
      currentDraft,
      lifecycleStatus: this.effectiveLifecycleStatus(activity, input),
      reviewStatus:
        activity.reviewStatus === "approved" ? "needs_changes" : "pending_ai",
    };
    if (!activity.legacyActivityId && input.legacyActivityId) {
      set.legacyActivityId = input.legacyActivityId;
    }
    if (
      activity.legacyNumericId === undefined &&
      input.legacyNumericId !== undefined
    ) {
      set.legacyNumericId = input.legacyNumericId;
    }
    if (!activity.parserActivityId && input.parserActivityId) {
      set.parserActivityId = input.parserActivityId;
    }
    if (this.canRefreshCanonicalResolution(activity)) {
      set.canonicalResolution = this.canonicalResolution(input);
      if (input.canonicalProjectId)
        set.canonicalProjectId = input.canonicalProjectId;
    }

    // publicationStatus and hidden fields are deliberately absent: ingest can
    // create a new draft, but it can never publish or unhide an existing row.
    return this.activityModel
      .findOneAndUpdate(
        { _id: activity._id, revision: activity.revision },
        {
          $set: set,
          $inc: { revision: 1 },
          $push: {
            auditTrail: {
              $each: [
                {
                  action: "ingest",
                  actor: `parser:${input.source}`,
                  at: new Date(),
                  revision: nextRevision,
                  changedFields: [],
                  note: "New source snapshot staged; publication state preserved.",
                },
              ],
              $slice: -MAX_AUDIT_ENTRIES,
            },
          },
        },
        { new: true, runValidators: true }
      )
      .lean()
      .exec();
  }

  private isIdempotentNoop(activity: any, input: any, snapshot: any): boolean {
    const snapshotLinked = (activity.sourceSnapshotIds || []).some(
      (id) => String(id) === String(snapshot?._id)
    );
    if (!snapshotLinked) return false;

    const effectiveDraft = sanitizeActivityContent(
      mergeActivitySourceContent(
        activity.currentDraft || {},
        input.normalizedDraft,
        activity.manualOverrideFields || []
      )
    );
    if (
      !this.sameValue(
        effectiveDraft,
        sanitizeActivityContent(activity.currentDraft || {})
      )
    ) {
      return false;
    }
    const effectiveLifecycle = this.effectiveLifecycleStatus(activity, input);
    if (effectiveLifecycle !== activity.lifecycleStatus) {
      return false;
    }
    if (!activity.legacyActivityId && input.legacyActivityId) return false;
    if (
      activity.legacyNumericId === undefined &&
      input.legacyNumericId !== undefined
    ) {
      return false;
    }
    if (!activity.parserActivityId && input.parserActivityId) return false;

    const existingSource = (activity.sources || []).find(
      (source) =>
        source.source === input.source &&
        (input.sourceId
          ? source.sourceId === input.sourceId
          : source.sourceSlug === (input.sourceSlug || input.slug))
    );
    if (
      !existingSource ||
      !this.sameValue(
        {
          source: existingSource.source,
          sourceId: existingSource.sourceId,
          sourceSlug: existingSource.sourceSlug,
          sourceUrl: existingSource.sourceUrl,
        },
        {
          source: input.source,
          sourceId: input.sourceId,
          sourceSlug: input.sourceSlug || input.slug,
          sourceUrl: input.sourceUrl,
        }
      )
    ) {
      return false;
    }

    const currentCanonicalStatus =
      activity.canonicalResolution?.status || "unprocessed";
    if (["verified", "rejected"].includes(currentCanonicalStatus)) return true;
    return this.sameValue(
      this.canonicalComparable(activity.canonicalResolution),
      this.canonicalComparable(this.canonicalResolution(input))
    );
  }

  private canonicalResolution(input: any) {
    return {
      status: input.canonicalStatus,
      confidence: input.canonicalStatus === "verified" ? "exact" : undefined,
      matchedBy: input.canonicalProjectId ? "ingest" : undefined,
      reason:
        input.canonicalStatus === "no_candidates"
          ? "No canonical project candidate found. Activity may be standalone."
          : undefined,
      candidates: input.canonicalCandidates,
      resolvedAt: input.canonicalStatus === "verified" ? new Date() : undefined,
      resolvedBy: input.canonicalStatus === "verified" ? "resolver" : undefined,
    };
  }

  private canonicalStatus(
    input: FomoV2ActivityIngestInput,
    canonicalProjectId: Types.ObjectId | undefined,
    candidateCount: number
  ): FomoV2ActivityCanonicalStatus {
    if (input.canonicalStatus) return input.canonicalStatus;
    if (canonicalProjectId) return "verified";
    if (input.canonicalCandidates !== undefined) {
      if (candidateCount > 1) return "conflict";
      if (candidateCount === 1) return "proposed";
      return "no_candidates";
    }
    return "unprocessed";
  }

  private sourceRef(input: any) {
    return {
      source: input.source,
      sourceId: input.sourceId,
      sourceSlug: input.sourceSlug || input.slug,
      sourceUrl: input.sourceUrl,
      lastSeenAt: new Date(),
    };
  }

  private mergeSources(sources: any[], incoming: any): any[] {
    const key = `${incoming.source}:${
      incoming.sourceId || incoming.sourceSlug || ""
    }`;
    const filtered = sources.filter(
      (source) =>
        `${source.source}:${source.sourceId || source.sourceSlug || ""}` !== key
    );
    return [incoming, ...filtered].slice(0, 50);
  }

  private boundedSourceSnapshotIds(existing: any[], latest: any): any[] {
    const latestKey = String(latest);
    const seen = new Set<string>();
    const ordered = [...existing, latest].reduce((result, value) => {
      const key = String(value);
      if (!key || key === latestKey || seen.has(key)) return result;
      seen.add(key);
      result.push(value);
      return result;
    }, [] as any[]);
    ordered.push(latest);
    return ordered.slice(-100);
  }

  private effectiveLifecycleStatus(activity: any, input: any): string {
    const current = activity.lifecycleStatus;
    if ((activity.manualOverrideFields || []).includes("lifecycleStatus")) {
      return current;
    }
    // A terminal campaign is never reopened by stale or sparse parser data.
    if (["ended", "cancelled"].includes(current)) return current;
    return input.lifecycleStatus || current;
  }

  private canRefreshCanonicalResolution(activity: any): boolean {
    const resolution = activity.canonicalResolution || {};
    const status = resolution.status || "unprocessed";
    if (
      !["unprocessed", "no_candidates", "proposed", "conflict"].includes(status)
    ) {
      return false;
    }
    // `no_candidates` is also the explicit reviewer decision for a valid
    // standalone activity. Once a reviewer records it, parser ingest must not
    // reopen the canonical question merely because resolver inputs changed.
    if (
      status === "no_candidates" &&
      resolution.resolvedAt &&
      resolution.resolvedBy
    ) {
      return false;
    }
    return true;
  }

  private canonicalComparable(value: any) {
    return {
      status: value?.status || "unprocessed",
      confidence: value?.confidence,
      matchedBy: value?.matchedBy,
      reason: value?.reason,
      candidates: value?.candidates || [],
    };
  }

  private sameValue(left: any, right: any): boolean {
    return (
      JSON.stringify(this.comparableValue(left)) ===
      JSON.stringify(this.comparableValue(right))
    );
  }

  private comparableValue(value: any): any {
    if (value instanceof Date) return value.toISOString();
    if (value instanceof Types.ObjectId) return value.toHexString();
    if (Array.isArray(value))
      return value.map((item) => this.comparableValue(item));
    if (!value || typeof value !== "object") return value;
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        const child = this.comparableValue(value[key]);
        if (child !== undefined) result[key] = child;
        return result;
      }, {} as Record<string, any>);
  }

  private normalizeIdentityText(value: any): string {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  private dateKey(value: any): string {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    return Number.isFinite(date.getTime())
      ? date.toISOString().slice(0, 10)
      : "";
  }

  private optionalObjectId(value: any): Types.ObjectId | undefined {
    if (!value) return undefined;
    return Types.ObjectId.isValid(String(value))
      ? new Types.ObjectId(String(value))
      : undefined;
  }

  private toObjectId(value: any, field: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(String(value))) {
      throw new BadRequestException(`${field} must be a Mongo ObjectId.`);
    }
    return new Types.ObjectId(String(value));
  }
}
