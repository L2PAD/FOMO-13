import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { FilterQuery, Model, Types } from "mongoose";
import { FomoV2CanonicalProject } from "../../../models";
import {
  FomoV2ActivityAdminListQueryDto,
  FomoV2ActivityDecisionDto,
  FomoV2ActivityPatchDto,
} from "../dto";
import {
  activityActor,
  activityDifferingFields,
  assertActivityDraftPublishable,
  mergeActivityContent,
  resolveActivityByIdentity,
  sanitizeActivityContent,
} from "../helpers";
import { FomoV2Activity, FomoV2ActivityDocument } from "../models";
import {
  FomoV2ActivityAuditAction,
  FomoV2ActivityCanonicalStatus,
  FomoV2ActivityContent,
  FomoV2ActivityPublicationStatus,
} from "../types";

const MAX_AUDIT_ENTRIES = 200;
const MAX_AI_PROPOSALS = 20;

@Injectable()
export class FomoV2ActivityAdminService {
  constructor(
    @InjectModel(FomoV2Activity.name)
    private readonly activityModel: Model<FomoV2ActivityDocument>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>
  ) {}

  async list(query: FomoV2ActivityAdminListQueryDto = {}) {
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    const contextMatch = this.buildContextMatch(query);
    const listMatch = this.buildAdminMatch(query, contextMatch);
    const [rows, total, countFacets] = await Promise.all([
      this.activityModel
        .find(listMatch, this.adminListProjection())
        .sort({ updatedAt: -1, _id: -1 })
        .skip(offset)
        .limit(limit)
        .lean()
        .exec(),
      this.activityModel.countDocuments(listMatch),
      this.activityModel
        .aggregate([
          { $match: contextMatch },
          {
            $facet: {
              all: [{ $count: "count" }],
              byReviewStatus: [
                { $group: { _id: "$reviewStatus", count: { $sum: 1 } } },
              ],
              byPublicationStatus: [
                { $group: { _id: "$publicationStatus", count: { $sum: 1 } } },
              ],
              byAccessTier: [
                { $group: { _id: "$accessTier", count: { $sum: 1 } } },
              ],
              byCanonicalStatus: [
                {
                  $group: {
                    _id: "$canonicalResolution.status",
                    count: { $sum: 1 },
                  },
                },
              ],
            },
          },
        ])
        .exec(),
    ]);

    return {
      items: rows.map((row) => this.toAdminActivity(row)),
      total,
      limit,
      offset,
      counts: this.toCounts(countFacets?.[0]),
    };
  }

  async get(idOrSlug: string) {
    const activity = await this.findActivity(idOrSlug);
    const canonicalIds = Array.from(
      new Set(
        [
          activity.canonicalProjectId,
          ...(activity.canonicalResolution?.candidates || []).map(
            (candidate) => candidate.canonicalProjectId
          ),
        ]
          .map((id) => String(id || ""))
          .filter((id) => Types.ObjectId.isValid(id))
      )
    );
    const canonicalProjects = canonicalIds.length
      ? await this.canonicalProjectModel
          .find(
            { _id: { $in: canonicalIds.map((id) => new Types.ObjectId(id)) } },
            {
              name: 1,
              slug: 1,
              symbol: 1,
              primaryWebsiteDomain: 1,
              metadata: 1,
            }
          )
          .lean()
          .exec()
      : [];
    const canonicalById = new Map(
      canonicalProjects.map((project: any) => [String(project._id), project])
    );
    return this.toAdminActivity(
      activity,
      canonicalById.get(String(activity.canonicalProjectId || "")),
      canonicalById
    );
  }

  async createManual(body: any, user?: Record<string, any>) {
    const actor = activityActor(user);
    const rawName = String(body?.name || "").trim();
    if (!rawName) {
      throw new BadRequestException("Activity name is required.");
    }
    const accessTier =
      body?.accessTier === "prime" ? "prime" : "public";

    // Build a unique slug from the name.
    const base =
      rawName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 64) || "activity";
    let slug = base;
    for (let i = 0; i < 50; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const exists = await this.activityModel.exists({ slug });
      if (!exists) break;
      slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const draft = sanitizeActivityContent({
      name: rawName,
      activityType: String(body?.activityType || "").trim() || "Other",
      category: String(body?.category || "").trim() || undefined,
      description: { about: "", aboutHtml: "" },
      taskGuide: { steps: [] },
      review: { scores: [] },
      links: [],
    } as any);

    const created = await this.activityModel.create({
      slug,
      sourceKeys: [],
      sources: [],
      sourceSnapshotIds: [],
      canonicalResolution: {
        status: "no_candidates" as FomoV2ActivityCanonicalStatus,
        reason: "Manually created in admin",
        resolvedAt: new Date(),
        resolvedBy: actor,
      },
      lifecycleStatus: "upcoming",
      reviewStatus: "pending_human",
      publicationStatus: "draft",
      accessTier,
      isSponsored: false,
      sponsoredPriority: 0,
      currentDraft: draft,
      manualOverrideFields: ["name", "activityType"],
      aiProposals: [],
      revision: 0,
      auditTrail: [
        this.auditEntry("edit", actor, 0, "Manual activity created"),
      ],
    } as any);

    return this.toAdminActivity(created.toObject());
  }

  async patch(
    idOrSlug: string,
    input: FomoV2ActivityPatchDto,
    user?: Record<string, any>
  ) {
    if (input.publicationStatus !== undefined) {
      throw new BadRequestException(
        "Use the publish, hide, unhide, or reject actions to change publication state."
      );
    }
    if (input.reviewStatus === "approved") {
      throw new BadRequestException(
        "Use the approve action to approve an activity."
      );
    }
    if (input.reviewStatus === "rejected") {
      throw new BadRequestException(
        "Use the reject action to reject an activity."
      );
    }

    const activity = await this.findActivity(idOrSlug);
    this.assertRevision(activity, input.expectedRevision);
    const actor = activityActor(user);
    const nextRevision = activity.revision + 1;
    let contentChangedFields: string[] = [];
    const update: any = {
      $set: {},
      $inc: { revision: 1 },
      $push: {},
    };

    if (input.slug !== undefined) update.$set.slug = input.slug;
    if (input.lifecycleStatus !== undefined) {
      update.$set.lifecycleStatus = input.lifecycleStatus;
    }
    if (input.reviewStatus !== undefined) {
      update.$set.reviewStatus = input.reviewStatus;
    }
    if (input.accessTier !== undefined)
      update.$set.accessTier = input.accessTier;
    if (input.isSponsored !== undefined) {
      update.$set.isSponsored = input.isSponsored;
    }
    if (input.sponsoredPriority !== undefined) {
      update.$set.sponsoredPriority = input.sponsoredPriority;
    }

    if (input.currentDraft !== undefined) {
      const previousDraft = this.plainContent(activity.currentDraft);
      update.$set.currentDraft = sanitizeActivityContent(
        mergeActivityContent(
          previousDraft,
          input.currentDraft as FomoV2ActivityContent
        )
      );
      contentChangedFields = activityDifferingFields(
        previousDraft,
        update.$set.currentDraft
      );
      update.$set.manualOverrideFields = Array.from(
        new Set([
          ...(activity.manualOverrideFields || []),
          ...contentChangedFields,
          ...(input.manualOverrideFields || []),
          ...(input.lifecycleStatus !== undefined &&
          input.lifecycleStatus !== activity.lifecycleStatus
            ? ["lifecycleStatus"]
            : []),
        ])
      ).sort();
    } else if (
      input.manualOverrideFields !== undefined ||
      input.lifecycleStatus !== undefined
    ) {
      update.$set.manualOverrideFields = Array.from(
        new Set([
          ...(activity.manualOverrideFields || []),
          ...(input.manualOverrideFields || []),
          ...(input.lifecycleStatus !== undefined &&
          input.lifecycleStatus !== activity.lifecycleStatus
            ? ["lifecycleStatus"]
            : []),
        ])
      ).sort();
    }

    const reviewedMetadataChanged =
      (input.slug !== undefined && input.slug !== activity.slug) ||
      (input.lifecycleStatus !== undefined &&
        input.lifecycleStatus !== activity.lifecycleStatus) ||
      (input.accessTier !== undefined &&
        input.accessTier !== activity.accessTier);
    if (
      activity.reviewStatus === "approved" &&
      (contentChangedFields.length > 0 || reviewedMetadataChanged)
    ) {
      update.$set.reviewStatus = "needs_changes";
    }

    const canonicalPatch = await this.buildCanonicalPatch(
      activity,
      input,
      actor
    );
    Object.assign(update.$set, canonicalPatch.set);
    if (Object.keys(canonicalPatch.unset).length)
      update.$unset = canonicalPatch.unset;
    if (
      activity.reviewStatus === "approved" &&
      (canonicalPatch.action || input.canonicalResolution)
    ) {
      update.$set.reviewStatus = "needs_changes";
    }

    if (input.aiProposal) {
      if (
        (activity.aiProposals || []).some(
          (proposal) => proposal.proposalId === input.aiProposal.proposalId
        )
      ) {
        throw new ConflictException(
          "AI proposalId already exists for this activity."
        );
      }
      const proposal = {
        ...input.aiProposal,
        status: input.aiProposal.status || "proposed",
        content: input.aiProposal.content
          ? sanitizeActivityContent(
              input.aiProposal.content as FomoV2ActivityContent
            )
          : undefined,
        generatedAt: new Date(),
        generatedBy: actor,
      };
      update.$push.aiProposals = {
        $each: [proposal],
        $slice: -MAX_AI_PROPOSALS,
      };
      if (!input.currentDraft && activity.reviewStatus === "pending_ai") {
        update.$set.reviewStatus = "pending_human";
      }
    }

    const changedFields = this.patchChangedFields(input, contentChangedFields);
    const auditAction: FomoV2ActivityAuditAction = input.aiProposal
      ? "ai_proposal"
      : canonicalPatch.action || "edit";
    update.$push.auditTrail = {
      $each: [
        this.auditEntry(
          auditAction,
          actor,
          nextRevision,
          input.note,
          changedFields
        ),
      ],
      $slice: -MAX_AUDIT_ENTRIES,
    };
    if (!Object.keys(update.$push).length) delete update.$push;
    if (!Object.keys(update.$set).length) delete update.$set;

    return this.runRevisionUpdate(activity, input.expectedRevision, update);
  }

  approve(
    idOrSlug: string,
    input: FomoV2ActivityDecisionDto,
    user?: Record<string, any>
  ) {
    return this.transition(idOrSlug, input, user, "approve");
  }

  publish(
    idOrSlug: string,
    input: FomoV2ActivityDecisionDto,
    user?: Record<string, any>
  ) {
    return this.transition(idOrSlug, input, user, "publish");
  }

  reject(
    idOrSlug: string,
    input: FomoV2ActivityDecisionDto,
    user?: Record<string, any>
  ) {
    return this.transition(idOrSlug, input, user, "reject");
  }

  hide(
    idOrSlug: string,
    input: FomoV2ActivityDecisionDto,
    user?: Record<string, any>
  ) {
    return this.transition(idOrSlug, input, user, "hide");
  }

  unhide(
    idOrSlug: string,
    input: FomoV2ActivityDecisionDto,
    user?: Record<string, any>
  ) {
    return this.transition(idOrSlug, input, user, "unhide");
  }

  private async transition(
    idOrSlug: string,
    input: FomoV2ActivityDecisionDto,
    user: Record<string, any> | undefined,
    action: "approve" | "publish" | "reject" | "hide" | "unhide"
  ) {
    const activity = await this.findActivity(idOrSlug);
    this.assertRevision(activity, input.expectedRevision);
    const actor = activityActor(user);
    const now = new Date();
    const nextRevision = activity.revision + 1;
    const update: any = {
      $set: {},
      $unset: {},
      $inc: { revision: 1 },
    };
    let fromStatus = "";
    let toStatus = "";

    if (action === "approve") {
      this.assertCanonicalDecisionComplete(activity);
      assertActivityDraftPublishable(activity.currentDraft);
      fromStatus = activity.reviewStatus;
      toStatus = "approved";
      update.$set.reviewStatus = "approved";
      update.$set.reviewedAt = now;
      update.$set.reviewedBy = actor;
      update.$unset.rejectedAt = 1;
      update.$unset.rejectedBy = 1;
      update.$unset.rejectedReason = 1;
    }

    if (action === "publish") {
      this.assertCanonicalDecisionComplete(activity);
      if (activity.reviewStatus !== "approved") {
        throw new ConflictException(
          "Only an approved activity can be published."
        );
      }
      if (activity.hiddenAt || activity.publicationStatus === "hidden") {
        throw new ConflictException(
          "Unhide the activity before publishing it."
        );
      }
      const publishedSnapshot = sanitizeActivityContent(
        this.plainContent(activity.currentDraft)
      );
      assertActivityDraftPublishable(publishedSnapshot);
      fromStatus = activity.publicationStatus;
      toStatus = "published";
      // The revision predicate makes this snapshot copy atomic with the state change.
      update.$set.publishedSnapshot = publishedSnapshot;
      update.$set.publishedMetadata = {
        slug: activity.slug,
        lifecycleStatus: activity.lifecycleStatus,
        accessTier: activity.accessTier,
        ...(activity.canonicalProjectId
          ? { canonicalProjectId: activity.canonicalProjectId }
          : {}),
      };
      update.$set.publicationStatus = "published";
      update.$set.publishedAt = now;
      update.$set.publishedBy = actor;
      update.$unset.publicationStatusBeforeHide = 1;
    }

    if (action === "reject") {
      fromStatus = activity.reviewStatus;
      toStatus = "rejected";
      update.$set.reviewStatus = "rejected";
      if (activity.publicationStatus !== "hidden") {
        update.$set.publicationStatus = "draft";
      }
      update.$set.rejectedAt = now;
      update.$set.rejectedBy = actor;
      update.$set.rejectedReason = input.reason || "Rejected by reviewer";
    }

    if (action === "hide") {
      if (activity.publicationStatus === "hidden" || activity.hiddenAt) {
        throw new ConflictException("Activity is already hidden.");
      }
      fromStatus = activity.publicationStatus;
      toStatus = "hidden";
      update.$set.publicationStatusBeforeHide = activity.publicationStatus;
      update.$set.publicationStatus = "hidden";
      update.$set.hiddenAt = now;
      update.$set.hiddenBy = actor;
      update.$set.hiddenReason = input.reason || "Hidden by reviewer";
    }

    if (action === "unhide") {
      if (activity.publicationStatus !== "hidden" && !activity.hiddenAt) {
        throw new ConflictException("Activity is not hidden.");
      }
      const restore = this.restorePublicationStatus(activity);
      fromStatus = "hidden";
      toStatus = restore;
      update.$set.publicationStatus = restore;
      update.$unset.publicationStatusBeforeHide = 1;
      update.$unset.hiddenAt = 1;
      update.$unset.hiddenBy = 1;
      update.$unset.hiddenReason = 1;
    }

    update.$push = {
      auditTrail: {
        $each: [
          this.auditEntry(
            action,
            actor,
            nextRevision,
            input.reason,
            [],
            fromStatus,
            toStatus
          ),
        ],
        $slice: -MAX_AUDIT_ENTRIES,
      },
    };
    if (!Object.keys(update.$unset).length) delete update.$unset;
    return this.runRevisionUpdate(activity, input.expectedRevision, update);
  }

  private async runRevisionUpdate(
    activity: any,
    expectedRevision: number,
    update: Record<string, any>
  ) {
    try {
      const updated = await this.activityModel
        .findOneAndUpdate(
          { _id: activity._id, revision: expectedRevision },
          update,
          { new: true, runValidators: true }
        )
        .lean()
        .exec();
      if (!updated) {
        throw new ConflictException(
          "Activity changed since it was loaded. Refresh and retry."
        );
      }
      return this.toAdminActivity(updated);
    } catch (error: any) {
      if (error instanceof ConflictException) throw error;
      if (error?.code === 11000) {
        throw new ConflictException("Activity identity must be unique.");
      }
      throw error;
    }
  }

  private async buildCanonicalPatch(
    activity: any,
    input: FomoV2ActivityPatchDto,
    actor: string
  ): Promise<{
    set: Record<string, any>;
    unset: Record<string, any>;
    action?: "canonical_link" | "canonical_unlink";
  }> {
    const set: Record<string, any> = {};
    const unset: Record<string, any> = {};
    let action: "canonical_link" | "canonical_unlink" | undefined;
    const canonicalId =
      input.canonicalProjectId !== undefined
        ? input.canonicalProjectId
        : activity.canonicalProjectId
        ? String(activity.canonicalProjectId)
        : null;

    if (input.canonicalProjectId) {
      const exists = await this.canonicalProjectModel.exists({
        _id: new Types.ObjectId(input.canonicalProjectId),
      });
      if (!exists)
        throw new BadRequestException("Canonical project does not exist.");
      set.canonicalProjectId = new Types.ObjectId(input.canonicalProjectId);
      action = "canonical_link";
    } else if (input.canonicalProjectId === null) {
      unset.canonicalProjectId = 1;
      action = "canonical_unlink";
    }

    if (input.canonicalResolution) {
      const status = input.canonicalResolution
        .status as FomoV2ActivityCanonicalStatus;
      if (status === "verified" && !canonicalId) {
        throw new BadRequestException(
          "A verified canonical resolution requires canonicalProjectId."
        );
      }
      if (["no_candidates", "rejected"].includes(status) && canonicalId) {
        throw new BadRequestException(
          "Clear canonicalProjectId when marking an activity standalone."
        );
      }
      set.canonicalResolution = {
        ...input.canonicalResolution,
        candidates: (input.canonicalResolution.candidates || []).map(
          (candidate) => ({
            ...candidate,
            canonicalProjectId: new Types.ObjectId(
              candidate.canonicalProjectId
            ),
          })
        ),
        resolvedAt: new Date(),
        resolvedBy: actor,
      };
    } else if (input.canonicalProjectId !== undefined) {
      set.canonicalResolution = {
        ...(activity.canonicalResolution || {}),
        status: input.canonicalProjectId ? "verified" : "rejected",
        resolvedAt: new Date(),
        resolvedBy: actor,
      };
    }

    return { set, unset, action };
  }

  private async findActivity(idOrSlug: string): Promise<any> {
    const activity = await resolveActivityByIdentity(idOrSlug, (match, limit) =>
      this.activityModel.find(match).limit(limit).lean().exec()
    );
    if (!activity) throw new NotFoundException("FOMO v2 activity not found.");
    return activity;
  }

  private assertRevision(activity: any, expectedRevision: number): void {
    if (activity.revision !== expectedRevision) {
      throw new ConflictException(
        "Activity changed since it was loaded. Refresh and retry."
      );
    }
  }

  private buildContextMatch(
    query: FomoV2ActivityAdminListQueryDto
  ): FilterQuery<FomoV2ActivityDocument> {
    const match: FilterQuery<FomoV2ActivityDocument> = {};
    if (query.search) {
      const pattern = new RegExp(this.escapeRegExp(query.search.trim()), "i");
      match.$or = [
        { slug: pattern },
        { parserActivityId: pattern },
        { legacyActivityId: pattern },
        { "currentDraft.name": pattern },
        { "currentDraft.projectName": pattern },
        { "currentDraft.symbol": pattern },
        { "sources.sourceId": pattern },
      ];
    }
    const types = this.splitList(query.activityType || query.type);
    if (types.length) match["currentDraft.activityType"] = { $in: types };
    const categories = this.splitList(query.category);
    if (categories.length) match["currentDraft.category"] = { $in: categories };
    if (query.canonicalProjectId) {
      match.canonicalProjectId = new Types.ObjectId(query.canonicalProjectId);
    }
    return match;
  }

  private buildAdminMatch(
    query: FomoV2ActivityAdminListQueryDto,
    contextMatch: FilterQuery<FomoV2ActivityDocument>
  ): FilterQuery<FomoV2ActivityDocument> {
    const match: FilterQuery<FomoV2ActivityDocument> = { ...contextMatch };
    if (query.reviewStatus) match.reviewStatus = query.reviewStatus;
    if (query.publicationStatus)
      match.publicationStatus = query.publicationStatus;
    if (query.accessTier) match.accessTier = query.accessTier;
    if (query.canonicalStatus) {
      match["canonicalResolution.status"] = query.canonicalStatus;
    }
    return match;
  }

  private adminListProjection() {
    return {
      _id: 1,
      slug: 1,
      legacyActivityId: 1,
      legacyNumericId: 1,
      parserActivityId: 1,
      canonicalProjectId: 1,
      canonicalResolution: 1,
      lifecycleStatus: 1,
      reviewStatus: 1,
      publicationStatus: 1,
      accessTier: 1,
      isSponsored: 1,
      sponsoredPriority: 1,
      currentDraft: 1,
      revision: 1,
      sources: 1,
      publishedAt: 1,
      hiddenAt: 1,
      rejectedAt: 1,
      createdAt: 1,
      updatedAt: 1,
    };
  }

  private toAdminActivity(
    activity: any,
    canonicalProject?: any,
    canonicalById: Map<string, any> = new Map()
  ) {
    const canonicalCandidates = (
      activity.canonicalResolution?.candidates || []
    ).map((candidate) => {
      const canonicalProjectId = String(candidate.canonicalProjectId || "");
      const project = canonicalById.get(canonicalProjectId);
      return {
        ...candidate,
        id: canonicalProjectId,
        canonicalProjectId,
        name: project?.name,
        symbol: project?.symbol,
        slug: project?.slug,
        logo:
          project?.metadata?.logoUrl ||
          project?.metadata?.logo ||
          project?.metadata?.image,
      };
    });
    return {
      ...activity,
      _id: String(activity._id),
      id: String(activity._id),
      activityId: String(activity._id),
      canonicalProjectId: activity.canonicalProjectId
        ? String(activity.canonicalProjectId)
        : null,
      canonicalStatus: activity.canonicalResolution?.status || "unprocessed",
      canonicalCandidates,
      canonicalProject: canonicalProject
        ? { ...canonicalProject, _id: String(canonicalProject._id) }
        : undefined,
      nftRequired: activity.accessTier === "prime",
      source: activity.sources?.[0]?.source,
      primarySource: activity.sources?.[0]?.source,
      sourceUrl: activity.sources?.[0]?.sourceUrl,
    };
  }

  private assertCanonicalDecisionComplete(activity: any): void {
    const status = activity.canonicalResolution?.status || "unprocessed";
    if (["unprocessed", "proposed", "conflict"].includes(status)) {
      throw new ConflictException(
        "Resolve the canonical project decision before approving this activity."
      );
    }
    if (status === "verified" && !activity.canonicalProjectId) {
      throw new ConflictException(
        "Verified canonical resolution has no canonicalProjectId."
      );
    }
  }

  private toCounts(facet: any) {
    const toRecord = (rows: any[] = []) =>
      rows.reduce((result, row) => {
        if (row?._id !== undefined && row?._id !== null) {
          result[String(row._id)] = Number(row.count || 0);
        }
        return result;
      }, {} as Record<string, number>);
    return {
      all: Number(facet?.all?.[0]?.count || 0),
      byReviewStatus: toRecord(facet?.byReviewStatus),
      byPublicationStatus: toRecord(facet?.byPublicationStatus),
      byAccessTier: toRecord(facet?.byAccessTier),
      byCanonicalStatus: toRecord(facet?.byCanonicalStatus),
    };
  }

  private auditEntry(
    action: FomoV2ActivityAuditAction,
    actor: string,
    revision: number,
    note?: string,
    changedFields: string[] = [],
    fromStatus?: string,
    toStatus?: string
  ) {
    return {
      action,
      actor,
      at: new Date(),
      revision,
      note,
      changedFields,
      fromStatus,
      toStatus,
    };
  }

  private restorePublicationStatus(
    activity: any
  ): FomoV2ActivityPublicationStatus {
    const before = activity.publicationStatusBeforeHide;
    if (
      before === "published" &&
      activity.reviewStatus !== "rejected" &&
      activity.publishedSnapshot &&
      activity.publishedMetadata
    ) {
      return "published";
    }
    if (before === "archived") return "archived";
    return "draft";
  }

  private patchChangedFields(
    input: FomoV2ActivityPatchDto,
    contentChangedFields: string[] = []
  ): string[] {
    const fields = Object.keys(input).filter(
      (field) =>
        !["expectedRevision", "note", "aiProposal", "currentDraft"].includes(
          field
        )
    );
    if (input.currentDraft) {
      fields.push(
        ...contentChangedFields.map((field) => `currentDraft.${field}`)
      );
    }
    return Array.from(new Set(fields)).sort();
  }

  private plainContent(value: any): FomoV2ActivityContent {
    if (!value) return {};
    if (typeof value.toObject === "function") return value.toObject();
    return value;
  }

  private splitList(value?: string): string[] {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
