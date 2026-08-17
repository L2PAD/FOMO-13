import { Types } from "mongoose";
import {
  FomoV2ActivityAiReviewService,
  removeProtectedPaths,
  selectActivityContentPaths,
} from "./activity-ai-review.service";

const structuredResponse = {
  content: {
    difficulty: "medium",
    cost: "Gas only",
    timeEstimate: "20 minutes",
    rewardLabel: null,
    tags: ["testnet"],
    requirements: ["Wallet"],
    description: {
      about: "Clear description",
      aboutHtml:
        '<p>Clear <a href="https://invented.example">bad link</a> <a href="https://official.example/quest">official link</a></p><script>alert(1)</script>',
      howToParticipate: "Complete the documented steps",
      howToParticipateHtml: "<p>Complete the documented steps</p>",
    },
    review: {
      text: "AI must not replace this manual text",
      textHtml: "<p>Balanced review</p>",
      scores: [{ label: "Evidence", value: 70 }],
    },
    metrics: {
      riskLevel: "Medium",
      complexity: "Medium",
      timeRequired: "20 minutes",
      potentialReward: null,
    },
    flags: { green: ["Clear docs"], yellow: ["No reward date"], red: [] },
    taskGuide: {
      title: "Participation guide",
      description: "Follow the official flow",
      descriptionHtml: "<p>Follow the official flow</p>",
      ctaLabel: "Open",
      ctaUrl: "https://invented.example",
      successMessage: "Done",
      steps: [
        {
          id: "1",
          title: "Connect",
          description: "Connect a wallet",
          descriptionHtml: "<p>Connect a wallet</p>",
          timeEstimate: "5 minutes",
          ctaLabel: "Open",
          ctaUrl: "https://official.example/quest",
        },
      ],
    },
  },
  warnings: ["Reward evidence is missing"],
  rationale: "Clarified supplied evidence only.",
};

describe("FomoV2ActivityAiReviewService", () => {
  it("returns a typed unavailable result when the API key is absent", async () => {
    const service = new FomoV2ActivityAiReviewService(
      {} as any,
      {
        get: jest.fn().mockReturnValue(undefined),
      } as any
    );

    await expect(
      service.generateProposal({ currentDraft: { name: "Alpha" } })
    ).resolves.toEqual(
      expect.objectContaining({
        available: false,
        errorCode: "missing_api_key",
      })
    );
  });

  it("uses Responses structured output, sanitizes HTML, and removes manual paths", async () => {
    const create = jest.fn().mockResolvedValue({
      output_text: JSON.stringify(structuredResponse),
    });
    const config = {
      get: jest.fn((key: string) => {
        if (key === "OPEN_AI_SECRET_KEY") return "test-key";
        if (key === "OPEN_AI_ADMIN_CHAT_MODEL")
          return "gpt-test,gpt-test-fallback";
        return undefined;
      }),
    };
    const service = new FomoV2ActivityAiReviewService({} as any, config as any);
    (service as any).client = { responses: { create } };

    const result = await service.generateProposal({
      slug: "alpha",
      currentDraft: {
        name: "Alpha",
        joinLink: "https://official.example/quest",
      },
      manualOverrideFields: ["review.text"],
    });

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-test",
        text: {
          format: expect.objectContaining({
            type: "json_schema",
            strict: true,
          }),
        },
      }),
      expect.any(Object)
    );
    expect(result.available).toBe(true);
    if (!result.available) return;
    expect(result.content.review?.text).toBeUndefined();
    expect(result.content.description?.aboutHtml).not.toContain("<script");
    expect(result.content.description?.aboutHtml).not.toContain(
      'href="https://invented.example"'
    );
    expect(result.content.description?.aboutHtml).toContain(
      'href="https://official.example/quest"'
    );
    expect(result.content.taskGuide?.ctaUrl).toBeUndefined();
    expect(result.content.taskGuide?.steps?.[0]?.ctaUrl).toBe(
      "https://official.example/quest"
    );
  });

  it("applies selected paths atomically and protects them from future parser ingest", async () => {
    const activity = {
      _id: new Types.ObjectId(),
      revision: 4,
      reviewStatus: "approved",
      publicationStatus: "published",
      currentDraft: { description: { about: "Old" }, review: { text: "Old" } },
      manualOverrideFields: [],
      aiProposals: [
        {
          proposalId: "proposal-1",
          status: "proposed",
          content: {
            description: { about: "New" },
            review: { text: "New review" },
          },
        },
      ],
    };
    let capturedUpdate: any;
    let capturedOptions: any;
    const model = {
      findOne: jest.fn().mockReturnValue({
        lean: () => ({ exec: async () => activity }),
      }),
      findOneAndUpdate: jest.fn((_filter, update, options) => {
        capturedUpdate = update;
        capturedOptions = options;
        return {
          lean: () => ({ exec: async () => ({ ...activity, revision: 5 }) }),
        };
      }),
    };
    const service = new FomoV2ActivityAiReviewService(
      model as any,
      {
        get: jest.fn(),
      } as any
    );

    const result = await service.applyProposal(
      String(activity._id),
      {
        proposalId: "proposal-1",
        expectedRevision: 4,
        paths: ["description.about"],
      },
      { id: "admin-1" }
    );

    expect(result.appliedPaths).toEqual(["description.about"]);
    expect(capturedUpdate.$set.currentDraft.description.about).toBe("New");
    expect(capturedUpdate.$set.currentDraft.review.text).toBe("Old");
    expect(capturedUpdate.$set.manualOverrideFields).toContain(
      "description.about"
    );
    expect(capturedUpdate.$set.reviewStatus).toBe("needs_changes");
    expect(capturedUpdate.$set.publicationStatus).toBeUndefined();
    expect(capturedUpdate.$set.publishedSnapshot).toBeUndefined();
    expect(capturedUpdate.$set["aiProposals.$[proposal].status"]).toBe(
      "accepted"
    );
    expect(capturedOptions.arrayFilters).toEqual([
      { "proposal.proposalId": "proposal-1", "proposal.status": "proposed" },
    ]);
  });
});

describe("AI content path helpers", () => {
  it("removes protected leaves and selects only requested proposal fields", () => {
    const content = {
      description: { about: "About", howToParticipate: "How" },
      review: { text: "Review" },
    };
    expect(removeProtectedPaths(content, ["description.about"])).toEqual({
      description: { howToParticipate: "How" },
      review: { text: "Review" },
    });
    expect(selectActivityContentPaths(content, ["review.text"])).toEqual({
      review: { text: "Review" },
    });
  });
});
