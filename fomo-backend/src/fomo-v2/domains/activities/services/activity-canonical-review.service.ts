import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { FomoV2CanonicalProject } from "../../../models/canonical-project.model";
import {
  ResolveCanonicalProjectResult,
  ResolveCanonicalProjectService,
} from "../../../services/resolve-canonical-project.service";
import {
  FomoV2ActivityCanonicalNoMatchDto,
  FomoV2ActivityCanonicalRejectDto,
  FomoV2ActivityCanonicalResolveDto,
  FomoV2ActivityCanonicalVerifyDto,
} from "../dto/activity-automation.dto";
import { activityActor } from "../helpers/activity-content.helper";
import { resolveActivityByIdentity } from "../helpers/activity-identity-resolver.helper";
import {
  FomoV2Activity,
  FomoV2ActivityDocument,
} from "../models/activity.model";
import { mapActivityCanonicalResolution } from "./activity-source-import.service";

const MAX_AUDIT_ENTRIES = 200;

@Injectable()
export class FomoV2ActivityCanonicalReviewService {
  constructor(
    @InjectModel(FomoV2Activity.name)
    private readonly activityModel: Model<FomoV2ActivityDocument>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>,
    private readonly canonicalResolver: ResolveCanonicalProjectService
  ) {}

  /** Re-runs deterministic resolution; only resolver-verified matches auto-link. */
  async resolve(
    idOrSlug: string,
    input: FomoV2ActivityCanonicalResolveDto,
    user?: Record<string, any>
  ) {
    const activity = await this.findActivity(idOrSlug);
    this.assertRevision(activity, input.expectedRevision);
    if (activity.canonicalResolution?.status === "verified") {
      throw new ConflictException(
        "Canonical link is already verified. Reject or unlink it before resolving again."
      );
    }

    const source = activity.sources?.[0] || {};
    const draft = activity.currentDraft || {};
    const resolverResult = await this.canonicalResolver.resolve({
      source: source.source || "legacy",
      sourceEntityType: "activity",
      sourceId: source.sourceId || activity.parserActivityId,
      sourceSlug: source.sourceSlug || activity.slug,
      sourceUrl: source.sourceUrl,
      name: draft.projectName || draft.name,
      symbol: draft.symbol,
      websiteDomain: websiteDomain(draft.socialLinks?.website),
    });
    const decision = mapActivityCanonicalResolution(resolverResult);
    const actor = activityActor(user);
    const resolution = resolverResolution(decision, resolverResult, actor);
    const set: Record<string, any> = { canonicalResolution: resolution };
    const unset: Record<string, any> = {};
    if (
      decision.canonicalStatus === "verified" &&
      decision.canonicalProjectId
    ) {
      set.canonicalProjectId = new Types.ObjectId(decision.canonicalProjectId);
    } else {
      unset.canonicalProjectId = 1;
    }

    const updated = await this.runUpdate(
      activity,
      input.expectedRevision,
      set,
      unset,
      decision.canonicalStatus === "verified" ? "canonical_link" : "edit",
      actor,
      `Canonical resolver result: ${decision.canonicalStatus}. ${
        resolverResult.reason || ""
      }`
    );
    return {
      activity: updated,
      resolverResult,
      publicationChanged: false,
    };
  }

  /** Human approval of a proposed/conflicting candidate. */
  async verify(
    idOrSlug: string,
    input: FomoV2ActivityCanonicalVerifyDto,
    user?: Record<string, any>
  ) {
    const activity = await this.findActivity(idOrSlug);
    this.assertRevision(activity, input.expectedRevision);
    const canonicalId = new Types.ObjectId(input.canonicalProjectId);
    if (!(await this.canonicalProjectModel.exists({ _id: canonicalId }))) {
      throw new BadRequestException("Canonical project does not exist.");
    }
    const actor = activityActor(user);
    const candidates = dedupeCandidates([
      ...(activity.canonicalResolution?.candidates || []),
      {
        canonicalProjectId: canonicalId,
        confidence: "exact",
        matchedBy: "manual",
        reason: input.reason || "Verified by activity reviewer.",
      },
    ]);
    const updated = await this.runUpdate(
      activity,
      input.expectedRevision,
      {
        canonicalProjectId: canonicalId,
        canonicalResolution: {
          status: "verified",
          confidence: "exact",
          matchedBy: "manual",
          reason: input.reason || "Verified by activity reviewer.",
          candidates,
          resolvedAt: new Date(),
          resolvedBy: actor,
        },
      },
      {},
      "canonical_link",
      actor,
      input.reason || `Canonical project ${canonicalId} verified by reviewer.`
    );
    return { activity: updated, publicationChanged: false };
  }

  /** Rejects the currently proposed association while retaining evidence. */
  async reject(
    idOrSlug: string,
    input: FomoV2ActivityCanonicalRejectDto,
    user?: Record<string, any>
  ) {
    const activity = await this.findActivity(idOrSlug);
    this.assertRevision(activity, input.expectedRevision);
    const actor = activityActor(user);
    const rejectedId = input.canonicalProjectId
      ? new Types.ObjectId(input.canonicalProjectId)
      : activity.canonicalProjectId;
    const currentCandidates = dedupeCandidates(
      activity.canonicalResolution?.candidates || []
    );
    let candidates = currentCandidates;
    let status: "proposed" | "conflict" | "rejected" = "rejected";
    if (input.canonicalProjectId) {
      const rejectedKey = String(rejectedId);
      if (
        !currentCandidates.some(
          (candidate) => String(candidate.canonicalProjectId) === rejectedKey
        )
      ) {
        throw new BadRequestException(
          "Canonical candidate does not exist on this activity."
        );
      }
      candidates = currentCandidates.filter(
        (candidate) => String(candidate.canonicalProjectId) !== rejectedKey
      );
      status =
        candidates.length > 1
          ? "conflict"
          : candidates.length === 1
          ? "proposed"
          : "rejected";
    }
    const remainingCandidate =
      candidates.length === 1 ? candidates[0] : undefined;
    const updated = await this.runUpdate(
      activity,
      input.expectedRevision,
      {
        canonicalResolution: {
          ...(activity.canonicalResolution || {}),
          status,
          confidence:
            status === "conflict"
              ? "none"
              : remainingCandidate?.confidence ||
                activity.canonicalResolution?.confidence,
          matchedBy:
            remainingCandidate?.matchedBy ||
            activity.canonicalResolution?.matchedBy ||
            "manual",
          reason:
            input.reason ||
            (rejectedId
              ? `Canonical association ${rejectedId} rejected by reviewer.`
              : "Canonical association rejected by reviewer."),
          candidates,
          resolvedAt: new Date(),
          resolvedBy: actor,
        },
      },
      { canonicalProjectId: 1 },
      "canonical_unlink",
      actor,
      input.reason || "Canonical association rejected by reviewer."
    );
    return { activity: updated, publicationChanged: false };
  }

  /** Explicit human decision that the activity is valid as a standalone row. */
  async noMatch(
    idOrSlug: string,
    input: FomoV2ActivityCanonicalNoMatchDto,
    user?: Record<string, any>
  ) {
    const activity = await this.findActivity(idOrSlug);
    this.assertRevision(activity, input.expectedRevision);
    const actor = activityActor(user);
    const updated = await this.runUpdate(
      activity,
      input.expectedRevision,
      {
        canonicalResolution: {
          status: "no_candidates",
          confidence: "none",
          matchedBy: "manual",
          reason:
            input.reason ||
            "Reviewer confirmed that this is a standalone activity.",
          candidates: [],
          resolvedAt: new Date(),
          resolvedBy: actor,
        },
      },
      { canonicalProjectId: 1 },
      "canonical_unlink",
      actor,
      input.reason ||
        "Reviewer confirmed standalone activity with no canonical match."
    );
    return { activity: updated, publicationChanged: false };
  }

  private async runUpdate(
    activity: any,
    expectedRevision: number,
    set: Record<string, any>,
    unset: Record<string, any>,
    action: "canonical_link" | "canonical_unlink" | "edit",
    actor: string,
    note: string
  ) {
    const nextRevision = Number(activity.revision || 0) + 1;
    const nextSet = { ...set };
    if (activity.reviewStatus === "approved") {
      nextSet.reviewStatus = "needs_changes";
    }
    const update: Record<string, any> = {
      $set: nextSet,
      $inc: { revision: 1 },
      $push: {
        auditTrail: {
          $each: [
            {
              action,
              actor,
              at: new Date(),
              revision: nextRevision,
              note: String(note || "").slice(0, 2_000),
              changedFields: [
                "canonicalProjectId",
                "canonicalResolution",
                ...(activity.reviewStatus === "approved"
                  ? ["reviewStatus"]
                  : []),
              ],
            },
          ],
          $slice: -MAX_AUDIT_ENTRIES,
        },
      },
    };
    if (Object.keys(unset).length) update.$unset = unset;
    const updated = await this.activityModel
      .findOneAndUpdate(
        { _id: activity._id, revision: expectedRevision },
        update,
        { new: true, runValidators: true }
      )
      .lean()
      .exec();
    if (!updated) throw staleRevision();
    return updated;
  }

  private async findActivity(idOrSlug: string): Promise<any> {
    const activity = await resolveActivityByIdentity(idOrSlug, (match, limit) =>
      this.activityModel.find(match).limit(limit).lean().exec()
    );
    if (!activity) throw new NotFoundException("FOMO v2 activity not found.");
    return activity;
  }

  private assertRevision(activity: any, expectedRevision: number): void {
    if (
      !Number.isInteger(expectedRevision) ||
      activity.revision !== expectedRevision
    ) {
      throw staleRevision();
    }
  }
}

function resolverResolution(
  decision: ReturnType<typeof mapActivityCanonicalResolution>,
  result: ResolveCanonicalProjectResult,
  actor: string
) {
  return {
    status: decision.canonicalStatus,
    confidence: result.confidence,
    matchedBy: result.matchedBy,
    reason: result.reason,
    candidates: decision.canonicalCandidates.map((candidate) => ({
      ...candidate,
      canonicalProjectId: new Types.ObjectId(
        String(candidate.canonicalProjectId)
      ),
    })),
    resolvedAt: new Date(),
    resolvedBy: actor,
  };
}

function dedupeCandidates(candidates: any[]): any[] {
  const result = new Map<string, any>();
  for (const candidate of candidates) {
    const id = String(candidate?.canonicalProjectId || "").trim();
    if (!Types.ObjectId.isValid(id)) continue;
    result.set(id, {
      ...candidate,
      canonicalProjectId: new Types.ObjectId(id),
    });
  }
  return Array.from(result.values());
}

function websiteDomain(value?: string): string | undefined {
  if (!value) return undefined;
  try {
    return (
      new URL(value).hostname.toLowerCase().replace(/^www\./, "") || undefined
    );
  } catch (_error) {
    return undefined;
  }
}

function staleRevision(): ConflictException {
  return new ConflictException(
    "Activity changed since it was loaded. Refresh and retry."
  );
}
