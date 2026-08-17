import { ConfigService } from "@nestjs/config";
import { FomoV2LaunchpadDeploymentService } from "./launchpad-deployment.service";
import { FomoV2LaunchpadPublicService } from "./launchpad-public.service";

function service(overrides: {
  poolModel?: any;
  placementModel?: any;
  participantModel?: any;
  userModel?: any;
  canonicalProjectModel?: any;
  sourceProfileModel?: any;
  icoReadModel?: any;
  fundingReadModel?: any;
  chainService?: any;
} = {}) {
  return new FomoV2LaunchpadPublicService(
    (overrides.poolModel || {}) as any,
    (overrides.placementModel || {}) as any,
    (overrides.participantModel || {}) as any,
    (overrides.userModel || {}) as any,
    (overrides.canonicalProjectModel || {}) as any,
    (overrides.sourceProfileModel || {}) as any,
    (overrides.icoReadModel || {}) as any,
    (overrides.fundingReadModel || {}) as any,
    new FomoV2LaunchpadDeploymentService(new ConfigService({})),
    (overrides.chainService || {}) as any,
    {} as any
  );
}

describe("FomoV2LaunchpadPublicService", () => {
  it("uses launch overrides first and canonical/read-model data as fallback", () => {
    const context = {
      canonical: {
        _id: "507f1f77bcf86cd799439011",
        name: "Canonical name",
        metadata: {
          logo: "/canonical.png",
          team: [{ name: "Canonical team", role: "Founder" }],
        },
      },
      profile: {
        description: "Profile description",
        categories: ["Infrastructure"],
      },
      ico: { metadata: {} },
      fundingRounds: [
        {
          investors: [{ sourceBackerId: "fund-1", name: "Fund One", logo: "/fund.png" }],
        },
      ],
    };

    expect(
      (service() as any).effectiveLaunchDetails(
        { title: "Launch override", description: "Launch description" },
        context
      )
    ).toMatchObject({
      title: "Launch override",
      description: "Launch description",
      logoUrl: "/canonical.png",
      category: "Infrastructure",
      investors: [{ id: "fund-1", name: "Fund One", logoUrl: "/fund.png" }],
      team: [{ name: "Canonical team", role: "Founder" }],
    });
  });

  it("exposes the same nested amount shape in list summaries as in detail", () => {
    const pool = {
      _id: "507f1f77bcf86cd799439020",
      canonicalProjectId: "507f1f77bcf86cd799439011",
      slug: "stable-shape",
      status: "closed",
      publicationStatus: "published",
      chainId: 97,
      launchpadAddress: "0x0608b52aac58e7313481d0809e8b4525bdd11d33",
      poolId: "1",
      createParams: {
        investToken: "0x4eef2a62e8a63b713c96cbadac4c6622d1eab948",
        targetAmount: "1000000000000000000000",
      },
      onchainState: {
        closed: true,
        claimEnabled: true,
        raisedAmount: "900719925474099312345",
        participantCount: 1,
        claimedParticipantCount: 0,
        projectToken: "0x4eef2a62e8a63b713c96cbadac4c6622d1eab948",
      },
      launchDetails: {},
    };
    const summary = (service() as any).summary(pool, {
      canonical: { _id: pool.canonicalProjectId, name: "Project", metadata: {} },
      profile: {},
      ico: {},
      fundingRounds: [],
    });

    expect(summary).toMatchObject({
      publicationStatus: "published",
      lifecycle: "claim",
      pool: {
        createParams: { targetAmount: "1000000000000000000000" },
        onchainState: { raisedAmount: "900719925474099312345" },
      },
      contract: {
        investToken: { symbol: "USDT", decimals: 18 },
        projectToken: { symbol: "USDT", decimals: 18 },
        claimKind: "payment_token_refund",
        stakingNftAddress: "0x512C670006456D46679A67456eBe8564810C5609",
      },
    });
  });

  it("treats targetAmount as a hard cap and derives refund only from the settlement token", () => {
    const subject = service() as any;
    const investToken = "0x4eef2a62e8a63b713c96cbadac4c6622d1eab948";
    const pool = {
      status: "closed",
      createParams: { investToken, targetAmount: "1000" },
    };
    const underTargetProjectSettlement = {
      closed: true,
      claimEnabled: true,
      targetAmount: "1000",
      raisedAmount: "750",
      participantCount: 1,
      claimedParticipantCount: 0,
      investToken,
      projectToken: "0x1111111111111111111111111111111111111111",
    };

    expect(subject.lifecycle(pool, underTargetProjectSettlement)).toBe("claim");
    expect(subject.claimKind(pool, underTargetProjectSettlement)).toBe(
      "project_token"
    );
    expect(
      subject.claimKind(pool, {
        ...underTargetProjectSettlement,
        projectToken: investToken,
      })
    ).toBe("payment_token_refund");
  });

  it("completes a settled closed pool when there are no participants", () => {
    expect(
      (service() as any).lifecycle(
        { status: "closed", createParams: { targetAmount: "1000" } },
        {
          closed: true,
          claimEnabled: true,
          raisedAmount: "0",
          participantCount: 0,
          claimedParticipantCount: 0,
        }
      )
    ).toBe("completed");
  });

  it("uses the ICO profile-only payload for canonical project fallbacks", () => {
    const context = {
      canonical: { _id: "507f1f77bcf86cd799439011", metadata: {} },
      profile: {},
      ico: {
        metadata: {
          icodropsProfileOnly: {
            name: "ICO profile name",
            description: "ICO profile description",
            logoUrl: "/ico-profile.png",
            categories: ["DeFi"],
            team: [
              {
                id: "founder-1",
                name: "Ada Founder",
                position: "Founder",
                image: "/ada.png",
              },
            ],
            fundraising: {
              rounds: [
                {
                  investors: [
                    { id: "fund-1", title: "Profile Fund", avatar: "/fund.png" },
                  ],
                },
              ],
            },
          },
        },
      },
      fundingRounds: [],
    };

    expect((service() as any).effectiveLaunchDetails({}, context)).toMatchObject({
      title: "ICO profile name",
      description: "ICO profile description",
      logoUrl: "/ico-profile.png",
      category: "DeFi",
      investors: [
        { id: "fund-1", name: "Profile Fund", logoUrl: "/fund.png" },
      ],
      team: [
        {
          id: "founder-1",
          name: "Ada Founder",
          role: "Founder",
          avatarUrl: "/ada.png",
        },
      ],
    });
  });

  it("returns a deduplicated cross-pool candidate list of staked NFT ids", async () => {
    const lean = jest.fn().mockResolvedValue([
      { activeStakedTokenIds: ["12", "9"] },
      { activeStakedTokenIds: ["12", "105"] },
    ]);
    const find = jest.fn().mockReturnValue({ lean });
    const readUserState = jest.fn().mockResolvedValue({
      investedAmount: "42",
      activeStakedTokenIds: ["9"],
      activeStakeCount: 1,
    });
    const subject = service({
      participantModel: { find },
      chainService: { readUserState },
    });
    const pool = {
      _id: "507f1f77bcf86cd799439020",
      poolId: "7",
      chainId: 97,
      launchpadAddress: "0x0608B52aAC58E7313481d0809E8b4525BDD11d33",
    };

    const participation = await (subject as any).participation(
      pool,
      "0xD128f1E3b2938eB005Bc5c750A66b82173f62857",
      undefined,
      {},
      null,
      { symbol: "USDT" },
      null
    );

    expect(participation).toMatchObject({
      wallet: "0xd128f1e3b2938eb005bc5c750a66b82173f62857",
      activeStakedTokenIds: ["9"],
      reusableStakedTokenIds: ["9", "12", "105"],
    });
    expect(find).toHaveBeenCalledWith({
      chainId: 97,
      launchpadAddress: "0x0608b52aac58e7313481d0809e8b4525bdd11d33",
      walletAddress: "0xd128f1e3b2938eb005bc5c750a66b82173f62857",
      activeStakedTokenIds: { $exists: true, $ne: [] },
    });
  });

  it("enriches leaderboard wallets with user avatars and persisted claim amounts", async () => {
    const wallet = "0xd128f1e3b2938eb005bc5c750a66b82173f62857";
    const participantFind = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          walletAddress: wallet,
          activeStakeCount: 3,
          claimed: true,
          claimAmount: "500000000000000000000",
        },
      ]),
    });
    const userFind = jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          wallet,
          name: "FOMO Holder",
          photo: "/uploads/custom-avatar.png",
          twitterData: { photo: "https://twitter.example/avatar.png" },
        },
      ]),
    });
    const subject = service({
      participantModel: { find: participantFind },
      userModel: { find: userFind },
    }) as any;

    const rows = await subject.loadLeaderboardRows(
      "507f1f77bcf86cd799439020",
      [wallet]
    );
    const leaderboard = subject.leaderboard(
      rows,
      [wallet],
      { greenSeats: "1", yellowSeats: "0" },
      { createParams: {} }
    );

    expect(userFind).toHaveBeenCalledWith(
      { wallet: { $in: [wallet] } },
      {
        wallet: 1,
        name: 1,
        username: 1,
        photo: 1,
        twitterData: 1,
      }
    );
    expect(leaderboard).toEqual([
      expect.objectContaining({
        wallet,
        claimed: true,
        claimAmount: "500000000000000000000",
        avatarUrl: "/uploads/custom-avatar.png",
        displayName: "FOMO Holder",
      }),
    ]);
  });

  it("merges live contract fields into persisted aggregate counters and completes settlement", async () => {
    const query = (value: any) => {
      const result: any = {
        lean: jest.fn().mockResolvedValue(value),
      };
      result.sort = jest.fn().mockReturnValue(result);
      result.limit = jest.fn().mockReturnValue(result);
      return result;
    };
    const pool = {
      _id: "507f1f77bcf86cd799439020",
      canonicalProjectId: "507f1f77bcf86cd799439011",
      slug: "settled-launch",
      status: "closed",
      publicationStatus: "published",
      chainId: 97,
      launchpadAddress: "0x0608b52aac58e7313481d0809e8b4525bdd11d33",
      poolId: "7",
      createParams: {
        investToken: "0x4eef2a62e8a63b713c96cbadac4c6622d1eab948",
        targetAmount: "1000",
      },
      onchainState: {
        participantCount: 2,
        claimedParticipantCount: 2,
        lastEventBlock: "119507999",
        projectTokenMetadata: {
          address: "0x1111111111111111111111111111111111111111",
          symbol: "SET",
          decimals: 8,
        },
      },
      launchDetails: {},
    };
    const readPoolInfo = jest.fn().mockResolvedValue({
      exists: true,
      closed: true,
      claimEnabled: true,
      raisedAmount: "750",
      investToken: pool.createParams.investToken,
      projectToken: "0x1111111111111111111111111111111111111111",
    });
    const subject = service({
      poolModel: {
        findOne: jest.fn().mockReturnValue(query(pool)),
        find: jest.fn().mockReturnValue(query([])),
      },
      placementModel: { find: jest.fn().mockReturnValue(query([])) },
      participantModel: { find: jest.fn().mockReturnValue(query([])) },
      canonicalProjectModel: {
        findById: jest
          .fn()
          .mockReturnValue(
            query({ _id: pool.canonicalProjectId, name: "Settled", metadata: {} })
          ),
      },
      sourceProfileModel: { findOne: jest.fn().mockReturnValue(query(null)) },
      icoReadModel: { findOne: jest.fn().mockReturnValue(query(null)) },
      fundingReadModel: { find: jest.fn().mockReturnValue(query([])) },
      chainService: {
        readPoolInfo,
        readSortedParticipants: jest.fn().mockResolvedValue([]),
      },
    });

    const detail = await subject.detail(pool.slug);

    expect(detail.lifecycle).toBe("completed");
    expect(detail.pool.onchainState).toMatchObject({
      participantCount: 2,
      claimedParticipantCount: 2,
      lastEventBlock: "119507999",
      raisedAmount: "750",
      closed: true,
    });
    expect(detail.contract.projectToken).toMatchObject({
      symbol: "SET",
      decimals: 8,
    });
    expect(detail.contract.claimKind).toBe("project_token");
  });
});
