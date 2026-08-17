import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  FomoV2CanonicalProject,
  FomoV2MarketProjectReadModel,
} from "../../../models";
import {
  FomoV2ImportCandidate,
  FomoV2ImportCandidateDocument,
} from "../../import-candidates/models";
import { FomoV2UnlockEventsImportService } from "../../unlocks/services";
import { FomoV2VestingReviewApplyService } from "../../vesting/services/vesting-review-apply.service";
import { FomoV2ReviewBatch, FomoV2ReviewBatchDocument } from "../models";
import { FomoV2ReviewStatus } from "../types";

const MAX_REVIEW_CASE_SCAN = 10000;
const DECISION_CLAIM_LEASE_MS = 5 * 60 * 1000;

export interface FomoV2ReviewCaseAdminQuery {
  status?: string;
  domain?: string;
  type?: string;
  severity?: string;
  source?: string;
  canonicalProjectId?: string;
  excludeType?: string;
  excludedTypes?: string;
  search?: string;
  sort?: string;
  page?: string | number;
  limit?: string | number;
}

export interface FomoV2ReviewCaseDecisionInput {
  decisionNote?: string;
  note?: string;
  reason?: string;
  applyDecision?: boolean;
  vestingOverride?: Record<string, any>;
}

export interface FomoV2ProjectVestingUpdateInput
  extends FomoV2ReviewCaseDecisionInput {
  rawSource?: Record<string, any>;
  sourceType?: string;
  sourceSlug?: string;
  sourceProjectKey?: string;
  sourceUrl?: string;
}

export interface FomoV2ReviewCaseUnlockStageInput {
  source?: string;
  sourceType?: string;
}

type ReviewAction = "approve" | "reject" | "ignore" | "send_to_parser";

@Injectable()
export class FomoV2ReviewCaseAdminService {
  private readonly logger = new Logger(FomoV2ReviewCaseAdminService.name);

  constructor(
    @InjectModel(FomoV2ReviewBatch.name)
    private readonly reviewBatchModel: Model<FomoV2ReviewBatchDocument>,
    @InjectModel(FomoV2ImportCandidate.name)
    private readonly importCandidateModel: Model<FomoV2ImportCandidateDocument>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>,
    @InjectModel(FomoV2MarketProjectReadModel.name)
    private readonly marketProjectReadModel: Model<FomoV2MarketProjectReadModel>,
    private readonly vestingReviewApplyService: FomoV2VestingReviewApplyService,
    private readonly unlockEventsImportService: FomoV2UnlockEventsImportService
  ) {}

  async list(query: FomoV2ReviewCaseAdminQuery = {}) {
    const page = this.parsePositiveInteger(query.page, 1, 1, 100000);
    const limit = this.parsePositiveInteger(query.limit, 50, 1, 200);
    const directMatch = this.buildDirectMatch(query);
    const batches = await this.reviewBatchModel
      .find(directMatch)
      .sort({ lastSeenAt: -1, updatedAt: -1, _id: -1 })
      .limit(MAX_REVIEW_CASE_SCAN)
      .lean();
    const filtered = batches.filter((batch) =>
      this.matchesDerivedFilters(batch, query)
    );
    const shouldSortByProjectRank = this.shouldSortByProjectRank(query);
    const projectsForSort = shouldSortByProjectRank
      ? await this.loadCanonicalProjects(filtered)
      : undefined;
    const sorted = shouldSortByProjectRank
      ? this.sortByProjectRank(filtered, projectsForSort || new Map())
      : filtered;
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const pageBatches = sorted.slice((page - 1) * limit, page * limit);
    const projects = projectsForSort || (await this.loadCanonicalProjects(pageBatches));
    const items = pageBatches.map((batch) =>
      this.toReviewCase(batch, projects.get(this.idString(batch.canonicalProjectId)))
    );

    return {
      items,
      total,
      page,
      limit,
      pages,
      counts: this.buildCounts(filtered),
    };
  }

  async get(id: string) {
    const batch = await this.findBatch(id);
    const [projects, importCandidates] = await Promise.all([
      this.loadCanonicalProjects([batch]),
      this.loadRelatedImportCandidates(batch),
    ]);

    return this.toReviewCase(
      batch,
      projects.get(this.idString(batch.canonicalProjectId)),
      {
        importCandidates,
        includeDetails: true,
      }
    );
  }

  async stageUnlocks(
    id: string,
    input: FomoV2ReviewCaseUnlockStageInput = {},
    user?: Record<string, any>
  ) {
    const batch = await this.findBatch(id);
    if (!this.vestingReviewApplyService.canApplyReviewBatch(batch)) {
      throw new BadRequestException(
        "Unlocks can only be staged for applicable vesting review cases."
      );
    }
    const canonicalProjectId = this.toObjectId(batch.canonicalProjectId);
    if (!canonicalProjectId) {
      throw new BadRequestException("Review case has no canonical project.");
    }

    const firstCandidate = (batch.candidates || [])[0] || {};
    const firstPayload = firstCandidate.payload || {};
    const stage = await this.unlockEventsImportService.stageProjectUnlocks({
      canonicalProjectId,
      source: input.source || input.sourceType || firstCandidate.sourceType,
      sourceType:
        input.sourceType ||
        input.source ||
        firstCandidate.sourceType ||
        batch.incomingSourceType ||
        batch.currentSourceType ||
        "dropstab",
      sourceSlug:
        firstPayload.sourceSlug ||
        readPath(firstCandidate, "normalizedPayload.normalizedSlug"),
      sourceProjectKey: firstPayload.sourceProjectKey || firstCandidate.sourceId,
      sourceDocumentId: firstPayload.sourceDocumentId,
    });

    const rawSource: Record<string, any> = {
      ...toPlainObject(firstPayload.rawSource),
      unlockingEvents: stage.rawSource.unlockingEvents || [],
    };
    if (stage.rawSource.nextUnlockingEvent) {
      rawSource.nextUnlockingEvent = stage.rawSource.nextUnlockingEvent;
    } else {
      delete rawSource.nextUnlockingEvent;
    }

    const now = new Date();
    const updated = await this.reviewBatchModel
      .findByIdAndUpdate(
        batch._id,
        {
          $set: {
            "candidates.0.payload.rawSource": rawSource,
            "candidates.0.payload.unlockStage": stage,
            "metadata.unlockStage": {
              ...stage,
              stagedBy: this.userLabel(user),
              stagedAt: now,
            },
            lastSeenAt: now,
          },
        },
        { new: true }
      )
      .lean();

    const [projects, importCandidates] = await Promise.all([
      this.loadCanonicalProjects(updated ? [updated] : []),
      updated ? this.loadRelatedImportCandidates(updated) : [],
    ]);

    return {
      unlockStage: stage,
      reviewCase: this.toReviewCase(
        updated || batch,
        projects.get(this.idString((updated || batch).canonicalProjectId)),
        {
          includeDetails: true,
          importCandidates,
        }
      ),
    };
  }

  async getProjectVesting(canonicalProjectId: string) {
    const project = await this.loadCanonicalProjectById(canonicalProjectId);
    const vesting =
      await this.vestingReviewApplyService.getConfirmedProjectVesting(
        project._id
      );
    return {
      project: this.projectSummary(project),
      vesting,
    };
  }

  async updateProjectVesting(
    canonicalProjectId: string,
    input: FomoV2ProjectVestingUpdateInput = {},
    user?: Record<string, any>
  ) {
    const project = await this.loadCanonicalProjectById(canonicalProjectId);
    const currentVesting =
      await this.vestingReviewApplyService.getConfirmedProjectVesting(
        project._id
      );
    const rawSource =
      input.vestingOverride !== undefined
        ? input.vestingOverride
        : input.rawSource || {};
    const applyResult =
      await this.vestingReviewApplyService.replaceProjectVestingFromRaw({
        canonicalProjectId: project._id,
        sourceType:
          cleanString(input.sourceType) ||
          currentVesting.sourceType ||
          "manual",
        sourceSlug:
          cleanString(input.sourceSlug) ||
          currentVesting.sourceSlug ||
          cleanString(project.slug),
        sourceProjectKey:
          cleanString(input.sourceProjectKey) ||
          currentVesting.sourceProjectKey ||
          this.projectFallbackSourceKey(project),
        sourceUrl: cleanString(input.sourceUrl) || currentVesting.sourceUrl,
        projectName: cleanString(project.name),
        symbol: cleanString(project.symbol),
        rawSource,
      });

    if (applyResult.applied) {
      await this.canonicalProjectModel.updateOne(
        { _id: project._id },
        { $set: { isVestingReview: true } }
      );
    }

    const [updatedProject, vesting] = await Promise.all([
      this.loadCanonicalProjectById(canonicalProjectId),
      this.vestingReviewApplyService.getConfirmedProjectVesting(project._id),
    ]);

    return {
      project: this.projectSummary(updatedProject),
      vesting,
      applyResult,
      decision: {
        decisionNote: cleanString(input.decisionNote || input.note),
        reviewedBy: this.userLabel(user),
        reviewedAt: new Date().toISOString(),
      },
    };
  }

  async approve(
    id: string,
    input: FomoV2ReviewCaseDecisionInput = {},
    user?: Record<string, any>
  ) {
    return this.recordDecision(id, "approve", input, user);
  }

  async reject(
    id: string,
    input: FomoV2ReviewCaseDecisionInput = {},
    user?: Record<string, any>
  ) {
    return this.recordDecision(id, "reject", input, user);
  }

  async ignore(
    id: string,
    input: FomoV2ReviewCaseDecisionInput = {},
    user?: Record<string, any>
  ) {
    return this.recordDecision(id, "ignore", input, user);
  }

  async sendToParser(
    id: string,
    input: FomoV2ReviewCaseDecisionInput = {},
    user?: Record<string, any>
  ) {
    return this.recordDecision(id, "send_to_parser", input, user);
  }

  async generate(limit = 1000) {
    const cappedLimit = this.parsePositiveInteger(limit, 1000, 1, 10000);
    const batches = await this.reviewBatchModel
      .find({})
      .sort({ lastSeenAt: -1, updatedAt: -1, _id: -1 })
      .limit(cappedLimit)
      .lean();
    const byDomain = this.countBy(batches, (batch) => batch.domain || "unknown");
    const byType = this.countBy(batches, (batch) => this.reviewType(batch));

    return {
      totals: {
        generatedCandidates: batches.length,
        uniqueCandidates: batches.length,
        created: 0,
        existing: batches.length,
        updated: 0,
      },
      byDomain,
      byType,
      sources: {
        review_batches: {
          scanned: batches.length,
          note: "Review batches are created by domain import runners.",
        },
      },
    };
  }

  private async recordDecision(
    id: string,
    action: ReviewAction,
    input: FomoV2ReviewCaseDecisionInput,
    user?: Record<string, any>
  ) {
    const batch = await this.findBatch(id);
    const rawStatus = cleanString(batch.status) || "open";
    if (rawStatus !== "open") {
      throw new ConflictException("Review case is already resolved.");
    }

    const now = new Date();
    const isVestingReviewBatch =
      this.vestingReviewApplyService.canApplyReviewBatch(batch);

    if (
      action === "approve" &&
      input.vestingOverride &&
      !isVestingReviewBatch
    ) {
      throw new BadRequestException(
        "Vesting override can only be applied to vesting review cases."
      );
    }

    if (
      action === "approve" &&
      input.vestingOverride &&
      input.applyDecision !== true
    ) {
      throw new BadRequestException(
        "Vesting override requires applyDecision=true."
      );
    }

    const canApplyVestingReview =
      action === "approve" &&
      input.applyDecision === true &&
      isVestingReviewBatch;
    const claim = await this.claimDecision(batch, action, user);
    const claimedBatch = claim.batch;
    let applyResult: Record<string, any> | undefined;
    try {
      applyResult = canApplyVestingReview
        ? await this.vestingReviewApplyService.applyReviewBatch(claimedBatch, {
            rawSourceOverride: input.vestingOverride,
          })
        : undefined;
    } catch (error) {
      try {
        await this.releaseDecisionClaim(claimedBatch._id, claim.token);
      } catch (releaseError) {
        this.logger.error(
          `Failed to release review decision claim batch=${this.idString(
            claimedBatch._id
          )}: ${releaseError?.message || releaseError}`
        );
      }
      throw error;
    }
    const decision = {
      action,
      reason: cleanString(input.reason),
      decisionNote: cleanString(input.decisionNote || input.note),
      applyDecision: Boolean(applyResult?.applied),
      applyResult,
      vestingOverrideApplied: Boolean(
        input.vestingOverride && applyResult?.applied
      ),
      vestingOverrideCounts: this.vestingOverrideCounts(input.vestingOverride),
      reviewedBy: this.userLabel(user),
      reviewedAt: now,
    };
    const status = this.statusForAction(action);
    const finalUpdate: Record<string, any> = {
      $set: {
        status,
        lastSeenAt: now,
        "metadata.decision": decision,
      },
      $push: { "metadata.decisionHistory": decision },
      $unset: { "metadata.decisionClaim": 1 },
    };
    if (action === "send_to_parser") {
      finalUpdate.$set["metadata.parserRequest"] = {
        reason: decision.reason || "admin_review_case",
        note: decision.decisionNote,
        requestedBy: decision.reviewedBy,
        requestedAt: now,
      };
    }

    const updated = await this.reviewBatchModel
      .findOneAndUpdate(
        {
          _id: claimedBatch._id,
          status: "open",
          "metadata.decisionClaim.token": claim.token,
        },
        finalUpdate,
        { new: true }
      )
      .lean();
    if (!updated) {
      throw new ConflictException(
        "Review case decision claim was lost before it could be finalized."
      );
    }

    await this.markRelatedImportCandidates(
      claimedBatch,
      status,
      action,
      decision
    );
    if (canApplyVestingReview && applyResult?.applied) {
      await this.markCanonicalProjectVestingReviewed(updated);
    }

    const [projects, importCandidates] = await Promise.all([
      this.loadCanonicalProjects([updated]),
      this.loadRelatedImportCandidates(updated),
    ]);

    return this.toReviewCase(
      updated,
      projects.get(this.idString(updated.canonicalProjectId)),
      {
        includeDetails: true,
        importCandidates,
      }
    );
  }

  private async claimDecision(
    batch: any,
    action: ReviewAction,
    user?: Record<string, any>
  ): Promise<{ batch: any; token: string }> {
    const token = new Types.ObjectId().toHexString();
    const claimedAt = new Date();
    const expiresAt = new Date(claimedAt.getTime() + DECISION_CLAIM_LEASE_MS);
    const staleBefore = new Date(claimedAt.getTime() - DECISION_CLAIM_LEASE_MS);
    const claimed = await this.reviewBatchModel
      .findOneAndUpdate(
        {
          _id: batch._id,
          status: "open",
          $or: [
            { "metadata.decisionClaim": { $exists: false } },
            { "metadata.decisionClaim.expiresAt": { $lte: claimedAt } },
            {
              "metadata.decisionClaim.expiresAt": { $exists: false },
              "metadata.decisionClaim.claimedAt": { $lte: staleBefore },
            },
          ],
        },
        {
          $set: {
            "metadata.decisionClaim": {
              token,
              action,
              claimedBy: this.userLabel(user),
              claimedAt,
              expiresAt,
            },
          },
        },
        { new: true }
      )
      .lean();

    if (!claimed) {
      throw new ConflictException(
        "Review case is already resolved or another decision is in progress."
      );
    }
    return { batch: claimed, token };
  }

  private async releaseDecisionClaim(
    batchId: Types.ObjectId | string,
    token: string
  ): Promise<void> {
    await this.reviewBatchModel.updateOne(
      {
        _id: batchId,
        status: "open",
        "metadata.decisionClaim.token": token,
      },
      { $unset: { "metadata.decisionClaim": 1 } }
    );
  }

  private async markRelatedImportCandidates(
    batch: any,
    status: FomoV2ReviewStatus,
    action: ReviewAction,
    decision: Record<string, any>
  ) {
    const filter = this.importCandidateLookupFilter(batch);
    if (!filter) return;
    await this.importCandidateModel.updateMany(filter, {
      $set: {
        status,
        "metadata.reviewDecision": {
          action,
          decisionNote: decision.decisionNote,
          reason: decision.reason,
          reviewedBy: decision.reviewedBy,
          reviewedAt: decision.reviewedAt,
        },
      },
    });
  }

  private async markCanonicalProjectVestingReviewed(batch: any) {
    const canonicalProjectId = this.toObjectId(batch?.canonicalProjectId);
    if (!canonicalProjectId) return;
    await this.canonicalProjectModel.updateOne(
      { _id: canonicalProjectId },
      { $set: { isVestingReview: true } }
    );
  }

  private async findBatch(id: string): Promise<any> {
    const query = Types.ObjectId.isValid(id)
      ? { _id: new Types.ObjectId(id) }
      : { fingerprint: id };
    const batch = await this.reviewBatchModel.findOne(query).lean();
    if (!batch) throw new NotFoundException("Review case not found");
    return batch;
  }

  private buildDirectMatch(query: FomoV2ReviewCaseAdminQuery) {
    const match: Record<string, any> = {};
    const domains = toList(query.domain);
    if (domains.length) match.domain = { $in: domains };

    const sources = toList(query.source);
    if (sources.length) {
      match.$or = [
        { currentSourceType: { $in: sources } },
        { incomingSourceType: { $in: sources } },
        { "candidates.sourceType": { $in: sources } },
      ];
    }

    const canonicalProjectId = cleanString(query.canonicalProjectId);
    if (canonicalProjectId) {
      match.canonicalProjectId = Types.ObjectId.isValid(canonicalProjectId)
        ? new Types.ObjectId(canonicalProjectId)
        : canonicalProjectId;
    }

    const search = cleanString(query.search);
    if (search) {
      const regex = new RegExp(escapeRegExp(search), "i");
      const searchFilters: Record<string, any>[] = [
        { fingerprint: regex },
        { reason: regex },
        { projectKey: regex },
        { projectName: regex },
        { normalizedProjectName: regex },
        { currentSourceType: regex },
        { incomingSourceType: regex },
        { "candidates.sourceId": regex },
        { "candidates.sourcePath": regex },
        { "candidates.sourceUrl": regex },
        { "candidates.payload.sourceSlug": regex },
        { "candidates.payload.sourceProjectKey": regex },
        { "candidates.payload.sourceDocumentId": regex },
        { "candidates.normalizedPayload.normalizedSlug": regex },
      ];
      if (Types.ObjectId.isValid(search)) {
        searchFilters.push(
          { _id: new Types.ObjectId(search) },
          { canonicalProjectId: new Types.ObjectId(search) }
        );
      }
      match.$and = [...(match.$and || []), { $or: searchFilters }];
    }

    return match;
  }

  private matchesDerivedFilters(
    batch: any,
    query: FomoV2ReviewCaseAdminQuery
  ) {
    const statuses = toList(query.status);
    if (statuses.length) {
      const publicStatus = this.publicStatus(batch);
      const rawStatus = cleanString(batch.status);
      if (!statuses.includes(publicStatus) && !statuses.includes(rawStatus)) {
        return false;
      }
    }

    const severities = toList(query.severity);
    if (severities.length && !severities.includes(this.severity(batch))) {
      return false;
    }

    const type = this.reviewType(batch);
    const reason = cleanString(batch.reason).toLowerCase();
    const types = toList(query.type);
    if (types.length) {
      if (!types.includes(type) && !types.includes(reason)) return false;
    }

    const excludedTypes = Array.from(
      new Set([...toList(query.excludeType), ...toList(query.excludedTypes)])
    );
    if (excludedTypes.length) {
      if (excludedTypes.includes(type) || excludedTypes.includes(reason)) {
        return false;
      }
    }

    return true;
  }

  private async loadCanonicalProjects(batches: any[]) {
    const ids = uniqueStrings(
      batches
        .map((batch) => this.idString(batch.canonicalProjectId))
        .filter(Boolean)
    )
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (!ids.length) return new Map<string, any>();
    const projects = await this.canonicalProjectModel
      .find({ _id: { $in: ids } })
      .lean();
    const readModels = await this.marketProjectReadModel
      .find({ canonicalProjectId: { $in: ids } })
      .lean();
    const readModelsByProject = new Map(
      readModels.map((readModel: any) => [
        this.idString(readModel.canonicalProjectId),
        readModel,
      ])
    );
    return new Map(
      projects.map((project: any) => [
        this.idString(project._id),
        {
          ...project,
          marketReadModel: readModelsByProject.get(this.idString(project._id)),
        },
      ])
    );
  }

  private async loadCanonicalProjectById(canonicalProjectId: string) {
    const id = this.toObjectId(canonicalProjectId);
    if (!id) throw new NotFoundException("Canonical project not found");
    const [project, marketReadModel] = await Promise.all([
      this.canonicalProjectModel.findById(id).lean(),
      this.marketProjectReadModel.findOne({ canonicalProjectId: id }).lean(),
    ]);
    if (!project) throw new NotFoundException("Canonical project not found");
    return {
      ...project,
      marketReadModel,
    };
  }

  private shouldSortByProjectRank(query: FomoV2ReviewCaseAdminQuery) {
    return ["project_rank", "rank", "top"].includes(cleanString(query.sort));
  }

  private sortByProjectRank(
    batches: any[],
    projects: Map<string, any>
  ): any[] {
    return [...batches].sort((left, right) => {
      const leftProject = projects.get(this.idString(left.canonicalProjectId));
      const rightProject = projects.get(this.idString(right.canonicalProjectId));
      const leftRank = this.projectRank(leftProject);
      const rightRank = this.projectRank(rightProject);
      if (leftRank !== rightRank) return leftRank - rightRank;

      const leftMarketCap = this.firstFiniteNumber(
        leftProject?.marketReadModel?.marketCap,
        readPath(leftProject, "metadata.ratingBreakdown.inputs.marketCap"),
        readPath(leftProject, "ratingBreakdown.inputs.marketCap")
      );
      const rightMarketCap = this.firstFiniteNumber(
        rightProject?.marketReadModel?.marketCap,
        readPath(rightProject, "metadata.ratingBreakdown.inputs.marketCap"),
        readPath(rightProject, "ratingBreakdown.inputs.marketCap")
      );
      if (leftMarketCap !== rightMarketCap) return rightMarketCap - leftMarketCap;

      return (
        this.dateSortValue(right.lastSeenAt || right.updatedAt) -
        this.dateSortValue(left.lastSeenAt || left.updatedAt)
      );
    });
  }

  private async loadRelatedImportCandidates(batch: any) {
    const filter = this.importCandidateLookupFilter(batch);
    if (!filter) return [];
    const candidates = await this.importCandidateModel
      .find(filter)
      .sort({ lastSeenAt: -1, updatedAt: -1, _id: -1 })
      .limit(50)
      .lean();
    return candidates.map((candidate) => this.serializeImportCandidate(candidate));
  }

  private importCandidateLookupFilter(batch: any) {
    const sourceSlugs = new Set<string>();
    const sourceIds = new Set<string>();
    const sourcePaths = new Set<string>();
    const sourceDocumentIds = new Set<string>();
    const sourceProjectKeys = new Set<string>();
    const canonicalProjectIds = new Set<string>();

    addSet(sourceProjectKeys, batch.projectKey);
    addSet(canonicalProjectIds, this.idString(batch.canonicalProjectId));

    for (const candidate of batch.candidates || []) {
      addSet(sourceIds, candidate.sourceId);
      addSet(sourcePaths, candidate.sourcePath);
      addSet(sourceSlugs, readPath(candidate, "payload.sourceSlug"));
      addSet(sourceSlugs, readPath(candidate, "normalizedPayload.normalizedSlug"));
      addSet(sourceDocumentIds, readPath(candidate, "payload.sourceDocumentId"));
      addSet(sourceProjectKeys, readPath(candidate, "payload.sourceProjectKey"));
      addSet(canonicalProjectIds, readPath(candidate, "payload.canonicalProjectId"));
    }

    const or: Record<string, any>[] = [];
    pushIn(or, "sourceSlug", sourceSlugs);
    pushIn(or, "normalizedSlug", sourceSlugs);
    pushIn(or, "payload.sourceSlug", sourceSlugs);
    pushIn(or, "sourceId", sourceIds);
    pushIn(or, "payload.sourceProjectKey", sourceProjectKeys);
    pushIn(or, "sourcePath", sourcePaths);
    pushIn(or, "payload.sourceDocumentId", sourceDocumentIds);
    pushIn(or, "payload.canonicalProjectId", canonicalProjectIds);

    if (!or.length) return null;
    return {
      domain: batch.domain,
      $or: or,
    };
  }

  private toReviewCase(
    batch: any,
    canonicalProject?: any,
    options: {
      includeDetails?: boolean;
      importCandidates?: Array<Record<string, any>>;
    } = {}
  ) {
    const firstCandidate = (batch.candidates || [])[0] || {};
    const firstPayload = firstCandidate.payload || {};
    const firstMetadata = firstCandidate.metadata || {};
    const type = this.reviewType(batch);
    const source = firstCandidate.sourceType || batch.incomingSourceType || batch.currentSourceType || "system";
    const sourceSlug =
      firstPayload.sourceSlug ||
      readPath(firstCandidate, "normalizedPayload.normalizedSlug") ||
      undefined;
    const sourceId =
      firstCandidate.sourceId || firstPayload.sourceProjectKey || batch.projectKey;
    const sourceUrl = firstCandidate.sourceUrl || firstPayload.sourceUrl;
    const suggestedAction =
      firstMetadata.suggestedAction ||
      readPath(batch, "metadata.suggestedAction") ||
      "manual_review";
    const importCandidates = options.importCandidates || [];

    return {
      id: this.idString(batch._id),
      _id: this.idString(batch._id),
      caseKey: batch.fingerprint,
      type,
      domain: batch.domain,
      status: this.publicStatus(batch),
      severity: this.severity(batch),
      title: this.title(batch, type, sourceSlug || sourceId),
      description: this.description(batch, firstPayload),
      canonicalProjectId: this.idString(batch.canonicalProjectId) || undefined,
      sourceEntityId: this.idString(firstCandidate.sourceEntityId) || undefined,
      targetCollection:
        firstPayload.sourceCollection ||
        (batch.affectedEntityTypes || []).join(", ") ||
        undefined,
      source,
      sourceId,
      sourceSlug,
      sourceUrl,
      suggestedAction,
      confidence: this.confidence(batch),
      payload: this.payload(batch, firstPayload, {
        includeDetails: options.includeDetails,
        importCandidates,
      }),
      candidates: batch.candidates || [],
      evidenceIds: uniqueStrings([
        this.idString(firstCandidate.sourceSnapshotId),
        firstPayload.sourceDocumentId,
      ]).filter(Boolean),
      conflictIds: this.conflictIds(firstPayload),
      reviewedBy: readPath(batch, "metadata.decision.reviewedBy"),
      reviewedAt: this.iso(readPath(batch, "metadata.decision.reviewedAt")),
      decisionNote: readPath(batch, "metadata.decision.decisionNote"),
      decisionHistory: readPath(batch, "metadata.decisionHistory") || [],
      createdAt: this.iso(batch.createdAt || batch.firstSeenAt),
      updatedAt: this.iso(batch.updatedAt || batch.lastSeenAt),
      canonicalProject: canonicalProject
        ? this.projectSummary(canonicalProject)
        : undefined,
    };
  }

  private payload(
    batch: any,
    firstPayload: Record<string, any>,
    options: {
      includeDetails?: boolean;
      importCandidates?: Array<Record<string, any>>;
    }
  ) {
    const metadata = batch.metadata || {};
    const payload: Record<string, any> = {
      reason: batch.reason,
      metadata,
      issueSummary: firstPayload.issueSummary,
      relationIssues: firstPayload.relationIssues,
      normalizedCandidates: firstPayload.normalizedCandidates,
      rawSource: firstPayload.rawSource,
      existingSourceCounts: metadata.existingSourceCounts,
      reviewBatch: {
        id: this.idString(batch._id),
        fingerprint: batch.fingerprint,
        projectKey: batch.projectKey,
        projectName: batch.projectName,
        currentSourceType: batch.currentSourceType,
        incomingSourceType: batch.incomingSourceType,
        affectedEntityTypes: batch.affectedEntityTypes || [],
        candidateCount: batch.candidateCount,
        seenCount: batch.seenCount,
        firstSeenAt: this.iso(batch.firstSeenAt),
        lastSeenAt: this.iso(batch.lastSeenAt),
      },
    };

    if (options.includeDetails) {
      payload.importCandidates = options.importCandidates || [];
      payload.importCandidateCount = options.importCandidates?.length || 0;
    }

    return payload;
  }

  private serializeImportCandidate(candidate: any) {
    return {
      id: this.idString(candidate._id),
      _id: this.idString(candidate._id),
      domain: candidate.domain,
      entityType: candidate.entityType,
      sourceType: candidate.sourceType,
      sourceId: candidate.sourceId,
      sourceSlug: candidate.sourceSlug,
      sourceUrl: candidate.sourceUrl,
      sourcePath: candidate.sourcePath,
      name: candidate.name,
      symbol: candidate.symbol,
      slug: candidate.slug,
      normalizedName: candidate.normalizedName,
      normalizedSymbol: candidate.normalizedSymbol,
      normalizedSlug: candidate.normalizedSlug,
      candidateFingerprint: candidate.candidateFingerprint,
      status: candidate.status,
      seenCount: candidate.seenCount,
      payload: candidate.payload || {},
      normalizedPayload: candidate.normalizedPayload || {},
      metadata: candidate.metadata || {},
      createdAt: this.iso(candidate.createdAt),
      updatedAt: this.iso(candidate.updatedAt),
      firstSeenAt: this.iso(candidate.firstSeenAt),
      lastSeenAt: this.iso(candidate.lastSeenAt),
    };
  }

  private reviewType(batch: any) {
    const reason = cleanString(batch.reason);
    const reviewScope = cleanString(readPath(batch, "metadata.reviewScope"));
    const firstPayload = ((batch.candidates || [])[0] || {}).payload || {};
    const relationIssueType = cleanString(firstPayload.relationIssueType);

    if (reason === "EXISTING_SOURCE_VESTING" || reviewScope === "existing_vesting_source") {
      return "existing_vesting_source";
    }
    if (
      reason === "MISSING_REQUIRED_RELATION" &&
      (reviewScope === "whole_vesting_component" ||
        relationIssueType === "vesting_component_relation_conflict_or_missing")
    ) {
      return "vesting_component_relation_review";
    }
    if (reason === "MISSING_CANONICAL_PROJECT") return "missing_canonical_project";
    if (reason === "POTENTIAL_PROJECT_MATCH") return "ambiguous_canonical_match";
    if (reason === "SOURCE_CONFLICT") return "source_conflict";
    if (reason === "LOW_CONFIDENCE_MATCH") return "low_confidence_evidence";
    if (reason === "BACKER_AMBIGUOUS") return "ambiguous_weak_backer";
    if (reason === "BACKER_POTENTIAL_MATCH") return "unresolved_backer";
    if (reason === "BACKER_NEW_CANDIDATE") return "missing_canonical_project";
    if (reason === "ROUND_VALIDATION_FAILED") return "funding_round_duplicate_conflict";
    if (reason === "SCHEMA_VALIDATION_FAILED") return "parser_data_quality_warning";
    return reason.toLowerCase();
  }

  private severity(batch: any): "low" | "medium" | "high" {
    const reason = cleanString(batch.reason);
    if (
      [
        "SOURCE_CONFLICT",
        "EXISTING_SOURCE_VESTING",
        "MISSING_REQUIRED_RELATION",
        "SCHEMA_VALIDATION_FAILED",
      ].includes(reason)
    ) {
      return "high";
    }
    if (
      [
        "MISSING_CANONICAL_PROJECT",
        "POTENTIAL_PROJECT_MATCH",
        "LOW_CONFIDENCE_MATCH",
        "BACKER_AMBIGUOUS",
        "BACKER_POTENTIAL_MATCH",
        "ROUND_VALIDATION_FAILED",
      ].includes(reason)
    ) {
      return "medium";
    }
    return "low";
  }

  private publicStatus(batch: any) {
    const status = cleanString(batch.status) || "open";
    if (status === "open" || status === "superseded") return status;
    const action = cleanString(readPath(batch, "metadata.decision.action"));
    if (action === "approve") return "approved";
    if (action === "reject") return "rejected";
    if (action === "send_to_parser") return "sent_to_parser";
    if (action === "ignore") return "ignored";
    return status;
  }

  private statusForAction(action: ReviewAction): FomoV2ReviewStatus {
    if (action === "reject" || action === "ignore") return "ignored";
    return "resolved";
  }

  private title(batch: any, type: string, sourceIdentity?: string) {
    const name =
      batch.projectName ||
      readPath(batch, "candidates.0.payload.sourceSlug") ||
      sourceIdentity ||
      batch.projectKey ||
      this.idString(batch.canonicalProjectId) ||
      "Unknown project";
    if (type === "existing_vesting_source") return `Existing vesting source: ${name}`;
    if (type === "vesting_component_relation_review") return `Vesting review: ${name}`;
    if (type === "ambiguous_canonical_match") return `Project match review: ${name}`;
    if (type === "missing_canonical_project") return `Missing canonical project: ${name}`;
    return `${pretty(batch.domain)} review: ${name}`;
  }

  private description(batch: any, firstPayload: Record<string, any>) {
    const metadata = batch.metadata || {};
    const issueSummary = firstPayload.issueSummary || {};
    const reasonText =
      metadata.reason ||
      firstPayload.reason ||
      cleanString(batch.reason).replace(/_/g, " ");
    const counts = [
      ["allocations", issueSummary.tokenAllocationCount ?? metadata.tokenAllocationCount],
      ["rounds", issueSummary.vestingRoundCount ?? metadata.vestingRoundCount],
      ["schedules", issueSummary.vestingScheduleCount ?? metadata.vestingScheduleCount],
      [
        "unlinked allocations",
        issueSummary.unlinkedTokenAllocationCount ??
          metadata.unlinkedTokenAllocationCount,
      ],
      [
        "unlinked rounds",
        issueSummary.unlinkedVestingRoundCount ??
          metadata.unlinkedVestingRoundCount,
      ],
    ]
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([label, value]) => `${label}: ${value}`)
      .join(", ");
    return counts ? `${reasonText} (${counts})` : reasonText;
  }

  private confidence(batch: any): "low" | "medium" | "high" | undefined {
    const values = (batch.candidates || [])
      .map((candidate: any) => candidate.confidence)
      .filter(Boolean);
    if (values.includes("high")) return "high";
    if (values.includes("medium")) return "medium";
    if (values.includes("low")) return "low";
    return undefined;
  }

  private conflictIds(firstPayload: Record<string, any>) {
    const relationIssues = Array.isArray(firstPayload.relationIssues)
      ? firstPayload.relationIssues
      : [];
    return relationIssues
      .map((issue: any) => issue.sourcePath || issue.roundName || issue.saleId)
      .filter(Boolean)
      .map(String);
  }

  private projectSummary(project: any) {
    const marketReadModel = project.marketReadModel || {};
    const rank = this.projectRank(project);
    const marketCap = this.firstFiniteNumber(
      marketReadModel.marketCap,
      readPath(project, "metadata.ratingBreakdown.inputs.marketCap"),
      readPath(project, "ratingBreakdown.inputs.marketCap")
    );
    return {
      id: this.idString(project._id),
      _id: this.idString(project._id),
      name: project.name || marketReadModel.name,
      canonicalName: project.name,
      symbol: project.symbol || marketReadModel.symbol,
      slug: project.slug || marketReadModel.slug,
      status: project.status,
      isVestingReview: Boolean(project.isVestingReview),
      rank: rank === Number.MAX_SAFE_INTEGER ? undefined : rank,
      marketCap: marketCap || undefined,
      primaryWebsiteDomain: project.primaryWebsiteDomain,
      profileStatus: project.metadata?.profileStatus,
      categories: project.metadata?.categories || marketReadModel.categories,
      ecosystems: project.metadata?.ecosystems,
      logoUrl:
        project.metadata?.logoUrl ||
        project.metadata?.imageUrl ||
        project.metadata?.image ||
        project.logoUrl ||
        project.imageUrl ||
        project.image ||
        project.logo ||
        marketReadModel.logoUrl ||
        marketReadModel.imageUrl ||
        marketReadModel.image ||
        marketReadModel.logo,
      bannerUrl: project.metadata?.bannerUrl,
      tagline: project.metadata?.tagline,
    };
  }

  private projectRank(project: any): number {
    const rank = this.firstFiniteNumber(
      project?.marketReadModel?.rank,
      project?.rank,
      project?.marketCapRank,
      readPath(project, "metadata.marketCapRank"),
      readPath(project, "metadata.ratingBreakdown.inputs.rank"),
      readPath(project, "ratingBreakdown.inputs.rank")
    );
    return rank > 0 ? rank : Number.MAX_SAFE_INTEGER;
  }

  private projectFallbackSourceKey(project: any): string | undefined {
    return (
      cleanString(readPath(project, "providerIds.dropstabId")) ||
      cleanString(readPath(project, "providerIds.coingeckoId")) ||
      cleanString(project.slug) ||
      this.idString(project._id) ||
      undefined
    );
  }

  private buildCounts(batches: any[]) {
    const byDomain = this.countBy(batches, (batch) => batch.domain || "unknown");
    const byStatus = this.countBy(batches, (batch) => this.publicStatus(batch));
    const bySeverity = this.countBy(batches, (batch) => this.severity(batch));
    const byType = this.countBy(batches, (batch) => this.reviewType(batch));

    return {
      all: batches.length,
      open: byStatus.open || 0,
      byDomain,
      byStatus,
      bySeverity,
      byType,
    };
  }

  private countBy<T>(items: T[], selector: (item: T) => string) {
    return items.reduce<Record<string, number>>((acc, item) => {
      const key = selector(item) || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }

  private parsePositiveInteger(
    value: any,
    fallback: number,
    min = 1,
    max = Number.MAX_SAFE_INTEGER
  ) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, Math.floor(parsed)));
  }

  private firstFiniteNumber(...values: any[]): number {
    for (const value of values) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
  }

  private dateSortValue(value: any): number {
    if (!value) return 0;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  private idString(value: any): string {
    if (!value) return "";
    if (value instanceof Types.ObjectId) return value.toHexString();
    if (typeof value === "object" && typeof value.toHexString === "function") {
      return value.toHexString();
    }
    return String(value);
  }

  private toObjectId(value: any): Types.ObjectId | undefined {
    if (!value) return undefined;
    if (value instanceof Types.ObjectId) return value;
    const text = this.idString(value);
    return text && Types.ObjectId.isValid(text)
      ? new Types.ObjectId(text)
      : undefined;
  }

  private iso(value: any): string | undefined {
    if (!value) return undefined;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString();
  }

  private userLabel(user?: Record<string, any>) {
    return (
      cleanString(user?._id) ||
      cleanString(user?.id) ||
      cleanString(user?.email) ||
      cleanString(user?.username) ||
      "admin"
    );
  }

  private vestingOverrideCounts(input: any) {
    if (!input || typeof input !== "object") return undefined;
    const source =
      input.rawSource && typeof input.rawSource === "object"
        ? input.rawSource
        : input;
    const summary =
      source.vestingSummary &&
      typeof source.vestingSummary === "object" &&
      !Array.isArray(source.vestingSummary)
        ? source.vestingSummary
        : undefined;
    return {
      tokenAllocation: Array.isArray(source.tokenAllocation)
        ? source.tokenAllocation.length
        : 0,
      vestingRounds: Array.isArray(source.vestingRounds)
        ? source.vestingRounds.length
        : 0,
      vestingSchedule: Array.isArray(source.vestingSchedule)
        ? source.vestingSchedule.length
        : 0,
      vestingTimeline: Array.isArray(source.vestingTimeline)
        ? source.vestingTimeline.length
        : 0,
      unlockingEvents: Array.isArray(source.unlockingEvents)
        ? source.unlockingEvents.length
        : 0,
      hasVestingSummary: Boolean(summary),
    };
  }
}

function toList(value: any): string[] {
  return String(value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function cleanString(value: any): string {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function toPlainObject(value: any): Record<string, any> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function uniqueStrings(values: any[]): string[] {
  return Array.from(new Set(values.map(cleanString).filter(Boolean)));
}

function addSet(set: Set<string>, value: any) {
  const text = cleanString(value);
  if (text) set.add(text);
}

function pushIn(or: Record<string, any>[], field: string, values: Set<string>) {
  const list = Array.from(values);
  if (list.length) or.push({ [field]: { $in: list } });
}

function readPath(input: any, path: string): any {
  return path
    .split(".")
    .reduce((value, key) => (value === undefined || value === null ? undefined : value[key]), input);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pretty(value: any) {
  return cleanString(value).replace(/_/g, " ");
}
