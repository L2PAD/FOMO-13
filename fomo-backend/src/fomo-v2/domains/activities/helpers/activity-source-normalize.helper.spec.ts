import { Types } from "mongoose";
import { mergeActivitySourceContent } from "./activity-content.helper";
import { normalizeActivitySourceDocument } from "./activity-source-normalize.helper";

describe("normalizeActivitySourceDocument", () => {
  it("normalizes a legacy activity, preserves its ObjectId, and maps NFT access to prime", () => {
    const legacyId = new Types.ObjectId();
    const result = normalizeActivitySourceDocument(
      {
        _id: legacyId,
        id: -42,
        parserActivityId: "parser-42",
        primarySource: "icodrops",
        slug: "Alpha Quest",
        projectName: "Alpha",
        coinSymbol: "ALP",
        status: "LIVE",
        activityType: "QUEST",
        difficulty: "Easy",
        taskFrequency: "Weekly",
        nftRequired: true,
        description: {
          aboutHtml: '<p onclick="steal()">Alpha</p><script>alert(1)</script>',
        },
        review: {
          text: "Evidence-based review",
          textHtml: '<p>Review</p><img src="javascript:alert(1)">',
        },
        investors: [
          {
            _id: "investor-1",
            name: "Fund One",
            image: "https://images.example/fund.png",
            url: "https://fund.example",
          },
        ],
        startDate: "2026-01-01T00:00:00.000Z",
        endDate: "2027-01-01T00:00:00.000Z",
      },
      "legacy",
      new Date("2026-07-01T00:00:00.000Z")
    );

    expect(result).not.toBeNull();
    expect(result?.ingestInput).toEqual(
      expect.objectContaining({
        legacyActivityId: legacyId.toHexString(),
        legacyNumericId: -42,
        parserActivityId: "parser-42",
        lifecycleStatus: "active",
        accessTier: "prime",
      })
    );
    expect(result?.ingestInput.normalizedDraft.difficulty).toBe("easy");
    expect(result?.ingestInput.normalizedDraft.taskFrequency).toBe("weekly");
    expect(result?.ingestInput.normalizedDraft.description?.aboutHtml).toBe(
      "<p>Alpha</p>"
    );
    expect(result?.ingestInput.normalizedDraft.review?.textHtml).not.toContain(
      "javascript:"
    );
    expect(result?.ingestInput.normalizedDraft.investors).toEqual([
      expect.objectContaining({
        id: "investor-1",
        name: "Fund One",
        website: "https://fund.example",
      }),
    ]);
  });

  it("treats parser ids as parser identity without claiming a legacy ObjectId", () => {
    const parserId = new Types.ObjectId();
    const result = normalizeActivitySourceDocument(
      {
        _id: parserId,
        source: "dropstab",
        name: "Beta",
        type: "airdrop",
        socialLinks: { website: "https://www.beta.example/docs" },
        status: "CANCELED",
      },
      "parser"
    );

    expect(result?.ingestInput.legacyActivityId).toBeUndefined();
    expect(result?.ingestInput.parserActivityId).toBe(parserId.toHexString());
    expect(result?.ingestInput.lifecycleStatus).toBe("cancelled");
    expect(result?.ingestInput.normalizedDraft.activityType).toBe("Airdrop");
    expect(result?.resolverIdentity.websiteDomain).toBe("beta.example");
  });

  it("rejects rows that cannot form a stable project/activity identity", () => {
    expect(
      normalizeActivitySourceDocument({ _id: new Types.ObjectId() }, "parser")
    ).toBeNull();
  });

  it("keeps an omitted sparse field absent so it cannot erase richer content", () => {
    const result = normalizeActivitySourceDocument(
      {
        _id: "source-1",
        slug: "rich-project",
        name: "Rich Project",
        review: { text: "Updated review" },
        taskGuide: { description: "Updated guide" },
        socialLinks: { website: "https://rich.example" },
        flags: { green: ["New evidence"] },
      },
      "parser"
    );
    const sparse = result!.ingestInput.normalizedDraft as any;

    for (const field of [
      "activityType",
      "category",
      "isHot",
      "ecosystem",
      "platform",
      "tags",
      "requirements",
      "rewards",
      "links",
      "videoGuides",
      "relatedAssets",
      "investors",
      "timeline",
    ]) {
      expect(Object.prototype.hasOwnProperty.call(sparse, field)).toBe(false);
    }
    expect(sparse.review).not.toHaveProperty("scores");
    expect(sparse.taskGuide).not.toHaveProperty("steps");
    expect(sparse.socialLinks).not.toHaveProperty("custom");
    expect(sparse.flags).not.toHaveProperty("yellow");
    expect(sparse.flags).not.toHaveProperty("red");

    const merged = mergeActivitySourceContent(
      {
        name: "Rich Project",
        projectName: "Rich Project",
        activityType: "Quest",
        category: "Growth",
        isHot: true,
        tags: ["reviewed"],
        review: { text: "Old review", scores: [{ label: "Trust", value: 90 }] },
        taskGuide: {
          description: "Old guide",
          steps: [{ id: "1", title: "Connect" }],
        },
        socialLinks: {
          custom: [{ label: "Explorer", url: "https://explorer.example" }],
        },
        flags: { yellow: ["Watch unlocks"], red: [] },
      },
      sparse,
      []
    );

    expect(merged.activityType).toBe("Quest");
    expect(merged.category).toBe("Growth");
    expect(merged.isHot).toBe(true);
    expect(merged.tags).toEqual(["reviewed"]);
    expect(merged.review?.scores).toEqual([{ label: "Trust", value: 90 }]);
    expect(merged.taskGuide?.steps).toEqual([{ id: "1", title: "Connect" }]);
    expect(merged.socialLinks?.custom).toEqual([
      { label: "Explorer", url: "https://explorer.example" },
    ]);
    expect(merged.flags?.yellow).toEqual(["Watch unlocks"]);
  });

  it("preserves explicit false and empty-array source decisions", () => {
    const result = normalizeActivitySourceDocument(
      {
        _id: "source-2",
        name: "Explicit Project",
        slug: "explicit-project",
        activityType: "Other",
        isHot: false,
        tags: [],
        review: { scores: [] },
        taskGuide: { steps: [] },
      },
      "parser"
    );

    expect(result?.ingestInput.normalizedDraft).toEqual(
      expect.objectContaining({
        activityType: "Other",
        isHot: false,
        tags: [],
        review: { scores: [] },
        taskGuide: { steps: [] },
      })
    );
  });
});
