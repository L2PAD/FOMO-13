import { ConflictException } from "@nestjs/common";
import { Types } from "mongoose";
import { FomoV2ReviewCaseAdminService } from "./review-case-admin.service";

describe("FomoV2ReviewCaseAdminService decision concurrency", () => {
  const createHarness = () => {
    const baseBatch = {
      _id: new Types.ObjectId(),
      domain: "vesting",
      reason: "EXISTING_SOURCE_VESTING",
      status: "open",
      fingerprint: "review-case-concurrency",
      candidateCount: 0,
      candidates: [],
      firstSeenAt: new Date("2026-01-01T00:00:00.000Z"),
      lastSeenAt: new Date("2026-01-01T00:00:00.000Z"),
      seenCount: 1,
      metadata: {},
    };
    const state: {
      status: string;
      claim?: Record<string, any>;
      decision?: Record<string, any>;
      decisionHistory: Array<Record<string, any>>;
    } = {
      status: "open",
      decisionHistory: [],
    };
    const document = () => ({
      ...baseBatch,
      status: state.status,
      metadata: {
        ...(state.claim ? { decisionClaim: state.claim } : {}),
        ...(state.decision ? { decision: state.decision } : {}),
        decisionHistory: [...state.decisionHistory],
      },
    });
    const lean = (value: any) => ({
      lean: jest.fn().mockResolvedValue(value),
    });

    const reviewBatchModel = {
      findOne: jest.fn(() => lean(document())),
      findOneAndUpdate: jest.fn((filter: any, update: any) => {
        const requestedClaim = update?.$set?.["metadata.decisionClaim"];
        if (requestedClaim) {
          if (state.status !== "open" || state.claim) return lean(null);
          state.claim = requestedClaim;
          return lean(document());
        }

        const expectedToken = filter?.["metadata.decisionClaim.token"];
        if (
          state.status !== "open" ||
          !state.claim ||
          state.claim.token !== expectedToken
        ) {
          return lean(null);
        }
        state.status = update.$set.status;
        state.decision = update.$set["metadata.decision"];
        state.decisionHistory.push(update.$push["metadata.decisionHistory"]);
        state.claim = undefined;
        return lean(document());
      }),
      updateOne: jest.fn(async (filter: any) => {
        if (
          state.status === "open" &&
          state.claim?.token === filter?.["metadata.decisionClaim.token"]
        ) {
          state.claim = undefined;
        }
        return { acknowledged: true, modifiedCount: 1 };
      }),
    };
    const vestingReviewApplyService = {
      canApplyReviewBatch: jest.fn(() => true),
      applyReviewBatch: jest.fn(async () => ({ applied: true })),
    };
    const service = new FomoV2ReviewCaseAdminService(
      reviewBatchModel as any,
      {} as any,
      { updateOne: jest.fn() } as any,
      {} as any,
      vestingReviewApplyService as any,
      {} as any
    );

    return {
      service,
      state,
      reviewBatchModel,
      vestingReviewApplyService,
    };
  };

  it("allows exactly one concurrent decision to perform its side effect", async () => {
    const { service, state, reviewBatchModel, vestingReviewApplyService } =
      createHarness();

    const settle = (promise: Promise<any>) =>
      promise.then(
        (value) => ({ fulfilled: true, value }),
        (reason) => ({ fulfilled: false, reason })
      );
    const results = await Promise.all([
      settle(
        service.approve("review-case-concurrency", { applyDecision: true })
      ),
      settle(
        service.approve("review-case-concurrency", { applyDecision: true })
      ),
    ]);

    expect(results.filter((result) => result.fulfilled)).toHaveLength(1);
    const rejected = results.find((result) => !result.fulfilled) as
      | { fulfilled: false; reason: any }
      | undefined;
    expect(rejected?.reason).toBeInstanceOf(ConflictException);
    expect(vestingReviewApplyService.applyReviewBatch).toHaveBeenCalledTimes(1);
    expect(state.status).toBe("resolved");
    expect(state.decisionHistory).toHaveLength(1);

    const finalizeCall = reviewBatchModel.findOneAndUpdate.mock.calls.find(
      ([, update]) => Boolean(update?.$set?.status)
    );
    const claimCall = reviewBatchModel.findOneAndUpdate.mock.calls.find(
      ([, update]) => Boolean(update?.$set?.["metadata.decisionClaim"])
    );
    expect(claimCall?.[0].$or).toEqual(
      expect.arrayContaining([
        { "metadata.decisionClaim": { $exists: false } },
        { "metadata.decisionClaim.expiresAt": { $lte: expect.any(Date) } },
      ])
    );
    expect(
      claimCall?.[1].$set["metadata.decisionClaim"].expiresAt
    ).toEqual(expect.any(Date));
    expect(finalizeCall?.[0]["metadata.decisionClaim.token"]).toEqual(
      expect.any(String)
    );
  });

  it("releases only its own claim when the claimed side effect fails", async () => {
    const { service, state, reviewBatchModel, vestingReviewApplyService } =
      createHarness();
    vestingReviewApplyService.applyReviewBatch
      .mockRejectedValueOnce(new Error("vesting write failed"))
      .mockResolvedValueOnce({ applied: true });

    await expect(
      service.approve("review-case-concurrency", { applyDecision: true })
    ).rejects.toThrow("vesting write failed");
    expect(state.status).toBe("open");
    expect(state.claim).toBeUndefined();
    expect(reviewBatchModel.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "open",
        "metadata.decisionClaim.token": expect.any(String),
      }),
      { $unset: { "metadata.decisionClaim": 1 } }
    );

    await expect(
      service.approve("review-case-concurrency", { applyDecision: true })
    ).resolves.toEqual(expect.objectContaining({ status: "approved" }));
    expect(vestingReviewApplyService.applyReviewBatch).toHaveBeenCalledTimes(2);
    expect(state.status).toBe("resolved");
  });
});
