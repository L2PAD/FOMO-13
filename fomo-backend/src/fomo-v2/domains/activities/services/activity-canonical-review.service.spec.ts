import { Types } from "mongoose";
import { FomoV2ActivityCanonicalReviewService } from "./activity-canonical-review.service";

function leanResult(value: any) {
  return { lean: () => ({ exec: async () => value }) };
}

describe("FomoV2ActivityCanonicalReviewService", () => {
  it("atomically verifies an admin-selected canonical project without publishing", async () => {
    const activity = {
      _id: new Types.ObjectId(),
      revision: 2,
      slug: "alpha",
      reviewStatus: "approved",
      publicationStatus: "draft",
      currentDraft: { name: "Alpha" },
      canonicalResolution: {
        status: "proposed",
        candidates: [],
      },
      auditTrail: [],
    };
    const canonicalProjectId = new Types.ObjectId();
    let filter: any;
    let update: any;
    const activityModel = {
      findOne: jest.fn().mockReturnValue(leanResult(activity)),
      findOneAndUpdate: jest.fn((nextFilter, nextUpdate) => {
        filter = nextFilter;
        update = nextUpdate;
        return leanResult({ ...activity, revision: 3 });
      }),
    };
    const canonicalModel = {
      exists: jest.fn().mockResolvedValue({ _id: canonicalProjectId }),
    };
    const service = new FomoV2ActivityCanonicalReviewService(
      activityModel as any,
      canonicalModel as any,
      {} as any
    );

    await service.verify(
      String(activity._id),
      { expectedRevision: 2, canonicalProjectId: String(canonicalProjectId) },
      { id: "admin-1" }
    );

    expect(filter).toEqual({ _id: activity._id, revision: 2 });
    expect(update.$set.canonicalProjectId).toEqual(canonicalProjectId);
    expect(update.$set.canonicalResolution.status).toBe("verified");
    expect(update.$set.reviewStatus).toBe("needs_changes");
    expect(update.$inc).toEqual({ revision: 1 });
    expect(update.$set.publicationStatus).toBeUndefined();
    expect(update.$set.publishedSnapshot).toBeUndefined();
  });

  it("keeps a weak resolver match proposed for explicit human verification", async () => {
    const projectId = new Types.ObjectId().toHexString();
    const activity = {
      _id: new Types.ObjectId(),
      revision: 7,
      slug: "beta",
      currentDraft: { projectName: "Beta", symbol: "BETA" },
      sources: [{ source: "legacy", sourceId: "beta-1" }],
      canonicalResolution: { status: "unprocessed", candidates: [] },
    };
    let update: any;
    const activityModel = {
      findOne: jest.fn().mockReturnValue(leanResult(activity)),
      findOneAndUpdate: jest.fn((_filter, nextUpdate) => {
        update = nextUpdate;
        return leanResult({ ...activity, revision: 8 });
      }),
    };
    const resolver = {
      resolve: jest.fn().mockResolvedValue({
        status: "proposed",
        canonicalProjectId: projectId,
        verified: false,
        confidence: "medium",
        matchedBy: "name_only",
        reason: "Name-only candidate",
        candidates: [],
        conflicts: [],
        actions: [],
      }),
    };
    const service = new FomoV2ActivityCanonicalReviewService(
      activityModel as any,
      {} as any,
      resolver as any
    );

    await service.resolve(
      String(activity._id),
      { expectedRevision: 7 },
      { id: "admin" }
    );

    expect(update.$set.canonicalResolution.status).toBe("proposed");
    expect(update.$set.canonicalProjectId).toBeUndefined();
    expect(update.$unset).toEqual({ canonicalProjectId: 1 });
  });

  it("rejects only the selected candidate and preserves the remaining proposal", async () => {
    const rejectedId = new Types.ObjectId();
    const remainingId = new Types.ObjectId();
    const activity = {
      _id: new Types.ObjectId(),
      revision: 3,
      reviewStatus: "pending_human",
      canonicalProjectId: rejectedId,
      canonicalResolution: {
        status: "conflict",
        candidates: [
          { canonicalProjectId: rejectedId, confidence: "medium" },
          {
            canonicalProjectId: remainingId,
            confidence: "high",
            matchedBy: "source_entity",
          },
        ],
      },
    };
    let update: any;
    const activityModel = {
      findOne: jest.fn().mockReturnValue(leanResult(activity)),
      findOneAndUpdate: jest.fn((_filter, nextUpdate) => {
        update = nextUpdate;
        return leanResult({ ...activity, revision: 4 });
      }),
    };
    const service = new FomoV2ActivityCanonicalReviewService(
      activityModel as any,
      {} as any,
      {} as any
    );

    await service.reject(
      String(activity._id),
      {
        expectedRevision: 3,
        canonicalProjectId: String(rejectedId),
      },
      { id: "admin" }
    );

    expect(update.$set.canonicalResolution.status).toBe("proposed");
    expect(update.$set.canonicalResolution.candidates).toHaveLength(1);
    expect(
      String(update.$set.canonicalResolution.candidates[0].canonicalProjectId)
    ).toBe(String(remainingId));
    expect(update.$unset).toEqual({ canonicalProjectId: 1 });
  });
});
