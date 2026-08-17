import { FomoV2ActivityPublicReadService } from "./activity-public-read.service";
import { Types } from "mongoose";

describe("FomoV2ActivityPublicReadService", () => {
  const service = new FomoV2ActivityPublicReadService(
    {} as any,
    {} as any,
    {} as any
  );

  const publishedRow = (overrides: Record<string, any> = {}) => ({
    _id: "64b000000000000000000001",
    slug: "draft-slug",
    lifecycleStatus: "ended",
    accessTier: "prime",
    canonicalProjectId: "64b000000000000000000099",
    publicationStatus: "published",
    publishedMetadata: {
      slug: "published-slug",
      lifecycleStatus: "active",
      accessTier: "public",
      canonicalProjectId: "64b000000000000000000002",
    },
    publishedSnapshot: {
      name: "Published activity",
      activityType: "Airdrop",
    },
    sources: [{ sourceUrl: "https://source.example/activity" }],
    ...overrides,
  });

  const allowed = { allowed: true, contentRedacted: false } as const;
  const denied = {
    allowed: false,
    contentRedacted: true,
    reason: "nft_required",
  } as const;

  it("loads canonical investors from backer read models with managed logos", async () => {
    const canonicalProjectId = new Types.ObjectId();
    const backerId = new Types.ObjectId();
    const holdingExec = jest.fn().mockResolvedValue([
      {
        canonicalProjectId,
        backerId,
        backerName: "Fallback backer",
        backerType: "fund",
        isLead: true,
      },
    ]);
    const holdingModel = {
      find: jest.fn().mockReturnValue({
        sort: () => ({ lean: () => ({ exec: holdingExec }) }),
      }),
    };
    const backerModel = {
      find: jest.fn().mockReturnValue({
        lean: () => ({
          exec: jest.fn().mockResolvedValue([
            {
              backerId,
              name: "Canonical backer",
              slug: "canonical-backer",
              backerType: "fund",
              logoUrl: "https://assets.fomo.cx/canonical-backer.png",
            },
          ]),
        }),
      }),
    };
    const readService = new FomoV2ActivityPublicReadService(
      {} as any,
      {} as any,
      {} as any,
      undefined,
      undefined,
      holdingModel as any,
      backerModel as any
    );

    const result = await (readService as any).loadCanonicalInvestors([
      canonicalProjectId,
    ]);

    expect(result.get(String(canonicalProjectId))).toEqual([
      expect.objectContaining({
        id: String(backerId),
        name: "Canonical backer",
        logo: "https://assets.fomo.cx/canonical-backer.png",
        image: "https://assets.fomo.cx/canonical-backer.png",
        isLead: true,
      }),
    ]);
  });

  it("always gates public queries by the published metadata snapshot and hidden state", () => {
    const match = service.buildPublicMatch({
      lifecycleStatus: "LIVE,UPCOMING",
      accessTier: "prime",
      type: "Airdrop,Quest",
      excludeType: "Node",
      difficulty: "Easy,Hard",
      hasInvestors: true,
    });

    expect(match).toMatchObject({
      publicationStatus: "published",
      "publishedMetadata.accessTier": "prime",
      "publishedMetadata.lifecycleStatus": { $in: ["active", "upcoming"] },
      "publishedSnapshot.activityType": {
        $in: ["Airdrop", "Quest"],
        $nin: ["Node"],
      },
      "publishedSnapshot.difficulty": { $in: ["easy", "hard"] },
      "publishedSnapshot.investors.0": { $exists: true },
    });
    expect(match.$and).toEqual(
      expect.arrayContaining([
        {
          $or: [{ hiddenAt: { $exists: false } }, { hiddenAt: null }],
        },
        { publishedSnapshot: { $exists: true } },
        { publishedMetadata: { $exists: true } },
      ])
    );
  });

  it("builds similar activity lookup from published fields only", () => {
    const activityId = "64b000000000000000000001";
    const match = (service as any).buildSimilarMatch({
      _id: activityId,
      publishedSnapshot: {
        activityType: "Airdrop",
        category: "DeFi",
        tags: ["testnet"],
      },
    });

    expect(match).toMatchObject({
      publicationStatus: "published",
      _id: { $ne: activityId },
      $or: expect.arrayContaining([
        { "publishedSnapshot.activityType": "Airdrop" },
        { "publishedSnapshot.category": "DeFi" },
        { "publishedSnapshot.tags": { $in: ["testnet"] } },
      ]),
    });
    expect(match.$and).toEqual(
      expect.arrayContaining([
        { publishedSnapshot: { $exists: true } },
        { publishedMetadata: { $exists: true } },
      ])
    );
  });

  it("counts Others as all published activities outside the top five types", async () => {
    const aggregate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue([
        {
          total: [{ count: 10 }],
          activityTypes: [
            { _id: "Airdrop", count: 4 },
            { _id: "Quest", count: 2 },
            { _id: "Testnet", count: 1 },
            { _id: "Node", count: 1 },
            { _id: "Social", count: 1 },
          ],
          categories: [{ _id: "DeFi", count: 3 }],
        },
      ]),
    });
    const readService = new FomoV2ActivityPublicReadService(
      { aggregate } as any,
      {} as any,
      {} as any
    );

    const result = await readService.filters({ accessTier: "prime", limit: 2 });

    const pipeline = aggregate.mock.calls[0][0];
    expect(pipeline[0]).toMatchObject({
      $match: {
        publicationStatus: "published",
        "publishedMetadata.accessTier": "prime",
      },
    });
    expect(pipeline[1].$facet.activityTypes.at(-1)).toEqual({ $limit: 5 });
    expect(result).toMatchObject({
      total: 10,
      activityTypes: [
        { key: "airdrop", value: "Airdrop", label: "Airdrop", count: 4 },
        { key: "quest", value: "Quest", label: "Quest", count: 2 },
      ],
      categories: [{ key: "defi", value: "DeFi", label: "DeFi", count: 3 }],
      otherActivityCount: 1,
      limit: 2,
    });
  });

  it("returns only published sponsored activities ordered by banner priority", async () => {
    const row = publishedRow({
      isSponsored: true,
      sponsoredPriority: 50,
      publishedMetadata: {
        slug: "sponsored-activity",
        lifecycleStatus: "active",
        accessTier: "public",
      },
    });
    const exec = jest.fn().mockResolvedValue([row]);
    const lean = jest.fn().mockReturnValue({ exec });
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    const find = jest.fn().mockReturnValue({ sort });
    const countDocuments = jest.fn().mockResolvedValue(1);
    const accessPolicy = { resolve: jest.fn().mockResolvedValue(allowed) };
    const readService = new FomoV2ActivityPublicReadService(
      { find, countDocuments } as any,
      {} as any,
      accessPolicy as any
    );

    const result = await readService.promoted({ limit: 5 });

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        publicationStatus: "published",
        isSponsored: true,
      }),
      expect.objectContaining({ isSponsored: 1, sponsoredPriority: 1 })
    );
    expect(sort).toHaveBeenCalledWith({
      sponsoredPriority: -1,
      publishedAt: -1,
      _id: -1,
    });
    expect(limit).toHaveBeenCalledWith(5);
    expect(result).toMatchObject({
      total: 1,
      limit: 5,
      items: [
        expect.objectContaining({
          slug: "sponsored-activity",
          isSponsored: true,
          sponsoredPriority: 50,
        }),
      ],
    });
  });

  it("keeps published slug, lifecycle, access and canonical link live until republish", () => {
    const result = (service as any).toPublicActivity(
      publishedRow(),
      {
        _id: "64b000000000000000000002",
        name: "Published canonical",
        primaryWebsiteDomain: "published.example",
      },
      allowed
    );

    expect(result).toMatchObject({
      slug: "published-slug",
      lifecycleStatus: "active",
      status: "active",
      accessTier: "public",
      nftRequired: false,
      canonicalProjectId: "64b000000000000000000002",
      canonicalProject: {
        id: "64b000000000000000000002",
        name: "Published canonical",
        website: "https://published.example",
      },
      name: "Published activity",
    });
    expect(result.slug).not.toBe("draft-slug");
    expect(result.lifecycleStatus).not.toBe("ended");
    expect(result.accessTier).not.toBe("prime");
    expect((service as any).buildIdentityMatch("published-slug")).toMatchObject(
      {
        $or: expect.arrayContaining([
          { "publishedMetadata.slug": "published-slug" },
        ]),
      }
    );
  });

  it("sanitizes historical published HTML again on every public read", () => {
    const result = (service as any).toPublicActivity(
      publishedRow({
        publishedSnapshot: {
          name: "Historical activity",
          activityType: "Airdrop",
          description: {
            aboutHtml:
              '<p onclick="steal()">Safe <strong>content</strong></p>' +
              '<script>alert(1)</script>',
          },
          review: {
            textHtml: '<a href="javascript:alert(1)">Review</a>',
          },
          taskGuide: {
            steps: [
              {
                id: "one",
                descriptionHtml: '<img src="javascript:alert(1)"><b>Step</b>',
              },
            ],
          },
        },
      }),
      null,
      allowed,
    );

    expect(result.description.aboutHtml).toContain("<strong>content</strong>");
    expect(result.description.aboutHtml).not.toMatch(/onclick|script/i);
    expect(result.review.textHtml).toBe("<a>Review</a>");
    expect(result.taskGuide.steps[0].descriptionHtml).toBe("<img><b>Step</b>");
  });

  it("uses canonical project identity data for a linked activity", () => {
    const result = (service as any).toPublicActivity(
      publishedRow({
        publishedSnapshot: {
          name: "Linked activity",
          logo: "https://activity.example/old-logo.png",
          projectLogo: "https://activity.example/old-logo.png",
          symbol: "",
          category: "",
        },
      }),
      {
        _id: "64b000000000000000000002",
        name: "Canonical project",
        symbol: "CNP",
        metadata: {
          image: "https://canonical.example/fallback-logo.png",
        },
        marketProject: {
          logo: "https://canonical.example/logo.png",
          symbol: "MARKET",
          category: "Infrastructure",
        },
      },
      allowed
    );

    expect(result).toMatchObject({
      logo: "https://canonical.example/logo.png",
      projectLogo: "https://canonical.example/logo.png",
      symbol: "CNP",
      category: "Infrastructure",
      canonicalProject: {
        logo: "https://canonical.example/logo.png",
        symbol: "CNP",
        category: "Infrastructure",
      },
    });
  });

  it("uses canonical identity and DB investors instead of raw activity data", () => {
    const result = (service as any).toPublicActivity(
      publishedRow({
        publishedSnapshot: {
          name: "Linked activity",
          projectName: "Raw project name",
          symbol: "ACT",
          category: "Quest",
          investors: [
            {
              name: "Raw investor",
              logo: "https://raw.example/investor.png",
            },
          ],
        },
      }),
      {
        _id: "64b000000000000000000002",
        name: "Canonical project",
        symbol: "CNP",
        metadata: { category: "DeFi" },
        marketProject: {
          logo: "https://canonical.example/logo.png",
          category: "Infrastructure",
        },
        investors: [
          {
            id: "backer-1",
            name: "Canonical investor",
            logo: "https://assets.fomo.cx/backer-1.png",
          },
        ],
      },
      allowed
    );

    expect(result).toMatchObject({
      projectName: "Canonical project",
      logo: "https://canonical.example/logo.png",
      projectLogo: "https://canonical.example/logo.png",
      symbol: "CNP",
      category: "Quest",
      investors: [
        {
          id: "backer-1",
          name: "Canonical investor",
          logo: "https://assets.fomo.cx/backer-1.png",
        },
      ],
    });
    expect(result.investors).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Raw investor" })])
    );
  });

  it("returns a strict Prime teaser without editorial or participation leaks", () => {
    const result = (service as any).toPublicActivity(
      publishedRow({
        publishedMetadata: {
          slug: "prime-activity",
          lifecycleStatus: "active",
          accessTier: "prime",
          canonicalProjectId: "64b000000000000000000002",
        },
        publishedSnapshot: {
          name: "Prime activity",
          activityType: "Airdrop",
          tags: ["testnet"],
          description: {
            about: "Private about",
            aboutHtml: "<p>Private about</p>",
            howToParticipate: "Private steps",
            howToParticipateHtml: "<p>Private steps</p>",
          },
          rewardLabel: "$1,000",
          rewardSupply: 1000,
          rewards: [{ label: "Token reward", amount: 1000 }],
          rewardAmount: 1000,
          rewardDistribution: "Private distribution",
          requirements: ["Connect wallet"],
          joinLink: "https://join.example",
          links: [{ label: "Join", url: "https://join.example" }],
          videoGuides: ["https://video.example"],
          socialLinks: { website: "https://project.example" },
          investors: [
            { name: "Private fund", website: "https://fund.example" },
          ],
          review: { text: "Private review", textHtml: "<p>Review</p>" },
          taskGuide: {
            steps: [{ title: "Private task", ctaUrl: "https://task.example" }],
          },
          metrics: { riskLevel: "low" },
          timeline: [{ title: "Private event" }],
          flags: { green: ["Private flag"] },
        },
      }),
      {
        _id: "64b000000000000000000002",
        name: "Canonical project",
        primaryWebsiteDomain: "canonical.example",
      },
      denied,
      {},
      denied
    );

    expect(result).toMatchObject({
      name: "Prime activity",
      activityType: "Airdrop",
      tags: ["testnet"],
      isRedacted: true,
      sourceUrl: undefined,
      canonicalProject: {
        name: "Canonical project",
        website: undefined,
      },
    });
    for (const field of [
      "description",
      "rewardLabel",
      "rewardSupply",
      "rewards",
      "rewardAmount",
      "rewardDistribution",
      "requirements",
      "joinLink",
      "links",
      "videoGuides",
      "socialLinks",
      "investors",
      "review",
      "taskGuide",
      "metrics",
      "timeline",
      "flags",
    ]) {
      expect(result).not.toHaveProperty(field);
    }
  });

  it("fails closed for nested locked review and task-guide sections", () => {
    const result = (service as any).toPublicActivity(
      publishedRow({
        publishedSnapshot: {
          name: "Public shell",
          description: {
            about: "Public about",
            aboutHtml: "<p>Public about</p>",
            howToParticipate: "Private participation",
            howToParticipateHtml: "<p>Private participation</p>",
          },
          review: {
            isLocked: true,
            text: "Private review",
            textHtml: "<p>Private review</p>",
            scores: [{ label: "Potential", value: 9 }],
          },
          taskGuide: {
            isLocked: true,
            description: "Private task guide",
            ctaUrl: "https://task.example",
            steps: [{ id: "step-1", title: "Private step" }],
          },
          joinLink: "https://join.example",
          links: [{ label: "Join", url: "https://join.example" }],
          videoGuides: ["https://video.example"],
        },
      }),
      null,
      allowed,
      {
        userState: {
          completedStepIds: ["step-1"],
        },
      },
      denied
    );

    expect(result.review).toEqual({ isLocked: true });
    expect(result.taskGuide).toEqual({ isLocked: true });
    expect(result.description).toEqual({
      about: "Public about",
      aboutHtml: "<p>Public about</p>",
    });
    expect(result).not.toHaveProperty("joinLink");
    expect(result).not.toHaveProperty("links");
    expect(result).not.toHaveProperty("videoGuides");
    expect(result.sourceUrl).toBeUndefined();
    expect(result.contentAccess).toEqual({ review: denied, taskGuide: denied });
    expect(result.userState).toMatchObject({
      completedStepIds: [],
      stepsCompleted: 0,
      stepsTotal: 0,
      stepsProgress: 0,
    });
  });

  it("reveals locked sections when Prime entitlement is available", () => {
    const result = (service as any).toPublicActivity(
      publishedRow({
        publishedSnapshot: {
          review: { isLocked: true, text: "Prime review" },
          taskGuide: {
            isLocked: true,
            steps: [{ id: "step-1", title: "Prime step" }],
          },
        },
      }),
      null,
      allowed,
      { userState: { completedStepIds: ["step-1"] } },
      allowed
    );

    expect(result.review).toMatchObject({
      isLocked: true,
      text: "Prime review",
    });
    expect(result.taskGuide.steps).toHaveLength(1);
    expect(result.contentAccess).toEqual({
      review: allowed,
      taskGuide: allowed,
    });
    expect(result.userState).toMatchObject({
      completedStepIds: ["step-1"],
      stepsCompleted: 1,
      stepsTotal: 1,
      stepsProgress: 100,
    });
  });
});
