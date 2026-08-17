import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User } from "src/user/user.model";
import {
  FomoV2CanonicalProject,
  FomoV2FundingFeedRoundReadModel,
  FomoV2IcoProjectReadModel,
  FomoV2ProjectSourceProfile,
} from "../../../models";
import {
  FomoV2LaunchpadParticipant,
  FomoV2LaunchpadPlacement,
  FomoV2LaunchpadPool,
} from "../models";
import {
  FomoV2LaunchpadPublicListQueryDto,
  FomoV2LaunchpadVerifyUserTransactionDto,
} from "../dto";
import { FomoV2LaunchpadPublicParticipation } from "../types";
import { FomoV2LaunchpadChainService } from "./launchpad-chain.service";
import { FomoV2LaunchpadDeploymentService } from "./launchpad-deployment.service";
import { FomoV2LaunchpadSyncService } from "./launchpad-sync.service";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

@Injectable()
export class FomoV2LaunchpadPublicService {
  constructor(
    @InjectModel(FomoV2LaunchpadPool.name)
    private readonly poolModel: Model<FomoV2LaunchpadPool>,
    @InjectModel(FomoV2LaunchpadPlacement.name)
    private readonly placementModel: Model<FomoV2LaunchpadPlacement>,
    @InjectModel(FomoV2LaunchpadParticipant.name)
    private readonly participantModel: Model<FomoV2LaunchpadParticipant>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(FomoV2CanonicalProject.name)
    private readonly canonicalProjectModel: Model<FomoV2CanonicalProject>,
    @InjectModel(FomoV2ProjectSourceProfile.name)
    private readonly sourceProfileModel: Model<FomoV2ProjectSourceProfile>,
    @InjectModel(FomoV2IcoProjectReadModel.name)
    private readonly icoReadModel: Model<FomoV2IcoProjectReadModel>,
    @InjectModel(FomoV2FundingFeedRoundReadModel.name)
    private readonly fundingReadModel: Model<FomoV2FundingFeedRoundReadModel>,
    private readonly deploymentService: FomoV2LaunchpadDeploymentService,
    private readonly chainService: FomoV2LaunchpadChainService,
    private readonly syncService: FomoV2LaunchpadSyncService
  ) {}

  async list(query: FomoV2LaunchpadPublicListQueryDto = {}) {
    const surface = query.surface || "launchpad";
    const limit = query.limit || 30;
    const offset = query.offset || 0;
    const placements = await this.placementModel
      .find({
        surface,
        enabled: true,
        "banner.desktopUrl": { $type: "string", $ne: "" },
      })
      .sort({ featured: -1, ad: -1, sortOrder: 1, _id: 1 })
      .lean();
    if (!placements.length) return { items: [], total: 0, limit, offset, surface };
    const poolIds = placements.map((item: any) => item.launchpadPoolId);
    const pools = await this.poolModel
      .find({
        _id: { $in: poolIds },
        status: { $in: ["active", "closed"] },
        publicationStatus: "published",
        poolId: { $type: "string", $ne: "" },
      })
      .lean();
    const poolById = new Map(pools.map((pool: any) => [String(pool._id), pool]));
    const eligiblePlacements = placements.filter((placement: any) =>
      poolById.has(String(placement.launchpadPoolId))
    );
    const page = eligiblePlacements.slice(offset, offset + limit);
    const items = await Promise.all(
      page.map(async (placement: any) => {
        const pool = poolById.get(String(placement.launchpadPoolId));
        const context = await this.loadProjectContext(pool);
        return this.summary(pool, context, placement);
      })
    );
    return {
      items,
      total: eligiblePlacements.length,
      limit,
      offset,
      surface,
    };
  }

  async detail(idOrSlug: string, walletAddress?: string) {
    const pool = await this.findPublishedPool(idOrSlug);
    const [context, indexedParticipant] = await Promise.all([
      this.loadProjectContext(pool),
      walletAddress
        ? this.participantModel
            .findOne({
              launchpadPoolId: pool._id,
              walletAddress: walletAddress.toLowerCase(),
            })
            .lean()
        : undefined,
    ]);
    const persistedPoolState = { ...(pool.onchainState || {}) };
    let livePool = persistedPoolState;
    if (pool.poolId) {
      try {
        livePool = {
          ...persistedPoolState,
          ...(await this.chainService.readPoolInfo(pool.poolId)),
        };
      } catch {
        // The persisted finalized snapshot remains available during RPC incidents.
      }
    }
    const lifecycle = this.lifecycle(pool, livePool);
    const claimKind = this.claimKind(pool, livePool);
    const paymentToken = {
      address: String(livePool.investToken || pool.createParams?.investToken || "").toLowerCase(),
      symbol: this.deploymentService.getDeployment().investTokenSymbol,
      decimals: this.deploymentService.getDeployment().investTokenDecimals,
    };
    const projectTokenAddress = String(livePool.projectToken || "").toLowerCase();
    const projectToken = this.publicProjectToken(
      pool,
      livePool,
      paymentToken,
      projectTokenAddress
    );
    const participation = walletAddress
      ? await this.participation(
          pool,
          walletAddress,
          indexedParticipant,
          livePool,
          claimKind,
          paymentToken,
          projectToken
        )
      : null;
    let sortedParticipantAddresses: string[] = [];
    try {
      sortedParticipantAddresses = await this.chainService.readSortedParticipants(pool.poolId);
    } catch {
      // Finalized indexed stake state is the degraded-mode fallback.
    }
    const leaderboardRows = await this.loadLeaderboardRows(
      pool._id,
      sortedParticipantAddresses
    );
    const leaderboard = this.leaderboard(
      leaderboardRows,
      sortedParticipantAddresses,
      livePool,
      pool
    );
    const similar = await this.similar(pool, context);
    return {
      id: String(pool._id),
      slug: pool.slug,
      status: pool.status,
      publicationStatus: pool.publicationStatus,
      lifecycle,
      project: this.project(context, pool.launchDetails || {}),
      launch: this.effectiveLaunchDetails(pool.launchDetails || {}, context),
      pool: {
        poolId: pool.poolId,
        createParams: pool.createParams || {},
        onchainState: livePool,
      },
      contract: {
        chainId: pool.chainId,
        address: pool.launchpadAddress,
        explorerUrl: this.deploymentService.getDeployment().explorerUrl,
        stakingNftAddress: this.deploymentService.getDeployment().stakingNftAddress,
        nftMarketAddress: this.deploymentService.getDeployment().nftMarketAddress,
        investToken: paymentToken,
        projectToken,
        claimKind,
        sync: this.syncMetadata(pool, livePool),
      },
      participation,
      leaderboard,
      similar,
    };
  }

  async verifyTransaction(
    idOrSlug: string,
    input: FomoV2LaunchpadVerifyUserTransactionDto
  ) {
    const pool = await this.findPublishedPool(idOrSlug);
    const verification = await this.syncService.verifyAndApplyUserTransaction({
      pool,
      txHash: input.txHash.toLowerCase(),
      action: input.action,
      wallet: input.wallet.toLowerCase(),
    });
    const { events: _decodedEvents, ...publicVerification } = verification;
    return {
      verification: publicVerification,
      launch: await this.detail(String(pool._id), input.wallet),
    };
  }

  private async findPublishedPool(idOrSlug: string): Promise<any> {
    let lookup: string;
    try {
      lookup = decodeURIComponent(String(idOrSlug || "")).trim();
    } catch {
      throw new NotFoundException("Published Launchpad pool not found.");
    }
    const conditions: any[] = [{ slug: lookup }, { poolId: lookup }];
    if (Types.ObjectId.isValid(lookup)) conditions.push({ _id: new Types.ObjectId(lookup) });
    const pool = await this.poolModel
      .findOne({
        publicationStatus: "published",
        status: { $in: ["active", "closed"] },
        poolId: { $type: "string", $ne: "" },
        $or: conditions,
      })
      .lean();
    if (!pool) throw new NotFoundException("Published Launchpad pool not found.");
    return pool;
  }

  private async loadProjectContext(pool: any): Promise<Record<string, any>> {
    const canonicalId = pool.canonicalProjectId;
    const [canonical, profile, ico, fundingRounds] = await Promise.all([
      this.canonicalProjectModel.findById(canonicalId).lean(),
      this.sourceProfileModel
        .findOne({ canonicalProjectId: canonicalId })
        .sort({ updatedAt: -1, _id: 1 })
        .lean(),
      this.icoReadModel
        .findOne({ canonicalProjectId: canonicalId })
        .sort({ sourceType: 1, updatedAt: -1 })
        .lean(),
      this.fundingReadModel
        .find({ canonicalProjectId: canonicalId, visible: true })
        .sort({ fundingDate: -1, _id: -1 })
        .lean(),
    ]);
    return { canonical, profile, ico, fundingRounds };
  }

  private project(context: any, details: any) {
    const canonical = context.canonical || {};
    const canonicalMetadata = canonical.metadata || {};
    const profile = context.profile || {};
    const ico = context.ico || {};
    const icoProfile = ico.metadata?.icodropsProfileOnly || {};
    const socials = {
      ...this.asRecord(canonicalMetadata.socials),
      ...this.asRecord(icoProfile.socials),
      ...this.asRecord(icoProfile.social),
      ...this.asRecord(icoProfile.socialmedia),
      ...this.asRecord(icoProfile.links),
      ...this.asRecord(ico.metadata?.socials),
      ...this.asRecord(profile.socials),
      ...this.asRecord(details.links),
    };
    const fundingRows = context.fundingRounds || [];
    const effective = this.effectiveLaunchDetails(details, context);
    return {
      id: String(canonical._id || ""),
      name: this.first(details.title, canonical.name, profile.name, ico.name, icoProfile.name),
      symbol: this.first(
        details.tokenDisplay?.symbol,
        canonical.symbol,
        profile.symbol,
        ico.symbol,
        icoProfile.symbol
      ),
      slug: this.first(canonical.slug, profile.slug, ico.slug, icoProfile.slug),
      logoUrl: this.first(
        details.logoUrl,
        canonicalMetadata.logo,
        canonicalMetadata.logoUrl,
        profile.logoUrl,
        ico.logoUrl,
        icoProfile.logoUrl,
        icoProfile.logo
      ),
      description: this.first(
        details.description,
        details.shortDescription,
        canonicalMetadata.description,
        profile.description,
        ico.description,
        icoProfile.description,
        icoProfile.about
      ),
      website: this.first(
        details.links?.website,
        canonicalMetadata.website,
        profile.website,
        ico.website,
        icoProfile.website,
        icoProfile.links?.website,
        canonical.primaryWebsiteDomain
          ? `https://${canonical.primaryWebsiteDomain}`
          : undefined
      ),
      socials,
      categories: this.nonEmptyArray(
        details.category ? [details.category] : undefined,
        profile.categories,
        ico.categories,
        icoProfile.categories,
        canonicalMetadata.categories
      ),
      funding: {
        totalRaisedUsd: fundingRows.reduce(
          (sum: number, row: any) => sum + (Number.isFinite(row.raisedAmount) ? Number(row.raisedAmount) : 0),
          0
        ),
        fundingTypes: Array.from(
          new Set(
            fundingRows.flatMap((row: any) =>
              (row.fundingTypeKeys?.length ? row.fundingTypeKeys : [row.roundType]).filter(Boolean)
            )
          )
        ),
      },
      investors: effective.investors || [],
      team: effective.team || [],
      analysisFlags: effective.analysisFlags || { green: [], yellow: [], red: [] },
    };
  }

  private effectiveLaunchDetails(details: any, context: any): Record<string, any> {
    const metadata = context.canonical?.metadata || {};
    const profileMetadata = context.profile?.metadata || {};
    const icoMetadata = context.ico?.metadata || {};
    const icoProfile = icoMetadata.icodropsProfileOnly || {};
    const fundingInvestors = (context.fundingRounds || [])
      .flatMap((row: any) => row.investors || [])
      .map((investor: any) => ({
        id: this.first(investor.backerId, investor.sourceBackerId, investor.slug),
        name: investor.name,
        logoUrl: investor.logo,
        website: investor.sourceBackerUrl,
      }))
      .filter((investor: any) => investor.name);
    const icoProfileInvestors = [
      ...this.asArray(icoProfile.fundraising?.investors),
      ...this.asArray(icoProfile.investors),
      ...this.asArray(icoProfile.fundraising?.rounds).flatMap(
        (round: any) => this.asArray(round?.investors)
      ),
      ...this.asArray(icoProfile.saleRounds).flatMap(
        (round: any) => this.asArray(round?.investors)
      ),
    ];
    const investors = this.normalizePeople(
      this.nonEmptyArray(
        details.investors,
        fundingInvestors,
        icoProfileInvestors,
        icoMetadata.investors,
        profileMetadata.investors,
        metadata.investors
      ),
      "investor"
    );
    const team = this.normalizePeople(
      this.nonEmptyArray(
        details.team,
        icoProfile.team,
        icoMetadata.team,
        icoMetadata.teamMembers,
        profileMetadata.team,
        metadata.team
      ),
      "team"
    );
    const fallbackFlags = {
      green: this.nonEmptyArray(
        icoProfile.greenFlagsList,
        icoMetadata.greenFlagsList,
        metadata.greenFlagsList
      ),
      yellow: this.nonEmptyArray(
        icoProfile.yellowFlagsList,
        icoMetadata.yellowFlagsList,
        metadata.yellowFlagsList
      ),
      red: this.nonEmptyArray(
        icoProfile.redFlagsList,
        icoMetadata.redFlagsList,
        metadata.redFlagsList
      ),
    };
    const analysisFlags = this.hasAnalysisFlags(details.analysisFlags)
      ? details.analysisFlags
      : fallbackFlags;
    return {
      ...details,
      title: this.first(
        details.title,
        context.canonical?.name,
        context.profile?.name,
        context.ico?.name,
        icoProfile.name
      ),
      shortDescription: this.first(
        details.shortDescription,
        context.profile?.description,
        context.ico?.description,
        icoProfile.description,
        icoProfile.about,
        metadata.description
      ),
      description: this.first(
        details.description,
        context.profile?.description,
        context.ico?.description,
        icoProfile.description,
        icoProfile.about,
        metadata.description
      ),
      logoUrl: this.first(
        details.logoUrl,
        metadata.logo,
        metadata.logoUrl,
        context.profile?.logoUrl,
        context.ico?.logoUrl,
        icoProfile.logoUrl,
        icoProfile.logo
      ),
      category: this.first(
        details.category,
        context.profile?.categories?.[0],
        context.ico?.categories?.[0],
        icoProfile.categories?.[0]
      ),
      investors: this.dedupePeople(investors),
      team,
      analysisFlags,
    };
  }

  private async participation(
    pool: any,
    walletAddress: string,
    indexed: any,
    livePool: any,
    claimKind: any,
    paymentToken: any,
    projectToken: any
  ): Promise<FomoV2LaunchpadPublicParticipation> {
    const wallet = walletAddress.toLowerCase();
    const [live, reusableStakedTokenIds] = await Promise.all([
      this.readLiveUserState(pool.poolId, wallet),
      this.reusableStakedTokenIds(pool, wallet),
    ]);
    const claimAsset =
      claimKind === "payment_token_refund" ? paymentToken : projectToken;
    return {
      wallet,
      investedAmount: String(live?.investedAmount ?? indexed?.investedAmount ?? "0"),
      grossAmount: String(indexed?.grossAmount || "0"),
      netAmount: String(indexed?.netAmount || "0"),
      feeAmount: String(indexed?.feeAmount || "0"),
      receiptTokenIds: live?.receiptTokenIds || indexed?.receiptTokenIds || [],
      activeStakedTokenIds:
        live?.activeStakedTokenIds || indexed?.activeStakedTokenIds || [],
      // Candidate IDs already held by this Launchpad for the wallet in any pool.
      // The client must still validate owner/usageCount/isTokenStakedInPool before staking.
      reusableStakedTokenIds,
      activeStakeCount: Number(
        live?.activeStakeCount ?? indexed?.activeStakeCount ?? 0
      ),
      firstStakeTime: String(live?.firstStakeTime || "0"),
      unstakeablePools: live?.unstakeablePools || [],
      claimed: Boolean(live?.claimed ?? indexed?.claimed),
      claimAmount: String(
        indexed?.claimed
          ? indexed?.claimAmount || "0"
          : live?.claimAmount ?? indexed?.claimAmount ?? "0"
      ),
      claimKind,
      zone: Number(live?.zone || 0),
      yellowSlotStart: String(live?.yellowSlotStart || "0"),
      yellowSlotEnd: String(live?.yellowSlotEnd || "0"),
      rank: String(live?.rank || "0"),
      canInvestNow: Boolean(live?.canInvestNow),
      maxAllowedNow: String(live?.maxAllowedNow || "0"),
      canClaim: Boolean(live?.canClaim),
      canRefund: Boolean(live?.canRefund && claimKind === "payment_token_refund"),
      canUnstake: Boolean(live?.canUnstake),
      claimAsset,
    };
  }

  private async readLiveUserState(poolId: string, wallet: string): Promise<any> {
    try {
      return await this.chainService.readUserState(poolId, wallet);
    } catch {
      return undefined;
    }
  }

  private async reusableStakedTokenIds(
    pool: any,
    wallet: string
  ): Promise<string[]> {
    const rows = await this.participantModel
      .find({
        chainId: pool.chainId,
        launchpadAddress: String(pool.launchpadAddress || "").toLowerCase(),
        walletAddress: wallet,
        activeStakedTokenIds: { $exists: true, $ne: [] },
      })
      .lean();
    return Array.from(
      new Set(
        rows.flatMap((row: any) =>
          (row.activeStakedTokenIds || []).map((tokenId: any) => String(tokenId))
        )
      )
    )
      .filter((tokenId) => /^\d+$/.test(tokenId))
      .sort((left, right) => {
        const leftId = BigInt(left);
        const rightId = BigInt(right);
        return leftId < rightId ? -1 : leftId > rightId ? 1 : 0;
      });
  }

  private leaderboard(
    rows: any[],
    sortedAddresses: string[],
    state: any,
    pool: any
  ) {
    const byWallet = new Map(
      rows.map((row) => [String(row.walletAddress).toLowerCase(), row])
    );
    const sorted = sortedAddresses.length
      ? sortedAddresses.map((wallet) => {
          const normalized = String(wallet).toLowerCase();
          return byWallet.get(normalized) || { walletAddress: normalized };
        })
      : [...rows].sort((left, right) => {
          const leftStake = Number(left.activeStakeCount || 0);
          const rightStake = Number(right.activeStakeCount || 0);
          if (leftStake !== rightStake) return rightStake - leftStake;
          return String(left.firstSeenBlock || "0").localeCompare(
            String(right.firstSeenBlock || "0"),
            undefined,
            { numeric: true }
          );
        });
    const greenSeats = BigInt(state.greenSeats || pool.createParams?.greenSeats || 0);
    const yellowSeats = BigInt(state.yellowSeats || pool.createParams?.yellowSeats || 0);
    return sorted.slice(0, 100).map((row, index) => {
      const rank = BigInt(index + 1);
      const zone = rank <= greenSeats ? 1 : rank <= greenSeats + yellowSeats ? 2 : 0;
      return {
        wallet: row.walletAddress,
        investedAmount: String(row.investedAmount || row.netAmount || "0"),
        claimed: Boolean(row.claimed),
        claimAmount: String(row.claimAmount || "0"),
        activeStakeCount: Number(row.activeStakeCount || 0),
        rank: String(index + 1),
        zone,
        avatarUrl: row.avatarUrl,
        displayName: row.displayName,
      };
    });
  }

  private async loadLeaderboardRows(
    launchpadPoolId: any,
    sortedAddresses: string[]
  ): Promise<any[]> {
    let participantRows: any[];
    if (sortedAddresses.length) {
      participantRows = await this.participantModel
        .find({
          launchpadPoolId,
          walletAddress: {
            $in: sortedAddresses.slice(0, 100).map((wallet) => wallet.toLowerCase()),
          },
        })
        .lean();
    } else {
      participantRows = await this.participantModel
        .find({ launchpadPoolId })
        .sort({ activeStakeCount: -1, firstSeenBlock: 1, _id: 1 })
        .limit(100)
        .lean();
    }

    const participantByWallet = new Map(
      participantRows.map((row) => [
        String(row.walletAddress || "").toLowerCase(),
        row,
      ])
    );
    const wallets = Array.from(
      new Set(
        (sortedAddresses.length
          ? sortedAddresses.slice(0, 100)
          : participantRows.map((row) => row.walletAddress)
        )
          .map((wallet) => String(wallet || "").toLowerCase())
          .filter(Boolean)
      )
    );
    if (!wallets.length) return participantRows;

    let users: any[] = [];
    try {
      const projection = {
        wallet: 1,
        name: 1,
        username: 1,
        photo: 1,
        twitterData: 1,
      };
      users = await this.userModel
        .find(
          { wallet: { $in: wallets } },
          projection
        )
        .lean();
      const foundWallets = new Set(
        users.map((user) => String(user.wallet || "").toLowerCase())
      );
      const legacyWallets = wallets.filter((wallet) => !foundWallets.has(wallet));
      if (legacyWallets.length) {
        const legacyUsers = await this.userModel
          .find(
            {
              $or: legacyWallets.map((wallet) => ({
                wallet: new RegExp(`^${wallet}$`, "i"),
              })),
            },
            projection
          )
          .lean();
        users.push(...legacyUsers);
      }
    } catch {
      // User profile enrichment must not make the on-chain leaderboard unavailable.
    }
    const profileByWallet = new Map(
      users.map((user) => [
        String(user.wallet || "").toLowerCase(),
        this.publicUserProfile(user),
      ])
    );

    return wallets.map((wallet) => ({
      ...(participantByWallet.get(wallet) || { walletAddress: wallet }),
      ...(profileByWallet.get(wallet) || {}),
    }));
  }

  private publicUserProfile(user: any): {
    avatarUrl?: string;
    displayName?: string;
  } {
    return {
      avatarUrl: this.first(user?.photo, user?.twitterData?.photo),
      displayName: this.first(
        user?.name,
        user?.username,
        user?.twitterData?.name,
        user?.twitterData?.username
      ),
    };
  }

  private async similar(pool: any, context: any) {
    const categories = this.project(context, pool.launchDetails || {}).categories || [];
    const placements = await this.placementModel
      .find({
        surface: "launchpad",
        enabled: true,
        "banner.desktopUrl": { $type: "string", $ne: "" },
      })
      .sort({ featured: -1, ad: -1, sortOrder: 1, _id: 1 })
      .lean();
    const placementByPoolId = new Map(
      placements.map((placement: any) => [String(placement.launchpadPoolId), placement])
    );
    const candidates = await this.poolModel
      .find({
        _id: { $ne: pool._id, $in: placements.map((item: any) => item.launchpadPoolId) },
        publicationStatus: "published",
        status: { $in: ["active", "closed"] },
        poolId: { $type: "string", $ne: "" },
      })
      .sort({ publishedAt: -1, _id: -1 })
      .limit(12)
      .lean();
    const summaries: any[] = [];
    for (const candidate of candidates) {
      const candidateContext = await this.loadProjectContext(candidate);
      const summary = this.summary(
        candidate,
        candidateContext,
        placementByPoolId.get(String(candidate._id))
      );
      if (!categories.length || summary.project.categories.some((item: string) => categories.includes(item))) {
        summaries.push(summary);
      }
      if (summaries.length >= 4) break;
    }
    return summaries;
  }

  private summary(pool: any, context: any, placement?: any) {
    const livePool = pool.onchainState || {};
    return {
      id: String(pool._id),
      slug: pool.slug,
      status: pool.status,
      publicationStatus: pool.publicationStatus,
      lifecycle: this.lifecycle(pool, livePool),
      project: this.project(context, pool.launchDetails || {}),
      launch: this.effectiveLaunchDetails(pool.launchDetails || {}, context),
      pool: {
        poolId: pool.poolId,
        createParams: pool.createParams || {},
        onchainState: livePool,
      },
      contract: {
        chainId: pool.chainId,
        address: pool.launchpadAddress,
        explorerUrl: this.deploymentService.getDeployment().explorerUrl,
        stakingNftAddress: this.deploymentService.getDeployment().stakingNftAddress,
        nftMarketAddress: this.deploymentService.getDeployment().nftMarketAddress,
        investToken: {
          address: String(livePool.investToken || pool.createParams?.investToken || "").toLowerCase(),
          symbol: this.deploymentService.getDeployment().investTokenSymbol,
          decimals: this.deploymentService.getDeployment().investTokenDecimals,
        },
        projectToken: this.publicProjectToken(pool, livePool, {
          address: String(
            livePool.investToken || pool.createParams?.investToken || ""
          ).toLowerCase(),
          symbol: this.deploymentService.getDeployment().investTokenSymbol,
          decimals: this.deploymentService.getDeployment().investTokenDecimals,
        }),
        claimKind: this.claimKind(pool, livePool),
        sync: this.syncMetadata(pool, livePool),
      },
      placement: placement
        ? {
            surface: placement.surface,
            featured: Boolean(placement.featured),
            ad: Boolean(placement.ad),
            sortOrder: Number(placement.sortOrder || 0),
            banner: placement.banner || {},
          }
        : undefined,
    };
  }

  private lifecycle(pool: any, state: any): string {
    const closed =
      typeof state.closed === "boolean" ? state.closed : pool.status === "closed";
    if (closed) {
      if (!state.claimEnabled) return "closed_awaiting_settlement";
      const participantCount = Number(state.participantCount || 0);
      const claimedParticipantCount = Number(state.claimedParticipantCount || 0);
      return participantCount === 0 || claimedParticipantCount >= participantCount
        ? "completed"
        : "claim";
    }
    const targetAmount = BigInt(state.targetAmount || pool.createParams?.targetAmount || 0);
    const raisedAmount = BigInt(state.raisedAmount || 0);
    // targetAmount is a hard cap, not a minimum-success threshold.
    if (targetAmount > BigInt(0) && raisedAmount >= targetAmount) {
      return "ended_awaiting_close";
    }
    const now = BigInt(Math.floor(Date.now() / 1_000));
    const stakeStart = BigInt(state.stakeStart || pool.createParams?.stakeStart || 0);
    const greenStart = BigInt(state.greenStart || pool.createParams?.greenStart || 0);
    const greenEnd = BigInt(state.greenEnd || pool.createParams?.greenEnd || 0);
    const yellowSeats = BigInt(state.yellowSeats || pool.createParams?.yellowSeats || 0);
    const slotDuration = BigInt(state.yellowSlotDuration || pool.createParams?.yellowSlotDuration || 0);
    const yellowEnd = greenEnd + yellowSeats * slotDuration;
    if (now < stakeStart) return "scheduled";
    if (now < greenStart) return "staking";
    if (now < greenEnd) return "green";
    if (now < yellowEnd) return "yellow";
    return "ended_awaiting_close";
  }

  private claimKind(pool: any, state: any): "project_token" | "payment_token_refund" | null {
    if (!state.claimEnabled) return null;
    const projectToken = String(state.projectToken || "").toLowerCase();
    const investToken = String(state.investToken || pool.createParams?.investToken || "").toLowerCase();
    if (!projectToken || projectToken === ZERO_ADDRESS) return null;
    return projectToken === investToken ? "payment_token_refund" : "project_token";
  }

  private syncMetadata(pool: any, state: any) {
    const syncedAt = state.lastSyncedAt || pool.onchainState?.lastSyncedAt;
    const time = syncedAt ? new Date(syncedAt).getTime() : 0;
    return {
      asOfBlock: state.lastSyncedBlock || pool.onchainState?.lastSyncedBlock,
      syncedAt,
      stale: !time || Date.now() - time > 60_000,
    };
  }

  private publicProjectToken(
    pool: any,
    state: any,
    paymentToken: any,
    knownAddress?: string
  ): Record<string, any> | null {
    const address = String(knownAddress || state.projectToken || "").toLowerCase();
    if (!address || address === ZERO_ADDRESS) return null;
    const stored = state.projectTokenMetadata || {};
    const verified =
      String(stored.address || "").toLowerCase() === address ? stored : {};
    const isPaymentToken =
      address === String(paymentToken?.address || "").toLowerCase();
    return {
      address,
      symbol: this.first(
        verified.symbol,
        isPaymentToken ? paymentToken?.symbol : undefined,
        pool.launchDetails?.tokenDisplay?.symbol
      ),
      name: this.first(
        verified.name,
        isPaymentToken ? paymentToken?.name : undefined,
        pool.launchDetails?.tokenDisplay?.name
      ),
      decimals: this.first(
        verified.decimals,
        isPaymentToken ? paymentToken?.decimals : undefined,
        pool.launchDetails?.tokenDisplay?.decimals
      ),
    };
  }

  private nonEmptyArray(...values: any[]): any[] {
    return values.find((value) => Array.isArray(value) && value.length > 0) || [];
  }

  private asArray(value: any): any[] {
    return Array.isArray(value) ? value : [];
  }

  private asRecord(value: any): Record<string, any> {
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : {};
  }

  private first(...values: any[]): any {
    return values.find((value) => value !== undefined && value !== null && String(value).trim() !== "");
  }

  private hasAnalysisFlags(value: any): boolean {
    return [value?.green, value?.yellow, value?.red].some(
      (items) => Array.isArray(items) && items.length > 0
    );
  }

  private dedupePeople(items: any[]): any[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = String(item?.id || item?.name || "").trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private normalizePeople(
    items: any[],
    kind: "investor" | "team"
  ): Array<Record<string, any>> {
    return items
      .map((item: any) => {
        const value = typeof item === "string" ? { name: item } : item || {};
        const name = this.first(value.name, value.fullName, value.title);
        if (!name) return undefined;
        const image = this.first(
          value.logoUrl,
          value.avatarUrl,
          value.logo,
          value.avatar,
          value.image,
          value.img,
          value.photo,
          value.details?.logoUrl,
          value.details?.avatarUrl,
          value.details?.logo
        );
        const normalized: Record<string, any> = {
          id: this.first(value.id, value._id, value.slug, value.details?.id),
          name,
          website: this.first(value.website, value.url, value.href),
        };
        if (kind === "team") {
          normalized.role = this.first(value.role, value.position, value.jobTitle);
          normalized.avatarUrl = image;
        } else {
          normalized.logoUrl = image;
        }
        return normalized;
      })
      .filter(Boolean) as Array<Record<string, any>>;
  }
}
