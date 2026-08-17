import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { FomoV2ProjectDomainSource } from "../../../shared/source-policy";
import {
  buildMissingCanonicalProjectReviewFingerprint,
  buildReviewFingerprint,
  buildSourceConflictReviewFingerprint,
  normalizeReviewText,
} from "../helpers";
import {
  FomoV2MissingCanonicalProjectReviewInput,
  FomoV2ReviewBatchInput,
  FomoV2ReviewBatchUpsertResult,
  FomoV2ReviewCandidateInput,
  FomoV2SourceConflictReviewInput,
} from "../types";
import { FomoV2ReviewBatch, FomoV2ReviewBatchDocument } from "../models";

const MAX_REVIEW_CANDIDATES = 100;

@Injectable()
export class FomoV2ReviewService {
  constructor(
    @InjectModel(FomoV2ReviewBatch.name)
    private readonly reviewBatchModel: Model<FomoV2ReviewBatch>,
    @InjectModel(FomoV2ProjectDomainSource.name)
    private readonly projectDomainSourceModel: Model<FomoV2ProjectDomainSource>
  ) {}

  async createOrUpdateBatch(
    input: FomoV2ReviewBatchInput
  ): Promise<FomoV2ReviewBatchUpsertResult<FomoV2ReviewBatchDocument>> {
    const now = new Date();
    const normalized = this.normalizeBatchInput(input);
    const fingerprint =
      normalized.fingerprint || buildReviewFingerprint(normalized);
    const existing = await this.reviewBatchModel
      .findOne({ fingerprint, status: "open" })
      .exec();

    if (existing) {
      const candidates = this.mergeCandidates(
        existing.candidates || [],
        normalized.candidates || []
      );
      const candidateCount = Math.max(
        Number(existing.candidateCount || 0),
        Number(normalized.candidateCount || 0),
        candidates.actualCount
      );
      existing.lastSeenAt = now;
      existing.seenCount = Number(existing.seenCount || 0) + 1;
      existing.candidateCount = candidateCount;
      existing.candidates = candidates.storedCandidates;
      existing.updatedBySyncRunId = this.syncRunId(normalized.syncRunId);
      existing.metadata = {
        ...(existing.metadata || {}),
        ...(normalized.metadata || {}),
      };
      existing.affectedEntityTypes = uniqueStrings([
        ...(existing.affectedEntityTypes || []),
        ...(normalized.affectedEntityTypes || []),
      ]);
      await existing.save();
      return { batch: existing, created: false, fingerprint };
    }

    try {
      const candidates = this.mergeCandidates([], normalized.candidates || []);
      const batch = await this.reviewBatchModel.create({
        ...normalized,
        fingerprint,
        status: "open",
        candidateCount: Math.max(
          Number(normalized.candidateCount || 0),
          candidates.actualCount
        ),
        candidates: candidates.storedCandidates,
        firstSeenAt: now,
        lastSeenAt: now,
        seenCount: 1,
        createdBySyncRunId: this.syncRunId(normalized.syncRunId),
        updatedBySyncRunId: this.syncRunId(normalized.syncRunId),
      });
      return { batch, created: true, fingerprint };
    } catch (error: any) {
      if (error?.code !== 11000) throw error;
      const batch = await this.reviewBatchModel.findOneAndUpdate(
        { fingerprint },
        {
          $set: {
            status: "open",
            lastSeenAt: now,
            updatedBySyncRunId: this.syncRunId(normalized.syncRunId),
            metadata: normalized.metadata || {},
          },
          $inc: { seenCount: 1 },
        },
        { new: true }
      );
      return { batch: batch as any, created: false, fingerprint };
    }
  }

  async createSourceConflictReview(
    input: FomoV2SourceConflictReviewInput
  ): Promise<FomoV2ReviewBatchUpsertResult<FomoV2ReviewBatchDocument>> {
    const canonicalProjectId = this.toObjectId(input.canonicalProjectId);
    const domain = normalizeReviewText(input.domain);
    const currentSourceType = normalizeReviewText(input.currentSourceType);
    const incomingSourceType = normalizeReviewText(input.incomingSourceType);
    return this.createOrUpdateBatch({
      domain,
      reason: "SOURCE_CONFLICT",
      canonicalProjectId,
      currentSourceType,
      incomingSourceType,
      affectedEntityTypes: input.affectedEntityTypes,
      candidates: input.candidates,
      candidateCount: input.candidates?.length || 0,
      fingerprint: buildSourceConflictReviewFingerprint({
        canonicalProjectId,
        domain,
        currentSourceType,
        incomingSourceType,
      }),
      syncRunId: input.syncRunId,
      metadata: input.metadata,
    });
  }

  async createMissingCanonicalProjectReview(
    input: FomoV2MissingCanonicalProjectReviewInput
  ): Promise<FomoV2ReviewBatchUpsertResult<FomoV2ReviewBatchDocument>> {
    const domain = normalizeReviewText(input.domain);
    const incomingSourceType = normalizeReviewText(input.incomingSourceType);
    const normalizedProjectName =
      normalizeReviewText(input.normalizedProjectName || input.projectName) ||
      undefined;
    return this.createOrUpdateBatch({
      domain,
      reason: "MISSING_CANONICAL_PROJECT",
      projectKey: input.projectKey,
      projectName: input.projectName,
      normalizedProjectName,
      incomingSourceType,
      affectedEntityTypes: input.affectedEntityTypes,
      candidates: input.candidates,
      candidateCount: input.candidates?.length || 0,
      fingerprint: buildMissingCanonicalProjectReviewFingerprint({
        domain,
        incomingSourceType,
        projectKey: input.projectKey,
        normalizedProjectName,
        projectName: input.projectName,
      }),
      syncRunId: input.syncRunId,
      metadata: input.metadata,
    });
  }

  async auditReviewDomain(): Promise<Record<string, any>> {
    const [
      duplicateLocks,
      locksWithoutCanonicalProject,
      locksWithoutSelectedSourceType,
      lockDistribution,
      duplicateReviewFingerprints,
      openBatchesByReasonDomain,
      batchesWithoutCandidates,
      oversizedCandidateBatches,
    ] = await Promise.all([
      this.projectDomainSourceModel.aggregate([
        {
          $group: {
            _id: {
              canonicalProjectId: "$canonicalProjectId",
              domain: "$domain",
            },
            count: { $sum: 1 },
            ids: { $push: "$_id" },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ]),
      this.projectDomainSourceModel.countDocuments({
        $or: [
          { canonicalProjectId: { $exists: false } },
          { canonicalProjectId: null },
        ],
      }),
      this.projectDomainSourceModel.countDocuments({
        $or: [
          { selectedSourceType: { $exists: false } },
          { selectedSourceType: "" },
          { selectedSourceType: null },
        ],
      }),
      this.projectDomainSourceModel.aggregate([
        {
          $group: {
            _id: {
              domain: "$domain",
              selectedSourceType: "$selectedSourceType",
              status: "$status",
            },
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            "_id.domain": 1,
            "_id.selectedSourceType": 1,
            "_id.status": 1,
          },
        },
      ]),
      this.reviewBatchModel.aggregate([
        {
          $group: {
            _id: "$fingerprint",
            count: { $sum: 1 },
            ids: { $push: "$_id" },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ]),
      this.reviewBatchModel.aggregate([
        { $match: { status: "open" } },
        {
          $group: {
            _id: { domain: "$domain", reason: "$reason" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.domain": 1, "_id.reason": 1 } },
      ]),
      this.reviewBatchModel
        .find(
          {
            candidateCount: { $gt: 0 },
            $or: [
              { candidates: { $exists: false } },
              { candidates: { $size: 0 } },
            ],
          },
          { fingerprint: 1, domain: 1, reason: 1, candidateCount: 1 }
        )
        .limit(100)
        .lean(),
      this.reviewBatchModel
        .find(
          {
            $expr: {
              $gt: [
                { $size: { $ifNull: ["$candidates", []] } },
                MAX_REVIEW_CANDIDATES,
              ],
            },
          },
          { fingerprint: 1, domain: 1, reason: 1, candidateCount: 1 }
        )
        .limit(100)
        .lean(),
    ]);

    return {
      runner: "fomo-v2:review-domain-audit",
      mode: "read-only",
      generatedAt: new Date().toISOString(),
      projectDomainSources: {
        duplicateProjectDomainLocks: duplicateLocks,
        locksWithoutCanonicalProject,
        locksWithoutSelectedSourceType,
        distribution: lockDistribution,
      },
      reviewBatches: {
        duplicateFingerprints: duplicateReviewFingerprints,
        openBatchesByReasonDomain,
        batchesWithoutCandidates,
        oversizedCandidateBatches,
        maxCandidatesPerBatch: MAX_REVIEW_CANDIDATES,
      },
      READ_ONLY: "YES",
      WRITES_PERFORMED: 0,
    };
  }

  private normalizeBatchInput(
    input: FomoV2ReviewBatchInput
  ): FomoV2ReviewBatchInput {
    const candidates = (input.candidates || []).map((candidate) =>
      this.normalizeCandidate(candidate)
    );
    const affectedEntityTypes = input.affectedEntityTypes?.length
      ? input.affectedEntityTypes
      : uniqueStrings(candidates.map((candidate) => candidate.entityType));

    return {
      ...input,
      domain: normalizeReviewText(input.domain),
      reason: String(input.reason || "")
        .trim()
        .toUpperCase(),
      canonicalProjectId: this.toObjectId(input.canonicalProjectId),
      normalizedProjectName:
        normalizeReviewText(input.normalizedProjectName || input.projectName) ||
        undefined,
      currentSourceType:
        normalizeReviewText(input.currentSourceType) || undefined,
      incomingSourceType:
        normalizeReviewText(input.incomingSourceType) || undefined,
      affectedEntityTypes: uniqueStrings(
        affectedEntityTypes.map(normalizeReviewText)
      ),
      candidates,
    };
  }

  private normalizeCandidate(
    candidate: FomoV2ReviewCandidateInput
  ): FomoV2ReviewCandidateInput {
    return {
      entityType: normalizeReviewText(candidate.entityType),
      sourceType: normalizeReviewText(candidate.sourceType) || undefined,
      sourceId: cleanString(candidate.sourceId),
      sourceEntityId: this.objectIdOrString(candidate.sourceEntityId),
      sourceSnapshotId: this.objectIdOrString(candidate.sourceSnapshotId),
      sourcePath: cleanString(candidate.sourcePath),
      sourceUrl: cleanString(candidate.sourceUrl),
      payload: candidate.payload || {},
      normalizedPayload: candidate.normalizedPayload || {},
      confidence:
        typeof candidate.confidence === "number" &&
        Number.isFinite(candidate.confidence)
          ? candidate.confidence
          : undefined,
      metadata: candidate.metadata || {},
    };
  }

  private mergeCandidates(
    existing: any[],
    incoming: FomoV2ReviewCandidateInput[]
  ): { storedCandidates: FomoV2ReviewCandidateInput[]; actualCount: number } {
    const candidatesByKey = new Map<string, FomoV2ReviewCandidateInput>();
    for (const candidate of existing || []) {
      candidatesByKey.set(candidateKey(candidate), candidate);
    }
    for (const candidate of incoming || []) {
      candidatesByKey.set(candidateKey(candidate), candidate);
    }
    const allCandidates = Array.from(candidatesByKey.values());
    return {
      storedCandidates: allCandidates.slice(-MAX_REVIEW_CANDIDATES),
      actualCount: allCandidates.length,
    };
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value;
    const text = String(value).trim();
    return text && Types.ObjectId.isValid(text)
      ? new Types.ObjectId(text)
      : undefined;
  }

  private objectIdOrString(value: any): Types.ObjectId | string | undefined {
    return this.toObjectId(value) || cleanString(value);
  }

  private syncRunId(value: any): Types.ObjectId | string | undefined {
    return this.objectIdOrString(value);
  }
}

function candidateKey(candidate: any): string {
  const identity =
    cleanString(candidate.sourceId) ||
    idString(candidate.sourceEntityId) ||
    cleanString(candidate.sourcePath) ||
    cleanString(candidate.sourceUrl) ||
    normalizeReviewText(
      candidate.payload?.id ||
        candidate.payload?.name ||
        candidate.payload?.roundKey
    );
  return [
    normalizeReviewText(candidate.entityType),
    normalizeReviewText(candidate.sourceType),
    identity || "unknown",
  ].join(":");
}

function uniqueStrings(values: any[]): string[] {
  return Array.from(
    new Set(values.map(cleanString).filter(Boolean) as string[])
  );
}

function cleanString(value: any): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text || undefined;
}

function idString(value: any): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value.toHexString === "function") return value.toHexString();
  if (typeof value.toString === "function") return value.toString();
  return undefined;
}
